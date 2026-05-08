import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { processExpiredOffers } from "@/lib/offers/cron";
import { verifyCronSecret } from "@/lib/auth/cron-auth";

export const maxDuration = 60;

/**
 * POST /api/cron/offers
 * Hardened offer expiry cron job.
 * Protected by CRON_SECRET via Authorization header, x-cron-secret header, or query param.
 * Called by Vercel Cron every 30 minutes, or manually.
 */
export async function POST(req: NextRequest) {
  const startTime = Date.now();

  // CMD-CRON-SECRET-CONSTANT-TIME-MIRROR V19 (R23 P2): constant-time auth
  const auth = verifyCronSecret(req);
  if (!auth.ok) {
    return NextResponse.json(
      { error: auth.error },
      { status: auth.error === "Cron not configured" ? 500 : 401 },
    );
  }

  console.log("[CRON] Offer expiry job started", new Date().toISOString());

  try {
    const result = await processExpiredOffers();
    const duration = Date.now() - startTime;

    prisma.userEvent.create({
      data: {
        userId: process.env.SYSTEM_USER_ID || "system",
        eventType: "CRON_OFFER_EXPIRY",
        metadata: JSON.stringify({ expired: result.expired, errors: result.errors, durationMs: duration, runAt: new Date().toISOString() }),
      },
    }).catch((e) => console.error("[CRON] Log failed:", e));

    console.log(`[CRON] Completed in ${duration}ms | Expired: ${result.expired} | Errors: ${result.errors}`);

    return NextResponse.json({ success: true, expired: result.expired, errors: result.errors, durationMs: duration, runAt: new Date().toISOString() });
  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.error("[CRON] Fatal error:", error);

    prisma.userEvent.create({
      data: { userId: process.env.SYSTEM_USER_ID || "system", eventType: "CRON_OFFER_EXPIRY_ERROR", metadata: JSON.stringify({ error: error?.message || "Unknown", durationMs: duration }) },
    }).catch(() => {});

    return NextResponse.json({ success: false, error: "Cron job failed", durationMs: duration }, { status: 500 });
  }
}

/**
 * GET /api/cron/offers — Health check. Shows last 10 cron runs.
 */
export async function GET(req: NextRequest) {
  // CMD-CRON-SECRET-CONSTANT-TIME-MIRROR V19 (R23 P2): constant-time auth
  const auth = verifyCronSecret(req);
  if (!auth.ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const recentRuns = await prisma.userEvent.findMany({
      where: { userId: process.env.SYSTEM_USER_ID || "system", eventType: { in: ["CRON_OFFER_EXPIRY", "CRON_OFFER_EXPIRY_ERROR"] } },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    const successRuns = recentRuns.filter((r) => r.eventType === "CRON_OFFER_EXPIRY");
    const totalExpired = successRuns.reduce((sum, r) => {
      try { const m = JSON.parse(r.metadata || "{}"); return sum + (m.expired || 0); } catch { return sum; }
    }, 0);

    return NextResponse.json({
      status: "healthy",
      lastRun: recentRuns[0]?.createdAt ?? null,
      totalRuns: recentRuns.length,
      successfulRuns: successRuns.length,
      totalOffersExpired: totalExpired,
      schedule: "Every 30 minutes",
      recentRuns: recentRuns.slice(0, 5).map((r) => ({ type: r.eventType, runAt: r.createdAt, result: r.metadata ? (() => { try { return JSON.parse(r.metadata!); } catch { return null; } })() : null })),
    });
  } catch {
    return NextResponse.json({ status: "error", error: "Failed to fetch cron history" }, { status: 500 });
  }
}
