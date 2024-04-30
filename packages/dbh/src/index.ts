import pg from "pg";

import config from '@ufo-monorepo-test/config';

if (!config.db.engine) {
    throw new TypeError('Env var UFO_DB_ENGINE needs to be postgres or mysql');
} else {
    console.debug(`config.db.engine=${config.db.engine}`);
}

export const pool = new pg.Pool({
    user: config.db.user,
    password: config.db.password,
    host: config.db.host,
    port: Number(config.db.port),
    database: config.db.database,
});

export default pool;
