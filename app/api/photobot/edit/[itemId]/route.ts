import { NextRequest, NextResponse } from "next/server";
import { authAdapter } from "@/lib/adapters/auth";
import { prisma } from "@/lib/db";
import OpenAI, { toFile } from "openai";
import fs from "fs";
import path from "path";
import sharp from "sharp";
import { storageAdapter } from "@/lib/adapters/storage";
import { canUseBotOnTier, BOT_CREDIT_COSTS } from "@/lib/constants/pricing";
import { isDemoMode } from "@/lib/bot-mode";
import { checkCredits, deductCredits, hasPriorBotRun } from "@/lib/credits";

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

function safeJson(s: string | null | undefined): any {
  if (!s) return null;
  try { return JSON.parse(s); } catch { return null; }
}

/**
 * POST /api/photobot/edit/[itemId]
 * AI photo editor: scan → mask → edit. Item is always protected.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  try {
    const user = await authAdapter.getSession();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { itemId } = await params;

    // ── Tier + Credit Gate (deduction happens AFTER DALL-E succeeds) ──
    let isRerun = false;
    let creditCost = 0;
    if (!isDemoMode()) {
      if (!canUseBotOnTier(user.tier, "photoBot")) {
        return NextResponse.json({ error: "upgrade_required", message: "Upgrade your plan to access PhotoBot.", upgradeUrl: "/pricing?upgrade=true" }, { status: 403 });
      }
      isRerun = await hasPriorBotRun(user.id, itemId, "PHOTOBOT");
      creditCost = isRerun ? BOT_CREDIT_COSTS.singleBotReRun : BOT_CREDIT_COSTS.singleBotRun;
      const cc = await checkCredits(user.id, creditCost);
      if (!cc.hasEnough) {
        return NextResponse.json({ error: "insufficient_credits", message: "Not enough credits to run PhotoBot.", balance: cc.balance, required: creditCost, buyUrl: "/credits" }, { status: 402 });
      }
    }

    const body = await req.json().catch(() => ({}));
    const { photoId, customPrompt } = body;

    if (!photoId) {
      return NextResponse.json({ error: "photoId is required" }, { status: 400 });
    }
    if (!openai) {
      return NextResponse.json({ error: "OpenAI not configured" }, { status: 500 });
    }

    // ── STEP A: FETCH THE PHOTO + ENRICHMENT ───────────────────────────────
    const item = await prisma.item.findUnique({
      where: { id: itemId },
      include: { aiResult: true },
    });
    if (!item || item.userId !== user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const photo = await prisma.itemPhoto.findUnique({ where: { id: photoId } });
    if (!photo || photo.itemId !== itemId) {
      return NextResponse.json({ error: "Photo not found" }, { status: 404 });
    }

    // CMD-CLOUDINARY-PHOTO-READ-FIX: read from URL or local disk
    const { readPhotoAsBuffer } = await import("@/lib/adapters/storage");
    const imageBuffer = await readPhotoAsBuffer(photo.filePath);
    const metadata = await sharp(imageBuffer).metadata();
    const width = metadata.width ?? 1024;
    const height = metadata.height ?? 1024;

    // Build enrichment context from AnalyzeBot data
    let enrichmentHint = "";
    if ((item as any).aiResult?.rawJson) {
      try {
        const ai = JSON.parse((item as any).aiResult.rawJson);
        const parts = [
          ai.item_name && `Item: ${ai.item_name}`,
          ai.category && `Category: ${ai.category}`,
          ai.brand && `Brand: ${ai.brand}`,
          ai.material && `Material: ${ai.material}`,
          ai.condition_guess && `Condition: ${ai.condition_guess}`,
          ai.era && `Era: ${ai.era}`,
        ].filter(Boolean);
        if (parts.length) enrichmentHint = `\n\nKNOWN ITEM DATA: ${parts.join(". ")}`;
      } catch {}
    }

    console.log("[photobot-edit] Photo loaded:", photo.id, `${width}x${height}`);

    // ── STEP B: GPT-4O VISION SCAN ─────────────────────────────────────────
    const { guessMimeType } = await import("@/lib/adapters/storage");
    const mime = guessMimeType(photo.filePath);
    const base64 = imageBuffer.toString("base64");
    const dataUrl = `data:${mime};base64,${base64}`;

    const userEditRequest = customPrompt
      ? `\n\nUSER REQUEST: The user specifically asked: "${customPrompt}". Focus your analysis on fulfilling this request while protecting the item.`
      : "";

    let vision: any = null;
    try {
      console.log("[photobot-edit] Step B: GPT-4o vision scan...", customPrompt ? `Custom: "${customPrompt}"` : "standard");
      const visionResp = await openai.responses.create({
        model: "gpt-4o",
        input: [
          {
            role: "system",
            content: `You are a world-class product photography editor and computer vision specialist. You have a PERFECT eye for identifying:
1. The exact boundaries of the sale item (must be PROTECTED — never edited)
2. Everything that is NOT the sale item (backgrounds, people, clutter, surfaces, walls, furniture, pets, cables, personal items)
3. What specific edits would make this a professional, marketplace-ready listing photo

IRON RULE: The sale item itself must NEVER be modified. You are identifying what to REMOVE or REPLACE around it.${enrichmentHint}`,
          },
          {
            role: "user",
            content: [
              {
                type: "input_text",
                text: `Analyze this product listing photo with precision. Return flat JSON with:

itemBoundingBox: The EXACT location of the main sale item as percentages { top: 0-100, left: 0-100, bottom: 0-100, right: 0-100 }. Add 10% padding on all sides. Be generous to fully protect the item.
distractingElements: Array of specific things to remove. Be detailed: "person standing in background left side", "cluttered bookshelf behind item", "orange extension cord on floor", "reflection of photographer in glass"
cleaningDescription: One precise sentence of what will be edited. Be specific about what replaces removed areas.
itemDescription: Detailed description of the sale item. Include type, color, material, distinguishing features.
backgroundReplacement: What the new background should look like — "clean soft-white gradient backdrop", "neutral light gray seamless background", "warm off-white studio backdrop"
safeToAutoClean: true if the item has clear edges and can be isolated. false if the item blends into surroundings.${userEditRequest}

Return flat JSON only. No wrapper keys.`,
              },
              { type: "input_image", image_url: dataUrl, detail: "high" },
            ],
          },
        ],
        text: { format: { type: "text" } },
        max_output_tokens: 2000,
      });

      const raw = visionResp.output_text;
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        vision = JSON.parse(jsonMatch[0]);
      }
    } catch (visionErr: any) {
      console.error("[photobot-edit] Vision scan failed — using full-image fallback:", visionErr?.message);
      // Vision failed entirely — fall back to full image (no item protection, edit entire background)
      vision = {
        itemBoundingBox: { top: 5, left: 5, bottom: 95, right: 95 },
        distractingElements: ["background"],
        cleaningDescription: "Cleaning background around the item",
        itemDescription: "the sale item",
        safeToAutoClean: true,
      };
    }

    if (!vision) {
      // Shouldn't reach here after fallback above, but just in case
      vision = {
        itemBoundingBox: { top: 5, left: 5, bottom: 95, right: 95 },
        distractingElements: ["background"],
        cleaningDescription: "Cleaning background around the item",
        itemDescription: "the sale item",
        safeToAutoClean: true,
      };
    }

    if (vision.safeToAutoClean === false) {
      return NextResponse.json({
        error: "Photo enhancement couldn't isolate the item safely. Try a photo with the item on a plain background, or crop the photo to focus on the item.",
      }, { status: 400 });
    }

    // Graceful fallback if bounding box is missing — protect center 90% of image
    if (!vision.itemBoundingBox) {
      console.log("[photobot-edit] Bounding box detection failed — using full image fallback");
      vision.itemBoundingBox = { top: 5, left: 5, bottom: 95, right: 95 };
    }

    console.log("[photobot-edit] Vision result:", JSON.stringify(vision).slice(0, 200));

    // ── STEP C: GENERATE THE MASK ──────────────────────────────────────────
    let resizedImage: Buffer;
    let resizedMask: Buffer;
    try {
      const bbox = vision.itemBoundingBox;
      const itemTop = Math.max(0, Math.floor(((bbox.top ?? 0) / 100) * height));
      const itemLeft = Math.max(0, Math.floor(((bbox.left ?? 0) / 100) * width));
      const itemBottom = Math.min(height, Math.floor(((bbox.bottom ?? 100) / 100) * height));
      const itemRight = Math.min(width, Math.floor(((bbox.right ?? 100) / 100) * width));
      const itemW = Math.max(1, itemRight - itemLeft);
      const itemH = Math.max(1, itemBottom - itemTop);

      console.log("[photobot-edit] Item bounding box px:", { itemTop, itemLeft, itemW, itemH });

      // Mask: transparent (alpha=0) = editable, opaque (alpha=255) = protected
      const protectedRect = await sharp({
        create: { width: itemW, height: itemH, channels: 4, background: { r: 255, g: 255, b: 255, alpha: 255 } },
      }).png().toBuffer();

      const maskBuffer = await sharp({
        create: { width, height, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
      })
        .composite([{ input: protectedRect, top: itemTop, left: itemLeft }])
        .png()
        .toBuffer();

      // Resize both to 1024x1024 for DALL-E 2
      resizedImage = await sharp(imageBuffer)
        .resize(1024, 1024, { fit: "contain", background: { r: 255, g: 255, b: 255, alpha: 255 } })
        .png()
        .toBuffer();
      resizedMask = await sharp(maskBuffer)
        .resize(1024, 1024, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .png()
        .toBuffer();
    } catch (maskErr: any) {
      console.error("[photobot-edit] Mask generation failed:", maskErr?.message);
      return NextResponse.json({ error: "Failed to generate image mask. Try a different photo." }, { status: 500 });
    }

    console.log("[photobot-edit] Mask generated. Image:", resizedImage.length, "bytes. Mask:", resizedMask.length, "bytes.");

    // ── STEP D: DALL-E 2 IMAGE EDIT ────────────────────────────────────────
    let editedUrl: string | null = null;
    try {
      console.log("[photobot-edit] Step D: Calling DALL-E 2 edit...");

      const imageFile = await toFile(resizedImage, "image.png", { type: "image/png" });
      const maskFile = await toFile(resizedMask, "mask.png", { type: "image/png" });

      const cleanDesc = vision.cleaningDescription || "distracting background elements";
      const itemDesc = vision.itemDescription || "the sale item";
      const bgReplacement = vision.backgroundReplacement || "clean, neutral, softly-lit studio background";

      // Build enriched DALL-E 2 prompt with context from AnalyzeBot + user custom prompt
      // Core instructions first (always included), then optional enrichment (trimmed if too long)
      const corePrompt = [
        `Professional product photography. The subject is ${itemDesc}.`,
        `Remove all distracting elements: ${cleanDesc}.`,
        `Replace removed areas with: ${bgReplacement}.`,
        `The ${itemDesc} must remain COMPLETELY unchanged.`,
        "Preserve all visible condition details. No people, no clutter. Soft professional lighting.",
      ].join(" ");

      const extraParts = [
        enrichmentHint ? `Context: ${enrichmentHint.replace("\n\nKNOWN ITEM DATA: ", "")}` : "",
        customPrompt ? `User instruction: ${customPrompt}.` : "",
      ].filter(Boolean).join(" ");

      // DALL-E 2 has a ~1000 char prompt limit — prioritize core instructions
      const fullPrompt = extraParts
        ? `${corePrompt} ${extraParts}`.slice(0, 1000)
        : corePrompt;

      const editResponse = await openai.images.edit({
        // CMD-PHOTOBOT-CORE-A: migrated dall-e-2 → gpt-image-1
        model: "gpt-image-1",
        image: imageFile,
        mask: maskFile,
        prompt: fullPrompt,
        n: 1,
        size: "1024x1024",
      });

      editedUrl = editResponse.data?.[0]?.url || null;
    } catch (editErr: any) {
      console.error("[photobot-edit] DALL-E 2 edit failed:", editErr?.message);
      return NextResponse.json({ error: "Image edit failed: " + (editErr?.message || "unknown") }, { status: 500 });
    }

    if (!editedUrl) {
      return NextResponse.json({ error: "DALL-E 2 edit returned no URL" }, { status: 500 });
    }

    console.log("[photobot-edit] Edit complete:", editedUrl.slice(0, 80));

    // ── Deduct credits AFTER DALL-E success ──────────────────────────────
    if (!isDemoMode()) {
      await deductCredits(user.id, creditCost, isRerun ? "PhotoBot re-run" : "PhotoBot run", itemId);
    }

    // ── PERMANENT SAVE: Download and save edited image to disk ───────────
    let editedPhotoSavedPath: string | null = null;
    try {
      const imgResp = await fetch(editedUrl);
      const imgBuf = Buffer.from(await imgResp.arrayBuffer());
      editedPhotoSavedPath = await storageAdapter.saveDocument(
        imgBuf, itemId, `photobot-edited-${Date.now()}.png`, "image/png"
      );
      console.log("[photobot-edit] Edited photo saved permanently:", editedPhotoSavedPath);
    } catch (saveErr: any) {
      console.warn("[photobot-edit] Failed to save edited photo permanently (non-fatal):", saveErr?.message);
    }

    // ── STEP E: STORE AND RETURN ───────────────────────────────────────────
    const result = {
      originalPhotoId: photoId,
      originalPhotoPath: photo.filePath,
      editedPhotoUrl: editedPhotoSavedPath || editedUrl,
      ...(editedPhotoSavedPath ? { editedPhotoSavedPath } : {}),
      itemBoundingBox: vision.itemBoundingBox,
      distractingElements: vision.distractingElements || [],
      cleaningDescription: vision.cleaningDescription || "",
      itemDescription: vision.itemDescription || "",
      itemProtected: true,
      createdAt: new Date().toISOString(),
    };

    await prisma.eventLog.create({
      data: {
        itemId,
        eventType: "PHOTOBOT_EDIT",
        payload: JSON.stringify(result),
      },
    });

    // ── PERMANENT ITEMPHOTO RECORD (after EventLog) ─────────────────────
    if (editedPhotoSavedPath) {
      try {
        await prisma.itemPhoto.create({
          data: { itemId, filePath: editedPhotoSavedPath, isPrimary: false, order: 999, caption: "AI Edited" },
        });
      } catch (photoErr: any) {
        console.warn("[photobot-edit] Failed to create ItemPhoto for edited image (non-fatal):", photoErr?.message);
      }
    }

    return NextResponse.json({ success: true, result });
  } catch (e: any) {
    console.error("[photobot-edit] Unexpected error:", e);
    return NextResponse.json({ error: e?.message || "Photo edit failed" }, { status: 500 });
  }
}

/**
 * GET /api/photobot/edit/[itemId]
 * Retrieve existing photo edit results
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

    const results = await prisma.eventLog.findMany({
      where: { itemId, eventType: "PHOTOBOT_EDIT" },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    return NextResponse.json({
      results: results.map((r) => safeJson(r.payload)).filter(Boolean),
    });
  } catch (e) {
    console.error("[photobot-edit GET]", e);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}
