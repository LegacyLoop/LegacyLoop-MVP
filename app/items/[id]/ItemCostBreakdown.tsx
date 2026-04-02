"use client";

import { useState, useEffect } from "react";

interface BreakdownItem {
  botName: string;
  creditsSpent: number;
  costDollars: number;
  runCount: number;
  lastRun: string;
}

interface SpendData {
  itemId: string;
  totalCreditsSpent: number;
  totalCostDollars: number;
  breakdown: BreakdownItem[];
  estimatedValueLow: number | null;
  estimatedValueMid: number | null;
  estimatedValueHigh: number | null;
  listingPrice: number | null;
  roiPercent: number | null;
  roiLabel: string | null;
  creditCostRate: number;
}

const BOT_ICONS: Record<string, string> = {
  "AnalyzeBot": "🔍", "PriceBot": "💲", "ListBot": "📋", "BuyerBot": "🎯",
  "MegaBot": "🧠", "ReconBot": "🛰️", "AntiqueBot": "🏺", "CollectiblesBot": "🎴",
  "CarBot": "🚗", "VideoBot": "🎬", "PhotoBot": "📸", "ShipBot": "📦",
  "StyleBot": "🎨", "Document": "📄",
};

function getBotIcon(name: string): string {
  for (const [key, icon] of Object.entries(BOT_ICONS)) {
    if (name.toLowerCase().includes(key.toLowerCase())) return icon;
  }
  return "🤖";
}

export default function ItemCostBreakdown({ itemId }: { itemId: string }) {
  const [data, setData] = useState<SpendData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    fetch(`/api/items/spend/${itemId}`)
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then(setData)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [itemId]);

  const roiColor = data?.roiPercent != null
    ? data.roiPercent > 0 ? "#22c55e" : data.roiPercent > -50 ? "#f59e0b" : "#ef4444"
    : "var(--text-muted)";

  return (
    <div style={{
      background: "var(--bg-card)", backdropFilter: "blur(20px)",
      border: "1px solid var(--border-default)", borderRadius: "16px",
      overflow: "hidden", marginTop: "1rem",
    }}>
      {/* Header — always visible */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        style={{
          width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "1rem 1.25rem", background: "none", border: "none", cursor: "pointer",
          gap: "0.75rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span style={{ fontSize: "1rem" }}>💰</span>
          <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--text-primary)", letterSpacing: "0.06em", textTransform: "uppercase" }}>
            AI Cost Tracker
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          {data && data.totalCostDollars > 0 && (
            <span style={{
              padding: "0.2rem 0.6rem", borderRadius: "9999px", fontSize: "0.72rem", fontWeight: 700,
              background: "var(--accent-dim)", color: "var(--accent)", border: "1px solid var(--accent-border)",
            }}>
              ${data.totalCostDollars.toFixed(2)}
            </span>
          )}
          {data?.roiLabel && data.totalCreditsSpent > 0 && (
            <span style={{
              padding: "0.2rem 0.6rem", borderRadius: "9999px", fontSize: "0.72rem", fontWeight: 700,
              background: `${roiColor}15`, color: roiColor, border: `1px solid ${roiColor}30`,
            }}>
              {data.roiLabel}
            </span>
          )}
          <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", transition: "transform 0.2s", transform: collapsed ? "rotate(-90deg)" : "rotate(0deg)" }}>▼</span>
        </div>
      </button>

      {/* Body */}
      {!collapsed && (
        <div style={{ padding: "0 1.25rem 1.25rem" }}>
          {loading && (
            <div style={{ textAlign: "center", padding: "2rem 0", color: "var(--text-muted)", fontSize: "0.82rem" }}>Loading cost data...</div>
          )}
          {error && (
            <div style={{ textAlign: "center", padding: "1.5rem 0", color: "var(--text-muted)", fontSize: "0.82rem" }}>Could not load cost data.</div>
          )}
          {data && !loading && !error && (
            <>
              {/* Section 1: Cost vs Value */}
              {data.totalCreditsSpent > 0 ? (
                <div style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "1rem 1.25rem", borderRadius: "12px", marginBottom: "1rem",
                  background: "linear-gradient(135deg, rgba(0,188,212,0.06), rgba(0,188,212,0.02))",
                  border: "1px solid var(--accent-border)", gap: "0.75rem", flexWrap: "wrap",
                }}>
                  <div style={{ textAlign: "center", flex: 1, minWidth: "80px" }}>
                    <div style={{ fontSize: "0.62rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.2rem" }}>AI Investment</div>
                    <div style={{ fontSize: "1.5rem", fontWeight: 900, color: "var(--accent)" }}>${data.totalCostDollars.toFixed(2)}</div>
                    <div style={{ fontSize: "0.62rem", color: "var(--text-muted)" }}>{data.totalCreditsSpent} credits</div>
                  </div>
                  <div style={{ fontSize: "1.25rem", color: "var(--text-muted)" }}>→</div>
                  <div style={{ textAlign: "center", flex: 1, minWidth: "80px" }}>
                    <div style={{ fontSize: "0.62rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.2rem" }}>Est. Value</div>
                    <div style={{ fontSize: "1.5rem", fontWeight: 900, color: "var(--text-primary)" }}>
                      {data.estimatedValueMid != null ? `$${data.estimatedValueMid.toLocaleString()}` : "—"}
                    </div>
                    {data.estimatedValueLow != null && data.estimatedValueHigh != null && (
                      <div style={{ fontSize: "0.62rem", color: "var(--text-muted)" }}>${data.estimatedValueLow}–${data.estimatedValueHigh}</div>
                    )}
                  </div>
                  <div style={{ textAlign: "center", flex: 1, minWidth: "80px" }}>
                    <div style={{ fontSize: "0.62rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.2rem" }}>ROI</div>
                    <div style={{ fontSize: "1.5rem", fontWeight: 900, color: roiColor }}>
                      {data.roiPercent != null ? `${data.roiPercent.toLocaleString()}%` : "—"}
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: "center", padding: "1.5rem 0", color: "var(--text-muted)", fontSize: "0.82rem" }}>
                  No AI tools used yet. Run AnalyzeBot to get started.
                </div>
              )}

              {/* Section 2: Bot Breakdown */}
              {data.breakdown.length > 0 && (
                <div>
                  {data.breakdown.map((b, i) => (
                    <div key={b.botName} style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      padding: "0.5rem 0", borderTop: i > 0 ? "1px solid var(--border-default)" : "none",
                      fontSize: "0.78rem",
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flex: 1 }}>
                        <span style={{ fontSize: "0.9rem" }}>{getBotIcon(b.botName)}</span>
                        <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>{b.botName}</span>
                      </div>
                      <span style={{ color: "var(--text-muted)", minWidth: "50px", textAlign: "center" }}>{b.runCount}×</span>
                      <span style={{ color: "var(--text-secondary)", minWidth: "45px", textAlign: "right" }}>{b.creditsSpent} cr</span>
                      <span style={{ color: "var(--accent)", fontWeight: 700, minWidth: "55px", textAlign: "right" }}>${b.costDollars.toFixed(2)}</span>
                    </div>
                  ))}
                  {/* Total */}
                  <div style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "0.6rem 0 0.2rem", borderTop: "2px solid var(--border-default)", fontSize: "0.78rem", fontWeight: 700,
                  }}>
                    <span style={{ color: "var(--text-primary)" }}>Total</span>
                    <span style={{ color: "var(--text-muted)", minWidth: "50px", textAlign: "center" }}></span>
                    <span style={{ color: "var(--text-secondary)", minWidth: "45px", textAlign: "right" }}>{data.totalCreditsSpent} cr</span>
                    <span style={{ color: "var(--accent)", minWidth: "55px", textAlign: "right" }}>${data.totalCostDollars.toFixed(2)}</span>
                  </div>
                </div>
              )}

              {/* Section 3: Context */}
              <div style={{ marginTop: "0.75rem", fontSize: "0.65rem", color: "var(--text-muted)", textAlign: "center" }}>
                Based on ${data.creditCostRate}/credit retail rate
                {data.listingPrice != null && data.estimatedValueMid != null && data.listingPrice > data.estimatedValueMid && (
                  <span style={{ marginLeft: "0.5rem", color: "#22c55e", fontWeight: 600 }}>• Listed above estimated value</span>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
