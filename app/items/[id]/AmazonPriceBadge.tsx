"use client";

import { useState, useEffect, useRef } from "react";

type AmazonData = {
  searchTerm: string;
  resultCount: number;
  priceRange: { low: number; high: number; avg: number; median: number };
  topResult: { title: string; price: number | null; rating: number | null; ratingsTotal: number | null; link: string } | null;
};

const MAX_RETRIES = 3;
const RETRY_INTERVAL_MS = 5000;

export default function AmazonPriceBadge({ itemId }: { itemId: string }) {
  const [data, setData] = useState<AmazonData | null>(null);
  const retriesRef = useRef(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      try {
        const res = await fetch(`/api/enrichment/amazon/${itemId}`);
        const d = await res.json();
        if (!cancelled && d.success && d.data) {
          setData(d.data);
          if (timerRef.current) clearTimeout(timerRef.current);
          return;
        }
      } catch {
        // Non-critical — fail silently
      }
      if (!cancelled && retriesRef.current < MAX_RETRIES) {
        retriesRef.current += 1;
        timerRef.current = setTimeout(fetchData, RETRY_INTERVAL_MS);
      }
    }

    fetchData();

    return () => {
      cancelled = true;
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [itemId]);

  // No data yet — render nothing (enrichment happens automatically)
  if (!data) return null;

  const { priceRange, resultCount, topResult } = data;
  const hasRange = priceRange.low > 0 && priceRange.high > 0;
  const avgPrice = priceRange.avg > 0 ? Math.round(priceRange.avg) : null;
  const medianPrice = priceRange.median > 0 ? Math.round(priceRange.median) : null;
  // Use median as the primary "market price" — more accurate than avg (resists outliers)
  const marketPrice = medianPrice || avgPrice;
  const topRating = topResult?.rating;
  const topRatingsCount = topResult?.ratingsTotal;

  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
      {/* Trust seal */}
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "4px",
          padding: "3px 10px",
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
        Amazon Verified
      </span>

      {/* Market price — shows median (reliable) instead of misleading min-max spread */}
      {hasRange && marketPrice && (
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "5px",
            padding: "3px 10px",
            borderRadius: "20px",
            border: "1px solid rgba(255,153,0,0.3)",
            background: "rgba(255,153,0,0.08)",
            fontSize: "10.5px",
            fontWeight: 700,
            color: "#e67e00",
            letterSpacing: "0.01em",
          }}
        >
          ~${marketPrice}
          <span style={{ fontWeight: 500, color: "rgba(230,126,0,0.6)", fontSize: "9.5px" }}>
            avg
          </span>
          {topRating && topRating >= 4.0 && (
            <span style={{ fontSize: "9.5px", color: "rgba(230,126,0,0.7)", fontWeight: 600 }}>
              ★ {topRating}
            </span>
          )}
          {resultCount > 0 && (
            <span style={{ fontWeight: 400, color: "rgba(230,126,0,0.5)", fontSize: "9.5px" }}>
              · {resultCount} found
            </span>
          )}
        </span>
      )}
    </div>
  );
}
