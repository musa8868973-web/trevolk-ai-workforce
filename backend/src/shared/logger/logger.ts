import { appConfig } from '@config/index';
import pino from 'pino';

/**
 * Centralized application logger.
 *
 * - Pretty-printed, colorized output in development.
 * - Structured JSON output in production/staging (ready for log aggregation).
 * - Redacts common sensitive fields by default.
 */
export const logger = pino({
  name: appConfig.app.name,
  level: appConfig.logging.level,
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      '*.password',
      '*.token',
      '*.secret',
      '*.apiKey',
      '*.credentials_encrypted',
    ],
    censor: '[REDACTED]',
  },
  transport: appConfig.isDevelopment
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:yyyy-mm-dd HH:MM:ss',
          ignore: 'pid,hostname',
        },
      }
    : undefined,
  base: {
    env: appConfig.env,
  },
});

export type Logger = typeof logger;
