import { NextRequest, NextResponse } from "next/server";
import { authAdapter } from "@/lib/adapters/auth";
import { prisma } from "@/lib/db";
import OpenAI from "openai";
import fs from "fs";
import path from "path";
import sharp from "sharp";
import { storageAdapter } from "@/lib/adapters/storage";
import { isDemoMode, canUseBotOnTier, BOT_CREDIT_COSTS } from "@/lib/constants/pricing";
import { findBackgroundPhoto } from "@/lib/adapters/stock-photos";
import { checkCredits, deductCredits, hasPriorBotRun } from "@/lib/credits";

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
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
      include: { photos: { orderBy: { order: "asc" } }, aiResult: true },
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

    // Find the target photo — use photoId if provided, otherwise use primary/first
    const photo = photoId
      ? item.photos.find((p) => p.id === photoId)
      : item.photos.find((p) => p.isPrimary) || item.photos[0];

    if (!photo) {
      return NextResponse.json({ error: "No photo found" }, { status: 400 });
    }

    const absPath = path.join(process.cwd(), "public", photo.filePath);
    if (!fs.existsSync(absPath)) {
      return NextResponse.json({ error: "Photo file not found on disk" }, { status: 400 });
    }

    if (!openai) {
      return NextResponse.json({ error: "OpenAI not configured" }, { status: 500 });
    }

    // Read photo buffer
    const photoBuffer = fs.readFileSync(absPath);
    const ext = path.extname(absPath).toLowerCase();
    const mime = ext === ".png" ? "image/png" : ext === ".webp" ? "image/webp" : "image/jpeg";
    const base64 = photoBuffer.toString("base64");
    const dataUrl = `data:${mime};base64,${base64}`;

    let assessment: any = null;
    let editedPhotoUrl: string | null = null;
    let generatedPhotoUrl: string | null = null;

    // ── STEP A: ASSESSMENT (OpenAI Vision) — skip for variations ──────────
    if (!isVariation) {
      try {
        const customPromptDirective = hasCustomPrompt
          ? `\n\nUSER CUSTOM REQUEST: "${customPrompt}". Factor this into your assessment, enhancement steps, and DALL-E prompts. The user's request should guide your edit and generation recommendations while maintaining item authenticity.`
          : "";

        const enrichmentDirective = hasEnrichment
          ? `\n\nKNOWN ITEM DATA (from prior AI analysis):\n${enrichmentContext}\nUse this data to build more accurate physical descriptions and DALL-E prompts.`
          : "";

        console.log("[photobot-enhance] Step A: Assessing photo with precision physical extraction...", hasCustomPrompt ? `Custom: "${customPrompt}"` : "standard");
        const assessResp = await openai.responses.create({
          model: "gpt-4o",
          input: [
            {
              role: "system",
              content: `You are a world-class product photography analyst and visual merchandising expert with 20 years of experience shooting for Sotheby's, eBay, Etsy, and luxury resale platforms.

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
Every condition detail MUST appear in your generated descriptions. Buyer trust depends on this.${enrichmentDirective}${customPromptDirective}`,
            },
            {
              role: "user",
              content: [
                {
                  type: "input_text",
                  text: `Analyze this product listing photo with absolute precision. Return flat JSON only — no wrapper keys — with these exact fields:

physicalDescription: ULTRA-PRECISE literal description of exactly what you see. Count every component. State exact numbers, exact shapes, exact positions. This will be directly injected into a DALL-E prompt. Example: "6-drawer wooden dresser, 3 drawers stacked in left column and 3 in right column, approximately 48 inches wide by 34 inches tall, dark walnut finish with visible wood grain, brass ring-pull handles on each drawer, flat rectangular top surface, tapered round legs, rectangular beveled edge trim on each drawer face"

exactCount: EXACT counts of every repeated element visible. This is non-negotiable — if you say 6 drawers, DALL-E draws exactly 6. Example: "6 drawers (3 per column, 2 columns), 4 tapered legs, 6 brass ring pulls, 1 flat top surface"

colorDescription: Multi-layer color description with primary, secondary, accent, and hardware colors. Example: "Primary: dark walnut brown with warm amber undertones. Hardware: aged brass with slight tarnish. Interior drawer surfaces: raw pine, lighter honey color"

styleDescription: Design era, style movement, construction approach, aesthetic. Example: "American mid-century modern circa 1960s, Danish-influenced clean lines, minimal ornamentation, function-forward design"

dimensionEstimate: Size estimate with comparison references. Example: "approximately 48 inches wide, 34 inches tall, 18 inches deep — standard double dresser dimensions"

surfaceDetails: EVERY visible surface characteristic that must appear in the generated image. Be exhaustive. Example: "light wear ring on top surface left side, minor scratches on right column second drawer, slight darkening at handle touch points, small chip in bottom-left trim, original finish 85% intact"

materialAnalysis: What materials you can identify and how confident you are. Example: "Solid walnut construction (high confidence), brass hardware (confirmed by patina pattern), likely dovetail joint drawers (visible edge profile)"

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
conditionDetails: array of ALL visible condition issues that MUST remain visible in every enhanced version — this is critical for buyer trust
coverPhotoReady: true/false — would this pass as a lead listing image on eBay/Etsy right now?
coverPhotoBlockers: array of specific issues preventing cover-photo readiness (empty if ready)

editPrompt: Precise description (under 300 chars) of ONLY background/staging/lighting improvements. Never mention condition changes. Be specific: "Remove cluttered bookshelf background, replace with clean soft-white gradient, add even fill light from left to eliminate harsh right-side shadow"

dallePrompt: Build this EXACTLY from your physical descriptors: "[physicalDescription]. CRITICAL PHYSICAL ACCURACY: this item has EXACTLY [exactCount] — reproduce every component precisely, do not add, remove, or alter any elements. [exactCount] is non-negotiable. Color accuracy: [colorDescription]. Style: [styleDescription]. Scale: [dimensionEstimate]. CONDITION AUTHENTICITY: these details must be visible: [surfaceDetails]. Professional product photography on a clean neutral background, item centered filling 70% of frame, soft even studio lighting, no harsh shadows, photorealistic quality."

overallScore: 1-10 composite quality score`,
                },
                { type: "input_image", image_url: dataUrl, detail: "high" },
              ],
            },
          ],
          text: { format: { type: "text" } },
          max_output_tokens: 4000,
        });

        const rawAssess = assessResp.output_text;
        const jsonMatch = rawAssess.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          assessment = JSON.parse(jsonMatch[0]);
        } else {
          console.error("[photobot-enhance] Assessment returned no JSON");
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
      dallePromptText = [
        hasEnrichment && `Product context: ${enrichmentContext}`,
        physicallyAccuratePrompt || assessment?.dallePrompt || "Professional product photo on clean neutral background",
        materialAnalysis && `Materials: ${materialAnalysis}`,
        surfaceDetails && `Visible condition details that must appear exactly: ${surfaceDetails}`,
        conditionNote,
        customGenDirective,
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

      const editResponse = await openai.images.edit({
        model: "dall-e-2",
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

      const generateResponse = await openai.images.generate({
        model: "dall-e-3",
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
    const result = {
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
