// backend/src/common/queues/queue.factory.ts
/**
 * Creates and caches typed BullMQ Queues by name.
 * Business modules import this factory rather than instantiating Queues directly,
 * ensuring a single Queue instance per name per process.
 */
import type { JobsOptions } from 'bullmq';
import { getRedisConnection } from './redis.client';

type AnyQueue = InstanceType<typeof import('bullmq').Queue>;
const _queues = new Map<string, AnyQueue>();

export const QUEUE_NAMES = {
  WHATSAPP_SEND: 'whatsapp-send',
  WHATSAPP_INBOUND: 'whatsapp-inbound',
  EMAIL_SEND: 'email-send',
  CALENDAR_SYNC: 'calendar-sync',
  STRIPE_WEBHOOK: 'stripe-webhook',
  GENERIC_WEBHOOK: 'generic-webhook',
  FOLLOWUP_SCAN: 'followup-scan',
  DIGEST_SEND: 'digest-send',
  MAINTENANCE_CLEANUP: 'maintenance-cleanup',
} as const;

export type QueueName = (typeof QUEUE_NAMES)[keyof typeof QUEUE_NAMES];

export const DEFAULT_JOB_OPTIONS: JobsOptions = {
  attempts: 3,
  backoff: {
    type: 'exponential',
    delay: 2000,
  },
  removeOnComplete: { count: 100 },
  removeOnFail: { count: 500 },
};

/** Returns (or lazily creates) a typed BullMQ Queue for the given name. */
export function getQueue(name: QueueName): AnyQueue {
  if (_queues.has(name)) return _queues.get(name)!;

  // Lazy-load BullMQ so import doesn't fail when Redis isn't available
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { Queue } = require('bullmq') as typeof import('bullmq');
  const connection = getRedisConnection();
  const q = new Queue(name, { connection, defaultJobOptions: DEFAULT_JOB_OPTIONS });
  _queues.set(name, q);
  return q;
}

/** Enqueues a job; throws ServiceUnavailableError if Redis is unavailable. */
export async function enqueueJob<T extends object>(
  queueName: QueueName,
  jobName: string,
  data: T,
  opts?: JobsOptions,
): Promise<void> {
  const queue = getQueue(queueName);
  await queue.add(jobName, data, opts);
}
