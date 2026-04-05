import { NextRequest, NextResponse } from "next/server";
import { authAdapter } from "@/lib/adapters/auth";
import crypto from "crypto";

/* ═══════════════════════════════════════════════════════════════════════
   eBay User OAuth — Initiates eBay Sign-in flow

   Redirects the user to eBay's consent page. After they approve,
   eBay redirects back to /api/ebay/auth/callback with an auth code.
   ═══════════════════════════════════════════════════════════════════════ */

const EBAY_CLIENT_ID = process.env.EBAY_CLIENT_ID || "";
const EBAY_REDIRECT_URI = process.env.EBAY_REDIRECT_URI || "https://app.legacy-loop.com/api/ebay/auth/callback";

// Scopes needed for listing, selling, and account management
const EBAY_SCOPES = [
  "https://api.ebay.com/oauth/api_scope",
  "https://api.ebay.com/oauth/api_scope/buy.browse",
  "https://api.ebay.com/oauth/api_scope/sell.inventory",
  "https://api.ebay.com/oauth/api_scope/sell.marketing",
  "https://api.ebay.com/oauth/api_scope/sell.account",
  "https://api.ebay.com/oauth/api_scope/sell.fulfillment",
  "https://api.ebay.com/oauth/api_scope/sell.finances",
].join(" ");

export async function GET(_req: NextRequest) {
  // Must be logged in
  const user = await authAdapter.getSession();
  if (!user) {
    return NextResponse.redirect(new URL("/auth/login", _req.url));
  }

  if (!EBAY_CLIENT_ID || EBAY_CLIENT_ID.includes("PASTE_YOUR")) {
    return NextResponse.json({ error: "eBay not configured" }, { status: 500 });
  }

  // CSRF protection — random state stored in cookie
  const state = crypto.randomUUID();

  const authUrl =
    `https://auth.ebay.com/oauth2/authorize` +
    `?client_id=${encodeURIComponent(EBAY_CLIENT_ID)}` +
    `&response_type=code` +
    `&redirect_uri=${encodeURIComponent(EBAY_REDIRECT_URI)}` +
    `&scope=${encodeURIComponent(EBAY_SCOPES)}` +
    `&state=${state}`;

  const response = NextResponse.redirect(authUrl);
  response.cookies.set("ebay_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 600,       // 10 minutes
    sameSite: "lax",
    path: "/",
  });

  return response;
}
