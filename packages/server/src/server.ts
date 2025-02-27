/*

GET /search

    lat_min
    lng_min
    lat_max
    lng_max
    to_date?
    from_date?

GET /detail/:id

  :id === sightings.id

*/

import Koa from "koa";
import Router from 'koa-router';
import cors from "@koa/cors";

import config from '@ufo-monorepo/config';
import { logger } from '@ufo-monorepo/logger';

import searchRoute from './routes/search';
import detailsRoute from './routes/details';
import tilesRoute from './routes/tiles';
import { errorHandler } from "./middleware/errors";

const router = new Router();
const app = new Koa();

app.use(cors({ origin: "*" }));
app.use(errorHandler);
// app.use(dbhMiddleware);
app.use(router.routes());
app.use(router.allowedMethods());

app.use(async (ctx, next) => {
    if (ctx.url.endsWith('.mvt')) {
        ctx.set('Content-Type', 'application/x-protobuf');
    }
    await next();
});

router.get('/api/search', searchRoute);
router.get('/api/details/:id', detailsRoute);
router.get('/api/tiles/:z/:x/:y', tilesRoute);

const port = config.api.url.match(/:(\d+)$/)?.[1];

logger.info({
    action: 'pre-start-up',
    port: port,
    taking_to: config.db.database,
});

app.listen(port, () => {
    logger.info({
        action: 'start-up-ok',
        port: port,
        taking_to: config.db.database,
    });
});

