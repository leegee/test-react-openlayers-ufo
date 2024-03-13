"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const koa_1 = __importDefault(require("koa"));
const pg_1 = __importDefault(require("pg"));
// import cors from "@koa/cors";
const koa_cors_1 = __importDefault(require("koa-cors"));
const config_1 = __importDefault(require("@ufo-monorepo-test/config"));
const pool = new pg_1.default.Pool({
    user: process.env.PGUSER,
    host: process.env.PGHOST,
    database: 'norge',
    password: process.env.PGPASSWORD,
    port: Number(process.env.PGPORT) || 5432,
});
const app = new koa_1.default();
app.use((0, koa_cors_1.default)({ origin: "*" }));
app.use(async (ctx) => {
    const body = {
        msg: new String(),
        status: 200,
        results: [],
    };
    const q = ctx.request.query;
    if (q !== null && q.sw_lat !== undefined && q.sw_lng !== undefined && q.ne_lat !== undefined && q.ne_lng !== undefined) {
        try {
            let sql = "SELECT * FROM sightings WHERE ";
            if (q.from_date !== undefined && q.to_date !== undefined) {
                sql += "(date_time BETWEEN '" + q.from_date + "-01-01 00:00:00' AND '" + q.to_date + "-12-31 23:59:59') AND ";
            }
            if (!q.show_undated) {
                sql += " date_time IS NOT NULL AND ";
            }
            sql += "ST_Intersects(sightings.point, ST_MakeEnvelope("
                + q.sw_lng + ", " + q.sw_lat + ", "
                + q.ne_lng + ", " + q.ne_lat + ", 4326))";
            console.debug(sql);
            const { rows } = await pool.query(sql);
            body.results = rows.map((row) => {
                if (!row.shape) {
                    row.shape = 'unspecified';
                }
                return row;
            });
            console.debug('Rows matched:', rows.length);
        }
        catch (e) {
            console.debug(e);
            body.status = 500;
            body.msg = new String(e);
        }
    }
    else {
        body.status = 400;
        body.msg = 'Missing request parameters';
    }
    ctx.body = JSON.stringify(body);
});
console.debug("Listening on", config_1.default.http.port);
app.listen(config_1.default.http.port);
