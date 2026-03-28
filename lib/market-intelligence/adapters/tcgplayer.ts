import type { ScraperResult } from "../types";
import { fetchWithRetry, parsePrice } from "../scraper-base";

export async function scrapeTcgPlayer(query: string): Promise<ScraperResult> {
  try {
    const url = `https://www.tcgplayer.com/search/all/product?q=${encodeURIComponent(query)}&view=grid`;
    const html = await fetchWithRetry(url);

    const comps: ScraperResult["comps"] = [];
    // Match product listing blocks
    const productBlocks = html.match(/class="search-result__content"[\s\S]*?(?=class="search-result__content"|$)/g)
      || html.match(/class="product-card"[\s\S]*?(?=class="product-card"|$)/g)
      || [];

    for (const block of productBlocks.slice(0, 8)) {
      const nameMatch = block.match(/class="[^"]*product[_-]?name[^"]*"[^>]*>([\s\S]*?)<\//i)
        || block.match(/class="[^"]*title[^"]*"[^>]*>([\s\S]*?)<\//i);
      const priceMatch = block.match(/\$[\d,.]+/);

      const name = nameMatch?.[1]?.replace(/<[^>]+>/g, "").trim();
      const price = priceMatch?.[0] ? parsePrice(priceMatch[0]) : null;

      if (name && price) {
        comps.push({
          item: name.slice(0, 120),
          price,
          date: new Date().toISOString().slice(0, 10),
          platform: "TCGPlayer",
          condition: "Market Price",
          url: `https://www.tcgplayer.com/search/all/product?q=${encodeURIComponent(query)}`,
        });
      }
    }

    console.log(`[market-intel] TCGPlayer: ${comps.length} comps for "${query.slice(0, 40)}"`);
    return { success: comps.length > 0, comps, source: "TCGPlayer" };
  } catch (e: any) {
    console.warn("[market-intel] TCGPlayer failed:", e.message);
    return { success: false, comps: [], source: "TCGPlayer", error: e.message };
  }
}
