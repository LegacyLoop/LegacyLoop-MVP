// CMD-W26-B · AES-256-GCM encryption for Meta Page access tokens at rest.
//
// KMS-ready abstraction. Phase 1: TOKEN_ENCRYPTION_KEY material is loaded
// by id from env (`TOKEN_ENCRYPTION_KEY_ID` → `TOKEN_ENCRYPTION_KEY_<ID>_KEY`).
// Phase 2 (post-prod): swap `loadKeyMaterial` body for KMS Decrypt of a sealed
// data-key — call sites do not change.
//
// Wire format (versioned · base64url):
//   v1:<iv_b64>:<tag_b64>:<ciphertext_b64>:<key_id>
//
// Constraints:
// - NEVER log plaintext.
// - NEVER persist plaintext (caller decrypts only at moment of API call).
// - Distinct key id per environment (dev / preview / prod).

import { createCipheriv, randomBytes } from "node:crypto";

const FORMAT_VERSION = "v1";
const ALGO = "aes-256-gcm";
const IV_LEN = 12; // 96-bit GCM nonce
const KEY_LEN = 32; // 256-bit key

export class TokenEncryptError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TokenEncryptError";
  }
}

export interface EncryptedPayload {
  /** Versioned · base64url ciphertext bundle. Safe to store in JSON. */
  ciphertext: string;
  /** Key id used. Persisted so future rotations can decrypt prior payloads. */
  keyId: string;
}

/**
 * Load the raw 32-byte symmetric key for `keyId` from environment.
 * Convention: `TOKEN_ENCRYPTION_KEY_<ID>` holds base64-encoded 32 bytes.
 *
 * Phase 2: replace body with KMS Decrypt of a sealed data-key by id.
 * Call sites do not change.
 */
export function loadKeyMaterial(keyId: string): Buffer {
  if (!/^[A-Za-z0-9_-]{1,64}$/.test(keyId)) {
    throw new TokenEncryptError("Invalid TOKEN_ENCRYPTION_KEY_ID format");
  }
  const envName = `TOKEN_ENCRYPTION_KEY_${keyId}`;
  const raw = process.env[envName];
  if (!raw) {
    throw new TokenEncryptError(`Missing ${envName} (key material for ${keyId})`);
  }
  let buf: Buffer;
  try {
    buf = Buffer.from(raw, "base64");
  } catch {
    throw new TokenEncryptError(`${envName} not base64`);
  }
  if (buf.length !== KEY_LEN) {
    throw new TokenEncryptError(`${envName} decodes to ${buf.length} bytes; need ${KEY_LEN}`);
  }
  return buf;
}

function activeKeyId(): string {
  const id = process.env.TOKEN_ENCRYPTION_KEY_ID;
  if (!id) throw new TokenEncryptError("TOKEN_ENCRYPTION_KEY_ID not set");
  return id;
}

function b64url(buf: Buffer): string {
  return buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/**
 * Encrypt a Meta Page access token (or any short-lived secret string) under
 * the current active key. Result is a single versioned string ready for JSON.
 *
 * Throws TokenEncryptError on misconfiguration. Never logs the plaintext.
 */
export function encryptPageToken(plaintext: string): EncryptedPayload {
  if (typeof plaintext !== "string" || plaintext.length === 0) {
    throw new TokenEncryptError("plaintext must be non-empty string");
  }
  const keyId = activeKeyId();
  const key = loadKeyMaterial(keyId);

  const iv = randomBytes(IV_LEN);
  const cipher = createCipheriv(ALGO, key, iv);
  const enc = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  const bundle = [FORMAT_VERSION, b64url(iv), b64url(tag), b64url(enc), keyId].join(":");
  return { ciphertext: bundle, keyId };
}
