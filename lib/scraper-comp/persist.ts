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

/**
 * Cyl 7B's typed parser output. Forward-compat local shim per §0
 * PRE-FIRE DECISIONS LOCKED — 7B's lib/scraper-parser/types.ts was
 * absent at draft time. CMD-CYLINDER-7C-V2-CANONICAL-TYPE-IMPORT
 * banks the consolidation cylinder once 7B ratifies. Extra fields
 * on the input object are silently ignored (writer only reads
 * fields it knows).
 */
export interface ScraperParsedItem {
  slug: string;
  sourceUrl?: string | null;
  sourcePlatform: string;
  title: string;
  description?: string | null;
  priceUsd?: number | null;
  soldPrice?: number | null;
  condition?: string | null;
  category?: string | null;
  keywords?: string[];
  imageUrls?: string[];
  metadata?: Record<string, unknown>;
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

  // Map ScraperParsedItem → EnrichmentCompInput (writer's canonical shape).
  // attribution.contributingBot is required for contributor list bookkeeping.
  const writerInputs: EnrichmentCompInput[] = items.map((item) => ({
    slug: item.slug,
    sourceUrl: item.sourceUrl ?? null,
    sourcePlatform: item.sourcePlatform,
    title: item.title,
    description: item.description ?? null,
    priceUsd: item.priceUsd ?? null,
    soldPrice: item.soldPrice ?? null,
    condition: item.condition ?? null,
    category: item.category ?? null,
    keywords: item.keywords,
    imageUrls: item.imageUrls,
    metadata: item.metadata,
    contributingBot: attribution.contributingBot,
    sourceItemId: attribution.sourceItemId ?? null,
    sourceUserId: attribution.sourceUserId ?? null,
  }));

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
