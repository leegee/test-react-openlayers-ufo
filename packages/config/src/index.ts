export type ConfigType = {
  locale: 'no' | 'en',
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
  db: {
    host: process.env.PGHOST || 'localhost',
    port: parseInt(process.env.PGPORT || '5432'),
    user: process.env.PGUSER || 'postgres',
    password: process.env.PGPASSWORD || 'password',
    database: process.env.UFO_DATABASE || 'norge',
    engine: 'postgis'
  },
  api: {
    port: parseInt(process.env.UFO_HTTP_PORT || '8080'),
    host: process.env.UFO_HTTP_HOST || 'http://localhost',
    endopoints: {
      search: '/search',
      details: '/details'
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
  zoomLevelForPointDetails: 12,
  minQLength: 3,
};

export default config;
