/**
 * Rainforest API Adapter — Amazon Product Search
 *
 * Provides Amazon product data for enrichment.
 * Every public function returns null on failure — never throws.
 * All other files call this adapter — never call Rainforest directly.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface RainforestSearchResult {
  asin: string;
  title: string;
  price: number | null;
  currency: string;
  rating: number | null;
  ratingsTotal: number | null;
  condition: string;
  seller: string;
  isPrime: boolean;
  link: string;
  image: string;
}

export interface RainforestEnrichmentData {
  searchTerm: string;
  results: RainforestSearchResult[];
  priceRange: {
    low: number;
    high: number;
    avg: number;
    median: number;
  };
  topResult: RainforestSearchResult | null;
  resultCount: number;       // how many results we processed (capped for price calc)
  totalResults: number;      // actual total Amazon returned (the REAL number)
  fetchedAt: string;         // ISO string for JSON serialization
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const CONDITION_STRIP_WORDS = /\b(used|vintage|antique|worn|damaged|broken|old|estate|pre-owned|refurbished|as-is|parts|for parts)\b/gi;

export function buildSearchTerm(
  itemTitle: string,
  category?: string,
  brand?: string
): string {
  const parts: string[] = [];
  if (brand && brand !== "Unknown") parts.push(brand);
  parts.push(itemTitle.replace(CONDITION_STRIP_WORDS, "").replace(/\s+/g, " ").trim());
  if (category && category !== "General" && !itemTitle.toLowerCase().includes(category.toLowerCase())) {
    parts.push(category);
  }
  return parts.join(" ").trim().slice(0, 80);
}

function median(nums: number[]): number {
  const sorted = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

// ─── API calls ────────────────────────────────────────────────────────────────

const BASE_URL = "https://api.rainforestapi.com/request";
const TIMEOUT_MS = 25000;

export async function searchAmazon(
  searchTerm: string,
  options?: { maxResults?: number; amazonDomain?: string }
): Promise<RainforestEnrichmentData | null> {
  const apiKey = process.env.RAINFOREST_API_KEY;
  if (!apiKey || apiKey.length < 10) {
    console.log("[Rainforest] No API key configured — skipping Amazon search");
    return null;
  }

  const maxResults = options?.maxResults ?? 10;
  const domain = options?.amazonDomain ?? "amazon.com";

  const params = new URLSearchParams({
    api_key: apiKey,
    type: "search",
    amazon_domain: domain,
    search_term: searchTerm,
    output: "json",
  });

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    console.log(`[Rainforest] Searching Amazon: "${searchTerm}"`);
    const res = await fetch(`${BASE_URL}?${params.toString()}`, {
      signal: controller.signal,
    });
    clearTimeout(timer);

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.error(`[Rainforest] API error ${res.status}: ${text.slice(0, 200)}`);
      return null;
    }

    const json = await res.json();
    const rawResults: any[] = json.search_results || [];

    // Grab the REAL total from Amazon's search metadata (not our capped slice)
    const amazonTotal: number =
      json.search_information?.total_results ??
      json.search_information?.total ??
      rawResults.length;

    if (rawResults.length === 0) {
      console.log("[Rainforest] No search results returned");
      return null;
    }

    const results: RainforestSearchResult[] = rawResults
      .slice(0, maxResults)
      .map((r: any) => ({
        asin: r.asin || "",
        title: r.title || "",
        price: r.price?.value ?? r.price?.raw ? parseFloat(String(r.price.raw).replace(/[^0-9.]/g, "")) : null,
        currency: r.price?.currency || "USD",
        rating: r.rating ?? null,
        ratingsTotal: r.ratings_total ?? null,
        condition: "New",
        seller: r.seller_name || r.merchant?.name || "Amazon",
        isPrime: r.is_prime ?? false,
        link: r.link || `https://amazon.com/dp/${r.asin || ""}`,
        image: r.image || "",
      }));

    // Calculate price range from results with valid prices
    const prices = results.map((r) => r.price).filter((p): p is number => p != null && p > 0);

    if (prices.length === 0) {
      console.log("[Rainforest] Results found but no valid prices");
      return null;
    }

    const sorted = [...prices].sort((a, b) => a - b);
    const avg = Math.round((prices.reduce((s, p) => s + p, 0) / prices.length) * 100) / 100;

    const data: RainforestEnrichmentData = {
      searchTerm,
      results,
      priceRange: {
        low: sorted[0],
        high: sorted[sorted.length - 1],
        avg,
        median: Math.round(median(prices) * 100) / 100,
      },
      topResult: results[0] || null,
      resultCount: results.length,
      totalResults: amazonTotal,   // the REAL count Amazon reported
      fetchedAt: new Date().toISOString(),
    };

    console.log(
      `[Rainforest] Found ${amazonTotal} total on Amazon (${results.length} processed). Price range: $${data.priceRange.low}–$${data.priceRange.high} (avg: $${avg})`
    );

    return data;
  } catch (err: any) {
    clearTimeout(timer);
    if (err.name === "AbortError") {
      console.error("[Rainforest] Request timed out after 8s");
    } else {
      console.error("[Rainforest] Search failed:", err.message || err);
    }
    return null;
  }
}

export async function getAmazonProduct(
  asin: string
): Promise<RainforestSearchResult | null> {
  const apiKey = process.env.RAINFOREST_API_KEY;
  if (!apiKey || apiKey.length < 10) return null;

  const params = new URLSearchParams({
    api_key: apiKey,
    type: "product",
    asin,
    amazon_domain: "amazon.com",
    output: "json",
  });

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(`${BASE_URL}?${params.toString()}`, {
      signal: controller.signal,
    });
    clearTimeout(timer);

    if (!res.ok) return null;

    const json = await res.json();
    const p = json.product;
    if (!p) return null;

    return {
      asin: p.asin || asin,
      title: p.title || "",
      price: p.buybox_winner?.price?.value ?? null,
      currency: p.buybox_winner?.price?.currency || "USD",
      rating: p.rating ?? null,
      ratingsTotal: p.ratings_total ?? null,
      condition: p.buybox_winner?.condition?.is_new ? "New" : "Used",
      seller: p.buybox_winner?.seller_name || "Amazon",
      isPrime: p.buybox_winner?.is_prime ?? false,
      link: p.link || `https://amazon.com/dp/${asin}`,
      image: p.main_image?.link || "",
    };
  } catch {
    clearTimeout(timer);
    return null;
  }
}
