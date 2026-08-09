/**
 * Small, dependency-free date/time helpers shared across the backend.
 * Kept intentionally minimal in Phase 1 — business-specific date logic
 * (working hours, appointment slot math) belongs in future domain services.
 */

/** Current time as an ISO-8601 string, used across logging and response envelopes. */
export function nowIso(): string {
  return new Date().toISOString();
}

/** Adds a number of days to a given date and returns a new Date instance. */
export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/** Adds a number of minutes to a given date and returns a new Date instance. */
export function addMinutes(date: Date, minutes: number): Date {
  const result = new Date(date);
  result.setMinutes(result.getMinutes() + minutes);
  return result;
}

/** Returns true if `date` has already passed relative to now. */
export function isPast(date: Date): boolean {
  return date.getTime() < Date.now();
}

/** Formats a Date as `YYYY-MM-DD` (useful for daily aggregation keys). */
export function toDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}
