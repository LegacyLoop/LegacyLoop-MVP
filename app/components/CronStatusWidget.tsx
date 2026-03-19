"use client";

import { useState, useEffect } from "react";

export default function CronStatusWidget() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const secret = (typeof window !== "undefined" && (window as any).__CRON_SECRET) || "";
    fetch(`/api/cron/offers?secret=${encodeURIComponent(secret)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const status = data?.status === "healthy" ? "healthy" : data?.status === "error" ? "error" : "unknown";
  const statusStyles: Record<string, { border: string; color: string; label: string }> = {
    healthy: { border: "#4caf50", color: "#4caf50", label: "● Running" },
    error: { border: "#f44336", color: "#f44336", label: "● Error" },
    unknown: { border: "var(--border-default)", color: "var(--text-muted)", label: "● Unknown" },
  };
  const ss = statusStyles[status];

  return (
    <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-default)", borderRadius: 12, padding: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: "#fff" }}>⏱️ Offer Expiry Cron</span>
        <span style={{ fontSize: 9, padding: "3px 10px", borderRadius: 20, border: `1px solid ${ss.border}`, color: ss.color }}>
          {loading ? "Loading..." : ss.label}
        </span>
      </div>
      {!loading && data && (
        <>
          <div style={{ display: "flex", gap: 12, marginBottom: 8 }}>
            {[
              { label: "Last Run", value: data.lastRun ? new Date(data.lastRun).toLocaleTimeString() : "Never" },
              { label: "Total Runs", value: String(data.totalRuns || 0) },
              { label: "Expired", value: String(data.totalOffersExpired || 0) },
            ].map((s, i) => (
              <div key={i} style={{ flex: 1 }}>
                <div style={{ fontSize: 10, color: "rgba(207,216,220,0.5)" }}>{s.label}</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>{s.value}</div>
              </div>
            ))}
          </div>
          <div style={{ fontSize: 10, color: "rgba(0,188,212,0.6)" }}>🔄 {data.schedule || "Every 30 minutes"}</div>
        </>
      )}
    </div>
  );
}
