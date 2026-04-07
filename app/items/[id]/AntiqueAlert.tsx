"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  reason: string;
  auctionLow: number | null;
  auctionHigh: number | null;
  itemId: string;
};

function parseReasonMeta(reason: string): { text: string; markers: string[] } {
  try {
    const parsed = JSON.parse(reason);
    if (parsed.reason && Array.isArray(parsed.markers)) {
      return { text: parsed.reason, markers: parsed.markers };
    }
  } catch { /* not JSON, use as-is */ }
  return { text: reason, markers: [] };
}

export default function AntiqueAlert({ reason, auctionLow, auctionHigh, itemId }: Props) {
  const router = useRouter();
  const [visible, setVisible] = useState(false);
  const [quickScanLoading, setQuickScanLoading] = useState(false);
  const [megaBotLoading, setMegaBotLoading] = useState(false);
  const [quickScanResult, setQuickScanResult] = useState<any>(null);
  const [megaBotSuccess, setMegaBotSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { text: reasonText, markers } = parseReasonMeta(reason);

  // Check for existing AntiqueBot result on mount
  useEffect(() => {
    fetch(`/api/bots/antiquebot/${itemId}`)
      .then((r) => r.json())
      .then((d) => { if (d.hasResult) setQuickScanResult(d.result); })
      .catch(() => {});
  }, [itemId]);

  const handleQuickScan = async () => {
    setQuickScanLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/bots/antiquebot/${itemId}`, { method: "POST" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: "AntiqueBot scan failed" }));
        throw new Error(data.error || `AntiqueBot scan failed (${res.status})`);
      }
      const data = await res.json();
      setQuickScanResult(data.result);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "AntiqueBot scan failed");
    } finally {
      setQuickScanLoading(false);
    }
  };

  const handleMegaBotAnalysis = async () => {
    setMegaBotLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/megabot/${itemId}`, { method: "POST" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: "MegaBot analysis failed" }));
        throw new Error(data.error || `MegaBot analysis failed (${res.status})`);
      }
      setMegaBotSuccess(true);
      setTimeout(() => {
        const scrollY = window.scrollY;
        router.refresh();
        requestAnimationFrame(() => window.scrollTo(0, scrollY));
      }, 2500);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "MegaBot analysis failed");
    } finally {
      setMegaBotLoading(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 80);
    return () => clearTimeout(t);
  }, []);

  const hasResult = !!quickScanResult;
  const auth = quickScanResult?.authentication;
  const val = quickScanResult?.valuation;
  const verdictColor = auth?.verdict === "Authentic" || auth?.verdict === "Likely Authentic"
    ? "#16a34a" : auth?.verdict === "Uncertain" ? "#d97706" : "#dc2626";

  return (
    <div
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0) scale(1)" : "translateY(-12px) scale(0.98)",
        transition: "opacity 0.45s ease, transform 0.45s ease",
      }}
    >
      {/* Outer glow ring */}
      <div
        style={{
          borderRadius: "1.5rem",
          padding: "3px",
          background: "linear-gradient(135deg, #FF6B35 0%, #FFB627 50%, #FF6B35 100%)",
          backgroundSize: "200% 200%",
          animation: "gradientShift 3s ease infinite",
          boxShadow: "0 0 32px rgba(255, 107, 53, 0.45), 0 0 64px rgba(255, 182, 39, 0.25)",
        }}
      >
        <div
          style={{
            background: "linear-gradient(135deg, #fffbf0 0%, #fff8e6 100%)",
            borderRadius: "calc(1.5rem - 3px)",
            padding: "2rem 2.5rem",
          }}
        >
          {/* Header row */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div style={{ fontSize: "2rem", animation: "pulse 1.8s ease-in-out infinite", lineHeight: 1 }}>
              🏺
            </div>
            <div>
              <div style={{ fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: "#c2410c", marginBottom: "0.15rem" }}>
                LegacyLoop AI Detection
              </div>
              <div style={{ fontSize: "1.5rem", fontWeight: 800, letterSpacing: "-0.02em", background: "linear-gradient(90deg, #c2410c, #b45309)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", lineHeight: 1.2 }}>
                ANTIQUE ALERT
              </div>
            </div>
          </div>

          {/* Divider */}
          <div style={{ height: "2px", background: "linear-gradient(90deg, #FF6B35, #FFB627, transparent)", borderRadius: "1px", margin: "1rem 0" }} />

          {/* ── POST-EVALUATION STATE ── */}
          {hasResult ? (
            <>
              {/* Verdict banner */}
              <div style={{
                display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem",
                padding: "0.85rem 1.25rem", borderRadius: "0.875rem",
                background: `${verdictColor}10`, border: `1.5px solid ${verdictColor}30`,
              }}>
                <div style={{ fontSize: "1.5rem" }}>
                  {auth?.verdict === "Authentic" || auth?.verdict === "Likely Authentic" ? "✅" : auth?.verdict === "Uncertain" ? "⚠️" : "❌"}
                </div>
                <div>
                  <div style={{ fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: verdictColor }}>
                    Authentication Verdict
                  </div>
                  <div style={{ fontSize: "1.15rem", fontWeight: 800, color: verdictColor }}>
                    {auth?.verdict || "Analysis Complete"}
                  </div>
                  {auth?.confidence && (
                    <div style={{ fontSize: "0.75rem", color: "#78716c", marginTop: "0.1rem" }}>
                      Confidence: {auth.confidence}%
                    </div>
                  )}
                </div>
              </div>

              {/* Reasoning */}
              {auth?.reasoning && (
                <p style={{ fontSize: "0.88rem", color: "#57534e", margin: "0 0 0.75rem", lineHeight: 1.6 }}>
                  {auth.reasoning}
                </p>
              )}

              {/* Value assessment */}
              {val?.fair_market_value && (
                <div style={{
                  background: "rgba(255, 107, 53, 0.08)", border: "1.5px solid rgba(255, 107, 53, 0.3)",
                  borderRadius: "0.875rem", padding: "1rem 1.25rem", marginBottom: "1rem",
                  display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.5rem",
                }}>
                  <div>
                    <div style={{ fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: "#c2410c", marginBottom: "0.2rem" }}>
                      AntiqueBot Valuation
                    </div>
                    <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "#92400e", letterSpacing: "-0.02em" }}>
                      ${val.fair_market_value.low?.toLocaleString()} – ${val.fair_market_value.high?.toLocaleString()}
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: "0.65rem", color: "#78716c", textTransform: "uppercase", letterSpacing: "0.1em" }}>Insurance</div>
                    <div style={{ fontSize: "1rem", fontWeight: 700, color: "#92400e" }}>${val.insurance_value?.toLocaleString()}</div>
                  </div>
                </div>
              )}

              {/* Positive indicators */}
              {auth?.positive_indicators?.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", marginBottom: "1rem" }}>
                  {auth.positive_indicators.slice(0, 6).map((ind: string, i: number) => (
                    <span key={i} style={{
                      display: "inline-block", padding: "0.2rem 0.6rem", borderRadius: "9999px",
                      fontSize: "0.72rem", fontWeight: 600, background: "rgba(22, 163, 74, 0.1)",
                      color: "#16a34a", border: "1px solid rgba(22, 163, 74, 0.2)",
                    }}>
                      {ind}
                    </span>
                  ))}
                </div>
              )}

              {/* Executive summary */}
              {quickScanResult.executive_summary && (
                <p style={{ fontSize: "0.85rem", color: "#44403c", lineHeight: 1.6, margin: "0 0 1rem", padding: "0.75rem", background: "rgba(251,191,36,0.08)", borderRadius: "0.5rem", borderLeft: "3px solid #fbbf24" }}>
                  {quickScanResult.executive_summary}
                </p>
              )}

              {/* Actions row */}
              <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: "0.75rem" }}>
                <a
                  href={`/bots/antiquebot?item=${itemId}`}
                  style={{
                    display: "inline-flex", alignItems: "center", gap: "0.5rem",
                    padding: "0.65rem 1.25rem",
                    background: "linear-gradient(135deg, #FF6B35, #f97316)",
                    color: "#fff", fontWeight: 700, fontSize: "0.85rem", borderRadius: "0.875rem",
                    border: "none", textDecoration: "none",
                    boxShadow: "0 4px 14px rgba(255, 107, 53, 0.4)",
                  }}
                >
                  🏺 View Full Report
                </a>
                {!megaBotSuccess && (
                  <button
                    onClick={handleMegaBotAnalysis}
                    disabled={megaBotLoading}
                    style={{
                      display: "inline-flex", alignItems: "center", gap: "0.5rem",
                      padding: "0.55rem 1rem",
                      background: megaBotLoading ? "linear-gradient(135deg, #a3a3a3, #737373)" : "linear-gradient(135deg, #8b5cf6, #7c3aed)",
                      color: "#fff", fontWeight: 600, fontSize: "0.82rem", borderRadius: "0.75rem",
                      border: "none", cursor: megaBotLoading ? "not-allowed" : "pointer",
                      boxShadow: "0 4px 14px rgba(139, 92, 246, 0.3)",
                    }}
                  >
                    {megaBotLoading ? "Running..." : "⚡ Boost with MegaBot — 7 cr"}
                  </button>
                )}
                {megaBotSuccess && (
                  <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "#15803d" }}>
                    ✓ MegaBot boost complete — reloading...
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              {/* ── PRE-EVALUATION STATE ── */}
              <p style={{ fontSize: "1.1rem", fontWeight: 600, color: "#1c1917", margin: "0 0 0.5rem" }}>
                This item may be a valuable antique or collectible!
              </p>

              <p style={{ fontSize: "0.9rem", color: "#57534e", margin: "0 0 0.75rem", lineHeight: 1.6 }}>
                {reasonText}
              </p>

              {/* Detected markers */}
              {markers.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", marginBottom: "1.25rem" }}>
                  {markers.map((m, i) => (
                    <span key={i} style={{
                      display: "inline-block", padding: "0.2rem 0.6rem", borderRadius: "9999px",
                      fontSize: "0.72rem", fontWeight: 600, background: "rgba(194, 65, 12, 0.1)",
                      color: "#c2410c", border: "1px solid rgba(194, 65, 12, 0.2)",
                    }}>
                      {m}
                    </span>
                  ))}
                </div>
              )}

              {/* Auction estimate card */}
              {auctionLow != null && auctionHigh != null && (
                <div style={{
                  background: "rgba(255, 107, 53, 0.08)", border: "1.5px solid rgba(255, 107, 53, 0.3)",
                  borderRadius: "0.875rem", padding: "1rem 1.25rem", marginBottom: "1.25rem",
                  display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.5rem",
                }}>
                  <div>
                    <div style={{ fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: "#c2410c", marginBottom: "0.2rem" }}>
                      Estimated Auction Value
                    </div>
                    <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "#92400e", letterSpacing: "-0.02em" }}>
                      ${auctionLow.toLocaleString()} – ${auctionHigh.toLocaleString()}
                    </div>
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "#78716c", maxWidth: "180px", lineHeight: 1.5 }}>
                    Based on AI signals. Professional appraisal recommended for accurate valuation.
                  </div>
                </div>
              )}

              {/* Action row — Quick Scan + MegaBot */}
              <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: "0.75rem" }}>
                {megaBotSuccess ? (
                  <div style={{
                    display: "flex", alignItems: "center", gap: "0.75rem",
                    padding: "0.75rem 1.25rem", background: "rgba(22, 163, 74, 0.1)",
                    border: "1.5px solid rgba(22, 163, 74, 0.3)", borderRadius: "0.875rem",
                  }}>
                    <span style={{ fontSize: "1.1rem" }}>✓</span>
                    <div>
                      <div style={{ fontWeight: 700, color: "#15803d", fontSize: "0.88rem" }}>MegaBot analysis complete!</div>
                      <div style={{ fontSize: "0.78rem", color: "#166534", marginTop: "0.1rem" }}>Scroll down to see the full 4-AI comparison results.</div>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Quick Scan — 4 credits (Step 4.6 bump) */}
                    <button
                      onClick={handleQuickScan}
                      disabled={quickScanLoading || megaBotLoading}
                      style={{
                        display: "inline-flex", alignItems: "center", gap: "0.5rem",
                        padding: "0.65rem 1.25rem",
                        background: quickScanLoading ? "linear-gradient(135deg, #a3a3a3, #737373)" : "linear-gradient(135deg, #FF6B35, #f97316)",
                        color: "#fff", fontWeight: 700, fontSize: "0.9rem", borderRadius: "0.875rem",
                        border: "none", cursor: quickScanLoading ? "not-allowed" : "pointer",
                        boxShadow: quickScanLoading ? "0 4px 14px rgba(0,0,0,0.15)" : "0 4px 14px rgba(255, 107, 53, 0.4)",
                        transition: "transform 0.15s ease, box-shadow 0.15s ease",
                      }}
                    >
                      {quickScanLoading ? (
                        <>
                          <span style={{ display: "inline-block", width: "1rem", height: "1rem", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "megabotSpin 0.6s linear infinite" }} />
                          Scanning...
                        </>
                      ) : (
                        "🏺 Quick Antique Scan — 4 credits"
                      )}
                    </button>

                    {/* MegaBot — 7 credits */}
                    <button
                      onClick={handleMegaBotAnalysis}
                      disabled={quickScanLoading || megaBotLoading}
                      style={{
                        display: "inline-flex", alignItems: "center", gap: "0.5rem",
                        padding: "0.55rem 1rem",
                        background: megaBotLoading ? "linear-gradient(135deg, #a3a3a3, #737373)" : "linear-gradient(135deg, #8b5cf6, #7c3aed)",
                        color: "#fff", fontWeight: 600, fontSize: "0.82rem", borderRadius: "0.75rem",
                        border: "none", cursor: megaBotLoading ? "not-allowed" : "pointer",
                        boxShadow: "0 4px 14px rgba(139, 92, 246, 0.3)",
                      }}
                    >
                      {megaBotLoading ? (
                        <>
                          <span style={{ display: "inline-block", width: "0.85rem", height: "0.85rem", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "megabotSpin 0.6s linear infinite" }} />
                          Running MegaBot...
                        </>
                      ) : (
                        "⚡ MegaBot Deep Analysis — 7 cr"
                      )}
                    </button>

                    {error && (
                      <div style={{ fontSize: "0.82rem", color: "#dc2626", fontWeight: 600, padding: "0.4rem 0.75rem", background: "rgba(220, 38, 38, 0.08)", border: "1px solid rgba(220, 38, 38, 0.2)", borderRadius: "0.5rem" }}>
                        {error}
                      </div>
                    )}

                    {!error && (
                      <div style={{ fontSize: "0.78rem", color: "#78716c", lineHeight: 1.5 }}>
                        Quick Scan: AI antique deep-dive · MegaBot: 4 AIs in parallel
                      </div>
                    )}
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      <style>{`
        @keyframes gradientShift {
          0%   { background-position: 0% 50%; }
          50%  { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50%       { transform: scale(1.18); }
        }
        @keyframes megabotSpin {
          0%   { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
