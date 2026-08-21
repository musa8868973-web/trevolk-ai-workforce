// backend/src/bootstrap.ts
/**
 * Bootstrap entry point for production.
 *
 * Registers a global uncaughtException handler with raw console.error
 * BEFORE any application module loads, so that import-time crashes
 * produce visible error output instead of a silent process death.
 *
 * Railway / Docker / PM2 should point to `dist/bootstrap.js`, not
 * `dist/server.js`.
 */

// eslint-disable-next-line no-console
console.log('[BOOT] Node process starting — loading server module...');

process.on('uncaughtException', (err) => {
  // eslint-disable-next-line no-console
  console.error('[BOOT] UNCAUGHT EXCEPTION:', err?.stack || err?.message || err);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  // eslint-disable-next-line no-console
  console.error('[BOOT] UNHANDLED REJECTION:', reason);
});

// Load the actual server — all app imports happen here.
// If any import throws, the uncaughtException handler above catches it.
try {
  require('./server');
} catch (err: any) {
  // eslint-disable-next-line no-console
  console.error('[BOOT] FATAL — server module failed to load:', err?.stack || err?.message || err);
  process.exit(1);
}
