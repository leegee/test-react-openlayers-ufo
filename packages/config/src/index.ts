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
    searchable_text_col_keys: ['location_text', 'report_text'],
    debug: true,
  },
  gui: {
    map: {
      centre: [12, 64] as [number, number]
    }
  }
};

export default config;
