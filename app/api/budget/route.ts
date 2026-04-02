import { NextRequest, NextResponse } from "next/server";
import { authAdapter } from "@/lib/adapters/auth";
import { prisma } from "@/lib/db";
import { CREDIT_COST_RATE } from "@/lib/constants/pricing";

/** GET — Budget preferences + current spending summary */
export async function GET() {
  const user = await authAdapter.getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    // Budget preferences (graceful if table doesn't exist yet)
    let prefs: any = null;
    try {
      prefs = await (prisma as any).budgetPreferences.findUnique({ where: { userId: user.id } });
    } catch { /* table may not exist yet */ }

    const preferences = {
      monthlySpendCap: prefs?.monthlySpendCap ?? null,
      perProjectCap: prefs?.perProjectCap ?? null,
      perItemCap: prefs?.perItemCap ?? null,
      alertThreshold: prefs?.alertThreshold ?? 80,
      autoStopEnabled: prefs?.autoStopEnabled ?? false,
      saleDurationDefault: prefs?.saleDurationDefault ?? null,
    };

    // Current month spending
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const daysInMonth = monthEnd.getDate();
    const dayOfMonth = now.getDate();
    const daysUntilReset = daysInMonth - dayOfMonth;

    const credits = await prisma.userCredits.findUnique({ where: { userId: user.id } });

    // Monthly transactions (negative amounts = spending)
    let monthlyCreditsUsed = 0;
    try {
      const monthTxns = await prisma.creditTransaction.findMany({
        where: {
          userCredits: { userId: user.id },
          type: "spend",
          createdAt: { gte: monthStart },
        },
      });
      monthlyCreditsUsed = monthTxns.reduce((sum, t) => sum + Math.abs(t.amount), 0);
    } catch { /* empty */ }

    const monthlySpent = Math.round(monthlyCreditsUsed * CREDIT_COST_RATE * 100) / 100;
    const dailyRate = dayOfMonth > 0 ? monthlySpent / dayOfMonth : 0;
    const projectedMonthEnd = Math.round(dailyRate * daysInMonth * 100) / 100;

    // Active bots count
    let activeBotCount = 0;
    try {
      activeBotCount = await prisma.reconBot.count({
        where: { item: { userId: user.id }, isActive: true },
      });
      const buyerBots = await prisma.buyerBot.count({
        where: { item: { userId: user.id }, isActive: true },
      });
      activeBotCount += buyerBots;
    } catch { /* empty */ }

    // Per-project spending
    const projects = await prisma.project.findMany({
      where: { userId: user.id, status: { not: "COMPLETED" } },
      include: { items: { select: { id: true, status: true } } },
      orderBy: { updatedAt: "desc" },
      take: 10,
    });

    const projectData = await Promise.all(
      projects.map(async (p) => {
        const itemIds = p.items.map((i) => i.id);
        let spent = 0;
        if (itemIds.length > 0) {
          try {
            const txns = await prisma.creditTransaction.findMany({
              where: { userCredits: { userId: user.id }, type: "spend", itemId: { in: itemIds } },
            });
            spent = Math.round(txns.reduce((sum, t) => sum + Math.abs(t.amount), 0) * CREDIT_COST_RATE * 100) / 100;
          } catch { /* empty */ }
        }

        const daysLeft = p.endDate
          ? Math.max(0, Math.ceil((new Date(p.endDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
          : null;

        return {
          id: p.id,
          name: p.name,
          type: p.type,
          spent,
          cap: preferences.perProjectCap,
          daysLeft,
          startDate: p.startDate?.toISOString() ?? null,
          endDate: p.endDate?.toISOString() ?? null,
          itemCount: p.items.length,
          analyzedCount: p.items.filter((i) => !["DRAFT"].includes(i.status)).length,
          status: p.status,
        };
      })
    );

    // Generate alerts
    const alerts: { type: string; message: string; severity: "info" | "warning" | "danger" }[] = [];

    if (preferences.monthlySpendCap) {
      const pct = (monthlySpent / preferences.monthlySpendCap) * 100;
      if (pct >= 100) {
        alerts.push({ type: "budget_exceeded", message: `Monthly spending has exceeded your $${preferences.monthlySpendCap} cap`, severity: "danger" });
      } else if (pct >= preferences.alertThreshold) {
        alerts.push({ type: "approaching_limit", message: `Monthly spending at ${Math.round(pct)}% of your $${preferences.monthlySpendCap} cap`, severity: "warning" });
      }
    }

    if (projectedMonthEnd > (preferences.monthlySpendCap ?? Infinity)) {
      alerts.push({ type: "projected_overspend", message: `Projected month-end spending ($${projectedMonthEnd}) exceeds your cap`, severity: "warning" });
    }

    for (const p of projectData) {
      if (p.daysLeft !== null && p.daysLeft <= 3 && p.daysLeft > 0) {
        alerts.push({ type: "project_ending", message: `"${p.name}" ends in ${p.daysLeft} day${p.daysLeft !== 1 ? "s" : ""}`, severity: "warning" });
      }
      if (p.daysLeft === 0) {
        alerts.push({ type: "project_ended", message: `"${p.name}" sale has ended`, severity: "danger" });
      }
    }

    return NextResponse.json({
      preferences,
      spending: {
        monthlySpent,
        monthlyCreditsUsed,
        projectedMonthEnd,
        daysUntilReset,
        dayOfMonth,
        daysInMonth,
        activeBotCount,
        creditBalance: credits?.balance ?? 0,
        lifetimeSpent: credits?.spent ?? 0,
        lifetimeSpentDollars: Math.round((credits?.spent ?? 0) * CREDIT_COST_RATE * 100) / 100,
      },
      projects: projectData,
      alerts,
    });
  } catch (err: unknown) {
    console.error("[budget] GET error:", err);
    return NextResponse.json({ error: "Failed to load budget data" }, { status: 500 });
  }
}

/** PATCH — Update budget preferences */
export async function PATCH(req: NextRequest) {
  const user = await authAdapter.getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json().catch(() => ({}));

    const data: any = {};
    if ("monthlySpendCap" in body) data.monthlySpendCap = body.monthlySpendCap;
    if ("perProjectCap" in body) data.perProjectCap = body.perProjectCap;
    if ("perItemCap" in body) data.perItemCap = body.perItemCap;
    if ("alertThreshold" in body) data.alertThreshold = Math.max(10, Math.min(100, Number(body.alertThreshold) || 80));
    if ("autoStopEnabled" in body) data.autoStopEnabled = Boolean(body.autoStopEnabled);
    if ("saleDurationDefault" in body) data.saleDurationDefault = body.saleDurationDefault;

    const prefs = await (prisma as any).budgetPreferences.upsert({
      where: { userId: user.id },
      update: data,
      create: { userId: user.id, ...data },
    });

    return NextResponse.json({ success: true, preferences: prefs });
  } catch (err: unknown) {
    console.error("[budget] PATCH error:", err);
    return NextResponse.json({ error: "Failed to update budget preferences" }, { status: 500 });
  }
}
