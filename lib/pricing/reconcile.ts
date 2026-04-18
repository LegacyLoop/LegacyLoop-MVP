/**
 * Pricing Reconciliation Layer (PRL) — V1
 *
 * Single source of truth for item pricing. Reads every available price
 * source, applies weighted-median consensus with freshness decay, and
 * returns one canonical PricingConsensus object.
 *
 * Deterministic. Same inputs → same output. Auditable.
 * CMD-PRICING-CONSENSUS-V1
 */

import { prisma } from "@/lib/db";
import { CATEGORY_WEIGHT_PROFILES, pickPricingCategory, type PricingCategory } from "./constants";

// ── Types ──────────────────────────────────────────────────────────

export type PricingSourceName =
  | "v8_engine"
  | "pricebot_ai"
  | "megabot_consensus"
  | "intelligence_claude"
  | "analyzebot_estimate"
  | "v2_valuation"
  | "market_comps_median";

export interface PricingSourceSnapshot {
  name: PricingSourceName;
  weight: number;
  freshness: number;
  effectiveWeight: number;
  timestamp: string;
  confidence?: number;
  listPrice?: number;
  acceptPrice?: number;
  floorPrice?: number;
  valueLow?: number;
  valueHigh?: number;
}

export interface PricingDissent {
  field: "listPrice" | "acceptPrice" | "floorPrice" | "valueRange";
  spreadPct: number;
  values: Array<{ source: PricingSourceName; value: number }>;
}

export interface PricingDroppedOutlier {
  source: PricingSourceName;
  field: "listPrice" | "acceptPrice" | "floorPrice";
  value: number;
  deviation: number;
}

export interface PricingIdentityPenalty {
  source: PricingSourceName;
  reason: string;
}

export interface PricingConsensus {
  consensusListPrice: number;
  consensusAcceptPrice: number;
  consensusFloorPrice: number;
  consensusValueLow: number;
  consensusValueHigh: number;
  consensusConfidence: number;
  agreementScore: number;
  freshnessScore: number;
  sourceCount: number;
  sources: PricingSourceSnapshot[];
  dissents: PricingDissent[];
  primaryDisplayLabel: string;
  warningBanner: string | null;
  confidenceTier: "high" | "medium" | "low";
  computedAt: string;
  // V3 additions (all optional on reader side for backward-compat)
  droppedOutliers?: PricingDroppedOutlier[];
  identityPenalized?: PricingIdentityPenalty[];
  categoryProfile?: PricingCategory;
  trustScore?: number;
  trustTier?: "high" | "medium" | "low";
  v: 1 | 2;
}

// ── Helpers ────────────────────────────────────────────────────────

function freshnessDecay(ageMs: number): number {
  const HOUR = 3_600_000;
  if (ageMs < 24 * HOUR) return 1.0;
  if (ageMs < 7 * 24 * HOUR) return 0.7;
  if (ageMs < 30 * 24 * HOUR) return 0.4;
  return 0.1;
}

function weightedMedian(pairs: Array<{ value: number; weight: number }>): number | null {
  const f = pairs.filter(p => Number.isFinite(p.value) && p.weight > 0);
  if (f.length === 0) return null;
  if (f.length === 1) return f[0].value;
  const sorted = [...f].sort((a, b) => a.value - b.value);
  const total = sorted.reduce((s, p) => s + p.weight, 0);
  let cum = 0;
  for (const p of sorted) {
    cum += p.weight;
    if (cum >= total / 2) return p.value;
  }
  return sorted[sorted.length - 1].value;
}

function spreadPct(values: number[]): number {
  if (values.length < 2) return 0;
  const min = Math.min(...values);
  const max = Math.max(...values);
  if (min <= 0) return max > 0 ? 1 : 0;
  return (max - min) / min;
}

function safeJson(raw: string | null | undefined): any {
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

// ── Main ───────────────────────────────────────────────────────────

export interface ComputePricingConsensusOptions {
  category?: string | null;
  brand?: string | null;
  isAntique?: boolean;
  isCollectible?: boolean;
}

export async function computePricingConsensus(
  itemId: string,
  opts?: ComputePricingConsensusOptions,
): Promise<PricingConsensus | null> {
  const snapshots: PricingSourceSnapshot[] = [];
  const now = Date.now();

  const categoryProfile = pickPricingCategory(
    opts?.category, opts?.brand, opts?.isAntique, opts?.isCollectible,
  );
  const weights = CATEGORY_WEIGHT_PROFILES[categoryProfile];

  // 1a. V2 Valuation
  const val = await prisma.valuation.findUnique({ where: { itemId } }).catch(() => null);
  if (val && val.low != null && val.high != null) {
    const ts = ((val as any).updatedAt ?? (val as any).createdAt ?? new Date()).toISOString();
    const fresh = freshnessDecay(now - new Date(ts).getTime());
    snapshots.push({
      name: "v2_valuation", weight: weights.v2_valuation,
      freshness: fresh, effectiveWeight: weights.v2_valuation * fresh,
      timestamp: ts, valueLow: Number(val.low), valueHigh: Number(val.high),
      confidence: val.confidence ? Math.round(val.confidence > 1 ? val.confidence : val.confidence * 100) : undefined,
    });
  }

  // 1b. V8 engine — V9-WIRE: prefer V9 event, fall back to V8 for items
  // computed before V9-WIRE landed. Snapshot name stays "v8_engine" — the
  // source IS the engine regardless of emission version.
  const v8Log = await prisma.eventLog.findFirst({
    where: { itemId, eventType: { in: ["GARAGE_SALE_V9_CALC", "GARAGE_SALE_V8_CALC"] } },
    orderBy: { createdAt: "desc" }, select: { payload: true, createdAt: true },
  }).catch(() => null);
  if (v8Log?.payload) {
    const v8 = safeJson(v8Log.payload);
    if (v8) {
      const ts = v8Log.createdAt.toISOString();
      const fresh = freshnessDecay(now - v8Log.createdAt.getTime());
      snapshots.push({
        name: "v8_engine", weight: weights.v8_engine,
        freshness: fresh, effectiveWeight: weights.v8_engine * fresh,
        timestamp: ts,
        listPrice: typeof v8.listPrice === "number" ? v8.listPrice : undefined,
        acceptPrice: typeof v8.acceptPrice === "number" ? v8.acceptPrice : undefined,
        floorPrice: typeof v8.floorPrice === "number" ? v8.floorPrice : undefined,
      });
    }
  }

  // 1c. PriceBot AI result
  const pbLog = await prisma.eventLog.findFirst({
    where: { itemId, eventType: "PRICEBOT_RUN" },
    orderBy: { createdAt: "desc" }, select: { payload: true, createdAt: true },
  }).catch(() => null);
  if (pbLog?.payload) {
    const pb = safeJson(pbLog.payload);
    if (pb) {
      const ts = pbLog.createdAt.toISOString();
      const fresh = freshnessDecay(now - pbLog.createdAt.getTime());
      const result = pb?.result || pb;
      const lp = result?.localPrice?.mid ?? result?.localPrice?.low;
      const valLow = result?.localPrice?.low ?? result?.nationalPrice?.low;
      const valHigh = result?.bestMarket?.high ?? result?.nationalPrice?.high;
      if (typeof lp === "number" || typeof valLow === "number") {
        snapshots.push({
          name: "pricebot_ai", weight: weights.pricebot_ai,
          freshness: fresh, effectiveWeight: weights.pricebot_ai * fresh,
          timestamp: ts,
          acceptPrice: typeof lp === "number" ? lp : undefined,
          valueLow: typeof valLow === "number" ? valLow : undefined,
          valueHigh: typeof valHigh === "number" ? valHigh : undefined,
          confidence: typeof result?.confidence === "number" ? Math.round(result.confidence > 1 ? result.confidence : result.confidence * 100) : undefined,
        });
      }
    }
  }

  // 1d. Intelligence Claude
  const intelLog = await prisma.eventLog.findFirst({
    where: { itemId, eventType: "INTELLIGENCE_RESULT" },
    orderBy: { createdAt: "desc" }, select: { payload: true, createdAt: true },
  }).catch(() => null);
  if (intelLog?.payload) {
    const intel = safeJson(intelLog.payload);
    const pi = intel?.pricingIntel || intel?.result?.pricingIntel;
    if (pi) {
      const ts = intelLog.createdAt.toISOString();
      const fresh = freshnessDecay(now - intelLog.createdAt.getTime());
      snapshots.push({
        name: "intelligence_claude", weight: weights.intelligence_claude,
        freshness: fresh, effectiveWeight: weights.intelligence_claude * fresh,
        timestamp: ts,
        listPrice: typeof pi.premiumPrice === "number" ? pi.premiumPrice : undefined,
        acceptPrice: typeof pi.sweetSpot === "number" ? pi.sweetSpot : undefined,
        floorPrice: typeof pi.quickSalePrice === "number" ? pi.quickSalePrice : undefined,
        valueLow: typeof pi.recommendedLow === "number" ? pi.recommendedLow : undefined,
        valueHigh: typeof pi.recommendedHigh === "number" ? pi.recommendedHigh : undefined,
        confidence: pi.confidence === "high" ? 90 : pi.confidence === "medium" ? 70 : pi.confidence === "low" ? 40 : undefined,
      });
    }
  }

  // 1e. AnalyzeBot estimate
  const aiResult = await prisma.aiResult.findUnique({ where: { itemId } }).catch(() => null);
  if (aiResult?.rawJson) {
    const ai = safeJson(aiResult.rawJson);
    if (ai) {
      const ts = ((aiResult as any).updatedAt ?? (aiResult as any).createdAt ?? new Date()).toISOString();
      const fresh = freshnessDecay(now - new Date(ts).getTime());
      const vL = ai.estimated_value_low ?? ai.estimatedValueLow;
      const vH = ai.estimated_value_high ?? ai.estimatedValueHigh;
      const vM = ai.estimated_value_mid ?? ai.estimatedValueMid ?? (typeof vL === "number" && typeof vH === "number" ? Math.round((vL + vH) / 2) : undefined);
      if (typeof vL === "number" || typeof vM === "number") {
        snapshots.push({
          name: "analyzebot_estimate", weight: weights.analyzebot_estimate,
          freshness: fresh, effectiveWeight: weights.analyzebot_estimate * fresh,
          timestamp: ts, acceptPrice: typeof vM === "number" ? vM : undefined,
          valueLow: typeof vL === "number" ? vL : undefined, valueHigh: typeof vH === "number" ? vH : undefined,
          confidence: typeof aiResult.confidence === "number" ? Math.round(aiResult.confidence > 1 ? aiResult.confidence : aiResult.confidence * 100) : undefined,
        });
      }
    }
  }

  // 1f. Market comps median
  const compsLog = await prisma.eventLog.findFirst({
    where: { itemId, eventType: "ANALYZEBOT_MARKET_INTEL" },
    orderBy: { createdAt: "desc" }, select: { payload: true, createdAt: true },
  }).catch(() => null);
  if (compsLog?.payload) {
    const comps = safeJson(compsLog.payload);
    if (comps && typeof comps.median === "number" && comps.median > 0) {
      const ts = compsLog.createdAt.toISOString();
      const fresh = freshnessDecay(now - compsLog.createdAt.getTime());
      snapshots.push({
        name: "market_comps_median", weight: weights.market_comps_median,
        freshness: fresh, effectiveWeight: weights.market_comps_median * fresh,
        timestamp: ts, acceptPrice: comps.median,
        valueLow: comps.low ?? undefined, valueHigh: comps.high ?? undefined,
      });
    }
  }

  // 2. No sources → null (caller renders fallback)
  if (snapshots.length === 0) return null;

  // 2b. OUTLIER DETECTION — down-weight sources >2σ from mean per field
  const droppedOutliers: PricingDroppedOutlier[] = [];
  if (snapshots.length >= 3) {
    const fields: Array<"listPrice" | "acceptPrice" | "floorPrice"> = ["listPrice", "acceptPrice", "floorPrice"];
    for (const f of fields) {
      const present = snapshots.filter(s => typeof (s as any)[f] === "number");
      if (present.length < 3) continue;
      const values = present.map(s => (s as any)[f] as number);
      const mean = values.reduce((a, b) => a + b, 0) / values.length;
      const variance = values.reduce((a, b) => a + (b - mean) ** 2, 0) / values.length;
      const sd = Math.sqrt(variance);
      if (sd <= 0) continue;
      for (const s of present) {
        const v = (s as any)[f] as number;
        const dev = Math.abs(v - mean) / sd;
        if (dev > 2) {
          s.effectiveWeight = s.effectiveWeight * 0.15;
          droppedOutliers.push({ source: s.name, field: f, value: v, deviation: Math.round(dev * 100) / 100 });
        }
      }
    }
  }

  // 2c. IDENTITY ANCHOR — if AnalyzeBot ≥80% confident, penalize sources
  // whose category/brand payload clearly diverges. Lightweight heuristic:
  // only fires when we have actual mismatch signal in opts vs source timestamps.
  const identityPenalized: PricingIdentityPenalty[] = [];
  const anchor = snapshots.find(s => s.name === "analyzebot_estimate" && typeof s.confidence === "number" && s.confidence >= 80);
  if (anchor && snapshots.length >= 2 && opts?.category) {
    const anchorMid = anchor.acceptPrice ?? (anchor.valueLow && anchor.valueHigh ? (anchor.valueLow + anchor.valueHigh) / 2 : null);
    if (anchorMid && anchorMid > 0) {
      for (const s of snapshots) {
        if (s.name === "analyzebot_estimate") continue;
        const sMid = s.acceptPrice ?? (s.valueLow && s.valueHigh ? (s.valueLow + s.valueHigh) / 2 : null);
        if (sMid && sMid > 0) {
          const ratio = sMid / anchorMid;
          if (ratio > 4 || ratio < 0.25) {
            s.effectiveWeight = s.effectiveWeight * 0.30;
            identityPenalized.push({ source: s.name, reason: `value ${Math.round(ratio * 100) / 100}× anchor; likely different item spec` });
          }
        }
      }
    }
  }

  // 3. Weighted-median consensus
  const acceptPairs = snapshots.filter(s => typeof s.acceptPrice === "number").map(s => ({ value: s.acceptPrice!, weight: s.effectiveWeight }));
  const listPairs = snapshots.filter(s => typeof s.listPrice === "number").map(s => ({ value: s.listPrice!, weight: s.effectiveWeight }));
  const floorPairs = snapshots.filter(s => typeof s.floorPrice === "number").map(s => ({ value: s.floorPrice!, weight: s.effectiveWeight }));
  const vlPairs = snapshots.filter(s => typeof s.valueLow === "number").map(s => ({ value: s.valueLow!, weight: s.effectiveWeight }));
  const vhPairs = snapshots.filter(s => typeof s.valueHigh === "number").map(s => ({ value: s.valueHigh!, weight: s.effectiveWeight }));

  let cAccept = weightedMedian(acceptPairs) ?? 0;
  let cList = weightedMedian(listPairs) ?? Math.round(cAccept * 1.20);
  let cFloor = weightedMedian(floorPairs) ?? Math.round(cAccept * 0.70);
  const cValueLow = Math.round(weightedMedian(vlPairs) ?? cAccept * 0.85);
  const cValueHigh = Math.round(weightedMedian(vhPairs) ?? cAccept * 1.30);

  // 4. Invariant: list ≥ accept ≥ floor
  if (cList < cAccept) cAccept = Math.round(cList * 0.85);
  if (cFloor > cAccept) cFloor = Math.round(cAccept * 0.85);
  cList = Math.round(cList);
  cAccept = Math.round(cAccept);
  cFloor = Math.round(cFloor);

  // 5. Dissent detection
  const dissents: PricingDissent[] = [];
  for (const [field, pairs] of [["acceptPrice", acceptPairs], ["listPrice", listPairs], ["floorPrice", floorPairs]] as const) {
    if (pairs.length >= 2 && spreadPct(pairs.map(p => p.value)) > 0.25) {
      dissents.push({
        field: field as PricingDissent["field"],
        spreadPct: spreadPct(pairs.map(p => p.value)),
        values: snapshots.filter(s => typeof (s as any)[field] === "number").map(s => ({ source: s.name, value: (s as any)[field] })),
      });
    }
  }
  if (vhPairs.length >= 2 && spreadPct(vhPairs.map(p => p.value)) > 0.40) {
    dissents.push({
      field: "valueRange", spreadPct: spreadPct(vhPairs.map(p => p.value)),
      values: snapshots.filter(s => typeof s.valueHigh === "number").map(s => ({ source: s.name, value: s.valueHigh! })),
    });
  }

  // 6. Confidence + agreement
  const totalEW = snapshots.reduce((s, sn) => s + sn.effectiveWeight, 0);
  const totalRW = snapshots.reduce((s, sn) => s + sn.weight, 0);
  const freshnessScore = Math.round((totalEW / Math.max(totalRW, 0.001)) * 100);

  const considered = [acceptPairs, listPairs, floorPairs].filter(a => a.length >= 2).length;
  const lowSpread = [acceptPairs, listPairs, floorPairs].filter(a => a.length >= 2 && spreadPct(a.map(p => p.value)) <= 0.25).length;
  const agreementScore = considered > 0 ? Math.round((lowSpread / considered) * 100) : 100;

  const confAcc = snapshots.filter(s => typeof s.confidence === "number").reduce((a, s) => {
    a.tw += s.effectiveWeight; a.ws += (s.confidence!) * s.effectiveWeight; return a;
  }, { tw: 0, ws: 0 });
  const baseConf = confAcc.tw > 0 ? confAcc.ws / confAcc.tw : 60;
  const dissentPenalty = Math.min(30, dissents.length * 10);
  const consensusConfidence = Math.max(0, Math.min(100, Math.round(baseConf * (freshnessScore / 100) - dissentPenalty)));
  const confidenceTier: "high" | "medium" | "low" = consensusConfidence >= 80 ? "high" : consensusConfidence >= 50 ? "medium" : "low";

  // 7. UI-ready
  const primaryDisplayLabel = `List $${cList} · Accept $${cAccept} · Floor $${cFloor}`;
  const warningBanner = dissents.length >= 2
    ? `Pricing sources disagree by ${Math.round(Math.max(...dissents.map(d => d.spreadPct)) * 100)}% on ${dissents.length} fields. Re-run PriceBot to reconcile.`
    : dissents.length === 1
    ? `Pricing source disagreement on ${dissents[0].field} (${Math.round(dissents[0].spreadPct * 100)}% spread).`
    : null;

  // 7b. Trust Score — unified 0-100 blended signal
  const trustScore = Math.max(0, Math.min(100, Math.round(
    0.4 * agreementScore
    + 0.3 * freshnessScore
    + 0.2 * (Math.min(snapshots.length, 7) / 7 * 100)
    + 0.1 * consensusConfidence
  )));
  const trustTier: "high" | "medium" | "low" = trustScore >= 80 ? "high" : trustScore >= 50 ? "medium" : "low";

  // 8. Assemble + persist
  const consensus: PricingConsensus = {
    consensusListPrice: cList, consensusAcceptPrice: cAccept, consensusFloorPrice: cFloor,
    consensusValueLow: cValueLow, consensusValueHigh: cValueHigh,
    consensusConfidence, agreementScore, freshnessScore,
    sourceCount: snapshots.length, sources: snapshots, dissents,
    primaryDisplayLabel, warningBanner, confidenceTier,
    droppedOutliers, identityPenalized, categoryProfile,
    trustScore, trustTier,
    computedAt: new Date().toISOString(), v: 2 as const,
  };

  prisma.eventLog.create({
    data: { itemId, eventType: "PRICING_CONSENSUS_V3", payload: JSON.stringify(consensus) },
  }).catch(() => null);

  // V3 telemetry: log dropped outliers + identity penalties for model calibration
  for (const d of droppedOutliers) {
    prisma.eventLog.create({
      data: { itemId, eventType: "PRICING_SOURCE_DROPPED",
        payload: JSON.stringify({ cause: "outlier", ...d }) },
    }).catch(() => null);
  }
  for (const p of identityPenalized) {
    prisma.eventLog.create({
      data: { itemId, eventType: "PRICING_SOURCE_DROPPED",
        payload: JSON.stringify({ cause: "identity_anchor", ...p }) },
    }).catch(() => null);
  }

  return consensus;
}
