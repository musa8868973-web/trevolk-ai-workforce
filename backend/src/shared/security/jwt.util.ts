import { createHmac, timingSafeEqual } from 'crypto';

/**
 * Minimal HS256 JWT sign/verify implementation built on Node's built-in
 * `crypto` module — no third-party dependency, matching this environment's
 * "no new runtime dependencies unless required" constraint.
 *
 * Deliberately scoped to exactly what this backend needs (HMAC-SHA256
 * signing, `exp`/`iat` claims, simple duration strings) rather than a full
 * JWT/JOSE implementation.
 */

export class JwtError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'JwtError';
  }
}

type DurationUnit = 's' | 'm' | 'h' | 'd';

const DURATION_MULTIPLIERS_SECONDS: Record<DurationUnit, number> = {
  s: 1,
  m: 60,
  h: 60 * 60,
  d: 60 * 60 * 24,
};

/**
 * Parses simple duration strings (`"15m"`, `"1d"`, `"30d"`, `"3600"`) into a
 * number of seconds. Supports the same shorthand already used across the
 * backend's env configuration (`JWT_EXPIRES_IN`, `JWT_REFRESH_EXPIRES_IN`).
 */
export function parseDurationToSeconds(duration: string): number {
  const match = /^(\d+)\s*([smhd])?$/i.exec(duration.trim());

  if (!match) {
    throw new JwtError(`Invalid duration string: "${duration}"`);
  }

  const value = Number(match[1]);
  const unit = (match[2]?.toLowerCase() ?? 's') as DurationUnit;

  return value * DURATION_MULTIPLIERS_SECONDS[unit];
}

function base64UrlEncode(input: Buffer | string): string {
  return Buffer.from(input)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function base64UrlDecode(input: string): Buffer {
  const padded = input.replace(/-/g, '+').replace(/_/g, '/');
  const paddingNeeded = (4 - (padded.length % 4)) % 4;
  return Buffer.from(padded + '='.repeat(paddingNeeded), 'base64');
}

function sign(data: string, secret: string): string {
  return base64UrlEncode(createHmac('sha256', secret).update(data).digest());
}

export interface JwtPayload {
  sub: string;
  iat?: number;
  exp?: number;
  [claim: string]: unknown;
}

/**
 * Signs a JWT (HS256) with the given payload, secret, and expiry.
 * `iat`/`exp` are set automatically and should not be passed in `payload`.
 */
export function signJwt(
  payload: Record<string, unknown>,
  secret: string,
  expiresIn: string,
): string {
  const header = { alg: 'HS256', typ: 'JWT' };
  const nowSeconds = Math.floor(Date.now() / 1000);

  const fullPayload: JwtPayload = {
    ...payload,
    sub: String(payload.sub),
    iat: nowSeconds,
    exp: nowSeconds + parseDurationToSeconds(expiresIn),
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(fullPayload));
  const signingInput = `${encodedHeader}.${encodedPayload}`;
  const signature = sign(signingInput, secret);

  return `${signingInput}.${signature}`;
}

/**
 * Verifies a JWT's signature and expiry, returning its decoded payload.
 * Throws `JwtError` for any malformed, tampered, or expired token —
 * callers should treat any thrown error as "authentication failed" without
 * distinguishing the reason to the client.
 */
export function verifyJwt<TPayload extends JwtPayload = JwtPayload>(
  token: string,
  secret: string,
): TPayload {
  const parts = token.split('.');

  if (parts.length !== 3) {
    throw new JwtError('Malformed token');
  }

  const [encodedHeader, encodedPayload, encodedSignature] = parts as [string, string, string];
  const signingInput = `${encodedHeader}.${encodedPayload}`;
  const expectedSignature = sign(signingInput, secret);

  const providedBuffer = Buffer.from(encodedSignature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (
    providedBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(providedBuffer, expectedBuffer)
  ) {
    throw new JwtError('Invalid token signature');
  }

  let payload: TPayload;
  try {
    payload = JSON.parse(base64UrlDecode(encodedPayload).toString('utf8')) as TPayload;
  } catch {
    throw new JwtError('Invalid token payload');
  }

  if (typeof payload.exp === 'number' && Math.floor(Date.now() / 1000) >= payload.exp) {
    throw new JwtError('Token has expired');
  }

  return payload;
}
