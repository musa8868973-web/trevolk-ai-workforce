// backend/src/modules/jobs/processors/maintenance.processor.ts
/**
 * System Maintenance Worker (`maintenance-queue`).
 *
 * Responsibilities:
 *  - Prunes expired auth refresh tokens (`expiresAt < now` or `revokedAt IS NOT NULL`).
 *  - Archives / deletes old AnalyticsEvent records older than 90 days.
 *  - Cleans read notifications older than 60 days to maintain database performance.
 */

import { prisma } from '@database/index';
import { logger } from '@shared/logger';

export async function processMaintenanceJob(job: any): Promise<void> {
  logger.info({ jobId: job.id }, 'Starting system maintenance cleanup job');

  const now = new Date();
  const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
  const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

  try {
    // 1. Clean expired / revoked refresh tokens
    const deletedTokens = await prisma.refreshToken.deleteMany({
      where: {
        OR: [
          { expiresAt: { lte: now } },
          { revokedAt: { not: null } },
        ],
      },
    });
    logger.info({ count: deletedTokens.count }, 'Pruned expired/revoked refresh tokens');

    // 2. Clean old analytics events (> 90 days)
    const deletedAnalytics = await prisma.analyticsEvent.deleteMany({
      where: {
        createdAt: { lte: ninetyDaysAgo },
      },
    });
    logger.info({ count: deletedAnalytics.count }, 'Pruned stale analytics events (>90 days)');

    // 3. Clean old read notifications (> 60 days)
    const deletedNotifications = await prisma.notification.deleteMany({
      where: {
        readAt: { lte: sixtyDaysAgo },
      },
    });
    logger.info({ count: deletedNotifications.count }, 'Pruned old read notifications (>60 days)');
  } catch (err: any) {
    logger.error({ err: err.message }, 'Error executing system maintenance cleanup job');
    throw err;
  }

  logger.info('System maintenance cleanup job completed successfully');
}
