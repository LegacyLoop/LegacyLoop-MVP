// CMD-W26-B · AES-256-GCM decryption counterpart to encrypt.ts.
//
// Reads the versioned bundle written by encryptPageToken and resolves the key
// id baked into the payload (NOT the current `TOKEN_ENCRYPTION_KEY_ID`) so
// prior payloads survive key rotation as long as old key material remains
// loadable.

import { createDecipheriv } from "node:crypto";
import { loadKeyMaterial, TokenEncryptError } from "./encrypt";

const FORMAT_VERSION = "v1";
const ALGO = "aes-256-gcm";

function b64urlDecode(s: string): Buffer {
  const pad = s.length % 4 === 0 ? "" : "=".repeat(4 - (s.length % 4));
  return Buffer.from(s.replace(/-/g, "+").replace(/_/g, "/") + pad, "base64");
}

/**
 * Decrypt a payload previously produced by encryptPageToken.
 * Throws TokenEncryptError on tampered ciphertext, format mismatch, or
 * missing key material. Never logs plaintext on failure.
 */
export function decryptPageToken(ciphertext: string): string {
  if (typeof ciphertext !== "string" || ciphertext.length === 0) {
    throw new TokenEncryptError("ciphertext must be non-empty string");
  }
  const parts = ciphertext.split(":");
  if (parts.length !== 5) {
    throw new TokenEncryptError("bundle shape invalid");
  }
  const [version, ivB64, tagB64, dataB64, keyId] = parts;
  if (version !== FORMAT_VERSION) {
    throw new TokenEncryptError(`unsupported format version: ${version}`);
  }

  const key = loadKeyMaterial(keyId);
  const iv = b64urlDecode(ivB64);
  const tag = b64urlDecode(tagB64);
  const data = b64urlDecode(dataB64);

  const decipher = createDecipheriv(ALGO, key, iv);
  decipher.setAuthTag(tag);
  try {
    const dec = Buffer.concat([decipher.update(data), decipher.final()]);
    return dec.toString("utf8");
  } catch {
    throw new TokenEncryptError("GCM auth verification failed");
  }
}
