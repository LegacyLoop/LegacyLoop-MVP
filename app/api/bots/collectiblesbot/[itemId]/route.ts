import { NextRequest, NextResponse } from "next/server";
import { authAdapter } from "@/lib/adapters/auth";
import { prisma } from "@/lib/db";
import OpenAI from "openai";
// STEP 4.7: pre-pass OpenAI web search for real-time collector market data
import { runWebSearchPrepass } from "@/lib/bots/web-search-prepass";
import { getItemEnrichmentContext } from "@/lib/enrichment";
import { logUserEvent } from "@/lib/data/user-events";
import { canUseBotOnTier, BOT_CREDIT_COSTS } from "@/lib/constants/pricing";
import { isDemoMode } from "@/lib/bot-mode";
import { checkCredits, deductCredits, hasPriorBotRun } from "@/lib/credits";
import fs from "fs";
import path from "path";
import { getMarketIntelligence } from "@/lib/market-intelligence/aggregator";
import { scrapeChrono24 } from "@/lib/market-intelligence/adapters/chrono24";
import { scrapeStockX } from "@/lib/market-intelligence/adapters/stockx";
import { scrapeGoat } from "@/lib/market-intelligence/adapters/goat";
import { scrapeTcgplayerApify } from "@/lib/market-intelligence/adapters/tcgplayer-apify";
import { scrapeCourtyard } from "@/lib/market-intelligence/adapters/courtyard";
// CMD-FLAG-FINAL-WIRING: cache-first wrappers replace direct scraper imports.
// On cache hit → $0 cost, on miss → live scrape + persist to ScraperComp.
import { cachedPriceCharting as scrapePriceCharting } from "@/lib/market-intelligence/scraper-dispatch";
import { cachedPsaCard as scrapePsaCard } from "@/lib/market-intelligence/scraper-dispatch";
import { cachedBeckett as scrapeBeckettHtml } from "@/lib/market-intelligence/scraper-dispatch";
// CMD-COLLECTIBLESBOT-CORE-A: hybrid router + spec context + skill pack
import { routeCollectiblesBotHybrid } from "@/lib/adapters/bot-ai-router";
import { buildItemSpecContext } from "@/lib/bots/item-spec-context";
import { summarizeSpecContext } from "@/lib/bots/spec-guards";
import { loadSkillPack } from "@/lib/bots/skill-loader";

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

function safeJson(s: string | null | undefined): any {
  if (!s) return null;
  try { return JSON.parse(s); } catch { return null; }
}

// CMD-CLOUDINARY-PHOTO-READ-FIX: URL-aware photo reading
import { readPhotoAsBuffer, guessMimeType } from "@/lib/adapters/storage";

async function fileToDataUrl(filePath: string) {
  const buffer = await readPhotoAsBuffer(filePath);
  const mime = guessMimeType(filePath);
  return `data:${mime};base64,${buffer.toString("base64")}`;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  try {
    const user = await authAdapter.getSession();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { itemId } = await params;

    const existing = await prisma.eventLog.findFirst({
      where: { itemId, eventType: "COLLECTIBLESBOT_RESULT" },
      orderBy: { createdAt: "desc" },
    });

    if (!existing) return NextResponse.json({ hasResult: false, result: null });

    return NextResponse.json({
      hasResult: true,
      result: safeJson(existing.payload),
      createdAt: existing.createdAt,
    });
  } catch (e) {
    console.error("[collectiblesbot GET]", e);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}

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
      if (!canUseBotOnTier(user.tier, "collectiblesBot")) {
        return NextResponse.json({ error: "upgrade_required", message: "Upgrade your plan to access CollectiblesBot.", upgradeUrl: "/pricing?upgrade=true" }, { status: 403 });
      }
      const isRerun = await hasPriorBotRun(user.id, itemId, "COLLECTIBLESBOT");
      const cost = isRerun ? BOT_CREDIT_COSTS.collectiblesBotReRun : BOT_CREDIT_COSTS.collectiblesBotRun;
      const cc = await checkCredits(user.id, cost);
      if (!cc.hasEnough) {
        return NextResponse.json({ error: "insufficient_credits", message: "Not enough credits to run CollectiblesBot (2 credits).", balance: cc.balance, required: cost, buyUrl: "/credits" }, { status: 402 });
      }
      await deductCredits(user.id, cost, isRerun ? "CollectiblesBot re-run" : "CollectiblesBot run", itemId);
    }

    const item = await prisma.item.findUnique({
      where: { id: itemId },
      include: {
        aiResult: true,
        valuation: true,
        antiqueCheck: true,
        photos: { orderBy: { order: "asc" }, take: 6 },
      },
    });

    if (!item) return NextResponse.json({ error: "Item not found" }, { status: 404 });
    if (item.userId !== user.id) return NextResponse.json({ error: "Not your item" }, { status: 403 });

    const ai = safeJson(item.aiResult?.rawJson);
    if (!ai) return NextResponse.json({ error: "Run AI analysis first" }, { status: 400 });

    const v = item.valuation;
    const itemName = ai.item_name || item.title || "Unknown item";
    const category = ai.category || "General";
    const material = ai.material || "Unknown";
    const era = ai.era || "Unknown";
    const brand = ai.brand || ai.maker || "Unknown";
    const conditionScore = ai.condition_score || 7;
    const conditionLabel = conditionScore >= 8 ? "Excellent" : conditionScore >= 5 ? "Good" : "Fair";
    const estimatedLow = v ? Math.round(v.low) : 0;
    const estimatedHigh = v ? Math.round(v.high) : 0;
    const estimatedMid = v?.mid ? Math.round(v.mid) : v ? Math.round((v.low + v.high) / 2) : 0;
    const isCollectible = ai.is_collectible || false;
    const aiKeywords = ai.keywords || [];

    // ── CROSS-BOT ENRICHMENT ──
    const enrichment = await getItemEnrichmentContext(itemId, "collectiblesbot").catch(() => null);
    const enrichmentPrefix = enrichment?.hasEnrichment ? enrichment.contextBlock + "\n\n" : "";

    // CMD-COLLECTIBLESBOT-CORE-A: skill pack + spec context (gap closure).
    // skill-loader is process-cached → zero cost on warm calls.
    // buildItemSpecContext reads live Item fields (saleZip, saleMethod,
    // shippingDifficulty, weightLbs, etc.) and produces a prompt-ready
    // block + a structured summary persisted in COLLECTIBLESBOT_RUN.
    // Skills folder is empty until CMD-COLLECTIBLESBOT-SKILLS-B ships —
    // loadSkillPack returns empty SkillPack, skillPackPrefix is "" until
    // Round B. Wiring lives here from CORE-A so the telemetry schema is
    // complete on day one.
    const skillPack = loadSkillPack("collectiblesbot");
    const specContext = await buildItemSpecContext(item.id, { item, user });
    const specSummary = summarizeSpecContext(specContext);
    const skillPackPrefix = skillPack.systemPromptBlock
      ? skillPack.systemPromptBlock + "\n\n"
      : "";
    const specPromptPrefix = specContext.promptBlock
      ? specContext.promptBlock + "\n\n"
      : "";

    // ── REAL COLLECTIBLES MARKET DATA ──
    // CMD-COLLECTIBLESBOT-CORE-A: hoist marketIntel so the post-AI
    // block below can reuse it instead of firing a duplicate
    // getMarketIntelligence call (FLAG-CB-2 cleanup).
    let marketIntel: Awaited<ReturnType<typeof getMarketIntelligence>> | null = null;
    let collectiblesMarketContext = "";
    try {
      const sellerZip = item.saleZip || "04901";
      marketIntel = await getMarketIntelligence(
        itemName,
        category,
        sellerZip,
        undefined, // phase1Only
        undefined, // isMegaBot
        "collectiblesbot", // CMD-SCRAPER-WIRING-C2
      );
      if (marketIntel?.comps?.length > 0) {
        const specialtyComps = marketIntel.comps.filter((c: any) =>
          c.platform.includes("TCGPlayer") || c.platform.includes("Discogs") ||
          c.platform.includes("Heritage") || c.platform.includes("eBay")
        );
        collectiblesMarketContext = `\n\nREAL COLLECTIBLES MARKET DATA (scraped from actual marketplaces):
${(specialtyComps.length > 0 ? specialtyComps : marketIntel.comps).slice(0, 10).map((c: any, i: number) =>
  `${i + 1}. [${c.platform}] "${c.item}" — $${c.price}${c.date ? ` (${c.date})` : ""}${c.condition ? ` [${c.condition}]` : ""}`
).join("\n")}
Median: $${marketIntel.median} | Range: $${marketIntel.low}–$${marketIntel.high} | Trend: ${marketIntel.trend}
Sources: ${marketIntel.sources?.join(", ")}

CRITICAL: These are REAL comparable sales. Your grading assessment, value estimates, and platform recommendations MUST be anchored to this real data. If your estimate differs >30% from the median, explain WHY.`;
        console.log(`[CollectiblesBot] ${marketIntel.comps.length} real comps from ${marketIntel.sources?.join(", ")}`);
      }
    } catch {
      console.log("[CollectiblesBot] Market intelligence unavailable — proceeding with AI-only analysis");
    }

    // ── CATEGORY-SPECIFIC SPECIALTY SCRAPERS ──
    let specialtyContext = "";
    try {
      const catLower = (category || "").toLowerCase();
      if (catLower.match(/watch|horol|timepiece|rolex|omega|breitling|patek|cartier/)) {
        const chrono = await scrapeChrono24(itemName).catch(() => null);
        if (chrono?.success && chrono.comps.length > 0) {
          specialtyContext += `\n\nCHRONO24 WATCH MARKET (${chrono.comps.length} listings):
${chrono.comps.slice(0, 6).map((c: any, i: number) => `${i + 1}. "${c.item}" — $${c.price}${c.condition ? ` [${c.condition}]` : ""}`).join("\n")}`;
        }
      }
      if (catLower.match(/sneaker|shoe|jordan|nike|yeezy|streetwear|supreme/)) {
        const [sxResult, gtResult] = await Promise.allSettled([scrapeStockX(itemName), scrapeGoat(itemName)]);
        const sx = sxResult.status === "fulfilled" ? sxResult.value : null;
        const gt = gtResult.status === "fulfilled" ? gtResult.value : null;
        if (sx?.success && sx.comps.length > 0) specialtyContext += `\n\nSTOCKX (${sx.comps.length} results): ${sx.comps.slice(0, 4).map((c: any) => `$${c.price}`).join(", ")}`;
        if (gt?.success && gt.comps.length > 0) specialtyContext += `\n\nGOAT (${gt.comps.length} results): ${gt.comps.slice(0, 4).map((c: any) => `$${c.price}`).join(", ")}`;
      }
      // Trading cards / sports cards / collectible cards routing
      if (catLower.match(/card|pokemon|magic|yugioh|tcg|trading|sports.?card|baseball|football|basketball|hockey/)) {
        // MARGIN-FIX (Step 4.6): dropped Courtyard from card routing.
        // Niche fractional-investor data, low value for typical sellers.
        // Saves ~$0.40/call. Cards now run TCGPlayer + PriceCharting + PSAcard (3 max).
        const tcgApifyResult = await scrapeTcgplayerApify(itemName).catch(() => null);
        const tcgApify = tcgApifyResult;
        if (tcgApify?.success && tcgApify.comps.length > 0) {
          specialtyContext += `\n\nTCGPLAYER DEEP DATA (${tcgApify.comps.length} listings — Apify):
${tcgApify.comps.slice(0, 8).map((c: any, i: number) => `${i + 1}. "${c.item}" — $${c.price}${c.condition ? ` [${c.condition}]` : ""}`).join("\n")}`;
        }
      }
      // PriceCharting + PSAcard — Beckett equivalent for graded + ungraded price guide data
      if (catLower.match(/card|pokemon|magic|yugioh|tcg|trading|sports.?card|video.?game|comic|coin|funko|lego/)) {
        const pcCategory = catLower.match(/video.?game/) ? "video-games"
          : catLower.match(/comic/) ? "comics"
          : catLower.match(/coin|numismatic/) ? "coins"
          : catLower.match(/funko/) ? "funko"
          : catLower.match(/lego/) ? "lego-sets"
          : "trading-cards";

        // CMD-COLLECTIBLESBOT-CORE-A: Beckett HTML (free Tier 1 builtin)
        // joins PriceCharting + PSACard in the card-specialty parallel
        // pull. Free = $0.00 Apify cost. Graceful degrade on DOM drift.
        // FLAG-CB-3-DEFERRED: PSA Population Report Integration
        // Currently, scrapePsaCard returns AUCTION HISTORY (graded card sales),
        // NOT population data (total graded count by grade level).
        // Live pop report integration would require:
        //   1. New adapter: lib/market-intelligence/adapters/psa-pop.ts
        //   2. Scraper registry entry with cost tier
        //   3. ScraperComp cache integration
        //   4. Context formatting for the prompt
        // PSA pop data is behind psacard.com/pop (no official public API).
        // Would need Apify scraper or HTML parser.
        // For now, pop report data is advisory only — the AI references
        // population data from its training knowledge. Live data would
        // improve accuracy for high-value graded cards.
        // Injection point for future live pop report: add to this
        // Promise.allSettled block alongside PriceCharting + PSACard + Beckett.
        const [pcResult, psaResult, beckettResult] = await Promise.allSettled([
          scrapePriceCharting(itemName, pcCategory),
          scrapePsaCard(itemName),
          scrapeBeckettHtml(itemName),
        ]);

        const pc = pcResult.status === "fulfilled" ? pcResult.value : null;
        const psa = psaResult.status === "fulfilled" ? psaResult.value : null;
        const beckett = beckettResult.status === "fulfilled" ? beckettResult.value : null;

        if (pc?.success && pc.comps.length > 0) {
          const ungraded = pc.comps.filter((c: any) => c.condition?.includes("Ungraded"));
          const graded7 = pc.comps.filter((c: any) => c.condition?.includes("~7"));
          const graded8 = pc.comps.filter((c: any) => c.condition?.includes("~8"));

          specialtyContext += `\n\nPRICECHARTING PRICE GUIDE — BECKETT EQUIVALENT (${pc.comps.length} results):`;
          if (ungraded.length > 0) specialtyContext += `\nUngraded/Raw:\n${ungraded.slice(0, 5).map((c: any, i: number) => `${i + 1}. "${c.item}" — $${c.price}`).join("\n")}`;
          if (graded7.length > 0) specialtyContext += `\nGraded ~PSA 7:\n${graded7.slice(0, 3).map((c: any, i: number) => `${i + 1}. "${c.item}" — $${c.price}`).join("\n")}`;
          if (graded8.length > 0) specialtyContext += `\nGraded ~PSA 8+:\n${graded8.slice(0, 3).map((c: any, i: number) => `${i + 1}. "${c.item}" — $${c.price}`).join("\n")}`;
          specialtyContext += `\nCRITICAL: PriceCharting is the industry standard price guide (like Beckett). Use these as your PRIMARY valuation anchor.`;
        }

        if (psa?.success && psa.comps.length > 0) {
          specialtyContext += `\n\nPSACARD AUCTION HISTORY (${psa.comps.length} graded card sales):
${psa.comps.slice(0, 8).map((c: any, i: number) => `${i + 1}. "${c.item}" — $${c.price} [${c.condition}]${c.date ? ` (${c.date})` : ""}`).join("\n")}
These are REAL PSA graded card auction results. Use these to validate your graded value estimates at each PSA tier.`;
        }

        // CMD-COLLECTIBLESBOT-CORE-A: Beckett Marketplace (free HTML)
        if (beckett?.success && beckett.comps.length > 0) {
          specialtyContext += `\n\nBECKETT MARKETPLACE (${beckett.comps.length} collector listings):
${beckett.comps.slice(0, 8).map((c: any, i: number) => `${i + 1}. "${c.item}" — $${c.price}${c.condition ? ` [${c.condition}]` : ""}`).join("\n")}
These are REAL collector-market listings from Beckett. Combined with PriceCharting + PSACard, you now have three independent graded-card price sources to triangulate your estimate.`;
        }
      }
    } catch { /* non-critical */ }

    // STEP 4.7: OpenAI web_search_preview pre-pass for real-time collector market data
    const _sellerZip = item.saleZip || "04901";
    const { webEnrichment, webSources: prepassWebSources } = await runWebSearchPrepass(
      openai,
      itemName,
      category,
      _sellerZip,
    );

    // CMD-COLLECTIBLESBOT-CORE-A: skill pack + spec context prepended to
    // the existing prompt assembly. Order: skills → seller spec →
    // cross-bot enrichment → market context → specialty scrapers →
    // web pre-pass → core specialist prompt.
    const systemPrompt = skillPackPrefix + specPromptPrefix + enrichmentPrefix + collectiblesMarketContext + specialtyContext + webEnrichment + `You are a world-class collectibles specialist with deep expertise across ALL major collector markets. You have encyclopedic knowledge of grading standards, auction records, population reports, and current market conditions.

YOUR SPECIALTY MARKETS — you must actively reference these in every analysis:
- Sports Cards: PSA, BGS/Beckett, SGC grading scales. eBay sold listings, PWCC Marketplace, Goldin Auctions, Beckett Marketplace, SportLots, Comc.com, MySlabs
- Trading Cards (Pokemon, Magic, Yu-Gi-Oh): TCGPlayer, CardMarket, eBay, PWCC, CGC grades
- Comics: CGC, CBCS grading. MyComicShop, GoCollect, Heritage Auctions, ComicConnect
- Coins & Currency: PCGS, NGC grading. GreatCollections, Heritage Auctions, APMEX
- Stamps: Scott catalog values, Mystic Stamp, Siegel Auction
- Autographs & Memorabilia: JSA, PSA/DNA authentication. RR Auction, Heritage, Lelands
- Vintage Toys & Action Figures: AFA grading. eBay, Hake's Auctions, Heritage
- Video Games: WATA, VGA grading. eBay, Heritage, GameValueNow
- Vinyl Records: Discogs, eBay — Goldmine grading scale
- Funko Pops, Hot Wheels, Pokémon: eBay, Pop Price Guide, Entertainment Earth
- Watches & Horology: Chrono24, WatchCharts, Hodinkee, Bob's Watches. Reference numbers, serial dating, dial variations, B&P premiums.
- Estate Jewelry & Gemstones: 1stDibs, Ruby Lane, Lang Antiques, Heritage. GIA/IGI/AGS certs. Signed pieces (Tiffany, Cartier, Van Cleef, Bulgari).
- Rare Books & Manuscripts: AbeBooks, Biblio, Heritage, Bonhams, Sotheby's. First edition points, dust jacket grading, binding states.
- Sneakers & Streetwear: StockX, GOAT, eBay, Stadium Goods, Flight Club. DS/VNDS grading, box condition, authentication.
- Minerals, Fossils & Meteorites: Heritage, Bonhams, Mindat.org. Locality provenance, crystal form, specimen tiers, meteorite classification.

Item: ${itemName}
Category: ${category}
Material: ${material}
Era: ${era}
Brand/Maker: ${brand}
Condition: ${conditionLabel} (${conditionScore}/10)
Price range: $${estimatedLow} - $${estimatedHigh} (mid $${estimatedMid})
${isCollectible ? `AI pre-identified this as a COLLECTIBLE. Confirm and provide grading assessment.` : ""}
${aiKeywords.length > 0 ? `Relevant keywords: ${aiKeywords.join(", ")}` : ""}

VALUATION METHODOLOGY — you must follow this exactly:
1. Identify the EXACT item — full name, year, set, variation, print run if applicable
2. State the current RAW (ungraded) value range with specific reasoning
3. State the graded value range at each relevant grade tier (e.g. PSA 6, PSA 8, PSA 10)
4. Cite the PRIMARY market data source driving your valuation (recent eBay sales, auction results, population reports)
5. Explain WHY the range is what it is — condition factors, rarity, demand signals, recent trend
6. Never give a wide vague range without explaining the spread — if the range is wide, explain exactly what pushes toward low vs high end

GRADING ASSESSMENT:
- Estimate the likely grade based on described condition and storage
- State what grade improvements would do to value
- Give a grading recommendation with ROI reasoning — is it worth grading given the cost vs value uplift?

RARITY & POPULATION DATA:
- Reference population report data where known (PSA pop, BGS pop)
- Note print run size if known
- Identify any known variations, errors, or chase variants that affect value

MARKET TIMING:
- Note current demand trend (rising, stable, declining) with reasoning
- Identify the best selling window if seasonal patterns apply
- State the single best platform for this specific item with reasoning

RESPONSE FORMAT — return valid JSON only, no wrapper keys, no markdown:
{
  "item_name": "exact full item name",
  "year": "year",
  "brand_series": "brand or series name",
  "edition_variation": "specific edition, variation, or rookie designation",
  "category": "specific category",
  "subcategory": "specific subcategory",
  "rarity": "Common | Uncommon | Rare | Very Rare | Ultra Rare",
  "condition_assessment": "detailed condition assessment",
  "estimated_grade": "estimated PSA/BGS/CGC grade if applicable",
  "grade_confidence": 0.0,
  "raw_value_low": 0,
  "raw_value_mid": 0,
  "raw_value_high": 0,
  "value_reasoning": "specific explanation of why this range — what pushes toward low vs high end",
  "graded_values": {
    "grade_label": "e.g. PSA 6 / PSA 8 / PSA 10",
    "low_grade_value": 0,
    "mid_grade_value": 0,
    "high_grade_value": 0
  },
  "valuation_source": "primary data source driving this valuation",
  "population_data": "known population report data or null",
  "print_run": "known print run or null",
  "notable_variations": "any valuable variations or errors to check for",
  "grading_recommendation": "Skip Grading | Consider Grading | Strongly Recommend Grading",
  "grading_roi_reasoning": "specific ROI reasoning — cost of grading vs value uplift",
  "demand_trend": "Rising | Stable | Declining",
  "demand_reasoning": "why demand is trending this direction",
  "best_platform": "single best selling platform for this specific item",
  "platform_reasoning": "why this platform specifically",
  "selling_strategy": "specific actionable selling advice",
  "potential_value": "Low | Moderate | High | Very High | Exceptional",
  "collector_notes": "anything a serious collector would want to know",
  "authenticated": false,
  "provenance_confirmed": false,
  "visual_grading": {
    "psa_grade": "estimated PSA grade (e.g. PSA 8)",
    "bgs_grade": "estimated BGS with subgrades (e.g. BGS 8.5: Cen 9/Cor 8/Edg 8.5/Sur 8.5)",
    "grade_confidence": 0.75,
    "corners": "detailed corner analysis for all 4 corners",
    "edges": "detailed edge analysis all 4 sides",
    "surface": "front and back surface condition",
    "centering": "centering percentage (e.g. 55/45 LR, 60/40 TB)",
    "grade_reasoning": "3+ specific visual observations supporting grade"
  },
  "collection_context": {
    "set_name": "full set name or null",
    "set_total": 0,
    "card_number": "number within set or null",
    "is_key_card": true,
    "key_card_reason": "why this is key (rookie, SP, insert, error) or null",
    "set_completion_hint": "advice on completing this set or null",
    "collection_category_tag": "category tag for collection tracking"
  },
  "price_history": {
    "trend_6mo": "Rising | Stable | Declining",
    "trend_1yr": "Rising | Stable | Declining",
    "trend_3yr": "Rising | Stable | Declining",
    "peak_price": "highest known sale with date or null",
    "floor_price": "lowest recent sale at this condition or null",
    "catalyst_events": "upcoming events that could affect price or null"
  },
  "investment": {
    "price_1yr": "1-year projection with reasoning",
    "price_5yr": "5-year projection with reasoning",
    "catalysts": "specific value drivers",
    "risks": "specific downside risks",
    "verdict": "Hold | Sell Now | Grade and Hold | Grade and Sell"
  },
  "authentication_services": {
    "recommended_service": "best authentication/grading service for this specific item",
    "estimated_cost": "$XX-XX",
    "turnaround_time": "X-X weeks standard, X days express",
    "value_with_authentication": "estimated value after professional authentication/grading"
  },
  "liquidity_assessment": {
    "time_to_sell": "estimated days/weeks/months to sell at fair market value",
    "market_depth": "Deep | Moderate | Thin | Niche",
    "best_selling_window": "optimal time or market condition to sell",
    "reasoning": "why this item will sell fast or slow"
  },
  "insurance_valuation": {
    "replacement_value": 0,
    "reasoning": "why replacement value differs from market"
  },
  "condition_history": {
    "restoration_flags": "any visible signs of restoration, cleaning, alteration, or repair",
    "red_flags": "specific concerns about authenticity, condition, or provenance",
    "provenance_notes": "any provenance indicators or chain of ownership details"
  },
  "comparable_sales": [
    { "item": "exact description", "price": 0, "date": "YYYY-MM", "platform": "where sold", "condition": "grade/condition" }
  ],
  "executive_summary": "5-6 sentences: what this is, exact value reasoning, grading recommendation, best platform, key insight for seller"
}

SPORTS CARD GRADING STANDARDS:
- PSA 10 (Gem Mint): 55/45 centering or better, sharp corners under 10x loupe, zero defects. 1-3% of submissions.
- PSA 9 (Mint): 55/45 centering, one minor flaw allowed. PSA 8 (NM-MT): 60/40 centering, minor corner wear under magnification.
- PSA 7 (NM): 65/35 centering, light corner wear visible. PSA 6 (EX-MT): 70/30, visible wear on 2+ corners.
- BGS subgrades: Centering, Corners, Edges, Surface (1-10 with half points). BGS 9.5 = Gem Mint, BGS Black Label 10 = all four 10s (ultra premium).
- SGC gaining share for vintage pre-1970. Stricter centering.
- Rookie Card (RC) = 2-10x price vs non-rookie. True RC vs XRC vs Prospect — identify correctly.
- Parallel hierarchy: 1/1 Superfractor > Auto Patch /5 > /10 > /25 > Refractor /50 > Base. On-card auto > sticker auto (20-50% premium).

POKEMON/TCG EXPERTISE:
- Base Set 1st Edition Shadowless (1999): No shadow right side + "1st Edition" stamp. PSA 10 Shadowless Charizard: $300K+.
- Unlimited vs Shadowless vs 1st Ed: massive value gaps. Japanese vs English: different markets.
- Modern chase: Illustration Rare, SAR, Alt Art, Gold Star. Pull rates determine scarcity.
- MTG Reserved List: ~570 cards never reprinted, finite supply. Alpha (1993) = most valuable set. Power 9: Black Lotus $100K-$500K+.
- Yu-Gi-Oh: 1st Ed LOB most valuable English set. Ghost Rares, Starlight Rares = massive premiums.

COMICS (CGC/CBCS):
- CGC labels: Universal (blue), Signature Series (yellow, witnessed), Restored (purple, -50-80% value), Qualified (green).
- 9.8 = highest common grade. Census at cgc.com/census. CBCS = 10-20% lower prices vs CGC same grade.
- Key issues: First Appearance > Origin Story > First Cover. Action Comics #1, Amazing Fantasy #15, Detective Comics #27.
- Page quality: White > Off-White/White > Off-White > Cream. White pages = premium.
- Pressing (accepted, no label impact) vs Cleaning (restoration, purple label, massive devalue).

COINS (Sheldon 1-70):
- MS-70 = perfect. MS-65 = Gem. AU-50-58 = traces of wear. VF/EF = moderate wear.
- PCGS commands 5-15% premium over NGC. CAC green bean = 10-15% premium, gold bean = 20-40%.
- Die varieties (DDO/DDR) = massive premiums. Mint marks: CC (Carson City) = always premium.
- Full designations (FB/FS/FH) add 20-100%+. Natural toning CAN add value.

VINYL (Goldmine):
- NM (Near Mint) = standard collectible value. VG+ = ~50% of NM. VG = ~25%. Each step down = ~50% loss.
- First pressing ID: matrix/dead wax numbers, label variations. UK originals often more valuable for British artists.
- Japanese OBI strip = premium. Mono vs Stereo pre-1970: mono often more valuable.

VINTAGE TOYS (AFA):
- AFA 90+ = museum quality. AFA 85-89 = investment grade. Below 75 = not typically worth grading.
- MISB/MOMC = 3-10x over loose. Loose complete = usable. Loose incomplete = 50-80% reduction per missing part.
- Star Wars 12-back = most valuable Kenner cards. Hot Wheels Redlines (1968-77) = red stripe tires ID original.

MEMORABILIA:
- PSA/DNA, JSA, BAS = trusted authentication. Unauthenticated = 70-90% value reduction.
- Game-worn photo-matched > Game-worn unmatched > Game-issued > Team-issued > Replica.

VIDEO GAMES (WATA/VGA):
- Dual grade: Game Grade + Seal Grade (A++ to C). CIB > Cart/Disc Only.
- Seal types: H-seam, Y-fold, shrink wrap, sticker seal, hangtab. Black Label > Greatest Hits.

WATCHES & HOROLOGY:
- Condition: NOS > Excellent > Very Good > Good > Fair > Poor. Unpolished case = premium.
- Box & Papers: Full set = 20-40% premium. Papers only = 10-15%. None = baseline.
- Reference numbers critical: Rolex 16610 vs 116610 = different eras/values. Dial variations (tropical, gilt) = vintage premium.
- Frankenwatch (mixed parts) = 50-80% reduction. Redial = 40-70% reduction.

ESTATE JEWELRY & GEMSTONES:
- GIA Report = gold standard for diamonds. Signed pieces (Tiffany, Cartier, Van Cleef) = 2-5x premium.
- Period authentication: Art Deco (1920-35), Retro (1935-50), Mid-Century (1950-70). Hallmarks verify.
- Original settings preferred. Stone replacement = significant reduction.

RARE BOOKS:
- First Edition First Printing = target. Dust jacket: Present = 5-10x over without.
- Binding: Original preferred. Rebinding = 50-80% reduction. Ex-library = 60-90% reduction.
- Author flat-signed = 2-5x premium. Edition points: number line, colophon.

SNEAKERS:
- Deadstock (DS) = full value. VNDS = 80-90%. Used = 40-70%. Size 9-12 = most liquid.
- OG All (box + accessories) = full value. No box = 25-40% reduction.
- Authentication essential: StockX Verified, GOAT Verified, CheckCheck.

MINERALS & FOSSILS:
- Locality: Famous localities = strong premium. Documented provenance = additional premium.
- Quality tiers: Museum > Cabinet > Miniature > Thumbnail > Micromount.
- Repairs = 50-80% reduction. Meteorites: Witnessed fall > Find. Classification required.

Be specific to the actual collectible category. All prices USD. Return ONLY JSON. Start with {. No markdown fences.`;

    let result: any;
    // CMD-COLLECTIBLESBOT-CORE-A: track hybrid run for telemetry.
    // Hoisted so the COLLECTIBLESBOT_RUN write below has access to
    // the merge strategy + confidence + cost data.
    let hybridRun: Awaited<ReturnType<typeof routeCollectiblesBotHybrid>> | null = null;

    if (openai) {
      try {
        // CMD-COLLECTIBLESBOT-CORE-A: route through routeCollectiblesBotHybrid.
        // Claude primary (nuanced grading reasoning) + OpenAI secondary
        // (fires when visual_grading.grade_confidence < 80). photoUrls
        // maps the item's photo file paths from the included relation.
        const photoUrls = item.photos.slice(0, 4).map((p: any) => p.filePath);
        if (photoUrls.length === 0) {
          return NextResponse.json(
            { error: "CollectiblesBot requires at least one photo for visual inspection." },
            { status: 400 },
          );
        }

        hybridRun = await routeCollectiblesBotHybrid({
          itemId: item.id,
          photoPath: photoUrls,
          gradingPrompt: systemPrompt,
          authConfidenceThreshold: 80,
          // AntiqueBot parity — 90s + 16k tokens to give Claude room
          // for the 15-category specialty grading schema.
          timeoutMs: 90_000,
          maxTokens: 16_384,
        });

        if (hybridRun.degraded || !hybridRun.mergedResult) {
          console.error(
            "[collectiblesbot] hybrid degraded:",
            hybridRun.error ?? "all providers failed",
          );
          return NextResponse.json(
            {
              error: `CollectiblesBot AI analysis failed: ${hybridRun.error ?? "all providers failed"}`,
            },
            { status: 422 },
          );
        }

        result = hybridRun.mergedResult;
      } catch (aiErr: any) {
        console.error("[collectiblesbot] router error:", aiErr);
        return NextResponse.json(
          { error: `CollectiblesBot AI analysis failed: ${aiErr?.message ?? String(aiErr)}` },
          { status: 422 },
        );
      }
    } else {
      // Demo generator with deterministic variation + category awareness
      const hash = itemName.split("").reduce((a: number, c: string) => a + c.charCodeAt(0), 0);
      const bucket = hash % 100;
      const variation = bucket < 50 ? "strong" : bucket < 75 ? "mid" : bucket < 90 ? "common" : "gem";
      const demoGrade = variation === "gem" ? "PSA 9" : variation === "strong" ? "PSA 8" : variation === "mid" ? "PSA 6" : "PSA 5";
      const demoConf = variation === "gem" ? 0.88 : variation === "strong" ? 0.78 : variation === "mid" ? 0.65 : 0.55;
      const demoRarity = variation === "gem" ? "Ultra Rare" : variation === "strong" ? "Rare" : variation === "mid" ? "Uncommon" : "Common";
      const demoPotential = variation === "gem" ? "Exceptional" : variation === "strong" ? "High" : variation === "mid" ? "Moderate" : "Low";
      const demoTrend = variation === "gem" || variation === "strong" ? "Rising" : variation === "mid" ? "Stable" : "Declining";
      const demoVerdict = variation === "gem" ? "Grade and Hold" : variation === "strong" ? "Grade and Sell" : variation === "mid" ? "Hold" : "Sell Now";
      const demoSentiment = variation === "gem" ? "Hot" : variation === "strong" ? "Warm" : variation === "mid" ? "Neutral" : "Cooling";
      const valMult = variation === "gem" ? 2.5 : variation === "strong" ? 1.5 : variation === "mid" ? 1.0 : 0.6;

      // Category detection
      const catLower = category.toLowerCase();
      const isCard = catLower.includes("card") || catLower.includes("comic") || catLower.includes("pokemon") || catLower.includes("tcg");
      const isWatch = catLower.includes("watch") || catLower.includes("horology");
      const isJewelry = catLower.includes("jewelry") || catLower.includes("jewel") || catLower.includes("gem");
      const isBook = catLower.includes("book") || catLower.includes("manuscript");
      const isSneaker = catLower.includes("sneaker") || catLower.includes("shoe") || catLower.includes("streetwear");
      const isMineral = catLower.includes("mineral") || catLower.includes("fossil") || catLower.includes("meteorite");
      const isCoin = catLower.includes("coin") || catLower.includes("currency") || catLower.includes("numismatic");

      const PLATFORM_MAP: Record<string, { platform: string; reasoning: string }> = {
        "Sports Cards": { platform: "PWCC Marketplace", reasoning: "Largest dedicated sports card auction house." },
        "Trading Cards": { platform: "TCGPlayer", reasoning: "Dedicated TCG marketplace with real-time pricing." },
        "Comics": { platform: "Heritage Auctions", reasoning: "Premier comics auction house." },
        "Coins & Currency": { platform: "GreatCollections", reasoning: "Specialized numismatic auction." },
        "Vinyl Records": { platform: "Discogs", reasoning: "World's largest music marketplace." },
        "Vintage Toys": { platform: "Hake's Auctions", reasoning: "Premier vintage toy auction house." },
        "Memorabilia": { platform: "Heritage Auctions", reasoning: "Leading memorabilia auction." },
        "Video Games": { platform: "Heritage Auctions", reasoning: "Record-breaking video game auctions." },
        "Watches": { platform: "Chrono24", reasoning: "World's largest watch marketplace." },
        "Estate Jewelry": { platform: "1stDibs", reasoning: "Premium estate jewelry marketplace." },
        "Rare Books": { platform: "AbeBooks", reasoning: "Largest rare book marketplace." },
        "Sneakers": { platform: "StockX", reasoning: "Leading sneaker marketplace with mandatory authentication." },
        "Minerals": { platform: "Heritage Auctions", reasoning: "Growing natural history department." },
      };
      const platformInfo = PLATFORM_MAP[category] || { platform: "eBay", reasoning: "Largest general collector marketplace." };

      result = {
        _isDemo: true,
        item_name: itemName,
        category,
        subcategory: category,
        year: era,
        brand_series: brand,
        edition_variation: isWatch ? `Ref. ${brand} ${(hash % 9000 + 1000)}` : isSneaker ? `${brand} Colorway ${era}` : isJewelry ? `${era} ${brand} Collection` : isBook ? "First Edition, First Printing" : isMineral ? `${material} specimen, ${era}` : "Standard Edition",
        rarity: demoRarity,
        condition_notes: isWatch ? `${conditionLabel} condition. ${conditionScore >= 7 ? "Case unpolished with original brushing. Crystal clean." : "Case shows desk-diving wear. Service history unknown."}` : isJewelry ? `${conditionLabel} condition. ${conditionScore >= 7 ? "Stones secure in original settings. Metal shows light patina." : "Minor wear to settings. Professional cleaning recommended."}` : isBook ? `${conditionLabel} condition. ${conditionScore >= 7 ? "Tight binding, clean pages, dust jacket present." : "Spine cocked, some foxing, dust jacket shows wear."}` : isSneaker ? `${conditionLabel} condition. ${conditionScore >= 7 ? "Deadstock with original box and tags." : "Light wear to soles, minor toe box creasing."}` : `${conditionLabel} condition. ${conditionScore >= 7 ? "Clean surfaces with minimal wear." : "Visible wear consistent with age."}`,
        raw_value_low: Math.round(estimatedLow * valMult),
        raw_value_mid: Math.round(estimatedMid * valMult),
        raw_value_high: Math.round(estimatedHigh * valMult),
        value_reasoning: `Based on recent sold listings for ${itemName} in ${conditionLabel.toLowerCase()} condition. ${variation === "gem" ? "Exceptional examples command significant premiums." : "Market data supports this range."}`,
        graded_values: isWatch ? { NOS: Math.round(estimatedMid * 2.5), Excellent: Math.round(estimatedMid * 1.5), Very_Good: Math.round(estimatedMid), Good: Math.round(estimatedMid * 0.7) } : isJewelry ? { With_GIA_Cert: Math.round(estimatedMid * 1.4), Without_Cert: Math.round(estimatedMid * 0.7), With_Original_Box: Math.round(estimatedMid * 1.15) } : isBook ? { Fine_With_DJ: Math.round(estimatedMid * 2.0), Near_Fine_With_DJ: Math.round(estimatedMid * 1.3), Very_Good_With_DJ: Math.round(estimatedMid), Good_No_DJ: Math.round(estimatedMid * 0.25) } : isSneaker ? { Deadstock_OG_All: Math.round(estimatedMid * 1.5), VNDS: Math.round(estimatedMid * 1.1), Used_With_Box: Math.round(estimatedMid * 0.7) } : isCoin ? { MS_70: Math.round(estimatedMid * 5), MS_65: Math.round(estimatedMid * 2), AU_58: Math.round(estimatedMid * 1.2), VF_30: Math.round(estimatedMid * 0.6) } : { PSA_5: Math.round(estimatedMid * 0.6), PSA_6: Math.round(estimatedMid * 0.8), PSA_7: Math.round(estimatedMid), PSA_8: Math.round(estimatedMid * 1.4), PSA_9: Math.round(estimatedMid * 2.2), PSA_10: Math.round(estimatedMid * 5) },
        grading_recommendation: isWatch ? (variation === "common" ? "Skip Service" : "Recommend Professional Service") : isJewelry ? (variation === "common" ? "Skip Certification" : "Recommend GIA Certification") : isSneaker ? (variation === "common" ? "Skip Authentication" : "Recommend StockX/GOAT Authentication") : variation === "common" ? "Skip Grading" : variation === "mid" ? "Consider Grading" : "Strongly Recommend Grading",
        grading_roi_reasoning: isWatch ? `Professional service cost ($200-500). ${variation === "common" ? "Value doesn't justify service" : `Documented service adds ~$${Math.round(estimatedMid * 0.3)} to value`}.` : isJewelry ? `GIA certification cost ($100-300). ${variation === "common" ? "May not be justified" : `Adds ~20-30% to realized price`}.` : isSneaker ? `Authentication cost ($10-25). ${variation === "common" ? "Only needed for non-authenticated platform" : "Essential for buyer confidence"}.` : `At estimated ${demoGrade}, grading cost ($25-50) ${variation === "common" || variation === "mid" ? "may not be justified" : `is justified by ~$${Math.round(estimatedMid * 0.4)} uplift`}.`,
        demand_trend: demoTrend,
        demand_reasoning: `${demoTrend} demand driven by ${demoTrend === "Rising" ? "growing collector interest and limited supply" : demoTrend === "Stable" ? "consistent collector base" : "market saturation in this category"}.`,
        best_platform: platformInfo.platform,
        platform_reasoning: platformInfo.reasoning,
        selling_strategy: isWatch ? `${variation === "gem" || variation === "strong" ? "Get service documentation, then list on Chrono24 with full B&P photos" : "List on Chrono24 or eBay with reference number and condition photos"}.` : isJewelry ? `${variation === "gem" || variation === "strong" ? "Get GIA certification, then list on 1stDibs" : "List on Ruby Lane or eBay with hallmark photos"}.` : isSneaker ? `${variation === "gem" || variation === "strong" ? "List on StockX for instant liquidity" : "List on GOAT or eBay with detailed photos"}.` : `${variation === "gem" || variation === "strong" ? "Grade first, then list as auction starting at $" + Math.round(estimatedMid * valMult * 0.7) : "List as Buy It Now at $" + Math.round(estimatedMid * valMult)}. Include detailed photos.`,
        potential_value: demoPotential,
        collector_notes: `${variation === "gem" ? "Exceptional example — seek professional authentication before selling." : "Standard collector piece with established market."}`,
        authenticated: false,
        provenance_confirmed: false,
        notable_variations: isWatch ? "Check for dial variations (tropical, gilt, spider), case references, and bracelet type." : isJewelry ? "Check for maker's marks, hallmarks, stone origin documentation." : isBook ? "Check for dust jacket price, edition points, and any inscriptions." : isSneaker ? "Check for special box packaging, extra laces, hang tags." : isMineral ? "Check for locality labels, collection provenance tags." : "Check for print errors, color variations, or first-run indicators.",
        community_sentiment: demoSentiment,
        visual_grading: isWatch ? { case_condition: variation === "gem" ? "Unpolished, original finish" : "Light wear", crystal_condition: variation === "gem" ? "Flawless" : "Light scratches", dial_condition: variation === "gem" ? "Original, perfect patina" : "Age-appropriate", bezel_condition: variation === "gem" ? "Vibrant, aligned" : "Minor fading", grade_confidence: demoConf, grade_reasoning: variation === "gem" ? "Exceptional preservation" : "Honest wear consistent with age" } : isJewelry ? { stone_condition: variation === "gem" ? "Stones secure, excellent brilliance" : "Stones secure with minor wear", setting_condition: variation === "gem" ? "All prongs tight, original design intact" : "Settings secure, minor wear", metal_condition: variation === "gem" ? "Original finish with desirable patina" : "Surface wear", hallmarks: variation === "gem" ? "Clear maker's marks visible" : "Marks present", grade_confidence: demoConf, grade_reasoning: variation === "gem" ? "Museum-quality preservation" : "Well-preserved with age wear" } : isBook ? { binding_condition: variation === "gem" ? "Tight, square — boards firm" : "Slightly cocked spine", pages_condition: variation === "gem" ? "Clean, white pages" : "Light toning", dust_jacket: variation === "gem" ? "Present, Near Fine" : variation === "strong" ? "Present, Very Good" : "Absent or Poor", grade_confidence: demoConf, grade_reasoning: variation === "gem" ? "Exceptional copy" : "Solid reading copy" } : isSneaker ? { upper_condition: variation === "gem" ? "Factory fresh, no creasing" : "Minimal creasing", sole_condition: variation === "gem" ? "Unworn" : "Light wear", midsole_condition: variation === "gem" ? "No yellowing" : "Minor yellowing", box_condition: variation === "gem" ? "OG box mint" : "OG box with shelf wear", grade_confidence: demoConf, grade_reasoning: variation === "gem" ? "True Deadstock" : "VNDS or lightly worn" } : { psa_grade: demoGrade, bgs_grade: `BGS ${parseFloat(demoGrade.replace("PSA ", "")) - 0.5}`, grade_confidence: demoConf, corners: variation === "gem" ? "Razor sharp all 4" : variation === "strong" ? "Sharp with minimal wear" : "Light wear on two corners", edges: variation === "gem" ? "Clean, no chipping" : "Minor roughness", surface: variation === "gem" ? "Perfect gloss" : "Light wear", centering: variation === "gem" ? "52/48 LR, 53/47 TB" : variation === "strong" ? "55/45 LR" : "60/40 LR", grade_reasoning: variation === "gem" ? "Top-tier example" : "Moderate condition" },
        collection_context: isWatch ? { set_name: `${brand} Reference Family`, set_total: null, card_number: null, is_key_card: variation === "gem", key_card_reason: variation === "gem" ? "Highly sought reference" : null, set_completion_hint: "Collectors pursue full reference families.", collection_category_tag: "watches" } : isJewelry ? { set_name: `${brand} ${era} Collection`, set_total: null, card_number: null, is_key_card: variation === "gem", key_card_reason: variation === "gem" ? "Iconic design — investment piece" : null, set_completion_hint: "Period-matched suites command premiums.", collection_category_tag: "jewelry" } : isBook ? { set_name: `${brand} Bibliography`, set_total: null, card_number: null, is_key_card: variation === "gem", key_card_reason: variation === "gem" ? "Landmark first edition" : null, set_completion_hint: "Complete first edition runs are highly prized.", collection_category_tag: "rare-books" } : isSneaker ? { set_name: `${brand} ${era} Line`, set_total: null, card_number: null, is_key_card: variation === "gem", key_card_reason: variation === "gem" ? "Grail-tier release" : null, set_completion_hint: "Collectors pursue complete colorway sets.", collection_category_tag: "sneakers" } : { set_name: `${era} ${brand} ${category}`, set_total: 250 + (hash % 500), card_number: `#${(hash % 250) + 1}`, is_key_card: variation === "gem" || variation === "strong", key_card_reason: variation === "gem" ? "Chase card" : variation === "strong" ? "Key card" : null, set_completion_hint: "Focus on key cards first.", collection_category_tag: category.toLowerCase().replace(/\s+/g, "-") },
        price_history: {
          trend_6mo: demoTrend,
          trend_1yr: demoTrend,
          trend_3yr: variation === "gem" ? "Rising" : "Stable",
          peak_price: `$${Math.round(estimatedHigh * valMult * 1.3)} (${variation === "gem" ? "2025" : "2024"})`,
          floor_price: `$${Math.round(estimatedLow * valMult * 0.7)}`,
          catalyst_events: variation === "gem" || variation === "strong" ? (isWatch ? "Brand anniversary events and auction season drive demand." : isJewelry ? "Major auction house sales create market movement." : isBook ? "Film adaptations and literary awards boost interest." : isSneaker ? "Retro releases and collaborations drive price spikes." : "Market events and anniversary releases drive demand.") : null,
        },
        investment: {
          price_1yr: `$${Math.round(estimatedMid * valMult * (demoTrend === "Rising" ? 1.15 : demoTrend === "Stable" ? 1.02 : 0.9))} — ${demoTrend === "Rising" ? "continued demand expected" : "stabilization likely"}`,
          price_5yr: `$${Math.round(estimatedMid * valMult * (demoTrend === "Rising" ? 1.5 : demoTrend === "Stable" ? 1.1 : 0.75))} — ${demoTrend === "Rising" ? "long-term appreciation" : "modest movement"}`,
          catalysts: `${demoTrend === "Rising" ? "Growing collector base, limited supply" : "Steady demand from established collectors"}`,
          risks: `${variation === "common" ? "Market saturation" : "Market correction, competing releases"}`,
          verdict: demoVerdict,
        },
        authentication_services: {
          recommended_service: isCard ? "PSA" : isCoin ? "PCGS" : isWatch ? "Independent Watchmaker + Chrono24" : isSneaker ? "StockX Verified" : isJewelry ? "GIA" : isBook ? "ABAA Dealer" : "JSA",
          estimated_cost: isWatch ? "$200-500" : isJewelry ? "$100-300" : isSneaker ? "$10-25" : "$25-75",
          turnaround_time: isWatch ? "2-4 weeks" : "15-30 business days standard",
          value_with_authentication: `$${Math.round(estimatedMid * valMult * 1.3)} — adds ${variation === "gem" ? "25-40%" : "15-25%"} to realized price`,
        },
        liquidity_assessment: {
          time_to_sell: variation === "gem" ? "3-7 days" : variation === "strong" ? "7-14 days" : variation === "mid" ? "14-30 days" : "30-60 days",
          market_depth: variation === "gem" ? "Deep" : variation === "strong" ? "Moderate" : "Thin",
          best_selling_window: isWatch ? "Spring auction season or holiday gifting" : isSneaker ? "Back-to-school or holiday season" : demoTrend === "Rising" ? "Sell within 30 days" : "No urgency",
          reasoning: variation === "gem" ? "High demand with multiple active buyers" : "Standard buyer interest for this category",
        },
        insurance_valuation: {
          replacement_value: Math.round(estimatedHigh * valMult * 1.5),
          reasoning: `Replacement value at 1.5x high market — accounts for acquisition cost and rarity.`,
        },
        condition_history: {
          restoration_flags: isWatch ? (variation === "gem" ? "No polishing or part replacement detected" : "Case may have light polishing") : variation === "gem" ? "No signs of restoration" : "Minor age-appropriate wear",
          red_flags: "None identified",
          provenance_notes: variation === "gem" ? "Strong provenance would enhance value" : "Standard collector provenance",
        },
        comparable_sales: [
          { item: `${itemName} (similar)`, price: Math.round(estimatedMid * valMult * 0.95), date: "2026-02", platform: platformInfo.platform, condition: conditionLabel },
          { item: `${itemName} (comparable)`, price: Math.round(estimatedMid * valMult * 1.05), date: "2026-01", platform: "eBay", condition: conditionLabel },
          { item: `${itemName} (${isWatch ? "full set" : isBook ? "with DJ" : "graded"})`, price: Math.round(estimatedMid * valMult * 1.6), date: "2025-12", platform: platformInfo.platform, condition: isWatch ? "Excellent" : "Graded" },
        ],
        executive_summary: `This ${itemName} is a ${demoRarity.toLowerCase()} collectible in ${conditionLabel.toLowerCase()} condition${isCard ? `, estimated at ${demoGrade}` : ""}. ${variation === "gem" ? "Exceptional example commanding premium prices." : variation === "strong" ? "Strong collectible with solid market demand." : variation === "mid" ? "Solid mid-tier piece with stable value." : "Common piece — sell now for best return."} Valued at $${Math.round(estimatedLow * valMult)}–$${Math.round(estimatedHigh * valMult)}. Best platform: ${platformInfo.platform}. ${isWatch ? "Full service documentation recommended." : isJewelry ? "Professional certification adds significant value." : isSneaker ? "Authentication essential." : demoVerdict.includes("Grade") ? "Professional grading recommended." : "Grading ROI is marginal."}`,
      };
    }

    // ── MARKET INTELLIGENCE — Real sold data from public marketplaces ──
    // CMD-COLLECTIBLESBOT-CORE-A: FLAG-CB-2 cleanup. Previously this
    // block fired a SECOND getMarketIntelligence call after the AI
    // returned — double scraper spend, double ScraperComp cache hits.
    // Now reuses the hoisted `marketIntel` variable from the primary
    // pre-prompt call. Same data, zero duplicate cost.
    if (marketIntel && marketIntel.compCount > 0) {
      result.market_comps = marketIntel.comps.slice(0, 5);
      result.market_median = marketIntel.median;
      result.market_low = marketIntel.low;
      result.market_high = marketIntel.high;
      result.market_confidence = marketIntel.confidence;
      result.pricing_sources = marketIntel.sources;
      result.market_trend = marketIntel.trend;

      // Flag pricing discrepancy if AI vs market differ by >40%
      const aiMid = result.raw_value_mid;
      if (aiMid && marketIntel.median && Math.abs(aiMid - marketIntel.median) / Math.max(aiMid, marketIntel.median) > 0.4) {
        result.pricing_discrepancy = true;
        result.pricing_discrepancy_note = `Market data ($${marketIntel.median}) differs significantly from AI estimate ($${aiMid})`;
      }
    }

    // Ensure critical top-level keys exist
    for (const key of ["item_name", "category", "rarity", "raw_value_low", "raw_value_mid", "raw_value_high", "value_reasoning", "graded_values", "grading_recommendation", "grading_roi_reasoning", "demand_trend", "best_platform", "selling_strategy", "executive_summary", "visual_grading", "collection_context", "price_history", "investment", "authentication_services", "liquidity_assessment", "insurance_valuation", "condition_history", "comparable_sales", "market_comps", "pricing_sources"]) {
      if (result[key] === undefined) result[key] = null;
    }
    // STEP 4.7: attach web search citations from the pre-pass
    if (prepassWebSources.length > 0) {
      result.web_sources = prepassWebSources;
    }

    await prisma.eventLog.create({
      data: { itemId, eventType: "COLLECTIBLESBOT_RESULT", payload: JSON.stringify(result) },
    });

    // CMD-COLLECTIBLESBOT-CORE-A: extended COLLECTIBLESBOT_RUN telemetry.
    // Parity with ANTIQUEBOT_RUN / LISTBOT_RUN / BUYERBOT_RUN /
    // RECONBOT_RUN. Logs skill pack stats + spec summary + hybrid
    // routing telemetry. Wrapped in try/catch so a logging failure
    // cannot block the user-facing response.
    try {
      await prisma.eventLog.create({
        data: {
          itemId,
          eventType: "COLLECTIBLESBOT_RUN",
          payload: JSON.stringify({
            userId: user.id,
            timestamp: new Date().toISOString(),
            // Skill pack telemetry (Round B will populate
            // collectiblesbot/*.md; Round A surfaces version +
            // shared-pack count that load on day one)
            skillPackVersion: skillPack.version,
            skillPackCount: skillPack.skillNames.length,
            skillPackChars: skillPack.totalChars,
            // Spec context summary (Constitution audit)
            specSummary,
            // Hybrid router telemetry (live runs only — demo path null)
            mergedStrategy: hybridRun?.mergedStrategy ?? null,
            primaryConfidence: hybridRun?.primaryConfidence ?? null,
            secondaryTriggered: hybridRun?.secondaryTriggered ?? false,
            actualCostUsd: hybridRun?.actualCostUsd ?? 0,
            costUsd: hybridRun?.costUsd ?? 0,
            latencyMs: hybridRun?.latencyMs ?? 0,
            tokens: hybridRun?.tokens ?? { input: 0, output: 0, total: 0 },
            // CMD-FLAG-FINAL-WIRING: Claude prompt cache telemetry
            claudeCacheHit: (hybridRun?.primary as any)?.cacheInfo?.cacheHit ?? false,
            claudeCacheReadTokens: (hybridRun?.primary as any)?.cacheInfo?.cacheReadInputTokens ?? 0,
            claudeCacheSavingsUsd: (hybridRun?.primary as any)?.cacheInfo?.estimatedSavingsUsd ?? 0,
            isDemo: !!result?._isDemo,
          }),
        },
      });
    } catch (logErr) {
      console.warn("[collectiblesbot] COLLECTIBLESBOT_RUN log write failed (non-critical):", logErr);
    }

    // Fire-and-forget: PriceSnapshot from collectibles valuation
    prisma.priceSnapshot.create({
      data: {
        itemId,
        source: "COLLECTIBLESBOT",
        priceLow: result.raw_value_low != null ? Math.round(Number(result.raw_value_low)) : null,
        priceHigh: result.raw_value_high != null ? Math.round(Number(result.raw_value_high)) : null,
        priceMedian: result.raw_value_mid != null ? Math.round(Number(result.raw_value_mid)) : null,
        confidence: result.grade_confidence != null ? `grade_confidence: ${result.grade_confidence}` : null,
      },
    }).catch(() => null);

    // Fire-and-forget: log user event
    logUserEvent(user.id, "BOT_RUN", { itemId, metadata: { botType: "COLLECTIBLESBOT", success: true } }).catch(() => null);

    // Fire-and-forget: intelligence systems
    import("@/lib/bots/disagreement").then(m => m.checkBotDisagreement(itemId)).catch(() => null);
    import("@/lib/bots/demand-score").then(m => m.calculateDemandScore(itemId)).catch(() => null);

    return NextResponse.json({ success: true, result });
  } catch (e) {
    console.error("[collectiblesbot POST]", e);
    return NextResponse.json({ error: "CollectiblesBot analysis failed" }, { status: 500 });
  }
}
