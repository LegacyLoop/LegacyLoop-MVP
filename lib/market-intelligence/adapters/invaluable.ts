// lib/market-intelligence/adapters/invaluable.ts
// FREE HTML scraper for Invaluable.com — auction house aggregator
// NO Apify, NO paid API, zero cost per scrape.
// Pattern: follows lib/market-intelligence/adapters/ruby-lane.ts
//
// CMD-ANTIQUEBOT-CORE-A — Step 7 Round A

import type { ScraperResult, MarketComp } from "../types";

const INVALUABLE_SEARCH_URL = "https://www.invaluable.com/search/items?";
const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

/**
 * Scrape Invaluable.com for past auction results.
 * Invaluable is THE premier auction house aggregator — Sotheby's,
 * Christie's, Bonhams, Heritage, Rago, Wright, and hundreds of
 * regional houses all feed into it.
 *
 * Returns auction comp data with realized prices (hammer + buyer's
 * premium) from past sales. Free HTML scrape — no Apify cost.
 */
export async function scrapeInvaluable(query: string): Promise<ScraperResult> {
  if (!query || query.trim().length === 0) {
    return {
      success: false,
      comps: [],
      source: "Invaluable",
      error: "Empty query",
    };
  }

  try {
    const params = new URLSearchParams({
      keyword: query,
      upcoming: "false",
      priceResult: "true",
      sortBy: "DATE_DESC",
    });

    const res = await fetch(INVALUABLE_SEARCH_URL + params.toString(), {
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9",
        "Accept-Language": "en-US,en;q=0.9",
      },
      signal: AbortSignal.timeout(12_000),
    });

    if (!res.ok) {
      return {
        success: false,
        comps: [],
        source: "Invaluable",
        error: `HTTP ${res.status}`,
      };
    }

    const html = await res.text();
    if (!html || html.length < 500) {
      return { success: false, comps: [], source: "Invaluable" };
    }

    const comps: MarketComp[] = [];

    // Pattern 1: Invaluable lot cards with data-lot attribute
    const cardRegex = /<article[^>]*data-lot[^>]*>([\s\S]*?)<\/article>/gi;
    const titleRegex = /<h3[^>]*>([^<]+)<\/h3>/i;
    const priceRegex = /\$([0-9,]+(?:\.[0-9]{2})?)/;
    const dateRegex = /(\w+\s+\d{1,2},\s+\d{4})/;
    const houseRegex = /data-house="([^"]+)"/i;

    let match: RegExpExecArray | null;
    let cardCount = 0;

    while ((match = cardRegex.exec(html)) !== null && cardCount < 12) {
      const card = match[1];
      const titleMatch = card.match(titleRegex);
      const priceMatch = card.match(priceRegex);
      const dateMatch = card.match(dateRegex);
      const houseMatch = card.match(houseRegex);

      if (!titleMatch || !priceMatch) continue;

      const priceNum = parseFloat(priceMatch[1].replace(/,/g, ""));
      if (isNaN(priceNum) || priceNum <= 0) continue;

      comps.push({
        item: titleMatch[1].trim().slice(0, 200),
        price: priceNum,
        date: dateMatch ? dateMatch[1] : new Date().toISOString().slice(0, 10),
        platform: "Invaluable",
        condition: houseMatch
          ? `Auction Result (${houseMatch[1]})`
          : "Auction Result",
        url: "https://www.invaluable.com",
      });
      cardCount++;
    }

    // Pattern 2: generic link+price fallback (mirrors ruby-lane pattern)
    if (comps.length === 0) {
      const fallbackPattern =
        /<a[^>]*>([^<]{10,140})<\/a>[\s\S]{0,400}?\$([0-9,]+(?:\.[0-9]{2})?)/gi;
      while (
        (match = fallbackPattern.exec(html)) !== null &&
        comps.length < 12
      ) {
        const title = match[1]?.trim().replace(/<[^>]+>/g, "");
        const priceNum = parseFloat(match[2].replace(/,/g, ""));
        if (
          title &&
          !isNaN(priceNum) &&
          priceNum > 0 &&
          priceNum < 1_000_000 &&
          !/shipping|cart|fee|register|sign\s*in/i.test(title)
        ) {
          comps.push({
            item: title.slice(0, 200),
            price: priceNum,
            date: new Date().toISOString().slice(0, 10),
            platform: "Invaluable",
            condition: "Auction Result",
            url: "https://www.invaluable.com",
          });
        }
      }
    }

    console.log(
      `[market-intel] Invaluable: ${comps.length} auction results for "${query.slice(0, 40)}"`,
    );
    return {
      success: comps.length > 0,
      comps,
      source: "Invaluable",
    };
  } catch (err: any) {
    console.warn("[market-intel] Invaluable failed:", err?.message ?? err);
    return {
      success: false,
      comps: [],
      source: "Invaluable",
      error: err?.message || "Unknown Invaluable scrape error",
    };
  }
}
