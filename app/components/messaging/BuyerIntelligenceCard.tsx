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
      <div style={{ fontSize: 9, fontWeight: 700, color: "rgba(0,188,212,0.6)", letterSpacing: 2, marginBottom: 12 }}>🧠 BUYER INTELLIGENCE</div>
      <div style={{ height: 60, background: "var(--ghost-bg)", borderRadius: 8, animation: "pulse 1.5s infinite" }} />
    </div>
  );

  const intent = data?.intent || { score: 0, label: "cold", signals: [], recommendation: "No data available." };
  const sentiment = data?.sentiment || { score: 50, label: "neutral" };
  const prob = Math.min(95, Math.max(5, intent.score));

  const intentColors: Record<string, string> = { hot: "#4caf50", warm: "#00bcd4", cold: "#ff9800", ghost: "var(--text-muted)" };
  const intentLabels: Record<string, string> = { hot: "🔥 HOT LEAD", warm: "👀 WARM", cold: "❄️ COOL", ghost: "👻 GHOST" };
  const sentimentStyles: Record<string, { bg: string; border: string; color: string; emoji: string }> = {
    positive: { bg: "rgba(76,175,80,0.15)", border: "#4caf50", color: "#4caf50", emoji: "😊" },
    neutral: { bg: "var(--ghost-bg)", border: "var(--border-default)", color: "var(--text-muted)", emoji: "😐" },
    frustrated: { bg: "rgba(255,152,0,0.15)", border: "#ff9800", color: "#ff9800", emoji: "😤" },
    red_flag: { bg: "rgba(244,67,54,0.15)", border: "#f44336", color: "#f44336", emoji: "🚨" },
  };
  const ss = sentimentStyles[sentiment.label] || sentimentStyles.neutral;
  const ringColor = intentColors[intent.label] || intentColors.cold;

  return (
    <div style={{ padding: 16, borderBottom: "1px solid var(--border-default)" }}>
      <div style={{ fontSize: 9, fontWeight: 700, color: "rgba(0,188,212,0.6)", letterSpacing: 2, marginBottom: 12 }}>🧠 BUYER INTELLIGENCE</div>

      {/* Intent Score Ring */}
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 14 }}>
        <div style={{ width: 64, height: 64, borderRadius: "50%", border: `3px solid ${ringColor}`, display: "flex", alignItems: "center", justifyContent: "center", background: `${ringColor}15`, flexShrink: 0 }}>
          <span style={{ fontSize: 22, fontWeight: 800, color: "var(--text-primary)" }}>{intent.score}</span>
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
          <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-primary)" }}>{prob}%</span>
        </div>
        <div style={{ height: 6, borderRadius: 3, background: "var(--ghost-bg)", overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${prob}%`, borderRadius: 3, background: prob > 70 ? "#4caf50" : prob > 40 ? "#00bcd4" : "#ff9800", transition: "width 0.4s ease" }} />
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
      <div style={{ background: "rgba(0,188,212,0.08)", border: "1px solid rgba(0,188,212,0.2)", borderRadius: 8, padding: "10px 12px", boxShadow: "0 0 12px rgba(0,188,212,0.15)" }}>
        <span style={{ fontSize: 11, color: "rgba(0,188,212,0.9)", lineHeight: 1.5 }}>💡 {intent.recommendation}</span>
      </div>

      {/* Scam Warning */}
      {data?.type === "scam_warning" && (
        <div style={{ marginTop: 10, background: "rgba(244,67,54,0.1)", border: "1px solid rgba(244,67,54,0.4)", borderRadius: 10, padding: 14 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#f44336", marginBottom: 6 }}>⚠️ Potential Scam Detected</div>
          <div style={{ fontSize: 11, color: "var(--text-secondary)", lineHeight: 1.5 }}>{data.scam?.warning}</div>
        </div>
      )}
    </div>
  );
}
