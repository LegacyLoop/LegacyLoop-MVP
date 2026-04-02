"use client";

import { useState, useEffect } from "react";

/**
 * FoundingMemberBadge — fetches REAL founding-member counts from /api/founding-members
 * and renders contextual urgency messaging.
 *
 * Every number shown is a live DB query. Zero hardcoded decorative stats.
 *
 * Props:
 *   variant — "banner" (full-width banner) | "inline" (compact text) | "pill" (small pill badge)
 *   showProgress — whether to show the visual progress bar (default: true for banner)
 */

interface Stats {
  totalSpots: number;
  claimed: number;
  remaining: number;
  percentClaimed: number;
  isOpen: boolean;
  urgency: "plenty" | "filling" | "scarce" | "final" | "closed";
}

interface Props {
  variant?: "banner" | "inline" | "pill";
  showProgress?: boolean;
  /** For server-side pre-loaded stats (avoids extra fetch) */
  initialStats?: Stats;
}

export default function FoundingMemberBadge({ variant = "inline", showProgress, initialStats }: Props) {
  const [stats, setStats] = useState<Stats | null>(initialStats ?? null);

  useEffect(() => {
    if (initialStats) return; // Skip fetch if stats were passed from server
    fetch("/api/founding-members")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => { if (data) setStats(data); })
      .catch(() => {});
  }, [initialStats]);

  if (!stats) return null;

  const urgencyConfig = getUrgencyConfig(stats);

  // ── Pill variant ──────────────────────────────────────────────────────────
  if (variant === "pill") {
    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "0.35rem",
          padding: "0.2rem 0.65rem",
          borderRadius: "9999px",
          fontSize: "0.68rem",
          fontWeight: 700,
          background: urgencyConfig.pillBg,
          color: urgencyConfig.pillColor,
          border: `1px solid ${urgencyConfig.pillBorder}`,
          letterSpacing: "0.03em",
        }}
      >
        <span style={{
          width: "6px",
          height: "6px",
          borderRadius: "50%",
          background: urgencyConfig.dotColor,
          animation: stats.urgency === "final" ? "pulse 1.5s ease-in-out infinite" : "none",
        }} />
        {stats.remaining} of {stats.totalSpots} spots left
      </span>
    );
  }

  // ── Inline variant ────────────────────────────────────────────────────────
  if (variant === "inline") {
    return (
      <span style={{ fontSize: "inherit", color: "inherit" }}>
        <strong style={{ color: urgencyConfig.numberColor }}>
          {stats.remaining}
        </strong>{" "}
        of {stats.totalSpots} founding member spots remaining
        {stats.urgency === "final" && (
          <span style={{
            marginLeft: "0.4rem",
            padding: "0.1rem 0.4rem",
            borderRadius: "9999px",
            fontSize: "0.6rem",
            fontWeight: 800,
            background: "rgba(239,68,68,0.15)",
            color: "#ef4444",
            border: "1px solid rgba(239,68,68,0.25)",
            letterSpacing: "0.05em",
          }}>
            ALMOST GONE
          </span>
        )}
        {stats.urgency === "closed" && (
          <span style={{
            marginLeft: "0.4rem",
            padding: "0.1rem 0.4rem",
            borderRadius: "9999px",
            fontSize: "0.6rem",
            fontWeight: 800,
            background: "rgba(100,116,139,0.15)",
            color: "#64748b",
            border: "1px solid rgba(100,116,139,0.25)",
          }}>
            SOLD OUT
          </span>
        )}
      </span>
    );
  }

  // ── Banner variant ────────────────────────────────────────────────────────
  const showBar = showProgress !== false;

  return (
    <div style={{
      padding: "1rem 1.25rem",
      borderRadius: "0.875rem",
      background: urgencyConfig.bannerBg,
      border: `1px solid ${urgencyConfig.bannerBorder}`,
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Ambient glow for high urgency */}
      {(stats.urgency === "scarce" || stats.urgency === "final") && (
        <div style={{
          position: "absolute",
          top: 0,
          right: 0,
          bottom: 0,
          width: "120px",
          background: `radial-gradient(ellipse at right, ${urgencyConfig.glowColor}, transparent 70%)`,
          pointerEvents: "none",
        }} />
      )}

      <div style={{
        display: "flex",
        alignItems: "center",
        gap: "0.75rem",
        flexWrap: "wrap",
        position: "relative",
        zIndex: 1,
      }}>
        {/* Badge */}
        <span style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "0.3rem",
          padding: "0.15rem 0.55rem",
          borderRadius: "9999px",
          fontSize: "0.6rem",
          fontWeight: 900,
          background: urgencyConfig.badgeBg,
          color: urgencyConfig.badgeColor,
          letterSpacing: "0.1em",
          flexShrink: 0,
        }}>
          <span style={{
            width: "5px",
            height: "5px",
            borderRadius: "50%",
            background: urgencyConfig.dotColor,
            animation: stats.urgency === "final" ? "pulse 1.5s ease-in-out infinite" : "none",
          }} />
          {urgencyConfig.badgeLabel}
        </span>

        {/* Text */}
        <span style={{ flex: 1, fontSize: "0.82rem", color: "var(--text-secondary)", minWidth: "180px" }}>
          <strong style={{ color: urgencyConfig.numberColor }}>
            {stats.remaining}
          </strong>{" "}
          of {stats.totalSpots} founding member spots at 50% off for life
        </span>

        {/* Numeric counter */}
        <span style={{
          flexShrink: 0,
          fontWeight: 900,
          fontSize: "1.15rem",
          color: urgencyConfig.numberColor,
          fontVariantNumeric: "tabular-nums",
        }}>
          {stats.claimed}/{stats.totalSpots}
          <span style={{ fontSize: "0.55rem", fontWeight: 600, color: "var(--text-muted)", marginLeft: "0.3rem" }}>
            claimed
          </span>
        </span>
      </div>

      {/* Progress bar */}
      {showBar && (
        <div style={{
          marginTop: "0.75rem",
          height: "6px",
          borderRadius: "3px",
          background: "var(--ghost-bg, rgba(0,0,0,0.08))",
          overflow: "hidden",
          position: "relative",
          zIndex: 1,
        }}>
          <div style={{
            height: "100%",
            borderRadius: "3px",
            width: `${Math.min(stats.percentClaimed, 100)}%`,
            background: urgencyConfig.barGradient,
            transition: "width 1s cubic-bezier(0.4, 0, 0.2, 1)",
          }} />
        </div>
      )}

      {/* Pulse keyframes */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.3); }
        }
      `}</style>
    </div>
  );
}

/**
 * Compute colors and labels based on urgency tier.
 * Uses raw hex values in template literals (CSS vars break in `${}22` patterns).
 */
function getUrgencyConfig(stats: Stats) {
  switch (stats.urgency) {
    case "closed":
      return {
        pillBg: "rgba(100,116,139,0.1)",
        pillColor: "#64748b",
        pillBorder: "rgba(100,116,139,0.2)",
        dotColor: "#64748b",
        numberColor: "#64748b",
        bannerBg: "rgba(100,116,139,0.06)",
        bannerBorder: "rgba(100,116,139,0.15)",
        glowColor: "transparent",
        badgeBg: "#64748b",
        badgeColor: "#fff",
        badgeLabel: "SOLD OUT",
        barGradient: "linear-gradient(90deg, #94a3b8, #64748b)",
      };
    case "final":
      return {
        pillBg: "rgba(239,68,68,0.1)",
        pillColor: "#ef4444",
        pillBorder: "rgba(239,68,68,0.25)",
        dotColor: "#ef4444",
        numberColor: "#ef4444",
        bannerBg: "rgba(239,68,68,0.06)",
        bannerBorder: "rgba(239,68,68,0.15)",
        glowColor: "rgba(239,68,68,0.12)",
        badgeBg: "#ef4444",
        badgeColor: "#fff",
        badgeLabel: "FINAL SPOTS",
        barGradient: "linear-gradient(90deg, #f87171, #ef4444)",
      };
    case "scarce":
      return {
        pillBg: "rgba(245,158,11,0.1)",
        pillColor: "#f59e0b",
        pillBorder: "rgba(245,158,11,0.25)",
        dotColor: "#f59e0b",
        numberColor: "#f59e0b",
        bannerBg: "rgba(245,158,11,0.06)",
        bannerBorder: "rgba(245,158,11,0.15)",
        glowColor: "rgba(245,158,11,0.1)",
        badgeBg: "#f59e0b",
        badgeColor: "#78350f",
        badgeLabel: "FILLING FAST",
        barGradient: "linear-gradient(90deg, #fbbf24, #f59e0b)",
      };
    case "filling":
      return {
        pillBg: "rgba(0,188,212,0.1)",
        pillColor: "#00bcd4",
        pillBorder: "rgba(0,188,212,0.25)",
        dotColor: "#00bcd4",
        numberColor: "#00bcd4",
        bannerBg: "rgba(0,188,212,0.06)",
        bannerBorder: "rgba(0,188,212,0.15)",
        glowColor: "transparent",
        badgeBg: "#00bcd4",
        badgeColor: "#fff",
        badgeLabel: "FOUNDING MEMBER",
        barGradient: "linear-gradient(90deg, #22d3ee, #00bcd4)",
      };
    default: // "plenty"
      return {
        pillBg: "rgba(0,188,212,0.08)",
        pillColor: "#00bcd4",
        pillBorder: "rgba(0,188,212,0.2)",
        dotColor: "#00bcd4",
        numberColor: "var(--accent)",
        bannerBg: "rgba(0,188,212,0.04)",
        bannerBorder: "rgba(0,188,212,0.12)",
        glowColor: "transparent",
        badgeBg: "var(--accent)",
        badgeColor: "#fff",
        badgeLabel: "FOUNDING MEMBER",
        barGradient: "linear-gradient(90deg, #67e8f9, #00bcd4)",
      };
  }
}
