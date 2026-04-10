/**
 * CMD-PHOTO-MIGRATION-TURSO: Migrate photos to Cloudinary via Turso production DB.
 *
 * Connects to Turso (libsql) production database, finds all ItemPhoto +
 * ItemDocument records with /uploads/ paths, uploads each file from local
 * public/uploads/ to Cloudinary, and updates the production DB record
 * with the Cloudinary secure_url.
 *
 * Usage:
 *   node scripts/migrate-photos-to-cloudinary.mjs --dry-run
 *   node scripts/migrate-photos-to-cloudinary.mjs
 *
 * Requires env vars (from .env):
 *   TURSO_CONNECTION_URL, TURSO_AUTH_TOKEN
 *   CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET
 *
 * Run LOCALLY — needs access to public/uploads/ files on disk.
 */

import { v2 as cloudinary } from "cloudinary";
import { createClient } from "@libsql/client";
import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { config } from "dotenv";

// Load env vars — try .env (where Turso + Cloudinary vars live)
config({ path: ".env" });
// Also load .env.local as override
config({ path: ".env.local" });

const DRY_RUN = process.argv.includes("--dry-run");

// ── Validate Cloudinary config ────────────────────────────────────
const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

if (!cloudName || !apiKey || !apiSecret) {
  console.error("❌ Missing Cloudinary env vars. Required:");
  console.error("   CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET");
  process.exit(1);
}

cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret, secure: true });

// ── Validate Turso config ─────────────────────────────────────────
const tursoUrl = process.env.TURSO_CONNECTION_URL;
const tursoToken = process.env.TURSO_AUTH_TOKEN;

if (!tursoUrl || !tursoToken) {
  console.error("❌ Missing Turso env vars. Required:");
  console.error("   TURSO_CONNECTION_URL, TURSO_AUTH_TOKEN");
  console.error(`   Found: URL=${tursoUrl ? "✅" : "❌"} TOKEN=${tursoToken ? "✅" : "❌"}`);
  process.exit(1);
}

const db = createClient({ url: tursoUrl, authToken: tursoToken });

const uploadsDir = join(process.cwd(), "public", "uploads");

// ── Cloudinary upload helper ──────────────────────────────────────
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

// ── Main migration ────────────────────────────────────────────────
async function migrate() {
  console.log(`\n${"═".repeat(50)}`);
  console.log(`  LegacyLoop Photo Migration → Cloudinary`);
  console.log(`  Mode: ${DRY_RUN ? "DRY RUN (no changes)" : "🔴 LIVE"}`);
  console.log(`  Cloud: ${cloudName}`);
  console.log(`  DB: Turso (${tursoUrl.slice(0, 50)}...)`);
  console.log(`${"═".repeat(50)}\n`);

  // ── Photos ──────────────────────────────────────────
  const photosResult = await db.execute(
    "SELECT id, filePath FROM ItemPhoto WHERE filePath LIKE '/uploads/%'"
  );
  const photos = photosResult.rows;
  console.log(`📷 Found ${photos.length} photos with local /uploads/ paths in Turso`);

  let photoSuccess = 0;
  let photoFailed = 0;
  let photoSkipped = 0;

  for (const photo of photos) {
    const filename = String(photo.filePath).replace("/uploads/", "");
    const localPath = join(uploadsDir, filename);

    if (!existsSync(localPath)) {
      console.log(`   ⚠️  File missing locally: ${filename} — skipping`);
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
      await db.execute({
        sql: "UPDATE ItemPhoto SET filePath = ? WHERE id = ?",
        args: [result.secure_url, photo.id],
      });
      console.log(`   ✅ ${filename} → ${result.secure_url.slice(0, 70)}...`);
      photoSuccess++;
    } catch (err) {
      console.log(`   ❌ ${filename} — ${err.message}`);
      photoFailed++;
    }
  }

  // ── Documents ───────────────────────────────────────
  const docsResult = await db.execute(
    "SELECT id, fileUrl FROM ItemDocument WHERE fileUrl LIKE '/uploads/%'"
  );
  const docs = docsResult.rows;
  console.log(`\n📄 Found ${docs.length} documents with local /uploads/ paths in Turso`);

  let docSuccess = 0;
  let docFailed = 0;
  let docSkipped = 0;

  for (const doc of docs) {
    const filename = String(doc.fileUrl).replace("/uploads/", "");
    const localPath = join(uploadsDir, filename);

    if (!existsSync(localPath)) {
      console.log(`   ⚠️  File missing locally: ${filename} — skipping`);
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
      await db.execute({
        sql: "UPDATE ItemDocument SET fileUrl = ? WHERE id = ?",
        args: [result.secure_url, doc.id],
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

  db.close();
}

migrate().catch((err) => {
  console.error("Fatal migration error:", err);
  process.exit(1);
});
