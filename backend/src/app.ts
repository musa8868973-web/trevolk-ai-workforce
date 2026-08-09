import { errorHandlerMiddleware, notFoundMiddleware, requestId } from '@common/middlewares';
import { appConfig } from '@config/index';
import { v1Router } from '@routes/index';
import { httpLogger } from '@shared/logger';
import compression from 'compression';
import cors from 'cors';
import express, { type Application } from 'express';
import helmet from 'helmet';

/**
 * Builds and configures the Express application.
 *
 * Kept separate from `server.ts` so the app instance can be imported
 * directly in tests (e.g., with supertest) without binding a real port.
 */
export function createApp(): Application {
  const app = express();

  // Trust the first proxy hop (load balancer / reverse proxy in production)
  // so `req.ip` and `req.secure` reflect the real client, not the proxy.
  app.set('trust proxy', 1);

  // --- Request correlation --------------------------------------------
  app.use(requestId);

  // --- Security ----------------------------------------------------------
  app.use(helmet());
  app.use(
    cors({
      origin: appConfig.cors.origin,
      credentials: true,
    }),
  );

  // --- Performance ---------------------------------------------------------
  app.use(compression());

  // --- Body parsing --------------------------------------------------------
  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true, limit: '2mb' }));

  // --- Observability ---------------------------------------------------
  app.use(httpLogger);

  // --- Routes --------------------------------------------------------------
  app.use(appConfig.app.apiPrefix, v1Router);

  // --- 404 + centralized error handling (must be registered last) --------
  app.use(notFoundMiddleware);
  app.use(errorHandlerMiddleware);

  return app;
}
