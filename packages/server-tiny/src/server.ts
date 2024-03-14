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
    minlng: string;
    minlat: string;
    maxlng: string;
    maxlat: string;
    to_date?: string;
    from_date?: string;
    show_undated?: boolean;
}

const app = new Koa();
app.use(cors({ origin: "*" }));

app.use(async (ctx) => {
    const body = {
        msg: new String(),
        status: 200,
        results: [],
    };

    const q: QueryParams = ctx.request.query as unknown as QueryParams;

    q.show_undated = true;

    if (q !== null && q.minlat !== undefined && q.minlng !== undefined && q.maxlat !== undefined && q.maxlng !== undefined) {
        try {
            let sql = `SELECT jsonb_build_object(
                'type', 'FeatureCollection',
                'features', jsonb_agg(feature)
            ) 
            FROM (
                SELECT jsonb_build_object(
                    'type', 'Feature',
                    'geometry', ST_AsGeoJSON(s.point)::jsonb,
                    'properties', to_jsonb(s) - 'point'
                ) AS feature
                FROM (
                    SELECT location_text, address, report_text, datetime, datetime_invalid, datetime_original,
                    point
                    FROM sightings
                    WHERE 
                    ${q.from_date !== undefined && q.to_date !== undefined ? "(datetime BETWEEN '" + q.from_date + "-01-01 00:00:00' AND '" + q.to_date + "-12-31 23:59:59') AND " : ""}
                    ${!q.show_undated ? "datetime IS NOT NULL AND " : ""}
                    ST_Intersects(point, ST_MakeEnvelope(
                        ${q.minlng}, ${q.minlat}, 
                        ${q.maxlng}, ${q.maxlat}, 4326
                    ))
                ) AS s
            ) AS fc`;

            const { rows } = await pool.query(sql);

            if (rows[0].jsonb_build_object.features === null) {
                console.warn({ action: 'getSubFeatures', msg: 'features===null', sql });
            }

            (body.results as unknown) = rows[0].jsonb_build_object;
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
