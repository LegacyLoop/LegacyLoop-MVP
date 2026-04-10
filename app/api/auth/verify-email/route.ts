import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/**
 * GET /api/auth/verify-email?token=XXX
 * Validates the email verification token, marks user as verified,
 * and redirects to dashboard with success indicator.
 *
 * CMD-EMAIL-VERIFICATION
 */
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://app.legacy-loop.com";

  if (!token || token.length < 10) {
    return NextResponse.redirect(`${baseUrl}/auth/login?error=invalid-token`);
  }

  try {
    // Find user with this unexpired token
    const user = await prisma.user.findFirst({
      where: {
        emailVerifyToken: token,
        emailVerifyExpires: { gt: new Date() },
      },
      select: { id: true, email: true },
    });

    if (!user) {
      return NextResponse.redirect(`${baseUrl}/auth/login?error=expired-token`);
    }

    // Mark as verified + clear token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        emailVerifyToken: null,
        emailVerifyExpires: null,
      },
    });

    console.log(`[verify-email] ✅ Email verified for ${user.email}`);

    return NextResponse.redirect(`${baseUrl}/dashboard?verified=true`);
  } catch (err: any) {
    console.error("[verify-email] Error:", err.message);
    return NextResponse.redirect(`${baseUrl}/auth/login?error=verification-failed`);
  }
}
