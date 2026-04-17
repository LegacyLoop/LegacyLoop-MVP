"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ConfidencePill({ value, itemId }: { value: number | null; itemId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  if (value == null) return null;

  const pct = Math.round(value > 1 ? value : value * 100);
  const isLow = pct < 50;
  const color = pct > 70 ? "#22c55e" : "#f59e0b";

  const onReanalyze = async () => {
    if (busy) return;
    setBusy(true);
    try { (navigator as any)?.vibrate?.(8); } catch {}
    fetch("/api/user-event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eventType: "CONFIDENCE_REANALYZE_TAP", itemId, metadata: JSON.stringify({ confidence: pct }) }),
    }).catch(() => {});
    try {
      await fetch(`/api/analyze/${itemId}`, { method: "POST" });
      router.refresh();
    } catch {
      /* silent */
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div
        className={isLow ? "confidence-pill-low" : undefined}
        style={{
          textAlign: "center" as const,
          padding: "0.35rem 0.65rem",
          borderRadius: "0.5rem",
          background: "var(--ghost-bg)",
          border: "1px solid var(--border-default)",
          flexShrink: 0,
        }}
        aria-label={`Confidence ${pct}%${isLow ? ", low, re-analyze available" : ""}`}
      >
        <div style={{ fontSize: "0.48rem", textTransform: "uppercase" as const, letterSpacing: "0.08em", color: "var(--text-muted)", fontWeight: 700 }}>
          Confidence
        </div>
        <div style={{ fontSize: "0.92rem", fontWeight: 700, fontFamily: "var(--font-data)", color }}>{pct}%</div>
      </div>
      {isLow && (
        <button
          type="button"
          aria-label="Re-analyze item"
          onClick={onReanalyze}
          disabled={busy}
          style={{
            width: 28,
            height: 28,
            minWidth: 28,
            borderRadius: 9999,
            border: "1px solid #f59e0b",
            background: "rgba(245,158,11,0.08)",
            color: "#f59e0b",
            cursor: busy ? "wait" : "pointer",
            alignSelf: "center",
            padding: 0,
            flexShrink: 0,
            fontSize: "0.95rem",
            lineHeight: 1,
            fontWeight: 700,
            fontFamily: "inherit",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {busy ? (
            <span style={{ display: "inline-block", width: 12, height: 12, borderRadius: 9999, border: "2px solid rgba(245,158,11,0.35)", borderTopColor: "#f59e0b", animation: "spin 0.8s linear infinite" }} />
          ) : (
            "↻"
          )}
        </button>
      )}
    </>
  );
}
