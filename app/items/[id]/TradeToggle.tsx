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
  const accepted = proposals.filter(p => p.status === "ACCEPTED");

  return (
    <div style={{ background: "var(--ghost-bg)", border: "1px solid var(--border-default)", borderLeft: "3px solid #00bcd4", borderRadius: 12, padding: "16px 20px" }}>
      {/* Toggle row */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>{"\u{1F504}"} Accept Trades</div>
          <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>Allow buyers to propose items in exchange</div>
        </div>
        <button onClick={toggle} disabled={loading} style={{ width: 44, height: 24, borderRadius: 12, background: enabled ? "#00bcd4" : "var(--bg-card-hover)", border: "none", cursor: loading ? "wait" : "pointer", position: "relative", transition: "background 0.2s", flexShrink: 0, padding: 0 }}>
          <div style={{ width: 20, height: 20, borderRadius: 10, background: "#fff", position: "absolute", top: 2, left: enabled ? 22 : 2, transition: "left 0.2s ease", boxShadow: "0 1px 3px rgba(0,0,0,0.3)" }} />
        </button>
      </div>

      {/* Disabled state */}
      {!enabled && (
        <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 8, lineHeight: 1.4 }}>
          Trades are off. Enable to let buyers propose item exchanges.
        </div>
      )}

      {/* Enabled state — always show Trade Center button */}
      {enabled && (
        <>
          <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 8, lineHeight: 1.4 }}>
            <span style={{ color: "#22c55e" }}>{"\u{1F7E2}"}</span>{" "}
            <strong style={{ color: "var(--text-primary)" }}>Trading is active</strong>
            {" \u2014 "}buyers can propose item exchanges on your store page.
          </div>

          {/* ALWAYS-VISIBLE Trade Center Button */}
          <button
            onClick={() => setExpanded(!expanded)}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              width: "100%",
              marginTop: 12,
              padding: "12px 16px",
              borderRadius: 10,
              border: "1px solid rgba(0,188,212,0.25)",
              background: expanded ? "rgba(0,188,212,0.1)" : "rgba(0,188,212,0.04)",
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 16 }}>{"\u{1F504}"}</span>
              <div style={{ textAlign: "left" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>
                  Trade Center
                </div>
                <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 1 }}>
                  {pending.length > 0
                    ? `${pending.length} pending proposal${pending.length !== 1 ? "s" : ""}`
                    : "View proposals & manage trades"}
                </div>
              </div>
            </div>
            <span style={{ color: "#00bcd4", fontSize: 14, fontWeight: 600 }}>
              {expanded ? "\u25B2" : "\u2192"}
            </span>
          </button>

          {/* EXPANDED TRADE CENTER */}
          {expanded && (
            <div style={{ marginTop: 12 }}>

              {/* Section 1 — Status Dashboard */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6, marginBottom: 14 }}>
                {[
                  { label: "Status", value: "\u2705 Active", color: "#22c55e" },
                  { label: "Pending", value: String(pending.length), color: pending.length > 0 ? "#f59e0b" : "var(--text-muted)" },
                  { label: "Total", value: String(proposals.length), color: "var(--text-primary)" },
                  { label: "Accepted", value: String(accepted.length), color: accepted.length > 0 ? "#22c55e" : "var(--text-muted)" },
                ].map(s => (
                  <div key={s.label} style={{
                    background: "var(--bg-card)", border: "1px solid var(--border-default)",
                    borderRadius: 8, padding: "8px 6px", textAlign: "center",
                  }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: s.color }}>{s.value}</div>
                    <div style={{ fontSize: 9, color: "var(--text-muted)", marginTop: 2, textTransform: "uppercase", letterSpacing: "0.06em" }}>{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Section 2 — How Trading Works */}
              <div style={{
                background: "var(--bg-card)", border: "1px solid var(--border-default)",
                borderRadius: 10, padding: "14px 16px", marginBottom: 14,
              }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-primary)", marginBottom: 10 }}>How Trading Works</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {[
                    { n: "1", text: "Buyers see a \u201CPropose Trade\u201D button on your store page" },
                    { n: "2", text: "They list items they want to trade + optional cash" },
                    { n: "3", text: "You review proposals here and accept, decline, or counter" },
                    { n: "4", text: "If accepted, both parties coordinate the exchange" },
                  ].map(step => (
                    <div key={step.n} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                      <div style={{
                        width: 22, height: 22, borderRadius: "50%", flexShrink: 0,
                        background: "rgba(0,188,212,0.12)", border: "1px solid rgba(0,188,212,0.25)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 11, fontWeight: 700, color: "#00bcd4",
                      }}>{step.n}</div>
                      <div style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.4, paddingTop: 2 }}>{step.text}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Section 3 — Proposals */}
              {proposals.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 10 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Proposals</div>
                  {proposals.map(p => (
                    <div key={p.id} style={{ background: "var(--bg-card)", border: "1px solid var(--border-default)", borderRadius: 10, padding: 12 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)" }}>{p.proposerName || "Anonymous Buyer"}</div>
                        <span style={{
                          fontSize: 9, fontWeight: 700, padding: "2px 8px", borderRadius: 12,
                          background: p.status === "PENDING" ? "rgba(245,158,11,0.12)" : p.status === "ACCEPTED" ? "rgba(76,175,80,0.12)" : "rgba(239,68,68,0.12)",
                          color: p.status === "PENDING" ? "#f59e0b" : p.status === "ACCEPTED" ? "#4caf50" : "#ef4444",
                        }}>{p.status}</span>
                      </div>
                      {p.proposedItems?.map((it: any, i: number) => (
                        <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "3px 0", borderBottom: i < p.proposedItems.length - 1 ? "1px solid var(--border-default)" : "none" }}>
                          <div>
                            <span style={{ fontSize: 11, color: "var(--text-secondary)" }}>{it.title}</span>
                            <span style={{ fontSize: 9, color: "var(--text-muted)", marginLeft: 6 }}>{it.condition}</span>
                          </div>
                          <span style={{ fontSize: 11, fontWeight: 600, color: "#00bcd4" }}>${it.estimatedValue}</span>
                        </div>
                      ))}
                      {p.cashAdded > 0 && (
                        <div style={{ display: "flex", justifyContent: "space-between", padding: "3px 0", marginTop: 3 }}>
                          <span style={{ fontSize: 11, color: "var(--text-muted)" }}>+ Cash</span>
                          <span style={{ fontSize: 11, fontWeight: 600, color: "#4caf50" }}>+${p.cashAdded}</span>
                        </div>
                      )}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 6, paddingTop: 6, borderTop: "1px solid var(--border-default)" }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: "#00bcd4" }}>Total: ${Math.round(p.totalValue || 0)}</span>
                        {p.status === "PENDING" && (
                          <div style={{ display: "flex", gap: 6 }}>
                            <button onClick={() => respond(p.id, "ACCEPT")} disabled={responding === p.id} style={{ padding: "4px 10px", fontSize: 10, fontWeight: 700, borderRadius: 6, border: "none", background: "#00bcd4", color: "#fff", cursor: "pointer" }}>Accept</button>
                            <button onClick={() => respond(p.id, "DECLINE")} disabled={responding === p.id} style={{ padding: "4px 10px", fontSize: 10, fontWeight: 700, borderRadius: 6, border: "1px solid rgba(239,68,68,0.3)", background: "transparent", color: "#ef4444", cursor: "pointer" }}>Decline</button>
                          </div>
                        )}
                      </div>
                      {p.buyerNote && <div style={{ fontSize: 10, color: "var(--text-muted)", fontStyle: "italic", marginTop: 5 }}>&quot;{p.buyerNote}&quot;</div>}
                    </div>
                  ))}
                </div>
              ) : (
                /* Empty state with example proposal */
                <div style={{ marginBottom: 10 }}>
                  <div style={{ textAlign: "center", marginBottom: 12 }}>
                    <div style={{ fontSize: 24, marginBottom: 6 }}>{"\u{1F4EC}"}</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>No trade proposals yet</div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4, lineHeight: 1.5 }}>
                      When a buyer proposes a trade, it will appear here with their offered items, estimated values, and action buttons.
                    </div>
                  </div>

                  {/* Example preview */}
                  <div style={{
                    background: "var(--bg-card)", border: "2px dashed var(--border-default)",
                    borderRadius: 10, padding: 12, opacity: 0.55, position: "relative",
                  }}>
                    <span style={{
                      position: "absolute", top: 8, right: 10, fontSize: 9, fontWeight: 700,
                      padding: "2px 8px", borderRadius: 12, background: "var(--ghost-bg)",
                      color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em",
                    }}>Example</span>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)" }}>John D.</div>
                      <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 8px", borderRadius: 12, background: "rgba(245,158,11,0.12)", color: "#f59e0b" }}>PENDING</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", padding: "3px 0" }}>
                      <div>
                        <span style={{ fontSize: 11, color: "var(--text-secondary)" }}>Vintage Record Player</span>
                        <span style={{ fontSize: 9, color: "var(--text-muted)", marginLeft: 6 }}>Good</span>
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 600, color: "#00bcd4" }}>$150</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", padding: "3px 0" }}>
                      <span style={{ fontSize: 11, color: "var(--text-muted)" }}>+ Cash</span>
                      <span style={{ fontSize: 11, fontWeight: 600, color: "#4caf50" }}>+$50</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 6, paddingTop: 6, borderTop: "1px solid var(--border-default)" }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: "#00bcd4" }}>Total: $200</span>
                      <div style={{ display: "flex", gap: 6 }}>
                        <span style={{ padding: "4px 10px", fontSize: 10, fontWeight: 700, borderRadius: 6, background: "rgba(0,188,212,0.15)", color: "var(--text-muted)" }}>Accept</span>
                        <span style={{ padding: "4px 10px", fontSize: 10, fontWeight: 700, borderRadius: 6, border: "1px solid var(--border-default)", color: "var(--text-muted)" }}>Decline</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Close button */}
              <button
                onClick={() => setExpanded(false)}
                style={{
                  width: "100%", padding: "8px 12px", borderRadius: 8,
                  border: "1px solid var(--border-default)", background: "transparent",
                  color: "var(--text-muted)", fontSize: 11, fontWeight: 600,
                  cursor: "pointer", marginTop: 4,
                }}
              >
                Close Trade Center
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
