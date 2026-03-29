import { runApifyTask } from "./apify-client";
import type { ScraperResult, MarketComp } from "../types";
import { parsePrice } from "../scraper-base";

export async function scrapeGoogleShopping(query: string): Promise<ScraperResult> {
  const taskId = process.env.APIFY_TASK_GOOGLE_SHOPPING;
  if (!taskId) return { success: false, comps: [], source: "Google Shopping" };

  try {
    const result = await runApifyTask(taskId, {
      query,
      maxItems: 15,
    }, 30000);

    if (!result.success) return { success: false, comps: [], source: "Google Shopping" };

    const comps: MarketComp[] = result.items.slice(0, 12).map((item: any) => {
      const price = parsePrice(String(item.price || item.extractedPrice || "0")) || 0;
      return {
        item: (item.title || item.name || "Product").slice(0, 120),
        price,
        date: new Date().toISOString().slice(0, 10),
        platform: "Google Shopping",
        condition: "New (retail)",
        url: item.link || item.url || null,
      };
    }).filter((c) => c.price > 0);

    console.log(`[market-intel] Google Shopping: ${comps.length} comps for "${query.slice(0, 40)}"`);
    return { success: comps.length > 0, comps, source: "Google Shopping" };
  } catch (e: any) {
    console.warn("[market-intel] Google Shopping failed:", e.message);
    return { success: false, comps: [], source: "Google Shopping", error: e.message };
  }
}
