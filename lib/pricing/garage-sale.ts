/**
 * Garage Sale Pricing Engine — LegacyLoop
 *
 * Post-processing calculation layer. Reads the market price from bots,
 * applies category-specific Garage Sale Discount Factors (GDF),
 * and returns three price tiers: Online / Garage Sale / Quick Sale.
 *
 * Real-world validated: $135 Ninja Air Fryer = $35-50 garage sale.
 * Antiques and collectibles are GDF-exempt — their value holds.
 *
 * CMD-GARAGE-SALE-PRICING-ENGINE
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
  // Handle AI condition formats
  "like new": 0.90,
  mint:       0.90,
  great:      0.70,
  used:       0.45,
  damaged:    0.10,
  broken:     0.05,
};

// ── Category normalization ──────────────────────────────────────────────
export function getCategoryKey(raw: string | null | undefined): string {
  if (!raw) return "default";
  const lower = raw.toLowerCase().trim();

  // Direct match
  if (GARAGE_SALE_FACTORS[lower]) return lower;

  // Fuzzy match common patterns
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
  if (!condition) return 0.55; // default: good
  const lower = condition.toLowerCase().trim();
  return CONDITION_MODIFIER[lower] ?? 0.55;
}

// ── Main calculation ────────────────────────────────────────────────────

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
}

export function calculateGarageSalePrices(
  marketPrice: number,
  category: string | null | undefined,
  condition: string | null | undefined,
  zip?: string | null,
): GarageSalePrices {
  // Import location data (same system PriceBot uses)
  let locationMultiplier = 1.0;
  let locationTier = "MEDIUM";
  let locationLabel = "National average";
  if (zip && zip.length >= 3) {
    // Inline getMarketInfo logic to avoid circular import at module level
    const prefix3 = zip.slice(0, 3);
    // We can't dynamically import here (sync function), so we use a lightweight lookup
    // The full getMarketInfo is in market-data.ts — for garage sales we apply a
    // dampened version of the location multiplier (garage sales are more local-price-driven)
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
      // Dampen for garage sales — high market = 10-20% more, not full 25-35%
      locationMultiplier = 1.0 + (HIGH[prefix3] - 1.0) * 0.6;
      locationTier = "HIGH";
      locationLabel = "Strong local market";
    } else if (LOW[prefix3]) {
      // Dampen for garage sales — low market has moderate effect
      locationMultiplier = 1.0 + (LOW[prefix3] - 1.0) * 0.7;
      locationTier = "LOW";
      locationLabel = "Rural/lower-density market";
    }
  }

  const categoryKey = getCategoryKey(category);
  const factor = GARAGE_SALE_FACTORS[categoryKey] ?? GARAGE_SALE_FACTORS.default;
  const conditionPos = getConditionPosition(condition);

  let gsLow: number;
  let gsHigh: number;

  if (factor.flat) {
    // Flat pricing (clothing, books, media) — location has minimal effect
    gsLow = Math.round(factor.flat.min * locationMultiplier);
    gsHigh = Math.round(factor.flat.max * locationMultiplier);
    gsLow = Math.max(gsLow, factor.flat.min); // Never go below absolute minimum
  } else {
    // Percentage-based — location multiplier adjusts the final price
    const range = factor.max - factor.min;
    const appliedFactor = factor.min + (range * conditionPos);
    gsLow = Math.round(marketPrice * Math.max(0.05, appliedFactor - 0.05) * locationMultiplier);
    gsHigh = Math.round(marketPrice * Math.min(1, appliedFactor + 0.05) * locationMultiplier);
  }

  // Apply caps
  gsLow = Math.max(1, Math.min(gsLow, 200));
  gsHigh = Math.max(gsLow, Math.min(gsHigh, 200));

  // Quick sale = 65% of garage sale price (gone-today pricing)
  let qsLow = Math.round(gsLow * 0.65);
  let qsHigh = Math.round(gsHigh * 0.65);
  qsLow = Math.max(1, Math.min(qsLow, 150));
  qsHigh = Math.max(qsLow, Math.min(qsHigh, 150));

  return {
    onlinePrice: marketPrice,
    garageSalePrice: gsLow,
    garageSalePriceHigh: gsHigh,
    quickSalePrice: qsLow,
    quickSalePriceHigh: qsHigh,
    savingsVsOnline: Math.max(0, marketPrice - gsHigh),
    categoryKey,
    isExempt: !!factor.exempt,
    conditionUsed: condition || "good",
    locationTier,
    locationLabel,
    locationMultiplier,
  };
}
