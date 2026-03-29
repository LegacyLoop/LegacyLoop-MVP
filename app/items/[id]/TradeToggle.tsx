"use client";
import { useState, useEffect } from "react";

export default function TradeToggle({ itemId, initialEnabled }: { itemId: string; initialEnabled?: boolean }) {
  const [enabled, setEnabled] = useState(initialEnabled ?? false);
  const [loading, setLoading] = useState(false);
  const [proposals, setProposals] = useState<any[]>([]);
  const [proposalsLoading, setProposalsLoading] = useState(true);
  const [responding, setResponding] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [counterTradeId, setCounterTradeId] = useState<string | null>(null);
  const [counterCash, setCounterCash] = useState("");
  const [counterNote, setCounterNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [expandedProposal, setExpandedProposal] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/items/${itemId}/trade-settings`).then(r => r.json()).then(d => {
      if (d.tradeEnabled != null) setEnabled(d.tradeEnabled);
    }).catch(() => {});
    fetch(`/api/trades/${itemId}`).then(r => r.json()).then(d => {
      setProposals(d.proposals || []);
      setProposalsLoading(false);
    }).catch(() => { setProposalsLoading(false); });
  }, [itemId]);

  async function toggle() {
    const next = !enabled;
    setEnabled(next);
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/items/${itemId}/trade-settings`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tradeEnabled: next }),
      });
      if (!res.ok) { setEnabled(!next); setError("Failed to update trade settings"); }
    } catch { setEnabled(!next); setError("Network error"); }
    setLoading(false);
  }

  async function respond(tradeId: string, action: string, extra?: any) {
    if (action === "DECLINE" && !confirm("Decline this trade proposal?")) return;
    setResponding(tradeId);
    setError(null);
    try {
      const res = await fetch("/api/trades/respond", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tradeId, action, ...extra }),
      });
      if (res.ok) {
        setProposals(prev => prev.map(p =>
          p.id === tradeId
            ? { ...p, status: action === "ACCEPT" ? "ACCEPTED" : action === "DECLINE" ? "DECLINED" : "COUNTERED" }
            : p
        ));
        setCounterTradeId(null);
        setCounterCash("");
        setCounterNote("");
      } else {
        const d = await res.json().catch(() => null);
        setError(d?.error || `Failed to ${action.toLowerCase()} proposal`);
      }
    } catch { setError("Network error"); }
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
          aria-label={enabled ? "Disable trades" : "Enable trades"}
          style={{
            width: 32, height: 17, borderRadius: 9, padding: 0,
            background: enabled ? "#00bcd4" : "var(--ghost-bg)",
            border: enabled ? "none" : "1px solid var(--border-default)",
            cursor: loading ? "wait" : "pointer",
            position: "relative" as const, transition: "background 0.2s", flexShrink: 0,
          }}
        >
          <div style={{
            width: 13, height: 13, borderRadius: 7, background: "#fff",
            position: "absolute" as const, top: 2, left: enabled ? 17 : 2,
            transition: "left 0.2s ease",
            boxShadow: "0 1px 2px rgba(0,0,0,0.25)",
          }} />
        </button>
        <span style={{ fontSize: "0.65rem", fontWeight: 600, color: enabled ? "#00bcd4" : "var(--text-muted)" }}>
          Trades {enabled ? "On" : "Off"}
        </span>
        {pending.length > 0 && (
          <span style={{
            fontSize: "0.55rem", fontWeight: 700, padding: "1px 5px",
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

      {/* Error display */}
      {error && (
        <div style={{ fontSize: "0.58rem", color: "#ef4444", padding: "0.2rem 0", marginTop: "0.15rem" }}>
          ⚠️ {error}
        </div>
      )}

      {/* ── Expanded Trade Center ── */}
      {expanded && enabled && (
        <div style={{ marginTop: "0.4rem", padding: "0.5rem 0.6rem", background: "var(--ghost-bg)", border: "1px solid var(--border-default)", borderRadius: "0.4rem" }}>
          {/* Status mini-row */}
          <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.35rem", fontSize: "0.58rem", color: "var(--text-muted)" }}>
            <span>Active <span style={{ color: "#22c55e" }}>{"\u25CF"}</span></span>
            <span>Pending: <strong style={{ color: pending.length > 0 ? "#f59e0b" : "var(--text-muted)" }}>{pending.length}</strong></span>
            <span>Total: <strong>{proposals.length}</strong></span>
          </div>

          {/* Proposals */}
          {proposals.length > 0 ? proposals.map(p => {
            const isExpanded = expandedProposal === p.id;
            const items = p.proposedItems || [];
            return (
              <div key={p.id} style={{
                padding: "0.4rem 0.5rem", borderRadius: "0.4rem",
                background: "var(--bg-card)", border: "1px solid var(--border-default)",
                marginBottom: "0.3rem",
              }}>
                {/* Header row */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.3rem" }}>
                  <button onClick={() => setExpandedProposal(isExpanded ? null : p.id)} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex", alignItems: "center", gap: "0.25rem" }}>
                    <span style={{ fontSize: "0.65rem", fontWeight: 600, color: "var(--text-primary)" }}>{p.proposerName || "Buyer"}</span>
                    <span style={{ fontSize: "0.55rem", color: "var(--text-muted)" }}>{isExpanded ? "▲" : "▼"}</span>
                  </button>
                  <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "#00bcd4" }}>${Math.round(p.totalValue || 0)}</span>
                  <span style={{
                    fontSize: "0.55rem", fontWeight: 700, padding: "1px 5px", borderRadius: 6,
                    background: p.status === "PENDING" ? "rgba(245,158,11,0.1)" : p.status === "ACCEPTED" ? "rgba(76,175,80,0.1)" : p.status === "COUNTERED" ? "rgba(245,158,11,0.1)" : "rgba(239,68,68,0.1)",
                    color: p.status === "PENDING" ? "#f59e0b" : p.status === "ACCEPTED" ? "#4caf50" : p.status === "COUNTERED" ? "#f59e0b" : "#ef4444",
                  }}>{p.status}</span>
                  {p.status === "PENDING" && (
                    <div style={{ display: "flex", gap: "0.2rem" }}>
                      <button onClick={() => respond(p.id, "ACCEPT")} disabled={responding === p.id} style={{ padding: "2px 8px", fontSize: "0.55rem", fontWeight: 700, borderRadius: 4, border: "none", background: "#00bcd4", color: "#fff", cursor: "pointer", minHeight: "24px" }}>✓</button>
                      <button onClick={() => setCounterTradeId(counterTradeId === p.id ? null : p.id)} disabled={responding === p.id} style={{ padding: "2px 8px", fontSize: "0.55rem", fontWeight: 700, borderRadius: 4, border: "1px solid rgba(245,158,11,0.3)", background: "transparent", color: "#f59e0b", cursor: "pointer", minHeight: "24px" }}>↩</button>
                      <button onClick={() => respond(p.id, "DECLINE")} disabled={responding === p.id} style={{ padding: "2px 8px", fontSize: "0.55rem", fontWeight: 700, borderRadius: 4, border: "1px solid rgba(239,68,68,0.3)", background: "transparent", color: "#ef4444", cursor: "pointer", minHeight: "24px" }}>✗</button>
                    </div>
                  )}
                </div>

                {/* Expanded detail */}
                {isExpanded && (
                  <div style={{ marginTop: "0.35rem", paddingTop: "0.35rem", borderTop: "1px solid var(--border-default)" }}>
                    {/* Proposed items */}
                    {items.length > 0 && (
                      <div style={{ marginBottom: "0.3rem" }}>
                        <div style={{ fontSize: "0.55rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" as const, marginBottom: "0.15rem" }}>Items Offered</div>
                        {items.map((item: any, i: number) => (
                          <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.2rem 0.3rem", borderRadius: "0.3rem", background: "var(--ghost-bg)", marginBottom: "0.15rem", fontSize: "0.62rem" }}>
                            <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>{item.title}</span>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                              {item.condition && <span style={{ fontSize: "0.55rem", color: "var(--text-muted)" }}>{item.condition}</span>}
                              <span style={{ fontWeight: 700, color: "#00bcd4" }}>${Math.round(item.estimatedValue || 0)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    {p.cashAdded > 0 && (
                      <div style={{ fontSize: "0.62rem", color: "var(--text-secondary)", marginBottom: "0.2rem" }}>
                        💵 Cash added: <strong style={{ color: "#22c55e" }}>${Math.round(p.cashAdded)}</strong>
                      </div>
                    )}
                    {p.buyerNote && (
                      <div style={{ fontSize: "0.62rem", color: "var(--text-muted)", fontStyle: "italic" as const, marginBottom: "0.2rem" }}>
                        &quot;{p.buyerNote}&quot;
                      </div>
                    )}
                    {p.proposerEmail && (
                      <div style={{ fontSize: "0.55rem", color: "var(--text-muted)" }}>📧 {p.proposerEmail}</div>
                    )}

                    {/* Timeline */}
                    <div style={{ marginTop: "0.3rem", paddingTop: "0.25rem", borderTop: "1px dashed var(--border-default)" }}>
                      <div style={{ fontSize: "0.55rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" as const, marginBottom: "0.15rem" }}>Timeline</div>
                      <div style={{ position: "relative" as const, paddingLeft: "0.75rem" }}>
                        <div style={{ position: "absolute" as const, left: "3px", top: 0, bottom: 0, width: "2px", background: "var(--border-default)" }} />
                        <div style={{ position: "relative" as const, marginBottom: "0.2rem" }}>
                          <div style={{ position: "absolute" as const, left: "-0.75rem", top: "0.1rem", width: 6, height: 6, borderRadius: "50%", background: "#00bcd4" }} />
                          <span style={{ fontSize: "0.58rem", color: "#00bcd4", fontWeight: 600 }}>Proposed</span>
                          <span style={{ fontSize: "0.55rem", color: "var(--text-muted)", marginLeft: "0.3rem" }}>{p.proposerName} · ${Math.round(p.totalValue || 0)}</span>
                        </div>
                        {p.status !== "PENDING" && (
                          <div style={{ position: "relative" as const }}>
                            <div style={{ position: "absolute" as const, left: "-0.75rem", top: "0.1rem", width: 6, height: 6, borderRadius: "50%", background: p.status === "ACCEPTED" ? "#22c55e" : p.status === "COUNTERED" ? "#f59e0b" : "#ef4444" }} />
                            <span style={{ fontSize: "0.58rem", color: p.status === "ACCEPTED" ? "#22c55e" : p.status === "COUNTERED" ? "#f59e0b" : "#ef4444", fontWeight: 600 }}>{p.status === "ACCEPTED" ? "Accepted" : p.status === "COUNTERED" ? "Countered" : "Declined"}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Counter-offer form */}
                {counterTradeId === p.id && (
                  <div style={{ marginTop: "0.35rem", padding: "0.4rem", borderRadius: "0.3rem", background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.15)" }}>
                    <div style={{ fontSize: "0.58rem", fontWeight: 700, color: "#f59e0b", marginBottom: "0.25rem" }}>Counter-Offer</div>
                    <div style={{ display: "flex", gap: "0.3rem", marginBottom: "0.25rem" }}>
                      <input
                        type="number"
                        placeholder="Counter cash $"
                        value={counterCash}
                        onChange={e => setCounterCash(e.target.value)}
                        style={{ flex: 1, padding: "0.25rem 0.4rem", fontSize: "0.62rem", borderRadius: "0.25rem", border: "1px solid var(--border-default)", background: "var(--bg-card)", color: "var(--text-primary)" }}
                      />
                    </div>
                    <input
                      placeholder="Message to buyer (optional)"
                      value={counterNote}
                      onChange={e => setCounterNote(e.target.value)}
                      style={{ width: "100%", padding: "0.25rem 0.4rem", fontSize: "0.62rem", borderRadius: "0.25rem", border: "1px solid var(--border-default)", background: "var(--bg-card)", color: "var(--text-primary)", marginBottom: "0.25rem" }}
                    />
                    <div style={{ display: "flex", gap: "0.3rem" }}>
                      <button
                        onClick={() => respond(p.id, "COUNTER", { counterCash: Number(counterCash) || 0, sellerNote: counterNote })}
                        disabled={responding === p.id}
                        style={{ padding: "0.25rem 0.5rem", fontSize: "0.58rem", fontWeight: 700, borderRadius: "0.25rem", border: "none", background: "#f59e0b", color: "#fff", cursor: "pointer" }}
                      >Send Counter</button>
                      <button onClick={() => setCounterTradeId(null)} style={{ padding: "0.25rem 0.5rem", fontSize: "0.58rem", fontWeight: 600, borderRadius: "0.25rem", border: "1px solid var(--border-default)", background: "transparent", color: "var(--text-muted)", cursor: "pointer" }}>Cancel</button>
                    </div>
                  </div>
                )}
              </div>
            );
          }) : (
            <div style={{ fontSize: "0.58rem", color: "var(--text-muted)", textAlign: "center" as const, padding: "0.3rem 0" }}>No proposals yet</div>
          )}
        </div>
      )}
    </div>
  );
}
