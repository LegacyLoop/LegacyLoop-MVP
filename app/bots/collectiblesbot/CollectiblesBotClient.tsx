"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import BotItemSelector from "../BotItemSelector";
import BotLoadingState from "@/app/components/BotLoadingState";
import { detectCollectible } from "@/lib/collectible-detect";
import { computeCollectiblesScore, getCollectibleTierStyles } from "@/lib/collectibles-score";

type ItemPhoto = { id: string; filePath: string };

type ItemData = {
  id: string;
  title: string;
  status: string;
  photo: string | null;
  photos: ItemPhoto[];
  hasAnalysis: boolean;
  aiResult: string | null;
  collectiblesBotResult: string | null;
  collectiblesBotRunAt: string | null;
  antique: { isAntique: boolean; auctionLow: number | null; auctionHigh: number | null; reason: string | null } | null;
  category: string;
  era: string | null;
  maker: string | null;
  material: string | null;
  valuationMid: number | null;
};

function safeJson(s: string | null): any {
  if (!s) return null;
  try { return JSON.parse(s); } catch { return null; }
}

function _fp(v: any): string {
  if (v == null) return "--";
  const n = typeof v === "string" ? parseFloat(v.replace(/[^0-9.-]/g, "")) : Number(v);
  if (isNaN(n)) return String(v);
  return `$${n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

// ─── Colors ────────────────────────────────────────────────────────────────
const PURPLE = "#8b5cf6";
const PURPLE_LIGHT = "#a78bfa";
const TEAL = "#00bcd4";
const AMBER = "#f59e0b";
const GREEN = "#10b981";
const RED = "#ef4444";

// ─── MegaBot Agent Metadata ────────────────────────────────────────────────
const PROVIDER_META: Record<string, { icon: string; label: string; color: string; specialty: string }> = {
  openai: { icon: "🤖", label: "OpenAI", color: "#10a37f", specialty: "Precise grading & identification" },
  claude: { icon: "🧠", label: "Claude", color: "#d97706", specialty: "Historical context & authentication" },
  gemini: { icon: "🔮", label: "Gemini", color: "#4285f4", specialty: "Market trends & comparable data" },
  grok: { icon: "🌀", label: "Grok", color: "#00DC82", specialty: "Social buzz & trending demand" },
};

// ─── Data extraction with full fallback chaining ───────────────────────────
function extractSingleRun(result: any) {
  if (!result) return null;
  // New simplified schema → old nested schema → flat fallbacks
  const assess = result.collectible_assessment ?? null;
  const ident = result.identification ?? null;
  const val = result.valuation ?? null;
  const market = result.collector_market ?? null;
  const hist = result.historical_context ?? null;
  const cond = result.condition_deep_dive ?? null;
  const strategy = result.selling_strategy ?? null;
  const collection = result.collection_context ?? null;

  const itemName = result.item_name ?? ident?.item_name ?? null;
  const year = result.year ?? ident?.year ?? null;
  const brandSeries = result.brand_series ?? ident?.brand_series ?? null;
  const editionVariation = result.edition_variation ?? ident?.edition ?? null;
  const category = result.category ?? assess?.category ?? null;
  const subcategory = result.subcategory ?? assess?.subcategory ?? null;
  const rarity = result.rarity ?? assess?.rarity ?? null;

  // Values
  const rawLow = result.raw_value_low ?? val?.estimated_low ?? null;
  const rawMid = result.raw_value_mid ?? val?.estimated_mid ?? null;
  const rawHigh = result.raw_value_high ?? val?.estimated_high ?? null;
  const valueReasoning = result.value_reasoning ?? null;
  const recentComps = result.recent_comps ?? val?.comparable_sales ?? null;
  const populationNote = result.psa_population_note ?? result.population_data ?? null;

  // Grade values
  const psaGrade = result.estimated_grade ?? ident?.grade_estimate ?? null;
  const gradeConfidence = result.grade_confidence ?? null;
  const conditionAssessment = result.condition_assessment ?? cond?.overall_assessment ?? null;

  // Graded values — CMD-COL-A format { PSA_5: N } AND old { psa6_value: N }
  const valObj = typeof result.valuation === "object" && result.valuation ? result.valuation : null;
  const gradedValues = result.graded_values ?? null;
  const gvObj = typeof gradedValues === "object" && gradedValues ? gradedValues : null;
  const psa5 = valObj?.psa5_value ?? gvObj?.PSA_5 ?? gvObj?.psa5 ?? null;
  const psa6 = valObj?.psa6_value ?? gvObj?.PSA_6 ?? gvObj?.psa6 ?? null;
  const psa7 = valObj?.psa7_value ?? gvObj?.PSA_7 ?? gvObj?.psa7 ?? null;
  const psa8 = valObj?.psa8_value ?? gvObj?.PSA_8 ?? gvObj?.psa8 ?? null;
  const psa9 = valObj?.psa9_value ?? gvObj?.PSA_9 ?? gvObj?.psa9 ?? null;
  const psa10 = valObj?.psa10_value ?? gvObj?.PSA_10 ?? gvObj?.psa10 ?? null;

  // Old graded_values (legacy format)
  const gradedLow = gradedValues?.low_grade_value ?? null;
  const gradedMid = gradedValues?.mid_grade_value ?? null;
  const gradedHigh = gradedValues?.high_grade_value ?? null;

  // Grading ROI
  const gradingRec = result.grading_recommendation ?? result.grading_roi?.recommendation ?? market?.grading_recommendation ?? null;
  const gradingReasoning = result.grading_roi_reasoning ?? result.grading_roi?.reasoning ?? null;
  const breakEvenGrade = result.grading_roi?.break_even_grade ?? null;
  const bestGradingService = result.grading_roi?.best_grading_service ?? null;
  const psaStandardCost = result.grading_roi?.psa_standard_cost ?? null;

  // Market
  const bestPlatform = result.best_platform ?? market?.best_platform ?? null;
  const platformReasoning = result.platform_reasoning ?? null;
  const demandTrend = result.demand_trend ?? val?.price_trend ?? market?.demand_level ?? null;
  const demandReasoning = result.demand_reasoning ?? null;
  const sellingStrategy = typeof result.selling_strategy === "string" ? result.selling_strategy : strategy?.best_venue ?? null;
  const listingTitle = result.market?.listing_title ?? null;
  const buyItNowPrice = result.market?.buy_it_now_price ?? null;

  // Investment
  const price1yr = result.investment?.price_1yr ?? null;
  const price5yr = result.investment?.price_5yr ?? null;
  const catalysts = result.investment?.catalysts ?? null;
  const risks = result.investment?.risks ?? null;
  const investmentVerdict = result.investment?.verdict ?? result.potential_value ?? null;

  // Insider
  const insiderKnowledge = result.insider?.insider_knowledge ?? result.collector_notes ?? null;
  const communitySentiment = result.insider?.community_sentiment ?? null;
  const notableVariations = result.insider?.notable_variations ?? result.notable_variations ?? null;
  const authenticationNotes = result.insider?.authentication_notes ?? null;
  const printRun = result.print_run ?? null;

  const summary = result.expertSummary ?? result.executive_summary ?? result.summary ?? null;

  // Visual grading (CMD-COL-A)
  const vg = result.visual_grading ?? null;
  const vgPsaGrade = vg?.psa_grade ?? result.estimated_grade ?? null;
  const vgBgsGrade = vg?.bgs_grade ?? null;
  const vgGradeConfidence = vg?.grade_confidence ?? result.grade_confidence ?? null;
  const vgCorners = vg?.corners ?? null;
  const vgEdges = vg?.edges ?? null;
  const vgSurface = vg?.surface ?? null;
  const vgCentering = vg?.centering ?? null;
  const vgGradeReasoning = vg?.grade_reasoning ?? null;

  // Price history (CMD-COL-A)
  const ph = result.price_history ?? null;
  const trend6mo = ph?.trend_6mo ?? null;
  const trend1yr = ph?.trend_1yr ?? null;
  const trend3yr = ph?.trend_3yr ?? null;
  const peakPrice = ph?.peak_price ?? null;
  const floorPrice = ph?.floor_price ?? null;
  const catalystEvents = ph?.catalyst_events ?? null;

  // Collection context new fields (CMD-COL-A)
  const setName = collection?.set_name ?? null;
  const setTotal = collection?.set_total ?? null;
  const cardNumber = collection?.card_number ?? null;
  const isKeyCard = collection?.is_key_card ?? null;
  const keyCardReason = collection?.key_card_reason ?? null;
  const setCompletionHint = collection?.set_completion_hint ?? null;
  const collectionTag = collection?.collection_category_tag ?? null;

  return {
    assess, ident, val, market, hist, cond, strategy, collection,
    itemName, year, brandSeries, editionVariation, category, subcategory, rarity,
    rawLow, rawMid, rawHigh, valueReasoning, recentComps, populationNote,
    psaGrade, gradeConfidence, conditionAssessment,
    psa5, psa6, psa7, psa8, psa9, psa10,
    gradedValues, gradedLow, gradedMid, gradedHigh,
    gradingRec, gradingReasoning, breakEvenGrade, bestGradingService, psaStandardCost,
    bestPlatform, platformReasoning, demandTrend, demandReasoning,
    sellingStrategy, listingTitle, buyItNowPrice,
    price1yr, price5yr, catalysts, risks, investmentVerdict,
    insiderKnowledge, communitySentiment, notableVariations, authenticationNotes, printRun,
    summary,
    vg, vgPsaGrade, vgBgsGrade, vgGradeConfidence, vgCorners, vgEdges, vgSurface, vgCentering, vgGradeReasoning,
    ph, trend6mo, trend1yr, trend3yr, peakPrice, floorPrice, catalystEvents,
    setName, setTotal, cardNumber, isKeyCard, keyCardReason, setCompletionHint, collectionTag,
  };
}

// ─── MegaBot per-agent extractor ───────────────────────────────────────────
function megaNormKeys(o: any): any {
  if (!o || typeof o !== "object" || Array.isArray(o)) return o;
  const out: any = {};
  for (const key of Object.keys(o)) {
    const lk = key.toLowerCase();
    const val = o[key];
    if (val && typeof val === "object" && !Array.isArray(val)) {
      const inner: any = {};
      for (const ik of Object.keys(val)) inner[ik.toLowerCase()] = val[ik];
      out[lk] = inner;
    } else { out[lk] = val; }
  }
  return out;
}

function megaObj(v: any) { return (v && typeof v === "object" && !Array.isArray(v)) ? v : null; }

function extractMegaAgent(p: any) {
  let d = megaNormKeys(p.data || {});
  const topKeys = Object.keys(d);
  if (topKeys.length === 1 && megaObj(d[topKeys[0]]) && Object.keys(d[topKeys[0]]).length >= 2) d = d[topKeys[0]];

  // New simplified schema blocks
  const vg = megaObj(d.visual_grading) ?? megaObj(d.visual_grade_assessment) ?? null;
  const valObj = megaObj(d.valuation) ?? null;
  const gradRoi = megaObj(d.grading_roi) ?? megaObj(d.grading_assessment) ?? null;
  const mkt = megaObj(d.market) ?? megaObj(d.market_intelligence) ?? null;
  const inv = megaObj(d.investment) ?? megaObj(d.investment_outlook) ?? null;
  const ins = megaObj(d.insider) ?? megaObj(d.collector_intelligence) ?? null;
  // Old nested wrappers
  const assess = megaObj(d.collectible_assessment) ?? d;
  const ident = megaObj(d.identification) ?? d;
  const oldVal = megaObj(d.collector_market) ?? d;

  const xP = (v: any) => {
    if (v == null) return null;
    if (typeof v === "number") return v;
    const n = parseFloat(String(v).replace(/[^0-9.-]/g, ""));
    return isNaN(n) ? null : n;
  };

  return {
    category: d.category ?? assess?.category ?? null,
    rarity: d.rarity ?? assess?.rarity ?? null,
    itemName: d.item_name ?? ident?.item_name ?? null,
    year: d.year ?? ident?.year ?? null,
    brandSeries: d.brand_series ?? ident?.brand_series ?? null,
    editionVariation: d.edition_variation ?? ident?.edition ?? null,
    // Visual grading
    psaGrade: vg?.psa_grade ?? vg?.psa_grade_estimate ?? d.estimated_grade ?? ident?.grade_estimate ?? null,
    bgsGrade: vg?.bgs_grade ?? null,
    gradeConfidence: vg?.grade_confidence ?? null,
    corners: vg?.corners ?? null,
    edges: vg?.edges ?? null,
    surface: vg?.surface ?? vg?.surface_front ?? null,
    centering: vg?.centering ?? vg?.centering_front ?? null,
    gradeReasoning: vg?.grade_reasoning ?? null,
    gradeSensitivity: vg?.grade_sensitivity ?? null,
    // Valuation
    rawLow: xP(valObj?.raw_low ?? d.raw_value_low ?? d.estimated_low),
    rawMid: xP(valObj?.raw_mid ?? d.raw_value_mid ?? d.estimated_mid),
    rawHigh: xP(valObj?.raw_high ?? d.raw_value_high ?? d.estimated_high),
    valueReasoning: valObj?.value_reasoning ?? d.value_reasoning ?? null,
    recentComps: valObj?.recent_comps ?? mkt?.recent_ebay_comps ?? null,
    populationNote: valObj?.psa_population_note ?? d.population_data ?? null,
    psa6: xP(valObj?.psa6_value), psa7: xP(valObj?.psa7_value), psa8: xP(valObj?.psa8_value), psa9: xP(valObj?.psa9_value), psa10: xP(valObj?.psa10_value),
    // Grading ROI
    gradingRec: gradRoi?.recommendation ?? gradRoi?.grading_recommendation ?? d.grading_recommendation ?? null,
    gradingReasoning: gradRoi?.reasoning ?? gradRoi?.grading_reasoning ?? d.grading_roi_reasoning ?? null,
    breakEvenGrade: gradRoi?.break_even_grade ?? null,
    bestGradingService: gradRoi?.best_grading_service ?? null,
    psaStandardCost: gradRoi?.psa_standard_cost ?? null,
    // Market
    bestPlatform: mkt?.best_platform ?? d.best_platform ?? null,
    platformReasoning: mkt?.platform_reasoning ?? d.platform_reasoning ?? null,
    demandTrend: mkt?.demand_trend ?? d.demand_trend ?? oldVal?.demand_level ?? null,
    demandReasoning: mkt?.demand_reasoning ?? d.demand_reasoning ?? null,
    listingTitle: mkt?.listing_title ?? d.listing_title ?? null,
    buyItNowPrice: xP(mkt?.buy_it_now_price),
    sellingStrategy: mkt?.selling_strategy ?? (typeof d.selling_strategy === "string" ? d.selling_strategy : null),
    // Investment
    price1yr: inv?.price_1yr ?? inv?.price_target_1yr ?? null,
    price5yr: inv?.price_5yr ?? inv?.price_target_5yr ?? null,
    catalysts: inv?.catalysts ?? inv?.value_catalysts ?? null,
    risks: inv?.risks ?? inv?.risk_factors ?? null,
    investmentVerdict: inv?.verdict ?? inv?.hold_vs_sell ?? null,
    // Insider
    communitySentiment: ins?.community_sentiment ?? null,
    insiderKnowledge: ins?.insider_knowledge ?? d.collector_notes ?? null,
    notableVariations: ins?.notable_variations ?? d.notable_variations ?? null,
    authenticationNotes: ins?.authentication_notes ?? null,
    // Summary
    summary: d.expertsummary ?? d.executive_summary ?? d.summary ?? null,
    confidence: assess?.confidence ?? d.confidence ?? null,
  };
}

// ─── Shared UI helpers ─────────────────────────────────────────────────────
function Toast({ message }: { message: string }) {
  return (
    <div style={{
      position: "fixed", bottom: "2rem", right: "2rem", zIndex: 9999,
      background: "linear-gradient(135deg, #6d28d9, #7c3aed)", color: "#fff",
      padding: "0.75rem 1.25rem", borderRadius: "0.75rem", fontWeight: 600, fontSize: "0.85rem",
      boxShadow: "0 8px 32px rgba(109,40,217,0.4)",
      animation: "fadeSlideUp 0.3s ease",
    }}>
      {message}
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      style={{
        padding: "0.2rem 0.5rem", fontSize: "0.6rem", fontWeight: 600,
        background: copied ? "rgba(16,185,129,0.15)" : "rgba(0,188,212,0.1)",
        border: `1px solid ${copied ? "rgba(16,185,129,0.3)" : "rgba(0,188,212,0.2)"}`,
        color: copied ? GREEN : TEAL, borderRadius: "0.35rem", cursor: "pointer",
      }}
    >
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

// ─── Glass Card wrapper ────────────────────────────────────────────────────
function GlassCard({ children, borderColor, borderLeft, style }: {
  children: React.ReactNode;
  borderColor?: string;
  borderLeft?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div style={{
      background: "var(--bg-card-solid)",
      border: `1px solid ${borderColor || "var(--border-default)"}`,
      borderLeft: borderLeft || undefined,
      borderRadius: "14px",
      padding: "1.5rem",
      marginBottom: "1rem",
      boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)",
      ...style,
    }}>
      {children}
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontSize: "0.65rem", fontWeight: 700, color: "#7c3aed", textTransform: "uppercase",
      letterSpacing: "0.1em", marginBottom: "0.65rem",
    }}>
      {children}
    </div>
  );
}

function Badge({ children, bg, color, border }: { children: React.ReactNode; bg: string; color: string; border?: string }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center",
      padding: "0.2rem 0.6rem", borderRadius: 99, fontSize: "0.65rem", fontWeight: 700,
      background: bg, color, border: border || "none",
    }}>
      {children}
    </span>
  );
}

function GridRow({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "0.2rem 0", borderBottom: "1px solid var(--border-default)" }}>
      <span style={{ fontSize: "0.6rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</span>
      <span style={{ fontSize: "0.72rem", fontWeight: bold ? 700 : 600, color: "var(--text-primary)" }}>{value}</span>
    </div>
  );
}

// ─── SVG Confidence Meter ─────────────────────────────────────────────────
function ConfidenceMeter({ value, size = 120, label }: { value: number; size?: number; label?: string }) {
  const safeVal = typeof value === "number" && !isNaN(value) ? value : 0;
  const pct = safeVal > 1 ? safeVal : Math.round(safeVal * 100);
  const r = 42;
  const stroke = 6;
  const circ = 2 * Math.PI * r;
  const arcLen = circ * 0.75; // 270-degree arc
  const dash = (pct / 100) * arcLen;
  const gap = circ - dash;
  const color = pct >= 80 ? "#22c55e" : pct >= 50 ? PURPLE : "#ef4444";
  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg viewBox="0 0 100 100" style={{ width: "100%", height: "100%", transform: "rotate(135deg)" }}>
        <circle cx="50" cy="50" r={r} fill="none" stroke="rgba(139,92,246,0.15)" strokeWidth={stroke}
          strokeDasharray={`${arcLen} ${circ - arcLen}`} strokeLinecap="round" />
        <circle cx="50" cy="50" r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={`${dash} ${gap}`} strokeLinecap="round"
          style={{ transition: "stroke-dasharray 0.6s ease" }} />
      </svg>
      <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -45%)", textAlign: "center" }}>
        <div style={{ fontSize: size > 90 ? "1.4rem" : "1rem", fontWeight: 800, color, lineHeight: 1 }}>{pct}%</div>
        {label && <div style={{ fontSize: "0.42rem", textTransform: "uppercase" as const, letterSpacing: "0.08em", color: "var(--text-muted)", marginTop: "0.1rem" }}>{label}</div>}
      </div>
    </div>
  );
}

// ─── Grading rec color helper ──────────────────────────────────────────────
function gradingRecStyle(rec: string | null) {
  if (!rec) return { bg: "var(--ghost-bg)", color: "var(--text-muted)" };
  const l = rec.toLowerCase();
  if (l.includes("strong")) return { bg: "rgba(0,188,212,0.15)", color: TEAL };
  if (l.includes("skip")) return { bg: "rgba(16,185,129,0.12)", color: GREEN };
  return { bg: "rgba(245,158,11,0.12)", color: AMBER };
}

function demandColor(trend: string | null) {
  if (!trend) return "var(--text-muted)";
  const l = trend.toLowerCase();
  if (l.includes("rising") || l.includes("strong") || l.includes("high")) return GREEN;
  if (l.includes("declining") || l.includes("weak")) return RED;
  return TEAL;
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════
export default function CollectiblesBotClient({ items }: { items: ItemData[] }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [megaBotData, setMegaBotData] = useState<any>(null);
  const [megaBotLoading, setMegaBotLoading] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportCopied, setReportCopied] = useState(false);
  const [megaBotExpanded, setMegaBotExpanded] = useState<string | null>(null);
  const [itemPhotos, setItemPhotos] = useState<ItemPhoto[]>([]);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
  const [expandedStat, setExpandedStat] = useState<string | null>(null);

  // ─── Print stylesheet ──────────────────────────────────────────────────
  useEffect(() => {
    const style = document.createElement("style");
    style.setAttribute("data-print-collectibles", "true");
    style.textContent = `@media print { body { background: white !important; color: black !important; } nav, footer, [data-no-print] { display: none !important; } }`;
    document.head.appendChild(style);
    return () => { style.remove(); };
  }, []);

  // ─── Auto-select from URL ──────────────────────────────────────────────
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const itemParam = params.get("item");
    if (itemParam) {
      setSelectedId(itemParam);
      const item = items.find((i) => i.id === itemParam);
      if (item?.collectiblesBotResult) setResult(safeJson(item.collectiblesBotResult));
    }
  }, [items]);

  // ─── Load result on item select ────────────────────────────────────────
  useEffect(() => {
    if (!selectedId) { setResult(null); return; }
    const item = items.find((i) => i.id === selectedId);
    if (item?.collectiblesBotResult) {
      setResult(safeJson(item.collectiblesBotResult));
    } else {
      setResult(null);
      fetch(`/api/bots/collectiblesbot/${selectedId}`)
        .then((r) => r.json())
        .then((d) => { if (d.hasResult) setResult(d.result); })
        .catch(() => {});
    }
  }, [selectedId, items]);

  // ─── Load MegaBot data ─────────────────────────────────────────────────
  useEffect(() => {
    if (!selectedId) { setMegaBotData(null); return; }
    fetch(`/api/megabot/${selectedId}?bot=collectiblesbot`)
      .then((r) => r.json())
      .then((d) => {
        if (d.providers || d.consensus) setMegaBotData(d);
        else if (d.results?.collectiblesbot) setMegaBotData(d.results.collectiblesbot);
        else setMegaBotData(null);
      })
      .catch(() => setMegaBotData(null));
  }, [selectedId]);

  // ─── API handlers ──────────────────────────────────────────────────────
  const runMegaBot = useCallback(async () => {
    if (!selectedId || megaBotLoading) return;
    setMegaBotData(null);
    setMegaBotLoading(true);
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 180_000);
      const res = await fetch(`/api/megabot/${selectedId}?bot=collectiblesbot`, { method: "POST", signal: controller.signal });
      clearTimeout(timeout);
      if (res.ok) {
        const data = await res.json();
        if (data && (data.providers || data.consensus)) setMegaBotData(data);
      }
    } catch (e: any) {
      console.warn("[MegaCollectiblesBot] fetch error:", e.message);
    }
    setMegaBotLoading(false);
  }, [selectedId, megaBotLoading]);

  async function runCollectiblesBot() {
    if (!selectedId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/bots/collectiblesbot/${selectedId}`, { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setResult(data.result);
        showToast("CollectiblesBot analysis complete!");
      } else {
        const err = await res.json().catch(() => ({ error: "Failed" }));
        showToast(err.error || "Analysis failed");
      }
    } catch {
      showToast("Analysis failed");
    }
    setLoading(false);
  }

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  // ─── Derived state ─────────────────────────────────────────────────────
  const selected = items.find((i) => i.id === selectedId);
  const analyzedItems = items.filter((i) => i.hasAnalysis);
  const collectibleAnalyzedItems = analyzedItems.filter((i) => {
    const ai = safeJson(i.aiResult);
    if (!ai) return false;
    return detectCollectible(ai).isCollectible;
  });
  const collectibleItems = items.filter((i) => i.collectiblesBotResult);

  const aiData = selected ? safeJson(selected.aiResult) : null;
  const detection = aiData ? detectCollectible(aiData) : null;

  // Parse single-run result
  const sr = result ? extractSingleRun(result) : null;

  // Compute collectibles score
  const cScore = selected ? computeCollectiblesScore({
    aiResult: selected.aiResult ? { rawJson: selected.aiResult } : undefined,
    collectiblesBotResult: result ?? undefined,
    megaBotResult: megaBotData ?? undefined,
  }) : null;
  const tierStyle = cScore ? getCollectibleTierStyles(cScore.tier) : null;

  // ─── Sync photos when selected item changes ───────────────────────────
  useEffect(() => {
    if (!selected) { setItemPhotos([]); return; }
    setItemPhotos(selected.photos || []);
  }, [selected]);

  async function handlePhotoUpload(files: FileList | null) {
    if (!files || !files.length || !selectedId) return;
    setUploadingPhotos(true);
    setPhotoError(null);
    try {
      const formData = new FormData();
      for (let i = 0; i < files.length; i++) formData.append("photos[]", files[i]);
      const res = await fetch(`/api/items/photos/${selectedId}`, { method: "POST", body: formData });
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      if (data.paths && Array.isArray(data.paths)) {
        setItemPhotos((prev) => [
          ...prev,
          ...data.paths.map((fp: string, idx: number) => ({ id: `new-${Date.now()}-${idx}`, filePath: fp })),
        ]);
      }
    } catch {
      setPhotoError("Photo upload failed. Please try again.");
      setTimeout(() => setPhotoError(null), 3000);
    }
    setUploadingPhotos(false);
  }

  // ═══ RENDER ════════════════════════════════════════════════════════════
  return (
    <div style={{ position: "relative", paddingBottom: selectedId ? "5rem" : "0" }}>
      {toast && <Toast message={toast} />}

      {/* ═══ 1 — PAGE HEADER ═══ */}
      <div style={{
        background: "var(--bg-card-solid)",
        border: "1px solid var(--border-default)",
        borderLeft: "4px solid #8b5cf6",
        borderRadius: "14px",
        padding: "1.5rem 2rem",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        marginBottom: "1.5rem",
        boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <div style={{
            width: 52, height: 52, borderRadius: "14px",
            background: "linear-gradient(135deg, #8b5cf6, #6d28d9)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "1.6rem", color: "#fff",
            boxShadow: "0 4px 12px rgba(139,92,246,0.3)",
          }}>
            🎴
          </div>
          <div>
            <h1 style={{ fontSize: "1.35rem", fontWeight: 800, color: "var(--text-primary)", margin: 0, lineHeight: 1.2 }}>
              CollectiblesBot
            </h1>
            <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", margin: "0.15rem 0 0 0" }}>
              AI-Powered Collectibles Authentication & Valuation
            </p>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          {cScore && tierStyle && (
            <div style={{
              padding: "0.35rem 0.85rem", borderRadius: 99,
              background: tierStyle.badgeBackground, color: tierStyle.textColor,
              fontWeight: 700, fontSize: "0.72rem", letterSpacing: "0.04em",
              boxShadow: `0 2px 10px ${tierStyle.glowColor}`,
            }}>
              {tierStyle.label} — {cScore.score}/100
            </div>
          )}
        </div>
      </div>

      {/* ═══ 2 — STATS BANNER (clickable) ═══ */}
      {(() => {
        const valItems = collectibleAnalyzedItems.filter(i => i.valuationMid);
        const totalVal = valItems.reduce((a, b) => a + (b.valuationMid ?? 0), 0);
        const avgVal = valItems.length ? Math.round(totalVal / valItems.length) : 0;
        const highItem = valItems.length ? valItems.reduce((a, b) => (a.valuationMid ?? 0) > (b.valuationMid ?? 0) ? a : b) : null;
        const lowItem = valItems.length ? valItems.reduce((a, b) => (a.valuationMid ?? 0) < (b.valuationMid ?? 0) ? a : b) : null;
        const statPanels = [
          { key: "total", label: "Total Items", value: items.length, icon: "📦" },
          { key: "collectibles", label: "Collectibles", value: collectibleAnalyzedItems.length, icon: "🎴" },
          { key: "scanned", label: "Scanned", value: collectibleItems.length, icon: "🔬" },
          { key: "value", label: "Avg Value", value: avgVal ? `$${avgVal.toLocaleString()}` : "$--", icon: "💰" },
        ];
        return (
          <div style={{ marginBottom: "1.5rem" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "0.75rem" }}>
              {statPanels.map((s) => (
                <div
                  key={s.key}
                  onClick={() => setExpandedStat(expandedStat === s.key ? null : s.key)}
                  style={{
                    background: expandedStat === s.key ? "rgba(139,92,246,0.06)" : "var(--bg-card-solid)",
                    border: expandedStat === s.key ? `2px solid ${PURPLE}` : "1px solid var(--border-default)",
                    borderRadius: "12px",
                    padding: "1rem 0.85rem", textAlign: "center" as const,
                    boxShadow: expandedStat === s.key ? `0 4px 16px rgba(139,92,246,0.15)` : "0 1px 3px rgba(0,0,0,0.06)",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    transform: expandedStat === s.key ? "translateY(-2px)" : "none",
                    userSelect: "none" as const,
                  }}
                >
                  <div style={{ fontSize: "1.1rem", marginBottom: "0.25rem" }}>{s.icon}</div>
                  <div style={{ fontSize: "1.35rem", fontWeight: 800, color: PURPLE }}>{s.value}</div>
                  <div style={{ fontSize: "0.6rem", color: "var(--text-muted)", textTransform: "uppercase" as const, letterSpacing: "0.08em", marginTop: "0.15rem" }}>
                    {s.label} <span style={{ fontSize: "0.5rem", opacity: 0.6 }}>{expandedStat === s.key ? "▲" : "▼"}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Expanded stat detail panel */}
            {expandedStat && (
              <div style={{
                marginTop: "0.75rem", padding: "1rem 1.25rem", borderRadius: "12px",
                background: "var(--bg-card-solid)", border: "1px solid var(--border-default)",
                boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
              }}>
                {expandedStat === "total" && (
                  <>
                    <div style={{ fontSize: "0.55rem", textTransform: "uppercase" as const, letterSpacing: "0.1em", color: PURPLE, fontWeight: 700, marginBottom: "0.65rem" }}>All Items Overview</div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))", gap: "0.5rem", marginBottom: "0.75rem" }}>
                      {[
                        { l: "Analyzed", v: analyzedItems.length },
                        { l: "Not Analyzed", v: items.length - analyzedItems.length },
                        { l: "Collectibles", v: collectibleAnalyzedItems.length },
                        { l: "With Value", v: valItems.length },
                      ].map(d => (
                        <div key={d.l} style={{ padding: "0.45rem 0.5rem", borderRadius: "0.5rem", background: "var(--ghost-bg)", textAlign: "center" as const }}>
                          <div style={{ fontSize: "1rem", fontWeight: 800, color: "var(--text-primary)" }}>{d.v}</div>
                          <div style={{ fontSize: "0.5rem", color: "var(--text-muted)", textTransform: "uppercase" as const, letterSpacing: "0.06em" }}>{d.l}</div>
                        </div>
                      ))}
                    </div>
                    <div style={{ maxHeight: "160px", overflowY: "auto" as const }}>
                      {items.slice(0, 12).map(it => (
                        <div key={it.id} onClick={() => { setSelectedId(it.id); setExpandedStat(null); }} style={{
                          display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.35rem 0.4rem",
                          borderBottom: "1px solid var(--border-default)", cursor: "pointer",
                        }}>
                          {it.photo && <img src={it.photo} alt="" style={{ width: 28, height: 28, borderRadius: 6, objectFit: "cover" as const }} />}
                          <span style={{ flex: 1, fontSize: "0.72rem", fontWeight: 600, color: "var(--text-primary)", overflow: "hidden", whiteSpace: "nowrap" as const, textOverflow: "ellipsis" }}>{it.title}</span>
                          <span style={{ fontSize: "0.62rem", color: "var(--text-muted)", flexShrink: 0 }}>{it.status}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {expandedStat === "collectibles" && (
                  <>
                    <div style={{ fontSize: "0.55rem", textTransform: "uppercase" as const, letterSpacing: "0.1em", color: PURPLE, fontWeight: 700, marginBottom: "0.65rem" }}>Detected Collectibles</div>
                    {collectibleAnalyzedItems.length === 0 ? (
                      <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", margin: 0 }}>No collectibles detected yet. Run analysis on your items.</p>
                    ) : (
                      <div style={{ maxHeight: "200px", overflowY: "auto" as const }}>
                        {collectibleAnalyzedItems.map(it => {
                          const ai = safeJson(it.aiResult);
                          const det = ai ? detectCollectible(ai) : null;
                          return (
                            <div key={it.id} onClick={() => { setSelectedId(it.id); setExpandedStat(null); }} style={{
                              display: "flex", alignItems: "center", gap: "0.65rem", padding: "0.45rem 0.4rem",
                              borderBottom: "1px solid var(--border-default)", cursor: "pointer",
                            }}>
                              {it.photo && <img src={it.photo} alt="" style={{ width: 32, height: 32, borderRadius: 8, objectFit: "cover" as const }} />}
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-primary)", overflow: "hidden", whiteSpace: "nowrap" as const, textOverflow: "ellipsis" }}>{it.title}</div>
                                <div style={{ fontSize: "0.6rem", color: "var(--text-muted)" }}>{det?.category ?? it.category}{it.era ? ` · ${it.era}` : ""}</div>
                              </div>
                              {it.valuationMid && <span style={{ fontSize: "0.78rem", fontWeight: 700, color: GREEN, flexShrink: 0 }}>${it.valuationMid.toLocaleString()}</span>}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </>
                )}

                {expandedStat === "scanned" && (
                  <>
                    <div style={{ fontSize: "0.55rem", textTransform: "uppercase" as const, letterSpacing: "0.1em", color: PURPLE, fontWeight: 700, marginBottom: "0.65rem" }}>CollectiblesBot Scan History</div>
                    {collectibleItems.length === 0 ? (
                      <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", margin: 0 }}>No items scanned yet. Select an item and run CollectiblesBot.</p>
                    ) : (
                      <div style={{ maxHeight: "200px", overflowY: "auto" as const }}>
                        {collectibleItems.map(it => {
                          const cbr = safeJson(it.collectiblesBotResult);
                          const grade = cbr?.visual_grading?.estimated_psa_grade ?? cbr?.grading_assessment?.estimated_grade ?? null;
                          return (
                            <div key={it.id} onClick={() => { setSelectedId(it.id); setExpandedStat(null); }} style={{
                              display: "flex", alignItems: "center", gap: "0.65rem", padding: "0.45rem 0.4rem",
                              borderBottom: "1px solid var(--border-default)", cursor: "pointer",
                            }}>
                              {it.photo && <img src={it.photo} alt="" style={{ width: 32, height: 32, borderRadius: 8, objectFit: "cover" as const }} />}
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-primary)", overflow: "hidden", whiteSpace: "nowrap" as const, textOverflow: "ellipsis" }}>{it.title}</div>
                                <div style={{ fontSize: "0.6rem", color: "var(--text-muted)" }}>Scanned {it.collectiblesBotRunAt ? new Date(it.collectiblesBotRunAt).toLocaleDateString() : ""}</div>
                              </div>
                              {grade && <span style={{ padding: "0.1rem 0.45rem", borderRadius: 99, fontSize: "0.62rem", fontWeight: 700, background: "rgba(139,92,246,0.1)", color: PURPLE }}>{grade}</span>}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </>
                )}

                {expandedStat === "value" && (
                  <>
                    <div style={{ fontSize: "0.55rem", textTransform: "uppercase" as const, letterSpacing: "0.1em", color: PURPLE, fontWeight: 700, marginBottom: "0.65rem" }}>Valuation Summary</div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))", gap: "0.5rem", marginBottom: "0.75rem" }}>
                      {[
                        { l: "Portfolio Total", v: `$${totalVal.toLocaleString()}`, c: GREEN },
                        { l: "Average", v: `$${avgVal.toLocaleString()}`, c: PURPLE },
                        { l: "Highest", v: highItem ? `$${(highItem.valuationMid ?? 0).toLocaleString()}` : "--", c: GREEN },
                        { l: "Lowest", v: lowItem ? `$${(lowItem.valuationMid ?? 0).toLocaleString()}` : "--", c: "var(--text-muted)" },
                      ].map(d => (
                        <div key={d.l} style={{ padding: "0.5rem", borderRadius: "0.5rem", background: "var(--ghost-bg)", textAlign: "center" as const }}>
                          <div style={{ fontSize: "1.05rem", fontWeight: 800, color: d.c }}>{d.v}</div>
                          <div style={{ fontSize: "0.5rem", color: "var(--text-muted)", textTransform: "uppercase" as const, letterSpacing: "0.06em" }}>{d.l}</div>
                        </div>
                      ))}
                    </div>
                    {valItems.length > 0 && (
                      <div style={{ maxHeight: "140px", overflowY: "auto" as const }}>
                        {valItems.sort((a, b) => (b.valuationMid ?? 0) - (a.valuationMid ?? 0)).map(it => (
                          <div key={it.id} onClick={() => { setSelectedId(it.id); setExpandedStat(null); }} style={{
                            display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.35rem 0.4rem",
                            borderBottom: "1px solid var(--border-default)", cursor: "pointer",
                          }}>
                            {it.photo && <img src={it.photo} alt="" style={{ width: 28, height: 28, borderRadius: 6, objectFit: "cover" as const }} />}
                            <span style={{ flex: 1, fontSize: "0.72rem", fontWeight: 600, color: "var(--text-primary)", overflow: "hidden", whiteSpace: "nowrap" as const, textOverflow: "ellipsis" }}>{it.title}</span>
                            <span style={{ fontSize: "0.82rem", fontWeight: 700, color: GREEN, flexShrink: 0 }}>${(it.valuationMid ?? 0).toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        );
      })()}

      {/* ═══ 3 — ITEM SELECTOR ═══ */}
      <GlassCard borderColor="rgba(139,92,246,0.2)" style={{ padding: "1.25rem" }}>
        <SectionLabel>Select Item for Collectibles Analysis</SectionLabel>
        <BotItemSelector
          items={collectibleAnalyzedItems}
          selectedId={selectedId}
          onSelect={setSelectedId}
        />
      </GlassCard>

      {/* ═══ 4 — PRE-SCAN DETECTION ═══ */}
      {selected && detection && (
        <GlassCard
          borderColor={detection.isCollectible ? "rgba(139,92,246,0.35)" : "rgba(139,92,246,0.15)"}
          style={{
            background: detection.isCollectible
              ? "linear-gradient(135deg, rgba(139,92,246,0.06), rgba(109,40,217,0.02))"
              : "var(--bg-card-solid)",
          }}
        >
          <SectionLabel>Pre-Scan Detection</SectionLabel>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap", marginBottom: "0.75rem" }}>
            <Badge
              bg={detection.isCollectible ? "rgba(16,185,129,0.12)" : "rgba(239,68,68,0.1)"}
              color={detection.isCollectible ? GREEN : RED}
              border={`1px solid ${detection.isCollectible ? "rgba(16,185,129,0.3)" : "rgba(239,68,68,0.2)"}`}
            >
              {detection.isCollectible ? "Collectible Detected" : "Not Flagged"}
            </Badge>
            <div style={{ display: "flex", gap: "0.75rem", fontSize: "0.75rem" }}>
              <span style={{ color: "var(--text-muted)" }}>Score: <span style={{ fontWeight: 700, color: PURPLE }}>{detection.score}</span></span>
              <span style={{ color: "var(--text-muted)" }}>Confidence: <span style={{ fontWeight: 700, color: PURPLE }}>{detection.confidence}%</span></span>
              <span style={{ color: "var(--text-muted)" }}>Potential: <span style={{ fontWeight: 700, color: detection.potentialValue === "Very High" || detection.potentialValue === "High" ? GREEN : "var(--text-primary)" }}>{detection.potentialValue}</span></span>
            </div>
          </div>
          {/* Confidence bar */}
          <div style={{ height: 4, borderRadius: 99, background: "var(--ghost-bg)", overflow: "hidden", marginBottom: "0.65rem" }}>
            <div style={{ height: "100%", width: `${Math.min(100, detection.confidence)}%`, borderRadius: 99, background: `linear-gradient(90deg, ${PURPLE}, ${TEAL})`, transition: "width 0.5s ease" }} />
          </div>
          {detection.category && (
            <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
              <Badge bg="rgba(139,92,246,0.12)" color={PURPLE} border="1px solid rgba(139,92,246,0.3)">{detection.category}</Badge>
              {detection.subcategory && (
                <Badge bg="var(--ghost-bg)" color="var(--text-secondary)" border="1px solid var(--border-default)">{detection.subcategory}</Badge>
              )}
              {detection.signals.filter(s => !s.startsWith("Negative")).slice(0, 3).map((sig, i) => (
                <span key={i} style={{ padding: "0.12rem 0.45rem", borderRadius: 99, fontSize: "0.6rem", fontWeight: 600, background: "rgba(139,92,246,0.06)", color: PURPLE_LIGHT, border: "1px solid rgba(139,92,246,0.15)" }}>
                  {sig}
                </span>
              ))}
            </div>
          )}
        </GlassCard>
      )}

      {/* ═══ PHOTO GALLERY ═══ */}
      {selected && (
        <div style={{
          background: "var(--bg-card-solid, var(--bg-card))",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          border: "1px solid rgba(139,92,246,0.2)",
          borderRadius: "14px",
          padding: "1.25rem",
          marginBottom: "1rem",
        }}>
          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
            <span style={{ color: "var(--text-primary)", fontWeight: 700, fontSize: "0.95rem" }}>
              Collectible Photos
            </span>
            <span style={{
              background: "rgba(139,92,246,0.15)",
              color: "#8b5cf6",
              border: "1px solid rgba(139,92,246,0.3)",
              borderRadius: "20px",
              padding: "0.2rem 0.7rem",
              fontSize: "0.8rem",
              fontWeight: 600,
            }}>
              {itemPhotos.length} photo{itemPhotos.length !== 1 ? "s" : ""}
            </span>
          </div>

          {/* Photo Grid */}
          {itemPhotos.length > 0 ? (
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
              gap: "0.75rem",
            }}>
              {itemPhotos.map((p, idx) => (
                <div
                  key={p.id}
                  onClick={() => setLightboxIdx(idx)}
                  style={{
                    position: "relative",
                    borderRadius: "10px",
                    overflow: "hidden",
                    aspectRatio: "4/3",
                    background: "var(--ghost-bg)",
                    border: "1px solid rgba(139,92,246,0.1)",
                    cursor: "pointer",
                    transition: "border-color 0.2s, transform 0.2s",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(139,92,246,0.4)"; e.currentTarget.style.transform = "scale(1.02)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(139,92,246,0.1)"; e.currentTarget.style.transform = "scale(1)"; }}
                >
                  <img
                    src={p.filePath}
                    alt=""
                    style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div style={{ color: "var(--text-muted)", fontSize: "0.85rem", textAlign: "center", padding: "2rem" }}>
              No photos yet — add photos to enable visual grading
            </div>
          )}

          {/* Add Photo Button */}
          <label style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            background: "rgba(139,92,246,0.08)",
            border: "1px dashed rgba(139,92,246,0.3)",
            borderRadius: "10px",
            padding: "0.75rem 1.25rem",
            color: "#8b5cf6",
            fontWeight: 600,
            fontSize: "0.85rem",
            cursor: uploadingPhotos ? "not-allowed" : "pointer",
            marginTop: "0.75rem",
            width: "100%",
            justifyContent: "center",
            opacity: uploadingPhotos ? 0.6 : 1,
          }}>
            <input
              type="file"
              accept="image/*,image/heic"
              multiple
              style={{ display: "none" }}
              onChange={(e) => handlePhotoUpload(e.target.files)}
              disabled={uploadingPhotos}
            />
            {uploadingPhotos ? "Uploading..." : "+ Add Photos"}
          </label>

          {/* Upload error */}
          {photoError && (
            <div style={{ color: "#ef4444", fontSize: "0.8rem", marginTop: "0.5rem", textAlign: "center" }}>
              {photoError}
            </div>
          )}
        </div>
      )}

      {/* ═══ LIGHTBOX ═══ */}
      {lightboxIdx !== null && itemPhotos.length > 0 && (
        <div
          onClick={() => setLightboxIdx(null)}
          style={{
            position: "fixed", inset: 0, zIndex: 9999,
            background: "rgba(0,0,0,0.9)", backdropFilter: "blur(8px)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          {/* Prev arrow */}
          {itemPhotos.length > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); setLightboxIdx((prev) => (prev! - 1 + itemPhotos.length) % itemPhotos.length); }}
              style={{
                position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)",
                width: 44, height: 44, borderRadius: "50%",
                background: "rgba(139,92,246,0.2)", border: "1px solid rgba(139,92,246,0.4)",
                color: "#fff", fontSize: "1.2rem", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              ‹
            </button>
          )}

          {/* Image */}
          <img
            onClick={(e) => e.stopPropagation()}
            src={itemPhotos[lightboxIdx]?.filePath}
            alt=""
            style={{
              maxWidth: "90vw", maxHeight: "85vh",
              objectFit: "contain", borderRadius: "12px",
              boxShadow: "0 8px 40px rgba(0,0,0,0.6)",
            }}
          />

          {/* Next arrow */}
          {itemPhotos.length > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); setLightboxIdx((prev) => (prev! + 1) % itemPhotos.length); }}
              style={{
                position: "absolute", right: "1rem", top: "50%", transform: "translateY(-50%)",
                width: 44, height: 44, borderRadius: "50%",
                background: "rgba(139,92,246,0.2)", border: "1px solid rgba(139,92,246,0.4)",
                color: "#fff", fontSize: "1.2rem", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              ›
            </button>
          )}

          {/* Close button */}
          <button
            onClick={() => setLightboxIdx(null)}
            style={{
              position: "absolute", top: "1rem", right: "1rem",
              width: 36, height: 36, borderRadius: "50%",
              background: "var(--bg-card-hover)", border: "1px solid var(--border-default)",
              color: "#fff", fontSize: "1.1rem", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            ✕
          </button>

          {/* Counter */}
          <div style={{
            position: "absolute", bottom: "1.5rem",
            fontSize: "0.82rem", color: "var(--text-secondary)", fontWeight: 600,
          }}>
            {lightboxIdx + 1} / {itemPhotos.length}
          </div>
        </div>
      )}

      {/* ═══ SINGLE-RUN RESULTS ═══ */}
      {sr && selected && (
        <>
          {/* Card A — Item Identity */}
          <GlassCard borderLeft="3px solid rgba(139,92,246,0.7)">
            <SectionLabel>Item Identity</SectionLabel>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap", marginBottom: "0.5rem" }}>
              {sr.category && <Badge bg="rgba(139,92,246,0.15)" color={PURPLE}>{sr.category}</Badge>}
              {sr.rarity && (
                <Badge
                  bg={sr.rarity === "Ultra Rare" || sr.rarity === "Very Rare" ? "rgba(239,68,68,0.12)" : sr.rarity === "Rare" ? "rgba(245,158,11,0.12)" : "var(--ghost-bg)"}
                  color={sr.rarity === "Ultra Rare" || sr.rarity === "Very Rare" ? RED : sr.rarity === "Rare" ? AMBER : "var(--text-secondary)"}
                >
                  {sr.rarity}
                </Badge>
              )}
              {sr.psaGrade && <Badge bg="rgba(139,92,246,0.12)" color={PURPLE_LIGHT}>Est. Grade: {sr.psaGrade}</Badge>}
              {!sr.psaGrade && <Badge bg="var(--ghost-bg)" color="var(--text-muted)">Ungraded</Badge>}
            </div>
            {sr.itemName && (
              <div style={{ fontSize: "1.15rem", fontWeight: 800, color: "var(--text-primary)", marginBottom: "0.25rem", lineHeight: 1.3 }}>
                {sr.itemName}
              </div>
            )}
            <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", fontSize: "0.78rem", color: "var(--text-secondary)" }}>
              {sr.year && <span>{sr.year}</span>}
              {sr.brandSeries && <span>{sr.brandSeries}</span>}
              {sr.editionVariation && <span style={{ fontStyle: "italic", color: "var(--text-muted)" }}>{sr.editionVariation}</span>}
              {sr.subcategory && <span style={{ color: PURPLE_LIGHT }}>{sr.subcategory}</span>}
            </div>
          </GlassCard>

          {/* Card B — Valuation */}
          {(sr.rawLow || sr.rawHigh || sr.psa6) && (
            <GlassCard borderLeft={`3px solid rgba(245,158,11,0.6)`}>
              <SectionLabel>Valuation</SectionLabel>
              {/* Raw value range */}
              {(sr.rawLow || sr.rawHigh) && (
                <div style={{ display: "flex", gap: "1.25rem", justifyContent: "center", marginBottom: "1rem", flexWrap: "wrap" }}>
                  {[
                    { label: "Low", value: sr.rawLow, color: "var(--text-secondary)" },
                    { label: "Mid", value: sr.rawMid, color: AMBER, highlight: true },
                    { label: "High", value: sr.rawHigh, color: GREEN },
                  ].filter(v => v.value != null).map(v => (
                    <div key={v.label} style={{
                      textAlign: "center", padding: "0.65rem 1.25rem", borderRadius: "12px",
                      background: v.highlight ? "rgba(245,158,11,0.08)" : "var(--bg-card)",
                      border: `1.5px solid ${v.highlight ? "rgba(245,158,11,0.25)" : "var(--border-default)"}`,
                      minWidth: "5.5rem",
                    }}>
                      <div style={{ fontSize: "0.55rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-muted)" }}>{v.label}</div>
                      <div style={{ fontSize: "1.3rem", fontWeight: 800, color: v.color, marginTop: "0.1rem" }}>{_fp(v.value)}</div>
                    </div>
                  ))}
                </div>
              )}
              {/* PSA Grade Ladder */}
              {(sr.psa5 || sr.psa6 || sr.psa7 || sr.psa8 || sr.psa9 || sr.psa10) && (
                <div style={{ marginBottom: "0.85rem" }}>
                  <div style={{ fontSize: "0.55rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.4rem" }}>PSA Grade Ladder</div>
                  <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap" }}>
                    {[{ g: "5", v: sr.psa5 }, { g: "6", v: sr.psa6 }, { g: "7", v: sr.psa7 }, { g: "8", v: sr.psa8 }, { g: "9", v: sr.psa9 }, { g: "10", v: sr.psa10 }].filter(x => x.v != null).map(x => (
                      <div key={x.g} style={{
                        textAlign: "center", padding: "0.4rem 0.65rem", borderRadius: "10px", minWidth: "4rem",
                        background: x.g === "10" ? "rgba(139,92,246,0.12)" : "var(--bg-card)",
                        border: `1px solid ${x.g === "10" ? "rgba(139,92,246,0.35)" : "var(--border-default)"}`,
                      }}>
                        <div style={{ fontSize: "0.55rem", color: "var(--text-muted)" }}>PSA {x.g}</div>
                        <div style={{ fontSize: "0.85rem", fontWeight: 700, color: x.g === "10" ? PURPLE : "var(--text-primary)" }}>{_fp(x.v)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {/* Old graded values fallback */}
              {!sr.psa6 && sr.gradedValues && (sr.gradedLow || sr.gradedHigh) && (
                <div style={{ display: "flex", gap: "1rem", marginBottom: "0.75rem" }}>
                  {sr.gradedValues.grade_label && <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>{sr.gradedValues.grade_label}:</span>}
                  {sr.gradedLow && <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--text-secondary)" }}>{_fp(sr.gradedLow)}</span>}
                  {sr.gradedMid && <span style={{ fontSize: "0.78rem", fontWeight: 700, color: AMBER }}>{_fp(sr.gradedMid)}</span>}
                  {sr.gradedHigh && <span style={{ fontSize: "0.78rem", fontWeight: 700, color: GREEN }}>{_fp(sr.gradedHigh)}</span>}
                </div>
              )}
              {sr.valueReasoning && (
                <p style={{ fontSize: "0.78rem", color: "var(--text-secondary)", lineHeight: 1.55, margin: "0 0 0.5rem 0" }}>
                  {sr.valueReasoning}
                </p>
              )}
              {/* Recent comps callout */}
              {sr.recentComps && (
                <div style={{
                  padding: "0.65rem 0.85rem", borderRadius: "10px",
                  background: "rgba(245,158,11,0.06)", borderLeft: `3px solid ${AMBER}`,
                  marginBottom: "0.5rem",
                }}>
                  <div style={{ fontSize: "0.55rem", textTransform: "uppercase", letterSpacing: "0.08em", color: AMBER, fontWeight: 700, marginBottom: "0.2rem" }}>Recent Comparables</div>
                  <div style={{ fontSize: "0.72rem", color: "var(--text-secondary)", lineHeight: 1.4 }}>
                    {typeof sr.recentComps === "string" ? sr.recentComps : Array.isArray(sr.recentComps) ? sr.recentComps.map((c: any, i: number) => (
                      <div key={i} style={{ padding: "0.15rem 0" }}>
                        {typeof c === "string" ? c : `${c.description || c.item || "Comp"} — ${c.platform || ""} — ${typeof c.price === "number" ? `$${c.price.toLocaleString()}` : c.price || ""}`}
                      </div>
                    )) : JSON.stringify(sr.recentComps)}
                  </div>
                </div>
              )}
              {sr.populationNote && (
                <div style={{ fontSize: "0.68rem", color: "var(--text-muted)", fontStyle: "italic" }}>Population: {sr.populationNote}</div>
              )}
            </GlassCard>
          )}

          {/* Card C — Grade Assessment */}
          {(sr.psaGrade || sr.conditionAssessment || sr.gradingRec) && (
            <GlassCard borderLeft="3px solid rgba(139,92,246,0.6)">
              <SectionLabel>Grade Assessment</SectionLabel>
              <div style={{ display: "flex", alignItems: "center", gap: "1.25rem", flexWrap: "wrap", marginBottom: "0.75rem" }}>
                {sr.psaGrade && (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.25rem", flexShrink: 0 }}>
                    <div style={{ fontSize: "0.55rem", textTransform: "uppercase" as const, letterSpacing: "0.08em", color: "var(--text-muted)", fontWeight: 600 }}>Estimated</div>
                    <div style={{
                      padding: "0.5rem 1rem", borderRadius: "14px",
                      background: "linear-gradient(135deg, rgba(139,92,246,0.15), rgba(109,40,217,0.1))",
                      border: "1.5px solid rgba(139,92,246,0.35)",
                      textAlign: "center",
                    }}>
                      <span style={{ fontSize: "1.4rem", fontWeight: 800, color: "#7c3aed", whiteSpace: "nowrap" }}>{sr.psaGrade}</span>
                    </div>
                  </div>
                )}
                {(sr.vgGradeConfidence ?? sr.gradeConfidence) != null && (
                  <div style={{ flexShrink: 0 }}>
                    <ConfidenceMeter value={sr.vgGradeConfidence ?? sr.gradeConfidence ?? 0} size={80} label="Grade Confidence" />
                  </div>
                )}
                {sr.conditionAssessment && (
                  <div style={{ flex: 1, minWidth: "150px", fontSize: "0.75rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>{sr.conditionAssessment}</div>
                )}
              </div>
              {/* Grading recommendation pill */}
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center" }}>
                {sr.gradingRec && (() => {
                  const gs = gradingRecStyle(sr.gradingRec);
                  return <Badge bg={gs.bg} color={gs.color} border={`1px solid ${gs.color}40`}>{sr.gradingRec}</Badge>;
                })()}
                {sr.breakEvenGrade && <Badge bg="var(--ghost-bg)" color="var(--text-secondary)">Break-even: PSA {sr.breakEvenGrade}</Badge>}
                {sr.bestGradingService && (
                  <Badge bg="var(--ghost-bg)" color="var(--text-muted)">
                    {sr.bestGradingService}{sr.psaStandardCost ? ` ($${sr.psaStandardCost})` : ""}
                  </Badge>
                )}
              </div>
              {sr.gradingReasoning && (
                <p style={{ fontSize: "0.72rem", color: "var(--text-secondary)", lineHeight: 1.5, margin: "0.65rem 0 0 0" }}>
                  {sr.gradingReasoning}
                </p>
              )}
            </GlassCard>
          )}

          {/* Card C2 — Visual Grading */}
          {sr.vg && (sr.vgPsaGrade || sr.vgCorners || sr.vgCentering || sr.vgGradeConfidence) && (
            <GlassCard borderLeft="3px solid rgba(139,92,246,0.6)">
              <SectionLabel>Visual Grade Analysis</SectionLabel>
              <div style={{ display: "flex", gap: "1rem", alignItems: "center", flexWrap: "wrap", marginBottom: "0.75rem" }}>
                {sr.vgPsaGrade && (
                  <div style={{ width: 60, height: 60, borderRadius: "0.65rem", background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.3)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                    <div style={{ fontSize: "1.1rem", fontWeight: 800, color: PURPLE }}>{sr.vgPsaGrade.replace(/^PSA\s*/i, "")}</div>
                    <div style={{ fontSize: "0.45rem", color: "var(--text-muted)", textTransform: "uppercase" as const }}>PSA</div>
                  </div>
                )}
                {sr.vgBgsGrade && (
                  <div style={{ flex: 1, minWidth: 0, fontSize: "0.75rem", color: TEAL, fontWeight: 600 }}>{sr.vgBgsGrade}</div>
                )}
                {sr.vgGradeConfidence != null && (
                  <ConfidenceMeter value={sr.vgGradeConfidence} size={70} label="Confidence" />
                )}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", marginBottom: "0.5rem" }}>
                {[
                  { label: "Corners", value: sr.vgCorners },
                  { label: "Edges", value: sr.vgEdges },
                  { label: "Surface", value: sr.vgSurface },
                  { label: "Centering", value: sr.vgCentering },
                ].filter(d => d.value).map(d => (
                  <div key={d.label} style={{ padding: "0.4rem 0.55rem", background: "var(--bg-card)", border: "1px solid var(--border-default)", borderRadius: "0.4rem" }}>
                    <div style={{ fontSize: "0.55rem", textTransform: "uppercase" as const, letterSpacing: "0.06em", color: "var(--text-muted)", marginBottom: "0.1rem" }}>{d.label}</div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-primary)", lineHeight: 1.4 }}>{d.value}</div>
                  </div>
                ))}
              </div>
              {sr.vgGradeReasoning && (
                <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", lineHeight: 1.55, margin: 0, fontStyle: "italic" }}>{sr.vgGradeReasoning}</p>
              )}
            </GlassCard>
          )}

          {/* Card D — Market Intelligence */}
          {(sr.bestPlatform || sr.demandTrend || sr.demandReasoning) && (
            <GlassCard borderLeft={`3px solid ${TEAL}`}>
              <SectionLabel>Market Intelligence</SectionLabel>
              {/* KPI strip */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "0.65rem", marginBottom: "0.85rem" }}>
                {sr.bestPlatform && (
                  <div style={{
                    padding: "0.65rem 0.75rem", borderRadius: "0.65rem",
                    background: "rgba(0,188,212,0.06)", border: "1px solid rgba(0,188,212,0.18)",
                    textAlign: "center" as const,
                  }}>
                    <div style={{ fontSize: "0.5rem", textTransform: "uppercase" as const, letterSpacing: "0.1em", color: "var(--text-muted)", marginBottom: "0.3rem", fontWeight: 600 }}>Best Platform</div>
                    <div style={{ fontSize: "1rem", fontWeight: 800, color: TEAL }}>{sr.bestPlatform}</div>
                  </div>
                )}
                {sr.demandTrend && (() => {
                  const dc = demandColor(sr.demandTrend);
                  const arrow = sr.demandTrend.toLowerCase().includes("rising") ? "↑" : sr.demandTrend.toLowerCase().includes("declining") ? "↓" : "→";
                  return (
                    <div style={{
                      padding: "0.65rem 0.75rem", borderRadius: "0.65rem",
                      background: `${dc}08`, border: `1px solid ${dc}22`,
                      textAlign: "center" as const,
                    }}>
                      <div style={{ fontSize: "0.5rem", textTransform: "uppercase" as const, letterSpacing: "0.1em", color: "var(--text-muted)", marginBottom: "0.3rem", fontWeight: 600 }}>Demand Trend</div>
                      <div style={{ fontSize: "1rem", fontWeight: 800, color: dc }}>{arrow} {sr.demandTrend}</div>
                    </div>
                  );
                })()}
                {sr.market?.collector_community && (
                  <div style={{
                    padding: "0.65rem 0.75rem", borderRadius: "0.65rem",
                    background: "rgba(139,92,246,0.05)", border: "1px solid rgba(139,92,246,0.15)",
                    textAlign: "center" as const,
                  }}>
                    <div style={{ fontSize: "0.5rem", textTransform: "uppercase" as const, letterSpacing: "0.1em", color: "var(--text-muted)", marginBottom: "0.3rem", fontWeight: 600 }}>Community</div>
                    <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--text-primary)" }}>{sr.market.collector_community}</div>
                  </div>
                )}
              </div>
              {/* Insight block */}
              {(sr.demandReasoning || sr.platformReasoning) && (
                <div style={{
                  padding: "0.75rem 0.85rem", borderRadius: "0.55rem",
                  background: "var(--ghost-bg)", borderLeft: `3px solid ${TEAL}`,
                  marginBottom: "0.65rem",
                }}>
                  {sr.platformReasoning && (
                    <p style={{ fontSize: "0.78rem", color: "var(--text-primary)", lineHeight: 1.55, margin: 0, fontWeight: 500 }}>{sr.platformReasoning}</p>
                  )}
                  {sr.demandReasoning && (
                    <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", lineHeight: 1.5, margin: sr.platformReasoning ? "0.4rem 0 0 0" : 0 }}>{sr.demandReasoning}</p>
                  )}
                </div>
              )}
              {/* Buyer types */}
              {sr.market && Array.isArray(sr.market.buyer_types) && sr.market.buyer_types.length > 0 && (
                <div>
                  <div style={{ fontSize: "0.5rem", textTransform: "uppercase" as const, letterSpacing: "0.1em", color: "var(--text-muted)", marginBottom: "0.35rem", fontWeight: 600 }}>Target Buyers</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem" }}>
                    {sr.market.buyer_types.slice(0, 6).map((bt: string, i: number) => (
                      <span key={i} style={{
                        padding: "0.2rem 0.55rem", borderRadius: 99, fontSize: "0.65rem", fontWeight: 600,
                        background: "rgba(0,188,212,0.08)", color: TEAL, border: "1px solid rgba(0,188,212,0.2)",
                      }}>{bt}</span>
                    ))}
                  </div>
                </div>
              )}
            </GlassCard>
          )}

          {/* Card D2 — Price History */}
          {sr.ph && (sr.trend6mo || sr.trend1yr || sr.trend3yr || sr.peakPrice || sr.floorPrice) && (
            <GlassCard borderLeft="3px solid rgba(245,158,11,0.5)">
              <SectionLabel>Price History</SectionLabel>
              <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.75rem" }}>
                {[
                  { label: "6 Month", value: sr.trend6mo },
                  { label: "1 Year", value: sr.trend1yr },
                  { label: "3 Year", value: sr.trend3yr },
                ].filter(t => t.value).map(t => {
                  const isRising = t.value?.toLowerCase().includes("rising");
                  const isDecline = t.value?.toLowerCase().includes("declin");
                  const arrow = isRising ? "↑" : isDecline ? "↓" : "→";
                  const tColor = isRising ? GREEN : isDecline ? RED : AMBER;
                  const bg = isRising ? "rgba(16,185,129,0.08)" : isDecline ? "rgba(239,68,68,0.08)" : "rgba(245,158,11,0.08)";
                  return (
                    <div key={t.label} style={{ flex: 1, textAlign: "center" as const, padding: "0.5rem 0.4rem", borderRadius: "0.5rem", background: bg, border: `1px solid ${tColor}25` }}>
                      <div style={{ fontSize: "0.55rem", textTransform: "uppercase" as const, color: "var(--text-muted)", marginBottom: "0.15rem" }}>{t.label}</div>
                      <div style={{ fontSize: "1rem", fontWeight: 800, color: tColor }}>{arrow}</div>
                      <div style={{ fontSize: "0.65rem", fontWeight: 600, color: tColor }}>{t.value}</div>
                    </div>
                  );
                })}
              </div>
              <div style={{ display: "flex", gap: "0.75rem", marginBottom: "0.5rem" }}>
                {sr.peakPrice && (
                  <div style={{ flex: 1, fontSize: "0.75rem", color: GREEN }}>📈 Peak: <span style={{ fontWeight: 700 }}>{sr.peakPrice}</span></div>
                )}
                {sr.floorPrice && (
                  <div style={{ flex: 1, fontSize: "0.75rem", color: "var(--text-muted)" }}>📉 Floor: <span style={{ fontWeight: 700 }}>{sr.floorPrice}</span></div>
                )}
              </div>
              {sr.catalystEvents && (
                <div style={{ padding: "0.5rem 0.65rem", borderRadius: "0.4rem", background: "rgba(245,158,11,0.06)", borderLeft: `3px solid ${AMBER}` }}>
                  <div style={{ fontSize: "0.55rem", fontWeight: 700, color: AMBER, textTransform: "uppercase" as const, marginBottom: "0.1rem" }}>Upcoming Catalysts</div>
                  <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", lineHeight: 1.5, margin: 0 }}>{sr.catalystEvents}</p>
                </div>
              )}
            </GlassCard>
          )}

          {/* Card E — Selling Strategy */}
          {(sr.sellingStrategy || sr.listingTitle || sr.buyItNowPrice || sr.strategy) && (
            <GlassCard borderLeft={`3px solid ${TEAL}`}>
              <SectionLabel>Selling Strategy</SectionLabel>
              {/* Listing title with copy */}
              {sr.listingTitle && (
                <div style={{
                  display: "flex", alignItems: "center", gap: "0.65rem",
                  padding: "0.7rem 0.9rem", borderRadius: "0.65rem",
                  background: "rgba(0,188,212,0.05)", border: "1px solid rgba(0,188,212,0.15)",
                  marginBottom: "0.85rem",
                }}>
                  <div style={{ fontSize: "0.5rem", textTransform: "uppercase" as const, letterSpacing: "0.08em", color: TEAL, fontWeight: 700, flexShrink: 0 }}>Listing Title</div>
                  <div style={{ flex: 1, fontSize: "0.82rem", fontWeight: 700, color: "var(--text-primary)", lineHeight: 1.35 }}>{sr.listingTitle}</div>
                  <CopyButton text={sr.listingTitle} />
                </div>
              )}
              {/* Strategy insight + BIN price */}
              <div style={{ display: "grid", gridTemplateColumns: sr.buyItNowPrice ? "1fr auto" : "1fr", gap: "1rem", alignItems: "start", marginBottom: "0.75rem" }}>
                {typeof sr.sellingStrategy === "string" && sr.sellingStrategy && (
                  <div style={{
                    padding: "0.7rem 0.85rem", borderRadius: "0.55rem",
                    background: "var(--ghost-bg)", borderLeft: `3px solid ${TEAL}`,
                  }}>
                    <p style={{ fontSize: "0.78rem", color: "var(--text-primary)", lineHeight: 1.55, margin: 0, fontWeight: 500 }}>{sr.sellingStrategy}</p>
                  </div>
                )}
                {sr.buyItNowPrice && (
                  <div style={{
                    padding: "0.65rem 1rem", borderRadius: "0.65rem",
                    background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.18)",
                    textAlign: "center" as const, flexShrink: 0,
                  }}>
                    <div style={{ fontSize: "0.5rem", textTransform: "uppercase" as const, letterSpacing: "0.1em", color: "var(--text-muted)", marginBottom: "0.2rem", fontWeight: 600 }}>Suggested BIN</div>
                    <div style={{ fontSize: "1.3rem", fontWeight: 800, color: GREEN }}>{_fp(sr.buyItNowPrice)}</div>
                  </div>
                )}
              </div>
              {/* Strategy details grid */}
              {sr.strategy && typeof sr.strategy === "object" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  {/* Venue + Timing + Format row */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: "0.5rem" }}>
                    {sr.strategy.best_venue && !sr.bestPlatform && (
                      <div style={{ padding: "0.5rem 0.65rem", borderRadius: "0.5rem", background: "var(--ghost-bg)" }}>
                        <div style={{ fontSize: "0.5rem", textTransform: "uppercase" as const, letterSpacing: "0.08em", color: "var(--text-muted)", marginBottom: "0.15rem", fontWeight: 600 }}>Best Venue</div>
                        <div style={{ fontSize: "0.82rem", fontWeight: 700, color: TEAL }}>{sr.strategy.best_venue}</div>
                      </div>
                    )}
                    {sr.strategy.timing && (
                      <div style={{ padding: "0.5rem 0.65rem", borderRadius: "0.5rem", background: "var(--ghost-bg)" }}>
                        <div style={{ fontSize: "0.5rem", textTransform: "uppercase" as const, letterSpacing: "0.08em", color: "var(--text-muted)", marginBottom: "0.15rem", fontWeight: 600 }}>Timing</div>
                        <div style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--text-primary)" }}>{sr.strategy.timing}</div>
                      </div>
                    )}
                    {sr.strategy.auction_vs_fixed && (
                      <div style={{ padding: "0.5rem 0.65rem", borderRadius: "0.5rem", background: "var(--ghost-bg)" }}>
                        <div style={{ fontSize: "0.5rem", textTransform: "uppercase" as const, letterSpacing: "0.08em", color: "var(--text-muted)", marginBottom: "0.15rem", fontWeight: 600 }}>Format</div>
                        <div style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--text-primary)" }}>{sr.strategy.auction_vs_fixed}</div>
                      </div>
                    )}
                  </div>
                  {/* Listing tips */}
                  {Array.isArray(sr.strategy.listing_tips) && sr.strategy.listing_tips.length > 0 && (
                    <div style={{ padding: "0.65rem 0.85rem", borderRadius: "0.55rem", background: "var(--ghost-bg)" }}>
                      <div style={{ fontSize: "0.5rem", textTransform: "uppercase" as const, letterSpacing: "0.1em", color: "var(--text-muted)", marginBottom: "0.4rem", fontWeight: 600 }}>Listing Tips</div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
                        {sr.strategy.listing_tips.slice(0, 4).map((tip: string, i: number) => (
                          <div key={i} style={{ display: "flex", gap: "0.4rem", alignItems: "flex-start" }}>
                            <span style={{ fontSize: "0.65rem", fontWeight: 700, color: TEAL, flexShrink: 0, marginTop: "0.05rem" }}>{i + 1}.</span>
                            <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)", lineHeight: 1.45 }}>{tip}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </GlassCard>
          )}

          {/* Card F — Rarity & Population */}
          {(sr.rarity || sr.printRun || sr.populationNote || sr.notableVariations || sr.authenticationNotes) && (
            <GlassCard borderLeft="3px solid rgba(139,92,246,0.5)">
              <SectionLabel>Rarity & Population</SectionLabel>
              {/* Rarity hero strip */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "0.65rem", marginBottom: "0.85rem" }}>
                {sr.rarity && (() => {
                  const isUltra = sr.rarity === "Ultra Rare" || sr.rarity === "Very Rare";
                  const isRare = sr.rarity === "Rare";
                  const rc = isUltra ? RED : isRare ? AMBER : PURPLE;
                  return (
                    <div style={{
                      padding: "0.65rem 0.75rem", borderRadius: "0.65rem",
                      background: `${rc}0a`, border: `1px solid ${rc}22`,
                      textAlign: "center" as const,
                    }}>
                      <div style={{ fontSize: "0.5rem", textTransform: "uppercase" as const, letterSpacing: "0.1em", color: "var(--text-muted)", marginBottom: "0.3rem", fontWeight: 600 }}>Rarity</div>
                      <div style={{ fontSize: "1rem", fontWeight: 800, color: rc }}>{sr.rarity}</div>
                    </div>
                  );
                })()}
                {sr.printRun && (
                  <div style={{
                    padding: "0.65rem 0.75rem", borderRadius: "0.65rem",
                    background: "var(--ghost-bg)", border: "1px solid var(--border-default)",
                    textAlign: "center" as const,
                  }}>
                    <div style={{ fontSize: "0.5rem", textTransform: "uppercase" as const, letterSpacing: "0.1em", color: "var(--text-muted)", marginBottom: "0.3rem", fontWeight: 600 }}>Print Run</div>
                    <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-primary)" }}>{sr.printRun}</div>
                  </div>
                )}
              </div>
              {/* Detail rows */}
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {sr.populationNote && (
                  <div style={{
                    padding: "0.6rem 0.75rem", borderRadius: "0.5rem",
                    background: "var(--ghost-bg)", borderLeft: `3px solid ${PURPLE}`,
                  }}>
                    <div style={{ fontSize: "0.5rem", textTransform: "uppercase" as const, letterSpacing: "0.08em", color: "var(--text-muted)", marginBottom: "0.2rem", fontWeight: 600 }}>Population Data</div>
                    <div style={{ fontSize: "0.78rem", color: "var(--text-primary)", lineHeight: 1.5, fontWeight: 500 }}>{sr.populationNote}</div>
                  </div>
                )}
                {sr.notableVariations && (
                  <div style={{
                    padding: "0.6rem 0.75rem", borderRadius: "0.5rem",
                    background: "rgba(139,92,246,0.04)", borderLeft: `3px solid ${AMBER}`,
                  }}>
                    <div style={{ fontSize: "0.5rem", textTransform: "uppercase" as const, letterSpacing: "0.08em", color: "var(--text-muted)", marginBottom: "0.2rem", fontWeight: 600 }}>Notable Variations</div>
                    <div style={{ fontSize: "0.78rem", color: "var(--text-primary)", lineHeight: 1.5, fontWeight: 500 }}>{sr.notableVariations}</div>
                  </div>
                )}
                {sr.authenticationNotes && (
                  <div style={{
                    padding: "0.6rem 0.75rem", borderRadius: "0.5rem",
                    background: "rgba(0,188,212,0.04)", borderLeft: `3px solid ${TEAL}`,
                  }}>
                    <div style={{ fontSize: "0.5rem", textTransform: "uppercase" as const, letterSpacing: "0.08em", color: "var(--text-muted)", marginBottom: "0.2rem", fontWeight: 600 }}>Authentication</div>
                    <div style={{ fontSize: "0.78rem", color: "var(--text-primary)", lineHeight: 1.5, fontWeight: 500 }}>{sr.authenticationNotes}</div>
                  </div>
                )}
              </div>
            </GlassCard>
          )}

          {/* Card G — Collector Notes / Insider Knowledge */}
          {(sr.insiderKnowledge || sr.communitySentiment || sr.investmentVerdict || sr.summary) && (
            <GlassCard
              borderColor="rgba(139,92,246,0.3)"
              style={{
                background: "linear-gradient(135deg, rgba(139,92,246,0.06), rgba(109,40,217,0.03))",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.65rem" }}>
                <SectionLabel>Collector Intelligence</SectionLabel>
                {sr.communitySentiment && <Badge bg="rgba(139,92,246,0.1)" color={PURPLE_LIGHT}>{sr.communitySentiment}</Badge>}
                {sr.investmentVerdict && (
                  <Badge
                    bg={String(sr.investmentVerdict).toLowerCase().includes("high") || String(sr.investmentVerdict).toLowerCase().includes("hold") ? "rgba(16,185,129,0.12)" : "rgba(245,158,11,0.1)"}
                    color={String(sr.investmentVerdict).toLowerCase().includes("high") || String(sr.investmentVerdict).toLowerCase().includes("hold") ? GREEN : AMBER}
                  >
                    {sr.investmentVerdict}
                  </Badge>
                )}
              </div>
              {sr.insiderKnowledge && (
                <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)", lineHeight: 1.6, margin: "0 0 0.65rem 0" }}>
                  {sr.insiderKnowledge}
                </p>
              )}
              {/* Investment targets */}
              {(sr.price1yr || sr.price5yr) && (
                <div style={{ display: "flex", gap: "1rem", marginBottom: "0.5rem", flexWrap: "wrap" }}>
                  {sr.price1yr && <span style={{ fontSize: "0.72rem", color: "var(--text-secondary)" }}>1yr target: <strong style={{ color: GREEN }}>{typeof sr.price1yr === "number" ? _fp(sr.price1yr) : sr.price1yr}</strong></span>}
                  {sr.price5yr && <span style={{ fontSize: "0.72rem", color: "var(--text-secondary)" }}>5yr target: <strong style={{ color: PURPLE }}>{typeof sr.price5yr === "number" ? _fp(sr.price5yr) : sr.price5yr}</strong></span>}
                </div>
              )}
              {sr.catalysts && <div style={{ fontSize: "0.68rem", color: "var(--text-muted)", marginBottom: "0.3rem" }}>Catalysts: {typeof sr.catalysts === "string" ? sr.catalysts : Array.isArray(sr.catalysts) ? sr.catalysts.join(", ") : JSON.stringify(sr.catalysts)}</div>}
              {sr.risks && <div style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>Risks: {typeof sr.risks === "string" ? sr.risks : Array.isArray(sr.risks) ? sr.risks.join(", ") : JSON.stringify(sr.risks)}</div>}
              {/* Summary */}
              {sr.summary && (
                <div style={{
                  marginTop: "0.65rem", padding: "0.75rem 0.85rem",
                  background: "rgba(139,92,246,0.06)", borderLeft: `3px solid rgba(139,92,246,0.4)`,
                  borderRadius: "0 10px 10px 0",
                }}>
                  <div style={{ fontSize: "0.55rem", textTransform: "uppercase", letterSpacing: "0.1em", color: PURPLE, fontWeight: 700, marginBottom: "0.25rem" }}>Expert Summary</div>
                  <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)", lineHeight: 1.65, margin: 0 }}>{sr.summary}</p>
                </div>
              )}
            </GlassCard>
          )}

          {/* Old sections: historical context, condition deep dive, collection context */}
          {sr.hist && (
            <GlassCard>
              <SectionLabel>Historical Context</SectionLabel>
              {[
                { label: "Significance", value: sr.hist.significance },
                { label: "Production Info", value: sr.hist.production_info },
                { label: "Notable Sales", value: sr.hist.notable_sales },
                { label: "Market History", value: sr.hist.market_history },
              ].filter(h => h.value).map(h => (
                <div key={h.label} style={{ marginBottom: "0.65rem" }}>
                  <div style={{ fontSize: "0.55rem", fontWeight: 700, color: PURPLE, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.15rem" }}>{h.label}</div>
                  <p style={{ fontSize: "0.78rem", color: "var(--text-secondary)", lineHeight: 1.55, margin: 0 }}>{h.value}</p>
                </div>
              ))}
            </GlassCard>
          )}

          {sr.cond && (
            <GlassCard>
              <SectionLabel>Condition Deep Dive</SectionLabel>
              {sr.cond.overall_assessment && (
                <p style={{ fontSize: "0.78rem", color: "var(--text-secondary)", lineHeight: 1.55, margin: "0 0 0.65rem 0" }}>{sr.cond.overall_assessment}</p>
              )}
              <div className="bot-3col-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.4rem" }}>
                {[
                  { label: "Centering", value: sr.cond.centering },
                  { label: "Corners", value: sr.cond.corners },
                  { label: "Edges", value: sr.cond.edges },
                  { label: "Surface", value: sr.cond.surface },
                  { label: "Completeness", value: sr.cond.completeness },
                  { label: "Storage", value: sr.cond.storage_history },
                ].filter(d => d.value).map(d => (
                  <div key={d.label} style={{ background: "var(--bg-card)", borderRadius: "8px", padding: "0.45rem 0.6rem", border: "1px solid var(--border-default)" }}>
                    <div style={{ fontSize: "0.55rem", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)" }}>{d.label}</div>
                    <div style={{ fontSize: "0.72rem", fontWeight: 600, color: "var(--text-primary)", marginTop: "0.1rem" }}>{typeof d.value === "string" && d.value.length > 60 ? d.value.slice(0, 60) + "..." : d.value}</div>
                  </div>
                ))}
              </div>
            </GlassCard>
          )}

          {/* Collection Context — new CMD-COL-A fields with old fallback */}
          {(sr.setName || sr.setTotal || sr.cardNumber || sr.isKeyCard || sr.collectionTag || sr.collection) && (
            <GlassCard borderLeft="3px solid rgba(139,92,246,0.4)">
              <SectionLabel>Collection Context</SectionLabel>
              {(sr.setName || sr.setTotal || sr.cardNumber || sr.isKeyCard) ? (
                <>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap", marginBottom: "0.5rem" }}>
                    {sr.setName && <span style={{ fontSize: "0.88rem", fontWeight: 700, color: "var(--text-primary)" }}>{sr.setName}</span>}
                    {sr.isKeyCard && <Badge bg="rgba(245,158,11,0.15)" color={AMBER} border={`1px solid ${AMBER}40`}>⭐ KEY CARD</Badge>}
                    {sr.collectionTag && <Badge bg="rgba(139,92,246,0.08)" color={PURPLE_LIGHT}>{sr.collectionTag}</Badge>}
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", marginBottom: "0.5rem" }}>
                    {[
                      { label: "Card Number", value: sr.cardNumber },
                      { label: "Set Size", value: sr.setTotal ? `${sr.setTotal} cards` : null },
                      { label: "Key Reason", value: sr.isKeyCard ? sr.keyCardReason : null },
                    ].filter(d => d.value).map(d => (
                      <div key={d.label} style={{ padding: "0.35rem 0.5rem", background: "var(--bg-card)", border: "1px solid var(--border-default)", borderRadius: "0.4rem" }}>
                        <div style={{ fontSize: "0.55rem", textTransform: "uppercase" as const, letterSpacing: "0.06em", color: "var(--text-muted)" }}>{d.label}</div>
                        <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-primary)" }}>{d.value}</div>
                      </div>
                    ))}
                  </div>
                  {sr.setCompletionHint && (
                    <div style={{ padding: "0.45rem 0.6rem", borderRadius: "0.4rem", background: "rgba(139,92,246,0.04)", borderLeft: `3px solid ${PURPLE}40` }}>
                      <div style={{ fontSize: "0.55rem", fontWeight: 700, color: PURPLE, textTransform: "uppercase" as const, marginBottom: "0.1rem" }}>Set Completion Tip</div>
                      <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", lineHeight: 1.5, margin: 0 }}>{sr.setCompletionHint}</p>
                    </div>
                  )}
                </>
              ) : sr.collection ? (
                <>
                  {[
                    { label: "Set Completion", value: sr.collection.set_completion },
                    { label: "Key Card Status", value: sr.collection.key_card_status },
                    { label: "Investment Potential", value: sr.collection.investment_potential },
                  ].filter(d => d.value).map(d => (
                    <div key={d.label} style={{ marginBottom: "0.6rem" }}>
                      <div style={{ fontSize: "0.55rem", fontWeight: 700, color: PURPLE, textTransform: "uppercase" as const, letterSpacing: "0.08em", marginBottom: "0.15rem" }}>{d.label}</div>
                      <p style={{ fontSize: "0.78rem", color: "var(--text-secondary)", lineHeight: 1.55, margin: 0 }}>{d.value}</p>
                    </div>
                  ))}
                  {Array.isArray(sr.collection.related_items) && sr.collection.related_items.length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap" as const, gap: "0.25rem" }}>
                      {sr.collection.related_items.map((ri: string, i: number) => (
                        <Badge key={i} bg="rgba(139,92,246,0.08)" color={PURPLE_LIGHT}>{ri}</Badge>
                      ))}
                    </div>
                  )}
                </>
              ) : null}
            </GlassCard>
          )}
        </>
      )}

      {/* ═══ 4.5 — PROFESSIONAL REPORT ═══ */}
      {sr && selected && (
        <div style={{ marginTop: "0.75rem" }}>
          <button onClick={() => setReportOpen(!reportOpen)} style={{
            width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "0.65rem 1rem", borderRadius: "0.65rem",
            background: "transparent", border: `2px solid ${PURPLE}`,
            color: PURPLE, fontWeight: 700, fontSize: "0.82rem", cursor: "pointer", minHeight: "44px",
          }}>
            <span>📋 Professional Collectibles Assessment</span>
            <span style={{ fontSize: "0.75rem" }}>{reportOpen ? "▴" : "▾"}</span>
          </button>
          {reportOpen && (
            <div style={{ marginTop: "0.75rem", border: `2px solid ${PURPLE}`, borderRadius: "1rem", padding: "1.5rem", background: "var(--bg-card)" }}>
              {/* Header */}
              <div style={{ textAlign: "center" as const, marginBottom: "1rem", paddingBottom: "0.75rem", borderBottom: `1px dashed rgba(139,92,246,0.3)` }}>
                <div style={{ fontSize: "0.6rem", fontWeight: 700, color: PURPLE, letterSpacing: "0.2em", textTransform: "uppercase" as const }}>═══ LegacyLoop Collectibles Assessment Report ═══</div>
                <div style={{ fontSize: "0.68rem", color: "var(--text-muted)", marginTop: "0.35rem" }}>
                  Date: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })} · Item: {selected.title} · Report ID: {selectedId?.slice(0, 8)}
                </div>
              </div>

              {/* § Item Identification */}
              <div style={{ marginBottom: "0.75rem", paddingBottom: "0.75rem", borderBottom: `1px dashed rgba(139,92,246,0.3)` }}>
                <div style={{ fontSize: "0.6rem", fontWeight: 700, color: PURPLE, letterSpacing: "0.12em", textTransform: "uppercase" as const, marginBottom: "0.35rem" }}>§ Item Identification</div>
                {[
                  { l: "Item", v: sr.itemName }, { l: "Year", v: sr.year }, { l: "Series", v: sr.brandSeries },
                  { l: "Edition", v: sr.editionVariation }, { l: "Category", v: sr.category }, { l: "Rarity", v: sr.rarity },
                ].filter(r => r.v).map(r => (
                  <div key={r.l} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", padding: "0.1rem 0" }}>
                    <span style={{ color: "var(--text-muted)" }}>{r.l}</span>
                    <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>{r.v}</span>
                  </div>
                ))}
              </div>

              {/* § Grading Assessment */}
              {(sr.vgPsaGrade || sr.psaGrade || sr.vgBgsGrade) && (
                <div style={{ marginBottom: "0.75rem", paddingBottom: "0.75rem", borderBottom: `1px dashed rgba(139,92,246,0.3)` }}>
                  <div style={{ fontSize: "0.6rem", fontWeight: 700, color: PURPLE, letterSpacing: "0.12em", textTransform: "uppercase" as const, marginBottom: "0.35rem" }}>§ Grading Assessment</div>
                  {[
                    { l: "PSA Grade", v: sr.vgPsaGrade || sr.psaGrade },
                    { l: "BGS Grade", v: sr.vgBgsGrade },
                    { l: "Confidence", v: sr.vgGradeConfidence != null ? `${Math.round(Number(sr.vgGradeConfidence) * (Number(sr.vgGradeConfidence) <= 1 ? 100 : 1))}%` : null },
                    { l: "Corners", v: sr.vgCorners }, { l: "Edges", v: sr.vgEdges },
                    { l: "Surface", v: sr.vgSurface }, { l: "Centering", v: sr.vgCentering },
                    { l: "Recommendation", v: sr.gradingRec },
                  ].filter(r => r.v).map(r => (
                    <div key={r.l} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", padding: "0.1rem 0" }}>
                      <span style={{ color: "var(--text-muted)" }}>{r.l}</span>
                      <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>{r.v}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* § Valuation */}
              {(sr.rawLow != null || sr.rawHigh != null) && (
                <div style={{ marginBottom: "0.75rem", paddingBottom: "0.75rem", borderBottom: `1px dashed rgba(139,92,246,0.3)` }}>
                  <div style={{ fontSize: "0.6rem", fontWeight: 700, color: PURPLE, letterSpacing: "0.12em", textTransform: "uppercase" as const, marginBottom: "0.35rem" }}>§ Valuation</div>
                  <div style={{ fontSize: "0.82rem", color: "var(--text-primary)", fontWeight: 600 }}>Raw Value: {_fp(sr.rawLow)} – {_fp(sr.rawHigh)}{sr.rawMid ? ` (mid: ${_fp(sr.rawMid)})` : ""}</div>
                  {(sr.psa5 || sr.psa6 || sr.psa7 || sr.psa8 || sr.psa9 || sr.psa10) && (
                    <div style={{ fontSize: "0.72rem", color: "var(--text-secondary)", marginTop: "0.2rem" }}>
                      PSA Ladder: {[{ g: "5", v: sr.psa5 }, { g: "6", v: sr.psa6 }, { g: "7", v: sr.psa7 }, { g: "8", v: sr.psa8 }, { g: "9", v: sr.psa9 }, { g: "10", v: sr.psa10 }].filter(x => x.v != null).map(x => `PSA ${x.g}: ${_fp(x.v)}`).join(", ")}
                    </div>
                  )}
                  {sr.valueReasoning && <p style={{ fontSize: "0.72rem", color: "var(--text-secondary)", marginTop: "0.15rem" }}>{sr.valueReasoning}</p>}
                  {sr.populationNote && <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "0.1rem" }}>Population: {sr.populationNote}</div>}
                </div>
              )}

              {/* § Market Intelligence */}
              {(sr.bestPlatform || sr.demandTrend) && (
                <div style={{ marginBottom: "0.75rem", paddingBottom: "0.75rem", borderBottom: `1px dashed rgba(139,92,246,0.3)` }}>
                  <div style={{ fontSize: "0.6rem", fontWeight: 700, color: PURPLE, letterSpacing: "0.12em", textTransform: "uppercase" as const, marginBottom: "0.35rem" }}>§ Market Intelligence</div>
                  {[
                    { l: "Best Platform", v: sr.bestPlatform }, { l: "Demand Trend", v: sr.demandTrend },
                    { l: "Demand Reasoning", v: sr.demandReasoning }, { l: "Selling Strategy", v: sr.sellingStrategy },
                    { l: "Listing Title", v: sr.listingTitle },
                  ].filter(r => r.v).map(r => (
                    <div key={r.l} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", padding: "0.1rem 0" }}>
                      <span style={{ color: "var(--text-muted)" }}>{r.l}</span>
                      <span style={{ color: "var(--text-primary)", fontWeight: 600, maxWidth: "60%", textAlign: "right" as const }}>{typeof r.v === "string" && r.v.length > 60 ? r.v.slice(0, 60) + "..." : r.v}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* § Collection Context */}
              {(sr.setName || sr.cardNumber) && (
                <div style={{ marginBottom: "0.75rem", paddingBottom: "0.75rem", borderBottom: `1px dashed rgba(139,92,246,0.3)` }}>
                  <div style={{ fontSize: "0.6rem", fontWeight: 700, color: PURPLE, letterSpacing: "0.12em", textTransform: "uppercase" as const, marginBottom: "0.35rem" }}>§ Collection Context</div>
                  {[
                    { l: "Set", v: sr.setName },
                    { l: "Card Number", v: sr.cardNumber && sr.setTotal ? `${sr.cardNumber} of ${sr.setTotal}` : sr.cardNumber },
                    { l: "Key Card", v: sr.isKeyCard ? `Yes — ${sr.keyCardReason || "Key item in set"}` : sr.isKeyCard === false ? "No" : null },
                    { l: "Completion Tip", v: sr.setCompletionHint },
                  ].filter(r => r.v).map(r => (
                    <div key={r.l} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", padding: "0.1rem 0" }}>
                      <span style={{ color: "var(--text-muted)" }}>{r.l}</span>
                      <span style={{ color: "var(--text-primary)", fontWeight: 600, maxWidth: "60%", textAlign: "right" as const }}>{typeof r.v === "string" && r.v.length > 80 ? r.v.slice(0, 80) + "..." : r.v}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* § Price History & Investment */}
              {(sr.trend6mo || sr.trend1yr || sr.price1yr || sr.investmentVerdict) && (
                <div style={{ marginBottom: "0.75rem", paddingBottom: "0.75rem", borderBottom: `1px dashed rgba(139,92,246,0.3)` }}>
                  <div style={{ fontSize: "0.6rem", fontWeight: 700, color: PURPLE, letterSpacing: "0.12em", textTransform: "uppercase" as const, marginBottom: "0.35rem" }}>§ Price History & Investment</div>
                  {[
                    { l: "6mo Trend", v: sr.trend6mo }, { l: "1yr Trend", v: sr.trend1yr }, { l: "3yr Trend", v: sr.trend3yr },
                    { l: "Peak", v: sr.peakPrice }, { l: "Floor", v: sr.floorPrice },
                    { l: "Catalysts", v: sr.catalystEvents },
                    { l: "1yr Projection", v: sr.price1yr }, { l: "5yr Projection", v: sr.price5yr },
                    { l: "Verdict", v: sr.investmentVerdict },
                  ].filter(r => r.v).map(r => (
                    <div key={r.l} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", padding: "0.1rem 0" }}>
                      <span style={{ color: "var(--text-muted)" }}>{r.l}</span>
                      <span style={{ color: "var(--text-primary)", fontWeight: 600, maxWidth: "60%", textAlign: "right" as const }}>{typeof r.v === "string" && r.v.length > 60 ? r.v.slice(0, 60) + "..." : r.v}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* § Expert Summary */}
              {sr.summary && (
                <div style={{ marginBottom: "0.75rem" }}>
                  <div style={{ fontSize: "0.6rem", fontWeight: 700, color: PURPLE, letterSpacing: "0.12em", textTransform: "uppercase" as const, marginBottom: "0.35rem" }}>§ Expert Summary</div>
                  <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)", lineHeight: 1.65, margin: 0 }}>{sr.summary}</p>
                </div>
              )}

              {/* Disclaimer */}
              <div style={{ padding: "0.75rem", background: "rgba(139,92,246,0.04)", borderRadius: "0.5rem", fontSize: "0.68rem", color: "var(--text-muted)", fontStyle: "italic" as const, lineHeight: 1.5 }}>
                ⚠️ This report is generated by LegacyLoop AI and is not a substitute for certified professional grading or authentication. Professional submission recommended for items valued over $500.
                <div style={{ marginTop: "0.3rem", fontStyle: "normal" as const, fontSize: "0.6rem" }}>Report ID: {selectedId?.slice(0, 8)} · Generated by LegacyLoop.com</div>
              </div>

              {/* Action buttons */}
              <div style={{ display: "flex", gap: "0.75rem", marginTop: "1rem" }}>
                <button onClick={() => window.print()} style={{
                  flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "0.3rem",
                  padding: "0.5rem 1rem", borderRadius: "0.75rem", minHeight: "44px",
                  background: `linear-gradient(135deg, ${PURPLE}, #6d28d9)`, color: "#fff",
                  fontWeight: 700, fontSize: "0.82rem", border: "none", cursor: "pointer",
                }}>
                  🖨️ Print Report
                </button>
                <button onClick={() => {
                  const lines: string[] = [
                    "═══ LEGACYLOOP COLLECTIBLES ASSESSMENT REPORT ═══",
                    `Date: ${new Date().toLocaleDateString()}`,
                    `Item: ${selected.title}`,
                    `Report ID: ${selectedId?.slice(0, 8)}`,
                    "",
                    "§ ITEM IDENTIFICATION",
                  ];
                  if (sr.itemName) lines.push(`Item: ${sr.itemName}`);
                  if (sr.year) lines.push(`Year: ${sr.year}`);
                  if (sr.brandSeries) lines.push(`Series: ${sr.brandSeries}`);
                  if (sr.rarity) lines.push(`Rarity: ${sr.rarity}`);
                  lines.push("");
                  if (sr.vgPsaGrade || sr.psaGrade) {
                    lines.push("§ GRADING", `PSA: ${sr.vgPsaGrade || sr.psaGrade}`);
                    if (sr.vgBgsGrade) lines.push(`BGS: ${sr.vgBgsGrade}`);
                    if (sr.gradingRec) lines.push(`Rec: ${sr.gradingRec}`);
                    lines.push("");
                  }
                  if (sr.rawLow != null) {
                    lines.push("§ VALUATION", `Raw: ${_fp(sr.rawLow)} – ${_fp(sr.rawHigh)}`);
                    lines.push("");
                  }
                  if (sr.bestPlatform) lines.push("§ MARKET", `Platform: ${sr.bestPlatform}`, `Demand: ${sr.demandTrend || "—"}`, "");
                  if (sr.investmentVerdict) lines.push("§ INVESTMENT", `Verdict: ${sr.investmentVerdict}`, "");
                  if (sr.summary) lines.push("§ EXPERT SUMMARY", sr.summary, "");
                  lines.push("Generated by LegacyLoop.com");
                  navigator.clipboard.writeText(lines.join("\n"));
                  setReportCopied(true);
                  setTimeout(() => setReportCopied(false), 2000);
                }} style={{
                  flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "0.3rem",
                  padding: "0.5rem 1rem", borderRadius: "0.75rem", minHeight: "44px",
                  background: "transparent", border: `2px solid ${PURPLE}`, color: PURPLE,
                  fontWeight: 700, fontSize: "0.82rem", cursor: "pointer",
                }}>
                  {reportCopied ? "✅ Copied!" : "📋 Copy to Clipboard"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══ 5 — MEGABOT DEEP DIVE ═══ */}
      {selected && result && megaBotLoading && (
        <div style={{
          marginTop: "0.5rem",
          background: "linear-gradient(135deg, rgba(139,92,246,0.06), rgba(109,40,217,0.03))",
          backdropFilter: "blur(12px)",
          border: "1px solid rgba(139,92,246,0.2)", borderRadius: "14px",
          padding: "2.5rem 1rem", textAlign: "center",
        }}>
          <div style={{ width: "2rem", height: "2rem", border: `3px solid rgba(139,92,246,0.2)`, borderTopColor: PURPLE, borderRadius: "50%", animation: "spin 0.7s linear infinite", margin: "0 auto 0.75rem" }} />
          <p style={{ fontSize: "0.88rem", color: PURPLE, fontWeight: 600, margin: "0 0 0.25rem 0" }}>Running CollectiblesBot MegaBot analysis...</p>
          <p style={{ fontSize: "0.72rem", color: "var(--text-muted)", margin: 0 }}>4 AI experts analyzing in parallel — OpenAI, Claude, Gemini, Grok</p>
        </div>
      )}

      {selected && result && !megaBotLoading && !megaBotData && (
        <GlassCard borderColor="rgba(139,92,246,0.2)" style={{
          background: "linear-gradient(135deg, rgba(139,92,246,0.04), rgba(109,40,217,0.02))",
          textAlign: "center", padding: "2rem 1.5rem",
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem", marginBottom: "0.75rem" }}>
            <span style={{ fontSize: "1.1rem" }}>⚡</span>
            <span style={{ fontSize: "0.78rem", fontWeight: 700, color: PURPLE, textTransform: "uppercase", letterSpacing: "0.06em" }}>MegaBot Collectibles Deep Dive</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", maxWidth: 480, margin: "0 auto 1rem", textAlign: "left" as const }}>
            {[
              { key: "openai", desc: "Precise visual grading — corners, edges, surface, centering" },
              { key: "claude", desc: "Historical research — provenance, rarity, cultural significance" },
              { key: "gemini", desc: "Market data — recent sales, price trends, population reports" },
              { key: "grok", desc: "Community pulse — social demand, trending categories, buyer intent" },
            ].map(a => {
              const pm = PROVIDER_META[a.key] || { icon: "🤖", label: a.key, color: "#888", specialty: "" };
              return (
                <div key={a.key} style={{ padding: "0.65rem", borderRadius: "10px", background: "var(--bg-card)", border: `1px solid ${pm.color}20` }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.3rem", marginBottom: "0.25rem" }}>
                    <span style={{ fontSize: "0.85rem" }}>{pm.icon}</span>
                    <span style={{ fontSize: "0.75rem", fontWeight: 700, color: pm.color }}>{pm.label}</span>
                  </div>
                  <div style={{ fontSize: "0.68rem", color: "var(--text-secondary)", lineHeight: 1.4 }}>{a.desc}</div>
                </div>
              );
            })}
          </div>
          <p style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontStyle: "italic" as const, maxWidth: 420, margin: "0 auto 1rem", lineHeight: 1.4 }}>
            All 4 agents analyze independently, then consensus is calculated.
          </p>
          <button onClick={runMegaBot} style={{
            padding: "0.65rem 1.5rem", fontSize: "0.85rem", borderRadius: "12px", fontWeight: 700,
            background: "linear-gradient(135deg, rgba(139,92,246,0.2), rgba(109,40,217,0.15))",
            border: "1px solid rgba(139,92,246,0.4)", color: PURPLE, cursor: "pointer",
            boxShadow: "0 4px 16px rgba(139,92,246,0.15)",
          }}>
            ⚡ Run MegaBot Analysis — 5 credits
          </button>
        </GlassCard>
      )}

      {selected && result && !megaBotLoading && megaBotData && (() => {
        const providers: any[] = megaBotData.providers || [];
        const successful = providers.filter((p: any) => !p.error);
        const failed = providers.filter((p: any) => p.error);
        const agreeRaw = megaBotData.agreementScore || megaBotData.agreement || 0.85;
        const agree = Math.round(agreeRaw > 1 ? agreeRaw : agreeRaw * 100);
        const allAgents = successful.map((p: any) => ({ ...extractMegaAgent(p), provider: p.provider, durationMs: p.durationMs || p.responseTime }));

        // Consensus values (average across agents)
        const rawMids = allAgents.map(a => a.rawMid).filter((v): v is number => v != null);
        const avgRawMid = rawMids.length ? Math.round(rawMids.reduce((a, b) => a + b, 0) / rawMids.length) : null;
        const consensusGrade = allAgents.find(a => a.psaGrade)?.psaGrade ?? null;
        const consensusVerdict = allAgents.find(a => a.investmentVerdict)?.investmentVerdict ?? null;
        const consensusPlatform = allAgents.find(a => a.bestPlatform)?.bestPlatform ?? null;

        return (
          <div style={{
            marginTop: "0.5rem",
            background: "linear-gradient(135deg, rgba(139,92,246,0.06), rgba(109,40,217,0.03))",
            backdropFilter: "blur(12px)",
            border: "1px solid rgba(139,92,246,0.25)", borderRadius: "14px",
            padding: "1.5rem",
          }}>
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.65rem", marginBottom: "0.75rem" }}>
              <span style={{ fontSize: "1.2rem" }}>⚡</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "0.82rem", fontWeight: 800, color: PURPLE, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  MegaBot Deep Dive — {successful.length} AI Experts
                </div>
              </div>
              <div style={{
                padding: "0.25rem 0.65rem", borderRadius: 99,
                background: agree >= 75 ? "rgba(16,185,129,0.15)" : "rgba(245,158,11,0.15)",
                color: agree >= 75 ? GREEN : AMBER,
                fontSize: "0.75rem", fontWeight: 700,
              }}>
                {agree}% Agreement
              </div>
            </div>

            {/* Agreement bar */}
            <div style={{ height: 5, borderRadius: 99, background: "var(--ghost-bg)", overflow: "hidden", marginBottom: "0.75rem" }}>
              <div style={{ height: "100%", width: `${agree}%`, borderRadius: 99, background: agree >= 80 ? GREEN : agree >= 60 ? AMBER : RED, transition: "width 0.5s ease" }} />
            </div>

            {/* Consensus summary strip */}
            <div style={{
              display: "flex", gap: "1rem", flexWrap: "wrap", marginBottom: "1rem",
              padding: "0.65rem 0.85rem", borderRadius: "10px",
              background: "rgba(139,92,246,0.06)", border: "1px solid rgba(139,92,246,0.15)",
            }}>
              {consensusGrade && (
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "0.55rem", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)" }}>Grade</div>
                  <div style={{ fontSize: "1rem", fontWeight: 800, color: PURPLE }}>{consensusGrade}</div>
                </div>
              )}
              {avgRawMid && (
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "0.55rem", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)" }}>Avg Value</div>
                  <div style={{ fontSize: "1rem", fontWeight: 800, color: AMBER }}>{_fp(avgRawMid)}</div>
                </div>
              )}
              {consensusPlatform && (
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "0.55rem", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)" }}>Platform</div>
                  <div style={{ fontSize: "0.82rem", fontWeight: 700, color: TEAL }}>{consensusPlatform}</div>
                </div>
              )}
              {consensusVerdict && (
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "0.55rem", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)" }}>Verdict</div>
                  <div style={{ fontSize: "0.82rem", fontWeight: 700, color: GREEN }}>{consensusVerdict}</div>
                </div>
              )}
            </div>

            {/* Per-agent cards */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginBottom: "1rem" }}>
              {allAgents.map((agent) => {
                const pm = PROVIDER_META[agent.provider] || { icon: "🤖", label: agent.provider, color: "#888", specialty: "" };
                const isExp = megaBotExpanded === agent.provider;
                const timeStr = agent.durationMs ? `${(agent.durationMs / 1000).toFixed(1)}s` : "";

                return (
                  <div key={agent.provider} style={{
                    background: isExp ? "var(--ghost-bg)" : "var(--bg-card)",
                    borderTop: isExp ? `3px solid ${pm.color}` : undefined,
                    border: `1px solid ${isExp ? `${pm.color}40` : "var(--border-default)"}`,
                    borderRadius: "10px", overflow: "hidden",
                  }}>
                    {/* Collapsed header */}
                    <button
                      onClick={() => setMegaBotExpanded(isExp ? null : agent.provider)}
                      style={{ width: "100%", display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.65rem 0.75rem", background: "transparent", border: "none", cursor: "pointer", textAlign: "left" }}
                    >
                      <span style={{ fontSize: "0.9rem" }}>{pm.icon}</span>
                      <span style={{ fontWeight: 700, fontSize: "0.75rem", color: pm.color, minWidth: 55 }}>{pm.label}</span>
                      <span style={{ fontSize: "0.68rem", color: "var(--text-secondary)", flex: 1, overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>
                        {agent.category || "Analyzed"}
                        {agent.rarity ? ` · ${agent.rarity}` : ""}
                        {agent.rawLow && agent.rawHigh ? ` · ${_fp(agent.rawLow)}-${_fp(agent.rawHigh)}` : ""}
                        {agent.psaGrade ? ` · PSA ${agent.psaGrade}` : ""}
                      </span>
                      <span style={{ fontSize: "0.58rem", color: GREEN }}>✅ {timeStr}</span>
                      <span style={{ fontSize: "0.6rem", color: "var(--text-muted)", transform: isExp ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>▾</span>
                    </button>

                    {/* Expanded — 8 rich sections */}
                    {isExp && (
                      <div style={{ padding: "0 0.85rem 0.85rem", borderTop: `1px solid ${pm.color}20` }}>

                        {/* S1 — Visual Grading */}
                        {(agent.psaGrade || agent.corners || agent.centering) && (
                          <div style={{ marginTop: "0.5rem", marginBottom: "0.5rem", padding: "0.6rem", background: "var(--bg-card)", borderRadius: "10px", border: "1px solid var(--border-default)" }}>
                            <div style={{ fontSize: "0.55rem", textTransform: "uppercase", letterSpacing: "0.1em", color: pm.color, fontWeight: 700, marginBottom: "0.4rem" }}>Visual Grade Assessment</div>
                            <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", justifyContent: "center", marginBottom: "0.35rem" }}>
                              {agent.psaGrade && <div style={{ textAlign: "center" }}><div style={{ fontSize: "0.55rem", color: "var(--text-muted)", textTransform: "uppercase" }}>PSA Est.</div><div style={{ fontSize: "1.15rem", fontWeight: 800, color: PURPLE }}>{agent.psaGrade}</div></div>}
                              {agent.bgsGrade && <div style={{ textAlign: "center" }}><div style={{ fontSize: "0.55rem", color: "var(--text-muted)", textTransform: "uppercase" }}>BGS</div><div style={{ fontSize: "1.15rem", fontWeight: 800, color: TEAL }}>{agent.bgsGrade}</div></div>}
                              {agent.gradeConfidence != null && <div style={{ textAlign: "center" }}><div style={{ fontSize: "0.55rem", color: "var(--text-muted)", textTransform: "uppercase" }}>Confidence</div><div style={{ fontSize: "1.15rem", fontWeight: 800, color: "var(--text-primary)" }}>{Math.round(Number(agent.gradeConfidence) * (Number(agent.gradeConfidence) <= 1 ? 100 : 1))}%</div></div>}
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.2rem 0.75rem" }}>
                              {agent.corners && <GridRow label="Corners" value={agent.corners} />}
                              {agent.edges && <GridRow label="Edges" value={agent.edges} />}
                              {agent.surface && <GridRow label="Surface" value={agent.surface} />}
                              {agent.centering && <GridRow label="Centering" value={agent.centering} />}
                            </div>
                            {agent.gradeReasoning && <div style={{ fontSize: "0.62rem", color: "var(--text-secondary)", marginTop: "0.3rem", lineHeight: 1.4 }}>{agent.gradeReasoning}</div>}
                            {agent.gradeSensitivity && <div style={{ fontSize: "0.58rem", color: "var(--text-muted)", marginTop: "0.1rem", fontStyle: "italic" }}>{agent.gradeSensitivity}</div>}
                          </div>
                        )}

                        {/* S2 — Valuation Deep Dive with PSA Ladder */}
                        {(agent.rawLow || agent.psa6) && (
                          <div style={{ marginBottom: "0.5rem", padding: "0.6rem", background: "var(--bg-card)", borderRadius: "10px", border: "1px solid var(--border-default)" }}>
                            <div style={{ fontSize: "0.55rem", textTransform: "uppercase", letterSpacing: "0.1em", color: pm.color, fontWeight: 700, marginBottom: "0.4rem" }}>Valuation Deep Dive</div>
                            {(agent.rawLow || agent.rawHigh) && (
                              <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", justifyContent: "center", marginBottom: "0.35rem" }}>
                                <div style={{ textAlign: "center" }}><div style={{ fontSize: "0.55rem", color: "var(--text-muted)", textTransform: "uppercase" }}>Raw Low</div><div style={{ fontSize: "1rem", fontWeight: 800, color: "var(--text-secondary)" }}>{_fp(agent.rawLow)}</div></div>
                                {agent.rawMid && <div style={{ textAlign: "center" }}><div style={{ fontSize: "0.55rem", color: "var(--text-muted)", textTransform: "uppercase" }}>Raw Mid</div><div style={{ fontSize: "1rem", fontWeight: 800, color: AMBER }}>{_fp(agent.rawMid)}</div></div>}
                                <div style={{ textAlign: "center" }}><div style={{ fontSize: "0.55rem", color: "var(--text-muted)", textTransform: "uppercase" }}>Raw High</div><div style={{ fontSize: "1rem", fontWeight: 800, color: GREEN }}>{_fp(agent.rawHigh)}</div></div>
                              </div>
                            )}
                            {(agent.psa6 || agent.psa7 || agent.psa8 || agent.psa9 || agent.psa10) && (
                              <div style={{ marginTop: "0.25rem" }}>
                                <div style={{ fontSize: "0.55rem", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "0.2rem" }}>PSA Grade Ladder</div>
                                <div style={{ display: "flex", gap: "0.25rem", flexWrap: "wrap" }}>
                                  {[{ g: "6", v: agent.psa6 }, { g: "7", v: agent.psa7 }, { g: "8", v: agent.psa8 }, { g: "9", v: agent.psa9 }, { g: "10", v: agent.psa10 }].filter(x => x.v).map(x => (
                                    <div key={x.g} style={{ textAlign: "center", padding: "0.2rem 0.4rem", borderRadius: "8px", background: x.g === "10" ? "rgba(139,92,246,0.12)" : "var(--bg-card)", border: `1px solid ${x.g === "10" ? "rgba(139,92,246,0.3)" : "var(--border-default)"}`, minWidth: "3rem" }}>
                                      <div style={{ fontSize: "0.55rem", color: "var(--text-muted)" }}>PSA {x.g}</div>
                                      <div style={{ fontSize: "0.72rem", fontWeight: 700, color: x.g === "10" ? PURPLE : "var(--text-primary)" }}>{_fp(x.v)}</div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            {agent.valueReasoning && <div style={{ fontSize: "0.62rem", color: "var(--text-secondary)", marginTop: "0.3rem", lineHeight: 1.4 }}>{agent.valueReasoning}</div>}
                            {agent.recentComps && <div style={{ fontSize: "0.58rem", color: "var(--text-muted)", marginTop: "0.15rem" }}>Comps: {typeof agent.recentComps === "string" ? agent.recentComps : JSON.stringify(agent.recentComps)}</div>}
                            {agent.populationNote && <div style={{ fontSize: "0.58rem", color: "var(--text-muted)", marginTop: "0.1rem" }}>Pop: {agent.populationNote}</div>}
                          </div>
                        )}

                        {/* S3 — Grading ROI */}
                        {(agent.gradingRec || agent.gradingReasoning) && (
                          <div style={{ marginBottom: "0.5rem", padding: "0.6rem", background: "var(--bg-card)", borderRadius: "10px", border: "1px solid var(--border-default)" }}>
                            <div style={{ fontSize: "0.55rem", textTransform: "uppercase", letterSpacing: "0.1em", color: pm.color, fontWeight: 700, marginBottom: "0.3rem" }}>Grading ROI</div>
                            <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", marginBottom: "0.25rem" }}>
                              {agent.gradingRec && (() => { const gs = gradingRecStyle(agent.gradingRec); return <Badge bg={gs.bg} color={gs.color} border={`1px solid ${gs.color}40`}>{agent.gradingRec}</Badge>; })()}
                              {agent.breakEvenGrade && <Badge bg="var(--ghost-bg)" color="var(--text-secondary)">Break-even: PSA {agent.breakEvenGrade}</Badge>}
                              {agent.bestGradingService && <Badge bg="var(--ghost-bg)" color="var(--text-muted)">{agent.bestGradingService}{agent.psaStandardCost ? ` ($${agent.psaStandardCost})` : ""}</Badge>}
                            </div>
                            {agent.gradingReasoning && <div style={{ fontSize: "0.62rem", color: "var(--text-secondary)", lineHeight: 1.4 }}>{agent.gradingReasoning}</div>}
                          </div>
                        )}

                        {/* S4 — Market Intelligence */}
                        {(agent.bestPlatform || agent.sellingStrategy || agent.listingTitle) && (
                          <div style={{ marginBottom: "0.5rem", padding: "0.6rem", background: "linear-gradient(135deg, rgba(139,92,246,0.03), rgba(0,188,212,0.02))", borderRadius: "10px", border: "1px solid rgba(139,92,246,0.1)" }}>
                            <div style={{ fontSize: "0.55rem", textTransform: "uppercase", letterSpacing: "0.1em", color: pm.color, fontWeight: 700, marginBottom: "0.3rem" }}>Market Intelligence</div>
                            {agent.listingTitle && (
                              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.3rem 0.5rem", background: "rgba(0,188,212,0.06)", borderRadius: "8px", border: "1px solid rgba(0,188,212,0.12)", marginBottom: "0.25rem" }}>
                                <span style={{ fontSize: "0.68rem", fontWeight: 700, color: "var(--text-primary)", flex: 1 }}>{agent.listingTitle}</span>
                                <CopyButton text={agent.listingTitle} />
                              </div>
                            )}
                            <div style={{ display: "flex", flexDirection: "column", gap: "0.15rem" }}>
                              {agent.bestPlatform && <div style={{ fontSize: "0.62rem", color: "var(--text-secondary)" }}>Platform: <strong style={{ color: TEAL }}>{agent.bestPlatform}</strong>{agent.platformReasoning ? ` — ${agent.platformReasoning}` : ""}</div>}
                              {agent.buyItNowPrice && <div style={{ fontSize: "0.62rem", color: "var(--text-secondary)" }}>BIN: <strong style={{ color: GREEN }}>{_fp(agent.buyItNowPrice)}</strong></div>}
                              {agent.demandReasoning && <div style={{ fontSize: "0.62rem", color: "var(--text-secondary)" }}>{agent.demandReasoning}</div>}
                              {agent.sellingStrategy && <div style={{ fontSize: "0.62rem", color: "var(--text-muted)", fontStyle: "italic" }}>{agent.sellingStrategy}</div>}
                            </div>
                          </div>
                        )}

                        {/* S5 — Investment Outlook */}
                        {(agent.price1yr || agent.price5yr || agent.catalysts || agent.risks) && (
                          <div style={{ marginBottom: "0.5rem", padding: "0.6rem", background: "var(--bg-card)", borderRadius: "10px", border: "1px solid var(--border-default)" }}>
                            <div style={{ fontSize: "0.55rem", textTransform: "uppercase", letterSpacing: "0.1em", color: pm.color, fontWeight: 700, marginBottom: "0.3rem" }}>Investment Outlook</div>
                            <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginBottom: "0.2rem" }}>
                              {agent.price1yr && <span style={{ fontSize: "0.62rem", color: "var(--text-secondary)" }}>1yr: <strong style={{ color: GREEN }}>{typeof agent.price1yr === "number" ? _fp(agent.price1yr) : agent.price1yr}</strong></span>}
                              {agent.price5yr && <span style={{ fontSize: "0.62rem", color: "var(--text-secondary)" }}>5yr: <strong style={{ color: PURPLE }}>{typeof agent.price5yr === "number" ? _fp(agent.price5yr) : agent.price5yr}</strong></span>}
                              {agent.investmentVerdict && <Badge bg="rgba(16,185,129,0.1)" color={GREEN}>{agent.investmentVerdict}</Badge>}
                            </div>
                            {agent.catalysts && <div style={{ fontSize: "0.62rem", color: "var(--text-secondary)", marginBottom: "0.1rem" }}>Catalysts: {typeof agent.catalysts === "string" ? agent.catalysts : Array.isArray(agent.catalysts) ? agent.catalysts.join(", ") : JSON.stringify(agent.catalysts)}</div>}
                            {agent.risks && <div style={{ fontSize: "0.62rem", color: "var(--text-muted)" }}>Risks: {typeof agent.risks === "string" ? agent.risks : Array.isArray(agent.risks) ? agent.risks.join(", ") : JSON.stringify(agent.risks)}</div>}
                          </div>
                        )}

                        {/* S6 — Insider Intelligence */}
                        {(agent.insiderKnowledge || agent.notableVariations || agent.authenticationNotes) && (
                          <div style={{ marginBottom: "0.5rem", padding: "0.6rem", background: "linear-gradient(135deg, rgba(139,92,246,0.03), rgba(0,188,212,0.02))", borderRadius: "10px", border: "1px solid rgba(139,92,246,0.12)" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.3rem" }}>
                              <span style={{ fontSize: "0.55rem", textTransform: "uppercase", letterSpacing: "0.1em", color: pm.color, fontWeight: 700 }}>Insider Intelligence</span>
                              {agent.communitySentiment && <Badge bg="rgba(139,92,246,0.1)" color={PURPLE_LIGHT}>{agent.communitySentiment}</Badge>}
                            </div>
                            {agent.insiderKnowledge && <div style={{ fontSize: "0.62rem", color: "var(--text-secondary)", lineHeight: 1.4, marginBottom: "0.15rem" }}>{agent.insiderKnowledge}</div>}
                            {agent.notableVariations && <div style={{ fontSize: "0.58rem", color: "var(--text-muted)" }}>Variations: {agent.notableVariations}</div>}
                            {agent.authenticationNotes && <div style={{ fontSize: "0.58rem", color: "var(--text-muted)", marginTop: "0.1rem" }}>Auth: {agent.authenticationNotes}</div>}
                          </div>
                        )}

                        {/* S7 — Expert Summary */}
                        {agent.summary && (
                          <div style={{ padding: "0.5rem 0.6rem", background: `${pm.color}10`, borderRadius: "0 10px 10px 0", borderLeft: `3px solid ${pm.color}60` }}>
                            <div style={{ fontSize: "0.55rem", textTransform: "uppercase", letterSpacing: "0.1em", color: pm.color, fontWeight: 700, marginBottom: "0.15rem" }}>{pm.icon} {pm.label} Summary</div>
                            <p style={{ fontSize: "0.72rem", color: "var(--text-secondary)", margin: 0, lineHeight: 1.45, fontStyle: "italic" }}>
                              &ldquo;{typeof agent.summary === "string" && agent.summary.length > 400 ? agent.summary.slice(0, 400) + "..." : agent.summary}&rdquo;
                            </p>
                          </div>
                        )}

                        <div style={{ fontSize: "0.52rem", color: "var(--text-muted)", fontStyle: "italic", marginTop: "0.4rem" }}>
                          {pm.icon} {pm.label}: {pm.specialty}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Failed agents */}
              {failed.map((p: any) => {
                const pm = PROVIDER_META[p.provider] || { icon: "🤖", label: p.provider, color: "#888", specialty: "" };
                return (
                  <div key={p.provider} style={{
                    display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.4rem 0.6rem", opacity: 0.6,
                    background: "rgba(239,68,68,0.04)", border: "1px solid rgba(239,68,68,0.1)", borderRadius: "8px", fontSize: "0.65rem",
                  }}>
                    <span>{pm.icon}</span>
                    <span style={{ fontWeight: 600, color: pm.color }}>{pm.label}</span>
                    <span style={{ color: RED, flex: 1 }}>{(p.error || "").slice(0, 80)}</span>
                  </div>
                );
              })}
            </div>

            {/* Expert Comparison */}
            {successful.length > 1 && (
              <div style={{ marginBottom: "0.75rem", padding: "0.65rem 0.85rem", background: "var(--bg-card)", borderRadius: "10px", border: "1px solid var(--border-default)" }}>
                <div style={{ fontSize: "0.55rem", textTransform: "uppercase", letterSpacing: "0.1em", color: PURPLE, fontWeight: 700, marginBottom: "0.4rem" }}>Expert Comparison</div>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                  {allAgents.map(agent => {
                    const pm = PROVIDER_META[agent.provider] || { icon: "🤖", label: agent.provider, color: "#888" };
                    return (
                      <div key={agent.provider} style={{ padding: "0.3rem 0.5rem", background: "var(--bg-card)", borderRadius: "8px", border: "1px solid var(--border-default)" }}>
                        <div style={{ fontSize: "0.62rem", fontWeight: 700, color: pm.color, marginBottom: "0.15rem" }}>{pm.icon} {pm.label}</div>
                        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", fontSize: "0.6rem", color: "var(--text-secondary)" }}>
                          {agent.rawLow ? <span>Raw: <strong style={{ color: AMBER }}>{_fp(agent.rawLow)}-{_fp(agent.rawHigh)}</strong></span> : null}
                          {agent.psaGrade && <span>PSA: <strong>{agent.psaGrade}</strong></span>}
                          {agent.gradingRec && (() => { const gs = gradingRecStyle(agent.gradingRec); return <span style={{ color: gs.color }}>{agent.gradingRec}</span>; })()}
                          {agent.bestPlatform && <span>{agent.bestPlatform}</span>}
                          {agent.demandTrend && <span style={{ color: demandColor(agent.demandTrend) }}>{agent.demandTrend}</span>}
                          {agent.investmentVerdict && <span style={{ fontWeight: 600, color: GREEN }}>{agent.investmentVerdict}</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* MegaBot Summary */}
            <div style={{
              background: "rgba(139,92,246,0.06)", borderLeft: `3px solid rgba(139,92,246,0.4)`,
              borderRadius: "0 10px 10px 0", padding: "0.75rem 1rem", marginBottom: "0.75rem",
            }}>
              <div style={{ fontSize: "0.6rem", textTransform: "uppercase", letterSpacing: "0.1em", color: PURPLE, fontWeight: 700, marginBottom: "0.3rem" }}>MegaBot Collectibles Summary</div>
              <p style={{ fontSize: "0.82rem", lineHeight: 1.6, color: "var(--text-secondary)", margin: 0 }}>
                {(() => {
                  const parts: string[] = [];
                  parts.push(`${successful.length} AI collectibles specialists evaluated this item.`);
                  if (agree >= 80) parts.push(`Strong consensus (${agree}%).`);
                  if (avgRawMid) parts.push(`Average raw valuation: ${_fp(avgRawMid)}.`);
                  const grades = allAgents.map(a => a.psaGrade).filter(Boolean);
                  if (grades.length) parts.push(`PSA estimates: ${grades.join(", ")}.`);
                  const recs = allAgents.map(a => a.gradingRec).filter(Boolean);
                  if (recs.length) {
                    const strong = recs.filter((r: any) => String(r).toLowerCase().includes("strong")).length;
                    if (strong >= recs.length / 2) parts.push("Majority recommend grading.");
                  }
                  if (consensusPlatform) parts.push(`Best platform: ${consensusPlatform}.`);
                  if (consensusVerdict) parts.push(`Verdict: ${consensusVerdict}.`);
                  const agentSummary = allAgents.find(a => a.summary)?.summary;
                  if (agentSummary && typeof agentSummary === "string") parts.push(agentSummary.split(/(?<=[.!?])\s+/).slice(0, 2).join(" "));
                  return parts.join(" ");
                })()}
              </p>
            </div>

            {/* Re-run MegaBot */}
            <div style={{ textAlign: "center" }}>
              <button onClick={runMegaBot} style={{
                padding: "0.5rem 1.2rem", fontSize: "0.75rem", borderRadius: "10px", fontWeight: 700,
                background: "rgba(139,92,246,0.12)", border: "1px solid rgba(139,92,246,0.3)",
                color: PURPLE, cursor: "pointer",
              }}>
                Re-Run MegaBot — 3 cr
              </button>
            </div>
          </div>
        );
      })()}

      {/* ═══ LOADING STATE ═══ */}
      {loading && selected && (
        <GlassCard>
          <BotLoadingState botName="CollectiblesBot" />
        </GlassCard>
      )}

      {/* ═══ NO RESULTS PLACEHOLDER ═══ */}
      {!result && selected && !loading && (
        <GlassCard style={{ textAlign: "center", padding: "3rem 1.5rem" }}>
          <div style={{ fontSize: "3rem", marginBottom: "0.75rem", opacity: 0.6 }}>🎴</div>
          <div style={{ fontSize: "1.05rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.5rem" }}>Ready for Collectibles Analysis</div>
          <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", maxWidth: 450, margin: "0 auto", lineHeight: 1.55 }}>
            Run CollectiblesBot to get grading assessment, rarity analysis, valuation with PSA grade ladder, market intelligence, and expert selling strategy.
          </p>
        </GlassCard>
      )}

      {/* ═══ 6 — ACTION FOOTER ═══ */}
      {selectedId && selected && (
        <div data-no-print style={{
          position: "sticky", bottom: 0, zIndex: 100,
          background: "var(--bg-card-solid)", backdropFilter: "blur(20px)",
          borderTop: "1px solid var(--border-default)",
          boxShadow: "0 -2px 12px rgba(0,0,0,0.08)",
          padding: "0.85rem 2rem",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          gap: "1rem",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.65rem", minWidth: 0, flex: 1 }}>
            <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--text-primary)", overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>
              {selected.title}
            </span>
            {cScore && tierStyle && (
              <span style={{
                padding: "0.15rem 0.5rem", borderRadius: 99, fontSize: "0.58rem", fontWeight: 700, flexShrink: 0,
                background: tierStyle.badgeBackground, color: tierStyle.textColor,
              }}>
                {tierStyle.label} {cScore.score}
              </span>
            )}
          </div>
          <div style={{ display: "flex", gap: "0.5rem", flexShrink: 0 }}>
            <button
              onClick={runCollectiblesBot}
              disabled={loading || !selected.hasAnalysis}
              style={{
                padding: "0.45rem 1rem", fontSize: "0.75rem", fontWeight: 700,
                borderRadius: "10px", cursor: loading ? "not-allowed" : "pointer",
                background: loading ? "var(--ghost-bg)" : `linear-gradient(135deg, ${PURPLE}, #6d28d9)`,
                border: "none", color: "#fff",
                boxShadow: loading ? "none" : `0 2px 10px rgba(139,92,246,0.3)`,
              }}
            >
              {loading ? "Analyzing..." : result ? "🔄 Re-Run · 1 cr" : "🎴 Run · 1 cr"}
            </button>
            <button
              onClick={runMegaBot}
              disabled={megaBotLoading}
              style={{
                padding: "0.45rem 1rem", fontSize: "0.75rem", fontWeight: 700,
                borderRadius: "10px", cursor: megaBotLoading ? "not-allowed" : "pointer",
                background: megaBotLoading ? "var(--ghost-bg)" : "linear-gradient(135deg, rgba(139,92,246,0.2), rgba(109,40,217,0.15))",
                border: "1px solid rgba(139,92,246,0.4)", color: PURPLE,
              }}
            >
              {megaBotLoading ? "Running..." : megaBotData ? "🔄 Re-Run MegaBot · 3 cr" : "⚡ MegaBot · 5 cr"}
            </button>
            <Link
              href={`/items/${selectedId}`}
              style={{
                padding: "0.45rem 0.85rem", fontSize: "0.72rem", fontWeight: 600,
                borderRadius: "10px", textDecoration: "none",
                background: "var(--ghost-bg)", border: "1px solid var(--border-default)",
                color: "var(--text-secondary)", display: "flex", alignItems: "center",
              }}
            >
              View Item →
            </Link>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        @keyframes fadeSlideUp {
          0% { opacity: 0; transform: translateY(10px); }
          100% { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
