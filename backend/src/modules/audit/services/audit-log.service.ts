// backend/src/modules/audit/services/audit-log.service.ts
/**
 * Centralized Multi-Tenant Audit Logging Service.
 *
 * Captures all administrative, authentication, setting, role, API key,
 * and AI employee escalation events into the database (`AuditLog` table).
 * Enforces strict workspace data isolation on retrieval.
 */

import { buildPaginationMeta } from '@common/response';
import { prisma } from '@database/index';
import { logger } from '@shared/logger';
import type { ListAuditLogsQuery } from '../validators/audit-log.schema';

export interface RecordAuditLogInput {
  workspaceId?: string;
  userId?: string;
  action: string;
  resource: string;
  resourceId?: string;
  ipAddress?: string;
  userAgent?: string;
  changes?: Record<string, unknown> | string;
}

export const auditLogService = {
  /**
   * Fire-and-forget record of an audit log entry.
   * Internal try/catch prevents failures in logging from aborting critical primary actions.
   */
  async recordAuditLog(input: RecordAuditLogInput): Promise<void> {
    const { workspaceId, userId, action, resource, resourceId, ipAddress, userAgent, changes } =
      input;

    setImmediate(async () => {
      try {
        const changesString =
          typeof changes === 'object' && changes !== null
            ? JSON.stringify(changes)
            : changes || null;

        await prisma.auditLog.create({
          data: {
            workspaceId: workspaceId || null,
            userId: userId || null,
            action,
            resource,
            resourceId: resourceId || null,
            ipAddress: ipAddress || null,
            userAgent: userAgent || null,
            changes: changesString,
          },
        });
      } catch (err: any) {
        logger.error(
          { err: err.message, action, resource, workspaceId, userId },
          'Failed to record audit log entry',
        );
      }
    });
  },

  /**
   * Fetches paginated audit logs for a specific workspace.
   * Strictly filtered by workspaceId for 100% multi-tenant data isolation.
   */
  async listWorkspaceAuditLogs(workspaceId: string, query: ListAuditLogsQuery) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where = {
      workspaceId,
      ...(query.action ? { action: query.action } : {}),
      ...(query.resource ? { resource: query.resource } : {}),
      ...(query.userId ? { userId: query.userId } : {}),
      ...(query.startDate || query.endDate
        ? {
            createdAt: {
              ...(query.startDate ? { gte: new Date(query.startDate) } : {}),
              ...(query.endDate ? { lte: new Date(query.endDate) } : {}),
            },
          }
        : {}),
    };

    const [totalItems, items] = await Promise.all([
      prisma.auditLog.count({ where }),
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              avatarUrl: true,
            },
          },
        },
      }),
    ]);

    const formattedItems = items.map((log) => {
      let parsedChanges = null;
      if (log.changes) {
        try {
          parsedChanges = JSON.parse(log.changes);
        } catch {
          parsedChanges = log.changes;
        }
      }

      return {
        id: log.id,
        workspaceId: log.workspaceId,
        userId: log.userId,
        userName: log.user?.name || null,
        userEmail: log.user?.email || null,
        action: log.action,
        resource: log.resource,
        resourceId: log.resourceId,
        ipAddress: log.ipAddress,
        userAgent: log.userAgent,
        changes: parsedChanges,
        createdAt: log.createdAt.toISOString(),
      };
    });

    return {
      items: formattedItems,
      pagination: buildPaginationMeta({ page, limit, totalItems }),
    };
  },
};
