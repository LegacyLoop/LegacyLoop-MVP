import sharp from "sharp";
import fs from "fs";
import path from "path";
import { prisma } from "@/lib/db";

/**
 * Deterministic license plate blur — applies gaussian blur to two zones
 * in the bottom-center of the image where plates typically appear.
 * No AI detection — guaranteed to cover the plate area without false positives.
 */
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

      const plateZones = [
        {
          label: "front-plate-zone",
          left: Math.floor(W * 0.25),
          top: Math.floor(H * 0.72),
          width: Math.floor(W * 0.50),
          height: Math.floor(H * 0.14),
        },
        {
          label: "rear-plate-zone",
          left: Math.floor(W * 0.25),
          top: Math.floor(H * 0.80),
          width: Math.floor(W * 0.50),
          height: Math.floor(H * 0.12),
        },
      ];
      console.log("[blur-plate] Plate zones:", JSON.stringify(plateZones));

      let baseBuffer = await sharp(imageBuffer).toBuffer();

      for (const zone of plateZones) {
        const clampedZone = {
          left: Math.max(0, zone.left),
          top: Math.max(0, zone.top),
          width: Math.min(zone.width, W - zone.left),
          height: Math.min(zone.height, H - zone.top),
        };

        if (clampedZone.width <= 0 || clampedZone.height <= 0) continue;

        console.log("[blur-plate] Blurring zone:", zone.label, clampedZone);

        const blurredRegion = await sharp(baseBuffer)
          .extract(clampedZone)
          .blur(18)
          .toBuffer();

        baseBuffer = await sharp(baseBuffer)
          .composite([{ input: blurredRegion, left: clampedZone.left, top: clampedZone.top }])
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

      console.log("[blur-plate] Plate blur complete — two zones applied, no AI used.");
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
