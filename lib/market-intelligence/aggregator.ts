import type { MarketIntelligence, ScraperResult, MarketComp } from "./types";
import { deduplicateComps } from "./scraper-base";
import { getApifyBudgetMode, isItemBudgetExceeded } from "./adapters/apify-client";
// CMD-SCRAPER-TIERS-B: aggregator-level killswitch interception.
// Imports the BLOCKED_SLUGS set so future dispatch loops can skip
// blocked adapters by slug. Also closes the gap from CMD-SCRAPER-
// KILLSWITCH-A for the 3 NOT_FOUND blocked actors (UGC video maker,
// voiceover, music factory) which have no in-file guard.
import { BLOCKED_SLUGS } from "./blocked-actors";
// CMD-SCRAPER-WIRING-C1: per-bot dispatch foundation
import {
  getResolvedScrapersForBot,
  type BotName,
} from "./bot-scraper-allowlist";
import {
  getAdapterForSlug,
  type ScraperDispatchContext,
} from "./scraper-dispatch-map";
// CMD-SCRAPER-CEILINGS-D1: fire-and-forget telemetry logger
import { logScraperUsage } from "./usage-logger";
// CMD-SCRAPER-CEILINGS-D2: hard cost ceiling enforcement
import { enforceCeilings } from "./cost-ceiling";
// CMD-SCRAPER-ENRICHMENT-E: persistent ScraperComp knowledge graph.
// queryEnrichmentCache powers cache-first dispatch (zero-cost cache
// hits before any paid scraper fires). persistEnrichmentComps writes
// every successful pull back to the graph so each scrape compounds.
import { queryEnrichmentCache } from "./enrichment-cache";
import { persistEnrichmentComps } from "./enrichment-writer";
import { prisma } from "@/lib/db";
// CMD-RECONBOT-API-B: Phase 0 eBay swap — real Browse API replaces
// the Phase 1 HTML scraper at line 93. Fallback to scrapeEbaySold
// when the rate-limit safety net trips or the Browse API errors.
import { searchEbayComps, getEbayRateLimits, type EbayComp } from "@/lib/adapters/ebay";
// Built-in scrapers (free, fast)
import { scrapeEbaySold } from "./adapters/ebay-sold";
import { scrapeTcgPlayer } from "./adapters/tcgplayer";
import { queryDiscogs } from "./adapters/discogs";
import { scrapeHeritage } from "./adapters/heritage-auctions";
import { scrapeCraigslist } from "./adapters/craigslist";
import { scrapeUncleHenrys } from "./adapters/uncle-henrys";
import { scrapeMercari } from "./adapters/mercari";
import { scrapeOfferUp } from "./adapters/offerup";
import { scrapePoshmark } from "./adapters/poshmark";
import { scrapeRubyLane } from "./adapters/ruby-lane";
import { scrapeReverb } from "./adapters/reverb";
import { scrapeShopGoodwill } from "./adapters/shop-goodwill";
import { scrapeLiveAuctioneers } from "./adapters/live-auctioneers";
// CMD-ANTIQUEBOT-CORE-A: 2 new FREE antique scrapers (no Apify cost)
import { scrapeInvaluable } from "./adapters/invaluable";
import { scrapeFirstDibs } from "./adapters/firstdibs";
import { scrapeCraigslistVehicles } from "./adapters/craigslist-vehicles";
import { scrapeCraigslistAntiques } from "./adapters/craigslist-antiques";
// Apify-powered scrapers (paid, reliable)
import { scrapeFacebookMarketplace } from "./adapters/facebook-marketplace";
import { scrapeEbayApify } from "./adapters/ebay-apify";
import { scrapeGoogleShopping } from "./adapters/google-shopping";
import { scrapeAmazonApify } from "./adapters/amazon-apify";
import { checkTikTokTrend } from "./adapters/tiktok-trends";
import { scrapeEbayMotors } from "./adapters/ebay-motors";
// CMD-SCRAPER-TIERS-B: scrapeAutoTrader, scrapeCarGurus, scrapeGoat,
// and scrapeSothebys imports REMOVED. These 4 adapters are on the
// hard block list (Round A) and were the only blocked actors the
// aggregator dispatched directly. Removing the imports + dispatch
// lines saves wasted function calls (Round A's in-file guards still
// protect them at the adapter level if anything else calls them).
import { scrapeCarsCom } from "./adapters/cars-com";
import { scrapeBringATrailer } from "./adapters/bat-auctions";
import { scrapeChrono24 } from "./adapters/chrono24";
import { scrapeStockX } from "./adapters/stockx";
import { scrapeTcgplayerApify } from "./adapters/tcgplayer-apify";
import { scrapeCourtyard } from "./adapters/courtyard";
import { scrapePriceCharting } from "./adapters/pricecharting";
import { scrapePsaCard } from "./adapters/psacard";

type ScraperFn = (query: string) => Promise<ScraperResult>;

const MAINE_ZIP_PREFIXES = new Set([
  "039", "040", "041", "042", "043", "044", "045", "046", "047", "048", "049",
]);

const CATEGORY_ADAPTER_MAP: Record<string, ScraperFn[]> = {
  "Sports Cards": [scrapeEbaySold, scrapeHeritage, scrapeTcgplayerApify, scrapeCourtyard, scrapePsaCard, (q) => scrapePriceCharting(q, "trading-cards")],
  "Trading Cards": [scrapeTcgPlayer, scrapeEbaySold, scrapeTcgplayerApify, scrapeCourtyard, scrapePsaCard, (q) => scrapePriceCharting(q, "trading-cards")],
  "Comics": [scrapeHeritage, scrapeEbaySold, (q) => scrapePriceCharting(q, "comics")],
  "Coins & Currency": [scrapeHeritage, scrapeEbaySold, (q) => scrapePriceCharting(q, "coins")],
  "Vinyl Records": [queryDiscogs, scrapeEbaySold],
  "Watches": [scrapeEbaySold, scrapeHeritage],
  "Sneakers": [scrapeEbaySold],
  "Rare Books": [scrapeHeritage, scrapeEbaySold],
  "Jewelry": [scrapeHeritage, scrapeEbaySold],
  "Memorabilia": [scrapeHeritage, scrapeEbaySold, scrapeCourtyard],
  "Vintage Toys": [scrapeEbaySold, scrapeHeritage],
  "Minerals": [scrapeHeritage, scrapeEbaySold],
  "Video Games": [scrapeEbaySold, (q) => scrapePriceCharting(q, "video-games")],
  "Funko": [scrapeEbaySold, (q) => scrapePriceCharting(q, "funko")],
};

// Result cache — 4h TTL
const resultCache = new Map<string, { result: MarketIntelligence; builtAt: number }>();
const RESULT_TTL = 4 * 60 * 60 * 1000;

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = Math.ceil(sorted.length * p) - 1;
  return sorted[Math.max(0, Math.min(idx, sorted.length - 1))];
}

// CMD-RECONBOT-API-B: shim — convert eBay Browse API EbayComp into
// the aggregator's standard MarketComp shape. Browse API returns
// active listings (no sold-date metadata), so date is synthesized
// to "now" and condition is fixed at "As Listed". URL is preserved
// for downstream attribution.
function ebayCompToMarketComp(c: EbayComp): MarketComp {
  return {
    item: c.title,
    price: c.price,
    date: new Date().toISOString(),
    platform: "eBay",
    condition: "As Listed",
    url: c.url,
    location: null,
  };
}

// CMD-SCRAPER-WIRING-C1: extracted from inline closure so the
// "builtin/ebay-browse-api" slug can be dispatched from the
// per-bot allowlist path. Function body is BYTE-IDENTICAL to
// the previous inline version.
async function runEbayBrowseApi(itemName: string): Promise<ScraperResult> {
  try {
    const limits = await getEbayRateLimits();
    if (limits.dailyLimitRemaining < 500) {
      console.warn(
        `[aggregator] eBay rate-limit safety net tripped (${limits.dailyLimitRemaining} remaining), falling back to scraper`,
      );
      return scrapeEbaySold(itemName);
    }
    const comps = await searchEbayComps(itemName, 8);
    return {
      success: true,
      comps: comps.map(ebayCompToMarketComp),
      source: "eBay",
    };
  } catch (err) {
    console.warn(
      "[aggregator] eBay Browse API failed, falling back to scraper:",
      err,
    );
    return scrapeEbaySold(itemName);
  }
}

export async function getMarketIntelligence(
  itemName: string,
  category: string,
  sellerZip?: string,
  phase1Only?: boolean,
  // CMD-ANTIQUEBOT-CORE-A: SCRAPER BUDGET DISCIPLINE.
  // When false (default), Phase 2 paid Apify scrapers are skipped
  // entirely — guarantees $0.00 Apify cost on every normal-path
  // bot scan. When true (MegaBot scans only), Phase 2 paid
  // scrapers may fire if the sufficiency check requires them.
  // Locked pattern for ALL bots going forward: any bot route
  // that wants paid scrapers MUST pass isMegaBot=true explicitly.
  isMegaBot?: boolean,
  // CMD-SCRAPER-WIRING-C1: when provided, aggregator uses the
  // allowlist-driven dispatch path (Phase 1 list built from
  // getResolvedScrapersForBot + SCRAPER_DISPATCH_MAP) instead
  // of category regex. All 15 existing callers omit this and
  // get the legacy path byte-identical.
  botName?: BotName,
  // CMD-SCRAPER-ENRICHMENT-E: optional itemId/userId attribution.
  // Closes the 3-round carry-forward by threading attribution all
  // the way to logScraperUsage + persistEnrichmentComps. Optional
  // with default {} so existing callers compile unchanged.
  attribution?: { itemId?: string | null; userId?: string | null },
  // CMD-SALE-METHOD-FOUNDATION: sale-method context. Threaded into
  // ScraperDispatchContext so local-classifieds adapters can geo-
  // filter by radius when seller opted LOCAL_PICKUP. Optional;
  // existing callers omitting these get the legacy path unchanged.
  saleMethod?: "LOCAL_PICKUP" | "ONLINE_SHIPPING" | "BOTH",
  saleRadiusMi?: number,
): Promise<MarketIntelligence> {
  const cacheKey = `${category.toLowerCase()}:${itemName.toLowerCase().slice(0, 80)}:${sellerZip || ""}`;
  const cached = resultCache.get(cacheKey);
  if (cached && Date.now() - cached.builtAt < RESULT_TTL) return cached.result;

  // ═══════════════════════════════════════════════════════════
  // CMD-SCRAPER-WIRING-C1: PER-BOT ALLOWLIST-DRIVEN DISPATCH
  // ═══════════════════════════════════════════════════════════
  // When botName is provided, the aggregator builds its Phase 1
  // adapter list exclusively from the bot's allowlist + the slug
  // dispatch map. Maintenance-flagged and blocked slugs are
  // skipped. MegaBot add-ons join only when isMegaBot === true.
  // This is the NEW canonical path — Round C2 flips all 10 bot
  // routes to use it.
  if (botName) {
    // ─── CMD-SCRAPER-ENRICHMENT-E: cache-first dispatch ───
    // Before resolving any allowlist or running any paid scraper,
    // check the persistent ScraperComp graph for fresh comps that
    // match this query. A hit serves every bot equally for $0.
    // Misses fall through to the live scraper dispatch below.
    const cacheKeywords = itemName
      .split(/\s+/)
      .filter((w: string) => w.length > 3)
      .slice(0, 5);
    const cacheResult = await queryEnrichmentCache({
      category: category ?? null,
      keywords: cacheKeywords,
      minResults: 5,
    });

    if (cacheResult.hit) {
      // Telemetry: log the cache hit as a distinct slug so /admin
      // can show cache hit rate alongside paid scraper spend.
      logScraperUsage({
        slug: "enrichment-cache",
        botName,
        tier: 0,
        cost: 0,
        success: true,
        blocked: false,
        compsReturned: cacheResult.comps.length,
        durationMs: 0,
        itemId: attribution?.itemId ?? null,
        userId: attribution?.userId ?? null,
      });

      // Fire-and-forget hit count increment so /admin can rank
      // most-reused comps. Errors swallowed to keep the read fast.
      prisma.scraperComp
        .updateMany({
          where: { id: { in: cacheResult.comps.map((c) => c.id) } },
          data: { hitCount: { increment: 1 } },
        })
        .catch(() => {});

      // Map ScraperComp rows back to MarketComp shape so the
      // result is byte-compatible with the live dispatch path.
      const mappedComps: MarketComp[] = cacheResult.comps.map((c) => ({
        item: c.title,
        price: c.priceUsd ?? c.soldPrice ?? 0,
        date: c.lastSeenAt.toISOString(),
        platform: c.sourcePlatform,
        condition: c.condition ?? "Unknown",
        url: c.sourceUrl ?? undefined,
        location: null,
      }));

      const cachePrices = mappedComps
        .map((c) => c.price)
        .filter((p) => p > 0)
        .sort((a, b) => a - b);
      const cacheMedian =
        cachePrices.length > 0
          ? cachePrices[Math.floor(cachePrices.length / 2)]
          : 0;
      const cacheLow = percentile(cachePrices, 0.25);
      const cacheHigh = percentile(cachePrices, 0.75);

      const cacheBotResult: MarketIntelligence = {
        comps: deduplicateComps(mappedComps).sort((a, b) =>
          a.date > b.date ? -1 : a.date < b.date ? 1 : 0,
        ),
        median: Math.round(cacheMedian),
        low: Math.round(cacheLow),
        high: Math.round(cacheHigh),
        trend: cachePrices.length > 0 ? "Stable" : "Unknown",
        confidence: Math.min(
          0.85,
          0.4 + mappedComps.length * 0.03 + cacheResult.contributingBots.length * 0.05,
        ),
        sources: ["enrichment-cache", ...cacheResult.contributingBots],
        queriedAt: new Date().toISOString(),
        compCount: mappedComps.length,
        tiktokDemand: null,
      };

      resultCache.set(cacheKey, { result: cacheBotResult, builtAt: Date.now() });
      console.log(
        `[market-intel] [${botName}] enrichment-cache HIT: ${mappedComps.length} comps, contributors=${cacheResult.contributingBots.join(",") || "—"}, $0 cost`,
      );
      return cacheBotResult;
    }

    const allowed = getResolvedScrapersForBot(botName, isMegaBot === true);

    const dispatchable = allowed.filter((entry) => {
      if (entry.status !== "active") {
        // CMD-SCRAPER-CEILINGS-D1: log non-active drops (defensive —
        // getResolvedScrapersForBot already filters, but we log here
        // for any future direct caller).
        // CMD-SCRAPER-ENRICHMENT-E: attribution threading
        logScraperUsage({
          botName,
          slug: entry.slug,
          tier: entry.tier,
          cost: 0,
          success: false,
          blocked: true,
          blockReason: entry.status,
          durationMs: 0,
          itemId: attribution?.itemId ?? null,
          userId: attribution?.userId ?? null,
        });
        return false;
      }
      if (BLOCKED_SLUGS.has(entry.slug.toLowerCase())) {
        console.warn(
          `[aggregator] [${botName}] slug ${entry.slug} is BLOCKED — skipped`,
        );
        // CMD-SCRAPER-CEILINGS-D1: killswitch drop
        // CMD-SCRAPER-ENRICHMENT-E: attribution threading
        logScraperUsage({
          botName,
          slug: entry.slug,
          tier: entry.tier,
          cost: 0,
          success: false,
          blocked: true,
          blockReason: "killswitch",
          durationMs: 0,
          itemId: attribution?.itemId ?? null,
          userId: attribution?.userId ?? null,
        });
        return false;
      }
      return true;
    });

    // CMD-SCRAPER-CEILINGS-D2: hard cost ceilings
    // Greedy cost-ascending enforcement keeps Tier 1 FREE always,
    // includes the cheapest paid adapters first, and drops the
    // rest with blockReason="ceiling". Tier 3 entries only fit
    // when isMegaBot === true.
    const ceilingResult = enforceCeilings(
      dispatchable,
      isMegaBot === true,
    );
    for (const drop of ceilingResult.dropped) {
      // CMD-SCRAPER-ENRICHMENT-E: attribution threading
      logScraperUsage({
        botName,
        slug: drop.entry.slug,
        tier: drop.entry.tier,
        cost: 0,
        success: false,
        blocked: true,
        blockReason: "ceiling",
        compsReturned: 0,
        durationMs: 0,
        itemId: attribution?.itemId ?? null,
        userId: attribution?.userId ?? null,
      });
    }
    console.log(
      `[aggregator] [${botName}] ceilings: ${ceilingResult.allowed.length} allowed, ${ceilingResult.dropped.length} dropped, projected $${ceilingResult.projectedCost.toFixed(4)}`,
    );
    const effectiveEntries = ceilingResult.allowed;

    const warnedMissing = new Set<string>();
    const botAdapters: Array<() => Promise<ScraperResult>> = [];
    const ctx: ScraperDispatchContext = { itemName, category, sellerZip, saleMethod, saleRadiusMi };

    for (const entry of effectiveEntries) {
      if (entry.slug === "builtin/ebay-browse-api") {
        // CMD-SCRAPER-CEILINGS-D1: wrap with timing + telemetry
        // CMD-SCRAPER-ENRICHMENT-E: attribution + persist on success
        botAdapters.push(async () => {
          const startMs = Date.now();
          try {
            const result = await runEbayBrowseApi(itemName);
            logScraperUsage({
              botName,
              slug: entry.slug,
              tier: entry.tier,
              cost: entry.estimatedCostPerCall ?? 0,
              success: result?.success ?? false,
              compsReturned: result?.comps?.length ?? 0,
              durationMs: Date.now() - startMs,
              itemId: attribution?.itemId ?? null,
              userId: attribution?.userId ?? null,
            });
            // Persist successful pulls into the enrichment graph
            if (result?.success && result.comps && result.comps.length > 0) {
              persistEnrichmentComps(
                result.comps.map((c) => ({
                  slug: entry.slug,
                  sourceUrl: c.url ?? null,
                  sourcePlatform: c.platform ?? "eBay",
                  title: c.item ?? "",
                  priceUsd: c.price ?? null,
                  soldPrice: null,
                  condition: c.condition ?? null,
                  category: category ?? null,
                  keywords: itemName
                    .split(/\s+/)
                    .filter((w: string) => w.length > 3)
                    .slice(0, 10),
                  contributingBot: botName,
                  sourceItemId: attribution?.itemId ?? null,
                  sourceUserId: attribution?.userId ?? null,
                })),
              ).catch(() => {});
            }
            return result;
          } catch (err) {
            logScraperUsage({
              botName,
              slug: entry.slug,
              tier: entry.tier,
              cost: 0,
              success: false,
              durationMs: Date.now() - startMs,
              itemId: attribution?.itemId ?? null,
              userId: attribution?.userId ?? null,
            });
            throw err;
          }
        });
        continue;
      }
      const fn = getAdapterForSlug(entry.slug);
      if (!fn) {
        if (!warnedMissing.has(entry.slug)) {
          console.warn(
            `[aggregator] [${botName}] no dispatch entry for ${entry.slug} — skipped (Round CUSTOM-SCRAPERS gap)`,
          );
          warnedMissing.add(entry.slug);
        }
        // CMD-SCRAPER-CEILINGS-D1: log every missing-slug skip
        // (not just the first) so D2 can ceiling-check accurately
        // and D3 can show the real attempt count in /admin.
        // CMD-SCRAPER-ENRICHMENT-E: attribution threading
        logScraperUsage({
          botName,
          slug: entry.slug,
          tier: entry.tier,
          cost: 0,
          success: false,
          blocked: true,
          blockReason: "missing",
          durationMs: 0,
          itemId: attribution?.itemId ?? null,
          userId: attribution?.userId ?? null,
        });
        continue;
      }
      // CMD-SCRAPER-CEILINGS-D1: wrap with timing + telemetry
      // CMD-SCRAPER-ENRICHMENT-E: attribution + persist on success
      botAdapters.push(async () => {
        const startMs = Date.now();
        try {
          const result = await fn(ctx);
          logScraperUsage({
            botName,
            slug: entry.slug,
            tier: entry.tier,
            cost: entry.estimatedCostPerCall ?? 0,
            success: result?.success ?? false,
            compsReturned: result?.comps?.length ?? 0,
            durationMs: Date.now() - startMs,
            itemId: attribution?.itemId ?? null,
            userId: attribution?.userId ?? null,
          });
          // Persist successful pulls into the enrichment graph
          if (result?.success && result.comps && result.comps.length > 0) {
            persistEnrichmentComps(
              result.comps.map((c) => ({
                slug: entry.slug,
                sourceUrl: c.url ?? null,
                sourcePlatform: c.platform ?? "unknown",
                title: c.item ?? "",
                priceUsd: c.price ?? null,
                soldPrice: null,
                condition: c.condition ?? null,
                category: category ?? null,
                keywords: itemName
                  .split(/\s+/)
                  .filter((w: string) => w.length > 3)
                  .slice(0, 10),
                contributingBot: botName,
                sourceItemId: attribution?.itemId ?? null,
                sourceUserId: attribution?.userId ?? null,
              })),
            ).catch(() => {});
          }
          return result;
        } catch (err) {
          logScraperUsage({
            botName,
            slug: entry.slug,
            tier: entry.tier,
            cost: 0,
            success: false,
            durationMs: Date.now() - startMs,
            itemId: attribution?.itemId ?? null,
            userId: attribution?.userId ?? null,
          });
          throw err;
        }
      });
    }

    console.log(
      `[market-intel] [${botName}] allowlist dispatch: ${botAdapters.length} adapters (${dispatchable.length} allowed, ${warnedMissing.size} missing, isMegaBot=${isMegaBot === true})`,
    );

    const botPhase1 = await Promise.allSettled(
      botAdapters.map((fn) => {
        const t = setTimeout(() => {}, 30000);
        return fn().finally(() => clearTimeout(t));
      }),
    );

    const botComps: MarketComp[] = [];
    const botSources: string[] = [];
    for (const result of botPhase1) {
      if (result.status === "fulfilled" && result.value.success) {
        botComps.push(...result.value.comps);
        if (!botSources.includes(result.value.source)) {
          botSources.push(result.value.source);
        }
      }
    }

    const botPrices = botComps
      .map((c) => c.price)
      .filter((p) => p > 0)
      .sort((a, b) => a - b);
    const botMedian =
      botPrices.length > 0
        ? botPrices[Math.floor(botPrices.length / 2)]
        : 0;
    const botLow = percentile(botPrices, 0.25);
    const botHigh = percentile(botPrices, 0.75);

    let botTrend: MarketIntelligence["trend"] = "Unknown";
    if (botPrices.length >= 6) {
      const sortedByDate = [...botComps].sort((a, b) =>
        a.date > b.date ? -1 : a.date < b.date ? 1 : 0,
      );
      const newestAvg =
        sortedByDate.slice(0, 3).reduce((s, c) => s + c.price, 0) / 3;
      const oldestAvg =
        sortedByDate.slice(-3).reduce((s, c) => s + c.price, 0) / 3;
      const change = (newestAvg - oldestAvg) / oldestAvg;
      botTrend =
        change > 0.1 ? "Rising" : change < -0.1 ? "Declining" : "Stable";
    } else if (botPrices.length > 0) {
      botTrend = "Stable";
    }

    const botConfidence = Math.min(
      0.95,
      0.3 + botComps.length * 0.05 + botSources.length * 0.05,
    );

    const botResult: MarketIntelligence = {
      comps: deduplicateComps(botComps).sort((a, b) =>
        a.date > b.date ? -1 : a.date < b.date ? 1 : 0,
      ),
      median: Math.round(botMedian),
      low: Math.round(botLow),
      high: Math.round(botHigh),
      trend: botTrend,
      confidence: botConfidence,
      sources: botSources,
      queriedAt: new Date().toISOString(),
      compCount: botComps.length,
      tiktokDemand: null,
    };

    resultCache.set(cacheKey, { result: botResult, builtAt: Date.now() });
    console.log(
      `[market-intel] [${botName}] allowlist result: ${botResult.comps.length} comps from ${botSources.join(", ")} (median $${botResult.median})`,
    );
    return botResult;
  }

  // Category-specific scrapers
  const categoryAdapters = CATEGORY_ADAPTER_MAP[category] || [];

  const SUBSCRIPTION_ACTORS_ENABLED = process.env.ENABLE_SUBSCRIPTION_SCRAPERS === "true";
  const isMaine = sellerZip && MAINE_ZIP_PREFIXES.has(sellerZip.slice(0, 3));
  const cat = (category || "").toLowerCase();

  // ═══ PHASE 1: FREE built-in + cheap essential Apify scrapers ═══
  const freeAdapters: Array<() => Promise<ScraperResult>> = [
    // CMD-SCRAPER-WIRING-C1: inline closure replaced with named
    // runEbayBrowseApi function so the "builtin/ebay-browse-api"
    // slug can also be dispatched from the per-bot allowlist path.
    () => runEbayBrowseApi(itemName),
    () => scrapeCraigslist(itemName, sellerZip),
    () => scrapeMercari(itemName),
    () => scrapeOfferUp(itemName, sellerZip),
    // Always-run Apify (cheap, critical data — ~$0.01 each)
    () => scrapeFacebookMarketplace(itemName, sellerZip),
    () => scrapeGoogleShopping(itemName),
  ];

  if (isMaine) freeAdapters.push(() => scrapeUncleHenrys(itemName));
  if (cat.match(/fashion|clothing|shoes|accessories|handbag|dress|jacket|coat|shirt|pants|jeans/)) freeAdapters.push(() => scrapePoshmark(itemName));
  if (cat.match(/antique|vintage|estate|furniture|silver|porcelain|glass|pottery|china|crystal/)) {
    freeAdapters.push(() => scrapeRubyLane(itemName));
    // CMD-ANTIQUEBOT-CORE-A: 2 new FREE antique sources alongside Ruby Lane.
    // Invaluable = auction house aggregator (Sotheby's, Christie's, Bonhams, etc).
    // 1stDibs = premium dealer marketplace (upper-bound retail data).
    // Both run on EVERY normal-path antique scan for ZERO Apify cost.
    freeAdapters.push(() => scrapeInvaluable(itemName));
    freeAdapters.push(() => scrapeFirstDibs(itemName));
  }
  if (cat.match(/music|instrument|guitar|pedal|amp|keyboard|drum|bass|synth|violin|trumpet|saxophone|piano|ukulele/)) freeAdapters.push(() => scrapeReverb(itemName));
  if (cat.match(/vehicle|automobile|car|truck|motorcycle|atv|boat|suv|van|rv|camper/)) freeAdapters.push(() => scrapeCraigslistVehicles(itemName, sellerZip));
  if (cat.match(/antique|vintage|estate|auction/)) {
    freeAdapters.push(() => scrapeShopGoodwill(itemName), () => scrapeLiveAuctioneers(itemName), () => scrapeCraigslistAntiques(itemName, sellerZip));
  }
  // PriceCharting — free built-in Beckett equivalent
  if (cat.match(/card|pokemon|magic|yugioh|tcg|trading|sports.?card/)) freeAdapters.push(() => scrapePriceCharting(itemName, "trading-cards"));
  if (cat.match(/video.?game|nintendo|playstation|xbox|sega|atari|gameboy/)) freeAdapters.push(() => scrapePriceCharting(itemName, "video-games"));
  if (cat.match(/comic|marvel|dc.?comics/)) freeAdapters.push(() => scrapePriceCharting(itemName, "comics"));
  if (cat.match(/funko|pop!/)) freeAdapters.push(() => scrapePriceCharting(itemName, "funko"));
  if (cat.match(/lego|building.?block/)) freeAdapters.push(() => scrapePriceCharting(itemName, "lego-sets"));
  if (cat.match(/coin|numismatic|currency|bullion/)) freeAdapters.push(() => scrapePriceCharting(itemName, "coins"));

  // Also add category-specific free scrapers from CATEGORY_ADAPTER_MAP
  const extraCatAdapters = categoryAdapters.filter(fn => {
    const n = fn.name;
    return !["scrapeEbaySold","scrapeCraigslist","scrapeMercari","scrapeOfferUp","scrapePoshmark","scrapeRubyLane","scrapeReverb","scrapeShopGoodwill","scrapeLiveAuctioneers","scrapeCraigslistVehicles","scrapeCraigslistAntiques","scrapePriceCharting","scrapeTcgPlayer","queryDiscogs","scrapeHeritage","scrapeUncleHenrys"].includes(n);
  });

  // Run Phase 1
  const phase1Settled = await Promise.allSettled(
    freeAdapters.map(fn => { const t = setTimeout(() => {}, 30000); return fn().finally(() => clearTimeout(t)); })
  );

  const allComps: MarketComp[] = [];
  const sources: string[] = [];

  for (const result of phase1Settled) {
    if (result.status === "fulfilled" && result.value.success) {
      allComps.push(...result.value.comps);
      if (!sources.includes(result.value.source)) sources.push(result.value.source);
    }
  }

  // ═══ SUFFICIENCY CHECK — Multi-factor decision for Phase 2 ═══
  const compCount = allComps.length;
  const sourceCount = sources.length;
  const phase1Prices = allComps.map(c => c.price).filter(p => p > 0).sort((a, b) => a - b);
  const estimatedValue = phase1Prices.length > 0 ? phase1Prices[Math.floor(phase1Prices.length / 2)] : 0;

  const budgetMode = getApifyBudgetMode();

  // In conservative mode, tighten Phase 2 triggers significantly
  const compThreshold = budgetMode === "conservative" ? 3 : 6;
  const sourceThreshold = budgetMode === "conservative" ? 2 : 3;
  const valueThreshold = budgetMode === "conservative" ? 500 : 200;

  // In conservative mode, only specialty-trigger on VERY specific categories (not broad regex)
  const conservativeSpecialtyRegex = /^(vehicle|automobile|car|truck|motorcycle|watch|rolex)$/i;
  const fullSpecialtyRegex = /vehicle|automobile|car|truck|motorcycle|watch|horol|timepiece|rolex|omega|sneaker|jordan|nike|yeezy|card|pokemon|magic|yugioh|tcg|trading|sports.?card|antique.*auction|estate.*sale|jewelry|gem|diamond|art|painting|sculpture|coin|numismatic|memorabilia|autograph/;
  const specialtyRegex = budgetMode === "conservative" ? conservativeSpecialtyRegex : fullSpecialtyRegex;
  const isSpecialtyCategoryForPhase2 = !!cat.match(specialtyRegex);

  const needsMoreData = compCount < compThreshold || sourceCount < sourceThreshold || isSpecialtyCategoryForPhase2 || (estimatedValue >= valueThreshold);
  const reason = compCount < compThreshold ? `only ${compCount} comps` : sourceCount < sourceThreshold ? `only ${sourceCount} sources` : isSpecialtyCategoryForPhase2 ? "specialty category" : estimatedValue >= valueThreshold ? `high value ($${Math.round(estimatedValue)})` : "sufficient";

  // Also check per-item budget
  const itemBudgetKey = `${itemName.slice(0, 40)}`;
  const itemBudgetBlocked = isItemBudgetExceeded(itemBudgetKey);

  console.log(`[market-intel] Phase 1: ${compCount} comps from ${sourceCount} sources (est. $${Math.round(estimatedValue)}) [${budgetMode} mode]${itemBudgetBlocked ? " — ITEM BUDGET EXCEEDED" : needsMoreData ? ` — Phase 2 needed: ${reason}` : " — sufficient, Phase 2 skipped"}`);

  // ═══ KILLSWITCH INTERCEPTION (CMD-SCRAPER-WIRING-C1) ═══
  // The real killswitch check now lives inside the per-bot
  // allowlist path above (EDIT 4). BLOCKED_SLUGS is filtered
  // at dispatch time there. The legacy category-regex path
  // below does NOT yet apply the killswitch at the slug level —
  // Round B's in-file adapter guards still protect it, and
  // Round C2 will delete the legacy path entirely once all 10
  // bot routes opt into the allowlist path.
  // ─────────────────────────────────────────────────────

  // ═══ PHASE 2: PAID Apify scrapers ═══
  // CMD-ANTIQUEBOT-CORE-A: SCRAPER BUDGET DISCIPLINE.
  // The `isMegaBot` gate is the locked enforcement point: paid
  // Apify scrapers (EbayMotors, StockX, Chrono24, AmazonApify,
  // EbayApify, etc.) will NEVER run on normal-path bot scans.
  // They only fire when an explicit MegaBot call passes
  // isMegaBot=true. This gates EVERY paidAdapters.push below
  // behind a single outer guard — equivalent to wrapping each
  // push individually but cleaner. Normal scans: $0.00 Apify cost.
  if (needsMoreData && !itemBudgetBlocked && !phase1Only && isMegaBot) {
    const paidAdapters: Array<() => Promise<ScraperResult>> = [];

    // eBay Apify fallback
    if (!allComps.some(c => c.platform.includes("eBay"))) {
      paidAdapters.push(() => scrapeEbayApify(itemName));
    }

    // Amazon retail anchor
    paidAdapters.push(() => scrapeAmazonApify(itemName));

    // Vehicle routing (paid)
    // CMD-SCRAPER-TIERS-B: scrapeAutoTrader + scrapeCarGurus removed
    // — both are on the hard block list (monthly subscriptions).
    if (cat.match(/vehicle|automobile|car|truck|motorcycle/)) {
      paidAdapters.push(() => scrapeEbayMotors(itemName));
      if (SUBSCRIPTION_ACTORS_ENABLED) {
        paidAdapters.push(() => scrapeCarsCom(itemName, sellerZip));
      }
      paidAdapters.push(() => scrapeBringATrailer(itemName));
    }

    // Watch routing (paid)
    if (cat.match(/watch|horol|timepiece|rolex|omega|breitling|patek|cartier/)) paidAdapters.push(() => scrapeChrono24(itemName));

    // Sneaker routing (paid)
    // CMD-SCRAPER-TIERS-B: scrapeGoat removed — hard-blocked
    // (monthly subscription). StockX remains.
    if (cat.match(/sneaker|shoe|jordan|nike|yeezy|streetwear|supreme/)) paidAdapters.push(() => scrapeStockX(itemName));

    // Card routing (paid)
    if (cat.match(/card|pokemon|magic|yugioh|tcg|trading|sports.?card/)) {
      paidAdapters.push(() => scrapeTcgplayerApify(itemName), () => scrapeCourtyard(itemName), () => scrapePsaCard(itemName));
    }

    // Antique auction (paid)
    // CMD-SCRAPER-TIERS-B: scrapeSothebys removed — hard-blocked
    // (dangerous_cost: pay-per-usage, unknown ceiling). Sotheby's
    // data still flows via scrapeInvaluable (free HTML built-in
    // added in CMD-ANTIQUEBOT-CORE-A — Invaluable.com aggregates
    // Sotheby's, Christie's, Bonhams, etc.).

    // Memorabilia (paid)
    if (cat.match(/memorabilia|autograph|game.?worn|signed/)) paidAdapters.push(() => scrapeCourtyard(itemName));

    // Any extra category adapters not yet covered
    for (const fn of extraCatAdapters) paidAdapters.push(() => fn(itemName));

    const phase2Settled = await Promise.allSettled(
      paidAdapters.map(fn => { const t = setTimeout(() => {}, 45000); return fn().finally(() => clearTimeout(t)); })
    );

    for (const result of phase2Settled) {
      if (result.status === "fulfilled" && result.value.success) {
        allComps.push(...result.value.comps);
        if (!sources.includes(result.value.source)) sources.push(result.value.source);
      }
    }

    console.log(`[market-intel] Phase 2: ${allComps.length - (phase1Settled.filter(r => r.status === "fulfilled" && (r.value as any).success).reduce((s: number, r: any) => s + (r.value?.comps?.length || 0), 0))} additional comps from paid sources`);
  }

  // Deduplicate and sort by date (newest first)
  const comps = deduplicateComps(allComps).sort((a, b) => {
    if (a.date > b.date) return -1;
    if (a.date < b.date) return 1;
    return 0;
  });

  // Calculate stats
  const prices = comps.map((c) => c.price).filter((p) => p > 0).sort((a, b) => a - b);
  const median = prices.length > 0 ? prices[Math.floor(prices.length / 2)] : 0;
  const low = percentile(prices, 0.25);
  const high = percentile(prices, 0.75);

  // Trend: compare newest 3 avg vs oldest 3 avg
  let trend: MarketIntelligence["trend"] = "Unknown";
  if (prices.length >= 6) {
    const newestPrices = comps.slice(0, 3).map((c) => c.price);
    const oldestPrices = comps.slice(-3).map((c) => c.price);
    const newestAvg = newestPrices.reduce((a, b) => a + b, 0) / newestPrices.length;
    const oldestAvg = oldestPrices.reduce((a, b) => a + b, 0) / oldestPrices.length;
    const change = (newestAvg - oldestAvg) / oldestAvg;
    trend = change > 0.1 ? "Rising" : change < -0.1 ? "Declining" : "Stable";
  } else if (prices.length > 0) {
    trend = "Stable";
  }

  // Confidence: 0.3 base + 0.05 per comp + 0.05 per source, max 0.95
  const confidence = Math.min(0.95, 0.3 + comps.length * 0.05 + sources.length * 0.05);

  // TikTok demand signal — gated by ENABLE_TIKTOK_TRENDS (expensive, non-critical)
  let tiktokDemand: MarketIntelligence["tiktokDemand"] = null;
  if (process.env.ENABLE_TIKTOK_TRENDS === "true" && process.env.APIFY_TASK_TIKTOK) {
    try {
      const tt = await checkTikTokTrend(itemName);
      if (tt.success) {
        tiktokDemand = {
          isTrending: tt.isTrending,
          demandSignal: tt.demandSignal,
          videoCount: tt.videoCount,
          totalViews: tt.totalViews,
          topHashtags: tt.topHashtags,
        };
      }
    } catch { /* non-critical */ }
  }

  const result: MarketIntelligence = {
    comps,
    median: Math.round(median),
    low: Math.round(low),
    high: Math.round(high),
    trend,
    confidence,
    sources,
    queriedAt: new Date().toISOString(),
    compCount: comps.length,
    tiktokDemand,
  };

  resultCache.set(cacheKey, { result, builtAt: Date.now() });
  console.log(`[market-intel] Aggregated ${comps.length} comps from ${sources.join(", ")} for "${itemName.slice(0, 40)}" [${category}]${isMaine ? " (Maine)" : ""}${tiktokDemand?.isTrending ? ` [TikTok: ${tiktokDemand.demandSignal}]` : ""}`);
  return result;
}
