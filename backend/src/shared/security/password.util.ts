import { randomBytes, scryptSync, timingSafeEqual } from 'crypto';

/**
 * Password hashing built on Node's built-in `crypto.scrypt` — a memory-hard
 * key derivation function well-suited to password storage — rather than a
 * third-party dependency (e.g., bcrypt), per the Backend Specification's
 * stack (Node.js/TypeScript, no new runtime dependencies unless required).
 *
 * Storage format: `<saltHex>:<derivedKeyHex>`, so each password has a
 * unique random salt and no secret material beyond the hash itself needs
 * to be persisted separately.
 */

const SALT_LENGTH_BYTES = 16;
const KEY_LENGTH_BYTES = 64;

/**
 * Hashes a plaintext password with a fresh random salt.
 * Never store or log the plaintext password — only the return value.
 */
export function hashPassword(plainTextPassword: string): string {
  const salt = randomBytes(SALT_LENGTH_BYTES).toString('hex');
  const derivedKey = scryptSync(plainTextPassword, salt, KEY_LENGTH_BYTES).toString('hex');
  return `${salt}:${derivedKey}`;
}

/**
 * Verifies a plaintext password against a previously hashed value using a
 * constant-time comparison to avoid leaking timing information.
 */
export function verifyPassword(plainTextPassword: string, storedHash: string): boolean {
  const [salt, derivedKeyHex] = storedHash.split(':');

  if (!salt || !derivedKeyHex) {
    return false;
  }

  const storedKeyBuffer = Buffer.from(derivedKeyHex, 'hex');
  const candidateKeyBuffer = scryptSync(plainTextPassword, salt, KEY_LENGTH_BYTES);

  if (storedKeyBuffer.length !== candidateKeyBuffer.length) {
    return false;
  }

  return timingSafeEqual(storedKeyBuffer, candidateKeyBuffer);
}
