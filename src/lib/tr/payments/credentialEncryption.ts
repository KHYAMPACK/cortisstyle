import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

/**
 * AES-256-GCM at rest for `tr_boutique_integrations.credentials_encrypted`.
 * Format: base64(iv[12] || authTag[16] || ciphertext).
 *
 * Key rotation: decrypt every row with the old TR_INTEGRATION_ENCRYPTION_KEY,
 * re-encrypt with the new one, then swap the env var. There is no key-version
 * column, so rotation must be one atomic pass across all rows before the old
 * key is discarded.
 */

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;
const KEY_LENGTH = 32;

function getEncryptionKey(): Buffer {
  const raw = process.env.TR_INTEGRATION_ENCRYPTION_KEY?.trim();
  if (!raw) {
    throw new Error("TR_INTEGRATION_ENCRYPTION_KEY is not configured.");
  }
  const key = Buffer.from(raw, "base64");
  if (key.length !== KEY_LENGTH) {
    throw new Error(
      `TR_INTEGRATION_ENCRYPTION_KEY must decode to ${KEY_LENGTH} bytes (got ${key.length}). Generate one with: openssl rand -base64 32`,
    );
  }
  return key;
}

/** Encrypt a JSON-serializable credentials payload for storage. */
export function encryptIntegrationCredentials(payload: unknown): string {
  const key = getEncryptionKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const plaintext = Buffer.from(JSON.stringify(payload), "utf8");
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return Buffer.concat([iv, authTag, ciphertext]).toString("base64");
}

/** Decrypt a value stored via `encryptIntegrationCredentials`. */
export function decryptIntegrationCredentials<T = unknown>(
  encrypted: string,
): T {
  const key = getEncryptionKey();
  const raw = Buffer.from(encrypted, "base64");
  const iv = raw.subarray(0, IV_LENGTH);
  const authTag = raw.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
  const ciphertext = raw.subarray(IV_LENGTH + AUTH_TAG_LENGTH);
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  const plaintext = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]);
  return JSON.parse(plaintext.toString("utf8")) as T;
}
