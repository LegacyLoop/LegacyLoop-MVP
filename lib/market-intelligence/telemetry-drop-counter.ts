/**
 * Telemetry drop counter — tracks silent logScraperUsage failures
 * so D3's admin dashboard can surface DB outages.
 *
 * The D1 logger swallows ScraperUsageLog write failures via a
 * `.catch(() => {})` tail so telemetry errors never break the
 * scraper scan path. That fail-soft behavior is correct, but it
 * also makes DB outages invisible. This counter is the
 * observability tap on top of that swallow.
 *
 * Counters live in-process (reset on Vercel cold starts).
 * Acceptable for our volume; a persistent version backed by Turso
 * or Vercel KV can come later if needed.
 *
 * Added by CMD-SCRAPER-CEILINGS-D3.
 *
 * Updated: 2026-04-08
 * Author: Ryan Hallee
 */

let totalDrops = 0;
let dropsSinceBoot = 0;
const bootedAt = new Date();
let lastDropAt: Date | null = null;
let lastDropError: string | null = null;

/**
 * Record one telemetry drop. Called from inside the
 * usage-logger.ts `.catch()` block whenever a ScraperUsageLog
 * write fails. Never throws.
 */
export function recordTelemetryDrop(error: unknown): void {
  totalDrops += 1;
  dropsSinceBoot += 1;
  lastDropAt = new Date();
  lastDropError =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : "unknown";
  if (process.env.NODE_ENV !== "production") {
    console.warn(
      `[telemetry-drop-counter] total=${totalDrops} sinceBoot=${dropsSinceBoot}`,
    );
  }
}

/**
 * Snapshot of the current counter state for the /admin tile and
 * the /api/admin/scrapers endpoint.
 */
export function getTelemetryDropStats(): {
  total: number;
  sinceBoot: number;
  bootedAt: Date;
  lastDropAt: Date | null;
  lastDropError: string | null;
} {
  return {
    total: totalDrops,
    sinceBoot: dropsSinceBoot,
    bootedAt,
    lastDropAt,
    lastDropError,
  };
}
