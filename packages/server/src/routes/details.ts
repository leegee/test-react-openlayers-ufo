import type { Context } from 'koa';
import type { IncomingMessage, ServerResponse } from 'http';

import { detailsRoute } from '@ufo-monorepo/api-functions/src';

const details = async (ctx: Context) => await detailsRoute(ctx.req as IncomingMessage, ctx.res as ServerResponse);

export default details;
