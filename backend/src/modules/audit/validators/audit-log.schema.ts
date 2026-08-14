// backend/src/modules/audit/validators/audit-log.schema.ts
import { z } from 'zod';

export const workspaceAuditLogParamSchema = z.object({
  workspaceId: z.string().uuid('Invalid workspace ID format'),
});

export type WorkspaceAuditLogParam = z.infer<typeof workspaceAuditLogParamSchema>;

export const listAuditLogsQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
  action: z.string().optional(),
  resource: z.string().optional(),
  userId: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export type ListAuditLogsQuery = z.infer<typeof listAuditLogsQuerySchema>;
