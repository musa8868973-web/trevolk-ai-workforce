/**
 * AI Employee lifecycle/status values (Database Design §5.5, §7.2). This
 * is the single source of truth for every status badge shown across the
 * dashboard (Backend Specification §5.3, §7.2 — "the single source of
 * truth for every status badge").
 *
 * - NEEDS_SETUP — created but not yet configured/activated (default).
 * - ACTIVE — running and handling work for the workspace.
 * - PAUSED — deliberately deactivated by a user (reversible).
 * - NEEDS_ATTENTION — reserved for a future phase to flag a problem
 *   (e.g., an integration failure) without a human having paused it;
 *   included now only so the enum is stable, not actively set by this
 *   phase's service layer.
 */
export const AI_EMPLOYEE_STATUSES = {
  NEEDS_SETUP: 'NEEDS_SETUP',
  ACTIVE: 'ACTIVE',
  PAUSED: 'PAUSED',
  NEEDS_ATTENTION: 'NEEDS_ATTENTION',
} as const;

export type AIEmployeeStatus = (typeof AI_EMPLOYEE_STATUSES)[keyof typeof AI_EMPLOYEE_STATUSES];

/** All known AI Employee statuses, in no particular priority order. */
export const ALL_AI_EMPLOYEE_STATUSES: AIEmployeeStatus[] = Object.values(AI_EMPLOYEE_STATUSES);

/**
 * Statuses a caller may explicitly set via the API (Section 6 of the
 * Phase 5A spec only calls for activate/deactivate-style transitions).
 * `NEEDS_ATTENTION` is deliberately excluded — it is reserved for the
 * system itself (e.g., a future integration-health job) to set, not for
 * a user-initiated PATCH.
 */
export const USER_SETTABLE_AI_EMPLOYEE_STATUSES: AIEmployeeStatus[] = [
  AI_EMPLOYEE_STATUSES.ACTIVE,
  AI_EMPLOYEE_STATUSES.PAUSED,
  AI_EMPLOYEE_STATUSES.NEEDS_SETUP,
];
