// import config from '@ufo-monorepo/config/src';

import { createLogger, transports, format } from "winston";
import config from '@ufo-monorepo/config';

const logger = createLogger({
    level: config.log.level,
    format: format.combine(format.timestamp(), format.json()),
    transports: [new transports.Console()],
});

export { logger };
