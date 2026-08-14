/**
 * Generic configuration foundation for an AI Employee (Phase 5A §8).
 *
 * This intentionally stays generic and employee-type-agnostic — it is the
 * shape every employee type's configuration is expected to extend in
 * later phases (Sales adds qualification questions, Receptionist adds
 * booking rules, etc.), not a complete prompt/behavior system.
 *
 * Persisted as-is in `AIEmployee.configuration` (jsonb-as-string on
 * SQLite — see `prisma/schema.prisma` and Database Design §7.1).
 *
 * SECURITY: this type — and the validator built on top of it
 * (`validators/ai-employee.schema.ts`) — must never accept API keys or
 * other provider credentials. Those live only in `config/env.ts` /
 * `appConfig.aiProviders`, loaded from environment variables, and are
 * never written to a workspace-editable record (Backend Specification
 * §2.7, §9; Phase 5A §8, §12).
 */
export interface AIEmployeeConfiguration {
  /** Which configured AI provider/model this employee should use (Phase 5A §9). Optional — resolved to a workspace/platform default when omitted. */
  aiProvider?: string;
  /** Non-secret model identifier for the selected provider (e.g. "gpt-4o-mini"). Never an API key. */
  aiModel?: string;
  /** Free-form system/role instructions for the employee. Full prompt templating/versioning is Phase 5A §7.2 / a later phase, not this one. */
  systemInstructions?: string;
  /** Employee behavior toggles (tone, escalation thresholds, etc.) — free-form at this phase; typed per employee type in a later phase. */
  behaviorSettings?: Record<string, unknown>;
  /** Names of tools/capabilities this employee instance is allowed to use (Phase 5A §10; Backend Specification §7.4). Enforcement of what each name means belongs to a later phase. */
  enabledCapabilities?: string[];
  /** Escape hatch for employee-type-specific settings not yet modeled (e.g., Sales qualification questions). Kept generic and validated only as JSON-serializable data — see `validators/ai-employee.schema.ts`. */
  [key: string]: unknown;
}
