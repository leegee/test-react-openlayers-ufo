import type { Context } from 'koa';
import type { IncomingMessage, ServerResponse } from 'http';

import { searchRoute } from '@ufo-monorepo/api-functions/src';

const search = async (ctx: Context) => await searchRoute(ctx.req as IncomingMessage, ctx.res as ServerResponse);

export default search;
