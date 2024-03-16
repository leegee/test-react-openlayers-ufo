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

    if (userArgs.from_date && Number(userArgs.from_date) === 1) {
        delete userArgs.from_date;
    }
    if (userArgs.to_date && Number(userArgs.to_date) === 1) {
        delete userArgs.to_date;
    }

    if (userArgs !== null && userArgs.minlat !== undefined && userArgs.minlng !== undefined && userArgs.maxlat !== undefined && userArgs.maxlng !== undefined) {
        let forErrorReporting = {};

        try {
            const { whereClause, whereParams, selectClause } = where(userArgs);
            const sql = geoJsonFor(
                `SELECT
                location_text, address, report_text, datetime, datetime_invalid, datetime_original, point
                ${selectClause} 
                FROM sightings`,
                whereClause
            );

            const formattedQuery = sql.replace(/\$(\d+)/g, (_, index) => {
                const param = whereParams ? whereParams[index - 1] : undefined;
                return typeof param === 'string' ? `'${param}'` : param;
            });

            forErrorReporting = { sql, selectClause, whereClause, whereParams, formattedQuery };

            const { rows } = await pool.query(sql, whereParams ? whereParams : undefined);

            if (rows[0].jsonb_build_object.features === null) {
                console.warn({ msg: 'features===null', sql, whereParams });
            }

            body.results = rows[0].jsonb_build_object as FeatureCollection;
            body.dictionary = await getDictionary(body.results);
        }
        catch (e) {
            console.error(e, forErrorReporting);
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
    const selectClauses: String[] = ['id'];
    const whereParams = [];
    const orderBy = [];

    if (userArgs.from_date !== undefined && userArgs.to_date !== undefined) {
        whereClauses.push(
            `(datetime BETWEEN $${whereParams.length + 1} AND $${whereParams.length + 2})`
        );
        whereParams.push(
            userArgs.from_date + " 01-01 00:00:00",
            userArgs.to_date + " 12-31 23:59:59"
        );
    }
    else if (userArgs.from_date !== undefined) {
        whereClauses.push(`(datetime >= ${whereParams.length + 1})`);
        whereParams.push(userArgs.from_date + " 01-01 00:00:00");
    }
    else if (userArgs.to_date !== undefined) {
        whereClauses.push(`(datetime <= $${whereParams.length + 1})`);
        whereParams.push(userArgs.to_date + " 12-31 23:59:59");
    }
    else if (!userArgs.show_undated) {
        whereClauses.push("(datetime IS NOT NULL)");
    }

    // if (!userArgs.show_invalid_dates) {
    //     whereClauses.push("datetime_invalid IS NOT true");
    // }

    if (userArgs.q !== undefined && userArgs.q !== '') {
        whereClauses.push(`(
            location_text ILIKE $${whereParams.length + 1}
          OR report_text ILIKE $${whereParams.length + 1}
        )`);
        selectClauses.push(
            `similarity(location_text, $${whereParams.length + 1}) AS location_text_score`,
            `similarity(report_text, $${whereParams.length + 1}) AS report_text_score`
        );
        whereParams.push(userArgs.q + '%');
        orderBy.push('location_text_score DESC, report_text_score DESC');
    }

    whereClauses.push(`(point && ST_Transform(ST_MakeEnvelope($${whereParams.length + 1}, $${whereParams.length + 2}, $${whereParams.length + 3}, $${whereParams.length + 4}, 4326), 3857))`);
    whereParams.push(userArgs.minlng, userArgs.minlat, userArgs.maxlng, userArgs.maxlat);

    const rv: {
        whereClause: string,
        selectClause: string,
        orderBy: string,
        whereParams: any[] | undefined,
    } = {
        whereClause: '',
        whereParams: undefined,
        selectClause: '',
        orderBy: '',
    };

    if (whereClauses.length) {
        rv.whereClause = ' WHERE ' + whereClauses.join(' AND ');
        rv.whereParams = whereParams;
    }

    if (selectClauses.length) {
        rv.selectClause = ', ' + selectClauses.join(', ');
    }

    if (orderBy.length) {
        rv.orderBy = ' ORDER BY ' + orderBy.join(',');
    }

    return rv;
}

async function getDictionary(featureCollection: FeatureCollection | undefined) {
    const dictionary: MapDictionary = {
        datetime: {
            min: undefined,
            max: undefined,
        },
    };

    let min = undefined;
    let max = undefined;

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
        min: typeof min !== 'undefined' && min !== '0001-01-01T00:00:00' ? new Date(min).getFullYear() : undefined,
        max: typeof max !== 'undefined' && max !== '0001-01-01T00:00:00' ? new Date(max).getFullYear() : undefined,
    };

    return dictionary;
}

