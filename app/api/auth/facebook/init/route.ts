import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import crypto from "crypto";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

// Meta Facebook Login canonical OAuth 2.0 endpoint
// Docs: https://developers.facebook.com/docs/facebook-login/guides/advanced/manual-flow
const FACEBOOK_OAUTH_DIALOG = "https://www.facebook.com/v21.0/dialog/oauth";

export async function GET(request: NextRequest) {
  const clientId = process.env.FACEBOOK_CLIENT_ID;

  if (!clientId) {
    return NextResponse.redirect(
      `${APP_URL}/auth/login?error=oauth_not_configured`
    );
  }

  const state = crypto.randomUUID();

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: `${APP_URL}/api/auth/facebook/callback`,
    response_type: "code",
    scope: "email,public_profile",
    state,
    auth_type: "rerequest",
  });

  const authUrl = `${FACEBOOK_OAUTH_DIALOG}?${params.toString()}`;

  // Store state in cookie for CSRF protection (mirrors Google OAuth pattern)
  const jar = await cookies();
  jar.set("facebook-oauth-state", state, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 600,
  });

  // Pass referral code through a separate cookie (if present)
  const ref = request.nextUrl.searchParams.get("ref");
  if (ref) {
    jar.set("facebook-oauth-ref", ref, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 600,
    });
  }

  return NextResponse.redirect(authUrl);
}
