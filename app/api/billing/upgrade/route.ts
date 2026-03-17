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

export async function POST(req: NextRequest) {
  try {
    const user = await authAdapter.getSession();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { newTier } = await req.json().catch(() => ({ newTier: null }));
    if (!newTier || newTier <= user.tier) return NextResponse.json({ error: "Invalid upgrade tier" }, { status: 400 });

    const sub = await prisma.subscription.findFirst({ where: { userId: user.id, status: "ACTIVE" }, orderBy: { createdAt: "desc" } });
    if (!sub) return NextResponse.json({ error: "No active subscription" }, { status: 400 });

    const newTierKey = TIER_NUMBER_TO_KEY[newTier] || "free";
    const newPlanKey = LEGACY_TO_PLAN[newTierKey] || "FREE";
    const newPlan = PLANS[newPlanKey];
    if (!newPlan) return NextResponse.json({ error: "Invalid plan" }, { status: 400 });

    const proRate = calculateProRate(sub.price, new Date(sub.currentPeriodStart), newPlan.monthlyPrice);
    const now = new Date();
    const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    await prisma.subscription.update({
      where: { id: sub.id },
      data: { tier: newTierKey.toUpperCase(), price: newPlan.monthlyPrice, commission: newPlan.commission, currentPeriodStart: now, currentPeriodEnd: periodEnd },
    });

    await prisma.user.update({ where: { id: user.id }, data: { tier: newTier } });

    await prisma.userEvent.create({
      data: { userId: user.id, eventType: "SUBSCRIPTION_UPGRADED", metadata: JSON.stringify({ fromTier: sub.tier, toTier: newTierKey.toUpperCase(), charged: proRate.upgradeCharge, credited: proRate.creditForUnused }) },
    });

    return NextResponse.json({ success: true, newPlan: newPlan.name, charged: proRate.upgradeCharge, credited: proRate.creditForUnused, effectiveNow: true });
  } catch (err: unknown) {
    return NextResponse.json({ error: "Upgrade failed" }, { status: 500 });
  }
}
