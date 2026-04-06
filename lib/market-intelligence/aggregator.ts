import type { MarketIntelligence, ScraperResult, MarketComp } from "./types";
import { deduplicateComps } from "./scraper-base";
import { getApifyBudgetMode, isItemBudgetExceeded } from "./adapters/apify-client";
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

export async function getMarketIntelligence(
  itemName: string,
  category: string,
  sellerZip?: string,
  phase1Only?: boolean
): Promise<MarketIntelligence> {
  const cacheKey = `${category.toLowerCase()}:${itemName.toLowerCase().slice(0, 80)}:${sellerZip || ""}`;
  const cached = resultCache.get(cacheKey);
  if (cached && Date.now() - cached.builtAt < RESULT_TTL) return cached.result;

  // Category-specific scrapers
  const categoryAdapters = CATEGORY_ADAPTER_MAP[category] || [];

  const SUBSCRIPTION_ACTORS_ENABLED = process.env.ENABLE_SUBSCRIPTION_SCRAPERS === "true";
  const isMaine = sellerZip && MAINE_ZIP_PREFIXES.has(sellerZip.slice(0, 3));
  const cat = (category || "").toLowerCase();

  // ═══ PHASE 1: FREE built-in + cheap essential Apify scrapers ═══
  const freeAdapters: Array<() => Promise<ScraperResult>> = [
    // Built-in (free)
    () => scrapeEbaySold(itemName),
    () => scrapeCraigslist(itemName, sellerZip),
    () => scrapeMercari(itemName),
    () => scrapeOfferUp(itemName, sellerZip),
    // Always-run Apify (cheap, critical data — ~$0.01 each)
    () => scrapeFacebookMarketplace(itemName, sellerZip),
    () => scrapeGoogleShopping(itemName),
  ];

  if (isMaine) freeAdapters.push(() => scrapeUncleHenrys(itemName));
  if (cat.match(/fashion|clothing|shoes|accessories|handbag|dress|jacket|coat|shirt|pants|jeans/)) freeAdapters.push(() => scrapePoshmark(itemName));
  if (cat.match(/antique|vintage|estate|furniture|silver|porcelain|glass|pottery|china|crystal/)) freeAdapters.push(() => scrapeRubyLane(itemName));
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

  // ═══ PHASE 2: PAID Apify scrapers (only if insufficient AND budget allows AND not phase1Only) ═══
  if (needsMoreData && !itemBudgetBlocked && !phase1Only) {
    const paidAdapters: Array<() => Promise<ScraperResult>> = [];

    // eBay Apify fallback
    if (!allComps.some(c => c.platform.includes("eBay"))) {
      paidAdapters.push(() => scrapeEbayApify(itemName));
    }

    // Amazon retail anchor
    paidAdapters.push(() => scrapeAmazonApify(itemName));

    // Vehicle routing (paid)
    if (cat.match(/vehicle|automobile|car|truck|motorcycle/)) {
      paidAdapters.push(() => scrapeEbayMotors(itemName));
      if (SUBSCRIPTION_ACTORS_ENABLED) {
        paidAdapters.push(() => scrapeAutoTrader(itemName, sellerZip), () => scrapeCarsCom(itemName, sellerZip), () => scrapeCarGurus(itemName, sellerZip));
      }
      paidAdapters.push(() => scrapeBringATrailer(itemName));
    }

    // Watch routing (paid)
    if (cat.match(/watch|horol|timepiece|rolex|omega|breitling|patek|cartier/)) paidAdapters.push(() => scrapeChrono24(itemName));

    // Sneaker routing (paid)
    if (cat.match(/sneaker|shoe|jordan|nike|yeezy|streetwear|supreme/)) paidAdapters.push(() => scrapeStockX(itemName), () => scrapeGoat(itemName));

    // Card routing (paid)
    if (cat.match(/card|pokemon|magic|yugioh|tcg|trading|sports.?card/)) {
      paidAdapters.push(() => scrapeTcgplayerApify(itemName), () => scrapeCourtyard(itemName), () => scrapePsaCard(itemName));
    }

    // Antique auction (paid)
    if (cat.match(/antique.*auction|estate/)) paidAdapters.push(() => scrapeSothebys(itemName));

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
