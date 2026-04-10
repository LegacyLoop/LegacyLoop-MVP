import { authAdapter } from "@/lib/adapters/auth";
import { prisma } from "@/lib/db";

/**
 * PATCH /api/user/onboarding-step
 * Updates the user's onboarding progress step.
 * CMD-ONBOARDING-7B
 */
export async function PATCH(req: Request) {
  try {
    const user = await authAdapter.getSession();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const { onboardingStep } = await req.json();
    if (typeof onboardingStep !== "number" || onboardingStep < 0 || onboardingStep > 10) {
      return Response.json({ error: "Invalid step" }, { status: 400 });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { onboardingStep },
    });

    return Response.json({ success: true, onboardingStep });
  } catch (err: any) {
    console.error("[user/onboarding-step]", err.message);
    return Response.json({ error: "Failed to update step" }, { status: 500 });
  }
}
