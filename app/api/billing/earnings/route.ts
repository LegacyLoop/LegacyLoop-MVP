import { NextResponse } from "next/server";
import { authAdapter } from "@/lib/adapters/auth";
import { prisma } from "@/lib/db";
import { TIER_NUMBER_TO_KEY, PLANS } from "@/lib/constants/pricing";

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

    const soldItems = await prisma.item.findMany({
      where: { userId: user.id, soldPrice: { not: null } },
      select: { id: true, title: true, soldPrice: true, soldAt: true, listingPrice: true },
      orderBy: { soldAt: "desc" },
    });

    const tierKey = TIER_NUMBER_TO_KEY[user.tier] || "free";
    const planKey = LEGACY_TO_PLAN[tierKey] || "FREE";
    const plan = PLANS[planKey];
    const commissionRate = plan.commission;

    const sales = soldItems.map(item => {
      const sold = item.soldPrice || 0;
      const commission = Math.round(sold * commissionRate * 100) / 100;
      const earnings = Math.round((sold - commission) * 100) / 100;
      return { itemId: item.id, title: item.title, soldPrice: sold, soldAt: item.soldAt, commissionRate, commissionAmount: commission, sellerEarnings: earnings };
    });

    const totalEarnings = sales.reduce((s, i) => s + i.sellerEarnings, 0);
    const totalCommission = sales.reduce((s, i) => s + i.commissionAmount, 0);

    return NextResponse.json({ sales, totalEarnings: Math.round(totalEarnings * 100) / 100, totalCommission: Math.round(totalCommission * 100) / 100, commissionRate, planName: plan.name, itemsSold: sales.length });
  } catch (err: unknown) {
    return NextResponse.json({ error: "Failed to fetch earnings" }, { status: 500 });
  }
}
