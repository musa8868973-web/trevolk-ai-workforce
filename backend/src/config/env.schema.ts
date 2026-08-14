import { z } from 'zod';

/**
 * Schema describing every environment variable the backend depends on.
 *
 * Values for providers/integrations implemented in later phases (AI
 * providers, Stripe, Google, WhatsApp) remain optional strings here so the
 * app boots cleanly before those features exist. `JWT_SECRET` and
 * `JWT_REFRESH_SECRET` are now required and length-checked (Phase 3):
 * authentication is live and must never fall back to an empty/undefined
 * signing key.
 */
export const envSchema = z.object({
  // Application
  NODE_ENV: z.enum(['development', 'test', 'staging', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  API_PREFIX: z.string().default('/api/v1'),
  APP_NAME: z.string().default('trevolk-ai-workforce-backend'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),

  // CORS
  CORS_ORIGIN: z.string().default('http://localhost:3000'),

  // Database
  DATABASE_URL: z.string().optional(),

  // Authentication (Phase 3)
  JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 characters long'),
  JWT_EXPIRES_IN: z.string().default('1d'),
  JWT_REFRESH_SECRET: z.string().min(16, 'JWT_REFRESH_SECRET must be at least 16 characters long'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('30d'),

  // Redis / background jobs
  REDIS_URL: z.string().optional(),

  // AI providers
  OPENAI_API_KEY: z.string().optional(),
  GROQ_API_KEY: z.string().optional(),
  GEMINI_API_KEY: z.string().optional(),
  CLAUDE_API_KEY: z.string().optional(),

  // Billing
  STRIPE_SECRET: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),

  // Google
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GOOGLE_REDIRECT_URI: z.string().optional(),

  // WhatsApp
  WHATSAPP_TOKEN: z.string().optional(),
  WHATSAPP_PHONE_NUMBER_ID: z.string().optional(),
  WHATSAPP_VERIFY_TOKEN: z.string().optional(),

  // Managed auth provider
  AUTH_PROVIDER: z.enum(['clerk', 'supabase']).default('clerk'),
  AUTH_PROVIDER_API_KEY: z.string().optional(),

  // Integrations encryption key
  INTEGRATION_ENCRYPTION_KEY: z.string().length(64, 'INTEGRATION_ENCRYPTION_KEY must be exactly 64 hex characters').optional(),

  // System Emails
  PROJECT_EMAIL: z.string().email().default('trevolk.official@gmail.com'),
  DEFAULT_SYSTEM_EMAIL: z.string().email().default('trevolk.official@gmail.com'),
});

export type EnvSchema = z.infer<typeof envSchema>;
