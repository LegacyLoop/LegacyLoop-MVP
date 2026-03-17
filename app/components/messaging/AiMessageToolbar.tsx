"use client";
import { useState } from "react";

const MODES = [
  { key: "smart_reply", label: "⚡ Smart Reply" },
  { key: "negotiate", label: "🤝 Negotiate" },
  { key: "counter_price", label: "💰 Counter" },
  { key: "professional", label: "✍️ Polish" },
  { key: "tone_adjust", label: "🎯 Tone" },
];

const TONES = ["professional", "friendly", "firm", "warm"];

export default function AiMessageToolbar({ conversationId, onResult, userDraft }: { conversationId: string; onResult: (data: any) => void; userDraft?: string }) {
  const [activeMode, setActiveMode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showTones, setShowTones] = useState(false);

  async function callAgent(mode: string, extra?: Record<string, string>) {
    setLoading(true);
    setActiveMode(mode);
    try {
      const res = await fetch("/api/messages/agent-assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId, mode, userDraft, ...extra }),
      });
      const data = await res.json();
      onResult({ mode, ...data });
    } catch {
      onResult({ mode, error: true });
    }
    setLoading(false);
    setActiveMode(null);
  }

  return (
    <div>
      <div style={{ background: "rgba(0,188,212,0.04)", border: "1px solid rgba(0,188,212,0.12)", borderRadius: 10, padding: "8px 12px", marginBottom: 6, display: "flex", alignItems: "center", flexWrap: "wrap" as const, gap: 6 }}>
        {MODES.map(m => (
          <button key={m.key} onClick={() => m.key === "tone_adjust" ? setShowTones(!showTones) : callAgent(m.key)} disabled={loading} style={{ padding: "4px 12px", fontSize: 10, borderRadius: 20, border: activeMode === m.key ? "1px solid #00bcd4" : "1px solid rgba(255,255,255,0.1)", background: activeMode === m.key ? "rgba(0,188,212,0.15)" : "transparent", color: activeMode === m.key ? "#00bcd4" : "rgba(255,255,255,0.4)", cursor: loading ? "wait" : "pointer", transition: "all 0.15s" }}>
            {loading && activeMode === m.key ? "Thinking..." : m.label}
          </button>
        ))}
        <span style={{ marginLeft: "auto", fontSize: 9, fontWeight: 700, color: "rgba(0,188,212,0.5)", letterSpacing: 1.5 }}>AI ASSIST</span>
      </div>
      {showTones && (
        <div style={{ display: "flex", gap: 6, padding: "4px 0", marginBottom: 4 }}>
          {TONES.map(t => (
            <button key={t} onClick={() => { setShowTones(false); callAgent("tone_adjust", { toneTarget: t }); }} style={{ padding: "4px 12px", fontSize: 10, borderRadius: 20, border: "1px solid rgba(0,188,212,0.3)", background: "transparent", color: "#00bcd4", cursor: "pointer", textTransform: "capitalize" as const }}>{t}</button>
          ))}
        </div>
      )}
    </div>
  );
}
