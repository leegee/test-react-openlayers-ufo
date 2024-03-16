
import Koa from "koa";
import Router from 'koa-router';
import cors from "@koa/cors";

import config from '@ufo-monorepo-test/config/src';

import { search as searchRoute } from './routes/search';
import { dbhMiddleware } from './middleware/dbh';

const app = new Koa();
const router = new Router();

app.use(cors({ origin: "*" }));
app.use(dbhMiddleware);
app.use(router.routes());
app.use(router.allowedMethods());

router.get('/', searchRoute);

app.listen(config.api.port, () => {
    console.debug({ action: 'start-up', msg: `Listening on ${config.api.port}`, config });
});

