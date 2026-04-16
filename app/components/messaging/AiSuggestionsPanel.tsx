"use client";

export default function AiSuggestionsPanel({ data, onUseMessage, onDismiss }: { data: any; onUseMessage: (msg: string) => void; onDismiss: () => void }) {
  if (!data) return null;
  const mode = data.mode || data.type;

  return (
    <div style={{ background: "rgba(10,25,40,0.97)", border: "1px solid rgba(0,188,212,0.25)", borderRadius: 14, padding: 16, marginBottom: 8, boxShadow: "0 8px 32px rgba(0,0,0,0.4)" }}>
      {/* Smart Reply */}
      {mode === "smart_reply" && data.result?.suggestions && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-primary)" }}>⚡ Smart Replies</span>
            <button onClick={onDismiss} style={{ background: "none", border: "none", color: "var(--text-muted)", fontSize: 10, cursor: "pointer" }}>✕ Dismiss</button>
          </div>
          {data.result.suggestions.map((s: any, i: number) => {
            const toneColors: Record<string, string> = { Friendly: "#22c55e", Professional: "#00bcd4", Firm: "#f59e0b" };
            return (
              <div key={i} onClick={() => onUseMessage(s.message)} style={{ background: "var(--ghost-bg)", border: "1px solid var(--border-default)", borderRadius: 10, padding: "12px 14px", cursor: "pointer", marginBottom: 8, transition: "all 0.15s" }} onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(0,188,212,0.4)"; (e.currentTarget as HTMLElement).style.background = "rgba(0,188,212,0.06)"; }} onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--border-default)"; (e.currentTarget as HTMLElement).style.background = "var(--ghost-bg)"; }}>
                <span style={{ fontSize: 9, padding: "3px 10px", borderRadius: 20, background: toneColors[s.label] || "#00bcd4", color: "#000", fontWeight: 700 }}>{s.label}</span>
                <div style={{ fontSize: 13, color: "var(--text-primary)", lineHeight: 1.6, marginTop: 8 }}>{s.message}</div>
              </div>
            );
          })}
        </div>
      )}

      {/* Negotiate / Counter */}
      {(mode === "negotiate" || mode === "counter_price") && data.negotiation && (
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-primary)", marginBottom: 8 }}>🤝 Negotiation Advice</div>
          {data.negotiation.counterPrice && <div style={{ fontSize: 20, fontWeight: 700, color: "#00bcd4", marginBottom: 4 }}>Counter: ${data.negotiation.counterPrice}</div>}
          <div style={{ fontSize: 11, fontStyle: "italic" as const, color: "var(--text-muted)", marginBottom: 8 }}>{data.negotiation.reasoning}</div>
          {data.negotiation.suggestedMessage && (
            <button onClick={() => onUseMessage(data.negotiation.suggestedMessage)} style={{ width: "100%", minHeight: 44, background: "rgba(0,188,212,0.15)", border: "1px solid #00bcd4", color: "#00bcd4", fontSize: 11, fontWeight: 700, borderRadius: "0.75rem", cursor: "pointer" }}>Use This Message →</button>
          )}
        </div>
      )}

      {/* Professional / Tone */}
      {(mode === "professional" || mode === "tone_adjust") && data.result && (
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-primary)", marginBottom: 10 }}>✨ Polished Version</div>
          <div style={{ display: "flex", gap: 12 }}>
            <div style={{ flex: 3 }}>
              <div style={{ fontSize: 9, color: "var(--text-muted)", marginBottom: 4 }}>Original</div>
              <div style={{ fontSize: 11, color: "var(--text-muted)", lineHeight: 1.5 }}>{data.result.original || data.result.polished}</div>
            </div>
            <div style={{ flex: 2, borderLeft: "2px solid #00bcd4", paddingLeft: 12 }}>
              <div style={{ fontSize: 9, color: "#00bcd4", marginBottom: 4 }}>Polished ✨</div>
              <div style={{ fontSize: 11, color: "var(--text-primary)", lineHeight: 1.5 }}>{data.result.polished || data.result.adjusted || ""}</div>
            </div>
          </div>
          <button onClick={() => onUseMessage(data.result.polished || data.result.adjusted || "")} style={{ width: "100%", minHeight: 44, marginTop: 10, background: "rgba(0,188,212,0.15)", border: "1px solid #00bcd4", color: "#00bcd4", fontSize: 11, fontWeight: 700, borderRadius: "0.75rem", cursor: "pointer" }}>Use Polished Version →</button>
        </div>
      )}

      {/* Summarize */}
      {mode === "summarize" && data.result && (
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-primary)", marginBottom: 8 }}>📝 Conversation Summary</div>
          <div style={{ fontSize: 11, color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: 8 }}>{data.result.summary}</div>
          {data.result.keyFacts?.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 4, marginBottom: 8 }}>
              {data.result.keyFacts.map((f: string, i: number) => (
                <span key={i} style={{ fontSize: 9, padding: "2px 8px", borderRadius: 20, background: "rgba(0,188,212,0.08)", border: "1px solid rgba(0,188,212,0.2)", color: "#00bcd4" }}>{f}</span>
              ))}
            </div>
          )}
          {data.result.nextAction && (
            <div style={{ background: "rgba(0,188,212,0.08)", border: "1px solid rgba(0,188,212,0.2)", borderRadius: 8, padding: "8px 12px", fontSize: 11, color: "#00bcd4" }}>Next: {data.result.nextAction}</div>
          )}
        </div>
      )}

    </div>
  );
}
