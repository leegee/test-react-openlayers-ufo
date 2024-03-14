import Koa from "koa";
import pg from "pg";
import cors from "@koa/cors";
import config from '@ufo-monorepo-test/config/src';

const pool = new pg.Pool({
    user: config.db.user,
    password: config.db.password,
    host: config.db.host,
    port: Number(config.db.port) || 5432,
    database: config.db.database,
});

interface QueryParams {
    minlng: number;
    minlat: number;
    maxlng: number;
    maxlat: number;
    to_date?: string;
    from_date?: string;
    show_undated?: boolean;
    show_invalid_dates?: boolean;
}

const app = new Koa();
app.use(cors({ origin: "*" }));

app.use(async (ctx) => {
    const body = {
        msg: new String(),
        status: 200,
        results: [],
    };

    const q: QueryParams = {
        minlng: parseInt(ctx.request.query.minlng as string, 10),
        minlat: parseInt(ctx.request.query.minlat as string, 10),
        maxlng: parseInt(ctx.request.query.maxlng as string, 10),
        maxlat: parseInt(ctx.request.query.maxlat as string, 10),
        to_date: ctx.request.query.to_date ? (Array.isArray(ctx.request.query.to_date) ? ctx.request.query.to_date[0] : ctx.request.query.to_date) : '',
        from_date: ctx.request.query.from_date ? (Array.isArray(ctx.request.query.from_date) ? ctx.request.query.from_date[0] : ctx.request.query.from_date) : '',
        show_undated: ctx.request.query.show_undated === 'true',
        show_invalid_dates: ctx.request.query.show_invalid_dates === 'true',
    };

    if (q !== null && q.minlat !== undefined && q.minlng !== undefined && q.maxlat !== undefined && q.maxlng !== undefined) {
        try {
            const { whereClause, values } = where(q);

            let sql = `SELECT jsonb_build_object(
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
                    SELECT location_text, address, report_text, datetime, datetime_invalid, datetime_original,
                    point
                    FROM sightings
                    ${whereClause ? whereClause : ''}
                ) AS s
            ) AS fc`;

            const { rows } = await pool.query(sql, values ? values : undefined);

            if (rows[0].jsonb_build_object.features === null) {
                console.warn({ action: 'getSubFeatures', msg: 'features===null', sql });
            }

            body.results = rows[0].jsonb_build_object;
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


function where(q: QueryParams) {
    const clauses = [];
    const values = [];

    if (q.from_date !== undefined && q.to_date !== undefined) {
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
        whereClause: 'WHERE ' + clauses.join(' AND '),
        values: values
    } : {
        whereClause: null, values: null
    };
}
