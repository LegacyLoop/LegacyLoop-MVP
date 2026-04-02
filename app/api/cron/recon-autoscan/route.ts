import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { runScan } from "@/lib/services/recon-bot";
import { BOT_CREDIT_COSTS, TIER } from "@/lib/constants/pricing";

export const maxDuration = 120;

/**
 * POST /api/cron/recon-autoscan
 * Runs scheduled auto-scans for all active ReconBots with autoScanEnabled=true.
 * - Only scans bots whose nextScan <= now
 * - Deducts 1 credit per scan from the user's balance
 * - Skips bots whose owners lack credits (auto-pauses autoScan)
 * - Tier gate: requires Power Seller+ (tier >= 3)
 * Protected by CRON_SECRET. Called by Vercel Cron every 6 hours.
 */
export async function POST(req: NextRequest) {
  const startTime = Date.now();

  // ── Auth ──
  const authHeader = req.headers.get("authorization");
  const cronHeader = req.headers.get("x-cron-secret");
  const querySecret = req.nextUrl.searchParams.get("secret");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    console.error("[CRON-RECON] CRON_SECRET not configured");
    return NextResponse.json({ error: "Cron not configured" }, { status: 500 });
  }

  const providedSecret =
    authHeader?.replace("Bearer ", "") || cronHeader || querySecret || "";
  if (providedSecret !== cronSecret) {
    console.warn("[CRON-RECON] Unauthorized attempt");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  console.log("[CRON-RECON] Auto-scan started", new Date().toISOString());

  try {
    const now = new Date();

    // Find all bots that are active, have autoScan enabled, and are due for a scan
    const dueBots = await prisma.reconBot.findMany({
      where: {
        isActive: true,
        autoScanEnabled: true,
        nextScan: { lte: now },
      },
      include: {
        user: { select: { id: true, email: true, tier: true } },
      },
    });

    let scanned = 0;
    let skippedNoCredits = 0;
    let skippedTierGate = 0;
    let errors = 0;
    const creditCost = BOT_CREDIT_COSTS.reconBotAutoScan;

    const details: Array<{
      botId: string;
      userId: string;
      itemId: string;
      status: string;
    }> = [];

    for (const bot of dueBots) {
      // Tier gate: auto-scan requires Power Seller+ (tier >= 3)
      if (bot.user.tier < TIER.POWER_SELLER) {
        skippedTierGate++;
        // Auto-disable since they don't qualify
        await prisma.reconBot.update({
          where: { id: bot.id },
          data: { autoScanEnabled: false },
        });
        details.push({
          botId: bot.id,
          userId: bot.userId,
          itemId: bot.itemId,
          status: "skipped_tier_gate",
        });
        continue;
      }

      try {
        // Check + deduct credits in a transaction
        const deducted = await prisma.$transaction(async (tx) => {
          const uc = await tx.userCredits.findUnique({
            where: { userId: bot.userId },
          });

          if (!uc || uc.balance < creditCost) {
            // Not enough credits — disable autoScan
            await tx.reconBot.update({
              where: { id: bot.id },
              data: { autoScanEnabled: false },
            });
            return false;
          }

          const newBalance = uc.balance - creditCost;

          await tx.userCredits.update({
            where: { id: uc.id },
            data: {
              balance: newBalance,
              spent: uc.spent + creditCost,
            },
          });

          await tx.creditTransaction.create({
            data: {
              userCreditsId: uc.id,
              type: "spend",
              amount: -creditCost,
              balance: newBalance,
              description: `Recon Bot auto-scan — Item ${bot.itemId.slice(0, 8)}`,
              itemId: bot.itemId,
            },
          });

          return true;
        });

        if (!deducted) {
          skippedNoCredits++;
          details.push({
            botId: bot.id,
            userId: bot.userId,
            itemId: bot.itemId,
            status: "skipped_no_credits",
          });

          // Create notification about insufficient credits
          await prisma.notification.create({
            data: {
              userId: bot.userId,
              type: "RECON_AUTO_PAUSED",
              title: "Auto-scan paused — insufficient credits",
              message: "Your Recon Bot auto-scan was paused because you ran out of credits. Purchase more credits to re-enable.",
              link: "/credits",
            },
          }).catch(() => {});

          continue;
        }

        // Run the scan
        await runScan(bot.id);
        scanned++;
        details.push({
          botId: bot.id,
          userId: bot.userId,
          itemId: bot.itemId,
          status: "scanned",
        });

        console.log(
          `[CRON-RECON] Scanned bot ${bot.id} for user ${bot.user.email} (${creditCost} credit deducted)`
        );
      } catch (botErr: any) {
        errors++;
        details.push({
          botId: bot.id,
          userId: bot.userId,
          itemId: bot.itemId,
          status: `error: ${botErr?.message || "unknown"}`,
        });
        console.error(
          `[CRON-RECON] Error scanning bot ${bot.id}:`,
          botErr
        );
      }
    }

    const duration = Date.now() - startTime;

    // Log the cron run
    prisma.userEvent
      .create({
        data: {
          userId: process.env.SYSTEM_USER_ID || "system",
          eventType: "CRON_RECON_AUTOSCAN",
          metadata: JSON.stringify({
            dueBots: dueBots.length,
            scanned,
            skippedNoCredits,
            skippedTierGate,
            errors,
            creditCostPerScan: creditCost,
            durationMs: duration,
            runAt: now.toISOString(),
          }),
        },
      })
      .catch((e) => console.error("[CRON-RECON] Log failed:", e));

    console.log(
      `[CRON-RECON] Completed in ${duration}ms | Due: ${dueBots.length} | Scanned: ${scanned} | NoCredits: ${skippedNoCredits} | TierGate: ${skippedTierGate} | Errors: ${errors}`
    );

    return NextResponse.json({
      success: true,
      dueBots: dueBots.length,
      scanned,
      skippedNoCredits,
      skippedTierGate,
      errors,
      creditCostPerScan: creditCost,
      durationMs: duration,
      runAt: now.toISOString(),
      details,
    });
  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.error("[CRON-RECON] Fatal error:", error);

    prisma.userEvent
      .create({
        data: {
          userId: process.env.SYSTEM_USER_ID || "system",
          eventType: "CRON_RECON_AUTOSCAN_ERROR",
          metadata: JSON.stringify({
            error: error?.message || "Unknown",
            durationMs: duration,
          }),
        },
      })
      .catch(() => {});

    return NextResponse.json(
      { success: false, error: "Recon auto-scan cron failed", durationMs: duration },
      { status: 500 }
    );
  }
}

/**
 * GET /api/cron/recon-autoscan — Health check + stats.
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
    const activeAutoScanBots = await prisma.reconBot.count({
      where: { isActive: true, autoScanEnabled: true },
    });

    const recentRuns = await prisma.userEvent.findMany({
      where: {
        userId: process.env.SYSTEM_USER_ID || "system",
        eventType: {
          in: ["CRON_RECON_AUTOSCAN", "CRON_RECON_AUTOSCAN_ERROR"],
        },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    return NextResponse.json({
      status: "healthy",
      activeAutoScanBots,
      creditCostPerScan: BOT_CREDIT_COSTS.reconBotAutoScan,
      schedule: "Every 6 hours",
      requiredTier: "Power Seller (tier 3+)",
      lastRun: recentRuns[0]?.createdAt ?? null,
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
