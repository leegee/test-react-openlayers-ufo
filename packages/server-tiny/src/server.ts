import pg from "pg";
import Koa from "koa";
import cors from "@koa/cors";
import type { FeatureCollection } from 'geojson';

import config from '@ufo-monorepo-test/config/src';
import { MapDictionary, QueryParams } from '@ufo-monorepo-test/common-types/src';

const pool = new pg.Pool({
    user: config.db.user,
    password: config.db.password,
    host: config.db.host,
    port: Number(config.db.port),
    database: config.db.database,
});

const app = new Koa();
app.use(cors({ origin: "*" }));

app.use(async (ctx) => {
    const body = {
        msg: new String(),
        status: 200,
        dictionary: {},
        results: undefined as FeatureCollection | undefined,
    };

    const userArgs: QueryParams = {
        minlng: parseFloat(ctx.request.query.minlng as string),
        minlat: parseFloat(ctx.request.query.minlat as string),
        maxlng: parseFloat(ctx.request.query.maxlng as string),
        maxlat: parseFloat(ctx.request.query.maxlat as string),
        to_date: ctx.request.query.to_date ? (Array.isArray(ctx.request.query.to_date) ? ctx.request.query.to_date[0] : ctx.request.query.to_date) : undefined,
        from_date: ctx.request.query.from_date ? (Array.isArray(ctx.request.query.from_date) ? ctx.request.query.from_date[0] : ctx.request.query.from_date) : undefined,
        show_undated: ctx.request.query.show_undated === 'true',
        show_invalid_dates: ctx.request.query.show_invalid_dates === 'true',
        q: ctx.request.query.q ? String(ctx.request.query.q).trim() : undefined,
    };

    if (userArgs.from_date && Number(userArgs.from_date) < 1000) {
        userArgs.from_date = formatDateString(userArgs.from_date);
    }

    if (userArgs.to_date && Number(userArgs.to_date) < 1000) {
        userArgs.to_date = formatDateString(userArgs.to_date);
    }

    if (userArgs !== null && userArgs.minlat !== undefined && userArgs.minlng !== undefined && userArgs.maxlat !== undefined && userArgs.maxlng !== undefined) {
        try {
            const { whereClause, whereValues, selectClause } = where(userArgs);
            const sql = geoJsonFor(
                `SELECT
                location_text, address, report_text, datetime, datetime_invalid, datetime_original, point
                ${selectClause} 
                FROM sightings`,
                whereClause
            );

            console.debug('BEFORE', { q: userArgs, sql, whereValues });

            const { rows } = await pool.query(sql, whereValues ? whereValues : undefined);

            if (rows[0].jsonb_build_object.features === null) {
                console.warn({ msg: 'features===null', sql, whereValues });
            }

            body.results = rows[0].jsonb_build_object as FeatureCollection;
            body.dictionary = await getDictionary(body.results);
        }
        catch (e) {
            console.debug('ERROR', e);
            body.status = 500;
            body.msg = new String(e);
        }
    }

    else {
        body.status = 400;
        body.msg = 'Missing request parameters in ' + JSON.stringify(userArgs);
    }

    ctx.body = JSON.stringify(body);
});

console.debug("Listening on", config.api.port, "\n", JSON.stringify(config, null, 4));

app.listen(config.api.port);


function geoJsonFor(selectClause: string, whereClause: string) {
    return `SELECT jsonb_build_object(
        'type', 'FeatureCollection',
        'features', jsonb_agg(feature)
    ) 
    FROM (
        SELECT jsonb_build_object(
            'type', 'Feature',
            'geometry', ST_AsGeoJSON(s.point, 3857)::jsonb,
            'properties', to_jsonb(s) - 'point'
        ) AS feature
        FROM (
            ${selectClause}
            ${whereClause}
        ) AS s
    ) AS fc`;
}

function where(userArgs: QueryParams) {
    const whereClauses: String[] = [];
    const selectClauses: String[] = [];
    const whereValues = [];

    // if (userArgs.from_date !== undefined && userArgs.to_date !== undefined) {
    //     console.log(userArgs);
    //     whereClauses.push(`(datetime BETWEEN $${whereValues.length + 1} AND $${whereValues.length + 2})`);
    //     whereValues.push(userArgs.from_date + "-01-01 00:00:00", userArgs.to_date + "-12-31 23:59:59");
    // }

    // if (!userArgs.show_undated) {
    //     whereClauses.push("datetime IS NOT NULL");
    // }
    // if (!userArgs.show_invalid_dates) {
    //     whereClauses.push("datetime_invalid IS NOT true");
    // }

    if (userArgs.q !== undefined) {
        whereClauses.push(`
            (to_tsvector('norwegian', report_text) @@ to_tsquery('norwegian', $${whereValues.length + 1})
            OR to_tsvector('english', report_text) @@ to_tsquery('english', $${whereValues.length + 1})
            ) OR location_text ILIKE $${whereValues.length + 2}
        `);
        whereValues.push(userArgs.q);
        whereValues.push('%' + userArgs.q + '%');
        selectClauses.push(`
            CASE
                WHEN to_tsvector('norwegian', report_text) @@ to_tsquery('norwegian', $1) THEN 1
                WHEN to_tsvector('english', report_text) @@ to_tsquery('english', $1) THEN 1
                ELSE 0
            END AS report_match,
            CASE
                WHEN location_text ILIKE $2 THEN 1
                ELSE 0
            END AS location_match
        `);
    }

    whereClauses.push(`point && ST_Transform(ST_MakeEnvelope($${whereValues.length + 1}, $${whereValues.length + 2}, $${whereValues.length + 3}, $${whereValues.length + 4}, 4326), 3857)`);
    whereValues.push(userArgs.minlng, userArgs.minlat, userArgs.maxlng, userArgs.maxlat);

    const rv: {
        whereClause: string,
        selectClause: string,
        whereValues: undefined | any[]
    } = {
        whereClause: '',
        whereValues: undefined,
        selectClause: '',
    };

    if (whereClauses.length) {
        rv.whereClause = ' WHERE ' + whereClauses.join(' AND ');
        rv.whereValues = whereValues;
    }

    if (selectClauses.length) {
        rv.selectClause = ', ' + selectClauses.join(', ');
    }

    return rv;
}

async function getDictionary(featureCollection: FeatureCollection | undefined) {
    const dictionary: MapDictionary = {
        datetime: {
            min: 1,
            max: 1,
        },
    };

    let min = '1';
    let max = '1';

    if (!featureCollection || !featureCollection.features) {
        console.warn({ action: 'getDictionary', warning: 'no features', featureCollection });
        return dictionary;
    }

    for (const feature of featureCollection.features) {
        const datetime: string | undefined = feature.properties?.datetime;

        if (datetime) {
            if (min === undefined || datetime < min) {
                min = datetime;
            }
            if (max === undefined || datetime > max) {
                max = datetime;
            }
        }
    }

    dictionary.datetime = {
        min: min === '1' ? 0 : new Date(min).getFullYear(),
        max: new Date(max).getFullYear() + 1,
    };

    console.debug(dictionary);

    return dictionary;
}

function formatDateString(dateString: string) {
    return String(dateString).padStart(4, '0');
}
