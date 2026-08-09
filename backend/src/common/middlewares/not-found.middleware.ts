import { NotFoundError } from '@common/errors';
import type { NextFunction, Request, Response } from 'express';

/**
 * Catches any request that didn't match a mounted route and forwards a
 * standardized `NotFoundError` to the global error handler, rather than
 * letting Express fall through to its default HTML 404 page.
 */
export function notFoundMiddleware(req: Request, _res: Response, next: NextFunction): void {
  next(new NotFoundError(`Route not found: ${req.method} ${req.originalUrl}`));
}
