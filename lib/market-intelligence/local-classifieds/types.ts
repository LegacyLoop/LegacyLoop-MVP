/**
 * Local Classifieds Intelligence Network — Types
 * CMD-LOCAL-CLASSIFIEDS-FRAMEWORK (Phase 1 scaffold)
 *
 * Feature-flagged OFF (LOCAL_CLASSIFIEDS_ENABLED !== "true").
 * Pure dead code until CMD-UNCLE-HENRYS-ADAPTER wires a registered
 * adapter and written ToU permission arrives.
 */

// ─── Source identity ─────────────────────────────────────────────────────

export type LocalSourceSlug =
  | "uncle_henrys"          // Maine, NH, VT, MA (56 years)
  | "thrifty_nickel"        // Multi-state TX/CO/IL/KY/etc. (44 years)
  | "penny_saver"           // NJ/NY/PA variants
  | "bargain_finder"        // IN/IL
  | "nickels_worth"         // MT/ID/WA
  | "giant_nickel"          // Pacific NW
  | "the_exchange"          // Eastern WA / North ID
  | "recycler"              // National network (70+ pubs)
  | "craigslist"            // Every metro
  | "facebook_marketplace"  // Every metro (adapter deferred)
  | "offerup"               // National
  | "nextdoor";             // Neighborhood-level

export type USState =
  | "AL" | "AK" | "AZ" | "AR" | "CA" | "CO" | "CT" | "DE" | "FL" | "GA"
  | "HI" | "ID" | "IL" | "IN" | "IA" | "KS" | "KY" | "LA" | "ME" | "MD"
  | "MA" | "MI" | "MN" | "MS" | "MO" | "MT" | "NE" | "NV" | "NH" | "NJ"
  | "NM" | "NY" | "NC" | "ND" | "OH" | "OK" | "OR" | "PA" | "RI" | "SC"
  | "SD" | "TN" | "TX" | "UT" | "VT" | "VA" | "WA" | "WV" | "WI" | "WY";

// ─── Normalized 10-key category taxonomy ─────────────────────────────────
// Aligned with lib/pricing/constants.ts CATEGORY_WEIGHT_PROFILES (SSOT).
// Keys intentionally match PricingCategory so future wiring into
// market_comps_median reconciliation is trivial.

export type CategoryNormalized =
  | "musical_instruments"
  | "antiques_art"
  | "electronics_commodity"
  | "power_equipment"
  | "jewelry_watches"
  | "collectibles_graded"
  | "furniture_home"
  | "tools"
  | "clothing_soft"
  | "default";

// ─── Unified listing schema ──────────────────────────────────────────────

export interface LocalListing {
  source: LocalSourceSlug;
  sourceListingId: string;        // opaque id from the source
  title: string;
  description: string;
  categoryNormalized: CategoryNormalized;
  categoryRaw: string;             // verbatim label from source
  price: number | null;            // USD; null for free/swap
  priceModifier: string | null;    // "OBO", "Each", etc.
  currency: "USD";
  location: {
    city: string | null;
    state: USState | null;
    zip: string | null;
  };
  geo: { lat: number; lng: number } | null;
  datePosted: Date;
  photos: string[];                // absolute URLs
  sellerType: "individual" | "business" | "unknown";
  url: string;                     // canonical listing URL
  scrapedAt: Date;
}

// ─── Adapter contract ────────────────────────────────────────────────────

export interface LocalSourceQuery {
  itemName: string;
  category: CategoryNormalized;
  sellerZip?: string | null;
  limit?: number;                  // soft cap, default 20
  sinceUnix?: number;              // polling delta; 0 = most-recent window
}

export interface LocalSourceResult {
  success: boolean;
  listings: LocalListing[];
  source: LocalSourceSlug;
  sourceDisplayName: string;
  queriedAt: Date;
  durationMs: number;
  error?: string | null;
  metadata?: {
    requestCount?: number;
    cacheHit?: boolean;
    rateLimited?: boolean;
  };
}

export interface LocalSourceAdapter {
  slug: LocalSourceSlug;
  displayName: string;
  coversStates: USState[];
  active: boolean;
  fetch(query: LocalSourceQuery): Promise<LocalSourceResult>;
}

// ─── Aggregate result from framework.fanOut() ────────────────────────────

export interface LocalClassifiedsResult {
  listings: LocalListing[];
  sources: LocalSourceSlug[];           // sources that returned data
  queriedSources: LocalSourceSlug[];    // sources attempted (includes failures)
  totalDurationMs: number;
  errors: Array<{ source: LocalSourceSlug; error: string }>;
}
