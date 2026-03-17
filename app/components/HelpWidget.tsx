"use client";

import { useState } from "react";

export default function HelpWidget() {
  const [open, setOpen] = useState(false);

  return (
    <div
      className="no-print"
      style={{
        position: "fixed",
        bottom: "1.5rem",
        right: "1.5rem",
        zIndex: 200,
      }}
    >
      {/* Popover */}
      {open && (
        <div
          style={{
            position: "absolute",
            bottom: "60px",
            right: 0,
            width: "280px",
            background: "var(--bg-card-solid)",
            borderRadius: "1.25rem",
            boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
            border: "1px solid var(--border-default)",
            overflow: "hidden",
          }}
        >
          {/* Header */}
          <div
            style={{
              background: "linear-gradient(135deg, #0097a7, #00bcd4)",
              padding: "1rem 1.25rem",
              color: "#fff",
            }}
          >
            <div style={{ fontWeight: 700, fontSize: "0.9rem" }}>Need help?</div>
            <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.8)", marginTop: "0.1rem" }}>
              We&apos;re here for you
            </div>
          </div>

          {/* Options */}
          <div style={{ padding: "0.75rem" }}>
            {[
              { icon: "📞", label: "Call Us", sub: "(512) 758-0518", href: "tel:5127580518" },
              { icon: "💬", label: "Text Us", sub: "(512) 758-0518", href: "sms:5127580518" },
              { icon: "✉️", label: "Email Support", sub: "legacyloopmaine@gmail.com", href: "mailto:legacyloopmaine@gmail.com" },
              { icon: "🎯", label: "Take the Quiz", sub: "Find the right plan", href: "/onboarding/quiz" },
              { icon: "📋", label: "View Pricing", sub: "See all plans", href: "/pricing" },
            ].map((item) => (
              <a
                key={item.label}
                href={item.href}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  padding: "0.625rem 0.75rem",
                  borderRadius: "0.75rem",
                  textDecoration: "none",
                  transition: "background 0.15s",
                  marginBottom: "0.15rem",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.background = "var(--bg-card-hover)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background = "transparent";
                }}
              >
                <span style={{ fontSize: "1.1rem", flexShrink: 0 }}>{item.icon}</span>
                <div>
                  <div style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--text-primary)" }}>
                    {item.label}
                  </div>
                  <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>{item.sub}</div>
                </div>
              </a>
            ))}
          </div>

          {/* Keyboard hint */}
          <div
            style={{
              padding: "0.5rem 1.25rem 0.875rem",
              fontSize: "0.68rem",
              color: "var(--text-muted)",
              borderTop: "1px solid var(--border-default)",
            }}
          >
            Tip: Press{" "}
            <kbd
              style={{
                background: "var(--bg-card-hover)",
                padding: "0.05rem 0.3rem",
                borderRadius: "3px",
                fontSize: "0.65rem",
                border: "1px solid var(--border-default)",
              }}
            >
              Ctrl+/
            </kbd>{" "}
            to open this anytime
          </div>
        </div>
      )}

      {/* Toggle button */}
      <button
        onClick={() => setOpen((p) => !p)}
        title="Help & Support (Ctrl+/)"
        style={{
          width: "48px",
          height: "48px",
          borderRadius: "50%",
          background: open ? "var(--text-primary)" : "var(--accent-theme)",
          color: open ? "var(--bg-primary)" : "#fff",
          border: "none",
          cursor: "pointer",
          boxShadow: "0 4px 16px var(--accent-theme-glow)",
          fontSize: "1.25rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "background 0.2s, transform 0.2s",
          transform: open ? "rotate(45deg)" : "rotate(0)",
        }}
        aria-label="Help"
      >
        {open ? "✕" : "?"}
      </button>
    </div>
  );
}
