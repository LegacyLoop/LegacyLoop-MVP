/**
 * Pricing Feedback Loop — V1a
 *
 * Pure accuracy-computation module. Given a SOLD item, fetches all historical
 * PRICING_CONSENSUS_V3 (and legacy PRICING_CONSENSUS) snapshots from EventLog,
 * compares each source's predicted value against the actual sold price, and
 * persists per-source accuracy records + a per-item rollup summary.
 *
 * V1a: module + admin trigger only. V1b adds auto-fire on SOLD + nightly cron.
 * V1c adds the admin dashboard. V1d auto-tunes CATEGORY_WEIGHT_PROFILES.
 *
 * CMD-PRICING-FEEDBACK-LOOP-V1a
 */

import { prisma } from "@/lib/db";
import type { PricingSourceName, PricingConsensus } from "@/lib/pricing/reconcile";

// ── Types ──────────────────────────────────────────────────────────

export type PricingAccuracyField =
  | "listPrice"
  | "acceptPrice"
  | "floorPrice"
  | "valueLow"
  | "valueHigh";

export interface PricingAccuracyRecord {
  itemId: string;
  categoryProfile: string;
  soldPrice: number;
  soldAt: string;
  snapshotAt: string;
  ageDaysAtSnapshot: number;
  sourceName: PricingSourceName;
  sourceField: PricingAccuracyField;
  predictedValue: number;
  actualDelta: number;
  percentError: number;
  effectiveWeight: number;
}

export type SoldPriceSource =
  | "item_field"
  | "transaction"
  | "seller_earnings"
  | "unresolved";

export interface SoldPriceResolution {
  price: number | null;
  source: SoldPriceSource;
}

export interface PricingAccuracyItemSummary {
  itemId: string;
  categoryProfile: string;
  soldPrice: number;
  soldAt: string;
  soldPriceSource: SoldPriceSource;
  snapshotCount: number;
  recordCount: number;
  bestSource: PricingSourceName | null;
  bestSourceAbsPercentError: number | null;
  averageAbsPercentError: number;
  earliestSnapshotAgeDays: number;
  latestSnapshotAgeDays: number;
}

export interface ComputeAccuracyResult {
  status:
    | "ok"
    | "no_snapshots"
    | "not_sold"
    | "already_computed"
    | "error";
  records: PricingAccuracyRecord[];
  summary: PricingAccuracyItemSummary | null;
  message?: string;
}

const TERMINAL_STATUSES = new Set(["SOLD", "SHIPPED", "COMPLETED"]);

// ── Helpers ────────────────────────────────────────────────────────

function safeJson(raw: string | null | undefined): unknown {
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

type ItemLike = {
  id: string;
  status: string;
  soldPrice: number | null;
  soldAt: Date | null;
};

async function resolveSoldPrice(
  itemId: string,
  item: ItemLike,
): Promise<SoldPriceResolution> {
  // Tier 1: Item.soldPrice (direct field — fastest)
  if (typeof item.soldPrice === "number" && item.soldPrice > 0) {
    return { price: item.soldPrice, source: "item_field" };
  }

  // Tier 2: Transaction (most-recent COMPLETED ITEM_SALE for this item)
  try {
    const tx = await prisma.transaction.findFirst({
      where: {
        itemId,
        type: "ITEM_SALE",
        status: "COMPLETED",
      },
      orderBy: { createdAt: "desc" },
      select: { amount: true },
    });
    if (tx && typeof tx.amount === "number" && tx.amount > 0) {
      return { price: tx.amount, source: "transaction" };
    }
  } catch (err) {
    console.warn("[resolveSoldPrice] transaction lookup failed", err);
  }

  // Tier 3: SellerEarnings (settled per-item seller row —
  // PaymentLedger has no itemId FK so SellerEarnings is the
  // authoritative per-item settlement source)
  try {
    const earnings = await prisma.sellerEarnings.findFirst({
      where: {
        itemId,
        status: { in: ["available", "paid_out"] },
      },
      orderBy: { createdAt: "desc" },
      select: { saleAmount: true },
    });
    if (earnings && typeof earnings.saleAmount === "number" && earnings.saleAmount > 0) {
      return { price: earnings.saleAmount, source: "seller_earnings" };
    }
  } catch (err) {
    console.warn("[resolveSoldPrice] seller earnings lookup failed", err);
  }

  return { price: null, source: "unresolved" };
}

function resolveSoldAt(item: ItemLike): string | null {
  if (item.soldAt instanceof Date) return item.soldAt.toISOString();
  return null;
}

async function persistAccuracyRecords(
  itemId: string,
  records: PricingAccuracyRecord[],
  summary: PricingAccuracyItemSummary,
): Promise<void> {
  await prisma.eventLog.createMany({
    data: records.map(r => ({
      itemId,
      eventType: "PRICING_ACCURACY_RECORD",
      payload: JSON.stringify(r),
    })),
  }).catch((err) => {
    console.error("[feedback-loop] records createMany failed", err);
  });

  await prisma.eventLog.create({
    data: {
      itemId,
      eventType: "PRICING_ACCURACY_ITEM_COMPLETE",
      payload: JSON.stringify(summary),
    },
  }).catch((err) => {
    console.error("[feedback-loop] summary create failed", err);
  });
}

// ── Main ───────────────────────────────────────────────────────────

/**
 * Computes accuracy records + summary for a SOLD item by comparing each
 * historical consensus snapshot's source predictions against the actual
 * sold price.
 *
 * Idempotent: returns cached summary if a PRICING_ACCURACY_ITEM_COMPLETE
 * row already exists for this itemId, unless { force: true } is passed.
 */
export async function computePricingAccuracy(
  itemId: string,
  opts?: { force?: boolean },
): Promise<ComputeAccuracyResult> {
  try {
    const item = await prisma.item.findUnique({
      where: { id: itemId },
      select: { id: true, status: true, soldPrice: true, soldAt: true },
    });
    if (!item) {
      return {
        status: "error", records: [], summary: null,
        message: "Item not found",
      };
    }

    if (!TERMINAL_STATUSES.has(item.status)) {
      return {
        status: "not_sold", records: [], summary: null,
        message: `Item status is ${item.status} — not yet sold`,
      };
    }

    const soldResolution = await resolveSoldPrice(itemId, item);
    const soldPrice = soldResolution.price;
    const soldAt = resolveSoldAt(item);
    if (soldPrice == null || soldAt == null) {
      return {
        status: "error", records: [], summary: null,
        message: `Could not resolve sold price (source: ${soldResolution.source}) or sold-at timestamp`,
      };
    }

    if (!opts?.force) {
      const existing = await prisma.eventLog.findFirst({
        where: { itemId, eventType: "PRICING_ACCURACY_ITEM_COMPLETE" },
        orderBy: { createdAt: "desc" },
        select: { payload: true },
      });
      if (existing?.payload) {
        const parsed = safeJson(existing.payload);
        if (parsed && typeof parsed === "object") {
          return {
            status: "already_computed",
            records: [],
            summary: parsed as PricingAccuracyItemSummary,
            message: "Cached — pass { force: true } to recompute",
          };
        }
      }
    }

    const snapshotLogs = await prisma.eventLog.findMany({
      where: {
        itemId,
        eventType: { in: ["PRICING_CONSENSUS_V3", "PRICING_CONSENSUS"] },
      },
      orderBy: { createdAt: "asc" },
      select: { payload: true, createdAt: true },
    });
    if (snapshotLogs.length === 0) {
      return {
        status: "no_snapshots", records: [], summary: null,
        message: "No consensus snapshots found for this item",
      };
    }

    const records: PricingAccuracyRecord[] = [];
    let categoryProfile = "default";
    const soldAtMs = new Date(soldAt).getTime();

    for (const log of snapshotLogs) {
      const snap = safeJson(log.payload) as PricingConsensus | null;
      if (!snap || !Array.isArray(snap.sources)) continue;
      if (snap.categoryProfile) categoryProfile = snap.categoryProfile;

      const snapshotAt = log.createdAt.toISOString();
      const ageMs = soldAtMs - log.createdAt.getTime();
      const ageDays = Math.max(0, Math.round(ageMs / 86_400_000));

      for (const src of snap.sources) {
        const fields: Array<{ field: PricingAccuracyField; value: number | undefined }> = [
          { field: "listPrice",   value: src.listPrice },
          { field: "acceptPrice", value: src.acceptPrice },
          { field: "floorPrice",  value: src.floorPrice },
          { field: "valueLow",    value: src.valueLow },
          { field: "valueHigh",   value: src.valueHigh },
        ];
        for (const { field, value } of fields) {
          if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) continue;
          const delta = soldPrice - value;
          const pctErr = Math.abs(delta) / soldPrice;
          records.push({
            itemId,
            categoryProfile,
            soldPrice,
            soldAt,
            snapshotAt,
            ageDaysAtSnapshot: ageDays,
            sourceName: src.name,
            sourceField: field,
            predictedValue: value,
            actualDelta: delta,
            percentError: pctErr,
            effectiveWeight: src.effectiveWeight ?? 0,
          });
        }
      }
    }

    if (records.length === 0) {
      return {
        status: "no_snapshots", records: [], summary: null,
        message: "Snapshots present but no predicted values",
      };
    }

    const sorted = [...records].sort((a, b) => a.percentError - b.percentError);
    const best = sorted[0];
    const avgAbsPct =
      records.reduce((s, r) => s + r.percentError, 0) / records.length;
    const ageDaysValues = records.map(r => r.ageDaysAtSnapshot);

    const summary: PricingAccuracyItemSummary = {
      itemId,
      categoryProfile,
      soldPrice,
      soldAt,
      soldPriceSource: soldResolution.source,
      snapshotCount: snapshotLogs.length,
      recordCount: records.length,
      bestSource: best?.sourceName ?? null,
      bestSourceAbsPercentError: best?.percentError ?? null,
      averageAbsPercentError: avgAbsPct,
      earliestSnapshotAgeDays: Math.max(...ageDaysValues),
      latestSnapshotAgeDays: Math.min(...ageDaysValues),
    };

    await persistAccuracyRecords(itemId, records, summary);

    return { status: "ok", records, summary };
  } catch (error) {
    console.error("[computePricingAccuracy]", error);
    return {
      status: "error",
      records: [],
      summary: null,
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
