// fb-army · FB Groups headless scraper · World-B only
// Reference: WF94 Apify FB Groups target surface (same input · own engine)

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

export type GroupQuery = {
  groupId: string;     // numeric FB group id (e.g. "1234567890")
  groupName?: string;  // display tag
  maxPosts?: number;
};

export type ScrapeOptions = {
  query: GroupQuery;
  pace?: PaceProfile;
  fixtureHtml?: string;
};

export async function scrapeGroup(opts: ScrapeOptions): Promise<CorpusEntry[]> {
  const pace = opts.pace ?? DEFAULT_PACE;
  const maxPosts = opts.query.maxPosts ?? pace.maxItemsPerSession;

  if (opts.fixtureHtml !== undefined) {
    return parseGroupHtml(opts.fixtureHtml, opts.query, maxPosts);
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
    const url = `https://www.facebook.com/groups/${encodeURIComponent(opts.query.groupId)}`;
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
    await humanDwell(pace);

    let html = await page.content();
    for (let scrolls = 0; scrolls < 3; scrolls++) {
      await page.evaluate(() => window.scrollBy(0, window.innerHeight * 0.85));
      await humanScroll(pace);
      html = await page.content();
    }

    return parseGroupHtml(html, opts.query, maxPosts);
  } finally {
    await browser.close();
  }
}

export function parseGroupHtml(
  html: string,
  query: GroupQuery,
  maxPosts: number,
): CorpusEntry[] {
  if (!html || html.length < 500) return [];

  const entries: CorpusEntry[] = [];
  const seen = new Set<string>();

  // Post body pattern · FB post wrapper `<div data-ad-comet-preview="message">TEXT</div>`
  // Plus generic span fallback for non-message posts
  const postPattern = /<div[^>]*data-ad-comet-preview="message"[^>]*>([\s\S]{20,2000}?)<\/div>/g;
  const fallbackPattern = /<span[^>]*data-ad-rendering-role="story_message"[^>]*>([\s\S]{20,2000}?)<\/span>/g;
  const permalinkPattern = /href="(\/groups\/\d+\/posts\/\d+\/[^"]*)"/g;

  const rawPosts = [...html.matchAll(postPattern), ...html.matchAll(fallbackPattern)].map((m) =>
    stripTags(m[1]!).trim(),
  );
  const permalinks = [...html.matchAll(permalinkPattern)].map((m) => `https://www.facebook.com${m[1]!}`);

  const count = Math.min(maxPosts, rawPosts.length);
  for (let i = 0; i < count; i++) {
    const text = (rawPosts[i] ?? "").slice(0, 2000);
    if (!text) continue;
    const title = text.split(/[.!?\n]/)[0]!.trim().slice(0, 200);
    if (!title) continue;
    const link = permalinks[i] ?? "";
    const id = makeId(["groups", query.groupId, link || title, String(i)]);
    if (seen.has(id)) continue;
    seen.add(id);
    entries.push({
      id,
      title,
      body: `${text}\n\nGroup: ${query.groupName ?? query.groupId}\nSource: ${link || "(no permalink)"}`,
      metadata: {
        surface: "fb-groups",
        groupId: query.groupId,
        groupName: query.groupName ?? null,
        permalink: link || null,
        scrapedAt: new Date().toISOString(),
      },
    });
  }

  return entries;
}

function stripTags(s: string): string {
  return s.replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ");
}
