import { NextRequest, NextResponse } from "next/server";
import { authAdapter } from "@/lib/adapters/auth";
import { prisma } from "@/lib/db";
import OpenAI from "openai";
import fs from "fs";
import path from "path";
import sharp from "sharp";
import { storageAdapter } from "@/lib/adapters/storage";
import { isDemoMode, canUseBotOnTier, BOT_CREDIT_COSTS } from "@/lib/constants/pricing";
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

    // ── Tier + Credit Gate ──
    if (!isDemoMode()) {
      if (!canUseBotOnTier(user.tier, "photoBot")) {
        return NextResponse.json({ error: "upgrade_required", message: "Upgrade your plan to access PhotoBot.", upgradeUrl: "/pricing?upgrade=true" }, { status: 403 });
      }
      const isRerun = await hasPriorBotRun(user.id, itemId, "PHOTOBOT");
      const cost = isRerun ? BOT_CREDIT_COSTS.singleBotReRun : BOT_CREDIT_COSTS.singleBotRun;
      const cc = await checkCredits(user.id, cost);
      if (!cc.hasEnough) {
        return NextResponse.json({ error: "insufficient_credits", message: "Not enough credits to run PhotoBot.", balance: cc.balance, required: cost, buyUrl: "/credits" }, { status: 402 });
      }
      await deductCredits(user.id, cost, isRerun ? "PhotoBot re-run" : "PhotoBot run", itemId);
    }

    const body = await req.json().catch(() => ({}));
    const { photoId, dallePrompt: overrideDallePrompt, editInstructions: overrideEditInstructions, variationName, mode } = body;
    const isVariation = !!variationName;
    const assessOnly = mode === "assess";

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
        console.log("[photobot-enhance] Step A: Assessing photo with precision physical extraction...");
        const assessResp = await openai.responses.create({
          model: "gpt-4o",
          input: [
            {
              role: "system",
              content: "You are a precision product photography analyst. Your primary job is to extract exact, literal physical descriptions of items for AI image generation. You must count every visible component precisely. Never estimate or approximate counts — state exactly what you see. Your physicalDescription and exactCount fields will be used directly in image generation prompts, so accuracy is critical. Do not embellish. Do not guess. Describe only what is literally visible in the photo. You must NEVER suggest hiding any damage, wear, scratches, dents, stains, or condition issues — those must stay visible for buyer transparency.",
            },
            {
              role: "user",
              content: [
                {
                  type: "input_text",
                  text: `Count every visible component of this item with absolute precision. State exact numbers for drawers, legs, shelves, doors, panels, handles, or any repeated element. Your exactCount field will be injected directly into an image generation prompt — if you say 6 drawers, the AI will attempt to draw exactly 6 drawers. Accuracy here directly determines image quality.

Return flat JSON only — no wrapper keys — with these exact fields:

physicalDescription: A precise, literal description of exactly what is visible in the photo. Count every visible component. State exact numbers. Example: "6-drawer dresser with 3 drawers on left column and 3 drawers on right column, approximately 48 inches wide, dark walnut finish, brass ring pulls on each drawer, flat top surface"
exactCount: If the item has countable components (drawers, legs, shelves, doors, buttons, knobs, wheels, panels, cushions, etc.) state the EXACT count seen in the photo. Example: "6 drawers total, 3 per column, 4 legs, 2 columns"
colorDescription: Precise color description. Example: "dark walnut brown with warm amber undertones, brass-toned hardware"
styleDescription: Furniture style, era, design language. Example: "mid-century modern, clean lines, minimal ornamentation"
dimensionEstimate: Approximate size relative to known objects in photo. Example: "approximately 4 feet wide, 3 feet tall, 18 inches deep"
surfaceDetails: Visible surface characteristics — scratches, wear, damage, patina, stains — that must appear in generated image. Example: "slight wear on top surface edges, minor scratches on second drawer front"
backgroundDescription: what is distracting in the background
isolationScore: 1-10 how well item stands out
lightingScore: 1-10 lighting quality
framingScore: 1-10 how well item fills the frame
backgroundRemovalNeeded: true/false
enhancementSteps: array of up to 5 specific improvement steps
conditionDetails: array of visible condition issues that MUST remain visible in any enhanced version
coverPhotoReady: true/false
editPrompt: a concise description (under 200 chars) of ONLY the background and staging improvements needed — do not mention condition changes
dallePrompt: Build using your physical descriptors above: "[physicalDescription]. CRITICAL PHYSICAL ACCURACY: this item has EXACTLY [exactCount] — do not add, remove, or change any components. Color: [colorDescription]. Style: [styleDescription]. Approximate size: [dimensionEstimate]. Professional product photography, clean white or neutral background, item centered and filling 70% of frame, even soft lighting, no shadows. Condition details visible: [surfaceDetails]."
overallScore: 1-10`,
                },
                { type: "input_image", image_url: dataUrl, detail: "auto" },
              ],
            },
          ],
          text: { format: { type: "text" } },
          max_output_tokens: 3000,
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

    let dallePromptText: string;
    if (overrideDallePrompt) {
      // MegaBot variation path — still prepend physical reference
      dallePromptText = [
        physicallyAccuratePrompt && `Physical reference: ${physicallyAccuratePrompt}`,
        overrideDallePrompt,
        "Preserve all visible condition details. Professional product photography. Clean neutral background.",
      ].filter(Boolean).join(" ");
    } else {
      // Standard enhance path — build from physical descriptors + enrichment
      dallePromptText = [
        hasEnrichment && enrichmentContext,
        physicallyAccuratePrompt || assessment?.dallePrompt || "Professional product photo on clean neutral background",
        surfaceDetails && `Visible condition details that must appear: ${surfaceDetails}`,
        "Preserve all visible condition details including scratches, wear, dents, stains, and damage exactly as they appear. Do not hide or smooth over any condition issues.",
        "Professional product photography. Clean neutral background. Item centered and well-lit. Photorealistic.",
        "Every physical detail must match the description exactly — exact component counts, exact colors, exact proportions.",
      ].filter(Boolean).join(" ");
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

      const editResponse = await openai.images.edit({
        model: "dall-e-2",
        image: fs.createReadStream(tempPath) as any,
        prompt: `Professional product photo edit: ${editPromptText}. IMPORTANT: preserve all visible scratches, wear, damage, and condition details exactly as they appear. Only clean up background and improve staging.`,
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

    // ── PERMANENT ITEMPHOTO RECORDS (after EventLog) ────────────────────
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
