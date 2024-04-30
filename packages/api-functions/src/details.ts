import { IncomingMessage, ServerResponse } from 'http';
import { FetchSightingDetailsResponseType } from '@ufo-monorepo-test/common-types';
import config from '@ufo-monorepo-test/config';
import pool from '@ufo-monorepo-test/dbh/src';
import { CustomError } from './lib/CustomError';

let DBH = pool;

export default async function handler(req: IncomingMessage, res: ServerResponse) {
    const body: FetchSightingDetailsResponseType = {
        msg: '',
        status: 200,
        details: {},
    };

    const id = (req.url?.split('/') as string[]).pop() || '';

    if (!id) {
        throw new CustomError({
            action: 'details',
            msg: 'Missing request parameter',
            details: ['id']
        });
    }

    try {
        // Construct the SQL query based on the database configuration
        let sql = config.db.database === 'ufo' ? `SELECT * FROM sightings WHERE id=$1` :
            `SELECT sightings.*,
            observed_via.*, 
            yes_no_dontknow.*, 
            sky_condition.*, 
            sun_position.*, 
            fylke.*,
            report_status.*
            FROM sightings
            LEFT JOIN report_status ON sightings.report_status = report_status.id
            LEFT JOIN observed_via ON sightings.observed_via_id = observed_via.id
            LEFT JOIN yes_no_dontknow ON sightings.physical_effects = yes_no_dontknow.id
            LEFT JOIN sky_condition ON sightings.sky_condition_id = sky_condition.id
            LEFT JOIN sun_position ON sightings.sun_position_id = sun_position.id
            LEFT JOIN fylke ON sightings.Fylke = fylke.id
            WHERE sightings.id=$1`;

        // Execute the SQL query and retrieve the details
        const { rows } = await DBH.query(sql, [id]);

        body.details = rows[0];
    } catch (e) {
        throw new CustomError({
            action: 'details',
            details: { id },
            error: e as Error
        });
    }

    // Set the response body and send the response
    res.setHeader('Content-Type', 'application/json');
    res.statusCode = 200;
    res.end(JSON.stringify(body));
}
