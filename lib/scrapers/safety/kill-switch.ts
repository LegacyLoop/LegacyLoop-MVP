// CMD-W27-A · Generic scraper safety · kill-switch
// Originally lifted from lib/fb-army-safety/kill-switch.ts (W24-L1).
// killArmy() flips a single env/flag. ALL prongs MUST check before request.
// Target: full stop in <30s wall-clock from killArmy() to last prong halted.
// Reusable by ANY backend (burner / Apify orchestration / Manus / future).

import { mkdirSync, writeFileSync, existsSync, readFileSync, unlinkSync } from "node:fs";
import { dirname } from "node:path";

/**
 * Persistent kill flag path. Override via env for tests · NEVER in prod.
 * Prod default: `/tmp/fb-army-killed.flag` on droplet.
 */
export const KILL_FLAG_PATH =
  process.env.FB_ARMY_KILL_FLAG_PATH ?? "/tmp/fb-army-killed.flag";

/** In-process kill flag · fast-path check before fs hit */
let inProcessKilled = false;

export type KillReason = {
  readonly reason: string;
  readonly killedAt: number; // epoch ms
  readonly source: "ceo" | "captcha-storm" | "ban-detected" | "manual" | "test";
};

/**
 * Trigger army-wide stop. Sets in-process flag + writes persistent file.
 * All prongs poll `isArmyKilled()` before every request.
 */
export function killArmy(reason: Omit<KillReason, "killedAt">): KillReason {
  const payload: KillReason = { ...reason, killedAt: Date.now() };
  inProcessKilled = true;
  try {
    const dir = dirname(KILL_FLAG_PATH);
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    writeFileSync(KILL_FLAG_PATH, JSON.stringify(payload, null, 2), "utf8");
  } catch (e) {
    // fs unavailable · in-process flag still wins for this runtime
    // (real droplet has /tmp · this branch is defensive only)
    void e;
  }
  return payload;
}

/**
 * Check kill state. Fast in-process check; fall back to fs flag (e.g. flag
 * was set by a sibling process on same droplet).
 */
export function isArmyKilled(): boolean {
  if (inProcessKilled) return true;
  try {
    if (existsSync(KILL_FLAG_PATH)) {
      inProcessKilled = true;
      return true;
    }
  } catch {
    /* fs read failure · default to not killed (in-process only) */
  }
  return false;
}

/**
 * Read full kill payload if killed · null otherwise.
 */
export function readKillReason(): KillReason | null {
  if (!isArmyKilled()) return null;
  try {
    if (existsSync(KILL_FLAG_PATH)) {
      const raw = readFileSync(KILL_FLAG_PATH, "utf8");
      return JSON.parse(raw) as KillReason;
    }
  } catch {
    /* fall through · in-process only */
  }
  return inProcessKilled
    ? { reason: "in-process kill flag set", killedAt: 0, source: "manual" }
    : null;
}

/**
 * Reset for tests · NEVER call in prod.
 */
export function resetKillState(): void {
  inProcessKilled = false;
  try {
    if (existsSync(KILL_FLAG_PATH)) unlinkSync(KILL_FLAG_PATH);
  } catch {
    /* ignore */
  }
}

export type KillSwitchVerdict = {
  readonly ok: boolean;
  readonly elapsedMs: number;
  readonly target: number;
  readonly killReason: KillReason | null;
};

/**
 * Verify kill-switch fires in <30s. Simulates N prongs each polling
 * `isArmyKilled()` on a 1s cadence. Returns time-to-full-stop.
 *
 * In sim mode this models the polling loop in-process. In live-mode (later)
 * this is wired to actual droplet prongs via SIGTERM/HTTP signal.
 */
export async function verifyKillSwitch(opts: {
  prongCount?: number;
  pollIntervalMs?: number;
  targetMs?: number;
  mode?: "sim" | "live";
} = {}): Promise<KillSwitchVerdict> {
  const prongCount = opts.prongCount ?? 5;
  const pollIntervalMs = opts.pollIntervalMs ?? 1_000;
  const targetMs = opts.targetMs ?? 30_000;

  resetKillState();
  const startedAt = Date.now();

  // Spawn N async pollers · each resolves when it observes the kill flag
  const pollers = Array.from({ length: prongCount }, (_, i) =>
    new Promise<number>((resolve) => {
      const tick = () => {
        if (isArmyKilled()) {
          resolve(Date.now() - startedAt);
          return;
        }
        if (Date.now() - startedAt > targetMs * 2) {
          resolve(-1); // timeout sentinel
          return;
        }
        setTimeout(tick, pollIntervalMs);
      };
      // Small jitter so pollers don't all check the same tick
      setTimeout(tick, i * 50);
    }),
  );

  // Trigger kill after first poll cycle so all pollers must observe it
  setTimeout(() => {
    killArmy({ reason: "verifyKillSwitch sim", source: "test" });
  }, 100);

  const elapsedPerProng = await Promise.all(pollers);
  const elapsedMs = Math.max(...elapsedPerProng);
  const reason = readKillReason();
  resetKillState();

  void opts.mode; // mode is informational · sim/live tagged by caller for §12

  return {
    ok: elapsedMs >= 0 && elapsedMs < targetMs,
    elapsedMs,
    target: targetMs,
    killReason: reason,
  };
}
