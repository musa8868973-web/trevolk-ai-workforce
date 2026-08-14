// backend/src/modules/integrations/controller/integration.controller.ts
import { ForbiddenError, NotFoundError } from '@common/errors';
import { sendSuccess } from '@common/response';
import type { Request, Response } from 'express';
import { credentialService, type IntegrationProvider } from '../services/credential.service';
import { buildGmailOAuthUrl, exchangeGmailCode } from '../providers/email/email.provider';
import { prisma } from '@database/index';
import { logger } from '@shared/logger';
import { parseWhatsAppWebhook } from '../providers/whatsapp/whatsapp.provider';

function requireWorkspaceId(req: Request): string {
  if (!req.workspace) {
    throw new ForbiddenError('Workspace context is required');
  }
  return req.workspace.workspaceId;
}

export const integrationController = {
  async list(req: Request, res: Response): Promise<void> {
    const workspaceId = requireWorkspaceId(req);
    const integrations = await credentialService.listIntegrations(workspaceId);
    sendSuccess(res, { data: integrations });
  },

  async getStatus(req: Request, res: Response): Promise<void> {
    const workspaceId = requireWorkspaceId(req);
    const { provider } = req.params as { provider: IntegrationProvider };
    const integration = await credentialService.findIntegration(workspaceId, provider);
    if (!integration) {
      throw new NotFoundError(`Integration for ${provider} not found`);
    }
    sendSuccess(res, { data: integration });
  },

  async connectWhatsApp(req: Request, res: Response): Promise<void> {
    const workspaceId = requireWorkspaceId(req);
    const userId = (req as any).user?.id;
    const body = req.body as { accessToken: string; phoneNumberId: string; wabaId?: string };

    const integration = await credentialService.upsertCredentials(
      workspaceId,
      'whatsapp',
      body,
      userId,
      { phoneNumberId: body.phoneNumberId, wabaId: body.wabaId },
    );

    sendSuccess(res, { data: integration, message: 'WhatsApp integration connected successfully' });
  },

  async connectSMTP(req: Request, res: Response): Promise<void> {
    const workspaceId = requireWorkspaceId(req);
    const userId = (req as any).user?.id;
    const body = req.body as {
      smtpHost: string;
      smtpPort: number;
      smtpUser: string;
      smtpPassword?: string;
    };

    const integration = await credentialService.upsertCredentials(
      workspaceId,
      'gmail', // Use 'gmail' provider key for general email integration config
      body,
      userId,
      { smtpHost: body.smtpHost, smtpPort: body.smtpPort, smtpUser: body.smtpUser },
    );

    sendSuccess(res, { data: integration, message: 'SMTP email integration connected successfully' });
  },

  async connectStripe(req: Request, res: Response): Promise<void> {
    const workspaceId = requireWorkspaceId(req);
    const userId = (req as any).user?.id;
    const body = req.body as { apiKey: string; webhookSecret: string };

    const integration = await credentialService.upsertCredentials(
      workspaceId,
      'stripe',
      body,
      userId,
      { stripeWebhookConfigured: true },
    );

    sendSuccess(res, { data: integration, message: 'Stripe integration connected successfully' });
  },

  async configureGenericWebhooks(req: Request, res: Response): Promise<void> {
    const workspaceId = requireWorkspaceId(req);
    const userId = (req as any).user?.id;
    const body = req.body as { subscriptions: Array<{ targetUrl: string; secret?: string; events: string[] }> };

    const integration = await credentialService.upsertCredentials(
      workspaceId,
      'generic_webhook',
      body,
      userId,
      { subscriptionCount: body.subscriptions.length },
    );

    sendSuccess(res, { data: integration, message: 'Generic webhooks configured successfully' });
  },

  async disconnect(req: Request, res: Response): Promise<void> {
    const workspaceId = requireWorkspaceId(req);
    const { provider } = req.params as { provider: IntegrationProvider };

    await credentialService.disconnect(workspaceId, provider);
    sendSuccess(res, { data: null, message: `${provider} integration disconnected successfully` });
  },

  async getGmailAuthUrl(req: Request, res: Response): Promise<void> {
    const workspaceId = requireWorkspaceId(req);
    const clientId = process.env['GOOGLE_CLIENT_ID'];
    const clientSecret = process.env['GOOGLE_CLIENT_SECRET'];
    const redirectUri = process.env['GOOGLE_REDIRECT_URI'];

    if (!clientId || !clientSecret || !redirectUri) {
      throw new Error('Google OAuth credentials not configured on backend server');
    }

    const url = buildGmailOAuthUrl({ clientId, clientSecret, redirectUri }, workspaceId);
    sendSuccess(res, { data: { url } });
  },

  async handleGmailCallback(req: Request, res: Response): Promise<void> {
    const { code, state: workspaceId } = req.query as { code: string; state: string };
    const userId = (req as any).user?.id;

    if (!userId) {
      throw new ForbiddenError('User authentication required for OAuth callback processing');
    }

    await exchangeGmailCode(workspaceId, code, userId);

    res.status(200).send('<h3>Gmail integrated successfully! You can close this window.</h3>');
  },

  /**
   * Unified public webhook endpoints for Meta WhatsApp webhooks.
   * Handles verification challenge and normal inbound payload verification.
   */
  async handleWhatsAppWebhook(req: Request, res: Response): Promise<void> {
    // Challenge verification (GET)
    if (req.method === 'GET') {
      const mode = req.query['hub.mode'];
      const token = req.query['hub.verify_token'];
      const challenge = req.query['hub.challenge'];

      const expectedToken = process.env['WHATSAPP_VERIFY_TOKEN'];

      if (mode === 'subscribe' && token === expectedToken) {
        res.status(200).send(challenge);
        return;
      }
      res.status(403).send('Forbidden');
      return;
    }

    // Inbound payload processing (POST)
    const parsed = parseWhatsAppWebhook(req.body);
    if (!parsed) {
      res.status(200).send('EVENT_RECEIVED');
      return;
    }

    // Match parsed phoneNumberId to active integration workspaceId
    const integration = await prisma.integration.findFirst({
      where: {
        provider: 'whatsapp',
        status: 'CONNECTED',
        metadata: {
          contains: parsed.phoneNumberId,
        },
      },
    });

    if (!integration) {
      logger.warn({ phoneNumberId: parsed.phoneNumberId }, 'WhatsApp message received for unconfigured phoneNumberId');
      res.status(200).send('EVENT_RECEIVED');
      return;
    }

    // Enqueue parsed messages to Background Queue (BullMQ)
    // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
    const { enqueueJob, QUEUE_NAMES } = require('@common/queues/queue.factory');
    for (const message of parsed.messages) {
      await enqueueJob(QUEUE_NAMES.WHATSAPP_INBOUND, 'whatsapp:inbound', {
        workspaceId: integration.workspaceId,
        message,
      });
    }

    logger.info(
      { workspaceId: integration.workspaceId, count: parsed.messages.length },
      'WhatsApp inbound messages queued successfully',
    );

    res.status(200).send('EVENT_RECEIVED');
  },

  /**
   * Stripe webhook processor
   */
  async handleStripeWebhook(req: Request, res: Response): Promise<void> {
    const signature = req.headers['stripe-signature'] as string | undefined;

    if (!signature) {
      res.status(400).send('Signature verification failed: Missing stripe-signature header');
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
    const Stripe = require('stripe') as typeof import('stripe');
    const stripe = new Stripe(process.env['STRIPE_SECRET'] || 'sk_test_dummy', { apiVersion: '2023-10-16' as any });

    // 1. Strict Multi-Tenant Boundary: Find which workspace this Stripe event belongs to
    // We scan all connected Stripe integrations and check if signature validates with their webhook secret
    const integrations = await prisma.integration.findMany({
      where: { provider: 'stripe', status: 'CONNECTED' },
    });

    let verifiedWorkspaceId: string | null = null;
    let stripeEvent: any = null;
    const rawBody = (req as any).rawBody || req.body;

    for (const integration of integrations) {
      try {
        const credentials = await credentialService.getCredentials(integration.workspaceId, 'stripe');
        const secret = credentials.webhookSecret || process.env['STRIPE_WEBHOOK_SECRET'];
        if (secret) {
          stripeEvent = stripe.webhooks.constructEvent(rawBody, signature, secret);
          verifiedWorkspaceId = integration.workspaceId;
          break; // Successfully verified signature using this workspace's credentials!
        }
      } catch (err) {
        // Try next workspace integration
      }
    }

    // Fallback using global environment variable secret
    if (!verifiedWorkspaceId || !stripeEvent) {
      try {
        const secret = process.env['STRIPE_WEBHOOK_SECRET'];
        if (secret) {
          stripeEvent = stripe.webhooks.constructEvent(rawBody, signature, secret);
          const fallbackInt = integrations[0];
          verifiedWorkspaceId = fallbackInt ? fallbackInt.workspaceId : 'global';
        }
      } catch (err: any) {
        logger.error({ err }, 'Stripe Webhook global verification failed');
        res.status(400).send(`Webhook Error: ${err.message}`);
        return;
      }
    }

    if (!verifiedWorkspaceId || !stripeEvent) {
      res.status(400).send('Webhook Error: Unmatched workspace or invalid signature');
      return;
    }

    logger.info(
      { eventType: stripeEvent.type, id: stripeEvent.id, workspaceId: verifiedWorkspaceId },
      'Received Stripe Webhook Event',
    );

    // Enqueue event to STRIPE_WEBHOOK queue for background worker processing
    // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
    const { enqueueJob, QUEUE_NAMES } = require('@common/queues/queue.factory');
    await enqueueJob(QUEUE_NAMES.STRIPE_WEBHOOK, 'stripe:webhook', {
      workspaceId: verifiedWorkspaceId,
      event: {
        id: stripeEvent.id,
        type: stripeEvent.type,
        data: {
          object: {
            id: stripeEvent.data.object.id,
            customer: stripeEvent.data.object.customer,
            customer_details: stripeEvent.data.object.customer_details,
            customer_email: stripeEvent.data.object.customer_email,
            subscription: stripeEvent.data.object.subscription,
          },
        },
      },
    });

    res.status(200).json({ received: true });
  },

  /**
   * CRM Lead Webhook processor (HubSpot / Zapier custom ingestion)
   */
  async handleCrmWebhook(req: Request, res: Response): Promise<void> {
    const { workspaceId } = req.params;
    const payload = req.body;

    logger.info({ workspaceId }, 'Received CRM Inbound Webhook');

    // Enqueue payload to GENERIC_WEBHOOK queue for background worker processing
    // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
    const { enqueueJob, QUEUE_NAMES } = require('@common/queues/queue.factory');
    await enqueueJob(QUEUE_NAMES.GENERIC_WEBHOOK, 'generic:webhook', {
      workspaceId,
      payload,
    });

    sendSuccess(res, { data: null, message: 'CRM webhook event queued successfully' });
  },
};
