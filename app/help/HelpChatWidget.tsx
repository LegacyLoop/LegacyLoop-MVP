"use client";
import { useState, useRef, useEffect } from "react";

export default function HelpChatWidget({ compact }: { compact?: boolean }) {
  const [messages, setMessages] = useState<{ role: "user" | "assistant"; content: string }[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight);
  }, [messages, loading]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    const userMsg = { role: "user" as const, content: text };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);
    try {
      const res = await fetch("/api/help/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, conversationHistory: [...messages, userMsg] }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: "assistant", content: data.reply || "Sorry, something went wrong." }]);
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "Connection error — please try again." }]);
    } finally {
      setLoading(false);
    }
  };

  const suggestions = compact ? [] : [
    "How do I list my first item?",
    "How does AI pricing work?",
    "How do I ship an item?",
    "What is MegaBot?",
  ];

  const h = compact ? 280 : 400;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: h, borderRadius: compact ? 8 : 12, overflow: "hidden", border: "1px solid var(--border-default, rgba(0,188,212,0.15))", background: "var(--bg-card, #161b22)" }}>
      <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", padding: compact ? "8px" : "12px", display: "flex", flexDirection: "column", gap: "8px" }}>
        {messages.length === 0 && !compact && (
          <div style={{ textAlign: "center", padding: "16px 8px" }}>
            <div style={{ fontSize: "14px", color: "var(--text-secondary, #8b949e)", marginBottom: "12px" }}>Ask me anything about LegacyLoop!</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", justifyContent: "center" }}>
              {suggestions.map(s => (
                <button key={s} onClick={() => { setInput(s); }} style={{ padding: "6px 12px", borderRadius: "16px", border: "1px solid rgba(0,188,212,0.2)", background: "rgba(0,188,212,0.06)", color: "var(--accent, #00bcd4)", fontSize: "12px", cursor: "pointer" }}>{s}</button>
              ))}
            </div>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} style={{ alignSelf: m.role === "user" ? "flex-end" : "flex-start", maxWidth: "85%", padding: "8px 12px", borderRadius: "12px", fontSize: compact ? "12px" : "13px", lineHeight: 1.5,
            background: m.role === "user" ? "rgba(0,188,212,0.15)" : "rgba(255,255,255,0.05)",
            color: m.role === "user" ? "var(--accent, #00bcd4)" : "var(--text-primary, #e2e8f0)",
          }}>
            {m.content}
          </div>
        ))}
        {loading && (
          <div style={{ alignSelf: "flex-start", padding: "8px 12px", borderRadius: "12px", background: "rgba(255,255,255,0.05)", fontSize: "13px", color: "var(--text-muted, #64748b)" }}>
            <span style={{ animation: "pulse 1.5s infinite" }}>Thinking...</span>
          </div>
        )}
      </div>
      <div style={{ display: "flex", gap: "6px", padding: compact ? "6px" : "8px", borderTop: "1px solid var(--border-default, rgba(0,188,212,0.1))" }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && send()}
          placeholder="Ask anything about LegacyLoop..."
          style={{ flex: 1, padding: "10px 12px", borderRadius: "8px", border: "1px solid var(--border-default, rgba(0,188,212,0.15))", background: "var(--bg-card, rgba(255,255,255,0.05))", color: "var(--text-primary, #e2e8f0)", fontSize: "13px", outline: "none", minHeight: "44px" }}
        />
        <button onClick={send} disabled={loading || !input.trim()} style={{ padding: "10px 16px", borderRadius: "8px", border: "none", background: loading ? "rgba(0,188,212,0.3)" : "#00bcd4", color: "#fff", fontWeight: 700, fontSize: "13px", cursor: loading ? "default" : "pointer", minHeight: "44px", minWidth: "44px" }}>
          {loading ? "..." : "Send"}
        </button>
      </div>
    </div>
  );
}
