/**
 * CMD-CYLINDER-7C-PRISMA-PERSIST V18
 * Adapter: Cyl 7B ScraperParsedItem[] → ScraperComp persistence.
 *
 * 7B parses raw scraper payloads via llama-3.2-local through the
 * LiteLLM Gateway (advisor A1 absolute · zero LangChain). 7C maps
 * 7B's typed output to the canonical EnrichmentCompInput shape and
 * delegates to persistEnrichmentComps() — the shipped find-then-
 * update-or-create persister at lib/market-intelligence/enrichment-
 * writer.ts (LOCKED · MUST NOT modify · MAY consume).
 *
 * Idempotency: enforced at the DB level via @@unique([slug, sourceUrl])
 * compound key on the ScraperComp model (prisma/schema.prisma:1256).
 * First call CREATES · subsequent calls UPDATE refresh lastSeenAt +
 * ttlExpiresAt and append to contributorBotsJson.
 *
 * Telemetry: one ScraperUsageLog row per persist call (botName:
 * "n8n_scraper_persist" · compsReturned: written + deduped · itemId:
 * null · pattern parity with Cyl 7A's n8n_scraper_catch).
 *
 * Production safety: post-R2 lib/db.ts bleed guard routes DEV writes
 * to SQLite + PROD writes to Turso transparently. 7C requires zero
 * environment-specific handling.
 *
 * Closes the Cyl 7 epic · advisor I3 100-item milestone gateway.
 *
 * Author: Ryan Hallee · 2026-05-02
 */

import { prisma } from "@/lib/db";
import {
  persistEnrichmentComps,
  type EnrichmentCompInput,
} from "@/lib/market-intelligence/enrichment-writer";
import type { ScraperParsedItem } from "@/lib/scraper-parser/types";

// Re-export the canonical type so existing callers that imported
// `ScraperParsedItem` from this module keep working.
export type { ScraperParsedItem };

/**
 * CMD-CYLINDER-7C-V2-CANONICAL-TYPE-IMPORT V18: adapter for 7B's
 * JSON-string fields (keywordsJson, imageUrlsJson, metadataJson) →
 * writer's array/object fields (keywords, imageUrls, metadata).
 * The writer (enrichment-writer.ts:L87-90) re-stringifies the
 * arrays before persisting; we parse → writer re-stringifies, which
 * round-trips cleanly because both use the same JSON representation.
 * Ratifies DOC-FORWARD-COMPAT-TYPE-CONSOLIDATION on this clean fire.
 */
function safeJsonParse<T>(s: string, fallback: T): T {
  try {
    return JSON.parse(s) as T;
  } catch {
    return fallback;
  }
}

function toEnrichmentInput(
  parsed: ScraperParsedItem,
  attribution: ScraperPersistAttribution,
): EnrichmentCompInput {
  return {
    slug: parsed.slug,
    sourceUrl: parsed.sourceUrl ?? null,
    sourcePlatform: parsed.sourcePlatform,
    title: parsed.title,
    description: parsed.description ?? null,
    priceUsd: parsed.priceUsd ?? null,
    soldPrice: parsed.soldPrice ?? null,
    condition: parsed.condition ?? null,
    category: parsed.category ?? null,
    keywords: parsed.keywordsJson
      ? safeJsonParse<string[]>(parsed.keywordsJson, [])
      : undefined,
    imageUrls: parsed.imageUrlsJson
      ? safeJsonParse<string[]>(parsed.imageUrlsJson, [])
      : undefined,
    metadata: parsed.metadataJson
      ? safeJsonParse<Record<string, unknown>>(parsed.metadataJson, {})
      : undefined,
    contributingBot: attribution.contributingBot,
    sourceItemId: attribution.sourceItemId ?? null,
    sourceUserId: attribution.sourceUserId ?? null,
  };
}

export interface ScraperPersistAttribution {
  contributingBot: string;        // e.g. "n8n_scraper_catch"
  scraperId?: string | null;      // pass-through from Cyl 7A's webhook payload
  sourceItemId?: string | null;
  sourceUserId?: string | null;
}

export interface ScraperPersistResult {
  written: number;
  deduped: number;
  durationMs: number;
}

/**
 * Persist Cyl 7B's parsed items to ScraperComp.
 *
 * Returns { written, deduped, durationMs } telemetry tuple. Never
 * throws — internal failures are logged and swallowed by the
 * shipped writer (Promise.allSettled at enrichment-writer.ts:78).
 *
 * Fire-and-forget safe at call sites: the inner writer never
 * propagates row-level errors to the caller.
 */
export async function persistScraperParsedItems(
  items: ScraperParsedItem[],
  attribution: ScraperPersistAttribution,
): Promise<ScraperPersistResult> {
  const startMs = performance.now();

  // Empty-input fast-path · zero side effects
  if (!items || items.length === 0) {
    return { written: 0, deduped: 0, durationMs: 0 };
  }

  // Map ScraperParsedItem → EnrichmentCompInput (writer's canonical shape)
  // via toEnrichmentInput · 7B emits JSON-string fields that the adapter
  // parses into the array/object shape the writer expects.
  const writerInputs: EnrichmentCompInput[] = items.map((item) =>
    toEnrichmentInput(item, attribution),
  );

  // Delegate to shipped persister · find-then-update-or-create on
  // @@unique([slug, sourceUrl]) compound key · accumulates contributor
  // list · monotonically increases qualityScore · per-category TTL.
  const { written, deduped } = await persistEnrichmentComps(writerInputs);

  const durationMs = Math.round(performance.now() - startMs);

  // Telemetry · pattern parity with Cyl 7A (n8n_scraper_catch)
  // Fire-and-forget · errors swallowed so persist success never
  // depends on telemetry success.
  prisma.scraperUsageLog
    .create({
      data: {
        botName: "n8n_scraper_persist",
        slug: attribution.scraperId ?? "unknown",
        tier: 0,
        cost: 0,
        success: true,
        blocked: false,
        blockReason: null,
        compsReturned: written + deduped,
        durationMs,
        itemId: attribution.sourceItemId ?? null,
        userId: attribution.sourceUserId ?? null,
      },
    })
    .catch((err) => {
      if (process.env.NODE_ENV !== "production") {
        const msg = err instanceof Error ? err.message : String(err);
        console.warn("[scraper-comp/persist] telemetry write failed:", msg);
      }
    });

  return { written, deduped, durationMs };
}
