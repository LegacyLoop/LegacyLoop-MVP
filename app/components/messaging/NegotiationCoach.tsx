"use client";
import { useState, useEffect } from "react";

export default function NegotiationCoach({ conversationId, hasOffer, askingPrice, currentOffer, round }: { conversationId: string; hasOffer: boolean; askingPrice?: number; currentOffer?: number; round?: number }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!hasOffer || !conversationId) return;
    setLoading(true);
    fetch("/api/messages/agent-assist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ conversationId, mode: "negotiate" }),
    }).then(r => r.json()).then(d => setData(d)).catch(() => {}).finally(() => setLoading(false));
  }, [conversationId, hasOffer]);

  if (!hasOffer) return null;

  const neg = data?.negotiation || null;

  const recStyles: Record<string, { bg: string; border: string; color: string; icon: string }> = {
    accept: { bg: "var(--success-bg)", border: "var(--success-border)", color: "var(--success-text)", icon: "✅" },
    counter: { bg: "var(--accent-dim)", border: "var(--accent-border)", color: "var(--accent)", icon: "🔄" },
    hold: { bg: "var(--warning-bg)", border: "var(--warning-border)", color: "var(--warning-text)", icon: "⏸" },
    decline: { bg: "var(--error-bg)", border: "var(--error-border)", color: "var(--error-text)", icon: "❌" },
  };

  return (
    <div style={{ padding: 16, borderBottom: "1px solid var(--border-default)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div style={{ fontSize: 9, fontWeight: 700, color: "var(--accent)", opacity: 0.6, letterSpacing: 2 }}>⚡ NEGOTIATION COACH</div>
        {round && <span style={{ fontSize: 9, padding: "2px 8px", borderRadius: 20, background: "var(--accent-dim)", border: "1px solid var(--accent-border)", color: "var(--accent)" }}>Round {round}</span>}
      </div>

      {/* Price visualization */}
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
        <div style={{ textAlign: "center" as const }}><div style={{ fontSize: 9, color: "var(--text-muted)" }}>Asking</div><div style={{ fontSize: 14, fontWeight: 700, color: "var(--accent)", fontFamily: "var(--font-data)" }}>${askingPrice || "—"}</div></div>
        <div style={{ width: 1, background: "var(--bg-card-hover)", margin: "0 8px" }} />
        <div style={{ textAlign: "center" as const }}><div style={{ fontSize: 9, color: "var(--text-muted)" }}>Current</div><div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", fontFamily: "var(--font-data)" }}>${currentOffer || "—"}</div></div>
        <div style={{ width: 1, background: "var(--bg-card-hover)", margin: "0 8px" }} />
        <div style={{ textAlign: "center" as const }}><div style={{ fontSize: 9, color: "var(--text-muted)" }}>Floor</div><div style={{ fontSize: 14, fontWeight: 700, color: "var(--warning-text)", fontFamily: "var(--font-data)" }}>Private</div></div>
      </div>

      {loading ? (
        <div style={{ height: 40, background: "var(--ghost-bg)", borderRadius: 8 }} />
      ) : neg ? (
        <>
          {/* Recommendation */}
          {(() => { const rs = recStyles[neg.recommendation] || recStyles.counter; return (
            <div style={{ marginBottom: 10 }}>
              <span style={{ display: "inline-block", fontSize: 11, fontWeight: 700, padding: "6px 14px", borderRadius: 9999, minHeight: 36, background: rs.bg, border: `1px solid ${rs.border}`, color: rs.color }}>{rs.icon} {neg.recommendation?.toUpperCase()}</span>
              {neg.counterPrice && <div style={{ fontSize: 20, fontWeight: 700, color: "var(--accent)", marginTop: 8, fontFamily: "var(--font-data)" }}>Counter at ${neg.counterPrice}</div>}
              <div style={{ fontSize: 11, fontStyle: "italic" as const, color: "var(--text-muted)", lineHeight: 1.5, marginTop: 4 }}>{neg.reasoning}</div>
            </div>
          ); })()}

          {/* Suggested message */}
          {neg.suggestedMessage && (
            <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-default)", borderLeft: "3px solid var(--accent)", borderRadius: 8, padding: "10px 12px", marginBottom: 10 }}>
              <div style={{ fontSize: 11, color: "var(--text-primary)", lineHeight: 1.6, fontStyle: "italic" as const }}>{neg.suggestedMessage}</div>
            </div>
          )}
          <button onClick={() => { if (neg.suggestedMessage) { window.dispatchEvent(new CustomEvent("agent-fill-message", { detail: { message: neg.suggestedMessage } })); } }} style={{ width: "100%", minHeight: 44, background: "linear-gradient(135deg, var(--accent), var(--accent-deep))", border: "none", color: "#fff", fontSize: 13, fontWeight: 700, borderRadius: "0.75rem", cursor: "pointer", boxShadow: "0 4px 12px var(--accent-glow)" }}>
            Use This Message →
          </button>
        </>
      ) : null}
    </div>
  );
}
