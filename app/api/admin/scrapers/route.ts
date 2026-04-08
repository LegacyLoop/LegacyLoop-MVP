import { authAdapter } from "@/lib/adapters/auth";
import { prisma } from "@/lib/db";
import { isAdmin } from "@/lib/constants/admin";
import {
  SCRAPER_REGISTRY,
  REGISTRY_STATS,
} from "@/lib/market-intelligence/scraper-tiers";
import {
  SCRAPER_DISPATCH_MAP,
  DISPATCH_MAP_STATS,
} from "@/lib/market-intelligence/scraper-dispatch-map";
import {
  BOT_SCRAPER_ALLOWLIST,
  ALLOWLIST_STATS,
} from "@/lib/market-intelligence/bot-scraper-allowlist";
import { BLOCKED_ACTORS } from "@/lib/market-intelligence/blocked-actors";
import { CEILINGS } from "@/lib/market-intelligence/cost-ceiling";
import { getTelemetryDropStats } from "@/lib/market-intelligence/telemetry-drop-counter";

/**
 * GET /api/admin/scrapers
 *
 * Returns the full Scraper Economy snapshot for the /admin
 * dashboard tile and any future polling / external dashboards.
 *
 * Auth: admin only (matches /api/admin/backfill pattern).
 *
 * Added by CMD-SCRAPER-CEILINGS-D3.
 */
export async function GET() {
  try {
    const user = await authAdapter.getSession();
    if (!user || !isAdmin(user.email)) {
      return new Response("Unauthorized", { status: 401 });
    }

    // Time windows
    const last24h = new Date();
    last24h.setHours(last24h.getHours() - 24);
    const todayStart = new Date();
    todayStart.setUTCHours(0, 0, 0, 0);

    // Parallel ScraperUsageLog queries — every where clause hits
    // an indexed column (D1's @@index declarations).
    const [
      totalCalls,
      costAgg,
      successCount,
      blockedCount,
      byBot,
      topSlugs,
      blockReasons,
      youtubeUsedToday,
    ] = await Promise.all([
      prisma.scraperUsageLog.count({
        where: { createdAt: { gte: last24h } },
      }),
      prisma.scraperUsageLog.aggregate({
        where: { createdAt: { gte: last24h }, success: true },
        _sum: { cost: true },
      }),
      prisma.scraperUsageLog.count({
        where: { createdAt: { gte: last24h }, success: true },
      }),
      prisma.scraperUsageLog.count({
        where: { createdAt: { gte: last24h }, blocked: true },
      }),
      prisma.scraperUsageLog.groupBy({
        by: ["botName"],
        where: { createdAt: { gte: last24h } },
        _count: true,
        _sum: { cost: true },
        orderBy: { _count: { botName: "desc" } },
        take: 10,
      }),
      prisma.scraperUsageLog.groupBy({
        by: ["slug"],
        where: { createdAt: { gte: last24h } },
        _count: true,
        _sum: { cost: true, compsReturned: true },
        orderBy: { _count: { slug: "desc" } },
        take: 10,
      }),
      prisma.scraperUsageLog.groupBy({
        by: ["blockReason"],
        where: { createdAt: { gte: last24h }, blocked: true },
        _count: true,
      }),
      prisma.scraperUsageLog.count({
        where: {
          slug: "streamers/youtube-scraper",
          success: true,
          createdAt: { gte: todayStart },
        },
      }),
    ]);

    const totalCost = Number((costAgg._sum.cost ?? 0).toFixed(4));
    const successRate =
      totalCalls > 0 ? Math.round((successCount / totalCalls) * 100) : 0;

    // Per-bot success rate is a second pass since groupBy can't
    // express conditional aggregates. We do one extra count per
    // bot in parallel — small N (<= 10).
    const successCountByBot = await Promise.all(
      byBot.map((row) =>
        prisma.scraperUsageLog
          .count({
            where: {
              botName: row.botName,
              createdAt: { gte: last24h },
              success: true,
            },
          })
          .then((s) => ({ botName: row.botName, success: s })),
      ),
    );
    const successByBotMap = new Map(
      successCountByBot.map((r) => [r.botName, r.success]),
    );

    const youtubeQuotaCap = 80;
    const youtubeQuotaRemaining = Math.max(0, youtubeQuotaCap - youtubeUsedToday);
    const youtubeResetAt = new Date();
    youtubeResetAt.setUTCHours(24, 0, 0, 0); // next UTC midnight

    const telemetryStats = getTelemetryDropStats();

    const payload = {
      generatedAt: new Date().toISOString(),
      ceilings: {
        normalMax: CEILINGS.normalMax,
        megaBotAddOnMax: CEILINGS.megaBotAddOnMax,
        combinedMax: CEILINGS.combinedMax,
      },
      registry: {
        ...REGISTRY_STATS,
      },
      dispatchMap: {
        totalEntries: DISPATCH_MAP_STATS.totalEntries,
        builtinEntries: DISPATCH_MAP_STATS.builtinEntries,
        apifyEntries: DISPATCH_MAP_STATS.apifyEntries,
        missingActiveSlugs: DISPATCH_MAP_STATS.missingActiveSlugs,
      },
      allowlist: {
        ...ALLOWLIST_STATS,
        botsConfigured: Object.keys(BOT_SCRAPER_ALLOWLIST).length,
      },
      killswitch: {
        globalEnvActive: process.env.APIFY_KILL_SWITCH === "true",
        hardBlockedCount: BLOCKED_ACTORS.length,
      },
      youtubeQuota: {
        used: youtubeUsedToday,
        cap: youtubeQuotaCap,
        remaining: youtubeQuotaRemaining,
        percent: Math.round((youtubeUsedToday / youtubeQuotaCap) * 100),
        resetAt: youtubeResetAt.toISOString(),
      },
      last24h: {
        totalCalls,
        totalCost,
        successCount,
        blockedCount,
        successRate,
        byBot: byBot.map((row) => {
          const succ = successByBotMap.get(row.botName) ?? 0;
          return {
            botName: row.botName,
            calls: row._count,
            cost: Number((row._sum.cost ?? 0).toFixed(4)),
            successCount: succ,
            successRate:
              row._count > 0 ? Math.round((succ / row._count) * 100) : 0,
          };
        }),
        topSlugs: topSlugs.map((row) => ({
          slug: row.slug,
          calls: row._count,
          cost: Number((row._sum.cost ?? 0).toFixed(4)),
          compsReturned: row._sum.compsReturned ?? 0,
        })),
        blockReasons: blockReasons.map((row) => ({
          reason: row.blockReason ?? "unknown",
          count: row._count,
        })),
      },
      telemetry: {
        dropsTotal: telemetryStats.total,
        dropsSinceBoot: telemetryStats.sinceBoot,
        bootedAt: telemetryStats.bootedAt.toISOString(),
        lastDropAt: telemetryStats.lastDropAt?.toISOString() ?? null,
        lastDropError: telemetryStats.lastDropError,
      },
    };

    return new Response(JSON.stringify(payload), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store, max-age=0",
      },
    });
  } catch (e) {
    console.error("[admin/scrapers] failed:", e);
    return new Response(
      JSON.stringify({
        error: "scrapers_endpoint_failed",
        message: e instanceof Error ? e.message : String(e),
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}
