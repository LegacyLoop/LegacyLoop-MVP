"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import BotLoadingState from "@/app/components/BotLoadingState";

type Item = {
  id: string;
  title: string;
  status: string;
  photo: string | null;
  hasAnalysis: boolean;
  aiResult: string | null;
  antiqueBotResult: string | null;
  antiqueBotRunAt: string | null;
  antique: { isAntique: boolean; auctionLow: number | null; auctionHigh: number | null; reason: string | null } | null;
  category: string;
  era: string | null;
  maker: string | null;
  material: string | null;
  valuationMid: number | null;
};

function safeJson(s: string | null): any {
  if (!s) return null;
  try { return JSON.parse(s); } catch { return null; }
}

// Gold color scheme
const GOLD = "#fbbf24";
const GOLD_DARK = "#92400e";
const GOLD_BG = "rgba(251,191,36,0.06)";
const GOLD_BORDER = "rgba(251,191,36,0.2)";

// ─── MegaBot helpers ─────────────────────────────────────────────────────────

const MEGA_PROVIDER_META: Record<string, { icon: string; label: string; color: string; specialty: string }> = {
  openai: { icon: "🤖", label: "OpenAI", color: "#10a37f", specialty: "Broad authentication patterns, market value databases, condition grading" },
  claude: { icon: "🧠", label: "Claude", color: "#d97706", specialty: "Craftsmanship analysis, historical provenance, maker attribution" },
  gemini: { icon: "🔮", label: "Gemini", color: "#4285f4", specialty: "Auction price tracking, trend analysis, collector market dynamics" },
  grok: { icon: "🌀", label: "Grok (xAI)", color: "#00DC82", specialty: "Social collector communities, emerging trends, viral antique finds" },
};

function _megaNormKeys(o: any): any {
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
const _megaObj = (v: any) => (v && typeof v === "object" && !Array.isArray(v)) ? v : null;

function _megaArr(d: any, ...keys: string[]): any[] {
  for (const k of keys) { if (Array.isArray(d[k]) && d[k].length > 0) return d[k]; }
  const wrappers = ["antique_analysis", "deep_dive", "megabot_enhancement", "authentication_report"];
  for (const w of wrappers) { if (d[w] && typeof d[w] === "object") { for (const k of keys) { if (Array.isArray(d[w][k]) && d[w][k].length > 0) return d[w][k]; } } }
  return [];
}
function _megaField(d: any, ...keys: string[]): any {
  for (const k of keys) { if (d[k] != null && d[k] !== "" && d[k] !== "Unknown") return d[k]; }
  return null;
}

// Safe price extraction — handles numbers, strings ("$5,000"), and objects ({low, mid, high})
function _extractPrice(v: any): number | null {
  if (v == null) return null;
  if (typeof v === "number") return isFinite(v) ? v : null;
  if (typeof v === "string") { const n = Number(v.replace(/[^0-9.\-]/g, "")); return isFinite(n) ? n : null; }
  if (typeof v === "object" && !Array.isArray(v)) {
    const mid = _extractPrice(v.mid ?? v.middle ?? v.average);
    if (mid != null) return mid;
    const lo = _extractPrice(v.low ?? v.min);
    const hi = _extractPrice(v.high ?? v.max);
    if (lo != null && hi != null) return Math.round((lo + hi) / 2);
    return lo ?? hi ?? null;
  }
  return null;
}
function _fmtPrice(v: any): string { const n = _extractPrice(v); return n != null ? `$${Math.round(n).toLocaleString()}` : "—"; }
function _fmtRange(v: any): string {
  if (v && typeof v === "object" && !Array.isArray(v)) {
    const lo = _extractPrice(v.low ?? v.min);
    const hi = _extractPrice(v.high ?? v.max);
    if (lo != null && hi != null) return `$${Math.round(lo).toLocaleString()} – $${Math.round(hi).toLocaleString()}`;
    if (lo != null) return `$${Math.round(lo).toLocaleString()}+`;
    if (hi != null) return `Up to $${Math.round(hi).toLocaleString()}`;
  }
  return _fmtPrice(v);
}

function extractMegaAntique(p: any) {
  let d = _megaNormKeys(p.data || {});
  const topKeys = Object.keys(d);
  if (topKeys.length === 1 && _megaObj(d[topKeys[0]]) && Object.keys(d[topKeys[0]]).length >= 2) d = d[topKeys[0]];

  const auth = _megaObj(d.authentication) || _megaObj(d.authentication_assessment) || null;
  const hist = _megaObj(d.historical_research) || _megaObj(d.historical_context) || _megaObj(d.history) || null;
  const cond = _megaObj(d.condition_deep_dive) || _megaObj(d.condition_assessment) || _megaObj(d.condition) || null;
  const val = _megaObj(d.valuation) || _megaObj(d.pricing) || _megaObj(d.value_assessment) || null;
  const market = _megaObj(d.collector_market) || _megaObj(d.market_analysis) || null;
  const strategy = _megaObj(d.selling_strategy) || _megaObj(d.strategy) || null;
  const certs = _megaObj(d.certificates_and_documentation) || _megaObj(d.documentation) || _megaObj(d.certificates) || null;
  const comparables = _megaArr(d, "comparable_auction_results", "comparables", "auction_results", "recent_sales");

  const verdict = auth?.verdict || _megaField(d, "verdict", "authentication_verdict", "authenticity");
  const era = hist?.period || hist?.era || _megaField(d, "era", "period", "date_range");
  const maker = hist?.maker || hist?.maker_name || _megaField(d, "maker", "maker_name", "artist", "manufacturer");
  const condGrade = cond?.overall_grade || cond?.grade || _megaField(d, "condition_grade", "overall_grade");
  const originalPct = cond?.original_percentage || cond?.originality || _megaField(d, "original_percentage", "originality_percent");
  const restoredPct = cond?.restored_percentage || cond?.restoration_percentage || null;

  const fmvLow = _extractPrice(val?.fair_market_value?.low) ?? _extractPrice(val?.low) ?? _extractPrice(_megaField(d, "estimated_value_low", "price_low", "value_low"));
  const fmvHigh = _extractPrice(val?.fair_market_value?.high) ?? _extractPrice(val?.high) ?? _extractPrice(_megaField(d, "estimated_value_high", "price_high", "value_high"));
  const auctionEst = val?.auction_estimate || null;
  const insuranceVal = _extractPrice(val?.insurance_value) ?? _extractPrice(_megaField(d, "insurance_value"));
  const confidence = auth?.confidence || _megaField(d, "confidence", "authentication_confidence");

  const sectionCount = [auth, hist, cond, val, market, strategy, certs].filter(Boolean).length;

  return {
    auth, hist, cond, val, market, strategy, certs, comparables,
    verdict, era, maker, condGrade, originalPct, restoredPct,
    fmvLow, fmvHigh, auctionEst, insuranceVal, confidence,
    sectionCount,
    summary: d.executive_summary || d.summary || null,
  };
}

function Toast({ message }: { message: string }) {
  return (
    <div style={{
      position: "fixed", bottom: "2rem", right: "2rem", zIndex: 9999,
      background: GOLD_DARK, color: "#fff", padding: "0.75rem 1.25rem",
      borderRadius: "0.75rem", fontWeight: 600, fontSize: "0.85rem",
      boxShadow: "0 8px 32px rgba(146, 64, 14, 0.4)",
      animation: "fadeSlideUp 0.3s ease",
    }}>
      {message}
    </div>
  );
}

export default function AntiqueBotClient({ items }: { items: Item[] }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"authentication" | "history" | "valuation" | "market" | "strategy" | "documentation">("authentication");
  const [megaBotData, setMegaBotData] = useState<any>(null);
  const [megaBotLoading, setMegaBotLoading] = useState(false);
  const [megaBotExpanded, setMegaBotExpanded] = useState<string | null>(null);

  // Auto-select from URL query
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const itemParam = params.get("item");
    if (itemParam) {
      setSelectedId(itemParam);
      const item = items.find((i) => i.id === itemParam);
      if (item?.antiqueBotResult) {
        setResult(safeJson(item.antiqueBotResult));
      }
    }
  }, [items]);

  // Load existing result when selecting an item
  useEffect(() => {
    if (!selectedId) { setResult(null); return; }
    const item = items.find((i) => i.id === selectedId);
    if (item?.antiqueBotResult) {
      setResult(safeJson(item.antiqueBotResult));
    } else {
      setResult(null);
      // Try fetching from API
      fetch(`/api/bots/antiquebot/${selectedId}`)
        .then((r) => r.json())
        .then((d) => { if (d.hasResult) setResult(d.result); })
        .catch(() => {});
    }
  }, [selectedId, items]);

  // Load MegaBot data
  useEffect(() => {
    if (!selectedId) { setMegaBotData(null); return; }
    fetch(`/api/megabot/${selectedId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.results?.antiquebot) setMegaBotData(d.results.antiquebot);
        else setMegaBotData(null);
      })
      .catch(() => setMegaBotData(null));
  }, [selectedId]);

  const runMegaAntiqueBot = useCallback(async () => {
    if (!selectedId || megaBotLoading) return;
    setMegaBotData(null);
    setMegaBotLoading(true);
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 180_000);
      const res = await fetch(`/api/megabot/${selectedId}?bot=antiquebot`, { method: "POST", signal: controller.signal });
      clearTimeout(timeout);
      if (res.ok) {
        const data = await res.json();
        if (data && (data.providers || data.consensus)) {
          setMegaBotData(data);
        }
      } else {
        console.warn("[MegaAntiqueBot] API error:", res.status);
      }
    } catch (e: any) {
      console.warn("[MegaAntiqueBot] fetch error:", e.message);
    }
    setMegaBotLoading(false);
  }, [selectedId, megaBotLoading]);

  async function runAntiqueBot() {
    if (!selectedId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/bots/antiquebot/${selectedId}`, { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setResult(data.result);
        showToast("AntiqueBot analysis complete!");
      } else {
        const err = await res.json().catch(() => ({ error: "Failed" }));
        showToast(err.error || "Analysis failed");
      }
    } catch {
      showToast("Analysis failed");
    }
    setLoading(false);
  }

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  const selected = items.find((i) => i.id === selectedId);
  const antiqueItems = items.filter((i) => i.antique?.isAntique);
  const analyzedItems = items.filter((i) => i.hasAnalysis);
  const auth = result?.authentication;
  const ident = result?.identification;
  const hist = result?.historical_context;
  const cond = result?.condition_assessment;
  const val = result?.valuation;
  const market = result?.collector_market;
  const strategy = result?.selling_strategy;
  const docs = result?.documentation;

  return (
    <div>
      {toast && <Toast message={toast} />}

      {/* ── Section A: Stats Banner ── */}
      <div style={{
        display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.75rem", marginBottom: "1.5rem",
      }}>
        {[
          { label: "Total Items", value: items.length, icon: "📦" },
          { label: "Analyzed", value: analyzedItems.length, icon: "🧠" },
          { label: "Antiques Found", value: antiqueItems.length, icon: "🏺" },
          { label: "Appraised", value: items.filter((i) => i.antiqueBotResult).length, icon: "📋" },
        ].map((s) => (
          <div key={s.label} style={{
            background: "var(--bg-card)", border: `1px solid ${GOLD_BORDER}`,
            borderRadius: "0.75rem", padding: "0.85rem", textAlign: "center",
          }}>
            <div style={{ fontSize: "1.1rem", marginBottom: "0.15rem" }}>{s.icon}</div>
            <div style={{ fontSize: "1.25rem", fontWeight: 800, color: GOLD }}>{s.value}</div>
            <div style={{ fontSize: "0.6rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── Section B: Item Selector ── */}
      <div style={{
        background: "var(--bg-card)", border: `1px solid ${GOLD_BORDER}`,
        borderRadius: "1rem", padding: "1.25rem", marginBottom: "1.5rem",
      }}>
        <div style={{ fontSize: "0.65rem", fontWeight: 700, color: GOLD, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.75rem" }}>
          Select Item for Antique Appraisal
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "0.5rem" }}>
          {analyzedItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setSelectedId(item.id)}
              style={{
                display: "flex", alignItems: "center", gap: "0.5rem",
                padding: "0.5rem 0.65rem", borderRadius: "0.5rem",
                background: selectedId === item.id ? `${GOLD}15` : "var(--bg-card)",
                border: `1.5px solid ${selectedId === item.id ? GOLD : "var(--border-default)"}`,
                cursor: "pointer", textAlign: "left", color: "inherit", width: "100%",
                transition: "border-color 0.15s ease",
              }}
            >
              {item.photo ? (
                <img src={item.photo} alt="" style={{ width: 32, height: 32, borderRadius: "0.35rem", objectFit: "cover" }} />
              ) : (
                <div style={{ width: 32, height: 32, borderRadius: "0.35rem", background: "var(--ghost-bg)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.75rem" }}>📷</div>
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: "0.72rem", fontWeight: 600, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.title}</div>
                <div style={{ fontSize: "0.55rem", color: "var(--text-muted)" }}>
                  {item.antique?.isAntique ? "🏺 Antique" : item.era || item.category}
                  {item.antiqueBotResult ? " · ✅ Appraised" : ""}
                </div>
              </div>
            </button>
          ))}
        </div>
        {analyzedItems.length === 0 && (
          <div style={{ textAlign: "center", padding: "2rem", color: "var(--text-muted)", fontSize: "0.85rem" }}>
            No analyzed items yet. <Link href="/dashboard" style={{ color: GOLD }}>Analyze items first</Link>.
          </div>
        )}
      </div>

      {/* ── Section C: Run Button ── */}
      {selected && (
        <div style={{
          background: `linear-gradient(135deg, ${GOLD}08, ${GOLD}15)`,
          border: `1.5px solid ${GOLD_BORDER}`,
          borderRadius: "1rem", padding: "1.25rem", marginBottom: "1.5rem",
          display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.75rem",
        }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: "1rem", color: "var(--text-primary)" }}>{selected.title}</div>
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.15rem" }}>
              {selected.antique?.isAntique ? "🏺 Flagged as antique" : "Not flagged — run AntiqueBot for deep analysis"}
              {selected.valuationMid ? ` · Est. $${selected.valuationMid.toLocaleString()}` : ""}
            </div>
          </div>
          <button
            onClick={runAntiqueBot}
            disabled={loading || !selected.hasAnalysis}
            style={{
              display: "inline-flex", alignItems: "center", gap: "0.5rem",
              padding: "0.65rem 1.5rem",
              background: loading ? "linear-gradient(135deg, #a3a3a3, #737373)" : `linear-gradient(135deg, #d97706, ${GOLD_DARK})`,
              color: "#fff", fontWeight: 700, fontSize: "0.9rem", borderRadius: "0.875rem",
              border: "none", cursor: loading ? "not-allowed" : "pointer",
              boxShadow: loading ? "none" : `0 4px 14px ${GOLD}55`,
            }}
          >
            {loading ? (
              <>
                <span style={{ display: "inline-block", width: "1rem", height: "1rem", border: "2px solid var(--border-default)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.6s linear infinite" }} />
                Analyzing...
              </>
            ) : result ? (
              "🔄 Re-Analyze — 1 credit"
            ) : (
              "🏺 Run Antique Appraisal — 1 credit"
            )}
          </button>
        </div>
      )}

      {/* ── Section D: Results ── */}
      {result && selected && (
        <div>
          {/* Authentication Verdict Hero */}
          {auth && (
            <div style={{
              borderRadius: "1rem", padding: "3px", marginBottom: "1.5rem",
              background: auth.verdict === "Authentic" || auth.verdict === "Likely Authentic"
                ? "linear-gradient(135deg, #16a34a, #22c55e)"
                : auth.verdict === "Uncertain"
                  ? "linear-gradient(135deg, #d97706, #fbbf24)"
                  : "linear-gradient(135deg, #dc2626, #f87171)",
              boxShadow: `0 0 24px ${auth.verdict === "Authentic" || auth.verdict === "Likely Authentic" ? "rgba(22,163,74,0.3)" : auth.verdict === "Uncertain" ? "rgba(251,191,36,0.3)" : "rgba(220,38,38,0.3)"}`,
            }}>
              <div style={{ background: "var(--bg-card)", borderRadius: "calc(1rem - 3px)", padding: "1.5rem 2rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
                  <div style={{ fontSize: "2.5rem" }}>
                    {auth.verdict === "Authentic" || auth.verdict === "Likely Authentic" ? "✅" : auth.verdict === "Uncertain" ? "⚠️" : "❌"}
                  </div>
                  <div>
                    <div style={{ fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--text-muted)" }}>Authentication Verdict</div>
                    <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--text-primary)" }}>{auth.verdict}</div>
                    <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: "0.15rem" }}>Confidence: {auth.confidence}%</div>
                  </div>
                  {val?.fair_market_value && (
                    <div style={{ marginLeft: "auto", textAlign: "right" }}>
                      <div style={{ fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: GOLD }}>Estimated Value</div>
                      <div style={{ fontSize: "1.5rem", fontWeight: 800, color: GOLD }}>{_fmtRange(val.fair_market_value)}</div>
                    </div>
                  )}
                </div>
                {auth.reasoning && (
                  <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", lineHeight: 1.6, marginTop: "1rem", marginBottom: 0 }}>
                    {auth.reasoning}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Executive Summary */}
          {result.executive_summary && (
            <div style={{
              background: `${GOLD}08`, border: `1.5px solid ${GOLD_BORDER}`,
              borderRadius: "1rem", padding: "1.25rem", marginBottom: "1.5rem",
              borderLeft: `4px solid ${GOLD}`,
            }}>
              <div style={{ fontSize: "0.6rem", fontWeight: 700, color: GOLD, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.5rem" }}>Expert Summary</div>
              <p style={{ fontSize: "0.88rem", color: "var(--text-secondary)", lineHeight: 1.7, margin: 0 }}>
                {result.executive_summary}
              </p>
            </div>
          )}

          {/* Tab Navigation */}
          <div style={{ display: "flex", gap: "0.25rem", marginBottom: "1rem", flexWrap: "wrap" }}>
            {([
              { key: "authentication", label: "🔍 Authentication", show: !!auth },
              { key: "history", label: "📜 History", show: !!hist },
              { key: "valuation", label: "💰 Valuation", show: !!val },
              { key: "market", label: "🏛️ Market", show: !!market },
              { key: "strategy", label: "📊 Strategy", show: !!strategy },
              { key: "documentation", label: "📋 Docs", show: !!docs },
            ] as { key: typeof activeTab; label: string; show: boolean }[]).filter((t) => t.show).map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                style={{
                  padding: "0.45rem 0.85rem", borderRadius: "0.5rem",
                  fontSize: "0.75rem", fontWeight: 600, border: "none", cursor: "pointer",
                  background: activeTab === tab.key ? `${GOLD}20` : "var(--bg-card)",
                  color: activeTab === tab.key ? GOLD : "var(--text-muted)",
                  borderBottom: activeTab === tab.key ? `2px solid ${GOLD}` : "2px solid transparent",
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div style={{
            background: "var(--bg-card)", border: `1px solid ${GOLD_BORDER}`,
            borderRadius: "1rem", padding: "1.5rem",
          }}>
            {/* ── Authentication Tab ── */}
            {activeTab === "authentication" && auth && (
              <div>
                {/* Indicators */}
                {auth.positive_indicators?.length > 0 && (
                  <div style={{ marginBottom: "1.25rem" }}>
                    <div style={{ fontSize: "0.6rem", fontWeight: 700, color: "#16a34a", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.4rem" }}>Positive Indicators</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem" }}>
                      {auth.positive_indicators.map((ind: string, i: number) => (
                        <span key={i} style={{ padding: "0.2rem 0.6rem", borderRadius: "9999px", fontSize: "0.7rem", fontWeight: 600, background: "rgba(22,163,74,0.1)", color: "#16a34a", border: "1px solid rgba(22,163,74,0.2)" }}>{ind}</span>
                      ))}
                    </div>
                  </div>
                )}
                {auth.red_flags?.length > 0 && (
                  <div style={{ marginBottom: "1.25rem" }}>
                    <div style={{ fontSize: "0.6rem", fontWeight: 700, color: "#dc2626", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.4rem" }}>Red Flags</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem" }}>
                      {auth.red_flags.map((flag: string, i: number) => (
                        <span key={i} style={{ padding: "0.2rem 0.6rem", borderRadius: "9999px", fontSize: "0.7rem", fontWeight: 600, background: "rgba(220,38,38,0.1)", color: "#dc2626", border: "1px solid rgba(220,38,38,0.2)" }}>{flag}</span>
                      ))}
                    </div>
                  </div>
                )}
                {auth.recommended_tests?.length > 0 && (
                  <div style={{ marginBottom: "1.25rem" }}>
                    <div style={{ fontSize: "0.6rem", fontWeight: 700, color: GOLD, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.4rem" }}>Recommended Tests</div>
                    {auth.recommended_tests.map((test: string, i: number) => (
                      <div key={i} style={{ fontSize: "0.8rem", color: "var(--text-secondary)", padding: "0.3rem 0", borderBottom: "1px solid var(--border-default)" }}>
                        {i + 1}. {test}
                      </div>
                    ))}
                  </div>
                )}
                {auth.appraiser_recommendation && (
                  <div style={{ padding: "0.75rem", background: `${GOLD}08`, borderRadius: "0.5rem", borderLeft: `3px solid ${GOLD}` }}>
                    <div style={{ fontSize: "0.6rem", fontWeight: 700, color: GOLD, textTransform: "uppercase", marginBottom: "0.25rem" }}>Appraiser Recommendation</div>
                    <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", lineHeight: 1.5, margin: 0 }}>{auth.appraiser_recommendation}</p>
                  </div>
                )}

                {/* Identification details */}
                {ident && (
                  <div style={{ marginTop: "1.25rem" }}>
                    <div style={{ fontSize: "0.6rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.5rem" }}>Identification</div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
                      {[
                        { label: "Type", value: ident.item_type },
                        { label: "Period", value: ident.period },
                        { label: "Origin", value: ident.origin },
                        { label: "Rarity", value: ident.rarity },
                        { label: "Style", value: ident.style_movement },
                        { label: "Maker", value: ident.maker_info?.name },
                      ].filter((d) => d.value).map((d) => (
                        <div key={d.label} style={{ background: "var(--bg-card)", border: "1px solid var(--border-default)", borderRadius: "0.5rem", padding: "0.5rem 0.65rem" }}>
                          <div style={{ fontSize: "0.5rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-muted)" }}>{d.label}</div>
                          <div style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--text-primary)", marginTop: "0.1rem" }}>{d.value}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── History Tab ── */}
            {activeTab === "history" && hist && (
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {[
                  { label: "Era Overview", value: hist.era_overview },
                  { label: "Cultural Significance", value: hist.cultural_significance },
                  { label: "Notable Examples", value: hist.notable_examples },
                  { label: "Production History", value: hist.production_history },
                ].filter((h) => h.value).map((h) => (
                  <div key={h.label}>
                    <div style={{ fontSize: "0.6rem", fontWeight: 700, color: GOLD, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.3rem" }}>{h.label}</div>
                    <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)", lineHeight: 1.6, margin: 0 }}>{h.value}</p>
                  </div>
                ))}
                {/* Condition assessment */}
                {cond && (
                  <div>
                    <div style={{ fontSize: "0.6rem", fontWeight: 700, color: GOLD, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.4rem" }}>Condition Assessment</div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.5rem", marginBottom: "0.75rem" }}>
                      {[
                        { label: "Grade", value: cond.overall_grade },
                        { label: "Age Wear", value: cond.age_appropriate_wear ? "Normal" : "Unusual" },
                        { label: "Restoration", value: cond.restoration_detected ? "Detected" : "None" },
                      ].map((c) => (
                        <div key={c.label} style={{ background: "var(--bg-card)", border: "1px solid var(--border-default)", borderRadius: "0.5rem", padding: "0.5rem", textAlign: "center" }}>
                          <div style={{ fontSize: "0.5rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-muted)" }}>{c.label}</div>
                          <div style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--text-primary)", marginTop: "0.1rem" }}>{c.value}</div>
                        </div>
                      ))}
                    </div>
                    {cond.condition_impact_on_value && (
                      <p style={{ fontSize: "0.78rem", color: "var(--text-secondary)", lineHeight: 1.5, margin: 0 }}>{cond.condition_impact_on_value}</p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ── Valuation Tab ── */}
            {activeTab === "valuation" && val && (
              <div>
                {/* Main value grid */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.75rem", marginBottom: "1.25rem" }}>
                  {[
                    { label: "Fair Market Low", value: val.fair_market_value?.low },
                    { label: "Fair Market Mid", value: val.fair_market_value?.mid, highlight: true },
                    { label: "Fair Market High", value: val.fair_market_value?.high },
                  ].map((v) => (
                    <div key={v.label} style={{
                      background: v.highlight ? `${GOLD}12` : "var(--bg-card)",
                      border: `1.5px solid ${v.highlight ? GOLD : "var(--border-default)"}`,
                      borderRadius: "0.75rem", padding: "0.75rem", textAlign: "center",
                    }}>
                      <div style={{ fontSize: "0.5rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-muted)" }}>{v.label}</div>
                      <div style={{ fontSize: "1.15rem", fontWeight: 800, color: v.highlight ? GOLD : "var(--text-primary)", marginTop: "0.15rem" }}>
                        {_fmtPrice(v.value)}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Other values */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "0.5rem", marginBottom: "1rem" }}>
                  {[
                    { label: "Insurance Value", value: val.insurance_value },
                    { label: "Replacement Value", value: val.replacement_value },
                    { label: "Private Sale", value: val.private_sale_estimate },
                    { label: "Dealer Buy Price", value: val.dealer_buy_price },
                  ].filter((v) => v.value).map((v) => (
                    <div key={v.label} style={{ display: "flex", justifyContent: "space-between", padding: "0.4rem 0.5rem", borderBottom: "1px solid var(--border-default)" }}>
                      <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{v.label}</span>
                      <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-primary)" }}>{_fmtPrice(v.value)}</span>
                    </div>
                  ))}
                </div>

                {/* Auction estimate */}
                {val.auction_estimate && (
                  <div style={{ background: `${GOLD}08`, border: `1px solid ${GOLD_BORDER}`, borderRadius: "0.75rem", padding: "0.85rem", marginBottom: "1rem" }}>
                    <div style={{ fontSize: "0.6rem", fontWeight: 700, color: GOLD, textTransform: "uppercase", marginBottom: "0.35rem" }}>Auction Estimate</div>
                    <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "0.5rem" }}>
                      <div>
                        <div style={{ fontSize: "1.1rem", fontWeight: 800, color: GOLD }}>
                          {_fmtRange(val.auction_estimate)}
                        </div>
                      </div>
                      {val.auction_estimate.reserve_recommendation && (
                        <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
                          Reserve: {_fmtPrice(val.auction_estimate.reserve_recommendation)}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Trend */}
                {val.value_trend && (
                  <div style={{ padding: "0.65rem", borderLeft: `3px solid ${val.value_trend === "Appreciating" ? "#16a34a" : val.value_trend === "Declining" ? "#dc2626" : GOLD}`, background: "var(--bg-card)", borderRadius: "0 0.5rem 0.5rem 0" }}>
                    <div style={{ fontSize: "0.72rem", fontWeight: 700, color: val.value_trend === "Appreciating" ? "#16a34a" : val.value_trend === "Declining" ? "#dc2626" : GOLD }}>
                      {val.value_trend === "Appreciating" ? "📈" : val.value_trend === "Declining" ? "📉" : "➡️"} {val.value_trend}
                    </div>
                    {val.value_trend_reasoning && (
                      <p style={{ fontSize: "0.72rem", color: "var(--text-secondary)", margin: "0.2rem 0 0", lineHeight: 1.4 }}>{val.value_trend_reasoning}</p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ── Market Tab ── */}
            {activeTab === "market" && market && (
              <div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", marginBottom: "1.25rem" }}>
                  {[
                    { label: "Demand", value: market.collector_demand },
                    { label: "Collector Base", value: market.collector_base?.slice(0, 80) },
                  ].map((m) => (
                    <div key={m.label} style={{ background: "var(--bg-card)", border: "1px solid var(--border-default)", borderRadius: "0.5rem", padding: "0.5rem 0.65rem" }}>
                      <div style={{ fontSize: "0.5rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-muted)" }}>{m.label}</div>
                      <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-primary)", marginTop: "0.1rem" }}>{m.value}</div>
                    </div>
                  ))}
                </div>

                {market.recent_auction_results?.length > 0 && (
                  <div style={{ marginBottom: "1rem" }}>
                    <div style={{ fontSize: "0.6rem", fontWeight: 700, color: GOLD, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.4rem" }}>Recent Auction Results</div>
                    {market.recent_auction_results.map((r: any, i: number) => (
                      <div key={i} style={{ padding: "0.5rem", borderBottom: "1px solid var(--border-default)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                          <div style={{ fontSize: "0.72rem", fontWeight: 600, color: "var(--text-primary)" }}>{r.house}</div>
                          <div style={{ fontSize: "0.65rem", color: "var(--text-muted)" }}>{r.item} · {r.date}</div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <div style={{ fontSize: "0.78rem", fontWeight: 700, color: GOLD }}>{r.realized}</div>
                          <div style={{ fontSize: "0.6rem", color: "var(--text-muted)" }}>Est: {r.estimate}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {market.collector_organizations?.length > 0 && (
                  <div>
                    <div style={{ fontSize: "0.6rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "0.3rem" }}>Collector Organizations</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.3rem" }}>
                      {market.collector_organizations.map((org: string, i: number) => (
                        <span key={i} style={{ padding: "0.15rem 0.5rem", borderRadius: "9999px", fontSize: "0.65rem", fontWeight: 600, background: `${GOLD}10`, color: GOLD, border: `1px solid ${GOLD_BORDER}` }}>{org}</span>
                      ))}
                    </div>
                  </div>
                )}

                {market.market_outlook && (
                  <p style={{ fontSize: "0.78rem", color: "var(--text-secondary)", lineHeight: 1.5, marginTop: "1rem", marginBottom: 0 }}>{market.market_outlook}</p>
                )}
              </div>
            )}

            {/* ── Strategy Tab ── */}
            {activeTab === "strategy" && strategy && (
              <div>
                {strategy.best_venue && (
                  <div style={{ padding: "0.75rem", background: `${GOLD}08`, borderRadius: "0.5rem", borderLeft: `3px solid ${GOLD}`, marginBottom: "1.25rem" }}>
                    <div style={{ fontSize: "0.6rem", fontWeight: 700, color: GOLD, textTransform: "uppercase", marginBottom: "0.2rem" }}>Best Venue</div>
                    <p style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-primary)", margin: 0 }}>{strategy.best_venue}</p>
                  </div>
                )}

                {strategy.venue_options?.length > 0 && (
                  <div style={{ marginBottom: "1.25rem" }}>
                    <div style={{ fontSize: "0.6rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.4rem" }}>Venue Comparison</div>
                    {strategy.venue_options.map((v: any, i: number) => (
                      <div key={i} style={{ padding: "0.65rem", borderBottom: "1px solid var(--border-default)" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <div>
                            <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--text-primary)" }}>{v.name || v.venue}</span>
                            <span style={{ fontSize: "0.65rem", color: "var(--text-muted)", marginLeft: "0.5rem" }}>{v.timeline}</span>
                          </div>
                          <div style={{ fontSize: "0.85rem", fontWeight: 800, color: GOLD }}>{_fmtPrice(v.expected_return)}</div>
                        </div>
                        <div style={{ fontSize: "0.68rem", color: "var(--text-secondary)", marginTop: "0.2rem" }}>
                          <span style={{ color: "#16a34a" }}>+</span> {v.pros} · <span style={{ color: "#dc2626" }}>–</span> {v.cons}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {strategy.presentation_tips?.length > 0 && (
                  <div style={{ marginBottom: "1rem" }}>
                    <div style={{ fontSize: "0.6rem", fontWeight: 700, color: GOLD, textTransform: "uppercase", marginBottom: "0.3rem" }}>Presentation Tips</div>
                    {strategy.presentation_tips.map((tip: string, i: number) => (
                      <div key={i} style={{ fontSize: "0.75rem", color: "var(--text-secondary)", padding: "0.2rem 0" }}>• {tip}</div>
                    ))}
                  </div>
                )}

                {strategy.timing && (
                  <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", margin: 0 }}>⏰ {strategy.timing}</p>
                )}
              </div>
            )}

            {/* ── Documentation Tab ── */}
            {activeTab === "documentation" && docs && (
              <div>
                {docs.provenance_tips?.length > 0 && (
                  <div style={{ marginBottom: "1.25rem" }}>
                    <div style={{ fontSize: "0.6rem", fontWeight: 700, color: GOLD, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.4rem" }}>Provenance Research Tips</div>
                    {docs.provenance_tips.map((tip: string, i: number) => (
                      <div key={i} style={{ fontSize: "0.78rem", color: "var(--text-secondary)", padding: "0.3rem 0", borderBottom: "1px solid var(--border-default)" }}>
                        {i + 1}. {tip}
                      </div>
                    ))}
                  </div>
                )}

                {docs.recommended_references?.length > 0 && (
                  <div style={{ marginBottom: "1.25rem" }}>
                    <div style={{ fontSize: "0.6rem", fontWeight: 700, color: GOLD, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.4rem" }}>Reference Resources</div>
                    {docs.recommended_references.map((ref: string, i: number) => (
                      <div key={i} style={{ fontSize: "0.78rem", color: "var(--text-secondary)", padding: "0.25rem 0" }}>📚 {ref}</div>
                    ))}
                  </div>
                )}

                {strategy?.documentation_needed?.length > 0 && (
                  <div style={{ marginBottom: "1rem" }}>
                    <div style={{ fontSize: "0.6rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "0.3rem" }}>Documentation Checklist</div>
                    {strategy.documentation_needed.map((doc: string, i: number) => (
                      <div key={i} style={{ fontSize: "0.75rem", color: "var(--text-secondary)", padding: "0.2rem 0" }}>☐ {doc}</div>
                    ))}
                  </div>
                )}

                {docs.comparable_database && (
                  <div style={{ padding: "0.65rem", background: `${GOLD}08`, borderRadius: "0.5rem", borderLeft: `3px solid ${GOLD}` }}>
                    <div style={{ fontSize: "0.6rem", fontWeight: 700, color: GOLD, textTransform: "uppercase", marginBottom: "0.2rem" }}>Comparable Database</div>
                    <p style={{ fontSize: "0.78rem", color: "var(--text-secondary)", margin: 0, lineHeight: 1.4 }}>{docs.comparable_database}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Back to item link */}
          <div style={{ marginTop: "1.25rem", textAlign: "center" }}>
            <Link
              href={`/items/${selectedId}`}
              style={{ fontSize: "0.82rem", color: GOLD, fontWeight: 600, textDecoration: "none" }}
            >
              ← Back to Item Page
            </Link>
          </div>

          {/* ── MegaBot Antique Deep Dive ── */}
          {megaBotLoading && (
            <div style={{
              marginTop: "1.5rem",
              background: `linear-gradient(135deg, rgba(251,191,36,0.04), rgba(217,119,6,0.04))`,
              border: `1px solid ${GOLD_BORDER}`,
              borderRadius: "1rem", padding: "2rem 1rem", textAlign: "center",
              backdropFilter: "blur(12px)",
            }}>
              <div style={{ fontSize: "2rem", marginBottom: "0.75rem", animation: "pulse 1.5s ease-in-out infinite" }}>🏺</div>
              <p style={{ fontSize: "0.85rem", color: GOLD, fontWeight: 600 }}>4 AI antique specialists working...</p>
              <p style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginTop: "0.3rem" }}>OpenAI, Claude, Gemini, and Grok analyzing authenticity, history, and value in parallel</p>
            </div>
          )}

          {!megaBotLoading && !megaBotData && (
            <div style={{
              marginTop: "1.5rem",
              background: `linear-gradient(135deg, rgba(251,191,36,0.04), rgba(217,119,6,0.04))`,
              border: `1px solid ${GOLD_BORDER}`,
              borderRadius: "1rem", padding: "1.25rem",
              backdropFilter: "blur(12px)",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.75rem" }}>
                <span style={{ fontSize: "1rem" }}>⚡</span>
                <span style={{ fontSize: "0.75rem", fontWeight: 700, color: GOLD, textTransform: "uppercase", letterSpacing: "0.06em" }}>MegaBot Antique Deep Dive</span>
              </div>
              <div style={{ textAlign: "center", padding: "1rem 0.5rem" }}>
                <p style={{ fontSize: "0.78rem", color: "var(--text-secondary)", lineHeight: 1.5, marginBottom: "0.75rem" }}>
                  Run 4 AI antique experts in parallel — OpenAI grades authenticity, Claude researches provenance and craftsmanship, Gemini tracks auction trends, and Grok surfaces collector community demand.
                </p>
                <button onClick={runMegaAntiqueBot} style={{
                  padding: "0.55rem 1.3rem", fontSize: "0.8rem", borderRadius: "0.5rem", fontWeight: 700,
                  background: `linear-gradient(135deg, ${GOLD}30, ${GOLD_DARK}40)`,
                  border: `1px solid ${GOLD}55`, color: GOLD, cursor: "pointer",
                }}>
                  ⚡ Run MegaBot Antique Analysis — 3 credits
                </button>
              </div>
            </div>
          )}

          {!megaBotLoading && megaBotData && (() => {
            const providers: any[] = megaBotData.providers || [];
            const successful = providers.filter((p: any) => !p.error);
            const failed = providers.filter((p: any) => p.error);
            const agreeRaw = megaBotData.agreementScore || megaBotData.agreement || 0.85;
            const agree = Math.round(agreeRaw > 1 ? agreeRaw : agreeRaw * 100);
            const allAntique = successful.map((p: any) => extractMegaAntique(p));
            const totalSections = allAntique.reduce((s: number, h: any) => s + h.sectionCount, 0);
            const totalComps = allAntique.reduce((s: number, h: any) => s + h.comparables.length, 0);

            return (
              <div style={{
                marginTop: "1.5rem",
                background: `linear-gradient(135deg, rgba(251,191,36,0.06), rgba(217,119,6,0.04))`,
                border: `1px solid ${GOLD}30`,
                borderRadius: "1rem", padding: "1.25rem",
                backdropFilter: "blur(12px)",
              }}>
                {/* Header */}
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
                  <span style={{ fontSize: "1.1rem" }}>⚡</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "0.78rem", fontWeight: 700, color: GOLD, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      MegaBot Antique Deep Dive — {successful.length} AI Experts
                    </div>
                    <div style={{ fontSize: "0.65rem", color: "var(--text-muted)" }}>
                      {totalSections} analysis sections · {totalComps} comparable results
                    </div>
                  </div>
                  <div style={{
                    padding: "0.2rem 0.6rem", borderRadius: 99,
                    background: agree >= 75 ? "rgba(76,175,80,0.15)" : "rgba(255,152,0,0.15)",
                    color: agree >= 75 ? "#4caf50" : "#ff9800",
                    fontSize: "0.72rem", fontWeight: 700,
                  }}>
                    {agree}%
                  </div>
                </div>

                {/* Agreement bar */}
                <div style={{ marginBottom: "0.75rem" }}>
                  <div style={{ height: 5, borderRadius: 99, background: "var(--ghost-bg)", overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${agree}%`, borderRadius: 99, background: agree >= 80 ? "#4caf50" : agree >= 60 ? "#ff9800" : "#ef4444" }} />
                  </div>
                </div>

                {/* Agent cards */}
                <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem", marginBottom: "0.75rem" }}>
                  {successful.map((p: any, idx: number) => {
                    const pm = MEGA_PROVIDER_META[p.provider] || { icon: "🤖", label: p.provider, color: "#888", specialty: "" };
                    const isExp = megaBotExpanded === p.provider;
                    const ma = allAntique[idx];
                    const timeStr = (p.durationMs || p.responseTime) ? `${((p.durationMs || p.responseTime) / 1000).toFixed(1)}s` : "";

                    return (
                      <div key={p.provider} style={{
                        background: isExp ? "var(--ghost-bg)" : "var(--bg-card)",
                        borderTop: isExp ? `3px solid ${pm.color}` : undefined,
                        border: `1px solid ${isExp ? `${pm.color}30` : "var(--border-default)"}`,
                        borderRadius: "0.5rem", overflow: "hidden",
                      }}>
                        {/* Collapsed one-liner */}
                        <button
                          onClick={() => setMegaBotExpanded(isExp ? null : p.provider)}
                          style={{ width: "100%", display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.55rem 0.65rem", background: "transparent", border: "none", cursor: "pointer", textAlign: "left" }}
                        >
                          <span style={{ fontSize: "0.85rem" }}>{pm.icon}</span>
                          <span style={{ fontWeight: 700, fontSize: "0.72rem", color: pm.color, minWidth: 52 }}>{pm.label}</span>
                          <span style={{ fontSize: "0.68rem", color: "var(--text-secondary)", flex: 1, overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>
                            {ma.verdict || "Analyzing"}
                            {ma.era ? ` · ${ma.era}` : ""}
                            {ma.fmvLow != null && ma.fmvHigh != null ? ` · ${_fmtPrice(ma.fmvLow)}-${_fmtPrice(ma.fmvHigh)}` : ""}
                            {ma.confidence ? ` · ${ma.confidence}%` : ""}
                          </span>
                          <span style={{ fontSize: "0.6rem", color: "#4caf50" }}>✅ {timeStr}</span>
                          <span style={{ fontSize: "0.6rem", color: "var(--text-muted)", transform: isExp ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>▾</span>
                        </button>

                        {/* Expanded details */}
                        {isExp && (
                          <div style={{ padding: "0 0.75rem 0.75rem", borderTop: `1px solid ${pm.color}15` }}>
                            {/* Authentication */}
                            {ma.auth && (
                              <div style={{ marginTop: "0.5rem", marginBottom: "0.5rem", padding: "0.5rem 0.6rem", background: "var(--bg-card)", borderRadius: "0.5rem", border: "1px solid var(--border-default)" }}>
                                <div style={{ fontSize: "0.55rem", textTransform: "uppercase", letterSpacing: "0.1em", color: pm.color, fontWeight: 700, marginBottom: "0.3rem" }}>Authentication</div>
                                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap", marginBottom: "0.3rem" }}>
                                  <span style={{ fontSize: "1rem" }}>
                                    {ma.verdict === "Authentic" || ma.verdict === "Likely Authentic" ? "✅" : ma.verdict === "Uncertain" ? "⚠️" : "❌"}
                                  </span>
                                  <span style={{ fontSize: "0.82rem", fontWeight: 800, color: "var(--text-primary)" }}>{ma.verdict}</span>
                                  {ma.confidence && (
                                    <span style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>Confidence: {ma.confidence}%</span>
                                  )}
                                </div>
                                {ma.auth.reasoning && (
                                  <p style={{ fontSize: "0.68rem", color: "var(--text-secondary)", margin: 0, lineHeight: 1.4 }}>
                                    {typeof ma.auth.reasoning === "string" && ma.auth.reasoning.length > 200 ? ma.auth.reasoning.slice(0, 200) + "..." : ma.auth.reasoning}
                                  </p>
                                )}
                                {Array.isArray(ma.auth.positive_indicators) && ma.auth.positive_indicators.length > 0 && (
                                  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.25rem", marginTop: "0.3rem" }}>
                                    {ma.auth.positive_indicators.slice(0, 5).map((ind: string, i: number) => (
                                      <span key={i} style={{ padding: "0.12rem 0.4rem", borderRadius: "9999px", fontSize: "0.58rem", fontWeight: 600, background: "rgba(22,163,74,0.1)", color: "#16a34a", border: "1px solid rgba(22,163,74,0.2)" }}>{ind}</span>
                                    ))}
                                  </div>
                                )}
                                {Array.isArray(ma.auth.red_flags) && ma.auth.red_flags.length > 0 && (
                                  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.25rem", marginTop: "0.25rem" }}>
                                    {ma.auth.red_flags.slice(0, 5).map((flag: string, i: number) => (
                                      <span key={i} style={{ padding: "0.12rem 0.4rem", borderRadius: "9999px", fontSize: "0.58rem", fontWeight: 600, background: "rgba(220,38,38,0.1)", color: "#dc2626", border: "1px solid rgba(220,38,38,0.2)" }}>{flag}</span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Era / Period & Maker */}
                            {ma.hist && (
                              <div style={{ marginBottom: "0.5rem", padding: "0.5rem 0.6rem", background: "var(--bg-card)", borderRadius: "0.5rem", border: "1px solid var(--border-default)" }}>
                                <div style={{ fontSize: "0.55rem", textTransform: "uppercase", letterSpacing: "0.1em", color: pm.color, fontWeight: 700, marginBottom: "0.3rem" }}>Historical Research</div>
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.35rem", marginBottom: "0.3rem" }}>
                                  {[
                                    { label: "Era/Period", value: ma.era },
                                    { label: "Maker", value: ma.maker },
                                    { label: "Origin", value: ma.hist.origin || ma.hist.country_of_origin },
                                    { label: "Style", value: ma.hist.style || ma.hist.style_movement },
                                  ].filter((d) => d.value).map((d) => (
                                    <div key={d.label} style={{ background: "var(--bg-card)", border: "1px solid var(--border-default)", borderRadius: "0.35rem", padding: "0.3rem 0.4rem" }}>
                                      <div style={{ fontSize: "0.48rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-muted)" }}>{d.label}</div>
                                      <div style={{ fontSize: "0.7rem", fontWeight: 600, color: "var(--text-primary)", marginTop: "0.05rem" }}>{d.value}</div>
                                    </div>
                                  ))}
                                </div>
                                {ma.hist.era_overview && (
                                  <p style={{ fontSize: "0.65rem", color: "var(--text-secondary)", margin: 0, lineHeight: 1.3 }}>
                                    {typeof ma.hist.era_overview === "string" && ma.hist.era_overview.length > 180 ? ma.hist.era_overview.slice(0, 180) + "..." : ma.hist.era_overview}
                                  </p>
                                )}
                              </div>
                            )}

                            {/* Condition: original vs restored */}
                            {ma.cond && (
                              <div style={{ marginBottom: "0.5rem", padding: "0.5rem 0.6rem", background: "var(--bg-card)", borderRadius: "0.5rem", border: "1px solid var(--border-default)" }}>
                                <div style={{ fontSize: "0.55rem", textTransform: "uppercase", letterSpacing: "0.1em", color: pm.color, fontWeight: 700, marginBottom: "0.3rem" }}>Condition Deep Dive</div>
                                <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "0.3rem" }}>
                                  {ma.condGrade && (
                                    <div style={{ padding: "0.2rem 0.5rem", borderRadius: "0.35rem", background: `${GOLD}12`, border: `1px solid ${GOLD}30`, fontSize: "0.72rem", fontWeight: 700, color: GOLD }}>
                                      Grade: {ma.condGrade}
                                    </div>
                                  )}
                                  {ma.originalPct != null && (
                                    <div style={{ padding: "0.2rem 0.5rem", borderRadius: "0.35rem", background: "rgba(22,163,74,0.1)", border: "1px solid rgba(22,163,74,0.2)", fontSize: "0.68rem", fontWeight: 600, color: "#16a34a" }}>
                                      Original: {ma.originalPct}%
                                    </div>
                                  )}
                                  {ma.restoredPct != null && (
                                    <div style={{ padding: "0.2rem 0.5rem", borderRadius: "0.35rem", background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.2)", fontSize: "0.68rem", fontWeight: 600, color: "#f59e0b" }}>
                                      Restored: {ma.restoredPct}%
                                    </div>
                                  )}
                                  {ma.cond.restoration_detected != null && (
                                    <div style={{ padding: "0.2rem 0.5rem", borderRadius: "0.35rem", background: "var(--ghost-bg)", border: "1px solid var(--border-default)", fontSize: "0.65rem", color: "var(--text-muted)" }}>
                                      Restoration: {ma.cond.restoration_detected ? "Detected" : "None found"}
                                    </div>
                                  )}
                                </div>
                                {ma.cond.condition_impact_on_value && (
                                  <p style={{ fontSize: "0.65rem", color: "var(--text-secondary)", margin: 0, lineHeight: 1.3 }}>{ma.cond.condition_impact_on_value}</p>
                                )}
                              </div>
                            )}

                            {/* Valuation */}
                            {ma.val && (
                              <div style={{ marginBottom: "0.5rem", padding: "0.5rem 0.6rem", background: "var(--bg-card)", borderRadius: "0.5rem", border: "1px solid var(--border-default)" }}>
                                <div style={{ fontSize: "0.55rem", textTransform: "uppercase", letterSpacing: "0.1em", color: pm.color, fontWeight: 700, marginBottom: "0.3rem" }}>Valuation</div>
                                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.35rem", marginBottom: "0.3rem" }}>
                                  {[
                                    { label: "Fair Market Low", value: ma.fmvLow },
                                    { label: "Fair Market High", value: ma.fmvHigh, highlight: true },
                                    { label: "Insurance", value: ma.insuranceVal },
                                  ].filter((v) => v.value != null).map((v) => (
                                    <div key={v.label} style={{
                                      background: v.highlight ? `${GOLD}12` : "var(--bg-card)",
                                      border: `1px solid ${v.highlight ? `${GOLD}30` : "var(--border-default)"}`,
                                      borderRadius: "0.35rem", padding: "0.3rem 0.4rem", textAlign: "center",
                                    }}>
                                      <div style={{ fontSize: "0.48rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-muted)" }}>{v.label}</div>
                                      <div style={{ fontSize: "0.82rem", fontWeight: 800, color: v.highlight ? GOLD : "var(--text-primary)", marginTop: "0.05rem" }}>
                                        {_fmtPrice(v.value)}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                                {ma.auctionEst && (
                                  <div style={{ padding: "0.3rem 0.4rem", background: `${GOLD}08`, borderRadius: "0.35rem", borderLeft: `3px solid ${GOLD}50`, marginBottom: "0.2rem" }}>
                                    <div style={{ fontSize: "0.5rem", fontWeight: 700, color: GOLD, textTransform: "uppercase", marginBottom: "0.1rem" }}>Auction Estimate</div>
                                    <div style={{ fontSize: "0.75rem", fontWeight: 800, color: GOLD }}>
                                      {_fmtRange(ma.auctionEst)}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Comparable auction results */}
                            {ma.comparables.length > 0 && (
                              <div style={{ marginBottom: "0.5rem", padding: "0.5rem 0.6rem", background: "var(--bg-card)", borderRadius: "0.5rem", border: "1px solid var(--border-default)" }}>
                                <div style={{ fontSize: "0.55rem", textTransform: "uppercase", letterSpacing: "0.1em", color: pm.color, fontWeight: 700, marginBottom: "0.3rem" }}>Comparable Auction Results</div>
                                {ma.comparables.slice(0, 5).map((c: any, i: number) => (
                                  <div key={i} style={{ padding: "0.3rem 0", borderBottom: i < Math.min(ma.comparables.length, 5) - 1 ? "1px solid var(--border-default)" : "none", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <div>
                                      <div style={{ fontSize: "0.68rem", fontWeight: 600, color: "var(--text-primary)" }}>{c.house || c.auction_house || "Auction"}</div>
                                      <div style={{ fontSize: "0.6rem", color: "var(--text-muted)" }}>{c.item || c.description || ""} · {c.date || ""}</div>
                                    </div>
                                    <div style={{ textAlign: "right" }}>
                                      <div style={{ fontSize: "0.72rem", fontWeight: 700, color: GOLD }}>{c.realized || c.price || c.sold_for || ""}</div>
                                      {c.estimate && <div style={{ fontSize: "0.55rem", color: "var(--text-muted)" }}>Est: {c.estimate}</div>}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Collector Market + Strategy + Certificates */}
                            {(ma.market || ma.strategy || ma.certs) && (
                              <div style={{ marginBottom: "0.5rem", padding: "0.5rem 0.6rem", background: `linear-gradient(135deg, ${GOLD}04, rgba(217,119,6,0.02))`, borderRadius: "0.5rem", border: `1px solid ${GOLD}15` }}>
                                <div style={{ fontSize: "0.55rem", textTransform: "uppercase", letterSpacing: "0.1em", color: GOLD, fontWeight: 700, marginBottom: "0.35rem" }}>Deep Antique Intelligence</div>
                                <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
                                  {ma.market?.collector_demand && (
                                    <div style={{ fontSize: "0.62rem", color: "var(--text-secondary)" }}>🏛️ Collector Demand: <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>{ma.market.collector_demand}</span></div>
                                  )}
                                  {ma.market?.market_outlook && (
                                    <div style={{ fontSize: "0.62rem", color: "var(--text-secondary)" }}>📊 Market: {typeof ma.market.market_outlook === "string" && ma.market.market_outlook.length > 120 ? ma.market.market_outlook.slice(0, 120) + "..." : ma.market.market_outlook}</div>
                                  )}
                                  {ma.strategy?.best_venue && (
                                    <div style={{ fontSize: "0.62rem", color: "var(--text-secondary)" }}>🏪 Best Venue: <span style={{ fontWeight: 600, color: GOLD }}>{ma.strategy.best_venue}</span></div>
                                  )}
                                  {ma.strategy?.timing && (
                                    <div style={{ fontSize: "0.62rem", color: "var(--text-secondary)" }}>⏰ Timing: {ma.strategy.timing}</div>
                                  )}
                                  {ma.certs && (
                                    <div style={{ fontSize: "0.62rem", color: "var(--text-secondary)" }}>
                                      📋 Documentation: {ma.certs.recommended_certifications?.join(", ") || ma.certs.appraisal_needed || "Review recommended"}
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Key insight */}
                            {ma.summary && (
                              <div style={{ padding: "0.4rem 0.6rem", background: `${pm.color}08`, borderRadius: "0.4rem", borderLeft: `3px solid ${pm.color}50` }}>
                                <div style={{ fontSize: "0.55rem", textTransform: "uppercase", letterSpacing: "0.1em", color: pm.color, fontWeight: 700, marginBottom: "0.15rem" }}>{pm.icon} What {pm.label} Found</div>
                                <p style={{ fontSize: "0.68rem", color: "var(--text-secondary)", margin: 0, lineHeight: 1.4, fontStyle: "italic" }}>
                                  &ldquo;{typeof ma.summary === "string" && ma.summary.length > 300 ? ma.summary.slice(0, 300) + "..." : ma.summary}&rdquo;
                                </p>
                              </div>
                            )}

                            <div style={{ fontSize: "0.55rem", color: "var(--text-muted)", fontStyle: "italic", marginTop: "0.35rem" }}>
                              {pm.icon} {pm.label}: {pm.specialty}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {failed.map((p: any) => {
                    const pm = MEGA_PROVIDER_META[p.provider] || { icon: "🤖", label: p.provider, color: "#888", specialty: "" };
                    return (
                      <div key={p.provider} style={{ display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.35rem 0.5rem", opacity: 0.6, background: "rgba(239,68,68,0.04)", border: "1px solid rgba(239,68,68,0.1)", borderRadius: "0.4rem", fontSize: "0.65rem" }}>
                        <span>{pm.icon}</span>
                        <span style={{ fontWeight: 600, color: pm.color }}>{pm.label}</span>
                        <span style={{ color: "#ef4444", flex: 1 }}>❌ {(p.error || "").slice(0, 60)}</span>
                      </div>
                    );
                  })}
                </div>

                {/* Comparison */}
                {successful.length > 1 && (
                  <div style={{ marginBottom: "0.5rem", padding: "0.5rem 0.75rem", background: "var(--bg-card)", borderRadius: "0.5rem", border: "1px solid var(--border-default)" }}>
                    <div style={{ fontSize: "0.55rem", textTransform: "uppercase", letterSpacing: "0.1em", color: GOLD, fontWeight: 700, marginBottom: "0.3rem" }}>Antique Intelligence Comparison</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.15rem", fontSize: "0.7rem" }}>
                      {successful.map((p: any, i: number) => {
                        const pm = MEGA_PROVIDER_META[p.provider];
                        const ma = allAntique[i];
                        return (
                          <span key={p.provider} style={{ color: pm?.color || "var(--text-secondary)" }}>
                            {pm?.icon} {pm?.label}: {ma.verdict || "—"} · {ma.era || "—"} · {ma.fmvLow != null && ma.fmvHigh != null ? `${_fmtPrice(ma.fmvLow)}-${_fmtPrice(ma.fmvHigh)}` : "—"} · {ma.sectionCount} sections
                          </span>
                        );
                      })}
                      <span style={{ fontSize: "0.65rem", fontWeight: 700, color: "#4caf50", marginTop: "0.1rem" }}>
                        ✅ Combined: {totalSections} analysis sections · {totalComps} comparable results
                      </span>
                    </div>
                  </div>
                )}

                {/* Summary */}
                <div style={{ background: `${GOLD}06`, borderLeft: `3px solid ${GOLD}40`, borderRadius: "0 0.5rem 0.5rem 0", padding: "0.65rem 0.85rem", marginBottom: "0.5rem" }}>
                  <div style={{ fontSize: "0.6rem", textTransform: "uppercase", letterSpacing: "0.1em", color: GOLD, fontWeight: 700, marginBottom: "0.3rem" }}>MegaBot Antique Summary</div>
                  <p style={{ fontSize: "0.78rem", lineHeight: 1.55, color: "var(--text-secondary)", margin: 0 }}>
                    {(() => {
                      const parts: string[] = [];
                      parts.push(`${successful.length} AI antique specialists analyzed this item across ${totalSections} categories with ${totalComps} comparable auction results.`);
                      if (agree >= 80) parts.push(`Strong consensus (${agree}%) on authentication and valuation.`);
                      for (let i = 0; i < successful.length && parts.length < 6; i++) {
                        const ma = allAntique[i];
                        const label = MEGA_PROVIDER_META[successful[i].provider]?.label || successful[i].provider;
                        if (ma.summary && typeof ma.summary === "string") {
                          const sentences = ma.summary.split(/(?<=[.!?])\s+/).slice(0, 1).join(" ");
                          if (sentences.length > 25) parts.push(`${label}: ${sentences}`);
                        }
                      }
                      return parts.join(" ");
                    })()}
                  </p>
                </div>

                {/* Re-run */}
                <div style={{ textAlign: "center" }}>
                  <button onClick={runMegaAntiqueBot} style={{
                    padding: "0.4rem 1rem", fontSize: "0.72rem", borderRadius: "0.4rem", fontWeight: 600,
                    background: `${GOLD}15`, border: `1px solid ${GOLD}35`, color: GOLD, cursor: "pointer",
                  }}>
                    Re-Run MegaBot — 3 cr
                  </button>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* Loading state */}
      {loading && selected && (
        <div style={{
          background: "var(--bg-card)", border: `1px solid ${GOLD_BORDER}`,
          borderRadius: "1rem",
        }}>
          <BotLoadingState botName="AntiqueBot" />
        </div>
      )}

      {/* No results placeholder */}
      {!result && selected && !loading && (
        <div style={{
          background: "var(--bg-card)", border: `1px solid ${GOLD_BORDER}`,
          borderRadius: "1rem", padding: "3rem", textAlign: "center",
        }}>
          <div style={{ fontSize: "3rem", marginBottom: "0.75rem" }}>🏺</div>
          <div style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.5rem" }}>Ready for Antique Deep-Dive</div>
          <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", maxWidth: 400, margin: "0 auto", lineHeight: 1.5 }}>
            Run AntiqueBot to get a full authentication assessment, historical context, collector market analysis, and expert selling strategy.
          </p>
        </div>
      )}

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}
