import type { Request, Response } from 'express';
import pinoHttp from 'pino-http';

import { logger } from './logger';

/**
 * Express middleware that logs every incoming request/outgoing response,
 * correlated by the request ID attached by the `requestId` middleware.
 */
export const httpLogger = pinoHttp({
  logger,
  genReqId: (req: Request, res: Response) => {
    const existing = res.getHeader('X-Request-Id');
    if (existing) return existing.toString();
    // The `requestId` middleware runs earlier in the chain and sets req.id;
    // this is a defensive fallback if pino-http is ever mounted first.
    return (req as Request & { id?: string }).id ?? 'unknown';
  },
  customLogLevel: (_req, res, err) => {
    if (err || res.statusCode >= 500) return 'error';
    if (res.statusCode >= 400) return 'warn';
    return 'info';
  },
  customSuccessMessage: (req, res) => {
    return `${req.method} ${req.url} completed with ${res.statusCode}`;
  },
  customErrorMessage: (req, res, err) => {
    return `${req.method} ${req.url} failed with ${res.statusCode}: ${err.message}`;
  },
  autoLogging: {
    ignore: (req) => req.url === '/api/v1/health',
  },
});
