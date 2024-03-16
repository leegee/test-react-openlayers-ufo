// middleware/errors.ts - Error handling middleware
import Koa from 'koa';

export type CustomErrorType = {
    action: string;
    details: any;
    status?: number;
    msg?: string | string[];
    error?: Error | string;
}

export class CustomError extends Error {
    constructor(args: CustomErrorType) {
        args.status = args.status || 500;
        const message = JSON.stringify(args, null, 4);
        super(message);
        this.name = this.constructor.name;
        Object.setPrototypeOf(this, CustomError.prototype);
    }
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

