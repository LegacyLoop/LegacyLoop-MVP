"use client";

interface Props {
  priorRunCount: number;
  confidenceLevel: "none" | "low" | "medium" | "high";
}

const CONFIG = {
  none: {
    label: "No Prior Data",
    color: "rgba(255,255,255,0.3)",
    bg: "rgba(255,255,255,0.04)",
    border: "rgba(255,255,255,0.08)",
  },
  low: {
    label: "Low Enrichment",
    color: "#f59e0b",
    bg: "rgba(245,158,11,0.08)",
    border: "rgba(245,158,11,0.2)",
  },
  medium: {
    label: "Enriched",
    color: "#00bcd4",
    bg: "rgba(0,188,212,0.08)",
    border: "rgba(0,188,212,0.2)",
  },
  high: {
    label: "Highly Enriched",
    color: "#10b981",
    bg: "rgba(16,185,129,0.08)",
    border: "rgba(16,185,129,0.2)",
  },
};

export default function EnrichmentBadge({ priorRunCount, confidenceLevel }: Props) {
  if (confidenceLevel === "none") return null;
  const c = CONFIG[confidenceLevel];
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "0.35rem",
        background: c.bg,
        border: `1px solid ${c.border}`,
        borderRadius: "20px",
        padding: "0.2rem 0.65rem",
        fontSize: "0.7rem",
        fontWeight: 700,
        color: c.color,
        letterSpacing: "0.03em",
      }}
    >
      <span style={{ fontSize: "0.75rem" }}>&#x26A1;</span>
      <span>{c.label}</span>
      <span style={{ opacity: 0.6 }}>
        &middot; {priorRunCount} source{priorRunCount !== 1 ? "s" : ""}
      </span>
    </div>
  );
}
