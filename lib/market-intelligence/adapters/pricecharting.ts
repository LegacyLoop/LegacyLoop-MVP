import type { ScraperResult, MarketComp } from "../types";
import { fetchWithRetry, parsePrice } from "../scraper-base";

/**
 * PriceCharting.com built-in scraper — Beckett equivalent for card + collectible pricing.
 * Covers: Trading cards (Pokemon, MTG, Yu-Gi-Oh), Sports cards, Video games,
 * Comics, Coins, Funko, LEGO. Free, no API key required.
 *
 * Returns ungraded/loose prices as primary, with graded tiers when available.
 * PriceCharting aggregates eBay sold data into clean price guides.
 */
export async function scrapePriceCharting(
  query: string,
  broadCategory: string = "all"
): Promise<ScraperResult> {
  try {
    const catMap: Record<string, string> = {
      "trading-cards": "trading-cards",
      "sports-cards": "trading-cards",
      "video-games": "video-games",
      "comics": "comic-books",
      "coins": "coins",
      "funko": "funko-pops",
      "lego": "lego-sets",
      "lego-sets": "lego-sets",
    };
    const pcCategory = catMap[broadCategory.toLowerCase()] || "all";

    const url = `https://www.pricecharting.com/search-products?type=prices&q=${encodeURIComponent(query)}&broad-category=${pcCategory}`;

    const html = await fetchWithRetry(url, {
      headers: {
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Referer": "https://www.pricecharting.com/",
      },
    });

    if (!html || html.length < 500) {
      console.warn("[market-intel] PriceCharting: empty or blocked response");
      return { success: false, comps: [], source: "PriceCharting" };
    }

    const rowPattern = /<tr[^>]*id="product-\d+"[^>]*>([\s\S]*?)<\/tr>/gi;
    const rows = html.match(rowPattern) || [];

    const comps: MarketComp[] = [];

    for (const row of rows.slice(0, 12)) {
      // Product name
      const titleMatch = row.match(/<td[^>]*class="[^"]*title[^"]*"[^>]*>[\s\S]*?<a[^>]*>([\s\S]*?)<\/a>/i);
      const name = titleMatch?.[1]?.replace(/<[^>]+>/g, "").trim() || "";
      if (!name) continue;

      // Set/console name
      const setMatch = row.match(/<div[^>]*class="console-in-title"[^>]*>([\s\S]*?)<\/div>/i);
      const setName = setMatch?.[1]?.replace(/<[^>]+>/g, "").trim() || "";

      // Product URL
      const urlMatch = row.match(/<td[^>]*class="[^"]*title[^"]*"[^>]*>[\s\S]*?<a[^>]*href="([^"]*)"[^>]*>/i);
      const productUrl = urlMatch?.[1] ? `https://www.pricecharting.com${urlMatch[1]}` : undefined;

      // Ungraded/loose price
      const ungradedMatch = row.match(/<td[^>]*class="[^"]*used_price[^"]*"[^>]*>[\s\S]*?<span[^>]*class="js-price"[^>]*>([\s\S]*?)<\/span>/i);
      const ungradedPrice = ungradedMatch ? parsePrice(ungradedMatch[1].replace(/<[^>]+>/g, "").trim()) : null;

      // Graded/CIB price (~Grade 7)
      const gradedMatch = row.match(/<td[^>]*class="[^"]*cib_price[^"]*"[^>]*>[\s\S]*?<span[^>]*class="js-price"[^>]*>([\s\S]*?)<\/span>/i);
      const gradedPrice = gradedMatch ? parsePrice(gradedMatch[1].replace(/<[^>]+>/g, "").trim()) : null;

      // Mint/new price (~Grade 8+)
      const mintMatch = row.match(/<td[^>]*class="[^"]*new_price[^"]*"[^>]*>[\s\S]*?<span[^>]*class="js-price"[^>]*>([\s\S]*?)<\/span>/i);
      const mintPrice = mintMatch ? parsePrice(mintMatch[1].replace(/<[^>]+>/g, "").trim()) : null;

      const primaryPrice = ungradedPrice || gradedPrice || mintPrice;
      if (!primaryPrice || primaryPrice <= 0) continue;

      const fullName = setName ? `${name} [${setName}]` : name;

      comps.push({
        item: fullName.slice(0, 120),
        price: primaryPrice,
        date: new Date().toISOString().slice(0, 10),
        platform: "PriceCharting",
        condition: ungradedPrice ? "Ungraded/Raw" : gradedPrice ? "Graded ~7" : "Graded ~8+",
        url: productUrl,
      });

      if (gradedPrice && gradedPrice !== primaryPrice && gradedPrice > 0) {
        comps.push({
          item: fullName.slice(0, 120),
          price: gradedPrice,
          date: new Date().toISOString().slice(0, 10),
          platform: "PriceCharting",
          condition: "Graded ~7 (PSA/BGS)",
          url: productUrl,
        });
      }

      if (mintPrice && mintPrice !== primaryPrice && mintPrice !== gradedPrice && mintPrice > 0) {
        comps.push({
          item: fullName.slice(0, 120),
          price: mintPrice,
          date: new Date().toISOString().slice(0, 10),
          platform: "PriceCharting",
          condition: "Graded ~8+ (PSA/BGS)",
          url: productUrl,
        });
      }
    }

    // Fallback: try JSON-LD or simpler pattern if table parsing failed
    if (comps.length === 0) {
      const simplePat = /<a[^>]*href="\/game\/[^"]*"[^>]*>([^<]{5,100})<\/a>[\s\S]{0,400}?\$([\d,.]+)/gi;
      let m;
      while ((m = simplePat.exec(html)) !== null && comps.length < 12) {
        const title = m[1]?.trim();
        const price = parsePrice(m[2]);
        if (title && price && price > 0) {
          comps.push({ item: title.slice(0, 120), price, date: new Date().toISOString().slice(0, 10), platform: "PriceCharting", condition: "Market Price", url: undefined });
        }
      }
    }

    // Dedupe
    const seen = new Set<string>();
    const uniqueComps = comps.filter(c => {
      const key = `${c.item}:${c.price}:${c.condition}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    console.log(`[market-intel] PriceCharting: ${uniqueComps.length} listings (${rows.length} products) for "${query.slice(0, 40)}"${pcCategory !== "all" ? ` [${pcCategory}]` : ""}`);
    return { success: uniqueComps.length > 0, comps: uniqueComps, source: "PriceCharting" };
  } catch (e: any) {
    console.warn("[market-intel] PriceCharting failed:", e.message);
    return { success: false, comps: [], source: "PriceCharting", error: e.message };
  }
}
