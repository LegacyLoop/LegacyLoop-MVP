import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { computePricingAccuracy } from "@/lib/pricing/feedback-loop";
import { authAdapter } from "@/lib/adapters/auth";
import { isAdmin } from "@/lib/constants/admin";

/**
 * POST /api/cron/pricing-accuracy-sweep
 *
 * Nightly sweeper that catches SOLD items whose V1c handleSoldTransition
 * hook was bypassed (manual DB updates, future routes missing the import,
 * historical gaps, transient hook failures). Calls computePricingAccuracy
 * for any SOLD/SHIPPED/COMPLETED item without a
 * PRICING_ACCURACY_ITEM_COMPLETE EventLog row.
 *
 * Auth: CRON_SECRET via Authorization: Bearer / x-cron-secret header /
 * ?secret= query param (matches existing cron pattern); OR admin session
 * for manual triggering.
 *
 * Query params:
 *   ?max=N — clamp candidates (1-250, default 100)
 *
 * CMD-PRICING-FEEDBACK-LOOP-V1d
 */

export const maxDuration = 60;

interface SweepSummary {
  processed: number;
  ok: number;
  already_computed: number;
  no_snapshots: number;
  not_sold: number;
  errors: number;
  sampleErrors: string[];
  durationMs: number;
  triggeredBy: "cron" | "admin";
  maxItems: number;
}

export async function POST(req: NextRequest) {
  const startedAt = Date.now();

  // Auth: CRON_SECRET OR admin session
  const authHeader = req.headers.get("authorization");
  const cronHeader = req.headers.get("x-cron-secret");
  const querySecret = req.nextUrl.searchParams.get("secret");
  const cronSecret = process.env.CRON_SECRET ?? "";
  const providedSecret =
    authHeader?.replace(/^Bearer\s+/i, "") || cronHeader || querySecret || "";
  const isCronAuthorized = cronSecret.length > 0 && providedSecret === cronSecret;

  let triggeredBy: "cron" | "admin" = "cron";
  if (!isCronAuthorized) {
    const session = await authAdapter.getSession();
    if (!session || !isAdmin(session.email)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    triggeredBy = "admin";
  }

  const maxItems = Math.max(1, Math.min(
    250,
    Number(req.nextUrl.searchParams.get("max")) || 100,
  ));

  const candidates = await prisma.item.findMany({
    where: {
      status: { in: ["SOLD", "SHIPPED", "COMPLETED"] },
      eventLogs: {
        none: { eventType: "PRICING_ACCURACY_ITEM_COMPLETE" },
      },
    },
    orderBy: { createdAt: "desc" },
    take: maxItems,
    select: { id: true },
  });

  const summary: SweepSummary = {
    processed: 0,
    ok: 0,
    already_computed: 0,
    no_snapshots: 0,
    not_sold: 0,
    errors: 0,
    sampleErrors: [],
    durationMs: 0,
    triggeredBy,
    maxItems,
  };

  for (const item of candidates) {
    summary.processed += 1;
    try {
      const result = await computePricingAccuracy(item.id);
      switch (result.status) {
        case "ok":
          summary.ok += 1;
          break;
        case "already_computed":
          summary.already_computed += 1;
          break;
        case "no_snapshots":
          summary.no_snapshots += 1;
          break;
        case "not_sold":
          summary.not_sold += 1;
          break;
        case "error":
          summary.errors += 1;
          if (summary.sampleErrors.length < 5 && result.message) {
            summary.sampleErrors.push(`${item.id}: ${result.message}`);
          }
          break;
      }
    } catch (err) {
      summary.errors += 1;
      if (summary.sampleErrors.length < 5) {
        summary.sampleErrors.push(
          `${item.id}: ${err instanceof Error ? err.message : "Unknown"}`,
        );
      }
    }
  }

  summary.durationMs = Date.now() - startedAt;

  // Aggregate run log for V1e dashboard. EventLog.itemId is a required FK;
  // attach to first processed item when present. Empty run → console-only.
  if (candidates.length > 0) {
    await prisma.eventLog.create({
      data: {
        itemId: candidates[0].id,
        eventType: "PRICING_ACCURACY_SWEEP_RUN",
        payload: JSON.stringify(summary),
      },
    }).catch((err) => {
      console.error("[sweep] aggregate log failed", err);
    });
  } else {
    console.log("[PRICING_ACCURACY_SWEEP_RUN] empty run", summary);
  }

  return NextResponse.json(summary);
}
