/**
 * lib/bots/spec-guards.ts
 * ─────────────────────────────────────────────────────────────────
 * Pure helper functions over ItemSpecContext.
 *
 * Stateless. No I/O. Used by PriceBot today (Step 4) and every
 * other bot in Steps 5–13.
 *
 * SPEC-WIRE FIX (Step 4): the rules every bot uses to decide
 * whether/how to honor the seller's location + shippability
 * constraints.
 *
 * CMD-PRICEBOT-SPEC-001 — Step 4
 * ─────────────────────────────────────────────────────────────────
 */

import type { ItemSpecContext } from "./item-spec-context";

// ─── Boolean checks ────────────────────────────────────────────

/** True if the item must ship freight (cannot use parcel carriers). */
export function isFreightOnly(ctx: ItemSpecContext): boolean {
  return ctx.isFreightOnly;
}

/** True if the seller refuses to ship at all (LOCAL_PICKUP only). */
export function isLocalOnly(ctx: ItemSpecContext): boolean {
  return ctx.isLocalOnly;
}

/** True if local pickup is the strongly preferred channel. */
export function isLocalPreferred(ctx: ItemSpecContext): boolean {
  return ctx.isLocalPreferred;
}

// ─── User-facing warning text ──────────────────────────────────

/**
 * Returns a single user-facing warning sentence (or null) describing
 * the most important constraint the user should see in the dashboard.
 *
 * Used by the PriceEstimatePanel soft-warn banner.
 */
export function getFreightWarning(ctx: ItemSpecContext): string | null {
  if (ctx.isLocalOnly) {
    return "Seller has set this item to LOCAL PICKUP ONLY. National & Best Market quotes are reference only — this item will not ship.";
  }
  if (ctx.isFreightOnly) {
    const weight = ctx.weightLbs ? `${Math.round(ctx.weightLbs)} lbs` : "oversized";
    const freight = ctx.estimatedFreightCostUsd ? `~$${ctx.estimatedFreightCostUsd}` : "freight cost";
    return `Item is freight-only (${weight}) — National & Best Market quotes assume freight shipping (${freight} added). Local pickup is the fastest sale path.`;
  }
  if (ctx.isLocalPreferred && ctx.saleRadiusMi <= 50) {
    return `Seller's sell radius is ${ctx.saleRadiusMi} miles. Local pickup is preferred — national quotes are reference only.`;
  }
  return null;
}

// ─── Net payout math ───────────────────────────────────────────

export interface FreightAdjustment {
  /** Original gross price before freight. */
  gross: number;
  /** Estimated freight cost subtracted. */
  freightCost: number;
  /** Adjusted net (after freight, before commission/fees). */
  adjusted: number;
  /** Plain-English explanation for UI display. */
  explanation: string;
}

/**
 * Subtract estimated freight cost from a gross price to show the
 * realistic post-freight net the seller would receive on a national
 * sale of a freight-only item.
 *
 * Returns a noop adjustment when the item is NOT freight-only (so
 * callers can use it unconditionally).
 */
export function adjustNetForFreight(
  grossUsd: number,
  ctx: ItemSpecContext,
): FreightAdjustment {
  if (!ctx.isFreightOnly || !ctx.estimatedFreightCostUsd) {
    return {
      gross: grossUsd,
      freightCost: 0,
      adjusted: grossUsd,
      explanation: "No freight adjustment (item is parcel-shippable).",
    };
  }
  const freightCost = ctx.estimatedFreightCostUsd;
  const adjusted = Math.max(0, grossUsd - freightCost);
  return {
    gross: grossUsd,
    freightCost,
    adjusted,
    explanation: `Subtracts ~$${freightCost} freight cost from $${grossUsd} gross.`,
  };
}

// ─── Platform filtering (used by future bots in Steps 5–13) ───

/**
 * Filter a platform list down to only the platforms that respect
 * the seller's constraints. Step 4 doesn't call this from PriceBot
 * but it's defined now so future bots inherit a single rule set.
 *
 * Local-only platforms (allowed when isLocalOnly is true):
 *   facebook_marketplace, facebook_groups, craigslist, offerup,
 *   nextdoor
 *
 * National platforms (suppressed when isLocalOnly is true):
 *   ebay, etsy, mercari, poshmark, amazon
 */
export function filterPlatformsByConstraints(
  platforms: string[],
  ctx: ItemSpecContext,
): string[] {
  if (!ctx.isLocalOnly) return platforms;
  const localOnlyAllowed = new Set([
    "facebook_marketplace",
    "facebook_groups",
    "craigslist",
    "offerup",
    "nextdoor",
    "tiktok",
    "instagram",
    "reels",
    "pinterest",
    "youtube",
    "x",
  ]);
  return platforms.filter((p) => localOnlyAllowed.has(p.toLowerCase()));
}

// ─── Spec context summary (compact, for response payloads) ────

export interface SpecContextSummary {
  saleZip: string | null;
  saleRadiusMi: number;
  saleMethod: string;
  shippingPreference: string;
  shippingDifficulty: string | null;
  weightLbs: number | null;
  isFreightOnly: boolean;
  isLocalOnly: boolean;
  isLocalPreferred: boolean;
  estimatedFreightCostUsd: number | null;
  fellBackToRawJson: boolean;
}

/**
 * Compact summary suitable for embedding in a bot's response JSON
 * payload (so the UI + EventLog can audit which constraints the
 * bot actually saw).
 */
export function summarizeSpecContext(ctx: ItemSpecContext): SpecContextSummary {
  return {
    saleZip: ctx.saleZip,
    saleRadiusMi: ctx.saleRadiusMi,
    saleMethod: ctx.saleMethod,
    shippingPreference: ctx.shippingPreference,
    shippingDifficulty: ctx.shippingDifficulty,
    weightLbs: ctx.weightLbs,
    isFreightOnly: ctx.isFreightOnly,
    isLocalOnly: ctx.isLocalOnly,
    isLocalPreferred: ctx.isLocalPreferred,
    estimatedFreightCostUsd: ctx.estimatedFreightCostUsd,
    fellBackToRawJson: ctx.fellBackToRawJson,
  };
}
