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
}

export function calculateGarageSalePrices(
  marketPrice: number,
  category: string | null | undefined,
  condition: string | null | undefined,
): GarageSalePrices {
  const categoryKey = getCategoryKey(category);
  const factor = GARAGE_SALE_FACTORS[categoryKey] ?? GARAGE_SALE_FACTORS.default;
  const conditionPos = getConditionPosition(condition);

  let gsLow: number;
  let gsHigh: number;

  if (factor.flat) {
    // Flat pricing (clothing, books, media)
    gsLow = factor.flat.min;
    gsHigh = factor.flat.max;
  } else {
    // Percentage-based
    const range = factor.max - factor.min;
    const appliedFactor = factor.min + (range * conditionPos);
    gsLow = Math.round(marketPrice * Math.max(0.05, appliedFactor - 0.05));
    gsHigh = Math.round(marketPrice * Math.min(1, appliedFactor + 0.05));
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
  };
}
