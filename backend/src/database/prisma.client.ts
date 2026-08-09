import { appConfig } from '@config/index';
import { PrismaClient } from '@prisma/client';
import { logger } from '@shared/logger';

/**
 * Centralized Prisma Client — the ONLY place in the backend that
 * constructs a `PrismaClient` instance, per Backend Specification §2.4 and
 * §3 ("This is the only layer with a Prisma client instance; all other
 * layers request data through service functions, never raw queries").
 *
 * Every other module must import `{ prisma }` from `@database/index`
 * rather than instantiating its own client.
 */

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

/**
 * Builds a new `PrismaClient`, wiring Prisma's query/error/warn events into
 * the app's own Pino logger so database activity shows up in the same
 * structured log stream as everything else (Backend Spec §9, "Logging").
 */
function createPrismaClient(): PrismaClient {
  const client = new PrismaClient({
    log: appConfig.isDevelopment
      ? [
          { emit: 'event', level: 'query' },
          { emit: 'event', level: 'warn' },
          { emit: 'event', level: 'error' },
        ]
      : [
          { emit: 'event', level: 'warn' },
          { emit: 'event', level: 'error' },
        ],
  });

  // `PrismaClient`'s event typings depend on the `log` config passed above
  // and don't narrow cleanly for a shared factory, so events are attached
  // with a minimal, explicit shape rather than importing Prisma's
  // conditional event types.
  type PrismaLogEvent = { message: string; target?: string; duration?: number };

  if (appConfig.isDevelopment) {
    (client as unknown as { $on: (event: string, cb: (e: PrismaLogEvent) => void) => void }).$on(
      'query',
      (e: PrismaLogEvent) => {
        logger.debug({ query: e.message, durationMs: e.duration }, 'Prisma query');
      },
    );
  }

  (client as unknown as { $on: (event: string, cb: (e: PrismaLogEvent) => void) => void }).$on(
    'warn',
    (e: PrismaLogEvent) => {
      logger.warn({ target: e.target }, e.message);
    },
  );

  (client as unknown as { $on: (event: string, cb: (e: PrismaLogEvent) => void) => void }).$on(
    'error',
    (e: PrismaLogEvent) => {
      logger.error({ target: e.target }, e.message);
    },
  );

  return client;
}

/**
 * In development, `ts-node`/`nodemon` reload modules on every file change.
 * Without caching the client on `globalThis`, each reload would open a new
 * connection pool against Postgres until the old ones are exhausted.
 * Caching on `global` is the standard Prisma-recommended pattern for this
 * (dev-safe behavior). In production/test, a single instance per process
 * is created normally.
 */
export const prisma: PrismaClient = appConfig.isProduction
  ? createPrismaClient()
  : (global.__prisma ??= createPrismaClient());

/**
 * Closes the Prisma connection pool gracefully. Called from `server.ts`'s
 * shutdown handler alongside closing the HTTP server.
 */
export async function disconnectPrisma(): Promise<void> {
  await prisma.$disconnect();
}

/**
 * Lightweight connectivity check — used by the health module to report
 * database reachability without leaking connection details to the client.
 */
export async function isDatabaseReachable(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    logger.error({ err: error }, 'Database connectivity check failed');
    return false;
  }
}
