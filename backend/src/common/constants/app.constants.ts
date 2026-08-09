/**
 * Miscellaneous, cross-cutting constants used throughout the backend.
 */
export const APP_CONSTANTS = {
  DEFAULT_PAGE: 1,
  DEFAULT_PAGE_LIMIT: 20,
  MAX_PAGE_LIMIT: 100,

  REQUEST_ID_HEADER: 'X-Request-Id',

  /** Generic timeout applied to outbound calls (LLM providers, integrations) in later phases. */
  DEFAULT_OUTBOUND_TIMEOUT_MS: 15_000,
} as const;
