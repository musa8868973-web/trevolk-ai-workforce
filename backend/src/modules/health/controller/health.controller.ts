// backend/src/modules/health/controller/health.controller.ts
import { sendSuccess } from '@common/response';
import { appConfig } from '@config/index';
import { isDatabaseReachable } from '@database/index';
import type { Request, Response } from 'express';

interface HealthPayload {
  status: 'ok' | 'degraded';
  service: string;
  environment: string;
  uptimeSeconds: number;
  memory: {
    heapUsedMB: number;
    heapTotalMB: number;
    rssMB: number;
  };
  components: {
    database: 'connected' | 'unreachable';
    redis: 'connected' | 'not_configured' | 'unreachable';
  };
  timestamp: string;
}

async function checkRedisReachable(): Promise<'connected' | 'not_configured' | 'unreachable'> {
  if (!process.env['REDIS_URL']) return 'not_configured';
  try {
    const { getRedisConnection } = await import('@common/queues/redis.client');
    const redis = getRedisConnection();

    // 1-second timeout race to prevent hanging health probes when Redis is unreachable
    const pingPromise = redis.ping();
    const timeoutPromise = new Promise<string>((_, reject) =>
      setTimeout(() => reject(new Error('Redis ping timeout')), 1000),
    );

    const res = await Promise.race([pingPromise, timeoutPromise]);
    return res === 'PONG' ? 'connected' : 'unreachable';
  } catch {
    return 'unreachable';
  }
}

/**
 * GET /api/v1/health (Liveness Probe)
 * Returns status, uptime, memory, and database/redis connectivity signals.
 */
async function check(_req: Request, res: Response): Promise<Response> {
  const databaseReachable = await isDatabaseReachable();
  const redisStatus = await checkRedisReachable();
  const memory = process.memoryUsage();

  const payload: HealthPayload = {
    status: databaseReachable ? 'ok' : 'degraded',
    service: appConfig.app?.name || 'trevolk-backend',
    environment: appConfig.env || 'development',
    uptimeSeconds: Math.round(process.uptime()),
    memory: {
      heapUsedMB: Math.round((memory.heapUsed / 1024 / 1024) * 100) / 100,
      heapTotalMB: Math.round((memory.heapTotal / 1024 / 1024) * 100) / 100,
      rssMB: Math.round((memory.rss / 1024 / 1024) * 100) / 100,
    },
    components: {
      database: databaseReachable ? 'connected' : 'unreachable',
      redis: redisStatus,
    },
    timestamp: new Date().toISOString(),
  };

  return sendSuccess(res, {
    data: payload,
    message: 'Liveness health check completed',
  });
}

/**
 * GET /api/v1/health/ready (Readiness Probe)
 * Returns 200 OK when database is connected, or 503 when primary dependencies fail.
 */
async function readiness(_req: Request, res: Response): Promise<Response> {
  const databaseReachable = await isDatabaseReachable();
  const redisStatus = await checkRedisReachable();

  const isReady = databaseReachable && (redisStatus === 'connected' || redisStatus === 'not_configured');

  return res.status(isReady ? 200 : 503).json({
    status: isReady ? 'ready' : 'not_ready',
    database: databaseReachable ? 'connected' : 'unreachable',
    redis: redisStatus,
    timestamp: new Date().toISOString(),
  });
}

export const healthController = { check, readiness };
