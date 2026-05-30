// CMD-W27-A · Generic scraper safety · hardcoded pace floor
// Originally lifted from lib/fb-army-safety/pace-floor.ts (W24-L1).
// NO env override · NO Sleep(0) · NO downgrade path. CEO Meta-safety law.
//
// Reusable by ANY scraping backend (burner / Apify-orchestration / Manus
// autonomous / future): verifies any caller-supplied PaceProfile meets or
// exceeds absolute floors. Anything faster is rejected (refuse-to-run).
// Slower (more conservative) is permitted.

/**
 * ABSOLUTE pace floors. Hardcoded constants · NEVER read from env · NEVER
 * mutable. Anything faster than these is a Meta-safety violation.
 */
export const PACE_FLOOR = Object.freeze({
  /** Minimum dwell on a page · ms · per record viewed */
  minDwellMs: 2500,
  /** Minimum scroll cadence · ms · between scroll events */
  minScrollMs: 800,
  /** Maximum records pulled in a single session window */
  maxItemsPerSession: 40,
  /** Maximum session duration · minutes · before mandatory cooldown */
  maxMinutesPerSession: 12,
  /** Minimum cooldown between sessions · ms */
  minIntersessionCooldownMs: 60_000,
});

export type PaceProfile = {
  readonly minDwellMs: number;
  readonly maxDwellMs: number;
  readonly minScrollMs: number;
  readonly maxScrollMs: number;
  readonly maxItemsPerSession: number;
  readonly maxMinutesPerSession: number;
};

export type PaceViolation = {
  readonly field: keyof PaceProfile;
  readonly supplied: number;
  readonly floor: number;
  readonly detail: string;
};

export type PaceVerdict = {
  readonly ok: boolean;
  readonly violations: ReadonlyArray<PaceViolation>;
};

/**
 * Reject any PaceProfile faster than the hardcoded floor.
 * Returns ok=true if all floors met or exceeded.
 */
export function enforcePaceFloor(pace: PaceProfile): PaceVerdict {
  const violations: PaceViolation[] = [];

  if (pace.minDwellMs < PACE_FLOOR.minDwellMs) {
    violations.push({
      field: "minDwellMs",
      supplied: pace.minDwellMs,
      floor: PACE_FLOOR.minDwellMs,
      detail: `minDwellMs ${pace.minDwellMs} below floor ${PACE_FLOOR.minDwellMs}`,
    });
  }
  if (pace.maxDwellMs < pace.minDwellMs) {
    violations.push({
      field: "maxDwellMs",
      supplied: pace.maxDwellMs,
      floor: pace.minDwellMs,
      detail: `maxDwellMs ${pace.maxDwellMs} below minDwellMs ${pace.minDwellMs}`,
    });
  }
  if (pace.minScrollMs < PACE_FLOOR.minScrollMs) {
    violations.push({
      field: "minScrollMs",
      supplied: pace.minScrollMs,
      floor: PACE_FLOOR.minScrollMs,
      detail: `minScrollMs ${pace.minScrollMs} below floor ${PACE_FLOOR.minScrollMs}`,
    });
  }
  if (pace.maxScrollMs < pace.minScrollMs) {
    violations.push({
      field: "maxScrollMs",
      supplied: pace.maxScrollMs,
      floor: pace.minScrollMs,
      detail: `maxScrollMs ${pace.maxScrollMs} below minScrollMs ${pace.minScrollMs}`,
    });
  }
  if (pace.maxItemsPerSession > PACE_FLOOR.maxItemsPerSession) {
    violations.push({
      field: "maxItemsPerSession",
      supplied: pace.maxItemsPerSession,
      floor: PACE_FLOOR.maxItemsPerSession,
      detail: `maxItemsPerSession ${pace.maxItemsPerSession} exceeds ceiling ${PACE_FLOOR.maxItemsPerSession}`,
    });
  }
  if (pace.maxMinutesPerSession > PACE_FLOOR.maxMinutesPerSession) {
    violations.push({
      field: "maxMinutesPerSession",
      supplied: pace.maxMinutesPerSession,
      floor: PACE_FLOOR.maxMinutesPerSession,
      detail: `maxMinutesPerSession ${pace.maxMinutesPerSession} exceeds ceiling ${PACE_FLOOR.maxMinutesPerSession}`,
    });
  }

  return { ok: violations.length === 0, violations };
}

/**
 * Validate a single dwell/scroll value against floor before sleep() is called.
 * Throws if below floor (no env override path).
 */
export function assertSleepFloor(kind: "dwell" | "scroll", ms: number): void {
  const floor = kind === "dwell" ? PACE_FLOOR.minDwellMs : PACE_FLOOR.minScrollMs;
  if (ms < floor) {
    throw new Error(
      `pace-floor violation · ${kind} ${ms}ms below absolute floor ${floor}ms · Meta-safety law`,
    );
  }
}
