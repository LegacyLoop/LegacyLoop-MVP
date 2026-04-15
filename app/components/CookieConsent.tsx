"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function CookieConsent() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const accepted = localStorage.getItem("ll-cookie-consent");
    if (!accepted) {
      const timer = setTimeout(() => setShow(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  function accept() {
    localStorage.setItem("ll-cookie-consent", "accepted");
    setShow(false);
  }

  function decline() {
    localStorage.setItem("ll-cookie-consent", "declined");
    setShow(false);
  }

  if (!show) return null;

  return (
    <div className="cookie-banner" style={{
      position: "fixed", bottom: "1rem", left: "50%", transform: "translateX(-50%)",
      width: "min(500px, calc(100vw - 2rem))", zIndex: 9999,
      padding: "1rem 1.25rem",
      borderRadius: "1rem",
      background: "var(--bg-card-solid)",
      border: "1px solid var(--border-default)",
      boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
      display: "flex", alignItems: "center", gap: "1rem",
      flexWrap: "wrap",
      animation: "slideUp 0.3s ease",
    }}>
      <div style={{ flex: 1, minWidth: "200px" }}>
        <div style={{ fontSize: "0.82rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>
          We use cookies to improve your experience.{" "}
          <Link href="/privacy" style={{ color: "var(--accent)", textDecoration: "none" }}>Learn more</Link>
        </div>
      </div>
      <button onClick={decline} style={{
        padding: "0.5rem 1rem", fontSize: "0.82rem", fontWeight: 600, borderRadius: "0.5rem",
        whiteSpace: "nowrap", background: "transparent", border: "1px solid var(--border-default)",
        color: "var(--text-muted)", cursor: "pointer",
      }}>
        Decline
      </button>
      <button onClick={accept} className="btn-primary" style={{
        padding: "0.5rem 1.25rem", fontSize: "0.82rem", fontWeight: 700, borderRadius: "0.5rem",
        whiteSpace: "nowrap",
      }}>
        Accept All
      </button>
      <style>{`
        @media (max-width: 1024px) {
          .cookie-banner {
            bottom: calc(64px + env(safe-area-inset-bottom, 0px) + 0.75rem) !important;
          }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateX(-50%) translateY(20px); }
          to { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
      `}</style>
    </div>
  );
}
