import { TooManyRequestsError } from '@common/errors';
import { appConfig } from '@config/index';
import type { NextFunction, Request, Response } from 'express';

/**
 * Minimal in-memory, fixed-window rate limiter.
 *
 * Scoped intentionally: authentication endpoints (register/login/refresh)
 * are the abuse-prone surface called out in the Backend Specification §9
 * ("stricter limits on authentication endpoints... to prevent abuse").
 * A single-process, in-memory window is sufficient for MVP scale; if the
 * API is ever scaled horizontally, this should move to a Redis-backed
 * limiter (Redis is already provisioned for background jobs — see
 * `appConfig.redis`) rather than being re-engineered here.
 *
 * Disabled under `NODE_ENV=test` so automated tests aren't rate-limited
 * against each other when exercising the same endpoint repeatedly.
 */
export function rateLimit(options: { windowMs: number; max: number; message?: string }) {
  const hits = new Map<string, { count: number; resetAt: number }>();

  return (req: Request, _res: Response, next: NextFunction): void => {
    if (appConfig.isTest) {
      next();
      return;
    }

    const key = req.ip ?? 'unknown';
    const now = Date.now();
    const existing = hits.get(key);

    if (!existing || existing.resetAt <= now) {
      hits.set(key, { count: 1, resetAt: now + options.windowMs });
      next();
      return;
    }

    if (existing.count >= options.max) {
      next(new TooManyRequestsError(options.message));
      return;
    }

    existing.count += 1;
    next();
  };
}
