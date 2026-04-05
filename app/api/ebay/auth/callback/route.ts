import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { authAdapter } from "@/lib/adapters/auth";

/* ═══════════════════════════════════════════════════════════════════════
   eBay OAuth Callback — Handles the redirect after eBay Sign-in

   1. Validates CSRF state
   2. Exchanges authorization code for user access + refresh tokens
   3. Stores tokens in ConnectedPlatform
   4. Redirects back to integrations page
   ═══════════════════════════════════════════════════════════════════════ */

const EBAY_CLIENT_ID = process.env.EBAY_CLIENT_ID || "";
const EBAY_CLIENT_SECRET = process.env.EBAY_CLIENT_SECRET || "";
const EBAY_REDIRECT_URI = process.env.EBAY_REDIRECT_URI || "https://app.legacy-loop.com/api/ebay/auth/callback";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  const storedState = req.cookies.get("ebay_oauth_state")?.value;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://legacy-loop.com";

  // ── Validate CSRF state ──
  if (!code || !state || state !== storedState) {
    console.error("[eBay Callback] CSRF state mismatch or missing code");
    return NextResponse.redirect(`${baseUrl}/integrations?error=ebay_auth_failed`);
  }

  // ── Must be logged in ──
  const user = await authAdapter.getSession();
  if (!user) {
    return NextResponse.redirect(`${baseUrl}/auth/login`);
  }

  // ── Exchange code for tokens ──
  try {
    const basic = Buffer.from(`${EBAY_CLIENT_ID}:${EBAY_CLIENT_SECRET}`).toString("base64");

    const tokenRes = await fetch("https://api.ebay.com/identity/v1/oauth2/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${basic}`,
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: EBAY_REDIRECT_URI,
      }),
    });

    if (!tokenRes.ok) {
      const errText = await tokenRes.text().catch(() => "");
      console.error("[eBay Callback] Token exchange failed:", tokenRes.status, errText.slice(0, 300));
      return NextResponse.redirect(`${baseUrl}/integrations?error=ebay_token_failed`);
    }

    const tokenData = await tokenRes.json();
    // tokenData: { access_token, refresh_token, expires_in, token_type, refresh_token_expires_in }

    // ── Optionally fetch eBay username ──
    let ebayUsername: string | null = null;
    try {
      const identityRes = await fetch("https://apiz.ebay.com/commerce/identity/v1/user/", {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      });
      if (identityRes.ok) {
        const identity = await identityRes.json();
        ebayUsername = identity.username || identity.userId || null;
      }
    } catch {
      // Non-critical — username is nice to have
    }

    // ── Store connection ──
    await prisma.connectedPlatform.upsert({
      where: {
        userId_platform: { userId: user.id, platform: "ebay" },
      },
      update: {
        isActive: true,
        platformUsername: ebayUsername,
        lastSync: new Date(),
        settingsJson: JSON.stringify({
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token,
          expires_at: Date.now() + (tokenData.expires_in * 1000),
          refresh_token_expires_at: tokenData.refresh_token_expires_in
            ? Date.now() + (tokenData.refresh_token_expires_in * 1000)
            : null,
        }),
      },
      create: {
        userId: user.id,
        platform: "ebay",
        isActive: true,
        platformUsername: ebayUsername,
        lastSync: new Date(),
        settingsJson: JSON.stringify({
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token,
          expires_at: Date.now() + (tokenData.expires_in * 1000),
          refresh_token_expires_at: tokenData.refresh_token_expires_in
            ? Date.now() + (tokenData.refresh_token_expires_in * 1000)
            : null,
        }),
      },
    });

    console.log("[eBay Callback] Connected eBay for user:", user.id, "username:", ebayUsername);

    // Clear the state cookie
    const response = NextResponse.redirect(`${baseUrl}/integrations?success=ebay`);
    response.cookies.delete("ebay_oauth_state");
    return response;

  } catch (err: any) {
    console.error("[eBay Callback] Error:", err.message);
    return NextResponse.redirect(`${baseUrl}/integrations?error=ebay_connection_error`);
  }
}
