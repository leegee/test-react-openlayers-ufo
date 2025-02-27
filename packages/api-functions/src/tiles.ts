import url from 'url';
import { IncomingMessage, ServerResponse } from 'http';
import { pool } from '@ufo-monorepo/dbh';
import { CustomError } from './lib/CustomError.js';
import { logger } from '@ufo-monorepo/logger';

// Generate MVT tile from PostGIS data
async function generateTile(z: number, x: number, y: number) {
    // Query PostGIS for the data within the tile bounds
    const sql = `
        SELECT ST_AsMVT(m, 'sightings') AS mvt
        FROM (
            SELECT
                id,
                *,
                ST_AsMVTGeom(
                    point, 
                    ST_TileEnvelope($1, $2, $3),  -- Use z, x, y to get the bounding box
                    4096,  -- extent
                    256,   -- tile size
                    false
                ) AS geometry
            FROM sightings
            WHERE point && ST_TileEnvelope($1, $2, $3)  -- Does point's bounding box intersect the tile?
        ) AS m
    `;

    // Run the query against the database
    const { rows } = await pool.query(sql, [z, x, y]);

    if (rows.length === 0 || !rows[0].mvt) {
        throw new CustomError({
            action: 'tiles',
            msg: `No data found for z:${z}, x:${x}, y:${y}`,
            details: { x, y, z },
        });
    }

    const buffer = Buffer.from(rows[0].mvt); // Convert to Buffer

    return buffer;
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
    const { pathname } = url.parse(req.url as string);
    const regex = /\/(\d+)\/(\d+)\/(\d+)\.\w+$/;
    const match = pathname?.match(regex);

    if (!match) {
        throw new CustomError({
            action: 'tiles',
            msg: 'Invalid tile path',
            details: ['Expected path format: /tiles/{z}/{x}/{y}.mvt'],
        });
    }

    const [_, zStr, xStr, yStr] = match;
    const z = parseInt(zStr, 10);
    const x = parseInt(xStr, 10);
    const y = parseInt(yStr, 10);

    if (isNaN(z) || isNaN(x) || isNaN(y)) {
        throw new CustomError({
            action: 'tiles',
            msg: 'Invalid tile coordinates',
            details: ['z, x, and y must be integers'],
        });
    }

    // Generate the tile and return it as a response
    try {
        const tileData = await generateTile(z, x, y);

        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/x-protobuf');
        res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache tile for 1 hour
        res.end(tileData);

    } catch (e) {
        res.setHeader('Content-Type', 'application/json');
        res.statusCode = 500;
        res.statusMessage = 'Error generating tile';
        res.end(`Error generating tile: ${(e as Error).message}`);
        throw new CustomError({
            action: 'tiles',
            msg: res.statusMessage,
            details: e as Error,
        });
    }
}
