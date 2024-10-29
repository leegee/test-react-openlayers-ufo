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
        // Create the PostGIS extension if it doesn't exist
        await pool.query( 'CREATE EXTENSION IF NOT EXISTS postgis;' );
        console.info( 'PostGIS extension created.' );

        // Seed the database with each SQL file
        for ( const filepath of [ 'scheme.sql', 'ufo-combined.sql' ] ) {
            const seedQuery = fs.readFileSync( filepath, 'utf8' );
            try {
                console.info( `Sending ${ filepath }` );
                await pool.query( seedQuery );
                console.info( `Database seeded successfully with ${ filepath }` );
            } catch ( error ) {
                console.error( `Error seeding database with ${ filepath }:`, error );
                throw error;
            }
        }
    } catch ( error ) {
        console.error( 'Error setting up database:', error );
    } finally {
        await pool.end();
        console.info( 'Disconnected.' );
    }
}

seedDatabase();
