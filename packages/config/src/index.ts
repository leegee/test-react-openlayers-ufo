import dotenv from 'dotenv';

dotenv.config();

const config = {
  db: {
    host: process.env.PGHOST || 'localhost',
    port: parseInt(process.env.PGPORT || '5432'),
    user: process.env.PGUSER || 'root',
    password: process.env.PGPASSWORD || 'password',
    database: process.env.UFO_DATABASE || 'norge',
  },
  http: {
    port: parseInt(process.env.HTTP_PORT || '8080'),
  },
};

export default config;
