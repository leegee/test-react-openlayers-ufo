const config = {
  locale: 'no',
  db: {
    host: process.env.PGHOST || 'localhost',
    port: parseInt(process.env.PGPORT || '5432'),
    user: process.env.PGUSER || 'postgres',
    password: process.env.PGPASSWORD || 'password',
    database: process.env.UFO_DATABASE || 'norge',
  },
  api: {
    port: parseInt(process.env.HTTP_PORT || '8080'),
    host: 'http://localhost',
    endopoint: {
      search: '/'
    },
    searchableTextColumnNames: ['location_text', 'report_text'],
    debug: true,
    fetchDebounceMs: 500,
  },
  gui: {
    map: {
      centre: [18, 64] as [number, number],
      cluster_eps_metres: 50000, // The distance between clusters
    }
  },
  zoomLevelForPoints: 8,
  zoomLevelForPointDetails: 12,
  minQLength: 3,
};

export default config;
