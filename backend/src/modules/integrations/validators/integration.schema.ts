// backend/src/modules/integrations/validators/integration.schema.ts
import { z } from 'zod';

export const connectWhatsAppSchema = z.object({
  accessToken: z.string().min(1, 'Access token is required'),
  phoneNumberId: z.string().min(1, 'Phone number ID is required'),
  wabaId: z.string().optional(),
});

export const connectSMTPSchema = z.object({
  smtpHost: z.string().min(1, 'SMTP host is required'),
  smtpPort: z.coerce.number().int().positive().default(587),
  smtpUser: z.string().min(1, 'SMTP user is required'),
  smtpPassword: z.string().min(1, 'SMTP password is required'),
});

export const connectStripeSchema = z.object({
  apiKey: z.string().min(1, 'Stripe API key is required'),
  webhookSecret: z.string().min(1, 'Stripe webhook secret is required'),
});

export const configureGenericWebhooksSchema = z.object({
  subscriptions: z.array(
    z.object({
      targetUrl: z.string().url('Invalid webhook subscription URL'),
      secret: z.string().optional(),
      events: z.array(z.string()).min(1, 'At least one event type must be subscribed to'),
    }),
  ),
});

export const providerParamSchema = z.object({
  provider: z.enum(['whatsapp', 'gmail', 'google_calendar', 'stripe', 'generic_webhook']),
});

export const oauthCallbackQuerySchema = z.object({
  code: z.string().min(1, 'OAuth authorization code is required'),
  state: z.string().min(1, 'State (workspaceId) is required'),
});
