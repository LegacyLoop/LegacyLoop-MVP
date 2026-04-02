import { authAdapter } from "@/lib/adapters/auth";
import { prisma } from "@/lib/db";
import { aiAdapter } from "@/lib/adapters/ai";
import { pricingAdapter } from "@/lib/adapters/pricing";
import { detectAntiqueFromAi } from "@/lib/antique-detect";
import { calculatePricing } from "@/lib/pricing/calculate";
import { blurPlatesForItem } from "@/lib/blur-plate";
import { populateFromAnalysis, populateFromRainforest } from "@/lib/data/populate-intelligence";
import { logUserEvent } from "@/lib/data/user-events";
import { searchAmazon, buildSearchTerm } from "@/lib/adapters/rainforest";
import type { RainforestEnrichmentData } from "@/lib/adapters/rainforest";
import { isAmazonEligible } from "@/lib/amazon-eligibility";
import { BOT_CREDIT_COSTS } from "@/lib/constants/pricing";
import { isDemoMode } from "@/lib/bot-mode";
import { checkCredits, deductCredits, isFreeAnalysisAvailable } from "@/lib/credits";

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Extract a [Tag: value] from the description string */
function extractTag(description: string | null, tagName: string): string | null {
  if (!description) return null;
  const re = new RegExp(`\\[${tagName}:\\s*([^\\]]+)\\]`, "i");
  const m = description.match(re);
  return m ? m[1].trim() : null;
}

/** Build a structured seller data block for the AI prompt */
function buildSellerContext(item: any): string {
  const lines: string[] = [];
  const add = (label: string, val: any) => {
    if (val != null && val !== "" && val !== "Unknown" && val !== "Not sure") {
      lines.push(`- ${label}: ${val}`);
    } else {
      lines.push(`- ${label}: Not provided by seller`);
    }
  };

  add("Title", item.title);
  add("Condition (seller-reported)", item.condition);
  add("Number of owners", item.numberOfOwners || extractTag(item.description, "Owners"));
  add("Known damage or repairs", item.knownDamage || extractTag(item.description, "Damage/Repairs"));
  add("Original packaging", item.hasOriginalPackaging || extractTag(item.description, "Original Packaging"));
  add("Works properly", item.worksProperly || extractTag(item.description, "Functionality"));
  add("Approximate age", item.approximateAge || extractTag(item.description, "Age Estimate"));
  add("Purchase price", item.purchasePrice != null ? `$${item.purchasePrice}` : null);
  add("Purchase date", item.purchaseDate ? new Date(item.purchaseDate).toISOString().slice(0, 10) : null);
  add("Sale method", item.saleMethod);
  add("Sale ZIP code", item.saleZip);
  add("Sale radius", item.saleRadiusMi != null ? `${item.saleRadiusMi} miles` : null);

  if (item.description) {
    // Strip tags from description for the "Additional notes" line
    const cleaned = item.description.replace(/\[[^\]]+\]/g, "").trim();
    if (cleaned) lines.push(`- Additional notes: ${cleaned}`);
  }

  return lines.join("\n");
}

// ─── Route ────────────────────────────────────────────────────────────────────

export async function POST(
  req: Request,
  { params }: { params: Promise<{ itemId: string }> }
) {
  const { itemId } = await params;

  const user = await authAdapter.getSession();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const item = await prisma.item.findUnique({
    where: { id: itemId },
    include: { photos: true, aiResult: true, valuation: true, antiqueCheck: true },
  });

  if (!item || item.userId !== user.id) {
    return new Response("Not found", { status: 404 });
  }

  const force = new URL(req.url).searchParams.get("force") === "1";

  if (!force && item.aiResult && item.valuation) {
    return new Response("SKIPPED (cached)", { status: 200 });
  }

  // ── Tier + Credit Gate (free first run, then 1 credit) ──
  if (!isDemoMode()) {
    const isFirstRun = await isFreeAnalysisAvailable(user.id);
    if (!isFirstRun) {
      const cc = await checkCredits(user.id, BOT_CREDIT_COSTS.singleBotRun);
      if (!cc.hasEnough) {
        return Response.json(
          { error: "insufficient_credits", message: "Not enough credits. Your free analysis has been used.", balance: cc.balance, required: BOT_CREDIT_COSTS.singleBotRun, buyUrl: "/credits" },
          { status: 402 }
        );
      }
      await deductCredits(user.id, BOT_CREDIT_COSTS.singleBotRun, "AnalyzeBot re-run", itemId);
    }
  }

  const photoPaths = item.photos.map((p) => p.filePath);

  // Build structured seller data block
  let sellerContext = buildSellerContext(item);

  // ── Pre-fetch Amazon market data (feeds AI analysis + all downstream bots) ──
  let amazonData: RainforestEnrichmentData | null = null;
  try {
    // Check if this item already has stored Amazon data from a previous analysis
    const existingAmazon = await prisma.eventLog.findFirst({
      where: { itemId: item.id, eventType: "RAINFOREST_RESULT" },
      orderBy: { createdAt: "desc" },
    });

    if (existingAmazon?.payload) {
      // Re-run or downstream: use stored data — no API call
      amazonData = JSON.parse(existingAmazon.payload) as RainforestEnrichmentData;
      console.log(`[analyze] Using stored Amazon data (${amazonData.resultCount} results, from ${new Date(existingAmazon.createdAt).toLocaleDateString()})`);
    } else {
      // First analysis: check eligibility BEFORE spending API credits
      const eligibility = isAmazonEligible(
        (item as any).category ?? null,
        null,
        item.title,
        null,
        null
      );

      if (eligibility.eligible) {
        const searchTerm = buildSearchTerm(item.title || "item");
        amazonData = await searchAmazon(searchTerm).catch(() => null);
        console.log(`[analyze] Amazon eligibility: ELIGIBLE (${eligibility.reason}). Results: ${amazonData?.resultCount ?? 0}`);
      } else {
        console.log(`[analyze] Amazon eligibility: SKIPPED (${eligibility.reason}). Saving API credits.`);
        await prisma.eventLog.create({
          data: {
            itemId: item.id,
            eventType: "AMAZON_SKIPPED",
            payload: JSON.stringify({ reason: eligibility.reason, confidence: eligibility.confidence }),
          },
        }).catch(() => null);
      }

      if (amazonData) {
        await prisma.eventLog.create({
          data: {
            itemId: item.id,
            eventType: "RAINFOREST_RESULT",
            payload: JSON.stringify(amazonData),
          },
        });
        console.log(`[analyze] Amazon data fetched and stored: ${amazonData.resultCount} results, ${amazonData.priceRange.low}-${amazonData.priceRange.high}`);
        populateFromRainforest(item.id, amazonData as unknown as Record<string, unknown>).catch(() => null);
      } else {
        console.log("[analyze] No Amazon data found — proceeding without");
      }
    }

    // Append Amazon context to seller data block for the AI prompt
    if (amazonData && amazonData.resultCount > 0) {
      const amazonLines: string[] = [
        "",
        "AMAZON MARKET CONTEXT (real-time product data — use for pricing accuracy):",
        `- Amazon search term: "${amazonData.searchTerm}"`,
        `- ${amazonData.resultCount} matching Amazon listings found`,
        `- Amazon price range: ${amazonData.priceRange.low} – ${amazonData.priceRange.high} (avg: ${amazonData.priceRange.avg}, median: ${amazonData.priceRange.median})`,
      ];
      const topProducts = amazonData.results.slice(0, 3);
      if (topProducts.length > 0) {
        amazonLines.push("- Top Amazon matches:");
        topProducts.forEach((p, i) => {
          const parts = [`  ${i + 1}. "${p.title}"`];
          if (p.price) parts.push(`${p.price}`);
          if (p.rating) parts.push(`${p.rating}★`);
          if (p.ratingsTotal) parts.push(`(${p.ratingsTotal} reviews)`);
          if (p.condition !== "New") parts.push(`[${p.condition}]`);
          amazonLines.push(parts.join(" — "));
        });
      }
      amazonLines.push(
        "- NOTE: These are NEW retail prices on Amazon. The item being analyzed is USED/SECONDHAND.",
        "  Adjust pricing accordingly — used items typically sell for 30-70% of Amazon retail",
        "  depending on condition, age, and demand. Use Amazon prices as a CEILING, not as the estimate."
      );
      sellerContext = (sellerContext || "") + "\n" + amazonLines.join("\n");
    }
  } catch (amazonErr: any) {
    console.error("[analyze] Amazon pre-fetch failed (non-fatal):", amazonErr?.message);
  }

  // 1) Vision analysis
  let analysis;
  try {
    analysis = await aiAdapter.analyze(photoPaths, sellerContext || undefined);
  } catch (aiErr: any) {
    const msg = aiErr?.message ?? String(aiErr);
    return new Response(`AI analysis failed: ${msg}`, { status: 422 });
  }

  await prisma.aiResult.upsert({
    where: { itemId: item.id },
    update: { rawJson: JSON.stringify(analysis), confidence: analysis.confidence },
    create: { itemId: item.id, rawJson: JSON.stringify(analysis), confidence: analysis.confidence },
  });

  // Fire-and-forget: populate structured intelligence fields from AI analysis
  populateFromAnalysis(itemId, analysis as unknown as Record<string, unknown>).catch(() => null);

  // 2) New pricing pipeline (calculate.ts) — pass all seller data
  const numOwners = (item as any).numberOfOwners || extractTag(item.description, "Owners");

  let pricingResult;
  try {
    pricingResult = calculatePricing({
      ai: analysis,
      sellerCondition: item.condition,
      numOwners,
      saleZip: item.saleZip,
      userTier: user.tier,
      isHero: false,
      purchasePrice: item.purchasePrice,
      category: analysis.category,
    });
  } catch (pricingErr: any) {
    console.error("Pricing pipeline error:", pricingErr);
    return new Response(`AI analysis succeeded but pricing failed: ${pricingErr?.message || "unknown error"}`, { status: 422 });
  }

  // 3) Also run legacy pricing pipeline for comps + backward compat
  let estimate: any = { low: 0, high: 0, comps: [], source: "none", sources: {} };
  try {
    estimate = await pricingAdapter.getEstimate({
      ai: analysis,
      condition: item.condition,
      notes: item.description,
      purchasePrice: item.purchasePrice,
      purchaseDate: item.purchaseDate,
      saleMethod: item.saleMethod,
      saleZip: item.saleZip,
      saleRadiusMi: item.saleRadiusMi,
      amazonData: amazonData ?? undefined,
    });
  } catch (legacyErr: any) {
    console.error("Legacy pricing fallback error (non-fatal):", legacyErr);
  }

  const aiRationale = estimate.sources?.ai?.rationale ?? analysis.pricing_rationale ?? null;

  // Store the full pricing pipeline result as JSON in onlineRationale
  const extendedJson = JSON.stringify(pricingResult);

  // Use the new pipeline prices as primary, with legacy as fallback
  const primaryLow = pricingResult.localPrice.low || estimate.low;
  const primaryMid = pricingResult.localPrice.mid || Math.round((primaryLow + (pricingResult.localPrice.high || estimate.high)) / 2);
  const primaryHigh = pricingResult.localPrice.high || estimate.high;

  const valuationData = {
    low: primaryLow,
    mid: primaryMid,
    high: primaryHigh,
    confidence: pricingResult.confidence,
    source: `AI pricing pipeline (tier ${user.tier})`,
    rationale: aiRationale,
    localLow: pricingResult.localPrice.low,
    localMid: pricingResult.localPrice.mid,
    localHigh: pricingResult.localPrice.high,
    localConfidence: pricingResult.confidence,
    localSource: pricingResult.localPrice.label,
    onlineLow: pricingResult.nationalPrice.low,
    onlineMid: pricingResult.nationalPrice.mid,
    onlineHigh: pricingResult.nationalPrice.high,
    onlineConfidence: pricingResult.confidence,
    onlineSource: "National average",
    onlineRationale: extendedJson,
    bestMarketLow: pricingResult.bestMarket.low,
    bestMarketMid: pricingResult.bestMarket.mid,
    bestMarketHigh: pricingResult.bestMarket.high,
    bestMarketCity: pricingResult.bestMarket.label,
    sellerNetLocal: pricingResult.sellerNet.local,
    sellerNetNational: pricingResult.sellerNet.national,
    sellerNetBestMarket: pricingResult.sellerNet.bestMarket,
    recommendation: pricingResult.recommendation,
    adjustments: JSON.stringify(pricingResult.adjustments),
  };

  try {
    await prisma.valuation.upsert({
      where: { itemId: item.id },
      update: valuationData,
      create: { itemId: item.id, ...valuationData },
    });
  } catch (valErr: any) {
    console.error("Valuation save error:", valErr);
    return new Response(`Analysis succeeded but failed to save pricing: ${valErr?.message || "database error"}`, { status: 500 });
  }

  // Fire-and-forget: create PriceSnapshot from analyze pipeline pricing
  prisma.priceSnapshot.create({
    data: {
      itemId: item.id,
      source: "ANALYZE_PIPELINE",
      priceLow: primaryLow ? Math.round(primaryLow) : null,
      priceHigh: primaryHigh ? Math.round(primaryHigh) : null,
      priceMedian: primaryMid ? Math.round(primaryMid) : null,
      confidence: `pipeline confidence ${pricingResult.confidence}`,
    },
  }).catch(() => null);

  // 4) Save live comps (from legacy pipeline)
  try {
    await prisma.marketComp.deleteMany({ where: { itemId: item.id } });

    if (estimate.comps && estimate.comps.length) {
      await prisma.marketComp.createMany({
        data: estimate.comps.slice(0, 8).map((c: any) => ({
          itemId: item.id,
          platform: c.platform,
          title: c.title,
          price: c.price,
          currency: c.currency,
          url: c.url,
          shipping: c.shipping ?? null,
        })),
      });
    }
  } catch (compErr: any) {
    console.error("Market comp save error (non-fatal):", compErr);
  }

  // ── POST-ANALYSIS VALIDATION ──
  // 1. Age vs is_antique consistency
  if (analysis.estimated_age_years != null && analysis.estimated_age_years >= 50 && analysis.is_antique !== true) {
    console.warn(`[Validation] Age=${analysis.estimated_age_years} years but is_antique=${analysis.is_antique}. Forcing is_antique=true.`);
    analysis.is_antique = true;
    if (!Array.isArray(analysis.antique_markers)) (analysis as any).antique_markers = [];
    (analysis as any).antique_markers.push(`Age-based: estimated ${analysis.estimated_age_years} years old`);
  }

  // 2. Antique markers present but is_antique=false
  if (Array.isArray(analysis.antique_markers) && analysis.antique_markers.length >= 3 && analysis.is_antique !== true) {
    console.warn(`[Validation] ${analysis.antique_markers.length} antique markers but is_antique=${analysis.is_antique}. Forcing is_antique=true.`);
    analysis.is_antique = true;
  }

  // 3. is_collectible fallback — detect from category/keywords if AI didn't provide
  if ((analysis as any).is_collectible == null) {
    const collectibleCategories = /trading card|sports card|coin|stamp|comic|vinyl|record|sneaker|watch|figurine|toy|game|memorabilia/i;
    if (collectibleCategories.test(analysis.category || "") || collectibleCategories.test(analysis.item_name || "")) {
      (analysis as any).is_collectible = true;
    }
  }

  // 4. Condition score sanity (redundant safety — ai.ts also clamps, but protects against bypasses)
  if (analysis.condition_score != null) analysis.condition_score = Math.max(1, Math.min(10, Math.round(analysis.condition_score)));
  if (analysis.condition_cosmetic != null) analysis.condition_cosmetic = Math.max(1, Math.min(10, Math.round(analysis.condition_cosmetic)));
  if (analysis.condition_functional != null) analysis.condition_functional = Math.max(1, Math.min(10, Math.round(analysis.condition_functional)));

  // 5. Price range sanity
  if (analysis.estimated_value_low != null && analysis.estimated_value_high != null) {
    if (analysis.estimated_value_low > analysis.estimated_value_high) {
      const temp = analysis.estimated_value_low;
      analysis.estimated_value_low = analysis.estimated_value_high;
      analysis.estimated_value_high = temp;
    }
    if (analysis.estimated_value_mid == null) {
      analysis.estimated_value_mid = Math.round((analysis.estimated_value_low + analysis.estimated_value_high) / 2);
    }
  }

  // 5) Enhanced antique detection
  let antiqueResult: any = { isAntique: false, reason: "Detection skipped", markers: [], score: 0, auctionLow: null, auctionHigh: null };
  try {
    antiqueResult = detectAntiqueFromAi(analysis);
  } catch (antiqueErr: any) {
    console.error("Antique detection error (non-fatal):", antiqueErr);
  }

  // ── ANTIQUE PRESERVATION ──
  // If prior analysis confirmed antique AND new analysis is ambiguous, preserve prior
  let priorAntiqueCheck: { isAntique: boolean; score: number | null; reason: string | null } | null = null;
  try {
    priorAntiqueCheck = await prisma.antiqueCheck.findUnique({
      where: { itemId: item.id },
      select: { isAntique: true, reason: true },
    }) as any;
    // Extract score from prior reason JSON if stored
    if (priorAntiqueCheck?.reason) {
      try {
        const parsed = JSON.parse(priorAntiqueCheck.reason);
        (priorAntiqueCheck as any).score = parsed.score ?? null;
      } catch { /* reason is plain text, no score */ }
    }
  } catch { /* non-critical */ }

  if (priorAntiqueCheck?.isAntique === true && !antiqueResult.isAntique) {
    if ((antiqueResult.score ?? 0) >= 3) {
      console.log(`[Antique Preservation] Prior=true, new score=${antiqueResult.score}. Preserving antique status.`);
      antiqueResult.isAntique = true;
      antiqueResult.reason = `Prior analysis confirmed antique (preserved). New scan score: ${antiqueResult.score}. ${antiqueResult.reason || ""}`;
      antiqueResult._preserved = true;
    } else {
      console.warn(`[Antique Preservation] Prior=true, new score=${antiqueResult.score}. ALLOWING downgrade — low confidence.`);
      antiqueResult._downgraded = true;
    }
  }

  const reasonWithMeta = antiqueResult.isAntique
    ? JSON.stringify({ reason: antiqueResult.reason, markers: antiqueResult.markers, score: antiqueResult.score })
    : antiqueResult.reason;

  try {
    await prisma.antiqueCheck.upsert({
      where: { itemId: item.id },
      update: {
        isAntique: antiqueResult.isAntique,
        reason: reasonWithMeta,
        auctionLow: antiqueResult.auctionLow,
        auctionHigh: antiqueResult.auctionHigh,
      },
      create: {
        itemId: item.id,
        isAntique: antiqueResult.isAntique,
        reason: reasonWithMeta,
        auctionLow: antiqueResult.auctionLow,
        auctionHigh: antiqueResult.auctionHigh,
      },
    });
  } catch (antiqueDbErr: any) {
    console.error("Antique check save error (non-fatal):", antiqueDbErr);
  }

  // ── AUDIT TRAIL: Log every antique/collectible detection decision ──
  await prisma.eventLog.create({
    data: {
      itemId: item.id,
      eventType: "ANTIQUE_DETECTION",
      payload: JSON.stringify({
        aiFlag: analysis.is_antique,
        aiAge: analysis.estimated_age_years,
        aiMarkers: analysis.antique_markers,
        detectorResult: antiqueResult.isAntique,
        detectorScore: antiqueResult.score,
        detectorMarkers: antiqueResult.markers,
        preserved: antiqueResult._preserved || false,
        downgraded: antiqueResult._downgraded || false,
        priorWasAntique: priorAntiqueCheck?.isAntique || false,
        auctionLow: antiqueResult.auctionLow,
        auctionHigh: antiqueResult.auctionHigh,
      }),
    },
  }).catch(() => {});

  // Collectible detection audit
  if ((analysis as any).is_collectible != null) {
    await prisma.eventLog.create({
      data: {
        itemId: item.id,
        eventType: "COLLECTIBLE_DETECTION",
        payload: JSON.stringify({
          aiFlag: (analysis as any).is_collectible,
          category: analysis.category,
          subcategory: analysis.subcategory,
        }),
      },
    }).catch(() => {});
  }

  // ── Collectible detection (server-side storage) ──
  let collectibleResult = { isCollectible: false, category: null as string | null, confidence: 0, signals: [] as string[] };
  try {
    const { detectCollectible } = await import("@/lib/collectible-detect");
    collectibleResult = detectCollectible(analysis);
  } catch (e) {
    console.error("Collectible detection error (non-fatal):", e);
  }

  if (collectibleResult.isCollectible) {
    await prisma.eventLog.create({
      data: {
        itemId: item.id,
        eventType: "COLLECTIBLE_DETECTED",
        payload: JSON.stringify(collectibleResult),
      },
    }).catch(() => {});
  }

  // 6) Auto-fill blanks + set status to ANALYZED
  try {
    await prisma.item.update({
      where: { id: item.id },
      data: {
        status: "ANALYZED",
        title: item.title ?? analysis.item_name ?? null,
        condition: item.condition ?? analysis.condition_guess ?? null,
        description: item.description ?? analysis.notes ?? null,
      },
    });
  } catch (updateErr: any) {
    console.error("Item status update error (non-fatal):", updateErr);
  }

  // 7) Auto-blur license plates if vehicle detected
  console.log("=== BLUR DIAGNOSTIC ===");
  console.log("analysis.category:", (analysis as any).category);
  console.log("analysis.item_type:", (analysis as any).item_type);
  console.log("analysis.is_vehicle:", (analysis as any).is_vehicle);
  console.log("analysis.vehicle_type:", (analysis as any).vehicle_type);
  console.log("analysis.vehicle_make:", (analysis as any).vehicle_make);
  console.log("analysis.vehicle_model:", (analysis as any).vehicle_model);
  console.log("analysis.vehicle_year:", (analysis as any).vehicle_year);

  const a = analysis as any;

  // ── Outdoor equipment exclusion — lawn mowers, garden tractors, etc. are NOT vehicles ──
  const categoryStr = String(a.category ?? "").toLowerCase();
  const subcategoryStr = String(a.subcategory ?? "").toLowerCase();
  const itemNameStr = String(a.item_name ?? a.itemName ?? "").toLowerCase();
  const isOutdoorEquipment = (
    categoryStr.includes("outdoor") ||
    categoryStr.includes("garden") ||
    /\b(lawn\s*mower|riding\s*mower|push\s*mower|garden\s*tractor|lawn\s*tractor|chainsaw|leaf\s*blower|pressure\s*washer|snow\s*blower|weed\s*(eater|trimmer|whacker)|hedge\s*trimmer|rototiller|log\s*splitter|wood\s*chipper|generator|power\s*washer)\b/i.test(itemNameStr) ||
    /\b(lawn\s*mower|riding\s*mower|push\s*mower|garden\s*tractor|lawn\s*tractor|chainsaw|leaf\s*blower|pressure\s*washer|snow\s*blower)\b/i.test(subcategoryStr)
  );

  if (isOutdoorEquipment) {
    console.log("[analyze] Outdoor equipment detected — NOT a vehicle. Category:", categoryStr, "| Name:", itemNameStr.slice(0, 60));
  }

  const isVehicle = !isOutdoorEquipment && !!(
    a.is_vehicle === true ||
    a.isVehicle === true ||
    a.vehicle_type != null ||
    a.vehicleType != null ||
    a.vehicle_make != null ||
    a.vehicle_model != null ||
    a.vehicle_year != null ||
    /\b(car|vehicle|truck|van|suv|motorcycle|auto|automobile|pickup|sedan|coupe|convertible|rv|boat|trailer|minivan|lorry)\b/i.test(categoryStr) ||
    /\b(car|vehicle|truck|van|suv|motorcycle|auto|automobile|pickup|sedan|coupe|convertible|rv|boat|trailer|minivan|lorry)\b/i.test(String(a.item_type ?? "").toLowerCase()) ||
    /\b(car|vehicle|truck|van|suv|motorcycle|auto|automobile|pickup|sedan|coupe|convertible|rv|boat|trailer|minivan|lorry)\b/i.test(String(a.itemType ?? "").toLowerCase()) ||
    /\b(car|vehicle|truck|van|suv|motorcycle|auto|automobile|pickup|sedan|coupe|convertible|rv|boat|trailer|minivan|lorry)\b/i.test(String(a.type ?? "").toLowerCase())
  );
  console.log("=== VEHICLE CHECK RESULT:", isVehicle, "| Outdoor equipment:", isOutdoorEquipment, "===");

  if (isVehicle) {
    console.log("[analyze] Vehicle confirmed — triggering automatic plate blur for item:", item.id);
    try {
      const { blurredCount } = await blurPlatesForItem(item.id);
      console.log("[analyze] Auto plate blur complete —", blurredCount, "photos blurred");
    } catch (blurErr: any) {
      console.error("[analyze] Auto plate blur failed (non-fatal):", blurErr?.message);
    }
  } else {
    console.log("[analyze] Not a vehicle — skipping plate blur");
  }

  try {
    await prisma.eventLog.create({
      data: {
        itemId: item.id,
        eventType: force ? "ANALYZED_FORCE" : "ANALYZED",
        payload: JSON.stringify({
          provider: "openai",
          comps: estimate.comps?.length ?? 0,
          isAntique: antiqueResult.isAntique,
          suggestMegabot: estimate.suggestMegabot ?? false,
          pricingSource: `pipeline + ${estimate.source}`,
          pipelineConfidence: pricingResult.confidence,
          adjustments: pricingResult.adjustments.length,
          sellerNetLocal: pricingResult.sellerNet.local,
          sellerNetBestMarket: pricingResult.sellerNet.bestMarket,
          amazonEnriched: !!amazonData,
          amazonResultCount: amazonData?.resultCount ?? 0,
          amazonPriceRange: amazonData?.priceRange ?? null,
        }),
      },
    });
  } catch (logErr: any) {
    console.error("Event log error (non-fatal):", logErr);
  }

  // Fire-and-forget: log user event for analytics
  logUserEvent(user.id, "BOT_RUN", {
    itemId,
    metadata: { botType: "ANALYZEBOT", success: true },
  }).catch(() => null);

  // Fire-and-forget: auto-sequence → trigger PriceBot
  const cookieHeader = req.headers.get("cookie") || "";
  import("@/lib/bots/sequencer").then(m => m.triggerNextBots({
    itemId: item.id,
    completedBot: "analyze",
    category: analysis.category || "General",
    isAntique: !!antiqueResult?.isAntique,
    isCollectible: !!collectibleResult?.isCollectible,
    isVehicle: !!(analysis.vehicle_year || analysis.vehicle_make),
    cookie: cookieHeader,
  })).catch(() => null);

  // Fire-and-forget: demand score
  import("@/lib/bots/demand-score").then(m => m.calculateDemandScore(item.id)).catch(() => null);

  return new Response("OK", { status: 200 });
}
