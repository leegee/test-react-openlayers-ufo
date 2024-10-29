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

console.info( "Connected" );

async function seedDatabase () {
    try {
        // Create PostGIS extension if it doesn't exist
        await pool.query( 'CREATE EXTENSION IF NOT EXISTS postgis;' );
        console.info( 'PostGIS extension created.' );

        // Read both SQL files and merge them into one query
        const schemeSQL = fs.readFileSync( 'scheme.sql', 'utf8' );
        const ufoSQL = fs.readFileSync( 'ufo-combined.sql', 'utf8' );
        const mergedSQL = `${ schemeSQL }\n${ ufoSQL }`;

        // Execute the merged SQL
        await pool.query( mergedSQL );
        console.info( 'Database seeded successfully with merged SQL files' );
    } catch ( error ) {
        console.error( 'Error seeding database:', error );
    } finally {
        await pool.end();
        console.info( 'Disconnected.' );
    }
}

seedDatabase();
