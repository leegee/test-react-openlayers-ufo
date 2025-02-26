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
import { errorHandler } from "./middleware/errors";

const router = new Router();
const app = new Koa();

app.use(cors({ origin: "*" }));
app.use(errorHandler);
// app.use(dbhMiddleware);
app.use(router.routes());
app.use(router.allowedMethods());

router.get('/api/search', searchRoute);
router.get('/api/details/:id', detailsRoute);

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

