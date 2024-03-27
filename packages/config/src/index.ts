const isBrowser = typeof window !== 'undefined';

const env = isBrowser ? (import.meta as any).env : process.env;

const isMysql = env.UFO_DB_ENGINE === 'mysql';

export type EndpointType = {
  route: string;
  url: string;
}

export type ConfigType = {
  locale: string,
  db: {
    host: string;
    port: number;
    user: string;
    password: string;
    database: string;
    engine: 'mysql' | 'postgis';
  },
  api: {
    port: number;
    host: string;
    endopoints: {
      search: EndpointType;
      details: EndpointType;
      pointsMvt: EndpointType;
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
  TESTING_GL: boolean;
};

const config: ConfigType = {
  locale: 'no',
  db: {
    host: env.PGHOST || 'localhost',
    port: parseInt(env.PGPORT || '5432'),
    user: env.PGUSER || 'postgres',
    password: env.PGPASSWORD || 'password',
    database: env.UFO_DATABASE || 'norge',
    engine: 'postgis'
  },
  api: {
    port: parseInt(env.UFO_HTTP_PORT || '8080'),
    host: env.UFO_HTTP_HOST || 'http://localhost',
    endopoints: {
      search: { route: '/search', url: '/search' },
      details: { route: '/details/:id', url: '/details' },
      pointsMvt: { route: '/tiles/:z/:x/:y.mvt', url: '/tiles/{z}/{x}/{y}.mvt' },
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
    }
  },
  zoomLevelForPoints: 8,
  zoomLevelForPointDetails: 11,
  minQLength: 3,
  TESTING_GL: true,
};

if (isMysql) {
  config.db.host = env.MYSQL_HOST || 'localhost';
  config.db.port = parseInt(env.MYSQL_PORT || '5432');
  config.db.user = env.MYSQL_USER || env.MYSQL_USERNAME || 'root';
  config.db.password = env.MYSQL_PASSWORD || 'password';
  config.db.engine = 'mysql';
}

export default config;
