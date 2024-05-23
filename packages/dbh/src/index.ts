import pg from "pg";
import config, { isVercel, VercelDbConfig, OurDbConfig } from '@ufo-monorepo-test/config/src';

let poolConfig: pg.PoolConfig;

if (isVercel()) {
    const dbConfig = config.db as VercelDbConfig;
    poolConfig = {
        connectionString: dbConfig.POSTGRES_URL
    };
} else {
    const dbConfig = config.db as OurDbConfig;
    poolConfig = {
        user: dbConfig.user,
        password: dbConfig.password,
        host: dbConfig.host,
        port: Number(dbConfig.port),
        database: dbConfig.database,
    };
}

export const pool = new pg.Pool(poolConfig);

export default pool;

export function final() {
    if (isVercel()) {
        pool.end();
    }
}
