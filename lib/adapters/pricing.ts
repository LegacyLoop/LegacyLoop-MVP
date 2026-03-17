// lib/adapters/pricing.ts
import OpenAI from "openai";
import type { AiAnalysis } from "@/lib/types";
import { searchEbayComps, type EbayComp } from "@/lib/adapters/ebay";
import { getLocationPrices, getMarketInfo, type MarketInfo } from "@/lib/pricing/market-data";
import type { RainforestEnrichmentData } from "@/lib/adapters/rainforest";

// ─── Types ────────────────────────────────────────────────────────────────────

export type PricingInput = {
  ai: AiAnalysis;
  condition?: string | null;
  notes?: string | null;
  purchasePrice?: number | null;
  purchaseDate?: Date | null;
  saleMethod?: string | null; // "LOCAL_PICKUP" | "ONLINE_SHIPPING" | "BOTH"
  saleZip?: string | null;
  saleRadiusMi?: number | null;
  amazonData?: RainforestEnrichmentData | null;
};

export type PricingEstimate = {
  low: number;
  high: number;
  confidence: number;
  source: string;

  localLow?: number;
  localHigh?: number;
  localConfidence?: number;
  localSource?: string;

  onlineLow?: number;
  onlineHigh?: number;
  onlineConfidence?: number;
  onlineSource?: string;

  // Best-market pricing (ship to highest-demand area)
  bestMarketLow?: number;
  bestMarketHigh?: number;
  bestMarketLabel?: string;
  bestMarketShipping?: number;
  bestMarketNetLow?: number;
  bestMarketNetHigh?: number;

  // Location context
  marketInfo?: { tier: string; label: string; multiplier: number; note: string };

  // Pricing source breakdown for transparency
  sources?: {
    ai?: { low: number; high: number; confidence: number; rationale: string };
    ebay?: { low: number; high: number; confidence: number; count: number };
    amazon?: { retailAvg: number; resaleEstimate: number; resultCount: number };
  };

  // Flag to suggest running MegaBot
  suggestMegabot?: boolean;

  comps?: Array<{
    platform: string;
    title: string;
    price: number;
    currency: string;
    url: string;
    shipping?: number;
  }>;
};

type AiPriceEstimate = {
  low: number;
  high: number;
  confidence: number;
  rationale: string;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

function percentile(sorted: number[], p: number) {
  if (!sorted.length) return NaN;
  const idx = (sorted.length - 1) * p;
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  if (lo === hi) return sorted[lo];
  return sorted[lo] * (1 - (idx - lo)) + sorted[hi] * (idx - lo);
}

function conditionMultiplier(condition?: string | null) {
  const c = (condition || "").toLowerCase();
  if (!c) return 1.0;
  if (c.includes("new")) return 1.0;
  if (c.includes("like new") || c.includes("excellent")) return 0.95;
  if (c.includes("good")) return 0.85;
  if (c.includes("fair") || c.includes("okay")) return 0.72;
  if (c.includes("poor") || c.includes("parts")) return 0.45;
  return 0.85;
}

// ─── OpenAI Pricing Call ──────────────────────────────────────────────────────

const openaiClient =
  process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.length > 10
    ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    : null;

const AI_PRICE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    low: { type: "number", description: "Low end of fair market value in USD" },
    high: { type: "number", description: "High end of fair market value in USD" },
    confidence: { type: "number", description: "Confidence score 0 to 1" },
    rationale: { type: "string", description: "Brief explanation of the pricing" },
  },
  required: ["low", "high", "confidence", "rationale"],
} as const;

async function getAiPriceEstimate(
  ai: AiAnalysis,
  condition?: string | null,
  notes?: string | null,
): Promise<AiPriceEstimate | null> {
  if (!openaiClient) return null;

  const description = [
    `Item: ${ai.item_name}`,
    `Category: ${ai.category}`,
    ai.brand && ai.brand !== "Unknown" ? `Brand: ${ai.brand}` : null,
    ai.model && ai.model !== "Unknown" ? `Model: ${ai.model}` : null,
    condition ? `Condition: ${condition}` : ai.condition_guess ? `Condition (guessed): ${ai.condition_guess}` : null,
    notes ? `Seller notes: ${notes}` : null,
    ai.keywords?.length ? `Keywords: ${ai.keywords.slice(0, 8).join(", ")}` : null,
    ai.notes ? `AI notes: ${ai.notes}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  const prompt = `You are a US resale market expert. Based on the item below, estimate the current fair market value for resale in the US secondhand market (eBay, Facebook Marketplace, Craigslist, estate sales, thrift stores). Consider current demand, typical sell-through rates, and condition adjustments. Return a realistic price range a seller could expect to achieve.\n\n${description}`;

  try {
    const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
    const resp = await openaiClient.responses.create({
      model,
      input: [{ role: "user", content: [{ type: "input_text", text: prompt }] }],
      text: {
        format: {
          type: "json_schema",
          name: "price_estimate",
          strict: true,
          schema: AI_PRICE_SCHEMA,
        },
      },
    });

    const parsed = JSON.parse(resp.output_text) as AiPriceEstimate;

    // Basic sanity check
    if (
      typeof parsed.low !== "number" ||
      typeof parsed.high !== "number" ||
      parsed.low <= 0 ||
      parsed.high < parsed.low
    ) {
      return null;
    }

    // Normalize confidence: AI sometimes returns 0-100 instead of 0-1
    if (parsed.confidence > 1) {
      parsed.confidence = parsed.confidence / 100;
    }
    parsed.confidence = clamp(parsed.confidence, 0.1, 0.99);

    return parsed;
  } catch {
    return null;
  }
}

// ─── Amazon resale anchor ─────────────────────────────────────────────────────
// Amazon retail price is a ceiling reference — resale is typically 40-70% of retail
const AMAZON_RESALE_MULTIPLIER = 0.55;

function applyAmazonAnchor(
  low: number,
  high: number,
  amazonData: RainforestEnrichmentData | null | undefined
): { low: number; high: number; amazonSource: { retailAvg: number; resaleEstimate: number; resultCount: number } | null } {
  if (!amazonData?.priceRange?.avg || amazonData.priceRange.avg <= 0) {
    return { low, high, amazonSource: null };
  }

  const retailAvg = amazonData.priceRange.avg;
  const resaleEstimate = Math.round(retailAvg * AMAZON_RESALE_MULTIPLIER);
  const resultCount = amazonData.resultCount;

  console.log(`[Pricing] Amazon anchor: $${retailAvg} retail → $${resaleEstimate} estimated resale`);

  // Blend Amazon resale estimate into the range (20% weight — real data anchor)
  const amazonWeight = 0.2;
  const existingWeight = 1 - amazonWeight;
  const anchoredLow = Math.round(low * existingWeight + resaleEstimate * 0.85 * amazonWeight);
  const anchoredHigh = Math.round(high * existingWeight + resaleEstimate * 1.15 * amazonWeight);

  return {
    low: anchoredLow,
    high: anchoredHigh,
    amazonSource: { retailAvg, resaleEstimate, resultCount },
  };
}

// ─── Main adapter ─────────────────────────────────────────────────────────────

export const pricingAdapter = {
  async getEstimate(input: PricingInput): Promise<PricingEstimate> {
    const { ai, condition, notes, purchasePrice, saleMethod, saleZip, amazonData } = input;

    const mult = conditionMultiplier(condition);
    const method = (saleMethod || "BOTH").toUpperCase();
    const sellerMarket = getMarketInfo(saleZip);

    // Build eBay query
    const queryParts = [
      ai.brand && ai.brand !== "Unknown" ? ai.brand : null,
      ai.model && ai.model !== "Unknown" ? ai.model : null,
      ai.item_name,
      "used",
    ].filter(Boolean);
    const query = queryParts.join(" ");

    // Run eBay + AI pricing in parallel
    const [comps, aiPrice] = await Promise.all([
      searchEbayComps(query, 10).catch(() => [] as EbayComp[]),
      getAiPriceEstimate(ai, condition, notes),
    ]);

    const prices = comps
      .map((c) => {
        const total = c.price + (c.shipping ?? 0);
        return Number.isFinite(total) ? total : NaN;
      })
      .filter((n) => Number.isFinite(n))
      .sort((a, b) => a - b);

    const hasEbay = prices.length >= 3;
    const hasAi = aiPrice !== null;

    // ── CASE 1: eBay comps + AI pricing → blend ───────────────────────────────
    if (hasEbay && hasAi) {
      // eBay comps are generic listings → apply condition multiplier
      const ebayLow = percentile(prices, 0.25) * mult;
      const ebayHigh = percentile(prices, 0.75) * mult;
      const ebayConf = clamp(0.7 + Math.min(prices.length, 10) * 0.02, 0.75, 0.92);

      // AI price prompt includes condition → do NOT apply mult again
      const aiLow = aiPrice.low;
      const aiHigh = aiPrice.high;

      // Weight eBay 60%, AI 40% when we have enough comps
      const weight = Math.min(prices.length / 10, 1.0); // 0→1 as comps grow
      const ebayWeight = 0.4 + weight * 0.2; // 0.4–0.6
      const aiWeight = 1 - ebayWeight;

      const blendLow = ebayLow * ebayWeight + aiLow * aiWeight;
      const blendHigh = ebayHigh * ebayWeight + aiHigh * aiWeight;
      const blendConf = ebayConf * ebayWeight + aiPrice.confidence * aiWeight;

      const onlineLow = Math.round(blendLow);
      const onlineHigh = Math.round(blendHigh);

      // Location-aware local pricing
      const locPrices = getLocationPrices(blendLow, blendHigh, saleZip);
      const localLow = locPrices.local.low;
      const localHigh = locPrices.local.high;

      const primaryLow = method === "LOCAL_PICKUP" ? localLow : onlineLow;
      const primaryHigh = method === "LOCAL_PICKUP" ? localHigh : onlineHigh;

      // Apply Amazon anchor if available (additive — enhances blend)
      const amazonAnchor = applyAmazonAnchor(onlineLow, onlineHigh, amazonData);
      const finalOnlineLow = amazonAnchor.amazonSource ? amazonAnchor.low : onlineLow;
      const finalOnlineHigh = amazonAnchor.amazonSource ? amazonAnchor.high : onlineHigh;
      const finalPrimaryLow = method === "LOCAL_PICKUP" ? localLow : finalOnlineLow;
      const finalPrimaryHigh = method === "LOCAL_PICKUP" ? localHigh : finalOnlineHigh;

      const rangeRatio = finalOnlineHigh / (finalOnlineLow || 1);
      const suggestMegabot = blendConf < 0.7 || rangeRatio > 8;

      return {
        low: finalPrimaryLow,
        high: finalPrimaryHigh,
        confidence: clamp(amazonAnchor.amazonSource ? blendConf + 0.03 : blendConf, 0.6, 0.95),
        source: amazonAnchor.amazonSource
          ? `eBay comps (${prices.length}) + AI + Amazon (${amazonAnchor.amazonSource.resultCount})`
          : `eBay comps (${prices.length} listings) + AI estimate`,
        localLow, localHigh,
        localConfidence: clamp(blendConf - 0.05, 0.55, 0.9),
        localSource: `${locPrices.local.label} local market`,
        onlineLow: finalOnlineLow, onlineHigh: finalOnlineHigh,
        onlineConfidence: clamp(blendConf, 0.6, 0.95),
        onlineSource: amazonAnchor.amazonSource ? `eBay + AI + Amazon blended` : `eBay + AI blended`,
        bestMarketLow: locPrices.bestMarket.low,
        bestMarketHigh: locPrices.bestMarket.high,
        bestMarketLabel: locPrices.bestMarket.label,
        bestMarketShipping: locPrices.bestMarket.shippingCost,
        bestMarketNetLow: locPrices.bestMarket.netLow,
        bestMarketNetHigh: locPrices.bestMarket.netHigh,
        marketInfo: { tier: sellerMarket.tier, label: sellerMarket.label, multiplier: sellerMarket.multiplier, note: sellerMarket.demandNote },
        sources: {
          ebay: { low: Math.round(ebayLow), high: Math.round(ebayHigh), confidence: ebayConf, count: prices.length },
          ai: { low: Math.round(aiLow), high: Math.round(aiHigh), confidence: aiPrice.confidence, rationale: aiPrice.rationale },
          ...(amazonAnchor.amazonSource ? { amazon: amazonAnchor.amazonSource } : {}),
        },
        suggestMegabot,
        comps,
      };
    }

    // ── CASE 2: AI pricing only (no eBay comps) ───────────────────────────────
    if (hasAi) {
      // AI prompt includes condition → do NOT apply mult again
      const aiLow = aiPrice.low;
      const aiHigh = aiPrice.high;

      const baseOnlineLow = Math.round(aiLow);
      const baseOnlineHigh = Math.round(aiHigh);

      // Apply Amazon anchor if available
      const amazonAnchor = applyAmazonAnchor(baseOnlineLow, baseOnlineHigh, amazonData);
      const onlineLow = amazonAnchor.amazonSource ? amazonAnchor.low : baseOnlineLow;
      const onlineHigh = amazonAnchor.amazonSource ? amazonAnchor.high : baseOnlineHigh;

      // Location-aware local pricing
      const locPrices = getLocationPrices(aiLow, aiHigh, saleZip);
      const localLow = locPrices.local.low;
      const localHigh = locPrices.local.high;

      const primaryLow = method === "LOCAL_PICKUP" ? localLow : onlineLow;
      const primaryHigh = method === "LOCAL_PICKUP" ? localHigh : onlineHigh;

      const baseConf = aiPrice.confidence * 0.9;
      const conf = amazonAnchor.amazonSource ? baseConf + 0.05 : baseConf;
      const rangeRatio = onlineHigh / (onlineLow || 1);
      const suggestMegabot = conf < 0.7 || rangeRatio > 8;

      return {
        low: primaryLow,
        high: primaryHigh,
        confidence: clamp(conf, 0.55, 0.88),
        source: amazonAnchor.amazonSource
          ? `AI estimate + Amazon (${amazonAnchor.amazonSource.resultCount} listings)`
          : "AI market estimate (OpenAI)",
        localLow, localHigh,
        localConfidence: clamp(aiPrice.confidence * 0.85, 0.5, 0.85),
        localSource: `${locPrices.local.label} local market`,
        onlineLow, onlineHigh,
        onlineConfidence: clamp(conf, 0.55, 0.88),
        onlineSource: amazonAnchor.amazonSource ? "AI + Amazon blended" : "AI estimate (OpenAI pricing model)",
        bestMarketLow: locPrices.bestMarket.low,
        bestMarketHigh: locPrices.bestMarket.high,
        bestMarketLabel: locPrices.bestMarket.label,
        bestMarketShipping: locPrices.bestMarket.shippingCost,
        bestMarketNetLow: locPrices.bestMarket.netLow,
        bestMarketNetHigh: locPrices.bestMarket.netHigh,
        marketInfo: { tier: sellerMarket.tier, label: sellerMarket.label, multiplier: sellerMarket.multiplier, note: sellerMarket.demandNote },
        sources: {
          ai: { low: Math.round(aiLow), high: Math.round(aiHigh), confidence: aiPrice.confidence, rationale: aiPrice.rationale },
          ...(amazonAnchor.amazonSource ? { amazon: amazonAnchor.amazonSource } : {}),
        },
        suggestMegabot,
        comps: [],
      };
    }

    // ── CASE 3: eBay comps only (no AI) ──────────────────────────────────────
    if (hasEbay) {
      const ebayLow = percentile(prices, 0.25) * mult;
      const ebayHigh = percentile(prices, 0.75) * mult;
      const ebayConf = clamp(0.7 + Math.min(prices.length, 10) * 0.02, 0.75, 0.9);

      const onlineLow = Math.round(ebayLow);
      const onlineHigh = Math.round(ebayHigh);

      // Location-aware local pricing
      const locPrices = getLocationPrices(ebayLow, ebayHigh, saleZip);
      const localLow = locPrices.local.low;
      const localHigh = locPrices.local.high;

      const primaryLow = method === "LOCAL_PICKUP" ? localLow : onlineLow;
      const primaryHigh = method === "LOCAL_PICKUP" ? localHigh : onlineHigh;

      return {
        low: primaryLow,
        high: primaryHigh,
        confidence: ebayConf,
        source: `eBay live comps (${prices.length} listings)`,
        localLow, localHigh,
        localConfidence: clamp(ebayConf - 0.05, 0.6, 0.9),
        localSource: `${locPrices.local.label} local market`,
        onlineLow, onlineHigh,
        onlineConfidence: ebayConf,
        onlineSource: "eBay live comps",
        bestMarketLow: locPrices.bestMarket.low,
        bestMarketHigh: locPrices.bestMarket.high,
        bestMarketLabel: locPrices.bestMarket.label,
        bestMarketShipping: locPrices.bestMarket.shippingCost,
        bestMarketNetLow: locPrices.bestMarket.netLow,
        bestMarketNetHigh: locPrices.bestMarket.netHigh,
        marketInfo: { tier: sellerMarket.tier, label: sellerMarket.label, multiplier: sellerMarket.multiplier, note: sellerMarket.demandNote },
        sources: {
          ebay: { low: onlineLow, high: onlineHigh, confidence: ebayConf, count: prices.length },
        },
        suggestMegabot: ebayConf < 0.7,
        comps,
      };
    }

    // ── CASE 4: No data at all — refuse to guess without purchase price ───────
    const base = purchasePrice && purchasePrice > 0 ? purchasePrice : null;

    if (!base) {
      // Can't make a meaningful estimate — return a very wide band with low confidence
      // so the UI will flag it and suggest MegaBot
      return {
        low: 10,
        high: 500,
        confidence: 0.25,
        source: "No data available — run AI analysis for a real estimate",
        suggestMegabot: true,
        comps: [],
      };
    }

    const onlineLow = Math.round(base * 0.65 * mult);
    const onlineHigh = Math.round(base * 0.90 * mult);

    // Location-aware local pricing
    const locPrices = getLocationPrices(onlineLow, onlineHigh, saleZip);
    const localLow = locPrices.local.low;
    const localHigh = locPrices.local.high;

    const primaryLow = method === "LOCAL_PICKUP" ? localLow : onlineLow;
    const primaryHigh = method === "LOCAL_PICKUP" ? localHigh : onlineHigh;

    return {
      low: primaryLow,
      high: primaryHigh,
      confidence: 0.50,
      source: "Purchase price heuristic (no comps or AI data)",
      localLow, localHigh,
      localConfidence: 0.45,
      localSource: `${locPrices.local.label} local market`,
      onlineLow, onlineHigh,
      onlineConfidence: 0.50,
      onlineSource: "Heuristic from purchase price",
      bestMarketLow: locPrices.bestMarket.low,
      bestMarketHigh: locPrices.bestMarket.high,
      bestMarketLabel: locPrices.bestMarket.label,
      bestMarketShipping: locPrices.bestMarket.shippingCost,
      bestMarketNetLow: locPrices.bestMarket.netLow,
      bestMarketNetHigh: locPrices.bestMarket.netHigh,
      marketInfo: { tier: sellerMarket.tier, label: sellerMarket.label, multiplier: sellerMarket.multiplier, note: sellerMarket.demandNote },
      suggestMegabot: true,
      comps: [],
    };
  },
};
