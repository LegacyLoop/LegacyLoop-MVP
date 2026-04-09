/**
 * SCRAPER DISPATCH MAP — SLUG TO FUNCTION ROUTER
 *
 * Maps every ACTIVE registry slug with a real adapter file to its
 * concrete dispatcher function. The allowlist-driven aggregator
 * path (added by CMD-SCRAPER-WIRING-C1) uses this map to fire
 * exactly the scrapers each bot is permitted to call.
 *
 * SPECIAL CASE — eBay Browse API
 *   The "builtin/ebay-browse-api" slug is NOT in this map.
 *   It lives inline in aggregator.ts as runEbayBrowseApi()
 *   because it touches the eBay rate-limit helper and the
 *   ebayCompToMarketComp shim. The aggregator's new path
 *   checks for that slug explicitly before consulting the map.
 *
 * CMD-SCRAPER-CUSTOM-SCRAPERS (2026-04-08) — closed C1's gaps:
 *
 *   ✓ trudax/reddit-scraper-lite          SWAPPED in allowlists
 *                                          → "builtin/reddit-builtin-html"
 *                                          (BuyerBot + ListBot now use the
 *                                          free old.reddit.com HTML scraper)
 *   ✓ streamers/youtube-scraper           youtube.ts REWRITTEN to use the
 *                                          free YouTube Data API v3
 *   ✓ fatihtahta/pinterest-scraper-search SHIM (silent until APIFY_TASK_*
 *                                          provisioned)
 *   ✓ apidojo/tweet-scraper               SHIM (silent)
 *   ✓ apify/facebook-groups-scraper       SHIM (silent)
 *   ✓ apify/facebook-pages-scraper        SHIM (silent)
 *   ✓ saswave/facebook-ads-library-scraper status="maintenance" — filter
 *                                          drops it before dispatch lookup,
 *                                          no shim needed
 *   ✓ ivanvs/craigslist-scraper-pay-per-result  craigslist-ppr.ts BUILT
 *                                          (free multi-region NE scrape)
 *   ✓ ivanvs/liveauctioneers-scraper      DEFERRED — builtin/
 *                                          liveauctioneers-html covers it
 *
 * Net effect: dispatch map grew from 16 → 23 entries; the
 * module-load missing-slug warning is reduced to 1 remaining
 * gap: clockworks/tiktok-scraper (no adapter file exists yet,
 * referenced by VideoBot's allowlist). The deferred + maintenance
 * registry entries are filtered out by the loop's status check.
 * A future round must either add a clockworks adapter file or
 * demote the registry entry.
 *
 * SHIM PATTERN (5 entries: pinterest, twitter, fb-groups, fb-pages,
 * + reddit-builtin which has its own shape):
 *   Each shim awaits the existing adapter's custom return shape
 *   and maps it into a ScraperResult with empty comps[]. Demand
 *   signals (views, saves, engagement, WTB markers) are dropped
 *   today because MarketIntelligence has no demandSignal field
 *   yet — Round CEILINGS-D or a future round can add one.
 *
 * Updated: 2026-04-08
 * Author: Ryan Hallee
 */

import type { ScraperResult } from "./types";
import { SCRAPER_REGISTRY, getScraperEntry } from "./scraper-tiers";

// Built-in free adapters (real files, ScraperResult return)
import { scrapeRubyLane } from "./adapters/ruby-lane";
import { scrapeInvaluable } from "./adapters/invaluable";
import { scrapeFirstDibs } from "./adapters/firstdibs";
import { scrapeShopGoodwill } from "./adapters/shop-goodwill";
import { scrapeLiveAuctioneers } from "./adapters/live-auctioneers";
import { scrapeCraigslist } from "./adapters/craigslist";

// Paid Apify adapters with real files (ScraperResult return)
import { scrapeEbayApify } from "./adapters/ebay-apify";
import { scrapeGoogleShopping } from "./adapters/google-shopping";
import { scrapeChrono24 } from "./adapters/chrono24";
import { scrapeStockX } from "./adapters/stockx";
import { scrapeCarsCom } from "./adapters/cars-com";
import { scrapeCourtyard } from "./adapters/courtyard";
import { scrapeTcgplayerApify } from "./adapters/tcgplayer-apify";
import { scrapeFacebookMarketplace } from "./adapters/facebook-marketplace";
import { scrapeAmazonApify } from "./adapters/amazon-apify";
import { scrapeBringATrailer } from "./adapters/bat-auctions";

// CMD-SCRAPER-CUSTOM-SCRAPERS: free + shim wiring for the 7 gaps
// from C1. Each shim awaits the existing custom-typed adapter and
// returns a ScraperResult with empty comps (the demand-signal data
// is dropped until MarketIntelligence learns to surface it).
import { scrapeRedditBuiltin } from "./adapters/reddit-builtin";
import { scrapeYoutubeAsScraperResult } from "./adapters/youtube";
import { scrapePinterest } from "./adapters/pinterest";
import { scrapeTwitter } from "./adapters/twitter-x";
import { scrapeFacebookGroups } from "./adapters/facebook-groups";
import { scrapeFacebookPages } from "./adapters/facebook-pages";
import { scrapeCraigslistPpr } from "./adapters/craigslist-ppr";
// CMD-NETWORK-AUDIT-FIX: wire Beckett HTML (free Tier 1, created in CMD-COLLECTIBLESBOT-CORE-A)
import { scrapeBeckettHtml } from "./adapters/beckett";

/** Dispatch context passed to every adapter call in the new path. */
export interface ScraperDispatchContext {
  itemName: string;
  category: string;
  sellerZip?: string;
}

/** Uniform dispatch signature. */
export type ScraperDispatchFn = (
  ctx: ScraperDispatchContext,
) => Promise<ScraperResult>;

/**
 * Canonical slug → dispatch function map.
 * "builtin/ebay-browse-api" is intentionally absent (special case).
 */
export const SCRAPER_DISPATCH_MAP: Record<string, ScraperDispatchFn> = {
  // Tier 1 built-in free adapters
  "builtin/ruby-lane-html": ({ itemName }) => scrapeRubyLane(itemName),
  "builtin/invaluable-html": ({ itemName }) => scrapeInvaluable(itemName),
  "builtin/firstdibs-html": ({ itemName }) => scrapeFirstDibs(itemName),
  "builtin/shopgoodwill-html": ({ itemName }) => scrapeShopGoodwill(itemName),
  "builtin/liveauctioneers-html": ({ itemName }) =>
    scrapeLiveAuctioneers(itemName),
  "builtin/craigslist-html": ({ itemName, sellerZip }) =>
    scrapeCraigslist(itemName, sellerZip),

  // Tier 2 cheap Apify adapters (real files)
  "fatihtahta/cars-com-scraper": ({ itemName, sellerZip }) =>
    scrapeCarsCom(itemName, sellerZip),
  "misterkhan/chrono24-search-scraper": ({ itemName }) =>
    scrapeChrono24(itemName),
  "damilo/google-shopping-apify": ({ itemName }) =>
    scrapeGoogleShopping(itemName),
  "devcake/courtyard-io-scraper": ({ itemName }) => scrapeCourtyard(itemName),
  "ivanvs/ebay-scraper-pay-per-result": ({ itemName }) =>
    scrapeEbayApify(itemName),
  "devcake/tcgplayer-data-scraper": ({ itemName }) =>
    scrapeTcgplayerApify(itemName),
  "piotrv1001/stockx-listings-scraper": ({ itemName }) =>
    scrapeStockX(itemName),

  // Tier 3 mid Apify adapters (MegaBot only)
  "apify/facebook-marketplace-scraper": ({ itemName, sellerZip }) =>
    scrapeFacebookMarketplace(itemName, sellerZip),
  "logical_scrapers/amazon-product-scraper": ({ itemName }) =>
    scrapeAmazonApify(itemName),
  "parseforge/bringatrailer-auctions-scraper": ({ itemName }) =>
    scrapeBringATrailer(itemName),

  // CMD-SCRAPER-CUSTOM-SCRAPERS — free + shim entries
  // (close the 7 gaps surfaced by C1's recon)
  "builtin/reddit-builtin-html": async ({ itemName }) => {
    const raw = await scrapeRedditBuiltin(itemName);
    return { success: raw.success, comps: [], source: "Reddit (built-in)" };
  },
  "streamers/youtube-scraper": ({ itemName }) =>
    scrapeYoutubeAsScraperResult(itemName),
  "fatihtahta/pinterest-scraper-search": async ({ itemName }) => {
    const raw = await scrapePinterest(itemName);
    return { success: raw.success, comps: [], source: "Pinterest" };
  },
  "apidojo/tweet-scraper": async ({ itemName }) => {
    const raw = await scrapeTwitter(itemName);
    return { success: raw.success, comps: [], source: "Twitter/X" };
  },
  "apify/facebook-groups-scraper": async ({ itemName }) => {
    const raw = await scrapeFacebookGroups(itemName);
    return { success: raw.success, comps: [], source: "Facebook Groups" };
  },
  "apify/facebook-pages-scraper": async ({ itemName }) => {
    const raw = await scrapeFacebookPages(itemName);
    return { success: raw.success, comps: [], source: "Facebook Pages" };
  },
  "ivanvs/craigslist-scraper-pay-per-result": ({ itemName, sellerZip }) =>
    scrapeCraigslistPpr(itemName, sellerZip),

  // CMD-NETWORK-AUDIT-FIX: Beckett free HTML scraper (Tier 1 builtin)
  "builtin/beckett-html": ({ itemName }) => scrapeBeckettHtml(itemName),
};

/** Look up a dispatch function by slug. Undefined = no adapter. */
export function getAdapterForSlug(
  slug: string,
): ScraperDispatchFn | undefined {
  return SCRAPER_DISPATCH_MAP[slug];
}

// Module-load invariant check: warn once about any active
// registry slug that has no dispatch entry (excluding the
// eBay Browse API special case).
{
  const EBAY_SPECIAL_CASE = "builtin/ebay-browse-api";
  const missing: string[] = [];
  for (const entry of SCRAPER_REGISTRY) {
    if (entry.status !== "active") continue;
    if (entry.slug === EBAY_SPECIAL_CASE) continue;
    if (!SCRAPER_DISPATCH_MAP[entry.slug]) missing.push(entry.slug);
  }
  if (missing.length > 0) {
    console.warn(
      "[scraper-dispatch-map] Active registry slugs with no adapter:",
      missing,
      "— Round CUSTOM-SCRAPERS will build the 4 must-have replacements",
    );
  }
}

/** Stats for future /admin dashboard surfacing. */
export const DISPATCH_MAP_STATS = {
  totalEntries: Object.keys(SCRAPER_DISPATCH_MAP).length,
  builtinEntries: Object.keys(SCRAPER_DISPATCH_MAP).filter((s) =>
    s.startsWith("builtin/"),
  ).length,
  apifyEntries: Object.keys(SCRAPER_DISPATCH_MAP).filter(
    (s) => !s.startsWith("builtin/"),
  ).length,
  get missingActiveSlugs(): string[] {
    const EBAY_SPECIAL_CASE = "builtin/ebay-browse-api";
    return SCRAPER_REGISTRY.filter(
      (e) =>
        e.status === "active" &&
        e.slug !== EBAY_SPECIAL_CASE &&
        !SCRAPER_DISPATCH_MAP[e.slug],
    ).map((e) => e.slug);
  },
};

export { getScraperEntry };
