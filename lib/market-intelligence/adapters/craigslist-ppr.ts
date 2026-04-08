// CMD-SCRAPER-CUSTOM-SCRAPERS: free multi-region Craigslist deep
// scraper. Replaces the paid Apify actor
// "ivanvs/craigslist-scraper-pay-per-result" by extending the
// existing scrapeCraigslist HTML pattern across 4 New England
// regional hubs (Maine, NH, Boston, Vermont). Zero Apify cost.
//
// Used by ListBot/BuyerBot/ReconBot MegaBot scans via the
// SCRAPER_DISPATCH_MAP slug "ivanvs/craigslist-scraper-pay-per-result".

import { fetchWithRetry, parsePrice, parseDate } from "../scraper-base";
import type { ScraperResult, MarketComp } from "../types";

const REGIONAL_HOSTS: Array<{ host: string; label: string }> = [
  { host: "https://maine.craigslist.org", label: "maine" },
  { host: "https://nh.craigslist.org", label: "nh" },
  { host: "https://boston.craigslist.org", label: "boston" },
  { host: "https://vermont.craigslist.org", label: "vermont" },
];

const COMP_HARD_CAP = 30;

export async function scrapeCraigslistPpr(
  query: string,
  _sellerZip?: string,
): Promise<ScraperResult> {
  if (!query || query.trim().length === 0) {
    return {
      success: false,
      comps: [],
      source: "Craigslist PPR",
      error: "Empty query",
    };
  }

  const encoded = encodeURIComponent(query);
  const comps: MarketComp[] = [];
  let regionsHit = 0;

  for (const region of REGIONAL_HOSTS) {
    if (comps.length >= COMP_HARD_CAP) break;

    const url = `${region.host}/search/sss?query=${encoded}&sort=date`;
    let html: string;
    try {
      html = await fetchWithRetry(url);
    } catch (err: any) {
      console.warn(
        `[market-intel] Craigslist PPR (${region.label}) failed: ${err?.message ?? err}`,
      );
      continue;
    }
    if (!html || html.length < 500) continue;
    regionsHit++;

    // Match modern result-row blocks first (cl-search-result li)
    const itemPattern = /<li[^>]*class="cl-search-result[^"]*"[^>]*>[\s\S]*?<\/li>/gi;
    const matches = html.match(itemPattern) || [];

    for (const block of matches) {
      if (comps.length >= COMP_HARD_CAP) break;

      const titleMatch =
        block.match(/<span class="label">([\s\S]*?)<\/span>/i) ||
        block.match(/<a[^>]*class="posting-title"[^>]*>([\s\S]*?)<\/a>/i);
      const priceMatch =
        block.match(/<span class="priceinfo">\$?([\d,.]+)<\/span>/i) ||
        block.match(/\$([\d,.]+)/);
      const dateMatch = block.match(/datetime="([^"]+)"/i);
      const hrefMatch = block.match(/<a[^>]*href="(https?:[^"]+)"/i);

      const title = titleMatch?.[1]?.replace(/<[^>]+>/g, "").trim();
      const price = priceMatch ? parsePrice(priceMatch[1]) : null;

      if (title && price && price > 0) {
        comps.push({
          item: title.slice(0, 120),
          price,
          date: dateMatch ? parseDate(dateMatch[1]) : new Date().toISOString().slice(0, 10),
          platform: "Craigslist PPR",
          condition: "As Listed",
          url: hrefMatch?.[1] || region.host,
          location: region.label,
        });
      }
    }

    // Legacy result-row fallback (only if modern pattern empty
    // for this region) — same approach as scrapeCraigslist
    if (matches.length === 0) {
      const legacyPattern = /<li class="result-row"[^>]*>[\s\S]*?<\/li>/gi;
      const legacyMatches = html.match(legacyPattern) || [];
      for (const block of legacyMatches) {
        if (comps.length >= COMP_HARD_CAP) break;

        const titleMatch = block.match(/<a[^>]*class="result-title[^"]*"[^>]*>([\s\S]*?)<\/a>/i);
        const priceMatch = block.match(/class="result-price">\$?([\d,.]+)/i);
        const dateMatch = block.match(/datetime="([^"]+)"/i);
        const hrefMatch = block.match(/<a[^>]*class="result-title[^"]*"[^>]*href="([^"]+)"/i);

        const title = titleMatch?.[1]?.replace(/<[^>]+>/g, "").trim();
        const price = priceMatch ? parsePrice(priceMatch[1]) : null;

        if (title && price && price > 0) {
          comps.push({
            item: title.slice(0, 120),
            price,
            date: dateMatch ? parseDate(dateMatch[1]) : new Date().toISOString().slice(0, 10),
            platform: "Craigslist PPR",
            condition: "As Listed",
            url: hrefMatch?.[1] || region.host,
            location: region.label,
          });
        }
      }
    }
  }

  console.log(
    `[market-intel] Craigslist PPR: ${comps.length} comps across ${regionsHit}/${REGIONAL_HOSTS.length} regions for "${query.slice(0, 40)}"`,
  );
  return {
    success: comps.length > 0,
    comps,
    source: "Craigslist PPR",
  };
}
