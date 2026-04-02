"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

/* ──────────────────────────────────────────────────────────────────────────────
   BundleSuggestions — Dashboard widget
   Fetches AI-detected bundle groupings from /api/bundles/suggestions.
   Renders as a compact card with up to 3 suggestions.
   All inline style={{}} — no Tailwind.
   ────────────────────────────────────────────────────────────────────────────── */

const TEAL = "#00bcd4";
const GLASS = "var(--bg-card)";
const GLASS_BORDER = "var(--border-default)";
const TEXT_PRIMARY = "var(--text-primary)";
const TEXT_SECONDARY = "var(--text-secondary)";
const TEXT_MUTED = "var(--text-muted)";
const SUCCESS_GREEN = "#4caf50";

interface Suggestion {
  category: string;
  itemCount: number;
  individualTotal: number;
  suggestedPrice: number;
  discountPercent: number;
  sampleTitles?: string[];
  samplePhotos?: string[];
  itemIds?: string[];
}

function getDiscountColor(pct: number): string {
  if (pct >= 25) return "#f44336";
  if (pct >= 15) return "#ff9800";
  if (pct >= 10) return SUCCESS_GREEN;
  return TEAL;
}

export default function BundleSuggestions({ projectId }: { projectId?: string } = {}) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState<string[]>([]);
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  useEffect(() => {
    fetch(`/api/bundles/suggestions${projectId ? `?projectId=${projectId}` : ""}`)
      .then((r) => r.json())
      .then((d) => setSuggestions(d.suggestions || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const visible = suggestions.filter((s) => !dismissed.includes(s.category));

  if (!loading && visible.length === 0) return null;

  return (
    <div
      style={{
        background: GLASS,
        border: `1px solid ${GLASS_BORDER}`,
        borderRadius: 14,
        padding: 20,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 4,
        }}
      >
        <div
          style={{
            fontSize: 13,
            fontWeight: 700,
            color: TEXT_PRIMARY,
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <span style={{ fontSize: 15 }}>{"\uD83D\uDCE6"}</span>
          Bundle Opportunities
        </div>
        <Link
          href="/bundles/create"
          style={{
            fontSize: 10,
            fontWeight: 700,
            color: TEAL,
            textDecoration: "none",
            background: `${TEAL}15`,
            borderRadius: 6,
            padding: "3px 8px",
          }}
        >
          Create Bundle
        </Link>
      </div>
      <div
        style={{
          fontSize: 11,
          color: TEXT_MUTED,
          marginBottom: 14,
        }}
      >
        AI detected these groupings that could sell faster as bundles
      </div>

      {/* Loading skeleton */}
      {loading && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              style={{
                height: 52,
                background: "var(--ghost-bg)",
                borderRadius: 10,
              }}
            />
          ))}
        </div>
      )}

      {/* Suggestion rows */}
      {!loading &&
        visible.slice(0, 3).map((s, i) => {
          const isHover = hoverIdx === i;
          const dColor = getDiscountColor(s.discountPercent);
          const savings = s.individualTotal - s.suggestedPrice;

          return (
            <div
              key={s.category}
              onMouseEnter={() => setHoverIdx(i)}
              onMouseLeave={() => setHoverIdx(null)}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "10px 12px",
                marginBottom: i < visible.length - 1 ? 6 : 0,
                borderRadius: 10,
                background: isHover ? "var(--border-default)" : "transparent",
                transition: "background 0.15s",
              }}
            >
              {/* Left: info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    marginBottom: 2,
                  }}
                >
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: TEXT_PRIMARY,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {s.category}
                  </span>
                  <span
                    style={{
                      fontSize: 10,
                      color: TEXT_MUTED,
                      flexShrink: 0,
                    }}
                  >
                    ({s.itemCount} items)
                  </span>
                </div>
                {s.samplePhotos && s.samplePhotos.length > 0 && (
                  <div style={{ display: "flex", gap: 3, marginTop: 4, marginBottom: 2 }}>
                    {s.samplePhotos.slice(0, 4).map((p: string, pi: number) => (
                      <img key={pi} src={p} alt="" style={{ width: 28, height: 28, borderRadius: 5, objectFit: "cover" as const, border: "1px solid var(--border-default)" }} />
                    ))}
                    {s.itemCount > 4 && (
                      <span style={{ width: 28, height: 28, borderRadius: 5, background: "var(--ghost-bg)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 700, color: TEXT_MUTED }}>+{s.itemCount - 4}</span>
                    )}
                  </div>
                )}
                <div style={{ fontSize: 11, color: TEXT_SECONDARY }}>
                  <span style={{ textDecoration: "line-through", color: TEXT_MUTED }}>
                    ${s.individualTotal.toLocaleString()}
                  </span>
                  {" \u2192 "}
                  <span style={{ fontWeight: 700, color: TEAL }}>
                    ${s.suggestedPrice.toLocaleString()}
                  </span>
                  <span
                    style={{
                      marginLeft: 6,
                      fontSize: 10,
                      fontWeight: 700,
                      color: dColor,
                      background: `${dColor}18`,
                      borderRadius: 4,
                      padding: "1px 6px",
                    }}
                  >
                    {s.discountPercent}% off
                  </span>
                </div>
                {s.sampleTitles && s.sampleTitles.length > 0 && isHover && (
                  <div style={{ fontSize: 10, color: TEXT_MUTED, marginTop: 3 }}>
                    {s.sampleTitles.slice(0, 2).join(", ")}
                    {s.sampleTitles.length > 2 && ` +${s.sampleTitles.length - 2} more`}
                  </div>
                )}
              </div>

              {/* Right: actions */}
              <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0, marginLeft: 10 }}>
                <Link
                  href={`/bundles/create?type=category&category=${encodeURIComponent(s.category)}`}
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: TEAL,
                    textDecoration: "none",
                    padding: "4px 10px",
                    borderRadius: 6,
                    background: isHover ? `${TEAL}18` : "transparent",
                    transition: "background 0.15s",
                  }}
                >
                  Create {"\u2192"}
                </Link>
                <button
                  onClick={() => setDismissed((prev) => [...prev, s.category])}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: TEXT_MUTED,
                    fontSize: 14,
                    cursor: "pointer",
                    padding: "2px 4px",
                    lineHeight: 1,
                    opacity: isHover ? 1 : 0,
                    transition: "opacity 0.15s",
                  }}
                  title="Dismiss"
                >
                  {"\u00D7"}
                </button>
              </div>
            </div>
          );
        })}

      {/* Footer */}
      {!loading && visible.length > 3 && (
        <div style={{ textAlign: "center", marginTop: 10 }}>
          <Link
            href="/bundles/create"
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: TEAL,
              textDecoration: "none",
            }}
          >
            View all {visible.length} suggestions {"\u2192"}
          </Link>
        </div>
      )}
    </div>
  );
}
