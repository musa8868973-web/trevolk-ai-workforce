// backend/src/common/crypto/aes-gcm.ts
/**
 * AES-256-GCM encryption utilities for storing third-party integration
 * credentials (OAuth tokens, API keys, SMTP passwords, etc.) at rest.
 *
 * Encryption key must be exactly 32 bytes (64 hex chars) supplied via
 * the `INTEGRATION_ENCRYPTION_KEY` environment variable.
 *
 * Wire format (Base64-encoded combined string):
 *   [12-byte IV][16-byte auth tag][ciphertext]
 */
import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

const ALGORITHM = 'aes-256-gcm' as const;
const IV_LENGTH = 12; // 96-bit nonce (GCM standard recommendation)
const AUTH_TAG_LENGTH = 16;

/**
 * Derives the 32-byte key buffer from a 64-character hex env value.
 * Throws clearly if the env variable is missing or incorrectly sized.
 */
function getKey(): Buffer {
  const hex = process.env['INTEGRATION_ENCRYPTION_KEY'];
  if (!hex) {
    throw new Error('INTEGRATION_ENCRYPTION_KEY environment variable is not set');
  }
  const key = Buffer.from(hex, 'hex');
  if (key.length !== 32) {
    throw new Error(
      `INTEGRATION_ENCRYPTION_KEY must be 64 hex characters (32 bytes), got ${key.length} bytes`,
    );
  }
  return key;
}

/**
 * Encrypts a plaintext string using AES-256-GCM.
 * Returns a Base64-encoded string: [IV][AuthTag][Ciphertext]
 */
export function encrypt(plaintext: string): string {
  const key = getKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH });

  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();

  // Concatenate: IV (12) + AuthTag (16) + Ciphertext
  const combined = Buffer.concat([iv, authTag, encrypted]);
  return combined.toString('base64');
}

/**
 * Decrypts a Base64-encoded AES-256-GCM ciphertext produced by {@link encrypt}.
 * Throws if the tag does not verify (tampered data).
 */
export function decrypt(ciphertext: string): string {
  const key = getKey();
  const combined = Buffer.from(ciphertext, 'base64');

  const iv = combined.subarray(0, IV_LENGTH);
  const authTag = combined.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
  const encrypted = combined.subarray(IV_LENGTH + AUTH_TAG_LENGTH);

  const decipher = createDecipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH });
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return decrypted.toString('utf8');
}

/**
 * Encrypts a JSON-serialisable object.
 */
export function encryptJSON(data: unknown): string {
  return encrypt(JSON.stringify(data));
}

/**
 * Decrypts and JSON-parses a value previously encoded with {@link encryptJSON}.
 */
export function decryptJSON<T = unknown>(ciphertext: string): T {
  return JSON.parse(decrypt(ciphertext)) as T;
}
