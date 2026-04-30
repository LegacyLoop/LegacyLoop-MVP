import { NextRequest, NextResponse } from "next/server";
import { authAdapter } from "@/lib/adapters/auth";
import { prisma } from "@/lib/db";
import OpenAI from "openai";
import { getItemEnrichmentContext } from "@/lib/enrichment";
// CMD-NETWORK-AUDIT-FIX: BuyerBot was the only specialist bot not calling market intel
import { getMarketIntelligence } from "@/lib/market-intelligence/aggregator";
import { logUserEvent } from "@/lib/data/user-events";
import { canUseBotOnTier, BOT_CREDIT_COSTS } from "@/lib/constants/pricing";
import { isDemoMode } from "@/lib/bot-mode";
import { checkCredits, deductCredits, hasPriorBotRun } from "@/lib/credits";
import { scrapeFacebookGroups } from "@/lib/market-intelligence/adapters/facebook-groups";
import { scrapeReddit } from "@/lib/market-intelligence/adapters/reddit";
import { scrapeRedditBuiltin } from "@/lib/market-intelligence/adapters/reddit-builtin";
import { scrapeInstagram } from "@/lib/market-intelligence/adapters/instagram";
import { scrapePinterest } from "@/lib/market-intelligence/adapters/pinterest";
import { scrapeYoutube } from "@/lib/market-intelligence/adapters/youtube";
import { scrapeTwitter } from "@/lib/market-intelligence/adapters/twitter-x";
import { scrapeFacebookPages } from "@/lib/market-intelligence/adapters/facebook-pages";
// CMD-BUYERBOT-API-B: router consumer + Bot Constitution + web pre-pass
import { routeBuyerBotHybrid, getBotConfig } from "@/lib/adapters/bot-ai-router";
import { buildItemSpecContext } from "@/lib/bots/item-spec-context";
import { summarizeSpecContext } from "@/lib/bots/spec-guards";
import { runWebSearchPrepass } from "@/lib/bots/web-search-prepass";
// CMD-SKILLS-INFRA-A: LegacyLoop Skill Pack loader (markdown
// playbooks prepended to the system prompt before any item context).
import { loadSkillPack } from "@/lib/bots/skill-loader";

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      baseURL: process.env.LITELLM_BASE_URL
        ? `${process.env.LITELLM_BASE_URL}/openai/v1`
        : undefined,
    })
  : null;

function safeJson(s: string | null | undefined): any {
  if (!s) return null;
  try { return JSON.parse(s); } catch { return null; }
}

/**
 * Robust JSON parser for AI-generated responses.
 * Handles: trailing commas, unclosed brackets/braces, markdown fences,
 * truncated strings, web search noise, and common AI output quirks.
 */
function parseAiJson(text: string): any {
  // Strip ALL markdown code fences (not just at start/end — can appear mid-text)
  let cleaned = text.replace(/```(?:json)?\s*/gi, "").replace(/```/g, "").trim();

  // Extract the outermost JSON object — find the FIRST { and the LAST }
  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");
  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) return null;
  let json = cleaned.slice(firstBrace, lastBrace + 1);

  // Attempt 1: direct parse
  try { return JSON.parse(json); } catch { /* continue to repairs */ }

  // Attempt 2: fix trailing commas before } or ]
  let repaired = json.replace(/,\s*([\]}])/g, "$1");
  try { return JSON.parse(repaired); } catch { /* continue */ }

  // Attempt 3: fix truncated response — close unclosed brackets/braces
  let opens = 0, closesNeeded = "";
  for (const ch of repaired) {
    if (ch === "{") opens++;
    else if (ch === "}") opens--;
  }
  if (opens > 0) {
    // Remove any trailing incomplete key-value (after last comma)
    repaired = repaired.replace(/,\s*"[^"]*"?\s*:?\s*[^,}\]]*$/, "");
    for (let i = 0; i < opens; i++) closesNeeded += "}";
    repaired = repaired + closesNeeded;
  }
  try { return JSON.parse(repaired); } catch { /* continue */ }

  // Attempt 4: fix unclosed arrays too
  let arrOpens = 0;
  for (const ch of repaired) {
    if (ch === "[") arrOpens++;
    else if (ch === "]") arrOpens--;
  }
  if (arrOpens > 0) {
    for (let i = 0; i < arrOpens; i++) repaired = repaired + "]";
    // Re-close braces after arrays
    try { return JSON.parse(repaired); } catch { /* continue */ }
  }

  // Attempt 5: fix unclosed strings — find last unclosed quote and close it
  const quoteCount = (repaired.match(/(?<!\\)"/g) || []).length;
  if (quoteCount % 2 !== 0) {
    repaired = repaired + '"';
    // Try closing brackets again
    try { return JSON.parse(repaired); } catch { /* continue */ }
    repaired = repaired.replace(/,\s*"[^"]*$/, "");
    let b2 = 0, a2 = 0;
    for (const ch of repaired) { if (ch === "{") b2++; else if (ch === "}") b2--; if (ch === "[") a2++; else if (ch === "]") a2--; }
    for (let i = 0; i < a2; i++) repaired += "]";
    for (let i = 0; i < b2; i++) repaired += "}";
    try { return JSON.parse(repaired); } catch { /* final fallback */ }
  }

  console.error("[parseAiJson] All repair attempts failed. First 500 chars:", json.slice(0, 500));
  return null;
}

/**
 * GET /api/bots/buyerbot/[itemId]
 * Retrieve existing BuyerBot result for an item
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  try {
    const user = await authAdapter.getSession();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { itemId } = await params;

    const item = await prisma.item.findUnique({ where: { id: itemId }, select: { userId: true } });
    if (!item || item.userId !== user.id) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const existing = await prisma.eventLog.findFirst({
      where: { itemId, eventType: "BUYERBOT_RESULT" },
      orderBy: { createdAt: "desc" },
    });

    if (!existing) return NextResponse.json({ hasResult: false, result: null });

    return NextResponse.json({
      hasResult: true,
      result: safeJson(existing.payload),
      createdAt: existing.createdAt,
    });
  } catch (e) {
    console.error("[buyerbot GET]", e);
    return NextResponse.json({ error: "Failed to fetch BuyerBot result" }, { status: 500 });
  }
}

/**
 * POST /api/bots/buyerbot/[itemId]
 * Run dedicated BuyerBot buyer-finding deep-dive
 */
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  try {
    const user = await authAdapter.getSession();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { itemId } = await params;

    // ── Tier + Credit Gate ──
    if (!isDemoMode()) {
      if (!canUseBotOnTier(user.tier, "buyerBot")) {
        return NextResponse.json({ error: "upgrade_required", message: "Upgrade your plan to access BuyerBot.", upgradeUrl: "/pricing?upgrade=true" }, { status: 403 });
      }
      const isRerun = await hasPriorBotRun(user.id, itemId, "BUYERBOT");
      const cost = isRerun ? BOT_CREDIT_COSTS.buyerBotReRun : BOT_CREDIT_COSTS.buyerBotRun;
      const cc = await checkCredits(user.id, cost);
      if (!cc.hasEnough) {
        return NextResponse.json({ error: "insufficient_credits", message: "Not enough credits to run BuyerBot.", balance: cc.balance, required: cost, buyUrl: "/credits" }, { status: 402 });
      }
      await deductCredits(user.id, cost, isRerun ? "BuyerBot re-run" : "BuyerBot run", itemId);
    }

    const item = await prisma.item.findUnique({
      where: { id: itemId },
      include: {
        aiResult: true,
        valuation: true,
        antiqueCheck: true,
        photos: { orderBy: { order: "asc" }, take: 4 },
      },
    });

    if (!item) return NextResponse.json({ error: "Item not found" }, { status: 404 });
    if (item.userId !== user.id) return NextResponse.json({ error: "Not your item" }, { status: 403 });

    const ai = safeJson(item.aiResult?.rawJson);
    const v = item.valuation;

    if (!ai || !v) {
      return NextResponse.json({ error: "Run AI analysis first" }, { status: 400 });
    }

    // CMD-BUYERBOT-API-B: Bot Constitution — read seller location
    // + shippability constraints from LIVE Item fields.
    // Falls back to AiResult.rawJson with a logged warning when
    // older items have null shipping fields.
    const specCtx = await buildItemSpecContext(itemId, { item, user });

    // Build context from existing analysis
    const itemName = ai.item_name || item.title || "Unknown item";
    const category = ai.category || "General";
    const subcategory = ai.subcategory || "";
    const material = ai.material || "Unknown";
    const era = ai.era || ai.estimated_age || "Unknown";
    const condScore = ai.condition_score || 5;
    const condLabel = condScore >= 8 ? "Excellent" : condScore >= 5 ? "Good" : "Fair";
    const lowPrice = Math.round(v.low);
    const highPrice = Math.round(v.high);
    const midPrice = v.mid ? Math.round(v.mid) : Math.round((v.low + v.high) / 2);
    const sellerZip = item.saleZip || "04901";
    const isAntique = item.antiqueCheck?.isAntique || false;
    const keywords = (ai.keywords || ai.best_keywords || []).join(", ");
    const bestPlatforms = ai.best_platforms || [];
    const isVehicle = category.toLowerCase().includes("vehicle");

    // ── CROSS-BOT ENRICHMENT ──
    const enrichment = await getItemEnrichmentContext(itemId, "buyerbot").catch(() => null);
    const enrichmentPrefix = enrichment?.hasEnrichment ? enrichment.contextBlock + "\n\n" : "";

    // CMD-NETWORK-AUDIT-FIX: BuyerBot market intelligence for buyer demand signals
    let buyerMarketContext = "";
    try {
      const marketIntel = await getMarketIntelligence(
        itemName, category, sellerZip,
        undefined, // phase1Only
        undefined, // isMegaBot
        "buyerbot", // CMD-SCRAPER-WIRING-C2
        undefined, // attribution
        ((item as any).saleMethod as "LOCAL_PICKUP" | "ONLINE_SHIPPING" | "BOTH" | undefined) ?? "BOTH", // CMD-SALE-METHOD-FOUNDATION
        (item as any).saleRadiusMi ?? 25,
      );
      if (marketIntel?.comps?.length > 0) {
        buyerMarketContext = `\n\nMARKET INTELLIGENCE FOR BUYER TARGETING (${marketIntel.comps.length} live comps):
${marketIntel.comps.slice(0, 8).map((c: any, i: number) => `${i + 1}. [${c.platform}] "${c.item}" — $${c.price}`).join("\n")}
Median: $${marketIntel.median} | Trend: ${marketIntel.trend}
Use this data to identify WHERE buyers are active and WHAT price brackets they're shopping in.`;
        console.log(`[BuyerBot] Market intel: ${marketIntel.compCount} comps for buyer targeting`);
      }
    } catch {
      console.log("[BuyerBot] Market intelligence unavailable (non-fatal)");
    }

    // ── SPECIALTY BOT ENRICHMENT FOR PRECISION BUYER TARGETING ──
    // Labeled blocks make specialty bot findings legible to the AI prompt.
    // Each specialty bot's data gets explicit targeting instructions.
    let specialtyBotContext = "";
    if (enrichment?.summary) {
      const sb: string[] = [];
      if (enrichment.summary.analyzeBotFindings) {
        sb.push(`\n[ANALYZE BOT FOUNDATION]\n${enrichment.summary.analyzeBotFindings}`);
      }
      if (enrichment.summary.priceBotFindings) {
        sb.push(`\n[PRICING INTELLIGENCE]\n${enrichment.summary.priceBotFindings}`);
      }
      if (enrichment.summary.antiqueBotFindings) {
        sb.push(`\n[ANTIQUE MARKET INTEL]\n${enrichment.summary.antiqueBotFindings}\nINSTRUCTION: For antique buyer targeting, prioritize auction houses (Invaluable, LiveAuctioneers, Sotheby's regional), dealer networks, collector organizations, and antique-focused Facebook groups. Use the AntiqueBot best_venue recommendation as your primary strategy.`);
      }
      if (enrichment.summary.collectiblesBotFindings) {
        sb.push(`\n[COLLECTIBLES COMMUNITY INTEL]\n${enrichment.summary.collectiblesBotFindings}\nINSTRUCTION: For collectibles, target grading service communities (PSA, BGS, CGC forums), collector Discord servers, subreddit communities (r/PokemonTCG, r/sportscards, r/vinyl), and specialty marketplaces. Reference the specific subcategory from CollectiblesBot.`);
      }
      if (enrichment.summary.carBotFindings) {
        sb.push(`\n[VEHICLE MARKET INTEL]\n${enrichment.summary.carBotFindings}\nINSTRUCTION: For vehicles, focus on LOCAL buyers first (within 100 miles), dealerships for trade-in, mechanic/enthusiast groups for the specific make/model, and Facebook Marketplace local listings. De-prioritize national shipping unless vehicle is rare/collector.`);
      }
      if (enrichment.summary.photoBotFindings) {
        sb.push(`\n[LISTING QUALITY SIGNAL]\n${enrichment.summary.photoBotFindings}`);
      }
      if (enrichment.summary.reconBotFindings) {
        sb.push(`\n[COMPETITIVE MARKET SCAN]\n${enrichment.summary.reconBotFindings}`);
      }
      specialtyBotContext = sb.join("\n");
    }

    // ══ CMD-FLAG-POLISH-BATCH-B FIX 4: structured V8 pricing + location fetch ══
    let v8Block = "";
    try {
      const v8Log = await prisma.eventLog.findFirst({
        where: { itemId, eventType: { in: ["GARAGE_SALE_V9_CALC", "GARAGE_SALE_V8_CALC"] } },
        orderBy: { createdAt: "desc" },
        select: { payload: true },
      });
      let v8: any = null;
      if (v8Log?.payload) { try { v8 = JSON.parse(v8Log.payload); } catch { v8 = null; } }
      const list = typeof v8?.listPrice === "number" ? v8.listPrice : (typeof (item as any).garageSalePriceHigh === "number" ? (item as any).garageSalePriceHigh : null);
      const accept = typeof v8?.acceptPrice === "number" ? v8.acceptPrice : (typeof (item as any).garageSalePrice === "number" ? (item as any).garageSalePrice : null);
      const floor = typeof v8?.floorPrice === "number" ? v8.floorPrice : (typeof (item as any).quickSalePrice === "number" ? (item as any).quickSalePrice : null);
      if (list != null || accept != null || floor != null) {
        const saleMethod = (item as any).saleMethod ?? "BOTH";
        const saleZip = (item as any).saleZip ?? "Not set";
        const saleRadiusMi = (item as any).saleRadiusMi ?? 25;
        const shippingDifficulty = (item as any).aiShippingDifficulty ?? "standard";
        v8Block = `\n\n[V8 PRICING — STRUCTURED, USE FOR BUYER POOL SEGMENTATION]\nlistPrice: ${list != null ? "$" + list : "N/A"}\nacceptPrice: ${accept != null ? "$" + accept : "N/A"}\nfloorPrice: ${floor != null ? "$" + floor : "N/A"}\nchannelRecommendation: ${v8?.channelRecommendation || "Not available"}\nlocationNote: ${v8?.locationNote || ""}\nsaleMethod: ${saleMethod}\nsaleZip: ${saleZip}\nsaleRadiusMi: ${saleRadiusMi}\nshippingDifficulty: ${shippingDifficulty}\n\nINSTRUCTION: Pack 17 (V8 buyer matching) tells you HOW to use these.\nFor LOCAL_PICKUP items, suppress ship-required platforms in\nplatform_opportunities output. Use saleZip + saleRadiusMi for radius targeting.\n`;
      }
    } catch (v8Err: any) { console.warn("[buyerbot] V8 fetch failed (non-fatal):", v8Err?.message); v8Block = ""; }
    specialtyBotContext = specialtyBotContext + v8Block;

    // ══ ROBIN READS BATMAN — ListBot intelligence for smarter buyer targeting ══
    let listingIntelligence = "";
    try {
      const listBotLog = await prisma.eventLog.findFirst({
        where: { itemId, eventType: "LISTBOT_RESULT" },
        orderBy: { createdAt: "desc" },
      });
      if (listBotLog?.payload) {
        const listData = safeJson(listBotLog.payload);
        if (listData) {
          const seo = listData.seo_master || {};
          const strategy = listData.cross_platform_strategy || {};
          const listings = listData.listings || {};

          const platformSnippets: string[] = [];
          for (const [platform, listing] of Object.entries(listings)) {
            const l = listing as any;
            if (l?.title) {
              platformSnippets.push(`- ${platform}: "${String(l.title).slice(0, 80)}" | $${l.price || l.starting_price || l.buy_it_now_price || "TBD"}`);
            }
          }

          if (platformSnippets.length > 0 || (seo.primary_keywords && seo.primary_keywords.length > 0)) {
            listingIntelligence = `\n\nLISTING INTELLIGENCE FROM LISTBOT (USE TO FIND MATCHING BUYERS):
${seo.primary_keywords ? `SEO Keywords (what buyers search for):\n- Primary: ${(seo.primary_keywords || []).join(", ")}\n- Long-tail: ${(seo.long_tail_keywords || []).join(", ")}\n- Trending: ${(seo.trending_keywords || seo.trending_terms || []).join(", ")}` : ""}
${platformSnippets.length > 0 ? `\nActive Listings:\n${platformSnippets.slice(0, 6).join("\n")}` : ""}

INSTRUCTION: Use these SEO keywords to find buyers who would search for this item.
- Target buyers on platforms where ListBot created the strongest listings.
- Match outreach messaging to the listing titles and descriptions.
- Use trending terms to identify communities discussing this type of item.`;
            console.log(`[BuyerBot] Robin reads Batman: ${platformSnippets.length} platform listings, ${(seo.primary_keywords || []).length} SEO keywords`);
          }
        }
      }
    } catch { /* non-critical */ }

    // ── REAL BUYER COMMUNITY DATA (parallel, non-blocking) ──
    // In conservative budget mode, only run Reddit built-in (free) + FB Groups (1 Apify call)
    // In normal/full mode, run all 7 social scrapers
    const { getApifyBudgetMode: getBudgetMode } = await import("@/lib/market-intelligence/adapters/apify-client");
    const buyerBudgetMode = getBudgetMode();
    const runFullSocial = buyerBudgetMode !== "conservative";

    let realBuyerContext = "";
    // CMD-BUYERBOT-API-B: track real Apify spend per call.
    // First bot to populate apifyCostUsd in BOT_AI_ROUTING EventLog
    // (Step 4.8 added the field, this round writes the first row).
    // Sources: ACTOR_COST_TIERS in lib/market-intelligence/adapters/apify-client.ts
    let apifyCostUsd = 0;
    try {
      // MARGIN-FIX (Step 4.6): scraper cap from 7→3.
      // Audit Step 4.5 showed BuyerBot normal mode lost $1.02/call.
      // Keep FB Groups + Reddit (baseline) + Instagram (highest engagement signal).
      // DROPPED: Pinterest, YouTube, Twitter, FB Pages (saves ~$1.30/call).
      const scraperPromises: Promise<any>[] = [
        scrapeFacebookGroups(itemName, category),   // Apify — always run (most valuable for buyers)
        scrapeRedditBuiltin(itemName),               // FREE — always run
      ];
      // Only fire Instagram in normal/full mode (capped to 3 total)
      if (runFullSocial) {
        scraperPromises.push(
          scrapeInstagram(itemName, category),
        );
      } else {
        console.log(`[BuyerBot] Conservative mode — skipping Instagram (1 Apify call saved)`);
      }

      const settled = await Promise.allSettled(scraperPromises);
      // Permanent stubs cast to widen union so downstream "fulfilled" checks compile
      const skippedStub = { status: "rejected", reason: "dropped in Step 4.6 cap" } as unknown as PromiseSettledResult<any>;
      const fbGroups = settled[0] as PromiseSettledResult<any>;
      const redditBuiltinData = settled[1] as PromiseSettledResult<any>;
      const instaData = (settled[2] ?? skippedStub) as PromiseSettledResult<any>;
      const pinterestData = skippedStub;
      const youtubeData = skippedStub;
      const twitterData = skippedStub;
      const fbPagesData = skippedStub;

      const fbResult = fbGroups.status === "fulfilled" ? fbGroups.value : null;
      const redditBuiltinResult = redditBuiltinData.status === "fulfilled" ? redditBuiltinData.value : null;

      // Use built-in Reddit first; fall back to Apify if built-in found 0 WTB posts
      let redditResult: any = null;
      if (redditBuiltinResult?.success && redditBuiltinResult.posts.filter((p: any) => p.isWTB).length > 0) {
        // Convert built-in format to match Apify format for prompt injection
        redditResult = {
          success: true,
          wtbPosts: redditBuiltinResult.posts.filter((p: any) => p.isWTB).map((p: any) => ({
            subreddit: p.subreddit, title: p.title, body: p.body, upvotes: p.score, url: p.url, date: p.date,
          })),
          discussionPosts: redditBuiltinResult.posts.filter((p: any) => !p.isWTB).map((p: any) => ({
            subreddit: p.subreddit, title: p.title, upvotes: p.score, commentCount: 0, url: p.url,
          })),
        };
      } else {
        // Fallback to Apify Reddit
        try {
          redditResult = await scrapeReddit(itemName, category);
        } catch { /* non-critical */ }
      }

      const instaResult = instaData.status === "fulfilled" ? instaData.value : null;

      // CMD-BUYERBOT-API-B: accumulate Apify spend from successful scrapers.
      // Reddit built-in is FREE — only count Apify Reddit when fallback fired
      // (i.e. built-in returned nothing AND scrapeReddit was tried).
      if (fbResult?.success) apifyCostUsd += 0.40;        // FB Groups Apify
      if (instaResult?.success) apifyCostUsd += 0.40;     // Instagram Apify
      if (redditResult?.success && !redditBuiltinResult?.success) {
        apifyCostUsd += 0.30;                             // Reddit Apify fallback
      }

      if (fbResult?.success && fbResult.groups.length > 0) {
        realBuyerContext += `\n\nREAL FACEBOOK GROUPS (scraped data — these are REAL communities):
${fbResult.groups.slice(0, 5).map((g: any, i: number) => `${i + 1}. "${g.name}" — ${g.memberCount.toLocaleString()} members`).join("\n")}
${fbResult.relevantPosts.length > 0 ? `\nRecent relevant posts:\n${fbResult.relevantPosts.slice(0, 3).map((p: any) => `- [${p.groupName}] "${p.text.slice(0, 100)}..." (${p.engagement} engagement)`).join("\n")}` : ""}
CRITICAL: Use these REAL groups in your buyer_profiles and platform_opportunities. Do NOT invent group names.`;
      }

      if (redditResult?.success && redditResult.wtbPosts.length > 0) {
        realBuyerContext += `\n\nREAL REDDIT WTB POSTS (scraped data — people actively looking for this):
${redditResult.wtbPosts.slice(0, 5).map((p: any, i: number) => `${i + 1}. r/${p.subreddit}: "${p.title}" (${p.upvotes} upvotes)`).join("\n")}
These are REAL people who want to buy this type of item. Reference these communities in your outreach strategies.`;
      }

      if (redditResult?.success && redditResult.discussionPosts.length > 0) {
        realBuyerContext += `\nRelated subreddits: ${[...new Set(redditResult.discussionPosts.map((p: any) => `r/${p.subreddit}`))].slice(0, 5).join(", ")}`;
      }

      if (instaResult?.success && instaResult.posts.length > 0) {
        realBuyerContext += `\n\nINSTAGRAM DEMAND SIGNAL:
Total engagement: ${instaResult.totalEngagement.toLocaleString()} across ${instaResult.posts.length} posts
Top hashtags: ${instaResult.topHashtags.slice(0, 8).map((h: string) => `#${h}`).join(", ")}
Demand level: ${instaResult.demandSignal.toUpperCase()}
Use these hashtags in your outreach_strategies for Instagram-specific buyer targeting.`;
      }

      // Pinterest
      const pinterest = pinterestData.status === "fulfilled" ? pinterestData.value : null;
      if (pinterest?.success && pinterest.pins.length > 0) {
        realBuyerContext += `\n\nPINTEREST DEMAND (${pinterest.pins.length} pins, ${pinterest.totalSaves.toLocaleString()} total saves):
Signal: ${pinterest.demandSignal.toUpperCase()}
Top boards: ${pinterest.topBoards.slice(0, 5).join(", ")}
Pinterest buyers tend to be decorators, gift-givers, and visual shoppers.`;
      }

      // YouTube
      const youtube = youtubeData.status === "fulfilled" ? youtubeData.value : null;
      if (youtube?.success && youtube.videos.length > 0) {
        realBuyerContext += `\n\nYOUTUBE INTEREST (${youtube.videos.length} videos, ${youtube.totalViews.toLocaleString()} total views):
Signal: ${youtube.demandSignal.toUpperCase()}
Top channels: ${youtube.videos.slice(0, 3).map((v: any) => v.channelName).filter(Boolean).join(", ")}`;
      }

      // Twitter/X
      const twitter = twitterData.status === "fulfilled" ? twitterData.value : null;
      if (twitter?.success && twitter.wtbTweets.length > 0) {
        realBuyerContext += `\n\nTWITTER/X WTB SIGNALS (${twitter.wtbTweets.length} "want to buy" tweets):
${twitter.wtbTweets.slice(0, 3).map((t: any) => `@${t.username}: "${t.text.slice(0, 100)}"`).join("\n")}`;
      }

      // Facebook Pages
      const fbPages = fbPagesData.status === "fulfilled" ? fbPagesData.value : null;
      if (fbPages?.success && fbPages.sellers.length > 0) {
        realBuyerContext += `\n\nFACEBOOK SELLER PAGES (${fbPages.sellers.length} relevant):
${fbPages.sellers.slice(0, 5).map((s: any) => `${s.name} (${s.followers.toLocaleString()} followers)`).join(", ")}`;
      }

      if (realBuyerContext) {
        console.log(`[BuyerBot] Real community data: FB=${fbResult?.groups?.length ?? 0} groups, Reddit=${redditResult?.wtbPosts?.length ?? 0} WTB, IG=${instaResult?.posts?.length ?? 0} posts, Pin=${pinterest?.pins?.length ?? 0}, YT=${youtube?.videos?.length ?? 0}, X=${twitter?.wtbTweets?.length ?? 0}, FBP=${fbPages?.sellers?.length ?? 0}`);
      }
    } catch {
      console.log("[BuyerBot] Community scrapers unavailable — proceeding with AI-only analysis");
    }

    // CMD-BUYERBOT-API-B: OpenAI web search pre-pass for real-time
    // buyer demand signals. Pinterest/YouTube/Twitter/FB Pages live
    // in MegaBot tier — this fills the social signal gap at the
    // standard tier with citations. ~$0.003/call, well within margin.
    const _sellerZip = item.saleZip || "04901";
    const { webEnrichment, webSources: prepassWebSources } =
      await runWebSearchPrepass(openai, itemName, category, _sellerZip);

    // ── BUYERBOT PROMPT ──
    // CMD-SKILLS-INFRA-A: skillPack injected at the very TOP of the
    // system prompt (BEFORE specCtx.promptBlock) so the agent sees
    // LegacyLoop's epistemic standard before any item context.
    // CMD-BUYERBOT-API-B: specCtx.promptBlock prepended FRONT,
    // webEnrichment appended right before the template literal.
    const skillPack = loadSkillPack("buyerbot");
    const systemPrompt =
      (skillPack.systemPromptBlock ? skillPack.systemPromptBlock + "\n\n" : "") +
      specCtx.promptBlock + "\n\n" +     // Bot Constitution FIRST
      enrichmentPrefix +
      specialtyBotContext + "\n\n" +
      buyerMarketContext +                // CMD-NETWORK-AUDIT-FIX: market comps for buyer demand
      listingIntelligence +
      realBuyerContext +
      webEnrichment +                    // Web pre-pass injected here
      `You are a world-class buyer acquisition specialist and marketplace researcher. You have 15 years of experience finding buyers for every type of item — from antiques to electronics to vehicles. You know every platform, every community, every trick to find the RIGHT buyer who will pay the best price.

You are finding buyers for: ${itemName} — ${category}${subcategory ? ` — ${subcategory}` : ""}
Condition: ${condLabel} (${condScore}/10)
Location: ZIP ${sellerZip} (Maine, USA)
Estimated value: $${lowPrice} — $${highPrice} (mid: $${midPrice})
Era/Age: ${era}
Material: ${material}
Keywords: ${keywords || "none provided"}
${bestPlatforms.length > 0 ? `AI-recommended selling platforms: ${bestPlatforms.join(", ")}` : ""}

Your job: Find the BEST buyers for this item. Be specific about WHERE they are and HOW to reach them.

CRITICAL: Keep your response COMPACT. Short values, no filler text. This must fit within token limits.

Return a JSON object with this structure:

{
  "buyer_profiles": [
    {
      "profile_name": "e.g. Vintage Guitar Gear Collector",
      "buyer_type": "Collector | Reseller | Decorator | Hobbyist | Dealer | Personal Use",
      "motivation": "1 sentence why they want this",
      "price_sensitivity": "Will Pay Premium | Fair Market | Bargain Hunter",
      "likelihood_to_buy": "Very High | High | Medium",
      "estimated_offer_range": "$X — $Y",
      "platforms_active_on": ["platform1", "platform2"],
      "best_approach": "1 sentence how to reach them",
      "location_preference": "Local Only | Regional | National | International",
      "time_sensitivity": "Buys immediately | Takes time to decide | Seasonal buyer"
    }
  ],

  "platform_opportunities": [
    {
      "platform": "Platform name",
      "opportunity_level": "Excellent | Good | Moderate",
      "estimated_buyers": 100,
      "avg_sale_price_here": 50,
      "avg_days_to_sell": 7,
      "how_to_list": "1-2 sentence tip",
      "groups_or_communities": ["specific group names"]
    }
  ],

  "outreach_strategies": [
    {
      "strategy_name": "Approach name",
      "channel": "Platform",
      "message_template": "Ready-to-send warm message (2-3 sentences max)",
      "effort_level": "Easy | Medium | Hard"
    }
  ],

  "local_opportunities": {
    "antique_shops_nearby": "1 sentence",
    "flea_markets": "1 sentence",
    "consignment_options": "1 sentence"
  },

  "hot_leads": [
    {
      "lead_description": "Who is actively looking",
      "urgency": "Act now | This week | This month",
      "how_to_reach": "Specific action",
      "estimated_price_theyd_pay": 50
    }
  ],

  "competitive_landscape": {
    "similar_items_listed": 15,
    "price_range_of_competitors": "$X — $Y",
    "your_advantage": "1 sentence",
    "differentiation_tip": "1 sentence"
  },

  "timing_advice": {
    "best_day_to_list": "Day",
    "best_time_to_list": "Morning/Afternoon/Evening",
    "seasonal_peak": "Season",
    "urgency_recommendation": "1 sentence"
  },

  "executive_summary": "3-4 sentence plain-language summary. Who are the most likely buyers, where to find them, and what to expect."
}

Apply the loaded skill pack rules. Skills 01, 19, 20, and 13's specificity floor govern lead quality, output counts, web search discipline, and outreach specificity.
- All prices in USD.

For each hot lead, include WHERE you found evidence of their interest.
Include a "web_sources" array in your response with {"url": "...", "title": "..."} objects for pages you found. If no web search performed, return empty array.`;

    // CMD-BUYERBOT-API-B: Pre-evaluate the specialty_item trigger
    // (router config validation lives in routeBuyerBotHybrid via
    // PART B; here we check whether THIS item should fire Claude).
    const _config = getBotConfig("buyerbot");
    const _specialtyTriggerEnabled = _config.triggers.includes("specialty_item");
    const _isSpecialtyItem =
      item.antiqueCheck?.isAntique === true ||
      ai?.is_collectible === true ||
      category.toLowerCase().includes("vehicle") ||
      category.toLowerCase().includes("car") ||
      category.toLowerCase().includes("truck") ||
      category.toLowerCase().includes("motorcycle");
    const shouldRunSecondary = _specialtyTriggerEnabled && _isSpecialtyItem;

    let buyerbotResult: any = null;

    if (openai) {
      try {
        // CMD-BUYERBOT-API-B: route through the new hybrid runner.
        // Grok PRIMARY for buyer psychology + outreach hooks.
        // Claude SECONDARY (conditional) for collector-tone refinement
        // when antique/collectible/vehicle is detected.
        const photoPaths = item.photos.map((p) => p.filePath);

        const collectorContext = shouldRunSecondary
          ? systemPrompt +
            "\n\n[SPECIALTY ITEM REFINEMENT — COLLECTOR TONE]\n" +
            "This item has been flagged as antique, collectible, or " +
            "vehicle. Refine the buyer_profiles and outreach_strategies " +
            "for a sophisticated collector audience: use period-" +
            "appropriate language, reference auction culture, " +
            "emphasize provenance and authentication where available, " +
            "and target specialist communities (auction houses, " +
            "collector forums, dealer networks). KEEP THE EXACT JSON " +
            "SCHEMA from the original prompt — only refine the " +
            "buyer_profiles array and outreach_strategies array."
          : undefined;

        const hybrid = await routeBuyerBotHybrid({
          itemId,
          photoPath: photoPaths,
          buyerPrompt: systemPrompt,
          collectorContext,
          shouldRunSecondary,
          apifyCostUsd,
          skipLogging: false,
        });

        if (hybrid.degraded) {
          console.error("[buyerbot] router degraded:", hybrid.error);
          return NextResponse.json({
            error: "ai_failed",
            message: "BuyerBot AI providers failed — please try again",
            details: hybrid.error,
          }, { status: 422 });
        }

        // OVERLAY MERGE strategy:
        //   1. Start with Grok primary as the base (full payload)
        //   2. When Claude secondary present, overlay its refined
        //      buyer_profiles + outreach_strategies on top
        //   3. Tag with _ai_breakdown for downstream auditability
        //
        // The router returns rawResult as a parsed object — but Grok
        // occasionally returns stringified JSON, so we re-apply the
        // existing parseAiJson 5-repair fallback to BOTH results.
        const primaryRaw = hybrid.primary.rawResult;
        const secondaryRaw = hybrid.secondary?.rawResult;

        // CMD-BUYERBOT-API-B: ensureParsed — re-applies parseAiJson
        // 5-repair fallback if rawResult came back as a string (Grok edge case).
        const ensureParsed = (raw: any): any => {
          if (raw == null) return null;
          if (typeof raw === "object") return raw;
          if (typeof raw === "string") {
            const parsed = parseAiJson(raw);
            if (parsed) return parsed;
            // Fall back to the existing aggressive truncation recovery
            const fallbackMatch = raw.match(/\{[\s\S]{100,}\}/);
            if (fallbackMatch) {
              let truncated = fallbackMatch[0];
              for (let i = truncated.length - 1; i > truncated.length - 200; i--) {
                const sub = truncated.slice(0, i);
                let b = 0, a = 0;
                for (const c of sub) {
                  if (c === "{") b++; else if (c === "}") b--;
                  if (c === "[") a++; else if (c === "]") a--;
                }
                let attempt = sub;
                for (let j = 0; j < a; j++) attempt += "]";
                for (let j = 0; j < b; j++) attempt += "}";
                try {
                  return JSON.parse(attempt);
                } catch { /* continue */ }
              }
            }
          }
          return null;
        };

        const primaryObj = ensureParsed(primaryRaw);
        const secondaryObj = ensureParsed(secondaryRaw);

        if (!primaryObj) {
          console.error("[buyerbot] primary unparseable");
          return NextResponse.json({
            error: "ai_parse_failed",
            message: "BuyerBot returned unreadable response — please retry",
          }, { status: 422 });
        }

        buyerbotResult = primaryObj;

        // Overlay Claude refinement when present (best-effort)
        if (secondaryObj) {
          if (Array.isArray(secondaryObj.buyer_profiles)) {
            buyerbotResult.buyer_profiles = secondaryObj.buyer_profiles;
          }
          if (Array.isArray(secondaryObj.outreach_strategies)) {
            buyerbotResult.outreach_strategies = secondaryObj.outreach_strategies;
          }
          buyerbotResult._collector_refined = true;
        }

        // _ai_breakdown for downstream audit trail
        buyerbotResult._ai_breakdown = {
          primary_provider: hybrid.primary.provider,
          secondary_provider: hybrid.secondary?.provider ?? null,
          merged_at: new Date().toISOString(),
          actual_cost_usd: hybrid.actualCostUsd,
          latency_ms: hybrid.latencyMs,
        };
      } catch (aiErr: any) {
        console.error("[buyerbot] router error:", aiErr);
        return NextResponse.json({
          error: `BuyerBot AI failed: ${aiErr?.message ?? String(aiErr)}`,
        }, { status: 422 });
      }
    } else {
      // PRESERVED: existing demo fallback path
      buyerbotResult = generateDemoResult(
        itemName, category, midPrice, era, material, sellerZip,
        isAntique, isVehicle,
      );
      buyerbotResult._isDemo = true;
    }

    // CMD-BUYERBOT-API-B: prepend pre-pass citations to existing
    // web_sources (preserves prior shape — UI consumer expects an
    // array of {url, title} on web_sources).
    if (!buyerbotResult.web_sources) buyerbotResult.web_sources = [];
    if (prepassWebSources && prepassWebSources.length > 0) {
      buyerbotResult.web_sources = [
        ...prepassWebSources,
        ...(buyerbotResult.web_sources || []),
      ];
    }

    // CMD-BUYERBOT-API-B: spec_context_summary for downstream audit.
    // Uses the existing summarizeSpecContext helper from spec-guards.ts
    // (Round B recon caught the spec's claim that this helper does not
    // exist — it does. Reusing avoids drift with PriceBot Step 4 and
    // future bots in Steps 6-13.)
    buyerbotResult.spec_context_summary = summarizeSpecContext(specCtx);

    // Validate expected fields
    const requiredKeys = [
      "buyer_profiles", "platform_opportunities", "outreach_strategies",
      "local_opportunities", "hot_leads", "competitive_landscape",
      "timing_advice", "executive_summary",
    ];
    for (const key of requiredKeys) {
      if (buyerbotResult[key] === undefined) buyerbotResult[key] = null;
    }

    // CMD-BUYERBOT-INTEL-ANCHOR: canonical offer-recommendation anchored
    // to Item Intelligence. Per-buyer-profile estimated_offer_range strings
    // preserved untouched (they're persona narrative, not SSOT).
    const { resolveIntelligenceAnchor, applyAnchorToFormula, pricingSourceFromAnchor } =
      await import("@/lib/pricing/intelligence-anchor");
    const intelligenceAnchor = await resolveIntelligenceAnchor(itemId);
    const pricingSource = pricingSourceFromAnchor(intelligenceAnchor);
    // Formula baseline: buyer typically offers midPrice at top, ~70% at bottom.
    const formulaOfferMax = midPrice;
    const formulaOfferMin = Math.round(midPrice * 0.7);
    const formulaOfferMid = Math.round((formulaOfferMax + formulaOfferMin) / 2);
    // Map anchor into offer-side semantics via shared helper:
    //   listPrice slot  → max offer (sweetSpot = what seller accepts)
    //   acceptPrice slot → mid offer (negotiation target)
    //   floorPrice slot  → min offer (quickSalePrice = seller's walk-away)
    const anchorTarget = intelligenceAnchor
      ? {
          listPrice: intelligenceAnchor.sweetSpot,
          acceptPrice: Math.round((intelligenceAnchor.sweetSpot + intelligenceAnchor.quickSalePrice) / 2),
          floorPrice: intelligenceAnchor.quickSalePrice,
        }
      : { listPrice: formulaOfferMax, acceptPrice: formulaOfferMid, floorPrice: formulaOfferMin };
    const anchored = applyAnchorToFormula(intelligenceAnchor, anchorTarget);
    (buyerbotResult as any).offer_recommendation = {
      max: anchored.listPrice,
      mid: anchored.acceptPrice,
      min: anchored.floorPrice,
      source: pricingSource,
    };
    (buyerbotResult as any).formulaOfferMax = formulaOfferMax;
    (buyerbotResult as any).formulaOfferMin = formulaOfferMin;
    (buyerbotResult as any).pricingSource = pricingSource;
    (buyerbotResult as any).intelligenceAgeMs = intelligenceAnchor?.ageMs ?? null;

    // Store in EventLog
    await prisma.eventLog.create({
      data: {
        itemId,
        eventType: "BUYERBOT_RESULT",
        payload: JSON.stringify(buyerbotResult),
      },
    });

    await prisma.eventLog.create({
      data: {
        itemId,
        eventType: "BUYERBOT_RUN",
        // CMD-SKILLS-INFRA-A: payload extended with skill pack
        // telemetry for A/B testing of skill pack versions.
        payload: JSON.stringify({
          userId: user.id,
          timestamp: new Date().toISOString(),
          skillPackVersion: skillPack.version,
          skillPackCount: skillPack.skillNames.length,
          skillPackChars: skillPack.totalChars,
          // CMD-BUYERBOT-INTEL-ANCHOR telemetry
          pricingSource,
          intelligenceAgeMs: intelligenceAnchor?.ageMs ?? null,
          formulaOfferMax,
          formulaOfferMin,
        }),
      },
    });

    // Fire-and-forget: log user event
    logUserEvent(user.id, "BOT_RUN", { itemId, metadata: { botType: "BUYERBOT", success: true } }).catch(() => null);

    // Fire-and-forget: demand score recalculation
    import("@/lib/bots/demand-score").then(m => m.calculateDemandScore(itemId)).catch(() => null);

    return NextResponse.json({
      success: true,
      result: buyerbotResult,
      isDemo: !!buyerbotResult._isDemo,
      pricingSource,
      intelligenceAgeMs: intelligenceAnchor?.ageMs ?? null,
    });
  } catch (e) {
    console.error("[buyerbot POST]", e);
    return NextResponse.json({ error: "BuyerBot analysis failed" }, { status: 500 });
  }
}

// ── Demo Result Generator ──────────────────────────────────────────────────

function generateDemoResult(
  itemName: string, category: string, midPrice: number,
  era: string, material: string, zip: string,
  isAntique: boolean, isVehicle: boolean,
) {
  const cat = category.toLowerCase();
  const price = midPrice || 150;
  const lowOffer = Math.round(price * 0.65);
  const highOffer = Math.round(price * 1.15);
  const condLabel = "Good";

  return {
    buyer_profiles: [
      {
        profile_name: `${category} Collector`,
        buyer_type: "Collector",
        motivation: `Actively building a ${cat} collection and looking for quality ${era} pieces`,
        price_sensitivity: "Will Pay Premium",
        likelihood_to_buy: "Very High",
        estimated_offer_range: `$${Math.round(price * 0.9)} — $${Math.round(price * 1.1)}`,
        location_preference: "National",
        platforms_active_on: ["eBay", "Ruby Lane", "Facebook Groups"],
        best_approach: `Mention the ${era} provenance and ${material} construction — collectors pay more for documented history`,
        time_sensitivity: "Buys immediately",
      },
      {
        profile_name: "Local Estate Sale Hunter",
        buyer_type: "Personal Use",
        motivation: `Searching for unique ${cat} items for their home — prefers local pickup to inspect in person`,
        price_sensitivity: "Fair Market",
        likelihood_to_buy: "High",
        estimated_offer_range: `$${Math.round(price * 0.8)} — $${price}`,
        location_preference: "Local Only",
        platforms_active_on: ["Facebook Marketplace", "Craigslist", "Nextdoor"],
        best_approach: "Post with great photos, mention local pickup available, be responsive to messages",
        time_sensitivity: "Buys immediately",
      },
      {
        profile_name: "Resale Flipper",
        buyer_type: "Reseller",
        motivation: `Buys ${cat} items at below market to resell on eBay/Etsy for profit`,
        price_sensitivity: "Bargain Hunter",
        likelihood_to_buy: "High",
        estimated_offer_range: `$${lowOffer} — $${Math.round(price * 0.75)}`,
        location_preference: "Regional",
        platforms_active_on: ["Craigslist", "OfferUp", "Facebook Marketplace"],
        best_approach: "Price firmly — flippers will lowball. Counter with evidence of recent comparable sales",
        time_sensitivity: "Buys immediately",
      },
      {
        profile_name: "Interior Designer / Decorator",
        buyer_type: "Decorator",
        motivation: `Sourcing unique ${cat} pieces for client projects — values character and story`,
        price_sensitivity: "Will Pay Premium",
        likelihood_to_buy: "Medium",
        estimated_offer_range: `$${price} — $${highOffer}`,
        location_preference: "Regional",
        platforms_active_on: ["Instagram", "1stDibs", "Chairish", "Facebook Groups"],
        best_approach: "Emphasize the aesthetic appeal, measurements, and condition. Offer to stage photos in-situ",
        time_sensitivity: "Takes time to decide",
      },
      {
        profile_name: "Gift Buyer",
        buyer_type: "Gift Buyer",
        motivation: `Looking for a special ${cat} gift — birthday, anniversary, or holiday`,
        price_sensitivity: "Fair Market",
        likelihood_to_buy: "Medium",
        estimated_offer_range: `$${Math.round(price * 0.85)} — $${Math.round(price * 1.05)}`,
        location_preference: "National",
        platforms_active_on: ["Etsy", "eBay", "Facebook Marketplace"],
        best_approach: "Highlight the uniqueness and story behind the item — gift buyers love provenance",
        time_sensitivity: "Seasonal buyer",
      },
      {
        profile_name: isAntique ? "Antique Dealer / Shop Owner" : "Consignment Shop",
        buyer_type: "Dealer",
        motivation: isAntique
          ? `Stocks ${era} ${cat} items for their shop — always buying inventory`
          : `Accepts quality ${cat} items on consignment for their retail customers`,
        price_sensitivity: "Bargain Hunter",
        likelihood_to_buy: "High",
        estimated_offer_range: `$${Math.round(price * 0.5)} — $${Math.round(price * 0.7)}`,
        location_preference: "Local Only",
        platforms_active_on: ["Direct contact", "Antique Forums", "Facebook Groups"],
        best_approach: "Visit in person with the item. Dealers buy in volume so expect 50-70% of retail value",
        time_sensitivity: "Buys immediately",
      },
      {
        profile_name: "Online Marketplace Browser",
        buyer_type: "Personal Use",
        motivation: `Casually browsing for ${cat} items — impulse buyer if price is right`,
        price_sensitivity: "Fair Market",
        likelihood_to_buy: "Low",
        estimated_offer_range: `$${Math.round(price * 0.7)} — $${Math.round(price * 0.95)}`,
        location_preference: "National",
        platforms_active_on: ["eBay", "Mercari", "Facebook Marketplace"],
        best_approach: "Great photos and competitive pricing are key. These buyers comparison-shop extensively",
        time_sensitivity: "Takes time to decide",
      },
      {
        profile_name: `${category} Hobbyist`,
        buyer_type: "Hobbyist",
        motivation: `Uses ${cat} items as part of their hobby or craft — values functionality`,
        price_sensitivity: "Fair Market",
        likelihood_to_buy: "Medium",
        estimated_offer_range: `$${Math.round(price * 0.8)} — $${price}`,
        location_preference: "National",
        platforms_active_on: ["Reddit", "Specialty Forums", "Facebook Groups", "eBay"],
        best_approach: "Post in hobby-specific communities. Mention functionality and completeness",
        time_sensitivity: "Takes time to decide",
      },
    ],

    platform_opportunities: [
      {
        platform: "eBay",
        opportunity_level: "Excellent",
        estimated_buyers: 245,
        avg_sale_price_here: Math.round(price * 0.95),
        avg_days_to_sell: 12,
        audience_description: `National buyers specifically searching for ${cat} items`,
        how_to_list: "Use auction format for rare items, Buy It Now for common ones. Include 'best offer' option",
        search_terms_buyers_use: [itemName.split(" ").slice(0, 3).join(" "), category, era, material].filter(Boolean),
        groups_or_communities: [],
        best_time_to_post: "Sunday evening 7-9 PM EST",
      },
      {
        platform: "Facebook Marketplace",
        opportunity_level: "Excellent",
        estimated_buyers: 180,
        avg_sale_price_here: Math.round(price * 0.85),
        avg_days_to_sell: 5,
        audience_description: "Local buyers within 50 miles who prefer pickup and inspection",
        how_to_list: "Great photos, honest description, price slightly above your minimum. Respond within 1 hour",
        search_terms_buyers_use: [itemName.split(" ")[0], category, "vintage", "antique"].filter(Boolean),
        groups_or_communities: ["Maine Buy/Sell/Trade", "New England Antiques & Collectibles", `${category} Enthusiasts`],
        best_time_to_post: "Thursday-Saturday morning",
      },
      {
        platform: "Craigslist",
        opportunity_level: "Good",
        estimated_buyers: 85,
        avg_sale_price_here: Math.round(price * 0.8),
        avg_days_to_sell: 8,
        audience_description: "Local deal-seekers and small dealers looking for underpriced items",
        how_to_list: "Post in correct category, include dimensions and condition details, firm price discourages lowballers",
        search_terms_buyers_use: [category, era, "estate sale", material].filter(Boolean),
        groups_or_communities: [],
        best_time_to_post: "Wednesday-Friday afternoon",
      },
      {
        platform: isAntique ? "Ruby Lane" : "Mercari",
        opportunity_level: isAntique ? "Excellent" : "Good",
        estimated_buyers: isAntique ? 120 : 95,
        avg_sale_price_here: isAntique ? Math.round(price * 1.1) : Math.round(price * 0.88),
        avg_days_to_sell: isAntique ? 21 : 7,
        audience_description: isAntique
          ? "Serious antique collectors willing to pay premium for authenticated items"
          : "Young deal-hunters who browse casually and buy impulsively",
        how_to_list: isAntique
          ? "Detailed provenance, measurements, maker marks. High-quality photos from multiple angles"
          : "Competitive pricing, free shipping if possible, quick ship guarantee",
        search_terms_buyers_use: isAntique
          ? [era, material, "antique", category].filter(Boolean)
          : [itemName.split(" ")[0], category, "vintage"].filter(Boolean),
        groups_or_communities: [],
        best_time_to_post: isAntique ? "Tuesday morning" : "Weekend mornings",
      },
      {
        platform: "Etsy",
        opportunity_level: isAntique ? "Good" : "Moderate",
        estimated_buyers: 110,
        avg_sale_price_here: Math.round(price * 1.05),
        avg_days_to_sell: 18,
        audience_description: "Buyers who appreciate handmade, vintage, and unique items — willing to pay more",
        how_to_list: "Great SEO in title/tags, lifestyle photos, story in description. Label as 'vintage' if 20+ years old",
        search_terms_buyers_use: ["vintage " + category, era + " " + material, itemName].filter(Boolean),
        groups_or_communities: ["Etsy Teams for Vintage Sellers"],
        best_time_to_post: "Monday morning",
      },
      {
        platform: "Facebook Groups",
        opportunity_level: "Good",
        estimated_buyers: 150,
        avg_sale_price_here: Math.round(price * 0.92),
        avg_days_to_sell: 4,
        audience_description: "Enthusiasts and collectors in niche groups specifically for this category",
        how_to_list: "Join relevant groups first, read rules, post with great photos and fair price",
        search_terms_buyers_use: [],
        groups_or_communities: [
          `Maine Antiques & Collectibles`,
          `New England ${category} Collectors`,
          `Vintage ${category} Buy/Sell/Trade`,
          `${category} Enthusiasts Worldwide`,
        ],
        best_time_to_post: "Saturday morning 9-11 AM",
      },
    ],

    outreach_strategies: [
      {
        strategy_name: "Facebook Group Post",
        channel: "Facebook Groups",
        target_audience: `${category} collectors and enthusiasts in 3-5 targeted groups`,
        message_template: `Hi everyone! I have a beautiful ${itemName} that I'm looking to find a good home for. It's in ${cat.includes("excellent") ? "excellent" : "great"} condition and dates to the ${era} era. Made of ${material}. I'm asking $${price} but happy to discuss. Located in Maine — local pickup available or I can ship. Would love to share more photos if anyone's interested! 📸`,
        expected_response_rate: "15-25%",
        effort_level: "Easy",
        cost: "Free",
      },
      {
        strategy_name: "eBay Targeted Listing",
        channel: "eBay",
        target_audience: "National buyers with saved searches for this type of item",
        message_template: `${itemName} — ${era} ${material} — ${condLabel} Condition. Detailed photos showing all angles. Ships securely from Maine. Buy It Now or Best Offer welcome.`,
        expected_response_rate: "8-12%",
        effort_level: "Medium",
        cost: "Free to list (13.25% on sale)",
      },
      {
        strategy_name: "Local Marketplace Blitz",
        channel: "Facebook Marketplace + Craigslist + Nextdoor",
        target_audience: "Local buyers within 50 miles who prefer to inspect before buying",
        message_template: `Hey neighbor! Selling a ${itemName} — ${era}, ${material}, in ${condLabel.toLowerCase()} condition. $${price} or best offer. Located in central Maine, can meet at a convenient public spot. Happy to send more photos! 📷`,
        expected_response_rate: "20-30%",
        effort_level: "Easy",
        cost: "Free",
      },
      {
        strategy_name: isAntique ? "Collector Direct Outreach" : "Reddit Community Post",
        channel: isAntique ? "Email / Direct Message" : "Reddit",
        target_audience: isAntique
          ? "Known collectors and dealers who specialize in this category"
          : `r/${cat.includes("furniture") ? "furniture" : "ThriftStoreHauls"} and r/vintage community members`,
        message_template: isAntique
          ? `Hi! Fellow ${category.toLowerCase()} enthusiast here. I have a ${era} ${itemName} in ${condLabel.toLowerCase()} condition that I think might interest you. ${material} construction with beautiful patina. I'm asking $${price} — happy to share detailed photos and discuss provenance. Would you like to take a look?`
          : `[For Sale] ${itemName} — ${era}, ${material}, ${condLabel} condition. $${price} shipped or local pickup in Maine. More photos in comments!`,
        expected_response_rate: isAntique ? "30-40%" : "10-15%",
        effort_level: isAntique ? "Medium" : "Easy",
        cost: "Free",
      },
    ],

    local_opportunities: {
      antique_shops_nearby: isAntique
        ? "Antique shops in Portland, Augusta, and Bangor frequently buy estate pieces. Try Maine Antique Digest advertisers"
        : "Local consignment shops and thrift stores may accept quality items on consignment (typically 40-60% split)",
      flea_markets: "Portland Flea (seasonal), Fairfield Antiques Mall, Montsweag Flea Market on Route 1",
      estate_sale_companies: "Maine Estate Liquidators, Downeast Auctions, New England Estate Services",
      local_collector_clubs: `Maine Antiques Association, New England ${category} Society, local historical society`,
      consignment_options: "Local consignment shops typically take 40-50% commission but handle all selling. Good for items over $100",
      word_of_mouth: "Post on your personal Facebook, mention to friends and neighbors. Word-of-mouth often finds the best buyers for unique items",
    },

    hot_leads: [
      {
        lead_description: `Active ${category.toLowerCase()} collector searching on eBay with saved alerts`,
        evidence: `${Math.floor(Math.random() * 20 + 15)} saved-search alerts active for "${itemName.split(" ").slice(0, 2).join(" ")}" on eBay this month. Category demand is up ${Math.floor(Math.random() * 15 + 5)}% year-over-year`,
        urgency: "Act now",
        how_to_reach: `List on eBay with Buy It Now at $${Math.round(price * 1.05)} with Best Offer enabled. These buyers get instant alerts`,
        estimated_price_theyd_pay: Math.round(price * 0.95),
      },
      {
        lead_description: `Facebook Marketplace buyers in Maine actively browsing ${category.toLowerCase()} items`,
        evidence: `${Math.floor(Math.random() * 30 + 40)} active listings viewed in the past week for similar items in your area. Local demand is strong`,
        urgency: "This week",
        how_to_reach: "Post on Facebook Marketplace with great photos. Price at $" + price + " — local buyers expect 5-10% negotiation",
        estimated_price_theyd_pay: Math.round(price * 0.9),
      },
      {
        lead_description: isAntique
          ? "Antique dealer network in New England actively buying inventory"
          : `${category} enthusiast groups with active "ISO" posts`,
        evidence: isAntique
          ? "Multiple dealers posted 'buying' ads in Maine Antique Digest this month. Spring buying season has begun"
          : `3 "In Search Of" posts matching your item type in relevant Facebook groups in the past 2 weeks`,
        urgency: "This week",
        how_to_reach: isAntique
          ? "Contact 3-4 antique shops directly with photos and asking price. Dealers decide quickly"
          : "Reply to ISO posts in Facebook groups with your item details and photos",
        estimated_price_theyd_pay: isAntique ? Math.round(price * 0.65) : Math.round(price * 0.88),
      },
      {
        lead_description: "Etsy vintage buyers searching for this exact category",
        evidence: `"${category}" search volume on Etsy is trending up. ${Math.floor(Math.random() * 50 + 80)} searches per day for similar items`,
        urgency: "This month",
        how_to_reach: "Create an Etsy listing with strong SEO keywords. Include " + (era || "vintage") + " and " + (material || category) + " in title",
        estimated_price_theyd_pay: Math.round(price * 1.05),
      },
      {
        lead_description: "Weekend flea market and estate sale shoppers",
        evidence: "Spring flea market season just started. Weekend foot traffic at Maine antique venues is at seasonal peak",
        urgency: "This month",
        how_to_reach: "Book a table at Portland Flea or Montsweag Flea Market. Bring this item plus any others you're selling",
        estimated_price_theyd_pay: Math.round(price * 0.75),
      },
    ],

    competitive_landscape: {
      similar_items_listed: Math.floor(Math.random() * 30 + 8),
      price_range_of_competitors: `$${Math.round(price * 0.6)} — $${Math.round(price * 1.4)}`,
      your_advantage: `Your item is in ${condLabel.toLowerCase()} condition with documented provenance. ${isAntique ? "Antique status adds collector value" : "Clean presentation and honest description builds trust"}`,
      your_disadvantage: "Some competitors offer free shipping or have established seller reputations with high feedback scores",
      differentiation_tip: `Highlight the ${material} construction and ${era} era in your title. Include close-up photos of any maker marks or unique details. Story sells — mention the item's history if known`,
    },

    timing_advice: {
      best_day_to_list: "Thursday or Sunday",
      best_time_to_list: "Sunday evening 7-9 PM EST or Thursday morning 9-11 AM EST",
      seasonal_peak: isAntique
        ? "October-December (holiday gift buying) and April-June (spring decorating)"
        : "Spring and early fall — avoid mid-summer when buyers are on vacation",
      avoid_listing: "Avoid major holiday weekends (July 4th, Thanksgiving week). Listings get buried",
      urgency_recommendation: "List within the next 7 days — spring buying season is strong and demand is above average for this category",
    },

    executive_summary: `Great news — there are solid buyers out there for your ${itemName}. Your best bet is to list on Facebook Marketplace for quick local interest (expect a sale within 5-7 days) and simultaneously on eBay to reach national collectors (may take 2-3 weeks but can fetch a higher price). ${isAntique ? "As an antique, consider reaching out to local antique shops in Portland or Augusta — they're always buying inventory." : "Post in 2-3 Facebook groups related to " + category.toLowerCase() + " for free exposure to enthusiasts."} At $${price}, you're priced competitively. Expect initial offers 10-15% below your asking price — that's normal. Be responsive to messages and you should have strong interest within the first week.`,
  };
}
