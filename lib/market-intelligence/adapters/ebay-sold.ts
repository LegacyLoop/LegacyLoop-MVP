import type { ScraperResult } from "../types";
import { fetchWithRetry, parsePrice, parseDate } from "../scraper-base";

export async function scrapeEbaySold(query: string): Promise<ScraperResult> {
  try {
    const url = `https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(query)}&LH_Complete=1&LH_Sold=1&_sop=13`;
    const html = await fetchWithRetry(url);

    const comps: ScraperResult["comps"] = [];
    // Match s-item blocks
    const itemBlocks = html.match(/class="s-item__info[\s\S]*?(?=class="s-item__info|$)/g) || [];
    for (const block of itemBlocks.slice(0, 12)) {
      const titleMatch = block.match(/class="s-item__title"[^>]*>(?:<span[^>]*>)?([\s\S]*?)(?:<\/span>)?<\//);
      const priceMatch = block.match(/class="s-item__price"[^>]*>[\s\S]*?(\$[\d,.]+)/);
      const dateMatch = block.match(/class="s-item__ended-date"[^>]*>([\s\S]*?)<\/|class="s-item__endedDate"[^>]*>([\s\S]*?)<\//);

      const title = titleMatch?.[1]?.replace(/<[^>]+>/g, "").trim();
      const price = priceMatch?.[1] ? parsePrice(priceMatch[1]) : null;
      const dateStr = (dateMatch?.[1] || dateMatch?.[2] || "").replace(/<[^>]+>/g, "").trim();

      if (title && price && !title.toLowerCase().includes("shop on ebay")) {
        comps.push({
          item: title.slice(0, 120),
          price,
          date: parseDate(dateStr),
          platform: "eBay",
          condition: "As Listed",
          url: `https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(query)}&LH_Sold=1`,
        });
      }
    }

    console.log(`[market-intel] eBay Sold: ${comps.length} comps for "${query.slice(0, 40)}"`);
    return { success: comps.length > 0, comps, source: "eBay Sold" };
  } catch (e: any) {
    console.warn("[market-intel] eBay Sold failed:", e.message);
    return { success: false, comps: [], source: "eBay Sold", error: e.message };
  }
}
