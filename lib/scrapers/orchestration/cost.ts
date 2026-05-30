// CMD-W27-A · Generic cost-per-record optimizer
// Originally lifted from lib/scrapers/rotation/cost.ts (W23-L1).
// Telemetry-driven cheapest-healthy selector. Pure logic · no I/O.

import type { FetchOutcome, ProngCost } from "./types";

/** Fresh cost telemetry (zero spend · zero records) */
export function initialCost(): ProngCost {
  return {
    totalSpendUsd: 0,
    totalRecords: 0,
    costPerRecord: Number.NaN,
  };
}

/** Update telemetry given a fetch outcome · pure */
export function accumulate(prev: ProngCost, outcome: FetchOutcome): ProngCost {
  const spend = (outcome.costUsd ?? 0) + prev.totalSpendUsd;
  const records = (outcome.recordsReturned ?? 0) + prev.totalRecords;
  const cpr = records > 0 ? spend / records : Number.NaN;
  return {
    totalSpendUsd: spend,
    totalRecords: records,
    costPerRecord: cpr,
  };
}

/**
 * Compare two costs · returns the cheaper one.
 * NaN cost-per-record (no records yet) treated as "unknown" — defers to peer
 * with real data. If both NaN, returns `a`.
 */
export function cheaper(a: ProngCost, b: ProngCost): "a" | "b" {
  const aN = Number.isNaN(a.costPerRecord);
  const bN = Number.isNaN(b.costPerRecord);
  if (aN && bN) return "a";
  if (aN) return "b";
  if (bN) return "a";
  return a.costPerRecord <= b.costPerRecord ? "a" : "b";
}

/** Total spend across an iterable of cost telemetries · used by budget guard */
export function sumSpend(costs: ReadonlyArray<ProngCost>): number {
  let total = 0;
  for (const c of costs) total += c.totalSpendUsd;
  return total;
}
