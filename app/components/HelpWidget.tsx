"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";

const HelpChatWidget = dynamic(() => import("@/app/help/HelpChatWidget"), { ssr: false });
const BugReportModal = dynamic(() => import("@/app/components/BugReportModal"), { ssr: false });

export default function HelpWidget() {
  const [open, setOpen] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showBugReport, setShowBugReport] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "/") {
        e.preventDefault();
        setOpen(prev => !prev);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // Context-aware suggestions
  const [suggestions, setSuggestions] = useState<{ label: string; href: string }[]>([]);
  useEffect(() => {
    const path = window.location.pathname;
    if (path.includes("/items/")) {
      setSuggestions([
        { label: "How AnalyzeBot identifies items", href: "/help/how-analyzebot-works" },
        { label: "How AI pricing works", href: "/help/understanding-ai-pricing" },
      ]);
    } else if (path.includes("/shipping")) {
      setSuggestions([
        { label: "Complete shipping guide", href: "/help/complete-shipping-guide" },
        { label: "Shipping center overview", href: "/help/shipping-center-overview" },
      ]);
    } else if (path.includes("/bots")) {
      setSuggestions([
        { label: "What is Bot Hub?", href: "/help/what-is-bot-hub" },
        { label: "What is MegaBot?", href: "/help/how-megabot-works" },
      ]);
    } else if (path.includes("/credits")) {
      setSuggestions([
        { label: "Bot tiers and credits", href: "/help/bot-tiers-and-credits" },
        { label: "Add-on marketplace", href: "/help/addon-marketplace" },
      ]);
    } else {
      setSuggestions([
        { label: "Getting started guide", href: "/help/how-to-list-first-item" },
        { label: "How AI pricing works", href: "/help/understanding-ai-pricing" },
      ]);
    }
  }, [open]);

  return (
    <div style={{ position: "fixed", bottom: isMobile ? 88 : 24, right: 24, zIndex: 1001, transition: "bottom 0.2s ease" }}>
      {open && (
        <div className="glass-panel" style={{
          position: "absolute", bottom: 64, right: 0, width: 340,
          overflow: "hidden",
        }}>
          {/* Header */}
          <div style={{ background: "linear-gradient(135deg, #00bcd4, #0097a7)", padding: "14px 16px" }}>
            <div style={{ fontSize: "0.95rem", fontWeight: 700, color: "#fff" }}>Need help?</div>
            <div style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.8)" }}>Mon–Sat, 8am–8pm EST</div>
          </div>

          <div style={{ padding: "12px", display: "flex", flexDirection: "column", gap: "8px", maxHeight: 420, overflowY: "auto" }}>
            {/* Search Help Center */}
            <a href="/help" style={{
              display: "flex", alignItems: "center", gap: "8px", padding: "10px 12px", borderRadius: "8px",
              background: "rgba(0,188,212,0.06)", border: "1px solid rgba(0,188,212,0.15)", textDecoration: "none",
              color: "var(--accent, #00bcd4)", fontSize: "0.82rem", fontWeight: 600,
            }}>
              🔍 Search Help Center
            </a>

            {/* Chat toggle */}
            <button onClick={() => setShowChat(!showChat)} style={{
              display: "flex", alignItems: "center", gap: "8px", padding: "10px 12px", borderRadius: "8px",
              background: showChat ? "rgba(0,188,212,0.12)" : "rgba(255,255,255,0.03)", border: "1px solid var(--border-default, rgba(0,188,212,0.1))",
              color: "var(--text-primary, #e2e8f0)", fontSize: "0.82rem", fontWeight: 600, cursor: "pointer", width: "100%", textAlign: "left",
            }}>
              🤖 {showChat ? "Hide AI Chat" : "Chat with AI"}
            </button>

            {showChat && (
              <div style={{ borderRadius: "8px", overflow: "hidden" }}>
                <HelpChatWidget compact />
              </div>
            )}

            {/* Bug Report */}
            <button onClick={() => { setShowBugReport(true); setOpen(false); }} style={{
              display: "flex", alignItems: "center", gap: "8px", padding: "10px 12px", borderRadius: "8px",
              background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)",
              color: "#f87171", fontSize: "0.82rem", fontWeight: 600, cursor: "pointer", width: "100%", textAlign: "left",
            }}>
              🐛 Report a Bug
              <span style={{ marginLeft: "auto", fontSize: "0.62rem", padding: "2px 6px", borderRadius: "4px", background: "rgba(0,188,212,0.1)", color: "#00bcd4", fontWeight: 700 }}>
                + Screenshot
              </span>
            </button>

            {/* Divider */}
            <div style={{ height: "1px", background: "var(--border-default, rgba(0,188,212,0.1))", margin: "2px 0" }} />

            {/* Context-aware suggestions */}
            {suggestions.map(s => (
              <a key={s.href} href={s.href} style={{
                display: "flex", alignItems: "center", gap: "8px", padding: "8px 12px", borderRadius: "6px",
                textDecoration: "none", color: "var(--text-secondary, #8b949e)", fontSize: "0.78rem",
              }}>
                📄 {s.label}
              </a>
            ))}

            {/* Divider */}
            <div style={{ height: "1px", background: "var(--border-default, rgba(0,188,212,0.1))", margin: "2px 0" }} />

            {/* Contact options */}
            {[
              { icon: "📞", label: "Call Us", sub: "(207) 555-0127", href: "tel:2075550127" },
              { icon: "💬", label: "Text Us", sub: "(207) 555-0127", href: "sms:2075550127" },
              { icon: "✉️", label: "Email Support", sub: "support@legacy-loop.com", href: "mailto:support@legacy-loop.com" },
            ].map(item => (
              <a key={item.label} href={item.href} style={{
                display: "flex", alignItems: "center", gap: "10px", padding: "8px 12px", borderRadius: "6px",
                textDecoration: "none", color: "var(--text-primary, #e2e8f0)", fontSize: "0.78rem",
              }}>
                <span style={{ fontSize: "1rem" }}>{item.icon}</span>
                <div>
                  <div style={{ fontWeight: 600 }}>{item.label}</div>
                  <div style={{ fontSize: "0.7rem", color: "var(--text-muted, #64748b)" }}>{item.sub}</div>
                </div>
              </a>
            ))}

            {/* Keyboard hint */}
            <div style={{ textAlign: "center", fontSize: "0.65rem", color: "var(--text-muted, #64748b)", padding: "4px 0" }}>
              Press <kbd style={{ padding: "1px 4px", borderRadius: "3px", border: "1px solid var(--border-default)", fontSize: "0.6rem" }}>Ctrl</kbd>+<kbd style={{ padding: "1px 4px", borderRadius: "3px", border: "1px solid var(--border-default)", fontSize: "0.6rem" }}>/</kbd> to toggle
            </div>
          </div>
        </div>
      )}

      {/* Toggle button */}
      <button onClick={() => setOpen(!open)} aria-label="Help and feedback" style={{
        width: 52, height: 52, borderRadius: "50%", border: "none", cursor: "pointer",
        background: open ? "var(--accent, #00bcd4)" : "linear-gradient(135deg, #00bcd4, #0097a7)",
        color: "#fff", fontSize: "1.25rem", fontWeight: 700,
        boxShadow: "0 4px 16px rgba(0,188,212,0.3)",
        display: "flex", alignItems: "center", justifyContent: "center",
        transition: "transform 0.2s", transform: open ? "rotate(45deg)" : "none",
      }}>
        {open ? "✕" : "?"}
      </button>

      {/* Bug Report Modal */}
      <BugReportModal open={showBugReport} onClose={() => setShowBugReport(false)} />
    </div>
  );
}
