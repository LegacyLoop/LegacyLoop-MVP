import type { MarketIntelligence, ScraperResult, MarketComp } from "./types";
import { deduplicateComps } from "./scraper-base";
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
import { scrapeCraigslistVehicles } from "./adapters/craigslist-vehicles";
import { scrapeCraigslistAntiques } from "./adapters/craigslist-antiques";
// Apify-powered scrapers (paid, reliable)
import { scrapeFacebookMarketplace } from "./adapters/facebook-marketplace";
import { scrapeEbayApify } from "./adapters/ebay-apify";
import { scrapeGoogleShopping } from "./adapters/google-shopping";
import { scrapeAmazonApify } from "./adapters/amazon-apify";
import { checkTikTokTrend } from "./adapters/tiktok-trends";
import { scrapeEbayMotors } from "./adapters/ebay-motors";
import { scrapeAutoTrader } from "./adapters/autotrader";
import { scrapeCarsCom } from "./adapters/cars-com";
import { scrapeCarGurus } from "./adapters/cargurus";
import { scrapeBringATrailer } from "./adapters/bat-auctions";
import { scrapeChrono24 } from "./adapters/chrono24";
import { scrapeStockX } from "./adapters/stockx";
import { scrapeGoat } from "./adapters/goat";
import { scrapeSothebys } from "./adapters/sothebys";

type ScraperFn = (query: string) => Promise<ScraperResult>;

const MAINE_ZIP_PREFIXES = new Set([
  "039", "040", "041", "042", "043", "044", "045", "046", "047", "048", "049",
]);

const CATEGORY_ADAPTER_MAP: Record<string, ScraperFn[]> = {
  "Sports Cards": [scrapeEbaySold, scrapeHeritage],
  "Trading Cards": [scrapeTcgPlayer, scrapeEbaySold],
  "Comics": [scrapeHeritage, scrapeEbaySold],
  "Coins & Currency": [scrapeHeritage, scrapeEbaySold],
  "Vinyl Records": [queryDiscogs, scrapeEbaySold],
  "Watches": [scrapeEbaySold, scrapeHeritage],
  "Sneakers": [scrapeEbaySold],
  "Rare Books": [scrapeHeritage, scrapeEbaySold],
  "Jewelry": [scrapeHeritage, scrapeEbaySold],
  "Memorabilia": [scrapeHeritage, scrapeEbaySold],
  "Vintage Toys": [scrapeEbaySold, scrapeHeritage],
  "Minerals": [scrapeHeritage, scrapeEbaySold],
  "Video Games": [scrapeEbaySold],
  "Funko": [scrapeEbaySold],
};

// Result cache — 4h TTL
const resultCache = new Map<string, { result: MarketIntelligence; builtAt: number }>();
const RESULT_TTL = 4 * 60 * 60 * 1000;

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = Math.ceil(sorted.length * p) - 1;
  return sorted[Math.max(0, Math.min(idx, sorted.length - 1))];
}

export async function getMarketIntelligence(
  itemName: string,
  category: string,
  sellerZip?: string
): Promise<MarketIntelligence> {
  const cacheKey = `${category.toLowerCase()}:${itemName.toLowerCase().slice(0, 80)}:${sellerZip || ""}`;
  const cached = resultCache.get(cacheKey);
  if (cached && Date.now() - cached.builtAt < RESULT_TTL) return cached.result;

  // Category-specific scrapers
  const categoryAdapters = CATEGORY_ADAPTER_MAP[category] || [];

  // Always-run scrapers: built-in (free) + Apify (paid, graceful fallback)
  const alwaysAdapters: Array<() => Promise<ScraperResult>> = [
    // Built-in (free, fast)
    () => scrapeEbaySold(itemName),
    () => scrapeCraigslist(itemName, sellerZip),
    () => scrapeMercari(itemName),
    () => scrapeOfferUp(itemName, sellerZip),
    // Apify-powered (paid — returns success:false if no token/taskId)
    () => scrapeFacebookMarketplace(itemName, sellerZip),
    () => scrapeGoogleShopping(itemName),
  ];

  // Maine-specific: include Uncle Henry's
  const isMaine = sellerZip && MAINE_ZIP_PREFIXES.has(sellerZip.slice(0, 3));
  if (isMaine) {
    alwaysAdapters.push(() => scrapeUncleHenrys(itemName));
  }

  // Dynamic category routing — add specialty scrapers based on item category
  const cat = (category || "").toLowerCase();
  if (cat.match(/fashion|clothing|shoes|accessories|handbag|dress|jacket|coat|shirt|pants|jeans/)) {
    alwaysAdapters.push(() => scrapePoshmark(itemName));
  }
  if (cat.match(/antique|vintage|estate|furniture|silver|porcelain|glass|pottery|china|crystal/)) {
    alwaysAdapters.push(() => scrapeRubyLane(itemName));
  }
  if (cat.match(/music|instrument|guitar|pedal|amp|keyboard|drum|bass|synth|violin|trumpet|saxophone|piano|ukulele/)) {
    alwaysAdapters.push(() => scrapeReverb(itemName));
  }
  // Vehicle routing
  if (cat.match(/vehicle|automobile|car|truck|motorcycle|atv|boat|suv|van|rv|camper/)) {
    alwaysAdapters.push(
      () => scrapeCraigslistVehicles(itemName, sellerZip),
      () => scrapeEbayMotors(itemName),
      () => scrapeAutoTrader(itemName, sellerZip),
      () => scrapeCarsCom(itemName, sellerZip),
      () => scrapeCarGurus(itemName, sellerZip),
      () => scrapeBringATrailer(itemName),
    );
  }
  // Antique/auction routing
  if (cat.match(/antique|vintage|estate|auction|furniture.*old|silver|porcelain|glass.*art|pottery|china/)) {
    alwaysAdapters.push(
      () => scrapeShopGoodwill(itemName),
      () => scrapeLiveAuctioneers(itemName),
      () => scrapeCraigslistAntiques(itemName, sellerZip),
      () => scrapeSothebys(itemName),
    );
  }
  // Watch routing
  if (cat.match(/watch|horol|timepiece|rolex|omega|breitling|patek|cartier/)) {
    alwaysAdapters.push(() => scrapeChrono24(itemName));
  }
  // Sneaker/streetwear routing
  if (cat.match(/sneaker|shoe|jordan|nike|yeezy|streetwear|supreme/)) {
    alwaysAdapters.push(() => scrapeStockX(itemName), () => scrapeGoat(itemName));
  }

  // Dedupe: skip category adapters already covered by always-run
  const alwaysFnNames = new Set([
    "scrapeEbaySold", "scrapeCraigslist", "scrapeMercari", "scrapeUncleHenrys",
    "scrapeOfferUp", "scrapeFacebookMarketplace", "scrapeGoogleShopping",
    "scrapePoshmark", "scrapeRubyLane", "scrapeReverb",
    "scrapeShopGoodwill", "scrapeLiveAuctioneers", "scrapeCraigslistVehicles", "scrapeCraigslistAntiques",
    "scrapeEbayMotors", "scrapeAutoTrader", "scrapeCarsCom", "scrapeCarGurus", "scrapeBringATrailer",
    "scrapeChrono24", "scrapeStockX", "scrapeGoat", "scrapeSothebys",
  ]);
  const extraAdapters = categoryAdapters.filter((fn) => !alwaysFnNames.has(fn.name));

  // Run all scrapers in parallel
  const allFns = [
    ...alwaysAdapters,
    ...extraAdapters.map((fn) => () => fn(itemName)),
  ];

  const settled = await Promise.allSettled(
    allFns.map((fn) => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 45000);
      return fn().finally(() => clearTimeout(timeout));
    })
  );

  const allComps: MarketComp[] = [];
  const sources: string[] = [];

  for (const result of settled) {
    if (result.status === "fulfilled" && result.value.success) {
      allComps.push(...result.value.comps);
      if (!sources.includes(result.value.source)) sources.push(result.value.source);
    }
  }

  // eBay Apify fallback: only fire if built-in eBay returned 0 results
  const hasEbayComps = allComps.some((c) => c.platform.includes("eBay"));
  if (!hasEbayComps && process.env.APIFY_TASK_EBAY) {
    try {
      const ebayBackup = await scrapeEbayApify(itemName);
      if (ebayBackup.success) {
        allComps.push(...ebayBackup.comps);
        if (!sources.includes(ebayBackup.source)) sources.push(ebayBackup.source);
      }
    } catch { /* non-critical */ }
  }

  // Amazon Apify: run as supplementary retail anchor (not a comp source — retail prices)
  if (process.env.APIFY_TASK_AMAZON) {
    try {
      const amazonResult = await scrapeAmazonApify(itemName);
      if (amazonResult.success) {
        allComps.push(...amazonResult.comps);
        if (!sources.includes(amazonResult.source)) sources.push(amazonResult.source);
      }
    } catch { /* non-critical */ }
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

  // TikTok demand signal (non-blocking — runs after comps are collected)
  let tiktokDemand: MarketIntelligence["tiktokDemand"] = null;
  if (process.env.APIFY_TASK_TIKTOK) {
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
