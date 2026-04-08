/**
 * Scraper usage logger — fire-and-forget telemetry for every
 * scraper dispatch attempt in the per-bot allowlist path.
 *
 * Added by CMD-SCRAPER-CEILINGS-D1. Consumed by aggregator.ts
 * inside the `if (botName)` dispatch branch.
 *
 * CRITICAL: Every call MUST be fire-and-forget with a
 * `.catch(() => {})` tail — telemetry failures must NEVER block
 * the main scraper scan path. DB unreachable must not fail user
 * requests.
 *
 * D2 will query this table to enforce cost ceilings + YouTube
 * quota. D3 will surface aggregates in /admin.
 *
 * Updated: 2026-04-08
 * Author: Ryan Hallee
 */

import { prisma } from "@/lib/db";
import type { BotName } from "./bot-scraper-allowlist";
// CMD-SCRAPER-CEILINGS-D3: surface silent DB outages to /admin
import { recordTelemetryDrop } from "./telemetry-drop-counter";

export interface ScraperUsageLogEntry {
  botName: BotName;
  slug: string;
  tier: number;
  cost: number;
  success: boolean;
  blocked?: boolean;
  blockReason?: string | null;
  compsReturned?: number;
  durationMs: number;
  itemId?: string | null;
  userId?: string | null;
}

/**
 * Fire-and-forget log write. Never throws, never awaits.
 * Safe to call from anywhere in a scraper dispatch loop.
 *
 * The function deliberately does NOT return a Promise — callers
 * cannot accidentally await on telemetry. The Prisma create call
 * runs in the background and any error is swallowed by the
 * trailing `.catch()`.
 */
export function logScraperUsage(entry: ScraperUsageLogEntry): void {
  prisma.scraperUsageLog
    .create({
      data: {
        botName: entry.botName,
        slug: entry.slug,
        tier: entry.tier,
        cost: entry.cost,
        success: entry.success,
        blocked: entry.blocked ?? false,
        blockReason: entry.blockReason ?? null,
        compsReturned: entry.compsReturned ?? 0,
        durationMs: entry.durationMs,
        itemId: entry.itemId ?? null,
        userId: entry.userId ?? null,
      },
    })
    .catch((err: unknown) => {
      // CMD-SCRAPER-CEILINGS-D3: bump the in-process counter so the
      // /admin Scraper Economy tile can surface silent DB outages.
      recordTelemetryDrop(err);
      // Swallow — telemetry failures must never break the scan.
      if (process.env.NODE_ENV !== "production") {
        const msg = err instanceof Error ? err.message : String(err);
        console.warn("[usage-logger] write failed:", msg);
      }
    });
}
