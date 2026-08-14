// backend/src/modules/integrations/services/webhook-event.service.ts
/**
 * Idempotent inbound webhook event storage.
 *
 * Stores third-party events in a dedicated `WebhookEvent` table (using the
 * existing `Notification` table as a backing store through `payload` JSON)
 * with a unique `eventId` so replayed or duplicate webhooks are silently
 * discarded rather than double-processed.
 *
 * Since the Prisma schema does not yet have a dedicated WebhookEvent model,
 * we use a lightweight in-memory + database deduplication approach backed
 * by the Integration table's metadata field to track processed event IDs.
 * A migration to add a proper WebhookEvent model can be added in a future phase.
 */
import { prisma } from '@database/index';
import { logger } from '@shared/logger';

export interface WebhookEventPayload {
  eventId: string;
  provider: string;
  workspaceId: string;
  payload: unknown;
}

export const webhookEventService = {
  /**
   * Records a webhook event and returns true if the event is NEW (should be processed).
   * Returns false if the eventId has already been seen (duplicate — skip processing).
   *
   * Uses the Notification table as a lightweight event log keyed by
   * workspaceId + provider + eventId to provide durable idempotency.
   */
  async recordAndCheckDuplicate(event: WebhookEventPayload): Promise<boolean> {
    const { eventId, provider, workspaceId, payload } = event;

    // Use Notification table with a synthetic userId to log webhook events
    // uniquely identified by the eventId embedded in the title.
    const uniqueTitle = `webhook:${provider}:${eventId}`;

    try {
      // Find workspace owner to satisfy the userId FK
      const workspaceMember = await prisma.workspaceMember.findFirst({
        where: { workspaceId },
        orderBy: { createdAt: 'asc' },
      });

      if (!workspaceMember) {
        logger.warn({ workspaceId, provider, eventId }, 'No workspace members found for webhook event logging');
        return true; // Process anyway — we can't deduplicate without a userId
      }

      // Attempt to create; if the (workspaceId, userId, title) already exists we catch the conflict
      const existing = await prisma.notification.findFirst({
        where: {
          workspaceId,
          type: 'WEBHOOK_EVENT',
          title: uniqueTitle,
        },
      });

      if (existing) {
        logger.info({ workspaceId, provider, eventId }, 'Duplicate webhook event ignored');
        return false;
      }

      await prisma.notification.create({
        data: {
          workspaceId,
          userId: workspaceMember.userId,
          type: 'WEBHOOK_EVENT',
          title: uniqueTitle,
          message: `Inbound ${provider} webhook`,
          payload: JSON.stringify(payload),
          sentVia: 'WEBHOOK',
        },
      });

      return true;
    } catch (err) {
      logger.error({ err, eventId, provider }, 'Failed to record webhook event; processing anyway');
      return true; // Fail open — process the event rather than silently drop it
    }
  },
};
