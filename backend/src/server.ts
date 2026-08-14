import type { Server } from 'http';

import { appConfig } from '@config/index';
import { closeRedisConnection } from '@common/queues/redis.client';
import { disconnectPrisma } from '@database/index';
import { logger } from '@shared/logger';

import { createApp } from './app';
import { initializeIntegrationWorkers, closeIntegrationWorkers } from '@modules/integrations';
import { initializeNotificationGateway, closeNotificationGateway } from '@modules/notifications';
import { initializePhase9Workers, closePhase9Workers } from '@modules/jobs';

const app = createApp();

// Start background integration workers
initializeIntegrationWorkers();

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

// Initialize Socket.io Real-Time Notification Gateway attached to HTTP server
initializeNotificationGateway(server);

// Initialize Phase 9 Background Queue Workers & Cron Schedules
initializePhase9Workers().catch((err) => {
  logger.error({ err }, 'Failed to initialize Phase 9 background workers');
});

/**
 * Gracefully shuts the HTTP server down on termination signals.
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
      .finally(async () => {
        try {
          await closeNotificationGateway();
          await closeIntegrationWorkers();
          await closePhase9Workers();
          await closeRedisConnection();
        } catch (workerErr) {
          logger.error({ err: workerErr }, 'Error closing background workers or gateway');
        }
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
