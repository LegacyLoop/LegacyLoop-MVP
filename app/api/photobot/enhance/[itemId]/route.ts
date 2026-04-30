import { NextRequest, NextResponse } from "next/server";
import { authAdapter } from "@/lib/adapters/auth";
import { prisma } from "@/lib/db";
import OpenAI from "openai";
import fs from "fs";
import path from "path";
import sharp from "sharp";
import { storageAdapter } from "@/lib/adapters/storage";
import { canUseBotOnTier, BOT_CREDIT_COSTS } from "@/lib/constants/pricing";
import { isDemoMode } from "@/lib/bot-mode";
import { findBackgroundPhoto } from "@/lib/adapters/stock-photos";
import { checkCredits, deductCredits, hasPriorBotRun } from "@/lib/credits";
// CMD-PHOTOBOT-CORE-A: hybrid router + skill pack
import { routePhotoBotHybrid } from "@/lib/adapters/bot-ai-router";
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
 * POST /api/photobot/enhance/[itemId]
 * Three-step photo enhancement: assess → edit → generate
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  try {
    const user = await authAdapter.getSession();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { itemId } = await params;

    // ── Tier + Credit Gate (check only — deduct AFTER DALL-E succeeds) ──
    let creditCost = 0;
    let isRerunCredit = false;
    if (!isDemoMode()) {
      if (!canUseBotOnTier(user.tier, "photoBot")) {
        return NextResponse.json({ error: "upgrade_required", message: "Upgrade your plan to access PhotoBot.", upgradeUrl: "/pricing?upgrade=true" }, { status: 403 });
      }
      isRerunCredit = await hasPriorBotRun(user.id, itemId, "PHOTOBOT");
      creditCost = isRerunCredit ? BOT_CREDIT_COSTS.singleBotReRun : BOT_CREDIT_COSTS.singleBotRun;
      const cc = await checkCredits(user.id, creditCost);
      if (!cc.hasEnough) {
        return NextResponse.json({ error: "insufficient_credits", message: "Not enough credits to run PhotoBot.", balance: cc.balance, required: creditCost, buyUrl: "/credits" }, { status: 402 });
      }
      // DON'T deduct yet — wait until DALL-E operations succeed
    }

    const body = await req.json().catch(() => ({}));
    const { photoId, dallePrompt: overrideDallePrompt, editInstructions: overrideEditInstructions, variationName, mode, customPrompt } = body;
    const isVariation = !!variationName;
    const assessOnly = mode === "assess";
    const hasCustomPrompt = typeof customPrompt === "string" && customPrompt.trim().length > 0;

    const item = await prisma.item.findUnique({
      where: { id: itemId },
      include: { photos: { orderBy: { order: "asc" } }, aiResult: true, valuation: true, antiqueCheck: true },
    });
    if (!item || item.userId !== user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // ── ENRICHMENT: Read AnalyzeBot's stored AI analysis for better prompts ──
    let analysisData: Record<string, unknown> = {};
    if ((item as any).aiResult?.rawJson) {
      try {
        analysisData = JSON.parse((item as any).aiResult.rawJson);
      } catch {
        console.log("[photobot-enhance] Could not parse AI result — proceeding without enrichment");
      }
    }
    const itemName = (analysisData.item_name ?? analysisData.name ?? analysisData.title ?? "") as string;
    const itemBrand = (analysisData.brand ?? analysisData.manufacturer ?? "") as string;
    const itemCategory = (analysisData.category ?? analysisData.item_type ?? "") as string;
    const itemCondition = (analysisData.condition ?? analysisData.condition_grade ?? analysisData.condition_guess ?? "") as string;
    const itemColor = (analysisData.color ?? analysisData.primary_color ?? "") as string;
    const itemMaterial = (analysisData.material ?? analysisData.materials ?? "") as string;
    const itemAge = (analysisData.estimated_age ?? analysisData.year ?? analysisData.decade ?? analysisData.era ?? "") as string;
    const conditionNotes = (analysisData.condition_details ?? analysisData.condition_description ?? analysisData.wear_description ?? "") as string;
    const isAntique = !!(analysisData.is_antique ?? analysisData.antique_alert ?? false);
    const isVehicle = !!(analysisData.is_vehicle ?? analysisData.vehicle_type ?? false);

    const resolvedName = itemName || item.title || "item";
    const resolvedCategory = itemCategory || "";
    const resolvedCondition = itemCondition || item.condition || "";

    const enrichmentContext = [
      resolvedName && `Item: ${resolvedName}`,
      itemBrand && `Brand: ${itemBrand}`,
      resolvedCategory && `Category: ${resolvedCategory}`,
      resolvedCondition && `Condition: ${resolvedCondition}`,
      itemColor && `Color: ${itemColor}`,
      itemMaterial && `Material: ${itemMaterial}`,
      itemAge && `Age/Era: ${itemAge}`,
      conditionNotes && `Condition details: ${conditionNotes}`,
      isAntique && "Note: This is an antique item",
      isVehicle && "Note: This is a vehicle",
    ].filter(Boolean).join(". ");
    const hasEnrichment = enrichmentContext.length > 0;
    console.log("[photobot-enhance] Enrichment context:", hasEnrichment ? enrichmentContext.slice(0, 150) : "none — proceeding without analysis data");

    // CMD-PHOTOBOT-CORE-A: skill pack loading (content empty until Skills-B,
    // wiring here for telemetry completeness + future pack readiness).
    const skillPack = loadSkillPack("photobot");
    const skillPackPrefix = skillPack.systemPromptBlock
      ? skillPack.systemPromptBlock + "\n\n"
      : "";

    // Find the target photo — use photoId if provided, otherwise use primary/first
    const photo = photoId
      ? item.photos.find((p) => p.id === photoId)
      : item.photos.find((p) => p.isPrimary) || item.photos[0];

    if (!photo) {
      return NextResponse.json({ error: "No photo found" }, { status: 400 });
    }

    if (!openai) {
      return NextResponse.json({ error: "OpenAI not configured" }, { status: 500 });
    }

    // CMD-CLOUDINARY-PHOTO-READ-FIX: read from URL or local disk
    const { readPhotoAsBuffer, guessMimeType } = await import("@/lib/adapters/storage");
    const photoBuffer = await readPhotoAsBuffer(photo.filePath);
    const mime = guessMimeType(photo.filePath);
    const base64 = photoBuffer.toString("base64");
    const dataUrl = `data:${mime};base64,${base64}`;

    let assessment: any = null;
    let editedPhotoUrl: string | null = null;
    let generatedPhotoUrl: string | null = null;

    // CMD-PHOTOBOT-CORE-A: track hybrid run for PHOTOBOT_RUN telemetry
    let hybridRun: Awaited<ReturnType<typeof routePhotoBotHybrid>> | null = null;

    // ── STEP A: ASSESSMENT (via routePhotoBotHybrid) — skip for variations ──
    if (!isVariation) {
      try {
        const customPromptDirective = hasCustomPrompt
          ? `\n\nUSER CUSTOM REQUEST: "${customPrompt}". Factor this into your assessment, enhancement steps, and DALL-E prompts. The user's request should guide your edit and generation recommendations while maintaining item authenticity.`
          : "";

        const enrichmentDirective = hasEnrichment
          ? `\n\nKNOWN ITEM DATA (from prior AI analysis):\n${enrichmentContext}\nUse this data to build more accurate physical descriptions and DALL-E prompts.`
          : "";

        // CMD-PHOTOBOT-CORE-A: build the full assessment prompt (system +
        // user instructions combined into one string for the hybrid router).
        // The router's callProviderRaw handles photo attachment via photoPath.
        const assessmentPrompt = skillPackPrefix + `You are a world-class product photography analyst and visual merchandising expert with 20 years of experience shooting for Sotheby's, eBay, Etsy, and luxury resale platforms.

Your PRIMARY MISSION: Extract EXACT, LITERAL physical descriptions for AI image generation. Every detail you describe will be fed directly into DALL-E to recreate the item — your accuracy determines whether the generated image looks correct.

PRECISION RULES:
- Count every visible component (drawers, legs, shelves, doors, knobs, handles, buttons, panels) — state EXACT numbers
- Describe colors with precision (not "brown" but "dark walnut brown with warm amber undertones")
- Note proportions, textures, materials with specificity
- If you cannot see something clearly, say so — never fabricate details

IRON RULE — CONDITION AUTHENTICITY:
You must NEVER suggest hiding, minimizing, smoothing, or altering ANY condition detail:
- Scratches, dents, chips, cracks, scuffs, wear marks
- Stains, discoloration, fading, patina, tarnish
- Missing parts, repairs, alterations, replaced components
Every condition detail MUST appear in your generated descriptions. Buyer trust depends on this.${enrichmentDirective}${customPromptDirective}

Analyze this product listing photo with absolute precision. Return flat JSON only — no wrapper keys — with these exact fields:

physicalDescription: ULTRA-PRECISE literal description of exactly what you see. Count every component. State exact numbers, exact shapes, exact positions. This will be directly injected into a DALL-E prompt.
exactCount: EXACT counts of every repeated element visible. This is non-negotiable.
colorDescription: Multi-layer color description with primary, secondary, accent, and hardware colors.
styleDescription: Design era, style movement, construction approach, aesthetic.
dimensionEstimate: Size estimate with comparison references.
surfaceDetails: EVERY visible surface characteristic that must appear in the generated image. Be exhaustive.
materialAnalysis: What materials you can identify and how confident you are.
backgroundDescription: Detailed description of everything in the background that should be removed or replaced
distractingElements: array of specific background elements to remove (people, clutter, walls, furniture, pets, cables, reflections)
backgroundReplacement: Recommended replacement background description for professional listing
isolationScore: 1-10 how well the item stands out from surroundings
lightingScore: 1-10 quality and evenness of lighting
framingScore: 1-10 how well item fills the frame and is centered
focusScore: 1-10 sharpness and clarity of the item
colorAccuracy: 1-10 how true-to-life the colors appear
backgroundRemovalNeeded: true/false
enhancementSteps: array of up to 7 specific, actionable improvement steps prioritized by impact
conditionDetails: array of ALL visible condition issues that MUST remain visible in every enhanced version — critical for buyer trust
coverPhotoReady: true/false — would this pass as a lead listing image on eBay/Etsy right now?
coverPhotoBlockers: array of specific issues preventing cover-photo readiness (empty if ready)
editPrompt: Precise description (under 300 chars) of ONLY background/staging/lighting improvements. Never mention condition changes.
dallePrompt: Build this EXACTLY from your physical descriptors with CRITICAL PHYSICAL ACCURACY constraints. Include exactCount, colorDescription, styleDescription, dimensionEstimate, surfaceDetails. Professional product photography on clean neutral background, item centered filling 70% of frame, soft even studio lighting, no harsh shadows, photorealistic quality.
overallScore: 1-10 composite quality score`;

        console.log("[photobot-enhance] Step A: Routing through routePhotoBotHybrid...", hasCustomPrompt ? `Custom: "${customPrompt}"` : "standard");

        // CMD-PHOTOBOT-CORE-A: route through hybrid router for assessment.
        // OpenAI primary (GPT-4o Vision). Gemini secondary fires when
        // overallScore < 5 (low_confidence). Photo path passed to router
        // for automatic image attachment.
        hybridRun = await routePhotoBotHybrid({
          itemId: item.id,
          photoPath: photo.filePath,
          assessmentPrompt,
          // low_confidence trigger: let the router evaluate post-primary
          shouldRunSecondary: false, // router auto-fires on overallScore < 5
          timeoutMs: 60_000,
          maxTokens: 4_000,
        });

        if (hybridRun.degraded || !hybridRun.mergedResult) {
          console.error("[photobot-enhance] Assessment hybrid degraded:", hybridRun.error ?? "all providers failed");
        } else {
          assessment = hybridRun.mergedResult;
        }
      } catch (assessErr: any) {
        console.error("[photobot-enhance] Assessment failed:", assessErr?.message);
      }
    } else {
      console.log("[photobot-enhance] Skipping assessment — variation mode:", variationName);
    }

    // Use override prompts if provided (from MegaBot variation generation)
    const editPromptBase = overrideEditInstructions || assessment?.editPrompt || "Clean up background, improve staging";

    // Enrich edit prompt with AnalyzeBot data when available
    const editPromptText = hasEnrichment
      ? `Product: ${resolvedName}${itemBrand ? ", " + itemBrand : ""}. ${editPromptBase}`
      : editPromptBase;

    // ── Build physically accurate DALL-E prompt from assessment descriptors ──
    const physicalDescription = (assessment?.physicalDescription ?? "") as string;
    const exactCount = (assessment?.exactCount ?? "") as string;
    const colorDescription = (assessment?.colorDescription ?? "") as string;
    const styleDescription = (assessment?.styleDescription ?? "") as string;
    const dimensionEstimate = (assessment?.dimensionEstimate ?? "") as string;
    const surfaceDetails = (assessment?.surfaceDetails ?? "") as string;

    const physicallyAccuratePrompt = [
      physicalDescription,
      exactCount && `CRITICAL: This item has EXACTLY ${exactCount}. Do not add, remove, or alter any components. ${exactCount} — this is non-negotiable.`,
      colorDescription && `Color: ${colorDescription}`,
      styleDescription && `Style: ${styleDescription}`,
      dimensionEstimate && `Size: ${dimensionEstimate}`,
    ].filter(Boolean).join(" ");

    // Also extract new assessment fields
    const materialAnalysis = (assessment?.materialAnalysis ?? "") as string;
    const bgReplacement = (assessment?.backgroundReplacement ?? "clean soft-white studio background") as string;
    const conditionDetailsArr = Array.isArray(assessment?.conditionDetails) ? assessment.conditionDetails : [];
    const conditionNote = conditionDetailsArr.length > 0
      ? `CONDITION DETAILS that MUST remain visible: ${conditionDetailsArr.join("; ")}.`
      : "";

    let dallePromptText: string;
    if (overrideDallePrompt) {
      // MegaBot variation path — prepend physical reference + condition
      dallePromptText = [
        physicallyAccuratePrompt && `Physical reference: ${physicallyAccuratePrompt}`,
        materialAnalysis && `Materials: ${materialAnalysis}`,
        overrideDallePrompt,
        conditionNote,
        "Preserve all visible condition details — scratches, wear, patina, damage must be present.",
        "Professional product photography. Clean neutral background. Photorealistic.",
      ].filter(Boolean).join(" ");
    } else {
      // Standard enhance path — build from physical descriptors + enrichment + custom prompt
      const customGenDirective = hasCustomPrompt ? `User instruction: ${customPrompt}.` : "";

      // Build staging context from AI analysis (presentation/styling guidance for cover photo)
      const ad = analysisData as Record<string, any>;
      const stagingContext: string[] = [];
      if (ad?.positive_notes?.length) stagingContext.push(`Highlight: ${(ad.positive_notes as string[]).slice(0, 2).join(", ")}`);
      if (ad?.is_antique) stagingContext.push("Antique staging: emphasize patina and character as authenticity markers");
      if (ad?.is_collectible) stagingContext.push("Collectible staging: include visual cues of rarity and premium quality");
      if (Number(ad?.condition_cosmetic) >= 8) stagingContext.push("Item presents beautifully — use aspirational lifestyle staging");
      const stagingDirective = stagingContext.length > 0 ? `Staging guidance: ${stagingContext.join(". ")}.` : "";

      dallePromptText = [
        hasEnrichment && `Product context: ${enrichmentContext}`,
        physicallyAccuratePrompt || assessment?.dallePrompt || "Professional product photo on clean neutral background",
        materialAnalysis && `Materials: ${materialAnalysis}`,
        surfaceDetails && `Visible condition details that must appear exactly: ${surfaceDetails}`,
        conditionNote,
        customGenDirective,
        stagingDirective,
        `Background: ${bgReplacement}`,
        "IRON RULE: Preserve ALL visible condition details including scratches, wear, dents, stains, patina, and damage exactly as they appear in the original. Do not hide, smooth, soften, or alter any condition detail.",
        "Professional product photography. Item centered, filling 70% of frame. Even soft studio lighting. No harsh shadows. Photorealistic quality.",
        "CRITICAL: Every physical detail must match exactly — exact component counts, exact colors, exact proportions, exact textures. Do not add, remove, or alter any element.",
      ].filter(Boolean).join(" ");
    }

    // Enforce DALL-E 3 prompt length limit (4000 chars)
    if (dallePromptText.length > 4000) {
      console.warn(`[photobot-enhance] DALL-E 3 prompt truncated to 4000 chars (was ${dallePromptText.length})`);
      dallePromptText = dallePromptText.slice(0, 4000);
    }

    console.log("[photobot-enhance] Final DALL-E prompt:", dallePromptText.slice(0, 250));

    // ── STEP B: REAL PHOTO EDIT (dall-e-2 image edit) — skip for assess-only ──
    if (!assessOnly) try {
      console.log("[photobot-enhance] Step B: Editing real photo...");

      // Convert to PNG for the edit API (requires PNG)
      const pngBuffer = await sharp(photoBuffer).resize(1024, 1024, { fit: "contain", background: { r: 255, g: 255, b: 255, alpha: 1 } }).png().toBuffer();

      // Write temp PNG file for the API
      const tempDir = path.join(process.cwd(), "tmp");
      if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
      const tempPath = path.join(tempDir, `edit-${Date.now()}.png`);
      fs.writeFileSync(tempPath, pngBuffer);

      // Build enriched DALL-E 2 edit prompt
      const customEditDirective = hasCustomPrompt ? ` User instruction: ${customPrompt}.` : "";
      const bgReplace = (assessment?.backgroundReplacement ?? "clean, neutral, softly-lit studio background") as string;
      const distractingList = Array.isArray(assessment?.distractingElements) && assessment.distractingElements.length > 0
        ? `Remove these specific elements: ${assessment.distractingElements.slice(0, 5).join(", ")}.`
        : "";
      const condPreserve = conditionNote || "";
      const editFinalPrompt = [
        `Professional product photography edit: ${editPromptText}.`,
        customEditDirective,
        distractingList,
        `Replace background with: ${bgReplace}.`,
        condPreserve,
        "IRON RULE: preserve ALL visible scratches, wear, damage, patina, and condition details EXACTLY as they appear.",
        "Only modify background and staging. Do not alter the item's colors, proportions, or surface characteristics in any way.",
        "Even, soft professional lighting. No harsh shadows. Clean and marketplace-ready.",
      ].filter(Boolean).join(" ").slice(0, 1000);

      // CMD-PHOTOBOT-CORE-A: migrated dall-e-2 → gpt-image-1
      const editResponse = await openai.images.edit({
        model: "gpt-image-1",
        image: fs.createReadStream(tempPath) as any,
        prompt: editFinalPrompt,
        n: 1,
        size: "1024x1024",
      });

      editedPhotoUrl = editResponse.data?.[0]?.url || null;

      // Cleanup temp file
      try { fs.unlinkSync(tempPath); } catch {}

      console.log("[photobot-enhance] Step B complete:", editedPhotoUrl ? "success" : "no URL returned");
    } catch (editErr: any) {
      console.error("[photobot-enhance] Photo edit failed (non-fatal):", editErr?.message);
    }

    // ── STEP C: AI GENERATED VERSION (dall-e-3) — skip for assess-only ────
    if (!assessOnly) try {
      console.log("[photobot-enhance] Step C: Generating AI storefront version...");

      // CMD-PHOTOBOT-CORE-A: migrated dall-e-3 → gpt-image-1
      const generateResponse = await openai.images.generate({
        model: "gpt-image-1",
        prompt: dallePromptText,
        n: 1,
        size: "1024x1024",
        quality: "hd",
        style: "natural",
      });

      generatedPhotoUrl = generateResponse.data?.[0]?.url || null;

      console.log("[photobot-enhance] Step C complete:", generatedPhotoUrl ? "success" : "no URL returned");
    } catch (genErr: any) {
      console.error("[photobot-enhance] DALL-E generation failed (non-fatal):", genErr?.message);
    }

    // ── PERMANENT SAVE: Download and save AI images to disk ──────────────
    let editedPhotoSavedPath: string | null = null;
    let generatedPhotoSavedPath: string | null = null;

    if (editedPhotoUrl) {
      try {
        const imgResp = await fetch(editedPhotoUrl);
        const imgBuf = Buffer.from(await imgResp.arrayBuffer());
        editedPhotoSavedPath = await storageAdapter.saveDocument(
          imgBuf, itemId, `photobot-edited-${Date.now()}.png`, "image/png"
        );
        console.log("[photobot-enhance] Edited photo saved permanently:", editedPhotoSavedPath);
      } catch (saveErr: any) {
        console.warn("[photobot-enhance] Failed to save edited photo permanently (non-fatal):", saveErr?.message);
      }
    }

    if (generatedPhotoUrl) {
      try {
        const imgResp = await fetch(generatedPhotoUrl);
        const imgBuf = Buffer.from(await imgResp.arrayBuffer());
        generatedPhotoSavedPath = await storageAdapter.saveDocument(
          imgBuf, itemId, `photobot-generated-${Date.now()}.png`, "image/png"
        );
        console.log("[photobot-enhance] Generated photo saved permanently:", generatedPhotoSavedPath);
      } catch (saveErr: any) {
        console.warn("[photobot-enhance] Failed to save generated photo permanently (non-fatal):", saveErr?.message);
      }
    }

    // ── PERMANENT ITEMPHOTO RECORDS (before EventLog so savedPath is available) ──
    if (editedPhotoSavedPath) {
      try {
        await prisma.itemPhoto.create({
          data: { itemId, filePath: editedPhotoSavedPath, isPrimary: false, order: 999, caption: "AI Enhanced" },
        });
      } catch (photoErr: any) {
        console.warn("[photobot-enhance] Failed to create ItemPhoto for edited image (non-fatal):", photoErr?.message);
      }
    }
    if (generatedPhotoSavedPath) {
      try {
        await prisma.itemPhoto.create({
          data: { itemId, filePath: generatedPhotoSavedPath, isPrimary: false, order: 999, caption: "AI Enhanced" },
        });
      } catch (photoErr: any) {
        console.warn("[photobot-enhance] Failed to create ItemPhoto for generated image (non-fatal):", photoErr?.message);
      }
    }

    // ── Deduct credits AFTER all DALL-E operations succeeded ──────────
    if (!isDemoMode() && creditCost > 0) {
      await deductCredits(user.id, creditCost, isRerunCredit ? "PhotoBot re-run" : "PhotoBot run", itemId);
    }

    // ── STEP D: STORE RESULTS ─────────────────────────────────────────────
    const result: Record<string, any> = {
      assessment,
      editedPhotoUrl,
      generatedPhotoUrl,
      originalPhotoId: photo.id,
      originalPhotoPath: photo.filePath,
      enrichedWithAnalysis: hasEnrichment,
      createdAt: new Date().toISOString(),
      ...(isVariation ? { variationName } : {}),
      ...(editedPhotoSavedPath ? { editedPhotoSavedPath } : {}),
      ...(generatedPhotoSavedPath ? { generatedPhotoSavedPath } : {}),
    };

    // ── Style Scoring (ported from StyleBot — runs in assess-only mode) ──
    if (assessOnly) {
      const ad = analysisData as Record<string, any>;
      const stPhotoCount = item.photos?.length || 0;
      const hasPrimarySet = item.photos?.some((p: any) => p.isPrimary) || false;

      // Presentation Score (40% weight)
      const rawPhotoScore = ad?.photo_quality_score ?? 5;
      const quantityBonus = stPhotoCount >= 6 ? 15 : stPhotoCount >= 4 ? 10 : stPhotoCount >= 2 ? 5 : 0;
      const primaryBonus = hasPrimarySet ? 5 : 0;
      const presentationScore = Math.min(100, Math.round(rawPhotoScore * 10 + quantityBonus + primaryBonus));

      const stPhotoTips: string[] = [];
      if (ad?.photo_improvement_tips?.length) stPhotoTips.push(...ad.photo_improvement_tips);
      if (stPhotoCount < 3) stPhotoTips.push("Add more photos — listings with 4+ photos sell 2x faster");
      if (stPhotoCount < 6) stPhotoTips.push("Aim for 6 photos: front, back, sides, detail shots, and any flaws");
      if (!hasPrimarySet && stPhotoCount > 1) stPhotoTips.push("Set a primary photo — this is what buyers see first in search results");

      // Listing Score (35% weight)
      const hasStTitle = !!ad?.recommended_title;
      const hasStDescription = !!ad?.recommended_description;
      const hasStKeywords = ad?.keywords?.length > 5;
      const hasStPricing = ad?.estimated_value_mid != null;
      const listingScore = Math.min(100, (hasStTitle ? 25 : 10) + (hasStDescription ? 25 : 10) + (hasStKeywords ? 20 : 5) + (hasStPricing ? 15 : 0) + (ad?.condition_details ? 15 : 5));

      const titleSuggestion = ad?.recommended_title || `${ad?.brand ? ad.brand + " " : ""}${ad?.item_name || "Item"} — ${ad?.condition_guess || "Good"} Condition`;
      const stDescTips: string[] = [];
      if (ad?.recommended_description) stDescTips.push(ad.recommended_description);
      if (ad?.condition_details) stDescTips.push(`Mention condition specifics: "${String(ad.condition_details).slice(0, 100)}"`);
      if (ad?.material) stDescTips.push(`Highlight material: ${ad.material}`);
      if (ad?.era) stDescTips.push(`Include era/period: ${ad.era}`);
      if (ad?.markings) stDescTips.push(`Mention markings/labels: ${ad.markings}`);
      if (ad?.dimensions_estimate) stDescTips.push(`Include measurements: ${ad.dimensions_estimate}`);
      if (ad?.value_drivers?.length) stDescTips.push(`Lead with value drivers: ${ad.value_drivers.slice(0, 3).join(", ")}`);

      // Staging Score (25% weight)
      const stConditionScore = ad?.condition_score ?? 5;
      const stCosmeticScore = ad?.condition_cosmetic ?? stConditionScore;
      const stagingBase = Math.round((stConditionScore + stCosmeticScore) / 2 * 10);
      const stPositiveBonus = (ad?.positive_notes?.length ?? 0) >= 2 ? 10 : 0;
      const stIssuesPenalty = (ad?.visible_issues?.length ?? 0) >= 3 ? -10 : 0;
      const stagingScore = Math.min(100, Math.max(0, stagingBase + stPositiveBonus + stIssuesPenalty));

      const stStagingSuggestions: string[] = [];
      if (ad?.visible_issues?.length) stStagingSuggestions.push(`Photograph honestly but minimize in primary photo: ${ad.visible_issues.slice(0, 2).join("; ")}`);
      if (ad?.positive_notes?.length) stStagingSuggestions.push(`Highlight strengths prominently: ${ad.positive_notes.slice(0, 3).join("; ")}`);
      if (ad?.is_antique) stStagingSuggestions.push("Stage with context — show patina as character, not damage. Antique buyers value authenticity.");
      if (ad?.is_collectible) stStagingSuggestions.push("Include proof of authenticity if available — certificates, original packaging, provenance documents");
      if (stCosmeticScore < 5) stStagingSuggestions.push("Consider cleaning/light restoration before photographing — first impressions matter");
      if (stCosmeticScore >= 8) stStagingSuggestions.push("Item presents beautifully — use lifestyle staging to help buyers envision ownership");

      // Platform Recommendations
      const stPlatforms: { name: string; fit: string; reason: string }[] = [];
      if (ad?.best_platforms?.length) {
        const fitLevels = ["Excellent", "Good", "Good", "Fair", "Fair"];
        ad.best_platforms.slice(0, 5).forEach((p: string, i: number) => {
          stPlatforms.push({ name: p, fit: fitLevels[i] || "Fair", reason: ad?.regional_best_why || `Strong ${ad?.category || "item"} market` });
        });
      }
      if (stPlatforms.length === 0) {
        stPlatforms.push(
          { name: "Facebook Marketplace", fit: "Good", reason: "Large local buyer pool, no listing fees" },
          { name: "eBay", fit: "Good", reason: "Largest secondhand marketplace with buyer protections" },
          { name: "Craigslist", fit: "Fair", reason: "Free listings, local pickup preferred" },
        );
      }

      // Overall Score
      const overallScore = Math.round(presentationScore * 0.4 + listingScore * 0.35 + stagingScore * 0.25);

      // Summary
      const scoreSummary = `Overall presentation score: ${overallScore}/100. ${
        overallScore >= 80 ? "Strong listing — ready to publish." :
        overallScore >= 60 ? "Good foundation — a few improvements could boost buyer interest." :
        overallScore >= 40 ? "Needs work — focus on photo quality and description detail." :
        "Significant improvements needed before listing."
      } ${stPhotoCount < 3 ? "Priority: add more photos." : ""}${!hasStTitle ? " Priority: optimize your listing title." : ""}`;

      result.styleScoring = {
        overallScore,
        presentation: { score: presentationScore, photoQualityScore: rawPhotoScore, photoCount: stPhotoCount, tips: stPhotoTips.slice(0, 5) },
        listing: { score: listingScore, titleSuggestion, descriptionTips: stDescTips.slice(0, 5), keywords: ad?.keywords?.slice(0, 10) || [] },
        staging: { score: stagingScore, conditionScore: stConditionScore, cosmeticScore: stCosmeticScore, suggestions: stStagingSuggestions.slice(0, 5) },
        platforms: stPlatforms,
        summary: scoreSummary,
      };
    }

    const eventType = isVariation
      ? "PHOTOBOT_ENHANCE_VARIATION"
      : assessOnly
        ? "PHOTOBOT_ASSESS"
        : "PHOTOBOT_ENHANCE";

    await prisma.eventLog.create({
      data: {
        itemId,
        eventType,
        payload: JSON.stringify(result),
      },
    });

    // CMD-PHOTOBOT-CORE-A: PHOTOBOT_RUN telemetry with full
    // ANTIQUEBOT_RUN parity. Wrapped in try/catch — non-critical.
    try {
      await prisma.eventLog.create({
        data: {
          itemId,
          eventType: "PHOTOBOT_RUN",
          payload: JSON.stringify({
            userId: user.id,
            timestamp: new Date().toISOString(),
            skillPackVersion: skillPack.version,
            skillPackCount: skillPack.skillNames.length,
            skillPackChars: skillPack.totalChars,
            overallScore: assessment?.overallScore ?? null,
            coverPhotoReady: assessment?.coverPhotoReady ?? null,
            anglesMissingCount: Array.isArray(assessment?.missing_angles) ? assessment.missing_angles.length : 0,
            dalleMigrated: true,
            mode: assessOnly ? "assess" : isVariation ? "variation" : "enhance",
            mergedStrategy: hybridRun?.mergedStrategy ?? null,
            primaryConfidence: hybridRun?.primaryConfidence ?? null,
            secondaryTriggered: hybridRun?.secondaryTriggered ?? false,
            actualCostUsd: hybridRun?.actualCostUsd ?? 0,
            costUsd: hybridRun?.costUsd ?? 0,
            latencyMs: hybridRun?.latencyMs ?? 0,
            tokens: hybridRun?.tokens ?? { input: 0, output: 0, total: 0 },
            isDemo: false,
          }),
        },
      });
    } catch (logErr) {
      console.warn("[photobot-enhance] PHOTOBOT_RUN log write failed (non-critical):", logErr);
    }

    return NextResponse.json({ success: true, result });
  } catch (e: any) {
    console.error("[photobot-enhance] Unexpected error:", e);
    return NextResponse.json({ error: e?.message || "Enhancement failed" }, { status: 500 });
  }
}

/**
 * GET /api/photobot/enhance/[itemId]
 * Retrieve existing enhancement result
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
      where: { itemId, eventType: "PHOTOBOT_ENHANCE" },
      orderBy: { createdAt: "desc" },
    });

    // Also fetch variation results
    const variations = await prisma.eventLog.findMany({
      where: { itemId, eventType: "PHOTOBOT_ENHANCE_VARIATION" },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    if (!existing && variations.length === 0) return NextResponse.json({ hasResult: false, result: null });

    return NextResponse.json({
      hasResult: true,
      result: existing ? safeJson(existing.payload) : null,
      createdAt: existing?.createdAt,
      variations: variations.map((v) => safeJson(v.payload)).filter(Boolean),
    });
  } catch (e) {
    console.error("[photobot-enhance GET]", e);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}
