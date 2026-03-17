"use client";
import { useState, useEffect } from "react";

export default function TradeProposalsPanel({ itemId }: { itemId: string }) {
  const [proposals, setProposals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [responding, setResponding] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/trades/${itemId}`).then(r => r.json()).then(d => {
      setProposals(d.proposals || []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [itemId]);

  async function respond(tradeId: string, action: string) {
    if (action === "DECLINE" && !confirm("Decline this trade proposal? This cannot be undone.")) return;
    setResponding(tradeId);
    try {
      const res = await fetch("/api/trades/respond", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tradeId, action }),
      });
      if (res.ok) {
        setProposals(prev => prev.map(p => p.id === tradeId ? { ...p, status: action === "ACCEPT" ? "ACCEPTED" : action === "DECLINE" ? "DECLINED" : "COUNTERED" } : p));
      }
    } catch { /* ignore */ }
    setResponding(null);
  }

  const pending = proposals.filter(p => p.status === "PENDING");
  if (loading || proposals.length === 0) return null;

  return (
    <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderLeft: "3px solid #00bcd4", borderRadius: 12, padding: "20px 22px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: "#fff" }}>🔄 Trade Proposals</div>
        {pending.length > 0 && <span style={{ background: "rgba(0,188,212,0.15)", color: "#00bcd4", fontSize: 10, fontWeight: 700, padding: "3px 10px", borderRadius: 20 }}>{pending.length} pending</span>}
      </div>

      {proposals.map(p => (
        <div key={p.id} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, padding: 14, marginBottom: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#fff" }}>{p.proposerName || "Anonymous Buyer"}</div>
            <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 8px", borderRadius: 12, background: p.status === "PENDING" ? "rgba(245,158,11,0.12)" : p.status === "ACCEPTED" ? "rgba(76,175,80,0.12)" : "rgba(239,68,68,0.12)", color: p.status === "PENDING" ? "#f59e0b" : p.status === "ACCEPTED" ? "#4caf50" : "#ef4444" }}>{p.status}</span>
          </div>

          {p.proposedItems?.map((item: any, i: number) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "4px 0", borderBottom: i < p.proposedItems.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
              <div>
                <span style={{ fontSize: 11, color: "rgba(207,216,220,0.8)" }}>{item.title}</span>
                <span style={{ fontSize: 9, color: "rgba(207,216,220,0.4)", marginLeft: 6 }}>{item.condition}</span>
              </div>
              <span style={{ fontSize: 11, fontWeight: 600, color: "#00bcd4" }}>${item.estimatedValue}</span>
            </div>
          ))}

          {p.cashAdded > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", marginTop: 4 }}>
              <span style={{ fontSize: 11, color: "rgba(207,216,220,0.6)" }}>+ Cash</span>
              <span style={{ fontSize: 11, fontWeight: 600, color: "#4caf50" }}>+${p.cashAdded}</span>
            </div>
          )}

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8, paddingTop: 8, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#00bcd4" }}>Total: ${Math.round(p.totalValue || 0)}</span>
            {p.status === "PENDING" && (
              <div style={{ display: "flex", gap: 6 }}>
                <button onClick={() => respond(p.id, "ACCEPT")} disabled={responding === p.id} style={{ padding: "5px 12px", fontSize: 10, fontWeight: 700, borderRadius: 6, border: "none", background: "#00bcd4", color: "#000", cursor: "pointer" }}>Accept</button>
                <button onClick={() => respond(p.id, "DECLINE")} disabled={responding === p.id} style={{ padding: "5px 12px", fontSize: 10, fontWeight: 700, borderRadius: 6, border: "1px solid rgba(239,68,68,0.3)", background: "transparent", color: "#ef4444", cursor: "pointer" }}>Decline</button>
              </div>
            )}
          </div>

          {p.buyerNote && <div style={{ fontSize: 10, color: "rgba(207,216,220,0.5)", fontStyle: "italic", marginTop: 6 }}>&quot;{p.buyerNote}&quot;</div>}
        </div>
      ))}
    </div>
  );
}
