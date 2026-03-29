import { runApifyTask } from "./apify-client";
import type { ScraperResult, MarketComp } from "../types";
import { parsePrice, parseDate } from "../scraper-base";

export async function scrapeGoat(query: string): Promise<ScraperResult> {
  const taskId = process.env.APIFY_TASK_GOAT;
  if (!taskId) return { success: false, comps: [], source: "GOAT" };

  try {
    const result = await runApifyTask(taskId, {
      keyword: query,
      maxItems: 10,
    }, 30000);

    if (!result.success) return { success: false, comps: [], source: "GOAT" };

    const comps: MarketComp[] = result.items.slice(0, 10).map((item: any) => {
      const price = parsePrice(String(item.price || item.lowestPrice || item.retailPrice || "0")) || 0;
      return {
        item: (item.title || item.name || item.productName || item.slug || "Sneaker").slice(0, 120),
        price,
        date: item.releaseDate || item.date ? parseDate(item.releaseDate || item.date) : new Date().toISOString().slice(0, 10),
        platform: "GOAT",
        condition: item.condition || item.shoeCondition || "New",
        url: item.url || item.link || null,
      };
    }).filter((c: MarketComp) => c.price > 0);

    console.log(`[market-intel] GOAT: ${comps.length} listings for "${query.slice(0, 40)}"`);
    return { success: comps.length > 0, comps, source: "GOAT" };
  } catch (e: any) {
    console.warn("[market-intel] GOAT failed:", e.message);
    return { success: false, comps: [], source: "GOAT", error: e.message };
  }
}
