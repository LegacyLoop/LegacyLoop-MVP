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

  // CMD-UX-POLISH-BATCH: badge entrance stagger counter
  let badgeIdx = 0;
  const entranceFor = (isInterested: boolean) => {
    const delay = badgeIdx * 40;
    badgeIdx += 1;
    const base = `fadeSlideUp 0.4s cubic-bezier(0.23, 1, 0.32, 1) ${delay}ms both`;
    return isInterested ? `${base}, pulse 2s ${400 + delay}ms infinite` : base;
  };

  return (
    <div
      className="glass-card-flat"
      style={{
        overflow: "hidden",
        border: item.megabotUsed
          ? "1px solid #c4b5fd"
          : undefined,
        boxShadow: item.megabotUsed
          ? "0 0 0 2px rgba(196,181,253,0.3), 0 2px 8px rgba(0,0,0,0.15)"
          : undefined,
        minHeight: "180px",
        display: "flex",
        flexDirection: "column" as const,
      }}
    >
      {/* Photo */}
      <div style={{ position: "relative" }}>
        {item.photoUrl ? (
          <img
            src={item.photoUrl}
            alt=""
            style={{ width: "100%", aspectRatio: "4/3", objectFit: "cover", display: "block" }}
          />
        ) : (
          <div style={{ width: "100%", aspectRatio: "4/3", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg-card-hover)" }}>
            <span style={{ fontSize: "2rem", opacity: 0.4 }}>+</span>
          </div>
        )}

        {/* Overlays removed — badges moved to status row below photo */}

      </div>

      {/* Status row — all badges moved from photo overlay */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.3rem", padding: "0.4rem 0.75rem 0", minHeight: "22px", alignItems: "center" }}>
        {item.megabotUsed && (
          <span style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)", color: "#fff", fontSize: "0.6rem", fontWeight: 800, padding: "0.15rem 0.45rem", borderRadius: "9999px", opacity: 0, animation: entranceFor(false) }}>⚡ MegaBot</span>
        )}
        {item.aiItemName && !item.megabotUsed && (
          <span style={{ background: "rgba(0,188,212,0.15)", color: "var(--accent, #00bcd4)", fontSize: "0.6rem", fontWeight: 700, padding: "0.15rem 0.45rem", borderRadius: "9999px", border: "1px solid rgba(0,188,212,0.25)", opacity: 0, animation: entranceFor(false) }}>AI Analyzed</span>
        )}
        {item.isAntique && item.antiqueTier && (
          <span title={`Antique ${item.antiqueTier} · Score: ${item.authenticityScore}`} style={{ background: "rgba(212,175,55,0.15)", color: "#D4AF37", fontSize: "0.6rem", fontWeight: 700, padding: "0.15rem 0.45rem", borderRadius: "9999px", border: "1px solid rgba(212,175,55,0.3)", opacity: 0, animation: entranceFor(false) }}>🏛 {item.antiqueTier.toUpperCase()} · {item.authenticityScore}</span>
        )}
        {item.isCollectible && item.collectiblesTier && (
          <span title={`Collectible ${item.collectiblesTier} · Score: ${item.collectiblesScore}`} style={{ background: "var(--purple-bg)", color: "#a78bfa", fontSize: "0.6rem", fontWeight: 700, padding: "0.15rem 0.45rem", borderRadius: "9999px", border: "1px solid var(--purple-border)", opacity: 0, animation: entranceFor(false) }}>✨ {item.collectiblesTier.toUpperCase()} · {item.collectiblesScore}</span>
        )}
        <span style={{ background: cfg.bg, color: cfg.color, fontSize: "0.6rem", fontWeight: 700, padding: "0.15rem 0.45rem", borderRadius: "9999px", border: `1px solid ${cfg.border}`, letterSpacing: "0.03em", opacity: 0, animation: entranceFor(status === "INTERESTED") }}>{cfg.label}</span>
        {item.botStatus?.buyerBotRun && (
          <span style={{ fontSize: "0.55rem", fontWeight: 700, padding: "0.1rem 0.4rem", borderRadius: "9999px", background: "rgba(59,130,246,0.12)", color: "#3b82f6", border: "1px solid rgba(59,130,246,0.25)", opacity: 0, animation: entranceFor(false) }}>👥 Buyers</span>
        )}
        {item.botStatus?.reconBotRun && (
          <span style={{ fontSize: "0.55rem", fontWeight: 700, padding: "0.1rem 0.4rem", borderRadius: "9999px", background: "var(--purple-bg)", color: "#a78bfa", border: "1px solid var(--purple-border)", opacity: 0, animation: entranceFor(false) }}>🔭 Market</span>
        )}
        {item.botStatus?.listBotRun && (
          <span style={{ fontSize: "0.55rem", fontWeight: 700, padding: "0.1rem 0.4rem", borderRadius: "9999px", background: "rgba(0,188,212,0.12)", color: "var(--accent, #00bcd4)", border: "1px solid rgba(0,188,212,0.25)", opacity: 0, animation: entranceFor(false) }}>📋 Listed</span>
        )}
        {item.convCount > 0 && (
          <span style={{ fontSize: "0.55rem", fontWeight: 700, padding: "0.1rem 0.4rem", borderRadius: "9999px", background: item.hasBotConv ? "rgba(239,68,68,0.12)" : item.unreadMsgs > 0 ? "rgba(220,38,38,0.12)" : "var(--ghost-bg)", color: item.hasBotConv ? "#f87171" : item.unreadMsgs > 0 ? "#dc2626" : "var(--text-secondary)", border: item.hasBotConv ? "1px solid rgba(239,68,68,0.25)" : item.unreadMsgs > 0 ? "1px solid rgba(220,38,38,0.25)" : "1px solid var(--border-default)", opacity: 0, animation: entranceFor(false) }}>
            {item.hasBotConv ? "⚠️ bot?" : `💬 ${item.convCount}`}
          </span>
        )}
      </div>

      {/* Body */}
      <div style={{ padding: "0.75rem 0.875rem", flex: 1 }}>
        <div style={{ fontWeight: 600, fontSize: "0.88rem", color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", lineHeight: 1.3 }} title={title}>{title}</div>
        {item.condition && <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.15rem" }}>{item.condition}</div>}

        {/* Pricing row */}
        <div style={{ marginTop: "0.5rem" }}>
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
                  style={{ fontSize: "1.1rem", fontWeight: 700, fontFamily: "var(--font-data)", color: "var(--accent)", cursor: "pointer", letterSpacing: "-0.01em" }}
                >
                  ${listingPrice.toLocaleString()}
                </span>
              ) : item.valuationLow != null ? (
                <span style={{ fontSize: "1rem", fontWeight: 600, fontFamily: "var(--font-data)", color: "var(--accent)", letterSpacing: "-0.01em" }}>
                  ${Math.round(item.valuationLow)}–${Math.round(item.valuationHigh!)}
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
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '8px',
        padding: '14px 16px 16px',
        borderTop: '1px solid var(--border-default)',
      }}>
        {/* View Item — always present, every status */}
        <button
          onClick={() => router.push(`/items/${item.id}`)}
          style={{
            padding: '12px 8px',
            background: 'transparent',
            border: '1px solid var(--border-default)',
            borderRadius: '12px',
            color: 'var(--text-primary)',
            fontSize: '0.8rem',
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
          View Item
        </button>

        {/* Actions panel trigger — always present */}
        <button
          onClick={() => { try { navigator?.vibrate?.(6); } catch {} setPanelOpen(true); }}
          disabled={loading}
          style={{
            padding: '12px 8px',
            background: 'linear-gradient(135deg, rgba(0,188,212,0.15) 0%, rgba(0,188,212,0.08) 100%)',
            border: '1px solid rgba(0,188,212,0.3)',
            borderRadius: '12px',
            color: '#00bcd4',
            fontSize: '0.8rem',
            fontWeight: 600,
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
          Actions
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
