import { runApifyTask } from "./apify-client";
import type { ScraperResult, MarketComp } from "../types";
import { parsePrice } from "../scraper-base";

export interface EtsyTopListing {
  title: string;
  tags: string[];
  description: string;
  price: number;
  reviews: number;
  favorites: number;
  shopName: string;
}

export async function scrapeEtsy(query: string): Promise<ScraperResult & { topListings: EtsyTopListing[] }> {
  const taskId = process.env.APIFY_TASK_ETSY;
  if (!taskId) return { success: false, comps: [], topListings: [], source: "Etsy" };

  try {
    console.log("[Etsy] Apify scraper called — requires active Apify subscription");

    const result = await runApifyTask(taskId, {
      searchQuery: query,
      maxItems: 15,
      sortBy: "relevancy",
    }, 30000);

    if (!result.success) return { success: false, comps: [], topListings: [], source: "Etsy" };

    const comps: MarketComp[] = result.items
      .map((item: any) => {
        const price = parsePrice(String(item.price || "0")) || 0;
        return {
          item: (item.title || item.name || "Listing").slice(0, 120),
          price,
          date: new Date().toISOString().slice(0, 10),
          platform: "Etsy",
          condition: "Vintage",
          url: item.url || item.link || null,
          location: item.shopLocation || null,
        };
      })
      .filter((c) => c.price > 0)
      .slice(0, 12);

    const topListings: EtsyTopListing[] = result.items.slice(0, 5).map((item: any) => ({
      title: item.title || "",
      tags: item.tags || [],
      description: (item.description || "").slice(0, 300),
      price: parsePrice(String(item.price || "0")) || 0,
      reviews: item.reviewCount || item.reviews || 0,
      favorites: item.favorites || item.saves || 0,
      shopName: item.shopName || "",
    }));

    console.log(`[market-intel] Etsy: ${comps.length} comps, ${topListings.length} top listings for "${query.slice(0, 40)}"`);
    return { success: comps.length > 0, comps, topListings, source: "Etsy" };
  } catch (e: any) {
    console.warn("[market-intel] Etsy failed:", e.message);
    return { success: false, comps: [], topListings: [], source: "Etsy", error: e.message };
  }
}
