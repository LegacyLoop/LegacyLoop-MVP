import { NextRequest, NextResponse } from "next/server";
import { authAdapter } from "@/lib/adapters/auth";
import { prisma } from "@/lib/db";
import { calculateProRate } from "@/lib/billing/pro-rate";
import { PLANS, TIER_NUMBER_TO_KEY } from "@/lib/constants/pricing";

/** Map legacy tier keys (from TIER_NUMBER_TO_KEY) to PLANS keys */
const LEGACY_TO_PLAN: Record<string, keyof typeof PLANS> = {
  free: "FREE",
  starter: "DIY_SELLER",
  plus: "POWER_SELLER",
  pro: "ESTATE_MANAGER",
};

export async function GET(req: NextRequest) {
  try {
    const user = await authAdapter.getSession();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const action = req.nextUrl.searchParams.get("action") || "cancel";
    const newTier = Number(req.nextUrl.searchParams.get("newTier")) || null;

    const sub = await prisma.subscription.findFirst({ where: { userId: user.id, status: "ACTIVE" }, orderBy: { createdAt: "desc" } });
    if (!sub) return NextResponse.json({ error: "No active subscription" }, { status: 400 });

    const newTierKey = newTier ? (TIER_NUMBER_TO_KEY[newTier] || "free") : null;
    const newPlanKey = newTierKey ? (LEGACY_TO_PLAN[newTierKey] || "FREE") : null;
    const newPlan = newPlanKey ? PLANS[newPlanKey] : null;

    const result = calculateProRate(sub.price, new Date(sub.currentPeriodStart), newPlan?.monthlyPrice);

    return NextResponse.json({ ...result, action, currentPlan: sub.tier, newPlan: newPlan?.name || null });
  } catch (err: unknown) {
    return NextResponse.json({ error: "Failed to calculate pro-rate" }, { status: 500 });
  }
}
