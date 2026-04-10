import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { prisma } from "@/lib/db";
import { authAdapter } from "@/lib/adapters/auth";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

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
    const storedState = jar.get("google-oauth-state")?.value;

    if (!storedState || storedState !== state) {
      return NextResponse.redirect(`${APP_URL}/auth/login?error=oauth_failed`);
    }

    // Delete state cookie
    jar.delete("google-oauth-state");

    // Exchange code for tokens
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: `${APP_URL}/api/auth/google/callback`,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenRes.ok) {
      console.error("Google token exchange failed:", await tokenRes.text());
      return NextResponse.redirect(`${APP_URL}/auth/login?error=oauth_failed`);
    }

    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;

    if (!accessToken) {
      return NextResponse.redirect(`${APP_URL}/auth/login?error=oauth_failed`);
    }

    // Fetch user profile from Google
    const profileRes = await fetch(
      "https://www.googleapis.com/oauth2/v2/userinfo",
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    if (!profileRes.ok) {
      console.error("Google profile fetch failed:", await profileRes.text());
      return NextResponse.redirect(`${APP_URL}/auth/login?error=oauth_failed`);
    }

    const profile = await profileRes.json();
    const { id: googleId, email, name, picture } = profile;

    if (!email) {
      return NextResponse.redirect(`${APP_URL}/auth/login?error=oauth_failed`);
    }

    const cleanEmail = email.trim().toLowerCase();

    // Find or create user
    let user = await prisma.user.findUnique({ where: { googleId } });

    if (!user) {
      // Try finding by email (existing user linking Google account)
      user = await prisma.user.findUnique({ where: { email: cleanEmail } });

      if (user) {
        // Link Google account to existing user + auto-verify email
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            googleId,
            displayName: user.displayName || name || undefined,
            avatarUrl: user.avatarUrl || picture || undefined,
            emailVerified: true,
          },
        });
      } else {
        // Create new user
        const passwordHash = await bcrypt.hash(crypto.randomUUID(), 12);

        // CMD-EMAIL-VERIFICATION: Google-verified emails auto-verified
        user = await prisma.user.create({
          data: {
            email: cleanEmail,
            googleId,
            displayName: name || undefined,
            avatarUrl: picture || undefined,
            passwordHash,
            tier: 1,
            emailVerified: true,
          },
        });
      }
    }

    // Issue session
    await authAdapter.issueSession(user.id, user.tier);

    // CMD-ONBOARDING-7A: New users → quiz, returning users → dashboard
    const isNewUser = !user.quizCompletedAt && (user.onboardingStep ?? 0) === 0;
    return NextResponse.redirect(`${APP_URL}/${isNewUser ? "onboarding/quiz" : "dashboard"}`);
  } catch (error) {
    console.error("Google OAuth callback error:", error);
    return NextResponse.redirect(`${APP_URL}/auth/login?error=oauth_failed`);
  }
}
