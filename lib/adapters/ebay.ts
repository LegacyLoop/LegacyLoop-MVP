// lib/adapters/ebay.ts
type EbayToken = { access_token: string; expires_in: number; token_type: string };

let cachedToken: { token: string; expMs: number } | null = null;

export type EbayComp = {
  platform: "eBay";
  title: string;
  price: number;
  currency: string;
  url: string;
  shipping?: number;
};

function isSandbox() {
  return (process.env.EBAY_ENVIRONMENT || "").toLowerCase() === "sandbox";
}

function ebayBase() {
  return isSandbox() ? "https://api.sandbox.ebay.com" : "https://api.ebay.com";
}

function normalizeMarketplaceId(raw: string) {
  // Accept "EBAY-US", "EBAY_US", "ebay_us", etc.
  return raw.toUpperCase().replace(/-/g, "_");
}

export async function getEbayAppToken(): Promise<string> {
  const clientId = process.env.EBAY_CLIENT_ID;
  const clientSecret = process.env.EBAY_CLIENT_SECRET;

  if (!clientId || clientId.includes("PASTE_YOUR") || !clientSecret || clientSecret.includes("PASTE_YOUR")) {
    throw new Error("Missing EBAY_CLIENT_ID / EBAY_CLIENT_SECRET in .env");
  }

  if (cachedToken && Date.now() < cachedToken.expMs) return cachedToken.token;

  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const scope = isSandbox()
    ? "https://api.ebay.com/oauth/api_scope"
    : "https://api.ebay.com/oauth/api_scope/buy.browse";

  const body = new URLSearchParams({ grant_type: "client_credentials", scope });

  const res = await fetch(`${ebayBase()}/identity/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  if (!res.ok) {
    const t = await res.text();
    throw new Error(`eBay token error: ${res.status} ${t}`);
  }

  const json = (await res.json()) as EbayToken;
  const expMs = Date.now() + (json.expires_in - 60) * 1000;
  cachedToken = { token: json.access_token, expMs };
  return json.access_token;
}

export async function searchEbayComps(query: string, limit = 8): Promise<EbayComp[]> {
  const token = await getEbayAppToken();
  const rawMarketplace = process.env.EBAY_MARKETPLACE_ID || "EBAY_US";
  const marketplace = normalizeMarketplaceId(rawMarketplace);

  const url =
    `${ebayBase()}/buy/browse/v1/item_summary/search` +
    `?q=${encodeURIComponent(query)}` +
    `&limit=${limit}`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      "X-EBAY-C-MARKETPLACE-ID": marketplace,
      Accept: "application/json",
    },
  });

  if (!res.ok) {
    const t = await res.text();
    throw new Error(`eBay browse search error: ${res.status} ${t}`);
  }

  const data = await res.json();
  const items: any[] = data?.itemSummaries || [];

  const mapped = items.map((it): EbayComp | null => {
    const price = Number(it?.price?.value ?? NaN);
    const currency = String(it?.price?.currency ?? "USD");
    const url = String(it?.itemWebUrl ?? "");
    const title = String(it?.title ?? "");
    const ship = it?.shippingOptions?.[0]?.shippingCost?.value;
    const shipping = ship != null ? Number(ship) : undefined;

    if (!Number.isFinite(price) || !url || !title) return null;

    return {
      platform: "eBay",
      title,
      price,
      currency,
      url,
      shipping: Number.isFinite(shipping) ? shipping : undefined,
    };
  });

  return mapped.filter((x): x is EbayComp => x !== null);
}

// ─── CMD-RECONBOT-API-B: getEbayRateLimits() helper ─────────────
//
// Polls eBay's developer analytics endpoint for the Browse API
// daily quota. Used by lib/market-intelligence/aggregator.ts to
// gate the Phase 0 Browse API swap — when fewer than 500 calls
// remain in the daily window, the aggregator falls back to the
// scraper for that single invocation.
//
// FAIL-OPEN: if the rate-limit endpoint itself errors, assume
// full quota. The safety net is for known-low scenarios, not
// for breaking on transient errors. The 60s in-process cache
// avoids spamming the analytics endpoint on every aggregator
// call.
// ────────────────────────────────────────────────────────────────

export type EbayRateLimits = {
  dailyLimit: number;
  dailyLimitRemaining: number;
  resetTime: string | null;
};

let rateLimitCache: { value: EbayRateLimits; cachedAt: number } | null = null;
const RATE_LIMIT_CACHE_MS = 60_000; // 1 minute

export async function getEbayRateLimits(): Promise<EbayRateLimits> {
  if (rateLimitCache && Date.now() - rateLimitCache.cachedAt < RATE_LIMIT_CACHE_MS) {
    return rateLimitCache.value;
  }
  try {
    const token = await getEbayAppToken();
    const res = await fetch(
      `${ebayBase()}/developer/analytics/v1_beta/rate_limit/?api_name=Browse`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    if (!res.ok) throw new Error(`eBay rate_limit ${res.status}`);
    const data = await res.json();
    const browse = data?.rateLimits?.[0]?.resources?.[0]?.rates?.[0];
    const value: EbayRateLimits = {
      dailyLimit: browse?.limit ?? 5000,
      dailyLimitRemaining: browse?.remaining ?? 5000,
      resetTime: browse?.reset ?? null,
    };
    rateLimitCache = { value, cachedAt: Date.now() };
    return value;
  } catch (err) {
    console.warn("[ebay] getEbayRateLimits failed, assuming full quota:", err);
    return { dailyLimit: 5000, dailyLimitRemaining: 5000, resetTime: null };
  }
}