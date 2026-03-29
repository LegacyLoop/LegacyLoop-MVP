import { runApifyTask } from "./apify-client";
import type { ScraperResult, MarketComp } from "../types";
import { parsePrice } from "../scraper-base";

export async function scrapeAmazonApify(query: string): Promise<ScraperResult> {
  const taskId = process.env.APIFY_TASK_AMAZON;
  if (!taskId) return { success: false, comps: [], source: "Amazon" };

  const searchUrl = `https://www.amazon.com/s?k=${encodeURIComponent(query)}`;

  try {
    const result = await runApifyTask(taskId, {
      productUrls: [{ url: searchUrl }],
      maxItems: 10,
    }, 30000);

    if (!result.success) return { success: false, comps: [], source: "Amazon" };

    const comps: MarketComp[] = result.items.slice(0, 10).map((item: any) => {
      const price = parsePrice(String(item.price || item.currentPrice || "0")) || 0;
      return {
        item: (item.title || item.name || "Product").slice(0, 120),
        price,
        date: new Date().toISOString().slice(0, 10),
        platform: "Amazon",
        condition: "New (retail)",
        url: item.url || item.link || null,
      };
    }).filter((c) => c.price > 0);

    console.log(`[market-intel] Amazon (Apify): ${comps.length} comps for "${query.slice(0, 40)}"`);
    return { success: comps.length > 0, comps, source: "Amazon" };
  } catch (e: any) {
    console.warn("[market-intel] Amazon (Apify) failed:", e.message);
    return { success: false, comps: [], source: "Amazon", error: e.message };
  }
}
