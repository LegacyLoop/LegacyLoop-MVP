import { NextRequest, NextResponse } from "next/server";
import { authAdapter } from "@/lib/adapters/auth";
import { prisma } from "@/lib/db";
import OpenAI from "openai";
import { getItemEnrichmentContext } from "@/lib/enrichment";
import { logUserEvent } from "@/lib/data/user-events";
import { isDemoMode, canUseBotOnTier, BOT_CREDIT_COSTS } from "@/lib/constants/pricing";
import { checkCredits, deductCredits, hasPriorBotRun } from "@/lib/credits";

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

function safeJson(s: string | null | undefined): any {
  if (!s) return null;
  try { return JSON.parse(s); } catch { return null; }
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
      const cost = isRerun ? BOT_CREDIT_COSTS.singleBotReRun : BOT_CREDIT_COSTS.singleBotRun;
      const cc = await checkCredits(user.id, cost);
      if (!cc.hasEnough) {
        return NextResponse.json({ error: "insufficient_credits", message: "Not enough credits to run CollectiblesBot.", balance: cc.balance, required: cost, buyUrl: "/credits" }, { status: 402 });
      }
      await deductCredits(user.id, cost, isRerun ? "CollectiblesBot re-run" : "CollectiblesBot run", itemId);
    }

    const item = await prisma.item.findUnique({
      where: { id: itemId },
      include: {
        aiResult: true,
        valuation: true,
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

    // ── CROSS-BOT ENRICHMENT ──
    const enrichment = await getItemEnrichmentContext(itemId, "collectiblesbot").catch(() => null);
    const enrichmentPrefix = enrichment?.hasEnrichment ? enrichment.contextBlock + "\n\n" : "";

    const systemPrompt = enrichmentPrefix + `You are a world-class collectibles specialist with deep expertise across ALL major collector markets. You have encyclopedic knowledge of grading standards, auction records, population reports, and current market conditions.

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

Item: ${itemName}
Category: ${category}
Material: ${material}
Era: ${era}
Brand/Maker: ${brand}
Condition: ${conditionLabel} (${conditionScore}/10)
Price range: $${estimatedLow} - $${estimatedHigh} (mid $${estimatedMid})

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
  "executive_summary": "5-6 sentences: what this is, exact value reasoning, grading recommendation, best platform, key insight for seller"
}

Be specific to the actual collectible category. All prices USD. Return ONLY JSON. Start with {. No markdown fences.`;

    let result: any;

    if (openai) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60_000);
      try {
        const photoContent: string[] = [];
        for (const photo of item.photos) {
          photoContent.push(`[Photo: ${photo.filePath}${photo.caption ? ` - ${photo.caption}` : ""}]`);
        }

        const response = await openai.responses.create({
          model: "gpt-4o-mini",
          instructions: systemPrompt,
          input: `Analyze this item as a collectible. Photos: ${photoContent.join(", ")}. Return ONLY valid JSON.`,
          max_output_tokens: 4096,
        }, { signal: controller.signal });

        const text = typeof response.output === "string"
          ? response.output
          : response.output_text || JSON.stringify(response.output);

        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          result = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error("No JSON in response");
        }
      } catch (aiErr: any) {
        console.error("[collectiblesbot] OpenAI error:", aiErr);
        return NextResponse.json({ error: `CollectiblesBot failed: ${aiErr?.message ?? String(aiErr)}` }, { status: 422 });
      } finally {
        clearTimeout(timeoutId);
      }
    } else {
      return NextResponse.json({ error: "OpenAI API key not configured" }, { status: 500 });
    }

    // Ensure critical top-level keys exist
    for (const key of ["item_name", "category", "rarity", "raw_value_low", "raw_value_mid", "raw_value_high", "value_reasoning", "graded_values", "grading_recommendation", "grading_roi_reasoning", "demand_trend", "best_platform", "selling_strategy", "executive_summary"]) {
      if (result[key] === undefined) result[key] = null;
    }

    await prisma.eventLog.create({
      data: { itemId, eventType: "COLLECTIBLESBOT_RESULT", payload: JSON.stringify(result) },
    });

    await prisma.eventLog.create({
      data: { itemId, eventType: "COLLECTIBLESBOT_RUN", payload: JSON.stringify({ userId: user.id, timestamp: new Date().toISOString() }) },
    });

    // Fire-and-forget: PriceSnapshot from collectibles valuation
    prisma.priceSnapshot.create({
      data: {
        itemId,
        source: "COLLECTIBLESBOT",
        priceLow: result.raw_value_low != null ? Math.round(Number(result.raw_value_low) * 100) : null,
        priceHigh: result.raw_value_high != null ? Math.round(Number(result.raw_value_high) * 100) : null,
        priceMedian: result.raw_value_mid != null ? Math.round(Number(result.raw_value_mid) * 100) : null,
        confidence: result.grade_confidence != null ? `grade_confidence: ${result.grade_confidence}` : null,
      },
    }).catch(() => null);

    // Fire-and-forget: log user event
    logUserEvent(user.id, "BOT_RUN", { itemId, metadata: { botType: "COLLECTIBLESBOT", success: true } }).catch(() => null);

    return NextResponse.json({ success: true, result });
  } catch (e) {
    console.error("[collectiblesbot POST]", e);
    return NextResponse.json({ error: "CollectiblesBot analysis failed" }, { status: 500 });
  }
}
