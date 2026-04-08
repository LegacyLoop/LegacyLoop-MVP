// CMD-SCRAPER-CUSTOM-SCRAPERS: rewritten to use the FREE YouTube
// Data API v3 (search.list endpoint) instead of the paid Apify
// actor. Preserves the YouTubeResult interface and scrapeYoutube
// signature for backward compatibility. Adds a new
// scrapeYoutubeAsScraperResult export for dispatch-map wiring.
//
// API quota: free tier ~10,000 units/day. search.list costs 100
// units/call → ~100 searches/day. Round CEILINGS-D may add a
// secondary videos.list call to fetch view counts (costs 1 unit
// per video, so 10 videos = 10 units extra per search).

import type { ScraperResult } from "../types";
// CMD-SCRAPER-CEILINGS-D2: prisma client for ScraperUsageLog quota count
import { prisma } from "@/lib/db";

export interface YouTubeResult {
  success: boolean;
  videos: { title: string; views: number; likes: number; channelName: string; url: string; publishedAt: string }[];
  totalViews: number;
  demandSignal: "high" | "moderate" | "low" | "none";
}

const EMPTY_RESULT: YouTubeResult = {
  success: false,
  videos: [],
  totalViews: 0,
  demandSignal: "none",
};

let warnedNoKey = false;

// CMD-SCRAPER-CEILINGS-D2: YouTube Data API v3 quota counter.
// Free tier ~10,000 units/day; search.list costs 100 units per call,
// so the practical ceiling is ~100 calls/day. We hard-cap at 80
// (20% buffer) to leave room for the videos.list call a future round
// may add for view counts.
const YOUTUBE_DAILY_CAP = 80;
const QUOTA_CACHE_TTL_MS = 60_000; // 1 minute in-process cache
let quotaCache: { count: number; expiresAt: number } | null = null;

/**
 * Returns the count of successful YouTube Data API v3 calls so far
 * today (UTC). Reads from the in-process cache if fresh, otherwise
 * queries ScraperUsageLog. Fail-open: any DB error returns 0 so
 * YouTube calls still succeed during transient outages.
 */
async function getYoutubeQuotaUsedToday(): Promise<number> {
  const now = Date.now();
  if (quotaCache && quotaCache.expiresAt > now) {
    return quotaCache.count;
  }

  const todayStart = new Date();
  todayStart.setUTCHours(0, 0, 0, 0);

  try {
    const count = await prisma.scraperUsageLog.count({
      where: {
        slug: "streamers/youtube-scraper",
        success: true,
        createdAt: { gte: todayStart },
      },
    });
    quotaCache = { count, expiresAt: now + QUOTA_CACHE_TTL_MS };
    return count;
  } catch {
    // Fail open on DB error — YouTube calls still succeed.
    return 0;
  }
}

export async function scrapeYoutube(query: string, _category?: string): Promise<YouTubeResult> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey || apiKey.length < 10) {
    if (!warnedNoKey) {
      console.warn(
        "[market-intel] YouTube: YOUTUBE_API_KEY missing — set it in .env.local to enable demand signal collection (free Data API v3 tier)",
      );
      warnedNoKey = true;
    }
    return EMPTY_RESULT;
  }

  if (!query || query.trim().length === 0) return EMPTY_RESULT;

  // CMD-SCRAPER-CEILINGS-D2: daily quota soft-cap. Skip the API
  // call entirely once we hit YOUTUBE_DAILY_CAP successful calls
  // for the UTC day. Aggregator-level logScraperUsage will record
  // the upstream skip; this gate just stops the network call.
  const quotaUsed = await getYoutubeQuotaUsedToday();
  if (quotaUsed >= YOUTUBE_DAILY_CAP) {
    console.warn(
      `[market-intel] YouTube daily quota cap hit (${quotaUsed}/${YOUTUBE_DAILY_CAP}) — returning empty`,
    );
    return EMPTY_RESULT;
  }

  try {
    const params = new URLSearchParams({
      part: "snippet",
      type: "video",
      maxResults: "10",
      q: query,
      key: apiKey,
    });
    const url = `https://www.googleapis.com/youtube/v3/search?${params.toString()}`;

    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(10_000),
    });

    if (!res.ok) {
      console.warn(
        `[market-intel] YouTube: HTTP ${res.status} (${res.statusText}) for "${query.slice(0, 40)}"`,
      );
      return EMPTY_RESULT;
    }

    const data: any = await res.json();
    const items: any[] = Array.isArray(data?.items) ? data.items : [];

    const videos = items
      .filter((it: any) => it?.id?.videoId && it?.snippet)
      .map((it: any) => ({
        title: String(it.snippet?.title ?? "").slice(0, 120),
        // search.list does not return view counts; a follow-up
        // videos.list call would cost 1 quota unit per id. Left
        // at 0 until Round CEILINGS-D decides whether the extra
        // quota is worth it.
        views: 0,
        likes: 0,
        channelName: String(it.snippet?.channelTitle ?? ""),
        url: `https://youtube.com/watch?v=${it.id.videoId}`,
        publishedAt: String(it.snippet?.publishedAt ?? ""),
      }))
      .slice(0, 10);

    // Derive demand signal from result count alone (since views
    // are zero without a second API call). 10 results is the max
    // we requested, so a full deck signals "high" interest.
    let demandSignal: YouTubeResult["demandSignal"] = "none";
    if (videos.length >= 8) demandSignal = "high";
    else if (videos.length >= 5) demandSignal = "moderate";
    else if (videos.length >= 1) demandSignal = "low";

    console.log(
      `[market-intel] YouTube (Data API v3): ${videos.length} videos → ${demandSignal} for "${query.slice(0, 40)}"`,
    );
    return { success: videos.length > 0, videos, totalViews: 0, demandSignal };
  } catch (e: any) {
    console.warn("[market-intel] YouTube failed:", e?.message ?? e);
    return EMPTY_RESULT;
  }
}

/**
 * Dispatch-map adapter for the per-bot allowlist path. YouTube
 * returns demand signal (not price comps), so the ScraperResult
 * comps array is intentionally empty. The aggregator's stats math
 * skips empty comps gracefully. A future round can add a
 * demandSignal field to MarketIntelligence to surface the data.
 */
export async function scrapeYoutubeAsScraperResult(
  query: string,
): Promise<ScraperResult> {
  const raw = await scrapeYoutube(query);
  return { success: raw.success, comps: [], source: "YouTube" };
}
