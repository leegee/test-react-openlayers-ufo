import type { Context } from 'koa';
import type { IncomingMessage, ServerResponse } from 'http';

import { tilesRoute } from '@ufo-monorepo/api-functions/src';

const tiles = async (ctx: Context) => await tilesRoute(ctx.req as IncomingMessage, ctx.res as ServerResponse);

export default tiles;
