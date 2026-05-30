// CMD-W26-D · Meta signed_request verification (data deletion callback).
// Format: "<base64url(signature)>.<base64url(payload)>"
//   signature = HMAC-SHA256(rawPayloadString, appSecret)  [base64url]
// Reference: https://developers.facebook.com/docs/development/data-deletion-request-callback
//
// Mirrors lib/messaging/meta/verify-signature.ts crypto (createHmac + timingSafeEqual,
// BINDING #16). Returns the decoded payload only when the signature is valid.

import { createHmac, timingSafeEqual } from "node:crypto";

export interface SignedRequestPayload {
  /** The Facebook app-scoped user id whose data must be deleted. */
  user_id: string;
  algorithm?: string;
  issued_at?: number;
  [key: string]: unknown;
}

function base64UrlToBuffer(input: string): Buffer {
  // base64url → base64, pad to multiple of 4.
  const b64 = input.replace(/-/g, "+").replace(/_/g, "/");
  const pad = b64.length % 4 === 0 ? "" : "=".repeat(4 - (b64.length % 4));
  return Buffer.from(b64 + pad, "base64");
}

/**
 * Verify a Meta signed_request and return its decoded payload, or null when
 * the request is malformed, the signature is invalid, or the algorithm is
 * unexpected. Never throws.
 */
export function verifySignedRequest(
  signedRequest: string | null | undefined,
  appSecret: string | undefined,
): SignedRequestPayload | null {
  if (!signedRequest || !appSecret) return null;

  const parts = signedRequest.split(".");
  if (parts.length !== 2) return null;
  const [encodedSig, encodedPayload] = parts;
  if (!encodedSig || !encodedPayload) return null;

  // Recompute HMAC over the raw (still-encoded) payload string.
  const expected = createHmac("sha256", appSecret)
    .update(encodedPayload, "utf8")
    .digest();
  const provided = base64UrlToBuffer(encodedSig);

  if (provided.length !== expected.length) return null;
  try {
    if (!timingSafeEqual(provided, expected)) return null;
  } catch {
    return null;
  }

  let payload: SignedRequestPayload;
  try {
    payload = JSON.parse(base64UrlToBuffer(encodedPayload).toString("utf8")) as SignedRequestPayload;
  } catch {
    return null;
  }

  // Meta uses HMAC-SHA256; reject anything else.
  if (payload.algorithm && payload.algorithm.toUpperCase().replace(/-/g, "") !== "HMACSHA256") {
    return null;
  }
  if (typeof payload.user_id !== "string" || payload.user_id.length === 0) {
    return null;
  }

  return payload;
}
