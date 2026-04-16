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
      <div style={{ background: "var(--accent-dim)", border: "1px solid var(--accent-border)", borderRadius: "0.75rem", padding: "8px 12px", marginBottom: 6, display: "flex", alignItems: "center", flexWrap: "wrap" as const, gap: 6 }}>
        {MODES.map(m => (
          <button key={m.key} onClick={() => m.key === "tone_adjust" ? setShowTones(!showTones) : callAgent(m.key)} disabled={loading} style={{ padding: "6px 12px", fontSize: 12, borderRadius: "0.5rem", minHeight: 44, border: activeMode === m.key ? "1px solid var(--accent)" : "1px solid var(--border-default)", background: activeMode === m.key ? "var(--accent)" : "transparent", color: activeMode === m.key ? "#ffffff" : "var(--text-secondary)", cursor: loading ? "wait" : "pointer", transition: "all 0.15s", fontWeight: activeMode === m.key ? 600 : 400 }}>
            {loading && activeMode === m.key ? "Thinking..." : m.label}
          </button>
        ))}
        <span style={{ marginLeft: "auto", fontSize: 10, fontWeight: 700, color: "var(--accent)", opacity: 0.5, letterSpacing: 1.5 }}>AI ASSIST</span>
      </div>
      {showTones && (
        <div style={{ display: "flex", gap: 6, padding: "4px 0", marginBottom: 4 }}>
          {TONES.map(t => (
            <button key={t} onClick={() => { setShowTones(false); callAgent("tone_adjust", { toneTarget: t }); }} style={{ padding: "6px 12px", fontSize: 12, borderRadius: "0.5rem", minHeight: 44, border: "1px solid var(--accent-border)", background: "transparent", color: "var(--accent)", cursor: "pointer", textTransform: "capitalize" as const }}>{t}</button>
          ))}
        </div>
      )}
    </div>
  );
}
