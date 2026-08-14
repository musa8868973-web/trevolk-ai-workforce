// backend/src/modules/integrations/routes/integration.routes.ts
import { PERMISSIONS } from '@common/constants';
import { requireAuth, requirePermission, resolveWorkspace, validate, hmacValidator } from '@common/middlewares';
import { asyncHandler } from '@shared/utils';
import { Router } from 'express';
import { credentialService } from '../services/credential.service';

import { integrationController } from '../controller/integration.controller';
import {
  connectWhatsAppSchema,
  connectSMTPSchema,
  connectStripeSchema,
  configureGenericWebhooksSchema,
  providerParamSchema,
  oauthCallbackQuerySchema,
} from '../validators/integration.schema';

const router: Router = Router();

// ---------------------------------------------------------
// PUBLIC WEBHOOK & CALLBACK ENDPOINTS
// ---------------------------------------------------------

// WhatsApp webhook GET (verify challenge) and POST (receive message).
// Raw body is required for Meta HMAC signature verification if hmac validation is enabled.
router.route('/whatsapp/webhook')
  .get(asyncHandler(integrationController.handleWhatsAppWebhook))
  .post(
    // Conditionally apply HMAC validation if secret is configured globally
    async (req: any, res, next) => {
      const appSecret = process.env['WHATSAPP_APP_SECRET'];
      if (appSecret) {
        const validator = hmacValidator({
          secret: appSecret,
          header: 'x-hub-signature-256',
          prefix: 'sha256=',
        });
        return validator(req, res, next);
      }
      next();
    },
    asyncHandler(integrationController.handleWhatsAppWebhook)
  );

// Stripe webhook receives raw body directly
router.post(
  '/stripe/webhook',
  asyncHandler(integrationController.handleStripeWebhook)
);

// CRM custom lead ingestion webhook (HubSpot / Zapier / custom HTTP posts)
router.post(
  '/webhooks/:workspaceId/crm',
  // Conditionally apply HMAC validation if workspace-specific webhook secret is configured
  async (req: any, res, next) => {
    const { workspaceId } = req.params;
    try {
      let secret: string | undefined;
      try {
        const credentials = await credentialService.getCredentials(workspaceId, 'generic_webhook');
        secret = credentials.webhookSecret || (credentials.secret as string | undefined);
      } catch (err) {
        // Generic webhook credentials not configured yet, skip hmac validation
      }

      if (secret) {
        const validator = hmacValidator({
          secret,
          header: 'x-trevolk-signature',
          prefix: '',
        });
        return validator(req, res, next);
      }
      next();
    } catch (err) {
      next(err);
    }
  },
  asyncHandler(integrationController.handleCrmWebhook)
);

// Gmail OAuth Callback
router.get(
  '/gmail/callback',
  validate({ query: oauthCallbackQuerySchema }),
  asyncHandler(integrationController.handleGmailCallback)
);

// ---------------------------------------------------------
// PRIVATE CONFIGURATION ENDPOINTS (Workspace scoped)
// ---------------------------------------------------------

router.use(requireAuth, resolveWorkspace);

router.get('/', asyncHandler(integrationController.list));

router.get(
  '/gmail/auth-url',
  requirePermission(PERMISSIONS.INTEGRATION_MANAGE),
  asyncHandler(integrationController.getGmailAuthUrl)
);

router.get(
  '/:provider',
  validate({ params: providerParamSchema }),
  asyncHandler(integrationController.getStatus)
);

router.post(
  '/whatsapp',
  requirePermission(PERMISSIONS.INTEGRATION_MANAGE),
  validate({ body: connectWhatsAppSchema }),
  asyncHandler(integrationController.connectWhatsApp)
);

router.post(
  '/smtp',
  requirePermission(PERMISSIONS.INTEGRATION_MANAGE),
  validate({ body: connectSMTPSchema }),
  asyncHandler(integrationController.connectSMTP)
);

router.post(
  '/stripe',
  requirePermission(PERMISSIONS.INTEGRATION_MANAGE),
  validate({ body: connectStripeSchema }),
  asyncHandler(integrationController.connectStripe)
);

router.post(
  '/generic-webhooks',
  requirePermission(PERMISSIONS.INTEGRATION_MANAGE),
  validate({ body: configureGenericWebhooksSchema }),
  asyncHandler(integrationController.configureGenericWebhooks)
);

router.delete(
  '/:provider',
  requirePermission(PERMISSIONS.INTEGRATION_MANAGE),
  validate({ params: providerParamSchema }),
  asyncHandler(integrationController.disconnect)
);

export { router as integrationRoutes };
