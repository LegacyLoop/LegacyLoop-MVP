"use client";
import { useState, useEffect } from "react";

export default function BuyerIntelligenceCard({ conversationId }: { conversationId: string }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!conversationId) return;
    setLoading(true);
    fetch("/api/messages/agent-assist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ conversationId, mode: "smart_reply" }),
    }).then(r => r.json()).then(d => setData(d)).catch(() => {}).finally(() => setLoading(false));
  }, [conversationId]);

  if (loading) return (
    <div style={{ padding: 16 }}>
      <div style={{ fontSize: 9, fontWeight: 700, color: "var(--accent)", opacity: 0.6, letterSpacing: 2, marginBottom: 12 }}>🧠 BUYER INTELLIGENCE</div>
      <div style={{ height: 60, background: "var(--ghost-bg)", borderRadius: 8, animation: "pulse 1.5s infinite" }} />
    </div>
  );

  const intent = data?.intent || { score: 0, label: "cold", signals: [], recommendation: "No data available." };
  const sentiment = data?.sentiment || { score: 50, label: "neutral" };
  const prob = Math.min(95, Math.max(5, intent.score));

  const intentColors: Record<string, string> = { hot: "var(--success-text)", warm: "var(--accent)", cold: "var(--warning-text)", ghost: "var(--text-muted)" };
  const intentLabels: Record<string, string> = { hot: "🔥 HOT LEAD", warm: "👀 WARM", cold: "❄️ COOL", ghost: "👻 GHOST" };
  const sentimentStyles: Record<string, { bg: string; border: string; color: string; emoji: string }> = {
    positive: { bg: "var(--success-bg)", border: "var(--success-border)", color: "var(--success-text)", emoji: "😊" },
    neutral: { bg: "var(--ghost-bg)", border: "var(--border-default)", color: "var(--text-muted)", emoji: "😐" },
    frustrated: { bg: "var(--warning-bg)", border: "var(--warning-border)", color: "var(--warning-text)", emoji: "😤" },
    red_flag: { bg: "var(--error-bg)", border: "var(--error-border)", color: "var(--error-text)", emoji: "🚨" },
  };
  const ss = sentimentStyles[sentiment.label] || sentimentStyles.neutral;
  const ringColor = intentColors[intent.label] || intentColors.cold;

  return (
    <div style={{ padding: 16, borderBottom: "1px solid var(--border-default)" }}>
      <div style={{ fontSize: 9, fontWeight: 700, color: "var(--accent)", opacity: 0.6, letterSpacing: 2, marginBottom: 12 }}>🧠 BUYER INTELLIGENCE</div>

      {/* Intent Score Ring */}
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 14 }}>
        <div style={{ width: 64, height: 64, borderRadius: "50%", border: `3px solid ${ringColor}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "0 0 12px var(--accent-dim)" }}>
          <span style={{ fontSize: 22, fontWeight: 800, color: "var(--text-primary)", fontFamily: "var(--font-data)" }}>{intent.score}</span>
        </div>
        <div>
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1, color: ringColor }}>{intentLabels[intent.label] || intent.label}</div>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 4, marginTop: 4, background: ss.bg, border: `1px solid ${ss.border}`, borderRadius: 20, padding: "3px 10px", fontSize: 10, color: ss.color }}>
            {ss.emoji} {sentiment.label}
          </div>
        </div>
      </div>

      {/* Deal Probability */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
          <span style={{ fontSize: 10, color: "var(--text-muted)" }}>Deal Probability</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-primary)", fontFamily: "var(--font-data)" }}>{prob}%</span>
        </div>
        <div style={{ height: 6, borderRadius: 3, background: "var(--ghost-bg)", overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${prob}%`, borderRadius: 3, background: prob > 70 ? "var(--success-text)" : prob > 40 ? "var(--accent)" : "var(--warning-text)", transition: "width 0.4s ease" }} />
        </div>
      </div>

      {/* Signals */}
      {intent.signals?.length > 0 && (
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 10, color: "var(--text-muted)", marginBottom: 6 }}>Signals</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
            {intent.signals.slice(0, 4).map((s: string, i: number) => (
              <span key={i} style={{ fontSize: 9, padding: "2px 8px", borderRadius: 20, background: "var(--ghost-bg)", border: "1px solid var(--border-default)", color: "var(--text-secondary)" }}>{s}</span>
            ))}
          </div>
        </div>
      )}

      {/* Recommendation */}
      <div style={{ background: "var(--accent-dim)", border: "1px solid var(--accent-border)", borderRadius: "0.75rem", padding: "10px 12px", boxShadow: "0 0 12px var(--accent-dim)" }}>
        <span style={{ fontSize: 11, color: "var(--accent)", lineHeight: 1.5 }}>💡 {intent.recommendation}</span>
      </div>

      {/* Scam Warning — HIGH VISIBILITY */}
      {data?.type === "scam_warning" && (
        <div style={{ marginTop: 14, background: "var(--error-bg)", border: "2px solid var(--error-border)", borderRadius: 12, padding: "16px 14px", boxShadow: "0 0 20px var(--error-bg)", animation: "pulse 2s infinite" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <span style={{ fontSize: 20 }}>🚨</span>
            <span style={{ fontSize: 14, fontWeight: 800, color: "var(--error-text)", letterSpacing: 0.5, textTransform: "uppercase" }}>Scam Alert</span>
          </div>
          <div style={{ fontSize: 12, color: "var(--text-primary)", lineHeight: 1.6, marginBottom: 12 }}>{data.scam?.warning}</div>
          {data.scam?.confidence && (
            <div style={{ fontSize: 10, color: "var(--error-text)", fontWeight: 600, marginBottom: 10 }}>
              Confidence: {data.scam.confidence === "high" ? "HIGH" : data.scam.confidence === "medium" ? "MEDIUM" : "LOW"}
            </div>
          )}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button style={{ fontSize: 11, fontWeight: 600, padding: "8px 16px", minHeight: 44, borderRadius: "0.75rem", background: "var(--error-text)", color: "#fff", border: "none", cursor: "pointer" }}>Block Buyer</button>
            <button style={{ fontSize: 11, fontWeight: 600, padding: "8px 16px", minHeight: 44, borderRadius: "0.75rem", background: "transparent", color: "var(--error-text)", border: "1px solid var(--error-border)", cursor: "pointer" }}>Acknowledge</button>
          </div>
        </div>
      )}
    </div>
  );
}
