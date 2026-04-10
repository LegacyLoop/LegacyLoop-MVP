"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import Link from "next/link";
import BotItemSelector from "../BotItemSelector";
import BotLoadingState from "@/app/components/BotLoadingState";

type ItemData = {
  id: string;
  title: string;
  status: string;
  photo: string | null;
  hasAnalysis: boolean;
  aiResult: string | null;
  category: string;
  valuation: { low: number; mid: number; high: number; confidence: number } | null;
  reconBotResult: string | null;
  reconBotRunAt: string | null;
  reconBot: {
    isActive: boolean;
    autoScanEnabled: boolean;
    competitorCount: number;
    lowestPrice: number | null;
    averagePrice: number | null;
    currentStatus: string;
    recommendation: string | null;
    confidenceScore: number | null;
    scansCompleted: number;
    lastScan: string | null;
    nextScan: string | null;
    alertCount: number;
  } | null;
  scanHistory?: { id: string; type: string; createdAt: string }[];
  lastScannedAt?: string | null;
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

// ─── Shared Style Helpers ─────────────────────────────────────────────────────

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: "var(--bg-card)", backdropFilter: "blur(12px)",
      border: "1px solid rgba(0,188,212,0.15)", borderRadius: 16, padding: "1.25rem",
      ...style,
    }}>
      {children}
    </div>
  );
}

function SectionLabel({ icon, label }: { icon: string; label: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.75rem" }}>
      <span style={{ fontSize: "1rem" }}>{icon}</span>
      <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--accent)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</span>
    </div>
  );
}

function SeverityBadge({ level }: { level: string }) {
  const l = (level || "").toUpperCase();
  const color = l === "URGENT" ? "#ef4444" : l === "HIGH" ? "#f59e0b" : l === "MEDIUM" ? "#00bcd4" : "#4ade80";
  const bg = l === "URGENT" ? "rgba(239,68,68,0.12)" : l === "HIGH" ? "rgba(245,158,11,0.12)" : l === "MEDIUM" ? "rgba(0,188,212,0.1)" : "rgba(74,222,128,0.1)";
  return (
    <span style={{ padding: "0.15rem 0.5rem", borderRadius: "9999px", fontSize: "0.6rem", fontWeight: 700, background: bg, color, textTransform: "uppercase" }}>
      {level}
    </span>
  );
}

function ThreatBadge({ level }: { level: string }) {
  const l = (level || "").toLowerCase();
  const color = l === "high" ? "#ef4444" : l === "medium" ? "#f59e0b" : "#4ade80";
  return (
    <span style={{ padding: "0.15rem 0.5rem", borderRadius: "9999px", fontSize: "0.6rem", fontWeight: 600, background: `${color}18`, color }}>
      {level}
    </span>
  );
}

function HeatBadge({ level }: { level: string }) {
  const l = (level || "").toLowerCase();
  const color = l === "hot" ? "#ef4444" : l === "warm" ? "#f59e0b" : l === "cool" ? "#00bcd4" : "#94a3b8";
  return (
    <span style={{ padding: "0.2rem 0.6rem", borderRadius: "9999px", fontSize: "0.65rem", fontWeight: 700, background: `${color}18`, color, textTransform: "uppercase" }}>
      {l === "hot" ? "🔥" : l === "warm" ? "🌤️" : l === "cool" ? "❄️" : "🧊"} {level}
    </span>
  );
}

function PriorityBadge({ level }: { level: string }) {
  const l = (level || "").toLowerCase();
  const color = l.includes("immediate") ? "#ef4444" : l.includes("week") ? "#f59e0b" : "#00bcd4";
  return (
    <span style={{ padding: "0.15rem 0.5rem", borderRadius: "9999px", fontSize: "0.6rem", fontWeight: 700, background: `${color}18`, color }}>
      {level}
    </span>
  );
}

// ─── MegaBot helpers ─────────────────────────────────────────────────────────

const MEGA_PROVIDER_META: Record<string, { icon: string; label: string; color: string; specialty: string }> = {
  openai: { icon: "🤖", label: "OpenAI", color: "#10a37f", specialty: "Comprehensive competitor analysis across major platforms" },
  claude: { icon: "🧠", label: "Claude", color: "#d97706", specialty: "Deep pattern recognition in pricing history and seller strategies" },
  gemini: { icon: "🔮", label: "Gemini", color: "#4285f4", specialty: "Market trend forecasting and platform algorithm insights" },
  grok: { icon: "🌀", label: "Grok (xAI)", color: "#00DC82", specialty: "Social buzz, trending demand signals, emerging competition" },
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
  const wrappers = ["competitive_intelligence", "market_analysis", "deep_dive", "megabot_enhancement", "recon_analysis"];
  for (const w of wrappers) { if (d[w] && typeof d[w] === "object") { for (const k of keys) { if (Array.isArray(d[w][k]) && d[w][k].length > 0) return d[w][k]; } } }
  return [];
}
function _megaField(d: any, ...keys: string[]): any {
  for (const k of keys) { if (d[k] != null && d[k] !== "" && d[k] !== "Unknown") return d[k]; }
  return null;
}

function extractMegaRecon(p: any) {
  let d = _megaNormKeys(p.data || {});
  const topKeys = Object.keys(d);
  if (topKeys.length === 1 && _megaObj(d[topKeys[0]]) && Object.keys(d[topKeys[0]]).length >= 2) d = d[topKeys[0]];

  const competitors = _megaArr(d, "competitor_listings", "competitors", "active_competitors", "competing_listings", "rival_listings");
  const priceIntel = _megaObj(d.price_intelligence) || _megaObj(d.pricing_analysis) || _megaObj(d.price_analysis) || null;
  const marketAnalysis = _megaObj(d.market_analysis) || _megaObj(d.market_dynamics) || _megaObj(d.market_overview) || null;
  const alerts = _megaArr(d, "market_alerts", "alerts", "competitive_alerts", "price_alerts", "threat_alerts");
  const strategies = _megaArr(d, "selling_strategies_observed", "strategies", "competitor_strategies", "selling_tactics");
  const platformPerf = _megaArr(d, "platform_performance", "platform_breakdown", "platforms", "platform_analysis");
  const executiveSummary = d.executive_summary || d.summary || null;

  const competitorCount = competitors.length;
  const demandLevel = _megaField(d, "demand_level", "market_demand", "demand", "market_heat");
  const pricePosition = _megaField(d, "price_position", "pricing_position", "your_position", "competitive_position");

  return {
    competitors, competitorCount,
    priceIntel,
    marketAnalysis,
    alerts, alertCount: alerts.length,
    strategies,
    platformPerf, platformCount: platformPerf.length,
    demandLevel,
    pricePosition,
    executiveSummary,
  };
}

export default function ReconBotClient({ items, userTier = 1 }: { items: ItemData[]; userTier?: number }) {
  const [selectedId, setSelectedId] = useState<string | null>(items[0]?.id ?? null);
  const [loading, setLoading] = useState(false);
  const [liveResult, setLiveResult] = useState<any>(null);
  const [expandedCompetitors, setExpandedCompetitors] = useState(false);
  const [expandedStat, setExpandedStat] = useState<string | null>(null);
  const [expandedSold, setExpandedSold] = useState(false);
  const [megaBotData, setMegaBotData] = useState<any>(null);
  const [megaBotLoading, setMegaBotLoading] = useState(false);
  const [megaBotExpanded, setMegaBotExpanded] = useState<string | null>(null);
  const [openSections, setOpenSections] = useState<Set<string>>(new Set(["competitors", "alerts", "market-position"]));
  const toggleSection = (id: string) => { setOpenSections(prev => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; }); };

  const item = useMemo(() => items.find((i) => i.id === selectedId) ?? null, [items, selectedId]);
  const stored = useMemo(() => safeJson(item?.reconBotResult ?? null), [item]);
  const data = liveResult || stored;

  // ── Stats computations ──
  const stats = useMemo(() => {
    const totalItems = items.length;
    const monitored = items.filter((i) => i.reconBot?.isActive).length;
    const alerts = items.reduce((sum, i) => sum + (i.reconBot?.alertCount ?? 0), 0);
    const competitors = items.reduce((sum, i) => sum + (i.reconBot?.competitorCount ?? 0), 0);
    return { totalItems, monitored, alerts, competitors };
  }, [items]);

  const statPanels: { key: string; icon: string; label: string; value: number }[] = [
    { key: "total", icon: "\u{1F4E6}", label: "Total Items", value: stats.totalItems },
    { key: "monitored", icon: "\u{1F50D}", label: "Monitored", value: stats.monitored },
    { key: "alerts", icon: "\u{1F514}", label: "Alerts", value: stats.alerts },
    { key: "competitors", icon: "\u{1F3EA}", label: "Competitors", value: stats.competitors },
  ];

  const statsBanner = (
    <div style={{ marginBottom: "1rem" }}>
      {/* Stats grid */}
      <div className="bot-4col-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.5rem" }}>
        {statPanels.map((sp) => {
          const isActive = expandedStat === sp.key;
          return (
            <button
              key={sp.key}
              onClick={() => setExpandedStat(isActive ? null : sp.key)}
              style={{
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                padding: "0.75rem 0.5rem", borderRadius: "0.75rem", cursor: "pointer",
                minHeight: "44px",
                background: isActive ? "rgba(0,188,212,0.08)" : "var(--bg-card)",
                border: isActive ? "1.5px solid #00bcd4" : "1px solid var(--border-default)",
                backdropFilter: "blur(12px)",
                transition: "all 0.2s ease",
                boxShadow: isActive ? "0 0 12px rgba(0,188,212,0.15)" : "none",
              }}
            >
              <span style={{ fontSize: "1.1rem", marginBottom: "0.15rem" }}>{sp.icon}</span>
              <span style={{ fontSize: "1.2rem", fontWeight: 800, color: isActive ? "#00bcd4" : "var(--text-primary)" }}>{sp.value}</span>
              <span style={{ fontSize: "0.6rem", fontWeight: 600, color: isActive ? "#00bcd4" : "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em" }}>{sp.label}</span>
            </button>
          );
        })}
      </div>

      {/* Expandable detail panels */}
      {expandedStat === "total" && (
        <div style={{
          marginTop: "0.5rem", padding: "0.85rem", borderRadius: "0.75rem",
          background: "var(--bg-card)", border: "1px solid rgba(0,188,212,0.2)",
          backdropFilter: "blur(12px)",
        }}>
          <div style={{ fontSize: "0.7rem", fontWeight: 700, color: "#00bcd4", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.5rem" }}>
            Item Breakdown
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.35rem", marginBottom: "0.6rem" }}>
            <div style={{ fontSize: "0.72rem", color: "var(--text-secondary)" }}>
              Analyzed: <strong style={{ color: "var(--text-primary)" }}>{items.filter((i) => i.hasAnalysis).length}</strong>
            </div>
            <div style={{ fontSize: "0.72rem", color: "var(--text-secondary)" }}>
              Pending: <strong style={{ color: "var(--text-primary)" }}>{items.filter((i) => !i.hasAnalysis).length}</strong>
            </div>
            <div style={{ fontSize: "0.72rem", color: "var(--text-secondary)" }}>
              With ReconBot: <strong style={{ color: "var(--text-primary)" }}>{items.filter((i) => i.reconBot).length}</strong>
            </div>
            <div style={{ fontSize: "0.72rem", color: "var(--text-secondary)" }}>
              No ReconBot: <strong style={{ color: "var(--text-primary)" }}>{items.filter((i) => !i.reconBot).length}</strong>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem", maxHeight: "200px", overflowY: "auto" }}>
            {items.map((it) => (
              <div key={it.id} style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "0.4rem 0.5rem", borderRadius: "0.4rem",
                background: it.id === selectedId ? "rgba(0,188,212,0.06)" : "transparent",
                border: it.id === selectedId ? "1px solid rgba(0,188,212,0.15)" : "1px solid transparent",
                fontSize: "0.7rem",
              }}>
                <span style={{ color: "var(--text-primary)", fontWeight: it.id === selectedId ? 700 : 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const, maxWidth: "60%" }}>{it.title}</span>
                <span style={{
                  padding: "0.1rem 0.4rem", borderRadius: "9999px", fontSize: "0.55rem", fontWeight: 600,
                  background: it.hasAnalysis ? "rgba(74,222,128,0.1)" : "rgba(245,158,11,0.1)",
                  color: it.hasAnalysis ? "#4ade80" : "#f59e0b",
                }}>{it.hasAnalysis ? "Analyzed" : "Pending"}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {expandedStat === "monitored" && (
        <div style={{
          marginTop: "0.5rem", padding: "0.85rem", borderRadius: "0.75rem",
          background: "var(--bg-card)", border: "1px solid rgba(0,188,212,0.2)",
          backdropFilter: "blur(12px)",
        }}>
          <div style={{ fontSize: "0.7rem", fontWeight: 700, color: "#00bcd4", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.5rem" }}>
            Monitored Items
          </div>
          {items.filter((i) => i.reconBot?.isActive).length === 0 ? (
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", textAlign: "center", padding: "1rem 0" }}>
              No items currently monitored. Run a ReconBot scan to start monitoring.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem", maxHeight: "200px", overflowY: "auto" }}>
              {items.filter((i) => i.reconBot?.isActive).map((it) => (
                <div key={it.id} style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "0.45rem 0.55rem", borderRadius: "0.4rem",
                  background: "rgba(34,197,94,0.04)", border: "1px solid rgba(34,197,94,0.1)",
                  fontSize: "0.7rem",
                }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.1rem", overflow: "hidden", flex: 1 }}>
                    <span style={{ color: "var(--text-primary)", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>{it.title}</span>
                    <span style={{ fontSize: "0.6rem", color: "var(--text-muted)" }}>
                      {it.reconBot!.scansCompleted} scans completed
                      {it.reconBot!.lastScan ? ` \u00B7 Last: ${new Date(it.reconBot!.lastScan).toLocaleDateString()}` : ""}
                    </span>
                  </div>
                  <span style={{
                    padding: "0.15rem 0.5rem", borderRadius: "9999px", fontSize: "0.55rem", fontWeight: 600,
                    background: "rgba(34,197,94,0.1)", color: "#22c55e", whiteSpace: "nowrap" as const,
                  }}>Active</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {expandedStat === "alerts" && (
        <div style={{
          marginTop: "0.5rem", padding: "0.85rem", borderRadius: "0.75rem",
          background: "var(--bg-card)", border: "1px solid rgba(0,188,212,0.2)",
          backdropFilter: "blur(12px)",
        }}>
          <div style={{ fontSize: "0.7rem", fontWeight: 700, color: "#00bcd4", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.5rem" }}>
            Alert Details
          </div>
          {stats.alerts === 0 ? (
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", textAlign: "center", padding: "1rem 0" }}>
              No active alerts. ReconBot will notify you of market changes.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem", maxHeight: "200px", overflowY: "auto" }}>
              {items.filter((i) => (i.reconBot?.alertCount ?? 0) > 0).map((it) => (
                <div key={it.id} style={{
                  padding: "0.5rem 0.55rem", borderRadius: "0.4rem",
                  background: "rgba(239,68,68,0.04)", border: "1px solid rgba(239,68,68,0.1)",
                  fontSize: "0.7rem",
                }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.15rem" }}>
                    <span style={{ color: "var(--text-primary)", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const, maxWidth: "70%" }}>{it.title}</span>
                    <span style={{
                      padding: "0.1rem 0.4rem", borderRadius: "9999px", fontSize: "0.55rem", fontWeight: 700,
                      background: it.reconBot!.alertCount > 2 ? "rgba(239,68,68,0.12)" : "rgba(245,158,11,0.12)",
                      color: it.reconBot!.alertCount > 2 ? "#ef4444" : "#f59e0b",
                    }}>{it.reconBot!.alertCount} alert{it.reconBot!.alertCount !== 1 ? "s" : ""}</span>
                  </div>
                  <div style={{ fontSize: "0.6rem", color: "var(--text-muted)" }}>
                    {it.reconBot!.recommendation || "Check item for details"}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {expandedStat === "competitors" && (
        <div style={{
          marginTop: "0.5rem", padding: "0.85rem", borderRadius: "0.75rem",
          background: "var(--bg-card)", border: "1px solid rgba(0,188,212,0.2)",
          backdropFilter: "blur(12px)",
        }}>
          <div style={{ fontSize: "0.7rem", fontWeight: 700, color: "#00bcd4", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.5rem" }}>
            Competitor Summary
          </div>
          {stats.competitors === 0 ? (
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", textAlign: "center", padding: "1rem 0" }}>
              No competitors found yet. Run ReconBot scans to discover competing listings.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem", maxHeight: "200px", overflowY: "auto" }}>
              {items.filter((i) => (i.reconBot?.competitorCount ?? 0) > 0).map((it) => (
                <div key={it.id} style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "0.45rem 0.55rem", borderRadius: "0.4rem",
                  background: "var(--ghost-bg)", border: "1px solid var(--border-default)",
                  fontSize: "0.7rem",
                }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.1rem", overflow: "hidden", flex: 1 }}>
                    <span style={{ color: "var(--text-primary)", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>{it.title}</span>
                    <div style={{ display: "flex", gap: "0.5rem", fontSize: "0.6rem", color: "var(--text-muted)" }}>
                      {it.reconBot!.lowestPrice != null && <span>Low: ${it.reconBot!.lowestPrice}</span>}
                      {it.reconBot!.averagePrice != null && <span>Avg: ${it.reconBot!.averagePrice}</span>}
                    </div>
                  </div>
                  <span style={{
                    padding: "0.15rem 0.5rem", borderRadius: "9999px", fontSize: "0.55rem", fontWeight: 700,
                    background: "rgba(0,188,212,0.1)", color: "#00bcd4", whiteSpace: "nowrap" as const,
                  }}>{it.reconBot!.competitorCount} found</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );

  const runScan = useCallback(async () => {
    if (!selectedId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/bots/reconbot/${selectedId}`, { method: "POST" });
      if (res.ok) {
        const d = await res.json();
        setLiveResult(d.result);
      }
    } catch { /* ignore */ }
    setLoading(false);
  }, [selectedId]);

  const handleSelect = useCallback((id: string) => {
    setSelectedId(id);
    setLiveResult(null);
    setExpandedCompetitors(false);
    setExpandedSold(false);
    setMegaBotData(null);
    setMegaBotExpanded(null);
  }, []);

  // Load MegaBot data
  useEffect(() => {
    if (!selectedId) { setMegaBotData(null); return; }
    fetch(`/api/megabot/${selectedId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.results?.reconbot) setMegaBotData(d.results.reconbot);
        else setMegaBotData(null);
      })
      .catch(() => setMegaBotData(null));
  }, [selectedId]);

  const runMegaReconBot = useCallback(async () => {
    if (!selectedId || megaBotLoading) return;
    setMegaBotData(null);
    setMegaBotLoading(true);
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 180_000);
      const res = await fetch(`/api/megabot/${selectedId}?bot=reconbot`, { method: "POST", signal: controller.signal });
      clearTimeout(timeout);
      if (res.ok) {
        const d = await res.json();
        if (d && (d.providers || d.consensus)) {
          setMegaBotData(d);
        }
      } else {
        console.warn("[MegaReconBot] API error:", res.status);
      }
    } catch (e: any) {
      console.warn("[MegaReconBot] fetch error:", e.message);
    }
    setMegaBotLoading(false);
  }, [selectedId, megaBotLoading]);

  // ── No items ──
  if (items.length === 0) {
    return (
      <Card>
        <div style={{ textAlign: "center", padding: "3rem 1rem" }}>
          <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🔍</div>
          <div style={{ fontSize: "1.1rem", fontWeight: 600, color: "var(--text-primary)", marginBottom: "0.5rem" }}>No items yet</div>
          <div style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginBottom: "1.5rem" }}>Upload and analyze an item first, then ReconBot will scan the competition.</div>
          <a href="/items/new" style={{ display: "inline-block", padding: "0.6rem 1.5rem", borderRadius: "0.5rem", background: "linear-gradient(135deg, #00bcd4, #0097a7)", color: "#fff", fontWeight: 600, textDecoration: "none", fontSize: "0.85rem" }}>
            + Add Your First Item
          </a>
        </div>
      </Card>
    );
  }

  // ── Teaser (no analysis yet) ──
  if (item && !item.hasAnalysis) {
    return (
      <>
        {statsBanner}
        <BotItemSelector items={items} selectedId={selectedId} onSelect={handleSelect} />
        <Card style={{ marginTop: "1rem" }}>
          <div style={{ textAlign: "center", padding: "2rem 1rem" }}>
            <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>🔍</div>
            <div style={{ fontSize: "1rem", fontWeight: 600, color: "var(--text-primary)", marginBottom: "0.5rem" }}>AI Analysis Required</div>
            <div style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginBottom: "1rem" }}>
              Run AI analysis on this item first — ReconBot needs identification data to find competitors.
            </div>
            <a href={`/items/${item.id}`} style={{ display: "inline-block", padding: "0.5rem 1.2rem", borderRadius: "0.5rem", background: "linear-gradient(135deg, #00bcd4, #0097a7)", color: "#fff", fontWeight: 600, textDecoration: "none", fontSize: "0.85rem" }}>
              Go to Item →
            </a>
          </div>
        </Card>
      </>
    );
  }

  return (
    <>
      {statsBanner}
      <BotItemSelector items={items} selectedId={selectedId} onSelect={handleSelect} />

      {/* ── Freshness Indicator ── */}
      {item?.lastScannedAt && (
        <div style={{
          display: "flex", alignItems: "center", gap: "0.5rem",
          padding: "0.5rem 0.75rem", background: "var(--ghost-bg)",
          borderRadius: "0.5rem", marginTop: "0.75rem", marginBottom: "0.75rem",
          fontSize: "0.65rem", color: "var(--text-muted)", flexWrap: "wrap",
        }}>
          <span style={{ fontSize: "0.8rem" }}>🕐</span>
          <span>Last scanned: <strong style={{ color: "var(--text-secondary)" }}>
            {(() => {
              const ms = Date.now() - new Date(item.lastScannedAt!).getTime();
              const mins = Math.floor(ms / 60000);
              if (mins < 60) return `${mins} minute${mins !== 1 ? "s" : ""} ago`;
              const hrs = Math.floor(mins / 60);
              if (hrs < 24) return `${hrs} hour${hrs !== 1 ? "s" : ""} ago`;
              const days = Math.floor(hrs / 24);
              return `${days} day${days !== 1 ? "s" : ""} ago`;
            })()}
          </strong></span>
          {(() => {
            const ms = Date.now() - new Date(item.lastScannedAt!).getTime();
            const hrs = ms / 3600000;
            if (hrs > 168) return <span style={{ color: "#ef4444", fontWeight: 600 }}>⚠️ Stale — re-scan recommended</span>;
            if (hrs > 48) return <span style={{ color: "#f59e0b", fontWeight: 600 }}>⏳ Aging — consider re-scanning</span>;
            return <span style={{ color: "#22c55e", fontWeight: 600 }}>✅ Fresh</span>;
          })()}
          {item.reconBot?.isActive && (
            <span style={{ fontSize: "0.5rem", padding: "2px 8px", borderRadius: "9999px",
              background: "rgba(34,197,94,0.1)", color: "#22c55e", fontWeight: 600 }}>
              🟢 Active — scan on demand
            </span>
          )}
          <span style={{ marginLeft: "auto", fontSize: "0.55rem" }}>
            {item.scanHistory?.length ?? 0} scan{(item.scanHistory?.length ?? 0) !== 1 ? "s" : ""}
          </span>
        </div>
      )}

      {/* ── Loading State ── */}
      {loading && (
        <Card style={{ marginTop: "1rem" }}>
          <BotLoadingState botName="ReconBot" />
        </Card>
      )}

      {/* ── No data yet — run first scan ── */}
      {!loading && !data && (
        <Card style={{ marginTop: "1rem" }}>
          <div style={{ textAlign: "center", padding: "2.5rem 1rem" }}>
            <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>🔍</div>
            <div style={{ fontSize: "1.1rem", fontWeight: 600, color: "var(--text-primary)", marginBottom: "0.5rem" }}>Ready to Scan</div>
            <div style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginBottom: "1.5rem", maxWidth: "420px", margin: "0 auto 1.5rem" }}>
              ReconBot will scan all major marketplaces to find competing listings, track prices, and alert you to market changes.
            </div>
            <button onClick={runScan} style={{
              padding: "0.65rem 2rem", borderRadius: "0.6rem", fontSize: "0.9rem", fontWeight: 700, cursor: "pointer",
              background: "linear-gradient(135deg, #8b5cf6, #7c3aed)", border: "none", color: "#fff",
              boxShadow: "0 4px 15px rgba(139,92,246,0.3)",
            }}>
              🔍 Run First Scan
            </button>
            <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginTop: "0.6rem" }}>1 credit · Scans 5+ platforms</div>
          </div>
        </Card>
      )}

      {/* ── Full Results ── */}
      {!loading && data && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginTop: "1rem" }}>

          {/* ═══ SECTION A: Intelligence Overview ═══ */}
          {data.scan_summary && (
            <Card>
              <SectionLabel icon="📊" label="Intelligence Overview" />
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem", flexWrap: "wrap" }}>
                <HeatBadge level={data.scan_summary.market_heat || "Warm"} />
                <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>
                  Threat: <span style={{ color: data.scan_summary.overall_threat_level === "High" ? "#ef4444" : data.scan_summary.overall_threat_level === "Moderate" ? "#f59e0b" : "#4ade80", fontWeight: 600 }}>
                    {data.scan_summary.overall_threat_level}
                  </span>
                </span>
                <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>
                  Position: <span style={{ color: data.scan_summary.price_position === "Well-Priced" ? "#4ade80" : data.scan_summary.price_position === "Overpriced" ? "#ef4444" : data.scan_summary.price_position === "Underpriced" ? "#f59e0b" : "#94a3b8", fontWeight: 600 }}>
                    {data.scan_summary.price_position}
                  </span>
                </span>
              </div>

              {data.scan_summary.headline && (
                <div style={{ fontSize: "0.82rem", color: "var(--text-primary)", marginBottom: "1rem", lineHeight: 1.5 }}>
                  {data.scan_summary.headline}
                </div>
              )}

              <div className="bot-4col-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.5rem" }}>
                {[
                  { label: "Competitors", value: data.scan_summary.total_competitors_found, color: "#00bcd4" },
                  { label: "Active", value: data.scan_summary.active_listings, color: "#4ade80" },
                  { label: "Recently Sold", value: data.scan_summary.recently_sold, color: "#f59e0b" },
                  { label: "Scan Type", value: data.scan_summary.scan_type === "update" ? "Update" : "Initial", color: "#a78bfa" },
                ].map((s) => (
                  <div key={s.label} style={{ textAlign: "center", padding: "0.6rem", borderRadius: "0.5rem", background: "var(--bg-card)", border: "1px solid var(--border-default)" }}>
                    <div style={{ fontSize: "1.2rem", fontWeight: 800, color: s.color }}>{s.value}</div>
                    <div style={{ fontSize: "0.6rem", color: "var(--text-muted)", marginTop: "0.15rem" }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* ═══ SECTION B: Active Alerts ═══ */}
          {data.alerts && data.alerts.length > 0 && (
            <Card>
              <SectionLabel icon="🚨" label={`Alerts (${data.alerts.length})`} />
              <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                {data.alerts.map((alert: any, i: number) => (
                  <div key={i} style={{
                    padding: "0.75rem", borderRadius: "0.5rem",
                    background: alert.severity === "URGENT" || alert.severity === "HIGH" ? "rgba(239,68,68,0.06)" : "var(--bg-card)",
                    border: `1px solid ${alert.severity === "URGENT" || alert.severity === "HIGH" ? "rgba(239,68,68,0.2)" : "var(--border-default)"}`,
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.3rem" }}>
                      <SeverityBadge level={alert.severity} />
                      <span style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--text-primary)" }}>{alert.title}</span>
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", lineHeight: 1.5, marginBottom: "0.3rem" }}>
                      {alert.message}
                    </div>
                    {alert.suggested_action && (
                      <div style={{ fontSize: "0.7rem", color: "var(--accent)", fontWeight: 500 }}>
                        💡 {alert.suggested_action}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* ═══ SECTION C: Price Intelligence ═══ */}
          <AccordionHeader id="market-position" icon="📊" title="PRICE INTELLIGENCE" subtitle="Market pricing data" isOpen={openSections.has("market-position")} onToggle={toggleSection} accentColor="#00bcd4" />
          {openSections.has("market-position") && data.price_intelligence && (() => {
            const pi = data.price_intelligence;
            return (
              <Card>
                <SectionLabel icon="💰" label="Price Intelligence" />
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.5rem", marginBottom: "1rem" }}>
                  {[
                    { label: "Market Average", value: `$${pi.market_average}`, color: "#00bcd4" },
                    { label: "Optimal Price", value: `$${pi.optimal_price}`, color: "#4ade80" },
                    { label: "Trend", value: `${pi.price_trend} (${pi.price_trend_pct})`, color: pi.price_trend === "Rising" ? "#4ade80" : pi.price_trend === "Falling" ? "#ef4444" : "#f59e0b" },
                  ].map((s) => (
                    <div key={s.label} style={{ textAlign: "center", padding: "0.6rem", borderRadius: "0.5rem", background: "var(--bg-card)", border: "1px solid var(--border-default)" }}>
                      <div style={{ fontSize: "1rem", fontWeight: 800, color: s.color }}>{s.value}</div>
                      <div style={{ fontSize: "0.6rem", color: "var(--text-muted)", marginTop: "0.15rem" }}>{s.label}</div>
                    </div>
                  ))}
                </div>

                {/* Price Range Bar */}
                <div style={{ marginBottom: "0.75rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.65rem", color: "var(--text-muted)", marginBottom: "0.3rem" }}>
                    <span>${pi.lowest_active}</span>
                    <span>Market Range</span>
                    <span>${pi.highest_active}</span>
                  </div>
                  <div style={{ position: "relative", height: "8px", borderRadius: "4px", background: "var(--ghost-bg)" }}>
                    <div style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0, borderRadius: "4px", background: "linear-gradient(90deg, #4ade80, #00bcd4, #f59e0b, #ef4444)" }} />
                    {/* Optimal marker */}
                    {pi.lowest_active < pi.highest_active && (() => {
                      const pct = ((pi.optimal_price - pi.lowest_active) / (pi.highest_active - pi.lowest_active)) * 100;
                      return (
                        <div style={{
                          position: "absolute", top: "-3px", left: `${Math.min(95, Math.max(5, pct))}%`,
                          width: "14px", height: "14px", borderRadius: "50%",
                          background: "#fff", border: "2px solid var(--accent)",
                          transform: "translateX(-50%)", boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
                        }} />
                      );
                    })()}
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.4rem", fontSize: "0.7rem" }}>
                  <div style={{ padding: "0.4rem", borderRadius: "0.4rem", background: "rgba(74,222,128,0.06)", textAlign: "center" }}>
                    <div style={{ color: "#4ade80", fontWeight: 700 }}>${pi.undercut_price}</div>
                    <div style={{ color: "var(--text-muted)", fontSize: "0.6rem" }}>Undercut</div>
                  </div>
                  <div style={{ padding: "0.4rem", borderRadius: "0.4rem", background: "rgba(0,188,212,0.06)", textAlign: "center" }}>
                    <div style={{ color: "#00bcd4", fontWeight: 700 }}>${pi.optimal_price}</div>
                    <div style={{ color: "var(--text-muted)", fontSize: "0.6rem" }}>Optimal</div>
                  </div>
                  <div style={{ padding: "0.4rem", borderRadius: "0.4rem", background: "rgba(245,158,11,0.06)", textAlign: "center" }}>
                    <div style={{ color: "#f59e0b", fontWeight: 700 }}>${pi.premium_price}</div>
                    <div style={{ color: "var(--text-muted)", fontSize: "0.6rem" }}>Premium</div>
                  </div>
                </div>

                {pi.price_position_detail && (
                  <div style={{ marginTop: "0.75rem", fontSize: "0.75rem", color: "var(--text-secondary)", lineHeight: 1.5, padding: "0.5rem 0.75rem", borderRadius: "0.4rem", background: "var(--bg-card)", borderLeft: "3px solid var(--accent)" }}>
                    {pi.price_position_detail}
                  </div>
                )}
              </Card>
            );
          })()}

          {/* ═══ SECTION D: Competitor Listings ═══ */}
          <AccordionHeader id="competitors" icon="🔍" title="COMPETITOR LISTINGS" subtitle={`${(data.competitor_listings || []).length} found`} isOpen={openSections.has("competitors")} onToggle={toggleSection} accentColor="#f59e0b" badge={`${(data.competitor_listings || []).length} ACTIVE`} />
          {openSections.has("competitors") && data.competitor_listings && data.competitor_listings.length > 0 && (
            <Card>
              <SectionLabel icon="🏪" label={`Competitor Listings (${data.competitor_listings.length})`} />
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {(expandedCompetitors ? data.competitor_listings : data.competitor_listings.slice(0, 5)).map((comp: any, i: number) => (
                  <div key={i} style={{
                    display: "grid", gridTemplateColumns: "1fr auto auto",
                    gap: "0.75rem", alignItems: "center",
                    padding: "0.6rem 0.75rem", borderRadius: "0.5rem",
                    background: comp.status === "Sold" ? "rgba(74,222,128,0.04)" : "var(--bg-card)",
                    border: `1px solid ${comp.threat_level === "High" ? "rgba(239,68,68,0.15)" : "var(--border-default)"}`,
                  }}>
                    <div>
                      <div style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--text-primary)", marginBottom: "0.15rem" }}>
                        {comp.title}
                      </div>
                      <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", fontSize: "0.65rem", color: "var(--text-muted)", flexWrap: "wrap" }}>
                        <span>{comp.platform}</span>
                        <span>·</span>
                        <span>{comp.location}</span>
                        <span>·</span>
                        <span>{comp.condition}</span>
                        {comp.days_listed && <><span>·</span><span>{comp.days_listed}d listed</span></>}
                      </div>
                      {comp.notes && <div style={{ fontSize: "0.65rem", color: "var(--text-muted)", marginTop: "0.2rem", fontStyle: "italic" }}>{comp.notes}</div>}
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: "0.9rem", fontWeight: 800, color: comp.status === "Sold" ? "#4ade80" : "var(--text-primary)" }}>
                        ${comp.status === "Sold" ? comp.sold_price : comp.price}
                      </div>
                      {comp.status === "Sold" && comp.sold_days && (
                        <div style={{ fontSize: "0.6rem", color: "#4ade80" }}>Sold in {comp.sold_days}d</div>
                      )}
                    </div>
                    <ThreatBadge level={comp.threat_level} />
                  </div>
                ))}
              </div>
              {data.competitor_listings.length > 5 && (
                <button
                  onClick={() => setExpandedCompetitors(!expandedCompetitors)}
                  style={{
                    display: "block", width: "100%", marginTop: "0.5rem",
                    padding: "0.4rem", borderRadius: "0.4rem", fontSize: "0.72rem", fontWeight: 600,
                    background: "var(--bg-card)", border: "1px solid var(--border-default)",
                    color: "var(--accent)", cursor: "pointer", textAlign: "center",
                  }}
                >
                  {expandedCompetitors ? "Show Less" : `Show All ${data.competitor_listings.length} Competitors`}
                </button>
              )}
            </Card>
          )}

          {/* ═══ SECTION E: Market Dynamics ═══ */}
          {data.market_dynamics && (
            <Card>
              <SectionLabel icon="📈" label="Market Dynamics" />
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.5rem", marginBottom: "1rem" }}>
                {[
                  { label: "Supply", value: data.market_dynamics.supply_level, color: "#00bcd4" },
                  { label: "Avg Days to Sell", value: data.market_dynamics.avg_days_to_sell, color: "#f59e0b" },
                  { label: "Velocity", value: data.market_dynamics.market_velocity, color: "#a78bfa" },
                ].map((s) => (
                  <div key={s.label} style={{ textAlign: "center", padding: "0.6rem", borderRadius: "0.5rem", background: "var(--bg-card)", border: "1px solid var(--border-default)" }}>
                    <div style={{ fontSize: "1rem", fontWeight: 700, color: s.color }}>{s.value}</div>
                    <div style={{ fontSize: "0.6rem", color: "var(--text-muted)", marginTop: "0.15rem" }}>{s.label}</div>
                  </div>
                ))}
              </div>

              {data.market_dynamics.demand_signals && (
                <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", lineHeight: 1.5, marginBottom: "0.5rem" }}>
                  📊 {data.market_dynamics.demand_signals}
                </div>
              )}
              <div style={{ display: "flex", gap: "1rem", fontSize: "0.72rem", flexWrap: "wrap" }}>
                <div><span style={{ color: "var(--text-muted)" }}>Sell-through: </span><span style={{ fontWeight: 600, color: "var(--text-primary)" }}>{data.market_dynamics.sell_through_rate}</span></div>
                <div><span style={{ color: "var(--text-muted)" }}>New/week: </span><span style={{ fontWeight: 600, color: "var(--text-primary)" }}>{data.market_dynamics.new_listings_per_week}</span></div>
              </div>
              {data.market_dynamics.seasonal_outlook && (
                <div style={{ marginTop: "0.5rem", fontSize: "0.72rem", color: "var(--text-muted)", fontStyle: "italic" }}>
                  🗓️ {data.market_dynamics.seasonal_outlook}
                </div>
              )}
            </Card>
          )}

          {/* ═══ SECTION F: Platform Breakdown ═══ */}
          {data.platform_breakdown && data.platform_breakdown.length > 0 && (
            <Card>
              <SectionLabel icon="🌐" label="Platform Breakdown" />
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {data.platform_breakdown.map((p: any, i: number) => (
                  <div key={i} style={{
                    padding: "0.65rem 0.75rem", borderRadius: "0.5rem",
                    background: "var(--bg-card)", border: "1px solid var(--border-default)",
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.3rem" }}>
                      <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--text-primary)" }}>{p.platform}</span>
                      <span style={{ fontSize: "0.85rem", fontWeight: 800, color: "var(--accent)" }}>${p.recommended_price}</span>
                    </div>
                    <div style={{ display: "flex", gap: "1rem", fontSize: "0.65rem", color: "var(--text-muted)", flexWrap: "wrap" }}>
                      <span>{p.active_count} active</span>
                      <span>Avg ${p.avg_price}</span>
                      <span>~{p.avg_days_to_sell}d to sell</span>
                      <span style={{ color: p.competition_level === "High" ? "#ef4444" : p.competition_level === "Medium" ? "#f59e0b" : "#4ade80" }}>
                        {p.competition_level} competition
                      </span>
                    </div>
                    {p.opportunity && (
                      <div style={{ fontSize: "0.68rem", color: "var(--text-secondary)", marginTop: "0.25rem" }}>
                        {p.opportunity}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* ═══ SECTION G: Sold Tracker ═══ */}
          {data.sold_tracker && data.sold_tracker.length > 0 && (
            <Card>
              <SectionLabel icon="✅" label={`Recently Sold (${data.sold_tracker.length})`} />
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {(expandedSold ? data.sold_tracker : data.sold_tracker.slice(0, 3)).map((s: any, i: number) => (
                  <div key={i} style={{
                    padding: "0.6rem 0.75rem", borderRadius: "0.5rem",
                    background: "rgba(74,222,128,0.04)", border: "1px solid rgba(74,222,128,0.1)",
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.2rem" }}>
                      <span style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--text-primary)" }}>{s.title}</span>
                      <span style={{ fontSize: "0.9rem", fontWeight: 800, color: "#4ade80" }}>${s.sold_price}</span>
                    </div>
                    <div style={{ display: "flex", gap: "0.75rem", fontSize: "0.65rem", color: "var(--text-muted)" }}>
                      <span>{s.platform}</span>
                      <span>{s.condition}</span>
                      <span>{s.days_to_sell}d to sell</span>
                      <span>{s.sold_date}</span>
                    </div>
                    {s.takeaway && (
                      <div style={{ fontSize: "0.68rem", color: "var(--accent)", marginTop: "0.2rem", fontWeight: 500 }}>
                        💡 {s.takeaway}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              {data.sold_tracker.length > 3 && (
                <button
                  onClick={() => setExpandedSold(!expandedSold)}
                  style={{
                    display: "block", width: "100%", marginTop: "0.5rem",
                    padding: "0.4rem", borderRadius: "0.4rem", fontSize: "0.72rem", fontWeight: 600,
                    background: "var(--bg-card)", border: "1px solid var(--border-default)",
                    color: "var(--accent)", cursor: "pointer", textAlign: "center",
                  }}
                >
                  {expandedSold ? "Show Less" : `Show All ${data.sold_tracker.length} Sales`}
                </button>
              )}
            </Card>
          )}

          {/* ═══ SECTION H: Competitive Advantages / Disadvantages ═══ */}
          {(data.competitive_advantages || data.competitive_disadvantages) && (
            <Card>
              <SectionLabel icon="⚔️" label="Competitive Position" />
              {data.competitive_advantages && data.competitive_advantages.length > 0 && (
                <div style={{ marginBottom: "1rem" }}>
                  <div style={{ fontSize: "0.68rem", fontWeight: 700, color: "#4ade80", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.4rem" }}>
                    Your Advantages
                  </div>
                  {data.competitive_advantages.map((a: any, i: number) => (
                    <div key={i} style={{ marginBottom: "0.5rem", paddingLeft: "0.75rem", borderLeft: "2px solid rgba(74,222,128,0.3)" }}>
                      <div style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--text-primary)" }}>{a.advantage}</div>
                      <div style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>{a.impact}</div>
                      {a.leverage_tip && <div style={{ fontSize: "0.65rem", color: "var(--accent)", marginTop: "0.1rem" }}>💡 {a.leverage_tip}</div>}
                    </div>
                  ))}
                </div>
              )}
              {data.competitive_disadvantages && data.competitive_disadvantages.length > 0 && (
                <div>
                  <div style={{ fontSize: "0.68rem", fontWeight: 700, color: "#f59e0b", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.4rem" }}>
                    Areas to Improve
                  </div>
                  {data.competitive_disadvantages.map((d: any, i: number) => (
                    <div key={i} style={{ marginBottom: "0.5rem", paddingLeft: "0.75rem", borderLeft: "2px solid rgba(245,158,11,0.3)" }}>
                      <div style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--text-primary)" }}>{d.disadvantage}</div>
                      <div style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>{d.impact}</div>
                      {d.mitigation && <div style={{ fontSize: "0.65rem", color: "var(--accent)", marginTop: "0.1rem" }}>💡 {d.mitigation}</div>}
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}

          {/* ═══ SECTION I: Strategic Recommendations ═══ */}
          {data.strategic_recommendations && data.strategic_recommendations.length > 0 && (
            <Card>
              <SectionLabel icon="🎯" label="Strategic Recommendations" />
              <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                {data.strategic_recommendations.map((r: any, i: number) => (
                  <div key={i} style={{
                    padding: "0.65rem 0.75rem", borderRadius: "0.5rem",
                    background: "var(--bg-card)", border: "1px solid var(--border-default)",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.3rem" }}>
                      <PriorityBadge level={r.priority} />
                      <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--text-primary)" }}>{r.action}</span>
                    </div>
                    <div style={{ fontSize: "0.72rem", color: "var(--text-secondary)", lineHeight: 1.5, marginBottom: "0.2rem" }}>
                      {r.reasoning}
                    </div>
                    {r.expected_impact && (
                      <div style={{ fontSize: "0.68rem", color: "var(--accent)", fontWeight: 500 }}>
                        📈 Expected: {r.expected_impact}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* ═══ SECTION J: Market Forecast ═══ */}
          {data.market_forecast && (
            <Card>
              <SectionLabel icon="🔮" label="Market Forecast" />
              <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                {[
                  { label: "Short-term (2 weeks)", value: data.market_forecast.short_term, icon: "📅" },
                  { label: "Medium-term (1-3 months)", value: data.market_forecast.medium_term, icon: "📆" },
                  { label: "Best Selling Window", value: data.market_forecast.best_window, icon: "🎯" },
                ].map((f) => f.value && (
                  <div key={f.label} style={{ fontSize: "0.75rem", lineHeight: 1.5 }}>
                    <span style={{ color: "var(--text-muted)", fontWeight: 600 }}>{f.icon} {f.label}: </span>
                    <span style={{ color: "var(--text-secondary)" }}>{f.value}</span>
                  </div>
                ))}

                {data.market_forecast.risk_factors && data.market_forecast.risk_factors.length > 0 && (
                  <div style={{ marginTop: "0.3rem" }}>
                    <div style={{ fontSize: "0.65rem", fontWeight: 700, color: "#ef4444", marginBottom: "0.2rem" }}>⚠️ Risk Factors</div>
                    {data.market_forecast.risk_factors.map((r: string, i: number) => (
                      <div key={i} style={{ fontSize: "0.7rem", color: "var(--text-muted)", paddingLeft: "0.75rem", marginBottom: "0.15rem" }}>• {r}</div>
                    ))}
                  </div>
                )}

                {data.market_forecast.upside_factors && data.market_forecast.upside_factors.length > 0 && (
                  <div style={{ marginTop: "0.3rem" }}>
                    <div style={{ fontSize: "0.65rem", fontWeight: 700, color: "#4ade80", marginBottom: "0.2rem" }}>✅ Upside Factors</div>
                    {data.market_forecast.upside_factors.map((u: string, i: number) => (
                      <div key={i} style={{ fontSize: "0.7rem", color: "var(--text-muted)", paddingLeft: "0.75rem", marginBottom: "0.15rem" }}>• {u}</div>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* ═══ SECTION K: MegaBot Competitive Intelligence ═══ */}
          {megaBotLoading && (
            <Card style={{ background: "linear-gradient(135deg, rgba(167,139,250,0.04), rgba(251,191,36,0.04))", border: "1px solid rgba(167,139,250,0.2)" }}>
              <div style={{ textAlign: "center", padding: "2rem 1rem" }}>
                <div style={{ fontSize: "2rem", marginBottom: "0.75rem", animation: "pulse 1.5s ease-in-out infinite" }}>⚡</div>
                <p style={{ fontSize: "0.85rem", color: "#a78bfa", fontWeight: 600, margin: "0 0 0.3rem" }}>4 AI competitive intelligence agents working...</p>
                <p style={{ fontSize: "0.7rem", color: "var(--text-muted)", margin: 0 }}>OpenAI, Claude, Gemini, and Grok analyzing the competition in parallel</p>
              </div>
            </Card>
          )}

          {!megaBotLoading && !megaBotData && (
            <Card style={{ background: "linear-gradient(135deg, rgba(167,139,250,0.04), rgba(251,191,36,0.04))", border: "1px solid rgba(167,139,250,0.2)" }}>
              <SectionLabel icon="⚡" label="MegaBot Competitive Intelligence" />
              <div style={{ textAlign: "center", padding: "1rem 0.5rem" }}>
                <p style={{ fontSize: "0.78rem", color: "var(--text-secondary)", lineHeight: 1.5, marginBottom: "0.75rem", margin: "0 0 0.75rem" }}>
                  Run 4 AI agents in parallel — OpenAI finds comparables, Claude spots pricing patterns, Gemini forecasts market trends, and Grok surfaces social buzz and emerging competition.
                </p>
                <div style={{ display: "flex", gap: "0.75rem", fontSize: "0.7rem", color: "var(--text-muted)", marginBottom: "0.75rem", flexWrap: "wrap", justifyContent: "center" }}>
                  <span>🤖 GPT-4o — Comparable analysis</span>
                  <span>🧠 Claude — Pattern recognition</span>
                  <span>🔮 Gemini — Market trends</span>
                  <span>🌀 Grok — Social buzz</span>
                </div>
                <button onClick={runMegaReconBot} style={{
                  padding: "0.55rem 1.3rem", fontSize: "0.8rem", borderRadius: "0.5rem", fontWeight: 700,
                  background: "linear-gradient(135deg, rgba(167,139,250,0.2), rgba(251,191,36,0.2))",
                  border: "1px solid rgba(167,139,250,0.35)", color: "#a78bfa", cursor: "pointer",
                }}>
                  ⚡ Run MegaBot Recon — 3 credits
                </button>
              </div>
            </Card>
          )}

          {!megaBotLoading && megaBotData && (() => {
            const providers: any[] = megaBotData.providers || [];
            const successful = providers.filter((p: any) => !p.error);
            const failed = providers.filter((p: any) => p.error);
            const agreeRaw = megaBotData.agreementScore || megaBotData.agreement || 0.85;
            const agree = Math.round(agreeRaw > 1 ? agreeRaw : agreeRaw * 100);
            const allRecon = successful.map((p: any) => extractMegaRecon(p));
            const totalCompetitors = allRecon.reduce((s: number, r: any) => s + r.competitorCount, 0);
            const totalAlerts = allRecon.reduce((s: number, r: any) => s + r.alertCount, 0);
            const totalPlatforms = new Set(allRecon.flatMap((r: any) => r.platformPerf.map((p: any) => (p.platform || "").toLowerCase()))).size;

            return (
              <Card style={{ background: "linear-gradient(135deg, rgba(139,92,246,0.06), rgba(0,188,212,0.04))", border: "1px solid rgba(139,92,246,0.2)" }}>
                {/* Header */}
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
                  <span style={{ fontSize: "1.1rem" }}>⚡</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "#a855f7", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      MegaBot Competitive Intelligence — {successful.length} AI Experts
                    </div>
                    <div style={{ fontSize: "0.65rem", color: "var(--text-muted)" }}>
                      {totalCompetitors} competitors · {totalPlatforms} platforms · {totalAlerts} alerts
                    </div>
                  </div>
                  <div style={{ padding: "0.2rem 0.6rem", borderRadius: 99, background: agree >= 75 ? "rgba(76,175,80,0.15)" : "rgba(255,152,0,0.15)", color: agree >= 75 ? "#4caf50" : "#ff9800", fontSize: "0.72rem", fontWeight: 700 }}>
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
                    const rc = allRecon[idx];
                    const timeStr = (p.durationMs || p.responseTime) ? `${((p.durationMs || p.responseTime) / 1000).toFixed(1)}s` : "";

                    return (
                      <div key={p.provider} style={{
                        background: isExp ? "var(--ghost-bg)" : "var(--bg-card)",
                        borderTop: isExp ? `3px solid ${pm.color}` : undefined,
                        border: `1px solid ${isExp ? `${pm.color}30` : "var(--border-default)"}`,
                        borderRadius: "0.5rem", overflow: "hidden",
                      }}>
                        <button
                          onClick={() => setMegaBotExpanded(isExp ? null : p.provider)}
                          style={{ width: "100%", display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.55rem 0.65rem", background: "transparent", border: "none", cursor: "pointer", textAlign: "left" }}
                        >
                          <span style={{ fontSize: "0.85rem" }}>{pm.icon}</span>
                          <span style={{ fontWeight: 700, fontSize: "0.72rem", color: pm.color, minWidth: 52 }}>{pm.label}</span>
                          <span style={{ fontSize: "0.68rem", color: "var(--text-secondary)", flex: 1, overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>
                            {rc.competitorCount} competitors · {rc.demandLevel || "—"} · {rc.pricePosition || "—"}
                          </span>
                          <span style={{ fontSize: "0.6rem", color: "#4caf50" }}>✅ {timeStr}</span>
                          <span style={{ fontSize: "0.6rem", color: "var(--text-muted)", transform: isExp ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>▾</span>
                        </button>

                        {isExp && (
                          <div style={{ padding: "0 0.75rem 0.75rem", borderTop: `1px solid ${pm.color}15` }}>
                            {/* Competitors */}
                            {rc.competitors.length > 0 && (
                              <div style={{ marginTop: "0.5rem", marginBottom: "0.5rem", padding: "0.5rem 0.6rem", background: "var(--bg-card)", borderRadius: "0.5rem", border: "1px solid var(--border-default)" }}>
                                <div style={{ fontSize: "0.55rem", textTransform: "uppercase", letterSpacing: "0.1em", color: pm.color, fontWeight: 700, marginBottom: "0.3rem" }}>Competitor Listings ({rc.competitors.length})</div>
                                {rc.competitors.slice(0, 6).map((comp: any, i: number) => (
                                  <div key={i} style={{ padding: "0.35rem 0.4rem", marginBottom: "0.25rem", borderRadius: "0.35rem", background: "var(--bg-card)", border: "1px solid var(--border-default)" }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "0.3rem", flexWrap: "wrap" }}>
                                      <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--text-primary)" }}>{comp.title || comp.name || "Competitor"}</span>
                                      {comp.platform && <span style={{ padding: "0.1rem 0.35rem", borderRadius: "0.25rem", fontSize: "0.55rem", background: "var(--ghost-bg)", color: "var(--text-muted)", border: "1px solid var(--border-default)" }}>{comp.platform}</span>}
                                      {comp.threat_level && <ThreatBadge level={comp.threat_level} />}
                                    </div>
                                    <div style={{ display: "flex", gap: "0.5rem", fontSize: "0.65rem", color: "var(--text-muted)", marginTop: "0.15rem", flexWrap: "wrap" }}>
                                      {comp.price != null && <span style={{ fontWeight: 700, color: "var(--accent)" }}>${comp.price}</span>}
                                      {comp.condition && <span>{comp.condition}</span>}
                                      {comp.location && <span>{comp.location}</span>}
                                      {comp.days_listed && <span>{comp.days_listed}d listed</span>}
                                    </div>
                                    {comp.notes && <div style={{ fontSize: "0.6rem", color: "var(--text-muted)", marginTop: "0.1rem", fontStyle: "italic" }}>{typeof comp.notes === "string" && comp.notes.length > 120 ? comp.notes.slice(0, 120) + "..." : comp.notes}</div>}
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Price Intelligence */}
                            {rc.priceIntel && (
                              <div style={{ marginBottom: "0.5rem", padding: "0.5rem 0.6rem", background: "var(--bg-card)", borderRadius: "0.5rem", border: "1px solid var(--border-default)" }}>
                                <div style={{ fontSize: "0.55rem", textTransform: "uppercase", letterSpacing: "0.1em", color: pm.color, fontWeight: 700, marginBottom: "0.3rem" }}>Price Intelligence</div>
                                <div style={{ display: "flex", gap: "0.75rem", fontSize: "0.68rem", flexWrap: "wrap" }}>
                                  {rc.priceIntel.market_average != null && <div><span style={{ color: "var(--text-muted)" }}>Avg: </span><span style={{ fontWeight: 700, color: "var(--accent)" }}>${rc.priceIntel.market_average}</span></div>}
                                  {rc.priceIntel.optimal_price != null && <div><span style={{ color: "var(--text-muted)" }}>Optimal: </span><span style={{ fontWeight: 700, color: "#4ade80" }}>${rc.priceIntel.optimal_price}</span></div>}
                                  {rc.priceIntel.price_trend && <div><span style={{ color: "var(--text-muted)" }}>Trend: </span><span style={{ fontWeight: 600, color: rc.priceIntel.price_trend === "Rising" ? "#4ade80" : rc.priceIntel.price_trend === "Falling" ? "#ef4444" : "#f59e0b" }}>{rc.priceIntel.price_trend}</span></div>}
                                  {rc.priceIntel.lowest_active != null && <div><span style={{ color: "var(--text-muted)" }}>Low: </span><span style={{ color: "var(--text-secondary)" }}>${rc.priceIntel.lowest_active}</span></div>}
                                  {rc.priceIntel.highest_active != null && <div><span style={{ color: "var(--text-muted)" }}>High: </span><span style={{ color: "var(--text-secondary)" }}>${rc.priceIntel.highest_active}</span></div>}
                                </div>
                                {rc.priceIntel.price_position_detail && <div style={{ fontSize: "0.65rem", color: "var(--text-secondary)", marginTop: "0.3rem", lineHeight: 1.4 }}>{typeof rc.priceIntel.price_position_detail === "string" && rc.priceIntel.price_position_detail.length > 150 ? rc.priceIntel.price_position_detail.slice(0, 150) + "..." : rc.priceIntel.price_position_detail}</div>}
                              </div>
                            )}

                            {/* Market Analysis */}
                            {rc.marketAnalysis && (
                              <div style={{ marginBottom: "0.5rem", padding: "0.5rem 0.6rem", background: "var(--bg-card)", borderRadius: "0.5rem", border: "1px solid var(--border-default)" }}>
                                <div style={{ fontSize: "0.55rem", textTransform: "uppercase", letterSpacing: "0.1em", color: pm.color, fontWeight: 700, marginBottom: "0.3rem" }}>Market Analysis</div>
                                <div style={{ display: "flex", gap: "0.75rem", fontSize: "0.68rem", flexWrap: "wrap" }}>
                                  {rc.marketAnalysis.supply_level && <div><span style={{ color: "var(--text-muted)" }}>Supply: </span><span style={{ fontWeight: 600, color: "var(--text-primary)" }}>{rc.marketAnalysis.supply_level}</span></div>}
                                  {rc.marketAnalysis.demand_level && <div><span style={{ color: "var(--text-muted)" }}>Demand: </span><span style={{ fontWeight: 600, color: "var(--text-primary)" }}>{rc.marketAnalysis.demand_level}</span></div>}
                                  {rc.marketAnalysis.market_velocity && <div><span style={{ color: "var(--text-muted)" }}>Velocity: </span><span style={{ fontWeight: 600, color: "var(--text-primary)" }}>{rc.marketAnalysis.market_velocity}</span></div>}
                                  {rc.marketAnalysis.avg_days_to_sell && <div><span style={{ color: "var(--text-muted)" }}>Avg Days: </span><span style={{ fontWeight: 600, color: "var(--text-primary)" }}>{rc.marketAnalysis.avg_days_to_sell}</span></div>}
                                </div>
                                {rc.marketAnalysis.demand_signals && <div style={{ fontSize: "0.65rem", color: "var(--text-secondary)", marginTop: "0.3rem", lineHeight: 1.4 }}>{rc.marketAnalysis.demand_signals}</div>}
                                {rc.marketAnalysis.seasonal_outlook && <div style={{ fontSize: "0.62rem", color: "var(--text-muted)", marginTop: "0.2rem", fontStyle: "italic" }}>🗓️ {rc.marketAnalysis.seasonal_outlook}</div>}
                              </div>
                            )}

                            {/* Alerts */}
                            {rc.alerts.length > 0 && (
                              <div style={{ marginBottom: "0.5rem", padding: "0.5rem 0.6rem", background: "var(--bg-card)", borderRadius: "0.5rem", border: "1px solid var(--border-default)" }}>
                                <div style={{ fontSize: "0.55rem", textTransform: "uppercase", letterSpacing: "0.1em", color: pm.color, fontWeight: 700, marginBottom: "0.3rem" }}>Alerts ({rc.alerts.length})</div>
                                {rc.alerts.slice(0, 5).map((alert: any, i: number) => (
                                  <div key={i} style={{ padding: "0.3rem 0", borderBottom: i < Math.min(rc.alerts.length, 5) - 1 ? "1px solid var(--border-default)" : "none" }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                                      <SeverityBadge level={alert.severity || alert.level || "MEDIUM"} />
                                      <span style={{ fontSize: "0.7rem", color: "var(--text-primary)", flex: 1 }}>{alert.title || alert.message || "Alert"}</span>
                                    </div>
                                    {alert.suggested_action && <div style={{ fontSize: "0.6rem", color: "var(--accent)", marginTop: "0.1rem" }}>💡 {alert.suggested_action}</div>}
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Platform Performance */}
                            {rc.platformPerf.length > 0 && (
                              <div style={{ marginBottom: "0.5rem", padding: "0.5rem 0.6rem", background: "var(--bg-card)", borderRadius: "0.5rem", border: "1px solid var(--border-default)" }}>
                                <div style={{ fontSize: "0.55rem", textTransform: "uppercase", letterSpacing: "0.1em", color: pm.color, fontWeight: 700, marginBottom: "0.3rem" }}>Platform Performance</div>
                                <div style={{ overflowX: "auto" }}>
                                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.68rem" }}>
                                    <thead>
                                      <tr style={{ borderBottom: "1px solid var(--border-default)" }}>
                                        <th style={{ textAlign: "left", padding: "0.2rem 0.3rem", color: "var(--text-muted)", fontWeight: 600 }}>Platform</th>
                                        <th style={{ textAlign: "center", padding: "0.2rem 0.3rem", color: "var(--text-muted)", fontWeight: 600 }}>Active</th>
                                        <th style={{ textAlign: "right", padding: "0.2rem 0.3rem", color: "var(--text-muted)", fontWeight: 600 }}>Avg $</th>
                                        <th style={{ textAlign: "right", padding: "0.2rem 0.3rem", color: "var(--text-muted)", fontWeight: 600 }}>Days</th>
                                        <th style={{ textAlign: "right", padding: "0.2rem 0.3rem", color: "var(--text-muted)", fontWeight: 600 }}>Competition</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {rc.platformPerf.slice(0, 8).map((pl: any, i: number) => (
                                        <tr key={i} style={{ borderBottom: "1px solid var(--border-default)" }}>
                                          <td style={{ padding: "0.25rem 0.3rem", color: "var(--text-primary)", fontWeight: 600 }}>{pl.platform || "Unknown"}</td>
                                          <td style={{ padding: "0.25rem 0.3rem", textAlign: "center", color: "var(--text-secondary)" }}>{pl.active_count != null ? pl.active_count : "—"}</td>
                                          <td style={{ padding: "0.25rem 0.3rem", textAlign: "right", color: "var(--accent)", fontWeight: 600 }}>{pl.avg_price != null || pl.recommended_price != null ? `$${pl.avg_price || pl.recommended_price}` : "—"}</td>
                                          <td style={{ padding: "0.25rem 0.3rem", textAlign: "right", color: "var(--text-muted)" }}>{pl.avg_days_to_sell != null ? `~${pl.avg_days_to_sell}d` : "—"}</td>
                                          <td style={{ padding: "0.25rem 0.3rem", textAlign: "right" }}>
                                            <span style={{ color: (pl.competition_level || "").toLowerCase() === "high" ? "#ef4444" : (pl.competition_level || "").toLowerCase() === "medium" ? "#f59e0b" : "#4ade80", fontSize: "0.62rem", fontWeight: 600 }}>
                                              {pl.competition_level || "—"}
                                            </span>
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            )}

                            {/* Strategies observed */}
                            {rc.strategies.length > 0 && (
                              <div style={{ marginBottom: "0.5rem", padding: "0.5rem 0.6rem", background: "linear-gradient(135deg, rgba(139,92,246,0.04), rgba(0,188,212,0.02))", borderRadius: "0.5rem", border: "1px solid rgba(139,92,246,0.15)" }}>
                                <div style={{ fontSize: "0.55rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "#a855f7", fontWeight: 700, marginBottom: "0.35rem" }}>Competitor Strategies Observed</div>
                                <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
                                  {rc.strategies.slice(0, 4).map((s: any, i: number) => (
                                    <div key={i} style={{ padding: "0.3rem", borderRadius: "0.3rem", background: "var(--bg-card)", border: "1px solid var(--border-default)" }}>
                                      <div style={{ fontSize: "0.62rem", fontWeight: 600, color: "var(--text-primary)" }}>⚔️ {s.strategy_name || s.strategy || s.tactic || "Strategy"}</div>
                                      {(s.description || s.detail) && <div style={{ fontSize: "0.6rem", color: "var(--text-muted)", marginTop: "0.1rem" }}>{typeof (s.description || s.detail) === "string" && (s.description || s.detail).length > 120 ? (s.description || s.detail).slice(0, 120) + "..." : (s.description || s.detail)}</div>}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Executive summary */}
                            {rc.executiveSummary && (
                              <div style={{ padding: "0.4rem 0.6rem", background: `${pm.color}08`, borderRadius: "0.4rem", borderLeft: `3px solid ${pm.color}50` }}>
                                <div style={{ fontSize: "0.55rem", textTransform: "uppercase", letterSpacing: "0.1em", color: pm.color, fontWeight: 700, marginBottom: "0.15rem" }}>{pm.icon} What {pm.label} Found</div>
                                <p style={{ fontSize: "0.68rem", color: "var(--text-secondary)", margin: 0, lineHeight: 1.4, fontStyle: "italic" }}>
                                  &ldquo;{typeof rc.executiveSummary === "string" && rc.executiveSummary.length > 300 ? rc.executiveSummary.slice(0, 300) + "..." : rc.executiveSummary}&rdquo;
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
                    <div style={{ fontSize: "0.55rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "#a855f7", fontWeight: 700, marginBottom: "0.3rem" }}>Competitive Intelligence Comparison</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.15rem", fontSize: "0.7rem" }}>
                      {successful.map((p: any, i: number) => {
                        const pm = MEGA_PROVIDER_META[p.provider];
                        const rc2 = allRecon[i];
                        return (
                          <span key={p.provider} style={{ color: pm?.color || "var(--text-secondary)" }}>
                            {pm?.icon} {pm?.label}: {rc2.competitorCount} competitors · {rc2.platformCount} platforms · {rc2.alertCount} alerts
                          </span>
                        );
                      })}
                      <span style={{ fontSize: "0.65rem", fontWeight: 700, color: "#4caf50", marginTop: "0.1rem" }}>
                        ✅ Combined: ~{totalCompetitors} competitors · {totalPlatforms} platforms · {totalAlerts} alerts
                      </span>
                    </div>
                  </div>
                )}

                {/* Summary */}
                <div style={{ background: "rgba(139,92,246,0.04)", borderLeft: "3px solid rgba(139,92,246,0.3)", borderRadius: "0 0.5rem 0.5rem 0", padding: "0.65rem 0.85rem", marginBottom: "0.5rem" }}>
                  <div style={{ fontSize: "0.6rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "#a855f7", fontWeight: 700, marginBottom: "0.3rem" }}>MegaBot Recon Summary</div>
                  <p style={{ fontSize: "0.78rem", lineHeight: 1.55, color: "var(--text-secondary)", margin: 0 }}>
                    {(() => {
                      const parts: string[] = [];
                      parts.push(`${successful.length} AI recon specialists found ${totalCompetitors} competitors across ${totalPlatforms} platforms with ${totalAlerts} active alerts.`);
                      if (agree >= 80) parts.push(`Strong consensus (${agree}%) on competitive landscape.`);
                      for (let i = 0; i < successful.length && parts.length < 6; i++) {
                        const rc2 = allRecon[i];
                        const label = MEGA_PROVIDER_META[successful[i].provider]?.label || successful[i].provider;
                        if (rc2.executiveSummary && typeof rc2.executiveSummary === "string") {
                          const sentences = rc2.executiveSummary.split(/(?<=[.!?])\s+/).slice(0, 1).join(" ");
                          if (sentences.length > 25) parts.push(`${label}: ${sentences}`);
                        }
                      }
                      return parts.join(" ");
                    })()}
                  </p>
                </div>

                {/* Re-run */}
                <div style={{ textAlign: "center" }}>
                  <button onClick={runMegaReconBot} style={{
                    padding: "0.4rem 1rem", fontSize: "0.72rem", borderRadius: "0.4rem", fontWeight: 600,
                    background: "rgba(167,139,250,0.1)", border: "1px solid rgba(167,139,250,0.25)", color: "#a78bfa", cursor: "pointer",
                  }}>
                    Re-Run MegaBot — 3 cr
                  </button>
                </div>
              </Card>
            );
          })()}

          {/* ═══ Scan History ═══ */}
          {item?.scanHistory && item.scanHistory.length > 0 && (
            <div style={{ marginTop: "0.5rem" }}>
              <AccordionHeader
                id="scan-history"
                icon="📜"
                title="SCAN HISTORY"
                subtitle={`${item.scanHistory.length} scans`}
                isOpen={openSections.has("scan-history")}
                onToggle={toggleSection}
              />
              {openSections.has("scan-history") && (
                <Card>
                  {item.scanHistory.map((scan: any, i: number) => (
                    <div key={scan.id || i} style={{
                      display: "flex", justifyContent: "space-between", alignItems: "center",
                      padding: "0.4rem 0.5rem",
                      borderBottom: i < item.scanHistory!.length - 1
                        ? "1px solid var(--border-default)" : "none",
                      fontSize: "0.6rem",
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                        <span style={{
                          padding: "2px 6px", borderRadius: "4px", fontSize: "0.5rem", fontWeight: 600,
                          background: scan.type === "MEGABOT_RECONBOT" ? "rgba(139,92,246,0.1)"
                            : scan.type === "RECONBOT_SCAN" ? "rgba(245,158,11,0.1)"
                            : "rgba(0,188,212,0.1)",
                          color: scan.type === "MEGABOT_RECONBOT" ? "#8b5cf6"
                            : scan.type === "RECONBOT_SCAN" ? "#f59e0b"
                            : "#00bcd4",
                        }}>
                          {scan.type === "MEGABOT_RECONBOT" ? "⚡ MegaBot"
                            : scan.type === "RECONBOT_SCAN" ? "🔄 Auto-Scan"
                            : "🔍 Manual"}
                        </span>
                      </div>
                      <div style={{ color: "var(--text-muted)", fontSize: "0.55rem" }}>
                        {new Date(scan.createdAt).toLocaleDateString()}{" "}
                        {new Date(scan.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </div>
                  ))}
                </Card>
              )}
            </div>
          )}

          {/* ═══ SECTION L: Executive Summary ═══ */}
          {data.executive_summary && (
            <Card style={{ background: "rgba(0,188,212,0.04)", border: "1px solid rgba(0,188,212,0.2)" }}>
              <SectionLabel icon="📋" label="Executive Summary" />
              <div style={{ fontSize: "0.85rem", color: "var(--text-primary)", lineHeight: 1.7, fontWeight: 500 }}>
                {data.executive_summary}
              </div>
            </Card>
          )}

          {/* ═══ SECTION M: Actions ═══ */}
          <Card>
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", justifyContent: "center" }}>
              <button
                onClick={runScan}
                style={{
                  padding: "0.55rem 1.5rem", borderRadius: "0.5rem", fontSize: "0.82rem", fontWeight: 700,
                  background: "linear-gradient(135deg, #8b5cf6, #7c3aed)", border: "none", color: "#fff",
                  cursor: "pointer", boxShadow: "0 4px 12px rgba(139,92,246,0.25)",
                }}
              >
                🔍 Run Updated Scan
              </button>
              {item && (
                <a
                  href={`/items/${item.id}`}
                  style={{
                    display: "inline-flex", alignItems: "center",
                    padding: "0.55rem 1.2rem", borderRadius: "0.5rem", fontSize: "0.82rem", fontWeight: 600,
                    background: "var(--ghost-bg)", border: "1px solid var(--border-default)",
                    color: "var(--text-secondary)", textDecoration: "none", cursor: "pointer",
                  }}
                >
                  View Item →
                </a>
              )}
            </div>
            {data._isDemo && (
              <div style={{ textAlign: "center", marginTop: "0.5rem", fontSize: "0.65rem", color: "var(--text-muted)" }}>
                🎮 Demo mode — using simulated market data
              </div>
            )}
            {item?.reconBotRunAt && (
              <div style={{ textAlign: "center", marginTop: "0.3rem", fontSize: "0.65rem", color: "var(--text-muted)" }}>
                Last scan: {new Date(item.reconBotRunAt).toLocaleString()}
              </div>
            )}
          </Card>
        </div>
      )}

      {selectedId && (
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
      )}

      {/* ── Sticky Bottom Action Bar ── */}
      {selectedId && item && (
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
            <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--text-primary)", overflow: "hidden", whiteSpace: "nowrap" as const, textOverflow: "ellipsis" }}>
              {item.title}
            </span>
          </div>
          <div style={{ display: "flex", gap: "0.5rem", flexShrink: 0 }}>
            <button
              onClick={runScan}
              disabled={loading}
              style={{
                padding: "0.45rem 1rem", fontSize: "0.75rem", fontWeight: 700,
                borderRadius: "10px", cursor: loading ? "not-allowed" : "pointer",
                background: loading ? "var(--ghost-bg)" : "linear-gradient(135deg, #00bcd4, #0097a7)",
                border: "none", color: "#fff", minHeight: "44px",
                boxShadow: loading ? "none" : "0 2px 10px rgba(0,188,212,0.3)",
              }}
            >
              {loading ? "Scanning..." : stored ? "🔄 Re-Run · 1 cr" : "🔍 Run · 1 cr"}
            </button>
            <button
              onClick={runScan}
              disabled={loading}
              style={{
                padding: "0.45rem 1rem", fontSize: "0.75rem", fontWeight: 700,
                borderRadius: "10px", cursor: loading ? "not-allowed" : "pointer",
                background: loading ? "var(--ghost-bg)" : "linear-gradient(135deg, rgba(0,188,212,0.2), rgba(0,151,167,0.15))",
                border: "1px solid rgba(0,188,212,0.4)", color: "#00bcd4", minHeight: "44px",
              }}
            >
              {loading ? "Running..." : "⚡ MegaBot · 3 cr"}
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

          {/* ── Auto-Scan Premium Toggle ─────────────────────── */}
          {item?.reconBot && (
            <AutoScanToggle
              reconBot={item.reconBot}
              itemId={item.id}
              userTier={userTier}
            />
          )}
        </div>
      )}
    </>
  );
}

function AutoScanToggle({ reconBot, itemId, userTier }: {
  reconBot: NonNullable<ItemData["reconBot"]>;
  itemId: string;
  userTier: number;
}) {
  const [autoScan, setAutoScan] = useState(reconBot.autoScanEnabled);
  const [toggling, setToggling] = useState(false);

  // Sync if parent data changes
  useEffect(() => {
    setAutoScan(reconBot.autoScanEnabled);
  }, [reconBot.autoScanEnabled]);

  async function handleToggle() {
    setToggling(true);
    try {
      // We need the bot id — fetch it
      const activateRes = await fetch(`/api/recon/${itemId}`);
      const activateData = await activateRes.json().catch(() => ({}));
      const botId = activateData?.bot?.id;
      if (!botId) { setToggling(false); return; }

      const res = await fetch(`/api/recon/scan/${botId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "toggleAutoScan" }),
      });
      const data = await res.json().catch(() => ({}));
      if (data.ok && data.bot) {
        setAutoScan(data.bot.autoScanEnabled);
      } else if (data.error) {
        alert(data.error);
      }
    } finally {
      setToggling(false);
    }
  }

  function timeAgo(isoStr: string | null): string {
    if (!isoStr) return "—";
    const diff = Date.now() - new Date(isoStr).getTime();
    const min = Math.floor(diff / 60000);
    if (min < 1) return "just now";
    if (min < 60) return `${min}m ago`;
    const hr = Math.floor(min / 60);
    if (hr < 24) return `${hr}h ago`;
    return `${Math.floor(hr / 24)}d ago`;
  }

  return (
    <div style={{
      marginTop: "0.75rem",
      padding: "0.75rem 1rem",
      background: autoScan
        ? "linear-gradient(135deg, rgba(0,188,212,0.06) 0%, rgba(15,118,110,0.06) 100%)"
        : "var(--bg-card)",
      border: autoScan
        ? "1.5px solid rgba(0,188,212,0.3)"
        : "1px solid var(--border-default)",
      borderRadius: "0.75rem",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: "0.75rem",
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", marginBottom: "0.15rem" }}>
          <span style={{ fontSize: "0.75rem" }}>⚡</span>
          <span style={{ fontWeight: 700, fontSize: "0.72rem", color: "var(--text-primary)" }}>Auto-Scan</span>
          {userTier < 3 && (
            <span style={{
              fontSize: "0.52rem", fontWeight: 700, padding: "1px 5px",
              borderRadius: "4px", background: "rgba(217,119,6,0.12)", color: "#d97706",
            }}>PRO+</span>
          )}
        </div>
        <div style={{ fontSize: "0.62rem", color: "var(--text-muted)", lineHeight: 1.4 }}>
          {autoScan
            ? `Active — next scan ${timeAgo(reconBot.nextScan)} · 1 credit/scan`
            : userTier >= 3
              ? "Auto-scan every 6 hours · 1 credit per scan"
              : "Upgrade to Power Seller to enable"}
        </div>
      </div>
      <button
        onClick={handleToggle}
        disabled={toggling || userTier < 3}
        style={{
          position: "relative",
          width: "40px", height: "22px",
          borderRadius: "11px", border: "none",
          background: autoScan ? "#00bcd4" : "var(--border-default)",
          cursor: toggling || userTier < 3 ? "not-allowed" : "pointer",
          transition: "background 0.25s ease",
          flexShrink: 0,
          opacity: userTier < 3 ? 0.5 : 1,
        }}
        title={userTier < 3 ? "Requires Power Seller (tier 3+)" : autoScan ? "Disable" : "Enable"}
      >
        <div style={{
          position: "absolute", top: "2px",
          left: autoScan ? "20px" : "2px",
          width: "18px", height: "18px",
          borderRadius: "50%", background: "#fff",
          boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
          transition: "left 0.25s ease",
        }} />
      </button>
    </div>
  );
}
