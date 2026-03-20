/**
 * 8-Step Pricing Pipeline
 *
 * Consolidates AI estimates, condition adjustments, ownership, age,
 * location multipliers, shipping, commission, and processing fees
 * into a single pricing result.
 */

import type { AiAnalysis } from "@/lib/types";
import {
  getMarketInfo,
  getBestMarket,
  estimateShippingCost,
  type MarketInfo,
} from "@/lib/pricing/market-data";
import { getCommissionRate } from "@/lib/commission";
import { PROCESSING_FEE } from "@/lib/constants/pricing";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface PricingCalcInput {
  ai: AiAnalysis;
  sellerCondition?: string | null;
  numOwners?: string | null; // "1", "2", "3+", "Unknown"
  saleZip?: string | null;
  userTier: number; // 1-4
  isHero?: boolean;
  purchasePrice?: number | null;
  category?: string | null;
}

export interface PricingAdjustment {
  name: string;
  factor: number; // e.g. 1.10 = +10%, 0.88 = -12%
  reason: string;
}

export interface PriceRange {
  low: number;
  mid: number;
  high: number;
  label: string;
}

export interface PricingResult {
  aiEstimate: { low: number; mid: number; high: number; confidence: number };
  basePrice: { low: number; mid: number; high: number };
  adjustments: PricingAdjustment[];
  localPrice: PriceRange;
  nationalPrice: PriceRange;
  bestMarket: PriceRange & { shippingCost: number };
  commissionRate: number;
  commissionPct: number;
  processingFeeRate: number;
  shippingEstimate: number;
  sellerNet: { local: number; national: number; bestMarket: number };
  buyerTotal: { local: number; national: number; bestMarket: number };
  localEarnings: { salePrice: number; commission: number; net: number };
  shippedEarnings: {
    salePrice: number;
    shipping: number;
    commission: number;
    net: number;
    city: string;
  };
  recommendation: string;
  marginComparison: {
    localMargin: number;
    shippedMargin: number;
    bestOption: string;
  };
  confidence: number;
  recommendations: string[];
  // AI regional intelligence (when available)
  regionalIntel?: {
    bestCity: string | null;
    bestState: string | null;
    bestWhy: string | null;
    localDemand: string | null;
    localReasoning: string | null;
    shipOrLocal: string | null;
    weightLbs: number | null;
    shippingDifficulty: string | null;
    shippingNotes: string | null;
  };
}

// ─── Condition multiplier map (spec-exact values) ───────────────────────────

const CONDITION_FACTORS: Record<string, number> = {
  mint: 1.20,
  "near mint": 1.10,
  excellent: 1.05,
  "very good": 1.00,
  good: 0.90,
  fair: 0.80,
  "below average": 0.65,
  poor: 0.50,
  damaged: 0.35,
  "parts only": 0.20,
};

function conditionFactor(
  sellerCondition?: string | null,
  aiScore?: number | null
): { factor: number; reason: string } {
  if (sellerCondition) {
    const key = sellerCondition.toLowerCase().trim();
    const f = CONDITION_FACTORS[key];
    if (f != null) {
      const pct = Math.round((f - 1) * 100);
      const sign = pct >= 0 ? "+" : "";
      return {
        factor: f,
        reason: `Seller-reported condition: ${sellerCondition} (${sign}${pct}%)`,
      };
    }
  }

  // Fallback to AI condition_score (1-10 mapped to condition factors)
  if (aiScore != null && aiScore >= 1 && aiScore <= 10) {
    const f =
      aiScore >= 10
        ? 1.20
        : aiScore >= 9
        ? 1.10
        : aiScore >= 8
        ? 1.05
        : aiScore >= 7
        ? 1.00
        : aiScore >= 6
        ? 0.90
        : aiScore >= 5
        ? 0.80
        : aiScore >= 4
        ? 0.65
        : aiScore >= 3
        ? 0.50
        : aiScore >= 2
        ? 0.35
        : 0.20;
    const pct = Math.round((f - 1) * 100);
    const sign = pct >= 0 ? "+" : "";
    return {
      factor: f,
      reason: `AI condition score ${aiScore}/10 (${sign}${pct}%)`,
    };
  }

  return { factor: 1.0, reason: "No condition data — using baseline" };
}

// ─── Ownership adjustment (spec-exact values) ──────────────────────────────

function ownershipFactor(numOwners?: string | null): {
  factor: number;
  reason: string;
} {
  if (!numOwners || numOwners === "Unknown") {
    return { factor: 0.95, reason: "Ownership unknown — slight discount (-5%)" };
  }
  if (numOwners === "1") {
    return { factor: 1.00, reason: "Single owner — no adjustment" };
  }
  if (numOwners === "2") {
    return { factor: 0.95, reason: "Two owners (-5%)" };
  }
  // "3+" or more
  return { factor: 0.90, reason: "Three or more owners (-10%)" };
}

// ─── Age adjustment ─────────────────────────────────────────────────────────

function ageFactor(ai: AiAnalysis): { factor: number; reason: string } {
  const ageYears = ai.estimated_age_years;
  const isAntique = ai.is_antique;

  if (ageYears != null && ageYears >= 100) {
    return { factor: 1.25, reason: `Over 100 years old — antique premium (+25%)` };
  }
  if (ageYears != null && ageYears >= 50) {
    return { factor: 1.15, reason: `Over 50 years old — vintage premium (+15%)` };
  }
  if (isAntique) {
    return { factor: 1.15, reason: `AI detected antique — vintage premium (+15%)` };
  }
  if (ageYears != null && ageYears < 2) {
    return { factor: 1.05, reason: `Under 2 years old — near-new premium (+5%)` };
  }

  return { factor: 1.0, reason: "No age adjustment" };
}

// ─── Category-based shipping estimate ───────────────────────────────────────

function estimateShippingByCategory(category: string | null): number {
  const cat = (category || "").toLowerCase();

  // Jewelry / Small items: $5-8
  if (cat.includes("jewelry") || cat.includes("watch") || cat.includes("coin")) return 7;

  // Books / Small items: $8-15
  if (cat.includes("book") || cat.includes("game") || cat.includes("toy") || cat.includes("small")) return 12;

  // Medium items: $15-35
  if (cat.includes("electronic") || cat.includes("kitchen") || cat.includes("tool") || cat.includes("sport") || cat.includes("musical") || cat.includes("art") || cat.includes("collectible") || cat.includes("clothing")) return 25;

  // Large / Furniture: $35-80
  if (cat.includes("furniture") || cat.includes("chair") || cat.includes("table") || cat.includes("cabinet") || cat.includes("desk")) return 55;

  // Oversize / Vehicles: $80-200
  if (cat.includes("vehicle") || cat.includes("car") || cat.includes("truck") || cat.includes("motorcycle")) return 150;

  // Default medium
  return 25;
}

// ─── Main pipeline ──────────────────────────────────────────────────────────

export function calculatePricing(input: PricingCalcInput): PricingResult {
  const { ai, sellerCondition, numOwners, saleZip, userTier, isHero, purchasePrice, category } = input;

  const adjustments: PricingAdjustment[] = [];
  const recommendations: string[] = [];

  // ── Step 1: Base price from AI inline estimates ───────────────────────────
  let baseLow: number;
  let baseMid: number;
  let baseHigh: number;
  let baseConfidence: number;

  const hasInlinePrice =
    ai.estimated_value_low != null &&
    ai.estimated_value_high != null &&
    (ai.pricing_confidence ?? 0) >= 40;

  if (hasInlinePrice) {
    baseLow = ai.estimated_value_low!;
    baseMid = ai.estimated_value_mid ?? Math.round((ai.estimated_value_low! + ai.estimated_value_high!) / 2);
    baseHigh = ai.estimated_value_high!;
    baseConfidence = (ai.pricing_confidence ?? 70) / 100;

    // Ensure low <= mid <= high
    if (baseLow > baseMid) baseMid = baseLow;
    if (baseMid > baseHigh) baseHigh = baseMid;
  } else if (purchasePrice && purchasePrice > 0) {
    // Fallback to purchase price heuristic
    baseLow = Math.round(purchasePrice * 0.5);
    baseMid = Math.round(purchasePrice * 0.7);
    baseHigh = Math.round(purchasePrice * 0.9);
    baseConfidence = 0.4;
    recommendations.push(
      "Price estimate is based on your purchase price. Run AI analysis with photos for better accuracy."
    );
  } else {
    // Absolute fallback
    baseLow = 10;
    baseMid = 50;
    baseHigh = 200;
    baseConfidence = 0.2;
    recommendations.push(
      "No pricing data available. Upload more photos and add details for a better estimate."
    );
  }

  const aiEstimate = { low: baseLow, mid: baseMid, high: baseHigh, confidence: baseConfidence };

  // ── Step 2: Condition adjustment ──────────────────────────────────────────
  const cond = conditionFactor(sellerCondition, ai.condition_score);
  if (cond.factor !== 1.0) {
    adjustments.push({ name: "Condition", factor: cond.factor, reason: cond.reason });
  }

  // ── Step 3: Ownership adjustment ──────────────────────────────────────────
  const own = ownershipFactor(numOwners);
  if (own.factor !== 1.0) {
    adjustments.push({ name: "Ownership", factor: own.factor, reason: own.reason });
  }

  // ── Step 4: Age adjustment ────────────────────────────────────────────────
  const age = ageFactor(ai);
  if (age.factor !== 1.0) {
    adjustments.push({ name: "Age", factor: age.factor, reason: age.reason });
  }

  // Apply all adjustments to get adjusted prices
  let totalFactor = 1.0;
  for (const adj of adjustments) totalFactor *= adj.factor;

  const adjLow = Math.round(baseLow * totalFactor);
  const adjMid = Math.round(baseMid * totalFactor);
  const adjHigh = Math.round(baseHigh * totalFactor);

  const basePrice = { low: adjLow, mid: adjMid, high: adjHigh };

  // ── Step 5: Location multipliers (prefer AI regional data when available) ──
  const sellerMarket = getMarketInfo(saleZip);
  const bestMarketInfo = getBestMarket();

  // Check if AI provided item-specific regional pricing intelligence
  const hasAiRegional = !!(ai.regional_best_city && ai.regional_best_price_low && ai.regional_best_price_high);

  const localPrice: PriceRange = {
    low: Math.round(adjLow * sellerMarket.multiplier),
    mid: Math.round(adjMid * sellerMarket.multiplier),
    high: Math.round(adjHigh * sellerMarket.multiplier),
    label: sellerMarket.label,
  };

  // Add AI local demand info to localPrice for display
  const localDemand = ai.regional_local_demand ?? null;
  const localReasoning = ai.regional_local_reasoning ?? null;

  const nationalPrice: PriceRange = {
    low: adjLow,
    mid: adjMid,
    high: adjHigh,
    label: "National Average",
  };

  // Use AI best-market data when available, otherwise fall back to static multiplier
  const bestMarketRaw: PriceRange = hasAiRegional ? {
    low: Math.round(ai.regional_best_price_low!),
    mid: Math.round((ai.regional_best_price_low! + ai.regional_best_price_high!) / 2),
    high: Math.round(ai.regional_best_price_high!),
    label: `${ai.regional_best_city}, ${ai.regional_best_state}`,
  } : {
    low: Math.round(adjLow * bestMarketInfo.multiplier),
    mid: Math.round(adjMid * bestMarketInfo.multiplier),
    high: Math.round(adjHigh * bestMarketInfo.multiplier),
    label: bestMarketInfo.label,
  };

  // ── Step 6: Shipping estimate (prefer AI weight, fallback to category) ────
  const aiWeight = ai.weight_estimate_lbs ?? null;
  const catShipping = estimateShippingByCategory(category || ai.category || null);
  const distShipping = estimateShippingCost(saleZip ?? null, "100", aiWeight ?? undefined);
  // Use the higher of category-based or distance-based
  const shippingCost = Math.max(catShipping, distShipping);
  const bestMarket = { ...bestMarketRaw, shippingCost };

  if (shippingCost > bestMarket.mid * 0.4 && bestMarket.mid > 0) {
    recommendations.push(
      `Shipping cost (~$${shippingCost}) is over 40% of item value. Consider local pickup instead.`
    );
  }

  // ── Step 7: Commission ────────────────────────────────────────────────────
  const commissionRate = getCommissionRate(userTier, isHero);
  const commissionPct = Math.round(commissionRate * 100);

  // ── Step 8: Processing fee (split — buyer half for buyer totals) ──────────
  const processingFeeRate = PROCESSING_FEE.buyerRate;

  // ── Calculate earnings ────────────────────────────────────────────────────
  const sellerFeeRate = PROCESSING_FEE.sellerRate;

  const localMid = localPrice.mid;
  const localCommission = Math.round(localMid * commissionRate * 100) / 100;
  const localSellerFee = Math.round(localMid * sellerFeeRate * 100) / 100;
  const localNet = Math.round((localMid - localCommission - localSellerFee) * 100) / 100;

  const bestMid = bestMarket.mid;
  const shippedCommission = Math.round(bestMid * commissionRate * 100) / 100;
  const shippedSellerFee = Math.round(bestMid * sellerFeeRate * 100) / 100;
  const shippedNet = Math.round((bestMid - shippedCommission - shippedSellerFee - shippingCost) * 100) / 100;

  const nationalMid = nationalPrice.mid;
  const nationalCommission = Math.round(nationalMid * commissionRate * 100) / 100;
  const nationalSellerFee = Math.round(nationalMid * sellerFeeRate * 100) / 100;
  const nationalNet = Math.round((nationalMid - nationalCommission - nationalSellerFee) * 100) / 100;

  // ── Seller Net (what seller actually receives) ────────────────────────────
  const sellerNet = {
    local: localNet,
    national: nationalNet,
    bestMarket: shippedNet,
  };

  // ── Buyer Total (what buyer actually pays, including processing fee) ──────
  const buyerTotal = {
    local: Math.round(localMid * (1 + processingFeeRate) * 100) / 100,
    national: Math.round((nationalMid + shippingCost) * (1 + processingFeeRate) * 100) / 100,
    bestMarket: Math.round((bestMid + shippingCost) * (1 + processingFeeRate) * 100) / 100,
  };

  // ── Margin Comparison ─────────────────────────────────────────────────────
  const localMargin = localMid > 0 ? Math.round((localNet / localMid) * 100) : 0;
  const shippedMargin = bestMid > 0 ? Math.round((shippedNet / bestMid) * 100) : 0;
  const marginComparison = {
    localMargin,
    shippedMargin,
    bestOption: shippedNet > localNet
      ? `Ship to ${bestMarketInfo.label} for $${(shippedNet - localNet).toFixed(2)} more`
      : `Sell locally to avoid $${shippingCost} shipping cost`,
  };

  // ── Recommendation (prefer AI verdict, fallback to calculated) ────────────
  let recommendation: string;
  if (baseMid <= 0) {
    recommendation = "This item has no resale value. We recommend donating it to charity or recycling.";
  } else if (baseMid < 5) {
    recommendation = `At $${baseMid} estimated value, this item is barely worth listing individually. Consider bundling with similar items or donating.`;
  } else if (ai.regional_ship_or_local) {
    recommendation = ai.regional_ship_or_local;
  } else if (shippedNet > localNet && shippingCost < bestMid * 0.3) {
    recommendation = `Ship to ${bestMarketRaw.label} for best return. You'd net $${shippedNet.toFixed(2)} shipped vs $${localNet.toFixed(2)} locally (after $${shippingCost} shipping + ${commissionPct}% commission).`;
  } else {
    recommendation = `Sell locally for $${localMid}. You'd net $${localNet.toFixed(2)} after ${commissionPct}% commission. Shipping costs ($${shippingCost}) eat into the margin for this item.`;
  }

  // ── Build recommendations list ────────────────────────────────────────────
  if (ai.photo_quality_score != null && ai.photo_quality_score < 5) {
    recommendations.push("Photo quality is low. Better lighting and angles could increase buyer interest.");
  }
  if (ai.photo_improvement_tips?.length) {
    recommendations.push(...ai.photo_improvement_tips.slice(0, 2));
  }
  if (ai.appraisal_recommended) {
    recommendations.push("Professional appraisal recommended — this item may have significant hidden value.");
  }
  if (ai.best_platforms?.length) {
    recommendations.push(`Best platforms to sell: ${ai.best_platforms.slice(0, 3).join(", ")}`);
  }
  if (sellerMarket.tier === "LOW" && bestMarketInfo.multiplier > sellerMarket.multiplier + 0.2) {
    recommendations.push(
      `Your local market is low-demand. Shipping to ${bestMarketInfo.label} could net ${Math.round((bestMarketInfo.multiplier / sellerMarket.multiplier - 1) * 100)}% more.`
    );
  }

  // ── Confidence ────────────────────────────────────────────────────────────
  let confidence = baseConfidence;
  if (sellerCondition) confidence = Math.min(confidence + 0.05, 0.98);
  if (baseHigh > baseLow * 5) confidence = Math.max(confidence - 0.1, 0.15);

  return {
    aiEstimate,
    basePrice,
    adjustments,
    localPrice,
    nationalPrice,
    bestMarket,
    commissionRate,
    commissionPct,
    processingFeeRate,
    shippingEstimate: shippingCost,
    sellerNet,
    buyerTotal,
    localEarnings: { salePrice: localMid, commission: localCommission, net: localNet },
    shippedEarnings: {
      salePrice: bestMid,
      shipping: shippingCost,
      commission: shippedCommission,
      net: shippedNet,
      city: bestMarketInfo.label,
    },
    recommendation,
    marginComparison,
    confidence,
    recommendations,
    regionalIntel: {
      bestCity: ai.regional_best_city ?? null,
      bestState: ai.regional_best_state ?? null,
      bestWhy: ai.regional_best_why ?? null,
      localDemand: localDemand,
      localReasoning: localReasoning,
      shipOrLocal: ai.regional_ship_or_local ?? null,
      weightLbs: aiWeight,
      shippingDifficulty: ai.shipping_difficulty ?? null,
      shippingNotes: ai.shipping_notes ?? null,
    },
  };
}
