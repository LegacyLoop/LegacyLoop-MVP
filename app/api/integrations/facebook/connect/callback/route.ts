// CMD-W26-B · Business-app OAuth callback.
// GET /api/integrations/facebook/connect/callback?code=...&state=...
//   → verify CSRF state
//   → code → short-lived user token → long-lived user token
//   → list Pages (graph.ts::listPages)
//   → for the first Page (Phase-1 single-page MVP):
//      · detect IG Business account
//      · encrypt Page Access Token (AES-256-GCM)
//      · upsert ConnectedPlatform.settingsJson (additive merge)
//   → 302 redirect back to /connected-accounts
//
// Peg §5.2 callback path EXACT. Login app callback (auth/facebook/callback)
// UNTOUCHED.

import { authAdapter } from "@/lib/adapters/auth";
import { prisma } from "@/lib/db";
import { encryptPageToken, TokenEncryptError } from "@/lib/crypto/page-tokens/encrypt";
import { detectIgBusinessAccount } from "@/lib/meta/oauth/ig-business-detect";
import { verifyPageConsentState } from "@/lib/meta/oauth/page-consent";
import {
  BusinessOAuthConfigError,
  exchangeCodeForShortLivedToken,
  exchangeShortForLongLivedUserToken,
  loadBusinessAppCreds,
} from "@/lib/meta/oauth/page-token-exchange";
import { listPages } from "@/lib/meta/graph";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

interface PagePersist {
  page_id: string;
  page_name: string;
  encrypted_page_access_token: string;
  encryption_key_id: string;
  connected_at: string;
  connected_by_user_id: string;
  ig_business_account_id: string | null;
  connection_broken?: false;
}

function redirectToReturn(returnTo: string, status: "ok" | "error", detail?: string): Response {
  const base = returnTo || "/connected-accounts";
  const sep = base.includes("?") ? "&" : "?";
  const detailParam = detail ? `&detail=${encodeURIComponent(detail.slice(0, 120))}` : "";
  return Response.redirect(`${base}${sep}fb=${status}${detailParam}`, 302);
}

export async function GET(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const returnTo = url.searchParams.get("return_to") || "/connected-accounts";
  const oauthError = url.searchParams.get("error");

  if (oauthError) {
    return redirectToReturn(returnTo, "error", oauthError);
  }
  if (!code) return new Response("missing code", { status: 400 });

  const userIdFromState = verifyPageConsentState(state);
  if (!userIdFromState) return new Response("invalid state", { status: 401 });

  // Cross-check with current session — must be the same logged-in user.
  const session = await authAdapter.getSession();
  if (!session || session.id !== userIdFromState) {
    return new Response("session mismatch", { status: 401 });
  }

  let creds;
  try {
    creds = loadBusinessAppCreds();
  } catch (e: unknown) {
    const msg = e instanceof BusinessOAuthConfigError ? e.message : "config error";
    return new Response(msg, { status: 503 });
  }

  // 1. code → short-lived user token
  const shortRes = await exchangeCodeForShortLivedToken(code, creds);
  if (!shortRes.ok || !shortRes.data.accessToken) {
    return redirectToReturn(returnTo, "error", shortRes.ok ? "empty short token" : shortRes.error.message);
  }

  // 2. short → long-lived user token
  const longRes = await exchangeShortForLongLivedUserToken(shortRes.data.accessToken, creds);
  if (!longRes.ok || !longRes.data.accessToken) {
    return redirectToReturn(returnTo, "error", longRes.ok ? "empty long token" : longRes.error.message);
  }

  // 3. /me/accounts → Pages + per-page access tokens
  const pagesRes = await listPages(longRes.data.accessToken);
  if (!pagesRes.ok) {
    return redirectToReturn(returnTo, "error", pagesRes.error.message);
  }
  if (pagesRes.data.length === 0) {
    return redirectToReturn(returnTo, "error", "no pages on this user");
  }

  // Phase-1 single-Page MVP: take first page. Multi-page picker is a future lane.
  const page = pagesRes.data[0];

  // 4. IG Business detect (non-fatal · null on miss)
  const ig = await detectIgBusinessAccount(page.id, page.accessToken);

  // 5. Encrypt page access token (AES-256-GCM)
  let encrypted;
  try {
    encrypted = encryptPageToken(page.accessToken);
  } catch (e: unknown) {
    const msg = e instanceof TokenEncryptError ? e.message : "encrypt error";
    return new Response(`vault unconfigured: ${msg}`, { status: 503 });
  }

  // 6. Upsert ConnectedPlatform (additive settingsJson merge)
  const existing = await prisma.connectedPlatform.findUnique({
    where: { userId_platform: { userId: session.id, platform: "facebook" } },
    select: { settingsJson: true },
  });
  let base: Record<string, unknown> = {};
  if (existing?.settingsJson) {
    try {
      const parsed: unknown = JSON.parse(existing.settingsJson);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        base = parsed as Record<string, unknown>;
      }
    } catch {
      base = {};
    }
  }

  const persisted: PagePersist = {
    page_id: page.id,
    page_name: page.name,
    encrypted_page_access_token: encrypted.ciphertext,
    encryption_key_id: encrypted.keyId,
    connected_at: new Date().toISOString(),
    connected_by_user_id: session.id,
    ig_business_account_id: ig.igBusinessAccountId,
  };

  const merged = {
    ...base,
    ...persisted,
    // Clear any prior "broken" flag from a previous failed connection.
    connection_broken: false,
  };

  await prisma.connectedPlatform.upsert({
    where: { userId_platform: { userId: session.id, platform: "facebook" } },
    create: {
      userId: session.id,
      platform: "facebook",
      platformUsername: page.name,
      isActive: true,
      lastSync: new Date(),
      settingsJson: JSON.stringify(merged),
    },
    update: {
      platformUsername: page.name,
      isActive: true,
      lastSync: new Date(),
      settingsJson: JSON.stringify(merged),
    },
  });

  // If IG biz account present, also upsert an "instagram" platform row pointing at the same Page.
  if (ig.igBusinessAccountId) {
    const igSettings = {
      page_id: page.id,
      ig_business_account_id: ig.igBusinessAccountId,
      connected_at: new Date().toISOString(),
      connected_by_user_id: session.id,
      // Page access token already serves IG Messaging; do NOT duplicate it here.
      uses_page_access_token: true,
      connection_broken: false,
    };
    await prisma.connectedPlatform.upsert({
      where: { userId_platform: { userId: session.id, platform: "instagram" } },
      create: {
        userId: session.id,
        platform: "instagram",
        platformUsername: ig.igBusinessAccountId,
        isActive: true,
        lastSync: new Date(),
        settingsJson: JSON.stringify(igSettings),
      },
      update: {
        platformUsername: ig.igBusinessAccountId,
        isActive: true,
        lastSync: new Date(),
        settingsJson: JSON.stringify(igSettings),
      },
    });
  }

  return redirectToReturn(returnTo, "ok");
}
