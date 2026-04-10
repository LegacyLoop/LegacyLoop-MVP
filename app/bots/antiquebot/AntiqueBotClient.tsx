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
  const [activeTab, setActiveTab] = useState<"authentication" | "identification" | "history" | "valuation" | "market" | "strategy" | "documentation">("authentication");
  const [megaBotData, setMegaBotData] = useState<any>(null);
  const [megaBotLoading, setMegaBotLoading] = useState(false);
  const [megaBotExpanded, setMegaBotExpanded] = useState<string | null>(null);
  const [resultAge, setResultAge] = useState<string | null>(null);
  const [resultFresh, setResultFresh] = useState(true);
  const [showAllItems, setShowAllItems] = useState(false);
  const [reportCopied, setReportCopied] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [expandedStat, setExpandedStat] = useState<string | null>(null);

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
      if (item.antiqueBotRunAt) {
        const hours = Math.round((Date.now() - new Date(item.antiqueBotRunAt).getTime()) / 3600000);
        setResultAge(hours < 1 ? "Just now" : hours < 24 ? `${hours}h ago` : `${Math.round(hours / 24)}d ago`);
        setResultFresh(hours < 72);
      }
    } else {
      setResult(null);
      setResultAge(null);
      // Try fetching from API
      fetch(`/api/bots/antiquebot/${selectedId}`)
        .then((r) => r.json())
        .then((d) => {
          if (d.hasResult) {
            setResult(d.result);
            if (d.createdAt) {
              const hours = Math.round((Date.now() - new Date(d.createdAt).getTime()) / 3600000);
              setResultAge(hours < 1 ? "Just now" : hours < 24 ? `${hours}h ago` : `${Math.round(hours / 24)}d ago`);
              setResultFresh(hours < 72);
            }
          }
        })
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
    <div style={{ paddingBottom: selectedId ? "5rem" : "0" }}>
      {toast && <Toast message={toast} />}

      {/* ── Section A: Stats Banner (clickable) ── */}
      {(() => {
        const appraisedItems = items.filter((i) => i.antiqueBotResult);
        const valItems = analyzedItems.filter(i => i.valuationMid);
        const totalVal = valItems.reduce((a, b) => a + (b.valuationMid ?? 0), 0);
        const statPanels = [
          { key: "total", label: "Total Items", value: items.length, icon: "📦" },
          { key: "analyzed", label: "Analyzed", value: analyzedItems.length, icon: "🧠" },
          { key: "antiques", label: "Antiques Found", value: antiqueItems.length, icon: "🏺" },
          { key: "appraised", label: "Appraised", value: appraisedItems.length, icon: "📋" },
        ];
        return (
          <div style={{ marginBottom: "1.5rem" }}>
            <div className="bot-4col-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.75rem" }}>
              {statPanels.map((s) => (
                <div
                  key={s.key}
                  onClick={() => setExpandedStat(expandedStat === s.key ? null : s.key)}
                  style={{
                    background: expandedStat === s.key ? `${GOLD}0F` : "var(--bg-card)",
                    border: expandedStat === s.key ? `2px solid ${GOLD}` : `1px solid ${GOLD_BORDER}`,
                    borderRadius: "0.75rem", padding: "0.85rem", textAlign: "center" as const,
                    boxShadow: expandedStat === s.key ? `0 4px 16px rgba(251,191,36,0.15)` : "0 1px 3px rgba(0,0,0,0.06)",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    transform: expandedStat === s.key ? "translateY(-2px)" : "none",
                    userSelect: "none" as const,
                  }}
                >
                  <div style={{ fontSize: "1.1rem", marginBottom: "0.15rem" }}>{s.icon}</div>
                  <div style={{ fontSize: "1.25rem", fontWeight: 800, color: GOLD }}>{s.value}</div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase" as const, letterSpacing: "0.08em" }}>
                    {s.label} <span style={{ fontSize: "0.5rem", opacity: 0.6 }}>{expandedStat === s.key ? "▲" : "▼"}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Expanded stat detail panel */}
            {expandedStat && (
              <div style={{
                marginTop: "0.75rem", padding: "1rem 1.25rem", borderRadius: "0.75rem",
                background: "var(--bg-card)", border: `1px solid ${GOLD_BORDER}`,
                boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
              }}>
                {expandedStat === "total" && (
                  <>
                    <div style={{ fontSize: "0.55rem", textTransform: "uppercase" as const, letterSpacing: "0.1em", color: GOLD, fontWeight: 700, marginBottom: "0.65rem" }}>All Items Overview</div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))", gap: "0.5rem", marginBottom: "0.75rem" }}>
                      {[
                        { l: "Analyzed", v: analyzedItems.length },
                        { l: "Not Analyzed", v: items.length - analyzedItems.length },
                        { l: "Antiques", v: antiqueItems.length },
                        { l: "Appraised", v: appraisedItems.length },
                      ].map(d => (
                        <div key={d.l} style={{ padding: "0.45rem 0.5rem", borderRadius: "0.5rem", background: `${GOLD}08`, textAlign: "center" as const }}>
                          <div style={{ fontSize: "1rem", fontWeight: 800, color: "var(--text-primary)" }}>{d.v}</div>
                          <div style={{ fontSize: "0.5rem", color: "var(--text-muted)", textTransform: "uppercase" as const, letterSpacing: "0.06em" }}>{d.l}</div>
                        </div>
                      ))}
                    </div>
                    <div style={{ maxHeight: "160px", overflowY: "auto" as const }}>
                      {items.slice(0, 12).map(it => (
                        <div key={it.id} onClick={() => { setSelectedId(it.id); setExpandedStat(null); }} style={{
                          display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.35rem 0.4rem",
                          borderBottom: "1px solid var(--border-default)", cursor: "pointer",
                        }}>
                          {it.photo && <img src={it.photo} alt="" style={{ width: 28, height: 28, borderRadius: 6, objectFit: "cover" as const }} />}
                          <span style={{ flex: 1, fontSize: "0.72rem", fontWeight: 600, color: "var(--text-primary)", overflow: "hidden", whiteSpace: "nowrap" as const, textOverflow: "ellipsis" }}>{it.title}</span>
                          <span style={{ fontSize: "0.62rem", color: "var(--text-muted)", flexShrink: 0 }}>{it.status}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {expandedStat === "analyzed" && (
                  <>
                    <div style={{ fontSize: "0.55rem", textTransform: "uppercase" as const, letterSpacing: "0.1em", color: GOLD, fontWeight: 700, marginBottom: "0.65rem" }}>Analyzed Items</div>
                    {analyzedItems.length === 0 ? (
                      <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", margin: 0 }}>No analyzed items yet. Go to your dashboard to analyze items.</p>
                    ) : (
                      <div style={{ maxHeight: "200px", overflowY: "auto" as const }}>
                        {analyzedItems.map(it => (
                          <div key={it.id} onClick={() => { setSelectedId(it.id); setExpandedStat(null); }} style={{
                            display: "flex", alignItems: "center", gap: "0.65rem", padding: "0.45rem 0.4rem",
                            borderBottom: "1px solid var(--border-default)", cursor: "pointer",
                          }}>
                            {it.photo && <img src={it.photo} alt="" style={{ width: 32, height: 32, borderRadius: 8, objectFit: "cover" as const }} />}
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-primary)", overflow: "hidden", whiteSpace: "nowrap" as const, textOverflow: "ellipsis" }}>{it.title}</div>
                              <div style={{ fontSize: "0.6rem", color: "var(--text-muted)" }}>{it.category}{it.era ? ` · ${it.era}` : ""}</div>
                            </div>
                            {it.valuationMid && <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "#10b981", flexShrink: 0 }}>${it.valuationMid.toLocaleString()}</span>}
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}

                {expandedStat === "antiques" && (
                  <>
                    <div style={{ fontSize: "0.55rem", textTransform: "uppercase" as const, letterSpacing: "0.1em", color: GOLD, fontWeight: 700, marginBottom: "0.65rem" }}>Detected Antiques</div>
                    {antiqueItems.length === 0 ? (
                      <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", margin: 0 }}>No antiques detected yet. Run analysis on your items first.</p>
                    ) : (
                      <div style={{ maxHeight: "200px", overflowY: "auto" as const }}>
                        {antiqueItems.map(it => (
                          <div key={it.id} onClick={() => { setSelectedId(it.id); setExpandedStat(null); }} style={{
                            display: "flex", alignItems: "center", gap: "0.65rem", padding: "0.45rem 0.4rem",
                            borderBottom: "1px solid var(--border-default)", cursor: "pointer",
                          }}>
                            {it.photo && <img src={it.photo} alt="" style={{ width: 32, height: 32, borderRadius: 8, objectFit: "cover" as const }} />}
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-primary)", overflow: "hidden", whiteSpace: "nowrap" as const, textOverflow: "ellipsis" }}>{it.title}</div>
                              <div style={{ fontSize: "0.6rem", color: "var(--text-muted)" }}>{it.era || it.maker || it.category}</div>
                            </div>
                            {it.antique?.auctionLow != null && it.antique?.auctionHigh != null && (
                              <span style={{ fontSize: "0.72rem", fontWeight: 700, color: GOLD, flexShrink: 0 }}>
                                ${it.antique.auctionLow.toLocaleString()}-${it.antique.auctionHigh.toLocaleString()}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}

                {expandedStat === "appraised" && (
                  <>
                    <div style={{ fontSize: "0.55rem", textTransform: "uppercase" as const, letterSpacing: "0.1em", color: GOLD, fontWeight: 700, marginBottom: "0.65rem" }}>AntiqueBot Appraised Items</div>
                    {appraisedItems.length === 0 ? (
                      <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", margin: 0 }}>No items appraised yet. Select an item and run AntiqueBot.</p>
                    ) : (
                      <div style={{ maxHeight: "200px", overflowY: "auto" as const }}>
                        {appraisedItems.map(it => {
                          const abr = safeJson(it.antiqueBotResult);
                          const fmv = abr?.valuation?.fair_market_value;
                          const fmvMid = fmv ? _extractPrice(fmv.mid) ?? _extractPrice(fmv.high) : null;
                          return (
                            <div key={it.id} onClick={() => { setSelectedId(it.id); setExpandedStat(null); }} style={{
                              display: "flex", alignItems: "center", gap: "0.65rem", padding: "0.45rem 0.4rem",
                              borderBottom: "1px solid var(--border-default)", cursor: "pointer",
                            }}>
                              {it.photo && <img src={it.photo} alt="" style={{ width: 32, height: 32, borderRadius: 8, objectFit: "cover" as const }} />}
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-primary)", overflow: "hidden", whiteSpace: "nowrap" as const, textOverflow: "ellipsis" }}>{it.title}</div>
                                <div style={{ fontSize: "0.6rem", color: "var(--text-muted)" }}>
                                  Appraised{it.antiqueBotRunAt ? ` ${new Date(it.antiqueBotRunAt).toLocaleDateString()}` : ""}
                                </div>
                              </div>
                              {fmvMid != null && <span style={{ fontSize: "0.78rem", fontWeight: 700, color: GOLD, flexShrink: 0 }}>${Math.round(fmvMid).toLocaleString()}</span>}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        );
      })()}

      {/* ── Section B: Item Selector ── */}
      <div style={{
        background: "var(--bg-card)", border: `1px solid ${GOLD_BORDER}`,
        borderRadius: "1rem", padding: "1.25rem", marginBottom: "1.5rem",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem" }}>
          <div style={{ fontSize: "0.65rem", fontWeight: 700, color: GOLD, textTransform: "uppercase", letterSpacing: "0.1em" }}>
            {antiqueItems.length > 0 ? `Antiques Detected (${antiqueItems.length})` : "Select Item for Antique Appraisal"}
          </div>
          {antiqueItems.length > 0 && analyzedItems.length > antiqueItems.length && (
            <button
              onClick={() => setShowAllItems(!showAllItems)}
              style={{
                background: "transparent", border: `1px solid ${GOLD_BORDER}`, borderRadius: "0.4rem",
                padding: "0.25rem 0.65rem", fontSize: "0.62rem", fontWeight: 600,
                color: showAllItems ? GOLD : "var(--text-muted)", cursor: "pointer",
              }}
            >
              {showAllItems ? "Show Antiques Only" : `Show All Items (${analyzedItems.length})`}
            </button>
          )}
        </div>

        {/* Antique items — always shown first */}
        {antiqueItems.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "0.5rem", marginBottom: showAllItems ? "0.75rem" : 0 }}>
            {antiqueItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setSelectedId(item.id)}
                style={{
                  display: "flex", alignItems: "center", gap: "0.5rem",
                  padding: "0.5rem 0.65rem", borderRadius: "0.5rem",
                  background: selectedId === item.id ? `${GOLD}15` : "var(--bg-card)",
                  borderTop: `1.5px solid ${selectedId === item.id ? GOLD : GOLD_BORDER}`,
                  borderRight: `1.5px solid ${selectedId === item.id ? GOLD : GOLD_BORDER}`,
                  borderBottom: `1.5px solid ${selectedId === item.id ? GOLD : GOLD_BORDER}`,
                  borderLeft: `3px solid ${GOLD}`,
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
                  <div style={{ fontSize: "0.55rem", color: GOLD }}>
                    🏺 Antique{item.antiqueBotResult ? " · ✅ Appraised" : ""}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Separator when showing all */}
        {showAllItems && antiqueItems.length > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
            <div style={{ flex: 1, height: "1px", background: "var(--border-default)" }} />
            <span style={{ fontSize: "0.55rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Other Analyzed Items</span>
            <div style={{ flex: 1, height: "1px", background: "var(--border-default)" }} />
          </div>
        )}

        {/* Non-antique analyzed items — only shown when toggled or when no antiques exist */}
        {(showAllItems || antiqueItems.length === 0) && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "0.5rem" }}>
            {analyzedItems.filter((i) => !i.antique?.isAntique).map((item) => (
              <button
                key={item.id}
                onClick={() => setSelectedId(item.id)}
                style={{
                  display: "flex", alignItems: "center", gap: "0.5rem",
                  padding: "0.5rem 0.65rem", borderRadius: "0.5rem",
                  background: selectedId === item.id ? `${GOLD}15` : "var(--bg-card)",
                  border: `1.5px solid ${selectedId === item.id ? GOLD : "var(--border-default)"}`,
                  cursor: "pointer", textAlign: "left", color: "inherit", width: "100%",
                  transition: "border-color 0.15s ease", opacity: 0.75,
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
                    {item.era || item.category}{item.antiqueBotResult ? " · ✅ Appraised" : ""}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

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
          {resultAge && result && (
            <div style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
              <span style={{
                padding: "0.2rem 0.5rem", borderRadius: "9999px", fontSize: "0.62rem", fontWeight: 600,
                background: resultFresh ? "rgba(22,163,74,0.1)" : "rgba(245,158,11,0.1)",
                color: resultFresh ? "#16a34a" : "#f59e0b",
                border: `1px solid ${resultFresh ? "rgba(22,163,74,0.2)" : "rgba(245,158,11,0.2)"}`,
              }}>
                {resultFresh ? "✅ Fresh" : "⚠️ Consider re-running"} · {resultAge}
              </span>
            </div>
          )}
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
          {/* Authentication Verdict Hero + Confidence Meter */}
          {auth && (() => {
            const conf = typeof auth.confidence === "number" ? auth.confidence : parseInt(auth.confidence) || 0;
            const isPositive = auth.verdict === "Authentic" || auth.verdict === "Likely Authentic";
            const isUncertain = auth.verdict === "Uncertain";
            const gradientColor = isPositive ? "#16a34a" : isUncertain ? "#d97706" : "#dc2626";
            const gradientEnd = isPositive ? "#22c55e" : isUncertain ? "#fbbf24" : "#f87171";
            const confColor = conf >= 80 ? "#22c55e" : conf >= 50 ? GOLD : "#ef4444";
            // SVG arc params
            const arcRadius = 42;
            const arcStroke = 6;
            const arcCirc = 2 * Math.PI * arcRadius;
            const arcDash = (conf / 100) * arcCirc * 0.75; // 270-degree arc
            const arcGap = arcCirc - arcDash;
            return (
              <div style={{
                borderRadius: "1rem", padding: "3px", marginBottom: "1.5rem",
                background: `linear-gradient(135deg, ${gradientColor}, ${gradientEnd})`,
                boxShadow: `0 0 24px ${gradientColor}4d`,
              }}>
                <div style={{ background: "var(--bg-card)", borderRadius: "calc(1rem - 3px)", padding: "1.5rem 2rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
                    {/* Confidence Meter — SVG arc */}
                    <div style={{ position: "relative", width: 96, height: 96, flexShrink: 0 }}>
                      <svg viewBox="0 0 100 100" style={{ width: "100%", height: "100%", transform: "rotate(135deg)" }}>
                        <circle cx="50" cy="50" r={arcRadius} fill="none" stroke="var(--border-default)" strokeWidth={arcStroke}
                          strokeDasharray={`${arcCirc * 0.75} ${arcCirc * 0.25}`} strokeLinecap="round" />
                        <circle cx="50" cy="50" r={arcRadius} fill="none" stroke={confColor} strokeWidth={arcStroke}
                          strokeDasharray={`${arcDash} ${arcGap}`} strokeLinecap="round"
                          style={{ transition: "stroke-dasharray 0.6s ease" }} />
                      </svg>
                      <div style={{
                        position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -45%)",
                        textAlign: "center",
                      }}>
                        <div style={{ fontSize: "1.4rem", fontWeight: 800, color: confColor, lineHeight: 1 }}>{conf}%</div>
                        <div style={{ fontSize: "0.42rem", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)", marginTop: "0.1rem" }}>Confidence</div>
                      </div>
                    </div>

                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--text-muted)" }}>Authentication Verdict</div>
                      <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--text-primary)" }}>{auth.verdict}</div>
                      <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.3rem", flexWrap: "wrap" }}>
                        {isPositive && <span style={{ padding: "0.15rem 0.5rem", borderRadius: "9999px", fontSize: "0.6rem", fontWeight: 600, background: "rgba(22,163,74,0.1)", color: "#16a34a", border: "1px solid rgba(22,163,74,0.2)" }}>✅ Passes Authentication</span>}
                        {isUncertain && <span style={{ padding: "0.15rem 0.5rem", borderRadius: "9999px", fontSize: "0.6rem", fontWeight: 600, background: "rgba(251,191,36,0.1)", color: "#d97706", border: "1px solid rgba(251,191,36,0.2)" }}>⚠️ Further Testing Needed</span>}
                        {!isPositive && !isUncertain && <span style={{ padding: "0.15rem 0.5rem", borderRadius: "9999px", fontSize: "0.6rem", fontWeight: 600, background: "rgba(220,38,38,0.1)", color: "#dc2626", border: "1px solid rgba(220,38,38,0.2)" }}>❌ Authentication Concern</span>}
                      </div>
                    </div>

                    {val?.fair_market_value && (
                      <div style={{ textAlign: "right", flexShrink: 0 }}>
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
            );
          })()}

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
              { key: "identification", label: "🏺 ID", show: !!ident },
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
              </div>
            )}

            {/* ── Identification Tab ── */}
            {activeTab === "identification" && ident && (
              <div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.65rem", marginBottom: "1rem" }}>
                  {[
                    { label: "Item Type", value: ident.item_type, icon: "📦" },
                    { label: "Period", value: ident.period, icon: "📅" },
                    { label: "Origin", value: ident.origin, icon: "🌍" },
                    { label: "Maker", value: typeof ident.maker_info === "object" ? ident.maker_info?.name : ident.maker_info, icon: "🔨" },
                    { label: "Material", value: typeof ident.material_analysis === "object" ? ident.material_analysis?.primary : ident.material_analysis, icon: "🪨" },
                    { label: "Style/Movement", value: ident.style_movement, icon: "🎨" },
                    { label: "Rarity", value: ident.rarity, icon: "💎" },
                    { label: "Markings", value: typeof ident.markings === "string" ? ident.markings : ident.markings?.description, icon: "🔍" },
                  ].filter((d) => d.value).map((d) => (
                    <div key={d.label} style={{
                      background: "var(--bg-card)", border: `1px solid ${GOLD_BORDER}`,
                      borderRadius: "0.65rem", padding: "0.65rem 0.85rem",
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.3rem", marginBottom: "0.2rem" }}>
                        <span style={{ fontSize: "0.7rem" }}>{d.icon}</span>
                        <span style={{ fontSize: "0.5rem", textTransform: "uppercase" as const, letterSpacing: "0.1em", color: "var(--text-muted)", fontWeight: 700 }}>{d.label}</span>
                      </div>
                      <div style={{ fontSize: "0.88rem", fontWeight: 600, color: "var(--text-primary)" }}>{d.value}</div>
                    </div>
                  ))}
                </div>
                {ident.maker_info && typeof ident.maker_info === "object" && (ident.maker_info.history || ident.maker_info.notable_works) && (
                  <div style={{ padding: "0.75rem", background: `${GOLD}06`, borderRadius: "0.5rem", borderLeft: `3px solid ${GOLD}` }}>
                    <div style={{ fontSize: "0.6rem", fontWeight: 700, color: GOLD, textTransform: "uppercase" as const, marginBottom: "0.3rem" }}>Maker Intelligence</div>
                    {ident.maker_info.history && (
                      <p style={{ fontSize: "0.78rem", color: "var(--text-secondary)", lineHeight: 1.5, margin: "0 0 0.3rem" }}>{ident.maker_info.history}</p>
                    )}
                    {ident.maker_info.notable_works && (
                      <p style={{ fontSize: "0.72rem", color: "var(--text-muted)", lineHeight: 1.4, margin: 0, fontStyle: "italic" as const }}>Notable: {ident.maker_info.notable_works}</p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ── History Tab ── */}
            {activeTab === "history" && hist && (
              <div style={{ display: "flex", flexDirection: "column" as const, gap: "1.25rem" }}>
                {/* Historical Era Timeline */}
                {(() => {
                  const eras = [
                    { label: "Pre-1700", range: "Ancient–1700", start: 1400, end: 1700, keywords: ["pre-1700", "17th", "16th", "15th", "baroque", "rococo", "renaissance", "medieval", "tudor", "jacobean", "cromwellian", "1600", "1650"] },
                    { label: "Georgian", range: "1700–1830", start: 1700, end: 1830, keywords: ["georgian", "federal", "colonial", "regency", "empire", "chippendale", "hepplewhite", "sheraton", "biedermeier", "queen anne", "william and mary", "adam", "1700", "1750", "1780", "1790", "1800", "1810", "1820"] },
                    { label: "Victorian", range: "1830–1900", start: 1830, end: 1900, keywords: ["victorian", "edwardian", "aesthetic", "arts and crafts", "arts & crafts", "eastlake", "renaissance revival", "gothic revival", "japonisme", "1840", "1850", "1860", "1870", "1880", "1890"] },
                    { label: "Art Nouveau", range: "1890–1920", start: 1890, end: 1920, keywords: ["art nouveau", "nouveau", "jugendstil", "tiffany", "mucha", "liberty", "1895", "1900", "1905", "1910"] },
                    { label: "Art Deco", range: "1920–1945", start: 1920, end: 1945, keywords: ["art deco", "deco", "streamline", "streamline moderne", "bauhaus", "modernist", "skyscraper", "1920", "1925", "1930", "1935", "1940"] },
                    { label: "Mid-Century", range: "1945–1975", start: 1945, end: 1975, keywords: ["mid-century", "mid century", "mcm", "danish modern", "eames", "atomic age", "space age", "brutalist", "1945", "1950", "1955", "1960", "1965", "1970"] },
                    { label: "Late 20th C.", range: "1975–2000", start: 1975, end: 2000, keywords: ["postmodern", "memphis", "1975", "1980", "1985", "1990", "1995", "late 20th"] },
                    { label: "Modern", range: "2000+", start: 2000, end: 2026, keywords: ["modern", "contemporary", "2000", "2005", "2010", "2015", "2020", "21st century"] },
                  ];
                  const searchText = `${ident?.period || ""} ${hist?.era_overview || ""} ${selected?.era || ""}`.toLowerCase();
                  const matchIdx = eras.findIndex((e) => e.keywords.some((kw) => searchText.includes(kw)));
                  return (
                    <div style={{ padding: "0.85rem", background: `${GOLD}04`, border: `1px solid ${GOLD_BORDER}`, borderRadius: "0.65rem", overflowX: "auto" as const }}>
                      <div style={{ display: "flex", alignItems: "flex-start", gap: 0, minWidth: "500px", position: "relative" as const }}>
                        {/* Connecting line */}
                        <div style={{ position: "absolute" as const, top: "6px", left: "10px", right: "10px", height: "2px", background: "var(--border-default)", zIndex: 0 }} />
                        {matchIdx >= 0 && <div style={{ position: "absolute" as const, top: "6px", left: "10px", width: `${(matchIdx / (eras.length - 1)) * 100}%`, height: "2px", background: GOLD, zIndex: 1 }} />}
                        {eras.map((era, i) => {
                          const matched = i === matchIdx;
                          return (
                            <div key={era.label} style={{ flex: 1, display: "flex", flexDirection: "column" as const, alignItems: "center", position: "relative" as const, zIndex: 2 }}>
                              <div style={{
                                width: matched ? "12px" : "8px", height: matched ? "12px" : "8px", borderRadius: "50%",
                                background: matched ? GOLD : "var(--border-default)",
                                boxShadow: matched ? `0 0 8px ${GOLD}60` : "none",
                                marginBottom: "0.3rem", flexShrink: 0,
                              }} />
                              <div style={{ fontSize: "0.58rem", fontWeight: matched ? 800 : 600, color: matched ? GOLD : "var(--text-muted)", textAlign: "center" as const, lineHeight: 1.2 }}>{era.label}</div>
                              <div style={{ fontSize: "0.45rem", color: matched ? GOLD : "var(--text-muted)", textAlign: "center" as const, marginTop: "0.1rem" }}>{era.range}</div>
                              {matched && <div style={{ fontSize: "0.45rem", fontWeight: 700, color: GOLD, marginTop: "0.2rem" }}>Your Item ↑</div>}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}

                {hist.era_overview && (
                  <div style={{ padding: "0.85rem", background: `${GOLD}06`, borderRadius: "0.65rem", borderLeft: `4px solid ${GOLD}` }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.4rem" }}>
                      <span style={{ fontSize: "1rem" }}>📅</span>
                      <span style={{ fontSize: "0.65rem", fontWeight: 700, color: GOLD, textTransform: "uppercase" as const, letterSpacing: "0.08em" }}>Era & Period</span>
                    </div>
                    <p style={{ fontSize: "0.88rem", color: "var(--text-secondary)", lineHeight: 1.7, margin: 0 }}>{hist.era_overview}</p>
                  </div>
                )}
                {hist.cultural_significance && (
                  <div style={{ padding: "0.85rem", background: "var(--bg-card)", borderRadius: "0.65rem", border: `1px solid ${GOLD_BORDER}` }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.4rem" }}>
                      <span style={{ fontSize: "1rem" }}>🏛️</span>
                      <span style={{ fontSize: "0.65rem", fontWeight: 700, color: GOLD, textTransform: "uppercase" as const, letterSpacing: "0.08em" }}>Cultural Significance</span>
                    </div>
                    <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", lineHeight: 1.6, margin: 0 }}>{hist.cultural_significance}</p>
                  </div>
                )}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                  {hist.production_history && (
                    <div style={{ padding: "0.75rem", background: "var(--bg-card)", borderRadius: "0.65rem", border: `1px solid ${GOLD_BORDER}` }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.3rem", marginBottom: "0.3rem" }}>
                        <span style={{ fontSize: "0.85rem" }}>🏭</span>
                        <span style={{ fontSize: "0.58rem", fontWeight: 700, color: GOLD, textTransform: "uppercase" as const, letterSpacing: "0.06em" }}>Production History</span>
                      </div>
                      <p style={{ fontSize: "0.78rem", color: "var(--text-secondary)", lineHeight: 1.5, margin: 0 }}>{hist.production_history}</p>
                    </div>
                  )}
                  {hist.notable_examples && (
                    <div style={{ padding: "0.75rem", background: "var(--bg-card)", borderRadius: "0.65rem", border: `1px solid ${GOLD_BORDER}` }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.3rem", marginBottom: "0.3rem" }}>
                        <span style={{ fontSize: "0.85rem" }}>⭐</span>
                        <span style={{ fontSize: "0.58rem", fontWeight: 700, color: GOLD, textTransform: "uppercase" as const, letterSpacing: "0.06em" }}>Notable Examples</span>
                      </div>
                      <p style={{ fontSize: "0.78rem", color: "var(--text-secondary)", lineHeight: 1.5, margin: 0 }}>{hist.notable_examples}</p>
                    </div>
                  )}
                </div>
                {cond && (() => {
                  // Derive sub-grades from overall condition data
                  const gradeMap: Record<string, number> = { "Mint": 10, "Excellent": 9, "Very Good": 7.5, "Good": 6, "Fair": 4.5, "Poor": 2.5 };
                  const baseScore = gradeMap[cond.overall_grade] || 6;
                  const hasRestoration = !!cond.restoration_detected;
                  const hasWear = cond.age_appropriate_wear === true || cond.age_appropriate_wear === "Normal" || cond.age_appropriate_wear === "Yes";
                  // Use AI sub-scores if available, otherwise derive from base
                  const subGrades = [
                    { label: "Structural Integrity", icon: "🏗️", score: cond.structural_score ?? Math.min(10, baseScore + (hasRestoration ? -0.5 : 0.5)), desc: "Frame, joints, and foundational stability" },
                    { label: "Surface Condition", icon: "✨", score: cond.surface_score ?? Math.min(10, baseScore + (hasWear ? -0.3 : 0.2)), desc: "Finish, paint, veneer, or surface treatment" },
                    { label: "Patina Quality", icon: "🎨", score: cond.patina_score ?? Math.min(10, baseScore + (hasWear ? 0.8 : -0.5)), desc: "Age-appropriate aging and character" },
                    { label: "Completeness", icon: "📦", score: cond.completeness_score ?? Math.min(10, baseScore + 0.3), desc: "All original parts, hardware, elements present" },
                    { label: "Mechanisms", icon: "⚙️", score: cond.mechanisms_score ?? Math.min(10, baseScore - 0.2), desc: "Moving parts, locks, hinges, drawers (if applicable)" },
                  ];
                  return (
                    <div style={{ padding: "0.85rem", background: "var(--bg-card)", borderRadius: "0.65rem", border: `1px solid ${GOLD_BORDER}` }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.65rem" }}>
                        <span style={{ fontSize: "1rem" }}>📋</span>
                        <span style={{ fontSize: "0.65rem", fontWeight: 700, color: GOLD, textTransform: "uppercase" as const, letterSpacing: "0.08em" }}>Condition Deep Dive</span>
                      </div>

                      {/* Overall grade hero */}
                      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.85rem", padding: "0.65rem 0.85rem", background: `${GOLD}08`, borderRadius: "0.5rem", border: `1px solid ${GOLD_BORDER}` }}>
                        <div style={{ textAlign: "center" as const }}>
                          <div style={{ fontSize: "1.5rem", fontWeight: 800, color: GOLD }}>{cond.overall_grade}</div>
                          <div style={{ fontSize: "0.48rem", textTransform: "uppercase" as const, letterSpacing: "0.1em", color: "var(--text-muted)", fontWeight: 700 }}>Overall Grade</div>
                        </div>
                        <div style={{ width: "1px", height: "2.5rem", background: GOLD_BORDER }} />
                        <div style={{ display: "flex", gap: "0.75rem", flex: 1, flexWrap: "wrap" as const }}>
                          <div style={{ textAlign: "center" as const }}>
                            <div style={{ fontSize: "0.82rem", fontWeight: 700, color: hasWear ? "#16a34a" : "var(--text-primary)" }}>
                              {hasWear ? "Normal" : typeof cond.age_appropriate_wear === "string" ? cond.age_appropriate_wear : "Unknown"}
                            </div>
                            <div style={{ fontSize: "0.42rem", textTransform: "uppercase" as const, letterSpacing: "0.08em", color: "var(--text-muted)" }}>Age Wear</div>
                          </div>
                          <div style={{ textAlign: "center" as const }}>
                            <div style={{ fontSize: "0.82rem", fontWeight: 700, color: hasRestoration ? "#f59e0b" : "#16a34a" }}>
                              {hasRestoration ? (typeof cond.restoration_detected === "string" ? cond.restoration_detected : "Detected") : "None"}
                            </div>
                            <div style={{ fontSize: "0.42rem", textTransform: "uppercase" as const, letterSpacing: "0.08em", color: "var(--text-muted)" }}>Restoration</div>
                          </div>
                        </div>
                      </div>

                      {/* Sub-grade bars */}
                      <div style={{ display: "flex", flexDirection: "column" as const, gap: "0.45rem", marginBottom: "0.75rem" }}>
                        {subGrades.map((sg) => {
                          const score = Math.max(0, Math.min(10, Math.round(sg.score * 10) / 10));
                          const pct = score * 10;
                          const barColor = score >= 8 ? "#22c55e" : score >= 6 ? GOLD : score >= 4 ? "#f59e0b" : "#ef4444";
                          return (
                            <div key={sg.label}>
                              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.15rem" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                                  <span style={{ fontSize: "0.7rem" }}>{sg.icon}</span>
                                  <span style={{ fontSize: "0.68rem", fontWeight: 600, color: "var(--text-primary)" }}>{sg.label}</span>
                                </div>
                                <span style={{ fontSize: "0.72rem", fontWeight: 700, color: barColor }}>{score}/10</span>
                              </div>
                              <div style={{ height: 6, borderRadius: 99, background: "var(--ghost-bg)", overflow: "hidden" }}>
                                <div style={{ height: "100%", width: `${pct}%`, borderRadius: 99, background: barColor, transition: "width 0.5s ease" }} />
                              </div>
                              <div style={{ fontSize: "0.52rem", color: "var(--text-muted)", marginTop: "0.05rem" }}>{sg.desc}</div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Restoration details */}
                      {cond.restoration_details && (
                        <div style={{ padding: "0.5rem 0.65rem", background: "rgba(245,158,11,0.04)", borderRadius: "0.4rem", borderLeft: "3px solid rgba(245,158,11,0.3)", marginBottom: "0.5rem" }}>
                          <div style={{ fontSize: "0.55rem", fontWeight: 700, color: "#f59e0b", textTransform: "uppercase" as const, marginBottom: "0.15rem" }}>Restoration Notes</div>
                          <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", lineHeight: 1.5, margin: 0 }}>{cond.restoration_details}</p>
                        </div>
                      )}

                      {/* Conservation tips */}
                      {cond.conservation_recommendations && (
                        <div style={{ padding: "0.5rem 0.65rem", background: "rgba(0,188,212,0.04)", borderRadius: "0.4rem", borderLeft: "3px solid rgba(0,188,212,0.3)", marginBottom: "0.5rem" }}>
                          <div style={{ fontSize: "0.55rem", fontWeight: 700, color: "#00bcd4", textTransform: "uppercase" as const, marginBottom: "0.15rem" }}>Conservation Tips</div>
                          {Array.isArray(cond.conservation_recommendations) ? (
                            <div style={{ display: "flex", flexDirection: "column" as const, gap: "0.15rem" }}>
                              {cond.conservation_recommendations.map((tip: string, i: number) => (
                                <div key={i} style={{ fontSize: "0.75rem", color: "var(--text-secondary)", lineHeight: 1.4 }}>• {tip}</div>
                              ))}
                            </div>
                          ) : (
                            <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", lineHeight: 1.5, margin: 0 }}>{cond.conservation_recommendations}</p>
                          )}
                        </div>
                      )}

                      {cond.condition_impact_on_value && (
                        <p style={{ fontSize: "0.78rem", color: "var(--text-secondary)", lineHeight: 1.5, margin: "0.25rem 0 0" }}>💰 {cond.condition_impact_on_value}</p>
                      )}
                    </div>
                  );
                })()}

                {/* Provenance Chain */}
                <div style={{ marginTop: "1.25rem" }}>
                  <div style={{ fontSize: "0.9375rem", fontWeight: 600, color: GOLD, marginBottom: "0.5rem" }}>Provenance Chain</div>
                  {result?.provenance_chain && (result.provenance_chain as any[]).length > 0 ? (
                    <div style={{ position: "relative" as const, paddingLeft: "1.25rem" }}>
                      <div style={{ position: "absolute" as const, left: "5px", top: 0, bottom: 0, width: "2px", background: GOLD_BORDER }} />
                      {(result.provenance_chain as any[]).map((entry: any, i: number) => (
                        <div key={i} style={{ position: "relative" as const, marginBottom: "0.75rem", paddingLeft: "0.75rem" }}>
                          <div style={{ position: "absolute" as const, left: "-1.25rem", top: "0.15rem", width: "10px", height: "10px", borderRadius: "50%", background: GOLD, border: `2px solid ${GOLD_BORDER}` }} />
                          <div style={{ fontSize: "0.875rem", fontWeight: 700, color: "var(--text-primary)" }}>{entry.period || "Unknown period"}</div>
                          <div style={{ fontSize: "0.8125rem", color: "var(--text-secondary)", marginTop: "0.1rem" }}>{entry.owner || "Unknown owner"}</div>
                          {entry.evidence && <div style={{ fontSize: "0.8125rem", color: "var(--text-muted)", fontStyle: "italic" as const, marginTop: "0.1rem" }}>{entry.evidence}</div>}
                          {entry.confidence && <span style={{ fontSize: "0.75rem", padding: "1px 6px", borderRadius: "4px", background: entry.confidence === "High" ? "rgba(22,163,74,0.1)" : "rgba(245,158,11,0.1)", color: entry.confidence === "High" ? "#16a34a" : "#d97706", fontWeight: 600 }}>{entry.confidence}</span>}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)", fontStyle: "italic" as const, margin: 0 }}>No documented provenance chain available. Professional provenance research recommended for items of this period.</p>
                  )}
                </div>

                {/* Exhibition & Museum Potential */}
                <div style={{ marginTop: "1.25rem" }}>
                  <div style={{ fontSize: "0.9375rem", fontWeight: 600, color: GOLD, marginBottom: "0.5rem" }}>Exhibition & Museum Potential</div>
                  {result?.exhibition_potential ? (() => {
                    const ep = result.exhibition_potential;
                    return (
                      <div style={{ padding: "0.75rem", background: "var(--bg-card)", borderRadius: "0.65rem", border: `1px solid ${GOLD_BORDER}` }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.4rem" }}>
                          <span style={{ padding: "0.15rem 0.5rem", borderRadius: "9999px", fontSize: "0.8125rem", fontWeight: 700, background: ep.museum_interest === "Strong" || ep.museum_interest === "Moderate" ? `${GOLD}15` : "var(--ghost-bg)", color: ep.museum_interest === "Strong" || ep.museum_interest === "Moderate" ? GOLD : "var(--text-muted)", border: `1px solid ${ep.museum_interest === "Strong" || ep.museum_interest === "Moderate" ? GOLD_BORDER : "var(--border-default)"}` }}>
                            {ep.museum_interest === "Strong" || ep.museum_interest === "Moderate" ? "🏛️ Museum Quality" : "Not Museum Grade"}
                          </span>
                          <span style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>{ep.museum_interest} interest</span>
                        </div>
                        {ep.reasoning && <p style={{ fontSize: "0.8125rem", color: "var(--text-secondary)", lineHeight: 1.5, margin: "0.3rem 0" }}>{ep.reasoning}</p>}
                        {ep.comparable_museum_pieces && (ep.comparable_museum_pieces as string[]).length > 0 && (
                          <div style={{ display: "flex", flexWrap: "wrap" as const, gap: "0.3rem", marginTop: "0.35rem" }}>
                            {(ep.comparable_museum_pieces as string[]).map((piece: string, i: number) => (
                              <span key={i} style={{ padding: "0.15rem 0.5rem", borderRadius: "9999px", fontSize: "0.8125rem", fontWeight: 600, background: `${GOLD}08`, color: GOLD, border: `1px solid ${GOLD_BORDER}` }}>🏛️ {piece}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })() : (
                    <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)", fontStyle: "italic" as const, margin: 0 }}>Exhibition potential assessment requires further analysis.</p>
                  )}
                </div>
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

                {/* Seller Net */}
                {val.fair_market_value?.mid && (
                  <div style={{
                    display: "flex", alignItems: "center", justifyContent: "center", gap: "1rem",
                    padding: "0.75rem", background: "rgba(22,163,74,0.06)", borderRadius: "0.65rem",
                    border: "1px solid rgba(22,163,74,0.2)", marginBottom: "1rem",
                  }}>
                    <div style={{ textAlign: "center" as const }}>
                      <div style={{ fontSize: "0.48rem", textTransform: "uppercase" as const, letterSpacing: "0.08em", color: "var(--text-muted)", fontWeight: 700 }}>You Keep (after 1.75% fee)</div>
                      <div style={{ fontSize: "1.3rem", fontWeight: 800, color: "#22c55e" }}>
                        ${Math.round((_extractPrice(val.fair_market_value.mid) ?? 0) * 0.9825).toLocaleString()}
                      </div>
                    </div>
                    <div style={{ width: "1px", height: "2rem", background: "var(--border-default)" }} />
                    <div style={{ textAlign: "center" as const }}>
                      <div style={{ fontSize: "0.48rem", textTransform: "uppercase" as const, letterSpacing: "0.08em", color: "var(--text-muted)", fontWeight: 700 }}>LegacyLoop Fee</div>
                      <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--text-muted)" }}>
                        ${Math.round((_extractPrice(val.fair_market_value.mid) ?? 0) * 0.0175).toLocaleString()} (1.75%)
                      </div>
                    </div>
                  </div>
                )}

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

                {/* Value Projections */}
                {(() => {
                  const vp = result?.value_projections || val?.value_projections;
                  if (!vp) return (
                    <div style={{ marginTop: "1.25rem" }}>
                      <div style={{ fontSize: "0.9375rem", fontWeight: 600, color: GOLD, marginBottom: "0.35rem" }}>Value Projections</div>
                      <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)", fontStyle: "italic" as const, margin: 0 }}>Long-term projections require more market data. Values for authenticated antiques historically appreciate 3-7% annually.</p>
                    </div>
                  );
                  return (
                    <div style={{ marginTop: "1.25rem" }}>
                      <div style={{ fontSize: "0.9375rem", fontWeight: 600, color: GOLD, marginBottom: "0.65rem" }}>Value Projections</div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "0.75rem" }}>
                        {[
                          { label: "5-Year Outlook", data: vp.five_year },
                          { label: "10-Year Outlook", data: vp.ten_year },
                        ].filter((p) => p.data).map((p) => (
                          <div key={p.label} style={{ background: "var(--bg-card)", border: `1px solid ${GOLD_BORDER}`, borderRadius: "0.65rem", padding: "0.75rem", textAlign: "center" as const }}>
                            <div style={{ fontSize: "0.75rem", textTransform: "uppercase" as const, letterSpacing: "0.08em", color: "var(--text-muted)", fontWeight: 700, marginBottom: "0.25rem" }}>{p.label}</div>
                            <div style={{ fontSize: "1.125rem", fontWeight: 800, color: GOLD }}>
                              {p.data.low != null && p.data.high != null ? `$${Math.round(p.data.low).toLocaleString()} – $${Math.round(p.data.high).toLocaleString()}` : "—"}
                            </div>
                            {p.data.reasoning && <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", lineHeight: 1.4, margin: "0.3rem 0 0" }}>{String(p.data.reasoning).slice(0, 120)}</p>}
                          </div>
                        ))}
                      </div>
                      {vp.risk_factors && (vp.risk_factors as string[]).length > 0 && (
                        <div style={{ fontSize: "0.8125rem", color: "var(--text-muted)", lineHeight: 1.5 }}>
                          <span style={{ fontWeight: 600, color: "#ef4444" }}>Risks:</span> {(vp.risk_factors as string[]).join(", ")}
                        </div>
                      )}
                      {vp.upside_catalysts && (vp.upside_catalysts as string[]).length > 0 && (
                        <div style={{ fontSize: "0.8125rem", color: "var(--text-muted)", lineHeight: 1.5, marginTop: "0.25rem" }}>
                          <span style={{ fontWeight: 600, color: "#22c55e" }}>Upside:</span> {(vp.upside_catalysts as string[]).join(", ")}
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            )}

            {/* ── Market Tab ── */}
            {activeTab === "market" && market && (
              <div>
                <div className="bot-3col-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.65rem", marginBottom: "1.25rem" }}>
                  {[
                    { label: "Collector Demand", value: market.collector_demand, color: market.collector_demand === "High" || market.collector_demand === "Strong" ? "#22c55e" : market.collector_demand === "Low" ? "#ef4444" : "#f59e0b", icon: "📊" },
                    { label: "Market Outlook", value: market.market_outlook, color: GOLD, icon: "📈" },
                    { label: "Collector Base", value: typeof market.collector_base === "string" ? (market.collector_base.length > 40 ? market.collector_base.slice(0, 40) + "..." : market.collector_base) : "—", color: "var(--text-primary)", icon: "👥" },
                  ].filter((m) => m.value).map((m) => (
                    <div key={m.label} style={{
                      background: "var(--bg-card)", border: `1px solid ${GOLD_BORDER}`,
                      borderRadius: "0.65rem", padding: "0.65rem 0.75rem", textAlign: "center" as const,
                    }}>
                      <div style={{ fontSize: "0.9rem", marginBottom: "0.2rem" }}>{m.icon}</div>
                      <div style={{ fontSize: "0.48rem", textTransform: "uppercase" as const, letterSpacing: "0.1em", color: "var(--text-muted)", fontWeight: 700 }}>{m.label}</div>
                      <div style={{ fontSize: "0.82rem", fontWeight: 800, color: m.color, marginTop: "0.15rem" }}>{m.value}</div>
                    </div>
                  ))}
                </div>

                {market.recent_auction_results?.length > 0 && (
                  <div style={{ marginBottom: "1rem" }}>
                    <div style={{ fontSize: "0.6rem", fontWeight: 700, color: GOLD, textTransform: "uppercase" as const, letterSpacing: "0.08em", marginBottom: "0.4rem" }}>Recent Auction Results</div>
                    {market.recent_auction_results.map((r: any, i: number) => (
                      <div key={i} style={{
                        padding: "0.65rem 0.75rem", borderRadius: "0.5rem", marginBottom: "0.4rem",
                        background: "var(--bg-card)", border: `1px solid ${GOLD_BORDER}`,
                      }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <div>
                            <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--text-primary)" }}>🏛️ {r.house || r.auction_house}</div>
                            <div style={{ fontSize: "0.65rem", color: "var(--text-muted)", marginTop: "0.1rem" }}>{r.item || r.description} · {r.date}</div>
                          </div>
                          <div style={{ textAlign: "right" as const }}>
                            <div style={{ fontSize: "0.92rem", fontWeight: 800, color: GOLD }}>{r.realized || r.realized_price || r.hammer_price}</div>
                            {r.estimate && <div style={{ fontSize: "0.62rem", color: "var(--text-muted)" }}>Est: {r.estimate}</div>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {market.collector_organizations?.length > 0 && (
                  <div style={{ marginBottom: "1rem" }}>
                    <div style={{ fontSize: "0.6rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" as const, marginBottom: "0.3rem" }}>Collector Organizations</div>
                    <div style={{ display: "flex", flexWrap: "wrap" as const, gap: "0.3rem" }}>
                      {market.collector_organizations.map((org: string, i: number) => (
                        <span key={i} style={{
                          padding: "0.25rem 0.65rem", borderRadius: "0.4rem", fontSize: "0.7rem", fontWeight: 600,
                          background: `${GOLD}10`, color: GOLD, border: `1px solid ${GOLD_BORDER}`,
                          display: "inline-flex", alignItems: "center", gap: "0.25rem",
                        }}>
                          🏛️ {org}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {market.market_outlook && typeof market.collector_base === "string" && market.collector_base.length > 40 && (
                  <p style={{ fontSize: "0.78rem", color: "var(--text-secondary)", lineHeight: 1.5, marginTop: "0.5rem", marginBottom: 0 }}>👥 {market.collector_base}</p>
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
                    <div style={{ fontSize: "0.6rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" as const, letterSpacing: "0.08em", marginBottom: "0.4rem" }}>Venue Comparison</div>
                    {strategy.venue_options.map((v: any, i: number) => (
                      <div key={i} style={{
                        padding: "0.75rem", borderRadius: "0.5rem", marginBottom: "0.5rem",
                        background: i === 0 ? `${GOLD}08` : "var(--bg-card)",
                        border: `1px solid ${i === 0 ? GOLD : "var(--border-default)"}`,
                      }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.35rem" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                            {i === 0 && <span style={{ fontSize: "0.75rem" }}>🏆</span>}
                            <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-primary)" }}>{v.name || v.venue}</span>
                            {i === 0 && <span style={{ padding: "0.1rem 0.4rem", borderRadius: "9999px", fontSize: "0.55rem", fontWeight: 700, background: `${GOLD}15`, color: GOLD, border: `1px solid ${GOLD}30` }}>RECOMMENDED</span>}
                          </div>
                          <div style={{ fontSize: "1rem", fontWeight: 800, color: GOLD }}>{_fmtPrice(v.expected_return)}</div>
                        </div>
                        <div style={{ display: "flex", gap: "0.75rem", fontSize: "0.72rem" }}>
                          {v.timeline && <span style={{ color: "var(--text-muted)" }}>⏰ {v.timeline}</span>}
                          {v.pros && <span style={{ color: "#16a34a" }}>✓ {v.pros}</span>}
                          {v.cons && <span style={{ color: "#ef4444" }}>✗ {v.cons}</span>}
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
                {docs.provenance_importance && (
                  <div style={{ marginBottom: "1.25rem", padding: "0.75rem", background: `${GOLD}06`, borderRadius: "0.65rem", border: `1px solid ${GOLD_BORDER}`, textAlign: "center" as const }}>
                    <div style={{ fontSize: "0.55rem", fontWeight: 700, color: GOLD, textTransform: "uppercase" as const, letterSpacing: "0.08em", marginBottom: "0.35rem" }}>Provenance Importance</div>
                    <div style={{ fontSize: "1rem", fontWeight: 800, color: GOLD }}>{docs.provenance_importance}</div>
                    <p style={{ fontSize: "0.72rem", color: "var(--text-muted)", margin: "0.3rem 0 0", lineHeight: 1.4 }}>
                      {docs.provenance_importance === "Critical" || docs.provenance_importance === "High"
                        ? "Documentation significantly impacts value. Gather all available records."
                        : "Standard documentation recommended. Enhances buyer confidence."}
                    </p>
                  </div>
                )}
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
                    <div style={{ fontSize: "0.6rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" as const, marginBottom: "0.3rem" }}>Documentation Checklist</div>
                    {strategy.documentation_needed.map((doc: string, i: number) => (
                      <div key={i} style={{
                        display: "flex", alignItems: "center", gap: "0.5rem",
                        padding: "0.45rem 0.65rem", borderRadius: "0.4rem",
                        background: "var(--bg-card)", border: "1px solid var(--border-default)",
                        marginBottom: "0.3rem",
                      }}>
                        <span style={{ width: "18px", height: "18px", borderRadius: "4px", border: `1.5px solid ${GOLD}50`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: "0.55rem", color: GOLD }}>☐</span>
                        <span style={{ fontSize: "0.78rem", color: "var(--text-secondary)" }}>{doc}</span>
                      </div>
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

          {/* Professional Appraisal Report */}
          <div style={{ marginTop: "1.25rem" }}>
            <button onClick={() => setReportOpen(!reportOpen)} style={{
              width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "0.65rem 1rem", borderRadius: "0.65rem",
              background: "transparent", border: `2px solid ${GOLD}`,
              color: GOLD, fontWeight: 700, fontSize: "0.82rem", cursor: "pointer", minHeight: "44px",
            }}>
              <span>📋 Professional Appraisal Report</span>
              <span style={{ fontSize: "0.75rem" }}>{reportOpen ? "▴" : "▾"}</span>
            </button>
            {reportOpen && (
              <div style={{ marginTop: "0.75rem", border: `2px solid ${GOLD}`, borderRadius: "1rem", padding: "1.5rem", background: "var(--bg-card)" }}>
                {/* Header */}
                <div style={{ textAlign: "center" as const, marginBottom: "1rem", paddingBottom: "0.75rem", borderBottom: `1px dashed ${GOLD_BORDER}` }}>
                  <div style={{ fontSize: "0.6rem", fontWeight: 700, color: GOLD, letterSpacing: "0.2em", textTransform: "uppercase" as const }}>═══ LegacyLoop Antique Appraisal Report ═══</div>
                  <div style={{ fontSize: "0.68rem", color: "var(--text-muted)", marginTop: "0.35rem" }}>
                    Date: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })} · Item: {selected.title} · Report ID: {selectedId?.slice(0, 8)}
                  </div>
                </div>

                {/* § Authentication */}
                {auth && (
                  <div style={{ marginBottom: "0.75rem", paddingBottom: "0.75rem", borderBottom: `1px dashed ${GOLD_BORDER}` }}>
                    <div style={{ fontSize: "0.6rem", fontWeight: 700, color: GOLD, letterSpacing: "0.12em", textTransform: "uppercase" as const, marginBottom: "0.35rem" }}>§ Authentication</div>
                    <div style={{ fontSize: "0.82rem", color: "var(--text-primary)", fontWeight: 600 }}>Verdict: {auth.verdict}{auth.confidence ? ` (${auth.confidence}% confidence)` : ""}</div>
                    {auth.positive_indicators?.length > 0 && <div style={{ fontSize: "0.72rem", color: "var(--text-secondary)", marginTop: "0.2rem" }}>Key Indicators: {auth.positive_indicators.slice(0, 3).join(", ")}</div>}
                    <div style={{ fontSize: "0.72rem", color: "var(--text-secondary)", marginTop: "0.15rem" }}>Concerns: {auth.red_flags?.length > 0 ? auth.red_flags.slice(0, 3).join(", ") : "None identified"}</div>
                  </div>
                )}

                {/* § Identification */}
                {ident && (
                  <div style={{ marginBottom: "0.75rem", paddingBottom: "0.75rem", borderBottom: `1px dashed ${GOLD_BORDER}` }}>
                    <div style={{ fontSize: "0.6rem", fontWeight: 700, color: GOLD, letterSpacing: "0.12em", textTransform: "uppercase" as const, marginBottom: "0.35rem" }}>§ Identification</div>
                    {[
                      { l: "Type", v: ident.item_type }, { l: "Period", v: ident.period }, { l: "Origin", v: ident.origin },
                      { l: "Maker", v: typeof ident.maker_info === "object" ? ident.maker_info?.name : ident.maker_info },
                      { l: "Material", v: typeof ident.material_analysis === "object" ? ident.material_analysis?.primary : ident.material_analysis }, { l: "Rarity", v: ident.rarity },
                    ].filter((r) => r.v).map((r) => (
                      <div key={r.l} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", padding: "0.1rem 0" }}>
                        <span style={{ color: "var(--text-muted)" }}>{r.l}</span>
                        <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>{r.v}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* § Valuation */}
                {val && (
                  <div style={{ marginBottom: "0.75rem", paddingBottom: "0.75rem", borderBottom: `1px dashed ${GOLD_BORDER}` }}>
                    <div style={{ fontSize: "0.6rem", fontWeight: 700, color: GOLD, letterSpacing: "0.12em", textTransform: "uppercase" as const, marginBottom: "0.35rem" }}>§ Valuation</div>
                    {val.fair_market_value && <div style={{ fontSize: "0.82rem", color: "var(--text-primary)", fontWeight: 600 }}>Fair Market Value: {_fmtRange(val.fair_market_value)}{val.fair_market_value.mid ? ` (mid: ${_fmtPrice(val.fair_market_value.mid)})` : ""}</div>}
                    {val.insurance_value && <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "0.15rem" }}>Insurance Value: {_fmtPrice(val.insurance_value)}</div>}
                    {val.auction_estimate && <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "0.1rem" }}>Auction Estimate: {_fmtRange(val.auction_estimate)}</div>}
                    {val.fair_market_value?.mid && <div style={{ fontSize: "0.75rem", color: "#22c55e", fontWeight: 600, marginTop: "0.15rem" }}>Your Net (after 1.75% fee): ${Math.round((_extractPrice(val.fair_market_value.mid) ?? 0) * 0.9825).toLocaleString()}</div>}
                  </div>
                )}

                {/* § Condition */}
                {cond && (
                  <div style={{ marginBottom: "0.75rem", paddingBottom: "0.75rem", borderBottom: `1px dashed ${GOLD_BORDER}` }}>
                    <div style={{ fontSize: "0.6rem", fontWeight: 700, color: GOLD, letterSpacing: "0.12em", textTransform: "uppercase" as const, marginBottom: "0.35rem" }}>§ Condition</div>
                    {cond.overall_grade && <div style={{ fontSize: "0.82rem", color: "var(--text-primary)", fontWeight: 600 }}>Grade: {cond.overall_grade}</div>}
                    {cond.condition_impact_on_value && <div style={{ fontSize: "0.72rem", color: "var(--text-secondary)", marginTop: "0.15rem" }}>{cond.condition_impact_on_value}</div>}
                  </div>
                )}

                {/* § Strategy */}
                {strategy && (
                  <div style={{ marginBottom: "0.75rem", paddingBottom: "0.75rem", borderBottom: `1px dashed ${GOLD_BORDER}` }}>
                    <div style={{ fontSize: "0.6rem", fontWeight: 700, color: GOLD, letterSpacing: "0.12em", textTransform: "uppercase" as const, marginBottom: "0.35rem" }}>§ Recommended Action</div>
                    {strategy.best_venue && <div style={{ fontSize: "0.82rem", color: "var(--text-primary)", fontWeight: 600 }}>Best Venue: {strategy.best_venue}</div>}
                    {strategy.timing && <div style={{ fontSize: "0.72rem", color: "var(--text-secondary)", marginTop: "0.15rem" }}>Timing: {strategy.timing}</div>}
                  </div>
                )}

                {/* § Comparable Sales */}
                {market?.recent_auction_results?.length > 0 && (
                  <div style={{ marginBottom: "0.75rem", paddingBottom: "0.75rem", borderBottom: `1px dashed ${GOLD_BORDER}` }}>
                    <div style={{ fontSize: "0.6rem", fontWeight: 700, color: GOLD, letterSpacing: "0.12em", textTransform: "uppercase" as const, marginBottom: "0.35rem" }}>§ Comparable Sales</div>
                    {market.recent_auction_results.slice(0, 5).map((r: any, i: number) => (
                      <div key={i} style={{ fontSize: "0.72rem", color: "var(--text-secondary)", padding: "0.1rem 0" }}>
                        • {r.house || r.auction_house} — {r.item || r.description} — {r.realized || r.realized_price || r.hammer_price} ({r.date})
                      </div>
                    ))}
                  </div>
                )}

                {/* Disclaimer */}
                <div style={{ padding: "0.75rem", background: `${GOLD}04`, borderRadius: "0.5rem", fontSize: "0.68rem", color: "var(--text-muted)", fontStyle: "italic" as const, lineHeight: 1.5 }}>
                  ⚠️ This report is generated by LegacyLoop AI and is not a substitute for a certified professional appraisal. In-person examination recommended for items valued over $500.
                  <div style={{ marginTop: "0.3rem", fontStyle: "normal" as const, fontSize: "0.6rem" }}>Report ID: {selectedId?.slice(0, 8)} · Generated by LegacyLoop.com</div>
                </div>

                {/* Action buttons */}
                <div style={{ display: "flex", gap: "0.75rem", marginTop: "1rem" }}>
                  <button onClick={() => window.print()} style={{
                    flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "0.3rem",
                    padding: "0.5rem 1rem", borderRadius: "0.75rem", minHeight: "44px",
                    background: `linear-gradient(135deg, #d97706, ${GOLD_DARK})`, color: "#fff",
                    fontWeight: 700, fontSize: "0.82rem", border: "none", cursor: "pointer",
                  }}>
                    🖨️ Print Report
                  </button>
                  <button onClick={() => {
                    const lines: string[] = [
                      "═══ LEGACYLOOP ANTIQUE APPRAISAL REPORT ═══",
                      `Date: ${new Date().toLocaleDateString()}`,
                      `Item: ${selected.title}`,
                      `Report ID: ${selectedId?.slice(0, 8)}`,
                      "",
                    ];
                    if (auth) {
                      lines.push("§ AUTHENTICATION", `Verdict: ${auth.verdict}${auth.confidence ? ` (${auth.confidence}%)` : ""}`, `Indicators: ${auth.positive_indicators?.slice(0, 3).join(", ") || "—"}`, `Concerns: ${auth.red_flags?.length ? auth.red_flags.slice(0, 3).join(", ") : "None"}`, "");
                    }
                    if (ident) {
                      lines.push("§ IDENTIFICATION");
                      [{ l: "Type", v: ident.item_type }, { l: "Period", v: ident.period }, { l: "Origin", v: ident.origin }, { l: "Maker", v: typeof ident.maker_info === "object" ? ident.maker_info?.name : ident.maker_info }, { l: "Rarity", v: ident.rarity }].filter((r) => r.v).forEach((r) => lines.push(`${r.l}: ${r.v}`));
                      lines.push("");
                    }
                    if (val) {
                      lines.push("§ VALUATION");
                      if (val.fair_market_value) lines.push(`Fair Market Value: ${_fmtRange(val.fair_market_value)}`);
                      if (val.insurance_value) lines.push(`Insurance: ${_fmtPrice(val.insurance_value)}`);
                      if (val.auction_estimate) lines.push(`Auction: ${_fmtRange(val.auction_estimate)}`);
                      lines.push("");
                    }
                    if (cond?.overall_grade) lines.push("§ CONDITION", `Grade: ${cond.overall_grade}`, "");
                    if (strategy?.best_venue) lines.push("§ STRATEGY", `Best Venue: ${strategy.best_venue}`, "");
                    lines.push("Generated by LegacyLoop.com");
                    navigator.clipboard.writeText(lines.join("\n"));
                    setReportCopied(true);
                    setTimeout(() => setReportCopied(false), 2000);
                  }} style={{
                    flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "0.3rem",
                    padding: "0.5rem 1rem", borderRadius: "0.75rem", minHeight: "44px",
                    background: "transparent", border: `2px solid ${GOLD}`, color: GOLD,
                    fontWeight: 700, fontSize: "0.82rem", cursor: "pointer",
                  }}>
                    {reportCopied ? "✅ Copied!" : "📋 Copy to Clipboard"}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Back to item link */}
          <div style={{ textAlign: "center", marginTop: "1.5rem", marginBottom: "1rem" }}>
            <Link href={`/items/${selectedId}`} style={{
              display: "inline-flex", alignItems: "center", gap: "0.35rem",
              fontSize: "0.875rem", fontWeight: 500, color: "var(--accent)",
              textDecoration: "none", padding: "0.5rem 1rem", borderRadius: "0.5rem",
              border: "1px solid var(--border-default)", transition: "border-color 0.15s ease",
            }}>
              ← Back to Item
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

          {/* MegaBot Explainer */}
          {!megaBotLoading && megaBotData && (() => {
            const dismissed = typeof window !== "undefined" && localStorage.getItem("ll-megabot-explainer-dismissed");
            if (dismissed) return null;
            return (
              <div style={{ padding: "1rem", background: `${GOLD}08`, border: `1px solid ${GOLD_BORDER}`, borderRadius: "0.75rem", marginBottom: "1rem", position: "relative" as const }}>
                <button onClick={() => { localStorage.setItem("ll-megabot-explainer-dismissed", "1"); }} style={{ position: "absolute" as const, top: "0.5rem", right: "0.5rem", background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: "1rem", padding: "0.25rem", lineHeight: 1 }}>×</button>
                <div style={{ fontSize: "0.875rem", fontWeight: 600, color: GOLD, marginBottom: "0.25rem" }}>What is MegaBot?</div>
                <p style={{ fontSize: "0.8125rem", color: "var(--text-secondary)", lineHeight: 1.5, margin: 0 }}>MegaBot runs 4 independent AI specialists in parallel — each with different expertise — then compares their findings. When multiple AIs agree, you can be more confident in the result. Think of it as getting a second, third, and fourth opinion automatically.</p>
              </div>
            );
          })()}

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
          borderRadius: "1rem", padding: "2rem 1.5rem", textAlign: "center" as const,
        }}>
          <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>🏺</div>
          <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--text-primary)", marginBottom: "0.5rem" }}>Ready for Antique Deep-Dive</div>
          <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", maxWidth: 420, margin: "0 auto 1.25rem", lineHeight: 1.6 }}>
            Our AI antique specialist will analyze authenticity, trace historical provenance, assess condition, determine fair market and auction values, and build a complete selling strategy.
          </p>

          <div style={{ maxWidth: 400, margin: "0 auto 1.25rem", textAlign: "left" as const, padding: "0.85rem", background: `${GOLD}06`, borderRadius: "0.65rem", border: `1px solid ${GOLD_BORDER}` }}>
            <div style={{ fontSize: "0.58rem", fontWeight: 700, color: GOLD, textTransform: "uppercase" as const, letterSpacing: "0.06em", marginBottom: "0.5rem" }}>What AntiqueBot Analyzes</div>
            {[
              { icon: "🔍", text: "Authentication — genuine antique or modern reproduction?" },
              { icon: "📜", text: "Historical provenance — maker, origin, era, and cultural context" },
              { icon: "📋", text: "Condition deep-dive — grade, wear analysis, conservation needs" },
              { icon: "💰", text: "Expert valuation — fair market, insurance, auction, and dealer prices" },
              { icon: "🏛️", text: "Collector market — demand level, comparable auction results" },
              { icon: "🎯", text: "Selling strategy — best venue, timing, presentation, and reserve" },
            ].map((b, i) => (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "0.4rem", padding: "0.3rem 0", fontSize: "0.75rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>
                <span style={{ flexShrink: 0, fontSize: "0.75rem" }}>{b.icon}</span>
                <span>{b.text}</span>
              </div>
            ))}
          </div>

          <div style={{ maxWidth: 400, margin: "0 auto 1.25rem", textAlign: "left" as const, padding: "0.75rem", background: "var(--ghost-bg)", borderRadius: "0.5rem", border: "1px solid var(--border-default)" }}>
            <div style={{ fontSize: "0.55rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" as const, letterSpacing: "0.06em", marginBottom: "0.35rem" }}>How It Works</div>
            {["AI specialist analyzes your photos and item data", "Cross-references auction databases and market trends", "Delivers a 9-section professional appraisal report"].map((step, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.25rem 0", fontSize: "0.72rem", color: "var(--text-secondary)" }}>
                <span style={{ width: "22px", height: "22px", borderRadius: "50%", background: `linear-gradient(135deg, ${GOLD}, ${GOLD_DARK})`, color: "#fff", fontSize: "0.58rem", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{i + 1}</span>
                <span>{step}</span>
              </div>
            ))}
          </div>

          <div style={{ display: "flex", justifyContent: "center", gap: "1.25rem", marginBottom: "1rem" }}>
            {[
              { value: "78+", label: "Detection Signals" },
              { value: "6", label: "Report Sections" },
              { value: "4 AI", label: "MegaBot Experts" },
            ].map((m, i) => (
              <div key={i} style={{ textAlign: "center" as const }}>
                <div style={{ fontSize: "1.1rem", fontWeight: 800, color: GOLD }}>{m.value}</div>
                <div style={{ fontSize: "0.55rem", color: "var(--text-muted)", textTransform: "uppercase" as const }}>{m.label}</div>
              </div>
            ))}
          </div>

          <button onClick={runAntiqueBot} disabled={loading || !selected.hasAnalysis} style={{
            padding: "0.65rem 1.5rem", fontSize: "0.9rem", fontWeight: 700, borderRadius: "0.875rem",
            background: `linear-gradient(135deg, #d97706, ${GOLD_DARK})`, color: "#fff",
            border: "none", cursor: "pointer", boxShadow: `0 4px 14px ${GOLD}55`,
            minHeight: "44px",
          }}>
            🏺 Run Antique Appraisal — 1 credit
          </button>
        </div>
      )}

      {/* ── Sticky Bottom Action Bar ── */}
      {selectedId && selected && (
        <div data-no-print style={{
          position: "sticky", bottom: 0, zIndex: 100,
          background: "var(--bg-card-solid)", backdropFilter: "blur(20px)",
          borderTop: "1px solid var(--border-default)",
          boxShadow: "0 -2px 12px rgba(0,0,0,0.08)",
          padding: "0.85rem 2rem",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          gap: "1rem",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.65rem", minWidth: 0, flex: 1 }}>
            <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--text-primary)", overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>
              {selected.title}
            </span>
            {selected.antique?.isAntique && (
              <span style={{
                padding: "0.15rem 0.5rem", borderRadius: 99, fontSize: "0.58rem", fontWeight: 700, flexShrink: 0,
                background: `${GOLD}15`, color: GOLD, border: `1px solid ${GOLD_BORDER}`,
              }}>
                🏺 Antique
              </span>
            )}
          </div>
          <div style={{ display: "flex", gap: "0.5rem", flexShrink: 0 }}>
            <button
              onClick={runAntiqueBot}
              disabled={loading || !selected.hasAnalysis}
              style={{
                padding: "0.45rem 1rem", fontSize: "0.75rem", fontWeight: 700,
                borderRadius: "10px", cursor: loading ? "not-allowed" : "pointer",
                background: loading ? "var(--ghost-bg)" : `linear-gradient(135deg, #d97706, ${GOLD_DARK})`,
                border: "none", color: "#fff", minHeight: "44px",
                boxShadow: loading ? "none" : `0 2px 10px rgba(251,191,36,0.3)`,
              }}
            >
              {loading ? "Analyzing..." : result ? "🔄 Re-Run · 1 cr" : "🏺 Run · 1 cr"}
            </button>
            <button
              onClick={runMegaAntiqueBot}
              disabled={megaBotLoading}
              style={{
                padding: "0.45rem 1rem", fontSize: "0.75rem", fontWeight: 700,
                borderRadius: "10px", cursor: megaBotLoading ? "not-allowed" : "pointer",
                background: megaBotLoading ? "var(--ghost-bg)" : `linear-gradient(135deg, ${GOLD}30, ${GOLD_DARK}40)`,
                border: `1px solid ${GOLD}55`, color: GOLD, minHeight: "44px",
              }}
            >
              {megaBotLoading ? "Running..." : megaBotData ? "🔄 Re-Run MegaBot · 3 cr" : "⚡ MegaBot · 3 cr"}
            </button>
            <Link
              href={`/items/${selectedId}`}
              style={{
                padding: "0.45rem 0.85rem", fontSize: "0.72rem", fontWeight: 600,
                borderRadius: "10px", textDecoration: "none", minHeight: "44px",
                background: "var(--ghost-bg)", border: "1px solid var(--border-default)",
                color: "var(--text-secondary)", display: "flex", alignItems: "center",
              }}
            >
              View Item →
            </Link>
          </div>
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
