// Pinterest demand-intel client — typed, rate-limit aware, ToS-safe.
// W25-META-L4 · Track A · FREE tier (Standard: 100 req/sec).
//
// Doctrine:
// - Pinterest API 2026 ToS: NO long-term storage of Pinterest data. We keep
//   only a derived demand signal in a transient in-memory cache (short TTL,
//   ephemeral per-process) — never written to DB or disk.
// - Graceful no-token degrade: if PINTEREST_ACCESS_TOKEN is absent the client
//   returns a clean `unavailable` signal with tokenMissing=true. It NEVER
//   makes a half-wired live call. (W25-META-L4 §0.5: token absent in env.)
// - Zero Apify: this arm is direct Pinterest API only (Apify cap-saturated).

import type {
  PinterestDemandResult,
  PinterestDemandSignal,
  PinterestRegion,
  DemandTrend,
} from "./types";

const PINTEREST_API_BASE = "https://api.pinterest.com/v5";
const DEFAULT_REGION: PinterestRegion = "US";

/** Transient cache TTL — short, ephemeral. ToS no-storage compliant. */
const CACHE_TTL_MS = 1000 * 60 * 60 * 6; // 6h in-memory only
/** Soft client-side rate guard (well under 100 req/sec free tier). */
const MIN_REQUEST_INTERVAL_MS = 250;

interface CacheEntry {
  signal: PinterestDemandSignal;
  expiresAt: number;
}

// Process-local, ephemeral. Cleared on cold start. Never persisted.
const transientCache = new Map<string, CacheEntry>();
let lastRequestAt = 0;

function getToken(): string | null {
  const t = process.env.PINTEREST_ACCESS_TOKEN;
  return t && t.trim().length > 0 ? t.trim() : null;
}

function normalizeCategory(raw: string): string {
  return raw.trim().toLowerCase().replace(/\s+/g, " ").slice(0, 120);
}

function cacheKey(category: string, region: PinterestRegion): string {
  return `${region}:${category}`;
}

function unavailableSignal(
  category: string,
  region: PinterestRegion,
  note: string,
): PinterestDemandSignal {
  return {
    category,
    region,
    interestScore: null,
    trend: "unknown",
    relatedKeywords: [],
    computedAt: new Date().toISOString(),
    source: "unavailable",
    note,
  };
}

/** Map a raw Pinterest Trends index series to a coarse trend direction. */
function deriveTrend(series: number[]): DemandTrend {
  if (series.length < 2) return "unknown";
  const first = series[0];
  const last = series[series.length - 1];
  if (first === 0 && last === 0) return "unknown";
  const delta = last - first;
  const pct = first === 0 ? 100 : (delta / first) * 100;
  if (pct >= 10) return "rising";
  if (pct <= -10) return "falling";
  return "steady";
}

interface PinterestTrendsResponse {
  trends?: Array<{
    keyword?: string;
    interest?: number;
    time_series?: Array<{ value?: number }>;
    related_keywords?: string[];
  }>;
}

/**
 * Fetch a derived Pinterest demand signal for an item category.
 * Never throws — returns a typed envelope with degrade flags.
 */
export async function getDemandSignal(
  rawCategory: string,
  region: PinterestRegion = DEFAULT_REGION,
): Promise<PinterestDemandResult> {
  const category = normalizeCategory(rawCategory);

  if (!category) {
    return {
      ok: false,
      tokenMissing: getToken() === null,
      rateLimited: false,
      signal: unavailableSignal("", region, "Empty category."),
    };
  }

  // Transient cache hit (ToS-safe: derived signal only, ephemeral).
  const key = cacheKey(category, region);
  const cached = transientCache.get(key);
  if (cached && cached.expiresAt > Date.now()) {
    return { ok: true, tokenMissing: false, rateLimited: false, signal: cached.signal };
  }

  const token = getToken();
  if (token === null) {
    // Build-structure-only mode: no token → clean degrade, no live call.
    return {
      ok: false,
      tokenMissing: true,
      rateLimited: false,
      signal: unavailableSignal(
        category,
        region,
        "PINTEREST_ACCESS_TOKEN not configured — demand intel inactive. Awaiting CEO token paste.",
      ),
    };
  }

  // Soft client-side rate guard.
  const sinceLast = Date.now() - lastRequestAt;
  if (sinceLast < MIN_REQUEST_INTERVAL_MS) {
    await new Promise((r) => setTimeout(r, MIN_REQUEST_INTERVAL_MS - sinceLast));
  }
  lastRequestAt = Date.now();

  try {
    const url = new URL(`${PINTEREST_API_BASE}/trends/keywords/${region}/top`);
    url.searchParams.set("trend_type", "growing");
    url.searchParams.set("search_term", category);
    url.searchParams.set("limit", "10");

    const res = await fetch(url.toString(), {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
      // Pinterest data must not be cached by the fetch layer (ToS no-storage).
      cache: "no-store",
    });

    if (res.status === 429) {
      return {
        ok: false,
        tokenMissing: false,
        rateLimited: true,
        signal: unavailableSignal(category, region, "Pinterest rate limit (429). Retry later."),
      };
    }

    if (!res.ok) {
      return {
        ok: false,
        tokenMissing: false,
        rateLimited: false,
        signal: unavailableSignal(category, region, `Pinterest API ${res.status}.`),
      };
    }

    const body = (await res.json()) as PinterestTrendsResponse;
    const top = body.trends?.[0];
    const series = (top?.time_series ?? [])
      .map((p) => (typeof p.value === "number" ? p.value : 0));

    const signal: PinterestDemandSignal = {
      category,
      region,
      interestScore: typeof top?.interest === "number" ? top.interest : null,
      trend: deriveTrend(series),
      relatedKeywords: (top?.related_keywords ?? []).slice(0, 8),
      computedAt: new Date().toISOString(),
      source: "pinterest-trends",
    };

    // Transient cache only — derived signal, ephemeral, never persisted.
    transientCache.set(key, { signal, expiresAt: Date.now() + CACHE_TTL_MS });

    return { ok: true, tokenMissing: false, rateLimited: false, signal };
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown error";
    return {
      ok: false,
      tokenMissing: false,
      rateLimited: false,
      signal: unavailableSignal(category, region, `Pinterest fetch failed: ${message}`),
    };
  }
}

/** Test/maintenance helper — clears the transient cache. */
export function clearDemandCache(): void {
  transientCache.clear();
}
