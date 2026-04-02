import { NextResponse } from "next/server";
import { authAdapter } from "@/lib/adapters/auth";
import { prisma } from "@/lib/db";

/**
 * POST /api/budget/auto-stop
 * Pauses all active ReconBots and BuyerBots for the authenticated user.
 * Called by BudgetGuard when autoStop is enabled AND spending exceeds the cap.
 */
export async function POST() {
  const user = await authAdapter.getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let reconPaused = 0;
  let buyerPaused = 0;

  try {
    // Find and pause all active ReconBots for the user's items
    const activeReconBots = await prisma.reconBot.findMany({
      where: { item: { userId: user.id }, isActive: true },
      select: { id: true },
    });

    if (activeReconBots.length > 0) {
      const result = await prisma.reconBot.updateMany({
        where: { id: { in: activeReconBots.map((b) => b.id) } },
        data: { isActive: false },
      });
      reconPaused = result.count;
    }

    // Find and pause all active BuyerBots for the user's items
    const activeBuyerBots = await prisma.buyerBot.findMany({
      where: { item: { userId: user.id }, isActive: true },
      select: { id: true },
    });

    if (activeBuyerBots.length > 0) {
      const result = await prisma.buyerBot.updateMany({
        where: { id: { in: activeBuyerBots.map((b) => b.id) } },
        data: { isActive: false },
      });
      buyerPaused = result.count;
    }

    const totalPaused = reconPaused + buyerPaused;

    // Log the auto-stop event
    try {
      await prisma.eventLog.create({
        data: {
          itemId: activeReconBots[0]?.id ?? activeBuyerBots[0]?.id ?? "system",
          eventType: "budget_auto_stop",
          payload: JSON.stringify({
            reconPaused,
            buyerPaused,
            totalPaused,
            triggeredAt: new Date().toISOString(),
          }),
        },
      });
    } catch { /* non-fatal */ }

    return NextResponse.json({
      success: true,
      paused: totalPaused,
      reconPaused,
      buyerPaused,
    });
  } catch (err: unknown) {
    console.error("[budget/auto-stop] Error:", err);
    return NextResponse.json({ error: "Failed to pause bots" }, { status: 500 });
  }
}
