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
const CACHE_TTL_MS = 60_000; // 60 seconds

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
    const [item, botEventLogs, megaBotLogs, docs, marketComps] = await Promise.all([
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
      // 4. Document vault summaries
      prisma.itemDocument.findMany({
        where: { itemId, aiSummary: { not: null } },
        select: { docType: true, label: true, aiSummary: true },
        take: 10,
      }).catch(() => [] as any[]),
      // 5. Market comps
      prisma.marketComp.findMany({
        where: { itemId },
        orderBy: { createdAt: "desc" },
        take: 10,
      }).catch(() => [] as any[]),
    ]);

    if (!item) return emptyContext(itemId);

    // Document vault findings
    let documentVaultFindings: string | null = null;
    if (docs.length > 0) {
      documentVaultFindings = docs
        .map((d: any) => `[${d.docType}]${d.label ? ` ${d.label}` : ""}: ${d.aiSummary}`)
        .join(" | ");
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
      documentVaultFindings,
      priorRunCount: 0, // calculated below
      confidenceLevel: "none",
    };

    summary.priorRunCount = countPriorRuns(summary, item, botEventLogs, megaBotLogs);
    summary.confidenceLevel = calculateConfidence(summary.priorRunCount);

    const contextBlock = buildContextBlock(summary, excludeBot, item, marketComps);
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
      console.log(
        `[Enrichment] ${itemId} — confidence: ${summary.confidenceLevel} — ${summary.priorRunCount} sources — ${findingsCount} context lines injected${excludeBot ? ` (excluding ${excludeBot})` : ""}`
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
    // reason may be JSON with markers
    const reason = safeJson(ac.reason);
    if (reason?.markers?.length) {
      parts.push(`Markers: ${reason.markers.slice(0, 5).join(", ")}`);
    } else if (ac.reason && typeof ac.reason === "string") {
      parts.push(`Reason: ${ac.reason.slice(0, 100)}`);
    }
  }

  // From ANTIQUEBOT_RESULT EventLog (deeper AI analysis)
  const d = safeJson(eventPayload);
  if (d) {
    if (d.authentication?.verdict) parts.push(`Auth Verdict: ${d.authentication.verdict}`);
    if (d.identification?.period) parts.push(`Period: ${d.identification.period}`);
    if (d.identification?.origin) parts.push(`Origin: ${d.identification.origin}`);
    if (d.valuation?.fair_market_value?.mid) parts.push(`FMV Mid: $${d.valuation.fair_market_value.mid}`);
    if (d.collector_market?.collector_demand) parts.push(`Collector Demand: ${d.collector_market.collector_demand}`);
    if (d.executive_summary) parts.push(`Expert: ${String(d.executive_summary).slice(0, 150)}`);
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
  if (d.item_name) parts.push(`Collectible: ${d.item_name}`);
  if (d.year) parts.push(`Year: ${d.year}`);
  if (d.brand_series) parts.push(`Series: ${d.brand_series}`);
  if (d.edition_variation) parts.push(`Edition: ${d.edition_variation}`);
  if (d.rarity) parts.push(`Rarity: ${d.rarity}`);
  if (d.estimated_grade) parts.push(`Grade: ${d.estimated_grade}`);
  if (d.raw_value_low != null && d.raw_value_high != null) {
    parts.push(`Raw Value: $${d.raw_value_low}–$${d.raw_value_high}`);
  }
  if (d.visual_grading?.psa_grade) parts.push(`PSA: ${d.visual_grading.psa_grade}`);
  if (d.grading_roi?.recommendation) parts.push(`Grading: ${d.grading_roi.recommendation}`);
  if (d.demand_trend) parts.push(`Demand: ${d.demand_trend}`);
  if (d.best_platform) parts.push(`Best Platform: ${d.best_platform}`);
  if (d.executive_summary) parts.push(`Expert: ${String(d.executive_summary).slice(0, 150)}`);
  return parts.length ? parts.join(" · ") : null;
}

function extractCarBot(d: any): string | null {
  const parts: string[] = [];
  const id = d.identification;
  if (id?.year && id?.make && id?.model) parts.push(`Vehicle: ${id.year} ${id.make} ${id.model}${id.trim ? ` ${id.trim}` : ""}`);
  if (d.condition_assessment?.overall_grade) parts.push(`Grade: ${d.condition_assessment.overall_grade}`);
  if (d.valuation?.private_party_value?.mid) parts.push(`Private Party: $${d.valuation.private_party_value.mid}`);
  if (d.valuation?.retail_value?.mid) parts.push(`Retail: $${d.valuation.retail_value.mid}`);
  if (d.market_analysis?.demand_level) parts.push(`Demand: ${d.market_analysis.demand_level}`);
  if (d.vehicle_history_context?.common_problems?.length) {
    parts.push(`Common Issues: ${d.vehicle_history_context.common_problems.slice(0, 3).join(", ")}`);
  }
  if (d.executive_summary) parts.push(`Expert: ${String(d.executive_summary).slice(0, 150)}`);
  return parts.length ? parts.join(" · ") : null;
}

function extractReconBot(d: any): string | null {
  const parts: string[] = [];
  if (d.scan_summary?.total_competitors_found != null) parts.push(`Competitors: ${d.scan_summary.total_competitors_found}`);
  if (d.scan_summary?.market_heat) parts.push(`Market Heat: ${d.scan_summary.market_heat}`);
  if (d.scan_summary?.price_position) parts.push(`Price Position: ${d.scan_summary.price_position}`);
  if (d.price_intelligence?.optimal_price) parts.push(`Optimal Price: $${d.price_intelligence.optimal_price}`);
  if (d.price_intelligence?.market_average) parts.push(`Market Avg: $${d.price_intelligence.market_average}`);
  if (d.market_dynamics?.avg_days_to_sell) parts.push(`Avg Days to Sell: ${d.market_dynamics.avg_days_to_sell}`);
  if (d.alerts?.length) parts.push(`Alerts: ${d.alerts.length}`);
  if (d.executive_summary) parts.push(`Expert: ${String(d.executive_summary).slice(0, 150)}`);
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
  // Summarize which MegaBot specialists have run
  const specialists = megaBotLogs.map((l: any) => l.eventType.replace("MEGABOT_", "").toLowerCase());
  parts.push(`MegaBot Specialists: ${[...new Set(specialists)].join(", ")}`);

  // Extract key findings from the most recent specialist
  const d = safeJson(megaBotLogs[0]?.payload);
  if (d) {
    if (d.expertSummary) parts.push(`Expert Summary: ${String(d.expertSummary).slice(0, 200)}`);
    if (d.executive_summary) parts.push(`Expert: ${String(d.executive_summary).slice(0, 200)}`);
  }
  return parts.length ? parts.join(" · ") : null;
}

// ─────────────────────────────────────────────
// CONTEXT BLOCK BUILDER
// ─────────────────────────────────────────────

function buildContextBlock(summary: EnrichmentSummary, excludeBot?: string, item?: any, marketComps?: any[]): string {
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
  if (summary.amazonFindings)
    findings.push(`• Amazon Market Data: ${summary.amazonFindings}`);
  if (summary.documentVaultFindings)
    findings.push(`• Document Vault Intelligence: ${summary.documentVaultFindings}`);

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
      documentVaultFindings: null,
      priorRunCount: 0,
      confidenceLevel: "none",
    },
  };
}
