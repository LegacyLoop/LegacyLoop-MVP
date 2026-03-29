import type { ScraperResult } from "../types";
import { fetchWithRetry, parsePrice } from "../scraper-base";

export async function scrapeMercari(query: string): Promise<ScraperResult> {
  try {
    const encoded = encodeURIComponent(query);
    // Mercari sold listings filter
    const url = `https://www.mercari.com/search/?keyword=${encoded}&status=sold_out&sortBy=SORT_BY_RELEVANCE`;

    const html = await fetchWithRetry(url);
    if (!html) return { success: false, comps: [], source: "Mercari" };

    const comps: ScraperResult["comps"] = [];

    // Try JSON-LD structured data first
    const jsonLdPattern = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi;
    let m;
    while ((m = jsonLdPattern.exec(html)) !== null) {
      try {
        const ld = JSON.parse(m[1]);
        const items = ld["@graph"] || (Array.isArray(ld) ? ld : [ld]);
        for (const item of items) {
          if (item["@type"] === "Product" && item.name && item.offers) {
            const price = parsePrice(String(item.offers.price || item.offers.lowPrice || ""));
            if (price && price > 0) {
              comps.push({
                item: String(item.name).slice(0, 120),
                price,
                date: new Date().toISOString().slice(0, 10),
                platform: "Mercari",
                condition: "Sold",
                url: "https://www.mercari.com",
              });
            }
          }
        }
      } catch { /* JSON parse failure — non-critical */ }
    }

    // Fallback: regex for itemName/price patterns in page data or HTML
    if (comps.length === 0) {
      // Try data attributes and inline JSON
      const itemNamePattern = /"itemName"\s*:\s*"([^"]{5,120})"/gi;
      const titles: string[] = [];
      while ((m = itemNamePattern.exec(html)) !== null && titles.length < 12) {
        titles.push(m[1]);
      }

      // Match product card HTML patterns
      const cardPattern = /<div[^>]*data-testid="SearchResults?"[^>]*>[\s\S]*?<\/div>/gi;
      const cards = html.match(cardPattern) || [];
      for (const card of cards.slice(0, 12)) {
        const titleMatch = card.match(/<p[^>]*>([\s\S]{5,120}?)<\/p>/i);
        const priceMatch = card.match(/\$([\d,.]+)/);
        const title = titleMatch?.[1]?.replace(/<[^>]+>/g, "").trim();
        const price = priceMatch ? parsePrice(priceMatch[1]) : null;
        if (title && price && price > 0 && price < 50000) {
          comps.push({
            item: title.slice(0, 120),
            price,
            date: new Date().toISOString().slice(0, 10),
            platform: "Mercari",
            condition: "Sold",
            url: "https://www.mercari.com",
          });
        }
      }

      // Last resort: pair title arrays with price matches
      if (comps.length === 0 && titles.length > 0) {
        const allPrices: number[] = [];
        const priceGlobal = /\$([\d,.]+)/g;
        while ((m = priceGlobal.exec(html)) !== null && allPrices.length < 20) {
          const p = parsePrice(m[1]);
          if (p && p > 0 && p < 50000) allPrices.push(p);
        }
        for (let i = 0; i < Math.min(titles.length, allPrices.length, 10); i++) {
          comps.push({
            item: titles[i].slice(0, 120),
            price: allPrices[i],
            date: new Date().toISOString().slice(0, 10),
            platform: "Mercari",
            condition: "Sold",
            url: "https://www.mercari.com",
          });
        }
      }
    }

    console.log(`[market-intel] Mercari: ${comps.length} comps for "${query.slice(0, 40)}"`);
    return { success: comps.length > 0, comps, source: "Mercari" };
  } catch (e: any) {
    console.warn("[market-intel] Mercari failed:", e.message);
    return { success: false, comps: [], source: "Mercari", error: e.message };
  }
}
