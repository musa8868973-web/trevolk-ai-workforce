import { z } from 'zod';

/**
 * Reasonable, non-extreme password requirements (Phase 3 spec §12):
 * minimum length plus a mix of letters and numbers — not composition
 * rules onerous enough to push people toward predictable substitutions.
 */
const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters long')
  .max(72, 'Password must be at most 72 characters long')
  .regex(/[A-Za-z]/, 'Password must contain at least one letter')
  .regex(/[0-9]/, 'Password must contain at least one number');

const emailSchema = z.string().trim().toLowerCase().email('A valid email address is required');

export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  name: z.string().trim().min(1).max(120).optional(),
  /**
   * Registration also provisions the caller's first Organization +
   * Workspace (Owner role) — see `auth.service.ts`. Defaults to a name
   * derived from the caller when omitted so a bare email/password sign-up
   * still works end-to-end.
   */
  organizationName: z.string().trim().min(1).max(160).optional(),
});
export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(10, 'A valid refresh token is required'),
});
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;

export const logoutSchema = z.object({
  /** Omit to revoke every active session for the caller. */
  refreshToken: z.string().min(10).optional(),
});
export type LogoutInput = z.infer<typeof logoutSchema>;
