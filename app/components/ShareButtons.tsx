"use client";

import { useState, useEffect } from "react";

interface Props {
  url: string;
  title: string;
  description?: string;
}

export default function ShareButtons({ url, title, description }: Props) {
  const [copied, setCopied] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);
  const [canNativeShare, setCanNativeShare] = useState(false);

  useEffect(() => {
    // navigator.share is only available in secure contexts and on supported browsers
    setCanNativeShare(typeof navigator !== "undefined" && !!navigator.share);
  }, []);

  const encoded = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);
  const encodedDesc = encodeURIComponent(description ?? title);

  const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encoded}`;
  const twitterUrl = `https://twitter.com/intent/tweet?url=${encoded}&text=${encodedTitle}`;
  const emailUrl = `mailto:?subject=${encodedTitle}&body=${encodedDesc}%0A%0A${encoded}`;

  async function nativeShare() {
    try {
      await navigator.share({
        title,
        text: description ?? title,
        url,
      });
    } catch {
      // User cancelled or share failed — no action needed
    }
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback: select & copy from a hidden input (older browsers)
    }
  }

  const btnBase: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: "0.35rem",
    padding: "0.45rem 0.85rem",
    borderRadius: "0.6rem",
    fontSize: "0.78rem",
    fontWeight: 600,
    cursor: "pointer",
    border: "1px solid",
    textDecoration: "none",
    whiteSpace: "nowrap" as const,
  };

  const themedBtn: React.CSSProperties = {
    ...btnBase,
    background: "var(--bg-card-solid)",
    color: "var(--text-primary)",
    borderColor: "var(--border-default)",
  };

  return (
    <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center" }}>
      {/* Native Share (mobile) — shown as primary when available */}
      {canNativeShare && (
        <button
          onClick={nativeShare}
          style={{
            ...btnBase,
            background: "var(--accent)",
            color: "#fff",
            borderColor: "var(--accent)",
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
            <polyline points="16 6 12 2 8 6" />
            <line x1="12" y1="2" x2="12" y2="15" />
          </svg>
          Share
        </button>
      )}

      {/* Facebook */}
      <a
        href={fbUrl}
        target="_blank"
        rel="noreferrer"
        style={{ ...btnBase, background: "#1877F2", color: "#fff", borderColor: "#1877F2" }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
          <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.235 2.686.235v2.97h-1.514c-1.491 0-1.956.93-1.956 1.874v2.25h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"/>
        </svg>
        Share
      </a>

      {/* Twitter/X */}
      <a
        href={twitterUrl}
        target="_blank"
        rel="noreferrer"
        style={{ ...btnBase, background: "#000", color: "#fff", borderColor: "#000" }}
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
        </svg>
        Post
      </a>

      {/* Email */}
      <a
        href={emailUrl}
        style={themedBtn}
      >
        ✉️ Email
      </a>

      {/* QR Code */}
      <button
        onClick={() => setQrOpen(!qrOpen)}
        style={themedBtn}
      >
        📱 QR
      </button>

      {/* Copy link */}
      <button
        onClick={copyLink}
        style={{
          ...btnBase,
          background: copied ? "#dcfce7" : "var(--bg-card-solid)",
          color: copied ? "#15803d" : "var(--text-primary)",
          borderColor: copied ? "#86efac" : "var(--border-default)",
          transition: "all 0.2s",
        }}
      >
        {copied ? "✓ Copied!" : "🔗 Copy link"}
      </button>

      {/* QR Popover */}
      {qrOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 50,
          }}
          onClick={() => setQrOpen(false)}
        >
          <div
            style={{
              background: "var(--bg-card-solid)",
              borderRadius: "1.25rem",
              padding: "2rem",
              textAlign: "center",
              maxWidth: "320px",
              width: "90%",
              border: "1px solid var(--border-default)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ fontWeight: 700, marginBottom: "1rem", fontSize: "1rem", color: "var(--text-primary)" }}>
              📱 Scan to view
            </div>
            {/* QR using free Google Charts API */}
            <img
              src={`https://chart.googleapis.com/chart?chs=200x200&cht=qr&chl=${encoded}&choe=UTF-8`}
              alt="QR Code"
              style={{ width: 200, height: 200, margin: "0 auto", display: "block", borderRadius: "0.5rem" }}
            />
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted, #78716c)", marginTop: "0.75rem", wordBreak: "break-all" }}>
              {url}
            </div>
            <button
              onClick={() => setQrOpen(false)}
              style={{
                marginTop: "1rem",
                padding: "0.5rem 1.5rem",
                background: "var(--bg-card-solid)",
                border: "1px solid var(--border-default)",
                borderRadius: "0.6rem",
                cursor: "pointer",
                color: "var(--text-primary)",
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
