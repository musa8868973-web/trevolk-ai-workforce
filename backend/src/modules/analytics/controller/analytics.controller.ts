// backend/src/modules/analytics/controller/analytics.controller.ts
import { ForbiddenError } from '@common/errors';
import { sendSuccess } from '@common/response';
import type { Request, Response } from 'express';

import { analyticsService } from '../services/analytics.service';
import type { AnalyticsQuery } from '../validators/analytics.schema';

function requireWorkspaceId(req: Request): string {
  const workspaceId = req.workspace?.workspaceId || (req.params.workspaceId as string | undefined);
  if (!workspaceId) {
    throw new ForbiddenError('Workspace context is required');
  }
  return workspaceId;
}

async function getOverview(req: Request, res: Response): Promise<Response> {
  const workspaceId = requireWorkspaceId(req);
  const query = req.query as unknown as AnalyticsQuery;
  const overview = await analyticsService.getWorkspaceOverview(workspaceId, query);
  return sendSuccess(res, { data: overview, message: 'Workspace overview analytics retrieved' });
}

async function getAiPerformance(req: Request, res: Response): Promise<Response> {
  const workspaceId = requireWorkspaceId(req);
  const query = req.query as unknown as AnalyticsQuery;
  const performance = await analyticsService.getAiPerformance(workspaceId, query);
  return sendSuccess(res, { data: performance, message: 'AI employee performance metrics retrieved' });
}

async function getUsageCosts(req: Request, res: Response): Promise<Response> {
  const workspaceId = requireWorkspaceId(req);
  const query = req.query as unknown as AnalyticsQuery;
  const usage = await analyticsService.getUsageCosts(workspaceId, query);
  return sendSuccess(res, { data: usage, message: 'AI engine usage and cost metrics retrieved' });
}

async function getChannelBreakdown(req: Request, res: Response): Promise<Response> {
  const workspaceId = requireWorkspaceId(req);
  const query = req.query as unknown as AnalyticsQuery;
  const channels = await analyticsService.getChannelBreakdown(workspaceId, query);
  return sendSuccess(res, { data: channels, message: 'Channel breakdown analytics retrieved' });
}

export const analyticsController = {
  getOverview,
  getAiPerformance,
  getUsageCosts,
  getChannelBreakdown,
};
