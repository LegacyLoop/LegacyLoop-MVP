"use client";

import { useState, useEffect } from "react";

type AmazonData = {
  searchTerm: string;
  resultCount: number;
  priceRange: { low: number; high: number; avg: number; median: number };
  topResult: { title: string; price: number | null; rating: number | null; ratingsTotal: number | null; link: string } | null;
};

export default function AmazonPriceBadge({ itemId }: { itemId: string }) {
  const [data, setData] = useState<AmazonData | null>(null);

  useEffect(() => {
    fetch(`/api/enrichment/amazon/${itemId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.data) setData(d.data);
      })
      .catch(() => {});
  }, [itemId]);

  // No data yet — render nothing (enrichment happens automatically)
  if (!data) return null;

  const { priceRange, resultCount } = data;
  const hasRange = priceRange.low > 0 && priceRange.high > 0;

  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
      {/* Element A — Trust seal (always shown when data exists) */}
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "4px",
          padding: "3px 9px",
          borderRadius: "20px",
          border: "1px solid rgba(0,188,212,0.25)",
          background: "rgba(0,188,212,0.08)",
          fontSize: "10.5px",
          fontWeight: 700,
          color: "rgba(0,188,212,0.95)",
          letterSpacing: "0.02em",
        }}
      >
        <span style={{ fontSize: "11px", lineHeight: 1 }}>✓</span>
        Amazon Evaluated
      </span>

      {/* Element B — Price context (only when price range exists) */}
      {hasRange && (
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "5px",
            padding: "3px 9px",
            borderRadius: "20px",
            border: "1px solid rgba(255,153,0,0.25)",
            background: "rgba(255,153,0,0.1)",
            fontSize: "10.5px",
            fontWeight: 600,
            color: "rgba(255,153,0,0.9)",
            letterSpacing: "0.01em",
          }}
        >
          <span style={{ fontSize: "11px" }}>🛒</span>
          ${Math.round(priceRange.low)}–${Math.round(priceRange.high)}
          {resultCount > 0 && (
            <span style={{ color: "rgba(255,153,0,0.5)", fontWeight: 400, marginLeft: "1px" }}>
              · {resultCount} listings
            </span>
          )}
        </span>
      )}
    </div>
  );
}
