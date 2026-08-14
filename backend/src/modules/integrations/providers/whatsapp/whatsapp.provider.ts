// backend/src/modules/integrations/providers/whatsapp/whatsapp.provider.ts
/**
 * WhatsApp (Meta Cloud API) integration adapter.
 *
 * Responsibilities:
 *  - Parse and normalise inbound Meta webhook payloads.
 *  - Send outbound text and media messages via the Meta Graph API.
 *  - Handle delivery/read receipt status updates.
 */
import { credentialService } from '../../services/credential.service';
import { logger } from '@shared/logger';

const GRAPH_API_BASE = 'https://graph.facebook.com/v21.0';

export interface WhatsAppInboundMessage {
  from: string;        // Customer's WhatsApp phone number
  messageId: string;   // wa_message_id
  timestamp: string;
  type: 'text' | 'image' | 'audio' | 'document' | 'interactive' | 'unknown';
  text?: string;
  mediaUrl?: string;
  mediaType?: string;
}

export interface WhatsAppStatusUpdate {
  messageId: string;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  timestamp: string;
  recipientId: string;
}

export interface ParsedWhatsAppWebhook {
  workspaceId?: string; // resolved from phoneNumberId lookup
  phoneNumberId: string;
  messages: WhatsAppInboundMessage[];
  statuses: WhatsAppStatusUpdate[];
}

/**
 * Parses a raw Meta WhatsApp Cloud API webhook payload into a normalised
 * structure. Returns null if the payload is not a whatsapp_business_account event.
 */
export function parseWhatsAppWebhook(body: unknown): ParsedWhatsAppWebhook | null {
  const payload = body as Record<string, unknown>;
  if (payload['object'] !== 'whatsapp_business_account') return null;

  const messages: WhatsAppInboundMessage[] = [];
  const statuses: WhatsAppStatusUpdate[] = [];
  let phoneNumberId = '';

  const entries = (payload['entry'] as unknown[]) ?? [];
  for (const entry of entries) {
    const changes = ((entry as Record<string, unknown>)['changes'] as unknown[]) ?? [];
    for (const change of changes) {
      const value = ((change as Record<string, unknown>)['value'] as Record<string, unknown>) ?? {};
      phoneNumberId = (value['metadata'] as Record<string, unknown>)?.['phone_number_id'] as string ?? '';

      for (const msg of ((value['messages'] as unknown[]) ?? [])) {
        const m = msg as Record<string, unknown>;
        const type = (m['type'] as string) ?? 'unknown';
        messages.push({
          from: m['from'] as string,
          messageId: m['id'] as string,
          timestamp: m['timestamp'] as string,
          type: (['text', 'image', 'audio', 'document', 'interactive'].includes(type)
            ? type
            : 'unknown') as WhatsAppInboundMessage['type'],
          text: (m['text'] as Record<string, unknown>)?.['body'] as string | undefined,
        });
      }

      for (const status of ((value['statuses'] as unknown[]) ?? [])) {
        const s = status as Record<string, unknown>;
        statuses.push({
          messageId: s['id'] as string,
          status: s['status'] as WhatsAppStatusUpdate['status'],
          timestamp: s['timestamp'] as string,
          recipientId: s['recipient_id'] as string,
        });
      }
    }
  }

  return { phoneNumberId, messages, statuses };
}

export const whatsAppProvider = {
  /**
   * Sends a text message to a WhatsApp number.
   * Retrieves the API token from encrypted credentials for the given workspace.
   */
  async sendText(workspaceId: string, to: string, text: string): Promise<string> {
    const credentials = await credentialService.getCredentials(workspaceId, 'whatsapp');
    const { accessToken, phoneNumberId } = credentials as {
      accessToken?: string;
      phoneNumberId?: string;
    };

    if (!accessToken || !phoneNumberId) {
      throw new Error('WhatsApp not fully configured for this workspace');
    }

    const body = {
      messaging_product: 'whatsapp',
      to,
      type: 'text',
      text: { body: text },
    };

    const response = await fetch(`${GRAPH_API_BASE}/${phoneNumberId}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const err = await response.text();
      logger.error({ workspaceId, err }, 'WhatsApp sendText failed');
      throw new Error(`WhatsApp API error: ${err}`);
    }

    const data = (await response.json()) as { messages?: [{ id: string }] };
    return data.messages?.[0]?.id ?? '';
  },

  /**
   * Sends a media message (image, document, audio, video) by URL.
   */
  async sendMedia(
    workspaceId: string,
    to: string,
    mediaType: 'image' | 'document' | 'audio' | 'video',
    mediaUrl: string,
    caption?: string,
  ): Promise<string> {
    const credentials = await credentialService.getCredentials(workspaceId, 'whatsapp');
    const { accessToken, phoneNumberId } = credentials as {
      accessToken?: string;
      phoneNumberId?: string;
    };

    if (!accessToken || !phoneNumberId) {
      throw new Error('WhatsApp not fully configured for this workspace');
    }

    const body = {
      messaging_product: 'whatsapp',
      to,
      type: mediaType,
      [mediaType]: { link: mediaUrl, ...(caption ? { caption } : {}) },
    };

    const response = await fetch(`${GRAPH_API_BASE}/${phoneNumberId}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`WhatsApp API error: ${err}`);
    }

    const data = (await response.json()) as { messages?: [{ id: string }] };
    return data.messages?.[0]?.id ?? '';
  },
};
