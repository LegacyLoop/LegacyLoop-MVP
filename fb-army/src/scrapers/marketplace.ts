/**
 * @deprecated CMD-W27-A · World-B wind-down (2026-05-30).
 * Burner FB Marketplace headless scraper · ban-evasion ToS risk ·
 * DO NOT ACTIVATE. Retained @deprecated for git history.
 * Marketplace coverage moves to Apify logged-OUT ($29 cap · Meta v. Bright
 * Data defensible) + Meta Commerce Catalog API (W28).
 */
// fb-army · FB Marketplace headless scraper · World-B only [DEPRECATED W27-A]
// Per-session human-paced · randomized fingerprint · proxy egress
// Parses listing surface · emits canonical CorpusEntry[]
// Reference: WF93 Apify FB Marketplace target surface (same input shape · own engine)

import type { Browser, BrowserContext, Page } from "playwright";
import { chromium } from "playwright";
import {
  rollFingerprint,
  DEFAULT_PACE,
  humanDwell,
  humanScroll,
  type PaceProfile,
} from "../fingerprint.js";
import { loadProxyConfig, loadBurnerSession } from "../proxy-egress.js";
import { makeId, type CorpusEntry } from "../envelope.js";

export type MarketplaceQuery = {
  query: string;         // e.g. "vintage typewriter"
  city: string;          // e.g. "boston"
  daysSinceListed?: number;
  category?: string;
};

export type ScrapeOptions = {
  query: MarketplaceQuery;
  pace?: PaceProfile;
  maxItems?: number;
  fixtureHtml?: string;  // local smoke test · bypass live browser
};

export async function scrapeMarketplace(opts: ScrapeOptions): Promise<CorpusEntry[]> {
  const pace = opts.pace ?? DEFAULT_PACE;
  const maxItems = opts.maxItems ?? pace.maxItemsPerSession;

  // Fixture path · local smoke without live browser
  if (opts.fixtureHtml !== undefined) {
    return parseListingHtml(opts.fixtureHtml, opts.query, maxItems);
  }

  const fp = rollFingerprint();
  const proxy = loadProxyConfig();
  const burner = loadBurnerSession();

  const browser: Browser = await chromium.launch({
    headless: true,
    ...(proxy ? { proxy: { server: proxy.server, ...(proxy.username ? { username: proxy.username } : {}), ...(proxy.password ? { password: proxy.password } : {}) } } : {}),
  });

  try {
    const context: BrowserContext = await browser.newContext({
      userAgent: fp.userAgent,
      viewport: fp.viewport,
      timezoneId: fp.timezoneId,
      locale: fp.locale,
      deviceScaleFactor: fp.deviceScaleFactor,
      extraHTTPHeaders: { "Accept-Language": fp.acceptLanguage },
    });

    if (burner?.cookies?.length) {
      await context.addCookies(burner.cookies);
    }

    const page: Page = await context.newPage();
    const url = buildMarketplaceUrl(opts.query);
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
    await humanDwell(pace);

    // Pull all rendered listing HTML · parse offline
    let html = await page.content();
    // Scroll up to 3 times to load more listings (human-paced)
    for (let scrolls = 0; scrolls < 3; scrolls++) {
      await page.evaluate(() => window.scrollBy(0, window.innerHeight * 0.8));
      await humanScroll(pace);
      html = await page.content();
    }

    return parseListingHtml(html, opts.query, maxItems);
  } finally {
    await browser.close();
  }
}

function buildMarketplaceUrl(q: MarketplaceQuery): string {
  const base = `https://www.facebook.com/marketplace/${encodeURIComponent(q.city)}/search`;
  const params = new URLSearchParams({ query: q.query });
  if (q.daysSinceListed !== undefined) params.set("daysSinceListed", String(q.daysSinceListed));
  if (q.category) params.set("category", q.category);
  return `${base}?${params.toString()}`;
}

// HTML parser · pattern-matches FB Marketplace listing surface
// NOTE: FB surface shifts often · refresh selectors per real-world drift
export function parseListingHtml(
  html: string,
  query: MarketplaceQuery,
  maxItems: number,
): CorpusEntry[] {
  if (!html || html.length < 500) return [];

  const entries: CorpusEntry[] = [];
  const seen = new Set<string>();

  // Title pattern · <span class="...x676frb...">TITLE</span> or generic strong text
  const titlePattern = /<span[^>]*(?:class="[^"]*x676frb[^"]*"|aria-label="[^"]+")[^>]*>([^<]{6,200})<\/span>/g;
  const pricePattern = /\$[\d,]+(?:\.\d{2})?/g;
  const linkPattern = /href="(\/marketplace\/item\/\d+\/[^"]*)"/g;

  const titles = [...html.matchAll(titlePattern)].map((m) => m[1]!.trim());
  const prices = [...html.matchAll(pricePattern)].map((m) => m[0]);
  const links = [...html.matchAll(linkPattern)].map((m) => `https://www.facebook.com${m[1]!}`);

  const count = Math.min(maxItems, Math.max(titles.length, links.length));
  for (let i = 0; i < count; i++) {
    const title = (titles[i] ?? "").slice(0, 200);
    if (!title) continue;
    const link = links[i] ?? "";
    const price = prices[i] ?? "";
    const id = makeId(["marketplace", query.city, query.query, link || title, String(i)]);
    if (seen.has(id)) continue;
    seen.add(id);
    entries.push({
      id,
      title,
      body: `${title}\n\nPrice: ${price}\nCity: ${query.city}\nQuery: ${query.query}\nSource: ${link || "(no permalink)"}`,
      metadata: {
        surface: "fb-marketplace",
        query: query.query,
        city: query.city,
        category: query.category ?? null,
        price,
        permalink: link || null,
        scrapedAt: new Date().toISOString(),
      },
    });
  }

  return entries;
}
