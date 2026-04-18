/**
 * Intelligence Anchor — shared helper for PriceBot V9 + recalc
 *
 * CMD-V9-RECALC-ANCHOR-FIX
 *
 * Resolves the latest high/medium-confidence Item Intelligence pricing
 * anchor for an item, and applies it to formula output while preserving
 * the list ≥ accept ≥ floor invariant.
 *
 * Consumed by:
 *  - app/api/bots/pricebot/[itemId]/route.ts (primary write path)
 *  - lib/pricing/garage-sale-recalc.ts (sequencer-triggered recompute)
 *  - future: ListBot / BuyerBot Intelligence-anchor ingests
 */

import { prisma } from "@/lib/db";

export type IntelligenceConfidence = "high" | "medium";
export type PricingSourceTag =
  | "intelligence_anchored"
  | "hybrid"
  | "v8_formula";

export interface IntelligenceAnchor {
  quickSalePrice: number;
  sweetSpot: number;
  premiumPrice: number;
  confidence: IntelligenceConfidence;
  ageMs: number;
}

/**
 * Read the most recent INTELLIGENCE_RESULT for an item. Returns null
 * unless all three pricing tiers are numeric and confidence is high
 * or medium. Never throws — all errors swallowed → null.
 */
export async function resolveIntelligenceAnchor(
  itemId: string
): Promise<IntelligenceAnchor | null> {
  const intelLog = await prisma.eventLog
    .findFirst({
      where: { itemId, eventType: "INTELLIGENCE_RESULT" },
      orderBy: { createdAt: "desc" },
      select: { payload: true, createdAt: true },
    })
    .catch(() => null);

  if (!intelLog?.payload) return null;

  try {
    const parsed = JSON.parse(intelLog.payload);
    const pi = parsed?.pricingIntel || parsed?.result?.pricingIntel;
    if (
      pi &&
      typeof pi.sweetSpot === "number" &&
      typeof pi.premiumPrice === "number" &&
      typeof pi.quickSalePrice === "number" &&
      (pi.confidence === "high" || pi.confidence === "medium")
    ) {
      return {
        quickSalePrice: pi.quickSalePrice,
        sweetSpot: pi.sweetSpot,
        premiumPrice: pi.premiumPrice,
        confidence: pi.confidence,
        ageMs: Date.now() - intelLog.createdAt.getTime(),
      };
    }
  } catch {
    /* malformed payload — fall through to null */
  }

  return null;
}

export function pricingSourceFromAnchor(
  anchor: IntelligenceAnchor | null
): PricingSourceTag {
  if (!anchor) return "v8_formula";
  return anchor.confidence === "high" ? "intelligence_anchored" : "hybrid";
}

/**
 * Blend anchor into formula output, preserving list ≥ accept ≥ floor.
 * Pure + deterministic.
 */
export function applyAnchorToFormula(
  anchor: IntelligenceAnchor | null,
  formula: { listPrice: number; acceptPrice: number; floorPrice: number }
): { listPrice: number; acceptPrice: number; floorPrice: number } {
  if (!anchor) {
    return {
      listPrice: formula.listPrice,
      acceptPrice: formula.acceptPrice,
      floorPrice: formula.floorPrice,
    };
  }

  let listPrice: number;
  let acceptPrice: number;
  let floorPrice: number;

  if (anchor.confidence === "high") {
    listPrice = anchor.premiumPrice;
    acceptPrice = anchor.sweetSpot;
    floorPrice = anchor.quickSalePrice;
  } else {
    // medium: 60/40 blend Intelligence:formula
    listPrice = Math.round(
      anchor.premiumPrice * 0.6 + formula.listPrice * 0.4
    );
    acceptPrice = Math.round(
      anchor.sweetSpot * 0.6 + formula.acceptPrice * 0.4
    );
    floorPrice = Math.round(
      anchor.quickSalePrice * 0.6 + formula.floorPrice * 0.4
    );
  }

  if (listPrice < acceptPrice) listPrice = acceptPrice;
  if (floorPrice > acceptPrice) floorPrice = acceptPrice;

  return { listPrice, acceptPrice, floorPrice };
}
