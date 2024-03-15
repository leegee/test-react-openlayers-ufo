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

    const q: QueryParams = {
        minlng: parseFloat(ctx.request.query.minlng as string),
        minlat: parseFloat(ctx.request.query.minlat as string),
        maxlng: parseFloat(ctx.request.query.maxlng as string),
        maxlat: parseFloat(ctx.request.query.maxlat as string),
        to_date: ctx.request.query.to_date ? (Array.isArray(ctx.request.query.to_date) ? ctx.request.query.to_date[0] : ctx.request.query.to_date) : undefined,
        from_date: ctx.request.query.from_date ? (Array.isArray(ctx.request.query.from_date) ? ctx.request.query.from_date[0] : ctx.request.query.from_date) : undefined,
        show_undated: ctx.request.query.show_undated === 'true',
        show_invalid_dates: ctx.request.query.show_invalid_dates === 'true',
    };

    if (q.from_date && Number(q.from_date) < 1000) {
        q.from_date = formatDateString(q.from_date);
    }

    if (q.to_date && Number(q.to_date) < 1000) {
        q.to_date = formatDateString(q.to_date);
    }

    if (q !== null && q.minlat !== undefined && q.minlng !== undefined && q.maxlat !== undefined && q.maxlng !== undefined) {
        try {
            const { whereClause, values } = where(q);
            const sql = geoJsonFor(
                'SELECT location_text, address, report_text, datetime, datetime_invalid, datetime_original, point FROM sightings',
                whereClause
            );

            const { rows } = await pool.query(sql, values ? values : undefined);

            if (rows[0].jsonb_build_object.features === null) {
                console.warn({ msg: 'features===null', sql, values });
            }

            body.results = rows[0].jsonb_build_object as FeatureCollection;
            body.dictionary = await getDictionary(body.results);
        }
        catch (e) {
            console.debug(e);
            body.status = 500;
            body.msg = new String(e);
        }
    }

    else {
        body.status = 400;
        body.msg = 'Missing request parameters in ' + JSON.stringify(q);
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

function where(q: QueryParams) {
    const clauses = [];
    const values = [];

    if (q.from_date !== undefined && q.to_date !== undefined) {
        console.log(q);
        clauses.push("(datetime BETWEEN $1 AND $2)");
        values.push(q.from_date + "-01-01 00:00:00", q.to_date + "-12-31 23:59:59");
    }
    if (!q.show_undated) {
        clauses.push("datetime IS NOT NULL");
    }
    if (!q.show_invalid_dates) {
        clauses.push("datetime_invalid IS NOT true");
    }

    clauses.push(`point && ST_Transform(ST_MakeEnvelope($${values.length + 1}, $${values.length + 2}, $${values.length + 3}, $${values.length + 4}, 4326), 3857)`);
    values.push(q.minlng, q.minlat, q.maxlng, q.maxlat);

    return clauses.length ? {
        whereClause: ' WHERE ' + clauses.join(' AND '),
        values: values
    } : {
        whereClause: '',
        values: undefined
    };
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
