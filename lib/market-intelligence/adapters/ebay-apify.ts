import { runApifyTask } from "./apify-client";
import type { ScraperResult, MarketComp } from "../types";
import { parsePrice, parseDate } from "../scraper-base";

export async function scrapeEbayApify(query: string): Promise<ScraperResult> {
  const taskId = process.env.APIFY_TASK_EBAY;
  if (!taskId) return { success: false, comps: [], source: "eBay (Apify)" };

  const searchUrl = `https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(query)}&LH_Sold=1&LH_Complete=1&_sop=13`;

  try {
    const result = await runApifyTask(taskId, {
      urls: [{ url: searchUrl }],
      maxItems: 15,
    }, 30000);

    if (!result.success) return { success: false, comps: [], source: "eBay (Apify)" };

    const comps: MarketComp[] = result.items.slice(0, 12).map((item: any) => {
      const price = parsePrice(String(item.price || item.soldPrice || "0")) || 0;
      return {
        item: (item.title || item.name || "Listing").slice(0, 120),
        price,
        date: item.soldDate || item.date ? parseDate(item.soldDate || item.date) : new Date().toISOString().slice(0, 10),
        platform: "eBay (Sold)",
        condition: item.condition || "As Listed",
        url: item.url || item.link || null,
      };
    }).filter((c) => c.price > 0);

    console.log(`[market-intel] eBay (Apify): ${comps.length} comps for "${query.slice(0, 40)}"`);
    return { success: comps.length > 0, comps, source: "eBay (Apify)" };
  } catch (e: any) {
    console.warn("[market-intel] eBay (Apify) failed:", e.message);
    return { success: false, comps: [], source: "eBay (Apify)", error: e.message };
  }
}
