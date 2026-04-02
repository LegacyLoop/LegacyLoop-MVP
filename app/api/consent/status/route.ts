import { NextResponse } from "next/server";
import { authAdapter } from "@/lib/adapters/auth";
import { prisma } from "@/lib/db";

/**
 * GET /api/consent/status
 *
 * Returns the current user's consent state.
 * Used by client components (like the Buyer Intent Scanner) to check
 * whether consent has already been granted, without re-prompting.
 */
export async function GET() {
  const user = await authAdapter.getSession();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const consent = await prisma.dataCollectionConsent.findUnique({
      where: { userId: user.id },
      select: {
        dataCollection: true,
        aiTraining: true,
        marketResearch: true,
        anonymousSharing: true,
        creditsEarned: true,
        consentedAt: true,
        revokedAt: true,
      },
    });

    if (!consent) {
      return NextResponse.json({
        dataCollection: false,
        aiTraining: false,
        marketResearch: false,
        anonymousSharing: false,
        creditsEarned: 0,
        consentedAt: null,
        revokedAt: null,
      });
    }

    return NextResponse.json(consent);
  } catch {
    return NextResponse.json({
      dataCollection: false,
      aiTraining: false,
      marketResearch: false,
      anonymousSharing: false,
      creditsEarned: 0,
      consentedAt: null,
      revokedAt: null,
    });
  }
}
