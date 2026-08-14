// backend/src/modules/integrations/providers/generic/generic-webhook.provider.ts
/**
 * Generic Webhook & CRM Router Adapter.
 *
 * Responsibilities:
 *  - Dispatches outbound webhooks to configured endpoints (Zapier, HubSpot, custom HTTP endpoints)
 *    when internal events occur (e.g. lead qualified, appointment booked).
 *  - Handles inbound custom payload parsing.
 */
import { credentialService } from '../../services/credential.service';
import { logger } from '@shared/logger';

export interface WebhookSubscription {
  targetUrl: string;
  secret?: string;
  events: string[]; // e.g. ['lead.qualified', 'appointment.created']
}

export const genericWebhookProvider = {
  /**
   * Triggers an outbound webhook event for a workspace.
   * Looks up configured generic webhook endpoints and POSTs the payload.
   */
  async triggerOutboundEvent(
    workspaceId: string,
    event: string,
    payload: Record<string, unknown>,
  ): Promise<void> {
    try {
      const credentials = await credentialService.getCredentials(workspaceId, 'generic_webhook');
      const subscriptions = credentials.subscriptions as WebhookSubscription[] | undefined;

      if (!subscriptions || subscriptions.length === 0) return;

      const activeSubscriptions = subscriptions.filter((s) => s.events.includes(event));

      await Promise.all(
        activeSubscriptions.map(async (sub) => {
          try {
            const body = JSON.stringify({
              event,
              workspaceId,
              timestamp: new Date().toISOString(),
              data: payload,
            });

            const headers: Record<string, string> = {
              'Content-Type': 'application/json',
            };

            // If a secret is defined, attach an HMAC signature for authenticity verification by receiver
            if (sub.secret) {
              const crypto = require('node:crypto');
              const hmac = crypto.createHmac('sha256', sub.secret);
              hmac.update(body);
              headers['X-Trevolk-Signature'] = `sha256=${hmac.digest('hex')}`;
            }

            const response = await fetch(sub.targetUrl, {
              method: 'POST',
              headers,
              body,
            });

            if (!response.ok) {
              logger.warn(
                { targetUrl: sub.targetUrl, status: response.status, workspaceId },
                'Failed to deliver outbound generic webhook',
              );
            }
          } catch (deliveryErr) {
            logger.error(
              { deliveryErr, targetUrl: sub.targetUrl, workspaceId },
              'Error delivering outbound generic webhook',
            );
          }
        }),
      );
    } catch (err) {
      // If generic webhook is not configured at all, getCredentials throws NotFoundError;
      // we catch it silently as webhooks are optional.
      if (err instanceof Error && err.message.includes('No generic_webhook integration credentials found')) {
        return;
      }
      logger.error({ err, workspaceId, event }, 'Generic webhook trigger processing failed');
    }
  },
};
