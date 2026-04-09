import { authAdapter } from "@/lib/adapters/auth";
import { prisma } from "@/lib/db";
import { isAdmin } from "@/lib/constants/admin";

/**
 * GET /api/admin/cache-stats
 *
 * Returns Claude prompt cache + ScraperComp specialty cache metrics
 * for the /admin Cache Performance tile.
 *
 * Claude data: parsed from EventLog.payload JSON where eventType IN
 * (ANTIQUEBOT_RUN, COLLECTIBLESBOT_RUN, LISTBOT_RUN, MEGABOT_RUN).
 * Fields: claudeCacheHit, claudeCacheReadTokens, claudeCacheSavingsUsd.
 *
 * ScraperComp data: counts from ScraperComp model grouped by
 * sourcePlatform for specialty scrapers (PriceCharting, PSAcard,
 * Beckett, TCGPlayer).
 *
 * Auth: admin only (matches /api/admin/scrapers pattern).
 * CMD-ADMIN-CACHE-WIDGET
 */
export async function GET() {
  try {
    const user = await authAdapter.getSession();
    if (!user || !isAdmin(user.email)) {
      return new Response("Unauthorized", { status: 401 });
    }

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // ── Claude prompt cache: parse EventLog payloads ──────────────
    const CACHE_EVENT_TYPES = [
      "ANTIQUEBOT_RUN",
      "COLLECTIBLESBOT_RUN",
      "LISTBOT_RUN",
      "MEGABOT_RUN",
    ];

    const cacheLogs = await prisma.eventLog.findMany({
      where: {
        eventType: { in: CACHE_EVENT_TYPES },
        createdAt: { gte: thirtyDaysAgo },
      },
      select: { eventType: true, payload: true },
    });

    // Per-bot aggregation
    const botMap: Record<string, {
      totalCalls: number;
      cacheHits: number;
      totalSavingsUsd: number;
      totalReadTokens: number;
    }> = {};

    for (const et of CACHE_EVENT_TYPES) {
      const key = et.replace("_RUN", "").toLowerCase();
      botMap[key] = { totalCalls: 0, cacheHits: 0, totalSavingsUsd: 0, totalReadTokens: 0 };
    }

    for (const log of cacheLogs) {
      const key = log.eventType.replace("_RUN", "").toLowerCase();
      if (!botMap[key]) continue;
      botMap[key].totalCalls++;

      if (!log.payload) continue;
      try {
        const data = JSON.parse(log.payload);
        if (data.claudeCacheHit === true) {
          botMap[key].cacheHits++;
        }
        if (typeof data.claudeCacheReadTokens === "number") {
          botMap[key].totalReadTokens += data.claudeCacheReadTokens;
        }
        if (typeof data.claudeCacheSavingsUsd === "number") {
          botMap[key].totalSavingsUsd += data.claudeCacheSavingsUsd;
        }
      } catch {
        // Skip malformed payload
      }
    }

    // Build per-bot response with hit rates
    const claudePerBot: Record<string, {
      totalCalls: number;
      cacheHits: number;
      hitRate: number;
      totalSavingsUsd: number;
      totalReadTokens: number;
    }> = {};

    let combinedCalls = 0;
    let combinedHits = 0;
    let combinedSavings = 0;
    let combinedReadTokens = 0;

    for (const [bot, stats] of Object.entries(botMap)) {
      claudePerBot[bot] = {
        ...stats,
        totalSavingsUsd: Number(stats.totalSavingsUsd.toFixed(6)),
        hitRate: stats.totalCalls > 0
          ? Math.round((stats.cacheHits / stats.totalCalls) * 100)
          : 0,
      };
      combinedCalls += stats.totalCalls;
      combinedHits += stats.cacheHits;
      combinedSavings += stats.totalSavingsUsd;
      combinedReadTokens += stats.totalReadTokens;
    }

    const combinedHitRate = combinedCalls > 0
      ? Math.round((combinedHits / combinedCalls) * 100)
      : 0;

    // Project monthly savings: (savings in period) × (30 / days in period)
    const periodDays = Math.max(1, Math.round(
      (Date.now() - thirtyDaysAgo.getTime()) / 86400000,
    ));
    const projectedMonthlySavings = Number(
      ((combinedSavings / periodDays) * 30).toFixed(4),
    );
    const projectedAnnualSavings = Number(
      (projectedMonthlySavings * 12).toFixed(2),
    );

    // ── ScraperComp specialty cache: platform counts ──────────────
    const SPECIALTY_PLATFORMS = ["PriceCharting", "PSAcard", "Beckett", "TCGPlayer"];

    const scraperCompCounts = await prisma.scraperComp.groupBy({
      by: ["sourcePlatform"],
      where: { sourcePlatform: { in: SPECIALTY_PLATFORMS } },
      _count: true,
    });

    // Also count cache hits from scraperUsageLog for enrichment-cache
    const specialtyCacheHits = await prisma.scraperUsageLog.count({
      where: {
        slug: "enrichment-cache",
        createdAt: { gte: thirtyDaysAgo },
      },
    });

    const scrapercompPerPlatform: Record<string, {
      totalComps: number;
    }> = {};

    let scTotalComps = 0;
    for (const platform of SPECIALTY_PLATFORMS) {
      const row = scraperCompCounts.find(
        (r) => r.sourcePlatform === platform,
      );
      const count = row?._count ?? 0;
      scrapercompPerPlatform[platform.toLowerCase()] = {
        totalComps: count,
      };
      scTotalComps += count;
    }

    return Response.json({
      claude: {
        ...claudePerBot,
        combined: {
          totalCalls: combinedCalls,
          cacheHits: combinedHits,
          hitRate: combinedHitRate,
          totalSavingsUsd: Number(combinedSavings.toFixed(6)),
          totalReadTokens: combinedReadTokens,
          projectedMonthlySavings,
        },
      },
      scrapercomp: {
        ...scrapercompPerPlatform,
        combined: {
          totalComps: scTotalComps,
          cacheHitsFromLog: specialtyCacheHits,
        },
      },
      totals: {
        combinedSavingsUsd: Number(combinedSavings.toFixed(6)),
        projectedMonthlySavings,
        projectedAnnualSavings,
        periodDays,
        lastUpdated: new Date().toISOString(),
      },
    });
  } catch (err: any) {
    console.error("[admin/cache-stats] Failed:", err.message || err);
    return Response.json({ error: "Cache stats failed" }, { status: 500 });
  }
}
