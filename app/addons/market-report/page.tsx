"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";

const AI_ENGINES = [
  { key: "openai", name: "GPT-4o", color: "#10a37f", label: "Pricing", icon: "💰", runLabel: "Analyzing Pricing..." },
  { key: "claude", name: "Claude", color: "#8b5cf6", label: "Value", icon: "📖", runLabel: "Finding Value..." },
  { key: "gemini", name: "Gemini", color: "#4285f4", label: "Demand", icon: "🔍", runLabel: "Reading Demand..." },
  { key: "grok", name: "Grok", color: "#ff6600", label: "Social", icon: "📱", runLabel: "Scanning Trends..." },
];

const TABS = [
  { key: "pricing", label: "Pricing", icon: "💰", color: "#10a37f" },
  { key: "value", label: "Value", icon: "📖", color: "#8b5cf6" },
  { key: "demand", label: "Demand", icon: "🔍", color: "#4285f4" },
  { key: "social", label: "Social", icon: "📱", color: "#ff6600" },
];

function getScoreColor(score: number): string {
  if (score >= 80) return "#4caf50";
  if (score >= 60) return "#00bcd4";
  if (score >= 40) return "#ff9800";
  return "#f44336";
}

function getTrendIcon(trend: string): string {
  if (trend === "rising") return "📈";
  if (trend === "falling") return "📉";
  return "➡️";
}

function getTrendColor(trend: string): string {
  if (trend === "rising") return "#4caf50";
  if (trend === "falling") return "#f44336";
  return "#ff9800";
}

function MarketReportInner() {
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<any>(null);
  const [engineStatuses, setEngineStatuses] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState("pricing");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [itemCount, setItemCount] = useState<number | null>(null);

  // Check for cached report on mount
  useEffect(() => {
    Promise.all([
      fetch("/api/addons/market-report").then(r => r.json()).catch(() => ({ noReport: true })),
      fetch("/api/items").then(r => r.json()).catch(() => []),
    ]).then(([cached, items]) => {
      if (cached && !cached.noReport && !cached.error) {
        setReport(cached);
      }
      const arr = Array.isArray(items) ? items : items.items || [];
      setItemCount(arr.length);
      setInitialLoading(false);
    });
  }, []);

  async function generateReport() {
    setLoading(true);
    setReport(null);
    setEngineStatuses({ openai: "running", claude: "running", gemini: "running", grok: "running" });

    try {
      const res = await fetch("/api/addons/market-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();

      if (res.ok && data.inventoryHealthScore !== undefined) {
        const statuses: Record<string, string> = {};
        for (const agent of data.agentResults || []) {
          statuses[agent.provider] = agent.status === "success" ? "complete" : "failed";
        }
        setEngineStatuses(statuses);
        setReport(data);
      } else {
        setEngineStatuses({ openai: "failed", claude: "failed", gemini: "failed", grok: "failed" });
        alert(data.error || "Report generation failed");
      }
    } catch {
      alert("Network error");
    }
    setLoading(false);
  }

  function copyText(text: string, id: string) {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  const healthScore = report?.inventoryHealthScore || 0;
  const scoreColor = getScoreColor(healthScore);
  const circumference = 2 * Math.PI * 60;
  const scoreOffset = circumference - (circumference * healthScore) / 100;

  // Compute status badge counts
  const wellPriced = (report?.priceAdjustments || []).filter((a: any) => {
    const diff = Math.abs((a.recommended || 0) - (a.current || 0));
    return diff < (a.current || 1) * 0.1;
  }).length;
  const attention = (report?.priceAdjustments || []).filter((a: any) => {
    const diff = Math.abs((a.recommended || 0) - (a.current || 0));
    return diff >= (a.current || 1) * 0.1 && diff < (a.current || 1) * 0.3;
  }).length;
  const urgent = (report?.priceAdjustments || []).filter((a: any) => {
    const diff = Math.abs((a.recommended || 0) - (a.current || 0));
    return diff >= (a.current || 1) * 0.3;
  }).length;

  const cachedDate = report?.cachedAt
    ? new Date(report.cachedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" })
    : report?.reportDate
      ? new Date(report.reportDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" })
      : null;

  if (initialLoading) {
    return (
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "80px 20px", textAlign: "center" }}>
        <div style={{ fontSize: 14, color: "var(--text-muted)" }}>Loading market report...</div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 20px 60px" }}>
      {/* HEADER */}
      <div
        style={{
          background: "linear-gradient(135deg, rgba(0,188,212,0.1), transparent)",
          borderBottom: "1px solid rgba(0,188,212,0.15)",
          padding: "28px 0",
          marginBottom: 28,
        }}
      >
        <div style={{ textAlign: "center", marginTop: "1.5rem", marginBottom: "1rem" }}>
          <Link href="/marketplace" style={{
            display: "inline-flex", alignItems: "center", gap: "0.35rem",
            fontSize: "0.875rem", fontWeight: 500, color: "var(--accent)",
            textDecoration: "none", padding: "0.5rem 1rem", borderRadius: "0.5rem",
            border: "1px solid var(--border-default)", transition: "border-color 0.15s ease",
          }}>
            ← Back to Marketplace
          </Link>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 800, color: "var(--text-primary)", margin: 0 }}>
              AI Market Intelligence Report
            </h1>
            <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 6 }}>
              4 AI engines analyzing your full inventory for pricing, value, demand, and trends
            </p>
            {cachedDate && !loading && (
              <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>
                Last generated: {cachedDate}
              </p>
            )}
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            {AI_ENGINES.map((e) => (
              <span
                key={e.key}
                style={{
                  fontSize: 9,
                  padding: "3px 10px",
                  borderRadius: 20,
                  background: `${e.color}22`,
                  border: `1px solid ${e.color}44`,
                  color: e.color,
                  fontWeight: 700,
                }}
              >
                {e.name}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* GENERATE PANEL (no cached report and not loading) */}
      {!report && !loading && (
        <div
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border-default)",
            borderRadius: 14,
            padding: 32,
            marginBottom: 28,
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: 40, marginBottom: 16 }}>📊</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: "var(--text-primary)", marginBottom: 8 }}>
            Generate Your Market Report
          </div>
          <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 24, maxWidth: 500, margin: "0 auto 24px" }}>
            Analyze your entire inventory across all 4 AI engines for pricing accuracy, hidden value, market demand, and social trends.
          </p>

          {/* Inventory preview stats */}
          <div style={{ display: "flex", justifyContent: "center", gap: 16, marginBottom: 28, flexWrap: "wrap" }}>
            <div
              style={{
                background: "rgba(0,188,212,0.08)",
                border: "1px solid rgba(0,188,212,0.18)",
                borderRadius: 10,
                padding: "12px 24px",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: 24, fontWeight: 800, color: "#00bcd4" }}>{itemCount || 0}</div>
              <div style={{ fontSize: 10, color: "var(--text-muted)" }}>Items in Inventory</div>
            </div>
            <div
              style={{
                background: "rgba(139,92,246,0.08)",
                border: "1px solid rgba(139,92,246,0.18)",
                borderRadius: 10,
                padding: "12px 24px",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: 24, fontWeight: 800, color: "#8b5cf6" }}>4</div>
              <div style={{ fontSize: 10, color: "var(--text-muted)" }}>AI Engines</div>
            </div>
            <div
              style={{
                background: "rgba(255,152,0,0.08)",
                border: "1px solid rgba(255,152,0,0.18)",
                borderRadius: 10,
                padding: "12px 24px",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: 24, fontWeight: 800, color: "#ff9800" }}>~30s</div>
              <div style={{ fontSize: 10, color: "var(--text-muted)" }}>Est. Time</div>
            </div>
          </div>

          <button
            onClick={generateReport}
            disabled={!itemCount || itemCount === 0}
            style={{
              padding: "0 40px",
              height: 56,
              background: itemCount ? "linear-gradient(135deg, #00bcd4, #0097a7)" : "var(--text-muted)",
              color: itemCount ? "#000" : "var(--text-muted)",
              fontWeight: 800,
              fontSize: 16,
              borderRadius: 12,
              border: "none",
              cursor: itemCount ? "pointer" : "not-allowed",
              boxShadow: itemCount ? "0 4px 20px rgba(0,188,212,0.4)" : "none",
            }}
          >
            Generate Full Report
          </button>
          {(!itemCount || itemCount === 0) && (
            <div style={{ fontSize: 11, color: "#f44336", marginTop: 12 }}>
              Add items to your inventory first to generate a report.
            </div>
          )}
        </div>
      )}

      {/* AI ENGINES RUNNING */}
      {loading && (
        <div style={{ marginBottom: 28 }}>
          <div style={{ textAlign: "center", fontSize: 18, fontWeight: 700, color: "var(--text-primary)", marginBottom: 20 }}>
            4 AI Engines Analyzing Your Inventory...
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 16 }}>
            {AI_ENGINES.map((e) => {
              const status = engineStatuses[e.key] || "running";
              return (
                <div
                  key={e.key}
                  style={{
                    background: "var(--ghost-bg)",
                    border: `1px solid ${status === "complete" ? "#4caf50" : status === "failed" ? "#f44336" : "var(--border-default)"}`,
                    borderRadius: 12,
                    padding: 16,
                    textAlign: "center",
                  }}
                >
                  <div style={{ fontSize: 20, marginBottom: 4 }}>{e.icon}</div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: e.color, marginBottom: 4 }}>{e.name}</div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                    {status === "running" ? e.runLabel : status === "complete" ? "Done" : "Failed"}
                  </div>
                  <div style={{ fontSize: 18, marginTop: 4 }}>
                    {status === "complete" ? "✅" : status === "failed" ? "❌" : "⏳"}
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{ height: 4, borderRadius: 2, background: "var(--ghost-bg)", overflow: "hidden" }}>
            <div
              style={{
                width: "60%",
                height: "100%",
                background: "linear-gradient(90deg, #00bcd4, #00e5ff)",
                borderRadius: 2,
                animation: "pulse 1.5s infinite",
              }}
            />
          </div>
        </div>
      )}

      {/* REPORT RESULTS */}
      {report && !loading && (
        <>
          {/* HEALTH SCORE HERO */}
          <div
            style={{
              background: "linear-gradient(135deg, rgba(0,188,212,0.06), rgba(255,255,255,0.02))",
              border: "1px solid rgba(0,188,212,0.15)",
              borderRadius: 18,
              padding: "36px 28px",
              marginBottom: 28,
              textAlign: "center",
            }}
          >
            {/* Score Ring */}
            <div style={{ position: "relative", width: 140, height: 140, margin: "0 auto 20px" }}>
              <svg width="140" height="140" viewBox="0 0 140 140" style={{ transform: "rotate(-90deg)" }}>
                <circle cx="70" cy="70" r="60" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
                <circle
                  cx="70"
                  cy="70"
                  r="60"
                  fill="none"
                  stroke={scoreColor}
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={scoreOffset}
                  style={{ transition: "stroke-dashoffset 1s ease" }}
                />
              </svg>
              <div
                style={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  textAlign: "center",
                }}
              >
                <div style={{ fontSize: 36, fontWeight: 800, color: "var(--text-primary)", lineHeight: 1 }}>{healthScore}</div>
                <div style={{ fontSize: 9, color: "var(--text-muted)", marginTop: 2 }}>HEALTH</div>
              </div>
            </div>

            {/* Stat pills */}
            <div style={{ display: "flex", justifyContent: "center", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
              <div style={{ background: "rgba(0,188,212,0.1)", border: "1px solid rgba(0,188,212,0.2)", borderRadius: 10, padding: "10px 18px", textAlign: "center" }}>
                <div style={{ fontSize: 20, fontWeight: 800, color: "#00bcd4" }}>{report.totalItems}</div>
                <div style={{ fontSize: 9, color: "var(--text-muted)" }}>Items</div>
              </div>
              <div style={{ background: "rgba(76,175,80,0.1)", border: "1px solid rgba(76,175,80,0.2)", borderRadius: 10, padding: "10px 18px", textAlign: "center" }}>
                <div style={{ fontSize: 20, fontWeight: 800, color: "#4caf50" }}>${(report.totalEstimatedValue || 0).toLocaleString()}</div>
                <div style={{ fontSize: 9, color: "var(--text-muted)" }}>Est. Value</div>
              </div>
              <div style={{ background: "rgba(255,152,0,0.1)", border: "1px solid rgba(255,152,0,0.2)", borderRadius: 10, padding: "10px 18px", textAlign: "center" }}>
                <div style={{ fontSize: 20, fontWeight: 800, color: "#ff9800" }}>${(report.revenuePotential || 0).toLocaleString()}</div>
                <div style={{ fontSize: 9, color: "var(--text-muted)" }}>Revenue Potential</div>
              </div>
              <div style={{ background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.2)", borderRadius: 10, padding: "10px 18px", textAlign: "center" }}>
                <div style={{ fontSize: 20, fontWeight: 800, color: report.revenueGap > 0 ? "#4caf50" : "#f44336" }}>
                  {report.revenueGap > 0 ? "+" : ""}${(report.revenueGap || 0).toLocaleString()}
                </div>
                <div style={{ fontSize: 9, color: "var(--text-muted)" }}>Revenue Gap</div>
              </div>
            </div>

            {/* Status badges */}
            <div style={{ display: "flex", justifyContent: "center", gap: 10, flexWrap: "wrap" }}>
              <span style={{ fontSize: 10, padding: "4px 12px", borderRadius: 20, background: "rgba(76,175,80,0.12)", border: "1px solid rgba(76,175,80,0.3)", color: "#4caf50", fontWeight: 700 }}>
                {wellPriced} Well-Priced
              </span>
              <span style={{ fontSize: 10, padding: "4px 12px", borderRadius: 20, background: "rgba(255,152,0,0.12)", border: "1px solid rgba(255,152,0,0.3)", color: "#ff9800", fontWeight: 700 }}>
                {attention} Need Attention
              </span>
              <span style={{ fontSize: 10, padding: "4px 12px", borderRadius: 20, background: "rgba(244,67,54,0.12)", border: "1px solid rgba(244,67,54,0.3)", color: "#f44336", fontWeight: 700 }}>
                {urgent} Urgent
              </span>
            </div>
          </div>

          {/* AI AGENT BREAKDOWN */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 24 }}>
            {(report.agentResults || []).map((agent: any) => {
              const engine = AI_ENGINES.find((e) => e.key === agent.provider);
              return (
                <div
                  key={agent.provider}
                  style={{
                    background: "var(--bg-card)",
                    border: "1px solid var(--border-default)",
                    borderRadius: 10,
                    padding: 12,
                    textAlign: "center",
                  }}
                >
                  <div style={{ fontSize: 11, fontWeight: 700, color: engine?.color || "var(--text-primary)" }}>
                    {engine?.name || agent.provider}
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: "var(--text-primary)", margin: "4px 0" }}>
                    {agent.score || "—"}
                  </div>
                  <div style={{ fontSize: 9, color: agent.status === "success" ? "#4caf50" : "#f44336" }}>
                    {agent.status} · {Math.round(agent.ms / 1000)}s
                  </div>
                </div>
              );
            })}
          </div>

          {/* AI SUMMARIES */}
          {report.summaries?.length > 0 && (
            <div
              style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border-default)",
                borderRadius: 14,
                padding: 20,
                marginBottom: 28,
              }}
            >
              <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", marginBottom: 14 }}>
                AI Executive Summaries
              </div>
              {report.summaries.map((s: any, i: number) => {
                const engine = AI_ENGINES.find((e) => e.key === s.provider);
                return (
                  <div
                    key={i}
                    style={{
                      background: "var(--bg-card)",
                      border: "1px solid var(--border-default)",
                      borderLeft: `3px solid ${engine?.color || "#00bcd4"}`,
                      borderRadius: 8,
                      padding: 14,
                      marginBottom: i < report.summaries.length - 1 ? 10 : 0,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                      <span style={{ fontSize: 9, padding: "2px 8px", borderRadius: 20, background: `${engine?.color || "#00bcd4"}22`, border: `1px solid ${engine?.color || "#00bcd4"}44`, color: engine?.color || "#00bcd4", fontWeight: 700 }}>
                        {engine?.name || s.provider}
                      </span>
                      <span style={{ fontSize: 9, color: "var(--text-muted)" }}>{Math.round(s.ms / 1000)}s</span>
                    </div>
                    <div style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.7 }}>
                      {s.summary || "No summary provided."}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* 4 AI PERSPECTIVE TABS */}
          <div style={{ marginBottom: 28 }}>
            <div style={{ display: "flex", gap: 4, marginBottom: 16 }}>
              {TABS.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  style={{
                    flex: 1,
                    padding: "10px 0",
                    background: activeTab === tab.key ? `${tab.color}18` : "var(--text-muted)",
                    border: `1px solid ${activeTab === tab.key ? `${tab.color}44` : "var(--text-muted)"}`,
                    borderRadius: 10,
                    color: activeTab === tab.key ? tab.color : "var(--text-muted)",
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: "pointer",
                    transition: "all 0.15s",
                  }}
                >
                  <span style={{ marginRight: 4 }}>{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Content: Pricing */}
            {activeTab === "pricing" && (
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", marginBottom: 12 }}>
                  Price Adjustments
                </div>
                {(report.priceAdjustments || []).length === 0 && (
                  <div style={{ fontSize: 12, color: "var(--text-muted)", padding: 20, textAlign: "center" }}>
                    No price adjustments recommended.
                  </div>
                )}
                {(report.priceAdjustments || []).map((adj: any, i: number) => {
                  const diff = (adj.recommended || 0) - (adj.current || 0);
                  const isUp = diff > 0;
                  return (
                    <div
                      key={i}
                      style={{
                        background: "var(--bg-card)",
                        border: "1px solid var(--border-default)",
                        borderLeft: `4px solid ${isUp ? "#4caf50" : diff < 0 ? "#f44336" : "#ff9800"}`,
                        borderRadius: 10,
                        padding: "14px 18px",
                        marginBottom: 8,
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        flexWrap: "wrap",
                        gap: 8,
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 200 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>{adj.title || "Item"}</div>
                        <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>{adj.reasoning || ""}</div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ textAlign: "center" }}>
                          <div style={{ fontSize: 10, color: "var(--text-muted)" }}>Current</div>
                          <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text-muted)" }}>${adj.current || 0}</div>
                        </div>
                        <div style={{ fontSize: 16, color: isUp ? "#4caf50" : "#f44336" }}>{isUp ? "→" : "→"}</div>
                        <div style={{ textAlign: "center" }}>
                          <div style={{ fontSize: 10, color: "var(--text-muted)" }}>Suggested</div>
                          <div style={{ fontSize: 16, fontWeight: 700, color: isUp ? "#4caf50" : "#f44336" }}>${adj.recommended || 0}</div>
                        </div>
                        <span
                          style={{
                            fontSize: 10,
                            padding: "3px 10px",
                            borderRadius: 20,
                            background: isUp ? "rgba(76,175,80,0.12)" : "rgba(244,67,54,0.12)",
                            border: `1px solid ${isUp ? "#4caf50" : "#f44336"}`,
                            color: isUp ? "#4caf50" : "#f44336",
                            fontWeight: 700,
                          }}
                        >
                          {isUp ? "+" : ""}{diff}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Tab Content: Value */}
            {activeTab === "value" && (
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", marginBottom: 12 }}>
                  Hidden Value & Story Opportunities
                </div>
                {(report.topOpportunities || []).length === 0 && (
                  <div style={{ fontSize: 12, color: "var(--text-muted)", padding: 20, textAlign: "center" }}>
                    No hidden value opportunities found.
                  </div>
                )}
                {(report.topOpportunities || []).map((opp: any, i: number) => (
                  <div
                    key={i}
                    style={{
                      background: "rgba(139,92,246,0.04)",
                      border: "1px solid rgba(139,92,246,0.15)",
                      borderRadius: 12,
                      padding: 16,
                      marginBottom: 10,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                      <span style={{ fontSize: 14 }}>📖</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>{opp.title || "Opportunity"}</span>
                      {opp.priority && (
                        <span
                          style={{
                            fontSize: 9,
                            padding: "2px 8px",
                            borderRadius: 20,
                            background: opp.priority === 1 ? "rgba(244,67,54,0.12)" : opp.priority === 2 ? "rgba(255,152,0,0.12)" : "rgba(76,175,80,0.12)",
                            border: `1px solid ${opp.priority === 1 ? "#f44336" : opp.priority === 2 ? "#ff9800" : "#4caf50"}`,
                            color: opp.priority === 1 ? "#f44336" : opp.priority === 2 ? "#ff9800" : "#4caf50",
                            fontWeight: 700,
                          }}
                        >
                          P{opp.priority}
                        </span>
                      )}
                      {opp.impact && (
                        <span style={{ fontSize: 11, color: "#4caf50", fontWeight: 700, marginLeft: "auto" }}>
                          {opp.impact}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.6 }}>
                      {opp.action || ""}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Tab Content: Demand */}
            {activeTab === "demand" && (
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", marginBottom: 12 }}>
                  Category Trends & Demand Signals
                </div>
                {(report.categoryTrends || []).length === 0 && (
                  <div style={{ fontSize: 12, color: "var(--text-muted)", padding: 20, textAlign: "center" }}>
                    No demand trends detected.
                  </div>
                )}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 12 }}>
                  {(report.categoryTrends || []).map((trend: any, i: number) => (
                    <div
                      key={i}
                      style={{
                        background: "rgba(66,133,244,0.04)",
                        border: "1px solid rgba(66,133,244,0.15)",
                        borderRadius: 12,
                        padding: 16,
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                        <span style={{ fontSize: 16 }}>{getTrendIcon(trend.trend)}</span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>{trend.category || "Category"}</span>
                        <span
                          style={{
                            fontSize: 9,
                            padding: "2px 10px",
                            borderRadius: 20,
                            background: `${getTrendColor(trend.trend)}18`,
                            border: `1px solid ${getTrendColor(trend.trend)}44`,
                            color: getTrendColor(trend.trend),
                            fontWeight: 700,
                            marginLeft: "auto",
                            textTransform: "uppercase",
                          }}
                        >
                          {trend.trend || "stable"}
                        </span>
                      </div>
                      <div style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.6 }}>
                        {trend.insight || ""}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tab Content: Social */}
            {activeTab === "social" && (
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", marginBottom: 12 }}>
                  Social & Viral Potential
                </div>
                {/* Use opportunities tagged from Grok or show all opportunities as social angle */}
                {(report.topOpportunities || []).length === 0 && (report.categoryTrends || []).length === 0 && (
                  <div style={{ fontSize: 12, color: "var(--text-muted)", padding: 20, textAlign: "center" }}>
                    No social trending data detected.
                  </div>
                )}
                {(report.topOpportunities || []).map((opp: any, i: number) => (
                  <div
                    key={i}
                    style={{
                      background: "rgba(255,102,0,0.04)",
                      border: "1px solid rgba(255,102,0,0.15)",
                      borderRadius: 12,
                      padding: 16,
                      marginBottom: 10,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                      <span style={{ fontSize: 14 }}>📱</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>{opp.title || "Trend"}</span>
                      {opp.impact && (
                        <span style={{ fontSize: 11, color: "#ff6600", fontWeight: 700, marginLeft: "auto" }}>
                          {opp.impact}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.6 }}>
                      {opp.action || ""}
                    </div>
                  </div>
                ))}
                {(report.categoryTrends || []).filter((t: any) => t.trend === "rising").map((trend: any, i: number) => (
                  <div
                    key={`trend-${i}`}
                    style={{
                      background: "rgba(255,102,0,0.04)",
                      border: "1px solid rgba(255,102,0,0.12)",
                      borderRadius: 10,
                      padding: 14,
                      marginBottom: 8,
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                    }}
                  >
                    <span style={{ fontSize: 16 }}>🔥</span>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-primary)" }}>{trend.category}</div>
                      <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{trend.insight}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* TOP OPPORTUNITIES */}
          <div style={{ marginBottom: 28 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", marginBottom: 12 }}>
              Top Opportunities
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 12 }}>
              {(report.topOpportunities || []).slice(0, 3).map((opp: any, i: number) => {
                const priorityColors = ["#f44336", "#ff9800", "#4caf50"];
                const pColor = priorityColors[Math.min((opp.priority || 3) - 1, 2)];
                return (
                  <div
                    key={i}
                    style={{
                      background: "linear-gradient(135deg, rgba(0,188,212,0.05), rgba(255,255,255,0.02))",
                      border: "1px solid rgba(0,188,212,0.15)",
                      borderRadius: 14,
                      padding: 20,
                      position: "relative",
                    }}
                  >
                    <div
                      style={{
                        position: "absolute",
                        top: 12,
                        right: 12,
                        width: 24,
                        height: 24,
                        borderRadius: "50%",
                        background: `${pColor}22`,
                        border: `1px solid ${pColor}`,
                        color: pColor,
                        fontSize: 11,
                        fontWeight: 800,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {opp.priority || "?"}
                    </div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", marginBottom: 8, paddingRight: 32 }}>
                      {opp.title || "Opportunity"}
                    </div>
                    <div style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: 10 }}>
                      {opp.action || ""}
                    </div>
                    {opp.impact && (
                      <div style={{ display: "inline-block", fontSize: 11, padding: "4px 12px", borderRadius: 20, background: "rgba(76,175,80,0.12)", border: "1px solid rgba(76,175,80,0.3)", color: "#4caf50", fontWeight: 700 }}>
                        Impact: {opp.impact}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* RECOMMENDATIONS */}
          {(report.recommendations || []).length > 0 && (
            <div style={{ marginBottom: 28 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", marginBottom: 12 }}>
                Recommendations
              </div>
              <div
                style={{
                  background: "var(--bg-card)",
                  border: "1px solid var(--border-default)",
                  borderRadius: 14,
                  padding: 20,
                }}
              >
                {(report.recommendations || []).map((rec: any, i: number) => {
                  const pColor = rec.priority === 1 ? "#f44336" : rec.priority === 2 ? "#ff9800" : "#4caf50";
                  return (
                    <div
                      key={i}
                      style={{
                        display: "flex",
                        gap: 14,
                        alignItems: "flex-start",
                        padding: "14px 0",
                        borderBottom: i < (report.recommendations || []).length - 1 ? "1px solid var(--border-default)" : "none",
                      }}
                    >
                      <div
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: "50%",
                          background: `${pColor}18`,
                          border: `1px solid ${pColor}44`,
                          color: pColor,
                          fontSize: 12,
                          fontWeight: 800,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        {i + 1}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", marginBottom: 4 }}>
                          {rec.action || "Action"}
                        </div>
                        <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 6 }}>
                          {rec.impact || ""}
                        </div>
                        {rec.items?.length > 0 && (
                          <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                            {rec.items.map((item: string, j: number) => (
                              <span
                                key={j}
                                style={{
                                  fontSize: 9,
                                  padding: "2px 8px",
                                  borderRadius: 20,
                                  background: "rgba(0,188,212,0.08)",
                                  border: "1px solid rgba(0,188,212,0.18)",
                                  color: "#00bcd4",
                                }}
                              >
                                {item}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* EXPORT / ACTIONS */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 24 }}>
            <button
              onClick={() => window.print()}
              style={{
                width: "100%",
                height: 52,
                background: "linear-gradient(135deg, #00bcd4, #0097a7)",
                color: "#000",
                fontWeight: 800,
                fontSize: 14,
                borderRadius: 10,
                border: "none",
                cursor: "pointer",
                boxShadow: "0 4px 16px rgba(0,188,212,0.3)",
              }}
            >
              Export as PDF
            </button>
            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={generateReport}
                style={{
                  flex: 1,
                  height: 44,
                  background: "transparent",
                  border: "1px solid rgba(0,188,212,0.3)",
                  color: "#00bcd4",
                  fontWeight: 700,
                  fontSize: 13,
                  borderRadius: 10,
                  cursor: "pointer",
                }}
              >
                Refresh Report
              </button>
              <button
                onClick={() => {
                  const summaryText = (report.summaries || []).map((s: any) => `[${s.provider}] ${s.summary}`).join("\n\n");
                  const recsText = (report.recommendations || []).map((r: any, i: number) => `${i + 1}. ${r.action} — ${r.impact}`).join("\n");
                  const fullText = `MARKET INTELLIGENCE REPORT\nHealth Score: ${healthScore}/100\nItems: ${report.totalItems}\nEst. Value: $${report.totalEstimatedValue?.toLocaleString()}\nRevenue Potential: $${report.revenuePotential?.toLocaleString()}\n\n--- SUMMARIES ---\n${summaryText}\n\n--- RECOMMENDATIONS ---\n${recsText}`;
                  copyText(fullText, "__summary__");
                }}
                style={{
                  flex: 1,
                  height: 44,
                  background: "transparent",
                  border: "1px solid var(--border-default)",
                  color: copiedId === "__summary__" ? "#4caf50" : "var(--text-muted)",
                  fontWeight: 700,
                  fontSize: 13,
                  borderRadius: 10,
                  cursor: "pointer",
                }}
              >
                {copiedId === "__summary__" ? "Copied!" : "Copy Summary"}
              </button>
            </div>
          </div>

          {/* Timestamp */}
          <div style={{ fontSize: 10, color: "var(--text-muted)", textAlign: "center", marginTop: 16 }}>
            Analyzed by {(report.agentResults || []).filter((a: any) => a.status === "success").length} AI engines · {report.totalItems} items · {cachedDate || new Date().toLocaleString()}
          </div>
        </>
      )}
    </div>
  );
}

export default function MarketReportPage() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            maxWidth: 1100,
            margin: "0 auto",
            padding: "60px 20px",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: 14, color: "var(--text-muted)" }}>
            Loading market report...
          </div>
        </div>
      }
    >
      <MarketReportInner />
    </Suspense>
  );
}
