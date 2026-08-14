// backend/src/modules/analytics/routes/analytics.routes.ts
import { PERMISSIONS } from '@common/constants';
import { requireAuth, requirePermission, resolveWorkspace, validate } from '@common/middlewares';
import { asyncHandler } from '@shared/utils';
import { Router } from 'express';

import { analyticsController } from '../controller/analytics.controller';
import {
  analyticsQuerySchema,
  workspaceAnalyticsParamSchema,
} from '../validators/analytics.schema';

const router: Router = Router({ mergeParams: true });

router.get(
  '/overview',
  requireAuth,
  validate({ params: workspaceAnalyticsParamSchema, query: analyticsQuerySchema }),
  resolveWorkspace,
  requirePermission(PERMISSIONS.ANALYTICS_VIEW),
  asyncHandler(analyticsController.getOverview),
);

router.get(
  '/ai-performance',
  requireAuth,
  validate({ params: workspaceAnalyticsParamSchema, query: analyticsQuerySchema }),
  resolveWorkspace,
  requirePermission(PERMISSIONS.ANALYTICS_VIEW),
  asyncHandler(analyticsController.getAiPerformance),
);

router.get(
  '/usage-costs',
  requireAuth,
  validate({ params: workspaceAnalyticsParamSchema, query: analyticsQuerySchema }),
  resolveWorkspace,
  requirePermission(PERMISSIONS.ANALYTICS_VIEW),
  asyncHandler(analyticsController.getUsageCosts),
);

router.get(
  '/channels',
  requireAuth,
  validate({ params: workspaceAnalyticsParamSchema, query: analyticsQuerySchema }),
  resolveWorkspace,
  requirePermission(PERMISSIONS.ANALYTICS_VIEW),
  asyncHandler(analyticsController.getChannelBreakdown),
);

export { router as analyticsRoutes };
