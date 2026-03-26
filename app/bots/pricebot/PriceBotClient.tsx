"use client";

import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import BotItemSelector from "../BotItemSelector";
import BotLoadingState from "@/app/components/BotLoadingState";

type ItemData = {
  id: string;
  title: string;
  status: string;
  photo: string | null;
  hasAnalysis: boolean;
  aiResult: string | null;
  priceBotResult: string | null;
  priceBotRunAt: string | null;
  valuation: any;
  antique: any;
  pricingHistory?: { id: string; type: string; createdAt: string; payload: any }[];
  lastPricedAt?: string | null;
  amazonData?: any;
  analyzeBasePricing?: { low: number; mid: number; high: number; confidence: number; source: string } | null;
};

function AccordionHeader({ id, icon, title, subtitle, isOpen, onToggle, accentColor, badge }: {
  id: string; icon: string; title: string; subtitle?: string;
  isOpen: boolean; onToggle: (id: string) => void; accentColor?: string; badge?: string;
}) {
  return (
    <button onClick={() => onToggle(id)} style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      width: "100%", background: isOpen ? "rgba(0,188,212,0.02)" : "transparent",
      border: "none", borderBottom: isOpen ? "1px solid var(--border-default)" : "1px solid transparent",
      padding: "0.65rem 0.5rem", cursor: "pointer", transition: "all 0.2s ease",
      borderRadius: isOpen ? "0.4rem 0.4rem 0 0" : "0.4rem", minHeight: "40px",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
        <span style={{ fontSize: "1rem" }}>{icon}</span>
        <span style={{ fontSize: "0.65rem", fontWeight: 700, color: accentColor || "var(--text-secondary)", letterSpacing: "0.05em", textTransform: "uppercase" as const }}>{title}</span>
        {badge && <span style={{ fontSize: "0.5rem", fontWeight: 700, padding: "2px 8px", borderRadius: "6px", background: `${accentColor || "#00bcd4"}18`, color: accentColor || "#00bcd4" }}>{badge}</span>}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
        {subtitle && !isOpen && <span style={{ fontSize: "0.55rem", color: "var(--text-muted)", maxWidth: "280px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const, fontWeight: 500 }}>{subtitle}</span>}
        <span style={{ fontSize: "0.55rem", color: "var(--text-muted)", transition: "transform 0.25s ease", transform: isOpen ? "rotate(180deg)" : "rotate(0deg)", display: "inline-flex", alignItems: "center", justifyContent: "center", width: "22px", height: "22px", borderRadius: "50%", background: isOpen ? "rgba(0,188,212,0.08)" : "transparent" }}>▼</span>
      </div>
    </button>
  );
}

function safeJson(s: string | null): any {
  if (!s) return null;
  try { return JSON.parse(s); } catch { return null; }
}

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return "";
  const ms = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function sellerNet(price: number): number {
  const commission = Math.round(price * 0.05 * 100) / 100;
  const fee = Math.round(price * 0.0175 * 100) / 100;
  return Math.round((price - commission - fee) * 100) / 100;
}

// ── Glass card helper ──
function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: "var(--bg-card)", backdropFilter: "blur(12px)",
      border: "1px solid rgba(0,188,212,0.15)", borderRadius: 16,
      padding: "1.25rem", ...style,
    }}>
      {children}
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: "0.6rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--accent)", marginBottom: "0.5rem" }}>
      {children}
    </div>
  );
}

// ── Demand badge helper ──
function DemandBadge({ level }: { level: string }) {
  const config: Record<string, { emoji: string; color: string; bg: string }> = {
    Hot: { emoji: "🔥", color: "#ef4444", bg: "rgba(239,68,68,0.12)" },
    Strong: { emoji: "💪", color: "#4caf50", bg: "rgba(76,175,80,0.12)" },
    Moderate: { emoji: "📊", color: "#ff9800", bg: "rgba(255,152,0,0.12)" },
    Weak: { emoji: "📉", color: "#9e9e9e", bg: "rgba(158,158,158,0.12)" },
    Dead: { emoji: "💀", color: "#757575", bg: "rgba(117,117,117,0.12)" },
  };
  const c = config[level] || config.Moderate;
  return (
    <span style={{ padding: "0.2rem 0.6rem", borderRadius: "9999px", fontSize: "0.7rem", fontWeight: 700, background: c.bg, color: c.color }}>
      {c.emoji} {level} Market
    </span>
  );
}

// ── Relevance badge ──
function RelevanceBadge({ relevance }: { relevance: string }) {
  const color = relevance === "High" ? "#4caf50" : relevance === "Medium" ? "#ff9800" : "#757575";
  const bg = relevance === "High" ? "rgba(76,175,80,0.12)" : relevance === "Medium" ? "rgba(255,152,0,0.12)" : "rgba(117,117,117,0.12)";
  return <span style={{ padding: "0.1rem 0.4rem", borderRadius: "9999px", fontSize: "0.6rem", fontWeight: 700, background: bg, color }}>{relevance}</span>;
}

const PROVIDER_META: Record<string, { icon: string; label: string; color: string; specialty: string }> = {
  openai: { icon: "🤖", label: "OpenAI", color: "#10a37f", specialty: "Balanced pricing & cross-referencing" },
  claude: { icon: "🧠", label: "Claude", color: "#d97706", specialty: "Craftsmanship value & rarity premiums" },
  gemini: { icon: "🔮", label: "Gemini", color: "#4285f4", specialty: "Market data & comparable sales" },
  grok: { icon: "🌀", label: "Grok (xAI)", color: "#00DC82", specialty: "Social selling & trending demand" },
};

const _obj = (v: any) => (v && typeof v === "object" && !Array.isArray(v)) ? v : null;

function _getComparables(data: any): any[] {
  if (!data || typeof data !== "object") return [];
  const d = _normalizeKeys(data);
  const DIRECT_KEYS = ["comparable_sales", "comparables", "recent_sales", "sold_listings", "sold_items", "comparable_listings", "market_comparables", "similar_sales", "price_comparisons", "comp_sales", "recent_comps", "sales_data"];
  for (const k of DIRECT_KEYS) { if (Array.isArray(d[k]) && d[k].length > 0) return d[k]; }
  const WRAPPER_KEYS = ["price_validation", "market_analysis", "pricing", "valuation", "market_data", "analysis", "market_intelligence", "pricing_analysis"];
  for (const wk of WRAPPER_KEYS) { const w = _obj(d[wk]); if (!w) continue; for (const k of DIRECT_KEYS) { if (Array.isArray(w[k]) && w[k].length > 0) return w[k]; } }
  for (const val of Object.values(d)) { if (Array.isArray(val) && val.length > 0 && val.length <= 30) { const f = val[0]; if (f && typeof f === "object" && (f.sold_price != null || f.price != null || f.sale_price != null || f.sold_for != null || f.amount != null)) return val; } }
  return [];
}

function _normalizeComparable(comp: any) {
  if (!comp || typeof comp !== "object") return { platform: "Unknown", item_description: "Item", sold_price: "?", date: "", condition: "", relevance: "" };
  return {
    platform: comp.platform || comp.source || comp.marketplace || comp.site || "Unknown",
    item_description: comp.item_description || comp.description || comp.title || comp.item || comp.name || comp.item_name || "Item",
    sold_price: comp.sold_price ?? comp.price ?? comp.sale_price ?? comp.sold_for ?? comp.amount ?? "?",
    date: comp.date || comp.sold_date || comp.sale_date || "",
    condition: comp.condition || comp.item_condition || "",
    relevance: comp.relevance || comp.relevance_score || comp.match_quality || "",
  };
}

function _normalizeKeys(o: any): any {
  if (!o || typeof o !== "object" || Array.isArray(o)) return o;
  const out: any = {};
  for (const key of Object.keys(o)) {
    const lk = key.toLowerCase();
    const val = o[key];
    if (val && typeof val === "object" && !Array.isArray(val)) {
      const inner: any = {};
      for (const ik of Object.keys(val)) inner[ik.toLowerCase()] = val[ik];
      out[lk] = inner;
    } else { out[lk] = val; }
  }
  return out;
}

function extractPH(p: any) {
  let d = _normalizeKeys(p.data || {});
  const topKeys = Object.keys(d);
  if (topKeys.length === 1 && _obj(d[topKeys[0]]) && Object.keys(d[topKeys[0]]).length >= 2) d = d[topKeys[0]];
  const pv = _obj(d.price_validation) || d;
  const ma = _obj(d.market_analysis) || d;
  const ng = _obj(d.negotiation_guide) || d;
  const pp = _obj(d.platform_pricing) || {};
  const ph = _obj(d.price_history) || d;
  const pk = (...keys: string[]) => { for (const k of keys) { if (d[k] != null && d[k] !== "") return d[k]; } return null; };
  return {
    priceLow: pv.revised_low || pk("estimated_value_low", "price_low"),
    priceMid: pv.revised_mid || pk("estimated_value_mid", "price_mid"),
    priceHigh: pv.revised_high || pk("estimated_value_high", "price_high"),
    confidence: pk("pricing_confidence", "confidence", "overall_confidence") || (_obj(d.confidence) ? (d.confidence as any).overall_confidence : null),
    rationale: pv.revision_reasoning || pk("pricing_rationale", "rationale"),
    comparables: _getComparables(d),
    platformPricing: pp,
    bestPlatform: pp.best_platform || pk("best_platform"),
    demandLevel: ma.demand_level || pk("demand_level"),
    demandTrend: ma.demand_trend || pk("demand_trend"),
    supplyLevel: ma.supply_level || pk("supply_level"),
    seasonal: ma.seasonal_factors || pk("seasonal_factors"),
    listPrice: ng.list_price || pk("list_price"),
    minAccept: ng.minimum_accept || pk("minimum_accept"),
    sweetSpot: ng.sweet_spot || pk("sweet_spot"),
    counterStrategy: ng.counter_strategy,
    valueAdders: (d.price_factors?.value_adders || d.value_adders || []) as any[],
    valueReducers: (d.price_factors?.value_reducers || d.value_reducers || []) as any[],
    priceHistoryTrend: ph.trend_2_5_years || pk("price_trend"),
    trendEvidence: ph.trend_evidence,
    appreciationPotential: ph.appreciation_potential || pk("appreciation_potential"),
    internationalPricing: _obj(d.international_pricing),
    insuranceValue: pk("insurance_value"),
    liquidationValue: pk("liquidation_value"),
    collectorPremium: pk("collector_premium"),
    liquidationTimeline: _obj(d.liquidation_timeline),
    summary: pk("executive_summary", "summary"),
  };
}

const MEGA_STEPS = ["Dispatching 4 AI agents...", "OpenAI analyzing market...", "Claude evaluating craftsmanship value...", "Gemini scanning comparables...", "Grok checking social demand...", "Cross-referencing prices...", "Building consensus...", "Generating pricing report...", "Finalizing..."];

function MegaBotPricingSection({ megaResult, megaBotRunning, megaBotStep, expandedAgent, showAgentJson, setExpandedAgent, setShowAgentJson, onRunMegaBot, itemId }: {
  megaResult: any; megaBotRunning: boolean; megaBotStep: number; expandedAgent: string | null; showAgentJson: string | null;
  setExpandedAgent: (v: string | null) => void; setShowAgentJson: (v: string | null) => void; onRunMegaBot: () => void; itemId: string;
}) {
  if (megaBotRunning) {
    return (
      <Card style={{ textAlign: "center", padding: "2rem", background: "linear-gradient(135deg, rgba(139,92,246,0.08), rgba(0,188,212,0.04))", border: "1px solid rgba(139,92,246,0.3)" }}>
        <div style={{ fontSize: "2rem", marginBottom: "0.5rem", animation: "pulse 1.5s ease infinite" }}>⚡</div>
        <div style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.5rem" }}>MegaBot Pricing Running...</div>
        <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)", marginBottom: "0.75rem" }}>{MEGA_STEPS[megaBotStep] || "Processing..."}</div>
        <div style={{ height: 4, borderRadius: 99, background: "var(--ghost-bg)", overflow: "hidden", maxWidth: 300, margin: "0 auto" }}>
          <div style={{ height: "100%", width: `${((megaBotStep + 1) / MEGA_STEPS.length) * 100}%`, borderRadius: 99, background: "linear-gradient(90deg, #a855f7, #00bcd4)", transition: "width 0.5s ease" }} />
        </div>
      </Card>
    );
  }

  if (!megaResult) {
    return (
      <Card style={{ textAlign: "center", background: "linear-gradient(135deg, rgba(139,92,246,0.06), rgba(0,188,212,0.03))", border: "1px solid rgba(139,92,246,0.2)" }}>
        <div style={{ fontSize: "1.25rem", marginBottom: "0.35rem" }}>⚡</div>
        <div style={{ fontSize: "0.88rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.35rem" }}>MegaBot Deep Pricing</div>
        <p style={{ fontSize: "0.78rem", color: "var(--text-secondary)", lineHeight: 1.5, maxWidth: 480, margin: "0 auto 0.75rem" }}>
          Get 4 independent AI pricing experts — comparable sales, platform strategies, negotiation intel, international markets, and liquidation timelines.
        </p>
        <button onClick={onRunMegaBot} style={{ padding: "0.5rem 1.25rem", fontSize: "0.82rem", fontWeight: 700, borderRadius: "0.6rem", border: "none", background: "linear-gradient(135deg, #a855f7, #7c3aed)", color: "#fff", cursor: "pointer" }}>
          ⚡ Run MegaBot Pricing — 5 credits
        </button>
      </Card>
    );
  }

  // MegaBot results display
  const providers: any[] = Array.isArray(megaResult.providers) ? megaResult.providers : [];
  const successful = providers.filter((p: any) => !p.error);
  const failed = providers.filter((p: any) => p.error);
  const agreementRaw = megaResult.agreementScore || megaResult.agreement || 0;
  const agreement = Math.round(agreementRaw > 1 ? agreementRaw : agreementRaw * 100);

  return (
    <Card style={{ background: "linear-gradient(135deg, rgba(139,92,246,0.06), rgba(0,188,212,0.04))", border: "1px solid rgba(139,92,246,0.25)", padding: "1rem 1.25rem" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.6rem" }}>
        <span style={{ fontSize: "1rem" }}>⚡</span>
        <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "#a855f7", textTransform: "uppercase", letterSpacing: "0.05em" }}>
          MegaBot Deep Pricing — {successful.length} AI Expert{successful.length !== 1 ? "s" : ""}
        </span>
        {failed.length > 0 && failed.length < providers.length && <span style={{ fontSize: "0.58rem", color: "var(--text-muted)", opacity: 0.6, fontWeight: 400 }}>({failed.length} of {providers.length} unavailable)</span>}
        {failed.length > 0 && failed.length >= providers.length && <span style={{ fontSize: "0.58rem", color: "#ef4444", opacity: 0.7 }}>All experts unavailable</span>}
      </div>

      {/* Agreement bar */}
      <div style={{ marginBottom: "0.75rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.72rem", marginBottom: "0.2rem" }}>
          <span style={{ color: "var(--text-secondary)" }}>Pricing Agreement</span>
          <span style={{ fontWeight: 700, color: agreement >= 80 ? "#4caf50" : agreement >= 60 ? "#ff9800" : "#ef4444" }}>
            {agreement}% — {agreement >= 80 ? "Strong Consensus" : agreement >= 60 ? "Moderate" : "Varied Opinions"}
          </span>
        </div>
        <div style={{ height: 5, borderRadius: 99, background: "var(--ghost-bg)", overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${agreement}%`, borderRadius: 99, background: agreement >= 80 ? "#4caf50" : agreement >= 60 ? "#ff9800" : "#ef4444" }} />
        </div>
      </div>

      {/* Agent cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginBottom: "0.75rem" }}>
        {successful.map((p: any) => {
          const meta = PROVIDER_META[p.provider] || { icon: "🤖", label: p.provider, color: "var(--text-muted)", specialty: "" };
          const isExp = expandedAgent === p.provider;
          const isJson = showAgentJson === p.provider;
          const ph = extractPH(p);
          const timeStr = (p.durationMs || p.responseTime) ? `${((p.durationMs || p.responseTime) / 1000).toFixed(1)}s` : "";
          const comps = Array.isArray(ph.comparables) ? ph.comparables : [];
          const platEntries = ph.platformPricing && typeof ph.platformPricing === "object" ? Object.entries(ph.platformPricing).filter(([k]) => k !== "best_platform") : [];

          return (
            <div key={p.provider} style={{ background: "var(--bg-card, var(--ghost-bg))", borderTop: isExp ? `3px solid ${meta.color}` : undefined, border: `1px solid ${isExp ? `${meta.color}40` : "var(--border-card, var(--border-default))"}`, borderRadius: "1rem", overflow: "hidden" }}>
              {/* Header */}
              <button onClick={() => setExpandedAgent(isExp ? null : p.provider)} style={{ width: "100%", display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.75rem 1rem", background: "transparent", border: "none", cursor: "pointer", textAlign: "left" }}>
                <span style={{ fontSize: "1rem" }}>{meta.icon}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: "0.82rem", color: meta.color }}>{meta.label}</div>
                  <div style={{ fontSize: "0.68rem", color: "var(--text-muted)", overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>
                    {ph.priceLow != null && ph.priceHigh != null ? `$${Math.round(Number(ph.priceLow))}-$${Math.round(Number(ph.priceHigh))}` : "—"}
                    {ph.bestPlatform && typeof ph.bestPlatform === "string" && ` · ${ph.bestPlatform.split(" ")[0]}`}
                    {ph.demandLevel && ` · ${ph.demandLevel}`}
                    {ph.confidence != null && ` · ${Math.round(Number(ph.confidence))}%`}
                  </div>
                </div>
                <span style={{ fontSize: "0.62rem", color: "#4caf50" }}>✅ {timeStr}</span>
                <span style={{ fontSize: "0.68rem", color: "var(--text-muted)", transition: "transform 0.2s", transform: isExp ? "rotate(180deg)" : "none" }}>▾</span>
              </button>

              {/* Expanded */}
              {isExp && (
                <div style={{ padding: "0 1rem 1rem", borderTop: `1px solid ${meta.color}15` }}>
                  {/* Price Assessment */}
                  <div style={{ marginTop: "0.5rem", marginBottom: "0.65rem", padding: "0.65rem", background: "var(--bg-card)", borderRadius: "0.6rem", border: "1px solid var(--border-default)" }}>
                    <SectionLabel>Price Assessment</SectionLabel>
                    <div style={{ display: "flex", alignItems: "baseline", gap: "0.5rem", marginBottom: "0.3rem" }}>
                      <span style={{ fontSize: "1.8rem", fontWeight: 800, color: "var(--accent)" }}>${ph.priceLow != null ? Math.round(Number(ph.priceLow)) : "?"}</span>
                      <span style={{ color: "var(--text-muted)" }}>—</span>
                      <span style={{ fontSize: "1.8rem", fontWeight: 800, color: "var(--accent)" }}>${ph.priceHigh != null ? Math.round(Number(ph.priceHigh)) : "?"}</span>
                      {ph.priceMid != null && <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>mid ${Math.round(Number(ph.priceMid))}</span>}
                      {ph.confidence != null && <span style={{ fontSize: "0.72rem", fontWeight: 600, color: Number(ph.confidence) >= 70 ? "#4caf50" : "#ff9800" }}>{Math.round(Number(ph.confidence))}%</span>}
                    </div>
                    {ph.rationale && <p style={{ fontSize: "0.78rem", color: "var(--text-secondary)", margin: 0, lineHeight: 1.5 }}>{typeof ph.rationale === "string" && ph.rationale.length > 300 ? ph.rationale.slice(0, 300) + "..." : ph.rationale}</p>}
                  </div>

                  {/* Comparable Sales */}
                  {comps.length > 0 && (
                    <div style={{ marginBottom: "0.65rem", padding: "0.65rem", background: "var(--bg-card)", borderRadius: "0.6rem", border: "1px solid var(--border-default)" }}>
                      <SectionLabel>Comparable Sales ({comps.length})</SectionLabel>
                      {comps.slice(0, 8).map((c: any, i: number) => {
                        const nc = _normalizeComparable(c);
                        return (
                          <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.3rem 0", borderBottom: i < Math.min(comps.length, 8) - 1 ? "1px solid var(--border-default)" : "none" }}>
                            <span style={{ fontSize: "0.68rem", color: "var(--text-muted)", minWidth: 65 }}>{nc.platform}</span>
                            <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)", flex: 1, overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>{nc.item_description}</span>
                            <span style={{ fontSize: "0.88rem", fontWeight: 700, color: "var(--accent)" }}>${nc.sold_price}</span>
                            <RelevanceBadge relevance={nc.relevance} />
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Platform Breakdown */}
                  {platEntries.length > 0 && (
                    <div style={{ marginBottom: "0.65rem", padding: "0.65rem", background: "var(--bg-card)", borderRadius: "0.6rem", border: "1px solid var(--border-default)" }}>
                      <SectionLabel>Platform Breakdown</SectionLabel>
                      <div style={{ overflowX: "auto" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.72rem" }}>
                          <thead>
                            <tr style={{ color: "var(--text-muted)" }}>
                              <th style={{ textAlign: "left", padding: "0.25rem 0.4rem", fontWeight: 600 }}>Platform</th>
                              <th style={{ textAlign: "right", padding: "0.25rem 0.4rem", fontWeight: 600 }}>List</th>
                              <th style={{ textAlign: "right", padding: "0.25rem 0.4rem", fontWeight: 600 }}>Expect</th>
                              <th style={{ textAlign: "right", padding: "0.25rem 0.4rem", fontWeight: 600 }}>Fees</th>
                              <th style={{ textAlign: "right", padding: "0.25rem 0.4rem", fontWeight: 600 }}>Net</th>
                              <th style={{ textAlign: "right", padding: "0.25rem 0.4rem", fontWeight: 600 }}>Days</th>
                            </tr>
                          </thead>
                          <tbody>
                            {platEntries.slice(0, 8).map(([key, plat]: [string, any]) => {
                              if (!plat || typeof plat !== "object") return null;
                              const name = key.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase());
                              return (
                                <tr key={key} style={{ borderTop: "1px solid var(--border-default)" }}>
                                  <td style={{ padding: "0.3rem 0.4rem", color: "var(--text-primary)", fontWeight: 500 }}>{name}</td>
                                  <td style={{ padding: "0.3rem 0.4rem", textAlign: "right", color: "var(--text-secondary)" }}>{plat.list_price || plat.recommended_list_price ? `$${plat.list_price || plat.recommended_list_price}` : "—"}</td>
                                  <td style={{ padding: "0.3rem 0.4rem", textAlign: "right", color: "var(--text-secondary)" }}>{plat.expected_sell || plat.expected_sell_price ? `$${plat.expected_sell || plat.expected_sell_price}` : "—"}</td>
                                  <td style={{ padding: "0.3rem 0.4rem", textAlign: "right", color: "var(--text-muted)" }}>{plat.fees_pct || plat.fees_percentage ? `${plat.fees_pct || plat.fees_percentage}%` : "—"}</td>
                                  <td style={{ padding: "0.3rem 0.4rem", textAlign: "right", color: "#4caf50", fontWeight: 600 }}>{plat.seller_net || plat.seller_net_after_fees ? `$${plat.seller_net || plat.seller_net_after_fees}` : "—"}</td>
                                  <td style={{ padding: "0.3rem 0.4rem", textAlign: "right", color: "var(--text-muted)" }}>{plat.days_to_sell || plat.avg_days_to_sell || "—"}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                      {ph.bestPlatform && typeof ph.bestPlatform === "string" && <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "0.4rem" }}>Best: {ph.bestPlatform}</div>}
                    </div>
                  )}

                  {/* Market + Negotiation + Deep Pricing */}
                  {(ph.demandLevel || ph.listPrice || ph.priceHistoryTrend || ph.liquidationTimeline) && (
                    <div style={{ marginBottom: "0.65rem", padding: "0.65rem", background: "linear-gradient(135deg, rgba(139,92,246,0.04), rgba(0,188,212,0.02))", borderRadius: "0.6rem", border: "1px solid rgba(139,92,246,0.15)" }}>
                      <SectionLabel>Deep Pricing Intelligence</SectionLabel>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                        {ph.demandLevel && <div style={{ padding: "0.35rem 0.5rem", background: "var(--bg-card)", borderRadius: "0.35rem" }}><div style={{ fontSize: "0.58rem", fontWeight: 700, color: "var(--text-secondary)" }}>📊 Market</div><div style={{ fontSize: "0.72rem", color: "var(--text-secondary)" }}>{ph.demandLevel} demand · {ph.demandTrend || "Stable"} · Supply: {ph.supplyLevel || "Moderate"}{ph.seasonal ? ` · ${typeof ph.seasonal === "string" && ph.seasonal.length > 60 ? ph.seasonal.slice(0, 60) + "..." : ph.seasonal}` : ""}</div></div>}
                        {ph.listPrice && <div style={{ padding: "0.35rem 0.5rem", background: "var(--bg-card)", borderRadius: "0.35rem" }}><div style={{ fontSize: "0.58rem", fontWeight: 700, color: "var(--text-secondary)" }}>🤝 Negotiation</div><div style={{ fontSize: "0.72rem", color: "var(--text-secondary)" }}>List ${ Math.round(Number(ph.listPrice))}{ph.sweetSpot ? ` · Sweet spot $${Math.round(Number(ph.sweetSpot))}` : ""}{ph.minAccept ? ` · Floor $${Math.round(Number(ph.minAccept))}` : ""}{ph.counterStrategy ? `. ${typeof ph.counterStrategy === "string" && ph.counterStrategy.length > 80 ? ph.counterStrategy.slice(0, 80) + "..." : ph.counterStrategy}` : ""}</div></div>}
                        {ph.priceHistoryTrend && <div style={{ padding: "0.35rem 0.5rem", background: "var(--bg-card)", borderRadius: "0.35rem" }}><div style={{ fontSize: "0.58rem", fontWeight: 700, color: "var(--text-secondary)" }}>📈 Trend</div><div style={{ fontSize: "0.72rem", color: "var(--text-secondary)" }}>{ph.priceHistoryTrend}{ph.trendEvidence ? ` — ${typeof ph.trendEvidence === "string" && ph.trendEvidence.length > 80 ? ph.trendEvidence.slice(0, 80) + "..." : ph.trendEvidence}` : ""}</div></div>}
                        {ph.internationalPricing && <div style={{ padding: "0.35rem 0.5rem", background: "var(--bg-card)", borderRadius: "0.35rem" }}><div style={{ fontSize: "0.58rem", fontWeight: 700, color: "var(--text-secondary)" }}>🌍 International</div><div style={{ fontSize: "0.72rem", color: "var(--text-secondary)" }}>{Object.entries(ph.internationalPricing).filter(([, v]) => v != null).map(([k, v]) => `${k.replace(/_/g, " ").replace(/\bestimate\b/, "")}: $${v}`).join(" · ")}</div></div>}
                        {ph.liquidationTimeline && <div style={{ padding: "0.35rem 0.5rem", background: "var(--bg-card)", borderRadius: "0.35rem" }}><div style={{ fontSize: "0.58rem", fontWeight: 700, color: "var(--text-secondary)" }}>⏱️ Liquidation</div><div style={{ fontSize: "0.72rem", color: "var(--text-secondary)" }}>Day 1: ${(ph.liquidationTimeline as any).day_1_price || "?"} → Day 7: ${(ph.liquidationTimeline as any).day_7_price || "?"} → Day 30: ${(ph.liquidationTimeline as any).day_30_price || "?"} → Day 90: ${(ph.liquidationTimeline as any).day_90_price || "?"}</div></div>}
                        {ph.collectorPremium && typeof ph.collectorPremium === "string" && <div style={{ padding: "0.35rem 0.5rem", background: "var(--bg-card)", borderRadius: "0.35rem" }}><div style={{ fontSize: "0.58rem", fontWeight: 700, color: "var(--text-secondary)" }}>💎 Collector Premium</div><div style={{ fontSize: "0.72rem", color: "var(--text-secondary)" }}>{ph.collectorPremium.length > 120 ? ph.collectorPremium.slice(0, 120) + "..." : ph.collectorPremium}</div></div>}
                      </div>
                    </div>
                  )}

                  {/* Key insight + specialty */}
                  {ph.summary && (
                    <div style={{ marginBottom: "0.5rem", padding: "0.5rem 0.65rem", background: `${meta.color}08`, borderRadius: "0.5rem", borderLeft: `3px solid ${meta.color}50` }}>
                      <div style={{ fontSize: "0.55rem", textTransform: "uppercase", letterSpacing: "0.1em", color: meta.color, fontWeight: 700, marginBottom: "0.2rem" }}>{meta.icon} {meta.label} Summary</div>
                      <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", margin: 0, lineHeight: 1.5, fontStyle: "italic" }}>{typeof ph.summary === "string" && ph.summary.length > 400 ? ph.summary.slice(0, 400) + "..." : ph.summary}</p>
                    </div>
                  )}
                  <div style={{ fontSize: "0.58rem", color: "var(--text-muted)", fontStyle: "italic", marginBottom: "0.3rem" }}>{meta.icon} {meta.label} specializes in {meta.specialty.toLowerCase()}</div>
                  <div style={{ display: "flex", gap: "0.75rem" }}>
                    <button onClick={() => setShowAgentJson(isJson ? null : p.provider)} style={{ fontSize: "0.58rem", color: "var(--text-muted)", background: "transparent", border: "none", cursor: "pointer", textDecoration: "underline", padding: 0 }}>{isJson ? "Hide JSON" : "Show JSON"}</button>
                    <button onClick={() => setExpandedAgent(null)} style={{ fontSize: "0.58rem", color: meta.color, background: "transparent", border: "none", cursor: "pointer", padding: 0 }}>Collapse ▲</button>
                  </div>
                  {isJson && <pre style={{ fontSize: "0.55rem", color: "var(--text-muted)", background: "rgba(0,0,0,0.25)", borderRadius: "0.4rem", padding: "0.5rem", marginTop: "0.3rem", overflow: "auto", maxHeight: 250, whiteSpace: "pre-wrap" }}>{JSON.stringify(p.data, null, 2)}</pre>}
                </div>
              )}
            </div>
          );
        })}

        {/* Unavailable agents */}
        {failed.map((p: any) => {
          const meta = PROVIDER_META[p.provider] || { icon: "🤖", label: p.provider, color: "var(--text-muted)", specialty: "" };
          return (
            <div key={p.provider} style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.4rem 0.65rem", opacity: 0.4, background: "var(--bg-card)", border: "1px solid var(--border-default)", borderRadius: "0.5rem", fontSize: "0.68rem" }}>
              <span style={{ opacity: 0.5 }}>{meta.icon}</span><span style={{ fontWeight: 600, color: "var(--text-muted)" }}>{meta.label}</span><span style={{ color: "var(--text-muted)", flex: 1, fontSize: "0.62rem" }}>Unavailable</span>
            </div>
          );
        })}
      </div>

      {/* Pricing comparison */}
      {successful.length > 1 && (
        <div style={{ marginBottom: "0.65rem", padding: "0.5rem 0.75rem", background: "var(--bg-card)", borderRadius: "0.5rem", border: "1px solid var(--border-default)" }}>
          <div style={{ fontSize: "0.6rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "#a855f7", fontWeight: 700, marginBottom: "0.3rem" }}>Pricing Comparison</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem 1.25rem", fontSize: "0.78rem" }}>
            {successful.map((p: any) => {
              const meta = PROVIDER_META[p.provider];
              const ph = extractPH(p);
              return (
                <span key={p.provider} style={{ color: meta?.color || "var(--text-secondary)" }}>
                  {meta?.icon} {meta?.label}: {ph.priceLow != null && ph.priceHigh != null ? `$${Math.round(Number(ph.priceLow))}-$${Math.round(Number(ph.priceHigh))}` : "—"}
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* Summary */}
      {(() => {
        const allPH = successful.map(p => extractPH(p));
        const lows = allPH.map(h => h.priceLow).filter(Boolean).map(Number);
        const highs = allPH.map(h => h.priceHigh).filter(Boolean).map(Number);
        const parts: string[] = [];
        if (lows.length && highs.length) parts.push(`${successful.length} AI pricing experts valued this between $${Math.round(lows.reduce((a, b) => a + b, 0) / lows.length)}-$${Math.round(highs.reduce((a, b) => a + b, 0) / highs.length)}.`);
        const d = allPH.find(h => h.demandLevel)?.demandLevel;
        if (d) parts.push(`Market demand: ${d}.`);
        const tc = allPH.reduce((s, h) => s + (h.comparables?.length || 0), 0);
        if (tc) parts.push(`${tc} comparable sales found across agents.`);
        const bp = allPH.find(h => h.bestPlatform)?.bestPlatform;
        if (bp && typeof bp === "string") parts.push(`Best platform: ${bp}.`);
        const lp = allPH.find(h => h.listPrice)?.listPrice;
        const ma = allPH.find(h => h.minAccept)?.minAccept;
        if (lp && ma) parts.push(`List at $${Math.round(Number(lp))}, floor $${Math.round(Number(ma))}.`);
        const best = allPH.map(h => h.summary).filter((s): s is string => !!s && s.length > 40).sort((a, b) => b.length - a.length)[0];
        if (best && parts.length < 6) parts.push(best.split(/(?<=[.!?])\s+/).slice(0, 2).join(" "));
        return (
          <div style={{ background: "rgba(139,92,246,0.04)", borderLeft: "3px solid rgba(139,92,246,0.3)", borderRadius: "0 0.5rem 0.5rem 0", padding: "0.65rem 0.85rem", marginBottom: "0.65rem" }}>
            <div style={{ fontSize: "0.6rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "#a855f7", fontWeight: 700, marginBottom: "0.3rem" }}>MegaBot Pricing Summary</div>
            <p style={{ fontSize: "0.82rem", lineHeight: 1.65, color: "var(--text-secondary)", margin: 0 }}>{parts.join(" ") || `${successful.length} AI agents analyzed pricing.`}</p>
          </div>
        );
      })()}

      {/* MegaBot Web Sources */}
      {(() => {
        const allSrc = (megaResult?.providers || []).flatMap((p: any) => (p.webSources || []).map((s: any) => ({ ...s, provider: p.provider })));
        const unique = allSrc.filter((s: any, i: number, a: any[]) => a.findIndex((x: any) => x.url === s.url) === i);
        if (unique.length === 0) return null;
        return (
          <div style={{ marginTop: "0.5rem", marginBottom: "0.5rem", padding: "0.5rem 0.65rem", borderRadius: "0.5rem", background: "var(--ghost-bg)", border: "1px solid var(--border-default)" }}>
            <div style={{ fontSize: "0.55rem", fontWeight: 700, color: "#00bcd4", marginBottom: "0.25rem", textTransform: "uppercase" as const, letterSpacing: "0.05em" }}>
              🌐 MEGABOT WEB RESEARCH — {unique.length} sources
            </div>
            {unique.slice(0, 8).map((src: any, i: number) => (
              <a key={i} href={src.url} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: "0.3rem", padding: "0.2rem 0.35rem", marginBottom: "0.1rem", borderRadius: "0.25rem", background: "var(--bg-card)", textDecoration: "none", fontSize: "0.52rem", color: "#00bcd4" }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", flexShrink: 0, background: src.provider === "openai" ? "#10b981" : src.provider === "gemini" ? "#3b82f6" : "#00DC82" }} />
                <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>{src.title || src.url}</span>
                <span style={{ fontSize: "0.45rem", color: "var(--text-muted)", flexShrink: 0 }}>↗</span>
              </a>
            ))}
          </div>
        );
      })()}

      {/* Actions */}
      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
        <button onClick={onRunMegaBot} style={{ padding: "0.45rem 1rem", fontSize: "0.78rem", fontWeight: 600, borderRadius: "0.5rem", border: "none", background: "linear-gradient(135deg, #a855f7, #7c3aed)", color: "#fff", cursor: "pointer" }}>Re-Run MegaBot — 3 cr</button>
        <a href={`/bots/listbot?item=${itemId}`} style={{ padding: "0.45rem 1rem", fontSize: "0.78rem", fontWeight: 600, borderRadius: "0.5rem", border: "1px solid var(--accent)", background: "transparent", color: "var(--accent)", textDecoration: "none" }}>✍️ Create Listing →</a>
        <a href={`/bots/buyerbot?item=${itemId}`} style={{ padding: "0.45rem 1rem", fontSize: "0.78rem", fontWeight: 600, borderRadius: "0.5rem", border: "1px solid var(--border-default)", background: "transparent", color: "var(--text-secondary)", textDecoration: "none" }}>🎯 Find Buyers →</a>
      </div>
    </Card>
  );
}

export default function PriceBotClient({ items }: { items: ItemData[] }) {
  const searchParams = useSearchParams();
  const itemParam = searchParams.get("item");
  const [selectedId, setSelectedId] = useState<string | null>(
    (itemParam && items.some((i) => i.id === itemParam)) ? itemParam : items[0]?.id ?? null
  );
  const [loading, setLoading] = useState(false);
  const [freshResult, setFreshResult] = useState<Record<string, any>>({});
  // Accordion state
  const [openSections, setOpenSections] = useState<Set<string>>(new Set(["pricing-main", "comps", "platforms"]));
  const toggleSection = (id: string) => { setOpenSections(prev => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; }); };

  const item = items.find((i) => i.id === selectedId);
  const v = item?.valuation;
  const ai = useMemo(() => safeJson(item?.aiResult ?? null), [item?.aiResult]);

  // PriceBot result: from fresh run or from server-loaded data
  const pb = useMemo(() => {
    if (selectedId && freshResult[selectedId]) return freshResult[selectedId];
    return safeJson(item?.priceBotResult ?? null);
  }, [selectedId, item?.priceBotResult, freshResult]);

  const hasPriceBot = !!pb;

  // MegaBot state
  const [megaBotData, setMegaBotData] = useState<Record<string, any>>({});
  const [megaBotRunning, setMegaBotRunning] = useState(false);
  const [megaBotStep, setMegaBotStep] = useState(0);
  const [expandedAgent, setExpandedAgent] = useState<string | null>(null);
  const [showAgentJson, setShowAgentJson] = useState<string | null>(null);

  const megaResult = selectedId ? megaBotData[selectedId] : null;

  // Fetch existing MegaBot pricing data
  useEffect(() => {
    if (!selectedId) return;
    if (megaBotData[selectedId]) return;
    fetch(`/api/megabot/${selectedId}`)
      .then(r => r.json())
      .then(d => {
        if (d.results?.pricebot) {
          setMegaBotData(prev => ({ ...prev, [selectedId]: d.results.pricebot }));
        }
      })
      .catch(() => {});
  }, [selectedId]);

  async function runPriceBot(mega?: boolean) {
    if (!selectedId) return;
    if (mega) {
      // Clear old MegaBot data so loading state shows (not stale results)
      setMegaBotData(prev => { const next = { ...prev }; delete next[selectedId]; return next; });
      setMegaBotRunning(true);
      setMegaBotStep(0);
      const stepTimer = setInterval(() => setMegaBotStep(s => Math.min(s + 1, 8)), 3000);
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 180_000);
        const res = await fetch(`/api/megabot/${selectedId}?bot=pricebot`, { method: "POST", signal: controller.signal });
        clearTimeout(timeout);
        if (res.ok) {
          const data = await res.json();
          if (data && (data.providers || data.consensus)) {
            setMegaBotData(prev => ({ ...prev, [selectedId]: data }));
            setExpandedAgent(data.providers?.[0]?.provider || null);
          } else {
            console.warn("[PriceBot MegaBot] API OK but no providers/consensus", data);
          }
        } else {
          console.warn(`[PriceBot MegaBot] API returned ${res.status}`);
        }
      } catch (err: any) {
        console.warn("[PriceBot MegaBot] fetch error:", err?.name === "AbortError" ? "timed out" : err);
      }
      clearInterval(stepTimer);
      setMegaBotRunning(false);
      setMegaBotStep(0);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/bots/pricebot/${selectedId}`, { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setFreshResult((prev) => ({ ...prev, [selectedId]: data.result }));
      }
    } catch { /* ignore */ }
    setLoading(false);
  }

  return (
    <div>
      <BotItemSelector
        items={items.map((i) => ({ id: i.id, title: i.title, photo: i.photo, status: i.status, hasAnalysis: i.hasAnalysis }))}
        selectedId={selectedId}
        onSelect={setSelectedId}
      />

      {!item ? (
        <div style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)" }}>
          <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem", opacity: 0.3 }}>💰</div>
          <div style={{ fontSize: "0.95rem", fontWeight: 600, color: "var(--text-secondary)" }}>Select an Item for Pricing</div>
        </div>
      ) : !v ? (
        <Card style={{ marginTop: "1.5rem", textAlign: "center", padding: "3rem" }}>
          <div style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>{"\u{1F4B0}"}</div>
          <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.5rem" }}>No pricing data yet</h3>
          <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", lineHeight: 1.5, maxWidth: 400, margin: "0 auto" }}>
            Run AnalyzeBot first to generate base pricing. Then PriceBot will layer on market comparisons, platform breakdowns, and negotiation strategy.
          </p>
          <a href={`/bots/analyzebot?item=${item.id}`} style={{
            display: "inline-block", marginTop: "1rem", padding: "0.55rem 1.25rem", fontSize: "0.85rem", fontWeight: 700,
            borderRadius: "0.6rem", background: "linear-gradient(135deg, #00bcd4, #009688)", color: "#fff", textDecoration: "none",
          }}>
            {"\u{1F9E0}"} Run AnalyzeBot First
          </a>
        </Card>
      ) : loading ? (
        <Card style={{ marginTop: "1.5rem" }}>
          <BotLoadingState botName="PriceBot" />
        </Card>
      ) : !hasPriceBot ? (
        /* ── NOT RUN YET: Teaser + CTA ── */
        <div style={{ marginTop: "1.5rem", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          {/* Item summary */}
          <Card>
            <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
              {item.photo && <img src={item.photo} alt="" style={{ width: 64, height: 64, borderRadius: "0.5rem", objectFit: "cover" }} />}
              <div>
                <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "var(--text-primary)" }}>{item.title}</div>
                <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>{ai?.category || "General"} · {ai?.condition_score ? `${ai.condition_score}/10 condition` : ""}</div>
              </div>
            </div>
          </Card>

          {/* Quick estimate preview */}
          <Card>
            <SectionLabel>Quick Estimate (from General Analysis)</SectionLabel>
            <div style={{ fontSize: "2rem", fontWeight: 800, color: "var(--accent)" }}>
              ${Math.round(v.low)} – ${Math.round(v.high)}
            </div>
            <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
              Confidence: {Math.round(v.confidence * 100)}% · {v.source || "AI estimate"}
            </div>
          </Card>

          {/* CTA */}
          <Card style={{ textAlign: "center", background: "linear-gradient(135deg, rgba(0,188,212,0.06), rgba(255,215,0,0.03))", border: "1px solid rgba(0,188,212,0.3)" }}>
            <div style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>💰</div>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.5rem" }}>Run PriceBot Deep Dive</h3>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", lineHeight: 1.5, maxWidth: 500, margin: "0 auto 1rem" }}>
              Get comparable sales data, platform-specific pricing, negotiation guides, market analysis, rarity assessment, and a personalized selling strategy.
            </p>
            <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center", flexWrap: "wrap" }}>
              <button onClick={() => runPriceBot()} disabled={loading} style={{
                padding: "0.6rem 1.5rem", fontSize: "0.88rem", fontWeight: 700, borderRadius: "0.6rem",
                border: "none", background: "linear-gradient(135deg, #00bcd4, #009688)", color: "#fff",
                cursor: loading ? "wait" : "pointer", opacity: loading ? 0.7 : 1,
              }}>
                {loading ? "Running PriceBot..." : "💰 Run PriceBot Deep Dive — 1 credit"}
              </button>
              <button onClick={() => runPriceBot(true)} disabled={loading} style={{
                padding: "0.6rem 1.5rem", fontSize: "0.88rem", fontWeight: 700, borderRadius: "0.6rem",
                border: "1px solid var(--accent)", background: "rgba(0,188,212,0.08)", color: "var(--accent)",
                cursor: loading ? "wait" : "pointer",
              }}>
                ⚡ Run MegaBot Pricing — 5 credits
              </button>
            </div>
          </Card>

          {/* What you get teaser */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "0.75rem" }}>
            {[
              { icon: "📊", label: "Comparable Sales", desc: "5-12 real market comparisons" },
              { icon: "🏪", label: "Platform Breakdown", desc: "Best platform & net earnings" },
              { icon: "📈", label: "Market Analysis", desc: "Demand, supply, trends" },
              { icon: "🤝", label: "Negotiation Guide", desc: "List price, floor, counter strategy" },
              { icon: "💎", label: "Rarity Assessment", desc: "How rare & collector interest" },
              { icon: "⏰", label: "Timing Advice", desc: "Best time to sell" },
            ].map((t) => (
              <div key={t.label} style={{ padding: "0.75rem", borderRadius: "0.6rem", border: "1px solid var(--border-default)", background: "var(--bg-card)" }}>
                <div style={{ fontSize: "1rem", marginBottom: "0.25rem" }}>{t.icon}</div>
                <div style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--text-primary)" }}>{t.label}</div>
                <div style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>{t.desc}</div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* ── PRICEBOT RESULTS: Full display ── */
        <div style={{ marginTop: "1.5rem", display: "flex", flexDirection: "column", gap: "1.25rem" }}>

          {/* Freshness Indicator */}
          {item?.lastPricedAt && (
            <div style={{
              display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.5rem 0.75rem",
              background: "var(--ghost-bg)", borderRadius: "0.5rem", fontSize: "0.65rem", color: "var(--text-muted)", flexWrap: "wrap",
            }}>
              <span style={{ fontSize: "0.8rem" }}>🕐</span>
              <span>Last priced: <strong style={{ color: "var(--text-secondary)" }}>
                {timeAgo(item.lastPricedAt)}
              </strong></span>
              {(() => {
                const hrs = (Date.now() - new Date(item.lastPricedAt!).getTime()) / 3600000;
                if (hrs > 168) return <span style={{ color: "#ef4444", fontWeight: 600 }}>⚠️ Stale — prices may have changed</span>;
                if (hrs > 48) return <span style={{ color: "#f59e0b", fontWeight: 600 }}>⏳ Aging</span>;
                return <span style={{ color: "#22c55e", fontWeight: 600 }}>✅ Fresh</span>;
              })()}
              <span style={{ marginLeft: "auto", fontSize: "0.55rem" }}>
                {item.pricingHistory?.length ?? 0} run{(item.pricingHistory?.length ?? 0) !== 1 ? "s" : ""}
              </span>
            </div>
          )}

          {/* Expand All / Collapse All */}
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "-0.75rem" }}>
            <button onClick={() => {
              const allIds = ["pricing-main", "comps", "platforms", "market", "regional", "factors", "negotiation", "timeline", "rarity", "amazon", "sources", "history"];
              setOpenSections(prev => prev.size >= allIds.length ? new Set() : new Set(allIds));
            }} style={{ fontSize: "0.5rem", fontWeight: 600, color: "var(--text-muted)", background: "transparent", border: "none", cursor: "pointer", padding: "0.2rem 0.4rem" }}>
              {openSections.size >= 11 ? "▲ Collapse All" : "▼ Expand All"}
            </button>
          </div>

          {/* Pricing Evolution (3-stage comparison) */}
          <AccordionHeader id="pricing-main" icon="💰" title="PRICING EVOLUTION" subtitle={(() => {
            const low = pb?.price_validation?.revised_low ?? v?.low;
            const high = pb?.price_validation?.revised_high ?? v?.high;
            return low && high ? `$${low} — $${high}` : "";
          })()} isOpen={openSections.has("pricing-main")} onToggle={toggleSection} accentColor="#00bcd4" badge={pb?.confidence?.overall_confidence ? `${pb.confidence.overall_confidence}%` : ""} />
          {openSections.has("pricing-main") && (
            <div style={{ padding: "0.75rem", background: "var(--bg-card)", border: "1px solid var(--border-default)", borderRadius: "0 0 0.5rem 0.5rem", marginTop: "-0.5rem" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr auto 1fr", gap: "0.5rem", alignItems: "center" }}>
                <div style={{ textAlign: "center", padding: "0.5rem", background: "var(--ghost-bg)", borderRadius: "0.5rem" }}>
                  <div style={{ fontSize: "0.48rem", fontWeight: 600, color: "var(--text-muted)", letterSpacing: "0.05em", textTransform: "uppercase" as const }}>🧠 AI ANALYSIS</div>
                  <div style={{ fontSize: "0.55rem", color: "var(--text-muted)", marginBottom: "0.15rem" }}>Base Estimate</div>
                  <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text-primary)" }}>${item?.analyzeBasePricing?.low ?? v?.low ?? "?"} — ${item?.analyzeBasePricing?.high ?? v?.high ?? "?"}</div>
                </div>
                <div style={{ fontSize: "1.2rem", color: "var(--text-muted)" }}>→</div>
                <div style={{ textAlign: "center", padding: "0.5rem", background: "rgba(0,188,212,0.04)", borderRadius: "0.5rem", border: "1px solid rgba(0,188,212,0.15)" }}>
                  <div style={{ fontSize: "0.48rem", fontWeight: 600, color: "#00bcd4", letterSpacing: "0.05em", textTransform: "uppercase" as const }}>💰 PRICEBOT</div>
                  <div style={{ fontSize: "0.55rem", color: "var(--text-muted)", marginBottom: "0.15rem" }}>Refined</div>
                  <div style={{ fontSize: "1.3rem", fontWeight: 800, color: "#00bcd4" }}>${pb?.price_validation?.revised_low ?? v?.low ?? "?"} — ${pb?.price_validation?.revised_high ?? v?.high ?? "?"}</div>
                </div>
                <div style={{ fontSize: "1.2rem", color: "var(--text-muted)" }}>→</div>
                <div style={{ textAlign: "center", padding: "0.5rem", background: megaResult ? "rgba(139,92,246,0.06)" : "var(--ghost-bg)", borderRadius: "0.5rem", border: megaResult ? "1px solid rgba(139,92,246,0.2)" : "1px dashed var(--border-default)" }}>
                  <div style={{ fontSize: "0.48rem", fontWeight: 600, color: megaResult ? "#8b5cf6" : "var(--text-muted)", letterSpacing: "0.05em", textTransform: "uppercase" as const }}>⚡ MEGABOT</div>
                  <div style={{ fontSize: "0.55rem", color: "var(--text-muted)", marginBottom: "0.15rem" }}>4-AI Consensus</div>
                  {megaResult ? (
                    <div style={{ fontSize: "1.3rem", fontWeight: 800, color: "#8b5cf6" }}>${megaResult.consensus?.price_low ?? "?"} — ${megaResult.consensus?.price_high ?? "?"}</div>
                  ) : (
                    <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontStyle: "italic" }}>Not yet run</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Section A — Price Overview */}
          <Card>
            <div style={{ display: "flex", gap: "1rem", alignItems: "flex-start", flexWrap: "wrap" }}>
              {item.photo && <img src={item.photo} alt="" style={{ width: 56, height: 56, borderRadius: "0.5rem", objectFit: "cover" }} />}
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                  <span style={{ fontWeight: 700, fontSize: "0.95rem", color: "var(--text-primary)" }}>{item.title}</span>
                  {item.priceBotRunAt && (
                    <span style={{ fontSize: "0.65rem", color: "var(--text-muted)", fontWeight: 500 }}>
                      {"\u00B7"} Last run: {timeAgo(item.priceBotRunAt)}
                    </span>
                  )}
                  {item.priceBotRunAt && (Date.now() - new Date(item.priceBotRunAt).getTime()) > 7 * 24 * 60 * 60 * 1000 && (
                    <span style={{ fontSize: "0.62rem", color: "#f59e0b", fontWeight: 600 }}>
                      {"\u26A0\uFE0F"} Stale
                    </span>
                  )}
                </div>
                <div style={{ display: "flex", alignItems: "baseline", gap: "0.5rem", marginTop: "0.35rem" }}>
                  <span style={{ fontSize: "2.2rem", fontWeight: 800, color: "var(--accent)" }}>
                    ${pb.price_validation?.revised_low ?? Math.round(v.low)}
                  </span>
                  <span style={{ fontSize: "1rem", color: "var(--text-muted)" }}>{"\u2014"}</span>
                  <span style={{ fontSize: "2.2rem", fontWeight: 800, color: "var(--accent)" }}>
                    ${pb.price_validation?.revised_high ?? Math.round(v.high)}
                  </span>
                </div>
                {(() => {
                  const midPrice = pb.price_validation?.revised_mid ?? v.mid ?? Math.round((v.low + v.high) / 2);
                  const net = sellerNet(midPrice);
                  return (
                    <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>
                      Mid ${Math.round(midPrice)} {"\u2192"} You keep ~<span style={{ color: "#4ade80", fontWeight: 600 }}>${net.toFixed(2)}</span> after ~5% commission + 1.75% fee
                    </div>
                  );
                })()}
                {pb.price_validation && !pb.price_validation.agrees_with_estimate && (
                  <div style={{ fontSize: "0.78rem", color: "#ff9800", marginTop: "0.25rem" }}>
                    {"\u{1F4CA}"} PriceBot revised the estimate from ${Math.round(v.low)}{"\u2013"}${Math.round(v.high)} {"\u2014"} {pb.price_validation.revision_reasoning?.slice(0, 120)}
                  </div>
                )}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem", alignItems: "flex-end" }}>
                {pb.confidence && (
                  <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                    <div style={{ width: 80, height: 6, borderRadius: 99, background: "var(--ghost-bg)", overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${pb.confidence.overall_confidence}%`, borderRadius: 99, background: pb.confidence.overall_confidence >= 70 ? "#4caf50" : "#ff9800" }} />
                    </div>
                    <span style={{ fontSize: "0.72rem", fontWeight: 600, color: "var(--text-primary)" }}>{pb.confidence.overall_confidence}%</span>
                  </div>
                )}
                {pb.market_analysis && <DemandBadge level={pb.market_analysis.demand_level} />}
              </div>
            </div>
          </Card>

          {/* Section B — Comparable Sales */}
          <AccordionHeader id="comps" icon="📊" title="COMPARABLE SALES" subtitle={`${(pb.comparable_sales || []).length} comps`} isOpen={openSections.has("comps")} onToggle={toggleSection} badge={pb.comparable_sales?.length ? `${pb.comparable_sales.length} found` : ""} />
          {openSections.has("comps") && pb.comparable_sales?.length > 0 && (
            <Card>
              <SectionLabel>Comparable Sales ({pb.comparable_sales.length} found)</SectionLabel>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {pb.comparable_sales
                  .sort((a: any, b: any) => {
                    const order = { High: 0, Medium: 1, Low: 2 };
                    return (order[a.relevance as keyof typeof order] ?? 2) - (order[b.relevance as keyof typeof order] ?? 2);
                  })
                  .map((comp: any, i: number) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.6rem 0.75rem", borderRadius: "0.5rem", border: "1px solid var(--border-default)", background: "var(--bg-card)" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.15rem" }}>
                        <span style={{ fontSize: "0.72rem", fontWeight: 600, color: "var(--text-muted)" }}>{comp.platform}</span>
                        <RelevanceBadge relevance={comp.relevance} />
                      </div>
                      <div style={{ fontSize: "0.82rem", color: "var(--text-primary)" }}>{comp.item_description}</div>
                      <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginTop: "0.1rem" }}>
                        {comp.sold_date} · {comp.condition_compared} condition
                        {comp.notes && ` · ${comp.notes}`}
                      </div>
                      {(comp.source_url || comp.url) && (
                        <a href={comp.source_url || comp.url} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: "0.2rem", fontSize: "0.5rem", color: "#00bcd4", textDecoration: "none", marginTop: "0.2rem" }}>
                          🔗 View source ↗
                        </a>
                      )}
                    </div>
                    <div style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--accent)", flexShrink: 0 }}>
                      ${comp.sold_price}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Section C — Platform Breakdown */}
          <AccordionHeader id="platforms" icon="🏪" title="WHERE TO SELL" subtitle={pb.platform_pricing?.best_platform ? `Best: ${pb.platform_pricing.best_platform}` : ""} isOpen={openSections.has("platforms")} onToggle={toggleSection} accentColor="#00bcd4" />
          {openSections.has("platforms") && pb.platform_pricing && (
            <Card>
              <SectionLabel>Platform Breakdown</SectionLabel>
              {pb.platform_pricing.best_platform && (
                <div style={{ fontSize: "0.82rem", color: "var(--text-secondary)", marginBottom: "0.75rem", padding: "0.5rem 0.75rem", borderRadius: "0.5rem", background: "rgba(0,188,212,0.06)", border: "1px solid rgba(0,188,212,0.15)" }}>
                  🏆 <strong>Best Platform:</strong> {pb.platform_pricing.best_platform}
                </div>
              )}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: "0.6rem" }}>
                {Object.entries(pb.platform_pricing)
                  .filter(([k]) => k !== "best_platform")
                  .map(([key, plat]: [string, any]) => {
                    if (!plat || typeof plat !== "object") return null;
                    const name = key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
                    const isBest = pb.platform_pricing.best_platform?.toLowerCase().includes(key.replace(/_/g, " "));
                    const listPrice = plat.recommended_list_price ?? plat.recommended_price ?? plat.estimated_hammer_price;
                    const netPrice = plat.seller_net_after_fees ?? plat.seller_net;
                    const fees = plat.fees_percentage ?? plat.typical_consignment_cut ?? plat.sellers_commission;
                    const days = plat.avg_days_to_sell;
                    return (
                      <div key={key} style={{
                        padding: "0.75rem", borderRadius: "0.5rem",
                        border: isBest ? "1px solid var(--accent)" : "1px solid var(--border-default)",
                        background: isBest ? "rgba(0,188,212,0.04)" : "var(--bg-card)",
                      }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", marginBottom: "0.35rem" }}>
                          <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--text-primary)" }}>{name}</span>
                          {isBest && <span style={{ fontSize: "0.55rem", fontWeight: 700, padding: "0.1rem 0.35rem", borderRadius: "9999px", background: "rgba(0,188,212,0.15)", color: "var(--accent)" }}>BEST</span>}
                        </div>
                        {listPrice != null && (
                          <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                            List at <strong style={{ color: "var(--text-primary)" }}>${listPrice}</strong>
                            {plat.expected_sell_price && <> → Sells ~<strong>${plat.expected_sell_price}</strong></>}
                          </div>
                        )}
                        {fees != null && (
                          <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginTop: "0.15rem" }}>
                            Fees: {typeof fees === "number" ? `${fees}%` : fees}
                            {netPrice != null && <> · <strong style={{ color: "#4caf50" }}>You get ${netPrice}</strong></>}
                          </div>
                        )}
                        {days != null && (
                          <div style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>~{days} days to sell</div>
                        )}
                        {plat.tips && <div style={{ fontSize: "0.68rem", color: "var(--text-muted)", fontStyle: "italic", marginTop: "0.2rem" }}>{plat.tips.length > 100 ? plat.tips.slice(0, 100) + "…" : plat.tips}</div>}
                      </div>
                    );
                  })}
              </div>
            </Card>
          )}

          {/* Section D — Market Analysis */}
          <AccordionHeader id="market" icon="📈" title="MARKET ANALYSIS" subtitle={pb.market_analysis?.demand_level || ""} isOpen={openSections.has("market")} onToggle={toggleSection} />
          {openSections.has("market") && pb.market_analysis && (
            <Card>
              <SectionLabel>Market Analysis</SectionLabel>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                <div>
                  <div style={{ fontSize: "0.68rem", color: "var(--text-muted)", marginBottom: "0.15rem" }}>Demand</div>
                  <DemandBadge level={pb.market_analysis.demand_level} />
                  <div style={{ fontSize: "0.72rem", color: "var(--text-secondary)", marginTop: "0.25rem" }}>{pb.market_analysis.demand_reasoning}</div>
                </div>
                <div>
                  <div style={{ fontSize: "0.68rem", color: "var(--text-muted)", marginBottom: "0.15rem" }}>Supply</div>
                  <span style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--text-primary)" }}>{pb.market_analysis.supply_level}</span>
                  <div style={{ fontSize: "0.72rem", color: "var(--text-secondary)", marginTop: "0.25rem" }}>{pb.market_analysis.supply_reasoning}</div>
                </div>
                <div>
                  <div style={{ fontSize: "0.68rem", color: "var(--text-muted)", marginBottom: "0.15rem" }}>Trend</div>
                  <span style={{ fontSize: "0.78rem", fontWeight: 600, color: pb.market_analysis.demand_trend === "Rising" ? "#4caf50" : pb.market_analysis.demand_trend === "Declining" ? "#ef4444" : "var(--text-primary)" }}>
                    {pb.market_analysis.demand_trend === "Rising" ? "📈" : pb.market_analysis.demand_trend === "Declining" ? "📉" : "📊"} {pb.market_analysis.demand_trend}
                  </span>
                </div>
                <div>
                  <div style={{ fontSize: "0.68rem", color: "var(--text-muted)", marginBottom: "0.15rem" }}>Seasonal</div>
                  <div style={{ fontSize: "0.72rem", color: "var(--text-secondary)" }}>{pb.market_analysis.seasonal_factors}</div>
                </div>
              </div>
            </Card>
          )}

          {/* Section E — Regional Pricing */}
          <AccordionHeader id="regional" icon="🗺️" title="REGIONAL PRICING" subtitle="Local vs National vs Best Market" isOpen={openSections.has("regional")} onToggle={toggleSection} />
          {openSections.has("regional") && pb.regional_pricing && (
            <Card>
              <SectionLabel>Regional Pricing</SectionLabel>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.6rem", marginBottom: "0.75rem" }}>
                <div style={{ padding: "0.6rem", borderRadius: "0.5rem", border: "1px solid var(--border-default)", textAlign: "center" }}>
                  <div style={{ fontSize: "0.6rem", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "0.15rem" }}>Local</div>
                  <div style={{ fontSize: "1.3rem", fontWeight: 800, color: "var(--accent)" }}>${pb.regional_pricing.local_price_estimate}</div>
                  <div style={{ fontSize: "0.65rem", color: "var(--text-muted)" }}>{pb.regional_pricing.local_market_strength}</div>
                </div>
                {pb.regional_pricing.best_us_market && (
                  <div style={{ padding: "0.6rem", borderRadius: "0.5rem", border: "1px solid rgba(76,175,80,0.3)", background: "rgba(76,175,80,0.04)", textAlign: "center" }}>
                    <div style={{ fontSize: "0.6rem", textTransform: "uppercase", color: "#4caf50", marginBottom: "0.15rem" }}>Best Market</div>
                    <div style={{ fontSize: "1.3rem", fontWeight: 800, color: "#4caf50" }}>${pb.regional_pricing.best_us_market.estimated_price}</div>
                    <div style={{ fontSize: "0.65rem", color: "var(--text-muted)" }}>{pb.regional_pricing.best_us_market.city}</div>
                  </div>
                )}
                {pb.regional_pricing.worst_us_market && (
                  <div style={{ padding: "0.6rem", borderRadius: "0.5rem", border: "1px solid var(--border-default)", textAlign: "center" }}>
                    <div style={{ fontSize: "0.6rem", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "0.15rem" }}>Worst Market</div>
                    <div style={{ fontSize: "1.3rem", fontWeight: 800, color: "var(--text-secondary)" }}>${pb.regional_pricing.worst_us_market.estimated_price}</div>
                    <div style={{ fontSize: "0.65rem", color: "var(--text-muted)" }}>{pb.regional_pricing.worst_us_market.city}</div>
                  </div>
                )}
              </div>
              {pb.regional_pricing.ship_vs_local_verdict && (
                <div style={{ fontSize: "0.82rem", color: "var(--text-secondary)", padding: "0.5rem 0.75rem", borderRadius: "0.5rem", background: "rgba(0,188,212,0.06)", border: "1px solid rgba(0,188,212,0.12)" }}>
                  🚚 {pb.regional_pricing.ship_vs_local_verdict}
                </div>
              )}
            </Card>
          )}

          {/* Section F — Value Factors */}
          <AccordionHeader id="factors" icon="💎" title="VALUE FACTORS" subtitle={`${(pb.price_factors?.value_adders || []).length} adders · ${(pb.price_factors?.value_reducers || []).length} reducers`} isOpen={openSections.has("factors")} onToggle={toggleSection} />
          {openSections.has("factors") && pb.price_factors && (
            <Card>
              <SectionLabel>Value Factors</SectionLabel>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                {pb.price_factors.value_adders?.length > 0 && (
                  <div>
                    <div style={{ fontSize: "0.7rem", fontWeight: 600, color: "#4caf50", marginBottom: "0.35rem" }}>Value Adders</div>
                    {pb.price_factors.value_adders.map((f: any, i: number) => (
                      <div key={i} style={{ padding: "0.4rem 0.6rem", borderRadius: "0.4rem", border: "1px solid rgba(76,175,80,0.2)", background: "rgba(76,175,80,0.04)", marginBottom: "0.3rem" }}>
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                          <span style={{ fontSize: "0.78rem", color: "var(--text-primary)" }}>{f.factor}</span>
                          <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "#4caf50" }}>{f.impact}</span>
                        </div>
                        <div style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>{f.explanation}</div>
                      </div>
                    ))}
                  </div>
                )}
                {pb.price_factors.value_reducers?.length > 0 && (
                  <div>
                    <div style={{ fontSize: "0.7rem", fontWeight: 600, color: "#ef4444", marginBottom: "0.35rem" }}>Value Reducers</div>
                    {pb.price_factors.value_reducers.map((f: any, i: number) => (
                      <div key={i} style={{ padding: "0.4rem 0.6rem", borderRadius: "0.4rem", border: "1px solid rgba(239,68,68,0.2)", background: "rgba(239,68,68,0.04)", marginBottom: "0.3rem" }}>
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                          <span style={{ fontSize: "0.78rem", color: "var(--text-primary)" }}>{f.factor}</span>
                          <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "#ef4444" }}>{f.impact}</span>
                        </div>
                        <div style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>{f.explanation}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {pb.price_factors.condition_price_curve && (
                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.5rem", fontStyle: "italic" }}>{pb.price_factors.condition_price_curve}</div>
              )}
            </Card>
          )}

          {/* Section G — Negotiation Guide */}
          <AccordionHeader id="negotiation" icon="🤝" title="NEGOTIATION GUIDE" subtitle={pb.negotiation_guide?.sweet_spot ? `Sweet spot: $${pb.negotiation_guide.sweet_spot}` : ""} isOpen={openSections.has("negotiation")} onToggle={toggleSection} accentColor="#22c55e" />
          {openSections.has("negotiation") && pb.negotiation_guide && (
            <Card>
              <SectionLabel>Negotiation Guide</SectionLabel>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.6rem", marginBottom: "0.75rem" }}>
                <div style={{ textAlign: "center", padding: "0.6rem", borderRadius: "0.5rem", border: "1px solid var(--border-default)" }}>
                  <div style={{ fontSize: "0.6rem", textTransform: "uppercase", color: "var(--text-muted)" }}>List At</div>
                  <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "var(--accent)" }}>${pb.negotiation_guide.list_price}</div>
                </div>
                <div style={{ textAlign: "center", padding: "0.6rem", borderRadius: "0.5rem", border: "1px solid rgba(76,175,80,0.3)", background: "rgba(76,175,80,0.04)" }}>
                  <div style={{ fontSize: "0.6rem", textTransform: "uppercase", color: "#4caf50" }}>Sweet Spot</div>
                  <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "#4caf50" }}>${pb.negotiation_guide.sweet_spot}</div>
                </div>
                <div style={{ textAlign: "center", padding: "0.6rem", borderRadius: "0.5rem", border: "1px solid rgba(239,68,68,0.2)" }}>
                  <div style={{ fontSize: "0.6rem", textTransform: "uppercase", color: "#ef4444" }}>Floor</div>
                  <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "#ef4444" }}>${pb.negotiation_guide.minimum_accept}</div>
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem", fontSize: "0.78rem", color: "var(--text-secondary)" }}>
                {pb.negotiation_guide.first_offer_expect && <div>💬 {pb.negotiation_guide.first_offer_expect}</div>}
                {pb.negotiation_guide.counter_strategy && <div>🎯 {pb.negotiation_guide.counter_strategy}</div>}
                {pb.negotiation_guide.bundle_opportunity && <div>📦 {pb.negotiation_guide.bundle_opportunity}</div>}
              </div>
            </Card>
          )}

          {/* Section H — Price Timeline */}
          <AccordionHeader id="timeline" icon="📅" title="PRICE TIMELINE & DECAY" subtitle={pb.price_decay?.best_time_to_sell || ""} isOpen={openSections.has("timeline")} onToggle={toggleSection} />
          {openSections.has("timeline") && pb.price_decay && (
            <Card>
              <SectionLabel>Price Timeline</SectionLabel>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.6rem" }}>
                <div>
                  <div style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--text-primary)" }}>
                    {pb.price_decay.holds_value ? "✅ Holds Value" : "⚠️ Depreciates"}
                  </div>
                  <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "0.15rem" }}>{pb.price_decay.decay_rate}</div>
                </div>
                <div>
                  <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>Best time to sell</div>
                  <div style={{ fontSize: "0.78rem", color: "var(--text-primary)", fontWeight: 500 }}>{pb.price_decay.best_time_to_sell}</div>
                </div>
              </div>
              {pb.price_decay.appreciation_potential && (
                <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "0.5rem" }}>📈 {pb.price_decay.appreciation_potential}</div>
              )}
            </Card>
          )}

          {/* Section I — Rarity */}
          <AccordionHeader id="rarity" icon="✨" title="RARITY ASSESSMENT" subtitle={pb.rarity_assessment?.rarity_level || ""} isOpen={openSections.has("rarity")} onToggle={toggleSection} />
          {openSections.has("rarity") && pb.rarity_assessment && (
            <Card>
              <SectionLabel>Rarity Assessment</SectionLabel>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
                <span style={{
                  padding: "0.25rem 0.75rem", borderRadius: "9999px", fontSize: "0.78rem", fontWeight: 700,
                  background: pb.rarity_assessment.rarity_level === "Common" ? "rgba(117,117,117,0.12)" : pb.rarity_assessment.rarity_level === "Rare" || pb.rarity_assessment.rarity_level === "Very Rare" ? "rgba(251,191,36,0.15)" : pb.rarity_assessment.rarity_level === "Unique" ? "rgba(156,39,176,0.15)" : "rgba(0,188,212,0.12)",
                  color: pb.rarity_assessment.rarity_level === "Common" ? "#9e9e9e" : pb.rarity_assessment.rarity_level === "Rare" || pb.rarity_assessment.rarity_level === "Very Rare" ? "#fbbf24" : pb.rarity_assessment.rarity_level === "Unique" ? "#ce93d8" : "var(--accent)",
                }}>
                  {pb.rarity_assessment.rarity_level === "Unique" ? "💎" : pb.rarity_assessment.rarity_level === "Very Rare" ? "⭐" : pb.rarity_assessment.rarity_level === "Rare" ? "✨" : ""} {pb.rarity_assessment.rarity_level}
                </span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem", fontSize: "0.78rem", color: "var(--text-secondary)" }}>
                {pb.rarity_assessment.production_numbers && <div>Production: {pb.rarity_assessment.production_numbers}</div>}
                {pb.rarity_assessment.currently_available && <div>Currently available: {pb.rarity_assessment.currently_available}</div>}
                {pb.rarity_assessment.collector_interest && <div>Collector interest: {pb.rarity_assessment.collector_interest}</div>}
                {pb.rarity_assessment.rarity_impact_on_price && <div style={{ fontStyle: "italic", color: "var(--text-muted)", marginTop: "0.25rem" }}>{pb.rarity_assessment.rarity_impact_on_price}</div>}
              </div>
            </Card>
          )}

          {/* Section K — Recommendation Banner */}
          {pb.executive_summary && (
            <Card style={{ background: "linear-gradient(135deg, rgba(0,188,212,0.08), rgba(76,175,80,0.04))", border: "1px solid rgba(0,188,212,0.3)" }}>
              <SectionLabel>💰 Our Pricing Recommendation</SectionLabel>
              <div style={{ fontSize: "0.92rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>
                {pb.executive_summary}
              </div>
              {pb.negotiation_guide && (
                <div style={{ marginTop: "0.75rem", display: "flex", gap: "0.75rem", fontSize: "0.82rem" }}>
                  <span style={{ color: "var(--text-muted)" }}>List at <strong style={{ color: "var(--accent)" }}>${pb.negotiation_guide.list_price}</strong></span>
                  <span style={{ color: "var(--text-muted)" }}>Accept above <strong style={{ color: "#4caf50" }}>${pb.negotiation_guide.minimum_accept}</strong></span>
                </div>
              )}
            </Card>
          )}

          {/* Amazon Market Data */}
          {item?.amazonData && (
            <>
              <AccordionHeader id="amazon" icon="📦" title="AMAZON MARKET DATA" subtitle={`${item.amazonData.resultCount ?? item.amazonData.result_count ?? 0} products`} isOpen={openSections.has("amazon")} onToggle={toggleSection} accentColor="#ff9900" badge="ENRICHED" />
              {openSections.has("amazon") && (
                <Card>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.5rem" }}>
                    <div style={{ textAlign: "center", padding: "0.4rem", background: "rgba(255,153,0,0.06)", borderRadius: "0.4rem" }}>
                      <div style={{ fontSize: "0.48rem", color: "var(--text-muted)", fontWeight: 600 }}>NEW RETAIL AVG</div>
                      <div style={{ fontSize: "0.9rem", fontWeight: 700, color: "#ff9900" }}>${item.amazonData.priceAvg ?? item.amazonData.price_avg ?? "—"}</div>
                    </div>
                    <div style={{ textAlign: "center", padding: "0.4rem", background: "rgba(255,153,0,0.06)", borderRadius: "0.4rem" }}>
                      <div style={{ fontSize: "0.48rem", color: "var(--text-muted)", fontWeight: 600 }}>USED ESTIMATE</div>
                      <div style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--text-primary)" }}>${Math.round((item.amazonData.priceAvg ?? item.amazonData.price_avg ?? 0) * 0.55)}</div>
                    </div>
                    <div style={{ textAlign: "center", padding: "0.4rem", background: "rgba(255,153,0,0.06)", borderRadius: "0.4rem" }}>
                      <div style={{ fontSize: "0.48rem", color: "var(--text-muted)", fontWeight: 600 }}>RESULTS</div>
                      <div style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--text-primary)" }}>{item.amazonData.resultCount ?? item.amazonData.result_count ?? 0}</div>
                    </div>
                  </div>
                  <div style={{ fontSize: "0.55rem", color: "var(--text-muted)", fontStyle: "italic", marginTop: "0.35rem" }}>
                    💡 Amazon retail prices are new. Used items typically sell for 30–70% of retail depending on condition.
                  </div>
                </Card>
              )}
            </>
          )}

          {/* Pricing History */}
          {(item?.pricingHistory?.length ?? 0) > 0 && (
            <>
              <AccordionHeader id="history" icon="📜" title="PRICING HISTORY" subtitle={`${item!.pricingHistory!.length} runs`} isOpen={openSections.has("history")} onToggle={toggleSection} />
              {openSections.has("history") && (
                <Card>
                  {item!.pricingHistory!.map((run: any, i: number) => (
                    <div key={run.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.4rem 0.5rem", borderBottom: i < item!.pricingHistory!.length - 1 ? "1px solid var(--border-default)" : "none", fontSize: "0.6rem" }}>
                      <span style={{ padding: "2px 6px", borderRadius: "4px", fontSize: "0.5rem", fontWeight: 600, background: run.type === "MEGABOT_PRICEBOT" ? "rgba(139,92,246,0.1)" : "rgba(0,188,212,0.1)", color: run.type === "MEGABOT_PRICEBOT" ? "#8b5cf6" : "#00bcd4" }}>
                        {run.type === "MEGABOT_PRICEBOT" ? "⚡ MegaBot" : "💰 PriceBot"}
                      </span>
                      <span style={{ color: "var(--text-muted)", fontSize: "0.55rem" }}>
                        {new Date(run.createdAt).toLocaleDateString()} {new Date(run.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                  ))}
                </Card>
              )}
            </>
          )}

          {/* Sources & Citations */}
          {(pb?.web_sources?.length > 0 || pb?.comparable_sales?.some((c: any) => c.source_url || c.url)) && (
            <div style={{ marginTop: "0.25rem" }}>
              <AccordionHeader id="sources" icon="🔗" title="SOURCES & CITATIONS" subtitle={`${(pb?.web_sources || []).length} web sources`} isOpen={openSections.has("sources")} onToggle={toggleSection} accentColor="#00bcd4" badge="LIVE DATA" />
              {openSections.has("sources") && (
                <Card>
                  <div style={{ fontSize: "0.55rem", color: "var(--text-muted)", marginBottom: "0.35rem" }}>
                    Prices found via real-time web search during analysis:
                  </div>
                  {(pb?.web_sources || []).map((src: any, i: number) => (
                    <a key={i} href={src.url} target="_blank" rel="noopener noreferrer" style={{
                      display: "flex", alignItems: "center", gap: "0.3rem",
                      padding: "0.3rem 0.5rem", marginBottom: "0.2rem",
                      borderRadius: "0.35rem", background: "var(--ghost-bg)",
                      textDecoration: "none", fontSize: "0.58rem", color: "#00bcd4",
                      border: "1px solid transparent",
                    }}>
                      <span style={{ fontSize: "0.75rem" }}>🔗</span>
                      <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>{src.title || src.url}</span>
                      <span style={{ fontSize: "0.48rem", color: "var(--text-muted)", flexShrink: 0 }}>↗</span>
                    </a>
                  ))}
                  {(pb?.web_sources || []).length === 0 && (
                    <div style={{ fontSize: "0.58rem", color: "var(--text-muted)", fontStyle: "italic", padding: "0.3rem" }}>
                      📊 Pricing based on AI market knowledge. Live web search sources will appear here when available.
                    </div>
                  )}
                </Card>
              )}
            </div>
          )}

          {/* ── MegaBot Pricing Section ── */}
          <MegaBotPricingSection
            megaResult={megaResult}
            megaBotRunning={megaBotRunning}
            megaBotStep={megaBotStep}
            expandedAgent={expandedAgent}
            showAgentJson={showAgentJson}
            setExpandedAgent={setExpandedAgent}
            setShowAgentJson={setShowAgentJson}
            onRunMegaBot={() => runPriceBot(true)}
            itemId={selectedId!}
          />

          {/* Demo indicator */}
          {pb._isDemo && (
            <div style={{ padding: "0.5rem 0.75rem", borderRadius: "0.5rem", background: "rgba(234,179,8,0.08)", border: "1px solid rgba(234,179,8,0.25)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span>🧪</span>
              <span style={{ fontSize: "0.75rem", color: "#eab308" }}>Demo Mode — results based on category averages. Real PriceBot uses live market data from OpenAI.</span>
            </div>
          )}

          {/* Section L — Actions */}
          <Card>
            <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap", justifyContent: "center" }}>
              <button onClick={() => runPriceBot()} disabled={loading} style={{
                padding: "0.5rem 1rem", fontSize: "0.82rem", fontWeight: 600, borderRadius: "0.5rem",
                border: "1px solid var(--border-default)", background: "var(--ghost-bg)",
                color: "var(--text-secondary)", cursor: loading ? "wait" : "pointer",
              }}>
                💰 Re-Run PriceBot — 1 cr
              </button>
              <button onClick={() => runPriceBot(true)} disabled={loading} style={{
                padding: "0.5rem 1rem", fontSize: "0.82rem", fontWeight: 600, borderRadius: "0.5rem",
                border: "none", background: "linear-gradient(135deg, #00bcd4, #009688)", color: "#fff",
                cursor: loading ? "wait" : "pointer",
              }}>
                ⚡ MegaBot Pricing — 5 cr
              </button>
              <a href={`/bots/listbot?item=${item.id}`} style={{
                padding: "0.5rem 1rem", fontSize: "0.82rem", fontWeight: 600, borderRadius: "0.5rem",
                border: "1px solid var(--accent)", background: "transparent", color: "var(--accent)",
                textDecoration: "none", display: "inline-flex", alignItems: "center",
              }}>
                ✍️ Create Listing at ${pb.negotiation_guide?.list_price ?? Math.round(v.high)} →
              </a>
              <a href={`/items/${item.id}`} style={{
                padding: "0.5rem 1rem", fontSize: "0.82rem", fontWeight: 600, borderRadius: "0.5rem",
                border: "1px solid var(--border-default)", background: "transparent", color: "var(--text-secondary)",
                textDecoration: "none",
              }}>
                🔙 Back to Item
              </a>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
