"use client";

import { useState } from "react";
import Link from "next/link";

export default function DemoBanner() {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div
      className="no-print"
      style={{
        background: "linear-gradient(90deg, #78350f, #92400e, #78350f)",
        color: "#fff",
        fontSize: "0.78rem",
        padding: "0.5rem 1rem",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "1rem",
        flexWrap: "wrap",
        position: "relative",
        zIndex: 20,
      }}
    >
      <span style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
        <span
          style={{
            background: "#fbbf24",
            color: "#78350f",
            fontSize: "0.6rem",
            fontWeight: 900,
            padding: "0.1rem 0.4rem",
            borderRadius: "9999px",
            letterSpacing: "0.1em",
          }}
        >
          DEMO MODE
        </span>
        <span>
          Sample data loaded for demonstration purposes.
        </span>
      </span>

      <span style={{ color: "rgba(255,255,255,0.6)", display: "flex", gap: "0.75rem" }}>
        <Link
          href="/auth/signup"
          style={{
            color: "#fbbf24",
            fontWeight: 700,
            textDecoration: "none",
            fontSize: "0.75rem",
          }}
        >
          Try with your own data →
        </Link>
        <span style={{ color: "rgba(255,255,255,0.3)" }}>·</span>
        <Link
          href="/onboarding/quiz"
          style={{
            color: "rgba(255,255,255,0.8)",
            textDecoration: "none",
            fontSize: "0.75rem",
          }}
        >
          Find your plan
        </Link>
      </span>

      <button
        onClick={() => setDismissed(true)}
        style={{
          position: "absolute",
          right: "0.75rem",
          top: "50%",
          transform: "translateY(-50%)",
          background: "none",
          border: "none",
          color: "rgba(255,255,255,0.5)",
          cursor: "pointer",
          fontSize: "0.9rem",
          padding: "0.25rem 0.5rem",
        }}
        aria-label="Dismiss demo banner"
      >
        ✕
      </button>
    </div>
  );
}
