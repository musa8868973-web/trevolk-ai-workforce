import type { NextFunction, Request, Response } from 'express';

type AsyncRequestHandler = (req: Request, res: Response, next: NextFunction) => Promise<unknown>;

/**
 * Wraps an async Express handler so any rejected promise is forwarded to
 * `next()` and handled by the centralized error middleware, instead of
 * requiring a try/catch in every controller.
 *
 * @example
 * router.get('/health', asyncHandler(healthController.check));
 */
export function asyncHandler(handler: AsyncRequestHandler) {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}
