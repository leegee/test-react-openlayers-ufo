import Koa from "koa";
import pg from "pg";
import cors from "@koa/cors";
import config from '@ufo-monorepo-test/config';

const pool = new pg.Pool({
    user: process.env.PGUSER,
    host: process.env.PGHOST,
    database: 'norge',
    password: process.env.PGPASSWORD,
    port: Number(process.env.PGPORT) || 5432,
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

    if (q !== null && q.minlat !== undefined && q.minlng !== undefined && q.maxlat !== undefined && q.maxlng !== undefined) {
        try {
            let sql = "SELECT * FROM sightings WHERE ";

            if (q.from_date !== undefined && q.to_date !== undefined) {
                sql += "(date_time BETWEEN '" + q.from_date + "-01-01 00:00:00' AND '" + q.to_date + "-12-31 23:59:59') AND ";
            }

            if (!q.show_undated) {
                sql += " date_time IS NOT NULL AND ";
            }

            sql += "ST_Intersects(sightings.point, ST_MakeEnvelope("
                + q.minlng + ", " + q.minlat + ", "
                + q.maxlng + ", " + q.maxlat + ", 4326))";
            
            console.debug(sql);

            const { rows } = await pool.query(sql);
            (body.results as unknown) = rows.map((row) => {
                if (!row.shape) {
                    row.shape = 'unspecified';
                }
                return row;
            }) ;
            console.debug('Rows matched:', rows.length);
        } catch (e) {
            console.debug(e);
            body.status = 500;
            body.msg = new String(e);
        }
    } else {
        body.status = 400;
        body.msg = 'Missing request parameters';
    }

    ctx.body = JSON.stringify(body);
});

console.debug("Listening on", config.api.port);

app.listen(config.api.port);
