// backend/src/modules/analytics/services/analytics-recorder.service.ts
/**
 * Asynchronous Analytics Event Recorder.
 *
 * High-frequency events (message sent, AI turn generated, escalation triggered, tokens used)
 * call this recorder to log metrics asynchronously to `AnalyticsEvent`, ensuring ZERO latency
 * overhead on live LLM pipelines or user-facing API responses.
 */

import { prisma } from '@database/index';
import { logger } from '@shared/logger';

export interface RecordAnalyticsEventInput {
  workspaceId: string;
  eventType:
    | 'CONVERSATION_CREATED'
    | 'MESSAGE_SENT'
    | 'AI_RESPONSE_GENERATED'
    | 'HUMAN_ESCALATION'
    | 'APPOINTMENT_BOOKED'
    | 'APPOINTMENT_RESCHEDULED'
    | 'LEAD_QUALIFIED'
    | 'FOLLOWUP_TRIGGERED'
    | 'FOLLOWUP_CONVERTED'
    | 'AI_TOKEN_USAGE'
    | 'CSAT_RATING';
  agentType?: 'SALES' | 'SUPPORT' | 'RECEPTIONIST' | 'FOLLOWUP' | string;
  channel?: 'WEBSITE' | 'WHATSAPP' | 'EMAIL' | 'WEBHOOK' | string;
  metadata?: Record<string, unknown>;
}

export const analyticsRecorderService = {
  /**
   * Fire-and-forget method for recording high-frequency workspace metrics.
   * Catches errors internally to guarantee zero execution blocking or exception propagation.
   */
  recordEvent(input: RecordAnalyticsEventInput): void {
    const { workspaceId, eventType, agentType, channel, metadata } = input;

    // Use setImmediate / Promise wrapper for true fire-and-forget behavior
    setImmediate(async () => {
      try {
        await prisma.analyticsEvent.create({
          data: {
            workspaceId,
            eventType,
            agentType: agentType || null,
            channel: channel || null,
            metadata: metadata ? JSON.stringify(metadata) : null,
          },
        });
      } catch (err: any) {
        logger.error(
          { err: err.message, workspaceId, eventType },
          'Failed to write analytics event asynchronously',
        );
      }
    });
  },
};
