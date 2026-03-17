import { NextResponse } from "next/server";
import { authAdapter } from "@/lib/adapters/auth";
import { prisma } from "@/lib/db";
import { PLANS, TIER_NUMBER_TO_KEY } from "@/lib/constants/pricing";

/** Map legacy tier keys (from TIER_NUMBER_TO_KEY) to PLANS keys */
const LEGACY_TO_PLAN: Record<string, keyof typeof PLANS> = {
  free: "FREE",
  starter: "DIY_SELLER",
  plus: "POWER_SELLER",
  pro: "ESTATE_MANAGER",
};

export async function GET() {
  try {
    const user = await authAdapter.getSession();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const sub = await prisma.subscription.findFirst({ where: { userId: user.id, status: "ACTIVE" }, orderBy: { createdAt: "desc" } });
    const tierKey = TIER_NUMBER_TO_KEY[user.tier] || "free";
    const planKey = LEGACY_TO_PLAN[tierKey] || "FREE";
    const plan = PLANS[planKey];

    if (!sub) {
      return NextResponse.json({ plan: { name: plan.name, price: plan.monthlyPrice, tier: user.tier }, billingStartDate: null, nextBillingDate: null, daysRemaining: 0, autoRenew: false, status: "none" });
    }

    const daysRemaining = Math.max(0, Math.round((new Date(sub.currentPeriodEnd).getTime() - Date.now()) / (24 * 60 * 60 * 1000)));

    return NextResponse.json({
      plan: { name: plan.name, price: sub.price, tier: user.tier, commission: sub.commission },
      billingStartDate: sub.currentPeriodStart,
      nextBillingDate: sub.currentPeriodEnd,
      daysRemaining,
      autoRenew: sub.status === "ACTIVE",
      status: sub.status.toLowerCase(),
    });
  } catch (err: unknown) {
    return NextResponse.json({ error: "Failed to fetch billing status" }, { status: 500 });
  }
}
