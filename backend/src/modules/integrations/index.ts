// backend/src/modules/integrations/index.ts
export { integrationRoutes } from './routes/integration.routes';
export { credentialService } from './services/credential.service';
export { tokenService } from './services/token.service';
export { whatsAppProvider } from './providers/whatsapp/whatsapp.provider';
export { emailProvider } from './providers/email/email.provider';
export { calendarProvider } from './providers/calendar/calendar.provider';
export { stripeProvider } from './providers/stripe/stripe.provider';
export { genericWebhookProvider } from './providers/generic/generic-webhook.provider';
export { webhookEventService } from './services/webhook-event.service';
export { initializeIntegrationWorkers, closeIntegrationWorkers } from './jobs/integration-workers';
export { executeAgentTool, integrationToolsRegistry } from './tools/integration-tools';
export { messagingAdapter, calendarAdapter, paymentAdapter } from './providers/adapters';
