import { authAdapter } from "@/lib/adapters/auth";
import { prisma } from "@/lib/db";

/**
 * POST /api/onboarding/quiz
 * Saves quiz results to the User record.
 * Auth required — only logged-in users can persist quiz results.
 * Non-blocking — if user is not logged in, client falls back to localStorage.
 *
 * CMD-ONBOARDING-7A
 */
export async function POST(req: Request) {
  try {
    const user = await authAdapter.getSession();
    if (!user) {
      return Response.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await req.json();
    const {
      sellerType,      // "estate" | "garage" | "neighborhood"
      recommendedTier, // "FREE" | "STARTER" | "PLUS" | "PRO" | etc.
      servicePreference, // "diy" | "whiteGlove"
    } = body;

    await prisma.user.update({
      where: { id: user.id },
      data: {
        quizCompletedAt: new Date(),
        sellerType: sellerType || null,
        recommendedTier: recommendedTier || null,
        servicePreference: servicePreference || null,
        onboardingStep: 1,
      },
    });

    return Response.json({ success: true, recommendation: recommendedTier });
  } catch (err: any) {
    console.error("[onboarding/quiz] Failed:", err.message);
    return Response.json({ error: "Failed to save quiz results" }, { status: 500 });
  }
}
