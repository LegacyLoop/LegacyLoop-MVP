"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AI_CONFIDENCE_THRESHOLDS } from "@/lib/constants/pricing";

export default function ConfidencePill({
  value,
  itemId,
  lastAnalyzedAt,
  photosFingerprint,
}: {
  value: number | null;
  itemId: string;
  lastAnalyzedAt?: string | null;
  photosFingerprint?: string | null;
}) {
  const router = useRouter();
  const [, setBusy] = useState(false);
  const autoFiredRef = useRef(false);

  // Compute pct + color BEFORE early returns so hooks below stay stable
  const pct = value == null ? null : Math.round(value > 1 ? value : value * 100);
  const isLow = pct != null && pct < AI_CONFIDENCE_THRESHOLDS.LOW;
  const color =
    pct != null && pct > AI_CONFIDENCE_THRESHOLDS.HIGH ? "#22c55e" : "#f59e0b";

  // ── Auto-fire useEffect · the new behavior ────────────────────
  useEffect(() => {
    // Skip if no value yet OR confidence is high enough
    if (pct == null || pct >= AI_CONFIDENCE_THRESHOLDS.LOW) return;

    // Strict Mode + nav guard · ref flag prevents double-fire
    if (autoFiredRef.current) return;

    if (typeof window === "undefined") return;

    // Per-session circuit-breaker
    const sessionKey = `auto-reanalyze:${itemId}`;
    if (window.sessionStorage.getItem(sessionKey)) {
      // Telemetry · SKIPPED
      fetch("/api/user-event", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventType: "CONFIDENCE_AUTO_REANALYZE_SKIPPED",
          itemId,
          metadata: JSON.stringify({ reason: "session_circuit_breaker", confidence: pct }),
        }),
      }).catch(() => {});
      return;
    }

    // Stale check · only fire if last analyze is older than threshold
    // OR photos changed since last analyze
    const photosKey = `auto-reanalyze:photos:${itemId}`;
    const previousPhotosFingerprint = window.sessionStorage.getItem(photosKey);
    const photosChanged =
      photosFingerprint != null && photosFingerprint !== previousPhotosFingerprint;

    if (lastAnalyzedAt && !photosChanged) {
      const ageMs = Date.now() - new Date(lastAnalyzedAt).getTime();
      const staleMs = AI_CONFIDENCE_THRESHOLDS.AUTO_REANALYZE_STALE_HOURS * 60 * 60 * 1000;
      if (ageMs < staleMs) {
        // Telemetry · SKIPPED (not stale enough)
        fetch("/api/user-event", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            eventType: "CONFIDENCE_AUTO_REANALYZE_SKIPPED",
            itemId,
            metadata: JSON.stringify({ reason: "not_stale", confidence: pct, ageHours: Math.round(ageMs / 3600000) }),
          }),
        }).catch(() => {});
        return;
      }
    }

    autoFiredRef.current = true;
    window.sessionStorage.setItem(sessionKey, "1");
    if (photosFingerprint) {
      window.sessionStorage.setItem(photosKey, photosFingerprint);
    }
    setBusy(true);

    const controller = new AbortController();

    // Telemetry · FIRED
    fetch("/api/user-event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        eventType: "CONFIDENCE_AUTO_REANALYZE_FIRED",
        itemId,
        metadata: JSON.stringify({ confidence: pct, lastAnalyzedAt, photosFingerprint, photosChanged }),
      }),
    }).catch(() => {});

    // BONUS BUG FIX · ?force=1 actually triggers re-analysis
    fetch(`/api/analyze/${itemId}?force=1`, { method: "POST", signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error(`analyze ${res.status}`);
        // Telemetry · COMPLETE
        return fetch("/api/user-event", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            eventType: "CONFIDENCE_AUTO_REANALYZE_COMPLETE",
            itemId,
            metadata: JSON.stringify({ confidence: pct }),
          }),
        }).catch(() => {});
      })
      .then(() => router.refresh())
      .catch((err) => {
        if (err?.name === "AbortError") return;
        // Telemetry · FAIL
        fetch("/api/user-event", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            eventType: "CONFIDENCE_AUTO_REANALYZE_FAIL",
            itemId,
            metadata: JSON.stringify({ confidence: pct, error: String(err?.message ?? err) }),
          }),
        }).catch(() => {});
      })
      .finally(() => setBusy(false));

    return () => controller.abort();
  }, [pct, itemId, lastAnalyzedAt, photosFingerprint, router]);

  // Render only the pill · no manual button (Option B locked)
  if (value == null || pct == null) return null;

  return (
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
      aria-label={`Confidence ${pct}%${isLow ? ", low, auto-reanalyzing" : ""}`}
    >
      <div style={{ fontSize: "0.48rem", textTransform: "uppercase" as const, letterSpacing: "0.08em", color: "var(--text-muted)", fontWeight: 700 }}>
        Confidence
      </div>
      <div style={{ fontSize: "0.92rem", fontWeight: 700, fontFamily: "var(--font-data)", color }}>{pct}%</div>
    </div>
  );
}
