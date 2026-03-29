import { NextRequest, NextResponse } from "next/server";
import { authAdapter } from "@/lib/adapters/auth";
import { prisma } from "@/lib/db";
import OpenAI from "openai";
import { getItemEnrichmentContext } from "@/lib/enrichment";
import { logUserEvent } from "@/lib/data/user-events";
import { isDemoMode, canUseBotOnTier, BOT_CREDIT_COSTS } from "@/lib/constants/pricing";
import { checkCredits, deductCredits, hasPriorBotRun } from "@/lib/credits";
import { getMarketIntelligence } from "@/lib/market-intelligence/aggregator";
import { scrapeRubyLane } from "@/lib/market-intelligence/adapters/ruby-lane";
import { scrapeShopGoodwill } from "@/lib/market-intelligence/adapters/shop-goodwill";
import { scrapeLiveAuctioneers } from "@/lib/market-intelligence/adapters/live-auctioneers";

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

function safeJson(s: string | null | undefined): any {
  if (!s) return null;
  try { return JSON.parse(s); } catch { return null; }
}

/**
 * GET /api/bots/antiquebot/[itemId]
 * Retrieve existing AntiqueBot result for an item
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  try {
    const user = await authAdapter.getSession();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { itemId } = await params;

    const existing = await prisma.eventLog.findFirst({
      where: { itemId, eventType: "ANTIQUEBOT_RESULT" },
      orderBy: { createdAt: "desc" },
    });

    if (!existing) {
      return NextResponse.json({ hasResult: false, result: null });
    }

    return NextResponse.json({
      hasResult: true,
      result: safeJson(existing.payload),
      createdAt: existing.createdAt,
    });
  } catch (e) {
    console.error("[antiquebot GET]", e);
    return NextResponse.json({ error: "Failed to fetch AntiqueBot result" }, { status: 500 });
  }
}

/**
 * POST /api/bots/antiquebot/[itemId]
 * Run dedicated AntiqueBot deep-dive analysis on an item
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
      if (!canUseBotOnTier(user.tier, "antiqueBot")) {
        return NextResponse.json({ error: "upgrade_required", message: "Upgrade your plan to access AntiqueBot.", upgradeUrl: "/pricing?upgrade=true" }, { status: 403 });
      }
      const isRerun = await hasPriorBotRun(user.id, itemId, "ANTIQUEBOT");
      const cost = isRerun ? BOT_CREDIT_COSTS.singleBotReRun : BOT_CREDIT_COSTS.singleBotRun;
      const cc = await checkCredits(user.id, cost);
      if (!cc.hasEnough) {
        return NextResponse.json({ error: "insufficient_credits", message: "Not enough credits to run AntiqueBot.", balance: cc.balance, required: cost, buyUrl: "/credits" }, { status: 402 });
      }
      await deductCredits(user.id, cost, isRerun ? "AntiqueBot re-run" : "AntiqueBot run", itemId);
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
    if (!ai) {
      return NextResponse.json({ error: "Run AI analysis first" }, { status: 400 });
    }

    const v = item.valuation;
    const antique = item.antiqueCheck;
    const itemName = ai.item_name || item.title || "Unknown item";
    const category = ai.category || "General";
    const material = ai.material || "Unknown";
    const era = ai.era || "Unknown";
    const style = ai.style || "Unknown";
    const maker = ai.maker || ai.brand || "Unknown";
    const markings = ai.markings || "None identified";
    const conditionScore = ai.condition_score || 7;
    const conditionLabel = conditionScore >= 8 ? "Excellent" : conditionScore >= 5 ? "Good" : "Fair";
    const conditionDetails = ai.condition_details || "";
    const estimatedLow = v ? Math.round(v.low) : 0;
    const estimatedHigh = v ? Math.round(v.high) : 0;
    const estimatedMid = v?.mid ? Math.round(v.mid) : v ? Math.round((v.low + v.high) / 2) : 0;
    const auctionLow = antique?.auctionLow || null;
    const auctionHigh = antique?.auctionHigh || null;
    const isAntiqueFlag = ai.is_antique || false;
    const estimatedAge = ai.estimated_age_years || null;
    const antiqueMarkers = ai.antique_markers || [];
    const origin = ai.country_of_origin || "";
    const restorationPotential = ai.restoration_potential || "";
    const dimensions = ai.dimensions_estimate || "";

    // ── CROSS-BOT ENRICHMENT ──
    const enrichment = await getItemEnrichmentContext(itemId, "antiquebot").catch(() => null);
    const enrichmentPrefix = enrichment?.hasEnrichment ? enrichment.contextBlock + "\n\n" : "";

    // ── REAL AUCTION & MARKET DATA ──
    let auctionContext = "";
    try {
      const sellerZip = item.saleZip || "04901";
      const marketIntel = await getMarketIntelligence(itemName, "antique", sellerZip);
      if (marketIntel?.comps?.length > 0) {
        const auctionComps = marketIntel.comps.filter((c: any) => c.platform.includes("Heritage") || c.platform.toLowerCase().includes("auction"));
        const allComps = marketIntel.comps;
        auctionContext = `\n\nREAL AUCTION & MARKET DATA (scraped from actual marketplaces):
${allComps.slice(0, 10).map((c: any, i: number) => `${i + 1}. [${c.platform}] "${c.item}" — $${c.price}${c.date ? ` (${c.date})` : ""}`).join("\n")}
${auctionComps.length > 0 ? `\nAuction house results: ${auctionComps.length} found` : "No auction house results found — eBay/marketplace data used as proxy"}
Median: $${marketIntel.median} | Trend: ${marketIntel.trend}
Use this REAL data to anchor your authentication assessment, valuation estimates, and selling recommendations.`;
        console.log(`[AntiqueBot] ${allComps.length} real market comps, ${auctionComps.length} auction house results`);
      }

      // Supplement with specialty antique scrapers (parallel)
      const [rubyLaneResult, sgwResult, laResult] = await Promise.allSettled([
        scrapeRubyLane(itemName),
        scrapeShopGoodwill(itemName),
        scrapeLiveAuctioneers(itemName),
      ]);

      const rubyLane = rubyLaneResult.status === "fulfilled" ? rubyLaneResult.value : null;
      const sgw = sgwResult.status === "fulfilled" ? sgwResult.value : null;
      const la = laResult.status === "fulfilled" ? laResult.value : null;

      if (rubyLane?.success && rubyLane.comps.length > 0) {
        auctionContext += `\n\nRUBY LANE LISTINGS (premier antique marketplace — real data):
${rubyLane.comps.slice(0, 5).map((c: any, i: number) => `${i + 1}. "${c.item}" — $${c.price}`).join("\n")}`;
      }
      if (sgw?.success && sgw.comps.length > 0) {
        auctionContext += `\n\nSHOPGOODWILL AUCTIONS (${sgw.comps.length} results):
${sgw.comps.slice(0, 5).map((c: any, i: number) => `${i + 1}. "${c.item}" — $${c.price}`).join("\n")}`;
      }
      if (la?.success && la.comps.length > 0) {
        auctionContext += `\n\nLIVEAUCTIONEERS (${la.comps.length} past results):
${la.comps.slice(0, 5).map((c: any, i: number) => `${i + 1}. "${c.item}" — $${c.price}`).join("\n")}`;
      }
      const totalAntiqueSources = [rubyLane, sgw, la].filter(r => r?.success).length;
      if (totalAntiqueSources > 0) console.log(`[AntiqueBot] ${totalAntiqueSources} specialty antique sources returned data`);
    } catch {
      console.log("[AntiqueBot] Market intelligence unavailable — proceeding with AI-only analysis");
    }

    // ── ANTIQUEBOT DEEP-DIVE PROMPT ──
    const systemPrompt = enrichmentPrefix + auctionContext + `You are a world-class antique appraiser, auction specialist, and collector-market expert with 30+ years of experience in fine antiques, collectibles, decorative arts, and estate appraisal. You have been given an item that has ALREADY been identified and flagged as a potential antique by another AI.

Your ONLY job is ANTIQUE DEEP-DIVE — authentication, provenance, history, collector market, and selling strategy.

You are analyzing: ${itemName}
Category: ${category}
Material: ${material}
Era/Period: ${era}
Style: ${style}
Maker/Brand: ${maker}
Markings: ${markings}
Condition: ${conditionLabel} (${conditionScore}/10)
${conditionDetails ? `Condition details: ${conditionDetails}` : ""}
General estimate: $${estimatedLow} – $${estimatedHigh} (mid $${estimatedMid})
${auctionLow ? `Preliminary auction estimate: $${auctionLow} – $${auctionHigh}` : ""}

PRIOR AI ANTIQUE ASSESSMENT:
- AI flagged as antique: ${isAntiqueFlag ? "YES" : "NO"}
- Estimated age: ${estimatedAge ? `${estimatedAge} years` : "Unknown"}
- Antique markers already identified: ${antiqueMarkers.length > 0 ? antiqueMarkers.join(", ") : "None"}
- Country of origin: ${origin || "Unknown"}
- Restoration potential: ${restorationPotential || "Not assessed"}
- Dimensions: ${dimensions || "Not estimated"}

Your job is to GO DEEPER than this initial assessment. Confirm or challenge the AI's antique determination with expert-level analysis. Look for evidence the initial scan may have missed.

Return a JSON object with ALL of the following fields:

{
  "authentication": {
    "verdict": "Authentic | Likely Authentic | Uncertain | Likely Reproduction | Reproduction",
    "confidence": number (1-100),
    "reasoning": "Detailed explanation of why you believe this is authentic or not",
    "red_flags": ["list of concerning indicators if any"],
    "positive_indicators": ["list of authenticity indicators"],
    "recommended_tests": ["specific tests or examinations to confirm authenticity"],
    "appraiser_recommendation": "Should the owner get a professional appraisal? From whom?"
  },
  "identification": {
    "item_type": "Specific type (e.g., 'Georgian Silver Teapot', 'Art Deco Table Lamp')",
    "period": "Specific period or date range (e.g., '1780-1810', 'Art Deco 1920-1935')",
    "origin": "Country/region of origin",
    "maker_info": {
      "name": "Maker/manufacturer name if known",
      "active_period": "When they were active",
      "notable_for": "What they are known for",
      "mark_description": "Description of their typical marks"
    },
    "material_analysis": {
      "primary": "Primary material",
      "secondary": ["Secondary materials"],
      "finish": "Surface treatment/finish",
      "construction": "Construction method (hand vs machine, joinery type, etc.)"
    },
    "style_movement": "Art movement or style period",
    "rarity": "Common | Uncommon | Rare | Very Rare | Museum Quality"
  },
  "historical_context": {
    "era_overview": "Brief history of this type of item in its period",
    "cultural_significance": "Why this item matters historically",
    "notable_examples": "Famous examples of similar items in museums or collections",
    "production_history": "How many were made, by whom, for what purpose"
  },
  "condition_assessment": {
    "overall_grade": "Mint | Excellent | Very Good | Good | Fair | Poor",
    "age_appropriate_wear": boolean,
    "restoration_detected": boolean,
    "restoration_details": "Any signs of repair, refinishing, or alteration",
    "condition_impact_on_value": "How condition affects this specific item's value",
    "conservation_recommendations": ["specific care or restoration recommendations"],
    "structural_score": number 1-10 (frame, joints, foundation integrity),
    "surface_score": number 1-10 (finish, paint, veneer, surface treatment),
    "patina_score": number 1-10 (quality and authenticity of age-appropriate patina — higher = better patina),
    "completeness_score": number 1-10 (all original parts, hardware, elements present),
    "mechanisms_score": number 1-10 or null (locks, hinges, drawers, moving parts — null if item has no moving parts)
  },
  "valuation": {
    "fair_market_value": { "low": number, "mid": number, "high": number },
    "replacement_value": number,
    "insurance_value": number,
    "auction_estimate": { "low": number, "high": number, "reserve_recommendation": number },
    "private_sale_estimate": number,
    "dealer_buy_price": number,
    "valuation_methodology": "How we arrived at these numbers",
    "value_trend": "Appreciating | Stable | Declining",
    "value_trend_reasoning": "Why the value is moving in this direction"
  },
  "collector_market": {
    "collector_base": "Description of who collects these items",
    "collector_demand": "Hot | Strong | Moderate | Niche | Weak",
    "collector_organizations": ["relevant clubs, societies, associations"],
    "recent_auction_results": [
      {
        "house": "Auction house name",
        "item": "Description",
        "date": "When sold",
        "estimate": "Pre-sale estimate",
        "realized": "Actual sale price",
        "notes": "Any relevant context"
      }
    ],
    "market_outlook": "Where is the market heading for these items?"
  },
  "selling_strategy": {
    "best_venue": "Where to sell this specific item for maximum return",
    "venue_options": [
      {
        "venue": "Auction house / Dealer / Online / Private",
        "name": "Specific name if applicable",
        "expected_return": number,
        "timeline": "How long to sell",
        "pros": "Advantages",
        "cons": "Disadvantages"
      }
    ],
    "timing": "Best time of year to sell",
    "presentation_tips": ["How to present for maximum value"],
    "documentation_needed": ["What documentation to gather before selling"],
    "reserve_strategy": "Set a reserve? At what level?"
  },
  "documentation": {
    "provenance_importance": "How important is provenance for this item? (1-10)",
    "provenance_tips": ["How to research and document provenance"],
    "recommended_references": ["books, websites, or experts for this category"],
    "comparable_database": "Where to find sold comparables"
  },
  "provenance_chain": [
    {
      "owner": "Known or inferred owner/institution",
      "period": "Approximate dates of ownership",
      "evidence": "How we know or infer this link",
      "confidence": "High | Medium | Low"
    }
  ],
  "exhibition_potential": {
    "museum_interest": "None | Low | Moderate | Strong",
    "reasoning": "Why a museum or gallery would or wouldn't want this piece",
    "comparable_museum_pieces": ["similar items in known museum collections"]
  },
  "value_projections": {
    "five_year": { "low": number, "high": number, "reasoning": "specific reasoning tied to market trends" },
    "ten_year": { "low": number, "high": number, "reasoning": "specific reasoning tied to market trends" },
    "risk_factors": ["what could decrease value over time"],
    "upside_catalysts": ["what could increase value over time"]
  },
  "executive_summary": "A 5-8 sentence plain-language summary for a senior citizen. No jargon. Clear, warm advice. Include authentication verdict, estimated value range, where to sell, and next steps. If it's truly valuable, emphasize getting a professional appraisal. Be honest — if it's not as valuable as hoped, say so gently."
}

HALLMARK REFERENCE — When examining maker's marks, hallmarks, or stamps:
- British silver: Lion passant (sterling), date letter (year), city mark (origin), duty mark (tax paid), maker's initials. Assay Offices: London leopard head, Birmingham anchor, Sheffield crown, Edinburgh castle
- French silver: Minerva head (1st standard 950), crab mark (small items), owl mark (import). Pre-1798: fermiers marks
- American silver: Maker's name/initials, "STERLING" or "925". Key makers: Gorham (lion-anchor-G), Tiffany (date codes), Reed & Barton
- Pottery/porcelain: Crossed swords (Meissen), interlaced Ls (Sèvres), crown marks (Derby, Worcester). Note if mark is applied vs integral
- Furniture: Paper labels, branded stamps, stencils, chalk marks. American: Federal period labels. European: guild marks, city stamps

CONSTRUCTION DATING — Use physical construction details to verify period claims:
- Dovetails: Hand-cut irregular (pre-1860) vs machine-cut uniform (post-1860) vs router-cut identical (modern). Fewer pins = earlier
- Nails: Hand-forged rose-head (pre-1790) → cut nails (1790-1890) → wire nails (post-1890). Mixed nails suggest repair
- Screws: Hand-filed irregular slot (pre-1848) → machine-made uniform (post-1848) → Phillips head (post-1936)
- Saw marks: Straight pit saw (pre-1830) → circular (post-1830) → band saw (post-1870). Check secondary surfaces
- Wood: Old growth tight grain vs plantation wide grain. Proper patina penetrates; artificial aging is surface-only
- Glass: Pontil marks (hand-blown pre-1860), mold seams (machine post-1900), manganese glass fluoresces green under UV (pre-1915)

FORGERY ANALYSIS — Actively look for reproduction/fakery red flags:
- Style inconsistency: mixing elements from different periods (e.g., Queen Anne legs on Victorian case)
- Tool mark anachronisms: machine marks on "18th century" piece, Phillips screws in "pre-1936" piece
- Patina fraud: uniform artificial distressing vs natural use-pattern wear, chemical aging vs natural oxidation
- Married pieces: components from different originals combined — check wood grain continuity, hardware consistency
- Material anachronisms: plywood (post-1900), MDF (post-1960), synthetic varnish (post-1930), modern foam (post-1940)
Rate forgery risk: LOW / MODERATE / HIGH / CONFIRMED

APPRAISAL STANDARDS (USPAP-aligned):
- State PURPOSE of valuation (insurance replacement, fair market, liquidation)
- Fair Market Value = price between willing buyer and seller, neither under compulsion, both with reasonable knowledge
- Insurance/Replacement Value = cost to replace with similar quality, age, origin, condition
- Liquidation Value = expected price in time-constrained sale
- Note: "This AI assessment is not a substitute for a certified appraisal by ASA, AAA, or ISA accredited professional"

CONSERVATION BY MATERIAL:
- Wood: 45-55% RH, avoid UV, paste wax only, never refinish antique surfaces
- Metal/silver: Tarnish is protective; anti-tarnish strips, cotton gloves
- Ceramics: Temperature stability, hand wash only, never microwave
- Textiles: Acid-free tissue, avoid folding on same lines, UV-filtering glass
- Paper: Acid-free enclosures, 65-70°F, never laminate
Include conservation_priority: URGENT / RECOMMENDED / STABLE

IMPORTANT:
- Be SPECIFIC. This is an antique deep-dive, not a general analysis.
- If you recognize the maker/period, give detailed historical context.
- Auction estimates should reflect REAL market conditions for this category.
- If you're uncertain about authenticity, say so clearly with specific reasons.
- Don't inflate values — be honest and accurate.
- Consider the specific era, maker, material, and condition together.
- All prices in USD.
- Return SPECIFIC condition sub-scores (1-10) for structural, surface, patina, completeness, and mechanisms.
- If you can infer a provenance chain (even partial), include it.
- Assess exhibition/museum potential honestly — most items have low potential.
- Project 5-year and 10-year value with specific reasoning.`;

    let antiquebotResult: any;

    if (openai) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60_000);
      try {
        const photoContent: string[] = [];
        for (const photo of item.photos) {
          photoContent.push(`[Photo: ${photo.filePath}${photo.caption ? ` — ${photo.caption}` : ""}]`);
        }

        const response = await openai.responses.create({
          model: "gpt-4o-mini",
          instructions: systemPrompt,
          input: `Perform a deep antique analysis of this item. Photos: ${photoContent.join(", ")}. Return ONLY valid JSON.`,
        }, { signal: controller.signal });

        const text = typeof response.output === "string"
          ? response.output
          : response.output_text || JSON.stringify(response.output);

        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          antiquebotResult = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error("No JSON in response");
        }
      } catch (aiErr: any) {
        console.error("[antiquebot] OpenAI error:", aiErr);
        return NextResponse.json({ error: `AntiqueBot AI analysis failed: ${aiErr?.message ?? String(aiErr)}` }, { status: 422 });
      } finally {
        clearTimeout(timeoutId);
      }
    } else {
      antiquebotResult = generateDemoResult(itemName, category, material, era, style, maker, markings, conditionScore, conditionLabel, estimatedLow, estimatedMid, estimatedHigh, auctionLow, auctionHigh);
      antiquebotResult._isDemo = true;
    }

    // Validate required fields
    const requiredFields = [
      "authentication", "identification", "historical_context", "condition_assessment",
      "valuation", "collector_market", "selling_strategy", "documentation",
      "provenance_chain", "exhibition_potential", "value_projections", "executive_summary",
    ];
    for (const key of requiredFields) {
      if (antiquebotResult[key] === undefined) antiquebotResult[key] = null;
    }

    // Store in EventLog
    await prisma.eventLog.create({
      data: {
        itemId,
        eventType: "ANTIQUEBOT_RESULT",
        payload: JSON.stringify(antiquebotResult),
      },
    });

    await prisma.eventLog.create({
      data: {
        itemId,
        eventType: "ANTIQUEBOT_RUN",
        payload: JSON.stringify({ userId: user.id, timestamp: new Date().toISOString() }),
      },
    });

    // Fire-and-forget: PriceSnapshot from antique valuation
    const abFmv = antiquebotResult.valuation?.fair_market_value;
    prisma.priceSnapshot.create({
      data: {
        itemId,
        source: "ANTIQUEBOT",
        priceLow: abFmv?.low != null ? Math.round(Number(abFmv.low) * 100) : null,
        priceHigh: abFmv?.high != null ? Math.round(Number(abFmv.high) * 100) : null,
        priceMedian: abFmv?.mid != null ? Math.round(Number(abFmv.mid) * 100) : null,
        confidence: antiquebotResult.authentication?.confidence != null ? `auth_confidence: ${antiquebotResult.authentication.confidence}` : null,
      },
    }).catch(() => null);

    // Fire-and-forget: log user event
    logUserEvent(user.id, "BOT_RUN", { itemId, metadata: { botType: "ANTIQUEBOT", success: true } }).catch(() => null);

    return NextResponse.json({
      success: true,
      result: antiquebotResult,
      isDemo: !!antiquebotResult._isDemo,
    });
  } catch (e) {
    console.error("[antiquebot POST]", e);
    return NextResponse.json({ error: "AntiqueBot analysis failed" }, { status: 500 });
  }
}

// ── Demo Result Generator ──────────────────────────────────────────────────

function generateDemoResult(
  itemName: string, category: string, material: string, era: string,
  style: string, maker: string, markings: string, conditionScore: number,
  conditionLabel: string, low: number, mid: number, high: number,
  auctionLow: number | null, auctionHigh: number | null,
) {
  const revisedLow = Math.round((auctionLow || low) * 0.95);
  const revisedMid = Math.round(mid * 1.1);
  const revisedHigh = Math.round((auctionHigh || high) * 1.15);
  const insuranceValue = Math.round(revisedHigh * 1.5);

  // Deterministic variation based on item name hash
  const hash = itemName.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const bucket = hash % 100;
  // 0-59 = Likely Authentic, 60-79 = Reservations, 80-94 = Uncertain, 95-99 = Reproduction
  const demoVariation = bucket < 60 ? "authentic" : bucket < 80 ? "reservations" : bucket < 95 ? "uncertain" : "reproduction";

  const demoVerdict = demoVariation === "authentic" ? "Likely Authentic"
    : demoVariation === "reservations" ? "Authentic with Reservations"
    : demoVariation === "uncertain" ? "Uncertain — Further Testing Required"
    : "Likely Reproduction";
  const demoConfidence = demoVariation === "authentic" ? 72 + (hash % 21)
    : demoVariation === "reservations" ? 55 + (hash % 17)
    : demoVariation === "uncertain" ? 30 + (hash % 25)
    : 15 + (hash % 21);
  const demoRedFlags: string[] = demoVariation === "authentic"
    ? (conditionScore >= 8 ? ["Unusually good condition for stated age — verify provenance"] : [])
    : demoVariation === "reservations"
    ? [`${material} shows signs of possible later refinishing or replating`, "Minor style inconsistencies between components warrant in-person verification"]
    : demoVariation === "uncertain"
    ? ["Construction methods show mix of period and later techniques", "Surface patina inconsistent — areas of artificial aging detected", `Proportions deviate from known ${era} examples by 5-10%`]
    : ["Machine-cut joinery inconsistent with claimed period", `${material} composition suggests post-1960 manufacture`, "No authentic wear patterns — uniform artificial distressing", `Style elements mix ${era} with later revival motifs`];

  return {
    _isDemo: true,
    authentication: {
      verdict: demoVerdict,
      confidence: demoConfidence,
      reasoning: demoVariation === "authentic"
        ? `Based on the ${material} construction, ${era} styling, and ${markings !== "None identified" ? "visible maker's marks" : "period-appropriate details"}, this ${itemName} appears to be a genuine ${era} piece. The ${conditionLabel.toLowerCase()} condition is consistent with authentic age-related wear.`
        : demoVariation === "reservations"
        ? `This ${itemName} shows strong ${era} characteristics in its ${material} construction, but several details require professional verification. The overall form and decorative elements are consistent with the period, though ${conditionScore >= 7 ? "the unusually good condition raises questions about possible restoration" : "some surface treatments may not be original"}.`
        : demoVariation === "uncertain"
        ? `This ${itemName} presents mixed signals. While the general form is consistent with ${era} production, multiple construction details raise concerns. We recommend professional examination before making any purchase or sale decisions at the estimated values.`
        : `Based on construction analysis, this ${itemName} appears to be a later reproduction or revival piece rather than a genuine ${era} original. The ${material} and construction methods are more consistent with 20th-century production. It may still have decorative value but should not be priced as an authentic antique.`,
      red_flags: demoRedFlags,
      positive_indicators: [
        `${material} consistent with ${era} period`,
        "Construction methods match the claimed era",
        conditionScore < 8 ? "Age-appropriate patina and wear patterns" : "Well-preserved example",
        markings !== "None identified" ? "Identifiable maker's marks present" : "Style consistent with period production",
      ].slice(0, demoVariation === "reproduction" ? 1 : demoVariation === "uncertain" ? 2 : 4),
      recommended_tests: [
        "Professional hands-on examination for construction details",
        `${material.includes("silver") || material.includes("gold") ? "Hallmark verification and metal testing" : "Material composition analysis"}`,
        "UV light examination for repairs or alterations",
        "Comparison with known authentic examples in reference catalogs",
      ].slice(0, demoVariation === "authentic" ? 2 : 4),
      appraiser_recommendation: demoVariation === "reproduction"
        ? `We recommend a professional appraiser confirm whether this is a period reproduction with decorative value ($${Math.round(revisedLow * 0.2).toLocaleString()}-$${Math.round(revisedMid * 0.3).toLocaleString()}) or a genuine ${era} piece worth significantly more.`
        : revisedHigh > 500
        ? `Yes — for an item in this value range, we strongly recommend a certified appraiser from the American Society of Appraisers (ASA) or International Society of Appraisers (ISA) who specializes in ${category.toLowerCase()}.`
        : `Optional — the estimated value may not justify a formal appraisal ($150-300), but a free evaluation from a reputable antique dealer could confirm our assessment.`,
    },
    identification: {
      item_type: `${era} ${material} ${category}`,
      period: era !== "Unknown" ? era : "Mid-20th Century (estimated)",
      origin: material.includes("silver") ? "England or Continental Europe" : "United States or Western Europe",
      maker_info: {
        name: maker !== "Unknown" ? maker : "Unidentified — further research needed",
        active_period: era !== "Unknown" ? era : "Unknown",
        notable_for: maker !== "Unknown" ? `Fine ${category.toLowerCase()} production` : "Period not yet determined",
        mark_description: markings !== "None identified" ? markings : "No visible maker's mark — common for this period",
      },
      material_analysis: {
        primary: material,
        secondary: ["Wood", "Metal hardware"],
        finish: "Original finish with age-appropriate patina",
        construction: "Period-appropriate hand construction methods",
      },
      style_movement: style !== "Unknown" ? style : era,
      rarity: revisedHigh > 2000 ? "Rare" : revisedHigh > 500 ? "Uncommon" : "Common",
    },
    historical_context: {
      era_overview: `The ${era} period saw significant production of ${category.toLowerCase()} items in ${material}. This was a time of ${era.includes("Victorian") ? "industrial expansion and decorative excess" : era.includes("Art Deco") ? "geometric design and modernist influence" : "craftsmanship and attention to detail"}.`,
      cultural_significance: `${category} items from the ${era} period represent an important chapter in decorative arts history. They were ${revisedHigh > 1000 ? "luxury items for wealthy households" : "practical household items that have gained collector interest"}.`,
      notable_examples: `Major museums including the Metropolitan Museum of Art, Victoria and Albert Museum, and Winterthur Museum hold comparable ${era} ${category.toLowerCase()} pieces in their collections.`,
      production_history: `Production of ${material} ${category.toLowerCase()} items during the ${era} era was ${revisedHigh > 2000 ? "limited to skilled workshops" : "relatively common across multiple manufacturers"}.`,
    },
    condition_assessment: {
      overall_grade: conditionScore >= 9 ? "Excellent" : conditionScore >= 7 ? "Very Good" : conditionScore >= 5 ? "Good" : "Fair",
      age_appropriate_wear: conditionScore <= 8,
      restoration_detected: false,
      restoration_details: "No obvious restoration detected from photos. Hands-on examination recommended.",
      condition_impact_on_value: conditionScore >= 8
        ? `Excellent condition for age — adds 15-25% premium over average examples.`
        : conditionScore >= 5
          ? `Good condition with normal wear — pricing reflects market average for this age.`
          : `Below average condition — reduces value by approximately 20-35% compared to excellent examples.`,
      conservation_recommendations: [
        "Store in climate-controlled environment (65-70°F, 45-55% humidity)",
        "Avoid direct sunlight to prevent fading or material degradation",
        `${material.includes("silver") ? "Regular gentle polishing with museum-grade silver polish" : "Dust with soft, lint-free cloth only"}`,
        "Do not attempt amateur restoration — it reduces value",
      ],
      structural_score: Math.min(10, Math.round((conditionScore + 0.5) * 10) / 10),
      surface_score: Math.min(10, Math.round((conditionScore - 0.3) * 10) / 10),
      patina_score: Math.min(10, Math.round((conditionScore <= 8 ? conditionScore + 1 : conditionScore - 0.5) * 10) / 10),
      completeness_score: Math.min(10, Math.round((conditionScore + 0.3) * 10) / 10),
      mechanisms_score: category.toLowerCase().includes("furniture") || category.toLowerCase().includes("clock") ? Math.min(10, Math.round((conditionScore - 0.5) * 10) / 10) : null,
    },
    valuation: {
      fair_market_value: { low: revisedLow, mid: revisedMid, high: revisedHigh },
      replacement_value: insuranceValue,
      insurance_value: insuranceValue,
      auction_estimate: {
        low: Math.round(revisedLow * 0.85),
        high: Math.round(revisedHigh * 1.1),
        reserve_recommendation: Math.round(revisedLow * 0.8),
      },
      private_sale_estimate: Math.round(revisedMid * 1.05),
      dealer_buy_price: Math.round(revisedLow * 0.55),
      valuation_methodology: "Based on recent comparable sales, condition assessment, maker attribution, and current market trends for this category. Demo mode — professional appraisal recommended for accurate valuation.",
      value_trend: revisedHigh > 1000 ? "Appreciating" : "Stable",
      value_trend_reasoning: revisedHigh > 1000
        ? `${era} ${category.toLowerCase()} has shown 3-5% annual appreciation as collector interest grows and supply diminishes.`
        : `The market for ${category.toLowerCase()} from this period remains stable with consistent demand.`,
    },
    collector_market: {
      collector_base: `Collectors of ${era} ${category.toLowerCase()}, ${material} enthusiasts, and decorative arts aficionados. ${revisedHigh > 2000 ? "High-end collectors and institutional buyers are active in this market." : "Primarily individual collectors and interior designers."}`,
      collector_demand: revisedHigh > 2000 ? "Strong" : revisedHigh > 500 ? "Moderate" : "Niche",
      collector_organizations: [
        "American Antiques Society",
        `${material.includes("silver") ? "Silver Society" : category.includes("furniture") ? "Furniture History Society" : "Decorative Arts Trust"}`,
        "National Antique & Art Dealers Association (NAADA)",
      ],
      recent_auction_results: [
        {
          house: "Christie's",
          item: `Similar ${era} ${material} ${category.toLowerCase()}`,
          date: "Fall 2024",
          estimate: `$${Math.round(revisedLow * 0.9).toLocaleString()} – $${Math.round(revisedHigh * 0.9).toLocaleString()}`,
          realized: `$${Math.round(revisedMid * 1.05).toLocaleString()}`,
          notes: "Achieved mid-estimate in a strong sale",
        },
        {
          house: "Sotheby's",
          item: `${era} ${category.toLowerCase()} with ${maker !== "Unknown" ? maker : "similar"} attribution`,
          date: "Spring 2024",
          estimate: `$${Math.round(revisedLow * 1.1).toLocaleString()} – $${Math.round(revisedHigh * 1.2).toLocaleString()}`,
          realized: `$${Math.round(revisedHigh * 1.15).toLocaleString()}`,
          notes: "Strong bidding from multiple collectors",
        },
      ],
      market_outlook: `The market for ${era} ${category.toLowerCase()} is ${revisedHigh > 1000 ? "showing healthy growth with increasing international interest" : "stable with steady collector turnover"}. ${material.includes("silver") || material.includes("gold") ? "Precious metal content provides a value floor." : ""}`,
    },
    selling_strategy: {
      best_venue: revisedHigh > 2000
        ? "Regional auction house with specialty antiques sales"
        : revisedHigh > 500
          ? "eBay with detailed listing or specialty antique dealer"
          : "Facebook Marketplace or local antique shop consignment",
      venue_options: [
        {
          venue: "Auction House",
          name: revisedHigh > 5000 ? "Christie's or Sotheby's" : "Regional specialty house (e.g., Skinner, Doyle)",
          expected_return: Math.round(revisedMid * 0.85),
          timeline: "2-4 months from consignment to sale",
          pros: "Maximum exposure to serious collectors, competitive bidding",
          cons: "Seller's commission 10-15%, buyer's premium reduces bidder pool, slow timeline",
        },
        {
          venue: "Online",
          name: "eBay (auction format)",
          expected_return: Math.round(revisedMid * 0.9),
          timeline: "7-14 days",
          pros: "Largest audience, auction format can drive price up, fast turnaround",
          cons: "13.25% fees, shipping risk for fragile items, buyer disputes",
        },
        {
          venue: "Dealer",
          name: "Reputable antique dealer or consignment shop",
          expected_return: Math.round(revisedLow * 0.55),
          timeline: "Immediate if buying outright, 1-6 months on consignment",
          pros: "Immediate cash (outright), no shipping, expert handling",
          cons: "Dealers buy at 40-60% of retail, consignment is slow",
        },
        {
          venue: "Private",
          name: "Private collector sale",
          expected_return: Math.round(revisedMid * 1.05),
          timeline: "Variable — could be days or months",
          pros: "No fees, potentially highest return, direct negotiation",
          cons: "Finding the right buyer takes effort, no price discovery",
        },
      ],
      timing: "Spring (March-May) and fall (September-November) are strongest for antique sales. Avoid summer and late December.",
      presentation_tips: [
        "Clean gently but do NOT restore or refinish — patina adds value",
        "Photograph in natural light showing all angles, marks, and any damage",
        "Include a ruler or coin for scale in at least one photo",
        "Document any known provenance or history in writing",
      ],
      documentation_needed: [
        "Photos of all maker's marks, labels, or stamps",
        "Any receipts, provenance letters, or family history",
        "Measurements (height, width, depth, weight if applicable)",
        "Condition report noting any damage, repairs, or missing elements",
      ],
      reserve_strategy: revisedHigh > 1000
        ? `Set reserve at $${Math.round(revisedLow * 0.8).toLocaleString()} — protects against undervaluation while allowing competitive bidding.`
        : "No reserve recommended at this price point — low reserves encourage bidding and often achieve fair market value.",
    },
    documentation: {
      provenance_importance: revisedHigh > 2000 ? 9 : revisedHigh > 500 ? 7 : 4,
      provenance_tips: [
        "Interview family members about the item's history and origin",
        "Search for maker's marks in online databases (925-1000.com, Kovels.com)",
        "Check local library for antique reference books specific to this category",
        "Contact the maker's company (if still operating) for production records",
      ],
      recommended_references: [
        "Kovels.com — comprehensive antique identification database",
        `${material.includes("silver") ? "925-1000.com — silver hallmark identification" : "Worthpoint.com — sold price database"}`,
        "LiveAuctioneers.com — search past auction results",
        "Invaluable.com — auction house price database",
      ],
      comparable_database: "eBay sold listings, LiveAuctioneers, Invaluable, and Worthpoint provide the most comprehensive comparable sales data.",
    },
    provenance_chain: [
      { owner: "Original purchaser (unknown)", period: era !== "Unknown" ? era : "Mid-20th Century", evidence: "Period-appropriate construction and materials", confidence: "Medium" },
      { owner: "Estate collection", period: "Recent", evidence: "Submitted through LegacyLoop estate intake", confidence: "High" },
    ],
    exhibition_potential: {
      museum_interest: revisedHigh > 5000 ? "Moderate" : revisedHigh > 1000 ? "Low" : "None",
      reasoning: revisedHigh > 5000
        ? `${era} ${category.toLowerCase()} of this quality occasionally appears in museum decorative arts exhibitions.`
        : revisedHigh > 1000
          ? `While not museum-grade, this piece could appear in a historical society or regional museum exhibit on ${era} domestic life.`
          : `At this value level, museum interest is unlikely. The piece has more value in the private collector market.`,
      comparable_museum_pieces: [
        `${era} ${category.toLowerCase()} collection at the Metropolitan Museum of Art`,
        `Similar examples in the Winterthur Museum decorative arts galleries`,
      ],
    },
    value_projections: {
      five_year: {
        low: Math.round(revisedLow * 1.08),
        high: Math.round(revisedHigh * 1.15),
        reasoning: `${era} ${category.toLowerCase()} has shown steady 2-3% annual appreciation. Growing collector interest in this period supports moderate growth.`,
      },
      ten_year: {
        low: Math.round(revisedLow * 1.15),
        high: Math.round(revisedHigh * 1.35),
        reasoning: `Long-term appreciation driven by diminishing supply and generational wealth transfer. ${revisedHigh > 2000 ? "Strong institutional interest adds price support." : "Steady collector demand expected to continue."}`,
      },
      risk_factors: [
        "Market saturation if similar pieces enter market simultaneously",
        "Changing collector demographics — younger buyers may prefer different categories",
        "Economic downturn reducing discretionary spending on antiques",
      ],
      upside_catalysts: [
        `Museum exhibition or documentary featuring ${era} ${category.toLowerCase()}`,
        "Celebrity or influencer interest in antique collecting",
        "Diminishing supply as fewer estate sales yield quality pieces",
      ],
    },
    executive_summary: `Your ${itemName} appears to be a ${conditionLabel.toLowerCase()}-condition ${era} piece that we believe is likely authentic. Based on our analysis, it's worth approximately $${revisedLow.toLocaleString()} to $${revisedHigh.toLocaleString()}, with a fair market value around $${revisedMid.toLocaleString()}. ${revisedHigh > 500 ? `We recommend ${revisedHigh > 2000 ? "consigning with a regional auction house for maximum return" : "listing on eBay with detailed photos and description"}.` : "For this value range, a local antique shop or Facebook Marketplace listing is your best bet."} ${revisedHigh > 500 ? "Before selling, we strongly recommend getting a professional in-person appraisal — it will cost $150-300 but could significantly increase your selling price by providing authentication and documentation." : "A professional appraisal is optional at this value level."} Take your time, present it well, and don't accept the first low offer.`,
  };
}
