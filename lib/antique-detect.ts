import type { AiAnalysis } from "@/lib/types";

/* ═══════════════════════════════════════════
   ANTIQUE DETECTION v2
   Threshold raised from 3 → 8 to stop false positives.
   AI analysis is trusted as primary signal.
   Negative signals for electronics/modern items.
   ═══════════════════════════════════════════ */

// ── Strong signals (5+ pts) ──
const ANTIQUE_STRONG_KEYWORDS = [
  "antique", "heirloom", "victorian", "edwardian", "art deco", "art nouveau",
  "georgian", "regency", "colonial", "pre-war", "hand carved", "hand-painted",
  "dovetail", "mortise", "tenon", "patina",
];

// ── Medium signals (2 pts) ──
const ANTIQUE_MEDIUM_KEYWORDS = [
  "vintage", "mid-century", "retro", "collectible", "collector",
  "handcrafted", "handmade", "hallmark", "hallmarks", "maker's mark",
  "provenance", "signed", "numbered", "limited edition", "first edition",
  "depression glass", "milk glass", "carnival glass",
  "chippendale", "hepplewhite", "sheraton", "queen anne",
];

// ── Weak signals (1 pt) ──
const ANTIQUE_WEAK_KEYWORDS = [
  "1800s", "1900s", "1910s", "1920s", "1930s", "1940s", "1950s",
  "rare", "sterling", "silver", "gold", "brass", "bronze", "copper",
  "crystal", "porcelain", "mahogany", "walnut", "rosewood", "teak", "oak",
  "ivory", "tortoiseshell", "bakelite", "celluloid",
  "cast iron", "wrought iron",
  "coin", "currency", "stamp", "medal", "badge",
];

const COLLECTIBLE_BRANDS = [
  "tiffany", "rolex", "cartier", "patek philippe", "audemars piguet",
  "gorham", "wedgwood", "limoges", "meissen", "royal doulton", "hummel",
  "lalique", "daum", "galle", "murano",
  "remington", "winchester", "colt",
];

const HIGH_VALUE_MATERIALS = [
  "sterling silver", "solid silver", "18k gold", "14k gold", "platinum",
  "mahogany", "rosewood", "ebony",
  "crystal", "hand-blown glass", "art glass",
  "ivory", "jade", "amber", "coral",
  "persian rug", "oriental rug",
];

// ── NEGATIVE signals — modern/electronic items should NOT be flagged ──
const MODERN_CATEGORIES = [
  "electronics", "computer", "laptop", "phone", "tablet", "gaming",
  "appliance", "tv", "television", "monitor", "speaker", "headphone",
  "drone", "camera digital", "smart home", "router", "cable", "charger",
  "power tool", "electric tool", "3d printer", "vr headset",
  "smartphone", "wireless", "bluetooth", "usb-c", "usb c", "led light",
  "smart watch", "smartwatch", "airpod", "earbud", "webcam", "streamer",
];

const MODERN_BRANDS = [
  "apple", "samsung", "sony", "lg", "dell", "hp", "lenovo", "asus",
  "nintendo", "xbox", "playstation", "bose", "beats", "google", "amazon",
  "dyson", "roomba", "nest", "ring", "fitbit", "garmin",
  "dewalt", "milwaukee", "makita", "ryobi", "bosch power",
];

const MODERN_ERA_PATTERNS = [
  /\b20[012][0-9]s?\b/i, // 2000s, 2010s, 2020s
  /\b199[0-9]s?\b/i, // 1990s
  /\bmodern\b/i,
  /\bcontemporary\b/i,
  /\bcurrent\b/i,
  /\bnew model\b/i,
];

export type AntiqueResult = {
  isAntique: boolean;
  reason: string;
  auctionLow: number | null;
  auctionHigh: number | null;
  markers: string[];
  score: number;
};

export function detectAntiqueFromAi(ai: AiAnalysis): AntiqueResult {
  const searchText = [
    ai.item_name,
    ai.category,
    ai.brand ?? "",
    ai.maker ?? "",
    ai.material ?? "",
    ai.era ?? "",
    ai.style ?? "",
    ai.markings ?? "",
    ai.keywords.join(" "),
    ai.notes,
    ai.condition_guess,
    ai.condition_details ?? "",
  ]
    .join(" ")
    .toLowerCase();

  // ═══ STEP 1: AI flag as bonus points (NOT terminator) ═══
  // The 78-signal keyword/brand/material scoring ALWAYS runs.
  // AI flag contributes to score but never short-circuits detection.
  let aiBonus = 0;
  if (ai.is_antique === true) {
    aiBonus = 10; // Strong AI signal — add 10 points
  } else if (ai.is_antique === false) {
    aiBonus = -3; // AI says no, but still run scoring — AI can be wrong
  }
  // aiBonus is applied in STEP 3 below

  // ═══ STEP 2: Negative signals — modern/electronic items ═══
  let negativeScore = 0;

  // Category-based negative
  for (const cat of MODERN_CATEGORIES) {
    if (searchText.includes(cat)) negativeScore += 5;
  }

  // Modern brand negative
  for (const brand of MODERN_BRANDS) {
    if (searchText.includes(brand)) negativeScore += 5;
  }

  // Modern era negative
  for (const pattern of MODERN_ERA_PATTERNS) {
    if (pattern.test(searchText)) negativeScore += 10;
  }

  // ═══ STEP 3: Positive signal scoring ═══
  let score = 0;
  const matchedMarkers: string[] = [];

  // AI flag applied as bonus points (from STEP 1)
  score += aiBonus;
  if (ai.is_antique === true) {
    matchedMarkers.push("AI: Antique Detected");
  }

  // Strong keywords (+5 each)
  for (const kw of ANTIQUE_STRONG_KEYWORDS) {
    if (searchText.includes(kw)) {
      score += 5;
      matchedMarkers.push(kw.charAt(0).toUpperCase() + kw.slice(1));
    }
  }

  // Medium keywords (+2 each)
  for (const kw of ANTIQUE_MEDIUM_KEYWORDS) {
    if (searchText.includes(kw)) {
      score += 2;
      matchedMarkers.push(kw.charAt(0).toUpperCase() + kw.slice(1));
    }
  }

  // Weak keywords (+1 each)
  for (const kw of ANTIQUE_WEAK_KEYWORDS) {
    if (searchText.includes(kw)) {
      score += 1;
    }
  }

  // Collectible brands (+5 each)
  const matchedBrands: string[] = [];
  for (const b of COLLECTIBLE_BRANDS) {
    if (searchText.includes(b)) {
      score += 5;
      matchedBrands.push(b);
      matchedMarkers.push(`Brand: ${b.charAt(0).toUpperCase() + b.slice(1)}`);
    }
  }

  // High-value materials (+3 each)
  const matchedMaterials: string[] = [];
  for (const m of HIGH_VALUE_MATERIALS) {
    if (searchText.includes(m)) {
      score += 3;
      matchedMaterials.push(m);
      matchedMarkers.push(`Material: ${m}`);
    }
  }

  // Pre-1975 era detection (+6)
  const decadeMatch = searchText.match(/\b(1[5-8][0-9]{2}|19[0-6][0-9]|197[0-5])\b/);
  if (decadeMatch) {
    score += 6;
    matchedMarkers.push(`Era: circa ${decadeMatch[0]}`);
  }

  // Markings bonus (+3)
  if (ai.markings && ai.markings.length > 5) {
    score += 3;
    matchedMarkers.push(`Markings: ${ai.markings.slice(0, 60)}`);
  }

  // Era/style fields from AI (+3 each if present and meaningful)
  if (ai.era && ai.era.length > 3) {
    const eraStr = ai.era.toLowerCase();
    if (!MODERN_ERA_PATTERNS.some((p) => p.test(eraStr))) {
      matchedMarkers.push(`Era: ${ai.era}`);
    }
  }
  if (ai.style && ai.style.length > 3) {
    matchedMarkers.push(`Style: ${ai.style}`);
  }

  // ═══ STEP 4: Apply negative score ═══
  const finalScore = Math.max(0, score - negativeScore);

  // ═══ STEP 5: Threshold check — 8 points minimum ═══
  const isAntique = finalScore >= 8;

  if (!isAntique) {
    return {
      isAntique: false,
      reason: "Standard item — insufficient antique indicators.",
      auctionLow: null,
      auctionHigh: null,
      markers: [],
      score: finalScore,
    };
  }

  // Build unique markers list (deduplicate)
  const uniqueMarkers = [...new Set(matchedMarkers)].slice(0, 8);

  const allMatches = [
    ...matchedBrands.map((b) => `collectible brand: ${b}`),
    ...matchedMaterials.map((m) => `valuable material: ${m}`),
    ...(ai.is_antique === true ? ["AI confirmed antique"] : []),
    ...(decadeMatch ? [`circa ${decadeMatch[0]}`] : []),
  ].slice(0, 5);

  const reason =
    `Antique/collectible indicators (score ${finalScore}): ${allMatches.join(", ")}.` +
    (matchedBrands.length ? " Collectible brand detected." : "") +
    (matchedMaterials.length ? " High-value materials detected." : "") +
    (ai.markings ? " Maker's marks or labels identified." : "");

  // Auction estimate based on signal strength
  const brandMult = matchedBrands.length > 0 ? 2.5 : 1.0;
  const materialMult = matchedMaterials.length > 0 ? 1.8 : 1.0;
  const ageMult = decadeMatch ? 1.5 : 1.0;
  const base = 150 * brandMult * materialMult * ageMult;
  const auctionLow = Math.round(base * 0.6);
  const auctionHigh = Math.round(base * 3.0);

  return { isAntique: true, reason, auctionLow, auctionHigh, markers: uniqueMarkers, score: finalScore };
}
