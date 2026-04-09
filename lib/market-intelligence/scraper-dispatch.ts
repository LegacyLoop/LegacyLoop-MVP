/**
 * CMD-FLAG-CLEANUP-FINAL (FLAG-SB-3): Cache-first dispatcher for
 * specialty scrapers. Wraps PriceCharting, PSACard, Beckett, and
 * TCGPlayer with ScraperComp knowledge graph cache-first lookup.
 *
 * Pattern mirrors aggregator.ts cache-first dispatch:
 *   1. Check ScraperComp cache for fresh comps matching query + platform
 *   2. If cache hit (>= minResults fresh comps) → return cached data at $0
 *   3. If cache miss → call live scraper → persist results to ScraperComp
 *   4. Log cache hit/miss to usage logger for ops visibility
 *
 * This means: re-scanning the same collectible item = $0 for specialty
 * scraper calls instead of full Apify cost each time.
 *
 * Usage: import { cachedPriceCharting, cachedPsaCard, cachedBeckett,
 *   cachedTcgPlayer } from "@/lib/market-intelligence/scraper-dispatch";
 *
 * Drop-in replacement for direct scraper imports in collectiblesbot route.
 */

import type { ScraperResult, MarketComp } from "./types";
import { queryEnrichmentCache } from "./enrichment-cache";
import { persistEnrichmentComps } from "./enrichment-writer";
import { scrapePriceCharting } from "./adapters/pricecharting";
import { scrapePsaCard } from "./adapters/psacard";
import { scrapeBeckettHtml } from "./adapters/beckett";
import { scrapeTcgPlayer } from "./adapters/tcgplayer";

// ─── Cache-first wrapper ────────────────────────────────────────────

interface CachedScrapeOpts {
  query: string;
  platform: string;
  category?: string;
  /** Minimum cached comps for a cache hit. Default 3 (lower than
   *  aggregator's 5 because specialty scrapers return fewer results). */
  minResults?: number;
  /** Bot name for enrichment writer attribution. */
  contributorBot?: string;
}

async function cachedScrape(
  opts: CachedScrapeOpts,
  liveScraper: () => Promise<ScraperResult>,
): Promise<ScraperResult & { cacheHit: boolean }> {
  const { query, platform, category, minResults = 3, contributorBot = "collectiblesbot" } = opts;

  // Step 1: cache-first lookup
  const keywords = query
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .split(/\s+/)
    .filter((w) => w.length >= 3)
    .slice(0, 5);

  try {
    const cacheResult = await queryEnrichmentCache({
      category: category || undefined,
      keywords,
      platform,
      minResults,
    });

    if (cacheResult.hit) {
      // Map ScraperComp rows back to MarketComp shape
      const comps: MarketComp[] = cacheResult.comps.map((c) => ({
        item: c.title,
        price: c.priceUsd ?? c.soldPrice ?? 0,
        date: c.lastSeenAt.toISOString().slice(0, 10),
        platform: c.sourcePlatform,
        condition: c.condition || "Cached",
        url: c.sourceUrl || undefined,
      }));

      console.log(
        `[scraper-dispatch] ${platform} CACHE HIT — ${comps.length} comps for "${query.slice(0, 40)}" ($0 cost)`,
      );

      return { success: true, comps, source: platform, cacheHit: true };
    }
  } catch {
    // Fail-open: cache errors don't block live scrape
  }

  // Step 2: cache miss → call live scraper
  const liveResult = await liveScraper();

  // Step 3: persist successful results to ScraperComp for future cache hits
  if (liveResult.success && liveResult.comps.length > 0) {
    try {
      const enrichmentComps = liveResult.comps.map((c) => ({
        slug: `${platform.toLowerCase()}-${c.item.toLowerCase().replace(/[^a-z0-9]/g, "-").slice(0, 60)}`,
        title: c.item,
        priceUsd: c.price,
        sourcePlatform: platform,
        sourceUrl: c.url || null,
        category: category || "Collectibles",
        condition: c.condition || null,
        contributingBot: contributorBot,
      }));
      void persistEnrichmentComps(enrichmentComps);
      console.log(
        `[scraper-dispatch] ${platform} persisted ${liveResult.comps.length} comps to ScraperComp cache`,
      );
    } catch {
      // Persist failure is non-critical
    }
  }

  console.log(
    `[scraper-dispatch] ${platform} CACHE MISS — live scrape returned ${liveResult.comps.length} comps`,
  );

  return { ...liveResult, cacheHit: false };
}

// ─── Exported cache-first wrappers ──────────────────────────────────

export async function cachedPriceCharting(
  query: string,
  broadCategory: string = "all",
  category?: string,
): Promise<ScraperResult & { cacheHit: boolean }> {
  return cachedScrape(
    { query, platform: "PriceCharting", category },
    () => scrapePriceCharting(query, broadCategory),
  );
}

export async function cachedPsaCard(
  query: string,
  category?: string,
): Promise<ScraperResult & { cacheHit: boolean }> {
  return cachedScrape(
    { query, platform: "PSAcard", category },
    () => scrapePsaCard(query),
  );
}

export async function cachedBeckett(
  query: string,
  category?: string,
): Promise<ScraperResult & { cacheHit: boolean }> {
  return cachedScrape(
    { query, platform: "Beckett", category },
    () => scrapeBeckettHtml(query),
  );
}

export async function cachedTcgPlayer(
  query: string,
  category?: string,
): Promise<ScraperResult & { cacheHit: boolean }> {
  return cachedScrape(
    { query, platform: "TCGPlayer", category },
    () => scrapeTcgPlayer(query),
  );
}
