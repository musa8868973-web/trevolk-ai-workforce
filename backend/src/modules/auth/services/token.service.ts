import { UnauthorizedError } from '@common/errors';
import { appConfig } from '@config/index';
import { prisma } from '@database/index';
import {
  JwtError,
  parseDurationToSeconds,
  signJwt,
  verifyJwt,
  type JwtPayload,
} from '@shared/security';

/**
 * Token issuance and verification for the authentication module.
 *
 * Strategy (Backend Specification §2.5, Phase 3 spec §13):
 * - **Access token** — short-lived, stateless JWT (`JWT_SECRET`). Verified
 *   directly by `requireAuth` with no database round-trip.
 * - **Refresh token** — longer-lived JWT (`JWT_REFRESH_SECRET`) whose
 *   `jti` claim maps 1:1 to a `RefreshToken` database row. This is what
 *   makes revocation (logout) and rotation possible: the JWT alone proves
 *   *who*, the database row proves *still valid*.
 *
 * Every successful refresh rotates the token (old one revoked, new one
 * issued) to limit the blast radius of a leaked refresh token.
 */

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  /** Access token lifetime, in seconds — informational, for API consumers. */
  expiresIn: number;
}

interface RefreshTokenPayload extends JwtPayload {
  sub: string;
  jti: string;
  type: 'refresh';
}

/** Issues a new access + refresh token pair for a user, persisting the refresh token's session row. */
export async function issueTokenPair(user: { id: string; email: string }): Promise<AuthTokens> {
  const accessToken = signJwt(
    { sub: user.id, email: user.email, type: 'access' },
    appConfig.auth.jwt.secret,
    appConfig.auth.jwt.expiresIn,
  );

  const refreshTokenRecord = await prisma.refreshToken.create({
    data: {
      userId: user.id,
      expiresAt: new Date(
        Date.now() + parseDurationToSeconds(appConfig.auth.jwt.refreshExpiresIn) * 1000,
      ),
    },
  });

  const refreshToken = signJwt(
    { sub: user.id, jti: refreshTokenRecord.id, type: 'refresh' },
    appConfig.auth.jwt.refreshSecret,
    appConfig.auth.jwt.refreshExpiresIn,
  );

  return {
    accessToken,
    refreshToken,
    expiresIn: parseDurationToSeconds(appConfig.auth.jwt.expiresIn),
  };
}

/**
 * Verifies a refresh token's signature/expiry AND that its backing session
 * row is still valid (exists, not revoked, not expired), then rotates it:
 * the presented token is revoked and a fresh pair is issued.
 *
 * Throws `UnauthorizedError` for any invalid/expired/revoked/mismatched
 * token — deliberately generic, matching the login endpoint's
 * no-enumeration posture.
 */
export async function rotateRefreshToken(rawRefreshToken: string): Promise<AuthTokens> {
  let payload: RefreshTokenPayload;

  try {
    payload = verifyJwt<RefreshTokenPayload>(rawRefreshToken, appConfig.auth.jwt.refreshSecret);
  } catch (error) {
    if (error instanceof JwtError) {
      throw new UnauthorizedError('Invalid or expired refresh token');
    }
    throw error;
  }

  if (payload.type !== 'refresh' || !payload.jti) {
    throw new UnauthorizedError('Invalid refresh token');
  }

  const tokenRecord = await prisma.refreshToken.findUnique({
    where: { id: payload.jti },
    include: { user: true },
  });

  if (
    !tokenRecord ||
    tokenRecord.userId !== payload.sub ||
    tokenRecord.revokedAt !== null ||
    tokenRecord.expiresAt.getTime() <= Date.now() ||
    tokenRecord.user.deletedAt !== null ||
    tokenRecord.user.status !== 'ACTIVE'
  ) {
    throw new UnauthorizedError('Invalid or expired refresh token');
  }

  // Rotate: revoke the presented token before issuing a replacement so a
  // leaked-but-already-used refresh token can't be replayed.
  await prisma.refreshToken.update({
    where: { id: tokenRecord.id },
    data: { revokedAt: new Date() },
  });

  return issueTokenPair({ id: tokenRecord.user.id, email: tokenRecord.user.email });
}

/**
 * Revokes a single refresh token (used by logout when a specific device's
 * token is presented). Best-effort and idempotent — an already-revoked,
 * unknown, or malformed token is treated as "already logged out" rather
 * than surfaced as an error, since logout should never fail loudly.
 */
export async function revokeRefreshToken(
  rawRefreshToken: string,
  expectedUserId: string,
): Promise<void> {
  let payload: RefreshTokenPayload;

  try {
    payload = verifyJwt<RefreshTokenPayload>(rawRefreshToken, appConfig.auth.jwt.refreshSecret);
  } catch {
    return;
  }

  if (payload.type !== 'refresh' || !payload.jti || payload.sub !== expectedUserId) {
    return;
  }

  await prisma.refreshToken.updateMany({
    where: { id: payload.jti, userId: expectedUserId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

/** Revokes every active refresh token for a user (logout of all sessions/devices). */
export async function revokeAllRefreshTokensForUser(userId: string): Promise<void> {
  await prisma.refreshToken.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}
