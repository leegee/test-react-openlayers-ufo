export class CustomError {
    action: string;
    details: any;
    status?: number;
    msg?: string | string[];
    error?: Error | string;

    constructor(args: {
        action: string;
        details: any;
        status?: number;
        msg?: string | string[];
        error?: Error | string;
    }) {
        this.action = args.action;
        this.details = args.details;
        this.status = args.status || 500;
        if (args.msg) this.msg = args.msg;
        if (args.error) this.error = args.error;
    }
}
