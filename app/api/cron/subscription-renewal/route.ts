import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { n8nRenewalReminder } from "@/lib/n8n";

export const maxDuration = 120;

/**
 * POST /api/cron/subscription-renewal
 * Fires WF21 renewal reminder for subscriptions whose period ended today.
 * Protected by CRON_SECRET. Called by Vercel Cron daily at 9am UTC.
 *
 * CMD-N8N-COMPLETE
 */
export async function POST(req: NextRequest) {
  // ── Auth: EXACT same pattern as /api/cron/weekly-report ──
  const authHeader = req.headers.get("authorization");
  const cronHeader = req.headers.get("x-cron-secret");
  const querySecret = req.nextUrl.searchParams.get("secret");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    console.error("[CRON/subscription-renewal] CRON_SECRET not configured");
    return NextResponse.json({ error: "Cron not configured" }, { status: 500 });
  }

  const providedSecret = authHeader?.replace("Bearer ", "") || cronHeader || querySecret || "";
  if (providedSecret !== cronSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Find ACTIVE subscriptions whose period ended within the last 24 hours
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const dueSubscriptions = await prisma.subscription.findMany({
      where: {
        status: "ACTIVE",
        currentPeriodEnd: { gte: oneDayAgo, lte: now },
      },
      include: { user: { select: { email: true, displayName: true } } },
    });

    let sent = 0;
    for (const sub of dueSubscriptions) {
      const firstName = sub.user.displayName?.split(" ")[0] ?? "there";
      n8nRenewalReminder(
        sub.user.email,
        firstName,
        sub.tier,
        sub.currentPeriodEnd.toISOString(),
        sub.price,
      );
      sent++;
    }

    console.log(`[CRON/subscription-renewal] Processed ${sent}/${dueSubscriptions.length} renewal reminders`);
    return NextResponse.json({ ok: true, processed: sent, total: dueSubscriptions.length });
  } catch (err) {
    console.error("[CRON/subscription-renewal] Error:", err);
    return NextResponse.json({ error: "Cron failed" }, { status: 500 });
  }
}
