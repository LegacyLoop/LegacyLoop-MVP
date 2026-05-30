// CMD-W27-A · Generic prong health state + block-signal classifier
// Originally lifted from lib/scrapers/rotation/health.ts (W23-L1).
// Pure logic · no external HTTP. Inputs come from FetchOutcome telemetry.

import type { BlockSignal, FetchOutcome, ProngHealth } from "./types";

/** Cooldown ladder · ms · doubles per consecutive block, capped at 1 hour */
const COOLDOWN_LADDER_MS: ReadonlyArray<number> = [
  60_000, // 1 min · first block
  300_000, // 5 min
  900_000, // 15 min
  1_800_000, // 30 min
  3_600_000, // 60 min (cap)
];

/** Initial health (registered · never failed) */
export function initialHealth(): ProngHealth {
  return {
    healthy: true,
    lastBlockAt: null,
    lastBlockSignal: null,
    consecutiveBlocks: 0,
    cooldownUntil: null,
  };
}

/**
 * Classify an outcome into a BlockSignal (or undefined if no block).
 * Inputs are stubs/synthetic in this scaffold · classifier logic is real.
 */
export function classifyBlock(
  outcome: FetchOutcome,
): BlockSignal | undefined {
  if (outcome.blockSignal) return outcome.blockSignal;
  if (outcome.ok) {
    // 200 but content sparse · soft-block heuristic
    if ((outcome.recordsReturned ?? 0) === 0) return "soft-block";
    return undefined;
  }
  const s = outcome.status ?? 0;
  if (s === 429) return "rate-limit";
  if (s === 401 || s === 403) return "auth-required";
  if (s === 451) return "ip-banned";
  if (s >= 500) return "unknown";
  return "unknown";
}

/** Update health given an outcome · pure function (no I/O) */
export function applyOutcome(
  prev: ProngHealth,
  outcome: FetchOutcome,
  nowMs: number = Date.now(),
): ProngHealth {
  const signal = classifyBlock(outcome);
  if (!signal) {
    // Clean success · clear block streak
    return {
      healthy: true,
      lastBlockAt: prev.lastBlockAt,
      lastBlockSignal: null,
      consecutiveBlocks: 0,
      cooldownUntil: null,
    };
  }
  const next = prev.consecutiveBlocks + 1;
  const ladderIdx = Math.min(next - 1, COOLDOWN_LADDER_MS.length - 1);
  const cooldownMs = COOLDOWN_LADDER_MS[ladderIdx]!;
  return {
    healthy: false,
    lastBlockAt: nowMs,
    lastBlockSignal: signal,
    consecutiveBlocks: next,
    cooldownUntil: nowMs + cooldownMs,
  };
}

/** Is the prong available to route NOW (healthy AND past cooldown)? */
export function isAvailable(
  h: ProngHealth,
  nowMs: number = Date.now(),
): boolean {
  if (h.healthy) return true;
  if (h.cooldownUntil === null) return false;
  return nowMs >= h.cooldownUntil;
}
