/**
 * BLOCKED ACTORS REGISTRY — DO NOT EDIT WITHOUT EXPLICIT APPROVAL
 *
 * These Apify actors are PERMANENTLY BLOCKED from running in any
 * LegacyLoop production code path. Any attempt to fire them will
 * be intercepted by the kill switch in scraper-killswitch.ts and
 * return an empty result with a console warning.
 *
 * To unblock an actor, an explicit V15 command must:
 *   1. Justify the unblock with margin math
 *   2. Add it to a per-bot allowlist
 *   3. Add a hard cost ceiling
 *   4. Update this file with a removal date and approver
 *
 * Updated: 2026-04-07
 * Author: Ryan Hallee
 */

export interface BlockedActor {
  apifySlug: string;
  displayName: string;
  reason: "monthly_subscription" | "dangerous_cost" | "under_maintenance";
  costNote: string;
  blockedSince: string;
}

export const BLOCKED_ACTORS: BlockedActor[] = [
  // ─── GROUP 1: Monthly subscription scrapers (7) ───
  {
    apifySlug: "epctex/autotrader-scraper",
    displayName: "Autotrader Scraper",
    reason: "monthly_subscription",
    costNote: "$15/month + usage",
    blockedSince: "2026-04-07",
  },
  {
    apifySlug: "lexis-solutions/cargurus-com",
    displayName: "Cargurus.com Scraper",
    reason: "monthly_subscription",
    costNote: "$29/month + usage",
    blockedSince: "2026-04-07",
  },
  {
    apifySlug: "epctex/etsy-scraper",
    displayName: "Etsy Scraper",
    reason: "monthly_subscription",
    costNote: "$30/month + usage",
    blockedSince: "2026-04-07",
  },
  {
    apifySlug: "lexis-solutions/tiktok-ads-scraper",
    displayName: "TikTok Ads Scraper",
    reason: "monthly_subscription",
    costNote: "$30/month + usage",
    blockedSince: "2026-04-07",
  },
  {
    apifySlug: "lexis-solutions/tiktok-trending-songs-scraper",
    displayName: "TikTok Trending Songs Scraper",
    reason: "monthly_subscription",
    costNote: "$39/month + usage",
    blockedSince: "2026-04-07",
  },
  {
    apifySlug: "actums/ai-ugc-video-maker",
    displayName: "AI UGC Video Maker",
    reason: "under_maintenance",
    costNote: "$47/month + usage",
    blockedSince: "2026-04-07",
  },
  {
    apifySlug: "ecomscrape/goat-product-search-scraper",
    displayName: "Goat Product Search Scraper",
    reason: "monthly_subscription",
    costNote: "$15/month + usage",
    blockedSince: "2026-04-07",
  },

  // ─── GROUP 2: Dangerous high-cost actors (5) ───
  {
    apifySlug: "powerai/sothebys-search-scraper",
    displayName: "Sotheby's Search Scraper",
    reason: "dangerous_cost",
    costNote: "Pay per usage — UNKNOWN CEILING",
    blockedSince: "2026-04-07",
  },
  {
    apifySlug: "peaceful_pushpins/ai-video-ads-generator",
    displayName: "AI Video Ads Generator",
    reason: "dangerous_cost",
    costNote: "$500/1,000 results",
    blockedSince: "2026-04-07",
  },
  {
    apifySlug: "peaceful_pushpins/AI-Video-to-Voiceover-Generator",
    displayName: "AI Video to Voiceover Generator",
    reason: "dangerous_cost",
    costNote: "$750/1,000 results",
    blockedSince: "2026-04-07",
  },
  {
    apifySlug: "manju4k/social-media-trend-scraper-6-in-1-ai-analysis",
    displayName: "Social Media Trend Scraper 6-in-1 AI Analysis",
    reason: "dangerous_cost",
    costNote: "$750/1,000 per_runs",
    blockedSince: "2026-04-07",
  },
  {
    apifySlug: "peaceful_pushpins/ai-ad-music-factory",
    displayName: "AI Ad Music Factory",
    reason: "dangerous_cost",
    costNote: "$3,500/1,000 results",
    blockedSince: "2026-04-07",
  },
];

export const BLOCKED_SLUGS = new Set(
  BLOCKED_ACTORS.map((a) => a.apifySlug.toLowerCase())
);

export function isSlugBlocked(slug: string): boolean {
  return BLOCKED_SLUGS.has(slug.toLowerCase());
}

export function getBlockedActor(slug: string): BlockedActor | undefined {
  return BLOCKED_ACTORS.find(
    (a) => a.apifySlug.toLowerCase() === slug.toLowerCase()
  );
}
