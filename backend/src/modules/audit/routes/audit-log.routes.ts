// backend/src/modules/audit/routes/audit-log.routes.ts
import { WORKSPACE_ROLES } from '@common/constants';
import { requireAuth, requireRole, resolveWorkspace, validate } from '@common/middlewares';
import { asyncHandler } from '@shared/utils';
import { Router } from 'express';

import { auditLogController } from '../controller/audit-log.controller';
import {
  listAuditLogsQuerySchema,
  workspaceAuditLogParamSchema,
} from '../validators/audit-log.schema';

const router: Router = Router({ mergeParams: true });

/**
 * GET /api/v1/workspaces/:workspaceId/audit-logs
 * Strictly restricted to Workspace OWNER and ADMIN roles.
 */
router.get(
  '/',
  requireAuth,
  validate({ params: workspaceAuditLogParamSchema, query: listAuditLogsQuerySchema }),
  resolveWorkspace,
  requireRole(WORKSPACE_ROLES.OWNER, WORKSPACE_ROLES.ADMIN),
  asyncHandler(auditLogController.list),
);

export { router as auditLogRoutes };
