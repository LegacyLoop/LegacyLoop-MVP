import { runApifyTask } from "./apify-client";
import type { ScraperResult, MarketComp } from "../types";
import { parsePrice, parseDate } from "../scraper-base";

export async function scrapeBringATrailer(query: string): Promise<ScraperResult> {
  const taskId = process.env.APIFY_TASK_BAT_AUCTIONS;
  if (!taskId) return { success: false, comps: [], source: "Bring A Trailer" };

  try {
    const result = await runApifyTask(taskId, {
      keyword: query,
      maxItems: 10,
    }, 30000);

    if (!result.success) return { success: false, comps: [], source: "Bring A Trailer" };

    const comps: MarketComp[] = result.items.slice(0, 10).map((item: any) => {
      const price = parsePrice(String(item.price || item.soldPrice || item.hammerPrice || "0")) || 0;
      return {
        item: (item.title || item.name || item.lotTitle || "Auction Lot").slice(0, 120),
        price,
        date: item.soldDate || item.auctionDate || item.date ? parseDate(item.soldDate || item.auctionDate || item.date) : new Date().toISOString().slice(0, 10),
        platform: "Bring A Trailer",
        condition: item.condition || "Auction Result",
        url: item.url || item.link || null,
        location: item.location || null,
      };
    }).filter((c: MarketComp) => c.price > 0);

    console.log(`[market-intel] Bring A Trailer: ${comps.length} auctions for "${query.slice(0, 40)}"`);
    return { success: comps.length > 0, comps, source: "Bring A Trailer" };
  } catch (e: any) {
    console.warn("[market-intel] Bring A Trailer failed:", e.message);
    return { success: false, comps: [], source: "Bring A Trailer", error: e.message };
  }
}
