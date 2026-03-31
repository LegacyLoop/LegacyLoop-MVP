/**
 * LegacyLoop Logo Processing Pipeline
 * ------------------------------------
 * Drop your raw Illustrator exports into _logo-exports/ then run:
 *   node scripts/process-logos.mjs
 *
 * Requires: npm install sharp (already done)
 */

import sharp from "sharp";
import { existsSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT      = join(__dirname, "..");
const HOME      = process.env.HOME || "/Users/ryanhallee";
const SRC       = join(HOME, "Desktop", "LegacyLoop-Exports");
const DEST      = join(ROOT, "public", "images", "logos");

// ─── helpers ───────────────────────────────────────────────────────────────

function src(name)  { return join(SRC,  name); }
function out(name)  { return join(DEST, name); }

function check(file) {
  if (!existsSync(file)) {
    console.error(`\n  ✗  MISSING: ${file}`);
    console.error(`     Drop the export into _logo-exports/ and re-run.\n`);
    process.exit(1);
  }
}

async function resize(input, output, width, height, options = {}) {
  const { bg, quality = 100 } = options;

  let pipeline = sharp(input).resize(width, height, {
    fit:      "contain",
    position: "center",
    // transparent padding on resize
    background: bg ? hexToRgba(bg, 1) : { r: 0, g: 0, b: 0, alpha: 0 },
  });

  if (bg) {
    // Flatten transparent areas to solid background color
    pipeline = pipeline.flatten({ background: hexToRgba(bg, 1) });
  }

  await pipeline
    .png({ quality, compressionLevel: 9, adaptiveFiltering: true })
    .toFile(output);

  console.log(`  ✓  ${output.replace(ROOT, "")}`);
}

function hexToRgba(hex, alpha = 1) {
  const h = hex.replace("#", "");
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
    alpha,
  };
}

// ─── main ──────────────────────────────────────────────────────────────────

async function main() {
  console.log("\n  LegacyLoop Logo Processor\n  ─────────────────────────");

  mkdirSync(DEST, { recursive: true });

  // Verify source files exist
  const RAW_LOCKUP  = src("raw-lockup.png");
  const RAW_NAV     = src("raw-nav.png");
  const RAW_MARK    = src("raw-mark.png");
  const RAW_TAGLINE = src("raw-tagline.png");
  const RAW_OG      = src("raw-og.png");

  [RAW_LOCKUP, RAW_NAV, RAW_MARK, RAW_TAGLINE, RAW_OG].forEach(check);

  console.log("\n  Processing web assets...\n");

  // ── logo-lockup.png — 2400×900, transparent ──────────────────────────────
  await resize(RAW_LOCKUP, out("logo-lockup.png"), 2400, 900);

  // ── logo-nav.png — 2400×700, transparent ─────────────────────────────────
  await resize(RAW_NAV, out("logo-nav.png"), 2400, 700);

  // ── logo-stacked.png — 600×750 approx, transparent (replaces existing) ───
  await resize(RAW_LOCKUP, out("logo-stacked.png"), 600, 750);

  // ── logo-horizontal.png — 1200×350, transparent (replaces existing) ──────
  await resize(RAW_NAV, out("logo-horizontal.png"), 1200, 350);

  // ── logo-mark.png — 600×600, transparent ─────────────────────────────────
  await resize(RAW_MARK, out("logo-mark.png"), 600, 600);

  // ── logo-tagline.png — 1800×300, transparent ─────────────────────────────
  await resize(RAW_TAGLINE, out("logo-tagline.png"), 1800, 300);

  // ── favicon-32.png — 32×32, transparent ──────────────────────────────────
  await resize(RAW_MARK, out("favicon-32.png"), 32, 32);

  // ── favicon-64.png — 64×64, transparent ──────────────────────────────────
  await resize(RAW_MARK, out("favicon-64.png"), 64, 64);

  // ── apple-touch-icon.png — 180×180, transparent ──────────────────────────
  await resize(RAW_MARK, out("apple-touch-icon.png"), 180, 180);

  // ── logo-icon.png — 256×256, transparent (replaces existing for AppNav) ──
  await resize(RAW_MARK, out("logo-icon.png"), 256, 256);

  // ── og-image.png — 1200×630, #0A0A0F background ──────────────────────────
  await resize(RAW_OG, out("og-image.png"), 1200, 630, { bg: "#0A0A0F" });

  // ── legacyloop-logo.png — 465×137 (replaces current nav logo) ────────────
  await resize(RAW_NAV, out("legacyloop-logo.png"), 465, 137);

  console.log("\n  All done. Drop app/icon.png for the Next.js static favicon:\n");
  console.log("    cp public/images/logos/favicon-32.png app/icon.png\n");
  console.log("  Then commit everything and ship.\n");
}

main().catch((err) => {
  console.error("\n  Error:", err.message, "\n");
  process.exit(1);
});
