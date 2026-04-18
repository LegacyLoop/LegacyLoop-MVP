/**
 * Uncle Henry's JSON feed adapter.
 *
 * CMD-UNCLE-HENRYS-ADAPTER (command #2 of the local-classifieds trilogy).
 *
 * Implements LocalSourceAdapter. Registers via registerAdapter() at
 * module load — but is triple-gated before any outbound traffic:
 *   (1) this file being imported at all (no one imports it in Phase 2)
 *   (2) registry.uncle_henrys.active === true (defaults false)
 *   (3) LOCAL_CLASSIFIEDS_ENABLED === "true" env (defaults unset)
 *
 * Adapter file exists. Registry flip is HOLD until written permission
 * from privacy@unclehenrys.com arrives; re-fire CMD-UNCLE-HENRYS-ACTIVATE
 * (2-line edit) at that point.
 *
 * Zero-throw contract: every error path returns `success: false`.
 * Schema validator rejects malformed ads without crashing the adapter.
 */

import type {
  LocalSourceAdapter,
  LocalSourceQuery,
  LocalSourceResult,
  LocalListing,
  USState,
} from "../types";
import { registerAdapter } from "../framework";
import { normalizeUncleHenrysCategory } from "../normalizer";

// ─── Constants ──────────────────────────────────────────────────────────

const UNCLEHENRYS_FEED_URL =
  process.env.UNCLEHENRYS_FEED_URL
  || "https://www.unclehenrys.com/ad_stream/feed";

const USER_AGENT =
  "LegacyLoop/1.0 (+https://legacy-loop.com; contact: support@legacy-loop.com)";

const REQUEST_TIMEOUT_MS = 10_000;
const RATE_LIMIT_MS = 500;   // 2 req/sec per MC memo
const DEFAULT_LIMIT = 20;

const US_STATE_SET = new Set<USState>([
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN",
  "IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV",
  "NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN",
  "TX","UT","VT","VA","WA","WV","WI","WY",
]);

// ─── Rate limiter ───────────────────────────────────────────────────────

let lastRequestAt = 0;

async function waitForRateLimit(): Promise<void> {
  const now = Date.now();
  const elapsed = now - lastRequestAt;
  if (elapsed < RATE_LIMIT_MS) {
    await new Promise((r) => setTimeout(r, RATE_LIMIT_MS - elapsed));
  }
  lastRequestAt = Date.now();
}

// ─── Shape validation (manual; Zod-equivalent) ──────────────────────────

interface UncleHenrysCategoryRaw {
  id: number;
  label: string;
}

interface UncleHenrysAttachmentRaw {
  url: string;
}

interface UncleHenrysAdRaw {
  id: number | string;
  title: string;
  body: string;
  price: number | string | null;
  price_modifier?: string | null;
  location?: string | null;
  geo_location?: { lat: number; lng: number } | null;
  categories: UncleHenrysCategoryRaw[];
  attachments?: UncleHenrysAttachmentRaw[] | null;
  business_name?: string | null;
  created_at?: number | string | null;
  updated_at?: number | string | null;
  url?: string | null;
}

function validateAd(raw: unknown): UncleHenrysAdRaw | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;

  // Required: id
  if (r.id == null || (typeof r.id !== "number" && typeof r.id !== "string")) {
    return null;
  }
  // Required: title (non-empty string)
  if (typeof r.title !== "string" || r.title.trim().length === 0) return null;
  // Required: categories array with at least one { id, label }
  if (!Array.isArray(r.categories) || r.categories.length === 0) return null;
  const cats: UncleHenrysCategoryRaw[] = [];
  for (const c of r.categories) {
    if (!c || typeof c !== "object") continue;
    const cc = c as Record<string, unknown>;
    if (typeof cc.id !== "number" || typeof cc.label !== "string") continue;
    cats.push({ id: cc.id, label: cc.label });
  }
  if (cats.length === 0) return null;

  // Optional attachments — filter to well-formed
  let attachments: UncleHenrysAttachmentRaw[] | null = null;
  if (Array.isArray(r.attachments)) {
    const atts: UncleHenrysAttachmentRaw[] = [];
    for (const a of r.attachments) {
      if (!a || typeof a !== "object") continue;
      const aa = a as Record<string, unknown>;
      if (typeof aa.url === "string" && aa.url.trim().length > 0) {
        atts.push({ url: aa.url });
      }
    }
    attachments = atts.length > 0 ? atts : null;
  }

  return {
    id: r.id as number | string,
    title: r.title,
    body: typeof r.body === "string" ? r.body : "",
    price:
      typeof r.price === "number" || typeof r.price === "string"
        ? (r.price as number | string)
        : null,
    price_modifier: typeof r.price_modifier === "string" ? r.price_modifier : null,
    location: typeof r.location === "string" ? r.location : null,
    geo_location:
      r.geo_location && typeof r.geo_location === "object"
        ? (() => {
            const g = r.geo_location as Record<string, unknown>;
            return typeof g.lat === "number" && typeof g.lng === "number"
              ? { lat: g.lat, lng: g.lng }
              : null;
          })()
        : null,
    categories: cats,
    attachments,
    business_name: typeof r.business_name === "string" ? r.business_name : null,
    created_at:
      typeof r.created_at === "number" || typeof r.created_at === "string"
        ? (r.created_at as number | string)
        : null,
    updated_at:
      typeof r.updated_at === "number" || typeof r.updated_at === "string"
        ? (r.updated_at as number | string)
        : null,
    url: typeof r.url === "string" ? r.url : null,
  };
}

// ─── Parsers ────────────────────────────────────────────────────────────

function parsePriceUsd(raw: number | string | null): number | null {
  if (raw == null) return null;
  if (typeof raw === "number") return Number.isFinite(raw) && raw >= 0 ? raw : null;
  // String — strip non-numeric, tolerate decimals
  const cleaned = String(raw).replace(/[^0-9.]/g, "");
  if (!cleaned) return null;
  const n = Number(cleaned);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

function parseLocation(raw: string | null): {
  city: string | null;
  state: USState | null;
  zip: string | null;
} {
  if (!raw) return { city: null, state: null, zip: null };
  // "Blue Hill, ME" | "Blue Hill, ME 04614" | "04614" | "Blue Hill"
  const trimmed = raw.trim();
  const zipMatch = trimmed.match(/\b(\d{5})(?:-\d{4})?\b/);
  const zip = zipMatch ? zipMatch[1] : null;

  // Strip zip then split city/state on last comma
  const noZip = trimmed.replace(/\b\d{5}(?:-\d{4})?\b/, "").trim().replace(/,\s*$/, "");
  const parts = noZip.split(",").map((s) => s.trim()).filter(Boolean);
  let city: string | null = null;
  let state: USState | null = null;
  if (parts.length >= 2) {
    city = parts[0] || null;
    const maybeState = parts[parts.length - 1].toUpperCase();
    if (US_STATE_SET.has(maybeState as USState)) state = maybeState as USState;
  } else if (parts.length === 1) {
    const maybeState = parts[0].toUpperCase();
    if (US_STATE_SET.has(maybeState as USState)) state = maybeState as USState;
    else city = parts[0];
  }
  return { city, state, zip };
}

function parseDate(raw: number | string | null): Date {
  if (raw == null) return new Date();
  if (typeof raw === "number") {
    // Unix seconds or ms heuristic
    const ms = raw < 1e12 ? raw * 1000 : raw;
    const d = new Date(ms);
    return Number.isNaN(d.getTime()) ? new Date() : d;
  }
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? new Date() : d;
}

function inferSellerType(businessName: string | null): LocalListing["sellerType"] {
  if (businessName && businessName.trim().length > 0) return "business";
  return "individual";
}

// ─── Transform ──────────────────────────────────────────────────────────

function mapAdToListing(ad: UncleHenrysAdRaw): LocalListing {
  const primaryCat = ad.categories[0];
  const categoryNormalized = normalizeUncleHenrysCategory(
    primaryCat.id,
    primaryCat.label,
    ad.title,
    ad.body
  );
  const loc = parseLocation(ad.location ?? null);
  const posted = parseDate(ad.created_at ?? ad.updated_at ?? null);
  const photos = (ad.attachments ?? []).map((a) => a.url);
  const sourceListingId = String(ad.id);
  const url =
    ad.url
    || `https://www.unclehenrys.com/classified/${sourceListingId}`;

  return {
    source: "uncle_henrys",
    sourceListingId,
    title: ad.title,
    description: ad.body,
    categoryNormalized,
    categoryRaw: primaryCat.label,
    price: parsePriceUsd(ad.price),
    priceModifier: ad.price_modifier ?? null,
    currency: "USD",
    location: loc,
    geo: ad.geo_location ?? null,
    datePosted: posted,
    photos,
    sellerType: inferSellerType(ad.business_name ?? null),
    url,
    scrapedAt: new Date(),
  };
}

// ─── Adapter ────────────────────────────────────────────────────────────

export const uncleHenrysJsonAdapter: LocalSourceAdapter = {
  slug: "uncle_henrys",
  displayName: "Uncle Henry's (JSON feed)",
  coversStates: ["ME", "NH", "VT", "MA"],
  active: true, // adapter itself is active; outbound traffic gated by
                //   registry.uncle_henrys.active + LOCAL_CLASSIFIEDS_ENABLED

  async fetch(query: LocalSourceQuery): Promise<LocalSourceResult> {
    const started = Date.now();
    const queriedAt = new Date();
    const base: Omit<LocalSourceResult, "listings" | "success" | "durationMs"> = {
      source: "uncle_henrys",
      sourceDisplayName: "Uncle Henry's (JSON feed)",
      queriedAt,
    };

    try {
      await waitForRateLimit();

      const limit = query.limit ?? DEFAULT_LIMIT;
      const sinceUnix = query.sinceUnix ?? 0;
      const url = `${UNCLEHENRYS_FEED_URL}?last_ran=${encodeURIComponent(String(sinceUnix))}&category_id=0&partner=all`;

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

      let res: Response;
      try {
        res = await fetch(url, {
          method: "GET",
          headers: {
            "Accept": "application/json",
            "User-Agent": USER_AGENT,
          },
          signal: controller.signal,
        });
      } finally {
        clearTimeout(timeout);
      }

      if (!res.ok) {
        return {
          ...base,
          success: false,
          listings: [],
          durationMs: Date.now() - started,
          error: `HTTP ${res.status}`,
          metadata: { requestCount: 1 },
        };
      }

      let parsed: unknown;
      try {
        parsed = await res.json();
      } catch {
        return {
          ...base,
          success: false,
          listings: [],
          durationMs: Date.now() - started,
          error: "JSON parse failed",
          metadata: { requestCount: 1 },
        };
      }

      if (!parsed || typeof parsed !== "object" || !Array.isArray((parsed as any).ad_array)) {
        return {
          ...base,
          success: false,
          listings: [],
          durationMs: Date.now() - started,
          error: "unexpected response shape (ad_array missing)",
          metadata: { requestCount: 1 },
        };
      }

      const rawAds = (parsed as any).ad_array as unknown[];
      const validAds: UncleHenrysAdRaw[] = [];
      const unmappedIds = new Map<number, string>();

      for (const raw of rawAds) {
        const ad = validateAd(raw);
        if (!ad) continue;
        validAds.push(ad);
      }

      const allListings = validAds.map(mapAdToListing);

      // Track unmapped category IDs (where normalizer returned "default"
      // AND the raw id isn't in the known map)
      for (const ad of validAds) {
        for (const c of ad.categories) {
          const mapped = normalizeUncleHenrysCategory(c.id, c.label);
          if (mapped === "default") {
            unmappedIds.set(c.id, c.label);
          }
        }
      }
      if (unmappedIds.size > 0) {
        console.warn(
          `[UNCLE_HENRYS_UNMAPPED_ID] ${unmappedIds.size} unmapped category IDs:`,
          Array.from(unmappedIds.entries())
            .slice(0, 10)
            .map(([id, label]) => `${id}=${label}`)
            .join(", ")
        );
      }

      // Filter by requested category (framework query)
      const byCategory = query.category === "default"
        ? allListings
        : allListings.filter((l) => l.categoryNormalized === query.category);

      const bounded = byCategory.slice(0, limit);

      return {
        ...base,
        success: bounded.length > 0,
        listings: bounded,
        durationMs: Date.now() - started,
        error: null,
        metadata: { requestCount: 1, rateLimited: false },
      };
    } catch (err: any) {
      return {
        ...base,
        success: false,
        listings: [],
        durationMs: Date.now() - started,
        error: err?.message ?? String(err),
        metadata: { requestCount: 1 },
      };
    }
  },
};

registerAdapter(uncleHenrysJsonAdapter);
