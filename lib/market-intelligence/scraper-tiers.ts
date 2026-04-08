/**
 * SCRAPER TIER REGISTRY — SINGLE SOURCE OF TRUTH
 *
 * Every active Apify actor and built-in scraper available to
 * LegacyLoop's market intelligence layer is cataloged here with
 * its tier, cost, and operational status.
 *
 * Tiers (locked by CMD-SCRAPER-TIERS-B):
 *   Tier 1 — FREE built-ins (always run on every scan)
 *   Tier 2 — CHEAP Apify (under $5/1k, runs on Normal scans)
 *   Tier 3 — MID Apify ($5-15/1k, runs on MegaBot scans only)
 *   Tier 4 — RESTRICTED (opt-in credit gate, never auto)
 *   Tier 5 — AI GENERATORS (PhotoBot/VideoBot only, explicit
 *            credit gate, currently blocked at killswitch)
 *
 * Blocked actors (12) live in blocked-actors.ts and are NOT in
 * this registry. The runtime invariant check below logs an error
 * if any blocked slug accidentally lands here.
 *
 * MegaBot inheritance rule:
 *   A bot's MegaBot variant inherits everything its Normal scan
 *   pulled (Tier 1 + Tier 2). The MegaBot allowlist is ADDITIVE
 *   and lists ONLY Tier 3 add-ons. No double-pulls.
 *
 * Updated: 2026-04-07
 * Author: Ryan Hallee
 */

import { BLOCKED_SLUGS } from "./blocked-actors";

export type ScraperTier = 1 | 2 | 3 | 4 | 5;

export type ScraperStatus = "active" | "maintenance" | "deferred";

export interface ScraperRegistryEntry {
  /**
   * Stable slug used by per-bot allowlists. For built-in scrapers,
   * use a "builtin/" prefix (e.g., "builtin/ruby-lane-html"). For
   * Apify actors, use the exact Apify slug (e.g., "apify/facebook-
   * marketplace-scraper" or "ivanvs/ebay-scraper-pay-per-result").
   */
  slug: string;

  displayName: string;

  tier: ScraperTier;

  /** Per-1,000-results cost in USD. Use 0 for free built-ins. */
  costPer1k: number;

  /**
   * Estimated cost per single scrape call assuming default
   * result limit (used by Round D ceiling math).
   */
  estimatedCostPerCall: number;

  /**
   * "active"      — fires when allowlisted
   * "maintenance" — registered but skipped at dispatch
   * "deferred"    — wired in code but disabled until a future round
   */
  status: ScraperStatus;

  /**
   * Whether this entry is a built-in HTML/API scraper (free) or
   * an Apify actor (paid).
   */
  source: "builtin" | "apify";

  /** Free-text note explaining what this scraper is good for. */
  note: string;
}

// ─── TIER 1 — FREE built-ins (always run) ───
const TIER_1_BUILTINS: ScraperRegistryEntry[] = [
  {
    slug: "builtin/ebay-browse-api",
    displayName: "eBay Browse API",
    tier: 1,
    costPer1k: 0,
    estimatedCostPerCall: 0,
    status: "active",
    source: "builtin",
    note: "Free under 5k requests/day. Primary live + sold comp source.",
  },
  {
    slug: "builtin/ruby-lane-html",
    displayName: "Ruby Lane (HTML)",
    tier: 1,
    costPer1k: 0,
    estimatedCostPerCall: 0,
    status: "active",
    source: "builtin",
    note: "Antique sold listings via direct HTML scrape.",
  },
  {
    slug: "builtin/invaluable-html",
    displayName: "Invaluable (HTML)",
    tier: 1,
    costPer1k: 0,
    estimatedCostPerCall: 0,
    status: "active",
    source: "builtin",
    note: "Auction house aggregator. Added by CMD-ANTIQUEBOT-CORE-A.",
  },
  {
    slug: "builtin/firstdibs-html",
    displayName: "1stDibs (HTML)",
    tier: 1,
    costPer1k: 0,
    estimatedCostPerCall: 0,
    status: "active",
    source: "builtin",
    note: "High-end antique + design marketplace. Added by CMD-ANTIQUEBOT-CORE-A.",
  },
  {
    slug: "builtin/shopgoodwill-html",
    displayName: "ShopGoodwill (HTML)",
    tier: 1,
    costPer1k: 0,
    estimatedCostPerCall: 0,
    status: "active",
    source: "builtin",
    note: "Free Goodwill auction platform. Strong sleeper-find signal.",
  },
  {
    slug: "builtin/liveauctioneers-html",
    displayName: "LiveAuctioneers (HTML)",
    tier: 1,
    costPer1k: 0,
    estimatedCostPerCall: 0,
    status: "active",
    source: "builtin",
    note: "Live auction aggregator. Free HTML scrape variant.",
  },
  {
    slug: "builtin/craigslist-html",
    displayName: "Craigslist (HTML)",
    tier: 1,
    costPer1k: 0,
    estimatedCostPerCall: 0,
    status: "active",
    source: "builtin",
    note: "Local resale signal. Free HTML scrape variant.",
  },
  {
    slug: "builtin/reddit-builtin-html",
    displayName: "Reddit (built-in HTML)",
    tier: 1,
    costPer1k: 0,
    estimatedCostPerCall: 0,
    status: "active",
    source: "builtin",
    note: "Free old.reddit.com HTML scraper. Buyer-intent WTB signal for BuyerBot + ListBot. Added by CMD-SCRAPER-CUSTOM-SCRAPERS to replace the paid Apify version.",
  },
];

// ─── TIER 2 — CHEAP Apify (under $5/1k, Normal scans) ───
const TIER_2_CHEAP_APIFY: ScraperRegistryEntry[] = [
  {
    slug: "apidojo/tweet-scraper",
    displayName: "Tweet Scraper V2 (X / Twitter)",
    tier: 2,
    costPer1k: 0.4,
    estimatedCostPerCall: 0.0004,
    status: "active",
    source: "apify",
    note: "Cheapest Apify actor in the stack. Trend + buyer signal.",
  },
  {
    slug: "piotrv1001/stockx-listings-scraper",
    displayName: "StockX Listings Scraper",
    tier: 2,
    costPer1k: 1.0,
    estimatedCostPerCall: 0.001,
    status: "maintenance",
    source: "apify",
    note: "Sneaker comp data. UNDER MAINTENANCE — dispatch will skip.",
  },
  {
    slug: "fatihtahta/cars-com-scraper",
    displayName: "Cars.com Scraper",
    tier: 2,
    costPer1k: 2.99,
    estimatedCostPerCall: 0.003,
    status: "active",
    source: "apify",
    note: "CarBot primary scraper. Fast and reliable.",
  },
  {
    slug: "clockworks/tiktok-scraper",
    displayName: "TikTok Scraper",
    tier: 2,
    costPer1k: 3.0,
    estimatedCostPerCall: 0.003,
    status: "deferred",
    source: "apify",
    note: "DEFERRED by CMD-SCRAPER-WIRING-C2 — no adapter file exists in the codebase. VideoBot's allowlist can drop this slug when a real TikTok adapter ships (future round). Filtered out of dispatch by the allowlist status check until then.",
  },
  {
    slug: "streamers/youtube-scraper",
    displayName: "YouTube Scraper",
    tier: 2,
    costPer1k: 3.0,
    estimatedCostPerCall: 0.003,
    status: "active",
    source: "apify",
    note: "VideoBot research. Last run failed — flag for monitoring.",
  },
  {
    slug: "misterkhan/chrono24-search-scraper",
    displayName: "Chrono24 Listings Scraper",
    tier: 2,
    costPer1k: 3.0,
    estimatedCostPerCall: 0.003,
    status: "active",
    source: "apify",
    note: "Watch comp data for AntiqueBot + CollectiblesBot.",
  },
  {
    slug: "damilo/google-shopping-apify",
    displayName: "Google Shopping Scraper",
    tier: 2,
    costPer1k: 3.5,
    estimatedCostPerCall: 0.0035,
    status: "active",
    source: "apify",
    note: "Universal price discovery across retailers.",
  },
  {
    slug: "saswave/facebook-ads-library-scraper",
    displayName: "Facebook Ads Library Scraper",
    tier: 2,
    costPer1k: 3.5,
    estimatedCostPerCall: 0.0035,
    status: "maintenance",
    source: "apify",
    note: "BuyerBot competitive ad research. UNDER MAINTENANCE — dispatch will skip.",
  },
  {
    slug: "devcake/courtyard-io-scraper",
    displayName: "Courtyard.io Scraper",
    tier: 2,
    costPer1k: 3.67,
    estimatedCostPerCall: 0.0037,
    status: "active",
    source: "apify",
    note: "Sealed trading card vault platform. CollectiblesBot.",
  },
  {
    slug: "trudax/reddit-scraper-lite",
    displayName: "Reddit Scraper Lite",
    tier: 2,
    costPer1k: 3.8,
    estimatedCostPerCall: 0.0038,
    status: "deferred",
    source: "apify",
    note: "DEFERRED by CMD-SCRAPER-CUSTOM-SCRAPERS — replaced by free builtin/reddit-builtin-html (old.reddit.com HTML scraper). BuyerBot + ListBot allowlists swapped to the free built-in. Kept in registry as a fallback option in case the HTML scraper degrades.",
  },
  {
    slug: "fatihtahta/pinterest-scraper-search",
    displayName: "Pinterest Scraper",
    tier: 2,
    costPer1k: 3.99,
    estimatedCostPerCall: 0.004,
    status: "active",
    source: "apify",
    note: "Visual discovery. ListBot/BuyerBot/VideoBot trend research.",
  },
  {
    slug: "ivanvs/ebay-scraper-pay-per-result",
    displayName: "eBay Scraper (Pay Per Result)",
    tier: 2,
    costPer1k: 4.0,
    estimatedCostPerCall: 0.004,
    status: "active",
    source: "apify",
    note: "Backup eBay sold-comp source when Browse API rate-limits.",
  },
  {
    slug: "apify/facebook-groups-scraper",
    displayName: "Facebook Groups Scraper",
    tier: 2,
    costPer1k: 4.0,
    estimatedCostPerCall: 0.004,
    status: "active",
    source: "apify",
    note: "BuyerBot — find buyers in niche FB groups.",
  },
  {
    slug: "devcake/tcgplayer-data-scraper",
    displayName: "TCGplayer Data Scraper",
    tier: 2,
    costPer1k: 4.67,
    estimatedCostPerCall: 0.0047,
    status: "active",
    source: "apify",
    note: "Trading card pricing for CollectiblesBot.",
  },
];

// ─── TIER 3 — MID Apify ($5-15/1k, MegaBot only) ───
const TIER_3_MID_APIFY: ScraperRegistryEntry[] = [
  {
    slug: "apify/facebook-marketplace-scraper",
    displayName: "Facebook Marketplace Scraper",
    tier: 3,
    costPer1k: 5.0,
    estimatedCostPerCall: 0.005,
    status: "active",
    source: "apify",
    note: "Local resale comp data. ListBot + BuyerBot + ReconBot MegaBot.",
  },
  {
    slug: "ivanvs/craigslist-scraper-pay-per-result",
    displayName: "Craigslist Scraper (Pay Per Result)",
    tier: 3,
    costPer1k: 8.0,
    estimatedCostPerCall: 0.008,
    status: "active",
    source: "apify",
    note: "Deep Craigslist scrape. ListBot/BuyerBot/Recon MegaBot.",
  },
  {
    slug: "logical_scrapers/amazon-product-scraper",
    displayName: "Amazon Product Scraper",
    tier: 3,
    costPer1k: 10.0,
    estimatedCostPerCall: 0.01,
    status: "active",
    source: "apify",
    note: "PriceBot + CollectiblesBot MegaBot — universal price reference.",
  },
  {
    slug: "apify/facebook-pages-scraper",
    displayName: "Facebook Pages Scraper",
    tier: 3,
    costPer1k: 10.0,
    estimatedCostPerCall: 0.01,
    status: "active",
    source: "apify",
    note: "BuyerBot + VideoBot MegaBot — competitor page intelligence.",
  },
  {
    slug: "ivanvs/liveauctioneers-scraper",
    displayName: "LiveAuctioneers Scraper (Apify)",
    tier: 3,
    costPer1k: 10.0,
    estimatedCostPerCall: 0.01,
    status: "deferred",
    source: "apify",
    note: "DEFERRED by CMD-SCRAPER-CUSTOM-SCRAPERS — the free builtin/liveauctioneers-html already covers this data. Kept in registry for completeness but never dispatched.",
  },
  {
    slug: "parseforge/bringatrailer-auctions-scraper",
    displayName: "Bring A Trailer Auctions Scraper",
    tier: 3,
    costPer1k: 13.33,
    estimatedCostPerCall: 0.0133,
    status: "active",
    source: "apify",
    note: "Premium motorcars + automobilia. AntiqueBot + CarBot MegaBot.",
  },
];

// ─── TIER 4 — RESTRICTED (opt-in credit gate) ───
// Currently empty. Reserved for future explicit-opt-in scrapers.
const TIER_4_RESTRICTED: ScraperRegistryEntry[] = [];

// ─── TIER 5 — AI GENERATORS (PhotoBot/VideoBot only) ───
// All Tier 5 actors are currently BLOCKED by Round A killswitch.
// They will be re-enabled in CMD-PHOTOBOT-MEGA / CMD-VIDEOBOT-MEGA
// via a separate code path with explicit credit gates.
const TIER_5_GENERATORS: ScraperRegistryEntry[] = [];

// ─── CANONICAL REGISTRY (ordered by tier, then cost) ───
export const SCRAPER_REGISTRY: ScraperRegistryEntry[] = [
  ...TIER_1_BUILTINS,
  ...TIER_2_CHEAP_APIFY,
  ...TIER_3_MID_APIFY,
  ...TIER_4_RESTRICTED,
  ...TIER_5_GENERATORS,
];

// ─── INVARIANT CHECK: no blocked slug allowed in registry ───
{
  const violations: string[] = [];
  for (const entry of SCRAPER_REGISTRY) {
    if (BLOCKED_SLUGS.has(entry.slug.toLowerCase())) {
      violations.push(entry.slug);
    }
  }
  if (violations.length > 0) {
    console.error(
      "[scraper-tiers] CRITICAL: blocked slugs found in registry:",
      violations
    );
  }
}

// ─── LOOKUP HELPERS ───
const REGISTRY_BY_SLUG = new Map<string, ScraperRegistryEntry>(
  SCRAPER_REGISTRY.map((e) => [e.slug.toLowerCase(), e])
);

export function getScraperEntry(
  slug: string
): ScraperRegistryEntry | undefined {
  return REGISTRY_BY_SLUG.get(slug.toLowerCase());
}

export function getScrapersByTier(tier: ScraperTier): ScraperRegistryEntry[] {
  return SCRAPER_REGISTRY.filter((e) => e.tier === tier);
}

export function isScraperActive(slug: string): boolean {
  const entry = getScraperEntry(slug);
  if (!entry) return false;
  return entry.status === "active";
}

export function getScraperCost(slug: string): number {
  return getScraperEntry(slug)?.estimatedCostPerCall ?? 0;
}

// ─── REGISTRY STATS (for telemetry + Round D ceilings) ───
export const REGISTRY_STATS = {
  totalEntries: SCRAPER_REGISTRY.length,
  tier1Count: TIER_1_BUILTINS.length,
  tier2Count: TIER_2_CHEAP_APIFY.length,
  tier3Count: TIER_3_MID_APIFY.length,
  tier4Count: TIER_4_RESTRICTED.length,
  tier5Count: TIER_5_GENERATORS.length,
  activeCount: SCRAPER_REGISTRY.filter((e) => e.status === "active").length,
  maintenanceCount: SCRAPER_REGISTRY.filter(
    (e) => e.status === "maintenance"
  ).length,
  deferredCount: SCRAPER_REGISTRY.filter((e) => e.status === "deferred").length,
};
