// CMD-W26-C · Webhook event idempotency (fast-path replay guard).
//
// Meta retries webhook deliveries until it receives a 200. A retried (or
// duplicated) delivery carries the SAME event id (message mid / leadgen_id).
// DB-level idempotency already exists (deterministic Message.id in ingest.ts,
// event_id in capi.ts) — this is the cheap in-process guard that short-circuits
// reprocessing within a warm-instance window before any DB work.
//
// Bounded TTL map: survives Fluid Compute instance reuse, self-evicts on TTL
// and on a hard size cap so it can never grow unbounded.

const DEFAULT_TTL_MS = 10 * 60_000; // 10 min — comfortably covers Meta's retry burst
const MAX_ENTRIES = 5_000;

interface DedupStore {
  seen: Map<string, number>; // id → expiry epoch ms
}

// Module-level singleton (per warm instance).
const store: DedupStore = { seen: new Map() };

/** Drop expired + over-cap entries. Called opportunistically on each mark. */
function evict(now: number): void {
  const { seen } = store;
  if (seen.size < MAX_ENTRIES) {
    // Cheap path: only sweep expired when we cross a soft threshold.
    if (seen.size < MAX_ENTRIES / 2) return;
  }
  for (const [id, expiry] of seen) {
    if (expiry <= now) seen.delete(id);
  }
  // Still over cap after expiry sweep → evict oldest-inserted (Map preserves order).
  if (seen.size >= MAX_ENTRIES) {
    const overflow = seen.size - MAX_ENTRIES + 1;
    let i = 0;
    for (const id of seen.keys()) {
      seen.delete(id);
      if (++i >= overflow) break;
    }
  }
}

/**
 * Returns true if this event id was already seen (a duplicate/replay) and marks
 * it seen otherwise. First sight → false (process it); repeat sight → true (skip).
 *
 * @param eventId stable per-event id (message mid, leadgen_id, etc.)
 * @param nowMs   injectable clock for tests
 */
export function isDuplicateEvent(eventId: string, nowMs: number = Date.now()): boolean {
  if (!eventId) return false; // no id → cannot dedup, let caller process
  const { seen } = store;
  const expiry = seen.get(eventId);
  if (expiry !== undefined && expiry > nowMs) {
    return true; // live duplicate
  }
  seen.set(eventId, nowMs + DEFAULT_TTL_MS);
  evict(nowMs);
  return false;
}

/** Test/maintenance helper — clears the in-process dedup store. */
export function resetDedupStore(): void {
  store.seen.clear();
}

/** Current live entry count (post-lazy-eviction estimate). Test/observability. */
export function dedupSize(): number {
  return store.seen.size;
}
