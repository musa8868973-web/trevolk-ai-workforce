import { sendSuccess } from '@common/response';
import { appConfig } from '@config/index';
import { isDatabaseReachable } from '@database/index';
import type { Request, Response } from 'express';

interface HealthPayload {
  status: 'ok';
  service: string;
  environment: string;
  uptimeSeconds: number;
  database: 'connected' | 'unreachable';
  timestamp: string;
}

/**
 * Returns a lightweight liveness/readiness signal for the API.
 * Deliberately excluded from HTTP request logging (see `httpLogger`) so
 * uptime monitors/load balancers don't flood the logs.
 *
 * The `database` field reports Postgres reachability as informational
 * metadata only — a down database does not fail this endpoint (liveness
 * and readiness are intentionally not conflated), so load balancers keep
 * routing traffic to a process that is otherwise healthy.
 */
async function check(_req: Request, res: Response): Promise<Response> {
  const databaseReachable = await isDatabaseReachable();

  const payload: HealthPayload = {
    status: 'ok',
    service: appConfig.app.name,
    environment: appConfig.env,
    uptimeSeconds: Math.round(process.uptime()),
    database: databaseReachable ? 'connected' : 'unreachable',
    timestamp: new Date().toISOString(),
  };

  return sendSuccess(res, {
    data: payload,
    message: 'Service is healthy',
  });
}

export const healthController = { check };
