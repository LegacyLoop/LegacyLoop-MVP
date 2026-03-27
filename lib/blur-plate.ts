import sharp from "sharp";
import fs from "fs";
import path from "path";
import { prisma } from "@/lib/db";
import OpenAI from "openai";

/**
 * AI-powered license plate blur — uses OpenAI Vision to detect actual
 * plate locations in vehicle photos, then applies gaussian blur to
 * ONLY the detected plates. No more guessing, no more wrong-spot blurs.
 * Falls back to skipping blur if no plates detected or no API key.
 */

async function detectPlates(imageBuffer: Buffer): Promise<Array<{
  x: number; y: number; width: number; height: number;
}>> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.log("[blur-plate] No OPENAI_API_KEY — skipping AI detection");
    return [];
  }

  const openai = new OpenAI({ apiKey });
  const base64Image = imageBuffer.toString("base64");
  const mimeType = "image/jpeg";

  try {
    const response = await openai.responses.create({
      model: "gpt-4o-mini",
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_image",
              image_url: `data:${mimeType};base64,${base64Image}`,
              detail: "high",
            },
            {
              type: "input_text",
              text: `Analyze this vehicle photo for license plates. If you see ANY license plate (front or rear), return its bounding box as a JSON array. Each plate should be an object with x, y, width, height as PERCENTAGES of the total image dimensions (0-100 scale). x and y are the TOP-LEFT corner of the plate. Example: [{"x": 35, "y": 82, "width": 12, "height": 5}]. If NO license plate is visible, return an empty array: []. ONLY return the JSON array, nothing else. Be precise — the coordinates will be used to blur the plate for privacy.`,
            },
          ],
        },
      ],
    });

    const text = typeof response.output === "string"
      ? response.output
      : Array.isArray(response.output)
      ? response.output.map((o: any) => o.content || o.text || "").join("")
      : response.output_text || "";

    const jsonMatch = text.match(/\[[\s\S]*?\]/);
    if (!jsonMatch) {
      console.log("[blur-plate] AI returned no JSON array — no plates detected");
      return [];
    }

    const plates = JSON.parse(jsonMatch[0]);
    if (!Array.isArray(plates) || plates.length === 0) {
      console.log("[blur-plate] AI detected 0 plates");
      return [];
    }

    const validated = plates.filter((p: any) =>
      typeof p.x === "number" && typeof p.y === "number" &&
      typeof p.width === "number" && typeof p.height === "number" &&
      p.x >= 0 && p.x <= 100 && p.y >= 0 && p.y <= 100 &&
      p.width > 0 && p.width <= 50 && p.height > 0 && p.height <= 30
    );

    console.log(`[blur-plate] AI detected ${validated.length} plate(s):`, JSON.stringify(validated));
    return validated;
  } catch (e: any) {
    console.error("[blur-plate] AI detection failed:", e.message);
    return [];
  }
}
export async function blurPlatesForItem(itemId: string): Promise<{ blurredCount: number }> {
  // Guard: Check if item is actually a road vehicle before blurring
  // Outdoor equipment (lawn mowers, garden tractors) should NOT be blurred
  const item = await prisma.item.findUnique({
    where: { id: itemId },
    select: { category: true, title: true },
  });
  const cat = (item?.category ?? "").toLowerCase();
  const title = (item?.title ?? "").toLowerCase();

  const isOutdoorEquipment = (
    cat.includes("outdoor") ||
    cat.includes("garden") ||
    /\b(lawn|mower|chainsaw|leaf blower|pressure washer|snow blower|garden tractor|lawn tractor|riding mower|push mower)\b/i.test(title)
  );

  if (isOutdoorEquipment) {
    console.log("[blur-plate] SKIPPED — item is outdoor equipment, not a road vehicle. Category:", cat, "| Title:", title.slice(0, 60));
    return { blurredCount: 0 };
  }

  // Delete any previous blur-done marker so re-analysis can re-blur
  await prisma.eventLog.deleteMany({
    where: { itemId, eventType: "PLATE_BLUR_DONE" },
  });
  console.log("[blur-plate] Starting blur for item:", itemId);

  const photos = await prisma.itemPhoto.findMany({ where: { itemId } });
  console.log("[blur-plate] Found", photos.length, "photos:", photos.map((p) => ({ id: p.id, filePath: p.filePath })));
  if (!photos.length) return { blurredCount: 0 };

  let blurredCount = 0;

  for (const photo of photos) {
    try {
      // Try to read the original (non-blurred) file if it exists, otherwise use current path
      const currentPath = photo.filePath;
      const originalPath = currentPath.replace(/_blurred(\.\w+)$/, "$1");
      const absOriginal = path.join(process.cwd(), "public", originalPath);
      const absCurrent = path.join(process.cwd(), "public", currentPath);
      const filePath = fs.existsSync(absOriginal) ? absOriginal : absCurrent;
      if (!fs.existsSync(filePath)) {
        console.log("[blur-plate] File not found:", filePath);
        continue;
      }

      console.log("[blur-plate] Reading from:", filePath);
      const imageBuffer = fs.readFileSync(filePath);

      const metadata = await sharp(imageBuffer).metadata();
      const W = metadata.width ?? 800;
      const H = metadata.height ?? 600;
      console.log("[blur-plate] Image dimensions:", W, "x", H);

      // AI-powered plate detection
      const plates = await detectPlates(imageBuffer);

      if (plates.length === 0) {
        console.log("[blur-plate] No plates detected in photo — skipping blur");
        continue;
      }

      let baseBuffer = await sharp(imageBuffer).toBuffer();

      for (const plate of plates) {
        // Convert percentage coordinates to pixels
        const pixelZone = {
          left: Math.max(0, Math.floor((plate.x / 100) * W)),
          top: Math.max(0, Math.floor((plate.y / 100) * H)),
          width: Math.min(Math.floor((plate.width / 100) * W), W),
          height: Math.min(Math.floor((plate.height / 100) * H), H),
        };

        // Ensure zone doesn't exceed image bounds
        if (pixelZone.left + pixelZone.width > W) pixelZone.width = W - pixelZone.left;
        if (pixelZone.top + pixelZone.height > H) pixelZone.height = H - pixelZone.top;

        if (pixelZone.width <= 0 || pixelZone.height <= 0) {
          console.log("[blur-plate] Invalid zone after clamping — skipping");
          continue;
        }

        // Add 10% padding around detected plate for safety
        const padX = Math.floor(pixelZone.width * 0.1);
        const padY = Math.floor(pixelZone.height * 0.1);
        const paddedZone = {
          left: Math.max(0, pixelZone.left - padX),
          top: Math.max(0, pixelZone.top - padY),
          width: Math.min(pixelZone.width + padX * 2, W - Math.max(0, pixelZone.left - padX)),
          height: Math.min(pixelZone.height + padY * 2, H - Math.max(0, pixelZone.top - padY)),
        };

        console.log("[blur-plate] Blurring plate at:", paddedZone);

        const blurredRegion = await sharp(baseBuffer)
          .extract(paddedZone)
          .blur(20)
          .toBuffer();

        baseBuffer = await sharp(baseBuffer)
          .composite([{ input: blurredRegion, left: paddedZone.left, top: paddedZone.top }])
          .toBuffer();
      }

      const finalImage = await sharp(baseBuffer).jpeg({ quality: 92 }).toBuffer();

      // Strip any existing _blurred suffix to avoid _blurred_blurred on re-runs
      const cleanPath = photo.filePath.replace(/_blurred(\.\w+)$/, "$1");
      const blurredPath = cleanPath.replace(/(\.\w+)$/, "_blurred$1");
      const fullBlurredPath = path.join(process.cwd(), "public", blurredPath);
      fs.writeFileSync(fullBlurredPath, finalImage);

      await prisma.itemPhoto.update({
        where: { id: photo.id },
        data: { filePath: blurredPath },
      });

      console.log(`[blur-plate] AI plate blur complete — ${plates.length} plate(s) detected and blurred.`);
      blurredCount++;
    } catch (e: any) {
      console.error("[blur-plate] Error processing photo:", e.message);
    }
  }

  // Mark as done
  await prisma.eventLog.create({
    data: { itemId, eventType: "PLATE_BLUR_DONE", payload: JSON.stringify({ blurredCount, timestamp: new Date().toISOString() }) },
  });

  return { blurredCount };
}
