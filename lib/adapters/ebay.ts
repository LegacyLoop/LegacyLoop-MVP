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