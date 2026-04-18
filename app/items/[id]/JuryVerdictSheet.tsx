"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import type { JuryVerdict } from "@/lib/pricing/jury";

interface Props {
  verdict: JuryVerdict;
  open: boolean;
  onClose: () => void;
}

function formatAge(iso: string | undefined): string {
  if (!iso) return "";
  const ms = Date.now() - new Date(iso).getTime();
  const m = Math.floor(ms / 60_000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

export default function JuryVerdictSheet({ verdict, open, onClose }: Props) {
  useEffect(() => {
    if (!open) return;
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onEsc);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onEsc);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;

  const sheet = (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Pricing jury verdict"
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "rgba(0,0,0,0.72)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
        animation: "fadeIn 0.2s ease-out",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: "520px",
          width: "100%",
          maxHeight: "85vh",
          overflow: "auto",
          background: "#1A1F2E",
          color: "#e2e8f0",
          border: "1px solid rgba(0,188,212,0.35)",
          borderRadius: "1rem",
          padding: "1.5rem",
          boxShadow:
            "0 20px 60px rgba(0,0,0,0.6), 0 0 30px rgba(0,188,212,0.15)",
          animation: "fadeSlideUp 0.3s cubic-bezier(0.23, 1, 0.32, 1)",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "1rem",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span style={{ fontSize: "1.1rem" }}>🎯</span>
            <h3
              style={{
                margin: 0,
                fontSize: "1.05rem",
                fontWeight: 700,
                color: "#e2e8f0",
                fontFamily: "var(--font-heading)",
              }}
            >
              Pricing Jury Verdict
            </h3>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: "0.5rem",
              padding: "0.35rem 0.65rem",
              color: "#94a3b8",
              cursor: "pointer",
              fontSize: "0.8rem",
              minHeight: "32px",
              minWidth: "32px",
            }}
          >
            ✕
          </button>
        </div>

        {/* Resolved prices row */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, minmax(0,1fr))",
            gap: "0.5rem",
            marginBottom: "1rem",
          }}
        >
          {[
            { label: "LIST", value: verdict.listPrice, color: "#00bcd4" },
            { label: "ACCEPT", value: verdict.acceptPrice, color: "#22c55e" },
            { label: "FLOOR", value: verdict.floorPrice, color: "#f59e0b" },
          ].map((p) => (
            <div
              key={p.label}
              style={{
                padding: "0.6rem",
                borderRadius: "0.6rem",
                background: "rgba(255,255,255,0.04)",
                border: `1px solid ${p.color}40`,
                textAlign: "center" as const,
              }}
            >
              <div
                style={{
                  fontSize: "0.55rem",
                  fontWeight: 700,
                  letterSpacing: "0.1em",
                  color: p.color,
                  marginBottom: "0.2rem",
                }}
              >
                {p.label}
              </div>
              <div
                style={{
                  fontSize: "1.05rem",
                  fontWeight: 700,
                  fontFamily: "var(--font-data)",
                  color: p.color,
                }}
              >
                ${p.value}
              </div>
            </div>
          ))}
        </div>

        {/* Rationale */}
        <div style={{ marginBottom: "1rem" }}>
          <div
            style={{
              fontSize: "0.6rem",
              fontWeight: 700,
              letterSpacing: "0.12em",
              color: "#94a3b8",
              textTransform: "uppercase" as const,
              marginBottom: "0.4rem",
            }}
          >
            Rationale
          </div>
          <p
            style={{
              fontSize: "0.85rem",
              lineHeight: 1.55,
              color: "#cbd5e1",
              margin: 0,
              paddingLeft: "0.75rem",
              borderLeft: "3px solid rgba(0,188,212,0.35)",
            }}
          >
            {verdict.rationale}
          </p>
        </div>

        {/* Sources credited */}
        {verdict.sourcesCredited && verdict.sourcesCredited.length > 0 && (
          <div style={{ marginBottom: "0.75rem" }}>
            <div
              style={{
                fontSize: "0.6rem",
                fontWeight: 700,
                letterSpacing: "0.12em",
                color: "#22c55e",
                textTransform: "uppercase" as const,
                marginBottom: "0.35rem",
              }}
            >
              Jury Weighted
            </div>
            <div
              style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem" }}
            >
              {verdict.sourcesCredited.map((src) => (
                <span
                  key={src}
                  style={{
                    fontSize: "0.68rem",
                    padding: "0.2rem 0.55rem",
                    borderRadius: "9999px",
                    background: "rgba(34,197,94,0.14)",
                    border: "1px solid rgba(34,197,94,0.35)",
                    color: "#22c55e",
                    fontWeight: 600,
                  }}
                >
                  {src}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Sources rejected */}
        {verdict.sourcesRejected && verdict.sourcesRejected.length > 0 && (
          <div style={{ marginBottom: "1rem" }}>
            <div
              style={{
                fontSize: "0.6rem",
                fontWeight: 700,
                letterSpacing: "0.12em",
                color: "#94a3b8",
                textTransform: "uppercase" as const,
                marginBottom: "0.35rem",
              }}
            >
              Jury Discounted
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column" as const,
                gap: "0.25rem",
              }}
            >
              {verdict.sourcesRejected.map((note, i) => (
                <div
                  key={i}
                  style={{
                    fontSize: "0.72rem",
                    padding: "0.35rem 0.55rem",
                    borderRadius: "0.5rem",
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    color: "#94a3b8",
                  }}
                >
                  {note}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer meta */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "0.5rem 1rem",
            paddingTop: "0.75rem",
            borderTop: "1px solid rgba(255,255,255,0.06)",
            fontSize: "0.65rem",
            color: "#94a3b8",
          }}
        >
          <span>
            Model: <strong style={{ color: "#e2e8f0" }}>{verdict.modelUsed}</strong>
          </span>
          <span>
            Confidence:{" "}
            <strong style={{ color: "#e2e8f0" }}>{verdict.confidence}/100</strong>
          </span>
          <span>
            Cached:{" "}
            <strong style={{ color: "#e2e8f0" }}>{formatAge(verdict.cachedAt)}</strong>
          </span>
        </div>
      </div>
    </div>
  );

  return createPortal(sheet, document.body);
}
