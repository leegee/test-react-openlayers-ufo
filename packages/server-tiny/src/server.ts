
import Koa from "koa";
import Router from 'koa-router';
import cors from "@koa/cors";

import config from '@ufo-monorepo-test/config/src';

import { search as searchRoute } from './routes/search';
import { details as detailsRoute } from './routes/details';
import { errorHandler } from "./middleware/errors";
import { dbhMiddleware } from './middleware/dbh';

const app = new Koa();
const router = new Router();

app.use(cors({ origin: "*" }));
app.use(errorHandler);
app.use(dbhMiddleware);
app.use(router.routes());
app.use(router.allowedMethods());

// config.api.endopoints.search should update to use objects
router.get('/search', searchRoute);
router.get('/details/:id', detailsRoute);

app.listen(config.api.port, () => {
    console.info({ action: 'start-up', port: config.api.port });
});

