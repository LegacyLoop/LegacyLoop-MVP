"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  itemId: string;
  hasPhotos: boolean;
  isAnalyzed: boolean;
  megabotUsed: boolean;
};

export default function AnalyzeActions({ itemId, hasPhotos, isAnalyzed, megabotUsed }: Props) {
  const router = useRouter();
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysisDone, setAnalysisDone] = useState(false);

  function refreshKeepScroll() {
    const scrollY = window.scrollY;
    router.refresh();
    requestAnimationFrame(() => window.scrollTo(0, scrollY));
  }

  async function handleAnalyze() {
    setAnalyzing(true);
    setError(null);
    setAnalysisDone(false);
    try {
      const res = await fetch(`/api/analyze/${itemId}${isAnalyzed ? "?force=1" : ""}`, { method: "POST" });
      if (!res.ok) {
        setError(await res.text() || `Analysis failed (${res.status})`);
        setAnalyzing(false);
        return;
      }
      setAnalysisDone(true);
      refreshKeepScroll();
      // Amazon enrichment is now handled inside the analyze route —
      // no client-side fire-and-forget POST needed
    } catch (err: any) {
      setError(err?.message || "Network error");
    } finally {
      setAnalyzing(false);
    }
  }

  const disabled = !hasPhotos;

  return (
    <div style={{ marginTop: "1.5rem" }}>
      {/* Action buttons row */}
      <div style={{
        display: "flex",
        gap: "0.75rem",
        justifyContent: "center",
        flexWrap: "wrap",
      }}>
        {/* Button 1: Analyze with AI */}
        {!isAnalyzed ? (
          <button
            onClick={handleAnalyze}
            disabled={disabled || analyzing}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.75rem 1.75rem",
              fontSize: "1rem",
              fontWeight: 700,
              borderRadius: "0.6rem",
              border: "none",
              background: disabled
                ? "rgba(255,255,255,0.06)"
                : analyzing
                  ? "rgba(0,188,212,0.2)"
                  : "linear-gradient(135deg, #00bcd4, #009688)",
              color: disabled ? "var(--text-muted)" : "#fff",
              cursor: disabled ? "not-allowed" : analyzing ? "wait" : "pointer",
              boxShadow: !disabled && !analyzing ? "0 0 20px rgba(0,188,212,0.3)" : "none",
              animation: !disabled && !analyzing ? "pulse 2s ease-in-out infinite" : "none",
              transition: "all 0.2s ease",
            }}
          >
            {analyzing ? (
              <>🧠 Analyzing... <span style={{ fontSize: "0.7rem", opacity: 0.8 }}>(Our AI is examining your photos — usually 10-30 seconds)</span></>
            ) : (
              "🧠 Analyze with AI"
            )}
          </button>
        ) : (
          <button
            onClick={handleAnalyze}
            disabled={analyzing}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.6rem 1.25rem",
              fontSize: "0.88rem",
              fontWeight: 600,
              borderRadius: "0.6rem",
              border: "1px solid var(--accent)",
              background: "transparent",
              color: "var(--accent)",
              cursor: analyzing ? "wait" : "pointer",
              opacity: analyzing ? 0.7 : 1,
            }}
          >
            {analyzing ? "🧠 Re-analyzing..." : "🧠 Re-Analyze with AI"}
          </button>
        )}
        {/* What gets analyzed — shown before first run */}
        {!isAnalyzed && hasPhotos && !analyzing && (
          <div style={{
            display: "flex", gap: "0.5rem", justifyContent: "center", flexWrap: "wrap",
            marginTop: "0.5rem", fontSize: "0.55rem", color: "var(--text-muted)",
          }}>
            {["🔍 Item ID", "📋 Condition", "💰 Pricing", "📦 Shipping", "🏛️ Antique Check", "📸 Photo Quality"].map((label) => (
              <span key={label} style={{
                padding: "2px 8px", borderRadius: "9999px",
                background: "rgba(0,188,212,0.06)", border: "1px solid rgba(0,188,212,0.1)",
              }}>{label}</span>
            ))}
          </div>
        )}
      </div>

      {/* MegaBot CTA when analyzed but not boosted */}
      {isAnalyzed && !megabotUsed && (
        <div style={{ textAlign: "center", marginTop: "0.75rem" }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: "0.4rem",
            padding: "0.5rem 1.25rem", borderRadius: "0.6rem",
            background: "linear-gradient(135deg, rgba(139,92,246,0.15), rgba(59,130,246,0.15))",
            border: "1px solid rgba(139,92,246,0.3)",
            fontSize: "0.75rem", color: "#8b5cf6", fontWeight: 600,
          }}>
            <span style={{ fontSize: "1rem" }}>⚡</span>
            <span>MegaBot Available — 4 AI engines for deeper analysis</span>
          </div>
          <div style={{ fontSize: "0.6rem", color: "var(--text-muted)", marginTop: "0.3rem" }}>
            Scroll down to the MegaBot panel to run a premium multi-AI analysis
          </div>
        </div>
      )}

      {analysisDone && !analyzing && (
        <p style={{
          textAlign: "center",
          fontSize: "0.75rem",
          color: "rgba(0,188,212,0.8)",
          marginTop: "0.5rem",
          margin: "0.5rem 0 0 0",
        }}>
          ✓ Analysis complete — AI identification, pricing, condition assessment, and Amazon market data all updated
        </p>
      )}

      {/* Disabled hint */}
      {disabled && (
        <p style={{
          textAlign: "center",
          fontSize: "0.78rem",
          color: "var(--text-muted)",
          marginTop: "0.6rem",
          margin: "0.6rem 0 0 0",
          fontStyle: "italic",
        }}>
          Upload photos first to analyze your item.
        </p>
      )}

      {/* Error display */}
      {error && (
        <div style={{
          marginTop: "0.65rem",
          padding: "0.6rem 1rem",
          borderRadius: "0.65rem",
          background: "rgba(239,68,68,0.1)",
          border: "1px solid rgba(239,68,68,0.3)",
          color: "#ef4444",
          fontSize: "0.8rem",
          textAlign: "center",
          maxWidth: 500,
          marginLeft: "auto",
          marginRight: "auto",
        }}>
          {error}
        </div>
      )}
    </div>
  );
}
