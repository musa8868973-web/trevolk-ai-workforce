/**
 * AI Employee types supported at MVP (Backend Specification §7.1, §5.3;
 * Database Design §5.5). Values match `AIEmployee.employeeType` exactly as
 * persisted in the database (see `prisma/schema.prisma` and
 * `prisma/seed.ts`), so the app layer never needs a translation step
 * between the two.
 *
 * Adding a fifth/sixth employee type (HR, Marketing, etc. — PRD §3.8) is a
 * data change: add a new value here and to the corresponding validator.
 * No other layer of this module needs to change.
 */
export const AI_EMPLOYEE_TYPES = {
  SALES: 'SALES',
  SUPPORT: 'SUPPORT',
  RECEPTIONIST: 'RECEPTIONIST',
  FOLLOW_UP: 'FOLLOW_UP',
} as const;

export type AIEmployeeType = (typeof AI_EMPLOYEE_TYPES)[keyof typeof AI_EMPLOYEE_TYPES];

/** All known AI Employee types, in no particular priority order. */
export const ALL_AI_EMPLOYEE_TYPES: AIEmployeeType[] = Object.values(AI_EMPLOYEE_TYPES);
