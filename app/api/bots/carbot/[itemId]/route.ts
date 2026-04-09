import { NextRequest, NextResponse } from "next/server";
import { authAdapter } from "@/lib/adapters/auth";
import { prisma } from "@/lib/db";
import OpenAI from "openai";
// STEP 4.7: pre-pass OpenAI web search for real-time vehicle market data
import { runWebSearchPrepass } from "@/lib/bots/web-search-prepass";
// CMD-CARBOT-CORE-A: hybrid router + spec context + skill pack
import { routeCarBotHybrid } from "@/lib/adapters/bot-ai-router";
import { buildItemSpecContext } from "@/lib/bots/item-spec-context";
import { summarizeSpecContext } from "@/lib/bots/spec-guards";
import { loadSkillPack } from "@/lib/bots/skill-loader";
import { getItemEnrichmentContext } from "@/lib/enrichment";
import { logUserEvent } from "@/lib/data/user-events";
import { getVehicleHistoryReport, decodeVinNHTSA } from "@/lib/vehicle/nhtsa";
import { canUseBotOnTier, BOT_CREDIT_COSTS } from "@/lib/constants/pricing";
import { isDemoMode } from "@/lib/bot-mode";
import { getMarketIntelligence } from "@/lib/market-intelligence/aggregator";
import { checkCredits, deductCredits, hasPriorBotRun } from "@/lib/credits";
import fs from "fs";
import path from "path";

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

function safeJson(s: string | null | undefined): any {
  if (!s) return null;
  try { return JSON.parse(s); } catch { return null; }
}

const VEHICLE_KEYWORDS = ["car", "truck", "vehicle", "automobile", "suv", "van", "motorcycle", "atv", "boat", "tractor", "trailer", "rv", "camper", "automotive"];

function isVehicle(ai: any, category: string): boolean {
  const cat = (ai?.category || category || "").toLowerCase();
  if (VEHICLE_KEYWORDS.some((kw) => cat.includes(kw))) return true;
  if (ai?.vehicle_year || ai?.vehicle_make || ai?.vehicle_model) return true;
  return false;
}

/**
 * GET /api/bots/carbot/[itemId]
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  try {
    const user = await authAdapter.getSession();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { itemId } = await params;

    const [existing, vehicleDataLog] = await Promise.all([
      prisma.eventLog.findFirst({
        where: { itemId, eventType: "CARBOT_RESULT" },
        orderBy: { createdAt: "desc" },
      }),
      prisma.eventLog.findFirst({
        where: { itemId, eventType: "CARBOT_VEHICLE_DATA" },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    const vehicleData = safeJson(vehicleDataLog?.payload);

    if (!existing) {
      return NextResponse.json({ hasResult: false, result: null, vehicleData });
    }

    return NextResponse.json({
      hasResult: true,
      result: safeJson(existing.payload),
      createdAt: existing.createdAt,
      vehicleData,
    });
  } catch (e) {
    console.error("[carbot GET]", e);
    return NextResponse.json({ error: "Failed to fetch CarBot result" }, { status: 500 });
  }
}

/**
 * POST /api/bots/carbot/[itemId]
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  try {
    const user = await authAdapter.getSession();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { itemId } = await params;

    // ── Tier + Credit Gate ──
    if (!isDemoMode()) {
      if (!canUseBotOnTier(user.tier, "carBot")) {
        return NextResponse.json({ error: "upgrade_required", message: "Upgrade your plan to access CarBot.", upgradeUrl: "/pricing?upgrade=true" }, { status: 403 });
      }
      const isRerun = await hasPriorBotRun(user.id, itemId, "CARBOT");
      // STEP 4.6: CarBot is now a specialty bot (4cr / 2cr re-run)
      const cost = isRerun ? BOT_CREDIT_COSTS.carBotReRun : BOT_CREDIT_COSTS.carBotRun;
      const cc = await checkCredits(user.id, cost);
      if (!cc.hasEnough) {
        return NextResponse.json({ error: "insufficient_credits", message: "Not enough credits to run CarBot.", balance: cc.balance, required: cost, buyUrl: "/credits" }, { status: 402 });
      }
      await deductCredits(user.id, cost, isRerun ? "CarBot re-run" : "CarBot run", itemId);
    }

    const body = await req.json().catch(() => ({}));

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
    if (!ai) {
      return NextResponse.json({ error: "Run AI analysis first" }, { status: 400 });
    }

    // Vehicle check (skip if force=true)
    if (!isVehicle(ai, item.title || "") && !body.force) {
      return NextResponse.json({ error: "This item was not detected as a vehicle." }, { status: 400 });
    }

    // Load seller-provided vehicle data (VIN, mileage, details)
    const vehicleDataLog = await prisma.eventLog.findFirst({
      where: { itemId, eventType: "CARBOT_VEHICLE_DATA" },
      orderBy: { createdAt: "desc" },
    });
    const vehData = safeJson(vehicleDataLog?.payload) || {};

    const v = item.valuation;
    const vehicleYear = vehData.year || ai.vehicle_year || ai.era || "Unknown";
    const vehicleMake = vehData.make || ai.vehicle_make || ai.brand || "Unknown";
    const vehicleModel = vehData.model || ai.vehicle_model || ai.model || "Unknown";
    const vehicleMileage = vehData.mileage ? `${vehData.mileage} miles (${vehData.mileageType || "reported"})` : (ai.vehicle_mileage || "Not provided");
    const vinVisible = ai.vin_visible || false;
    const condScore = ai.condition_score || 7;
    const condLabel = condScore >= 8 ? "Excellent" : condScore >= 5 ? "Good" : "Fair";
    const estimatedLow = v ? Math.round(v.low) : 0;
    const estimatedHigh = v ? Math.round(v.high) : 0;
    const estimatedMid = v?.mid ? Math.round(v.mid) : v ? Math.round((v.low + v.high) / 2) : 0;
    const sellerZip = item.saleZip || "04901";
    const transmission = ai.vehicle_transmission || "";
    const fuelType = ai.vehicle_fuel_type || "";
    const engine = ai.vehicle_engine || "";
    const drivetrain = ai.vehicle_drivetrain || "";

    // ── NHTSA VEHICLE HISTORY (recalls, complaints, safety ratings) ──
    let nhtsaReport: any = null;
    const vYear = vehData.year || ai.vehicle_year;
    const vMake = vehData.make || ai.vehicle_make;
    const vModel = vehData.model || ai.vehicle_model;
    if (vMake && vModel && vYear) {
      try {
        nhtsaReport = await getVehicleHistoryReport(String(vMake), String(vModel), String(vYear));
        console.log(`[CarBot] NHTSA report: ${nhtsaReport.recalls.count} recalls, ${nhtsaReport.complaints.count} complaints`);
      } catch (e) {
        console.warn("[CarBot] NHTSA fetch failed:", e);
      }
    }

    // If VIN is provided and we don't have decoded data yet, decode it via NHTSA
    let vinDecoded = vehData.vinDecoded || null;
    if (vehData.vin && !vinDecoded) {
      try {
        vinDecoded = await decodeVinNHTSA(vehData.vin);
      } catch (e) {
        console.warn("[CarBot] VIN decode failed:", e);
      }
    }

    // Build seller context from saved vehicle data
    let sellerContext = "";
    if (vehData.vin) sellerContext += `\n- VIN: ${vehData.vin}`;
    if (vehData.vinDecoded) {
      const vd = vehData.vinDecoded;
      sellerContext += `\n- VIN Decoded: Make=${vd.Make || ""}, Model=${vd.Model || ""}, Year=${vd["Model Year"] || ""}, Body=${vd["Body Class"] || ""}, Engine=${vd["Displacement (L)"] || ""}L ${vd["Engine Number of Cylinders"] || ""}cyl, Drive=${vd["Drive Type"] || ""}, Trans=${vd["Transmission Style"] || ""}, Plant=${vd["Plant City"] || ""} ${vd["Plant State"] || ""}`;
    }
    if (vehData.mileage) sellerContext += `\n- Mileage: ${vehData.mileage} miles (${vehData.mileageType || "reported"})`;
    if (vehData.titleStatus) sellerContext += `\n- Title Status: ${vehData.titleStatus}`;
    if (vehData.owners) sellerContext += `\n- Number of Owners: ${vehData.owners}`;
    if (vehData.accidents === "none") sellerContext += `\n- Accident History: No accidents known`;
    else if (vehData.accidents) sellerContext += `\n- Accident History: ${vehData.accidents}`;
    if (vehData.serviceRecords) sellerContext += `\n- Service Records: Available`;
    if (vehData.modifications) sellerContext += `\n- Modifications: ${vehData.modifications}`;
    if (vehData.knownIssues) sellerContext += `\n- Known Issues: ${vehData.knownIssues}`;
    if (vehData.recentService) sellerContext += `\n- Recent Service/Repairs: ${vehData.recentService}`;
    if (vehData.askingPrice) sellerContext += `\n- Seller's Asking Price: $${vehData.askingPrice}`;

    // Append NHTSA data to seller context
    if (nhtsaReport) {
      sellerContext += `\n\nNHTSA VEHICLE HISTORY (Real Federal Data):`;
      sellerContext += `\nRecalls: ${nhtsaReport.recalls.count} active recalls`;
      if (nhtsaReport.recalls.items.length > 0) {
        sellerContext += nhtsaReport.recalls.items.slice(0, 5).map((r: any) => `\n  - ${r.component}: ${r.summary.slice(0, 150)}`).join("");
      }
      sellerContext += `\nComplaints: ${nhtsaReport.complaints.count} consumer complaints filed`;
      if (nhtsaReport.complaints.items.length > 0) {
        sellerContext += nhtsaReport.complaints.items.slice(0, 3).map((c: any) => `\n  - ${c.component}: ${c.summary.slice(0, 100)}`).join("");
      }
      sellerContext += nhtsaReport.safetyRatings
        ? `\nSafety Rating: ${nhtsaReport.safetyRatings.overallRating}/5 stars (NHTSA)`
        : `\nSafety Rating: Not available for this model year`;
    }

    // ── CROSS-BOT ENRICHMENT ──
    const enrichment = await getItemEnrichmentContext(itemId, "carbot").catch(() => null);
    const enrichmentPrefix = enrichment?.hasEnrichment ? enrichment.contextBlock + "\n\n" : "";

    // CMD-CARBOT-CORE-A: skill pack + spec context (gap closure).
    // skill-loader is process-cached → zero cost on warm calls.
    // buildItemSpecContext reads live Item fields (saleZip, saleMethod,
    // shippingDifficulty, weightLbs, etc.) and produces a prompt-ready
    // block + a structured summary persisted in CARBOT_RUN.
    // Skills folder is empty until CMD-CARBOT-SKILLS-B ships —
    // loadSkillPack returns empty SkillPack, skillPackPrefix is "" until
    // Round B. Wiring lives here from CORE-A so telemetry is complete
    // on day one.
    const skillPack = loadSkillPack("carbot");
    const specContext = await buildItemSpecContext(item.id, { item, user });
    const specSummary = summarizeSpecContext(specContext);
    const skillPackPrefix = skillPack.systemPromptBlock
      ? skillPack.systemPromptBlock + "\n\n"
      : "";
    const specPromptPrefix = specContext.promptBlock
      ? specContext.promptBlock + "\n\n"
      : "";

    // ── REAL VEHICLE MARKET DATA ──
    let vehicleCompsContext = "";
    try {
      const query = `${vehicleYear} ${vehicleMake} ${vehicleModel}`.trim();
      const marketIntel = await getMarketIntelligence(
        query || ai.item_name || item.title || "",
        "vehicle",
        sellerZip,
        undefined, // phase1Only
        undefined, // isMegaBot
        "carbot", // CMD-SCRAPER-WIRING-C2
      );
      if (marketIntel?.comps?.length > 0) {
        vehicleCompsContext = `\n\nREAL VEHICLE MARKET DATA (${marketIntel.comps.length} listings from ${marketIntel.sources?.join(", ")}):
${marketIntel.comps.slice(0, 12).map((c: any, i: number) =>
  `${i + 1}. [${c.platform}] "${c.item}" — $${c.price}${c.location ? ` (${c.location})` : ""}`
).join("\n")}
Median price: $${marketIntel.median}
Range: $${marketIntel.low}–$${marketIntel.high} | Trend: ${marketIntel.trend}

CRITICAL: Use these REAL comparable vehicles to anchor your valuation. Do NOT guess when real data is available.`;
        console.log(`[CarBot] ${marketIntel.comps.length} real vehicle comps from ${marketIntel.sources?.join(", ")}`);

        Promise.all(marketIntel.comps.slice(0, 10).map((comp: any) =>
          prisma.marketComp.create({
            data: { itemId, platform: comp.platform, title: comp.item, price: comp.price, currency: "USD", url: comp.url || "" },
          }).catch(() => null)
        )).catch(() => null);
      }
    } catch {
      console.log("[CarBot] Vehicle market intelligence unavailable — proceeding with AI-only analysis");
    }

    // STEP 4.7: OpenAI web_search_preview pre-pass for real-time vehicle market data
    const _vehicleQuery = `${vehicleYear || ""} ${vehicleMake || ""} ${vehicleModel || ""}`.trim() || ai.item_name || item.title || "";
    const { webEnrichment, webSources: prepassWebSources } = await runWebSearchPrepass(
      openai,
      _vehicleQuery,
      "vehicle",
      sellerZip,
    );

    // CMD-CARBOT-CORE-A: skill pack + spec context prepended to the
    // existing prompt assembly. Order: skills → seller spec →
    // cross-bot enrichment → market context → web pre-pass → core
    // appraisal prompt.
    const systemPrompt = skillPackPrefix + specPromptPrefix + enrichmentPrefix + vehicleCompsContext + webEnrichment + `You are an elite automotive appraiser, mechanic, and vehicle market analyst with 25 years of experience. You've evaluated thousands of vehicles — from classic cars to modern trucks to motorcycles to boats. You know every make, model, year, common problem, market value, and selling strategy.

You are evaluating a vehicle from photos and seller-provided data.${sellerContext ? `\n\nSELLER-PROVIDED VEHICLE DATA:${sellerContext}\n\nUse this seller data to provide a more accurate and specific evaluation.` : ""}

Vehicle data from seller/AI:
- Year: ${vehicleYear}
- Make: ${vehicleMake}
- Model: ${vehicleModel}
- Mileage: ${vehicleMileage}
- VIN visible: ${vinVisible ? "Yes" : "Not visible in photos"}
${transmission ? `- Transmission: ${transmission}` : ""}
${fuelType ? `- Fuel Type: ${fuelType}` : ""}
${engine ? `- Engine: ${engine}` : ""}
${drivetrain ? `- Drivetrain: ${drivetrain}` : ""}
- Seller's description: ${item.title} — ${item.description || "No description"}
- Seller's condition claim: ${ai.condition_guess || condLabel}
- Seller's estimated value: $${estimatedLow} – $${estimatedHigh}
- Location ZIP: ${sellerZip}

VIN EXTRACTION FROM PHOTOS: Carefully examine ALL vehicle photos for visible VIN numbers. VINs appear on: the dashboard (visible through windshield, lower driver side), driver door jamb sticker, engine bay sticker, or vehicle registration/title documents. If you can read ANY part of a VIN, include it in the vin_from_photo field. Even a partial VIN is valuable. Also look for mileage on any visible odometer reading.

Analyze the vehicle and provide a COMPREHENSIVE vehicle evaluation.

Return a JSON object:

{
  "identification": {
    "year": number,
    "make": "string",
    "model": "string",
    "trim": "string if identifiable",
    "generation": "Which generation (e.g. '12th gen F-150, 2009-2014')",
    "body_style": "Sedan | Coupe | SUV | Truck | Van | Wagon | Convertible | Motorcycle | Boat | RV | ATV | Other",
    "drivetrain": "FWD | RWD | AWD | 4WD | Unknown",
    "engine": "Best guess from model/trim",
    "transmission": "Automatic | Manual | CVT | Unknown",
    "color_exterior": "string",
    "color_interior": "string if visible",
    "vin_decoded": "If VIN visible, decode what you can",
    "vin_from_photo": "VIN number extracted from photos (full or partial), or null if no VIN visible",
    "odometer_from_photo": "Odometer reading extracted from photos, or null if not visible",
    "identification_confidence": number (0-100)
  },
  "condition_assessment": {
    "overall_grade": "A+ | A | B+ | B | C+ | C | D | F",
    "exterior": {
      "score": number (1-10),
      "paint_condition": "Excellent | Good | Fair | Poor",
      "body_damage": ["visible damage items"],
      "glass_condition": "assessment",
      "lights_condition": "assessment",
      "tire_condition": "assessment",
      "chrome_trim": "assessment",
      "overall_exterior_notes": "paragraph summary"
    },
    "interior": {
      "score": number (1-10),
      "seats": "condition",
      "dashboard": "condition",
      "steering_wheel": "condition",
      "carpet_headliner": "condition",
      "electronics": "condition",
      "odors_likely": "assessment",
      "overall_interior_notes": "paragraph summary"
    },
    "mechanical": {
      "score": number (1-10),
      "engine_bay": "assessment if visible",
      "undercarriage": "assessment if visible",
      "suspension_clues": "assessment",
      "exhaust": "assessment",
      "mechanical_concerns": ["potential issues"],
      "recommended_inspection": ["what mechanic should check"],
      "overall_mechanical_notes": "paragraph summary"
    },
    "condition_vs_seller_claim": "Does seller's claim match photos?"
  },
  "valuation": {
    "retail_value": { "low": number, "mid": number, "high": number },
    "private_party_value": { "low": number, "mid": number, "high": number },
    "trade_in_value": { "low": number, "mid": number, "high": number },
    "auction_value": { "low": number, "mid": number, "high": number },
    "valuation_factors": [{ "factor": "", "impact": "", "explanation": "" }],
    "kbb_range_estimate": "approximate KBB range",
    "nada_range_estimate": "approximate NADA range",
    "price_vs_market": "Overpriced | Well Priced | Underpriced | Steal",
    "depreciation_status": "depreciation assessment",
    "appreciation_potential": "classic/collector potential",
    "mileage_impact": "how mileage affects this specific vehicle"
  },
  "vehicle_history_context": {
    "common_problems": ["known issues for this year/make/model"],
    "recalls": ["known recalls"],
    "reliability_rating": "Excellent | Good | Average | Below Average | Poor",
    "maintenance_costs": "Low | Average | High | Very High",
    "insurance_estimate": "rough monthly estimate",
    "safety_rating": "IIHS/NHTSA if known",
    "fuel_economy": "city/highway MPG estimate",
    "years_this_model_to_avoid": ["bad years"],
    "years_this_model_to_buy": ["good years"]
  },
  "market_analysis": {
    "demand_level": "Hot | Strong | Moderate | Weak | Oversupplied",
    "demand_trend": "Rising | Stable | Declining",
    "seasonal_factors": "seasonal selling advice",
    "local_market": {
      "demand_in_area": "local demand assessment",
      "comparable_local_listings": number,
      "local_price_range": "$X — $Y",
      "local_vs_national": "comparison"
    },
    "buyer_demographics": "who buys this vehicle",
    "competing_models": ["competing vehicles"],
    "time_to_sell_estimate": "X — Y days"
  },
  "selling_strategy": {
    "best_selling_venue": "recommendation and why",
    "recommended_platforms": [
      { "platform": "", "why": "", "expected_price": number, "fees": "", "time_to_sell": "" }
    ],
    "listing_price": number,
    "minimum_accept": number,
    "negotiation_tips": "vehicle-specific advice",
    "what_to_fix_before_selling": [
      { "fix": "", "estimated_cost": "", "value_added": "", "worth_it": true, "reasoning": "" }
    ],
    "detailing_recommendations": "cleaning advice",
    "documentation_to_prepare": ["title", "service records", etc.],
    "test_drive_tips": "safe test drive guidance"
  },
  "local_pickup_plan": {
    "viewing_location": "recommendation",
    "safety_tips": ["safety guidance"],
    "payment_methods": "accepted payment methods with advice",
    "title_transfer_checklist": ["step-by-step checklist"],
    "state_specific_notes": "state-specific requirements"
  },
  "fun_facts": {
    "vehicle_trivia": "interesting fact",
    "production_numbers": "how many made",
    "celebrity_connection": "pop culture connection",
    "enthusiast_community": "community info",
    "modifier_potential": "mod potential"
  },
  "executive_summary": "5-8 sentences for the seller. What vehicle this is, what it's worth, where to sell it, any concerns, and the single most important action. Written warmly for a senior. LOCAL PICKUP ONLY."
}

IMPORTANT: All prices in USD. PRIVATE PARTY values only (not dealer retail). LOCAL PICKUP ONLY — vehicles cannot be shipped.`;

    let carbotResult: any;
    // CMD-CARBOT-CORE-A: track hybrid run for telemetry. Hoisted so
    // the CARBOT_RUN write below has access to merge strategy +
    // cost + tokens + grounding citations.
    let hybridRun: Awaited<ReturnType<typeof routeCarBotHybrid>> | null = null;

    if (openai) {
      try {
        // CMD-CARBOT-CORE-A: route through routeCarBotHybrid.
        // Gemini primary (with native Google Search grounding for
        // real-time vehicle market data + recall info) + OpenAI
        // secondary (fires on rare_vehicle trigger: year < 1980
        // OR mileage < 30000). photoUrls maps the item's photo
        // file paths from the included relation.
        const photoUrls = item.photos.slice(0, 4).map((p: any) => p.filePath);
        if (photoUrls.length === 0) {
          return NextResponse.json(
            { error: "CarBot requires at least one photo for visual inspection." },
            { status: 400 },
          );
        }

        // Caller-side rare_vehicle trigger evaluation (year < 1980
        // OR mileage < 30000). Produces shouldRunSecondary + an
        // optional rareVehicleContext string for the OpenAI pass.
        const vehYearNum = typeof vehicleYear === "number"
          ? vehicleYear
          : parseInt(String(vehicleYear), 10);
        const vehMileageNum = typeof vehData?.mileage === "number"
          ? vehData.mileage
          : parseInt(String(vehData?.mileage ?? "999999"), 10);
        const isRareYear = !isNaN(vehYearNum) && vehYearNum > 0 && vehYearNum < 1980;
        const isLowMileage = !isNaN(vehMileageNum) && vehMileageNum > 0 && vehMileageNum < 30000;
        const shouldRunSecondary = isRareYear || isLowMileage;
        const rareVehicleContext = shouldRunSecondary
          ? systemPrompt + `\n\nRARE VEHICLE SPECIALIST DIRECTIVE: This vehicle qualifies for rare-vehicle specialist review (${isRareYear ? "pre-1980 classic" : ""}${isRareYear && isLowMileage ? " + " : ""}${isLowMileage ? "sub-30k miles" : ""}). Emphasize collector value, auction house routing (Bring a Trailer, Mecum, Barrett-Jackson), documentation requirements (title chain, service records, matching-numbers verification), and appreciation outlook. Do NOT inflate values — give honest classic-car market math.`
          : undefined;

        hybridRun = await routeCarBotHybrid({
          itemId: item.id,
          photoPath: photoUrls,
          vehiclePrompt: systemPrompt,
          rareVehicleContext,
          shouldRunSecondary,
          // Vehicle market data is highly real-time — enable
          // Gemini native Google Search grounding on every scan.
          enableGrounding: true,
          // CarBot uses 90s / 16k like AntiqueBot for its dense
          // 10-section vehicle appraisal schema.
          timeoutMs: 90_000,
          maxTokens: 16_384,
        });

        if (hybridRun.degraded || !hybridRun.mergedResult) {
          console.error(
            "[carbot] hybrid degraded:",
            hybridRun.error ?? "all providers failed",
          );
          return NextResponse.json(
            {
              error: `CarBot AI analysis failed: ${hybridRun.error ?? "all providers failed"}`,
            },
            { status: 422 },
          );
        }

        carbotResult = hybridRun.mergedResult;

        // Merge Gemini grounding citations into result.web_sources
        // alongside the OpenAI web pre-pass citations.
        if (hybridRun.geminiWebSources.length > 0) {
          carbotResult.web_sources = [
            ...(Array.isArray(carbotResult.web_sources) ? carbotResult.web_sources : []),
            ...hybridRun.geminiWebSources,
          ];
        }
      } catch (aiErr: any) {
        console.error("[carbot] router error:", aiErr);
        return NextResponse.json(
          { error: `CarBot AI analysis failed: ${aiErr?.message ?? String(aiErr)}` },
          { status: 422 },
        );
      }
    } else {
      carbotResult = generateDemoResult(vehicleYear, vehicleMake, vehicleModel, vehicleMileage, condScore, estimatedLow, estimatedMid, estimatedHigh, sellerZip);
      carbotResult._isDemo = true;
    }

    // Validate required fields
    const requiredFields = [
      "identification", "condition_assessment", "valuation", "vehicle_history_context",
      "market_analysis", "selling_strategy", "local_pickup_plan", "fun_facts", "executive_summary",
    ];
    for (const key of requiredFields) {
      if (carbotResult[key] === undefined) carbotResult[key] = null;
    }
    // STEP 4.7: attach web search citations from the pre-pass
    if (prepassWebSources.length > 0) {
      carbotResult.web_sources = prepassWebSources;
    }

    // Store in EventLog (include NHTSA + VIN decode data alongside AI result)
    await prisma.eventLog.create({
      data: { itemId, eventType: "CARBOT_RESULT", payload: JSON.stringify({
        ...carbotResult,
        nhtsaReport: nhtsaReport || null,
        vinDecoded: vinDecoded || null,
      }) },
    });
    // CMD-CARBOT-CORE-A: extended CARBOT_RUN telemetry. Parity with
    // ANTIQUEBOT_RUN / COLLECTIBLESBOT_RUN / LISTBOT_RUN / BUYERBOT_RUN
    // / RECONBOT_RUN. Logs skill pack stats + spec summary + hybrid
    // routing telemetry + Gemini grounding citation count. Wrapped
    // in try/catch so a logging failure cannot block the user-facing
    // response.
    try {
      await prisma.eventLog.create({
        data: {
          itemId,
          eventType: "CARBOT_RUN",
          payload: JSON.stringify({
            userId: user.id,
            timestamp: new Date().toISOString(),
            // Skill pack telemetry (Round B will populate carbot/*.md;
            // Round A surfaces version + shared-pack count that load
            // on day one)
            skillPackVersion: skillPack.version,
            skillPackCount: skillPack.skillNames.length,
            skillPackChars: skillPack.totalChars,
            // Spec context summary (Constitution audit)
            specSummary,
            // Hybrid router telemetry (live runs only — demo path null)
            mergedStrategy: hybridRun?.mergedStrategy ?? null,
            secondaryTriggered: hybridRun?.secondaryTriggered ?? false,
            geminiGroundingCitations: hybridRun?.geminiWebSources?.length ?? 0,
            actualCostUsd: hybridRun?.actualCostUsd ?? 0,
            costUsd: hybridRun?.costUsd ?? 0,
            latencyMs: hybridRun?.latencyMs ?? 0,
            tokens: hybridRun?.tokens ?? { input: 0, output: 0, total: 0 },
            isDemo: !!carbotResult?._isDemo,
          }),
        },
      });
    } catch (logErr) {
      console.warn("[carbot] CARBOT_RUN log write failed (non-critical):", logErr);
    }

    // Fire-and-forget: PriceSnapshot from vehicle valuation (private party)
    const cbPP = carbotResult.valuation?.private_party_value;
    prisma.priceSnapshot.create({
      data: {
        itemId,
        source: "CARBOT",
        priceLow: cbPP?.low != null ? Math.round(Number(cbPP.low)) : null,
        priceHigh: cbPP?.high != null ? Math.round(Number(cbPP.high)) : null,
        priceMedian: cbPP?.mid != null ? Math.round(Number(cbPP.mid)) : null,
        confidence: carbotResult.identification?.identification_confidence != null ? `id_confidence: ${carbotResult.identification.identification_confidence}` : null,
      },
    }).catch(() => null);

    // Fire-and-forget: log user event
    logUserEvent(user.id, "BOT_RUN", { itemId, metadata: { botType: "CARBOT", success: true } }).catch(() => null);

    // Fire-and-forget: intelligence systems
    import("@/lib/bots/disagreement").then(m => m.checkBotDisagreement(itemId)).catch(() => null);
    import("@/lib/bots/demand-score").then(m => m.calculateDemandScore(itemId)).catch(() => null);

    return NextResponse.json({
      success: true,
      result: { ...carbotResult, nhtsaReport: nhtsaReport || null, vinDecoded: vinDecoded || null },
      isDemo: !!carbotResult._isDemo,
    });
  } catch (e) {
    console.error("[carbot POST]", e);
    return NextResponse.json({ error: "CarBot analysis failed" }, { status: 500 });
  }
}

/**
 * PATCH /api/bots/carbot/[itemId] — Save vehicle metadata (VIN, mileage, seller details)
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  try {
    const user = await authAdapter.getSession();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { itemId } = await params;
    const body = await req.json();

    const item = await prisma.item.findUnique({ where: { id: itemId }, select: { userId: true } });
    if (!item) return NextResponse.json({ error: "Item not found" }, { status: 404 });
    if (item.userId !== user.id) return NextResponse.json({ error: "Not your item" }, { status: 403 });

    // Upsert: delete old vehicle data, create new
    await prisma.eventLog.deleteMany({ where: { itemId, eventType: "CARBOT_VEHICLE_DATA" } });
    await prisma.eventLog.create({
      data: { itemId, eventType: "CARBOT_VEHICLE_DATA", payload: JSON.stringify(body) },
    });

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("[carbot PATCH]", e);
    return NextResponse.json({ error: "Failed to save vehicle data" }, { status: 500 });
  }
}

// ── Demo Result Generator ──────────────────────────────────────────────────

function generateDemoResult(
  year: string, make: string, model: string, mileage: string,
  condScore: number, low: number, mid: number, high: number, zip: string,
) {
  const yearNum = parseInt(year) || 2008;
  const miles = parseInt(mileage.replace(/[^\d]/g, "")) || 125000;
  const isClassic = yearNum < 1990;
  const isTruck = model.toLowerCase().includes("f-150") || model.toLowerCase().includes("truck") || model.toLowerCase().includes("silverado");
  const gradeMap: Record<number, string> = { 10: "A+", 9: "A", 8: "B+", 7: "B", 6: "C+", 5: "C", 4: "D" };
  const grade = gradeMap[condScore] || (condScore >= 7 ? "B" : "C");

  const ppLow = Math.round(mid * 0.85);
  const ppMid = mid;
  const ppHigh = Math.round(mid * 1.15);
  const tradeLow = Math.round(mid * 0.6);
  const tradeMid = Math.round(mid * 0.7);
  const tradeHigh = Math.round(mid * 0.8);
  const retailLow = Math.round(mid * 1.1);
  const retailMid = Math.round(mid * 1.25);
  const retailHigh = Math.round(mid * 1.4);

  return {
    _isDemo: true,
    identification: {
      year: yearNum,
      make: make !== "Unknown" ? make : "Ford",
      model: model !== "Unknown" ? model : "F-150",
      trim: isTruck ? "XLT" : "Base",
      generation: `${yearNum < 2009 ? "11th" : "12th"} gen${isTruck ? " F-150" : ""}`,
      body_style: isTruck ? "Truck" : "Sedan",
      drivetrain: isTruck ? "4WD" : "FWD",
      engine: isTruck ? "5.4L V8 Triton" : "2.5L I4",
      transmission: "Automatic",
      color_exterior: "White",
      color_interior: "Gray cloth",
      vin_decoded: "Not visible in photos",
      identification_confidence: 78,
    },
    condition_assessment: {
      overall_grade: grade,
      exterior: {
        score: Math.min(10, condScore + 1),
        paint_condition: condScore >= 7 ? "Good" : "Fair",
        body_damage: condScore >= 7 ? ["Minor door ding on passenger side", "Small scratch on rear bumper"] : ["Dent on driver's door", "Rust beginning on wheel wells", "Paint fading on hood"],
        glass_condition: "Good — no cracks or chips visible",
        lights_condition: condScore >= 6 ? "All lights functional, lenses clear" : "Headlight lenses yellowing",
        tire_condition: "Approximately 50% tread remaining on all four tires",
        chrome_trim: "Minor pitting on bumper chrome, badges intact",
        overall_exterior_notes: `The exterior is in ${condScore >= 7 ? "good" : "fair"} condition for a ${yearNum} model with ${miles.toLocaleString()} miles. ${condScore >= 7 ? "Paint has good shine with minor blemishes." : "Shows age-appropriate wear with some rust starting."} Overall presentation is ${condScore >= 7 ? "above average for age" : "average for age and mileage"}.`,
      },
      interior: {
        score: condScore,
        seats: condScore >= 7 ? "Good — minimal wear on driver's bolster, no tears" : "Driver's seat showing wear on bolster, small tear on passenger side",
        dashboard: condScore >= 7 ? "Good — no cracks, all gauges functional" : "Minor crack near defrost vent, gauges functional",
        steering_wheel: "Moderate wear on leather/rubber at 10 and 2 positions",
        carpet_headliner: "Carpet shows normal wear, headliner intact",
        electronics: "Radio, A/C, power windows all functional",
        odors_likely: condScore >= 7 ? "No concerning odors expected" : "Possible musty smell from age — recommend thorough cleaning",
        overall_interior_notes: `Interior is ${condScore >= 7 ? "well-maintained" : "showing its age"} for ${yearNum}. ${condScore >= 7 ? "Previous owner appeared to care for the cabin." : "Normal wear for age and mileage — a good detail would help significantly."}`,
      },
      mechanical: {
        score: Math.max(1, condScore - 1),
        engine_bay: "Not visible in photos — recommend inspection",
        undercarriage: isTruck ? "Expect some surface rust typical for northern vehicles — inspection critical" : "Not visible in photos",
        suspension_clues: "Vehicle appears to sit level — no obvious sag or uneven gaps",
        exhaust: "Cannot assess from photos",
        mechanical_concerns: [
          isTruck ? "5.4L Triton V8 known for spark plug ejection issue — verify repair history" : "Check timing chain/belt service history",
          `At ${miles.toLocaleString()} miles, verify transmission service history`,
          isTruck ? "Check for cam phaser rattle on cold start (common on 5.4L)" : "Check suspension components — struts/shocks may be due",
          "Verify brake condition — rotors and pads",
        ],
        recommended_inspection: [
          "Full diagnostic scan for stored codes",
          "Compression test on all cylinders",
          "Transmission fluid condition and level",
          "Brake measurement (pad thickness, rotor condition)",
          "Suspension inspection (bushings, ball joints, tie rods)",
          isTruck ? "Frame inspection for rust (critical in northern states)" : "Check CV joints/boots",
        ],
        overall_mechanical_notes: `At ${miles.toLocaleString()} miles on a ${yearNum} ${make} ${model}, key mechanical concerns are ${isTruck ? "the well-documented 5.4L spark plug issues, cam phaser wear, and potential frame rust" : "typical high-mileage items: suspension wear, brake condition, and drivetrain maintenance"}. A pre-purchase inspection ($100-150) is strongly recommended before listing.`,
      },
      condition_vs_seller_claim: `Seller claims "${condScore >= 7 ? "Good" : "Fair"}" condition, which ${condScore >= 6 ? "appears consistent" : "may be slightly optimistic"} based on visible indicators. A mechanical inspection would confirm.`,
    },
    valuation: {
      retail_value: { low: retailLow, mid: retailMid, high: retailHigh },
      private_party_value: { low: ppLow, mid: ppMid, high: ppHigh },
      trade_in_value: { low: tradeLow, mid: tradeMid, high: tradeHigh },
      auction_value: { low: Math.round(mid * 0.55), mid: Math.round(mid * 0.65), high: Math.round(mid * 0.75) },
      valuation_factors: [
        { factor: isTruck ? "4WD system" : "Fuel economy", impact: isTruck ? "+$800-1,200" : "+$300-500", explanation: isTruck ? "4WD commands premium in northern markets, especially Maine" : "Good fuel economy is always in demand" },
        { factor: `${miles.toLocaleString()} miles`, impact: miles > 150000 ? "-$1,500-2,500" : miles > 100000 ? "-$800-1,200" : "+$0", explanation: miles > 150000 ? "High mileage significantly reduces buyer confidence" : miles > 100000 ? "Above-average mileage for age — moderate impact" : "Acceptable mileage for age" },
        { factor: "Condition", impact: condScore >= 7 ? "+$500-800" : condScore >= 5 ? "$0" : "-$500-1,000", explanation: condScore >= 7 ? "Above-average condition adds value" : condScore >= 5 ? "Average condition — priced accordingly" : "Below-average condition reduces buyer pool" },
        ...(isTruck ? [{ factor: "Truck demand in Maine", impact: "+$500-1,000", explanation: "Trucks and 4WD vehicles command premium in Maine/New England" }] : []),
      ],
      kbb_range_estimate: `$${ppLow.toLocaleString()} – $${ppHigh.toLocaleString()} (Private Party, ${condScore >= 7 ? "Good" : "Fair"} condition)`,
      nada_range_estimate: `$${Math.round(ppLow * 0.95).toLocaleString()} – $${Math.round(ppHigh * 1.05).toLocaleString()} (Clean Trade to Clean Retail)`,
      price_vs_market: mid <= ppMid ? "Well Priced" : "Overpriced",
      depreciation_status: `This ${yearNum} has depreciated approximately ${Math.round((1 - mid / (retailHigh * 2.5)) * 100)}% from its original MSRP. ${isClassic ? "As a classic, it may have bottomed out and begun appreciating." : yearNum < 2010 ? "Most depreciation is behind it — value will decline slowly from here." : "Still depreciating 10-15% annually."}`,
      appreciation_potential: isClassic ? "Yes — classic vehicles in this category are showing 3-8% annual appreciation. Well-maintained examples command significant premiums." : isTruck ? "Unlikely to become a collectible, but trucks hold value better than sedans. 4WD versions are especially resilient." : "No appreciation expected. Sell sooner rather than later for best return.",
      mileage_impact: `${miles.toLocaleString()} miles is ${miles > 150000 ? "high" : miles > 100000 ? "above average" : "average"} for a ${new Date().getFullYear() - yearNum}-year-old vehicle. ${isTruck ? "Trucks typically handle higher mileage well — the 5.4L V8 can go 200k+ with proper maintenance." : "This mileage range is where buyers start asking more questions about maintenance history."}`,
    },
    vehicle_history_context: {
      common_problems: isTruck ? [
        "Spark plug ejection from cylinder heads (5.4L 3-valve) — $500-1,500 repair",
        "Cam phaser rattle on cold start — $1,200-2,500 to repair",
        "Blend door actuator failure (no heat/AC to one side) — $300-600",
        "Fuel pump failure (common above 100k miles) — $400-800",
        "Transmission shudder/harsh shifting — fluid change may help, rebuild $2,500-4,000",
      ] : [
        "Common for this era: suspension component wear above 100k miles",
        "Power window regulator failures — $200-400 per window",
        "A/C compressor failure common in older vehicles — $500-900",
        "Alternator/starter replacement due at this mileage — $300-600",
      ],
      recalls: isTruck ? [
        "NHTSA Recall: Airbag inflator (Takata) — check if completed",
        "NHTSA Recall: Cruise control deactivation switch (fire risk) — check if completed",
      ] : ["Check NHTSA.gov with VIN for model-specific recalls"],
      reliability_rating: isTruck ? "Good" : "Average",
      maintenance_costs: isTruck ? "Average" : "Low",
      insurance_estimate: `$${Math.round(mid * 0.008 + 40)}-${Math.round(mid * 0.012 + 60)}/month (liability + collision, clean record)`,
      safety_rating: "Check IIHS.org and NHTSA.gov for specific model year ratings",
      fuel_economy: isTruck ? "14 city / 20 highway (5.4L V8 4WD)" : "25 city / 33 highway (estimated)",
      years_this_model_to_avoid: isTruck ? ["2004-2005 (worst spark plug issues)", "2010 (first year redesign bugs)"] : [],
      years_this_model_to_buy: isTruck ? ["2006-2008 (refined 11th gen)", "2012-2014 (mature 12th gen)"] : [],
    },
    market_analysis: {
      demand_level: isTruck ? "Strong" : "Moderate",
      demand_trend: isTruck ? "Stable" : "Declining",
      seasonal_factors: isTruck ? "Trucks sell best in fall (hunting season) and early winter (before snow). Spring is second-best. Summer is slowest." : "Sedans sell relatively consistently year-round. Convertibles peak in spring/summer.",
      local_market: {
        demand_in_area: isTruck ? "Strong — trucks and 4WD are essential in Maine/New England" : "Average — standard demand for this type of vehicle",
        comparable_local_listings: isTruck ? 35 : 50,
        local_price_range: `$${Math.round(ppLow * 0.9).toLocaleString()} — $${Math.round(ppHigh * 1.1).toLocaleString()}`,
        local_vs_national: isTruck ? "Maine market pays 5-15% premium for 4WD trucks compared to national average" : "Local market is roughly aligned with national pricing",
      },
      buyer_demographics: isTruck ? "Working professionals age 30-55, outdoor enthusiasts, contractors, farmers. Strong demand from first-time truck buyers and those needing a reliable work vehicle." : "Commuters, families, first-time car buyers. Price-conscious buyers looking for reliable transportation.",
      competing_models: isTruck ? ["Chevrolet Silverado 1500", "Ram 1500", "Toyota Tundra", "Nissan Titan", "GMC Sierra 1500"] : ["Honda Accord", "Toyota Camry", "Nissan Altima", "Hyundai Sonata"],
      time_to_sell_estimate: isTruck ? "7 — 21 days (trucks sell quickly in Maine)" : "14 — 30 days",
    },
    selling_strategy: {
      best_selling_venue: `Facebook Marketplace and Craigslist are best for this ${yearNum} ${make} ${model}. ${isTruck ? "Trucks sell extremely well on Facebook in Maine — most buyers are local and ready to buy." : "These platforms reach the most local buyers for this price range."}`,
      recommended_platforms: [
        { platform: "Facebook Marketplace", why: "Largest local buyer pool, free to list, easy messaging", expected_price: ppMid, fees: "Free (local pickup)", time_to_sell: "7-14 days" },
        { platform: "Craigslist", why: "Still strong for vehicles, especially trucks and older models", expected_price: Math.round(ppMid * 0.95), fees: "Free", time_to_sell: "10-21 days" },
        { platform: "AutoTrader", why: "Serious buyers actively shopping, good search tools", expected_price: Math.round(ppMid * 1.05), fees: "$25-50 listing fee", time_to_sell: "14-30 days" },
        ...(mid > 15000 ? [{ platform: "CarGurus", why: "Price analysis helps buyers see value, good for fair-priced vehicles", expected_price: ppMid, fees: "Free for private sellers", time_to_sell: "14-21 days" }] : []),
        ...(isClassic ? [{ platform: "Bring a Trailer", why: "Perfect for classic vehicles, enthusiast audience drives competitive bidding", expected_price: Math.round(ppHigh * 1.2), fees: "5% buyer's premium", time_to_sell: "7 days (auction format)" }] : []),
      ],
      listing_price: Math.round(ppHigh * 1.05),
      minimum_accept: Math.round(ppLow * 0.9),
      negotiation_tips: `List at $${Math.round(ppHigh * 1.05).toLocaleString()} to leave room for negotiation. Expect first offers around $${Math.round(ppLow * 0.8).toLocaleString()}. Counter at $${ppMid.toLocaleString()}. ${isTruck ? "Truck buyers often come prepared — have maintenance records ready." : "Be prepared for tire-kickers. Serious buyers ask about maintenance history."} Don't accept any offer in the first 48 hours unless it's above your target price.`,
      what_to_fix_before_selling: [
        { fix: "Professional detail (interior + exterior)", estimated_cost: "$150 — $250", value_added: "+$300 — $600", worth_it: true, reasoning: "Clean vehicles sell 15-25% faster and for 5-8% more. Best ROI prep you can do." },
        { fix: "Fix minor cosmetic issues (touch-up paint, clean headlights)", estimated_cost: "$30 — $75", value_added: "+$200 — $400", worth_it: true, reasoning: "First impressions matter enormously. These are cheap fixes that signal care." },
        ...(condScore < 7 ? [{ fix: "Address any warning lights", estimated_cost: "$100 — $500", value_added: "+$500 — $1,500", worth_it: true as const, reasoning: "Warning lights immediately scare buyers and tank your price. Fix what you can." }] : []),
        { fix: "New tires (if needed)", estimated_cost: "$400 — $800", value_added: "+$200 — $400", worth_it: false, reasoning: "Unless tires are bald, not worth the investment. Buyers expect to negotiate on tires." },
      ],
      detailing_recommendations: "Wash, clay bar, and wax exterior. Vacuum and shampoo interior. Clean all windows inside and out. Dress tires. Clean engine bay if selling to an enthusiast. Remove all personal items and trash. Clean trunk/bed thoroughly.",
      documentation_to_prepare: ["Title (clean, signed)", "Service records and receipts", "Carfax or AutoCheck report ($25-40)", "Maintenance receipts", "Owner's manual (if available)", "Spare key (if available)", "Smog/emissions certificate (if required in your state)"],
      test_drive_tips: "Meet in a public location (police station parking lot is ideal). Verify buyer has valid license and insurance before test drive. Ride along on all test drives — never hand over keys. Plan a route you know (avoid highways for first test). Hold their license while they drive. Never accept personal checks. Get cash or cashier's check verified at their issuing bank.",
    },
    local_pickup_plan: {
      viewing_location: "Meet at a public location like a police station, bank parking lot, or busy shopping center. Well-lit areas with security cameras are ideal. If showing at home, have someone with you.",
      safety_tips: [
        "Always meet in daylight in a public place",
        "Bring a friend or family member to all viewings",
        "Never hand over keys before receiving full payment",
        "Verify buyer's driver's license and insurance before test drive",
        "For large amounts, meet at buyer's bank to verify cashier's check",
        "Trust your instincts — if something feels wrong, walk away",
      ],
      payment_methods: "Cash (verify at bank for amounts over $5,000) | Cashier's check (verify with issuing bank by calling their published number, NOT a number on the check) | Wire transfer (confirm receipt before releasing vehicle) | Escrow service for vehicles over $10,000",
      title_transfer_checklist: [
        "Sign the title over to buyer (both parties sign)",
        "Complete a bill of sale (both parties sign, keep copies)",
        "Record the odometer reading on the title",
        "Remove your license plates",
        "Cancel your insurance AFTER the transfer is complete",
        "Notify your state's DMV of the sale (protects you from future liability)",
        "Keep copies of everything for your records",
        "Take photos of the buyer's ID and the signed documents",
      ],
      state_specific_notes: "Maine requirements: Complete the back of the title, provide a bill of sale, buyer has 30 days to register. Seller should notify Maine BMV of the sale. No state inspection required at time of private sale, but buyer will need inspection within 30 days of registration.",
    },
    fun_facts: {
      vehicle_trivia: isTruck ? "The Ford F-150 has been America's best-selling vehicle for over 40 consecutive years. More F-150s are on the road than any other truck model in history." : `The ${make} ${model} has been a popular choice for American families for decades.`,
      production_numbers: isTruck ? "Ford produces approximately 900,000 F-Series trucks annually — about one every 35 seconds." : "Mass-produced model with wide availability",
      celebrity_connection: isTruck ? "The Ford F-150 has appeared in more movies and TV shows than any other vehicle. It's the official truck of the NFL." : "A staple of American roads for generations.",
      enthusiast_community: isTruck ? "Huge community! F150Forum.com, FordTrucks.com, and local truck meets. Facebook groups with 500K+ members." : "Active owner forums and Facebook groups for most popular models.",
      modifier_potential: isTruck ? "Very popular for modification — lift kits, wheels/tires, exhaust, tuners, and bed accessories. A well-modified F-150 can command premium over stock." : "Limited modification market for this vehicle type.",
    },
    executive_summary: `Your ${yearNum} ${make} ${model} is a ${condScore >= 7 ? "solid" : "decent"} vehicle that should sell well in your local market. Based on our analysis, it's worth approximately $${ppLow.toLocaleString()} to $${ppHigh.toLocaleString()} in a private sale, with a sweet spot around $${ppMid.toLocaleString()}. ${isTruck ? "Trucks are always in demand in Maine, especially 4WD models — you should have no trouble finding a buyer." : "This is a practical vehicle with consistent demand."} We recommend listing on Facebook Marketplace at $${Math.round(ppHigh * 1.05).toLocaleString()} and being prepared to negotiate. ${condScore < 7 ? "Before listing, invest $150-250 in a professional detail — it will pay for itself in a higher sale price." : "The vehicle presents well — a quick wash and vacuum should be sufficient."} Remember: LOCAL PICKUP ONLY — meet buyers in a safe, public location, and never hand over keys before receiving verified payment. ${miles > 150000 ? "Be upfront about the mileage — honest sellers build trust and close deals faster." : ""}`,
  };
}
