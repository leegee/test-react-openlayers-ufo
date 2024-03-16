import { Context } from 'koa';
import type { FeatureCollection } from 'geojson';
import { ParsedUrlQuery } from "querystring";

import { MapDictionary, QueryParams } from '@ufo-monorepo-test/common-types/src';
import config from '@ufo-monorepo-test/config/src';

export async function search(ctx: Context) {
    const body = {
        msg: new String(),
        status: 200,
        dictionary: {},
        results: undefined as FeatureCollection | undefined,
    };

    const userArgs: QueryParams | null = getCleanArgs(ctx.request.query);

    if (userArgs) {
        let forErrorReporting = {};

        try {
            const { whereClause, whereParams, selectClause } = constructSqlBits(userArgs);
            const sql = geoJsonFor(
                `SELECT ${selectClause} FROM sightings`,
                whereClause
            );

            const formattedQueryForLogging = sql.replace(/\$(\d+)/g, (_, index) => {
                const param = whereParams ? whereParams[index - 1] : undefined;
                return typeof param === 'string' ? `'${param}'` : param;
            });

            forErrorReporting = { sql, selectClause, whereClause, whereParams, formattedQuery: formattedQueryForLogging };

            const { rows } = await ctx.dbh.query(sql, whereParams ? whereParams : undefined);

            if (rows[0].jsonb_build_object.features === null && config.api.debug) {
                console.warn({ action: 'query', msg: 'Found no features', sql, whereParams });
            }

            body.results = rows[0].jsonb_build_object as FeatureCollection;
            body.dictionary = await getDictionary(body.results);
        }
        catch (e) {
            console.error({ action: 'query', details: forErrorReporting, error: e });
            body.status = 500;
            body.msg = new String(e);
        }
    }

    else {
        body.status = 400;
        body.msg = 'Missing request parameters in ' + JSON.stringify(userArgs);
    }

    ctx.body = JSON.stringify(body);
}

function geoJsonFor(selectClause: string, whereClause: string) {
    return `SELECT jsonb_build_object(
        'type', 'FeatureCollection',
        'features', jsonb_agg(feature)
    ) 
    FROM (
        SELECT jsonb_build_object(
            'type', 'Feature',
            'geometry', ST_AsGeoJSON(s.point, 3857)::jsonb,
            'properties', to_jsonb(s) - 'point'
        ) AS feature
        FROM (
            ${selectClause}
            ${whereClause}
        ) AS s
    ) AS fc`;
}

function constructSqlBits(userArgs: QueryParams) {
    const whereClauses: String[] = [];
    const selectClauses: String[] = [
        'id', 'location_text', 'address', 'report_text', 'datetime', 'datetime_invalid', 'datetime_original', 'point',
    ];
    const whereParams = [];
    const orderBy = [];

    if (userArgs.from_date !== undefined && userArgs.to_date !== undefined) {
        whereClauses.push(
            `(datetime BETWEEN $${whereParams.length + 1} AND $${whereParams.length + 2})`
        );
        whereParams.push(
            userArgs.from_date + " 01-01 00:00:00",
            userArgs.to_date + " 12-31 23:59:59"
        );
    }
    else if (userArgs.from_date !== undefined) {
        whereClauses.push(`(datetime >= ${whereParams.length + 1})`);
        whereParams.push(userArgs.from_date + " 01-01 00:00:00");
    }
    else if (userArgs.to_date !== undefined) {
        whereClauses.push(`(datetime <= $${whereParams.length + 1})`);
        whereParams.push(userArgs.to_date + " 12-31 23:59:59");
    }
    else if (!userArgs.show_undated) {
        whereClauses.push("(datetime IS NOT NULL)");
    }

    // if (!userArgs.show_invalid_dates) {
    //     whereClauses.push("datetime_invalid IS NOT true");
    // }

    if (userArgs.q !== undefined && userArgs.q !== '') {
        const orWhere = [];
        const orSelect = [];
        const orOrderBy = [];
        if (!userArgs.q_subject || userArgs.q_subject.includes('location_text')) {
            orWhere.push(`location_text ILIKE $${whereParams.length + 1}`);
            orSelect.push(`similarity(location_text, $${whereParams.length + 1}) AS location_text_score`,);
            orOrderBy.push('location_text_score DESC');
        }
        if (!userArgs.q_subject || userArgs.q_subject.includes('report_text')) {
            orWhere.push(`report_text ILIKE $${whereParams.length + 1}`);
            orSelect.push(`similarity(report_text, $${whereParams.length + 1}) AS report_text_score`);
            orOrderBy.push('report_text_score DESC');
        }
        whereClauses.push('(' + orWhere.join(' OR ') + ')');

        // whereClauses.push(`( location_text ILIKE $${whereParams.length + 1} OR report_text ILIKE $${whereParams.length + 1} )`);
        // selectClauses.push( `similarity(location_text, $${whereParams.length + 1}) AS location_text_score`, `similarity(report_text, $${whereParams.length + 1}) AS report_text_score` );
        // whereParams.push(userArgs.q + '%');
        // orderBy.push('location_text_score DESC, report_text_score DESC');

        whereParams.push(userArgs.q + '%');
        orderBy.push(orOrderBy.join(', '));
    }

    whereClauses.push(`(point && ST_Transform(ST_MakeEnvelope($${whereParams.length + 1}, $${whereParams.length + 2}, $${whereParams.length + 3}, $${whereParams.length + 4}, 4326), 3857))`);
    whereParams.push(userArgs.minlng, userArgs.minlat, userArgs.maxlng, userArgs.maxlat);

    const rv: {
        whereClause: string,
        selectClause: string,
        orderBy: string,
        whereParams: any[] | undefined,
    } = {
        whereClause: '',
        whereParams: undefined,
        selectClause: '',
        orderBy: '',
    };

    if (whereClauses.length) {
        rv.whereClause = ' WHERE ' + whereClauses.join(' AND ');
        rv.whereParams = whereParams;
    }

    if (selectClauses.length) {
        rv.selectClause = selectClauses.join(', ');
    }

    if (orderBy.length) {
        rv.orderBy = ' ORDER BY ' + orderBy.join(',');
    }

    return rv;
}

async function getDictionary(featureCollection: FeatureCollection | undefined) {
    const dictionary: MapDictionary = {
        datetime: {
            min: undefined,
            max: undefined,
        },
    };

    let min = undefined;
    let max = undefined;

    if (!featureCollection || !featureCollection.features) {
        console.warn({ action: 'getDictionary', warning: 'no features', featureCollection });
        return dictionary;
    }

    for (const feature of featureCollection.features) {
        const datetime: string | undefined = feature.properties?.datetime;

        if (datetime) {
            if (min === undefined || datetime < min) {
                min = datetime;
            }
            if (max === undefined || datetime > max) {
                max = datetime;
            }
        }
    }

    dictionary.datetime = {
        min: typeof min !== 'undefined' && min !== '0001-01-01T00:00:00' ? new Date(min).getFullYear() : undefined,
        max: typeof max !== 'undefined' && max !== '0001-01-01T00:00:00' ? new Date(max).getFullYear() : undefined,
    };

    return dictionary;
}

function getCleanArgs(args: ParsedUrlQuery) {
    const userArgs: QueryParams = {
        minlng: parseFloat(args.minlng as string),
        minlat: parseFloat(args.minlat as string),
        maxlng: parseFloat(args.maxlng as string),
        maxlat: parseFloat(args.maxlat as string),

        to_date: args.to_date ? (Array.isArray(args.to_date) ? args.to_date[0] : args.to_date) : undefined,
        from_date: args.from_date ? (Array.isArray(args.from_date) ? args.from_date[0] : args.from_date) : undefined,

        show_undated: args.show_undated === 'true',
        show_invalid_dates: args.show_invalid_dates === 'true',

        // Potentially the subject of a text search:
        q: args.q ? String(args.q).trim() : undefined,

        // Potentially the subject of the text search: undefined = search all cols defined in config.api.searchable_text_col_keys
        q_subject: args.q_subject && [config.api.searchable_text_col_keys].includes(
            args.q_subject instanceof Array ? args.q_subject : [args.q_subject]
        ) ? String(args.q_subject) : undefined,
    };

    if (userArgs.from_date && Number(userArgs.from_date) === 1) {
        delete userArgs.from_date;
    }
    if (userArgs.to_date && Number(userArgs.to_date) === 1) {
        delete userArgs.to_date;
    }

    return (
        userArgs !== null &&
        userArgs.minlat !== undefined && userArgs.minlng !== undefined &&
        userArgs.maxlat !== undefined && userArgs.maxlng !== undefined
    ) ? userArgs : null;
}
