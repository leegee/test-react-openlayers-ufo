import { Context } from 'koa';

import { FetchSightingDetailsResponse } from '@ufo-monorepo-test/common-types/src';
import { CustomError } from '../middleware/errors';

export async function details(ctx: Context) {
    const body: FetchSightingDetailsResponse = {
        msg: '',
        status: 200,
        details: {},
    };

    const id = ctx.params.id.trim().replace(/\D+/, '');

    if (!id) {
        throw new CustomError({
            action: 'details',
            msg: 'Missing request parameter',
            details: ['id']
        })
    }

    try {
        let sql = 'SELECT * FROM sightings WHERE id=$1';

        const { rows } = await ctx.dbh.query(sql, [id]);

        body.details = rows[0];
    }
    catch (e) {
        throw new CustomError({
            action: 'details',
            details: { id },
            error: e as Error
        });
    }

    ctx.body = JSON.stringify(body);
}

