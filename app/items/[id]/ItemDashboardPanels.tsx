"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import CollapsiblePanel from "@/app/components/CollapsiblePanel";
import RealShippingPanel from "./ShippingPanel";
import { suggestPackage, suggestShippingMethod } from "@/lib/shipping/package-suggestions";
import { getMetroEstimates } from "@/lib/shipping/metro-estimates";
import VehicleSpecsCard from "./VehicleSpecsCard";
import { detectCollectible } from "@/lib/collectible-detect";
import ItemIntelligenceSummary from "./ItemIntelligenceSummary";
import { PROCESSING_FEE } from "@/lib/constants/pricing";
import EnrichmentBadge from "@/app/components/EnrichmentBadge";
import BotLoadingState from "@/app/components/BotLoadingState";
import { canUseBotOnTier, isDemoMode, TIER_NAMES, BOT_ACCESS, type BotName } from "@/lib/constants/pricing";
import AmazonPriceBadge from "./AmazonPriceBadge";
import DocumentVault from "./DocumentVault";
import SaleAssignment from "./SaleAssignment";
import TradeToggle from "./TradeToggle";
import ActiveOffersWidget from "@/app/components/ActiveOffersWidget";

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
  listingPrice?: number | null;
  projectId?: string | null;
  authenticityScore?: {
    score: number;
    tier: string;
    tierLabel: string;
    tierColor: string;
    tierBorderColor: string;
    tierGlowColor: string;
    nextTierLabel: string | null;
    nextTierThreshold: number | null;
    breakdown: {
      aiDetectionScore: number;
      ageBonusScore: number;
      antiqueBotScore: number;
      megaBotScore: number;
      total: number;
    };
  } | null;
  collectiblesScore?: {
    score: number;
    tier: string;
    tierLabel: string;
    tierColor: string;
    tierBorderColor: string;
    tierGlowColor: string;
    nextTierLabel: string | null;
    nextTierThreshold: number | null;
    breakdown: {
      aiDetectionScore: number;
      rarityBonusScore: number;
      botGradeScore: number;
      megaBotScore: number;
      total: number;
    };
  } | null;
  shippingData?: {
    weight: number | null;
    length: number | null;
    width: number | null;
    height: number | null;
    isFragile: boolean;
    preference: string;
    aiWeightLbs: number | null;
    aiDimsEstimate: string | null;
    aiShippingDifficulty: string | null;
    aiShippingNotes: string | null;
    aiShippingConfidence: number | null;
    quotedShippingRate?: number | null;
    quotedShippingAt?: string | null;
  };
  demandScore?: { score: number; label: string; signals?: any[] } | null;
  botDisagreement?: { disagreements?: { botA: string; botB: string; priceA: number; priceB: number; diffPercent: number }[]; summary?: string } | null;
  controlCenterExtra?: {
    totalViews: number;
    inquiries: number;
    buyersFound: number;
    documentCount: number;
    updatedAt: string;
    shippingReady: boolean;
  };
};

/* ═══════════════════════════════════════════
   Safe price helpers — handles numbers, "$5,000" strings, and {low, mid, high} objects
   ═══════════════════════════════════════════ */

function safeExtractPrice(v: any): number | null {
  if (v == null) return null;
  if (typeof v === "number") return isFinite(v) ? v : null;
  if (typeof v === "string") { const n = Number(v.replace(/[^0-9.\-]/g, "")); return isFinite(n) ? n : null; }
  if (typeof v === "object" && !Array.isArray(v)) {
    const mid = safeExtractPrice(v.mid ?? v.middle ?? v.average);
    if (mid != null) return mid;
    const lo = safeExtractPrice(v.low ?? v.min);
    const hi = safeExtractPrice(v.high ?? v.max);
    if (lo != null && hi != null) return Math.round((lo + hi) / 2);
    return lo ?? hi ?? null;
  }
  return null;
}
function safeFmtPrice(v: any): string { const n = safeExtractPrice(v); return n != null ? `$${Math.round(n).toLocaleString()}` : "—"; }

/* ═══════════════════════════════════════════
   Shared Components
   ═══════════════════════════════════════════ */

function AccordionHeader({ id, icon, title, subtitle, isOpen, onToggle, accentColor, badge }: {
  id: string; icon: string; title: string; subtitle?: string;
  isOpen: boolean; onToggle: (id: string) => void; accentColor?: string; badge?: string;
}) {
  return (
    <button onClick={() => onToggle(id)} style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      width: "100%", background: isOpen ? "rgba(0,188,212,0.02)" : "transparent",
      border: "none", borderBottom: isOpen ? "1px solid var(--border-default)" : "1px solid transparent",
      padding: "0.55rem 0.4rem", cursor: "pointer", transition: "all 0.2s ease",
      borderRadius: isOpen ? "0.35rem 0.35rem 0 0" : "0.35rem", minHeight: "36px",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
        <span style={{ fontSize: "0.85rem" }}>{icon}</span>
        <span style={{ fontSize: "0.58rem", fontWeight: 700, color: accentColor || "var(--text-secondary)", letterSpacing: "0.05em", textTransform: "uppercase" as const }}>{title}</span>
        {badge && <span style={{ fontSize: "0.48rem", fontWeight: 700, padding: "2px 6px", borderRadius: "6px", background: `${accentColor || "#00bcd4"}18`, color: accentColor || "#00bcd4" }}>{badge}</span>}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
        {subtitle && !isOpen && <span style={{ fontSize: "0.5rem", color: "var(--text-muted)", maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const, fontWeight: 500 }}>{subtitle}</span>}
        <span style={{ fontSize: "0.48rem", color: "var(--text-muted)", transition: "transform 0.25s ease", transform: isOpen ? "rotate(180deg)" : "rotate(0deg)", display: "inline-flex", alignItems: "center", justifyContent: "center", width: "20px", height: "20px", borderRadius: "50%", background: isOpen ? "rgba(0,188,212,0.08)" : "transparent" }}>▼</span>
      </div>
    </button>
  );
}

function CollapsedSummary({ botType, data, megaData, buttons }: {
  botType: string;
  data: any;
  megaData?: any;
  buttons?: React.ReactNode;
}) {
  // ═══ HUD Design Tokens ═══
  const hL: React.CSSProperties = { fontSize: "0.55rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "rgba(148,163,184,0.8)", textAlign: "center" };
  const hH: React.CSSProperties = { fontSize: "1.15rem", fontWeight: 800, letterSpacing: "-0.02em", textAlign: "center" };
  const hS: React.CSSProperties = { padding: "0.35rem 0.6rem", borderRadius: "8px", background: "rgba(0,188,212,0.04)", border: "1px solid rgba(0,188,212,0.1)", textAlign: "center", minWidth: "65px", flex: "1 1 0" };
  const hSL: React.CSSProperties = { fontSize: "0.5rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "rgba(148,163,184,0.7)", marginBottom: "2px" };
  const hSV: React.CSSProperties = { fontSize: "0.72rem", fontWeight: 700 };
  const hM: React.CSSProperties = { fontSize: "0.58rem", padding: "3px 10px", borderRadius: "9999px", background: "linear-gradient(135deg, rgba(139,92,246,0.12), rgba(139,92,246,0.06))", border: "1px solid rgba(139,92,246,0.2)", color: "#a78bfa", fontWeight: 700, letterSpacing: "0.02em", display: "inline-block" };
  const hR: React.CSSProperties = { display: "flex", gap: "0.35rem", alignItems: "stretch", justifyContent: "center", flexWrap: "wrap" };
  const hWrap: React.CSSProperties = { width: "100%", display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" };

  const summaries: Record<string, () => React.ReactNode> = {
    analyze: () => (
      <div style={hWrap}>
        <div style={hL}>AI Analysis</div>
        <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const, maxWidth: "95%", textAlign: "center" }}>{data?.itemName || "—"}</div>
        <div style={hR}>
          <div style={hS}><div style={hSL}>Condition</div><div style={{ ...hSV, color: (data?.conditionScore ?? 5) >= 7 ? "#22c55e" : (data?.conditionScore ?? 5) >= 4 ? "#f59e0b" : "#ef4444" }}>{data?.conditionScore ?? "?"}/10</div></div>
          <div style={hS}><div style={hSL}>Category</div><div style={{ ...hSV, color: "var(--text-secondary)", fontSize: "0.65rem" }}>{data?.category || "—"}</div></div>
          {data?.confidence && <div style={hS}><div style={hSL}>Confidence</div><div style={{ ...hSV, color: "#00bcd4" }}>{Math.round(data.confidence > 1 ? data.confidence : data.confidence * 100)}%</div></div>}
        </div>
        {megaData && <span style={hM}>⚡ MegaBot: {megaData.agreementScore ?? "?"}% agreement</span>}
      </div>
    ),
    pricing: () => (
      <div style={hWrap}>
        <div style={hL}>Estimated Value</div>
        <div style={{ ...hH, color: "#00bcd4", textShadow: "0 0 20px rgba(0,188,212,0.3)" }}>{data?.low != null && data?.high != null ? `$${Math.round(data.low)} — $${Math.round(data.high)}` : "—"}</div>
        <div style={hR}>
          <div style={hS}><div style={hSL}>Confidence</div><div style={{ ...hSV, color: "var(--text-secondary)" }}>{data?.confidence != null ? `${Math.round(data.confidence > 1 ? data.confidence : data.confidence * 100)}%` : "?"}</div></div>
          {data?.demand && <div style={hS}><div style={hSL}>Demand</div><div style={{ ...hSV, color: data.demand === "High" || data.demand === "Strong" || data.demand === "high" ? "#22c55e" : data.demand === "Low" || data.demand === "low" ? "#ef4444" : "#f59e0b" }}>{data.demand}</div></div>}
          {data?.netPayout && <div style={hS}><div style={hSL}>You Keep</div><div style={{ ...hSV, color: "#22c55e" }}>${Math.round(data.netPayout)}</div></div>}
        </div>
        {megaData && <span style={hM}>⚡ MegaBot: {megaData.agreementScore ?? "?"}% agreement</span>}
      </div>
    ),
    buyers: () => (
      <div style={hWrap}>
        <div style={hL}>Buyer Intelligence</div>
        <div style={{ ...hH, color: "#22c55e", textShadow: "0 0 20px rgba(34,197,94,0.2)" }}>{data?.leadCount ?? 0} leads found</div>
        <div style={hR}>
          {data?.hotCount > 0 && <div style={hS}><div style={hSL}>Hot Leads</div><div style={{ ...hSV, color: "#ef4444" }}>{data.hotCount}</div></div>}
          {data?.bestPlatform && <div style={hS}><div style={hSL}>Best Platform</div><div style={{ ...hSV, color: "var(--text-secondary)", fontSize: "0.65rem" }}>{data.bestPlatform}</div></div>}
          {data?.platformCount > 0 && <div style={hS}><div style={hSL}>Platforms</div><div style={{ ...hSV, color: "var(--text-secondary)" }}>{data.platformCount}</div></div>}
        </div>
        {megaData && <span style={hM}>⚡ MegaBot: {megaData.agreementScore ?? "?"}%</span>}
      </div>
    ),
    listing: () => (
      <div style={hWrap}>
        <div style={hL}>Listing Status</div>
        <div style={{ ...hH, color: "#00bcd4" }}>{data?.platformCount ?? 0} platforms ready</div>
        <div style={hR}>
          {data?.bestPlatform && <div style={hS}><div style={hSL}>Best Platform</div><div style={{ ...hSV, color: "#22c55e", fontSize: "0.65rem" }}>{data.bestPlatform}</div></div>}
          {data?.topPlatforms && data.topPlatforms.length > 1 && <div style={hS}><div style={hSL}>Active On</div><div style={{ ...hSV, color: "var(--text-secondary)", fontSize: "0.6rem" }}>{data.topPlatforms.slice(0, 3).map((p: string) => p.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase())).join(", ")}</div></div>}
          {data?.copiedCount > 0 && <div style={hS}><div style={hSL}>Launched</div><div style={{ ...hSV, color: "#22c55e" }}>{data.copiedCount}/13</div></div>}
        </div>
        {data?.summary && <div style={{ fontSize: "0.6rem", color: "var(--text-muted)", lineHeight: 1.4, textAlign: "center" as const, maxWidth: "92%", overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as const }}>{data.summary}</div>}
        {megaData && <span style={hM}>⚡ MegaBot: {megaData.agreementScore ?? "?"}% agreement</span>}
      </div>
    ),
    recon: () => (
      <div style={hWrap}>
        <div style={hL}>Market Intelligence</div>
        <div style={{ ...hH, color: "#f59e0b", textShadow: "0 0 20px rgba(245,158,11,0.2)" }}>{data?.competitorCount ?? 0} competitors</div>
        <div style={hR}>
          {data?.alertCount > 0 && <div style={{ ...hS, background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)" }}><div style={hSL}>Alerts</div><div style={{ ...hSV, color: "#ef4444" }}>{data.alertCount}</div></div>}
          {data?.marketHeat && <div style={hS}><div style={hSL}>Market</div><div style={{ ...hSV, color: data.marketHeat === "Hot" ? "#ef4444" : data.marketHeat === "Warm" ? "#f59e0b" : "#00bcd4" }}>{data.marketHeat}</div></div>}
          {data?.pricePosition && <div style={hS}><div style={hSL}>Position</div><div style={{ ...hSV, color: data.pricePosition === "Well-Priced" ? "#22c55e" : "#f59e0b" }}>{data.pricePosition}</div></div>}
          {data?.avgPrice && <div style={hS}><div style={hSL}>Avg Price</div><div style={{ ...hSV, color: "var(--text-secondary)" }}>${typeof data.avgPrice === "number" ? Math.round(data.avgPrice) : data.avgPrice}</div></div>}
        </div>
        {data?.recommendation && <div style={{ fontSize: "0.6rem", color: "var(--text-muted)", lineHeight: 1.4, textAlign: "center" as const, maxWidth: "92%", overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as const }}>💡 {data.recommendation}</div>}
        {megaData && <span style={hM}>⚡ MegaBot: {megaData.agreementScore ?? "?"}% agreement</span>}
      </div>
    ),
    shipping: () => (
      <div style={hWrap}>
        <div style={hL}>Shipping Profile</div>
        <div style={{ ...hH, color: "#00bcd4", fontSize: "0.95rem" }}>{data?.method || "—"}</div>
        <div style={hR}>
          {data?.weight && <div style={hS}><div style={hSL}>Weight</div><div style={{ ...hSV, color: "var(--text-secondary)" }}>{data.weight}</div></div>}
          {data?.dims && <div style={hS}><div style={hSL}>Dims</div><div style={{ ...hSV, color: "var(--text-secondary)", fontSize: "0.6rem" }}>{data.dims}</div></div>}
          {data?.difficulty && <div style={hS}><div style={hSL}>Handling</div><div style={{ ...hSV, color: data.difficulty === "Heavy" ? "#ef4444" : data.difficulty === "Fragile" ? "#f59e0b" : "#00bcd4" }}>{data.difficulty}</div></div>}
        </div>
      </div>
    ),
    photos: () => (
      <div style={hWrap}>
        <div style={hL}>Photo Quality</div>
        <div style={{ ...hH, color: (data?.score ?? 5) >= 7 ? "#22c55e" : (data?.score ?? 5) >= 4 ? "#f59e0b" : "#ef4444", textShadow: `0 0 20px ${(data?.score ?? 5) >= 7 ? "rgba(34,197,94,0.2)" : "rgba(245,158,11,0.2)"}` }}>{data?.score ?? "?"}/10</div>
        <div style={hR}>
          <div style={hS}><div style={hSL}>Photos</div><div style={{ ...hSV, color: "var(--text-secondary)" }}>{data?.count ?? 0}</div></div>
        </div>
      </div>
    ),
    carbot: () => (
      <div style={hWrap}>
        <div style={hL}>Vehicle Assessment</div>
        <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-primary)", textAlign: "center" as const }}>{data?.label || "Assessment available"}</div>
        <div style={hR}>
          {data?.grade && data.grade !== "—" && <div style={hS}><div style={hSL}>Grade</div><div style={{ ...hSV, color: data.gradeColor || "var(--text-secondary)" }}>{data.grade}</div></div>}
          {data?.valueLow != null && data?.valueHigh != null && <div style={hS}><div style={hSL}>Value</div><div style={{ ...hSV, color: "#00bcd4" }}>${Math.round(data.valueLow / 1000)}K–${Math.round(data.valueHigh / 1000)}K</div></div>}
          {data?.demand && <div style={hS}><div style={hSL}>Demand</div><div style={{ ...hSV, color: "var(--text-secondary)" }}>{data.demand}</div></div>}
        </div>
      </div>
    ),
    antique: () => (
      <div style={{ width: "100%" }}>
        {data?.verdict ? (
          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "4px" }}>
            <span style={{ fontSize: "1rem" }}>{data.verdict === "Authentic" || data.verdict === "Likely Authentic" ? "✅" : data.verdict === "Uncertain" ? "⚠️" : "❌"}</span>
            <div style={{ fontSize: "0.82rem", fontWeight: 800, color: data.verdict === "Authentic" || data.verdict === "Likely Authentic" ? "#16a34a" : data.verdict === "Uncertain" ? "#d97706" : "#dc2626" }}>{data.verdict}</div>
            {data?.confidence && <span style={{ fontSize: "0.58rem", color: "var(--text-muted)", fontWeight: 600 }}>{data.confidence}%</span>}
          </div>
        ) : <div style={{ ...hL, marginBottom: "4px" }}>Antique Detected</div>}
        {(data?.fmvLow != null || data?.auctionLow != null) && (
          <div style={{ ...hH, color: "#fbbf24", textShadow: "0 0 20px rgba(251,191,36,0.2)", marginBottom: "6px" }}>
            {data.fmvLow != null && data.fmvHigh != null ? `$${Math.round(data.fmvLow).toLocaleString()} — $${Math.round(data.fmvHigh).toLocaleString()}` : data.auctionLow != null && data.auctionHigh != null ? `$${Math.round(data.auctionLow).toLocaleString()} — $${Math.round(data.auctionHigh).toLocaleString()}` : "—"}
          </div>
        )}
        <div style={hR}>
          {data?.period && <div style={hS}><div style={hSL}>Period</div><div style={{ ...hSV, color: "var(--text-secondary)", fontSize: "0.6rem" }}>{data.period}</div></div>}
          {data?.rarity && <div style={hS}><div style={hSL}>Rarity</div><div style={{ ...hSV, color: data.rarity === "Rare" || data.rarity === "Very Rare" ? "#f59e0b" : "var(--text-secondary)" }}>{data.rarity}</div></div>}
          {data?.overallGrade && <div style={hS}><div style={hSL}>Condition</div><div style={{ ...hSV, color: "#00bcd4" }}>{data.overallGrade}</div></div>}
          {data?.collectorDemand && <div style={hS}><div style={hSL}>Demand</div><div style={{ ...hSV, color: data.collectorDemand === "High" || data.collectorDemand === "Strong" ? "#22c55e" : "#f59e0b" }}>{data.collectorDemand}</div></div>}
        </div>
        {megaData && <div style={{ marginTop: "6px", textAlign: "center" as const }}><span style={hM}>⚡ MegaBot: {megaData.agreementScore ?? "?"}% agreement</span></div>}
      </div>
    ),
    collectibles: () => (
      <div style={{ width: "100%" }}>
        <div style={{ ...hL, marginBottom: "2px" }}>Collectible</div>
        <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "#8b5cf6", marginBottom: "6px" }}>⭐ {data?.name || "Evaluation available"}</div>
        <div style={hR}>
          {data?.rarity && <div style={hS}><div style={hSL}>Rarity</div><div style={{ ...hSV, color: "#8b5cf6" }}>{data.rarity}</div></div>}
          {data?.value && <div style={hS}><div style={hSL}>Value</div><div style={{ ...hSV, color: "#00bcd4" }}>{data.value}</div></div>}
          {data?.grade && <div style={hS}><div style={hSL}>Grade</div><div style={{ ...hSV, color: "var(--text-secondary)" }}>PSA {data.grade}</div></div>}
          {data?.demand && <div style={hS}><div style={hSL}>Trend</div><div style={{ ...hSV, color: "var(--text-secondary)" }}>{data.demand}</div></div>}
        </div>
      </div>
    ),
    video: () => (
      <div style={{ width: "100%" }}>
        <div style={{ ...hL, marginBottom: "2px" }}>Video Ad</div>
        <div style={{ ...hH, color: "#ef4444", textShadow: "0 0 20px rgba(239,68,68,0.2)" }}>🎬 {data?.status === "ready" ? "Video Ready" : data?.status === "generating" ? "Generating..." : "Generate Video"}</div>
        <div style={hR}>
          {data?.duration && <div style={hS}><div style={hSL}>Duration</div><div style={{ ...hSV, color: "var(--text-secondary)" }}>{data.duration}s</div></div>}
          {data?.platform && <div style={hS}><div style={hSL}>Platform</div><div style={{ ...hSV, color: "#00bcd4" }}>{data.platform}</div></div>}
          {data?.tier && <div style={hS}><div style={hSL}>Tier</div><div style={{ ...hSV, color: "var(--text-secondary)" }}>{data.tier}</div></div>}
        </div>
      </div>
    ),
  };

  const render = summaries[botType];
  return (
    <div style={{
      padding: "0.75rem 1rem",
      display: "flex", flexDirection: "column" as const, alignItems: "stretch", justifyContent: "space-between",
      flex: 1,
      background: "linear-gradient(135deg, rgba(0,188,212,0.03), transparent)",
      borderRadius: "12px",
      position: "relative",
    }}>
      {render ? render() : <span style={{ fontSize: "0.62rem", color: "var(--text-muted)" }}>Expand for full details</span>}
      {buttons && (
        <div style={{
          display: "flex", gap: "0.4rem", justifyContent: "center",
          flexWrap: "wrap" as const, marginTop: "auto", paddingTop: "0.5rem",
          borderTop: "1px solid rgba(0,188,212,0.1)", width: "100%",
        }}>
          {buttons}
        </div>
      )}
    </div>
  );
}

function GlassCard({ children, premium, fullWidth }: {
  children: React.ReactNode;
  premium?: boolean;
  fullWidth?: boolean;
}) {
  return (
    <div
      style={{
        background: premium
          ? "linear-gradient(135deg, rgba(0,188,212,0.06), rgba(255,215,0,0.03))"
          : "var(--bg-card)",
        backdropFilter: "blur(12px)",
        border: premium
          ? "1px solid rgba(0,188,212,0.3)"
          : "1px solid rgba(0,188,212,0.15)",
        borderRadius: 16,
        overflow: "hidden",
        transition: "border-color 0.2s, box-shadow 0.2s",
        gridColumn: fullWidth ? "1 / -1" : undefined,
        display: "flex",
        flexDirection: "column" as const,
        minHeight: "280px",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = premium ? "rgba(0,188,212,0.5)" : "rgba(0,188,212,0.3)";
        e.currentTarget.style.boxShadow = "0 4px 24px rgba(0,188,212,0.08)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = premium ? "rgba(0,188,212,0.3)" : "rgba(0,188,212,0.15)";
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      {children}
    </div>
  );
}

/** Locked panel shown when user's tier doesn't have access to a bot */
function LockedBotPanel({ botIcon, botName, requiredPlanName }: { botIcon: string; botName: string; requiredPlanName: string }) {
  return (
    <GlassCard>
      <div style={{ padding: "2rem 1.5rem", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "0.75rem" }}>
        <div style={{ fontSize: "2rem", opacity: 0.4 }}>🔒</div>
        <div style={{ fontSize: "1.1rem", opacity: 0.3 }}>{botIcon}</div>
        <div style={{ fontSize: "0.88rem", fontWeight: 700, color: "var(--text-primary)" }}>{botName}</div>
        <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)", maxWidth: 320, lineHeight: 1.5 }}>
          Available on <span style={{ color: "#00bcd4", fontWeight: 600 }}>{requiredPlanName}</span> and above
        </div>
        <a
          href="/pricing?upgrade=true"
          style={{
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            padding: "0.65rem 1.5rem", minHeight: "48px",
            background: "linear-gradient(135deg, #00bcd4, #009688)",
            color: "#fff", fontWeight: 700, fontSize: "0.82rem",
            borderRadius: "0.5rem", textDecoration: "none",
            border: "none", cursor: "pointer",
          }}
        >
          Upgrade Plan
        </a>
      </div>
    </GlassCard>
  );
}

function PanelHeader({ icon, title, hasData, badge, collapsed, onToggle, preview }: {
  icon: string;
  title: string;
  hasData: boolean;
  badge?: string;
  collapsed?: boolean;
  onToggle?: () => void;
  preview?: string;
}) {
  const isCollapsible = onToggle !== undefined;
  return (
    <div
      onClick={onToggle}
      style={{
        padding: "0.85rem 1.25rem",
        borderBottom: collapsed ? "none" : "1px solid var(--border-default)",
        display: "flex",
        alignItems: "center",
        gap: "0.65rem",
        cursor: isCollapsible ? "pointer" : undefined,
        userSelect: isCollapsible ? "none" : undefined,
        transition: "background 0.15s",
        flexWrap: collapsed && preview ? "wrap" : undefined,
      }}
      onMouseEnter={isCollapsible ? (e) => { e.currentTarget.style.background = "var(--bg-card)"; } : undefined}
      onMouseLeave={isCollapsible ? (e) => { e.currentTarget.style.background = "transparent"; } : undefined}
    >
      <span style={{ fontSize: "1.15rem" }}>{icon}</span>
      <span style={{ fontWeight: 700, fontSize: "0.9rem", color: "var(--text-primary)", flex: 1 }}>{title}</span>
      {badge && (
        <span style={{
          padding: "0.15rem 0.55rem",
          borderRadius: "9999px",
          fontSize: "0.55rem",
          fontWeight: 700,
          background: badge === "REQUIRES CREDITS"
            ? "rgba(251,191,36,0.12)"
            : "rgba(0,188,212,0.15)",
          color: badge === "REQUIRES CREDITS" ? "#fbbf24" : "var(--accent)",
          letterSpacing: "0.03em",
        }}>
          {badge}
        </span>
      )}
      <span style={{
        width: 8,
        height: 8,
        borderRadius: "50%",
        background: hasData ? "#4caf50" : "#555",
        flexShrink: 0,
      }} />
      {isCollapsible && (
        <span style={{
          fontSize: "0.7rem",
          color: "var(--text-muted)",
          transition: "transform 0.2s",
          transform: collapsed ? "rotate(-90deg)" : "rotate(0deg)",
          flexShrink: 0,
        }}>
          ▼
        </span>
      )}
      {collapsed && preview && (
        <div style={{
          width: "100%",
          fontSize: "0.68rem",
          color: "var(--text-muted)",
          overflow: "hidden",
          whiteSpace: "nowrap",
          textOverflow: "ellipsis",
          paddingLeft: "1.8rem",
          marginTop: "-0.15rem",
        }}>
          {preview}
        </div>
      )}
    </div>
  );
}

function PanelFooter({ botName, botLink, itemId, botIcon, botCost, onSuperBoost, onBotRun, boosting, boosted, extra, hasResult, botError }: {
  botName: string;
  botLink: string;
  itemId: string;
  botIcon?: string;
  botCost?: number;
  onSuperBoost?: () => void;
  onBotRun?: () => void;
  boosting?: boolean;
  boosted?: boolean;
  extra?: React.ReactNode;
  hasResult?: boolean;
  botError?: { type: string; message: string; balance?: number; required?: number } | null;
}) {
  return (
    <div style={{ marginTop: "auto" }}>
      {/* MegaBot loading state — full cooking animation when boosting */}
      {boosting && !boosted && (
        <BotLoadingState botName={`MegaBot — ${botName}`} />
      )}
      {boosting && boosted && (
        <BotLoadingState botName={`MegaBot — ${botName} (Re-run)`} />
      )}
      {/* Tier / credit error messages */}
      {botError && botError.type === "upgrade_required" && (
        <div style={{ padding: "0.75rem 1.25rem", background: "rgba(245,158,11,0.06)", borderTop: "1px solid rgba(245,158,11,0.15)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
            <span style={{ fontSize: "0.8rem" }}>🔒</span>
            <span style={{ fontSize: "0.75rem", color: "#f59e0b", fontWeight: 600 }}>{botError.message}</span>
            <a href="/pricing?upgrade=true" style={{ fontSize: "0.68rem", fontWeight: 700, color: "#00bcd4", textDecoration: "none", padding: "0.2rem 0.6rem", border: "1px solid rgba(0,188,212,0.3)", borderRadius: "0.4rem" }}>Upgrade Plan</a>
          </div>
        </div>
      )}
      {botError && botError.type === "insufficient_credits" && (
        <div style={{ padding: "0.75rem 1.25rem", background: "rgba(239,68,68,0.06)", borderTop: "1px solid rgba(239,68,68,0.15)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
            <span style={{ fontSize: "0.75rem", color: "#ef4444", fontWeight: 600 }}>Not enough credits ({botError.balance ?? 0} available, {botError.required ?? 1} needed)</span>
            <a href="/credits" style={{ fontSize: "0.68rem", fontWeight: 700, color: "#00bcd4", textDecoration: "none", padding: "0.2rem 0.6rem", border: "1px solid rgba(0,188,212,0.3)", borderRadius: "0.4rem" }}>Buy Credits</a>
          </div>
        </div>
      )}
    <div style={{
      padding: "0.65rem 1.25rem",
      borderTop: "1px solid var(--border-default)",
      display: "flex",
      gap: "0.5rem",
      flexWrap: "wrap",
      alignItems: "center",
    }}>
      {/* Standard bot run / re-run button */}
      {onBotRun && botIcon && (
        <button
          onClick={onBotRun}
          style={{
            padding: "0.3rem 0.75rem",
            fontSize: "0.68rem",
            fontWeight: 600,
            borderRadius: "0.5rem",
            border: "1px solid var(--border-default)",
            background: "var(--ghost-bg)",
            color: "var(--text-secondary)",
            cursor: "pointer",
          }}
        >
          {hasResult ? `🔄 Re-Run · ${(botCost ?? 1) * 0.5} cr` : `${botIcon} ${botName} · ${botCost ?? 1} cr`}
        </button>
      )}
      {/* MegaBot — single button, transforms on state */}
      {onSuperBoost && !boosted && !boosting && (
        <button
          onClick={onSuperBoost}
          style={{
            padding: "0.3rem 0.75rem",
            fontSize: "0.68rem",
            fontWeight: 600,
            borderRadius: "0.5rem",
            border: "none",
            background: "linear-gradient(135deg, #00bcd4, #009688)",
            color: "#fff",
            cursor: "pointer",
          }}
        >
          ⚡ MegaBot · 5 cr
        </button>
      )}
      {onSuperBoost && boosted && !boosting && (
        <button
          onClick={onSuperBoost}
          style={{
            padding: "0.3rem 0.75rem",
            fontSize: "0.68rem",
            fontWeight: 600,
            borderRadius: "0.5rem",
            border: "none",
            background: "linear-gradient(135deg, #00bcd4, #009688)",
            color: "#fff",
            cursor: "pointer",
          }}
        >
          🔄 MegaBot Re-Run · 3 cr
        </button>
      )}
      {onSuperBoost && boosting && (
        <button
          disabled
          style={{
            padding: "0.3rem 0.75rem",
            fontSize: "0.68rem",
            fontWeight: 600,
            borderRadius: "0.5rem",
            border: "none",
            background: "rgba(0,188,212,0.2)",
            color: "#fff",
            cursor: "wait",
            opacity: 0.6,
          }}
        >
          ⚡ Re-running...
        </button>
      )}
      {/* Open bot page link */}
      <a
        href={`${botLink}?item=${itemId}`}
        style={{
          padding: "0.3rem 0.75rem",
          fontSize: "0.72rem",
          fontWeight: 600,
          borderRadius: "0.5rem",
          border: "1px solid var(--accent)",
          background: "transparent",
          color: "var(--accent)",
          textDecoration: "none",
        }}
      >
        Open {botName} →
      </a>
      {extra}
    </div>
    </div>
  );
}

function ScoreCircle({ label, score, size = 44 }: { label: string; score: number; size?: number }) {
  const color = score >= 7 ? "#4caf50" : score >= 5 ? "#f59e0b" : "#ef4444";
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{
        width: size, height: size, borderRadius: "50%",
        border: `2.5px solid ${color}`,
        display: "flex", alignItems: "center", justifyContent: "center",
        margin: "0 auto", background: `${color}15`,
      }}>
        <span style={{ fontSize: size * 0.36, fontWeight: 700, color }}>{score}</span>
      </div>
      <div style={{ fontSize: "0.58rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>{label}</div>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div style={{ padding: "1.25rem", textAlign: "center", color: "var(--text-muted)", fontSize: "0.82rem", lineHeight: 1.5, opacity: 0.8 }}>
      {message}
    </div>
  );
}

/* ─── MegaBot Results (renders within any panel) ─── */

function MegaBotBoostResultsInner({ botType, result, aiData }: { botType: string; result: any; aiData: any }) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showRawJson, setShowRawJson] = useState<string | null>(null);

  // Safety: if result is null/undefined/invalid, show fallback immediately
  if (!result || typeof result !== "object") {
    return (
      <div style={{ padding: "0.75rem 1rem", borderRadius: "0.5rem", background: "rgba(139,92,246,0.06)", border: "1px solid rgba(139,92,246,0.15)", textAlign: "center" }}>
        <span style={{ fontSize: "0.72rem", color: "#8b5cf6" }}>⚡ MegaBot results unavailable</span>
      </div>
    );
  }

  const consensus = result?.consensus || {};
  // Normalize providers — ensure each has data and error fields properly set
  const rawProviders: any[] = Array.isArray(result?.providers) ? result.providers : [];
  const providerArray = rawProviders.map((p: any) => ({
    ...p,
    data: p.data ?? p.result ?? null,
    error: p.error ?? null,
  }));
  const agreementRaw = result?.agreementScore || result?.agreement || 0.88;
  const agreement = Math.round(agreementRaw > 1 ? agreementRaw : agreementRaw * 100);


  const PROVIDER_META: Record<string, { icon: string; label: string; color: string; specialty: string; collapsedFocus: string }> = {
    openai: { icon: "🤖", label: "OpenAI", color: "#10a37f", specialty: "Balanced assessment and precise identification", collapsedFocus: "overview" },
    claude: { icon: "🧠", label: "Claude", color: "#d97706", specialty: "Craftsmanship, history & authentication", collapsedFocus: "history" },
    gemini: { icon: "🔮", label: "Gemini", color: "#4285f4", specialty: "Market trends & comparable data", collapsedFocus: "market" },
    grok: { icon: "🌀", label: "Grok (xAI)", color: "#00DC82", specialty: "Social buzz & trending demand", collapsedFocus: "social" },
  };

  const successfulProviders = providerArray.filter((p) => !p.error);
  const failedProviders = providerArray.filter((p) => p.error);

  // Type-safe sub-object helper
  const obj = (v: any) => (v && typeof v === "object" && !Array.isArray(v)) ? v : null;

  // Safe price extraction — handles numbers, "$5,000" strings, and {low, mid, high} objects
  function _xPrice(v: any): number | null {
    if (v == null) return null;
    if (typeof v === "number") return isFinite(v) ? v : null;
    if (typeof v === "string") { const n = Number(v.replace(/[^0-9.\-]/g, "")); return isFinite(n) ? n : null; }
    if (typeof v === "object" && !Array.isArray(v)) {
      const mid = _xPrice(v.mid ?? v.middle ?? v.average);
      if (mid != null) return mid;
      const lo = _xPrice(v.low ?? v.min);
      const hi = _xPrice(v.high ?? v.max);
      if (lo != null && hi != null) return Math.round((lo + hi) / 2);
      return lo ?? hi ?? null;
    }
    return null;
  }
  function _fp(v: any): string { const n = _xPrice(v); return n != null ? `$${Math.round(n).toLocaleString()}` : "—"; }

  // Lowercase all object keys (2 levels deep) — handles UPPERCASE responses from OpenAI/Gemini
  function normalizeKeys(o: any): any {
    if (!o || typeof o !== "object" || Array.isArray(o)) return o;
    const out: any = {};
    for (const key of Object.keys(o)) {
      const lk = key.toLowerCase();
      const val = o[key];
      if (val && typeof val === "object" && !Array.isArray(val)) {
        const inner: any = {};
        for (const ik of Object.keys(val)) inner[ik.toLowerCase()] = val[ik];
        out[lk] = inner;
      } else {
        out[lk] = val;
      }
    }
    return out;
  }

  // Robust comparable sales extraction (handles all agent key variations)
  function getComparables(data: any): any[] {
    if (!data || typeof data !== "object") return [];
    const d = normalizeKeys(data);
    const DIRECT_KEYS = ["comparable_sales", "comparables", "recent_sales", "sold_listings", "sold_items", "comparable_listings", "market_comparables", "similar_sales", "price_comparisons", "comp_sales", "recent_comps", "sales_data"];
    for (const k of DIRECT_KEYS) { if (Array.isArray(d[k]) && d[k].length > 0) return d[k]; }
    const WRAPPER_KEYS = ["price_validation", "market_analysis", "pricing", "valuation", "market_data", "analysis", "market_intelligence", "pricing_analysis"];
    for (const wk of WRAPPER_KEYS) { const w = obj(d[wk]); if (!w) continue; for (const k of DIRECT_KEYS) { if (Array.isArray(w[k]) && w[k].length > 0) return w[k]; } }
    for (const val of Object.values(d)) { if (Array.isArray(val) && val.length > 0 && val.length <= 30) { const f = val[0]; if (f && typeof f === "object" && (f.sold_price != null || f.price != null || f.sale_price != null || f.sold_for != null || f.amount != null)) return val; } }
    return [];
  }

  function normalizeComparable(comp: any) {
    if (!comp || typeof comp !== "object") return { platform: "Unknown", item_description: "Item", sold_price: "?", date: "", condition: "", relevance: "" };
    return {
      platform: comp.platform || comp.source || comp.marketplace || comp.site || "Unknown",
      item_description: comp.item_description || comp.description || comp.title || comp.item || comp.name || comp.item_name || "Item",
      sold_price: comp.sold_price ?? comp.price ?? comp.sale_price ?? comp.sold_for ?? comp.amount ?? "?",
      date: comp.date || comp.sold_date || comp.sale_date || "",
      condition: comp.condition || comp.item_condition || "",
      relevance: comp.relevance || comp.relevance_score || comp.match_quality || "",
    };
  }

  // Deep field extraction — unwraps nested + checks all naming conventions
  function extractHighlights(p: any) {
    let d = normalizeKeys(p.data || {});
    // Unwrap single top-level wrapper (e.g. { "analysis": {...} })
    const topKeys = Object.keys(d);
    if (topKeys.length === 1 && obj(d[topKeys[0]]) && Object.keys(d[topKeys[0]]).length >= 2) {
      d = d[topKeys[0]];
    }
    // Type-safe sub-object resolution
    const id = obj(d.identification) || d;
    const cond = obj(d.condition) || obj(d.condition_assessment) || d;
    const antique = obj(d.antique_detection) || obj(d.antique_indicators) || d;
    const listing = obj(d.listing_suggestions) || d;
    const photo = obj(d.photo_quality) || d;
    // Collect knowledge wrapper sub-objects to search inside
    const kwSubs: any[] = [d, id];
    for (const w of ["deep_knowledge", "knowledge", "item_knowledge", "deep_dive", "mega_enhancement", "megabot_enhancement", "additional_details", "detailed_analysis"]) {
      const sub = obj(d[w]);
      if (sub) kwSubs.push(sub);
    }

    // Helper: first non-null from a list of field lookups
    const pick = (...vals: any[]) => vals.find(v => v != null && v !== "" && v !== "Unknown" && v !== "unknown" && v !== "N/A") ?? null;
    const pickStr = (...vals: any[]) => { const v = pick(...vals); return typeof v === "string" ? v : null; };
    // Search across all knowledge sub-objects for a string field
    const pickKw = (...keys: string[]) => {
      for (const sub of kwSubs) { for (const k of keys) { if (sub[k] && typeof sub[k] === "string" && sub[k].length > 5) return sub[k]; } }
      return null;
    };

    return {
      // IDENTIFICATION
      itemName: pickStr(id.item_name, id.itemName, id.name, d.item_name, d.itemName, d.name, p.itemName),
      category: pickStr(id.category, d.category, p.category),
      subcategory: pickStr(id.subcategory, d.subcategory),
      brand: pickStr(id.brand, id.manufacturer, d.brand, d.manufacturer),
      maker: pickStr(id.maker, d.maker),
      model: pickStr(id.model, d.model),
      material: pickStr(id.material, id.materials, d.material, d.materials),
      era: pickStr(id.era, id.period, d.era, d.period, p.era),
      style: pickStr(id.style, d.style),
      origin: pickStr(id.country_of_origin, id.origin, d.country_of_origin, d.origin),
      markings: pickStr(id.markings, d.markings),
      dimensions: pickStr(id.dimensions_estimate, d.dimensions_estimate, d.dimensions),
      completeness: pickStr(id.completeness, d.completeness),
      // CONDITION
      condOverall: pick(cond.overall_score, cond.condition_score, cond.score, d.condition_score, d.conditionScore, p.conditionScore),
      condCosm: pick(cond.cosmetic_score, cond.condition_cosmetic, d.condition_cosmetic),
      condFunc: pick(cond.functional_score, cond.condition_functional, d.condition_functional),
      condLabel: pickStr(cond.condition_guess, cond.condition_label, d.condition_guess, d.condition_label),
      condDetails: pickStr(cond.condition_details, d.condition_details),
      positiveNotes: cond.positive_notes || d.positive_notes || null,
      visibleIssues: cond.visible_issues || d.visible_issues || null,
      restorationPotential: pickStr(cond.restoration_potential, d.restoration_potential),
      // DEEP ITEM KNOWLEDGE (the unique MegaBot value)
      productHistory: pickKw("product_history", "historical_context", "history", "item_history", "history_and_background", "historical_background", "background"),
      makerHistory: pickKw("maker_history", "manufacturer_history", "brand_history", "maker_background", "company_history", "brand_background"),
      construction: pickKw("construction_analysis", "construction_method", "construction", "how_made", "craftsmanship", "build_quality", "materials_analysis"),
      specialFeatures: pickKw("special_features", "unique_features", "standout_features", "what_makes_special", "notable_features", "key_features", "highlights"),
      tipsAndFacts: pickKw("tips_and_facts", "tips_and_tricks", "tips", "usage_tips", "fun_facts", "interesting_facts", "did_you_know"),
      commonIssues: pickKw("common_issues", "known_issues", "problems", "things_to_watch", "potential_issues", "concerns", "watch_for"),
      careInstructions: pickKw("care_instructions", "maintenance", "preservation", "storage_tips", "care_and_maintenance", "upkeep"),
      similarItems: pickKw("similar_items", "comparisons", "alternative_models", "compared_to", "alternatives", "competing_products"),
      collectorInfo: pickKw("collector_info", "collector_interest", "rarity", "desirability", "collector_value", "collectibility", "enthusiast_info"),
      alternativeIds: d.alternative_identifications || null,
      // PRICING (minimal — PriceBot handles this)
      priceLow: pick(d.estimated_value_low, p.priceLow),
      priceHigh: pick(d.estimated_value_high, p.priceHigh),
      // ANTIQUE
      isAntique: antique.is_antique || d.is_antique || false,
      antiqueAge: pick(antique.estimated_age_years, d.estimated_age_years),
      antiqueMarkers: antique.antique_markers || d.antique_markers || null,
      // META
      isTextOnly: d._grokTextOnly || false,
      summary: pickStr(d.executive_summary, d.summary, d.notes, p.executiveSummary),
      keywords: d.keywords || null,
      bestPlatforms: (listing.best_platforms || d.best_platforms) || null,
    };
  }

  // Build specialty-focused one-liner for collapsed card
  function getCollapsedDetail(p: any, h: ReturnType<typeof extractHighlights>): string {
    const meta = PROVIDER_META[p.provider];
    const focus = meta?.collapsedFocus || "overview";
    // Try to build a specialty-focused snippet
    if (focus === "history" && (h.makerHistory || h.productHistory)) {
      const text = h.makerHistory || h.productHistory || "";
      return text.length > 60 ? text.slice(0, 60) + "..." : text;
    }
    if (focus === "market" && h.category) {
      return [h.category, h.material, h.era].filter(Boolean).join(" · ");
    }
    if (focus === "social" && (h.collectorInfo || h.tipsAndFacts)) {
      const text = h.collectorInfo || h.tipsAndFacts || "";
      return text.length > 60 ? text.slice(0, 60) + "..." : text;
    }
    // Default: category + condition
    const parts = [];
    if (h.category) parts.push(h.category);
    if (h.material) parts.push(h.material);
    return parts.join(" · ");
  }

  // Key insight from agent data
  function getKeyInsight(p: any): string {
    let d = normalizeKeys(p.data || {});
    const topKeys = Object.keys(d);
    if (topKeys.length === 1 && obj(d[topKeys[0]]) && Object.keys(d[topKeys[0]]).length >= 2) d = d[topKeys[0]];
    return d.executive_summary || d.summary || d.notes || d.pricing_rationale || "";
  }

  // Build an item-knowledge-focused summary
  function buildDetailedSummary(): string {
    const parts: string[] = [];
    const agentCount = successfulProviders.length;
    const allH = successfulProviders.map(p => extractHighlights(p));
    const consH = extractHighlights({ data: consensus });

    // Identification
    const itemName = consH.itemName || allH.find(h => h.itemName)?.itemName || "this item";
    const category = consH.category || allH.find(h => h.category)?.category;
    parts.push(`${agentCount} AI agent${agentCount !== 1 ? "s" : ""} identified this as "${itemName}"${category ? ` in the ${category} category` : ""}.`);

    // Agreement
    if (agreement >= 80) parts.push(`Strong consensus (${agreement}%) across all agents.`);
    else if (agreement >= 60) parts.push(`Moderate agreement (${agreement}%), with some differences in assessments.`);
    else parts.push(`Mixed opinions (${agreement}% agreement) — review individual assessments for different perspectives.`);

    // Condition
    const condScore = consH.condOverall || allH.find(h => h.condOverall)?.condOverall;
    if (condScore != null) {
      const w = Number(condScore) >= 8 ? "Excellent" : Number(condScore) >= 6 ? "Good" : Number(condScore) >= 4 ? "Fair" : "Poor";
      const condDetails = consH.condDetails || allH.find(h => h.condDetails)?.condDetails;
      parts.push(`Consensus condition: ${condScore}/10 (${w})${condDetails ? ` — ${condDetails.length > 80 ? condDetails.slice(0, 80) + "..." : condDetails}` : ""}.`);
    }

    // Per-agent unique knowledge contributions
    for (let i = 0; i < successfulProviders.length; i++) {
      const h = allH[i];
      const label = PROVIDER_META[successfulProviders[i].provider]?.label || successfulProviders[i].provider;

      if (successfulProviders[i].provider === "claude" && (h.makerHistory || h.productHistory)) {
        const text = h.makerHistory || h.productHistory || "";
        const sentences = text.split(/(?<=[.!?])\s+/).slice(0, 2).join(" ");
        if (sentences.length > 30) parts.push(`${label}: ${sentences}`);
      } else if (successfulProviders[i].provider === "gemini" && (h.similarItems || h.specialFeatures)) {
        const text = h.similarItems || h.specialFeatures || "";
        const sentences = text.split(/(?<=[.!?])\s+/).slice(0, 1).join(" ");
        if (sentences.length > 20) parts.push(`${label}: ${sentences}`);
      } else if (successfulProviders[i].provider === "grok" && (h.collectorInfo || h.tipsAndFacts)) {
        const text = h.collectorInfo || h.tipsAndFacts || "";
        const sentences = text.split(/(?<=[.!?])\s+/).slice(0, 1).join(" ");
        if (sentences.length > 20) parts.push(`${label}: ${sentences}`);
      } else {
        // Fall back to unique findings
        if (h.maker && h.maker !== "Unknown") parts.push(`${label} identified the maker as "${h.maker}".`);
        else if (h.brand && h.brand !== "Unknown") parts.push(`${label} identified the brand as "${h.brand}".`);
        if (h.era && !h.era.toLowerCase().includes("modern") && !h.era.toLowerCase().includes("unknown") && !parts.some(p => p.includes(h.era!))) {
          parts.push(`${label} dates this to the ${h.era}.`);
        }
      }
    }

    // Best executive summary sentence
    if (parts.length < 5) {
      const bestExec = successfulProviders.map(p => getKeyInsight(p)).filter(s => s.length > 40).sort((a, b) => b.length - a.length)[0];
      if (bestExec) {
        const sentences = bestExec.split(/(?<=[.!?])\s+/).slice(0, 2);
        if (sentences[0]?.length > 20) parts.push(sentences.join(" "));
      }
    }

    if (allH.some(h => h.isTextOnly)) parts.push("Note: Grok analyzed text only (photo analysis timed out).");
    return parts.join(" ");
  }

  function condWord(score: number) { return score >= 8 ? "Excellent" : score >= 6 ? "Good" : score >= 4 ? "Fair" : "Poor"; }

  const isPricing = botType === "pricing";
  const isBuyers = botType === "buyers";
  const isListing = botType === "listing";
  const isRecon = botType === "recon";
  const isCarbot = botType === "carbot";
  const isAntique = botType === "antique";
  const isPhotos = botType === "photos";
  const isCollectibles = botType === "collectibles";

  // ── Buyer extraction ──
  function getBuyerArr(d: any, ...keys: string[]): any[] {
    for (const k of keys) { if (Array.isArray(d[k]) && d[k].length > 0) return d[k]; }
    const wrappers = ["buyer_analysis", "market_analysis", "deep_dive", "megabot_enhancement"];
    for (const w of wrappers) { if (d[w] && typeof d[w] === "object") { for (const k of keys) { if (Array.isArray(d[w][k]) && d[w][k].length > 0) return d[w][k]; } } }
    return [];
  }
  function getBuyerField(d: any, ...keys: string[]): any {
    for (const k of keys) { if (d[k] != null && d[k] !== "" && d[k] !== "Unknown" && d[k] !== "N/A") return d[k]; }
    return null;
  }

  function extractBH(p: any) {
    let d = normalizeKeys(p.data || {});
    const topKeys = Object.keys(d);
    if (topKeys.length === 1 && obj(d[topKeys[0]]) && Object.keys(d[topKeys[0]]).length >= 2) d = d[topKeys[0]];

    const profiles = getBuyerArr(d, "buyer_profiles", "profiles", "buyers", "buyer_types", "target_buyers");
    const platforms = getBuyerArr(d, "platform_opportunities", "platforms", "platform_analysis", "marketplace_opportunities");
    const hotLeads = getBuyerArr(d, "hot_leads", "leads", "active_leads", "urgent_leads", "immediate_opportunities");
    const outreach = getBuyerArr(d, "outreach_strategies", "strategies", "outreach_plans", "approach_strategies");
    const influencers = getBuyerArr(d, "influencer_targets", "influencers", "tastemakers", "amplifiers");

    return {
      profiles,
      profileCount: profiles.length,
      platforms,
      platformCount: platforms.length,
      bestPlatform: getBuyerField(d, "best_platform", "top_platform", "recommended_platform"),
      hotLeads,
      hotLeadCount: hotLeads.length,
      outreach,
      influencers,
      localOpps: obj(d.local_opportunities) || obj(d.local_buyers) || null,
      competitive: obj(d.competitive_landscape) || obj(d.competition) || null,
      timing: obj(d.timing_advice) || obj(d.timing) || null,
      internationalBuyers: obj(d.international_buyers) || obj(d.international_demand) || null,
      corporateBuyers: obj(d.corporate_buyers) || obj(d.business_buyers) || null,
      viralMarketing: obj(d.viral_marketing) || obj(d.viral_potential) || null,
      demandLevel: getBuyerField(d, "demand_level", "market_demand", "buyer_demand"),
      summary: d.executive_summary || d.summary || null,
    };
  }

  function getBuyerCollapsedDetail(p: any): string {
    const bh = extractBH(p);
    const parts: string[] = [];
    if (bh.profileCount) parts.push(`${bh.profileCount} profiles`);
    if (bh.platformCount) parts.push(`${bh.platformCount} platforms`);
    if (bh.hotLeadCount) parts.push(`${bh.hotLeadCount} hot leads`);
    if (bh.demandLevel) parts.push(`${bh.demandLevel} demand`);
    return parts.join(" · ") || "";
  }

  function buildBuyerSummary(): string {
    const parts: string[] = [];
    const agentCount = successfulProviders.length;
    const allBH = successfulProviders.map(p => extractBH(p));
    const totalProfiles = allBH.reduce((s, h) => s + h.profileCount, 0);
    const totalLeads = allBH.reduce((s, h) => s + h.hotLeadCount, 0);
    const totalPlatforms = new Set(allBH.flatMap(h => h.platforms.map((p: any) => (p.platform || "").toLowerCase()))).size;

    parts.push(`${agentCount} AI buyer specialists found ${totalProfiles} buyer profiles across ${totalPlatforms} platforms with ${totalLeads} hot leads.`);
    if (agreement >= 80) parts.push(`Strong consensus (${agreement}%) on buyer approach.`);
    else parts.push(`${agreement}% agreement across agents — review different perspectives.`);

    for (let i = 0; i < successfulProviders.length; i++) {
      const label = PROVIDER_META[successfulProviders[i].provider]?.label || successfulProviders[i].provider;
      const bh = allBH[i];
      if (successfulProviders[i].provider === "claude" && bh.influencers.length > 0) {
        parts.push(`${label} identified ${bh.influencers.length} influencer connections in niche communities.`);
      } else if (successfulProviders[i].provider === "grok" && bh.viralMarketing) {
        parts.push(`${label} found a viral marketing angle on ${bh.viralMarketing.best_platform_for_viral || "social media"}.`);
      } else if (successfulProviders[i].provider === "gemini" && bh.platformCount > 3) {
        parts.push(`${label} analyzed ${bh.platformCount} platforms with algorithm-optimized timing.`);
      } else if (bh.profileCount > 0) {
        parts.push(`${label} identified ${bh.profileCount} buyer profiles.`);
      }
    }

    const bestPlat = allBH.find(h => h.bestPlatform)?.bestPlatform;
    if (bestPlat) parts.push(`Best platform: ${typeof bestPlat === "string" ? bestPlat : "varies by agent"}.`);
    const bestTiming = allBH.find(h => h.timing)?.timing;
    if (bestTiming?.best_day_to_list) parts.push(`Best day to list: ${bestTiming.best_day_to_list}.`);

    return parts.join(" ") || `${agentCount} AI agents analyzed buyer finding for this item.`;
  }

  // ── Listing extraction ──
  function extractLH(p: any) {
    let d = normalizeKeys(p.data || {});
    const topKeys = Object.keys(d);
    if (topKeys.length === 1 && obj(d[topKeys[0]]) && Object.keys(d[topKeys[0]]).length >= 2) d = d[topKeys[0]];
    // The actual listings per platform
    const listingsObj = obj(d.listings) || obj(d.platform_listings) || {};
    const platforms = Array.isArray(d.top_platforms) ? d.top_platforms : Object.keys(listingsObj);
    const platformCount = Object.keys(listingsObj).length;
    // Titles per platform
    const titles: Record<string, string> = {};
    for (const [plat, lst] of Object.entries(listingsObj)) {
      const v = lst as any;
      if (v?.title) titles[plat] = v.title;
    }
    // SEO
    const seo = obj(d.seo_keywords) || {};
    const primaryKw = Array.isArray(seo.primary) ? seo.primary : getBuyerArr(d, "primary_keywords", "top_keywords", "keywords");
    const longTailKw = Array.isArray(seo.long_tail) ? seo.long_tail : getBuyerArr(d, "long_tail_keywords", "long_tail");
    // Best of
    const bestTitle = d.best_title_overall || d.best_title || null;
    const bestHook = d.best_description_hook || d.best_hook || null;
    const hashtags = Array.isArray(d.hashtags) ? d.hashtags : getBuyerArr(d, "hashtags", "tags");
    return {
      listings: listingsObj,
      platforms,
      platformCount,
      titles,
      bestTitle,
      bestHook,
      hashtags,
      primaryKw,
      longTailKw,
      allKwCount: primaryKw.length + longTailKw.length,
      photoDirection: d.photo_direction || d.photo_tip || null,
      postingTime: d.posting_time || d.best_time || null,
      summary: d.executive_summary || d.summary || null,
    };
  }
  function getListingCollapsedDetail(p: any): string {
    const lh = extractLH(p);
    const parts: string[] = [];
    if (lh.platformCount) parts.push(`${lh.platformCount} listings`);
    // Show first title preview
    const firstTitle = Object.values(lh.titles)[0];
    if (firstTitle) parts.push(`"${(firstTitle as string).slice(0, 45)}..."`);
    if (lh.allKwCount) parts.push(`${lh.allKwCount} keywords`);
    return parts.join(" · ") || "listings created";
  }
  function buildListingSummary(): string {
    const allLH = successfulProviders.map(p => extractLH(p));
    const totalListings = allLH.reduce((s, h) => s + h.platformCount, 0);
    const allPlatforms = new Set(allLH.flatMap(h => h.platforms.map((p: any) => (typeof p === "string" ? p : "").toLowerCase())));
    const totalKw = new Set(allLH.flatMap(h => [...h.primaryKw, ...h.longTailKw].map((k: any) => (typeof k === "string" ? k : "").toLowerCase()))).size;
    const parts = [`${successfulProviders.length} AI listing experts created ${totalListings} professional listings across ${allPlatforms.size} platforms.`];
    if (agreement >= 80) parts.push(`Strong consensus (${agreement}%) on listing approach.`);
    const bestT = allLH.find(h => h.bestTitle)?.bestTitle;
    if (bestT) parts.push(`Best title: "${(bestT as string).slice(0, 60)}".`);
    if (totalKw) parts.push(`${totalKw} unique SEO keywords identified.`);
    if (allLH.some(h => h.postingTime)) parts.push(`Post ${allLH.find(h => h.postingTime)?.postingTime}.`);
    return parts.join(" ");
  }

  // ── Recon extraction ──
  function extractRH(p: any) {
    let d = normalizeKeys(p.data || {});
    const topKeys = Object.keys(d);
    if (topKeys.length === 1 && obj(d[topKeys[0]]) && Object.keys(d[topKeys[0]]).length >= 2) d = d[topKeys[0]];
    const competitors = getBuyerArr(d, "competitor_listings", "competitors", "competing_listings", "competitive_listings");
    const alerts = getBuyerArr(d, "market_alerts", "alerts", "action_items");
    return {
      competitors,
      competitorCount: competitors.length,
      alerts,
      demandLevel: getBuyerField(d, "demand_level", "market_demand", "demand"),
      pricePosition: getBuyerField(d, "price_position", "pricing_position", "competitive_position"),
      market: obj(d.market_analysis) || obj(d.market_overview) || null,
      strategies: getBuyerArr(d, "selling_strategies_observed", "strategies", "selling_strategies"),
      summary: d.executive_summary || d.summary || null,
    };
  }
  function getReconCollapsedDetail(p: any): string {
    const rh = extractRH(p);
    const parts: string[] = [];
    if (rh.competitorCount) parts.push(`${rh.competitorCount} competitors`);
    if (rh.demandLevel) parts.push(String(rh.demandLevel));
    if (rh.pricePosition) parts.push(String(rh.pricePosition));
    return parts.join(" · ") || "market scanned";
  }
  function buildReconSummary(): string {
    const allRH = successfulProviders.map(p => extractRH(p));
    const totalComp = allRH.reduce((s, h) => s + h.competitorCount, 0);
    const parts = [`${successfulProviders.length} AI recon specialists found ${totalComp} competing listings.`];
    if (agreement >= 80) parts.push(`Strong consensus (${agreement}%) on market position.`);
    const demand = allRH.find(h => h.demandLevel)?.demandLevel;
    if (demand) parts.push(`Market demand: ${demand}.`);
    return parts.join(" ");
  }

  // ── Vehicle extraction ──
  function extractVH(p: any) {
    let d = normalizeKeys(p.data || {});
    const topKeys = Object.keys(d);
    if (topKeys.length === 1 && obj(d[topKeys[0]]) && Object.keys(d[topKeys[0]]).length >= 2) d = d[topKeys[0]];
    const id = obj(d.identification) || d;
    const cond = obj(d.condition_assessment) || obj(d.condition) || d;
    const val = obj(d.valuation) || obj(d.pricing) || d;
    // Extract numeric score from nested objects like { score: 7, paint_condition: "Good", ... }
    const getScore = (v: any) => (v && typeof v === "object" && v.score != null) ? v.score : v;
    // Extract mid value from nested valuation objects like { low: X, mid: Y, high: Z }
    return {
      year: getBuyerField(id, "year", "vehicle_year") || getBuyerField(d, "year", "vehicle_year"),
      make: getBuyerField(id, "make", "vehicle_make") || getBuyerField(d, "make", "vehicle_make"),
      model: getBuyerField(id, "model", "vehicle_model") || getBuyerField(d, "model", "vehicle_model"),
      trim: getBuyerField(id, "trim", "trim_level"),
      condGrade: getBuyerField(cond, "overall_grade", "grade", "overall_score", "condition_score"),
      exterior: getScore(getBuyerField(cond, "exterior", "exterior_score", "exterior_condition")),
      interior: getScore(getBuyerField(cond, "interior", "interior_score", "interior_condition")),
      mechanical: getScore(getBuyerField(cond, "mechanical", "mechanical_score", "mechanical_condition")),
      retailValue: _xPrice(val.retail_value) ?? _xPrice(val.retail),
      privateParty: _xPrice(val.private_party_value) ?? _xPrice(val.private_party),
      tradeIn: _xPrice(val.trade_in_value) ?? _xPrice(val.trade_in),
      market: obj(d.market_analysis) || null,
      summary: d.executive_summary || d.summary || null,
    };
  }
  function getVehicleCollapsedDetail(p: any): string {
    const vh = extractVH(p);
    const parts: string[] = [];
    const name = [vh.year, vh.make, vh.model].filter(Boolean).join(" ");
    if (name) parts.push(name);
    if (vh.condGrade) parts.push(`Grade ${vh.condGrade}`);
    if (vh.retailValue != null) parts.push(_fp(vh.retailValue));
    return parts.join(" · ") || "vehicle assessed";
  }
  function buildVehicleSummary(): string {
    const allVH = successfulProviders.map(p => extractVH(p));
    const name = allVH.find(h => h.make)?.make ? `${allVH[0].year || ""} ${allVH[0].make || ""} ${allVH[0].model || ""}`.trim() : "this vehicle";
    const parts = [`${successfulProviders.length} AI specialists evaluated ${name}.`];
    if (agreement >= 80) parts.push(`Strong consensus (${agreement}%) on valuation.`);
    const vals = allVH.map(h => h.retailValue).filter((v): v is number => v != null);
    if (vals.length >= 2) parts.push(`Retail range: $${Math.round(Math.min(...vals)).toLocaleString()}-$${Math.round(Math.max(...vals)).toLocaleString()}.`);
    return parts.join(" ");
  }

  // ── Collectibles extraction ──
  function extractCollH(p: any) {
    let d = normalizeKeys(p.data || {});
    const topKeys = Object.keys(d);
    if (topKeys.length === 1 && obj(d[topKeys[0]]) && Object.keys(d[topKeys[0]]).length >= 2) d = d[topKeys[0]];
    // New simplified schema → old nested schema → flat fallbacks
    const vg = obj(d.visual_grading) ?? obj(d.visual_grade_assessment) ?? null;
    const valObj = obj(d.valuation) ?? null;
    const gradRoi = obj(d.grading_roi) ?? obj(d.grading_assessment) ?? null;
    const mkt = obj(d.market) ?? obj(d.market_intelligence) ?? null;
    const inv = obj(d.investment) ?? obj(d.investment_outlook) ?? null;
    const ins = obj(d.insider) ?? obj(d.collector_intelligence) ?? null;
    // Old nested wrappers
    const assess = obj(d.collectible_assessment) ?? d;
    const ident = obj(d.identification) ?? d;
    const oldVal = obj(d.collector_market) ?? d;
    const sell = (typeof d.selling_strategy === "object" && d.selling_strategy) ? d.selling_strategy : null;
    return {
      isCollectible: assess.is_collectible ?? true,
      category: d.category ?? assess.category ?? null,
      rarity: d.rarity ?? assess.rarity ?? null,
      demandLevel: mkt?.demand_trend ?? assess.demand_level ?? oldVal.demand_level ?? d.demand_trend ?? null,
      demandReasoning: mkt?.demand_reasoning ?? d.demand_reasoning ?? null,
      itemName: d.item_name ?? ident.item_name ?? null,
      year: d.year ?? ident.year ?? null,
      brandSeries: d.brand_series ?? ident.brand_series ?? null,
      editionVariation: d.edition_variation ?? ident.edition ?? null,
      // Visual grading (new schema)
      psaGrade: vg?.psa_grade ?? vg?.psa_grade_estimate ?? d.estimated_grade ?? ident.grade_estimate ?? null,
      bgsGrade: vg?.bgs_grade ?? vg?.bgs_grade_estimate ?? null,
      gradeConfidence: vg?.grade_confidence ?? null,
      corners: vg?.corners ?? null,
      edges: vg?.edges ?? null,
      surface: vg?.surface ?? vg?.surface_front ?? null,
      centering: vg?.centering ?? vg?.centering_front ?? null,
      gradeReasoning: vg?.grade_reasoning ?? null,
      gradeSensitivity: vg?.grade_sensitivity ?? null,
      // Valuation (new schema psa6-10)
      rawLow: _xPrice(valObj?.raw_low ?? d.raw_value_low ?? (obj(d.valuation) ? null : d.estimated_low)),
      rawMid: _xPrice(valObj?.raw_mid ?? d.raw_value_mid ?? (obj(d.valuation) ? null : d.estimated_mid)),
      rawHigh: _xPrice(valObj?.raw_high ?? d.raw_value_high ?? (obj(d.valuation) ? null : d.estimated_high)),
      valueReasoning: valObj?.value_reasoning ?? d.value_reasoning ?? null,
      recentComps: valObj?.recent_comps ?? mkt?.recent_ebay_comps ?? null,
      populationNote: valObj?.psa_population_note ?? d.population_data ?? null,
      psa6: _xPrice(valObj?.psa6_value), psa7: _xPrice(valObj?.psa7_value), psa8: _xPrice(valObj?.psa8_value), psa9: _xPrice(valObj?.psa9_value), psa10: _xPrice(valObj?.psa10_value),
      gradedValue: _xPrice(valObj?.psa10_value ?? oldVal.graded_value ?? d.graded_value),
      priceTrend: mkt?.demand_trend ?? valObj?.price_trend ?? d.demand_trend ?? null,
      // Grading ROI (new schema)
      gradingRec: gradRoi?.recommendation ?? gradRoi?.grading_recommendation ?? d.grading_recommendation ?? null,
      gradingReasoning: gradRoi?.reasoning ?? gradRoi?.grading_reasoning ?? d.grading_roi_reasoning ?? null,
      breakEvenGrade: gradRoi?.break_even_grade ?? null,
      bestGradingService: gradRoi?.best_grading_service ?? null,
      psaStandardCost: gradRoi?.psa_standard_cost ?? null,
      // Market (new schema)
      bestPlatform: mkt?.best_platform ?? d.best_platform ?? null,
      platformReasoning: mkt?.platform_reasoning ?? d.platform_reasoning ?? null,
      listingTitle: mkt?.listing_title ?? d.listing_title ?? null,
      buyItNowPrice: _xPrice(mkt?.buy_it_now_price),
      sellingStrategy: mkt?.selling_strategy ?? (typeof d.selling_strategy === "string" ? d.selling_strategy : sell?.best_venue ?? null),
      // Investment (new schema)
      price1yr: inv?.price_1yr ?? inv?.price_target_1yr ?? null,
      price5yr: inv?.price_5yr ?? inv?.price_target_5yr ?? null,
      catalysts: inv?.catalysts ?? inv?.value_catalysts ?? null,
      risks: inv?.risks ?? inv?.risk_factors ?? null,
      investmentVerdict: inv?.verdict ?? inv?.hold_vs_sell ?? null,
      // Insider (new schema)
      communitySentiment: ins?.community_sentiment ?? null,
      insiderKnowledge: ins?.insider_knowledge ?? d.collector_notes ?? null,
      notableVariations: ins?.notable_variations ?? d.notable_variations ?? null,
      authenticationNotes: ins?.authentication_notes ?? null,
      // Summary
      summary: d.expertsummary ?? d.executive_summary ?? d.summary ?? null,
      potentialValue: d.potential_value ?? null,
      confidenceLevel: d.confidencelevel ?? d.confidence_level ?? null,
      // Legacy fallbacks
      conditionGrade: ident.condition_grade ?? d.condition_grade ?? null,
      gradingStatus: ident.grading_status ?? null,
      gradeEstimate: vg?.psa_grade ?? d.estimated_grade ?? ident.grade_estimate ?? null,
      valueLow: _xPrice(valObj?.raw_low ?? d.raw_value_low ?? d.estimated_low),
      valueMid: _xPrice(valObj?.raw_mid ?? d.raw_value_mid ?? d.estimated_mid),
      valueHigh: _xPrice(valObj?.raw_high ?? d.raw_value_high ?? d.estimated_high),
      shouldGrade: sell?.should_grade ?? null,
      bestVenue: sell?.best_venue ?? mkt?.best_platform ?? d.best_platform ?? null,
    };
  }
  function getCollectiblesCollapsedDetail(p: any): string {
    const ch = extractCollH(p);
    const parts: string[] = [];
    if (ch.category) parts.push(ch.category);
    if (ch.rarity) parts.push(ch.rarity);
    if (ch.valueLow && ch.valueHigh) parts.push(`$${ch.valueLow}-$${ch.valueHigh}`);
    if (ch.gradeEstimate) parts.push(`Grade: ${ch.gradeEstimate}`);
    return parts.join(" · ") || "assessed";
  }
  function buildCollectiblesSummary(): string {
    const allCH = successfulProviders.map(p => extractCollH(p));
    const parts = [`${successfulProviders.length} AI collectibles experts evaluated this item.`];
    if (agreement >= 80) parts.push(`Strong consensus (${agreement}%).`);
    const name = allCH.find(h => h.itemName)?.itemName;
    if (name) parts.push(`Item: ${name}.`);
    const cat = allCH.find(h => h.category)?.category;
    const rarity = allCH.find(h => h.rarity)?.rarity;
    if (cat && rarity) parts.push(`${cat} — ${rarity}.`);
    else if (cat) parts.push(`Category: ${cat}.`);
    // Raw valuation consensus
    const rawMids = allCH.map(h => h.rawMid ?? h.valueMid).filter((v): v is number => v != null);
    if (rawMids.length) parts.push(`Avg raw value: $${Math.round(rawMids.reduce((a, b) => a + Number(b), 0) / rawMids.length).toLocaleString()}.`);
    // Grade consensus
    const grades = allCH.map(h => h.psaGrade).filter(Boolean);
    if (grades.length) parts.push(`PSA estimates: ${grades.join(", ")}.`);
    // Grading recommendation consensus
    const recs = allCH.map(h => h.gradingRec).filter(Boolean);
    if (recs.length) {
      const strongCount = recs.filter((r: any) => String(r).toLowerCase().includes("strong")).length;
      if (strongCount >= recs.length / 2) parts.push("Majority recommend grading.");
    }
    // Best platform consensus
    const platforms = allCH.map(h => h.bestPlatform).filter(Boolean);
    if (platforms.length) parts.push(`Best platform: ${platforms[0]}.`);
    // Investment verdict
    const verdict = allCH.find(h => h.investmentVerdict)?.investmentVerdict;
    if (verdict) parts.push(`Verdict: ${verdict}.`);
    // Summary from any agent
    const summary = allCH.find(h => h.summary)?.summary;
    if (summary) parts.push(summary);
    return parts.join(" ");
  }

  // ── Antique extraction ──
  function extractAH(p: any) {
    let d = normalizeKeys(p.data || {});
    const topKeys = Object.keys(d);
    if (topKeys.length === 1 && obj(d[topKeys[0]]) && Object.keys(d[topKeys[0]]).length >= 2) d = d[topKeys[0]];
    const auth = obj(d.authentication) || obj(d.authenticity) || d;
    const hist = obj(d.historical_research) || obj(d.history) || d;
    const val = obj(d.valuation) || obj(d.pricing) || d;
    return {
      verdict: getBuyerField(auth, "verdict", "authentication_verdict", "is_authentic"),
      confidence: getBuyerField(auth, "confidence", "authentication_confidence"),
      era: getBuyerField(hist, "era", "period", "date_range") || getBuyerField(d, "era", "period"),
      maker: getBuyerField(hist, "maker", "manufacturer", "artisan") || getBuyerField(d, "maker"),
      fairMarket: _xPrice(val.fair_market) ?? _xPrice(val.fair_market_value),
      auctionEst: _xPrice(val.auction) ?? _xPrice(val.auction_estimate) ?? _xPrice(val.auction_value),
      insurance: _xPrice(val.insurance) ?? _xPrice(val.insurance_value),
      collectorMarket: obj(d.collector_market) || obj(d.collector_info) || null,
      summary: d.executive_summary || d.summary || null,
    };
  }
  function getAntiqueCollapsedDetail(p: any): string {
    const ah = extractAH(p);
    const parts: string[] = [];
    if (ah.verdict) parts.push(String(ah.verdict));
    if (ah.era) parts.push(String(ah.era));
    if (ah.auctionEst != null) parts.push(_fp(ah.auctionEst));
    if (ah.confidence) parts.push(`${ah.confidence}%`);
    return parts.join(" · ") || "antique assessed";
  }
  function buildAntiqueSummary(): string {
    const allAH = successfulProviders.map(p => extractAH(p));
    const parts = [`${successfulProviders.length} AI antique specialists evaluated this item.`];
    if (agreement >= 80) parts.push(`Strong consensus (${agreement}%) on authentication.`);
    const verdicts = allAH.map(h => h.verdict).filter(Boolean);
    if (verdicts.length) parts.push(`Authentication: ${verdicts[0]}.`);
    const era = allAH.find(h => h.era)?.era;
    if (era) parts.push(`Era: ${era}.`);
    return parts.join(" ");
  }

  // ── Photo extraction ──
  function extractPhH(p: any) {
    let d = normalizeKeys(p.data || {});
    const topKeys = Object.keys(d);
    if (topKeys.length === 1 && obj(d[topKeys[0]]) && Object.keys(d[topKeys[0]]).length >= 2) d = d[topKeys[0]];
    const tips = getBuyerArr(d, "improvement_tips", "tips", "improvements", "recommendations");
    const missing = getBuyerArr(d, "missing_angles", "missing_shots", "needed_angles");
    return {
      qualityScore: getBuyerField(d, "overall_quality_score", "photo_quality", "quality_score", "overall_score"),
      tips,
      tipCount: tips.length,
      missing,
      missingCount: missing.length,
      platformRecs: obj(d.platform_recommendations) || obj(d.platform_specific_photos) || null,
      staging: getBuyerArr(d, "staging_concepts", "staging_ideas", "lifestyle_concepts"),
      summary: d.executive_summary || d.summary || null,
    };
  }
  function getPhotoCollapsedDetail(p: any): string {
    const ph = extractPhH(p);
    const parts: string[] = [];
    if (ph.qualityScore != null) parts.push(`${ph.qualityScore}/10 quality`);
    if (ph.missingCount) parts.push(`${ph.missingCount} missing angles`);
    if (ph.tipCount) parts.push(`${ph.tipCount} tips`);
    return parts.join(" · ") || "photos assessed";
  }
  function buildPhotoSummary(): string {
    const allPh = successfulProviders.map(p => extractPhH(p));
    const scores = allPh.map(h => h.qualityScore).filter(Boolean).map(Number);
    const avgScore = scores.length ? (scores.reduce((s, n) => s + n, 0) / scores.length).toFixed(1) : "N/A";
    const parts = [`${successfulProviders.length} AI photo specialists scored your photos ${avgScore}/10 average.`];
    if (agreement >= 80) parts.push(`Strong consensus (${agreement}%) on photo quality.`);
    const totalTips = allPh.reduce((s, h) => s + h.tipCount, 0);
    if (totalTips) parts.push(`${totalTips} improvement tips identified.`);
    return parts.join(" ");
  }

  // ── Pricing extraction ──
  function extractPH(p: any) {
    let d = normalizeKeys(p.data || {});
    const topKeys = Object.keys(d);
    if (topKeys.length === 1 && obj(d[topKeys[0]]) && Object.keys(d[topKeys[0]]).length >= 2) d = d[topKeys[0]];
    const pv = obj(d.price_validation) || d;
    const ma = obj(d.market_analysis) || d;
    const ng = obj(d.negotiation_guide) || d;
    const pp = obj(d.platform_pricing) || {};
    const rp = obj(d.regional_pricing) || d;
    const ph = obj(d.price_history) || d;
    const pf = obj(d.price_factors) || d;
    const ip = obj(d.international_pricing) || d;
    const lt = obj(d.liquidation_timeline) || d;
    const pk = (...keys: string[]) => { for (const k of keys) { if (d[k] != null && d[k] !== "") return d[k]; } return null; };
    return {
      priceLow: pv.revised_low || pk("estimated_value_low", "price_low"),
      priceMid: pv.revised_mid || pk("estimated_value_mid", "price_mid"),
      priceHigh: pv.revised_high || pk("estimated_value_high", "price_high"),
      confidence: pk("pricing_confidence", "confidence", "overall_confidence") || (obj(d.confidence) ? (d.confidence as any).overall_confidence : null),
      rationale: pv.revision_reasoning || pk("pricing_rationale", "rationale"),
      agreesWithEstimate: pv.agrees_with_initial_estimate ?? pv.agrees_with_estimate,
      comparables: getComparables(d),
      platformPricing: pp,
      bestPlatform: pp.best_platform || pk("best_platform"),
      demandLevel: ma.demand_level || pk("demand_level"),
      demandTrend: ma.demand_trend || pk("demand_trend"),
      supplyLevel: ma.supply_level || pk("supply_level"),
      seasonal: ma.seasonal_factors || pk("seasonal_factors"),
      categoryHealth: ma.category_health || pk("category_health"),
      localEstimate: rp.local_estimate,
      bestMarket: rp.best_market || pk("best_market"),
      shipVsLocal: rp.ship_vs_local_verdict || pk("ship_vs_local_verdict"),
      listPrice: ng.list_price || pk("list_price"),
      minAccept: ng.minimum_accept || pk("minimum_accept"),
      sweetSpot: ng.sweet_spot || pk("sweet_spot"),
      firstOffer: ng.first_offer_expect,
      counterStrategy: ng.counter_strategy,
      urgencyFactor: ng.urgency_factor,
      valueAdders: pf.value_adders || d.value_adders || [],
      valueReducers: pf.value_reducers || d.value_reducers || [],
      priceHistoryTrend: ph.trend_2_5_years || pk("price_trend"),
      trendEvidence: ph.trend_evidence,
      appreciationPotential: ph.appreciation_potential || pk("appreciation_potential"),
      investmentGrade: ph.investment_grade,
      internationalPricing: obj(d.international_pricing),
      insuranceValue: pk("insurance_value"),
      liquidationValue: pk("liquidation_value"),
      collectorPremium: pk("collector_premium"),
      wholesaleRetail: obj(d.wholesale_vs_retail),
      liquidationTimeline: obj(d.liquidation_timeline),
      summary: pk("executive_summary", "summary"),
    };
  }

  function getPricingCollapsedDetail(p: any): string {
    const ph = extractPH(p);
    const parts: string[] = [];
    if (ph.priceLow != null && ph.priceHigh != null) parts.push(`$${Math.round(Number(ph.priceLow))}-$${Math.round(Number(ph.priceHigh))}`);
    if (ph.bestPlatform && typeof ph.bestPlatform === "string") parts.push(ph.bestPlatform.split(" ")[0]);
    if (ph.demandLevel) parts.push(`${ph.demandLevel} demand`);
    if (ph.confidence != null) parts.push(`${Math.round(Number(ph.confidence))}%`);
    return parts.join(" · ") || "";
  }

  function buildPricingSummary(): string {
    const parts: string[] = [];
    const agentCount = successfulProviders.length;
    const allPH = successfulProviders.map(p => extractPH(p));
    const lows = allPH.map(h => h.priceLow).filter(Boolean).map(Number);
    const highs = allPH.map(h => h.priceHigh).filter(Boolean).map(Number);
    const consLow = lows.length ? Math.round(lows.reduce((a, b) => a + b, 0) / lows.length) : null;
    const consHigh = highs.length ? Math.round(highs.reduce((a, b) => a + b, 0) / highs.length) : null;
    if (consLow && consHigh) parts.push(`${agentCount} AI pricing experts valued this between $${consLow}-$${consHigh}.`);
    const demands = allPH.map(h => h.demandLevel).filter(Boolean);
    if (demands.length) parts.push(`Demand: ${demands[0]} with ${allPH[0]?.demandTrend || "stable"} trend.`);
    const totalComps = allPH.reduce((s, h) => s + (h.comparables?.length || 0), 0);
    if (totalComps) parts.push(`${totalComps} comparable sales found across all agents.`);
    const bp = allPH.find(h => h.bestPlatform)?.bestPlatform;
    if (bp) parts.push(`Best platform: ${typeof bp === "string" ? bp : "varies by agent"}.`);
    const lp = allPH.find(h => h.listPrice)?.listPrice;
    const ma = allPH.find(h => h.minAccept)?.minAccept;
    if (lp && ma) parts.push(`List at $${Math.round(Number(lp))}, don't accept below $${Math.round(Number(ma))}.`);
    const bestExec = allPH.map(h => h.summary).filter((s): s is string => !!s && s.length > 40).sort((a, b) => b.length - a.length)[0];
    if (bestExec && parts.length < 5) parts.push(bestExec.split(/(?<=[.!?])\s+/).slice(0, 2).join(" "));
    return parts.join(" ") || `${agentCount} AI agents analyzed pricing for this item.`;
  }

  return (
    <div style={{
      marginTop: "0.85rem",
      background: "linear-gradient(135deg, rgba(139,92,246,0.06), rgba(0,188,212,0.04))",
      border: "1px solid rgba(139,92,246,0.2)",
      borderRadius: "0.75rem",
      padding: "0.85rem 1rem",
    }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.6rem" }}>
        <span style={{ fontSize: "0.9rem" }}>⚡</span>
        <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "#a855f7", textTransform: "uppercase", letterSpacing: "0.05em" }}>
          {isPricing ? "MegaBot Deep Pricing" : isBuyers ? "MegaBot Buyer Intelligence" : isListing ? "MegaBot Listing Intelligence" : isRecon ? "MegaBot Competitive Intel" : isCarbot ? "MegaBot Vehicle Evaluation" : isAntique ? "MegaBot Antique Assessment" : isPhotos ? "MegaBot Photo Analysis" : isCollectibles ? "MegaBot Collectibles Assessment" : "MegaBot Deep Analysis"} — {successfulProviders.length} AI Expert{successfulProviders.length !== 1 ? "s" : ""}
        </span>
        {/* Freshness indicator */}
        {result?.timestamp && (() => {
          const ts = new Date(result.timestamp);
          const hours = Math.round((Date.now() - ts.getTime()) / 3600000);
          const label = hours < 1 ? "Just now" : hours < 24 ? `${hours}h ago` : `${Math.round(hours / 24)}d ago`;
          return <span style={{ fontSize: "0.55rem", color: "var(--text-muted)", fontWeight: 400 }}>· {label}</span>;
        })()}
        {failedProviders.length > 0 && failedProviders.length < providerArray.length && (
          <span style={{ fontSize: "0.58rem", color: "var(--text-muted)", opacity: 0.6, fontWeight: 400 }}>({failedProviders.length} of {providerArray.length} unavailable)</span>
        )}
        {failedProviders.length > 0 && failedProviders.length >= providerArray.length && (
          <span style={{ fontSize: "0.58rem", color: "#ef4444", opacity: 0.7 }}>All experts unavailable</span>
        )}
      </div>

      {/* Agreement bar */}
      <div style={{ marginBottom: "0.65rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.72rem", marginBottom: "0.2rem" }}>
          <span style={{ color: "var(--text-secondary)" }}>AI Agreement</span>
          <span style={{ fontWeight: 700, color: agreement >= 80 ? "#4caf50" : agreement >= 60 ? "#ff9800" : "#ef4444" }}>
            {agreement}% — {agreement >= 80 ? "Strong Consensus" : agreement >= 60 ? "Moderate Agreement" : "Agents Disagree — review details"}
          </span>
        </div>
        <div style={{ height: 5, borderRadius: 99, background: "var(--ghost-bg)", overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${agreement}%`, borderRadius: 99, background: agreement >= 80 ? "#4caf50" : agreement >= 60 ? "#ff9800" : "#ef4444" }} />
        </div>
      </div>

      {/* Per-agent cards */}
      {successfulProviders.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem", marginBottom: "0.65rem" }}>
          {successfulProviders.map((p: any) => {
            const meta = PROVIDER_META[p.provider] || { icon: "🤖", label: p.provider, color: "#888", specialty: "", collapsedFocus: "overview" };
            const isExpanded = expanded === p.provider;
            const isShowingRaw = showRawJson === p.provider;
            const h = extractHighlights(p);
            const insight = getKeyInsight(p);
            const timeStr = (p.durationMs || p.responseTime) ? `${((p.durationMs || p.responseTime) / 1000).toFixed(1)}s` : "";
            const condNum = h.condOverall != null ? Number(h.condOverall) : null;
            const condLbl = h.condLabel || (condNum != null ? condWord(condNum) : null);
            const collapsedSnippet = getCollapsedDetail(p, h);

            // Count how many deep knowledge sections this agent provided
            const knowledgeSections = [h.productHistory, h.makerHistory, h.construction, h.specialFeatures, h.tipsAndFacts, h.commonIssues, h.careInstructions, h.similarItems, h.collectorInfo].filter(Boolean);

            return (
              <div key={p.provider} style={{
                background: isExpanded ? "var(--ghost-bg)" : "var(--bg-card)",
                borderTop: isExpanded ? `3px solid ${meta.color}` : undefined,
                border: `1px solid ${isExpanded ? `${meta.color}30` : "var(--border-default)"}`,
                borderRadius: "0.5rem", overflow: "hidden",
                transition: "all 0.2s ease",
                boxShadow: isExpanded ? "0 4px 20px rgba(0,0,0,0.15)" : "none",
              }}>
                {/* Collapsed: item-focused one-liner */}
                <button
                  onClick={() => setExpanded(isExpanded ? null : p.provider)}
                  style={{
                    width: "100%", display: "flex", alignItems: "center", gap: "0.4rem",
                    padding: "0.55rem 0.65rem", background: "transparent", border: "none",
                    cursor: "pointer", textAlign: "left",
                  }}
                >
                  <span style={{ fontSize: "0.85rem", flexShrink: 0 }}>{meta.icon}</span>
                  <span style={{ fontWeight: 700, fontSize: "0.72rem", color: meta.color, minWidth: 52, flexShrink: 0 }}>{meta.label}</span>
                  <span style={{ fontSize: "0.68rem", color: "var(--text-secondary)", flex: 1, overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>
                    {isPricing ? (getPricingCollapsedDetail(p) || h.itemName || "—")
                      : isBuyers ? (getBuyerCollapsedDetail(p) || h.itemName || "—")
                      : isListing ? (getListingCollapsedDetail(p) || "listings generated")
                      : isRecon ? (getReconCollapsedDetail(p) || "market scanned")
                      : isCarbot ? (getVehicleCollapsedDetail(p) || "vehicle assessed")
                      : isAntique ? (getAntiqueCollapsedDetail(p) || "antique assessed")
                      : isPhotos ? (getPhotoCollapsedDetail(p) || "photos assessed")
                      : isCollectibles ? (getCollectiblesCollapsedDetail(p) || "collectible assessed")
                      : (
                      <>
                        {h.itemName || p.itemName || "—"}
                        {condNum != null && <> · {condNum}/10 {condLbl}</>}
                        {collapsedSnippet && <> · {collapsedSnippet}</>}
                        {h.isTextOnly && <span style={{ color: "#ff9800", marginLeft: "0.25rem" }}>(text only)</span>}
                      </>
                    )}
                  </span>
                  <span style={{ fontSize: "0.6rem", color: "#4caf50", flexShrink: 0 }}>✅</span>
                  <span style={{ fontSize: "0.6rem", color: "var(--text-muted)", flexShrink: 0 }}>{timeStr}</span>
                  <span style={{ fontSize: "0.6rem", color: "var(--text-muted)", transition: "transform 0.2s", transform: isExpanded ? "rotate(180deg)" : "none", flexShrink: 0 }}>▾</span>
                </button>

                {/* Expanded content */}
                {isExpanded && (
                  <div style={{ padding: "0 0.75rem 0.75rem", borderTop: `1px solid ${meta.color}15` }}>

                    {isPricing ? (() => {
                      const ph = extractPH(p);
                      const comps = Array.isArray(ph.comparables) ? ph.comparables : [];
                      const platEntries = ph.platformPricing && typeof ph.platformPricing === "object" ? Object.entries(ph.platformPricing).filter(([k]) => k !== "best_platform") : [];
                      const adders = Array.isArray(ph.valueAdders) ? ph.valueAdders : [];
                      const reducers = Array.isArray(ph.valueReducers) ? ph.valueReducers : [];
                      return (<>
                        {/* PRICE ASSESSMENT */}
                        <div style={{ marginTop: "0.5rem", marginBottom: "0.5rem", padding: "0.6rem", background: "var(--bg-card)", borderRadius: "0.5rem", border: "1px solid var(--border-default)" }}>
                          <div style={{ fontSize: "0.55rem", textTransform: "uppercase", letterSpacing: "0.1em", color: meta.color, fontWeight: 700, marginBottom: "0.35rem" }}>Price Assessment</div>
                          <div style={{ display: "flex", alignItems: "baseline", gap: "0.5rem", marginBottom: "0.3rem" }}>
                            <span style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--accent)" }}>${ph.priceLow != null ? Math.round(Number(ph.priceLow)) : "?"}</span>
                            <span style={{ color: "var(--text-muted)" }}>—</span>
                            <span style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--accent)" }}>${ph.priceHigh != null ? Math.round(Number(ph.priceHigh)) : "?"}</span>
                            {ph.priceMid != null && <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>mid ${Math.round(Number(ph.priceMid))}</span>}
                            {ph.confidence != null && <span style={{ fontSize: "0.68rem", fontWeight: 600, color: Number(ph.confidence) >= 70 ? "#4caf50" : "#ff9800" }}>{Math.round(Number(ph.confidence))}% conf.</span>}
                          </div>
                          {ph.rationale && <p style={{ fontSize: "0.7rem", color: "var(--text-secondary)", margin: 0, lineHeight: 1.4 }}>{typeof ph.rationale === "string" && ph.rationale.length > 200 ? ph.rationale.slice(0, 200) + "..." : ph.rationale}</p>}
                        </div>

                        {/* COMPARABLE SALES */}
                        {comps.length > 0 && (
                          <div style={{ marginBottom: "0.5rem", padding: "0.5rem 0.6rem", background: "var(--bg-card)", borderRadius: "0.5rem", border: "1px solid var(--border-default)" }}>
                            <div style={{ fontSize: "0.55rem", textTransform: "uppercase", letterSpacing: "0.1em", color: meta.color, fontWeight: 700, marginBottom: "0.3rem" }}>Comparable Sales ({comps.length})</div>
                            {comps.slice(0, 5).map((c: any, i: number) => (
                              <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.25rem 0", borderBottom: i < Math.min(comps.length, 5) - 1 ? "1px solid var(--border-default)" : "none" }}>
                                <span style={{ fontSize: "0.65rem", color: "var(--text-muted)", minWidth: 60 }}>{c.platform}</span>
                                <span style={{ fontSize: "0.68rem", color: "var(--text-secondary)", flex: 1, overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>{c.item_description}</span>
                                <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--accent)", flexShrink: 0 }}>${c.sold_price}</span>
                                <span style={{ fontSize: "0.55rem", padding: "0.05rem 0.3rem", borderRadius: 99, background: c.relevance === "High" ? "rgba(76,175,80,0.12)" : "rgba(255,152,0,0.12)", color: c.relevance === "High" ? "#4caf50" : "#ff9800" }}>{c.relevance}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* PLATFORM BREAKDOWN */}
                        {platEntries.length > 0 && (
                          <div style={{ marginBottom: "0.5rem", padding: "0.5rem 0.6rem", background: "var(--bg-card)", borderRadius: "0.5rem", border: "1px solid var(--border-default)" }}>
                            <div style={{ fontSize: "0.55rem", textTransform: "uppercase", letterSpacing: "0.1em", color: meta.color, fontWeight: 700, marginBottom: "0.3rem" }}>Platform Breakdown</div>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: "0.35rem" }}>
                              {platEntries.slice(0, 6).map(([key, plat]: [string, any]) => {
                                if (!plat || typeof plat !== "object") return null;
                                const name = key.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase());
                                const listP = plat.list_price || plat.recommended_list_price;
                                const netP = plat.seller_net || plat.seller_net_after_fees;
                                const days = plat.days_to_sell || plat.avg_days_to_sell;
                                return (
                                  <div key={key} style={{ padding: "0.35rem", borderRadius: "0.35rem", border: "1px solid var(--border-default)", background: "var(--bg-card)" }}>
                                    <div style={{ fontSize: "0.62rem", fontWeight: 600, color: "var(--text-primary)" }}>{name}</div>
                                    {listP != null && <div style={{ fontSize: "0.65rem", color: "var(--text-muted)" }}>List ${listP}{netP != null && <> → <strong style={{ color: "#4caf50" }}>${netP}</strong></>}</div>}
                                    {days != null && <div style={{ fontSize: "0.58rem", color: "var(--text-muted)" }}>~{days}d</div>}
                                  </div>
                                );
                              })}
                            </div>
                            {ph.bestPlatform && typeof ph.bestPlatform === "string" && <div style={{ fontSize: "0.68rem", color: "var(--text-secondary)", marginTop: "0.3rem" }}>Best: {ph.bestPlatform}</div>}
                          </div>
                        )}

                        {/* MARKET INTELLIGENCE */}
                        {(ph.demandLevel || ph.demandTrend || ph.seasonal) && (
                          <div style={{ marginBottom: "0.5rem", padding: "0.5rem 0.6rem", background: "var(--bg-card)", borderRadius: "0.5rem", border: "1px solid var(--border-default)" }}>
                            <div style={{ fontSize: "0.55rem", textTransform: "uppercase", letterSpacing: "0.1em", color: meta.color, fontWeight: 700, marginBottom: "0.3rem" }}>Market Intelligence</div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.2rem 0.75rem" }}>
                              {ph.demandLevel && <GridRow label="DEMAND" value={`${ph.demandLevel}`} />}
                              {ph.demandTrend && <GridRow label="TREND" value={`${ph.demandTrend}`} />}
                              {ph.supplyLevel && <GridRow label="SUPPLY" value={`${ph.supplyLevel}`} />}
                              {ph.seasonal && typeof ph.seasonal === "string" && <GridRow label="SEASONAL" value={ph.seasonal.length > 60 ? ph.seasonal.slice(0, 60) + "..." : ph.seasonal} />}
                            </div>
                          </div>
                        )}

                        {/* DEEP PRICING KNOWLEDGE */}
                        {(ph.priceHistoryTrend || ph.internationalPricing || ph.listPrice || adders.length > 0 || ph.liquidationTimeline) && (
                          <div style={{ marginBottom: "0.5rem", padding: "0.5rem 0.6rem", background: "linear-gradient(135deg, rgba(139,92,246,0.04), rgba(0,188,212,0.02))", borderRadius: "0.5rem", border: "1px solid rgba(139,92,246,0.15)" }}>
                            <div style={{ fontSize: "0.55rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "#a855f7", fontWeight: 700, marginBottom: "0.4rem" }}>Deep Pricing Intelligence</div>
                            <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                              {ph.priceHistoryTrend && <KnowledgeSection icon="📈" title="Price History & Trends" text={`${ph.priceHistoryTrend}${ph.trendEvidence ? ` — ${ph.trendEvidence}` : ""}${ph.appreciationPotential ? ` Appreciation: ${ph.appreciationPotential}` : ""}`} />}
                              {ph.internationalPricing && <KnowledgeSection icon="🌍" title="International Markets" text={Object.entries(ph.internationalPricing).filter(([, v]) => v != null).map(([k, v]) => `${k.replace(/_/g, " ")}: $${v}`).join(" · ")} />}
                              {ph.listPrice && <KnowledgeSection icon="🤝" title="Negotiation Guide" text={`List at $${Math.round(Number(ph.listPrice))}${ph.sweetSpot ? `, sweet spot $${Math.round(Number(ph.sweetSpot))}` : ""}${ph.minAccept ? `, floor $${Math.round(Number(ph.minAccept))}` : ""}${ph.counterStrategy ? `. ${ph.counterStrategy}` : ""}`} />}
                              {(adders.length > 0 || reducers.length > 0) && <KnowledgeSection icon="⚡" title="Value Factors" text={[...adders.slice(0, 3).map((a: any) => `+${a.impact || ""}: ${a.factor}`), ...reducers.slice(0, 2).map((r: any) => `${r.impact || ""}: ${r.factor}`)].join(" | ")} />}
                              {ph.liquidationTimeline && <KnowledgeSection icon="⏱️" title="Liquidation Timeline" text={`Day 1: $${(ph.liquidationTimeline as any).day_1_price || "?"} → Day 7: $${(ph.liquidationTimeline as any).day_7_price || "?"} → Day 30: $${(ph.liquidationTimeline as any).day_30_price || "?"} → Day 90: $${(ph.liquidationTimeline as any).day_90_price || "?"}`} />}
                              {ph.collectorPremium && typeof ph.collectorPremium === "string" && <KnowledgeSection icon="💎" title="Collector Premium" text={ph.collectorPremium} />}
                            </div>
                          </div>
                        )}
                      </>);
                    })() : isBuyers ? (() => {
                      const bh = extractBH(p);
                      return (<>
                        {/* BUYER PROFILES */}
                        {bh.profiles.length > 0 && (
                          <div style={{ marginTop: "0.5rem", marginBottom: "0.5rem", padding: "0.6rem", background: "var(--bg-card)", borderRadius: "0.5rem", border: "1px solid var(--border-default)" }}>
                            <div style={{ fontSize: "0.55rem", textTransform: "uppercase", letterSpacing: "0.1em", color: meta.color, fontWeight: 700, marginBottom: "0.35rem" }}>
                              Buyer Profiles ({bh.profiles.length})
                            </div>
                            {bh.profiles.slice(0, 4).map((bp: any, i: number) => (
                              <div key={i} style={{ padding: "0.4rem 0.5rem", marginBottom: i < Math.min(bh.profiles.length, 4) - 1 ? "0.3rem" : 0, borderRadius: "0.4rem", background: "var(--bg-card)", border: "1px solid var(--border-default)" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", flexWrap: "wrap" }}>
                                  <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-primary)" }}>🎯 {bp.profile_name || bp.name || "Buyer"}</span>
                                  <span style={{ fontSize: "0.55rem", padding: "0.08rem 0.35rem", borderRadius: 99, background: (bp.likelihood_to_buy || "").toLowerCase().includes("very") ? "rgba(76,175,80,0.15)" : (bp.likelihood_to_buy || "").toLowerCase().includes("high") ? "rgba(76,175,80,0.1)" : "rgba(255,152,0,0.1)", color: (bp.likelihood_to_buy || "").toLowerCase().includes("high") || (bp.likelihood_to_buy || "").toLowerCase().includes("very") ? "#4caf50" : "#ff9800" }}>{bp.likelihood_to_buy || bp.likelihood || "Medium"}</span>
                                  {bp.buyer_type && <span style={{ fontSize: "0.55rem", color: "var(--text-muted)" }}>{bp.buyer_type}</span>}
                                </div>
                                {bp.estimated_offer_range && <div style={{ fontSize: "0.68rem", fontWeight: 600, color: "var(--accent)", marginTop: "0.15rem" }}>{bp.estimated_offer_range}</div>}
                                {bp.motivation && <div style={{ fontSize: "0.65rem", color: "var(--text-secondary)", marginTop: "0.1rem", lineHeight: 1.3 }}>{typeof bp.motivation === "string" && bp.motivation.length > 100 ? bp.motivation.slice(0, 100) + "..." : bp.motivation}</div>}
                                {bp.best_approach && <div style={{ fontSize: "0.6rem", color: "var(--text-muted)", marginTop: "0.1rem", fontStyle: "italic" }}>💡 {typeof bp.best_approach === "string" && bp.best_approach.length > 80 ? bp.best_approach.slice(0, 80) + "..." : bp.best_approach}</div>}
                              </div>
                            ))}
                          </div>
                        )}

                        {/* PLATFORM OPPORTUNITIES */}
                        {bh.platforms.length > 0 && (
                          <div style={{ marginBottom: "0.5rem", padding: "0.5rem 0.6rem", background: "var(--bg-card)", borderRadius: "0.5rem", border: "1px solid var(--border-default)" }}>
                            <div style={{ fontSize: "0.55rem", textTransform: "uppercase", letterSpacing: "0.1em", color: meta.color, fontWeight: 700, marginBottom: "0.3rem" }}>Platform Opportunities ({bh.platforms.length})</div>
                            <div style={{ overflowX: "auto" }}>
                              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.68rem" }}>
                                <thead>
                                  <tr style={{ borderBottom: "1px solid var(--border-default)" }}>
                                    <th style={{ textAlign: "left", padding: "0.2rem 0.3rem", color: "var(--text-muted)", fontWeight: 600 }}>Platform</th>
                                    <th style={{ textAlign: "center", padding: "0.2rem 0.3rem", color: "var(--text-muted)", fontWeight: 600 }}>Level</th>
                                    <th style={{ textAlign: "right", padding: "0.2rem 0.3rem", color: "var(--text-muted)", fontWeight: 600 }}>Buyers</th>
                                    <th style={{ textAlign: "right", padding: "0.2rem 0.3rem", color: "var(--text-muted)", fontWeight: 600 }}>Avg $</th>
                                    <th style={{ textAlign: "right", padding: "0.2rem 0.3rem", color: "var(--text-muted)", fontWeight: 600 }}>Days</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {bh.platforms.slice(0, 5).map((pl: any, i: number) => (
                                    <tr key={i} style={{ borderBottom: i < Math.min(bh.platforms.length, 5) - 1 ? "1px solid var(--border-default)" : "none" }}>
                                      <td style={{ padding: "0.25rem 0.3rem", color: "var(--text-primary)", fontWeight: 600 }}>{pl.platform || "Unknown"}</td>
                                      <td style={{ padding: "0.25rem 0.3rem", textAlign: "center" }}>
                                        <span style={{ fontSize: "0.55rem", padding: "0.05rem 0.3rem", borderRadius: 99, background: (pl.opportunity_level || "").toLowerCase().includes("excel") ? "rgba(76,175,80,0.12)" : "rgba(255,152,0,0.12)", color: (pl.opportunity_level || "").toLowerCase().includes("excel") ? "#4caf50" : "#ff9800" }}>{pl.opportunity_level || "—"}</span>
                                      </td>
                                      <td style={{ padding: "0.25rem 0.3rem", textAlign: "right", color: "var(--text-secondary)" }}>{pl.estimated_buyers != null ? `~${pl.estimated_buyers}` : "—"}</td>
                                      <td style={{ padding: "0.25rem 0.3rem", textAlign: "right", color: "var(--accent)", fontWeight: 600 }}>{pl.avg_sale_price_here != null || pl.avg_sale_price != null ? `$${pl.avg_sale_price_here || pl.avg_sale_price}` : "—"}</td>
                                      <td style={{ padding: "0.25rem 0.3rem", textAlign: "right", color: "var(--text-muted)" }}>{pl.avg_days_to_sell != null ? `~${pl.avg_days_to_sell}d` : "—"}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                            {bh.bestPlatform && typeof bh.bestPlatform === "string" && <div style={{ fontSize: "0.65rem", color: "var(--text-secondary)", marginTop: "0.3rem" }}>Best: {bh.bestPlatform}</div>}
                          </div>
                        )}

                        {/* HOT LEADS */}
                        {bh.hotLeads.length > 0 && (
                          <div style={{ marginBottom: "0.5rem", padding: "0.5rem 0.6rem", background: "var(--bg-card)", borderRadius: "0.5rem", border: "1px solid var(--border-default)" }}>
                            <div style={{ fontSize: "0.55rem", textTransform: "uppercase", letterSpacing: "0.1em", color: meta.color, fontWeight: 700, marginBottom: "0.3rem" }}>Hot Leads ({bh.hotLeads.length})</div>
                            {bh.hotLeads.slice(0, 4).map((lead: any, i: number) => (
                              <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.25rem 0", borderBottom: i < Math.min(bh.hotLeads.length, 4) - 1 ? "1px solid var(--border-default)" : "none" }}>
                                <span style={{ fontSize: "0.55rem", padding: "0.05rem 0.3rem", borderRadius: 99, background: (lead.urgency || "").toLowerCase().includes("now") ? "rgba(239,68,68,0.15)" : "rgba(255,152,0,0.12)", color: (lead.urgency || "").toLowerCase().includes("now") ? "#ef4444" : "#ff9800", fontWeight: 600 }}>{lead.urgency || "Soon"}</span>
                                <span style={{ fontSize: "0.68rem", color: "var(--text-secondary)", flex: 1, overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>{lead.lead_description || lead.description || "Active buyer"}</span>
                                {(lead.estimated_price_theyd_pay || lead.estimated_price) && <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "#4ade80" }}>~${lead.estimated_price_theyd_pay || lead.estimated_price}</span>}
                              </div>
                            ))}
                          </div>
                        )}

                        {/* DEEP BUYER INTELLIGENCE */}
                        {(bh.outreach.length > 0 || bh.influencers.length > 0 || bh.internationalBuyers || bh.corporateBuyers || bh.viralMarketing || bh.localOpps || bh.competitive || bh.timing) && (
                          <div style={{ marginBottom: "0.5rem", padding: "0.5rem 0.6rem", background: "linear-gradient(135deg, rgba(139,92,246,0.04), rgba(0,188,212,0.02))", borderRadius: "0.5rem", border: "1px solid rgba(139,92,246,0.15)" }}>
                            <div style={{ fontSize: "0.55rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "#a855f7", fontWeight: 700, marginBottom: "0.4rem" }}>Deep Buyer Intelligence</div>
                            <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                              {bh.outreach.length > 0 && <KnowledgeSection icon="🎯" title={`Outreach Strategies (${bh.outreach.length})`} text={bh.outreach.slice(0, 3).map((s: any) => `${s.strategy_name || s.channel || "Strategy"}: ${(s.message_template || s.approach || "").slice(0, 80)}...`).join(" | ")} />}
                              {bh.influencers.length > 0 && <KnowledgeSection icon="👥" title={`Influencer Targets (${bh.influencers.length})`} text={bh.influencers.slice(0, 3).map((inf: any) => `${inf.type || "Influencer"} in ${inf.niche || "niche"}`).join(", ")} />}
                              {bh.internationalBuyers && <KnowledgeSection icon="🌍" title="International Buyers" text={`${Array.isArray(bh.internationalBuyers.countries_with_demand) ? bh.internationalBuyers.countries_with_demand.join(", ") : "Global demand"}${bh.internationalBuyers.price_premium_international ? ` — ${bh.internationalBuyers.price_premium_international}` : ""}`} />}
                              {bh.corporateBuyers && <KnowledgeSection icon="🏢" title="Corporate Buyers" text={Object.entries(bh.corporateBuyers).filter(([, v]) => v && typeof v === "string").slice(0, 3).map(([k, v]) => `${k.replace(/_/g, " ")}: ${v}`).join(" · ")} />}
                              {bh.viralMarketing && <KnowledgeSection icon="📱" title="Viral Marketing" text={`${bh.viralMarketing.hook_angle || ""} ${bh.viralMarketing.best_platform_for_viral ? `on ${bh.viralMarketing.best_platform_for_viral}` : ""}${Array.isArray(bh.viralMarketing.hashtags) ? ` — ${bh.viralMarketing.hashtags.slice(0, 4).join(" ")}` : ""}`} />}
                              {bh.localOpps && <KnowledgeSection icon="🏪" title="Local Opportunities" text={Object.entries(bh.localOpps).filter(([, v]) => v && typeof v === "string").slice(0, 3).map(([k, v]) => `${k.replace(/_/g, " ")}: ${v}`).join(" · ")} />}
                              {bh.competitive && <KnowledgeSection icon="⚔️" title="Competitive Landscape" text={`${bh.competitive.similar_items_listed ? `${bh.competitive.similar_items_listed} similar listed` : ""}${bh.competitive.your_advantage ? ` — Advantage: ${bh.competitive.your_advantage}` : ""}${bh.competitive.differentiation_tip ? ` — Tip: ${bh.competitive.differentiation_tip}` : ""}`} />}
                              {bh.timing && <KnowledgeSection icon="⏰" title="Timing" text={`${bh.timing.best_day_to_list ? `Best day: ${bh.timing.best_day_to_list}` : ""}${bh.timing.seasonal_peak ? ` · Peak: ${bh.timing.seasonal_peak}` : ""}${bh.timing.urgency_recommendation ? ` · ${bh.timing.urgency_recommendation}` : ""}`} />}
                            </div>
                          </div>
                        )}
                      </>);
                    })() : isListing ? (() => {
                      const lh = extractLH(p);
                      return (<>
                        {/* PLATFORM LISTINGS */}
                        {lh.platformCount > 0 && (
                          <div style={{ marginTop: "0.5rem", marginBottom: "0.5rem", padding: "0.6rem", background: "var(--bg-card)", borderRadius: "0.5rem", border: "1px solid var(--border-default)" }}>
                            <div style={{ fontSize: "0.55rem", textTransform: "uppercase", letterSpacing: "0.1em", color: meta.color, fontWeight: 700, marginBottom: "0.35rem" }}>
                              Platform Listings ({lh.platformCount})
                            </div>
                            {Object.entries(lh.listings).slice(0, 4).map(([platform, lst]: [string, any]) => (
                              <div key={platform} style={{ padding: "0.4rem 0.5rem", marginBottom: "0.3rem", borderRadius: "0.4rem", background: "var(--bg-card)", border: "1px solid var(--border-default)" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", flexWrap: "wrap" }}>
                                  <span style={{ fontSize: "0.62rem", padding: "0.05rem 0.35rem", borderRadius: 99, background: "rgba(0,188,212,0.12)", color: "var(--accent)", fontWeight: 600, textTransform: "capitalize" }}>{platform.replace(/_/g, " ")}</span>
                                  <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--text-primary)", flex: 1 }}>{lst?.title || "—"}</span>
                                  {lst?.price && <span style={{ fontSize: "0.68rem", fontWeight: 700, color: "var(--accent)" }}>${lst.price}</span>}
                                </div>
                                {lst?.description && <div style={{ fontSize: "0.65rem", color: "var(--text-secondary)", marginTop: "0.15rem", lineHeight: 1.4 }}>{(lst.description || "").slice(0, 180)}{(lst.description || "").length > 180 ? "..." : ""}</div>}
                                {Array.isArray(lst?.tags) && lst.tags.length > 0 && (
                                  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.2rem", marginTop: "0.2rem" }}>
                                    {lst.tags.slice(0, 6).map((tag: string, ti: number) => (
                                      <span key={ti} style={{ fontSize: "0.55rem", padding: "0.08rem 0.3rem", borderRadius: 99, background: "rgba(139,92,246,0.08)", color: "#a855f7" }}>{tag}</span>
                                    ))}
                                  </div>
                                )}
                                {lst?.posting_tip && <div style={{ fontSize: "0.58rem", color: "var(--text-muted)", marginTop: "0.15rem", fontStyle: "italic" }}>💡 {lst.posting_tip}</div>}
                              </div>
                            ))}
                          </div>
                        )}

                        {/* SEO KEYWORDS */}
                        {lh.allKwCount > 0 && (
                          <div style={{ marginBottom: "0.5rem", padding: "0.5rem 0.6rem", background: "var(--bg-card)", borderRadius: "0.5rem", border: "1px solid var(--border-default)" }}>
                            <div style={{ fontSize: "0.55rem", textTransform: "uppercase", letterSpacing: "0.1em", color: meta.color, fontWeight: 700, marginBottom: "0.3rem" }}>SEO Keywords ({lh.allKwCount})</div>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.25rem" }}>
                              {lh.primaryKw.slice(0, 8).map((kw: any, i: number) => (
                                <span key={`p${i}`} style={{ fontSize: "0.6rem", padding: "0.12rem 0.4rem", borderRadius: 99, background: "rgba(0,188,212,0.12)", color: "var(--accent)", fontWeight: 600 }}>{typeof kw === "string" ? kw : String(kw)}</span>
                              ))}
                              {lh.longTailKw.slice(0, 5).map((kw: any, i: number) => (
                                <span key={`l${i}`} style={{ fontSize: "0.6rem", padding: "0.12rem 0.4rem", borderRadius: 99, background: "rgba(139,92,246,0.1)", color: "#a855f7", fontWeight: 500 }}>{typeof kw === "string" ? kw : String(kw)}</span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* LISTING EXTRAS */}
                        {(lh.bestTitle || lh.bestHook || lh.hashtags.length > 0 || lh.photoDirection || lh.postingTime) && (
                          <div style={{ marginBottom: "0.5rem", padding: "0.5rem 0.6rem", background: "linear-gradient(135deg, rgba(139,92,246,0.04), rgba(0,188,212,0.02))", borderRadius: "0.5rem", border: "1px solid rgba(139,92,246,0.15)" }}>
                            <div style={{ fontSize: "0.55rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "#a855f7", fontWeight: 700, marginBottom: "0.4rem" }}>Listing Intelligence</div>
                            <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                              {lh.bestTitle && <KnowledgeSection icon="🏆" title="Best Title" text={String(lh.bestTitle)} />}
                              {lh.bestHook && <KnowledgeSection icon="🎯" title="Best Opening Line" text={String(lh.bestHook)} />}
                              {lh.hashtags.length > 0 && <KnowledgeSection icon="#️⃣" title="Hashtags" text={lh.hashtags.slice(0, 8).map((h: any) => typeof h === "string" ? h : String(h)).join(" ")} />}
                              {lh.photoDirection && <KnowledgeSection icon="📸" title="Photo Direction" text={String(lh.photoDirection)} />}
                              {lh.postingTime && <KnowledgeSection icon="⏰" title="Best Time to Post" text={String(lh.postingTime)} />}
                            </div>
                          </div>
                        )}
                      </>);
                    })() : isRecon ? (() => {
                      const rh = extractRH(p);
                      return (<>
                        {/* COMPETITOR LISTINGS */}
                        {rh.competitors.length > 0 && (
                          <div style={{ marginTop: "0.5rem", marginBottom: "0.5rem", padding: "0.6rem", background: "var(--bg-card)", borderRadius: "0.5rem", border: "1px solid var(--border-default)" }}>
                            <div style={{ fontSize: "0.55rem", textTransform: "uppercase", letterSpacing: "0.1em", color: meta.color, fontWeight: 700, marginBottom: "0.35rem" }}>
                              Competitor Listings ({rh.competitorCount})
                            </div>
                            {rh.competitors.slice(0, 5).map((c: any, i: number) => (
                              <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.3rem 0", borderBottom: i < Math.min(rh.competitors.length, 5) - 1 ? "1px solid var(--border-default)" : "none" }}>
                                <span style={{ fontSize: "0.62rem", color: "var(--text-muted)", minWidth: 60 }}>{c.platform || "—"}</span>
                                <span style={{ fontSize: "0.68rem", color: "var(--text-secondary)", flex: 1, overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>{c.title || c.listing_title || c.description || "Listing"}</span>
                                {(c.price || c.listing_price) && <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "#ef4444", flexShrink: 0 }}>${c.price || c.listing_price}</span>}
                                {c.condition && <span style={{ fontSize: "0.55rem", padding: "0.05rem 0.3rem", borderRadius: 99, background: "rgba(255,152,0,0.12)", color: "#ff9800" }}>{c.condition}</span>}
                              </div>
                            ))}
                          </div>
                        )}

                        {/* MARKET POSITION */}
                        {(rh.demandLevel || rh.pricePosition) && (
                          <div style={{ marginBottom: "0.5rem", padding: "0.5rem 0.6rem", background: "var(--bg-card)", borderRadius: "0.5rem", border: "1px solid var(--border-default)" }}>
                            <div style={{ fontSize: "0.55rem", textTransform: "uppercase", letterSpacing: "0.1em", color: meta.color, fontWeight: 700, marginBottom: "0.3rem" }}>Market Position</div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.15rem 1rem" }}>
                              {rh.demandLevel && <GridRow label="DEMAND" value={String(rh.demandLevel)} />}
                              {rh.pricePosition && <GridRow label="POSITION" value={String(rh.pricePosition)} />}
                            </div>
                          </div>
                        )}

                        {/* MARKET ALERTS */}
                        {rh.alerts.length > 0 && (
                          <div style={{ marginBottom: "0.5rem", padding: "0.5rem 0.6rem", background: "rgba(239,68,68,0.04)", borderRadius: "0.5rem", border: "1px solid rgba(239,68,68,0.15)" }}>
                            <div style={{ fontSize: "0.55rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "#ef4444", fontWeight: 700, marginBottom: "0.3rem" }}>Market Alerts ({rh.alerts.length})</div>
                            {rh.alerts.slice(0, 4).map((a: any, i: number) => (
                              <div key={i} style={{ fontSize: "0.68rem", color: "var(--text-secondary)", padding: "0.15rem 0", lineHeight: 1.35 }}>
                                ⚠️ {typeof a === "string" ? a : a.alert || a.description || a.message || JSON.stringify(a)}
                              </div>
                            ))}
                          </div>
                        )}

                        {/* DEEP RECON INTELLIGENCE */}
                        {(rh.market || rh.strategies.length > 0) && (
                          <div style={{ marginBottom: "0.5rem", padding: "0.5rem 0.6rem", background: "linear-gradient(135deg, rgba(139,92,246,0.04), rgba(0,188,212,0.02))", borderRadius: "0.5rem", border: "1px solid rgba(139,92,246,0.15)" }}>
                            <div style={{ fontSize: "0.55rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "#a855f7", fontWeight: 700, marginBottom: "0.4rem" }}>Deep Competitive Intelligence</div>
                            <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                              {rh.market && <KnowledgeSection icon="📊" title="Market Analysis" text={Object.entries(rh.market).filter(([, v]) => v && typeof v === "string").slice(0, 4).map(([k, v]) => `${k.replace(/_/g, " ")}: ${v}`).join(" · ")} />}
                              {rh.strategies.length > 0 && <KnowledgeSection icon="🎯" title="Selling Strategies" text={rh.strategies.slice(0, 3).map((s: any) => typeof s === "string" ? s : s.strategy || s.name || JSON.stringify(s)).join(" | ")} />}
                            </div>
                          </div>
                        )}
                      </>);
                    })() : isCarbot ? (() => {
                      const vh = extractVH(p);
                      const vName = [vh.year, vh.make, vh.model].filter(Boolean).join(" ");
                      return (<>
                        {/* VEHICLE IDENTIFICATION */}
                        <div style={{ marginTop: "0.5rem", marginBottom: "0.5rem", padding: "0.6rem", background: "var(--bg-card)", borderRadius: "0.5rem", border: "1px solid var(--border-default)" }}>
                          <div style={{ fontSize: "0.55rem", textTransform: "uppercase", letterSpacing: "0.1em", color: meta.color, fontWeight: 700, marginBottom: "0.35rem" }}>Vehicle Identification</div>
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.15rem 1rem" }}>
                            {vName && <GridRow label="VEHICLE" value={vName} bold />}
                            {vh.trim && <GridRow label="TRIM" value={String(vh.trim)} />}
                            {vh.condGrade && <GridRow label="GRADE" value={String(vh.condGrade)} bold />}
                          </div>
                        </div>

                        {/* CONDITION BREAKDOWN */}
                        {(vh.exterior || vh.interior || vh.mechanical) && (
                          <div style={{ marginBottom: "0.5rem", padding: "0.5rem 0.6rem", background: "var(--bg-card)", borderRadius: "0.5rem", border: "1px solid var(--border-default)" }}>
                            <div style={{ fontSize: "0.55rem", textTransform: "uppercase", letterSpacing: "0.1em", color: meta.color, fontWeight: 700, marginBottom: "0.3rem" }}>Condition Breakdown</div>
                            <div style={{ display: "flex", gap: "1rem", justifyContent: "center" }}>
                              {vh.exterior && <ScoreCircle label="Exterior" score={Number(vh.exterior) || 0} />}
                              {vh.interior && <ScoreCircle label="Interior" score={Number(vh.interior) || 0} />}
                              {vh.mechanical && <ScoreCircle label="Mechanical" score={Number(vh.mechanical) || 0} />}
                            </div>
                          </div>
                        )}

                        {/* VALUATION */}
                        {(vh.retailValue || vh.privateParty || vh.tradeIn) && (
                          <div style={{ marginBottom: "0.5rem", padding: "0.6rem", background: "var(--bg-card)", borderRadius: "0.5rem", border: "1px solid var(--border-default)" }}>
                            <div style={{ fontSize: "0.55rem", textTransform: "uppercase", letterSpacing: "0.1em", color: meta.color, fontWeight: 700, marginBottom: "0.35rem" }}>Valuation</div>
                            <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", justifyContent: "center" }}>
                              {vh.retailValue != null && (
                                <div style={{ textAlign: "center" }}>
                                  <div style={{ fontSize: "0.55rem", color: "var(--text-muted)", textTransform: "uppercase" }}>Retail</div>
                                  <div style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--accent)" }}>{_fp(vh.retailValue)}</div>
                                </div>
                              )}
                              {vh.privateParty != null && (
                                <div style={{ textAlign: "center" }}>
                                  <div style={{ fontSize: "0.55rem", color: "var(--text-muted)", textTransform: "uppercase" }}>Private Party</div>
                                  <div style={{ fontSize: "1.2rem", fontWeight: 800, color: "#4caf50" }}>{_fp(vh.privateParty)}</div>
                                </div>
                              )}
                              {vh.tradeIn != null && (
                                <div style={{ textAlign: "center" }}>
                                  <div style={{ fontSize: "0.55rem", color: "var(--text-muted)", textTransform: "uppercase" }}>Trade-In</div>
                                  <div style={{ fontSize: "1.2rem", fontWeight: 800, color: "#ff9800" }}>{_fp(vh.tradeIn)}</div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* MARKET ANALYSIS */}
                        {vh.market && (
                          <div style={{ marginBottom: "0.5rem", padding: "0.5rem 0.6rem", background: "linear-gradient(135deg, rgba(139,92,246,0.04), rgba(0,188,212,0.02))", borderRadius: "0.5rem", border: "1px solid rgba(139,92,246,0.15)" }}>
                            <div style={{ fontSize: "0.55rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "#a855f7", fontWeight: 700, marginBottom: "0.4rem" }}>Market Analysis</div>
                            <KnowledgeSection icon="📊" title="Market Data" text={Object.entries(vh.market).filter(([, v]) => v && typeof v === "string").slice(0, 5).map(([k, v]) => `${k.replace(/_/g, " ")}: ${v}`).join(" · ")} />
                          </div>
                        )}
                      </>);
                    })() : isAntique ? (() => {
                      const ah = extractAH(p);
                      return (<>
                        {/* AUTHENTICATION */}
                        <div style={{ marginTop: "0.5rem", marginBottom: "0.5rem", padding: "0.6rem", background: ah.verdict && String(ah.verdict).toLowerCase().includes("authentic") ? "rgba(76,175,80,0.04)" : "var(--bg-card)", borderRadius: "0.5rem", border: `1px solid ${ah.verdict && String(ah.verdict).toLowerCase().includes("authentic") ? "rgba(76,175,80,0.15)" : "var(--border-default)"}` }}>
                          <div style={{ fontSize: "0.55rem", textTransform: "uppercase", letterSpacing: "0.1em", color: meta.color, fontWeight: 700, marginBottom: "0.35rem" }}>Authentication</div>
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.15rem 1rem" }}>
                            {ah.verdict && <GridRow label="VERDICT" value={String(ah.verdict)} bold />}
                            {ah.confidence != null && <GridRow label="CONFIDENCE" value={`${ah.confidence}%`} />}
                            {ah.era && <GridRow label="ERA" value={String(ah.era)} />}
                            {ah.maker && <GridRow label="MAKER" value={String(ah.maker)} />}
                          </div>
                        </div>

                        {/* VALUATION */}
                        {(ah.fairMarket || ah.auctionEst || ah.insurance) && (
                          <div style={{ marginBottom: "0.5rem", padding: "0.6rem", background: "var(--bg-card)", borderRadius: "0.5rem", border: "1px solid var(--border-default)" }}>
                            <div style={{ fontSize: "0.55rem", textTransform: "uppercase", letterSpacing: "0.1em", color: meta.color, fontWeight: 700, marginBottom: "0.35rem" }}>Antique Valuation</div>
                            <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", justifyContent: "center" }}>
                              {ah.fairMarket != null && (
                                <div style={{ textAlign: "center" }}>
                                  <div style={{ fontSize: "0.55rem", color: "var(--text-muted)", textTransform: "uppercase" }}>Fair Market</div>
                                  <div style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--accent)" }}>{_fp(ah.fairMarket)}</div>
                                </div>
                              )}
                              {ah.auctionEst != null && (
                                <div style={{ textAlign: "center" }}>
                                  <div style={{ fontSize: "0.55rem", color: "var(--text-muted)", textTransform: "uppercase" }}>Auction Est.</div>
                                  <div style={{ fontSize: "1.2rem", fontWeight: 800, color: "#4caf50" }}>{_fp(ah.auctionEst)}</div>
                                </div>
                              )}
                              {ah.insurance != null && (
                                <div style={{ textAlign: "center" }}>
                                  <div style={{ fontSize: "0.55rem", color: "var(--text-muted)", textTransform: "uppercase" }}>Insurance</div>
                                  <div style={{ fontSize: "1.2rem", fontWeight: 800, color: "#ff9800" }}>{_fp(ah.insurance)}</div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* COLLECTOR MARKET */}
                        {ah.collectorMarket && (
                          <div style={{ marginBottom: "0.5rem", padding: "0.5rem 0.6rem", background: "linear-gradient(135deg, rgba(139,92,246,0.04), rgba(0,188,212,0.02))", borderRadius: "0.5rem", border: "1px solid rgba(139,92,246,0.15)" }}>
                            <div style={{ fontSize: "0.55rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "#a855f7", fontWeight: 700, marginBottom: "0.4rem" }}>Collector Market</div>
                            <KnowledgeSection icon="💎" title="Collector Intelligence" text={Object.entries(ah.collectorMarket).filter(([, v]) => v && typeof v === "string").slice(0, 5).map(([k, v]) => `${k.replace(/_/g, " ")}: ${v}`).join(" · ")} />
                          </div>
                        )}
                      </>);
                    })() : isPhotos ? (() => {
                      const phd = extractPhH(p);
                      return (<>
                        {/* QUALITY SCORE */}
                        {phd.qualityScore != null && (
                          <div style={{ marginTop: "0.5rem", marginBottom: "0.5rem", padding: "0.6rem", background: "var(--bg-card)", borderRadius: "0.5rem", border: "1px solid var(--border-default)" }}>
                            <div style={{ fontSize: "0.55rem", textTransform: "uppercase", letterSpacing: "0.1em", color: meta.color, fontWeight: 700, marginBottom: "0.35rem" }}>Photo Quality</div>
                            <div style={{ display: "flex", gap: "1rem", justifyContent: "center" }}>
                              <ScoreCircle label="Quality" score={Number(phd.qualityScore) || 0} />
                            </div>
                          </div>
                        )}

                        {/* IMPROVEMENT TIPS */}
                        {phd.tips.length > 0 && (
                          <div style={{ marginBottom: "0.5rem", padding: "0.5rem 0.6rem", background: "var(--bg-card)", borderRadius: "0.5rem", border: "1px solid var(--border-default)" }}>
                            <div style={{ fontSize: "0.55rem", textTransform: "uppercase", letterSpacing: "0.1em", color: meta.color, fontWeight: 700, marginBottom: "0.3rem" }}>Improvement Tips ({phd.tipCount})</div>
                            {phd.tips.slice(0, 5).map((tip: any, i: number) => (
                              <div key={i} style={{ fontSize: "0.68rem", color: "var(--text-secondary)", padding: "0.15rem 0", lineHeight: 1.35 }}>
                                💡 {typeof tip === "string" ? tip : tip.tip || tip.recommendation || tip.description || JSON.stringify(tip)}
                              </div>
                            ))}
                          </div>
                        )}

                        {/* MISSING ANGLES */}
                        {phd.missing.length > 0 && (
                          <div style={{ marginBottom: "0.5rem", padding: "0.5rem 0.6rem", background: "rgba(239,68,68,0.04)", borderRadius: "0.5rem", border: "1px solid rgba(239,68,68,0.15)" }}>
                            <div style={{ fontSize: "0.55rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "#ef4444", fontWeight: 700, marginBottom: "0.3rem" }}>Missing Angles ({phd.missingCount})</div>
                            {phd.missing.slice(0, 5).map((m: any, i: number) => (
                              <div key={i} style={{ fontSize: "0.68rem", color: "var(--text-secondary)", padding: "0.15rem 0", lineHeight: 1.35 }}>
                                📷 {typeof m === "string" ? m : m.angle || m.shot || m.description || JSON.stringify(m)}
                              </div>
                            ))}
                          </div>
                        )}

                        {/* DEEP PHOTO INTELLIGENCE */}
                        {(phd.platformRecs || phd.staging.length > 0) && (
                          <div style={{ marginBottom: "0.5rem", padding: "0.5rem 0.6rem", background: "linear-gradient(135deg, rgba(139,92,246,0.04), rgba(0,188,212,0.02))", borderRadius: "0.5rem", border: "1px solid rgba(139,92,246,0.15)" }}>
                            <div style={{ fontSize: "0.55rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "#a855f7", fontWeight: 700, marginBottom: "0.4rem" }}>Deep Photo Intelligence</div>
                            <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                              {phd.platformRecs && <KnowledgeSection icon="📱" title="Platform Recommendations" text={Object.entries(phd.platformRecs).filter(([, v]) => v && typeof v === "string").slice(0, 4).map(([k, v]) => `${k.replace(/_/g, " ")}: ${v}`).join(" · ")} />}
                              {phd.staging.length > 0 && <KnowledgeSection icon="🎨" title="Staging Concepts" text={phd.staging.slice(0, 3).map((s: any) => typeof s === "string" ? s : s.concept || s.idea || JSON.stringify(s)).join(" | ")} />}
                            </div>
                          </div>
                        )}
                      </>);
                    })() : isCollectibles ? (() => {
                      const ch = extractCollH(p);
                      return (<>
                        {/* 1 — HEADER: Item ID + badges */}
                        <div style={{ marginTop: "0.5rem", marginBottom: "0.5rem", padding: "0.5rem 0.6rem", background: "rgba(139,92,246,0.06)", borderRadius: "0.5rem", border: "1px solid rgba(139,92,246,0.15)" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", flexWrap: "wrap" }}>
                            {ch.category && <span style={{ fontSize: "0.62rem", padding: "0.1rem 0.4rem", borderRadius: 99, background: "rgba(139,92,246,0.15)", color: "#8b5cf6", fontWeight: 700 }}>{ch.category}</span>}
                            {ch.rarity && <span style={{ fontSize: "0.6rem", padding: "0.1rem 0.35rem", borderRadius: 99, background: ch.rarity === "Ultra Rare" || ch.rarity === "Rare" ? "rgba(239,68,68,0.12)" : "var(--ghost-bg)", color: ch.rarity === "Ultra Rare" || ch.rarity === "Rare" ? "#ef4444" : "var(--text-muted)", fontWeight: 600 }}>{ch.rarity}</span>}
                            {ch.investmentVerdict && <span style={{ fontSize: "0.58rem", padding: "0.1rem 0.35rem", borderRadius: 99, background: ch.investmentVerdict.toLowerCase().includes("hold") ? "rgba(76,175,80,0.12)" : "rgba(251,191,36,0.12)", color: ch.investmentVerdict.toLowerCase().includes("hold") ? "#4caf50" : "#fbbf24", fontWeight: 700 }}>{ch.investmentVerdict}</span>}
                            {ch.demandLevel && <span style={{ fontSize: "0.58rem", padding: "0.1rem 0.35rem", borderRadius: 99, background: ch.demandLevel === "Rising" ? "rgba(76,175,80,0.12)" : ch.demandLevel === "Declining" ? "rgba(239,68,68,0.1)" : "var(--ghost-bg)", color: ch.demandLevel === "Rising" ? "#4caf50" : ch.demandLevel === "Declining" ? "#ef4444" : "var(--text-muted)", fontWeight: 600 }}>{ch.demandLevel}</span>}
                          </div>
                          {ch.itemName && <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-primary)", marginTop: "0.25rem" }}>{ch.itemName}</div>}
                          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginTop: "0.1rem" }}>
                            {ch.year && <span style={{ fontSize: "0.62rem", color: "var(--text-secondary)" }}>{ch.year}</span>}
                            {ch.brandSeries && <span style={{ fontSize: "0.62rem", color: "var(--text-secondary)" }}>{ch.brandSeries}</span>}
                            {ch.editionVariation && <span style={{ fontSize: "0.62rem", color: "var(--text-muted)", fontStyle: "italic" }}>{ch.editionVariation}</span>}
                          </div>
                        </div>

                        {/* 2 — VISUAL GRADING */}
                        {(ch.psaGrade || ch.corners || ch.centering) && (
                          <div style={{ marginBottom: "0.5rem", padding: "0.5rem 0.6rem", background: "var(--bg-card)", borderRadius: "0.5rem", border: "1px solid var(--border-default)" }}>
                            <div style={{ fontSize: "0.55rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "#8b5cf6", fontWeight: 700, marginBottom: "0.35rem" }}>Visual Grade Assessment</div>
                            <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", justifyContent: "center", marginBottom: "0.3rem" }}>
                              {ch.psaGrade && <div style={{ textAlign: "center" }}><div style={{ fontSize: "0.5rem", color: "var(--text-muted)", textTransform: "uppercase" }}>PSA Est.</div><div style={{ fontSize: "1.1rem", fontWeight: 800, color: "#8b5cf6" }}>{ch.psaGrade}</div></div>}
                              {ch.bgsGrade && <div style={{ textAlign: "center" }}><div style={{ fontSize: "0.5rem", color: "var(--text-muted)", textTransform: "uppercase" }}>BGS Est.</div><div style={{ fontSize: "1.1rem", fontWeight: 800, color: "#00bcd4" }}>{ch.bgsGrade}</div></div>}
                              {ch.gradeConfidence != null && <div style={{ textAlign: "center" }}><div style={{ fontSize: "0.5rem", color: "var(--text-muted)", textTransform: "uppercase" }}>Confidence</div><div style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--text-primary)" }}>{Math.round(Number(ch.gradeConfidence) * (Number(ch.gradeConfidence) <= 1 ? 100 : 1))}%</div></div>}
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.15rem 0.75rem" }}>
                              {ch.corners && <GridRow label="CORNERS" value={ch.corners} />}
                              {ch.edges && <GridRow label="EDGES" value={ch.edges} />}
                              {ch.surface && <GridRow label="SURFACE" value={ch.surface} />}
                              {ch.centering && <GridRow label="CENTERING" value={ch.centering} />}
                            </div>
                            {ch.gradeReasoning && <div style={{ fontSize: "0.62rem", color: "var(--text-secondary)", marginTop: "0.3rem", lineHeight: 1.4 }}>{ch.gradeReasoning}</div>}
                            {ch.gradeSensitivity && <div style={{ fontSize: "0.58rem", color: "var(--text-muted)", marginTop: "0.15rem", fontStyle: "italic" }}>{ch.gradeSensitivity}</div>}
                          </div>
                        )}

                        {/* 3 — VALUATION with PSA ladder */}
                        {(ch.rawLow || ch.psa6 || ch.gradedValue) && (
                          <div style={{ marginBottom: "0.5rem", padding: "0.5rem 0.6rem", background: "var(--bg-card)", borderRadius: "0.5rem", border: "1px solid var(--border-default)" }}>
                            <div style={{ fontSize: "0.55rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "#8b5cf6", fontWeight: 700, marginBottom: "0.35rem" }}>Valuation Deep Dive</div>
                            {(ch.rawLow || ch.rawHigh) && (
                              <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", justifyContent: "center", marginBottom: "0.35rem" }}>
                                <div style={{ textAlign: "center" }}><div style={{ fontSize: "0.5rem", color: "var(--text-muted)", textTransform: "uppercase" }}>Raw Low</div><div style={{ fontSize: "1rem", fontWeight: 800, color: "var(--text-secondary)" }}>{_fp(ch.rawLow)}</div></div>
                                {ch.rawMid && <div style={{ textAlign: "center" }}><div style={{ fontSize: "0.5rem", color: "var(--text-muted)", textTransform: "uppercase" }}>Raw Mid</div><div style={{ fontSize: "1rem", fontWeight: 800, color: "var(--accent)" }}>{_fp(ch.rawMid)}</div></div>}
                                <div style={{ textAlign: "center" }}><div style={{ fontSize: "0.5rem", color: "var(--text-muted)", textTransform: "uppercase" }}>Raw High</div><div style={{ fontSize: "1rem", fontWeight: 800, color: "#4caf50" }}>{_fp(ch.rawHigh)}</div></div>
                              </div>
                            )}
                            {/* PSA Grade Ladder */}
                            {(ch.psa6 || ch.psa7 || ch.psa8 || ch.psa9 || ch.psa10) && (
                              <div style={{ marginTop: "0.25rem" }}>
                                <div style={{ fontSize: "0.5rem", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "0.2rem" }}>PSA Grade Ladder</div>
                                <div style={{ display: "flex", gap: "0.25rem", flexWrap: "wrap" }}>
                                  {[{ g: "6", v: ch.psa6 }, { g: "7", v: ch.psa7 }, { g: "8", v: ch.psa8 }, { g: "9", v: ch.psa9 }, { g: "10", v: ch.psa10 }].filter(x => x.v).map(x => (
                                    <div key={x.g} style={{ textAlign: "center", padding: "0.2rem 0.4rem", borderRadius: "0.35rem", background: x.g === "10" ? "rgba(139,92,246,0.12)" : "var(--ghost-bg)", border: `1px solid ${x.g === "10" ? "rgba(139,92,246,0.3)" : "var(--border-default)"}`, minWidth: "3rem" }}>
                                      <div style={{ fontSize: "0.5rem", color: "var(--text-muted)" }}>PSA {x.g}</div>
                                      <div style={{ fontSize: "0.72rem", fontWeight: 700, color: x.g === "10" ? "#8b5cf6" : "var(--text-primary)" }}>{_fp(x.v)}</div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            {ch.valueReasoning && <div style={{ fontSize: "0.62rem", color: "var(--text-secondary)", marginTop: "0.3rem", lineHeight: 1.4 }}>{ch.valueReasoning}</div>}
                            {ch.recentComps && <div style={{ fontSize: "0.58rem", color: "var(--text-muted)", marginTop: "0.15rem" }}>Comps: {typeof ch.recentComps === "string" ? ch.recentComps : JSON.stringify(ch.recentComps)}</div>}
                            {ch.populationNote && <div style={{ fontSize: "0.58rem", color: "var(--text-muted)", marginTop: "0.1rem" }}>Pop: {ch.populationNote}</div>}
                          </div>
                        )}

                        {/* 4 — GRADING ROI */}
                        {(ch.gradingRec || ch.gradingReasoning) && (
                          <div style={{ marginBottom: "0.5rem", padding: "0.5rem 0.6rem", background: "var(--bg-card)", borderRadius: "0.5rem", border: "1px solid var(--border-default)" }}>
                            <div style={{ fontSize: "0.55rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "#8b5cf6", fontWeight: 700, marginBottom: "0.3rem" }}>Grading ROI</div>
                            <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", marginBottom: "0.2rem" }}>
                              {ch.gradingRec && <span style={{ fontSize: "0.62rem", padding: "0.15rem 0.45rem", borderRadius: 99, background: ch.gradingRec.toLowerCase().includes("strong") ? "rgba(76,175,80,0.15)" : ch.gradingRec.toLowerCase().includes("skip") ? "rgba(239,68,68,0.12)" : "rgba(251,191,36,0.12)", color: ch.gradingRec.toLowerCase().includes("strong") ? "#4caf50" : ch.gradingRec.toLowerCase().includes("skip") ? "#ef4444" : "#fbbf24", fontWeight: 700 }}>{ch.gradingRec}</span>}
                              {ch.breakEvenGrade && <span style={{ fontSize: "0.58rem", padding: "0.1rem 0.35rem", borderRadius: 99, background: "var(--ghost-bg)", color: "var(--text-secondary)", fontWeight: 600 }}>Break-even: PSA {ch.breakEvenGrade}</span>}
                              {ch.bestGradingService && <span style={{ fontSize: "0.58rem", padding: "0.1rem 0.35rem", borderRadius: 99, background: "var(--ghost-bg)", color: "var(--text-muted)" }}>{ch.bestGradingService}{ch.psaStandardCost ? ` ($${ch.psaStandardCost})` : ""}</span>}
                            </div>
                            {ch.gradingReasoning && <div style={{ fontSize: "0.62rem", color: "var(--text-secondary)", lineHeight: 1.4 }}>{ch.gradingReasoning}</div>}
                          </div>
                        )}

                        {/* 5 — MARKET INTELLIGENCE */}
                        {(ch.bestPlatform || ch.sellingStrategy || ch.listingTitle) && (
                          <div style={{ marginBottom: "0.5rem", padding: "0.5rem 0.6rem", background: "linear-gradient(135deg, rgba(139,92,246,0.04), rgba(0,188,212,0.02))", borderRadius: "0.5rem", border: "1px solid rgba(139,92,246,0.12)" }}>
                            <div style={{ fontSize: "0.55rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "#8b5cf6", fontWeight: 700, marginBottom: "0.3rem" }}>Market Intelligence</div>
                            {ch.listingTitle && (
                              <div style={{ fontSize: "0.68rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.2rem", padding: "0.2rem 0.4rem", background: "var(--ghost-bg)", borderRadius: "0.35rem", border: "1px solid var(--border-default)" }}>
                                {ch.listingTitle}
                              </div>
                            )}
                            <div style={{ display: "flex", flexDirection: "column", gap: "0.15rem" }}>
                              {ch.bestPlatform && <div style={{ fontSize: "0.62rem", color: "var(--text-secondary)" }}>Best platform: <strong>{ch.bestPlatform}</strong>{ch.platformReasoning ? ` — ${ch.platformReasoning}` : ""}</div>}
                              {ch.buyItNowPrice && <div style={{ fontSize: "0.62rem", color: "var(--text-secondary)" }}>BIN Price: <strong style={{ color: "#4caf50" }}>{_fp(ch.buyItNowPrice)}</strong></div>}
                              {ch.demandReasoning && <div style={{ fontSize: "0.62rem", color: "var(--text-secondary)" }}>{ch.demandReasoning}</div>}
                              {ch.sellingStrategy && <div style={{ fontSize: "0.62rem", color: "var(--text-muted)", fontStyle: "italic" }}>{ch.sellingStrategy}</div>}
                            </div>
                          </div>
                        )}

                        {/* 6 — INVESTMENT OUTLOOK */}
                        {(ch.price1yr || ch.price5yr || ch.catalysts || ch.risks) && (
                          <div style={{ marginBottom: "0.5rem", padding: "0.5rem 0.6rem", background: "var(--bg-card)", borderRadius: "0.5rem", border: "1px solid var(--border-default)" }}>
                            <div style={{ fontSize: "0.55rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "#8b5cf6", fontWeight: 700, marginBottom: "0.3rem" }}>Investment Outlook</div>
                            <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginBottom: "0.2rem" }}>
                              {ch.price1yr && <div style={{ fontSize: "0.62rem", color: "var(--text-secondary)" }}>1yr target: <strong style={{ color: "#4caf50" }}>{typeof ch.price1yr === "number" ? _fp(ch.price1yr) : ch.price1yr}</strong></div>}
                              {ch.price5yr && <div style={{ fontSize: "0.62rem", color: "var(--text-secondary)" }}>5yr target: <strong style={{ color: "#8b5cf6" }}>{typeof ch.price5yr === "number" ? _fp(ch.price5yr) : ch.price5yr}</strong></div>}
                            </div>
                            {ch.catalysts && <div style={{ fontSize: "0.62rem", color: "var(--text-secondary)", marginBottom: "0.1rem" }}>Catalysts: {typeof ch.catalysts === "string" ? ch.catalysts : Array.isArray(ch.catalysts) ? ch.catalysts.join(", ") : JSON.stringify(ch.catalysts)}</div>}
                            {ch.risks && <div style={{ fontSize: "0.62rem", color: "var(--text-muted)" }}>Risks: {typeof ch.risks === "string" ? ch.risks : Array.isArray(ch.risks) ? ch.risks.join(", ") : JSON.stringify(ch.risks)}</div>}
                          </div>
                        )}

                        {/* 7 — INSIDER INTELLIGENCE */}
                        {(ch.insiderKnowledge || ch.notableVariations || ch.authenticationNotes) && (
                          <div style={{ marginBottom: "0.5rem", padding: "0.5rem 0.6rem", background: "linear-gradient(135deg, rgba(139,92,246,0.04), rgba(0,188,212,0.02))", borderRadius: "0.5rem", border: "1px solid rgba(139,92,246,0.15)" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.3rem" }}>
                              <span style={{ fontSize: "0.55rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "#8b5cf6", fontWeight: 700 }}>Insider Intelligence</span>
                              {ch.communitySentiment && <span style={{ fontSize: "0.55rem", padding: "0.1rem 0.3rem", borderRadius: 99, background: "rgba(139,92,246,0.1)", color: "#a78bfa" }}>{ch.communitySentiment}</span>}
                            </div>
                            {ch.insiderKnowledge && <div style={{ fontSize: "0.62rem", color: "var(--text-secondary)", lineHeight: 1.4, marginBottom: "0.15rem" }}>{ch.insiderKnowledge}</div>}
                            {ch.notableVariations && <div style={{ fontSize: "0.58rem", color: "var(--text-muted)" }}>Variations: {ch.notableVariations}</div>}
                            {ch.authenticationNotes && <div style={{ fontSize: "0.58rem", color: "var(--text-muted)", marginTop: "0.1rem" }}>Auth: {ch.authenticationNotes}</div>}
                          </div>
                        )}

                        {/* 8 — EXPERT SUMMARY */}
                        {ch.summary && (
                          <div style={{ marginBottom: "0.5rem", padding: "0.5rem 0.6rem", background: "rgba(139,92,246,0.04)", borderLeft: "3px solid rgba(139,92,246,0.3)", borderRadius: "0 0.4rem 0.4rem 0" }}>
                            <div style={{ fontSize: "0.55rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "#8b5cf6", fontWeight: 700, marginBottom: "0.2rem" }}>Expert Summary</div>
                            <div style={{ fontSize: "0.68rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>{ch.summary}</div>
                          </div>
                        )}
                      </>);
                    })() : (<>
                    {/* ANALYSIS MODE: Identification, Condition, Knowledge */}

                    {/* SECTION 1: Identification Card */}
                    <div style={{
                      marginTop: "0.5rem", marginBottom: "0.5rem", padding: "0.5rem 0.6rem",
                      background: "var(--bg-card)", borderRadius: "0.5rem",
                      border: "1px solid var(--border-default)",
                    }}>
                      <div style={{ fontSize: "0.55rem", textTransform: "uppercase", letterSpacing: "0.1em", color: meta.color, fontWeight: 700, marginBottom: "0.35rem" }}>
                        Identification
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.15rem 1rem" }}>
                        {h.itemName && <GridRow label="ITEM" value={h.itemName} bold />}
                        {h.category && <GridRow label="CATEGORY" value={h.subcategory ? `${h.category} > ${h.subcategory}` : h.category} />}
                        {(h.brand || h.maker) && <GridRow label="BRAND/MAKER" value={[h.brand, h.maker].filter(Boolean).join(" — ")} />}
                        {h.model && <GridRow label="MODEL" value={h.model} />}
                        {h.material && <GridRow label="MATERIAL" value={typeof h.material === "string" ? h.material : String(h.material)} />}
                        {h.era && <GridRow label="ERA" value={h.era} />}
                        {h.style && <GridRow label="STYLE" value={h.style} />}
                        {h.origin && <GridRow label="ORIGIN" value={h.origin} />}
                        {h.markings && <GridRow label="MARKINGS" value={typeof h.markings === "string" ? h.markings : String(h.markings)} />}
                        {h.dimensions && <GridRow label="DIMENSIONS" value={typeof h.dimensions === "string" ? h.dimensions : String(h.dimensions)} />}
                        {h.completeness && <GridRow label="COMPLETENESS" value={typeof h.completeness === "string" ? h.completeness : String(h.completeness)} />}
                      </div>
                    </div>

                    {/* SECTION 2: Condition Assessment */}
                    {condNum != null && (
                      <div style={{
                        marginBottom: "0.5rem", padding: "0.5rem 0.6rem",
                        background: "var(--bg-card)", borderRadius: "0.5rem",
                        border: "1px solid var(--border-default)",
                      }}>
                        <div style={{ fontSize: "0.55rem", textTransform: "uppercase", letterSpacing: "0.1em", color: meta.color, fontWeight: 700, marginBottom: "0.35rem" }}>
                          Condition Assessment
                        </div>
                        <div style={{ display: "flex", gap: "1rem", justifyContent: "center", marginBottom: "0.4rem" }}>
                          <ScoreCircle label="Overall" score={condNum} />
                          {h.condCosm != null && <ScoreCircle label="Cosmetic" score={Number(h.condCosm)} />}
                          {h.condFunc != null && <ScoreCircle label="Functional" score={Number(h.condFunc)} />}
                        </div>
                        {h.condDetails && (
                          <p style={{ fontSize: "0.7rem", color: "var(--text-secondary)", margin: "0.25rem 0 0", lineHeight: 1.4 }}>
                            {h.condDetails}
                          </p>
                        )}
                        {Array.isArray(h.positiveNotes) && h.positiveNotes.length > 0 && (
                          <div style={{ marginTop: "0.3rem" }}>
                            {h.positiveNotes.slice(0, 3).map((note: string, i: number) => (
                              <div key={i} style={{ fontSize: "0.65rem", color: "#4caf50", lineHeight: 1.3 }}>✅ {note}</div>
                            ))}
                          </div>
                        )}
                        {Array.isArray(h.visibleIssues) && h.visibleIssues.length > 0 && (
                          <div style={{ marginTop: "0.2rem" }}>
                            {h.visibleIssues.slice(0, 3).map((issue: string, i: number) => (
                              <div key={i} style={{ fontSize: "0.65rem", color: "#ff9800", lineHeight: 1.3 }}>⚠️ {issue}</div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* SECTION 3: Product Knowledge — the unique MegaBot value */}
                    {knowledgeSections.length > 0 && (
                      <div style={{
                        marginBottom: "0.5rem", padding: "0.5rem 0.6rem",
                        background: "linear-gradient(135deg, rgba(139,92,246,0.04), rgba(0,188,212,0.02))",
                        borderRadius: "0.5rem",
                        border: "1px solid rgba(139,92,246,0.15)",
                      }}>
                        <div style={{ fontSize: "0.55rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "#a855f7", fontWeight: 700, marginBottom: "0.4rem" }}>
                          Deep Item Knowledge
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                          {h.productHistory && <KnowledgeSection icon="📖" title="History & Background" text={h.productHistory} />}
                          {h.makerHistory && <KnowledgeSection icon="🏭" title="Maker/Brand History" text={h.makerHistory} />}
                          {h.construction && <KnowledgeSection icon="🔧" title="Construction & Craftsmanship" text={h.construction} />}
                          {h.specialFeatures && <KnowledgeSection icon="⭐" title="What Makes It Special" text={h.specialFeatures} />}
                          {h.tipsAndFacts && <KnowledgeSection icon="💡" title="Tips & Interesting Facts" text={h.tipsAndFacts} />}
                          {h.commonIssues && <KnowledgeSection icon="⚠️" title="Things to Watch For" text={h.commonIssues} />}
                          {h.careInstructions && <KnowledgeSection icon="🛡️" title="Care & Preservation" text={h.careInstructions} />}
                          {h.similarItems && <KnowledgeSection icon="🔍" title="Similar Items & Comparisons" text={h.similarItems} />}
                          {h.collectorInfo && <KnowledgeSection icon="🎯" title="Collector & Enthusiast Info" text={h.collectorInfo} />}
                        </div>
                      </div>
                    )}
                    </>)}

                    {/* SECTION 4: Key Insight */}
                    {insight && (
                      <div style={{
                        marginBottom: "0.5rem", padding: "0.5rem 0.6rem",
                        background: `${meta.color}08`, borderRadius: "0.5rem",
                        borderLeft: `3px solid ${meta.color}50`,
                      }}>
                        <div style={{ fontSize: "0.55rem", textTransform: "uppercase", letterSpacing: "0.1em", color: meta.color, fontWeight: 700, marginBottom: "0.2rem" }}>
                          {meta.icon} What {meta.label} Found
                        </div>
                        <p style={{ fontSize: "0.72rem", color: "var(--text-secondary)", margin: 0, lineHeight: 1.5, fontStyle: "italic" }}>
                          &ldquo;{insight.length > 400 ? insight.slice(0, 400) + "..." : insight}&rdquo;
                        </p>
                      </div>
                    )}

                    {/* SECTION 5: Tags + specialty */}
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.25rem", marginBottom: "0.4rem" }}>
                      {h.isAntique && <AgentTag color="#fbbf24">Antique{h.antiqueAge ? ` ~${h.antiqueAge}yr` : ""}</AgentTag>}
                      {Array.isArray(h.bestPlatforms) && h.bestPlatforms.slice(0, 3).map((pl: string, i: number) => (
                        <AgentTag key={i} color={meta.color}>{pl}</AgentTag>
                      ))}
                      {Array.isArray(h.keywords) && h.keywords.slice(0, 5).map((kw: string, i: number) => (
                        <AgentTag key={`k${i}`} color="var(--text-muted)">{kw}</AgentTag>
                      ))}
                    </div>
                    <div style={{ fontSize: "0.58rem", color: "var(--text-muted)", fontStyle: "italic", marginBottom: "0.35rem" }}>
                      {meta.icon} {meta.label} specializes in {meta.specialty.toLowerCase()}
                    </div>

                    {/* Raw JSON toggle + collapse */}
                    <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
                      <button
                        onClick={() => setShowRawJson(isShowingRaw ? null : p.provider)}
                        style={{ fontSize: "0.58rem", color: "var(--text-muted)", background: "transparent", border: "none", cursor: "pointer", textDecoration: "underline", textUnderlineOffset: "2px", padding: 0 }}
                      >
                        {isShowingRaw ? "Hide full response" : "Show full response"}
                      </button>
                      <button
                        onClick={() => setExpanded(null)}
                        style={{ fontSize: "0.58rem", color: meta.color, background: "transparent", border: "none", cursor: "pointer", padding: 0 }}
                      >
                        Collapse ▲
                      </button>
                    </div>
                    {isShowingRaw && (
                      <pre style={{ fontSize: "0.55rem", color: "var(--text-muted)", background: "rgba(0,0,0,0.25)", borderRadius: "0.4rem", padding: "0.5rem", marginTop: "0.3rem", overflow: "auto", maxHeight: 250, whiteSpace: "pre-wrap" }}>
                        {JSON.stringify(p.data || p, null, 2)}
                      </pre>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {/* Failed providers */}
          {failedProviders.map((p: any) => {
            const meta = PROVIDER_META[p.provider] || { icon: "🤖", label: p.provider, color: "#888", specialty: "", collapsedFocus: "overview" };
            return (
              <div key={p.provider} style={{
                display: "flex", alignItems: "center", gap: "0.5rem",
                padding: "0.4rem 0.65rem", opacity: 0.4,
                background: "var(--bg-card)", border: "1px solid var(--border-default)",
                borderRadius: "0.5rem", fontSize: "0.68rem",
              }}>
                <span style={{ opacity: 0.5 }}>{meta.icon}</span>
                <span style={{ fontWeight: 600, color: "var(--text-muted)" }}>{meta.label}</span>
                <span style={{ color: "var(--text-muted)", flex: 1, fontSize: "0.62rem" }}>Unavailable</span>
                <span style={{ fontSize: "0.58rem", color: "var(--text-muted)" }}>
                  {(p.durationMs || p.responseTime) ? `${((p.durationMs || p.responseTime) / 1000).toFixed(1)}s` : ""}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Pricing comparison bar (pricing mode only) */}
      {isPricing && successfulProviders.length > 1 && (() => {
        const allPH = successfulProviders.map(p => ({ ...extractPH(p), provider: p.provider }));
        return (
          <div style={{ marginBottom: "0.5rem", padding: "0.5rem 0.75rem", background: "var(--bg-card)", borderRadius: "0.5rem", border: "1px solid var(--border-default)" }}>
            <div style={{ fontSize: "0.55rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "#a855f7", fontWeight: 700, marginBottom: "0.3rem" }}>Pricing Comparison</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem 1rem", fontSize: "0.72rem" }}>
              {allPH.map(ph => {
                const meta2 = PROVIDER_META[ph.provider];
                return (
                  <span key={ph.provider} style={{ color: meta2?.color || "var(--text-secondary)" }}>
                    {meta2?.icon} {meta2?.label}: {ph.priceLow != null && ph.priceHigh != null ? `$${Math.round(Number(ph.priceLow))}-$${Math.round(Number(ph.priceHigh))}` : "—"}
                  </span>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* Buyer comparison bar (buyers mode only) */}
      {isBuyers && successfulProviders.length > 1 && (() => {
        const allBH = successfulProviders.map(p => ({ ...extractBH(p), provider: p.provider }));
        const totalUnique = new Set(allBH.flatMap(b => b.profiles.map((p: any) => (p.buyer_type || p.profile_name || "").toLowerCase()))).size;
        return (
          <div style={{ marginBottom: "0.5rem", padding: "0.5rem 0.75rem", background: "var(--bg-card)", borderRadius: "0.5rem", border: "1px solid var(--border-default)" }}>
            <div style={{ fontSize: "0.55rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "#a855f7", fontWeight: 700, marginBottom: "0.3rem" }}>Buyer Intelligence Comparison</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.2rem", fontSize: "0.72rem" }}>
              {allBH.map(bh => {
                const meta2 = PROVIDER_META[bh.provider];
                return (
                  <span key={bh.provider} style={{ color: meta2?.color || "var(--text-secondary)" }}>
                    {meta2?.icon} {meta2?.label}: {bh.profileCount} profiles · {bh.platformCount} platforms · {bh.hotLeadCount} hot leads
                  </span>
                );
              })}
              <span style={{ fontSize: "0.68rem", fontWeight: 700, color: "#4caf50", marginTop: "0.15rem" }}>
                ✅ Combined: ~{totalUnique} unique profiles · {new Set(allBH.flatMap(b => b.platforms.map((p: any) => (p.platform || "").toLowerCase()))).size} platforms · {allBH.reduce((s, b) => s + b.hotLeadCount, 0)} hot leads
              </span>
            </div>
          </div>
        );
      })()}

      {/* Listing comparison (listing mode only) */}
      {isListing && successfulProviders.length > 1 && (() => {
        const allLH = successfulProviders.map(p => ({ ...extractLH(p), provider: p.provider }));
        return (
          <div style={{ marginBottom: "0.5rem", padding: "0.5rem 0.75rem", background: "var(--bg-card)", borderRadius: "0.5rem", border: "1px solid var(--border-default)" }}>
            <div style={{ fontSize: "0.55rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "#a855f7", fontWeight: 700, marginBottom: "0.3rem" }}>Listing Comparison</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.2rem", fontSize: "0.72rem" }}>
              {allLH.map(lh => {
                const meta2 = PROVIDER_META[lh.provider];
                return (
                  <span key={lh.provider} style={{ color: meta2?.color || "var(--text-secondary)" }}>
                    {meta2?.icon} {meta2?.label}: {lh.platformCount} listings · {lh.allKwCount} keywords{lh.bestTitle ? ` · "${(lh.bestTitle as string).slice(0, 30)}..."` : ""}
                  </span>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* Recon comparison (recon mode only) */}
      {isRecon && successfulProviders.length > 1 && (() => {
        const allRH = successfulProviders.map(p => ({ ...extractRH(p), provider: p.provider }));
        return (
          <div style={{ marginBottom: "0.5rem", padding: "0.5rem 0.75rem", background: "var(--bg-card)", borderRadius: "0.5rem", border: "1px solid var(--border-default)" }}>
            <div style={{ fontSize: "0.55rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "#a855f7", fontWeight: 700, marginBottom: "0.3rem" }}>Competitive Intel Comparison</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.2rem", fontSize: "0.72rem" }}>
              {allRH.map(rh => {
                const meta2 = PROVIDER_META[rh.provider];
                return (
                  <span key={rh.provider} style={{ color: meta2?.color || "var(--text-secondary)" }}>
                    {meta2?.icon} {meta2?.label}: {rh.competitorCount} competitors{rh.demandLevel ? ` · ${rh.demandLevel} demand` : ""}{rh.alerts.length ? ` · ${rh.alerts.length} alerts` : ""}
                  </span>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* Vehicle comparison (carbot mode only) */}
      {isCarbot && successfulProviders.length > 1 && (() => {
        const allVH = successfulProviders.map(p => ({ ...extractVH(p), provider: p.provider }));
        return (
          <div style={{ marginBottom: "0.5rem", padding: "0.5rem 0.75rem", background: "var(--bg-card)", borderRadius: "0.5rem", border: "1px solid var(--border-default)" }}>
            <div style={{ fontSize: "0.55rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "#a855f7", fontWeight: 700, marginBottom: "0.3rem" }}>Vehicle Valuation Comparison</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.2rem", fontSize: "0.72rem" }}>
              {allVH.map(vh => {
                const meta2 = PROVIDER_META[vh.provider];
                return (
                  <span key={vh.provider} style={{ color: meta2?.color || "var(--text-secondary)" }}>
                    {meta2?.icon} {meta2?.label}: {vh.retailValue != null ? `Retail ${_fp(vh.retailValue)}` : "—"}{vh.condGrade ? ` · Grade ${vh.condGrade}` : ""}
                  </span>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* Antique comparison (antique mode only) */}
      {isAntique && successfulProviders.length > 1 && (() => {
        const allAH = successfulProviders.map(p => ({ ...extractAH(p), provider: p.provider }));
        return (
          <div style={{ marginBottom: "0.5rem", padding: "0.5rem 0.75rem", background: "var(--bg-card)", borderRadius: "0.5rem", border: "1px solid var(--border-default)" }}>
            <div style={{ fontSize: "0.55rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "#a855f7", fontWeight: 700, marginBottom: "0.3rem" }}>Antique Assessment Comparison</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.2rem", fontSize: "0.72rem" }}>
              {allAH.map(ah => {
                const meta2 = PROVIDER_META[ah.provider];
                return (
                  <span key={ah.provider} style={{ color: meta2?.color || "var(--text-secondary)" }}>
                    {meta2?.icon} {meta2?.label}: {ah.verdict || "—"}{ah.auctionEst != null ? ` · Auction ${_fp(ah.auctionEst)}` : ""}{ah.confidence ? ` · ${ah.confidence}%` : ""}
                  </span>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* Photo comparison (photos mode only) */}
      {isPhotos && successfulProviders.length > 1 && (() => {
        const allPhH = successfulProviders.map(p => ({ ...extractPhH(p), provider: p.provider }));
        return (
          <div style={{ marginBottom: "0.5rem", padding: "0.5rem 0.75rem", background: "var(--bg-card)", borderRadius: "0.5rem", border: "1px solid var(--border-default)" }}>
            <div style={{ fontSize: "0.55rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "#a855f7", fontWeight: 700, marginBottom: "0.3rem" }}>Photo Analysis Comparison</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.2rem", fontSize: "0.72rem" }}>
              {allPhH.map(ph => {
                const meta2 = PROVIDER_META[ph.provider];
                return (
                  <span key={ph.provider} style={{ color: meta2?.color || "var(--text-secondary)" }}>
                    {meta2?.icon} {meta2?.label}: {ph.qualityScore != null ? `${ph.qualityScore}/10` : "—"} · {ph.tipCount} tips · {ph.missingCount} missing
                  </span>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* Collectibles comparison (collectibles mode only) */}
      {isCollectibles && successfulProviders.length > 1 && (() => {
        const allCH = successfulProviders.map(p => ({ ...extractCollH(p), provider: p.provider }));
        return (
          <div style={{ marginBottom: "0.5rem", padding: "0.5rem 0.75rem", background: "var(--bg-card)", borderRadius: "0.5rem", border: "1px solid var(--border-default)" }}>
            <div style={{ fontSize: "0.55rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "#a855f7", fontWeight: 700, marginBottom: "0.4rem" }}>Collectibles Expert Comparison</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
              {allCH.map(ch => {
                const meta2 = PROVIDER_META[ch.provider];
                return (
                  <div key={ch.provider} style={{ padding: "0.3rem 0.5rem", background: "var(--bg-card)", borderRadius: "0.4rem", border: "1px solid var(--border-default)" }}>
                    <div style={{ fontSize: "0.65rem", fontWeight: 700, color: meta2?.color || "var(--text-secondary)", marginBottom: "0.15rem" }}>
                      {meta2?.icon} {meta2?.label}
                    </div>
                    <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", fontSize: "0.62rem", color: "var(--text-secondary)" }}>
                      {ch.rawLow ? <span>Raw: <strong style={{ color: "var(--accent)" }}>{_fp(ch.rawLow)}-{_fp(ch.rawHigh)}</strong></span> : ch.valueLow ? <span>Raw: <strong style={{ color: "var(--accent)" }}>{_fp(ch.valueLow)}-{_fp(ch.valueHigh)}</strong></span> : null}
                      {ch.psaGrade && <span>PSA Est: <strong>{ch.psaGrade}</strong></span>}
                      {ch.gradingRec && <span style={{ color: ch.gradingRec.toLowerCase().includes("strong") ? "#4caf50" : ch.gradingRec.toLowerCase().includes("skip") ? "#ef4444" : "#fbbf24" }}>{ch.gradingRec}</span>}
                      {ch.bestPlatform && <span>Sell: {ch.bestPlatform}</span>}
                      {ch.demandLevel && <span style={{ color: ch.demandLevel === "Rising" ? "#4caf50" : ch.demandLevel === "Declining" ? "#ef4444" : "var(--text-muted)" }}>{ch.demandLevel}</span>}
                      {ch.investmentVerdict && <span style={{ fontWeight: 600 }}>{ch.investmentVerdict}</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* Detailed written summary */}
      <div style={{
        background: "rgba(139,92,246,0.04)",
        borderLeft: "3px solid rgba(139,92,246,0.3)",
        borderRadius: "0 0.5rem 0.5rem 0",
        padding: "0.65rem 0.85rem",
      }}>
        <div style={{ fontSize: "0.6rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "#a855f7", fontWeight: 700, marginBottom: "0.3rem" }}>
          {isPricing ? "MegaBot Pricing Summary" : isBuyers ? "MegaBot Buyer Summary" : isListing ? "MegaBot Listing Summary" : isRecon ? "MegaBot Recon Summary" : isCarbot ? "MegaBot Vehicle Summary" : isAntique ? "MegaBot Antique Summary" : isPhotos ? "MegaBot Photo Summary" : isCollectibles ? "MegaBot Collectibles Summary" : "MegaBot Summary"}
        </div>
        <p style={{ fontSize: "0.82rem", lineHeight: 1.65, color: "var(--text-secondary)", margin: 0 }}>
          {isPricing ? buildPricingSummary() : isBuyers ? buildBuyerSummary() : isListing ? buildListingSummary() : isRecon ? buildReconSummary() : isCarbot ? buildVehicleSummary() : isAntique ? buildAntiqueSummary() : isPhotos ? buildPhotoSummary() : isCollectibles ? buildCollectiblesSummary() : buildDetailedSummary()}
        </p>
      </div>
    </div>
  );
}

/** Knowledge sub-section card for expanded agent view */
function KnowledgeSection({ icon, title, text }: { icon: string; title: string; text: string }) {
  const display = text.length > 300 ? text.slice(0, 300) + "..." : text;
  return (
    <div style={{
      padding: "0.35rem 0.5rem",
      background: "var(--bg-card)", borderRadius: "0.4rem",
      border: "1px solid var(--border-default)",
    }}>
      <div style={{ fontSize: "0.58rem", fontWeight: 700, color: "var(--text-secondary)", marginBottom: "0.15rem" }}>
        {icon} {title}
      </div>
      <p style={{ fontSize: "0.7rem", color: "var(--text-secondary)", margin: 0, lineHeight: 1.5 }}>
        {display}
      </p>
    </div>
  );
}

/** Tag chip for agent expanded view */
function AgentTag({ children, color }: { children: React.ReactNode; color: string }) {
  return (
    <span style={{
      fontSize: "0.58rem", padding: "0.1rem 0.4rem", borderRadius: "9999px",
      background: "var(--ghost-bg)", border: `1px solid ${color}30`,
      color, fontWeight: 500,
    }}>
      {children}
    </span>
  );
}

/** Grid row helper for expanded agent cards */
function GridRow({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div style={{ minWidth: 0 }}>
      <span style={{ fontSize: "0.55rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.03em" }}>{label}: </span>
      <span style={{ fontSize: "0.72rem", color: "var(--text-primary)", fontWeight: bold ? 600 : 400, wordBreak: "break-word" }}>{value}</span>
    </div>
  );
}

/* ─── Credit Launch Button ─── */

function CreditLaunchButton({ label, credits, onClick, loading, variant = "primary" }: {
  label: string;
  credits: number;
  onClick: () => void;
  loading: boolean;
  variant?: "primary" | "mega";
}) {
  const isMega = variant === "mega";
  return (
    <button
      onClick={onClick}
      disabled={loading}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "0.4rem",
        padding: isMega ? "0.5rem 1.2rem" : "0.6rem 1.5rem",
        fontSize: isMega ? "0.78rem" : "0.88rem",
        fontWeight: 700,
        borderRadius: "0.6rem",
        border: "none",
        background: loading
          ? "rgba(0,188,212,0.15)"
          : isMega
            ? "linear-gradient(135deg, rgba(0,188,212,0.15), rgba(255,215,0,0.1))"
            : "linear-gradient(135deg, #00bcd4, #009688)",
        color: isMega ? "var(--accent)" : "#fff",
        cursor: loading ? "wait" : "pointer",
        ...(isMega ? { border: "1px solid rgba(0,188,212,0.3)" } : {}),
      }}
    >
      {loading ? "Launching..." : (
        <>
          {isMega ? "⚡" : "🚀"} {label} · {credits} credits
        </>
      )}
    </button>
  );
}

// Error boundary wrapper — catches React render crashes and shows fallback instead of blank panel
function MegaBotBoostResults(props: { botType: string; result: any; aiData: any }) {
  try {
    return <MegaBotBoostResultsInner {...props} />;
  } catch (err: any) {
    console.error("[MegaBotBoostResults] Render crash:", err);
    return (
      <div style={{ padding: "0.75rem 1rem", borderRadius: "0.5rem", background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)" }}>
        <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "#ef4444", marginBottom: "0.3rem" }}>⚡ MegaBot Render Error</div>
        <div style={{ fontSize: "0.62rem", color: "var(--text-muted)" }}>{err?.message || "Unknown error"}</div>
        <div style={{ fontSize: "0.58rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>Data received: {props.result?.providers?.length ?? 0} providers, {props.result?.agreementScore ?? "?"}% agreement</div>
      </div>
    );
  }
}

/* ═══════════════════════════════════════════
   PANEL 1: AI Analysis (FREE — auto-populates)
   ═══════════════════════════════════════════ */

function AiAnalysisPanel({ aiData, itemId, status, onSuperBoost, boosting, boosted, boostResult, collapsed, onToggle, demandScore, botDisagreement }: {
  aiData: any;
  itemId: string;
  status: string;
  onSuperBoost: () => void;
  boosting: boolean;
  boosted: boolean;
  boostResult: any;
  collapsed?: boolean;
  onToggle?: () => void;
  demandScore?: { score: number; label: string; signals?: any[] } | null;
  botDisagreement?: { disagreements?: any[]; summary?: string } | null;
}) {
  const router = useRouter();
  const [analyzing, setAnalyzing] = useState(false);
  const [showJson, setShowJson] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aiOpenSections, setAiOpenSections] = useState<Set<string>>(new Set(["ai-summary", "ai-condition", "ai-pricing", "megabot-results"]));
  const toggleAiSection = (id: string) => { setAiOpenSections(prev => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; }); };
  const hasData = !!aiData;
  const isDraft = status === "DRAFT";

  async function analyze(force?: boolean) {
    setAnalyzing(true);
    setError(null);
    try {
      const res = await fetch(`/api/analyze/${itemId}${force ? "?force=1" : ""}`, { method: "POST" });
      if (!res.ok) {
        setError(await res.text() || `Analysis failed (${res.status})`);
        setAnalyzing(false);
        return;
      }
      const scrollY = window.scrollY;
      router.refresh();
      requestAnimationFrame(() => window.scrollTo(0, scrollY));
    } catch (err: any) {
      setError(err?.message || "Network error");
    } finally {
      setAnalyzing(false);
    }
  }

  return (
    <GlassCard fullWidth={!hasData && isDraft}>
      <PanelHeader icon="🧠" title="AI Analysis" hasData={hasData} collapsed={collapsed} onToggle={onToggle}
        preview={hasData ? `${aiData.item_name || "Identified"} · ${aiData.condition_guess || "—"} ${aiData.condition_score ? aiData.condition_score + "/10" : ""} · ${aiData.confidence ? Math.round((aiData.confidence > 1 ? aiData.confidence : aiData.confidence * 100)) + "% confident" : ""}` : "Not analyzed yet"}
      />

      {collapsed && hasData && <CollapsedSummary botType="analyze" data={{ itemName: aiData?.item_name, conditionScore: aiData?.condition_score, category: aiData?.category, confidence: aiData?.confidence }} buttons={<>
        <button onClick={() => analyze(hasData)} style={{ padding: "0.3rem 0.65rem", fontSize: "0.62rem", fontWeight: 600, borderRadius: "0.4rem", border: "1px solid var(--border-default)", background: "var(--ghost-bg)", color: "var(--text-secondary)", cursor: "pointer", minHeight: "32px" }}>🧠 Re-Run · 0.5 cr</button>
        {onSuperBoost && <button onClick={onSuperBoost} style={{ padding: "0.3rem 0.65rem", fontSize: "0.62rem", fontWeight: 600, borderRadius: "0.4rem", border: "none", background: "linear-gradient(135deg, #00bcd4, #009688)", color: "#fff", cursor: "pointer", minHeight: "32px" }}>{boosted ? "🔄 MegaBot Re-Run · 3 cr" : "⚡ MegaBot · 3 cr"}</button>}
        <a href="/bots/analyzebot" style={{ padding: "0.3rem 0.65rem", fontSize: "0.62rem", fontWeight: 600, borderRadius: "0.4rem", border: "1px solid rgba(0,188,212,0.3)", color: "#00bcd4", textDecoration: "none", display: "inline-flex", alignItems: "center", minHeight: "32px" }}>Open AnalyzeBot →</a>
      </>} />}
      {collapsed && !hasData && (
        <div style={{ padding: "0.65rem 0.85rem", display: "flex", alignItems: "center", gap: "0.65rem" }}>
          <span style={{ fontSize: "1.3rem" }}>🧠</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-primary)" }}>AI Analysis</div>
            <div style={{ fontSize: "0.62rem", color: "var(--text-muted)", lineHeight: 1.4 }}>AI identification, condition scoring, and valuation</div>
          </div>
          <div style={{ display: "flex", gap: "0.3rem", flexShrink: 0 }}>
            <button onClick={() => analyze(false)} style={{ padding: "0.3rem 0.65rem", fontSize: "0.62rem", fontWeight: 600, borderRadius: "0.4rem", border: "1px solid var(--border-default)", background: "var(--ghost-bg)", color: "var(--text-secondary)", cursor: "pointer", minHeight: "32px" }}>🧠 Analyze</button>
            <a href="/bots/analyzebot" style={{ padding: "0.3rem 0.65rem", fontSize: "0.62rem", fontWeight: 600, borderRadius: "0.4rem", border: "1px solid rgba(0,188,212,0.3)", color: "#00bcd4", textDecoration: "none", display: "inline-flex", alignItems: "center", minHeight: "32px" }}>→</a>
          </div>
        </div>
      )}

      <div style={{ display: collapsed ? "none" : "flex", flexDirection: "column" as const, flex: 1 }}>
      <div style={{ padding: "1.25rem" }}>
        {analyzing ? (
          <BotLoadingState botName="AnalyzeBot" />
        ) : !hasData ? (
          /* ── BEFORE ANALYSIS ── */
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", flex: 1, justifyContent: "center", padding: "1.25rem", gap: "0.5rem" }}>
            <span style={{ fontSize: "1.5rem" }}>🧠</span>
            <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--text-primary)" }}>AI Analysis</div>
            <p style={{ fontSize: "0.68rem", color: "var(--text-secondary)", lineHeight: 1.5, maxWidth: 300, margin: 0 }}>AI-powered item identification, condition scoring, and market valuation.</p>
            <div style={{ width: "100%", maxWidth: 300, padding: "0.5rem 0.65rem", background: "var(--ghost-bg)", borderRadius: "0.5rem", border: "1px solid var(--border-default)", textAlign: "left" }}>
              <div style={{ fontSize: "0.55rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.25rem" }}>What You&apos;ll Get</div>
              {[{ icon: "🔍", text: "Item identification + category" }, { icon: "📊", text: "Condition scoring (1-10)" }, { icon: "💰", text: "Market valuation range" }].map((b, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.3rem", padding: "0.15rem 0", fontSize: "0.62rem", color: "var(--text-secondary)" }}><span style={{ fontSize: "0.6rem", flexShrink: 0 }}>{b.icon}</span><span>{b.text}</span></div>
              ))}
            </div>
            <div style={{ display: "flex", gap: "0.4rem", justifyContent: "center", flexWrap: "wrap", marginTop: "0.5rem", paddingTop: "0.4rem", borderTop: "1px solid var(--border-default)", width: "100%" }}>
              <button
                onClick={() => analyze()}
                disabled={analyzing}
                className="btn-primary"
                style={{
                  padding: isDraft ? "0.9rem 2.5rem" : "0.6rem 1.5rem",
                  fontSize: isDraft ? "1.05rem" : "0.88rem",
                  fontWeight: 700,
                  ...(isDraft && !analyzing ? {
                    animation: "pulse 2s ease-in-out infinite",
                    boxShadow: "0 0 24px rgba(0,188,212,0.4)",
                  } : {}),
                }}
              >
                {analyzing ? "Analyzing... (10-30 seconds)" : isDraft ? "Analyze This Item with AI" : "Run AI Analysis"}
              </button>
            </div>
            {error && (
              <div style={{ marginTop: "0.75rem", padding: "0.6rem 1rem", borderRadius: "0.75rem", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#ef4444", fontSize: "0.8rem", textAlign: "left", maxWidth: 400, margin: "0.75rem auto 0" }}>
                {error}
              </div>
            )}
          </div>
        ) : (
          /* ── AFTER ANALYSIS — Rich Display ── */
          <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>

            {/* Expand All / Collapse All */}
            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "-0.5rem" }}>
              <button
                onClick={() => {
                  const allIds = ["ai-summary", "ai-condition", "ai-pricing", "ai-listing", "ai-shipping", "ai-photos", "ai-keywords"];
                  setAiOpenSections(prev => prev.size >= allIds.length ? new Set() : new Set(allIds));
                }}
                style={{ fontSize: "0.5rem", fontWeight: 600, color: "var(--text-muted)", background: "transparent", border: "none", cursor: "pointer", padding: "0.2rem 0.4rem", borderRadius: "0.25rem" }}
              >
                {aiOpenSections.size >= 7 ? "▲ Collapse All" : "▼ Expand All"}
              </button>
            </div>

            {/* ── SECTION A: IDENTIFICATION ── */}
            <AccordionHeader id="ai-summary" icon="🔍" title="ITEM IDENTIFICATION" subtitle={aiData?.item_name || ""} isOpen={aiOpenSections.has("ai-summary")} onToggle={toggleAiSection} accentColor="#00bcd4" badge={aiData?.category || ""} />
            {aiOpenSections.has("ai-summary") && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.6rem" }}>
              {[
                { label: "Item", value: aiData.item_name },
                { label: "Category", value: [aiData.category, aiData.subcategory].filter(Boolean).join(" › ") },
                { label: "Brand / Maker", value: aiData.brand || aiData.maker },
                { label: "Model", value: aiData.model },
                ...(aiData.material ? [{ label: "Material", value: aiData.material }] : []),
                ...(aiData.era ? [{ label: "Era / Period", value: aiData.era }] : []),
                ...(aiData.style ? [{ label: "Style", value: aiData.style }] : []),
                ...(aiData.country_of_origin ? [{ label: "Origin", value: aiData.country_of_origin }] : []),
                ...(aiData.markings ? [{ label: "Markings", value: aiData.markings }] : []),
                ...(aiData.dimensions_estimate ? [{ label: "Dimensions", value: aiData.dimensions_estimate }] : []),
                ...(aiData.completeness ? [{ label: "Completeness", value: aiData.completeness }] : []),
              ].filter(d => d.value).map((d) => (
                <div key={d.label} style={{
                  background: "var(--bg-card)", border: "1px solid var(--border-default)",
                  borderRadius: "0.6rem", padding: "0.6rem 0.75rem",
                }}>
                  <div style={{ fontSize: "0.55rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-muted)" }}>{d.label}</div>
                  <div style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--text-primary)", marginTop: "0.15rem", lineHeight: 1.35 }}>{d.value}</div>
                </div>
              ))}
            </div>
            )}

            {/* ── SECTION B: CONDITION ASSESSMENT ── */}
            <AccordionHeader id="ai-condition" icon="📋" title="CONDITION" subtitle={`${aiData?.condition_score ?? "?"}/10 · ${aiData?.condition_guess ?? ""}`} isOpen={aiOpenSections.has("ai-condition")} onToggle={toggleAiSection} accentColor={(() => { const s = aiData?.condition_score ?? 5; return s >= 7 ? "#22c55e" : s >= 4 ? "#f59e0b" : "#ef4444"; })()} />
            {aiOpenSections.has("ai-condition") && (aiData.condition_score != null || aiData.condition_cosmetic != null || aiData.condition_functional != null) && (
              <div>
                <div style={{ display: "flex", justifyContent: "center", gap: "1.5rem", padding: "0.25rem 0" }}>
                  {aiData.condition_score != null && <ScoreCircle label="Overall" score={aiData.condition_score} />}
                  {aiData.condition_cosmetic != null && <ScoreCircle label="Cosmetic" score={aiData.condition_cosmetic} />}
                  {aiData.condition_functional != null && <ScoreCircle label="Functional" score={aiData.condition_functional} />}
                </div>

                {/* Condition label from AI */}
                {(aiData.condition_guess || aiData.condition) && (
                  <div style={{ display: "flex", justifyContent: "center", marginTop: "0.4rem" }}>
                    <span style={{ padding: "0.2rem 0.7rem", borderRadius: "9999px", fontSize: "0.7rem", fontWeight: 600, background: "rgba(0,188,212,0.1)", color: "var(--accent)" }}>
                      {aiData.condition_guess || aiData.condition}
                    </span>
                  </div>
                )}

                {/* Condition details */}
                {aiData.condition_details && (
                  <p style={{ fontSize: "0.78rem", color: "var(--text-secondary)", margin: "0.5rem 0 0 0", lineHeight: 1.5, textAlign: "center" }}>
                    {aiData.condition_details}
                  </p>
                )}

                {/* Visible issues */}
                {Array.isArray(aiData.visible_issues) && aiData.visible_issues.length > 0 && (
                  <div style={{ marginTop: "0.5rem" }}>
                    {aiData.visible_issues.map((issue: string, i: number) => (
                      <div key={i} style={{ fontSize: "0.75rem", color: "#f59e0b", lineHeight: 1.5, paddingLeft: "0.25rem" }}>
                        ⚠️ {issue}
                      </div>
                    ))}
                  </div>
                )}

                {/* Positive notes */}
                {Array.isArray(aiData.positive_notes) && aiData.positive_notes.length > 0 && (
                  <div style={{ marginTop: "0.35rem" }}>
                    {aiData.positive_notes.map((note: string, i: number) => (
                      <div key={i} style={{ fontSize: "0.75rem", color: "#4caf50", lineHeight: 1.5, paddingLeft: "0.25rem" }}>
                        ✅ {note}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── SECTION: PRICING & VALUATION ── */}
            <AccordionHeader id="ai-pricing" icon="💰" title="PRICING & CONFIDENCE" subtitle={aiData?.confidence != null ? `${Math.round(Math.min(100, (aiData.confidence || 0) * 100))}% confident` : ""} isOpen={aiOpenSections.has("ai-pricing")} onToggle={toggleAiSection} accentColor="#00bcd4" />
            {aiOpenSections.has("ai-pricing") && (<>
            {/* Bot disagreement warning */}
            {botDisagreement && botDisagreement.disagreements && botDisagreement.disagreements.length > 0 && (
              <div style={{ background: "rgba(234,179,8,0.1)", border: "1px solid rgba(234,179,8,0.3)", borderRadius: "8px", padding: "10px 14px", marginBottom: "12px", fontSize: "13px", color: "#eab308" }}>
                <div style={{ fontWeight: 700, marginBottom: "4px" }}>⚠️ Bot Pricing Disagreement Detected</div>
                {botDisagreement.disagreements.map((d: any, i: number) => (
                  <div key={i} style={{ fontSize: "12px", color: "var(--text-secondary, #94a3b8)", marginTop: "2px" }}>
                    {d.botA}: ${d.priceA?.toLocaleString()} vs {d.botB}: ${d.priceB?.toLocaleString()} — {d.diffPercent}% difference
                  </div>
                ))}
                <div style={{ fontSize: "11px", color: "var(--text-muted, #64748b)", marginTop: "6px" }}>Consider running MegaBot for consensus pricing.</div>
              </div>
            )}
            {/* Demand score badge */}
            {demandScore && (
              <div style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "2px 10px", borderRadius: "12px", fontSize: "12px", fontWeight: 600, marginBottom: "8px",
                background: demandScore.score >= 80 ? "rgba(239,68,68,0.15)" : demandScore.score >= 60 ? "rgba(34,197,94,0.15)" : demandScore.score >= 40 ? "rgba(234,179,8,0.15)" : "rgba(148,163,184,0.15)",
                color: demandScore.score >= 80 ? "#ef4444" : demandScore.score >= 60 ? "#22c55e" : demandScore.score >= 40 ? "#eab308" : "#94a3b8",
              }}>
                {demandScore.score >= 80 ? "🔥" : demandScore.score >= 60 ? "📈" : demandScore.score >= 40 ? "📊" : "❄️"}{" "}{demandScore.label} ({demandScore.score}/100)
              </div>
            )}
            {/* Confidence bar */}
            {aiData.confidence != null && (() => {
              const confPct = Math.round(Math.min(100, (aiData.confidence || 0) * 100));
              return (
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.72rem", marginBottom: "0.25rem" }}>
                    <span style={{ color: "var(--text-secondary)" }}>Confidence</span>
                    <span style={{ fontWeight: 600, color: confPct >= 70 ? "#4caf50" : "#ff9800" }}>{confPct}%</span>
                  </div>
                  <div style={{ height: 6, borderRadius: 99, background: "var(--ghost-bg)", overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${confPct}%`, borderRadius: 99, background: confPct >= 70 ? "#4caf50" : "#ff9800", transition: "width 0.5s ease" }} />
                  </div>
                </div>
              );
            })()}

            {/* ── SECTION C: EXPERT SUMMARY ── */}
            {(aiData.summary || aiData.pricing_rationale) && (
              <div style={{
                background: "rgba(0,188,212,0.06)",
                borderLeft: "3px solid var(--accent)",
                borderRadius: "0 0.65rem 0.65rem 0",
                padding: "0.75rem 0.85rem",
              }}>
                <div style={{ fontSize: "0.58rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--accent)", fontWeight: 700, marginBottom: "0.3rem" }}>Expert Summary</div>
                <p style={{ fontSize: "0.8rem", lineHeight: 1.55, color: "var(--text-primary)", margin: 0 }}>
                  {aiData.summary || `${aiData.item_name || "This item"} in ${(aiData.condition_guess || "unknown").toLowerCase()} condition. ${aiData.pricing_rationale || ""}`}
                </p>
                {aiData.restoration_potential && (
                  <p style={{ fontSize: "0.75rem", lineHeight: 1.45, color: "var(--text-secondary)", margin: "0.4rem 0 0 0" }}>
                    🔧 Restoration: {aiData.restoration_potential}
                  </p>
                )}
              </div>
            )}

            </>)}

            {/* ── SECTION D: ANTIQUE INDICATORS ── */}
            {(aiData.is_antique || (aiData.estimated_age_years && aiData.estimated_age_years > 50) || (Array.isArray(aiData.antique_markers) && aiData.antique_markers.length > 0)) && (
              <div style={{
                background: "linear-gradient(135deg, rgba(255,107,53,0.06), rgba(255,182,39,0.04))",
                border: "1px solid rgba(255,107,53,0.2)",
                borderRadius: "0.65rem",
                padding: "0.75rem 0.85rem",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.4rem" }}>
                  <span style={{ fontSize: "0.9rem" }}>🏛️</span>
                  <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "#FFB627", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    Antique Detected
                    {aiData.estimated_age_years ? ` — ~${aiData.estimated_age_years} years old` : ""}
                  </span>
                </div>
                {Array.isArray(aiData.antique_markers) && aiData.antique_markers.length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.3rem", marginBottom: "0.4rem" }}>
                    {aiData.antique_markers.map((m: string, i: number) => (
                      <span key={i} style={{
                        padding: "0.15rem 0.5rem", borderRadius: "9999px", fontSize: "0.65rem", fontWeight: 600,
                        background: "rgba(255,182,39,0.12)", color: "#FFB627",
                      }}>
                        {m}
                      </span>
                    ))}
                  </div>
                )}
                <p style={{ fontSize: "0.72rem", color: "var(--text-muted)", margin: 0, lineHeight: 1.4 }}>
                  Antique items may be worth significantly more with proper authentication.
                  {aiData.appraisal_recommended && " Professional appraisal recommended."}
                  {aiData.potential_value_if_authenticated != null && ` Potential authenticated value: $${aiData.potential_value_if_authenticated.toLocaleString()}.`}
                </p>
              </div>
            )}

            {/* ── SECTION E: LISTING SUGGESTIONS ── */}
            <AccordionHeader id="ai-listing" icon="📝" title="LISTING SUGGESTIONS" subtitle={aiData?.recommended_title || ""} isOpen={aiOpenSections.has("ai-listing")} onToggle={toggleAiSection} />
            {aiOpenSections.has("ai-listing") && (aiData.recommended_title || aiData.recommended_description || (Array.isArray(aiData.keywords) && aiData.keywords.length > 0)) && (
              <div>
                <div style={{ fontSize: "0.58rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-muted)", fontWeight: 700, marginBottom: "0.4rem" }}>
                  Listing Preview
                </div>
                {aiData.recommended_title && (
                  <div style={{
                    background: "var(--bg-card)", border: "1px solid var(--border-default)",
                    borderRadius: "0.5rem", padding: "0.5rem 0.65rem", marginBottom: "0.35rem",
                  }}>
                    <div style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--text-primary)", lineHeight: 1.35 }}>
                      {aiData.recommended_title}
                    </div>
                    <div style={{ fontSize: "0.6rem", color: "var(--text-muted)", marginTop: "0.15rem" }}>
                      {aiData.recommended_title.length} / 80 characters
                    </div>
                  </div>
                )}
                {aiData.recommended_description && (
                  <p style={{ fontSize: "0.78rem", color: "var(--text-secondary)", margin: "0 0 0.35rem 0", lineHeight: 1.5 }}>
                    {aiData.recommended_description}
                  </p>
                )}
                {/* Keywords */}
                {Array.isArray(aiData.keywords) && aiData.keywords.length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.25rem", marginBottom: "0.35rem" }}>
                    {aiData.keywords.slice(0, 10).map((kw: string, i: number) => (
                      <span key={i} style={{
                        padding: "0.12rem 0.45rem", borderRadius: "9999px", fontSize: "0.6rem", fontWeight: 500,
                        background: "var(--ghost-bg)", border: "1px solid var(--border-default)", color: "var(--text-muted)",
                      }}>
                        {kw}
                      </span>
                    ))}
                  </div>
                )}
                {/* Best platforms + Copy to ListBot */}
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                  {Array.isArray(aiData.best_platforms) && aiData.best_platforms.slice(0, 4).map((p: string, i: number) => (
                    <span key={i} style={{
                      padding: "0.15rem 0.5rem", borderRadius: "9999px", fontSize: "0.62rem", fontWeight: 600,
                      background: "rgba(0,188,212,0.08)", color: "var(--accent)",
                    }}>
                      {p}
                    </span>
                  ))}
                  <a
                    href={`/bots/listbot?item=${itemId}`}
                    style={{ fontSize: "0.7rem", fontWeight: 600, color: "var(--accent)", textDecoration: "none" }}
                  >
                    📋 Open in ListBot →
                  </a>
                </div>
              </div>
            )}

            {/* ── SECTION F: PHOTO QUALITY ── */}
            <AccordionHeader id="ai-photos" icon="📸" title="PHOTO QUALITY" subtitle={aiData?.photo_quality_score != null ? `${aiData.photo_quality_score}/10` : ""} isOpen={aiOpenSections.has("ai-photos")} onToggle={toggleAiSection} badge={(() => { const s = aiData?.photo_quality_score ?? 5; return s >= 7 ? "GOOD" : s >= 4 ? "OK" : "NEEDS WORK"; })()} />
            {aiOpenSections.has("ai-photos") && aiData.photo_quality_score != null && (
              <div style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
                <ScoreCircle label="Photos" score={aiData.photo_quality_score} size={38} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  {Array.isArray(aiData.photo_improvement_tips) && aiData.photo_improvement_tips.length > 0 && (
                    <div>
                      {aiData.photo_improvement_tips.slice(0, 4).map((tip: string, i: number) => (
                        <div key={i} style={{ fontSize: "0.72rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>
                          {i + 1}. {tip}
                        </div>
                      ))}
                    </div>
                  )}
                  <a
                    href={`/items/${itemId}/edit`}
                    style={{ fontSize: "0.7rem", fontWeight: 600, color: "var(--accent)", textDecoration: "none", display: "inline-block", marginTop: "0.25rem" }}
                  >
                    📷 Add More Photos
                  </a>
                </div>
              </div>
            )}

            {/* ── SECTION: SHIPPING PROFILE ── */}
            <AccordionHeader id="ai-shipping" icon="📦" title="SHIPPING PROFILE" subtitle={`${aiData?.weight_estimate_lbs ?? "?"} lbs · ${aiData?.shipping_difficulty ?? ""}`} isOpen={aiOpenSections.has("ai-shipping")} onToggle={toggleAiSection} />
            {aiOpenSections.has("ai-shipping") && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.4rem", marginBottom: "0.25rem" }}>
                <div style={{ textAlign: "center", padding: "0.4rem", background: "var(--ghost-bg)", borderRadius: "0.35rem" }}>
                  <div style={{ fontSize: "0.5rem", color: "var(--text-muted)", fontWeight: 600 }}>⚖️ WEIGHT</div>
                  <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--text-primary)" }}>{aiData?.weight_estimate_lbs ?? "—"} lbs</div>
                </div>
                <div style={{ textAlign: "center", padding: "0.4rem", background: "var(--ghost-bg)", borderRadius: "0.35rem" }}>
                  <div style={{ fontSize: "0.5rem", color: "var(--text-muted)", fontWeight: 600 }}>📐 DIMS</div>
                  <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--text-primary)" }}>{aiData?.dimensions_estimate ?? "—"}</div>
                </div>
                <div style={{ textAlign: "center", padding: "0.4rem", background: "var(--ghost-bg)", borderRadius: "0.35rem" }}>
                  <div style={{ fontSize: "0.5rem", color: "var(--text-muted)", fontWeight: 600 }}>🚚 DIFFICULTY</div>
                  <div style={{ fontSize: "0.8rem", fontWeight: 700, color: aiData?.shipping_difficulty === "Easy" ? "#22c55e" : aiData?.shipping_difficulty === "Moderate" ? "#f59e0b" : "#ef4444" }}>{aiData?.shipping_difficulty ?? "—"}</div>
                </div>
              </div>
            )}
            {aiOpenSections.has("ai-shipping") && aiData?.shipping_notes && (
              <div style={{ fontSize: "0.62rem", color: "var(--text-secondary)", lineHeight: 1.6, padding: "0.35rem 0.5rem", background: "rgba(0,188,212,0.04)", borderRadius: "0.35rem", borderLeft: "3px solid #00bcd4", marginBottom: "0.25rem" }}>
                📋 {aiData.shipping_notes}
              </div>
            )}

            {/* ── SECTION: KEYWORDS ── */}
            {Array.isArray(aiData?.keywords) && aiData.keywords.length > 0 && (
              <>
                <AccordionHeader id="ai-keywords" icon="🏷️" title="KEYWORDS" subtitle={`${aiData.keywords.length} terms`} isOpen={aiOpenSections.has("ai-keywords")} onToggle={toggleAiSection} />
                {aiOpenSections.has("ai-keywords") && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.3rem", marginBottom: "0.25rem" }}>
                    {aiData.keywords.slice(0, 15).map((k: string) => (
                      <span key={k} style={{ fontSize: "0.58rem", padding: "0.15rem 0.5rem", borderRadius: "9999px", background: "rgba(0,188,212,0.08)", color: "var(--accent)", fontWeight: 600 }}>{k}</span>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* ── SECTION G: RAW DATA TOGGLE ── */}
            <button onClick={() => setShowJson(!showJson)} style={{
              alignSelf: "flex-start", padding: "0.25rem 0.65rem", fontSize: "0.68rem", fontWeight: 600,
              borderRadius: "0.4rem", border: "1px solid var(--border-default)", background: "transparent",
              color: "var(--text-muted)", cursor: "pointer",
            }}>
              {showJson ? "Hide raw AI JSON" : "View raw AI JSON"}
            </button>
            {showJson && (
              <pre style={{ background: "var(--bg-card)", borderRadius: "0.5rem", padding: "0.75rem", overflow: "auto", fontSize: "0.65rem", color: "var(--text-muted)", maxHeight: 240, margin: 0 }}>
                {JSON.stringify(aiData, null, 2)}
              </pre>
            )}

            {/* ── SECTION H: MEGABOT RESULTS ── */}
            {boosted && boostResult && (
              <>
                <div style={{
                  marginTop: "0.75rem", marginBottom: "0.5rem", paddingTop: "0.5rem",
                  borderTop: "2px solid rgba(139,92,246,0.15)",
                  display: "flex", alignItems: "center", gap: "0.4rem",
                }}>
                  <span style={{ fontSize: "0.9rem" }}>⚡</span>
                  <span style={{ fontSize: "0.62rem", fontWeight: 700, color: "#8b5cf6", letterSpacing: "0.05em", textTransform: "uppercase" as const }}>MEGABOT MULTI-AI ANALYSIS</span>
                  {boostResult?.agreementScore != null && (
                    <span style={{
                      fontSize: "0.5rem", fontWeight: 700, padding: "2px 8px", borderRadius: "6px",
                      background: boostResult.agreementScore >= 70 ? "rgba(34,197,94,0.1)" : boostResult.agreementScore >= 40 ? "rgba(245,158,11,0.1)" : "rgba(239,68,68,0.1)",
                      color: boostResult.agreementScore >= 70 ? "#22c55e" : boostResult.agreementScore >= 40 ? "#f59e0b" : "#ef4444",
                    }}>{boostResult.agreementScore}% Agreement</span>
                  )}
                </div>
                <AccordionHeader id="megabot-results" icon="⚡" title="MEGABOT MULTI-AI ANALYSIS" subtitle={`${boostResult.agreementScore ?? "?"}% Agreement`} isOpen={aiOpenSections.has("megabot-results")} onToggle={toggleAiSection} accentColor="#8b5cf6" badge={`${(boostResult.providers || []).filter((p: any) => p.data || !p.error).length} AI`} />
                {aiOpenSections.has("megabot-results") && <MegaBotBoostResults botType="analysis" result={boostResult} aiData={aiData} />}
              </>
            )}
            {!boosted && !boosting && hasData && (
              <div style={{
                padding: "0.75rem", textAlign: "center", background: "rgba(139,92,246,0.04)",
                borderRadius: "0.5rem", border: "1px dashed rgba(139,92,246,0.2)", marginTop: "0.5rem",
              }}>
                <div style={{ fontSize: "0.7rem", fontWeight: 600, color: "#8b5cf6", marginBottom: "0.25rem" }}>
                  ⚡ Upgrade to MegaBot Analysis
                </div>
                <div style={{ fontSize: "0.55rem", color: "var(--text-muted)" }}>
                  4 AI engines analyze your item in parallel — 50x deeper than single AI
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <PanelFooter
        botName="AnalyzeBot"
        botLink="/bots/analyzebot"
        itemId={itemId}
        botIcon="🧠"
        botCost={1}
        onBotRun={() => analyze(hasData)}
        onSuperBoost={hasData ? onSuperBoost : undefined}
        boosting={boosting}
        boosted={boosted}
        hasResult={!!aiData}
      />
      </div>
    </GlassCard>
  );
}

/* ═══════════════════════════════════════════
   PANEL 2: Pricing (FREE — auto-populates)
   ═══════════════════════════════════════════ */

function PricingPanel({ valuation: v, antique, aiData, userTier, itemId, onSuperBoost, onPriceBotRun, boosting, boosted, boostResult, priceBotResult, priceBotLoading, collapsed, onToggle, quotedShippingRate, quotedShippingAt, shippingPreference, sellerListingPrice }: {
  valuation: any;
  antique: any;
  aiData: any;
  userTier: number;
  itemId: string;
  onSuperBoost: () => void;
  onPriceBotRun?: () => void;
  boosting: boolean;
  boosted: boolean;
  boostResult: any;
  priceBotResult?: any;
  priceBotLoading?: boolean;
  collapsed?: boolean;
  onToggle?: () => void;
  quotedShippingRate?: number | null;
  quotedShippingAt?: string | null;
  shippingPreference?: string;
  sellerListingPrice?: number | null;
}) {
  const [showCalc, setShowCalc] = useState(false);
  const [priceOpenSections, setPriceOpenSections] = useState<Set<string>>(
    new Set(["price-value", "price-confidence", "megabot-results"])
  );
  const togglePriceSection = (id: string) => {
    setPriceOpenSections(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };
  const hasData = !!v;

  // Parse extended pricing from onlineRationale
  let pr: any = null;
  if (v?.onlineRationale) {
    try {
      const parsed = JSON.parse(v.onlineRationale);
      if (parsed.localPrice && parsed.nationalPrice && parsed.bestMarket) pr = parsed;
    } catch { /* legacy fallback */ }
  }

  // Recalculate seller net + tip using CURRENT user tier (not stale analysis-time tier)
  const COMMISSION_RATES: Record<number, number> = { 1: 0.12, 2: 0.10, 3: 0.08, 4: 0.04 };
  if (pr) {
    const commRate = COMMISSION_RATES[userTier] ?? 0.12;
    const commPct = Math.round(commRate * 100);

    const localMid = pr.localPrice?.mid ?? 0;
    const nationalMid = pr.nationalPrice?.mid ?? 0;
    const bestMid = pr.bestMarket?.mid ?? 0;
    const shippingCost = quotedShippingRate ?? pr.bestMarket?.shippingCost ?? pr.shippingEstimate ?? 25;
    const bestCity = pr.bestMarket?.label ?? "top market";

    const localNet = Math.round((localMid - localMid * commRate) * 100) / 100;
    const nationalNet = Math.round((nationalMid - nationalMid * commRate) * 100) / 100;
    const shippedNet = Math.round((bestMid - bestMid * commRate - shippingCost) * 100) / 100;

    // Override sellerNet with current-tier values
    pr.sellerNet = { local: localNet, national: nationalNet, bestMarket: shippedNet };
    pr.commissionPct = commPct;

    // Recalculate recommendation with current tier + shipping method gate
    const aiWeight = aiData?.weight_estimate_lbs ?? null;
    const aiDifficulty = aiData?.shipping_difficulty ?? null;
    const isHeavyItem = (aiWeight != null && aiWeight > 100) || /freight|difficult/i.test(aiDifficulty || "");
    const isLocalOnlyItem = (aiWeight != null && aiWeight > 150) || /local.only|vehicle|riding.mow|lawn.tractor/i.test((aiData?.category || "").toLowerCase());
    const sellerChoseLocal = shippingPreference === "LOCAL_ONLY" || shippingPreference === "local_only";

    if (localMid <= 0) {
      pr.recommendation = "This item has no resale value. We recommend donating it to charity or recycling.";
    } else if (localMid < 5) {
      pr.recommendation = `At $${localMid} estimated value, this item is barely worth listing individually. Consider bundling with similar items or donating.`;
    } else if (isLocalOnlyItem || sellerChoseLocal) {
      pr.recommendation = `Sell locally for $${localMid}. This item is best sold via local pickup — you'd net $${localNet.toFixed(2)} after ${commPct}% commission. Too large/heavy for cost-effective shipping.`;
    } else if (isHeavyItem) {
      const realFreightCost = Math.max(shippingCost, (aiWeight ?? 100) * 1.5 + 100);
      const freightNet = Math.round((bestMid - bestMid * commRate - realFreightCost) * 100) / 100;
      if (freightNet > localNet && realFreightCost < bestMid * 0.25) {
        pr.recommendation = `Could ship freight to ${bestCity} (~$${Math.round(realFreightCost)} est.), netting ~$${freightNet.toFixed(0)}. But local pickup at $${localMid} is simpler — net $${localNet.toFixed(2)}. Consider both.`;
      } else {
        pr.recommendation = `Sell locally for $${localMid}. Freight shipping ($${Math.round(realFreightCost)}+) eats too much margin. Local pickup nets $${localNet.toFixed(2)} after ${commPct}% commission.`;
      }
    } else if (shippedNet > localNet && shippingCost < bestMid * 0.3) {
      pr.recommendation = `Ship to ${bestCity} for best return. You'd net $${shippedNet.toFixed(2)} shipped vs $${localNet.toFixed(2)} locally (after $${shippingCost} shipping + ${commPct}% commission).`;
    } else {
      pr.recommendation = `Sell locally for $${localMid}. You'd net $${localNet.toFixed(2)} after ${commPct}% commission. Shipping costs ($${shippingCost}) eat into the margin for this item.`;
    }
  }

  const condScore = aiData?.condition_score ?? null;
  const condBadge = condScore != null
    ? condScore >= 8 ? { label: "Condition adds value", color: "#4caf50", bg: "rgba(76,175,80,0.12)" }
    : condScore >= 6 ? { label: "Fair market value", color: "#00bcd4", bg: "rgba(0,188,212,0.1)" }
    : condScore >= 4 ? { label: "Condition reduces value", color: "#f59e0b", bg: "rgba(245,158,11,0.12)" }
    : { label: "Significant condition discount", color: "#ef4444", bg: "rgba(239,68,68,0.12)" }
    : null;

  return (
    <GlassCard>
      <PanelHeader icon="💰" title="Price Estimate" hasData={hasData} collapsed={collapsed} onToggle={onToggle}
        preview={hasData ? `$${Math.round(v.low)} – $${Math.round(v.high)} · ${v.source || "AI estimate"}` : "Awaiting analysis"}
      />

      {collapsed && hasData && <CollapsedSummary botType="pricing" data={{ low: v.low, high: v.high, confidence: v.confidence, demand: pr?.regionalIntel?.localDemand || null, netPayout: pr?.sellerNet?.local || null }} megaData={boosted ? boostResult : undefined} buttons={<>
        {onPriceBotRun && <button onClick={onPriceBotRun} style={{ padding: "0.3rem 0.65rem", fontSize: "0.62rem", fontWeight: 600, borderRadius: "0.4rem", border: "1px solid var(--border-default)", background: "var(--ghost-bg)", color: "var(--text-secondary)", cursor: "pointer", minHeight: "32px" }}>💰 Re-Run · 0.5 cr</button>}
        {onSuperBoost && <button onClick={onSuperBoost} style={{ padding: "0.3rem 0.65rem", fontSize: "0.62rem", fontWeight: 600, borderRadius: "0.4rem", border: "none", background: "linear-gradient(135deg, #00bcd4, #009688)", color: "#fff", cursor: "pointer", minHeight: "32px" }}>{boosted ? "🔄 MegaBot Re-Run · 3 cr" : "⚡ MegaBot · 5 cr"}</button>}
        <a href="/bots/pricebot" style={{ padding: "0.3rem 0.65rem", fontSize: "0.62rem", fontWeight: 600, borderRadius: "0.4rem", border: "1px solid rgba(0,188,212,0.3)", color: "#00bcd4", textDecoration: "none", display: "inline-flex", alignItems: "center", minHeight: "32px" }}>Open PriceBot →</a>
      </>} />}
      {collapsed && !hasData && (
        <div style={{ padding: "0.65rem 0.85rem", display: "flex", alignItems: "center", gap: "0.65rem" }}>
          <span style={{ fontSize: "1.3rem" }}>💰</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-primary)" }}>Price Estimate</div>
            <div style={{ fontSize: "0.62rem", color: "var(--text-muted)", lineHeight: 1.4 }}>Market pricing from comps, platforms, and demand data</div>
          </div>
          <div style={{ display: "flex", gap: "0.3rem", flexShrink: 0 }}>
            {onPriceBotRun && <button onClick={onPriceBotRun} style={{ padding: "0.3rem 0.65rem", fontSize: "0.62rem", fontWeight: 600, borderRadius: "0.4rem", border: "1px solid var(--border-default)", background: "var(--ghost-bg)", color: "var(--text-secondary)", cursor: "pointer", minHeight: "32px" }}>💰 PriceBot · 1 cr</button>}
            <a href="/bots/pricebot" style={{ padding: "0.3rem 0.65rem", fontSize: "0.62rem", fontWeight: 600, borderRadius: "0.4rem", border: "1px solid rgba(0,188,212,0.3)", color: "#00bcd4", textDecoration: "none", display: "inline-flex", alignItems: "center", minHeight: "32px" }}>Open PriceBot →</a>
          </div>
        </div>
      )}

      <div style={{ display: collapsed ? "none" : "flex", flexDirection: "column" as const, flex: 1 }}>
      <div style={{ padding: "1.25rem" }}>
        {priceBotLoading ? (
          <BotLoadingState botName="PriceBot" />
        ) : !hasData ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", flex: 1, justifyContent: "center", padding: "1.25rem", gap: "0.5rem" }}>
            <span style={{ fontSize: "1.5rem" }}>💰</span>
            <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--text-primary)" }}>Price Estimate</div>
            <p style={{ fontSize: "0.68rem", color: "var(--text-secondary)", lineHeight: 1.5, maxWidth: 300, margin: 0 }}>Market pricing from comparable sales, platform data, and demand analysis.</p>
            <div style={{ width: "100%", maxWidth: 300, padding: "0.5rem 0.65rem", background: "var(--ghost-bg)", borderRadius: "0.5rem", border: "1px solid var(--border-default)", textAlign: "left" }}>
              <div style={{ fontSize: "0.55rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.25rem" }}>What You&apos;ll Get</div>
              {[{ icon: "📊", text: "Comparable sales from 5+ platforms" }, { icon: "🏪", text: "Platform-specific pricing" }, { icon: "💵", text: "Net earnings calculation" }].map((b, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.3rem", padding: "0.15rem 0", fontSize: "0.62rem", color: "var(--text-secondary)" }}><span style={{ fontSize: "0.6rem", flexShrink: 0 }}>{b.icon}</span><span>{b.text}</span></div>
              ))}
            </div>
            <div style={{ display: "flex", gap: "0.4rem", justifyContent: "center", flexWrap: "wrap", marginTop: "0.5rem", paddingTop: "0.4rem", borderTop: "1px solid var(--border-default)", width: "100%" }}>
              {onPriceBotRun && <button onClick={onPriceBotRun} style={{ padding: "0.3rem 0.65rem", fontSize: "0.62rem", fontWeight: 600, borderRadius: "0.4rem", border: "1px solid var(--border-default)", background: "var(--ghost-bg)", color: "var(--text-secondary)", cursor: "pointer", minHeight: "32px" }}>💰 PriceBot · 1 cr</button>}
              <a href="/bots/pricebot" style={{ padding: "0.3rem 0.65rem", fontSize: "0.62rem", fontWeight: 600, borderRadius: "0.4rem", border: "1px solid rgba(0,188,212,0.3)", color: "#00bcd4", textDecoration: "none", display: "inline-flex", alignItems: "center", minHeight: "32px" }}>Open PriceBot →</a>
            </div>
          </div>
        ) : pr ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {/* 3 price cards */}
            {/* Low confidence warning */}
            {v.confidence != null && Math.round(v.confidence > 1 ? v.confidence : v.confidence * 100) < 50 && (
              <div style={{ padding: "0.35rem 0.5rem", background: "rgba(245,158,11,0.08)", borderRadius: "0.35rem", border: "1px solid rgba(245,158,11,0.2)", marginBottom: "0.5rem" }}>
                <span style={{ fontSize: "0.62rem", fontWeight: 700, color: "#f59e0b" }}>⚠️ Low Confidence ({Math.round(v.confidence > 1 ? v.confidence : v.confidence * 100)}%)</span>
                <span style={{ fontSize: "0.58rem", color: "var(--text-muted)", marginLeft: "0.3rem" }}>— Run MegaBot or PriceBot for a more accurate estimate</span>
              </div>
            )}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.5rem" }}>
              <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-default)", borderRadius: "0.65rem", padding: "0.6rem", textAlign: "center" }}>
                <div style={{ fontSize: "0.5rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-muted)" }}>Local</div>
                <div style={{ fontSize: "1.05rem", fontWeight: 700, color: "var(--accent)", marginTop: "0.15rem" }}>${Math.round((pr.localPrice.low + pr.localPrice.high) / 2)}</div>
                <div style={{ fontSize: "0.55rem", color: "var(--text-muted)", marginTop: "0.1rem" }}>{pr.localPrice.label || "Your area"}</div>
                {pr.regionalIntel?.localDemand && (
                  <div style={{ marginTop: "0.2rem", padding: "0.1rem 0.35rem", borderRadius: "9999px", fontSize: "0.5rem", fontWeight: 600, display: "inline-block",
                    background: /strong/i.test(pr.regionalIntel.localDemand) ? "rgba(76,175,80,0.12)" : /weak/i.test(pr.regionalIntel.localDemand) ? "rgba(239,68,68,0.12)" : "rgba(245,158,11,0.12)",
                    color: /strong/i.test(pr.regionalIntel.localDemand) ? "#4caf50" : /weak/i.test(pr.regionalIntel.localDemand) ? "#ef4444" : "#f59e0b",
                  }}>{pr.regionalIntel.localDemand} demand</div>
                )}
                {pr.sellerNet && <div style={{ fontSize: "0.68rem", fontWeight: 700, color: "#4caf50", marginTop: "0.25rem" }}>You get: ${pr.sellerNet.local.toFixed(0)}</div>}
              </div>
              <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-default)", borderRadius: "0.65rem", padding: "0.6rem", textAlign: "center" }}>
                <div style={{ fontSize: "0.5rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-muted)" }}>National</div>
                <div style={{ fontSize: "1.05rem", fontWeight: 700, color: "#4caf50", marginTop: "0.15rem" }}>${Math.round((pr.nationalPrice.low + pr.nationalPrice.high) / 2)}</div>
                <div style={{ fontSize: "0.55rem", color: "var(--text-muted)", marginTop: "0.1rem" }}>{pr.nationalPrice.label || "Nationwide"}</div>
                {pr.sellerNet && <div style={{ fontSize: "0.68rem", fontWeight: 700, color: "#4caf50", marginTop: "0.25rem" }}>You get: ${pr.sellerNet.national.toFixed(0)}</div>}
              </div>
              <div style={{ background: "var(--bg-card)", border: "1px solid rgba(251,191,36,0.25)", borderRadius: "0.65rem", padding: "0.6rem", textAlign: "center" }}>
                <div style={{ fontSize: "0.5rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "#fbbf24" }}>Best Market</div>
                <div style={{ fontSize: "1.05rem", fontWeight: 700, color: "#fbbf24", marginTop: "0.15rem" }}>${Math.round((pr.bestMarket.low + pr.bestMarket.high) / 2)}</div>
                <div style={{ fontSize: "0.55rem", color: "var(--text-muted)", marginTop: "0.1rem" }}>{pr.bestMarket.label || "Top market"}</div>
                {pr.regionalIntel?.bestWhy && (
                  <div style={{ fontSize: "0.48rem", color: "var(--text-muted)", marginTop: "0.15rem", lineHeight: 1.35, maxWidth: "100%" }}>{pr.regionalIntel.bestWhy.slice(0, 80)}{pr.regionalIntel.bestWhy.length > 80 ? "..." : ""}</div>
                )}
                {pr.sellerNet && <div style={{ fontSize: "0.68rem", fontWeight: 700, color: "#4caf50", marginTop: "0.25rem" }}>You get: ${pr.sellerNet.bestMarket.toFixed(0)}</div>}
              </div>
            </div>

            {/* Selling Options + Recommendation */}
            {pr?.sellerNet && (
              <div style={{ borderRadius: "0.5rem", overflow: "hidden", border: "1px solid var(--border-default)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "0.35rem 0.6rem", borderBottom: "1px solid var(--border-default)", background: "var(--ghost-bg)" }}>
                  <span style={{ fontSize: "0.68rem", color: "var(--text-secondary)" }}>🤝 Local Pickup</span>
                  <span style={{ fontSize: "0.68rem", fontWeight: 700, color: "#4ade80" }}>Net ${Math.round(pr.sellerNet.local)}</span>
                </div>
                {pr.sellerNet.bestMarket > 0 && pr.sellerNet.bestMarket > pr.sellerNet.local * 0.8 && (
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "0.35rem 0.6rem", borderBottom: "1px solid var(--border-default)" }}>
                    <span style={{ fontSize: "0.68rem", color: "var(--text-secondary)" }}>📦 Ship to Best Market</span>
                    <span style={{ fontSize: "0.68rem", fontWeight: 700, color: pr.sellerNet.bestMarket > pr.sellerNet.local ? "#4ade80" : "var(--text-muted)" }}>Net ${Math.round(pr.sellerNet.bestMarket)}</span>
                  </div>
                )}
                {pr.recommendation && (
                  <div style={{ padding: "0.4rem 0.6rem", background: "rgba(0,188,212,0.04)", borderLeft: "3px solid var(--accent)" }}>
                    <span style={{ fontSize: "0.62rem", color: "var(--accent)", fontWeight: 700 }}>AI Tip: </span>
                    <span style={{ fontSize: "0.62rem", color: "var(--text-secondary)" }}>{pr.recommendation}</span>
                  </div>
                )}
              </div>
            )}

            {condBadge && (
              <div style={{ display: "flex", justifyContent: "center" }}>
                <span style={{ padding: "0.2rem 0.65rem", borderRadius: "9999px", fontSize: "0.68rem", fontWeight: 600, background: condBadge.bg, color: condBadge.color }}>{condBadge.label}</span>
              </div>
            )}

            <AccordionHeader id="price-comps" icon="📋" title="COMPARABLE SALES" isOpen={priceOpenSections.has("price-comps")} onToggle={togglePriceSection} />
            {priceOpenSections.has("price-comps") && (<div style={{ padding: "0.35rem 0", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {/* How We Calculated This */}
            {(pr.adjustments || v.rationale) && (
              <>
                <button onClick={() => setShowCalc(!showCalc)} style={{
                  alignSelf: "flex-start", padding: "0.25rem 0.65rem", fontSize: "0.68rem", fontWeight: 600,
                  borderRadius: "0.4rem", border: "1px solid var(--border-default)", background: "transparent",
                  color: "var(--text-muted)", cursor: "pointer",
                }}>
                  {showCalc ? "Hide calculation" : "How We Calculated This"}
                </button>
                {showCalc && (
                  <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-default)", borderRadius: "0.5rem", padding: "0.65rem", fontSize: "0.75rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>
                    {pr.regionalIntel?.localReasoning && (
                      <div style={{ marginBottom: "0.4rem", padding: "0.35rem 0.5rem", borderRadius: "0.35rem", background: "rgba(0,188,212,0.06)", border: "1px solid rgba(0,188,212,0.1)" }}>
                        <span style={{ fontWeight: 700, color: "var(--accent)", fontSize: "0.65rem" }}>Local Market: </span>
                        <span style={{ fontSize: "0.7rem" }}>{pr.regionalIntel.localReasoning}</span>
                      </div>
                    )}
                    {pr.regionalIntel?.bestWhy && (
                      <div style={{ marginBottom: "0.4rem", padding: "0.35rem 0.5rem", borderRadius: "0.35rem", background: "rgba(251,191,36,0.06)", border: "1px solid rgba(251,191,36,0.1)" }}>
                        <span style={{ fontWeight: 700, color: "#fbbf24", fontSize: "0.65rem" }}>Best Market ({pr.bestMarket?.label}): </span>
                        <span style={{ fontSize: "0.7rem" }}>{pr.regionalIntel.bestWhy}</span>
                      </div>
                    )}
                    {pr.adjustments && pr.adjustments.map((adj: any, i: number) => {
                      const pct = Math.round((adj.factor - 1) * 100);
                      const sign = pct >= 0 ? "+" : "";
                      return (
                        <div key={i} style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.3rem" }}>
                          <span>{adj.name}: {adj.reason}</span>
                          <span style={{ fontWeight: 700, color: pct >= 0 ? "#4caf50" : "#f59e0b" }}>{sign}{pct}%</span>
                        </div>
                      );
                    })}
                    {v.rationale && !pr.adjustments && <p style={{ margin: 0 }}>{v.rationale}</p>}
                  </div>
                )}
              </>
            )}

            {/* Antique auction estimate */}
            {antique?.isAntique && antique.auctionLow != null && (
              <div style={{ background: "rgba(251,191,36,0.06)", border: "1px solid rgba(251,191,36,0.25)", borderRadius: "0.5rem", padding: "0.5rem 0.7rem", textAlign: "center" }}>
                <div style={{ fontSize: "0.5rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "#fbbf24", fontWeight: 700 }}>Auction Estimate</div>
                <div style={{ fontSize: "1rem", fontWeight: 800, color: "#fbbf24", marginTop: "0.15rem" }}>${antique.auctionLow.toLocaleString()} – ${antique.auctionHigh.toLocaleString()}</div>
              </div>
            )}

            {/* PriceBot Deep Dive Summary */}
            {priceBotResult && (() => {
              const pb = typeof priceBotResult === "string" ? (() => { try { return JSON.parse(priceBotResult); } catch { return null; } })() : priceBotResult;
              if (!pb) return null;
              const revised = pb.revised_estimate || pb.price_overview || pb.price_validation;
              const rawComps = (pb.comparable_sales || []).slice(0, 8);
              const revisedMid = pb.price_validation?.revised_mid || revised?.mid || null;
              const filteredComps = revisedMid
                ? rawComps.filter((c: any) => {
                    const price = c.sold_price ?? c.price ?? 0;
                    return price > 0 && price < revisedMid * 5 && price > revisedMid * 0.1;
                  })
                : rawComps;
              const displayComps = filteredComps.slice(0, 3);
              const bestPlatform = (pb.platform_breakdown || []).sort((a: any, b: any) => (b.recommended_score || 0) - (a.recommended_score || 0))[0];
              const demand = pb.market_analysis?.demand_level || pb.demand_level;
              const demandColor = demand === "high" || demand === "Hot" || demand === "Strong" ? "#4caf50" : demand === "low" || demand === "Weak" || demand === "Dead" ? "#ef4444" : "#f59e0b";
              return (
                <div style={{ background: "rgba(0,188,212,0.04)", border: "1px solid rgba(0,188,212,0.15)", borderRadius: "0.65rem", padding: "0.7rem", marginTop: "0.25rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.5rem" }}>
                    <span style={{ fontSize: "0.85rem" }}>💰</span>
                    <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--accent)", textTransform: "uppercase", letterSpacing: "0.06em" }}>PriceBot Deep Dive</span>
                    {demand && <span style={{ marginLeft: "auto", padding: "0.1rem 0.45rem", borderRadius: "9999px", fontSize: "0.6rem", fontWeight: 600, background: `${demandColor}18`, color: demandColor, textTransform: "capitalize" }}>{demand} demand</span>}
                  </div>
                  {revised && (
                    <div style={{ display: "flex", alignItems: "baseline", gap: "0.4rem", marginBottom: "0.45rem" }}>
                      <span style={{ fontSize: "0.6rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Revised</span>
                      <span style={{ fontSize: "1rem", fontWeight: 800, color: "var(--accent)" }}>${revised.revised_low ?? revised.low ?? revised.mid ?? "—"} – ${revised.revised_high ?? revised.high ?? revised.mid ?? "—"}</span>
                    </div>
                  )}
                  {displayComps.length > 0 && (
                    <div style={{ display: "flex", gap: "0.35rem", marginBottom: "0.45rem", flexWrap: "wrap" }}>
                      {displayComps.map((c: any, i: number) => (
                        <div key={i} style={{ flex: "1 1 0", minWidth: 0, background: "var(--bg-card)", border: "1px solid var(--border-default)", borderRadius: "0.45rem", padding: "0.3rem 0.4rem", fontSize: "0.62rem" }}>
                          <div style={{ fontWeight: 700, color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>${c.sold_price ?? c.price ?? "?"}</div>
                          <div style={{ color: "var(--text-muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.platform || c.source || "—"}</div>
                        </div>
                      ))}
                    </div>
                  )}
                  {displayComps.length === 0 && rawComps.length > 0 && (
                    <div style={{ fontSize: "0.62rem", color: "#f59e0b", fontStyle: "italic", marginBottom: "0.35rem" }}>
                      Comparable sales had inconsistent pricing — run MegaBot for more accurate data
                    </div>
                  )}
                  {bestPlatform && (
                    <div style={{ fontSize: "0.65rem", color: "var(--text-secondary)", marginBottom: "0.35rem" }}>
                      Best platform: <span style={{ fontWeight: 700, color: "var(--accent)" }}>{bestPlatform.platform || bestPlatform.name}</span>
                      {bestPlatform.expected_price && <span> — est. ${bestPlatform.expected_price}</span>}
                    </div>
                  )}
                  <a href={`/bots/pricebot?item=${itemId}`} style={{ fontSize: "0.65rem", fontWeight: 600, color: "var(--accent)", textDecoration: "none" }}>
                    See full analysis →
                  </a>
                </div>
              );
            })()}
            </div>)}
          </div>
        ) : (
          /* Legacy fallback */
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--accent)" }}>${Math.round(v.low)} – ${Math.round(v.high)}</div>
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>Confidence: {Math.round(v.confidence * 100)}%</div>
          </div>
        )}

        {/* ── ENRICHMENT ADDITIONS (below pricing, above footer) ── */}
        {hasData && (() => {
          const TIER_NAMES: Record<number, string> = { 1: "Free", 2: "Starter", 3: "Plus", 4: "Pro" };
          const cRate = COMMISSION_RATES[userTier] ?? 0.12;
          const cPct = Math.round(cRate * 100);
          const tName = TIER_NAMES[userTier] ?? "Free";

          // ── ADDITION 1: Best net payout scenario ──
          // Priority: 1) Seller's listing price if set, 2) AI valuation mid
          // Shipping: respect shippingPreference — LOCAL_ONLY/customer pickup = $0
          const isLocalOnly = shippingPreference === "LOCAL_ONLY" || shippingPreference === "local_only";
          let salePrice = 0, shipCost = 0, isLocal = false, scenario = "";
          const realQuotedRate = quotedShippingRate ?? null;

          // Use listing price if set, otherwise use AI estimate
          const listPrice = sellerListingPrice ?? null;
          const useListingPrice = listPrice != null && listPrice > 0;

          if (isLocalOnly) {
            // Seller chose local pickup only — no shipping cost
            salePrice = useListingPrice ? listPrice : (pr ? (pr.localPrice?.mid ?? 0) : (v?.mid ?? Math.round((v?.low + v?.high) / 2)));
            isLocal = true;
            scenario = "Local pickup";
          } else if (pr) {
            const lm = pr.localPrice?.mid ?? 0, bm = pr.bestMarket?.mid ?? 0;
            const sc = realQuotedRate ?? pr.bestMarket?.shippingCost ?? pr.shippingEstimate ?? 25;
            const ln = lm - lm * cRate, sn = bm - bm * cRate - sc;
            if (sn > ln && bm > 0) {
              salePrice = useListingPrice ? listPrice : bm;
              shipCost = sc;
              scenario = useListingPrice ? `Ship to ${pr.bestMarket?.label ?? "best market"}` : `Ship to ${pr.bestMarket?.label ?? "best market"}`;
            } else {
              salePrice = useListingPrice ? listPrice : lm;
              isLocal = true;
              scenario = "Local pickup";
            }
          } else if (v) {
            salePrice = useListingPrice ? listPrice : (v.mid ?? Math.round((v.low + v.high) / 2));
            isLocal = true; scenario = "Local sale";
          }

          // Override sale price with listing price if set (always takes priority for display)
          if (useListingPrice && salePrice !== listPrice) salePrice = listPrice;
          const comm = Math.round(salePrice * cRate * 100) / 100;
          const sellerProcessingFee = Math.round(salePrice * 0.0175 * 100) / 100;
          const net = Math.round((salePrice - shipCost - comm - sellerProcessingFee) * 100) / 100;

          // ── Parse PriceBot result ──
          const pb = priceBotResult ? (typeof priceBotResult === "string" ? (() => { try { return JSON.parse(priceBotResult); } catch { return null; } })() : priceBotResult) : null;

          // ── ADDITION 2: Market snapshot values ──
          const conf = v?.confidence != null ? (v.confidence > 1 ? Math.round(v.confidence) : Math.round(v.confidence * 100)) : null;
          const pbDemand = pb?.market_analysis?.demand_level || pb?.demand_level;
          const demand = pbDemand || (conf != null ? (conf >= 80 ? "Strong" : conf >= 60 ? "Moderate" : "Uncertain") : null);
          const dColor = demand ? (/strong|high/i.test(demand) ? "#4ade80" : /low|uncertain|weak/i.test(demand) ? "#ef4444" : "#f59e0b") : "#f59e0b";

          const itemCat = (aiData?.category || "").toLowerCase();
          const pbDays = pb?.platform_breakdown?.[0]?.avg_days_to_sell;
          const sellsIn = pbDays ? `~${pbDays} days`
            : /electronics|tech/i.test(itemCat) ? "3–7 days"
            : /furniture/i.test(itemCat) ? "7–14 days"
            : /art|painting/i.test(itemCat) ? "14–30 days"
            : /collectible|antique/i.test(itemCat) ? "7–21 days"
            : "5–10 days";

          // ── ADDITION 3: Platform recommendations ──
          const pbPlats = pb?.platform_breakdown
            ? [...pb.platform_breakdown].sort((a: any, b: any) => (b.seller_net ?? b.expected_price ?? 0) - (a.seller_net ?? a.expected_price ?? 0)).slice(0, 3)
            : null;
          const aiPlats: string[] | null = aiData?.listing_suggestions?.best_platforms?.slice(0, 3) ?? null;

          // ── ADDITION 4 & 5: Condition + rarity ──
          const cScore = aiData?.condition_score;
          const cCos = aiData?.condition_cosmetic;
          const cFun = aiData?.condition_functional;
          const rarity = pb?.rarity_assessment?.rarity_level || pb?.rarity_level;
          const collector = pb?.rarity_assessment?.collector_interest || pb?.collector_interest;

          return (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.65rem", marginTop: "0.75rem" }}>

              {/* ═══ ADDITION 1 — Seller Net Breakdown ═══ */}
              {salePrice > 0 && (<>
                <AccordionHeader id="price-value" icon="💰" title="NET PAYOUT" subtitle={`$${Math.round(net)}`} isOpen={priceOpenSections.has("price-value")} onToggle={togglePriceSection} accentColor="#00bcd4" />
                {priceOpenSections.has("price-value") && (
                <div style={{ padding: "0.35rem 0" }}>
                <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-default)", borderRadius: "0.6rem", padding: "0.75rem" }}>
                  <div style={{ fontSize: "0.6rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.45rem" }}>💵 Your Best Net Payout</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.2rem", fontSize: "0.72rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", color: "var(--text-secondary)" }}>
                      <span>Sale price ({scenario})</span>
                      <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>${salePrice.toFixed(2)}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", color: "var(--text-secondary)" }}>
                      <span style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                        Shipping
                        {!isLocal && realQuotedRate != null && (
                          <span style={{ fontSize: "0.55rem", padding: "1px 5px", borderRadius: 99, background: "rgba(76,175,80,0.1)", color: "#4caf50", fontWeight: 600 }}>
                            Quoted
                          </span>
                        )}
                        {!isLocal && realQuotedRate == null && (
                          <span style={{ fontSize: "0.55rem", padding: "1px 5px", borderRadius: 99, background: "rgba(245,158,11,0.1)", color: "#f59e0b", fontWeight: 600 }}>
                            Est.
                          </span>
                        )}
                      </span>
                      <span style={{ color: isLocal ? "#4ade80" : "#ef4444" }}>{isLocal ? "$0.00 local pickup" : `-$${shipCost.toFixed(2)}`}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", color: "var(--text-secondary)" }}>
                      <span>Commission ({cPct}% {tName})</span>
                      <span style={{ color: "#ef4444" }}>-${comm.toFixed(2)}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", color: "var(--text-secondary)" }}>
                      <span>Processing fee ({PROCESSING_FEE.sellerDisplay})</span>
                      <span style={{ color: "#ef4444" }}>-${sellerProcessingFee.toFixed(2)}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", color: "var(--text-secondary)", fontSize: "0.65rem", opacity: 0.7 }}>
                      <span>Buyer also pays {PROCESSING_FEE.buyerDisplay}</span>
                      <span>+${(Math.round(salePrice * 0.0175 * 100) / 100).toFixed(2)}</span>
                    </div>
                    <div style={{ borderTop: "1px solid var(--border-default)", marginTop: "0.25rem", paddingTop: "0.35rem", display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                      <span style={{ fontWeight: 700, color: "var(--text-primary)", fontSize: "0.75rem" }}>You keep</span>
                      <span style={{ fontSize: "1.15rem", fontWeight: 800, color: "#4ade80" }}>${net.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
                </div>)}
              </>)}

              {/* ═══ ADDITION 2 — Quick Market Snapshot ═══ */}
              <AccordionHeader id="price-confidence" icon="📊" title="CONFIDENCE & DEMAND" subtitle={`${conf ?? "?"}% · ${demand || "—"}`} isOpen={priceOpenSections.has("price-confidence")} onToggle={togglePriceSection} />
              {priceOpenSections.has("price-confidence") && (
              <div style={{ padding: "0.35rem 0" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.4rem" }}>
                {conf != null && (
                  <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-default)", borderRadius: "0.5rem", padding: "0.45rem 0.5rem", textAlign: "center" }}>
                    <div style={{ fontSize: "0.5rem", color: "var(--text-muted)", marginBottom: "0.15rem" }}>📊 Confidence</div>
                    <div style={{ fontSize: "0.9rem", fontWeight: 700, color: conf >= 80 ? "#4ade80" : conf >= 60 ? "#f59e0b" : "#ef4444" }}>{conf}%</div>
                    <div style={{ marginTop: "0.2rem", height: "3px", borderRadius: "2px", background: "var(--ghost-bg)", overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${Math.min(conf, 100)}%`, borderRadius: "2px", background: conf >= 80 ? "#4ade80" : conf >= 60 ? "#f59e0b" : "#ef4444" }} />
                    </div>
                  </div>
                )}
                {demand && (
                  <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-default)", borderRadius: "0.5rem", padding: "0.45rem 0.5rem", textAlign: "center" }}>
                    <div style={{ fontSize: "0.5rem", color: "var(--text-muted)", marginBottom: "0.15rem" }}>📈 Demand</div>
                    <div style={{ fontSize: "0.9rem", fontWeight: 700, color: dColor, textTransform: "capitalize" }}>{demand}</div>
                  </div>
                )}
                <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-default)", borderRadius: "0.5rem", padding: "0.45rem 0.5rem", textAlign: "center" }}>
                  <div style={{ fontSize: "0.5rem", color: "var(--text-muted)", marginBottom: "0.15rem" }}>⏱️ Sells in</div>
                  <div style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--accent)" }}>{sellsIn}</div>
                </div>
              </div>
              </div>)}

              {/* ═══ ADDITION 3 — Where to Sell ═══ */}
              <AccordionHeader id="price-platforms" icon="🏪" title="BEST PLACES TO SELL" isOpen={priceOpenSections.has("price-platforms")} onToggle={togglePriceSection} />
              {priceOpenSections.has("price-platforms") && (
              <div style={{ padding: "0.35rem 0" }}>
              <div>
                <div style={{ fontSize: "0.6rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.3rem" }}>🏪 Best Places to Sell</div>
                <div style={{ display: "flex", gap: "0.3rem", flexWrap: "wrap" }}>
                  {pbPlats ? pbPlats.map((p: any, i: number) => (
                    <span key={i} style={{ padding: "0.2rem 0.55rem", borderRadius: "9999px", fontSize: "0.65rem", fontWeight: 600, background: i === 0 ? "rgba(0,188,212,0.12)" : "var(--ghost-bg)", border: `1px solid ${i === 0 ? "rgba(0,188,212,0.25)" : "var(--border-default)"}`, color: i === 0 ? "var(--accent)" : "var(--text-secondary)" }}>
                      {p.platform || p.name}{p.seller_net != null ? ` ~$${Math.round(p.seller_net)}` : p.expected_price != null ? ` ~$${Math.round(p.expected_price)}` : ""}
                    </span>
                  )) : aiPlats ? aiPlats.map((name: string, i: number) => (
                    <span key={i} style={{ padding: "0.2rem 0.55rem", borderRadius: "9999px", fontSize: "0.65rem", fontWeight: 600, background: i === 0 ? "rgba(0,188,212,0.12)" : "var(--ghost-bg)", border: `1px solid ${i === 0 ? "rgba(0,188,212,0.25)" : "var(--border-default)"}`, color: i === 0 ? "var(--accent)" : "var(--text-secondary)" }}>
                      {name}
                    </span>
                  )) : (
                    <span style={{ fontSize: "0.65rem", color: "var(--text-muted)", fontStyle: "italic" }}>Run PriceBot for platform recommendations</span>
                  )}
                </div>
                {aiPlats && !pbPlats && (
                  <div style={{ fontSize: "0.55rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>Run PriceBot for platform-specific pricing</div>
                )}
              </div>
              </div>)}

              {/* ═══ ADDITION 4 — Condition Impact ═══ */}
              {cScore != null && (
                <div style={{ fontSize: "0.7rem", color: "var(--text-secondary)", lineHeight: 1.5, padding: "0 0.1rem" }}>
                  {cScore >= 8 ? "✅ Excellent condition adds value — priced at the high end"
                    : cScore >= 5 ? "👍 Good condition — priced at fair market value"
                    : cScore >= 3 ? "⚠️ Fair condition — price reflects visible wear"
                    : "⚠️ Poor condition — significantly affects resale value"}
                  {(cCos != null || cFun != null) && (
                    <span style={{ fontSize: "0.6rem", color: "var(--text-muted)", marginLeft: "0.3rem" }}>
                      ({cCos != null ? `Cosmetic: ${cCos}/10` : ""}{cCos != null && cFun != null ? " · " : ""}{cFun != null ? `Functional: ${cFun}/10` : ""})
                    </span>
                  )}
                </div>
              )}

              {/* ═══ ADDITION 5 — Antique / Rarity Note ═══ */}
              {(antique?.isAntique || (rarity && /rare|very rare|extremely rare|unique/i.test(rarity)) || collector) && (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.2rem", padding: "0 0.1rem" }}>
                  {antique?.isAntique && (
                    <div style={{ fontSize: "0.68rem", color: "#fbbf24", lineHeight: 1.45 }}>🏛️ Antique item — may appreciate in value. Consider professional appraisal for insurance.</div>
                  )}
                  {rarity && /rare|very rare|extremely rare|unique/i.test(rarity) && (
                    <div style={{ fontSize: "0.68rem", color: "#a78bfa", lineHeight: 1.45 }}>💎 {rarity} item — rarity adds premium value</div>
                  )}
                  {collector && (
                    <div style={{ fontSize: "0.68rem", color: "var(--accent)", lineHeight: 1.45 }}>🔍 Active collector community — specialized platforms may yield higher prices</div>
                  )}
                </div>
              )}
            </div>
          );
        })()}
      </div>

      {/* ═══ MEGABOT DEEP PRICING — premium positioned after enrichment ═══ */}
      {boosted && boostResult && (() => {
        const mbProviders = (boostResult.providers || []).filter((p: any) => (p.data || p.result) && !p.error);
        const mbAgreement = Math.round((boostResult.agreementScore ?? 0) > 1 ? boostResult.agreementScore : (boostResult.agreementScore ?? 0) * 100);
        const mbTimestamp = boostResult.timestamp ? new Date(boostResult.timestamp) : null;
        const mbAge = mbTimestamp ? Math.round((Date.now() - mbTimestamp.getTime()) / 3600000) : null;
        const mbAgeLabel = mbAge != null ? (mbAge < 1 ? "Just now" : mbAge < 24 ? `${mbAge}h ago` : `${Math.round(mbAge / 24)}d ago`) : null;

        // Extract per-agent prices for comparison table
        const agentPrices: { provider: string; icon: string; color: string; low: number | null; high: number | null; mid: number | null; platform: string | null }[] = [];
        const META: Record<string, { icon: string; color: string }> = { openai: { icon: "🤖", color: "#10a37f" }, claude: { icon: "🧠", color: "#d97706" }, gemini: { icon: "🔮", color: "#4285f4" }, grok: { icon: "🌀", color: "#00DC82" } };
        for (const p of mbProviders) {
          const d = p.data || p.result || {};
          const pv = (d && typeof d === "object" && d.price_validation) ? d.price_validation : d;
          const m = META[p.provider] || { icon: "🤖", color: "#888" };
          agentPrices.push({
            provider: p.provider, icon: m.icon, color: m.color,
            low: pv?.revised_low ?? d?.estimated_value_low ?? null,
            high: pv?.revised_high ?? d?.estimated_value_high ?? null,
            mid: pv?.revised_mid ?? d?.estimated_value_mid ?? null,
            platform: (() => { const pp = d?.platform_pricing; if (!pp || typeof pp !== "object") return null; return pp.best_platform || Object.keys(pp).filter(k => k !== "best_platform")[0] || null; })(),
          });
        }
        // Consensus price from all agents
        const allLows = agentPrices.map(a => a.low).filter((n): n is number => n != null);
        const allHighs = agentPrices.map(a => a.high).filter((n): n is number => n != null);
        const consensusLow = allLows.length > 0 ? Math.round(allLows.reduce((s, n) => s + n, 0) / allLows.length) : null;
        const consensusHigh = allHighs.length > 0 ? Math.round(allHighs.reduce((s, n) => s + n, 0) / allHighs.length) : null;

        return (
          <div style={{ margin: "0 1.25rem 0.5rem", background: "linear-gradient(135deg, rgba(139,92,246,0.06), rgba(0,188,212,0.03))", border: "1px solid rgba(139,92,246,0.2)", borderRadius: "0.75rem", overflow: "hidden" }}>
            {/* Header bar */}
            <button
              onClick={() => togglePriceSection("megabot-results")}
              style={{ width: "100%", display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.65rem 0.85rem", background: "transparent", border: "none", cursor: "pointer", borderBottom: priceOpenSections.has("megabot-results") ? "1px solid rgba(139,92,246,0.12)" : "none" }}
            >
              <span style={{ fontSize: "0.85rem" }}>⚡</span>
              <span style={{ fontSize: "0.68rem", fontWeight: 800, color: "#a855f7", textTransform: "uppercase" as const, letterSpacing: "0.06em" }}>MegaBot Deep Pricing</span>
              <span style={{ fontSize: "0.6rem", fontWeight: 700, color: mbAgreement >= 80 ? "#4caf50" : mbAgreement >= 60 ? "#ff9800" : "#ef4444" }}>{mbAgreement}%</span>
              <span style={{ fontSize: "0.55rem", padding: "2px 8px", borderRadius: "9999px", background: "rgba(139,92,246,0.12)", color: "#a855f7", fontWeight: 700 }}>{mbProviders.length} AI</span>
              {mbAgeLabel && <span style={{ fontSize: "0.52rem", color: "var(--text-muted)", marginLeft: "auto" }}>{mbAgeLabel}</span>}
              <span style={{ fontSize: "0.6rem", color: "var(--text-muted)", transition: "transform 0.2s", transform: priceOpenSections.has("megabot-results") ? "rotate(180deg)" : "none" }}>▾</span>
            </button>

            {priceOpenSections.has("megabot-results") && (
              <div style={{ padding: "0.65rem 0.85rem" }}>
                {/* Consensus price banner */}
                {consensusLow != null && consensusHigh != null && (
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", padding: "0.5rem 0.75rem", marginBottom: "0.65rem", background: "linear-gradient(135deg, rgba(139,92,246,0.08), rgba(0,188,212,0.06))", borderRadius: "0.5rem", border: "1px solid rgba(139,92,246,0.15)" }}>
                    <span style={{ fontSize: "0.55rem", fontWeight: 700, color: "#a855f7", textTransform: "uppercase" as const, letterSpacing: "0.06em" }}>Consensus</span>
                    <span style={{ fontSize: "1.3rem", fontWeight: 800, color: "#a855f7" }}>${consensusLow}</span>
                    <span style={{ color: "var(--text-muted)" }}>—</span>
                    <span style={{ fontSize: "1.3rem", fontWeight: 800, color: "#a855f7" }}>${consensusHigh}</span>
                    <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "0.25rem" }}>
                      <div style={{ width: "32px", height: "4px", borderRadius: "2px", background: "var(--ghost-bg)", overflow: "hidden" }}>
                        <div style={{ width: `${mbAgreement}%`, height: "100%", borderRadius: "2px", background: mbAgreement >= 80 ? "#4caf50" : mbAgreement >= 60 ? "#ff9800" : "#ef4444" }} />
                      </div>
                      <span style={{ fontSize: "0.55rem", fontWeight: 700, color: mbAgreement >= 80 ? "#4caf50" : mbAgreement >= 60 ? "#ff9800" : "#ef4444" }}>{mbAgreement >= 80 ? "Strong" : mbAgreement >= 60 ? "Moderate" : "Mixed"}</span>
                    </div>
                  </div>
                )}

                {/* Per-agent price comparison — compact grid */}
                {agentPrices.length > 0 && (
                  <div style={{ display: "grid", gridTemplateColumns: agentPrices.length <= 2 ? "1fr" : "1fr 1fr", gap: "0.35rem", marginBottom: "0.65rem" }}>
                    {agentPrices.map((ap) => (
                      <div key={ap.provider} style={{ display: "flex", alignItems: "center", gap: "0.35rem", padding: "0.4rem 0.5rem", background: "var(--bg-card)", borderRadius: "0.45rem", border: "1px solid var(--border-default)", borderLeft: `3px solid ${ap.color}` }}>
                        <span style={{ fontSize: "0.7rem", flexShrink: 0 }}>{ap.icon}</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: "0.58rem", fontWeight: 700, color: ap.color }}>{ap.provider === "openai" ? "OpenAI" : ap.provider === "claude" ? "Claude" : ap.provider === "gemini" ? "Gemini" : "Grok"}</div>
                          <div style={{ fontSize: "0.82rem", fontWeight: 800, color: "var(--text-primary)" }}>
                            {ap.low != null && ap.high != null ? `$${ap.low}–$${ap.high}` : ap.mid != null ? `$${Math.round(ap.mid)}` : "—"}
                          </div>
                        </div>
                        {ap.platform && <span style={{ fontSize: "0.48rem", color: "var(--text-muted)", fontWeight: 500, textAlign: "right" as const, maxWidth: "60px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>{String(ap.platform).replace(/_/g, " ")}</span>}
                      </div>
                    ))}
                  </div>
                )}

                {/* Quick summary line */}
                {(() => {
                  const firstD = mbProviders[0]?.data || mbProviders[0]?.result || {};
                  const demand = firstD?.market_analysis?.demand_level;
                  const totalComps = mbProviders.reduce((sum: number, p: any) => { const d = p.data || p.result || {}; return sum + (Array.isArray(d?.comparable_sales) ? d.comparable_sales.length : 0); }, 0);
                  const ng = firstD?.negotiation_guide;
                  const parts: string[] = [];
                  if (demand) parts.push(`Demand: ${demand}.`);
                  if (totalComps > 0) parts.push(`${totalComps} comps found.`);
                  if (ng?.list_price && ng?.minimum_accept) parts.push(`List $${Math.round(Number(ng.list_price))}, floor $${Math.round(Number(ng.minimum_accept))}.`);
                  if (parts.length === 0) return null;
                  return (
                    <div style={{ padding: "0.4rem 0.5rem", marginBottom: "0.5rem", background: "rgba(139,92,246,0.04)", borderRadius: "0.35rem", borderLeft: "3px solid #a855f7", fontSize: "0.68rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>
                      {parts.join(" ")}
                    </div>
                  );
                })()}

                {/* Full deep analysis — expandable */}
                <MegaBotBoostResults botType="pricing" result={boostResult} aiData={aiData} />
              </div>
            )}
          </div>
        );
      })()}

      {/* Amazon trust seal — self-fetching */}
      <div style={{ display: "flex", justifyContent: "center", padding: "0.6rem 0 0.3rem" }}>
        <AmazonPriceBadge itemId={itemId} />
      </div>

      <PanelFooter botName="PriceBot" botLink="/bots/pricebot" itemId={itemId} botIcon="💰" botCost={1} onBotRun={hasData ? onPriceBotRun : undefined} onSuperBoost={hasData ? onSuperBoost : undefined} boosting={boosting} boosted={boosted} hasResult={!!priceBotResult} />
      </div>
    </GlassCard>
  );
}

/* ═══════════════════════════════════════════
   PANEL 3: Shipping (FREE — auto-populates)
   ═══════════════════════════════════════════ */

function ShippingEstimatesPanel({ itemId, aiData, saleZip, valuation, status, category, onSuperBoost, boosting, boosted, boostResult, collapsed, onToggle, shippingData }: {
  itemId: string;
  aiData: any;
  saleZip: string | null;
  valuation: any;
  status: string;
  category: string;
  onSuperBoost: () => void;
  boosting: boolean;
  boosted: boolean;
  boostResult: any;
  collapsed?: boolean;
  onToggle?: () => void;
  shippingData?: Props["shippingData"];
}) {
  const hasAnalysis = !!aiData;
  const [shipSections, setShipSections] = useState<Set<string>>(new Set(["megabot-results"]));
  const toggleShipSection = (id: string) => { setShipSections(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; }); };

  // Compute package suggestion from AI data (including AI weight + shipping notes)
  const suggestion = useMemo(() => {
    if (!aiData) return null;
    // Build dimension string from whichever AI field has the data
    const dimString = aiData.dimensions_estimate
      || aiData.dimensions
      || (aiData.shipping_profile
        ? `${aiData.shipping_profile.length} x ${aiData.shipping_profile.width} x ${aiData.shipping_profile.height}`
        : null);
    return suggestPackage(
      aiData.category || category || null,
      dimString,
      aiData.material || null,
      aiData.weight_estimate_lbs || null,
      aiData.shipping_notes || null,
    );
  }, [aiData, category]);

  // Compute shipping method recommendation
  const shippingMethod = useMemo(() => {
    if (!aiData) return undefined;
    const maxDim = suggestion ? Math.max(suggestion.length, suggestion.width, suggestion.height) : undefined;
    return suggestShippingMethod(
      aiData.category || category,
      suggestion?.weightEstimate,
      maxDim,
      undefined,
      aiData?.shipping_difficulty ?? undefined,
    );
  }, [aiData, category, suggestion]);

  // Metro estimates for pre-sale preview
  const metroEstimates = useMemo(() => {
    const weight = suggestion?.weightEstimate ?? 5;
    const rawMetros = getMetroEstimates(saleZip, weight);
    // Add realistic weight + distance variation
    return rawMetros.map(m => ({
      ...m,
      estimatedCost: Math.round(
        (m.estimatedCost + (weight * 0.5) + ((m.estimatedDays ?? 3) * 1.5)) * 100
      ) / 100,
    }));
  }, [saleZip, suggestion]);

  // Determine mode based on item status
  const POST_SALE_STATUSES = ["SOLD", "SHIPPED", "COMPLETED"];
  const mode = POST_SALE_STATUSES.includes(status) ? "post-sale" as const : "pre-sale" as const;

  // Item value for insurance
  const itemValue = valuation?.mid ?? valuation?.high ?? null;

  return (
    <GlassCard>
      <PanelHeader icon="🚚" title="Shipping Estimates" hasData={hasAnalysis} collapsed={collapsed} onToggle={onToggle}
        preview={hasAnalysis ? `${suggestion?.label || "Package ready"} · ${suggestion?.weightEstimate ? suggestion.weightEstimate + " lbs" : ""}` : "Awaiting analysis"}
      />

      {collapsed && hasAnalysis && <CollapsedSummary botType="shipping" data={{ method: suggestion?.label || shippingMethod || "—", weight: suggestion?.weightEstimate ? `${suggestion.weightEstimate} lbs` : null, difficulty: suggestion ? (suggestion.isFragile ? "Fragile" : suggestion.boxSize === "freight" || suggestion.boxSize === "furniture" || suggestion.boxSize === "oversized" ? "Heavy" : "Standard") : null, dims: suggestion ? `${suggestion.length}×${suggestion.width}×${suggestion.height}"` : null }} buttons={<>
        <a href="/shipping" style={{ padding: "0.3rem 0.65rem", fontSize: "0.62rem", fontWeight: 600, borderRadius: "0.4rem", border: "1px solid rgba(0,188,212,0.3)", color: "#00bcd4", textDecoration: "none", display: "inline-flex", alignItems: "center", minHeight: "32px" }}>Open Shipping →</a>
      </>} />}
      {collapsed && !hasAnalysis && (
        <div style={{ padding: "0.65rem 0.85rem", display: "flex", alignItems: "center", gap: "0.65rem" }}>
          <span style={{ fontSize: "1.3rem" }}>📦</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-primary)" }}>Shipping Estimates</div>
            <div style={{ fontSize: "0.62rem", color: "var(--text-muted)", lineHeight: 1.4 }}>Carrier rates, package suggestions, and metro estimates</div>
          </div>
          <div style={{ display: "flex", gap: "0.3rem", flexShrink: 0 }}>
            <a href="/shipping" style={{ padding: "0.3rem 0.65rem", fontSize: "0.62rem", fontWeight: 600, borderRadius: "0.4rem", border: "1px solid rgba(0,188,212,0.3)", color: "#00bcd4", textDecoration: "none", display: "inline-flex", alignItems: "center", minHeight: "32px" }}>Open Shipping →</a>
          </div>
        </div>
      )}

      <div style={{ display: collapsed ? "none" : "flex", flexDirection: "column" as const, flex: 1 }}>
      <div style={{ padding: "0.75rem 1.25rem 1.25rem" }}>
        {!hasAnalysis ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", flex: 1, justifyContent: "center", padding: "1.25rem", gap: "0.5rem" }}>
            <span style={{ fontSize: "1.5rem" }}>📦</span>
            <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--text-primary)" }}>Shipping Estimates</div>
            <p style={{ fontSize: "0.68rem", color: "var(--text-secondary)", lineHeight: 1.5, maxWidth: 300, margin: 0 }}>Carrier rates, AI package suggestions, and delivery estimates to major metros.</p>
            <div style={{ width: "100%", maxWidth: 300, padding: "0.5rem 0.65rem", background: "var(--ghost-bg)", borderRadius: "0.5rem", border: "1px solid var(--border-default)", textAlign: "left" }}>
              <div style={{ fontSize: "0.55rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.25rem" }}>What You&apos;ll Get</div>
              {[{ icon: "📦", text: "AI package size + weight" }, { icon: "🚚", text: "Carrier rate comparison" }, { icon: "🏙️", text: "Metro delivery estimates" }].map((b, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.3rem", padding: "0.15rem 0", fontSize: "0.62rem", color: "var(--text-secondary)" }}><span style={{ fontSize: "0.6rem", flexShrink: 0 }}>{b.icon}</span><span>{b.text}</span></div>
              ))}
            </div>
            <div style={{ display: "flex", gap: "0.4rem", justifyContent: "center", flexWrap: "wrap", marginTop: "0.5rem", paddingTop: "0.4rem", borderTop: "1px solid var(--border-default)", width: "100%" }}>
              <a href="/shipping" style={{ padding: "0.3rem 0.65rem", fontSize: "0.62rem", fontWeight: 600, borderRadius: "0.4rem", border: "1px solid rgba(0,188,212,0.3)", color: "#00bcd4", textDecoration: "none", display: "inline-flex", alignItems: "center", minHeight: "32px" }}>Open Shipping →</a>
            </div>
          </div>
        ) : (
          <>
          {/* AI Shipping Recommendation Card */}
          {shippingMethod && shippingData?.aiShippingDifficulty && (
            <div style={{
              background: shippingMethod === "local_only" ? "rgba(255,152,0,0.06)"
                : shippingMethod === "freight" ? "rgba(156,39,176,0.06)" : "rgba(0,188,212,0.06)",
              border: `1px solid ${shippingMethod === "local_only" ? "rgba(255,152,0,0.2)"
                : shippingMethod === "freight" ? "rgba(156,39,176,0.2)" : "rgba(0,188,212,0.2)"}`,
              borderRadius: "12px",
              padding: "0.75rem 1rem",
              marginBottom: "0.75rem",
            }}>
              <div style={{
                display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem",
              }}>
                <span style={{ fontSize: "1.1rem" }}>
                  {shippingMethod === "local_only" ? "🤝" : shippingMethod === "freight" ? "🚛" : "📦"}
                </span>
                <span style={{
                  fontSize: "0.7rem", fontWeight: 700,
                  color: shippingMethod === "local_only" ? "#ff9800"
                       : shippingMethod === "freight" ? "#9c27b0" : "#00bcd4",
                }}>
                  AI RECOMMENDATION: {shippingMethod === "local_only" ? "LOCAL PICKUP"
                    : shippingMethod === "freight" ? "FREIGHT / LTL SHIPPING"
                    : "STANDARD PARCEL SHIPPING"}
                </span>
              </div>

              <div style={{
                fontSize: "0.6rem", color: "var(--text-secondary, #94a3b8)",
                lineHeight: 1.5, marginBottom: "0.4rem",
              }}>
                {shippingMethod === "local_only" && (
                  <>This item is best handled through <strong style={{ color: "var(--text-primary, #e2e8f0)" }}>local pickup</strong>. Too large, heavy, or specialized for standard carriers. Coordinate a buyer meetup or arrange local delivery.</>
                )}
                {shippingMethod === "freight" && (
                  <>This item requires <strong style={{ color: "var(--text-primary, #e2e8f0)" }}>freight / LTL shipping</strong>. Too large for parcel carriers but shippable via freight truck. Offer local pickup as an alternative.</>
                )}
                {shippingMethod === "parcel" && (
                  <>Ships via <strong style={{ color: "var(--text-primary, #e2e8f0)" }}>standard parcel carriers</strong> (USPS, UPS, FedEx). Compare rates below to find the best option.</>
                )}
              </div>

              {/* Vehicle → CarBot link */}
              {shippingMethod === "local_only" && (
                <div style={{
                  padding: "0.5rem 0.75rem", marginBottom: "0.5rem",
                  background: "rgba(0,188,212,0.04)",
                  border: "1px solid rgba(0,188,212,0.15)",
                  borderRadius: "0.4rem",
                  display: "flex", alignItems: "center", gap: "0.5rem",
                }}>
                  <span style={{ fontSize: "0.85rem" }}>🚗</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "0.68rem", fontWeight: 700, color: "var(--text-primary)" }}>Vehicle Detected — Use CarBot</div>
                    <div style={{ fontSize: "0.6rem", color: "var(--text-muted)" }}>CarBot provides VIN decode, condition grading, pricing, and local pickup planning.</div>
                  </div>
                  <a href={`/bots/carbot?item=${itemId}`} style={{
                    padding: "0.3rem 0.65rem", fontSize: "0.62rem", fontWeight: 600,
                    borderRadius: "0.4rem", border: "none",
                    background: "linear-gradient(135deg, #00bcd4, #009688)",
                    color: "#fff", textDecoration: "none",
                    display: "inline-flex", alignItems: "center", minHeight: "32px",
                  }}>
                    Open CarBot →
                  </a>
                </div>
              )}

              {/* AI details chips */}
              <div style={{
                display: "flex", gap: "0.75rem", flexWrap: "wrap", marginTop: "0.4rem",
              }}>
                {shippingData.aiWeightLbs != null && (
                  <span style={{
                    fontSize: "0.52rem", padding: "2px 8px", borderRadius: "6px",
                    background: "rgba(0,188,212,0.08)", color: "var(--text-secondary, #94a3b8)",
                  }}>
                    ⚖️ AI Est: {shippingData.aiWeightLbs} lbs
                  </span>
                )}
                <span style={{
                  fontSize: "0.52rem", padding: "2px 8px", borderRadius: "6px",
                  background: shippingData.aiShippingDifficulty === "Easy" ? "rgba(76,175,80,0.1)"
                             : shippingData.aiShippingDifficulty === "Moderate" ? "rgba(255,152,0,0.1)"
                             : "rgba(244,67,54,0.1)",
                  color: shippingData.aiShippingDifficulty === "Easy" ? "#4caf50"
                        : shippingData.aiShippingDifficulty === "Moderate" ? "#ff9800" : "#f44336",
                }}>
                  {shippingData.aiShippingDifficulty === "Easy" ? "✅" : shippingData.aiShippingDifficulty === "Moderate" ? "⚠️" : "🔴"} {shippingData.aiShippingDifficulty}
                </span>
                {shippingData.aiShippingConfidence != null && (
                  <span style={{
                    fontSize: "0.52rem", padding: "2px 8px", borderRadius: "6px",
                    background: "rgba(0,188,212,0.08)", color: "var(--text-secondary, #94a3b8)",
                  }}>
                    🎯 Confidence: {Math.round(shippingData.aiShippingConfidence * 100)}%
                  </span>
                )}
              </div>

              {/* AI shipping notes */}
              {shippingData.aiShippingNotes && (
                <div style={{
                  marginTop: "0.5rem", padding: "0.4rem 0.6rem",
                  background: "rgba(0,0,0,0.15)", borderRadius: "8px",
                  fontSize: "0.55rem", color: "var(--text-secondary, #94a3b8)",
                  fontStyle: "italic", lineHeight: 1.4,
                }}>
                  💡 {shippingData.aiShippingNotes}
                </div>
              )}
            </div>
          )}

          <RealShippingPanel
            itemId={itemId}
            mode={mode}
            fromZip={saleZip}
            suggestion={suggestion}
            metroEstimates={metroEstimates}
            savedShipping={{
              weight: shippingData?.weight ?? null,
              length: shippingData?.length ?? null,
              width: shippingData?.width ?? null,
              height: shippingData?.height ?? null,
              isFragile: shippingData?.isFragile ?? false,
              preference: shippingData?.preference || "BUYER_PAYS",
            }}
            itemStatus={status}
            existingLabel={null}
            itemValue={itemValue}
            shippingMethod={shippingMethod}
            saleRadius={25}
          />
          </>
        )}

        {boosted && boostResult && (<>
          <AccordionHeader id="megabot-results" icon="⚡" title="MEGABOT MULTI-AI ANALYSIS" subtitle={`${boostResult.agreementScore ?? "?"}% Agreement`} isOpen={shipSections.has("megabot-results")} onToggle={toggleShipSection} accentColor="#8b5cf6" badge={`${(boostResult.providers || []).filter((p: any) => p.data || !p.error).length} AI`} />
          {shipSections.has("megabot-results") && <MegaBotBoostResults botType="shipping" result={boostResult} aiData={aiData} />}
        </>)}
      </div>

      <PanelFooter botName="Shipping Center" botLink="/shipping" itemId={itemId} />
      </div>
    </GlassCard>
  );
}

/* ═══════════════════════════════════════════
   PANEL 4: Photo Quality (FREE — auto-populates)
   ═══════════════════════════════════════════ */

function PhotoQualityPanel({ photos, aiData, itemId, onSuperBoost, boosting, boosted, boostResult, collapsed, onToggle }: {
  photos: Props["photos"];
  aiData: any;
  itemId: string;
  onSuperBoost: () => void;
  boosting: boolean;
  boosted: boolean;
  boostResult: any;
  collapsed?: boolean;
  onToggle?: () => void;
}) {
  const hasAnalysis = !!aiData;
  const photoCount = photos.length;
  const [photoSections, setPhotoSections] = useState<Set<string>>(new Set(["photo-score", "photo-enhance", "photo-editor", "megabot-results"]));
  const togglePhotoSection = (id: string) => { setPhotoSections(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; }); };

  // Enhancement studio state
  const [enhanceResult, setEnhanceResult] = useState<any>(null);
  const [enhanceLoading, setEnhanceLoading] = useState(false);
  const [enhanceError, setEnhanceError] = useState<string | null>(null);
  const [coverSet, setCoverSet] = useState<string | null>(null);
  const [variationLoading, setVariationLoading] = useState<string | null>(null);
  const [variationResults, setVariationResults] = useState<any[]>([]);
  const [autoGenTriggered, setAutoGenTriggered] = useState(false);

  // Photo Editor state
  const [editSelectedPhoto, setEditSelectedPhoto] = useState<string | null>(null);
  const [editResult, setEditResult] = useState<any>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Load existing enhance result + variations + edit results on mount
  useEffect(() => {
    fetch(`/api/photobot/enhance/${itemId}`).then((r) => r.json()).then((d) => {
      if (d.hasResult && d.result) setEnhanceResult(d.result);
      if (d.variations && d.variations.length > 0) setVariationResults(d.variations);
    }).catch(() => {});
    fetch(`/api/photobot/edit/${itemId}`).then((r) => r.json()).then((d) => {
      if (d.results && d.results.length > 0) setEditResult(d.results[0]);
    }).catch(() => {});
  }, [itemId]);

  // Full enhance: assess + edit + generate (Layer 2 — "Enhance Cover Photo · 2 cr")
  async function runEnhance() {
    setEnhanceLoading(true);
    setEnhanceError(null);
    try {
      const primaryPhoto = photos.find((p) => p.isPrimary) || photos[0];
      const res = await fetch(`/api/photobot/enhance/${itemId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photoId: primaryPhoto?.id }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.result) setEnhanceResult(data.result);
        else setEnhanceError("Enhancement returned no data.");
      } else {
        const err = await res.json().catch(() => null);
        setEnhanceError(err?.error || `Enhancement failed (${res.status})`);
      }
    } catch (e: any) {
      setEnhanceError(e?.message || "Network error");
    }
    setEnhanceLoading(false);
  }

  // Assessment only: scores only, no images (Layer 1 — "📷 PhotoBot · 1 cr")
  async function runAssessOnly() {
    setEnhanceLoading(true);
    setEnhanceError(null);
    try {
      const primaryPhoto = photos.find((p) => p.isPrimary) || photos[0];
      const res = await fetch(`/api/photobot/enhance/${itemId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photoId: primaryPhoto?.id, mode: "assess" }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.result) setEnhanceResult(data.result);
        else setEnhanceError("Assessment returned no data.");
      } else {
        const err = await res.json().catch(() => null);
        setEnhanceError(err?.error || `Assessment failed (${res.status})`);
      }
    } catch (e: any) {
      setEnhanceError(e?.message || "Network error");
    }
    setEnhanceLoading(false);
  }

  // Photo Editor: auto-clean selected photo
  async function runPhotoEdit() {
    if (!editSelectedPhoto) return;
    setEditLoading(true);
    setEditError(null);
    setEditResult(null);
    try {
      const res = await fetch(`/api/photobot/edit/${itemId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photoId: editSelectedPhoto }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.result) setEditResult(data.result);
        else setEditError("Photo edit returned no data.");
      } else {
        const err = await res.json().catch(() => null);
        const rawErr = err?.error || `Photo edit failed (${res.status})`;
        if (rawErr.includes("bounding box") || rawErr.includes("Vision could not")) {
          setEditError("Photo enhancement couldn't isolate the item. Try a photo with the item on a plain background.");
        } else if (rawErr.includes("Vision scan failed")) {
          setEditError("Our AI had trouble analyzing this photo. Try a clearer, well-lit photo or try again.");
        } else if (rawErr.includes("DALL-E") || rawErr.includes("Image edit failed")) {
          setEditError("The photo editor is temporarily unavailable. Please try again in a moment.");
        } else {
          setEditError(rawErr);
        }
      }
    } catch (e: any) {
      setEditError(e?.message || "Network error");
    }
    setEditLoading(false);
  }

  async function generateVariation(variation: any) {
    const vName = variation.variationName || variation.variation_name || "Variation";
    setVariationLoading(vName);
    try {
      const primaryPhoto = photos.find((p) => p.isPrimary) || photos[0];
      const res = await fetch(`/api/photobot/enhance/${itemId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          photoId: primaryPhoto?.id,
          dallePrompt: variation.dallePrompt || variation.dalle_prompt,
          editInstructions: variation.editInstructions || variation.edit_instructions,
          variationName: vName,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.result) {
          setVariationResults((prev) => [data.result, ...prev.filter((v: any) => v.variationName !== vName)]);
        }
      }
    } catch {}
    setVariationLoading(null);
  }

  // MegaBot enhancement variations extraction
  const megaVariations: any[] = [];
  const megaMissingShots: string[] = [];
  const megaProTips: string[] = [];
  const megaConditionDocs: string[] = [];
  if (boosted && boostResult) {
    const providers: any[] = Array.isArray(boostResult?.providers) ? boostResult.providers : [];
    const consensus = boostResult?.consensus || {};
    const vars = consensus.enhancementVariations || consensus.enhancement_variations;
    if (Array.isArray(vars)) megaVariations.push(...vars);
    if (megaVariations.length === 0) {
      for (const p of providers) {
        const d = p.data || {};
        const pv = d.enhancementVariations || d.enhancement_variations;
        if (Array.isArray(pv) && pv.length > 0) { megaVariations.push(...pv); break; }
      }
    }
    const shotSet = new Set<string>();
    for (const p of [consensus, ...providers.map((pr: any) => pr.data || {})]) {
      const shots = p.missingShots || p.missing_shots;
      if (Array.isArray(shots)) shots.forEach((s: string) => { if (!shotSet.has(s)) { shotSet.add(s); megaMissingShots.push(s); } });
    }
    const tipSet = new Set<string>();
    for (const p of [consensus, ...providers.map((pr: any) => pr.data || {})]) {
      const pt = p.professionalTips || p.professional_tips;
      if (Array.isArray(pt)) pt.forEach((t: string) => { if (!tipSet.has(t)) { tipSet.add(t); megaProTips.push(t); } });
    }
    const condSet = new Set<string>();
    for (const p of [consensus, ...providers.map((pr: any) => pr.data || {})]) {
      const cd = p.conditionDocumentation || p.condition_documentation;
      if (Array.isArray(cd)) cd.forEach((c: string) => { if (!condSet.has(c)) { condSet.add(c); megaConditionDocs.push(c); } });
    }
  }

  // Auto-generate 3 variations when MegaBot completes
  useEffect(() => {
    if (!boosted || !boostResult || autoGenTriggered || megaVariations.length === 0) return;
    setAutoGenTriggered(true);
    // Generate all 3 sequentially to avoid overwhelming the API
    (async () => {
      for (const v of megaVariations.slice(0, 3)) {
        await generateVariation(v);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boosted, boostResult]);

  async function setAsCover(photoUrl: string, label: string) {
    setCoverSet(null);
    try {
      const res = await fetch(`/api/items/update/${itemId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ coverPhotoUrl: photoUrl }),
      });
      if (res.ok) {
        setCoverSet(label);
        setTimeout(() => setCoverSet(null), 2000);
      }
    } catch {}
  }

  const tips: string[] = [];
  if (hasAnalysis) {
    if (photoCount < 3) tips.push("Add more photos — items with 3+ photos sell 40% faster");
    if (aiData.markings) tips.push("Take a close-up of maker marks or stamps");
    if (!photos.some((p) => p.caption?.toLowerCase().includes("bottom") || p.caption?.toLowerCase().includes("underside")))
      tips.push("Photograph the underside for authentication clues");
    if (aiData.condition_score != null && aiData.condition_score < 8)
      tips.push("Document any wear or damage for buyer transparency");
    if (tips.length < 3) tips.push("Use natural lighting for the most accurate colors");
    if (tips.length < 3) tips.push("Include a size reference object in one photo");
  }

  const qualityScore = hasAnalysis
    ? Math.min(10, Math.round(photoCount * 1.5 + (aiData.confidence > 0.8 ? 2 : aiData.confidence > 0.6 ? 1 : 0)))
    : null;

  const assess = enhanceResult?.assessment;
  const conditionDetails: string[] = assess?.conditionDetails || [];

  return (
    <GlassCard>
      <PanelHeader icon="📷" title="Photo Assessment" hasData={hasAnalysis} collapsed={collapsed} onToggle={onToggle}
        preview={hasAnalysis ? `${qualityScore}/10 quality · ${photoCount} photo${photoCount !== 1 ? "s" : ""}` : `${photoCount} photo${photoCount !== 1 ? "s" : ""} uploaded`}
      />

      {collapsed && hasAnalysis && <CollapsedSummary botType="photos" data={{ score: qualityScore, count: photoCount }} buttons={<>
        <button onClick={runAssessOnly} style={{ padding: "0.3rem 0.65rem", fontSize: "0.62rem", fontWeight: 600, borderRadius: "0.4rem", border: "1px solid var(--border-default)", background: "var(--ghost-bg)", color: "var(--text-secondary)", cursor: "pointer", minHeight: "32px" }}>{enhanceResult ? "🔄 Re-Run · 0.5 cr" : "📷 PhotoBot · 1 cr"}</button>
        {onSuperBoost && <button onClick={onSuperBoost} style={{ padding: "0.3rem 0.65rem", fontSize: "0.62rem", fontWeight: 600, borderRadius: "0.4rem", border: "none", background: "linear-gradient(135deg, #00bcd4, #009688)", color: "#fff", cursor: "pointer", minHeight: "32px" }}>{boosted ? "🔄 MegaBot Re-Run · 3 cr" : "⚡ MegaBot · 5 cr"}</button>}
        <a href={`/bots/photobot?item=${itemId}`} style={{ padding: "0.3rem 0.65rem", fontSize: "0.62rem", fontWeight: 600, borderRadius: "0.4rem", border: "1px solid rgba(0,188,212,0.3)", color: "#00bcd4", textDecoration: "none", display: "inline-flex", alignItems: "center", minHeight: "32px" }}>Open PhotoBot →</a>
      </>} />}
      {collapsed && !hasAnalysis && (
        <div style={{ padding: "0.65rem 0.85rem", display: "flex", alignItems: "center", gap: "0.65rem" }}>
          <span style={{ fontSize: "1.3rem" }}>📸</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-primary)" }}>Photo Assessment</div>
            <div style={{ fontSize: "0.62rem", color: "var(--text-muted)", lineHeight: 1.4 }}>Photo quality scoring and enhancement recommendations</div>
          </div>
          <div style={{ display: "flex", gap: "0.3rem", flexShrink: 0 }}>
            <button onClick={runAssessOnly} style={{ padding: "0.3rem 0.65rem", fontSize: "0.62rem", fontWeight: 600, borderRadius: "0.4rem", border: "1px solid var(--border-default)", background: "var(--ghost-bg)", color: "var(--text-secondary)", cursor: "pointer", minHeight: "32px" }}>📸 PhotoBot · 1 cr</button>
            <a href={`/bots/photobot?item=${itemId}`} style={{ padding: "0.3rem 0.65rem", fontSize: "0.62rem", fontWeight: 600, borderRadius: "0.4rem", border: "1px solid rgba(0,188,212,0.3)", color: "#00bcd4", textDecoration: "none", display: "inline-flex", alignItems: "center", minHeight: "32px" }}>Open PhotoBot →</a>
          </div>
        </div>
      )}

      <div style={{ display: collapsed ? "none" : "flex", flexDirection: "column" as const, flex: 1 }}>
      <div style={{ padding: "1.25rem" }}>
        {!hasAnalysis ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", flex: 1, justifyContent: "center", padding: "1.25rem", gap: "0.5rem" }}>
            <span style={{ fontSize: "1.5rem" }}>📸</span>
            <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--text-primary)" }}>Photo Assessment</div>
            <p style={{ fontSize: "0.68rem", color: "var(--text-secondary)", lineHeight: 1.5, maxWidth: 300, margin: 0 }}>Photo quality scoring, enhancement tips, and cover photo optimization.</p>
            <div style={{ width: "100%", maxWidth: 300, padding: "0.5rem 0.65rem", background: "var(--ghost-bg)", borderRadius: "0.5rem", border: "1px solid var(--border-default)", textAlign: "left" }}>
              <div style={{ fontSize: "0.55rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.25rem" }}>What You&apos;ll Get</div>
              {[{ icon: "📸", text: "Quality scoring (1-10)" }, { icon: "✨", text: "Enhancement recommendations" }, { icon: "🖼️", text: "Cover photo optimization" }].map((b, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.3rem", padding: "0.15rem 0", fontSize: "0.62rem", color: "var(--text-secondary)" }}><span style={{ fontSize: "0.6rem", flexShrink: 0 }}>{b.icon}</span><span>{b.text}</span></div>
              ))}
            </div>
            <div style={{ display: "flex", gap: "0.4rem", justifyContent: "center", flexWrap: "wrap", marginTop: "0.5rem", paddingTop: "0.4rem", borderTop: "1px solid var(--border-default)", width: "100%" }}>
              <button onClick={runAssessOnly} style={{ padding: "0.3rem 0.65rem", fontSize: "0.62rem", fontWeight: 600, borderRadius: "0.4rem", border: "1px solid var(--border-default)", background: "var(--ghost-bg)", color: "var(--text-secondary)", cursor: "pointer", minHeight: "32px" }}>📸 PhotoBot · 1 cr</button>
              <a href={`/bots/photobot?item=${itemId}`} style={{ padding: "0.3rem 0.65rem", fontSize: "0.62rem", fontWeight: 600, borderRadius: "0.4rem", border: "1px solid rgba(0,188,212,0.3)", color: "#00bcd4", textDecoration: "none", display: "inline-flex", alignItems: "center", minHeight: "32px" }}>Open PhotoBot →</a>
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
            {/* ═══ ACCORDION: Photo Score & Tips ═══ */}
            <AccordionHeader id="photo-score" icon="📊" title="PHOTO QUALITY SCORE" subtitle={qualityScore != null ? `${qualityScore}/10 · ${photoCount} photo${photoCount !== 1 ? "s" : ""}` : `${photoCount} photos`} isOpen={photoSections.has("photo-score")} onToggle={togglePhotoSection} accentColor="#00bcd4" badge={qualityScore != null ? (qualityScore >= 7 ? "GOOD" : qualityScore >= 4 ? "FAIR" : "NEEDS WORK") : undefined} />
            {photoSections.has("photo-score") && (
              <div style={{ padding: "0.75rem 0.4rem" }}>
                {qualityScore != null && (
                  <div style={{ display: "flex", alignItems: "center", gap: "0.85rem", marginBottom: "0.75rem" }}>
                    <div style={{
                      width: 50, height: 50, borderRadius: "50%",
                      border: `3px solid ${qualityScore >= 7 ? "#4caf50" : qualityScore >= 4 ? "#f59e0b" : "#ef4444"}`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      background: `${qualityScore >= 7 ? "#4caf50" : qualityScore >= 4 ? "#f59e0b" : "#ef4444"}12`,
                    }}>
                      <span style={{ fontSize: "1rem", fontWeight: 700, color: qualityScore >= 7 ? "#4caf50" : qualityScore >= 4 ? "#f59e0b" : "#ef4444" }}>
                        {qualityScore}/10
                      </span>
                    </div>
                    <div>
                      <div style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--text-primary)" }}>Photo Quality</div>
                      <div style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>
                        {qualityScore >= 7 ? "Great photos!" : qualityScore >= 4 ? "Room for improvement" : "Needs more photos"}
                      </div>
                    </div>
                  </div>
                )}

                {/* Assessment scores from AI */}
                {assess && (
                  <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "0.75rem" }}>
                    {[
                      { label: "Isolation", val: assess.isolationScore },
                      { label: "Lighting", val: assess.lightingScore },
                      { label: "Framing", val: assess.framingScore },
                      { label: "Focus", val: assess.focusScore },
                      { label: "Overall", val: assess.overallScore },
                    ].filter((s) => s.val != null).map((s) => (
                      <div key={s.label} style={{ background: "rgba(0,188,212,0.08)", border: "1px solid rgba(0,188,212,0.12)", borderRadius: "6px", padding: "0.2rem 0.55rem", fontSize: "0.72rem" }}>
                        <span style={{ color: "var(--text-muted)" }}>{s.label}: </span>
                        <span style={{ color: (s.val ?? 0) >= 7 ? "#4caf50" : (s.val ?? 0) >= 4 ? "#f59e0b" : "#ef4444", fontWeight: 700 }}>{s.val}/10</span>
                      </div>
                    ))}
                  </div>
                )}

                {tips.length > 0 && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem", marginBottom: "0.65rem" }}>
                    {tips.slice(0, 4).map((tip, i) => (
                      <div key={i} style={{ display: "flex", gap: "0.4rem", alignItems: "flex-start" }}>
                        <span style={{ fontSize: "0.72rem", flexShrink: 0, color: "#f59e0b" }}>💡</span>
                        <span style={{ fontSize: "0.72rem", color: "var(--text-secondary)", lineHeight: 1.4 }}>{tip}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>{photoCount} of 10 photos used</span>
                  {photoCount < 10 && (
                    <a href={`/items/${itemId}/edit`} style={{ fontSize: "0.68rem", color: "var(--accent)", fontWeight: 600, textDecoration: "none" }}>+ Add Photos</a>
                  )}
                </div>
              </div>
            )}

            {/* ═══ ACCORDION: Enhancement Studio ═══ */}
            {photos.length > 0 && (<>
              <AccordionHeader id="photo-enhance" icon="✨" title="ENHANCEMENT STUDIO" subtitle={enhanceResult ? "Results ready" : "AI photo enhancement"} isOpen={photoSections.has("photo-enhance")} onToggle={togglePhotoSection} accentColor="#00bcd4" badge={enhanceResult?.enrichedWithAnalysis ? "AI ENRICHED" : undefined} />
              {photoSections.has("photo-enhance") && (
                <div style={{ padding: "0.75rem 0.4rem" }}>
                  {enhanceError && (
                    <div style={{ padding: "0.5rem 0.75rem", borderRadius: "0.4rem", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", fontSize: "0.72rem", color: "#ef4444", marginBottom: "0.5rem" }}>
                      {enhanceError}
                    </div>
                  )}

                  {/* Idle state */}
                  {!enhanceResult && !enhanceLoading && (
                    <div>
                      {!hasAnalysis && (
                        <div style={{ background: "rgba(0,188,212,0.05)", border: "1px solid rgba(0,188,212,0.15)", borderRadius: "8px", padding: "0.5rem 0.75rem", marginBottom: "0.65rem", display: "flex", gap: "0.5rem", alignItems: "flex-start" }}>
                          <span style={{ fontSize: "0.8rem", flexShrink: 0 }}>💡</span>
                          <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", lineHeight: 1.5 }}>
                            <span style={{ color: "#00bcd4", fontWeight: 600 }}>Tip:</span> Run AnalyzeBot first — PhotoBot uses item data for far more accurate enhancements.
                          </div>
                        </div>
                      )}
                      <p style={{ color: "var(--text-muted)", fontSize: "0.75rem", lineHeight: 1.5, margin: "0 0 0.65rem" }}>
                        AI edits your real photo background, then generates a professional storefront version.
                      </p>
                      <button onClick={runEnhance} style={{
                        background: "linear-gradient(135deg, #00bcd4, #009688)", border: "none", borderRadius: "0.4rem",
                        padding: "0.35rem 0.85rem", color: "#fff", fontWeight: 700, fontSize: "0.72rem", cursor: "pointer",
                      }}>
                        ✨ Enhance Cover Photo · 2 cr
                      </button>
                    </div>
                  )}

                  {/* Loading */}
                  {enhanceLoading && <BotLoadingState botName="PhotoBot" />}

                  {/* Results */}
                  {enhanceResult && !enhanceLoading && (
                    <div>
                      {/* Enrichment badge */}
                      {enhanceResult?.enrichedWithAnalysis && (
                        <div style={{ marginBottom: "0.65rem" }}>
                          <span style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: "20px", padding: "0.12rem 0.55rem", fontSize: "0.65rem", color: "#10b981", fontWeight: 600 }}>
                            ✓ Enhanced with item analysis data
                          </span>
                        </div>
                      )}

                      {/* Condition preservation */}
                      {conditionDetails.length > 0 && (
                        <div style={{ background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: "8px", padding: "0.5rem 0.75rem", marginBottom: "0.65rem" }}>
                          <div style={{ color: "#f59e0b", fontWeight: 700, fontSize: "0.72rem", marginBottom: "0.3rem" }}>🛡️ Condition preserved:</div>
                          {conditionDetails.slice(0, 4).map((c: string, i: number) => (
                            <div key={i} style={{ color: "var(--text-muted)", fontSize: "0.72rem" }}>• {c}</div>
                          ))}
                        </div>
                      )}

                      {/* Two photo outputs */}
                      {(enhanceResult.editedPhotoUrl || enhanceResult.generatedPhotoUrl) && (
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.6rem", marginBottom: "0.65rem" }}>
                          {enhanceResult.editedPhotoUrl && (
                            <div style={{ background: "var(--bg-card)", border: "1px solid rgba(0,188,212,0.12)", borderRadius: "8px", overflow: "hidden" }}>
                              <img src={enhanceResult.editedPhotoUrl} alt="Edited" style={{ width: "100%", aspectRatio: "1", objectFit: "cover", display: "block" }} />
                              <div style={{ padding: "0.5rem" }}>
                                <div style={{ color: "var(--text-primary)", fontWeight: 700, fontSize: "0.72rem" }}>📸 Edited Original</div>
                                <div style={{ color: "var(--text-muted)", fontSize: "0.62rem", marginBottom: "0.35rem" }}>Background cleaned</div>
                                <button onClick={() => setAsCover(enhanceResult.editedPhotoUrl, "edited")} style={{ width: "100%", background: "rgba(0,188,212,0.1)", border: "1px solid rgba(0,188,212,0.25)", borderRadius: "6px", padding: "0.3rem 0", color: "#00bcd4", fontWeight: 600, fontSize: "0.68rem", cursor: "pointer" }}>
                                  {coverSet === "edited" ? "✓ Set!" : "Set as Cover"}
                                </button>
                              </div>
                            </div>
                          )}
                          {enhanceResult.generatedPhotoUrl && (
                            <div style={{ background: "var(--bg-card)", border: "1px solid rgba(0,188,212,0.12)", borderRadius: "8px", overflow: "hidden" }}>
                              <img src={enhanceResult.generatedPhotoUrl} alt="AI Generated" style={{ width: "100%", aspectRatio: "1", objectFit: "cover", display: "block" }} />
                              <div style={{ padding: "0.5rem" }}>
                                <div style={{ color: "var(--text-primary)", fontWeight: 700, fontSize: "0.72rem" }}>🎨 AI Generated</div>
                                <div style={{ color: "var(--text-muted)", fontSize: "0.62rem", marginBottom: "0.35rem" }}>Storefront render</div>
                                <button onClick={() => setAsCover(enhanceResult.generatedPhotoUrl, "generated")} style={{ width: "100%", background: "rgba(0,188,212,0.1)", border: "1px solid rgba(0,188,212,0.25)", borderRadius: "6px", padding: "0.3rem 0", color: "#00bcd4", fontWeight: 600, fontSize: "0.68rem", cursor: "pointer" }}>
                                  {coverSet === "generated" ? "✓ Set!" : "Set as Cover"}
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Assessment-only fallback */}
                      {!enhanceResult.editedPhotoUrl && !enhanceResult.generatedPhotoUrl && (
                        <div style={{ color: "var(--text-muted)", fontSize: "0.75rem", padding: "0.4rem 0", lineHeight: 1.5 }}>
                          Assessment complete. Click <strong style={{ color: "var(--accent)" }}>Enhance</strong> below for edited and AI versions.
                        </div>
                      )}

                      {/* Improvement steps */}
                      {assess?.enhancementSteps && assess.enhancementSteps.length > 0 && (
                        <div style={{ marginTop: "0.5rem" }}>
                          <div style={{ color: "var(--text-secondary)", fontWeight: 600, fontSize: "0.72rem", marginBottom: "0.3rem" }}>📋 Improvement Steps</div>
                          {assess.enhancementSteps.slice(0, 5).map((step: string, i: number) => (
                            <div key={i} style={{ display: "flex", gap: "0.35rem", color: "var(--text-secondary)", fontSize: "0.72rem", marginBottom: "0.2rem" }}>
                              <span style={{ color: "#00bcd4" }}>•</span>
                              <span>{step}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </>)}

            {/* ═══ ACCORDION: Photo Editor ═══ */}
            {photos.length > 0 && (<>
              <AccordionHeader id="photo-editor" icon="🧹" title="PHOTO EDITOR" subtitle={editResult ? "Cleaned" : "Auto-clean backgrounds"} isOpen={photoSections.has("photo-editor")} onToggle={togglePhotoSection} accentColor="#00bcd4" badge="1 CR/PHOTO" />
              {photoSections.has("photo-editor") && (
                <div style={{ padding: "0.75rem 0.4rem" }}>
                  {editError && (
                    <div style={{ padding: "0.5rem 0.75rem", borderRadius: "0.4rem", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", fontSize: "0.72rem", color: "#ef4444", marginBottom: "0.5rem" }}>
                      {editError}
                    </div>
                  )}

                  {/* Idle */}
                  {!editResult && !editLoading && (
                    <div>
                      <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", marginBottom: "0.65rem" }}>
                        {photos.slice(0, 5).map((p) => (
                          <img key={p.id} src={p.filePath} alt="" onClick={() => setEditSelectedPhoto(p.id)}
                            style={{ width: "52px", height: "52px", borderRadius: "6px", objectFit: "cover", cursor: "pointer", border: editSelectedPhoto === p.id ? "2px solid #00bcd4" : "2px solid transparent", opacity: editSelectedPhoto === p.id ? 1 : 0.7, transition: "all 0.2s" }} />
                        ))}
                      </div>
                      <p style={{ color: "var(--text-muted)", fontSize: "0.72rem", lineHeight: 1.5, margin: "0 0 0.65rem" }}>
                        AI protects the item and removes backgrounds, people, and clutter.
                      </p>
                      <button onClick={runPhotoEdit} disabled={!editSelectedPhoto}
                        style={{ background: editSelectedPhoto ? "linear-gradient(135deg, #00bcd4, #009688)" : "var(--ghost-bg)", border: "none", borderRadius: "0.4rem", padding: "0.35rem 0.85rem", color: editSelectedPhoto ? "#fff" : "var(--text-muted)", fontWeight: 700, fontSize: "0.72rem", cursor: editSelectedPhoto ? "pointer" : "default", opacity: editSelectedPhoto ? 1 : 0.5 }}>
                        🧹 Auto-Clean Photo · 1 cr
                      </button>
                    </div>
                  )}

                  {/* Loading */}
                  {editLoading && (
                    <div style={{ color: "var(--text-muted)", fontSize: "0.75rem", textAlign: "center", padding: "0.75rem" }}>
                      🧹 Scanning and cleaning — protecting your item...
                    </div>
                  )}

                  {/* Results */}
                  {editResult && !editLoading && (
                    <div>
                      <div style={{ background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.15)", borderRadius: "8px", padding: "0.5rem 0.75rem", marginBottom: "0.65rem" }}>
                        <div style={{ color: "#10b981", fontWeight: 700, fontSize: "0.72rem", marginBottom: "0.2rem" }}>✓ Item protected · Cleaned:</div>
                        <div style={{ color: "var(--text-muted)", fontSize: "0.72rem" }}>{editResult.cleaningDescription}</div>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", marginBottom: "0.65rem" }}>
                        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-default)", borderRadius: "8px", overflow: "hidden" }}>
                          <img src={editResult.originalPhotoPath} alt="Original" style={{ width: "100%", aspectRatio: "1", objectFit: "cover", display: "block" }} />
                          <div style={{ padding: "0.35rem 0.45rem", color: "var(--text-muted)", fontSize: "0.65rem", fontWeight: 600 }}>Original</div>
                        </div>
                        <div style={{ background: "var(--bg-card)", border: "1px solid rgba(0,188,212,0.2)", borderRadius: "8px", overflow: "hidden" }}>
                          <img src={editResult.editedPhotoUrl} alt="Cleaned" style={{ width: "100%", aspectRatio: "1", objectFit: "cover", display: "block" }} />
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span style={{ padding: "0.35rem 0.45rem", color: "#00bcd4", fontSize: "0.65rem", fontWeight: 600 }}>Cleaned</span>
                            <button onClick={() => { setCoverSet("edit"); }} style={{ background: "rgba(0,188,212,0.1)", border: "none", borderRadius: "4px", padding: "0.2rem 0.45rem", color: "#00bcd4", fontSize: "0.62rem", fontWeight: 600, cursor: "pointer", margin: "0.25rem" }}>
                              {coverSet === "edit" ? "✓ Set!" : "Set as Cover"}
                            </button>
                          </div>
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.5rem" }}>
                        <span style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: "20px", padding: "0.15rem 0.55rem", color: "#f59e0b", fontSize: "0.65rem", fontWeight: 600 }}>
                          🛡️ Item condition untouched
                        </span>
                      </div>
                      <button onClick={() => { setEditResult(null); setEditSelectedPhoto(null); }}
                        style={{ background: "var(--ghost-bg)", border: "1px solid var(--border-default)", borderRadius: "0.4rem", padding: "0.3rem 0.65rem", color: "var(--text-muted)", fontSize: "0.68rem", cursor: "pointer" }}>
                        Clean Another Photo
                      </button>
                    </div>
                  )}
                </div>
              )}
            </>)}

            {/* ═══ ACCORDION: MegaBot Results ═══ */}
            {boosted && boostResult && (<>
              <AccordionHeader id="megabot-results" icon="⚡" title="MEGABOT MULTI-AI ANALYSIS" subtitle={`${boostResult.agreementScore ?? "?"}% Agreement`} isOpen={photoSections.has("megabot-results")} onToggle={togglePhotoSection} accentColor="#8b5cf6" badge={`${(boostResult.providers || []).filter((p: any) => p.data || !p.error).length} AI`} />
              {photoSections.has("megabot-results") && (
                <div style={{ padding: "0.75rem 0.4rem" }}>
                  {/* MegaBot Advantage Callout */}
                  <div style={{ background: "rgba(139,92,246,0.08)", border: "1px solid rgba(139,92,246,0.25)", borderRadius: "0.5rem", padding: "0.5rem 0.75rem", marginBottom: "0.65rem", display: "flex", flexWrap: "wrap", gap: "0.4rem", alignItems: "center" }}>
                    <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#8b5cf6" }}>⚡ MegaBot</span>
                    {["4 AI experts", "5 variations", "Deep intelligence"].map((item) => (
                      <span key={item} style={{ background: "rgba(139,92,246,0.12)", color: "#a78bfa", borderRadius: "20px", padding: "0.12rem 0.5rem", fontSize: "0.6rem", fontWeight: 600 }}>
                        {item}
                      </span>
                    ))}
                  </div>

                  <MegaBotBoostResults botType="photos" result={boostResult} aiData={aiData} />

                  {/* Enhancement Variation Cards */}
                  {megaVariations.length > 0 && (
                    <div style={{ marginTop: "0.65rem" }}>
                      <div style={{ color: "var(--text-secondary)", fontSize: "0.72rem", fontWeight: 700, marginBottom: "0.4rem" }}>Enhancement Variations</div>
                      {megaVariations.slice(0, 5).map((v: any, i: number) => {
                        const vName = v.variationName || v.variation_name || `Variation ${i + 1}`;
                        const vResult = variationResults.find((vr: any) => vr.variationName === vName);
                        const vImgUrl = vResult?.generatedPhotoUrl || vResult?.editedPhotoUrl || null;
                        const isGenerating = variationLoading === vName;

                        return (
                          <div key={i} style={{ background: "var(--bg-card)", border: "1px solid rgba(139,92,246,0.15)", borderRadius: "8px", overflow: "hidden", marginBottom: "0.5rem" }}>
                            {vImgUrl ? (
                              <img src={vImgUrl} alt={vName} style={{ width: "100%", aspectRatio: "1", objectFit: "cover", display: "block" }} />
                            ) : isGenerating ? (
                              <div style={{ width: "100%", aspectRatio: "1", background: "rgba(139,92,246,0.05)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <span style={{ color: "#8b5cf6", fontSize: "0.75rem" }}>🎨 Generating...</span>
                              </div>
                            ) : null}
                            <div style={{ padding: "0.6rem" }}>
                              <div style={{ color: "var(--text-primary)", fontWeight: 700, fontSize: "0.78rem", marginBottom: "0.2rem" }}>{vName}</div>
                              <div style={{ color: "var(--text-secondary)", fontSize: "0.72rem", marginBottom: "0.35rem" }}>{v.description}</div>
                              {(v.bestFor || v.best_for) && (
                                <div style={{ marginBottom: "0.4rem" }}>
                                  <span style={{ background: "rgba(139,92,246,0.1)", color: "#8b5cf6", borderRadius: "20px", padding: "0.15rem 0.55rem", fontSize: "0.62rem", fontWeight: 600 }}>
                                    {v.bestFor || v.best_for}
                                  </span>
                                </div>
                              )}
                              <div style={{ display: "flex", gap: "0.35rem" }}>
                                {vImgUrl ? (
                                  <button onClick={() => setAsCover(vImgUrl, `var-${i}`)} style={{ flex: 1, background: "rgba(0,188,212,0.1)", border: "1px solid rgba(0,188,212,0.25)", borderRadius: "6px", padding: "0.3rem 0", color: "#00bcd4", fontWeight: 600, fontSize: "0.68rem", cursor: "pointer" }}>
                                    {coverSet === `var-${i}` ? "✓ Set!" : "Set as Cover"}
                                  </button>
                                ) : !isGenerating ? (
                                  <button onClick={() => generateVariation(v)} disabled={!!variationLoading} style={{ flex: 1, background: "rgba(0,188,212,0.1)", border: "1px solid rgba(0,188,212,0.25)", borderRadius: "6px", padding: "0.3rem 0", color: "#00bcd4", fontWeight: 600, fontSize: "0.68rem", cursor: variationLoading ? "wait" : "pointer", opacity: variationLoading ? 0.6 : 1 }}>
                                    Generate This Version
                                  </button>
                                ) : null}
                                {vImgUrl && (
                                  <button onClick={() => generateVariation(v)} disabled={!!variationLoading} style={{ background: "var(--ghost-bg)", border: "1px solid var(--border-default)", borderRadius: "6px", padding: "0.3rem 0.5rem", color: "var(--text-muted)", fontSize: "0.62rem", cursor: variationLoading ? "wait" : "pointer" }}>
                                    Redo
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Missing Shots */}
                  {megaMissingShots.length > 0 && (
                    <div style={{ marginTop: "0.65rem" }}>
                      <div style={{ color: "var(--text-secondary)", fontSize: "0.72rem", fontWeight: 600, marginBottom: "0.35rem" }}>📸 Missing Shots</div>
                      {megaMissingShots.slice(0, 5).map((shot, i) => (
                        <div key={i} style={{ display: "flex", gap: "0.35rem", color: "var(--text-secondary)", fontSize: "0.72rem", marginBottom: "0.25rem" }}>
                          <span style={{ color: "#00bcd4" }}>☐</span>
                          <span>{typeof shot === "string" ? shot : (shot as any).shotName || JSON.stringify(shot)}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Professional Tips */}
                  {megaProTips.length > 0 && (
                    <div style={{ marginTop: "0.65rem" }}>
                      <div style={{ color: "var(--text-secondary)", fontSize: "0.72rem", fontWeight: 600, marginBottom: "0.35rem" }}>💡 Professional Tips</div>
                      {megaProTips.slice(0, 5).map((tip, i) => (
                        <div key={i} style={{ display: "flex", gap: "0.35rem", color: "var(--text-secondary)", fontSize: "0.72rem", marginBottom: "0.25rem" }}>
                          <span style={{ color: "#00bcd4" }}>•</span>
                          <span>{typeof tip === "string" ? tip : JSON.stringify(tip)}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Condition Documentation */}
                  {megaConditionDocs.length > 0 && (
                    <div style={{ marginTop: "0.65rem", background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: "6px", padding: "0.45rem 0.65rem" }}>
                      <div style={{ color: "#f59e0b", fontWeight: 600, fontSize: "0.68rem", marginBottom: "0.2rem" }}>🛡️ Condition Documentation</div>
                      {megaConditionDocs.slice(0, 6).map((c, i) => (
                        <div key={i} style={{ color: "var(--text-muted)", fontSize: "0.68rem" }}>• {typeof c === "string" ? c : (c as any).issue || JSON.stringify(c)}</div>
                      ))}
                    </div>
                  )}

                  {/* MegaBot summary */}
                  {boostResult?.summary && (
                    <div style={{ marginTop: "0.65rem", color: "var(--text-muted)", fontSize: "0.72rem", fontStyle: "italic", lineHeight: 1.5 }}>
                      {boostResult.summary}
                    </div>
                  )}
                </div>
              )}
            </>)}
          </div>
        )}
      </div>

      {/* ── Standard PanelFooter (matches all other bot panels) ── */}
      <PanelFooter
        botName="PhotoBot"
        botLink="/bots/photobot"
        itemId={itemId}
        botIcon="📷"
        botCost={1}
        onBotRun={hasAnalysis ? runAssessOnly : undefined}
        onSuperBoost={hasAnalysis ? onSuperBoost : undefined}
        boosting={boosting}
        boosted={boosted}
        hasResult={!!enhanceResult}
      />
      </div>
    </GlassCard>
  );
}

/* ═══════════════════════════════════════════
   PANEL 5: Buyer Finder (PAID — requires credits)
   ═══════════════════════════════════════════ */

function BuyerFinderPanel({ aiData, itemId, onSuperBoost, onBuyerBotRun, boosting, boosted, boostResult, buyerBotResult, buyerBotLoading, collapsed, onToggle }: {
  aiData: any;
  itemId: string;
  onSuperBoost: () => void;
  onBuyerBotRun?: () => void;
  boosting: boolean;
  boosted: boolean;
  boostResult: any;
  buyerBotResult?: any;
  buyerBotLoading?: boolean;
  collapsed?: boolean;
  onToggle?: () => void;
}) {
  const hasAnalysis = !!aiData;

  // Parse BuyerBot result
  const bb = buyerBotResult
    ? (typeof buyerBotResult === "string" ? (() => { try { return JSON.parse(buyerBotResult); } catch { return null; } })() : buyerBotResult)
    : null;

  const hasResult = !!bb;
  const hotLeads = (bb?.hot_leads || []).slice(0, 3);
  const profiles = bb?.buyer_profiles || [];
  const topProfiles = profiles.slice(0, 3);
  const platforms = bb?.platform_opportunities || [];
  const competition = bb?.competitive_landscape;
  const bestPlatform = [...platforms].sort((a: any, b: any) => {
    const order: Record<string, number> = { "Excellent": 4, "Good": 3, "Moderate": 2, "Low": 1 };
    return (order[b.opportunity_level] || 0) - (order[a.opportunity_level] || 0);
  })[0];

  // ── Reach Out composer state ──
  const [openComposer, setOpenComposer] = useState<string | null>(null);
  const [composerMsg, setComposerMsg] = useState("");
  const [reachedOut, setReachedOut] = useState<Record<string, string>>({});
  const [justCopied, setJustCopied] = useState(false);
  const [buyerOpenSections, setBuyerOpenSections] = useState<Set<string>>(
    new Set(["buyer-leads", "buyer-platforms", "megabot-results"])
  );
  const toggleBuyerSection = (id: string) => {
    setBuyerOpenSections(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const itemName = aiData?.item_name || "this item";
  const condLabel = (aiData?.condition_score ?? 5) >= 8 ? "excellent" : (aiData?.condition_score ?? 5) >= 5 ? "great" : "good";
  const itemCat = aiData?.category || "item";
  const itemEra = aiData?.era || "vintage";

  function buildTemplate(buyerType: string, offerHint?: string) {
    const priceHint = offerHint || "my asking price";
    const bt = (buyerType || "").toLowerCase();
    if (bt.includes("collector") || bt.includes("hobbyist"))
      return `Fellow ${itemCat.toLowerCase()} enthusiast — I have a ${itemEra} ${itemName} in ${condLabel} condition that I think might interest you. Happy to share more photos and discuss. Asking ${priceHint}.`;
    if (bt.includes("reseller") || bt.includes("dealer"))
      return `Hi, I have a ${itemName} (${itemEra}, ${condLabel} condition) that could be a great addition to your inventory. Estimated value aligns with current market. Let me know if you'd like details.`;
    if (bt.includes("local") || bt.includes("personal"))
      return `Hey! Selling a ${itemName} locally — ${condLabel} condition, ${priceHint}. Can meet at a public spot. Happy to send more photos!`;
    return `Hi! I have a ${itemName} in ${condLabel} condition that I thought you might be interested in. It's a ${itemEra} ${itemCat.toLowerCase()} piece. Would you like to see more details?`;
  }

  function openReach(key: string, template: string) {
    if (openComposer === key) { setOpenComposer(null); return; }
    setOpenComposer(key);
    setComposerMsg(template);
    setJustCopied(false);
  }

  function handleAction(key: string, action: "copy" | "inapp" | "email") {
    if (action === "copy" || action === "email") {
      navigator.clipboard.writeText(composerMsg).catch(() => {});
      setJustCopied(true);
      if (action === "email") {
        window.open(`mailto:?subject=${encodeURIComponent(itemName + " — For Sale")}&body=${encodeURIComponent(composerMsg)}`, "_blank");
      }
    }
    setReachedOut((prev) => ({ ...prev, [key]: new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) }));
    setTimeout(() => setOpenComposer(null), 900);
  }

  // Inline composer renderer
  function renderComposer(key: string, label: string, platformHint?: string) {
    if (openComposer !== key) return null;
    return (
      <div style={{
        marginTop: "0.35rem", padding: "0.6rem", borderRadius: "0.6rem",
        background: "rgba(0,188,212,0.05)", border: "1px solid rgba(0,188,212,0.2)",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.35rem" }}>
          <span style={{ fontSize: "0.6rem", fontWeight: 700, color: "var(--accent)", textTransform: "uppercase", letterSpacing: "0.04em" }}>Message to: {label}</span>
          <button onClick={() => setOpenComposer(null)} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: "0.75rem", padding: "0.1rem 0.3rem", lineHeight: 1 }}>✕</button>
        </div>
        <textarea
          value={composerMsg}
          onChange={(e) => { setComposerMsg(e.target.value); setJustCopied(false); }}
          rows={4}
          style={{
            width: "100%", padding: "0.5rem", borderRadius: "0.4rem", fontSize: "0.7rem",
            background: "var(--bg-card)", border: "1px solid var(--border-default)",
            color: "var(--text-primary)", resize: "vertical", lineHeight: 1.45, fontFamily: "inherit",
          }}
        />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "0.3rem" }}>
          <span style={{ fontSize: "0.52rem", color: composerMsg.length > 500 ? "#f59e0b" : "var(--text-muted)" }}>{composerMsg.length}/500</span>
          <div style={{ display: "flex", gap: "0.25rem" }}>
            <button onClick={() => handleAction(key, "inapp")} style={{
              padding: "0.22rem 0.5rem", borderRadius: "0.3rem", fontSize: "0.58rem", fontWeight: 600,
              background: "linear-gradient(135deg, #00bcd4, #009688)", border: "none",
              color: "#fff", cursor: "pointer",
            }}>💬 Send</button>
            <button onClick={() => handleAction(key, "copy")} style={{
              padding: "0.22rem 0.5rem", borderRadius: "0.3rem", fontSize: "0.58rem", fontWeight: 600,
              background: "transparent", border: "1px solid var(--border-default)",
              color: "var(--text-muted)", cursor: "pointer",
            }}>{justCopied ? "✅ Copied" : `📋 Copy${platformHint ? ` for ${platformHint}` : ""}`}</button>
            <button onClick={() => handleAction(key, "email")} style={{
              padding: "0.22rem 0.5rem", borderRadius: "0.3rem", fontSize: "0.58rem", fontWeight: 600,
              background: "transparent", border: "1px solid var(--border-default)",
              color: "var(--text-muted)", cursor: "pointer",
            }}>📧 Email</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <GlassCard>
      <PanelHeader icon="🎯" title="Buyer Finder" hasData={hasResult} badge={!hasResult ? "REQUIRES CREDITS" : undefined} collapsed={collapsed} onToggle={onToggle}
        preview={hasResult ? `${hotLeads.length} hot leads · Best: ${bestPlatform?.platform || "—"}` : "Not run yet"}
      />

      {collapsed && hasResult && <CollapsedSummary botType="buyers" data={{ leadCount: hotLeads.length + profiles.length, bestPlatform: bestPlatform?.platform, hotCount: hotLeads.length }} megaData={boosted ? boostResult : undefined} buttons={<>
        {onBuyerBotRun && <button onClick={onBuyerBotRun} style={{ padding: "0.3rem 0.65rem", fontSize: "0.62rem", fontWeight: 600, borderRadius: "0.4rem", border: "1px solid var(--border-default)", background: "var(--ghost-bg)", color: "var(--text-secondary)", cursor: "pointer", minHeight: "32px" }}>🎯 Re-Run · 0.5 cr</button>}
        {onSuperBoost && <button onClick={onSuperBoost} style={{ padding: "0.3rem 0.65rem", fontSize: "0.62rem", fontWeight: 600, borderRadius: "0.4rem", border: "none", background: "linear-gradient(135deg, #00bcd4, #009688)", color: "#fff", cursor: "pointer", minHeight: "32px" }}>{boosted ? "🔄 MegaBot Re-Run · 3 cr" : "⚡ MegaBot · 5 cr"}</button>}
        <a href="/bots/buyerbot" style={{ padding: "0.3rem 0.65rem", fontSize: "0.62rem", fontWeight: 600, borderRadius: "0.4rem", border: "1px solid rgba(0,188,212,0.3)", color: "#00bcd4", textDecoration: "none", display: "inline-flex", alignItems: "center", minHeight: "32px" }}>Open BuyerBot →</a>
      </>} />}
      {collapsed && !hasResult && (
        <div style={{ padding: "0.65rem 0.85rem", display: "flex", alignItems: "center", gap: "0.65rem" }}>
          <span style={{ fontSize: "1.3rem" }}>🎯</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-primary)" }}>Buyer Finder</div>
            <div style={{ fontSize: "0.62rem", color: "var(--text-muted)", lineHeight: 1.4 }}>Targeted buyer profiles and platform opportunities</div>
          </div>
          <div style={{ display: "flex", gap: "0.3rem", flexShrink: 0 }}>
            {onBuyerBotRun && <button onClick={onBuyerBotRun} style={{ padding: "0.3rem 0.65rem", fontSize: "0.62rem", fontWeight: 600, borderRadius: "0.4rem", border: "1px solid var(--border-default)", background: "var(--ghost-bg)", color: "var(--text-secondary)", cursor: "pointer", minHeight: "32px" }}>🎯 BuyerBot · 1 cr</button>}
            <a href="/bots/buyerbot" style={{ padding: "0.3rem 0.65rem", fontSize: "0.62rem", fontWeight: 600, borderRadius: "0.4rem", border: "1px solid rgba(0,188,212,0.3)", color: "#00bcd4", textDecoration: "none", display: "inline-flex", alignItems: "center", minHeight: "32px" }}>Open BuyerBot →</a>
          </div>
        </div>
      )}

      <div style={{ display: collapsed ? "none" : "flex", flexDirection: "column" as const, flex: 1 }}>
      <div style={{ padding: "1.25rem" }}>
        {!hasAnalysis ? (
          <EmptyState message="Run AI analysis first to enable buyer search." />
        ) : buyerBotLoading ? (
          <BotLoadingState botName="BuyerBot" />
        ) : !hasResult ? (
          /* ── NOT RUN ── */
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", flex: 1, justifyContent: "center", padding: "1.25rem", gap: "0.5rem" }}>
            <span style={{ fontSize: "1.5rem" }}>🎯</span>
            <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--text-primary)" }}>Buyer Finder</div>
            <p style={{ fontSize: "0.68rem", color: "var(--text-secondary)", lineHeight: 1.5, maxWidth: 300, margin: 0 }}>Targeted buyer profiles matched to your item across 15+ platforms.</p>
            <div style={{ width: "100%", maxWidth: 300, padding: "0.5rem 0.65rem", background: "var(--ghost-bg)", borderRadius: "0.5rem", border: "1px solid var(--border-default)", textAlign: "left" }}>
              <div style={{ fontSize: "0.55rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.25rem" }}>What You&apos;ll Get</div>
              {[{ icon: "🎯", text: "Targeted buyer profiles" }, { icon: "🏪", text: "Platform opportunity analysis" }, { icon: "📧", text: "Ready-to-use outreach templates" }].map((b, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.3rem", padding: "0.15rem 0", fontSize: "0.62rem", color: "var(--text-secondary)" }}><span style={{ fontSize: "0.6rem", flexShrink: 0 }}>{b.icon}</span><span>{b.text}</span></div>
              ))}
            </div>
            <div style={{ display: "flex", gap: "0.4rem", justifyContent: "center", flexWrap: "wrap", marginTop: "0.5rem", paddingTop: "0.4rem", borderTop: "1px solid var(--border-default)", width: "100%" }}>
              {onBuyerBotRun && <button onClick={onBuyerBotRun} style={{ padding: "0.3rem 0.65rem", fontSize: "0.62rem", fontWeight: 600, borderRadius: "0.4rem", border: "1px solid var(--border-default)", background: "var(--ghost-bg)", color: "var(--text-secondary)", cursor: "pointer", minHeight: "32px" }}>🎯 BuyerBot · 1 cr</button>}
              <a href="/bots/buyerbot" style={{ padding: "0.3rem 0.65rem", fontSize: "0.62rem", fontWeight: 600, borderRadius: "0.4rem", border: "1px solid rgba(0,188,212,0.3)", color: "#00bcd4", textDecoration: "none", display: "inline-flex", alignItems: "center", minHeight: "32px" }}>Open BuyerBot →</a>
            </div>
          </div>
        ) : (
          /* ── HAS RESULT — SUMMARY ── */
          <div style={{ display: "flex", flexDirection: "column", gap: "0.55rem" }}>
            <AccordionHeader id="buyer-leads" icon="🔥" title="HOT LEADS" subtitle={`${hotLeads.length + profiles.length} potential buyers`} isOpen={buyerOpenSections.has("buyer-leads")} onToggle={toggleBuyerSection} accentColor="#ef4444" />
            {buyerOpenSections.has("buyer-leads") && (<div style={{ padding: "0.35rem 0", display: "flex", flexDirection: "column", gap: "0.55rem" }}>
            {/* Stats row */}
            <div style={{ display: "flex", gap: "0.5rem", fontSize: "0.72rem", color: "var(--text-muted)", flexWrap: "wrap" }}>
              <span>🎯 <strong style={{ color: "var(--text-primary)" }}>{profiles.length}</strong> buyers</span>
              <span>·</span>
              <span>🔥 <strong style={{ color: "#ef4444" }}>{hotLeads.length}</strong> hot leads</span>
              <span>·</span>
              <span>📡 <strong style={{ color: "var(--text-primary)" }}>{platforms.length}</strong> platforms</span>
            </div>

            {/* Top 3 hot leads */}
            {hotLeads.map((lead: any, i: number) => {
              const key = `lead-${i}`;
              const urgency = (lead.urgency || "").toLowerCase();
              const urgColor = urgency.includes("act now") ? "#ef4444" : urgency.includes("this week") ? "#f59e0b" : "#00bcd4";
              const reached = reachedOut[key];
              return (
                <div key={key}>
                  <div style={{
                    display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.4rem 0.6rem",
                    borderRadius: "0.45rem", border: `1px solid ${i === 0 ? "rgba(239,68,68,0.2)" : "var(--border-default)"}`,
                    background: i === 0 ? "rgba(239,68,68,0.03)" : "var(--bg-card)",
                  }}>
                    <span style={{ padding: "0.1rem 0.4rem", borderRadius: "9999px", fontSize: "0.5rem", fontWeight: 700, background: `${urgColor}15`, color: urgColor, whiteSpace: "nowrap" }}>
                      {lead.urgency}
                    </span>
                    <span style={{ flex: 1, fontSize: "0.68rem", color: "var(--text-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {lead.lead_description}
                    </span>
                    {lead.estimated_price_theyd_pay && (
                      <span style={{ fontSize: "0.68rem", fontWeight: 700, color: "#4ade80", whiteSpace: "nowrap" }}>~${lead.estimated_price_theyd_pay}</span>
                    )}
                    {reached ? (
                      <span style={{ fontSize: "0.52rem", color: "#4ade80", whiteSpace: "nowrap", fontWeight: 600 }}>✅ {reached}</span>
                    ) : (
                      <button onClick={() => openReach(key, buildTemplate("general", lead.estimated_price_theyd_pay ? `$${lead.estimated_price_theyd_pay}` : undefined))} style={{
                        padding: "0.15rem 0.4rem", borderRadius: "0.3rem", fontSize: "0.52rem", fontWeight: 600,
                        background: "transparent", border: "1px solid rgba(0,188,212,0.3)", color: "var(--accent)",
                        cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0,
                      }}>📤 Reach Out</button>
                    )}
                  </div>
                  {renderComposer(key, lead.lead_description?.slice(0, 40) || "Hot Lead", lead.how_to_reach?.split(" ")[0])}
                </div>
              );
            })}

            {/* Top 3 buyer profiles */}
            {topProfiles.length > 0 && (
              <div style={{ fontSize: "0.55rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginTop: "0.15rem" }}>Top Buyer Profiles</div>
            )}
            {topProfiles.map((p: any, i: number) => {
              const key = `prof-${i}`;
              const reached = reachedOut[key];
              const platHint = p.platforms_active_on?.[0] || "";
              return (
                <div key={key}>
                  <div style={{
                    display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.4rem 0.6rem",
                    borderRadius: "0.45rem", border: "1px solid var(--border-default)", background: "var(--bg-card)",
                  }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: "0.7rem", fontWeight: 600, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.profile_name}</div>
                      <div style={{ fontSize: "0.55rem", color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {p.buyer_type}{p.estimated_offer_range ? ` · ${p.estimated_offer_range}` : ""}
                      </div>
                    </div>
                    {reached ? (
                      <span style={{ fontSize: "0.52rem", color: "#4ade80", whiteSpace: "nowrap", fontWeight: 600 }}>✅ {reached}</span>
                    ) : (
                      <button onClick={() => openReach(key, buildTemplate(p.buyer_type, p.estimated_offer_range?.split("—")[0]?.trim()))} style={{
                        padding: "0.15rem 0.4rem", borderRadius: "0.3rem", fontSize: "0.52rem", fontWeight: 600,
                        background: "transparent", border: "1px solid rgba(0,188,212,0.3)", color: "var(--accent)",
                        cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0,
                      }}>📤 Reach Out</button>
                    )}
                  </div>
                  {renderComposer(key, p.profile_name || "Buyer", platHint)}
                </div>
              );
            })}
            </div>)}

            <AccordionHeader id="buyer-platforms" icon="🏪" title="PLATFORMS" isOpen={buyerOpenSections.has("buyer-platforms")} onToggle={toggleBuyerSection} />
            {buyerOpenSections.has("buyer-platforms") && (<div style={{ padding: "0.35rem 0", display: "flex", flexDirection: "column", gap: "0.55rem" }}>
            {/* Best platform */}
            {bestPlatform && (
              <div style={{ fontSize: "0.68rem", color: "var(--text-secondary)" }}>
                Best bet: <strong style={{ color: "var(--accent)" }}>{bestPlatform.platform}</strong>
                {bestPlatform.estimated_buyers && <span> — ~{bestPlatform.estimated_buyers} active buyers</span>}
              </div>
            )}
            </div>)}

            <AccordionHeader id="buyer-outreach" icon="📤" title="OUTREACH" isOpen={buyerOpenSections.has("buyer-outreach")} onToggle={toggleBuyerSection} />
            {buyerOpenSections.has("buyer-outreach") && (<div style={{ padding: "0.35rem 0", display: "flex", flexDirection: "column", gap: "0.55rem" }}>
            {/* Competitive edge */}
            {competition?.your_advantage && (
              <div style={{ fontSize: "0.65rem", color: "var(--text-muted)", lineHeight: 1.35 }}>
                ✅ {competition.your_advantage}
              </div>
            )}

            {/* Link to full page */}
            <a href={`/bots/buyerbot?item=${itemId}`} style={{ fontSize: "0.68rem", fontWeight: 600, color: "var(--accent)", textDecoration: "none" }}>
              See all buyers →
            </a>
            </div>)}
          </div>
        )}

        {/* MegaBot boost results — outside the hasResult check so it shows even without regular BuyerBot run */}
        {boosted && boostResult && (<>
          <AccordionHeader id="megabot-results" icon="⚡" title="MEGABOT MULTI-AI ANALYSIS" subtitle={`${boostResult.agreementScore ?? "?"}% Agreement`} isOpen={buyerOpenSections.has("megabot-results")} onToggle={toggleBuyerSection} accentColor="#8b5cf6" badge={`${(boostResult.providers || []).filter((p: any) => p.data || !p.error).length} AI`} />
          {buyerOpenSections.has("megabot-results") && <MegaBotBoostResults botType="buyers" result={boostResult} aiData={aiData} />}
        </>)}
      </div>

      <PanelFooter botName="BuyerBot" botLink="/bots/buyerbot" itemId={itemId} botIcon="🎯" botCost={1} onBotRun={hasAnalysis ? onBuyerBotRun : undefined} onSuperBoost={hasAnalysis ? onSuperBoost : undefined} boosting={boosting} boosted={boosted} hasResult={!!buyerBotResult} />
      </div>
    </GlassCard>
  );
}

/* ═══════════════════════════════════════════
   LISTING COMMAND CENTER (inline sub-component)
   ═══════════════════════════════════════════ */

const LISTING_PLATFORMS = [
  { key: "ebay", icon: "🛒", name: "eBay", color: "#e53238", url: "https://www.ebay.com/sl/sell" },
  { key: "facebook_marketplace", icon: "📘", name: "Facebook", color: "#1877f2", url: "https://www.facebook.com/marketplace/create/item" },
  { key: "instagram", icon: "📸", name: "Instagram", color: "#e1306c", url: "https://www.instagram.com" },
  { key: "tiktok", icon: "🎵", name: "TikTok", color: "#555", url: "https://shop.tiktok.com" },
  { key: "etsy", icon: "🎨", name: "Etsy", color: "#f1641e", url: "https://www.etsy.com/sell/post" },
  { key: "craigslist", icon: "📋", name: "Craigslist", color: "#592d8c", url: "https://post.craigslist.org" },
  { key: "offerup", icon: "💚", name: "OfferUp", color: "#34a853", url: "https://offerup.com/post" },
  { key: "mercari", icon: "🏪", name: "Mercari", color: "#d5001c", url: "https://www.mercari.com/sell" },
  { key: "poshmark", icon: "👗", name: "Poshmark", color: "#cc2f5c", url: "https://poshmark.com/create-listing" },
  { key: "reverb", icon: "🎸", name: "Reverb", color: "#298dff", url: "https://reverb.com/sell/listings/new" },
  { key: "pinterest", icon: "📌", name: "Pinterest", color: "#e60023", url: "https://pinterest.com/pin/create/button" },
  { key: "amazon", icon: "📦", name: "Amazon", color: "#ff9900", url: "https://sellercentral.amazon.com" },
  { key: "legacyloop", icon: "🔄", name: "LegacyLoop", color: "#00bcd4", url: "/store" },
];

function ListingCommandCenter({ listings, listBotResult, boostResult, itemId, getFullText, copiedPlatform, setCopiedPlatform, copyPlatform, getTitle, getPrice, platformCount }: {
  listings: Record<string, any>;
  listBotResult: any;
  boostResult?: any;
  itemId: string;
  getFullText: (listing: any, p: string) => string;
  copiedPlatform: string | null;
  setCopiedPlatform: (v: string | null) => void;
  copyPlatform: (p: string) => void;
  getTitle: (listing: any, p: string) => string;
  getPrice: (listing: any, p: string) => number | null;
  platformCount: number;
}) {
  const [showStrategy, setShowStrategy] = useState(false);
  const [publishStatuses, setPublishStatuses] = useState<Record<string, string>>({});

  // Fetch publish statuses on mount
  useEffect(() => {
    fetch(`/api/listings/${itemId}`).then((r) => r.json()).then((d) => {
      if (d.platforms) {
        const map: Record<string, string> = {};
        for (const s of d.platforms) map[s.platform] = s.status;
        setPublishStatuses(map);
      }
    }).catch(() => {});
  }, [itemId]);

  const con = boostResult?.consensus || {};
  const bestPlatform = con.best_platform || listBotResult?.best_platform || listBotResult?.top_platforms?.[0] || Object.keys(listings)[0] || null;
  const execSummary = con.executive_summary || listBotResult?.executive_summary || null;
  const topKeywords = con.top_keywords || con.seo_keywords?.primary || listBotResult?.top_keywords || listBotResult?.seo_keywords?.primary || listBotResult?.hashtags?.slice(0, 5) || [];
  const strategy = con.cross_platform_strategy || listBotResult?.cross_platform_strategy || null;
  const estimatedDays = con.estimated_sell_days || listBotResult?.estimated_sell_days || null;
  const agentCount = Array.isArray(boostResult?.providers) ? boostResult.providers.filter((p: any) => p.data || !p.error).length : 0;
  const copiedCount = Object.values(publishStatuses).filter((s) => s === "COPIED" || s === "POSTED" || s === "LIVE").length;

  // Find matching listing for any platform key (fuzzy)
  function findListing(platKey: string): any {
    if (listings[platKey]) return listings[platKey];
    for (const [k, v] of Object.entries(listings)) {
      if (k.toLowerCase().replace(/[\s_-]/g, "").includes(platKey.replace(/_/g, ""))) return v;
    }
    return null;
  }

  // Select top 3 platforms with data
  const PLATFORM_ORDER = ["ebay", "facebook_marketplace", "instagram", "tiktok", "etsy", "craigslist", "offerup", "mercari", "poshmark", "reverb", "pinterest", "amazon", "legacyloop"];
  const top3: typeof LISTING_PLATFORMS[0][] = [];
  // Best platform first
  if (bestPlatform) {
    const bp = LISTING_PLATFORMS.find((p) => p.key === bestPlatform || p.name.toLowerCase().includes(String(bestPlatform).toLowerCase()));
    if (bp && findListing(bp.key)) top3.push(bp);
  }
  // Fill remaining from priority order
  for (const key of PLATFORM_ORDER) {
    if (top3.length >= 3) break;
    if (top3.some((t) => t.key === key)) continue;
    const plat = LISTING_PLATFORMS.find((p) => p.key === key);
    if (plat && findListing(plat.key)) top3.push(plat);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column" }}>

      {/* ── BLOCK 1: Intelligence Strip ── */}
      <div style={{ display: "flex", alignItems: "center", padding: "12px 16px", background: "rgba(0,188,212,0.06)", border: "1px solid rgba(0,188,212,0.2)", borderLeft: "3px solid #00bcd4", borderRadius: 8, marginBottom: 16 }}>
        <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ background: "rgba(0,188,212,0.15)", color: "#00bcd4", padding: "2px 8px", borderRadius: 4, fontSize: 10, fontWeight: 700 }}>⚡ MegaBot</span>
          <span style={{ fontSize: 9, color: "var(--text-muted)" }}>{agentCount > 0 ? `${agentCount} AI Engines` : "AI Analysis"}</span>
        </div>
        <div style={{ width: 1, height: 20, background: "var(--bg-card-hover)", margin: "0 12px" }} />
        {bestPlatform && (
          <>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 9, color: "var(--text-muted)" }}>{"\u{1F3C6}"} Best Platform</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>{String(bestPlatform).slice(0, 20)}</div>
            </div>
            <div style={{ width: 1, height: 20, background: "var(--bg-card-hover)", margin: "0 12px" }} />
          </>
        )}
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 9, color: "var(--text-muted)" }}>{"\u23F1\uFE0F"} Est. Sale</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>{estimatedDays || "\u2013"} <span style={{ fontSize: 10, color: "#00bcd4" }}>days</span></div>
        </div>
      </div>

      {/* ── BLOCK 2: AI Summary Line ── */}
      {execSummary && (
        <div style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 14 }}>
          <span style={{ background: "#f5a623", color: "#0a1929", fontSize: 8, fontWeight: 700, padding: "2px 7px", borderRadius: 4, flexShrink: 0, marginTop: 1 }}>Strategy</span>
          <span style={{ fontSize: 11, fontStyle: "italic", color: "var(--text-secondary)", lineHeight: 1.5 }}>{String(execSummary).split(". ").slice(0, 2).join(". ")}.</span>
        </div>
      )}

      {/* ── BLOCK 3: Featured Platform Cards (Top 3) ── */}
      <div style={{ marginBottom: 6 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-primary)", marginBottom: 2 }}>{"\u{1F680}"} Ready to Launch</div>
        <div style={{ fontSize: 10, color: "var(--text-muted)", marginBottom: 10 }}>Top platforms {"\u2014"} copy and post</div>
      </div>

      {top3.map((plat) => {
        const listing = findListing(plat.key);
        if (!listing) return null;
        const title = getTitle(listing, plat.key);
        const price = getPrice(listing, plat.key);
        const tags = (listing.tags || []).slice(0, 4);
        const isCopied = copiedPlatform === plat.key;

        return (
          <div key={plat.key} style={{ background: "var(--bg-card)", borderLeft: `4px solid ${plat.color}`, borderTop: "1px solid var(--border-default)", borderRight: "1px solid var(--border-default)", borderBottom: "1px solid var(--border-default)", borderRadius: 10, padding: "14px 16px", marginBottom: 10 }}>
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>{plat.icon} {plat.name}</span>
              {price != null && <span style={{ fontSize: 13, fontWeight: 700, color: "#00bcd4" }}>${price}</span>}
            </div>
            {/* Title */}
            <div style={{ fontSize: 11, color: "var(--text-secondary)", lineHeight: 1.4, margin: "8px 0 6px", overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as const }}>{title}</div>
            {/* Tags */}
            {tags.length > 0 && (
              <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 10 }}>
                {tags.map((tag: string, i: number) => (
                  <span key={i} style={{ fontSize: 9, padding: "2px 7px", borderRadius: 20, background: "rgba(0,188,212,0.12)", border: "1px solid rgba(0,188,212,0.3)", color: "#00bcd4" }}>{tag.startsWith("#") ? tag : `#${tag}`}</span>
                ))}
              </div>
            )}
            {/* Actions */}
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => { const lst = findListing(plat.key); if (lst) { navigator.clipboard.writeText(getFullText(lst, plat.key)); setCopiedPlatform(plat.key); setTimeout(() => setCopiedPlatform(null), 2000); fetch("/api/listings/save", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ itemId, platform: plat.key, status: "COPIED" }) }).catch(() => {}); } }} style={{ flex: 65, height: 38, background: isCopied ? plat.color : `rgba(${plat.color === "#e53238" ? "229,50,56" : plat.color === "#1877f2" ? "24,119,242" : plat.color === "#e1306c" ? "225,48,108" : plat.color === "#f1641e" ? "241,100,30" : "0,188,212"},0.15)`, border: `1px solid ${plat.color}`, color: isCopied ? "#000" : plat.color, fontSize: 11, fontWeight: 700, borderRadius: 7, cursor: "pointer", transition: "all 0.2s" }}>
                {isCopied ? "✓ Copied!" : `📋 Copy ${plat.name}`}
              </button>
              <a href={plat.url} target="_blank" rel="noopener noreferrer" style={{ flex: 33, height: 38, display: "flex", alignItems: "center", justifyContent: "center", background: "transparent", border: "1px solid var(--border-default)", color: "var(--text-secondary)", fontSize: 11, borderRadius: 7, textDecoration: "none", cursor: "pointer" }}>Open {"\u2192"}</a>
            </div>
          </div>
        );
      })}

      {/* ── BLOCK 4: Copy All + View All ── */}
      <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
        <button onClick={() => { const lines: string[] = []; for (const plat of LISTING_PLATFORMS) { const lst = findListing(plat.key); if (!lst?.title) continue; lines.push(`--- ${plat.name} ---\nTitle: ${lst.title}\nPrice: $${lst.price || 0}\n${lst.description || ""}\n${lst.tags?.length ? `Tags: ${lst.tags.join(", ")}` : ""}\n`); } navigator.clipboard.writeText(lines.join("\n")); setCopiedPlatform("__all__"); setTimeout(() => setCopiedPlatform(null), 2500); }} style={{ flex: 58, height: 40, background: copiedPlatform === "__all__" ? "rgba(76,175,80,0.15)" : "linear-gradient(135deg, rgba(0,188,212,0.2), rgba(0,229,255,0.1))", border: "1px solid #00bcd4", color: copiedPlatform === "__all__" ? "#4caf50" : "#00bcd4", fontSize: 11, fontWeight: 700, borderRadius: 8, cursor: "pointer" }}>
          {copiedPlatform === "__all__" ? "✓ All Copied!" : "📋 Copy All 13 Platforms"}
        </button>
        <button onClick={() => { window.location.href = `/bots/listbot?item=${itemId}`; }} style={{ flex: 40, height: 40, background: "var(--ghost-bg)", border: "1px solid var(--border-default)", color: "var(--text-secondary)", fontSize: 11, borderRadius: 8, cursor: "pointer" }}>
          {"\u{1F4CA}"} All 13 Platforms {"\u2192"}
        </button>
      </div>

      {/* ── BLOCK 5: Progress Bar ── */}
      <div style={{ marginTop: 14, marginBottom: 6 }}>
        <div style={{ height: 3, borderRadius: 2, background: "var(--ghost-bg)", overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${Math.round((copiedCount / 13) * 100)}%`, background: "linear-gradient(90deg, #00bcd4, #00e5ff)", borderRadius: 2, transition: "width 0.4s ease" }} />
        </div>
        <div style={{ fontSize: 9, color: "var(--text-muted)", marginTop: 4 }}>{copiedCount} of 13 platforms reached</div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   PANEL 6: Listing Creator (PAID — requires credits)
   ═══════════════════════════════════════════ */

function ListingCreatorPanel({ aiData, itemId, onSuperBoost, onListBotRun, boosting, boosted, boostResult, boostError, listBotResult, listBotLoading, listBotError, collapsed, onToggle }: {
  aiData: any;
  itemId: string;
  onSuperBoost: () => void;
  onListBotRun: () => void;
  boosting: boolean;
  boosted: boolean;
  boostResult: any;
  boostError?: string | null;
  listBotResult: any;
  listBotLoading: boolean;
  listBotError?: string | null;
  collapsed?: boolean;
  onToggle?: () => void;
}) {
  const hasAnalysis = !!aiData;
  const hasListBotData = !!listBotResult;
  const [copiedPlatform, setCopiedPlatform] = useState<string | null>(null);
  const [listOpenSections, setListOpenSections] = useState<Set<string>>(
    new Set(["list-platforms", "megabot-results"])
  );
  const toggleListSection = (id: string) => {
    setListOpenSections(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const listings = listBotResult?.listings || {};
  const platformKeys = Object.keys(listings);
  const platformCount = platformKeys.length;

  const PLAT_META: Record<string, { icon: string; name: string }> = {
    ebay: { icon: "🏷️", name: "eBay" },
    facebook_marketplace: { icon: "📘", name: "Facebook" },
    facebook_groups: { icon: "👥", name: "FB Groups" },
    instagram: { icon: "📸", name: "Instagram" },
    tiktok: { icon: "🎵", name: "TikTok" },
    etsy: { icon: "🧡", name: "Etsy" },
    craigslist: { icon: "📋", name: "Craigslist" },
    mercari: { icon: "🔴", name: "Mercari" },
    offerup: { icon: "🏪", name: "OfferUp" },
    poshmark: { icon: "👗", name: "Poshmark" },
  };

  function getTitle(listing: any, p: string): string {
    if (p === "facebook_groups") return (listing.post_text || "").slice(0, 50) + "...";
    if (p === "instagram") return (listing.caption || "").slice(0, 50) + "...";
    if (p === "tiktok") return listing.hook_line || (listing.caption || "").slice(0, 50);
    return listing.title || "";
  }

  function getPrice(listing: any, p: string): number | null {
    if (p === "ebay") return listing.buy_it_now_price || listing.starting_price || null;
    return listing.price ?? null;
  }

  function getFullText(listing: any, p: string): string {
    if (p === "ebay") return `${listing.title}\n\n${(listing.description_html || "").replace(/<[^>]+>/g, "")}`;
    if (p === "facebook_groups") return listing.post_text || "";
    if (p === "instagram") return `${listing.caption}\n\n${(listing.hashtags || []).join(" ")}`;
    if (p === "tiktok") return `${listing.caption}\n\n${listing.video_concept || ""}`;
    return `${listing.title || ""}\n\n${listing.description || listing.body || ""}`;
  }

  function copyPlatform(p: string) {
    const listing = listings[p];
    if (!listing) return;
    navigator.clipboard.writeText(getFullText(listing, p));
    setCopiedPlatform(p);
    setTimeout(() => setCopiedPlatform(null), 2000);
  }

  // Show top 3 platforms for mini previews
  const topPlatforms = platformKeys.slice(0, 3);

  return (
    <GlassCard>
      <PanelHeader icon="📋" title="Listing Creator" hasData={hasListBotData} badge={hasListBotData ? `${platformCount} LISTINGS` : "LISTBOT"} collapsed={collapsed} onToggle={onToggle}
        preview={hasListBotData ? `${platformCount} platform listings ready` : "Ready to generate"}
      />

      {collapsed && hasListBotData && <CollapsedSummary botType="listing" data={{ platformCount, bestPlatform: listBotResult?.best_platform || listBotResult?.top_platforms?.[0] || null, topPlatforms: platformKeys.slice(0, 5), summary: listBotResult?.executive_summary || null }} megaData={boosted ? boostResult : undefined} buttons={<>
        {onListBotRun && <button onClick={onListBotRun} style={{ padding: "0.3rem 0.65rem", fontSize: "0.62rem", fontWeight: 600, borderRadius: "0.4rem", border: "1px solid var(--border-default)", background: "var(--ghost-bg)", color: "var(--text-secondary)", cursor: "pointer", minHeight: "32px" }}>📋 Re-Run · 0.5 cr</button>}
        {onSuperBoost && <button onClick={onSuperBoost} style={{ padding: "0.3rem 0.65rem", fontSize: "0.62rem", fontWeight: 600, borderRadius: "0.4rem", border: "none", background: "linear-gradient(135deg, #00bcd4, #009688)", color: "#fff", cursor: "pointer", minHeight: "32px" }}>{boosted ? "🔄 MegaBot Re-Run · 3 cr" : "⚡ MegaBot · 5 cr"}</button>}
        <a href="/bots/listbot" style={{ padding: "0.3rem 0.65rem", fontSize: "0.62rem", fontWeight: 600, borderRadius: "0.4rem", border: "1px solid rgba(0,188,212,0.3)", color: "#00bcd4", textDecoration: "none", display: "inline-flex", alignItems: "center", minHeight: "32px" }}>Open ListBot →</a>
      </>} />}
      {collapsed && !hasListBotData && (
        <div style={{ padding: "0.65rem 0.85rem", display: "flex", alignItems: "center", gap: "0.65rem" }}>
          <span style={{ fontSize: "1.3rem" }}>📋</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-primary)" }}>Listing Creator</div>
            <div style={{ fontSize: "0.62rem", color: "var(--text-muted)", lineHeight: 1.4 }}>Optimized listings for 13+ selling platforms</div>
          </div>
          <div style={{ display: "flex", gap: "0.3rem", flexShrink: 0 }}>
            {onListBotRun && <button onClick={onListBotRun} style={{ padding: "0.3rem 0.65rem", fontSize: "0.62rem", fontWeight: 600, borderRadius: "0.4rem", border: "1px solid var(--border-default)", background: "var(--ghost-bg)", color: "var(--text-secondary)", cursor: "pointer", minHeight: "32px" }}>📋 ListBot · 1 cr</button>}
            <a href="/bots/listbot" style={{ padding: "0.3rem 0.65rem", fontSize: "0.62rem", fontWeight: 600, borderRadius: "0.4rem", border: "1px solid rgba(0,188,212,0.3)", color: "#00bcd4", textDecoration: "none", display: "inline-flex", alignItems: "center", minHeight: "32px" }}>Open ListBot →</a>
          </div>
        </div>
      )}

      <div style={{ display: collapsed ? "none" : "flex", flexDirection: "column" as const, flex: 1 }}>
      <div style={{ padding: "1.25rem" }}>
        {!hasAnalysis ? (
          <EmptyState message="Run AI analysis first to enable listing creation." />
        ) : listBotLoading ? (
          <BotLoadingState botName="ListBot" />
        ) : !hasListBotData ? (
          /* ── NOT RUN or ERROR ── */
          <>
            {listBotError && (
              <div style={{
                padding: "0.5rem 0.75rem", borderRadius: "0.4rem", width: "100%",
                background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)",
                fontSize: "0.75rem", color: "#ef4444", lineHeight: 1.4, textAlign: "left",
              }}>
                {listBotError}
              </div>
            )}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", flex: 1, justifyContent: "center", padding: "1.25rem", gap: "0.5rem" }}>
              <span style={{ fontSize: "1.5rem" }}>📋</span>
              <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--text-primary)" }}>Listing Creator</div>
              <p style={{ fontSize: "0.68rem", color: "var(--text-secondary)", lineHeight: 1.5, maxWidth: 300, margin: 0 }}>SEO-optimized listings formatted for 13+ selling platforms.</p>
              <div style={{ width: "100%", maxWidth: 300, padding: "0.5rem 0.65rem", background: "var(--ghost-bg)", borderRadius: "0.5rem", border: "1px solid var(--border-default)", textAlign: "left" }}>
                <div style={{ fontSize: "0.55rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.25rem" }}>What You&apos;ll Get</div>
                {[{ icon: "📋", text: "SEO-optimized descriptions" }, { icon: "🏪", text: "13+ platform formatting" }, { icon: "📋", text: "One-click copy to clipboard" }].map((b, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.3rem", padding: "0.15rem 0", fontSize: "0.62rem", color: "var(--text-secondary)" }}><span style={{ fontSize: "0.6rem", flexShrink: 0 }}>{b.icon}</span><span>{b.text}</span></div>
                ))}
              </div>
              <div style={{ display: "flex", gap: "0.4rem", justifyContent: "center", flexWrap: "wrap", marginTop: "0.5rem", paddingTop: "0.4rem", borderTop: "1px solid var(--border-default)", width: "100%" }}>
                {onListBotRun && <button onClick={onListBotRun} style={{ padding: "0.3rem 0.65rem", fontSize: "0.62rem", fontWeight: 600, borderRadius: "0.4rem", border: "1px solid var(--border-default)", background: "var(--ghost-bg)", color: "var(--text-secondary)", cursor: "pointer", minHeight: "32px" }}>📋 ListBot · 1 cr</button>}
                <a href="/bots/listbot" style={{ padding: "0.3rem 0.65rem", fontSize: "0.62rem", fontWeight: 600, borderRadius: "0.4rem", border: "1px solid rgba(0,188,212,0.3)", color: "#00bcd4", textDecoration: "none", display: "inline-flex", alignItems: "center", minHeight: "32px" }}>Open ListBot →</a>
              </div>
            </div>
          </>
        ) : (
          /* ── HAS LISTBOT DATA ── */
          <>
            <AccordionHeader id="list-platforms" icon="🏪" title="PLATFORM LISTINGS" subtitle={`${platformCount} platforms`} isOpen={listOpenSections.has("list-platforms")} onToggle={toggleListSection} />
            {listOpenSections.has("list-platforms") && (<div style={{ padding: "0.35rem 0" }}>
            {/* PATH 1 — Single AI result (no MegaBot yet) */}
            {!boostResult?.listings && (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                <div style={{ fontSize: "0.78rem", fontWeight: 600, color: "#00bcd4", display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.25rem" }}>
                  ✍️ {platformCount} platform listings ready
                </div>
                <div style={{ height: 4, background: "var(--ghost-bg)", borderRadius: 2, overflow: "hidden", marginBottom: "0.4rem" }}>
                  <div style={{ height: "100%", width: "100%", background: "linear-gradient(90deg, #00bcd4, #00e5ff)", borderRadius: 2 }} />
                </div>
                {topPlatforms.map((key) => {
                  const listing = listings[key];
                  const meta = PLAT_META[key] ?? { icon: "🔗", name: key };
                  if (!listing) return null;
                  const title = getTitle(listing, key);
                  const price = getPrice(listing, key);
                  const isCopied = copiedPlatform === key;
                  return (
                    <div key={key} style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.45rem 0.6rem", background: "var(--ghost-bg)", borderRadius: "0.5rem", border: "1px solid rgba(0,188,212,0.15)" }}>
                      <span style={{ fontSize: "1rem" }}>{meta.icon}</span>
                      <span style={{ flex: 1, fontSize: "0.72rem", color: "var(--text-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{title.slice(0, 50)}</span>
                      {price != null && <span style={{ fontSize: "0.72rem", color: "#00bcd4", fontWeight: 600, marginRight: "0.35rem" }}>${price}</span>}
                      <button onClick={() => copyPlatform(key)} style={{ padding: "0.2rem 0.55rem", background: isCopied ? "#00bcd4" : "transparent", border: "1px solid #00bcd4", borderRadius: "0.35rem", color: isCopied ? "#000" : "#00bcd4", fontSize: "0.65rem", cursor: "pointer", transition: "all 0.2s ease", minHeight: "28px" }}>
                        {isCopied ? "✓" : "📋"}
                      </button>
                    </div>
                  );
                })}
                {platformCount > 3 && (
                  <a href={`/bots/listbot?item=${itemId}`} style={{ fontSize: "0.72rem", color: "#00bcd4", opacity: 0.8, textDecoration: "none", marginTop: "0.15rem" }}>
                    +{platformCount - 3} more platforms →
                  </a>
                )}
                <a href={`/bots/listbot?item=${itemId}`} style={{ fontSize: "0.78rem", color: "#00bcd4", fontWeight: 600, textDecoration: "none", display: "flex", alignItems: "center", gap: "0.35rem", marginTop: "0.25rem" }}>
                  🚀 Post All → See all {platformCount} listings
                </a>
              </div>
            )}

            {/* PATH 2 — MegaBot result: full command center */}
            {boostResult && (() => {
              const megaListings = boostResult?.consensus?.listings || (Array.isArray(boostResult?.providers) ? boostResult.providers.find((p: any) => p.result?.listings)?.result?.listings : null) || {};
              const mergedListings = { ...listings, ...megaListings };
              const mergedCount = Object.keys(mergedListings).length;
              return (
                <ListingCommandCenter listings={mergedListings} listBotResult={listBotResult} boostResult={boostResult} itemId={itemId} getFullText={getFullText} copiedPlatform={copiedPlatform} setCopiedPlatform={setCopiedPlatform} copyPlatform={copyPlatform} getTitle={getTitle} getPrice={getPrice} platformCount={mergedCount} />
              );
            })()}
            </div>)}
          </>
        )}

        <AccordionHeader id="list-strategy" icon="🎯" title="SEO & STRATEGY" isOpen={listOpenSections.has("list-strategy")} onToggle={toggleListSection} />
        {listOpenSections.has("list-strategy") && (<div style={{ padding: "0.35rem 0" }}>
        {/* MegaBot results — outside the hasListBotData conditional so it shows even without 1cr run */}
        {boostError && !boosting && (
          <div style={{
            padding: "0.5rem 0.75rem", borderRadius: "0.4rem", marginTop: "0.5rem",
            background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)",
            fontSize: "0.75rem", color: "#ef4444", lineHeight: 1.4,
          }}>
            {boostError}
          </div>
        )}
        {boosted && boostResult && (<>
          <AccordionHeader id="megabot-results" icon="⚡" title="MEGABOT MULTI-AI ANALYSIS" subtitle={`${boostResult.agreementScore ?? "?"}% Agreement`} isOpen={listOpenSections.has("megabot-results")} onToggle={toggleListSection} accentColor="#8b5cf6" badge={`${(boostResult.providers || []).filter((p: any) => p.data || !p.error).length} AI`} />
          {listOpenSections.has("megabot-results") && <MegaBotBoostResults botType="listing" result={boostResult} aiData={aiData} />}
        </>)}
        </div>)}
      </div>

      {hasListBotData && (
        <div style={{ padding: "0 1.25rem 0.75rem" }}>
          <a
            href={`/bots/listbot?item=${itemId}`}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.5rem",
              width: "100%",
              padding: "0.75rem 1.5rem",
              minHeight: "52px",
              background: "linear-gradient(135deg, #00bcd4, #009688)",
              color: "#fff",
              fontWeight: 700,
              fontSize: "0.88rem",
              borderRadius: "0.65rem",
              textDecoration: "none",
              border: "none",
              cursor: "pointer",
              boxShadow: "0 2px 12px rgba(0,188,212,0.25)",
            }}
          >
            🚀 Open Publish Hub — Post to 13 Platforms
          </a>
        </div>
      )}

      <PanelFooter
        botName="ListBot"
        botLink="/bots/listbot"
        itemId={itemId}
        botIcon="✍️"
        botCost={1}
        onBotRun={hasAnalysis ? onListBotRun : undefined}
        onSuperBoost={onSuperBoost}
        boosting={boosting}
        boosted={boosted}
        hasResult={!!listBotResult}
             />
      </div>
    </GlassCard>
  );
}

/* ═══════════════════════════════════════════
   PANEL 7: Vehicle Specialist (PAID — CONDITIONAL)
   ═══════════════════════════════════════════ */

const VEHICLE_KEYWORDS = ["car", "truck", "vehicle", "automobile", "suv", "van", "motorcycle", "atv", "boat", "tractor", "trailer", "rv", "camper"];

function CarBotPanel({ aiData, itemId, category, collapsed, onToggle, carBotResult, carBotLoading, onCarBotRun, onSuperBoost, boosting, boosted, boostResult, isVehicle }: {
  aiData: any;
  itemId: string;
  category: string;
  collapsed?: boolean;
  onToggle?: () => void;
  carBotResult?: any;
  carBotLoading?: boolean;
  onCarBotRun?: () => void;
  onSuperBoost?: () => void;
  boosting?: boolean;
  boosted?: boolean;
  boostResult?: any;
  isVehicle?: boolean;
}) {
  const hasAnalysis = !!aiData;
  const hasData = !!carBotResult;
  const [carSections, setCarSections] = useState<Set<string>>(new Set(["car-condition", "car-valuation", "car-nhtsa", "car-summary", "megabot-results"]));
  const toggleCarSection = (id: string) => { setCarSections(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; }); };
  const ident = carBotResult?.identification;
  const cond = carBotResult?.condition_assessment;
  const val = carBotResult?.valuation;
  const strat = carBotResult?.selling_strategy;
  const market = carBotResult?.market_analysis;
  const history = carBotResult?.vehicle_history_context;
  const funFacts = carBotResult?.fun_facts;

  // ── VIN + Mileage state ──
  const [vin, setVin] = useState("");
  const [vinData, setVinData] = useState<any>(null);
  const [vinLoading, setVinLoading] = useState(false);
  const [vinError, setVinError] = useState("");
  const [mileage, setMileage] = useState("");
  const [mileageType, setMileageType] = useState<"exact" | "estimated">("exact");
  const [savingData, setSavingData] = useState(false);
  const [sellerDetails, setSellerDetails] = useState<any>({});
  const [vinSectionOpen, setVinSectionOpen] = useState(false);

  // Load saved vehicle data
  useEffect(() => {
    fetch(`/api/bots/carbot/${itemId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.vehicleData) {
          const vd = data.vehicleData;
          setVin(vd.vin || "");
          setVinData(vd.vinDecoded || null);
          setMileage(vd.mileage || "");
          setMileageType(vd.mileageType || "exact");
          setSellerDetails(vd);
        }
      })
      .catch(() => {});
  }, [itemId]);

  function formatVin(v: string): string {
    return v.toUpperCase().replace(/[^A-HJ-NPR-Z0-9]/g, "").substring(0, 17);
  }

  async function decodeVin() {
    if (vin.length !== 17) { setVinError("VIN must be 17 characters"); return; }
    setVinLoading(true);
    setVinError("");
    try {
      const res = await fetch(`https://vpic.nhtsa.dot.gov/api/vehicles/decodevin/${vin}?format=json`);
      const data = await res.json();
      const results = (data.Results || []).filter((r: any) => r.Value && r.Value.trim() && r.Value !== "Not Applicable");
      const decoded: Record<string, string> = {};
      for (const r of results) decoded[r.Variable] = r.Value;
      setVinData(decoded);
      saveVehicleData({ vin, vinDecoded: decoded, mileage, mileageType, ...sellerDetails });
    } catch {
      setVinError("VIN decode failed — check number and try again");
    }
    setVinLoading(false);
  }

  async function saveVehicleData(extra?: any) {
    setSavingData(true);
    try {
      await fetch(`/api/bots/carbot/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(extra || { vin, vinDecoded: vinData, mileage, mileageType, ...sellerDetails }),
      });
    } catch { /* ignore */ }
    setSavingData(false);
  }

  const CB = "#2196f3";
  const CB_BG = "rgba(33,150,243,0.06)";
  const CB_BORDER = "rgba(33,150,243,0.2)";

  // Compute overall letter grade from condition scores
  function getGrade(scores: { exterior?: number; interior?: number; mechanical?: number }) {
    const vals = [scores.exterior, scores.interior, scores.mechanical].filter((v): v is number => v != null);
    if (vals.length === 0) return { letter: "—", color: "var(--text-muted)" };
    const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
    if (avg >= 9) return { letter: "A+", color: "#4ade80" };
    if (avg >= 8) return { letter: "A", color: "#4ade80" };
    if (avg >= 7) return { letter: "B+", color: "#4ade80" };
    if (avg >= 6) return { letter: "B", color: "#f59e0b" };
    if (avg >= 5) return { letter: "C+", color: "#f59e0b" };
    if (avg >= 4) return { letter: "C", color: "#f59e0b" };
    return { letter: "D", color: "#ef4444" };
  }

  const extScore = cond?.exterior?.score ?? cond?.exterior_score;
  const intScore = cond?.interior?.score ?? cond?.interior_score;
  const mechScore = cond?.mechanical?.score ?? cond?.mechanical_score;
  const grade = cond ? getGrade({ exterior: extScore, interior: intScore, mechanical: mechScore }) : null;
  const ymm = ident ? [ident.year, ident.make, ident.model].filter(Boolean).join(" ") : [aiData?.vehicle_year, aiData?.vehicle_make, aiData?.vehicle_model].filter(Boolean).join(" ");
  const ppValue = val?.private_party_value;
  const previewParts = [ymm];
  if (grade && grade.letter !== "—") previewParts.push(`Grade ${grade.letter}`);
  if (ppValue?.low && ppValue?.high) previewParts.push(`$${Math.round(ppValue.low / 1000)}K–$${Math.round(ppValue.high / 1000)}K`);
  if (market?.demand_level) previewParts.push(`${market.demand_level} demand`);

  // Non-vehicle intro state
  if (!isVehicle) {
    return (
      <GlassCard>
        <PanelHeader icon="🚗" title="Vehicle Specialist" hasData={false} collapsed={collapsed} onToggle={onToggle}
          preview="Upload a vehicle to activate"
        />
        {collapsed && (
          <div style={{ padding: "0.75rem 1rem", textAlign: "center" as const, display: "flex", flexDirection: "column" as const, alignItems: "center", gap: "0.4rem", flex: 1, justifyContent: "space-evenly" }}>
            <span style={{ fontSize: "1.5rem" }}>🚗</span>
            <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--text-primary)" }}>Vehicle Specialist</div>
            <p style={{ fontSize: "0.68rem", color: "var(--text-secondary)", lineHeight: 1.5, maxWidth: 300, margin: 0 }}>VIN decode, condition grading, market value, and local selling strategy for vehicles.</p>
            <div style={{ width: "100%", maxWidth: 300, padding: "0.5rem 0.65rem", background: "var(--ghost-bg)", borderRadius: "0.5rem", border: "1px solid var(--border-default)", textAlign: "left" as const }}>
              <div style={{ fontSize: "0.55rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" as const, letterSpacing: "0.05em", marginBottom: "0.25rem" }}>What You&apos;ll Get</div>
              {[{ icon: "🔑", text: "Full VIN decode" }, { icon: "📊", text: "Market pricing" }, { icon: "🤝", text: "Pickup planning" }].map((b: any, i: number) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.3rem", padding: "0.15rem 0", fontSize: "0.62rem", color: "var(--text-secondary)" }}><span style={{ fontSize: "0.6rem", flexShrink: 0 }}>{b.icon}</span><span>{b.text}</span></div>
              ))}
            </div>
            <div style={{ display: "flex", gap: "0.4rem", justifyContent: "center", flexWrap: "wrap" as const, marginTop: "0.25rem", paddingTop: "0.4rem", borderTop: "1px solid var(--border-default)", width: "100%" }}>
              <a href={`/bots/carbot?item=${itemId}`} style={{ padding: "0.3rem 0.65rem", fontSize: "0.62rem", fontWeight: 600, borderRadius: "0.4rem", border: "1px solid rgba(0,188,212,0.3)", color: "#00bcd4", textDecoration: "none", display: "inline-flex", alignItems: "center", minHeight: "32px" }}>Open CarBot →</a>
            </div>
          </div>
        )}
        <div style={{ display: collapsed ? "none" : "flex", flexDirection: "column" as const, flex: 1 }}>
          <div style={{ padding: "1.25rem" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem", alignItems: "center", textAlign: "center" }}>
              <div style={{ fontSize: "2rem" }}>🚗</div>
              <p style={{ fontSize: "0.88rem", fontWeight: 700, color: "var(--text-primary)", lineHeight: 1.4, maxWidth: 380 }}>
                Vehicle Specialist
              </p>
              <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)", lineHeight: 1.6, maxWidth: 380 }}>
                Selling a car, truck, motorcycle, or boat? CarBot provides VIN decode, condition grading, market value, and local selling strategy.
              </p>
              <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", lineHeight: 1.5, maxWidth: 360 }}>
                Upload a vehicle photo and run AI analysis to activate CarBot.
              </p>
              <div style={{ marginTop: "0.5rem", padding: "0.65rem 0.85rem", background: "var(--ghost-bg)", borderRadius: "0.6rem", border: "1px solid var(--border-default)", width: "100%", maxWidth: 360, textAlign: "left" }}>
                <div style={{ fontSize: "0.62rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.4rem" }}>What You&apos;ll Get</div>
                {[{ icon: "🔑", text: "Full VIN decode with vehicle history and specs" }, { icon: "📊", text: "Market value based on year, make, model, and condition" }, { icon: "🤝", text: "Local pickup planning with safe meetup recommendations" }].map((b, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "0.4rem", padding: "0.3rem 0", fontSize: "0.68rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>
                    <span style={{ flexShrink: 0, fontSize: "0.7rem" }}>{b.icon}</span>
                    <span>{b.text}</span>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: "0.5rem", padding: "0.5rem 0.75rem", background: "var(--ghost-bg)", borderRadius: "0.5rem", border: "1px solid var(--border-default)", width: "100%", maxWidth: 360, textAlign: "left" }}>
                <div style={{ fontSize: "0.58rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.35rem" }}>How It Works</div>
                {["Upload a vehicle photo", "AI identifies make, model, year", "Get market value and selling strategy"].map((step, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.25rem 0", fontSize: "0.65rem", color: "var(--text-secondary)" }}>
                    <span style={{ width: "20px", height: "20px", borderRadius: "50%", background: "linear-gradient(135deg, #00bcd4, #009688)", color: "#fff", fontSize: "0.55rem", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{i + 1}</span>
                    <span>{step}</span>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: "0.4rem", display: "flex", justifyContent: "center", gap: "0.75rem", fontSize: "0.58rem", color: "var(--text-muted)", width: "100%", maxWidth: 360 }}>
                {[{ value: "VIN", label: "Full decode" }, { value: "KBB", label: "Market data" }, { value: "Local", label: "Pickup ready" }].map((m, i) => (
                  <div key={i} style={{ textAlign: "center" }}>
                    <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "#00bcd4" }}>{m.value}</div>
                    <div style={{ fontSize: "0.5rem", color: "var(--text-muted)" }}>{m.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <PanelFooter
            botName="CarBot"
            botLink={`/bots/carbot?item=${itemId}`}
            itemId={itemId}
            botIcon="🚗"
            botCost={1}
          />
        </div>
      </GlassCard>
    );
  }

  return (
    <GlassCard>
      <PanelHeader icon="🚗" title="Vehicle Specialist" hasData={hasData} badge={hasData ? undefined : "REQUIRES CREDITS"} collapsed={collapsed} onToggle={onToggle}
        preview={hasData ? previewParts.filter(Boolean).join(" · ") : "Not analyzed yet"}
      />

      {collapsed && hasData && <CollapsedSummary botType="carbot" data={{ label: ymm || "Vehicle assessment", grade: grade?.letter, gradeColor: grade?.color, valueLow: ppValue?.low, valueHigh: ppValue?.high, demand: market?.demand_level }} buttons={<>
        {onCarBotRun && <button onClick={onCarBotRun} style={{ padding: "0.3rem 0.65rem", fontSize: "0.62rem", fontWeight: 600, borderRadius: "0.4rem", border: "1px solid var(--border-default)", background: "var(--ghost-bg)", color: "var(--text-secondary)", cursor: "pointer", minHeight: "32px" }}>🚗 Re-Run · 0.5 cr</button>}
        {onSuperBoost && <button onClick={onSuperBoost} style={{ padding: "0.3rem 0.65rem", fontSize: "0.62rem", fontWeight: 600, borderRadius: "0.4rem", border: "none", background: "linear-gradient(135deg, #00bcd4, #009688)", color: "#fff", cursor: "pointer", minHeight: "32px" }}>{boosted ? "🔄 MegaBot Re-Run · 3 cr" : "⚡ MegaBot · 5 cr"}</button>}
        <a href={`/bots/carbot?item=${itemId}`} style={{ padding: "0.3rem 0.65rem", fontSize: "0.62rem", fontWeight: 600, borderRadius: "0.4rem", border: "1px solid rgba(0,188,212,0.3)", color: "#00bcd4", textDecoration: "none", display: "inline-flex", alignItems: "center", minHeight: "32px" }}>Open CarBot →</a>
      </>} />}
      {collapsed && !hasData && (
        <div style={{ padding: "0.65rem 0.85rem", display: "flex", alignItems: "center", gap: "0.65rem" }}>
          <span style={{ fontSize: "1.3rem" }}>🚗</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-primary)" }}>Vehicle Specialist</div>
            <div style={{ fontSize: "0.62rem", color: "var(--text-muted)", lineHeight: 1.4 }}>VIN decode, condition grading, and market valuation</div>
          </div>
          <div style={{ display: "flex", gap: "0.3rem", flexShrink: 0 }}>
            {onCarBotRun && <button onClick={onCarBotRun} style={{ padding: "0.3rem 0.65rem", fontSize: "0.62rem", fontWeight: 600, borderRadius: "0.4rem", border: "1px solid var(--border-default)", background: "var(--ghost-bg)", color: "var(--text-secondary)", cursor: "pointer", minHeight: "32px" }}>🚗 CarBot · 1 cr</button>}
            <a href={`/bots/carbot?item=${itemId}`} style={{ padding: "0.3rem 0.65rem", fontSize: "0.62rem", fontWeight: 600, borderRadius: "0.4rem", border: "1px solid rgba(0,188,212,0.3)", color: "#00bcd4", textDecoration: "none", display: "inline-flex", alignItems: "center", minHeight: "32px" }}>Open CarBot →</a>
          </div>
        </div>
      )}

      <div style={{ display: collapsed ? "none" : "flex", flexDirection: "column" as const, flex: 1 }}>
      <div style={{ padding: "1.25rem" }}>

        {/* ── VIN + MILEAGE INPUT (always visible when vehicle detected) ── */}
        <div style={{ marginBottom: "0.85rem" }}>
          <button
            onClick={() => setVinSectionOpen(!vinSectionOpen)}
            style={{
              width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "0.5rem 0.65rem", borderRadius: "0.5rem", border: `1px solid ${CB_BORDER}`,
              background: CB_BG, cursor: "pointer", color: "inherit",
            }}
          >
            <span style={{ fontSize: "0.72rem", fontWeight: 700, color: CB }}>
              {vinData ? `✅ VIN Decoded` : vin ? `🔑 VIN: ${vin}` : "🔑 Enter VIN + Mileage"}
              {mileage ? ` · ${Number(mileage).toLocaleString()} mi` : ""}
            </span>
            <span style={{ fontSize: "0.6rem", color: "var(--text-muted)" }}>{vinSectionOpen ? "▼" : "▶"}</span>
          </button>

          {vinSectionOpen && (
            <div style={{ marginTop: "0.5rem", padding: "0.75rem", borderRadius: "0.5rem", border: "1px solid var(--border-default, var(--border-default))", background: "var(--bg-card)" }}>
              {/* VIN Photo Suggestion */}
              <div style={{
                padding: "0.6rem 0.75rem", marginBottom: "0.65rem",
                background: "rgba(0,188,212,0.04)",
                border: "1px solid rgba(0,188,212,0.15)",
                borderRadius: "0.5rem",
                display: "flex", alignItems: "flex-start", gap: "0.5rem",
              }}>
                <span style={{ fontSize: "1.1rem", flexShrink: 0, marginTop: "0.1rem" }}>📷</span>
                <div>
                  <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.15rem" }}>
                    Pro Tip: Photograph Your VIN
                  </div>
                  <p style={{ fontSize: "0.65rem", color: "var(--text-secondary)", lineHeight: 1.5, margin: 0 }}>
                    Our AI can read VIN numbers directly from your photos. Take a clear photo of:
                  </p>
                  <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" as const, marginTop: "0.3rem" }}>
                    {["Dashboard (through windshield)", "Door jamb sticker", "Engine bay plate"].map((loc, i) => (
                      <span key={i} style={{
                        fontSize: "0.58rem", padding: "2px 7px", borderRadius: "9999px",
                        background: "rgba(0,188,212,0.08)", color: "#00bcd4", fontWeight: 600,
                      }}>{loc}</span>
                    ))}
                  </div>
                  <p style={{ fontSize: "0.6rem", color: "var(--text-muted)", lineHeight: 1.4, margin: "0.25rem 0 0", fontStyle: "italic" }}>
                    A decoded VIN unlocks recall history, safety ratings, and factory specs.
                  </p>
                </div>
              </div>
              {/* VIN Input */}
              <div style={{ marginBottom: "0.65rem" }}>
                <div style={{ fontSize: "0.62rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.25rem" }}>VIN</div>
                <div style={{ display: "flex", gap: "0.4rem" }}>
                  <input
                    type="text"
                    value={vin}
                    onChange={(e) => setVin(formatVin(e.target.value))}
                    placeholder="17-character VIN"
                    maxLength={17}
                    style={{
                      flex: 1, padding: "0.45rem 0.6rem", fontSize: "0.78rem", fontFamily: "monospace",
                      letterSpacing: "0.08em", textTransform: "uppercase",
                      background: "var(--ghost-bg)", border: `1px solid ${vin.length === 17 ? CB : "var(--border-default)"}`,
                      borderRadius: "0.4rem", color: "var(--text-primary)", outline: "none",
                    }}
                  />
                  <button
                    onClick={decodeVin}
                    disabled={vin.length !== 17 || vinLoading}
                    style={{
                      padding: "0.45rem 0.75rem", fontSize: "0.68rem", fontWeight: 700,
                      borderRadius: "0.4rem", border: "none",
                      cursor: vin.length === 17 && !vinLoading ? "pointer" : "not-allowed",
                      background: vin.length === 17 ? `linear-gradient(135deg, ${CB}, #1976d2)` : "var(--ghost-bg)",
                      color: vin.length === 17 ? "#fff" : "var(--text-muted)",
                      opacity: vin.length !== 17 ? 0.5 : 1, whiteSpace: "nowrap",
                    }}
                  >
                    {vinLoading ? "..." : "Decode"}
                  </button>
                </div>
                <div style={{ fontSize: "0.55rem", color: "var(--text-muted)", marginTop: "0.15rem" }}>{vin.length}/17 — Door jamb, registration, or insurance card</div>
                {vinError && <div style={{ fontSize: "0.65rem", color: "#ef4444", marginTop: "0.2rem" }}>{vinError}</div>}
              </div>

              {/* VIN Decoded */}
              {vinData && (
                <div style={{ marginBottom: "0.65rem", padding: "0.6rem", borderRadius: "0.4rem", background: "rgba(74,222,128,0.04)", border: "1px solid rgba(74,222,128,0.15)" }}>
                  <div style={{ fontSize: "0.55rem", fontWeight: 700, color: "#4ade80", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.3rem" }}>VIN Decoded</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.12rem 1rem", fontSize: "0.68rem" }}>
                    {[
                      { l: "Make", v: vinData.Make }, { l: "Model", v: vinData.Model },
                      { l: "Year", v: vinData["Model Year"] }, { l: "Trim", v: vinData.Trim || vinData.Series },
                      { l: "Body", v: vinData["Body Class"] }, { l: "Drive", v: vinData["Drive Type"] },
                      { l: "Engine", v: vinData["Displacement (L)"] ? `${vinData["Displacement (L)"]}L ${vinData["Engine Number of Cylinders"] || ""}cyl` : null },
                      { l: "Fuel", v: vinData["Fuel Type - Primary"] },
                      { l: "Trans", v: vinData["Transmission Style"] },
                      { l: "Plant", v: vinData["Plant City"] ? `${vinData["Plant City"]}, ${vinData["Plant State"] || ""}` : null },
                    ].filter((f) => f.v).map((f) => (
                      <div key={f.l} style={{ display: "flex", justifyContent: "space-between" }}>
                        <span style={{ color: "var(--text-muted)" }}>{f.l}</span>
                        <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>{f.v}</span>
                      </div>
                    ))}
                  </div>
                  {/* Safety features */}
                  {(() => {
                    const sf = [
                      vinData["Anti-lock Braking System (ABS)"] === "Standard" && "ABS",
                      vinData["Electronic Stability Control (ESC)"] === "Standard" && "ESC",
                      vinData["Backup Camera"] === "Standard" && "Backup Cam",
                      vinData["Blind Spot Warning (BSW)"] === "Standard" && "BSW",
                      vinData["Forward Collision Warning (FCW)"] === "Standard" && "FCW",
                    ].filter(Boolean);
                    return sf.length > 0 ? (
                      <div style={{ marginTop: "0.3rem", display: "flex", gap: "0.2rem", flexWrap: "wrap" }}>
                        {sf.map((s) => (
                          <span key={s as string} style={{ padding: "0.08rem 0.3rem", borderRadius: "9999px", fontSize: "0.5rem", fontWeight: 600, background: "rgba(74,222,128,0.1)", color: "#4ade80", border: "1px solid rgba(74,222,128,0.2)" }}>
                            {s}
                          </span>
                        ))}
                      </div>
                    ) : null;
                  })()}
                </div>
              )}

              {/* Mileage */}
              <div style={{ marginBottom: "0.65rem" }}>
                <div style={{ fontSize: "0.62rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.25rem" }}>Mileage</div>
                <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                  <input
                    type="text"
                    value={mileage}
                    onChange={(e) => setMileage(e.target.value.replace(/[^\d]/g, ""))}
                    placeholder="e.g. 87000"
                    style={{
                      width: "110px", padding: "0.45rem 0.6rem", fontSize: "0.78rem",
                      background: "var(--ghost-bg)", border: "1px solid var(--border-default)",
                      borderRadius: "0.4rem", color: "var(--text-primary)", outline: "none",
                    }}
                  />
                  <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>mi</span>
                  <div style={{ display: "flex", gap: "0.5rem", marginLeft: "auto" }}>
                    {(["exact", "estimated"] as const).map((t) => (
                      <label key={t} style={{ display: "flex", alignItems: "center", gap: "0.2rem", cursor: "pointer", fontSize: "0.65rem", color: mileageType === t ? CB : "var(--text-muted)" }}>
                        <input type="radio" name={`mt_${itemId}`} checked={mileageType === t} onChange={() => setMileageType(t)} style={{ accentColor: CB, width: 12, height: 12 }} />
                        {t === "exact" ? "Exact" : "Est."}
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {/* Seller quick details */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.4rem", marginBottom: "0.65rem" }}>
                {[
                  { key: "titleStatus", label: "Title", opts: ["Clean", "Salvage", "Rebuilt"] },
                  { key: "owners", label: "Owners", opts: ["1", "2", "3+", "Unknown"] },
                  { key: "accidents", label: "Accidents", opts: ["none", "Minor", "Major", "Unknown"] },
                ].map((f) => (
                  <div key={f.key}>
                    <div style={{ fontSize: "0.55rem", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "0.1rem" }}>{f.label}</div>
                    <select
                      value={sellerDetails[f.key] || ""}
                      onChange={(e) => setSellerDetails((prev: any) => ({ ...prev, [f.key]: e.target.value }))}
                      style={{
                        width: "100%", padding: "0.35rem 0.45rem", fontSize: "0.72rem",
                        background: "var(--ghost-bg)", border: "1px solid var(--border-default)",
                        borderRadius: "0.35rem", color: "var(--text-primary)", outline: "none",
                      }}
                    >
                      <option value="">—</option>
                      {f.opts.map((o) => <option key={o} value={o}>{o === "none" ? "No accidents" : o}</option>)}
                    </select>
                  </div>
                ))}
                <div>
                  <div style={{ fontSize: "0.55rem", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "0.1rem" }}>Known Issues</div>
                  <input
                    type="text"
                    value={sellerDetails.knownIssues || ""}
                    onChange={(e) => setSellerDetails((prev: any) => ({ ...prev, knownIssues: e.target.value }))}
                    placeholder="Any problems?"
                    style={{
                      width: "100%", padding: "0.35rem 0.45rem", fontSize: "0.72rem",
                      background: "var(--ghost-bg)", border: "1px solid var(--border-default)",
                      borderRadius: "0.35rem", color: "var(--text-primary)", outline: "none",
                    }}
                  />
                </div>
              </div>

              {/* Save */}
              <button
                onClick={() => saveVehicleData()}
                disabled={savingData}
                style={{
                  width: "100%", padding: "0.45rem", fontSize: "0.72rem", fontWeight: 700,
                  borderRadius: "0.4rem", border: "none", cursor: "pointer",
                  background: `linear-gradient(135deg, ${CB}, #1976d2)`, color: "#fff",
                  opacity: savingData ? 0.6 : 1,
                }}
              >
                {savingData ? "Saving..." : "Save Vehicle Data"}
              </button>
              <div style={{ fontSize: "0.55rem", color: "var(--text-muted)", marginTop: "0.2rem", textAlign: "center" }}>
                Saved data improves AI analysis accuracy when you run CarBot
              </div>
            </div>
          )}
        </div>

        {/* ── VIN / ODOMETER DETECTED FROM PHOTOS ── */}
        {carBotResult?.identification?.vin_from_photo && (
          <div style={{
            padding: "0.5rem 0.75rem", marginBottom: "0.5rem",
            background: "rgba(76,175,80,0.08)",
            border: "1px solid rgba(76,175,80,0.25)",
            borderRadius: "0.5rem",
            display: "flex", alignItems: "center", gap: "0.4rem",
          }}>
            <span style={{ fontSize: "0.75rem" }}>🔍</span>
            <div>
              <div style={{ fontSize: "0.62rem", fontWeight: 700, color: "#4caf50" }}>VIN Detected in Photos</div>
              <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--text-primary)", fontFamily: "monospace", letterSpacing: "0.1em" }}>
                {carBotResult.identification.vin_from_photo}
              </div>
            </div>
          </div>
        )}
        {carBotResult?.identification?.odometer_from_photo && (
          <div style={{
            padding: "0.4rem 0.75rem", marginBottom: "0.5rem",
            display: "flex", alignItems: "center", gap: "0.35rem",
          }}>
            <span style={{ fontSize: "0.6rem" }}>🔢</span>
            <span style={{ fontSize: "0.62rem", color: "var(--text-secondary)" }}>
              Odometer detected: <span style={{ fontWeight: 700, color: "var(--text-primary)" }}>{carBotResult.identification.odometer_from_photo} miles</span>
            </span>
          </div>
        )}

        {/* ── RESULTS ── */}
        {!hasData && !carBotLoading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem", alignItems: "center", textAlign: "center", flex: 1, justifyContent: "space-evenly" }}>
            <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)", lineHeight: 1.5, maxWidth: 360 }}>
              Condition grading, market pricing, selling strategy, and local pickup planning for your vehicle.
            </p>
            <div style={{ padding: "0.65rem 0.85rem", background: "var(--ghost-bg)", borderRadius: "0.6rem", border: "1px solid var(--border-default)", width: "100%", maxWidth: 360, textAlign: "left" as const }}>
              <div style={{ fontSize: "0.62rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" as const, letterSpacing: "0.06em", marginBottom: "0.4rem" }}>What You&apos;ll Get</div>
              {[{ icon: "🔑", text: "Full VIN decode with vehicle history and specs" }, { icon: "📊", text: "Market value based on year, make, model, and condition" }, { icon: "🤝", text: "Local pickup planning with safe meetup recommendations" }, { icon: "📋", text: "Complete seller's checklist for vehicle transactions" }].map((b, i) => (
                <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "0.4rem", padding: "0.3rem 0", fontSize: "0.68rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>
                  <span style={{ flexShrink: 0, fontSize: "0.7rem" }}>{b.icon}</span>
                  <span>{b.text}</span>
                </div>
              ))}
            </div>
            <div style={{ marginTop: "0.5rem", padding: "0.5rem 0.75rem", background: "var(--ghost-bg)", borderRadius: "0.5rem", border: "1px solid var(--border-default)", width: "100%", maxWidth: 360, textAlign: "left" as const }}>
              <div style={{ fontSize: "0.58rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" as const, letterSpacing: "0.06em", marginBottom: "0.35rem" }}>How It Works</div>
              {["Enter VIN and mileage", "AI decodes vehicle history and specs", "Get market value and selling strategy"].map((step, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.25rem 0", fontSize: "0.65rem", color: "var(--text-secondary)" }}>
                  <span style={{ width: "20px", height: "20px", borderRadius: "50%", background: "linear-gradient(135deg, #00bcd4, #009688)", color: "#fff", fontSize: "0.55rem", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{i + 1}</span>
                  <span>{step}</span>
                </div>
              ))}
            </div>
            <div style={{ marginTop: "0.4rem", display: "flex", justifyContent: "center", gap: "0.75rem", fontSize: "0.58rem", color: "var(--text-muted)", width: "100%", maxWidth: 360 }}>
              {[{ value: "VIN", label: "Full decode" }, { value: "KBB", label: "Market data" }, { value: "Local", label: "Pickup ready" }].map((m, i) => (
                <div key={i} style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "#00bcd4" }}>{m.value}</div>
                  <div style={{ fontSize: "0.5rem", color: "var(--text-muted)" }}>{m.label}</div>
                </div>
              ))}
            </div>
          </div>
        ) : carBotLoading ? (
          <BotLoadingState botName="CarBot" />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>

            {/* Vehicle ID + trim */}
            {ymm && (
              <div style={{ padding: "0 0 0.25rem" }}>
                <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--text-primary)", lineHeight: 1.2 }}>{ymm} {ident?.trim || ""}</div>
                {ident && (
                  <div style={{ display: "flex", gap: "0.25rem", flexWrap: "wrap", marginTop: "0.3rem" }}>
                    {[ident.body_style, ident.drivetrain, ident.engine, ident.transmission, ident.color_exterior].filter(Boolean).map((tag: string) => (
                      <span key={tag} style={{ padding: "0.08rem 0.35rem", borderRadius: "9999px", fontSize: "0.55rem", fontWeight: 600, background: CB_BG, color: CB, border: `1px solid ${CB_BORDER}` }}>{tag}</span>
                    ))}
                  </div>
                )}
                {carBotResult?.executive_summary && (
                  <p style={{ fontSize: "0.68rem", color: "var(--text-secondary)", lineHeight: 1.5, margin: "0.35rem 0 0" }}>{typeof carBotResult.executive_summary === "string" ? carBotResult.executive_summary.slice(0, 200) : ""}{typeof carBotResult.executive_summary === "string" && carBotResult.executive_summary.length > 200 ? "..." : ""}</p>
                )}
              </div>
            )}

            {/* ── CONDITION ACCORDION ── */}
            {(extScore != null || intScore != null || mechScore != null) && (<>
              <AccordionHeader id="car-condition" icon="📊" title="CONDITION GRADE" subtitle={grade ? `Grade ${grade.letter}` : ""} isOpen={carSections.has("car-condition")} onToggle={toggleCarSection} accentColor={CB} />
              {carSections.has("car-condition") && (
                <div style={{ padding: "0.35rem 0" }}>
                  <div style={{
                    display: "flex", alignItems: "center", gap: "0.65rem",
                    padding: "0.55rem 0.75rem", borderRadius: "0.55rem",
                    background: CB_BG, border: `1px solid ${CB_BORDER}`,
                  }}>
                    {grade && (
                      <div style={{ textAlign: "center", marginRight: "0.35rem" }}>
                        <div style={{ fontSize: "1.5rem", fontWeight: 900, color: grade.color, lineHeight: 1 }}>{grade.letter}</div>
                        <div style={{ fontSize: "0.45rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>Grade</div>
                      </div>
                    )}
                    {[
                      { label: "Ext", score: extScore, icon: "🎨" },
                      { label: "Int", score: intScore, icon: "🪑" },
                      { label: "Mech", score: mechScore, icon: "⚙️" },
                    ].filter((g) => g.score != null).map((g) => (
                      <div key={g.label} style={{ textAlign: "center", flex: 1 }}>
                        <div style={{ fontSize: "1rem", fontWeight: 800, color: (g.score as number) >= 7 ? "#4ade80" : (g.score as number) >= 4 ? "#f59e0b" : "#ef4444" }}>{g.score}/10</div>
                        <div style={{ fontSize: "0.45rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>{g.icon} {g.label}</div>
                      </div>
                    ))}
                  </div>
                  {/* Condition detail notes */}
                  {cond && (
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.3rem", marginTop: "0.25rem" }}>
                      {[
                        { label: "Exterior", notes: cond.exterior?.overall_exterior_notes || cond.exterior?.notes, items: [cond.exterior?.paint_condition, cond.exterior?.body_damage, cond.exterior?.glass_condition, cond.exterior?.tire_condition].flat().filter(Boolean) },
                        { label: "Interior", notes: cond.interior?.overall_interior_notes || cond.interior?.notes, items: [cond.interior?.seats, cond.interior?.dashboard, cond.interior?.electronics, cond.interior?.odors_likely].filter(Boolean) },
                        { label: "Mechanical", notes: cond.mechanical?.overall_mechanical_notes || cond.mechanical?.notes, items: [cond.mechanical?.engine_assessment, cond.mechanical?.undercarriage, cond.mechanical?.suspension].filter(Boolean) },
                      ].filter(d => d.notes || d.items.length > 0).map((d, i) => (
                        <div key={i} style={{ fontSize: "0.58rem", color: "var(--text-secondary)", lineHeight: 1.4, padding: "0.3rem 0.4rem", background: "var(--ghost-bg)", borderRadius: "0.3rem" }}>
                          <div style={{ fontSize: "0.48rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "0.15rem" }}>{d.label}</div>
                          {d.items.slice(0, 2).map((item: any, j: number) => (
                            <div key={j}>• {typeof item === "string" ? item.slice(0, 60) : Array.isArray(item) ? item[0]?.slice?.(0, 60) || "" : ""}</div>
                          ))}
                          {d.notes && <div style={{ fontStyle: "italic", marginTop: "0.1rem" }}>{typeof d.notes === "string" ? d.notes.slice(0, 80) : ""}...</div>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>)}

            {/* ── VALUATION ACCORDION ── */}
            {val && (<>
              <AccordionHeader id="car-valuation" icon="💰" title="MARKET VALUATION" subtitle={val?.private_party_value?.mid ? `Private: $${Math.round(val.private_party_value.mid).toLocaleString()}` : ""} isOpen={carSections.has("car-valuation")} onToggle={toggleCarSection} accentColor="#4ade80" />
              {carSections.has("car-valuation") && (
                <div style={{ padding: "0.35rem 0" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.35rem" }}>
                    {[
                      { label: "Retail", data: val.retail_value, color: CB },
                      { label: "Private", data: val.private_party_value, color: "#4ade80" },
                      { label: "Trade", data: val.trade_in_value, color: "#f59e0b" },
                      { label: "Auction", data: val.auction_value, color: "var(--text-muted)" },
                    ].map((v) => (
                      <div key={v.label} style={{ background: "var(--bg-card)", border: "1px solid var(--border-default)", borderRadius: "0.4rem", padding: "0.35rem 0.4rem", textAlign: "center" }}>
                        <div style={{ fontSize: "0.45rem", textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-muted)", marginBottom: "0.1rem" }}>{v.label}</div>
                        <div style={{ fontSize: "0.72rem", fontWeight: 700, color: v.color }}>
                          {v.data?.mid ? `$${Math.round(v.data.mid).toLocaleString()}` : v.data?.low ? `$${Math.round(v.data.low).toLocaleString()}` : "—"}
                        </div>
                      </div>
                    ))}
                  </div>
                  {/* Seller net + best value */}
                  {val?.private_party_value?.mid && (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.45rem 0.6rem", background: "rgba(76,175,80,0.06)", borderRadius: "0.4rem", border: "1px solid rgba(76,175,80,0.2)", marginTop: "0.25rem" }}>
                      <div>
                        <div style={{ fontSize: "0.48rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>Best Value: Private Sale</div>
                        <div style={{ fontSize: "0.58rem", color: "var(--text-secondary)", lineHeight: 1.4 }}>
                          Sell privately for <span style={{ fontWeight: 700, color: "#4ade80" }}>${Math.round(val.private_party_value.mid).toLocaleString()}</span>
                          {val.trade_in_value?.mid ? ` — $${Math.round(val.private_party_value.mid - val.trade_in_value.mid).toLocaleString()} more than trade-in` : ""}
                        </div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: "0.48rem", color: "var(--text-muted)", textTransform: "uppercase" }}>You Keep</div>
                        <div style={{ fontSize: "0.82rem", fontWeight: 800, color: "#4ade80" }}>${Math.round(val.private_party_value.mid * 0.9825).toLocaleString()}</div>
                        <div style={{ fontSize: "0.48rem", color: "var(--text-muted)" }}>after 1.75% fee</div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>)}

            {/* ── NHTSA VEHICLE HISTORY ACCORDION ── */}
            {(() => {
              const nhtsaReport = carBotResult?.nhtsaReport;
              const recalls = nhtsaReport?.recalls?.items || [];
              const complaints = nhtsaReport?.complaints?.items || [];
              const safetyRating = nhtsaReport?.safetyRatings;
              if (!nhtsaReport || (recalls.length === 0 && complaints.length === 0 && !safetyRating)) return null;
              return (<>
                <AccordionHeader id="car-nhtsa" icon="📋" title="VEHICLE HISTORY (NHTSA)" subtitle={`${recalls.length} recalls · ${complaints.length} complaints${safetyRating ? ` · ${safetyRating.overallRating}/5 stars` : ""}`} isOpen={carSections.has("car-nhtsa")} onToggle={toggleCarSection} accentColor="#f59e0b" badge="REAL DATA" />
                {carSections.has("car-nhtsa") && (
                  <div style={{ padding: "0.35rem 0", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    {/* Safety Rating */}
                    {safetyRating && (
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.5rem 0.65rem", background: "rgba(0,188,212,0.04)", borderRadius: "0.4rem", border: "1px solid rgba(0,188,212,0.15)" }}>
                        <div style={{ textAlign: "center" }}>
                          <div style={{ fontSize: "1.5rem", fontWeight: 900, color: Number(safetyRating.overallRating) >= 4 ? "#4ade80" : Number(safetyRating.overallRating) >= 3 ? "#f59e0b" : "#ef4444" }}>{safetyRating.overallRating}</div>
                          <div style={{ fontSize: "0.45rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>/ 5 Stars</div>
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: "0.68rem", fontWeight: 700, color: "var(--text-primary)" }}>NHTSA Safety Rating</div>
                          <div style={{ fontSize: "0.6rem", color: "var(--text-muted)" }}>National Highway Traffic Safety Administration</div>
                        </div>
                        <span style={{ fontSize: "0.5rem", padding: "2px 6px", borderRadius: "4px", background: "rgba(76,175,80,0.1)", color: "#4caf50", fontWeight: 700 }}>VERIFIED</span>
                      </div>
                    )}
                    {/* Recalls */}
                    {recalls.length > 0 && (
                      <div>
                        <div style={{ fontSize: "0.55rem", fontWeight: 700, color: "#ef4444", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.25rem" }}>🚨 {recalls.length} Active Recall{recalls.length !== 1 ? "s" : ""}</div>
                        {recalls.slice(0, 4).map((r: any, i: number) => (
                          <div key={i} style={{ padding: "0.35rem 0.5rem", marginBottom: "0.2rem", borderRadius: "0.35rem", background: "rgba(239,68,68,0.04)", borderLeft: "3px solid rgba(239,68,68,0.4)", fontSize: "0.62rem" }}>
                            <div style={{ fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.1rem" }}>{r.component}</div>
                            <div style={{ color: "var(--text-secondary)", lineHeight: 1.4 }}>{typeof r.summary === "string" ? r.summary.slice(0, 150) : ""}...</div>
                            {r.remedy && <div style={{ color: "#00bcd4", marginTop: "0.1rem", fontSize: "0.58rem" }}>Remedy: {typeof r.remedy === "string" ? r.remedy.slice(0, 100) : ""}...</div>}
                          </div>
                        ))}
                        {recalls.length > 4 && <div style={{ fontSize: "0.58rem", color: "var(--text-muted)", padding: "0.2rem 0" }}>+{recalls.length - 4} more recalls — see full report in CarBot console</div>}
                      </div>
                    )}
                    {/* Complaints */}
                    {complaints.length > 0 && (
                      <div>
                        <div style={{ fontSize: "0.55rem", fontWeight: 700, color: "#f59e0b", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.25rem" }}>⚠️ {complaints.length} Consumer Complaint{complaints.length !== 1 ? "s" : ""}</div>
                        {complaints.slice(0, 3).map((c: any, i: number) => (
                          <div key={i} style={{ padding: "0.35rem 0.5rem", marginBottom: "0.2rem", borderRadius: "0.35rem", background: "rgba(245,158,11,0.04)", borderLeft: "3px solid rgba(245,158,11,0.3)", fontSize: "0.62rem" }}>
                            <div style={{ fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.1rem" }}>{c.component}</div>
                            <div style={{ color: "var(--text-secondary)", lineHeight: 1.4 }}>{typeof c.summary === "string" ? c.summary.slice(0, 120) : ""}...</div>
                          </div>
                        ))}
                      </div>
                    )}
                    {/* Data source */}
                    <div style={{ fontSize: "0.5rem", color: "var(--text-muted)", textAlign: "center", padding: "0.25rem 0", borderTop: "1px solid var(--border-default)" }}>
                      Source: National Highway Traffic Safety Administration (NHTSA) — Real Federal Data
                    </div>
                  </div>
                )}
              </>);
            })()}

            {/* ── MARKET & STRATEGY ACCORDION ── */}
            <AccordionHeader id="car-market" icon="📈" title="MARKET & STRATEGY" subtitle={market?.demand_level ? `${market.demand_level} demand` : ""} isOpen={carSections.has("car-market")} onToggle={toggleCarSection} />
            {carSections.has("car-market") && (
              <div style={{ padding: "0.35rem 0" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.35rem" }}>
                  {[
                    { label: "Market Demand", value: market?.demand_level, icon: "📊", sub: market?.demand_trend },
                    { label: "Best Venue", value: strat?.best_selling_venue ? (typeof strat.best_selling_venue === "string" ? strat.best_selling_venue.split(".")[0].split(",")[0] : strat.recommended_platforms?.[0]?.platform) : null, icon: "🏪" },
                    { label: "List Price", value: strat?.listing_price ? `$${Math.round(strat.listing_price).toLocaleString()}` : null, icon: "💰" },
                    { label: "Time to Sell", value: market?.time_to_sell_estimate, icon: "⏱️" },
                  ].filter((d) => d.value).map((d) => (
                    <div key={d.label} style={{ background: "var(--bg-card)", border: "1px solid var(--border-default)", borderRadius: "0.4rem", padding: "0.4rem 0.5rem" }}>
                      <div style={{ fontSize: "0.45rem", textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-muted)" }}>{d.icon} {d.label}</div>
                      <div style={{ fontSize: "0.72rem", fontWeight: 600, color: "var(--text-primary)", marginTop: "0.1rem" }}>{d.value}</div>
                      {d.sub && <div style={{ fontSize: "0.55rem", color: "var(--text-muted)" }}>{d.sub}</div>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── KNOWN ISSUES & HISTORY ACCORDION ── */}
            {(history?.common_problems?.length > 0 || history?.reliability_notes || history?.known_issues) && (<>
              <AccordionHeader id="car-issues" icon="⚠️" title="KNOWN ISSUES & HISTORY" subtitle={history?.common_problems ? `${history.common_problems.length} known issues` : ""} isOpen={carSections.has("car-issues")} onToggle={toggleCarSection} accentColor="#ef4444" />
              {carSections.has("car-issues") && (
                <div style={{ padding: "0.35rem 0" }}>
                  {history?.common_problems && history.common_problems.length > 0 && (
                    <div style={{ padding: "0.4rem 0.55rem", borderRadius: "0.4rem", background: "rgba(239,68,68,0.04)", borderLeft: "3px solid rgba(239,68,68,0.4)" }}>
                      <div style={{ fontSize: "0.55rem", fontWeight: 700, color: "#ef4444", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.15rem" }}>⚠️ Common Issues</div>
                      {history.common_problems.slice(0, 4).map((p: string, i: number) => (
                        <div key={i} style={{ fontSize: "0.68rem", color: "var(--text-secondary)", lineHeight: 1.4 }}>• {p}</div>
                      ))}
                    </div>
                  )}
                  {history?.reliability_notes && typeof history.reliability_notes === "string" && (
                    <div style={{ fontSize: "0.62rem", color: "var(--text-secondary)", lineHeight: 1.5, padding: "0.3rem 0.55rem", marginTop: "0.25rem" }}>{history.reliability_notes.slice(0, 200)}</div>
                  )}
                </div>
              )}
            </>)}

            {/* Vehicle History status badges */}
            <div style={{ padding: "0.5rem 0.6rem", borderRadius: "0.4rem", background: "var(--bg-card)", border: "1px dashed var(--border-default)" }}>
              <div style={{ fontSize: "0.55rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.2rem" }}>Data Sources</div>
              <div style={{ display: "flex", gap: "0.3rem", flexWrap: "wrap", fontSize: "0.55rem" }}>
                {[
                  { label: "VIN Decode", done: !!vinData },
                  { label: "AI Intelligence", done: hasData },
                  { label: "NHTSA History", done: !!carBotResult?.nhtsaReport },
                  { label: "Market Analysis", done: hasData },
                ].map((f) => (
                  <span key={f.label} style={{
                    padding: "0.08rem 0.3rem", borderRadius: "9999px", fontWeight: 600,
                    background: f.done ? "rgba(74,222,128,0.08)" : "var(--bg-card)",
                    color: f.done ? "#4ade80" : "var(--text-muted)",
                    border: `1px solid ${f.done ? "rgba(74,222,128,0.2)" : "var(--border-default)"}`,
                  }}>
                    {f.done ? "✅" : "🔜"} {f.label}
                  </span>
                ))}
              </div>
            </div>

            {/* See full evaluation link */}
            <a
              href={`/bots/carbot?item=${itemId}`}
              style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: "0.35rem",
                fontSize: "0.75rem", fontWeight: 600, color: CB,
                padding: "0.5rem", borderRadius: "0.5rem",
                background: CB_BG, border: `1px solid ${CB_BORDER}`,
                textDecoration: "none",
              }}
            >
              See full evaluation →
            </a>
          </div>
        )}
      </div>

      {/* MegaBot boost results — full 4-agent breakdown */}
      {boosted && boostResult && (<>
        <AccordionHeader id="megabot-results" icon="⚡" title="MEGABOT MULTI-AI ANALYSIS" subtitle={`${boostResult.agreementScore ?? "?"}% Agreement`} isOpen={carSections.has("megabot-results")} onToggle={toggleCarSection} accentColor="#8b5cf6" badge={`${(boostResult.providers || []).filter((p: any) => p.data || !p.error).length} AI`} />
        {carSections.has("megabot-results") && <MegaBotBoostResults botType="carbot" result={boostResult} aiData={aiData} />}
      </>)}

      {/* LOCAL PICKUP ONLY banner */}
      <div style={{
        padding: "0.4rem 1rem",
        background: "rgba(245,158,11,0.08)",
        borderTop: "1px solid rgba(245,158,11,0.2)",
        display: "flex", alignItems: "center", gap: "0.35rem",
        fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#f59e0b",
      }}>
        🚗 LOCAL PICKUP ONLY — Vehicles cannot be shipped
      </div>

      <PanelFooter
        botName="CarBot"
        botLink={`/bots/carbot?item=${itemId}`}
        itemId={itemId}
        botIcon="🚗"
        botCost={1}
        onBotRun={hasAnalysis ? onCarBotRun : undefined}
        onSuperBoost={onSuperBoost}
        boosting={boosting}
        boosted={boosted}
        hasResult={!!carBotResult}
             />
      </div>
    </GlassCard>
  );
}

/* ═══════════════════════════════════════════
   PANEL 8b: CollectiblesBot (PAID — CONDITIONAL)
   ═══════════════════════════════════════════ */

function CollectiblesBotPanel({ aiData, itemId, collapsed, onToggle, collectiblesBotResult, collectiblesBotLoading, onCollectiblesBotRun, onSuperBoost, boosting, boosted, boostResult }: {
  aiData: any; itemId: string; collapsed: boolean; onToggle: () => void;
  collectiblesBotResult: any; collectiblesBotLoading: boolean;
  onCollectiblesBotRun: () => void;
  onSuperBoost: () => void; boosting: boolean; boosted: boolean; boostResult: any;
}) {
  const detection = aiData ? detectCollectible(aiData) : null;
  const hasResult = !!collectiblesBotResult;
  const [collectSections, setCollectSections] = useState<Set<string>>(new Set(["megabot-results"]));
  const toggleCollectSection = (id: string) => { setCollectSections(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; }); };
  const hasAnalysis = !!aiData;
  const r = collectiblesBotResult;

  // ═══ Fallback chaining: new simplified schema → old mega schema → flat single-run schema ═══

  // Assessment verdict
  const assess = r?.collectible_assessment ?? (r?.category ? {
    is_collectible: true,
    category: r.category,
    rarity: r.rarity,
    demand_level: r?.market?.demand_trend ?? r?.demand_trend,
  } : null);

  // Identification
  const ident = r?.identification ?? (r?.item_name ? {
    item_name: r.item_name,
    year: r.year,
    brand_series: r.brand_series,
    edition: r.edition_variation ?? r.edition,
    grade_estimate: r?.visual_grading?.psa_grade ?? r?.visual_grade_assessment?.psa_grade_estimate ?? r?.estimated_grade,
    grading_status: r.authenticated ? "Authenticated" : "Ungraded",
  } : null);

  // Valuation — new simplified schema → old mega → flat
  const rawLow = safeExtractPrice(r?.valuation?.raw_low ?? r?.raw_value_low);
  const rawMid = safeExtractPrice(r?.valuation?.raw_mid ?? r?.raw_value_mid);
  const rawHigh = safeExtractPrice(r?.valuation?.raw_high ?? r?.raw_value_high);
  const val = (rawMid || rawLow) ? {
    estimated_low: rawLow,
    estimated_mid: rawMid,
    estimated_high: rawHigh,
    graded_value: safeExtractPrice(r?.valuation?.psa10_value ?? r?.graded_values?.high_grade_value),
    ungraded_value: rawMid,
    price_trend: r?.market?.demand_trend ?? r?.demand_trend,
  } : null;

  const valueReasoning = r?.valuation?.value_reasoning ?? r?.value_reasoning ?? null;
  const recentComps = r?.valuation?.recent_comps ?? r?.market_intelligence?.recent_ebay_comps ?? null;
  const populationNote = r?.valuation?.psa_population_note ?? r?.population_data ?? r?.rarity_profile?.population_report ?? null;

  // Graded values — new simplified psa6-10 schema → old array schema → old object schema
  const gradedValues = r?.valuation ? [
    { grade: "PSA 6", value: safeExtractPrice(r.valuation.psa6_value) },
    { grade: "PSA 7", value: safeExtractPrice(r.valuation.psa7_value) },
    { grade: "PSA 8", value: safeExtractPrice(r.valuation.psa8_value) },
    { grade: "PSA 9", value: safeExtractPrice(r.valuation.psa9_value) },
    { grade: "PSA 10", value: safeExtractPrice(r.valuation.psa10_value) },
  ].filter((g) => g.value && g.value > 0) : (r?.graded_values ? (Array.isArray(r.graded_values) ? r.graded_values : null) : null);

  // Visual grading — new simplified → old mega
  const visualGrade = r?.visual_grading ?? r?.visual_grade_assessment ?? null;
  const psaGrade = visualGrade?.psa_grade ?? visualGrade?.psa_grade_estimate ?? r?.estimated_grade ?? null;
  const bgsGrade = visualGrade?.bgs_grade ?? visualGrade?.bgs_grade_estimate ?? null;
  const gradeReasoning = visualGrade?.grade_reasoning ?? null;
  const gradeSensitivity = visualGrade?.grade_sensitivity ?? null;

  // Grading ROI — new simplified → old mega → flat
  const gradingRoiObj = r?.grading_roi ?? r?.gradingAssessment ?? null;
  const gradingRec = gradingRoiObj?.recommendation ?? gradingRoiObj?.grading_recommendation ?? r?.grading_recommendation ?? null;
  const gradingReasoning = gradingRoiObj?.reasoning ?? gradingRoiObj?.grading_reasoning ?? r?.grading_roi_reasoning ?? null;
  const breakEvenGrade = gradingRoiObj?.break_even_grade ?? null;
  const bestGradingService = gradingRoiObj?.best_grading_service ?? null;
  const psaStandardCost = gradingRoiObj?.psa_standard_cost ?? null;

  // Market — new simplified → old mega → flat
  const bestPlatform = r?.market?.best_platform ?? r?.market_intelligence?.best_platform ?? r?.best_platform ?? null;
  const platformReasoning = r?.market?.platform_reasoning ?? r?.market_intelligence?.platform_reasoning ?? r?.platform_reasoning ?? null;
  const demandTrend = r?.market?.demand_trend ?? r?.market_intelligence?.demand_trend ?? r?.demand_trend ?? null;
  const demandReasoning = r?.market?.demand_reasoning ?? r?.market_intelligence?.demand_reasoning ?? r?.demand_reasoning ?? null;
  const listingTitle = r?.market?.listing_title ?? r?.listing_title ?? null;
  const buyItNowPrice = safeExtractPrice(r?.market?.buy_it_now_price);
  const sellingStrategy = r?.market?.selling_strategy ?? (typeof r?.selling_strategy === "string" ? r.selling_strategy : null) ?? null;

  // Investment — new simplified → old mega
  const investment = r?.investment ?? r?.investment_outlook ?? null;
  const investmentVerdict = investment?.verdict ?? investment?.hold_vs_sell ?? null;

  // Insider / collector intelligence — new simplified → old mega → flat
  const insiderData = r?.insider ?? r?.collector_intelligence ?? null;
  const insiderKnowledge = insiderData?.insider_knowledge ?? r?.collector_notes ?? null;
  const communitySentiment = insiderData?.community_sentiment ?? null;
  const notableVariations = insiderData?.notable_variations ?? r?.notable_variations ?? null;
  const authenticationNotes = insiderData?.authentication_notes ?? null;

  const summary = r?.expertSummary ?? r?.executive_summary;
  const valuationSource = r?.valuation_source ?? null;

  const PURPLE = "#8b5cf6";
  const PURPLE_BG = "rgba(139,92,246,0.06)";
  const PURPLE_BORDER = "rgba(139,92,246,0.25)";
  const PURPLE_FAINT = "rgba(139,92,246,0.1)";

  // No result and not detected — show intro
  if (!hasResult && !detection?.isCollectible) {
    return (
      <GlassCard>
        <PanelHeader icon="🎴" title="CollectiblesBot" hasData={false} collapsed={collapsed} onToggle={onToggle}
          preview="Collectibles specialist"
        />
        {collapsed && (
          <div style={{ padding: "0.75rem 1rem", textAlign: "center" as const, display: "flex", flexDirection: "column" as const, alignItems: "center", gap: "0.4rem", flex: 1, justifyContent: "space-evenly" }}>
            <span style={{ fontSize: "1.5rem" }}>🎴</span>
            <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--text-primary)" }}>CollectiblesBot</div>
            <p style={{ fontSize: "0.68rem", color: "var(--text-secondary)", lineHeight: 1.5, maxWidth: 300, margin: 0 }}>Rarity assessment, grading, and collector market analysis for cards, coins, vinyl, and more.</p>
            <div style={{ width: "100%", maxWidth: 300, padding: "0.5rem 0.65rem", background: "var(--ghost-bg)", borderRadius: "0.5rem", border: "1px solid var(--border-default)", textAlign: "left" as const }}>
              <div style={{ fontSize: "0.55rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" as const, letterSpacing: "0.05em", marginBottom: "0.25rem" }}>What You&apos;ll Get</div>
              {[{ icon: "⭐", text: "Rarity tier assessment" }, { icon: "🏅", text: "Grade estimate (PSA/BGS)" }, { icon: "📈", text: "Market trends" }].map((b: any, i: number) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.3rem", padding: "0.15rem 0", fontSize: "0.62rem", color: "var(--text-secondary)" }}><span style={{ fontSize: "0.6rem", flexShrink: 0 }}>{b.icon}</span><span>{b.text}</span></div>
              ))}
            </div>
            <div style={{ display: "flex", gap: "0.4rem", justifyContent: "center", flexWrap: "wrap" as const, marginTop: "0.25rem", paddingTop: "0.4rem", borderTop: "1px solid var(--border-default)", width: "100%" }}>
              {onCollectiblesBotRun && <button onClick={onCollectiblesBotRun} style={{ padding: "0.3rem 0.65rem", fontSize: "0.62rem", fontWeight: 600, borderRadius: "0.4rem", border: "1px solid var(--border-default)", background: "var(--ghost-bg)", color: "var(--text-secondary)", cursor: "pointer", minHeight: "32px" }}>🎴 CollectiblesBot · 1 cr</button>}
              <a href={`/bots/collectiblesbot?item=${itemId}`} style={{ padding: "0.3rem 0.65rem", fontSize: "0.62rem", fontWeight: 600, borderRadius: "0.4rem", border: "1px solid rgba(0,188,212,0.3)", color: "#00bcd4", textDecoration: "none", display: "inline-flex", alignItems: "center", minHeight: "32px" }}>Open CollectiblesBot →</a>
            </div>
          </div>
        )}
        <div style={{ display: collapsed ? "none" : "flex", flexDirection: "column" as const, flex: 1 }}>
          <div style={{ padding: "1.25rem" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", flex: 1, justifyContent: "center", padding: "1.25rem", gap: "0.5rem" }}>
              <span style={{ fontSize: "1.5rem" }}>⭐</span>
              <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--text-primary)" }}>Collectibles Specialist</div>
              <p style={{ fontSize: "0.68rem", color: "var(--text-secondary)", lineHeight: 1.5, maxWidth: 300, margin: 0 }}>Rarity assessment, grading recommendations, and collector market analysis.</p>
              <div style={{ width: "100%", maxWidth: 300, padding: "0.5rem 0.65rem", background: "var(--ghost-bg)", borderRadius: "0.5rem", border: "1px solid var(--border-default)", textAlign: "left" }}>
                <div style={{ fontSize: "0.55rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.25rem" }}>What You&apos;ll Get</div>
                {[{ icon: "⭐", text: "Rarity tier assessment" }, { icon: "🏅", text: "Grade estimate (PSA/BGS)" }, { icon: "📈", text: "Collector market trends" }].map((b, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.3rem", padding: "0.15rem 0", fontSize: "0.62rem", color: "var(--text-secondary)" }}><span style={{ fontSize: "0.6rem", flexShrink: 0 }}>{b.icon}</span><span>{b.text}</span></div>
                ))}
              </div>
              <div style={{ display: "flex", gap: "0.4rem", justifyContent: "center", flexWrap: "wrap", marginTop: "0.5rem", paddingTop: "0.4rem", borderTop: "1px solid var(--border-default)", width: "100%" }}>
                {onCollectiblesBotRun && <button onClick={onCollectiblesBotRun} style={{ padding: "0.3rem 0.65rem", fontSize: "0.62rem", fontWeight: 600, borderRadius: "0.4rem", border: "1px solid var(--border-default)", background: "var(--ghost-bg)", color: "var(--text-secondary)", cursor: "pointer", minHeight: "32px" }}>🎴 CollectiblesBot · 1 cr</button>}
                <a href={`/bots/collectiblesbot?item=${itemId}`} style={{ padding: "0.3rem 0.65rem", fontSize: "0.62rem", fontWeight: 600, borderRadius: "0.4rem", border: "1px solid rgba(0,188,212,0.3)", color: "#00bcd4", textDecoration: "none", display: "inline-flex", alignItems: "center", minHeight: "32px" }}>Open CollectiblesBot →</a>
              </div>
            </div>
          </div>
          {boosted && boostResult && (<>
            <AccordionHeader id="megabot-results" icon="⚡" title="MEGABOT MULTI-AI ANALYSIS" subtitle={`${boostResult.agreementScore ?? "?"}% Agreement`} isOpen={collectSections.has("megabot-results")} onToggle={toggleCollectSection} accentColor="#8b5cf6" badge={`${(boostResult.providers || []).filter((p: any) => p.data || !p.error).length} AI`} />
            {collectSections.has("megabot-results") && <MegaBotBoostResults botType="collectibles" result={boostResult} aiData={aiData} />}
          </>)}
          <PanelFooter
            botName="CollectiblesBot"
            botLink={`/bots/collectiblesbot?item=${itemId}`}
            itemId={itemId}
            botIcon="🎴"
            botCost={1}
            onBotRun={
              hasAnalysis && detection?.isCollectible
                ? onCollectiblesBotRun
                : hasAnalysis && !detection?.isCollectible
                ? () => alert(
                    "This item has not been flagged as a collectible. " +
                    "Run AI Analysis first — if the item is a collectible, " +
                    "CollectiblesBot will unlock automatically."
                  )
                : undefined
            }
            onSuperBoost={onSuperBoost}
            boosting={boosting}
            boosted={boosted}
            hasResult={hasResult}
          />
        </div>
      </GlassCard>
    );
  }

  return (
    <GlassCard>
      <PanelHeader icon="🎴" title="CollectiblesBot" hasData={hasResult}
        badge={hasResult ? (assess?.rarity || "ANALYZED") : undefined}
        collapsed={collapsed} onToggle={onToggle}
        preview={hasResult
          ? `${ident?.item_name || "Evaluated"} · ${val?.estimated_mid ? safeFmtPrice(val.estimated_mid) : ""}`
          : detection?.isCollectible ? `${detection.category} detected` : "Collectibles specialist"}
      />

      {collapsed && hasResult && <CollapsedSummary botType="collectibles" data={{ name: ident?.item_name, rarity: assess?.rarity, value: val?.estimated_mid ? safeFmtPrice(val.estimated_mid) : null, grade: psaGrade, demand: demandTrend }} buttons={<>
        {onCollectiblesBotRun && <button onClick={onCollectiblesBotRun} style={{ padding: "0.3rem 0.65rem", fontSize: "0.62rem", fontWeight: 600, borderRadius: "0.4rem", border: "1px solid var(--border-default)", background: "var(--ghost-bg)", color: "var(--text-secondary)", cursor: "pointer", minHeight: "32px" }}>⭐ Re-Run · 0.5 cr</button>}
        {onSuperBoost && <button onClick={onSuperBoost} style={{ padding: "0.3rem 0.65rem", fontSize: "0.62rem", fontWeight: 600, borderRadius: "0.4rem", border: "none", background: "linear-gradient(135deg, #00bcd4, #009688)", color: "#fff", cursor: "pointer", minHeight: "32px" }}>{boosted ? "🔄 MegaBot Re-Run · 3 cr" : "⚡ MegaBot · 5 cr"}</button>}
        <a href={`/bots/collectiblesbot?item=${itemId}`} style={{ padding: "0.3rem 0.65rem", fontSize: "0.62rem", fontWeight: 600, borderRadius: "0.4rem", border: "1px solid rgba(0,188,212,0.3)", color: "#00bcd4", textDecoration: "none", display: "inline-flex", alignItems: "center", minHeight: "32px" }}>Open CollectiblesBot →</a>
      </>} />}
      {collapsed && !hasResult && (
        <div style={{ padding: "0.65rem 0.85rem", display: "flex", alignItems: "center", gap: "0.65rem" }}>
          <span style={{ fontSize: "1.3rem" }}>⭐</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-primary)" }}>CollectiblesBot</div>
            <div style={{ fontSize: "0.62rem", color: "var(--text-muted)", lineHeight: 1.4 }}>Rarity grading, PSA estimates, and collector demand</div>
          </div>
          <div style={{ display: "flex", gap: "0.3rem", flexShrink: 0 }}>
            {onCollectiblesBotRun && <button onClick={onCollectiblesBotRun} style={{ padding: "0.3rem 0.65rem", fontSize: "0.62rem", fontWeight: 600, borderRadius: "0.4rem", border: "1px solid var(--border-default)", background: "var(--ghost-bg)", color: "var(--text-secondary)", cursor: "pointer", minHeight: "32px" }}>⭐ CollectiblesBot · 1 cr</button>}
            <a href={`/bots/collectiblesbot?item=${itemId}`} style={{ padding: "0.3rem 0.65rem", fontSize: "0.62rem", fontWeight: 600, borderRadius: "0.4rem", border: "1px solid rgba(0,188,212,0.3)", color: "#00bcd4", textDecoration: "none", display: "inline-flex", alignItems: "center", minHeight: "32px" }}>Open CollectiblesBot →</a>
          </div>
        </div>
      )}

      <div style={{ display: collapsed ? "none" : "flex", flexDirection: "column" as const, flex: 1 }}>
      <div style={{ padding: "1.25rem" }}>
        {/* Detection alert (when detected but not yet run) */}
        {detection?.isCollectible && !hasResult && !collectiblesBotLoading && (
          <div style={{ margin: "0 0 0.75rem", padding: "0.6rem 0.75rem", background: `linear-gradient(135deg, ${PURPLE_FAINT}, rgba(139,92,246,0.04))`, borderRadius: "0.5rem", border: `1px solid rgba(139,92,246,0.3)` }}>
            <div style={{ fontSize: "0.72rem", fontWeight: 700, color: PURPLE, marginBottom: "0.2rem" }}>
              COLLECTIBLE DETECTED — {detection.category}{detection.subcategory ? `: ${detection.subcategory}` : ""}
            </div>
            <div style={{ fontSize: "0.65rem", color: "var(--text-secondary)" }}>
              Confidence: {detection.confidence}% · Potential Value: {detection.potentialValue}
            </div>
            {detection.signals[0] && <div style={{ fontSize: "0.62rem", color: "var(--text-muted)", marginTop: "0.15rem", fontStyle: "italic" }}>{detection.signals[0]}</div>}
          </div>
        )}

        {collectiblesBotLoading ? (
          <BotLoadingState botName="CollectiblesBot" />
        ) : !hasResult ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", flex: 1, justifyContent: "center", padding: "1.25rem", gap: "0.5rem" }}>
            <span style={{ fontSize: "1.5rem" }}>⭐</span>
            <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--text-primary)" }}>Collectibles Specialist</div>
            <p style={{ fontSize: "0.68rem", color: "var(--text-secondary)", lineHeight: 1.5, maxWidth: 300, margin: 0 }}>Rarity assessment, grading recommendations, and collector market analysis.</p>
            <div style={{ width: "100%", maxWidth: 300, padding: "0.5rem 0.65rem", background: "var(--ghost-bg)", borderRadius: "0.5rem", border: "1px solid var(--border-default)", textAlign: "left" }}>
              <div style={{ fontSize: "0.55rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.25rem" }}>What You&apos;ll Get</div>
              {[{ icon: "⭐", text: "Rarity tier assessment" }, { icon: "🏅", text: "Grade estimate (PSA/BGS)" }, { icon: "📈", text: "Collector market trends" }].map((b, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.3rem", padding: "0.15rem 0", fontSize: "0.62rem", color: "var(--text-secondary)" }}><span style={{ fontSize: "0.6rem", flexShrink: 0 }}>{b.icon}</span><span>{b.text}</span></div>
              ))}
            </div>
            <div style={{ display: "flex", gap: "0.4rem", justifyContent: "center", flexWrap: "wrap", marginTop: "0.5rem", paddingTop: "0.4rem", borderTop: "1px solid var(--border-default)", width: "100%" }}>
              {onCollectiblesBotRun && <button onClick={onCollectiblesBotRun} style={{ padding: "0.3rem 0.65rem", fontSize: "0.62rem", fontWeight: 600, borderRadius: "0.4rem", border: "1px solid var(--border-default)", background: "var(--ghost-bg)", color: "var(--text-secondary)", cursor: "pointer", minHeight: "32px" }}>🎴 CollectiblesBot · 1 cr</button>}
              <a href={`/bots/collectiblesbot?item=${itemId}`} style={{ padding: "0.3rem 0.65rem", fontSize: "0.62rem", fontWeight: 600, borderRadius: "0.4rem", border: "1px solid rgba(0,188,212,0.3)", color: "#00bcd4", textDecoration: "none", display: "inline-flex", alignItems: "center", minHeight: "32px" }}>Open CollectiblesBot →</a>
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.65rem" }}>
            {/* Assessment Verdict */}
            {assess && (
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.5rem 0.65rem", borderRadius: "0.5rem", background: PURPLE_BG, border: `1px solid ${PURPLE_BORDER}` }}>
                <span style={{ fontSize: "1.1rem" }}>{assess.is_collectible ? "✅" : "❌"}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "0.72rem", fontWeight: 700, color: PURPLE }}>{assess.category || "Collectible"} · {assess.rarity || "—"}</div>
                  {(assess.demand_level || demandTrend) && <div style={{ fontSize: "0.6rem", color: "var(--text-muted)" }}>Demand: {assess.demand_level || demandTrend}</div>}
                </div>
                {/* Investment verdict pill */}
                {investmentVerdict && (
                  <span style={{
                    padding: "0.15rem 0.55rem", borderRadius: "20px", fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.03em",
                    background: investmentVerdict.includes("Hold") ? "rgba(59,130,246,0.15)" : investmentVerdict.includes("Sell") ? "rgba(251,191,36,0.15)" : "rgba(139,92,246,0.12)",
                    color: investmentVerdict.includes("Hold") ? "#3b82f6" : investmentVerdict.includes("Sell") ? "#fbbf24" : PURPLE,
                    border: `1px solid ${investmentVerdict.includes("Hold") ? "rgba(59,130,246,0.3)" : investmentVerdict.includes("Sell") ? "rgba(251,191,36,0.3)" : PURPLE_BORDER}`,
                  }}>
                    {investmentVerdict}
                  </span>
                )}
              </div>
            )}

            {/* Identification Grid */}
            {ident && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
                {[
                  { label: "Name", value: ident.item_name },
                  { label: "Year", value: ident.year },
                  { label: "Brand/Series", value: ident.brand_series },
                  { label: "Edition", value: ident.edition },
                  { label: "Grade Est.", value: ident.grade_estimate },
                  { label: "Status", value: ident.grading_status },
                ].filter((d) => d.value).map((d) => (
                  <div key={d.label} style={{ background: "var(--bg-card)", border: "1px solid var(--border-default)", borderRadius: "0.5rem", padding: "0.5rem 0.65rem" }}>
                    <div style={{ fontSize: "0.5rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-muted)" }}>{d.label}</div>
                    <div style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-primary)", marginTop: "0.1rem" }}>{d.value}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Valuation */}
            {val?.estimated_mid && (
              <div style={{ background: PURPLE_BG, border: `1px solid ${PURPLE_BORDER}`, borderRadius: "0.5rem", padding: "0.5rem 0.7rem", textAlign: "center" }}>
                <div style={{ fontSize: "0.5rem", textTransform: "uppercase", letterSpacing: "0.1em", color: PURPLE, fontWeight: 700 }}>Estimated Value</div>
                <div style={{ fontSize: "1rem", fontWeight: 800, color: PURPLE, marginTop: "0.15rem" }}>
                  {val.estimated_low ? `${safeFmtPrice(val.estimated_low)} – ` : ""}{safeFmtPrice(val.estimated_mid)}{val.estimated_high ? ` – ${safeFmtPrice(val.estimated_high)}` : ""}
                </div>
                {val.graded_value && val.ungraded_value && (
                  <div style={{ fontSize: "0.6rem", color: "var(--text-muted)", marginTop: "0.15rem" }}>
                    Top Grade: {safeFmtPrice(val.graded_value)} · Raw: {safeFmtPrice(val.ungraded_value)}
                  </div>
                )}
                {val.price_trend && <div style={{ fontSize: "0.6rem", color: "var(--text-muted)", marginTop: "0.1rem" }}>Trend: {val.price_trend}</div>}
                {buyItNowPrice && <div style={{ fontSize: "0.6rem", color: PURPLE, fontWeight: 600, marginTop: "0.1rem" }}>Suggested BIN: {safeFmtPrice(buyItNowPrice)}</div>}
              </div>
            )}

            {/* Value Reasoning + Recent Comps */}
            {(valueReasoning || recentComps) && (
              <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-default)", borderRadius: "0.5rem", padding: "0.55rem 0.7rem" }}>
                <div style={{ fontSize: "0.55rem", textTransform: "uppercase", letterSpacing: "0.1em", color: PURPLE, fontWeight: 700, marginBottom: "0.25rem" }}>Value Reasoning</div>
                {valueReasoning && <div style={{ fontSize: "0.68rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>{valueReasoning}</div>}
                {recentComps && (
                  <div style={{ marginTop: "0.35rem", padding: "0.4rem 0.55rem", background: "rgba(139,92,246,0.06)", borderRadius: "0.35rem", borderLeft: `2px solid ${PURPLE}` }}>
                    <div style={{ fontSize: "0.48rem", textTransform: "uppercase", letterSpacing: "0.08em", color: PURPLE, fontWeight: 700, marginBottom: "0.15rem" }}>Recent Comps</div>
                    <div style={{ fontSize: "0.65rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>{recentComps}</div>
                  </div>
                )}
                {valuationSource && <div style={{ fontSize: "0.6rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>Source: {valuationSource}</div>}
              </div>
            )}

            {/* Graded Value Tiers (PSA 6-10) */}
            {gradedValues && Array.isArray(gradedValues) && gradedValues.length > 0 && (
              <div style={{ background: PURPLE_BG, border: `1px solid ${PURPLE_BORDER}`, borderRadius: "0.5rem", padding: "0.55rem 0.7rem" }}>
                <div style={{ fontSize: "0.55rem", textTransform: "uppercase", letterSpacing: "0.1em", color: PURPLE, fontWeight: 700, marginBottom: "0.35rem" }}>Graded Value Tiers</div>
                <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(gradedValues.length, 5)}, 1fr)`, gap: "0.35rem" }}>
                  {gradedValues.slice(0, 5).map((gv: any, i: number) => (
                    <div key={i} style={{ textAlign: "center", padding: "0.3rem 0.15rem", background: "var(--bg-card)", borderRadius: "0.35rem" }}>
                      <div style={{ fontSize: "0.55rem", color: "var(--text-muted)", fontWeight: 600 }}>{gv.grade}</div>
                      <div style={{ fontSize: "0.72rem", fontWeight: 800, color: PURPLE }}>{safeFmtPrice(gv.value)}</div>
                      {gv.population && <div style={{ fontSize: "0.5rem", color: "var(--text-muted)" }}>Pop: {gv.population}</div>}
                    </div>
                  ))}
                </div>
                {populationNote && <div style={{ fontSize: "0.6rem", color: "var(--text-muted)", marginTop: "0.3rem", lineHeight: 1.4 }}>{populationNote}</div>}
              </div>
            )}

            {/* Visual Grade Assessment */}
            {visualGrade && (
              <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-default)", borderRadius: "0.5rem", padding: "0.55rem 0.7rem" }}>
                <div style={{ fontSize: "0.55rem", textTransform: "uppercase", letterSpacing: "0.1em", color: PURPLE, fontWeight: 700, marginBottom: "0.35rem" }}>Visual Grade Assessment</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.35rem" }}>
                  {[
                    { label: "Corners", value: visualGrade.corners },
                    { label: "Edges", value: visualGrade.edges },
                    { label: "Surface", value: visualGrade.surface ?? visualGrade.surface_front },
                    { label: "Centering", value: visualGrade.centering ?? visualGrade.centering_front },
                  ].filter((d) => d.value).map((d) => (
                    <div key={d.label} style={{ padding: "0.3rem 0.5rem", background: "rgba(139,92,246,0.04)", borderRadius: "0.3rem" }}>
                      <div style={{ fontSize: "0.48rem", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)" }}>{d.label}</div>
                      <div style={{ fontSize: "0.62rem", color: "var(--text-secondary)", lineHeight: 1.4, marginTop: "0.1rem" }}>
                        {typeof d.value === "string" ? d.value : typeof d.value === "object" ? JSON.stringify(d.value) : String(d.value)}
                      </div>
                    </div>
                  ))}
                </div>
                {(psaGrade || bgsGrade) && (
                  <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.35rem", flexWrap: "wrap", alignItems: "center" }}>
                    {psaGrade && (
                      <span style={{ background: PURPLE_BG, border: `1px solid ${PURPLE_BORDER}`, borderRadius: "20px", padding: "0.15rem 0.55rem", fontSize: "0.65rem", fontWeight: 700, color: PURPLE }}>
                        {psaGrade}
                      </span>
                    )}
                    {bgsGrade && (
                      <span style={{ background: PURPLE_BG, border: `1px solid ${PURPLE_BORDER}`, borderRadius: "20px", padding: "0.15rem 0.55rem", fontSize: "0.65rem", fontWeight: 700, color: PURPLE }}>
                        {bgsGrade}
                      </span>
                    )}
                    {visualGrade.grade_confidence != null && (
                      <span style={{ fontSize: "0.6rem", color: "var(--text-muted)" }}>Confidence: {typeof visualGrade.grade_confidence === "number" ? (visualGrade.grade_confidence <= 1 ? `${Math.round(visualGrade.grade_confidence * 100)}%` : `${Math.round(visualGrade.grade_confidence)}%`) : visualGrade.grade_confidence}</span>
                    )}
                  </div>
                )}
                {gradeReasoning && <div style={{ fontSize: "0.62rem", color: "var(--text-secondary)", marginTop: "0.25rem", lineHeight: 1.4 }}>{gradeReasoning}</div>}
                {gradeSensitivity && <div style={{ fontSize: "0.6rem", color: "var(--text-muted)", marginTop: "0.15rem", lineHeight: 1.4, fontStyle: "italic" }}>{gradeSensitivity}</div>}
              </div>
            )}

            {/* Grading ROI Analysis */}
            {(gradingRec || gradingReasoning || breakEvenGrade) && (
              <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-default)", borderRadius: "0.5rem", padding: "0.55rem 0.7rem" }}>
                <div style={{ fontSize: "0.55rem", textTransform: "uppercase", letterSpacing: "0.1em", color: PURPLE, fontWeight: 700, marginBottom: "0.25rem" }}>Grading ROI Analysis</div>
                {gradingRec && (
                  <div style={{ fontSize: "0.75rem", fontWeight: 700, color: gradingRec.includes("Strongly") ? "#16a34a" : gradingRec.includes("Skip") ? "#d97706" : PURPLE }}>
                    {gradingRec.includes("Strongly") ? "✅ " : gradingRec.includes("Skip") ? "⏭️ " : "🔍 "}{gradingRec}
                  </div>
                )}
                {gradingReasoning && <div style={{ fontSize: "0.62rem", color: "var(--text-secondary)", marginTop: "0.15rem", lineHeight: 1.4 }}>{gradingReasoning}</div>}
                {(breakEvenGrade || bestGradingService || psaStandardCost) && (
                  <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginTop: "0.25rem" }}>
                    {breakEvenGrade && (
                      <span style={{ fontSize: "0.6rem", color: "var(--text-muted)", background: "rgba(139,92,246,0.06)", padding: "0.1rem 0.4rem", borderRadius: "0.25rem" }}>
                        Break-even: {breakEvenGrade}
                      </span>
                    )}
                    {bestGradingService && (
                      <span style={{ fontSize: "0.6rem", color: "var(--text-muted)", background: "rgba(139,92,246,0.06)", padding: "0.1rem 0.4rem", borderRadius: "0.25rem" }}>
                        Best Service: {bestGradingService}
                      </span>
                    )}
                    {psaStandardCost && (
                      <span style={{ fontSize: "0.6rem", color: "var(--text-muted)", background: "rgba(139,92,246,0.06)", padding: "0.1rem 0.4rem", borderRadius: "0.25rem" }}>
                        PSA Standard: {psaStandardCost}
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Market Intelligence */}
            {bestPlatform && (
              <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-default)", borderRadius: "0.5rem", padding: "0.55rem 0.7rem" }}>
                <div style={{ fontSize: "0.55rem", textTransform: "uppercase", letterSpacing: "0.1em", color: PURPLE, fontWeight: 700, marginBottom: "0.25rem" }}>Market Intelligence</div>
                <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-primary)" }}>Best Platform: {bestPlatform}</div>
                {platformReasoning && <div style={{ fontSize: "0.62rem", color: "var(--text-secondary)", paddingTop: "0.1rem", lineHeight: 1.4 }}>{platformReasoning}</div>}
                {demandTrend && <div style={{ fontSize: "0.62rem", color: "var(--text-muted)", paddingTop: "0.1rem" }}>Demand: {demandTrend}{demandReasoning ? ` — ${demandReasoning}` : ""}</div>}
              </div>
            )}

            {/* Selling Strategy */}
            {sellingStrategy && (
              <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-default)", borderRadius: "0.5rem", padding: "0.55rem 0.7rem" }}>
                <div style={{ fontSize: "0.55rem", textTransform: "uppercase", letterSpacing: "0.1em", color: PURPLE, fontWeight: 700, marginBottom: "0.25rem" }}>Selling Strategy</div>
                <div style={{ fontSize: "0.68rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>{sellingStrategy}</div>
              </div>
            )}

            {/* Listing Title — copyable */}
            {listingTitle && (
              <div style={{ background: PURPLE_BG, border: `1px solid ${PURPLE_BORDER}`, borderRadius: "0.5rem", padding: "0.45rem 0.7rem", position: "relative" }}>
                <div style={{ fontSize: "0.48rem", textTransform: "uppercase", letterSpacing: "0.08em", color: PURPLE, fontWeight: 700 }}>Optimized Listing Title</div>
                <div style={{ fontSize: "0.72rem", fontWeight: 600, color: "var(--text-primary)", marginTop: "0.1rem", userSelect: "all", cursor: "text" }}>{listingTitle}</div>
                <button
                  onClick={() => { if (typeof navigator !== "undefined") navigator.clipboard.writeText(listingTitle); }}
                  style={{ position: "absolute", top: "0.4rem", right: "0.5rem", background: "transparent", border: "none", fontSize: "0.65rem", cursor: "pointer", color: "var(--text-muted)", padding: "0.15rem 0.3rem" }}
                  title="Copy title"
                >
                  Copy
                </button>
              </div>
            )}

            {/* Investment Outlook */}
            {investment && (investment.price_1yr || investment.price_5yr || investment.catalysts || investment.price_target_1yr || investment.investment_thesis) && (
              <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-default)", borderRadius: "0.5rem", padding: "0.55rem 0.7rem" }}>
                <div style={{ fontSize: "0.55rem", textTransform: "uppercase", letterSpacing: "0.1em", color: PURPLE, fontWeight: 700, marginBottom: "0.25rem" }}>Investment Outlook</div>
                {(investment.price_1yr || investment.price_target_1yr || investment.price_5yr || investment.price_target_5yr) && (
                  <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.2rem", flexWrap: "wrap" }}>
                    {(investment.price_1yr || investment.price_target_1yr) && <span style={{ fontSize: "0.65rem", color: "var(--text-primary)", fontWeight: 600 }}>1yr: {investment.price_1yr || investment.price_target_1yr}</span>}
                    {(investment.price_5yr || investment.price_target_5yr) && <span style={{ fontSize: "0.65rem", color: "var(--text-primary)", fontWeight: 600 }}>5yr: {investment.price_5yr || investment.price_target_5yr}</span>}
                  </div>
                )}
                {(investment.catalysts || investment.value_catalysts) && <div style={{ fontSize: "0.62rem", color: "var(--text-secondary)", lineHeight: 1.4 }}>Catalysts: {investment.catalysts || investment.value_catalysts}</div>}
                {(investment.risks || investment.risk_factors) && <div style={{ fontSize: "0.6rem", color: "var(--text-muted)", marginTop: "0.1rem" }}>Risks: {investment.risks || investment.risk_factors}</div>}
                {investment.investment_thesis && <div style={{ fontSize: "0.62rem", color: "var(--text-secondary)", marginTop: "0.1rem", lineHeight: 1.4 }}>{investment.investment_thesis}</div>}
              </div>
            )}

            {/* Rarity & Population */}
            {(populationNote || notableVariations) && (
              <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-default)", borderRadius: "0.5rem", padding: "0.55rem 0.7rem" }}>
                <div style={{ fontSize: "0.55rem", textTransform: "uppercase", letterSpacing: "0.1em", color: PURPLE, fontWeight: 700, marginBottom: "0.25rem" }}>Rarity & Population</div>
                {populationNote && <div style={{ fontSize: "0.62rem", color: "var(--text-secondary)", lineHeight: 1.4 }}>{populationNote}</div>}
                {notableVariations && <div style={{ fontSize: "0.62rem", color: "var(--text-muted)", marginTop: "0.1rem" }}>Variations: {notableVariations}</div>}
              </div>
            )}

            {/* Authentication Notes */}
            {authenticationNotes && (
              <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-default)", borderRadius: "0.5rem", padding: "0.55rem 0.7rem" }}>
                <div style={{ fontSize: "0.55rem", textTransform: "uppercase", letterSpacing: "0.1em", color: PURPLE, fontWeight: 700, marginBottom: "0.25rem" }}>Authentication</div>
                <div style={{ fontSize: "0.62rem", color: "var(--text-secondary)", lineHeight: 1.4 }}>{authenticationNotes}</div>
              </div>
            )}

            {/* Insider Knowledge */}
            {insiderKnowledge && (
              <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-default)", borderRadius: "0.5rem", padding: "0.55rem 0.7rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", marginBottom: "0.25rem" }}>
                  <div style={{ fontSize: "0.55rem", textTransform: "uppercase", letterSpacing: "0.1em", color: PURPLE, fontWeight: 700 }}>Insider Knowledge</div>
                  {communitySentiment && (
                    <span style={{
                      fontSize: "0.55rem", fontWeight: 700, padding: "0.08rem 0.4rem", borderRadius: "20px",
                      background: communitySentiment === "Hot" ? "rgba(239,68,68,0.12)" : communitySentiment === "Warm" ? "rgba(251,191,36,0.12)" : "rgba(139,92,246,0.08)",
                      color: communitySentiment === "Hot" ? "#ef4444" : communitySentiment === "Warm" ? "#fbbf24" : "var(--text-muted)",
                    }}>
                      {communitySentiment}
                    </span>
                  )}
                </div>
                <div style={{ fontSize: "0.68rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>{insiderKnowledge}</div>
              </div>
            )}

            {/* Executive Summary */}
            {summary && (
              <p style={{ fontSize: "0.72rem", color: "var(--text-secondary)", lineHeight: 1.5, margin: 0, padding: "0.5rem", background: PURPLE_BG, borderRadius: "0.35rem", borderLeft: `2px solid ${PURPLE_BORDER}` }}>
                {typeof summary === "string" ? summary.slice(0, 600) : ""}{typeof summary === "string" && summary.length > 600 ? "..." : ""}
              </p>
            )}
          </div>
        )}
      </div>

      {/* MegaBot boost results */}
      {boosted && boostResult && (<>
        <AccordionHeader id="megabot-results" icon="⚡" title="MEGABOT MULTI-AI ANALYSIS" subtitle={`${boostResult.agreementScore ?? "?"}% Agreement`} isOpen={collectSections.has("megabot-results")} onToggle={toggleCollectSection} accentColor="#8b5cf6" badge={`${(boostResult.providers || []).filter((p: any) => p.data || !p.error).length} AI`} />
        {collectSections.has("megabot-results") && <MegaBotBoostResults botType="collectibles" result={boostResult} aiData={aiData} />}
      </>)}

      <PanelFooter
        botName="CollectiblesBot"
        botLink={`/bots/collectiblesbot?item=${itemId}`}
        itemId={itemId}
        botIcon="🎴"
        botCost={1}
        onBotRun={
          hasAnalysis && detection?.isCollectible
            ? onCollectiblesBotRun
            : hasAnalysis && !detection?.isCollectible
            ? () => alert(
                "This item has not been flagged as a collectible. " +
                "Run AI Analysis first — if the item is a collectible, " +
                "CollectiblesBot will unlock automatically."
              )
            : undefined
        }
        onSuperBoost={onSuperBoost}
        boosting={boosting}
        boosted={boosted}
        hasResult={hasResult}
      />
      </div>
    </GlassCard>
  );
}

/* ═══════════════════════════════════════════
   PANEL 8: Antique Evaluation (PAID — CONDITIONAL)
   ═══════════════════════════════════════════ */

function AntiqueEvalPanel({ aiData, antique, itemId, collapsed, onToggle, antiqueBotResult, antiqueBotLoading, antiqueBotError, onAntiqueBotRun, onSuperBoost, boosting, boosted, boostResult, authenticityScore }: {
  aiData: any;
  antique: any;
  itemId: string;
  collapsed?: boolean;
  onToggle?: () => void;
  antiqueBotResult?: any;
  antiqueBotLoading?: boolean;
  antiqueBotError?: string | null;
  onAntiqueBotRun?: () => void;
  onSuperBoost?: () => void;
  boosting?: boolean;
  boosted?: boolean;
  boostResult?: any;
  authenticityScore?: Props["authenticityScore"];
}) {
  const hasAnalysis = !!aiData;

  // Normalize keys to lowercase (OpenAI sometimes returns UPPERCASE keys like AUTHENTICATION)
  function normKeys(obj: any): any {
    if (!obj || typeof obj !== "object" || Array.isArray(obj)) return obj;
    return Object.fromEntries(Object.entries(obj).map(([k, v]) => [k.toLowerCase(), v && typeof v === "object" && !Array.isArray(v) ? normKeys(v) : v]));
  }
  const abr = antiqueBotResult ? normKeys(antiqueBotResult) : null;

  // Extract a numeric price from various AI return formats: number, string "$5,000", or object {low, mid, high}
  function extractPrice(v: any): number | null {
    if (v == null) return null;
    if (typeof v === "number") return isFinite(v) ? v : null;
    if (typeof v === "string") {
      const n = Number(v.replace(/[^0-9.\-]/g, ""));
      return isFinite(n) ? n : null;
    }
    if (typeof v === "object" && !Array.isArray(v)) {
      const mid = extractPrice(v.mid ?? v.middle ?? v.average);
      if (mid != null) return mid;
      const low = extractPrice(v.low ?? v.min);
      const high = extractPrice(v.high ?? v.max);
      if (low != null && high != null) return Math.round((low + high) / 2);
      return low ?? high ?? null;
    }
    return null;
  }
  function formatPrice(v: any): string {
    const n = extractPrice(v);
    return n != null ? `$${Math.round(n).toLocaleString()}` : "—";
  }
  function formatPriceRange(v: any): string {
    if (v && typeof v === "object" && !Array.isArray(v)) {
      const low = extractPrice(v.low ?? v.min);
      const high = extractPrice(v.high ?? v.max);
      if (low != null && high != null) return `$${Math.round(low).toLocaleString()} – $${Math.round(high).toLocaleString()}`;
      if (low != null) return `$${Math.round(low).toLocaleString()}+`;
      if (high != null) return `Up to $${Math.round(high).toLocaleString()}`;
    }
    return formatPrice(v);
  }

  const hasData = !!abr;
  const [antiqueSections, setAntiqueSections] = useState<Set<string>>(new Set(["ant-verdict", "ant-identification", "ant-valuation", "megabot-results"]));
  const toggleAntiqueSection = (id: string) => { setAntiqueSections(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; }); };
  const auth = abr?.authentication as any;
  const val = abr?.valuation as any;
  const ident = abr?.identification as any;

  // Parse antique markers
  let markers: string[] = [];
  if (antique?.reason) {
    try {
      const parsed = JSON.parse(antique.reason);
      if (Array.isArray(parsed.markers)) markers = parsed.markers;
    } catch { /* ignore */ }
  }

  const verdictColor = auth?.verdict === "Authentic" || auth?.verdict === "Likely Authentic"
    ? "#16a34a" : auth?.verdict === "Uncertain" ? "#d97706" : auth?.verdict ? "#dc2626" : "#fbbf24";

  const isAntiqueItem = antique?.isAntique === true;

  // Non-antique intro state (like CarBot's non-vehicle state)
  if (!isAntiqueItem && !hasData) {
    return (
      <GlassCard>
        <PanelHeader icon="🏺" title="Antique Evaluation" hasData={false} collapsed={collapsed} onToggle={onToggle}
          preview="Run evaluation to check"
        />
        {collapsed && (
          <div style={{ padding: "0.75rem 1rem", textAlign: "center" as const, display: "flex", flexDirection: "column" as const, alignItems: "center", gap: "0.4rem", flex: 1, justifyContent: "space-evenly" }}>
            <span style={{ fontSize: "1.5rem" }}>🏺</span>
            <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--text-primary)" }}>Antique Evaluation</div>
            <p style={{ fontSize: "0.68rem", color: "var(--text-secondary)", lineHeight: 1.5, maxWidth: 300, margin: 0 }}>Authentication, historical research, and collector market analysis for antiques.</p>
            <div style={{ width: "100%", maxWidth: 300, padding: "0.5rem 0.65rem", background: "var(--ghost-bg)", borderRadius: "0.5rem", border: "1px solid var(--border-default)", textAlign: "left" as const }}>
              <div style={{ fontSize: "0.55rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" as const, letterSpacing: "0.05em", marginBottom: "0.25rem" }}>What You&apos;ll Get</div>
              {[{ icon: "🏛️", text: "Authentication analysis" }, { icon: "📜", text: "Historical research" }, { icon: "💰", text: "Auction estimate" }].map((b: any, i: number) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.3rem", padding: "0.15rem 0", fontSize: "0.62rem", color: "var(--text-secondary)" }}><span style={{ fontSize: "0.6rem", flexShrink: 0 }}>{b.icon}</span><span>{b.text}</span></div>
              ))}
            </div>
            <div style={{ display: "flex", gap: "0.4rem", justifyContent: "center", flexWrap: "wrap" as const, marginTop: "0.25rem", paddingTop: "0.4rem", borderTop: "1px solid var(--border-default)", width: "100%" }}>
              {onAntiqueBotRun && <button onClick={onAntiqueBotRun} style={{ padding: "0.3rem 0.65rem", fontSize: "0.62rem", fontWeight: 600, borderRadius: "0.4rem", border: "1px solid var(--border-default)", background: "var(--ghost-bg)", color: "var(--text-secondary)", cursor: "pointer", minHeight: "32px" }}>🏺 AntiqueBot · 1 cr</button>}
              <a href={`/bots/antiquebot?item=${itemId}`} style={{ padding: "0.3rem 0.65rem", fontSize: "0.62rem", fontWeight: 600, borderRadius: "0.4rem", border: "1px solid rgba(0,188,212,0.3)", color: "#00bcd4", textDecoration: "none", display: "inline-flex", alignItems: "center", minHeight: "32px" }}>Open AntiqueBot →</a>
            </div>
          </div>
        )}
        <div style={{ display: collapsed ? "none" : "flex", flexDirection: "column" as const, flex: 1 }}>
          <div style={{ padding: "1.25rem" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", flex: 1, justifyContent: "center", padding: "1.25rem", gap: "0.5rem" }}>
              <span style={{ fontSize: "1.5rem" }}>🏺</span>
              <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--text-primary)" }}>Antique Evaluation</div>
              <p style={{ fontSize: "0.68rem", color: "var(--text-secondary)", lineHeight: 1.5, maxWidth: 300, margin: 0 }}>Authentication, historical research, and auction value estimation.</p>
              {antiqueBotError && (
                <div style={{
                  padding: "0.5rem 0.75rem", borderRadius: "0.4rem", width: "100%",
                  background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)",
                  fontSize: "0.75rem", color: "#ef4444", lineHeight: 1.4, textAlign: "left",
                }}>
                  {antiqueBotError}
                </div>
              )}
              <div style={{ width: "100%", maxWidth: 300, padding: "0.5rem 0.65rem", background: "var(--ghost-bg)", borderRadius: "0.5rem", border: "1px solid var(--border-default)", textAlign: "left" }}>
                <div style={{ fontSize: "0.55rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.25rem" }}>What You&apos;ll Get</div>
                {[{ icon: "🏛️", text: "Authentication analysis" }, { icon: "📚", text: "Historical research" }, { icon: "🔨", text: "Auction value estimate" }].map((b, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.3rem", padding: "0.15rem 0", fontSize: "0.62rem", color: "var(--text-secondary)" }}><span style={{ fontSize: "0.6rem", flexShrink: 0 }}>{b.icon}</span><span>{b.text}</span></div>
                ))}
              </div>
              <div style={{ display: "flex", gap: "0.4rem", justifyContent: "center", flexWrap: "wrap", marginTop: "0.5rem", paddingTop: "0.4rem", borderTop: "1px solid var(--border-default)", width: "100%" }}>
                {onAntiqueBotRun && <button onClick={onAntiqueBotRun} style={{ padding: "0.3rem 0.65rem", fontSize: "0.62rem", fontWeight: 600, borderRadius: "0.4rem", border: "1px solid var(--border-default)", background: "var(--ghost-bg)", color: "var(--text-secondary)", cursor: "pointer", minHeight: "32px" }}>🏺 AntiqueBot · 1 cr</button>}
                <a href={`/bots/antiquebot?item=${itemId}`} style={{ padding: "0.3rem 0.65rem", fontSize: "0.62rem", fontWeight: 600, borderRadius: "0.4rem", border: "1px solid rgba(0,188,212,0.3)", color: "#00bcd4", textDecoration: "none", display: "inline-flex", alignItems: "center", minHeight: "32px" }}>Open AntiqueBot →</a>
              </div>
            </div>
          </div>
          {/* MegaBot boost results if already run */}
          {boosted && boostResult && (<>
            <AccordionHeader id="megabot-results" icon="⚡" title="MEGABOT MULTI-AI ANALYSIS" subtitle={`${boostResult.agreementScore ?? "?"}% Agreement`} isOpen={antiqueSections.has("megabot-results")} onToggle={toggleAntiqueSection} accentColor="#8b5cf6" badge={`${(boostResult.providers || []).filter((p: any) => p.data || !p.error).length} AI`} />
            {antiqueSections.has("megabot-results") && <MegaBotBoostResults botType="antique" result={boostResult} aiData={aiData} />}
          </>)}
          <PanelFooter
            botName="AntiqueBot"
            botLink={`/bots/antiquebot?item=${itemId}`}
            itemId={itemId}
            botIcon="🏺"
            botCost={1}
            onBotRun={
              hasAnalysis && isAntiqueItem
                ? onAntiqueBotRun
                : hasAnalysis && !isAntiqueItem
                ? () => alert(
                    "This item has not been flagged as an antique. " +
                    "Run AI Analysis first — if the item is 70+ years " +
                    "old or shows antique indicators, AntiqueBot will " +
                    "unlock automatically."
                  )
                : undefined
            }
            onSuperBoost={onSuperBoost}
            boosting={boosting}
            boosted={boosted}
            hasResult={hasData}
          />
        </div>
      </GlassCard>
    );
  }

  return (
    <GlassCard>
      <PanelHeader icon="🏺" title="Antique Evaluation" hasData={hasData} badge={hasData ? auth?.verdict || "ANALYZED" : undefined} collapsed={collapsed} onToggle={onToggle}
        preview={hasData
          ? `${auth?.verdict || "Evaluated"} · ${antique?.auctionLow != null ? formatPriceRange({ low: antique.auctionLow, high: antique.auctionHigh }) : (val?.fair_market_value ? formatPriceRange(val.fair_market_value) : "")}`
          : "Antique detected — run evaluation"}
      />

      {collapsed && hasData && <CollapsedSummary botType="antique" data={{ isAntique: antique?.isAntique, score: antique?.score, auctionLow: antique?.auctionLow, auctionHigh: antique?.auctionHigh, verdict: auth?.verdict, confidence: auth?.confidence, period: ident?.period, origin: ident?.origin, rarity: ident?.rarity, fmvLow: extractPrice(val?.fair_market_value?.low ?? val?.fair_market_value?.min), fmvHigh: extractPrice(val?.fair_market_value?.high ?? val?.fair_market_value?.max), insuranceValue: extractPrice(val?.insurance_value), overallGrade: abr?.condition_assessment?.overall_grade, collectorDemand: abr?.collector_market?.collector_demand, bestVenue: abr?.selling_strategy?.best_venue }} megaData={boosted ? boostResult : undefined} buttons={<>
        {onAntiqueBotRun && <button onClick={onAntiqueBotRun} style={{ padding: "0.3rem 0.65rem", fontSize: "0.62rem", fontWeight: 600, borderRadius: "0.4rem", border: "1px solid var(--border-default)", background: "var(--ghost-bg)", color: "var(--text-secondary)", cursor: "pointer", minHeight: "32px" }}>🏺 Re-Run · 0.5 cr</button>}
        {onSuperBoost && <button onClick={onSuperBoost} style={{ padding: "0.3rem 0.65rem", fontSize: "0.62rem", fontWeight: 600, borderRadius: "0.4rem", border: "none", background: "linear-gradient(135deg, #00bcd4, #009688)", color: "#fff", cursor: "pointer", minHeight: "32px" }}>{boosted ? "🔄 MegaBot Re-Run · 3 cr" : "⚡ MegaBot · 5 cr"}</button>}
        <a href={`/bots/antiquebot?item=${itemId}`} style={{ padding: "0.3rem 0.65rem", fontSize: "0.62rem", fontWeight: 600, borderRadius: "0.4rem", border: "1px solid rgba(0,188,212,0.3)", color: "#00bcd4", textDecoration: "none", display: "inline-flex", alignItems: "center", minHeight: "32px" }}>Open AntiqueBot →</a>
      </>} />}
      {collapsed && !hasData && (
        <div style={{ padding: "0.65rem 0.85rem", display: "flex", alignItems: "center", gap: "0.65rem" }}>
          <span style={{ fontSize: "1.3rem" }}>🏺</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-primary)" }}>Antique Evaluation</div>
            <div style={{ fontSize: "0.62rem", color: "var(--text-muted)", lineHeight: 1.4 }}>Authentication, history research, and auction estimates</div>
          </div>
          <div style={{ display: "flex", gap: "0.3rem", flexShrink: 0 }}>
            {onAntiqueBotRun && <button onClick={onAntiqueBotRun} style={{ padding: "0.3rem 0.65rem", fontSize: "0.62rem", fontWeight: 600, borderRadius: "0.4rem", border: "1px solid var(--border-default)", background: "var(--ghost-bg)", color: "var(--text-secondary)", cursor: "pointer", minHeight: "32px" }}>🏺 AntiqueBot · 1 cr</button>}
            <a href={`/bots/antiquebot?item=${itemId}`} style={{ padding: "0.3rem 0.65rem", fontSize: "0.62rem", fontWeight: 600, borderRadius: "0.4rem", border: "1px solid rgba(0,188,212,0.3)", color: "#00bcd4", textDecoration: "none", display: "inline-flex", alignItems: "center", minHeight: "32px" }}>Open AntiqueBot →</a>
          </div>
        </div>
      )}

      <div style={{ display: collapsed ? "none" : "flex", flexDirection: "column" as const, flex: 1 }}>
      {/* Authenticity Score Card */}
      {authenticityScore && authenticityScore.score > 0 && (
        <div style={{
          margin: "0.75rem 1.25rem 0",
          padding: "0.75rem 1rem",
          borderRadius: "0.75rem",
          background: `${authenticityScore.tierColor}08`,
          border: `1px solid ${authenticityScore.tierBorderColor}`,
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.75rem", flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.65rem" }}>
              <div style={{
                width: "2.5rem", height: "2.5rem", borderRadius: "50%",
                background: `${authenticityScore.tierColor}15`,
                border: `2px solid ${authenticityScore.tierBorderColor}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "0.85rem", fontWeight: 900, color: authenticityScore.tierColor,
              }}>
                {authenticityScore.score}
              </div>
              <div>
                <div style={{ fontSize: "0.72rem", fontWeight: 700, color: authenticityScore.tierColor, letterSpacing: "0.04em", textTransform: "uppercase" as const }}>
                  {authenticityScore.tierLabel}
                </div>
                <div style={{
                  width: "80px", height: "3px", borderRadius: "2px",
                  background: "var(--ghost-bg)", marginTop: "0.25rem", overflow: "hidden",
                }}>
                  <div style={{
                    width: `${authenticityScore.score}%`, height: "100%", borderRadius: "2px",
                    background: authenticityScore.tierColor,
                  }} />
                </div>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              {authenticityScore.nextTierLabel && (
                <span style={{ fontSize: "0.62rem", color: "var(--text-muted)" }}>
                  Next: {authenticityScore.nextTierLabel}
                </span>
              )}
              {authenticityScore.score >= 34 && (
                <a
                  href={`/bots/antiquebot/certificate/${itemId}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    padding: "0.2rem 0.6rem", borderRadius: "6px", fontSize: "0.65rem", fontWeight: 700,
                    background: `${authenticityScore.tierColor}15`,
                    border: `1px solid ${authenticityScore.tierBorderColor}`,
                    color: authenticityScore.tierColor,
                    textDecoration: "none", whiteSpace: "nowrap" as const,
                  }}
                >
                  View Certificate
                </a>
              )}
            </div>
          </div>
        </div>
      )}
      <div style={{ padding: "1.25rem" }}>
        {antiqueBotLoading ? (
          <BotLoadingState botName="AntiqueBot" />
        ) : !hasData ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", flex: 1, justifyContent: "space-evenly" }}>
            {antiqueBotError && (
              <div style={{
                padding: "0.5rem 0.75rem", borderRadius: "0.4rem",
                background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)",
                fontSize: "0.75rem", color: "#ef4444", lineHeight: 1.4,
              }}>
                {antiqueBotError}
              </div>
            )}
            {/* Era/maker grid from AI analysis — 3x2 */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
              {[
                { label: "Era", value: aiData?.era || "Unknown" },
                { label: "Maker", value: aiData?.maker || aiData?.brand || "Unknown" },
                { label: "Material", value: aiData?.material || "Unknown" },
                { label: "Style", value: aiData?.style || "Unknown" },
                { label: "Markings", value: aiData?.markings || "Unknown" },
                { label: "Condition", value: aiData?.condition_score ? `${aiData.condition_score}/10` : "Unknown" },
              ].map((d) => (
                <div key={d.label} style={{ background: "var(--bg-card)", border: "1px solid var(--border-default)", borderRadius: "0.5rem", padding: "0.5rem 0.65rem" }}>
                  <div style={{ fontSize: "0.5rem", textTransform: "uppercase" as const, letterSpacing: "0.1em", color: "var(--text-muted)" }}>{d.label}</div>
                  <div style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-primary)", marginTop: "0.1rem" }}>{d.value}</div>
                </div>
              ))}
            </div>

            {/* Auction estimate from detection */}
            {antique?.auctionLow != null && (
              <div style={{ background: "rgba(251,191,36,0.06)", border: "1px solid rgba(251,191,36,0.25)", borderRadius: "0.5rem", padding: "0.5rem 0.7rem", textAlign: "center" as const }}>
                <div style={{ fontSize: "0.5rem", textTransform: "uppercase" as const, letterSpacing: "0.1em", color: "#fbbf24", fontWeight: 700 }}>Preliminary Auction Estimate</div>
                <div style={{ fontSize: "1rem", fontWeight: 800, color: "#fbbf24", marginTop: "0.15rem" }}>${antique.auctionLow.toLocaleString()} – ${antique.auctionHigh.toLocaleString()}</div>
              </div>
            )}

            {/* Detection confidence */}
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
              padding: "0.4rem 0.65rem", borderRadius: "0.5rem",
              background: "var(--ghost-bg)", border: "1px solid var(--border-default)",
            }}>
              <div style={{ fontSize: "0.5rem", textTransform: "uppercase" as const, letterSpacing: "0.08em", color: "var(--text-muted)", fontWeight: 700 }}>Detection Score</div>
              <div style={{ fontSize: "0.82rem", fontWeight: 800, color: (antique?.score ?? 0) >= 20 ? "#16a34a" : (antique?.score ?? 0) >= 12 ? "#f59e0b" : "#d97706" }}>
                {antique?.score ?? "?"}/100
              </div>
              <div style={{ fontSize: "0.5rem", color: "var(--text-muted)" }}>
                ({(antique?.score ?? 0) >= 20 ? "High confidence" : (antique?.score ?? 0) >= 12 ? "Moderate" : "Low"})
              </div>
            </div>

            {markers.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap" as const, gap: "0.25rem" }}>
                {markers.slice(0, 6).map((m: string) => (
                  <span key={m} style={{ padding: "0.15rem 0.45rem", borderRadius: "9999px", fontSize: "0.6rem", fontWeight: 600, background: "rgba(251,191,36,0.1)", color: "#fbbf24", border: "1px solid rgba(251,191,36,0.2)" }}>{m}</span>
                ))}
              </div>
            )}

            {/* What You'll Get — standardized */}
            <div style={{ width: "100%", maxWidth: 300, padding: "0.5rem 0.65rem", background: "var(--ghost-bg)", borderRadius: "0.5rem", border: "1px solid var(--border-default)", textAlign: "left" }}>
              <div style={{ fontSize: "0.55rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.25rem" }}>What You&apos;ll Get</div>
              {[{ icon: "🏛️", text: "Authentication analysis" }, { icon: "📚", text: "Historical research" }, { icon: "🔨", text: "Auction value estimate" }].map((b, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.3rem", padding: "0.15rem 0", fontSize: "0.62rem", color: "var(--text-secondary)" }}><span style={{ fontSize: "0.6rem", flexShrink: 0 }}>{b.icon}</span><span>{b.text}</span></div>
              ))}
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>

            {/* ── AUTHENTICATION VERDICT ACCORDION ── */}
            <AccordionHeader id="ant-verdict" icon="🔍" title="AUTHENTICATION" subtitle={auth?.verdict ? `${auth.verdict} · ${auth.confidence || "?"}%` : "Pending"} isOpen={antiqueSections.has("ant-verdict")} onToggle={toggleAntiqueSection} accentColor={verdictColor} />
            {antiqueSections.has("ant-verdict") && (
              <div style={{ padding: "0.35rem 0" }}>
                {auth && (
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.5rem 0.65rem", borderRadius: "0.5rem", background: `${verdictColor}10`, border: `1px solid ${verdictColor}25`, marginBottom: "0.5rem" }}>
                    <span style={{ fontSize: "1.2rem" }}>
                      {auth.verdict === "Authentic" || auth.verdict === "Likely Authentic" ? "✅" : auth.verdict === "Uncertain" ? "⚠️" : "❌"}
                    </span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: "0.78rem", fontWeight: 800, color: verdictColor }}>{auth.verdict || "Evaluated"}</div>
                      {auth.confidence && <div style={{ fontSize: "0.6rem", color: "var(--text-muted)" }}>Confidence: {auth.confidence}%</div>}
                    </div>
                  </div>
                )}
                {auth?.reasoning && (
                  <p style={{ fontSize: "0.68rem", color: "var(--text-secondary)", lineHeight: 1.5, margin: "0 0 0.5rem", padding: "0.4rem 0.65rem", background: "var(--ghost-bg)", borderRadius: "0.4rem", borderLeft: `2px solid ${verdictColor}` }}>
                    {String(auth.reasoning).slice(0, 300)}{String(auth.reasoning).length > 300 ? "..." : ""}
                  </p>
                )}
                {auth?.positive_indicators && (auth.positive_indicators as string[]).length > 0 && (
                  <div style={{ marginBottom: "0.4rem" }}>
                    <div style={{ fontSize: "0.5rem", fontWeight: 700, color: "#16a34a", textTransform: "uppercase" as const, letterSpacing: "0.06em", marginBottom: "0.2rem" }}>Positive Indicators</div>
                    <div style={{ display: "flex", flexWrap: "wrap" as const, gap: "0.25rem" }}>
                      {(auth.positive_indicators as string[]).slice(0, 5).map((ind: string, i: number) => (
                        <span key={i} style={{ padding: "0.15rem 0.45rem", borderRadius: "9999px", fontSize: "0.58rem", fontWeight: 600, background: "rgba(22,163,74,0.08)", color: "#16a34a", border: "1px solid rgba(22,163,74,0.2)" }}>{ind}</span>
                      ))}
                    </div>
                  </div>
                )}
                {auth?.red_flags && (auth.red_flags as string[]).length > 0 && (
                  <div style={{ marginBottom: "0.4rem" }}>
                    <div style={{ fontSize: "0.5rem", fontWeight: 700, color: "#dc2626", textTransform: "uppercase" as const, letterSpacing: "0.06em", marginBottom: "0.2rem" }}>Red Flags</div>
                    <div style={{ display: "flex", flexWrap: "wrap" as const, gap: "0.25rem" }}>
                      {(auth.red_flags as string[]).slice(0, 5).map((flag: string, i: number) => (
                        <span key={i} style={{ padding: "0.15rem 0.45rem", borderRadius: "9999px", fontSize: "0.58rem", fontWeight: 600, background: "rgba(220,38,38,0.08)", color: "#dc2626", border: "1px solid rgba(220,38,38,0.2)" }}>{flag}</span>
                      ))}
                    </div>
                  </div>
                )}
                {auth?.recommended_tests && (auth.recommended_tests as string[]).length > 0 && (
                  <div>
                    <div style={{ fontSize: "0.5rem", fontWeight: 700, color: "#00bcd4", textTransform: "uppercase" as const, letterSpacing: "0.06em", marginBottom: "0.2rem" }}>Recommended Tests</div>
                    {(auth.recommended_tests as string[]).slice(0, 3).map((test: string, i: number) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.3rem", padding: "0.15rem 0", fontSize: "0.62rem", color: "var(--text-secondary)" }}>
                        <span style={{ color: "#00bcd4", fontWeight: 700, fontSize: "0.55rem" }}>{i + 1}.</span>
                        <span>{test}</span>
                      </div>
                    ))}
                  </div>
                )}
                {auth?.appraiser_recommendation && (
                  <div style={{ marginTop: "0.4rem", padding: "0.4rem 0.65rem", borderRadius: "0.4rem", background: "rgba(251,191,36,0.06)", border: "1px solid rgba(251,191,36,0.2)", borderLeft: "3px solid #fbbf24" }}>
                    <div style={{ fontSize: "0.5rem", fontWeight: 700, color: "#fbbf24", textTransform: "uppercase" as const, marginBottom: "0.15rem" }}>Appraiser Recommendation</div>
                    <p style={{ fontSize: "0.65rem", color: "var(--text-secondary)", lineHeight: 1.5, margin: 0 }}>{String(auth.appraiser_recommendation).slice(0, 200)}</p>
                  </div>
                )}
              </div>
            )}

            {/* ── IDENTIFICATION ACCORDION ── */}
            <AccordionHeader id="ant-identification" icon="🏺" title="IDENTIFICATION" subtitle={ident?.period ? `${ident.period} · ${ident.origin || ""}` : ""} isOpen={antiqueSections.has("ant-identification")} onToggle={toggleAntiqueSection} />
            {antiqueSections.has("ant-identification") && (
              <div style={{ padding: "0.35rem 0" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
                  {[
                    { label: "Type", value: ident?.item_type },
                    { label: "Period", value: ident?.period },
                    { label: "Origin", value: ident?.origin },
                    { label: "Maker", value: typeof ident?.maker_info === "object" ? ident?.maker_info?.name : (ident?.maker_info || aiData?.maker) },
                    { label: "Material", value: typeof ident?.material_analysis === "object" ? ident?.material_analysis?.primary : (ident?.material_analysis || aiData?.material) },
                    { label: "Style", value: ident?.style_movement || aiData?.style },
                    { label: "Rarity", value: ident?.rarity },
                    { label: "Markings", value: aiData?.markings },
                  ].filter((d) => d.value).map((d) => (
                    <div key={d.label} style={{ background: "var(--bg-card)", border: "1px solid var(--border-default)", borderRadius: "0.5rem", padding: "0.5rem 0.65rem" }}>
                      <div style={{ fontSize: "0.48rem", textTransform: "uppercase" as const, letterSpacing: "0.1em", color: "var(--text-muted)", fontWeight: 600 }}>{d.label}</div>
                      <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-primary)", marginTop: "0.1rem" }}>{d.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── EXPERT VALUATION ACCORDION ── */}
            <AccordionHeader id="ant-valuation" icon="💰" title="EXPERT VALUATION" subtitle={val?.fair_market_value ? formatPriceRange(val.fair_market_value) : ""} isOpen={antiqueSections.has("ant-valuation")} onToggle={toggleAntiqueSection} accentColor="#fbbf24" />
            {antiqueSections.has("ant-valuation") && (
              <div style={{ padding: "0.35rem 0" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", marginBottom: "0.5rem" }}>
                  {[
                    { label: "Fair Market Value", value: val?.fair_market_value ? formatPriceRange(val.fair_market_value) : null, color: "#fbbf24", primary: true },
                    { label: "Insurance Value", value: val?.insurance_value ? formatPrice(val.insurance_value) : null, color: "#00bcd4" },
                    { label: "Auction Estimate", value: val?.auction_estimate ? formatPriceRange(val.auction_estimate) : (antique?.auctionLow ? `$${antique.auctionLow.toLocaleString()} – $${antique.auctionHigh.toLocaleString()}` : null), color: "#f59e0b" },
                    { label: "Dealer Buy Price", value: val?.dealer_buy_price ? formatPrice(val.dealer_buy_price) : null, color: "#22c55e" },
                    { label: "Replacement Value", value: val?.replacement_value ? formatPrice(val.replacement_value) : null, color: "#8b5cf6" },
                    { label: "Value Trend", value: val?.value_trend || null, color: val?.value_trend === "Appreciating" ? "#22c55e" : val?.value_trend === "Stable" ? "#00bcd4" : "#ef4444" },
                  ].filter((d) => d.value).map((d: any) => (
                    <div key={d.label} style={{
                      background: d.primary ? `${d.color}08` : "var(--bg-card)",
                      border: `1px solid ${d.primary ? `${d.color}30` : "var(--border-default)"}`,
                      borderRadius: "0.5rem", padding: "0.5rem 0.65rem", textAlign: "center" as const,
                    }}>
                      <div style={{ fontSize: "0.48rem", textTransform: "uppercase" as const, letterSpacing: "0.08em", color: "var(--text-muted)", fontWeight: 700 }}>{d.label}</div>
                      <div style={{ fontSize: d.primary ? "1rem" : "0.82rem", fontWeight: 800, color: d.color, marginTop: "0.15rem" }}>{d.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── CONDITION ASSESSMENT ACCORDION ── */}
            {abr?.condition_assessment && (<>
              <AccordionHeader id="ant-condition" icon="📋" title="CONDITION ASSESSMENT" subtitle={abr.condition_assessment.overall_grade || ""} isOpen={antiqueSections.has("ant-condition")} onToggle={toggleAntiqueSection} />
              {antiqueSections.has("ant-condition") && (() => {
                const cond = abr.condition_assessment;
                return (
                  <div style={{ padding: "0.35rem 0" }}>
                    {cond.overall_grade && (
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.4rem 0.65rem", marginBottom: "0.4rem", borderRadius: "0.4rem", background: "var(--ghost-bg)" }}>
                        <div style={{ fontSize: "0.48rem", color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase" as const }}>Overall Grade</div>
                        <div style={{ fontSize: "0.78rem", fontWeight: 800, color: "#00bcd4" }}>{cond.overall_grade}</div>
                      </div>
                    )}
                    {cond.age_appropriate_wear && (
                      <p style={{ fontSize: "0.65rem", color: "var(--text-secondary)", lineHeight: 1.5, margin: "0 0 0.35rem", padding: "0.3rem 0.5rem" }}>
                        ⏳ {String(cond.age_appropriate_wear).slice(0, 200)}
                      </p>
                    )}
                    {cond.restoration_detected && (
                      <p style={{ fontSize: "0.65rem", color: "#f59e0b", lineHeight: 1.5, margin: "0 0 0.35rem", padding: "0.3rem 0.5rem" }}>
                        🔧 Restoration: {String(cond.restoration_detected).slice(0, 150)}
                      </p>
                    )}
                    {cond.conservation_recommendations && (
                      <div style={{ padding: "0.4rem 0.65rem", borderRadius: "0.4rem", background: "rgba(0,188,212,0.04)", border: "1px solid rgba(0,188,212,0.15)", borderLeft: "3px solid #00bcd4" }}>
                        <div style={{ fontSize: "0.5rem", fontWeight: 700, color: "#00bcd4", textTransform: "uppercase" as const, marginBottom: "0.15rem" }}>Conservation Tips</div>
                        <p style={{ fontSize: "0.62rem", color: "var(--text-secondary)", lineHeight: 1.5, margin: 0 }}>{String(cond.conservation_recommendations).slice(0, 250)}</p>
                      </div>
                    )}
                  </div>
                );
              })()}
            </>)}

            {/* ── COLLECTOR MARKET ACCORDION ── */}
            {abr?.collector_market && (<>
              <AccordionHeader id="ant-market" icon="🏛️" title="COLLECTOR MARKET" subtitle={abr.collector_market.collector_demand || ""} isOpen={antiqueSections.has("ant-market")} onToggle={toggleAntiqueSection} />
              {antiqueSections.has("ant-market") && (() => {
                const cm = abr.collector_market;
                return (
                  <div style={{ padding: "0.35rem 0" }}>
                    <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.4rem" }}>
                      {cm.collector_demand && (
                        <div style={{ flex: 1, textAlign: "center" as const, padding: "0.4rem", borderRadius: "0.4rem", background: "var(--ghost-bg)", border: "1px solid var(--border-default)" }}>
                          <div style={{ fontSize: "0.48rem", color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase" as const }}>Demand</div>
                          <div style={{ fontSize: "0.78rem", fontWeight: 800, color: cm.collector_demand === "High" || cm.collector_demand === "Strong" ? "#22c55e" : "#f59e0b" }}>{cm.collector_demand}</div>
                        </div>
                      )}
                      {cm.market_outlook && (
                        <div style={{ flex: 1, textAlign: "center" as const, padding: "0.4rem", borderRadius: "0.4rem", background: "var(--ghost-bg)", border: "1px solid var(--border-default)" }}>
                          <div style={{ fontSize: "0.48rem", color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase" as const }}>Outlook</div>
                          <div style={{ fontSize: "0.78rem", fontWeight: 800, color: "var(--text-primary)" }}>{cm.market_outlook}</div>
                        </div>
                      )}
                    </div>
                    {cm.collector_base && (
                      <p style={{ fontSize: "0.65rem", color: "var(--text-secondary)", lineHeight: 1.5, margin: "0 0 0.35rem", padding: "0.3rem 0.5rem" }}>
                        👥 {String(cm.collector_base).slice(0, 200)}
                      </p>
                    )}
                    {cm.recent_auction_results && (cm.recent_auction_results as any[]).length > 0 && (
                      <div style={{ marginTop: "0.3rem" }}>
                        <div style={{ fontSize: "0.5rem", fontWeight: 700, color: "#fbbf24", textTransform: "uppercase" as const, letterSpacing: "0.06em", marginBottom: "0.2rem" }}>Recent Auction Results</div>
                        {(cm.recent_auction_results as any[]).slice(0, 3).map((ar: any, i: number) => (
                          <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.25rem 0.5rem", fontSize: "0.62rem", borderBottom: "1px solid var(--border-default)" }}>
                            <span style={{ color: "var(--text-secondary)" }}>{ar.house || ar.auction_house || "Auction"} {ar.date ? `(${ar.date})` : ""}</span>
                            <span style={{ fontWeight: 700, color: "#fbbf24" }}>{ar.hammer_price || ar.realized_price ? formatPrice(ar.hammer_price || ar.realized_price) : "—"}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })()}
            </>)}

            {/* ── SELLING STRATEGY ACCORDION ── */}
            {abr?.selling_strategy && (<>
              <AccordionHeader id="ant-strategy" icon="🎯" title="SELLING STRATEGY" subtitle={abr.selling_strategy.best_venue || ""} isOpen={antiqueSections.has("ant-strategy")} onToggle={toggleAntiqueSection} />
              {antiqueSections.has("ant-strategy") && (() => {
                const ss = abr.selling_strategy;
                return (
                  <div style={{ padding: "0.35rem 0" }}>
                    {ss.best_venue && (
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.4rem 0.65rem", marginBottom: "0.4rem", borderRadius: "0.4rem", background: "rgba(22,163,74,0.06)", border: "1px solid rgba(22,163,74,0.2)" }}>
                        <div style={{ fontSize: "0.48rem", color: "#16a34a", fontWeight: 700, textTransform: "uppercase" as const }}>Best Venue</div>
                        <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "#16a34a" }}>🏆 {ss.best_venue}</div>
                      </div>
                    )}
                    {ss.timing && (
                      <p style={{ fontSize: "0.65rem", color: "var(--text-secondary)", lineHeight: 1.5, margin: "0 0 0.35rem", padding: "0.3rem 0.5rem" }}>
                        ⏰ {String(ss.timing).slice(0, 150)}
                      </p>
                    )}
                    {ss.presentation_tips && (ss.presentation_tips as string[]).length > 0 && (
                      <div style={{ marginBottom: "0.3rem" }}>
                        <div style={{ fontSize: "0.5rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" as const, letterSpacing: "0.06em", marginBottom: "0.15rem" }}>Presentation Tips</div>
                        {(ss.presentation_tips as string[]).slice(0, 3).map((tip: string, i: number) => (
                          <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "0.3rem", padding: "0.15rem 0.5rem", fontSize: "0.62rem", color: "var(--text-secondary)" }}>
                            <span style={{ color: "#00bcd4", fontWeight: 700, fontSize: "0.55rem", flexShrink: 0 }}>✓</span>
                            <span>{tip}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {ss.reserve_strategy && (
                      <div style={{ padding: "0.35rem 0.65rem", borderRadius: "0.4rem", background: "rgba(251,191,36,0.04)", borderLeft: "2px solid rgba(251,191,36,0.3)" }}>
                        <div style={{ fontSize: "0.5rem", fontWeight: 700, color: "#fbbf24", textTransform: "uppercase" as const, marginBottom: "0.1rem" }}>Reserve Strategy</div>
                        <p style={{ fontSize: "0.62rem", color: "var(--text-secondary)", lineHeight: 1.4, margin: 0 }}>{String(ss.reserve_strategy).slice(0, 150)}</p>
                      </div>
                    )}
                  </div>
                );
              })()}
            </>)}

            {/* ── EXECUTIVE SUMMARY ── */}
            {abr?.executive_summary && (
              <div style={{ padding: "0.5rem 0.65rem", borderRadius: "0.5rem", background: "rgba(251,191,36,0.04)", border: "1px solid rgba(251,191,36,0.15)", borderLeft: "3px solid rgba(251,191,36,0.4)" }}>
                <div style={{ fontSize: "0.5rem", fontWeight: 700, color: "#fbbf24", textTransform: "uppercase" as const, letterSpacing: "0.06em", marginBottom: "0.25rem" }}>Expert Summary</div>
                <p style={{ fontSize: "0.72rem", color: "var(--text-secondary)", lineHeight: 1.6, margin: 0 }}>
                  {String(abr.executive_summary)}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* MegaBot boost results — full 4-agent breakdown */}
      {boosted && boostResult && (<>
        <AccordionHeader id="megabot-results" icon="⚡" title="MEGABOT MULTI-AI ANALYSIS" subtitle={`${boostResult.agreementScore ?? "?"}% Agreement`} isOpen={antiqueSections.has("megabot-results")} onToggle={toggleAntiqueSection} accentColor="#8b5cf6" badge={`${(boostResult.providers || []).filter((p: any) => p.data || !p.error).length} AI`} />
        {antiqueSections.has("megabot-results") && <MegaBotBoostResults botType="antique" result={boostResult} aiData={aiData} />}
      </>)}

      <PanelFooter
        botName="AntiqueBot"
        botLink={`/bots/antiquebot?item=${itemId}`}
        itemId={itemId}
        botIcon="🏺"
        botCost={1}
        onBotRun={
          hasAnalysis && isAntiqueItem
            ? onAntiqueBotRun
            : hasAnalysis && !isAntiqueItem
            ? () => alert(
                "This item has not been flagged as an antique. " +
                "Run AI Analysis first — if the item is 70+ years " +
                "old or shows antique indicators, AntiqueBot will " +
                "unlock automatically."
              )
            : undefined
        }
        onSuperBoost={onSuperBoost}
        boosting={boosting}
        boosted={boosted}
        hasResult={hasData}
      />
      </div>
    </GlassCard>
  );
}

/* ═══════════════════════════════════════════
   MEGABOT POWER CENTER (standalone bottom panel)
   ═══════════════════════════════════════════ */

function MegaBotPowerCenter({ itemId, boostedBots, boostResults, aiData, onBoostAll, collapsed, onToggle, boostingBot }: {
  itemId: string;
  boostedBots: Set<string>;
  boostResults: Record<string, any>;
  aiData: any;
  onBoostAll?: () => void;
  collapsed?: boolean;
  onToggle?: () => void;
  boostingBot?: string | null;
}) {
  const allBots = [
    { key: "analysis", label: "AnalyzeBot", icon: "🧠", color: "#00bcd4" },
    { key: "pricing", label: "PriceBot", icon: "💰", color: "#4caf50" },
    { key: "shipping", label: "ShipBot", icon: "📦", color: "#9c27b0" },
    { key: "photos", label: "PhotoBot", icon: "📷", color: "#f06292" },
    { key: "buyers", label: "BuyerBot", icon: "🎯", color: "#e91e63" },
    { key: "listing", label: "ListBot", icon: "📝", color: "#ff9800" },
    { key: "recon", label: "ReconBot", icon: "🔍", color: "#607d8b" },
    { key: "carbot", label: "CarBot", icon: "🚗", color: "#2196f3" },
    { key: "antique", label: "AntiqueBot", icon: "🏺", color: "#d97706" },
    { key: "collectibles", label: "CollectiblesBot", icon: "🎴", color: "#3b82f6" },
    { key: "video", label: "VideoBot", icon: "🎬", color: "#ef4444" },
  ];

  const boostedCount = allBots.filter((b) => boostedBots.has(b.key)).length;
  const remaining = allBots.filter((b) => !boostedBots.has(b.key));

  // Compute cross-bot agreement from stored results
  const boostedResults = allBots
    .filter((b) => boostedBots.has(b.key) && boostResults[b.key])
    .map((b) => ({ ...b, result: boostResults[b.key] }));

  const avgAgreement = boostedResults.length > 0
    ? Math.round(
        boostedResults.reduce((sum, br) => {
          const raw = br.result?.agreementScore || 0;
          return sum + (raw > 1 ? raw : raw * 100);
        }, 0) / boostedResults.length
      )
    : 0;

  // Agent performance across all boosted bots
  const AGENTS = [
    { key: "openai", label: "OpenAI", icon: "🤖", color: "#10a37f" },
    { key: "claude", label: "Claude", icon: "🧠", color: "#d97706" },
    { key: "gemini", label: "Gemini", icon: "🔮", color: "#4285f4" },
    { key: "grok", label: "Grok", icon: "🌀", color: "#00DC82" },
  ];

  const agentStats = AGENTS.map((agent) => {
    let successes = 0;
    let totalTime = 0;
    let count = 0;
    for (const br of boostedResults) {
      const providers: any[] = br.result?.providers || [];
      const p = providers.find((pp: any) => pp.provider === agent.key);
      if (p && !p.error) {
        successes++;
        totalTime += p.durationMs || p.responseTime || 0;
        count++;
      }
    }
    return { ...agent, successes, avgTime: count > 0 ? Math.round(totalTime / count) : 0, total: boostedResults.length };
  });

  return (
    <GlassCard premium fullWidth>
      <PanelHeader icon="⚡" title="MegaBot — Multi-AI Power Center" hasData={boostedCount > 0} badge="PREMIUM" collapsed={collapsed} onToggle={onToggle}
        preview={boostedCount > 0 ? `${boostedCount}/${allBots.length} boosted · ${avgAgreement}% avg agreement` : "No bots enhanced yet"}
      />
      {collapsed && (
        <div style={{ padding: "0.5rem 0.85rem" }}>
          <div style={{ display: "flex", gap: "0.35rem", justifyContent: "center", marginBottom: "0.4rem", flexWrap: "wrap" as const }}>
            {allBots.map((b) => {
              const isBoosted = boostedBots.has(b.key);
              const agreeRaw = boostResults[b.key]?.agreementScore;
              const agreeNum = agreeRaw ? Math.round(agreeRaw > 1 ? agreeRaw : agreeRaw * 100) : 0;
              return (
                <div key={b.key} style={{
                  display: "flex", flexDirection: "column" as const, alignItems: "center",
                  padding: "0.25rem 0.35rem", borderRadius: "0.35rem", minWidth: "36px",
                  background: isBoosted ? "rgba(139,92,246,0.08)" : "var(--ghost-bg)",
                  border: `1px solid ${isBoosted ? "rgba(139,92,246,0.25)" : "var(--border-default)"}`,
                }}>
                  <span style={{ fontSize: "0.7rem" }}>{b.icon}</span>
                  <span style={{ fontSize: "0.48rem", fontWeight: 700, color: isBoosted ? "#a855f7" : "var(--text-muted)" }}>
                    {isBoosted ? `${agreeNum}%` : "—"}
                  </span>
                </div>
              );
            })}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            {remaining.length > 0 && aiData && onBoostAll && (
              <button onClick={onBoostAll} disabled={!!boostingBot} style={{ padding: "0.3rem 0.65rem", fontSize: "0.62rem", fontWeight: 600, borderRadius: "0.4rem", border: "none", background: boostingBot ? "var(--ghost-bg)" : "linear-gradient(135deg, #8b5cf6, #6d28d9)", color: boostingBot ? "var(--text-muted)" : "#fff", cursor: boostingBot ? "not-allowed" : "pointer", minHeight: "32px" }}>
                {boostingBot ? "⏳ Boosting..." : `⚡ Boost ${remaining.length} Remaining`}
              </button>
            )}
            <a href={`/bots/megabot?item=${itemId}`} style={{ fontSize: "0.62rem", fontWeight: 600, color: "#00bcd4", textDecoration: "none", marginLeft: "auto" }}>
              Open Console →
            </a>
          </div>
        </div>
      )}

      <div style={{ display: collapsed ? "none" : "flex", flexDirection: "column" as const, flex: 1 }}>
      <div style={{ padding: "1.25rem" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>

          {/* ═══ STAT CARDS ═══ */}
          <div style={{
            display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.65rem",
          }}>
            {[
              { label: "Bots Enhanced", value: `${boostedCount}/${allBots.length}`, color: "var(--accent)", icon: "🤖" },
              { label: "Agreement", value: boostedCount > 0 ? `${avgAgreement}%` : "—", color: avgAgreement >= 75 ? "#4caf50" : avgAgreement > 0 ? "#ff9800" : "var(--text-muted)", icon: "📊" },
              { label: "AI Engines", value: "4", color: "#a855f7", icon: "⚡" },
              { label: "Remaining", value: `${remaining.length}`, color: remaining.length > 0 ? "#f59e0b" : "#4caf50", icon: remaining.length > 0 ? "⏳" : "✅" },
            ].map((s) => (
              <div key={s.label} style={{
                textAlign: "center", padding: "0.75rem 0.5rem", borderRadius: "0.75rem",
                background: "var(--bg-card)", border: "1px solid var(--border-default)",
              }}>
                <div style={{ fontSize: "0.85rem", marginBottom: "0.25rem" }}>{s.icon}</div>
                <div style={{ fontSize: "1.15rem", fontWeight: 800, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: "0.52rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginTop: "0.15rem" }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* ═══ CONSENSUS BARS ═══ */}
          {boostedCount > 0 && (
            <div style={{
              background: "linear-gradient(135deg, rgba(139,92,246,0.05), rgba(0,188,212,0.03))",
              borderRadius: "0.75rem", padding: "0.85rem 1rem",
              border: "1px solid rgba(139,92,246,0.12)",
            }}>
              <div style={{ fontSize: "0.55rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "#a855f7", fontWeight: 700, marginBottom: "0.5rem" }}>
                CONSENSUS BY BOT
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                {allBots.filter((b) => boostedBots.has(b.key)).map((b) => {
                  const r = boostResults[b.key];
                  const raw = r?.agreementScore || 0;
                  const agree = Math.round(raw > 1 ? raw : raw * 100);
                  return (
                    <div key={b.key} style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                      <span style={{ fontSize: "0.65rem", minWidth: 80, fontWeight: 600, color: b.color, whiteSpace: "nowrap" as const, overflow: "hidden", textOverflow: "ellipsis" }}>
                        {b.icon} {b.label}
                      </span>
                      <div style={{ flex: 1, height: 6, borderRadius: 99, background: "var(--ghost-bg)", overflow: "hidden" }}>
                        <div style={{
                          height: "100%", width: `${agree}%`, borderRadius: 99,
                          background: agree >= 80 ? "linear-gradient(90deg, #10b981, #34d399)" : agree >= 60 ? "linear-gradient(90deg, #f59e0b, #fbbf24)" : "linear-gradient(90deg, #ef4444, #f87171)",
                          transition: "width 0.5s ease",
                        }} />
                      </div>
                      <span style={{
                        fontSize: "0.62rem", fontWeight: 700, minWidth: 30, textAlign: "right" as const,
                        color: agree >= 80 ? "#10b981" : agree >= 60 ? "#f59e0b" : "#ef4444",
                      }}>{agree}%</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ═══ BOT STATUS GRID ═══ */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "0.4rem" }}>
            {allBots.map((b) => {
              const isBoosted = boostedBots.has(b.key);
              const result = boostResults[b.key];
              const agreement = result?.agreementScore;
              const agreeNum = agreement ? Math.round(agreement > 1 ? agreement : agreement * 100) : 0;
              return (
                <div key={b.key} style={{
                  padding: "0.5rem 0.35rem",
                  borderRadius: "0.6rem",
                  fontSize: "0.6rem",
                  fontWeight: 600,
                  background: boostingBot === b.key ? `${b.color}15` : isBoosted ? `${b.color}08` : "var(--bg-card)",
                  color: boostingBot === b.key ? b.color : isBoosted ? b.color : "var(--text-muted)",
                  border: `1px solid ${boostingBot === b.key ? b.color : isBoosted ? `${b.color}35` : "var(--border-default)"}`,
                  textAlign: "center" as const,
                  transition: "all 0.2s ease",
                  boxShadow: boostingBot === b.key ? `0 0 12px ${b.color}30` : "none",
                  animation: boostingBot === b.key ? "pulse 1.5s ease-in-out infinite" : "none",
                }}>
                  <div style={{ fontSize: "0.85rem", marginBottom: "0.15rem" }}>{b.icon}</div>
                  <div style={{ fontSize: "0.55rem", fontWeight: 700, lineHeight: 1.2 }}>{b.label}</div>
                  {boostingBot === b.key ? (
                    <div style={{ fontSize: "0.55rem", marginTop: "0.2rem" }}>
                      <span style={{
                        padding: "0.1rem 0.3rem", borderRadius: 99,
                        background: `${b.color}20`,
                        color: b.color,
                        fontWeight: 700,
                        animation: "pulse 1.5s ease-in-out infinite",
                      }}>⚡ Running...</span>
                    </div>
                  ) : isBoosted ? (
                    <div style={{ fontSize: "0.55rem", marginTop: "0.2rem" }}>
                      <span style={{
                        padding: "0.1rem 0.3rem", borderRadius: 99,
                        background: agreeNum >= 75 ? "rgba(76,175,80,0.12)" : "rgba(255,152,0,0.12)",
                        color: agreeNum >= 75 ? "#4caf50" : "#ff9800",
                        fontWeight: 700,
                      }}>✓ {agreeNum}%</span>
                    </div>
                  ) : (
                    <div style={{ fontSize: "0.55rem", marginTop: "0.2rem", opacity: 0.4 }}>—</div>
                  )}
                </div>
              );
            })}
          </div>

          {/* ═══ AGENT PERFORMANCE CARDS ═══ */}
          {boostedCount > 0 && (
            <div>
              <div style={{ fontSize: "0.55rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-muted)", marginBottom: "0.5rem", fontWeight: 700 }}>AI ENGINE PERFORMANCE</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.5rem" }}>
                {agentStats.map((a) => {
                  const rate = a.total > 0 ? Math.round((a.successes / a.total) * 100) : 0;
                  return (
                    <div key={a.key} style={{
                      padding: "0.65rem 0.5rem", borderRadius: "0.65rem",
                      background: a.successes > 0 ? `${a.color}06` : "var(--bg-card)",
                      border: `1px solid ${a.successes > 0 ? `${a.color}25` : "var(--border-default)"}`,
                      textAlign: "center",
                    }}>
                      <div style={{
                        width: 28, height: 28, borderRadius: "50%", margin: "0 auto 0.35rem",
                        background: a.successes > 0 ? `${a.color}18` : "var(--ghost-bg)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: "0.85rem",
                        boxShadow: a.successes > 0 ? `0 0 8px ${a.color}25` : "none",
                      }}>{a.icon}</div>
                      <div style={{ fontSize: "0.65rem", fontWeight: 700, color: a.successes > 0 ? a.color : "var(--text-muted)" }}>{a.label}</div>
                      <div style={{ fontSize: "0.48rem", color: "var(--text-muted)", marginTop: "0.1rem", fontFamily: "monospace" }}>
                        {a.key === "openai" ? "gpt-4o" : a.key === "claude" ? "haiku" : a.key === "gemini" ? "1.5-flash" : "grok-3"}
                      </div>
                      {/* Success rate bar */}
                      <div style={{ margin: "0.3rem auto 0", width: "80%", height: 4, borderRadius: 99, background: "var(--ghost-bg)", overflow: "hidden" }}>
                        <div style={{
                          height: "100%", width: `${rate}%`, borderRadius: 99,
                          background: a.color, transition: "width 0.4s ease",
                        }} />
                      </div>
                      <div style={{ fontSize: "0.48rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>
                        {a.successes}/{a.total} · {a.avgTime > 0 ? `~${(a.avgTime / 1000).toFixed(1)}s` : "—"}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ═══ EMPTY STATE ═══ */}
          {boostedCount === 0 && (
            <div style={{
              padding: "1.5rem", textAlign: "center", borderRadius: "0.75rem",
              background: "linear-gradient(135deg, rgba(139,92,246,0.04), rgba(0,188,212,0.02))",
              border: "1px solid rgba(139,92,246,0.1)",
            }}>
              <div style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>⚡</div>
              <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", lineHeight: 1.5, margin: "0 0 0.75rem 0" }}>
                Run MegaBot on individual bots above, or boost all at once for maximum AI consensus.
              </p>
            </div>
          )}

          {/* ═══ BOOST PROGRESS ═══ */}
          {boostingBot && (
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              gap: "0.5rem", padding: "0.5rem 0.75rem",
              background: "rgba(139,92,246,0.06)",
              border: "1px solid rgba(139,92,246,0.15)",
              borderRadius: "0.5rem",
            }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#8b5cf6", animation: "pulse 1s ease-in-out infinite" }} />
              <span style={{ fontSize: "0.72rem", fontWeight: 600, color: "#8b5cf6" }}>
                Now boosting: {allBots.find(b => b.key === boostingBot)?.label || boostingBot}
              </span>
              <span style={{ fontSize: "0.62rem", color: "var(--text-muted)" }}>
                ({boostedCount + 1}/{allBots.length})
              </span>
            </div>
          )}

          {/* ═══ BOOST ALL BUTTON ═══ */}
          {remaining.length > 0 && aiData && (
            <div style={{ display: "flex", justifyContent: "center" }}>
              <button
                onClick={onBoostAll}
                disabled={!!boostingBot}
                style={{
                  padding: "0.65rem 2rem",
                  fontSize: "0.82rem",
                  fontWeight: 700,
                  borderRadius: "10px",
                  border: "none",
                  background: boostingBot ? "var(--ghost-bg)" : "linear-gradient(135deg, #8b5cf6, #6d28d9)",
                  color: boostingBot ? "var(--text-muted)" : "#fff",
                  cursor: boostingBot ? "not-allowed" : "pointer",
                  boxShadow: boostingBot ? "none" : "0 4px 16px rgba(139,92,246,0.3)",
                  transition: "all 0.2s ease",
                }}>
                {boostingBot
                  ? "⏳ Boosting in progress..."
                  : `⚡ Boost ${remaining.length === allBots.length ? "All" : `${remaining.length} Remaining`} · ${remaining.length * 5} credits`
                }
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ═══ FOOTER LINK ═══ */}
      <div style={{ padding: "0.75rem 1.25rem", borderTop: "1px solid var(--border-default)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <a href={`/bots/megabot?item=${itemId}`} style={{
          padding: "0.35rem 0.85rem", fontSize: "0.72rem", fontWeight: 600, borderRadius: "8px",
          border: "1px solid rgba(139,92,246,0.3)", background: "rgba(139,92,246,0.06)",
          color: "#8b5cf6", textDecoration: "none",
          transition: "all 0.15s ease",
        }}>
          Open MegaBot Console →
        </a>
        {boostedCount > 0 && (
          <span style={{ fontSize: "0.58rem", color: "var(--text-muted)" }}>
            {boostedCount * 4} agent analyses completed
          </span>
        )}
      </div>
      </div>
    </GlassCard>
  );
}

/* ═══════════════════════════════════════════
   BOT SUMMARY (kept as collapsible)
   ═══════════════════════════════════════════ */

function BotSummaryContent({ aiData, valuation, antique, photos, megabotUsed, itemId, category }: {
  aiData: any;
  valuation: any;
  antique: any;
  photos: any[];
  megabotUsed: boolean;
  itemId: string;
  category: string;
}) {
  const isAntique = antique?.isAntique === true;
  const bots = [
    { name: "AnalyzeBot", icon: "🧠", status: aiData ? "Complete" : "Not run", finding: aiData ? `${aiData.item_name || "Identified"} — ${Math.round((aiData.confidence || 0) * 100)}% confident` : "—", link: `/bots/analyzebot?item=${itemId}` },
    { name: "PriceBot", icon: "💰", status: valuation ? "Complete" : "Not run", finding: valuation ? `$${Math.round(valuation.low)} – $${Math.round(valuation.high)}` : "—", link: `/bots/pricebot?item=${itemId}` },
    { name: "ListBot", icon: "📝", status: aiData ? "Ready" : "Waiting", finding: aiData ? "Ready to generate listing" : "Needs analysis first", link: `/bots/listbot?item=${itemId}` },
    { name: "BuyerBot", icon: "🎯", status: aiData ? "Ready" : "Waiting", finding: aiData ? "Ready to scan for buyers" : "Analyze item first", link: `/bots/buyerbot?item=${itemId}` },
    { name: "Shipping", icon: "📦", status: aiData ? "Ready" : "Waiting", finding: aiData ? "Estimates available" : "Analyze first", link: `/shipping?itemId=${itemId}` },
    { name: "PhotoBot", icon: "📷", status: photos.length > 0 ? "Ready" : "No photos", finding: `${photos.length} photo${photos.length !== 1 ? "s" : ""}`, link: `/bots/photobot?item=${itemId}` },
    { name: "MegaBot", icon: "⚡", status: megabotUsed ? "Used" : "Available", finding: megabotUsed ? "Multi-agent complete" : "Run MegaBot on any bot", link: `/bots/megabot?item=${itemId}` },
  ];
  if (isAntique) {
    bots.push({ name: "Antique Eval", icon: "🏛️", status: "Active", finding: antique.auctionLow != null ? `$${antique.auctionLow.toLocaleString()} – $${antique.auctionHigh.toLocaleString()}` : "Antique detected", link: `/bots/megabot?item=${itemId}&mode=antique` });
  }

  const completed = bots.filter((b) => ["Complete", "Active", "Used"].includes(b.status)).length;
  const readiness = Math.round((completed / bots.length) * 100);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.25rem" }}>
        <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>Readiness:</span>
        <div style={{ flex: 1, height: 6, borderRadius: 99, background: "var(--ghost-bg)", overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${readiness}%`, borderRadius: 99, background: readiness >= 60 ? "#4caf50" : "#ff9800" }} />
        </div>
        <span style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--text-primary)" }}>{readiness}%</span>
      </div>
      {bots.map((b) => (
        <a key={b.name} href={b.link} style={{
          display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.65rem 0.85rem",
          borderRadius: "0.65rem", border: "1px solid var(--border-default)",
          background: "var(--bg-card)", textDecoration: "none", color: "inherit",
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

/* ═══════════════════════════════════════════
   ITEM CONTROL CENTER
   ═══════════════════════════════════════════ */

const STATUS_FLOW = [
  { key: "DRAFT", label: "Draft", icon: "📝" },
  { key: "ANALYZED", label: "Analyzed", icon: "🔍" },
  { key: "READY", label: "Ready", icon: "✅" },
  { key: "LISTED", label: "Listed", icon: "📢" },
  { key: "INTERESTED", label: "Interest", icon: "💬" },
  { key: "SOLD", label: "Sold", icon: "💰" },
  { key: "SHIPPED", label: "Shipped", icon: "📦" },
  { key: "COMPLETED", label: "Done", icon: "🎉" },
];

function ItemControlCenter({ itemId, status, valuation, aiData, listingPrice: initialListingPrice, collapsed, onToggle, photos, category, extra, shippingData, projectId }: {
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
}) {
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

  // Confidence value
  const rawConf = valuation?.confidence ?? aiData?.confidence ?? 0;
  const confPct = Math.round(rawConf > 1 ? rawConf : rawConf * 100);

  return (
    <GlassCard fullWidth>
      <PanelHeader icon={"\u{1F39B}\u{FE0F}"} title="Item Control Center" hasData={true} badge="STATUS" collapsed={collapsed} onToggle={onToggle} />
      {collapsed && (
        <div style={{
          padding: "0.4rem 1rem",
          display: "flex", alignItems: "center", gap: "0.5rem",
          flexWrap: "wrap", justifyContent: "center",
        }}>
          <span style={{
            fontSize: "0.58rem", fontWeight: 700, padding: "2px 8px",
            borderRadius: "9999px",
            background: status === "SOLD" || status === "COMPLETED" ? "rgba(34,197,94,0.1)"
              : status === "SHIPPED" ? "rgba(59,130,246,0.1)"
              : status === "LISTED" || status === "INTERESTED" ? "rgba(0,188,212,0.1)"
              : status === "ANALYZED" || status === "READY" ? "rgba(245,158,11,0.1)"
              : "var(--ghost-bg)",
            color: status === "SOLD" || status === "COMPLETED" ? "#22c55e"
              : status === "SHIPPED" ? "#3b82f6"
              : status === "LISTED" || status === "INTERESTED" ? "#00bcd4"
              : status === "ANALYZED" || status === "READY" ? "#f59e0b"
              : "var(--text-muted)",
          }}>
            {status}
          </span>
          {(initialListingPrice || valuation) && (
            <span style={{ fontSize: "0.68rem", fontWeight: 700, color: "#00bcd4" }}>
              {initialListingPrice ? `$${Math.round(initialListingPrice)}` :
               valuation?.low != null && valuation?.high != null ? `$${Math.round(valuation.low)}\u2013$${Math.round(valuation.high)}` : ""}
            </span>
          )}
          {confPct > 0 && <span style={{ fontSize: "0.56rem", color: confPct >= 80 ? "#22c55e" : confPct >= 60 ? "#eab308" : "#ef4444" }}>{confPct}% AI</span>}
          {(extra?.totalViews ?? 0) > 0 && <span style={{ fontSize: "0.56rem", color: "var(--text-muted)" }}>{extra!.totalViews} views</span>}
        </div>
      )}
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
                    boxShadow: isCurrent ? "0 0 10px rgba(0,188,212,0.45)" : "none",
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

        {/* ── AI SUGGESTED NEXT ACTION ── */}
        {(() => {
          const hasPhotos = (photos?.length ?? 0) > 0;
          const hasAnalysis = !!aiData;
          const hasPrice = !!initialListingPrice;
          const views = extra?.totalViews ?? 0;
          const msg = status === "DRAFT" && !hasPhotos ? "📸 Add photos to get started — AI needs at least 1 image"
            : status === "DRAFT" && hasPhotos && !hasAnalysis ? "🧠 Ready for AI — tap Run AI Analysis above"
            : (status === "ANALYZED" || status === "READY") && !hasPrice ? `💰 Set a listing price${valuation ? ` — AI suggests $${Math.round(valuation.low || 0)}–$${Math.round(valuation.high || 0)}` : ""}`
            : (status === "ANALYZED" || status === "READY") && hasPrice ? "📢 Ready to list! Mark as Listed to go live"
            : status === "LISTED" && views === 0 ? "⏳ Just listed — share your link to attract buyers"
            : status === "LISTED" && views > 0 ? "📊 Getting views! Check messages for inquiries"
            : status === "INTERESTED" ? "🤝 Buyers interested — check messages and close the sale"
            : status === "SOLD" ? "📦 Congrats! Ship within 3 days for best rating"
            : status === "SHIPPED" ? "📬 Package on its way — mark complete when delivered"
            : status === "COMPLETED" ? "🎉 All done! Create a new listing or check earnings"
            : null;
          if (!msg) return null;
          return (
            <div style={{ padding: "0.4rem 0.6rem", marginBottom: "0.5rem", borderRadius: "0.4rem", borderLeft: "3px solid var(--accent)", background: "var(--ghost-bg)", fontSize: "0.68rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>
              {msg}
            </div>
          );
        })()}

        {/* ── TELEMETRY BAR — Inline KPIs ── */}
        <div style={{
          display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap",
          padding: "0.4rem 0.6rem", marginBottom: "0.5rem",
          background: "linear-gradient(135deg, rgba(0,188,212,0.03), rgba(0,188,212,0.01))",
          borderRadius: "0.5rem", border: "1px solid rgba(0,188,212,0.08)",
        }}>
          {/* Photo count */}
          {(photos?.length ?? 0) > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: "0.2rem" }}>
              <span style={{ fontSize: "0.6rem", color: "var(--text-muted)" }}>{"\u{1F4F7}"}</span>
              <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--text-primary)" }}>{photos!.length}</span>
              <span style={{ fontSize: "0.55rem", color: photos!.length >= 6 ? "#22c55e" : "var(--text-muted)" }}>{photos!.length >= 6 ? "\u2713" : "/6"}</span>
            </div>
          )}
          {/* AI confidence gauge */}
          {confPct > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
              <div style={{ width: "28px", height: "4px", borderRadius: "2px", background: "var(--ghost-bg)", overflow: "hidden" }}>
                <div style={{ width: `${confPct}%`, height: "100%", borderRadius: "2px", background: confPct >= 80 ? "#22c55e" : confPct >= 60 ? "#eab308" : "#ef4444", transition: "width 0.5s ease" }} />
              </div>
              <span style={{ fontSize: "0.6rem", fontWeight: 700, color: confPct >= 80 ? "#22c55e" : confPct >= 60 ? "#eab308" : "#ef4444" }}>{confPct}%</span>
            </div>
          )}
          {/* Category */}
          {(category || aiData?.category) && (
            <span style={{ fontSize: "0.6rem", fontWeight: 600, color: "var(--text-secondary)" }}>
              {category || aiData.category}
            </span>
          )}
          {/* Price range */}
          {valuation?.low != null && valuation?.high != null && (
            <span style={{ fontSize: "0.65rem", fontWeight: 700, color: "#4ade80", letterSpacing: "-0.01em" }}>
              ${Math.round(valuation.low)}{"\u2013"}${Math.round(valuation.high)}
            </span>
          )}
          {/* Spacer pushes metrics right */}
          <div style={{ flex: 1 }} />
          {/* Engagement metrics */}
          {(extra?.totalViews ?? 0) > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: "0.15rem" }}>
              <span style={{ fontSize: "0.55rem", color: "var(--text-muted)" }}>{"\u{1F441}"}</span>
              <span style={{ fontSize: "0.6rem", fontWeight: 600, color: "var(--text-secondary)" }}>{extra!.totalViews}</span>
            </div>
          )}
          {(extra?.inquiries ?? 0) > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: "0.15rem" }}>
              <span style={{ fontSize: "0.55rem", color: "#a78bfa" }}>{"\u{1F4AC}"}</span>
              <span style={{ fontSize: "0.6rem", fontWeight: 600, color: "#a78bfa" }}>{extra!.inquiries}</span>
            </div>
          )}
          {(extra?.buyersFound ?? 0) > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: "0.15rem" }}>
              <span style={{ fontSize: "0.55rem", color: "#f59e0b" }}>{"\u{1F916}"}</span>
              <span style={{ fontSize: "0.6rem", fontWeight: 600, color: "#f59e0b" }}>{extra!.buyersFound}</span>
            </div>
          )}
          {(extra?.documentCount ?? 0) > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: "0.15rem" }}>
              <span style={{ fontSize: "0.55rem", color: "var(--text-muted)" }}>{"\u{1F4C4}"}</span>
              <span style={{ fontSize: "0.6rem", fontWeight: 600, color: "var(--text-secondary)" }}>{extra!.documentCount}</span>
            </div>
          )}
          {extra?.shippingReady && (
            <span style={{ fontSize: "0.5rem", fontWeight: 700, color: "#22c55e", background: "rgba(34,197,94,0.08)", padding: "1px 5px", borderRadius: "4px" }}>SHIP {"\u2713"}</span>
          )}
          {/* AI Readiness */}
          {(() => {
            const checks = [
              { ok: (photos?.length ?? 0) > 0, label: "Photos" },
              { ok: !!aiData, label: "AI Analysis" },
              { ok: !!valuation, label: "Valuation" },
              { ok: !!initialListingPrice, label: "Price" },
              { ok: shippingData?.weight != null, label: "Shipping" },
            ];
            const score = checks.filter(c => c.ok).length;
            const color = score >= 4 ? "#22c55e" : score >= 2 ? "#f59e0b" : "#ef4444";
            return (
              <button onClick={() => setShowReadiness(!showReadiness)} style={{ padding: "1px 6px", borderRadius: "4px", fontSize: "0.55rem", fontWeight: 700, color, background: `${color}12`, border: `1px solid ${color}25`, cursor: "pointer" }}>
                {score}/5 ✓
              </button>
            );
          })()}
        </div>

        {/* AI Readiness Checklist */}
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
                <span style={{ color: c.ok ? "#22c55e" : "#ef4444" }}>{c.ok ? "✓" : "✗"}</span>
                <span style={{ color: c.ok ? "var(--text-secondary)" : "var(--text-primary)", fontWeight: c.ok ? 400 : 600 }}>{c.label}</span>
                {!c.ok && c.fix && <a href={c.fix} style={{ fontSize: "0.55rem", color: "var(--accent)", textDecoration: "none", marginLeft: "auto" }}>Fix →</a>}
              </div>
            ))}
          </div>
        )}

        {/* ── UNIFIED COMMAND BAR ── */}
        <div style={{
          display: "flex", alignItems: "center", gap: "0.35rem", flexWrap: "wrap",
          padding: "0.45rem 0.55rem", marginBottom: "0.5rem",
          background: "var(--ghost-bg)", borderRadius: "0.5rem",
          border: "1px solid var(--border-default)",
        }}>
          {/* Primary action — hero button */}
          {actions.filter(a => a.primary).map((a) => (
            <button
              key={a.label}
              onClick={a.onClick}
              disabled={updating || deleting}
              style={{
                padding: "0.35rem 0.75rem", borderRadius: "0.4rem", fontSize: "0.72rem", fontWeight: 700, cursor: "pointer",
                background: "linear-gradient(135deg, #00bcd4, #0097a7)", border: "none", color: "#fff",
                opacity: (updating || deleting) ? 0.5 : 1, transition: "all 0.2s ease",
                boxShadow: "0 2px 8px rgba(0,188,212,0.3)",
              }}
            >
              {a.label}
            </button>
          ))}

          {/* Divider */}
          {actions.filter(a => a.primary).length > 0 && actions.filter(a => !a.primary && !a.danger).length > 0 && (
            <div style={{ width: "1px", height: "20px", background: "var(--border-default)" }} />
          )}

          {/* Secondary actions */}
          {actions.filter(a => !a.primary && !a.danger).map((a) => (
            <button
              key={a.label}
              onClick={a.onClick}
              disabled={updating || deleting}
              style={{
                padding: "0.3rem 0.55rem", borderRadius: "0.35rem", fontSize: "0.65rem", fontWeight: 600, cursor: "pointer",
                background: "transparent", border: "1px solid var(--border-default)",
                color: "var(--text-secondary)",
                opacity: (updating || deleting) ? 0.5 : 1, transition: "all 0.15s ease",
              }}
            >
              {a.label}
            </button>
          ))}

          {/* Price + Net — pushed right */}
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "0.25rem" }}>
            <span style={{ fontSize: "0.6rem", fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.04em" }}>$</span>
            <input
              type="number"
              min="0"
              step="0.01"
              placeholder={valuation?.mid ? `${Math.round(valuation.mid)}` : "0"}
              value={priceInput}
              onChange={(e) => setPriceInput(e.target.value)}
              style={{
                background: "var(--bg-card)", border: "1px solid rgba(0,188,212,0.2)",
                borderRadius: "0.3rem", padding: "0.25rem 0.4rem",
                color: "var(--text-primary)", fontSize: "0.82rem", fontWeight: 700,
                width: "75px", outline: "none",
              }}
            />
            <button
              onClick={async () => {
                const val = parseFloat(priceInput);
                if (isNaN(val) || val < 0) return;
                setPriceSaveState("saving");
                try {
                  const res = await fetch(`/api/items/status/${itemId}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ listingPrice: val }),
                  });
                  if (res.ok) { setPriceSaveState("saved"); setTimeout(() => setPriceSaveState("idle"), 2000); }
                  else { setPriceSaveState("error"); setTimeout(() => setPriceSaveState("idle"), 2000); }
                } catch { setPriceSaveState("error"); setTimeout(() => setPriceSaveState("idle"), 2000); }
              }}
              disabled={priceSaveState === "saving"}
              style={{
                background: priceSaveState === "saved" ? "#22c55e" : priceSaveState === "error" ? "#ef4444" : "linear-gradient(135deg, #00bcd4, #009688)",
                border: "none", borderRadius: "0.3rem", padding: "0.25rem 0.5rem",
                color: "#fff", fontWeight: 700, fontSize: "0.62rem",
                cursor: priceSaveState === "saving" ? "wait" : "pointer",
                opacity: priceSaveState === "saving" ? 0.6 : 1,
                minWidth: "36px", textAlign: "center" as const,
                boxShadow: "0 1px 4px rgba(0,188,212,0.2)",
                transition: "all 0.2s ease",
              }}
            >
              {priceSaveState === "saving" ? "\u23F3" : priceSaveState === "saved" ? "\u2713" : priceSaveState === "error" ? "\u2717" : "SET"}
            </button>
            {listPriceNum > 0 && (
              <span style={{ fontSize: "0.55rem", color: "#4ade80", fontWeight: 700, whiteSpace: "nowrap" }}>
                net ~${netEst.toFixed(0)}
              </span>
            )}
          </div>

          {/* Danger actions at far right */}
          {actions.filter(a => a.danger).map((a) => (
            <button
              key={a.label}
              onClick={a.onClick}
              disabled={updating || deleting}
              style={{
                padding: "0.25rem 0.4rem", borderRadius: "0.3rem", fontSize: "0.58rem", fontWeight: 600, cursor: "pointer",
                background: "transparent", border: "1px solid rgba(239,68,68,0.12)",
                color: "#ef4444", opacity: (updating || deleting) ? 0.5 : 1,
              }}
            >
              {a.label}
            </button>
          ))}
        </div>

        {/* ── MORE ACTIONS ROW ── */}
        <div style={{ marginBottom: "0.5rem" }}>
          <button onClick={() => setShowMoreActions(!showMoreActions)} style={{ background: "transparent", border: "none", cursor: "pointer", fontSize: "0.62rem", fontWeight: 600, color: "var(--text-muted)", padding: "0.2rem 0.4rem", borderRadius: "0.3rem" }}>
            ⚙️ {showMoreActions ? "Less" : "More"}
          </button>
          {showMoreActions && (
            <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" as const, marginTop: "0.3rem", padding: "0.35rem 0.5rem", background: "var(--ghost-bg)", borderRadius: "0.4rem" }}>
              <button onClick={() => { window.print(); }} style={{ padding: "0.3rem 0.6rem", fontSize: "0.6rem", fontWeight: 600, background: "transparent", border: "1px solid var(--border-default)", borderRadius: "0.35rem", cursor: "pointer", color: "var(--text-secondary)" }}>🖨️ Print</button>
              <button onClick={() => {
                const blob = new Blob([JSON.stringify({ itemId, status, category, aiData, valuation, photos: photos?.map((p: any) => p.filePath) }, null, 2)], { type: "application/json" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a"); a.href = url; a.download = `legacyloop-${itemId.slice(0, 8)}.json`; a.click(); URL.revokeObjectURL(url);
                setExportDone(true); setTimeout(() => setExportDone(false), 2000);
              }} style={{ padding: "0.3rem 0.6rem", fontSize: "0.6rem", fontWeight: 600, background: "transparent", border: "1px solid var(--border-default)", borderRadius: "0.35rem", cursor: "pointer", color: "var(--text-secondary)" }}>{exportDone ? "✅ Exported" : "📥 Export"}</button>
              <button onClick={() => {
                const url = `${typeof window !== "undefined" ? window.location.origin : ""}/store`;
                navigator.clipboard.writeText(url);
                setPublicLinkCopied(true); setTimeout(() => setPublicLinkCopied(false), 2000);
              }} style={{ padding: "0.3rem 0.6rem", fontSize: "0.6rem", fontWeight: 600, background: "transparent", border: "1px solid var(--border-default)", borderRadius: "0.35rem", cursor: "pointer", color: "var(--text-secondary)" }}>{publicLinkCopied ? "✅ Copied" : "🔗 Public Link"}</button>
            </div>
          )}
        </div>

        {/* ── MANAGE STRIP — Trade · Sale · Offers ── */}
        <div style={{
          display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap",
          padding: "0.35rem 0.55rem",
          background: "linear-gradient(135deg, rgba(0,188,212,0.02), transparent)",
          borderRadius: "0.4rem", border: "1px solid rgba(0,188,212,0.06)",
          marginBottom: "0.5rem",
        }}>
          {/* Trade toggle + pending indicator */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
            <TradeToggle itemId={itemId} />
          </div>

          <div style={{ width: "1px", height: "16px", background: "var(--border-default)", opacity: 0.5 }} />

          {/* Sale assignment */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
            <span style={{ fontSize: "0.55rem", color: "var(--text-muted)" }}>🏷️</span>
            <SaleAssignment itemId={itemId} initialProjectId={projectId ?? null} />
            {projectId && (
              <span style={{ fontSize: "0.55rem", fontWeight: 600, padding: "1px 5px", borderRadius: "4px", background: "rgba(0,188,212,0.08)", color: "var(--accent)", border: "1px solid rgba(0,188,212,0.15)" }}>Assigned</span>
            )}
            {!projectId && (
              <a href="/projects/new" style={{ fontSize: "0.55rem", color: "var(--accent)", textDecoration: "none", fontWeight: 600 }}>+ New</a>
            )}
          </div>

          <div style={{ flex: 1 }} />

          {/* Offers jump */}
          <button
            onClick={() => {
              const el = document.getElementById("active-offers-widget");
              if (el) el.scrollIntoView({ behavior: "smooth" });
            }}
            style={{
              fontSize: "0.55rem", fontWeight: 600, color: "var(--accent)",
              background: "rgba(0,188,212,0.06)", border: "1px solid rgba(0,188,212,0.12)",
              borderRadius: "0.3rem", padding: "0.15rem 0.4rem",
              cursor: "pointer", transition: "all 0.15s ease",
            }}
          >
            {"\u{1F91D}"} Offers
          </button>
        </div>

        {/* ── POST-SALE SECTIONS (contextual) ── */}
        {(status === "SOLD" || status === "SHIPPED" || status === "COMPLETED") && (
          <div style={{
            padding: "0.4rem 0.55rem", marginBottom: "0.5rem",
            background: "linear-gradient(135deg, rgba(34,197,94,0.04), rgba(34,197,94,0.01))",
            borderRadius: "0.5rem", border: "1px solid rgba(34,197,94,0.1)",
          }}>
            {/* Sale summary line */}
            {price && (
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.35rem" }}>
                <span style={{ fontSize: "0.5rem", fontWeight: 800, color: "#22c55e", background: "rgba(34,197,94,0.12)", padding: "2px 6px", borderRadius: "4px", letterSpacing: "0.06em" }}>SOLD</span>
                <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--text-primary)" }}>${price}{"\u2013"}${priceHigh}</span>
                {aiData?.category && <span style={{ fontSize: "0.6rem", color: "var(--text-muted)" }}>{"\u00B7"} {aiData.category}</span>}
              </div>
            )}

            {/* Shipping bridge */}
            {(status === "SOLD" || status === "SHIPPED") && (
              <a
                href={`/shipping?itemId=${itemId}`}
                style={{
                  display: "flex", alignItems: "center", gap: "0.4rem",
                  width: "100%", padding: "0.35rem 0.5rem", borderRadius: "0.35rem",
                  background: "rgba(0,188,212,0.04)", border: "1px solid rgba(0,188,212,0.15)",
                  color: "#00bcd4", fontSize: "0.7rem", fontWeight: 600,
                  textDecoration: "none", transition: "all 0.15s ease",
                  marginBottom: "0.3rem",
                }}
              >
                <span>{"\u{1F4E6}"}</span>
                <span style={{ flex: 1 }}>{status === "SOLD" ? "Shipping Center" : "Track Shipment"}</span>
                <span style={{ fontSize: "0.55rem", color: "var(--text-muted)", fontWeight: 400 }}>{status === "SOLD" ? "Labels & carriers" : "Live status"}</span>
                <span style={{ fontSize: "0.7rem" }}>{"\u2192"}</span>
              </a>
            )}

            {/* Returns row */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", flexWrap: "wrap" }}>
              <button
                onClick={relistItem}
                disabled={relistLoading}
                style={{
                  padding: "0.2rem 0.5rem", borderRadius: "0.3rem", fontSize: "0.62rem", fontWeight: 600,
                  border: "1px solid rgba(0,188,212,0.15)", background: "rgba(0,188,212,0.03)",
                  color: "#00bcd4", cursor: relistLoading ? "wait" : "pointer",
                  opacity: relistLoading ? 0.6 : 1,
                }}
              >
                {relistLoading ? "..." : "\u{1F504} Relist Item"}
              </button>
              <button
                onClick={() => setShowReturnsInfo(!showReturnsInfo)}
                style={{ fontSize: "0.55rem", fontWeight: 500, color: "var(--text-muted)", background: "none", border: "none", cursor: "pointer", padding: 0 }}
              >
                {showReturnsInfo ? "\u25B2" : "\u25BC"} Returns info
              </button>
              {!refundLoading && refundRequests.length === 0 && (
                <span style={{ fontSize: "0.55rem", color: "var(--text-muted)", marginLeft: "auto", opacity: 0.6 }}>No refunds</span>
              )}
            </div>

            {showReturnsInfo && (
              <div style={{ fontSize: "0.58rem", color: "var(--text-muted)", lineHeight: 1.45, padding: "0.25rem 0.4rem", background: "var(--ghost-bg)", border: "1px solid var(--border-default)", borderRadius: "0.3rem", marginTop: "0.25rem" }}>
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
                <div key={r.id} style={{ padding: "0.25rem 0.4rem", borderRadius: "0.3rem", background: "var(--ghost-bg)", border: "1px solid var(--border-default)", marginTop: "0.2rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                    <span style={{ fontSize: "0.62rem", fontWeight: 600, color: "var(--text-primary)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>{r.data?.reason || "Refund"}</span>
                    {r.data?.refundAmount && <span style={{ fontSize: "0.55rem", color: "var(--text-muted)" }}>${Number(r.data.refundAmount).toFixed(2)}</span>}
                    <span style={{ fontSize: "0.5rem", fontWeight: 700, padding: "1px 5px", borderRadius: 6, background: badge.bg, color: badge.color }}>{badge.label}</span>
                    {isPending && (
                      <>
                        <button onClick={() => handleRefund("approve")} disabled={refundActionLoading === "approve"} style={{ padding: "2px 8px", fontSize: "0.55rem", fontWeight: 700, borderRadius: 4, border: "none", background: "#22c55e", color: "#fff", cursor: "pointer", opacity: refundActionLoading === "approve" ? 0.5 : 1 }}>{"\u2713"}</button>
                        <button onClick={() => handleRefund("deny")} disabled={refundActionLoading === "deny"} style={{ padding: "2px 8px", fontSize: "0.55rem", fontWeight: 700, borderRadius: 4, border: "1px solid rgba(239,68,68,0.25)", background: "transparent", color: "#ef4444", cursor: "pointer", opacity: refundActionLoading === "deny" ? 0.5 : 1 }}>{"\u2717"}</button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── QUICK NAV ── */}
        <div style={{ display: "flex", gap: "0.2rem", flexWrap: "wrap", justifyContent: "center" }}>
          {[
            { icon: "\u270F\u{FE0F}", label: "Edit", href: `/items/${itemId}/edit` },
            { icon: "+", label: "New", href: "/items/new" },
            { icon: "\u{1F3EA}", label: "Store", href: "/store" },
            { icon: "\u{1F4AC}", label: "Messages", href: `/messages?itemId=${itemId}` },
            { icon: "\u{1F4CA}", label: "Dashboard", href: "/dashboard" },
            ...((status === "ANALYZED" || status === "READY") ? [{ icon: "\u{1F916}", label: "Bots", href: "/bots" }] : []),
          ].map((link) => (
            <a
              key={link.label}
              href={link.href}
              style={{
                display: "inline-flex", alignItems: "center", gap: "0.15rem",
                padding: "0.18rem 0.35rem", borderRadius: "0.25rem",
                background: "transparent", border: "none",
                color: "var(--text-muted)", textDecoration: "none",
                fontSize: "0.58rem", fontWeight: 500,
                transition: "color 0.15s ease",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#00bcd4"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--text-muted)"; }}
            >
              <span>{link.icon}</span>
              <span>{link.label}</span>
            </a>
          ))}
        </div>

      </div>
      </div>
    </GlassCard>
  );
}

/* ═══════════════════════════════════════════
   RECON BOT PANEL
   ═══════════════════════════════════════════ */

function ReconBotPanel({ aiData, itemId, reconBotResult, reconBotLoading, onReconBotRun, onSuperBoost, boosting, boosted, boostResult, collapsed, onToggle }: {
  aiData: any; itemId: string; reconBotResult: any; reconBotLoading: boolean;
  onReconBotRun: () => void; onSuperBoost: () => void;
  boosting: boolean; boosted: boolean; boostResult: any;
  collapsed: boolean; onToggle: () => void;
}) {
  const hasData = !!reconBotResult;
  const scan = reconBotResult?.scan_summary;
  const pi = reconBotResult?.price_intelligence;
  const alerts = reconBotResult?.alerts || [];
  const competitors = reconBotResult?.competitor_listings || [];
  const sold = reconBotResult?.sold_tracker || [];
  const recs = reconBotResult?.strategic_recommendations || [];
  const [expandedAlerts, setExpandedAlerts] = useState<Set<number>>(new Set());
  const [reScanLoading, setReScanLoading] = useState(false);
  const [reconOpenSections, setReconOpenSections] = useState<Set<string>>(
    new Set(["recon-competitors", "recon-alerts", "megabot-results"])
  );
  const toggleReconSection = (id: string) => {
    setReconOpenSections(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  async function handleReScan() {
    setReScanLoading(true);
    await onReconBotRun();
    setReScanLoading(false);
  }

  function toggleAlert(i: number) {
    setExpandedAlerts((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  }

  return (
    <GlassCard>
      <PanelHeader icon="🔍" title="ReconBot" hasData={hasData} badge={hasData ? (scan?.market_heat || "SCAN") : "INTEL"} collapsed={collapsed} onToggle={onToggle}
        preview={hasData ? `${competitors.length} competitors · ${scan?.price_position || "—"} · Market ${scan?.market_heat || "—"}` : "Not scanned yet"}
      />
      {collapsed && hasData && <CollapsedSummary botType="recon" data={{ competitorCount: competitors.length, alertCount: alerts.length, marketHeat: scan?.market_heat, pricePosition: scan?.price_position, avgPrice: pi?.average_competitor_price || pi?.avg_price || null, recommendation: recs?.[0]?.title || recs?.[0]?.recommendation || null }} megaData={boosted ? boostResult : undefined} buttons={<>
        {onReconBotRun && <button onClick={onReconBotRun} style={{ padding: "0.3rem 0.65rem", fontSize: "0.62rem", fontWeight: 600, borderRadius: "0.4rem", border: "1px solid var(--border-default)", background: "var(--ghost-bg)", color: "var(--text-secondary)", cursor: "pointer", minHeight: "32px" }}>🔍 Re-Scan · 0.5 cr</button>}
        {onSuperBoost && <button onClick={onSuperBoost} style={{ padding: "0.3rem 0.65rem", fontSize: "0.62rem", fontWeight: 600, borderRadius: "0.4rem", border: "none", background: "linear-gradient(135deg, #00bcd4, #009688)", color: "#fff", cursor: "pointer", minHeight: "32px" }}>{boosted ? "🔄 MegaBot Re-Run · 3 cr" : "⚡ MegaBot · 5 cr"}</button>}
        <a href={`/bots/reconbot?item=${itemId}`} style={{ padding: "0.3rem 0.65rem", fontSize: "0.62rem", fontWeight: 600, borderRadius: "0.4rem", border: "1px solid rgba(0,188,212,0.3)", color: "#00bcd4", textDecoration: "none", display: "inline-flex", alignItems: "center", minHeight: "32px" }}>Open ReconBot →</a>
      </>} />}
      {collapsed && !hasData && (
        <div style={{ padding: "0.65rem 0.85rem", display: "flex", alignItems: "center", gap: "0.65rem" }}>
          <span style={{ fontSize: "1.3rem" }}>🔍</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-primary)" }}>ReconBot</div>
            <div style={{ fontSize: "0.62rem", color: "var(--text-muted)", lineHeight: 1.4 }}>Competitive intelligence and price position tracking</div>
          </div>
          <div style={{ display: "flex", gap: "0.3rem", flexShrink: 0 }}>
            {onReconBotRun && <button onClick={onReconBotRun} style={{ padding: "0.3rem 0.65rem", fontSize: "0.62rem", fontWeight: 600, borderRadius: "0.4rem", border: "1px solid var(--border-default)", background: "var(--ghost-bg)", color: "var(--text-secondary)", cursor: "pointer", minHeight: "32px" }}>🔍 ReconBot · 1 cr</button>}
            <a href={`/bots/reconbot?item=${itemId}`} style={{ padding: "0.3rem 0.65rem", fontSize: "0.62rem", fontWeight: 600, borderRadius: "0.4rem", border: "1px solid rgba(0,188,212,0.3)", color: "#00bcd4", textDecoration: "none", display: "inline-flex", alignItems: "center", minHeight: "32px" }}>Open ReconBot →</a>
          </div>
        </div>
      )}
      <div style={{ display: collapsed ? "none" : "flex", flexDirection: "column" as const, flex: 1 }}>
        {!hasData && !reconBotLoading ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", flex: 1, justifyContent: "center", padding: "1.25rem", gap: "0.5rem" }}>
            <span style={{ fontSize: "1.5rem" }}>🔍</span>
            <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--text-primary)" }}>ReconBot</div>
            <p style={{ fontSize: "0.68rem", color: "var(--text-secondary)", lineHeight: 1.5, maxWidth: 300, margin: 0 }}>Competitive intelligence scanning across 5+ marketplaces.</p>
            <div style={{ width: "100%", maxWidth: 300, padding: "0.5rem 0.65rem", background: "var(--ghost-bg)", borderRadius: "0.5rem", border: "1px solid var(--border-default)", textAlign: "left" }}>
              <div style={{ fontSize: "0.55rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.25rem" }}>What You&apos;ll Get</div>
              {[{ icon: "🔍", text: "Competitor listing scan" }, { icon: "💰", text: "Price position tracking" }, { icon: "🚨", text: "Market alert monitoring" }].map((b, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.3rem", padding: "0.15rem 0", fontSize: "0.62rem", color: "var(--text-secondary)" }}><span style={{ fontSize: "0.6rem", flexShrink: 0 }}>{b.icon}</span><span>{b.text}</span></div>
              ))}
            </div>
            <div style={{ display: "flex", gap: "0.4rem", justifyContent: "center", flexWrap: "wrap", marginTop: "0.5rem", paddingTop: "0.4rem", borderTop: "1px solid var(--border-default)", width: "100%" }}>
              {onReconBotRun && <button onClick={onReconBotRun} disabled={!aiData} style={{ padding: "0.3rem 0.65rem", fontSize: "0.62rem", fontWeight: 600, borderRadius: "0.4rem", border: "1px solid var(--border-default)", background: "var(--ghost-bg)", color: "var(--text-secondary)", cursor: aiData ? "pointer" : "not-allowed", minHeight: "32px" }}>🔍 ReconBot · 1 cr</button>}
              <a href={`/bots/reconbot?item=${itemId}`} style={{ padding: "0.3rem 0.65rem", fontSize: "0.62rem", fontWeight: 600, borderRadius: "0.4rem", border: "1px solid rgba(0,188,212,0.3)", color: "#00bcd4", textDecoration: "none", display: "inline-flex", alignItems: "center", minHeight: "32px" }}>Open ReconBot →</a>
            </div>
          </div>
        ) : reconBotLoading ? (
          <BotLoadingState botName="ReconBot" />
        ) : (
          <div style={{ padding: "0.75rem 1rem" }}>
            {/* Overview stats */}
            {scan && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.4rem", marginBottom: "0.75rem" }}>
                <div style={{ textAlign: "center", padding: "0.5rem", borderRadius: "0.4rem", background: "var(--bg-card)" }}>
                  <div style={{ fontSize: "1rem", fontWeight: 800, color: "#00bcd4" }}>{scan.total_competitors_found}</div>
                  <div style={{ fontSize: "0.55rem", color: "var(--text-muted)" }}>Competitors</div>
                </div>
                <div style={{ textAlign: "center", padding: "0.5rem", borderRadius: "0.4rem", background: "var(--bg-card)" }}>
                  <div style={{ fontSize: "1rem", fontWeight: 800, color: scan.market_heat === "Hot" ? "#ef4444" : scan.market_heat === "Warm" ? "#f59e0b" : "#00bcd4" }}>
                    {scan.market_heat === "Hot" ? "🔥" : scan.market_heat === "Warm" ? "🌤️" : "❄️"} {scan.market_heat}
                  </div>
                  <div style={{ fontSize: "0.55rem", color: "var(--text-muted)" }}>Market Heat</div>
                </div>
                <div style={{ textAlign: "center", padding: "0.5rem", borderRadius: "0.4rem", background: "var(--bg-card)" }}>
                  <div style={{
                    fontSize: "0.78rem", fontWeight: 700,
                    color: scan.price_position === "Well-Priced" ? "#4ade80" : scan.price_position === "Overpriced" ? "#ef4444" : scan.price_position === "Underpriced" ? "#f59e0b" : "var(--text-muted)",
                  }}>
                    {scan.price_position}
                  </div>
                  <div style={{ fontSize: "0.55rem", color: "var(--text-muted)" }}>Price Position</div>
                </div>
              </div>
            )}

            {/* Inline re-scan button */}
            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "0.5rem" }}>
              <button
                onClick={handleReScan}
                disabled={reScanLoading}
                style={{
                  padding: "0.25rem 0.7rem", borderRadius: "0.4rem", fontSize: "0.68rem", fontWeight: 600,
                  background: "transparent", border: "1px solid var(--accent, #00bcd4)",
                  color: reScanLoading ? "var(--text-muted)" : "var(--accent, #00bcd4)",
                  cursor: reScanLoading ? "not-allowed" : "pointer", opacity: reScanLoading ? 0.6 : 1,
                  transition: "opacity 0.2s",
                }}
              >
                {reScanLoading ? "⏳ Scanning..." : "🔄 Re-Scan · 1 cr"}
              </button>
            </div>

            <AccordionHeader id="recon-alerts" icon="🚨" title="ALERTS" subtitle={`${alerts.length} active`} isOpen={reconOpenSections.has("recon-alerts")} onToggle={toggleReconSection} />
            {reconOpenSections.has("recon-alerts") && (<div style={{ padding: "0.35rem 0" }}>
            {/* Alerts — clickable expandable */}
            {alerts.length > 0 && (
              <div style={{ marginBottom: "0.75rem" }}>
                <div style={{ fontSize: "0.6rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.3rem" }}>
                  🚨 Alerts ({alerts.length})
                </div>
                {alerts.map((a: any, i: number) => {
                  const isHigh = a.severity === "HIGH" || a.severity === "URGENT";
                  const isMed = a.severity === "MEDIUM";
                  const sevColor = isHigh ? "#ef4444" : isMed ? "#f59e0b" : "#4ade80";
                  const sevBg = isHigh ? "rgba(239,68,68,0.06)" : isMed ? "rgba(245,158,11,0.06)" : "rgba(74,222,128,0.06)";
                  const isOpen = expandedAlerts.has(i);
                  return (
                    <div key={i} style={{
                      marginBottom: "0.3rem", borderRadius: "0.4rem", overflow: "hidden",
                      background: sevBg, borderLeft: `3px solid ${sevColor}`,
                      cursor: "pointer", transition: "background 0.15s",
                    }} onClick={() => toggleAlert(i)}>
                      <div style={{
                        display: "flex", justifyContent: "space-between", alignItems: "center",
                        padding: "0.4rem 0.5rem",
                      }}>
                        <span style={{ fontSize: "0.72rem", fontWeight: 600, color: "var(--text-primary)", flex: 1 }}>{a.title}</span>
                        <span style={{ fontSize: "0.55rem", fontWeight: 700, color: sevColor, textTransform: "uppercase", marginLeft: "0.5rem", flexShrink: 0 }}>{a.severity}</span>
                        <span style={{ marginLeft: "0.4rem", fontSize: "0.65rem", color: "var(--text-muted)", transition: "transform 0.2s", transform: isOpen ? "rotate(180deg)" : "rotate(0)" }}>▾</span>
                      </div>
                      {isOpen && (
                        <div style={{ padding: "0 0.5rem 0.5rem", borderTop: `1px solid ${sevColor}22` }}>
                          {a.detail && <div style={{ fontSize: "0.68rem", color: "var(--text-secondary)", lineHeight: 1.5, marginTop: "0.35rem" }}>{a.detail}</div>}
                          {a.description && !a.detail && <div style={{ fontSize: "0.68rem", color: "var(--text-secondary)", lineHeight: 1.5, marginTop: "0.35rem" }}>{a.description}</div>}
                          {a.recommended_action && (
                            <div style={{ fontSize: "0.68rem", marginTop: "0.35rem", padding: "0.3rem 0.5rem", borderRadius: "0.3rem", background: "rgba(0,188,212,0.06)" }}>
                              <span style={{ fontWeight: 700, color: "var(--accent)" }}>Action: </span>
                              <span style={{ color: "var(--text-secondary)" }}>{a.recommended_action}</span>
                            </div>
                          )}
                          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "0.3rem" }}>
                            <span onClick={(e) => { e.stopPropagation(); setExpandedAlerts((prev) => { const next = new Set(prev); next.delete(i); return next; }); }}
                              style={{ fontSize: "0.6rem", color: "var(--text-muted)", cursor: "pointer", textDecoration: "underline" }}>
                              Dismiss
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
            </div>)}

            <AccordionHeader id="recon-position" icon="📊" title="MARKET POSITION" isOpen={reconOpenSections.has("recon-position")} onToggle={toggleReconSection} />
            {reconOpenSections.has("recon-position") && (<div style={{ padding: "0.35rem 0" }}>
            {/* Price intelligence snippet */}
            {pi && (
              <div style={{ display: "flex", gap: "1rem", fontSize: "0.72rem", marginBottom: "0.75rem", flexWrap: "wrap" }}>
                <div><span style={{ color: "var(--text-muted)" }}>Avg: </span><span style={{ fontWeight: 700, color: "var(--text-primary)" }}>${pi.market_average}</span></div>
                <div><span style={{ color: "var(--text-muted)" }}>Optimal: </span><span style={{ fontWeight: 700, color: "#4ade80" }}>${pi.optimal_price}</span></div>
                <div><span style={{ color: "var(--text-muted)" }}>Trend: </span><span style={{ fontWeight: 700, color: pi.price_trend === "Rising" ? "#4ade80" : pi.price_trend === "Falling" ? "#ef4444" : "#f59e0b" }}>{pi.price_trend} ({pi.price_trend_pct})</span></div>
              </div>
            )}

            {/* Top recommendation */}
            {recs.length > 0 && (
              <div style={{
                fontSize: "0.72rem", color: "var(--text-secondary)", lineHeight: 1.5,
                padding: "0.5rem 0.65rem", borderRadius: "0.4rem",
                background: "rgba(0,188,212,0.04)", borderLeft: "3px solid var(--accent)",
                marginBottom: "0.75rem",
              }}>
                <span style={{ fontWeight: 700, color: "var(--accent)" }}>Top move: </span>{recs[0].action}
              </div>
            )}
            </div>)}

            <AccordionHeader id="recon-competitors" icon="🔍" title="COMPETITORS" subtitle={`${competitors.length} found`} isOpen={reconOpenSections.has("recon-competitors")} onToggle={toggleReconSection} accentColor="#f59e0b" />
            {reconOpenSections.has("recon-competitors") && (<div style={{ padding: "0.35rem 0" }}>
            {/* Top 3 competitors */}
            {competitors.length > 0 && (
              <div style={{ marginBottom: "0.5rem" }}>
                <div style={{ fontSize: "0.6rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.3rem" }}>
                  Top Competitors
                </div>
                {competitors.slice(0, 3).map((c: any, i: number) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.7rem", marginBottom: "0.2rem", padding: "0.25rem 0" }}>
                    <span style={{ color: "var(--text-secondary)" }}>{c.platform} · {c.condition}</span>
                    <span style={{ fontWeight: 700, color: c.status === "Sold" ? "#4ade80" : "var(--text-primary)" }}>${c.status === "Sold" ? c.sold_price : c.price}</span>
                  </div>
                ))}
              </div>
            )}
            </div>)}
          </div>
        )}

        {/* MegaBot boost results — full 4-agent breakdown */}
        {boosted && boostResult && (<>
          <AccordionHeader id="megabot-results" icon="⚡" title="MEGABOT MULTI-AI ANALYSIS" subtitle={`${boostResult.agreementScore ?? "?"}% Agreement`} isOpen={reconOpenSections.has("megabot-results")} onToggle={toggleReconSection} accentColor="#8b5cf6" badge={`${(boostResult.providers || []).filter((p: any) => p.data || !p.error).length} AI`} />
          {reconOpenSections.has("megabot-results") && <MegaBotBoostResults botType="recon" result={boostResult} aiData={aiData} />}
        </>)}

        <PanelFooter
          botName="ReconBot"
          botLink={`/bots/reconbot?item=${itemId}`}
          itemId={itemId}
          botIcon="🔍"
          botCost={1}
          onBotRun={!!aiData ? onReconBotRun : undefined}
          onSuperBoost={onSuperBoost}
          boosting={boosting}
          boosted={boosted}
          hasResult={!!reconBotResult}
                 />
      </div>
    </GlassCard>
  );
}

/* ═══════════════════════════════════════════
   MAIN EXPORT
   ═══════════════════════════════════════════ */

export default function ItemDashboardPanels({
  itemId, aiData, valuation, antique, comps, photos, status, category, saleZip, megabotUsed, userTier, listingPrice, authenticityScore, collectiblesScore, shippingData, controlCenterExtra, projectId, demandScore, botDisagreement,
}: Props) {
  // Track which bots have been enhanced with MegaBot
  const [boostedBots, setBoostedBots] = useState<Set<string>>(new Set());
  const [boostingBot, setBoostingBot] = useState<string | null>(null);
  const [boostResults, setBoostResults] = useState<Record<string, any>>({});
  const [boostError, setBoostError] = useState<string | null>(null);

  // Bot gate error state (402/403 from API)
  const [botGateError, setBotGateError] = useState<Record<string, { type: string; message: string; balance?: number; required?: number } | null>>({});
  const setBotError = (bot: string, err: { type: string; message: string; balance?: number; required?: number } | null) =>
    setBotGateError((prev) => ({ ...prev, [bot]: err }));
  const bypassGates = isDemoMode();

  // Panel collapse state — smart defaults, localStorage persistence
  const DEFAULT_COLLAPSED: Record<string, boolean> = {
    control: false, analysis: false, pricing: false,
    shipping: true, photos: true, buyers: true, listing: true,
    recon: true, carbot: true, antique: true, collectibles: true, megabot: true,
  };
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>(DEFAULT_COLLAPSED);
  const [panelsHydrated, setPanelsHydrated] = useState(false);
  const togglePanel = (id: string) => setCollapsed((prev) => ({ ...prev, [id]: !prev[id] }));

  // Restore saved panel layout from localStorage AFTER hydration (client-only)
  useEffect(() => {
    try {
      const saved = localStorage.getItem(`ll-panels-${itemId}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === "object") setCollapsed(parsed);
      }
    } catch { /* use defaults */ }
    setPanelsHydrated(true);
  }, [itemId]);

  // Persist panel layout to localStorage (skip initial render to avoid saving defaults over saved state)
  useEffect(() => {
    if (panelsHydrated) {
      localStorage.setItem(`ll-panels-${itemId}`, JSON.stringify(collapsed));
    }
  }, [collapsed, itemId, panelsHydrated]);

  // PriceBot state
  const [priceBotResult, setPriceBotResult] = useState<any>(null);
  const [priceBotLoading, setPriceBotLoading] = useState(false);

  // BuyerBot state
  const [buyerBotResult, setBuyerBotResult] = useState<any>(null);
  const [buyerBotLoading, setBuyerBotLoading] = useState(false);

  // ReconBot state
  const [reconBotResult, setReconBotResult] = useState<any>(null);
  const [reconBotLoading, setReconBotLoading] = useState(false);

  // ListBot state
  const [listBotResult, setListBotResult] = useState<any>(null);
  const [listBotLoading, setListBotLoading] = useState(false);
  const [listBotError, setListBotError] = useState<string | null>(null);

  // AntiqueBot state
  const [antiqueBotResult, setAntiqueBotResult] = useState<any>(null);
  const [antiqueBotLoading, setAntiqueBotLoading] = useState(false);
  const [antiqueBotError, setAntiqueBotError] = useState<string | null>(null);

  // CarBot state
  const [carBotResult, setCarBotResult] = useState<any>(null);
  const [carBotLoading, setCarBotLoading] = useState(false);

  // CollectiblesBot state
  const [collectiblesBotResult, setCollectiblesBotResult] = useState<any>(null);
  const [collectiblesBotLoading, setCollectiblesBotLoading] = useState(false);

  // Enrichment status
  const [enrichmentStatus, setEnrichmentStatus] = useState<{
    priorRunCount: number;
    confidenceLevel: "none" | "low" | "medium" | "high";
    hasEnrichment: boolean;
  } | null>(null);

  // Fetch existing PriceBot + BuyerBot + ReconBot + ListBot results on mount
  useEffect(() => {
    fetch(`/api/enrichment/status/${itemId}`)
      .then((r) => r.json())
      .then((data) => setEnrichmentStatus(data))
      .catch(() => {});
    fetch(`/api/bots/pricebot/${itemId}`).then((r) => r.json()).then((d) => {
      if (d.hasResult) setPriceBotResult(d.result);
    }).catch(() => {});
    fetch(`/api/bots/buyerbot/${itemId}`).then((r) => r.json()).then((d) => {
      if (d.hasResult) setBuyerBotResult(d.result);
    }).catch(() => {});
    fetch(`/api/bots/reconbot/${itemId}`).then((r) => r.json()).then((d) => {
      if (d.hasResult) setReconBotResult(d.result);
    }).catch(() => {});
    fetch(`/api/bots/listbot/${itemId}`).then((r) => r.json()).then((d) => {
      if (d.hasResult) setListBotResult(d.result);
    }).catch(() => {});
    fetch(`/api/bots/antiquebot/${itemId}`).then((r) => r.json()).then((d) => {
      if (d.hasResult) setAntiqueBotResult(d.result);
    }).catch(() => {});
    fetch(`/api/bots/carbot/${itemId}`).then((r) => r.json()).then((d) => {
      if (d.hasResult) setCarBotResult(d.result);
    }).catch(() => {});
    fetch(`/api/bots/collectiblesbot/${itemId}`).then((r) => r.json()).then((d) => {
      if (d.hasResult && d.result) setCollectiblesBotResult(d.result);
    }).catch(() => {});

    // Fetch stored MegaBot results — pre-populate boosted state
    fetch(`/api/megabot/${itemId}`).then((r) => r.json()).then((d) => {
      if (d.results && Object.keys(d.results).length > 0) {
        const newBoosted = new Set<string>();
        const newResults: Record<string, any> = {};
        for (const [key, data] of Object.entries(d.results)) {
          const panelKey = BOT_TO_PANEL[key] || key;
          const rd = data as any;
          // Normalize: ensure providers have proper format
          if (rd?.providers && Array.isArray(rd.providers)) {
            rd.providers = rd.providers.map((p: any) => ({
              ...p,
              error: p.error ?? null,
              data: p.data ?? p.result ?? null,
            }));
          }
          newBoosted.add(panelKey);
          newResults[panelKey] = rd;
        }
        setBoostedBots(newBoosted);
        setBoostResults(newResults);
      }
    }).catch(() => {});
  }, [itemId]);

  async function runPriceBot() {
    setPriceBotLoading(true);
    try {
      setBotError("pricing", null);
      const res = await fetch(`/api/bots/pricebot/${itemId}`, { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setPriceBotResult(data.result);
        setCollapsed(prev => ({ ...prev, pricing: false }));
      } else if (res.status === 402 || res.status === 403) {
        const err = await res.json().catch(() => ({ error: "error", message: "Something went wrong." }));
        setBotError("pricing", { type: err.error, message: err.message, balance: err.balance, required: err.required });
      }
    } catch { /* ignore */ }
    setPriceBotLoading(false);
  }

  async function runBuyerBot() {
    setBuyerBotLoading(true);
    try {
      setBotError("buyers", null);
      const res = await fetch(`/api/bots/buyerbot/${itemId}`, { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setBuyerBotResult(data.result);
        setCollapsed(prev => ({ ...prev, buyers: false }));
      } else {
        const err = await res.json().catch(() => ({ error: "error", message: "BuyerBot failed. Please try again." }));
        setBotError("buyers", { type: err.error || "error", message: err.message || `BuyerBot failed (${res.status})` });
      }
    } catch (e: any) {
      setBotError("buyers", { type: "error", message: e?.message || "Network error — check connection and retry." });
    }
    setBuyerBotLoading(false);
  }

  async function runReconBot() {
    setReconBotLoading(true);
    try {
      setBotError("recon", null);
      const res = await fetch(`/api/bots/reconbot/${itemId}`, { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setReconBotResult(data.result);
        setCollapsed(prev => ({ ...prev, recon: false }));
      } else if (res.status === 402 || res.status === 403) {
        const err = await res.json().catch(() => ({ error: "error", message: "Something went wrong." }));
        setBotError("recon", { type: err.error, message: err.message, balance: err.balance, required: err.required });
      }
    } catch { /* ignore */ }
    setReconBotLoading(false);
  }

  async function runListBot() {
    setListBotLoading(true);
    setListBotError(null);
    setBotError("listing", null);
    try {
      const res = await fetch(`/api/bots/listbot/${itemId}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) });
      if (res.ok) {
        const data = await res.json();
        if (data.result) {
          setListBotResult(data.result);
          setCollapsed(prev => ({ ...prev, listing: false }));
        } else {
          setListBotError("ListBot returned no data. Try again.");
        }
      } else if (res.status === 402 || res.status === 403) {
        const err = await res.json().catch(() => ({ error: "error", message: "Something went wrong." }));
        setBotError("listing", { type: err.error, message: err.message, balance: err.balance, required: err.required });
      } else {
        const errData = await res.json().catch(() => null);
        setListBotError(errData?.error || `ListBot failed (${res.status}). Try again.`);
      }
    } catch (err: any) {
      setListBotError(err?.message || "Network error — check your connection and try again.");
    }
    setListBotLoading(false);
  }

  async function runAntiqueBot() {
    setAntiqueBotLoading(true);
    setAntiqueBotError(null);
    setBotError("antique", null);
    try {
      const res = await fetch(`/api/bots/antiquebot/${itemId}`, { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        if (data.result) {
          setAntiqueBotResult(data.result);
          setCollapsed(prev => ({ ...prev, antique: false }));
        } else {
          setAntiqueBotError("AntiqueBot returned no data. Try again.");
        }
      } else if (res.status === 402 || res.status === 403) {
        const err = await res.json().catch(() => ({ error: "error", message: "Something went wrong." }));
        setBotError("antique", { type: err.error, message: err.message, balance: err.balance, required: err.required });
      } else {
        const errData = await res.json().catch(() => null);
        setAntiqueBotError(errData?.error || `AntiqueBot failed (${res.status}). Try again.`);
      }
    } catch (err: any) {
      setAntiqueBotError(err?.message || "Network error — check your connection and try again.");
    }
    setAntiqueBotLoading(false);
  }

  async function runCarBot() {
    setCarBotLoading(true);
    setBotError("carbot", null);
    try {
      const res = await fetch(`/api/bots/carbot/${itemId}`, { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setCarBotResult(data.result);
        setCollapsed(prev => ({ ...prev, carbot: false }));
      } else if (res.status === 402 || res.status === 403) {
        const err = await res.json().catch(() => ({ error: "error", message: "Something went wrong." }));
        setBotError("carbot", { type: err.error, message: err.message, balance: err.balance, required: err.required });
      }
    } catch { /* ignore */ }
    setCarBotLoading(false);
  }

  async function runCollectiblesBot() {
    if (collectiblesBotLoading) return;
    setCollectiblesBotLoading(true);
    setBotError("collectibles", null);
    try {
      const res = await fetch(`/api/bots/collectiblesbot/${itemId}`, { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        if (data.result) { setCollectiblesBotResult(data.result); setCollapsed(prev => ({ ...prev, collectibles: false })); }
      } else if (res.status === 402 || res.status === 403) {
        const err = await res.json().catch(() => ({ error: "error", message: "Something went wrong." }));
        setBotError("collectibles", { type: err.error, message: err.message, balance: err.balance, required: err.required });
      }
    } catch (e) { console.error("[collectiblesbot]", e); }
    setCollectiblesBotLoading(false);
  }

  // Map internal panel names to API bot query params
  const MEGABOT_PARAM: Record<string, string> = {
    analysis: "analyzebot",
    pricing: "pricebot",
    shipping: "photobot",  // shipping uses photobot for now (no dedicated shipping megabot)
    photos: "photobot",
    buyers: "buyerbot",
    listing: "listbot",
    recon: "reconbot",
    carbot: "carbot",
    antique: "antiquebot",
    collectibles: "collectiblesbot",
    video: "videobot",
  };

  // Map EventLog bot keys back to panel keys (same as mount-time fetch)
  const BOT_TO_PANEL: Record<string, string> = {
    analyzebot: "analysis", analysis: "analysis",
    pricebot: "pricing", pricing: "pricing",
    photobot: "photos", photos: "photos",
    buyerbot: "buyers", buyers: "buyers",
    listbot: "listing", listing: "listing",
    reconbot: "recon", recon: "recon",
    carbot: "carbot",
    antiquebot: "antique", antique: "antique",
    collectiblesbot: "collectibles", collectibles: "collectibles",
    videobot: "video", video: "video",
  };

  async function superBoost(botType: string) {
    // Clear old data immediately so UI shows loading state (not stale results)
    setBoostResults((prev) => { const next = { ...prev }; delete next[botType]; return next; });
    setBoostingBot(botType);
    setBoostError(null);
    try {
      const botParam = MEGABOT_PARAM[botType] || "analyzebot";
      console.log(`[MegaBot] Launching ${botType} → API param: ${botParam}, itemId: ${itemId}`);
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 180_000); // 3-minute client timeout
      const res = await fetch(`/api/megabot/${itemId}?bot=${botParam}`, { method: "POST", signal: controller.signal });
      clearTimeout(timeout);
      if (res.ok) {
        const data = await res.json();
        if (data && (data.providers || data.consensus)) {
          console.log(`[MegaBot] ${botType} SUCCESS — providers: ${data.providers?.length ?? 0}, agreement: ${data.agreementScore ?? data.agreement ?? "?"}%`, data);
          // Set the POST response immediately for fast UI update
          setBoostResults((prev) => ({ ...prev, [botType]: data }));
          setBoostedBots((prev) => new Set(prev).add(botType));

          // Re-fetch from GET to reconcile with stored EventLog (catches any POST/GET format differences)
          try {
            const refreshRes = await fetch(`/api/megabot/${itemId}`);
            if (refreshRes.ok) {
              const refreshData = await refreshRes.json();
              console.log('[megabot-refresh] Fresh data received:', Object.keys(refreshData?.results ?? {}));
              if (refreshData?.results) {
                setBoostedBots((prev) => {
                  const next = new Set(prev);
                  for (const key of Object.keys(refreshData.results)) {
                    next.add(BOT_TO_PANEL[key] || key);
                  }
                  return next;
                });
                setBoostResults((prev) => {
                  const next = { ...prev };
                  for (const [key, rdata] of Object.entries(refreshData.results)) {
                    const rd = rdata as any;
                    // Normalize providers — same as mount-time fetch
                    if (rd?.providers && Array.isArray(rd.providers)) {
                      rd.providers = rd.providers.map((p: any) => ({
                        ...p,
                        error: p.error ?? null,
                        data: p.data ?? p.result ?? null,
                      }));
                    }
                    next[BOT_TO_PANEL[key] || key] = rd;
                  }
                  return next;
                });
              }
            }
          } catch {
            // Non-fatal — POST result is already set above
          }
        } else {
          console.log(`[MegaBot] ${botType} NO RESULTS — response data:`, data);
          setBoostError(`MegaBot returned no results for ${botType}. Try again.`);
          console.warn(`[MegaBot] ${botType}: API returned OK but no providers/consensus`, data);
        }
      } else {
        const errData = await res.json().catch(() => null);
        console.log(`[MegaBot] ${botType} HTTP ERROR ${res.status}`, errData);
        setBoostError(errData?.error || `MegaBot failed (${res.status}). Try again.`);
        console.warn(`[MegaBot] ${botType}: API returned ${res.status}`);
      }
    } catch (err: any) {
      if (err?.name === "AbortError") {
        setBoostError(`MegaBot timed out after 3 minutes. The AI agents may be overloaded — try again.`);
        console.warn(`[MegaBot] ${botType}: timed out after 3 minutes`);
      } else {
        setBoostError(err?.message || "Network error — check your connection and try again.");
        console.warn(`[MegaBot] ${botType}: fetch error`, err);
      }
    }
    setBoostingBot(null);
  }

  const hasAnalysis = !!aiData;
  const isVehicle = VEHICLE_KEYWORDS.some((kw) => (category || "").toLowerCase().includes(kw)) || !!aiData?.vehicle_year || !!aiData?.vehicle_make || !!aiData?.vehicle_model;
  const isAntique = antique?.isAntique === true || (aiData?.is_antique === true);

  // Antique alert banner — detect from AI analysis fields
  const estimatedAge = Number(aiData?.estimated_age_years ?? aiData?.estimated_age ?? 0);
  const decadeStr = String(aiData?.decade ?? aiData?.era ?? "");
  const decadeAge = (() => {
    const m = decadeStr.match(/(\d{4})/);
    if (m) return new Date().getFullYear() - Number(m[1]);
    return 0;
  })();
  const showAntiqueBanner = hasAnalysis && (
    isAntique ||
    aiData?.antique_alert === true ||
    estimatedAge >= 70 ||
    decadeAge >= 70
  );
  const antiqueBannerAge = estimatedAge >= 70 ? `~${estimatedAge} Years Old` : decadeAge >= 70 ? `~${decadeStr}` : null;
  const [antiqueBannerDismissed, setAntiqueBannerDismissed] = useState(false);

  // Collectible alert banner — detect from AI analysis fields
  const collectibleDetection = hasAnalysis && aiData ? detectCollectible(aiData) : null;
  const showCollectibleBanner = hasAnalysis && (collectibleDetection?.isCollectible === true);
  const [collectibleBannerDismissed, setCollectibleBannerDismissed] = useState(false);

  return (
    <>
      <style>{`
        .bot-dashboard-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1rem;
        }
        @media (max-width: 768px) {
          .bot-dashboard-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      {/* ── ITEM CONTROL CENTER (full width, above panel grid) ── */}
      <div style={{ marginBottom: "1rem" }}>
        <ItemControlCenter itemId={itemId} status={status} valuation={valuation} aiData={aiData} listingPrice={listingPrice} collapsed={collapsed.control} onToggle={() => togglePanel("control")} photos={photos} category={category} extra={controlCenterExtra} shippingData={shippingData} projectId={projectId} />
      </div>

      {/* ── ACTIVE OFFERS (below Sale Assignment) ── */}
      <div id="active-offers-widget" style={{ marginBottom: "1rem" }}>
        <ActiveOffersWidget itemId={itemId} />
      </div>

      {/* ── ANTIQUE ALERT BANNER (above panel grid) ── */}
      {showAntiqueBanner && !antiqueBannerDismissed && (
        <div style={{
          background: "linear-gradient(135deg, rgba(245,158,11,0.07) 0%, rgba(180,83,9,0.05) 100%)",
          border: "1px solid rgba(245,158,11,0.25)",
          borderLeft: "3px solid rgba(245,158,11,0.7)",
          borderRadius: "12px",
          padding: "1rem 1.25rem",
          marginBottom: "1.5rem",
          position: "relative",
          display: "flex",
          alignItems: "center",
          gap: "1rem",
          flexWrap: "wrap",
        }}>
          {/* Left — icon + text + score */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flex: 1, minWidth: 0 }}>
            <span style={{ fontSize: "1.25rem", flexShrink: 0 }}>🏛️</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.2rem", flexWrap: "wrap" }}>
                <span style={{ color: authenticityScore?.tierColor || "#f59e0b", fontWeight: 700, fontSize: "0.82rem", letterSpacing: "0.04em" }}>
                  ANTIQUE DETECTED
                </span>
                {antiqueBannerAge && (
                  <span style={{
                    background: "rgba(245,158,11,0.12)",
                    border: "1px solid rgba(245,158,11,0.25)",
                    borderRadius: "20px",
                    padding: "0.1rem 0.55rem",
                    color: "#f59e0b",
                    fontSize: "0.7rem",
                    fontWeight: 700,
                  }}>
                    {antiqueBannerAge}
                  </span>
                )}
                {authenticityScore && (
                  <span style={{
                    background: `${authenticityScore.tierColor}18`,
                    border: `1px solid ${authenticityScore.tierBorderColor}`,
                    borderRadius: "20px",
                    padding: "0.1rem 0.55rem",
                    color: authenticityScore.tierColor,
                    fontSize: "0.7rem",
                    fontWeight: 700,
                  }}>
                    {authenticityScore.tierLabel} · {authenticityScore.score}/100
                  </span>
                )}
              </div>
              {/* Score progress bar */}
              {authenticityScore && (
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.2rem" }}>
                  <div style={{
                    flex: 1,
                    height: "4px",
                    borderRadius: "2px",
                    background: "var(--ghost-bg)",
                    overflow: "hidden",
                    maxWidth: "180px",
                  }}>
                    <div style={{
                      width: `${authenticityScore.score}%`,
                      height: "100%",
                      borderRadius: "2px",
                      background: `linear-gradient(90deg, ${authenticityScore.tierColor}, ${authenticityScore.tierColor}cc)`,
                      transition: "width 0.5s ease",
                    }} />
                  </div>
                  {authenticityScore.nextTierLabel && (
                    <span style={{ fontSize: "0.62rem", color: "var(--text-muted)", whiteSpace: "nowrap" }}>
                      Next: {authenticityScore.nextTierLabel}
                    </span>
                  )}
                </div>
              )}
              {!authenticityScore && (
                <span style={{ color: "var(--text-secondary)", fontSize: "0.78rem" }}>
                  May be worth significantly more with authentication
                </span>
              )}
            </div>
          </div>

          {/* Right — action buttons */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexShrink: 0 }}>
            {!antiqueBotResult ? (
              <>
                <button
                  onClick={runAntiqueBot}
                  disabled={antiqueBotLoading}
                  style={{
                    background: "rgba(245,158,11,0.1)",
                    border: "1px solid rgba(245,158,11,0.3)",
                    borderRadius: "8px",
                    padding: "0.4rem 0.9rem",
                    color: "#f59e0b",
                    fontWeight: 700,
                    fontSize: "0.78rem",
                    cursor: antiqueBotLoading ? "default" : "pointer",
                    whiteSpace: "nowrap" as const,
                    opacity: antiqueBotLoading ? 0.6 : 1,
                  }}
                >
                  {antiqueBotLoading ? "Running…" : "🏛️ AntiqueBot · 1 cr"}
                </button>
                <button
                  onClick={
                    isAntique
                      ? () => superBoost("antique")
                      : () => alert(
                          "This item has not been flagged as an antique."
                        )
                  }
                  disabled={boostingBot === "antique" || !isAntique}
                  style={{
                    background: "linear-gradient(135deg, rgba(245,158,11,0.18), rgba(180,83,9,0.12))",
                    border: "1px solid rgba(245,158,11,0.35)",
                    borderRadius: "8px",
                    padding: "0.4rem 0.9rem",
                    color: "#f59e0b",
                    fontWeight: 700,
                    fontSize: "0.78rem",
                    cursor: (boostingBot === "antique" || !isAntique) ? "default" : "pointer",
                    whiteSpace: "nowrap" as const,
                    opacity: (boostingBot === "antique" || !isAntique) ? 0.6 : 1,
                  }}
                >
                  {boostingBot === "antique" ? "⚡ Re-running..." : boostedBots.has("antique") ? "🔄 MegaBot Re-Run · 3 cr" : "⚡ MegaBot · 5 cr"}
                </button>
              </>
            ) : (
              <span style={{
                background: "rgba(16,185,129,0.08)",
                border: "1px solid rgba(16,185,129,0.2)",
                borderRadius: "20px",
                padding: "0.25rem 0.75rem",
                color: "#10b981",
                fontSize: "0.75rem",
                fontWeight: 600,
              }}>
                ✓ Analysis Complete
              </span>
            )}
            <button
              onClick={() => {
                const el = document.getElementById("panel-antique");
                if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
              style={{
                background: "transparent",
                border: "none",
                color: "rgba(245,158,11,0.6)",
                fontSize: "0.75rem",
                fontWeight: 600,
                cursor: "pointer",
                textDecoration: "underline",
                textUnderlineOffset: "3px",
                whiteSpace: "nowrap" as const,
              }}
            >
              View →
            </button>
            <button
              onClick={() => setAntiqueBannerDismissed(true)}
              style={{
                background: "transparent",
                border: "none",
                color: "rgba(245,158,11,0.3)",
                fontSize: "0.9rem",
                cursor: "pointer",
                padding: "0.2rem",
                lineHeight: 1,
              }}
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* ── COLLECTIBLE ALERT BANNER (above panel grid) ── */}
      {showCollectibleBanner && !collectibleBannerDismissed && (
        <div style={{
          background: "linear-gradient(135deg, rgba(139,92,246,0.07) 0%, rgba(109,40,217,0.05) 100%)",
          border: "1px solid rgba(139,92,246,0.25)",
          borderLeft: "3px solid rgba(139,92,246,0.7)",
          borderRadius: "12px",
          padding: "1rem 1.25rem",
          marginBottom: "1.5rem",
          position: "relative",
          display: "flex",
          alignItems: "center",
          gap: "1rem",
          flexWrap: "wrap",
        }}>
          {/* Left — icon + text + score */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flex: 1, minWidth: 0 }}>
            <span style={{ fontSize: "1.25rem", flexShrink: 0 }}>🎴</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.2rem", flexWrap: "wrap" }}>
                <span style={{ color: collectiblesScore?.tierColor || "#8b5cf6", fontWeight: 700, fontSize: "0.82rem", letterSpacing: "0.04em" }}>
                  COLLECTIBLE DETECTED
                </span>
                {collectibleDetection?.category && (
                  <span style={{
                    background: "rgba(139,92,246,0.12)",
                    border: "1px solid rgba(139,92,246,0.25)",
                    borderRadius: "20px",
                    padding: "0.1rem 0.55rem",
                    color: "#8b5cf6",
                    fontSize: "0.7rem",
                    fontWeight: 700,
                  }}>
                    {collectibleDetection.category}
                  </span>
                )}
                {collectiblesScore && (
                  <span style={{
                    background: `${collectiblesScore.tierColor}18`,
                    border: `1px solid ${collectiblesScore.tierBorderColor}`,
                    borderRadius: "20px",
                    padding: "0.1rem 0.55rem",
                    color: collectiblesScore.tierColor,
                    fontSize: "0.7rem",
                    fontWeight: 700,
                  }}>
                    {collectiblesScore.tierLabel} · {collectiblesScore.score}/100
                  </span>
                )}
              </div>
              {/* Score progress bar */}
              {collectiblesScore && (
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.2rem" }}>
                  <div style={{
                    flex: 1,
                    height: "4px",
                    borderRadius: "2px",
                    background: "var(--ghost-bg)",
                    overflow: "hidden",
                    maxWidth: "180px",
                  }}>
                    <div style={{
                      width: `${collectiblesScore.score}%`,
                      height: "100%",
                      borderRadius: "2px",
                      background: `linear-gradient(90deg, ${collectiblesScore.tierColor}, ${collectiblesScore.tierColor}cc)`,
                      transition: "width 0.5s ease",
                    }} />
                  </div>
                  {collectiblesScore.nextTierLabel && (
                    <span style={{ fontSize: "0.62rem", color: "var(--text-muted)", whiteSpace: "nowrap" }}>
                      Next: {collectiblesScore.nextTierLabel}
                    </span>
                  )}
                </div>
              )}
              {!collectiblesScore && (
                <span style={{ color: "var(--text-secondary)", fontSize: "0.78rem" }}>
                  May be worth more with grading and authentication
                </span>
              )}
            </div>
          </div>

          {/* Right — action buttons */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexShrink: 0 }}>
            {!collectiblesBotResult ? (
              <>
                <button
                  onClick={runCollectiblesBot}
                  disabled={collectiblesBotLoading}
                  style={{
                    background: "rgba(139,92,246,0.1)",
                    border: "1px solid rgba(139,92,246,0.3)",
                    borderRadius: "8px",
                    padding: "0.4rem 0.9rem",
                    color: "#8b5cf6",
                    fontWeight: 700,
                    fontSize: "0.78rem",
                    cursor: collectiblesBotLoading ? "default" : "pointer",
                    whiteSpace: "nowrap" as const,
                    opacity: collectiblesBotLoading ? 0.6 : 1,
                  }}
                >
                  {collectiblesBotLoading ? "Running…" : "🎴 CollectiblesBot · 1 cr"}
                </button>
                <button
                  onClick={
                    collectibleDetection?.isCollectible
                      ? () => superBoost("collectibles")
                      : () => alert(
                          "This item has not been flagged as a collectible."
                        )
                  }
                  disabled={boostingBot === "collectibles" || !collectibleDetection?.isCollectible}
                  style={{
                    background: "linear-gradient(135deg, rgba(139,92,246,0.18), rgba(109,40,217,0.12))",
                    border: "1px solid rgba(139,92,246,0.35)",
                    borderRadius: "8px",
                    padding: "0.4rem 0.9rem",
                    color: "#8b5cf6",
                    fontWeight: 700,
                    fontSize: "0.78rem",
                    cursor: (boostingBot === "collectibles" || !collectibleDetection?.isCollectible) ? "default" : "pointer",
                    whiteSpace: "nowrap" as const,
                    opacity: (boostingBot === "collectibles" || !collectibleDetection?.isCollectible) ? 0.6 : 1,
                  }}
                >
                  {boostingBot === "collectibles" ? "⚡ Re-running..." : boostedBots.has("collectibles") ? "🔄 MegaBot Re-Run · 3 cr" : "⚡ MegaBot · 5 cr"}
                </button>
              </>
            ) : (
              <span style={{
                background: "rgba(139,92,246,0.08)",
                border: "1px solid rgba(139,92,246,0.2)",
                borderRadius: "20px",
                padding: "0.25rem 0.75rem",
                color: "#8b5cf6",
                fontSize: "0.75rem",
                fontWeight: 600,
              }}>
                ✓ Analysis Complete
              </span>
            )}
            <button
              onClick={() => {
                const el = document.getElementById("panel-collectibles");
                if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
              style={{
                background: "transparent",
                border: "none",
                color: "rgba(139,92,246,0.6)",
                fontSize: "0.75rem",
                fontWeight: 600,
                cursor: "pointer",
                textDecoration: "underline",
                textUnderlineOffset: "3px",
                whiteSpace: "nowrap" as const,
              }}
            >
              View →
            </button>
            <button
              onClick={() => setCollectibleBannerDismissed(true)}
              style={{
                background: "transparent",
                border: "none",
                color: "rgba(139,92,246,0.3)",
                fontSize: "0.9rem",
                cursor: "pointer",
                padding: "0.2rem",
                lineHeight: 1,
              }}
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* ── ITEM INTELLIGENCE SUMMARY (right after Control Center) ── */}
      <div style={{ marginBottom: "1rem" }}>
        <ItemIntelligenceSummary
          itemId={itemId}
          status={status}
          aiData={aiData}
          valuation={valuation}
          antique={antique}
          enriched={null}
          engagement={{
            totalViews: controlCenterExtra?.totalViews ?? 0,
            inquiries: controlCenterExtra?.inquiries ?? 0,
            buyersFound: controlCenterExtra?.buyersFound ?? 0,
            documentCount: controlCenterExtra?.documentCount ?? 0,
          }}
          shippingData={{
            weight: shippingData?.weight ?? null,
            isFragile: shippingData?.isFragile ?? false,
            preference: shippingData?.preference ?? "BUYER_PAYS",
            aiShippingDifficulty: shippingData?.aiShippingDifficulty ?? null,
          }}
          saleMethod="BOTH"
          listingPrice={listingPrice ?? null}
          hasPhotos={(photos?.length ?? 0) > 0}
          photoCount={photos?.length ?? 0}
          isAntique={!!antique?.isAntique}
          isCollectible={false}
          authenticityScore={authenticityScore?.score ?? null}
        />
      </div>

      {/* ── ENRICHMENT STATUS BADGE ── */}
      {enrichmentStatus?.hasEnrichment && (
        <div style={{ marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <EnrichmentBadge
            priorRunCount={enrichmentStatus.priorRunCount}
            confidenceLevel={enrichmentStatus.confidenceLevel}
          />
          <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
            Cross-bot intelligence active — each bot builds on prior findings
          </span>
        </div>
      )}

      <div className="bot-dashboard-grid">
        {/* ── FREE TIER: Auto-populate from analysis ── */}

        {/* Row 1: AI Analysis (full width for DRAFT, normal after) */}
        <AiAnalysisPanel
          aiData={aiData} itemId={itemId} status={status}
          onSuperBoost={() => superBoost("analysis")}
          boosting={boostingBot === "analysis"}
          boosted={boostedBots.has("analysis")}
          boostResult={boostResults.analysis}
          collapsed={collapsed.analysis}
          onToggle={() => togglePanel("analysis")}
          demandScore={demandScore}
          botDisagreement={botDisagreement}
        />

        {/* Pricing */}
        <PricingPanel
          valuation={valuation} antique={antique} aiData={aiData} userTier={userTier} itemId={itemId}
          onSuperBoost={() => superBoost("pricing")}
          onPriceBotRun={runPriceBot}
          boosting={boostingBot === "pricing"}
          boosted={boostedBots.has("pricing")}
          boostResult={boostResults.pricing}
          priceBotResult={priceBotResult}
          priceBotLoading={priceBotLoading}
          collapsed={collapsed.pricing}
          onToggle={() => togglePanel("pricing")}
          quotedShippingRate={shippingData?.quotedShippingRate ?? null}
          quotedShippingAt={shippingData?.quotedShippingAt ?? null}
          shippingPreference={shippingData?.preference ?? "BUYER_PAYS"}
          sellerListingPrice={listingPrice ?? null}
        />

        {/* Shipping */}
        <div id="shipping-panel">
        <ShippingEstimatesPanel
          itemId={itemId} aiData={aiData} saleZip={saleZip} valuation={valuation} status={status} category={category}
          onSuperBoost={() => superBoost("shipping")}
          boosting={boostingBot === "shipping"}
          boosted={boostedBots.has("shipping")}
          boostResult={boostResults.shipping}
          collapsed={collapsed.shipping}
          onToggle={() => togglePanel("shipping")}
          shippingData={shippingData}
        />
        </div>

        {/* Photo Quality */}
        <PhotoQualityPanel
          photos={photos} aiData={aiData} itemId={itemId}
          onSuperBoost={() => superBoost("photos")}
          boosting={boostingBot === "photos"}
          boosted={boostedBots.has("photos")}
          boostResult={boostResults.photos}
          collapsed={collapsed.photos}
          onToggle={() => togglePanel("photos")}
        />

        {/* ── PAID TIER: Requires credits to launch ── */}

        {/* Buyer Finder */}
        <BuyerFinderPanel
          aiData={aiData} itemId={itemId}
          onSuperBoost={() => superBoost("buyers")}
          onBuyerBotRun={runBuyerBot}
          boosting={boostingBot === "buyers"}
          boosted={boostedBots.has("buyers")}
          boostResult={boostResults.buyers}
          buyerBotResult={buyerBotResult}
          buyerBotLoading={buyerBotLoading}
          collapsed={collapsed.buyers}
          onToggle={() => togglePanel("buyers")}
        />

        {/* Listing Creator */}
        <ListingCreatorPanel
          aiData={aiData} itemId={itemId}
          onSuperBoost={() => superBoost("listing")}
          onListBotRun={runListBot}
          boosting={boostingBot === "listing"}
          boosted={boostedBots.has("listing")}
          boostResult={boostResults.listing}
          boostError={boostingBot === null && boostError ? boostError : null}
          listBotResult={listBotResult}
          listBotLoading={listBotLoading}
          listBotError={listBotError}
          collapsed={collapsed.listing}
          onToggle={() => togglePanel("listing")}
        />

        {/* ReconBot — Competitive Intelligence */}
        {!bypassGates && !canUseBotOnTier(userTier, "reconBot") ? (
          <LockedBotPanel botIcon="🔍" botName="ReconBot" requiredPlanName={TIER_NAMES[3]} />
        ) : (
        <ReconBotPanel
          aiData={aiData} itemId={itemId}
          onSuperBoost={() => superBoost("recon")}
          onReconBotRun={runReconBot}
          boosting={boostingBot === "recon"}
          boosted={boostedBots.has("recon")}
          boostResult={boostResults.recon}
          reconBotResult={reconBotResult}
          reconBotLoading={reconBotLoading}
          collapsed={collapsed.recon}
          onToggle={() => togglePanel("recon")}
        />
        )}

        {/* ── CARBOT ── */}
        {!bypassGates && !canUseBotOnTier(userTier, "carBot") ? (
          <LockedBotPanel botIcon="🚗" botName="CarBot" requiredPlanName={TIER_NAMES[4]} />
        ) : (
        <CarBotPanel
          aiData={aiData} itemId={itemId} category={category}
          isVehicle={isVehicle}
          onSuperBoost={() => superBoost("carbot")}
          onCarBotRun={runCarBot}
          boosting={boostingBot === "carbot"}
          boosted={boostedBots.has("carbot")}
          boostResult={boostResults.carbot}
          carBotResult={carBotResult}
          carBotLoading={carBotLoading}
          collapsed={collapsed.carbot}
          onToggle={() => togglePanel("carbot")}
        />
        )}

        {/* AntiqueBot */}
        {!bypassGates && !canUseBotOnTier(userTier, "antiqueBot") ? (
          <LockedBotPanel botIcon="🏺" botName="AntiqueBot" requiredPlanName={TIER_NAMES[3]} />
        ) : (
        <div id="panel-antique">
          <AntiqueEvalPanel
            aiData={aiData} antique={antique} itemId={itemId}
            onSuperBoost={() => superBoost("antique")}
            onAntiqueBotRun={runAntiqueBot}
            boosting={boostingBot === "antique"}
            boosted={boostedBots.has("antique")}
            boostResult={boostResults.antique}
            antiqueBotResult={antiqueBotResult}
            antiqueBotLoading={antiqueBotLoading}
            antiqueBotError={antiqueBotError}
            collapsed={collapsed.antique}
            onToggle={() => togglePanel("antique")}
            authenticityScore={authenticityScore}
          />
        </div>
        )}

        {/* CollectiblesBot */}
        {!bypassGates && !canUseBotOnTier(userTier, "collectiblesBot") ? (
          <LockedBotPanel botIcon="🎴" botName="CollectiblesBot" requiredPlanName={TIER_NAMES[3]} />
        ) : (
        <CollectiblesBotPanel
          aiData={aiData} itemId={itemId}
          onSuperBoost={() => superBoost("collectibles")}
          onCollectiblesBotRun={runCollectiblesBot}
          boosting={boostingBot === "collectibles"}
          boosted={boostedBots.has("collectibles")}
          boostResult={boostResults.collectibles}
          collectiblesBotResult={collectiblesBotResult}
          collectiblesBotLoading={collectiblesBotLoading}
          collapsed={collapsed.collectibles}
          onToggle={() => togglePanel("collectibles")}
        />
        )}

        {/* ── DOCUMENT VAULT (full width) ── */}
        <div style={{ gridColumn: "1 / -1" }}>
          <DocumentVault itemId={itemId} />
        </div>

        {/* ── MEGABOT POWER CENTER (full width) ── */}
        <MegaBotPowerCenter itemId={itemId} boostedBots={boostedBots} boostResults={boostResults} aiData={aiData} onBoostAll={async () => {
          const remaining = ["analysis","pricing","shipping","photos","buyers","listing","recon","carbot","antique","collectibles"].filter((k) => !boostedBots.has(k));
          for (const k of remaining) {
            await superBoost(k);
          }
        }} collapsed={collapsed.megabot} onToggle={() => togglePanel("megabot")} boostingBot={boostingBot} />
      </div>

      {/* ── MODULE SUMMARY (collapsible, kept at bottom) ── */}
      <div style={{ marginTop: "1rem" }}>
        <CollapsiblePanel
          title="Module Summary"
          subtitle="All specialist bots and their status"
          icon="🤖"
          preview={`${[aiData, valuation].filter(Boolean).length + (antique?.isAntique ? 1 : 0)} active`}
          defaultOpen={false}
        >
          <BotSummaryContent
            aiData={aiData} valuation={valuation} antique={antique}
            photos={photos} megabotUsed={megabotUsed} itemId={itemId} category={category}
          />
        </CollapsiblePanel>
      </div>
    </>
  );
}
