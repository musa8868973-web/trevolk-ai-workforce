import { env } from './env';

/**
 * Centralized, structured application configuration.
 *
 * Every other layer of the backend (bootstrap, middleware, future modules)
 * should read configuration from here rather than importing `env` directly,
 * so the shape of configuration can evolve without touching call sites.
 */
export const appConfig = {
  env: env.NODE_ENV,
  isProduction: env.NODE_ENV === 'production',
  isDevelopment: env.NODE_ENV === 'development',
  isTest: env.NODE_ENV === 'test',

  app: {
    name: env.APP_NAME,
    port: Number(env.PORT) || 3000,
    apiPrefix: env.API_PREFIX,
  },

  logging: {
    level: env.LOG_LEVEL,
  },

  cors: {
    origin: env.CORS_ORIGIN.split(',').map((origin) => origin.trim()),
  },

  database: {
    url: env.DATABASE_URL,
  },

  redis: {
    url: env.REDIS_URL,
  },

  auth: {
    provider: env.AUTH_PROVIDER,
    providerApiKey: env.AUTH_PROVIDER_API_KEY,
    jwt: {
      secret: env.JWT_SECRET,
      expiresIn: env.JWT_EXPIRES_IN,
      refreshSecret: env.JWT_REFRESH_SECRET,
      refreshExpiresIn: env.JWT_REFRESH_EXPIRES_IN,
    },
  },

  aiProviders: {
    openai: { apiKey: env.OPENAI_API_KEY },
    groq: { apiKey: env.GROQ_API_KEY },
    gemini: { apiKey: env.GEMINI_API_KEY },
    claude: { apiKey: env.CLAUDE_API_KEY },
  },

  billing: {
    stripeSecret: env.STRIPE_SECRET,
    stripeWebhookSecret: env.STRIPE_WEBHOOK_SECRET,
  },

  google: {
    clientId: env.GOOGLE_CLIENT_ID,
    clientSecret: env.GOOGLE_CLIENT_SECRET,
    redirectUri: env.GOOGLE_REDIRECT_URI,
  },

  whatsapp: {
    token: env.WHATSAPP_TOKEN,
    phoneNumberId: env.WHATSAPP_PHONE_NUMBER_ID,
    verifyToken: env.WHATSAPP_VERIFY_TOKEN,
  },
} as const;

export type AppConfig = typeof appConfig;
