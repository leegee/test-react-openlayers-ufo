import type { IncomingMessage, ServerResponse } from 'http';
import { PassThrough } from 'stream';
import type { FeatureCollection } from 'geojson';
import { parse } from 'url';

import { FeatureSourceAttributeType, isFeatureSourceAttributeType, MapDictionaryType, QueryParamsType, QueryResponseType, SqlBitsType } from '@ufo-monorepo/common-types';
import config from '@ufo-monorepo/config';
import { logger } from '@ufo-monorepo/logger';
import { pool, finaliseDbh } from '@ufo-monorepo/dbh';

import { listToCsvLine } from './lib/csv.js';
import { CustomError } from './lib/CustomError.js';

let DBH = pool;

export async function search(req: IncomingMessage, res: ServerResponse) {
    const userArgs: QueryParamsType | null = getCleanArgs(req);

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

    const acceptHeader = req.headers.accept || '';

    return acceptHeader.includes('text/csv') ? searchCsv(res, userArgs) : searchGeoJson(req, res, userArgs);
}


async function searchCsv(res: ServerResponse, userArgs: QueryParamsType) {
    let sqlBits = constructSqlBits(userArgs);
    const sql = `SELECT * FROM sightings WHERE ${sqlBits.whereColumns.join(' AND ')}`;
    await sendCsvResponse(res, sql, sqlBits);
}


async function searchGeoJson(_req: IncomingMessage, res: ServerResponse, userArgs: QueryParamsType) {
    const body: QueryResponseType = {
        msg: '',
        status: 200,
        dictionary: {} as MapDictionaryType,
        results: undefined,
    };

    res.statusCode = 200;
    res.statusMessage = 'OK';
    res.setHeader('Content-type', 'application/json; charset=uft-8')

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

        const { rows } = await DBH.query(sql, sqlBits.whereParams ? sqlBits.whereParams : undefined);
        if (rows[0].jsonb_build_object.features === null && config.api.debug) {
            logger.warn({ action: 'query', msg: 'Found no features', sql, sqlBits });
        }
        body.results = rows[0].jsonb_build_object as FeatureCollection;
        body.dictionary = await getDictionary(body.results, sqlBits);
        res.write(JSON.stringify(body));
    }
    catch (e) {
        res.statusCode = 500;
        res.statusMessage = 'NOK';
        throw new CustomError({
            action: 'query',
            details: JSON.stringify(forErrorReporting, null, 2),
            error: e as Error
        });
    }
    finally {
        res.end();
        finaliseDbh();
    }
}

async function sendCsvResponse(res: ServerResponse, sql: string, sqlBits: SqlBitsType) {
    try {
        const results = await DBH.query(sql, sqlBits.whereParams ? sqlBits.whereParams : undefined);

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="ufo-sightings.csv"`);

        // Initialize a PassThrough stream for the response body
        const bodyStream = new PassThrough();

        // Pipe the response body stream to the HTTP response
        bodyStream.pipe(res);

        // Write CSV data to the response body stream
        let firstLine = true;
        for (const row of results.rows) {
            if (firstLine) {
                listToCsvLine(Object.keys(row), bodyStream);
                firstLine = false;
            }
            listToCsvLine(Object.values(row), bodyStream);
        }

        // End the response body stream
        bodyStream.end();
    } catch (error) {
        logger.error('Error handling request:', error);
        res.statusCode = 500;
        res.end('Internal server error');
    }
}

function constructSqlBits(userArgs: QueryParamsType): SqlBitsType {
    const whereColumns: string[] = [];
    const selectColumns = [
        'id', 'location_text', 'address', 'report_text', 'datetime', 'point', 'duration_seconds',
    ];
    const whereParams: string[] = [];
    const orderByClause: string[] = [];

    whereColumns.push(`(point && ST_Transform(ST_MakeEnvelope($${whereParams.length + 1}, $${whereParams.length + 2}, $${whereParams.length + 3}, $${whereParams.length + 4}, 4326), 3857))`);

    whereParams.push(
        String(userArgs.minlng), String(userArgs.minlat), String(userArgs.maxlng), String(userArgs.maxlat)
    );

    if (userArgs.q !== undefined && userArgs.q !== '') {
        // Split the search parameter into individual words
        const searchWords = userArgs.q.split(' ');

        const searchConditions = searchWords.map(
            (_word: string, index: number) => `(location_text ILIKE $${whereParams.length + index + 1} OR report_text ILIKE $${whereParams.length + index + 1})`
        ).join(' AND ');

        // Push the search conditions and parameters
        searchWords.forEach((word: string) => whereParams.push(`%${word}%`));
        whereColumns.push(`(${searchConditions})`);

        // Construct the SELECT clause to calculate search score for each word
        selectColumns.push(
            `(
            COALESCE(similarity(location_text, $${whereParams.length}), 0.001) 
            +
            COALESCE(similarity(report_text, $${whereParams.length}), 0.001)
            ) / 2 AS search_score`
        );

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
        logger.warn({ action: 'getDictionary', warning: 'no features', featureCollection });
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

function getCleanArgs(req: IncomingMessage) {

    const url = req.url || '';
    const { query } = parse(url, true);
    const userArgs: QueryParamsType = {
        zoom: parseInt(query.zoom as string),
        minlng: parseFloat(query.minlng as string),
        minlat: parseFloat(query.minlat as string),
        maxlng: parseFloat(query.maxlng as string),
        maxlat: parseFloat(query.maxlat as string),

        to_date: query.to_date ? (Array.isArray(query.to_date) ? query.to_date[0] : query.to_date) : undefined,
        from_date: query.from_date ? (Array.isArray(query.from_date) ? query.from_date[0] : query.from_date) : undefined,

        // Potentially the subject of a text search:
        q: query.q ? String(query.q).trim() : undefined,

        // Potentially the subject of the text search: undefined = search all cols defined in config.api.searchableTextColumnNames
        // Not yet implemented.
        q_subject: query.q_subject && [config.api.searchableTextColumnNames].includes(
            query.q_subject instanceof Array ? query.q_subject : [query.q_subject]
        ) ? String(query.q_subject) : undefined,

        sort_order: String(query.sort_order) === 'ASC' || String(query.sort_order) === 'DESC' ? String(query.sort_order) as 'ASC' | 'DESC' : undefined,

        ... (
            isFeatureSourceAttributeType(query.source)
                ? { source: query.source as FeatureSourceAttributeType }
                : {}
        )
    };

    if (query.source)

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
    return `SELECT jsonb_build_object(
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
        ) AS fc` ;
}


function geoJsonForClusters(sqlBits: SqlBitsType, _userArgs: QueryParamsType) {
    // For cluster boudnaries
    // const eps = epsFromZoom(userArgs.zoom);

    // For heatmaps
    const eps = 1000 * 10;

    return `SELECT jsonb_build_object(
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
        `;
}


export default search;
