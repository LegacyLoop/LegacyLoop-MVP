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
    accept: { bg: "rgba(76,175,80,0.15)", border: "#4caf50", color: "#4caf50", icon: "✅" },
    counter: { bg: "rgba(0,188,212,0.15)", border: "#00bcd4", color: "#00bcd4", icon: "🔄" },
    hold: { bg: "rgba(255,152,0,0.15)", border: "#ff9800", color: "#ff9800", icon: "⏸" },
    decline: { bg: "rgba(244,67,54,0.15)", border: "#f44336", color: "#f44336", icon: "❌" },
  };

  return (
    <div style={{ padding: 16, borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div style={{ fontSize: 9, fontWeight: 700, color: "rgba(0,188,212,0.6)", letterSpacing: 2 }}>⚡ NEGOTIATION COACH</div>
        {round && <span style={{ fontSize: 9, padding: "2px 8px", borderRadius: 20, background: "rgba(0,188,212,0.15)", border: "1px solid rgba(0,188,212,0.3)", color: "#00bcd4" }}>Round {round}</span>}
      </div>

      {/* Price visualization */}
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
        <div style={{ textAlign: "center" as const }}><div style={{ fontSize: 9, color: "rgba(207,216,220,0.5)" }}>Asking</div><div style={{ fontSize: 14, fontWeight: 700, color: "#00bcd4" }}>${askingPrice || "—"}</div></div>
        <div style={{ width: 1, background: "rgba(255,255,255,0.1)", margin: "0 8px" }} />
        <div style={{ textAlign: "center" as const }}><div style={{ fontSize: 9, color: "rgba(207,216,220,0.5)" }}>Current</div><div style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>${currentOffer || "—"}</div></div>
        <div style={{ width: 1, background: "rgba(255,255,255,0.1)", margin: "0 8px" }} />
        <div style={{ textAlign: "center" as const }}><div style={{ fontSize: 9, color: "rgba(207,216,220,0.5)" }}>Floor</div><div style={{ fontSize: 14, fontWeight: 700, color: "#f59e0b" }}>Private</div></div>
      </div>

      {loading ? (
        <div style={{ height: 40, background: "rgba(255,255,255,0.04)", borderRadius: 8 }} />
      ) : neg ? (
        <>
          {/* Recommendation */}
          {(() => { const rs = recStyles[neg.recommendation] || recStyles.counter; return (
            <div style={{ marginBottom: 10 }}>
              <span style={{ display: "inline-block", fontSize: 11, fontWeight: 700, padding: "6px 14px", borderRadius: 20, background: rs.bg, border: `1px solid ${rs.border}`, color: rs.color }}>{rs.icon} {neg.recommendation?.toUpperCase()}</span>
              {neg.counterPrice && <div style={{ fontSize: 20, fontWeight: 700, color: "#00bcd4", marginTop: 8 }}>Counter at ${neg.counterPrice}</div>}
              <div style={{ fontSize: 11, fontStyle: "italic" as const, color: "rgba(207,216,220,0.6)", lineHeight: 1.5, marginTop: 4 }}>{neg.reasoning}</div>
            </div>
          ); })()}

          {/* Suggested message */}
          {neg.suggestedMessage && (
            <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderLeft: "3px solid #00bcd4", borderRadius: 8, padding: "10px 12px", marginBottom: 10 }}>
              <div style={{ fontSize: 11, color: "#fff", lineHeight: 1.6, fontStyle: "italic" as const }}>{neg.suggestedMessage}</div>
            </div>
          )}
          <button onClick={() => { if (neg.suggestedMessage) { window.dispatchEvent(new CustomEvent("agent-fill-message", { detail: { message: neg.suggestedMessage } })); } }} style={{ width: "100%", height: 44, background: "linear-gradient(135deg, #00bcd4, #0097a7)", border: "none", color: "#000", fontSize: 13, fontWeight: 700, borderRadius: 8, cursor: "pointer", boxShadow: "0 4px 12px rgba(0,188,212,0.3)" }}>
            Use This Message →
          </button>
        </>
      ) : null}
    </div>
  );
}
