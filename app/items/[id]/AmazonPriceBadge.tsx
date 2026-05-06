"use client";

import { useState, useEffect, useRef } from "react";

type AmazonData = {
  searchTerm: string;
  resultCount: number;
  totalResults?: number;
  priceRange: { low: number; high: number; avg: number; median: number };
  topResult: { title: string; price: number | null; rating: number | null; ratingsTotal: number | null; link: string } | null;
  fetchedAt?: string;
};

const MAX_RETRIES = 2;
const RETRY_INTERVAL_MS = 5000;

function timeAgo(isoDate: string): string {
  const diff = Date.now() - new Date(isoDate).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return mins <= 1 ? "just now" : `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "1 day ago";
  if (days < 30) return `${days} days ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

function formatCount(n: number): string {
  if (n >= 10000) return `${(n / 1000).toFixed(1)}k`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return n.toLocaleString();
}

export default function AmazonPriceBadge({ itemId }: { itemId: string }) {
  const [data, setData] = useState<AmazonData | null>(null);
  const [cachedAt, setCachedAt] = useState<string | null>(null);
  const [notAvailable, setNotAvailable] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const retriesRef = useRef(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // ── Wire G · live-Amazon Sonar refresh (CMD-AMAZONPRICEBADGE-SONAR-SLOT V18) ──
  async function refreshFromSonar() {
    if (refreshing) return;
    setRefreshing(true);
    try {
      const res = await fetch(`/api/items/${itemId}/amazon-sonar-refresh`, { method: "POST" });
      const d = await res.json();
      if (d.result) {
        try {
          const live = typeof d.result === "string" ? JSON.parse(d.result) : d.result;
          if (live && live.priceRange) {
            setData(live as AmazonData);
            setCachedAt(live.fetchedAt ?? new Date().toISOString());
            setNotAvailable(false);
          }
        } catch {
          // Non-critical · fallback to existing data
        }
      }
    } catch {
      // Non-critical
    } finally {
      setRefreshing(false);
    }
  }

  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      try {
        const res = await fetch(`/api/enrichment/amazon/${itemId}`);
        const d = await res.json();
        if (!cancelled && d.success && d.data) {
          setData(d.data);
          if (d.cachedAt) setCachedAt(d.cachedAt);
          else if (d.data.fetchedAt) setCachedAt(d.data.fetchedAt);
          if (timerRef.current) clearTimeout(timerRef.current);
          return;
        }
      } catch {
        // Non-critical
      }
      if (!cancelled && retriesRef.current < MAX_RETRIES) {
        retriesRef.current += 1;
        timerRef.current = setTimeout(fetchData, RETRY_INTERVAL_MS);
      } else if (!cancelled) {
        setNotAvailable(true);
      }
    }

    fetchData();
    return () => {
      cancelled = true;
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [itemId]);

  // ── Professional empty state ──
  if (notAvailable && !data) {
    return (
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
        padding: "6px 14px", borderRadius: "8px",
        background: "var(--bg-card)", border: "1px solid var(--border-default)",
      }}>
        <span style={{
          width: "6px", height: "6px", borderRadius: "50%",
          background: "rgba(148,163,184,0.3)",
        }} />
        <span style={{
          fontSize: "11px", fontWeight: 500, color: "var(--text-muted)",
          letterSpacing: "0.02em",
        }}>
          Amazon data not available for this item
        </span>
      </div>
    );
  }

  if (!data) return null;

  const { priceRange, resultCount, totalResults, topResult } = data;
  const hasRange = priceRange.low > 0 && priceRange.high > 0;
  const medianPrice = priceRange.median > 0 ? Math.round(priceRange.median) : null;
  const avgPrice = priceRange.avg > 0 ? Math.round(priceRange.avg) : null;
  const marketPrice = medianPrice || avgPrice;
  const displayCount = totalResults && totalResults > 0 ? totalResults : resultCount;
  const topRating = topResult?.rating;
  const freshness = cachedAt || data.fetchedAt;
  const lowPrice = hasRange ? Math.round(priceRange.low) : null;
  const highPrice = hasRange ? Math.round(priceRange.high) : null;

  return (
    <>
      <style>{`
        .amz-hud {
          position: relative;
          display: flex;
          align-items: stretch;
          gap: 0;
          border-radius: 10px;
          overflow: hidden;
          background: linear-gradient(135deg, rgba(0,0,0,0.03) 0%, rgba(0,0,0,0.01) 100%);
          border: 1px solid rgba(0,188,212,0.15);
          box-shadow: 0 1px 8px rgba(0,188,212,0.06), inset 0 1px 0 rgba(255,255,255,0.06);
          font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Inter', sans-serif;
          width: 100%;
          max-width: 480px;
          margin: 0 auto;
        }
        html.dark .amz-hud {
          background: linear-gradient(135deg, rgba(0,188,212,0.04) 0%, rgba(0,0,0,0.2) 100%);
          border-color: rgba(0,188,212,0.2);
          box-shadow: 0 1px 12px rgba(0,188,212,0.08), inset 0 1px 0 rgba(255,255,255,0.04);
        }
        .amz-hud-seal {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 3px;
          padding: 10px 14px;
          background: linear-gradient(180deg, rgba(0,188,212,0.08) 0%, rgba(0,188,212,0.03) 100%);
          border-right: 1px solid rgba(0,188,212,0.12);
          min-width: 72px;
        }
        html.dark .amz-hud-seal {
          background: linear-gradient(180deg, rgba(0,188,212,0.12) 0%, rgba(0,188,212,0.04) 100%);
          border-right-color: rgba(0,188,212,0.18);
        }
        .amz-hud-dot {
          width: 7px; height: 7px; border-radius: 50%;
          background: #00bcd4;
          box-shadow: 0 0 6px rgba(0,188,212,0.5);
          animation: amzPulse 3s ease-in-out infinite;
        }
        @keyframes amzPulse {
          0%, 100% { box-shadow: 0 0 4px rgba(0,188,212,0.4); }
          50% { box-shadow: 0 0 10px rgba(0,188,212,0.7); }
        }
        .amz-hud-seal-label {
          font-size: 8.5px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--accent, #00bcd4);
          line-height: 1;
        }
        .amz-hud-seal-sub {
          font-size: 7.5px;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--text-muted, #94a3b8);
          opacity: 0.7;
          line-height: 1;
        }
        .amz-hud-data {
          flex: 1;
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 0;
          padding: 0;
        }
        .amz-hud-cell {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 8px 6px;
          border-right: 1px solid var(--border-default, rgba(255,255,255,0.08));
          position: relative;
        }
        .amz-hud-cell:last-child {
          border-right: none;
        }
        .amz-hud-value {
          font-size: 15px;
          font-weight: 800;
          letter-spacing: -0.02em;
          line-height: 1.1;
          color: var(--text-primary, #f1f5f9);
          font-variant-numeric: tabular-nums;
        }
        .amz-hud-value.price {
          color: #e67e00;
        }
        html.dark .amz-hud-value.price {
          color: #ffa726;
        }
        .amz-hud-value.rating {
          color: #f59e0b;
        }
        .amz-hud-value.count {
          color: var(--accent, #00bcd4);
        }
        .amz-hud-label {
          font-size: 7.5px;
          font-weight: 600;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--text-muted, #94a3b8);
          opacity: 0.65;
          line-height: 1;
          margin-top: 2px;
        }
        .amz-hud-footer {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 3px 12px;
          border-top: 1px solid var(--border-default, rgba(255,255,255,0.06));
          background: rgba(0,0,0,0.02);
        }
        html.dark .amz-hud-footer {
          background: rgba(0,0,0,0.15);
        }
        .amz-hud-footer-text {
          font-size: 8px;
          font-weight: 500;
          letter-spacing: 0.06em;
          color: var(--text-muted, #94a3b8);
          opacity: 0.5;
        }
        .amz-hud-footer-sep {
          width: 2px;
          height: 2px;
          border-radius: 50%;
          background: var(--text-muted, #94a3b8);
          opacity: 0.3;
        }
        .amz-hud-range {
          font-size: 8.5px;
          font-weight: 500;
          color: var(--text-muted, #94a3b8);
          opacity: 0.55;
          line-height: 1;
          margin-top: 1px;
        }
      `}</style>

      <div className="amz-hud">
        {/* Verified Seal */}
        <div className="amz-hud-seal">
          <div className="amz-hud-dot" />
          <span className="amz-hud-seal-label">Amazon</span>
          <span className="amz-hud-seal-sub">Verified</span>
        </div>

        {/* Data Grid */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          <div className="amz-hud-data">
            {/* Median Price · CMD-PRICE-CANONICAL-HIERARCHY · disambiguates as Amazon retail comp, not canonical sell price */}
            <div className="amz-hud-cell" title="Amazon retail median · reference data only · not your canonical sell price" aria-label="Amazon retail median price (reference comp only)">
              <span className="amz-hud-value price">
                {marketPrice ? `$${marketPrice}` : "—"}
              </span>
              <span className="amz-hud-label">Median <span style={{ fontWeight: 500, opacity: 0.7, fontSize: "0.85em" }}>(retail comp)</span></span>
              {lowPrice && highPrice && lowPrice !== highPrice && (
                <span className="amz-hud-range">${lowPrice}–${highPrice}</span>
              )}
            </div>

            {/* Rating */}
            <div className="amz-hud-cell">
              <span className="amz-hud-value rating">
                {topRating ? `${topRating}` : "—"}
              </span>
              <span className="amz-hud-label">Rating</span>
              {topRating && (
                <span className="amz-hud-range">
                  {"★".repeat(Math.round(topRating))}
                </span>
              )}
            </div>

            {/* Results Found */}
            <div className="amz-hud-cell">
              <span className="amz-hud-value count">
                {displayCount > 0 ? formatCount(displayCount) : "—"}
              </span>
              <span className="amz-hud-label">Found</span>
            </div>
          </div>

          {/* Footer */}
          <div className="amz-hud-footer">
            <span className="amz-hud-footer-text">NEW RETAIL PRICE</span>
            {freshness && (
              <>
                <span className="amz-hud-footer-sep" />
                <span className="amz-hud-footer-text">
                  Updated {timeAgo(freshness)}
                </span>
              </>
            )}
            <span className="amz-hud-footer-sep" />
            {refreshing ? (
              <span className="amz-hud-footer-text" aria-live="polite">Refreshing…</span>
            ) : (
              <button
                type="button"
                onClick={refreshFromSonar}
                aria-label="Refresh price from live Amazon search"
                style={{
                  background: "transparent",
                  border: "none",
                  padding: "4px 8px",
                  margin: "-4px -4px -4px 0",
                  minHeight: "20px",
                  cursor: "pointer",
                  fontSize: "8px",
                  fontWeight: 600,
                  letterSpacing: "0.08em",
                  color: "var(--accent, #00bcd4)",
                  opacity: 0.7,
                  textTransform: "uppercase",
                  transition: "opacity 0.15s",
                }}
                onMouseOver={(e) => (e.currentTarget.style.opacity = "1")}
                onMouseOut={(e) => (e.currentTarget.style.opacity = "0.7")}
                onFocus={(e) => (e.currentTarget.style.opacity = "1")}
                onBlur={(e) => (e.currentTarget.style.opacity = "0.7")}
              >
                ↻ Live
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
