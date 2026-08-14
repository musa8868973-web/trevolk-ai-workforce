// backend/src/common/queues/redis.client.ts
/**
 * Lazily-initialised IORedis connection used by BullMQ.
 *
 * REDIS_URL is optional — when absent (local dev without Redis), a dummy
 * connection object is returned so the app still boots; queue methods
 * will simply throw ServiceUnavailableError if they are ever invoked.
 */
import { env } from '@config/index';
import type { RedisOptions } from 'ioredis';

let _redis: InstanceType<typeof import('ioredis').default> | null = null;

export function getRedisConnection(): InstanceType<typeof import('ioredis').default> {
  if (_redis) return _redis;

  if (!env.REDIS_URL) {
    throw new Error(
      'Redis is not configured (REDIS_URL missing). Background queues are unavailable.',
    );
  }

  // Lazy-load to avoid import errors when running tests without Redis
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Redis = require('ioredis') as typeof import('ioredis').default;

  const opts: RedisOptions = {
    maxRetriesPerRequest: null, // required by BullMQ
    enableReadyCheck: false,
    lazyConnect: false,
  };

  _redis = new Redis(env.REDIS_URL, opts);
  return _redis;
}

/** Closes and nullifies the Redis connection (used in tests). */
export async function closeRedisConnection(): Promise<void> {
  if (_redis) {
    await _redis.quit();
    _redis = null;
  }
}
