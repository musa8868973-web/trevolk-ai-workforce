// backend/src/modules/audit/controller/audit-log.controller.ts
import { ForbiddenError } from '@common/errors';
import { sendSuccess } from '@common/response';
import type { Request, Response } from 'express';

import { auditLogService } from '../services/audit-log.service';
import type { ListAuditLogsQuery } from '../validators/audit-log.schema';

function requireWorkspaceId(req: Request): string {
  const workspaceId = req.workspace?.workspaceId || (req.params.workspaceId as string | undefined);
  if (!workspaceId) {
    throw new ForbiddenError('Workspace context is required');
  }
  return workspaceId;
}

async function list(req: Request, res: Response): Promise<Response> {
  const workspaceId = requireWorkspaceId(req);
  const query = req.query as unknown as ListAuditLogsQuery;
  const result = await auditLogService.listWorkspaceAuditLogs(workspaceId, query);
  
  return sendSuccess(res, {
    data: result.items,
    meta: { pagination: result.pagination },
    message: 'Workspace audit logs retrieved successfully',
  });
}

export const auditLogController = { list };
