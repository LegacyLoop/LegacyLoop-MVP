/**
 * CMD-NAV-PHOTO-FIX: Migrate local photos + documents to Cloudinary.
 *
 * Reads all ItemPhoto + ItemDocument records with /uploads/ paths,
 * uploads each file to Cloudinary, and updates the DB record with
 * the new secure_url.
 *
 * Usage:
 *   node scripts/migrate-photos-to-cloudinary.mjs
 *   node scripts/migrate-photos-to-cloudinary.mjs --dry-run
 *
 * Requires env vars (from .env.local):
 *   CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET
 *
 * Run LOCALLY (not on Vercel) — needs access to public/uploads/ files.
 */

import { v2 as cloudinary } from "cloudinary";
import { PrismaClient } from "@prisma/client";
import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { config } from "dotenv";

// Load env vars from .env.local
config({ path: ".env.local" });

const DRY_RUN = process.argv.includes("--dry-run");

// Validate Cloudinary config
const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

if (!cloudName || !apiKey || !apiSecret) {
  console.error("❌ Missing Cloudinary env vars. Required:");
  console.error("   CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET");
  console.error("   Set them in .env.local");
  process.exit(1);
}

cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret, secure: true });

const prisma = new PrismaClient();
const uploadsDir = join(process.cwd(), "public", "uploads");

async function uploadToCloudinary(localPath, folder) {
  const buffer = readFileSync(localPath);
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      { folder, resource_type: "auto", quality: "auto:good" },
      (err, res) => {
        if (err || !res) reject(err ?? new Error("No result"));
        else resolve(res);
      },
    ).end(buffer);
  });
}

async function migrate() {
  console.log(`\n${"═".repeat(50)}`);
  console.log(`  LegacyLoop Photo Migration → Cloudinary`);
  console.log(`  Mode: ${DRY_RUN ? "DRY RUN (no changes)" : "LIVE"}`);
  console.log(`  Cloud: ${cloudName}`);
  console.log(`${"═".repeat(50)}\n`);

  // ── Photos ──────────────────────────────────────────
  const photos = await prisma.itemPhoto.findMany({
    where: { filePath: { startsWith: "/uploads/" } },
  });
  console.log(`📷 Found ${photos.length} photos with local /uploads/ paths`);

  let photoSuccess = 0;
  let photoFailed = 0;
  let photoSkipped = 0;

  for (const photo of photos) {
    const filename = photo.filePath.replace("/uploads/", "");
    const localPath = join(uploadsDir, filename);

    if (!existsSync(localPath)) {
      console.log(`   ⚠️  File missing: ${filename} — skipping`);
      photoSkipped++;
      continue;
    }

    if (DRY_RUN) {
      console.log(`   🔍 Would migrate: ${filename}`);
      photoSuccess++;
      continue;
    }

    try {
      const result = await uploadToCloudinary(localPath, "legacyloop/migrated");
      await prisma.itemPhoto.update({
        where: { id: photo.id },
        data: { filePath: result.secure_url },
      });
      console.log(`   ✅ ${filename} → ${result.secure_url.slice(0, 70)}...`);
      photoSuccess++;
    } catch (err) {
      console.log(`   ❌ ${filename} — ${err.message}`);
      photoFailed++;
    }
  }

  // ── Documents ───────────────────────────────────────
  const docs = await prisma.itemDocument.findMany({
    where: { fileUrl: { startsWith: "/uploads/" } },
  });
  console.log(`\n📄 Found ${docs.length} documents with local /uploads/ paths`);

  let docSuccess = 0;
  let docFailed = 0;
  let docSkipped = 0;

  for (const doc of docs) {
    const filename = doc.fileUrl.replace("/uploads/", "");
    const localPath = join(uploadsDir, filename);

    if (!existsSync(localPath)) {
      console.log(`   ⚠️  File missing: ${filename} — skipping`);
      docSkipped++;
      continue;
    }

    if (DRY_RUN) {
      console.log(`   🔍 Would migrate: ${filename}`);
      docSuccess++;
      continue;
    }

    try {
      const result = await uploadToCloudinary(localPath, "legacyloop/migrated/docs");
      await prisma.itemDocument.update({
        where: { id: doc.id },
        data: { fileUrl: result.secure_url },
      });
      console.log(`   ✅ ${filename} → ${result.secure_url.slice(0, 70)}...`);
      docSuccess++;
    } catch (err) {
      console.log(`   ❌ ${filename} — ${err.message}`);
      docFailed++;
    }
  }

  // ── Summary ─────────────────────────────────────────
  console.log(`\n${"─".repeat(50)}`);
  console.log(`  MIGRATION ${DRY_RUN ? "DRY RUN" : "COMPLETE"}`);
  console.log(`  Photos:    ${photoSuccess} migrated, ${photoFailed} failed, ${photoSkipped} skipped`);
  console.log(`  Documents: ${docSuccess} migrated, ${docFailed} failed, ${docSkipped} skipped`);
  console.log(`${"─".repeat(50)}\n`);

  await prisma.$disconnect();
}

migrate().catch((err) => {
  console.error("Fatal migration error:", err);
  process.exit(1);
});
