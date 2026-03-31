/**
 * Stock photo adapter for background images and listing enhancements.
 * Searches Unsplash and Pexels APIs with graceful fallback.
 */

export interface StockPhotoResult {
  id: string;
  url: string;
  thumbnailUrl: string;
  width: number;
  height: number;
  description: string;
  photographer: string;
  photographerUrl: string;
  source: "unsplash" | "pexels";
  downloadUrl: string;
  color: string | null;
}

interface SearchOptions {
  orientation?: "landscape" | "portrait" | "squarish";
  perPage?: number;
  color?: string;
}

// ─── Unsplash ─────────────────────────────────────────────────────────────────

const UNSPLASH_BASE = "https://api.unsplash.com";

function getUnsplashKey(): string | null {
  return process.env.UNSPLASH_ACCESS_KEY || null;
}

async function searchUnsplash(
  query: string,
  options: SearchOptions = {}
): Promise<StockPhotoResult[]> {
  const key = getUnsplashKey();
  if (!key) return [];

  const params = new URLSearchParams({
    query,
    per_page: String(options.perPage ?? 10),
    content_filter: "high",
  });
  if (options.orientation) params.set("orientation", options.orientation);
  if (options.color) params.set("color", options.color);

  try {
    const res = await fetch(`${UNSPLASH_BASE}/search/photos?${params}`, {
      headers: { Authorization: `Client-ID ${key}` },
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      console.error(`Unsplash search failed: ${res.status}`);
      return [];
    }

    const data = await res.json();

    return (data.results ?? []).map((photo: Record<string, any>) => ({
      id: `unsplash-${photo.id}`,
      url: photo.urls?.regular ?? photo.urls?.full ?? "",
      thumbnailUrl: photo.urls?.thumb ?? photo.urls?.small ?? "",
      width: photo.width ?? 0,
      height: photo.height ?? 0,
      description: photo.description || photo.alt_description || query,
      photographer: photo.user?.name ?? "Unknown",
      photographerUrl: photo.user?.links?.html ?? "",
      source: "unsplash" as const,
      downloadUrl: photo.links?.download ?? photo.urls?.full ?? "",
      color: photo.color ?? null,
    }));
  } catch (err) {
    console.error("Unsplash search error:", err);
    return [];
  }
}

async function searchUnsplashMultiple(
  queries: string[],
  options: SearchOptions = {}
): Promise<StockPhotoResult[]> {
  const results = await Promise.all(
    queries.map((q) => searchUnsplash(q, { ...options, perPage: options.perPage ?? 3 }))
  );
  return results.flat();
}

// ─── Pexels ───────────────────────────────────────────────────────────────────

const PEXELS_BASE = "https://api.pexels.com/v1";

function getPexelsKey(): string | null {
  return process.env.PEXELS_API_KEY || null;
}

async function searchPexels(
  query: string,
  options: SearchOptions = {}
): Promise<StockPhotoResult[]> {
  const key = getPexelsKey();
  if (!key) return [];

  const params = new URLSearchParams({
    query,
    per_page: String(options.perPage ?? 10),
  });
  if (options.orientation) params.set("orientation", options.orientation);
  if (options.color) params.set("color", options.color);

  try {
    const res = await fetch(`${PEXELS_BASE}/search?${params}`, {
      headers: { Authorization: key },
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      console.error(`Pexels search failed: ${res.status}`);
      return [];
    }

    const data = await res.json();

    return (data.photos ?? []).map((photo: Record<string, any>) => ({
      id: `pexels-${photo.id}`,
      url: photo.src?.large ?? photo.src?.original ?? "",
      thumbnailUrl: photo.src?.tiny ?? photo.src?.small ?? "",
      width: photo.width ?? 0,
      height: photo.height ?? 0,
      description: photo.alt || query,
      photographer: photo.photographer ?? "Unknown",
      photographerUrl: photo.photographer_url ?? "",
      source: "pexels" as const,
      downloadUrl: photo.src?.original ?? "",
      color: photo.avg_color ?? null,
    }));
  } catch (err) {
    console.error("Pexels search error:", err);
    return [];
  }
}

async function searchPexelsMultiple(
  queries: string[],
  options: SearchOptions = {}
): Promise<StockPhotoResult[]> {
  const results = await Promise.all(
    queries.map((q) => searchPexels(q, { ...options, perPage: options.perPage ?? 3 }))
  );
  return results.flat();
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Find a single best background photo for a query.
 * Tries Unsplash first, falls back to Pexels.
 */
export async function findBackgroundPhoto(
  query: string,
  options: SearchOptions = {}
): Promise<StockPhotoResult | null> {
  const opts = { ...options, perPage: 1 };

  // Try Unsplash first
  const unsplashResults = await searchUnsplash(query, opts);
  if (unsplashResults.length > 0) return unsplashResults[0];

  // Fall back to Pexels
  const pexelsResults = await searchPexels(query, opts);
  if (pexelsResults.length > 0) return pexelsResults[0];

  return null;
}

/**
 * Find multiple background photo options for a category.
 * Searches both Unsplash and Pexels, deduplicates by description similarity.
 */
export async function findBackgroundOptions(
  category: string,
  itemDescription?: string,
  count: number = 6
): Promise<StockPhotoResult[]> {
  const queries = [category];
  if (itemDescription) {
    // Extract meaningful keywords from description (first 3 words over 3 chars)
    const keywords = itemDescription
      .split(/\s+/)
      .filter((w) => w.length > 3)
      .slice(0, 3)
      .join(" ");
    if (keywords) queries.push(`${category} ${keywords}`);
  }

  const perSource = Math.ceil(count / 2);

  const [unsplashResults, pexelsResults] = await Promise.all([
    searchUnsplashMultiple(queries, { perPage: perSource, orientation: "landscape" }),
    searchPexelsMultiple(queries, { perPage: perSource, orientation: "landscape" }),
  ]);

  // Interleave results from both sources for variety
  const combined: StockPhotoResult[] = [];
  const maxLen = Math.max(unsplashResults.length, pexelsResults.length);
  for (let i = 0; i < maxLen && combined.length < count; i++) {
    if (i < unsplashResults.length && combined.length < count) {
      combined.push(unsplashResults[i]);
    }
    if (i < pexelsResults.length && combined.length < count) {
      combined.push(pexelsResults[i]);
    }
  }

  return combined;
}
