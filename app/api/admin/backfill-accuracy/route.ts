import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { authAdapter } from "@/lib/adapters/auth";
import { isAdmin } from "@/lib/constants/admin";
import { computePricingAccuracy } from "@/lib/pricing/feedback-loop";

/**
 * POST /api/admin/backfill-accuracy
 *
 * Retroactive accuracy seeding across historical SOLD inventory. Loops
 * SOLD/SHIPPED/COMPLETED items and calls computePricingAccuracy for each.
 * Idempotent (skips already-computed unless force), cap-limited (≤250).
 *
 * Body (all optional):
 *   maxItems: number (1-250, default 50)
 *   force:    boolean (default false)
 *   dryRun:   boolean (default false)
 *
 * CMD-SOLD-PRICE-BACKFILL
 */

interface BackfillRequest {
  maxItems?: number;
  force?: boolean;
  dryRun?: boolean;
}

type SourceKey =
  | "item_field"
  | "transaction"
  | "seller_earnings"
  | "unresolved";

interface BackfillSummary {
  processed: number;
  ok: number;
  no_snapshots: number;
  not_sold: number;
  already_computed: number;
  errors: number;
  source_breakdown: Record<SourceKey, number>;
  sample_errors: string[];
  durationMs: number;
  dryRun: boolean;
}

function emptyBreakdown(): Record<SourceKey, number> {
  return { item_field: 0, transaction: 0, seller_earnings: 0, unresolved: 0 };
}

function isSourceKey(s: string | undefined): s is SourceKey {
  return s === "item_field" || s === "transaction"
    || s === "seller_earnings" || s === "unresolved";
}

export async function POST(req: Request) {
  const startedAt = Date.now();
  try {
    const session = await authAdapter.getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!isAdmin(session.email)) {
      return NextResponse.json(
        { error: "Forbidden — admin only" }, { status: 403 });
    }

    let body: BackfillRequest = {};
    try { body = (await req.json()) as BackfillRequest; } catch {}
    const maxItems = Math.max(1, Math.min(250, body.maxItems ?? 50));
    const force = body.force === true;
    const dryRun = body.dryRun === true;

    const candidates = await prisma.item.findMany({
      where: { status: { in: ["SOLD", "SHIPPED", "COMPLETED"] } },
      orderBy: { createdAt: "desc" },
      take: maxItems,
      select: { id: true },
    });

    if (dryRun) {
      return NextResponse.json({
        processed: 0,
        ok: 0,
        no_snapshots: 0,
        not_sold: 0,
        already_computed: 0,
        errors: 0,
        source_breakdown: emptyBreakdown(),
        sample_errors: [],
        durationMs: Date.now() - startedAt,
        dryRun: true,
        message: `Dry run — would process ${candidates.length} items (cap: ${maxItems})`,
      });
    }

    const summary: BackfillSummary = {
      processed: 0,
      ok: 0,
      no_snapshots: 0,
      not_sold: 0,
      already_computed: 0,
      errors: 0,
      source_breakdown: emptyBreakdown(),
      sample_errors: [],
      durationMs: 0,
      dryRun: false,
    };

    for (const item of candidates) {
      summary.processed += 1;
      try {
        const result = await computePricingAccuracy(item.id, { force });
        switch (result.status) {
          case "ok": {
            summary.ok += 1;
            const src = result.summary?.soldPriceSource;
            if (isSourceKey(src)) summary.source_breakdown[src] += 1;
            break;
          }
          case "no_snapshots":
            summary.no_snapshots += 1;
            break;
          case "not_sold":
            summary.not_sold += 1;
            break;
          case "already_computed": {
            summary.already_computed += 1;
            const src = result.summary?.soldPriceSource;
            if (isSourceKey(src)) summary.source_breakdown[src] += 1;
            break;
          }
          case "error":
            summary.errors += 1;
            if (summary.sample_errors.length < 5 && result.message) {
              summary.sample_errors.push(`${item.id}: ${result.message}`);
            }
            break;
        }
      } catch (err) {
        summary.errors += 1;
        if (summary.sample_errors.length < 5) {
          summary.sample_errors.push(
            `${item.id}: ${err instanceof Error ? err.message : "Unknown"}`);
        }
      }
    }

    summary.durationMs = Date.now() - startedAt;

    // EventLog.itemId is required (non-nullable FK) — cannot write an
    // aggregate run-log row without a sentinel item. Log to console for
    // server-side trail; the HTTP response carries the full summary.
    console.log("[PRICING_ACCURACY_BACKFILL_RUN]", JSON.stringify({
      ...summary,
      triggeredBy: session.email,
      maxItems,
      force,
    }));

    return NextResponse.json(summary);
  } catch (error) {
    console.error("[/api/admin/backfill-accuracy]", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown",
      },
      { status: 500 },
    );
  }
}
