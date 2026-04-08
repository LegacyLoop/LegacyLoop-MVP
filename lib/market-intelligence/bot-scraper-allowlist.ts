/**
 * PER-BOT SCRAPER ALLOWLIST — SINGLE SOURCE OF TRUTH
 *
 * Each of LegacyLoop's 10 specialist bots declares exactly which
 * scrapers it is permitted to call. There is no category routing
 * fallback. If a slug is not in a bot's allowlist here, that bot
 * can never fire it.
 *
 * Structure (per bot):
 *   normalAllowlist[]   — Tier 1 + Tier 2 slugs run on Normal scans
 *   megaBotAddOns[]     — Tier 3 slugs run ONLY on MegaBot scans
 *
 * MegaBot inheritance rule:
 *   A MegaBot scan inherits the data from its Normal-tier
 *   counterpart automatically. The aggregator runs the Normal
 *   allowlist first, then ADDS the MegaBot add-ons. No double-
 *   pulls. The 4-AI consensus engine sees the union of both
 *   result sets.
 *
 * Round B CREATES this file. Round C wires the aggregator to
 * consume it. Round D enforces cost ceilings on top of it.
 *
 * Updated: 2026-04-07
 * Author: Ryan Hallee
 */

import {
  getScraperEntry,
  type ScraperRegistryEntry,
} from "./scraper-tiers";

export type BotName =
  | "antiquebot"
  | "listbot"
  | "buyerbot"
  | "reconbot"
  | "pricebot"
  | "analyzebot"
  | "photobot"
  | "carbot"
  | "collectiblesbot"
  | "videobot";

export interface BotScraperAllowlist {
  bot: BotName;
  normalAllowlist: string[];
  megaBotAddOns: string[];
  strategy: string;
}

const antiquebot: BotScraperAllowlist = {
  bot: "antiquebot",
  normalAllowlist: [
    "builtin/ebay-browse-api",
    "builtin/ruby-lane-html",
    "builtin/invaluable-html",
    "builtin/firstdibs-html",
    "builtin/shopgoodwill-html",
    "builtin/liveauctioneers-html",
    "ivanvs/ebay-scraper-pay-per-result",
    "damilo/google-shopping-apify",
    "misterkhan/chrono24-search-scraper",
  ],
  megaBotAddOns: [
    "ivanvs/liveauctioneers-scraper",
    "ivanvs/craigslist-scraper-pay-per-result",
    "parseforge/bringatrailer-auctions-scraper",
  ],
  strategy:
    "6 free antique sources always. Cheap eBay/Google/Chrono24 on Normal. " +
    "Deep LiveAuct + Craigslist + BringATrailer rolled into MegaBot tier.",
};

const listbot: BotScraperAllowlist = {
  bot: "listbot",
  normalAllowlist: [
    "builtin/ebay-browse-api",
    "builtin/craigslist-html",
    "ivanvs/ebay-scraper-pay-per-result",
    "damilo/google-shopping-apify",
    "builtin/reddit-builtin-html",
    "fatihtahta/pinterest-scraper-search",
  ],
  megaBotAddOns: [
    "apify/facebook-marketplace-scraper",
    "ivanvs/craigslist-scraper-pay-per-result",
  ],
  strategy:
    "13-platform listing optimizer. Normal pulls free + cheap social. " +
    "MegaBot adds FB Marketplace + deep Craigslist for richer keyword tuning.",
};

const buyerbot: BotScraperAllowlist = {
  bot: "buyerbot",
  normalAllowlist: [
    "builtin/ebay-browse-api",
    "builtin/craigslist-html",
    "builtin/reddit-builtin-html",
    "fatihtahta/pinterest-scraper-search",
    "apidojo/tweet-scraper",
    "apify/facebook-groups-scraper",
    "saswave/facebook-ads-library-scraper",
  ],
  megaBotAddOns: [
    "apify/facebook-marketplace-scraper",
    "apify/facebook-pages-scraper",
    "ivanvs/craigslist-scraper-pay-per-result",
  ],
  strategy:
    "Cheap social pulls on Normal — Tweet at $0.40/1k is the best signal-to-cost " +
    "ratio. MegaBot adds FB Marketplace + Pages for buyer outreach.",
};

const reconbot: BotScraperAllowlist = {
  bot: "reconbot",
  normalAllowlist: [
    "builtin/ebay-browse-api",
    "builtin/craigslist-html",
    "ivanvs/ebay-scraper-pay-per-result",
    "damilo/google-shopping-apify",
  ],
  megaBotAddOns: [
    "apify/facebook-marketplace-scraper",
    "ivanvs/craigslist-scraper-pay-per-result",
  ],
  strategy:
    "Tight scope. Live competitor listings only. Normal = eBay + Craigslist + " +
    "Google Shopping. MegaBot adds FB Marketplace + deep Craigslist.",
};

const pricebot: BotScraperAllowlist = {
  bot: "pricebot",
  normalAllowlist: [
    "builtin/ebay-browse-api",
    "builtin/ruby-lane-html",
    "builtin/shopgoodwill-html",
    "builtin/liveauctioneers-html",
    "ivanvs/ebay-scraper-pay-per-result",
    "damilo/google-shopping-apify",
  ],
  megaBotAddOns: ["logical_scrapers/amazon-product-scraper"],
  strategy:
    "Pricing engine needs broad sold-comp coverage. 4 free sources always. " +
    "Amazon MegaBot for manufactured-goods reference pricing.",
};

const analyzebot: BotScraperAllowlist = {
  bot: "analyzebot",
  normalAllowlist: ["builtin/ebay-browse-api"],
  megaBotAddOns: [],
  strategy:
    "Vision-first first-pass classifier. Single eBay sanity check. No specialty " +
    "scrapers — handoff bot pulls deeper data. MegaBot inherits Normal + 4-AI consensus.",
};

const photobot: BotScraperAllowlist = {
  bot: "photobot",
  normalAllowlist: [],
  megaBotAddOns: [],
  strategy:
    "Vision-only. No market scrapers. Tier 5 AI generators wired here via " +
    "explicit credit gate in CMD-PHOTOBOT-MEGA — never auto-fire.",
};

const carbot: BotScraperAllowlist = {
  bot: "carbot",
  normalAllowlist: [
    "builtin/ebay-browse-api", // CMD-SCRAPER-CEILINGS-D1: restored after C2 coverage gap (A1 fix)
    "builtin/craigslist-html",
    "fatihtahta/cars-com-scraper",
  ],
  megaBotAddOns: ["parseforge/bringatrailer-auctions-scraper"],
  strategy:
    "eBay Browse API + Cars.com on Normal — eBay Motors covers the wide vehicle " +
    "marketplace, Cars.com is the cheap deep-data workhorse. BringATrailer rolled " +
    "into MegaBot for premium motorcars. Autotrader + Cargurus blocked (monthly subs).",
};

const collectiblesbot: BotScraperAllowlist = {
  bot: "collectiblesbot",
  normalAllowlist: [
    "builtin/ebay-browse-api",
    "piotrv1001/stockx-listings-scraper",
    "devcake/tcgplayer-data-scraper",
    "misterkhan/chrono24-search-scraper",
    "devcake/courtyard-io-scraper",
  ],
  megaBotAddOns: ["logical_scrapers/amazon-product-scraper"],
  strategy:
    "Specialty marketplaces tier-2 priced. StockX (maintenance flag) + " +
    "TCGplayer + Chrono24 + Courtyard on Normal. Amazon MegaBot for reference.",
};

const videobot: BotScraperAllowlist = {
  bot: "videobot",
  normalAllowlist: [
    "clockworks/tiktok-scraper",
    "streamers/youtube-scraper",
    "fatihtahta/pinterest-scraper-search",
  ],
  megaBotAddOns: ["apify/facebook-pages-scraper"],
  strategy:
    "TikTok + YouTube + Pinterest research on Normal. FB Pages MegaBot for " +
    "competitor video research. Tier 5 AI generators wired via separate gate.",
};

export const BOT_SCRAPER_ALLOWLIST: Record<BotName, BotScraperAllowlist> = {
  antiquebot,
  listbot,
  buyerbot,
  reconbot,
  pricebot,
  analyzebot,
  photobot,
  carbot,
  collectiblesbot,
  videobot,
};

// ─── INVARIANT: every allowlist slug must exist in registry ───
{
  const violations: { bot: BotName; slug: string }[] = [];
  for (const bot of Object.values(BOT_SCRAPER_ALLOWLIST)) {
    for (const slug of [...bot.normalAllowlist, ...bot.megaBotAddOns]) {
      if (!getScraperEntry(slug)) {
        violations.push({ bot: bot.bot, slug });
      }
    }
  }
  if (violations.length > 0) {
    console.error(
      "[bot-scraper-allowlist] CRITICAL: missing registry entries:",
      violations
    );
  }
}

// ─── INVARIANT: MegaBot add-ons must all be Tier 3+ ───
{
  const violations: { bot: BotName; slug: string; tier: number }[] = [];
  for (const bot of Object.values(BOT_SCRAPER_ALLOWLIST)) {
    for (const slug of bot.megaBotAddOns) {
      const entry = getScraperEntry(slug);
      if (entry && entry.tier < 3) {
        violations.push({ bot: bot.bot, slug, tier: entry.tier });
      }
    }
  }
  if (violations.length > 0) {
    console.error(
      "[bot-scraper-allowlist] CRITICAL: MegaBot add-ons must be Tier 3+:",
      violations
    );
  }
}

// ─── LOOKUP HELPERS ───
export function getBotAllowlist(bot: BotName): BotScraperAllowlist {
  return BOT_SCRAPER_ALLOWLIST[bot];
}

export function isSlugAllowedForBot(
  bot: BotName,
  slug: string,
  isMegaBot: boolean
): boolean {
  const list = BOT_SCRAPER_ALLOWLIST[bot];
  if (list.normalAllowlist.includes(slug)) return true;
  if (isMegaBot && list.megaBotAddOns.includes(slug)) return true;
  return false;
}

export function getResolvedScrapersForBot(
  bot: BotName,
  isMegaBot: boolean
): ScraperRegistryEntry[] {
  const list = BOT_SCRAPER_ALLOWLIST[bot];
  const slugs = isMegaBot
    ? [...list.normalAllowlist, ...list.megaBotAddOns]
    : list.normalAllowlist;
  return slugs
    .map((slug) => getScraperEntry(slug))
    .filter(
      (e): e is ScraperRegistryEntry =>
        e !== undefined && e.status === "active"
    );
}

export const ALLOWLIST_STATS = {
  totalBots: Object.keys(BOT_SCRAPER_ALLOWLIST).length,
  totalNormalSlots: Object.values(BOT_SCRAPER_ALLOWLIST).reduce(
    (sum, b) => sum + b.normalAllowlist.length,
    0
  ),
  totalMegaBotSlots: Object.values(BOT_SCRAPER_ALLOWLIST).reduce(
    (sum, b) => sum + b.megaBotAddOns.length,
    0
  ),
};
