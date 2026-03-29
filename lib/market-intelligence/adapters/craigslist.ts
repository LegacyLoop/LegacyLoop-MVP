import type { ScraperResult } from "../types";
import { fetchWithRetry, parsePrice, parseDate } from "../scraper-base";

// Map ZIP prefix to Craigslist subdomain
function getSubdomain(zip: string): string {
  const prefix = zip.slice(0, 3);
  // Maine
  if (["039", "040", "041", "042", "043", "044", "045", "046", "047", "048", "049"].includes(prefix)) return "maine";
  // Massachusetts / Boston
  if (["010", "011", "012", "013", "020", "021", "022", "023", "024"].includes(prefix)) return "boston";
  // New Hampshire
  if (["030", "031", "032", "033", "034", "035", "036", "037", "038"].includes(prefix)) return "nh";
  // Vermont
  if (["050", "051", "052", "053", "054", "056", "057", "058", "059"].includes(prefix)) return "vermont";
  // Connecticut
  if (["060", "061", "062", "063", "064", "065", "066", "067", "068", "069"].includes(prefix)) return "hartford";
  // New York
  if (prefix.startsWith("10") || prefix.startsWith("11") || prefix.startsWith("12")) return "newyork";
  // Pennsylvania
  if (prefix.startsWith("15") || prefix.startsWith("16") || prefix.startsWith("17") || prefix.startsWith("18") || prefix.startsWith("19")) return "philadelphia";
  return "www";
}

export async function scrapeCraigslist(query: string, zip?: string): Promise<ScraperResult> {
  try {
    const subdomain = zip ? getSubdomain(zip) : "www";
    const encoded = encodeURIComponent(query);
    const url = `https://${subdomain}.craigslist.org/search/sss?query=${encoded}&sort=date`;

    const html = await fetchWithRetry(url);
    if (!html) return { success: false, comps: [], source: "Craigslist" };

    const comps: ScraperResult["comps"] = [];

    // Craigslist search results use .cl-search-result or .result-row patterns
    const itemPattern = /<li[^>]*class="cl-search-result[^"]*"[^>]*>[\s\S]*?<\/li>/gi;
    const matches = html.match(itemPattern) || [];

    for (const block of matches.slice(0, 12)) {
      // Title from posting-title link or label span
      const titleMatch = block.match(/<span class="label">([\s\S]*?)<\/span>/i)
        || block.match(/<a[^>]*class="posting-title"[^>]*>([\s\S]*?)<\/a>/i);
      // Price from priceinfo span or dollar sign
      const priceMatch = block.match(/<span class="priceinfo">\$?([\d,.]+)<\/span>/i)
        || block.match(/\$([\d,.]+)/);
      // Date from datetime attribute
      const dateMatch = block.match(/datetime="([^"]+)"/i);
      // Location from meta span
      const locationMatch = block.match(/<span class="meta">[^<]*?([A-Z][a-z]+(?:\s[A-Z][a-z]+)*)/i);

      const title = titleMatch?.[1]?.replace(/<[^>]+>/g, "").trim();
      const price = priceMatch ? parsePrice(priceMatch[1]) : null;

      if (title && price && price > 0) {
        comps.push({
          item: title.slice(0, 120),
          price,
          date: dateMatch ? parseDate(dateMatch[1]) : new Date().toISOString().slice(0, 10),
          platform: "Craigslist",
          condition: "As Listed",
          url: `https://${subdomain}.craigslist.org`,
          location: locationMatch?.[1] || (zip ? `Near ${zip}` : null),
        });
      }
    }

    // Fallback: try legacy result-row pattern
    if (comps.length === 0) {
      const legacyPattern = /<li class="result-row"[^>]*>[\s\S]*?<\/li>/gi;
      const legacyMatches = html.match(legacyPattern) || [];
      for (const block of legacyMatches.slice(0, 12)) {
        const titleMatch = block.match(/<a[^>]*class="result-title[^"]*"[^>]*>([\s\S]*?)<\/a>/i);
        const priceMatch = block.match(/class="result-price">\$?([\d,.]+)/i);
        const dateMatch = block.match(/datetime="([^"]+)"/i);

        const title = titleMatch?.[1]?.replace(/<[^>]+>/g, "").trim();
        const price = priceMatch ? parsePrice(priceMatch[1]) : null;

        if (title && price && price > 0) {
          comps.push({
            item: title.slice(0, 120),
            price,
            date: dateMatch ? parseDate(dateMatch[1]) : new Date().toISOString().slice(0, 10),
            platform: "Craigslist",
            condition: "As Listed",
            url: `https://${subdomain}.craigslist.org`,
            location: zip ? `Near ${zip}` : null,
          });
        }
      }
    }

    console.log(`[market-intel] Craigslist (${subdomain}): ${comps.length} comps for "${query.slice(0, 40)}"`);
    return { success: comps.length > 0, comps, source: "Craigslist" };
  } catch (e: any) {
    console.warn("[market-intel] Craigslist failed:", e.message);
    return { success: false, comps: [], source: "Craigslist", error: e.message };
  }
}
