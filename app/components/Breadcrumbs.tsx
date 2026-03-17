"use client";

import Link from "next/link";

type Crumb = { label: string; href?: string };

export default function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav
      aria-label="Breadcrumb"
      style={{
        fontSize: "0.78rem",
        color: "var(--text-muted)",
        marginBottom: "0.5rem",
        display: "flex",
        alignItems: "center",
        gap: "0.35rem",
        flexWrap: "wrap",
      }}
    >
      {items.map((crumb, i) => {
        const isLast = i === items.length - 1;
        return (
          <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem" }}>
            {crumb.href && !isLast ? (
              <Link
                href={crumb.href}
                style={{
                  color: "var(--text-muted)",
                  textDecoration: "none",
                  transition: "color 0.15s ease",
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--accent)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--text-muted)"; }}
              >
                {crumb.label}
              </Link>
            ) : (
              <span style={{ color: isLast ? "var(--text-secondary)" : "var(--text-muted)" }}>
                {crumb.label}
              </span>
            )}
            {!isLast && <span style={{ color: "var(--text-muted)", opacity: 0.5 }}>/</span>}
          </span>
        );
      })}
    </nav>
  );
}
