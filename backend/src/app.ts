import {
  errorHandlerMiddleware,
  notFoundMiddleware,
  requestId,
  sanitizeInputsMiddleware,
} from '@common/middlewares';
import { appConfig } from '@config/index';
import { v1Router } from '@routes/index';
import { httpLogger } from '@shared/logger';
import compression from 'compression';
import cors from 'cors';
import express, { type Application } from 'express';
import helmet from 'helmet';

/**
 * Builds and configures the Express application.
 */
export function createApp(): Application {
  const app = express();

  // Disable x-powered-by header
  app.disable('x-powered-by');

  // Trust the first proxy hop
  app.set('trust proxy', 1);

  // --- Request correlation --------------------------------------------
  app.use(requestId);

  // --- Security ----------------------------------------------------------
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'", 'https:'],
          imgSrc: ["'self'", 'data:', 'https:'],
          connectSrc: ["'self'", 'wss:', 'https:'],
          fontSrc: ["'self'", 'https:', 'data:'],
          objectSrc: ["'none'"],
          mediaSrc: ["'self'", 'https:'],
          frameAncestors: ["'self'"],
        },
      },
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true,
      },
    }),
  );
  app.use(
    cors({
      origin: appConfig.cors.origin,
      credentials: true,
    }),
  );

  // --- Performance ---------------------------------------------------------
  app.use(compression());

  // --- Body parsing --------------------------------------------------------
  app.use(
    express.json({
      limit: '2mb',
      verify: (req: any, _res, buf) => {
        req.rawBody = buf;
      },
    }),
  );
  app.use(express.urlencoded({ extended: true, limit: '2mb' }));

  // --- Input Sanitization & Injection Defense ------------------------------
  app.use(sanitizeInputsMiddleware);

  // --- Observability ---------------------------------------------------
  app.use(httpLogger);

  // --- Routes --------------------------------------------------------------
  app.use(appConfig.app.apiPrefix, v1Router);

  // --- 404 + centralized error handling (must be registered last) --------
  app.use(notFoundMiddleware);
  app.use(errorHandlerMiddleware);

  return app;
}
