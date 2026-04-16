/**
 * Garage Sale Pricing Engine V2 — LegacyLoop
 *
 * Post-processing calculation layer. Reads the market price from bots,
 * applies category-specific Garage Sale Discount Factors (GDF),
 * and returns three price tiers: Online / Garage Sale / Quick Sale.
 *
 * V2 additions: auction-anchored antique pricing, demand-adjusted
 * quick sale ratios, confidence-based range narrowing, brand premiums,
 * market comps boost.
 *
 * Real-world validated: $135 Ninja Air Fryer = $35-50 garage sale.
 * Antiques and collectibles are GDF-exempt — their value holds.
 *
 * CMD-GARAGE-SALE-PRICING-ENGINE + CMD-GARAGE-SALE-ENGINE-V2
 */

// ── Garage Sale Discount Factors by category ────────────────────────────
// min/max = percentage of market price at which items sell at garage sales
// flat = fixed dollar range (clothing, books — never percentage-based)
export const GARAGE_SALE_FACTORS: Record<string, {
  min: number;
  max: number;
  flat?: { min: number; max: number };
  exempt?: boolean;
}> = {
  electronics:    { min: 0.20, max: 0.40 },
  appliances:     { min: 0.20, max: 0.40 },
  furniture:      { min: 0.20, max: 0.35 },
  clothing:       { min: 0, max: 0, flat: { min: 1, max: 5 } },
  books:          { min: 0, max: 0, flat: { min: 0.25, max: 1 } },
  tools:          { min: 0.20, max: 0.30 },
  kitchenware:    { min: 0.15, max: 0.25 },
  kitchen:        { min: 0.15, max: 0.25 },
  decor:          { min: 0.15, max: 0.25 },
  "home decor":   { min: 0.15, max: 0.25 },
  toys:           { min: 0.15, max: 0.25 },
  games:          { min: 0.15, max: 0.25 },
  sports:         { min: 0.20, max: 0.30 },
  "sports equipment": { min: 0.20, max: 0.30 },
  automotive:     { min: 0.30, max: 0.50 },
  vehicle:        { min: 0.30, max: 0.50 },
  outdoor:        { min: 0.20, max: 0.35 },
  garden:         { min: 0.20, max: 0.30 },
  music:          { min: 0.20, max: 0.35 },
  "musical instruments": { min: 0.30, max: 0.50 },
  media:          { min: 0, max: 0, flat: { min: 0.50, max: 3 } },
  // Exempt categories — value holds at garage sales
  collectibles:   { min: 0.70, max: 0.90, exempt: true },
  antiques:       { min: 0.70, max: 0.90, exempt: true },
  antique:        { min: 0.70, max: 0.90, exempt: true },
  jewelry:        { min: 0.50, max: 0.80, exempt: true },
  art:            { min: 0.50, max: 0.80, exempt: true },
  coins:          { min: 0.70, max: 0.90, exempt: true },
  watches:        { min: 0.50, max: 0.75, exempt: true },
  // Default fallback
  default:        { min: 0.20, max: 0.30 },
};

// ── Condition modifiers — position within the factor range ──────────────
const CONDITION_MODIFIER: Record<string, number> = {
  like_new:   0.90,
  excellent:  0.75,
  good:       0.55,
  fair:       0.35,
  poor:       0.15,
  "like new": 0.90,
  mint:       0.90,
  great:      0.70,
  used:       0.45,
  damaged:    0.10,
  broken:     0.05,
};

// ── Premium brands — 12% uplift at garage sales ─────────────────────────
const PREMIUM_BRANDS = new Set([
  "apple", "dyson", "kitchenaid", "vitamix", "le creuset", "breville",
  "patagonia", "north face", "yeti", "weber", "traeger", "snap-on",
  "dewalt", "milwaukee", "makita", "bose", "sonos", "sony",
  "canon", "nikon", "leica", "herman miller", "steelcase",
  "tiffany", "cartier", "rolex", "omega", "tag heuer",
  "fender", "gibson", "martin", "taylor", "yamaha",
  "lego", "hot wheels", "pokemon", "nintendo",
  // Power equipment (common in Maine estate sales, $500-$5000)
  "john deere", "husqvarna", "cub cadet", "stihl", "echo",
  "craftsman", "ego", "greenworks", "toro", "ariens",
  "briggs & stratton", "kohler engines", "honda power",
  "kubota", "bobcat", "simplicity",
]);

// ── Category normalization ──────────────────────────────────────────────
export function getCategoryKey(raw: string | null | undefined): string {
  if (!raw) return "default";
  const lower = raw.toLowerCase().trim();

  if (GARAGE_SALE_FACTORS[lower]) return lower;

  if (lower.includes("electron")) return "electronics";
  if (lower.includes("applian")) return "appliances";
  if (lower.includes("kitchen")) return "kitchenware";
  if (lower.includes("furnitur")) return "furniture";
  if (lower.includes("cloth") || lower.includes("apparel") || lower.includes("fashion")) return "clothing";
  if (lower.includes("book") || lower.includes("textbook")) return "books";
  if (lower.includes("tool")) return "tools";
  if (lower.includes("toy") || lower.includes("game")) return "toys";
  if (lower.includes("sport") || lower.includes("fitness")) return "sports";
  if (lower.includes("auto") || lower.includes("vehicle") || lower.includes("car")) return "automotive";
  if (lower.includes("decor") || lower.includes("home")) return "decor";
  if (lower.includes("outdoor") || lower.includes("garden") || lower.includes("patio")) return "outdoor";
  if (lower.includes("music") || lower.includes("instrument") || lower.includes("guitar")) return "musical instruments";
  if (lower.includes("collecti")) return "collectibles";
  if (lower.includes("antiqu") || lower.includes("vintage")) return "antiques";
  if (lower.includes("jewel") || lower.includes("ring") || lower.includes("necklace")) return "jewelry";
  if (lower.includes("art") || lower.includes("painting") || lower.includes("sculpture")) return "art";
  if (lower.includes("watch")) return "watches";
  if (lower.includes("coin") || lower.includes("stamp")) return "coins";

  return "default";
}

function getConditionPosition(condition: string | null | undefined): number {
  if (!condition) return 0.55;
  const lower = condition.toLowerCase().trim();
  return CONDITION_MODIFIER[lower] ?? 0.55;
}

// ── Demand-adjusted quick sale ratio ────────────────────────────────────
function getQuickSaleRatio(demandScore?: number): number {
  if (!demandScore || demandScore <= 0) return 0.65;
  if (demandScore >= 80) return 0.78;
  if (demandScore >= 60) return 0.70;
  if (demandScore >= 40) return 0.65;
  if (demandScore >= 20) return 0.55;
  return 0.45;
}

function getDemandLabel(demandScore?: number): string {
  if (!demandScore || demandScore <= 0) return "Unknown";
  if (demandScore >= 80) return "Hot";
  if (demandScore >= 60) return "Strong";
  if (demandScore >= 40) return "Moderate";
  if (demandScore >= 20) return "Weak";
  return "Cold";
}

// ── Types ───────────────────────────────────────────────────────────────

export interface GarageSaleOptions {
  isAntique?: boolean;
  authenticityScore?: number;
  auctionLow?: number;
  auctionHigh?: number;
  demandScore?: number;
  confidenceScore?: number;
  conditionScore?: number;
  numOwners?: string;
  ageYears?: number;
  brand?: string;
  marketCompsCount?: number;
  isCollectible?: boolean;
  collectiblesScore?: number;
  collectiblesGrade?: string;
}

export interface GarageSalePrices {
  onlinePrice: number;
  garageSalePrice: number;
  garageSalePriceHigh: number;
  quickSalePrice: number;
  quickSalePriceHigh: number;
  savingsVsOnline: number;
  categoryKey: string;
  isExempt: boolean;
  conditionUsed: string;
  locationTier: string;
  locationLabel: string;
  locationMultiplier: number;
  demandLabel: string;
  quickSaleRatio: number;
  auctionAnchored: boolean;
  brandPremium: boolean;
  confidenceNarrowed: boolean;
}

// ── Main calculation ────────────────────────────────────────────────────

export function calculateGarageSalePrices(
  marketPrice: number,
  category: string | null | undefined,
  condition: string | null | undefined,
  zip?: string | null,
  options?: GarageSaleOptions,
): GarageSalePrices {
  // ── Location multiplier (unchanged from V1) ──
  let locationMultiplier = 1.0;
  let locationTier = "MEDIUM";
  let locationLabel = "National average";
  if (zip && zip.length >= 3) {
    const prefix3 = zip.slice(0, 3);
    const HIGH: Record<string, number> = {
      "100": 1.35, "101": 1.35, "102": 1.35, "103": 1.35, "104": 1.35,
      "070": 1.35, "071": 1.35, "072": 1.35, "073": 1.35, "074": 1.35,
      "940": 1.30, "941": 1.30, "943": 1.30, "944": 1.30, "945": 1.30,
      "900": 1.25, "901": 1.25, "904": 1.25, "906": 1.25,
      "980": 1.20, "981": 1.20,
      "011": 1.25, "021": 1.25, "022": 1.25, "024": 1.25,
      "606": 1.15, "607": 1.15,
      "331": 1.20, "332": 1.20, "333": 1.20, "334": 1.20,
      "200": 1.25, "202": 1.25, "220": 1.25, "222": 1.25,
      "800": 1.15, "801": 1.15,
    };
    const LOW: Record<string, number> = {
      "039": 0.75, "040": 0.75, "041": 0.75, "042": 0.75, "043": 0.75,
      "044": 0.75, "045": 0.75, "046": 0.75, "047": 0.75, "048": 0.75, "049": 0.75,
      "247": 0.70, "250": 0.70, "253": 0.70, "256": 0.70, "260": 0.70,
      "386": 0.68, "389": 0.68, "392": 0.68,
      "716": 0.70, "720": 0.70, "721": 0.70,
      "574": 0.70, "575": 0.70, "576": 0.70, "587": 0.70,
    };

    if (HIGH[prefix3]) {
      locationMultiplier = 1.0 + (HIGH[prefix3] - 1.0) * 0.6;
      locationTier = "HIGH";
      locationLabel = "Strong local market";
    } else if (LOW[prefix3]) {
      locationMultiplier = 1.0 + (LOW[prefix3] - 1.0) * 0.7;
      locationTier = "LOW";
      locationLabel = "Rural/lower-density market";
    }
  }

  const categoryKey = getCategoryKey(category);
  const factor = GARAGE_SALE_FACTORS[categoryKey] ?? GARAGE_SALE_FACTORS.default;
  const conditionPos = getConditionPosition(condition);

  // ── V2: Auction-anchored pricing for verified antiques ──
  let auctionAnchored = false;
  let effectiveMarketPrice = marketPrice;
  if (
    options?.isAntique &&
    (options.authenticityScore ?? 0) >= 70 &&
    options.auctionLow != null &&
    options.auctionHigh != null
  ) {
    const auctionMid = Math.round((options.auctionLow + options.auctionHigh) / 2);
    if (auctionMid > 0) {
      effectiveMarketPrice = auctionMid;
      auctionAnchored = true;
    }
  }

  let gsLow: number;
  let gsHigh: number;

  if (factor.flat) {
    gsLow = Math.round(factor.flat.min * locationMultiplier);
    gsHigh = Math.round(factor.flat.max * locationMultiplier);
    gsLow = Math.max(gsLow, factor.flat.min);
  } else if (auctionAnchored) {
    // Auction-anchored: 15-25% street discount off auction value
    const streetDiscountLow = 0.75;
    const streetDiscountHigh = 0.85;
    gsLow = Math.round(effectiveMarketPrice * streetDiscountLow * locationMultiplier);
    gsHigh = Math.round(effectiveMarketPrice * streetDiscountHigh * locationMultiplier);
  } else {
    const range = factor.max - factor.min;
    const appliedFactor = factor.min + (range * conditionPos);
    gsLow = Math.round(effectiveMarketPrice * Math.max(0.05, appliedFactor - 0.05) * locationMultiplier);
    gsHigh = Math.round(effectiveMarketPrice * Math.min(1, appliedFactor + 0.05) * locationMultiplier);
  }

  // ── V2: Brand premium ──
  let brandPremium = false;
  if (options?.brand) {
    const brandLower = options.brand.toLowerCase().trim();
    if (PREMIUM_BRANDS.has(brandLower) || [...PREMIUM_BRANDS].some(b => brandLower.includes(b))) {
      gsLow = Math.round(gsLow * 1.12);
      gsHigh = Math.round(gsHigh * 1.12);
      brandPremium = true;
    }
  }

  // ── V2: Market comps confidence boost ──
  if (options?.marketCompsCount != null) {
    if (options.marketCompsCount >= 5) {
      // More data = tighter range
      const mid = Math.round((gsLow + gsHigh) / 2);
      gsLow = Math.max(1, Math.round(mid * 0.93));
      gsHigh = Math.round(mid * 1.07);
    } else if (options.marketCompsCount === 0) {
      // No comps = widen range 10%
      gsLow = Math.round(gsLow * 0.90);
      gsHigh = Math.round(gsHigh * 1.10);
    }
  }

  // ── V2: Confidence-based range narrowing ──
  let confidenceNarrowed = false;
  if (options?.confidenceScore != null) {
    const conf = options.confidenceScore;
    if (conf >= 0.85) {
      const mid = Math.round((gsLow + gsHigh) / 2);
      gsLow = Math.max(1, Math.round(mid * 0.92));
      gsHigh = Math.round(mid * 1.08);
      confidenceNarrowed = true;
    } else if (conf >= 0.70) {
      const mid = Math.round((gsLow + gsHigh) / 2);
      gsLow = Math.max(1, Math.round(mid * 0.88));
      gsHigh = Math.round(mid * 1.12);
      confidenceNarrowed = true;
    }
  }

  // ── V2: Collectibles uplift ──
  let collectiblesUplift = false;
  const isHighGradeCollectible = options?.isCollectible && (options.collectiblesScore ?? 0) >= 80;
  const isMidGradeCollectible = options?.isCollectible && (options.collectiblesScore ?? 0) >= 50 && !isHighGradeCollectible;
  if (isHighGradeCollectible) {
    collectiblesUplift = true;
  } else if (isMidGradeCollectible) {
    gsLow = Math.round(gsLow * 1.15);
    gsHigh = Math.round(gsHigh * 1.15);
    collectiblesUplift = true;
  }

  // ── Apply caps (V2: exempt categories get higher caps; high-grade collectibles treated as exempt) ──
  const effectiveExempt = factor.exempt || isHighGradeCollectible;
  const gsCap = effectiveExempt ? 5000 : (isMidGradeCollectible ? 800 : 500);
  gsLow = Math.max(1, Math.min(gsLow, gsCap));
  gsHigh = Math.max(gsLow, Math.min(gsHigh, gsCap));

  // ── V2: Demand-adjusted quick sale ratio ──
  const quickSaleRatio = getQuickSaleRatio(options?.demandScore);
  let qsLow = Math.round(gsLow * quickSaleRatio);
  let qsHigh = Math.round(gsHigh * quickSaleRatio);
  const qsCap = effectiveExempt ? 4000 : (isMidGradeCollectible ? 550 : 350);
  qsLow = Math.max(1, Math.min(qsLow, qsCap));
  qsHigh = Math.max(qsLow, Math.min(qsHigh, qsCap));

  return {
    onlinePrice: marketPrice,
    garageSalePrice: gsLow,
    garageSalePriceHigh: gsHigh,
    quickSalePrice: qsLow,
    quickSalePriceHigh: qsHigh,
    savingsVsOnline: Math.max(0, marketPrice - gsHigh),
    categoryKey,
    isExempt: !!effectiveExempt,
    conditionUsed: condition || "good",
    locationTier,
    locationLabel,
    locationMultiplier,
    demandLabel: getDemandLabel(options?.demandScore),
    quickSaleRatio,
    auctionAnchored,
    brandPremium,
    confidenceNarrowed,
  };
}

// ── V8 Three-Number Pricing Engine ─────────────────────────────────────

export interface GarageSaleV8Prices extends GarageSalePrices {
  listPrice: number;
  acceptPrice: number;
  floorPrice: number;
  channelRecommendation: string;
  channelReason: string;
  locationNote: string;
  saleTypeUsed: string;
  v8: true;
}

export interface GarageSaleV8Options extends GarageSaleOptions {
  saleMethod?: string;
  shippingDifficulty?: string;
  itemTitle?: string;
}

export function calculateGarageSaleV8Prices(
  marketPrice: number,
  category: string | null | undefined,
  condition: string | null | undefined,
  zip?: string | null,
  options?: GarageSaleV8Options,
): GarageSaleV8Prices {
  const base = calculateGarageSalePrices(marketPrice, category, condition, zip, options);

  const acceptPrice = v8Round(base.garageSalePrice, marketPrice);
  const listPrice = v8Round(
    Math.round(acceptPrice * v8AnchorMultiplier(category)),
    marketPrice,
  );
  const floorPrice = v8Round(base.quickSalePrice, marketPrice);

  const { recommendation, reason } = v8Channel(
    acceptPrice, category, base.isExempt, options?.saleMethod, options?.shippingDifficulty,
  );
  const locationNote = v8LocationNote(zip, base.locationTier, base.locationMultiplier);

  return {
    ...base,
    listPrice,
    acceptPrice,
    floorPrice,
    channelRecommendation: recommendation,
    channelReason: reason,
    locationNote,
    saleTypeUsed: options?.saleMethod || "BOTH",
    v8: true as const,
  };
}

// ── V8 helpers ─────────────────────────────────────────────────────────

function v8AnchorMultiplier(category: string | null | undefined): number {
  const key = getCategoryKey(category);
  const factor = GARAGE_SALE_FACTORS[key];
  return factor?.exempt ? 1.10 : 1.20;
}

function v8Round(price: number, marketPrice: number): number {
  if (price <= 0) return 1;
  if (marketPrice < 20) return Math.round(price);
  if (marketPrice < 100) return Math.round(price / 5) * 5;
  if (marketPrice < 500) return Math.round(price / 10) * 10;
  return Math.round(price / 25) * 25;
}

function v8Channel(
  acceptPrice: number,
  category: string | null | undefined,
  isExempt: boolean,
  saleMethod?: string,
  shippingDifficulty?: string,
): { recommendation: string; reason: string } {
  if (saleMethod === "LOCAL_PICKUP" || shippingDifficulty === "FREIGHT_ONLY") {
    return {
      recommendation: acceptPrice >= 200 ? "Estate sale or local consignment" : "Garage sale or local pickup",
      reason: saleMethod === "LOCAL_PICKUP" ? "Seller prefers local sale" : "Item too large to ship",
    };
  }
  if (isExempt) {
    return { recommendation: "Specialist dealer or auction", reason: "Value-holding item benefits from expert audience" };
  }
  if (acceptPrice < 15) return { recommendation: "Garage sale or bundle lot", reason: "Low value — not worth shipping costs" };
  if (acceptPrice < 50) return { recommendation: "Garage sale with online backup", reason: "List locally first, then try marketplace" };
  if (acceptPrice < 200) return { recommendation: "Online marketplace (eBay, Mercari, FB)", reason: "Best price-to-effort ratio for this range" };
  if (acceptPrice < 500) return { recommendation: "Specialty platform", reason: "Higher-value item deserves targeted audience" };
  return { recommendation: "Auction or consignment", reason: "Maximize return on high-value item" };
}

function v8LocationNote(
  zip: string | null | undefined,
  tier: string,
  multiplier: number,
): string {
  if (!zip) return "No ZIP provided — using national average pricing.";
  const prefix = zip.slice(0, 3);
  const pctDiff = Math.round((multiplier - 1.0) * 100);
  if (tier === "HIGH") {
    return `Strong market (ZIP ${prefix}xx): local demand runs ${pctDiff}% above national average.`;
  }
  if (tier === "LOW") {
    return `Rural/lower-density market (ZIP ${prefix}xx): prices typically ${Math.abs(pctDiff)}% below national average. FLOOR adjusted accordingly.`;
  }
  return `Average market (ZIP ${prefix}xx): pricing at national baseline.`;
}
