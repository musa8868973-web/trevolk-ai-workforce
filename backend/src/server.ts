import type { Server } from 'http';

import { appConfig } from '@config/index';
import { closeRedisConnection } from '@common/queues/redis.client';
import { disconnectPrisma } from '@database/index';
import { logger } from '@shared/logger';

import { createApp } from './app';
import { initializeIntegrationWorkers, closeIntegrationWorkers } from '@modules/integrations';
import { initializeNotificationGateway, closeNotificationGateway } from '@modules/notifications';
import { initializePhase9Workers, closePhase9Workers } from '@modules/jobs';

logger.info(`[BOOT] Starting ${appConfig.app.name}...`);
logger.info(`[BOOT] PORT=${appConfig.app.port}, NODE_ENV=${appConfig.env}, API_PREFIX=${appConfig.app.apiPrefix}`);

let server: Server;

try {
  const app = createApp();
  logger.info('[BOOT] Express app created successfully');

  // Start HTTP server FIRST on 0.0.0.0 so health check probe passes immediately
  server = app.listen(Number(appConfig.app.port), '0.0.0.0', () => {
    logger.info(
      {
        port: appConfig.app.port,
        env: appConfig.env,
        apiPrefix: appConfig.app.apiPrefix,
      },
      `🚀 ${appConfig.app.name} listening on 0.0.0.0:${appConfig.app.port} [${appConfig.env}]`,
    );
  });

  server.on('error', (err) => {
    logger.error({ err }, '[BOOT] HTTP server error event fired');
    process.exit(1);
  });
} catch (err) {
  logger.error({ err }, '[BOOT] FATAL — failed to create Express app or start HTTP server');
  process.exit(1);
}

// Initialize Socket.io Real-Time Notification Gateway attached to HTTP server
try {
  initializeNotificationGateway(server);
} catch (err) {
  logger.error({ err }, 'Failed to initialize Notification Gateway (non-fatal, continuing)');
}

// Start background integration workers safely after server is listening
try {
  initializeIntegrationWorkers();
} catch (err) {
  logger.error({ err }, 'Failed to initialize Integration Workers (non-fatal, continuing)');
}

// Initialize Phase 9 Background Queue Workers & Cron Schedules safely
initializePhase9Workers().catch((err) => {
  logger.error({ err }, 'Failed to initialize Phase 9 background workers (non-fatal, continuing)');
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
