import sharp from "sharp";
import fs from "fs";
import path from "path";
import { prisma } from "@/lib/db";
import OpenAI from "openai";

/**
 * AI-powered license plate blur — production-grade implementation.
 *
 * Uses OpenAI GPT-4o Vision for maximum accuracy on plate detection:
 * - 2-pass detection: detect → verify (eliminates false positives)
 * - Retry logic with fallback to gpt-4o-mini if primary fails
 * - Generous padding + heavy gaussian blur for complete obscuring
 * - Handles all plate types: standard, temporary, dealer, transit, reflected
 * - Smart filtering: skips outdoor equipment, validates bounding boxes
 * - Preserves original files for re-processing
 */

interface PlateBox {
  x: number;
  y: number;
  width: number;
  height: number;
  confidence?: number;
}

// ── AI plate detection ──────────────────────────────────────────────────────

const DETECTION_PROMPT = `You are a license plate detection system for a privacy-protection tool. Your ONLY job is to find license plates in vehicle photos so they can be blurred.

DETECT these plate types at ANY angle (straight-on, angled, partial, tilted, reflected):
- Standard metal license plates (front AND rear — check both ends of vehicle)
- Temporary paper/cardboard plates (dealer-issued, taped to window or bumper)
- Dealer plates, demonstration plates, and test drive plates
- Transit plates and in-transit permits (often taped inside rear window)
- Plates visible in reflections (mirrors, chrome bumpers, puddles, glass)
- Motorcycle plates (smaller, often at rear wheel level)
- Trailer plates (check behind tow hitches)
- Partially obscured plates (behind trailer hitches, bike racks, dirt)

DO NOT DETECT (return empty array for these):
- Empty plate brackets/frames with NO plate mounted
- Removed plate areas showing only bolt holes
- Bumper stickers, decals, or dealer emblems
- VIN numbers visible through windshields
- House numbers or street signs in the background
- Other vehicles' plates that are too small/distant to read (under 2% of image width)

Return your answer as ONLY a JSON array of bounding boxes. Each object:
{ "x": <number 0-100>, "y": <number 0-100>, "width": <number 0-100>, "height": <number 0-100> }

x and y = TOP-LEFT corner as percentage of total image dimensions.
width and height = size as percentage of total image dimensions.

Be GENEROUS — slightly too large is much better than cutting off plate edges.
A typical rear plate on a car photo: x~30-45, y~75-90, width~10-20, height~4-8.

No plates found? Return exactly: []
ONLY output the JSON array. No explanation, no markdown, no extra text.`;

async function callVision(
  openai: OpenAI,
  base64Image: string,
  model: string
): Promise<PlateBox[]> {
  const response = await openai.responses.create({
    model,
    input: [
      {
        role: "user",
        content: [
          {
            type: "input_image",
            image_url: `data:image/jpeg;base64,${base64Image}`,
            detail: "high",
          },
          {
            type: "input_text",
            text: DETECTION_PROMPT,
          },
        ],
      },
    ],
  });

  // Parse the response — handle multiple output formats
  const text = typeof response.output === "string"
    ? response.output
    : Array.isArray(response.output)
    ? response.output
        .map((o: any) => {
          if (typeof o === "string") return o;
          if (o.content && Array.isArray(o.content)) {
            return o.content.map((c: any) => c.text || "").join("");
          }
          return o.content || o.text || "";
        })
        .join("")
    : (response as any).output_text || "";

  // Extract JSON array from response (handle markdown code blocks too)
  const cleaned = text.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
  const jsonMatch = cleaned.match(/\[[\s\S]*?\]/);
  if (!jsonMatch) return [];

  const parsed = JSON.parse(jsonMatch[0]);
  if (!Array.isArray(parsed)) return [];

  // Validate each detection
  return parsed.filter((p: any) =>
    typeof p.x === "number" && typeof p.y === "number" &&
    typeof p.width === "number" && typeof p.height === "number" &&
    p.x >= 0 && p.x <= 100 && p.y >= 0 && p.y <= 100 &&
    p.width >= 1 && p.width <= 60 &&   // Plates are 1-60% of image width
    p.height >= 1 && p.height <= 40 &&  // Plates are 1-40% of image height
    p.width * p.height >= 2 &&          // Minimum area: 2% of image (skip tiny noise)
    p.width * p.height <= 1500          // Maximum area: 15% of image (skip massive false positives)
  );
}

async function detectPlates(imageBuffer: Buffer): Promise<PlateBox[]> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.log("[blur-plate] No OPENAI_API_KEY — skipping AI detection");
    return [];
  }

  const openai = new OpenAI({ apiKey });
  const base64Image = imageBuffer.toString("base64");

  // ── Pass 1: Primary detection with gpt-4o ──
  let plates: PlateBox[] = [];
  try {
    plates = await callVision(openai, base64Image, "gpt-4o");
    console.log(`[blur-plate] Pass 1 (gpt-4o): detected ${plates.length} plate(s)`);
  } catch (e: any) {
    console.warn("[blur-plate] Pass 1 (gpt-4o) failed:", e.message);

    // ── Fallback: retry with gpt-4o-mini ──
    try {
      plates = await callVision(openai, base64Image, "gpt-4o-mini");
      console.log(`[blur-plate] Fallback (gpt-4o-mini): detected ${plates.length} plate(s)`);
    } catch (e2: any) {
      console.error("[blur-plate] Both detection attempts failed:", e2.message);
      return [];
    }
  }

  if (plates.length === 0) return [];

  // ── Pass 2: Verification — re-check each detection with a focused prompt ──
  // Only runs if we detected plates, to eliminate false positives
  try {
    const verifyResponse = await openai.responses.create({
      model: "gpt-4o-mini",
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_image",
              image_url: `data:image/jpeg;base64,${base64Image}`,
              detail: "high",
            },
            {
              type: "input_text",
              text: `I previously detected ${plates.length} potential license plate(s) at these locations (as % of image): ${JSON.stringify(plates)}

Verify EACH detection: Is there actually a license plate (or temporary plate / paper tag) at that location? Remove any false positives (bumper stickers, dealer emblems, decals, reflections of non-plates).

Return ONLY the confirmed plates as a JSON array with the same format. Adjust coordinates if they need refinement. Return [] if none are real plates.`,
            },
          ],
        },
      ],
    });

    const verifyText = typeof verifyResponse.output === "string"
      ? verifyResponse.output
      : Array.isArray(verifyResponse.output)
      ? verifyResponse.output.map((o: any) => {
          if (typeof o === "string") return o;
          if (o.content && Array.isArray(o.content)) {
            return o.content.map((c: any) => c.text || "").join("");
          }
          return o.content || o.text || "";
        }).join("")
      : (verifyResponse as any).output_text || "";

    const cleanedVerify = verifyText.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
    const verifyMatch = cleanedVerify.match(/\[[\s\S]*?\]/);
    if (verifyMatch) {
      const verified = JSON.parse(verifyMatch[0]);
      if (Array.isArray(verified)) {
        const validVerified = verified.filter((p: any) =>
          typeof p.x === "number" && typeof p.y === "number" &&
          typeof p.width === "number" && typeof p.height === "number"
        );
        if (validVerified.length > 0 || verified.length === 0) {
          console.log(`[blur-plate] Pass 2 verification: ${validVerified.length}/${plates.length} confirmed`);
          plates = validVerified;
        }
      }
    }
  } catch (e: any) {
    // Verification failed — use original detections (better safe than sorry)
    console.warn("[blur-plate] Verification pass failed, using original detections:", e.message);
  }

  console.log(`[blur-plate] Final: ${plates.length} plate(s) confirmed:`, JSON.stringify(plates));
  return plates;
}

// ── Main blur function ──────────────────────────────────────────────────────

export async function blurPlatesForItem(itemId: string): Promise<{ blurredCount: number; platesDetected: number }> {
  // Guard: Check if item is actually a road vehicle before blurring
  const item = await prisma.item.findUnique({
    where: { id: itemId },
    select: { category: true, title: true },
  });
  const cat = (item?.category ?? "").toLowerCase();
  const title = (item?.title ?? "").toLowerCase();

  const isOutdoorEquipment = (
    cat.includes("outdoor") ||
    cat.includes("garden") ||
    /\b(lawn|mower|chainsaw|leaf blower|pressure washer|snow blower|garden tractor|lawn tractor|riding mower|push mower|weed (eater|trimmer)|hedge trimmer|tiller|cultivator)\b/i.test(title)
  );

  if (isOutdoorEquipment) {
    console.log("[blur-plate] SKIPPED — outdoor equipment, not a road vehicle. Title:", title.slice(0, 60));
    return { blurredCount: 0, platesDetected: 0 };
  }

  // Delete any previous blur-done marker so re-analysis can re-blur
  await prisma.eventLog.deleteMany({
    where: { itemId, eventType: "PLATE_BLUR_DONE" },
  });
  console.log("[blur-plate] Starting plate detection for item:", itemId);

  const photos = await prisma.itemPhoto.findMany({ where: { itemId } });
  if (!photos.length) return { blurredCount: 0, platesDetected: 0 };

  let blurredCount = 0;
  let totalPlatesDetected = 0;

  for (const photo of photos) {
    try {
      // CMD-CLOUDINARY-PHOTO-READ-FIX: read from URL or local disk
      const { readPhotoAsBuffer } = await import("@/lib/adapters/storage");
      const currentPath = photo.filePath;
      let imageBuffer: Buffer;
      try {
        imageBuffer = await readPhotoAsBuffer(currentPath);
      } catch {
        // Try original (non-blurred) path
        const originalPath = currentPath.replace(/_blurred(\.\w+)$/, "$1");
        try {
          imageBuffer = await readPhotoAsBuffer(originalPath);
        } catch {
          console.log("[blur-plate] File not found:", currentPath);
          continue;
        }
      }
      const metadata = await sharp(imageBuffer).metadata();
      const W = metadata.width ?? 800;
      const H = metadata.height ?? 600;

      // AI-powered plate detection (2-pass with verification)
      const plates = await detectPlates(imageBuffer);
      totalPlatesDetected += plates.length;

      if (plates.length === 0) {
        console.log(`[blur-plate] No plates in photo ${photo.id} — skipping`);
        continue;
      }

      let baseBuffer = await sharp(imageBuffer).toBuffer();

      for (const plate of plates) {
        // Convert percentage coordinates to pixels
        const rawZone = {
          left: Math.floor((plate.x / 100) * W),
          top: Math.floor((plate.y / 100) * H),
          width: Math.floor((plate.width / 100) * W),
          height: Math.floor((plate.height / 100) * H),
        };

        // Add 20% padding around detected plate for safety margin
        const padX = Math.floor(rawZone.width * 0.20);
        const padY = Math.floor(rawZone.height * 0.25);
        const paddedZone = {
          left: Math.max(0, rawZone.left - padX),
          top: Math.max(0, rawZone.top - padY),
          width: Math.min(rawZone.width + padX * 2, W - Math.max(0, rawZone.left - padX)),
          height: Math.min(rawZone.height + padY * 2, H - Math.max(0, rawZone.top - padY)),
        };

        // Final bounds check
        if (paddedZone.left + paddedZone.width > W) paddedZone.width = W - paddedZone.left;
        if (paddedZone.top + paddedZone.height > H) paddedZone.height = H - paddedZone.top;
        if (paddedZone.width <= 0 || paddedZone.height <= 0) continue;

        console.log(`[blur-plate] Blurring plate region:`, paddedZone);

        // Heavy gaussian blur (sigma 25) — completely unreadable
        const blurredRegion = await sharp(baseBuffer)
          .extract(paddedZone)
          .blur(25)
          .toBuffer();

        baseBuffer = await sharp(baseBuffer)
          .composite([{ input: blurredRegion, left: paddedZone.left, top: paddedZone.top }])
          .toBuffer();
      }

      // Save blurred version at high quality
      const finalImage = await sharp(baseBuffer).jpeg({ quality: 92 }).toBuffer();

      // Clean path to avoid _blurred_blurred on re-runs
      const cleanPath = photo.filePath.replace(/_blurred(\.\w+)$/, "$1");
      const blurredPath = cleanPath.replace(/(\.\w+)$/, "_blurred$1");
      const fullBlurredPath = path.join(process.cwd(), "public", blurredPath);
      fs.writeFileSync(fullBlurredPath, finalImage);

      await prisma.itemPhoto.update({
        where: { id: photo.id },
        data: { filePath: blurredPath },
      });

      console.log(`[blur-plate] Photo ${photo.id}: ${plates.length} plate(s) blurred successfully`);
      blurredCount++;
    } catch (e: any) {
      console.error(`[blur-plate] Error processing photo ${photo.id}:`, e.message);
    }
  }

  // Log completion
  await prisma.eventLog.create({
    data: {
      itemId,
      eventType: "PLATE_BLUR_DONE",
      payload: JSON.stringify({
        blurredCount,
        platesDetected: totalPlatesDetected,
        photosProcessed: photos.length,
        timestamp: new Date().toISOString(),
      }),
    },
  });

  console.log(`[blur-plate] Complete: ${totalPlatesDetected} plates detected, ${blurredCount} photos blurred`);
  return { blurredCount, platesDetected: totalPlatesDetected };
}
