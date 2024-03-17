// middleware/errors.ts - Error handling middleware
import Koa from 'koa';

export class CustomError {
    constructor(
        public action: string,
        public details: any,
        public status: number = 500,
        public msg?: string | string[],
        public error?: Error | string
    ) { }
}

export async function errorHandler(ctx: Koa.Context, next: Koa.Next) {
    try {
        await next();

        if (!ctx.status) {
            ctx.status = 404;
        }
    }
    catch (error) {
        console.error(error);
        ctx.body = error;
    }
}

