// CMD-W26-B · Business-app OAuth token exchange.
//
// Distinct from `lib/meta/graph.ts::exchangeLongLivedToken` which uses
// FACEBOOK_CLIENT_ID/SECRET (the Login app). This module uses the Business app
// credentials per Peg §1 two-app architecture.
//
// Flow:
//   1. authorization code → short-lived user access token (with redirect_uri match)
//   2. short-lived → long-lived user access token (~60 days)
//   3. caller passes long-lived user token to graph.ts::listPages → Page tokens
//
// graphGet from lib/meta/graph.ts is reused (READ-ONLY · BINDING #16).

import { graphGet, type GraphResult } from "@/lib/meta/graph";

const GRAPH_VERSION = process.env.META_GRAPH_API_VERSION || "v21.0";

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}
function asString(v: unknown): string | undefined {
  return typeof v === "string" ? v : undefined;
}
function asNumber(v: unknown): number | null {
  return typeof v === "number" ? v : null;
}

export interface BusinessAppCreds {
  appId: string;
  appSecret: string;
  redirectUri: string;
}

export class BusinessOAuthConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BusinessOAuthConfigError";
  }
}

export function loadBusinessAppCreds(): BusinessAppCreds {
  const appId = process.env.META_BUSINESS_APP_ID;
  const appSecret = process.env.META_BUSINESS_APP_SECRET;
  const redirectUri = process.env.META_BUSINESS_REDIRECT_URI;
  if (!appId) throw new BusinessOAuthConfigError("META_BUSINESS_APP_ID not set");
  if (!appSecret) throw new BusinessOAuthConfigError("META_BUSINESS_APP_SECRET not set");
  if (!redirectUri) throw new BusinessOAuthConfigError("META_BUSINESS_REDIRECT_URI not set");
  return { appId, appSecret, redirectUri };
}

/**
 * Exchange an authorization code for a short-lived user access token.
 * The Graph /oauth/access_token endpoint authenticates via query params
 * (client_secret + code). The Bearer header set by graphGet is ignored by
 * this endpoint — we still go through graphGet for retry/usage semantics.
 */
export async function exchangeCodeForShortLivedToken(
  code: string,
  creds: BusinessAppCreds = loadBusinessAppCreds(),
): Promise<GraphResult<{ accessToken: string; expiresInSeconds: number | null }>> {
  return graphGet(
    `${GRAPH_VERSION}/oauth/access_token`,
    {
      token: code,
      params: {
        client_id: creds.appId,
        client_secret: creds.appSecret,
        redirect_uri: creds.redirectUri,
        code,
      },
    },
    (body) => {
      const rec = isRecord(body) ? body : {};
      return {
        accessToken: asString(rec.access_token) ?? "",
        expiresInSeconds: asNumber(rec.expires_in),
      };
    },
  );
}

/**
 * Exchange a short-lived user token for a long-lived one (~60 days) via the
 * Business app. Page tokens derived from this long-lived user token do not
 * expire (Peg §5.2 · subject to Meta revocation).
 */
export async function exchangeShortForLongLivedUserToken(
  shortToken: string,
  creds: BusinessAppCreds = loadBusinessAppCreds(),
): Promise<GraphResult<{ accessToken: string; expiresInSeconds: number | null }>> {
  return graphGet(
    `${GRAPH_VERSION}/oauth/access_token`,
    {
      token: shortToken,
      params: {
        grant_type: "fb_exchange_token",
        client_id: creds.appId,
        client_secret: creds.appSecret,
        fb_exchange_token: shortToken,
      },
    },
    (body) => {
      const rec = isRecord(body) ? body : {};
      return {
        accessToken: asString(rec.access_token) ?? "",
        expiresInSeconds: asNumber(rec.expires_in),
      };
    },
  );
}
