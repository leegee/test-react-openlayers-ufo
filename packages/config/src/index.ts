/**
 * Configuration for database and API.
 * Handles different environments (local vs. Vercel).
 */

const isNode = typeof process !== 'undefined' && process.versions != null && process.versions.node != null;
const env = isNode ? process.env : (import.meta as any).env;

export type OurDbConfig = {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
};

export type VercelDbConfig = {
  POSTGRES_URL: string;
  database: string;
};

export type ConfigType = {
  flags: { [key: string]: boolean };
  locale: string;
  db: VercelDbConfig | OurDbConfig;
  api: {
    url: string;
    endpoints: {
      search: string;
      details: string;
    };
    searchableTextColumnNames: string[];
    debug: boolean;
  };
  gui: {
    debounce: number;
    apiRequests: {
      debounceMs: number;
    };
    map: {
      centre: [number, number];
      cluster_eps_metres: number;
    };
  };
  zoomLevelForPoints: number;
  zoomLevelForPointDetails: number;
  minQLength: number;
  log: {
    level: string;
  };
};

export const isVercel = env.VERCEL ? true : false;

export function isCombinedDb(): boolean {
  return config.db.database === 'ufo';
}

const config: ConfigType = {
  locale: 'no',
  log: {
    level: 'info',
  },
  db: env.POSTGRES_URL
    ? {
      POSTGRES_URL: env.POSTGRES_URL,
      database: env.UFO_DATABASE || 'ufo',
    }
    : {
      host: env.PGHOST || 'localhost',
      port: parseInt(env.PGPORT || '5432'),
      user: env.PGUSER || 'postgres',
      password: env.PGPASSWORD || 'password',
      database: env.UFO_DATABASE || 'ufo',
    },
  api: {
    url: isVercel ? `https://${env.VERCEL_URL}` : (env.VITE_API_URL || 'http://localhost:3000'),
    endpoints: {
      // Vite does weird things with URLs that look like Unix absolute paths
      search: env.VITE_ENDPOINT_SEARCH ? '/' + env.VITE_ENDPOINT_SEARCH : '/search',
      details: env.VITE_ENDPOINT_DETAILS ? '/' + env.VITE_ENDPOINT_DETAILS : '/details',
    },
    searchableTextColumnNames: ['location_text', 'report_text'],
    debug: true,
  },
  gui: {
    debounce: 500,
    apiRequests: {
      debounceMs: 1000,
    },
    map: {
      centre: [18, 64] as [number, number],
      cluster_eps_metres: 50000,
    },
  },
  zoomLevelForPoints: 8,
  zoomLevelForPointDetails: 11,
  minQLength: 3,
  flags: {
    USE_BOUNDS_WITHOUT_PANEL: false,
  },
};

export default config;
