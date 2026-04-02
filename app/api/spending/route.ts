import { NextResponse } from "next/server";
import { authAdapter } from "@/lib/adapters/auth";
import { prisma } from "@/lib/db";
import { CREDIT_COST_RATE } from "@/lib/constants/pricing";

export async function GET() {
  const user = await authAdapter.getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const uc = await prisma.userCredits.findUnique({ where: { userId: user.id } });
  const balance = uc?.balance ?? 0;
  const lifetime = uc?.lifetime ?? 0;
  const spent = uc?.spent ?? 0;

  // All transactions
  const allTx = uc
    ? await prisma.creditTransaction.findMany({
        where: { userCreditsId: uc.id },
        orderBy: { createdAt: "desc" },
      })
    : [];

  // Credits purchased vs earned
  const purchased = allTx.filter((t) => t.type === "purchase").reduce((s, t) => s + t.amount, 0);
  const earned = allTx.filter((t) => t.type === "bonus" || t.type === "earned").reduce((s, t) => s + t.amount, 0);

  // Spending by bot (negative amounts only)
  const spendTx = allTx.filter((t) => t.amount < 0);
  const botGroups: Record<string, { creditsSpent: number; runCount: number }> = {};
  for (const tx of spendTx) {
    const key = tx.description;
    if (!botGroups[key]) botGroups[key] = { creditsSpent: 0, runCount: 0 };
    botGroups[key].creditsSpent += Math.abs(tx.amount);
    botGroups[key].runCount += 1;
  }
  const byBot = Object.entries(botGroups)
    .map(([botName, d]) => ({ botName, creditsSpent: d.creditsSpent, costDollars: Math.round(d.creditsSpent * CREDIT_COST_RATE * 100) / 100, runCount: d.runCount }))
    .sort((a, b) => b.creditsSpent - a.creditsSpent);

  // Top items by spend
  const itemGroups: Record<string, number> = {};
  for (const tx of spendTx) {
    if (tx.itemId) {
      itemGroups[tx.itemId] = (itemGroups[tx.itemId] ?? 0) + Math.abs(tx.amount);
    }
  }
  const topItemIds = Object.entries(itemGroups).sort((a, b) => b[1] - a[1]).slice(0, 10);
  const itemRecords = topItemIds.length > 0
    ? await prisma.item.findMany({
        where: { id: { in: topItemIds.map(([id]) => id) } },
        include: { valuation: true },
      })
    : [];
  const itemMap = new Map(itemRecords.map((i) => [i.id, i]));

  const topItems = topItemIds.map(([itemId, credits]) => {
    const rec = itemMap.get(itemId);
    const estMid = rec?.valuation ? Math.round((rec.valuation.low + rec.valuation.high) / 2) : null;
    const costD = Math.round(credits * CREDIT_COST_RATE * 100) / 100;
    return {
      itemId,
      title: rec?.title || `Item ${itemId.slice(0, 8)}`,
      creditsSpent: credits,
      costDollars: costD,
      estimatedValue: estMid,
      roiPercent: estMid != null && costD > 0 ? Math.round(((estMid - costD) / costD) * 100) : null,
    };
  });

  // Recent 20 transactions
  const recentTransactions = allTx.slice(0, 20).map((t) => ({
    id: t.id,
    description: t.description,
    amount: t.amount,
    balance: t.balance,
    itemId: t.itemId,
    createdAt: t.createdAt.toISOString(),
  }));

  // Portfolio totals
  const items = await prisma.item.findMany({
    where: { userId: user.id },
    include: { valuation: true },
  });
  const totalItems = items.length;
  const analyzedItems = items.filter((i) => i.valuation).length;
  const soldItems = items.filter((i) => ["SOLD", "SHIPPED", "COMPLETED"].includes(i.status)).length;
  const totalEstimatedValue = items.reduce((s, i) => s + (i.valuation ? Math.round((i.valuation.low + i.valuation.high) / 2) : 0), 0);
  const totalSoldRevenue = items
    .filter((i) => ["SOLD", "SHIPPED", "COMPLETED"].includes(i.status))
    .reduce((s, i) => s + ((i as any).listingPrice ?? (i.valuation ? Math.round((i.valuation.low + i.valuation.high) / 2) : 0)), 0);

  const totalCreditsSpent = spendTx.reduce((s, t) => s + Math.abs(t.amount), 0);
  const totalCostDollars = Math.round(totalCreditsSpent * CREDIT_COST_RATE * 100) / 100;
  const totalValueGenerated = totalEstimatedValue + totalSoldRevenue;
  const overallRoiPercent = totalCostDollars > 0 ? Math.round(((totalValueGenerated - totalCostDollars) / totalCostDollars) * 100) : null;

  return NextResponse.json({
    credits: { balance, lifetime, spent, purchased, earned },
    spending: { totalCreditsSpent, totalCostDollars, byBot, topItems, recentTransactions },
    portfolio: { totalEstimatedValue, totalSoldRevenue, totalItems, analyzedItems, soldItems },
    overallRoi: {
      totalValueGenerated,
      totalCostDollars,
      roiPercent: overallRoiPercent,
      roiLabel: overallRoiPercent != null ? `${overallRoiPercent.toLocaleString()}% ROI` : "No spending data yet",
    },
    creditCostRate: CREDIT_COST_RATE,
  });
}
