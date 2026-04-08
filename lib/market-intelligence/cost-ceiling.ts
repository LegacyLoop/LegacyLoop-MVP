/**
 * Cost ceilings enforced per scrape dispatch.
 *
 * Normal scans max at $0.02 Apify spend per call.
 * MegaBot scans add up to $0.05 more on top, with a hard
 * combined cap of $0.07 per call.
 *
 * Tier 1 FREE built-ins are always included (zero cost).
 * Tier 2 + Tier 3 entries are sorted ascending by
 * estimatedCostPerCall and included greedily until the next
 * one would exceed the ceiling.
 *
 * Locked by CMD-SCRAPER-CEILINGS-D2.
 *
 * Updated: 2026-04-08
 * Author: Ryan Hallee
 */

import type { ScraperRegistryEntry } from "./scraper-tiers";

export const CEILINGS = {
  /** Per-scan budget for normal (non-MegaBot) dispatch. */
  normalMax: 0.02,
  /** Additional Tier 3 budget for MegaBot scans. */
  megaBotAddOnMax: 0.05,
  /** Hard total cap for any single scan. */
  combinedMax: 0.07,
} as const;

export interface CeilingDrop {
  entry: ScraperRegistryEntry;
  reason: "ceiling";
  projectedCostAtDrop: number;
}

export interface CeilingResult {
  /** Entries that fit under the applicable cap. */
  allowed: ScraperRegistryEntry[];
  /** Entries dropped because the next one would exceed the cap. */
  dropped: CeilingDrop[];
  /** Sum of estimatedCostPerCall for the allowed entries. */
  projectedCost: number;
}

/**
 * Greedy cost-sorted ceiling enforcement.
 *
 * Algorithm:
 *   1. Always include every Tier 1 / zero-cost entry.
 *   2. In Normal mode (isMegaBot=false), drop every Tier 3 entry
 *      regardless of cost — they are MegaBot-only by design.
 *   3. Sort the remaining paid entries ascending by
 *      estimatedCostPerCall (cheapest first).
 *   4. Iterate the sorted list and include each entry while
 *      `projectedCost + nextCost` stays under the ceiling.
 *   5. Stop the moment the next entry would push us over.
 *      Every remaining entry is recorded as dropped with
 *      reason="ceiling" and the projected cost AT the moment
 *      of the drop (so analytics can attribute the budget
 *      pressure to the right adapter).
 *
 * Cheapest-first preserves breadth: we drop the most expensive
 * adapters last. The Tier 1 FREE pool is always protected.
 *
 * Pure function — no DB, no I/O, no side effects.
 *
 * @param entries Active, non-blocked, non-maintenance scraper
 *                entries already filtered by the aggregator's
 *                dispatchable filter.
 * @param isMegaBot When true, MegaBot add-on budget applies and
 *                  Tier 3 entries are eligible. When false, only
 *                  Tier 1 + Tier 2 with the normalMax cap.
 */
export function enforceCeilings(
  entries: ScraperRegistryEntry[],
  isMegaBot: boolean,
): CeilingResult {
  // Step 1: split free vs paid; in Normal mode skip Tier 3.
  const free: ScraperRegistryEntry[] = [];
  const paid: ScraperRegistryEntry[] = [];
  const dropped: CeilingDrop[] = [];

  for (const entry of entries) {
    const cost = entry.estimatedCostPerCall ?? 0;
    if (cost === 0 || entry.tier === 1) {
      free.push(entry);
      continue;
    }
    if (!isMegaBot && entry.tier === 3) {
      // Tier 3 entries are MegaBot-only — drop without ceiling check
      dropped.push({
        entry,
        reason: "ceiling",
        projectedCostAtDrop: 0,
      });
      continue;
    }
    paid.push(entry);
  }

  // Step 2: sort paid entries ascending by cost.
  const sortedPaid = [...paid].sort(
    (a, b) =>
      (a.estimatedCostPerCall ?? 0) - (b.estimatedCostPerCall ?? 0),
  );

  // Step 3: pick the applicable ceiling.
  const ceiling = isMegaBot ? CEILINGS.combinedMax : CEILINGS.normalMax;

  // Step 4: greedy include while running cost stays under ceiling.
  const allowed: ScraperRegistryEntry[] = [...free];
  let running = 0;

  for (const entry of sortedPaid) {
    const cost = entry.estimatedCostPerCall ?? 0;
    if (running + cost > ceiling) {
      dropped.push({
        entry,
        reason: "ceiling",
        projectedCostAtDrop: running,
      });
      continue;
    }
    allowed.push(entry);
    running += cost;
  }

  return {
    allowed,
    dropped,
    projectedCost: Number(running.toFixed(4)),
  };
}
