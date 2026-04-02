import { NextRequest, NextResponse } from "next/server";
import { authAdapter } from "@/lib/adapters/auth";
import { prisma } from "@/lib/db";
import { CREDIT_COST_RATE } from "@/lib/constants/pricing";

type Params = Promise<{ itemId: string }>;

export async function GET(
  _req: NextRequest,
  { params }: { params: Params }
) {
  const user = await authAdapter.getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { itemId } = await params;
  const item = await prisma.item.findUnique({
    where: { id: itemId },
    include: { valuation: true },
  });
  if (!item || item.userId !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Get all credit transactions for this item
  const uc = await prisma.userCredits.findUnique({ where: { userId: user.id } });
  const transactions = uc
    ? await prisma.creditTransaction.findMany({
        where: { userCreditsId: uc.id, itemId, amount: { lt: 0 } },
        orderBy: { createdAt: "desc" },
      })
    : [];

  // Group by description (bot name)
  const groups: Record<string, { creditsSpent: number; runCount: number; lastRun: string }> = {};
  for (const tx of transactions) {
    const key = tx.description;
    if (!groups[key]) groups[key] = { creditsSpent: 0, runCount: 0, lastRun: tx.createdAt.toISOString() };
    groups[key].creditsSpent += Math.abs(tx.amount);
    groups[key].runCount += 1;
    if (tx.createdAt.toISOString() > groups[key].lastRun) groups[key].lastRun = tx.createdAt.toISOString();
  }

  const breakdown = Object.entries(groups)
    .map(([botName, data]) => ({
      botName,
      creditsSpent: data.creditsSpent,
      costDollars: Math.round(data.creditsSpent * CREDIT_COST_RATE * 100) / 100,
      runCount: data.runCount,
      lastRun: data.lastRun,
    }))
    .sort((a, b) => b.creditsSpent - a.creditsSpent);

  const totalCreditsSpent = breakdown.reduce((s, b) => s + b.creditsSpent, 0);
  const totalCostDollars = Math.round(totalCreditsSpent * CREDIT_COST_RATE * 100) / 100;

  const estimatedValueLow = item.valuation?.low ?? null;
  const estimatedValueHigh = item.valuation?.high ?? null;
  const estimatedValueMid = estimatedValueLow != null && estimatedValueHigh != null
    ? Math.round((estimatedValueLow + estimatedValueHigh) / 2)
    : null;
  const listingPrice = (item as any).listingPrice ?? null;

  let roiPercent: number | null = null;
  let roiLabel: string | null = null;
  if (estimatedValueMid != null && totalCostDollars > 0) {
    roiPercent = Math.round(((estimatedValueMid - totalCostDollars) / totalCostDollars) * 100);
    roiLabel = `${roiPercent.toLocaleString()}% ROI`;
  } else if (totalCostDollars === 0) {
    roiLabel = "No AI costs yet";
  } else {
    roiLabel = "Awaiting valuation";
  }

  return NextResponse.json({
    itemId,
    totalCreditsSpent,
    totalCostDollars,
    breakdown,
    estimatedValueLow,
    estimatedValueMid,
    estimatedValueHigh,
    listingPrice,
    roiPercent,
    roiLabel,
    creditCostRate: CREDIT_COST_RATE,
  });
}
