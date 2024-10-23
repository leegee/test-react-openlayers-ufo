/**
 * Far from ideal: 
 * if config.db ufo.database (process.env.UFO_DATABASE) is'norge', it is the UFO Norway DB,
 * if it is 'ufo', it is the combined db included the Muffon data with the sadly truncated reports.
 * 
 * The Vercel bits are a WIP, and much can be hard-coded.
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
    port: number;
    host: string;
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

const config: ConfigType = {
  locale: 'no',
  log: {
    level: 'info',
  },
  db: env.POSTGRES_URL
    ? {
      POSTGRES_URL: env.POSTGRES_URL,
      database: env.UFO_DATABASE || 'ufo', // @see notes at the top
    }
    : {
      host: env.PGHOST || 'localhost',
      port: parseInt(env.PGPORT || '5432'),
      user: env.PGUSER || 'postgres',
      password: env.PGPASSWORD || 'password',
      database: env.UFO_DATABASE || 'ufo', // @see notes at the top
    },
  api: {
    port: parseInt(env.VITE_API_PORT || '8080'),
    host: env.VITE_API_HOST || 'http://localhost',
    endpoints: {
      // When the env var has an initial /, Vite adds the path to shell exe....
      search: env.VITE_API_PORT && env.VITE_ENDPOINT_SEARCH ? '/' + env.VITE_ENDPOINT_SEARCH : '/search',
      details: env.VITE_API_PORT && env.VITE_ENDPOINT_DETAILS ? '/' + env.VITE_ENDPOINT_DETAILS : '/details',
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
      centre: [18, 64] as [number, number], // Should use extent
      cluster_eps_metres: 50000, // The distance between clusters
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

export function isVercel(): boolean {
  return (config.db as VercelDbConfig).POSTGRES_URL !== undefined;
}

export function isCombinedDb(): boolean {
  return config.db.database === 'ufo';
}

