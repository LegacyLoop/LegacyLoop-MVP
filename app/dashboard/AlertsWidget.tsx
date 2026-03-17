"use client";

import { useState } from "react";
import Link from "next/link";

interface Alert {
  id: string;
  alertType: string;
  severity: string;
  title: string;
  message: string;
  actionable: boolean;
  suggestedAction?: string | null;
  dismissed: boolean;
  createdAt: string;
  reconBot: {
    id: string;
    item: { id: string; title: string | null };
  };
}

interface Props {
  initialAlerts: Alert[];
}

const SEVERITY_COLOR: Record<string, string> = {
  HIGH: "#dc2626",
  URGENT: "#9f1239",
  MEDIUM: "#d97706",
  LOW: "#0f766e",
};

const ALERT_ICON: Record<string, string> = {
  PRICE_TOO_HIGH: "⚠️",
  PRICE_TOO_LOW: "📉",
  COMPETITOR_LOWER_PRICE: "🏃",
  SIMILAR_SOLD: "✅",
  MARKET_SHIFT: "📊",
  NEW_COMPETITOR: "🆕",
};

function timeAgo(isoStr: string): string {
  const diff = Date.now() - new Date(isoStr).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  return `${Math.floor(hr / 24)}d ago`;
}

export default function AlertsWidget({ initialAlerts }: Props) {
  const [alerts, setAlerts] = useState(initialAlerts);
  const [collapsed, setCollapsed] = useState(false);

  const visible = alerts.filter((a) => !a.dismissed);

  async function dismissAlert(alertId: string) {
    await fetch(`/api/recon/alert/${alertId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "dismiss" }),
    });
    setAlerts((prev) =>
      prev.map((a) => (a.id === alertId ? { ...a, dismissed: true } : a))
    );
  }

  if (visible.length === 0) return null;

  return (
    <div
      style={{
        marginBottom: "1.5rem",
        border: "1.5px solid var(--warning-border)",
        borderRadius: "1rem",
        overflow: "hidden",
        background: "var(--warning-bg)",
      }}
    >
      {/* Header */}
      <button
        onClick={() => setCollapsed((p) => !p)}
        style={{
          width: "100%",
          padding: "0.875rem 1.25rem",
          background: "transparent",
          border: "none",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "0.5rem",
          minHeight: "44px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
          <span style={{ fontSize: "1.1rem" }}>🔍</span>
          <span style={{ fontWeight: 700, fontSize: "0.9rem", color: "var(--warning-text)" }}>
            Market Intelligence Alerts
          </span>
          <span
            style={{
              padding: "0.1rem 0.45rem",
              background: "#dc2626",
              color: "#fff",
              borderRadius: "9999px",
              fontSize: "0.65rem",
              fontWeight: 700,
            }}
          >
            {visible.length}
          </span>
        </div>
        <span style={{ color: "var(--warning-text)", fontSize: "0.8rem" }}>
          {collapsed ? "▼ Show" : "▲ Hide"}
        </span>
      </button>

      {/* Alerts list */}
      {!collapsed && (
        <div
          style={{
            borderTop: "1px solid var(--warning-border)",
            padding: "0.75rem",
            display: "flex",
            flexDirection: "column",
            gap: "0.5rem",
          }}
        >
          {visible.slice(0, 5).map((alert) => (
            <div
              key={alert.id}
              style={{
                background: "var(--bg-card-solid)",
                border: `1px solid ${SEVERITY_COLOR[alert.severity] ?? "var(--border-default)"}25`,
                borderLeft: `3px solid ${SEVERITY_COLOR[alert.severity] ?? "var(--border-default)"}`,
                borderRadius: "0.75rem",
                padding: "0.625rem 0.875rem",
                display: "flex",
                gap: "0.625rem",
                alignItems: "flex-start",
              }}
            >
              <span style={{ fontSize: "1rem", flexShrink: 0, marginTop: "0.05rem" }}>
                {ALERT_ICON[alert.alertType] ?? "📊"}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "baseline",
                    gap: "0.4rem",
                    flexWrap: "wrap",
                    marginBottom: "0.15rem",
                  }}
                >
                  <strong style={{ fontSize: "0.875rem", color: "var(--text-primary)" }}>
                    {alert.title}
                  </strong>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                    · {timeAgo(alert.createdAt)}
                  </span>
                </div>
                <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>
                  {alert.message.slice(0, 100)}
                  {alert.message.length > 100 ? "…" : ""}
                </div>
                <div style={{ marginTop: "0.35rem", display: "flex", gap: "0.5rem", alignItems: "center" }}>
                  <Link
                    href={`/items/${alert.reconBot.item.id}`}
                    style={{
                      fontSize: "0.8rem",
                      color: "var(--accent)",
                      fontWeight: 700,
                      textDecoration: "none",
                    }}
                  >
                    View {alert.reconBot.item.title?.slice(0, 24) ?? "item"} →
                  </Link>
                </div>
              </div>
              <button
                onClick={() => dismissAlert(alert.id)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--text-muted)",
                  fontSize: "0.85rem",
                  flexShrink: 0,
                  padding: "0.25rem",
                  minWidth: "2rem",
                  minHeight: "2rem",
                }}
                title="Dismiss"
              >
                ✕
              </button>
            </div>
          ))}

          {visible.length > 5 && (
            <div style={{ textAlign: "center", fontSize: "0.8rem", color: "var(--warning-text)" }}>
              +{visible.length - 5} more alerts — visit each item to view
            </div>
          )}
        </div>
      )}
    </div>
  );
}
