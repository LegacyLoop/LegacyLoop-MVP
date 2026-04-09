import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const maxDuration = 60;

/**
 * POST /api/cron/cache-report
 * Daily cache performance report — posts summary to Slack.
 * Protected by CRON_SECRET via Authorization header, x-cron-secret header, or query param.
 * Called by Vercel Cron daily at 9am UTC, or manually.
 *
 * CMD-CACHE-EXPORT-SLACK
 */
export async function POST(req: NextRequest) {
  const startTime = Date.now();

  // ── Auth: EXACT same pattern as /api/cron/offers ──
  const authHeader = req.headers.get("authorization");
  const cronHeader = req.headers.get("x-cron-secret");
  const querySecret = req.nextUrl.searchParams.get("secret");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    console.error("[CRON/cache-report] CRON_SECRET not configured");
    return NextResponse.json({ error: "Cron not configured" }, { status: 500 });
  }

  const providedSecret = authHeader?.replace("Bearer ", "") || cronHeader || querySecret || "";
  if (providedSecret !== cronSecret) {
    console.warn("[CRON/cache-report] Unauthorized attempt");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  console.log("[CRON/cache-report] Daily cache report started", new Date().toISOString());

  try {
    // ── Gather cache stats (same logic as cache-stats/route.ts) ──
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

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

    const botMap: Record<string, { totalCalls: number; cacheHits: number; totalSavingsUsd: number }> = {};
    for (const et of CACHE_EVENT_TYPES) {
      botMap[et.replace("_RUN", "").toLowerCase()] = { totalCalls: 0, cacheHits: 0, totalSavingsUsd: 0 };
    }

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

    let combinedCalls = 0, combinedHits = 0, combinedSavings = 0;
    const botLines: string[] = [];

    for (const [bot, stats] of Object.entries(botMap)) {
      const hitRate = stats.totalCalls > 0 ? Math.round((stats.cacheHits / stats.totalCalls) * 100) : 0;
      const indicator = stats.totalCalls === 0 ? "\u26aa" : hitRate >= 70 ? "\ud83d\udfe2" : hitRate >= 50 ? "\ud83d\udfe1" : "\ud83d\udd34";
      const label = bot.charAt(0).toUpperCase() + bot.slice(1);
      const padded = (label + ":").padEnd(18);
      botLines.push(`${indicator} ${padded} ${stats.totalCalls > 0 ? `${hitRate}% hit rate (${stats.cacheHits}/${stats.totalCalls})` : "No calls yet"}`);
      combinedCalls += stats.totalCalls;
      combinedHits += stats.cacheHits;
      combinedSavings += stats.totalSavingsUsd;
    }

    const combinedHitRate = combinedCalls > 0 ? Math.round((combinedHits / combinedCalls) * 100) : 0;
    const periodDays = Math.max(1, Math.round((Date.now() - thirtyDaysAgo.getTime()) / 86400000));
    const projectedMonthly = Number(((combinedSavings / periodDays) * 30).toFixed(2));
    const projectedAnnual = Number((projectedMonthly * 12).toFixed(2));

    // ScraperComp specialty cache
    const SPECIALTY_PLATFORMS = ["PriceCharting", "PSAcard", "Beckett", "TCGPlayer"];
    const scCounts = await prisma.scraperComp.groupBy({
      by: ["sourcePlatform"],
      where: { sourcePlatform: { in: SPECIALTY_PLATFORMS } },
      _count: true,
    });

    const scLines: string[] = [];
    let scTotal = 0;
    for (const platform of SPECIALTY_PLATFORMS) {
      const row = scCounts.find((r) => r.sourcePlatform === platform);
      const count = row?._count ?? 0;
      const padded = (platform + ":").padEnd(16);
      scLines.push(`${padded} ${count} comps cached`);
      scTotal += count;
    }

    // ── Build Slack message ──
    const today = new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
    const slackMessage = [
      `\ud83d\udcbe *LegacyLoop Daily Cache Report*`,
      `\ud83d\udcc5 ${today}`,
      `\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500`,
      `*Claude Prompt Cache (30 days)*`,
      ...botLines,
      `\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500`,
      `Combined hit rate: *${combinedHitRate}%* (${combinedHits}/${combinedCalls} calls)`,
      `\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500`,
      `*ScraperComp Specialty Cache*`,
      ...scLines,
      `Total cached:     ${scTotal} comps`,
      `\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500`,
      `\ud83d\udcb0 Est. Monthly Savings: *$${projectedMonthly.toFixed(2)}*`,
      `\ud83d\udcc8 Annual Projection:    *$${projectedAnnual.toFixed(2)}*`,
    ].join("\n");

    // ── Post to Slack ──
    let slackPosted = false;
    const slackUrl = process.env.SLACK_WEBHOOK_URL;

    if (!slackUrl) {
      console.warn("[CRON/cache-report] SLACK_WEBHOOK_URL not set — skipping Slack post");
    } else {
      try {
        const slackRes = await fetch(slackUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: slackMessage }),
        });
        slackPosted = slackRes.ok;
        if (!slackRes.ok) {
          console.error(`[CRON/cache-report] Slack POST failed: ${slackRes.status}`);
        }
      } catch (slackErr: any) {
        console.error("[CRON/cache-report] Slack POST error:", slackErr.message);
      }
    }

    // ── Log cron run ──
    const duration = Date.now() - startTime;
    prisma.userEvent.create({
      data: {
        userId: process.env.SYSTEM_USER_ID || "system",
        eventType: "CRON_CACHE_REPORT",
        metadata: JSON.stringify({
          combinedHitRate,
          combinedCalls,
          combinedHits,
          projectedMonthly,
          projectedAnnual,
          scTotal,
          slackPosted,
          durationMs: duration,
          runAt: new Date().toISOString(),
        }),
      },
    }).catch((e) => console.error("[CRON/cache-report] Log failed:", e));

    console.log(`[CRON/cache-report] Completed in ${duration}ms | Hit rate: ${combinedHitRate}% | Slack: ${slackPosted ? "posted" : "skipped"}`);

    return NextResponse.json({
      success: true,
      reportedAt: new Date().toISOString(),
      slackPosted,
      slackSkipped: !slackUrl,
      stats: {
        combinedHitRate,
        combinedCalls,
        combinedHits,
        projectedMonthlySavings: projectedMonthly,
        projectedAnnualSavings: projectedAnnual,
        scraperCompTotal: scTotal,
      },
      durationMs: duration,
    });
  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.error("[CRON/cache-report] Fatal error:", error);

    prisma.userEvent.create({
      data: {
        userId: process.env.SYSTEM_USER_ID || "system",
        eventType: "CRON_CACHE_REPORT_ERROR",
        metadata: JSON.stringify({ error: error?.message || "Unknown", durationMs: duration }),
      },
    }).catch(() => {});

    return NextResponse.json({ success: false, error: "Cache report cron failed", durationMs: duration }, { status: 500 });
  }
}

/**
 * GET /api/cron/cache-report — Health check. Shows last 10 cron runs.
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const cronHeader = req.headers.get("x-cron-secret");
  const querySecret = req.nextUrl.searchParams.get("secret");
  const cronSecret = process.env.CRON_SECRET;

  const providedSecret = authHeader?.replace("Bearer ", "") || cronHeader || querySecret || "";
  if (!cronSecret || providedSecret !== cronSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const recentRuns = await prisma.userEvent.findMany({
      where: {
        userId: process.env.SYSTEM_USER_ID || "system",
        eventType: { in: ["CRON_CACHE_REPORT", "CRON_CACHE_REPORT_ERROR"] },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    const successRuns = recentRuns.filter((r) => r.eventType === "CRON_CACHE_REPORT");

    return NextResponse.json({
      status: "healthy",
      lastRun: recentRuns[0]?.createdAt ?? null,
      totalRuns: recentRuns.length,
      successfulRuns: successRuns.length,
      schedule: "Daily at 9am UTC",
      recentRuns: recentRuns.slice(0, 5).map((r) => ({
        type: r.eventType,
        runAt: r.createdAt,
        result: r.metadata ? (() => { try { return JSON.parse(r.metadata!); } catch { return null; } })() : null,
      })),
    });
  } catch {
    return NextResponse.json({ status: "error", error: "Failed to fetch cron history" }, { status: 500 });
  }
}
