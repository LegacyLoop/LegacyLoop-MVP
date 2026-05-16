import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { prisma } from "@/lib/db";
import { authAdapter } from "@/lib/adapters/auth";
import { redeemReferralCode } from "@/lib/referrals";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

// Meta Graph API canonical endpoints
// Docs: https://developers.facebook.com/docs/facebook-login/guides/advanced/manual-flow
const FACEBOOK_TOKEN_URL = "https://graph.facebook.com/v21.0/oauth/access_token";
const FACEBOOK_PROFILE_URL =
  "https://graph.facebook.com/v21.0/me?fields=id,email,name,picture.type(large)";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const code = searchParams.get("code");
    const state = searchParams.get("state");

    if (!code || !state) {
      return NextResponse.redirect(`${APP_URL}/auth/login?error=oauth_failed`);
    }

    // Validate state matches cookie (CSRF protection)
    const jar = await cookies();
    const storedState = jar.get("facebook-oauth-state")?.value;

    if (!storedState || storedState !== state) {
      return NextResponse.redirect(`${APP_URL}/auth/login?error=oauth_failed`);
    }

    // Delete state cookie
    jar.delete("facebook-oauth-state");

    // Exchange code for access token (Facebook uses GET with query params)
    const tokenParams = new URLSearchParams({
      client_id: process.env.FACEBOOK_CLIENT_ID!,
      client_secret: process.env.FACEBOOK_CLIENT_SECRET!,
      redirect_uri: `${APP_URL}/api/auth/facebook/callback`,
      code,
    });

    const tokenRes = await fetch(`${FACEBOOK_TOKEN_URL}?${tokenParams.toString()}`);

    if (!tokenRes.ok) {
      console.error("Facebook token exchange failed:", await tokenRes.text());
      return NextResponse.redirect(`${APP_URL}/auth/login?error=oauth_failed`);
    }

    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;

    if (!accessToken) {
      return NextResponse.redirect(`${APP_URL}/auth/login?error=oauth_failed`);
    }

    // Fetch user profile from Facebook Graph API
    const profileRes = await fetch(FACEBOOK_PROFILE_URL, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!profileRes.ok) {
      console.error("Facebook profile fetch failed:", await profileRes.text());
      return NextResponse.redirect(`${APP_URL}/auth/login?error=oauth_failed`);
    }

    const profile = await profileRes.json();
    const { id: facebookId, email, name, picture } = profile;

    if (!facebookId) {
      return NextResponse.redirect(`${APP_URL}/auth/login?error=oauth_failed`);
    }

    // Facebook may return profile without email if user denied email permission
    // OR if user signed up to Facebook via phone number only. Handle gracefully.
    if (!email) {
      console.error(
        "Facebook profile missing email · user may have denied email permission"
      );
      return NextResponse.redirect(
        `${APP_URL}/auth/login?error=oauth_email_required`
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const avatarUrl = picture?.data?.url || undefined;

    // Find or create user
    let user = await prisma.user.findUnique({ where: { facebookId } });

    if (!user) {
      // Try finding by email (existing user linking Facebook account)
      user = await prisma.user.findUnique({ where: { email: cleanEmail } });

      if (user) {
        // Link Facebook account to existing user + auto-verify email
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            facebookId,
            displayName: user.displayName || name || undefined,
            avatarUrl: user.avatarUrl || avatarUrl,
            emailVerified: true,
          },
        });
      } else {
        // Create new user
        const passwordHash = await bcrypt.hash(crypto.randomUUID(), 12);

        // Facebook-verified emails auto-verified (mirrors Google OAuth)
        user = await prisma.user.create({
          data: {
            email: cleanEmail,
            facebookId,
            displayName: name || undefined,
            avatarUrl,
            passwordHash,
            tier: 1,
            emailVerified: true,
          },
        });
      }
    }

    // Issue session
    await authAdapter.issueSession(user.id, user.tier);

    // Referral code auto-redemption (fire-and-forget)
    const refCookie = (await cookies()).get("facebook-oauth-ref")?.value;
    const refCode = searchParams.get("ref") || refCookie || null;
    if (refCode && typeof refCode === "string") {
      void redeemReferralCode(
        refCode,
        { id: user.id, email: user.email },
        { skipDuplicateCheck: true }
      ).catch(() => {});
    }

    // CMD-ONBOARDING-7A: New users → quiz, returning users → dashboard
    const isNewUser =
      !user.quizCompletedAt && (user.onboardingStep ?? 0) === 0;
    return NextResponse.redirect(
      `${APP_URL}/${isNewUser ? "onboarding/quiz" : "dashboard"}`
    );
  } catch (error) {
    console.error("Facebook OAuth callback error:", error);
    return NextResponse.redirect(`${APP_URL}/auth/login?error=oauth_failed`);
  }
}
