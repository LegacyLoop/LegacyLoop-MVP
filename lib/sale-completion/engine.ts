/**
 * Sale Completion Engine
 * Unified orchestrator called by all three delivery paths
 * (parcel, pickup, LTL) when they reach their terminal state.
 *
 * Chain: Confirm Status → Release Funds → Notify Seller → Log Event → Return Summary
 * Each step is individually try/caught — one failure never aborts the chain.
 */
import { prisma } from "@/lib/db";

type CompletionType = "CARRIER_DELIVERY" | "PICKUP_HANDOFF" | "LTL_DELIVERED";

interface CompletionParams {
  completionType: CompletionType;
  deliveredAt: Date;
  trackingNumber?: string;
  handoffCode?: string;
  bolNumber?: string;
}

interface CompletionResult {
  success: boolean;
  closedAt: Date;
  fundsReleased: boolean;
  errors: string[];
}

export async function runSaleCompletionChain(
  itemId: string,
  userId: string,
  params: CompletionParams
): Promise<CompletionResult> {
  const errors: string[] = [];
  let fundsReleased = false;
  const closedAt = params.deliveredAt;

  // ── STEP 1: Confirm Item Status ──────────────────────────────────────────
  try {
    const item = await prisma.item.findUnique({
      where: { id: itemId },
      select: { status: true },
    });
    if (item && item.status !== "COMPLETED") {
      await prisma.item.update({
        where: { id: itemId },
        data: { status: "COMPLETED" },
      });
      console.log("[SaleCompletion] Safety fallback: set item to COMPLETED", itemId);
    }
  } catch (err: any) {
    errors.push(`Step 1 (confirm status): ${err?.message || "unknown"}`);
    console.error("[SaleCompletion] Step 1 error:", err);
  }

  // ── STEP 2: Release Funds ────────────────────────────────────────────────
  try {
    const pendingEarnings = await prisma.sellerEarnings.findMany({
      where: { itemId, status: "pending" },
    });
    if (pendingEarnings.length > 0) {
      for (const earning of pendingEarnings) {
        await prisma.sellerEarnings.update({
          where: { id: earning.id },
          data: {
            status: "available",
            holdUntil: new Date(),
          },
        });
      }
      fundsReleased = true;
      console.log("[SaleCompletion] Funds released for item", itemId, `(${pendingEarnings.length} earnings)`);

      // Log FUNDS_RELEASED event
      await prisma.eventLog.create({
        data: {
          itemId,
          eventType: "FUNDS_RELEASED",
          payload: JSON.stringify({
            completionType: params.completionType,
            releasedAt: new Date().toISOString(),
            earningsCount: pendingEarnings.length,
            totalReleased: pendingEarnings.reduce((sum, e) => sum + e.netEarnings, 0),
          }),
        },
      });
    } else {
      console.log("[SaleCompletion] No pending earnings found for item", itemId);
    }
  } catch (err: any) {
    errors.push(`Step 2 (release funds): ${err?.message || "unknown"}`);
    console.error("[SaleCompletion] Step 2 error:", err);
  }

  // ── STEP 3: Create Seller Notification ───────────────────────────────────
  try {
    const completionLabels: Record<CompletionType, string> = {
      CARRIER_DELIVERY: "Carrier delivery confirmed",
      PICKUP_HANDOFF: "Pickup handoff complete",
      LTL_DELIVERED: "Freight delivery confirmed",
    };

    await prisma.notification.create({
      data: {
        userId,
        type: "SALE_COMPLETE",
        title: "Sale Closed — Funds Available",
        message: `${completionLabels[params.completionType]}. Your earnings are now available for payout.`,
        link: `/items/${itemId}`,
      },
    });
    console.log("[SaleCompletion] Seller notification created for", itemId);
  } catch (err: any) {
    errors.push(`Step 3 (notification): ${err?.message || "unknown"}`);
    console.error("[SaleCompletion] Step 3 error:", err);
  }

  // ── STEP 4: Log Sale Completion Event ────────────────────────────────────
  try {
    await prisma.eventLog.create({
      data: {
        itemId,
        eventType: "SALE_COMPLETED",
        payload: JSON.stringify({
          completionType: params.completionType,
          deliveredAt: params.deliveredAt.toISOString(),
          closedAt: closedAt.toISOString(),
          fundsReleased,
          trackingNumber: params.trackingNumber ?? null,
          handoffCode: params.handoffCode ?? null,
          bolNumber: params.bolNumber ?? null,
        }),
      },
    });
    console.log("[SaleCompletion] SALE_COMPLETED event logged for", itemId);
  } catch (err: any) {
    errors.push(`Step 4 (event log): ${err?.message || "unknown"}`);
    console.error("[SaleCompletion] Step 4 error:", err);
  }

  // ── STEP 5: Return Summary ──────────────────────────────────────────────
  const criticalFailed = errors.some(
    (e) => e.startsWith("Step 1") || e.startsWith("Step 2")
  );

  if (errors.length > 0) {
    console.warn("[SaleCompletion] Chain completed with errors:", errors);
  }

  // ── STEP 6: Track Bot Accuracy ──────────────────────────────────────────
  try {
    const soldItem = await prisma.item.findUnique({
      where: { id: itemId },
      select: { soldPrice: true },
    });
    if (soldItem?.soldPrice && soldItem.soldPrice > 0) {
      import("@/lib/bots/accuracy").then(m => m.trackBotAccuracy(itemId, soldItem.soldPrice!)).catch(() => null);
    }
  } catch { /* non-critical */ }

  return {
    success: !criticalFailed,
    closedAt,
    fundsReleased,
    errors,
  };
}
