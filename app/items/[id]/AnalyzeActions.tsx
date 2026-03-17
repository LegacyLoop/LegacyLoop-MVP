"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  itemId: string;
  hasPhotos: boolean;
  isAnalyzed: boolean;
  megabotUsed: boolean;
};

export default function AnalyzeActions({ itemId, hasPhotos, isAnalyzed }: Props) {
  const router = useRouter();
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function refreshKeepScroll() {
    const scrollY = window.scrollY;
    router.refresh();
    requestAnimationFrame(() => window.scrollTo(0, scrollY));
  }

  async function handleAnalyze() {
    setAnalyzing(true);
    setError(null);
    try {
      const res = await fetch(`/api/analyze/${itemId}${isAnalyzed ? "?force=1" : ""}`, { method: "POST" });
      if (!res.ok) {
        setError(await res.text() || `Analysis failed (${res.status})`);
        setAnalyzing(false);
        return;
      }
      refreshKeepScroll();
      // Auto-trigger Amazon enrichment — fire and forget, silent
      fetch(`/api/enrichment/amazon/${itemId}`, { method: "POST", headers: { "Content-Type": "application/json" } }).catch(() => null);
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
              <>🧠 Analyzing... <span style={{ fontSize: "0.8rem", opacity: 0.8 }}>(10-30 sec)</span></>
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
      </div>

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
