"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

/* ── Types ─────────────────────────────────────────────────────────────────── */

type ItemStatus =
  | "DRAFT"
  | "ANALYZED"
  | "READY"
  | "LISTED"
  | "INTERESTED"
  | "SOLD"
  | "SHIPPED"
  | "COMPLETED";

const STATUS_CFG: Record<
  ItemStatus,
  { label: string; bg: string; color: string; border: string; desc: string; next: string }
> = {
  DRAFT: {
    label: "Draft",
    bg: "rgba(148,163,184,0.12)",
    color: "#94a3b8",
    border: "rgba(148,163,184,0.25)",
    desc: "Not yet analyzed",
    next: "Run AI Analysis to get started",
  },
  ANALYZED: {
    label: "Analyzed",
    bg: "rgba(34,197,94,0.12)",
    color: "#22c55e",
    border: "rgba(34,197,94,0.25)",
    desc: "Ready to list",
    next: "Set a price and list for sale",
  },
  READY: {
    label: "Ready",
    bg: "rgba(59,130,246,0.12)",
    color: "#60a5fa",
    border: "rgba(59,130,246,0.25)",
    desc: "Listing prepared",
    next: "Publish your listing now",
  },
  LISTED: {
    label: "Listed",
    bg: "rgba(14,165,233,0.12)",
    color: "#38bdf8",
    border: "rgba(14,165,233,0.25)",
    desc: "Active listing",
    next: "Manage buyer interest",
  },
  INTERESTED: {
    label: "Interested",
    bg: "rgba(234,179,8,0.12)",
    color: "#eab308",
    border: "rgba(234,179,8,0.25)",
    desc: "Interested buyer",
    next: "Close the sale",
  },
  SOLD: {
    label: "Sold",
    bg: "rgba(249,115,22,0.12)",
    color: "#f97316",
    border: "rgba(249,115,22,0.25)",
    desc: "Awaiting shipment",
    next: "Arrange shipping or pickup",
  },
  SHIPPED: {
    label: "Shipped",
    bg: "rgba(0,188,212,0.12)",
    color: "#22d3ee",
    border: "rgba(0,188,212,0.25)",
    desc: "In transit",
    next: "Confirm delivery",
  },
  COMPLETED: {
    label: "Completed",
    bg: "rgba(34,197,94,0.15)",
    color: "#4ade80",
    border: "rgba(34,197,94,0.3)",
    desc: "Sale finished",
    next: "Review your sale or re-list",
  },
};

export interface PanelItem {
  id: string;
  title: string | null;
  aiItemName: string | null;
  status: ItemStatus;
  isAntique: boolean;
  authenticityScore: number | null;
  isCollectible: boolean;
  collectiblesScore: number;
  collectiblesTier: string | null;
  megabotUsed: boolean;
  listingPrice: number | null;
  category?: string | null;
}

export interface BotStatusMap {
  analyzeBotRun: boolean;
  megaBotRun: boolean;
  buyerBotRun: boolean;
  reconBotRun: boolean;
  listBotRun: boolean;
}

interface Props {
  item: PanelItem;
  botStatus: BotStatusMap;
  open: boolean;
  onClose: () => void;
  onStatusChange: (newStatus: string) => Promise<void>;
  onDelete: () => Promise<void>;
}

/* ── Component ─────────────────────────────────────────────────────────────── */

export default function ItemActionPanel({
  item,
  botStatus,
  open,
  onClose,
  onStatusChange,
  onDelete,
}: Props) {
  const router = useRouter();
  const [show, setShow] = useState(false);
  const [render, setRender] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [priceInput, setPriceInput] = useState("");
  const [showPriceInput, setShowPriceInput] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);

  // Sale assignment state
  const [salesList, setSalesList] = useState<{ id: string; name: string; type: string }[]>([]);
  const [salesLoading, setSalesLoading] = useState(true);
  const [assignedSaleId, setAssignedSaleId] = useState<string | null>(null);
  const [saleActionLoading, setSaleActionLoading] = useState(false);
  const [saleError, setSaleError] = useState<string | null>(null);
  const [showSaleSelector, setShowSaleSelector] = useState(false);

  // Mobile detection
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Mount / unmount with animation
  useEffect(() => {
    if (open) {
      setRender(true);
      setDeleteConfirm(false);
      setShowPriceInput(false);
      setPriceInput("");
      const raf = requestAnimationFrame(() => {
        requestAnimationFrame(() => setShow(true));
      });
      document.body.style.overflow = "hidden";
      return () => cancelAnimationFrame(raf);
    } else {
      setShow(false);
      const timer = setTimeout(() => setRender(false), 300);
      document.body.style.overflow = "";
      return () => clearTimeout(timer);
    }
  }, [open]);

  // Escape key
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  // Cleanup body overflow on unmount
  useEffect(() => {
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  // Fetch sales list + detect current assignment when panel opens
  useEffect(() => {
    if (!open) return;
    setSalesLoading(true);
    setSaleError(null);
    fetch("/api/projects")
      .then((r) => r.ok ? r.json() : [])
      .then((projects) => {
        const list = Array.isArray(projects) ? projects.map((p: any) => ({
          id: p.id, name: p.name, type: p.type || "ESTATE_SALE",
        })) : [];
        setSalesList(list);
        // Find which project contains this item
        const found = Array.isArray(projects) ? projects.find((p: any) =>
          Array.isArray(p.items) && p.items.some((i: any) => i.id === item.id)
        ) : null;
        setAssignedSaleId(found?.id ?? null);
        setSalesLoading(false);
      })
      .catch(() => { setSalesLoading(false); });
  }, [open, item.id]);

  const saleTypeLabel = (type: string) => {
    const map: Record<string, string> = {
      ESTATE_SALE: "Estate Sale", GARAGE_SALE: "Garage Sale", MOVING_SALE: "Moving Sale",
      YARD_SALE: "Yard Sale", DOWNSIZING: "Downsizing", ONLINE_SALE: "Online Sale",
    };
    return map[type] || type.replace(/_/g, " ");
  };

  async function assignItemToSale(saleId: string) {
    setSaleActionLoading(true);
    setSaleError(null);
    try {
      const res = await fetch(`/api/projects/${saleId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ addItemId: item.id }),
      });
      if (!res.ok) throw new Error("Failed to assign");
      setAssignedSaleId(saleId);
      setShowSaleSelector(false);
    } catch (e: any) {
      setSaleError(e.message || "Failed to assign");
    } finally {
      setSaleActionLoading(false);
    }
  }

  async function removeItemFromSale() {
    if (!assignedSaleId) return;
    setSaleActionLoading(true);
    setSaleError(null);
    try {
      const res = await fetch(`/api/projects/${assignedSaleId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ removeItemId: item.id }),
      });
      if (!res.ok) throw new Error("Failed to remove");
      setAssignedSaleId(null);
      setShowSaleSelector(false);
    } catch (e: any) {
      setSaleError(e.message || "Failed to remove");
    } finally {
      setSaleActionLoading(false);
    }
  }

  const doStatusChange = useCallback(
    async (status: string) => {
      setActionLoading(true);
      await onStatusChange(status);
      setActionLoading(false);
      onClose();
    },
    [onStatusChange, onClose]
  );

  const doDelete = useCallback(async () => {
    setActionLoading(true);
    await onDelete();
    setActionLoading(false);
    onClose();
  }, [onDelete, onClose]);

  const doListWithPrice = useCallback(async () => {
    const val = parseFloat(priceInput);
    if (isNaN(val) || val <= 0) return;
    setActionLoading(true);
    await fetch(`/api/items/status/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "LISTED", listingPrice: val }),
    });
    setActionLoading(false);
    onClose();
    router.refresh();
  }, [priceInput, item.id, onClose, router]);

  if (!render) return null;

  const cfg = STATUS_CFG[item.status] || STATUS_CFG.DRAFT;
  const title =
    item.title || item.aiItemName || `Item #${item.id.slice(0, 8)}`;

  const panelTransform = isMobile
    ? show ? "translateY(0)" : "translateY(100%)"
    : show ? "translateX(0)" : "translateX(100%)";

  /* ── Bot grid data — ALL 10 always shown ── */
  const bots: { emoji: string; name: string; run: boolean; route: string }[] = [
    { emoji: "\u{1F50D}", name: "AnalyzeBot", run: botStatus.analyzeBotRun || item.status !== "DRAFT", route: "analyzebot" },
    { emoji: "\u{1F4B0}", name: "PriceBot", run: botStatus.analyzeBotRun || item.status !== "DRAFT", route: "pricebot" },
    { emoji: "\u{1F4CB}", name: "ListBot", run: botStatus.listBotRun, route: "listbot" },
    { emoji: "\u{1F465}", name: "BuyerBot", run: botStatus.buyerBotRun, route: "buyerbot" },
    { emoji: "\u{1F52D}", name: "ReconBot", run: botStatus.reconBotRun, route: "reconbot" },
    { emoji: "\u{1F4F8}", name: "PhotoBot", run: false, route: "stylebot" },
    { emoji: "\u{1F3FA}", name: "AntiqueBot", run: item.isAntique && item.authenticityScore != null && item.authenticityScore > 0, route: "antiquebot" },
    { emoji: "\u{1F0CF}", name: "Collectibles", run: item.isCollectible && item.collectiblesScore > 0, route: "collectiblesbot" },
    { emoji: "\u{1F697}", name: "CarBot", run: false, route: "carbot" },
    { emoji: "\u26A1", name: "MegaBot", run: botStatus.megaBotRun || item.megabotUsed, route: "megabot" },
  ];
  const botsComplete = bots.filter(b => b.run).length;

  /* ── Helpers ── */
  const sectionLabel = (text: string) => (
    <div style={{
      fontSize: '11px',
      fontWeight: 700,
      letterSpacing: '0.12em',
      color: 'rgba(255,255,255,0.35)',
      textTransform: 'uppercase' as const,
      marginBottom: '14px',
    }}>
      {text}
    </div>
  );

  const sectionDivider = (
    <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)', margin: '20px 0 0' }} />
  );

  const ctaPrimary = (label: string, onClick: () => void) => (
    <button
      onClick={onClick}
      disabled={actionLoading}
      style={{
        background: 'linear-gradient(135deg, #00bcd4 0%, #0097a7 100%)',
        border: 'none',
        color: 'white',
        borderRadius: '12px',
        padding: '14px 20px',
        fontSize: '15px',
        fontWeight: 600,
        width: '100%',
        minHeight: '50px',
        cursor: actionLoading ? 'wait' : 'pointer',
        marginTop: '10px',
        transition: 'all 0.2s ease',
        opacity: actionLoading ? 0.7 : 1,
        letterSpacing: '0.01em',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 20px rgba(0,188,212,0.3)';
        (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.boxShadow = 'none';
        (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
      }}
    >
      {actionLoading ? "Working..." : label}
    </button>
  );

  const ctaSecondary = (label: string, onClick: () => void) => (
    <button
      onClick={onClick}
      disabled={actionLoading}
      style={{
        background: 'transparent',
        border: '1px solid rgba(255,255,255,0.12)',
        color: 'rgba(255,255,255,0.8)',
        borderRadius: '12px',
        padding: '12px 20px',
        fontSize: '14px',
        fontWeight: 500,
        width: '100%',
        minHeight: '46px',
        marginTop: '8px',
        cursor: actionLoading ? 'wait' : 'pointer',
        transition: 'all 0.2s ease',
        opacity: actionLoading ? 0.7 : 1,
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.25)';
        (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.12)';
        (e.currentTarget as HTMLElement).style.background = 'transparent';
      }}
    >
      {label}
    </button>
  );

  const ghostBtn = (emoji: string, label: string, onClick: () => void) => (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        width: '100%',
        padding: '12px 14px',
        minHeight: '46px',
        background: 'transparent',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '12px',
        cursor: 'pointer',
        fontSize: '14px',
        fontWeight: 500,
        color: 'rgba(255,255,255,0.8)',
        textAlign: 'left' as const,
        transition: 'all 0.2s ease',
        marginBottom: '6px',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)';
        (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.15)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.background = 'transparent';
        (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.08)';
      }}
    >
      <span style={{ fontSize: '16px', width: '22px', textAlign: 'center' as const, flexShrink: 0 }}>{emoji}</span>
      <span style={{ flex: 1 }}>{label}</span>
      <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: '13px', flexShrink: 0 }}>→</span>
    </button>
  );

  /* ── Status-specific CTAs ── */
  const renderStatusActions = () => {
    switch (item.status) {
      case "DRAFT":
        return ctaPrimary("Analyze This Item →", () => router.push(`/items/${item.id}`));

      case "ANALYZED":
      case "READY": {
        if (!item.listingPrice && !showPriceInput) {
          return (
            <>
              {ctaPrimary(item.status === "READY" ? "Publish Listing →" : "List This Item →", () => setShowPriceInput(true))}
            </>
          );
        }
        if (showPriceInput) {
          return (
            <div style={{ marginTop: '10px' }}>
              <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', marginBottom: '8px' }}>
                Set a listing price before going live:
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '16px', fontWeight: 600 }}>$</span>
                <input
                  type="number"
                  value={priceInput}
                  onChange={(e) => setPriceInput(e.target.value)}
                  placeholder="Your price"
                  autoFocus
                  style={{
                    flex: 1,
                    padding: '12px 14px',
                    borderRadius: '10px',
                    border: '1px solid rgba(255,255,255,0.15)',
                    background: 'rgba(255,255,255,0.06)',
                    color: '#fff',
                    fontSize: '15px',
                    fontWeight: 500,
                    outline: 'none',
                    transition: 'border-color 0.2s ease',
                  }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(0,188,212,0.5)'; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; }}
                  onKeyDown={(e) => { if (e.key === "Enter") doListWithPrice(); }}
                />
              </div>
              {priceInput && parseFloat(priceInput) > 0 && (() => {
                const pn = parseFloat(priceInput);
                const ec = Math.round(pn * 0.05 * 100) / 100;
                const ef = Math.round(pn * 0.0175 * 100) / 100;
                const en = Math.round((pn - ec - ef) * 100) / 100;
                return (
                  <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.45)', marginTop: '6px', lineHeight: 1.4 }}>
                    You{"\u2019"}ll keep ~<span style={{ color: '#4ade80', fontWeight: 600 }}>${en.toFixed(2)}</span> after ~5% commission + 1.75% fee
                  </div>
                );
              })()}
              <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                <button
                  onClick={doListWithPrice}
                  disabled={actionLoading || !priceInput}
                  style={{
                    flex: 1,
                    padding: '12px',
                    borderRadius: '10px',
                    background: 'linear-gradient(135deg, #00bcd4, #0097a7)',
                    color: '#fff',
                    fontSize: '14px',
                    fontWeight: 600,
                    border: 'none',
                    cursor: actionLoading ? 'wait' : 'pointer',
                    minHeight: '44px',
                  }}
                >
                  {actionLoading ? "Listing..." : "List Now"}
                </button>
                <button
                  onClick={() => { setShowPriceInput(false); setPriceInput(""); }}
                  style={{
                    padding: '12px 16px',
                    borderRadius: '10px',
                    background: 'rgba(255,255,255,0.06)',
                    color: 'rgba(255,255,255,0.6)',
                    fontSize: '14px',
                    border: '1px solid rgba(255,255,255,0.1)',
                    cursor: 'pointer',
                    minHeight: '44px',
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          );
        }
        // Has listing price already
        return ctaPrimary(item.status === "READY" ? "Publish Listing →" : "List This Item →", () => doStatusChange("LISTED"));
      }

      case "LISTED":
        return (
          <>
            {ctaPrimary("View Conversations \u2192", () => router.push(`/messages?itemId=${item.id}`))}
            {ctaSecondary("Mark as Interested", () => doStatusChange("INTERESTED"))}
          </>
        );

      case "INTERESTED":
        return (
          <>
            {ctaPrimary("Mark as Sold ✓", () => doStatusChange("SOLD"))}
            {ctaSecondary("Back to Listed", () => doStatusChange("LISTED"))}
          </>
        );

      case "SOLD":
        return (
          <>
            {ctaPrimary("Arrange Shipping \u2192", () => router.push(`/items/${item.id}`))}
            {ctaSecondary("Mark as Shipped", () => doStatusChange("SHIPPED"))}
            {ctaSecondary("\u{1F504} Relist Item", async () => {
              if (confirm("Relist this item? It will move back to LISTED.")) {
                await onStatusChange("LISTED");
              }
            })}
          </>
        );

      case "SHIPPED":
        return (
          <>
            {ctaPrimary("Track Shipment \u2192", () => router.push(`/items/${item.id}`))}
            {ctaSecondary("Mark Delivered \u2713", () => doStatusChange("COMPLETED"))}
            {ctaSecondary("\u{1F504} Relist Item", async () => {
              if (confirm("Relist this item? It will move back to LISTED.")) {
                await onStatusChange("LISTED");
              }
            })}
          </>
        );

      case "COMPLETED":
        return (
          <>
            {ctaPrimary("View Full Item \u2192", () => router.push(`/items/${item.id}`))}
            {ctaSecondary("\u{1F504} Relist Item", async () => {
              if (confirm("Relist this item? It will move back to LISTED.")) {
                await onStatusChange("LISTED");
              }
            })}
          </>
        );

      default:
        return ctaPrimary("View Item →", () => router.push(`/items/${item.id}`));
    }
  };

  /* ── Item snapshot data ── */
  const snapshotRows: { label: string; value: string }[] = [];
  if (item.listingPrice != null) {
    snapshotRows.push({ label: "Listed Price", value: `$${item.listingPrice.toLocaleString()}` });
  }
  if (item.isAntique && item.authenticityScore != null) {
    const tierLabel = item.collectiblesTier
      ? item.collectiblesTier.charAt(0).toUpperCase() + item.collectiblesTier.slice(1)
      : "Detected";
    snapshotRows.push({ label: "Antique Score", value: `${item.authenticityScore}/100 · ${tierLabel}` });
  }
  if (item.isCollectible && item.collectiblesScore > 0) {
    const cTier = item.collectiblesTier
      ? item.collectiblesTier.charAt(0).toUpperCase() + item.collectiblesTier.slice(1)
      : "Graded";
    snapshotRows.push({ label: "Collectibles Grade", value: `${item.collectiblesScore}/100 · ${cTier}` });
  }
  if (item.aiItemName) {
    const aiName = item.aiItemName.length > 40 ? item.aiItemName.slice(0, 37) + "..." : item.aiItemName;
    snapshotRows.push({ label: "AI Identified", value: aiName });
  }
  if (item.megabotUsed) {
    snapshotRows.push({ label: "MegaBot", value: "Multi-AI analysis complete" });
  }

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 999,
          background: "rgba(0,0,0,0.6)",
          backdropFilter: "blur(2px)",
          WebkitBackdropFilter: "blur(2px)",
          opacity: show ? 1 : 0,
          transition: "opacity 280ms ease",
        }}
      />

      {/* Panel */}
      <div
        style={{
          position: "fixed",
          zIndex: 1000,
          ...(isMobile
            ? {
                bottom: 0,
                left: 0,
                right: 0,
                maxHeight: "88vh",
                borderRadius: "20px 20px 0 0",
              }
            : {
                top: 0,
                right: 0,
                bottom: 0,
                width: "340px",
              }),
          background: "rgba(8,8,12,0.98)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          borderLeft: isMobile ? "none" : "1px solid rgba(255,255,255,0.08)",
          borderTop: isMobile ? "1px solid rgba(255,255,255,0.08)" : "none",
          overflowY: "auto",
          transform: panelTransform,
          transition: "transform 280ms cubic-bezier(0.32, 0.72, 0, 1)",
          display: 'flex',
          flexDirection: 'column' as const,
        }}
      >
        {/* Mobile drag handle */}
        {isMobile && (
          <div style={{ display: "flex", justifyContent: "center", padding: "12px 0 4px" }}>
            <div style={{ width: "40px", height: "4px", borderRadius: "2px", background: "rgba(255,255,255,0.2)" }} />
          </div>
        )}

        {/* ── HEADER ── */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          padding: "16px 20px",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          flexShrink: 0,
        }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontWeight: 700,
              fontSize: "15px",
              color: "#fff",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap" as const,
              letterSpacing: "0.01em",
            }}>
              {title}
            </div>
            <div style={{ marginTop: "6px" }}>
              <span style={{
                padding: "3px 10px",
                borderRadius: "9999px",
                fontSize: "11px",
                fontWeight: 700,
                background: cfg.bg,
                color: cfg.color,
                border: `1px solid ${cfg.border}`,
                letterSpacing: "0.03em",
              }}>
                {cfg.label}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: "44px",
              height: "44px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "12px",
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "rgba(255,255,255,0.5)",
              cursor: "pointer",
              fontSize: "20px",
              flexShrink: 0,
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(255,255,255,0.12)";
              e.currentTarget.style.color = "#fff";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(255,255,255,0.06)";
              e.currentTarget.style.color = "rgba(255,255,255,0.5)";
            }}
            aria-label="Close panel"
          >
            ×
          </button>
        </div>

        {/* ── SCROLLABLE CONTENT ── */}
        <div style={{ flex: 1, overflowY: 'auto' }}>

          {/* ── SECTION 1: STATUS & ACTIONS ── */}
          <div style={{ padding: '20px 20px 0' }}>
            {sectionLabel("📍 Status & Actions")}

            <div style={{
              background: 'rgba(255,255,255,0.03)',
              borderRadius: '12px',
              padding: '16px',
              border: '1px solid rgba(255,255,255,0.06)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <span style={{ fontSize: '14px', fontWeight: 600, color: cfg.color }}>
                  {cfg.label}
                </span>
                <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)' }}>
                  — {cfg.desc}
                </span>
              </div>
              <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', lineHeight: '1.5' }}>
                {cfg.next}
              </div>

              {renderStatusActions()}
            </div>
          </div>

          {sectionDivider}

          {/* ── SECTION 1.5: SALE ASSIGNMENT ── */}
          <div style={{ padding: '20px 20px 0' }}>
            {sectionLabel("🏷️ Sale Assignment")}

            {salesLoading ? (
              <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', padding: '12px 0' }}>
                Loading sales...
              </div>
            ) : (
              <div style={{
                background: 'rgba(255,255,255,0.03)',
                borderRadius: '12px',
                padding: '14px',
                border: '1px solid rgba(255,255,255,0.06)',
              }}>
                {saleError && (
                  <div style={{
                    fontSize: '12px', color: '#ef4444',
                    background: 'rgba(239,68,68,0.08)',
                    border: '1px solid rgba(239,68,68,0.2)',
                    borderRadius: '8px', padding: '8px 10px', marginBottom: '10px',
                  }}>
                    {saleError}
                  </div>
                )}

                {(() => {
                  const assigned = salesList.find((s) => s.id === assignedSaleId);

                  // STATE B — Assigned
                  if (assigned && !showSaleSelector) {
                    return (
                      <div>
                        <div style={{
                          display: 'inline-flex', alignItems: 'center', gap: '5px',
                          padding: '5px 11px', borderRadius: '20px',
                          background: 'rgba(0,188,212,0.1)',
                          border: '1px solid rgba(0,188,212,0.25)',
                          fontSize: '13px', fontWeight: 600,
                          color: 'rgba(0,188,212,0.95)',
                        }}>
                          ✓ {assigned.name} · {saleTypeLabel(assigned.type)}
                        </div>
                        <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                          <button
                            onClick={() => setShowSaleSelector(true)}
                            disabled={saleActionLoading}
                            style={{
                              flex: 1, padding: '10px 12px', minHeight: '48px',
                              fontSize: '13px', fontWeight: 600,
                              borderRadius: '10px',
                              border: '1px solid rgba(255,255,255,0.1)',
                              background: 'rgba(255,255,255,0.04)',
                              color: 'rgba(255,255,255,0.7)',
                              cursor: 'pointer',
                            }}
                          >
                            Move to Different Sale
                          </button>
                          <button
                            onClick={removeItemFromSale}
                            disabled={saleActionLoading}
                            style={{
                              padding: '10px 12px', minHeight: '48px',
                              fontSize: '13px', fontWeight: 600,
                              borderRadius: '10px',
                              border: '1px solid rgba(239,68,68,0.2)',
                              background: 'transparent',
                              color: '#ef4444',
                              cursor: saleActionLoading ? 'wait' : 'pointer',
                              opacity: saleActionLoading ? 0.6 : 1,
                            }}
                          >
                            {saleActionLoading ? "..." : "Remove"}
                          </button>
                        </div>
                      </div>
                    );
                  }

                  // STATE D — No sales
                  if (salesList.length === 0) {
                    return (
                      <div>
                        <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', lineHeight: 1.5 }}>
                          No active sales. Create a sale first.
                        </div>
                        <button
                          onClick={() => { onClose(); router.push("/projects"); }}
                          style={{
                            marginTop: '10px', padding: '10px 16px', minHeight: '48px',
                            fontSize: '13px', fontWeight: 600,
                            borderRadius: '10px',
                            background: 'rgba(0,188,212,0.12)',
                            border: '1px solid rgba(0,188,212,0.25)',
                            color: '#00bcd4',
                            cursor: 'pointer',
                          }}
                        >
                          Go to Sales →
                        </button>
                      </div>
                    );
                  }

                  // STATE A — Select a sale
                  return (
                    <div>
                      {showSaleSelector && assigned && (
                        <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginBottom: '8px' }}>
                          Currently in: <span style={{ color: '#00bcd4' }}>{assigned.name}</span>
                        </div>
                      )}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {salesList.map((sale) => (
                          <button
                            key={sale.id}
                            onClick={() => assignItemToSale(sale.id)}
                            disabled={saleActionLoading || sale.id === assignedSaleId}
                            style={{
                              display: 'flex', alignItems: 'center', gap: '10px',
                              width: '100%', padding: '10px 14px', minHeight: '48px',
                              fontSize: '14px', fontWeight: 500,
                              borderRadius: '10px',
                              border: sale.id === assignedSaleId
                                ? '1px solid rgba(0,188,212,0.3)'
                                : '1px solid rgba(255,255,255,0.08)',
                              background: sale.id === assignedSaleId
                                ? 'rgba(0,188,212,0.08)'
                                : 'rgba(255,255,255,0.03)',
                              color: sale.id === assignedSaleId
                                ? '#00bcd4' : 'rgba(255,255,255,0.85)',
                              cursor: saleActionLoading || sale.id === assignedSaleId ? 'default' : 'pointer',
                              opacity: saleActionLoading ? 0.6 : 1,
                              textAlign: 'left' as const,
                            }}
                          >
                            <span style={{ flex: 1 }}>
                              {sale.name}
                              <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)', marginLeft: '6px' }}>
                                {saleTypeLabel(sale.type)}
                              </span>
                            </span>
                            {sale.id === assignedSaleId && (
                              <span style={{ fontSize: '11px', color: '#00bcd4', fontWeight: 700 }}>Current</span>
                            )}
                          </button>
                        ))}
                      </div>
                      {showSaleSelector && (
                        <button
                          onClick={() => setShowSaleSelector(false)}
                          style={{
                            marginTop: '8px', padding: '6px 12px',
                            fontSize: '12px', fontWeight: 500,
                            border: 'none', background: 'transparent',
                            color: 'rgba(255,255,255,0.4)', cursor: 'pointer',
                          }}
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  );
                })()}
              </div>
            )}
          </div>

          {sectionDivider}

          {/* ── SECTION 2: AI BOT SUITE ── */}
          <div style={{ padding: '20px 20px 0' }}>
            {sectionLabel("🤖 AI Bot Suite")}
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)', marginBottom: '14px', marginTop: '-8px' }}>
              Tap any bot to run it on this item
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '8px',
            }}>
              {bots.map((bot) => (
                <button
                  key={bot.name}
                  onClick={() => { onClose(); router.push(bot.run ? `/items/${item.id}` : `/bots/${bot.route}?itemId=${item.id}`); }}
                  style={{
                    background: bot.run ? 'rgba(0,188,212,0.06)' : 'rgba(255,255,255,0.04)',
                    border: bot.run ? '1px solid rgba(0,188,212,0.2)' : '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '12px',
                    padding: '14px 12px',
                    cursor: 'pointer',
                    minHeight: '80px',
                    display: 'flex',
                    flexDirection: 'column' as const,
                    gap: '6px',
                    transition: 'all 0.2s ease',
                    textAlign: 'left' as const,
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.background = 'rgba(0,188,212,0.08)';
                    (e.currentTarget as HTMLElement).style.borderColor = 'rgba(0,188,212,0.25)';
                    (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.background = bot.run ? 'rgba(0,188,212,0.06)' : 'rgba(255,255,255,0.04)';
                    (e.currentTarget as HTMLElement).style.borderColor = bot.run ? 'rgba(0,188,212,0.2)' : 'rgba(255,255,255,0.08)';
                    (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '20px' }}>{bot.emoji}</span>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: 'rgba(255,255,255,0.85)' }}>{bot.name}</span>
                  </div>
                  <div style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    color: bot.run ? '#00bcd4' : 'rgba(255,255,255,0.35)',
                    letterSpacing: '0.02em',
                  }}>
                    {bot.run ? "\u2713 View Results" : "Tap to run \u2192"}
                  </div>
                </button>
              ))}
            </div>

            <div style={{
              fontSize: '11px',
              color: 'rgba(255,255,255,0.25)',
              textAlign: 'center' as const,
              marginTop: '12px',
              lineHeight: '1.5',
            }}>
              {botsComplete}/10 bots complete {"\u00B7"} Run from item dashboard for full analysis
            </div>
          </div>

          {sectionDivider}

          {/* ── SECTION 3: ITEM SNAPSHOT ── */}
          <div style={{ padding: '20px 20px 0' }}>
            {sectionLabel("📊 Item Snapshot")}

            {snapshotRows.length > 0 ? (
              <div style={{
                background: 'rgba(255,255,255,0.03)',
                borderRadius: '10px',
                padding: '12px 14px',
                display: 'flex',
                flexDirection: 'column' as const,
              }}>
                {snapshotRows.map((row, i) => (
                  <div key={row.label} style={{
                    padding: '10px 0',
                    borderTop: i > 0 ? '1px solid rgba(255,255,255,0.06)' : 'none',
                  }}>
                    <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginBottom: '3px', letterSpacing: '0.02em' }}>
                      {row.label}
                    </div>
                    <div style={{ fontSize: '15px', color: '#fff', fontWeight: 600 }}>
                      {row.value}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{
                background: 'rgba(255,255,255,0.03)',
                borderRadius: '10px',
                padding: '24px 14px',
                textAlign: 'center' as const,
                color: 'rgba(255,255,255,0.3)',
                fontSize: '13px',
              }}>
                Run AnalyzeBot to see item intelligence
              </div>
            )}
          </div>

          {sectionDivider}

          {/* ── SECTION 4: MANAGE ── */}
          <div style={{ padding: '20px 20px 0' }}>
            {sectionLabel("⚙️ Manage")}

            {ghostBtn("\u{1F4C1}", "View Full Item Dashboard", () => router.push(`/items/${item.id}`))}
            {ghostBtn("\u270F\u{FE0F}", "Edit Item Details", () => router.push(`/items/${item.id}/edit`))}

            {/* Share Item */}
            <button
              onClick={() => {
                const url = `${window.location.origin}/items/${item.id}`;
                navigator.clipboard.writeText(url).then(() => {
                  setShareCopied(true);
                  setTimeout(() => setShareCopied(false), 2000);
                }).catch(() => {});
              }}
              style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                width: '100%', padding: '12px 14px', minHeight: '46px',
                background: shareCopied ? 'rgba(0,188,212,0.08)' : 'transparent',
                border: shareCopied ? '1px solid rgba(0,188,212,0.25)' : '1px solid rgba(255,255,255,0.08)',
                borderRadius: '12px', cursor: 'pointer', fontSize: '14px',
                fontWeight: 500,
                color: shareCopied ? '#00bcd4' : 'rgba(255,255,255,0.8)',
                textAlign: 'left' as const, transition: 'all 0.2s ease', marginBottom: '6px',
              }}
            >
              <span style={{ fontSize: '16px', width: '22px', textAlign: 'center' as const, flexShrink: 0 }}>
                {shareCopied ? '\u2713' : '\u{1F4E4}'}
              </span>
              <span style={{ flex: 1 }}>{shareCopied ? 'Link Copied!' : 'Share Item'}</span>
              {!shareCopied && <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: '13px', flexShrink: 0 }}>{"\u2192"}</span>}
            </button>

            {ghostBtn("\u{1F4F7}", "Add New Item", () => { onClose(); router.push("/items/new"); })}

            {/* Danger zone */}
            <div style={{
              marginTop: '20px',
              paddingTop: '16px',
              borderTop: '1px solid rgba(239,68,68,0.15)',
            }}>
              {!deleteConfirm ? (
                <button
                  onClick={() => setDeleteConfirm(true)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    width: '100%',
                    padding: '12px 14px',
                    minHeight: '46px',
                    background: 'transparent',
                    border: '1px solid rgba(239,68,68,0.2)',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: 500,
                    color: '#ef4444',
                    textAlign: 'left' as const,
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.06)';
                    (e.currentTarget as HTMLElement).style.borderColor = 'rgba(239,68,68,0.35)';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.background = 'transparent';
                    (e.currentTarget as HTMLElement).style.borderColor = 'rgba(239,68,68,0.2)';
                  }}
                >
                  <span style={{ fontSize: '16px', width: '22px', textAlign: 'center' as const }}>🗑️</span>
                  <span style={{ flex: 1 }}>Delete Item</span>
                </button>
              ) : (
                <div style={{ padding: '4px 0' }}>
                  <div style={{
                    fontSize: '13px',
                    color: 'rgba(255,255,255,0.5)',
                    textAlign: 'center' as const,
                    marginBottom: '12px',
                  }}>
                    Are you sure? This cannot be undone.
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => setDeleteConfirm(false)}
                      style={{
                        flex: 1,
                        padding: '12px',
                        borderRadius: '10px',
                        background: 'rgba(255,255,255,0.06)',
                        color: 'rgba(255,255,255,0.7)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: 500,
                        minHeight: '44px',
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={doDelete}
                      disabled={actionLoading}
                      style={{
                        flex: 1,
                        padding: '12px',
                        borderRadius: '10px',
                        background: 'rgba(239,68,68,0.15)',
                        color: '#ef4444',
                        border: '1px solid rgba(239,68,68,0.3)',
                        cursor: actionLoading ? 'wait' : 'pointer',
                        fontSize: '14px',
                        fontWeight: 600,
                        minHeight: '44px',
                      }}
                    >
                      {actionLoading ? "Deleting..." : "Yes, Delete"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── FOOTER ── */}
          <div style={{
            padding: '20px 0 30px',
            textAlign: 'center' as const,
            borderTop: '1px solid rgba(255,255,255,0.04)',
            marginTop: '20px',
          }}>
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.2)', fontWeight: 600, letterSpacing: '0.06em' }}>
              LegacyLoop
            </div>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.12)', marginTop: '3px' }}>
              AI-powered resale platform
            </div>
            <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.08)', marginTop: '2px', fontStyle: 'italic' }}>
              Connecting Generations
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
