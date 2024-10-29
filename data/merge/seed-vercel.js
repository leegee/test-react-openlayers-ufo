import fs from 'fs';
import dotenv from 'dotenv';
import pkg from 'pg';

const { Pool } = pkg;

dotenv.config( { path: '../../.env.vercel' } );

const pool = new Pool( {
    connectionString: process.env.POSTGRES_URL,
    ssl: {
        rejectUnauthorized: false,
    },
} );

async function seedDatabase () {
    try {
        await pool.query( 'CREATE EXTENSION IF NOT EXISTS postgis;' );
        console.info( 'PostGIS extension created.' );

        const schemeSQL = fs.readFileSync( 'scheme.sql', 'utf8' );
        await pool.query( schemeSQL );
        console.info( 'Schema created successfully.' );

        const ufoSQL = fs.readFileSync( 'ufo-combined.sql', 'utf8' );
        await pool.query( ufoSQL );
        console.info( 'Database seeded successfully with data.' );

    } catch ( error ) {
        console.error( 'Error seeding database:', error );
    } finally {
        await pool.end();
        console.info( 'Disconnected.' );
    }
}

seedDatabase();
