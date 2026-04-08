// lib/market-intelligence/adapters/firstdibs.ts
// FREE HTML scraper for 1stDibs.com — premium antique marketplace
// NO Apify, NO paid API, zero cost per scrape.
// Pattern: follows lib/market-intelligence/adapters/ruby-lane.ts
//
// CMD-ANTIQUEBOT-CORE-A — Step 7 Round A

import type { ScraperResult, MarketComp } from "../types";

const FIRSTDIBS_SEARCH_URL = "https://www.1stdibs.com/search/?";
const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

/**
 * Scrape 1stDibs for premium antique marketplace listings.
 * 1stDibs is dealer-curated — serious buyers, professional
 * photography, authenticated inventory. Prices reflect RETAIL
 * (not wholesale) but are valuable for upper-bound valuation.
 *
 * Free HTML scrape — no Apify cost.
 */
export async function scrapeFirstDibs(query: string): Promise<ScraperResult> {
  if (!query || query.trim().length === 0) {
    return {
      success: false,
      comps: [],
      source: "1stDibs",
      error: "Empty query",
    };
  }

  try {
    const params = new URLSearchParams({ q: query });

    const res = await fetch(FIRSTDIBS_SEARCH_URL + params.toString(), {
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
        source: "1stDibs",
        error: `HTTP ${res.status}`,
      };
    }

    const html = await res.text();
    if (!html || html.length < 500) {
      return { success: false, comps: [], source: "1stDibs" };
    }

    const comps: MarketComp[] = [];

    // Pattern 1: 1stDibs item cards with data-tn="search-list-item"
    const cardRegex =
      /<article[^>]*data-tn="search-list-item[^"]*"[^>]*>([\s\S]*?)<\/article>/gi;
    const titleRegex = /<h3[^>]*>([^<]+)<\/h3>/i;
    const priceRegex = /\$([0-9,]+(?:\.[0-9]{2})?)/;
    const dealerRegex = /data-tn="dealer-name">([^<]+)</i;
    const locationRegex = /data-tn="dealer-location">([^<]+)</i;

    let match: RegExpExecArray | null;
    let cardCount = 0;

    while ((match = cardRegex.exec(html)) !== null && cardCount < 12) {
      const card = match[1];
      const titleMatch = card.match(titleRegex);
      const priceMatch = card.match(priceRegex);
      const dealerMatch = card.match(dealerRegex);
      const locationMatch = card.match(locationRegex);

      if (!titleMatch || !priceMatch) continue;

      const priceNum = parseFloat(priceMatch[1].replace(/,/g, ""));
      if (isNaN(priceNum) || priceNum <= 0) continue;

      comps.push({
        item: titleMatch[1].trim().slice(0, 200),
        price: priceNum,
        date: new Date().toISOString().slice(0, 10),
        platform: "1stDibs",
        condition: dealerMatch
          ? `Dealer Stock (${dealerMatch[1]})`
          : "Dealer Stock",
        location: locationMatch ? locationMatch[1] : null,
        url: "https://www.1stdibs.com",
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
          !/shipping|cart|fee|register|sign\s*in|trade/i.test(title)
        ) {
          comps.push({
            item: title.slice(0, 200),
            price: priceNum,
            date: new Date().toISOString().slice(0, 10),
            platform: "1stDibs",
            condition: "Dealer Stock",
            location: null,
            url: "https://www.1stdibs.com",
          });
        }
      }
    }

    console.log(
      `[market-intel] 1stDibs: ${comps.length} dealer listings for "${query.slice(0, 40)}"`,
    );
    return {
      success: comps.length > 0,
      comps,
      source: "1stDibs",
    };
  } catch (err: any) {
    console.warn("[market-intel] 1stDibs failed:", err?.message ?? err);
    return {
      success: false,
      comps: [],
      source: "1stDibs",
      error: err?.message || "Unknown 1stDibs scrape error",
    };
  }
}
