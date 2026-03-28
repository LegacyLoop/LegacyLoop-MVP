"use client";
import { useState, useEffect } from "react";

export default function TradeToggle({ itemId, initialEnabled }: { itemId: string; initialEnabled?: boolean }) {
  const [enabled, setEnabled] = useState(initialEnabled ?? false);
  const [loading, setLoading] = useState(false);
  const [proposals, setProposals] = useState<any[]>([]);
  const [proposalsLoading, setProposalsLoading] = useState(true);
  const [responding, setResponding] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    fetch(`/api/items/${itemId}/trade-settings`).then(r => r.json()).then(d => {
      if (d.tradeEnabled != null) setEnabled(d.tradeEnabled);
    }).catch(() => {});
    fetch(`/api/trades/${itemId}`).then(r => r.json()).then(d => {
      const all = d.proposals || [];
      setProposals(all);
      setProposalsLoading(false);
    }).catch(() => { setProposalsLoading(false); });
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

  async function respond(tradeId: string, action: string) {
    if (action === "DECLINE" && !confirm("Decline this trade proposal?")) return;
    setResponding(tradeId);
    try {
      const res = await fetch("/api/trades/respond", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tradeId, action }),
      });
      if (res.ok) {
        setProposals(prev => prev.map(p =>
          p.id === tradeId
            ? { ...p, status: action === "ACCEPT" ? "ACCEPTED" : action === "DECLINE" ? "DECLINED" : "COUNTERED" }
            : p
        ));
      }
    } catch { /* ignore */ }
    setResponding(null);
  }

  const pending = proposals.filter(p => p.status === "PENDING");

  return (
    <div>
      {/* ── Compact row: label + badge + toggle ── */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
        <button
          onClick={toggle}
          disabled={loading}
          style={{
            width: 32, height: 17, borderRadius: 9, padding: 0,
            background: enabled ? "#00bcd4" : "var(--ghost-bg)",
            border: enabled ? "none" : "1px solid var(--border-default)",
            cursor: loading ? "wait" : "pointer",
            position: "relative", transition: "background 0.2s", flexShrink: 0,
          }}
        >
          <div style={{
            width: 13, height: 13, borderRadius: 7, background: "#fff",
            position: "absolute", top: 2, left: enabled ? 17 : 2,
            transition: "left 0.2s ease",
            boxShadow: "0 1px 2px rgba(0,0,0,0.25)",
          }} />
        </button>
        <span style={{ fontSize: "0.65rem", fontWeight: 600, color: enabled ? "#00bcd4" : "var(--text-muted)" }}>
          Trades {enabled ? "On" : "Off"}
        </span>
        {pending.length > 0 && (
          <span style={{
            fontSize: "0.5rem", fontWeight: 700, padding: "1px 5px",
            borderRadius: 8, background: "rgba(245,158,11,0.12)", color: "#f59e0b",
          }}>
            {pending.length} pending
          </span>
        )}
        {enabled && proposals.length > 0 && (
          <button
            onClick={() => setExpanded(!expanded)}
            style={{
              fontSize: "0.55rem", fontWeight: 600, color: "var(--accent)",
              background: "none", border: "none", cursor: "pointer", padding: 0, marginLeft: "auto",
            }}
          >
            {expanded ? "\u25B2 Close" : `\u25BC Trade Center`}
          </button>
        )}
      </div>

      {/* ── Expanded Trade Center (only when toggled) ── */}
      {expanded && enabled && (
        <div style={{ marginTop: "0.4rem", padding: "0.4rem 0.5rem", background: "var(--ghost-bg)", border: "1px solid var(--border-default)", borderRadius: "0.4rem" }}>
          {/* Status mini-row */}
          <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.35rem", fontSize: "0.58rem", color: "var(--text-muted)" }}>
            <span>Active <span style={{ color: "#22c55e" }}>{"\u25CF"}</span></span>
            <span>Pending: <strong style={{ color: pending.length > 0 ? "#f59e0b" : "var(--text-muted)" }}>{pending.length}</strong></span>
            <span>Total: <strong>{proposals.length}</strong></span>
          </div>

          {/* Proposals list */}
          {proposals.length > 0 ? proposals.map(p => (
            <div key={p.id} style={{
              padding: "0.3rem 0.4rem", borderRadius: "0.3rem",
              background: "var(--bg-card)", border: "1px solid var(--border-default)",
              marginBottom: "0.2rem",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.3rem" }}>
                <span style={{ fontSize: "0.62rem", fontWeight: 600, color: "var(--text-primary)" }}>{p.proposerName || "Buyer"}</span>
                <span style={{ fontSize: "0.62rem", fontWeight: 700, color: "#00bcd4" }}>${Math.round(p.totalValue || 0)}</span>
                <span style={{
                  fontSize: "0.48rem", fontWeight: 700, padding: "1px 5px", borderRadius: 6,
                  background: p.status === "PENDING" ? "rgba(245,158,11,0.1)" : p.status === "ACCEPTED" ? "rgba(76,175,80,0.1)" : "rgba(239,68,68,0.1)",
                  color: p.status === "PENDING" ? "#f59e0b" : p.status === "ACCEPTED" ? "#4caf50" : "#ef4444",
                }}>{p.status}</span>
                {p.status === "PENDING" && (
                  <div style={{ display: "flex", gap: "0.2rem" }}>
                    <button onClick={() => respond(p.id, "ACCEPT")} disabled={responding === p.id} style={{ padding: "1px 6px", fontSize: "0.52rem", fontWeight: 700, borderRadius: 4, border: "none", background: "#00bcd4", color: "#fff", cursor: "pointer" }}>{"\u2713"}</button>
                    <button onClick={() => respond(p.id, "DECLINE")} disabled={responding === p.id} style={{ padding: "1px 6px", fontSize: "0.52rem", fontWeight: 700, borderRadius: 4, border: "1px solid rgba(239,68,68,0.3)", background: "transparent", color: "#ef4444", cursor: "pointer" }}>{"\u2717"}</button>
                  </div>
                )}
              </div>
            </div>
          )) : (
            <div style={{ fontSize: "0.58rem", color: "var(--text-muted)", textAlign: "center", padding: "0.3rem 0" }}>No proposals yet</div>
          )}
        </div>
      )}
    </div>
  );
}
