import pg from "pg";

import config from '@ufo-monorepo-test/config';

export const pool = new pg.Pool({
    user: config.db.user,
    password: config.db.password,
    host: config.db.host,
    port: Number(config.db.port),
    database: config.db.database,
});
