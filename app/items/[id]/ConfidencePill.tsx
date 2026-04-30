"use client";

import { useRouter } from "next/navigation";
import { AI_CONFIDENCE_THRESHOLDS } from "@/lib/constants/pricing";
import { useAutoBotRefresh } from "./useAutoBotRefresh";

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

  // Compute pct + color BEFORE early returns so hooks below stay stable
  const pct = value == null ? null : Math.round(value > 1 ? value : value * 100);
  const isLow = pct != null && pct < AI_CONFIDENCE_THRESHOLDS.LOW;
  const color =
    pct != null && pct > AI_CONFIDENCE_THRESHOLDS.HIGH ? "#22c55e" : "#f59e0b";

  // Auto-fire path · same behavior as before · now via shared hook (CMD-CYL-6)
  useAutoBotRefresh({
    botKey: "reanalyze",
    itemId,
    confidence: pct,
    lastAnalyzedAt,
    photosFingerprint,
    lowThreshold: AI_CONFIDENCE_THRESHOLDS.LOW,
    staleHours: AI_CONFIDENCE_THRESHOLDS.AUTO_REANALYZE_STALE_HOURS,
    endpoint: `/api/analyze/${itemId}?force=1`,
    telemetryPrefix: "CONFIDENCE_AUTO_REANALYZE",
    onComplete: () => router.refresh(),
  });

  // Render only the pill · no manual button (Option B locked from Cyl 4)
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
