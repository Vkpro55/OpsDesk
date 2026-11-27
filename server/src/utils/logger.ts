import pino from 'pino';
import { getContext } from '../middleware/requestContext.js';
import { config } from '../config/config.js';

const isDev = config.nodeEnv === 'development';

export const logger = pino({
  level: isDev ? 'debug' : 'info',
  timestamp: pino.stdTimeFunctions.isoTime,

  redact: [
    'req.headers.authorization',
    'req.headers.cookie',
    '*.password',
    '*.token',
  ],

  mixin: () => getContext() ?? {},

  transport: {
    targets: [
      isDev
        ? {
            target: 'pino-pretty',
            options: {
              colorize: true,
              translateTime: 'SYS:HH:MM:ss',
              ignore: 'pid,hostname',
            },
          }
        : { target: 'pino/file', options: { destination: 1 } },
      {
        target: 'pino/file',
        options: { destination: './logs/app.log', mkdir: true },
      },
    ],
  },
});
