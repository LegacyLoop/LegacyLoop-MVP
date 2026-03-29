import type { ScraperResult, MarketComp } from "../types";
import { fetchWithRetry, parsePrice, deduplicateComps } from "../scraper-base";

export async function scrapeOfferUp(query: string, zip?: string): Promise<ScraperResult> {
  try {
    const encoded = encodeURIComponent(query);
    const url = zip
      ? `https://offerup.com/search/?q=${encoded}&DELIVERY_FLAGS=0&ZIPCODE=${zip}`
      : `https://offerup.com/search/?q=${encoded}`;

    const html = await fetchWithRetry(url);
    if (!html || html.length < 500) return { success: false, comps: [], source: "OfferUp" };

    const comps: MarketComp[] = [];

    // OfferUp embeds listing data in JSON within the page
    const listingPattern = /"title"\s*:\s*"([^"]{5,120})"[\s\S]{0,300}?"price"\s*:\s*"?([\d.]+)"?/gi;
    let match;
    while ((match = listingPattern.exec(html)) !== null && comps.length < 12) {
      const title = match[1]?.trim();
      const price = parsePrice(match[2]);
      if (title && price && price > 0 && price < 50000) {
        comps.push({
          item: title.slice(0, 120),
          price,
          date: new Date().toISOString().slice(0, 10),
          platform: "OfferUp",
          condition: "As Listed",
          url: "https://offerup.com",
          location: zip ? `Near ${zip}` : null,
        });
      }
    }

    // Fallback: try product card HTML patterns
    if (comps.length === 0) {
      const cardPattern = /<a[^>]*href="\/item\/[^"]*"[^>]*>[\s\S]*?<\/a>/gi;
      const cards = html.match(cardPattern) || [];
      for (const card of cards.slice(0, 12)) {
        const titleMatch = card.match(/>([\w\s]{5,80})</);
        const priceMatch = card.match(/\$([\d,.]+)/);
        const title = titleMatch?.[1]?.trim();
        const price = priceMatch ? parsePrice(priceMatch[1]) : null;
        if (title && price && price > 0 && price < 50000) {
          comps.push({
            item: title.slice(0, 120),
            price,
            date: new Date().toISOString().slice(0, 10),
            platform: "OfferUp",
            condition: "As Listed",
            url: "https://offerup.com",
            location: zip ? `Near ${zip}` : null,
          });
        }
      }
    }

    console.log(`[market-intel] OfferUp: ${comps.length} comps for "${query.slice(0, 40)}"`);
    return { success: comps.length > 0, comps: deduplicateComps(comps), source: "OfferUp" };
  } catch (e: any) {
    console.warn("[market-intel] OfferUp failed:", e.message);
    return { success: false, comps: [], source: "OfferUp", error: e.message };
  }
}
