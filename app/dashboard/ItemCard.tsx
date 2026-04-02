"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import ItemActionPanel, { type BotStatusMap } from "@/app/components/ItemActionPanel";

type ItemStatus = "DRAFT" | "ANALYZED" | "READY" | "LISTED" | "INTERESTED" | "SOLD" | "SHIPPED" | "COMPLETED" | "RETURN_REQUESTED" | "RETURNED" | "REFUNDED";

interface ItemCardProps {
  item: {
    id: string;
    status: ItemStatus;
    title: string | null;
    condition: string | null;
    createdAt: string;
    megabotUsed: boolean;
    listingPrice: number | null;
    photoUrl: string | null;
    isAntique: boolean;
    authenticityScore: number | null;
    antiqueTier: string | null;
    isCollectible: boolean;
    collectiblesScore: number;
    collectiblesTier: string | null;
    auctionLow: number | null;
    auctionHigh: number | null;
    valuationLow: number | null;
    valuationHigh: number | null;
    aiItemName: string | null;
    convCount: number;
    unreadMsgs: number;
    hasBotConv: boolean;
    category?: string | null;
    botStatus?: BotStatusMap;
  };
}

const STATUS_CONFIG: Record<ItemStatus, { label: string; bg: string; color: string; border: string }> = {
  DRAFT:       { label: "Draft",      bg: "rgba(148,163,184,0.12)", color: "#94a3b8", border: "rgba(148,163,184,0.25)" },
  ANALYZED:    { label: "Analyzed",   bg: "rgba(34,197,94,0.12)",   color: "#22c55e", border: "rgba(34,197,94,0.25)" },
  READY:       { label: "Ready",      bg: "rgba(59,130,246,0.12)",  color: "#60a5fa", border: "rgba(59,130,246,0.25)" },
  LISTED:      { label: "Listed",     bg: "rgba(14,165,233,0.12)",  color: "#38bdf8", border: "rgba(14,165,233,0.25)" },
  INTERESTED:  { label: "Interested", bg: "rgba(234,179,8,0.12)",   color: "#eab308", border: "rgba(234,179,8,0.25)" },
  SOLD:        { label: "Sold",       bg: "rgba(249,115,22,0.12)",  color: "#f97316", border: "rgba(249,115,22,0.25)" },
  SHIPPED:     { label: "Shipped",    bg: "rgba(0,188,212,0.12)",   color: "#22d3ee", border: "rgba(0,188,212,0.25)" },
  COMPLETED:         { label: "Completed",        bg: "rgba(34,197,94,0.15)",   color: "#4ade80",  border: "rgba(34,197,94,0.3)" },
  RETURN_REQUESTED:  { label: "Return Requested", bg: "rgba(239,68,68,0.12)",   color: "#f87171",  border: "rgba(239,68,68,0.25)" },
  RETURNED:          { label: "Returned",         bg: "rgba(251,146,60,0.12)",  color: "#fb923c",  border: "rgba(251,146,60,0.25)" },
  REFUNDED:          { label: "Refunded",         bg: "rgba(148,163,184,0.12)", color: "#94a3b8",  border: "rgba(148,163,184,0.25)" },
};

// Actions are now handled by ItemActionPanel (slide-out panel)

export default function ItemCard({ item }: ItemCardProps) {
  const router = useRouter();
  const [status, setStatus] = useState<ItemStatus>(item.status);
  const [listingPrice, setListingPrice] = useState<number | null>(item.listingPrice);
  const [panelOpen, setPanelOpen] = useState(false);
  const [showPriceInput, setShowPriceInput] = useState(false);
  const [priceInput, setPriceInput] = useState(item.listingPrice?.toString() ?? "");
  const [loading, setLoading] = useState(false);
  const [deleted, setDeleted] = useState(false);
  const [showAntiqueTooltip, setShowAntiqueTooltip] = useState(false);
  const tooltipHideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [showCollectibleTooltip, setShowCollectibleTooltip] = useState(false);
  const collectibleHideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cfg = STATUS_CONFIG[status];
  const title = item.title || item.aiItemName || `Item #${item.id.slice(0, 8)}`;

  const handleAntiqueMouseEnter = () => {
    if (tooltipHideTimer.current) clearTimeout(tooltipHideTimer.current);
    setShowAntiqueTooltip(true);
  };

  const handleAntiqueMouseLeave = () => {
    tooltipHideTimer.current = setTimeout(() => {
      setShowAntiqueTooltip(false);
    }, 150);
  };

  const handleCollectibleMouseEnter = () => {
    if (collectibleHideTimer.current) clearTimeout(collectibleHideTimer.current);
    setShowCollectibleTooltip(true);
  };

  const handleCollectibleMouseLeave = () => {
    collectibleHideTimer.current = setTimeout(() => {
      setShowCollectibleTooltip(false);
    }, 150);
  };

  if (deleted) return null;

  async function handleStatusChange(newStatus: string) {
    setLoading(true);
    const res = await fetch(`/api/items/status/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    if (res.ok) {
      setStatus(newStatus as ItemStatus);
    }
    setLoading(false);
    router.refresh();
  }

  async function handleDeleteItem() {
    setLoading(true);
    await fetch(`/api/items/delete/${item.id}`, { method: "DELETE" });
    setDeleted(true);
    router.refresh();
  }

  async function saveListingPrice() {
    const val = parseFloat(priceInput);
    const price = isNaN(val) ? null : val;
    setLoading(true);
    await fetch(`/api/items/status/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ listingPrice: price }),
    });
    setListingPrice(price);
    setShowPriceInput(false);
    setLoading(false);
  }

  const aiSuggested = item.valuationHigh != null
    ? Math.round((item.valuationLow! + item.valuationHigh!) / 2)
    : null;

  return (
    <div
      className="card card-hover overflow-hidden"
      style={
        item.megabotUsed
          ? { borderColor: "#c4b5fd", boxShadow: "0 0 0 2px rgba(196,181,253,0.3)" }
          : undefined
      }
    >
      {/* Photo */}
      <div className="relative">
        {item.photoUrl ? (
          <img src={item.photoUrl} alt="" className="h-48 w-full object-cover" />
        ) : (
          <div className="h-48 w-full flex items-center justify-center" style={{ background: "var(--bg-card-hover)" }}>
            <span style={{ fontSize: "2rem", opacity: 0.4 }}>+</span>
          </div>
        )}

        {/* Top-left badges */}
        <div style={{ position: "absolute", top: "0.6rem", left: "0.6rem", display: "flex", flexDirection: "column", gap: "0.3rem" }}>
          {item.megabotUsed && (
            <div style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)", color: "#fff", fontSize: "0.68rem", fontWeight: 800, padding: "0.2rem 0.55rem", borderRadius: "9999px" }}>
              ⚡ MegaBot
            </div>
          )}
          {item.aiItemName && !item.megabotUsed && (
            <div style={{ background: "rgba(0,188,212,0.85)", color: "#fff", fontSize: "0.62rem", fontWeight: 700, padding: "0.15rem 0.5rem", borderRadius: "9999px" }}>
              AI Analyzed
            </div>
          )}
        </div>

        {/* Antique badge + tooltip — single hover wrapper */}
        {item.isAntique && item.antiqueTier && (
          <div
            onMouseEnter={handleAntiqueMouseEnter}
            onMouseLeave={handleAntiqueMouseLeave}
            style={{
              position: 'absolute',
              top: '2.1rem',
              left: '0.5rem',
              zIndex: 10,
            }}
          >
            {/* BADGE */}
            <div style={{
              background: item.antiqueTier === 'platinum'
                ? 'linear-gradient(135deg, rgba(226,232,240,0.92), rgba(148,163,184,0.88))'
                : item.antiqueTier === 'gold'
                ? 'linear-gradient(135deg, rgba(251,191,36,0.92), rgba(217,119,6,0.88))'
                : 'linear-gradient(135deg, rgba(245,158,11,0.92), rgba(180,83,9,0.88))',
              color: item.antiqueTier === 'platinum' ? '#1e293b' : 'white',
              borderRadius: '7px',
              padding: '0.2rem 0.5rem',
              backdropFilter: 'blur(4px)',
              boxShadow: item.antiqueTier === 'platinum'
                ? '0 2px 8px rgba(226,232,240,0.3)'
                : item.antiqueTier === 'gold'
                ? '0 2px 8px rgba(251,191,36,0.3)'
                : '0 2px 8px rgba(245,158,11,0.3)',
              cursor: 'default',
              display: 'flex',
              flexDirection: 'column' as const,
              alignItems: 'center',
              gap: '0.05rem',
            }}>
              <span style={{ fontSize: '0.58rem', fontWeight: 700, letterSpacing: '0.05em', opacity: 0.9 }}>
                🏛️ ANTIQUE
              </span>
              <span style={{ fontSize: '0.62rem', fontWeight: 800, letterSpacing: '0.06em' }}>
                {item.antiqueTier?.toUpperCase()} · {item.authenticityScore}
              </span>
            </div>

            {/* TOOLTIP — renders inside same hover container */}
            {showAntiqueTooltip && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                marginTop: '0.35rem',
                width: '210px',
                background: 'rgba(15, 15, 20, 0.97)',
                border: `1px solid ${
                  item.antiqueTier === 'platinum' ? 'rgba(226,232,240,0.3)'
                  : item.antiqueTier === 'gold' ? 'rgba(251,191,36,0.3)'
                  : 'rgba(245,158,11,0.3)'
                }`,
                borderRadius: '12px',
                padding: '0.85rem 1rem',
                backdropFilter: 'blur(20px)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                zIndex: 20,
              }}>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
                  <span style={{ color: 'white', fontWeight: 700, fontSize: '0.72rem', letterSpacing: '0.04em' }}>
                    🏛️ Authenticity Score
                  </span>
                  <span style={{
                    color: item.antiqueTier === 'platinum' ? '#e2e8f0'
                      : item.antiqueTier === 'gold' ? '#fbbf24'
                      : '#f59e0b',
                    fontWeight: 800,
                    fontSize: '1rem',
                  }}>
                    {item.authenticityScore}
                    <span style={{ fontSize: '0.6rem', opacity: 0.6 }}>/100</span>
                  </span>
                </div>

                {/* Progress meter */}
                <div style={{
                  height: '5px',
                  background: 'rgba(255,255,255,0.08)',
                  borderRadius: '3px',
                  overflow: 'hidden',
                  marginBottom: '0.6rem',
                }}>
                  <div style={{
                    height: '100%',
                    width: `${item.authenticityScore}%`,
                    background: item.antiqueTier === 'platinum'
                      ? 'linear-gradient(90deg, #94a3b8, #e2e8f0)'
                      : item.antiqueTier === 'gold'
                      ? 'linear-gradient(90deg, #d97706, #fbbf24)'
                      : 'linear-gradient(90deg, #b45309, #f59e0b)',
                    borderRadius: '3px',
                  }} />
                </div>

                {/* Tier pill */}
                <div style={{ marginBottom: '0.6rem' }}>
                  <span style={{
                    background: item.antiqueTier === 'platinum'
                      ? 'rgba(226,232,240,0.12)'
                      : item.antiqueTier === 'gold'
                      ? 'rgba(251,191,36,0.12)'
                      : 'rgba(245,158,11,0.12)',
                    border: `1px solid ${
                      item.antiqueTier === 'platinum' ? 'rgba(226,232,240,0.25)'
                      : item.antiqueTier === 'gold' ? 'rgba(251,191,36,0.25)'
                      : 'rgba(245,158,11,0.25)'
                    }`,
                    borderRadius: '20px',
                    padding: '0.15rem 0.6rem',
                    color: item.antiqueTier === 'platinum' ? '#e2e8f0'
                      : item.antiqueTier === 'gold' ? '#fbbf24'
                      : '#f59e0b',
                    fontSize: '0.65rem',
                    fontWeight: 700,
                  }}>
                    {item.antiqueTier === 'platinum' ? '⭐ Expert Verified'
                      : item.antiqueTier === 'gold' ? '✓ Bot Confirmed'
                      : '◎ AI Detected'}
                  </span>
                </div>

                {/* Tier steps */}
                <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '0.3rem' }}>
                  {[
                    { tier: 'amber', label: '◎ AI Detected', range: '1–33', done: true },
                    { tier: 'gold', label: '✓ Bot Confirmed', range: '34–66', done: item.antiqueTier === 'gold' || item.antiqueTier === 'platinum' },
                    { tier: 'platinum', label: '⭐ Expert Verified', range: '67–100', done: item.antiqueTier === 'platinum' },
                  ].map(step => (
                    <div key={step.tier} style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      opacity: step.done ? 1 : 0.35,
                    }}>
                      <span style={{ color: step.done ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.4)', fontSize: '0.65rem' }}>
                        {step.label}
                      </span>
                      <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.6rem' }}>
                        {step.range}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Bottom hint */}
                {item.antiqueTier !== 'platinum' && (
                  <div style={{
                    marginTop: '0.6rem',
                    paddingTop: '0.6rem',
                    borderTop: '1px solid rgba(255,255,255,0.06)',
                    color: 'rgba(255,255,255,0.4)',
                    fontSize: '0.62rem',
                  }}>
                    {item.antiqueTier === 'amber' ? 'Run AntiqueBot to reach Gold' : 'Run MegaBot to reach Platinum'}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Collectible badge + tooltip — single hover wrapper */}
        {item.isCollectible && item.collectiblesTier && (
          <div
            onMouseEnter={handleCollectibleMouseEnter}
            onMouseLeave={handleCollectibleMouseLeave}
            style={{
              position: 'absolute',
              top: item.isAntique && item.antiqueTier ? '4.2rem' : '2.1rem',
              left: '0.5rem',
              zIndex: 10,
            }}
          >
            {/* BADGE */}
            <div style={{
              background: item.collectiblesTier === 'gold'
                ? 'linear-gradient(135deg, rgba(251,191,36,0.92), rgba(217,119,6,0.88))'
                : item.collectiblesTier === 'silver'
                ? 'linear-gradient(135deg, rgba(148,163,184,0.92), rgba(100,116,139,0.88))'
                : 'linear-gradient(135deg, rgba(139,92,246,0.92), rgba(109,40,217,0.88))',
              color: 'white',
              borderRadius: '7px',
              padding: '0.2rem 0.5rem',
              backdropFilter: 'blur(4px)',
              boxShadow: item.collectiblesTier === 'gold'
                ? '0 2px 8px rgba(251,191,36,0.3)'
                : item.collectiblesTier === 'silver'
                ? '0 2px 8px rgba(148,163,184,0.3)'
                : '0 2px 8px rgba(139,92,246,0.3)',
              cursor: 'default',
              display: 'flex',
              flexDirection: 'column' as const,
              alignItems: 'center',
              gap: '0.05rem',
            }}>
              <span style={{ fontSize: '0.58rem', fontWeight: 700, letterSpacing: '0.05em', opacity: 0.9 }}>
                🎴 COLLECTIBLE
              </span>
              <span style={{ fontSize: '0.62rem', fontWeight: 800, letterSpacing: '0.06em' }}>
                {item.collectiblesTier?.toUpperCase()} · {item.collectiblesScore}
              </span>
            </div>

            {/* TOOLTIP */}
            {showCollectibleTooltip && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                marginTop: '0.35rem',
                width: '210px',
                background: 'rgba(15,15,20,0.97)',
                border: `1px solid ${
                  item.collectiblesTier === 'gold' ? 'rgba(251,191,36,0.3)'
                  : item.collectiblesTier === 'silver' ? 'rgba(148,163,184,0.3)'
                  : 'rgba(139,92,246,0.3)'
                }`,
                borderRadius: '12px',
                padding: '0.85rem 1rem',
                backdropFilter: 'blur(20px)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                zIndex: 20,
              }}>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
                  <span style={{ color: 'white', fontWeight: 700, fontSize: '0.72rem', letterSpacing: '0.04em' }}>
                    🎴 Collector Grade
                  </span>
                  <span style={{
                    color: item.collectiblesTier === 'gold' ? '#fbbf24'
                      : item.collectiblesTier === 'silver' ? '#94a3b8'
                      : '#8b5cf6',
                    fontWeight: 800, fontSize: '1rem',
                  }}>
                    {item.collectiblesScore}<span style={{ fontSize: '0.6rem', opacity: 0.6 }}>/100</span>
                  </span>
                </div>

                {/* Progress meter */}
                <div style={{ height: '5px', background: 'rgba(255,255,255,0.08)', borderRadius: '3px', overflow: 'hidden', marginBottom: '0.6rem' }}>
                  <div style={{
                    height: '100%',
                    width: `${item.collectiblesScore}%`,
                    background: item.collectiblesTier === 'gold'
                      ? 'linear-gradient(90deg, #d97706, #fbbf24)'
                      : item.collectiblesTier === 'silver'
                      ? 'linear-gradient(90deg, #64748b, #94a3b8)'
                      : 'linear-gradient(90deg, #6d28d9, #8b5cf6)',
                    borderRadius: '3px',
                  }} />
                </div>

                {/* Tier pill */}
                <div style={{ marginBottom: '0.6rem' }}>
                  <span style={{
                    background: item.collectiblesTier === 'gold' ? 'rgba(251,191,36,0.12)'
                      : item.collectiblesTier === 'silver' ? 'rgba(148,163,184,0.12)'
                      : 'rgba(139,92,246,0.12)',
                    border: `1px solid ${item.collectiblesTier === 'gold' ? 'rgba(251,191,36,0.25)' : item.collectiblesTier === 'silver' ? 'rgba(148,163,184,0.25)' : 'rgba(139,92,246,0.25)'}`,
                    borderRadius: '20px',
                    padding: '0.15rem 0.6rem',
                    color: item.collectiblesTier === 'gold' ? '#fbbf24' : item.collectiblesTier === 'silver' ? '#94a3b8' : '#8b5cf6',
                    fontSize: '0.65rem',
                    fontWeight: 700,
                  }}>
                    {item.collectiblesTier === 'gold' ? '⭐ Expert Certified'
                      : item.collectiblesTier === 'silver' ? '✓ Bot Graded'
                      : '◎ AI Detected'}
                  </span>
                </div>

                {/* Tier steps */}
                <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '0.3rem' }}>
                  {[
                    { tier: 'bronze', label: '◎ AI Detected', range: '1–33', done: true },
                    { tier: 'silver', label: '✓ Bot Graded', range: '34–66', done: item.collectiblesTier === 'silver' || item.collectiblesTier === 'gold' },
                    { tier: 'gold', label: '⭐ Expert Certified', range: '67–100', done: item.collectiblesTier === 'gold' },
                  ].map(step => (
                    <div key={step.tier} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', opacity: step.done ? 1 : 0.35 }}>
                      <span style={{ color: step.done ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.4)', fontSize: '0.65rem' }}>{step.label}</span>
                      <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.6rem' }}>{step.range}</span>
                    </div>
                  ))}
                </div>

                {/* Bottom hint */}
                {item.collectiblesTier !== 'gold' && (
                  <div style={{ marginTop: '0.6rem', paddingTop: '0.6rem', borderTop: '1px solid rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)', fontSize: '0.62rem' }}>
                    {item.collectiblesTier === 'bronze' ? 'Run CollectiblesBot to reach Silver' : 'Run MegaBot to reach Gold'}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Bottom-left: bot run status pills */}
        {item.botStatus && (
          <div style={{ position: "absolute", bottom: "0.5rem", left: "0.5rem", display: "flex", gap: "0.25rem", flexWrap: "wrap" }}>
            {item.botStatus.buyerBotRun && (
              <span style={{ fontSize: "0.6rem", fontWeight: 700, padding: "0.1rem 0.4rem", borderRadius: "9999px", background: "rgba(59,130,246,0.75)", color: "#fff", backdropFilter: "blur(4px)" }}>
                👥 Buyers
              </span>
            )}
            {item.botStatus.reconBotRun && (
              <span style={{ fontSize: "0.6rem", fontWeight: 700, padding: "0.1rem 0.4rem", borderRadius: "9999px", background: "rgba(139,92,246,0.75)", color: "#fff", backdropFilter: "blur(4px)" }}>
                🔭 Market
              </span>
            )}
            {item.botStatus.listBotRun && (
              <span style={{ fontSize: "0.6rem", fontWeight: 700, padding: "0.1rem 0.4rem", borderRadius: "9999px", background: "rgba(0,188,212,0.75)", color: "#fff", backdropFilter: "blur(4px)" }}>
                📋 Listed
              </span>
            )}
          </div>
        )}

        {/* Top-right: status badge + message badge */}
        <div style={{ position: "absolute", top: "0.6rem", right: "0.6rem", display: "flex", flexDirection: "column", gap: "0.3rem", alignItems: "flex-end" }}>
          <span
            style={{
              padding: "0.2rem 0.65rem",
              borderRadius: "9999px",
              fontSize: "0.68rem",
              fontWeight: 700,
              background: cfg.bg,
              color: cfg.color,
              border: `1px solid ${cfg.border}`,
              letterSpacing: "0.03em",
              ...(status === "INTERESTED" ? { animation: "pulse 2s infinite" } : {}),
            }}
          >
            {cfg.label}
          </span>
          {item.convCount > 0 && (
            <span
              style={{
                padding: "0.15rem 0.55rem",
                borderRadius: "9999px",
                fontSize: "0.68rem",
                fontWeight: 700,
                background: item.hasBotConv ? "rgba(239,68,68,0.15)" : item.unreadMsgs > 0 ? "#dc2626" : "var(--ghost-bg)",
                color: item.hasBotConv ? "#f87171" : item.unreadMsgs > 0 ? "#fff" : "var(--text-secondary)",
                border: item.hasBotConv ? "1px solid rgba(239,68,68,0.3)" : "none",
              }}
            >
              {item.hasBotConv ? "⚠️ bot?" : `💬 ${item.convCount}`}
              {item.unreadMsgs > 0 && !item.hasBotConv && ` (${item.unreadMsgs} new)`}
            </span>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="p-5">
        <div style={{ fontWeight: 600, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={title}>{title}</div>
        {item.condition && <div style={{ fontSize: "0.88rem", color: "var(--text-secondary)", marginTop: "0.125rem" }}>{item.condition}</div>}

        {/* Pricing row */}
        <div className="mt-3">
          {showPriceInput ? (
            <div style={{ display: "flex", gap: "0.4rem", alignItems: "center" }}>
              <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>$</span>
              <input
                type="number"
                value={priceInput}
                onChange={(e) => setPriceInput(e.target.value)}
                placeholder="Your price"
                style={{ width: "90px", padding: "0.3rem 0.5rem", fontSize: "0.85rem", border: "1px solid var(--border-default)", borderRadius: "0.5rem", outline: "none", background: "var(--input-bg)", color: "var(--input-color)" }}
                autoFocus
              />
              <button
                onClick={saveListingPrice}
                disabled={loading}
                className="btn-primary"
                style={{ padding: "0.3rem 0.75rem", fontSize: "0.78rem", borderRadius: "0.4rem" }}
              >
                Save
              </button>
              <button
                onClick={() => setShowPriceInput(false)}
                style={{ fontSize: "0.78rem", color: "var(--text-muted)", background: "none", border: "none", cursor: "pointer" }}
              >
                Cancel
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
              {listingPrice != null ? (
                <span
                  onClick={() => setShowPriceInput(true)}
                  title="Click to edit your listing price"
                  style={{ fontSize: "1.05rem", fontWeight: 700, color: "var(--accent)", cursor: "pointer" }}
                >
                  Listed: ${listingPrice.toLocaleString()}
                </span>
              ) : item.valuationLow != null ? (
                <span style={{ fontSize: "0.95rem", fontWeight: 600, color: "var(--accent)" }}>
                  ${Math.round(item.valuationLow)} – ${Math.round(item.valuationHigh!)}
                </span>
              ) : null}

              {listingPrice == null && aiSuggested && (
                <button
                  onClick={() => { setPriceInput(aiSuggested.toString()); setShowPriceInput(true); }}
                  style={{ fontSize: "0.7rem", color: "#a78bfa", background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.3)", borderRadius: "9999px", padding: "0.15rem 0.5rem", cursor: "pointer" }}
                >
                  Set price
                </button>
              )}

              {listingPrice != null && aiSuggested && (
                <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>
                  (AI: ${aiSuggested})
                </span>
              )}

            </div>
          )}
        </div>

        <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.5rem" }}>
          {new Date(item.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
        </div>

      </div>

      {/* Actions row — always identical: View Item + Actions */}
      <div style={{
        display: 'flex',
        gap: '10px',
        padding: '14px 16px 16px',
        borderTop: '1px solid var(--border-default)',
      }}>
        {/* View Item — always present, every status */}
        <button
          onClick={() => router.push(`/items/${item.id}`)}
          style={{
            flex: 1,
            padding: '12px 16px',
            background: 'transparent',
            border: '1px solid var(--border-default)',
            borderRadius: '12px',
            color: 'var(--text-primary)',
            fontSize: '14px',
            fontWeight: 500,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            minHeight: '46px',
            transition: 'all 0.2s ease',
            letterSpacing: '0.01em',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.borderColor = 'rgba(0,188,212,0.5)';
            (e.currentTarget as HTMLElement).style.color = '#00bcd4';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-default)';
            (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)';
          }}
        >
          View Item →
        </button>

        {/* Actions panel trigger — always present */}
        <button
          onClick={() => setPanelOpen(true)}
          disabled={loading}
          style={{
            padding: '12px 20px',
            background: 'linear-gradient(135deg, rgba(0,188,212,0.15) 0%, rgba(0,188,212,0.08) 100%)',
            border: '1px solid rgba(0,188,212,0.3)',
            borderRadius: '12px',
            color: '#00bcd4',
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            minHeight: '46px',
            transition: 'all 0.2s ease',
            whiteSpace: 'nowrap' as const,
            letterSpacing: '0.01em',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.background = 'rgba(0,188,212,0.25)';
            (e.currentTarget as HTMLElement).style.borderColor = 'rgba(0,188,212,0.6)';
            (e.currentTarget as HTMLElement).style.boxShadow = '0 0 20px rgba(0,188,212,0.2)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.background = 'linear-gradient(135deg, rgba(0,188,212,0.15) 0%, rgba(0,188,212,0.08) 100%)';
            (e.currentTarget as HTMLElement).style.borderColor = 'rgba(0,188,212,0.3)';
            (e.currentTarget as HTMLElement).style.boxShadow = 'none';
          }}
        >
          ⚡ Actions
        </button>
      </div>

      {/* Slide-out action panel */}
      <ItemActionPanel
        item={{
          id: item.id,
          title: item.title,
          aiItemName: item.aiItemName,
          status,
          isAntique: item.isAntique,
          authenticityScore: item.authenticityScore,
          antiqueTier: item.antiqueTier,
          isCollectible: item.isCollectible,
          collectiblesScore: item.collectiblesScore,
          collectiblesTier: item.collectiblesTier,
          megabotUsed: item.megabotUsed,
          listingPrice,
          category: item.category,
          photoUrl: item.photoUrl,
          valuationLow: item.valuationLow,
          valuationHigh: item.valuationHigh,
          auctionLow: item.auctionLow,
          auctionHigh: item.auctionHigh,
          convCount: item.convCount,
          unreadMsgs: item.unreadMsgs,
          hasBotConv: item.hasBotConv,
          condition: item.condition,
        }}
        botStatus={item.botStatus ?? {
          analyzeBotRun: status !== "DRAFT",
          megaBotRun: item.megabotUsed,
          buyerBotRun: false,
          reconBotRun: false,
          listBotRun: false,
        }}
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
        onStatusChange={handleStatusChange}
        onDelete={handleDeleteItem}
      />
    </div>
  );
}
