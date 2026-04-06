/**
 * lib/bots/item-spec-context.ts
 * ─────────────────────────────────────────────────────────────────
 * The Bot Constitution — single source of truth for seller listing
 * constraints.
 *
 * Every bot that reads an Item should call buildItemSpecContext()
 * to get the canonical view of:
 *   • Where the seller lives + how far they'll deliver
 *   • Whether the item is shippable, oversized, fragile, or freight
 *   • The seller's pricing + commission rate
 *   • Derived constraint flags (isFreightOnly, isLocalOnly, etc.)
 *   • A prompt-ready text block bots inject into their AI prompts
 *
 * Reads happen from the LIVE Item model fields — NEVER from stale
 * AiResult.rawJson. AnalyzeBot already persists aiShippingDifficulty,
 * aiWeightLbs, etc. via lib/data/populate-intelligence.ts. This file
 * is the canonical READER of those fields.
 *
 * SPEC-WIRE FIX: addresses the production bug where PriceBot
 * recommended shipping a freight item from Maine to Pennsylvania
 * because it never read item.aiShippingDifficulty.
 *
 * CMD-PRICEBOT-SPEC-001 — Step 4
 * ─────────────────────────────────────────────────────────────────
 */

import { prisma } from "@/lib/db";
import { getMarketInfo } from "@/lib/pricing/market-data";

// ─── Types ─────────────────────────────────────────────────────

export type ShippingDifficulty =
  | "Easy"
  | "Moderate"
  | "Difficult"
  | "Freight only"
  | null;

export type SaleMethod = "BOTH" | "LOCAL_PICKUP" | "ONLINE_SHIPPING";
export type ShippingPreference = "BUYER_PAYS" | "FREE_SHIPPING" | "LOCAL_ONLY";

export interface ItemSpecContext {
  // ── LOCATION ──
  saleZip: string | null;
  saleCity: string | null;
  saleState: string | null;
  saleRadiusMi: number;
  saleMethod: SaleMethod;
  shippingPreference: ShippingPreference;

  // ── SHIPPABILITY (sourced from live Item fields) ──
  shippingDifficulty: ShippingDifficulty;
  weightLbs: number | null;
  shippingNotes: string | null;
  shippingConfidence: number | null;
  isFragile: boolean;
  // Manual dimensions if seller entered them
  manualDimensions: { length: number | null; width: number | null; height: number | null } | null;

  // ── DERIVED FLAGS (the rules every bot checks) ──
  /** True if AI classified as "Freight only" OR weight > 70 lbs. */
  isFreightOnly: boolean;
  /** True if seller chose LOCAL_ONLY shipping pref OR LOCAL_PICKUP sale method. */
  isLocalOnly: boolean;
  /** True if local pickup is the strongly preferred channel (small radius OR freight). */
  isLocalPreferred: boolean;
  /** Estimated freight cost when item is freight-classified. */
  estimatedFreightCostUsd: number | null;

  // ── SELLER ECONOMICS ──
  listingPriceUsd: number | null;
  commissionRate: number;          // 0.04 = 4%
  buyerProcessingFeeRate: number;  // 0.0175

  // ── PROMPT-READY BLOCK ──
  /** The text block bots inject into their AI system prompt. */
  promptBlock: string;
  /** True if any field had to fall back to AiResult.rawJson — diagnostic. */
  fellBackToRawJson: boolean;
}

// ─── Constants ─────────────────────────────────────────────────

const FREIGHT_WEIGHT_THRESHOLD_LBS = 70;
const LOCAL_RADIUS_THRESHOLD_MI = 50;
const DEFAULT_FREIGHT_ESTIMATE_USD = 245;
const DEFAULT_BUYER_FEE = 0.0175;

/**
 * Default commission rate by user tier label. Mirrors lib/billing
 * commission table — kept here as a fallback only. The router
 * still calls user.tier-based rates when available.
 */
const COMMISSION_BY_TIER: Record<string, number> = {
  FREE: 0.10,
  STARTER: 0.08,
  PLUS: 0.06,
  PRO: 0.04,
  ESTATE_MANAGER: 0.03,
};

// ─── Helper: derive isFreightOnly ──────────────────────────────

function deriveIsFreightOnly(
  difficulty: ShippingDifficulty,
  weightLbs: number | null,
): boolean {
  if (difficulty === "Freight only") return true;
  if (weightLbs != null && weightLbs > FREIGHT_WEIGHT_THRESHOLD_LBS) return true;
  return false;
}

// ─── Helper: derive isLocalOnly ────────────────────────────────

function deriveIsLocalOnly(
  shippingPref: ShippingPreference,
  saleMethod: SaleMethod,
): boolean {
  return shippingPref === "LOCAL_ONLY" || saleMethod === "LOCAL_PICKUP";
}

// ─── Helper: build the prompt block ────────────────────────────

function buildPromptBlock(ctx: Omit<ItemSpecContext, "promptBlock" | "fellBackToRawJson">): string {
  const lines: string[] = [];
  lines.push("[SELLER LISTING CONSTRAINTS — RESPECT THESE]");

  // Location line
  const loc = [
    ctx.saleCity && ctx.saleState ? `${ctx.saleCity}, ${ctx.saleState}` : null,
    ctx.saleZip,
  ].filter(Boolean).join(" ");
  lines.push(`Location: ${loc || "unknown"} (${ctx.saleRadiusMi}-mile sell radius)`);

  // Sale method line
  const methodLabel =
    ctx.saleMethod === "LOCAL_PICKUP" ? "LOCAL PICKUP ONLY" :
    ctx.saleMethod === "ONLINE_SHIPPING" ? "SHIPPING ONLY" :
    "Local pickup OR shipping";
  lines.push(`Sale method: ${methodLabel}`);

  // Shipping preference line (if not default)
  if (ctx.shippingPreference === "LOCAL_ONLY") {
    lines.push("Shipping preference: LOCAL_ONLY (seller refuses to ship)");
  } else if (ctx.shippingPreference === "FREE_SHIPPING") {
    lines.push("Shipping preference: FREE_SHIPPING (seller pays shipping)");
  }

  // Shippability line — the most important one for the bug
  if (ctx.isFreightOnly) {
    const weightStr = ctx.weightLbs ? `${Math.round(ctx.weightLbs)} lbs` : "oversized";
    lines.push(
      `Shipping: FREIGHT-ONLY (${weightStr} — cannot ship via UPS/USPS/FedEx parcel)`,
    );
    if (ctx.estimatedFreightCostUsd) {
      lines.push(`Freight quote estimate: ~$${ctx.estimatedFreightCostUsd}`);
    }
  } else if (ctx.shippingDifficulty === "Difficult") {
    const weightStr = ctx.weightLbs ? `${Math.round(ctx.weightLbs)} lbs` : "heavy";
    lines.push(`Shipping: DIFFICULT (${weightStr}, fragile or awkward — parcel possible but risky)`);
  } else if (ctx.weightLbs) {
    lines.push(`Shipping: STANDARD (~${Math.round(ctx.weightLbs)} lbs, parcel-shippable)`);
  }

  if (ctx.isFragile) {
    lines.push("Fragile: TRUE (extra packaging required)");
  }

  // Economics line
  if (ctx.listingPriceUsd) {
    lines.push(
      `Listing price: $${ctx.listingPriceUsd} | Commission: ${Math.round(
        ctx.commissionRate * 100,
      )}% | Buyer fee: ${(ctx.buyerProcessingFeeRate * 100).toFixed(2)}%`,
    );
  } else {
    lines.push(
      `Commission: ${Math.round(ctx.commissionRate * 100)}% | Buyer fee: ${(ctx.buyerProcessingFeeRate * 100).toFixed(2)}%`,
    );
  }

  // Instruction block — tells the AI what to DO with these constraints
  lines.push("");
  lines.push("INSTRUCTION:");

  if (ctx.isFreightOnly && ctx.isLocalPreferred) {
    lines.push(
      "• This item is freight-only and the seller prefers local sales.",
      "• LOCAL PICKUP is the primary recommendation. Make it the lead.",
      "• National + best-market quotes are still acceptable BUT must factor",
      "  freight cost into the seller's net payout. Do NOT recommend shipping",
      "  this item to a distant city without subtracting freight from net.",
    );
  } else if (ctx.isFreightOnly) {
    lines.push(
      "• This item is freight-only. ALL national/distant-market quotes MUST",
      "  factor freight cost into seller's net payout. Show realistic freight",
      "  numbers, not parcel rates.",
    );
  } else if (ctx.isLocalOnly) {
    lines.push(
      "• Seller refuses to ship. Recommend LOCAL PICKUP only. Do NOT suggest",
      "  eBay national, Mercari, Poshmark, or any shipping-required platform.",
    );
  } else if (ctx.isLocalPreferred) {
    lines.push(
      `• Seller's radius is ${ctx.saleRadiusMi} miles — prioritize local`,
      "  buyers but national shipping is still on the table.",
    );
  } else {
    lines.push(
      "• Seller is open to both local and national. Show all pricing tiers",
      "  with realistic freight/parcel cost calculations.",
    );
  }

  return lines.join("\n");
}

// ─── Main entry point ──────────────────────────────────────────

/**
 * Build the canonical ItemSpecContext for a given item. Pure read.
 *
 * @param itemId  The Item ID
 * @param opts    Optional pre-fetched item/user (avoids double fetch)
 */
export async function buildItemSpecContext(
  itemId: string,
  opts: {
    item?: any | null;
    user?: any | null;
  } = {},
): Promise<ItemSpecContext> {
  // Fetch item if not provided
  let item = opts.item;
  if (!item) {
    item = await prisma.item.findUnique({
      where: { id: itemId },
      include: { aiResult: true },
    });
  }

  if (!item) {
    // Return a sensible empty context — bots can still build a prompt
    return emptyContext("unknown-item");
  }

  let fellBackToRawJson = false;

  // ── LOCATION ──
  const saleZip: string | null = item.saleZip ?? null;
  const saleRadiusMi: number = typeof item.saleRadiusMi === "number" ? item.saleRadiusMi : 25;
  const saleMethod: SaleMethod = (item.saleMethod as SaleMethod) ?? "BOTH";
  const shippingPreference: ShippingPreference = (item.shippingPreference as ShippingPreference) ?? "BUYER_PAYS";

  let saleCity: string | null = null;
  let saleState: string | null = null;
  if (saleZip) {
    try {
      const market = getMarketInfo(saleZip);
      // market-data.ts returns an object with label like "Waterville, ME"
      const label = market?.label ?? "";
      const parts = label.split(",").map((s: string) => s.trim());
      if (parts.length === 2) {
        saleCity = parts[0];
        saleState = parts[1];
      } else if (label) {
        saleCity = label;
      }
    } catch { /* non-critical */ }
  }

  // ── SHIPPABILITY (live Item fields first; rawJson fallback) ──
  let shippingDifficulty: ShippingDifficulty = (item.aiShippingDifficulty as ShippingDifficulty) ?? null;
  let weightLbs: number | null = item.aiWeightLbs ?? item.shippingWeight ?? null;
  let shippingNotes: string | null = item.aiShippingNotes ?? null;
  const shippingConfidence: number | null = item.aiShippingConfidence ?? null;
  const isFragile: boolean = item.isFragile === true;

  // Fall back to rawJson ONLY if live fields are null
  if ((!shippingDifficulty || weightLbs == null) && item.aiResult?.rawJson) {
    try {
      const ai = JSON.parse(item.aiResult.rawJson);
      if (!shippingDifficulty && ai.shipping_difficulty) {
        shippingDifficulty = ai.shipping_difficulty as ShippingDifficulty;
        fellBackToRawJson = true;
      }
      if (weightLbs == null && typeof ai.weight_estimate_lbs === "number") {
        weightLbs = ai.weight_estimate_lbs;
        fellBackToRawJson = true;
      }
      if (!shippingNotes && ai.shipping_notes) {
        shippingNotes = ai.shipping_notes;
        fellBackToRawJson = true;
      }
    } catch { /* non-critical */ }
  }

  // Manual dimensions if any
  const hasManualDims =
    item.shippingLength != null ||
    item.shippingWidth != null ||
    item.shippingHeight != null;
  const manualDimensions = hasManualDims
    ? {
        length: item.shippingLength ?? null,
        width: item.shippingWidth ?? null,
        height: item.shippingHeight ?? null,
      }
    : null;

  // ── DERIVED FLAGS ──
  const isFreightOnly = deriveIsFreightOnly(shippingDifficulty, weightLbs);
  const isLocalOnly = deriveIsLocalOnly(shippingPreference, saleMethod);
  const isLocalPreferred =
    isLocalOnly || isFreightOnly || saleRadiusMi <= LOCAL_RADIUS_THRESHOLD_MI;

  const estimatedFreightCostUsd = isFreightOnly
    ? estimateFreightCost(weightLbs)
    : null;

  // ── ECONOMICS ──
  const listingPriceUsd: number | null =
    item.listingPrice != null ? Number(item.listingPrice) : null;

  let commissionRate = 0.10;
  const userTier = opts.user?.tier ?? null;
  if (userTier && COMMISSION_BY_TIER[userTier] != null) {
    commissionRate = COMMISSION_BY_TIER[userTier];
  }

  // ── BUILD CONTEXT ──
  const partial: Omit<ItemSpecContext, "promptBlock" | "fellBackToRawJson"> = {
    saleZip,
    saleCity,
    saleState,
    saleRadiusMi,
    saleMethod,
    shippingPreference,
    shippingDifficulty,
    weightLbs,
    shippingNotes,
    shippingConfidence,
    isFragile,
    manualDimensions,
    isFreightOnly,
    isLocalOnly,
    isLocalPreferred,
    estimatedFreightCostUsd,
    listingPriceUsd,
    commissionRate,
    buyerProcessingFeeRate: DEFAULT_BUYER_FEE,
  };

  const promptBlock = buildPromptBlock(partial);

  if (fellBackToRawJson) {
    console.warn(
      `[item-spec-context] item ${itemId} fell back to rawJson for shipping data — live fields are stale`,
    );
  }

  return { ...partial, promptBlock, fellBackToRawJson };
}

// ─── Helper: rough freight estimate ────────────────────────────

/**
 * Rough freight cost estimate by weight bracket. Used as a
 * placeholder until lib/shipping/freight-estimates.ts is wired in
 * for real LTL quotes (Step 4.5 or later). Conservative high so
 * the seller's net math doesn't over-promise.
 */
function estimateFreightCost(weightLbs: number | null): number {
  if (!weightLbs) return DEFAULT_FREIGHT_ESTIMATE_USD;
  if (weightLbs <= 50) return 95;
  if (weightLbs <= 100) return 175;
  if (weightLbs <= 150) return 245;
  if (weightLbs <= 250) return 325;
  if (weightLbs <= 500) return 475;
  return 695;
}

// ─── Helper: empty context (for missing items) ────────────────

function emptyContext(itemId: string): ItemSpecContext {
  console.warn(`[item-spec-context] no item found for ${itemId} — returning empty context`);
  const partial: Omit<ItemSpecContext, "promptBlock" | "fellBackToRawJson"> = {
    saleZip: null,
    saleCity: null,
    saleState: null,
    saleRadiusMi: 25,
    saleMethod: "BOTH",
    shippingPreference: "BUYER_PAYS",
    shippingDifficulty: null,
    weightLbs: null,
    shippingNotes: null,
    shippingConfidence: null,
    isFragile: false,
    manualDimensions: null,
    isFreightOnly: false,
    isLocalOnly: false,
    isLocalPreferred: false,
    estimatedFreightCostUsd: null,
    listingPriceUsd: null,
    commissionRate: 0.10,
    buyerProcessingFeeRate: DEFAULT_BUYER_FEE,
  };
  return { ...partial, promptBlock: buildPromptBlock(partial), fellBackToRawJson: false };
}
