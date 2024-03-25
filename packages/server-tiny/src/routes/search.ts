import { PassThrough, Writable } from 'stream';
import { Context } from 'koa';
import type { FeatureCollection } from 'geojson';
import { ParsedUrlQuery } from "querystring";

import { MapDictionary, QueryParams, QueryResponseType } from '@ufo-monorepo-test/common-types/src';
import config from '@ufo-monorepo-test/config/src';
import { CustomError } from '../middleware/errors';
import { listToCsvLine } from '../lib/csv';

type SqlBitsType = {
    selectColumns: string[],
    whereColumns: string[],
    whereParams: string[],
    orderByClause?: string[],
};

export async function search(ctx: Context) {
    const body: QueryResponseType = {
        msg: '',
        status: 200,
        dictionary: {} as MapDictionary,
        results: undefined,
    };

    const userArgs: QueryParams | null = getCleanArgs(ctx.request.query);

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

    let forErrorReporting = {};

    const acceptHeader = ctx.headers.accept || '';
    const sendCsv = acceptHeader.includes('text/csv')

    try {
        let sql: string;
        let sqlBits = constructSqlBits(userArgs);

        if (sendCsv) {
            ctx.type = 'text/csv';
            sql = `SELECT * FROM sightings WHERE ${sqlBits.whereColumns.join(' AND ')}`;
        }
        else if (userArgs.q || userArgs.zoom >= config.zoomLevelForPoints) {
            sql = geoJsonForPoints(sqlBits);
        }
        else {
            sql = geoJsonForClusters(sqlBits);
        }

        const formattedQueryForLogging = sql.replace(/\$(\d+)/g, (_: string, index: number) => {
            const param = sqlBits.whereParams ? sqlBits.whereParams[index - 1] : undefined;
            return typeof param === 'string' ? `'${param}'` : '';
        });

        console.log(formattedQueryForLogging);

        forErrorReporting = { sql, sqlBits, formattedQuery: formattedQueryForLogging, userArgs };

        if (sendCsv) {
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

        else {
            const { rows } = await ctx.dbh.query(sql, sqlBits.whereParams ? sqlBits.whereParams : undefined);
            if (rows[0].jsonb_build_object.features === null && config.api.debug) {
                console.warn({ action: 'query', msg: 'Found no features', sql, sqlBits });
            }
            body.results = rows[0].jsonb_build_object as FeatureCollection;
            body.dictionary = await getDictionary(body.results);
            ctx.body = JSON.stringify(body);
        }
    }
    catch (e) {
        throw new CustomError({
            action: 'query',
            details: JSON.stringify(forErrorReporting, null, 2),
            error: e as Error
        });
    }

}

function constructSqlBits(userArgs: QueryParams): SqlBitsType {
    const whereColumns: string[] = [];
    const selectColumns = [
        'id', 'location_text', 'address', 'report_text', 'datetime', 'datetime_invalid', 'datetime_original', 'point',
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
    else if (!userArgs.show_undated) {
        whereColumns.push("(datetime IS NOT NULL)");
        orderByClause.push('datetime ' + userArgs.sort_order);
    }

    // if (!userArgs.show_invalid_dates) {
    //     whereColumns.push("datetime_invalid IS NOT true");
    // }

    const rv: SqlBitsType = {
        selectColumns: selectColumns,
        whereColumns: whereColumns,
        whereParams: whereParams,
        orderByClause: orderByClause.length ? orderByClause : undefined,
    };

    return rv;
}

async function getDictionary(featureCollection: FeatureCollection | undefined) {
    const dictionary: MapDictionary = {
        datetime: {
            min: undefined,
            max: undefined,
        },
    };

    let min: string | undefined = undefined;
    let max: string | undefined = undefined;

    if (!featureCollection || !featureCollection.features) {
        console.warn({ action: 'getDictionary', warning: 'no features', featureCollection });
        return dictionary;
    }

    for (const feature of featureCollection.features) {
        const datetime: string | undefined = feature.properties?.datetime;

        if (typeof datetime !== 'undefined') {
            if (min === undefined || Number(datetime) < Number(min)) {
                min = datetime;
            }
            if (max === undefined || Number(datetime) > Number(max)) {
                max = datetime;
            }
        }
    }

    dictionary.datetime = {
        min: typeof min !== 'undefined' && min !== '0001-01-01T00:00:00' ? new Date(min).getFullYear() : undefined,
        max: typeof max !== 'undefined' && max !== '0001-01-01T00:00:00' ? new Date(max).getFullYear() : undefined,
    };

    return dictionary;
}

function getCleanArgs(args: ParsedUrlQuery) {
    const userArgs: QueryParams = {
        zoom: parseInt(args.zoom as string),
        minlng: parseFloat(args.minlng as string),
        minlat: parseFloat(args.minlat as string),
        maxlng: parseFloat(args.maxlng as string),
        maxlat: parseFloat(args.maxlat as string),

        to_date: args.to_date ? (Array.isArray(args.to_date) ? args.to_date[0] : args.to_date) : undefined,
        from_date: args.from_date ? (Array.isArray(args.from_date) ? args.from_date[0] : args.from_date) : undefined,

        show_undated: args.show_undated === 'true',
        show_invalid_dates: args.show_invalid_dates === 'true',

        // Potentially the subject of a text search:
        q: args.q ? String(args.q).trim() : undefined,

        // Potentially the subject of the text search: undefined = search all cols defined in config.api.searchableTextColumnNames
        // Not yet implemented.
        q_subject: args.q_subject && [config.api.searchableTextColumnNames].includes(
            args.q_subject instanceof Array ? args.q_subject : [args.q_subject]
        ) ? String(args.q_subject) : undefined,

        sort_order: String(args.sort_order) === 'ASC' || String(args.sort_order) === 'DESC' ? String(args.sort_order) as 'ASC' | 'DESC' : undefined,
    };

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
    ) AS fc
        `;
}

function geoJsonForClusters(sqlBits: SqlBitsType) {
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
            'geometry', ST_AsGeoJSON(s.cluster_geom, 3857):: jsonb,
            'properties', jsonb_build_object(
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
                        ST_ClusterDBSCAN(point, eps := ${config.gui.map.cluster_eps_metres}, minpoints := 1) OVER() AS cluster_id,
                point
                    FROM sightings
                    WHERE ${sqlBits.whereColumns.join(' AND ')}
            ) AS clustered_points
                GROUP BY cluster_id
        ) AS s
    ) AS fc `
        // `SELECT jsonb_build_object(
        //     'type', 'FeatureCollection',
        //     'features', jsonb_agg(feature),
        //     'pointsCount', 0,
        //     'clusterCount', COUNT(*)
        // )
        // FROM (
        //     SELECT jsonb_build_object(
        //         'type', 'Feature',
        //         'geometry', ST_AsGeoJSON(s.cluster_geom, 3857)::jsonb,
        //         'properties', jsonb_build_object(
        //             'cluster_id', s.cluster_id,
        //             'num_points', s.num_points
        //         )
        //     ) AS feature
        //     FROM (
        //         SELECT 
        //             cluster_id,
        //             ST_ConvexHull(ST_Collect(point)) AS cluster_geom,
        //             COUNT(*) AS num_points
        //         FROM (
        //             SELECT 
        //                 ST_ClusterDBSCAN(point, eps := ${config.gui.map.cluster_eps_metres}, minpoints := 1) OVER() AS cluster_id,
        //                 point
        //             FROM sightings
        //             WHERE ${sqlBits.whereColumns.join(' AND ')}
        //         ) AS clustered_points
        //         GROUP BY cluster_id
        //     ) AS s
        // ) AS fc;
        // `
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