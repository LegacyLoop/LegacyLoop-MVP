import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { TIER, MONTHLY_CREDITS } from "@/lib/constants/pricing";

export const maxDuration = 60;

/**
 * POST /api/cron/monthly-credits
 * Awards monthly subscription credits to users with active paid subscriptions.
 * Protected by CRON_SECRET. Called by Vercel Cron on the 1st of each month.
 *
 * Only awards if the user hasn't already received credits this calendar month.
 */
export async function POST(req: NextRequest) {
  const startTime = Date.now();

  // ── Auth ──
  const authHeader = req.headers.get("authorization");
  const cronHeader = req.headers.get("x-cron-secret");
  const querySecret = req.nextUrl.searchParams.get("secret");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    console.error("[CRON-CREDITS] CRON_SECRET not configured");
    return NextResponse.json({ error: "Cron not configured" }, { status: 500 });
  }

  const providedSecret =
    authHeader?.replace("Bearer ", "") || cronHeader || querySecret || "";
  if (providedSecret !== cronSecret) {
    console.warn("[CRON-CREDITS] Unauthorized attempt");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  console.log("[CRON-CREDITS] Monthly credit allocation started", new Date().toISOString());

  try {
    // Find all users with tier >= 2 (paid subscribers)
    const eligibleUsers = await prisma.user.findMany({
      where: { tier: { gte: TIER.DIY_SELLER } },
      select: { id: true, tier: true, email: true },
    });

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    let awarded = 0;
    let skipped = 0;
    let errors = 0;
    const details: Array<{ userId: string; email: string; tier: number; credits: number; status: string }> = [];

    for (const user of eligibleUsers) {
      const creditAmount = MONTHLY_CREDITS[user.tier];
      if (!creditAmount) {
        skipped++;
        details.push({ userId: user.id, email: user.email, tier: user.tier, credits: 0, status: "no_allocation_for_tier" });
        continue;
      }

      try {
        // Check if credits were already awarded this calendar month
        const uc = await prisma.userCredits.findUnique({
          where: { userId: user.id },
          select: { id: true },
        });

        if (uc) {
          const existingAward = await prisma.creditTransaction.findFirst({
            where: {
              userCreditsId: uc.id,
              type: "bonus",
              description: "monthly_subscription_credits",
              createdAt: { gte: monthStart, lt: monthEnd },
            },
          });

          if (existingAward) {
            skipped++;
            details.push({ userId: user.id, email: user.email, tier: user.tier, credits: 0, status: "already_awarded" });
            continue;
          }
        }

        // Award credits in a transaction
        await prisma.$transaction(async (tx) => {
          let userCredits = await tx.userCredits.findUnique({
            where: { userId: user.id },
          });

          if (!userCredits) {
            userCredits = await tx.userCredits.create({
              data: { userId: user.id, balance: 0, lifetime: 0, spent: 0 },
            });
          }

          const newBalance = userCredits.balance + creditAmount;

          await tx.userCredits.update({
            where: { id: userCredits.id },
            data: {
              balance: newBalance,
              lifetime: userCredits.lifetime + creditAmount,
            },
          });

          await tx.creditTransaction.create({
            data: {
              userCreditsId: userCredits.id,
              type: "bonus",
              amount: creditAmount,
              balance: newBalance,
              description: "monthly_subscription_credits",
            },
          });
        });

        awarded++;
        details.push({ userId: user.id, email: user.email, tier: user.tier, credits: creditAmount, status: "awarded" });
        console.log(`[CRON-CREDITS] Awarded ${creditAmount} credits to ${user.email} (tier ${user.tier})`);
      } catch (userErr: any) {
        errors++;
        details.push({ userId: user.id, email: user.email, tier: user.tier, credits: 0, status: `error: ${userErr?.message || "unknown"}` });
        console.error(`[CRON-CREDITS] Error for user ${user.email}:`, userErr);
      }
    }

    const duration = Date.now() - startTime;

    // Log the cron run
    prisma.userEvent
      .create({
        data: {
          userId: process.env.SYSTEM_USER_ID || "system",
          eventType: "CRON_MONTHLY_CREDITS",
          metadata: JSON.stringify({
            eligible: eligibleUsers.length,
            awarded,
            skipped,
            errors,
            durationMs: duration,
            runAt: now.toISOString(),
          }),
        },
      })
      .catch((e) => console.error("[CRON-CREDITS] Log failed:", e));

    console.log(
      `[CRON-CREDITS] Completed in ${duration}ms | Eligible: ${eligibleUsers.length} | Awarded: ${awarded} | Skipped: ${skipped} | Errors: ${errors}`
    );

    return NextResponse.json({
      success: true,
      eligible: eligibleUsers.length,
      awarded,
      skipped,
      errors,
      durationMs: duration,
      runAt: now.toISOString(),
      details,
    });
  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.error("[CRON-CREDITS] Fatal error:", error);

    prisma.userEvent
      .create({
        data: {
          userId: process.env.SYSTEM_USER_ID || "system",
          eventType: "CRON_MONTHLY_CREDITS_ERROR",
          metadata: JSON.stringify({
            error: error?.message || "Unknown",
            durationMs: duration,
          }),
        },
      })
      .catch(() => {});

    return NextResponse.json(
      { success: false, error: "Monthly credit cron failed", durationMs: duration },
      { status: 500 }
    );
  }
}

/**
 * GET /api/cron/monthly-credits -- Health check. Shows last 10 cron runs.
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const cronHeader = req.headers.get("x-cron-secret");
  const querySecret = req.nextUrl.searchParams.get("secret");
  const cronSecret = process.env.CRON_SECRET;

  const providedSecret =
    authHeader?.replace("Bearer ", "") || cronHeader || querySecret || "";
  if (!cronSecret || providedSecret !== cronSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const recentRuns = await prisma.userEvent.findMany({
      where: {
        userId: process.env.SYSTEM_USER_ID || "system",
        eventType: {
          in: ["CRON_MONTHLY_CREDITS", "CRON_MONTHLY_CREDITS_ERROR"],
        },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    const successRuns = recentRuns.filter(
      (r) => r.eventType === "CRON_MONTHLY_CREDITS"
    );
    const totalAwarded = successRuns.reduce((sum, r) => {
      try {
        const m = JSON.parse(r.metadata || "{}");
        return sum + (m.awarded || 0);
      } catch {
        return sum;
      }
    }, 0);

    return NextResponse.json({
      status: "healthy",
      lastRun: recentRuns[0]?.createdAt ?? null,
      totalRuns: recentRuns.length,
      successfulRuns: successRuns.length,
      totalUsersAwarded: totalAwarded,
      schedule: "1st of each month at midnight UTC",
      tierAllocations: MONTHLY_CREDITS,
      recentRuns: recentRuns.slice(0, 5).map((r) => ({
        type: r.eventType,
        runAt: r.createdAt,
        result: r.metadata
          ? (() => {
              try {
                return JSON.parse(r.metadata!);
              } catch {
                return null;
              }
            })()
          : null,
      })),
    });
  } catch {
    return NextResponse.json(
      { status: "error", error: "Failed to fetch cron history" },
      { status: 500 }
    );
  }
}
