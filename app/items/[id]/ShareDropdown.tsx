"use client";

import { useState, useRef, useEffect } from "react";

interface Props {
  url: string;
  title: string;
  description?: string;
}

export default function ShareDropdown({ url, title, description }: Props) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const encoded = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);
  const encodedDesc = encodeURIComponent(description ?? title);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* fallback not needed for modern browsers */ }
  }

  const items = [
    { label: "Facebook", icon: "📘", href: `https://www.facebook.com/sharer/sharer.php?u=${encoded}` },
    { label: "X / Twitter", icon: "𝕏", href: `https://twitter.com/intent/tweet?url=${encoded}&text=${encodedTitle}` },
    { label: "Email", icon: "✉️", href: `mailto:?subject=${encodedTitle}&body=${encodedDesc}%0A%0A${encoded}` },
  ];

  const itemStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: "0.6rem",
    padding: "0.55rem 0.85rem",
    borderRadius: "0.5rem",
    fontSize: "0.82rem",
    color: "var(--text-primary)",
    textDecoration: "none",
    background: "none",
    border: "none",
    cursor: "pointer",
    width: "100%",
    transition: "background 0.15s",
  };

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: 36,
          height: 36,
          borderRadius: "0.5rem",
          border: "1px solid var(--border-default)",
          background: open ? "rgba(0,188,212,0.1)" : "transparent",
          color: open ? "var(--accent)" : "var(--text-primary)",
          cursor: "pointer",
          transition: "all 0.15s",
        }}
        title="Share this item"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
          <polyline points="16 6 12 2 8 6" />
          <line x1="12" y1="2" x2="12" y2="15" />
        </svg>
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            right: 0,
            top: "calc(100% + 0.5rem)",
            minWidth: 180,
            borderRadius: "0.75rem",
            background: "var(--bg-card, rgba(30,30,30,0.95))",
            border: "1px solid var(--border-card, rgba(255,255,255,0.1))",
            boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
            backdropFilter: "blur(16px)",
            padding: "0.4rem",
            zIndex: 50,
          }}
        >
          {items.map((item) => (
            <a
              key={item.label}
              href={item.href}
              target="_blank"
              rel="noreferrer"
              onClick={() => setOpen(false)}
              style={itemStyle}
            >
              <span style={{ fontSize: "1rem", width: 20, textAlign: "center" }}>{item.icon}</span>
              <span>{item.label}</span>
            </a>
          ))}

          <div style={{ height: 1, background: "var(--border-default)", margin: "0.25rem 0.5rem" }} />

          <button
            onClick={() => { copyLink(); }}
            style={{
              ...itemStyle,
              color: copied ? "#4caf50" : "var(--text-primary)",
            }}
          >
            <span style={{ fontSize: "1rem", width: 20, textAlign: "center" }}>{copied ? "✓" : "🔗"}</span>
            <span>{copied ? "Copied!" : "Copy Link"}</span>
          </button>
        </div>
      )}
    </div>
  );
}
