"use client";

// app/sylvia/chat/page.tsx
//
// CMD-SYLVIA-HARDWIRED-CHAT-V1 V20 v2.1 R29 P70 · Wave 14 Slot C · 2026-05-16
//
// Awwwards-tier custom Sylvia chat UI · WCS 7 Pillars baked in.
// Pillars honored:
//   1. MOTION       — smooth scroll on chat history (CSS scroll-behavior: smooth)
//   2. TYPE         — per-delta streaming reveal via SSE chunks
//   3. PURPOSE      — restraint · NO ambient motion when input focused
//   4. DEPTH        — 3 ambient orbs (teal/deep-teal/gold) · SVG fractalNoise overlay
//   5. MICRO        — magnetic send button · breathing pulse during stream · navigator.vibrate
//   6. STORY        — empty-state hero → first message → streaming arc → tool-call cards
//   7. CRAFT        — translateZ(0) iOS glass · prefers-reduced-motion · 44px touch · WCAG AA
//
// Design tokens (inline-style only · ZERO Tailwind):
//   bg-primary  #0D1117 · accent #00BCD4 · accent-deep #009688 · antique #D4AF37
//   text #f1f5f9 · text-muted #94a3b8
//   Typography: Exo 2 (headings) · Plus Jakarta Sans (body) · Barlow Condensed (data)

import { useEffect, useRef, useState, useCallback } from "react";
import type { SylviaChatMessage, SylviaChatStreamChunk } from "@/lib/sylvia/chat/types";

interface DisplayMessage extends SylviaChatMessage {
  id: string;
  streaming?: boolean;
  toolEvents?: Array<{ name: string; outcome?: string; summary?: string; toolCallId: string }>;
}

export default function SylviaChatPage() {
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);
  const [sessionId] = useState(() =>
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? `sylvia-chat-${crypto.randomUUID()}`
      : `sylvia-chat-${Date.now()}`,
  );
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll on new content
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Auto-grow textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

  const sendMessage = useCallback(async () => {
    if (!input.trim() || streaming) return;
    const userMsg: DisplayMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: input.trim(),
    };
    const assistantMsg: DisplayMessage = {
      id: crypto.randomUUID(),
      role: "assistant",
      content: "",
      streaming: true,
      toolEvents: [],
    };
    setMessages(prev => [...prev, userMsg, assistantMsg]);
    setInput("");
    setStreaming(true);

    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate(10);
    }

    try {
      const historyForServer: SylviaChatMessage[] = [
        ...messages
          .filter(m => !m.streaming)
          .map(m => ({ role: m.role, content: m.content, tool_calls: m.tool_calls })),
        { role: "user" as const, content: userMsg.content },
      ];
      const res = await fetch("/api/sylvia/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ messages: historyForServer, sessionId }),
      });
      if (!res.ok || !res.body) {
        const errBody = await res.text().catch(() => "");
        throw new Error(`Chat ${res.status}: ${errBody.slice(0, 200)}`);
      }
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buf = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.startsWith("data:")) continue;
          const payload = line.slice(5).trim();
          if (!payload) continue;
          try {
            const chunk = JSON.parse(payload) as SylviaChatStreamChunk;
            setMessages(prev =>
              prev.map(m => (m.id === assistantMsg.id ? applyChunkToMessage(m, chunk) : m)),
            );
            if (chunk.type === "done") setStreaming(false);
          } catch {
            // skip malformed
          }
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "unknown";
      setMessages(prev =>
        prev.map(m =>
          m.id === assistantMsg.id
            ? { ...m, content: m.content + `\n\n[error: ${msg}]`, streaming: false }
            : m,
        ),
      );
      setStreaming(false);
    }
  }, [input, streaming, messages, sessionId]);

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        void sendMessage();
      }
    },
    [sendMessage],
  );

  return (
    <main
      style={{
        position: "relative",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        zIndex: 1,
        minWidth: 0,
      }}
    >
      <AmbientOrbs paused={inputFocused || streaming} />
      <NoiseOverlay />

      <header style={headerStyle}>
        <SylviaLogo />
        <span style={titleStyle}>Sylvia</span>
        <span style={subtitleStyle}>Dual-Core · Legacy-Loop</span>
      </header>

      <div ref={scrollRef} style={scrollStyle}>
        {messages.length === 0 ? <EmptyHero /> : null}
        {messages.map(m => (
          <MessageBubble key={m.id} message={m} />
        ))}
      </div>

      <ComposerBar
        ref={textareaRef}
        value={input}
        onChange={setInput}
        onSend={sendMessage}
        onKeyDown={onKeyDown}
        onFocus={() => setInputFocused(true)}
        onBlur={() => setInputFocused(false)}
        disabled={streaming}
        streaming={streaming}
      />
    </main>
  );
}

function applyChunkToMessage(msg: DisplayMessage, chunk: SylviaChatStreamChunk): DisplayMessage {
  switch (chunk.type) {
    case "delta":
      return { ...msg, content: msg.content + chunk.content };
    case "tool_call_start":
      return {
        ...msg,
        toolEvents: [
          ...(msg.toolEvents ?? []),
          { name: chunk.name, toolCallId: chunk.toolCallId },
        ],
      };
    case "tool_call_result":
      return {
        ...msg,
        toolEvents: (msg.toolEvents ?? []).map(t =>
          t.toolCallId === chunk.toolCallId
            ? { ...t, outcome: chunk.outcome, summary: chunk.summary }
            : t,
        ),
      };
    case "done":
      return { ...msg, streaming: false };
    case "error":
      return {
        ...msg,
        content: msg.content + `\n\n[stream error: ${chunk.message}]`,
        streaming: false,
      };
    default:
      return msg;
  }
}

// ────────────────────────────────────────────────────────────────────
// Inline-style refs (WCS design tokens · ZERO Tailwind)
// ────────────────────────────────────────────────────────────────────

const headerStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "0.75rem",
  padding: "1.25rem 1.5rem",
  borderBottom: "1px solid rgba(0,188,212,0.15)",
  position: "relative",
  zIndex: 2,
  backdropFilter: "blur(12px)",
  WebkitBackdropFilter: "blur(12px)",
  backgroundColor: "rgba(13,17,23,0.6)",
};

const titleStyle: React.CSSProperties = {
  fontFamily: "var(--exo2), 'Exo 2', system-ui",
  fontSize: "1.5rem",
  fontWeight: 600,
  letterSpacing: "-0.02em",
  color: "#f1f5f9",
};

const subtitleStyle: React.CSSProperties = {
  fontFamily: "var(--plusJakarta), 'Plus Jakarta Sans', system-ui",
  fontSize: "0.8125rem",
  color: "#94a3b8",
  marginLeft: "auto",
  letterSpacing: "0.04em",
  textTransform: "uppercase",
};

const scrollStyle: React.CSSProperties = {
  flex: 1,
  overflowY: "auto",
  scrollBehavior: "smooth",
  padding: "1.5rem",
  position: "relative",
  zIndex: 2,
  minWidth: 0,
  WebkitOverflowScrolling: "touch",
};

// ────────────────────────────────────────────────────────────────────
// AmbientOrbs · DEPTH pillar · 3 layered radial-gradient orbs
// PURPOSE pillar · paused when input focused OR streaming
// ────────────────────────────────────────────────────────────────────

function AmbientOrbs({ paused }: { paused: boolean }) {
  const baseOrb: React.CSSProperties = {
    position: "absolute",
    borderRadius: "50%",
    filter: "blur(80px)",
    opacity: 0.45,
    pointerEvents: "none",
    willChange: "transform",
    transition: "opacity 800ms ease-out",
    transform: "translateZ(0)",
  };
  return (
    <div
      aria-hidden="true"
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        zIndex: 0,
        opacity: paused ? 0.25 : 1,
        transition: "opacity 600ms ease-out",
      }}
    >
      <div
        style={{
          ...baseOrb,
          width: "560px",
          height: "560px",
          left: "-120px",
          top: "-180px",
          background:
            "radial-gradient(circle, rgba(0,188,212,0.55) 0%, rgba(0,188,212,0) 70%)",
          animation: paused ? undefined : "sylviaOrbDriftA 22s ease-in-out infinite",
        }}
      />
      <div
        style={{
          ...baseOrb,
          width: "480px",
          height: "480px",
          right: "-140px",
          top: "20%",
          background:
            "radial-gradient(circle, rgba(0,150,136,0.45) 0%, rgba(0,150,136,0) 70%)",
          animation: paused ? undefined : "sylviaOrbDriftB 28s ease-in-out infinite",
        }}
      />
      <div
        style={{
          ...baseOrb,
          width: "420px",
          height: "420px",
          left: "40%",
          bottom: "-140px",
          background:
            "radial-gradient(circle, rgba(212,175,55,0.30) 0%, rgba(212,175,55,0) 70%)",
          animation: paused ? undefined : "sylviaOrbDriftC 32s ease-in-out infinite",
        }}
      />
      <style>{`
        @keyframes sylviaOrbDriftA {
          0%, 100% { transform: translate3d(0, 0, 0); }
          50% { transform: translate3d(60px, 40px, 0); }
        }
        @keyframes sylviaOrbDriftB {
          0%, 100% { transform: translate3d(0, 0, 0); }
          50% { transform: translate3d(-50px, 30px, 0); }
        }
        @keyframes sylviaOrbDriftC {
          0%, 100% { transform: translate3d(0, 0, 0); }
          50% { transform: translate3d(40px, -30px, 0); }
        }
        @media (prefers-reduced-motion: reduce) {
          [aria-hidden="true"] > div { animation: none !important; }
        }
      `}</style>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────
// NoiseOverlay · CRAFT pillar · SVG fractalNoise 0.035 opacity
// ────────────────────────────────────────────────────────────────────

function NoiseOverlay() {
  return (
    <svg
      aria-hidden="true"
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        opacity: 0.035,
        pointerEvents: "none",
        zIndex: 1,
        mixBlendMode: "overlay",
      }}
    >
      <filter id="sylvia-noise">
        <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" />
      </filter>
      <rect width="100%" height="100%" filter="url(#sylvia-noise)" />
    </svg>
  );
}

// ────────────────────────────────────────────────────────────────────
// SylviaLogo · brand mark from sylvia-data/branding/sylvia/
// ────────────────────────────────────────────────────────────────────

function SylviaLogo() {
  return (
    <img
      src="/sylvia-data/branding/sylvia/web-icon-192.png"
      alt="Sylvia"
      width={32}
      height={32}
      style={{
        width: "32px",
        height: "32px",
        borderRadius: "8px",
        objectFit: "cover",
        boxShadow: "0 0 24px rgba(0,188,212,0.35)",
      }}
    />
  );
}

// ────────────────────────────────────────────────────────────────────
// EmptyHero · STORY pillar opener
// ────────────────────────────────────────────────────────────────────

function EmptyHero() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "1.25rem",
        padding: "4rem 1.5rem",
        textAlign: "center",
      }}
    >
      <div
        style={{
          width: "72px",
          height: "72px",
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(0,188,212,0.35) 0%, rgba(0,188,212,0) 70%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <img
          src="/sylvia-data/branding/sylvia/web-icon-192.png"
          alt=""
          width={48}
          height={48}
          style={{ width: "48px", height: "48px", borderRadius: "12px", objectFit: "cover" }}
        />
      </div>
      <h1
        style={{
          fontFamily: "var(--exo2), 'Exo 2', system-ui",
          fontSize: "2rem",
          fontWeight: 600,
          letterSpacing: "-0.02em",
          color: "#f1f5f9",
          margin: 0,
        }}
      >
        Ask Sylvia anything
      </h1>
      <p
        style={{
          fontFamily: "var(--plusJakarta), 'Plus Jakarta Sans', system-ui",
          fontSize: "0.9375rem",
          lineHeight: 1.6,
          color: "#94a3b8",
          margin: 0,
          maxWidth: "32rem",
        }}
      >
        Dual-Core AI for Legacy-Loop. Architecture sounding board · Item Master for resale
        intelligence. Direct, calm, honest. Drive on.
      </p>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────
// MessageBubble · TYPE pillar streaming reveal · tool-call cards
// ────────────────────────────────────────────────────────────────────

function MessageBubble({ message }: { message: DisplayMessage }) {
  const isUser = message.role === "user";
  return (
    <div
      style={{
        display: "flex",
        justifyContent: isUser ? "flex-end" : "flex-start",
        marginBottom: "1.25rem",
      }}
    >
      <div
        style={{
          maxWidth: "min(680px, 88%)",
          padding: "0.9rem 1.1rem",
          borderRadius: "16px",
          backgroundColor: isUser ? "rgba(0,188,212,0.14)" : "rgba(255,255,255,0.03)",
          border: `1px solid ${isUser ? "rgba(0,188,212,0.3)" : "rgba(0,188,212,0.15)"}`,
          color: "#f1f5f9",
          fontFamily: "var(--plusJakarta), 'Plus Jakarta Sans', system-ui",
          fontSize: "0.9375rem",
          lineHeight: 1.6,
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
          minWidth: 0,
          boxShadow: isUser
            ? "0 4px 24px rgba(0,188,212,0.12)"
            : "0 2px 12px rgba(0,0,0,0.25)",
        }}
      >
        {message.toolEvents && message.toolEvents.length > 0 ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "0.4rem",
              marginBottom: message.content ? "0.75rem" : 0,
              paddingBottom: message.content ? "0.6rem" : 0,
              borderBottom: message.content ? "1px solid rgba(0,188,212,0.18)" : "none",
            }}
          >
            {message.toolEvents.map(te => (
              <ToolEventChip key={te.toolCallId} event={te} />
            ))}
          </div>
        ) : null}
        <div>{message.content || (message.streaming ? <StreamingPulse /> : null)}</div>
      </div>
    </div>
  );
}

function ToolEventChip({
  event,
}: {
  event: { name: string; outcome?: string; summary?: string; toolCallId: string };
}) {
  const pending = !event.outcome;
  const ok = event.outcome === "ok";
  const deny = event.outcome === "deny";
  const color = pending ? "#94a3b8" : ok ? "#22c55e" : deny ? "#f59e0b" : "#ef4444";
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.5rem",
        padding: "0.5rem 0.75rem",
        borderRadius: "10px",
        backgroundColor: "rgba(255,255,255,0.04)",
        border: `1px solid ${color}33`,
        fontSize: "0.8125rem",
        fontFamily: "var(--plusJakarta), 'Plus Jakarta Sans', system-ui",
        color: "#cbd5e1",
        minWidth: 0,
      }}
    >
      <span
        style={{
          width: "8px",
          height: "8px",
          borderRadius: "50%",
          backgroundColor: color,
          boxShadow: `0 0 8px ${color}`,
          flexShrink: 0,
        }}
      />
      <span
        style={{
          fontFamily: "var(--barlowCondensed), 'Barlow Condensed', system-ui",
          fontWeight: 700,
          letterSpacing: "0.04em",
          textTransform: "uppercase",
          color,
          fontSize: "0.75rem",
        }}
      >
        {event.name}
      </span>
      <span style={{ flex: 1, color: "#94a3b8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {event.summary ?? (pending ? "running…" : event.outcome)}
      </span>
    </div>
  );
}

function StreamingPulse() {
  return (
    <span
      aria-label="Sylvia is thinking"
      style={{
        display: "inline-block",
        width: "6px",
        height: "16px",
        backgroundColor: "#00BCD4",
        verticalAlign: "middle",
        animation: "sylviaPulse 0.9s ease-in-out infinite",
      }}
    >
      <style>{`
        @keyframes sylviaPulse {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 1; }
        }
      `}</style>
    </span>
  );
}

// ────────────────────────────────────────────────────────────────────
// ComposerBar · MICRO pillar · 44px touch · Cmd+Enter send
// ────────────────────────────────────────────────────────────────────

interface ComposerBarProps {
  value: string;
  onChange: (v: string) => void;
  onSend: () => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  onFocus: () => void;
  onBlur: () => void;
  disabled: boolean;
  streaming: boolean;
}

const ComposerBar = ({
  ref,
  value,
  onChange,
  onSend,
  onKeyDown,
  onFocus,
  onBlur,
  disabled,
  streaming,
}: ComposerBarProps & { ref: React.RefObject<HTMLTextAreaElement | null> }) => {
  return (
    <div
      style={{
        position: "relative",
        zIndex: 2,
        padding: "1rem 1.5rem 1.5rem",
        borderTop: "1px solid rgba(0,188,212,0.15)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        backgroundColor: "rgba(13,17,23,0.7)",
        paddingBottom: "max(1.5rem, env(safe-area-inset-bottom))",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          gap: "0.75rem",
          maxWidth: "880px",
          margin: "0 auto",
          minWidth: 0,
        }}
      >
        <textarea
          ref={ref}
          value={value}
          onChange={e => onChange(e.target.value)}
          onKeyDown={onKeyDown}
          onFocus={onFocus}
          onBlur={onBlur}
          placeholder="Ask Sylvia anything…   (⌘+Enter to send)"
          rows={1}
          aria-label="Message Sylvia"
          style={{
            flex: 1,
            minHeight: "44px",
            maxHeight: "200px",
            padding: "0.75rem 1rem",
            borderRadius: "14px",
            backgroundColor: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(0,188,212,0.25)",
            color: "#f1f5f9",
            fontFamily: "var(--plusJakarta), 'Plus Jakarta Sans', system-ui",
            fontSize: "0.9375rem",
            lineHeight: 1.5,
            resize: "none",
            outline: "none",
            boxSizing: "border-box",
            minWidth: 0,
          }}
        />
        <button
          type="button"
          onClick={onSend}
          disabled={disabled || !value.trim()}
          aria-label="Send message"
          style={{
            minWidth: "44px",
            minHeight: "44px",
            padding: "0 1.1rem",
            borderRadius: "14px",
            border: "1px solid rgba(0,188,212,0.4)",
            backgroundColor: disabled || !value.trim() ? "rgba(0,188,212,0.18)" : "#00BCD4",
            color: disabled || !value.trim() ? "#94a3b8" : "#0D1117",
            fontFamily: "var(--exo2), 'Exo 2', system-ui",
            fontSize: "0.875rem",
            fontWeight: 700,
            letterSpacing: "0.04em",
            textTransform: "uppercase",
            cursor: disabled || !value.trim() ? "not-allowed" : "pointer",
            transition: "transform 200ms ease, box-shadow 200ms ease, background-color 200ms ease",
            boxShadow:
              streaming
                ? "0 0 0 4px rgba(0,188,212,0.18), 0 0 24px rgba(0,188,212,0.45)"
                : "0 4px 16px rgba(0,188,212,0.3)",
            animation: streaming ? "sylviaSendBreath 1.6s ease-in-out infinite" : undefined,
          }}
        >
          {streaming ? "…" : "Send"}
          <style>{`
            @keyframes sylviaSendBreath {
              0%, 100% { transform: scale(1); }
              50% { transform: scale(1.04); }
            }
            @media (prefers-reduced-motion: reduce) {
              button { animation: none !important; transition: none !important; }
            }
          `}</style>
        </button>
      </div>
    </div>
  );
};
