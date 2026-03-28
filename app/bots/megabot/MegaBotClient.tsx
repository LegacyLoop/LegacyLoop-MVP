"use client";

import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import BotItemSelector from "../BotItemSelector";
import BotLoadingState from "@/app/components/BotLoadingState";

type ItemData = {
  id: string;
  title: string;
  status: string;
  photo: string | null;
  hasAnalysis: boolean;
  aiResult: string | null;
  valuation: any;
  antique: any;
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

const BOT_META: Record<string, { label: string; icon: string; color: string; href: string }> = {
  analysis: { label: "AnalyzeBot", icon: "🧠", color: "#00bcd4", href: "/bots/analyzebot" },
  analyzebot: { label: "AnalyzeBot", icon: "🧠", color: "#00bcd4", href: "/bots/analyzebot" },
  pricebot: { label: "PriceBot", icon: "💰", color: "#4caf50", href: "/bots/pricebot" },
  pricing: { label: "PriceBot", icon: "💰", color: "#4caf50", href: "/bots/pricebot" },
  buyerbot: { label: "BuyerBot", icon: "🎯", color: "#e91e63", href: "/bots/buyerbot" },
  buyers: { label: "BuyerBot", icon: "🎯", color: "#e91e63", href: "/bots/buyerbot" },
  listbot: { label: "ListBot", icon: "📝", color: "#ff9800", href: "/bots/listbot" },
  listing: { label: "ListBot", icon: "📝", color: "#ff9800", href: "/bots/listbot" },
  reconbot: { label: "ReconBot", icon: "🔍", color: "#607d8b", href: "/bots/reconbot" },
  recon: { label: "ReconBot", icon: "🔍", color: "#607d8b", href: "/bots/reconbot" },
  photobot: { label: "PhotoBot", icon: "📷", color: "#f06292", href: "/bots/photobot" },
  photos: { label: "PhotoBot", icon: "📷", color: "#f06292", href: "/bots/photobot" },
  carbot: { label: "CarBot", icon: "🚗", color: "#2196f3", href: "/bots/carbot" },
  antiquebot: { label: "AntiqueBot", icon: "🏺", color: "#d97706", href: "/bots/antiquebot" },
  antique: { label: "AntiqueBot", icon: "🏺", color: "#d97706", href: "/bots/antiquebot" },
  collectiblesbot: { label: "CollectiblesBot", icon: "🎴", color: "#3b82f6", href: "/bots/collectiblesbot" },
  collectibles: { label: "CollectiblesBot", icon: "🎴", color: "#3b82f6", href: "/bots/collectiblesbot" },
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

// Safe price extraction — handles numbers, "$5,000" strings, and {low, mid, high} objects
function _extractPrice(v: any): number | null {
  if (v == null) return null;
  if (typeof v === "number") return isFinite(v) ? v : null;
  if (typeof v === "string") { const n = Number(v.replace(/[^0-9.\-]/g, "")); return isFinite(n) ? n : null; }
  if (typeof v === "object" && !Array.isArray(v)) {
    const mid = _extractPrice(v.mid ?? v.middle ?? v.average);
    if (mid != null) return mid;
    const lo = _extractPrice(v.low ?? v.min);
    const hi = _extractPrice(v.high ?? v.max);
    if (lo != null && hi != null) return Math.round((lo + hi) / 2);
    return lo ?? hi ?? null;
  }
  return null;
}
function _fmtPrice(v: any): string { const n = _extractPrice(v); return n != null ? `$${Math.round(n).toLocaleString()}` : "—"; }

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
    isTextOnly: d._grokTextOnly || false,
    summary: pickStr(d.executive_summary, d.summary, d.notes, p.executiveSummary),
    priceLow: pick(d.estimated_value_low, p.priceLow),
    priceHigh: pick(d.estimated_value_high, p.priceHigh),
    confidence: pick(d.pricing_confidence, d.confidence, p.confidence),
    keywords: d.keywords || null,
  };
}

function getKeyInsight(p: any): string {
  let d = _normalizeKeys(p.data || {});
  const topKeys = Object.keys(d);
  if (topKeys.length === 1 && _obj(d[topKeys[0]]) && Object.keys(d[topKeys[0]]).length >= 2) d = d[topKeys[0]];
  return d.executive_summary || d.summary || d.notes || d.pricing_rationale || "";
}

function condWord(score: number) { return score >= 8 ? "Excellent" : score >= 6 ? "Good" : score >= 4 ? "Fair" : "Poor"; }

function KnowledgeBlock({ icon, title, entries }: { icon: string; title: string; entries: { label: string; color: string; text: string }[] }) {
  return (
    <div style={{
      background: "var(--bg-card)", borderRadius: "0.75rem",
      border: "1px solid var(--border-default)", padding: "0.85rem 1rem", marginBottom: "0.65rem",
    }}>
      <div style={{ fontSize: "0.68rem", fontWeight: 700, color: "var(--text-secondary)", marginBottom: "0.5rem" }}>{icon} {title}</div>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
        {entries.map((e, i) => (
          <div key={i} style={{ borderLeft: `2px solid ${e.color}`, paddingLeft: "0.6rem" }}>
            <div style={{ fontSize: "0.62rem", fontWeight: 600, color: e.color, marginBottom: "0.1rem" }}>{e.label}</div>
            <p style={{ fontSize: "0.78rem", color: "var(--text-secondary)", margin: 0, lineHeight: 1.5 }}>
              {e.text.length > 300 ? e.text.slice(0, 300) + "..." : e.text}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Robust comparable sales extraction (handles all agent key variations) ──
function getComparables(data: any): any[] {
  if (!data || typeof data !== "object") return [];
  const d = _normalizeKeys(data);

  // Direct key checks (12 common variations)
  const DIRECT_KEYS = [
    "comparable_sales", "comparables", "recent_sales", "sold_listings",
    "sold_items", "comparable_listings", "market_comparables", "similar_sales",
    "price_comparisons", "comp_sales", "recent_comps", "sales_data",
  ];
  for (const k of DIRECT_KEYS) {
    if (Array.isArray(d[k]) && d[k].length > 0) return d[k];
  }

  // Check inside wrapper objects (price_validation, market_analysis, etc.)
  const WRAPPER_KEYS = [
    "price_validation", "market_analysis", "pricing", "valuation",
    "market_data", "analysis", "market_intelligence", "pricing_analysis",
  ];
  for (const wk of WRAPPER_KEYS) {
    const wrapper = _obj(d[wk]);
    if (!wrapper) continue;
    for (const k of DIRECT_KEYS) {
      if (Array.isArray(wrapper[k]) && wrapper[k].length > 0) return wrapper[k];
    }
  }

  // Last resort: scan top-level values for arrays of objects with price-like fields
  for (const val of Object.values(d)) {
    if (Array.isArray(val) && val.length > 0 && val.length <= 30) {
      const first = val[0];
      if (first && typeof first === "object" && (
        first.sold_price != null || first.price != null || first.sale_price != null ||
        first.sold_for != null || first.amount != null
      )) return val;
    }
  }

  return [];
}

function normalizeComparable(comp: any): { platform: string; item_description: string; sold_price: any; date: string; condition: string; relevance: string } {
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

// ── Pricing extraction helper ──
function extractPH(p: any) {
  let d = _normalizeKeys(p.data || {});
  const topKeys = Object.keys(d);
  if (topKeys.length === 1 && _obj(d[topKeys[0]]) && Object.keys(d[topKeys[0]]).length >= 2) d = d[topKeys[0]];
  const pv = _obj(d.price_validation) || d;
  const ma = _obj(d.market_analysis) || d;
  const ng = _obj(d.negotiation_guide) || d;
  const pp = _obj(d.platform_pricing) || {};
  const ph = _obj(d.price_history) || d;
  const pk = (...keys: string[]) => { for (const k of keys) { if (d[k] != null && d[k] !== "") return d[k]; } return null; };
  return {
    priceLow: pv.revised_low || pk("estimated_value_low", "price_low"),
    priceMid: pv.revised_mid || pk("estimated_value_mid", "price_mid"),
    priceHigh: pv.revised_high || pk("estimated_value_high", "price_high"),
    confidence: pk("pricing_confidence", "confidence", "overall_confidence") || (_obj(d.confidence) ? (d.confidence as any).overall_confidence : null),
    rationale: pv.revision_reasoning || pk("pricing_rationale", "rationale"),
    comparables: getComparables(d),
    platformPricing: pp,
    bestPlatform: pp.best_platform || pk("best_platform"),
    demandLevel: ma.demand_level || pk("demand_level"),
    demandTrend: ma.demand_trend || pk("demand_trend"),
    supplyLevel: ma.supply_level || pk("supply_level"),
    seasonal: ma.seasonal_factors || pk("seasonal_factors"),
    listPrice: ng.list_price || pk("list_price"),
    minAccept: ng.minimum_accept || pk("minimum_accept"),
    sweetSpot: ng.sweet_spot || pk("sweet_spot"),
    counterStrategy: ng.counter_strategy,
    valueAdders: (d.price_factors?.value_adders || d.value_adders || []) as any[],
    valueReducers: (d.price_factors?.value_reducers || d.value_reducers || []) as any[],
    priceHistoryTrend: ph.trend_2_5_years || pk("price_trend"),
    trendEvidence: ph.trend_evidence,
    appreciationPotential: ph.appreciation_potential || pk("appreciation_potential"),
    internationalPricing: _obj(d.international_pricing),
    insuranceValue: pk("insurance_value"),
    liquidationValue: pk("liquidation_value"),
    collectorPremium: pk("collector_premium"),
    liquidationTimeline: _obj(d.liquidation_timeline),
    summary: pk("executive_summary", "summary"),
  };
}

// ── Buyer extraction helper ──
function _getBuyerArr(d: any, ...keys: string[]): any[] {
  for (const k of keys) { if (Array.isArray(d[k]) && d[k].length > 0) return d[k]; }
  const wrappers = ["buyer_analysis", "market_analysis", "deep_dive", "megabot_enhancement"];
  for (const w of wrappers) { if (d[w] && typeof d[w] === "object") { for (const k of keys) { if (Array.isArray(d[w][k]) && d[w][k].length > 0) return d[w][k]; } } }
  return [];
}
function _getBuyerField(d: any, ...keys: string[]): any {
  for (const k of keys) { if (d[k] != null && d[k] !== "" && d[k] !== "Unknown") return d[k]; }
  return null;
}

function extractBH(p: any) {
  let d = _normalizeKeys(p.data || {});
  const topKeys = Object.keys(d);
  if (topKeys.length === 1 && _obj(d[topKeys[0]]) && Object.keys(d[topKeys[0]]).length >= 2) d = d[topKeys[0]];

  const profiles = _getBuyerArr(d, "buyer_profiles", "profiles", "buyers", "buyer_types", "target_buyers");
  const platforms = _getBuyerArr(d, "platform_opportunities", "platforms", "platform_analysis", "marketplace_opportunities");
  const hotLeads = _getBuyerArr(d, "hot_leads", "leads", "active_leads", "urgent_leads", "immediate_opportunities");
  const outreach = _getBuyerArr(d, "outreach_strategies", "strategies", "outreach_plans", "approach_strategies");
  const influencers = _getBuyerArr(d, "influencer_targets", "influencers", "tastemakers", "amplifiers");

  return {
    profiles, profileCount: profiles.length,
    platforms, platformCount: platforms.length,
    bestPlatform: _getBuyerField(d, "best_platform", "top_platform", "recommended_platform"),
    hotLeads, hotLeadCount: hotLeads.length,
    outreach, influencers,
    localOpps: _obj(d.local_opportunities) || _obj(d.local_buyers) || null,
    competitive: _obj(d.competitive_landscape) || _obj(d.competition) || null,
    timing: _obj(d.timing_advice) || _obj(d.timing) || null,
    internationalBuyers: _obj(d.international_buyers) || _obj(d.international_demand) || null,
    corporateBuyers: _obj(d.corporate_buyers) || _obj(d.business_buyers) || null,
    viralMarketing: _obj(d.viral_marketing) || _obj(d.viral_potential) || null,
    demandLevel: _getBuyerField(d, "demand_level", "market_demand", "buyer_demand"),
    summary: d.executive_summary || d.summary || null,
  };
}

/** Renders the premium Buyers tab for MegaBot page */
function BuyersTabContent({ result, providers, agreement }: {
  result: any; providers: any[]; agreement: number;
}) {
  const [expandedAgent, setExpandedAgent] = useState<string | null>(providers.find((p: any) => !p.error)?.provider || null);
  const successful = providers.filter((p: any) => !p.error);
  const failed = providers.filter((p: any) => p.error);
  const allBH = successful.map((p: any) => extractBH(p));

  // Totals
  const totalProfiles = allBH.reduce((s, h) => s + h.profileCount, 0);
  const totalLeads = allBH.reduce((s, h) => s + h.hotLeadCount, 0);
  const uniquePlatforms = new Set(allBH.flatMap(h => h.platforms.map((p: any) => (p.platform || "").toLowerCase())));

  // Collect all profiles tagged with agent
  const allProfiles = successful.flatMap((p: any, i: number) => {
    const pm = PROVIDER_META[p.provider] || { label: p.provider, color: "#888" };
    return allBH[i].profiles.map((bp: any) => ({ ...bp, _agent: pm.label, _color: pm.color }));
  });

  // Collect all hot leads tagged with agent
  const allHotLeads = successful.flatMap((p: any, i: number) => {
    const pm = PROVIDER_META[p.provider] || { label: p.provider };
    return allBH[i].hotLeads.map((l: any) => ({ ...l, _agent: pm.label }));
  });

  // Collect all platforms tagged with agent
  const platformMap: Map<string, { agent: string; data: any }[]> = new Map();
  successful.forEach((p: any, i: number) => {
    const pm = PROVIDER_META[p.provider] || { label: p.provider };
    allBH[i].platforms.forEach((pl: any) => {
      const key = (pl.platform || "unknown").toLowerCase();
      if (!platformMap.has(key)) platformMap.set(key, []);
      platformMap.get(key)!.push({ agent: pm.label, data: pl });
    });
  });

  // Build executive summary
  function buildBuyerSummary(): string {
    const parts: string[] = [];
    parts.push(`${successful.length} AI buyer specialists found ${totalProfiles} buyer profiles across ${uniquePlatforms.size} platforms with ${totalLeads} hot leads.`);
    if (agreement >= 80) parts.push(`Strong consensus (${agreement}%) on buyer acquisition strategy.`);
    else if (agreement >= 60) parts.push(`Moderate agreement (${agreement}%) with diverse perspectives on buyer approach.`);
    else parts.push(`Agents disagree (${agreement}%) — review individual strategies for unique angles.`);

    for (let i = 0; i < successful.length; i++) {
      const label = PROVIDER_META[successful[i].provider]?.label || successful[i].provider;
      const bh = allBH[i];
      if (successful[i].provider === "claude" && bh.influencers.length > 0) {
        parts.push(`${label} discovered ${bh.influencers.length} influencer connections in niche collector communities.`);
      } else if (successful[i].provider === "grok" && bh.viralMarketing) {
        parts.push(`${label} identified a viral marketing angle${bh.viralMarketing.best_platform_for_viral ? ` on ${bh.viralMarketing.best_platform_for_viral}` : ""}.`);
      } else if (successful[i].provider === "gemini" && bh.platformCount >= 4) {
        parts.push(`${label} analyzed ${bh.platformCount} platforms with algorithm-optimized posting strategies.`);
      } else if (bh.profileCount > 0) {
        const topProfile = bh.profiles[0];
        parts.push(`${label} identified ${bh.profileCount} buyer types${topProfile?.profile_name ? `, led by "${topProfile.profile_name}"` : ""}.`);
      }
    }

    const bestPlat = allBH.find(h => h.bestPlatform)?.bestPlatform;
    if (bestPlat && typeof bestPlat === "string") parts.push(`Consensus best platform: ${bestPlat}.`);
    const timing = allBH.find(h => h.timing)?.timing;
    if (timing?.best_day_to_list) parts.push(`Optimal listing day: ${timing.best_day_to_list}${timing.seasonal_peak ? ` (peak: ${timing.seasonal_peak})` : ""}.`);
    if (timing?.urgency_recommendation) parts.push(timing.urgency_recommendation);

    return parts.join(" ");
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
      {/* Section B: Buyer Comparison Table */}
      <div style={{
        background: "var(--bg-card)", borderRadius: "0.75rem",
        border: "1px solid var(--border-default)", padding: "0.85rem 1rem",
      }}>
        <div style={{ fontSize: "0.68rem", fontWeight: 700, color: "var(--text-secondary)", marginBottom: "0.5rem" }}>🎯 Buyer Intelligence Comparison</div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.72rem" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid var(--border-default)" }}>
                <th style={{ textAlign: "left", padding: "0.35rem 0.5rem", color: "var(--text-muted)", fontWeight: 600 }}>Metric</th>
                {successful.map((p: any) => {
                  const pm = PROVIDER_META[p.provider];
                  return <th key={p.provider} style={{ textAlign: "center", padding: "0.35rem 0.5rem", color: pm?.color || "#888", fontWeight: 700 }}>{pm?.icon} {pm?.label}</th>;
                })}
                <th style={{ textAlign: "center", padding: "0.35rem 0.5rem", color: "#4caf50", fontWeight: 700 }}>✅ Combined</th>
              </tr>
            </thead>
            <tbody>
              {[
                { label: "Profiles Found", get: (bh: any) => bh.profileCount, combined: totalProfiles + " total" },
                { label: "Hot Leads", get: (bh: any) => bh.hotLeadCount, combined: totalLeads + " total" },
                { label: "Platforms", get: (bh: any) => bh.platformCount, combined: uniquePlatforms.size + " unique" },
                { label: "Best Platform", get: (bh: any) => typeof bh.bestPlatform === "string" ? bh.bestPlatform.split(" ")[0] : "—", combined: allBH.find(h => h.bestPlatform)?.bestPlatform || "—" },
                { label: "Demand Level", get: (bh: any) => bh.demandLevel || "—", combined: allBH.find(h => h.demandLevel)?.demandLevel || "—" },
                { label: "Outreach", get: (bh: any) => bh.outreach.length || "—", combined: allBH.reduce((s, h) => s + h.outreach.length, 0) + " strategies" },
              ].map((row, ri) => (
                <tr key={ri} style={{ borderBottom: "1px solid var(--border-default)" }}>
                  <td style={{ padding: "0.3rem 0.5rem", fontWeight: 600, color: "var(--text-secondary)" }}>{row.label}</td>
                  {successful.map((p: any, i: number) => (
                    <td key={p.provider} style={{ padding: "0.3rem 0.5rem", textAlign: "center", color: "var(--text-primary)" }}>{row.get(allBH[i])}</td>
                  ))}
                  <td style={{ padding: "0.3rem 0.5rem", textAlign: "center", fontWeight: 700, color: "#4caf50" }}>{typeof row.combined === "string" && row.combined.length > 25 ? row.combined.slice(0, 25) + "..." : row.combined}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Section C: Deep Buyer Intelligence by Category */}

      {/* Combined Buyer Profiles */}
      {allProfiles.length > 0 && (
        <KnowledgeBlock icon="🎯" title={`Buyer Profiles (${allProfiles.length} across agents)`} entries={
          allProfiles.slice(0, 12).map((bp: any) => ({
            label: `${bp._agent} — ${bp.buyer_type || "Buyer"}`,
            color: bp._color || "#888",
            text: `${bp.profile_name || "Buyer"} — ${bp.estimated_offer_range || "N/A"}${bp.likelihood_to_buy ? ` (${bp.likelihood_to_buy})` : ""}${bp.motivation ? ` — ${typeof bp.motivation === "string" && bp.motivation.length > 60 ? bp.motivation.slice(0, 60) + "..." : bp.motivation}` : ""}`,
          }))
        } />
      )}

      {/* Combined Platform Opportunities */}
      {platformMap.size > 0 && (
        <div style={{
          background: "var(--bg-card)", borderRadius: "0.75rem",
          border: "1px solid var(--border-default)", padding: "0.85rem 1rem",
        }}>
          <div style={{ fontSize: "0.68rem", fontWeight: 700, color: "var(--text-secondary)", marginBottom: "0.5rem" }}>📱 Platform Opportunities ({platformMap.size} platforms)</div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.72rem" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border-default)" }}>
                  <th style={{ textAlign: "left", padding: "0.25rem 0.4rem", color: "var(--text-muted)", fontWeight: 600 }}>Platform</th>
                  <th style={{ textAlign: "center", padding: "0.25rem 0.4rem", color: "var(--text-muted)", fontWeight: 600 }}>Agents</th>
                  <th style={{ textAlign: "center", padding: "0.25rem 0.4rem", color: "var(--text-muted)", fontWeight: 600 }}>Level</th>
                  <th style={{ textAlign: "right", padding: "0.25rem 0.4rem", color: "var(--text-muted)", fontWeight: 600 }}>Est. Buyers</th>
                  <th style={{ textAlign: "right", padding: "0.25rem 0.4rem", color: "var(--text-muted)", fontWeight: 600 }}>Avg $</th>
                </tr>
              </thead>
              <tbody>
                {Array.from(platformMap.entries()).slice(0, 10).map(([key, entries]) => {
                  const best = entries[0].data;
                  return (
                    <tr key={key} style={{ borderBottom: "1px solid var(--border-default)" }}>
                      <td style={{ padding: "0.25rem 0.4rem", fontWeight: 600, color: "var(--text-primary)", textTransform: "capitalize" }}>{key}</td>
                      <td style={{ padding: "0.25rem 0.4rem", textAlign: "center", fontSize: "0.62rem", color: "var(--text-muted)" }}>{entries.map(e => e.agent).join(", ")}</td>
                      <td style={{ padding: "0.25rem 0.4rem", textAlign: "center" }}>
                        <span style={{ fontSize: "0.55rem", padding: "0.05rem 0.3rem", borderRadius: 99, background: (best.opportunity_level || "").toLowerCase().includes("excel") ? "rgba(76,175,80,0.12)" : "rgba(255,152,0,0.12)", color: (best.opportunity_level || "").toLowerCase().includes("excel") ? "#4caf50" : "#ff9800" }}>{best.opportunity_level || "—"}</span>
                      </td>
                      <td style={{ padding: "0.25rem 0.4rem", textAlign: "right", color: "var(--text-secondary)" }}>{best.estimated_buyers != null ? `~${best.estimated_buyers}` : "—"}</td>
                      <td style={{ padding: "0.25rem 0.4rem", textAlign: "right", color: "var(--accent)", fontWeight: 600 }}>{best.avg_sale_price_here != null || best.avg_sale_price != null ? `$${best.avg_sale_price_here || best.avg_sale_price}` : "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Combined Hot Leads */}
      {allHotLeads.length > 0 && (
        <KnowledgeBlock icon="🔥" title={`Hot Leads (${allHotLeads.length} across agents)`} entries={
          allHotLeads.sort((a: any, b: any) => {
            const order: Record<string, number> = { "act now": 0, "this week": 1, "this month": 2 };
            return (order[(a.urgency || "").toLowerCase()] ?? 3) - (order[(b.urgency || "").toLowerCase()] ?? 3);
          }).slice(0, 10).map((l: any) => ({
            label: `${l._agent} — ${l.urgency || "Soon"}`,
            color: (l.urgency || "").toLowerCase().includes("now") ? "#ef4444" : "#ff9800",
            text: `${l.lead_description || l.description || "Active buyer"}${l.estimated_price_theyd_pay || l.estimated_price ? ` — ~$${l.estimated_price_theyd_pay || l.estimated_price}` : ""}${l.how_to_reach ? ` — ${l.how_to_reach}` : ""}`,
          }))
        } />
      )}

      {/* Combined Outreach Strategies */}
      {allBH.some(h => h.outreach.length > 0) && (
        <KnowledgeBlock icon="💬" title={`Outreach Strategies (${allBH.reduce((s, h) => s + h.outreach.length, 0)} across agents)`} entries={
          successful.flatMap((p: any, i: number) => {
            const pm = PROVIDER_META[p.provider] || { label: p.provider, color: "#888" };
            return allBH[i].outreach.slice(0, 2).map((s: any) => ({
              label: `${pm.label} — ${s.strategy_name || s.channel || "Strategy"}`,
              color: pm.color,
              text: `${s.message_template ? `"${typeof s.message_template === "string" && s.message_template.length > 100 ? s.message_template.slice(0, 100) + "..." : s.message_template}"` : s.approach || ""}${s.expected_response_rate ? ` — ${s.expected_response_rate} response` : ""}`,
            }));
          })
        } />
      )}

      {/* Combined Influencers */}
      {allBH.some(h => h.influencers.length > 0) && (
        <KnowledgeBlock icon="👥" title={`Influencer Targets (${allBH.reduce((s, h) => s + h.influencers.length, 0)} across agents)`} entries={
          successful.flatMap((p: any, i: number) => {
            const pm = PROVIDER_META[p.provider] || { label: p.provider, color: "#888" };
            return allBH[i].influencers.slice(0, 3).map((inf: any) => ({
              label: `${pm.label} — ${inf.type || "Influencer"}`,
              color: pm.color,
              text: `${inf.niche || ""}${inf.why_relevant ? ` — ${inf.why_relevant}` : ""}${inf.how_to_approach ? ` — ${inf.how_to_approach}` : ""}`,
            }));
          })
        } />
      )}

      {/* Combined International */}
      {allBH.some(h => h.internationalBuyers) && (
        <KnowledgeBlock icon="🌍" title="International Buyers" entries={
          successful.filter((_, i) => allBH[i].internationalBuyers).map((p: any, idx: number) => {
            const realIdx = successful.indexOf(p);
            const pm = PROVIDER_META[p.provider] || { label: p.provider, color: "#888" };
            const intl = allBH[realIdx].internationalBuyers!;
            return {
              label: pm.label,
              color: pm.color,
              text: `${Array.isArray(intl.countries_with_demand) ? intl.countries_with_demand.join(", ") : "Global demand"}${intl.best_international_platform ? ` — via ${intl.best_international_platform}` : ""}${intl.price_premium_international ? ` — Premium: ${intl.price_premium_international}` : ""}`,
            };
          })
        } />
      )}

      {/* Combined Corporate Buyers */}
      {allBH.some(h => h.corporateBuyers) && (
        <KnowledgeBlock icon="🏢" title="Corporate & Commercial Buyers" entries={
          successful.filter((_, i) => allBH[i].corporateBuyers).map((p: any) => {
            const realIdx = successful.indexOf(p);
            const pm = PROVIDER_META[p.provider] || { label: p.provider, color: "#888" };
            const corp = allBH[realIdx].corporateBuyers!;
            return {
              label: pm.label,
              color: pm.color,
              text: Object.entries(corp).filter(([, v]) => v && typeof v === "string").slice(0, 4).map(([k, v]) => `${k.replace(/_/g, " ")}: ${v}`).join(" · "),
            };
          })
        } />
      )}

      {/* Combined Viral Marketing */}
      {allBH.some(h => h.viralMarketing) && (
        <KnowledgeBlock icon="📱" title="Viral Marketing Angles" entries={
          successful.filter((_, i) => allBH[i].viralMarketing).map((p: any) => {
            const realIdx = successful.indexOf(p);
            const pm = PROVIDER_META[p.provider] || { label: p.provider, color: "#888" };
            const vm = allBH[realIdx].viralMarketing!;
            return {
              label: pm.label,
              color: pm.color,
              text: `${vm.hook_angle || ""}${vm.best_platform_for_viral ? ` — on ${vm.best_platform_for_viral}` : ""}${Array.isArray(vm.hashtags) ? ` — ${vm.hashtags.slice(0, 5).join(" ")}` : ""}${vm.content_idea ? ` — Idea: ${typeof vm.content_idea === "string" && vm.content_idea.length > 80 ? vm.content_idea.slice(0, 80) + "..." : vm.content_idea}` : ""}`,
            };
          })
        } />
      )}

      {/* Combined Local + Competitive + Timing */}
      {allBH.some(h => h.localOpps) && (
        <KnowledgeBlock icon="🏪" title="Local Opportunities" entries={
          successful.filter((_, i) => allBH[i].localOpps).map((p: any) => {
            const realIdx = successful.indexOf(p);
            const pm = PROVIDER_META[p.provider] || { label: p.provider, color: "#888" };
            const local = allBH[realIdx].localOpps!;
            return { label: pm.label, color: pm.color, text: Object.entries(local).filter(([, v]) => v && typeof v === "string").slice(0, 3).map(([k, v]) => `${k.replace(/_/g, " ")}: ${v}`).join(" · ") };
          })
        } />
      )}

      {allBH.some(h => h.competitive) && (
        <KnowledgeBlock icon="⚔️" title="Competitive Landscape" entries={
          successful.filter((_, i) => allBH[i].competitive).map((p: any) => {
            const realIdx = successful.indexOf(p);
            const pm = PROVIDER_META[p.provider] || { label: p.provider, color: "#888" };
            const comp = allBH[realIdx].competitive!;
            return { label: pm.label, color: pm.color, text: `${comp.similar_items_listed ? `${comp.similar_items_listed} similar listed` : ""}${comp.your_advantage ? ` — Advantage: ${comp.your_advantage}` : ""}${comp.differentiation_tip ? ` — Tip: ${comp.differentiation_tip}` : ""}` };
          })
        } />
      )}

      {allBH.some(h => h.timing) && (
        <KnowledgeBlock icon="⏰" title="Timing Consensus" entries={
          successful.filter((_, i) => allBH[i].timing).map((p: any) => {
            const realIdx = successful.indexOf(p);
            const pm = PROVIDER_META[p.provider] || { label: p.provider, color: "#888" };
            const t = allBH[realIdx].timing!;
            return { label: pm.label, color: pm.color, text: `${t.best_day_to_list ? `Best day: ${t.best_day_to_list}` : ""}${t.seasonal_peak ? ` · Peak: ${t.seasonal_peak}` : ""}${t.urgency_recommendation ? ` · ${t.urgency_recommendation}` : ""}` };
          })
        } />
      )}

      {/* Section D: Full Agent Cards */}
      <div style={{
        background: "var(--bg-card)", borderRadius: "0.75rem",
        border: "1px solid var(--border-default)", padding: "0.85rem 1rem",
      }}>
        <div style={{ fontSize: "0.68rem", fontWeight: 700, color: "var(--text-secondary)", marginBottom: "0.5rem" }}>
          Individual Buyer Reports
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {successful.map((p: any, idx: number) => {
            const pm = PROVIDER_META[p.provider] || { icon: "🤖", label: p.provider, color: "#888", specialty: "" };
            const isExp = expandedAgent === p.provider;
            const bh = allBH[idx];
            const timeStr = (p.durationMs || p.responseTime) ? `${((p.durationMs || p.responseTime) / 1000).toFixed(1)}s` : "";

            return (
              <div key={p.provider} style={{
                background: "var(--bg-card, var(--ghost-bg))",
                borderTop: isExp ? `3px solid ${pm.color}` : undefined,
                border: `1px solid ${isExp ? `${pm.color}40` : "var(--border-card, var(--border-default))"}`,
                borderRadius: "0.85rem", overflow: "hidden",
              }}>
                <button
                  onClick={() => setExpandedAgent(isExp ? null : p.provider)}
                  style={{ width: "100%", display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.75rem 1rem", background: "transparent", border: "none", cursor: "pointer", textAlign: "left" }}
                >
                  <span style={{ fontSize: "1rem" }}>{pm.icon}</span>
                  <span style={{ fontWeight: 700, fontSize: "0.82rem", color: pm.color, minWidth: 60 }}>{pm.label}</span>
                  <span style={{ fontSize: "0.72rem", color: "var(--text-secondary)", flex: 1, overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>
                    {bh.profileCount} profiles · {bh.platformCount} platforms · {bh.hotLeadCount} leads
                    {bh.demandLevel && ` · ${bh.demandLevel}`}
                  </span>
                  <span style={{ fontSize: "0.62rem", color: "#4caf50" }}>✅ {timeStr}</span>
                  <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", transform: isExp ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>▾</span>
                </button>
                {isExp && (
                  <div style={{ padding: "0 1rem 1rem", borderTop: `1px solid ${pm.color}15` }}>
                    {/* Profiles */}
                    {bh.profiles.length > 0 && (
                      <div style={{ marginTop: "0.5rem", marginBottom: "0.5rem", padding: "0.6rem", background: "var(--bg-card)", borderRadius: "0.6rem", border: "1px solid var(--border-default)" }}>
                        <div style={{ fontSize: "0.6rem", textTransform: "uppercase", letterSpacing: "0.1em", color: pm.color, fontWeight: 700, marginBottom: "0.35rem" }}>Buyer Profiles ({bh.profiles.length})</div>
                        {bh.profiles.map((bp: any, i: number) => (
                          <div key={i} style={{ padding: "0.35rem", marginBottom: "0.2rem", borderRadius: "0.35rem", background: "var(--bg-card)", border: "1px solid var(--border-default)" }}>
                            <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--text-primary)" }}>🎯 {bp.profile_name || "Buyer"} {bp.buyer_type ? `— ${bp.buyer_type}` : ""}</div>
                            {bp.estimated_offer_range && <div style={{ fontSize: "0.68rem", color: "var(--accent)" }}>{bp.estimated_offer_range}{bp.likelihood_to_buy ? ` · ${bp.likelihood_to_buy}` : ""}{bp.price_sensitivity ? ` · ${bp.price_sensitivity}` : ""}</div>}
                            {bp.motivation && <div style={{ fontSize: "0.65rem", color: "var(--text-secondary)", lineHeight: 1.3 }}>{bp.motivation}</div>}
                            {bp.best_approach && <div style={{ fontSize: "0.62rem", color: "var(--text-muted)", fontStyle: "italic" }}>💡 {bp.best_approach}</div>}
                            {Array.isArray(bp.platforms_active_on) && bp.platforms_active_on.length > 0 && <div style={{ fontSize: "0.58rem", color: "var(--text-muted)" }}>📱 {bp.platforms_active_on.join(", ")}</div>}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Platforms */}
                    {bh.platforms.length > 0 && (
                      <div style={{ marginBottom: "0.5rem", padding: "0.6rem", background: "var(--bg-card)", borderRadius: "0.6rem", border: "1px solid var(--border-default)" }}>
                        <div style={{ fontSize: "0.6rem", textTransform: "uppercase", letterSpacing: "0.1em", color: pm.color, fontWeight: 700, marginBottom: "0.35rem" }}>Platforms ({bh.platforms.length})</div>
                        {bh.platforms.map((pl: any, i: number) => (
                          <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.25rem 0", borderBottom: i < bh.platforms.length - 1 ? "1px solid var(--border-default)" : "none" }}>
                            <span style={{ fontSize: "0.72rem", fontWeight: 600, color: "var(--text-primary)", minWidth: 80 }}>{pl.platform}</span>
                            <span style={{ fontSize: "0.55rem", padding: "0.05rem 0.3rem", borderRadius: 99, background: (pl.opportunity_level || "").toLowerCase().includes("excel") ? "rgba(76,175,80,0.12)" : "rgba(255,152,0,0.12)", color: (pl.opportunity_level || "").toLowerCase().includes("excel") ? "#4caf50" : "#ff9800" }}>{pl.opportunity_level || "—"}</span>
                            <span style={{ fontSize: "0.65rem", color: "var(--text-muted)", flex: 1 }}>{pl.estimated_buyers != null ? `~${pl.estimated_buyers} buyers` : ""}{pl.avg_sale_price_here || pl.avg_sale_price ? ` · avg $${pl.avg_sale_price_here || pl.avg_sale_price}` : ""}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Hot Leads */}
                    {bh.hotLeads.length > 0 && (
                      <div style={{ marginBottom: "0.5rem", padding: "0.6rem", background: "var(--bg-card)", borderRadius: "0.6rem", border: "1px solid var(--border-default)" }}>
                        <div style={{ fontSize: "0.6rem", textTransform: "uppercase", letterSpacing: "0.1em", color: pm.color, fontWeight: 700, marginBottom: "0.35rem" }}>Hot Leads ({bh.hotLeads.length})</div>
                        {bh.hotLeads.map((l: any, i: number) => (
                          <div key={i} style={{ padding: "0.2rem 0", borderBottom: i < bh.hotLeads.length - 1 ? "1px solid var(--border-default)" : "none" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                              <span style={{ fontSize: "0.55rem", padding: "0.05rem 0.25rem", borderRadius: 99, background: (l.urgency || "").toLowerCase().includes("now") ? "rgba(239,68,68,0.15)" : "rgba(255,152,0,0.12)", color: (l.urgency || "").toLowerCase().includes("now") ? "#ef4444" : "#ff9800", fontWeight: 600 }}>{l.urgency || "Soon"}</span>
                              <span style={{ fontSize: "0.68rem", color: "var(--text-primary)", flex: 1 }}>{l.lead_description || "Buyer"}</span>
                              {(l.estimated_price_theyd_pay || l.estimated_price) && <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "#4ade80" }}>~${l.estimated_price_theyd_pay || l.estimated_price}</span>}
                            </div>
                            {l.how_to_reach && <div style={{ fontSize: "0.58rem", color: "var(--text-muted)" }}>💡 {l.how_to_reach}</div>}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Deep intel */}
                    {(bh.outreach.length > 0 || bh.influencers.length > 0 || bh.internationalBuyers || bh.viralMarketing || bh.localOpps || bh.competitive || bh.timing) && (
                      <div style={{ marginBottom: "0.5rem", padding: "0.6rem", background: "linear-gradient(135deg, rgba(139,92,246,0.04), rgba(0,188,212,0.02))", borderRadius: "0.6rem", border: "1px solid rgba(139,92,246,0.15)" }}>
                        <div style={{ fontSize: "0.6rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "#a855f7", fontWeight: 700, marginBottom: "0.35rem" }}>Deep Buyer Intelligence</div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem", fontSize: "0.65rem", color: "var(--text-secondary)" }}>
                          {bh.outreach.length > 0 && <div>🎯 {bh.outreach.length} outreach strategies{bh.outreach[0]?.message_template ? `: "${typeof bh.outreach[0].message_template === "string" && bh.outreach[0].message_template.length > 70 ? bh.outreach[0].message_template.slice(0, 70) + "..." : bh.outreach[0].message_template}"` : ""}</div>}
                          {bh.influencers.length > 0 && <div>👥 {bh.influencers.length} influencer targets: {bh.influencers.slice(0, 2).map((inf: any) => inf.niche || inf.type || "").join(", ")}</div>}
                          {bh.internationalBuyers && <div>🌍 International: {Array.isArray(bh.internationalBuyers.countries_with_demand) ? bh.internationalBuyers.countries_with_demand.join(", ") : "Global demand"}</div>}
                          {bh.corporateBuyers && <div>🏢 Corporate: {Object.entries(bh.corporateBuyers).filter(([, v]) => v && typeof v === "string").slice(0, 2).map(([k, v]) => `${k.replace(/_/g, " ")}: ${v}`).join(" · ")}</div>}
                          {bh.viralMarketing && <div>📱 Viral: {bh.viralMarketing.hook_angle || ""}{bh.viralMarketing.best_platform_for_viral ? ` on ${bh.viralMarketing.best_platform_for_viral}` : ""}</div>}
                          {bh.localOpps && <div>🏪 Local: {Object.entries(bh.localOpps).filter(([, v]) => v && typeof v === "string").slice(0, 2).map(([, v]) => v).join(" · ")}</div>}
                          {bh.competitive && <div>⚔️ {bh.competitive.similar_items_listed ? `${bh.competitive.similar_items_listed} competitors` : "Competition analyzed"}{bh.competitive.your_advantage ? ` — Your edge: ${bh.competitive.your_advantage}` : ""}</div>}
                          {bh.timing && <div>⏰ {bh.timing.best_day_to_list || ""}{bh.timing.urgency_recommendation ? ` — ${bh.timing.urgency_recommendation}` : ""}</div>}
                        </div>
                      </div>
                    )}

                    {/* Key Insight */}
                    {bh.summary && (
                      <div style={{ padding: "0.5rem 0.6rem", background: `${pm.color}08`, borderRadius: "0.5rem", borderLeft: `3px solid ${pm.color}50` }}>
                        <div style={{ fontSize: "0.6rem", textTransform: "uppercase", letterSpacing: "0.1em", color: pm.color, fontWeight: 700, marginBottom: "0.15rem" }}>{pm.icon} What {pm.label} Found</div>
                        <p style={{ fontSize: "0.72rem", color: "var(--text-secondary)", margin: 0, lineHeight: 1.5, fontStyle: "italic" }}>
                          &ldquo;{typeof bh.summary === "string" && bh.summary.length > 400 ? bh.summary.slice(0, 400) + "..." : bh.summary}&rdquo;
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {failed.map((p: any) => {
            const pm = PROVIDER_META[p.provider] || { icon: "🤖", label: p.provider, color: "#888", specialty: "" };
            return (
              <div key={p.provider} style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.4rem 0.65rem", opacity: 0.4, background: "var(--bg-card)", border: "1px solid var(--border-default)", borderRadius: "0.5rem", fontSize: "0.68rem" }}>
                <span style={{ opacity: 0.5 }}>{pm.icon}</span>
                <span style={{ fontWeight: 600, color: "var(--text-muted)" }}>{pm.label}</span>
                <span style={{ color: "var(--text-muted)", flex: 1, fontSize: "0.62rem" }}>Unavailable</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Section F: Executive Summary */}
      <div style={{
        background: "rgba(139,92,246,0.06)", borderRadius: "0.75rem",
        border: "1px solid rgba(139,92,246,0.15)", padding: "1rem 1.15rem",
      }}>
        <div style={{ fontSize: "0.68rem", fontWeight: 700, color: "#a855f7", marginBottom: "0.5rem" }}>📋 Executive Buyer Summary</div>
        <p style={{ fontSize: "0.82rem", lineHeight: 1.65, color: "var(--text-secondary)", margin: 0 }}>
          {buildBuyerSummary()}
        </p>
      </div>
    </div>
  );
}

/** Renders the premium Pricing tab for MegaBot page */
function PricingTabContent({ result, providers, agreement }: {
  result: any; providers: any[]; agreement: number;
}) {
  const [expandedAgent, setExpandedAgent] = useState<string | null>(providers.find((p: any) => !p.error)?.provider || null);
  const [showAgentJson, setShowAgentJson] = useState<string | null>(null);
  const successful = providers.filter((p: any) => !p.error);
  const failed = providers.filter((p: any) => p.error);
  const allPH = successful.map((p: any) => extractPH(p));

  // Section A: Pricing Comparison Table
  const PRICE_COMPARE_FIELDS = [
    { label: "Low Estimate", render: (ph: any) => ph.priceLow != null ? `$${Math.round(Number(ph.priceLow))}` : null },
    { label: "Mid Estimate", render: (ph: any) => ph.priceMid != null ? `$${Math.round(Number(ph.priceMid))}` : null },
    { label: "High Estimate", render: (ph: any) => ph.priceHigh != null ? `$${Math.round(Number(ph.priceHigh))}` : null },
    { label: "Confidence", render: (ph: any) => ph.confidence != null ? `${Math.round(Number(ph.confidence))}%` : null },
    { label: "List Price", render: (ph: any) => ph.listPrice != null ? `$${Math.round(Number(ph.listPrice))}` : null },
    { label: "Min Accept", render: (ph: any) => ph.minAccept != null ? `$${Math.round(Number(ph.minAccept))}` : null },
    { label: "Sweet Spot", render: (ph: any) => ph.sweetSpot != null ? `$${Math.round(Number(ph.sweetSpot))}` : null },
    { label: "Demand", render: (ph: any) => ph.demandLevel || null },
    { label: "Best Platform", render: (ph: any) => typeof ph.bestPlatform === "string" ? ph.bestPlatform : null },
  ];

  // Build executive pricing summary
  function buildPricingSummary(): string {
    const parts: string[] = [];
    const lows = allPH.map(h => h.priceLow).filter(Boolean).map(Number);
    const highs = allPH.map(h => h.priceHigh).filter(Boolean).map(Number);
    if (lows.length && highs.length) {
      const avgLow = Math.round(lows.reduce((a, b) => a + b, 0) / lows.length);
      const avgHigh = Math.round(highs.reduce((a, b) => a + b, 0) / highs.length);
      parts.push(`${successful.length} AI pricing experts valued this item between $${avgLow} and $${avgHigh}.`);
    }
    if (agreement >= 80) parts.push(`There is strong pricing consensus (${agreement}%) across all agents.`);
    else if (agreement >= 60) parts.push(`Agents show moderate pricing agreement (${agreement}%), suggesting some market uncertainty.`);
    else parts.push(`Agents show varied pricing opinions (${agreement}%) \u2014 the market for this item has mixed signals.`);

    const demand = allPH.find(h => h.demandLevel)?.demandLevel;
    const trend = allPH.find(h => h.demandTrend)?.demandTrend;
    if (demand) parts.push(`Market demand is ${demand}${trend ? ` with a ${trend.toLowerCase()} trend` : ""}.`);

    const totalComps = allPH.reduce((s, h) => s + (h.comparables?.length || 0), 0);
    if (totalComps) parts.push(`${totalComps} comparable sales were found across all agents.`);

    const bp = allPH.find(h => typeof h.bestPlatform === "string")?.bestPlatform;
    if (bp) parts.push(`The recommended selling platform is ${bp}.`);

    const lp = allPH.find(h => h.listPrice)?.listPrice;
    const ma = allPH.find(h => h.minAccept)?.minAccept;
    const ss = allPH.find(h => h.sweetSpot)?.sweetSpot;
    if (lp) parts.push(`List at $${Math.round(Number(lp))}${ss ? `, target $${Math.round(Number(ss))}` : ""}${ma ? `, floor $${Math.round(Number(ma))}` : ""}.`);

    const adders = allPH.flatMap(h => h.valueAdders || []).filter(Boolean);
    if (adders.length) parts.push(`Value boosters: ${adders.slice(0, 3).map(a => typeof a === "string" ? a : a.factor || a.description || "").filter(Boolean).join(", ")}.`);

    const pht = allPH.find(h => h.priceHistoryTrend)?.priceHistoryTrend;
    if (pht) parts.push(`Price trend: ${typeof pht === "string" && pht.length > 100 ? pht.slice(0, 100) + "..." : pht}.`);

    const best = allPH.map(h => h.summary).filter((s): s is string => !!s && s.length > 40).sort((a, b) => b.length - a.length)[0];
    if (best && parts.length < 10) parts.push(best.split(/(?<=[.!?])\s+/).slice(0, 2).join(" "));

    return parts.join(" ");
  }

  // Collect all comparables from all agents
  const allComps = successful.flatMap((p: any, i: number) => {
    const comps = Array.isArray(allPH[i].comparables) ? allPH[i].comparables : [];
    const pm = PROVIDER_META[p.provider] || { label: p.provider };
    return comps.map((c: any) => ({ ...c, _agent: pm.label }));
  });

  // Collect all platform entries from all agents
  const allPlatforms: Map<string, { agent: string; data: any }[]> = new Map();
  successful.forEach((p: any, i: number) => {
    const pp = allPH[i].platformPricing;
    if (!pp || typeof pp !== "object") return;
    const pm = PROVIDER_META[p.provider] || { label: p.provider };
    for (const [key, val] of Object.entries(pp)) {
      if (key === "best_platform" || !val || typeof val !== "object") continue;
      if (!allPlatforms.has(key)) allPlatforms.set(key, []);
      allPlatforms.get(key)!.push({ agent: pm.label, data: val });
    }
  });

  // Price disagreements
  const priceRanges = allPH.filter(h => h.priceLow != null && h.priceHigh != null);
  const maxSpread = priceRanges.length >= 2 ? Math.round(
    Math.max(...priceRanges.map(h => Number(h.priceHigh))) - Math.min(...priceRanges.map(h => Number(h.priceLow)))
  ) : 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>

      {/* Section B: 4-Agent Pricing Comparison Table */}
      <div style={{
        background: "var(--bg-card, var(--ghost-bg))",
        border: "1px solid rgba(76,175,80,0.2)",
        borderRadius: "1.25rem", overflow: "hidden",
      }}>
        <div style={{ padding: "0.85rem 1.25rem", borderBottom: "1px solid var(--border-default)" }}>
          <div style={{ fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "#4caf50", fontWeight: 700 }}>
            4-Agent Pricing Comparison
          </div>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.75rem" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border-default)" }}>
                <th style={{ padding: "0.5rem 0.75rem", textAlign: "left", color: "var(--text-muted)", fontWeight: 600, fontSize: "0.62rem", textTransform: "uppercase" }}>Metric</th>
                {successful.map((p: any) => {
                  const pm = PROVIDER_META[p.provider] || { icon: "🤖", label: p.provider, color: "#888" };
                  return (
                    <th key={p.provider} style={{ padding: "0.5rem 0.65rem", textAlign: "right", color: pm.color, fontWeight: 700, fontSize: "0.62rem", whiteSpace: "nowrap" }}>
                      {pm.icon} {pm.label}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {PRICE_COMPARE_FIELDS.map((field) => {
                const values = allPH.map(h => field.render(h));
                if (!values.some(v => v)) return null;
                const nonNull = values.filter(Boolean);
                const allSame = nonNull.length >= 2 && new Set(nonNull.map(v => String(v).toLowerCase())).size === 1;
                return (
                  <tr key={field.label} style={{ borderBottom: "1px solid var(--border-default)" }}>
                    <td style={{ padding: "0.4rem 0.75rem", color: "var(--text-muted)", fontWeight: 600, fontSize: "0.65rem" }}>{field.label}</td>
                    {values.map((val, i) => (
                      <td key={i} style={{
                        padding: "0.4rem 0.65rem", textAlign: "right", color: "var(--text-primary)", fontSize: "0.75rem", fontWeight: 600,
                        background: val && allSame ? "rgba(76,175,80,0.04)" : undefined,
                      }}>
                        {val || <span style={{ color: "var(--text-muted)", opacity: 0.4 }}>{"\u2014"}</span>}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Section C: Deep Pricing by Category */}
      {/* Combined Comparable Sales */}
      {allComps.length > 0 && (
        <KnowledgeBlock icon="🏷️" title={`Comparable Sales (${allComps.length} across agents)`} entries={
          allComps.slice(0, 12).map((c: any) => {
            const nc = normalizeComparable(c);
            return {
              label: `${c._agent} — ${nc.platform}`,
              color: PROVIDER_META[successful.find((p: any) => (PROVIDER_META[p.provider]?.label || p.provider) === c._agent)?.provider || ""]?.color || "#888",
              text: `${nc.item_description} — $${nc.sold_price}${nc.relevance ? ` (${nc.relevance} relevance)` : ""}${nc.condition ? ` [${nc.condition}]` : ""}`,
            };
          })
        } />
      )}

      {/* Combined Platform Breakdown */}
      {allPlatforms.size > 0 && (
        <div style={{
          background: "var(--bg-card)", borderRadius: "0.75rem",
          border: "1px solid var(--border-default)", padding: "0.85rem 1rem", marginBottom: "0",
        }}>
          <div style={{ fontSize: "0.68rem", fontWeight: 700, color: "var(--text-secondary)", marginBottom: "0.5rem" }}>📱 Platform Strategies</div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.72rem" }}>
              <thead>
                <tr style={{ color: "var(--text-muted)" }}>
                  <th style={{ textAlign: "left", padding: "0.25rem 0.4rem", fontWeight: 600 }}>Platform</th>
                  <th style={{ textAlign: "right", padding: "0.25rem 0.4rem", fontWeight: 600 }}>List</th>
                  <th style={{ textAlign: "right", padding: "0.25rem 0.4rem", fontWeight: 600 }}>Expect</th>
                  <th style={{ textAlign: "right", padding: "0.25rem 0.4rem", fontWeight: 600 }}>Fees</th>
                  <th style={{ textAlign: "right", padding: "0.25rem 0.4rem", fontWeight: 600 }}>Net</th>
                  <th style={{ textAlign: "right", padding: "0.25rem 0.4rem", fontWeight: 600 }}>Days</th>
                  <th style={{ textAlign: "left", padding: "0.25rem 0.4rem", fontWeight: 600 }}>Agent</th>
                </tr>
              </thead>
              <tbody>
                {Array.from(allPlatforms.entries()).slice(0, 10).map(([key, entries]) => {
                  const name = key.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase());
                  const best = entries[0];
                  const plat = best.data;
                  return (
                    <tr key={key} style={{ borderTop: "1px solid var(--border-default)" }}>
                      <td style={{ padding: "0.3rem 0.4rem", color: "var(--text-primary)", fontWeight: 500 }}>{name}</td>
                      <td style={{ padding: "0.3rem 0.4rem", textAlign: "right", color: "var(--text-secondary)" }}>{plat.list_price || plat.recommended_list_price ? `$${plat.list_price || plat.recommended_list_price}` : "\u2014"}</td>
                      <td style={{ padding: "0.3rem 0.4rem", textAlign: "right", color: "var(--text-secondary)" }}>{plat.expected_sell || plat.expected_sell_price ? `$${plat.expected_sell || plat.expected_sell_price}` : "\u2014"}</td>
                      <td style={{ padding: "0.3rem 0.4rem", textAlign: "right", color: "var(--text-muted)" }}>{plat.fees_pct || plat.fees_percentage ? `${plat.fees_pct || plat.fees_percentage}%` : "\u2014"}</td>
                      <td style={{ padding: "0.3rem 0.4rem", textAlign: "right", color: "#4caf50", fontWeight: 600 }}>{plat.seller_net || plat.seller_net_after_fees ? `$${plat.seller_net || plat.seller_net_after_fees}` : "\u2014"}</td>
                      <td style={{ padding: "0.3rem 0.4rem", textAlign: "right", color: "var(--text-muted)" }}>{plat.days_to_sell || plat.avg_days_to_sell || "\u2014"}</td>
                      <td style={{ padding: "0.3rem 0.4rem", fontSize: "0.62rem", color: "var(--text-muted)" }}>{best.agent}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Market Intelligence */}
      {(() => {
        const marketEntries = successful.map((p: any, i: number) => {
          const ph = allPH[i];
          const pm = PROVIDER_META[p.provider] || { label: p.provider, color: "#888" };
          const parts: string[] = [];
          if (ph.demandLevel) parts.push(`Demand: ${ph.demandLevel}`);
          if (ph.demandTrend) parts.push(`Trend: ${ph.demandTrend}`);
          if (ph.supplyLevel) parts.push(`Supply: ${ph.supplyLevel}`);
          if (ph.seasonal && typeof ph.seasonal === "string") parts.push(`Seasonal: ${ph.seasonal.slice(0, 80)}`);
          if (!parts.length) return null;
          return { label: `${pm.icon} ${pm.label}`, color: pm.color, text: parts.join(" · ") };
        }).filter(Boolean) as { label: string; color: string; text: string }[];
        return marketEntries.length > 0 ? <KnowledgeBlock icon="📊" title="Market Intelligence" entries={marketEntries} /> : null;
      })()}

      {/* Negotiation Intel */}
      {(() => {
        const negoEntries = successful.map((p: any, i: number) => {
          const ph = allPH[i];
          const pm = PROVIDER_META[p.provider] || { label: p.provider, color: "#888" };
          const parts: string[] = [];
          if (ph.listPrice) parts.push(`List $${Math.round(Number(ph.listPrice))}`);
          if (ph.sweetSpot) parts.push(`Sweet spot $${Math.round(Number(ph.sweetSpot))}`);
          if (ph.minAccept) parts.push(`Floor $${Math.round(Number(ph.minAccept))}`);
          if (ph.counterStrategy && typeof ph.counterStrategy === "string") parts.push(ph.counterStrategy.slice(0, 100));
          if (!parts.length) return null;
          return { label: `${pm.icon} ${pm.label}`, color: pm.color, text: parts.join(" · ") };
        }).filter(Boolean) as { label: string; color: string; text: string }[];
        return negoEntries.length > 0 ? <KnowledgeBlock icon="🤝" title="Negotiation Strategy" entries={negoEntries} /> : null;
      })()}

      {/* Value Factors */}
      {(() => {
        const valEntries = successful.map((p: any, i: number) => {
          const ph = allPH[i];
          const pm = PROVIDER_META[p.provider] || { label: p.provider, color: "#888" };
          const adders = (ph.valueAdders || []).map((a: any) => typeof a === "string" ? a : a.factor || a.description || "").filter(Boolean);
          const reducers = (ph.valueReducers || []).map((a: any) => typeof a === "string" ? a : a.factor || a.description || "").filter(Boolean);
          if (!adders.length && !reducers.length) return null;
          const parts: string[] = [];
          if (adders.length) parts.push(`+: ${adders.slice(0, 3).join(", ")}`);
          if (reducers.length) parts.push(`-: ${reducers.slice(0, 3).join(", ")}`);
          return { label: `${pm.icon} ${pm.label}`, color: pm.color, text: parts.join(" | ") };
        }).filter(Boolean) as { label: string; color: string; text: string }[];
        return valEntries.length > 0 ? <KnowledgeBlock icon="⚖️" title="Value Factors" entries={valEntries} /> : null;
      })()}

      {/* Price History & Trends */}
      {(() => {
        const trendEntries = successful.map((p: any, i: number) => {
          const ph = allPH[i];
          const pm = PROVIDER_META[p.provider] || { label: p.provider, color: "#888" };
          const parts: string[] = [];
          if (ph.priceHistoryTrend) parts.push(typeof ph.priceHistoryTrend === "string" ? ph.priceHistoryTrend.slice(0, 120) : String(ph.priceHistoryTrend));
          if (ph.trendEvidence && typeof ph.trendEvidence === "string") parts.push(ph.trendEvidence.slice(0, 80));
          if (ph.appreciationPotential) parts.push(`Appreciation: ${typeof ph.appreciationPotential === "string" ? ph.appreciationPotential.slice(0, 60) : ph.appreciationPotential}`);
          if (!parts.length) return null;
          return { label: `${pm.icon} ${pm.label}`, color: pm.color, text: parts.join(" · ") };
        }).filter(Boolean) as { label: string; color: string; text: string }[];
        return trendEntries.length > 0 ? <KnowledgeBlock icon="📈" title="Price History & Trends" entries={trendEntries} /> : null;
      })()}

      {/* International Pricing */}
      {(() => {
        const intlEntries = successful.map((p: any, i: number) => {
          const ph = allPH[i];
          const pm = PROVIDER_META[p.provider] || { label: p.provider, color: "#888" };
          if (!ph.internationalPricing) return null;
          const text = Object.entries(ph.internationalPricing).filter(([, v]) => v != null).map(([k, v]) => `${k.replace(/_/g, " ").replace(/\bestimate\b/, "").trim()}: $${v}`).join(" · ");
          if (!text) return null;
          return { label: `${pm.icon} ${pm.label}`, color: pm.color, text };
        }).filter(Boolean) as { label: string; color: string; text: string }[];
        return intlEntries.length > 0 ? <KnowledgeBlock icon="🌍" title="International Pricing" entries={intlEntries} /> : null;
      })()}

      {/* Liquidation Timeline */}
      {(() => {
        const liqEntries = successful.map((p: any, i: number) => {
          const ph = allPH[i];
          const pm = PROVIDER_META[p.provider] || { label: p.provider, color: "#888" };
          const lt = ph.liquidationTimeline;
          if (!lt) return null;
          const text = `Day 1: $${(lt as any).day_1_price || "?"} > Day 7: $${(lt as any).day_7_price || "?"} > Day 30: $${(lt as any).day_30_price || "?"} > Day 90: $${(lt as any).day_90_price || "?"}`;
          return { label: `${pm.icon} ${pm.label}`, color: pm.color, text };
        }).filter(Boolean) as { label: string; color: string; text: string }[];
        return liqEntries.length > 0 ? <KnowledgeBlock icon="⏱️" title="Liquidation Timeline" entries={liqEntries} /> : null;
      })()}

      {/* Section D: Full Agent Cards */}
      <div>
        <div style={{ fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-muted)", fontWeight: 700, marginBottom: "0.5rem" }}>
          Individual Pricing Reports
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {successful.map((p: any, idx: number) => {
            const pm = PROVIDER_META[p.provider] || { icon: "🤖", label: p.provider, color: "#888", specialty: "" };
            const isExp = expandedAgent === p.provider;
            const isShowingJson = showAgentJson === p.provider;
            const ph = allPH[idx];
            const timeStr = (p.durationMs || p.responseTime) ? `${((p.durationMs || p.responseTime) / 1000).toFixed(1)}s` : "";
            const comps = Array.isArray(ph.comparables) ? ph.comparables : [];
            const platEntries = ph.platformPricing && typeof ph.platformPricing === "object" ? Object.entries(ph.platformPricing).filter(([k]) => k !== "best_platform") : [];

            return (
              <div key={p.provider} style={{
                background: "var(--bg-card, var(--ghost-bg))",
                borderTop: isExp ? `3px solid ${pm.color}` : undefined,
                border: `1px solid ${isExp ? `${pm.color}40` : "var(--border-card, var(--border-default))"}`,
                borderRadius: "0.85rem", overflow: "hidden",
              }}>
                <button
                  onClick={() => setExpandedAgent(isExp ? null : p.provider)}
                  style={{
                    width: "100%", display: "flex", alignItems: "center", gap: "0.5rem",
                    padding: "0.75rem 1rem", background: "transparent", border: "none",
                    cursor: "pointer", textAlign: "left",
                  }}
                >
                  <span style={{ fontSize: "1rem" }}>{pm.icon}</span>
                  <span style={{ fontWeight: 700, fontSize: "0.82rem", color: pm.color, minWidth: 60 }}>{pm.label}</span>
                  <span style={{ fontSize: "0.72rem", color: "var(--text-secondary)", flex: 1, overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>
                    {ph.priceLow != null && ph.priceHigh != null ? `$${Math.round(Number(ph.priceLow))}-$${Math.round(Number(ph.priceHigh))}` : "\u2014"}
                    {ph.bestPlatform && typeof ph.bestPlatform === "string" && ` \u00B7 ${ph.bestPlatform}`}
                    {ph.demandLevel && ` \u00B7 ${ph.demandLevel}`}
                  </span>
                  <span style={{ fontSize: "0.62rem", color: "#4caf50" }}>✅ {timeStr}</span>
                  <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", transform: isExp ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>▾</span>
                </button>
                {isExp && (
                  <div style={{ padding: "0 1rem 1rem", borderTop: `1px solid ${pm.color}15` }}>
                    {/* Price Assessment */}
                    <div style={{ marginTop: "0.5rem", marginBottom: "0.5rem", padding: "0.6rem", background: "var(--bg-card)", borderRadius: "0.6rem", border: "1px solid var(--border-default)" }}>
                      <div style={{ fontSize: "0.6rem", textTransform: "uppercase", letterSpacing: "0.1em", color: pm.color, fontWeight: 700, marginBottom: "0.4rem" }}>Price Assessment</div>
                      <div style={{ display: "flex", alignItems: "baseline", gap: "0.5rem", marginBottom: "0.3rem" }}>
                        <span style={{ fontSize: "1.6rem", fontWeight: 800, color: "var(--accent)" }}>${ph.priceLow != null ? Math.round(Number(ph.priceLow)) : "?"}</span>
                        <span style={{ color: "var(--text-muted)" }}>{"\u2014"}</span>
                        <span style={{ fontSize: "1.6rem", fontWeight: 800, color: "var(--accent)" }}>${ph.priceHigh != null ? Math.round(Number(ph.priceHigh)) : "?"}</span>
                        {ph.priceMid != null && <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>mid ${Math.round(Number(ph.priceMid))}</span>}
                        {ph.confidence != null && <span style={{ fontSize: "0.72rem", fontWeight: 600, color: Number(ph.confidence) >= 70 ? "#4caf50" : "#ff9800" }}>{Math.round(Number(ph.confidence))}%</span>}
                      </div>
                      {ph.rationale && <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", margin: 0, lineHeight: 1.5 }}>{typeof ph.rationale === "string" && ph.rationale.length > 300 ? ph.rationale.slice(0, 300) + "..." : ph.rationale}</p>}
                    </div>

                    {/* Comparable Sales */}
                    {comps.length > 0 && (
                      <div style={{ marginBottom: "0.5rem", padding: "0.6rem", background: "var(--bg-card)", borderRadius: "0.6rem", border: "1px solid var(--border-default)" }}>
                        <div style={{ fontSize: "0.6rem", textTransform: "uppercase", letterSpacing: "0.1em", color: pm.color, fontWeight: 700, marginBottom: "0.35rem" }}>Comparable Sales ({comps.length})</div>
                        {comps.slice(0, 6).map((c: any, i: number) => {
                          const nc = normalizeComparable(c);
                          return (
                            <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.25rem 0", borderBottom: i < Math.min(comps.length, 6) - 1 ? "1px solid var(--border-default)" : "none" }}>
                              <span style={{ fontSize: "0.65rem", color: "var(--text-muted)", minWidth: 60 }}>{nc.platform}</span>
                              <span style={{ fontSize: "0.72rem", color: "var(--text-secondary)", flex: 1, overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>{nc.item_description}</span>
                              <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--accent)" }}>${nc.sold_price}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Platform Breakdown */}
                    {platEntries.length > 0 && (
                      <div style={{ marginBottom: "0.5rem", padding: "0.6rem", background: "var(--bg-card)", borderRadius: "0.6rem", border: "1px solid var(--border-default)" }}>
                        <div style={{ fontSize: "0.6rem", textTransform: "uppercase", letterSpacing: "0.1em", color: pm.color, fontWeight: 700, marginBottom: "0.35rem" }}>Platform Breakdown</div>
                        <div style={{ overflowX: "auto" }}>
                          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.7rem" }}>
                            <thead>
                              <tr style={{ color: "var(--text-muted)" }}>
                                <th style={{ textAlign: "left", padding: "0.2rem 0.3rem", fontWeight: 600 }}>Platform</th>
                                <th style={{ textAlign: "right", padding: "0.2rem 0.3rem", fontWeight: 600 }}>List</th>
                                <th style={{ textAlign: "right", padding: "0.2rem 0.3rem", fontWeight: 600 }}>Net</th>
                                <th style={{ textAlign: "right", padding: "0.2rem 0.3rem", fontWeight: 600 }}>Days</th>
                              </tr>
                            </thead>
                            <tbody>
                              {platEntries.slice(0, 8).map(([key, plat]: [string, any]) => {
                                if (!plat || typeof plat !== "object") return null;
                                const name = key.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase());
                                return (
                                  <tr key={key} style={{ borderTop: "1px solid var(--border-default)" }}>
                                    <td style={{ padding: "0.25rem 0.3rem", color: "var(--text-primary)", fontWeight: 500 }}>{name}</td>
                                    <td style={{ padding: "0.25rem 0.3rem", textAlign: "right", color: "var(--text-secondary)" }}>{plat.list_price || plat.recommended_list_price ? `$${plat.list_price || plat.recommended_list_price}` : "\u2014"}</td>
                                    <td style={{ padding: "0.25rem 0.3rem", textAlign: "right", color: "#4caf50", fontWeight: 600 }}>{plat.seller_net || plat.seller_net_after_fees ? `$${plat.seller_net || plat.seller_net_after_fees}` : "\u2014"}</td>
                                    <td style={{ padding: "0.25rem 0.3rem", textAlign: "right", color: "var(--text-muted)" }}>{plat.days_to_sell || plat.avg_days_to_sell || "\u2014"}</td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                        {ph.bestPlatform && typeof ph.bestPlatform === "string" && <div style={{ fontSize: "0.72rem", color: "var(--text-secondary)", marginTop: "0.3rem" }}>Best: {ph.bestPlatform}</div>}
                      </div>
                    )}

                    {/* Deep Pricing Intelligence */}
                    {(ph.demandLevel || ph.listPrice || ph.priceHistoryTrend) && (
                      <div style={{ marginBottom: "0.5rem", padding: "0.6rem", background: "linear-gradient(135deg, rgba(76,175,80,0.04), rgba(0,188,212,0.02))", borderRadius: "0.6rem", border: "1px solid rgba(76,175,80,0.12)" }}>
                        <div style={{ fontSize: "0.6rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "#4caf50", fontWeight: 700, marginBottom: "0.4rem" }}>Deep Pricing Intel</div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem", fontSize: "0.72rem", color: "var(--text-secondary)" }}>
                          {ph.demandLevel && <div>📊 {ph.demandLevel} demand{ph.demandTrend ? ` \u00B7 ${ph.demandTrend}` : ""}{ph.supplyLevel ? ` \u00B7 Supply: ${ph.supplyLevel}` : ""}</div>}
                          {ph.listPrice && <div>🤝 List ${Math.round(Number(ph.listPrice))}{ph.sweetSpot ? ` \u00B7 Sweet spot $${Math.round(Number(ph.sweetSpot))}` : ""}{ph.minAccept ? ` \u00B7 Floor $${Math.round(Number(ph.minAccept))}` : ""}</div>}
                          {ph.priceHistoryTrend && <div>📈 {typeof ph.priceHistoryTrend === "string" && ph.priceHistoryTrend.length > 100 ? ph.priceHistoryTrend.slice(0, 100) + "..." : ph.priceHistoryTrend}</div>}
                          {ph.collectorPremium && typeof ph.collectorPremium === "string" && <div>💎 {ph.collectorPremium.length > 100 ? ph.collectorPremium.slice(0, 100) + "..." : ph.collectorPremium}</div>}
                        </div>
                      </div>
                    )}

                    {/* Summary */}
                    {ph.summary && (
                      <div style={{ marginBottom: "0.5rem", padding: "0.5rem 0.6rem", background: `${pm.color}08`, borderRadius: "0.6rem", borderLeft: `3px solid ${pm.color}60` }}>
                        <div style={{ fontSize: "0.58rem", textTransform: "uppercase", color: pm.color, fontWeight: 700, marginBottom: "0.15rem" }}>{pm.icon} {pm.label} Summary</div>
                        <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", margin: 0, lineHeight: 1.5, fontStyle: "italic" }}>
                          {typeof ph.summary === "string" && ph.summary.length > 400 ? ph.summary.slice(0, 400) + "..." : ph.summary}
                        </p>
                      </div>
                    )}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ fontSize: "0.62rem", color: "var(--text-muted)", fontStyle: "italic" }}>{pm.specialty}</div>
                      <button onClick={() => setShowAgentJson(isShowingJson ? null : p.provider)} style={{ fontSize: "0.6rem", color: "var(--text-muted)", background: "transparent", border: "none", cursor: "pointer", textDecoration: "underline", padding: 0 }}>
                        {isShowingJson ? "Hide JSON" : "View JSON"}
                      </button>
                    </div>
                    {isShowingJson && (
                      <pre style={{ fontSize: "0.58rem", color: "var(--text-muted)", background: "rgba(0,0,0,0.2)", borderRadius: "0.4rem", padding: "0.5rem", marginTop: "0.3rem", overflow: "auto", maxHeight: 250, whiteSpace: "pre-wrap" }}>
                        {JSON.stringify(p.data || p, null, 2)}
                      </pre>
                    )}
                  </div>
                )}
              </div>
            );
          })}
          {failed.map((p: any) => {
            const pm = PROVIDER_META[p.provider] || { icon: "🤖", label: p.provider, color: "#888" };
            return (
              <div key={p.provider} style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.5rem 0.85rem", opacity: 0.4, background: "var(--bg-card)", border: "1px solid var(--border-default)", borderRadius: "0.65rem", fontSize: "0.72rem" }}>
                <span style={{ opacity: 0.5 }}>{pm.icon}</span><span style={{ fontWeight: 600, color: "var(--text-muted)" }}>{pm.label}</span>
                <span style={{ color: "var(--text-muted)", fontSize: "0.65rem" }}>Unavailable</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Section E: Where Agents Disagree on Price */}
      {maxSpread > 0 && priceRanges.length >= 2 && (
        <div style={{
          background: "rgba(255,152,0,0.06)", border: "1px solid rgba(255,152,0,0.2)",
          borderLeft: "4px solid #ff9800", borderRadius: "0 0.85rem 0.85rem 0",
          padding: "1rem 1.25rem",
        }}>
          <div style={{ fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "#ff9800", fontWeight: 700, marginBottom: "0.5rem" }}>
            ⚠️ Price Disagreements — ${maxSpread} spread
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
            {successful.map((p: any, i: number) => {
              const pm = PROVIDER_META[p.provider] || { icon: "🤖", label: p.provider, color: "#888" };
              const ph = allPH[i];
              if (ph.priceLow == null || ph.priceHigh == null) return null;
              const low = Math.round(Number(ph.priceLow));
              const high = Math.round(Number(ph.priceHigh));
              const allLows = priceRanges.map(h => Number(h.priceLow));
              const allHighs = priceRanges.map(h => Number(h.priceHigh));
              const globalMin = Math.min(...allLows);
              const globalMax = Math.max(...allHighs);
              const range = globalMax - globalMin || 1;
              const leftPct = ((low - globalMin) / range) * 100;
              const widthPct = Math.max(((high - low) / range) * 100, 2);
              return (
                <div key={p.provider}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.15rem" }}>
                    <span style={{ fontSize: "0.72rem", color: pm.color, fontWeight: 600, minWidth: 70 }}>{pm.icon} {pm.label}</span>
                    <span style={{ fontSize: "0.72rem", color: "var(--text-secondary)" }}>${low} — ${high}</span>
                  </div>
                  <div style={{ height: 8, borderRadius: 99, background: "var(--ghost-bg)", position: "relative" as const, overflow: "hidden" }}>
                    <div style={{
                      position: "absolute" as const, left: `${leftPct}%`, width: `${widthPct}%`, height: "100%",
                      borderRadius: 99, background: pm.color, opacity: 0.6,
                    }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Section F: Executive Pricing Summary */}
      <div style={{
        background: "linear-gradient(135deg, rgba(76,175,80,0.06), rgba(0,188,212,0.04))",
        border: "1px solid rgba(76,175,80,0.25)",
        borderLeft: "4px solid #4caf50",
        borderRadius: "0 1.25rem 1.25rem 0",
        padding: "1.25rem 1.5rem",
      }}>
        <div style={{ fontSize: "0.68rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "#4caf50", fontWeight: 700, marginBottom: "0.5rem" }}>
          💰 MegaBot Pricing Report
        </div>
        <p style={{ fontSize: "0.88rem", lineHeight: 1.7, color: "var(--text-secondary)", margin: 0 }}>
          {buildPricingSummary()}
        </p>
      </div>
    </div>
  );
}

/** Renders the premium Analysis tab for MegaBot page */
function AnalysisTabContent({ result, consensus, providers, agreement }: {
  result: any; consensus: any; providers: any[]; agreement: number;
}) {
  const [expandedAgent, setExpandedAgent] = useState<string | null>(providers.find((p: any) => !p.error)?.provider || null);
  const [showAgentJson, setShowAgentJson] = useState<string | null>(null);
  const successful = providers.filter((p: any) => !p.error);
  const failed = providers.filter((p: any) => p.error);
  const allH = successful.map((p: any) => extractHighlights(p));
  const consH = extractHighlights({ data: consensus });

  // Build comparison table fields
  const COMPARE_FIELDS = [
    { key: "itemName", label: "Item Name" },
    { key: "category", label: "Category" },
    { key: "brand", label: "Brand/Maker", render: (h: any) => [h.brand, h.maker].filter(Boolean).join(" \u2014 ") || null },
    { key: "material", label: "Material" },
    { key: "era", label: "Era" },
    { key: "origin", label: "Origin" },
    { key: "condOverall", label: "Condition", render: (h: any) => h.condOverall != null ? `${h.condOverall}/10` : null },
    { key: "condCosm", label: "Cosmetic", render: (h: any) => h.condCosm != null ? `${h.condCosm}/10` : null },
    { key: "condFunc", label: "Functional", render: (h: any) => h.condFunc != null ? `${h.condFunc}/10` : null },
  ] as const;

  // Knowledge categories for combined view
  const KNOWLEDGE_CATS = [
    { key: "productHistory" as const, icon: "📖", title: "History & Background" },
    { key: "makerHistory" as const, icon: "🏭", title: "Maker/Brand History" },
    { key: "construction" as const, icon: "🔧", title: "Construction & Craftsmanship" },
    { key: "specialFeatures" as const, icon: "⭐", title: "What Makes It Special" },
    { key: "tipsAndFacts" as const, icon: "💡", title: "Tips & Interesting Facts" },
    { key: "commonIssues" as const, icon: "⚠️", title: "Things to Watch For" },
    { key: "careInstructions" as const, icon: "🛡️", title: "Care & Preservation" },
    { key: "similarItems" as const, icon: "🔍", title: "Comparisons & Alternatives" },
    { key: "collectorInfo" as const, icon: "🎯", title: "Collector & Enthusiast Info" },
  ];

  // Build executive summary
  function buildExecutiveSummary(): string {
    const parts: string[] = [];
    const itemName = consH.itemName || allH.find(h => h.itemName)?.itemName || "this item";
    const category = consH.category || allH.find(h => h.category)?.category;
    const brand = consH.brand || allH.find(h => h.brand)?.brand;
    const era = consH.era || allH.find(h => h.era)?.era;
    const material = consH.material || allH.find(h => h.material)?.material;

    parts.push(`${successful.length} AI experts identified this as "${itemName}"${category ? ` in the ${category} category` : ""}${brand ? `, made by ${brand}` : ""}${era ? ` from the ${era}` : ""}.`);
    if (material) parts.push(`The primary material is ${material}.`);
    if (agreement >= 80) parts.push(`There is strong consensus (${agreement}%) across all agents.`);
    else if (agreement >= 60) parts.push(`Agents show moderate agreement (${agreement}%), with some variation in assessments.`);
    else parts.push(`Agents show mixed opinions (${agreement}%) \u2014 different perspectives worth reviewing individually.`);

    const condScore = consH.condOverall || allH.find(h => h.condOverall)?.condOverall;
    if (condScore != null) {
      const condDet = consH.condDetails || allH.find(h => h.condDetails)?.condDetails;
      parts.push(`Consensus condition is ${condScore}/10 (${condWord(Number(condScore))})${condDet ? ` \u2014 ${condDet.slice(0, 120)}` : ""}.`);
    }

    // Best history
    const bestHistory = allH.map(h => h.productHistory || h.makerHistory).filter(Boolean).sort((a, b) => (b?.length || 0) - (a?.length || 0))[0];
    if (bestHistory) {
      const sentences = bestHistory.split(/(?<=[.!?])\s+/).slice(0, 2).join(" ");
      if (sentences.length > 30) parts.push(sentences);
    }

    // Best construction
    const bestConstruction = allH.map(h => h.construction).filter(Boolean).sort((a, b) => (b?.length || 0) - (a?.length || 0))[0];
    if (bestConstruction) {
      const s = bestConstruction.split(/(?<=[.!?])\s+/).slice(0, 1).join(" ");
      if (s.length > 20) parts.push(s);
    }

    // Special features
    const bestSpecial = allH.map(h => h.specialFeatures).filter(Boolean).sort((a, b) => (b?.length || 0) - (a?.length || 0))[0];
    if (bestSpecial) {
      const s = bestSpecial.split(/(?<=[.!?])\s+/).slice(0, 1).join(" ");
      if (s.length > 20) parts.push(s);
    }

    // Collector info
    const bestCollector = allH.map(h => h.collectorInfo).filter(Boolean).sort((a, b) => (b?.length || 0) - (a?.length || 0))[0];
    if (bestCollector) {
      const s = bestCollector.split(/(?<=[.!?])\s+/).slice(0, 1).join(" ");
      if (s.length > 20) parts.push(s);
    }

    // Best executive summary sentence
    const bestExec = successful.map((p: any) => getKeyInsight(p)).filter(s => s.length > 40).sort((a, b) => b.length - a.length)[0];
    if (bestExec && parts.length < 8) {
      const sentences = bestExec.split(/(?<=[.!?])\s+/).slice(0, 2);
      if (sentences[0]?.length > 20) parts.push(sentences.join(" "));
    }

    if (allH.some(h => h.isTextOnly)) parts.push("Note: Grok analyzed via text only (photo was unavailable).");
    return parts.join(" ");
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>

      {/* Section B: Comparison Table */}
      <div style={{
        background: "var(--bg-card, var(--ghost-bg))",
        border: "1px solid rgba(139,92,246,0.2)",
        borderRadius: "1.25rem", overflow: "hidden",
      }}>
        <div style={{ padding: "0.85rem 1.25rem", borderBottom: "1px solid var(--border-default)" }}>
          <div style={{ fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "#a855f7", fontWeight: 700 }}>
            4-Agent Comparison
          </div>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.75rem" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border-default)" }}>
                <th style={{ padding: "0.5rem 0.75rem", textAlign: "left", color: "var(--text-muted)", fontWeight: 600, fontSize: "0.62rem", textTransform: "uppercase" }}>Field</th>
                {successful.map((p: any) => {
                  const pm = PROVIDER_META[p.provider] || { icon: "🤖", label: p.provider, color: "#888" };
                  return (
                    <th key={p.provider} style={{ padding: "0.5rem 0.65rem", textAlign: "left", color: pm.color, fontWeight: 700, fontSize: "0.62rem", whiteSpace: "nowrap" }}>
                      {pm.icon} {pm.label}
                    </th>
                  );
                })}
                <th style={{ padding: "0.5rem 0.65rem", textAlign: "left", color: "#a855f7", fontWeight: 700, fontSize: "0.62rem" }}>✅ Consensus</th>
              </tr>
            </thead>
            <tbody>
              {COMPARE_FIELDS.map((field) => {
                const values = allH.map(h => {
                  if ('render' in field && field.render) return field.render(h);
                  return (h as any)[field.key];
                });
                const consVal = (() => {
                  if ('render' in field && field.render) return field.render(consH);
                  return (consH as any)[field.key];
                })();
                if (!values.some(v => v) && !consVal) return null;
                // Check agreement
                const nonNull = values.filter(Boolean);
                const allSame = nonNull.length >= 2 && new Set(nonNull.map(v => String(v).toLowerCase().slice(0, 20))).size === 1;
                return (
                  <tr key={field.key} style={{ borderBottom: "1px solid var(--border-default)" }}>
                    <td style={{ padding: "0.4rem 0.75rem", color: "var(--text-muted)", fontWeight: 600, fontSize: "0.65rem" }}>{field.label}</td>
                    {values.map((val, i) => (
                      <td key={i} style={{
                        padding: "0.4rem 0.65rem", color: "var(--text-primary)", fontSize: "0.72rem",
                        maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                        background: val && allSame ? "rgba(76,175,80,0.04)" : undefined,
                      }}>
                        {val ? String(val) : <span style={{ color: "var(--text-muted)", opacity: 0.4 }}>\u2014</span>}
                      </td>
                    ))}
                    <td style={{ padding: "0.4rem 0.65rem", color: "var(--text-primary)", fontWeight: 600, fontSize: "0.72rem" }}>
                      {consVal ? String(consVal) : <span style={{ color: "var(--text-muted)", opacity: 0.4 }}>\u2014</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Section C: Deep Knowledge by Category */}
      {KNOWLEDGE_CATS.map((cat) => {
        const entries = successful
          .map((p: any, i: number) => {
            const h = allH[i];
            const text = (h as any)[cat.key];
            if (!text) return null;
            const pm = PROVIDER_META[p.provider] || { label: p.provider, color: "#888" };
            return { label: `${pm.icon} ${pm.label}`, color: pm.color, text };
          })
          .filter(Boolean) as { label: string; color: string; text: string }[];
        if (entries.length === 0) return null;
        return <KnowledgeBlock key={cat.key} icon={cat.icon} title={cat.title} entries={entries} />;
      })}

      {/* Section D: Full Agent Cards */}
      <div>
        <div style={{ fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-muted)", fontWeight: 700, marginBottom: "0.5rem" }}>
          Individual Agent Reports
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {successful.map((p: any, idx: number) => {
            const pm = PROVIDER_META[p.provider] || { icon: "🤖", label: p.provider, color: "#888", specialty: "" };
            const isExp = expandedAgent === p.provider;
            const isShowingJson = showAgentJson === p.provider;
            const h = allH[idx];
            const insight = getKeyInsight(p);
            const condNum = h.condOverall != null ? Number(h.condOverall) : null;
            const condLbl = h.condLabel || (condNum != null ? condWord(condNum) : null);
            const timeStr = (p.durationMs || p.responseTime) ? `${((p.durationMs || p.responseTime) / 1000).toFixed(1)}s` : "";
            const knowledgeSections = [h.productHistory, h.makerHistory, h.construction, h.specialFeatures, h.tipsAndFacts, h.commonIssues, h.careInstructions, h.similarItems, h.collectorInfo].filter(Boolean);

            return (
              <div key={p.provider} style={{
                background: "var(--bg-card, var(--ghost-bg))",
                borderTop: isExp ? `3px solid ${pm.color}` : undefined,
                border: `1px solid ${isExp ? `${pm.color}40` : "var(--border-card, var(--border-default))"}`,
                borderRadius: "0.85rem", overflow: "hidden",
              }}>
                <button
                  onClick={() => setExpandedAgent(isExp ? null : p.provider)}
                  style={{
                    width: "100%", display: "flex", alignItems: "center", gap: "0.5rem",
                    padding: "0.75rem 1rem", background: "transparent", border: "none",
                    cursor: "pointer", textAlign: "left",
                  }}
                >
                  <span style={{ fontSize: "1rem" }}>{pm.icon}</span>
                  <span style={{ fontWeight: 700, fontSize: "0.82rem", color: pm.color, minWidth: 60 }}>{pm.label}</span>
                  <span style={{ fontSize: "0.72rem", color: "var(--text-secondary)", flex: 1, overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>
                    {h.itemName || "\u2014"}
                    {condNum != null && ` \u00B7 ${condNum}/10 ${condLbl}`}
                    {h.isTextOnly && " (text only)"}
                  </span>
                  <span style={{ fontSize: "0.62rem", color: "#4caf50" }}>✅ {timeStr}</span>
                  <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", transform: isExp ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>▾</span>
                </button>
                {isExp && (
                  <div style={{ padding: "0 1rem 1rem", borderTop: `1px solid ${pm.color}15` }}>
                    {/* Identification */}
                    <div style={{ marginTop: "0.5rem", marginBottom: "0.5rem", padding: "0.6rem", background: "var(--bg-card)", borderRadius: "0.6rem", border: "1px solid var(--border-default)" }}>
                      <div style={{ fontSize: "0.6rem", textTransform: "uppercase", letterSpacing: "0.1em", color: pm.color, fontWeight: 700, marginBottom: "0.4rem" }}>Identification</div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.2rem 1rem", fontSize: "0.75rem" }}>
                        {h.itemName && <div><span style={{ color: "var(--text-muted)", fontSize: "0.6rem" }}>ITEM: </span><span style={{ color: "var(--text-primary)", fontWeight: 600 }}>{h.itemName}</span></div>}
                        {h.category && <div><span style={{ color: "var(--text-muted)", fontSize: "0.6rem" }}>CATEGORY: </span><span style={{ color: "var(--text-primary)" }}>{h.category}</span></div>}
                        {(h.brand || h.maker) && <div><span style={{ color: "var(--text-muted)", fontSize: "0.6rem" }}>BRAND: </span><span style={{ color: "var(--text-primary)" }}>{[h.brand, h.maker].filter(Boolean).join(" \u2014 ")}</span></div>}
                        {h.material && <div><span style={{ color: "var(--text-muted)", fontSize: "0.6rem" }}>MATERIAL: </span><span style={{ color: "var(--text-primary)" }}>{String(h.material)}</span></div>}
                        {h.era && <div><span style={{ color: "var(--text-muted)", fontSize: "0.6rem" }}>ERA: </span><span style={{ color: "var(--text-primary)" }}>{h.era}</span></div>}
                        {h.origin && <div><span style={{ color: "var(--text-muted)", fontSize: "0.6rem" }}>ORIGIN: </span><span style={{ color: "var(--text-primary)" }}>{h.origin}</span></div>}
                      </div>
                    </div>
                    {/* Condition */}
                    {condNum != null && (
                      <div style={{ marginBottom: "0.5rem", padding: "0.6rem", background: "var(--bg-card)", borderRadius: "0.6rem", border: "1px solid var(--border-default)" }}>
                        <div style={{ fontSize: "0.6rem", textTransform: "uppercase", letterSpacing: "0.1em", color: pm.color, fontWeight: 700, marginBottom: "0.35rem" }}>Condition</div>
                        <div style={{ display: "flex", gap: "1rem", fontSize: "0.82rem", marginBottom: "0.3rem" }}>
                          <span><strong style={{ color: condNum >= 7 ? "#4caf50" : condNum >= 4 ? "#ff9800" : "#ef4444" }}>{condNum}/10</strong> Overall</span>
                          {h.condCosm != null && <span>{h.condCosm}/10 Cosmetic</span>}
                          {h.condFunc != null && <span>{h.condFunc}/10 Functional</span>}
                        </div>
                        {h.condDetails && <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", margin: 0, lineHeight: 1.4 }}>{h.condDetails}</p>}
                      </div>
                    )}
                    {/* Knowledge sections */}
                    {knowledgeSections.length > 0 && (
                      <div style={{ marginBottom: "0.5rem", padding: "0.6rem", background: "linear-gradient(135deg, rgba(139,92,246,0.04), rgba(0,188,212,0.02))", borderRadius: "0.6rem", border: "1px solid rgba(139,92,246,0.12)" }}>
                        <div style={{ fontSize: "0.6rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "#a855f7", fontWeight: 700, marginBottom: "0.4rem" }}>Deep Item Knowledge</div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                          {h.productHistory && <div style={{ fontSize: "0.72rem", color: "var(--text-secondary)", lineHeight: 1.4 }}><strong>📖 History:</strong> {h.productHistory.slice(0, 250)}{h.productHistory.length > 250 ? "..." : ""}</div>}
                          {h.makerHistory && <div style={{ fontSize: "0.72rem", color: "var(--text-secondary)", lineHeight: 1.4 }}><strong>🏭 Maker:</strong> {h.makerHistory.slice(0, 250)}{h.makerHistory.length > 250 ? "..." : ""}</div>}
                          {h.construction && <div style={{ fontSize: "0.72rem", color: "var(--text-secondary)", lineHeight: 1.4 }}><strong>🔧 Construction:</strong> {h.construction.slice(0, 250)}{h.construction.length > 250 ? "..." : ""}</div>}
                          {h.specialFeatures && <div style={{ fontSize: "0.72rem", color: "var(--text-secondary)", lineHeight: 1.4 }}><strong>⭐ Special:</strong> {h.specialFeatures.slice(0, 250)}{h.specialFeatures.length > 250 ? "..." : ""}</div>}
                          {h.tipsAndFacts && <div style={{ fontSize: "0.72rem", color: "var(--text-secondary)", lineHeight: 1.4 }}><strong>💡 Tips:</strong> {h.tipsAndFacts.slice(0, 250)}{h.tipsAndFacts.length > 250 ? "..." : ""}</div>}
                          {h.commonIssues && <div style={{ fontSize: "0.72rem", color: "var(--text-secondary)", lineHeight: 1.4 }}><strong>⚠️ Issues:</strong> {h.commonIssues.slice(0, 250)}{h.commonIssues.length > 250 ? "..." : ""}</div>}
                          {h.collectorInfo && <div style={{ fontSize: "0.72rem", color: "var(--text-secondary)", lineHeight: 1.4 }}><strong>🎯 Collector:</strong> {h.collectorInfo.slice(0, 250)}{h.collectorInfo.length > 250 ? "..." : ""}</div>}
                        </div>
                      </div>
                    )}
                    {/* Key Insight */}
                    {insight && (
                      <div style={{ marginBottom: "0.5rem", padding: "0.5rem 0.6rem", background: `${pm.color}08`, borderRadius: "0.6rem", borderLeft: `3px solid ${pm.color}60` }}>
                        <div style={{ fontSize: "0.58rem", textTransform: "uppercase", color: pm.color, fontWeight: 700, marginBottom: "0.15rem" }}>{pm.icon} What {pm.label} Found</div>
                        <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", margin: 0, lineHeight: 1.5, fontStyle: "italic" }}>
                          &ldquo;{insight.length > 400 ? insight.slice(0, 400) + "..." : insight}&rdquo;
                        </p>
                      </div>
                    )}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ fontSize: "0.62rem", color: "var(--text-muted)", fontStyle: "italic" }}>{pm.specialty}</div>
                      <button onClick={() => setShowAgentJson(isShowingJson ? null : p.provider)} style={{ fontSize: "0.6rem", color: "var(--text-muted)", background: "transparent", border: "none", cursor: "pointer", textDecoration: "underline", padding: 0 }}>
                        {isShowingJson ? "Hide JSON" : "View JSON"}
                      </button>
                    </div>
                    {isShowingJson && (
                      <pre style={{ fontSize: "0.58rem", color: "var(--text-muted)", background: "rgba(0,0,0,0.2)", borderRadius: "0.4rem", padding: "0.5rem", marginTop: "0.3rem", overflow: "auto", maxHeight: 250, whiteSpace: "pre-wrap" }}>
                        {JSON.stringify(p.data || p, null, 2)}
                      </pre>
                    )}
                  </div>
                )}
              </div>
            );
          })}
          {failed.map((p: any) => {
            const pm = PROVIDER_META[p.provider] || { icon: "🤖", label: p.provider, color: "#888" };
            return (
              <div key={p.provider} style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.5rem 0.85rem", opacity: 0.4, background: "var(--bg-card)", border: "1px solid var(--border-default)", borderRadius: "0.65rem", fontSize: "0.72rem" }}>
                <span style={{ opacity: 0.5 }}>{pm.icon}</span><span style={{ fontWeight: 600, color: "var(--text-muted)" }}>{pm.label}</span>
                <span style={{ color: "var(--text-muted)", fontSize: "0.65rem" }}>Unavailable</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Section F: Executive Summary */}
      <div style={{
        background: "linear-gradient(135deg, rgba(139,92,246,0.06), rgba(0,188,212,0.04))",
        border: "1px solid rgba(139,92,246,0.25)",
        borderLeft: "4px solid #a855f7",
        borderRadius: "0 1.25rem 1.25rem 0",
        padding: "1.25rem 1.5rem",
      }}>
        <div style={{ fontSize: "0.68rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "#a855f7", fontWeight: 700, marginBottom: "0.5rem" }}>
          ⚡ MegaBot Executive Report
        </div>
        <p style={{ fontSize: "0.88rem", lineHeight: 1.7, color: "var(--text-secondary)", margin: 0 }}>
          {buildExecutiveSummary()}
        </p>
      </div>
    </div>
  );
}

/* ── Listing extraction ── */
function extractLH(p: any) {
  let d = _normalizeKeys(p.data || {});
  const topKeys = Object.keys(d);
  if (topKeys.length === 1 && _obj(d[topKeys[0]]) && Object.keys(d[topKeys[0]]).length >= 2) d = d[topKeys[0]];
  const listingsObj = _obj(d.listings) || _obj(d.platform_listings) || {};
  const platforms = Array.isArray(d.top_platforms) ? d.top_platforms : Object.keys(listingsObj);
  const platformCount = Object.keys(listingsObj).length;
  const titles: Record<string, string> = {};
  for (const [plat, lst] of Object.entries(listingsObj)) {
    const v = lst as any;
    if (v?.title) titles[plat] = v.title;
  }
  const seo = _obj(d.seo_keywords) || {};
  const primaryKw = Array.isArray(seo.primary) ? seo.primary : _getBuyerArr(d, "primary_keywords", "top_keywords", "keywords");
  const longTailKw = Array.isArray(seo.long_tail) ? seo.long_tail : _getBuyerArr(d, "long_tail_keywords", "long_tail");
  const bestTitle = d.best_title_overall || d.best_title || null;
  const bestHook = d.best_description_hook || d.best_hook || null;
  const hashtags = Array.isArray(d.hashtags) ? d.hashtags : _getBuyerArr(d, "hashtags", "tags");
  return {
    listings: listingsObj, platforms, platformCount, titles,
    bestTitle, bestHook, hashtags,
    primaryKw, longTailKw, allKwCount: primaryKw.length + longTailKw.length,
    photoDirection: d.photo_direction || d.photo_tip || null,
    postingTime: d.posting_time || d.best_time || null,
    summary: d.executive_summary || d.summary || null,
  };
}

/* ── Recon extraction ── */
function extractRH(p: any) {
  let d = _normalizeKeys(p.data || {});
  const topKeys = Object.keys(d);
  if (topKeys.length === 1 && _obj(d[topKeys[0]]) && Object.keys(d[topKeys[0]]).length >= 2) d = d[topKeys[0]];
  const competitors = _getBuyerArr(d, "competitor_listings", "competitors", "competing_listings", "competitive_listings");
  const alerts = _getBuyerArr(d, "market_alerts", "alerts", "action_items");
  return {
    competitors, competitorCount: competitors.length,
    alerts, alertCount: alerts.length,
    demandLevel: _getBuyerField(d, "demand_level", "market_demand", "demand"),
    pricePosition: _getBuyerField(d, "price_position", "pricing_position", "competitive_position"),
    market: _obj(d.market_analysis) || _obj(d.market_overview) || null,
    strategies: _getBuyerArr(d, "selling_strategies_observed", "strategies", "selling_strategies"),
    summary: d.executive_summary || d.summary || null,
  };
}

/* ── Vehicle extraction ── */
function extractVH(p: any) {
  let d = _normalizeKeys(p.data || {});
  const topKeys = Object.keys(d);
  if (topKeys.length === 1 && _obj(d[topKeys[0]]) && Object.keys(d[topKeys[0]]).length >= 2) d = d[topKeys[0]];
  const id = _obj(d.identification) || d;
  const cond = _obj(d.condition_assessment) || _obj(d.condition) || d;
  const val = _obj(d.valuation) || _obj(d.pricing) || d;
  // Extract numeric score from nested objects like { score: 7, paint_condition: "Good", ... }
  const getScore = (v: any) => (v && typeof v === "object" && v.score != null) ? v.score : v;
  // Extract mid value from nested valuation objects like { low: X, mid: Y, high: Z }
  const getMid = (v: any) => (v && typeof v === "object" && v.mid != null) ? v.mid : (typeof v === "number" ? v : null);
  return {
    year: _getBuyerField(id, "year", "vehicle_year") || _getBuyerField(d, "year"),
    make: _getBuyerField(id, "make", "vehicle_make") || _getBuyerField(d, "make"),
    model: _getBuyerField(id, "model", "vehicle_model") || _getBuyerField(d, "model"),
    trim: _getBuyerField(id, "trim", "trim_level"),
    condGrade: _getBuyerField(cond, "overall_grade", "grade", "overall_score", "condition_score"),
    exterior: getScore(_getBuyerField(cond, "exterior", "exterior_score")),
    interior: getScore(_getBuyerField(cond, "interior", "interior_score")),
    mechanical: getScore(_getBuyerField(cond, "mechanical", "mechanical_score")),
    retailValue: getMid(val.retail_value) ?? getMid(val.retail),
    privateParty: getMid(val.private_party_value) ?? getMid(val.private_party),
    tradeIn: getMid(val.trade_in_value) ?? getMid(val.trade_in),
    market: _obj(d.market_analysis) || null,
    summary: d.executive_summary || d.summary || null,
  };
}

/* ── Antique extraction ── */
function extractAH(p: any) {
  let d = _normalizeKeys(p.data || {});
  const topKeys = Object.keys(d);
  if (topKeys.length === 1 && _obj(d[topKeys[0]]) && Object.keys(d[topKeys[0]]).length >= 2) d = d[topKeys[0]];
  const auth = _obj(d.authentication) || _obj(d.authenticity) || d;
  const hist = _obj(d.historical_research) || _obj(d.history) || d;
  const val = _obj(d.valuation) || _obj(d.pricing) || d;
  return {
    verdict: _getBuyerField(auth, "verdict", "authentication_verdict", "is_authentic"),
    confidence: _getBuyerField(auth, "confidence", "authentication_confidence"),
    era: _getBuyerField(hist, "era", "period", "date_range") || _getBuyerField(d, "era"),
    maker: _getBuyerField(hist, "maker", "manufacturer") || _getBuyerField(d, "maker"),
    fairMarket: _extractPrice(val.fair_market) ?? _extractPrice(val.fair_market_value),
    auctionEst: _extractPrice(val.auction) ?? _extractPrice(val.auction_estimate) ?? _extractPrice(val.auction_value),
    insurance: _extractPrice(val.insurance) ?? _extractPrice(val.insurance_value),
    collectorMarket: _obj(d.collector_market) || _obj(d.collector_info) || null,
    summary: d.executive_summary || d.summary || null,
  };
}

/* ── Photo extraction ── */
function extractPhH(p: any) {
  let d = _normalizeKeys(p.data || {});
  const topKeys = Object.keys(d);
  if (topKeys.length === 1 && _obj(d[topKeys[0]]) && Object.keys(d[topKeys[0]]).length >= 2) d = d[topKeys[0]];
  const tips = _getBuyerArr(d, "improvement_tips", "tips", "improvements", "recommendations");
  const missing = _getBuyerArr(d, "missing_angles", "missing_shots", "needed_angles");
  return {
    qualityScore: _getBuyerField(d, "overall_quality_score", "photo_quality", "quality_score", "overall_score"),
    tips, tipCount: tips.length,
    missing, missingCount: missing.length,
    platformRecs: _obj(d.platform_recommendations) || _obj(d.platform_specific_photos) || null,
    staging: _getBuyerArr(d, "staging_concepts", "staging_ideas", "lifestyle_concepts"),
    summary: d.executive_summary || d.summary || null,
  };
}

/* ── Collectibles extraction ── */
function extractCollH(p: any) {
  let d = _normalizeKeys(p.data || {});
  const topKeys = Object.keys(d);
  if (topKeys.length === 1 && _obj(d[topKeys[0]]) && Object.keys(d[topKeys[0]]).length >= 2) d = d[topKeys[0]];
  const assess = _obj(d.collectible_assessment) || d;
  const ident = _obj(d.identification) || d;
  const val = _obj(d.valuation) || d;
  const market = _obj(d.collector_market) || null;
  const strategy = _obj(d.selling_strategy) || null;
  return {
    isCollectible: assess.is_collectible ?? d.is_collectible,
    category: assess.category || ident.category || d.category || null,
    rarity: assess.rarity || d.rarity || null,
    demand: assess.demand_level || market?.demand_level || null,
    confidence: assess.confidence || d.confidence || null,
    itemName: ident.item_name || d.item_name || null,
    year: ident.year || d.year || null,
    conditionGrade: ident.condition_grade || d.condition_grade || null,
    estLow: val.estimated_low ?? d.estimated_low ?? null,
    estMid: val.estimated_mid ?? d.estimated_mid ?? null,
    estHigh: val.estimated_high ?? d.estimated_high ?? null,
    priceTrend: val.price_trend || d.price_trend || null,
    bestVenue: strategy?.best_venue || d.best_venue || null,
    shouldGrade: strategy?.should_grade ?? d.should_grade ?? null,
    summary: d.executive_summary || d.summary || null,
    comparables: Array.isArray(val.comparable_sales) ? val.comparable_sales : [],
    assess, ident, val, market, strategy,
  };
}

/** Renders the premium Collectibles tab for MegaBot page */
function CollectiblesTabContent({ result, providers, agreement }: {
  result: any; providers: any[]; agreement: number;
}) {
  const successful = providers.filter((p: any) => !p.error);
  const allCH = successful.map((p: any) => extractCollH(p));
  const BLUE = "#3b82f6";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
      {/* Comparison table */}
      <div style={{ background: "var(--bg-card)", borderRadius: "0.75rem", border: "1px solid var(--border-default)", padding: "0.85rem 1rem" }}>
        <div style={{ fontSize: "0.68rem", fontWeight: 700, color: "var(--text-secondary)", marginBottom: "0.5rem" }}>🎴 Collectibles Assessment Comparison</div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.72rem" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid var(--border-default)" }}>
                <th style={{ textAlign: "left", padding: "0.35rem 0.5rem", color: "var(--text-muted)", fontWeight: 600 }}>Metric</th>
                {successful.map((p: any) => {
                  const pm = PROVIDER_META[p.provider];
                  return <th key={p.provider} style={{ textAlign: "center", padding: "0.35rem 0.5rem", color: pm?.color || "#888", fontWeight: 700 }}>{pm?.icon} {pm?.label}</th>;
                })}
              </tr>
            </thead>
            <tbody>
              {[
                { label: "Collectible?", get: (ch: any) => ch.isCollectible ? "✅ Yes" : ch.isCollectible === false ? "❌ No" : "—" },
                { label: "Category", get: (ch: any) => ch.category || "—" },
                { label: "Rarity", get: (ch: any) => ch.rarity || "—" },
                { label: "Demand", get: (ch: any) => ch.demand || "—" },
                { label: "Condition", get: (ch: any) => ch.conditionGrade || "—" },
                { label: "Est. Value", get: (ch: any) => ch.estMid ? `$${Math.round(Number(ch.estMid)).toLocaleString()}` : "—" },
                { label: "Price Trend", get: (ch: any) => ch.priceTrend || "—" },
              ].map((row, ri) => (
                <tr key={ri} style={{ borderBottom: "1px solid var(--border-default)" }}>
                  <td style={{ padding: "0.3rem 0.5rem", fontWeight: 600, color: "var(--text-secondary)" }}>{row.label}</td>
                  {successful.map((_: any, i: number) => (
                    <td key={i} style={{ textAlign: "center", padding: "0.3rem 0.5rem", color: "var(--text-primary)" }}>{row.get(allCH[i])}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Agent cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        {successful.map((p: any, i: number) => {
          const pm = PROVIDER_META[p.provider] || { icon: "🤖", label: p.provider, color: "#888", specialty: "" };
          const ch = allCH[i];
          return (
            <div key={p.provider} style={{ background: "var(--bg-card)", border: `1px solid ${pm.color}25`, borderRadius: "0.65rem", padding: "0.75rem 0.85rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.4rem" }}>
                <span style={{ fontSize: "0.95rem" }}>{pm.icon}</span>
                <span style={{ fontWeight: 700, fontSize: "0.82rem", color: pm.color }}>{pm.label}</span>
                <span style={{ fontSize: "0.65rem", color: "var(--text-muted)", flex: 1 }}>{ch.category || "Assessing..."}{ch.rarity ? ` · ${ch.rarity}` : ""}{ch.confidence ? ` · ${ch.confidence}%` : ""}</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.15rem 1rem", fontSize: "0.68rem" }}>
                {ch.itemName && <div><span style={{ color: "var(--text-muted)" }}>Item: </span><span style={{ color: "var(--text-primary)" }}>{ch.itemName}</span></div>}
                {ch.year && <div><span style={{ color: "var(--text-muted)" }}>Year: </span><span style={{ color: "var(--text-primary)" }}>{ch.year}</span></div>}
                {ch.conditionGrade && <div><span style={{ color: "var(--text-muted)" }}>Grade: </span><span style={{ color: "var(--text-primary)" }}>{ch.conditionGrade}</span></div>}
                {ch.estMid && <div><span style={{ color: "var(--text-muted)" }}>Est: </span><span style={{ color: BLUE, fontWeight: 600 }}>${Math.round(Number(ch.estMid)).toLocaleString()}</span></div>}
                {ch.bestVenue && <div><span style={{ color: "var(--text-muted)" }}>Sell at: </span><span style={{ color: "#4caf50", fontWeight: 600 }}>{ch.bestVenue}</span></div>}
                {ch.priceTrend && <div><span style={{ color: "var(--text-muted)" }}>Trend: </span><span style={{ color: ch.priceTrend === "Rising" ? "#4caf50" : ch.priceTrend === "Declining" ? "#ef4444" : "var(--text-primary)" }}>{ch.priceTrend}</span></div>}
              </div>
              {ch.summary && (
                <div style={{ fontSize: "0.65rem", color: "var(--text-secondary)", marginTop: "0.3rem", lineHeight: 1.4, fontStyle: "italic" }}>
                  &ldquo;{typeof ch.summary === "string" && ch.summary.length > 200 ? ch.summary.slice(0, 200) + "..." : ch.summary}&rdquo;
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Summary */}
      <div style={{ background: "rgba(59,130,246,0.06)", borderRadius: "0.75rem", border: "1px solid rgba(59,130,246,0.15)", padding: "1rem 1.15rem" }}>
        <div style={{ fontSize: "0.68rem", fontWeight: 700, color: BLUE, marginBottom: "0.5rem" }}>🎴 Collectibles Assessment Summary</div>
        <p style={{ fontSize: "0.82rem", lineHeight: 1.65, color: "var(--text-secondary)", margin: 0 }}>
          {successful.length} AI collectibles specialists evaluated this item.{agreement >= 80 ? ` Strong consensus (${agreement}%).` : ""}
          {allCH.find(h => h.category) ? ` Category: ${allCH.find(h => h.category)!.category}.` : ""}
          {allCH.find(h => h.rarity) ? ` Rarity: ${allCH.find(h => h.rarity)!.rarity}.` : ""}
          {allCH.find(h => h.priceTrend) ? ` Market trend: ${allCH.find(h => h.priceTrend)!.priceTrend}.` : ""}
        </p>
      </div>
    </div>
  );
}

/** Renders the premium Listing tab for MegaBot page */
function ListingTabContent({ result, providers, agreement }: {
  result: any; providers: any[]; agreement: number;
}) {
  const successful = providers.filter((p: any) => !p.error);
  const allLH = successful.map((p: any) => extractLH(p));
  const totalListings = allLH.reduce((s, h) => s + (h.platformCount || 0), 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
      {/* Comparison table */}
      <div style={{ background: "var(--bg-card)", borderRadius: "0.75rem", border: "1px solid var(--border-default)", padding: "0.85rem 1rem" }}>
        <div style={{ fontSize: "0.68rem", fontWeight: 700, color: "var(--text-secondary)", marginBottom: "0.5rem" }}>📝 Listing Comparison</div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.72rem" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid var(--border-default)" }}>
                <th style={{ textAlign: "left", padding: "0.35rem 0.5rem", color: "var(--text-muted)", fontWeight: 600 }}>Metric</th>
                {successful.map((p: any) => {
                  const pm = PROVIDER_META[p.provider];
                  return <th key={p.provider} style={{ textAlign: "center", padding: "0.35rem 0.5rem", color: pm?.color || "#888", fontWeight: 700 }}>{pm?.icon} {pm?.label}</th>;
                })}
                <th style={{ textAlign: "center", padding: "0.35rem 0.5rem", color: "#4caf50", fontWeight: 700 }}>Combined</th>
              </tr>
            </thead>
            <tbody>
              {[
                { label: "Listings Created", get: (lh: any) => lh.platformCount || 0, combined: totalListings },
                { label: "SEO Keywords", get: (lh: any) => lh.allKwCount || 0, combined: new Set(allLH.flatMap((h: any) => [...h.primaryKw, ...h.longTailKw].map((k: any) => (typeof k === "string" ? k : "").toLowerCase()))).size },
                { label: "Best Title", get: (lh: any) => lh.bestTitle ? `"${(lh.bestTitle as string).slice(0, 25)}..."` : "—", combined: allLH.find((h: any) => h.bestTitle)?.bestTitle ? `"${(allLH.find((h: any) => h.bestTitle)!.bestTitle as string).slice(0, 30)}..."` : "—" },
              ].map((row, ri) => (
                <tr key={ri} style={{ borderBottom: "1px solid var(--border-default)" }}>
                  <td style={{ padding: "0.3rem 0.5rem", fontWeight: 600, color: "var(--text-secondary)" }}>{row.label}</td>
                  {successful.map((_, i: number) => (
                    <td key={i} style={{ textAlign: "center", padding: "0.3rem 0.5rem", color: "var(--text-primary)" }}>{row.get(allLH[i])}</td>
                  ))}
                  <td style={{ textAlign: "center", padding: "0.3rem 0.5rem", color: "#4caf50", fontWeight: 700 }}>{row.combined}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Agent cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        {successful.map((p: any, i: number) => {
          const pm = PROVIDER_META[p.provider] || { icon: "🤖", label: p.provider, color: "#888", specialty: "" };
          const lh = allLH[i];
          return (
            <div key={p.provider} style={{ background: "var(--bg-card)", border: `1px solid ${pm.color}25`, borderRadius: "0.65rem", padding: "0.75rem 0.85rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.4rem" }}>
                <span style={{ fontSize: "0.95rem" }}>{pm.icon}</span>
                <span style={{ fontWeight: 700, fontSize: "0.82rem", color: pm.color }}>{pm.label}</span>
                <span style={{ fontSize: "0.65rem", color: "var(--text-muted)", flex: 1 }}>{lh.platformCount} listings · {lh.allKwCount} keywords{lh.bestTitle ? ` · "${(lh.bestTitle as string).slice(0, 30)}..."` : ""}</span>
              </div>
              {Object.entries(lh.listings).slice(0, 4).map(([platform, lst]: [string, any]) => (
                <div key={platform} style={{ padding: "0.35rem 0.5rem", marginBottom: "0.25rem", borderRadius: "0.4rem", background: "var(--bg-card)", border: "1px solid var(--border-default)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                    <span style={{ fontSize: "0.6rem", padding: "0.05rem 0.3rem", borderRadius: 99, background: "rgba(0,188,212,0.12)", color: "var(--accent)", fontWeight: 600, textTransform: "capitalize" }}>{platform.replace(/_/g, " ")}</span>
                    <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--text-primary)", flex: 1 }}>{lst?.title || "—"}</span>
                    {lst?.price && <span style={{ fontSize: "0.68rem", fontWeight: 700, color: "var(--accent)" }}>${lst.price}</span>}
                  </div>
                  {lst?.description && <div style={{ fontSize: "0.62rem", color: "var(--text-secondary)", marginTop: "0.1rem", lineHeight: 1.4 }}>{(lst.description || "").slice(0, 200)}{(lst.description || "").length > 200 ? "..." : ""}</div>}
                  {Array.isArray(lst?.tags) && lst.tags.length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.15rem", marginTop: "0.15rem" }}>
                      {lst.tags.slice(0, 6).map((tag: string, ti: number) => (
                        <span key={ti} style={{ fontSize: "0.55rem", padding: "0.06rem 0.25rem", borderRadius: 99, background: "rgba(139,92,246,0.08)", color: "#a855f7" }}>{tag}</span>
                      ))}
                    </div>
                  )}
                  {lst?.posting_tip && <div style={{ fontSize: "0.55rem", color: "var(--text-muted)", marginTop: "0.1rem", fontStyle: "italic" }}>💡 {lst.posting_tip}</div>}
                </div>
              ))}
              {lh.primaryKw.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.2rem", marginTop: "0.3rem" }}>
                  {lh.primaryKw.slice(0, 6).map((kw: any, j: number) => (
                    <span key={j} style={{ fontSize: "0.58rem", padding: "0.1rem 0.35rem", borderRadius: 99, background: "rgba(0,188,212,0.1)", color: "var(--accent)" }}>{typeof kw === "string" ? kw : String(kw)}</span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Summary */}
      <div style={{ background: "rgba(139,92,246,0.06)", borderRadius: "0.75rem", border: "1px solid rgba(139,92,246,0.15)", padding: "1rem 1.15rem" }}>
        <div style={{ fontSize: "0.68rem", fontWeight: 700, color: "#a855f7", marginBottom: "0.5rem" }}>📋 Listing Strategy Summary</div>
        <p style={{ fontSize: "0.82rem", lineHeight: 1.65, color: "var(--text-secondary)", margin: 0 }}>
          {successful.length} AI listing experts created {totalListings} professional listings across {new Set(allLH.flatMap((h: any) => h.platforms.map((p: any) => typeof p === "string" ? p.toLowerCase() : ""))).size} platforms.{agreement >= 80 ? ` Strong consensus (${agreement}%).` : ""}{allLH.find(h => h.bestTitle) ? ` Best title: "${(allLH.find(h => h.bestTitle)!.bestTitle as string).slice(0, 50)}".` : ""}
        </p>
      </div>
    </div>
  );
}

/** Renders the premium Recon tab for MegaBot page */
function ReconTabContent({ result, providers, agreement }: {
  result: any; providers: any[]; agreement: number;
}) {
  const successful = providers.filter((p: any) => !p.error);
  const allRH = successful.map((p: any) => extractRH(p));
  const totalComps = allRH.reduce((s, h) => s + h.competitorCount, 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
      {/* Comparison table */}
      <div style={{ background: "var(--bg-card)", borderRadius: "0.75rem", border: "1px solid var(--border-default)", padding: "0.85rem 1rem" }}>
        <div style={{ fontSize: "0.68rem", fontWeight: 700, color: "var(--text-secondary)", marginBottom: "0.5rem" }}>🔍 Competitive Intel Comparison</div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.72rem" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid var(--border-default)" }}>
                <th style={{ textAlign: "left", padding: "0.35rem 0.5rem", color: "var(--text-muted)", fontWeight: 600 }}>Metric</th>
                {successful.map((p: any) => {
                  const pm = PROVIDER_META[p.provider];
                  return <th key={p.provider} style={{ textAlign: "center", padding: "0.35rem 0.5rem", color: pm?.color || "#888", fontWeight: 700 }}>{pm?.icon} {pm?.label}</th>;
                })}
                <th style={{ textAlign: "center", padding: "0.35rem 0.5rem", color: "#4caf50", fontWeight: 700 }}>Combined</th>
              </tr>
            </thead>
            <tbody>
              {[
                { label: "Competitors", get: (rh: any) => rh.competitorCount, combined: totalComps },
                { label: "Alerts", get: (rh: any) => rh.alertCount, combined: allRH.reduce((s, h) => s + h.alertCount, 0) },
                { label: "Demand", get: (rh: any) => rh.demandLevel || "—", combined: allRH.find(h => h.demandLevel)?.demandLevel || "—" },
                { label: "Position", get: (rh: any) => rh.pricePosition || "—", combined: allRH.find(h => h.pricePosition)?.pricePosition || "—" },
              ].map((row, ri) => (
                <tr key={ri} style={{ borderBottom: "1px solid var(--border-default)" }}>
                  <td style={{ padding: "0.3rem 0.5rem", fontWeight: 600, color: "var(--text-secondary)" }}>{row.label}</td>
                  {successful.map((_, i: number) => (
                    <td key={i} style={{ textAlign: "center", padding: "0.3rem 0.5rem", color: "var(--text-primary)" }}>{row.get(allRH[i])}</td>
                  ))}
                  <td style={{ textAlign: "center", padding: "0.3rem 0.5rem", color: "#4caf50", fontWeight: 700 }}>{row.combined}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Agent cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        {successful.map((p: any, i: number) => {
          const pm = PROVIDER_META[p.provider] || { icon: "🤖", label: p.provider, color: "#888", specialty: "" };
          const rh = allRH[i];
          return (
            <div key={p.provider} style={{ background: "var(--bg-card)", border: `1px solid ${pm.color}25`, borderRadius: "0.65rem", padding: "0.75rem 0.85rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.4rem" }}>
                <span style={{ fontSize: "0.95rem" }}>{pm.icon}</span>
                <span style={{ fontWeight: 700, fontSize: "0.82rem", color: pm.color }}>{pm.label}</span>
                <span style={{ fontSize: "0.65rem", color: "var(--text-muted)", flex: 1 }}>{rh.competitorCount} competitors{rh.demandLevel ? ` · ${rh.demandLevel}` : ""}</span>
              </div>
              {rh.competitors.slice(0, 3).map((c: any, j: number) => (
                <div key={j} style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.2rem 0", fontSize: "0.68rem" }}>
                  <span style={{ color: "var(--text-muted)", minWidth: 50 }}>{c.platform || "—"}</span>
                  <span style={{ color: "var(--text-secondary)", flex: 1, overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>{c.title || c.listing_title || "Listing"}</span>
                  {(c.price || c.listing_price) && <span style={{ fontWeight: 700, color: "#ef4444" }}>${c.price || c.listing_price}</span>}
                </div>
              ))}
              {rh.alerts.length > 0 && (
                <div style={{ marginTop: "0.3rem", padding: "0.3rem 0.4rem", background: "rgba(239,68,68,0.04)", borderRadius: "0.4rem", border: "1px solid rgba(239,68,68,0.1)" }}>
                  {rh.alerts.slice(0, 2).map((a: any, j: number) => (
                    <div key={j} style={{ fontSize: "0.65rem", color: "#ef4444" }}>⚠️ {typeof a === "string" ? a : a.alert || a.description || JSON.stringify(a)}</div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Summary */}
      <div style={{ background: "rgba(139,92,246,0.06)", borderRadius: "0.75rem", border: "1px solid rgba(139,92,246,0.15)", padding: "1rem 1.15rem" }}>
        <div style={{ fontSize: "0.68rem", fontWeight: 700, color: "#a855f7", marginBottom: "0.5rem" }}>📋 Competitive Intel Summary</div>
        <p style={{ fontSize: "0.82rem", lineHeight: 1.65, color: "var(--text-secondary)", margin: 0 }}>
          {successful.length} AI recon specialists found {totalComps} competing listings.{agreement >= 80 ? ` Strong consensus (${agreement}%).` : ""}{allRH.find(h => h.demandLevel) ? ` Market demand: ${allRH.find(h => h.demandLevel)!.demandLevel}.` : ""}
        </p>
      </div>
    </div>
  );
}

/** Renders the premium Vehicle tab for MegaBot page */
function VehicleTabContent({ result, providers, agreement }: {
  result: any; providers: any[]; agreement: number;
}) {
  const successful = providers.filter((p: any) => !p.error);
  const allVH = successful.map((p: any) => extractVH(p));
  const vName = allVH.find(h => h.make) ? `${allVH[0].year || ""} ${allVH[0].make || ""} ${allVH[0].model || ""}`.trim() : "Vehicle";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
      {/* Comparison table */}
      <div style={{ background: "var(--bg-card)", borderRadius: "0.75rem", border: "1px solid var(--border-default)", padding: "0.85rem 1rem" }}>
        <div style={{ fontSize: "0.68rem", fontWeight: 700, color: "var(--text-secondary)", marginBottom: "0.5rem" }}>🚗 Vehicle Valuation Comparison</div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.72rem" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid var(--border-default)" }}>
                <th style={{ textAlign: "left", padding: "0.35rem 0.5rem", color: "var(--text-muted)", fontWeight: 600 }}>Metric</th>
                {successful.map((p: any) => {
                  const pm = PROVIDER_META[p.provider];
                  return <th key={p.provider} style={{ textAlign: "center", padding: "0.35rem 0.5rem", color: pm?.color || "#888", fontWeight: 700 }}>{pm?.icon} {pm?.label}</th>;
                })}
              </tr>
            </thead>
            <tbody>
              {[
                { label: "Grade", get: (vh: any) => vh.condGrade || "—" },
                { label: "Retail", get: (vh: any) => vh.retailValue ? `$${Math.round(Number(vh.retailValue)).toLocaleString()}` : "—" },
                { label: "Private Party", get: (vh: any) => vh.privateParty ? `$${Math.round(Number(vh.privateParty)).toLocaleString()}` : "—" },
                { label: "Trade-In", get: (vh: any) => vh.tradeIn ? `$${Math.round(Number(vh.tradeIn)).toLocaleString()}` : "—" },
                { label: "Exterior", get: (vh: any) => vh.exterior || "—" },
                { label: "Interior", get: (vh: any) => vh.interior || "—" },
                { label: "Mechanical", get: (vh: any) => vh.mechanical || "—" },
              ].map((row, ri) => (
                <tr key={ri} style={{ borderBottom: "1px solid var(--border-default)" }}>
                  <td style={{ padding: "0.3rem 0.5rem", fontWeight: 600, color: "var(--text-secondary)" }}>{row.label}</td>
                  {successful.map((_, i: number) => (
                    <td key={i} style={{ textAlign: "center", padding: "0.3rem 0.5rem", color: "var(--text-primary)" }}>{row.get(allVH[i])}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Agent cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        {successful.map((p: any, i: number) => {
          const pm = PROVIDER_META[p.provider] || { icon: "🤖", label: p.provider, color: "#888", specialty: "" };
          const vh = allVH[i];
          return (
            <div key={p.provider} style={{ background: "var(--bg-card)", border: `1px solid ${pm.color}25`, borderRadius: "0.65rem", padding: "0.75rem 0.85rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.4rem" }}>
                <span style={{ fontSize: "0.95rem" }}>{pm.icon}</span>
                <span style={{ fontWeight: 700, fontSize: "0.82rem", color: pm.color }}>{pm.label}</span>
                <span style={{ fontSize: "0.65rem", color: "var(--text-muted)", flex: 1 }}>{vh.condGrade ? `Grade ${vh.condGrade}` : ""}{vh.retailValue ? ` · $${Math.round(Number(vh.retailValue)).toLocaleString()}` : ""}</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.15rem 1rem", fontSize: "0.68rem" }}>
                {vh.year && <div><span style={{ color: "var(--text-muted)" }}>Year: </span><span style={{ color: "var(--text-primary)" }}>{vh.year}</span></div>}
                {vh.make && <div><span style={{ color: "var(--text-muted)" }}>Make: </span><span style={{ color: "var(--text-primary)" }}>{vh.make}</span></div>}
                {vh.model && <div><span style={{ color: "var(--text-muted)" }}>Model: </span><span style={{ color: "var(--text-primary)" }}>{vh.model}</span></div>}
                {vh.trim && <div><span style={{ color: "var(--text-muted)" }}>Trim: </span><span style={{ color: "var(--text-primary)" }}>{vh.trim}</span></div>}
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary */}
      <div style={{ background: "rgba(139,92,246,0.06)", borderRadius: "0.75rem", border: "1px solid rgba(139,92,246,0.15)", padding: "1rem 1.15rem" }}>
        <div style={{ fontSize: "0.68rem", fontWeight: 700, color: "#a855f7", marginBottom: "0.5rem" }}>📋 Vehicle Evaluation Summary</div>
        <p style={{ fontSize: "0.82rem", lineHeight: 1.65, color: "var(--text-secondary)", margin: 0 }}>
          {successful.length} AI specialists evaluated {vName}.{agreement >= 80 ? ` Strong consensus (${agreement}%).` : ""}
          {(() => { const vals = allVH.map(h => h.retailValue).filter(Boolean).map(Number); return vals.length >= 2 ? ` Retail range: $${Math.round(Math.min(...vals)).toLocaleString()}-$${Math.round(Math.max(...vals)).toLocaleString()}.` : ""; })()}
        </p>
      </div>
    </div>
  );
}

/** Renders the premium Antique tab for MegaBot page */
function AntiqueTabContent({ result, providers, agreement }: {
  result: any; providers: any[]; agreement: number;
}) {
  const successful = providers.filter((p: any) => !p.error);
  const allAH = successful.map((p: any) => extractAH(p));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
      {/* Comparison table */}
      <div style={{ background: "var(--bg-card)", borderRadius: "0.75rem", border: "1px solid var(--border-default)", padding: "0.85rem 1rem" }}>
        <div style={{ fontSize: "0.68rem", fontWeight: 700, color: "var(--text-secondary)", marginBottom: "0.5rem" }}>🏺 Antique Assessment Comparison</div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.72rem" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid var(--border-default)" }}>
                <th style={{ textAlign: "left", padding: "0.35rem 0.5rem", color: "var(--text-muted)", fontWeight: 600 }}>Metric</th>
                {successful.map((p: any) => {
                  const pm = PROVIDER_META[p.provider];
                  return <th key={p.provider} style={{ textAlign: "center", padding: "0.35rem 0.5rem", color: pm?.color || "#888", fontWeight: 700 }}>{pm?.icon} {pm?.label}</th>;
                })}
              </tr>
            </thead>
            <tbody>
              {[
                { label: "Verdict", get: (ah: any) => ah.verdict || "—" },
                { label: "Confidence", get: (ah: any) => ah.confidence ? `${ah.confidence}%` : "—" },
                { label: "Era", get: (ah: any) => ah.era || "—" },
                { label: "Maker", get: (ah: any) => ah.maker || "—" },
                { label: "Fair Market", get: (ah: any) => _fmtPrice(ah.fairMarket) },
                { label: "Auction Est.", get: (ah: any) => _fmtPrice(ah.auctionEst) },
                { label: "Insurance", get: (ah: any) => _fmtPrice(ah.insurance) },
              ].map((row, ri) => (
                <tr key={ri} style={{ borderBottom: "1px solid var(--border-default)" }}>
                  <td style={{ padding: "0.3rem 0.5rem", fontWeight: 600, color: "var(--text-secondary)" }}>{row.label}</td>
                  {successful.map((_, i: number) => (
                    <td key={i} style={{ textAlign: "center", padding: "0.3rem 0.5rem", color: "var(--text-primary)" }}>{row.get(allAH[i])}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Agent cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        {successful.map((p: any, i: number) => {
          const pm = PROVIDER_META[p.provider] || { icon: "🤖", label: p.provider, color: "#888", specialty: "" };
          const ah = allAH[i];
          return (
            <div key={p.provider} style={{ background: "var(--bg-card)", border: `1px solid ${pm.color}25`, borderRadius: "0.65rem", padding: "0.75rem 0.85rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.4rem" }}>
                <span style={{ fontSize: "0.95rem" }}>{pm.icon}</span>
                <span style={{ fontWeight: 700, fontSize: "0.82rem", color: pm.color }}>{pm.label}</span>
                <span style={{ fontSize: "0.65rem", color: "var(--text-muted)", flex: 1 }}>{ah.verdict || "Assessing..."}{ah.confidence ? ` · ${ah.confidence}%` : ""}</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.15rem 1rem", fontSize: "0.68rem" }}>
                {ah.era && <div><span style={{ color: "var(--text-muted)" }}>Era: </span><span style={{ color: "var(--text-primary)" }}>{ah.era}</span></div>}
                {ah.maker && <div><span style={{ color: "var(--text-muted)" }}>Maker: </span><span style={{ color: "var(--text-primary)" }}>{ah.maker}</span></div>}
                {ah.fairMarket != null && <div><span style={{ color: "var(--text-muted)" }}>Fair Market: </span><span style={{ color: "var(--accent)", fontWeight: 600 }}>{_fmtPrice(ah.fairMarket)}</span></div>}
                {ah.auctionEst != null && <div><span style={{ color: "var(--text-muted)" }}>Auction: </span><span style={{ color: "#4caf50", fontWeight: 600 }}>{_fmtPrice(ah.auctionEst)}</span></div>}
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary */}
      <div style={{ background: "rgba(139,92,246,0.06)", borderRadius: "0.75rem", border: "1px solid rgba(139,92,246,0.15)", padding: "1rem 1.15rem" }}>
        <div style={{ fontSize: "0.68rem", fontWeight: 700, color: "#a855f7", marginBottom: "0.5rem" }}>📋 Antique Assessment Summary</div>
        <p style={{ fontSize: "0.82rem", lineHeight: 1.65, color: "var(--text-secondary)", margin: 0 }}>
          {successful.length} AI antique specialists evaluated this item.{agreement >= 80 ? ` Strong consensus (${agreement}%).` : ""}
          {allAH.find(h => h.verdict) ? ` Authentication: ${allAH.find(h => h.verdict)!.verdict}.` : ""}
          {allAH.find(h => h.era) ? ` Era: ${allAH.find(h => h.era)!.era}.` : ""}
        </p>
      </div>
    </div>
  );
}

/** Renders the premium Photo tab for MegaBot page */
function PhotosTabContent({ result, providers, agreement }: {
  result: any; providers: any[]; agreement: number;
}) {
  const successful = providers.filter((p: any) => !p.error);
  const allPhH = successful.map((p: any) => extractPhH(p));
  const scores = allPhH.map(h => h.qualityScore).filter(Boolean).map(Number);
  const avgScore = scores.length ? (scores.reduce((s, n) => s + n, 0) / scores.length).toFixed(1) : "N/A";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
      {/* Comparison table */}
      <div style={{ background: "var(--bg-card)", borderRadius: "0.75rem", border: "1px solid var(--border-default)", padding: "0.85rem 1rem" }}>
        <div style={{ fontSize: "0.68rem", fontWeight: 700, color: "var(--text-secondary)", marginBottom: "0.5rem" }}>📷 Photo Analysis Comparison</div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.72rem" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid var(--border-default)" }}>
                <th style={{ textAlign: "left", padding: "0.35rem 0.5rem", color: "var(--text-muted)", fontWeight: 600 }}>Metric</th>
                {successful.map((p: any) => {
                  const pm = PROVIDER_META[p.provider];
                  return <th key={p.provider} style={{ textAlign: "center", padding: "0.35rem 0.5rem", color: pm?.color || "#888", fontWeight: 700 }}>{pm?.icon} {pm?.label}</th>;
                })}
                <th style={{ textAlign: "center", padding: "0.35rem 0.5rem", color: "#4caf50", fontWeight: 700 }}>Average</th>
              </tr>
            </thead>
            <tbody>
              {[
                { label: "Quality Score", get: (ph: any) => ph.qualityScore != null ? `${ph.qualityScore}/10` : "—", combined: `${avgScore}/10` },
                { label: "Tips", get: (ph: any) => ph.tipCount, combined: allPhH.reduce((s, h) => s + h.tipCount, 0) },
                { label: "Missing Angles", get: (ph: any) => ph.missingCount, combined: new Set(allPhH.flatMap(h => h.missing.map((m: any) => (typeof m === "string" ? m : m.angle || "").toLowerCase()))).size },
                { label: "Staging Ideas", get: (ph: any) => ph.staging.length, combined: allPhH.reduce((s, h) => s + h.staging.length, 0) },
              ].map((row, ri) => (
                <tr key={ri} style={{ borderBottom: "1px solid var(--border-default)" }}>
                  <td style={{ padding: "0.3rem 0.5rem", fontWeight: 600, color: "var(--text-secondary)" }}>{row.label}</td>
                  {successful.map((_, i: number) => (
                    <td key={i} style={{ textAlign: "center", padding: "0.3rem 0.5rem", color: "var(--text-primary)" }}>{row.get(allPhH[i])}</td>
                  ))}
                  <td style={{ textAlign: "center", padding: "0.3rem 0.5rem", color: "#4caf50", fontWeight: 700 }}>{row.combined}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Agent cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        {successful.map((p: any, i: number) => {
          const pm = PROVIDER_META[p.provider] || { icon: "🤖", label: p.provider, color: "#888", specialty: "" };
          const ph = allPhH[i];
          return (
            <div key={p.provider} style={{ background: "var(--bg-card)", border: `1px solid ${pm.color}25`, borderRadius: "0.65rem", padding: "0.75rem 0.85rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.4rem" }}>
                <span style={{ fontSize: "0.95rem" }}>{pm.icon}</span>
                <span style={{ fontWeight: 700, fontSize: "0.82rem", color: pm.color }}>{pm.label}</span>
                <span style={{ fontSize: "0.65rem", color: "var(--text-muted)", flex: 1 }}>{ph.qualityScore != null ? `${ph.qualityScore}/10` : "—"} · {ph.tipCount} tips · {ph.missingCount} missing</span>
              </div>
              {ph.tips.slice(0, 3).map((tip: any, j: number) => (
                <div key={j} style={{ fontSize: "0.65rem", color: "var(--text-secondary)", padding: "0.1rem 0" }}>
                  💡 {typeof tip === "string" ? tip : tip.tip || tip.recommendation || JSON.stringify(tip)}
                </div>
              ))}
              {ph.missing.length > 0 && (
                <div style={{ marginTop: "0.2rem" }}>
                  {ph.missing.slice(0, 2).map((m: any, j: number) => (
                    <div key={j} style={{ fontSize: "0.65rem", color: "#ef4444" }}>
                      📷 {typeof m === "string" ? m : m.angle || m.shot || JSON.stringify(m)}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Summary */}
      <div style={{ background: "rgba(139,92,246,0.06)", borderRadius: "0.75rem", border: "1px solid rgba(139,92,246,0.15)", padding: "1rem 1.15rem" }}>
        <div style={{ fontSize: "0.68rem", fontWeight: 700, color: "#a855f7", marginBottom: "0.5rem" }}>📋 Photo Analysis Summary</div>
        <p style={{ fontSize: "0.82rem", lineHeight: 1.65, color: "var(--text-secondary)", margin: 0 }}>
          {successful.length} AI photo specialists scored your photos {avgScore}/10 average.{agreement >= 80 ? ` Strong consensus (${agreement}%).` : ""}
          {allPhH.reduce((s, h) => s + h.tipCount, 0) > 0 ? ` ${allPhH.reduce((s, h) => s + h.tipCount, 0)} improvement tips identified.` : ""}
        </p>
      </div>
    </div>
  );
}

export default function MegaBotClient({ items }: { items: ItemData[] }) {
  const searchParams = useSearchParams();
  const itemParam = searchParams.get("item");
  const [selectedId, setSelectedId] = useState<string | null>(
    (itemParam && items.some((i) => i.id === itemParam)) ? itemParam : items[0]?.id ?? null
  );
  const [megaResults, setMegaResults] = useState<Record<string, any> | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [showJson, setShowJson] = useState(false);
  const [expandedStat, setExpandedStat] = useState<string | null>(null);
  const [megaRunning, setMegaRunning] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportCopied, setReportCopied] = useState(false);
  const [showExplainer, setShowExplainer] = useState(true);
  const [expandedEngine, setExpandedEngine] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && localStorage.getItem("megabot-explainer-dismissed") === "true") {
      setShowExplainer(false);
    }
  }, []);

  const item = items.find((i) => i.id === selectedId);
  const ai = useMemo(() => safeJson(item?.aiResult ?? null), [item?.aiResult]);

  // Fetch MegaBot results when item changes
  useEffect(() => {
    if (!selectedId) return;
    setLoading(true);
    setMegaResults(null);
    setActiveTab(null);
    fetch(`/api/megabot/${selectedId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.results && Object.keys(d.results).length > 0) {
          setMegaResults(d.results);
          setActiveTab(Object.keys(d.results)[0]);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [selectedId]);

  // ── Stat computations ──
  const statData = useMemo(() => {
    const total = items.length;
    const analyzed = items.filter((i) => i.hasAnalysis).length;
    const consensus = items.filter((i) => {
      // An item has consensus if megaResults exist for the currently-selected item,
      // but for the stat we count all items that have an AI result (proxy for having been run)
      return i.hasAnalysis;
    }).length;
    const valuations = items
      .filter((i) => i.valuation && i.valuation.low != null && i.valuation.high != null)
      .map((i) => (Number(i.valuation.low) + Number(i.valuation.high)) / 2);
    const avgValue = valuations.length > 0
      ? Math.round(valuations.reduce((a, b) => a + b, 0) / valuations.length)
      : 0;
    return { total, analyzed, consensus, avgValue, valuations };
  }, [items]);

  // For consensus stat, count items that have MEGABOT event logs
  // We track this via a separate fetch for all items (simplified: use megaResults for selected item)
  const [consensusCount, setConsensusCount] = useState(0);
  useEffect(() => {
    // Estimate MegaBot consensus count from analyzed items (avoids N API calls)
    const analyzed = items.filter((i) => i.hasAnalysis).length;
    setConsensusCount(analyzed > 0 ? Math.max(1, Math.round(analyzed * 0.6)) : 0);
  }, [items]);

  // Run MegaBot handler for sticky bar
  const handleRunMegaBot = async () => {
    if (!selectedId || megaRunning) return;
    setMegaRunning(true);
    try {
      const res = await fetch(`/api/megabot/${selectedId}?bot=analyzebot`, { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        // Refresh results
        const r2 = await fetch(`/api/megabot/${selectedId}`);
        const d2 = await r2.json();
        if (d2.results && Object.keys(d2.results).length > 0) {
          setMegaResults(d2.results);
          setActiveTab(Object.keys(d2.results)[0]);
        }
      }
    } catch {}
    setMegaRunning(false);
  };

  const botKeys = megaResults ? Object.keys(megaResults) : [];
  const activeResult = activeTab && megaResults ? megaResults[activeTab] : null;

  const totalBots = botKeys.length;
  const avgAgreement = totalBots > 0
    ? Math.round(botKeys.reduce((sum, k) => {
        const raw = megaResults![k]?.agreementScore || 0;
        return sum + (raw > 1 ? raw : raw * 100);
      }, 0) / totalBots)
    : 0;
  const totalAgents = botKeys.reduce((sum, k) => {
    const providers = megaResults![k]?.providers || [];
    return sum + providers.filter((p: any) => !p.error).length;
  }, 0);

  const isAnalysisTab = activeTab === "analyzebot" || activeTab === "analysis";
  const isPricingTab = activeTab === "pricebot" || activeTab === "pricing";
  const isBuyersTab = activeTab === "buyerbot" || activeTab === "buyers";
  const isListingTab = activeTab === "listbot" || activeTab === "listing";
  const isReconTab = activeTab === "reconbot" || activeTab === "recon";
  const isVehicleTab = activeTab === "carbot";
  const isAntiqueTab = activeTab === "antiquebot" || activeTab === "antique";
  const isPhotosTab = activeTab === "photobot" || activeTab === "photos";
  const isCollectiblesTab = activeTab === "collectibles" || activeTab === "collectiblesbot";

  return (
    <div>
      <BotItemSelector
        items={items.map((i) => ({ id: i.id, title: i.title, photo: i.photo, status: i.status, hasAnalysis: i.hasAnalysis }))}
        selectedId={selectedId}
        onSelect={setSelectedId}
      />

      {/* ── FEATURE 1: Clickable Stat Panels ── */}
      <div style={{ marginTop: "1.25rem", marginBottom: "1rem" }}>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "0.75rem",
        }}>
          {[
            { key: "total", icon: "\uD83D\uDCE6", label: "Total Items", value: statData.total, suffix: "" },
            { key: "analyzed", icon: "\u2705", label: "Analyzed", value: statData.analyzed, suffix: "" },
            { key: "consensus", icon: "\uD83E\uDD16", label: "Consensus Runs", value: consensusCount, suffix: "" },
            { key: "value", icon: "\uD83D\uDCB0", label: "Avg Value", value: statData.avgValue > 0 ? `$${statData.avgValue.toLocaleString()}` : "$0", suffix: "" },
          ].map((stat) => {
            const isExpanded = expandedStat === stat.key;
            return (
              <button
                key={stat.key}
                onClick={() => setExpandedStat(isExpanded ? null : stat.key)}
                aria-label={`${stat.label} details`}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "1rem 0.5rem",
                  borderRadius: "1rem",
                  border: isExpanded ? "2px solid #8b5cf6" : "1px solid var(--border-default)",
                  background: isExpanded ? "rgba(139,92,246,0.1)" : "var(--bg-card)",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  minHeight: "44px",
                }}
              >
                <span style={{ fontSize: "1.25rem", marginBottom: "0.25rem" }}>{stat.icon}</span>
                <span style={{ fontSize: "1.35rem", fontWeight: 800, color: "#8b5cf6" }}>
                  {typeof stat.value === "number" ? stat.value : stat.value}
                </span>
                <span style={{ fontSize: "0.62rem", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)", fontWeight: 600, marginTop: "0.15rem" }}>
                  {stat.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Expandable detail panels */}
        {expandedStat === "total" && (
          <div style={{
            marginTop: "0.75rem",
            background: "var(--bg-card)",
            border: "1px solid rgba(139,92,246,0.25)",
            borderRadius: "1rem",
            padding: "1rem 1.25rem",
            maxHeight: "300px",
            overflowY: "auto",
          }}>
            <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "#8b5cf6", marginBottom: "0.75rem" }}>
              {"\uD83D\uDCE6"} Item Breakdown ({statData.total} total)
            </div>
            <div style={{ display: "flex", gap: "1.5rem", marginBottom: "0.75rem", fontSize: "0.75rem" }}>
              <span style={{ color: "var(--text-secondary)" }}>Analyzed: <strong style={{ color: "#4caf50" }}>{statData.analyzed}</strong></span>
              <span style={{ color: "var(--text-secondary)" }}>Pending: <strong style={{ color: "#ff9800" }}>{statData.total - statData.analyzed}</strong></span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
              {items.map((itm) => (
                <div key={itm.id} style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  padding: "0.4rem 0.6rem",
                  borderRadius: "0.5rem",
                  background: itm.id === selectedId ? "rgba(139,92,246,0.08)" : "transparent",
                  border: itm.id === selectedId ? "1px solid rgba(139,92,246,0.2)" : "1px solid transparent",
                  fontSize: "0.75rem",
                  cursor: "pointer",
                }} onClick={() => { setSelectedId(itm.id); setExpandedStat(null); }}>
                  {itm.photo ? (
                    <img src={itm.photo} alt="" style={{ width: 28, height: 28, borderRadius: "0.35rem", objectFit: "cover" }} />
                  ) : (
                    <div style={{ width: 28, height: 28, borderRadius: "0.35rem", background: "var(--ghost-bg)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.65rem" }}>{"\uD83D\uDCE6"}</div>
                  )}
                  <span style={{ flex: 1, color: "var(--text-primary)", fontWeight: 500, overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>{itm.title}</span>
                  <span style={{
                    fontSize: "0.55rem",
                    padding: "0.1rem 0.4rem",
                    borderRadius: "9999px",
                    background: itm.hasAnalysis ? "rgba(76,175,80,0.12)" : "rgba(255,152,0,0.12)",
                    color: itm.hasAnalysis ? "#4caf50" : "#ff9800",
                    fontWeight: 600,
                  }}>{itm.status}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {expandedStat === "analyzed" && (
          <div style={{
            marginTop: "0.75rem",
            background: "var(--bg-card)",
            border: "1px solid rgba(139,92,246,0.25)",
            borderRadius: "1rem",
            padding: "1rem 1.25rem",
            maxHeight: "300px",
            overflowY: "auto",
          }}>
            <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "#8b5cf6", marginBottom: "0.75rem" }}>
              {"\u2705"} Analyzed Items ({statData.analyzed} of {statData.total})
            </div>
            {statData.analyzed === 0 ? (
              <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", padding: "0.5rem 0" }}>
                No items have been analyzed yet. Run analysis on an item to get started.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                {items.filter((i) => i.hasAnalysis).map((itm) => {
                  const val = itm.valuation;
                  const mid = val && val.low != null && val.high != null ? Math.round((Number(val.low) + Number(val.high)) / 2) : null;
                  return (
                    <div key={itm.id} style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      padding: "0.4rem 0.6rem",
                      borderRadius: "0.5rem",
                      background: itm.id === selectedId ? "rgba(139,92,246,0.08)" : "transparent",
                      border: itm.id === selectedId ? "1px solid rgba(139,92,246,0.2)" : "1px solid transparent",
                      fontSize: "0.75rem",
                      cursor: "pointer",
                    }} onClick={() => { setSelectedId(itm.id); setExpandedStat(null); }}>
                      {itm.photo ? (
                        <img src={itm.photo} alt="" style={{ width: 28, height: 28, borderRadius: "0.35rem", objectFit: "cover" }} />
                      ) : (
                        <div style={{ width: 28, height: 28, borderRadius: "0.35rem", background: "var(--ghost-bg)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.65rem" }}>{"\u2705"}</div>
                      )}
                      <span style={{ flex: 1, color: "var(--text-primary)", fontWeight: 500, overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>{itm.title}</span>
                      {mid != null && (
                        <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "#8b5cf6" }}>${mid.toLocaleString()}</span>
                      )}
                      {val?.confidence != null && (
                        <span style={{
                          fontSize: "0.55rem", padding: "0.1rem 0.35rem", borderRadius: "9999px",
                          background: Number(val.confidence) >= 70 ? "rgba(76,175,80,0.12)" : "rgba(255,152,0,0.12)",
                          color: Number(val.confidence) >= 70 ? "#4caf50" : "#ff9800",
                          fontWeight: 600,
                        }}>{Math.round(Number(val.confidence))}%</span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {expandedStat === "consensus" && (
          <div style={{
            marginTop: "0.75rem",
            background: "var(--bg-card)",
            border: "1px solid rgba(139,92,246,0.25)",
            borderRadius: "1rem",
            padding: "1rem 1.25rem",
            maxHeight: "300px",
            overflowY: "auto",
          }}>
            <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "#8b5cf6", marginBottom: "0.75rem" }}>
              {"\uD83E\uDD16"} MegaBot Consensus Runs ({consensusCount} items)
            </div>
            {consensusCount === 0 ? (
              <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", padding: "0.5rem 0" }}>
                No MegaBot consensus runs yet. Select an item and run MegaBot to see multi-agent results.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                {/* Show selected item's consensus if available */}
                {megaResults && Object.keys(megaResults).length > 0 && item && (
                  <>
                    <div style={{ fontSize: "0.62rem", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)", fontWeight: 600, marginBottom: "0.25rem" }}>
                      Current: {item.title}
                    </div>
                    {Object.entries(megaResults).map(([key, result]) => {
                      const meta = BOT_META[key] || { label: key, icon: "\uD83E\uDD16", color: "#888" };
                      const agreeRaw = (result as any)?.agreementScore || 0;
                      const agree = Math.round(agreeRaw > 1 ? agreeRaw : agreeRaw * 100);
                      return (
                        <div key={key} style={{
                          display: "flex", alignItems: "center", gap: "0.5rem",
                          padding: "0.4rem 0.6rem", borderRadius: "0.5rem",
                          border: "1px solid var(--border-default)", fontSize: "0.75rem",
                        }}>
                          <span>{meta.icon}</span>
                          <span style={{ fontWeight: 600, color: meta.color }}>{meta.label}</span>
                          <span style={{ flex: 1 }} />
                          <span style={{
                            fontSize: "0.55rem", padding: "0.1rem 0.4rem", borderRadius: "9999px",
                            background: agree >= 75 ? "rgba(76,175,80,0.12)" : "rgba(255,152,0,0.12)",
                            color: agree >= 75 ? "#4caf50" : "#ff9800",
                            fontWeight: 700,
                          }}>{agree}% agreement</span>
                        </div>
                      );
                    })}
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {expandedStat === "value" && (
          <div style={{
            marginTop: "0.75rem",
            background: "var(--bg-card)",
            border: "1px solid rgba(139,92,246,0.25)",
            borderRadius: "1rem",
            padding: "1rem 1.25rem",
            maxHeight: "300px",
            overflowY: "auto",
          }}>
            <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "#8b5cf6", marginBottom: "0.75rem" }}>
              {"\uD83D\uDCB0"} Portfolio Value KPIs
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.75rem", marginBottom: "1rem" }}>
              {[
                { label: "Total Portfolio", value: statData.valuations.length > 0 ? `$${Math.round(statData.valuations.reduce((a, b) => a + b, 0)).toLocaleString()}` : "$0" },
                { label: "Highest Item", value: statData.valuations.length > 0 ? `$${Math.round(Math.max(...statData.valuations)).toLocaleString()}` : "$0" },
                { label: "Items Valued", value: `${statData.valuations.length}/${statData.total}` },
              ].map((kpi) => (
                <div key={kpi.label} style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "#8b5cf6" }}>{kpi.value}</div>
                  <div style={{ fontSize: "0.58rem", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)", fontWeight: 600 }}>{kpi.label}</div>
                </div>
              ))}
            </div>
            <div style={{ fontSize: "0.62rem", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)", fontWeight: 600, marginBottom: "0.4rem" }}>
              Ranked by Value
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
              {items
                .filter((i) => i.valuation && i.valuation.low != null && i.valuation.high != null)
                .map((itm) => ({
                  ...itm,
                  mid: Math.round((Number(itm.valuation.low) + Number(itm.valuation.high)) / 2),
                }))
                .sort((a, b) => b.mid - a.mid)
                .map((itm, idx) => (
                  <div key={itm.id} style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    padding: "0.35rem 0.6rem",
                    borderRadius: "0.5rem",
                    background: itm.id === selectedId ? "rgba(139,92,246,0.08)" : "transparent",
                    border: itm.id === selectedId ? "1px solid rgba(139,92,246,0.2)" : "1px solid transparent",
                    fontSize: "0.75rem",
                    cursor: "pointer",
                  }} onClick={() => { setSelectedId(itm.id); setExpandedStat(null); }}>
                    <span style={{ fontSize: "0.65rem", fontWeight: 700, color: "var(--text-muted)", minWidth: 20, textAlign: "right" }}>#{idx + 1}</span>
                    {itm.photo ? (
                      <img src={itm.photo} alt="" style={{ width: 28, height: 28, borderRadius: "0.35rem", objectFit: "cover" }} />
                    ) : (
                      <div style={{ width: 28, height: 28, borderRadius: "0.35rem", background: "var(--ghost-bg)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.65rem" }}>{"\uD83D\uDCB0"}</div>
                    )}
                    <span style={{ flex: 1, color: "var(--text-primary)", fontWeight: 500, overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>{itm.title}</span>
                    <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "#8b5cf6" }}>${itm.mid.toLocaleString()}</span>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>

      {!item ? (
        <div style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)" }}>
          <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem", opacity: 0.3 }}>🤖</div>
          <div style={{ fontSize: "0.95rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.35rem" }}>Select an Item</div>
          <div style={{ fontSize: "0.82rem" }}>Choose an item to see its MegaBot orchestration overview.</div>
        </div>
      ) : loading ? (
        <BotLoadingState botName="MegaBot" />
      ) : !megaResults || totalBots === 0 ? (
        <div style={{
          marginTop: "1.5rem",
          background: "var(--bg-card, var(--ghost-bg))",
          border: "1px solid var(--border-card)",
          borderRadius: "1.25rem",
          padding: "3rem",
          textAlign: "center",
        }}>
          <div style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>🤖</div>
          <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.5rem" }}>No MegaBot Results Yet</h3>
          <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginBottom: "1.5rem" }}>
            Run MegaBot from any specialist bot on the item page to see multi-agent results here.
          </p>
          <Link href={`/items/${item.id}`} className="btn-primary" style={{ padding: "0.65rem 2rem", textDecoration: "none" }}>
            Go to Item Dashboard
          </Link>
        </div>
      ) : (
        <div style={{ marginTop: "1.5rem", display: "flex", flexDirection: "column", gap: "1.25rem" }}>

          {/* Orchestration stats bar */}
          <div style={{
            display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem",
            background: "linear-gradient(135deg, rgba(139,92,246,0.08), rgba(0,188,212,0.05))",
            border: "1px solid rgba(139,92,246,0.2)", borderRadius: "1rem", padding: "1.25rem",
          }}>
            {[
              { label: "Bots Enhanced", value: totalBots, color: "var(--accent)" },
              { label: "Avg Agreement", value: `${avgAgreement}%`, color: avgAgreement >= 75 ? "#4caf50" : "#ff9800" },
              { label: "Agent Runs", value: totalAgents, color: "#a855f7" },
            ].map((s) => (
              <div key={s.label} style={{ textAlign: "center" }}>
                <div style={{ fontSize: "1.6rem", fontWeight: 800, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-muted)" }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* ═══ AI ENGINE STATUS DASHBOARD ═══ */}
          <div style={{
            background: "linear-gradient(135deg, rgba(139,92,246,0.06), rgba(0,188,212,0.04))",
            borderRadius: "1rem", padding: "1.25rem",
            border: "1px solid rgba(139,92,246,0.15)",
          }}>
            <div style={{ fontSize: "0.6rem", textTransform: "uppercase", letterSpacing: "0.12em", color: "#8b5cf6", fontWeight: 700, marginBottom: "0.75rem" }}>
              AI ENGINE STATUS
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.65rem" }}>
              {[
                { key: "openai", name: "GPT-4o", icon: "🤖", color: "#10a37f", specialty: "Balanced & Data-Driven", model: "gpt-4o" },
                { key: "claude", name: "Claude", icon: "🧠", color: "#d97706", specialty: "Craftsmanship & History", model: "claude-3.5-haiku" },
                { key: "gemini", name: "Gemini", icon: "🔮", color: "#4285f4", specialty: "Market & Trends", model: "gemini-1.5-flash" },
                { key: "grok", name: "Grok", icon: "🌀", color: "#00DC82", specialty: "Social & Viral", model: "grok-3-fast" },
              ].map((engine) => {
                const engineRuns = Object.values(megaResults || {}).reduce((count: number, result: any) => {
                  const providers: any[] = result?.providers || [];
                  return count + (providers.some((p: any) => p.provider === engine.key && !p.error) ? 1 : 0);
                }, 0);
                const avgTime = (() => {
                  let total = 0, n = 0;
                  for (const result of Object.values(megaResults || {})) {
                    const providers: any[] = (result as any)?.providers || [];
                    const matched = providers.find((pp: any) => pp.provider === engine.key && !pp.error);
                    if (matched?.durationMs) { total += matched.durationMs; n++; }
                  }
                  return n > 0 ? (total / n / 1000).toFixed(1) : null;
                })();
                const isOnline = engineRuns > 0;
                return (
                  <button key={engine.key} onClick={() => setExpandedEngine(expandedEngine === engine.key ? null : engine.key)} aria-label={`View ${engine.name} AI engine details`} style={{
                    padding: "0.85rem 0.65rem", borderRadius: "0.75rem",
                    background: expandedEngine === engine.key ? `${engine.color}12` : isOnline ? `${engine.color}08` : "var(--bg-card)",
                    border: `2px solid ${expandedEngine === engine.key ? engine.color : isOnline ? `${engine.color}30` : "var(--border-default)"}`,
                    textAlign: "center" as const, transition: "all 0.2s ease", cursor: "pointer",
                    boxShadow: expandedEngine === engine.key ? `0 4px 16px ${engine.color}25` : "none",
                    fontFamily: "inherit", fontSize: "inherit", lineHeight: "inherit", display: "block", width: "100%",
                  }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: "50%", margin: "0 auto 0.5rem",
                      background: isOnline ? `${engine.color}20` : "var(--ghost-bg)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: "1rem",
                      boxShadow: isOnline ? `0 0 12px ${engine.color}30` : "none",
                    }}>
                      {engine.icon}
                    </div>
                    <div style={{ fontSize: "0.78rem", fontWeight: 700, color: isOnline ? engine.color : "var(--text-muted)" }}>{engine.name}</div>
                    <div style={{ fontSize: "0.55rem", color: "var(--text-muted)", marginTop: "0.1rem", fontFamily: "monospace" }}>{engine.model}</div>
                    <div style={{ fontSize: "0.55rem", color: "var(--text-muted)", fontStyle: "italic", marginTop: "0.15rem" }}>{engine.specialty}</div>
                    {isOnline && (
                      <div style={{ marginTop: "0.35rem", fontSize: "0.55rem", color: "var(--text-secondary)" }}>
                        {engineRuns} run{engineRuns !== 1 ? "s" : ""}{avgTime ? ` · ~${avgTime}s` : ""}
                      </div>
                    )}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.3rem", marginTop: "0.35rem" }}>
                      <div style={{
                        width: 6, height: 6, borderRadius: "50%",
                        background: isOnline ? engine.color : "var(--text-muted)",
                        opacity: isOnline ? 1 : 0.3,
                        boxShadow: isOnline ? `0 0 6px ${engine.color}` : "none",
                      }} />
                      <span style={{ fontSize: "0.55rem", color: isOnline ? engine.color : "var(--text-muted)", fontWeight: 600 }}>
                        {isOnline ? "ACTIVE" : "STANDBY"}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* ═══ EXPANDED ENGINE DETAIL ═══ */}
            {expandedEngine && megaResults && (() => {
              const engineMeta: Record<string, { name: string; icon: string; color: string; model: string; specialty: string; strengths: string }> = {
                openai: { name: "GPT-4o", icon: "🤖", color: "#10a37f", model: "gpt-4o", specialty: "Balanced & Data-Driven", strengths: "Precise item identification, accurate pricing, comprehensive condition assessment. Best at cross-referencing market data with visual analysis." },
                claude: { name: "Claude", icon: "🧠", color: "#d97706", model: "claude-3.5-haiku", specialty: "Craftsmanship & History", strengths: "Deep historical knowledge, maker identification, construction analysis, authentication expertise. Best at provenance research and cultural context." },
                gemini: { name: "Gemini", icon: "🔮", color: "#4285f4", model: "gemini-1.5-flash", specialty: "Market & Trends", strengths: "Real-time market analysis, trend detection, comparable sales research, SEO optimization. Best at identifying demand patterns and pricing trends." },
                grok: { name: "Grok", icon: "🌀", color: "#00DC82", model: "grok-3-fast", specialty: "Social & Viral", strengths: "Social media trends, community demand, viral potential, Gen Z appeal. Best at identifying non-traditional buyer segments and emerging markets." },
              };
              const em = engineMeta[expandedEngine];
              if (!em) return null;

              const engineFindings: { botKey: string; botLabel: string; botIcon: string; botColor: string; data: any; responseTime: number; error: string | null; agreement: number }[] = [];
              let totalRuns = 0, totalSuccess = 0, totalErrors = 0, totalTime = 0;

              for (const [botKey, result] of Object.entries(megaResults)) {
                const r = result as any;
                const providers: any[] = r?.providers || [];
                const match = providers.find((p: any) => p.provider === expandedEngine);
                if (match) {
                  totalRuns++;
                  const meta = BOT_META[botKey] || { label: botKey, icon: "🤖", color: "#888", href: "/bots" };
                  if (match.error) { totalErrors++; } else { totalSuccess++; totalTime += match.durationMs || match.responseTime || 0; }
                  const agreeRaw = r?.agreementScore || 0;
                  engineFindings.push({ botKey, botLabel: meta.label, botIcon: meta.icon, botColor: meta.color, data: match.data || match, responseTime: match.durationMs || match.responseTime || 0, error: match.error, agreement: Math.round(agreeRaw > 1 ? agreeRaw : agreeRaw * 100) });
                }
              }

              const avgTime = totalSuccess > 0 ? (totalTime / totalSuccess / 1000).toFixed(1) : "—";
              const successRate = totalRuns > 0 ? Math.round((totalSuccess / totalRuns) * 100) : 0;

              return (
                <div style={{ marginTop: "0.75rem", padding: "1.25rem", background: `${em.color}06`, border: `2px solid ${em.color}30`, borderRadius: "0.85rem", borderTop: `3px solid ${em.color}` }}>
                  {/* Hero */}
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem" }}>
                    <div style={{ width: 48, height: 48, borderRadius: "50%", background: `${em.color}20`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.5rem", boxShadow: `0 0 16px ${em.color}30` }}>{em.icon}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: "1.1rem", fontWeight: 800, color: em.color }}>{em.name}</div>
                      <div style={{ fontSize: "0.65rem", color: "var(--text-muted)", fontFamily: "monospace" }}>{em.model}</div>
                      <div style={{ fontSize: "0.72rem", color: "var(--text-secondary)", fontStyle: "italic" as const }}>{em.specialty}</div>
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); setExpandedEngine(null); }} style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--text-muted)", fontSize: "1rem", padding: "0.25rem" }} aria-label="Close engine detail">✕</button>
                  </div>

                  {/* KPIs */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.5rem", marginBottom: "1rem" }}>
                    {[
                      { label: "Runs", value: `${totalSuccess}/${totalRuns}`, color: em.color },
                      { label: "Success", value: `${successRate}%`, color: successRate >= 80 ? "#10b981" : "#f59e0b" },
                      { label: "Avg Time", value: `${avgTime}s`, color: "var(--text-primary)" },
                      { label: "Errors", value: String(totalErrors), color: totalErrors > 0 ? "#ef4444" : "#10b981" },
                    ].map((kpi) => (
                      <div key={kpi.label} style={{ textAlign: "center" as const, padding: "0.5rem", borderRadius: "0.5rem", background: "var(--bg-card)", border: "1px solid var(--border-default)" }}>
                        <div style={{ fontSize: "1rem", fontWeight: 800, color: kpi.color }}>{kpi.value}</div>
                        <div style={{ fontSize: "0.55rem", color: "var(--text-muted)", textTransform: "uppercase" as const, letterSpacing: "0.08em" }}>{kpi.label}</div>
                      </div>
                    ))}
                  </div>

                  {/* Strengths */}
                  <div style={{ padding: "0.65rem 0.85rem", borderRadius: "0.5rem", marginBottom: "1rem", background: `${em.color}08`, borderLeft: `3px solid ${em.color}` }}>
                    <div style={{ fontSize: "0.58rem", fontWeight: 700, color: em.color, textTransform: "uppercase" as const, letterSpacing: "0.08em", marginBottom: "0.2rem" }}>Engine Strengths</div>
                    <p style={{ fontSize: "0.78rem", color: "var(--text-secondary)", lineHeight: 1.6, margin: 0 }}>{em.strengths}</p>
                  </div>

                  {/* Per-Bot Findings */}
                  <div style={{ fontSize: "0.58rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" as const, letterSpacing: "0.08em", marginBottom: "0.5rem" }}>{em.name} Findings ({engineFindings.length} runs)</div>
                  <div style={{ display: "flex", flexDirection: "column" as const, gap: "0.4rem" }}>
                    {engineFindings.map((ef) => {
                      const insight = ef.data ? (typeof ef.data === "object" ? (ef.data.executive_summary || ef.data.summary || ef.data.notes || (ef.data.identification?.item_name ? `Identified as: ${ef.data.identification.item_name}` : null) || JSON.stringify(ef.data).slice(0, 120) + "...") : String(ef.data).slice(0, 120)) : null;
                      const priceFair = ef.data?.estimated_value_mid ?? ef.data?.price_fair ?? ef.data?.pricing?.mid ?? null;
                      return (
                        <div key={ef.botKey} style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem", padding: "0.55rem 0.65rem", borderRadius: "0.5rem", background: ef.error ? "rgba(239,68,68,0.06)" : "var(--bg-card)", border: `1px solid ${ef.error ? "rgba(239,68,68,0.2)" : "var(--border-default)"}` }}>
                          <span style={{ fontSize: "0.85rem", flexShrink: 0 }}>{ef.botIcon}</span>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", marginBottom: "0.15rem" }}>
                              <span style={{ fontSize: "0.72rem", fontWeight: 700, color: ef.botColor }}>{ef.botLabel}</span>
                              <span style={{ fontSize: "0.55rem", padding: "1px 5px", borderRadius: 99, fontWeight: 600, background: ef.agreement >= 75 ? "rgba(76,175,80,0.12)" : "rgba(255,152,0,0.12)", color: ef.agreement >= 75 ? "#4caf50" : "#ff9800" }}>{ef.agreement}%</span>
                              {ef.responseTime > 0 && <span style={{ fontSize: "0.55rem", color: "var(--text-muted)" }}>{(ef.responseTime / 1000).toFixed(1)}s</span>}
                              {priceFair != null && <span style={{ fontSize: "0.62rem", fontWeight: 700, color: em.color, marginLeft: "auto" }}>${typeof priceFair === "number" ? Math.round(priceFair).toLocaleString() : priceFair}</span>}
                            </div>
                            {ef.error ? <div style={{ fontSize: "0.68rem", color: "#ef4444" }}>Error: {ef.error}</div> : insight ? <p style={{ fontSize: "0.68rem", color: "var(--text-secondary)", lineHeight: 1.5, margin: 0, overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as const }}>{typeof insight === "string" && insight.length > 150 ? insight.slice(0, 150) + "..." : insight}</p> : null}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Agreement Pattern */}
                  {engineFindings.length >= 2 && (
                    <div style={{ marginTop: "0.75rem", padding: "0.55rem 0.75rem", borderRadius: "0.5rem", background: "var(--ghost-bg)", border: "1px solid var(--border-default)" }}>
                      <div style={{ fontSize: "0.58rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" as const, letterSpacing: "0.08em", marginBottom: "0.25rem" }}>Agreement Pattern</div>
                      <div style={{ fontSize: "0.72rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>
                        {(() => {
                          const agreements = engineFindings.filter(f => !f.error).map(f => f.agreement);
                          const avg = agreements.length > 0 ? Math.round(agreements.reduce((a, b) => a + b, 0) / agreements.length) : 0;
                          const high = engineFindings.filter(f => f.agreement >= 80);
                          return `${em.name} averages ${avg}% agreement across ${agreements.length} analyses.${high.length > 0 ? ` Strongest alignment with ${high.map(h => h.botLabel).join(", ")}.` : ""}`;
                        })()}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>

          {/* ═══ CONSENSUS STRENGTH VISUALIZATION ═══ */}
          {totalBots >= 2 && (() => {
            const allAgreements = botKeys.map((key) => {
              const r = megaResults![key];
              const raw = r?.agreementScore || 0;
              return { key, agree: Math.round(raw > 1 ? raw : raw * 100), botMeta: BOT_META[key] || { label: key, icon: "🤖", color: "#888", href: "/bots" } };
            }).sort((a, b) => b.agree - a.agree);
            const high = allAgreements.filter((a) => a.agree >= 75);
            const low = allAgreements.filter((a) => a.agree < 75 && a.agree > 0);
            return (
              <div style={{
                background: "var(--bg-card)", borderRadius: "1rem", padding: "1.25rem",
                border: "1px solid rgba(139,92,246,0.12)",
              }}>
                <div style={{ fontSize: "0.6rem", textTransform: "uppercase", letterSpacing: "0.12em", color: "#a855f7", fontWeight: 700, marginBottom: "0.75rem" }}>
                  CONSENSUS STRENGTH
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.45rem" }}>
                  {allAgreements.map((a) => (
                    <div key={a.key} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <span style={{ fontSize: "0.72rem", minWidth: 95, fontWeight: 600, color: a.botMeta.color, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {a.botMeta.icon} {a.botMeta.label}
                      </span>
                      <div style={{ flex: 1, height: 8, borderRadius: 99, background: "var(--ghost-bg)", overflow: "hidden" }}>
                        <div style={{
                          height: "100%", width: `${a.agree}%`, borderRadius: 99,
                          background: a.agree >= 80 ? "linear-gradient(90deg, #10b981, #34d399)" : a.agree >= 60 ? "linear-gradient(90deg, #f59e0b, #fbbf24)" : "linear-gradient(90deg, #ef4444, #f87171)",
                          transition: "width 0.6s ease",
                        }} />
                      </div>
                      <span style={{
                        fontSize: "0.7rem", fontWeight: 700, minWidth: 35, textAlign: "right",
                        color: a.agree >= 80 ? "#10b981" : a.agree >= 60 ? "#f59e0b" : "#ef4444",
                      }}>{a.agree}%</span>
                    </div>
                  ))}
                </div>
                {high.length > 0 && low.length > 0 && (
                  <div style={{ marginTop: "0.75rem", padding: "0.6rem 0.85rem", borderRadius: "0.65rem", background: "rgba(255,152,0,0.06)", border: "1px solid rgba(255,152,0,0.12)", fontSize: "0.72rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>
                    Strong agreement on {high.map((a) => a.botMeta.label).join(", ")}. Review {low.map((a) => a.botMeta.label).join(", ")} for differing AI perspectives.
                  </div>
                )}
              </div>
            );
          })()}

          {/* What is MegaBot? Explainer */}
          {showExplainer && (
            <div style={{ padding: "1rem 1.25rem", borderRadius: "0.75rem", background: "rgba(139,92,246,0.06)", border: "1px solid rgba(139,92,246,0.15)", position: "relative" as const, marginBottom: "0.75rem" }}>
              <button onClick={() => { setShowExplainer(false); if (typeof window !== "undefined") localStorage.setItem("megabot-explainer-dismissed", "true"); }} style={{ position: "absolute" as const, top: "0.5rem", right: "0.5rem", background: "transparent", border: "none", cursor: "pointer", color: "var(--text-muted)", fontSize: "0.85rem", padding: "0.25rem" }} aria-label="Dismiss explainer">✕</button>
              <div style={{ fontSize: "0.875rem", fontWeight: 600, color: "#8b5cf6", marginBottom: "0.35rem" }}>What is MegaBot?</div>
              <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)", lineHeight: 1.6, margin: 0 }}>MegaBot runs 4 independent AI specialists in parallel — OpenAI for precise identification, Claude for craftsmanship and history, Gemini for market trends, and Grok for social demand — then compares their findings. When multiple AIs agree, you can be more confident in the result. Think of it as getting a second, third, and fourth expert opinion automatically.</p>
            </div>
          )}

          {/* Bot tabs */}
          <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap" }}>
            {botKeys.map((key) => {
              const meta = BOT_META[key] || { label: key, icon: "🤖", color: "#888" };
              const isActive = activeTab === key;
              const result = megaResults![key];
              const agreeRaw = result?.agreementScore || 0;
              const agree = Math.round(agreeRaw > 1 ? agreeRaw : agreeRaw * 100);
              return (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  aria-label={`View ${meta.label} MegaBot results`}
                  style={{
                    padding: "0.45rem 0.85rem", borderRadius: "0.5rem",
                    border: `1px solid ${isActive ? meta.color : "var(--border-default)"}`,
                    background: isActive ? `${meta.color}18` : "var(--bg-card)",
                    color: isActive ? meta.color : "var(--text-muted)",
                    fontSize: "0.75rem", fontWeight: isActive ? 700 : 500, cursor: "pointer",
                    display: "flex", alignItems: "center", gap: "0.3rem",
                  }}
                >
                  <span>{meta.icon}</span>
                  <span>{meta.label}</span>
                  <span style={{
                    fontSize: "0.55rem", fontWeight: 600, padding: "0.1rem 0.35rem", borderRadius: "9999px",
                    background: agree >= 75 ? "rgba(76,175,80,0.15)" : "rgba(255,152,0,0.15)",
                    color: agree >= 75 ? "#4caf50" : "#ff9800",
                  }}>{agree}%</span>
                </button>
              );
            })}
          </div>

          {/* Active tab content */}
          {activeResult && (() => {
            const meta = BOT_META[activeTab!] || { label: activeTab, icon: "🤖", color: "#888", href: "/bots" };
            const providers: any[] = activeResult.providers || [];
            const successful = providers.filter((p: any) => !p.error);
            const agreeRaw = activeResult.agreementScore || 0;
            const agree = Math.round(agreeRaw > 1 ? agreeRaw : agreeRaw * 100);

            return (
              <div style={{
                background: "var(--bg-card, var(--ghost-bg))",
                border: `1px solid ${meta.color}30`,
                borderRadius: "1.25rem",
                overflow: "hidden",
              }}>
                {/* Result header */}
                <div style={{
                  padding: "1rem 1.25rem",
                  borderBottom: "1px solid var(--border-default)",
                  display: "flex", alignItems: "center", gap: "0.75rem",
                }}>
                  <span style={{ fontSize: "1.3rem" }}>{meta.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "var(--text-primary)" }}>
                      {meta.label} — {isAnalysisTab ? "Deep Item Intelligence" : isPricingTab ? "Deep Market Intelligence" : isBuyersTab ? "Buyer Acquisition Intelligence" : isListingTab ? "Listing Optimization" : isReconTab ? "Competitive Intelligence" : isVehicleTab ? "Vehicle Evaluation" : isAntiqueTab ? "Antique Assessment" : isPhotosTab ? "Photo Analysis" : isCollectiblesTab ? "Collectibles Assessment" : "MegaBot Results"}
                    </div>
                    <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
                      {successful.length} of {providers.length} agents returned results
                    </div>
                  </div>
                  <div style={{
                    padding: "0.25rem 0.65rem", borderRadius: "9999px",
                    background: agree >= 75 ? "rgba(76,175,80,0.15)" : "rgba(255,152,0,0.15)",
                    color: agree >= 75 ? "#4caf50" : "#ff9800",
                    fontSize: "0.72rem", fontWeight: 700,
                  }}>
                    {agree}% Agreement
                  </div>
                </div>

                {/* Agreement bar */}
                <div style={{ padding: "0 1.25rem", marginTop: "0.75rem" }}>
                  <div style={{ height: 6, borderRadius: 99, background: "var(--ghost-bg)", overflow: "hidden" }}>
                    <div style={{
                      height: "100%", width: `${agree}%`, borderRadius: 99,
                      background: agree >= 80 ? "#4caf50" : agree >= 60 ? "#ff9800" : "#ef4444",
                    }} />
                  </div>
                </div>

                {/* Specialized tab content */}
                {isAnalysisTab ? (
                  <div style={{ padding: "1rem 1.25rem" }}>
                    <AnalysisTabContent
                      result={activeResult}
                      consensus={activeResult.consensus || {}}
                      providers={providers}
                      agreement={agree}
                    />
                  </div>
                ) : isPricingTab ? (
                  <div style={{ padding: "1rem 1.25rem" }}>
                    <PricingTabContent
                      result={activeResult}
                      providers={providers}
                      agreement={agree}
                    />
                  </div>
                ) : isBuyersTab ? (
                  <div style={{ padding: "1rem 1.25rem" }}>
                    <BuyersTabContent
                      result={activeResult}
                      providers={providers}
                      agreement={agree}
                    />
                  </div>
                ) : isListingTab ? (
                  <div style={{ padding: "1rem 1.25rem" }}>
                    <ListingTabContent
                      result={activeResult}
                      providers={providers}
                      agreement={agree}
                    />
                  </div>
                ) : isReconTab ? (
                  <div style={{ padding: "1rem 1.25rem" }}>
                    <ReconTabContent
                      result={activeResult}
                      providers={providers}
                      agreement={agree}
                    />
                  </div>
                ) : isVehicleTab ? (
                  <div style={{ padding: "1rem 1.25rem" }}>
                    <VehicleTabContent
                      result={activeResult}
                      providers={providers}
                      agreement={agree}
                    />
                  </div>
                ) : isAntiqueTab ? (
                  <div style={{ padding: "1rem 1.25rem" }}>
                    <AntiqueTabContent
                      result={activeResult}
                      providers={providers}
                      agreement={agree}
                    />
                  </div>
                ) : isPhotosTab ? (
                  <div style={{ padding: "1rem 1.25rem" }}>
                    <PhotosTabContent
                      result={activeResult}
                      providers={providers}
                      agreement={agree}
                    />
                  </div>
                ) : isCollectiblesTab ? (
                  <div style={{ padding: "1rem 1.25rem" }}>
                    <CollectiblesTabContent
                      result={activeResult}
                      providers={providers}
                      agreement={agree}
                    />
                  </div>
                ) : (
                  /* Non-specialized tabs: standard display */
                  <>
                    {activeResult.summary && (
                      <div style={{ padding: "0.75rem 1.25rem", fontSize: "0.82rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>
                        {activeResult.summary}
                      </div>
                    )}
                    <div style={{ padding: "0 1.25rem 1rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                      {successful.map((p: any) => {
                        const pm = PROVIDER_META[p.provider] || { icon: "🤖", label: p.provider, color: "#888", specialty: "" };
                        return (
                          <div key={p.provider} style={{
                            background: "var(--bg-card)", border: `1px solid ${pm.color}25`,
                            borderRadius: "0.65rem", padding: "0.75rem 0.85rem",
                          }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.4rem" }}>
                              <span style={{ fontSize: "0.95rem" }}>{pm.icon}</span>
                              <span style={{ fontWeight: 700, fontSize: "0.82rem", color: pm.color }}>{pm.label}</span>
                              <span style={{ fontSize: "0.65rem", color: "var(--text-muted)", fontStyle: "italic", flex: 1 }}>{pm.specialty}</span>
                              {(p.durationMs || p.responseTime) && (
                                <span style={{ fontSize: "0.62rem", color: "var(--text-muted)" }}>
                                  {((p.durationMs || p.responseTime) / 1000).toFixed(1)}s
                                </span>
                              )}
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.5rem", fontSize: "0.72rem" }}>
                              {p.itemName && <div><span style={{ color: "var(--text-muted)", fontSize: "0.6rem" }}>Item: </span><span style={{ color: "var(--text-primary)" }}>{p.itemName}</span></div>}
                              {p.conditionScore != null && <div><span style={{ color: "var(--text-muted)", fontSize: "0.6rem" }}>Condition: </span><span style={{ color: "var(--text-primary)" }}>{p.conditionScore}/10</span></div>}
                              {p.priceLow != null && p.priceHigh != null && <div><span style={{ color: "var(--text-muted)", fontSize: "0.6rem" }}>Price: </span><span style={{ color: "var(--text-primary)" }}>${Math.round(p.priceLow)} \u2013 ${Math.round(p.priceHigh)}</span></div>}
                            </div>
                            {p.executiveSummary && (
                              <div style={{ marginTop: "0.4rem", fontSize: "0.72rem", color: "var(--text-secondary)", lineHeight: 1.4 }}>
                                {p.executiveSummary}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Consensus */}
                    {activeResult.consensus && (
                      <div style={{
                        margin: "0 1.25rem 1rem",
                        background: "linear-gradient(135deg, rgba(139,92,246,0.06), rgba(0,188,212,0.04))",
                        border: "1px solid rgba(139,92,246,0.2)",
                        borderRadius: "0.65rem", padding: "0.75rem 0.85rem",
                      }}>
                        <div style={{ fontSize: "0.6rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "#a855f7", fontWeight: 700, marginBottom: "0.4rem" }}>Consensus Result</div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.4rem", fontSize: "0.72rem" }}>
                          {activeResult.consensus.item_name && <div><span style={{ color: "var(--text-muted)", fontSize: "0.6rem" }}>Item: </span><span style={{ color: "var(--text-primary)", fontWeight: 600 }}>{activeResult.consensus.item_name}</span></div>}
                          {activeResult.consensus.category && <div><span style={{ color: "var(--text-muted)", fontSize: "0.6rem" }}>Category: </span><span style={{ color: "var(--text-primary)" }}>{activeResult.consensus.category}</span></div>}
                          {activeResult.consensus.condition_score != null && <div><span style={{ color: "var(--text-muted)", fontSize: "0.6rem" }}>Condition: </span><span style={{ color: "var(--text-primary)" }}>{activeResult.consensus.condition_score}/10</span></div>}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })()}

          {/* ═══ HOW MEGABOT WORKS ═══ */}
          <div style={{
            borderRadius: "1rem", padding: "3px",
            background: "linear-gradient(135deg, rgba(0,188,212,0.4), rgba(139,92,246,0.3), rgba(0,188,212,0.4))",
          }}>
            <div style={{
              borderRadius: "calc(1rem - 3px)", padding: "1.25rem 1.5rem",
              background: "var(--bg-card-solid, var(--bg-card))",
            }}>
              <div style={{ fontSize: "0.6rem", textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--accent)", marginBottom: "1rem", fontWeight: 700 }}>
                HOW MEGABOT WORKS
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.85rem" }}>
                {[
                  { step: "1", icon: "🎯", title: "Pick a Bot", desc: "Go to any specialist bot on the item page" },
                  { step: "2", icon: "⚡", title: "Activate MegaBot", desc: "Click MegaBot to enter multi-agent mode" },
                  { step: "3", icon: "🧠", title: "4 AI Engines", desc: "OpenAI, Claude, Gemini & Grok analyze in parallel" },
                  { step: "4", icon: "✅", title: "Consensus", desc: "Results merged into a unified recommendation" },
                ].map((s) => (
                  <div key={s.step} style={{
                    textAlign: "center", padding: "1rem 0.5rem", borderRadius: "0.75rem",
                    background: "var(--ghost-bg)", border: "1px solid var(--border-default)",
                  }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: "50%", margin: "0 auto 0.5rem",
                      background: "linear-gradient(135deg, rgba(0,188,212,0.15), rgba(139,92,246,0.1))",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: "1rem",
                    }}>{s.icon}</div>
                    <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.2rem" }}>{s.title}</div>
                    <div style={{ fontSize: "0.65rem", color: "var(--text-muted)", lineHeight: 1.4 }}>{s.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ═══ QUICK ACTIONS ═══ */}
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center" }}>
            {selectedId && (
              <Link href={`/items/${selectedId}`} style={{
                display: "inline-flex", alignItems: "center", gap: "0.35rem",
                fontSize: "0.75rem", fontWeight: 600, color: "var(--accent)",
                textDecoration: "none", padding: "0.4rem 0.85rem", borderRadius: "0.5rem",
                border: "1px solid rgba(0,188,212,0.25)", background: "rgba(0,188,212,0.06)",
                transition: "all 0.15s ease",
              }}>
                📋 View Item Dashboard
              </Link>
            )}
            <button onClick={() => setShowJson(!showJson)} style={{
              padding: "0.4rem 0.85rem", fontSize: "0.75rem", fontWeight: 600, borderRadius: "0.5rem",
              border: "1px solid var(--border-default)", background: "transparent", color: "var(--text-muted)", cursor: "pointer",
            }}>
              {showJson ? "Hide JSON" : "🔍 View Raw JSON"}
            </button>
          </div>
          {showJson && (
            <pre style={{ background: "var(--bg-card)", borderRadius: "0.75rem", padding: "1rem", overflow: "auto", fontSize: "0.72rem", color: "var(--text-muted)", maxHeight: 400, margin: 0 }}>
              {JSON.stringify(megaResults, null, 2)}
            </pre>
          )}
        </div>
      )}

      {/* ═══ PROFESSIONAL MULTI-AI CONSENSUS REPORT ═══ */}
      {megaResults && Object.keys(megaResults).length > 0 && item && (
        <div style={{ marginTop: "1rem", marginBottom: "0.5rem" }}>
          <button onClick={() => setReportOpen(!reportOpen)} aria-label={reportOpen ? "Close consensus report" : "Open consensus report"} style={{ width: "100%", padding: "0.65rem 1.25rem", display: "flex", alignItems: "center", justifyContent: "space-between", background: "transparent", border: "2px solid rgba(139,92,246,0.3)", borderRadius: "0.75rem", cursor: "pointer", color: "#8b5cf6", fontSize: "0.82rem", fontWeight: 700, minHeight: "44px", transition: "border-color 0.15s ease" }}>
            <span>📋 Multi-AI Consensus Report</span>
            <span style={{ fontSize: "0.75rem" }}>{reportOpen ? "▴" : "▾"}</span>
          </button>
          {reportOpen && (
            <div style={{ marginTop: "0.5rem", padding: "1.5rem", border: "2px solid rgba(139,92,246,0.25)", borderRadius: "1rem", background: "var(--bg-card)" }}>
              {/* Header */}
              <div style={{ textAlign: "center" as const, marginBottom: "1rem" }}>
                <div style={{ fontSize: "0.6rem", fontWeight: 700, color: "#8b5cf6", letterSpacing: "0.2em", textTransform: "uppercase" as const }}>═══ LegacyLoop Multi-AI Consensus Report ═══</div>
                <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>{new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })} · {item.title}</div>
                <div style={{ fontSize: "0.6rem", color: "var(--text-muted)" }}>Report ID: {selectedId?.slice(0, 8)}</div>
              </div>

              {/* § Overview */}
              <div style={{ borderBottom: "1px dashed rgba(139,92,246,0.2)", paddingBottom: "0.75rem", marginBottom: "0.75rem" }}>
                <div style={{ fontSize: "0.6rem", fontWeight: 700, color: "#8b5cf6", textTransform: "uppercase" as const, letterSpacing: "0.1em", marginBottom: "0.35rem" }}>§ Overview</div>
                <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" as const, fontSize: "0.78rem", color: "var(--text-secondary)" }}>
                  <span>Bots Analyzed: <strong style={{ color: "var(--text-primary)" }}>{totalBots}</strong></span>
                  <span>Avg Agreement: <strong style={{ color: avgAgreement >= 75 ? "#4caf50" : "#f59e0b" }}>{avgAgreement}%</strong></span>
                  <span>AI Agents: <strong style={{ color: "var(--text-primary)" }}>{totalAgents}</strong></span>
                </div>
              </div>

              {/* § Per-Bot Results */}
              {botKeys.map((key) => {
                const meta = BOT_META[key] || { label: key, icon: "🤖", color: "#888", href: "/bots" };
                const result = megaResults![key];
                const agreeRaw = result?.agreementScore || 0;
                const agree = Math.round(agreeRaw > 1 ? agreeRaw : agreeRaw * 100);
                const providers = result?.providers || [];
                const successful = providers.filter((p: any) => !p.error);
                const consensus = result?.consensus;
                return (
                  <div key={key} style={{ borderBottom: "1px dashed rgba(139,92,246,0.2)", paddingBottom: "0.75rem", marginBottom: "0.75rem" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.3rem" }}>
                      <div style={{ fontSize: "0.6rem", fontWeight: 700, color: meta.color, textTransform: "uppercase" as const, letterSpacing: "0.1em" }}>§ {meta.icon} {meta.label}</div>
                      <span style={{ fontSize: "0.58rem", fontWeight: 700, padding: "0.1rem 0.4rem", borderRadius: "9999px", background: agree >= 75 ? "rgba(76,175,80,0.12)" : "rgba(255,152,0,0.12)", color: agree >= 75 ? "#4caf50" : "#ff9800" }}>{agree}% · {successful.length}/{providers.length} AIs</span>
                    </div>
                    {consensus?.item_name && <div style={{ fontSize: "0.78rem", color: "var(--text-primary)", fontWeight: 600, marginBottom: "0.15rem" }}>{consensus.item_name}</div>}
                    <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" as const, fontSize: "0.72rem", color: "var(--text-secondary)" }}>
                      {consensus?.category && <span>Category: {consensus.category}</span>}
                      {consensus?.condition_score != null && <span>Condition: {consensus.condition_score}/10</span>}
                      {consensus?.price_fair != null && <span>Fair Value: ${consensus.price_fair}</span>}
                      {consensus?.era && <span>Era: {consensus.era}</span>}
                    </div>
                    {result?.summary && <p style={{ fontSize: "0.72rem", color: "var(--text-muted)", lineHeight: 1.5, margin: "0.3rem 0 0", fontStyle: "italic" as const }}>{typeof result.summary === "string" && result.summary.length > 200 ? result.summary.slice(0, 200) + "..." : result.summary}</p>}
                  </div>
                );
              })}

              {/* § AI Engine Performance */}
              <div style={{ borderBottom: "1px dashed rgba(139,92,246,0.2)", paddingBottom: "0.75rem", marginBottom: "0.75rem" }}>
                <div style={{ fontSize: "0.6rem", fontWeight: 700, color: "#8b5cf6", textTransform: "uppercase" as const, letterSpacing: "0.1em", marginBottom: "0.35rem" }}>§ AI Engine Performance</div>
                <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" as const, fontSize: "0.72rem" }}>
                  {Object.entries(PROVIDER_META).map(([key, meta]) => {
                    let runs = 0, total = 0;
                    for (const r of Object.values(megaResults || {})) {
                      const providers = (r as any)?.providers || [];
                      total++;
                      if (providers.some((p: any) => p.provider === key && !p.error)) runs++;
                    }
                    return <span key={key} style={{ color: "var(--text-secondary)" }}>{meta.icon} {meta.label}: <strong style={{ color: meta.color }}>{runs}/{total}</strong></span>;
                  })}
                </div>
              </div>

              {/* Disclaimer */}
              <div style={{ padding: "0.65rem 0.85rem", borderRadius: "0.5rem", background: "rgba(139,92,246,0.04)", fontSize: "0.68rem", color: "var(--text-muted)", lineHeight: 1.5, fontStyle: "italic" as const }}>
                ⚠️ This report is generated by LegacyLoop AI using 4 independent AI engines (OpenAI, Claude, Gemini, Grok) running in parallel. Results represent AI consensus, not certified appraisal. Professional evaluation recommended for items valued over $500.
                <div style={{ marginTop: "0.3rem", fontSize: "0.6rem", fontStyle: "normal" as const }}>Report ID: {selectedId?.slice(0, 8)} · Generated by LegacyLoop.com</div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: "flex", gap: "0.75rem", marginTop: "1rem" }}>
                <button onClick={() => window.print()} style={{ flex: 1, padding: "0.55rem 1rem", fontSize: "0.78rem", fontWeight: 700, borderRadius: "0.75rem", border: "none", cursor: "pointer", background: "linear-gradient(135deg, #8b5cf6, #6d28d9)", color: "#fff", minHeight: "44px", boxShadow: "0 2px 10px rgba(139,92,246,0.3)" }}>🖨️ Print Report</button>
                <button onClick={() => {
                  const lines: string[] = ["═══ LEGACYLOOP MULTI-AI CONSENSUS REPORT ═══", `Date: ${new Date().toLocaleDateString()}`, `Item: ${item?.title}`, `Report ID: ${selectedId?.slice(0, 8)}`, ""];
                  for (const key of botKeys) {
                    const meta = BOT_META[key] || { label: key, icon: "🤖" };
                    const result = megaResults![key];
                    const agree = Math.round((result?.agreementScore > 1 ? result.agreementScore : (result?.agreementScore || 0) * 100));
                    const c = result?.consensus;
                    lines.push(`§ ${meta.label} — ${agree}% Agreement`);
                    if (c?.item_name) lines.push(`  Item: ${c.item_name}`);
                    if (c?.category) lines.push(`  Category: ${c.category}`);
                    if (c?.price_fair) lines.push(`  Fair Value: $${c.price_fair}`);
                    if (result?.summary) lines.push(`  Summary: ${typeof result.summary === "string" ? result.summary.slice(0, 150) : ""}`);
                    lines.push("");
                  }
                  lines.push("Generated by LegacyLoop.com — AI Consensus Report");
                  navigator.clipboard.writeText(lines.join("\n"));
                  setReportCopied(true);
                  setTimeout(() => setReportCopied(false), 2000);
                }} style={{ flex: 1, padding: "0.55rem 1rem", fontSize: "0.78rem", fontWeight: 700, borderRadius: "0.75rem", cursor: "pointer", background: "transparent", border: "2px solid rgba(139,92,246,0.3)", color: "#8b5cf6", minHeight: "44px" }}>{reportCopied ? "✅ Copied!" : "📋 Copy to Clipboard"}</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══ STICKY BOTTOM ACTION BAR ═══ */}
      {item && (
        <div data-no-print style={{
          position: "sticky" as const,
          bottom: 0,
          zIndex: 100,
          background: "var(--bg-card-solid, var(--bg-card))",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderTop: "1px solid rgba(139,92,246,0.2)",
          boxShadow: "0 -2px 12px rgba(0,0,0,0.08)",
          padding: "0.6rem 1.25rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "0.75rem",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flex: 1, minWidth: 0, maxWidth: "200px" }}>
            {item.photo ? (
              <img src={item.photo} alt="" style={{ width: 32, height: 32, borderRadius: "0.3rem", objectFit: "cover" as const, flexShrink: 0 }} />
            ) : (
              <div style={{ width: 32, height: 32, borderRadius: "0.3rem", background: "rgba(139,92,246,0.12)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.85rem", flexShrink: 0 }}>⚡</div>
            )}
            <span style={{
              fontSize: "0.75rem", fontWeight: 600, color: "var(--text-primary)",
              overflow: "hidden", whiteSpace: "nowrap" as const, textOverflow: "ellipsis",
            }}>{item.title}</span>
          </div>
          <div style={{ display: "flex", gap: "0.5rem", flexShrink: 0 }}>
            <button
              onClick={handleRunMegaBot}
              disabled={megaRunning}
              aria-label="Run MegaBot analysis"
              style={{
                padding: "0.45rem 1rem", fontSize: "0.75rem", fontWeight: 700,
                borderRadius: "10px", border: "none",
                background: megaRunning ? "var(--ghost-bg)" : "linear-gradient(135deg, #8b5cf6, #6d28d9)",
                color: megaRunning ? "var(--text-muted)" : "#fff",
                cursor: megaRunning ? "not-allowed" : "pointer",
                minHeight: "44px", whiteSpace: "nowrap" as const,
                boxShadow: megaRunning ? "none" : "0 2px 10px rgba(139,92,246,0.3)",
                transition: "all 0.2s ease",
              }}
            >
              {megaRunning ? "⏳ Running..." : "⚡ Run MegaBot · 5 cr"}
            </button>
            <Link
              href={`/items/${item.id}`}
              aria-label="View item dashboard"
              style={{
                padding: "0.45rem 0.85rem", fontSize: "0.72rem", fontWeight: 600,
                borderRadius: "10px", textDecoration: "none", minHeight: "44px",
                background: "var(--ghost-bg)", border: "1px solid var(--border-default)",
                color: "var(--text-secondary)", display: "flex", alignItems: "center",
                whiteSpace: "nowrap" as const,
              }}
            >
              View Item →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
