"use client";

/**
 * ItemControlCenter — extracted from ItemDashboardPanels.tsx
 * (measured L8853–9700) via CMD-CYL-6-ITEM-CONTROL-CENTER-EXTRACT
 * (V18 · 2026-05-01).
 *
 * Structural refactor only. ZERO behavior change. ZERO visual change.
 * Renders the unified status pipeline + price set + readiness HUD +
 * accordion sub-sections (Sell · List & Promote · Manage · Post-Sale)
 * + quick-nav keycap row at the top of the item detail page.
 *
 * Mount site: app/items/[id]/ItemDashboardPanels.tsx (post-extraction
 * single-line `<ItemControlCenter {...} />`). All state is internal.
 * All closures resolve via props. Single useEffect (refund fetch ·
 * deps [itemId, status]).
 */

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { GlassCard, PanelHeader, ICCChip } from "./ItemDashboardPanels";
import SaleAssignment from "./SaleAssignment";
import TradeToggle from "./TradeToggle";

const STATUS_FLOW = [
  { key: "DRAFT", label: "Draft", icon: "📝" },
  { key: "ANALYZED", label: "Analyzed", icon: "🔍" },
  { key: "READY", label: "Ready", icon: "✅" },
  { key: "LISTED", label: "Listed", icon: "📢" },
  { key: "INTERESTED", label: "Interest", icon: "💬" },
  { key: "OFFER_PENDING", label: "Offer", icon: "🤝" },
  { key: "SOLD", label: "Sold", icon: "💰" },
  { key: "SHIPPED", label: "Shipped", icon: "📦" },
  { key: "COMPLETED", label: "Done", icon: "🎉" },
];

/**
 * Props for ItemControlCenter — derived verbatim from the inline
 * destructure at the original declaration site (ItemDashboardPanels.tsx
 * measured L8868). DO NOT change names or types · the mount site at
 * ItemDashboardPanels.tsx (measured L10549) passes these by exact name.
 */
export type ItemControlCenterProps = {
  itemId: string;
  status: string;
  valuation: any;
  aiData: any;
  listingPrice?: number | null;
  collapsed?: boolean;
  onToggle?: () => void;
  photos?: any[];
  category?: string | null;
  extra?: { totalViews: number; inquiries: number; buyersFound: number; documentCount: number; updatedAt: string; shippingReady: boolean };
  shippingData?: { weight: number | null; length: number | null; width: number | null; height: number | null; isFragile: boolean; preference: string; aiWeightLbs: number | null; aiDimsEstimate: string | null; aiShippingDifficulty: string | null; aiShippingNotes: string | null; aiShippingConfidence: number | null };
  projectId?: string | null;
  pricingConsensus?: import("@/lib/pricing/reconcile").PricingConsensus | null;
  // CMD-ICC-BOT-NETWORK-ORCHESTRATION: bot signal sources for the
  // Bot Suggestions row + In-Person GS HUD. All optional — chips
  // hide gracefully when absent.
  v8CalcData?: { listPrice: number; acceptPrice: number; floorPrice: number } | null;
  listBotResult?: any;
  buyerBotResult?: any;
};

export default function ItemControlCenter({ itemId, status, valuation, aiData, listingPrice: initialListingPrice, collapsed, onToggle, photos, category, extra, shippingData, projectId, pricingConsensus, v8CalcData, listBotResult, buyerBotResult }: ItemControlCenterProps) {
  const router = useRouter();
  const [updating, setUpdating] = useState(false);
  const [priceInput, setPriceInput] = useState(initialListingPrice ? String(initialListingPrice) : "");
  const [priceSaveState, setPriceSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [shareCopied, setShareCopied] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [refundRequests, setRefundRequests] = useState<any[]>([]);
  const [refundLoading, setRefundLoading] = useState(false);
  const [refundActionLoading, setRefundActionLoading] = useState<string | null>(null);
  const [relistLoading, setRelistLoading] = useState(false);
  const [showReturnsInfo, setShowReturnsInfo] = useState(false);
  const [showMoreActions, setShowMoreActions] = useState(false);
  const [showReadiness, setShowReadiness] = useState(false);
  const [exportDone, setExportDone] = useState(false);
  const [publicLinkCopied, setPublicLinkCopied] = useState(false);
  const currentIdx = STATUS_FLOW.findIndex((s) => s.key === status);

  const updateStatus = async (newStatus: string) => {
    setUpdating(true);
    try {
      await fetch(`/api/items/status/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      router.refresh();
    } catch {
      // keep updating state on error
    } finally {
      setUpdating(false);
    }
  };

  const shareItem = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/items/${itemId}`);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    } catch {}
  };

  const deleteItem = async () => {
    if (!confirm("Delete this item? This cannot be undone.")) return;
    setDeleting(true);
    try {
      await fetch(`/api/items/delete/${itemId}`, { method: "DELETE" });
      router.push("/dashboard");
    } catch { setDeleting(false); }
  };

  // ── Refund fetch + handlers ──
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!["SOLD", "SHIPPED", "COMPLETED"].includes(status)) return;
    setRefundLoading(true);
    fetch("/api/refunds")
      .then(r => r.json())
      .then(data => {
        const itemRefunds = (data.refunds || []).filter((r: any) => r.itemId === itemId);
        setRefundRequests(itemRefunds);
      })
      .catch(() => {})
      .finally(() => setRefundLoading(false));
  }, [itemId, status]);

  async function relistItem() {
    if (!confirm("Relist this item? It will move back to LISTED status and be visible to buyers again.")) return;
    setRelistLoading(true);
    try {
      await fetch(`/api/items/status/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "LISTED" }),
      });
      router.refresh();
    } catch {}
    setRelistLoading(false);
  }

  async function handleRefund(action: "approve" | "deny") {
    const msg = action === "approve"
      ? "Approve this refund? The item will be relisted and earnings marked as refunded. Processing fee is non-refundable."
      : "Deny this refund request?";
    if (!confirm(msg)) return;
    setRefundActionLoading(action);
    try {
      await fetch(`/api/refunds/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      router.refresh();
    } catch {}
    setRefundActionLoading(null);
  }

  // Quick actions based on current status
  type ActionDef = { label: string; onClick: () => void; primary?: boolean; danger?: boolean };
  const actions: ActionDef[] = [];
  if (status === "DRAFT") {
    actions.push({ label: "\u{1F9E0} Run AI Analysis", onClick: () => { router.push(`/items/${itemId}?analyze=true`); }, primary: true });
    actions.push({ label: "\u{1F4DD} Edit Item", onClick: () => { router.push(`/items/${itemId}/edit`); } });
  }
  if (status === "ANALYZED" || status === "READY") {
    actions.push({ label: "\u{1F4E2} Mark as Listed", onClick: () => updateStatus("LISTED"), primary: true });
    actions.push({ label: "\u26A1 Run MegaBot", onClick: () => { router.push(`/bots/megabot?itemId=${itemId}`); } });
    actions.push({ label: "\u{1F4DD} Edit Item", onClick: () => { router.push(`/items/${itemId}/edit`); } });
  }
  if (status === "LISTED") {
    actions.push({ label: "\u{1F4AC} Mark Interest", onClick: () => updateStatus("INTERESTED") });
    actions.push({ label: "\u{1F4B0} Mark as Sold", onClick: () => updateStatus("SOLD"), primary: true });
    actions.push({ label: "\u26A1 Run MegaBot", onClick: () => { router.push(`/bots/megabot?itemId=${itemId}`); } });
  }
  if (status === "INTERESTED") {
    actions.push({ label: "\u{1F4B0} Mark as Sold", onClick: () => updateStatus("SOLD"), primary: true });
    actions.push({ label: "\u{1F4E2} Back to Listed", onClick: () => updateStatus("LISTED") });
  }
  if (status === "SOLD") {
    actions.push({ label: "\u{1F4E6} Ship Now \u2193", onClick: () => {
      const el = document.getElementById("shipping-panel");
      if (el) el.scrollIntoView({ behavior: "smooth" });
    }, primary: true });
    actions.push({ label: "\u{1F389} Mark Completed", onClick: () => updateStatus("COMPLETED") });
  }
  if (status === "SHIPPED") {
    actions.push({ label: "\u{1F389} Mark Completed", onClick: () => updateStatus("COMPLETED"), primary: true });
  }
  // Universal actions
  if (status !== "COMPLETED") {
    actions.push({ label: shareCopied ? "\u2713 Copied!" : "\u{1F4E4} Share", onClick: shareItem });
  }
  if (!["SOLD", "SHIPPED", "COMPLETED"].includes(status)) {
    actions.push({ label: "\u{1F5D1}\u{FE0F} Delete", onClick: deleteItem, danger: true });
  }

  const price = valuation?.estimatedPriceLow ?? null;
  const priceHigh = valuation?.estimatedPriceHigh ?? null;

  // Net earnings preview
  const listPriceNum = parseFloat(priceInput) || 0;
  const commissionEst = Math.round(listPriceNum * 0.05 * 100) / 100;
  const sellerFeeEst = Math.round(listPriceNum * 0.0175 * 100) / 100;
  const netEst = Math.round((listPriceNum - commissionEst - sellerFeeEst) * 100) / 100;

  // CMD-CONFIDENCE-WIRING-FIX: AnalyzeBot identification confidence is the
  // canonical "Confidence" scalar for the headline HUD row. Matches the
  // pills-row ConfidencePill mount (page.tsx:451-452). Pricing-source
  // agreement (consensusConfidence) is INTENTIONALLY demoted to fallback ·
  // its disagreement signal is already surfaced via lib/pricing/reconcile.ts:521
  // 131% banner on a separate UI surface. Fixes 5-way "CONFIDENCE" label
  // divergence + auto-fire credit-burn loop.
  const rawConf = aiData?.confidence != null
    ? aiData.confidence
    : valuation?.confidence ?? pricingConsensus?.consensusConfidence ?? 0;
  const confPct = Math.round(rawConf > 1 ? rawConf : rawConf * 100);

  // ── Sub-accordion state ──
  const [openSections, setOpenSections] = useState<Set<string>>(new Set(["sell"]));
  const toggleSection = (id: string) => setOpenSections(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  // Sub-section header — theme-aware high-tech command style
  const SubHeader = ({ id, icon, title, hudContent }: { id: string; icon: string; title: string; hudContent?: React.ReactNode }) => {
    const isOpen = openSections.has(id);
    return (
      <button onClick={() => toggleSection(id)} style={{
        display: "flex", alignItems: "center", gap: "0.4rem",
        width: "100%", background: isOpen ? "rgba(0,188,212,0.05)" : "transparent",
        border: "none", borderBottom: `1px solid ${isOpen ? "rgba(0,188,212,0.12)" : "var(--border-default)"}`,
        padding: "0.45rem 0.6rem", cursor: "pointer", transition: "all 0.2s ease",
      }}>
        <span style={{ fontSize: "0.65rem", width: "18px", textAlign: "center" as const, flexShrink: 0 }}>{icon}</span>
        <span style={{ fontSize: "0.56rem", fontWeight: 800, color: isOpen ? "var(--accent)" : "var(--text-muted)", letterSpacing: "0.1em", textTransform: "uppercase" as const, whiteSpace: "nowrap" as const, transition: "color 0.2s" }}>{title}</span>
        <div style={{ flex: 1, height: "1px", background: isOpen ? "linear-gradient(90deg, rgba(0,188,212,0.2), transparent)" : "var(--border-default)", transition: "background 0.3s" }} />
        <div style={{ display: "flex", alignItems: "center", gap: "0.3rem", flexShrink: 0 }}>
          {!isOpen && hudContent}
          <span style={{ fontSize: "0.55rem", color: isOpen ? "var(--accent)" : "var(--text-muted)", transform: isOpen ? "rotate(0deg)" : "rotate(-90deg)", transition: "all 0.25s ease", flexShrink: 0 }}>▾</span>
        </div>
      </button>
    );
  };

  // HUD badge helper — theme-aware
  const HudBadge = ({ text, color = "var(--text-muted)" }: { text: string; color?: string }) => (
    <span style={{ fontSize: "0.5rem", fontWeight: 700, color, padding: "2px 6px", borderRadius: "4px", background: "var(--ghost-bg)", border: "1px solid var(--border-default)", whiteSpace: "nowrap" as const, letterSpacing: "0.03em" }}>{text}</span>
  );

  return (
    <GlassCard fullWidth>
      <PanelHeader icon={"\u{1F39B}\u{FE0F}"} title="Item Control Center" hasData={true} badge="COMMAND" collapsed={collapsed} onToggle={onToggle} />
      {collapsed && (() => {
        const STAGES: { key: string; label: string }[] = [
          { key: "DRAFT", label: "Draft" }, { key: "ANALYZED", label: "Analyzed" }, { key: "READY", label: "Ready" },
          { key: "LISTED", label: "Listed" }, { key: "INTERESTED", label: "Interest" }, { key: "SOLD", label: "Sold" },
          { key: "SHIPPED", label: "Shipped" }, { key: "COMPLETED", label: "Done" },
        ];
        const stageIdx = STAGES.findIndex(s => s.key === status);
        const checks = [
          (photos?.length ?? 0) > 0, !!aiData, !!valuation, !!initialListingPrice, shippingData?.weight != null,
        ];
        const readyScore = checks.filter(Boolean).length;
        const readyColor = readyScore >= 4 ? "#22c55e" : readyScore >= 2 ? "#f59e0b" : "#ef4444";
        const remaining = 5 - readyScore;
        const readySub = readyScore === 5 ? "Ready to list" : `${remaining} step${remaining !== 1 ? "s" : ""} left`;
        const priceStr = initialListingPrice
          ? `$${Math.round(initialListingPrice)}`
          : pricingConsensus?.consensusValueLow != null
          ? `$${pricingConsensus.consensusValueLow}\u2013${pricingConsensus.consensusValueHigh}`
          : valuation?.low != null
          ? `$${Math.round(valuation.low)}\u2013${Math.round(valuation.high)}`
          : "\u2014";
        const priceSub = initialListingPrice
          ? "asking"
          : pricingConsensus?.consensusValueLow != null
          ? "reconciled"
          : valuation ? "AI range" : "Set a price";
        const views = extra?.totalViews ?? 0;
        const confColor = confPct >= 80 ? "#22c55e" : confPct >= 50 ? "#f59e0b" : confPct > 0 ? "#ef4444" : "var(--text-muted)";
        const confSub = confPct >= 80 ? "High" : confPct >= 50 ? "Medium" : confPct > 0 ? "Low" : "";
        return (
          <div style={{ padding: "8px 12px 10px", display: "flex", flexDirection: "column", gap: "6px", width: "100%", maxWidth: "100%", overflow: "hidden", boxSizing: "border-box" }}>
            {/* Row 1 — Pipeline Bar with Labels */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", width: "100%", height: "52px", padding: "4px 0" }}>
              {STAGES.map((s, i) => {
                const isCurrent = i === stageIdx;
                const isPast = i < stageIdx;
                return (
                  <div key={s.key} style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1, position: "relative" }}>
                    <div style={{ display: "flex", alignItems: "center", width: "100%", justifyContent: "center", height: "20px" }}>
                      {i > 0 && (
                        <div style={{ flex: 1, height: 2, background: isPast ? "var(--accent, #00bcd4)" : "var(--border-default)", opacity: isPast ? 1 : 0.5 }} />
                      )}
                      <div style={{ width: isCurrent ? 10 : 8, height: isCurrent ? 10 : 8, borderRadius: "50%", flexShrink: 0, background: isPast || isCurrent ? "var(--accent, #00bcd4)" : "var(--text-muted)", opacity: isPast || isCurrent ? 1 : 0.4, boxShadow: isCurrent ? "0 0 0 4px rgba(0,188,212,0.15), 0 0 12px rgba(0,188,212,0.4)" : "none", transition: "all 0.3s ease" }} />
                      {i < STAGES.length - 1 && (
                        <div style={{ flex: 1, height: 2, background: isPast ? "var(--accent, #00bcd4)" : "var(--border-default)", opacity: isPast ? 1 : 0.5 }} />
                      )}
                    </div>
                    <div style={{ fontSize: "8px", fontFamily: "var(--font-data)", textTransform: "uppercase" as const, letterSpacing: "0.06em", marginTop: "4px", color: isCurrent ? "var(--accent, #00bcd4)" : isPast ? "var(--text-secondary)" : "var(--text-muted)", fontWeight: isCurrent ? 700 : isPast ? 500 : 400, whiteSpace: "nowrap" as const, overflow: "hidden", textOverflow: "ellipsis", maxWidth: "100%", textAlign: "center" as const }}>{s.label}</div>
                  </div>
                );
              })}
            </div>

            {/* Row 2 — 4 Metric Cards (single glass surface) */}
            <div className="hud-metric-grid" style={{ background: "var(--ghost-bg)", borderRadius: 8, border: "1px solid var(--border-default)", overflow: "hidden" }}>
              {[
                { lbl: "ASKING", val: priceStr, color: "var(--accent, #00bcd4)", sub: priceSub },
                { lbl: "Confidence", val: confPct > 0 ? `${confPct}%` : "\u2014", color: confColor, sub: confSub },
                { lbl: "ACTIVITY", val: String(views), color: views > 0 ? "var(--accent, #00bcd4)" : "var(--text-muted)", sub: views > 0 ? `${views} views` : "No activity" },
                { lbl: "READY", val: `${readyScore}/5`, color: readyColor, sub: readySub },
              ].map((m, i) => (
                <div key={m.lbl} style={{ padding: "10px 8px", borderRight: i < 3 ? "1px solid var(--border-default)" : "none", overflow: "hidden", boxSizing: "border-box" }}>
                  <div style={{ fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)", fontWeight: 600 }}>{m.lbl}</div>
                  <div style={{ fontSize: "17px", fontWeight: 700, fontFamily: "var(--font-data)", color: m.color, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{m.val}</div>
                  <div style={{ fontSize: "9px", color: "var(--text-muted)" }}>{m.sub}</div>
                </div>
              ))}
            </div>

            {/* CMD-ICC-BOT-NETWORK-ORCHESTRATION: In-Person GS HUD
                (3-cell row — LIST / ACCEPT / FLOOR). Renders only when
                v8CalcData is present; hidden gracefully otherwise. */}
            {v8CalcData && (
              <div style={{
                display: "grid",
                gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr) minmax(0,1fr)",
                gap: "1px",
                background: "var(--border-default)",
                borderRadius: 6,
                overflow: "hidden",
              }}>
                {[
                  { lbl: "LIST", val: `$${Math.round(v8CalcData.listPrice)}`, color: "#00bcd4" },
                  { lbl: "ACCEPT", val: `$${Math.round(v8CalcData.acceptPrice)}`, color: "#22c55e" },
                  { lbl: "FLOOR", val: `$${Math.round(v8CalcData.floorPrice)}`, color: "#f59e0b" },
                ].map((t) => (
                  <div key={t.lbl} style={{ padding: "6px 8px", background: "var(--ghost-bg)", textAlign: "center" as const, overflow: "hidden" }}>
                    <div style={{ fontSize: "8px", fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: "0.08em", color: "var(--text-muted)" }}>{t.lbl}</div>
                    <div style={{ fontSize: "13px", fontWeight: 700, fontFamily: "var(--font-data)", color: t.color, whiteSpace: "nowrap" as const, overflow: "hidden", textOverflow: "ellipsis" }}>{t.val}</div>
                  </div>
                ))}
              </div>
            )}

            {/* CMD-ICC-BOT-NETWORK-ORCHESTRATION + CMD-BOT-WIRE-LOCAL-COMPS-
                COUNT-TELEMETRY: Bot Suggestions row — chips from AnalyzeBot
                V9 (_specialtyDetail), ListBot, BuyerBot, local-classifieds
                comps count. Renders nothing when no signals available. */}
            {(() => {
              const specialtyLabel = aiData?._specialtyDetail?.variant
                ?? aiData?._specialtyDetail?.era
                ?? null;
              const topPlatform = listBotResult?.best_platform
                ?? listBotResult?.top_platforms?.[0]
                ?? null;
              const topBuyer = buyerBotResult?.buyer_profiles?.[0]?.type
                ?? buyerBotResult?.hot_leads?.[0]?.buyer_type
                ?? null;
              const localCompsCount = (pricingConsensus?.sources ?? [])
                .find((s: any) => s.name === "local_comps_median")?.count ?? 0;
              if (!specialtyLabel && !topPlatform && !topBuyer && localCompsCount === 0) return null;
              return (
                <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" as const, minWidth: 0 }}>
                  {specialtyLabel && <ICCChip icon="\u{1F3AF}" label={String(specialtyLabel)} color="#00bcd4" />}
                  {topPlatform && <ICCChip icon="\u{1F4CB}" label={`List on ${topPlatform}`} color="#a78bfa" />}
                  {topBuyer && <ICCChip icon="\u{1F465}" label={String(topBuyer)} color="#3b82f6" />}
                  {localCompsCount > 0 && <ICCChip icon="\u{1F332}" label={`${localCompsCount} local comps`} color="#D4A017" />}
                </div>
              );
            })()}

            {/* Row 3 — Context Line */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", height: "28px" }}>
              {(category || aiData?.category) && <span style={{ fontSize: "0.55rem", padding: "2px 8px", borderRadius: "9999px", border: "1px solid rgba(0,188,212,0.2)", color: "var(--text-secondary)", fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "45%" }}>{category || aiData.category}</span>}
              <span style={{ fontSize: "0.55rem", color: extra?.shippingReady ? "#22c55e" : "var(--text-muted)", flexShrink: 0 }}>{extra?.shippingReady ? "\u{1F4E6} Ship ready" : "\u{1F4E6} Needs setup"}</span>
            </div>
          </div>
        );
      })()}
      <div style={{ display: collapsed ? "none" : "flex", flexDirection: "column" as const, flex: 1 }}>
      <div style={{ padding: "0.5rem 0.75rem" }}>

        {/* ── STATUS PROGRESS BAR ── */}
        <div style={{ marginBottom: "0.5rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "0.4rem" }}>
            <span style={{ fontSize: "0.62rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Status</span>
            <span style={{ fontSize: "0.62rem", color: "var(--text-muted)" }}>Step {currentIdx + 1} of {STATUS_FLOW.length} {"\u00B7"} {Math.round(((currentIdx + 1) / STATUS_FLOW.length) * 100)}%</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 0, position: "relative" }}>
            {STATUS_FLOW.map((s, i) => {
              const isPast = i < currentIdx;
              const isCurrent = i === currentIdx;
              return (
                <div key={s.key} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", position: "relative" }}>
                  {i > 0 && (
                    <div style={{
                      position: "absolute", top: "0.7rem", right: "50%", width: "100%", height: "2px",
                      background: isPast || isCurrent ? "var(--accent)" : "var(--ghost-bg)",
                      zIndex: 0,
                    }} />
                  )}
                  <div style={{
                    width: isCurrent ? "1.6rem" : "1.3rem",
                    height: isCurrent ? "1.6rem" : "1.3rem",
                    borderRadius: "50%",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: isCurrent ? "0.75rem" : "0.65rem",
                    background: isPast ? "var(--accent)" : isCurrent ? "var(--accent)" : "var(--ghost-bg)",
                    border: isCurrent ? "2px solid var(--accent)" : "1px solid " + (isPast ? "var(--accent)" : "var(--border-default)"),
                    boxShadow: isCurrent ? "0 0 10px rgba(0,188,212,0.4)" : "none",
                    color: isPast || isCurrent ? "#fff" : "var(--text-muted)",
                    zIndex: 1, position: "relative",
                    transition: "all 0.3s",
                  }}>
                    {isPast ? "\u2713" : s.icon}
                  </div>
                  <div style={{
                    fontSize: "0.65rem", fontWeight: isCurrent ? 800 : 400,
                    color: isCurrent ? "var(--accent)" : isPast ? "var(--text-secondary)" : "var(--text-muted)",
                    marginTop: "0.25rem", textAlign: "center", whiteSpace: "nowrap",
                  }}>
                    {s.label}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* CMD-ICC-BOT-NETWORK-ORCHESTRATION: Expanded-view mirror of
            In-Person GS HUD + Bot Suggestions chips. Same signal sources
            as the collapsed view — hidden gracefully when absent. */}
        {v8CalcData && (
          <div style={{
            display: "grid",
            gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr) minmax(0,1fr)",
            gap: "2px",
            marginBottom: "0.5rem",
            background: "var(--border-default)",
            borderRadius: 6,
            overflow: "hidden",
          }}>
            {[
              { lbl: "LIST", val: `$${Math.round(v8CalcData.listPrice)}`, color: "#00bcd4", sub: "In-Person" },
              { lbl: "ACCEPT", val: `$${Math.round(v8CalcData.acceptPrice)}`, color: "#22c55e", sub: "Sweet spot" },
              { lbl: "FLOOR", val: `$${Math.round(v8CalcData.floorPrice)}`, color: "#f59e0b", sub: "Walk-away" },
            ].map((t) => (
              <div key={t.lbl} style={{ padding: "8px 10px", background: "var(--ghost-bg)", textAlign: "center" as const, overflow: "hidden" }}>
                <div style={{ fontSize: "9px", fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.08em", color: "var(--text-muted)" }}>{t.lbl}</div>
                <div style={{ fontSize: "16px", fontWeight: 700, fontFamily: "var(--font-data)", color: t.color, whiteSpace: "nowrap" as const, overflow: "hidden", textOverflow: "ellipsis", marginTop: "2px" }}>{t.val}</div>
                <div style={{ fontSize: "9px", color: "var(--text-muted)", marginTop: "1px" }}>{t.sub}</div>
              </div>
            ))}
          </div>
        )}
        {(() => {
          const specialtyLabel = aiData?._specialtyDetail?.variant
            ?? aiData?._specialtyDetail?.era
            ?? null;
          const topPlatform = listBotResult?.best_platform
            ?? listBotResult?.top_platforms?.[0]
            ?? null;
          const topBuyer = buyerBotResult?.buyer_profiles?.[0]?.type
            ?? buyerBotResult?.hot_leads?.[0]?.buyer_type
            ?? null;
          const localCompsCount = (pricingConsensus?.sources ?? [])
            .find((s: any) => s.name === "local_comps_median")?.count ?? 0;
          if (!specialtyLabel && !topPlatform && !topBuyer && localCompsCount === 0) return null;
          return (
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" as const, minWidth: 0, marginBottom: "0.5rem" }}>
              {specialtyLabel && <ICCChip icon="\u{1F3AF}" label={String(specialtyLabel)} color="#00bcd4" />}
              {topPlatform && <ICCChip icon="\u{1F4CB}" label={`List on ${topPlatform}`} color="#a78bfa" />}
              {topBuyer && <ICCChip icon="\u{1F465}" label={String(topBuyer)} color="#3b82f6" />}
              {localCompsCount > 0 && <ICCChip icon="\u{1F332}" label={`${localCompsCount} local comps`} color="#D4A017" />}
            </div>
          );
        })()}

        {/* ── AI SUGGESTED NEXT ACTION ── */}
        {(() => {
          const hasPhotos = (photos?.length ?? 0) > 0;
          const hasAnalysis = !!aiData;
          const hasPrice = !!initialListingPrice;
          const views = extra?.totalViews ?? 0;
          const msg = status === "DRAFT" && !hasPhotos ? "\u{1F4F8} Add photos to get started \u2014 AI needs at least 1 image"
            : status === "DRAFT" && hasPhotos && !hasAnalysis ? "\u{1F9E0} Ready for AI \u2014 tap Run AI Analysis above"
            : (status === "ANALYZED" || status === "READY") && !hasPrice ? `\u{1F4B0} Set a listing price${valuation ? ` \u2014 AI suggests $${Math.round(valuation.low || 0)}\u2013$${Math.round(valuation.high || 0)}` : ""}`
            : (status === "ANALYZED" || status === "READY") && hasPrice ? "\u{1F4E2} Ready to list! Mark as Listed to go live"
            : status === "LISTED" && views === 0 ? "\u23F3 Just listed \u2014 share your link to attract buyers"
            : status === "LISTED" && views > 0 ? "\u{1F4CA} Getting views! Check messages for inquiries"
            : status === "INTERESTED" ? "\u{1F91D} Buyers interested \u2014 check messages and close the sale"
            : status === "SOLD" ? "\u{1F4E6} Congrats! Ship within 3 days for best rating"
            : status === "SHIPPED" ? "\u{1F4EC} Package on its way \u2014 mark complete when delivered"
            : status === "COMPLETED" ? "\u{1F389} All done! Create a new listing or check earnings"
            : null;
          if (!msg) return null;
          return (
            <div style={{ padding: "0.4rem 0.6rem", marginBottom: "0.5rem", borderRadius: "0.4rem", borderLeft: "3px solid var(--accent)", background: "var(--ghost-bg)", fontSize: "0.68rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>
              {msg}
            </div>
          );
        })()}

        {/* ── TELEMETRY BAR \u2014 Inline KPIs ── */}
        <div style={{
          display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap",
          padding: "0.4rem 0.6rem", marginBottom: "0.5rem",
          background: "var(--ghost-bg)",
          borderRadius: "0.5rem", border: "1px solid rgba(0,188,212,0.1)",
        }}>
          {(photos?.length ?? 0) > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: "0.2rem" }}>
              <span style={{ fontSize: "0.6rem", color: "var(--text-muted)" }}>{"\u{1F4F7}"}</span>
              <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--text-primary)" }}>{photos!.length}</span>
              <span style={{ fontSize: "0.55rem", color: photos!.length >= 6 ? "#22c55e" : "var(--text-muted)" }}>{photos!.length >= 6 ? "\u2713" : "/6"}</span>
            </div>
          )}
          {confPct > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
              <div style={{ width: "28px", height: "4px", borderRadius: "2px", background: "var(--ghost-bg)", overflow: "hidden" }}>
                <div style={{ width: `${confPct}%`, height: "100%", borderRadius: "2px", background: confPct >= 80 ? "#22c55e" : confPct >= 50 ? "#eab308" : "#ef4444", transition: "width 0.5s ease" }} />
              </div>
              <span style={{ fontSize: "0.6rem", fontWeight: 700, color: confPct >= 80 ? "#22c55e" : confPct >= 50 ? "#eab308" : "#ef4444" }}>{confPct}%</span>
            </div>
          )}
          {(category || aiData?.category) && <span style={{ fontSize: "0.6rem", fontWeight: 600, color: "var(--text-secondary)" }}>{category || aiData.category}</span>}
          {valuation?.low != null && valuation?.high != null && <span style={{ fontSize: "0.65rem", fontWeight: 700, color: "#4ade80", letterSpacing: "-0.01em" }}>${Math.round(valuation.low)}{"\u2013"}${Math.round(valuation.high)}</span>}
          <div style={{ flex: 1 }} />
          {(extra?.totalViews ?? 0) > 0 && <div style={{ display: "flex", alignItems: "center", gap: "0.15rem" }}><span style={{ fontSize: "0.55rem", color: "var(--text-muted)" }}>{"\u{1F441}"}</span><span style={{ fontSize: "0.6rem", fontWeight: 600, color: "var(--text-secondary)" }}>{extra!.totalViews}</span></div>}
          {(extra?.inquiries ?? 0) > 0 && <div style={{ display: "flex", alignItems: "center", gap: "0.15rem" }}><span style={{ fontSize: "0.55rem", color: "#a78bfa" }}>{"\u{1F4AC}"}</span><span style={{ fontSize: "0.6rem", fontWeight: 600, color: "#a78bfa" }}>{extra!.inquiries}</span></div>}
          {(extra?.buyersFound ?? 0) > 0 && <div style={{ display: "flex", alignItems: "center", gap: "0.15rem" }}><span style={{ fontSize: "0.55rem", color: "#f59e0b" }}>{"\u{1F916}"}</span><span style={{ fontSize: "0.6rem", fontWeight: 600, color: "#f59e0b" }}>{extra!.buyersFound}</span></div>}
          {(extra?.documentCount ?? 0) > 0 && <div style={{ display: "flex", alignItems: "center", gap: "0.15rem" }}><span style={{ fontSize: "0.55rem", color: "var(--text-muted)" }}>{"\u{1F4C4}"}</span><span style={{ fontSize: "0.6rem", fontWeight: 600, color: "var(--text-secondary)" }}>{extra!.documentCount}</span></div>}
          {extra?.shippingReady && <span style={{ fontSize: "0.5rem", fontWeight: 700, color: "#22c55e", background: "rgba(34,197,94,0.08)", padding: "1px 5px", borderRadius: "4px" }}>SHIP {"\u2713"}</span>}
          {(() => {
            const checks = [
              { ok: (photos?.length ?? 0) > 0 }, { ok: !!aiData }, { ok: !!valuation },
              { ok: !!initialListingPrice }, { ok: shippingData?.weight != null },
            ];
            const score = checks.filter(c => c.ok).length;
            const color = score >= 4 ? "#22c55e" : score >= 2 ? "#f59e0b" : "#ef4444";
            return (
              <button onClick={() => setShowReadiness(!showReadiness)} style={{ padding: "1px 6px", borderRadius: "4px", fontSize: "0.55rem", fontWeight: 700, color, background: `${color}12`, border: `1px solid ${color}25`, cursor: "pointer" }}>
                {score}/5 {"\u2713"}
              </button>
            );
          })()}
        </div>

        {showReadiness && (
          <div style={{ padding: "0.4rem 0.6rem", marginBottom: "0.5rem", borderRadius: "0.4rem", borderLeft: "3px solid var(--accent)", background: "var(--ghost-bg)" }}>
            {[
              { ok: (photos?.length ?? 0) > 0, label: "Photos uploaded", fix: `/items/${itemId}/edit` },
              { ok: !!aiData, label: "AI analysis complete", fix: `/items/${itemId}` },
              { ok: !!valuation, label: "Valuation generated", fix: `/items/${itemId}` },
              { ok: !!initialListingPrice, label: "Listing price set", fix: null },
              { ok: shippingData?.weight != null, label: "Shipping info complete", fix: `/items/${itemId}/edit` },
            ].map((c, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.35rem", padding: "0.15rem 0", fontSize: "0.62rem" }}>
                <span style={{ color: c.ok ? "#22c55e" : "#ef4444" }}>{c.ok ? "\u2713" : "\u2717"}</span>
                <span style={{ color: c.ok ? "var(--text-secondary)" : "var(--text-primary)", fontWeight: c.ok ? 400 : 600 }}>{c.label}</span>
                {!c.ok && c.fix && <a href={c.fix} style={{ fontSize: "0.55rem", color: "var(--accent)", textDecoration: "none", marginLeft: "auto" }}>Fix {"\u2192"}</a>}
              </div>
            ))}
          </div>
        )}

        {/* ═══════════════════════════════════════════
           COMMAND SECTIONS
           ═══════════════════════════════════════════ */}
        <div style={{
          display: "flex", flexDirection: "column", gap: 0,
          borderRadius: "0.5rem", overflow: "hidden", marginBottom: "0.5rem",
          background: "var(--ghost-bg)",
          border: "1px solid rgba(0,188,212,0.15)",
          boxShadow: "0 2px 12px rgba(0,188,212,0.04)",
        }}>

          {/* ── 1. SELL ── */}
          <div style={{ borderLeft: openSections.has("sell") ? "2px solid var(--accent)" : "2px solid transparent", transition: "all 0.2s ease" }}>
            <SubHeader id="sell" icon={"\u{1F4B0}"} title="Sell" hudContent={<>
              {initialListingPrice ? <HudBadge text={`$${Math.round(initialListingPrice)}`} color="#00bcd4" /> : valuation?.low ? <HudBadge text={`$${Math.round(valuation.low)}\u2013$${Math.round(valuation.high)}`} color="#4ade80" /> : null}
              {listPriceNum > 0 && <HudBadge text={`net ~$${netEst.toFixed(0)}`} color="#22c55e" />}
            </>} />
            {openSections.has("sell") && (
              <div style={{ padding: "0.65rem 0.75rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {/* Primary + secondary action buttons */}
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                  {actions.filter(a => a.primary).map((a) => (
                    <button key={a.label} onClick={a.onClick} disabled={updating || deleting} style={{
                      padding: "0.5rem 1rem", borderRadius: "0.5rem", fontSize: "0.82rem", fontWeight: 700, cursor: "pointer",
                      background: "linear-gradient(135deg, #00bcd4, #0097a7)", border: "none", color: "#fff",
                      opacity: (updating || deleting) ? 0.5 : 1, boxShadow: "0 2px 8px rgba(0,188,212,0.25)", transition: "all 0.2s ease",
                      minHeight: "2.5rem",
                    }}>{a.label}</button>
                  ))}
                  {actions.filter(a => a.primary).length > 0 && actions.filter(a => !a.primary && !a.danger).length > 0 && (
                    <div style={{ width: "1px", height: "24px", background: "var(--border-default)" }} />
                  )}
                  {actions.filter(a => !a.primary && !a.danger).map((a) => (
                    <button key={a.label} onClick={a.onClick} disabled={updating || deleting} style={{
                      padding: "0.45rem 0.85rem", borderRadius: "0.45rem", fontSize: "0.78rem", fontWeight: 600, cursor: "pointer",
                      background: "transparent", border: "1px solid var(--border-default)", color: "var(--text-secondary)",
                      opacity: (updating || deleting) ? 0.5 : 1, minHeight: "2.5rem", transition: "all 0.15s ease",
                    }}>{a.label}</button>
                  ))}
                  {actions.filter(a => a.danger).map((a) => (
                    <button key={a.label} onClick={a.onClick} disabled={updating || deleting} style={{
                      padding: "0.4rem 0.65rem", borderRadius: "0.4rem", fontSize: "0.72rem", fontWeight: 600, cursor: "pointer",
                      background: "transparent", border: "1px solid rgba(239,68,68,0.2)", color: "#ef4444",
                      opacity: (updating || deleting) ? 0.5 : 1, marginLeft: "auto", minHeight: "2.25rem",
                    }}>{a.label}</button>
                  ))}
                </div>
                {/* Price input row */}
                <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", flexWrap: "wrap" }}>
                  <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--text-muted)" }}>$</span>
                  <input type="number" min="0" step="0.01" placeholder={valuation?.mid ? `${Math.round(valuation.mid)}` : "0"} value={priceInput} onChange={(e) => setPriceInput(e.target.value)} style={{
                    background: "var(--bg-card)", border: "1px solid rgba(0,188,212,0.2)", borderRadius: "0.4rem", padding: "0.4rem 0.5rem",
                    color: "var(--text-primary)", fontSize: "0.9rem", fontWeight: 700, fontFamily: "var(--font-data)", width: "85px", outline: "none",
                  }} />
                  <button onClick={async () => {
                    const val = parseFloat(priceInput); if (isNaN(val) || val < 0) return;
                    setPriceSaveState("saving");
                    try {
                      const res = await fetch(`/api/items/status/${itemId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ listingPrice: val }) });
                      if (res.ok) { setPriceSaveState("saved"); setTimeout(() => setPriceSaveState("idle"), 2000); }
                      else { setPriceSaveState("error"); setTimeout(() => setPriceSaveState("idle"), 2000); }
                    } catch { setPriceSaveState("error"); setTimeout(() => setPriceSaveState("idle"), 2000); }
                  }} disabled={priceSaveState === "saving"} style={{
                    background: priceSaveState === "saved" ? "#22c55e" : priceSaveState === "error" ? "#ef4444" : "linear-gradient(135deg, #00bcd4, #009688)",
                    border: "none", borderRadius: "0.4rem", padding: "0.4rem 0.75rem",
                    color: "#fff", fontWeight: 700, fontSize: "0.78rem",
                    cursor: priceSaveState === "saving" ? "wait" : "pointer", opacity: priceSaveState === "saving" ? 0.6 : 1,
                    minWidth: "44px", minHeight: "2.25rem", textAlign: "center" as const, boxShadow: "0 1px 4px rgba(0,188,212,0.2)",
                  }}>{priceSaveState === "saving" ? "\u23F3" : priceSaveState === "saved" ? "\u2713" : priceSaveState === "error" ? "\u2717" : "SET"}</button>
                  {listPriceNum > 0 && <span style={{ fontSize: "0.72rem", color: "#4ade80", fontWeight: 700, whiteSpace: "nowrap" }}>net ~${netEst.toFixed(0)}</span>}
                  <div style={{ flex: 1 }} />
                  {listPriceNum > 0 && <span style={{ fontSize: "0.62rem", color: "var(--text-muted)" }}>5% comm + 1.75% fee</span>}
                </div>
              </div>
            )}
          </div>

          {/* ── 2. LIST & PROMOTE ── */}
          <div style={{ borderLeft: openSections.has("list") ? "2px solid var(--accent)" : "2px solid transparent", transition: "all 0.2s ease" }}>
            <SubHeader id="list" icon={"\u{1F4E2}"} title="List & Promote" hudContent={<>
              {status === "LISTED" ? <HudBadge text="LIVE" color="#22c55e" /> : <HudBadge text="Not listed" />}
            </>} />
            {openSections.has("list") && (
              <div style={{ padding: "0.65rem 0.75rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {/* Action links as compact button row */}
                <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                  <a href={`/bots/listbot?itemId=${itemId}`} style={{
                    padding: "0.45rem 0.85rem", borderRadius: "0.45rem", fontSize: "0.78rem", fontWeight: 700,
                    background: "linear-gradient(135deg, rgba(0,188,212,0.1), rgba(0,188,212,0.03))",
                    border: "1px solid rgba(0,188,212,0.25)", color: "#00bcd4", textDecoration: "none",
                    display: "inline-flex", alignItems: "center", gap: "0.35rem", minHeight: "2.25rem",
                    boxShadow: "0 0 10px rgba(0,188,212,0.08)", transition: "all 0.2s ease",
                  }}>{"\u{1F310}"} List Everywhere</a>
                  <a href={`/addons/listing-optimizer?itemId=${itemId}`} style={{
                    padding: "0.45rem 0.85rem", borderRadius: "0.45rem", fontSize: "0.75rem", fontWeight: 600,
                    background: "transparent", border: "1px solid var(--border-default)", color: "var(--text-secondary)", textDecoration: "none",
                    display: "inline-flex", alignItems: "center", gap: "0.35rem", minHeight: "2.25rem",
                  }}>{"\u2728"} Optimize Listing</a>
                  <a href={`/bundles/create?itemId=${itemId}`} style={{
                    padding: "0.45rem 0.85rem", borderRadius: "0.45rem", fontSize: "0.75rem", fontWeight: 600,
                    background: "transparent", border: "1px solid var(--border-default)", color: "var(--text-secondary)", textDecoration: "none",
                    display: "inline-flex", alignItems: "center", gap: "0.35rem", minHeight: "2.25rem",
                  }}>{"\u{1F4E6}"} Create Bundle</a>
                </div>
                {/* Share row */}
                <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                  <button onClick={shareItem} style={{
                    padding: "0.4rem 0.75rem", borderRadius: "0.4rem", fontSize: "0.72rem", fontWeight: 600,
                    background: "transparent", border: "1px solid var(--border-default)", color: "var(--text-secondary)", cursor: "pointer", minHeight: "2rem",
                  }}>{shareCopied ? "\u2713 Copied!" : "\u{1F4E4} Share Link"}</button>
                  <button onClick={() => {
                    const url = `${typeof window !== "undefined" ? window.location.origin : ""}/store`;
                    navigator.clipboard.writeText(url);
                    setPublicLinkCopied(true); setTimeout(() => setPublicLinkCopied(false), 2000);
                  }} style={{
                    padding: "0.4rem 0.75rem", borderRadius: "0.4rem", fontSize: "0.72rem", fontWeight: 600,
                    background: "transparent", border: "1px solid var(--border-default)", color: "var(--text-secondary)", cursor: "pointer", minHeight: "2rem",
                  }}>{publicLinkCopied ? "\u2713 Copied!" : "\u{1F517} Store Link"}</button>
                  <a href="/bundles" style={{
                    padding: "0.4rem 0.75rem", borderRadius: "0.4rem", fontSize: "0.72rem", fontWeight: 600,
                    background: "transparent", border: "1px solid var(--border-default)", color: "var(--text-secondary)", textDecoration: "none",
                    display: "inline-flex", alignItems: "center", minHeight: "2rem",
                  }}>{"\u{1F4CB}"} My Bundles</a>
                </div>
              </div>
            )}
          </div>

          {/* ── 3. MANAGE ── */}
          <div style={{ borderLeft: openSections.has("manage") ? "2px solid var(--accent)" : "2px solid transparent", transition: "all 0.2s ease" }}>
            <SubHeader id="manage" icon={"\u2699\u{FE0F}"} title="Manage" hudContent={<>
              {projectId && <HudBadge text="Sale assigned" color="#00bcd4" />}
            </>} />
            {openSections.has("manage") && (
              <div style={{ padding: "0.65rem 0.75rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {/* Trade + Sale Assignment row */}
                <div style={{
                  display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap",
                  padding: "0.45rem 0.6rem", borderRadius: "0.45rem",
                  background: "linear-gradient(135deg, rgba(0,188,212,0.02), transparent)",
                  border: "1px solid rgba(0,188,212,0.06)",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                    <TradeToggle itemId={itemId} />
                  </div>
                  <div style={{ width: "1px", height: "20px", background: "var(--border-default)", opacity: 0.5 }} />
                  <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                    <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>{"\u{1F3F7}\u{FE0F}"}</span>
                    <SaleAssignment itemId={itemId} initialProjectId={projectId ?? null} />
                    {projectId && <span style={{ fontSize: "0.68rem", fontWeight: 600, padding: "2px 8px", borderRadius: "6px", background: "rgba(0,188,212,0.08)", color: "var(--accent)", border: "1px solid rgba(0,188,212,0.15)" }}>Assigned</span>}
                    {!projectId && <a href="/projects" style={{ fontSize: "0.68rem", color: "var(--accent)", textDecoration: "none", fontWeight: 600 }}>+ New</a>}
                  </div>
                  <div style={{ flex: 1 }} />
                  <button onClick={() => { const el = document.getElementById("active-offers-widget"); if (el) el.scrollIntoView({ behavior: "smooth" }); }} style={{
                    fontSize: "0.72rem", fontWeight: 600, color: "var(--accent)",
                    background: "rgba(0,188,212,0.06)", border: "1px solid rgba(0,188,212,0.12)",
                    borderRadius: "0.4rem", padding: "0.3rem 0.6rem", cursor: "pointer", minHeight: "2rem",
                  }}>{"\u{1F91D}"} Offers</button>
                </div>
                {/* Quick actions row */}
                <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                  <a href={`/items/${itemId}/edit`} style={{ padding: "0.4rem 0.75rem", borderRadius: "0.4rem", fontSize: "0.72rem", fontWeight: 600, background: "transparent", border: "1px solid var(--border-default)", color: "var(--text-secondary)", textDecoration: "none", minHeight: "2rem", display: "inline-flex", alignItems: "center" }}>{"\u270F\u{FE0F}"} Edit Item</a>
                  <a href={`/messages?itemId=${itemId}`} style={{ padding: "0.4rem 0.75rem", borderRadius: "0.4rem", fontSize: "0.72rem", fontWeight: 600, background: "transparent", border: "1px solid var(--border-default)", color: "var(--text-secondary)", textDecoration: "none", minHeight: "2rem", display: "inline-flex", alignItems: "center" }}>{"\u{1F4AC}"} Messages</a>
                  <button onClick={() => { window.print(); }} style={{ padding: "0.4rem 0.75rem", fontSize: "0.72rem", fontWeight: 600, background: "transparent", border: "1px solid var(--border-default)", borderRadius: "0.4rem", cursor: "pointer", color: "var(--text-secondary)", minHeight: "2rem" }}>{"\u{1F5A8}\u{FE0F}"} Print</button>
                  <button onClick={() => {
                    const blob = new Blob([JSON.stringify({ itemId, status, category, aiData, valuation, photos: photos?.map((p: any) => p.filePath) }, null, 2)], { type: "application/json" });
                    const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = `legacyloop-${itemId.slice(0, 8)}.json`; a.click(); URL.revokeObjectURL(url);
                    setExportDone(true); setTimeout(() => setExportDone(false), 2000);
                  }} style={{ padding: "0.4rem 0.75rem", fontSize: "0.72rem", fontWeight: 600, background: "transparent", border: "1px solid var(--border-default)", borderRadius: "0.4rem", cursor: "pointer", color: "var(--text-secondary)", minHeight: "2rem" }}>{exportDone ? "\u2713 Exported" : "\u{1F4E5} Export"}</button>
                </div>
              </div>
            )}
          </div>

          {/* ── 4. POST-SALE (conditional) ── */}
          {(status === "SOLD" || status === "SHIPPED" || status === "COMPLETED") && (
            <div style={{ borderLeft: openSections.has("postsale") ? "2px solid #22c55e" : "2px solid transparent", transition: "all 0.2s ease" }}>
              <SubHeader id="postsale" icon={"\u{1F3C6}"} title="Post-Sale" hudContent={<>
                {status === "SOLD" && <HudBadge text="Ship now" color="#f59e0b" />}
                {status === "SHIPPED" && <HudBadge text="In transit" color="#3b82f6" />}
                {status === "COMPLETED" && <HudBadge text="Complete" color="#22c55e" />}
              </>} />
              {openSections.has("postsale") && (
                <div style={{ padding: "0.4rem 0.5rem", display: "flex", flexDirection: "column", gap: "0.3rem" }}>
                  {/* Sale summary */}
                  {price && (
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <span style={{ fontSize: "0.5rem", fontWeight: 800, color: "#22c55e", background: "rgba(34,197,94,0.12)", padding: "2px 6px", borderRadius: "4px", letterSpacing: "0.06em" }}>SOLD</span>
                      <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--text-primary)" }}>${price}{"\u2013"}${priceHigh}</span>
                      {aiData?.category && <span style={{ fontSize: "0.6rem", color: "var(--text-muted)" }}>{"\u00B7"} {aiData.category}</span>}
                    </div>
                  )}
                  {/* Shipping bridge */}
                  {(status === "SOLD" || status === "SHIPPED") && (
                    <a href={`/shipping?itemId=${itemId}`} style={{
                      display: "flex", alignItems: "center", gap: "0.4rem", width: "100%",
                      padding: "0.35rem 0.5rem", borderRadius: "0.35rem",
                      background: "rgba(0,188,212,0.04)", border: "1px solid rgba(0,188,212,0.15)",
                      color: "#00bcd4", fontSize: "0.7rem", fontWeight: 600, textDecoration: "none",
                    }}>
                      <span>{"\u{1F4E6}"}</span>
                      <span style={{ flex: 1 }}>{status === "SOLD" ? "Shipping Center" : "Track Shipment"}</span>
                      <span style={{ fontSize: "0.55rem", color: "var(--text-muted)", fontWeight: 400 }}>{status === "SOLD" ? "Labels & carriers" : "Live status"}</span>
                      <span style={{ fontSize: "0.7rem" }}>{"\u2192"}</span>
                    </a>
                  )}
                  {/* Returns row */}
                  <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", flexWrap: "wrap" }}>
                    <button onClick={relistItem} disabled={relistLoading} style={{
                      padding: "0.2rem 0.5rem", borderRadius: "0.3rem", fontSize: "0.62rem", fontWeight: 600,
                      border: "1px solid rgba(0,188,212,0.15)", background: "rgba(0,188,212,0.03)",
                      color: "#00bcd4", cursor: relistLoading ? "wait" : "pointer", opacity: relistLoading ? 0.6 : 1,
                    }}>{relistLoading ? "..." : "\u{1F504} Relist Item"}</button>
                    <button onClick={() => setShowReturnsInfo(!showReturnsInfo)} style={{ fontSize: "0.55rem", fontWeight: 500, color: "var(--text-muted)", background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                      {showReturnsInfo ? "\u25B2" : "\u25BC"} Returns info
                    </button>
                    {!refundLoading && refundRequests.length === 0 && <span style={{ fontSize: "0.55rem", color: "var(--text-muted)", marginLeft: "auto", opacity: 0.6 }}>No refunds</span>}
                  </div>
                  {showReturnsInfo && (
                    <div style={{ fontSize: "0.58rem", color: "var(--text-muted)", lineHeight: 1.45, padding: "0.25rem 0.4rem", background: "var(--ghost-bg)", border: "1px solid var(--border-default)", borderRadius: "0.3rem" }}>
                      Buyer requests {"\u2192"} You approve/deny {"\u2192"} Auto-relist if approved {"\u2192"} Refund (minus processing fee)
                    </div>
                  )}
                  {/* Refund cards */}
                  {!refundLoading && refundRequests.length > 0 && refundRequests.map((r: any) => {
                    const isPending = r.type === "refund_requested";
                    const isApproved = r.type === "refund_approved";
                    const badge = isPending ? { label: "Pending", color: "#f59e0b", bg: "rgba(245,158,11,0.1)" }
                      : isApproved ? { label: "OK", color: "#22c55e", bg: "rgba(34,197,94,0.1)" }
                      : { label: "Denied", color: "#ef4444", bg: "rgba(239,68,68,0.1)" };
                    return (
                      <div key={r.id} style={{ padding: "0.25rem 0.4rem", borderRadius: "0.3rem", background: "var(--ghost-bg)", border: "1px solid var(--border-default)" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                          <span style={{ fontSize: "0.62rem", fontWeight: 600, color: "var(--text-primary)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>{r.data?.reason || "Refund"}</span>
                          {r.data?.refundAmount && <span style={{ fontSize: "0.55rem", color: "var(--text-muted)" }}>${Number(r.data.refundAmount).toFixed(2)}</span>}
                          <span style={{ fontSize: "0.5rem", fontWeight: 700, padding: "1px 5px", borderRadius: 6, background: badge.bg, color: badge.color }}>{badge.label}</span>
                          {isPending && (<>
                            <button onClick={() => handleRefund("approve")} disabled={refundActionLoading === "approve"} style={{ padding: "2px 8px", fontSize: "0.55rem", fontWeight: 700, borderRadius: 4, border: "none", background: "#22c55e", color: "#fff", cursor: "pointer", opacity: refundActionLoading === "approve" ? 0.5 : 1 }}>{"\u2713"}</button>
                            <button onClick={() => handleRefund("deny")} disabled={refundActionLoading === "deny"} style={{ padding: "2px 8px", fontSize: "0.55rem", fontWeight: 700, borderRadius: 4, border: "1px solid rgba(239,68,68,0.25)", background: "transparent", color: "#ef4444", cursor: "pointer", opacity: refundActionLoading === "deny" ? 0.5 : 1 }}>{"\u2717"}</button>
                          </>)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

        </div>{/* end accordion container */}

        {/* ── QUICK NAV — keycap buttons ── */}
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", justifyContent: "center", marginTop: "0.75rem", padding: "0 0.25rem" }}>
          {[
            { icon: "\u270F\u{FE0F}", label: "Edit", href: `/items/${itemId}/edit` },
            { icon: "+", label: "New", href: "/items/new" },
            { icon: "\u{1F3EA}", label: "Store", href: "/store" },
            { icon: "\u{1F4AC}", label: "Messages", href: `/messages?itemId=${itemId}` },
            { icon: "\u{1F4CA}", label: "Dashboard", href: "/dashboard" },
            { icon: "\u{1F4E6}", label: "Bundles", href: "/bundles" },
            { icon: "\u{1F916}", label: "Bots", href: "/bots" },
          ].map((link) => (
            <a key={link.label} href={link.href} style={{
              display: "inline-flex", flexDirection: "column" as const, alignItems: "center",
              justifyContent: "center", gap: "3px",
              padding: "8px 12px", minHeight: "48px", minWidth: "54px",
              borderRadius: "10px", textDecoration: "none",
              background: "var(--bg-card-solid)",
              border: "1px solid var(--border-default)",
              color: "var(--text-secondary)",
              boxShadow: "0 1px 3px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.04)",
              transition: "all 0.15s ease",
              cursor: "pointer",
              position: "relative" as const,
            }}
              onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.background = "rgba(0,188,212,0.12)";
                el.style.borderColor = "rgba(0,188,212,0.35)";
                el.style.color = "#00bcd4";
                el.style.transform = "translateY(-1px)";
                el.style.boxShadow = "0 2px 8px rgba(0,188,212,0.18), inset 0 1px 0 rgba(255,255,255,0.06)";
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.background = "var(--bg-card-solid)";
                el.style.borderColor = "var(--border-default)";
                el.style.color = "var(--text-secondary)";
                el.style.transform = "translateY(0)";
                el.style.boxShadow = "0 1px 3px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.04)";
              }}
            >
              <span style={{ fontSize: "16px", lineHeight: 1 }}>{link.icon}</span>
              <span style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase" as const, lineHeight: 1 }}>{link.label}</span>
            </a>
          ))}
        </div>

      </div>
      </div>
    </GlassCard>
  );
}
