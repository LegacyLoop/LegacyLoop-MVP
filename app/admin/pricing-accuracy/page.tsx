import { redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { authAdapter } from "@/lib/adapters/auth";
import { isAdmin } from "@/lib/constants/admin";
import type {
  PricingAccuracyRecord,
  PricingAccuracyItemSummary,
  SoldPriceSource,
} from "@/lib/pricing/feedback-loop";
import type { PricingSourceName, PricingConsensus } from "@/lib/pricing/reconcile";
import type { JuryVerdict } from "@/lib/pricing/jury";

export const metadata: Metadata = {
  title: "Pricing Accuracy · Admin · LegacyLoop",
};

const WINDOW_MS = 30 * 24 * 60 * 60 * 1000;

// ── Helpers ────────────────────────────────────────────────────────

function safeJson<T>(raw: string | null | undefined): T | null {
  if (!raw) return null;
  try { return JSON.parse(raw) as T; } catch { return null; }
}

function pctColor(pctErr: number): string {
  if (pctErr < 0.05) return "#22c55e";
  if (pctErr < 0.15) return "#f59e0b";
  return "#ef4444";
}

function ageColor(days: number): string {
  if (days < 7) return "#22c55e";
  if (days < 30) return "#f59e0b";
  return "#ef4444";
}

function formatPct(v: number | null | undefined): string {
  if (v == null || !Number.isFinite(v)) return "—";
  return `${(v * 100).toFixed(1)}%`;
}

function formatUsd(v: number | null | undefined): string {
  if (v == null || !Number.isFinite(v)) return "—";
  return `$${v.toFixed(3)}`;
}

function formatInt(v: number | null | undefined): string {
  if (v == null || !Number.isFinite(v)) return "—";
  return v.toLocaleString();
}

// ── Data fetchers ──────────────────────────────────────────────────

async function fetchAllData() {
  const since = new Date(Date.now() - WINDOW_MS);

  const [
    accuracyCompleteLogs,
    accuracyRecordLogs,
    consensusLogs,
    juryVerdictLogs,
    juryCacheHitCount,
    juryCacheMissCount,
    juryChipRenderCount,
    juryTranscriptOpenCount,
    soldTransitionLogs,
    v9CalcLogs,
    totalSoldItemsCount,
  ] = await Promise.all([
    prisma.eventLog.findMany({
      where: { eventType: "PRICING_ACCURACY_ITEM_COMPLETE", createdAt: { gte: since } },
      orderBy: { createdAt: "desc" },
      select: { itemId: true, payload: true, createdAt: true },
    }),
    prisma.eventLog.findMany({
      where: { eventType: "PRICING_ACCURACY_RECORD", createdAt: { gte: since } },
      select: { payload: true, createdAt: true },
    }),
    prisma.eventLog.findMany({
      where: {
        eventType: { in: ["PRICING_CONSENSUS_V3", "PRICING_CONSENSUS"] },
        createdAt: { gte: since },
      },
      select: { payload: true },
    }),
    prisma.eventLog.findMany({
      where: { eventType: "PRICING_JURY_VERDICT", createdAt: { gte: since } },
      select: { payload: true, createdAt: true },
    }),
    prisma.eventLog.count({
      where: { eventType: "PRICING_JURY_CACHE_HIT", createdAt: { gte: since } },
    }),
    prisma.eventLog.count({
      where: { eventType: "PRICING_JURY_CACHE_MISS", createdAt: { gte: since } },
    }),
    prisma.eventLog.count({
      where: { eventType: "JURY_CHIP_RENDERED", createdAt: { gte: since } },
    }).catch(() => 0),
    prisma.eventLog.count({
      where: { eventType: "JURY_TRANSCRIPT_OPEN", createdAt: { gte: since } },
    }).catch(() => 0),
    prisma.eventLog.findMany({
      where: { eventType: "SOLD_TRANSITION_HOOK_FIRED", createdAt: { gte: since } },
      select: { itemId: true, payload: true, createdAt: true },
    }),
    prisma.eventLog.findMany({
      where: { eventType: "GARAGE_SALE_V9_CALC", createdAt: { gte: since } },
      select: { itemId: true, payload: true },
    }),
    prisma.item.count({
      where: {
        status: { in: ["SOLD", "SHIPPED", "COMPLETED"] },
        soldAt: { gte: since },
      },
    }),
  ]);

  const summaries = accuracyCompleteLogs
    .map(l => ({
      createdAt: l.createdAt,
      itemId: l.itemId,
      summary: safeJson<PricingAccuracyItemSummary>(l.payload),
    }))
    .filter(x => x.summary != null) as Array<{
      createdAt: Date;
      itemId: string;
      summary: PricingAccuracyItemSummary;
    }>;

  const records = accuracyRecordLogs
    .map(l => safeJson<PricingAccuracyRecord>(l.payload))
    .filter((r): r is PricingAccuracyRecord => r != null);

  const verdicts = juryVerdictLogs
    .map(l => ({ createdAt: l.createdAt, verdict: safeJson<JuryVerdict>(l.payload) }))
    .filter((x): x is { createdAt: Date; verdict: JuryVerdict } => x.verdict != null);

  const consensusSnaps = consensusLogs
    .map(l => safeJson<PricingConsensus>(l.payload))
    .filter((c): c is PricingConsensus => c != null);

  const soldTransitions = soldTransitionLogs
    .map(l => ({
      createdAt: l.createdAt,
      itemId: l.itemId,
      payload: safeJson<{ source: string; soldPrice: number | null; mirrorApplied: boolean }>(l.payload),
    }))
    .filter((x): x is { createdAt: Date; itemId: string; payload: { source: string; soldPrice: number | null; mirrorApplied: boolean } } => x.payload != null);

  const v9CalcByItem = new Map<string, { inPersonTier?: string }>();
  for (const l of v9CalcLogs) {
    const p = safeJson<{ inPersonTier?: string }>(l.payload);
    if (p) v9CalcByItem.set(l.itemId, p);
  }

  return {
    since,
    summaries,
    records,
    verdicts,
    juryCacheHitCount,
    juryCacheMissCount,
    juryChipRenderCount,
    juryTranscriptOpenCount,
    consensusSnaps,
    soldTransitions,
    v9CalcByItem,
    totalSoldItemsCount,
  };
}

// ── Aggregations ───────────────────────────────────────────────────

function aggregatePerSource(records: PricingAccuracyRecord[]) {
  const byName = new Map<PricingSourceName, { count: number; sumErr: number; byField: Map<string, { count: number; sumErr: number }> }>();
  for (const r of records) {
    const existing = byName.get(r.sourceName) ?? {
      count: 0, sumErr: 0, byField: new Map(),
    };
    existing.count += 1;
    existing.sumErr += r.percentError;
    const field = existing.byField.get(r.sourceField) ?? { count: 0, sumErr: 0 };
    field.count += 1;
    field.sumErr += r.percentError;
    existing.byField.set(r.sourceField, field);
    byName.set(r.sourceName, existing);
  }

  return Array.from(byName.entries()).map(([name, v]) => {
    let bestField = "—";
    let bestAvg = Infinity;
    for (const [field, stats] of v.byField.entries()) {
      const avg = stats.sumErr / stats.count;
      if (avg < bestAvg) { bestAvg = avg; bestField = field; }
    }
    return {
      name,
      count: v.count,
      avgErr: v.count > 0 ? v.sumErr / v.count : 0,
      bestField,
      bestFieldAvg: bestAvg,
    };
  }).sort((a, b) => a.avgErr - b.avgErr);
}

function aggregatePerCategory(
  summaries: Array<{ summary: PricingAccuracyItemSummary; itemId: string }>,
  v9CalcByItem: Map<string, { inPersonTier?: string }>,
) {
  const byCat = new Map<string, {
    count: number; sumErr: number;
    specialty: number; commodity: number; other: number;
  }>();
  for (const s of summaries) {
    const cat = s.summary.categoryProfile || "default";
    const existing = byCat.get(cat) ?? { count: 0, sumErr: 0, specialty: 0, commodity: 0, other: 0 };
    existing.count += 1;
    existing.sumErr += s.summary.averageAbsPercentError;
    const tier = v9CalcByItem.get(s.itemId)?.inPersonTier;
    if (tier === "specialty") existing.specialty += 1;
    else if (tier === "commodity") existing.commodity += 1;
    else existing.other += 1;
    byCat.set(cat, existing);
  }
  return Array.from(byCat.entries()).map(([cat, v]) => ({
    category: cat,
    count: v.count,
    avgErr: v.count > 0 ? v.sumErr / v.count : 0,
    specialtyPct: v.count > 0 ? v.specialty / v.count : 0,
    commodityPct: v.count > 0 ? v.commodity / v.count : 0,
  })).sort((a, b) => b.count - a.count);
}

function aggregateSoldSegmentation(
  transitions: Array<{ itemId: string; createdAt: Date; payload: { source: string } }>,
  summaries: Array<{ itemId: string; createdAt: Date }>,
) {
  // Map itemId → earliest accuracy summary createdAt
  const summaryByItem = new Map<string, Date>();
  for (const s of summaries) {
    const prev = summaryByItem.get(s.itemId);
    if (!prev || s.createdAt < prev) summaryByItem.set(s.itemId, s.createdAt);
  }
  const bySource = new Map<string, { total: number; coveredWithin5s: number }>();
  for (const t of transitions) {
    const existing = bySource.get(t.payload.source) ?? { total: 0, coveredWithin5s: 0 };
    existing.total += 1;
    const summaryAt = summaryByItem.get(t.itemId);
    if (summaryAt && summaryAt.getTime() - t.createdAt.getTime() <= 5000 && summaryAt.getTime() >= t.createdAt.getTime()) {
      existing.coveredWithin5s += 1;
    } else if (summaryAt) {
      // Still counts as covered, just not within 5s
      existing.coveredWithin5s += 0;
    }
    bySource.set(t.payload.source, existing);
  }
  const totalTransitions = transitions.length;
  return {
    totalTransitions,
    bySource: Array.from(bySource.entries()).map(([source, v]) => ({
      source,
      total: v.total,
      pctOfAll: totalTransitions > 0 ? v.total / totalTransitions : 0,
      coveragePct: v.total > 0 ? v.coveredWithin5s / v.total : 0,
    })).sort((a, b) => b.total - a.total),
  };
}

function aggregateJuryFunnel(
  consensusSnaps: PricingConsensus[],
  verdictCount: number,
  chipRenders: number,
  transcriptOpens: number,
) {
  const eligible = consensusSnaps.filter(c => {
    if (!c.dissents || c.dissents.length === 0) return false;
    const maxSpread = Math.max(...c.dissents.map(d => d.spreadPct));
    return maxSpread >= 0.30;
  }).length;
  return { eligible, verdicts: verdictCount, chipRenders, transcriptOpens };
}

function aggregateMoatFreshness(
  summaries: Array<{ summary: PricingAccuracyItemSummary; createdAt: Date }>,
) {
  const byCat = new Map<string, Date>();
  for (const s of summaries) {
    const cat = s.summary.categoryProfile || "default";
    const prev = byCat.get(cat);
    if (!prev || s.createdAt > prev) byCat.set(cat, s.createdAt);
  }
  const now = Date.now();
  const ALL_CATEGORIES = [
    "musical_instruments", "antiques_art", "electronics_commodity",
    "power_equipment", "jewelry_watches", "collectibles_graded",
    "furniture_home", "tools", "clothing_soft", "default",
  ];
  return ALL_CATEGORIES.map(cat => {
    const latest = byCat.get(cat);
    const ageDays = latest ? Math.floor((now - latest.getTime()) / 86_400_000) : null;
    return { category: cat, latest, ageDays };
  }).sort((a, b) => {
    if (a.ageDays == null && b.ageDays == null) return 0;
    if (a.ageDays == null) return 1;
    if (b.ageDays == null) return -1;
    return b.ageDays - a.ageDays;
  });
}

function aggregateSourceBreakdown(
  summaries: Array<{ summary: PricingAccuracyItemSummary }>,
): Record<SoldPriceSource, number> {
  const acc: Record<SoldPriceSource, number> = {
    item_field: 0, transaction: 0, seller_earnings: 0, unresolved: 0,
  };
  for (const s of summaries) {
    const src = s.summary.soldPriceSource;
    if (src in acc) acc[src] += 1;
  }
  return acc;
}

// ── Shared style fragments ──────────────────────────────────────────

const CARD: React.CSSProperties = {
  background: "var(--bg-card-solid)",
  border: "1px solid rgba(0,188,212,0.15)",
  borderRadius: "16px",
  padding: "1.5rem",
};

const TABLE: React.CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  fontSize: "0.875rem",
};

const TH: React.CSSProperties = {
  textAlign: "left",
  padding: "0.5rem 0.75rem",
  borderBottom: "1px solid rgba(255,255,255,0.08)",
  fontSize: "0.7rem",
  fontWeight: 600,
  color: "var(--text-muted)",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
};

const TD: React.CSSProperties = {
  padding: "0.6rem 0.75rem",
  borderBottom: "1px solid rgba(255,255,255,0.04)",
  fontFamily: "var(--font-data)",
};

const TD_LABEL: React.CSSProperties = {
  padding: "0.6rem 0.75rem",
  borderBottom: "1px solid rgba(255,255,255,0.04)",
};

// ── Sections ────────────────────────────────────────────────────────

function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: "2rem" }}>
      <h2 style={{
        fontSize: "1.05rem", margin: "0 0 0.25rem 0",
        fontFamily: "var(--font-heading)", fontWeight: 600,
        color: "var(--text-primary)",
      }}>
        {title}
      </h2>
      {subtitle && (
        <p style={{
          fontSize: "0.8rem", color: "var(--text-muted)",
          margin: "0 0 0.75rem 0",
        }}>{subtitle}</p>
      )}
      {children}
    </section>
  );
}

function KpiTile({ label, value, sub, color }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div style={{ ...CARD, padding: "1.1rem 1.25rem" }}>
      <div style={{
        fontSize: "1.75rem", fontFamily: "var(--font-data)", fontWeight: 700,
        color: color ?? "var(--text-primary)", lineHeight: 1.1,
      }}>{value}</div>
      <div style={{
        fontSize: "0.7rem", fontWeight: 600,
        color: "var(--text-muted)", marginTop: "0.35rem",
        textTransform: "uppercase", letterSpacing: "0.05em",
      }}>{label}</div>
      {sub && (
        <div style={{ fontSize: "0.72rem", color: "var(--text-secondary)", marginTop: "0.3rem" }}>{sub}</div>
      )}
    </div>
  );
}

// ── Page ────────────────────────────────────────────────────────────

export default async function PricingAccuracyAdminPage() {
  const session = await authAdapter.getSession();
  if (!session) redirect("/auth/login?next=/admin/pricing-accuracy");
  if (!isAdmin(session.email)) {
    return (
      <div style={{ padding: "3rem 1.5rem", textAlign: "center" }}>
        <h1 style={{ fontFamily: "var(--font-heading)" }}>Forbidden</h1>
        <p style={{ color: "var(--text-secondary)" }}>Admin access required.</p>
      </div>
    );
  }

  const data = await fetchAllData();

  // ── Top-line KPI computations
  const accuracyRowCount = data.summaries.length;
  const coveragePct = data.totalSoldItemsCount > 0
    ? accuracyRowCount / data.totalSoldItemsCount : 0;
  const avgErrAll = data.summaries.length > 0
    ? data.summaries.reduce((s, x) => s + x.summary.averageAbsPercentError, 0) / data.summaries.length
    : null;
  const perSource = aggregatePerSource(data.records);
  const bestSource = perSource.length > 0 ? perSource[0] : null;
  const perCategory = aggregatePerCategory(data.summaries, data.v9CalcByItem);
  const funnel = aggregateJuryFunnel(
    data.consensusSnaps,
    data.verdicts.length,
    data.juryChipRenderCount,
    data.juryTranscriptOpenCount,
  );
  const segmentation = aggregateSoldSegmentation(
    data.soldTransitions,
    data.summaries,
  );
  const freshness = aggregateMoatFreshness(data.summaries);
  const sourceBreakdown = aggregateSourceBreakdown(data.summaries);
  const juryCostToDate = data.verdicts.reduce((s, v) => s + (v.verdict.costEstimateUsd ?? 0), 0);
  const totalJuryCalls = data.juryCacheHitCount + data.juryCacheMissCount;
  const cacheHitRate = totalJuryCalls > 0 ? data.juryCacheHitCount / totalJuryCalls : 0;
  const llmCallsPerDay = data.juryCacheMissCount / 30;
  const projectedMonthlyCost = llmCallsPerDay * 30 * 0.001;

  // Moat freshness headline: avg age days across categories that have data
  const freshnessWithData = freshness.filter(f => f.ageDays != null);
  const avgFreshnessDays = freshnessWithData.length > 0
    ? freshnessWithData.reduce((s, f) => s + (f.ageDays ?? 0), 0) / freshnessWithData.length
    : null;

  // Recent ledger: 20 most-recent summaries
  const recentLedger = data.summaries.slice(0, 20);

  return (
    <div style={{
      maxWidth: "1280px", margin: "0 auto",
      padding: "2rem 1.25rem", color: "var(--text-primary)",
    }}>
      <header style={{ marginBottom: "2rem" }}>
        <Link href="/admin" style={{ color: "var(--accent)", fontSize: "0.82rem", textDecoration: "none" }}>← Admin</Link>
        <h1 style={{
          fontSize: "1.75rem", margin: "0.5rem 0 0.25rem 0",
          fontFamily: "var(--font-heading)", letterSpacing: "-0.02em",
        }}>
          Pricing Accuracy · Admin Dashboard
        </h1>
        <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", margin: 0 }}>
          Feedback-loop observability · last 30 days · since {data.since.toLocaleDateString()}
        </p>
      </header>

      {/* ── Top-line KPI tiles ── */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(0, 1fr))",
        gap: "0.75rem", marginBottom: "2rem",
      }}>
        <KpiTile
          label="Accuracy rows"
          value={formatInt(accuracyRowCount)}
          sub={`${data.totalSoldItemsCount} SOLD items in window`}
        />
        <KpiTile
          label="Coverage"
          value={formatPct(coveragePct)}
          sub="accuracy / SOLD"
          color={coveragePct > 0.8 ? "#22c55e" : coveragePct > 0.5 ? "#f59e0b" : "#ef4444"}
        />
        <KpiTile
          label="Avg error"
          value={formatPct(avgErrAll)}
          color={avgErrAll != null ? pctColor(avgErrAll) : undefined}
        />
        <KpiTile
          label="Best source"
          value={bestSource?.name ?? "—"}
          sub={bestSource ? `avg ${formatPct(bestSource.avgErr)}` : undefined}
        />
        <KpiTile
          label="Moat freshness"
          value={avgFreshnessDays != null ? `${avgFreshnessDays.toFixed(1)}d` : "—"}
          sub="avg age of latest row per category"
          color={avgFreshnessDays != null ? ageColor(avgFreshnessDays) : undefined}
        />
        <KpiTile
          label="Jury cost (30d)"
          value={formatUsd(juryCostToDate)}
          sub={`${data.verdicts.length} verdicts`}
        />
      </div>

      {/* ── Per-source accuracy table ── */}
      <Section title="Per-source accuracy" subtitle="Which source predicts sold price best?">
        <div style={CARD}>
          {perSource.length === 0 ? (
            <p style={{ color: "var(--text-muted)", margin: 0 }}>No data yet.</p>
          ) : (
            <table style={TABLE}>
              <thead>
                <tr>
                  <th style={TH}>Source</th>
                  <th style={{ ...TH, textAlign: "right" }}>N</th>
                  <th style={{ ...TH, textAlign: "right" }}>Avg error</th>
                  <th style={TH}>Best field</th>
                </tr>
              </thead>
              <tbody>
                {perSource.map(s => (
                  <tr key={s.name}>
                    <td style={TD_LABEL}>{s.name}</td>
                    <td style={{ ...TD, textAlign: "right" }}>{formatInt(s.count)}</td>
                    <td style={{ ...TD, textAlign: "right", color: pctColor(s.avgErr), fontWeight: 700 }}>
                      {formatPct(s.avgErr)}
                    </td>
                    <td style={TD_LABEL}>
                      {s.bestField}{" "}
                      <span style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>
                        ({formatPct(s.bestFieldAvg)})
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Section>

      {/* ── Per-category accuracy ── */}
      <Section title="Per-category accuracy" subtitle="Accuracy by pricing category profile + inPerson tier mix">
        <div style={CARD}>
          {perCategory.length === 0 ? (
            <p style={{ color: "var(--text-muted)", margin: 0 }}>No data yet.</p>
          ) : (
            <table style={TABLE}>
              <thead>
                <tr>
                  <th style={TH}>Category</th>
                  <th style={{ ...TH, textAlign: "right" }}>N</th>
                  <th style={{ ...TH, textAlign: "right" }}>Avg error</th>
                  <th style={{ ...TH, textAlign: "right" }}>Specialty %</th>
                  <th style={{ ...TH, textAlign: "right" }}>Commodity %</th>
                </tr>
              </thead>
              <tbody>
                {perCategory.map(c => (
                  <tr key={c.category}>
                    <td style={TD_LABEL}>{c.category}</td>
                    <td style={{ ...TD, textAlign: "right" }}>{formatInt(c.count)}</td>
                    <td style={{ ...TD, textAlign: "right", color: pctColor(c.avgErr), fontWeight: 700 }}>
                      {formatPct(c.avgErr)}
                    </td>
                    <td style={{ ...TD, textAlign: "right" }}>{formatPct(c.specialtyPct)}</td>
                    <td style={{ ...TD, textAlign: "right" }}>{formatPct(c.commodityPct)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Section>

      {/* ── Jury visibility funnel ── */}
      <Section title="Jury visibility funnel" subtitle="From eligible (≥30% spread) → verdict → chip render → transcript open">
        <div style={{ ...CARD, display: "grid", gap: "0.75rem" }}>
          {[
            { label: "Eligible (≥30% spread)", count: funnel.eligible, of: funnel.eligible },
            { label: "Verdicts issued", count: funnel.verdicts, of: funnel.eligible },
            { label: "Chips rendered", count: funnel.chipRenders, of: funnel.verdicts },
            { label: "Transcripts opened", count: funnel.transcriptOpens, of: funnel.chipRenders },
          ].map((step, i) => {
            const pct = step.of > 0 ? step.count / step.of : 0;
            return (
              <div key={step.label}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.82rem", marginBottom: "0.2rem" }}>
                  <span>{step.label}</span>
                  <span style={{ fontFamily: "var(--font-data)", fontWeight: 700 }}>
                    {formatInt(step.count)}{i > 0 && ` · ${formatPct(pct)}`}
                  </span>
                </div>
                <div style={{
                  height: "8px", borderRadius: "9999px",
                  background: "rgba(255,255,255,0.06)", overflow: "hidden",
                }}>
                  <div style={{
                    height: "100%", width: `${Math.min(100, Math.max(2, pct * 100))}%`,
                    background: "var(--accent)", transition: "width 0.3s ease",
                  }} />
                </div>
              </div>
            );
          })}
        </div>
      </Section>

      {/* ── SOLD transition segmentation ── */}
      <Section title="SOLD transition segmentation" subtitle="Which pathways feed the accuracy pipeline?">
        <div style={CARD}>
          {segmentation.totalTransitions === 0 ? (
            <p style={{ color: "var(--text-muted)", margin: 0 }}>No SOLD transitions yet.</p>
          ) : (
            <table style={TABLE}>
              <thead>
                <tr>
                  <th style={TH}>Source</th>
                  <th style={{ ...TH, textAlign: "right" }}>Count</th>
                  <th style={{ ...TH, textAlign: "right" }}>Share</th>
                  <th style={{ ...TH, textAlign: "right" }}>Pipeline coverage (5s)</th>
                </tr>
              </thead>
              <tbody>
                {segmentation.bySource.map(s => (
                  <tr key={s.source}>
                    <td style={TD_LABEL}>{s.source}</td>
                    <td style={{ ...TD, textAlign: "right" }}>{formatInt(s.total)}</td>
                    <td style={{ ...TD, textAlign: "right" }}>{formatPct(s.pctOfAll)}</td>
                    <td style={{
                      ...TD, textAlign: "right",
                      color: s.coveragePct > 0.8 ? "#22c55e" : s.coveragePct > 0.5 ? "#f59e0b" : "#ef4444",
                      fontWeight: 700,
                    }}>
                      {formatPct(s.coveragePct)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Section>

      {/* ── Source breakdown (V1b Tier usage) ── */}
      <Section title="Sold-price tier usage" subtitle="Which resolveSoldPrice tier supplied the sold price?">
        <div style={{
          ...CARD,
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(0, 1fr))",
          gap: "0.75rem",
        }}>
          {Object.entries(sourceBreakdown).map(([src, count]) => (
            <div key={src} style={{ textAlign: "center" }}>
              <div style={{
                fontSize: "1.5rem", fontFamily: "var(--font-data)", fontWeight: 700,
                color: src === "item_field" ? "#22c55e"
                  : src === "transaction" ? "var(--accent)"
                  : src === "seller_earnings" ? "#a78bfa"
                  : "var(--text-muted)",
              }}>{formatInt(count)}</div>
              <div style={{
                fontSize: "0.7rem", color: "var(--text-muted)",
                textTransform: "uppercase", letterSpacing: "0.05em", marginTop: "0.2rem",
              }}>{src.replace(/_/g, " ")}</div>
            </div>
          ))}
        </div>
      </Section>

      {/* ── Jury economics ── */}
      <Section title="Jury economics" subtitle="Cache effectiveness + LLM cost tracking">
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(0, 1fr))",
          gap: "0.75rem",
        }}>
          <KpiTile
            label="Cache hit rate"
            value={formatPct(cacheHitRate)}
            sub={`${data.juryCacheHitCount} hits / ${totalJuryCalls} attempts`}
            color={cacheHitRate > 0.7 ? "#22c55e" : cacheHitRate > 0.4 ? "#f59e0b" : "#ef4444"}
          />
          <KpiTile
            label="LLM calls / day"
            value={llmCallsPerDay.toFixed(1)}
            sub={`${data.juryCacheMissCount} misses in 30d`}
          />
          <KpiTile
            label="Projected monthly cost"
            value={formatUsd(projectedMonthlyCost)}
            sub="@ $0.001 per call"
          />
        </div>
      </Section>

      {/* ── Moat freshness per category ── */}
      <Section title="Moat freshness per category" subtitle="Days since latest accuracy row — spots stale categories">
        <div style={CARD}>
          <table style={TABLE}>
            <thead>
              <tr>
                <th style={TH}>Category</th>
                <th style={TH}>Latest row</th>
                <th style={{ ...TH, textAlign: "right" }}>Age (days)</th>
              </tr>
            </thead>
            <tbody>
              {freshness.map(f => (
                <tr key={f.category}>
                  <td style={TD_LABEL}>{f.category}</td>
                  <td style={TD_LABEL}>
                    {f.latest
                      ? f.latest.toLocaleDateString()
                      : <span style={{ color: "var(--text-muted)" }}>no data yet</span>}
                  </td>
                  <td style={{
                    ...TD, textAlign: "right",
                    color: f.ageDays != null ? ageColor(f.ageDays) : "var(--text-muted)",
                    fontWeight: 700,
                  }}>
                    {f.ageDays != null ? f.ageDays : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      {/* ── Recent SOLD ledger ── */}
      <Section title="Recent SOLD ledger" subtitle="20 most-recent accuracy summaries">
        <div style={CARD}>
          {recentLedger.length === 0 ? (
            <p style={{ color: "var(--text-muted)", margin: 0 }}>No sold items yet.</p>
          ) : (
            <table style={TABLE}>
              <thead>
                <tr>
                  <th style={TH}>Sold at</th>
                  <th style={TH}>Item</th>
                  <th style={{ ...TH, textAlign: "right" }}>Sold price</th>
                  <th style={TH}>Price source</th>
                  <th style={TH}>Best source</th>
                  <th style={{ ...TH, textAlign: "right" }}>Avg error</th>
                </tr>
              </thead>
              <tbody>
                {recentLedger.map(r => (
                  <tr key={r.itemId}>
                    <td style={TD_LABEL}>{r.createdAt.toLocaleDateString()}</td>
                    <td style={TD_LABEL}>
                      <Link href={`/items/${r.itemId}`} style={{
                        color: "var(--accent)", textDecoration: "none",
                        fontFamily: "var(--font-data)", fontSize: "0.78rem",
                      }}>
                        {r.itemId.slice(0, 10)}…
                      </Link>
                    </td>
                    <td style={{ ...TD, textAlign: "right" }}>${formatInt(r.summary.soldPrice)}</td>
                    <td style={TD_LABEL}>
                      <span style={{ fontSize: "0.78rem", color: "var(--text-secondary)" }}>
                        {r.summary.soldPriceSource.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td style={TD_LABEL}>
                      <span style={{ fontSize: "0.78rem" }}>
                        {r.summary.bestSource ?? "—"}
                      </span>
                    </td>
                    <td style={{
                      ...TD, textAlign: "right",
                      color: pctColor(r.summary.averageAbsPercentError),
                      fontWeight: 700,
                    }}>
                      {formatPct(r.summary.averageAbsPercentError)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Section>

      <footer style={{
        marginTop: "3rem", paddingTop: "1.5rem",
        borderTop: "1px solid rgba(255,255,255,0.08)",
        fontSize: "0.75rem", color: "var(--text-muted)",
      }}>
        CMD-PRICING-FEEDBACK-LOOP-V1e · live data · refresh to update
      </footer>
    </div>
  );
}
