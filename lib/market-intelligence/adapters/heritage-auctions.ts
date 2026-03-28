import type { ScraperResult } from "../types";
import { fetchWithRetry, parsePrice, parseDate } from "../scraper-base";

export async function scrapeHeritage(query: string): Promise<ScraperResult> {
  try {
    const url = `https://www.ha.com/c/search-results.zx?N=0&Ntt=${encodeURIComponent(query)}&type=past-auction`;
    const html = await fetchWithRetry(url);

    const comps: ScraperResult["comps"] = [];
    // Match lot result blocks
    const lotBlocks = html.match(/class="[^"]*lot-info[^"]*"[\s\S]*?(?=class="[^"]*lot-info[^"]*"|<\/table|$)/gi)
      || html.match(/class="[^"]*search-result[^"]*"[\s\S]*?(?=class="[^"]*search-result[^"]*"|$)/gi)
      || [];

    for (const block of lotBlocks.slice(0, 8)) {
      const titleMatch = block.match(/class="[^"]*lot-title[^"]*"[^>]*>[\s\S]*?<a[^>]*>([\s\S]*?)<\/a/i)
        || block.match(/class="[^"]*title[^"]*"[^>]*>([\s\S]*?)<\//i);
      const priceMatch = block.match(/\$[\d,]+(?:\.\d{2})?/);
      const dateMatch = block.match(/(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\w*\s+\d{1,2},?\s+\d{4}/i)
        || block.match(/\d{1,2}\/\d{1,2}\/\d{4}/);

      const title = titleMatch?.[1]?.replace(/<[^>]+>/g, "").trim();
      const price = priceMatch?.[0] ? parsePrice(priceMatch[0]) : null;

      if (title && price) {
        comps.push({
          item: title.slice(0, 120),
          price,
          date: dateMatch?.[0] ? parseDate(dateMatch[0]) : "Unknown",
          platform: "Heritage Auctions",
          condition: "Realized Price",
          url: `https://www.ha.com/c/search-results.zx?Ntt=${encodeURIComponent(query)}&type=past-auction`,
        });
      }
    }

    console.log(`[market-intel] Heritage: ${comps.length} comps for "${query.slice(0, 40)}"`);
    return { success: comps.length > 0, comps, source: "Heritage Auctions" };
  } catch (e: any) {
    console.warn("[market-intel] Heritage failed:", e.message);
    return { success: false, comps: [], source: "Heritage Auctions", error: e.message };
  }
}
