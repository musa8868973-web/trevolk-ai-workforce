import dotenv from 'dotenv';

import { envSchema } from './env.schema';

// Load .env before anything else in the process reads process.env.
dotenv.config();

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  // Intentionally uses console here — the logger itself depends on env being valid.
  // eslint-disable-next-line no-console
  console.error('❌ Invalid environment configuration:');
  // eslint-disable-next-line no-console
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

/**
 * Fully validated, typed environment variables.
 * Import this instead of touching `process.env` anywhere else in the codebase.
 */
export const env = parsed.data;
