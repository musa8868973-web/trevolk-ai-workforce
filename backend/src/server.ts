import type { Server } from 'http';

import { appConfig } from '@config/index';
import { disconnectPrisma } from '@database/index';
import { logger } from '@shared/logger';

import { createApp } from './app';

const app = createApp();

const server: Server = app.listen(appConfig.app.port, () => {
  logger.info(
    {
      port: appConfig.app.port,
      env: appConfig.env,
      apiPrefix: appConfig.app.apiPrefix,
    },
    `🚀 ${appConfig.app.name} listening on port ${appConfig.app.port} [${appConfig.env}]`,
  );
});

/**
 * Gracefully shuts the HTTP server down on termination signals, giving
 * in-flight requests a chance to finish before the process exits. Also
 * closes the Prisma connection pool so the process doesn't leave dangling
 * database connections behind. Future phases should extend this to also
 * close any background job queue connections (Redis/BullMQ).
 */
function gracefulShutdown(signal: string): void {
  logger.warn(`Received ${signal}. Starting graceful shutdown...`);

  server.close((err) => {
    if (err) {
      logger.error({ err }, 'Error during server shutdown');
      process.exit(1);
    }

    disconnectPrisma()
      .catch((prismaErr: unknown) => {
        logger.error({ err: prismaErr }, 'Error disconnecting Prisma client');
      })
      .finally(() => {
        logger.info('Server closed gracefully. Goodbye 👋');
        process.exit(0);
      });
  });

  // Force-exit if shutdown hangs (e.g., a connection never releases).
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10_000).unref();
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

process.on('unhandledRejection', (reason) => {
  logger.error({ reason }, 'Unhandled Promise Rejection');
});

process.on('uncaughtException', (error) => {
  logger.error({ err: error }, 'Uncaught Exception — shutting down');
  process.exit(1);
});

export { server };
