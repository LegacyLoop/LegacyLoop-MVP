// CMD-W26-B · Build Meta OAuth consent URL for the LegacyLoop Business app.
// Peg spec §5.2 · 10 Phase-1 scopes · auth_type=rerequest · CSRF state.
//
// Distinct from the Login app (`META_LOGIN_APP_*`). This module is for the
// per-user Page connection flow only — never used for sign-in.

import { randomBytes, createHmac } from "node:crypto";

/** Phase-1 scopes (Peg §5.2 · exact order preserved for review traceability). */
export const PAGE_CONSENT_SCOPES = [
  "pages_show_list",
  "pages_read_engagement",
  "pages_manage_posts",
  "pages_manage_metadata",
  "pages_read_user_content",
  "pages_messaging",
  "instagram_basic",
  "instagram_content_publish",
  "instagram_manage_messages",
  "instagram_manage_comments",
] as const;

export interface ConsentUrlInput {
  /** Legacy-Loop User.id requesting the connection. Bound into CSRF state. */
  userId: string;
  /** Optional return path inside the app after callback ("/connected-accounts" by default). */
  returnTo?: string;
}

export interface ConsentUrlResult {
  url: string;
  state: string;
  redirectUri: string;
}

export class PageConsentError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PageConsentError";
  }
}

function graphAuthHost(): string {
  // OAuth dialog lives on www.facebook.com (not graph.facebook.com).
  return process.env.META_OAUTH_DIALOG_BASE_URL || "https://www.facebook.com";
}

function graphVersion(): string {
  return process.env.META_GRAPH_API_VERSION || "v21.0";
}

/**
 * Build a Business-app consent URL with CSRF state.
 * State format: `<userId>.<nonce>.<hmac>` so the callback can verify integrity
 * without round-tripping to a session store.
 */
export function buildPageConsentUrl(input: ConsentUrlInput): ConsentUrlResult {
  const appId = process.env.META_BUSINESS_APP_ID;
  const appSecret = process.env.META_BUSINESS_APP_SECRET;
  const redirectUri = process.env.META_BUSINESS_REDIRECT_URI;
  if (!appId) throw new PageConsentError("META_BUSINESS_APP_ID not set");
  if (!appSecret) throw new PageConsentError("META_BUSINESS_APP_SECRET not set");
  if (!redirectUri) throw new PageConsentError("META_BUSINESS_REDIRECT_URI not set");
  if (!/^[A-Za-z0-9]{1,128}$/.test(input.userId)) {
    throw new PageConsentError("invalid userId for state binding");
  }

  const nonce = randomBytes(16).toString("hex");
  const payload = `${input.userId}.${nonce}`;
  const mac = createHmac("sha256", appSecret).update(payload).digest("hex").slice(0, 32);
  const state = `${payload}.${mac}`;

  const params = new URLSearchParams({
    client_id: appId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: PAGE_CONSENT_SCOPES.join(","),
    state,
    auth_type: "rerequest", // handle previously-declined scopes
  });
  if (input.returnTo) params.set("return_to", input.returnTo);

  const url = `${graphAuthHost()}/${graphVersion()}/dialog/oauth?${params.toString()}`;
  return { url, state, redirectUri };
}

/**
 * Verify an incoming `state` on the callback. Returns the userId on success,
 * null on tamper / format mismatch.
 */
export function verifyPageConsentState(state: string | null): string | null {
  if (!state) return null;
  const parts = state.split(".");
  if (parts.length !== 3) return null;
  const [userId, nonce, mac] = parts;
  const secret = process.env.META_BUSINESS_APP_SECRET;
  if (!secret) return null;
  const expected = createHmac("sha256", secret).update(`${userId}.${nonce}`).digest("hex").slice(0, 32);
  if (mac.length !== expected.length) return null;
  // constant-time compare via Buffer
  const a = Buffer.from(mac, "utf8");
  const b = Buffer.from(expected, "utf8");
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0 ? userId : null;
}
