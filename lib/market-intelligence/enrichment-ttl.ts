/**
 * CMD-SCRAPER-ENRICHMENT-E
 * Per-category TTL configuration for the ScraperComp knowledge graph.
 *
 * Each category has its own freshness window. Antiques + art change
 * slowly (30d), electronics rotate fast (3d), cars sit between (7d).
 * The aggregator's cache-first dispatch only serves comps whose
 * ttlExpiresAt is in the future.
 *
 * Updated: 2026-04-08
 * Author: Ryan Hallee
 */

export const CATEGORY_TTLS_DAYS: Record<string, number> = {
  antiques: 30,
  art: 30,
  jewelry: 21,
  furniture: 21,
  collectibles: 14,
  coins: 14,
  sports_cards: 14,
  comics: 14,
  clothing: 10,
  books: 14,
  music: 14,
  tools: 10,
  cars: 7,
  vehicles: 7,
  electronics: 3,
  appliances: 5,
  default: 14,
};

/**
 * Compute the absolute expiry timestamp for a comp in the given
 * category. Falls back to the "default" TTL when the category is
 * null/undefined or not present in CATEGORY_TTLS_DAYS.
 */
export function ttlForCategory(category: string | null | undefined): Date {
  const key = category?.toLowerCase() ?? "default";
  const days = CATEGORY_TTLS_DAYS[key] ?? CATEGORY_TTLS_DAYS.default;
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
}
