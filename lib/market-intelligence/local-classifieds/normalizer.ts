/**
 * Category Normalizer — maps source-specific taxonomies → our 10-key
 * CategoryNormalized taxonomy (aligned with CATEGORY_WEIGHT_PROFILES).
 *
 * CMD-LOCAL-CLASSIFIEDS-FRAMEWORK (Phase 1).
 * Source-specific normalizers live here. Title/description keyword
 * heuristic resolves ambiguous cases (e.g., "Clothing" category but
 * title "Rolex Submariner" → jewelry_watches).
 */

import type { CategoryNormalized } from "./types";

// ─── Uncle Henry's numeric category ID → normalized key ─────────────────
// Based on Uncle Henry's published ad_stream taxonomy. Final keyword
// heuristic in normalizeUncleHenrysCategory() resolves ambiguous cases.

export const UNCLE_HENRYS_CATEGORY_MAP: Record<number, CategoryNormalized> = {
  // Musical Instruments
  203: "musical_instruments",

  // Antiques & Art
  162: "antiques_art",       // Antiques
  180: "antiques_art",       // Collectibles
  286: "antiques_art",       // Arts & Crafts
  164: "antiques_art",       // Estate Sales & Auctions

  // Electronics (commodity)
  182: "electronics_commodity",  // Computers
  178: "electronics_commodity",  // Cameras
  189: "electronics_commodity",  // Electronics & Radios
  196: "electronics_commodity",  // Home Entertainment

  // Power Equipment
  157: "power_equipment",    // All Terrain Vehicles
  216: "power_equipment",    // Snowmobiles
  215: "power_equipment",    // Snowmobile Accessories
  202: "power_equipment",    // Motor Homes & Campers
  170: "power_equipment",    // Boat Accessories
  171: "power_equipment",    // Boats: Paddle
  172: "power_equipment",    // Boats: Personal
  173: "power_equipment",    // Boats: Power
  174: "power_equipment",    // Boats: Sail
  181: "power_equipment",    // Boats: Commercial
  156: "power_equipment",    // Airplanes & Equipment
  169: "power_equipment",    // Bicycles
  185: "power_equipment",    // Cycle Accessories
  186: "power_equipment",    // Cycles: Dirt & Enduro
  187: "power_equipment",    // Cycles: Mopeds & Scooters
  188: "power_equipment",    // Cycles: Street
  210: "power_equipment",    // Racing
  211: "power_equipment",    // Racing Accessories
  222: "power_equipment",    // Trailers
  165: "power_equipment",    // Auto Acc.: Domestic
  167: "power_equipment",    // Auto Acc.: Tires & Wheels
  166: "power_equipment",    // Auto Acc.: Foreign (inferred)
  168: "power_equipment",    // Autos: Domestic
  177: "power_equipment",    // Autos: Foreign
  191: "power_equipment",    // Farm Equipment (inferred)
  192: "power_equipment",    // Farm Animals/Livestock (inferred; ambiguous)

  // Furniture & Home
  273: "furniture_home",     // Appliances
  219: "furniture_home",     // Stoves
  197: "furniture_home",     // Household Items
  204: "furniture_home",     // Pools, Hot Tubs & Spas
  194: "furniture_home",     // Furniture (inferred)

  // Tools
  183: "tools",              // Construction: Heavy
  184: "tools",              // Construction: Tools
  176: "tools",              // Building Materials

  // Clothing & Soft Goods
  179: "clothing_soft",      // Clothing
  199: "clothing_soft",      // Kid's Korner (mostly clothing/toys)

  // Jewelry & Watches
  198: "jewelry_watches",    // Jewelry

  // Default / Unmapped
  175: "default",            // Books & Magazines
  200: "default",            // Miscellaneous
  220: "default",            // Swap & Trade
  193: "default",            // Free For The Taking
  290: "default",            // Community Bulletin Board
  288: "default",            // What's Happening
  214: "default",            // Services
  195: "default",            // Help Wanted
  227: "default",            // Yard Sales & Flea Markets
  221: "default",            // Tickets & Travel
  158: "default",            // Animals (inferred)
  159: "default",            // Pet supplies (inferred)
};

// ─── Keyword-heuristic reassignment ─────────────────────────────────────
// Fires AFTER numeric lookup. Promotes ambiguous mappings when the title
// or description contains a high-signal keyword. Keep heuristic MINIMAL
// for Phase 1 — expand via data-driven tuning in Phase 2.

interface KeywordRule {
  patterns: RegExp[];
  target: CategoryNormalized;
}

const KEYWORD_RULES: KeywordRule[] = [
  {
    // Watches in any source category → jewelry_watches
    patterns: [
      /\b(rolex|omega|tag heuer|cartier|patek|breitling|tudor|seiko|citizen|timex)\b/i,
      /\b(wrist\s*watch|pocket\s*watch|chronograph|smartwatch|apple\s*watch)\b/i,
    ],
    target: "jewelry_watches",
  },
  {
    // Coins / currency / bullion → collectibles_graded (closest of 10 keys)
    patterns: [
      /\b(coin|bullion|silver\s*dollar|morgan\s*dollar|peace\s*dollar)\b/i,
      /\b(numismatic|currency\s*note|gold\s*eagle|proof\s*set)\b/i,
    ],
    target: "collectibles_graded",
  },
  {
    // Video games / consoles — no dedicated key in canonical taxonomy;
    // graded collectibles applies when sealed/graded, otherwise
    // electronics_commodity for loose consoles.
    patterns: [
      /\b(xbox|playstation|ps[345]|nintendo\s*switch|wii|gameboy|game\s*cube)\b/i,
      /\bvideo\s*games?\b/i,
    ],
    target: "electronics_commodity",
  },
  {
    // Guitars / amps / instruments even in mis-tagged sources
    patterns: [
      /\b(guitar|bass|amp(lifier)?|pedal(board)?|fender|gibson|martin|taylor|yamaha|dean|epiphone)\b/i,
      /\b(piano|keyboard|drum\s*kit|violin|cello|trumpet|saxophone|trombone)\b/i,
    ],
    target: "musical_instruments",
  },
  {
    // Sealed / graded sports cards, comics, trading cards
    patterns: [
      /\b(psa|bgs|cgc|sgc)\s*\d+/i,
      /\b(sealed|graded|gem\s*mint)\b.*\b(card|comic|figure|pokemon|magic\s*the\s*gathering|mtg)\b/i,
    ],
    target: "collectibles_graded",
  },
  {
    // Power tools — override from default when title is explicit
    patterns: [
      /\b(dewalt|milwaukee|makita|ryobi|bosch|stihl|husqvarna|snap-on)\b.*\b(drill|saw|grinder|wrench|kit)\b/i,
    ],
    target: "tools",
  },
];

function applyKeywordHeuristic(
  base: CategoryNormalized,
  title: string | undefined,
  description: string | undefined
): CategoryNormalized {
  const haystack = `${title ?? ""} ${description ?? ""}`.toLowerCase();
  if (!haystack.trim()) return base;
  for (const rule of KEYWORD_RULES) {
    if (rule.patterns.some((p) => p.test(haystack))) {
      return rule.target;
    }
  }
  return base;
}

// ─── Public API ─────────────────────────────────────────────────────────

export function normalizeUncleHenrysCategory(
  rawId: number,
  rawLabel: string,
  title?: string,
  description?: string
): CategoryNormalized {
  const base = UNCLE_HENRYS_CATEGORY_MAP[rawId] ?? "default";
  return applyKeywordHeuristic(base, title, description);
}

export function normalizeCraigslistCategory(slug: string): CategoryNormalized {
  const s = slug.toLowerCase();
  if (s.includes("musical")) return "musical_instruments";
  if (s.includes("antiq") || s.includes("arts")) return "antiques_art";
  if (s.includes("electron") || s.includes("computer") || s.includes("cell")) return "electronics_commodity";
  if (s.includes("atv") || s.includes("boat") || s.includes("motorcycle") || s.includes("rv") || s.includes("car") || s.includes("auto")) return "power_equipment";
  if (s.includes("jewel") || s.includes("watch")) return "jewelry_watches";
  if (s.includes("collect")) return "collectibles_graded";
  if (s.includes("furnitur") || s.includes("household") || s.includes("appli")) return "furniture_home";
  if (s.includes("tool")) return "tools";
  if (s.includes("cloth") || s.includes("apparel")) return "clothing_soft";
  return "default";
}

export function normalizeGenericCategory(rawLabel: string): CategoryNormalized {
  return applyKeywordHeuristic("default", rawLabel, undefined);
}
