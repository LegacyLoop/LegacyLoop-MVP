/**
 * CMD-SCRAPER-ENRICHMENT-E
 * ScraperComp cache reader — powers the aggregator's cache-first
 * dispatch. Queries are LIVE (TTL-aware) and fail-open: any DB
 * error returns hit=false so the scrape path runs normally.
 *
 * Match strategy v1: TTL filter + optional category + optional
 * platform + simple substring keyword OR over title.
 *
 * Updated: 2026-04-08
 * Author: Ryan Hallee
 */

import { prisma } from "@/lib/db";
import type { ScraperComp } from "@prisma/client";

export interface EnrichmentCacheQuery {
  category?: string | null;
  keywords?: string[];
  /** Optional override of TTL — currently informational only. */
  maxAgeMs?: number;
  /** Minimum number of fresh comps required for a cache hit. Default 5. */
  minResults?: number;
  /** Optional source platform filter. */
  platform?: string;
}

export interface EnrichmentCacheResult {
  hit: boolean;
  comps: ScraperComp[];
  cachedAt: Date | null;
  freshestAt: Date | null;
  oldestAt: Date | null;
  contributingBots: string[];
}

const EMPTY_RESULT: EnrichmentCacheResult = {
  hit: false,
  comps: [],
  cachedAt: null,
  freshestAt: null,
  oldestAt: null,
  contributingBots: [],
};

/**
 * Query the ScraperComp graph for fresh comps matching the given
 * category + keywords + platform filters. Always returns a result
 * — failures are swallowed and produce hit=false so callers can
 * fall through to the live scraper path.
 */
export async function queryEnrichmentCache(
  q: EnrichmentCacheQuery,
): Promise<EnrichmentCacheResult> {
  const minResults = q.minResults ?? 5;

  try {
    const where: any = {
      ttlExpiresAt: { gt: new Date() },
    };

    if (q.category) {
      where.category = q.category;
    }

    if (q.platform) {
      where.sourcePlatform = q.platform;
    }

    if (q.keywords && q.keywords.length > 0) {
      // Simple substring OR over title — SQLite full-text would be
      // overkill for v1 and we already filter by category which is
      // the strong selectivity signal.
      where.OR = q.keywords.map((kw) => ({
        title: { contains: kw },
      }));
    }

    const comps = await prisma.scraperComp.findMany({
      where,
      orderBy: { lastSeenAt: "desc" },
      take: 20,
    });

    if (comps.length < minResults) {
      return EMPTY_RESULT;
    }

    // Aggregate freshestAt + oldestAt + unique contributing bots
    let freshestAt: Date | null = null;
    let oldestAt: Date | null = null;
    const contributorSet = new Set<string>();

    for (const c of comps) {
      const seen = c.lastSeenAt;
      if (freshestAt == null || seen > freshestAt) freshestAt = seen;
      if (oldestAt == null || seen < oldestAt) oldestAt = seen;

      if (c.contributorBotsJson) {
        try {
          const parsed = JSON.parse(c.contributorBotsJson);
          if (Array.isArray(parsed)) {
            for (const bot of parsed) {
              if (typeof bot === "string") contributorSet.add(bot);
            }
          }
        } catch {
          // ignore malformed
        }
      }
    }

    return {
      hit: true,
      comps,
      cachedAt: new Date(),
      freshestAt,
      oldestAt,
      contributingBots: Array.from(contributorSet),
    };
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn("[enrichment-cache] query failed (fail-open):", msg);
    }
    return EMPTY_RESULT;
  }
}
