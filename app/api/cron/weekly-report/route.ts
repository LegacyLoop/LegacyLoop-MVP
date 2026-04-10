import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateWeeklyReport } from "@/lib/messaging/weekly-report";
import { sendEmail } from "@/lib/email/send";
import { weeklyReportEmail } from "@/lib/email/templates/weekly-report";

export const maxDuration = 120;

/**
 * POST /api/cron/weekly-report
 * Sends personalized weekly performance reports to all active users.
 * Protected by CRON_SECRET. Called by Vercel Cron every Monday at 9am UTC.
 *
 * CMD-WEEKLY-REPORT
 */
export async function POST(req: NextRequest) {
  const startTime = Date.now();

  // ── Auth: EXACT same pattern as /api/cron/offers ──
  const authHeader = req.headers.get("authorization");
  const cronHeader = req.headers.get("x-cron-secret");
  const querySecret = req.nextUrl.searchParams.get("secret");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    console.error("[CRON/weekly-report] CRON_SECRET not configured");
    return NextResponse.json({ error: "Cron not configured" }, { status: 500 });
  }

  const providedSecret = authHeader?.replace("Bearer ", "") || cronHeader || querySecret || "";
  if (providedSecret !== cronSecret) {
    console.warn("[CRON/weekly-report] Unauthorized attempt");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  console.log("[CRON/weekly-report] Weekly report job started", new Date().toISOString());

  try {
    // Get all users who have at least 1 item (active sellers)
    const users = await prisma.user.findMany({
      where: {
        items: { some: {} }, // at least one item
      },
      select: {
        id: true,
        email: true,
        displayName: true,
      },
    });

    console.log(`[CRON/weekly-report] Found ${users.length} active users`);

    let sent = 0;
    let failed = 0;
    let skipped = 0;

    for (const user of users) {
      try {
        // Generate report data
        const report = await generateWeeklyReport(user.id);

        // Skip if zero activity (no need to email empty reports)
        const hasActivity = report.messagesSent > 0 || report.dealsClosed > 0 || report.agentAssists > 0 || report.itemsNeedingAttention.length > 0;
        if (!hasActivity) {
          skipped++;
          continue;
        }

        // Build email
        const userName = (user.displayName || user.email.split("@")[0] || "Seller").split(" ")[0];
        const { subject, html } = weeklyReportEmail({
          userName,
          weekOf: report.weekOf,
          messagesSent: report.messagesSent,
          agentAssists: report.agentAssists,
          dealsClosed: report.dealsClosed,
          scamsBlocked: report.scamsBlocked,
          itemsNeedingAttention: report.itemsNeedingAttention.map((i) => ({
            title: i.title,
            recommendation: i.recommendation,
          })),
          agentRecommendations: report.agentRecommendations,
        });

        // Send via SendGrid
        const ok = await sendEmail({ to: user.email, subject, html });
        if (ok) {
          sent++;
          console.log(`[CRON/weekly-report] ✅ Sent to ${user.email}`);
        } else {
          failed++;
          console.log(`[CRON/weekly-report] ❌ Failed for ${user.email}`);
        }
      } catch (err: any) {
        failed++;
        console.error(`[CRON/weekly-report] Error for user ${user.id}:`, err.message);
      }
    }

    const duration = Date.now() - startTime;

    // Log cron run
    prisma.userEvent.create({
      data: {
        userId: process.env.SYSTEM_USER_ID || "system",
        eventType: "CRON_WEEKLY_REPORT",
        metadata: JSON.stringify({ sent, failed, skipped, totalUsers: users.length, durationMs: duration, runAt: new Date().toISOString() }),
      },
    }).catch((e) => console.error("[CRON/weekly-report] Log failed:", e));

    console.log(`[CRON/weekly-report] Completed in ${duration}ms | Sent: ${sent} | Failed: ${failed} | Skipped: ${skipped}`);

    return NextResponse.json({
      success: true,
      sent,
      failed,
      skipped,
      totalUsers: users.length,
      durationMs: duration,
    });
  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.error("[CRON/weekly-report] Fatal error:", error);
    return NextResponse.json({ success: false, error: "Weekly report cron failed", durationMs: duration }, { status: 500 });
  }
}

/**
 * GET /api/cron/weekly-report — Health check.
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
      where: { userId: process.env.SYSTEM_USER_ID || "system", eventType: "CRON_WEEKLY_REPORT" },
      orderBy: { createdAt: "desc" },
      take: 5,
    });

    return NextResponse.json({
      status: "healthy",
      schedule: "Every Monday at 9am UTC",
      lastRun: recentRuns[0]?.createdAt ?? null,
      totalRuns: recentRuns.length,
      recentRuns: recentRuns.map((r) => ({
        runAt: r.createdAt,
        result: r.metadata ? (() => { try { return JSON.parse(r.metadata!); } catch { return null; } })() : null,
      })),
    });
  } catch {
    return NextResponse.json({ status: "error" }, { status: 500 });
  }
}
