import { runApifyTask } from "./apify-client";
import type { ScraperResult, MarketComp } from "../types";
import { parsePrice } from "../scraper-base";

function getCity(zip: string): string {
  const p = zip.slice(0, 3);
  if (["039", "040", "041", "042", "043", "044", "045", "046", "047", "048", "049"].includes(p)) return "maine";
  if (p.startsWith("100") || p.startsWith("101")) return "nyc";
  if (p.startsWith("021") || p.startsWith("022")) return "boston";
  if (p.startsWith("030") || p.startsWith("031")) return "nh";
  return "marketplace";
}

export async function scrapeFacebookMarketplace(query: string, zip?: string): Promise<ScraperResult> {
  const taskId = process.env.APIFY_TASK_FACEBOOK;
  if (!taskId) return { success: false, comps: [], source: "Facebook Marketplace" };

  const city = zip ? getCity(zip) : "marketplace";
  const searchUrl = `https://www.facebook.com/marketplace/${city}/search/?query=${encodeURIComponent(query)}`;

  try {
    const result = await runApifyTask(taskId, {
      startUrls: [{ url: searchUrl }],
      maxItems: 15,
      addListingDetails: false,
    }, 45000);

    if (!result.success) return { success: false, comps: [], source: "Facebook Marketplace" };

    const comps: MarketComp[] = result.items.slice(0, 12).map((item: any) => {
      const price = parsePrice(String(item.price || item.salePrice || "0")) || 0;
      return {
        item: (item.title || item.name || "Listing").slice(0, 120),
        price,
        date: new Date().toISOString().slice(0, 10),
        platform: "Facebook Marketplace",
        condition: item.condition || "As Listed",
        url: item.url || null,
        location: item.location || (zip ? `Near ${zip}` : null),
      };
    }).filter((c) => c.price > 0);

    console.log(`[market-intel] Facebook Marketplace: ${comps.length} comps for "${query.slice(0, 40)}"`);
    return { success: comps.length > 0, comps, source: "Facebook Marketplace" };
  } catch (e: any) {
    console.warn("[market-intel] Facebook Marketplace failed:", e.message);
    return { success: false, comps: [], source: "Facebook Marketplace", error: e.message };
  }
}
