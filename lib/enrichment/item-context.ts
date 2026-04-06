/**
 * LegacyLoop Cross-Bot Enrichment System
 *
 * Reads all available bot results for an item and produces
 * a structured context block injected into every bot prompt.
 *
 * Bots feed each other. Every run gets smarter.
 *
 * Data sources:
 *   - AiResult model (AnalyzeBot)
 *   - Valuation model (pricing pipeline)
 *   - AntiqueCheck model (antique detection)
 *   - EventLog entries with *_RESULT eventType (all specialist bots)
 */

import { prisma } from "@/lib/db";
import { populateFromAnalysis } from "@/lib/data/populate-intelligence";
import { getMarketInfo } from "@/lib/pricing/market-data";

// ─────────────────────────────────────────────
// ENRICHMENT CACHE (60s TTL)
// ─────────────────────────────────────────────

const enrichmentCache = new Map<
  string,
  { result: ItemEnrichmentContext; builtAt: number }
>();
const CACHE_TTL_MS = 10_000; // 10 seconds — fresh data for sequential bot runs

// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────

export interface ItemEnrichmentContext {
  itemId: string;
  itemName: string;
  hasEnrichment: boolean;
  contextBlock: string;
  summary: EnrichmentSummary;
}

export interface EnrichmentSummary {
  analyzeBotFindings: string | null;
  priceBotFindings: string | null;
  antiqueBotFindings: string | null;
  collectiblesBotFindings: string | null;
  carBotFindings: string | null;
  reconBotFindings: string | null;
  listBotFindings: string | null;
  buyerBotFindings: string | null;
  photoBotFindings: string | null;
  megaBotFindings: string | null;
  valuationFindings: string | null;
  amazonFindings: string | null;
  marketIntelFindings: string | null;
  documentVaultFindings: string | null;
  priorRunCount: number;
  confidenceLevel: "none" | "low" | "medium" | "high";
}

// ─────────────────────────────────────────────
// MAIN ENTRY POINT
// ─────────────────────────────────────────────

export async function getItemEnrichmentContext(
  itemId: string,
  excludeBot?: string
): Promise<ItemEnrichmentContext> {
  try {
    // ── Cache check ──
    const cacheKey = `${itemId}_${excludeBot ?? "all"}`;
    const cached = enrichmentCache.get(cacheKey);
    if (cached && Date.now() - cached.builtAt < CACHE_TTL_MS) {
      return cached.result;
    }

    // ── Parallel DB queries (independent — safe to batch) ──
    const [item, botEventLogs, megaBotLogs, docs, marketComps, offers, tradeLogs] = await Promise.all([
      // 1. Item with direct relations
      prisma.item.findUnique({
        where: { id: itemId },
        include: {
          aiResult: true,
          valuation: true,
          antiqueCheck: true,
          priceSnapshots: { orderBy: { createdAt: "desc" }, take: 10 },
          project: { select: { id: true, name: true, type: true } },
        },
      }),
      // 2. Bot result EventLogs
      prisma.eventLog.findMany({
        where: {
          itemId,
          eventType: {
            in: [
              "PRICEBOT_RESULT",
              "COLLECTIBLESBOT_RESULT",
              "CARBOT_RESULT",
              "LISTBOT_RESULT",
              "BUYERBOT_RESULT",
              "ANTIQUEBOT_RESULT",
              "RECONBOT_RESULT",
              "PHOTOBOT_ASSESS",
              "PHOTOBOT_ENHANCE",
              "PHOTOBOT_EDIT",
              "RAINFOREST_RESULT",
              "ANALYZEBOT_MARKET_INTEL",
            ],
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      // 3. MegaBot results
      prisma.eventLog.findMany({
        where: { itemId, eventType: { startsWith: "MEGABOT_" } },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      // 4. Document vault summaries (now with structured AI analysis)
      prisma.itemDocument.findMany({
        where: { itemId, aiSummary: { not: null } },
        select: { docType: true, label: true, aiSummary: true, aiAnalysis: true, confidenceScore: true },
        take: 10,
      }).catch(() => [] as any[]),
      // 5. Market comps
      prisma.marketComp.findMany({
        where: { itemId },
        orderBy: { createdAt: "desc" },
        take: 10,
      }).catch(() => [] as any[]),
      // 6. Offer history
      prisma.offer.findMany({
        where: { itemId },
        select: { currentPrice: true, originalPrice: true, status: true, round: true, createdAt: true },
        orderBy: { createdAt: "desc" },
        take: 5,
      }).catch(() => [] as any[]),
      // 7. Trade proposal EventLogs
      prisma.eventLog.findMany({
        where: { itemId, eventType: { in: ["TRADE_PROPOSED", "TRADE_RESPONDED"] } },
        orderBy: { createdAt: "desc" },
        take: 10,
        select: { eventType: true, payload: true, createdAt: true },
      }).catch(() => [] as any[]),
    ]);

    if (!item) return emptyContext(itemId);

    // Document vault findings — enriched with structured AI analysis
    let documentVaultFindings: string | null = null;
    if (docs.length > 0) {
      const docParts: string[] = [];
      for (const d of docs as any[]) {
        let entry = `[${d.docType}]${d.label ? ` ${d.label}` : ""}`;
        if (d.aiAnalysis) {
          try {
            const analysis = JSON.parse(d.aiAnalysis);
            const fields: string[] = [];
            if (analysis.dates?.length) fields.push(`Dates: ${analysis.dates.map((dt: any) => `${dt.label}=${dt.value}`).join(", ")}`);
            if (analysis.prices?.length) fields.push(`Prices: ${analysis.prices.map((p: any) => `${p.label}=$${p.value}`).join(", ")}`);
            if (analysis.identifiers?.length) fields.push(`IDs: ${analysis.identifiers.map((id: any) => `${id.label}=${id.value}`).join(", ")}`);
            if (analysis.authenticityMarkers?.length) fields.push(`Auth: ${analysis.authenticityMarkers.join(", ")}`);
            if (analysis.provenanceDetails?.length) fields.push(`Provenance: ${analysis.provenanceDetails.join("; ")}`);
            if (analysis.keyFindings?.length) fields.push(`Findings: ${analysis.keyFindings.join("; ")}`);
            if (d.confidenceScore) fields.push(`Confidence: ${d.confidenceScore}%`);
            entry += ` — ${fields.join(". ")}`;
          } catch {
            entry += `: ${d.aiSummary || ""}`;
          }
        } else {
          entry += `: ${d.aiSummary || ""}`;
        }
        docParts.push(entry);
      }
      documentVaultFindings = docParts.join(" | ");
    }

    // Index EventLogs by type (most recent per type)
    const logByType: Record<string, string | null> = {};
    for (const log of botEventLogs) {
      if (!logByType[log.eventType]) {
        logByType[log.eventType] = log.payload;
      }
    }

    const summary: EnrichmentSummary = {
      analyzeBotFindings: extractAnalyzeBot(item),
      priceBotFindings: extractFromEventLog(logByType["PRICEBOT_RESULT"], extractPriceBot),
      antiqueBotFindings: extractAntiqueBot(item, logByType["ANTIQUEBOT_RESULT"]),
      collectiblesBotFindings: extractFromEventLog(logByType["COLLECTIBLESBOT_RESULT"], extractCollectiblesBot),
      carBotFindings: extractFromEventLog(logByType["CARBOT_RESULT"], extractCarBot),
      reconBotFindings: extractFromEventLog(logByType["RECONBOT_RESULT"], extractReconBot),
      listBotFindings: extractFromEventLog(logByType["LISTBOT_RESULT"], extractListBot),
      buyerBotFindings: extractFromEventLog(logByType["BUYERBOT_RESULT"], extractBuyerBot),
      photoBotFindings: extractPhotoBot(logByType),
      megaBotFindings: extractMegaBot(megaBotLogs),
      valuationFindings: extractValuation(item),
      amazonFindings: extractFromEventLog(logByType["RAINFOREST_RESULT"], extractAmazonData),
      marketIntelFindings: extractMarketIntelligence(logByType),
      documentVaultFindings,
      priorRunCount: 0, // calculated below
      confidenceLevel: "none",
    };

    summary.priorRunCount = countPriorRuns(summary, item, botEventLogs, megaBotLogs);
    summary.confidenceLevel = calculateConfidence(summary.priorRunCount);

    const contextBlock = buildContextBlock(summary, excludeBot, item, marketComps, botEventLogs, offers, tradeLogs);
    const hasEnrichment = summary.priorRunCount > 0;

    // Auto-populate structured intelligence fields if missing
    if (item.aiResult?.rawJson && !item.category) {
      try {
        const aiObj = safeJson(item.aiResult.rawJson);
        if (aiObj) {
          populateFromAnalysis(itemId, aiObj).catch(() => null);
        }
      } catch { /* never block enrichment */ }
    }

    if (hasEnrichment) {
      const findingsCount = contextBlock.split("\n").filter((l) => l.startsWith("•")).length;
      const hasAnalysis = !!item?.aiResult;
      const hasValuation = !!item?.valuation;
      const hasAmazon = !!summary.amazonFindings;
      const missingBots = ["analyze", "price", "antique", "collectibles", "car", "recon", "list", "buyer", "photo"].filter(b => {
        const key = b === "analyze" ? "analyzeBotFindings" : b === "price" ? "priceBotFindings" : `${b}BotFindings`;
        return !(summary as any)[key];
      });
      console.log(
        `[Enrichment] ${itemId} — confidence: ${summary.confidenceLevel} — ${summary.priorRunCount} sources — ${findingsCount} findings — analysis:${hasAnalysis ? "✓" : "✗"} valuation:${hasValuation ? "✓" : "✗"} amazon:${hasAmazon ? "✓" : "✗"} — missing: ${missingBots.length > 0 ? missingBots.join(",") : "none"}${excludeBot ? ` (excluding ${excludeBot})` : ""}`
      );
    }

    const result: ItemEnrichmentContext = {
      itemId,
      itemName: item.title ?? "Unknown Item",
      hasEnrichment,
      contextBlock,
      summary,
    };

    // ── Cache the result ──
    enrichmentCache.set(cacheKey, { result, builtAt: Date.now() });

    return result;
  } catch (err) {
    console.error("[enrichment] Failed to build context for item", itemId, err);
    return emptyContext(itemId);
  }
}

// ─────────────────────────────────────────────
// SAFE JSON PARSER
// ─────────────────────────────────────────────

function safeJson(raw: string | null | undefined): any {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────
// HELPER: Extract from EventLog payload
// ─────────────────────────────────────────────

function extractFromEventLog(
  payload: string | null | undefined,
  extractor: (data: any) => string | null
): string | null {
  const d = safeJson(payload);
  if (!d) return null;
  return extractor(d);
}

// ─────────────────────────────────────────────
// EXTRACTORS
// ─────────────────────────────────────────────

function extractAnalyzeBot(item: any): string | null {
  const raw = item.aiResult?.rawJson;
  const d = safeJson(raw);
  if (!d) return null;
  const parts: string[] = [];
  if (d.item_name) parts.push(`Item: ${d.item_name}`);
  if (d.category) parts.push(`Category: ${d.category}`);
  if (d.subcategory) parts.push(`Subcategory: ${d.subcategory}`);
  if (d.brand) parts.push(`Brand: ${d.brand}`);
  if (d.model) parts.push(`Model: ${d.model}`);
  if (d.maker) parts.push(`Maker: ${d.maker}`);
  if (d.material) parts.push(`Material: ${d.material}`);
  if (d.era) parts.push(`Era: ${d.era}`);
  if (d.style) parts.push(`Style: ${d.style}`);
  if (d.condition_guess) parts.push(`Condition: ${d.condition_guess}`);
  if (d.condition_score) parts.push(`Condition Score: ${d.condition_score}/10`);
  if (d.estimated_value_low && d.estimated_value_high) {
    parts.push(`AI Value: $${d.estimated_value_low}–$${d.estimated_value_high}`);
  }
  if (d.is_antique !== undefined) parts.push(`Antique: ${d.is_antique ? "Yes" : "No"}`);
  if (d.keywords?.length) parts.push(`Keywords: ${d.keywords.slice(0, 8).join(", ")}`);
  if (d.summary) parts.push(`Summary: ${String(d.summary).slice(0, 150)}`);
  return parts.length ? parts.join(" · ") : null;
}

function extractValuation(item: any): string | null {
  const v = item.valuation;
  if (!v) return null;
  const parts: string[] = [];
  if (v.low != null && v.high != null) parts.push(`Value: $${v.low}–$${v.high}${v.mid != null ? ` (mid: $${v.mid})` : ""}`);
  if (v.source) parts.push(`Source: ${v.source}`);
  if (v.confidence) parts.push(`Confidence: ${v.confidence}`);
  if (v.localLow != null && v.localHigh != null) parts.push(`Local: $${v.localLow}–$${v.localHigh}`);
  if (v.onlineLow != null && v.onlineHigh != null) parts.push(`Online: $${v.onlineLow}–$${v.onlineHigh}`);
  if (v.bestMarketCity) parts.push(`Best Market: ${v.bestMarketCity}`);
  if (v.recommendation) parts.push(`Rec: ${String(v.recommendation).slice(0, 100)}`);
  return parts.length ? parts.join(" · ") : null;
}

function extractAntiqueBot(item: any, eventPayload: string | null | undefined): string | null {
  // Combine AntiqueCheck model data + ANTIQUEBOT_RESULT EventLog
  const parts: string[] = [];

  // From AntiqueCheck model
  const ac = item.antiqueCheck;
  if (ac) {
    parts.push(`Antique: ${ac.isAntique ? "Yes" : "No"}`);
    if (ac.auctionLow != null && ac.auctionHigh != null) {
      parts.push(`Auction Est: $${ac.auctionLow}–$${ac.auctionHigh}`);
    }
    if (ac.authenticityScore) parts.push(`Auth Score: ${ac.authenticityScore}`);
    const reason = safeJson(ac.reason);
    if (reason?.markers?.length) {
      parts.push(`Markers: ${reason.markers.slice(0, 5).join(", ")}`);
    } else if (ac.reason && typeof ac.reason === "string") {
      parts.push(`Reason: ${ac.reason.slice(0, 100)}`);
    }
  }

  // From ANTIQUEBOT_RESULT EventLog (deep AI analysis — full extraction)
  const d = safeJson(eventPayload);
  if (d) {
    // Authentication
    const auth = d.authentication;
    if (auth?.verdict) parts.push(`Auth Verdict: ${auth.verdict}`);
    if (auth?.confidence) parts.push(`Auth Confidence: ${auth.confidence}%`);
    if (auth?.reasoning) parts.push(`Auth Reasoning: ${String(auth.reasoning).slice(0, 150)}`);
    if (auth?.positive_indicators?.length) parts.push(`Positive Signs: ${auth.positive_indicators.slice(0, 5).join(", ")}`);
    if (auth?.red_flags?.length) parts.push(`Red Flags: ${auth.red_flags.slice(0, 5).join(", ")}`);
    if (auth?.recommended_tests?.length) parts.push(`Recommended Tests: ${auth.recommended_tests.slice(0, 3).join(", ")}`);

    // Identification
    const ident = d.identification;
    if (ident?.item_type) parts.push(`Item Type: ${ident.item_type}`);
    if (ident?.period) parts.push(`Period: ${ident.period}`);
    if (ident?.origin) parts.push(`Origin: ${ident.origin}`);
    const maker = typeof ident?.maker_info === "object" ? ident.maker_info?.name : ident?.maker_info;
    if (maker) parts.push(`Maker: ${maker}`);
    if (ident?.material_analysis) {
      const mat = typeof ident.material_analysis === "object" ? ident.material_analysis.primary : ident.material_analysis;
      if (mat) parts.push(`Material: ${mat}`);
    }
    if (ident?.style_movement) parts.push(`Style: ${ident.style_movement}`);
    if (ident?.rarity) parts.push(`Rarity: ${ident.rarity}`);

    // Historical context
    const hist = d.historical_context;
    if (hist?.era_overview) parts.push(`Era: ${String(hist.era_overview).slice(0, 120)}`);
    if (hist?.cultural_significance) parts.push(`Cultural: ${String(hist.cultural_significance).slice(0, 100)}`);

    // Condition
    const cond = d.condition_assessment;
    if (cond?.overall_grade) parts.push(`Condition Grade: ${cond.overall_grade}`);
    if (cond?.age_appropriate_wear != null) parts.push(`Age-Appropriate Wear: ${cond.age_appropriate_wear}`);
    if (cond?.restoration_detected != null) parts.push(`Restoration: ${cond.restoration_detected ? "Detected" : "None"}`);
    if (cond?.conservation_recommendations) parts.push(`Conservation: ${String(cond.conservation_recommendations).slice(0, 100)}`);

    // Valuation — all price points
    const val = d.valuation;
    if (val?.fair_market_value?.low != null && val?.fair_market_value?.high != null) {
      parts.push(`FMV: $${val.fair_market_value.low}–$${val.fair_market_value.high}${val.fair_market_value.mid ? ` (mid: $${val.fair_market_value.mid})` : ""}`);
    }
    if (val?.insurance_value) parts.push(`Insurance: $${val.insurance_value}`);
    if (val?.replacement_value) parts.push(`Replacement: $${val.replacement_value}`);
    if (val?.auction_estimate) {
      const ae = val.auction_estimate;
      if (typeof ae === "object" && ae.low != null && ae.high != null) {
        parts.push(`Auction Est: $${ae.low}–$${ae.high}`);
      } else if (ae) parts.push(`Auction Est: ${ae}`);
    }
    if (val?.dealer_buy_price) parts.push(`Dealer Buy: $${val.dealer_buy_price}`);
    if (val?.private_sale_estimate) parts.push(`Private Sale: $${val.private_sale_estimate}`);
    if (val?.value_trend) parts.push(`Value Trend: ${val.value_trend}`);

    // Collector market
    const mkt = d.collector_market;
    if (mkt?.collector_demand) parts.push(`Collector Demand: ${mkt.collector_demand}`);
    if (mkt?.market_outlook) parts.push(`Market Outlook: ${String(mkt.market_outlook).slice(0, 100)}`);
    if (mkt?.collector_organizations?.length) parts.push(`Collector Orgs: ${mkt.collector_organizations.slice(0, 3).join(", ")}`);
    if (mkt?.recent_auction_results?.length) {
      parts.push(`Auction Comps: ${mkt.recent_auction_results.length} results`);
    }

    // Selling strategy
    const strat = d.selling_strategy;
    if (strat?.best_venue) parts.push(`Best Venue: ${strat.best_venue}`);
    if (strat?.timing) parts.push(`Timing: ${strat.timing}`);
    if (strat?.venue_options?.length) {
      const venues = strat.venue_options.slice(0, 3).map((v: any) => v.name || v.venue).filter(Boolean);
      if (venues.length) parts.push(`Venue Options: ${venues.join(", ")}`);
    }

    // Documentation
    const docs = d.documentation;
    if (docs?.provenance_importance) parts.push(`Provenance Importance: ${docs.provenance_importance}`);

    // Expert summary (250 chars)
    if (d.executive_summary) parts.push(`Expert: ${String(d.executive_summary).slice(0, 250)}`);
  }

  return parts.length ? parts.join(" · ") : null;
}

function extractPriceBot(d: any): string | null {
  const parts: string[] = [];
  if (d.price_validation) {
    const pv = d.price_validation;
    if (pv.revised_low != null && pv.revised_high != null) {
      parts.push(`Revised Price: $${pv.revised_low}–$${pv.revised_high}${pv.revised_mid ? ` (mid: $${pv.revised_mid})` : ""}`);
    }
    if (pv.revision_reasoning) parts.push(`Reasoning: ${String(pv.revision_reasoning).slice(0, 100)}`);
  }
  if (d.market_analysis?.demand_level) parts.push(`Demand: ${d.market_analysis.demand_level}`);
  if (d.market_analysis?.demand_trend) parts.push(`Trend: ${d.market_analysis.demand_trend}`);
  if (d.platform_pricing?.best_platform) parts.push(`Best Platform: ${d.platform_pricing.best_platform}`);
  if (d.negotiation_guide?.list_price) parts.push(`List At: $${d.negotiation_guide.list_price}`);
  if (d.negotiation_guide?.minimum_accept) parts.push(`Min Accept: $${d.negotiation_guide.minimum_accept}`);
  if (d.executive_summary) parts.push(`Expert: ${String(d.executive_summary).slice(0, 150)}`);
  return parts.length ? parts.join(" · ") : null;
}

function extractCollectiblesBot(d: any): string | null {
  const parts: string[] = [];

  // ── Section 1: Identity (6 fields) ──
  if (d.item_name) parts.push(`Collectible: ${d.item_name}`);
  if (d.year) parts.push(`Year: ${d.year}`);
  if (d.brand_series) parts.push(`Series: ${d.brand_series}`);
  if (d.edition_variation) parts.push(`Edition: ${d.edition_variation}`);
  if (d.category) parts.push(`Category: ${d.category}`);
  if (d.subcategory) parts.push(`Subcategory: ${d.subcategory}`);

  // ── Section 2: Rarity & Condition (5 fields) ──
  if (d.rarity) parts.push(`Rarity: ${d.rarity}`);
  if (d.condition_assessment) parts.push(`Condition: ${String(d.condition_assessment).slice(0, 120)}`);
  if (d.potential_value) parts.push(`Potential: ${d.potential_value}`);
  if (d.authenticated != null) parts.push(`Authenticated: ${d.authenticated ? "Yes" : "No"}`);
  if (d.provenance_confirmed != null) parts.push(`Provenance: ${d.provenance_confirmed ? "Confirmed" : "Unconfirmed"}`);

  // ── Section 3: Raw Valuation (4 fields) ──
  if (d.raw_value_low != null && d.raw_value_high != null) {
    parts.push(`Raw Value: $${d.raw_value_low}–$${d.raw_value_high}${d.raw_value_mid ? ` (mid: $${d.raw_value_mid})` : ""}`);
  }
  if (d.value_reasoning) parts.push(`Value Reasoning: ${String(d.value_reasoning).slice(0, 150)}`);

  // ── Section 4: Graded Values (5 fields) ──
  const gv = d.graded_values;
  if (gv && typeof gv === "object") {
    const tiers = Object.entries(gv)
      .filter(([, v]) => v != null && v !== 0)
      .map(([k, v]) => `${k}: $${v}`)
      .slice(0, 6);
    if (tiers.length) parts.push(`Graded Values: ${tiers.join(", ")}`);
  }
  if (d.valuation_source) parts.push(`Source: ${String(d.valuation_source).slice(0, 100)}`);
  if (d.population_data) parts.push(`Population: ${String(d.population_data).slice(0, 100)}`);
  if (d.print_run) parts.push(`Print Run: ${d.print_run}`);
  if (d.notable_variations) parts.push(`Variations: ${String(d.notable_variations).slice(0, 100)}`);

  // ── Section 5: Visual Grading (8 fields) ──
  const vg = d.visual_grading;
  if (vg && typeof vg === "object") {
    if (vg.psa_grade) parts.push(`PSA Grade: ${vg.psa_grade}`);
    if (vg.bgs_grade) parts.push(`BGS Grade: ${vg.bgs_grade}`);
    if (vg.grade_confidence != null) parts.push(`Grade Confidence: ${Math.round(vg.grade_confidence * 100)}%`);
    if (vg.corners) parts.push(`Corners: ${String(vg.corners).slice(0, 80)}`);
    if (vg.edges) parts.push(`Edges: ${String(vg.edges).slice(0, 80)}`);
    if (vg.surface) parts.push(`Surface: ${String(vg.surface).slice(0, 80)}`);
    if (vg.centering) parts.push(`Centering: ${vg.centering}`);
    if (vg.grade_reasoning) parts.push(`Grade Reasoning: ${String(vg.grade_reasoning).slice(0, 150)}`);
  }

  // ── Section 6: Grading Recommendation (3 fields) ──
  if (d.grading_recommendation) parts.push(`Grading Rec: ${d.grading_recommendation}`);
  if (d.grading_roi_reasoning) parts.push(`Grading ROI: ${String(d.grading_roi_reasoning).slice(0, 120)}`);
  if (d.collector_notes) parts.push(`Collector Notes: ${String(d.collector_notes).slice(0, 120)}`);

  // ── Section 7: Market & Demand (6 fields) ──
  if (d.demand_trend) parts.push(`Demand: ${d.demand_trend}`);
  if (d.demand_reasoning) parts.push(`Demand Reasoning: ${String(d.demand_reasoning).slice(0, 100)}`);
  if (d.best_platform) parts.push(`Best Platform: ${d.best_platform}`);
  if (d.platform_reasoning) parts.push(`Platform Reasoning: ${String(d.platform_reasoning).slice(0, 100)}`);
  if (d.selling_strategy) parts.push(`Selling Strategy: ${String(d.selling_strategy).slice(0, 120)}`);
  if (d.community_sentiment) parts.push(`Sentiment: ${d.community_sentiment}`);

  // ── Section 8: Collection Context (7 fields) ──
  const cc = d.collection_context;
  if (cc && typeof cc === "object") {
    if (cc.set_name) parts.push(`Set: ${cc.set_name}`);
    if (cc.set_total) parts.push(`Set Size: ${cc.set_total}`);
    if (cc.card_number) parts.push(`Card #: ${cc.card_number}`);
    if (cc.is_key_card) parts.push(`Key Card: Yes${cc.key_card_reason ? ` — ${String(cc.key_card_reason).slice(0, 60)}` : ""}`);
    if (cc.set_completion_hint) parts.push(`Set Tip: ${String(cc.set_completion_hint).slice(0, 100)}`);
    if (cc.collection_category_tag) parts.push(`Tag: ${cc.collection_category_tag}`);
  }

  // ── Section 9: Price History (6 fields) ──
  const ph = d.price_history;
  if (ph && typeof ph === "object") {
    if (ph.trend_6mo) parts.push(`6mo Trend: ${ph.trend_6mo}`);
    if (ph.trend_1yr) parts.push(`1yr Trend: ${ph.trend_1yr}`);
    if (ph.trend_3yr) parts.push(`3yr Trend: ${ph.trend_3yr}`);
    if (ph.peak_price) parts.push(`Peak: ${ph.peak_price}`);
    if (ph.floor_price) parts.push(`Floor: ${ph.floor_price}`);
    if (ph.catalyst_events) parts.push(`Catalysts: ${String(ph.catalyst_events).slice(0, 100)}`);
  }

  // ── Section 10: Investment (5 fields) ──
  const inv = d.investment;
  if (inv && typeof inv === "object") {
    if (inv.price_1yr) parts.push(`1yr Projection: ${String(inv.price_1yr).slice(0, 80)}`);
    if (inv.price_5yr) parts.push(`5yr Projection: ${String(inv.price_5yr).slice(0, 80)}`);
    if (inv.catalysts) parts.push(`Growth Drivers: ${String(inv.catalysts).slice(0, 100)}`);
    if (inv.risks) parts.push(`Risks: ${String(inv.risks).slice(0, 100)}`);
    if (inv.verdict) parts.push(`Verdict: ${inv.verdict}`);
  }

  // ── Section 11: Authentication & Professional Services (4 fields) ──
  if (d.authentication_services?.recommended_service) parts.push(`Auth Service: ${d.authentication_services.recommended_service}`);
  if (d.authentication_services?.estimated_cost) parts.push(`Auth Cost: ${d.authentication_services.estimated_cost}`);
  if (d.authentication_services?.turnaround_time) parts.push(`Auth Turnaround: ${d.authentication_services.turnaround_time}`);
  if (d.authentication_services?.value_with_authentication) parts.push(`Value After Auth: ${d.authentication_services.value_with_authentication}`);

  // ── Section 12: Liquidity & Timing (4 fields) ──
  if (d.liquidity_assessment?.time_to_sell) parts.push(`Liquidity: ${d.liquidity_assessment.time_to_sell}`);
  if (d.liquidity_assessment?.market_depth) parts.push(`Market Depth: ${d.liquidity_assessment.market_depth}`);
  if (d.liquidity_assessment?.best_selling_window) parts.push(`Sell Window: ${d.liquidity_assessment.best_selling_window}`);
  if (d.liquidity_assessment?.reasoning) parts.push(`Liquidity Note: ${String(d.liquidity_assessment.reasoning).slice(0, 100)}`);

  // ── Section 13: Insurance & Risk (3 fields) ──
  if (d.insurance_valuation?.replacement_value) parts.push(`Insurance Value: $${d.insurance_valuation.replacement_value}`);
  if (d.insurance_valuation?.reasoning) parts.push(`Insurance Note: ${String(d.insurance_valuation.reasoning).slice(0, 100)}`);

  // ── Section 14: Condition History & Red Flags (3 fields) ──
  if (d.condition_history?.restoration_flags) parts.push(`Restoration: ${String(d.condition_history.restoration_flags).slice(0, 100)}`);
  if (d.condition_history?.red_flags && !String(d.condition_history.red_flags).toLowerCase().includes("none")) parts.push(`Red Flags: ${String(d.condition_history.red_flags).slice(0, 100)}`);
  if (d.condition_history?.provenance_notes) parts.push(`Provenance: ${String(d.condition_history.provenance_notes).slice(0, 100)}`);

  // ── Section 15: Comparable Sales (1 aggregate field) ──
  if (Array.isArray(d.comparable_sales) && d.comparable_sales.length > 0) parts.push(`Recent Comps: ${d.comparable_sales.map((c: any) => `${c.item}=$${c.price}(${c.date},${c.platform})`).join("; ")}`);

  // ── Section 16: Market Intelligence ──
  if (d.market_comps && Array.isArray(d.market_comps) && d.market_comps.length > 0) parts.push(`Market Comps: ${d.market_comps.length} real sold listings`);
  if (d.market_median != null) parts.push(`Market Median: $${d.market_median}`);
  if (d.market_confidence != null) parts.push(`Market Confidence: ${Math.round(d.market_confidence * 100)}%`);
  if (d.pricing_sources && Array.isArray(d.pricing_sources)) parts.push(`Pricing Sources: ${d.pricing_sources.join(", ")}`);
  if (d.market_trend) parts.push(`Market Trend: ${d.market_trend}`);
  if (d.pricing_discrepancy) parts.push(`⚠️ Pricing discrepancy: AI vs market data differ >40%`);

  // ── Section 17: Executive Summary ──
  if (d.executive_summary) parts.push(`Expert: ${String(d.executive_summary).slice(0, 250)}`);

  return parts.length ? parts.join(" · ") : null;
}

function extractCarBot(d: any): string | null {
  const parts: string[] = [];

  // Vehicle identification
  const id = d.identification;
  if (id?.year && id?.make && id?.model) {
    parts.push(`Vehicle: ${id.year} ${id.make} ${id.model}${id.trim ? ` ${id.trim}` : ""}`);
  }
  if (id?.body_style) parts.push(`Body: ${id.body_style}`);
  if (id?.drivetrain) parts.push(`Drive: ${id.drivetrain}`);
  if (id?.engine) parts.push(`Engine: ${id.engine}`);
  if (id?.vin_from_photo) parts.push(`VIN (photo): ${id.vin_from_photo}`);

  // Condition — all 3 sub-scores + overall
  if (d.condition_assessment?.overall_grade) parts.push(`Grade: ${d.condition_assessment.overall_grade}`);
  const ext = d.condition_assessment?.exterior?.score;
  const int_ = d.condition_assessment?.interior?.score;
  const mech = d.condition_assessment?.mechanical?.score;
  if (ext != null || int_ != null || mech != null) {
    parts.push(`Condition: Ext ${ext ?? "?"}/10, Int ${int_ ?? "?"}/10, Mech ${mech ?? "?"}/10`);
  }

  // Valuation — all 3 types
  if (d.valuation?.private_party_value?.mid) parts.push(`Private Party: $${Math.round(d.valuation.private_party_value.mid).toLocaleString()}`);
  if (d.valuation?.retail_value?.mid) parts.push(`Retail: $${Math.round(d.valuation.retail_value.mid).toLocaleString()}`);
  if (d.valuation?.trade_in_value?.mid) parts.push(`Trade-In: $${Math.round(d.valuation.trade_in_value.mid).toLocaleString()}`);

  // NHTSA real government data
  const nhtsa = d.nhtsaReport;
  if (nhtsa) {
    if (nhtsa.recalls?.count > 0) parts.push(`NHTSA Recalls: ${nhtsa.recalls.count} active`);
    if (nhtsa.complaints?.count > 0) parts.push(`NHTSA Complaints: ${nhtsa.complaints.count} filed`);
    if (nhtsa.safetyRatings?.overallRating) parts.push(`Safety: ${nhtsa.safetyRatings.overallRating}/5 stars (NHTSA)`);
  }

  // Market intelligence
  if (d.market_analysis?.demand_level) parts.push(`Demand: ${d.market_analysis.demand_level}`);
  if (d.market_analysis?.time_to_sell_estimate) parts.push(`Time to Sell: ${d.market_analysis.time_to_sell_estimate}`);
  if (d.selling_strategy?.listing_price) parts.push(`List Price: $${Math.round(d.selling_strategy.listing_price).toLocaleString()}`);

  // History + reliability
  if (d.vehicle_history_context?.common_problems?.length) {
    parts.push(`Common Issues: ${d.vehicle_history_context.common_problems.slice(0, 3).join(", ")}`);
  }
  if (d.vehicle_history_context?.reliability_rating) parts.push(`Reliability: ${d.vehicle_history_context.reliability_rating}`);

  // Expert summary (200 chars)
  if (d.executive_summary) parts.push(`Expert: ${String(d.executive_summary).slice(0, 200)}`);

  return parts.length ? parts.join(" · ") : null;
}

function extractReconBot(d: any): string | null {
  const parts: string[] = [];

  // Section 1: Scan Summary (up to 8 fields)
  if (d.scan_summary) {
    if (d.scan_summary.scan_type) parts.push(`Scan: ${d.scan_summary.scan_type}`);
    if (d.scan_summary.total_competitors_found != null) parts.push(`Competitors: ${d.scan_summary.total_competitors_found}`);
    if (d.scan_summary.active_listings != null) parts.push(`Active: ${d.scan_summary.active_listings}`);
    if (d.scan_summary.recently_sold != null) parts.push(`Sold: ${d.scan_summary.recently_sold}`);
    if (d.scan_summary.market_heat) parts.push(`Heat: ${d.scan_summary.market_heat}`);
    if (d.scan_summary.price_position) parts.push(`Position: ${d.scan_summary.price_position}`);
    if (d.scan_summary.overall_threat_level) parts.push(`Threat: ${d.scan_summary.overall_threat_level}`);
    if (d.scan_summary.headline) parts.push(`Headline: "${String(d.scan_summary.headline).slice(0, 80)}"`);
  }

  // Section 2: Price Intelligence (up to 8 fields)
  if (d.price_intelligence) {
    if (d.price_intelligence.market_average != null) parts.push(`Avg: $${d.price_intelligence.market_average}`);
    if (d.price_intelligence.market_median != null) parts.push(`Median: $${d.price_intelligence.market_median}`);
    if (d.price_intelligence.lowest_active != null) parts.push(`Low: $${d.price_intelligence.lowest_active}`);
    if (d.price_intelligence.highest_active != null) parts.push(`High: $${d.price_intelligence.highest_active}`);
    if (d.price_intelligence.optimal_price != null) parts.push(`Optimal: $${d.price_intelligence.optimal_price}`);
    if (d.price_intelligence.price_trend) parts.push(`Trend: ${d.price_intelligence.price_trend}`);
    if (d.price_intelligence.price_trend_pct) parts.push(`Trend%: ${d.price_intelligence.price_trend_pct}`);
    if (d.price_intelligence.price_position_detail) parts.push(`PositionNote: ${String(d.price_intelligence.price_position_detail).slice(0, 100)}`);
  }

  // Section 3: Market Dynamics (up to 6 fields)
  if (d.market_dynamics) {
    if (d.market_dynamics.supply_level) parts.push(`Supply: ${d.market_dynamics.supply_level}`);
    if (d.market_dynamics.demand_signals) parts.push(`Demand: ${String(d.market_dynamics.demand_signals).slice(0, 80)}`);
    if (d.market_dynamics.avg_days_to_sell != null) parts.push(`AvgDays: ${d.market_dynamics.avg_days_to_sell}`);
    if (d.market_dynamics.sell_through_rate) parts.push(`SellThru: ${d.market_dynamics.sell_through_rate}`);
    if (d.market_dynamics.market_velocity) parts.push(`Velocity: ${d.market_dynamics.market_velocity}`);
    if (d.market_dynamics.seasonal_outlook) parts.push(`Season: ${String(d.market_dynamics.seasonal_outlook).slice(0, 60)}`);
  }

  // Section 4: Platform Breakdown (aggregate top 3)
  if (d.platform_breakdown && Array.isArray(d.platform_breakdown) && d.platform_breakdown.length > 0) {
    const topPlatforms = d.platform_breakdown.slice(0, 3).map((p: any) => `${p.platform || "?"}($${p.avg_price || "?"})`).join(", ");
    parts.push(`TopPlatforms: ${topPlatforms}`);
  }

  // Section 5: Competitive Advantages (top 2)
  if (d.competitive_advantages && Array.isArray(d.competitive_advantages) && d.competitive_advantages.length > 0) {
    const advs = d.competitive_advantages.slice(0, 2).map((a: any) => a.advantage || a).filter(Boolean).join("; ");
    if (advs) parts.push(`Advantages: ${String(advs).slice(0, 120)}`);
  }

  // Section 6: Competitive Disadvantages (top 2)
  if (d.competitive_disadvantages && Array.isArray(d.competitive_disadvantages) && d.competitive_disadvantages.length > 0) {
    const disadvs = d.competitive_disadvantages.slice(0, 2).map((x: any) => x.disadvantage || x).filter(Boolean).join("; ");
    if (disadvs) parts.push(`Disadvantages: ${String(disadvs).slice(0, 120)}`);
  }

  // Section 7: Alerts (count + types)
  if (d.alerts && Array.isArray(d.alerts) && d.alerts.length > 0) {
    const alertTypes = Array.from(new Set(d.alerts.map((a: any) => a.type || a.alertType).filter(Boolean))).slice(0, 3).join(", ");
    parts.push(`Alerts: ${d.alerts.length}${alertTypes ? ` (${alertTypes})` : ""}`);
  }

  // Section 8: Market Forecast (2 fields)
  if (d.market_forecast) {
    if (d.market_forecast.best_window) parts.push(`BestWindow: ${d.market_forecast.best_window}`);
    if (d.market_forecast.short_term) parts.push(`ShortTerm: ${String(d.market_forecast.short_term).slice(0, 80)}`);
  }

  // Section 9: Executive Summary
  if (d.executive_summary) parts.push(`Expert: ${String(d.executive_summary).slice(0, 200)}`);

  return parts.length ? parts.join(" · ") : null;
}

function extractListBot(d: any): string | null {
  const parts: string[] = [];
  if (d.best_title_overall) parts.push(`Best Title: "${d.best_title_overall}"`);
  if (d.top_platforms?.length) parts.push(`Top Platforms: ${d.top_platforms.slice(0, 4).join(", ")}`);
  if (d.seo_keywords?.primary?.length) parts.push(`SEO: ${d.seo_keywords.primary.slice(0, 5).join(", ")}`);
  if (d.best_description_hook) parts.push(`Hook: "${String(d.best_description_hook).slice(0, 80)}"`);
  if (d.executive_summary) parts.push(`Expert: ${String(d.executive_summary).slice(0, 150)}`);
  return parts.length ? parts.join(" · ") : null;
}

function extractBuyerBot(d: any): string | null {
  const parts: string[] = [];
  if (d.buyer_profiles?.length) {
    const profiles = d.buyer_profiles.slice(0, 3).map((p: any) => p.profile_name || p.buyer_type).filter(Boolean);
    if (profiles.length) parts.push(`Top Buyers: ${profiles.join(", ")}`);
  }
  if (d.platform_opportunities?.length) {
    const platforms = d.platform_opportunities.slice(0, 3).map((p: any) => p.platform).filter(Boolean);
    if (platforms.length) parts.push(`Best Platforms: ${platforms.join(", ")}`);
  }
  if (d.timing_advice?.urgency_recommendation) parts.push(`Urgency: ${d.timing_advice.urgency_recommendation}`);
  if (d.executive_summary) parts.push(`Expert: ${String(d.executive_summary).slice(0, 150)}`);
  return parts.length ? parts.join(" · ") : null;
}

function extractPhotoBot(logByType: Record<string, string | null>): string | null {
  // Check all PhotoBot event types
  const payload = logByType["PHOTOBOT_ASSESS"] || logByType["PHOTOBOT_ENHANCE"] || logByType["PHOTOBOT_EDIT"];
  const d = safeJson(payload);
  if (!d) return null;
  const parts: string[] = [];
  if (d.overall_quality_score) parts.push(`Photo Quality: ${d.overall_quality_score}/10`);
  if (d.overallPhotoScore) parts.push(`Photo Score: ${d.overallPhotoScore}/10`);
  if (d.cover_photo_recommendation) parts.push(`Cover: ${String(d.cover_photo_recommendation).slice(0, 80)}`);
  if (d.coverPhotoRecommendation) parts.push(`Cover: ${String(d.coverPhotoRecommendation).slice(0, 80)}`);
  if (d.missing_angles?.length) parts.push(`Missing Shots: ${d.missing_angles.slice(0, 3).join(", ")}`);
  if (d.missingShots?.length) parts.push(`Missing Shots: ${d.missingShots.slice(0, 3).join(", ")}`);
  if (d.priorityAction) parts.push(`Priority: ${String(d.priorityAction).slice(0, 80)}`);
  // StyleScoring (ported from StyleBot into PhotoBot assess-only mode)
  if (d.styleScoring?.overallScore) {
    parts.push(`Listing Readiness: ${d.styleScoring.overallScore}/100`);
    if (d.styleScoring.presentation?.score) parts.push(`Presentation: ${d.styleScoring.presentation.score}/100`);
    if (d.styleScoring.listing?.score) parts.push(`Listing Quality: ${d.styleScoring.listing.score}/100`);
    if (d.styleScoring.staging?.score) parts.push(`Staging: ${d.styleScoring.staging.score}/100`);
    if (d.styleScoring.staging?.suggestions?.length) parts.push(`Staging Tips: ${d.styleScoring.staging.suggestions.slice(0, 2).join("; ")}`);
  }
  return parts.length ? parts.join(" · ") : null;
}

function extractMarketIntelligence(logByType: Record<string, string | null>): string | null {
  const payload = logByType["ANALYZEBOT_MARKET_INTEL"];
  const d = safeJson(payload);
  if (!d) return null;
  const parts: string[] = [];
  if (d.compCount) parts.push(`${d.compCount} market comps`);
  if (d.sources?.length) parts.push(`Sources: ${d.sources.join(", ")}`);
  if (d.median) parts.push(`Market median: $${Math.round(d.median)}`);
  if (d.low && d.high) parts.push(`Range: $${Math.round(d.low)}–$${Math.round(d.high)}`);
  if (d.trend) parts.push(`Trend: ${d.trend}`);
  if (d.confidence) parts.push(`Confidence: ${Math.round(d.confidence * 100)}%`);
  return parts.length ? parts.join(" · ") : null;
}

function extractAmazonData(d: any): string | null {
  const parts: string[] = [];
  if (d.searchTerm) parts.push(`Search: "${d.searchTerm}"`);
  if (d.resultCount) parts.push(`${d.resultCount} Amazon listings`);
  if (d.priceRange) {
    parts.push(`Amazon price range: $${d.priceRange.low}–$${d.priceRange.high} (avg: $${d.priceRange.avg})`);
  }
  if (d.topResult?.title && d.topResult?.price) {
    parts.push(`Top match: "${String(d.topResult.title).slice(0, 80)}" at $${d.topResult.price}`);
    if (d.topResult.ratingsTotal) parts.push(`${d.topResult.ratingsTotal} reviews, ${d.topResult.rating}★`);
  }
  if (d.priceRange?.avg) {
    parts.push(`Use Amazon avg $${d.priceRange.avg} as real-world market anchor`);
  }
  return parts.length ? parts.join(" · ") : null;
}

function extractMegaBot(megaBotLogs: any[]): string | null {
  if (!megaBotLogs?.length) return null;
  const parts: string[] = [];

  // Group by specialist type, keep most recent per type
  const byType: Record<string, any> = {};
  for (const log of megaBotLogs) {
    const type = log.eventType.replace("MEGABOT_", "").toLowerCase();
    if (!byType[type]) {
      byType[type] = safeJson(log.payload);
    }
  }

  const types = Object.keys(byType);
  parts.push(`MegaBot Enhanced: ${types.length} specialist${types.length !== 1 ? "s" : ""} (${types.join(", ")})`);

  // Extract agreement scores per specialist
  const agreements: string[] = [];
  let totalAgreement = 0;
  let agreementCount = 0;
  for (const [type, data] of Object.entries(byType)) {
    if (data?.agreementScore) {
      const score = data.agreementScore > 1 ? Math.round(data.agreementScore) : Math.round(data.agreementScore * 100);
      agreements.push(`${type}:${score}%`);
      totalAgreement += score;
      agreementCount++;
    }
  }
  if (agreements.length > 0) {
    const avg = Math.round(totalAgreement / agreementCount);
    parts.push(`Agreement: ${agreements.join(", ")} (avg ${avg}%)`);
  }

  // Extract executive summary from each specialist (first 120 chars each)
  for (const [type, data] of Object.entries(byType)) {
    const summary = data?.summary || data?.executive_summary || data?.expertSummary || data?.consensus?.executive_summary;
    if (summary && typeof summary === "string" && summary.length > 20) {
      parts.push(`${type}: ${summary.slice(0, 120)}${summary.length > 120 ? "..." : ""}`);
    }
  }

  return parts.length ? parts.join(" · ") : null;
}

// ─────────────────────────────────────────────
// CONTEXT BLOCK BUILDER
// ─────────────────────────────────────────────

function buildContextBlock(summary: EnrichmentSummary, excludeBot?: string, item?: any, marketComps?: any[], botEventLogs?: any[], offers?: any[], tradeLogs?: any[]): string {
  const findings: string[] = [];

  // ── Structured Intelligence (from Item fields) ──
  if (item) {
    const structured: string[] = [];
    if (item.category) structured.push(`Category: ${item.category}`);
    if (item.brand) structured.push(`Brand: ${item.brand}`);
    if (item.era) structured.push(`Era: ${item.era}`);
    if (item.material) structured.push(`Material: ${item.material}`);
    if (item.maker) structured.push(`Maker: ${item.maker}`);
    if (item.itemStyle) structured.push(`Style: ${item.itemStyle}`);
    if (item.countryOfOrigin) structured.push(`Origin: ${item.countryOfOrigin}`);
    if (item.conditionGrade) structured.push(`Condition Grade: ${item.conditionGrade}`);
    if (structured.length > 0) {
      findings.push(`• STRUCTURED INTELLIGENCE: ${structured.join(" · ")}`);
    }
  }

  // ── Price History (from PriceSnapshots) ──
  if (item?.priceSnapshots?.length > 0) {
    const snapLines = item.priceSnapshots.slice(0, 5).map((s: any) => {
      const date = new Date(s.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" });
      const range = [s.priceLow && `$${s.priceLow}`, s.priceHigh && `$${s.priceHigh}`].filter(Boolean).join("–");
      return `${date} ${s.source}: ${range || "N/A"}${s.confidence ? ` (${s.confidence})` : ""}`;
    });
    findings.push(`• PRICE HISTORY (${item.priceSnapshots.length} snapshots): ${snapLines.join(" | ")}`);
    // Add trend summary
    if (item.priceSnapshots.length >= 2) {
      const newest = item.priceSnapshots[0];
      const oldest = item.priceSnapshots[item.priceSnapshots.length - 1];
      const newestPrice = (newest.priceMedian ?? ((newest.priceLow ?? 0) + (newest.priceHigh ?? 0)) / 2) / 100;
      const oldestPrice = (oldest.priceMedian ?? ((oldest.priceLow ?? 0) + (oldest.priceHigh ?? 0)) / 2) / 100;
      if (oldestPrice > 0 && newestPrice > 0) {
        const direction = newestPrice > oldestPrice * 1.05 ? "RISING" : newestPrice < oldestPrice * 0.95 ? "FALLING" : "STABLE";
        const changePct = Math.round(((newestPrice - oldestPrice) / oldestPrice) * 100);
        const days = Math.round((new Date(newest.createdAt).getTime() - new Date(oldest.createdAt).getTime()) / 86400000);
        findings.push(`• PRICE TREND: ${direction} (${changePct > 0 ? "+" : ""}${changePct}%) over ${days} days. Latest: $${Math.round(newestPrice)}, Earliest: $${Math.round(oldestPrice)}. Use this trend to inform pricing recommendations.`);
      }
    }
  }

  if (summary.analyzeBotFindings && excludeBot !== "analyzebot")
    findings.push(`• AI Analysis: ${summary.analyzeBotFindings}`);
  if (summary.valuationFindings && excludeBot !== "analyzebot")
    findings.push(`• Valuation: ${summary.valuationFindings}`);
  if (summary.priceBotFindings && excludeBot !== "pricebot")
    findings.push(`• PriceBot: ${summary.priceBotFindings}`);
  if (summary.antiqueBotFindings && excludeBot !== "antiquebot")
    findings.push(`• AntiqueBot: ${summary.antiqueBotFindings}`);
  if (summary.collectiblesBotFindings && excludeBot !== "collectiblesbot")
    findings.push(`• CollectiblesBot: ${summary.collectiblesBotFindings}`);
  if (summary.carBotFindings && excludeBot !== "carbot")
    findings.push(`• CarBot: ${summary.carBotFindings}`);
  if (summary.reconBotFindings && excludeBot !== "reconbot")
    findings.push(`• ReconBot: ${summary.reconBotFindings}`);
  if (summary.listBotFindings && excludeBot !== "listbot")
    findings.push(`• ListBot: ${summary.listBotFindings}`);
  if (summary.buyerBotFindings && excludeBot !== "buyerbot")
    findings.push(`• BuyerBot: ${summary.buyerBotFindings}`);
  if (summary.photoBotFindings && excludeBot !== "photobot")
    findings.push(`• PhotoBot: ${summary.photoBotFindings}`);
  if (summary.megaBotFindings && excludeBot !== "megabot")
    findings.push(`• MegaBot Expert Panel: ${summary.megaBotFindings}`);
  if (summary.amazonFindings) {
    // Check Amazon data freshness from EventLog timestamp
    let amazonAge = "";
    try {
      const amazonLog = botEventLogs?.find((l: any) => l.eventType === "RAINFOREST_RESULT");
      if (amazonLog?.createdAt) {
        const ageDays = Math.round((Date.now() - new Date(amazonLog.createdAt).getTime()) / 86400000);
        if (ageDays > 14) amazonAge = ` [🚨 VERY STALE: ${ageDays} days old — recommend re-running analysis for fresh market data]`;
        else if (ageDays > 7) amazonAge = ` [⚠️ STALE: ${ageDays} days old — prices may have changed]`;
      }
    } catch { /* ignore */ }
    findings.push(`• Amazon Market Data: ${summary.amazonFindings}${amazonAge}`);
  }
  if (summary.marketIntelFindings) {
    findings.push(`• Market Intelligence (Phase 1): ${summary.marketIntelFindings}`);
  }
  if (summary.documentVaultFindings) {
    findings.push(`• Document Vault Intelligence: ${summary.documentVaultFindings}`);
  } else {
    findings.push(`• DOCUMENT VAULT: Empty — no documents uploaded. Provenance documents, receipts, certificates, and authentication records would improve AI accuracy and buyer confidence.`);
  }

  // ── SELLER-PROVIDED CONTEXT (Gap 6) ──
  try {
    if (item) {
      const sellerParts: string[] = [];
      if (item.description) sellerParts.push(`Description: ${String(item.description).slice(0, 200)}`);
      if (item.story) sellerParts.push(`Personal Story: ${String(item.story).slice(0, 200)}`);
      if (item.numberOfOwners) sellerParts.push(`Number of Owners: ${item.numberOfOwners}`);
      if (item.approximateAge) sellerParts.push(`Approximate Age: ${item.approximateAge}`);
      if (item.worksProperly) sellerParts.push(`Works Properly: ${item.worksProperly}`);
      if (item.knownDamage) sellerParts.push(`Known Damage: ${item.knownDamage}`);
      if (item.hasOriginalPackaging) sellerParts.push(`Original Packaging: ${item.hasOriginalPackaging}`);
      if (item.purchasePrice != null) sellerParts.push(`Purchase Price: $${item.purchasePrice}`);
      if (item.purchaseDate) sellerParts.push(`Purchase Date: ${new Date(item.purchaseDate).toLocaleDateString("en-US")}`);
      if (item.condition) sellerParts.push(`Seller Condition Rating: ${item.condition}`);
      if (sellerParts.length > 0) {
        findings.push(`• SELLER-PROVIDED CONTEXT:\n  ${sellerParts.join("\n  ")}\n  NOTE: Seller-disclosed damage and condition must be reflected in all pricing, listing, and buyer recommendations. Never ignore known damage in valuations.`);
      }
    }
  } catch { /* seller context optional */ }

  // ── SALE/PROJECT CONTEXT (Gap 8) ──
  try {
    if (item?.project) {
      const p = item.project;
      const strategyMap: Record<string, string> = {
        ESTATE_SALE: "Premium pricing appropriate. Buyers expect quality estate items. Emphasize provenance, history, and authenticity.",
        GARAGE_SALE: "Competitive pricing preferred. Buyers expect deals. Emphasize value and quick pickup.",
        MOVING_SALE: "Speed of sale priority. Price to move quickly. Local pickup strongly preferred.",
        DOWNSIZING: "Seller motivated. Fair market value with flexibility. Story and history matter to buyers.",
        ONLINE_SALE: "Shipping required. Packaging and condition critical. Platform optimization important.",
      };
      const strategy = strategyMap[p.type] ?? "Standard resale strategy.";
      findings.push(`• SALE CONTEXT: Sale Name: ${p.name} · Sale Type: ${p.type} · Strategy: ${strategy}`);
    }
  } catch { /* project context optional */ }

  // ── REAL MARKETPLACE COMPARABLES (Gap 7) ──
  try {
    if (marketComps && marketComps.length > 0) {
      const compLines = marketComps.slice(0, 8).map((c: any, i: number) => {
        const parts = [`${i + 1}. ${c.platform}: "${String(c.title).slice(0, 60)}" — $${c.price}`];
        if (c.shipping != null) parts.push(`+ $${c.shipping} ship`);
        return parts.join(" ");
      });
      findings.push(`• REAL MARKETPLACE COMPARABLES (${marketComps.length} comps — use for pricing accuracy):\n  ${compLines.join("\n  ")}\n  NOTE: These are REAL comparable sales from actual marketplaces. Use these prices as your primary pricing reference.`);
    }
  } catch { /* market comps optional */ }

  // ── LOCAL MARKET INTELLIGENCE (Gap 10) ──
  try {
    if (item?.saleZip) {
      const market = getMarketInfo(item.saleZip);
      let guidance = "Standard pricing applies.";
      if (market.multiplier >= 1.2) guidance = "Strong local demand. Local pickup pricing can match or exceed online pricing.";
      else if (market.multiplier < 0.9) guidance = "Softer local market. Online platforms recommended for best price realization.";
      findings.push(`• LOCAL MARKET INTELLIGENCE: ZIP: ${item.saleZip} · Area: ${market.label} · Demand: ${market.tier} · Multiplier: ${market.multiplier}x · ${guidance}\n  NOTE: Apply the demand multiplier to local pickup pricing recommendations.`);
    }
  } catch { /* market data optional */ }

  // ── SHIPPING INTELLIGENCE (Gap 9) ──
  try {
    if (item && (item.shippingWeight || item.shippingLength || item.isFragile)) {
      const shipParts: string[] = [];
      if (item.shippingWeight) shipParts.push(`Weight: ${item.shippingWeight} lbs`);
      if (item.shippingLength && item.shippingWidth && item.shippingHeight) {
        shipParts.push(`Dimensions: ${item.shippingLength}×${item.shippingWidth}×${item.shippingHeight} in`);
      }
      if (item.isFragile) shipParts.push("Fragile: Yes — special packaging required");
      if (item.shippingPreference) shipParts.push(`Preference: ${item.shippingPreference}`);
      // Shipping strategy guidance
      if (item.shippingWeight && item.shippingWeight > 50) {
        shipParts.push("Strategy: Freight/LTL likely required. Local pickup strongly recommended.");
      } else if (item.isFragile) {
        shipParts.push("Strategy: Add $5–$15 to shipping estimate for protective materials.");
      } else if (item.shippingWeight && item.shippingWeight < 5) {
        shipParts.push("Strategy: Standard parcel shipping. Multiple platform options viable.");
      }
      if (shipParts.length > 0) {
        findings.push(`• SHIPPING INTELLIGENCE: ${shipParts.join(" · ")}\n  NOTE: Use this data for ship-vs-local recommendations. Do not guess at shipping costs when real dimensions are available.`);
      }
    }
  } catch { /* shipping data optional */ }

  // ── OFFER HISTORY (buyer demand signal) ──
  try {
    if (offers && offers.length > 0) {
      const activeOffers = offers.filter((o: any) => ["PENDING", "COUNTERED"].includes(o.status));
      const highestOffer = Math.max(...offers.map((o: any) => o.currentPrice)) / 100;
      const avgOffer = Math.round(offers.reduce((s: number, o: any) => s + o.currentPrice, 0) / offers.length) / 100;
      findings.push(`• OFFER HISTORY: ${offers.length} offer(s) received. ${activeOffers.length} active. Highest: $${Math.round(highestOffer)}. Average: $${Math.round(avgOffer)}. This shows real buyer demand — use it to validate pricing.`);
    }
  } catch { /* offer data optional */ }

  // ── TRADE PROPOSALS (barter demand signal) ──
  try {
    if (tradeLogs && tradeLogs.length > 0) {
      const proposals = tradeLogs.filter((l: any) => l.eventType === "TRADE_PROPOSED");
      const responses = tradeLogs.filter((l: any) => l.eventType === "TRADE_RESPONDED");
      const pendingCount = Math.max(0, proposals.length - responses.length);
      const totalTradeValue = proposals.reduce((sum: number, l: any) => {
        try { const d = JSON.parse(l.payload || "{}"); return sum + (d?.totalValue || 0); } catch { return sum; }
      }, 0);
      findings.push(`• TRADE PROPOSALS: ${proposals.length} received, ${pendingCount} pending. Total trade value offered: $${Math.round(totalTradeValue)}.${pendingCount > 0 ? " Active trade interest indicates demand." : ""}`);
    }
  } catch { /* trade data optional */ }

  if (!findings.length) return "";

  return [
    "═══════════════════════════════════════",
    "PRIOR ANALYSIS — CROSS-BOT ENRICHMENT CONTEXT",
    "The following has already been determined about this item by other AI agents.",
    "Use this as a verified foundation. Do not contradict without strong evidence.",
    `Confidence Level: ${summary.confidenceLevel.toUpperCase()} — ${summary.priorRunCount} prior bot run(s)`,
    "═══════════════════════════════════════",
    ...findings,
    "═══════════════════════════════════════",
    "Apply your specialized expertise to build on the above. Reference and expand",
    "on prior findings rather than starting from scratch.",
    "═══════════════════════════════════════",
  ].join("\n");
}

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

function countPriorRuns(
  summary: EnrichmentSummary,
  item: any,
  botEventLogs: any[],
  megaBotLogs: any[]
): number {
  let count = 0;
  if (item.aiResult) count++;
  if (item.valuation) count++;
  if (item.antiqueCheck) count++;
  // Count unique event types from bot runs
  const seen = new Set<string>();
  for (const log of botEventLogs) {
    if (!seen.has(log.eventType)) {
      seen.add(log.eventType);
      count++;
    }
  }
  // MegaBot runs
  count += megaBotLogs.length;
  return count;
}

function calculateConfidence(count: number): "none" | "low" | "medium" | "high" {
  if (count === 0) return "none";
  if (count <= 2) return "low";
  if (count <= 5) return "medium";
  return "high";
}

function emptyContext(itemId: string): ItemEnrichmentContext {
  return {
    itemId,
    itemName: "Unknown",
    hasEnrichment: false,
    contextBlock: "",
    summary: {
      analyzeBotFindings: null,
      priceBotFindings: null,
      antiqueBotFindings: null,
      collectiblesBotFindings: null,
      carBotFindings: null,
      reconBotFindings: null,
      listBotFindings: null,
      buyerBotFindings: null,
      photoBotFindings: null,
      megaBotFindings: null,
      valuationFindings: null,
      amazonFindings: null,
      marketIntelFindings: null,
      documentVaultFindings: null,
      priorRunCount: 0,
      confidenceLevel: "none",
    },
  };
}
