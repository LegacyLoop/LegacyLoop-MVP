import { NextRequest, NextResponse } from "next/server";
import { authAdapter } from "@/lib/adapters/auth";
import { prisma } from "@/lib/db";
import OpenAI, { toFile } from "openai";
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
    const { photoId } = body;

    if (!photoId) {
      return NextResponse.json({ error: "photoId is required" }, { status: 400 });
    }
    if (!openai) {
      return NextResponse.json({ error: "OpenAI not configured" }, { status: 500 });
    }

    // ── STEP A: FETCH THE PHOTO ────────────────────────────────────────────
    const item = await prisma.item.findUnique({
      where: { id: itemId },
      select: { userId: true },
    });
    if (!item || item.userId !== user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const photo = await prisma.itemPhoto.findUnique({ where: { id: photoId } });
    if (!photo || photo.itemId !== itemId) {
      return NextResponse.json({ error: "Photo not found" }, { status: 404 });
    }

    const absPath = path.join(process.cwd(), "public", photo.filePath);
    if (!fs.existsSync(absPath)) {
      return NextResponse.json({ error: "Photo file not found on disk" }, { status: 400 });
    }

    const imageBuffer = fs.readFileSync(absPath);
    const metadata = await sharp(imageBuffer).metadata();
    const width = metadata.width ?? 1024;
    const height = metadata.height ?? 1024;

    console.log("[photobot-edit] Photo loaded:", photo.id, `${width}x${height}`);

    // ── STEP B: GPT-4O VISION SCAN ─────────────────────────────────────────
    const ext = path.extname(absPath).toLowerCase();
    const mime = ext === ".png" ? "image/png" : ext === ".webp" ? "image/webp" : "image/jpeg";
    const base64 = imageBuffer.toString("base64");
    const dataUrl = `data:${mime};base64,${base64}`;

    let vision: any = null;
    try {
      console.log("[photobot-edit] Step B: GPT-4o vision scan...");
      const visionResp = await openai.responses.create({
        model: "gpt-4o",
        input: [
          {
            role: "system",
            content: "You are a precise computer vision analyst for product photography. Your job is to identify distracting elements in listing photos that should be removed — backgrounds, people, faces, clutter, furniture that is not the sale item, pets, cables, garbage, personal items. You must identify the approximate bounding box of the MAIN SALE ITEM so it can be protected from any editing. The sale item itself must never be touched.",
          },
          {
            role: "user",
            content: [
              {
                type: "input_text",
                text: `Analyze this product listing photo. Identify:

itemBoundingBox: The approximate location of the main sale item as percentages of image dimensions. Format: { top: 0-100, left: 0-100, bottom: 0-100, right: 0-100 }. Be generous — add 10% padding on all sides to ensure the item is fully protected.
distractingElements: Array of what should be removed. Examples: 'cluttered background', 'person in background', 'face visible', 'unrelated furniture', 'carpet/floor visible', 'wall visible', 'cables', 'personal items'
cleaningDescription: One sentence describing what will be removed. Example: 'Removing cluttered room background and person visible on left side, replacing with clean neutral background.'
itemDescription: Brief description of the sale item itself. Example: '6-drawer wooden dresser'
safeToAutoClean: true/false — is this photo safe to auto-clean without risk of accidentally affecting the item

Return flat JSON only. No wrapper keys.`,
              },
              { type: "input_image", image_url: dataUrl, detail: "auto" },
            ],
          },
        ],
        text: { format: { type: "text" } },
        max_output_tokens: 1500,
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
    const resizedImage = await sharp(imageBuffer)
      .resize(1024, 1024, { fit: "contain", background: { r: 255, g: 255, b: 255, alpha: 255 } })
      .png()
      .toBuffer();
    const resizedMask = await sharp(maskBuffer)
      .resize(1024, 1024, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toBuffer();

    console.log("[photobot-edit] Mask generated. Image:", resizedImage.length, "bytes. Mask:", resizedMask.length, "bytes.");

    // ── STEP D: DALL-E 2 IMAGE EDIT ────────────────────────────────────────
    let editedUrl: string | null = null;
    try {
      console.log("[photobot-edit] Step D: Calling DALL-E 2 edit...");

      const imageFile = await toFile(resizedImage, "image.png", { type: "image/png" });
      const maskFile = await toFile(resizedMask, "mask.png", { type: "image/png" });

      const cleanDesc = vision.cleaningDescription || "distracting background elements";
      const itemDesc = vision.itemDescription || "the sale item";

      const editResponse = await openai.images.edit({
        model: "dall-e-2",
        image: imageFile,
        mask: maskFile,
        prompt: `Clean product photography background. Remove all distracting elements: ${cleanDesc}. Replace removed areas with a clean, neutral, softly-lit background appropriate for a professional product listing. The ${itemDesc} in the protected area must remain completely unchanged — do not alter the item in any way. No people, no clutter, no personal items in background.`,
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
      editedPhotoUrl: editedUrl,
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
