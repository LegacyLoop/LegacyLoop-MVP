/**
 * Location-Based Market Multiplier Engine
 *
 * The same item has VERY different values in different markets.
 * This module maps zip code prefixes to demand multipliers.
 *
 * Multiplier meanings:
 *   1.0  = national average baseline
 *   1.25 = 25% premium (high-demand metro)
 *   0.80 = 20% discount (lower-demand rural)
 *
 * Data source: curated from resale market analysis. In production,
 * this would be backed by a database table updated from sales data.
 */

// ─── Market tier definitions ─────────────────────────────────────────────────

export type MarketTier = "HIGH" | "MEDIUM" | "LOW" | "SPECIALTY";

export interface MarketInfo {
  tier: MarketTier;
  multiplier: number;
  label: string;
  demandNote: string;
}

// ─── High-demand metro zip prefixes ─────────────────────────────────────────
// Buyers in these areas pay MORE for vintage, antique, and unique items

const HIGH_DEMAND_ZIPS: Record<string, { label: string; mult: number }> = {
  // New York City metro (100-104) + NJ (070-079): 1.35
  "100": { label: "New York City", mult: 1.35 },
  "101": { label: "New York City", mult: 1.35 },
  "102": { label: "New York City", mult: 1.35 },
  "103": { label: "Staten Island, NY", mult: 1.35 },
  "104": { label: "Bronx, NY", mult: 1.35 },
  "070": { label: "Newark, NJ", mult: 1.35 },
  "071": { label: "Jersey City, NJ", mult: 1.35 },
  "072": { label: "Elizabeth, NJ", mult: 1.35 },
  "073": { label: "Jersey City, NJ", mult: 1.35 },
  "074": { label: "Paterson, NJ", mult: 1.35 },
  "075": { label: "Paterson, NJ", mult: 1.35 },
  "076": { label: "Hackensack, NJ", mult: 1.35 },
  "077": { label: "Red Bank, NJ", mult: 1.35 },
  "078": { label: "Dover, NJ", mult: 1.35 },
  "079": { label: "Summit, NJ", mult: 1.35 },
  // San Francisco Bay Area (940-949): 1.30
  "940": { label: "Bay Area, CA", mult: 1.30 },
  "941": { label: "San Francisco", mult: 1.30 },
  "942": { label: "Sacramento, CA", mult: 1.30 },
  "943": { label: "Palo Alto, CA", mult: 1.30 },
  "944": { label: "San Mateo, CA", mult: 1.30 },
  "945": { label: "Oakland, CA", mult: 1.30 },
  "946": { label: "Oakland, CA", mult: 1.30 },
  "947": { label: "Berkeley, CA", mult: 1.30 },
  "948": { label: "Richmond, CA", mult: 1.30 },
  "949": { label: "San Rafael, CA", mult: 1.30 },
  // Los Angeles (900-917): 1.25
  "900": { label: "Los Angeles", mult: 1.25 },
  "901": { label: "Los Angeles", mult: 1.25 },
  "902": { label: "Inglewood, CA", mult: 1.25 },
  "903": { label: "Inglewood, CA", mult: 1.25 },
  "904": { label: "Santa Monica, CA", mult: 1.25 },
  "905": { label: "Torrance, CA", mult: 1.25 },
  "906": { label: "Pasadena, CA", mult: 1.25 },
  "907": { label: "Pasadena, CA", mult: 1.25 },
  "908": { label: "Long Beach, CA", mult: 1.25 },
  "909": { label: "San Bernardino, CA", mult: 1.25 },
  "910": { label: "Glendale, CA", mult: 1.25 },
  "911": { label: "Glendale, CA", mult: 1.25 },
  "912": { label: "Glendale, CA", mult: 1.25 },
  "913": { label: "Van Nuys, CA", mult: 1.25 },
  "914": { label: "Van Nuys, CA", mult: 1.25 },
  "915": { label: "Burbank, CA", mult: 1.25 },
  "916": { label: "North Hollywood, CA", mult: 1.25 },
  "917": { label: "Industry, CA", mult: 1.25 },
  // Seattle (980-981): 1.20
  "980": { label: "Seattle area", mult: 1.20 },
  "981": { label: "Seattle", mult: 1.20 },
  // Boston (011-024): 1.25
  "011": { label: "Springfield, MA", mult: 1.25 },
  "012": { label: "Pittsfield, MA", mult: 1.25 },
  "013": { label: "Springfield, MA", mult: 1.25 },
  "014": { label: "Worcester, MA", mult: 1.25 },
  "015": { label: "Worcester, MA", mult: 1.25 },
  "016": { label: "Worcester, MA", mult: 1.25 },
  "017": { label: "Framingham, MA", mult: 1.25 },
  "018": { label: "Lowell, MA", mult: 1.25 },
  "019": { label: "Lynn, MA", mult: 1.25 },
  "020": { label: "Brockton, MA", mult: 1.25 },
  "021": { label: "Boston", mult: 1.25 },
  "022": { label: "Boston area", mult: 1.25 },
  "023": { label: "Brockton, MA", mult: 1.25 },
  "024": { label: "Cambridge, MA", mult: 1.25 },
  // Chicago (606-608): 1.15
  "606": { label: "Chicago", mult: 1.15 },
  "607": { label: "Chicago suburbs", mult: 1.15 },
  "608": { label: "Chicago suburbs", mult: 1.15 },
  // Miami (331-334): 1.20
  "331": { label: "Miami", mult: 1.20 },
  "332": { label: "Miami area", mult: 1.20 },
  "333": { label: "Fort Lauderdale, FL", mult: 1.20 },
  "334": { label: "Palm Beach, FL", mult: 1.20 },
  // Washington DC (200-205, 220-223): 1.25
  "200": { label: "Washington DC", mult: 1.25 },
  "201": { label: "DC area", mult: 1.25 },
  "202": { label: "Washington DC", mult: 1.25 },
  "203": { label: "Washington DC", mult: 1.25 },
  "204": { label: "Washington DC", mult: 1.25 },
  "205": { label: "Washington DC", mult: 1.25 },
  "220": { label: "Northern Virginia", mult: 1.25 },
  "221": { label: "Northern Virginia", mult: 1.25 },
  "222": { label: "Arlington, VA", mult: 1.25 },
  "223": { label: "Alexandria, VA", mult: 1.25 },
  // Denver (800-802): 1.15
  "800": { label: "Denver area", mult: 1.15 },
  "801": { label: "Denver", mult: 1.15 },
  "802": { label: "Denver", mult: 1.15 },
};

// ─── Medium-demand zip prefixes (1.05 multiplier) ───────────────────────────

const MEDIUM_DEMAND_ZIPS: Record<string, { label: string; mult: number }> = {
  "787": { label: "Austin, TX", mult: 1.05 },
  "372": { label: "Nashville, TN", mult: 1.05 },
  "972": { label: "Portland, OR", mult: 1.05 },
  "280": { label: "Charlotte, NC", mult: 1.05 },
  "282": { label: "Charlotte, NC", mult: 1.05 },
  "553": { label: "Minneapolis, MN", mult: 1.05 },
  "554": { label: "Minneapolis, MN", mult: 1.05 },
  "850": { label: "Phoenix, AZ", mult: 1.05 },
  "852": { label: "Phoenix, AZ", mult: 1.05 },
  "300": { label: "Atlanta, GA", mult: 1.05 },
  "301": { label: "Atlanta, GA", mult: 1.05 },
  "303": { label: "Atlanta, GA", mult: 1.05 },
  "750": { label: "Dallas, TX", mult: 1.05 },
  "751": { label: "Dallas, TX", mult: 1.05 },
  "752": { label: "Dallas, TX", mult: 1.05 },
  "753": { label: "Dallas, TX", mult: 1.05 },
};

// ─── Lower-demand rural zip prefixes ────────────────────────────────────────
// Local buyers have less disposable income; prices are lower for local sales.
// Shipping to a high-demand buyer should use the BUYER's multiplier.

const LOW_DEMAND_ZIPS: Record<string, { label: string; mult: number }> = {
  // Rural Maine (039-049): 0.75
  "039": { label: "Rural Maine", mult: 0.75 },
  "040": { label: "Southern Maine", mult: 0.75 },
  "041": { label: "Portland, ME", mult: 0.75 },
  "042": { label: "Rural Maine", mult: 0.75 },
  "043": { label: "Augusta, ME", mult: 0.75 },
  "044": { label: "Rural Maine", mult: 0.75 },
  "045": { label: "Rural Maine", mult: 0.75 },
  "046": { label: "Rural Maine", mult: 0.75 },
  "047": { label: "Bangor, ME", mult: 0.75 },
  "048": { label: "Rural Maine", mult: 0.75 },
  "049": { label: "Waterville, ME", mult: 0.75 },
  // West Virginia (247-268): 0.70
  "247": { label: "West Virginia", mult: 0.70 },
  "248": { label: "West Virginia", mult: 0.70 },
  "249": { label: "West Virginia", mult: 0.70 },
  "250": { label: "Charleston, WV", mult: 0.70 },
  "251": { label: "West Virginia", mult: 0.70 },
  "252": { label: "West Virginia", mult: 0.70 },
  "253": { label: "West Virginia", mult: 0.70 },
  "254": { label: "West Virginia", mult: 0.70 },
  "255": { label: "West Virginia", mult: 0.70 },
  "256": { label: "West Virginia", mult: 0.70 },
  "257": { label: "West Virginia", mult: 0.70 },
  "258": { label: "West Virginia", mult: 0.70 },
  "259": { label: "West Virginia", mult: 0.70 },
  "260": { label: "West Virginia", mult: 0.70 },
  "261": { label: "West Virginia", mult: 0.70 },
  "262": { label: "West Virginia", mult: 0.70 },
  "263": { label: "West Virginia", mult: 0.70 },
  "264": { label: "West Virginia", mult: 0.70 },
  "265": { label: "West Virginia", mult: 0.70 },
  "266": { label: "West Virginia", mult: 0.70 },
  "267": { label: "West Virginia", mult: 0.70 },
  "268": { label: "West Virginia", mult: 0.70 },
  // Rural Mississippi (386-397): 0.68
  "386": { label: "Mississippi", mult: 0.68 },
  "387": { label: "Mississippi", mult: 0.68 },
  "388": { label: "Mississippi", mult: 0.68 },
  "389": { label: "Jackson, MS", mult: 0.68 },
  "390": { label: "Mississippi", mult: 0.68 },
  "391": { label: "Mississippi", mult: 0.68 },
  "392": { label: "Mississippi", mult: 0.68 },
  "393": { label: "Mississippi", mult: 0.68 },
  "394": { label: "Mississippi", mult: 0.68 },
  "395": { label: "Mississippi", mult: 0.68 },
  "396": { label: "Mississippi", mult: 0.68 },
  "397": { label: "Mississippi", mult: 0.68 },
  // Rural Arkansas (716-729): 0.70
  "716": { label: "Arkansas", mult: 0.70 },
  "717": { label: "Arkansas", mult: 0.70 },
  "718": { label: "Arkansas", mult: 0.70 },
  "719": { label: "Arkansas", mult: 0.70 },
  "720": { label: "Arkansas", mult: 0.70 },
  "721": { label: "Little Rock, AR", mult: 0.70 },
  "722": { label: "Arkansas", mult: 0.70 },
  "723": { label: "Arkansas", mult: 0.70 },
  "724": { label: "Arkansas", mult: 0.70 },
  "725": { label: "Arkansas", mult: 0.70 },
  "726": { label: "Arkansas", mult: 0.70 },
  "727": { label: "Arkansas", mult: 0.70 },
  "728": { label: "Arkansas", mult: 0.70 },
  "729": { label: "Arkansas", mult: 0.70 },
  // Rural Midwest
  "574": { label: "Rural South Dakota", mult: 0.70 },
  "575": { label: "Rural South Dakota", mult: 0.70 },
  "576": { label: "Rural North Dakota", mult: 0.70 },
  "587": { label: "Rural North Dakota", mult: 0.70 },
};

// ─── Specialty markets ──────────────────────────────────────────────────────

const SPECIALTY_ZIPS: Record<string, { label: string; mult: number; note: string }> = {
  // College towns — high furniture demand, low antique demand
  "148": { label: "Ithaca, NY (Cornell)", mult: 1.10, note: "College town: high demand for furniture, moderate for décor" },
  "016": { label: "Worcester, MA (colleges)", mult: 1.05, note: "College area: furniture demand peaks August-September" },
  // Retirement communities
  "342": { label: "The Villages, FL", mult: 1.15, note: "Retirement community: high demand for downsizing services" },
  "852": { label: "Scottsdale, AZ", mult: 1.20, note: "Affluent retirement area: strong antique and art market" },
  // Tourist areas — seasonal
  "039": { label: "Bar Harbor, ME", mult: 0.85, note: "Tourist area: seasonal pricing — higher June-September" },
};

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Get market info for a zip code. Checks 3-digit prefix first for specificity.
 */
export function getMarketInfo(zip: string | null | undefined): MarketInfo {
  if (!zip || zip.length < 3) {
    return {
      tier: "MEDIUM",
      multiplier: 1.0,
      label: "National average",
      demandNote: "No location provided — using national average pricing.",
    };
  }

  const prefix3 = zip.slice(0, 3);

  // Check specialty first (most specific)
  const spec = SPECIALTY_ZIPS[prefix3];
  if (spec) {
    return {
      tier: "SPECIALTY",
      multiplier: spec.mult,
      label: spec.label,
      demandNote: spec.note,
    };
  }

  // Check high-demand
  const high = HIGH_DEMAND_ZIPS[prefix3];
  if (high) {
    return {
      tier: "HIGH",
      multiplier: high.mult,
      label: high.label,
      demandNote: `High-demand market — buyers typically pay ${Math.round((high.mult - 1) * 100)}% more than national average.`,
    };
  }

  // Check medium-demand
  const med = MEDIUM_DEMAND_ZIPS[prefix3];
  if (med) {
    return {
      tier: "MEDIUM",
      multiplier: med.mult,
      label: med.label,
      demandNote: `Growing market — buyers pay about ${Math.round((med.mult - 1) * 100)}% above national average.`,
    };
  }

  // Check low-demand
  const low = LOW_DEMAND_ZIPS[prefix3];
  if (low) {
    return {
      tier: "LOW",
      multiplier: low.mult,
      label: low.label,
      demandNote: `Lower-demand local market — consider shipping to reach higher-demand buyers.`,
    };
  }

  // Default: medium-demand market
  return {
    tier: "MEDIUM",
    multiplier: 1.0,
    label: `ZIP ${zip}`,
    demandNote: "Standard market — pricing at national average.",
  };
}

/**
 * Get the best market to ship to (highest multiplier).
 * Returns the NYC market as default best since it has highest demand.
 */
export function getBestMarket(category?: string | null): MarketInfo {
  const cat = (category || "").toLowerCase();

  if (cat.includes("outdoor") || cat.includes("vehicle") || cat.includes("furniture")) {
    return {
      tier: "MEDIUM",
      multiplier: 1.05,
      label: "Nearest metro area",
      demandNote: "Large/heavy items sell best locally or at nearest metro. Shipping is impractical.",
    };
  }
  if (cat.includes("musical") || cat.includes("instrument") || cat.includes("guitar")) {
    return {
      tier: "HIGH",
      multiplier: 1.20,
      label: "Nashville, TN / Austin, TX",
      demandNote: "Music hubs with active gear markets.",
    };
  }
  if (cat.includes("art") || cat.includes("painting") || cat.includes("sculpture")) {
    return {
      tier: "HIGH",
      multiplier: 1.30,
      label: "New York City / Los Angeles",
      demandNote: "Strongest art resale markets.",
    };
  }

  return {
    tier: "HIGH",
    multiplier: 1.35,
    label: "New York City / Boston",
    demandNote: "Highest-demand market for vintage and antique items.",
  };
}

/**
 * Estimate shipping cost based on distance (simplified).
 * In production, use Shippo/USPS API for real rates.
 */
export function estimateShippingCost(
  sellerZip: string | null,
  buyerZip: string | null,
  weightLbs?: number
): number {
  // Default weight: 5 lbs (realistic for average resale item)
  const weight = weightLbs ?? 5;

  if (!sellerZip || !buyerZip) return 10 + weight * 0.4;

  // Heavy items — realistic cost tiers
  if (weight > 70) {
    // LTL/freight territory
    return 100 + weight * 1.2;
  } else if (weight > 30) {
    // Heavy parcel — UPS/FedEx ground
    return 15 + weight * 0.8;
  }

  // Standard parcel
  if (sellerZip[0] === buyerZip[0]) return 8 + weight * 0.3;
  return 12 + weight * 0.5;
}

/**
 * Calculate location-adjusted prices for an item.
 * Returns local, national, and best-market prices.
 */
export function getLocationPrices(
  baseLow: number,
  baseHigh: number,
  sellerZip: string | null | undefined,
): {
  local: { low: number; high: number; label: string; note: string };
  national: { low: number; high: number };
  bestMarket: { low: number; high: number; label: string; shippingCost: number; netLow: number; netHigh: number };
} {
  const sellerMarket = getMarketInfo(sellerZip);
  const bestMarket = getBestMarket();
  const shippingCost = estimateShippingCost(sellerZip ?? null, "100", 12);

  return {
    local: {
      low: Math.round(baseLow * sellerMarket.multiplier),
      high: Math.round(baseHigh * sellerMarket.multiplier),
      label: sellerMarket.label,
      note: sellerMarket.demandNote,
    },
    national: {
      low: Math.round(baseLow),
      high: Math.round(baseHigh),
    },
    bestMarket: {
      low: Math.round(baseLow * bestMarket.multiplier),
      high: Math.round(baseHigh * bestMarket.multiplier),
      label: bestMarket.label,
      shippingCost,
      netLow: Math.round(baseLow * bestMarket.multiplier - shippingCost),
      netHigh: Math.round(baseHigh * bestMarket.multiplier - shippingCost),
    },
  };
}
