import type { ScraperResult } from "../types";
import { fetchWithRetry, parsePrice } from "../scraper-base";

export async function scrapeUncleHenrys(query: string): Promise<ScraperResult> {
  try {
    const encoded = encodeURIComponent(query);
    const url = `https://www.unclehenrys.com/classifieds?search=${encoded}`;

    const html = await fetchWithRetry(url);
    if (!html) return { success: false, comps: [], source: "Uncle Henry's" };

    const comps: ScraperResult["comps"] = [];

    // Uncle Henry's listing blocks — try multiple HTML patterns
    const patterns = [
      /<div class="listing[^"]*"[^>]*>[\s\S]*?<\/div>\s*<\/div>/gi,
      /<article[^>]*class="[^"]*listing[^"]*"[^>]*>[\s\S]*?<\/article>/gi,
      /<tr[^>]*class="[^"]*listing[^"]*"[^>]*>[\s\S]*?<\/tr>/gi,
    ];

    let allBlocks: string[] = [];
    for (const pattern of patterns) {
      const matches = html.match(pattern) || [];
      if (matches.length > 0) { allBlocks = matches; break; }
    }

    // Fallback: extract any link+price pairs from the page
    if (allBlocks.length === 0) {
      const linkPricePattern = /<a[^>]*href="[^"]*"[^>]*>([^<]{5,80})<\/a>[\s\S]{0,200}?\$([\d,.]+)/gi;
      let m;
      while ((m = linkPricePattern.exec(html)) !== null && comps.length < 10) {
        const title = m[1].replace(/<[^>]+>/g, "").trim();
        const price = parsePrice(m[2]);
        if (title && price && price > 0 && price < 50000) {
          comps.push({
            item: title.slice(0, 120),
            price,
            date: new Date().toISOString().slice(0, 10),
            platform: "Uncle Henry's",
            condition: "As Listed",
            url: "https://www.unclehenrys.com",
            location: "Maine",
          });
        }
      }
    } else {
      for (const block of allBlocks.slice(0, 10)) {
        const titleMatch = block.match(/<a[^>]*>(.*?)<\/a>/i)
          || block.match(/<h\d[^>]*>(.*?)<\/h\d>/i);
        const priceMatch = block.match(/\$([\d,.]+)/);

        const title = titleMatch?.[1]?.replace(/<[^>]+>/g, "").trim();
        const price = priceMatch ? parsePrice(priceMatch[1]) : null;

        if (title && price && price > 0) {
          comps.push({
            item: title.slice(0, 120),
            price,
            date: new Date().toISOString().slice(0, 10),
            platform: "Uncle Henry's",
            condition: "As Listed",
            url: "https://www.unclehenrys.com",
            location: "Maine",
          });
        }
      }
    }

    console.log(`[market-intel] Uncle Henry's: ${comps.length} comps for "${query.slice(0, 40)}"`);
    return { success: comps.length > 0, comps, source: "Uncle Henry's" };
  } catch (e: any) {
    console.warn("[market-intel] Uncle Henry's failed:", e.message);
    return { success: false, comps: [], source: "Uncle Henry's", error: e.message };
  }
}
