"use client";
import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { canAccessIntelTab } from "@/lib/constants/pricing";
import JuryVerdictSheet from "./JuryVerdictSheet";

/* ═══════════════════════════════════════════════════════════════════════
   Types
   ═══════════════════════════════════════════════════════════════════════ */

interface EnrichedData {
  priceDirection: "rising" | "falling" | "stable" | "unknown";
  demandLevel: string | null;
  totalOffers: number;
  highestOffer: number | null;
  offerToAskRatio: number | null;
  soldPrice: number | null;
  dataCompleteness: number;
  bestPlatform: string | null;
  targetBuyerProfiles: string[];
  valueDrivers: string[];
  topSearchKeywords: string[];
  avgCompPrice: number | null;
  highComp: number | null;
  lowComp: number | null;
  aiConfidence: number | null;
  compCount: number;
  hasAcceptedOffer: boolean;
}

interface AIIntelligence {
  summary: string;
  pricingIntel: {
    recommendedLow: number;
    recommendedHigh: number;
    sweetSpot: number;
    confidence: string;
    reasoning: string;
    quickSalePrice: number;
    premiumPrice: number;
    sources: string[];
  };
  conditionAssessment: string;
  marketPosition: {
    demand: string;
    trend: string;
    competition: string;
    insight: string;
  };
  sellingStrategy: {
    bestApproach: string;
    bestPlatform: string;
    reasoning: string;
    alternativePlatforms: string[];
    timing: string;
  };
  keyInsights: string[];
  nextSteps: { step: string; reason: string; priority: string }[];
  alerts: { type: string; message: string }[];
}

interface Props {
  itemId: string;
  status: string;
  aiData: any;
  valuation: any;
  enriched: EnrichedData | null;
  engagement: { totalViews: number; inquiries: number; buyersFound: number; documentCount: number };
  shippingData: { weight: number | null; isFragile: boolean; preference: string; aiShippingDifficulty: string | null };
  saleMethod: string | null;
  listingPrice: number | null;
  hasPhotos: boolean;
  photoCount: number;
  isAntique: boolean;
  isCollectible: boolean;
  authenticityScore: number | null;
  userTier?: number;
  pricingConsensus?: import("@/lib/pricing/reconcile").PricingConsensus | null;
  v9Data?: import("@/lib/pricing/garage-sale").GarageSaleV9Prices | null;
  collapsed?: boolean;
  onToggle?: () => void;
}

type Tab = "market" | "ready" | "sell" | "alerts" | "action";

/* ═══════════════════════════════════════════════════════════════════════
   Score Ring
   ═══════════════════════════════════════════════════════════════════════ */

function CountUp({ value, format }: { value: number; format?: (n: number) => string }) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const [display, setDisplay] = useState(format ? format(0) : "0");
  const fired = useRef(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduced = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduced) { setDisplay(format ? format(value) : String(value)); return; }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting || fired.current) return;
        fired.current = true;
        const start = performance.now();
        const tick = (now: number) => {
          const t = Math.min(1, (now - start) / 2200);
          const eased = 1 - Math.pow(1 - t, 4);
          setDisplay(format ? format(value * eased) : String(Math.round(value * eased)));
          if (t < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
        io.disconnect();
      });
    }, { threshold: 0.5 });
    io.observe(el);
    return () => io.disconnect();
  }, [value, format]);
  return <span ref={ref}>{display}</span>;
}

function ScoreRing({ score, color }: { score: number; color: string }) {
  const r = 18;
  const circ = 2 * Math.PI * r;
  const filled = (score / 100) * circ;
  return (
    <div style={{ position: "relative", width: "46px", height: "46px", flexShrink: 0 }}>
      <svg width="46" height="46" viewBox="0 0 46 46" style={{ transform: "rotate(-90deg)" }}>
        <circle cx="23" cy="23" r={r} stroke="rgba(148,163,184,0.1)" strokeWidth="3" fill="none" />
        <circle cx="23" cy="23" r={r} stroke={color} strokeWidth="3" fill="none"
          strokeDasharray={`${filled} ${circ}`} strokeLinecap="round"
          style={{ transition: "stroke-dasharray 1.2s cubic-bezier(0.4, 0, 0.2, 1)", filter: `drop-shadow(0 0 4px ${color}50)` }}
        />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontSize: "13px", fontWeight: 800, color, lineHeight: 1, fontVariantNumeric: "tabular-nums", textShadow: `0 0 8px ${color}30` }}>{score}</span>
        <span style={{ fontSize: "6.5px", fontWeight: 600, color: "var(--text-muted)", opacity: 0.5, lineHeight: 1 }}>/100</span>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   Helpers
   ═══════════════════════════════════════════════════════════════════════ */

function timeAgo(iso: string): string {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 60) return mins <= 1 ? "just now" : `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return days === 1 ? "1 day ago" : `${days}d ago`;
}

/* ═══════════════════════════════════════════════════════════════════════
   Main Component
   ═══════════════════════════════════════════════════════════════════════ */

// CMD-PRICING-FRESHNESS-STAMP: trust-signal age formatter
function formatAge(iso: string | undefined | null): string | null {
  if (!iso) return null;
  const then = new Date(iso).getTime();
  if (!Number.isFinite(then)) return null;
  const diffMs = Math.max(0, Date.now() - then);
  const s = Math.floor(diffMs / 1000);
  if (s < 30) return "just now";
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  const w = Math.floor(d / 7);
  if (w < 5) return `${w}w ago`;
  return "over a month ago";
}

function ageStaleness(iso: string | undefined | null): "fresh" | "aging" | "stale" {
  if (!iso) return "fresh";
  const diffMs = Math.max(0, Date.now() - new Date(iso).getTime());
  const h = diffMs / 3_600_000;
  if (h > 24 * 7) return "stale";
  if (h > 24) return "aging";
  return "fresh";
}

export default function ItemIntelligenceSummary(props: Props) {
  const {
    itemId, status, aiData, valuation, enriched, engagement,
    shippingData, saleMethod, listingPrice, hasPhotos, photoCount,
    isAntique, isCollectible, authenticityScore,
    userTier = 1, pricingConsensus = null, v9Data = null, collapsed = false, onToggle,
  } = props;

  // CMD-JURY-VERDICT-SURFACE: modal state + single-fire chip-render telemetry
  const [juryModalOpen, setJuryModalOpen] = useState(false);
  const juryChipFiredRef = useRef(false);
  useEffect(() => {
    if (juryChipFiredRef.current) return;
    if (
      pricingConsensus?.juryVerdict &&
      pricingConsensus?.consensusResolvedBy === "jury"
    ) {
      juryChipFiredRef.current = true;
      fetch("/api/user-event", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventType: "JURY_CHIP_RENDERED",
          itemId,
          metadata: JSON.stringify({
            listPrice: pricingConsensus.juryVerdict.listPrice,
            confidence: pricingConsensus.juryVerdict.confidence,
          }),
        }),
      }).catch(() => {});
    }
  }, [pricingConsensus, itemId]);

  // CMD-PRICING-FRESHNESS-STAMP: tick every 30s so "Updated Xm ago" stays
  // accurate without a page reload.
  const [ageTick, setAgeTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setAgeTick((t) => t + 1), 30_000);
    return () => clearInterval(id);
  }, []);
  const consensusAgeString = useMemo(
    () => formatAge(pricingConsensus?.computedAt),
    [pricingConsensus?.computedAt, ageTick]
  );
  const consensusAgeStale = useMemo(
    () => ageStaleness(pricingConsensus?.computedAt),
    [pricingConsensus?.computedAt, ageTick]
  );

  // ── AI Intelligence state ──
  const [aiIntel, setAiIntel] = useState<AIIntelligence | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiStale, setAiStale] = useState(false);
  const [aiCachedAt, setAiCachedAt] = useState<string | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  // CMD-PRICING-INTELLIGENCE-V3: single-fire TRUST_SCORE_VIEW telemetry
  const trustScoreFired = useRef(false);
  useEffect(() => {
    if (trustScoreFired.current) return;
    if (pricingConsensus?.trustScore == null) return;
    trustScoreFired.current = true;
    fetch("/api/user-event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        eventType: "TRUST_SCORE_VIEW",
        itemId,
        metadata: JSON.stringify({
          trustScore: pricingConsensus.trustScore,
          trustTier: pricingConsensus.trustTier,
          categoryProfile: pricingConsensus.categoryProfile,
          sourceCount: pricingConsensus.sourceCount,
        }),
      }),
    }).catch(() => {});
  }, [itemId, pricingConsensus]);

  // ── Chat state ──
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [chatMessages, setChatMessages] = useState<{ question: string; answer: string; timestamp: string }[]>([]);
  const [chatLoaded, setChatLoaded] = useState(false);

  // Fetch cached intelligence on mount (NO auto-generate — user must click)
  useEffect(() => {
    let cancelled = false;
    async function fetchCached() {
      try {
        const res = await fetch(`/api/intelligence/${itemId}`);
        const d = await res.json();
        if (!cancelled && d.success && d.result) {
          setAiIntel(d.result);
          setAiCachedAt(d.cachedAt);
          setAiStale(d.isStale ?? false);
        }
      } catch { /* non-critical */ }
    }
    if (aiData) fetchCached();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemId]);

  const generateIntel = useCallback(async () => {
    setAiLoading(true);
    setAiError(null);
    try {
      const res = await fetch(`/api/intelligence/${itemId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingPrice, saleMethod }),
      });
      const d = await res.json();
      if (d.success && d.result) {
        setAiIntel(d.result);
        setAiCachedAt(d.cachedAt);
        setAiStale(false);
      } else {
        setAiError(d.error || "Generation failed");
      }
    } catch (e: any) {
      setAiError(e.message || "Network error");
    }
    setAiLoading(false);
  }, [itemId, listingPrice, saleMethod]);

  // ── Load chat history when chat opens ──
  useEffect(() => {
    if (!chatOpen || chatLoaded) return;
    let cancelled = false;
    async function loadChat() {
      try {
        const res = await fetch(`/api/intelligence/${itemId}/chat`);
        const d = await res.json();
        if (!cancelled && d.messages) {
          setChatMessages(d.messages);
          setChatLoaded(true);
        }
      } catch { /* non-critical */ }
    }
    loadChat();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatOpen, itemId]);

  const sendChat = useCallback(async () => {
    const q = chatInput.trim();
    if (!q || chatLoading) return;
    setChatLoading(true);
    setChatInput("");
    // Optimistic: show question immediately
    const optimistic = { question: q, answer: "...", timestamp: new Date().toISOString() };
    setChatMessages((prev) => [...prev, optimistic]);
    try {
      const res = await fetch(`/api/intelligence/${itemId}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q }),
      });
      const d = await res.json();
      if (d.answer) {
        setChatMessages((prev) =>
          prev.map((m, i) => (i === prev.length - 1 ? { ...m, answer: d.answer, timestamp: d.timestamp || m.timestamp } : m))
        );
      } else {
        setChatMessages((prev) =>
          prev.map((m, i) => (i === prev.length - 1 ? { ...m, answer: d.error || "Failed to get answer" } : m))
        );
      }
    } catch {
      setChatMessages((prev) =>
        prev.map((m, i) => (i === prev.length - 1 ? { ...m, answer: "Network error — try again" } : m))
      );
    }
    setChatLoading(false);
  }, [chatInput, chatLoading, itemId]);

  // ── Readiness checks ──
  const readinessChecks = [
    { ok: photoCount > 0, label: "Photos uploaded", fix: `/items/${itemId}/edit` },
    { ok: photoCount >= 3, label: "3+ photos for best results", fix: `/items/${itemId}/edit` },
    { ok: !!aiData, label: "AI analysis complete", fix: null },
    { ok: !!valuation, label: "Valuation generated", fix: null },
    { ok: !!listingPrice, label: "Listing price set", fix: null },
    { ok: shippingData.weight != null, label: "Shipping info complete", fix: `/items/${itemId}/edit` },
    { ok: !!saleMethod, label: "Sale method chosen", fix: null },
    { ok: (enriched?.dataCompleteness ?? 0) > 25, label: "Bot analysis run", fix: null },
    { ok: engagement.documentCount > 0, label: "Documents uploaded", fix: null },
    { ok: !!(aiData?.summary || aiData?.item_name), label: "Description exists", fix: null },
  ];
  const readinessScore = readinessChecks.filter(c => c.ok).length;
  const readinessColor = readinessScore >= 8 ? "#22c55e" : readinessScore >= 5 ? "#f59e0b" : "#ef4444";

  // ── Warnings (merge computed + AI alerts) ──
  const warnings: { type: "error" | "warning" | "success"; msg: string; pri: number }[] = [];
  if (!listingPrice && (status === "ANALYZED" || status === "READY"))
    warnings.push({ type: "error", msg: "Set a price before listing", pri: 0 });
  if (photoCount < 3)
    warnings.push({ type: "warning", msg: "Add more photos — listings with 4+ photos sell 2x faster", pri: 1 });
  if ((enriched?.priceDirection === "falling") || (aiIntel?.marketPosition?.trend === "declining"))
    warnings.push({ type: "warning", msg: "Market prices are falling — price competitively", pri: 2 });
  if (shippingData.isFragile)
    warnings.push({ type: "warning", msg: "Fragile item — needs careful packaging", pri: 3 });
  if (enriched?.demandLevel === "Strong" || enriched?.demandLevel === "High" || aiIntel?.marketPosition?.demand === "high")
    warnings.push({ type: "success", msg: "Strong demand detected — price confidently", pri: 4 });
  if (isAntique)
    warnings.push({ type: "success", msg: "Antique verified — consider auction or specialty platforms", pri: 5 });
  if (engagement.inquiries > 0)
    warnings.push({ type: "success", msg: `${engagement.inquiries} buyer inquiries — check your messages`, pri: 6 });
  if ((enriched?.totalOffers ?? 0) > 0)
    warnings.push({ type: "success", msg: `${enriched!.totalOffers} offer${enriched!.totalOffers !== 1 ? "s" : ""} received — highest $${Math.round(enriched!.highestOffer ?? 0)}`, pri: 7 });
  // Merge AI alerts
  if (aiIntel?.alerts) {
    aiIntel.alerts.forEach((a, i) => {
      const t = a.type === "warning" ? "warning" : a.type === "opportunity" ? "success" : "success";
      warnings.push({ type: t as any, msg: a.message, pri: 10 + i });
    });
  }
  warnings.sort((a, b) => {
    const tp: Record<string, number> = { error: 0, warning: 1, success: 2 };
    return (tp[a.type] - tp[b.type]) || (a.pri - b.pri);
  });
  // Deduplicate by message similarity
  const seen = new Set<string>();
  const uniqueWarnings = warnings.filter(w => {
    const key = w.msg.toLowerCase().slice(0, 30);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // ── Next action ──
  const getNextAction = () => {
    if (status === "DRAFT" && !hasPhotos) return { icon: "📸", msg: "Upload photos to get started", href: `/items/${itemId}/edit` };
    if (status === "DRAFT" && hasPhotos && !aiData) return { icon: "🧠", msg: "Run AI Analysis — free, takes about 60 seconds", href: null };
    if ((status === "ANALYZED" || status === "READY") && !listingPrice) {
      const sweetSpot = aiIntel?.pricingIntel?.sweetSpot;
      return { icon: "💰", msg: sweetSpot ? `Set your price — Claude recommends $${Math.round(sweetSpot)}` : `Set your listing price${valuation ? ` — AI suggests $${Math.round(valuation.low || 0)}–$${Math.round(valuation.high || 0)}` : ""}`, href: null };
    }
    if ((status === "ANALYZED" || status === "READY") && readinessScore < 7) return { icon: "📋", msg: `Complete your listing — ${10 - readinessScore} items still needed`, href: null };
    if ((status === "ANALYZED" || status === "READY") && readinessScore >= 7) return { icon: "📢", msg: "You're ready! Mark as Listed to go live", href: null };
    if (status === "LISTED" && engagement.totalViews === 0) return { icon: "📊", msg: "Boost visibility — run BuyerBot or share your listing", href: `/bots/buyerbot?item=${itemId}` };
    if (status === "LISTED" && engagement.inquiries > 0) return { icon: "💬", msg: "Check your messages — buyers are interested", href: "/messages" };
    if (status === "INTERESTED") return { icon: "🤝", msg: `Review your offers${enriched?.highestOffer ? ` — highest is $${Math.round(enriched.highestOffer)}` : ""}`, href: null };
    if (status === "SOLD") return { icon: "📦", msg: "Ship your item within 3 days for best rating", href: null };
    if (status === "SHIPPED") return { icon: "📬", msg: "Your item is on its way — mark complete when delivered", href: null };
    if (status === "COMPLETED") return { icon: "🎉", msg: `All done!${enriched?.soldPrice ? ` Your earnings: $${Math.round(enriched.soldPrice * 0.9825)}` : ""}`, href: "/dashboard" };
    return null;
  };
  const nextAction = getNextAction();

  // ── CMD-INTEL-HUD-CONSENSUS-WIRE: derived display values ──
  const displayPricing: { sweetSpot: number; recommendedLow: number; recommendedHigh: number; quickSalePrice: number; premiumPrice: number } | null = pricingConsensus
    ? {
        sweetSpot: pricingConsensus.consensusAcceptPrice,
        recommendedLow: pricingConsensus.consensusValueLow,
        recommendedHigh: pricingConsensus.consensusValueHigh,
        quickSalePrice: pricingConsensus.consensusFloorPrice,
        premiumPrice: pricingConsensus.consensusListPrice,
      }
    : aiIntel?.pricingIntel
    ? {
        sweetSpot: aiIntel.pricingIntel.sweetSpot,
        recommendedLow: aiIntel.pricingIntel.recommendedLow,
        recommendedHigh: aiIntel.pricingIntel.recommendedHigh,
        quickSalePrice: aiIntel.pricingIntel.quickSalePrice,
        premiumPrice: aiIntel.pricingIntel.premiumPrice,
      }
    : null;

  // ── Overall score ──
  const overallScore = Math.min(100, Math.round(
    (readinessScore * 6) +
    (enriched?.dataCompleteness ?? 0) * 0.2 +
    (engagement.totalViews > 0 ? 10 : 0) +
    ((enriched?.totalOffers ?? 0) > 0 ? 10 : 0)
  ));
  const scoreColor = overallScore >= 70 ? "#22c55e" : overallScore >= 40 ? "#f59e0b" : "#ef4444";

  // ── Tab state ──
  const defaultTab: Tab = uniqueWarnings.some(w => w.type === "error") ? "alerts" : "market";
  const [activeTab, setActiveTab] = useState<Tab>(defaultTab);

  const tabs: { key: Tab; icon: string; label: string }[] = [
    { key: "market", icon: "📊", label: "Market" },
    { key: "ready", icon: "✅", label: "Ready" },
    { key: "sell", icon: "🏪", label: "Sell" },
    { key: "alerts", icon: "⚠️", label: "Alerts" },
    { key: "action", icon: "🎯", label: "Action" },
  ];

  // ── Derived values ──
  const aiConf = enriched?.aiConfidence != null ? (enriched.aiConfidence > 1 ? Math.round(enriched.aiConfidence) : Math.round(enriched.aiConfidence * 100)) : null;
  const pricingConfColor = aiIntel?.pricingIntel?.confidence === "high" ? "#22c55e" : aiIntel?.pricingIntel?.confidence === "medium" ? "#f59e0b" : "#ef4444";

  return (
    <>
      <style>{`
        .intel-hud {
          border-radius: 12px; overflow: hidden;
          border: 1px solid rgba(0,188,212,0.15);
          background: var(--bg-card);
          box-shadow: 0 1px 8px rgba(0,188,212,0.06), 0 0 20px rgba(0,188,212,0.03);
          font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Inter', sans-serif;
          animation: intelFadeIn 0.5s ease-out both;
        }
        html.dark .intel-hud {
          background: linear-gradient(135deg, rgba(0,188,212,0.03) 0%, rgba(0,0,0,0.15) 100%);
          border-color: rgba(0,188,212,0.2);
          box-shadow: 0 1px 12px rgba(0,188,212,0.08), 0 0 30px rgba(0,188,212,0.04);
        }
        @keyframes intelFadeIn {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .intel-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 10px 16px; border-bottom: 1px solid var(--border-default);
        }
        .intel-header-left { display: flex; align-items: center; gap: 8px; }
        .intel-dot {
          width: 7px; height: 7px; border-radius: 50%; background: #00bcd4;
          box-shadow: 0 0 6px rgba(0,188,212,0.5);
          animation: intelPulse 3s ease-in-out infinite;
        }
        @keyframes intelPulse {
          0%, 100% { box-shadow: 0 0 4px rgba(0,188,212,0.4); }
          50% { box-shadow: 0 0 10px rgba(0,188,212,0.7); }
        }
        .intel-title {
          font-size: 10.5px; font-weight: 800; letter-spacing: 0.1em;
          text-transform: uppercase; color: var(--text-primary);
          text-shadow: 0 0 20px rgba(0,188,212,0.12);
        }
        .intel-claude {
          font-size: 7.5px; font-weight: 800; letter-spacing: 0.06em;
          padding: 2px 6px; border-radius: 4px;
          background: rgba(0,188,212,0.1); color: var(--accent, #00bcd4);
          border: 1px solid rgba(0,188,212,0.2); text-transform: uppercase;
        }
        .intel-tabs {
          display: flex; gap: 4px; padding: 6px 8px;
          border-bottom: 1px solid var(--border-default);
          background: rgba(0,0,0,0.015);
        }
        html.dark .intel-tabs { background: rgba(0,0,0,0.12); }
        .intel-tab {
          flex: 1; display: flex; flex-direction: column; align-items: center;
          justify-content: center; gap: 3px; padding: 7px 4px; min-height: 44px;
          background: linear-gradient(180deg, rgba(255,255,255,0.7) 0%, rgba(240,240,240,0.5) 100%);
          border: 1px solid rgba(148,163,184,0.18);
          border-radius: 8px; cursor: pointer;
          transition: all 0.15s ease;
          color: var(--text-muted);
          box-shadow: 0 1px 3px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.6);
          position: relative;
        }
        html.dark .intel-tab {
          background: linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%);
          border-color: rgba(148,163,184,0.12);
          box-shadow: 0 1px 3px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.05);
        }
        .intel-tab:hover {
          background: linear-gradient(180deg, rgba(0,188,212,0.08) 0%, rgba(0,188,212,0.03) 100%);
          border-color: rgba(0,188,212,0.2);
          transform: translateY(-1px);
          box-shadow: 0 2px 6px rgba(0,188,212,0.08), inset 0 1px 0 rgba(255,255,255,0.5);
        }
        html.dark .intel-tab:hover {
          background: linear-gradient(180deg, rgba(0,188,212,0.12) 0%, rgba(0,188,212,0.04) 100%);
          box-shadow: 0 2px 6px rgba(0,188,212,0.12), inset 0 1px 0 rgba(255,255,255,0.06);
        }
        .intel-tab.active {
          background: linear-gradient(180deg, rgba(0,188,212,0.12) 0%, rgba(0,188,212,0.04) 100%);
          border-color: rgba(0,188,212,0.3);
          color: var(--accent, #00bcd4);
          box-shadow: 0 1px 4px rgba(0,188,212,0.12), inset 0 1px 0 rgba(0,188,212,0.1), 0 0 8px rgba(0,188,212,0.06);
          transform: translateY(0);
        }
        html.dark .intel-tab.active {
          background: linear-gradient(180deg, rgba(0,188,212,0.18) 0%, rgba(0,188,212,0.06) 100%);
          border-color: rgba(0,188,212,0.35);
          box-shadow: 0 1px 4px rgba(0,188,212,0.15), inset 0 1px 0 rgba(0,188,212,0.12), 0 0 12px rgba(0,188,212,0.08);
        }
        .intel-tab.active::after {
          content: ""; position: absolute; bottom: -1px; left: 20%; right: 20%;
          height: 2px; border-radius: 2px;
          background: linear-gradient(90deg, transparent, var(--accent, #00bcd4), transparent);
        }
        .intel-tab-icon { font-size: 15px; line-height: 1; filter: drop-shadow(0 1px 1px rgba(0,0,0,0.06)); }
        .intel-tab-label { font-size: 8.5px; font-weight: 800; letter-spacing: 0.06em; text-transform: uppercase; line-height: 1; }
        .intel-content { padding: 14px 16px; min-height: 80px; }
        .intel-metrics { display: flex; gap: 8px; flex-wrap: wrap; }
        .intel-metric {
          display: flex; flex-direction: column; align-items: center; gap: 2px;
          padding: 8px 14px; border-radius: 8px;
          background: var(--ghost-bg, rgba(148,163,184,0.06));
          border: 1px solid var(--border-default); min-width: 70px;
        }
        .intel-metric-val {
          font-size: 14px; font-weight: 800; font-variant-numeric: tabular-nums;
          line-height: 1.1; letter-spacing: -0.02em;
        }
        .intel-metric-lbl {
          font-size: 7.5px; font-weight: 700; letter-spacing: 0.08em;
          text-transform: uppercase; color: var(--text-muted); opacity: 0.6; line-height: 1;
        }
        .intel-chips { display: flex; gap: 4px; flex-wrap: wrap; }
        .intel-chip {
          display: inline-flex; align-items: center; gap: 3px;
          padding: 2px 8px; border-radius: 20px; font-size: 9px;
          font-weight: 700; letter-spacing: 0.02em; border: 1px solid;
          white-space: nowrap; line-height: 1.4;
        }
        .intel-alert {
          display: flex; align-items: center; gap: 8px;
          padding: 8px 12px; border-radius: 8px; font-size: 11.5px;
          font-weight: 600; border: 1px solid; line-height: 1.3;
        }
        .intel-check { display: flex; align-items: center; gap: 8px; padding: 4px 0; font-size: 11.5px; }
        .intel-check-icon { font-size: 11px; width: 16px; text-align: center; flex-shrink: 0; }
        .intel-check-fix { margin-left: auto; font-size: 10px; color: var(--accent); text-decoration: none; font-weight: 600; }
        .intel-check-fix:hover { text-decoration: underline; }
        .intel-plat-card {
          display: flex; align-items: center; gap: 10px;
          padding: 10px 14px; border-radius: 8px;
          background: rgba(0,188,212,0.05); border: 1px solid rgba(0,188,212,0.15);
        }
        html.dark .intel-plat-card { background: rgba(0,188,212,0.08); border-color: rgba(0,188,212,0.2); }
        .intel-action { text-align: center; padding: 8px 0; }
        .intel-action-icon { font-size: 28px; margin-bottom: 6px; }
        .intel-action-msg { font-size: 13px; font-weight: 700; color: var(--text-primary); margin-bottom: 10px; line-height: 1.4; }
        .intel-cta {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 10px 20px; border-radius: 8px; font-size: 12px; font-weight: 700;
          text-decoration: none; min-height: 44px; color: #fff; border: none; cursor: pointer;
          transition: all 0.2s ease;
          background: linear-gradient(135deg, #00bcd4, #009688);
          box-shadow: 0 2px 12px rgba(0,188,212,0.25);
        }
        .intel-cta:hover { filter: brightness(1.1); transform: translateY(-1px); }
        .intel-cta:disabled { opacity: 0.5; cursor: default; transform: none; filter: none; }
        .intel-footer {
          display: flex; align-items: center; justify-content: center; gap: 8px;
          padding: 5px 16px; border-top: 1px solid var(--border-default);
          background: rgba(0,0,0,0.02);
        }
        html.dark .intel-footer { background: rgba(0,0,0,0.12); }
        .intel-footer-text { font-size: 8px; font-weight: 500; letter-spacing: 0.06em; color: var(--text-muted); opacity: 0.5; }
        .intel-footer-sep { width: 2px; height: 2px; border-radius: 50%; background: var(--text-muted); opacity: 0.3; }
        .intel-sect-lbl { font-size: 8px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: var(--text-muted); margin-bottom: 4px; }
        .intel-summary {
          font-size: 12px; line-height: 1.5; color: var(--text-secondary);
          padding: 10px 12px; border-radius: 8px; margin-bottom: 10px;
          background: rgba(0,188,212,0.03); border: 1px solid rgba(0,188,212,0.1);
          font-style: italic;
        }
        html.dark .intel-summary { background: rgba(0,188,212,0.06); border-color: rgba(0,188,212,0.15); }
        .intel-price-cards { display: flex; gap: 8px; flex-wrap: wrap; }
        .intel-price-card {
          flex: 1; min-width: 80px; display: flex; flex-direction: column; align-items: center;
          padding: 10px 8px; border-radius: 8px; border: 1px solid var(--border-default);
          background: var(--ghost-bg, rgba(148,163,184,0.06));
        }
        .intel-price-card.highlight {
          border-color: rgba(0,188,212,0.3);
          background: rgba(0,188,212,0.06);
          box-shadow: 0 0 10px rgba(0,188,212,0.08);
        }
        html.dark .intel-price-card.highlight {
          background: rgba(0,188,212,0.1); border-color: rgba(0,188,212,0.35);
          box-shadow: 0 0 15px rgba(0,188,212,0.1);
        }
        .intel-price-val { font-size: 18px; font-weight: 800; font-variant-numeric: tabular-nums; letter-spacing: -0.02em; line-height: 1; }
        .intel-price-lbl { font-size: 8px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: var(--text-muted); opacity: 0.6; margin-top: 3px; }
        .intel-stale-bar {
          display: flex; align-items: center; justify-content: space-between;
          padding: 6px 12px; background: rgba(245,158,11,0.06);
          border-bottom: 1px solid rgba(245,158,11,0.15);
          font-size: 10px; font-weight: 600; color: #f59e0b;
        }
        .intel-stale-btn {
          font-size: 9px; font-weight: 700; padding: 3px 8px; border-radius: 4px;
          background: rgba(245,158,11,0.12); color: #f59e0b;
          border: 1px solid rgba(245,158,11,0.25); cursor: pointer;
        }
        .intel-stale-btn:hover { background: rgba(245,158,11,0.2); }
        .intel-loading {
          display: flex; align-items: center; justify-content: center; gap: 8px;
          padding: 16px 0; font-size: 11px; color: var(--text-muted);
        }
        .intel-loading-dot {
          width: 6px; height: 6px; border-radius: 50%; background: var(--accent, #00bcd4);
          animation: intelLoadPulse 1.2s ease-in-out infinite;
        }
        .intel-loading-dot:nth-child(2) { animation-delay: 0.15s; }
        .intel-loading-dot:nth-child(3) { animation-delay: 0.3s; }
        @keyframes intelLoadPulse {
          0%, 100% { opacity: 0.3; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1.2); }
        }
        .intel-step {
          display: flex; gap: 10px; padding: 8px 0;
          border-bottom: 1px solid var(--border-default);
        }
        .intel-step:last-child { border-bottom: none; }
        .intel-step-pri {
          width: 6px; height: 6px; border-radius: 50%; margin-top: 5px; flex-shrink: 0;
        }
        .intel-collapsed {
          display: flex; flex-direction: column; align-items: center; gap: 6px;
          padding: 10px 16px; width: 100%;
        }
        .intel-collapsed-row {
          display: flex; gap: 8px; align-items: stretch; justify-content: center; flex-wrap: wrap;
        }
        .intel-collapsed-stat {
          padding: 4px 10px; border-radius: 8px;
          background: rgba(0,188,212,0.04); border: 1px solid rgba(0,188,212,0.1);
          text-align: center; min-width: 60px; flex: 1 1 auto; max-width: 110px;
        }
        .intel-collapsed-stat-lbl {
          font-size: 7px; font-weight: 700; text-transform: uppercase;
          letter-spacing: 0.05em; color: rgba(148,163,184,0.7); margin-bottom: 1px;
        }
        .intel-collapsed-stat-val {
          font-size: 11px; font-weight: 700; line-height: 1.2; word-break: break-word;
        }
        .intel-collapsed-insight {
          font-size: 9px; color: var(--text-muted); line-height: 1.4;
          text-align: center; max-width: 92%; overflow: hidden;
          text-overflow: ellipsis; display: -webkit-box;
          -webkit-line-clamp: 2; -webkit-box-orient: vertical;
        }
        .intel-toggle {
          background: none; border: none; cursor: pointer; padding: 2px;
          font-size: 12px; color: var(--text-muted); transition: transform 0.2s ease;
          display: flex; align-items: center; justify-content: center;
          width: 24px; height: 24px; border-radius: 4px;
        }
        .intel-toggle:hover { background: rgba(0,188,212,0.06); color: var(--accent, #00bcd4); }
        .intel-error {
          display: flex; align-items: center; gap: 8px;
          padding: 8px 12px; margin: 0 0 8px; border-radius: 8px;
          background: rgba(239,68,68,0.06); border: 1px solid rgba(239,68,68,0.15);
          font-size: 11px; font-weight: 600; color: #ef4444; line-height: 1.3;
        }
        .intel-error-retry {
          margin-left: auto; font-size: 9px; font-weight: 700;
          padding: 3px 8px; border-radius: 4px; cursor: pointer;
          background: rgba(239,68,68,0.1); color: #ef4444;
          border: 1px solid rgba(239,68,68,0.2);
        }
        .intel-error-retry:hover { background: rgba(239,68,68,0.18); }
        /* ═══ CHAT ═══ */
        .intel-chat-toggle {
          display: flex; align-items: center; justify-content: flex-start; gap: 6px;
          width: 100%; padding: 8px 16px; min-height: 44px;
          background: transparent; border: none; border-top: 1px solid var(--border-default);
          cursor: pointer; transition: all 0.15s ease;
          font-size: 10px; font-weight: 700; letter-spacing: 0.06em;
          text-transform: uppercase; color: var(--text-muted);
        }
        .intel-chat-toggle:hover { background: rgba(0,188,212,0.04); color: var(--accent, #00bcd4); }
        .intel-chat-toggle .chat-icon {
          width: 16px; height: 16px; border-radius: 50%;
          background: linear-gradient(135deg, rgba(0,188,212,0.15), rgba(0,188,212,0.05));
          border: 1px solid rgba(0,188,212,0.2);
          display: flex; align-items: center; justify-content: center;
          font-size: 9px; line-height: 1;
        }
        .intel-chat-area {
          border-top: 1px solid var(--border-default);
          animation: chatSlideIn 0.25s ease-out both;
        }
        @keyframes chatSlideIn {
          from { opacity: 0; max-height: 0; }
          to { opacity: 1; max-height: 400px; }
        }
        .intel-chat-history {
          max-height: 200px; overflow-y: auto; padding: 8px 14px;
          display: flex; flex-direction: column; gap: 8px;
          scrollbar-width: thin; scrollbar-color: rgba(0,188,212,0.2) transparent;
        }
        .intel-chat-history::-webkit-scrollbar { width: 3px; }
        .intel-chat-history::-webkit-scrollbar-thumb { background: rgba(0,188,212,0.2); border-radius: 3px; }
        .intel-chat-q {
          align-self: flex-end; max-width: 85%;
          padding: 6px 10px; border-radius: 10px 10px 2px 10px;
          background: linear-gradient(135deg, rgba(0,188,212,0.12), rgba(0,188,212,0.06));
          border: 1px solid rgba(0,188,212,0.18);
          font-size: 11px; font-weight: 600; color: var(--text-primary); line-height: 1.4;
        }
        .intel-chat-a {
          align-self: flex-start; max-width: 85%;
          padding: 6px 10px; border-radius: 10px 10px 10px 2px;
          background: var(--ghost-bg, rgba(148,163,184,0.06));
          border: 1px solid var(--border-default);
          font-size: 11px; color: var(--text-secondary); line-height: 1.45;
        }
        html.dark .intel-chat-a { background: rgba(255,255,255,0.04); }
        .intel-chat-input-row {
          display: flex; gap: 6px; padding: 8px 14px 10px;
          border-top: 1px solid var(--border-default);
          background: rgba(0,0,0,0.01);
        }
        html.dark .intel-chat-input-row { background: rgba(0,0,0,0.08); }
        .intel-chat-input {
          flex: 1; padding: 7px 10px; border-radius: 8px; font-size: 11px;
          border: 1px solid var(--border-default);
          background: var(--bg-card, #fff); color: var(--text-primary);
          outline: none; transition: border-color 0.15s;
          font-family: inherit;
        }
        html.dark .intel-chat-input { background: rgba(255,255,255,0.06); }
        .intel-chat-input:focus { border-color: var(--accent, #00bcd4); }
        .intel-chat-input::placeholder { color: var(--text-muted); opacity: 0.5; }
        .intel-chat-send {
          padding: 0 12px; border-radius: 8px; border: none; cursor: pointer;
          background: linear-gradient(135deg, #00bcd4, #009688);
          color: #fff; font-size: 10px; font-weight: 700; letter-spacing: 0.04em;
          text-transform: uppercase; transition: all 0.15s; min-height: 32px;
        }
        .intel-chat-send:hover:not(:disabled) { filter: brightness(1.1); }
        .intel-chat-send:disabled { opacity: 0.4; cursor: default; }
        .intel-chat-cost {
          text-align: center; padding: 0 14px 4px;
          font-size: 8px; color: var(--text-muted); opacity: 0.5;
        }
        .intel-chat-empty {
          text-align: center; padding: 10px 14px; font-size: 10px;
          color: var(--text-muted); opacity: 0.6;
        }
        @media (max-width: 640px) {
          .intel-metrics { flex-direction: column; }
          .intel-metric { flex-direction: row; gap: 8px; min-width: auto; }
          .intel-price-cards { flex-direction: column; }
          .intel-tab { padding: 6px 2px; }
          .intel-tab-icon { font-size: 14px; }
          .intel-tab-label { font-size: 8px; }
          .intel-collapsed-row { gap: 6px; }
          .intel-chat-q, .intel-chat-a { max-width: 92%; }
        }
      `}</style>

      {pricingConsensus?.warningBanner && (
        <div style={{ padding: "0.5rem 0.75rem", background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.25)", borderRadius: "0.4rem", fontSize: "0.7rem", color: "#b45309", marginBottom: "0.5rem", display: "flex", alignItems: "center", gap: "0.4rem", lineHeight: 1.4 }}>
          <span style={{ flexShrink: 0 }}>⚠️</span>
          <span style={{ flex: 1, minWidth: 0 }}>{pricingConsensus.warningBanner}</span>
        </div>
      )}
      <div className="intel-hud">
        {/* ═══ HEADER ═══ */}
        <div className="intel-header">
          <div className="intel-header-left">
            <div className="intel-dot" />
            <span className="intel-title">Item Intelligence</span>
            {aiIntel && <span className="intel-claude">Claude</span>}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <ScoreRing score={overallScore} color={scoreColor} />
            {onToggle && (
              <button onClick={onToggle} className="intel-toggle" title={collapsed ? "Expand" : "Collapse"}
                style={{ transform: collapsed ? "rotate(-90deg)" : "rotate(0deg)" }}>
                ▼
              </button>
            )}
          </div>
        </div>

        {/* ═══ COLLAPSED HUD ═══ */}
        {collapsed && (
          <>
            <div className="intel-collapsed">
              {aiIntel ? (
                <>
                  {/* Bloomberg-style 3×2 data tile */}
                  <div className="intel-hud-grid" style={{ width: "100%", background: "var(--ghost-bg)", borderRadius: 8, border: "1px solid var(--border-default)", overflow: "hidden", marginBottom: "6px" }}>
                    {[
                      { lbl: "SWEET SPOT", val: <CountUp value={displayPricing?.sweetSpot ?? aiIntel.pricingIntel.sweetSpot} format={(n) => `$${Math.round(n)}`} /> as React.ReactNode, color: "var(--accent, #00bcd4)", unit: "best price" },
                      { lbl: "FULL RANGE", val: `$${Math.round(displayPricing?.recommendedLow ?? aiIntel.pricingIntel.recommendedLow)}–$${Math.round(displayPricing?.recommendedHigh ?? aiIntel.pricingIntel.recommendedHigh)}`, color: "var(--text-primary)", unit: "estimated" },
                      { lbl: "DEMAND", val: aiIntel.marketPosition?.demand || "\u2014", color: /high|hot|strong/i.test(aiIntel.marketPosition?.demand || "") ? "#22c55e" : /low|cold|weak/i.test(aiIntel.marketPosition?.demand || "") ? "#ef4444" : "#f59e0b", unit: "local signal" },
                      { lbl: "READINESS", val: <><CountUp value={readinessScore} />/10</> as React.ReactNode, color: readinessScore >= 8 ? "#22c55e" : readinessScore >= 5 ? "#f59e0b" : "#ef4444", unit: "to sell" },
                      { lbl: "BEST SELL", val: aiIntel.sellingStrategy?.bestPlatform || "\u2014", color: "var(--accent, #00bcd4)", unit: "recommended" },
                      { lbl: "COMPS", val: <CountUp value={enriched?.compCount ?? 0} /> as React.ReactNode, color: (enriched?.compCount ?? 0) >= 5 ? "#22c55e" : (enriched?.compCount ?? 0) >= 1 ? "#f59e0b" : "var(--text-muted)", unit: "market comps" },
                    ].map((c, i) => (
                      <div key={c.lbl} style={{
                        padding: "8px 6px", boxSizing: "border-box", overflow: "hidden",
                        borderRight: i % 3 < 2 ? "1px solid var(--border-default)" : "none",
                        borderBottom: i < 3 ? "1px solid var(--border-default)" : "none",
                      }}>
                        <div style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)", fontWeight: 600, fontFamily: "var(--font-body)" }}>{c.lbl}</div>
                        <div style={{ fontSize: "clamp(13px, 3.5vw, 16px)", fontWeight: 700, fontFamily: "var(--font-data)", color: c.color, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.val}</div>
                        <div style={{ fontSize: "10px", color: "var(--text-muted)" }}>{c.unit}</div>
                      </div>
                    ))}
                  </div>
                  {pricingConsensus && (
                    <div style={{ fontSize: "9px", color: "var(--text-muted)", textAlign: "right" as const, marginTop: "4px", fontStyle: "italic" as const, opacity: 0.7 }}>
                      Reconciled from {pricingConsensus.sourceCount} source{pricingConsensus.sourceCount === 1 ? "" : "s"} · confidence {pricingConsensus.consensusConfidence}%
                      {pricingConsensus.trustScore != null && (
                        <> · Trust {pricingConsensus.trustScore}/100 ({pricingConsensus.trustTier})</>
                      )}
                      {consensusAgeString && (
                        <span
                          style={{
                            color: consensusAgeStale === "fresh" ? "var(--text-muted)" : "#f59e0b",
                            fontWeight: consensusAgeStale === "stale" ? 600 : 400,
                            marginLeft: "0.35rem",
                          }}
                          aria-label={`Pricing consensus updated ${consensusAgeString}`}
                          title={
                            consensusAgeStale === "stale"
                              ? "Over a week old. Consider refreshing pricing."
                              : consensusAgeStale === "aging"
                              ? "Over a day old. Consider refreshing pricing."
                              : `Pricing computed ${consensusAgeString}`
                          }
                        >
                          {" · Updated "}{consensusAgeString}
                        </span>
                      )}
                      {pricingConsensus.juryVerdict &&
                        pricingConsensus.consensusResolvedBy === "jury" && (
                          <button
                            type="button"
                            onClick={() => {
                              setJuryModalOpen(true);
                              try { (navigator as any)?.vibrate?.(8); } catch {}
                              fetch("/api/user-event", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                  eventType: "JURY_TRANSCRIPT_OPEN",
                                  itemId,
                                }),
                              }).catch(() => {});
                            }}
                            aria-label="Resolved by pricing jury — tap to see transcript"
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "0.3rem",
                              padding: "0.2rem 0.55rem",
                              borderRadius: "9999px",
                              background: "rgba(0,188,212,0.14)",
                              border: "1px solid rgba(0,188,212,0.35)",
                              color: "var(--accent, #00BCD4)",
                              fontSize: "0.62rem",
                              fontWeight: 700,
                              letterSpacing: "0.04em",
                              cursor: "pointer",
                              marginLeft: "0.35rem",
                              animation: "accentPulse 2.4s ease-in-out infinite",
                              fontFamily: "inherit",
                            }}
                          >
                            🎯 Resolved by jury
                          </button>
                        )}
                    </div>
                  )}
                  {/* Insight line */}
                  {(aiIntel.sellingStrategy?.timing || aiStale) && (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
                      {aiIntel.sellingStrategy?.timing && (
                        <div style={{ borderLeft: "2px solid var(--accent, #00bcd4)", paddingLeft: "8px", fontSize: "12px", color: "var(--text-secondary)", fontStyle: "italic", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1, minWidth: 0 }}>
                          {aiIntel.sellingStrategy.bestPlatform || "Sell now"} · {aiIntel.sellingStrategy.timing}
                        </div>
                      )}
                      {aiStale && <div style={{ fontSize: "10px", color: "#f59e0b", fontWeight: 600, flexShrink: 0 }}>⚡ New data</div>}
                    </div>
                  )}
                </>
              ) : valuation ? (
                <>
                  <div style={{ width: "100%", display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", background: "var(--ghost-bg)", borderRadius: 8, border: "1px solid var(--border-default)", overflow: "hidden", marginBottom: "6px" }}>
                    <div style={{ padding: "8px 6px", borderRight: "1px solid var(--border-default)" }}>
                      <div style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)", fontWeight: 600, fontFamily: "var(--font-body)" }}>VALUE RANGE</div>
                      <div style={{ fontSize: "clamp(13px, 3.5vw, 16px)", fontWeight: 700, fontFamily: "var(--font-data)", color: "var(--accent, #00bcd4)" }}>${Math.round(valuation.low || 0)}–${Math.round(valuation.high || 0)}</div>
                      <div style={{ fontSize: "10px", color: "var(--text-muted)" }}>AI estimate</div>
                    </div>
                    <div style={{ padding: "8px 6px" }}>
                      <div style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)", fontWeight: 600, fontFamily: "var(--font-body)" }}>READINESS</div>
                      <div style={{ fontSize: "clamp(13px, 3.5vw, 16px)", fontWeight: 700, fontFamily: "var(--font-data)", color: readinessColor }}>{readinessScore}/10</div>
                      <div style={{ fontSize: "10px", color: "var(--text-muted)" }}>to sell</div>
                    </div>
                  </div>
                  {aiData && !aiIntel && (
                    <button style={{ border: "1px solid var(--accent, #00bcd4)", background: "transparent", color: "var(--accent, #00bcd4)", height: "44px", borderRadius: "9999px", fontFamily: "var(--font-data)", fontSize: "13px", padding: "0 20px", cursor: "pointer", width: "100%" }}>
                      Expand to generate Claude Intelligence · 1 cr
                    </button>
                  )}
                </>
              ) : (
                <div style={{ fontSize: "9px", color: "var(--text-muted)" }}>
                  Run AI Analysis for intelligence
                </div>
              )}
            </div>
            {/* Collapsed footer */}
            <div className="intel-footer">
              {aiIntel && aiCachedAt ? (
                <>
                  <span className="intel-footer-text">POWERED BY CLAUDE</span>
                  <span className="intel-footer-sep" />
                  <span className="intel-footer-text">Updated {timeAgo(aiCachedAt)}</span>
                </>
              ) : (
                <span className="intel-footer-text">ITEM INTELLIGENCE</span>
              )}
            </div>
          </>
        )}

        {/* ═══ EXPANDED CONTENT ═══ */}
        {!collapsed && (
        <>

        {/* ═══ STALE DATA BANNER ═══ */}
        {aiStale && aiIntel && (
          <div className="intel-stale-bar">
            <span>⚡ New bot data available</span>
            <button onClick={generateIntel} disabled={aiLoading} className="intel-stale-btn">
              {aiLoading ? "Updating..." : "Refresh · 0.5 cr"}
            </button>
          </div>
        )}

        {/* ═══ TAB BAR ═══ */}
        <div className="intel-tabs">
          {tabs.map(t => {
            const hasAccess = canAccessIntelTab(userTier, t.key);
            return (
              <button key={t.key}
                onClick={() => hasAccess ? setActiveTab(t.key) : undefined}
                className={`intel-tab${activeTab === t.key ? " active" : ""}`}
                style={!hasAccess ? { opacity: 0.4, cursor: "default", position: "relative" } : undefined}
                title={!hasAccess ? `Requires ${t.key === "market" || t.key === "ready" ? "DIY Seller" : "Power Seller"} plan` : undefined}
              >
                <span className="intel-tab-icon">{hasAccess ? t.icon : "🔒"}</span>
                <span className="intel-tab-label">{t.label}</span>
              </button>
            );
          })}
        </div>

        {/* ═══ TAB CONTENT ═══ */}
        <div className="intel-content">

          {/* ═══ ERROR BANNER ═══ */}
          {aiError && (
            <div className="intel-error">
              <span style={{ flexShrink: 0 }}>❌</span>
              <span>{aiError}</span>
              <button onClick={generateIntel} disabled={aiLoading} className="intel-error-retry">
                Retry
              </button>
            </div>
          )}

          {/* ── Locked tab upgrade prompt ── */}
          {!canAccessIntelTab(userTier, activeTab) && (
            <div style={{
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
              padding: "2.5rem 1.5rem", textAlign: "center",
            }}>
              <div style={{
                width: 48, height: 48, borderRadius: "50%",
                background: "rgba(0,188,212,0.08)", border: "1px solid rgba(0,188,212,0.2)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "1.25rem", marginBottom: "1rem",
              }}>🔒</div>
              <div style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.35rem" }}>
                {activeTab === "market" || activeTab === "ready" ? "DIY Seller" : "Power Seller"} Plan Required
              </div>
              <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "1rem", maxWidth: 300 }}>
                Upgrade your plan to unlock {activeTab === "market" ? "market intelligence" : activeTab === "ready" ? "readiness analysis" : activeTab === "sell" ? "selling strategy" : activeTab === "alerts" ? "smart alerts" : "action recommendations"}.
              </div>
              <a href="/subscription" style={{
                display: "inline-flex", alignItems: "center", gap: "0.4rem",
                padding: "0.55rem 1.25rem", borderRadius: 10,
                background: "linear-gradient(135deg, var(--accent), var(--accent-deep, #0097a7))",
                color: "#fff", fontWeight: 700, fontSize: "0.82rem", textDecoration: "none",
                boxShadow: "0 2px 10px rgba(0,188,212,0.3)",
              }}>
                ⬆ Upgrade Plan
              </a>
            </div>
          )}

          {/* ── MARKET TAB ── */}
          {activeTab === "market" && canAccessIntelTab(userTier, "market") && (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", minWidth: 0 }}>
              {/* AI summary */}
              {aiIntel?.summary && <div className="intel-summary">{aiIntel.summary}</div>}

              {/* AI-powered pricing (3 cards) */}
              {aiIntel?.pricingIntel ? (
                <>
                  <div className="intel-price-cards">
                    <div className="intel-price-card">
                      <span className="intel-price-val" style={{ color: "#f59e0b" }}>${Math.round(displayPricing?.quickSalePrice ?? aiIntel.pricingIntel.quickSalePrice)}</span>
                      <span className="intel-price-lbl">Quick Sale</span>
                    </div>
                    <div className="intel-price-card highlight">
                      <span className="intel-price-val" style={{ color: "var(--accent)" }}>${Math.round(displayPricing?.sweetSpot ?? aiIntel.pricingIntel.sweetSpot)}</span>
                      <span className="intel-price-lbl">Sweet Spot</span>
                    </div>
                    <div className="intel-price-card">
                      <span className="intel-price-val" style={{ color: "#22c55e" }}>${Math.round(displayPricing?.premiumPrice ?? aiIntel.pricingIntel.premiumPrice)}</span>
                      <span className="intel-price-lbl">Premium</span>
                    </div>
                  </div>

                  {/* CMD-V9-WIRE: Local Enthusiast specialty-channel tier */}
                  {v9Data?.localEnthusiastPrice != null && (
                    <div style={{
                      marginTop: "4px",
                      padding: "10px 12px",
                      background: "rgba(212,160,23,0.06)",
                      border: "1px solid rgba(212,160,23,0.25)",
                      borderRadius: "10px",
                      display: "flex",
                      flexWrap: "wrap",
                      alignItems: "center",
                      gap: "12px",
                      justifyContent: "space-between",
                    }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: "2px", minWidth: 0 }}>
                        <div style={{ fontSize: "9px", textTransform: "uppercase" as const, letterSpacing: "0.1em", color: "#D4A017", fontWeight: 700 }}>
                          Local Enthusiast
                        </div>
                        <div style={{ fontSize: "16px", fontWeight: 700, fontFamily: "var(--font-data)", color: "#D4A017" }}>
                          {`$${v9Data.localEnthusiastPrice}\u2013${v9Data.localEnthusiastPriceHigh}`}
                        </div>
                        <div style={{ fontSize: "10px", color: "var(--text-muted)" }}>sell to enthusiast</div>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "2px", alignItems: "flex-end", minWidth: 0 }}>
                        <div style={{ fontSize: "10px", color: "var(--text-secondary)", fontWeight: 600, textAlign: "right" as const, maxWidth: "220px", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {v9Data.localEnthusiastChannel}
                        </div>
                        <div style={{ fontSize: "10px", color: "#22c55e", fontWeight: 700, fontFamily: "var(--font-data)" }}>
                          You get: ${Math.round(((v9Data.localEnthusiastPrice + v9Data.localEnthusiastPriceHigh) / 2) * 0.965)}
                        </div>
                        {v9Data.timeToSellDays && (
                          <div style={{ fontSize: "9px", color: "var(--text-muted)" }}>
                            ~{v9Data.timeToSellDays.min}–{v9Data.timeToSellDays.max} days typical
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* CMD-INTEL-PANEL-GS-HUD: In-Person Garage Sale tier (V8
                      LIST / ACCEPT / FLOOR canonical palette). Renders when
                      v9Data carries V8 GS fields; hidden gracefully when
                      absent. */}
                  {v9Data?.garageSalePrice != null &&
                    v9Data?.garageSalePriceHigh != null &&
                    v9Data?.quickSalePrice != null && (
                      <div
                        style={{
                          marginTop: "4px",
                          padding: "10px 12px",
                          background: "rgba(0,188,212,0.04)",
                          border: "1px solid rgba(0,188,212,0.15)",
                          borderRadius: "10px",
                          display: "grid",
                          gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr) minmax(0,1fr)",
                          gap: "8px",
                          alignItems: "start",
                        }}
                      >
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: "9px", textTransform: "uppercase" as const, letterSpacing: "0.1em", color: "#00bcd4", fontWeight: 700 }}>
                            LIST
                          </div>
                          <div style={{ fontSize: "15px", fontWeight: 700, fontFamily: "var(--font-data)", color: "#00bcd4", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            ${v9Data.garageSalePriceHigh}
                          </div>
                          <div style={{ fontSize: "9px", color: "var(--text-muted)" }}>in-person top</div>
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: "9px", textTransform: "uppercase" as const, letterSpacing: "0.1em", color: "#22c55e", fontWeight: 700 }}>
                            ACCEPT
                          </div>
                          <div style={{ fontSize: "15px", fontWeight: 700, fontFamily: "var(--font-data)", color: "#22c55e", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            ${v9Data.garageSalePrice}
                          </div>
                          <div style={{ fontSize: "9px", color: "var(--text-muted)" }}>sweet spot</div>
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: "9px", textTransform: "uppercase" as const, letterSpacing: "0.1em", color: "#f59e0b", fontWeight: 700 }}>
                            FLOOR
                          </div>
                          <div style={{ fontSize: "15px", fontWeight: 700, fontFamily: "var(--font-data)", color: "#f59e0b", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            ${v9Data.quickSalePrice}
                          </div>
                          <div style={{ fontSize: "9px", color: "var(--text-muted)" }}>walkaway</div>
                        </div>
                      </div>
                    )}
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                    <span className="intel-chip" style={{ borderColor: `${pricingConfColor}30`, color: pricingConfColor, background: `${pricingConfColor}0d` }}>
                      {aiIntel.pricingIntel.confidence.toUpperCase()} CONFIDENCE
                    </span>
                    {aiIntel.pricingIntel.sources.map((s, i) => (
                      <span key={i} className="intel-chip" style={{ borderColor: "var(--border-default)", color: "var(--text-muted)", background: "var(--ghost-bg, rgba(148,163,184,0.06))" }}>
                        {s}
                      </span>
                    ))}
                  </div>
                  <div style={{ fontSize: "11px", color: "var(--text-secondary)", lineHeight: 1.5, minWidth: 0, maxWidth: "100%", wordBreak: "break-word", overflowWrap: "anywhere" }}>
                    {aiIntel.pricingIntel.reasoning}
                  </div>
                </>
              ) : valuation ? (
                /* Fallback: prop-based pricing */
                <div className="intel-metrics">
                  <div className="intel-metric" style={{ flex: 1 }}>
                    <span className="intel-metric-val" style={{ color: "var(--accent)", fontSize: "16px" }}>
                      ${Math.round(valuation.low || 0)} — ${Math.round(valuation.high || 0)}
                    </span>
                    <span className="intel-metric-lbl">Value Range</span>
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: "center", padding: "12px 0", fontSize: "11px", color: "var(--text-muted)" }}>
                  Run AI Analysis for market intelligence
                </div>
              )}

              {/* AI condition assessment */}
              {aiIntel?.conditionAssessment && (
                <div style={{ fontSize: "11px", color: "var(--text-secondary)", lineHeight: 1.5, minWidth: 0, maxWidth: "100%", wordBreak: "break-word", overflowWrap: "anywhere" }}>
                  <span style={{ fontWeight: 700, color: "var(--text-primary)" }}>Condition: </span>
                  {aiIntel.conditionAssessment}
                </div>
              )}

              {/* Market position from AI or enriched */}
              {(aiIntel?.marketPosition || enriched) && (
                <div className="intel-metrics">
                  {(aiIntel?.marketPosition?.demand || enriched?.demandLevel) && (
                    <div className="intel-metric">
                      <span className="intel-metric-val" style={{ color: (aiIntel?.marketPosition?.demand === "high" || enriched?.demandLevel === "Strong" || enriched?.demandLevel === "High") ? "#22c55e" : "#f59e0b" }}>
                        {aiIntel?.marketPosition?.demand || enriched?.demandLevel || "—"}
                      </span>
                      <span className="intel-metric-lbl">Demand</span>
                    </div>
                  )}
                  {(aiIntel?.marketPosition?.trend || (enriched?.priceDirection && enriched.priceDirection !== "unknown")) && (
                    <div className="intel-metric">
                      <span className="intel-metric-val" style={{ color: (aiIntel?.marketPosition?.trend === "rising" || enriched?.priceDirection === "rising") ? "#22c55e" : (aiIntel?.marketPosition?.trend === "declining" || enriched?.priceDirection === "falling") ? "#ef4444" : "var(--text-muted)" }}>
                        {aiIntel?.marketPosition?.trend || enriched?.priceDirection || "—"}
                      </span>
                      <span className="intel-metric-lbl">Trend</span>
                    </div>
                  )}
                  {aiIntel?.marketPosition?.competition && (
                    <div className="intel-metric">
                      <span className="intel-metric-val" style={{ color: "var(--text-secondary)" }}>
                        {aiIntel.marketPosition.competition}
                      </span>
                      <span className="intel-metric-lbl">Competition</span>
                    </div>
                  )}
                </div>
              )}

              {/* Market insight */}
              {aiIntel?.marketPosition?.insight && (
                <div style={{ fontSize: "11px", color: "var(--text-secondary)", lineHeight: 1.5, fontStyle: "italic", minWidth: 0, maxWidth: "100%", wordBreak: "break-word", overflowWrap: "anywhere" }}>
                  💡 {aiIntel.marketPosition.insight}
                </div>
              )}

              {/* Detection chips + comps */}
              <div className="intel-chips">
                {isAntique && (
                  <span className="intel-chip" style={{ borderColor: "rgba(245,158,11,0.3)", color: "#f59e0b", background: "rgba(245,158,11,0.08)" }}>
                    🏺 Antique{authenticityScore ? ` · ${authenticityScore}/100` : ""}
                  </span>
                )}
                {isCollectible && (
                  <span className="intel-chip" style={{ borderColor: "rgba(139,92,246,0.3)", color: "#8b5cf6", background: "rgba(139,92,246,0.08)" }}>
                    ⭐ Collectible
                  </span>
                )}
                {aiConf != null && (
                  <span className="intel-chip" style={{ borderColor: "rgba(0,188,212,0.2)", color: "var(--accent)", background: "rgba(0,188,212,0.06)" }}>
                    🎯 AI: {aiConf}%
                  </span>
                )}
              </div>

              {enriched && enriched.compCount > 0 && (
                <div style={{ fontSize: "10px", color: "var(--text-muted)" }}>
                  📦 {enriched.compCount} comp{enriched.compCount !== 1 ? "s" : ""} found
                  {enriched.avgCompPrice != null && <> · Avg ${Math.round(enriched.avgCompPrice)}</>}
                  {enriched.lowComp != null && enriched.highComp != null && <> · ${Math.round(enriched.lowComp)}–${Math.round(enriched.highComp)}</>}
                </div>
              )}

              {/* AI loading state */}
              {aiLoading && !aiIntel && (
                <div className="intel-loading">
                  <span className="intel-loading-dot" />
                  <span className="intel-loading-dot" />
                  <span className="intel-loading-dot" />
                  <span>Claude is analyzing your item...</span>
                </div>
              )}

              {/* Generate button (if no AI yet and item is analyzed) */}
              {!aiIntel && !aiLoading && aiData && (
                <button onClick={generateIntel} className="intel-cta" style={{ width: "100%", justifyContent: "center", marginTop: "4px" }}>
                  Generate Claude Intelligence · 1 cr
                </button>
              )}
            </div>
          )}

          {/* ── READY TAB ── */}
          {activeTab === "ready" && canAccessIntelTab(userTier, "ready") && (
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
                <span style={{ fontSize: "18px", fontWeight: 800, color: readinessColor, fontVariantNumeric: "tabular-nums" }}>
                  {readinessScore}/10
                </span>
                <div style={{ flex: 1, height: "6px", borderRadius: "3px", background: "var(--ghost-bg, rgba(148,163,184,0.08))", overflow: "hidden" }}>
                  <div style={{
                    width: `${readinessScore * 10}%`, height: "100%", borderRadius: "3px",
                    background: `linear-gradient(90deg, ${readinessColor}88, ${readinessColor})`,
                    transition: "width 0.8s cubic-bezier(0.4, 0, 0.2, 1)",
                    boxShadow: `0 0 6px ${readinessColor}30`,
                  }} />
                </div>
              </div>
              {readinessChecks.map((c, i) => (
                <div key={i} className="intel-check">
                  <span className="intel-check-icon" style={{ color: c.ok ? "#22c55e" : "#ef4444", fontWeight: 700 }}>
                    {c.ok ? "✓" : "✗"}
                  </span>
                  <span style={{ color: c.ok ? "var(--text-secondary)" : "var(--text-primary)", fontWeight: c.ok ? 400 : 600 }}>
                    {c.label}
                  </span>
                  {!c.ok && c.fix && <a href={c.fix} className="intel-check-fix">Fix →</a>}
                </div>
              ))}
            </div>
          )}

          {/* ── SELL TAB ── */}
          {activeTab === "sell" && canAccessIntelTab(userTier, "sell") && (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {/* AI selling strategy */}
              {aiIntel?.sellingStrategy ? (
                <>
                  <div className="intel-plat-card">
                    <span style={{ fontSize: "16px" }}>🏆</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: "7.5px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--accent)", opacity: 0.7 }}>Best Platform</div>
                      <div style={{ fontSize: "14px", fontWeight: 800, color: "var(--accent)" }}>{aiIntel.sellingStrategy.bestPlatform}</div>
                    </div>
                    <span className="intel-chip" style={{ borderColor: "rgba(0,188,212,0.2)", color: "var(--accent)", background: "rgba(0,188,212,0.06)" }}>
                      {aiIntel.sellingStrategy.bestApproach}
                    </span>
                  </div>

                  {/* "What should I do?" CTA */}
                  {nextAction && (
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "6px", marginTop: "2px" }}>
                      <div className="intel-sect-lbl">What should I do?</div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", width: "100%" }}>
                        <span style={{ fontSize: "18px", lineHeight: 1 }}>{nextAction.icon}</span>
                        <span style={{ fontSize: "12px", color: "var(--text-primary)", fontWeight: 600, flex: 1, minWidth: 0, lineHeight: 1.35 }}>{nextAction.msg}</span>
                        {nextAction.href && (
                          <a href={nextAction.href} className="intel-cta" style={{ minHeight: 44, padding: "10px 16px" }} onClick={() => { try { navigator?.vibrate?.(6); } catch {} }}>
                            Take me there →
                          </a>
                        )}
                      </div>
                    </div>
                  )}

                  <div style={{ fontSize: "11.5px", color: "var(--text-secondary)", lineHeight: 1.5, minWidth: 0, maxWidth: "100%", wordBreak: "break-word", overflowWrap: "anywhere" }}>
                    {aiIntel.sellingStrategy.reasoning}
                  </div>

                  {aiIntel.sellingStrategy.alternativePlatforms.length > 0 && (
                    <div>
                      <div className="intel-sect-lbl">Also Consider</div>
                      <div className="intel-chips">
                        {aiIntel.sellingStrategy.alternativePlatforms.map((p, i) => (
                          <span key={i} className="intel-chip" style={{ borderColor: "var(--border-default)", color: "var(--text-secondary)", background: "var(--ghost-bg, rgba(148,163,184,0.06))" }}>
                            {p}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div style={{ fontSize: "11px", color: "var(--text-secondary)" }}>
                    <span style={{ fontWeight: 700 }}>⏰ Timing: </span>{aiIntel.sellingStrategy.timing}
                  </div>
                </>
              ) : enriched?.bestPlatform ? (
                <div className="intel-plat-card">
                  <span style={{ fontSize: "16px" }}>🏆</span>
                  <div>
                    <div style={{ fontSize: "7.5px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--accent)", opacity: 0.7 }}>Best Platform</div>
                    <div style={{ fontSize: "14px", fontWeight: 800, color: "var(--accent)" }}>{enriched.bestPlatform}</div>
                  </div>
                </div>
              ) : null}

              {/* Strategy advice fallback */}
              {!aiIntel?.sellingStrategy && (
                <div style={{ fontSize: "11.5px", color: "var(--text-secondary)", lineHeight: 1.5, minWidth: 0, maxWidth: "100%", wordBreak: "break-word", overflowWrap: "anywhere" }}>
                  {valuation?.localHigh && valuation?.onlineHigh ? (
                    valuation.onlineHigh > valuation.localHigh * 1.15
                      ? "📦 Ship nationally for best price — online markets pay more for this item."
                      : "🤝 Sell locally for faster sale — local demand is strong in your area."
                  ) : "Set pricing to get platform recommendations."}
                </div>
              )}

              {/* Key insights from AI */}
              {aiIntel?.keyInsights && aiIntel.keyInsights.length > 0 && (
                <div>
                  <div className="intel-sect-lbl">Key Insights</div>
                  {aiIntel.keyInsights.map((insight, i) => (
                    <div key={i} style={{ fontSize: "11px", color: "var(--text-secondary)", padding: "3px 0", lineHeight: 1.4 }}>
                      • {insight}
                    </div>
                  ))}
                </div>
              )}

              {/* Buyer profiles + value drivers from enriched */}
              {enriched?.targetBuyerProfiles && enriched.targetBuyerProfiles.length > 0 && (
                <div>
                  <div className="intel-sect-lbl">Target Buyers</div>
                  <div className="intel-chips">
                    {enriched.targetBuyerProfiles.map((p, i) => (
                      <span key={i} className="intel-chip" style={{ borderColor: "rgba(0,188,212,0.2)", color: "var(--accent)", background: "rgba(0,188,212,0.06)" }}>
                        🎯 {p}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {enriched?.topSearchKeywords && enriched.topSearchKeywords.length > 0 && (
                <div>
                  <div className="intel-sect-lbl">Top Keywords</div>
                  <div className="intel-chips">
                    {enriched.topSearchKeywords.map((k, i) => (
                      <span key={i} className="intel-chip" style={{ borderColor: "var(--border-default)", color: "var(--text-secondary)", background: "var(--ghost-bg, rgba(148,163,184,0.06))" }}>
                        🔑 {k}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {!aiIntel?.sellingStrategy && !enriched?.bestPlatform && !(valuation?.localHigh && valuation?.onlineHigh) && (
                <div style={{ textAlign: "center", padding: "12px 0", fontSize: "11px", color: "var(--text-muted)" }}>
                  Run PriceBot or BuyerBot for selling intelligence
                </div>
              )}
            </div>
          )}

          {/* ── ALERTS TAB ── */}
          {activeTab === "alerts" && canAccessIntelTab(userTier, "alerts") && (
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {uniqueWarnings.length > 0 ? uniqueWarnings.map((w, i) => {
                const c = w.type === "error"
                  ? { bg: "rgba(239,68,68,0.06)", bd: "rgba(239,68,68,0.15)", tx: "#ef4444", ic: "❌" }
                  : w.type === "warning"
                  ? { bg: "rgba(245,158,11,0.06)", bd: "rgba(245,158,11,0.15)", tx: "#f59e0b", ic: "⚠️" }
                  : { bg: "rgba(34,197,94,0.06)", bd: "rgba(34,197,94,0.15)", tx: "#22c55e", ic: "🟢" };
                return (
                  <div key={i} className="intel-alert" style={{ background: c.bg, borderColor: c.bd, color: c.tx }}>
                    <span style={{ flexShrink: 0 }}>{c.ic}</span> {w.msg}
                  </div>
                );
              }) : (
                <div style={{ textAlign: "center", padding: "16px 0" }}>
                  <div style={{ fontSize: "20px", marginBottom: "4px" }}>✅</div>
                  <div style={{ fontSize: "12px", fontWeight: 700, color: "#22c55e" }}>No warnings — your item is in great shape</div>
                </div>
              )}
            </div>
          )}

          {/* ── ACTION TAB ── */}
          {activeTab === "action" && canAccessIntelTab(userTier, "action") && (
            <div>
              {/* AI next steps (prioritized list) */}
              {aiIntel?.nextSteps && aiIntel.nextSteps.length > 0 ? (
                <div>
                  {aiIntel.nextSteps.map((s, i) => {
                    const priColor = s.priority === "high" ? "#ef4444" : s.priority === "medium" ? "#f59e0b" : "#22c55e";
                    return (
                      <div key={i} className="intel-step">
                        <div className="intel-step-pri" style={{ background: priColor, boxShadow: `0 0 4px ${priColor}40` }} />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-primary)", lineHeight: 1.3 }}>{s.step}</div>
                          <div style={{ fontSize: "10px", color: "var(--text-muted)", lineHeight: 1.3, marginTop: "2px" }}>{s.reason}</div>
                        </div>
                        <span style={{ fontSize: "8px", fontWeight: 700, color: priColor, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                          {s.priority}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : nextAction ? (
                /* Fallback: single next action */
                <div className="intel-action">
                  <div className="intel-action-icon">{nextAction.icon}</div>
                  <div className="intel-action-msg">{nextAction.msg}</div>
                  {nextAction.href && (
                    <a href={nextAction.href} className="intel-cta">Take Action →</a>
                  )}
                </div>
              ) : (
                <div style={{ textAlign: "center", padding: "16px 0", fontSize: "11px", color: "var(--text-muted)" }}>
                  No action needed right now
                </div>
              )}

              {/* Always show main CTA if relevant */}
              {aiIntel?.nextSteps && nextAction?.href && (
                <div style={{ textAlign: "center", marginTop: "10px" }}>
                  <a href={nextAction.href} className="intel-cta">
                    {nextAction.icon} Take Action →
                  </a>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ═══ ASK CLAUDE CHAT ═══ */}
        <button className="intel-chat-toggle" onClick={() => setChatOpen(!chatOpen)}>
          <span className="chat-icon">💬</span>
          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", minWidth: 0 }}>{chatOpen ? "Close Chat" : "Ask Claude"}</span>
          {chatMessages.length > 0 && !chatOpen && (
            <span style={{ fontSize: "8px", padding: "1px 5px", borderRadius: "8px", background: "rgba(0,188,212,0.12)", color: "var(--accent, #00bcd4)", fontWeight: 700, flexShrink: 0 }}>
              {chatMessages.length}
            </span>
          )}
          <span style={{ fontSize: "8px", opacity: 0.4, marginLeft: "auto", flexShrink: 0, whiteSpace: "nowrap" }}>0.25 cr / question</span>
        </button>

        {chatOpen && (
          <div className="intel-chat-area">
            {chatMessages.length === 0 ? (
              <div className="intel-chat-empty">
                Ask Claude anything about this item&apos;s data, pricing, market position, or selling strategy.
              </div>
            ) : (
              <div className="intel-chat-history" ref={(el) => { if (el) el.scrollTop = el.scrollHeight; }}>
                {chatMessages.map((m, i) => (
                  <div key={i} style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                    <div className="intel-chat-q">{m.question}</div>
                    <div className="intel-chat-a">
                      {m.answer === "..." ? (
                        <span style={{ display: "inline-flex", gap: "3px", alignItems: "center" }}>
                          <span className="intel-loading-dot" />
                          <span className="intel-loading-dot" />
                          <span className="intel-loading-dot" />
                        </span>
                      ) : m.answer}
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="intel-chat-input-row">
              <input
                className="intel-chat-input"
                type="text"
                placeholder="Ask about pricing, condition, market, strategy..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendChat(); } }}
                disabled={chatLoading}
                maxLength={500}
              />
              <button
                className="intel-chat-send"
                onClick={sendChat}
                disabled={chatLoading || !chatInput.trim()}
              >
                {chatLoading ? "..." : "Ask"}
              </button>
            </div>
          </div>
        )}

        {/* ═══ FOOTER ═══ */}
        <div className="intel-footer">
          {aiIntel && aiCachedAt ? (
            <>
              <span className="intel-footer-text">POWERED BY CLAUDE</span>
              <span className="intel-footer-sep" />
              <span className="intel-footer-text">Updated {timeAgo(aiCachedAt)}</span>
            </>
          ) : enriched && enriched.dataCompleteness < 75 ? (
            <>
              <span className="intel-footer-text">{enriched.dataCompleteness}% INTEL GATHERED</span>
              <span className="intel-footer-sep" />
              <span className="intel-footer-text">RUN MORE BOTS FOR DEEPER INSIGHTS</span>
            </>
          ) : (
            <span className="intel-footer-text">ITEM INTELLIGENCE</span>
          )}
        </div>

        </>
        )}
      </div>
      {pricingConsensus?.juryVerdict && (
        <JuryVerdictSheet
          verdict={pricingConsensus.juryVerdict}
          open={juryModalOpen}
          onClose={() => setJuryModalOpen(false)}
        />
      )}
    </>
  );
}
