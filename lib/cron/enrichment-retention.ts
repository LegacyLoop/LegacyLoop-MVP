/**
 * CMD-SCRAPER-ENRICHMENT-E
 * ScraperComp retention sweep — deletes past-TTL rows that earned
 * zero cache hits. Rows with hitCount > 0 are kept (they paid for
 * themselves). NOT scheduled in this round; a future
 * CMD-CRON-WIRING-X command wires it to Vercel Cron / n8n.
 *
 * Callable manually from a future /api/admin/* trigger or REPL.
 *
 * Updated: 2026-04-08
 * Author: Ryan Hallee
 */

import { prisma } from "@/lib/db";

export async function runEnrichmentRetention(): Promise<{
  deleted: number;
  retained: number;
}> {
  const now = new Date();

  try {
    // Count what we'll keep (past TTL but earned hits)
    const retained = await prisma.scraperComp.count({
      where: {
        ttlExpiresAt: { lt: now },
        hitCount: { gt: 0 },
      },
    });

    // Delete past TTL rows that never served a single cache hit
    const deleted = await prisma.scraperComp.deleteMany({
      where: {
        ttlExpiresAt: { lt: now },
        hitCount: 0,
      },
    });

    console.log(
      `[enrichment-retention] deleted ${deleted.count} expired comps (hitCount=0), retained ${retained} comps with cache hits`,
    );

    return { deleted: deleted.count, retained };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[enrichment-retention] sweep failed:", msg);
    return { deleted: 0, retained: 0 };
  }
}
