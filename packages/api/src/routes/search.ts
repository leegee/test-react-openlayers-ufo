import { PassThrough } from 'stream';
import type { Context } from 'koa';
import type { FeatureCollection } from 'geojson';
import type { ParsedUrlQuery } from "querystring";

import { FeatureSourceAttributeType,  isFeatureSourceAttributeType, MapDictionaryType, QueryParamsType, QueryResponseType, SqlBitsType } from '@ufo-monorepo-test/common-types';
import config from '@ufo-monorepo-test/config';
import { CustomError } from '../middleware/errors';
import { listToCsvLine } from '../lib/csv';


// const epsMapping = [
//     200000,
//     200000,
//     200000,
//     160000,
//     90000,
//     25000,
//     10000,
//     7000,
//     5000,
// ];

export async function search(ctx: Context) {
    const userArgs: QueryParamsType | null = getCleanArgs(ctx.request.query);

    if (!userArgs) {
        throw new CustomError({
            action: 'query',
            msg: 'Missing request parameters',
            details: userArgs
        })
    }

    if (userArgs.q && userArgs.q.length < config.minQLength) {
        throw new CustomError({
            action: 'query',
            msg: 'Text query too short',
            details: { q: userArgs.q }
        });
    }

    const acceptHeader = ctx.headers.accept || '';

    return acceptHeader.includes('text/csv') ? searchCsv(ctx, userArgs) : searchJson(ctx, userArgs);
}

async function searchCsv(ctx: Context, userArgs: QueryParamsType) {
    let sqlBits = constructSqlBits(userArgs);
    const sql = `SELECT * FROM sightings WHERE ${sqlBits.whereColumns.join(' AND ')}`;
    await sendCsvResponse(ctx, sql, sqlBits);
}

async function searchJson(ctx: Context, userArgs: QueryParamsType){
    const body: QueryResponseType = {
        msg: '',
        status: 200,
        dictionary: {} as MapDictionaryType,
        results: undefined,
    };

    let forErrorReporting = {};

    try {
        let sql: string;
        let sqlBits = constructSqlBits(userArgs);

         if (userArgs.zoom >= config.zoomLevelForPoints) {
            sql = geoJsonForPoints(sqlBits);
        }
        else {
            sql = geoJsonForClusters(sqlBits, userArgs);
        }

        const formattedQueryForLogging = sql.replace(/\$(\d+)/g, (_: string, index: number) => {
            const param = sqlBits.whereParams ? sqlBits.whereParams[index - 1] : undefined;
            return typeof param === 'string' ? `'${param}'` : '';
        });

        forErrorReporting = { sql, sqlBits, formattedQuery: formattedQueryForLogging, userArgs };

        const { rows } = await ctx.dbh.query(sql, sqlBits.whereParams ? sqlBits.whereParams : undefined);
        if (rows[0].jsonb_build_object.features === null && config.api.debug) {
            console.warn({ action: 'query', msg: 'Found no features', sql, sqlBits });
        }
        body.results = rows[0].jsonb_build_object as FeatureCollection;
        body.dictionary = await getDictionary(body.results, sqlBits);
        ctx.body = JSON.stringify(body);
    }
    catch (e) {
        throw new CustomError({
            action: 'query',
            details: JSON.stringify(forErrorReporting, null, 2),
            error: e as Error
        });
    }
}

async function sendCsvResponse(ctx: Context, sql: string, sqlBits: SqlBitsType) {
    ctx.type = 'text/csv';
    ctx.attachment('ufo-sightings.csv');

    const results = await ctx.dbh.query(sql, sqlBits.whereParams ? sqlBits.whereParams : undefined);
    type ResponseBody = PassThrough | string | Buffer | NodeJS.WritableStream | null;
    let bodyStream: ResponseBody = ctx.body as ResponseBody;
    if (!bodyStream || typeof bodyStream === 'string' || Buffer.isBuffer(bodyStream)) {
        bodyStream = new PassThrough();
        ctx.body = bodyStream;
    }

    // Should enforce order. Map?
    let firstLine = true;
    for (const row of results.rows) {
        if (firstLine) {
            listToCsvLine(Object.keys(row), bodyStream);
            firstLine = false;
        }
        listToCsvLine(Object.values(row), bodyStream);
    }

    bodyStream.end();
}

function constructSqlBits(userArgs: QueryParamsType): SqlBitsType {
    const whereColumns: string[] = [];
    const selectColumns = [
        'id', 'location_text', 'address', 'report_text', 'datetime', 'point', 'duration_seconds',
    ];
    const whereParams: string[] = [];
    const orderByClause: string[] = [];

    if (config.db.engine === 'postgis') {
        whereColumns.push(`(point && ST_Transform(ST_MakeEnvelope($${whereParams.length + 1}, $${whereParams.length + 2}, $${whereParams.length + 3}, $${whereParams.length + 4}, 4326), 3857))`);
    } else {
        whereColumns.push(`MBRIntersects(
            point, 
            ST_Envelope(LineString(
                PointFromWKB( Point($${whereParams.length + 1}, $${whereParams.length + 2}) ), 
                PointFromWKB( Point($${whereParams.length + 3}, $${whereParams.length + 4}) )
            ))
        )`);
    }

    whereParams.push(
        String(userArgs.minlng), String(userArgs.minlat), String(userArgs.maxlng), String(userArgs.maxlat)
    );

    if (userArgs.q !== undefined && userArgs.q !== '') {
        // Split the search parameter into individual words
        const searchWords = userArgs.q.split(' ');

        const searchConditions = searchWords.map(
            (_word, index) => `(location_text ILIKE $${whereParams.length + index + 1} OR report_text ILIKE $${whereParams.length + index + 1})`
        ).join(' AND ');

        // Push the search conditions and parameters
        searchWords.forEach(word => whereParams.push(`%${word}%`));
        whereColumns.push(`(${searchConditions})`);

        // Construct the SELECT clause to calculate search score for each word
        if (config.db.engine === 'postgis') {
            selectColumns.push(`(
                COALESCE(similarity(location_text, $${whereParams.length}), 0.001) 
                +
                COALESCE(similarity(report_text, $${whereParams.length}), 0.001)
                ) / 2 AS search_score`);
        } else {
            selectColumns.push(`( (
                GREATEST(similarity(location_text, $${whereParams.length}), 0.001) 
                + 
                GREATEST(similarity(report_text, $${whereParams.length}), 0.001)
            ) / 2 ) AS search_score` );
        }

        // Always sort best-match first
        orderByClause.push('search_score DESC')
    }

    if (userArgs.from_date !== undefined && userArgs.to_date !== undefined) {
        whereColumns.push(
            `(datetime BETWEEN $${whereParams.length + 1} AND $${whereParams.length + 2})`
        );
        whereParams.push(
            userArgs.from_date,
            userArgs.to_date
        );
        orderByClause.push('datetime ' + userArgs.sort_order);
    }
    else if (userArgs.from_date !== undefined) {
        whereColumns.push(`(datetime >= $${whereParams.length + 1})`);
        whereParams.push(userArgs.from_date);
        orderByClause.push('datetime ' + userArgs.sort_order);
    }
    else if (userArgs.to_date !== undefined) {
        whereColumns.push(`(datetime <= $${whereParams.length + 1})`);
        whereParams.push(userArgs.to_date);
        orderByClause.push('datetime ' + userArgs.sort_order);
    }

    if (config.db.database === 'ufo') {
        selectColumns.push('shape', 'duration_seconds', 'rgb', 'colour', 'source');
        if (userArgs.source && userArgs.source !== 'not-specified') {
            whereColumns.push(`(source=$${whereParams.length + 1})`);
            whereParams.push(userArgs.source);
        }
    }

    const rv: SqlBitsType = {
        selectColumns: selectColumns,
        whereColumns: whereColumns,
        whereParams: whereParams,
        orderByClause: orderByClause.length ? orderByClause : undefined,
    };

    return rv;
}

async function getDictionary(featureCollection: FeatureCollection | undefined, sqlBits: SqlBitsType) {
    const dictionary: MapDictionaryType = {
        datetime: {
            min: undefined,
            max: undefined,
        },
        selected_columns: sqlBits.selectColumns,
    };

    let min: Date | undefined = undefined;
    let max: Date | undefined = undefined;

    if (!featureCollection || !featureCollection.features) {
        console.warn({ action: 'getDictionary', warning: 'no features', featureCollection });
        return dictionary;
    }

    for (const feature of featureCollection.features) {
        let thisDatetime: Date | undefined;

        try {
            thisDatetime = new Date(feature.properties?.datetime);
        } catch (e) {
            thisDatetime = undefined;
        }

        if (typeof thisDatetime !== 'undefined') {
            if (typeof min === 'undefined' || thisDatetime.getTime() < min.getTime()) {
                min = thisDatetime;
            }
            if (typeof max === 'undefined' || thisDatetime.getTime() > max.getTime()) {
                max = thisDatetime;
            }
        }
    }

    dictionary.datetime = {
        min: typeof min !== 'undefined' ? new Date(min).getFullYear() : undefined,
        max: typeof max !== 'undefined' ? new Date(max).getFullYear() : undefined,
    };

    return dictionary;
}

function getCleanArgs(args: ParsedUrlQuery) {
    const userArgs: QueryParamsType = {
        zoom: parseInt(args.zoom as string),
        minlng: parseFloat(args.minlng as string),
        minlat: parseFloat(args.minlat as string),
        maxlng: parseFloat(args.maxlng as string),
        maxlat: parseFloat(args.maxlat as string),

        to_date: args.to_date ? (Array.isArray(args.to_date) ? args.to_date[0] : args.to_date) : undefined,
        from_date: args.from_date ? (Array.isArray(args.from_date) ? args.from_date[0] : args.from_date) : undefined,

        // Potentially the subject of a text search:
        q: args.q ? String(args.q).trim() : undefined,

        // Potentially the subject of the text search: undefined = search all cols defined in config.api.searchableTextColumnNames
        // Not yet implemented.
        q_subject: args.q_subject && [config.api.searchableTextColumnNames].includes(
            args.q_subject instanceof Array ? args.q_subject : [args.q_subject]
        ) ? String(args.q_subject) : undefined,

        sort_order: String(args.sort_order) === 'ASC' || String(args.sort_order) === 'DESC' ? String(args.sort_order) as 'ASC' | 'DESC' : undefined,

        ... (
            isFeatureSourceAttributeType(args.source)
                ? { source: args.source as FeatureSourceAttributeType }
                : {}
        )
    };

    if (args.source)

        if (userArgs.from_date && Number(userArgs.from_date) === 1) {
            delete userArgs.from_date;
        }
    if (userArgs.to_date && Number(userArgs.to_date) === 1) {
        delete userArgs.to_date;
    }

    if (userArgs.from_date) {
        userArgs.from_date = new Date(userArgs.from_date + " 01-01 00:00:00").toISOString();
    }
    if (userArgs.to_date) {
        userArgs.to_date = new Date(userArgs.to_date + " 12-31 23:59:59").toISOString();
    }

    if (!userArgs.sort_order) {
        userArgs.sort_order = 'DESC';
    }

    return (
        userArgs !== null &&
        userArgs.minlat !== undefined && userArgs.minlng !== undefined &&
        userArgs.maxlat !== undefined && userArgs.maxlng !== undefined
    ) ? userArgs : null;
}


function geoJsonForPoints(sqlBits: SqlBitsType) {
    return config.db.engine === 'postgis' ?
        `SELECT jsonb_build_object(
            'type', 'FeatureCollection',
            'features', jsonb_agg(feature),
            'pointsCount', COUNT(*),
            'clusterCount', 0
        )
        FROM (
            SELECT jsonb_build_object(
                'type', 'Feature',
                'geometry', ST_AsGeoJSON(s.point, 3857)::jsonb,
                'properties', to_jsonb(s) - 'point'
            ) AS feature
            FROM (
                SELECT ${sqlBits.selectColumns.join(', ')} FROM sightings
                WHERE ${sqlBits.whereColumns.join(' AND ')}
                ${sqlBits.orderByClause ? ' ORDER BY ' + sqlBits.orderByClause.join(',') : ''}
            ) AS s
        ) AS fc`
        :
        `SELECT JSON_OBJECT(
                'type', 'FeatureCollection',
                'features', JSON_ARRAYAGG(feature),
                'pointsCount', COUNT(*),
                'clusterCount', 0
            )
    FROM(
        SELECT JSON_OBJECT(
            'type', 'Feature',
            'geometry', ST_AsGeoJSON(s.point):: json,
            'properties', JSON_REMOVE(JSON_OBJECT('point', s.point), 'point')
        ) AS feature
            FROM(
            SELECT ${sqlBits.selectColumns.join(', ')} FROM sightings
                WHERE ${sqlBits.whereColumns.join(' AND ')}
                ${sqlBits.orderByClause ? ' ORDER BY ' + sqlBits.orderByClause.join(',') : ''}
        ) AS s
    ) AS fc`;
}


function geoJsonForClusters(sqlBits: SqlBitsType, _userArgs: QueryParamsType) {
    // For cluster boudnaries
    // const eps = epsFromZoom(userArgs.zoom);

    // For heatmaps
    const eps = 1000 * 10;

    return config.db.engine === 'postgis' ?
        `SELECT jsonb_build_object(
            'type', 'FeatureCollection',
            'features', jsonb_agg(feature),
            'pointsCount', 0,
            'clusterCount', COUNT(*)
        )
        FROM (
            SELECT jsonb_build_object(
                'type', 'Feature',
                'geometry', ST_AsGeoJSON(s.cluster_geom, 3857)::jsonb,
                'properties', jsonb_build_object(
                    'cluster_id', s.cluster_id,
                    'num_points', s.num_points
                )
            ) AS feature
            FROM (
                SELECT 
                    cluster_id,
                    ST_ConvexHull(ST_Collect(point)) AS cluster_geom,
                    COUNT(*) AS num_points
                FROM (
                    SELECT 
                        ST_ClusterDBSCAN(point, eps := ${eps}, minpoints := 1) OVER() AS cluster_id,
                        point
                    FROM sightings
                    WHERE ${sqlBits.whereColumns.join(' AND ')}
                ) AS clustered_points
                GROUP BY cluster_id
            ) AS s
        ) AS fc;
        `
        :
        `SELECT JSON_OBJECT(
        'type', 'FeatureCollection',
        'features', JSON_ARRAYAGG(feature),
        'pointsCount', 0,
        'clusterCount', COUNT(*)
    )
    FROM(
        SELECT JSON_OBJECT(
            'type', 'Feature',
            'geometry', ST_AsGeoJSON(s.cluster_geom):: json,
            'properties', JSON_OBJECT(
                'cluster_id', s.cluster_id,
                'num_points', s.num_points
            )
        ) AS feature
            FROM(
            SELECT 
                    cluster_id,
            ST_Centroid(ST_Collect(point)) AS cluster_geom,
            COUNT(*) AS num_points
                FROM(
                SELECT 
                        ST_ClusterDBSCAN(point, ${config.gui.map.cluster_eps_metres}, 1) OVER() AS cluster_id,
                point
                    FROM sightings
                    WHERE ${sqlBits.whereColumns.join(' AND ')}
            ) AS clustered_points
                GROUP BY cluster_id
        ) AS s
    ) AS fc`;
}


// function epsFromZoom(zoomLevel: number): number {
//     const eps = epsMapping[Math.min(Math.max(zoomLevel - 1, 1), config.zoomLevelForPoints)];
//     console.info({ zoomLevel, eps });
//     return eps;
// }

