// backend/src/modules/jobs/processors/followup-scan.processor.ts
/**
 * Follow-Up Sequence & Lead Inactivity Scan Processor (`followup-queue`).
 *
 * Responsibilities:
 *  - Periodically scans inactive leads, quiet conversations, and abandoned carts/proposals.
 *  - Automatically enqueues outreach actions for the AI Follow-up Employee.
 *  - Emits real-time event updates when lead status changes.
 */

import { prisma } from '@database/index';
import { followupEmployeeService } from '@modules/followup-employee/services/followup-employee.service';
import { emitToWorkspace, NOTIFICATION_EVENTS } from '@modules/notifications';
import { logger } from '@shared/logger';

export async function processFollowupScanJob(job: any): Promise<void> {
  logger.info({ jobId: job.id }, 'Starting periodic follow-up and inactivity scan job');

  const activeWorkspaces = await prisma.workspace.findMany({
    where: { deletedAt: null },
    select: { id: true },
  });

  const now = new Date();
  const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);

  for (const { id: workspaceId } of activeWorkspaces) {
    try {
      // 1. Scan silent leads (status NEW or WARM updated > 3 days ago with no pending follow-up)
      const silentLeads = await prisma.lead.findMany({
        where: {
          workspaceId,
          status: { in: ['NEW', 'WARM'] },
          updatedAt: { lte: threeDaysAgo },
          deletedAt: null,
          followUps: {
            none: { status: 'PENDING' },
          },
        },
        take: 20,
      });

      for (const lead of silentLeads) {
        try {
          await followupEmployeeService.createFollowUp(workspaceId, {
            leadId: lead.id,
            triggerType: 'LEAD_SILENCE',
          });

          if (lead.score === 'HOT') {
            emitToWorkspace(workspaceId, NOTIFICATION_EVENTS.LEAD_QUALIFIED, {
              workspaceId,
              leadId: lead.id,
              score: 'HOT',
              source: lead.source || 'Automated Outreach',
              timestamp: new Date().toISOString(),
            });
          }
        } catch (err: any) {
          logger.error({ err: err.message, leadId: lead.id }, 'Failed to schedule lead silence follow-up');
        }
      }

      // 2. Scan quiet conversations (status OPEN, last message > 3 days ago)
      const quietConversations = await prisma.conversation.findMany({
        where: {
          workspaceId,
          status: 'OPEN',
          lastMessageAt: { lte: threeDaysAgo },
          deletedAt: null,
          followUps: {
            none: { status: 'PENDING' },
          },
        },
        take: 20,
      });

      for (const conv of quietConversations) {
        try {
          await followupEmployeeService.createFollowUp(workspaceId, {
            conversationId: conv.id,
            customerId: conv.customerId || undefined,
            triggerType: 'CUSTOMER_REENGAGEMENT',
          });
        } catch (err: any) {
          logger.error({ err: err.message, conversationId: conv.id }, 'Failed to schedule customer re-engagement follow-up');
        }
      }

      // 3. Process pending FollowUp records whose scheduledAt <= now
      const dueFollowups = await prisma.followUp.findMany({
        where: {
          workspaceId,
          status: 'PENDING',
          scheduledAt: { lte: now },
          optedOut: false,
          deletedAt: null,
        },
        take: 50,
      });

      for (const followup of dueFollowups) {
        try {
          await followupEmployeeService.triggerFollowUp(workspaceId, followup.id);
        } catch (err: any) {
          logger.error({ err: err.message, followupId: followup.id }, 'Failed to process follow-up turn');
        }
      }
    } catch (wsErr: any) {
      logger.error({ err: wsErr.message, workspaceId }, 'Error scanning follow-ups for workspace');
    }
  }

  logger.info('Follow-up and inactivity scan job completed successfully');
}
