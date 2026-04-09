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
  | "COMPLETED"
  | "RETURN_REQUESTED"
  | "RETURNED"
  | "REFUNDED";

const STATUS_ORDER: ItemStatus[] = [
  "DRAFT", "ANALYZED", "READY", "LISTED", "INTERESTED", "SOLD", "SHIPPED", "COMPLETED",
];

// Return statuses shown separately in the pipeline when active
const RETURN_STATUS_ORDER: ItemStatus[] = [
  "RETURN_REQUESTED", "RETURNED", "REFUNDED",
];

const STATUS_CFG: Record<
  ItemStatus,
  { label: string; bg: string; color: string; border: string; desc: string; next: string; icon: string }
> = {
  DRAFT: {
    label: "Draft",
    bg: "rgba(148,163,184,0.12)",
    color: "#94a3b8",
    border: "rgba(148,163,184,0.25)",
    desc: "Not yet analyzed",
    next: "Run AI Analysis to get started",
    icon: "📝",
  },
  ANALYZED: {
    label: "Analyzed",
    bg: "rgba(34,197,94,0.12)",
    color: "#22c55e",
    border: "rgba(34,197,94,0.25)",
    desc: "Ready to list",
    next: "Set a price and list for sale",
    icon: "🔍",
  },
  READY: {
    label: "Ready",
    bg: "rgba(59,130,246,0.12)",
    color: "#60a5fa",
    border: "rgba(59,130,246,0.25)",
    desc: "Listing prepared",
    next: "Publish your listing now",
    icon: "✅",
  },
  LISTED: {
    label: "Listed",
    bg: "rgba(14,165,233,0.12)",
    color: "#38bdf8",
    border: "rgba(14,165,233,0.25)",
    desc: "Active listing",
    next: "Manage buyer interest",
    icon: "📋",
  },
  INTERESTED: {
    label: "Interested",
    bg: "rgba(234,179,8,0.12)",
    color: "#eab308",
    border: "rgba(234,179,8,0.25)",
    desc: "Interested buyer",
    next: "Close the sale",
    icon: "🔥",
  },
  SOLD: {
    label: "Sold",
    bg: "rgba(249,115,22,0.12)",
    color: "#f97316",
    border: "rgba(249,115,22,0.25)",
    desc: "Awaiting shipment",
    next: "Arrange shipping or pickup",
    icon: "💰",
  },
  SHIPPED: {
    label: "Shipped",
    bg: "rgba(0,188,212,0.12)",
    color: "#22d3ee",
    border: "rgba(0,188,212,0.25)",
    desc: "In transit",
    next: "Confirm delivery",
    icon: "📦",
  },
  COMPLETED: {
    label: "Completed",
    bg: "rgba(34,197,94,0.15)",
    color: "#4ade80",
    border: "rgba(34,197,94,0.3)",
    desc: "Sale finished",
    next: "Review your sale or re-list",
    icon: "🏆",
  },
  RETURN_REQUESTED: {
    label: "Return Requested",
    bg: "rgba(239,68,68,0.12)",
    color: "#f87171",
    border: "rgba(239,68,68,0.25)",
    desc: "Buyer requested a return",
    next: "Review the request — approve or deny",
    icon: "↩️",
  },
  RETURNED: {
    label: "Returned",
    bg: "rgba(251,146,60,0.12)",
    color: "#fb923c",
    border: "rgba(251,146,60,0.25)",
    desc: "Item received back",
    next: "Inspect and process refund",
    icon: "📥",
  },
  REFUNDED: {
    label: "Refunded",
    bg: "rgba(148,163,184,0.12)",
    color: "#94a3b8",
    border: "rgba(148,163,184,0.25)",
    desc: "Refund processed",
    next: "Re-list to sell again or archive",
    icon: "💸",
  },
};

export interface PanelItem {
  id: string;
  title: string | null;
  aiItemName: string | null;
  status: ItemStatus;
  isAntique: boolean;
  authenticityScore: number | null;
  antiqueTier?: string | null;
  isCollectible: boolean;
  collectiblesScore: number;
  collectiblesTier: string | null;
  megabotUsed: boolean;
  listingPrice: number | null;
  category?: string | null;
  photoUrl?: string | null;
  valuationLow?: number | null;
  valuationHigh?: number | null;
  auctionLow?: number | null;
  auctionHigh?: number | null;
  convCount?: number;
  unreadMsgs?: number;
  hasBotConv?: boolean;
  condition?: string | null;
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

  // Collapsed sections (persists per session)
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const toggleSection = (key: string) => setCollapsed(prev => ({ ...prev, [key]: !prev[key] }));

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
  const currentStepIdx = STATUS_ORDER.indexOf(item.status);

  const panelTransform = isMobile
    ? show ? "translateY(0)" : "translateY(100%)"
    : show ? "translateX(0)" : "translateX(100%)";

  /* ── Bot grid data — ALL 10 always shown ── */
  const bots: { emoji: string; name: string; shortDesc: string; run: boolean }[] = [
    { emoji: "\u{1F50D}", name: "AnalyzeBot", shortDesc: "AI identification", run: botStatus.analyzeBotRun || item.status !== "DRAFT" },
    { emoji: "\u{1F4B0}", name: "PriceBot", shortDesc: "Market pricing", run: botStatus.analyzeBotRun || item.status !== "DRAFT" },
    { emoji: "\u{1F4CB}", name: "ListBot", shortDesc: "Listing generator", run: botStatus.listBotRun },
    { emoji: "\u{1F465}", name: "BuyerBot", shortDesc: "Find buyers", run: botStatus.buyerBotRun },
    { emoji: "\u{1F52D}", name: "ReconBot", shortDesc: "Competitor intel", run: botStatus.reconBotRun },
    { emoji: "\u{1F4F8}", name: "PhotoBot", shortDesc: "Photo enhance", run: false },
    { emoji: "\u{1F3FA}", name: "AntiqueBot", shortDesc: "Age & auth", run: item.isAntique && item.authenticityScore != null && item.authenticityScore > 0 },
    { emoji: "\u{1F0CF}", name: "Collectibles", shortDesc: "Collector grade", run: item.isCollectible && item.collectiblesScore > 0 },
    { emoji: "\u{1F697}", name: "CarBot", shortDesc: "Vehicle spec", run: false },
    { emoji: "\u26A1", name: "MegaBot", shortDesc: "Multi-AI consensus", run: botStatus.megaBotRun || item.megabotUsed },
  ];
  const botsComplete = bots.filter(b => b.run).length;
  const botProgress = Math.round((botsComplete / bots.length) * 100);

  /* ── Helpers ── */
  const sectionHeader = (icon: string, text: string, sectionKey: string, rightContent?: React.ReactNode) => {
    const isCollapsed = collapsed[sectionKey];
    return (
      <button
        onClick={() => toggleSection(sectionKey)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          width: '100%',
          padding: '0',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          marginBottom: isCollapsed ? '0' : '14px',
        }}
      >
        <span style={{
          fontSize: '11px',
          fontWeight: 700,
          letterSpacing: '0.12em',
          color: 'rgba(255,255,255,0.4)',
          textTransform: 'uppercase' as const,
          whiteSpace: 'nowrap' as const,
        }}>
          {icon} {text}
        </span>
        <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.06)' }} />
        {rightContent && <div style={{ marginRight: '8px' }}>{rightContent}</div>}
        <span style={{
          fontSize: '12px',
          color: 'rgba(255,255,255,0.25)',
          transform: isCollapsed ? 'rotate(-90deg)' : 'rotate(0)',
          transition: 'transform 0.2s ease',
          flexShrink: 0,
        }}>
          ▾
        </span>
      </button>
    );
  };

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

  const ghostBtn = (emoji: string, label: string, onClick: () => void, badge?: string) => (
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
      {badge && (
        <span style={{
          fontSize: '11px', fontWeight: 700,
          padding: '2px 8px', borderRadius: '9999px',
          background: 'rgba(239,68,68,0.15)', color: '#f87171',
          border: '1px solid rgba(239,68,68,0.25)',
        }}>
          {badge}
        </span>
      )}
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
                  placeholder={item.valuationHigh != null
                    ? `AI suggests ~$${Math.round(((item.valuationLow ?? 0) + item.valuationHigh) / 2)}`
                    : "Your price"
                  }
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
              {/* AI valuation hint */}
              {item.valuationLow != null && item.valuationHigh != null && (
                <button
                  onClick={() => setPriceInput(Math.round((item.valuationLow! + item.valuationHigh!) / 2).toString())}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    marginTop: '8px', padding: '8px 12px', borderRadius: '8px',
                    background: 'rgba(0,188,212,0.06)', border: '1px solid rgba(0,188,212,0.15)',
                    color: '#00bcd4', fontSize: '12px', fontWeight: 600,
                    cursor: 'pointer', width: '100%',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(0,188,212,0.12)'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(0,188,212,0.06)'; }}
                >
                  <span>💡</span>
                  <span>Use AI suggestion: ${Math.round((item.valuationLow! + item.valuationHigh!) / 2)}</span>
                  <span style={{ opacity: 0.6, marginLeft: '2px' }}>(range ${Math.round(item.valuationLow!)} – ${Math.round(item.valuationHigh!)})</span>
                </button>
              )}
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
                    background: priceInput ? 'linear-gradient(135deg, #00bcd4, #0097a7)' : 'rgba(255,255,255,0.06)',
                    color: priceInput ? '#fff' : 'rgba(255,255,255,0.3)',
                    fontSize: '14px',
                    fontWeight: 600,
                    border: 'none',
                    cursor: actionLoading || !priceInput ? 'not-allowed' : 'pointer',
                    minHeight: '44px',
                    transition: 'all 0.2s ease',
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
            {ctaPrimary("Mark as Sold \u2713", () => doStatusChange("SOLD"))}
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

      case "RETURN_REQUESTED":
        return (
          <>
            {ctaPrimary("Review Return Request \u2192", () => router.push(`/items/${item.id}`))}
            {ctaSecondary("\u2705 Approve Return", async () => {
              if (confirm("Approve this return? A return label will be generated and the buyer will be refunded.")) {
                setActionLoading(true);
                try {
                  const res = await fetch(`/api/refunds/${item.id}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ action: "approve" }),
                  });
                  if (res.ok) {
                    await onStatusChange("REFUNDED");
                  }
                } finally { setActionLoading(false); }
              }
            })}
            {ctaSecondary("\u274C Deny Return", async () => {
              const reason = prompt("Reason for denial (optional):");
              setActionLoading(true);
              try {
                const res = await fetch(`/api/refunds/${item.id}`, {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ action: "deny", reason: reason || "" }),
                });
                if (res.ok) {
                  await onStatusChange("COMPLETED");
                }
              } finally { setActionLoading(false); }
            })}
          </>
        );

      case "RETURNED":
        return (
          <>
            {ctaPrimary("Inspect & Process Refund", async () => {
              if (confirm("Item received back. Process refund now?")) {
                setActionLoading(true);
                try {
                  const res = await fetch(`/api/refunds/${item.id}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ action: "approve" }),
                  });
                  if (res.ok) {
                    await onStatusChange("REFUNDED");
                  }
                } finally { setActionLoading(false); }
              }
            })}
            {ctaSecondary("\u{1F504} Relist Item", async () => {
              if (confirm("No issues found? Relist this item?")) {
                await onStatusChange("LISTED");
              }
            })}
          </>
        );

      case "REFUNDED":
        return (
          <>
            {ctaPrimary("View Full Item \u2192", () => router.push(`/items/${item.id}`))}
            {ctaSecondary("\u{1F504} Relist Item", async () => {
              if (confirm("Re-list this item for sale again?")) {
                await onStatusChange("LISTED");
              }
            })}
          </>
        );

      default:
        return ctaPrimary("View Item →", () => router.push(`/items/${item.id}`));
    }
  };

  /* ── Snapshot data ── */
  const snapshotRows: { label: string; value: string; color?: string }[] = [];
  if (item.listingPrice != null) {
    snapshotRows.push({ label: "Listed Price", value: `$${item.listingPrice.toLocaleString()}`, color: '#00bcd4' });
  }
  if (item.valuationLow != null && item.valuationHigh != null) {
    snapshotRows.push({
      label: "AI Valuation",
      value: `$${Math.round(item.valuationLow)} – $${Math.round(item.valuationHigh)}`,
    });
  }
  if (item.auctionLow != null && item.auctionHigh != null) {
    snapshotRows.push({
      label: "Auction Est.",
      value: `$${Math.round(item.auctionLow).toLocaleString()} – $${Math.round(item.auctionHigh).toLocaleString()}`,
      color: '#fbbf24',
    });
  }
  if (item.isAntique && item.authenticityScore != null) {
    const tierLabel = item.antiqueTier
      ? item.antiqueTier.charAt(0).toUpperCase() + item.antiqueTier.slice(1)
      : "Detected";
    snapshotRows.push({ label: "Antique Score", value: `${item.authenticityScore}/100 \u00B7 ${tierLabel}` });
  }
  if (item.isCollectible && item.collectiblesScore > 0) {
    const cTier = item.collectiblesTier
      ? item.collectiblesTier.charAt(0).toUpperCase() + item.collectiblesTier.slice(1)
      : "Graded";
    snapshotRows.push({ label: "Collectibles Grade", value: `${item.collectiblesScore}/100 \u00B7 ${cTier}` });
  }
  if (item.aiItemName) {
    const aiName = item.aiItemName.length > 40 ? item.aiItemName.slice(0, 37) + "..." : item.aiItemName;
    snapshotRows.push({ label: "AI Identified", value: aiName });
  }
  if (item.condition) {
    snapshotRows.push({ label: "Condition", value: item.condition });
  }
  if (item.megabotUsed) {
    snapshotRows.push({ label: "MegaBot", value: "Multi-AI analysis complete" });
  }

  /* ── Quick stats ── */
  const quickStats = [
    {
      label: "Value",
      value: item.listingPrice != null
        ? `$${item.listingPrice.toLocaleString()}`
        : item.valuationHigh != null
        ? `~$${Math.round(((item.valuationLow ?? 0) + item.valuationHigh) / 2)}`
        : "—",
      color: '#00bcd4',
      sub: item.listingPrice != null ? "listed" : item.valuationHigh != null ? "AI est." : "not set",
    },
    {
      label: "Messages",
      value: `${item.convCount ?? 0}`,
      color: (item.unreadMsgs ?? 0) > 0 ? '#f87171' : 'rgba(255,255,255,0.7)',
      sub: (item.unreadMsgs ?? 0) > 0 ? `${item.unreadMsgs} new` : "conversations",
    },
    {
      label: "AI Bots",
      value: `${botsComplete}/${bots.length}`,
      color: botsComplete >= 8 ? '#4ade80' : botsComplete >= 4 ? '#00bcd4' : 'rgba(255,255,255,0.7)',
      sub: botsComplete === bots.length ? "all complete" : "complete",
    },
  ];

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
          backdropFilter: "blur(4px)",
          WebkitBackdropFilter: "blur(4px)",
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
                maxHeight: "92vh",
                borderRadius: "20px 20px 0 0",
              }
            : {
                top: 0,
                right: 0,
                bottom: 0,
                width: "min(420px, 100%)",
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
          boxShadow: '-8px 0 40px rgba(0,0,0,0.4)',
        }}
      >
        {/* Mobile drag handle */}
        {isMobile && (
          <div style={{ display: "flex", justifyContent: "center", padding: "12px 0 4px" }}>
            <div style={{ width: "40px", height: "4px", borderRadius: "2px", background: "rgba(255,255,255,0.2)" }} />
          </div>
        )}

        {/* ── HEADER — Photo + Title + Status ── */}
        <div style={{
          padding: "20px 20px 16px",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          flexShrink: 0,
        }}>
          <div style={{ display: "flex", gap: "14px", alignItems: "flex-start" }}>
            {/* Photo thumbnail */}
            <div
              onClick={() => router.push(`/items/${item.id}`)}
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '14px',
                overflow: 'hidden',
                flexShrink: 0,
                cursor: 'pointer',
                border: '1px solid rgba(255,255,255,0.1)',
                background: 'rgba(255,255,255,0.04)',
                position: 'relative',
              }}
            >
              {item.photoUrl ? (
                <img
                  src={item.photoUrl}
                  alt=""
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <div style={{
                  width: '100%', height: '100%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '24px', opacity: 0.3,
                }}>
                  📷
                </div>
              )}
            </div>

            {/* Title + status + category */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontWeight: 700,
                fontSize: "16px",
                color: "#fff",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap" as const,
                letterSpacing: "0.01em",
                lineHeight: '1.3',
              }}>
                {title}
              </div>
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginTop: '8px', flexWrap: 'wrap' }}>
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
                  {cfg.icon} {cfg.label}
                </span>
                {item.category && (
                  <span style={{
                    padding: "3px 8px",
                    borderRadius: "9999px",
                    fontSize: "10px",
                    fontWeight: 600,
                    background: 'rgba(255,255,255,0.06)',
                    color: 'rgba(255,255,255,0.5)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    letterSpacing: "0.02em",
                  }}>
                    {item.category}
                  </span>
                )}
                {item.megabotUsed && (
                  <span style={{
                    padding: "3px 8px",
                    borderRadius: "9999px",
                    fontSize: "10px",
                    fontWeight: 700,
                    background: 'rgba(124,58,237,0.15)',
                    color: '#a78bfa',
                    border: '1px solid rgba(124,58,237,0.25)',
                  }}>
                    ⚡ MegaBot
                  </span>
                )}
              </div>
            </div>

            {/* Close button */}
            <button
              onClick={onClose}
              style={{
                width: "36px",
                height: "36px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "10px",
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "rgba(255,255,255,0.5)",
                cursor: "pointer",
                fontSize: "18px",
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

          {/* ── STATUS PIPELINE — Visual progress ── */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0',
            marginTop: '16px',
            padding: '12px 8px',
            background: 'rgba(255,255,255,0.02)',
            borderRadius: '12px',
            border: '1px solid rgba(255,255,255,0.05)',
          }}>
            {STATUS_ORDER.map((s, i) => {
              const stepCfg = STATUS_CFG[s];
              const isActive = i === currentStepIdx;
              const isComplete = i < currentStepIdx;
              const isFuture = i > currentStepIdx;

              return (
                <div key={s} style={{ display: 'flex', alignItems: 'center', flex: i < STATUS_ORDER.length - 1 ? 1 : 'none' }}>
                  {/* Step dot */}
                  <div
                    title={`${stepCfg.label}${isActive ? ' (current)' : isComplete ? ' (done)' : ''}`}
                    style={{
                      width: isActive ? '28px' : '16px',
                      height: isActive ? '28px' : '16px',
                      borderRadius: '50%',
                      background: isActive
                        ? `linear-gradient(135deg, ${stepCfg.color}, ${stepCfg.color}88)`
                        : isComplete
                        ? stepCfg.color
                        : 'rgba(255,255,255,0.08)',
                      border: isActive
                        ? `2px solid ${stepCfg.color}`
                        : 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: isActive ? '12px' : '8px',
                      color: isComplete || isActive ? '#fff' : 'rgba(255,255,255,0.2)',
                      fontWeight: 700,
                      flexShrink: 0,
                      transition: 'all 0.3s ease',
                      boxShadow: isActive ? `0 0 12px ${stepCfg.color}44` : 'none',
                      cursor: 'default',
                    }}
                  >
                    {isActive ? stepCfg.icon : isComplete ? '✓' : ''}
                  </div>

                  {/* Connector line */}
                  {i < STATUS_ORDER.length - 1 && (
                    <div style={{
                      flex: 1,
                      height: '2px',
                      background: isComplete
                        ? `linear-gradient(90deg, ${stepCfg.color}, ${STATUS_CFG[STATUS_ORDER[i + 1]].color})`
                        : 'rgba(255,255,255,0.06)',
                      margin: '0 2px',
                      borderRadius: '1px',
                      transition: 'background 0.3s ease',
                    }} />
                  )}
                </div>
              );
            })}
          </div>

          {/* Step label */}
          <div style={{
            textAlign: 'center' as const,
            marginTop: '8px',
            fontSize: '12px',
            color: cfg.color,
            fontWeight: 600,
            letterSpacing: '0.02em',
          }}>
            {cfg.label} — {cfg.desc}
          </div>
        </div>

        {/* ── SCROLLABLE CONTENT ── */}
        <div style={{ flex: 1, overflowY: 'auto' }}>

          {/* ── QUICK STATS ROW ── */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            gap: '8px',
            padding: '16px 20px 0',
          }}>
            {quickStats.map((stat) => (
              <div key={stat.label} style={{
                background: 'rgba(255,255,255,0.03)',
                borderRadius: '12px',
                padding: '14px 12px',
                border: '1px solid rgba(255,255,255,0.06)',
                textAlign: 'center' as const,
              }}>
                <div style={{ fontSize: '18px', fontWeight: 700, color: stat.color, letterSpacing: '-0.02em' }}>
                  {stat.value}
                </div>
                <div style={{ fontSize: '10px', fontWeight: 600, color: 'rgba(255,255,255,0.35)', marginTop: '4px', letterSpacing: '0.04em', textTransform: 'uppercase' as const }}>
                  {stat.sub}
                </div>
              </div>
            ))}
          </div>

          {sectionDivider}

          {/* ── SECTION 1: STATUS & ACTIONS ── */}
          <div style={{ padding: '20px 20px 0' }}>
            {sectionHeader("📍", "Status & Actions", "status")}

            {!collapsed.status && (
              <div style={{
                background: 'rgba(255,255,255,0.03)',
                borderRadius: '12px',
                padding: '16px',
                border: '1px solid rgba(255,255,255,0.06)',
              }}>
                <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', lineHeight: '1.5', marginBottom: '4px' }}>
                  {cfg.next}
                </div>

                {renderStatusActions()}
              </div>
            )}
          </div>

          {sectionDivider}

          {/* ── SECTION 2: SALE ASSIGNMENT ── */}
          <div style={{ padding: '20px 20px 0' }}>
            {sectionHeader("🏷️", "Sale Assignment", "sale",
              assignedSaleId ? (
                <span style={{ fontSize: '10px', fontWeight: 700, color: '#00bcd4', padding: '2px 6px', borderRadius: '9999px', background: 'rgba(0,188,212,0.1)', border: '1px solid rgba(0,188,212,0.2)' }}>
                  Assigned
                </span>
              ) : undefined
            )}

            {!collapsed.sale && (
              <>
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
                                  flex: 1, padding: '10px 12px', minHeight: '44px',
                                  fontSize: '13px', fontWeight: 600,
                                  borderRadius: '10px',
                                  border: '1px solid rgba(255,255,255,0.1)',
                                  background: 'rgba(255,255,255,0.04)',
                                  color: 'rgba(255,255,255,0.7)',
                                  cursor: 'pointer',
                                  transition: 'all 0.15s ease',
                                }}
                                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.08)'; }}
                                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)'; }}
                              >
                                Move to Different Sale
                              </button>
                              <button
                                onClick={removeItemFromSale}
                                disabled={saleActionLoading}
                                style={{
                                  padding: '10px 12px', minHeight: '44px',
                                  fontSize: '13px', fontWeight: 600,
                                  borderRadius: '10px',
                                  border: '1px solid rgba(239,68,68,0.2)',
                                  background: 'transparent',
                                  color: '#ef4444',
                                  cursor: saleActionLoading ? 'wait' : 'pointer',
                                  opacity: saleActionLoading ? 0.6 : 1,
                                  transition: 'all 0.15s ease',
                                }}
                                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.06)'; }}
                                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
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
                                marginTop: '10px', padding: '10px 16px', minHeight: '44px',
                                fontSize: '13px', fontWeight: 600,
                                borderRadius: '10px',
                                background: 'rgba(0,188,212,0.12)',
                                border: '1px solid rgba(0,188,212,0.25)',
                                color: '#00bcd4',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease',
                              }}
                              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(0,188,212,0.2)'; }}
                              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(0,188,212,0.12)'; }}
                            >
                              Create a Sale →
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
                                  width: '100%', padding: '10px 14px', minHeight: '44px',
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
                                  transition: 'all 0.15s ease',
                                }}
                                onMouseEnter={(e) => {
                                  if (sale.id !== assignedSaleId) {
                                    (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)';
                                    (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.15)';
                                  }
                                }}
                                onMouseLeave={(e) => {
                                  if (sale.id !== assignedSaleId) {
                                    (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.03)';
                                    (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.08)';
                                  }
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
              </>
            )}
          </div>

          {sectionDivider}

          {/* ── SECTION 3: AI BOT SUITE ── */}
          <div style={{ padding: '20px 20px 0' }}>
            {sectionHeader("🤖", "AI Bot Suite", "bots",
              <span style={{ fontSize: '10px', fontWeight: 700, color: botsComplete >= 8 ? '#4ade80' : '#00bcd4' }}>
                {botsComplete}/{bots.length}
              </span>
            )}

            {!collapsed.bots && (
              <>
                {/* Progress bar */}
                <div style={{ marginBottom: '14px' }}>
                  <div style={{
                    height: '4px',
                    background: 'rgba(255,255,255,0.06)',
                    borderRadius: '2px',
                    overflow: 'hidden',
                  }}>
                    <div style={{
                      height: '100%',
                      width: `${botProgress}%`,
                      background: botProgress >= 80
                        ? 'linear-gradient(90deg, #4ade80, #22c55e)'
                        : 'linear-gradient(90deg, #00bcd4, #0097a7)',
                      borderRadius: '2px',
                      transition: 'width 0.5s ease',
                    }} />
                  </div>
                  <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', marginTop: '6px' }}>
                    {botsComplete === bots.length
                      ? "All bots complete — full intelligence unlocked"
                      : `${bots.length - botsComplete} bot${bots.length - botsComplete !== 1 ? 's' : ''} remaining — view item to run`}
                  </div>
                </div>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '8px',
                }}>
                  {bots.map((bot) => (
                    <button
                      key={bot.name}
                      onClick={() => { onClose(); router.push(`/items/${item.id}`); }}
                      style={{
                        background: bot.run ? 'rgba(0,188,212,0.06)' : 'rgba(255,255,255,0.03)',
                        border: bot.run ? '1px solid rgba(0,188,212,0.2)' : '1px solid rgba(255,255,255,0.06)',
                        borderRadius: '12px',
                        padding: '12px 10px',
                        cursor: 'pointer',
                        minHeight: '72px',
                        display: 'flex',
                        flexDirection: 'column' as const,
                        gap: '4px',
                        transition: 'all 0.2s ease',
                        textAlign: 'left' as const,
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLElement).style.background = 'rgba(0,188,212,0.08)';
                        (e.currentTarget as HTMLElement).style.borderColor = 'rgba(0,188,212,0.25)';
                        (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)';
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLElement).style.background = bot.run ? 'rgba(0,188,212,0.06)' : 'rgba(255,255,255,0.03)';
                        (e.currentTarget as HTMLElement).style.borderColor = bot.run ? 'rgba(0,188,212,0.2)' : 'rgba(255,255,255,0.06)';
                        (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '18px' }}>{bot.emoji}</span>
                        <span style={{ fontSize: '12px', fontWeight: 700, color: 'rgba(255,255,255,0.85)' }}>{bot.name}</span>
                      </div>
                      <div style={{
                        fontSize: '10px',
                        color: 'rgba(255,255,255,0.35)',
                        lineHeight: '1.3',
                      }}>
                        {bot.shortDesc}
                      </div>
                      <div style={{
                        fontSize: '10px',
                        fontWeight: 700,
                        color: bot.run ? '#00bcd4' : 'rgba(255,255,255,0.25)',
                        letterSpacing: '0.02em',
                        marginTop: '2px',
                      }}>
                        {bot.run ? "\u2713 Complete" : "Not run"}
                      </div>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {sectionDivider}

          {/* ── SECTION 4: ITEM INTELLIGENCE ── */}
          <div style={{ padding: '20px 20px 0' }}>
            {sectionHeader("📊", "Item Intelligence", "snapshot")}

            {!collapsed.snapshot && (
              <>
                {snapshotRows.length > 0 ? (
                  <div style={{
                    background: 'rgba(255,255,255,0.03)',
                    borderRadius: '12px',
                    padding: '4px 14px',
                    border: '1px solid rgba(255,255,255,0.06)',
                  }}>
                    {snapshotRows.map((row, i) => (
                      <div key={row.label} style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '12px 0',
                        borderTop: i > 0 ? '1px solid rgba(255,255,255,0.06)' : 'none',
                      }}>
                        <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.45)', fontWeight: 500 }}>
                          {row.label}
                        </span>
                        <span style={{ fontSize: '14px', color: row.color || '#fff', fontWeight: 600 }}>
                          {row.value}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{
                    background: 'rgba(255,255,255,0.03)',
                    borderRadius: '12px',
                    padding: '24px 14px',
                    textAlign: 'center' as const,
                    border: '1px solid rgba(255,255,255,0.06)',
                  }}>
                    <div style={{ fontSize: '24px', marginBottom: '8px', opacity: 0.5 }}>🔍</div>
                    <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', lineHeight: '1.5' }}>
                      Run AnalyzeBot to unlock<br />item intelligence data
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {sectionDivider}

          {/* ── SECTION 5: QUICK ACTIONS ── */}
          <div style={{ padding: '20px 20px 0' }}>
            {sectionHeader("\u2699\uFE0F", "Quick Actions", "manage")}

            {!collapsed.manage && (
              <>
                {ghostBtn("\u{1F4C1}", "View Full Item Dashboard", () => router.push(`/items/${item.id}`))}
                {ghostBtn("\u270F\u{FE0F}", "Edit Item Details", () => router.push(`/items/${item.id}/edit`))}
                {ghostBtn("\u{1F4AC}", "Messages & Conversations", () => router.push(`/messages?itemId=${item.id}`),
                  (item.unreadMsgs ?? 0) > 0 ? `${item.unreadMsgs}` : undefined
                )}

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
                  onMouseEnter={(e) => {
                    if (!shareCopied) {
                      (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)';
                      (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.15)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!shareCopied) {
                      (e.currentTarget as HTMLElement).style.background = 'transparent';
                      (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.08)';
                    }
                  }}
                >
                  <span style={{ fontSize: '16px', width: '22px', textAlign: 'center' as const, flexShrink: 0 }}>
                    {shareCopied ? '\u2713' : '\u{1F517}'}
                  </span>
                  <span style={{ flex: 1 }}>{shareCopied ? 'Link Copied!' : 'Copy Share Link'}</span>
                  {!shareCopied && <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: '13px', flexShrink: 0 }}>{"\u2192"}</span>}
                </button>

                {ghostBtn("\u{1F4F7}", "Add New Item", () => { onClose(); router.push("/items/new"); })}

                {/* Danger zone */}
                <div style={{
                  marginTop: '16px',
                  paddingTop: '14px',
                  borderTop: '1px solid rgba(239,68,68,0.12)',
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
                        border: '1px solid rgba(239,68,68,0.15)',
                        borderRadius: '12px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: 500,
                        color: 'rgba(239,68,68,0.7)',
                        textAlign: 'left' as const,
                        transition: 'all 0.2s ease',
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.06)';
                        (e.currentTarget as HTMLElement).style.borderColor = 'rgba(239,68,68,0.3)';
                        (e.currentTarget as HTMLElement).style.color = '#ef4444';
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLElement).style.background = 'transparent';
                        (e.currentTarget as HTMLElement).style.borderColor = 'rgba(239,68,68,0.15)';
                        (e.currentTarget as HTMLElement).style.color = 'rgba(239,68,68,0.7)';
                      }}
                    >
                      <span style={{ fontSize: '16px', width: '22px', textAlign: 'center' as const }}>🗑️</span>
                      <span style={{ flex: 1 }}>Delete Item</span>
                    </button>
                  ) : (
                    <div style={{
                      padding: '14px',
                      borderRadius: '12px',
                      background: 'rgba(239,68,68,0.04)',
                      border: '1px solid rgba(239,68,68,0.15)',
                    }}>
                      <div style={{
                        fontSize: '13px',
                        color: 'rgba(255,255,255,0.6)',
                        textAlign: 'center' as const,
                        marginBottom: '12px',
                        lineHeight: '1.5',
                      }}>
                        Delete <strong style={{ color: '#fff' }}>{title.length > 30 ? title.slice(0, 27) + '...' : title}</strong>?<br />
                        <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)' }}>This cannot be undone. All data will be lost.</span>
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
              </>
            )}
          </div>

          {/* ── FOOTER ── */}
          <div style={{
            padding: '24px 0 34px',
            textAlign: 'center' as const,
            borderTop: '1px solid rgba(255,255,255,0.04)',
            marginTop: '24px',
          }}>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.15)', fontWeight: 600, letterSpacing: '0.08em' }}>
              LEGACYLOOP
            </div>
            <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.08)', marginTop: '2px' }}>
              Press <span style={{ fontWeight: 600 }}>ESC</span> to close
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
