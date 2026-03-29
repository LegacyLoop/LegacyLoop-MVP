import type { MarketIntelligence, ScraperResult, MarketComp } from "./types";
import { deduplicateComps } from "./scraper-base";
import { scrapeEbaySold } from "./adapters/ebay-sold";
import { scrapeTcgPlayer } from "./adapters/tcgplayer";
import { queryDiscogs } from "./adapters/discogs";
import { scrapeHeritage } from "./adapters/heritage-auctions";
import { scrapeCraigslist } from "./adapters/craigslist";
import { scrapeUncleHenrys } from "./adapters/uncle-henrys";
import { scrapeMercari } from "./adapters/mercari";

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

  // Always-run scrapers: eBay, Craigslist (local), Mercari
  const alwaysAdapters: Array<() => Promise<ScraperResult>> = [
    () => scrapeEbaySold(itemName),
    () => scrapeCraigslist(itemName, sellerZip),
    () => scrapeMercari(itemName),
  ];

  // Maine-specific: include Uncle Henry's
  const isMaine = sellerZip && MAINE_ZIP_PREFIXES.has(sellerZip.slice(0, 3));
  if (isMaine) {
    alwaysAdapters.push(() => scrapeUncleHenrys(itemName));
  }

  // Dedupe: if a category adapter is already in always-run, skip it
  const alwaysFnNames = new Set(["scrapeEbaySold", "scrapeCraigslist", "scrapeMercari", "scrapeUncleHenrys"]);
  const extraAdapters = categoryAdapters.filter((fn) => !alwaysFnNames.has(fn.name));

  // Run all adapters in parallel with 15s overall timeout
  const allFns = [
    ...alwaysAdapters,
    ...extraAdapters.map((fn) => () => fn(itemName)),
  ];

  const settled = await Promise.allSettled(
    allFns.map((fn) => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);
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

  // Confidence: 0.3 base + 0.05 per comp, max 0.95
  const confidence = Math.min(0.95, 0.3 + comps.length * 0.05);

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
  };

  resultCache.set(cacheKey, { result, builtAt: Date.now() });
  console.log(`[market-intel] Aggregated ${comps.length} comps from ${sources.join(", ")} for "${itemName.slice(0, 40)}" [${category}]${isMaine ? " (Maine — Uncle Henry's included)" : ""}`);
  return result;
}
