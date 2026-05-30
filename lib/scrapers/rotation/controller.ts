// CMD-W23-L1 · FB-Army Rotation Controller (the brain)
// Selects among 3-world prongs by:
//   1) world-isolation respected (request's intended world)
//   2) healthy AND past cooldown (health.ts)
//   3) cheapest cost-per-record (cost.ts)
//   4) failover order on block (auto-retire prong · move to next)
// Pure logic · no real HTTP (stubs in types.ts).

import type {
  FetchOutcome,
  FetchRequest,
  Prong,
  ProngCost,
  ProngHealth,
  ProngState,
  RotationDecision,
  World,
} from "./types";
import { applyOutcome, initialHealth, isAvailable } from "./health";
import { accumulate, cheaper, initialCost, sumSpend } from "./cost";

/**
 * Budget guard config · CEO directive HARD CAP $150/mo · TARGET $100/mo.
 * Controller refuses to route when cumulative spend exceeds budgetCapUsd.
 */
export interface RotationConfig {
  readonly budgetCapUsd: number;
  readonly budgetTargetUsd: number;
}

export const DEFAULT_CONFIG: RotationConfig = {
  budgetCapUsd: 150,
  budgetTargetUsd: 100,
};

/**
 * RotationController owns the prong registry and routes requests.
 * Two-world isolation is structural: each Prong declares a `world`, and the
 * controller filters by request.intendedWorld before any other criterion.
 */
export class RotationController {
  private readonly states: Map<string, ProngState> = new Map();
  private readonly config: RotationConfig;

  constructor(config: RotationConfig = DEFAULT_CONFIG) {
    this.config = config;
  }

  /** Register a prong · idempotent on prong.id */
  register(prong: Prong): void {
    if (this.states.has(prong.id)) return;
    this.states.set(prong.id, {
      prong,
      health: initialHealth(),
      cost: initialCost(),
    });
  }

  /** Read-only snapshot of all registered prong states */
  snapshot(): ReadonlyArray<ProngState> {
    return Array.from(this.states.values());
  }

  /** Current cumulative spend across all registered prongs */
  totalSpend(): number {
    return sumSpend(
      Array.from(this.states.values()).map((s) => s.cost),
    );
  }

  /**
   * Select a prong for a request.
   * Honors two-world isolation: only prongs whose `world` matches `intendedWorld`.
   * Filters by enabled + available (health) · then picks cheapest-cost-per-record.
   * Returns a RotationDecision (selected=null when no candidate qualifies).
   */
  select(
    req: FetchRequest,
    intendedWorld: World,
    nowMs: number = Date.now(),
  ): RotationDecision {
    const skipped: Array<{ id: string; reason: string }> = [];

    // Budget guard first — refuses to route over hard cap
    if (this.totalSpend() >= this.config.budgetCapUsd) {
      return {
        selected: null,
        reason: `budget-cap-reached: ${this.totalSpend().toFixed(2)} >= ${this.config.budgetCapUsd.toFixed(2)}`,
        candidatesConsidered: 0,
        skipped: [],
      };
    }

    const candidates: ProngState[] = [];
    for (const s of this.states.values()) {
      // World isolation — STRUCTURAL filter · World A vs World B vs apify never mixed
      if (s.prong.world !== intendedWorld) {
        skipped.push({ id: s.prong.id, reason: `world-mismatch:${s.prong.world}!=${intendedWorld}` });
        continue;
      }
      if (!s.prong.enabled) {
        skipped.push({ id: s.prong.id, reason: "disabled" });
        continue;
      }
      if (!s.prong.operations.includes(req.operation)) {
        skipped.push({ id: s.prong.id, reason: `operation-unsupported:${req.operation}` });
        continue;
      }
      if (!isAvailable(s.health, nowMs)) {
        skipped.push({
          id: s.prong.id,
          reason: `cooldown:${s.health.lastBlockSignal ?? "?"}:until=${s.health.cooldownUntil ?? "?"}`,
        });
        continue;
      }
      candidates.push(s);
    }

    if (candidates.length === 0) {
      return {
        selected: null,
        reason: "no-candidates-available",
        candidatesConsidered: 0,
        skipped,
      };
    }

    // Cheapest cost-per-record
    let best = candidates[0]!;
    for (let i = 1; i < candidates.length; i++) {
      const c = candidates[i]!;
      const cheaperState = cheaper(best.cost, c.cost) === "a" ? best : c;
      best = cheaperState;
    }

    return {
      selected: best.prong,
      reason: `selected:${best.prong.id}:world=${best.prong.world}:cpr=${best.cost.costPerRecord}`,
      candidatesConsidered: candidates.length,
      skipped,
    };
  }

  /**
   * Record the outcome of a fetch attempt and update health + cost telemetry.
   * Called by the integration layer (post-stub) after each prong.fetch() returns.
   */
  recordOutcome(prongId: string, outcome: FetchOutcome, nowMs: number = Date.now()): void {
    const s = this.states.get(prongId);
    if (!s) return;
    const nextHealth: ProngHealth = applyOutcome(s.health, outcome, nowMs);
    const nextCost: ProngCost = accumulate(s.cost, outcome);
    this.states.set(prongId, {
      prong: s.prong,
      health: nextHealth,
      cost: nextCost,
    });
  }

  /**
   * Failover sequence · auto-retire current prong on block · returns next candidate.
   * Treats the rejected prongId as if it just emitted a block signal (pessimistic
   * cooldown) so the selector skips it on retry.
   */
  failover(
    req: FetchRequest,
    intendedWorld: World,
    rejectedProngId: string,
    rejectionOutcome: FetchOutcome,
    nowMs: number = Date.now(),
  ): RotationDecision {
    this.recordOutcome(rejectedProngId, rejectionOutcome, nowMs);
    return this.select(req, intendedWorld, nowMs);
  }
}

/*
 * Inline unit scenarios (verified mentally · live tests land with the integration cyl):
 *
 * Scenario 1 · world isolation
 *   Register prongA (world=A), prongB (world=B). select(req, "A") returns prongA;
 *   prongB appears in skipped[] with reason "world-mismatch:B!=A". prongA's
 *   credentials/IPs never co-mingle with prongB.
 *
 * Scenario 2 · cheapest-healthy wins
 *   Two enabled prongs in same world. apify spent $5 for 100 records (cpr=0.05);
 *   droplet spent $1 for 100 records (cpr=0.01). Selector picks droplet.
 *
 * Scenario 3 · auto-retire on block
 *   prongA returns 429 (rate-limit). applyOutcome marks unhealthy with 1-min cooldown.
 *   Next select() skips prongA with reason "cooldown:rate-limit:until=...". Failover
 *   returns next candidate or null.
 *
 * Scenario 4 · budget cap
 *   totalSpend ≥ 150 USD. select() returns selected=null with reason "budget-cap-reached".
 *   Caller responsible for honoring (CEO HARD CAP).
 *
 * Scenario 5 · cooldown ladder
 *   Five consecutive blocks on same prong escalate cooldown 1min → 5min → 15min → 30min →
 *   60min (cap). One clean success resets streak.
 */
