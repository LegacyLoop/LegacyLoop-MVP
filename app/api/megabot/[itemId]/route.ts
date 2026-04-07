import { NextResponse } from "next/server";
import crypto from "crypto"; // CMD-BUYERBOT-MEGA-C: Node built-in, no npm dep
import { authAdapter } from "@/lib/adapters/auth";
import { prisma } from "@/lib/db";
import { runSpecializedMegaBot, type RunSpecializedMegaBotOpts } from "@/lib/megabot/run-specialized";
import { MEGA_PROMPT_MAP, type PromptContext } from "@/lib/megabot/prompts";
import { getItemEnrichmentContext } from "@/lib/enrichment/item-context";
import { getMarketInfo } from "@/lib/pricing/market-data";
import { canUseBotOnTier, BOT_CREDIT_COSTS } from "@/lib/constants/pricing";
import { isDemoMode } from "@/lib/bot-mode";
import { checkCredits, deductCredits, hasPriorBotRun, refundCredits } from "@/lib/credits";
// CMD-RECONBOT-MEGA-C: Bot Constitution + live market intelligence
// for the ReconBot MegaBot branch (other bots get their own MEGA-C
// rounds; only botType === "reconbot" consumes these here).
import { buildItemSpecContext } from "@/lib/bots/item-spec-context";
import { summarizeSpecContext } from "@/lib/bots/spec-guards";
import { getMarketIntelligence } from "@/lib/market-intelligence/aggregator";
// CMD-SKILLS-INFRA-A: LegacyLoop Skill Pack loader. Process-cached
// markdown playbooks injected into the MegaBot prompt for ReconBot
// and BuyerBot (other bots get their own SKILLS rounds).
import { loadSkillPack } from "@/lib/bots/skill-loader";

// MegaBot runs 4 AI agents in parallel — grok can take up to 180s with retries
export const maxDuration = 300; // 5 minutes

function safeJson(s: string | null | undefined): any {
  if (!s) return null;
  try { return JSON.parse(s); } catch { return null; }
}

// ─── CMD-BUYERBOT-MEGA-C: telemetry helpers (FLAGS 1-7, 9 fix) ───
//
// Both helpers are PRIVATE to this route file. They read from each
// agent's existing `raw` response field — no agent function body
// edits, no run-specialized.ts edits beyond Part B's type tightening.
// ─────────────────────────────────────────────────────────────────

/**
 * extractAgentTelemetry — read per-agent telemetry (token counts +
 * web source counts) from the MegaBotResult's existing `raw` fields.
 * Defensive: every field falls back to 0 if the provider response
 * shape drifts.
 *
 * Resolves Round C FLAGS 3, 7, and 9 without touching any locked
 * agent function body.
 */
function extractAgentTelemetry(result: any): {
  perAgent: {
    openai: { inputTokens: number; outputTokens: number; webSources: number };
    claude: { inputTokens: number; outputTokens: number; webSources: number };
    gemini: { inputTokens: number; outputTokens: number; webSources: number };
    grok:   { inputTokens: number; outputTokens: number; webSources: number };
  };
  totals: { inputTokens: number; outputTokens: number; totalTokens: number; totalWebSources: number };
} {
  const safe = (n: any) => (typeof n === "number" && isFinite(n) ? n : 0);

  const openai = result?.agents?.openai?.raw;
  const claude = result?.agents?.claude?.raw;
  const gemini = result?.agents?.gemini?.raw;
  const grok   = result?.agents?.grok?.raw;

  // OpenAI: chat.completions usage shape
  const oi = safe(openai?.usage?.prompt_tokens);
  const oo = safe(openai?.usage?.completion_tokens);
  const ow = 0; // OpenAI vision call has no native grounding

  // Claude: messages API usage shape
  const ci = safe(claude?.usage?.input_tokens);
  const co = safe(claude?.usage?.output_tokens);
  const cw = 0; // Claude vision has no native grounding

  // Gemini: usageMetadata shape + grounding chunks
  const gi = safe(gemini?.usageMetadata?.promptTokenCount);
  const go = safe(gemini?.usageMetadata?.candidatesTokenCount);
  const gw = Array.isArray(gemini?.candidates?.[0]?.groundingMetadata?.groundingChunks)
    ? gemini.candidates[0].groundingMetadata.groundingChunks.length
    : 0;

  // Grok: chat.completions-style usage
  const xi = safe(grok?.usage?.prompt_tokens);
  const xo = safe(grok?.usage?.completion_tokens);
  const xw = 0; // Grok text-only

  return {
    perAgent: {
      openai: { inputTokens: oi, outputTokens: oo, webSources: ow },
      claude: { inputTokens: ci, outputTokens: co, webSources: cw },
      gemini: { inputTokens: gi, outputTokens: go, webSources: gw },
      grok:   { inputTokens: xi, outputTokens: xo, webSources: xw },
    },
    totals: {
      inputTokens:     oi + ci + gi + xi,
      outputTokens:    oo + co + go + xo,
      totalTokens:     oi + oo + ci + co + gi + go + xi + xo,
      totalWebSources: ow + cw + gw + xw,
    },
  };
}

/**
 * Compact audit fingerprint for a prompt block. Returns
 * { length, sha256Prefix } — the first 16 chars of SHA256, enough
 * to verify content without storing full text. Resolves Round C
 * FLAG 2.
 */
function fingerprintBlock(text: string | undefined | null): {
  length: number;
  sha256Prefix: string;
} {
  if (!text || typeof text !== "string" || text.length === 0) {
    return { length: 0, sha256Prefix: "" };
  }
  const hash = crypto.createHash("sha256").update(text).digest("hex");
  return { length: text.length, sha256Prefix: hash.slice(0, 16) };
}

// ─── GET: Fetch ALL stored MegaBot results for this item ─────────────────
export async function GET(
  req: Request,
  { params }: { params: Promise<{ itemId: string }> }
) {
  const { itemId } = await params;
  const user = await authAdapter.getSession();
  if (!user) return new Response("Unauthorized", { status: 401 });

  // Verify ownership
  const item = await prisma.item.findUnique({
    where: { id: itemId },
    select: { userId: true },
  });
  if (!item || item.userId !== user.id) {
    return new Response("Not found", { status: 404 });
  }

  // Fetch all MEGABOT_* event logs for this item
  const logs = await prisma.eventLog.findMany({
    where: {
      itemId,
      eventType: { startsWith: "MEGABOT_" },
    },
    orderBy: { createdAt: "desc" },
  });

  // Group by bot type — keep only the most recent per bot
  const results: Record<string, any> = {};
  for (const log of logs) {
    // MEGABOT_PRICEBOT → pricebot, MEGABOT_ANALYSIS → analysis
    const botKey = log.eventType.replace("MEGABOT_", "").toLowerCase();
    if (!results[botKey]) {
      const payload = safeJson(log.payload);
      if (payload) {
        results[botKey] = {
          botType: botKey,
          agreementScore: payload.agreementScore,
          consensus: payload.consensus,
          summary: payload.summary,
          successCount: payload.successCount,
          failCount: payload.failCount,
          timestamp: payload.timestamp || log.createdAt,
          providers: [
            payload.agents?.openai ? { provider: "openai", ...formatAgentForClient(payload.agents.openai) } : null,
            payload.agents?.claude ? { provider: "claude", ...formatAgentForClient(payload.agents.claude) } : null,
            payload.agents?.gemini ? { provider: "gemini", ...formatAgentForClient(payload.agents.gemini) } : null,
            payload.agents?.grok ? { provider: "grok", ...formatAgentForClient(payload.agents.grok) } : null,
          ].filter(Boolean),
          // Legacy format (MEGABOT_ANALYSIS uses providers[] not agents{})
          ...(payload.providers && !payload.agents ? {
            providers: payload.providers.map((p: any) => ({
              provider: p.provider,
              data: p.result,
              itemName: p.result?.item_name || null,
              confidence: p.result?.confidence || null,
              priceLow: p.result?.estimated_value_low || null,
              priceFair: p.result?.estimated_value_mid || null,
              priceHigh: p.result?.estimated_value_high || null,
              conditionScore: p.result?.condition_score || null,
              category: p.result?.category || null,
              era: p.result?.era || null,
              error: p.error || null,
              durationMs: p.durationMs || null,
              responseTime: p.durationMs || null,
            })),
          } : {}),
        };
      }
    }
  }

  return Response.json({ results });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ itemId: string }> }
) {
  const { itemId } = await params;
  const url = new URL(req.url);
  const botType = url.searchParams.get("bot") || "";

  const user = await authAdapter.getSession();
  if (!user) return new Response("Unauthorized", { status: 401 });

  // ── Tier + Credit Gate ──
  if (!isDemoMode()) {
    if (!canUseBotOnTier(user.tier, "megaBot")) {
      return NextResponse.json(
        { error: "upgrade_required", message: "Upgrade your plan to access MegaBot.", upgradeUrl: "/pricing?upgrade=true" },
        { status: 403 }
      );
    }
    const isRerun = await hasPriorBotRun(user.id, itemId, "MEGABOT");
    const cost = isRerun ? BOT_CREDIT_COSTS.megaBotReRun : BOT_CREDIT_COSTS.megaBotRun;
    const cc = await checkCredits(user.id, cost);
    if (!cc.hasEnough) {
      return NextResponse.json(
        { error: "insufficient_credits", message: "Not enough credits to run MegaBot.", balance: cc.balance, required: cost, buyUrl: "/credits" },
        { status: 402 }
      );
    }
    await deductCredits(user.id, cost, isRerun ? "MegaBot re-run" : "MegaBot run", itemId);
  }

  // ── SPECIALIZED MEGABOT (all bot types including analyzebot) ──
  if (botType && MEGA_PROMPT_MAP[botType]) {
    return handleSpecializedMegaBot(itemId, botType, user.id);
  }

  // ── NO BOT PARAM — default to analyzebot ──
  if (!botType) {
    return handleSpecializedMegaBot(itemId, "analyzebot", user.id);
  }

  return new Response(`Unknown bot type: ${botType}`, { status: 400 });
}

// ─── Specialized MegaBot: sends bot-specific prompt to 4 AIs ─────────────

async function handleSpecializedMegaBot(itemId: string, botType: string, userId: string) {
  const item = await prisma.item.findUnique({
    where: { id: itemId },
    include: {
      photos: { orderBy: { order: "asc" }, take: 6 },
      aiResult: true,
      valuation: true,
      antiqueCheck: true,
    },
  });

  if (!item || item.userId !== userId) {
    return new Response("Not found", { status: 404 });
  }
  if (!item.photos[0]) {
    return new Response("No photo", { status: 400 });
  }

  const ai = safeJson(item.aiResult?.rawJson);
  const v = item.valuation;

  // Fetch cross-bot enrichment context (non-blocking — falls back to undefined)
  const enrichment = await getItemEnrichmentContext(itemId, "megabot").catch(() => undefined);

  // Fetch Amazon/Rainforest data for MegaBot context
  let amazonContext = "";
  try {
    const rainforestLog = await prisma.eventLog.findFirst({
      where: { itemId, eventType: "RAINFOREST_RESULT" },
      orderBy: { createdAt: "desc" },
      select: { payload: true },
    });
    if (rainforestLog?.payload) {
      const amazon = JSON.parse(rainforestLog.payload);
      if (amazon.priceRange) {
        amazonContext = `\nAMAZON MARKET DATA: Retail range $${amazon.priceRange.low}–$${amazon.priceRange.high} (avg $${Math.round(amazon.priceRange.avg)}). ${amazon.resultCount || 0} listings found. Used/secondhand typically 30-70% of retail.`;
      }
    }
  } catch { /* non-critical */ }

  // Build prompt context from item data
  const ctx: PromptContext = {
    itemName: ai?.item_name || item.title || "Unknown item",
    category: ai?.category || "General",
    subcategory: ai?.subcategory || undefined,
    material: ai?.material || undefined,
    era: ai?.era || undefined,
    style: ai?.style || undefined,
    brand: ai?.brand || undefined,
    maker: ai?.maker || undefined,
    markings: ai?.markings || undefined,
    conditionScore: ai?.condition_score || 7,
    conditionLabel: (ai?.condition_score || 7) >= 8 ? "Excellent" : (ai?.condition_score || 7) >= 5 ? "Good" : "Fair",
    conditionDetails: ai?.condition_details || undefined,
    estimatedLow: v ? Math.round(v.low) : (ai?.estimated_value_low || 20),
    estimatedMid: v ? Math.round((v.low + v.high) / 2) : (ai?.estimated_value_mid || 50),
    estimatedHigh: v ? Math.round(v.high) : (ai?.estimated_value_high || 80),
    sellerZip: item.saleZip || "04901",
    isAntique: item.antiqueCheck?.isAntique || false,
    isVehicle: (ai?.category || "").toLowerCase().includes("vehicle"),
    keywords: (ai?.keywords || []).join(", "),
    pricingRationale: v?.rationale || undefined,
    listingPrice: item.listingPrice ? Number(item.listingPrice) : undefined,
    photoCount: item.photos.length,
    vehicleYear: ai?.vehicle_year || undefined,
    vehicleMake: ai?.vehicle_make || undefined,
    vehicleModel: ai?.vehicle_model || undefined,
    vehicleMileage: ai?.vehicle_mileage || undefined,
    auctionLow: item.antiqueCheck?.auctionLow ? Number(item.antiqueCheck.auctionLow) : undefined,
    auctionHigh: item.antiqueCheck?.auctionHigh ? Number(item.antiqueCheck.auctionHigh) : undefined,
    description: item.description || undefined,
    title: item.title || undefined,
    saleMethod: (item as any).saleMethod || "BOTH",
    saleRadiusMi: (item as any).saleRadiusMi || 250,
    marketTier: getMarketInfo(item.saleZip || "04901").tier,
    marketLabel: getMarketInfo(item.saleZip || "04901").label,
    dimensionsEstimate: ai?.dimensions_estimate || undefined,
    weightEstimateLbs: ai?.weight_estimate_lbs || undefined,
    estimatedAgeYears: ai?.estimated_age_years || undefined,
    isCollectible: ai?.is_collectible || undefined,
    bestPlatforms: ai?.best_platforms || undefined,
    recommendedTitle: ai?.recommended_title || undefined,
    shippingDifficulty: ai?.shipping_difficulty || undefined,
    shippingNotes: ai?.shipping_notes || undefined,
    countryOfOrigin: ai?.country_of_origin || undefined,
    priorBotResult: botType === "analyzebot" ? ai : undefined,
    enrichmentContext: (enrichment?.hasEnrichment ? enrichment.contextBlock : "") + amazonContext || undefined,
  };

  const getPrompt = MEGA_PROMPT_MAP[botType];
  if (!getPrompt) {
    return new Response(`Unknown bot type: ${botType}`, { status: 400 });
  }

  // STEP 4.7 — RYAN-APPROVED: MegaBot premium scraper enrichment.
  // Adds back the scrapers we capped from standard bot runs in 4.6.
  // The 7cr MegaBot price covers the additional Apify cost.
  //   • buyerbot → Pinterest, YouTube, Twitter, FB Pages
  //   • collectiblesbot → Courtyard for trading cards
  //   • carbot → handled via the AutoTrader env override below
  let megaEnrichmentBlock = "";
  try {
    const { runMegaBotEnrichment } = await import("@/lib/bots/megabot-enrichment");
    const enrich = await runMegaBotEnrichment(
      botType,
      ctx.itemName || item.title || "",
      ctx.category || "",
    );
    if (enrich.contextBlock) {
      megaEnrichmentBlock = enrich.contextBlock;
      console.log(
        `[megabot/${botType}] premium enrichment fired ${enrich.scrapersFired.length} scrapers (~$${enrich.estimatedApifyCostUsd.toFixed(2)})`,
      );
    }
  } catch (enrichErr) {
    console.warn(`[megabot/${botType}] enrichment failed (non-critical):`, enrichErr);
  }

  // Inject the premium enrichment into the prompt that the 4 AIs see
  const prompt = getPrompt(ctx) + megaEnrichmentBlock;

  // STEP 4.6 — RYAN-APPROVED: AutoTrader/CarsCom/CarGurus subscription
  // scrapers fire ONLY for CarBot MegaBot. The premium 7cr MegaBot price
  // covers the $0.50+ subscription cost. Other bots stay locked out via
  // the global ENABLE_SUBSCRIPTION_SCRAPERS=false env default.
  let _prevSubscriptionFlag: string | undefined;
  if (botType === "carbot") {
    _prevSubscriptionFlag = process.env.ENABLE_SUBSCRIPTION_SCRAPERS;
    process.env.ENABLE_SUBSCRIPTION_SCRAPERS = "true";
  }

  // CMD-RECONBOT-MEGA-C: assemble per-bot opts (currently ReconBot
  // only). When botType !== "reconbot" OR isDemoMode() returns true,
  // reconOpts stays undefined and runSpecializedMegaBot behaves
  // byte-identically to its pre-edit Round 6B implementation. Each
  // future bot gets its own MEGA-C command with its own opts shape.
  // CMD-SKILLS-INFRA-A: hoist skill pack handles to function scope so
  // they're visible to BOTH the opts assembly blocks below AND the
  // unified MEGABOT_RUN write block further down. loadSkillPack is
  // process-cached → zero cost on subsequent calls per warm instance.
  let reconSkillPack: ReturnType<typeof loadSkillPack> | undefined;
  let buyerSkillPack: ReturnType<typeof loadSkillPack> | undefined;

  let reconOpts: RunSpecializedMegaBotOpts | undefined;
  if (botType === "reconbot" && !isDemoMode()) {
    try {
      reconSkillPack = loadSkillPack("reconbot");
      // Refetch user for buildItemSpecContext (handleSpecializedMegaBot
      // only has userId; spec-context reader needs the user.tier field
      // for commission rate fallback).
      const user = await prisma.user.findUnique({ where: { id: userId } });
      const specContext = await buildItemSpecContext(item.id, { item, user });
      const specSummary = summarizeSpecContext(specContext);

      // Note: User schema does not have a `zip` column — sellerZip
      // comes solely from item.saleZip (matches the normal-path
      // route from Round 6B).
      const sellerZip = item.saleZip ?? null;
      const marketIntel = await getMarketIntelligence(
        ctx.itemName ?? item.title ?? "",
        ctx.category ?? "",
        sellerZip ?? undefined,
      ).catch((err) => {
        console.warn("[megabot/reconbot] getMarketIntelligence failed (non-critical):", err);
        return null;
      });

      const marketIntelBlock = marketIntel?.comps?.length
        ? `MARKET INTELLIGENCE (live comps from real eBay Browse API + free scrapers):\n${
            marketIntel.comps.slice(0, 12).map((c: any) =>
              `• ${c.platform}: ${c.item} — $${c.price}`
            ).join("\n")
          }`
        : "";

      const marketIntelMedian = marketIntel?.median ?? null;
      const midPrice = v
        ? Math.round((v.low + v.high) / 2)
        : (ai?.estimated_value_mid ?? null);

      reconOpts = {
        specSummary,
        specPromptBlock: specContext.promptBlock,
        marketIntelBlock,
        marketIntelMedian,
        // RC-7 carry-forward: aggregator does not yet expose Apify
        // spend per call; hardcode 0 until that lands.
        apifyCostUsd: 0,
        enableGrounding: true,
        priorValuationMid: midPrice,
        // CMD-SKILLS-INFRA-A: prepended to enrichedPrompt before
        // any item-specific context inside runSpecializedMegaBot.
        skillPackBlock: reconSkillPack.systemPromptBlock,
      };
    } catch (specErr) {
      console.warn("[megabot/reconbot] specContext/marketIntel assembly failed (non-critical):", specErr);
      reconOpts = undefined; // graceful degradation — fall through to plain MegaBot
    }
  }

  // CMD-BUYERBOT-MEGA-C: BuyerBot opts assembly mirrors the ReconBot
  // pattern from Round C. The two branches stay parallel/independent
  // because botType is single-valued per request — no double work.
  // Failure booleans (buyerSpecContextFailed / buyerMarketIntelFailed)
  // resolve Round C FLAG 4 without forcing any spec-context refactor.
  let buyerOpts: RunSpecializedMegaBotOpts | undefined;
  let buyerSpecContextFailed = false;
  let buyerMarketIntelFailed = false;
  if (botType === "buyerbot" && !isDemoMode()) {
    try {
      buyerSkillPack = loadSkillPack("buyerbot");
      const user = await prisma.user.findUnique({ where: { id: userId } });
      const specContext = await buildItemSpecContext(item.id, { item, user });
      const specSummary = summarizeSpecContext(specContext);

      let marketIntel: any = null;
      try {
        marketIntel = await getMarketIntelligence(
          ctx.itemName ?? item.title ?? "",
          ctx.category ?? "",
          item.saleZip ?? undefined,
        );
      } catch (err) {
        buyerMarketIntelFailed = true;
        console.warn("[megabot/buyerbot] getMarketIntelligence failed:", err);
      }

      const marketIntelBlock = marketIntel?.comps?.length
        ? `MARKET INTELLIGENCE (live comps from real eBay Browse API + free scrapers — use these to identify real buyer demand pockets):\n${
            marketIntel.comps.slice(0, 12).map((c: any) =>
              `• ${c.platform}: ${c.item} — $${c.price}`
            ).join("\n")
          }`
        : "";

      const marketIntelMedian = marketIntel?.median ?? null;
      const midPrice = v
        ? Math.round((v.low + v.high) / 2)
        : (ai?.estimated_value_mid ?? null);

      buyerOpts = {
        specSummary,
        specPromptBlock: specContext.promptBlock,
        marketIntelBlock,
        marketIntelMedian,
        // FLAG 8 (RC-7) carry-forward: aggregator does not yet
        // expose Apify spend per call; hardcode 0. Multi-file
        // change to all 49 scraper adapters — out of scope this
        // round, deferred to a dedicated future round.
        apifyCostUsd: 0,
        enableGrounding: true,
        priorValuationMid: midPrice,
        // CMD-SKILLS-INFRA-A: prepended to enrichedPrompt before
        // any item-specific context inside runSpecializedMegaBot.
        skillPackBlock: buyerSkillPack.systemPromptBlock,
      };
    } catch (specErr) {
      buyerSpecContextFailed = true;
      console.warn("[megabot/buyerbot] specContext assembly failed (non-critical):", specErr);
      buyerOpts = undefined; // graceful degradation — fall through to plain MegaBot
    }
  }

  let result;
  try {
    const photoPaths = item.photos.slice(0, 6).map((p: any) => p.filePath);
    // CMD-BUYERBOT-MEGA-C: dispatch reconOpts vs buyerOpts vs undefined
    // based on botType. Other bots stay on the undefined path until
    // their respective MEGA-C rounds.
    const activeOpts =
      botType === "reconbot" ? reconOpts :
      botType === "buyerbot" ? buyerOpts :
      undefined;
    result = await runSpecializedMegaBot(botType, prompt, photoPaths[0], itemId, photoPaths, activeOpts);
  } catch (e: any) {
    console.error(`[megabot/${botType}]`, e);
    return new Response(`MegaBot ${botType} failed: ${e.message}`, { status: 422 });
  } finally {
    // Restore the subscription flag immediately after the call
    if (botType === "carbot") {
      if (_prevSubscriptionFlag === undefined) {
        delete process.env.ENABLE_SUBSCRIPTION_SCRAPERS;
      } else {
        process.env.ENABLE_SUBSCRIPTION_SCRAPERS = _prevSubscriptionFlag;
      }
    }
  }

  // ── ALL-AGENT-FAILURE FALLBACK ──
  // If every agent returned an error (successCount === 0), try to return cached result or error gracefully
  if (result.successCount === 0) {
    console.warn(`[megabot/${botType}] All 4 agents failed for item ${itemId}`);

    // Refund credits since no work was done
    if (!isDemoMode()) {
      const isRerun = await hasPriorBotRun(userId, itemId, "MEGABOT");
      const cost = isRerun ? BOT_CREDIT_COSTS.megaBotReRun : BOT_CREDIT_COSTS.megaBotRun;
      try {
        await refundCredits(userId, cost, `MegaBot refund — all agents failed`, itemId);
        console.log(`[megabot/${botType}] Refunded ${cost} credits to user ${userId}`);
      } catch (refundErr) {
        console.error(`[megabot/${botType}] Credit refund failed:`, refundErr);
      }
    }

    // Check for cached prior MegaBot result in EventLog
    const cachedEventType = `MEGABOT_${botType.toUpperCase()}`;
    const cachedLog = await prisma.eventLog.findFirst({
      where: { itemId, eventType: cachedEventType },
      orderBy: { createdAt: "desc" },
      select: { payload: true, createdAt: true },
    });

    if (cachedLog?.payload) {
      const cachedPayload = safeJson(cachedLog.payload);
      if (cachedPayload && cachedPayload.successCount > 0) {
        const cacheAgeMs = Date.now() - new Date(cachedLog.createdAt).getTime();
        const cacheAgeHours = Math.round(cacheAgeMs / (1000 * 60 * 60));
        const cacheAgeLabel = cacheAgeHours < 1 ? "less than 1 hour" : cacheAgeHours < 24 ? `${cacheAgeHours} hours` : `${Math.round(cacheAgeHours / 24)} days`;

        console.log(`[megabot/${botType}] Returning cached result (age: ${cacheAgeLabel})`);

        const cachedProviders = [
          cachedPayload.agents?.openai ? { provider: "openai", ...formatAgentForClient(cachedPayload.agents.openai) } : null,
          cachedPayload.agents?.claude ? { provider: "claude", ...formatAgentForClient(cachedPayload.agents.claude) } : null,
          cachedPayload.agents?.gemini ? { provider: "gemini", ...formatAgentForClient(cachedPayload.agents.gemini) } : null,
          cachedPayload.agents?.grok ? { provider: "grok", ...formatAgentForClient(cachedPayload.agents.grok) } : null,
        ].filter(Boolean);

        return Response.json({
          ok: true,
          botType,
          usedCache: true,
          cacheAge: cacheAgeLabel,
          agreementScore: cachedPayload.agreementScore,
          consensus: cachedPayload.consensus,
          summary: cachedPayload.summary,
          successCount: cachedPayload.successCount,
          failCount: cachedPayload.failCount,
          providers: cachedProviders,
          webSources: [],
        });
      }
    }

    // No cache available — return structured error
    const providerErrors = [
      result.agents.openai?.error ? { provider: "openai", error: result.agents.openai.error } : null,
      result.agents.claude?.error ? { provider: "claude", error: result.agents.claude.error } : null,
      result.agents.gemini?.error ? { provider: "gemini", error: result.agents.gemini.error } : null,
      result.agents.grok?.error ? { provider: "grok", error: result.agents.grok.error } : null,
    ].filter(Boolean);

    return Response.json(
      {
        error: "all_agents_failed",
        message: "All AI providers are temporarily unavailable. Please try again in a few minutes.",
        providers: providerErrors,
        creditsRefunded: true,
      },
      { status: 503 }
    );
  }

  // Store with bot-specific event type: MEGABOT_PRICEBOT, MEGABOT_BUYERBOT, etc.
  const eventType = `MEGABOT_${botType.toUpperCase()}`;
  await prisma.eventLog.create({
    data: {
      itemId,
      eventType,
      payload: JSON.stringify({
        botType: result.botType,
        agents: {
          openai: result.agents.openai ? { data: result.agents.openai.data, responseTime: result.agents.openai.responseTime, error: result.agents.openai.error } : null,
          claude: result.agents.claude ? { data: result.agents.claude.data, responseTime: result.agents.claude.responseTime, error: result.agents.claude.error } : null,
          gemini: result.agents.gemini ? { data: result.agents.gemini.data, responseTime: result.agents.gemini.responseTime, error: result.agents.gemini.error } : null,
          grok: result.agents.grok ? { data: result.agents.grok.data, responseTime: result.agents.grok.responseTime, error: result.agents.grok.error } : null,
        },
        consensus: result.consensus,
        agreementScore: result.agreementScore,
        summary: result.summary,
        successCount: result.successCount,
        failCount: result.failCount,
        timestamp: result.timestamp,
      }),
    },
  });

  // CMD-BUYERBOT-MEGA-C: unified MEGABOT_RUN telemetry for both
  // ReconBot (Round C) and BuyerBot (this round). Same enriched
  // payload shape — analytics layer sees identical schema across
  // both bots from day one (retroactive Round C flag fix applied
  // to ReconBot in the same pass). Other botTypes will get their
  // own MEGABOT_RUN equivalents in their respective MEGA-C rounds.
  // Wrapped in try/catch so a logging failure cannot block the
  // user-facing response.
  //
  // Round C carry-forward flag fixes embedded in this payload:
  //   FLAG 1: specSummary persisted
  //   FLAG 2: specPromptBlockFingerprint + marketIntelBlockFingerprint
  //   FLAG 3: perAgentTokens (input/output per provider)
  //   FLAG 4: specContextFailed + marketIntelFailed booleans
  //   FLAG 5: specSummary now typed as SpecContextSummary (Part B)
  //   FLAG 6: marketIntelMedian persisted
  //   FLAG 7: perAgentWebSources + totalWebSourceCount
  //   FLAG 9: totalTokens aggregate
  //   FLAG 8 (DEFERRED): apifyCostUsdReal placeholder (always 0)
  if (botType === "reconbot" || botType === "buyerbot") {
    try {
      const telemetry = extractAgentTelemetry(result);
      const specBlockFp = fingerprintBlock(
        botType === "reconbot" ? reconOpts?.specPromptBlock : buyerOpts?.specPromptBlock
      );
      const marketBlockFp = fingerprintBlock(
        botType === "reconbot" ? reconOpts?.marketIntelBlock : buyerOpts?.marketIntelBlock
      );
      const opts = botType === "reconbot" ? reconOpts : buyerOpts;
      const specContextFailed =
        botType === "reconbot" ? false : buyerSpecContextFailed;
      const marketIntelFailed =
        botType === "reconbot" ? false : buyerMarketIntelFailed;

      await prisma.eventLog.create({
        data: {
          itemId,
          eventType: "MEGABOT_RUN",
          payload: JSON.stringify({
            // Existing Round C fields (unchanged)
            botType,
            lastScan: result.lastScan,
            mergedStrategy: result.mergedStrategy,
            apifyCostUsd: result.apifyCostUsd,
            groundingUsed: result.groundingUsed,
            geminiWebSourceCount: result.geminiWebSourceCount,
            successCount: result.successCount,
            failCount: result.failCount,
            agreementScore: result.agreementScore,

            // FLAG 1 fix: spec summary persisted (typed as
            // SpecContextSummary post-Part-B)
            specSummary: opts?.specSummary ?? null,

            // FLAG 2 fix: prompt-block fingerprints (compact)
            specPromptBlockFingerprint: specBlockFp,
            marketIntelBlockFingerprint: marketBlockFp,

            // FLAG 3 + 9 fix: per-agent + total token counts
            // (extracted from raw at route layer, no agent
            // body changes)
            perAgentTokens: telemetry.perAgent,
            totalTokens: telemetry.totals,

            // FLAG 4 fix: failure rate booleans
            specContextFailed,
            marketIntelFailed,

            // FLAG 6 fix: median surfaced for analytics
            marketIntelMedian: opts?.marketIntelMedian ?? null,

            // FLAG 7 fix: per-agent web source counts
            perAgentWebSources: {
              openai: telemetry.perAgent.openai.webSources,
              claude: telemetry.perAgent.claude.webSources,
              gemini: telemetry.perAgent.gemini.webSources,
              grok:   telemetry.perAgent.grok.webSources,
            },
            totalWebSourceCount: telemetry.totals.totalWebSources,

            // FLAG 8 (RC-7): still deferred. Field present
            // with value 0 for forward-compat schema.
            apifyCostUsdReal: 0,

            // CMD-SKILLS-INFRA-A: skill pack telemetry. A/B testing
            // of skill pack versions is now possible from day one.
            skillPackVersion: (
              botType === "reconbot" ? reconSkillPack?.version :
              botType === "buyerbot" ? buyerSkillPack?.version :
              "v0"
            ),
            skillPackCount: (
              botType === "reconbot" ? reconSkillPack?.skillNames.length ?? 0 :
              botType === "buyerbot" ? buyerSkillPack?.skillNames.length ?? 0 :
              0
            ),
            skillPackChars: (
              botType === "reconbot" ? reconSkillPack?.totalChars ?? 0 :
              botType === "buyerbot" ? buyerSkillPack?.totalChars ?? 0 :
              0
            ),
          }),
        },
      });
    } catch (logErr) {
      console.warn(`[megabot/${botType}] MEGABOT_RUN log write failed (non-critical):`, logErr);
    }
  }

  // Mark megabotUsed on item
  await prisma.item.update({
    where: { id: itemId },
    data: { megabotUsed: true },
  });

  // ── CONSENSUS CASCADE: Update AiResult if MegaBot consensus is stronger ──
  if (botType === "analyzebot" && result.consensus && result.agreementScore >= 70) {
    try {
      const consensus = result.consensus;
      const currentAi = ai || {};
      const updates: Record<string, any> = {};

      // CATEGORY GUARD: Never let MegaBot overwrite an AnalyzeBot-corrected category
      if (consensus.category && consensus.category !== currentAi.category) {
        console.log(`[MegaBot Cascade] Category guard: keeping AnalyzeBot "${currentAi.category}" (MegaBot wanted "${consensus.category}")`);
      }

      // CONFIDENCE GUARD: Don't downgrade AnalyzeBot confidence
      if (consensus.confidence && currentAi.confidence && consensus.confidence < currentAi.confidence) {
        console.log(`[MegaBot Cascade] Confidence guard: keeping AnalyzeBot ${currentAi.confidence} (MegaBot was ${consensus.confidence})`);
      }

      // Cascade antique detection if MegaBot confirms
      if (consensus.is_antique === true && currentAi.is_antique !== true) {
        updates.is_antique = true;
        console.log(`[MegaBot Cascade] Antique upgraded: Tier 1 said ${currentAi.is_antique}, MegaBot consensus says true (${result.agreementScore}% agreement)`);
      }

      // Cascade collectible detection
      if (consensus.is_collectible === true && !currentAi.is_collectible) {
        updates.is_collectible = true;
      }

      // Cascade deep knowledge fields (additive — never overwrite with less)
      const deepFields = ["product_history", "maker_history", "construction_analysis", "special_features", "tips_and_facts", "common_issues", "care_instructions", "similar_items", "collector_info"];
      for (const field of deepFields) {
        if (consensus[field] && (!currentAi[field] || String(consensus[field]).length > String(currentAi[field] || "").length)) {
          updates[field] = consensus[field];
        }
      }

      if (Object.keys(updates).length > 0) {
        const updatedJson = { ...currentAi, ...updates, _megabotEnhanced: true, _megabotAgreement: result.agreementScore };
        await prisma.aiResult.update({
          where: { itemId },
          data: { rawJson: JSON.stringify(updatedJson) },
        });
        console.log(`[MegaBot Cascade] ${Object.keys(updates).length} fields cascaded to AiResult (${result.agreementScore}% agreement)`);

        await prisma.eventLog.create({
          data: {
            itemId,
            eventType: "MEGABOT_CASCADE",
            payload: JSON.stringify({
              fieldsUpdated: Object.keys(updates),
              agreementScore: result.agreementScore,
              botType,
            }),
          },
        }).catch(() => {});
      }
    } catch (e) {
      console.error("[MegaBot Cascade] Error:", (e as Error).message);
    }
  }

  // Post-run alignment check: compare MegaBot consensus to PriceBot estimate
  if (botType === "pricebot" || botType === "pricing") {
    try {
      const priceBotLog = await prisma.eventLog.findFirst({
        where: { itemId, eventType: "PRICEBOT_RESULT" },
        orderBy: { createdAt: "desc" },
        select: { payload: true },
      });
      if (priceBotLog?.payload) {
        const pbData = JSON.parse(priceBotLog.payload);
        const pbMid = pbData?.revised_estimate?.mid || pbData?.price_overview?.mid || ((pbData?.revised_estimate?.low || 0) + (pbData?.revised_estimate?.high || 0)) / 2;
        const mbMid = result.consensus?.revised_mid || result.consensus?.estimated_value_mid || 0;
        if (pbMid > 0 && mbMid > 0) {
          const deviationPct = Math.round(Math.abs(mbMid - pbMid) / pbMid * 100);
          console.log(`[MegaBot Alignment] PriceBot: $${Math.round(pbMid)} vs MegaBot: $${Math.round(mbMid)} — ${deviationPct}% deviation${deviationPct > 20 ? " ⚠️ SIGNIFICANT" : " ✓"}`);
          if (deviationPct > 15) {
            await prisma.eventLog.create({
              data: { itemId, eventType: "MEGABOT_ALIGNMENT_FLAG", payload: JSON.stringify({ priceBotMid: Math.round(pbMid), megaBotMid: Math.round(mbMid), deviationPct, botType, flagged: deviationPct > 20 }) },
            }).catch(() => {});
          }
        }
      }
    } catch { /* non-critical alignment check */ }
  }

  // TEMPORARY DEBUG: log what formatAgentForClient produces for each agent
  const clientProviders = [
    result.agents.openai ? { provider: "openai", ...formatAgentForClient(result.agents.openai) } : null,
    result.agents.claude ? { provider: "claude", ...formatAgentForClient(result.agents.claude) } : null,
    result.agents.gemini ? { provider: "gemini", ...formatAgentForClient(result.agents.gemini) } : null,
    result.agents.grok ? { provider: "grok", ...formatAgentForClient(result.agents.grok) } : null,
  ].filter(Boolean);

  for (const cp of clientProviders as any[]) {
    console.log(`[MEGABOT DEBUG][ROUTE][${cp.provider}] itemName=${cp.itemName} priceLow=${cp.priceLow} priceHigh=${cp.priceHigh} condScore=${cp.conditionScore} confidence=${cp.confidence} hasData=${!!cp.data} dataTopKeys=${cp.data ? Object.keys(cp.data).slice(0, 8).join(",") : "null"}`);
  }

  // Collect all web sources from agents
  const allWebSources: Array<{ url: string; title: string; provider: string }> = [];
  for (const cp of clientProviders as any[]) {
    if (cp.webSources?.length) {
      for (const src of cp.webSources) {
        allWebSources.push({ ...src, provider: cp.provider });
      }
    }
  }

  // Return full result to client
  return Response.json({
    ok: true,
    botType,
    agreementScore: result.agreementScore,
    consensus: result.consensus,
    summary: result.summary,
    successCount: result.successCount,
    failCount: result.failCount,
    providers: clientProviders,
    webSources: allWebSources,
  });
}

/** Lowercase all object keys (2 levels deep) to handle UPPERCASE responses from OpenAI/Gemini */
function normalizeKeys(obj: any): any {
  if (!obj || typeof obj !== "object" || Array.isArray(obj)) return obj;
  const out: any = {};
  for (const key of Object.keys(obj)) {
    const lk = key.toLowerCase();
    const val = obj[key];
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

function formatAgentForClient(agent: { data: any; responseTime: number; error?: string }) {
  const d = normalizeKeys(agent.data || {});
  // Type-safe sub-object resolution: only use if it's an actual object
  const obj = (v: any) => (v && typeof v === "object" && !Array.isArray(v)) ? v : null;
  const id = obj(d.identification) || d;
  const cond = obj(d.condition) || obj(d.condition_assessment) || d;
  const price = obj(d.pricing) || obj(d.price_validation) || obj(d.valuation) || d;

  return {
    data: agent.data,
    responseTime: agent.responseTime,
    error: agent.error || null,
    webSources: (agent as any).webSources || [],
    // Extract common fields — check flat, nested, and camelCase variants
    itemName: id.item_name || id.itemName || id.item_type || id.name || d.item_name || d.itemName || d.name || null,
    confidence: (typeof d.confidence === "number" ? d.confidence : null) || d.pricing_confidence || price.pricing_confidence || price.overall_confidence || null,
    priceLow: (() => {
      const low = price.revised_low || price.estimated_value_low || d.estimated_value_low || d.price_low || d.priceLow || null;
      return typeof low === "number" && low > 0 ? Math.round(low) : low;
    })(),
    priceFair: price.revised_mid || price.estimated_value_mid || d.estimated_value_mid || d.price_mid || d.priceMid || null,
    priceHigh: (() => {
      const low = price.revised_low || price.estimated_value_low || d.estimated_value_low || d.price_low || d.priceLow || null;
      let high = price.revised_high || price.estimated_value_high || d.estimated_value_high || d.price_high || d.priceHigh || null;
      // Enforce 2x max range rule — prevents wild AI ranges like $8–$2200
      if (typeof low === "number" && typeof high === "number" && low > 0 && high > low * 2.5) {
        high = Math.round(low * 2.5);
      }
      return typeof high === "number" && high > 0 ? Math.round(high) : high;
    })(),
    conditionScore: cond.overall_score || cond.condition_score || d.condition_score || d.conditionScore || cond.overall_grade || null,
    category: id.category || d.category || null,
    era: id.era || d.era || null,
    executiveSummary: d.executive_summary || d.summary || d.notes || price.pricing_rationale || d.pricing_rationale || null,
    durationMs: agent.responseTime,
  };
}

