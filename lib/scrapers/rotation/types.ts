// CMD-W23-L1 · FB-Army Rotation Controller · two-world isolation absolute
// World A (Graph API · Meta dev account) NEVER co-mingles with World B (droplet army).
// Apify = co-equal rotation arm · NOT just fallback.

/**
 * World boundary marker.
 * - `A` = official channel (Meta Graph API · scope-gated)
 * - `B` = own droplet army (burner accounts · rotating IPs · residential proxies)
 * - `apify` = third-party rotation arm (vendor carries ToS risk · separate from A/B)
 *
 * The controller treats each world as a separate identity domain.
 * Credentials/IPs/cookies/fingerprints from one world NEVER reach another.
 */
export type World = "A" | "B" | "apify";

/** Outcome of a single fetch attempt — used by health classifier */
export interface FetchOutcome {
  readonly ok: boolean;
  readonly status?: number;
  readonly blockSignal?: BlockSignal;
  readonly recordsReturned?: number;
  readonly costUsd?: number;
  readonly elapsedMs?: number;
}

/** Block-signal taxonomy (classifier output) */
export type BlockSignal =
  | "captcha"
  | "checkpoint"
  | "rate-limit"
  | "auth-required"
  | "ip-banned"
  | "fingerprint-flagged"
  | "soft-block" // returned 200 but content stripped/sparse
  | "unknown";

/** Health snapshot per prong (in-memory · controller-owned) */
export interface ProngHealth {
  readonly healthy: boolean;
  readonly lastBlockAt: number | null; // epoch ms
  readonly lastBlockSignal: BlockSignal | null;
  readonly consecutiveBlocks: number;
  readonly cooldownUntil: number | null; // epoch ms · 0 = no cooldown
}

/** Cost telemetry per prong */
export interface ProngCost {
  readonly totalSpendUsd: number;
  readonly totalRecords: number;
  /** running USD per record · NaN if 0 records · used by selector */
  readonly costPerRecord: number;
}

/** Stub fetch request (no real HTTP in this scaffold) */
export interface FetchRequest {
  readonly targetUrl: string;
  readonly operation: string;
  readonly params?: Readonly<Record<string, unknown>>;
}

/**
 * Prong = one rotation arm. Mirrors the proxy Adapter conventions (provider id +
 * enabled flag + operations) but is a separate registry — rotation ≠ proxy.
 * `fetch` is a STUB in this scaffold · live wiring lands in a later integration cyl.
 */
export interface Prong {
  readonly id: string;
  readonly world: World;
  readonly enabled: boolean;
  /** ops this prong supports (e.g. "search" · "page" · "rss") */
  readonly operations: ReadonlyArray<string>;
  /** Stub — implementation lands later. Returns synthetic FetchOutcome. */
  fetch(req: FetchRequest): Promise<FetchOutcome>;
}

/** What the controller returns when asked to route a request */
export interface RotationDecision {
  readonly selected: Prong | null;
  readonly reason: string;
  readonly candidatesConsidered: number;
  readonly skipped: ReadonlyArray<{ id: string; reason: string }>;
}

/** Internal controller state for a registered prong */
export interface ProngState {
  readonly prong: Prong;
  readonly health: ProngHealth;
  readonly cost: ProngCost;
}
