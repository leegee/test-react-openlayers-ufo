/**
 * Far from ideal: 
 * if config.db ufo.database (process.env.UFO_DATABASE) is'norge', it is the UFO Norway DB,
 * if it is 'ufo', it is the combined db included the Muffon data with the sadly truncated reports.
 */

const isNode = typeof process !== 'undefined';
const isBrowser = !isNode;

const env = isBrowser ? (import.meta as any).env : process.env;

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
};

const config: ConfigType = {
  locale: 'no',
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
    port: parseInt(env.UFO_HTTP_PORT || '8080'),
    host: env.UFO_HTTP_HOST || 'http://localhost',
    endpoints: {
      search: '/search',
      details: '/details',
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
