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

import config from '@ufo-monorepo-test/config';
import { logger } from '@ufo-monorepo-test/logger';

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

router.get('/search', searchRoute);
router.get('/details/:id', detailsRoute);

app.listen(config.api.port, () => {
    logger.info({
        action: 'start-up',
        port: config.api.port,
        taking_to: config.db.database,
    });
});

