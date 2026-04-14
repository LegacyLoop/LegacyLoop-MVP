"use client";

import Link from "next/link";

interface EmptyStateProps {
  icon: string;
  title: string;
  description?: string;
  ctaLabel?: string;
  ctaHref?: string;
  onCtaClick?: () => void;
  variant?: "card" | "inline";
  animated?: boolean;
}

export default function EmptyState({
  icon,
  title,
  description,
  ctaLabel,
  ctaHref,
  onCtaClick,
  variant = "card",
  animated = true,
}: EmptyStateProps) {
  const isCard = variant === "card";

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: isCard ? "2.5rem 2rem" : "1.5rem 1rem",
        ...(isCard
          ? {
              background: "var(--bg-card, var(--bg-secondary))",
              border: "1px solid var(--border-default)",
              borderRadius: "1.25rem",
              boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
            }
          : {}),
      }}
    >
      <div
        style={{
          fontSize: "3rem",
          lineHeight: 1,
          marginBottom: "1rem",
          animation: animated ? "skeleton-pulse 2.5s ease-in-out infinite" : "none",
        }}
      >
        {icon}
      </div>

      <div
        style={{
          fontFamily: "var(--font-heading)",
          fontSize: "1.1rem",
          fontWeight: 600,
          color: "var(--text-primary)",
          marginBottom: description ? "0.5rem" : "0",
        }}
      >
        {title}
      </div>

      {description && (
        <div
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "0.85rem",
            color: "var(--text-secondary)",
            maxWidth: "28rem",
            lineHeight: 1.5,
            marginBottom: ctaLabel ? "1.25rem" : "0",
          }}
        >
          {description}
        </div>
      )}

      {ctaLabel && ctaHref && (
        <Link
          href={ctaHref}
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "0.65rem 1.5rem",
            borderRadius: "0.75rem",
            background: "linear-gradient(135deg, var(--accent, #00bcd4), var(--accent-deep, #0097a7))",
            color: "#fff",
            fontFamily: "var(--font-body)",
            fontSize: "0.9rem",
            fontWeight: 600,
            textDecoration: "none",
            minHeight: "44px",
            boxShadow: "0 4px 12px rgba(0,188,212,0.2)",
            transition: "transform 0.15s ease, box-shadow 0.15s ease",
          }}
        >
          {ctaLabel}
        </Link>
      )}

      {ctaLabel && onCtaClick && !ctaHref && (
        <button
          onClick={onCtaClick}
          aria-label={ctaLabel}
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "0.65rem 1.5rem",
            borderRadius: "0.75rem",
            background: "linear-gradient(135deg, var(--accent, #00bcd4), var(--accent-deep, #0097a7))",
            color: "#fff",
            fontFamily: "var(--font-body)",
            fontSize: "0.9rem",
            fontWeight: 600,
            border: "none",
            cursor: "pointer",
            minHeight: "44px",
            boxShadow: "0 4px 12px rgba(0,188,212,0.2)",
            transition: "transform 0.15s ease, box-shadow 0.15s ease",
          }}
        >
          {ctaLabel}
        </button>
      )}
    </div>
  );
}
