"use client";

import { useState } from "react";

interface Alert {
  id: string;
  alertType: string;
  severity: string;
  title: string;
  message: string;
  actionable: boolean;
  suggestedAction?: string | null;
  viewed: boolean;
  dismissed: boolean;
  createdAt: string;
}

interface ReconBotData {
  id: string;
  isActive: boolean;
  platformsJson: string;
  competitorCount: number;
  lowestPrice: number | null;
  highestPrice: number | null;
  averagePrice: number | null;
  medianPrice: number | null;
  latestCompetitorsJson: string;
  currentStatus: string;
  recommendation: string | null;
  confidenceScore: number | null;
  lastScan: string | null;
  scansCompleted: number;
  alerts: Alert[];
}

interface Props {
  itemId: string;
  userTier: number;
  userPrice: number | null;
  initialBot: ReconBotData | null;
}

const SEVERITY_COLOR: Record<string, string> = {
  HIGH: "#dc2626",
  URGENT: "#9f1239",
  MEDIUM: "#d97706",
  LOW: "#0f766e",
};

const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; bg: string; icon: string }
> = {
  PRICED_WELL: { label: "Priced Well", color: "#16a34a", bg: "#f0fdf4", icon: "✅" },
  TOO_HIGH: { label: "Too High", color: "#dc2626", bg: "#fef2f2", icon: "⚠️" },
  TOO_LOW: { label: "Too Low", color: "#d97706", bg: "#fffbeb", icon: "📉" },
  NOT_PRICED: { label: "Not Priced", color: "var(--text-muted)", bg: "#f9fafb", icon: "—" },
  NO_COMPETITORS: { label: "No Competition", color: "#0f766e", bg: "#f0fdfa", icon: "🎯" },
  ANALYZING: { label: "Analyzing…", color: "#7c3aed", bg: "#faf5ff", icon: "🔍" },
  MARKET_SHIFTING: { label: "Market Shifting", color: "#d97706", bg: "#fffbeb", icon: "📊" },
};

const PLATFORMS = [
  { id: "facebook", label: "Facebook Marketplace", icon: "📘" },
  { id: "ebay", label: "eBay", icon: "🛒" },
  { id: "craigslist", label: "Craigslist", icon: "📋" },
  { id: "mercari", label: "Mercari", icon: "🏷️" },
  { id: "offerup", label: "OfferUp", icon: "📦" },
];

function timeAgo(isoStr: string | null): string {
  if (!isoStr) return "never";
  const diff = Date.now() - new Date(isoStr).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  return `${Math.floor(hr / 24)}d ago`;
}

export default function ReconBotPanel({ itemId, userTier, userPrice, initialBot }: Props) {
  const [bot, setBot] = useState<ReconBotData | null>(initialBot);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(["facebook", "ebay", "craigslist"]);
  const [activating, setActivating] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [showAllCompetitors, setShowAllCompetitors] = useState(false);

  const competitors: any[] = bot
    ? (() => {
        try {
          return JSON.parse(bot.latestCompetitorsJson);
        } catch {
          return [];
        }
      })()
    : [];

  async function handleActivate() {
    setActivating(true);
    try {
      const res = await fetch(`/api/recon/activate/${itemId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platforms: selectedPlatforms }),
      });
      const data = await res.json();
      if (data.ok && data.bot) setBot(data.bot);
    } finally {
      setActivating(false);
    }
  }

  async function handleScanNow() {
    if (!bot) return;
    setScanning(true);
    try {
      const res = await fetch(`/api/recon/scan/${bot.id}`, { method: "POST" });
      const data = await res.json();
      if (data.ok && data.bot) setBot(data.bot);
    } finally {
      setScanning(false);
    }
  }

  async function handleDismissAlert(alertId: string) {
    await fetch(`/api/recon/alert/${alertId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "dismiss" }),
    });
    setBot((prev) =>
      prev
        ? {
            ...prev,
            alerts: prev.alerts.map((a) =>
              a.id === alertId ? { ...a, dismissed: true } : a
            ),
          }
        : prev
    );
  }

  async function handlePause() {
    if (!bot) return;
    const res = await fetch(`/api/recon/scan/${bot.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: bot.isActive ? "pause" : "resume" }),
    });
    const data = await res.json().catch(() => ({}));
    if (data.ok && data.bot) {
      setBot(data.bot);
    } else {
      setBot((prev) => (prev ? { ...prev, isActive: !prev.isActive } : prev));
    }
  }

  const statusConfig = STATUS_CONFIG[bot?.currentStatus ?? "ANALYZING"] ?? STATUS_CONFIG["ANALYZING"];
  const activeAlerts = bot?.alerts.filter((a) => !a.dismissed) ?? [];
  const visibleCompetitors = showAllCompetitors
    ? competitors
    : competitors.slice(0, 4);

  // ─── Setup state ─────────────────────────────────────────────────────────
  if (!bot) {
    return (
      <div
        className="card"
        style={{
          padding: "1.5rem",
          border: "1.5px solid var(--border-default)",
          background: "var(--bg-card)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem" }}>
          <span style={{ fontSize: "1.5rem" }}>🔍</span>
          <div>
            <div style={{ fontWeight: 700, fontSize: "1rem", color: "var(--text-primary)" }}>
              Market Intelligence Bot
            </div>
            <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
              Monitor competitors 24/7 · Get alerts when prices change
            </div>
          </div>
        </div>

        {/* Benefits */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "0.4rem",
            marginBottom: "1.25rem",
          }}
        >
          {[
            "📊 Track competitor pricing in real-time",
            "⚡ Get alerts when prices drop",
            "🎯 Know when to adjust your price",
            "📈 See market trends and patterns",
          ].map((b) => (
            <div
              key={b}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.4rem",
                fontSize: "0.8rem",
                color: "var(--text-secondary)",
                padding: "0.4rem 0.6rem",
                background: "var(--bg-card-hover)",
                borderRadius: "0.5rem",
              }}
            >
              {b}
            </div>
          ))}
        </div>

        {/* Platform selection */}
        <div style={{ marginBottom: "1.25rem" }}>
          <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", marginBottom: "0.5rem" }}>
            PLATFORMS TO MONITOR
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
            {PLATFORMS.map((p) => {
              const checked = selectedPlatforms.includes(p.id);
              return (
                <button
                  key={p.id}
                  onClick={() =>
                    setSelectedPlatforms((prev) =>
                      checked ? prev.filter((x) => x !== p.id) : [...prev, p.id]
                    )
                  }
                  style={{
                    padding: "0.35rem 0.75rem",
                    borderRadius: "9999px",
                    border: checked ? "1.5px solid #0f766e" : "1.5px solid #e7e5e4",
                    background: checked ? "#f0fdfa" : "#fff",
                    color: checked ? "#0f766e" : "#57534e",
                    fontSize: "0.78rem",
                    fontWeight: checked ? 700 : 400,
                    cursor: "pointer",
                    transition: "all 0.15s",
                  }}
                >
                  {p.icon} {p.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Pricing / tier */}
        <div
          style={{
            padding: "0.75rem 1rem",
            background: userTier >= 4 ? "#f0fdfa" : "#fefce8",
            border: `1px solid ${userTier >= 4 ? "#99f6e4" : "#fde047"}`,
            borderRadius: "0.75rem",
            marginBottom: "1rem",
            fontSize: "0.82rem",
          }}
        >
          {userTier >= 4 ? (
            <span style={{ color: "#0f766e", fontWeight: 700 }}>
              ✅ Included in your PRO plan — unlimited monitoring
            </span>
          ) : (
            <span style={{ color: "#92400e" }}>
              💎 <strong>$10/month per item</strong> — or{" "}
              <a href="/pricing" style={{ color: "#0f766e", fontWeight: 700 }}>
                upgrade to PRO
              </a>{" "}
              for unlimited
            </span>
          )}
        </div>

        <button
          onClick={handleActivate}
          disabled={activating || selectedPlatforms.length === 0}
          style={{
            width: "100%",
            padding: "0.875rem",
            background: activating ? "#6b7280" : "#0f766e",
            color: "#fff",
            border: "none",
            borderRadius: "0.875rem",
            fontWeight: 700,
            fontSize: "0.95rem",
            cursor: activating ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.5rem",
            transition: "background 0.2s",
          }}
        >
          {activating ? (
            <>
              <span style={{ animation: "spin 1s linear infinite", display: "inline-block" }}>⟳</span>
              Scanning markets…
            </>
          ) : (
            "🚀 Start Monitoring"
          )}
        </button>

        <div
          style={{
            textAlign: "center",
            marginTop: "0.5rem",
            fontSize: "0.7rem",
            color: "var(--text-muted)",
          }}
        >
          Demo Mode — connects to Facebook, eBay, Craigslist and more
        </div>
      </div>
    );
  }

  // ─── Active state ─────────────────────────────────────────────────────────
  return (
    <div className="card" style={{ padding: "1.5rem" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "1.25rem",
          flexWrap: "wrap",
          gap: "0.5rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
          <span style={{ fontSize: "1.25rem" }}>🔍</span>
          <div>
            <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "var(--text-primary)" }}>
              Market Intelligence
            </div>
            <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
              Last scan: {timeAgo(bot.lastScan)} · {bot.scansCompleted} scan{bot.scansCompleted !== 1 ? "s" : ""} completed
            </div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          {activeAlerts.length > 0 && (
            <span
              style={{
                padding: "0.15rem 0.5rem",
                background: "#fef2f2",
                color: "#dc2626",
                borderRadius: "9999px",
                fontSize: "0.68rem",
                fontWeight: 700,
                border: "1px solid #fecaca",
              }}
            >
              {activeAlerts.length} alert{activeAlerts.length !== 1 ? "s" : ""}
            </span>
          )}
          <span
            style={{
              padding: "0.2rem 0.6rem",
              background: bot.isActive ? "#f0fdf4" : "#f5f5f4",
              color: bot.isActive ? "#16a34a" : "#78716c",
              borderRadius: "9999px",
              fontSize: "0.72rem",
              fontWeight: 700,
              border: `1px solid ${bot.isActive ? "#bbf7d0" : "#e7e5e4"}`,
            }}
          >
            {bot.isActive ? "● ACTIVE" : "○ PAUSED"}
          </span>
        </div>
      </div>

      {/* Market overview stats */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "0.625rem",
          marginBottom: "1rem",
        }}
      >
        <div
          style={{
            background: "var(--bg-card-hover)",
            borderRadius: "0.875rem",
            padding: "0.75rem",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: "1.5rem", fontWeight: 900, color: "var(--text-primary)" }}>
            {bot.competitorCount}
          </div>
          <div style={{ fontSize: "0.68rem", color: "var(--text-muted)", fontWeight: 600 }}>
            COMPETITORS
          </div>
        </div>
        <div
          style={{
            background: "var(--bg-card-hover)",
            borderRadius: "0.875rem",
            padding: "0.75rem",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: "1.5rem", fontWeight: 900, color: "var(--text-primary)" }}>
            {bot.averagePrice ? `$${Math.round(bot.averagePrice)}` : "—"}
          </div>
          <div style={{ fontSize: "0.68rem", color: "var(--text-muted)", fontWeight: 600 }}>
            MARKET AVG
          </div>
        </div>
        <div
          style={{
            background: statusConfig.bg,
            borderRadius: "0.875rem",
            padding: "0.75rem",
            textAlign: "center",
            border: `1px solid ${statusConfig.color}30`,
          }}
        >
          <div style={{ fontSize: "1.1rem", fontWeight: 900, color: statusConfig.color }}>
            {statusConfig.icon} {statusConfig.label}
          </div>
          <div style={{ fontSize: "0.68rem", color: "var(--text-muted)", fontWeight: 600 }}>
            YOUR PRICE
          </div>
        </div>
      </div>

      {/* Price range bar */}
      {bot.lowestPrice != null && bot.highestPrice != null && userPrice != null && (
        <div style={{ marginBottom: "1rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.7rem", color: "var(--text-muted)", marginBottom: "0.25rem" }}>
            <span>Low ${Math.round(bot.lowestPrice)}</span>
            <span>High ${Math.round(bot.highestPrice)}</span>
          </div>
          <div style={{ height: "8px", background: "#e7e5e4", borderRadius: "9999px", position: "relative" }}>
            <div
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                height: "100%",
                width: `${Math.min(100, Math.max(0, ((userPrice - bot.lowestPrice) / (bot.highestPrice - bot.lowestPrice)) * 100))}%`,
                background: statusConfig.color,
                borderRadius: "9999px",
                transition: "width 0.4s ease",
              }}
            />
            <div
              style={{
                position: "absolute",
                top: "-2px",
                left: `${Math.min(96, Math.max(0, ((userPrice - bot.lowestPrice) / (bot.highestPrice - bot.lowestPrice)) * 100))}%`,
                width: "12px",
                height: "12px",
                background: statusConfig.color,
                borderRadius: "50%",
                border: "2px solid #fff",
                boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
              }}
            />
          </div>
          <div style={{ fontSize: "0.68rem", color: "var(--text-muted)", marginTop: "0.25rem", textAlign: "center" }}>
            Your price: ${Math.round(userPrice)}
          </div>
        </div>
      )}

      {/* Recommendation */}
      {bot.recommendation && (
        <div
          style={{
            padding: "0.75rem 1rem",
            background: statusConfig.bg,
            border: `1px solid ${statusConfig.color}40`,
            borderRadius: "0.875rem",
            marginBottom: "1rem",
            fontSize: "0.82rem",
            color: "var(--text-primary)",
            display: "flex",
            gap: "0.5rem",
            alignItems: "flex-start",
          }}
        >
          <span style={{ flexShrink: 0 }}>💡</span>
          <span>{bot.recommendation}</span>
        </div>
      )}

      {/* Alerts */}
      {activeAlerts.length > 0 && (
        <div style={{ marginBottom: "1rem" }}>
          <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", marginBottom: "0.5rem" }}>
            ALERTS
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {activeAlerts.map((alert) => (
              <div
                key={alert.id}
                style={{
                  padding: "0.75rem",
                  background: "var(--bg-card-solid)",
                  border: `1.5px solid ${SEVERITY_COLOR[alert.severity] ?? "#e7e5e4"}30`,
                  borderLeft: `3px solid ${SEVERITY_COLOR[alert.severity] ?? "#e7e5e4"}`,
                  borderRadius: "0.75rem",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    gap: "0.5rem",
                    marginBottom: "0.25rem",
                  }}
                >
                  <div>
                    <span
                      style={{
                        display: "inline-block",
                        padding: "0.1rem 0.35rem",
                        background: SEVERITY_COLOR[alert.severity] + "15",
                        color: SEVERITY_COLOR[alert.severity] ?? "#6b7280",
                        borderRadius: "9999px",
                        fontSize: "0.62rem",
                        fontWeight: 700,
                        marginRight: "0.4rem",
                      }}
                    >
                      {alert.severity}
                    </span>
                    <strong style={{ fontSize: "0.82rem", color: "var(--text-primary)" }}>
                      {alert.title}
                    </strong>
                  </div>
                  <button
                    onClick={() => handleDismissAlert(alert.id)}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "var(--text-muted)",
                      fontSize: "0.8rem",
                      padding: "0",
                      flexShrink: 0,
                    }}
                    title="Dismiss"
                  >
                    ✕
                  </button>
                </div>
                <p style={{ fontSize: "0.78rem", color: "var(--text-secondary)", margin: 0, lineHeight: 1.5 }}>
                  {alert.message}
                </p>
                {alert.suggestedAction && (
                  <div
                    style={{
                      marginTop: "0.35rem",
                      fontSize: "0.72rem",
                      color: "#0f766e",
                      fontWeight: 700,
                    }}
                  >
                    💡 Suggested: {alert.suggestedAction}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Competitor listings */}
      {competitors.length > 0 && (
        <div style={{ marginBottom: "1rem" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "0.5rem",
            }}
          >
            <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)" }}>
              COMPETITOR LISTINGS ({competitors.length})
            </div>
            {competitors.length > 4 && (
              <button
                onClick={() => setShowAllCompetitors((p) => !p)}
                style={{
                  background: "none",
                  border: "none",
                  color: "#0f766e",
                  fontSize: "0.72rem",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                {showAllCompetitors ? "Show less ▲" : `Show all ${competitors.length} ▼`}
              </button>
            )}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
            {visibleCompetitors.map((c: any) => (
              <div
                key={c.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "0.5rem 0.75rem",
                  background: c.status === "SOLD" ? "#fafaf9" : "#fff",
                  border: "1px solid var(--border-default)",
                  borderRadius: "0.625rem",
                  fontSize: "0.8rem",
                  opacity: c.status === "SOLD" ? 0.7 : 1,
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontWeight: 600,
                      color: "var(--text-primary)",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {c.title}
                  </div>
                  <div style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>
                    {c.platform} · {c.location} · {c.daysAgo}d ago
                  </div>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0, marginLeft: "0.5rem" }}>
                  <div style={{ fontWeight: 700, color: c.status === "SOLD" ? "#16a34a" : "#1c1917" }}>
                    ${c.price}
                  </div>
                  <div
                    style={{
                      fontSize: "0.62rem",
                      fontWeight: 700,
                      color: c.status === "SOLD" ? "#16a34a" : "#78716c",
                    }}
                  >
                    {c.status === "SOLD" ? `✅ SOLD in ${c.daysToSell}d` : c.condition}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
        <button
          onClick={handleScanNow}
          disabled={scanning}
          style={{
            padding: "0.5rem 1rem",
            background: "var(--bg-card-hover)",
            border: "1px solid var(--border-default)",
            borderRadius: "0.625rem",
            fontSize: "0.8rem",
            fontWeight: 600,
            cursor: scanning ? "not-allowed" : "pointer",
            color: "var(--text-primary)",
          }}
        >
          {scanning ? "⟳ Scanning…" : "🔄 Scan Now"}
        </button>
        <button
          onClick={handlePause}
          style={{
            padding: "0.5rem 1rem",
            background: "var(--bg-card-solid)",
            border: "1px solid var(--border-default)",
            borderRadius: "0.625rem",
            fontSize: "0.8rem",
            fontWeight: 600,
            cursor: "pointer",
            color: "var(--text-secondary)",
          }}
        >
          {bot.isActive ? "⏸ Pause" : "▶ Resume"}
        </button>
        <div style={{ flex: 1 }} />
        <div style={{ fontSize: "0.68rem", color: "var(--text-muted)", alignSelf: "center" }}>
          {bot.confidenceScore != null
            ? `${Math.round(bot.confidenceScore * 100)}% confidence`
            : ""}
        </div>
      </div>
    </div>
  );
}
