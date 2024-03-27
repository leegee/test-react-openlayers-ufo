
import Koa from "koa";
import Router from 'koa-router';
import cors from "@koa/cors";

import config from '@ufo-monorepo-test/config/src';

import {
    search as searchRoute,
    mvt as mvtRoute
} from './routes/search';
import { details as detailsRoute } from './routes/details';
import { errorHandler } from "./middleware/errors";
import { dbhMiddleware } from './middleware/dbh';

if (!config.db.engine) {
    throw new TypeError('Env var UFO_DB_ENGINE needs to be postgres or mysql');
} else {
    console.debug(`config.db.engine=${config.db.engine}`);
}

const app = new Koa();
const router = new Router();

app.use(cors({ origin: "*" }));
app.use(errorHandler);
app.use(dbhMiddleware);
app.use(router.routes());
app.use(router.allowedMethods());

router.get(config.api.endopoints.search.route, searchRoute);
router.get(config.api.endopoints.details.route, detailsRoute);
router.get(config.api.endopoints.pointsMvt.route, mvtRoute);

app.listen(config.api.port, () => {
    console.info({ action: 'start-up', port: config.api.port });
});

