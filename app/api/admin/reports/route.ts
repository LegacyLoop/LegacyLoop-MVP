import { authAdapter } from "@/lib/adapters/auth";
import { prisma } from "@/lib/db";
import { isAdmin } from "@/lib/constants/admin";

/**
 * GET /api/admin/reports
 * Returns platform-wide reporting metrics. Admin-only.
 */
export async function GET() {
  try {
    const user = await authAdapter.getSession();
    if (!user || !isAdmin(user.email)) {
      return new Response("Unauthorized", { status: 401 });
    }

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      totalItems,
      totalProjects,
      recentUsers,
      recentItems,
      soldItems,
      totalTransactions,
      totalPriceSnapshots,
      totalEventLogs,
      totalUserEvents,
      statusCounts,
      recentUserEvents,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.item.count(),
      prisma.project.count(),
      prisma.user.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
      prisma.item.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
      prisma.item.count({ where: { status: { in: ["SOLD", "SHIPPED", "COMPLETED"] } } }),
      prisma.transaction.count(),
      prisma.priceSnapshot.count(),
      prisma.eventLog.count(),
      prisma.userEvent.count(),
      prisma.item.groupBy({ by: ["status"], _count: true }),
      prisma.userEvent.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
    ]);

    // Revenue from sold items
    const soldItemsData = await prisma.item.findMany({
      where: { status: { in: ["SOLD", "SHIPPED", "COMPLETED"] } },
      select: { soldPrice: true, listingPrice: true },
    });

    const totalRevenue = soldItemsData.reduce((sum, i) => {
      return sum + (i.soldPrice ?? i.listingPrice ?? 0);
    }, 0);

    // Intelligence coverage
    const withIntelligence = await Promise.all([
      prisma.item.count({ where: { category: { not: null } } }),
      prisma.item.count({ where: { brand: { not: null } } }),
      prisma.item.count({ where: { conditionGrade: { not: null } } }),
    ]);

    const statusBreakdown: Record<string, number> = {};
    for (const s of statusCounts) {
      statusBreakdown[s.status] = s._count;
    }

    // CMD-CACHE-EXPORT-SLACK (Part B): Cache performance metrics.
    // Wrapped in try/catch so if cache query fails the rest of the
    // report still returns. Same parse logic as cache-stats/route.ts.
    let cachePerformance: any = null;
    try {
      const cacheThirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const CACHE_EVENT_TYPES = ["ANTIQUEBOT_RUN", "COLLECTIBLESBOT_RUN", "LISTBOT_RUN", "MEGABOT_RUN"];

      const cacheLogs = await prisma.eventLog.findMany({
        where: { eventType: { in: CACHE_EVENT_TYPES }, createdAt: { gte: cacheThirtyDaysAgo } },
        select: { eventType: true, payload: true },
      });

      const botMap: Record<string, { totalCalls: number; cacheHits: number; totalSavingsUsd: number }> = {};
      for (const et of CACHE_EVENT_TYPES) botMap[et.replace("_RUN", "").toLowerCase()] = { totalCalls: 0, cacheHits: 0, totalSavingsUsd: 0 };

      for (const log of cacheLogs) {
        const key = log.eventType.replace("_RUN", "").toLowerCase();
        if (!botMap[key]) continue;
        botMap[key].totalCalls++;
        if (!log.payload) continue;
        try {
          const d = JSON.parse(log.payload);
          if (d.claudeCacheHit === true) botMap[key].cacheHits++;
          if (typeof d.claudeCacheSavingsUsd === "number") botMap[key].totalSavingsUsd += d.claudeCacheSavingsUsd;
        } catch { /* skip */ }
      }

      let cc = 0, ch = 0, cs = 0;
      const claudePerBot: Record<string, { totalCalls: number; cacheHits: number; hitRate: number; totalSavingsUsd: number }> = {};
      for (const [bot, s] of Object.entries(botMap)) {
        claudePerBot[bot] = { ...s, totalSavingsUsd: Number(s.totalSavingsUsd.toFixed(6)), hitRate: s.totalCalls > 0 ? Math.round((s.cacheHits / s.totalCalls) * 100) : 0 };
        cc += s.totalCalls; ch += s.cacheHits; cs += s.totalSavingsUsd;
      }

      const monthly = Number(((cs / 30) * 30).toFixed(4));

      const scCounts = await prisma.scraperComp.groupBy({
        by: ["sourcePlatform"],
        where: { sourcePlatform: { in: ["PriceCharting", "PSAcard", "Beckett", "TCGPlayer"] } },
        _count: true,
      });
      const scPerPlatform: Record<string, { totalComps: number }> = {};
      let scTotal = 0;
      for (const row of scCounts) { scPerPlatform[row.sourcePlatform.toLowerCase()] = { totalComps: row._count }; scTotal += row._count; }

      cachePerformance = {
        claude: { ...claudePerBot, combined: { totalCalls: cc, cacheHits: ch, hitRate: cc > 0 ? Math.round((ch / cc) * 100) : 0, totalSavingsUsd: Number(cs.toFixed(6)), projectedMonthlySavings: monthly } },
        scrapercomp: { ...scPerPlatform, combined: { totalComps: scTotal } },
        totals: { projectedMonthlySavings: monthly, projectedAnnualSavings: Number((monthly * 12).toFixed(2)), periodDays: 30, lastUpdated: new Date().toISOString() },
      };
    } catch (cacheErr) {
      console.warn("[admin/reports] Cache performance query failed (non-critical):", cacheErr);
    }

    return Response.json({
      overview: {
        totalUsers,
        totalItems,
        totalProjects,
        soldItems,
        totalRevenue: Math.round(totalRevenue),
        totalTransactions,
        totalPriceSnapshots,
        totalEventLogs,
        totalUserEvents,
      },
      growth: {
        newUsersLast30d: recentUsers,
        newItemsLast30d: recentItems,
        userEventsLast7d: recentUserEvents,
      },
      statusBreakdown,
      intelligenceCoverage: {
        total: totalItems,
        withCategory: withIntelligence[0],
        withBrand: withIntelligence[1],
        withConditionGrade: withIntelligence[2],
      },
      cachePerformance,
    });
  } catch (err: any) {
    console.error("[admin/reports] Failed:", err.message || err);
    return Response.json({ error: "Reports failed" }, { status: 500 });
  }
}
