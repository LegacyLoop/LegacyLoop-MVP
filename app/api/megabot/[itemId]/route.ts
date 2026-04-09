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
import { loadSkillPack, loadSkillFolder } from "@/lib/bots/skill-loader";

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
  // CMD-LISTBOT-MEGA-C: hoist listSkillPack to function scope so
  // it's visible at the MEGABOT_RUN write block (mirrors recon/buyer).
  let listSkillPack: ReturnType<typeof loadSkillPack> | undefined;
  // CMD-ANTIQUEBOT-CORE-A: hoist antiquebotSkillPack to function
  // scope so it's visible at the MEGABOT_RUN write block (mirrors
  // recon/buyer/list pattern).
  let antiquebotSkillPack: ReturnType<typeof loadSkillPack> | undefined;
  // CMD-COLLECTIBLESBOT-CORE-A: hoist collectiblesbotSkillPack to
  // function scope for MEGABOT_RUN telemetry parity.
  let collectiblesbotSkillPack: ReturnType<typeof loadSkillPack> | undefined;
  // CMD-CARBOT-CORE-A: hoist carbotSkillPack to function scope.
  let carbotSkillPack: ReturnType<typeof loadSkillPack> | undefined;
  // CMD-PRICEBOT-CORE-A: hoist pricebotSkillPack to function scope.
  let pricebotSkillPack: ReturnType<typeof loadSkillPack> | undefined;
  // CMD-PHOTOBOT-CORE-A: hoist photobotSkillPack to function scope.
  let photobotSkillPack: ReturnType<typeof loadSkillPack> | undefined;
  // CMD-VIDEOBOT-CORE-A: hoist videobotSkillPack to function scope.
  let videobotSkillPack: ReturnType<typeof loadSkillPack> | undefined;
  // CMD-ANALYZEBOT-CORE-A: hoist analyzebotSkillPack to function scope.
  let analyzebotSkillPack: ReturnType<typeof loadSkillPack> | undefined;

  // CMD-MEGABOT-SHARED-SKILLS: load MegaBot-only shared packs ONCE.
  // These packs teach the 4-AI consensus how to argue, disagree, and
  // amplify confidence. Loaded via loadSkillFolder (reads ONLY the
  // named folder, does NOT prepend _shared/ packs — avoids duplication
  // since per-bot packs already include _shared/). Process-cached on
  // first call. The block is prepended to EVERY bot's skillPackBlock
  // below so all four agents read the consensus rules first.
  const megaBotSharedPack = isDemoMode() ? null : loadSkillFolder("_shared_megabot");
  const megaBotSharedBlock = megaBotSharedPack?.systemPromptBlock
    ? megaBotSharedPack.systemPromptBlock + "\n\n"
    : "";

  // CMD-MEGABOT-BOT-PACK-WIRING: load per-bot MegaBot specialty packs.
  // Each bot's megabot/ subfolder contains 5 M01-M05 packs that teach
  // the 4-AI consensus team bot-specific specialist depth. Loaded via
  // loadSkillFolder (reads single folder, no _shared/ prefix, process-
  // cached). Only loads the active botType's megabot/ packs — the other
  // 5 bots' megabot/ folders are not touched. Skipped in demo mode.
  const botMegaPack = isDemoMode() ? null : loadSkillFolder(`${botType}/megabot`);
  const botMegaBlock = botMegaPack?.systemPromptBlock
    ? botMegaPack.systemPromptBlock + "\n\n"
    : "";

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
      // CMD-MEGABOT-SCRAPER-PARITY-FIX: pass isMegaBot=true (5th arg) to
      // unlock the paid Apify scraper pool for ReconBot MegaBot scans —
      // restores parity with the antiquebot branch from CMD-ANTIQUEBOT-CORE-A.
      // Normal-path ReconBot scans remain at $0.00 Apify cost.
      const marketIntel = await getMarketIntelligence(
        ctx.itemName ?? item.title ?? "",
        ctx.category ?? "",
        sellerZip ?? undefined,
        undefined, // phase1Only — keep default
        true,      // isMegaBot — unlock paid scraper pool
        "reconbot", // CMD-SCRAPER-WIRING-C2
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
        // CMD-MEGABOT-BOT-PACK-WIRING: consensus + bot mega + normal
        skillPackBlock: megaBotSharedBlock + botMegaBlock + reconSkillPack.systemPromptBlock,
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
        // CMD-MEGABOT-SCRAPER-PARITY-FIX: pass isMegaBot=true (5th arg) to
        // unlock the paid Apify scraper pool for BuyerBot MegaBot scans —
        // restores parity with the antiquebot branch.
        marketIntel = await getMarketIntelligence(
          ctx.itemName ?? item.title ?? "",
          ctx.category ?? "",
          item.saleZip ?? undefined,
          undefined, // phase1Only — keep default
          true,      // isMegaBot — unlock paid scraper pool
          "buyerbot", // CMD-SCRAPER-WIRING-C2
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
        // CMD-MEGABOT-BOT-PACK-WIRING: consensus + bot mega + normal
        skillPackBlock: megaBotSharedBlock + botMegaBlock + buyerSkillPack.systemPromptBlock,
      };
    } catch (specErr) {
      buyerSpecContextFailed = true;
      console.warn("[megabot/buyerbot] specContext assembly failed (non-critical):", specErr);
      buyerOpts = undefined; // graceful degradation — fall through to plain MegaBot
    }
  }

  // CMD-ANTIQUEBOT-CORE-A: AntiqueBot opts assembly mirrors the
  // ReconBot/BuyerBot/ListBot pattern. Independent branch — botType
  // is single-valued per request so the four blocks never overlap.
  // Failure booleans (antiqueSpecContextFailed /
  // antiqueMarketIntelFailed) surface in MEGABOT_RUN telemetry for
  // ops visibility.
  //
  // CRITICAL DIFFERENCE FROM RECON/BUYER/LIST: this branch passes
  // isMegaBot=true to getMarketIntelligence (the 5th arg added in
  // this round). That single flag enables the paid Apify scraper
  // pool (Sothebys, AmazonApify, EbayApify, etc.) for AntiqueBot
  // MegaBot scans only — normal-path AntiqueBot scans guarantee
  // $0.00 Apify cost via the same gating.
  let antiqueOpts: RunSpecializedMegaBotOpts | undefined;
  let antiqueSpecContextFailed = false;
  let antiqueMarketIntelFailed = false;
  if (botType === "antiquebot" && !isDemoMode()) {
    try {
      antiquebotSkillPack = loadSkillPack("antiquebot");
      const user = await prisma.user.findUnique({ where: { id: userId } });
      const specContext = await buildItemSpecContext(item.id, { item, user });
      const specSummary = summarizeSpecContext(specContext);

      let marketIntel: any = null;
      try {
        // CMD-ANTIQUEBOT-CORE-A: pass isMegaBot=true (5th arg) to
        // unlock the paid Apify scraper pool for this MegaBot scan.
        // The 4th arg phase1Only stays undefined (default false).
        marketIntel = await getMarketIntelligence(
          ctx.itemName ?? item.title ?? "",
          ctx.category ?? "",
          item.saleZip ?? undefined,
          undefined, // phase1Only — keep default
          true,      // isMegaBot — enables paid scraper pool
          "antiquebot", // CMD-SCRAPER-WIRING-C2
        );
      } catch (err) {
        antiqueMarketIntelFailed = true;
        console.warn("[megabot/antiquebot] getMarketIntelligence failed:", err);
      }

      const marketIntelBlock = marketIntel?.comps?.length
        ? `MARKET INTELLIGENCE (live antique market comps including auction houses — use these to anchor authentication, valuation, and selling strategy):\n${marketIntel.comps
            .slice(0, 12)
            .map(
              (c: any) =>
                `• ${c.platform}: ${c.item} — $${c.price}${c.condition ? ` (${c.condition})` : ""}`,
            )
            .join("\n")}`
        : "";

      const marketIntelMedian = marketIntel?.median ?? null;
      const midPrice = v
        ? Math.round((v.low + v.high) / 2)
        : (ai?.estimated_value_mid ?? null);

      antiqueOpts = {
        specSummary,
        specPromptBlock: specContext.promptBlock,
        marketIntelBlock,
        marketIntelMedian,
        // FLAG 8 (RC-7) carry-forward: aggregator does not yet
        // expose Apify spend per call; hardcode 0.
        apifyCostUsd: 0,
        enableGrounding: true,
        priorValuationMid: midPrice,
        // CMD-SKILLS-INFRA-A: prepended to enrichedPrompt before
        // any item-specific context inside runSpecializedMegaBot.
        // CMD-MEGABOT-BOT-PACK-WIRING: consensus + bot mega + normal
        skillPackBlock: megaBotSharedBlock + botMegaBlock + antiquebotSkillPack.systemPromptBlock,
      };
    } catch (specErr) {
      antiqueSpecContextFailed = true;
      console.warn("[megabot/antiquebot] specContext assembly failed (non-critical):", specErr);
      antiqueOpts = undefined; // graceful degradation
    }
  }

  // CMD-COLLECTIBLESBOT-CORE-A: CollectiblesBot opts assembly mirrors
  // the AntiqueBot pattern from Step 7 Round A. Independent branch —
  // botType is single-valued per request so branches never overlap.
  // Failure booleans (collectiblesSpecContextFailed /
  // collectiblesMarketIntelFailed) surface in MEGABOT_RUN telemetry
  // for ops visibility.
  //
  // CRITICAL: this branch passes isMegaBot=true to
  // getMarketIntelligence (5th arg) — unlocks the paid Apify scraper
  // pool (Chrono24, StockX, Courtyard, TCGPlayer, Amazon) for
  // CollectiblesBot MegaBot scans only. Normal-path scans guarantee
  // $0.00 Apify cost via the same gating.
  let collectiblesOpts: RunSpecializedMegaBotOpts | undefined;
  let collectiblesSpecContextFailed = false;
  let collectiblesMarketIntelFailed = false;
  if (botType === "collectiblesbot" && !isDemoMode()) {
    try {
      collectiblesbotSkillPack = loadSkillPack("collectiblesbot");
      const user = await prisma.user.findUnique({ where: { id: userId } });
      const specContext = await buildItemSpecContext(item.id, { item, user });
      const specSummary = summarizeSpecContext(specContext);

      let marketIntel: any = null;
      try {
        // CMD-COLLECTIBLESBOT-CORE-A: isMegaBot=true unlocks Tier 3
        // paid scraper pool for this MegaBot scan only.
        marketIntel = await getMarketIntelligence(
          ctx.itemName ?? item.title ?? "",
          ctx.category ?? "",
          item.saleZip ?? undefined,
          undefined, // phase1Only — keep default
          true,      // isMegaBot — enables paid scraper pool
          "collectiblesbot", // CMD-SCRAPER-WIRING-C2
        );
      } catch (err) {
        collectiblesMarketIntelFailed = true;
        console.warn("[megabot/collectiblesbot] getMarketIntelligence failed:", err);
      }

      const marketIntelBlock = marketIntel?.comps?.length
        ? `MARKET INTELLIGENCE (live collectibles market comps from specialty marketplaces — use these to anchor grading confidence, valuation, and platform routing):\n${marketIntel.comps
            .slice(0, 12)
            .map(
              (c: any) =>
                `• ${c.platform}: ${c.item} — $${c.price}${c.condition ? ` (${c.condition})` : ""}`,
            )
            .join("\n")}`
        : "";

      const marketIntelMedian = marketIntel?.median ?? null;
      const midPrice = v
        ? Math.round((v.low + v.high) / 2)
        : (ai?.estimated_value_mid ?? null);

      collectiblesOpts = {
        specSummary,
        specPromptBlock: specContext.promptBlock,
        marketIntelBlock,
        marketIntelMedian,
        // FLAG 8 (RC-7) carry-forward: aggregator does not yet
        // expose Apify spend per call; hardcode 0.
        apifyCostUsd: 0,
        enableGrounding: true,
        priorValuationMid: midPrice,
        // CMD-SKILLS-INFRA-A: prepended to enrichedPrompt before
        // any item-specific context inside runSpecializedMegaBot.
        // CMD-MEGABOT-BOT-PACK-WIRING: consensus + bot mega + normal
        skillPackBlock: megaBotSharedBlock + botMegaBlock + collectiblesbotSkillPack.systemPromptBlock,
      };
    } catch (specErr) {
      collectiblesSpecContextFailed = true;
      console.warn("[megabot/collectiblesbot] specContext assembly failed (non-critical):", specErr);
      collectiblesOpts = undefined; // graceful degradation
    }
  }

  // CMD-CARBOT-CORE-A: CarBot opts assembly mirrors the ReconBot
  // grounding pattern — Gemini primary with enableGrounding=true,
  // plus spec context + market intel + skill pack injection.
  // Independent branch — botType is single-valued per request so
  // branches never overlap. Failure booleans (carSpecContextFailed /
  // carMarketIntelFailed) surface in MEGABOT_RUN telemetry.
  //
  // The ENABLE_SUBSCRIPTION_SCRAPERS env shim at lines 365-368
  // (setup) and 763-770 (teardown) is PRESERVED unchanged — it
  // runs BEFORE this block and unlocks subscription-gated
  // Autotrader/Cargurus for CarBot MegaBot scans only. This
  // assembly runs WHILE the shim is active, so getMarketIntelligence
  // sees the unlocked scraper pool.
  //
  // CRITICAL: isMegaBot=true passed to getMarketIntelligence to
  // unlock the paid Tier 3 scraper pool (BringATrailer, etc.)
  // for this MegaBot scan only. Normal-path CarBot scans keep
  // Apify cost bounded via the same gating.
  let carbotOpts: RunSpecializedMegaBotOpts | undefined;
  let carSpecContextFailed = false;
  let carMarketIntelFailed = false;
  if (botType === "carbot" && !isDemoMode()) {
    try {
      carbotSkillPack = loadSkillPack("carbot");
      const user = await prisma.user.findUnique({ where: { id: userId } });
      const specContext = await buildItemSpecContext(item.id, { item, user });
      const specSummary = summarizeSpecContext(specContext);

      let marketIntel: any = null;
      try {
        // CMD-CARBOT-CORE-A: isMegaBot=true unlocks Tier 3 paid
        // scraper pool (BringATrailer + Autotrader/Cargurus via
        // the env shim above). Subscription scrapers fire ONLY
        // on CarBot MegaBot scans.
        marketIntel = await getMarketIntelligence(
          ctx.itemName ?? item.title ?? "",
          "vehicle",
          item.saleZip ?? undefined,
          undefined, // phase1Only — keep default
          true,      // isMegaBot — enables paid scraper pool
          "carbot",  // CMD-SCRAPER-WIRING-C2
        );
      } catch (err) {
        carMarketIntelFailed = true;
        console.warn("[megabot/carbot] getMarketIntelligence failed:", err);
      }

      const marketIntelBlock = marketIntel?.comps?.length
        ? `MARKET INTELLIGENCE (live vehicle market comps from eBay Motors, Cars.com, Craigslist, Bring a Trailer — use these to anchor valuation, condition assessment, and selling strategy):\n${marketIntel.comps
            .slice(0, 12)
            .map(
              (c: any) =>
                `• ${c.platform}: ${c.item} — $${c.price}${c.location ? ` (${c.location})` : ""}`,
            )
            .join("\n")}`
        : "";

      const marketIntelMedian = marketIntel?.median ?? null;
      const midPrice = v
        ? Math.round((v.low + v.high) / 2)
        : (ai?.estimated_value_mid ?? null);

      carbotOpts = {
        specSummary,
        specPromptBlock: specContext.promptBlock,
        marketIntelBlock,
        marketIntelMedian,
        // FLAG 8 (RC-7) carry-forward: aggregator does not yet
        // expose Apify spend per call; hardcode 0.
        apifyCostUsd: 0,
        // CarBot MUST enable grounding — vehicle market data is
        // highly real-time (Bring a Trailer active auctions,
        // recall notices, Cars.com listings).
        enableGrounding: true,
        priorValuationMid: midPrice,
        // CMD-SKILLS-INFRA-A: prepended to enrichedPrompt before
        // any item-specific context inside runSpecializedMegaBot.
        // CMD-MEGABOT-BOT-PACK-WIRING: consensus + bot mega + normal
        skillPackBlock: megaBotSharedBlock + botMegaBlock + carbotSkillPack.systemPromptBlock,
      };
    } catch (specErr) {
      carSpecContextFailed = true;
      console.warn("[megabot/carbot] specContext assembly failed (non-critical):", specErr);
      carbotOpts = undefined; // graceful degradation
    }
  }

  // CMD-PRICEBOT-CORE-A: PriceBot opts assembly mirrors the
  // AntiqueBot/CollectiblesBot/CarBot pattern. Independent branch.
  // PriceBot is unique: it already has a cached AnalyzeBot market
  // intel check in its normal route, but MegaBot always pulls fresh
  // via isMegaBot=true. Amazon MegaBot add-on unlocked via allowlist.
  let pricebotOpts: RunSpecializedMegaBotOpts | undefined;
  let pricebotSpecContextFailed = false;
  let pricebotMarketIntelFailed = false;
  if (botType === "pricebot" && !isDemoMode()) {
    try {
      pricebotSkillPack = loadSkillPack("pricebot");
      const user = await prisma.user.findUnique({ where: { id: userId } });
      const specContext = await buildItemSpecContext(item.id, { item, user });
      const specSummary = summarizeSpecContext(specContext);

      let marketIntel: any = null;
      try {
        marketIntel = await getMarketIntelligence(
          ctx.itemName ?? item.title ?? "",
          ctx.category ?? "",
          item.saleZip ?? undefined,
          undefined, // phase1Only
          true,      // isMegaBot — unlocks Amazon + paid pool
          "pricebot", // CMD-SCRAPER-WIRING-C2
        );
      } catch (err) {
        pricebotMarketIntelFailed = true;
        console.warn("[megabot/pricebot] getMarketIntelligence failed:", err);
      }

      const marketIntelBlock = marketIntel?.comps?.length
        ? `MARKET INTELLIGENCE (live pricing comps from eBay, Ruby Lane, ShopGoodwill, LiveAuctioneers, Google Shopping, Amazon — use these to anchor and validate your revised price estimate):\n${marketIntel.comps
            .slice(0, 12)
            .map(
              (c: any) =>
                `• ${c.platform}: ${c.item} — $${c.price}${c.condition ? ` (${c.condition})` : ""}`,
            )
            .join("\n")}`
        : "";

      const marketIntelMedian = marketIntel?.median ?? null;
      const midPrice = v
        ? Math.round((v.low + v.high) / 2)
        : (ai?.estimated_value_mid ?? null);

      pricebotOpts = {
        specSummary,
        specPromptBlock: specContext.promptBlock,
        marketIntelBlock,
        marketIntelMedian,
        apifyCostUsd: 0,
        enableGrounding: false, // PriceBot is OpenAI primary, no Gemini grounding
        priorValuationMid: midPrice,
        skillPackBlock: megaBotSharedBlock + botMegaBlock + pricebotSkillPack.systemPromptBlock,
      };
    } catch (specErr) {
      pricebotSpecContextFailed = true;
      console.warn("[megabot/pricebot] specContext assembly failed (non-critical):", specErr);
      pricebotOpts = undefined;
    }
  }

  // CMD-PHOTOBOT-CORE-A: PhotoBot opts assembly. Assessment-only
  // context injection — no market intel (vision-only bot). Skill
  // pack block loads for future Skills-B readiness. No scrapers.
  let photobotOpts: RunSpecializedMegaBotOpts | undefined;
  let photobotSpecContextFailed = false;
  if (botType === "photobot" && !isDemoMode()) {
    try {
      photobotSkillPack = loadSkillPack("photobot");
      const user = await prisma.user.findUnique({ where: { id: userId } });
      const specContext = await buildItemSpecContext(item.id, { item, user });
      const specSummary = summarizeSpecContext(specContext);

      photobotOpts = {
        specSummary,
        specPromptBlock: specContext.promptBlock,
        marketIntelBlock: "", // PhotoBot is vision-only — no market intel
        marketIntelMedian: null,
        apifyCostUsd: 0,
        enableGrounding: false,
        priorValuationMid: null,
        skillPackBlock: megaBotSharedBlock + botMegaBlock + photobotSkillPack.systemPromptBlock,
      };
    } catch (specErr) {
      photobotSpecContextFailed = true;
      console.warn("[megabot/photobot] specContext assembly failed (non-critical):", specErr);
      photobotOpts = undefined;
    }
  }

  // CMD-VIDEOBOT-CORE-A: VideoBot opts assembly. Script generation
  // context injection. VideoBot uses Grok primary — the MegaBot
  // consensus runs all 4 AIs on the script prompt with skill packs.
  let videobotOpts: RunSpecializedMegaBotOpts | undefined;
  let videobotSpecContextFailed = false;
  if (botType === "videobot" && !isDemoMode()) {
    try {
      videobotSkillPack = loadSkillPack("videobot");
      const user = await prisma.user.findUnique({ where: { id: userId } });
      const specContext = await buildItemSpecContext(item.id, { item, user });
      const specSummary = summarizeSpecContext(specContext);

      const midPrice = v
        ? Math.round((v.low + v.high) / 2)
        : (ai?.estimated_value_mid ?? null);

      videobotOpts = {
        specSummary,
        specPromptBlock: specContext.promptBlock,
        marketIntelBlock: "", // VideoBot uses its own intelligence pipeline
        marketIntelMedian: null,
        apifyCostUsd: 0,
        enableGrounding: false,
        priorValuationMid: midPrice,
        skillPackBlock: megaBotSharedBlock + botMegaBlock + videobotSkillPack.systemPromptBlock,
      };
    } catch (specErr) {
      videobotSpecContextFailed = true;
      console.warn("[megabot/videobot] specContext assembly failed (non-critical):", specErr);
      videobotOpts = undefined;
    }
  }

  // CMD-ANALYZEBOT-CORE-A: AnalyzeBot opts assembly. The foundation
  // bot — its MegaBot lane enriches the 4-AI consensus with skill
  // packs and spec context for deeper identification. Market intel
  // is empty (AnalyzeBot uses its own market intel pipeline post-AI).
  let analyzebotOpts: RunSpecializedMegaBotOpts | undefined;
  let analyzebotSpecContextFailed = false;
  if (botType === "analyzebot" && !isDemoMode()) {
    try {
      analyzebotSkillPack = loadSkillPack("analyzebot");
      const user = await prisma.user.findUnique({ where: { id: userId } });
      const specContext = await buildItemSpecContext(item.id, { item, user });
      const specSummary = summarizeSpecContext(specContext);

      const midPrice = v
        ? Math.round((v.low + v.high) / 2)
        : (ai?.estimated_value_mid ?? null);

      analyzebotOpts = {
        specSummary,
        specPromptBlock: specContext.promptBlock,
        marketIntelBlock: "", // AnalyzeBot runs its own market intel post-AI
        marketIntelMedian: null,
        apifyCostUsd: 0,
        enableGrounding: true,
        priorValuationMid: midPrice,
        skillPackBlock: megaBotSharedBlock + botMegaBlock + analyzebotSkillPack.systemPromptBlock,
      };
    } catch (specErr) {
      analyzebotSpecContextFailed = true;
      console.warn("[megabot/analyzebot] specContext assembly failed (non-critical):", specErr);
      analyzebotOpts = undefined;
    }
  }

  // CMD-LISTBOT-MEGA-C: ListBot opts assembly mirrors the
  // ReconBot/BuyerBot pattern. The three branches stay parallel/
  // independent because botType is single-valued per request.
  // Failure booleans (listSpecContextFailed / listMarketIntelFailed)
  // surface in MEGABOT_RUN telemetry for ops visibility.
  let listOpts: RunSpecializedMegaBotOpts | undefined;
  let listSpecContextFailed = false;
  let listMarketIntelFailed = false;
  if (botType === "listbot" && !isDemoMode()) {
    try {
      listSkillPack = loadSkillPack("listbot");
      const user = await prisma.user.findUnique({ where: { id: userId } });
      const specContext = await buildItemSpecContext(item.id, { item, user });
      const specSummary = summarizeSpecContext(specContext);

      let marketIntel: any = null;
      try {
        // CMD-MEGABOT-SCRAPER-PARITY-FIX: pass isMegaBot=true (5th arg) to
        // unlock the paid Apify scraper pool for ListBot MegaBot scans —
        // restores parity with the antiquebot branch.
        marketIntel = await getMarketIntelligence(
          ctx.itemName ?? item.title ?? "",
          ctx.category ?? "",
          item.saleZip ?? undefined,
          undefined, // phase1Only — keep default
          true,      // isMegaBot — unlock paid scraper pool
          "listbot", // CMD-SCRAPER-WIRING-C2
        );
      } catch (err) {
        listMarketIntelFailed = true;
        console.warn("[megabot/listbot] getMarketIntelligence failed:", err);
      }

      const marketIntelBlock = marketIntel?.comps?.length
        ? `MARKET INTELLIGENCE (live comps from real eBay Browse API + free scrapers — use these to validate pricing and keywords):\n${
            marketIntel.comps.slice(0, 12).map((c: any) =>
              `• ${c.platform}: ${c.item} — $${c.price}`
            ).join("\n")
          }`
        : "";

      const marketIntelMedian = marketIntel?.median ?? null;
      const midPrice = v
        ? Math.round((v.low + v.high) / 2)
        : (ai?.estimated_value_mid ?? null);

      listOpts = {
        specSummary,
        specPromptBlock: specContext.promptBlock,
        marketIntelBlock,
        marketIntelMedian,
        // FLAG 8 (RC-7) carry-forward: aggregator does not yet
        // expose Apify spend per call; hardcode 0.
        apifyCostUsd: 0,
        enableGrounding: true,
        priorValuationMid: midPrice,
        // CMD-SKILLS-INFRA-A: prepended to enrichedPrompt before
        // any item-specific context inside runSpecializedMegaBot.
        // CMD-MEGABOT-BOT-PACK-WIRING: consensus + bot mega + normal
        skillPackBlock: megaBotSharedBlock + botMegaBlock + listSkillPack.systemPromptBlock,
      };
    } catch (specErr) {
      listSpecContextFailed = true;
      console.warn("[megabot/listbot] specContext assembly failed (non-critical):", specErr);
      listOpts = undefined; // graceful degradation
    }
  }

  let result;
  try {
    const photoPaths = item.photos.slice(0, 6).map((p: any) => p.filePath);
    // CMD-LISTBOT-MEGA-C: dispatch reconOpts/buyerOpts/listOpts/
    // undefined based on botType. Other bots stay on the undefined
    // path until their respective MEGA-C rounds.
    const activeOpts =
      botType === "reconbot"        ? reconOpts        :
      botType === "buyerbot"        ? buyerOpts        :
      botType === "listbot"         ? listOpts         :
      botType === "antiquebot"      ? antiqueOpts      :
      botType === "collectiblesbot" ? collectiblesOpts :
      botType === "carbot"          ? carbotOpts       :
      botType === "pricebot"        ? pricebotOpts     :
      botType === "photobot"        ? photobotOpts     :
      botType === "videobot"        ? videobotOpts     :
      botType === "analyzebot"      ? analyzebotOpts   :
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
  if (botType === "reconbot" || botType === "buyerbot" || botType === "listbot" || botType === "antiquebot" || botType === "collectiblesbot" || botType === "carbot" || botType === "pricebot" || botType === "photobot" || botType === "videobot" || botType === "analyzebot") {
    try {
      const telemetry = extractAgentTelemetry(result);
      const specBlockFp = fingerprintBlock(
        botType === "reconbot"        ? reconOpts?.specPromptBlock        :
        botType === "buyerbot"        ? buyerOpts?.specPromptBlock        :
        botType === "listbot"         ? listOpts?.specPromptBlock         :
        botType === "antiquebot"      ? antiqueOpts?.specPromptBlock      :
        botType === "collectiblesbot" ? collectiblesOpts?.specPromptBlock :
        botType === "carbot"          ? carbotOpts?.specPromptBlock       :
        botType === "pricebot"        ? pricebotOpts?.specPromptBlock     :
        botType === "photobot"        ? photobotOpts?.specPromptBlock     :
        botType === "videobot"        ? videobotOpts?.specPromptBlock     :
        analyzebotOpts?.specPromptBlock
      );
      const marketBlockFp = fingerprintBlock(
        botType === "reconbot"        ? reconOpts?.marketIntelBlock        :
        botType === "buyerbot"        ? buyerOpts?.marketIntelBlock        :
        botType === "listbot"         ? listOpts?.marketIntelBlock         :
        botType === "antiquebot"      ? antiqueOpts?.marketIntelBlock      :
        botType === "collectiblesbot" ? collectiblesOpts?.marketIntelBlock :
        botType === "carbot"          ? carbotOpts?.marketIntelBlock       :
        botType === "pricebot"        ? pricebotOpts?.marketIntelBlock     :
        botType === "photobot"        ? photobotOpts?.marketIntelBlock     :
        botType === "videobot"        ? videobotOpts?.marketIntelBlock     :
        analyzebotOpts?.marketIntelBlock
      );
      const opts =
        botType === "reconbot"        ? reconOpts        :
        botType === "buyerbot"        ? buyerOpts        :
        botType === "listbot"         ? listOpts         :
        botType === "antiquebot"      ? antiqueOpts      :
        botType === "collectiblesbot" ? collectiblesOpts :
        botType === "carbot"          ? carbotOpts       :
        botType === "pricebot"        ? pricebotOpts     :
        botType === "photobot"        ? photobotOpts     :
        botType === "videobot"        ? videobotOpts     :
        analyzebotOpts;
      const specContextFailed =
        botType === "reconbot"        ? false                            :
        botType === "buyerbot"        ? buyerSpecContextFailed           :
        botType === "listbot"         ? listSpecContextFailed            :
        botType === "antiquebot"      ? antiqueSpecContextFailed         :
        botType === "collectiblesbot" ? collectiblesSpecContextFailed    :
        botType === "carbot"          ? carSpecContextFailed             :
        botType === "pricebot"        ? pricebotSpecContextFailed        :
        botType === "photobot"        ? photobotSpecContextFailed        :
        botType === "videobot"        ? videobotSpecContextFailed        :
        analyzebotSpecContextFailed;
      const marketIntelFailed =
        botType === "reconbot"        ? false                             :
        botType === "buyerbot"        ? buyerMarketIntelFailed            :
        botType === "listbot"         ? listMarketIntelFailed             :
        botType === "antiquebot"      ? antiqueMarketIntelFailed          :
        botType === "collectiblesbot" ? collectiblesMarketIntelFailed     :
        botType === "carbot"          ? carMarketIntelFailed              :
        botType === "pricebot"        ? pricebotMarketIntelFailed         :
        false; // PhotoBot + VideoBot + AnalyzeBot have no market intel in opts

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

            // CMD-ANALYZEBOT-CORE-A: all 10 bots now in ternary chain.
            skillPackVersion: (
              botType === "reconbot"        ? reconSkillPack?.version             :
              botType === "buyerbot"        ? buyerSkillPack?.version             :
              botType === "listbot"         ? listSkillPack?.version              :
              botType === "antiquebot"      ? antiquebotSkillPack?.version        :
              botType === "collectiblesbot" ? collectiblesbotSkillPack?.version   :
              botType === "carbot"          ? carbotSkillPack?.version            :
              botType === "pricebot"        ? pricebotSkillPack?.version          :
              botType === "photobot"        ? photobotSkillPack?.version          :
              botType === "videobot"        ? videobotSkillPack?.version          :
              botType === "analyzebot"      ? analyzebotSkillPack?.version        :
              "v0"
            ),
            skillPackCount: (
              botType === "reconbot"        ? reconSkillPack?.skillNames.length ?? 0             :
              botType === "buyerbot"        ? buyerSkillPack?.skillNames.length ?? 0             :
              botType === "listbot"         ? listSkillPack?.skillNames.length ?? 0              :
              botType === "antiquebot"      ? antiquebotSkillPack?.skillNames.length ?? 0        :
              botType === "collectiblesbot" ? collectiblesbotSkillPack?.skillNames.length ?? 0   :
              botType === "carbot"          ? carbotSkillPack?.skillNames.length ?? 0            :
              botType === "pricebot"        ? pricebotSkillPack?.skillNames.length ?? 0          :
              botType === "photobot"        ? photobotSkillPack?.skillNames.length ?? 0          :
              botType === "videobot"        ? videobotSkillPack?.skillNames.length ?? 0          :
              botType === "analyzebot"      ? analyzebotSkillPack?.skillNames.length ?? 0        :
              0
            ),
            skillPackChars: (
              botType === "reconbot"        ? reconSkillPack?.totalChars ?? 0             :
              botType === "buyerbot"        ? buyerSkillPack?.totalChars ?? 0             :
              botType === "listbot"         ? listSkillPack?.totalChars ?? 0              :
              botType === "antiquebot"      ? antiquebotSkillPack?.totalChars ?? 0        :
              botType === "collectiblesbot" ? collectiblesbotSkillPack?.totalChars ?? 0   :
              botType === "carbot"          ? carbotSkillPack?.totalChars ?? 0            :
              botType === "pricebot"        ? pricebotSkillPack?.totalChars ?? 0          :
              botType === "photobot"        ? photobotSkillPack?.totalChars ?? 0          :
              botType === "videobot"        ? videobotSkillPack?.totalChars ?? 0          :
              botType === "analyzebot"      ? analyzebotSkillPack?.totalChars ?? 0        :
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

