import { NextResponse } from "next/server";
import { authAdapter } from "@/lib/adapters/auth";
import { prisma } from "@/lib/db";
import { runSpecializedMegaBot } from "@/lib/megabot/run-specialized";
import { MEGA_PROMPT_MAP, type PromptContext } from "@/lib/megabot/prompts";
import { getItemEnrichmentContext } from "@/lib/enrichment/item-context";
import { isDemoMode, canUseBotOnTier, BOT_CREDIT_COSTS } from "@/lib/constants/pricing";
import { checkCredits, deductCredits, hasPriorBotRun } from "@/lib/credits";

// MegaBot runs 4 AI agents in parallel — grok can take up to 180s with retries
export const maxDuration = 300; // 5 minutes

function safeJson(s: string | null | undefined): any {
  if (!s) return null;
  try { return JSON.parse(s); } catch { return null; }
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
      photos: { orderBy: { order: "asc" }, take: 4 },
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
    enrichmentContext: enrichment?.hasEnrichment ? enrichment.contextBlock : undefined,
  };

  const getPrompt = MEGA_PROMPT_MAP[botType];
  if (!getPrompt) {
    return new Response(`Unknown bot type: ${botType}`, { status: 400 });
  }

  const prompt = getPrompt(ctx);

  let result;
  try {
    result = await runSpecializedMegaBot(botType, prompt, item.photos[0].filePath, itemId);
  } catch (e: any) {
    console.error(`[megabot/${botType}]`, e);
    return new Response(`MegaBot ${botType} failed: ${e.message}`, { status: 422 });
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

  // Mark megabotUsed on item
  await prisma.item.update({
    where: { id: itemId },
    data: { megabotUsed: true },
  });

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
    priceLow: price.revised_low || price.estimated_value_low || d.estimated_value_low || d.price_low || d.priceLow || null,
    priceFair: price.revised_mid || price.estimated_value_mid || d.estimated_value_mid || d.price_mid || d.priceMid || null,
    priceHigh: price.revised_high || price.estimated_value_high || d.estimated_value_high || d.price_high || d.priceHigh || null,
    conditionScore: cond.overall_score || cond.condition_score || d.condition_score || d.conditionScore || cond.overall_grade || null,
    category: id.category || d.category || null,
    era: id.era || d.era || null,
    executiveSummary: d.executive_summary || d.summary || d.notes || price.pricing_rationale || d.pricing_rationale || null,
    durationMs: agent.responseTime,
  };
}

