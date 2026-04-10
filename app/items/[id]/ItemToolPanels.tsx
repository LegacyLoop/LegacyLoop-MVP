"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import CollapsiblePanel from "@/app/components/CollapsiblePanel";
import { getCommissionPct } from "@/lib/commission";
import { PROCESSING_FEE } from "@/lib/constants/pricing";

type Props = {
  itemId: string;
  aiData: any;
  valuation: any;
  antique: any;
  comps: any[];
  photos: { id: string; filePath: string; isPrimary: boolean; caption: string | null }[];
  status: string;
  category: string;
  saleZip: string | null;
  megabotUsed: boolean;
  userTier: number;
};

/* ─── AI Analysis Panel ─── */
function refreshKeepScroll(router: ReturnType<typeof useRouter>) {
  const scrollY = window.scrollY;
  router.refresh();
  requestAnimationFrame(() => window.scrollTo(0, scrollY));
}

function AiPanel({ aiData, itemId, status }: { aiData: any; itemId: string; status: string }) {
  const router = useRouter();
  const [analyzing, setAnalyzing] = useState(false);
  const [showJson, setShowJson] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function analyze(force?: boolean) {
    setAnalyzing(true);
    setError(null);
    try {
      const res = await fetch(`/api/analyze/${itemId}${force ? "?force=1" : ""}`, { method: "POST" });
      if (!res.ok) {
        const msg = await res.text();
        setError(msg || `Analysis failed (${res.status})`);
        setAnalyzing(false);
        return;
      }
      refreshKeepScroll(router);
    } catch (err: any) {
      setError(err?.message || "Network error — please try again.");
    } finally {
      setAnalyzing(false);
    }
  }

  if (!aiData) {
    const isDraft = status === "DRAFT";
    return (
      <div style={{ textAlign: "center", padding: isDraft ? "1.5rem 0" : "1rem 0" }}>
        <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginBottom: "1rem" }}>
          {isDraft ? "Your item is ready for AI analysis. This will identify it, estimate value, and find the best markets." : "Not yet analyzed."}
        </p>
        <button
          onClick={() => analyze()}
          disabled={analyzing}
          className="btn-primary"
          style={{
            padding: isDraft ? "0.85rem 2.5rem" : "0.5rem 1.5rem",
            fontSize: isDraft ? "1rem" : "0.85rem",
            fontWeight: 700,
            ...(isDraft && !analyzing ? { animation: "pulse 2s ease-in-out infinite", boxShadow: "0 0 20px rgba(0,188,212,0.4)" } : {}),
          }}
        >
          {analyzing ? "Analyzing... (usually 60–120 seconds)" : isDraft ? "Analyze This Item with AI" : "Run AI Analysis"}
        </button>
        {error && (
          <div style={{ marginTop: "0.75rem", padding: "0.65rem 1rem", borderRadius: "0.75rem", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#ef4444", fontSize: "0.82rem", textAlign: "left" }}>
            {error}
          </div>
        )}
      </div>
    );
  }

  const confPct = Math.round(Math.min(100, (aiData.confidence || 0) * 100));
  const keywords: string[] = Array.isArray(aiData.keywords) ? aiData.keywords : [];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
        {[
          { label: "Item", value: aiData.item_name || "—" },
          { label: "Category", value: aiData.category || "—" },
          { label: "Brand", value: aiData.brand || "—" },
          { label: "Model", value: aiData.model || "—" },
        ].map((d) => (
          <div key={d.label} style={{ background: "var(--bg-card)", border: "1px solid var(--border-default)", borderRadius: "0.75rem", padding: "0.75rem" }}>
            <div style={{ fontSize: "0.6rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-muted)" }}>{d.label}</div>
            <div style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--text-primary)", marginTop: "0.2rem" }}>{d.value}</div>
          </div>
        ))}
      </div>

      {/* Verbal Summary */}
      {aiData.summary && (
        <div style={{
          background: "rgba(0,188,212,0.06)",
          border: "1px solid rgba(0,188,212,0.2)",
          borderRadius: "0.75rem",
          padding: "0.85rem 1rem",
        }}>
          <div style={{ fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--accent)", fontWeight: 700, marginBottom: "0.4rem" }}>Expert Summary</div>
          <p style={{ fontSize: "0.85rem", lineHeight: 1.6, color: "var(--text-primary)", margin: 0 }}>
            {aiData.summary}
          </p>
        </div>
      )}

      {/* Confidence bar */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.78rem", marginBottom: "0.3rem" }}>
          <span style={{ color: "var(--text-secondary)" }}>Confidence</span>
          <span style={{ fontWeight: 600, color: confPct >= 70 ? "#4caf50" : "#ff9800" }}>{confPct}%</span>
        </div>
        <div style={{ height: 8, borderRadius: 99, background: "var(--ghost-bg)", overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${confPct}%`, borderRadius: 99, background: confPct >= 70 ? "#4caf50" : "#ff9800", transition: "width 0.5s ease" }} />
        </div>
      </div>

      {/* Keywords */}
      {keywords.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem" }}>
          {keywords.slice(0, 10).map((k) => <span key={k} className="badge">{k}</span>)}
        </div>
      )}

      {/* Actions */}
      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
        <button onClick={() => analyze(true)} disabled={analyzing} style={{
          padding: "0.35rem 0.85rem", fontSize: "0.75rem", fontWeight: 600, borderRadius: "0.5rem",
          border: "1px solid var(--accent)", background: "transparent", color: "var(--accent)", cursor: "pointer",
        }}>
          {analyzing ? "Re-analyzing..." : "Run Analysis Again"}
        </button>
        <button onClick={() => setShowJson(!showJson)} style={{
          padding: "0.35rem 0.85rem", fontSize: "0.75rem", fontWeight: 600, borderRadius: "0.5rem",
          border: "1px solid var(--border-default)", background: "transparent", color: "var(--text-muted)", cursor: "pointer",
        }}>
          {showJson ? "Hide JSON" : "View JSON"}
        </button>
      </div>

      {showJson && (
        <pre style={{ background: "var(--bg-card)", borderRadius: "0.75rem", padding: "1rem", overflow: "auto", fontSize: "0.72rem", color: "var(--text-muted)", maxHeight: 300, margin: 0 }}>
          {JSON.stringify(aiData, null, 2)}
        </pre>
      )}
    </div>
  );
}

/* ─── Pricing Panel ─── */
function PricingPanel({ valuation: v, antique, userTier, aiData }: { valuation: any; antique: any; userTier: number; aiData: any }) {
  const [showWhy, setShowWhy] = useState(false);
  const [showAdj, setShowAdj] = useState(false);

  if (!v) {
    return <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", textAlign: "center", padding: "1rem 0" }}>No pricing yet. Analyze to generate an estimate.</p>;
  }

  // Try to parse the extended pricing result from onlineRationale
  let pr: any = null;
  if (v.onlineRationale) {
    try {
      const parsed = JSON.parse(v.onlineRationale);
      // Check if it's the new PricingResult format (has localPrice/nationalPrice/bestMarket)
      if (parsed.localPrice && parsed.nationalPrice && parsed.bestMarket) {
        pr = parsed;
      }
    } catch { /* fallback to legacy display */ }
  }

  // ── NEW: Extended pricing display ─────────────────────────────────────
  if (pr) {
    const isLowValue = (pr.nationalPrice?.high ?? v.high) < 5;
    const isWorthless = (pr.nationalPrice?.high ?? v.high) <= 0;
    const confPctVal = Math.round((pr.confidence ?? v.confidence) * 100);

    // Condition impact badge
    const condScore = aiData?.condition_score ?? null;
    const condBadge = condScore != null
      ? condScore >= 8 ? { label: "Condition adds value", color: "#4caf50", bg: "rgba(76,175,80,0.12)" }
      : condScore >= 6 ? { label: "Fair market value", color: "#00bcd4", bg: "rgba(0,188,212,0.1)" }
      : condScore >= 4 ? { label: "Condition reduces value", color: "#f59e0b", bg: "rgba(245,158,11,0.12)" }
      : condScore >= 2 ? { label: "Significant condition discount", color: "#ef4444", bg: "rgba(239,68,68,0.12)" }
      : { label: "May not be sellable — consider donating", color: "#ef4444", bg: "rgba(239,68,68,0.12)" }
      : null;

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {/* Confidence bar */}
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "0.5rem" }}>
          <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>Confidence: {confPctVal}%</span>
          {isLowValue && (
            <span style={{ padding: "0.1rem 0.5rem", borderRadius: "9999px", fontSize: "0.65rem", fontWeight: 700, background: "rgba(245,158,11,0.15)", color: "#f59e0b" }}>Low Value</span>
          )}
        </div>

        {/* Condition Impact Badge */}
        {condBadge && (
          <div style={{ display: "flex", justifyContent: "center" }}>
            <span style={{ padding: "0.25rem 0.75rem", borderRadius: "9999px", fontSize: "0.72rem", fontWeight: 600, background: condBadge.bg, color: condBadge.color }}>
              {condBadge.label}
            </span>
          </div>
        )}

        {/* Low-value / worthless warnings */}
        {isWorthless && (
          <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-default)", borderRadius: "0.75rem", padding: "1rem" }}>
            <div style={{ fontSize: "0.88rem", fontWeight: 600, color: "var(--text-primary)", marginBottom: "0.5rem" }}>No Resale Value Detected</div>
            <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)", lineHeight: 1.5, marginBottom: "0.5rem" }}>
              We recommend donating this item. Here are some options:
            </p>
            <ul style={{ fontSize: "0.78rem", color: "var(--text-muted)", listStyle: "disc", paddingLeft: "1.25rem", lineHeight: 1.8 }}>
              <li>Goodwill or Salvation Army</li>
              <li>Local shelters and charities</li>
              <li>Facebook Marketplace (list as Free)</li>
              <li>Habitat for Humanity ReStore</li>
            </ul>
          </div>
        )}
        {isLowValue && !isWorthless && (
          <div style={{ background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: "0.75rem", padding: "1rem" }}>
            <div style={{ fontSize: "0.82rem", fontWeight: 600, color: "#f59e0b", marginBottom: "0.35rem" }}>Low Value Item</div>
            <p style={{ fontSize: "0.78rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>
              This item may not be worth the cost of shipping. Consider local pickup or donating.
            </p>
          </div>
        )}

        {/* 3 Price Cards with sellerNet */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.65rem" }}>
          <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-default)", borderRadius: "0.75rem", padding: "0.75rem" }}>
            <div style={{ fontSize: "0.55rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-muted)" }}>Local Pickup</div>
            <div style={{ fontSize: "1rem", fontWeight: 700, color: "var(--accent)", marginTop: "0.2rem" }}>
              ${pr.localPrice.low} – ${pr.localPrice.high}
            </div>
            <div style={{ fontSize: "0.65rem", color: "var(--text-muted)", marginTop: "0.15rem" }}>{pr.localPrice.label}</div>
            {pr.sellerNet && <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "#4caf50", marginTop: "0.35rem" }}>You receive: ${pr.sellerNet.local.toFixed(2)}</div>}
            <div style={{ fontSize: "0.6rem", color: "var(--text-muted)", marginTop: "0.1rem" }}>{pr.commissionPct}% commission</div>
          </div>
          <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-default)", borderRadius: "0.75rem", padding: "0.75rem" }}>
            <div style={{ fontSize: "0.55rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-muted)" }}>National Avg</div>
            <div style={{ fontSize: "1rem", fontWeight: 700, color: "#4caf50", marginTop: "0.2rem" }}>
              ${pr.nationalPrice.low} – ${pr.nationalPrice.high}
            </div>
            <div style={{ fontSize: "0.65rem", color: "var(--text-muted)", marginTop: "0.15rem" }}>{pr.nationalPrice.label}</div>
            {pr.sellerNet && <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "#4caf50", marginTop: "0.35rem" }}>You receive: ${pr.sellerNet.national.toFixed(2)}</div>}
            <div style={{ fontSize: "0.6rem", color: "var(--text-muted)", marginTop: "0.1rem" }}>{pr.commissionPct}% comm + ~${pr.shippingEstimate ?? pr.bestMarket?.shippingCost ?? 0} ship</div>
          </div>
          <div style={{ background: "var(--bg-card)", border: "1px solid rgba(251,191,36,0.2)", borderRadius: "0.75rem", padding: "0.75rem" }}>
            <div style={{ fontSize: "0.55rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "#fbbf24" }}>Best Market</div>
            <div style={{ fontSize: "1rem", fontWeight: 700, color: "#fbbf24", marginTop: "0.2rem" }}>
              ${pr.bestMarket.low} – ${pr.bestMarket.high}
            </div>
            <div style={{ fontSize: "0.65rem", color: "var(--text-muted)", marginTop: "0.15rem" }}>{pr.bestMarket.label}</div>
            {pr.sellerNet && <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "#4caf50", marginTop: "0.35rem" }}>You receive: ${pr.sellerNet.bestMarket.toFixed(2)}</div>}
            <div style={{ fontSize: "0.6rem", color: "var(--text-muted)", marginTop: "0.1rem" }}>{pr.commissionPct}% comm + ~${pr.bestMarket.shippingCost} ship</div>
          </div>
        </div>

        {/* Recommendation banner */}
        {pr.recommendation && (
          <div style={{
            background: "rgba(0,188,212,0.06)", border: "1px solid rgba(0,188,212,0.15)",
            borderRadius: "0.75rem", padding: "0.85rem",
          }}>
            <div style={{ fontSize: "0.6rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--accent)", fontWeight: 700, marginBottom: "0.35rem" }}>Recommendation</div>
            <div style={{ fontSize: "0.82rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>{pr.recommendation}</div>
          </div>
        )}

        {/* Margin Comparison */}
        {pr.marginComparison && (
          <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
            <div style={{ flex: 1, background: "var(--bg-card)", border: "1px solid var(--border-default)", borderRadius: "0.5rem", padding: "0.5rem 0.75rem", textAlign: "center" }}>
              <div style={{ fontSize: "0.55rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-muted)" }}>Local Margin</div>
              <div style={{ fontSize: "1rem", fontWeight: 700, color: "var(--accent)" }}>{pr.marginComparison.localMargin}%</div>
            </div>
            <div style={{ flex: 1, background: "var(--bg-card)", border: "1px solid var(--border-default)", borderRadius: "0.5rem", padding: "0.5rem 0.75rem", textAlign: "center" }}>
              <div style={{ fontSize: "0.55rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-muted)" }}>Shipped Margin</div>
              <div style={{ fontSize: "1rem", fontWeight: 700, color: "#fbbf24" }}>{pr.marginComparison.shippedMargin}%</div>
            </div>
            <div style={{ flex: 2, fontSize: "0.75rem", color: "var(--text-secondary)", fontWeight: 600 }}>
              {pr.marginComparison.bestOption}
            </div>
          </div>
        )}

        {/* How We Calculated This (collapsible) */}
        <button onClick={() => setShowAdj(!showAdj)} style={{
          alignSelf: "flex-start", padding: "0.3rem 0.75rem", fontSize: "0.75rem", fontWeight: 600,
          borderRadius: "0.4rem", border: "1px solid var(--border-default)", background: "transparent", color: "var(--text-muted)", cursor: "pointer",
        }}>
          {showAdj ? "Hide calculation details" : "How We Calculated This"}
        </button>
        {showAdj && (
          <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-default)", borderRadius: "0.75rem", padding: "0.75rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {/* Base price */}
            {pr.aiEstimate && (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: "0.5rem", borderBottom: "1px solid var(--border-default)" }}>
                <div>
                  <span style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--text-primary)" }}>AI Base Estimate</span>
                  <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginLeft: "0.5rem" }}>${pr.aiEstimate.low} – ${pr.aiEstimate.high}</span>
                </div>
                <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--text-primary)" }}>Base</span>
              </div>
            )}
            {/* Adjustments chain */}
            {pr.adjustments && pr.adjustments.map((adj: any, i: number) => {
              const pct = Math.round((adj.factor - 1) * 100);
              const sign = pct >= 0 ? "+" : "";
              const color = pct >= 0 ? "#4caf50" : pct > -15 ? "#f59e0b" : "#ef4444";
              return (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <span style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--text-primary)" }}>{adj.name}</span>
                    <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginLeft: "0.5rem" }}>{adj.reason}</span>
                  </div>
                  <span style={{ fontSize: "0.82rem", fontWeight: 700, color, minWidth: "3rem", textAlign: "right" }}>{sign}{pct}%</span>
                </div>
              );
            })}
            {/* Final adjusted price */}
            {pr.basePrice && (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "0.5rem", borderTop: "1px solid var(--border-default)" }}>
                <span style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--text-primary)" }}>Adjusted Base</span>
                <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--accent)" }}>${pr.basePrice.low} – ${pr.basePrice.high}</span>
              </div>
            )}
          </div>
        )}

        {/* Dual Earnings */}
        <div style={{
          background: "linear-gradient(135deg, rgba(0,188,212,0.08), rgba(76,175,80,0.08))",
          border: "1px solid rgba(0,188,212,0.2)",
          borderRadius: "0.75rem",
          padding: "0.85rem",
          display: "flex", flexDirection: "column", gap: "0.65rem",
        }}>
          <div style={{ fontSize: "0.6rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--accent)", fontWeight: 700 }}>
            Your Earnings Estimate
          </div>

          {/* Local earnings */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)" }}>
              If sold locally at <strong style={{ color: "var(--text-primary)" }}>${pr.localEarnings.salePrice}</strong>
            </div>
            <div style={{ textAlign: "right" }}>
              <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>Commission {pr.commissionPct}% -${pr.localEarnings.commission.toFixed(2)} → </span>
              <span style={{ fontSize: "1rem", fontWeight: 800, color: "#4caf50" }}>${pr.localEarnings.net.toFixed(2)}</span>
            </div>
          </div>

          {/* Shipped earnings */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)" }}>
              If shipped to <strong style={{ color: "var(--text-primary)" }}>{pr.shippedEarnings.city}</strong> at <strong style={{ color: "var(--text-primary)" }}>${pr.shippedEarnings.salePrice}</strong>
            </div>
            <div style={{ textAlign: "right" }}>
              <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>Ship ~${pr.shippedEarnings.shipping}, Comm -${pr.shippedEarnings.commission.toFixed(2)} → </span>
              <span style={{ fontSize: "1rem", fontWeight: 800, color: pr.shippedEarnings.net > pr.localEarnings.net ? "#fbbf24" : "#4caf50" }}>${pr.shippedEarnings.net.toFixed(2)}</span>
            </div>
          </div>

          <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", display: "flex", justifyContent: "space-between" }}>
            <span>Tier {userTier} · {pr.commissionPct}% commission · {PROCESSING_FEE.display} processing fee (split: {PROCESSING_FEE.sellerDisplay} seller + {PROCESSING_FEE.buyerDisplay} buyer)</span>
            <a href="/pricing" style={{ color: "var(--accent)", textDecoration: "none", fontWeight: 600 }}>Upgrade tier →</a>
          </div>
        </div>

        {/* Rationale toggle */}
        {v.rationale && (
          <>
            <button onClick={() => setShowWhy(!showWhy)} style={{
              alignSelf: "flex-start", padding: "0.3rem 0.75rem", fontSize: "0.75rem", fontWeight: 600,
              borderRadius: "0.4rem", border: "1px solid var(--border-default)", background: "transparent", color: "var(--text-muted)", cursor: "pointer",
            }}>
              {showWhy ? "Hide rationale" : "Why this price?"}
            </button>
            {showWhy && (
              <div style={{ background: "rgba(76,175,80,0.08)", border: "1px solid rgba(76,175,80,0.2)", borderRadius: "0.75rem", padding: "0.85rem", fontSize: "0.85rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>
                {v.rationale}
              </div>
            )}
          </>
        )}

        {/* Recommendations */}
        {pr.recommendations && pr.recommendations.length > 0 && (
          <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-default)", borderRadius: "0.75rem", padding: "0.85rem" }}>
            <div style={{ fontSize: "0.6rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-muted)", fontWeight: 700, marginBottom: "0.5rem" }}>Recommendations</div>
            <ul style={{ fontSize: "0.78rem", color: "var(--text-secondary)", listStyle: "disc", paddingLeft: "1.25rem", lineHeight: 1.8, margin: 0 }}>
              {pr.recommendations.map((r: string, i: number) => <li key={i}>{r}</li>)}
            </ul>
          </div>
        )}

        {/* Auction estimate for antiques */}
        {antique?.isAntique && antique.auctionLow != null && (
          <div style={{ background: "linear-gradient(135deg, rgba(255,248,230,0.1), rgba(255,243,214,0.1))", border: "1px solid rgba(251,191,36,0.3)", borderRadius: "0.75rem", padding: "0.85rem" }}>
            <div style={{ fontSize: "0.6rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "#fbbf24", fontWeight: 700 }}>Auction Estimate</div>
            <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "#fbbf24", marginTop: "0.2rem" }}>${antique.auctionLow.toLocaleString()} – ${antique.auctionHigh.toLocaleString()}</div>
          </div>
        )}
      </div>
    );
  }

  // ── LEGACY: Fallback display when onlineRationale doesn't parse ────────
  const midPrice = Math.round((v.low + v.high) / 2);
  const commPct = getCommissionPct(userTier);
  const commission = Math.round(midPrice * commPct) / 100;
  const netEarnings = Math.round((midPrice - commission) * 100) / 100;
  const isLowValue = v.high < 5;
  const isWorthless = v.high <= 0;

  const condScore = aiData?.condition_score ?? null;
  const condBadge = condScore != null
    ? condScore >= 8 ? { label: "Condition adds value", color: "#4caf50", bg: "rgba(76,175,80,0.12)" }
    : condScore >= 6 ? { label: "Fair market value", color: "#00bcd4", bg: "rgba(0,188,212,0.1)" }
    : condScore >= 4 ? { label: "Condition reduces value", color: "#f59e0b", bg: "rgba(245,158,11,0.12)" }
    : condScore >= 2 ? { label: "Significant condition discount", color: "#ef4444", bg: "rgba(239,68,68,0.12)" }
    : { label: "May not be sellable — consider donating", color: "#ef4444", bg: "rgba(239,68,68,0.12)" }
    : null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      {/* Main range */}
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: "2rem", fontWeight: 800, color: isLowValue ? "#f59e0b" : "var(--accent)" }}>${Math.round(v.low)} – ${Math.round(v.high)}</div>
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "0.5rem", marginTop: "0.25rem" }}>
          <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>Confidence: {Math.round(v.confidence * 100)}%</span>
          {isLowValue && (
            <span style={{ padding: "0.1rem 0.5rem", borderRadius: "9999px", fontSize: "0.65rem", fontWeight: 700, background: "rgba(245,158,11,0.15)", color: "#f59e0b" }}>Low Value</span>
          )}
        </div>
      </div>

      {condBadge && (
        <div style={{ display: "flex", justifyContent: "center" }}>
          <span style={{ padding: "0.25rem 0.75rem", borderRadius: "9999px", fontSize: "0.72rem", fontWeight: 600, background: condBadge.bg, color: condBadge.color }}>
            {condBadge.label}
          </span>
        </div>
      )}

      {isWorthless && (
        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-default)", borderRadius: "0.75rem", padding: "1rem" }}>
          <div style={{ fontSize: "0.88rem", fontWeight: 600, color: "var(--text-primary)", marginBottom: "0.5rem" }}>No Resale Value Detected</div>
          <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)", lineHeight: 1.5, marginBottom: "0.5rem" }}>
            We recommend donating this item.
          </p>
        </div>
      )}

      {/* Earnings Estimate */}
      <div style={{
        background: "linear-gradient(135deg, rgba(0,188,212,0.08), rgba(76,175,80,0.08))",
        border: "1px solid rgba(0,188,212,0.2)",
        borderRadius: "0.75rem",
        padding: "0.85rem",
      }}>
        <div style={{ fontSize: "0.6rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--accent)", fontWeight: 700, marginBottom: "0.5rem" }}>
          Your Earnings Estimate
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <div>
            <span style={{ fontSize: "0.78rem", color: "var(--text-secondary)" }}>If this sells for </span>
            <span style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--text-primary)" }}>${midPrice}</span>
          </div>
          <div style={{ textAlign: "right" }}>
            <span style={{ fontSize: "0.78rem", color: "var(--text-secondary)" }}>You receive </span>
            <span style={{ fontSize: "1.1rem", fontWeight: 800, color: "#4caf50" }}>${netEarnings.toFixed(2)}</span>
          </div>
        </div>
        <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "0.4rem", display: "flex", justifyContent: "space-between" }}>
          <span>After {commPct}% commission (Tier {userTier})</span>
          <a href="/pricing" style={{ color: "var(--accent)", textDecoration: "none", fontWeight: 600 }}>Upgrade tier →</a>
        </div>
      </div>

      {/* Local vs Online */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-default)", borderRadius: "0.75rem", padding: "0.85rem" }}>
          <div style={{ fontSize: "0.6rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-muted)" }}>Local Pickup</div>
          <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--accent)", marginTop: "0.2rem" }}>
            {v.localLow != null ? `$${Math.round(v.localLow)} – $${Math.round(v.localHigh)}` : "—"}
          </div>
        </div>
        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-default)", borderRadius: "0.75rem", padding: "0.85rem" }}>
          <div style={{ fontSize: "0.6rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-muted)" }}>Online / National</div>
          <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "#4caf50", marginTop: "0.2rem" }}>
            {v.onlineLow != null ? `$${Math.round(v.onlineLow)} – $${Math.round(v.onlineHigh)}` : "—"}
          </div>
        </div>
      </div>

      {v.rationale && (
        <>
          <button onClick={() => setShowWhy(!showWhy)} style={{
            alignSelf: "flex-start", padding: "0.3rem 0.75rem", fontSize: "0.75rem", fontWeight: 600,
            borderRadius: "0.4rem", border: "1px solid var(--border-default)", background: "transparent", color: "var(--text-muted)", cursor: "pointer",
          }}>
            {showWhy ? "Hide rationale" : "Why this price?"}
          </button>
          {showWhy && (
            <div style={{ background: "rgba(76,175,80,0.08)", border: "1px solid rgba(76,175,80,0.2)", borderRadius: "0.75rem", padding: "0.85rem", fontSize: "0.85rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>
              {v.rationale}
            </div>
          )}
        </>
      )}

      {antique?.isAntique && antique.auctionLow != null && (
        <div style={{ background: "linear-gradient(135deg, rgba(255,248,230,0.1), rgba(255,243,214,0.1))", border: "1px solid rgba(251,191,36,0.3)", borderRadius: "0.75rem", padding: "0.85rem" }}>
          <div style={{ fontSize: "0.6rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "#fbbf24", fontWeight: 700 }}>Auction Estimate</div>
          <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "#fbbf24", marginTop: "0.2rem" }}>${antique.auctionLow.toLocaleString()} – ${antique.auctionHigh.toLocaleString()}</div>
        </div>
      )}
    </div>
  );
}

/* ─── Shipping Panel ─── */
function ShippingPanel({ itemId, hasAnalysis }: { itemId: string; hasAnalysis: boolean }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [destZip, setDestZip] = useState("");

  async function estimate(zip?: string) {
    setLoading(true);
    try {
      const res = await fetch("/api/shipping/estimate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ itemId, destZip: zip || destZip || undefined }) });
      const json = await res.json();
      if (!json.error) setData(json);
    } catch { /* ignore */ }
    setLoading(false);
  }

  // Auto-populate shipping when analysis exists
  useEffect(() => {
    if (hasAnalysis && !data && !loading) {
      estimate();
    }
  }, [hasAnalysis]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!data) {
    return (
      <div style={{ textAlign: "center", padding: "1rem 0" }}>
        <button onClick={() => estimate()} disabled={loading} className="btn-primary" style={{ padding: "0.5rem 1.5rem", fontSize: "0.85rem" }}>
          {loading ? "Calculating Rates..." : "Get Shipping Estimate"}
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
      {/* Destination ZIP input */}
      <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
        <label style={{ fontSize: "0.75rem", color: "var(--text-muted)", whiteSpace: "nowrap" }}>Ship to ZIP:</label>
        <input
          type="text"
          maxLength={5}
          placeholder="10001"
          value={destZip}
          onChange={(e) => setDestZip(e.target.value.replace(/\D/g, "").slice(0, 5))}
          style={{ width: "5.5rem", padding: "0.3rem 0.6rem", fontSize: "0.82rem", borderRadius: "0.4rem", border: "1px solid var(--border-default)", background: "var(--ghost-bg)", color: "var(--text-primary)" }}
        />
        <button
          onClick={() => destZip.length >= 3 && estimate(destZip)}
          disabled={loading || destZip.length < 3}
          style={{
            padding: "0.3rem 0.75rem", fontSize: "0.75rem", fontWeight: 600, borderRadius: "0.4rem",
            border: "1px solid var(--accent)", background: "transparent", color: "var(--accent)",
            cursor: destZip.length < 3 ? "not-allowed" : "pointer", opacity: destZip.length < 3 ? 0.5 : 1,
          }}
        >
          {loading ? "..." : "Update Rates"}
        </button>
        {data.isLiveRates && (
          <span style={{ padding: "0.15rem 0.5rem", borderRadius: "9999px", background: "rgba(76,175,80,0.12)", color: "#4caf50", fontSize: "0.6rem", fontWeight: 700 }}>LIVE RATES</span>
        )}
      </div>

      {data.isLTL && (
        <div style={{ padding: "0.65rem 0.85rem", borderRadius: "0.65rem", background: "rgba(156,39,176,0.1)", border: "1px solid rgba(156,39,176,0.25)", fontSize: "0.82rem", color: "#ce93d8", fontWeight: 600 }}>
          🚛 LTL Freight — this item requires freight shipping
        </div>
      )}
      <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
        <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>Weight: <strong style={{ color: "var(--text-primary)" }}>{data.weight} lbs</strong></div>
        <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>Box: <strong style={{ color: "var(--text-primary)" }}>{data.box.label}</strong></div>
        {data.isFragile && <span style={{ padding: "0.15rem 0.5rem", borderRadius: "9999px", background: "rgba(239,83,80,0.15)", color: "#ef5350", fontSize: "0.7rem", fontWeight: 600 }}>Fragile</span>}
        <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>From: <strong style={{ color: "var(--text-primary)" }}>{data.fromZip}</strong> → <strong style={{ color: "var(--text-primary)" }}>{data.toZip || "10001"}</strong></div>
      </div>
      {data.carriers
        .filter((c: any) => c.price > 0)
        .reduce((acc: any[], c: any) => {
          const existing = acc.find((a: any) => a.carrier === c.carrier && a.service === c.service);
          if (!existing || c.price < existing.price) {
            return [...acc.filter((a: any) => !(a.carrier === c.carrier && a.service === c.service)), c];
          }
          return acc;
        }, [])
        .sort((a: any, b: any) => a.price - b.price)
        .map((c: any, index: number) => (
        <div key={`${c.carrier}-${c.service}-${index}`} style={{
          display: "flex", justifyContent: "space-between", padding: "0.6rem 0.85rem", borderRadius: "0.65rem",
          border: "1px solid var(--border-default)", background: "var(--bg-card)",
        }}>
          <div>
            <span style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--text-primary)" }}>{c.carrier}</span>
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginLeft: "0.5rem" }}>{c.service} · {c.days} days</span>
          </div>
          <span style={{ fontWeight: 700, color: "var(--accent)", fontSize: "0.88rem" }}>${c.price.toFixed(2)}</span>
        </div>
      ))}
    </div>
  );
}

/* ─── Listing Panel ─── */
function ListingPanel({ itemId, hasAnalysis }: { itemId: string; hasAnalysis: boolean }) {
  const [listing, setListing] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  async function generate() {
    setLoading(true);
    try {
      const res = await fetch("/api/listing/generate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ itemId }) });
      const json = await res.json();
      if (json.listing) setListing(json.listing);
    } catch { /* ignore */ }
    setLoading(false);
  }

  function copy(text: string, label: string) {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  }

  if (!listing) {
    return (
      <div style={{ textAlign: "center", padding: "1rem 0" }}>
        <button onClick={generate} disabled={loading || !hasAnalysis} className="btn-primary" style={{ padding: "0.5rem 1.5rem", fontSize: "0.85rem" }}>
          {loading ? "Writing Listing..." : "Generate Listing Text"}
        </button>
        {!hasAnalysis && <p style={{ color: "var(--text-muted)", fontSize: "0.78rem", marginTop: "0.5rem" }}>Run AI analysis first</p>}
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
        <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>Readiness:</div>
        <div style={{ flex: 1, height: 6, borderRadius: 99, background: "var(--ghost-bg)", overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${listing.readinessScore}%`, borderRadius: 99, background: listing.readinessScore >= 80 ? "#4caf50" : "#ff9800" }} />
        </div>
        <span style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--text-primary)" }}>{listing.readinessScore}%</span>
      </div>
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.3rem" }}>
          <span style={{ fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-muted)" }}>Title</span>
          <button onClick={() => copy(listing.title, "title")} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "0.7rem", color: copied === "title" ? "#4caf50" : "var(--accent)" }}>{copied === "title" ? "Copied!" : "Copy"}</button>
        </div>
        <p style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--text-primary)" }}>{listing.title}</p>
      </div>
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.3rem" }}>
          <span style={{ fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-muted)" }}>Description</span>
          <button onClick={() => copy(listing.description, "desc")} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "0.7rem", color: copied === "desc" ? "#4caf50" : "var(--accent)" }}>{copied === "desc" ? "Copied!" : "Copy"}</button>
        </div>
        <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>{listing.description}</p>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.3rem" }}>
        {listing.tags.map((t: string) => <span key={t} className="badge">{t}</span>)}
      </div>
    </div>
  );
}

/* ─── Photo Management Panel ─── */
function PhotoPanel({ photos, itemId }: { photos: Props["photos"]; itemId: string }) {
  const router = useRouter();
  const [photoList, setPhotoList] = useState(photos);
  const [uploading, setUploading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files?.length) return;
    setUploading(true);
    const form = new FormData();
    Array.from(files).forEach((f) => form.append("photos", f));
    try {
      const res = await fetch(`/api/items/photos/${itemId}`, { method: "POST", body: form });
      if (res.ok) refreshKeepScroll(router);
    } catch { /* ignore */ }
    setUploading(false);
  }

  async function setPrimary(photoId: string) {
    await fetch(`/api/items/photos/${itemId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ setPrimary: true, photoId }),
    });
    setPhotoList((prev) => prev.map((p) => ({ ...p, isPrimary: p.id === photoId })));
  }

  async function deletePhoto(photoId: string) {
    if (photoList.length <= 1) return;
    const photo = photoList.find((p) => p.id === photoId);
    await fetch(`/api/items/photos/${itemId}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ photoId }),
    });
    const remaining = photoList.filter((p) => p.id !== photoId);
    // Auto-promote next photo if we deleted the primary
    if (photo?.isPrimary && remaining.length > 0 && !remaining.some((p) => p.isPrimary)) {
      remaining[0].isPrimary = true;
      await fetch(`/api/items/photos/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ setPrimary: true, photoId: remaining[0].id }),
      });
    }
    setPhotoList(remaining);
    setConfirmDelete(null);
  }

  const atMax = photoList.length >= 10;

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))", gap: "0.65rem", marginBottom: "1rem" }}>
        {photoList.map((p) => (
          <div key={p.id} style={{ position: "relative", borderRadius: "0.65rem", overflow: "hidden", aspectRatio: "1", border: p.isPrimary ? "2px solid var(--accent)" : "1px solid var(--border-default)" }}>
            <img src={p.filePath} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            {p.isPrimary && <div style={{ position: "absolute", top: 4, left: 4, padding: "0.1rem 0.4rem", borderRadius: "0.25rem", background: "var(--accent)", color: "#000", fontSize: "0.55rem", fontWeight: 700 }}>Main Photo</div>}
            <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, display: "flex", gap: "2px", background: "rgba(0,0,0,0.7)", padding: "3px" }}>
              {!p.isPrimary && (
                <button onClick={() => setPrimary(p.id)} style={{ flex: 1, background: "none", border: "none", color: "#4caf50", fontSize: "0.6rem", cursor: "pointer", padding: "2px" }}>Set as Main</button>
              )}
              <button
                onClick={() => {
                  if (photoList.length <= 1) return;
                  setConfirmDelete(p.id);
                }}
                style={{ flex: 1, background: "none", border: "none", color: photoList.length <= 1 ? "#666" : "#ef5350", fontSize: "0.6rem", cursor: photoList.length <= 1 ? "not-allowed" : "pointer", padding: "2px" }}
                disabled={photoList.length <= 1}
                title={photoList.length <= 1 ? "Items must have at least 1 photo" : "Remove this photo"}
              >
                Remove
              </button>
            </div>

            {/* Delete confirmation overlay */}
            {confirmDelete === p.id && (
              <div style={{
                position: "absolute", inset: 0, background: "rgba(0,0,0,0.85)", display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center", gap: "0.5rem", padding: "0.5rem",
              }}>
                <span style={{ fontSize: "0.65rem", color: "#fff", textAlign: "center", lineHeight: 1.3 }}>Remove this photo? This cannot be undone.</span>
                <div style={{ display: "flex", gap: "0.35rem" }}>
                  <button onClick={() => deletePhoto(p.id)} style={{ padding: "0.2rem 0.6rem", borderRadius: "0.35rem", background: "#ef4444", color: "#fff", border: "none", fontSize: "0.6rem", fontWeight: 600, cursor: "pointer" }}>Remove</button>
                  <button onClick={() => setConfirmDelete(null)} style={{ padding: "0.2rem 0.6rem", borderRadius: "0.35rem", background: "var(--bg-card-hover)", color: "#fff", border: "none", fontSize: "0.6rem", fontWeight: 600, cursor: "pointer" }}>Cancel</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      <label style={{
        display: "inline-flex", alignItems: "center", gap: "0.5rem", padding: "0.4rem 1rem", fontSize: "0.82rem", fontWeight: 600,
        borderRadius: "0.5rem",
        border: atMax ? "1px solid var(--border-default)" : "1px solid var(--accent)",
        background: "transparent",
        color: atMax ? "var(--text-muted)" : "var(--accent)",
        cursor: atMax ? "not-allowed" : "pointer",
        opacity: atMax ? 0.6 : 1,
      }}>
        {uploading ? "Uploading..." : atMax ? "Maximum photos reached (10/10)" : `Add Photos (${photoList.length}/10)`}
        <input type="file" accept="image/*,.heic,.heif" multiple onChange={handleUpload} style={{ display: "none" }} disabled={uploading || atMax} />
      </label>
      {photoList.length <= 1 && (
        <p style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "0.35rem" }}>Items must have at least 1 photo.</p>
      )}
    </div>
  );
}

/* ─── Potential Buyers Panel ─── */
function PotentialBuyersPanel({ aiData, itemId }: { aiData: any; itemId: string }) {
  if (!aiData) {
    return (
      <div style={{ textAlign: "center", padding: "1rem 0" }}>
        <p style={{ color: "var(--text-muted)", fontSize: "0.82rem" }}>Run AI analysis first to find potential buyers.</p>
      </div>
    );
  }

  const name = aiData.item_name || "this item";
  const cat = aiData.category || "General";
  const isAntique = aiData.is_antique || false;

  // Generate context-aware demo buyers
  const buyers = [
    {
      name: isAntique ? "NE_Antiques_Co" : "Sarah M.",
      platform: isAntique ? "eBay" : "Facebook Marketplace",
      matchScore: isAntique ? 94 : 91,
      distance: isAntique ? "Boston, MA" : "12 mi away",
      interest: `Looking for ${cat.toLowerCase()} items${isAntique ? " for collection" : ""}`,
      active: "2h ago",
    },
    {
      name: isAntique ? "CollectorJim" : "VintageHome207",
      platform: isAntique ? "Instagram" : "Nextdoor",
      matchScore: isAntique ? 88 : 85,
      distance: isAntique ? "Portland, ME" : "Waterville, ME",
      interest: `Interested in ${name}`,
      active: "5h ago",
    },
    {
      name: "MainePicker_Steve",
      platform: "Facebook Groups",
      matchScore: 78,
      distance: "Augusta, ME",
      interest: `Searching for ${cat.toLowerCase()} in Central Maine`,
      active: "1d ago",
    },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.65rem" }}>
      {buyers.map((b) => (
        <div key={b.name} style={{
          display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.75rem 0.85rem",
          borderRadius: "0.75rem", border: "1px solid var(--border-default)", background: "var(--bg-card)",
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: "50%", flexShrink: 0,
            background: `linear-gradient(135deg, rgba(0,188,212,${b.matchScore / 200}), rgba(76,175,80,${b.matchScore / 200}))`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "0.75rem", fontWeight: 700, color: "#fff",
          }}>
            {b.matchScore}%
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <span style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--text-primary)" }}>{b.name}</span>
              <span style={{ fontSize: "0.62rem", color: "var(--text-muted)", padding: "0.1rem 0.35rem", borderRadius: "9999px", background: "var(--ghost-bg)" }}>{b.platform}</span>
            </div>
            <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{b.interest}</div>
          </div>
          <div style={{ textAlign: "right", flexShrink: 0 }}>
            <div style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>{b.distance}</div>
            <div style={{ fontSize: "0.6rem", color: "var(--text-muted)" }}>{b.active}</div>
          </div>
        </div>
      ))}
      <a href={`/bots/buyerbot?item=${itemId}`} style={{
        display: "block", textAlign: "center", padding: "0.5rem",
        fontSize: "0.78rem", fontWeight: 600, color: "var(--accent)",
        textDecoration: "none",
      }}>
        View all buyers in BuyerBot →
      </a>
    </div>
  );
}

/* ─── Bot Summary Panel ─── */
function BotSummaryPanel({ aiData, valuation, antique, photos, megabotUsed, itemId, category }: { aiData: any; valuation: any; antique: any; photos: any[]; megabotUsed: boolean; itemId: string; category: string }) {
  // CMD-ANALYZEBOT-BUG-FIX: removed "tractor", added outdoor equipment exclusion
  const VEHICLE_KEYWORDS = ["car", "truck", "vehicle", "automobile", "suv", "van", "motorcycle", "atv", "boat", "trailer", "rv", "camper"];
  const isOutdoorEquipment = (category || "").toLowerCase().includes("outdoor") || (category || "").toLowerCase().includes("garden") || /riding\s*mow|lawn\s*mow|garden\s*tract|lawn\s*tract|chainsaw|leaf\s*blow|snow\s*blow/i.test((aiData?.subcategory || "") + " " + (aiData?.item_name || ""));
  const isVehicle = !isOutdoorEquipment && VEHICLE_KEYWORDS.some((kw) => (category || "").toLowerCase().includes(kw));
  const isAntique = antique?.isAntique === true;

  const bots: { name: string; icon: string; status: string; finding: string; link: string; highlight?: boolean }[] = [
    { name: "AnalyzeBot", icon: "🧠", status: aiData ? "Complete" : "Not run", finding: aiData ? `${aiData.item_name || "Identified"} — ${Math.round((aiData.confidence || 0) * 100)}% confident` : "—", link: `/bots/analyzebot?item=${itemId}` },
    { name: "PriceBot", icon: "💰", status: valuation ? "Complete" : "Not run", finding: valuation ? `$${Math.round(valuation.low)} – $${Math.round(valuation.high)}` : "—", link: `/bots/pricebot?item=${itemId}` },
    { name: "ListBot", icon: "📝", status: aiData ? "Ready" : "Waiting", finding: aiData ? "Ready to generate listing" : "Needs analysis first", link: `/bots/listbot?item=${itemId}` },
    { name: "BuyerBot", icon: "🎯", status: aiData ? "Ready" : "Waiting", finding: aiData ? "Ready to scan for buyers" : "Analyze item first", link: `/bots/buyerbot?item=${itemId}` },
    { name: "Shipping Center", icon: "📦", status: aiData ? "Ready" : "Waiting", finding: aiData ? "Shipping estimates available" : "Analyze item first", link: `/bots/shipbot?item=${itemId}` },
    { name: "PhotoBot", icon: "📷", status: photos.length > 0 ? "Ready" : "No photos", finding: `${photos.length} photo${photos.length !== 1 ? "s" : ""} uploaded`, link: `/bots/photobot?item=${itemId}` },
    { name: "MegaBot", icon: "🤖", status: megabotUsed ? "Used" : "Available", finding: megabotUsed ? "Multi-agent analysis complete" : "Run MegaBot on any bot", link: `/bots/megabot?item=${itemId}` },
  ];

  // Add CarBot if vehicle detected
  if (isVehicle) {
    bots.push({
      name: "CarBot",
      icon: "🚗",
      status: "Active",
      finding: `Vehicle detected — specialized pricing available`,
      link: `/bots/carbot?item=${itemId}`,
      highlight: true,
    });
  }

  // Add Antique Evaluation if antique detected
  if (isAntique) {
    bots.push({
      name: "Antique Evaluation",
      icon: "🏛️",
      status: "Active",
      finding: antique.auctionLow != null ? `Auction est. $${antique.auctionLow.toLocaleString()} – $${antique.auctionHigh.toLocaleString()}` : "Antique indicators detected",
      link: `/bots/megabot?item=${itemId}&mode=antique`,
      highlight: true,
    });
  }

  const completed = bots.filter((b) => b.status === "Complete" || b.status === "Active").length;
  const readiness = Math.round((completed / bots.length) * 100);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.25rem" }}>
        <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>Item Readiness:</span>
        <div style={{ flex: 1, height: 6, borderRadius: 99, background: "var(--ghost-bg)", overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${readiness}%`, borderRadius: 99, background: readiness >= 60 ? "#4caf50" : "#ff9800" }} />
        </div>
        <span style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--text-primary)" }}>{readiness}%</span>
      </div>
      {bots.map((b) => (
        <a key={b.name} href={b.link} style={{
          display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.65rem 0.85rem",
          borderRadius: "0.65rem",
          border: b.highlight ? "1.5px solid rgba(251,191,36,0.4)" : "1px solid var(--border-default)",
          background: b.highlight ? "rgba(251,191,36,0.06)" : "var(--bg-card)",
          textDecoration: "none", color: "inherit", transition: "border-color 0.15s ease",
        }}>
          <span style={{ fontSize: "1.2rem" }}>{b.icon}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--text-primary)" }}>{b.name}</div>
            <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{b.finding}</div>
          </div>
          <span style={{
            padding: "0.15rem 0.5rem", borderRadius: "9999px", fontSize: "0.6rem", fontWeight: 600,
            background: b.status === "Complete" || b.status === "Used" ? "rgba(76,175,80,0.15)" : b.status === "Active" ? "rgba(251,191,36,0.15)" : b.status === "Ready" || b.status === "Available" ? "rgba(0,188,212,0.1)" : "var(--ghost-bg)",
            color: b.status === "Complete" || b.status === "Used" ? "#4caf50" : b.status === "Active" ? "#fbbf24" : b.status === "Ready" || b.status === "Available" ? "var(--accent)" : "var(--text-muted)",
          }}>
            {b.status}
          </span>
        </a>
      ))}
    </div>
  );
}

/* ─── Main ItemToolPanels ─── */
export default function ItemToolPanels({ itemId, aiData, valuation, antique, comps, photos, status, category, saleZip, megabotUsed, userTier }: Props) {
  const confPct = aiData ? Math.round(Math.min(100, (aiData.confidence || 0) * 100)) : null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
      <CollapsiblePanel
        title="AI Item Analysis"
        subtitle="What our AI found about your item"
        icon="🧠"
        preview={aiData ? `${aiData.item_name || "Identified"} · ${confPct}% confident` : "Not analyzed"}
        defaultOpen={!aiData}
      >
        <AiPanel aiData={aiData} itemId={itemId} status={status} />
      </CollapsiblePanel>

      <CollapsiblePanel
        title="Price Estimate"
        subtitle="How much your item is worth"
        icon="💰"
        preview={valuation ? `$${Math.round(valuation.low)} – $${Math.round(valuation.high)} · ${Math.round(valuation.confidence * 100)}%` : "No pricing"}
        defaultOpen={false}
      >
        <PricingPanel valuation={valuation} antique={antique} userTier={userTier} aiData={aiData} />
      </CollapsiblePanel>

      <CollapsiblePanel
        title="Shipping Center"
        subtitle="Carrier rates, packaging, and shipping estimates"
        icon="📦"
        preview="Get carrier rates and box recommendations"
        defaultOpen={false}
      >
        <ShippingPanel itemId={itemId} hasAnalysis={!!aiData} />
      </CollapsiblePanel>

      <CollapsiblePanel
        title="Potential Buyers"
        subtitle="Top matching buyers found by BuyerBot"
        icon="🎯"
        preview={aiData ? "3 matches found" : "Needs analysis"}
        defaultOpen={false}
      >
        <PotentialBuyersPanel aiData={aiData} itemId={itemId} />
      </CollapsiblePanel>

      <CollapsiblePanel
        title="Listing Helper"
        subtitle="Create an optimized listing to sell faster"
        icon="📝"
        preview={aiData ? "Ready to generate" : "Needs analysis first"}
        defaultOpen={false}
      >
        <ListingPanel itemId={itemId} hasAnalysis={!!aiData} />
      </CollapsiblePanel>

      <CollapsiblePanel
        title="Your Photos"
        subtitle="Add, remove, or rearrange item photos"
        icon="📸"
        preview={`${photos.length} photo${photos.length !== 1 ? "s" : ""}`}
        defaultOpen={false}
      >
        <PhotoPanel photos={photos} itemId={itemId} />
      </CollapsiblePanel>

      <CollapsiblePanel
        title="Bot Summary"
        subtitle="All specialist bots and their findings"
        icon="🤖"
        preview={`${[aiData, valuation].filter(Boolean).length + (antique?.isAntique ? 1 : 0)} bots active`}
        defaultOpen={false}
      >
        <BotSummaryPanel aiData={aiData} valuation={valuation} antique={antique} photos={photos} megabotUsed={megabotUsed} itemId={itemId} category={category} />
      </CollapsiblePanel>
    </div>
  );
}
