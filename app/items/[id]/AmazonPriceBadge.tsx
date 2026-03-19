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
