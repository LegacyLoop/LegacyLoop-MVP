"use client";

import { useState, useEffect, useCallback } from "react";

// ─── Types ───────────────────────────────────────────────────────────────────

interface AntiqueData {
  isAntique: boolean;
  auctionLow: number | null;
  auctionHigh: number | null;
  reason: string | null;
}

interface ScoreData {
  score: number;
  tier: string;
  tierLabel: string;
  tierColor: string;
  tierBorderColor: string;
  tierGlowColor: string;
  nextTierLabel: string | null;
  nextTierThreshold: number | null;
}

interface CollectibleDetectionData {
  isCollectible: boolean;
  score: number;
  confidence: number;
  category: string | null;
  subcategory: string | null;
  signals: string[];
  potentialValue: string;
}

interface DetectionHUDProps {
  itemId: string;
  showAntique: boolean;
  antique: AntiqueData | null;
  authenticityScore: ScoreData | null;
  antiqueBannerAge: string | null;
  showCollectible: boolean;
  collectibleDetection: CollectibleDetectionData | null;
  collectiblesScore: ScoreData | null;
  isAntique: boolean;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function parseMarkers(reason: string | null): string[] {
  if (!reason) return [];
  try {
    const parsed = JSON.parse(reason);
    if (parsed.markers && Array.isArray(parsed.markers)) return parsed.markers;
  } catch { /* not JSON */ }
  return [];
}

function getDismissKey(itemId: string, type: string): string {
  return `ll_dismiss_${type}_${itemId}`;
}

// ─── Tier Progress Bar ──────────────────────────────────────────────────────

function TierProgressBar({ score, tiers, accentColor }: {
  score: number;
  tiers: { threshold: number; label: string }[];
  accentColor: string;
}) {
  return (
    <div style={{ position: "relative", width: "100%", height: "5px", borderRadius: "3px", background: "rgba(148,163,184,0.1)" }}>
      <div style={{
        width: `${Math.min(score, 100)}%`, height: "100%", borderRadius: "3px",
        background: `linear-gradient(90deg, ${accentColor}66, ${accentColor})`,
        transition: "width 0.8s cubic-bezier(0.4, 0, 0.2, 1)",
        boxShadow: `0 0 8px ${accentColor}30`,
      }} />
      {tiers.map((t) => (
        <div key={t.threshold} style={{
          position: "absolute", left: `${t.threshold}%`, top: "-1px",
          width: "1.5px", height: "7px", borderRadius: "1px",
          background: score >= t.threshold ? accentColor : "rgba(148,163,184,0.25)",
        }} />
      ))}
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────

export default function DetectionHUD(props: DetectionHUDProps) {
  const {
    itemId,
    showAntique, antique, authenticityScore, antiqueBannerAge,
    showCollectible, collectibleDetection, collectiblesScore,
    isAntique,
  } = props;

  // ── Dismiss persistence ──
  const [antiqueDismissed, setAntiqueDismissed] = useState(false);
  const [collectibleDismissed, setCollectibleDismissed] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setAntiqueDismissed(localStorage.getItem(getDismissKey(itemId, "antique")) === "1");
      setCollectibleDismissed(localStorage.getItem(getDismissKey(itemId, "collectible")) === "1");
    }
  }, [itemId]);

  const dismissAntique = () => { setAntiqueDismissed(true); localStorage.setItem(getDismissKey(itemId, "antique"), "1"); };
  const dismissCollectible = () => { setCollectibleDismissed(true); localStorage.setItem(getDismissKey(itemId, "collectible"), "1"); };

  // ── Bot state (self-contained) ──
  const [antiqueBotLoading, setAntiqueBotLoading] = useState(false);
  const [antiqueBotDone, setAntiqueBotDone] = useState(false);
  const [collectBotLoading, setCollectBotLoading] = useState(false);
  const [collectBotDone, setCollectBotDone] = useState(false);
  const [megaBotTarget, setMegaBotTarget] = useState<string | null>(null);

  // Check for existing results on mount
  useEffect(() => {
    if (showAntique) {
      fetch(`/api/bots/antiquebot/${itemId}`).then(r => r.json()).then(d => { if (d.hasResult) setAntiqueBotDone(true); }).catch(() => {});
    }
    if (showCollectible) {
      fetch(`/api/bots/collectiblesbot/${itemId}`).then(r => r.json()).then(d => { if (d.hasResult) setCollectBotDone(true); }).catch(() => {});
    }
  }, [itemId, showAntique, showCollectible]);

  const runAntiqueBot = useCallback(async () => {
    setAntiqueBotLoading(true);
    try {
      const res = await fetch(`/api/bots/antiquebot/${itemId}`, { method: "POST" });
      if (res.ok) setAntiqueBotDone(true);
    } catch { /* */ }
    setAntiqueBotLoading(false);
  }, [itemId]);

  const runCollectiblesBot = useCallback(async () => {
    setCollectBotLoading(true);
    try {
      const res = await fetch(`/api/bots/collectiblesbot/${itemId}`, { method: "POST" });
      if (res.ok) setCollectBotDone(true);
    } catch { /* */ }
    setCollectBotLoading(false);
  }, [itemId]);

  const runMegaBot = useCallback(async (type: string) => {
    setMegaBotTarget(type);
    try {
      await fetch(`/api/megabot/${itemId}`, { method: "POST" });
      if (type === "antique") setAntiqueBotDone(true);
      else setCollectBotDone(true);
    } catch { /* */ }
    setMegaBotTarget(null);
  }, [itemId]);

  // ── Visibility ──
  const showAntiqueRow = showAntique && !antiqueDismissed;
  const showCollectibleRow = showCollectible && !collectibleDismissed;
  if (!showAntiqueRow && !showCollectibleRow) return null;

  const markers = parseMarkers(antique?.reason ?? null);
  const collectibleSignals = collectibleDetection?.signals ?? [];

  const antiqueTiers = [{ threshold: 33, label: "Gold" }, { threshold: 66, label: "Platinum" }];
  const collectibleTiers = [{ threshold: 33, label: "Silver" }, { threshold: 66, label: "Gold" }];

  return (
    <>
      <style>{`
        .det-hud {
          border-radius: 12px;
          overflow: hidden;
          border: 1px solid rgba(245,158,11,0.18);
          background: var(--bg-card);
          box-shadow:
            0 0 15px rgba(245,158,11,0.06),
            0 0 30px rgba(139,92,246,0.04),
            0 1px 6px rgba(0,0,0,0.03);
          font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Inter', sans-serif;
          position: relative;
          animation: hudFadeIn 0.6s ease-out both;
        }
        .det-hud.has-antique { border-color: rgba(245,158,11,0.2); }
        .det-hud.has-collectible { border-color: rgba(139,92,246,0.2); }
        .det-hud.has-both {
          border-image: linear-gradient(135deg, rgba(245,158,11,0.25), rgba(139,92,246,0.25)) 1;
          border-image-slice: 1;
          border-radius: 12px;
        }
        html.dark .det-hud {
          background: linear-gradient(135deg, rgba(255,255,255,0.025) 0%, rgba(0,0,0,0.12) 100%);
          box-shadow:
            0 0 20px rgba(245,158,11,0.08),
            0 0 40px rgba(139,92,246,0.06),
            0 1px 12px rgba(0,0,0,0.15);
        }
        @keyframes hudFadeIn {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .det-row {
          display: flex;
          align-items: center;
          padding: 12px 16px;
          gap: 10px;
          position: relative;
        }
        .det-row-antique {
          background: linear-gradient(90deg, rgba(245,158,11,0.04) 0%, transparent 60%);
        }
        .det-row-collectible {
          background: linear-gradient(90deg, rgba(139,92,246,0.04) 0%, transparent 60%);
        }
        html.dark .det-row-antique {
          background: linear-gradient(90deg, rgba(245,158,11,0.06) 0%, transparent 50%);
        }
        html.dark .det-row-collectible {
          background: linear-gradient(90deg, rgba(139,92,246,0.06) 0%, transparent 50%);
        }
        .det-row + .det-row {
          border-top: 1px solid var(--border-default);
        }
        .det-dot {
          width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0;
          animation: detPulse 2.5s ease-in-out infinite;
        }
        @keyframes detPulse {
          0%, 100% { opacity: 0.6; transform: scale(1); box-shadow: 0 0 4px currentColor; }
          50% { opacity: 1; transform: scale(1.25); box-shadow: 0 0 12px currentColor; }
        }
        .det-body { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 3px; }
        .det-top { display: flex; align-items: center; gap: 5px; flex-wrap: wrap; }
        .det-label {
          font-size: 10.5px; font-weight: 800; letter-spacing: 0.1em;
          text-transform: uppercase; line-height: 1;
          text-shadow: 0 0 12px currentColor;
        }
        .det-chip {
          font-size: 8.5px; font-weight: 700; letter-spacing: 0.03em;
          padding: 1.5px 7px; border-radius: 20px; border: 1px solid;
          line-height: 1.3; white-space: nowrap;
        }
        .det-prog { display: flex; align-items: center; gap: 6px; }
        .det-next {
          font-size: 8px; font-weight: 500; color: var(--text-muted);
          white-space: nowrap; opacity: 0.6;
        }
        .det-signals { display: flex; gap: 3px; flex-wrap: wrap; margin-top: 1px; }
        .det-signal {
          font-size: 7.5px; font-weight: 600; letter-spacing: 0.02em;
          padding: 1px 5px; border-radius: 3px; border: 1px solid;
          line-height: 1.3; white-space: nowrap;
        }
        .det-val {
          display: flex; flex-direction: column; align-items: center;
          gap: 0; flex-shrink: 0; padding: 0 6px;
          border-left: 1px solid var(--border-default);
          border-right: 1px solid var(--border-default);
          margin: -4px 2px;
          padding: 4px 12px;
        }
        .det-val-num {
          font-size: 13px; font-weight: 800; letter-spacing: -0.02em;
          font-variant-numeric: tabular-nums; line-height: 1.1;
          text-shadow: 0 0 10px currentColor;
        }
        .det-val-label {
          font-size: 7px; font-weight: 700; letter-spacing: 0.1em;
          text-transform: uppercase; color: var(--text-muted); opacity: 0.55;
        }
        .det-acts { display: flex; align-items: center; gap: 5px; flex-shrink: 0; }
        .det-btn {
          font-size: 9.5px; font-weight: 700; letter-spacing: 0.02em;
          padding: 4px 10px; border-radius: 6px; border: 1px solid;
          background: transparent; cursor: pointer; white-space: nowrap;
          transition: all 0.15s ease;
        }
        .det-btn:disabled { opacity: 0.45; cursor: default; }
        .det-btn:not(:disabled):hover { filter: brightness(1.2); box-shadow: 0 0 12px currentColor; }
        .det-done {
          font-size: 9.5px; font-weight: 700; padding: 3px 10px;
          border-radius: 20px; border: 1px solid; white-space: nowrap;
          box-shadow: 0 0 10px currentColor;
          animation: detDoneGlow 2s ease-in-out infinite;
        }
        @keyframes detDoneGlow {
          0%, 100% { box-shadow: 0 0 6px currentColor; }
          50% { box-shadow: 0 0 14px currentColor; }
        }
        .det-view {
          font-size: 9.5px; font-weight: 600; background: transparent;
          border: none; cursor: pointer; white-space: nowrap; padding: 2px 3px;
          text-decoration: underline; text-underline-offset: 2px;
        }
        .det-x {
          font-size: 11px; background: transparent; border: none;
          cursor: pointer; padding: 2px; line-height: 1;
        }
        .det-x:hover { opacity: 1 !important; }
        @media (max-width: 640px) {
          .det-row { flex-direction: column; align-items: flex-start; gap: 6px; }
          .det-acts { width: 100%; flex-wrap: wrap; }
          .det-val { flex-direction: row; gap: 5px; border: none; padding: 0; margin: 0; }
        }
      `}</style>

      <div className={`det-hud ${showAntiqueRow && showCollectibleRow ? "has-both" : showAntiqueRow ? "has-antique" : "has-collectible"}`}>
        {/* ═══ ANTIQUE ROW ═══ */}
        {showAntiqueRow && (() => {
          const ac = "#f59e0b";
          const sc = authenticityScore;
          const tc = sc?.tierColor || ac;
          return (
            <div className="det-row det-row-antique">
              <div className="det-dot" style={{ background: ac, boxShadow: `0 0 8px ${ac}50`, color: ac }} />
              <div className="det-body">
                <div className="det-top">
                  <span className="det-label" style={{ color: ac }}>ANTIQUE DETECTED</span>
                  {antiqueBannerAge && (
                    <span className="det-chip" style={{ borderColor: `${ac}30`, color: ac, background: `${ac}0d` }}>{antiqueBannerAge}</span>
                  )}
                  {sc && (
                    <span className="det-chip" style={{ borderColor: sc.tierBorderColor, color: tc, background: `${tc}10` }}>
                      {sc.tierLabel} {sc.score}/100
                    </span>
                  )}
                </div>
                {sc && (
                  <div className="det-prog">
                    <div style={{ flex: 1, maxWidth: "150px" }}>
                      <TierProgressBar score={sc.score} tiers={antiqueTiers} accentColor={tc} />
                    </div>
                    {sc.nextTierLabel && <span className="det-next">Next: {sc.nextTierLabel}</span>}
                  </div>
                )}
                {markers.length > 0 && (
                  <div className="det-signals">
                    {markers.slice(0, 5).map((m, i) => (
                      <span key={i} className="det-signal" style={{ borderColor: `${ac}1a`, color: `${ac}bb` }}>{m}</span>
                    ))}
                    {markers.length > 5 && (
                      <span className="det-signal" style={{ borderColor: `${ac}12`, color: `${ac}77` }}>+{markers.length - 5}</span>
                    )}
                  </div>
                )}
              </div>

              {antique?.auctionLow != null && antique.auctionHigh != null && antique.auctionLow > 0 && (
                <div className="det-val">
                  <span className="det-val-num" style={{ color: ac }}>
                    ${antique.auctionLow.toLocaleString()}–${antique.auctionHigh.toLocaleString()}
                  </span>
                  <span className="det-val-label">Est. Auction</span>
                </div>
              )}

              <div className="det-acts">
                {!antiqueBotDone ? (
                  <>
                    <button onClick={runAntiqueBot} disabled={antiqueBotLoading} className="det-btn" style={{ borderColor: `${ac}30`, color: ac }}>
                      {antiqueBotLoading ? "Running..." : "AntiqueBot 2 cr"}
                    </button>
                    <button onClick={() => runMegaBot("antique")} disabled={megaBotTarget === "antique"} className="det-btn" style={{ borderColor: `${ac}35`, color: ac, background: `${ac}08` }}>
                      {megaBotTarget === "antique" ? "Running..." : "MegaBot 5 cr"}
                    </button>
                  </>
                ) : (
                  <span className="det-done" style={{ borderColor: `${ac}25`, color: ac }}>Analysis Complete</span>
                )}
                <button onClick={() => { const el = document.getElementById("panel-antique"); if (el) el.scrollIntoView({ behavior: "smooth", block: "start" }); }} className="det-view" style={{ color: `${ac}77` }}>View</button>
                <button onClick={dismissAntique} className="det-x" style={{ color: `${ac}35` }}>&#x2715;</button>
              </div>
            </div>
          );
        })()}

        {/* ═══ COLLECTIBLE ROW ═══ */}
        {showCollectibleRow && (() => {
          const ac = "#8b5cf6";
          const sc = collectiblesScore;
          const tc = sc?.tierColor || ac;
          return (
            <div className="det-row det-row-collectible">
              <div className="det-dot" style={{ background: ac, boxShadow: `0 0 8px ${ac}50`, color: ac }} />
              <div className="det-body">
                <div className="det-top">
                  <span className="det-label" style={{ color: ac }}>COLLECTIBLE DETECTED</span>
                  {collectibleDetection?.category && (
                    <span className="det-chip" style={{ borderColor: `${ac}30`, color: ac, background: `${ac}0d` }}>
                      {collectibleDetection.category}{collectibleDetection.subcategory ? `: ${collectibleDetection.subcategory}` : ""}
                    </span>
                  )}
                  {sc && (
                    <span className="det-chip" style={{ borderColor: sc.tierBorderColor, color: tc, background: `${tc}10` }}>
                      {sc.tierLabel} {sc.score}/100
                    </span>
                  )}
                </div>
                {sc && (
                  <div className="det-prog">
                    <div style={{ flex: 1, maxWidth: "150px" }}>
                      <TierProgressBar score={sc.score} tiers={collectibleTiers} accentColor={tc} />
                    </div>
                    {sc.nextTierLabel && <span className="det-next">Next: {sc.nextTierLabel}</span>}
                  </div>
                )}
                {collectibleSignals.length > 0 && (
                  <div className="det-signals">
                    {collectibleSignals.slice(0, 5).map((m, i) => (
                      <span key={i} className="det-signal" style={{ borderColor: `${ac}1a`, color: `${ac}bb` }}>{m}</span>
                    ))}
                    {collectibleSignals.length > 5 && (
                      <span className="det-signal" style={{ borderColor: `${ac}12`, color: `${ac}77` }}>+{collectibleSignals.length - 5}</span>
                    )}
                  </div>
                )}
              </div>

              <div className="det-acts">
                {!collectBotDone ? (
                  <>
                    <button onClick={runCollectiblesBot} disabled={collectBotLoading} className="det-btn" style={{ borderColor: `${ac}30`, color: ac }}>
                      {collectBotLoading ? "Running..." : "CollectiblesBot 2 cr"}
                    </button>
                    <button onClick={() => runMegaBot("collectibles")} disabled={megaBotTarget === "collectibles"} className="det-btn" style={{ borderColor: `${ac}35`, color: ac, background: `${ac}08` }}>
                      {megaBotTarget === "collectibles" ? "Running..." : "MegaBot 5 cr"}
                    </button>
                  </>
                ) : (
                  <span className="det-done" style={{ borderColor: `${ac}25`, color: ac }}>Analysis Complete</span>
                )}
                <button onClick={() => { const el = document.getElementById("panel-collectibles"); if (el) el.scrollIntoView({ behavior: "smooth", block: "start" }); }} className="det-view" style={{ color: `${ac}77` }}>View</button>
                <button onClick={dismissCollectible} className="det-x" style={{ color: `${ac}35` }}>&#x2715;</button>
              </div>
            </div>
          );
        })()}
      </div>
    </>
  );
}
