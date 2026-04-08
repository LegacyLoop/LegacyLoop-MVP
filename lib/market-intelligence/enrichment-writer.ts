/**
 * CMD-SCRAPER-ENRICHMENT-E
 * ScraperComp knowledge graph writer.
 *
 * Persists scraper pulls into the ScraperComp table for future
 * cache-first dispatch. Fire-and-forget pattern: callers MUST NOT
 * await on hot scraper paths. Internal writes wrapped in
 * Promise.allSettled so one bad row never kills the batch.
 *
 * Dedupe key: (slug, sourceUrl). On hit: refresh lastSeenAt +
 * ttlExpiresAt and add the contributing bot to the contributor
 * list (if not already present). Multi-bot contribution lets us
 * see which bots are seeding the graph.
 *
 * Updated: 2026-04-08
 * Author: Ryan Hallee
 */

import { prisma } from "@/lib/db";
import { ttlForCategory } from "./enrichment-ttl";

export interface EnrichmentCompInput {
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
  contributingBot: string;
  sourceItemId?: string | null;
  sourceUserId?: string | null;
}

/**
 * Compute a coarse 0–1 quality score from comp completeness.
 * Used downstream for ranking/filtering — not enforced at write
 * time so even sparse rows get persisted (they may still help
 * confirm that a comp existed at all).
 */
function computeQualityScore(input: EnrichmentCompInput): number {
  let score = 0;
  if (input.priceUsd != null) score += 0.3;
  if (input.soldPrice != null) score += 0.3;
  if (input.imageUrls && input.imageUrls.length > 0) score += 0.2;
  if (input.condition) score += 0.2;
  return Math.min(1, score);
}

/**
 * Upsert a batch of comps into the ScraperComp graph.
 *
 * On INSERT: sets firstContributedBy + initializes contributorBotsJson
 *            with [contributingBot].
 * On UPDATE: refreshes lastSeenAt + ttlExpiresAt and appends
 *            contributingBot to the contributor list if not present.
 *
 * Skips rows missing both title AND priceUsd (no useful signal).
 *
 * Returns counts for telemetry. Failures are logged + swallowed —
 * the function never throws so callers can fire-and-forget.
 */
export async function persistEnrichmentComps(
  comps: EnrichmentCompInput[],
): Promise<{ written: number; deduped: number }> {
  if (!comps || comps.length === 0) {
    return { written: 0, deduped: 0 };
  }

  let written = 0;
  let deduped = 0;

  const results = await Promise.allSettled(
    comps.map(async (input) => {
      // Junk filter: must have at least a title or a priceUsd
      if (!input.title && input.priceUsd == null) {
        return { skipped: true };
      }

      const ttlExpiresAt = ttlForCategory(input.category ?? null);
      const qualityScore = computeQualityScore(input);
      const keywordsJson = input.keywords && input.keywords.length > 0
        ? JSON.stringify(input.keywords)
        : null;
      const imageUrlsJson = input.imageUrls && input.imageUrls.length > 0
        ? JSON.stringify(input.imageUrls)
        : null;
      const metadataJson = input.metadata && Object.keys(input.metadata).length > 0
        ? JSON.stringify(input.metadata)
        : null;

      // Read existing row to know whether this is INSERT or UPDATE
      // (Prisma upsert can't conditionally extend a JSON-as-string
      // contributor list, so we do read-then-write).
      const existing = await prisma.scraperComp.findUnique({
        where: {
          slug_sourceUrl: {
            slug: input.slug,
            sourceUrl: input.sourceUrl ?? null,
          },
        } as any,
      }).catch(() => null);

      if (existing) {
        // UPDATE — refresh + add contributor if new
        let contributors: string[] = [];
        if (existing.contributorBotsJson) {
          try {
            const parsed = JSON.parse(existing.contributorBotsJson);
            if (Array.isArray(parsed)) {
              contributors = parsed.filter((b): b is string => typeof b === "string");
            }
          } catch {
            // ignore malformed
          }
        }
        if (!contributors.includes(input.contributingBot)) {
          contributors.push(input.contributingBot);
        }

        await prisma.scraperComp.update({
          where: { id: existing.id },
          data: {
            lastSeenAt: new Date(),
            ttlExpiresAt,
            contributorBotsJson: JSON.stringify(contributors),
            // Refresh signal fields if the new pull has more/better data
            priceUsd: input.priceUsd ?? existing.priceUsd,
            soldPrice: input.soldPrice ?? existing.soldPrice,
            condition: input.condition ?? existing.condition,
            description: input.description ?? existing.description,
            keywordsJson: keywordsJson ?? existing.keywordsJson,
            imageUrlsJson: imageUrlsJson ?? existing.imageUrlsJson,
            metadataJson: metadataJson ?? existing.metadataJson,
            qualityScore: Math.max(qualityScore, existing.qualityScore ?? 0),
          },
        });
        return { deduped: true };
      }

      // INSERT — first time seeing this (slug, sourceUrl)
      await prisma.scraperComp.create({
        data: {
          slug: input.slug,
          sourceUrl: input.sourceUrl ?? null,
          sourcePlatform: input.sourcePlatform,
          title: input.title,
          description: input.description ?? null,
          priceUsd: input.priceUsd ?? null,
          soldPrice: input.soldPrice ?? null,
          condition: input.condition ?? null,
          category: input.category ?? null,
          keywordsJson,
          imageUrlsJson,
          metadataJson,
          lastSeenAt: new Date(),
          ttlExpiresAt,
          firstContributedBy: input.contributingBot,
          contributorBotsJson: JSON.stringify([input.contributingBot]),
          qualityScore,
          sourceItemId: input.sourceItemId ?? null,
          sourceUserId: input.sourceUserId ?? null,
        },
      });
      return { written: true };
    }),
  );

  for (const r of results) {
    if (r.status === "fulfilled") {
      const v = r.value as { written?: boolean; deduped?: boolean; skipped?: boolean };
      if (v.written) written++;
      else if (v.deduped) deduped++;
    } else if (process.env.NODE_ENV !== "production") {
      const msg = r.reason instanceof Error ? r.reason.message : String(r.reason);
      console.warn("[enrichment-writer] row failed:", msg);
    }
  }

  return { written, deduped };
}
