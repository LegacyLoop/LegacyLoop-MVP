"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

/* ── Types ────────────────────────────────────────────────────────── */

type Alert = { type: string; message: string; severity: "info" | "warning" | "danger" };

type BudgetData = {
  preferences: {
    monthlySpendCap: number | null;
    perProjectCap: number | null;
    perItemCap: number | null;
    alertThreshold: number;
    autoStopEnabled: boolean;
    saleDurationDefault: number | null;
  };
  spending: {
    monthlySpent: number;
    monthlyCreditsUsed: number;
    projectedMonthEnd: number;
    daysUntilReset: number;
    dayOfMonth: number;
    daysInMonth: number;
    activeBotCount: number;
    creditBalance: number;
    lifetimeSpentDollars: number;
  };
  projects: Array<{
    id: string;
    name: string;
    type: string;
    spent: number;
    cap: number | null;
    daysLeft: number | null;
    itemCount: number;
    analyzedCount: number;
    status: string;
  }>;
  alerts: Alert[];
};

type Props = {
  variant?: "full" | "compact" | "item";
  itemSpent?: number;
  itemName?: string;
};

/* ── Helpers ──────────────────────────────────────────────────────── */

function getGaugeColor(pct: number): string {
  if (pct >= 90) return "#ef4444";
  if (pct >= 75) return "#f97316";
  if (pct >= 60) return "#fbbf24";
  return "#00bcd4";
}

function getGaugeGlow(pct: number): string {
  if (pct >= 90) return "rgba(239,68,68,0.35)";
  if (pct >= 75) return "rgba(249,115,22,0.3)";
  if (pct >= 60) return "rgba(251,191,36,0.25)";
  return "rgba(0,188,212,0.25)";
}

function getStatusLabel(pct: number): { text: string; color: string } {
  if (pct >= 100) return { text: "Over Budget", color: "#ef4444" };
  if (pct >= 90) return { text: "Critical", color: "#ef4444" };
  if (pct >= 75) return { text: "Approaching Limit", color: "#f97316" };
  if (pct >= 60) return { text: "Monitor", color: "#fbbf24" };
  if (pct >= 30) return { text: "On Track", color: "#00bcd4" };
  return { text: "Under Budget", color: "#22c55e" };
}

const CAP_PRESETS = [25, 50, 100, 200, 500];

/* ── SVG Gauge ────────────────────────────────────────────────────── */

function SpendingGauge({ percentage, spent, cap }: { percentage: number; spent: number; cap: number | null }) {
  const clampedPct = Math.min(100, Math.max(0, percentage));
  const color = getGaugeColor(clampedPct);
  const glow = getGaugeGlow(clampedPct);
  const status = getStatusLabel(clampedPct);

  // Semi-circle arc: M 20,100 A 80,80 0 0,1 180,100
  const arcLength = Math.PI * 80; // ~251.33
  const dashOffset = arcLength * (1 - clampedPct / 100);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <svg viewBox="0 0 200 115" width="200" height="115" style={{ filter: `drop-shadow(0 0 8px ${glow})` }}>
        {/* Track */}
        <path
          d="M 20 100 A 80 80 0 0 1 180 100"
          fill="none"
          stroke="var(--border-default)"
          strokeWidth="10"
          strokeLinecap="round"
        />
        {/* Progress */}
        <path
          d="M 20 100 A 80 80 0 0 1 180 100"
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={`${arcLength}`}
          strokeDashoffset={`${dashOffset}`}
          style={{ transition: "stroke-dashoffset 1s ease, stroke 0.5s ease" }}
        />
        {/* Percentage text */}
        <text x="100" y="78" textAnchor="middle" style={{ fontSize: "2rem", fontWeight: 900, fill: "var(--text-primary)" }}>
          {cap ? `${Math.round(clampedPct)}%` : "—"}
        </text>
        <text x="100" y="98" textAnchor="middle" style={{ fontSize: "0.62rem", fontWeight: 600, fill: "var(--text-muted)" }}>
          {cap ? "of monthly cap" : "no cap set"}
        </text>
      </svg>

      {/* Amount display */}
      <div style={{ textAlign: "center", marginTop: "-0.25rem" }}>
        <div style={{ fontSize: "1.35rem", fontWeight: 900, color: "var(--text-primary)" }}>
          ${spent.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          {cap && (
            <span style={{ fontSize: "0.85rem", fontWeight: 500, color: "var(--text-muted)" }}>
              {" "}/ ${cap.toLocaleString()}
            </span>
          )}
        </div>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: "0.3rem",
          fontSize: "0.68rem", fontWeight: 700, marginTop: "0.2rem",
          padding: "0.15rem 0.5rem", borderRadius: "9999px",
          background: `${color}18`, color: color,
          border: `1px solid ${color}30`,
        }}>
          <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: color }} />
          {status.text}
        </div>
      </div>
    </div>
  );
}

/* ── Progress Bar ─────────────────────────────────────────────────── */

function ProgressBar({ value, max, color, label, sublabel }: {
  value: number; max: number | null; color?: string; label: string; sublabel?: string;
}) {
  const pct = max ? Math.min(100, (value / max) * 100) : 0;
  const barColor = color || getGaugeColor(pct);

  return (
    <div style={{ marginBottom: "0.5rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "0.25rem" }}>
        <span style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--text-primary)" }}>{label}</span>
        <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
          ${value.toLocaleString()}{max ? ` / $${max.toLocaleString()}` : ""}
        </span>
      </div>
      <div style={{ height: "6px", borderRadius: "3px", background: "var(--border-default)", overflow: "hidden" }}>
        <div style={{
          height: "100%", borderRadius: "3px",
          width: max ? `${pct}%` : "0%",
          background: `linear-gradient(90deg, ${barColor}, ${barColor}cc)`,
          transition: "width 0.8s ease",
          boxShadow: `0 0 6px ${barColor}40`,
        }} />
      </div>
      {sublabel && <div style={{ fontSize: "0.65rem", color: "var(--text-muted)", marginTop: "0.15rem" }}>{sublabel}</div>}
    </div>
  );
}

/* ── Toggle Switch ────────────────────────────────────────────────── */

function Toggle({ checked, onChange, label, sublabel }: {
  checked: boolean; onChange: () => void; label: string; sublabel?: string;
}) {
  return (
    <div
      onClick={onChange}
      style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0.65rem 0.85rem", borderRadius: "0.65rem", cursor: "pointer",
        background: "var(--bg-card)", border: "1px solid var(--border-default)",
        transition: "border-color 0.15s ease",
        minHeight: "44px",
      }}
    >
      <div>
        <div style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--text-primary)" }}>{label}</div>
        {sublabel && <div style={{ fontSize: "0.65rem", color: "var(--text-muted)", marginTop: "0.1rem" }}>{sublabel}</div>}
      </div>
      <div style={{
        width: "40px", height: "22px", borderRadius: "11px",
        background: checked ? "linear-gradient(135deg, #00bcd4, #0097a7)" : "var(--border-default)",
        position: "relative", transition: "background 0.25s ease", flexShrink: 0,
      }}>
        <div style={{
          width: "18px", height: "18px", borderRadius: "50%",
          background: "#fff", position: "absolute", top: "2px",
          left: checked ? "20px" : "2px",
          transition: "left 0.25s ease",
          boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
        }} />
      </div>
    </div>
  );
}

/* ── Main Component ───────────────────────────────────────────────── */

export default function BudgetGuard({ variant = "full", itemSpent, itemName }: Props) {
  const [data, setData] = useState<BudgetData | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingCap, setEditingCap] = useState(false);
  const [capInput, setCapInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [pausingBots, setPausingBots] = useState(false);
  const [autoStopResult, setAutoStopResult] = useState<{ paused: number } | null>(null);

  const fetchBudget = useCallback(async () => {
    try {
      const res = await fetch("/api/budget");
      if (res.ok) setData(await res.json());
    } catch { /* empty */ }
    setLoading(false);
  }, []);

  useEffect(() => { fetchBudget(); }, [fetchBudget]);

  // Auto-stop: when budget is exceeded and autoStop is enabled, pause bots
  useEffect(() => {
    if (!data) return;
    const { preferences: p, spending: s } = data;
    if (!p.autoStopEnabled || !p.monthlySpendCap) return;
    const pct = (s.monthlySpent / p.monthlySpendCap) * 100;
    if (pct < 100 || s.activeBotCount === 0) return;
    // Budget exceeded with active bots — trigger auto-stop
    (async () => {
      try {
        const res = await fetch("/api/budget/auto-stop", { method: "POST" });
        if (res.ok) {
          const result = await res.json();
          if (result.paused > 0) {
            setAutoStopResult({ paused: result.paused });
            await fetchBudget(); // refresh counts
          }
        }
      } catch { /* empty */ }
    })();
  }, [data, fetchBudget]);

  const updatePreferences = async (updates: Record<string, unknown>) => {
    setSaving(true);
    try {
      await fetch("/api/budget", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(updates) });
      await fetchBudget();
    } catch { /* empty */ }
    setSaving(false);
  };

  const handlePauseAllBots = async () => {
    setPausingBots(true);
    try {
      const res = await fetch("/api/budget/auto-stop", { method: "POST" });
      if (res.ok) {
        const result = await res.json();
        setAutoStopResult({ paused: result.paused });
        await fetchBudget();
      }
    } catch { /* empty */ }
    setPausingBots(false);
  };

  if (loading) {
    return (
      <div style={{
        padding: variant === "compact" ? "1rem" : "1.5rem",
        borderRadius: "1rem", background: "var(--bg-card)",
        border: "1px solid var(--border-default)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span style={{ fontSize: "1rem" }}>💰</span>
          <span style={{ fontSize: "0.82rem", color: "var(--text-muted)", fontWeight: 600 }}>Loading budget data...</span>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { preferences: prefs, spending, projects, alerts } = data;
  const monthlyPct = prefs.monthlySpendCap ? (spending.monthlySpent / prefs.monthlySpendCap) * 100 : 0;

  /* ── COMPACT VARIANT (for dashboard / item pages) ─────────────── */
  if (variant === "compact") {
    return (
      <div style={{
        padding: "1rem 1.15rem", borderRadius: "0.85rem",
        background: "var(--bg-card)", border: "1px solid var(--border-default)",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <span style={{ fontSize: "0.9rem" }}>💰</span>
            <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--text-primary)" }}>Budget</span>
          </div>
          <Link href="/spending" style={{ fontSize: "0.65rem", color: "var(--accent)", textDecoration: "none", fontWeight: 600 }}>
            View Details →
          </Link>
        </div>

        {/* Monthly bar */}
        <ProgressBar
          value={spending.monthlySpent}
          max={prefs.monthlySpendCap}
          label="This Month"
          sublabel={`${spending.daysUntilReset} days until reset · ${spending.activeBotCount} active bot${spending.activeBotCount !== 1 ? "s" : ""}`}
        />

        {/* Item cost (if provided) */}
        {itemSpent !== undefined && (
          <ProgressBar
            value={itemSpent}
            max={prefs.perItemCap}
            label={itemName ? `"${itemName}"` : "This Item"}
            color="#00bcd4"
          />
        )}

        {/* Alerts */}
        {alerts.length > 0 && (
          <div style={{ marginTop: "0.5rem" }}>
            {alerts.slice(0, 2).map((a, i) => (
              <div key={i} style={{
                fontSize: "0.65rem", fontWeight: 600, padding: "0.3rem 0.5rem",
                borderRadius: "0.4rem", marginBottom: "0.25rem",
                background: a.severity === "danger" ? "rgba(239,68,68,0.08)" : a.severity === "warning" ? "rgba(251,191,36,0.08)" : "rgba(0,188,212,0.06)",
                color: a.severity === "danger" ? "#ef4444" : a.severity === "warning" ? "#fbbf24" : "#00bcd4",
                border: `1px solid ${a.severity === "danger" ? "rgba(239,68,68,0.2)" : a.severity === "warning" ? "rgba(251,191,36,0.2)" : "rgba(0,188,212,0.15)"}`,
              }}>
                {a.severity === "danger" ? "🚨" : a.severity === "warning" ? "⚠️" : "ℹ️"} {a.message}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  /* ── ITEM VARIANT (for item control center) ───────────────────── */
  if (variant === "item") {
    const itemPct = prefs.perItemCap && itemSpent != null ? (itemSpent / prefs.perItemCap) * 100 : 0;
    const itemColor = getGaugeColor(itemPct);
    const itemStatus = getStatusLabel(itemPct);

    return (
      <div style={{
        padding: "1.15rem", borderRadius: "0.85rem",
        background: "var(--bg-card)", border: "1px solid var(--border-default)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.75rem" }}>
          <span style={{ fontSize: "0.9rem" }}>💰</span>
          <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--text-primary)" }}>Item Budget</span>
          {prefs.perItemCap && itemSpent != null && (
            <span style={{
              fontSize: "0.58rem", fontWeight: 700, marginLeft: "auto",
              padding: "0.12rem 0.4rem", borderRadius: "9999px",
              background: `${itemColor}18`, color: itemColor,
              border: `1px solid ${itemColor}30`,
            }}>
              {itemStatus.text}
            </span>
          )}
        </div>

        {/* Item spending */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "0.35rem" }}>
          <div>
            <span style={{ fontSize: "1.25rem", fontWeight: 900, color: "var(--text-primary)" }}>
              ${(itemSpent ?? 0).toFixed(2)}
            </span>
            {prefs.perItemCap && (
              <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}> / ${prefs.perItemCap}</span>
            )}
          </div>
          <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>AI cost</span>
        </div>

        {/* Progress bar */}
        {prefs.perItemCap && (
          <div style={{ height: "6px", borderRadius: "3px", background: "var(--border-default)", overflow: "hidden", marginBottom: "0.5rem" }}>
            <div style={{
              height: "100%", borderRadius: "3px",
              width: `${Math.min(100, itemPct)}%`,
              background: `linear-gradient(90deg, ${itemColor}, ${itemColor}cc)`,
              transition: "width 0.8s ease",
            }} />
          </div>
        )}

        {/* Monthly context */}
        <div style={{ fontSize: "0.68rem", color: "var(--text-muted)", display: "flex", justifyContent: "space-between" }}>
          <span>Monthly total: ${spending.monthlySpent.toFixed(2)}{prefs.monthlySpendCap ? ` / $${prefs.monthlySpendCap}` : ""}</span>
          <span>{spending.creditBalance} credits left</span>
        </div>

        {/* Auto-stop indicator */}
        {prefs.autoStopEnabled && (
          <div style={{
            marginTop: "0.5rem", padding: "0.3rem 0.5rem", borderRadius: "0.4rem",
            background: "rgba(0,188,212,0.06)", border: "1px solid rgba(0,188,212,0.15)",
            fontSize: "0.62rem", color: "#00bcd4", fontWeight: 600,
            display: "flex", alignItems: "center", gap: "0.3rem",
          }}>
            ⚡ Auto-stop enabled — bots will pause at budget limit
          </div>
        )}
      </div>
    );
  }

  /* ── FULL VARIANT (settings / spending page) ──────────────────── */
  return (
    <div style={{
      borderRadius: "1.25rem",
      background: "var(--bg-card-solid)",
      border: "1px solid var(--border-default)",
      overflow: "hidden",
    }}>
      {/* Header */}
      <div style={{
        padding: "1.25rem 1.5rem",
        background: "linear-gradient(135deg, rgba(0,188,212,0.06), rgba(0,188,212,0.02))",
        borderBottom: "1px solid var(--border-default)",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span style={{ fontSize: "1.15rem" }}>💰</span>
            <h2 style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--text-primary)", margin: 0 }}>Budget Control Center</h2>
          </div>
          <p style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "0.2rem", margin: 0 }}>
            Control your spending, protect your budget, and manage sale timelines
          </p>
        </div>
        {spending.activeBotCount > 0 && (
          <button
            onClick={handlePauseAllBots}
            disabled={pausingBots}
            style={{
              padding: "0.5rem 1rem", borderRadius: "0.6rem",
              fontSize: "0.75rem", fontWeight: 700, cursor: "pointer",
              background: pausingBots ? "var(--border-default)" : "rgba(239,68,68,0.1)",
              color: pausingBots ? "var(--text-muted)" : "#ef4444",
              border: `1px solid ${pausingBots ? "var(--border-default)" : "rgba(239,68,68,0.25)"}`,
              minHeight: "44px", display: "inline-flex", alignItems: "center", gap: "0.3rem",
              transition: "all 0.2s ease",
            }}
          >
            {pausingBots ? "Pausing..." : `⏸ Pause All Bots (${spending.activeBotCount})`}
          </button>
        )}
      </div>

      <div style={{ padding: "1.5rem" }}>
        {/* Auto-stop result banner */}
        {autoStopResult && autoStopResult.paused > 0 && (
          <div style={{
            padding: "0.7rem 1rem", borderRadius: "0.6rem", marginBottom: "1rem",
            fontSize: "0.82rem", fontWeight: 700,
            background: "rgba(239,68,68,0.08)", color: "#ef4444",
            border: "1px solid rgba(239,68,68,0.2)",
            display: "flex", alignItems: "center", gap: "0.4rem",
          }}>
            {autoStopResult.paused} bot{autoStopResult.paused !== 1 ? "s" : ""} paused due to budget limit
          </div>
        )}

        {/* Alerts */}
        {alerts.length > 0 && (
          <div style={{ marginBottom: "1.25rem" }}>
            {alerts.map((a, i) => (
              <div key={i} style={{
                padding: "0.6rem 0.85rem", borderRadius: "0.6rem", marginBottom: "0.4rem",
                fontSize: "0.78rem", fontWeight: 600, display: "flex", alignItems: "center", gap: "0.4rem",
                background: a.severity === "danger" ? "rgba(239,68,68,0.08)" : a.severity === "warning" ? "rgba(251,191,36,0.08)" : "rgba(0,188,212,0.06)",
                color: a.severity === "danger" ? "#ef4444" : a.severity === "warning" ? "#d97706" : "#00bcd4",
                border: `1px solid ${a.severity === "danger" ? "rgba(239,68,68,0.2)" : a.severity === "warning" ? "rgba(251,191,36,0.2)" : "rgba(0,188,212,0.15)"}`,
              }}>
                {a.severity === "danger" ? "🚨" : a.severity === "warning" ? "⚠️" : "ℹ️"} {a.message}
              </div>
            ))}
          </div>
        )}

        {/* Gauge + Stats */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: "2rem", flexWrap: "wrap", marginBottom: "1.5rem" }}>
          <SpendingGauge
            percentage={monthlyPct}
            spent={spending.monthlySpent}
            cap={prefs.monthlySpendCap}
          />
          <div style={{ flex: 1, minWidth: "200px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.6rem" }}>
              {[
                { label: "Credits Left", value: spending.creditBalance.toLocaleString(), icon: "🪙" },
                { label: "Active Bots", value: String(spending.activeBotCount), icon: "🤖" },
                { label: "Days to Reset", value: String(spending.daysUntilReset), icon: "📅" },
                { label: "Projected End", value: `$${spending.projectedMonthEnd.toFixed(0)}`, icon: "📈" },
                { label: "Lifetime Spent", value: `$${spending.lifetimeSpentDollars.toFixed(0)}`, icon: "📊" },
                { label: "Alert At", value: `${prefs.alertThreshold}%`, icon: "🔔" },
              ].map((s) => (
                <div key={s.label} style={{
                  padding: "0.6rem 0.75rem", borderRadius: "0.6rem",
                  background: "var(--bg-card)", border: "1px solid var(--border-default)",
                }}>
                  <div style={{ fontSize: "0.62rem", color: "var(--text-muted)", marginBottom: "0.1rem" }}>{s.icon} {s.label}</div>
                  <div style={{ fontSize: "1rem", fontWeight: 800, color: "var(--text-primary)" }}>{s.value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Monthly Cap Quick-Set */}
        <div style={{ marginBottom: "1.25rem" }}>
          <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.5rem" }}>Monthly Spending Cap</div>
          <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", alignItems: "center" }}>
            {CAP_PRESETS.map((cap) => (
              <button
                key={cap}
                onClick={() => updatePreferences({ monthlySpendCap: cap })}
                disabled={saving}
                style={{
                  padding: "0.4rem 0.85rem", borderRadius: "0.5rem",
                  fontSize: "0.78rem", fontWeight: 700, cursor: "pointer",
                  background: prefs.monthlySpendCap === cap ? "var(--accent)" : "var(--bg-card)",
                  color: prefs.monthlySpendCap === cap ? "#fff" : "var(--text-secondary)",
                  border: `1px solid ${prefs.monthlySpendCap === cap ? "var(--accent)" : "var(--border-default)"}`,
                  transition: "all 0.15s ease", minHeight: "36px",
                }}
              >
                ${cap}
              </button>
            ))}
            {editingCap ? (
              <div style={{ display: "flex", gap: "0.3rem", alignItems: "center" }}>
                <input
                  type="number"
                  value={capInput}
                  onChange={(e) => setCapInput(e.target.value)}
                  placeholder="Custom"
                  style={{
                    width: "80px", padding: "0.4rem 0.5rem", borderRadius: "0.5rem",
                    fontSize: "0.78rem", border: "1px solid var(--accent)",
                    background: "var(--bg-card)", color: "var(--text-primary)",
                    outline: "none",
                  }}
                />
                <button
                  onClick={() => { updatePreferences({ monthlySpendCap: Number(capInput) || null }); setEditingCap(false); }}
                  style={{
                    padding: "0.4rem 0.65rem", borderRadius: "0.5rem",
                    fontSize: "0.72rem", fontWeight: 700, cursor: "pointer",
                    background: "var(--accent)", color: "#fff", border: "none",
                  }}
                >
                  Set
                </button>
              </div>
            ) : (
              <button
                onClick={() => setEditingCap(true)}
                style={{
                  padding: "0.4rem 0.85rem", borderRadius: "0.5rem",
                  fontSize: "0.78rem", fontWeight: 600, cursor: "pointer",
                  background: "transparent", color: "var(--text-muted)",
                  border: "1px dashed var(--border-default)",
                  minHeight: "36px",
                }}
              >
                Custom...
              </button>
            )}
            {prefs.monthlySpendCap && (
              <button
                onClick={() => updatePreferences({ monthlySpendCap: null })}
                style={{
                  padding: "0.4rem 0.65rem", borderRadius: "0.5rem",
                  fontSize: "0.72rem", fontWeight: 600, cursor: "pointer",
                  background: "transparent", color: "var(--text-muted)",
                  border: "none", textDecoration: "underline",
                }}
              >
                Remove cap
              </button>
            )}
          </div>
        </div>

        {/* Controls */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginBottom: "1.25rem" }}>
          <Toggle
            checked={prefs.autoStopEnabled}
            onChange={() => updatePreferences({ autoStopEnabled: !prefs.autoStopEnabled })}
            label="⚡ Auto-Stop at Limit"
            sublabel="Automatically pause all bots when monthly spending reaches your cap"
          />
          <Toggle
            checked={prefs.saleDurationDefault != null}
            onChange={() => updatePreferences({ saleDurationDefault: prefs.saleDurationDefault ? null : 14 })}
            label="⏱️ Default Sale Duration"
            sublabel={prefs.saleDurationDefault ? `Sales default to ${prefs.saleDurationDefault} days` : "No default duration — sales run until manually ended"}
          />
        </div>

        {/* Project Spending */}
        {projects.length > 0 && (
          <div style={{ marginBottom: "1.25rem" }}>
            <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.65rem" }}>Active Sales & Projects</div>
            {projects.map((p) => (
              <div key={p.id} style={{
                padding: "0.85rem 1rem", borderRadius: "0.75rem",
                background: "var(--bg-card)", border: "1px solid var(--border-default)",
                marginBottom: "0.5rem",
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.35rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                    <span style={{ fontSize: "0.85rem" }}>{p.type === "ESTATE_SALE" ? "🏠" : "🚗"}</span>
                    <Link href={`/projects/${p.id}`} style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--text-primary)", textDecoration: "none" }}>
                      {p.name}
                    </Link>
                  </div>
                  {p.daysLeft !== null && (
                    <span style={{
                      fontSize: "0.6rem", fontWeight: 700, padding: "0.12rem 0.45rem",
                      borderRadius: "9999px",
                      background: p.daysLeft <= 3 ? "rgba(239,68,68,0.1)" : "rgba(0,188,212,0.08)",
                      color: p.daysLeft <= 3 ? "#ef4444" : "#00bcd4",
                      border: `1px solid ${p.daysLeft <= 3 ? "rgba(239,68,68,0.2)" : "rgba(0,188,212,0.15)"}`,
                    }}>
                      {p.daysLeft === 0 ? "Ended" : `${p.daysLeft}d left`}
                    </span>
                  )}
                </div>
                <ProgressBar value={p.spent} max={p.cap} label="" sublabel={`${p.analyzedCount}/${p.itemCount} items analyzed`} />
              </div>
            ))}
          </div>
        )}

        {/* Exit Path — Trust Building */}
        <div style={{
          padding: "1rem", borderRadius: "0.75rem",
          background: "var(--bg-card)", border: "1px solid var(--border-default)",
        }}>
          <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.5rem" }}>Need to make changes?</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
            <Link href="/spending" style={{ fontSize: "0.78rem", color: "var(--accent)", textDecoration: "none", display: "flex", alignItems: "center", gap: "0.3rem" }}>
              📊 View Full Spending Breakdown →
            </Link>
            <Link href="/settings" style={{ fontSize: "0.78rem", color: "var(--accent)", textDecoration: "none", display: "flex", alignItems: "center", gap: "0.3rem" }}>
              ⚙️ Manage Subscription & Plan →
            </Link>
            <Link href="/settings#cancel" style={{ fontSize: "0.78rem", color: "var(--text-muted)", textDecoration: "none", display: "flex", alignItems: "center", gap: "0.3rem" }}>
              ✋ Cancel Plan or Pause Automation →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
