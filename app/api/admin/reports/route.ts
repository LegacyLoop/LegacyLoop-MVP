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
    });
  } catch (err: any) {
    console.error("[admin/reports] Failed:", err.message || err);
    return Response.json({ error: "Reports failed" }, { status: 500 });
  }
}
