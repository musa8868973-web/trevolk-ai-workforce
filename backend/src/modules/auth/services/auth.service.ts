import { WORKSPACE_ROLES } from '@common/constants';
import { ConflictError, UnauthorizedError } from '@common/errors';
import { prisma } from '@database/index';
import { logger } from '@shared/logger';
import { hashPassword, verifyPassword } from '@shared/security';

import {
  toSafeUser,
  toWorkspaceMembershipSummary,
  type SafeUser,
  type WorkspaceMembershipSummary,
} from '../mappers/user.mapper';
import type { LoginInput, RegisterInput } from '../validators/auth.schema';

import {
  issueTokenPair,
  revokeAllRefreshTokensForUser,
  revokeRefreshToken,
  rotateRefreshToken,
  type AuthTokens,
} from './token.service';

/**
 * Business logic for the Authentication module (Backend Specification
 * §5.1). Framework-agnostic — no `req`/`res` — so it can be unit tested in
 * isolation and reused outside an HTTP context if needed.
 */

export interface RegisterResult {
  user: SafeUser;
  workspace: WorkspaceMembershipSummary;
  tokens: AuthTokens;
}

export interface LoginResult {
  user: SafeUser;
  workspaces: WorkspaceMembershipSummary[];
  tokens: AuthTokens;
}

export interface CurrentUserResult {
  user: SafeUser;
  workspaces: WorkspaceMembershipSummary[];
}

/**
 * Precomputed once at module load and compared against on every failed
 * login lookup, so a "no such user" response takes roughly the same time
 * as a real password check — reduces (does not eliminate) the timing
 * signal an attacker could otherwise use for email enumeration.
 */
const DUMMY_PASSWORD_HASH = hashPassword('trevolk-dummy-password-for-constant-time-login-checks');

/**
 * Registers a new user and provisions their first Organization + Workspace
 * (as Owner), per Phase 3 spec §3 ("create the appropriate
 * organization/workspace relationship... assign the appropriate initial
 * role"). Wrapped in a single transaction so a failure partway through
 * never leaves an orphaned User/Organization/Workspace behind.
 */
async function register(input: RegisterInput): Promise<RegisterResult> {
  const existingUser = await prisma.user.findUnique({ where: { email: input.email } });

  if (existingUser) {
    throw new ConflictError('An account with this email already exists');
  }

  const passwordHash = hashPassword(input.password);
  const displayName = input.name?.trim() || undefined;
  const organizationName =
    input.organizationName?.trim() ||
    (displayName ? `${displayName}'s Organization` : `${input.email.split('@')[0]}'s Organization`);
  const workspaceName = `${organizationName} — Main Workspace`;

  const { user, membership } = await prisma.$transaction(async (tx) => {
    const createdUser = await tx.user.create({
      data: {
        email: input.email,
        name: displayName ?? null,
        passwordHash,
        status: 'ACTIVE',
      },
    });

    const organization = await tx.organization.create({
      data: {
        name: organizationName,
        ownerUserId: createdUser.id,
      },
    });

    const workspace = await tx.workspace.create({
      data: {
        organizationId: organization.id,
        name: workspaceName,
      },
    });

    const createdMembership = await tx.workspaceMember.create({
      data: {
        userId: createdUser.id,
        workspaceId: workspace.id,
        role: WORKSPACE_ROLES.OWNER,
        acceptedAt: new Date(),
      },
      include: { workspace: true },
    });

    return { user: createdUser, membership: createdMembership };
  });

  const tokens = await issueTokenPair({ id: user.id, email: user.email });

  logger.info({ userId: user.id, workspaceId: membership.workspaceId }, 'New user registered');

  return {
    user: toSafeUser(user),
    workspace: toWorkspaceMembershipSummary(membership),
    tokens,
  };
}

/**
 * Authenticates a user by email/password. Always throws the same
 * `UnauthorizedError` message regardless of whether the email exists, the
 * account has no local password, or the password was wrong — per Phase 3
 * spec §4 ("do not reveal whether the email exists... or the password was
 * incorrect").
 */
async function login(input: LoginInput): Promise<LoginResult> {
  const user = await prisma.user.findUnique({ where: { email: input.email } });

  if (!user || !user.passwordHash || user.deletedAt || user.status !== 'ACTIVE') {
    // Perform a real hash comparison even on a lookup miss, so timing
    // doesn't distinguish "no such account" from "wrong password".
    verifyPassword(input.password, DUMMY_PASSWORD_HASH);
    throw new UnauthorizedError('Invalid email or password');
  }

  const passwordIsValid = verifyPassword(input.password, user.passwordHash);

  if (!passwordIsValid) {
    throw new UnauthorizedError('Invalid email or password');
  }

  const [memberships] = await Promise.all([
    prisma.workspaceMember.findMany({ where: { userId: user.id }, include: { workspace: true } }),
    prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } }),
  ]);

  const tokens = await issueTokenPair({ id: user.id, email: user.email });

  logger.info({ userId: user.id }, 'User logged in');

  return {
    user: toSafeUser(user),
    workspaces: memberships
      .filter((membership) => !membership.workspace.deletedAt)
      .map((membership) => toWorkspaceMembershipSummary(membership)),
    tokens,
  };
}

/** Exchanges a valid, unrevoked refresh token for a new token pair (rotation). */
async function refresh(refreshToken: string): Promise<AuthTokens> {
  return rotateRefreshToken(refreshToken);
}

/**
 * Logs a user out. If a specific refresh token is presented, only that
 * session is revoked (single device); otherwise every active session for
 * the user is revoked (log out everywhere) — per Phase 3 spec §5, session
 * state must actually be invalidated server-side, not just acknowledged.
 */
async function logout(userId: string, refreshToken?: string): Promise<void> {
  if (refreshToken) {
    await revokeRefreshToken(refreshToken, userId);
  } else {
    await revokeAllRefreshTokensForUser(userId);
  }

  logger.info(
    { userId, scope: refreshToken ? 'single-session' : 'all-sessions' },
    'User logged out',
  );
}

/** Resolves the authenticated caller's profile and workspace memberships/roles for GET /auth/me. */
async function getCurrentUser(userId: string): Promise<CurrentUserResult> {
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user || user.deletedAt || user.status !== 'ACTIVE') {
    throw new UnauthorizedError('Account no longer exists or is inactive');
  }

  const memberships = await prisma.workspaceMember.findMany({
    where: { userId },
    include: { workspace: true },
  });

  return {
    user: toSafeUser(user),
    workspaces: memberships
      .filter((membership) => !membership.workspace.deletedAt)
      .map((membership) => toWorkspaceMembershipSummary(membership)),
  };
}

export const authService = { register, login, refresh, logout, getCurrentUser };
