"use client";

import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import BotItemSelector from "../BotItemSelector";
import { runStandardAnalysis } from "@/lib/agents/runner";

type ItemData = {
  id: string;
  title: string;
  status: string;
  photo: string | null;
  hasAnalysis: boolean;
  aiResult: string | null;
  valuation: { low: number; high: number; confidence: number } | null;
  valuationMid?: number | null;
  valuationRationale?: string | null;
  valuationSource?: string | null;
  antique: { isAntique: boolean; auctionLow: number | null; auctionHigh: number | null } | null;
  isAntique?: boolean;
  auctionLow?: number | null;
  auctionHigh?: number | null;
  antiqueScore?: number | null;
  antiqueMarkers?: string[];
  analysisHistory?: { id: string; type: string; createdAt: string; payload: any }[];
  lastAnalyzedAt?: string | null;
};

function safeJson(s: string | null): any {
  if (!s) return null;
  try { return JSON.parse(s); } catch { return null; }
}

const PROVIDER_META: Record<string, { icon: string; label: string; color: string; specialty: string }> = {
  openai: { icon: "🤖", label: "OpenAI", color: "#10a37f", specialty: "Balanced assessment and precise identification" },
  claude: { icon: "🧠", label: "Claude", color: "#d97706", specialty: "Craftsmanship, history & authentication" },
  gemini: { icon: "🔮", label: "Gemini", color: "#4285f4", specialty: "Market trends & comparable data" },
  grok: { icon: "🌀", label: "Grok (xAI)", color: "#00DC82", specialty: "Social buzz & trending demand" },
};

const _obj = (v: any) => (v && typeof v === "object" && !Array.isArray(v)) ? v : null;

function _normalizeKeys(o: any): any {
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

function extractHighlights(p: any) {
  let d = _normalizeKeys(p.data || {});
  const topKeys = Object.keys(d);
  if (topKeys.length === 1 && _obj(d[topKeys[0]]) && Object.keys(d[topKeys[0]]).length >= 2) d = d[topKeys[0]];
  const id = _obj(d.identification) || d;
  const cond = _obj(d.condition) || _obj(d.condition_assessment) || d;
  // Collect all knowledge wrapper sub-objects to search inside
  const kwSubs: any[] = [d, id];
  for (const w of ["deep_knowledge", "knowledge", "item_knowledge", "deep_dive", "mega_enhancement", "megabot_enhancement", "additional_details", "detailed_analysis"]) {
    const sub = _obj(d[w]);
    if (sub) kwSubs.push(sub);
  }
  const pick = (...vals: any[]) => vals.find(v => v != null && v !== "" && v !== "Unknown" && v !== "unknown" && v !== "N/A") ?? null;
  const pickStr = (...vals: any[]) => { const v = pick(...vals); return typeof v === "string" ? v : null; };
  // Search across all knowledge sub-objects for a string field
  const pickKw = (...keys: string[]) => {
    for (const sub of kwSubs) { for (const k of keys) { if (sub[k] && typeof sub[k] === "string" && sub[k].length > 5) return sub[k]; } }
    return null;
  };
  return {
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
    condOverall: pick(cond.overall_score, cond.condition_score, cond.score, d.condition_score, d.conditionScore, p.conditionScore),
    condCosm: pick(cond.cosmetic_score, cond.condition_cosmetic, d.condition_cosmetic),
    condFunc: pick(cond.functional_score, cond.condition_functional, d.condition_functional),
    condLabel: pickStr(cond.condition_guess, cond.condition_label, d.condition_guess, d.condition_label),
    condDetails: pickStr(cond.condition_details, d.condition_details),
    positiveNotes: cond.positive_notes || d.positive_notes || null,
    visibleIssues: cond.visible_issues || d.visible_issues || null,
    productHistory: pickKw("product_history", "historical_context", "history", "item_history", "history_and_background", "historical_background", "background"),
    makerHistory: pickKw("maker_history", "manufacturer_history", "brand_history", "maker_background", "company_history", "brand_background"),
    construction: pickKw("construction_analysis", "construction_method", "construction", "how_made", "craftsmanship", "build_quality", "materials_analysis"),
    specialFeatures: pickKw("special_features", "unique_features", "standout_features", "what_makes_special", "notable_features", "key_features", "highlights"),
    tipsAndFacts: pickKw("tips_and_facts", "tips_and_tricks", "tips", "usage_tips", "fun_facts", "interesting_facts", "did_you_know"),
    commonIssues: pickKw("common_issues", "known_issues", "problems", "things_to_watch", "potential_issues", "concerns", "watch_for"),
    careInstructions: pickKw("care_instructions", "maintenance", "preservation", "storage_tips", "care_and_maintenance", "upkeep"),
    similarItems: pickKw("similar_items", "comparisons", "alternative_models", "compared_to", "alternatives", "competing_products"),
    collectorInfo: pickKw("collector_info", "collector_interest", "rarity", "desirability", "collector_value", "collectibility", "enthusiast_info"),
    isAntique: d.is_antique || false,
    antiqueAge: pick(d.estimated_age_years),
    antiqueMarkers: d.antique_markers || null,
    isTextOnly: d._grokTextOnly || false,
    summary: pickStr(d.executive_summary, d.summary, d.notes, p.executiveSummary),
    keywords: d.keywords || null,
    bestPlatforms: d.best_platforms || null,
  };
}

function getKeyInsight(p: any): string {
  let d = _normalizeKeys(p.data || {});
  const topKeys = Object.keys(d);
  if (topKeys.length === 1 && _obj(d[topKeys[0]]) && Object.keys(d[topKeys[0]]).length >= 2) d = d[topKeys[0]];
  return d.executive_summary || d.summary || d.notes || d.pricing_rationale || "";
}

function condWord(score: number) { return score >= 8 ? "Excellent" : score >= 6 ? "Good" : score >= 4 ? "Fair" : "Poor"; }

function KnowledgeSection({ icon, title, text }: { icon: string; title: string; text: string }) {
  const display = text.length > 400 ? text.slice(0, 400) + "..." : text;
  return (
    <div style={{
      padding: "0.5rem 0.65rem", background: "var(--bg-card)", borderRadius: "0.5rem",
      border: "1px solid var(--border-default)",
    }}>
      <div style={{ fontSize: "0.65rem", fontWeight: 700, color: "var(--text-secondary)", marginBottom: "0.2rem" }}>{icon} {title}</div>
      <p style={{ fontSize: "0.78rem", color: "var(--text-secondary)", margin: 0, lineHeight: 1.55 }}>{display}</p>
    </div>
  );
}

function GridRow({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div style={{ minWidth: 0 }}>
      <span style={{ fontSize: "0.6rem", color: "var(--text-muted)", textTransform: "uppercase" as const, letterSpacing: "0.03em" }}>{label}: </span>
      <span style={{ fontSize: "0.78rem", color: "var(--text-primary)", fontWeight: bold ? 600 : 400, wordBreak: "break-word" as const }}>{value}</span>
    </div>
  );
}

function AccordionHeader({ id, icon, title, subtitle, isOpen, onToggle, accentColor, badge }: {
  id: string; icon: string; title: string; subtitle?: string;
  isOpen: boolean; onToggle: (id: string) => void; accentColor?: string; badge?: string;
}) {
  return (
    <button onClick={() => onToggle(id)} style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      width: "100%", background: isOpen ? "rgba(0,188,212,0.02)" : "transparent",
      border: "none", borderBottom: isOpen ? "1px solid var(--border-default)" : "1px solid transparent",
      padding: "0.65rem 0.5rem", cursor: "pointer", transition: "all 0.2s ease",
      borderRadius: isOpen ? "0.4rem 0.4rem 0 0" : "0.4rem", minHeight: "40px",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
        <span style={{ fontSize: "1rem" }}>{icon}</span>
        <span style={{ fontSize: "0.65rem", fontWeight: 700, color: accentColor || "var(--text-secondary)", letterSpacing: "0.05em", textTransform: "uppercase" as const }}>{title}</span>
        {badge && <span style={{ fontSize: "0.5rem", fontWeight: 700, padding: "2px 8px", borderRadius: "6px", background: `${accentColor || "#00bcd4"}18`, color: accentColor || "#00bcd4" }}>{badge}</span>}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
        {subtitle && !isOpen && <span style={{ fontSize: "0.55rem", color: "var(--text-muted)", maxWidth: "280px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const, fontWeight: 500 }}>{subtitle}</span>}
        <span style={{ fontSize: "0.55rem", color: "var(--text-muted)", transition: "transform 0.25s ease", transform: isOpen ? "rotate(180deg)" : "rotate(0deg)", display: "inline-flex", alignItems: "center", justifyContent: "center", width: "22px", height: "22px", borderRadius: "50%", background: isOpen ? "rgba(0,188,212,0.08)" : "transparent" }}>▼</span>
      </div>
    </button>
  );
}

export default function AnalyzeBotClient({ items }: { items: ItemData[] }) {
  const searchParams = useSearchParams();
  const itemParam = searchParams.get("item");
  const [selectedId, setSelectedId] = useState<string | null>(
    (itemParam && items.some((i) => i.id === itemParam)) ? itemParam : items[0]?.id ?? null
  );
  const [analyzing, setAnalyzing] = useState(false);
  const [showJson, setShowJson] = useState(false);

  // MegaBot state
  const [megaBotData, setMegaBotData] = useState<any>(null);
  const [megaBotLoading, setMegaBotLoading] = useState(false);
  const [megaBotRunning, setMegaBotRunning] = useState(false);
  const [megaBotStep, setMegaBotStep] = useState(0);
  const [expandedAgent, setExpandedAgent] = useState<string | null>(null);
  const [showAgentJson, setShowAgentJson] = useState<string | null>(null);

  // Accordion state
  const [openSections, setOpenSections] = useState<Set<string>>(new Set(["identification", "condition", "pricing"]));
  const toggleSection = (id: string) => {
    setOpenSections(prev => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });
  };

  const item = items.find((i) => i.id === selectedId);
  const ai = useMemo(() => safeJson(item?.aiResult ?? null), [item?.aiResult]);

  const standardResult = useMemo(() => {
    if (!item || !ai) return null;
    const priceMid = item.valuation ? Math.round((item.valuation.low + item.valuation.high) / 2) : (ai.estimated_value_mid || 55);
    return runStandardAnalysis(item.id, "analyze", { name: ai.item_name || item.title, category: ai.category || "General", priceMid });
  }, [item?.id, ai, item?.valuation]);

  // Fetch MegaBot data on item change
  useEffect(() => {
    if (!selectedId) return;
    setMegaBotData(null);
    setMegaBotLoading(true);
    setExpandedAgent(null);
    fetch(`/api/megabot/${selectedId}`)
      .then(r => r.json())
      .then(d => {
        if (d.results?.analyzebot) {
          setMegaBotData(d.results.analyzebot);
          const firstProvider = d.results.analyzebot.providers?.find((p: any) => !p.error);
          if (firstProvider) setExpandedAgent(firstProvider.provider);
        }
      })
      .catch(() => {})
      .finally(() => setMegaBotLoading(false));
  }, [selectedId]);

  async function runAnalysis() {
    if (!selectedId) return;
    setAnalyzing(true);
    try {
      await fetch(`/api/analyze/${selectedId}`, { method: "POST" });
      window.location.reload();
    } catch { setAnalyzing(false); }
  }

  async function runMegaBot() {
    if (!selectedId) return;
    setMegaBotData(null); // Clear old data so loading state shows (not stale results)
    setMegaBotRunning(true);
    setMegaBotStep(0);
    const t1 = setTimeout(() => setMegaBotStep(1), 5000);
    const t2 = setTimeout(() => setMegaBotStep(2), 15000);
    const t3 = setTimeout(() => setMegaBotStep(3), 30000);
    try {
      const res = await fetch(`/api/megabot/${selectedId}?bot=analyzebot`, { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setMegaBotData(data);
        const firstP = data.providers?.find((p: any) => !p.error);
        if (firstP) setExpandedAgent(firstP.provider);
      }
    } catch { /* ignore */ }
    clearTimeout(t1); clearTimeout(t2); clearTimeout(t3);
    setMegaBotRunning(false);
    setMegaBotStep(0);
  }

  const d = standardResult?.data;

  // MegaBot derived data
  const megaProviders: any[] = Array.isArray(megaBotData?.providers) ? megaBotData.providers : [];
  const megaSuccessful = megaProviders.filter(p => !p.error);
  const megaFailed = megaProviders.filter(p => p.error);
  const megaAgreementRaw = megaBotData?.agreementScore || 0;
  const megaAgreement = Math.round(megaAgreementRaw > 1 ? megaAgreementRaw : megaAgreementRaw * 100);
  const megaConsensus = megaBotData?.consensus || {};

  // Build MegaBot summary
  function buildMegaSummary(): string {
    if (!megaBotData || megaSuccessful.length === 0) return "";
    const parts: string[] = [];
    const allH = megaSuccessful.map((p: any) => extractHighlights(p));
    const consH = extractHighlights({ data: megaConsensus });
    const itemName = consH.itemName || allH.find(h => h.itemName)?.itemName || "this item";
    const category = consH.category || allH.find(h => h.category)?.category;
    parts.push(`${megaSuccessful.length} AI experts identified this as "${itemName}"${category ? ` in the ${category} category` : ""}.`);
    if (megaAgreement >= 80) parts.push(`Strong consensus (${megaAgreement}%) across all agents.`);
    else if (megaAgreement >= 60) parts.push(`Moderate agreement (${megaAgreement}%).`);
    else parts.push(`Mixed opinions (${megaAgreement}% agreement) \u2014 review individual assessments.`);
    const condScore = consH.condOverall || allH.find(h => h.condOverall)?.condOverall;
    if (condScore != null) {
      const w = condWord(Number(condScore));
      const det = consH.condDetails || allH.find(h => h.condDetails)?.condDetails;
      parts.push(`Consensus condition: ${condScore}/10 (${w})${det ? ` \u2014 ${det.slice(0, 100)}` : ""}.`);
    }
    for (let i = 0; i < megaSuccessful.length; i++) {
      const h = allH[i];
      const label = PROVIDER_META[megaSuccessful[i].provider]?.label || megaSuccessful[i].provider;
      if (megaSuccessful[i].provider === "claude" && (h.makerHistory || h.productHistory)) {
        const text = h.makerHistory || h.productHistory || "";
        const sentences = text.split(/(?<=[.!?])\s+/).slice(0, 2).join(" ");
        if (sentences.length > 30) parts.push(`${label}: ${sentences}`);
      } else if (megaSuccessful[i].provider === "gemini" && (h.similarItems || h.specialFeatures)) {
        const text = h.similarItems || h.specialFeatures || "";
        const s = text.split(/(?<=[.!?])\s+/).slice(0, 1).join(" ");
        if (s.length > 20) parts.push(`${label}: ${s}`);
      } else if (megaSuccessful[i].provider === "grok" && (h.collectorInfo || h.tipsAndFacts)) {
        const text = h.collectorInfo || h.tipsAndFacts || "";
        const s = text.split(/(?<=[.!?])\s+/).slice(0, 1).join(" ");
        if (s.length > 20) parts.push(`${label}: ${s}`);
      } else if (h.brand || h.maker) {
        parts.push(`${label} identified the brand/maker as "${h.brand || h.maker}".`);
      }
    }
    const bestExec = megaSuccessful.map((p: any) => getKeyInsight(p)).filter(s => s.length > 40).sort((a, b) => b.length - a.length)[0];
    if (bestExec && parts.length < 6) {
      const sentences = bestExec.split(/(?<=[.!?])\s+/).slice(0, 2);
      if (sentences[0]?.length > 20) parts.push(sentences.join(" "));
    }
    if (allH.some(h => h.isTextOnly)) parts.push("Note: Grok analyzed text only (photo unavailable).");
    return parts.join(" ");
  }

  return (
    <div>
      <BotItemSelector
        items={items.map((i) => ({ id: i.id, title: i.title, photo: i.photo, status: i.status, hasAnalysis: i.hasAnalysis }))}
        selectedId={selectedId}
        onSelect={setSelectedId}
      />

      {!item ? (
        <div style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)" }}>
          <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem", opacity: 0.3 }}>🧠</div>
          <div style={{ fontSize: "0.95rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.35rem" }}>Select an Item to Analyze</div>
          <div style={{ fontSize: "0.82rem" }}>Choose an item above to see the full analysis report.</div>
        </div>
      ) : !ai ? (
        <div style={{
          marginTop: "1.5rem",
          background: "var(--bg-card, var(--ghost-bg))",
          border: "1px solid var(--border-card)",
          borderRadius: "1.25rem",
          padding: "3rem",
          textAlign: "center",
        }}>
          <div style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>🧠</div>
          <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.5rem" }}>No analysis yet</h3>
          <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginBottom: "1.5rem" }}>Run AnalyzeBot to identify, assess, and price this item.</p>
          <button onClick={runAnalysis} disabled={analyzing} className="btn-primary" style={{ padding: "0.65rem 2rem" }}>
            {analyzing ? "Analyzing..." : "Analyze This Item with AI"}
          </button>
        </div>
      ) : (
        <div style={{ marginTop: "1.5rem", display: "flex", flexDirection: "column", gap: "1.25rem" }}>

          {/* ═══ FRESHNESS INDICATOR ═══ */}
          {item?.lastAnalyzedAt && (
            <div style={{
              display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.5rem 0.75rem",
              background: "var(--ghost-bg)", borderRadius: "0.5rem", marginBottom: "0.25rem",
              fontSize: "0.65rem", color: "var(--text-muted)", flexWrap: "wrap",
            }}>
              <span style={{ fontSize: "0.8rem" }}>🕐</span>
              <span>Last analyzed: <strong style={{ color: "var(--text-secondary)" }}>
                {(() => {
                  const ms = Date.now() - new Date(item.lastAnalyzedAt!).getTime();
                  const mins = Math.floor(ms / 60000);
                  if (mins < 60) return `${mins} minute${mins !== 1 ? "s" : ""} ago`;
                  const hrs = Math.floor(mins / 60);
                  if (hrs < 24) return `${hrs} hour${hrs !== 1 ? "s" : ""} ago`;
                  const days = Math.floor(hrs / 24);
                  return `${days} day${days !== 1 ? "s" : ""} ago`;
                })()}
              </strong></span>
              {(() => {
                const hrs = (Date.now() - new Date(item.lastAnalyzedAt!).getTime()) / 3600000;
                if (hrs > 168) return <span style={{ color: "#ef4444", fontWeight: 600 }}>⚠️ Stale — consider re-analyzing</span>;
                if (hrs > 48) return <span style={{ color: "#f59e0b", fontWeight: 600 }}>⏳ Aging</span>;
                return <span style={{ color: "#22c55e", fontWeight: 600 }}>✅ Fresh</span>;
              })()}
              <span style={{ marginLeft: "auto", fontSize: "0.55rem" }}>
                {item.analysisHistory?.length ?? 0} total run{(item.analysisHistory?.length ?? 0) !== 1 ? "s" : ""}
              </span>
            </div>
          )}

          {/* ═══ STANDARD ANALYSIS SECTIONS ═══ */}

          {/* Identification */}
          {d && (
            <div style={{ borderRadius: "0.75rem", overflow: "hidden", border: "1px solid var(--border-default)" }}>
              <AccordionHeader id="identification" icon="🔍" title="ITEM IDENTIFICATION" subtitle={ai?.item_name || ""} isOpen={openSections.has("identification")} onToggle={toggleSection} accentColor="#00bcd4" badge={ai?.category || ""} />
              {openSections.has("identification") && (
            <div style={{
              background: "var(--bg-card, var(--ghost-bg))",
              padding: "1.25rem",
            }}>
              <div style={{ display: "none" }}>Item Identification</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                {[
                  { label: "Item", value: ai.item_name || d.identification.split("\u2014")[0].trim() },
                  { label: "Category", value: ai.category || d.category },
                  { label: "Brand", value: ai.brand || "Unknown" },
                  { label: "Model", value: ai.model || "Unknown" },
                  { label: "Material", value: ai.material || "Not identified" },
                  { label: "Era", value: ai.era || "Unknown" },
                ].map((f) => (
                  <div key={f.label} style={{ background: "var(--bg-card)", border: "1px solid var(--border-default)", borderRadius: "0.75rem", padding: "0.75rem" }}>
                    <div style={{ fontSize: "0.6rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-muted)", marginBottom: "0.2rem" }}>{f.label}</div>
                    <div style={{ fontSize: "0.88rem", fontWeight: 600, color: "var(--text-primary)" }}>{f.value}</div>
                  </div>
                ))}
              </div>
            </div>
            )}
            </div>
          )}

          {/* Condition */}
          {d && (
            <div style={{ borderRadius: "0.75rem", overflow: "hidden", border: "1px solid var(--border-default)" }}>
              <AccordionHeader id="condition" icon="📋" title="CONDITION ASSESSMENT" subtitle={`${ai?.condition_score ?? "?"}/10 — ${ai?.condition_guess ?? ""}`} isOpen={openSections.has("condition")} onToggle={toggleSection} accentColor={(() => { const s = ai?.condition_score ?? 5; return s >= 7 ? "#22c55e" : s >= 4 ? "#f59e0b" : "#ef4444"; })()} />
              {openSections.has("condition") && (
            <div style={{
              background: "var(--bg-card, var(--ghost-bg))",
              padding: "1.25rem",
            }}>
              <div style={{ display: "none" }}>Condition Assessment</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.75rem" }}>
                {[
                  { label: "Overall", value: `${ai.condition_score || d.conditionScore}/10`, color: (ai.condition_score || d.conditionScore) >= 7 ? "#4caf50" : (ai.condition_score || d.conditionScore) >= 5 ? "#ff9800" : "#ef5350" },
                  { label: "Cosmetic", value: `${ai.condition_cosmetic || d.conditionScore}/10`, color: "var(--text-primary)" },
                  { label: "Functional", value: `${ai.condition_functional || d.conditionScore}/10`, color: "var(--text-primary)" },
                ].map((f) => (
                  <div key={f.label} style={{ background: "var(--bg-card)", border: "1px solid var(--border-default)", borderRadius: "0.75rem", padding: "0.75rem", textAlign: "center" }}>
                    <div style={{ fontSize: "0.6rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-muted)", marginBottom: "0.2rem" }}>{f.label}</div>
                    <div style={{ fontSize: "1.3rem", fontWeight: 800, color: f.color }}>{f.value}</div>
                  </div>
                ))}
              </div>
              {ai.condition_guess && (
                <div style={{ fontSize: "0.82rem", color: "var(--text-secondary)", marginTop: "0.75rem" }}>
                  <strong>Label:</strong> {ai.condition_guess}
                </div>
              )}
              {ai.visible_issues?.length > 0 && (
                <div style={{ marginTop: "0.75rem" }}>
                  <div style={{ fontSize: "0.6rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "#ef5350", marginBottom: "0.35rem" }}>Visible Issues</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem" }}>
                    {ai.visible_issues.map((issue: string) => <span key={issue} className="badge" style={{ background: "rgba(239,68,68,0.1)", color: "#ef5350" }}>{issue}</span>)}
                  </div>
                </div>
              )}
              {ai.positive_notes?.length > 0 && (
                <div style={{ marginTop: "0.75rem" }}>
                  <div style={{ fontSize: "0.6rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "#4caf50", marginBottom: "0.35rem" }}>Positive Notes</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem" }}>
                    {ai.positive_notes.map((note: string) => <span key={note} className="badge" style={{ background: "rgba(76,175,80,0.1)", color: "#4caf50" }}>{note}</span>)}
                  </div>
                </div>
              )}
            </div>
            )}
            </div>
          )}

          {/* Pricing */}
          {d && (
            <div style={{ borderRadius: "0.75rem", overflow: "hidden", border: "1px solid var(--border-default)" }}>
              <AccordionHeader id="pricing" icon="💰" title="PRICING & VALUATION" subtitle={(() => { const l = ai?.estimated_value_low ?? item?.valuation?.low; const h = ai?.estimated_value_high ?? item?.valuation?.high; return l && h ? `$${l} — $${h}` : ""; })()} isOpen={openSections.has("pricing")} onToggle={toggleSection} accentColor="#00bcd4" badge={`${ai?.pricing_confidence ?? item?.valuation?.confidence ?? 0}% conf.`} />
              {openSections.has("pricing") && (
            <div style={{
              background: "var(--bg-card, var(--ghost-bg))",
              padding: "1.25rem",
            }}>
              <div style={{ display: "none" }}>Price Estimate</div>
              <div style={{ display: "flex", alignItems: "baseline", gap: "0.5rem" }}>
                <span style={{ fontSize: "2rem", fontWeight: 800, color: "var(--accent)" }}>${d.priceLow}</span>
                <span style={{ fontSize: "1rem", color: "var(--text-muted)" }}>{"\u2014"}</span>
                <span style={{ fontSize: "2rem", fontWeight: 800, color: "var(--accent)" }}>${d.priceHigh}</span>
              </div>
              <div style={{ height: 8, borderRadius: 99, background: "var(--ghost-bg)", overflow: "hidden", marginTop: "0.5rem" }}>
                <div style={{ height: "100%", width: `${Math.round(standardResult!.confidence * 100)}%`, borderRadius: 99, background: standardResult!.confidence >= 0.75 ? "#4caf50" : "#ff9800" }} />
              </div>
              <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: "0.35rem" }}>
                {Math.round(standardResult!.confidence * 100)}% confident &bull; Mid: ${d.priceMid}
              </div>
              <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: "0.75rem", lineHeight: 1.5 }}>{d.rationale}</p>
              {d.valueDrivers.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem", marginTop: "0.75rem" }}>
                  {d.valueDrivers.map((v: string) => <span key={v} className="badge">{v}</span>)}
                </div>
              )}
            </div>
            )}
            </div>
          )}

          {/* Listing Suggestions */}
          {d && (
            <div style={{ borderRadius: "0.75rem", overflow: "hidden", border: "1px solid var(--border-default)" }}>
              <AccordionHeader id="listing" icon="📝" title="LISTING SUGGESTIONS" subtitle={ai?.recommended_title || ""} isOpen={openSections.has("listing")} onToggle={toggleSection} />
              {openSections.has("listing") && (
            <div style={{
              background: "var(--bg-card, var(--ghost-bg))",
              padding: "1.25rem",
            }}>
              <div style={{ display: "none" }}>Listing Suggestions</div>
              <div style={{ marginBottom: "0.75rem" }}>
                <div style={{ fontSize: "0.6rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-muted)", marginBottom: "0.2rem" }}>Suggested Title</div>
                <div style={{ fontSize: "0.95rem", fontWeight: 600, color: "var(--text-primary)" }}>{ai.recommended_title || d.listingTitle}</div>
              </div>
              <div style={{ marginBottom: "0.75rem" }}>
                <div style={{ fontSize: "0.6rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-muted)", marginBottom: "0.2rem" }}>Suggested Description</div>
                <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>{ai.recommended_description || d.listingDescription}</div>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem" }}>
                {(ai.best_platforms || d.platforms).map((p: string) => <span key={p} className="badge">{p}</span>)}
              </div>
            </div>
            )}
            </div>
          )}

          {/* Keywords */}
          {d && (
            <div style={{ borderRadius: "0.75rem", overflow: "hidden", border: "1px solid var(--border-default)" }}>
              <AccordionHeader id="keywords" icon="🏷️" title="KEYWORDS & SEARCH TERMS" subtitle={`${(ai?.keywords || []).length} keywords`} isOpen={openSections.has("keywords")} onToggle={toggleSection} />
              {openSections.has("keywords") && (
              <div style={{ background: "var(--bg-card, var(--ghost-bg))", padding: "1.25rem" }}>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
                  {(ai.keywords || d.keywords || []).map((k: string) => <span key={k} className="badge">{k}</span>)}
                </div>
              </div>
              )}
            </div>
          )}

          {/* ═══ NEW: SHIPPING PROFILE ═══ */}
          {ai && (
            <div style={{ borderRadius: "0.75rem", overflow: "hidden", border: "1px solid var(--border-default)" }}>
              <AccordionHeader id="shipping" icon="📦" title="SHIPPING PROFILE" subtitle={`${ai?.weight_estimate_lbs ?? "?"} lbs · ${ai?.shipping_difficulty ?? "Unknown"}`} isOpen={openSections.has("shipping")} onToggle={toggleSection} badge={ai?.shipping_difficulty} />
              {openSections.has("shipping") && (
              <div style={{ background: "var(--bg-card, var(--ghost-bg))", padding: "1.25rem" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.5rem", marginBottom: "0.5rem" }}>
                  <div style={{ textAlign: "center", padding: "0.5rem", background: "var(--ghost-bg)", borderRadius: "0.4rem" }}>
                    <div style={{ fontSize: "0.55rem", color: "var(--text-muted)", fontWeight: 600 }}>⚖️ WEIGHT</div>
                    <div style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--text-primary)" }}>{ai.weight_estimate_lbs ?? "—"} lbs</div>
                  </div>
                  <div style={{ textAlign: "center", padding: "0.5rem", background: "var(--ghost-bg)", borderRadius: "0.4rem" }}>
                    <div style={{ fontSize: "0.55rem", color: "var(--text-muted)", fontWeight: 600 }}>📐 DIMENSIONS</div>
                    <div style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--text-primary)" }}>{ai.dimensions_estimate ?? "—"}</div>
                  </div>
                  <div style={{ textAlign: "center", padding: "0.5rem", background: "var(--ghost-bg)", borderRadius: "0.4rem" }}>
                    <div style={{ fontSize: "0.55rem", color: "var(--text-muted)", fontWeight: 600 }}>🚚 DIFFICULTY</div>
                    <div style={{ fontSize: "0.9rem", fontWeight: 700, color: ai?.shipping_difficulty === "Easy" ? "#22c55e" : ai?.shipping_difficulty === "Moderate" ? "#f59e0b" : "#ef4444" }}>{ai.shipping_difficulty ?? "—"}</div>
                  </div>
                </div>
                {ai.shipping_notes && (
                  <div style={{ fontSize: "0.65rem", color: "var(--text-secondary)", lineHeight: 1.6, padding: "0.4rem 0.5rem", background: "rgba(0,188,212,0.04)", borderRadius: "0.4rem", borderLeft: "3px solid #00bcd4" }}>
                    📋 <strong>Packing Advice:</strong> {ai.shipping_notes}
                  </div>
                )}
              </div>
              )}
            </div>
          )}

          {/* ═══ NEW: ANTIQUE & COLLECTIBLE STATUS ═══ */}
          {(item?.isAntique || ai?.is_antique) && (
            <div style={{ borderRadius: "0.75rem", overflow: "hidden", border: "1px solid var(--border-default)" }}>
              <AccordionHeader id="antique" icon="🏛️" title="ANTIQUE & COLLECTIBLE STATUS" subtitle={`Score: ${item?.antiqueScore ?? "?"}`} isOpen={openSections.has("antique")} onToggle={toggleSection} accentColor="#f59e0b" badge="ANTIQUE" />
              {openSections.has("antique") && (
              <div style={{ background: "var(--bg-card, var(--ghost-bg))", padding: "1.25rem" }}>
                <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.5rem" }}>
                  <div style={{ padding: "0.5rem 0.75rem", background: "rgba(245,158,11,0.08)", borderRadius: "0.4rem", textAlign: "center" }}>
                    <div style={{ fontSize: "0.55rem", color: "var(--text-muted)", fontWeight: 600 }}>SCORE</div>
                    <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "#f59e0b" }}>{item?.antiqueScore ?? "—"}</div>
                  </div>
                  {item?.auctionLow != null && item?.auctionHigh != null && (
                    <div style={{ padding: "0.5rem 0.75rem", background: "rgba(245,158,11,0.08)", borderRadius: "0.4rem", textAlign: "center" }}>
                      <div style={{ fontSize: "0.55rem", color: "var(--text-muted)", fontWeight: 600 }}>AUCTION ESTIMATE</div>
                      <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "#f59e0b" }}>${item.auctionLow} — ${item.auctionHigh}</div>
                    </div>
                  )}
                </div>
                {(item?.antiqueMarkers?.length ?? 0) > 0 && (
                  <div>
                    <div style={{ fontSize: "0.55rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "0.25rem" }}>ANTIQUE MARKERS:</div>
                    <div style={{ display: "flex", gap: "0.25rem", flexWrap: "wrap" }}>
                      {item!.antiqueMarkers!.map((m: string, i: number) => (
                        <span key={i} style={{ fontSize: "0.55rem", padding: "2px 8px", borderRadius: "9999px", background: "rgba(245,158,11,0.1)", color: "#f59e0b", fontWeight: 600 }}>{m}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              )}
            </div>
          )}

          {/* ═══ NEW: PHOTO QUALITY ═══ */}
          {ai?.photo_quality_score != null && (
            <div style={{ borderRadius: "0.75rem", overflow: "hidden", border: "1px solid var(--border-default)" }}>
              <AccordionHeader id="photos" icon="📸" title="PHOTO QUALITY ASSESSMENT" subtitle={`${ai.photo_quality_score}/10`} isOpen={openSections.has("photos")} onToggle={toggleSection} badge={ai.photo_quality_score >= 7 ? "GOOD" : ai.photo_quality_score >= 4 ? "OK" : "NEEDS WORK"} />
              {openSections.has("photos") && (
              <div style={{ background: "var(--bg-card, var(--ghost-bg))", padding: "1.25rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                  <div style={{ width: "48px", height: "48px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.1rem", fontWeight: 800, background: ai.photo_quality_score >= 7 ? "rgba(34,197,94,0.1)" : ai.photo_quality_score >= 4 ? "rgba(245,158,11,0.1)" : "rgba(239,68,68,0.1)", color: ai.photo_quality_score >= 7 ? "#22c55e" : ai.photo_quality_score >= 4 ? "#f59e0b" : "#ef4444", border: `2px solid ${ai.photo_quality_score >= 7 ? "#22c55e" : ai.photo_quality_score >= 4 ? "#f59e0b" : "#ef4444"}` }}>
                    {ai.photo_quality_score}
                  </div>
                  <div>
                    <div style={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--text-primary)" }}>
                      {ai.photo_quality_score >= 8 ? "Excellent Photos" : ai.photo_quality_score >= 6 ? "Good Photos" : ai.photo_quality_score >= 4 ? "Acceptable Photos" : "Photos Need Improvement"}
                    </div>
                    <div style={{ fontSize: "0.55rem", color: "var(--text-muted)" }}>Score: {ai.photo_quality_score}/10</div>
                  </div>
                </div>
                {ai.photo_improvement_tips?.length > 0 && (
                  <div>
                    <div style={{ fontSize: "0.55rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "0.25rem" }}>IMPROVEMENT TIPS:</div>
                    {ai.photo_improvement_tips.map((tip: string, i: number) => (
                      <div key={i} style={{ fontSize: "0.65rem", color: "var(--text-secondary)", padding: "0.2rem 0", paddingLeft: "0.5rem", borderLeft: "2px solid rgba(0,188,212,0.15)" }}>💡 {tip}</div>
                    ))}
                  </div>
                )}
              </div>
              )}
            </div>
          )}

          {/* ═══ NEW: ANALYSIS HISTORY ═══ */}
          {(item?.analysisHistory?.length ?? 0) > 0 && (
            <div style={{ borderRadius: "0.75rem", overflow: "hidden", border: "1px solid var(--border-default)" }}>
              <AccordionHeader id="history" icon="📜" title="ANALYSIS HISTORY" subtitle={`${item!.analysisHistory!.length} runs`} isOpen={openSections.has("history")} onToggle={toggleSection} />
              {openSections.has("history") && (
              <div style={{ background: "var(--bg-card, var(--ghost-bg))", padding: "0.5rem" }}>
                {item!.analysisHistory!.map((run: any, i: number) => (
                  <div key={run.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.4rem 0.5rem", borderBottom: i < item!.analysisHistory!.length - 1 ? "1px solid var(--border-default)" : "none", fontSize: "0.6rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                      <span style={{ padding: "2px 6px", borderRadius: "4px", fontSize: "0.5rem", fontWeight: 600, background: run.type === "MEGABOT_ANALYZEBOT" ? "rgba(139,92,246,0.1)" : "rgba(0,188,212,0.1)", color: run.type === "MEGABOT_ANALYZEBOT" ? "#8b5cf6" : "#00bcd4" }}>
                        {run.type === "MEGABOT_ANALYZEBOT" ? "⚡ MegaBot" : run.type === "ANALYZED_FORCE" ? "🔄 Re-run" : "🧠 Analysis"}
                      </span>
                    </div>
                    <div style={{ color: "var(--text-muted)", fontSize: "0.55rem" }}>
                      {new Date(run.createdAt).toLocaleDateString()} {new Date(run.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>
                ))}
              </div>
              )}
            </div>
          )}

          {/* ═══ MEGABOT DEEP ITEM INTELLIGENCE ═══ */}

          {/* Loading state */}
          {megaBotLoading && (
            <div style={{ textAlign: "center", padding: "2rem", color: "var(--text-muted)" }}>
              <div style={{ fontSize: "1.2rem", marginBottom: "0.5rem", animation: "pulse 1.5s ease infinite" }}>⚡</div>
              <div style={{ fontSize: "0.82rem" }}>Loading MegaBot results...</div>
            </div>
          )}

          {/* Running animation */}
          {megaBotRunning && (
            <div style={{
              background: "linear-gradient(135deg, rgba(139,92,246,0.08), rgba(0,188,212,0.05))",
              border: "1px solid rgba(139,92,246,0.25)",
              borderRadius: "1.25rem",
              padding: "1.5rem",
            }}>
              <div style={{ fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "#a855f7", marginBottom: "1rem", fontWeight: 600 }}>
                ⚡ MegaBot Analyzing with 4 AI Experts...
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {[
                  { ...PROVIDER_META.openai, step: 1 },
                  { ...PROVIDER_META.claude, step: 2 },
                  { ...PROVIDER_META.gemini, step: 3 },
                  { ...PROVIDER_META.grok, step: 4 },
                ].map((a) => (
                  <div key={a.label} style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.5rem 0" }}>
                    <span style={{ fontSize: "1.1rem" }}>{a.icon}</span>
                    <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-primary)", flex: 1 }}>{a.label}</span>
                    <span style={{ fontSize: "0.6rem", color: "var(--text-muted)", fontStyle: "italic" }}>{a.specialty}</span>
                    <span style={{
                      fontSize: "0.62rem", fontWeight: 600, padding: "0.15rem 0.5rem", borderRadius: "9999px",
                      background: megaBotStep >= a.step ? "rgba(76,175,80,0.15)" : "rgba(255,152,0,0.15)",
                      color: megaBotStep >= a.step ? "#4caf50" : "#ff9800",
                    }}>
                      {megaBotStep >= a.step ? "Complete" : "Analyzing..."}
                    </span>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: "1rem", fontSize: "0.72rem", color: "var(--text-muted)", textAlign: "center" }}>
                This typically takes 30-90 seconds...
              </div>
            </div>
          )}

          {/* Teaser (no data, not running) */}
          {!megaBotData && !megaBotLoading && !megaBotRunning && ai && (
            <div style={{
              background: "linear-gradient(135deg, rgba(139,92,246,0.06), rgba(0,188,212,0.04))",
              border: "1px solid rgba(139,92,246,0.2)",
              borderRadius: "1.25rem",
              padding: "2rem",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.65rem", marginBottom: "1rem" }}>
                <span style={{ fontSize: "1.5rem" }}>⚡</span>
                <div>
                  <div style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-primary)" }}>MegaBot Deep Item Intelligence</div>
                  <div style={{ fontSize: "0.82rem", color: "var(--text-secondary)", marginTop: "0.2rem" }}>
                    Get 4 independent AI experts to deeply analyze your item — history, construction, craftsmanship, tips, collector value, and more.
                  </div>
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", marginBottom: "1.25rem" }}>
                {Object.entries(PROVIDER_META).map(([key, meta]) => (
                  <div key={key} style={{ display: "flex", gap: "0.5rem", alignItems: "flex-start", padding: "0.5rem", background: "var(--bg-card)", borderRadius: "0.5rem", border: "1px solid var(--border-default)" }}>
                    <span style={{ fontSize: "1rem", flexShrink: 0 }}>{meta.icon}</span>
                    <div>
                      <div style={{ fontSize: "0.75rem", fontWeight: 600, color: meta.color }}>{meta.label}</div>
                      <div style={{ fontSize: "0.68rem", color: "var(--text-muted)", lineHeight: 1.3 }}>{meta.specialty}</div>
                    </div>
                  </div>
                ))}
              </div>
              <button
                onClick={runMegaBot}
                style={{
                  padding: "0.7rem 2rem", width: "100%", fontSize: "0.88rem", fontWeight: 700,
                  borderRadius: "0.6rem", border: "none", cursor: "pointer",
                  background: "linear-gradient(135deg, #8b5cf6, #3b82f6)", color: "#fff",
                  boxShadow: "0 4px 20px rgba(139,92,246,0.35)",
                  transition: "all 0.2s ease", minHeight: "48px",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem",
                }}
              >
                ⚡ Run MegaBot Analysis
                <span style={{ fontSize: "0.6rem", opacity: 0.8, padding: "2px 8px", borderRadius: "9999px", background: "rgba(255,255,255,0.15)" }}>5 credits</span>
              </button>
            </div>
          )}

          {/* ═══ MEGABOT FULL RESULTS ═══ */}
          {megaBotData && !megaBotRunning && megaSuccessful.length > 0 && (
            <>
              {/* A) Header + Agreement */}
              <div style={{
                background: "linear-gradient(135deg, rgba(139,92,246,0.08), rgba(0,188,212,0.05))",
                border: "1px solid rgba(139,92,246,0.25)",
                borderRadius: "1.25rem",
                padding: "1.25rem 1.5rem",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.65rem", marginBottom: "0.75rem" }}>
                  <span style={{ fontSize: "1.3rem" }}>⚡</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-primary)" }}>
                      MegaBot Item Deep Dive — {megaSuccessful.length} AI Expert{megaSuccessful.length !== 1 ? "s" : ""}
                    </div>
                    <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
                      Deep item knowledge from {megaSuccessful.length} independent AI agents
                    </div>
                  </div>
                  <div style={{
                    padding: "0.3rem 0.85rem", borderRadius: "9999px",
                    background: megaAgreement >= 75 ? "rgba(76,175,80,0.15)" : megaAgreement >= 40 ? "rgba(255,152,0,0.15)" : "rgba(239,68,68,0.15)",
                    color: megaAgreement >= 75 ? "#4caf50" : megaAgreement >= 40 ? "#ff9800" : "#ef4444",
                    fontSize: "1.1rem", fontWeight: 800,
                    textShadow: megaAgreement >= 70 ? "0 0 16px rgba(34,197,94,0.4)" : megaAgreement >= 40 ? "0 0 16px rgba(245,158,11,0.4)" : "0 0 16px rgba(239,68,68,0.4)",
                  }}>
                    {megaAgreement}%
                    <span style={{ fontSize: "0.6rem", fontWeight: 600, marginLeft: "0.2rem", opacity: 0.8 }}>Agreement</span>
                  </div>
                </div>
                <div style={{ height: 6, borderRadius: 99, background: "var(--ghost-bg)", overflow: "hidden" }}>
                  <div style={{
                    height: "100%", width: `${megaAgreement}%`, borderRadius: 99,
                    background: megaAgreement >= 80 ? "#4caf50" : megaAgreement >= 60 ? "#ff9800" : "#ef4444",
                    transition: "width 0.6s ease",
                  }} />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.68rem", color: "var(--text-muted)", marginTop: "0.3rem" }}>
                  <span>{megaAgreement >= 80 ? "Strong Consensus" : megaAgreement >= 60 ? "Moderate Agreement" : "Agents Disagree \u2014 review details"}</span>
                  <span>{megaFailed.length > 0 && megaFailed.length < (megaSuccessful.length + megaFailed.length) ? `${megaFailed.length} of ${megaSuccessful.length + megaFailed.length} unavailable` : megaFailed.length > 0 ? "All experts unavailable" : "All agents responded"}</span>
                </div>
              </div>

              {/* B) Agent Cards */}
              {megaSuccessful.map((p: any) => {
                const meta = PROVIDER_META[p.provider] || { icon: "🤖", label: p.provider, color: "#888", specialty: "" };
                const isExp = expandedAgent === p.provider;
                const isShowingJson = showAgentJson === p.provider;
                const h = extractHighlights(p);
                const insight = getKeyInsight(p);
                const condNum = h.condOverall != null ? Number(h.condOverall) : null;
                const condLbl = h.condLabel || (condNum != null ? condWord(condNum) : null);
                const timeStr = (p.durationMs || p.responseTime) ? `${((p.durationMs || p.responseTime) / 1000).toFixed(1)}s` : "";
                const knowledgeSections = [h.productHistory, h.makerHistory, h.construction, h.specialFeatures, h.tipsAndFacts, h.commonIssues, h.careInstructions, h.similarItems, h.collectorInfo].filter(Boolean);

                return (
                  <div key={p.provider} style={{
                    background: "var(--bg-card, var(--ghost-bg))",
                    borderTop: isExp ? `3px solid ${meta.color}` : undefined,
                    border: `1px solid ${isExp ? `${meta.color}40` : "var(--border-card, var(--border-default))"}`,
                    borderRadius: "1.25rem",
                    overflow: "hidden",
                    transition: "border-color 0.2s, box-shadow 0.2s",
                    boxShadow: isExp ? `0 4px 24px ${meta.color}15` : "none",
                  }}>
                    {/* Card header (always visible) */}
                    <button
                      onClick={() => setExpandedAgent(isExp ? null : p.provider)}
                      style={{
                        width: "100%", display: "flex", alignItems: "center", gap: "0.65rem",
                        padding: "1rem 1.25rem", background: "transparent", border: "none",
                        cursor: "pointer", textAlign: "left",
                      }}
                    >
                      <span style={{ fontSize: "1.2rem", flexShrink: 0 }}>{meta.icon}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: "0.88rem", color: meta.color }}>{meta.label}</div>
                        <div style={{ fontSize: "0.6rem", color: "var(--text-muted)", fontStyle: "italic", marginTop: "0.1rem" }}>{meta.specialty}</div>
                        <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>
                          {h.itemName || p.itemName || "\u2014"}
                          {condNum != null && ` \u00B7 ${condNum}/10 ${condLbl}`}
                          {h.isTextOnly && " (text only)"}
                          {timeStr && <span style={{ fontSize: "0.55rem", color: "var(--text-muted)", marginLeft: "0.3rem" }}>⏱ {timeStr}</span>}
                        </div>
                      </div>
                      <span style={{ fontSize: "0.65rem", color: "#4caf50" }}>✅ {timeStr}</span>
                      <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", transition: "transform 0.2s", transform: isExp ? "rotate(180deg)" : "none" }}>▾</span>
                    </button>

                    {/* Expanded content */}
                    {isExp && (
                      <div style={{ padding: "0 1.25rem 1.25rem", borderTop: `1px solid ${meta.color}15` }}>

                        {/* Identification Grid */}
                        <div style={{ marginTop: "0.75rem", marginBottom: "0.75rem", padding: "0.75rem", background: "var(--bg-card)", borderRadius: "0.75rem", border: "1px solid var(--border-default)" }}>
                          <div style={{ fontSize: "0.6rem", textTransform: "uppercase", letterSpacing: "0.1em", color: meta.color, fontWeight: 700, marginBottom: "0.5rem" }}>Identification</div>
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.2rem 1.25rem" }}>
                            {h.itemName && <GridRow label="ITEM" value={h.itemName} bold />}
                            {h.category && <GridRow label="CATEGORY" value={h.subcategory ? `${h.category} > ${h.subcategory}` : h.category} />}
                            {(h.brand || h.maker) && <GridRow label="BRAND/MAKER" value={[h.brand, h.maker].filter(Boolean).join(" \u2014 ")} />}
                            {h.model && <GridRow label="MODEL" value={h.model} />}
                            {h.material && <GridRow label="MATERIAL" value={String(h.material)} />}
                            {h.era && <GridRow label="ERA" value={h.era} />}
                            {h.style && <GridRow label="STYLE" value={h.style} />}
                            {h.origin && <GridRow label="ORIGIN" value={h.origin} />}
                            {h.markings && <GridRow label="MARKINGS" value={String(h.markings)} />}
                            {h.dimensions && <GridRow label="DIMENSIONS" value={String(h.dimensions)} />}
                            {h.completeness && <GridRow label="COMPLETENESS" value={String(h.completeness)} />}
                          </div>
                        </div>

                        {/* Condition */}
                        {condNum != null && (
                          <div style={{ marginBottom: "0.75rem", padding: "0.75rem", background: "var(--bg-card)", borderRadius: "0.75rem", border: "1px solid var(--border-default)" }}>
                            <div style={{ fontSize: "0.6rem", textTransform: "uppercase", letterSpacing: "0.1em", color: meta.color, fontWeight: 700, marginBottom: "0.5rem" }}>Condition Assessment</div>
                            <div style={{ display: "flex", gap: "1.5rem", justifyContent: "center", marginBottom: "0.5rem" }}>
                              {[
                                { label: "Overall", score: condNum },
                                ...(h.condCosm != null ? [{ label: "Cosmetic", score: Number(h.condCosm) }] : []),
                                ...(h.condFunc != null ? [{ label: "Functional", score: Number(h.condFunc) }] : []),
                              ].map((s) => (
                                <div key={s.label} style={{ textAlign: "center" }}>
                                  <div style={{
                                    width: 52, height: 52, borderRadius: "50%",
                                    border: `3px solid ${s.score >= 7 ? "#4caf50" : s.score >= 4 ? "#ff9800" : "#ef4444"}`,
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    margin: "0 auto 0.2rem",
                                  }}>
                                    <span style={{ fontSize: "1.1rem", fontWeight: 800, color: s.score >= 7 ? "#4caf50" : s.score >= 4 ? "#ff9800" : "#ef4444" }}>
                                      {s.score}
                                    </span>
                                  </div>
                                  <div style={{ fontSize: "0.6rem", color: "var(--text-muted)" }}>{s.label}</div>
                                </div>
                              ))}
                            </div>
                            {h.condDetails && <p style={{ fontSize: "0.78rem", color: "var(--text-secondary)", margin: "0.3rem 0 0", lineHeight: 1.4 }}>{h.condDetails}</p>}
                            {Array.isArray(h.positiveNotes) && h.positiveNotes.length > 0 && (
                              <div style={{ marginTop: "0.4rem" }}>
                                {h.positiveNotes.slice(0, 4).map((note: string, i: number) => (
                                  <div key={i} style={{ fontSize: "0.72rem", color: "#4caf50", lineHeight: 1.4 }}>✅ {note}</div>
                                ))}
                              </div>
                            )}
                            {Array.isArray(h.visibleIssues) && h.visibleIssues.length > 0 && (
                              <div style={{ marginTop: "0.3rem" }}>
                                {h.visibleIssues.slice(0, 4).map((issue: string, i: number) => (
                                  <div key={i} style={{ fontSize: "0.72rem", color: "#ff9800", lineHeight: 1.4 }}>⚠️ {issue}</div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Deep Item Knowledge */}
                        {knowledgeSections.length > 0 && (
                          <div style={{
                            marginBottom: "0.75rem", padding: "0.75rem",
                            background: "linear-gradient(135deg, rgba(139,92,246,0.04), rgba(0,188,212,0.02))",
                            borderRadius: "0.75rem", border: "1px solid rgba(139,92,246,0.15)",
                          }}>
                            <div style={{ fontSize: "0.6rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "#a855f7", fontWeight: 700, marginBottom: "0.5rem" }}>
                              Deep Item Knowledge
                            </div>
                            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
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

                        {/* Key Insight */}
                        {insight && (
                          <div style={{
                            marginBottom: "0.75rem", padding: "0.65rem 0.75rem",
                            background: `${meta.color}08`, borderRadius: "0.75rem",
                            borderLeft: `3px solid ${meta.color}60`,
                          }}>
                            <div style={{ fontSize: "0.6rem", textTransform: "uppercase", letterSpacing: "0.1em", color: meta.color, fontWeight: 700, marginBottom: "0.25rem" }}>
                              {meta.icon} What {meta.label} Found
                            </div>
                            <p style={{ fontSize: "0.78rem", color: "var(--text-secondary)", margin: 0, lineHeight: 1.55, fontStyle: "italic" }}>
                              &ldquo;{insight.length > 500 ? insight.slice(0, 500) + "..." : insight}&rdquo;
                            </p>
                          </div>
                        )}

                        {/* Agent specialty + raw JSON */}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <div style={{ fontSize: "0.65rem", color: "var(--text-muted)", fontStyle: "italic" }}>
                            {meta.icon} {meta.label} specializes in {meta.specialty.toLowerCase()}
                          </div>
                          <div style={{ display: "flex", gap: "0.65rem" }}>
                            <button
                              onClick={() => setShowAgentJson(isShowingJson ? null : p.provider)}
                              style={{ fontSize: "0.62rem", color: "var(--text-muted)", background: "transparent", border: "none", cursor: "pointer", textDecoration: "underline", textUnderlineOffset: "2px", padding: 0 }}
                            >
                              {isShowingJson ? "Hide JSON" : "View JSON"}
                            </button>
                            <button
                              onClick={() => setExpandedAgent(null)}
                              style={{ fontSize: "0.62rem", color: meta.color, background: "transparent", border: "none", cursor: "pointer", padding: 0 }}
                            >
                              Collapse ▲
                            </button>
                          </div>
                        </div>
                        {isShowingJson && (
                          <pre style={{ fontSize: "0.6rem", color: "var(--text-muted)", background: "rgba(0,0,0,0.2)", borderRadius: "0.5rem", padding: "0.6rem", marginTop: "0.4rem", overflow: "auto", maxHeight: 280, whiteSpace: "pre-wrap" }}>
                            {JSON.stringify(p.data || p, null, 2)}
                          </pre>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Unavailable agents */}
              {megaFailed.map((p: any) => {
                const meta = PROVIDER_META[p.provider] || { icon: "🤖", label: p.provider, color: "#888" };
                return (
                  <div key={p.provider} style={{
                    display: "flex", alignItems: "center", gap: "0.5rem",
                    padding: "0.6rem 1rem", opacity: 0.4,
                    background: "var(--bg-card)", border: "1px solid var(--border-default)",
                    borderRadius: "0.75rem", fontSize: "0.75rem",
                  }}>
                    <span style={{ opacity: 0.5 }}>{meta.icon}</span>
                    <span style={{ fontWeight: 600, color: "var(--text-muted)" }}>{meta.label}</span>
                    <span style={{ color: "var(--text-muted)", flex: 1, fontSize: "0.65rem" }}>Unavailable</span>
                  </div>
                );
              })}

              {/* C) Consensus */}
              <div style={{
                background: "linear-gradient(135deg, rgba(139,92,246,0.06), rgba(0,188,212,0.04))",
                border: "1px solid rgba(139,92,246,0.2)",
                borderRadius: "1.25rem",
                padding: "1.25rem 1.5rem",
              }}>
                <div style={{ fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "#a855f7", fontWeight: 700, marginBottom: "0.75rem" }}>
                  ✅ Consensus — What All Agents Agree On
                </div>
                {(() => {
                  const ch = extractHighlights({ data: megaConsensus });
                  return (
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
                      {ch.itemName && (
                        <div style={{ background: "var(--bg-card)", borderRadius: "0.65rem", padding: "0.6rem", border: "1px solid var(--border-default)" }}>
                          <div style={{ fontSize: "0.6rem", textTransform: "uppercase", color: "var(--text-muted)" }}>Item</div>
                          <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-primary)" }}>{ch.itemName}</div>
                        </div>
                      )}
                      {ch.category && (
                        <div style={{ background: "var(--bg-card)", borderRadius: "0.65rem", padding: "0.6rem", border: "1px solid var(--border-default)" }}>
                          <div style={{ fontSize: "0.6rem", textTransform: "uppercase", color: "var(--text-muted)" }}>Category</div>
                          <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-primary)" }}>{ch.category}</div>
                        </div>
                      )}
                      {ch.condOverall != null && (
                        <div style={{ background: "var(--bg-card)", borderRadius: "0.65rem", padding: "0.6rem", border: "1px solid var(--border-default)" }}>
                          <div style={{ fontSize: "0.6rem", textTransform: "uppercase", color: "var(--text-muted)" }}>Condition</div>
                          <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-primary)" }}>{ch.condOverall}/10 ({condWord(Number(ch.condOverall))})</div>
                        </div>
                      )}
                      {(ch.brand || ch.maker) && (
                        <div style={{ background: "var(--bg-card)", borderRadius: "0.65rem", padding: "0.6rem", border: "1px solid var(--border-default)" }}>
                          <div style={{ fontSize: "0.6rem", textTransform: "uppercase", color: "var(--text-muted)" }}>Brand/Maker</div>
                          <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-primary)" }}>{[ch.brand, ch.maker].filter(Boolean).join(" \u2014 ")}</div>
                        </div>
                      )}
                      {ch.era && (
                        <div style={{ background: "var(--bg-card)", borderRadius: "0.65rem", padding: "0.6rem", border: "1px solid var(--border-default)" }}>
                          <div style={{ fontSize: "0.6rem", textTransform: "uppercase", color: "var(--text-muted)" }}>Era</div>
                          <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-primary)" }}>{ch.era}</div>
                        </div>
                      )}
                      {ch.material && (
                        <div style={{ background: "var(--bg-card)", borderRadius: "0.65rem", padding: "0.6rem", border: "1px solid var(--border-default)" }}>
                          <div style={{ fontSize: "0.6rem", textTransform: "uppercase", color: "var(--text-muted)" }}>Material</div>
                          <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-primary)" }}>{String(ch.material)}</div>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>

              {/* E) Detailed Summary */}
              <div style={{
                background: "var(--bg-card, var(--ghost-bg))",
                borderLeft: "4px solid #a855f7",
                borderRadius: "0 1.25rem 1.25rem 0",
                padding: "1.25rem 1.5rem",
              }}>
                <div style={{ fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "#a855f7", fontWeight: 700, marginBottom: "0.5rem" }}>
                  ⚡ MegaBot Expert Summary
                </div>
                <p style={{ fontSize: "0.88rem", lineHeight: 1.7, color: "var(--text-secondary)", margin: 0 }}>
                  {buildMegaSummary()}
                </p>
              </div>

              {/* MegaBot Research Intelligence */}
              {(() => {
                const megaProviders = megaBotData?.providers || megaSuccessful || [];
                const allSrc = megaProviders.flatMap((p: any) => (p.webSources || []).map((s: any) => ({ ...s, provider: p.provider })));
                const unique = allSrc.filter((s: any, i: number, a: any[]) => a.findIndex((x: any) => x.url === s.url) === i);
                if (unique.length === 0) return null;
                const agentsWithSearch = megaProviders.filter((p: any) => p.webSources?.length).length;
                return (
                  <div style={{ marginBottom: "0.5rem", padding: "0.6rem 0.75rem", borderRadius: "0.5rem", background: "var(--ghost-bg)", border: "1px solid var(--border-default)" }}>
                    <div style={{ fontSize: "0.6rem", fontWeight: 700, color: "#00bcd4", marginBottom: "0.3rem", textTransform: "uppercase" as const, letterSpacing: "0.05em" }}>
                      🌐 MEGABOT RESEARCH INTELLIGENCE — {unique.length} sources from {agentsWithSearch} AI engine{agentsWithSearch !== 1 ? "s" : ""}
                    </div>
                    <div style={{ fontSize: "0.52rem", color: "var(--text-muted)", marginBottom: "0.25rem" }}>
                      Real-time web research to verify identification, pricing, and provenance
                    </div>
                    {unique.slice(0, 10).map((src: any, i: number) => (
                      <a key={i} href={src.url} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: "0.3rem", padding: "0.2rem 0.4rem", marginBottom: "0.1rem", borderRadius: "0.3rem", background: "var(--bg-card)", textDecoration: "none", fontSize: "0.55rem", color: "#00bcd4", border: "1px solid transparent" }}>
                        <span style={{ width: 6, height: 6, borderRadius: "50%", flexShrink: 0, background: src.provider === "openai" ? "#10b981" : src.provider === "gemini" ? "#3b82f6" : src.provider === "grok" ? "#00DC82" : "#8b5cf6" }} />
                        <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>{src.title || src.url}</span>
                        <span style={{ fontSize: "0.48rem", color: "var(--text-muted)", flexShrink: 0 }}>via {src.provider === "openai" ? "GPT-4" : src.provider === "gemini" ? "Gemini" : src.provider === "grok" ? "Grok" : "Claude"} ↗</span>
                      </a>
                    ))}
                  </div>
                );
              })()}

              {/* F) Actions */}
              <div style={{ display: "flex", gap: "0.65rem", flexWrap: "wrap" }}>
                <button onClick={runMegaBot} disabled={megaBotRunning} style={{
                  padding: "0.5rem 1.25rem", fontSize: "0.78rem", fontWeight: 600, borderRadius: "0.6rem",
                  border: "1px solid rgba(139,92,246,0.3)", background: "rgba(139,92,246,0.08)",
                  color: "#a855f7", cursor: megaBotRunning ? "wait" : "pointer",
                }}>
                  {megaBotRunning ? "Running..." : "Re-Run MegaBot \u2014 3 credits"}
                </button>
                <Link href={`/bots/pricebot?item=${selectedId}`} style={{
                  padding: "0.5rem 1.25rem", fontSize: "0.78rem", fontWeight: 600, borderRadius: "0.6rem",
                  border: "1px solid rgba(76,175,80,0.3)", background: "rgba(76,175,80,0.08)",
                  color: "#4caf50", textDecoration: "none", display: "inline-flex", alignItems: "center",
                }}>
                  💰 Run PriceBot MegaBot
                </Link>
                <div style={{ textAlign: "center", marginTop: "1.5rem", marginBottom: "1rem" }}>
                  <Link href={`/items/${selectedId}`} style={{
                    display: "inline-flex", alignItems: "center", gap: "0.35rem",
                    fontSize: "0.875rem", fontWeight: 500, color: "var(--accent)",
                    textDecoration: "none", padding: "0.5rem 1rem", borderRadius: "0.5rem",
                    border: "1px solid var(--border-default)", transition: "border-color 0.15s ease",
                  }}>
                    ← Back to Item
                  </Link>
                </div>
              </div>
            </>
          )}

          {/* Standard actions */}
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            <button onClick={runAnalysis} disabled={analyzing} style={{
              padding: "0.35rem 0.85rem", fontSize: "0.75rem", fontWeight: 600, borderRadius: "0.5rem",
              border: "1px solid var(--accent)", background: "transparent", color: "var(--accent)", cursor: "pointer",
            }}>
              {analyzing ? "Re-analyzing..." : "Run Analysis Again"}
            </button>
            <button onClick={() => setShowJson(!showJson)} style={{
              padding: "0.35rem 0.85rem", fontSize: "0.75rem", fontWeight: 600, borderRadius: "0.5rem",
              border: "1px solid var(--border-default)", background: "transparent", color: "var(--text-muted)", cursor: "pointer",
            }}>
              {showJson ? "Hide JSON" : "View JSON"}
            </button>
          </div>
          {showJson && (
            <pre style={{ background: "var(--bg-card)", borderRadius: "0.75rem", padding: "1rem", overflow: "auto", fontSize: "0.72rem", color: "var(--text-muted)", maxHeight: 400, margin: 0 }}>
              {JSON.stringify({ aiAnalysis: ai, standardResult, megaBotData }, null, 2)}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}
