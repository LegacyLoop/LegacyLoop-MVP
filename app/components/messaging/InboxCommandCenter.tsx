"use client";
import { useState, useEffect } from "react";
import BuyerIntelligenceCard from "./BuyerIntelligenceCard";
import NegotiationCoach from "./NegotiationCoach";

export default function InboxCommandCenter({ children, selectedConversationId, selectedOffer }: { children: React.ReactNode; selectedConversationId?: string | null; selectedOffer?: any }) {
  const [agentMode, setAgentMode] = useState("monitor");
  const [activeView, setActiveView] = useState("all");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [intelOpen, setIntelOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [threadActive, setThreadActive] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const [activityFeed, setActivityFeed] = useState<any[]>([]);
  const [counts, setCounts] = useState<{ hot: number; needsReply: number; total: number }>({ hot: 0, needsReply: 0, total: 0 });

  useEffect(() => {
    fetch("/api/messages/agent-settings").then(r => r.json()).then(d => {
      if (d.permissionLevel) setAgentMode(d.permissionLevel);
    }).catch(() => {});
  }, []);

  // Listen for conversation counts from MessagesClient
  useEffect(() => {
    const handler = (e: Event) => {
      const d = (e as CustomEvent).detail;
      if (d) setCounts({ hot: d.hot || 0, needsReply: d.needsReply || 0, total: d.total || 0 });
    };
    window.addEventListener("conversation-counts-updated", handler);
    return () => window.removeEventListener("conversation-counts-updated", handler);
  }, []);

  // Listen for filter resets from MessagesClient tab bar
  useEffect(() => {
    const handler = (e: Event) => {
      const filter = (e as CustomEvent).detail?.filter;
      if (filter) setActiveView(filter);
    };
    window.addEventListener("inbox-filter-reset", handler);
    return () => window.removeEventListener("inbox-filter-reset", handler);
  }, []);

  // Listen for conversation selection to hide ☰ when thread active
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      setThreadActive(!!(detail?.id || detail?.conversationId));
    };
    window.addEventListener("conversation-selected", handler);
    return () => window.removeEventListener("conversation-selected", handler);
  }, []);

  const modeStyles: Record<string, { border: string; color: string; label: string }> = {
    monitor: { border: "var(--border-default)", color: "var(--text-muted)", label: "Monitoring" },
    copilot: { border: "var(--accent)", color: "var(--accent)", label: "Co-Pilot" },
    autopilot: { border: "var(--success-text)", color: "var(--success-text)", label: "Auto-Pilot" },
  };
  const ms = modeStyles[agentMode] || modeStyles.monitor;

  return (
    <div style={{ display: "flex", flexDirection: "row", width: "100%", height: "100%", background: "var(--bg-primary)", overflow: "hidden", position: "relative" }}>
      {/* Mobile sidebar toggle */}
      {isMobile && !threadActive && (
        <button
          onClick={() => setSidebarOpen(o => !o)}
          style={{
            position: "absolute", top: 12, left: 12, zIndex: 20,
            width: 44, height: 44, borderRadius: "0.75rem",
            background: sidebarOpen ? "var(--accent)" : "var(--accent-dim)",
            border: "1px solid var(--accent-border)", color: sidebarOpen ? "#fff" : "var(--accent)",
            fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", transition: "all 0.15s ease",
          }}
        >
          {sidebarOpen ? "✕" : "☰"}
        </button>
      )}
      {/* Backdrop scrim for ☰ sidebar — tap to dismiss */}
      {isMobile && sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            position: "absolute", inset: 0, zIndex: 14,
            background: "rgba(0, 0, 0, 0.4)",
            backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)",
          }}
          aria-hidden="true"
        />
      )}
      {/* LEFT — Agent Sidebar */}
      <div style={{
        width: isMobile ? 220 : "clamp(0px, 22vw, 220px)", minWidth: 0, maxWidth: 220, flexShrink: 0, height: "100%",
        overflowY: "auto", overflowX: "hidden", background: "var(--bg-card)", borderRight: "1px solid var(--border-default)",
        display: isMobile ? "flex" : "flex", flexDirection: "column",
        ...(isMobile ? {
          position: "absolute" as const, zIndex: 15, left: 0, top: 0,
          transform: sidebarOpen ? "translateX(0)" : "translateX(-100%)",
          opacity: sidebarOpen ? 1 : 0,
          transition: "transform 0.25s cubic-bezier(0.23,1,0.32,1), opacity 0.2s ease",
          pointerEvents: sidebarOpen ? "auto" as const : "none" as const,
          boxShadow: sidebarOpen ? "4px 0 20px rgba(0,0,0,0.4)" : "none",
        } : {}),
      }}>
        {/* Agent Status */}
        <div style={{ padding: 16, borderBottom: "1px solid var(--border-default)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>🤖 AI Agent</span>
            <span style={{ fontSize: 10, padding: "3px 10px", borderRadius: 20, border: `1px solid ${ms.border}`, color: ms.color }}>{ms.label}</span>
          </div>
        </div>

        {/* Smart Views */}
        <div style={{ padding: "12px 16px 8px", flex: 1, overflow: "auto" }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)", letterSpacing: 1.5, marginBottom: 8 }}>INBOX</div>
          {[
            { icon: "🔥", label: "Hot Leads", key: "hot", count: counts.hot },
            { icon: "💬", label: "Needs Reply", key: "needs_reply", count: counts.needsReply },
            { icon: "🤖", label: "Agent Handled", key: "agent", count: 0 },
            { icon: "👀", label: "All Active", key: "all", count: counts.total },
            { icon: "✅", label: "Closed", key: "closed", count: 0 },
          ].map(tab => (
            <div
              key={tab.key}
              onClick={() => {
                setActiveView(tab.key);
                window.dispatchEvent(new CustomEvent("inbox-filter-change", { detail: { filter: tab.key } }));
              }}
              style={{
                display: "flex", alignItems: "center", gap: 10, padding: "8px 12px",
                borderRadius: 8, cursor: "pointer", marginBottom: 2, minHeight: 44,
                background: activeView === tab.key ? "var(--accent-dim)" : "transparent",
                borderLeft: activeView === tab.key ? "3px solid var(--accent)" : "3px solid transparent",
                transition: "all 0.15s ease",
              }}
            >
              <span style={{ fontSize: 14 }}>{tab.icon}</span>
              <span style={{ flex: 1, fontSize: 11, fontWeight: activeView === tab.key ? 700 : 400, color: activeView === tab.key ? "var(--accent)" : "var(--text-secondary)" }}>{tab.label}</span>
              {tab.count > 0 && (
                <span style={{
                  fontSize: 10, minWidth: 18, height: 18, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 9, fontWeight: 700,
                  background: activeView === tab.key ? "var(--accent)" : (tab.key === "hot" || tab.key === "needs_reply") ? "var(--accent-dim)" : "var(--ghost-bg)",
                  color: activeView === tab.key ? "#fff" : (tab.key === "hot" || tab.key === "needs_reply") ? "var(--accent)" : "var(--text-muted)",
                }}>
                  {tab.count}
                </span>
              )}
            </div>
          ))}

          {/* Agent Activity */}
          <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)", letterSpacing: 1.5, marginTop: 20, marginBottom: 8 }}>AGENT ACTIVITY</div>
          <div style={{ fontSize: 10, color: "var(--text-muted)", fontStyle: "italic" }}>No agent activity yet</div>
        </div>

        {/* Settings gear */}
        <div style={{ padding: 12, borderTop: "1px solid var(--border-default)" }}>
          <button onClick={() => window.dispatchEvent(new CustomEvent("agent-settings-toggle"))} style={{ width: "100%", padding: "8px", fontSize: 11, fontWeight: 600, borderRadius: 6, border: "1px solid var(--border-default)", background: "transparent", color: "var(--text-muted)", cursor: "pointer", minHeight: 44 }}>⚙️ Agent Settings</button>
        </div>
      </div>

      {/* CENTER — Messages (existing MessagesClient) */}
      <div style={{ flex: 1, minWidth: 0, height: "100%", overflow: "hidden", display: "flex", flexDirection: "column" }}>
        {children}
      </div>

      {/* Mobile Intel toggle button — bottom-right floating */}
      {isMobile && !threadActive && (
        <button
          onClick={() => setIntelOpen(o => !o)}
          style={{
            position: "absolute", bottom: 80, right: 12, zIndex: 20,
            width: 44, height: 44, borderRadius: "50%",
            background: intelOpen ? "var(--accent)" : "var(--accent-dim)",
            border: "1px solid var(--accent-border)",
            color: intelOpen ? "#fff" : "var(--accent)",
            fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", transition: "all 0.15s ease",
            boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
          }}
          aria-label={intelOpen ? "Close intelligence panel" : "Open intelligence panel"}
        >
          {intelOpen ? "✕" : "\uD83E\uDDE0"}
        </button>
      )}

      {/* Backdrop scrim for 🧠 intel panel — tap to dismiss */}
      {isMobile && intelOpen && (
        <div
          onClick={() => setIntelOpen(false)}
          style={{
            position: "absolute", inset: 0, zIndex: 14,
            background: "rgba(0, 0, 0, 0.4)",
            backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)",
          }}
          aria-hidden="true"
        />
      )}

      {/* RIGHT — Intelligence Panel (desktop: inline, mobile: overlay via toggle) */}
      <div style={{
        width: isMobile ? 280 : "clamp(0px, 26vw, 260px)",
        minWidth: 0,
        maxWidth: isMobile ? 280 : 260,
        flexShrink: 0,
        height: "100%",
        overflowY: "auto",
        overflowX: "hidden",
        background: "var(--bg-card)",
        borderLeft: "1px solid var(--border-default)",
        display: isMobile ? "flex" : "flex",
        flexDirection: "column",
        ...(isMobile ? {
          position: "absolute" as const,
          right: 0,
          top: 0,
          zIndex: 15,
          transform: intelOpen ? "translateX(0)" : "translateX(100%)",
          opacity: intelOpen ? 1 : 0,
          transition: "transform 0.25s cubic-bezier(0.23,1,0.32,1), opacity 0.2s ease",
          pointerEvents: intelOpen ? "auto" as const : "none" as const,
          boxShadow: intelOpen ? "-4px 0 20px rgba(0,0,0,0.4)" : "none",
        } : {}),
      }}>
        {selectedConversationId ? (
          <>
            <BuyerIntelligenceCard conversationId={selectedConversationId} />
            <NegotiationCoach
              conversationId={selectedConversationId}
              hasOffer={!!selectedOffer}
              askingPrice={selectedOffer?.askingPrice}
              currentOffer={selectedOffer?.currentPrice}
              round={selectedOffer?.round}
            />
          </>
        ) : (
          <div style={{ padding: 40, textAlign: "center" }}>
            <div style={{ fontSize: 32, marginBottom: 12, opacity: 0.3 }}>🤖</div>
            <div style={{ fontSize: 13, color: "var(--text-primary)" }}>Select a conversation</div>
            <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 6, lineHeight: 1.5 }}>Your AI agent will analyze it and provide real-time intelligence</div>
          </div>
        )}
      </div>
    </div>
  );
}
