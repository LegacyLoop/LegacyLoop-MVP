import { NextRequest, NextResponse } from "next/server";
import { authAdapter } from "@/lib/adapters/auth";
import { prisma } from "@/lib/db";
import OpenAI from "openai";
import { getItemEnrichmentContext } from "@/lib/enrichment";
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

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
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
      const cost = isRerun ? BOT_CREDIT_COSTS.singleBotReRun : BOT_CREDIT_COSTS.singleBotRun;
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
    try {
      const scraperPromises: Promise<any>[] = [
        scrapeFacebookGroups(itemName, category),   // Apify — always run (most valuable for buyers)
        scrapeRedditBuiltin(itemName),               // FREE — always run
      ];
      // Only fire expensive social scrapers in normal/full mode
      if (runFullSocial) {
        scraperPromises.push(
          scrapeInstagram(itemName, category),
          scrapePinterest(itemName, category),
          scrapeYoutube(itemName, category),
          scrapeTwitter(itemName, category),
          scrapeFacebookPages(itemName, category),
        );
      } else {
        console.log(`[BuyerBot] Conservative mode — skipping Instagram/Pinterest/YouTube/Twitter/FBPages (5 Apify calls saved)`);
      }

      const settled = await Promise.allSettled(scraperPromises);
      const [fbGroups, redditBuiltinData, instaData, pinterestData, youtubeData, twitterData, fbPagesData] = [
        settled[0], settled[1],
        settled[2] || { status: "rejected" as const, reason: "skipped" },
        settled[3] || { status: "rejected" as const, reason: "skipped" },
        settled[4] || { status: "rejected" as const, reason: "skipped" },
        settled[5] || { status: "rejected" as const, reason: "skipped" },
        settled[6] || { status: "rejected" as const, reason: "skipped" },
      ];

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

    // ── BUYERBOT PROMPT ──
    const systemPrompt = enrichmentPrefix + listingIntelligence + realBuyerContext + `You are a world-class buyer acquisition specialist and marketplace researcher. You have 15 years of experience finding buyers for every type of item — from antiques to electronics to vehicles. You know every platform, every community, every trick to find the RIGHT buyer who will pay the best price.

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

IMPORTANT INSTRUCTIONS:
- Generate 4-6 buyer profiles (not more).
- Generate 4-5 platform opportunities (not more).
- Generate 2-3 outreach strategies with SHORT message templates.
- Generate 3-4 hot leads.
- Be SPECIFIC. Don't say 'post on Facebook.' Say which specific groups or communities.
- Consider the seller's location (Maine) for local opportunities.
- Message templates must sound HUMAN and WARM — never like a bot or spam.
${isAntique ? "- This IS an antique: include auction houses, collector forums, specialty dealers." : ""}
${isVehicle ? "- This IS a vehicle: focus on LOCAL buyers, dealerships, enthusiast groups within 100 miles. LOCAL PICKUP ONLY." : ""}
- Every recommendation must be actionable — the seller should be able to DO something immediately.
- All prices in USD.

OUTREACH SPECIFICITY RULES:
- For EVERY outreach strategy, include a SPECIFIC action the seller can take RIGHT NOW:
  • "Join the Facebook group '[GROUP NAME]' and post your item with these photos"
  • "Search Reddit r/[SUBREDDIT] for 'WTB [ITEM]' posts from the last 30 days and reply"
  • "Email [TYPE OF DEALER] shops in [AREA] with this template"
  • "Message @[HANDLE] on Instagram — they post [CATEGORY] items regularly"
- Message templates must include the ITEM NAME ($${midPrice}), PRICE, and CONDITION — not generic placeholders.
- Include specific URLs, group names, subreddit names, and handles where the scraper data found real communities.
- Every outreach action should be completable in under 2 minutes.

WEB SEARCH INSTRUCTIONS:
If you have web search capability, USE IT AGGRESSIVELY to find real buyers:
1. Search Facebook Groups for "${category} buy sell" and "${itemName} wanted"
2. Search eBay for "${itemName}" to see who's bidding on similar items
3. Search Reddit for relevant subreddits (e.g. WTB posts, collector communities)
4. Search Craigslist for "${category} wanted" postings
5. Search collector forums for "${ai.brand || ""} ${itemName} wanted" or "ISO"
6. Search Instagram hashtags like #${category.replace(/\s/g, "")}collector

For each hot lead, include WHERE you found evidence of their interest.
Include a "web_sources" array in your response with {"url": "...", "title": "..."} objects for pages you found. If no web search performed, return empty array.`;

    let buyerbotResult: any;

    if (openai) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60_000);
      try {
        const photoDescs = item.photos.map((p) =>
          `[Photo: ${p.filePath}${p.caption ? ` — ${p.caption}` : ""}]`
        );

        const response = await openai.responses.create({
          model: "gpt-4o-mini",
          instructions: systemPrompt,
          input: `Find the best buyers for this item. Photos: ${photoDescs.join(", ")}. Return ONLY valid JSON — keep values short and compact.`,
          tools: [{ type: "web_search_preview" as any }],
          max_output_tokens: 16384,
        }, { signal: controller.signal });

        const text = typeof response.output === "string"
          ? response.output
          : response.output_text || JSON.stringify(response.output);

        buyerbotResult = parseAiJson(text);
        if (!buyerbotResult) {
          console.error("[buyerbot] Failed to parse AI response. Length:", text.length);
          console.error("[buyerbot] First 200:", text.slice(0, 200));
          console.error("[buyerbot] Last 300:", text.slice(-300));
          console.error("[buyerbot] Cleaned first 200:", text.replace(/```(?:json)?\s*/gi, "").replace(/```/g, "").trim().slice(0, 200));
          // Last resort: try extracting any valid JSON substring
          const fallbackMatch = text.match(/\{[\s\S]{100,}\}/);
          if (fallbackMatch) {
            // Aggressively truncate at last complete key-value pair
            let truncated = fallbackMatch[0];
            // Find the last valid closing point
            for (let i = truncated.length - 1; i > truncated.length - 200; i--) {
              const sub = truncated.slice(0, i);
              // Count braces
              let b = 0, a = 0;
              for (const c of sub) { if (c === "{") b++; else if (c === "}") b--; if (c === "[") a++; else if (c === "]") a--; }
              let attempt = sub;
              for (let j = 0; j < a; j++) attempt += "]";
              for (let j = 0; j < b; j++) attempt += "}";
              try { buyerbotResult = JSON.parse(attempt); console.log("[buyerbot] Recovered via truncation at offset", i); break; } catch { /* continue */ }
            }
          }
          if (!buyerbotResult) {
            throw new Error("AI returned unparseable response — retry recommended");
          }
        }

        // Extract web search citations
        const webSources: Array<{ url: string; title: string }> = [];
        try {
          const outputArr = Array.isArray(response.output) ? response.output : [];
          for (const outItem of outputArr) {
            if ((outItem as any).type === "web_search_call" && Array.isArray((outItem as any).results)) {
              for (const r of (outItem as any).results) {
                if (r.url && r.title) webSources.push({ url: r.url, title: r.title });
              }
            }
            if ((outItem as any).type === "message" && Array.isArray((outItem as any).content)) {
              for (const c of (outItem as any).content) {
                if (c.annotations) {
                  for (const ann of c.annotations) {
                    if (ann.type === "url_citation" && ann.url) webSources.push({ url: ann.url, title: ann.title || ann.url });
                  }
                }
              }
            }
          }
        } catch { /* citation extraction non-critical */ }
        if (!buyerbotResult.web_sources) buyerbotResult.web_sources = [];
        if (webSources.length > 0) buyerbotResult.web_sources = [...webSources, ...(buyerbotResult.web_sources || [])];
      } catch (aiErr: any) {
        console.error("[buyerbot] OpenAI error:", aiErr);
        return NextResponse.json({ error: `BuyerBot AI analysis failed: ${aiErr?.message ?? String(aiErr)}` }, { status: 422 });
      } finally {
        clearTimeout(timeoutId);
      }
    } else {
      buyerbotResult = generateDemoResult(itemName, category, midPrice, era, material, sellerZip, isAntique, isVehicle);
      buyerbotResult._isDemo = true;
    }

    // Validate expected fields
    const requiredKeys = [
      "buyer_profiles", "platform_opportunities", "outreach_strategies",
      "local_opportunities", "hot_leads", "competitive_landscape",
      "timing_advice", "executive_summary",
    ];
    for (const key of requiredKeys) {
      if (buyerbotResult[key] === undefined) buyerbotResult[key] = null;
    }

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
        payload: JSON.stringify({ userId: user.id, timestamp: new Date().toISOString() }),
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
