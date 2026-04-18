/**
 * Feedback-Loop Hook — shared SOLD-transition helper
 *
 * Called after an Item transitions to SOLD status. Two responsibilities:
 *   1. (Optional) Mirror soldPrice + soldAt to Item table so V1b's Tier 1
 *      resolveSoldPrice (fast path) stays warm for subsequent accuracy
 *      computes. Skip if caller already handled the mirror.
 *   2. Fire-and-forget computePricingAccuracy to seed the accuracy
 *      dataset with this real sale.
 *
 * Contract: never throws. Never blocks the caller. Errors surface via
 * console.error only.
 *
 * CMD-PRICING-FEEDBACK-LOOP-V1c
 */

import { prisma } from "@/lib/db";
import { computePricingAccuracy } from "./feedback-loop";

export type SoldTransitionSource =
  | "items_sold_endpoint"
  | "stripe_webhook"
  | "payments_checkout"
  | "trades_respond"
  | "projects_bulk_all"
  | "projects_bulk_department"
  | "admin_manual"
  | "unknown";

export interface HandleSoldTransitionOpts {
  soldPrice?: number;
  soldAt?: Date;
  source: SoldTransitionSource;
  mirrorToItem?: boolean;
}

export async function handleSoldTransition(
  itemId: string,
  opts: HandleSoldTransitionOpts,
): Promise<void> {
  const soldAt = opts.soldAt ?? new Date();
  const mirrorToItem = opts.mirrorToItem ?? true;

  try {
    if (mirrorToItem && typeof opts.soldPrice === "number" && opts.soldPrice > 0) {
      await prisma.item.update({
        where: { id: itemId },
        data: { soldPrice: Math.round(opts.soldPrice), soldAt },
      }).catch((err) => {
        console.error("[soldTransition] mirror failed", { itemId, err });
      });
    }

    await prisma.eventLog.create({
      data: {
        itemId,
        eventType: "SOLD_TRANSITION_HOOK_FIRED",
        payload: JSON.stringify({
          source: opts.source,
          soldPrice: opts.soldPrice ?? null,
          soldAt: soldAt.toISOString(),
          mirrorApplied:
            mirrorToItem && typeof opts.soldPrice === "number" && opts.soldPrice > 0,
        }),
      },
    }).catch((err) => {
      console.error("[soldTransition] audit log failed", { itemId, err });
    });

    // Fire-and-forget accuracy compute. Small delay lets any mirror
    // update commit before computePricingAccuracy reads the item back.
    setTimeout(() => {
      computePricingAccuracy(itemId).catch((err) => {
        console.error("[soldTransition] accuracy compute failed", { itemId, err });
      });
    }, 250);
  } catch (err) {
    console.error("[soldTransition] unexpected error", { itemId, err });
  }
}
