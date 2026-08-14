// backend/src/modules/jobs/phase9-workers.ts
/**
 * Initializer & Manager for Phase 9 BullMQ Workers and Cron Repeatable Jobs.
 *
 * Workers:
 *  1. FollowUp Scan Worker (`followup:scan`) — runs every 30 minutes
 *  2. Workspace Digest Worker (`digest:send`) — runs daily at 08:00 UTC
 *  3. System Maintenance Worker (`maintenance:cleanup`) — runs daily at 03:00 UTC
 */

import { QUEUE_NAMES, getQueue } from '@common/queues/queue.factory';
import { getRedisConnection } from '@common/queues/redis.client';
import { logger } from '@shared/logger';

import { processDigestJob } from './processors/digest.processor';
import { processFollowupScanJob } from './processors/followup-scan.processor';
import { processMaintenanceJob } from './processors/maintenance.processor';

let _phase9Workers: any[] = [];

export async function initializePhase9Workers(): Promise<void> {
  if (!process.env['REDIS_URL']) {
    logger.info('Redis not configured (REDIS_URL missing). Phase 9 background workers skipped.');
    return;
  }

  // Lazy-load BullMQ Worker
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { Worker } = require('bullmq') as typeof import('bullmq');
  const connection = getRedisConnection();

  // 1. FollowUp Scan Worker
  const followupWorker = new Worker(
    QUEUE_NAMES.FOLLOWUP_SCAN,
    async (job: any) => {
      await processFollowupScanJob(job);
    },
    { connection },
  );

  // 2. Digest Worker
  const digestWorker = new Worker(
    QUEUE_NAMES.DIGEST_SEND,
    async (job: any) => {
      await processDigestJob(job);
    },
    { connection },
  );

  // 3. Maintenance Worker
  const maintenanceWorker = new Worker(
    QUEUE_NAMES.MAINTENANCE_CLEANUP,
    async (job: any) => {
      await processMaintenanceJob(job);
    },
    { connection },
  );

  _phase9Workers.push(followupWorker, digestWorker, maintenanceWorker);

  // Attach error logging handlers
  for (const w of _phase9Workers) {
    w.on('error', (err: Error) => {
      logger.error({ err, queue: w.name }, 'Phase 9 BullMQ worker error');
    });
    w.on('failed', (job: any, err: Error) => {
      logger.error({ err, jobId: job?.id, queue: w.name }, 'Phase 9 BullMQ job failed');
    });
  }

  // Schedule cron repeatable jobs
  try {
    const followupQueue = getQueue(QUEUE_NAMES.FOLLOWUP_SCAN);
    await followupQueue.add(
      'periodic-followup-scan',
      {},
      { repeat: { pattern: '*/30 * * * *' } } as any,
    );

    const digestQueue = getQueue(QUEUE_NAMES.DIGEST_SEND);
    await digestQueue.add(
      'daily-workspace-digest',
      {},
      { repeat: { pattern: '0 8 * * *' } } as any,
    );

    const maintenanceQueue = getQueue(QUEUE_NAMES.MAINTENANCE_CLEANUP);
    await maintenanceQueue.add(
      'daily-system-maintenance',
      {},
      { repeat: { pattern: '0 3 * * *' } } as any,
    );

    logger.info('⏰ Phase 9 cron repeatable jobs scheduled successfully');
  } catch (err: any) {
    logger.error({ err: err.message }, 'Failed to schedule Phase 9 cron repeatable jobs');
  }

  logger.info(
    { count: _phase9Workers.length },
    '🚀 Phase 9 background queue workers initialized successfully',
  );
}

export async function closePhase9Workers(): Promise<void> {
  if (_phase9Workers.length > 0) {
    await Promise.all(_phase9Workers.map((w) => w.close()));
    _phase9Workers = [];
    logger.info('Phase 9 background queue workers closed');
  }
}
