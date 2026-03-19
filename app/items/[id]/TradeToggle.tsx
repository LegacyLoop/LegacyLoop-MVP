"use client";
import { useState, useEffect } from "react";

export default function TradeToggle({ itemId, initialEnabled }: { itemId: string; initialEnabled?: boolean }) {
  const [enabled, setEnabled] = useState(initialEnabled ?? false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch(`/api/items/${itemId}/trade-settings`).then(r => r.json()).then(d => {
      if (d.tradeEnabled != null) setEnabled(d.tradeEnabled);
    }).catch(() => {});
  }, [itemId]);

  async function toggle() {
    const next = !enabled;
    setEnabled(next);
    setLoading(true);
    try {
      await fetch(`/api/items/${itemId}/trade-settings`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tradeEnabled: next }),
      });
    } catch { setEnabled(!next); }
    setLoading(false);
  }

  return (
    <div style={{ background: "var(--ghost-bg)", border: "1px solid var(--border-default)", borderLeft: "3px solid #00bcd4", borderRadius: 12, padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
      <div>
        <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>🔄 Accept Trades</div>
        <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>Allow buyers to propose items in exchange</div>
      </div>
      <button onClick={toggle} disabled={loading} style={{ width: 44, height: 24, borderRadius: 12, background: enabled ? "#00bcd4" : "var(--bg-card-hover)", border: "none", cursor: loading ? "wait" : "pointer", position: "relative", transition: "background 0.2s", flexShrink: 0, padding: 0 }}>
        <div style={{ width: 20, height: 20, borderRadius: 10, background: "#fff", position: "absolute", top: 2, left: enabled ? 22 : 2, transition: "left 0.2s ease", boxShadow: "0 1px 3px rgba(0,0,0,0.3)" }} />
      </button>
    </div>
  );
}
