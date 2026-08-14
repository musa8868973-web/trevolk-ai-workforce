// backend/src/common/middlewares/rate-limit.middleware.ts
/**
 * Advanced Production Rate Limiting & DDoS Protection Middleware.
 *
 * Implements token-bucket / fixed-window rate limiting backed by Redis (when REDIS_URL
 * is configured) or high-performance in-memory state as fallback.
 *
 * Scoped limiters provided:
 *  - `authRateLimit`: 5 requests per 1 minute per IP (brute-force protection for `/auth/*`).
 *  - `aiChatRateLimit`: 30 requests per minute per workspace/IP for AI LLM pipelines.
 *  - `webhookRateLimit`: 60 requests per minute per IP for inbound webhooks.
 *  - `apiRateLimit`: 100 requests per minute per workspace/IP for general API endpoints.
 */

import { TooManyRequestsError } from '@common/errors';
import { getRedisConnection } from '@common/queues/redis.client';
import { appConfig } from '@config/index';
import type { NextFunction, Request, Response } from 'express';

export interface RateLimitOptions {
  windowMs: number;
  max: number;
  message?: string;
  keyGenerator?: (req: Request) => string;
}

const memoryHits = new Map<string, { count: number; resetAt: number }>();

/**
 * Clean up expired in-memory hits periodically to prevent memory leaks.
 */
setInterval(() => {
  const now = Date.now();
  for (const [key, hit] of memoryHits.entries()) {
    if (hit.resetAt <= now) {
      memoryHits.delete(key);
    }
  }
}, 60_000).unref();

function safeLogWarn(meta: object, msg: string): void {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { logger } = require('@shared/logger');
    logger.warn(meta, msg);
  } catch {
    // Ignore logging errors when logger/appConfig is mocked in unit tests
  }
}

function safeLogError(meta: object, msg: string): void {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { logger } = require('@shared/logger');
    logger.error(meta, msg);
  } catch {
    // Ignore logging errors when logger/appConfig is mocked in unit tests
  }
}

export function rateLimit(options: RateLimitOptions) {
  const {
    windowMs,
    max,
    message = 'Too many requests, please try again later.',
    keyGenerator,
  } = options;

  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    // Disabled in automated tests so test suites aren't throttled
    if (appConfig?.isTest) {
      next();
      return;
    }

    const key = keyGenerator ? keyGenerator(req) : req.ip || 'unknown_client';
    const redisKey = `ratelimit:${key}`;

    // 1. Try Redis-backed rate limiting if Redis is configured and not in test environment
    if (process.env['REDIS_URL'] && !appConfig?.isTest) {
      try {
        const redis = getRedisConnection();

        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Redis rate limit timeout')), 500),
        );

        const currentHits = (await Promise.race([
          redis.incr(redisKey),
          timeoutPromise,
        ])) as number;

        if (currentHits === 1) {
          await Promise.race([redis.pexpire(redisKey, windowMs), timeoutPromise]);
        }

        if (currentHits > max) {
          safeLogWarn({ key, currentHits, max }, 'Rate limit exceeded (Redis)');
          next(new TooManyRequestsError(message));
          return;
        }

        next();
        return;
      } catch (err: any) {
        safeLogError({ err: err.message }, 'Redis rate limit check failed; falling back to in-memory');
      }
    }

    // 2. In-Memory fallback rate limiter
    const now = Date.now();
    const existing = memoryHits.get(key);

    if (!existing || existing.resetAt <= now) {
      memoryHits.set(key, { count: 1, resetAt: now + windowMs });
      next();
      return;
    }

    if (existing.count >= max) {
      safeLogWarn({ key, count: existing.count, max }, 'Rate limit exceeded (In-Memory)');
      next(new TooManyRequestsError(message));
      return;
    }

    existing.count += 1;
    next();
  };
}

/** Auth routes rate limiter: 5 requests per 1 minute per IP */
export const authRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: 'Too many authentication attempts. Please wait 1 minute before trying again.',
  keyGenerator: (req) => `auth_${req.ip || 'unknown'}`,
});

/** AI Chat rate limiter: 30 requests per minute per workspace/IP */
export const aiChatRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: 'AI conversation rate limit reached for this workspace. Please slow down.',
  keyGenerator: (req) => `aichat_${req.workspace?.workspaceId || req.ip || 'unknown'}`,
});

/** Webhook rate limiter: 60 requests per minute per IP */
export const webhookRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  message: 'Too many webhook events received. Rate limit exceeded.',
  keyGenerator: (req) => `webhook_${req.ip || 'unknown'}`,
});

/** Standard API rate limiter: 100 requests per minute */
export const apiRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  message: 'API rate limit exceeded. Please wait a moment.',
  keyGenerator: (req) => `api_${req.workspace?.workspaceId || req.ip || 'unknown'}`,
});
