/**
 * BACKWARD-COMPATIBLE RE-EXPORT LAYER
 * All pricing is defined in /lib/constants/pricing.ts (the single source of truth).
 * This file re-exports with legacy names so existing imports continue working.
 */

// Re-export everything from the new constants file
export {
  PROCESSING_FEE,
  TIERS,
  WHITE_GLOVE,
  NEIGHBORHOOD_BUNDLE,
  CREDIT_PACKS,
  BOT_COSTS,
  ESTATE_CONTRACTS,
  API_TIERS,
  DISCOUNTS,
  TIER_NUMBER_TO_KEY,
  TIER_KEY_TO_NUMBER,
  // Helpers
  calculateProcessingFee,
  calculateTotalWithFee,
  calculateCommission,
  calculateTierPrice,
  calculateWhiteGlovePrice,
  calculateNeighborhoodPrice,
  getTierByNumber,
  canUserAccessFeature,
  annualSavings,
} from "@/lib/constants/pricing";

// Re-export types
export type { DigitalTierDef, WhiteGloveDef } from "@/lib/constants/pricing";

// ── Legacy aliases (used by existing imports) ───────────────────────────────

import {
  TIERS,
  WHITE_GLOVE,
  NEIGHBORHOOD_BUNDLE as NB,
  CREDIT_PACKS,
  BOT_COSTS,
  ADD_ONS as ADDONS_SSOT,
  DISCOUNTS as NEW_DISCOUNTS,
} from "@/lib/constants/pricing";

// Legacy name: DIGITAL_TIERS — maps old format { FREE: { commission: 5, monthlyPrice: 20, ... } }
// to new format { free: { commission: 0.05, price: 20, ... } }
function buildLegacyDigitalTiers() {
  const result: Record<string, {
    id: string; name: string; tagline: string;
    monthlyPrice: number; annualPrice: number;
    preLaunchMonthly?: number; preLaunchAnnual?: number;
    commission: number; popular: boolean;
    limits: { items: number; photosPerItem: number; projects: number; storage: string; megabotUses: number; aiAnalysis: string };
    features: string[]; restrictions?: string[];
    includedAddOns?: Record<string, number>;
  }> = {};

  const storageMap: Record<string, string> = { free: "100MB", starter: "1GB", plus: "5GB", pro: "25GB" };
  const analysisMap: Record<string, string> = { free: "basic", starter: "standard", plus: "advanced", pro: "premium" };

  for (const [key, tier] of Object.entries(TIERS)) {
    const upperKey = key.toUpperCase();
    result[upperKey] = {
      id: key,
      name: tier.name,
      tagline: tier.tagline,
      monthlyPrice: tier.price,
      annualPrice: tier.annualPrice,
      preLaunchMonthly: tier.preLaunch || undefined,
      preLaunchAnnual: tier.preLaunchAnnual || undefined,
      commission: tier.commissionPct, // Legacy uses percentage (5, 8, 10, 15)
      popular: tier.popular ?? false,
      limits: {
        items: tier.items,
        photosPerItem: tier.photos,
        projects: tier.projects,
        storage: storageMap[key] ?? "1GB",
        megabotUses: tier.megabotUses,
        aiAnalysis: analysisMap[key] ?? "basic",
      },
      features: tier.features,
      restrictions: tier.restrictions,
    };
  }

  return result;
}

function buildLegacyWhiteGloveTiers() {
  const result: Record<string, {
    id: string; name: string; tagline: string;
    basePrice: number; preLaunchPrice: number;
    betaSpotsAvailable: number; commission: number;
    recommended?: boolean; idealFor: string;
    timeline: string; team: string;
    includes: string[]; notIncluded: string[];
  }> = {};

  for (const [key, wg] of Object.entries(WHITE_GLOVE)) {
    const upperKey = key.toUpperCase();
    result[upperKey] = {
      id: key,
      name: wg.name,
      tagline: wg.tagline,
      basePrice: wg.price,
      preLaunchPrice: wg.preLaunch,
      betaSpotsAvailable: 10,
      commission: wg.commissionPct, // Legacy uses percentage (25, 30, 35)
      recommended: wg.recommended,
      idealFor: `${wg.bedrooms} bedroom homes, up to ${wg.items} items`,
      timeline: wg.timeline,
      team: wg.team,
      includes: wg.includes,
      notIncluded: wg.notIncluded,
    };
  }

  return result;
}

/** Legacy DIGITAL_TIERS export — keyed by uppercase (FREE, STARTER, PLUS, PRO) */
export const DIGITAL_TIERS = buildLegacyDigitalTiers();

/** Legacy WHITE_GLOVE_TIERS export — keyed by uppercase (ESSENTIALS, PROFESSIONAL, LEGACY) */
export const WHITE_GLOVE_TIERS = buildLegacyWhiteGloveTiers();

/** Legacy CREDITS export */
export const CREDITS = {
  packages: [
    { id: "starter", amount: CREDIT_PACKS.pack_25.price, credits: CREDIT_PACKS.pack_25.credits, bonusCredits: CREDIT_PACKS.pack_25.bonus, savingsPct: 0, popular: false },
    { id: "builder", amount: CREDIT_PACKS.pack_50.price, credits: CREDIT_PACKS.pack_50.credits, bonusCredits: CREDIT_PACKS.pack_50.bonus, savingsPct: 24, popular: true },
    { id: "power", amount: CREDIT_PACKS.pack_100.price, credits: CREDIT_PACKS.pack_100.credits, bonusCredits: CREDIT_PACKS.pack_100.bonus, savingsPct: 41, popular: false },
    { id: "estate", amount: CREDIT_PACKS.pack_200.price, credits: CREDIT_PACKS.pack_200.credits, bonusCredits: CREDIT_PACKS.pack_200.bonus, savingsPct: 53, popular: false },
  ],
  botCosts: BOT_COSTS,
  creditValue: 1,
  earn: { referralBonus: 50, betaMemberBonus: 50, proMonthlyBonus: 10 },
} as const;

/** Legacy Recommendation type (still used by onboarding) */
export interface Recommendation {
  primaryCategory: "estate" | "garage" | "neighborhood";
  serviceLevel: "whiteGlove" | "diy";
  recommendedTier: string;
  needsAppraisal: boolean;
  needsShipping: boolean;
  hasVehicles: boolean;
  scores: Record<string, number>;
  confidence: number;
}

/** Legacy type aliases */
export interface TierLimits {
  items: number;
  photosPerItem: number;
  projects: number;
  storage: string;
  megabotUses: number;
  aiAnalysis: "basic" | "standard" | "advanced" | "premium";
}

export type DigitalTier = (typeof DIGITAL_TIERS)[keyof typeof DIGITAL_TIERS];
export type WhiteGloveTier = (typeof WHITE_GLOVE_TIERS)[keyof typeof WHITE_GLOVE_TIERS];

export interface AddOn {
  id: string;
  name: string;
  description: string;
  category: "ai" | "storytelling" | "services";
  credits: number;
  price: number;
  perItem: boolean;
}

/** Legacy helper: calculateNeighborhoodBundlePrice */
export function calculateNeighborhoodBundlePrice(
  families: number,
  isPreLaunch = false
): number {
  const base = isPreLaunch ? NB.preLaunch : NB.price;
  const additionalRate = isPreLaunch ? NB.preLaunchAdditional : NB.additionalFamily;
  const additionalFamilies = Math.max(0, families - 3);
  return base + additionalFamilies * additionalRate;
}

/** Legacy ADD_ONS export — full AddOn interface expected by marketplace */
export const ADD_ONS: Record<string, AddOn> = {
  megabot: { id: "megabot", name: ADDONS_SSOT.megabot.name, description: "3-AI consensus for maximum accuracy", category: "ai", credits: ADDONS_SSOT.megabot.credits, price: ADDONS_SSOT.megabot.credits, perItem: true },
  extraPhotos: { id: "extraPhotos", name: ADDONS_SSOT.extra_photos.name, description: "Upload up to 10 photos per item", category: "ai", credits: ADDONS_SSOT.extra_photos.credits, price: ADDONS_SSOT.extra_photos.credits, perItem: true },
  expertAppraisal: { id: "expertAppraisal", name: ADDONS_SSOT.expert_appraisal.name, description: "Certified appraiser review", category: "ai", credits: ADDONS_SSOT.expert_appraisal.credits, price: ADDONS_SSOT.expert_appraisal.credits, perItem: true },
  textStory: { id: "textStory", name: ADDONS_SSOT.text_story.name, description: "Capture and display item story", category: "storytelling", credits: ADDONS_SSOT.text_story.credits, price: ADDONS_SSOT.text_story.credits, perItem: true },
  audioStory: { id: "audioStory", name: ADDONS_SSOT.audio_story.name, description: "Professional audio recording", category: "storytelling", credits: ADDONS_SSOT.audio_story.credits, price: ADDONS_SSOT.audio_story.credits, perItem: true },
  videoStory: { id: "videoStory", name: ADDONS_SSOT.video_story.name, description: "HD video capture", category: "storytelling", credits: ADDONS_SSOT.video_story.credits, price: ADDONS_SSOT.video_story.credits, perItem: true },
  printBook: { id: "printBook", name: ADDONS_SSOT.print_book.name, description: "Hardcover legacy book", category: "storytelling", credits: ADDONS_SSOT.print_book.credits, price: ADDONS_SSOT.print_book.credits, perItem: false },
  archiveUSB: { id: "archiveUSB", name: ADDONS_SSOT.legacy_usb.name, description: "Complete digital archive", category: "storytelling", credits: ADDONS_SSOT.legacy_usb.credits, price: ADDONS_SSOT.legacy_usb.credits, perItem: false },
  techCoaching: { id: "techCoaching", name: ADDONS_SSOT.tech_coaching.name, description: "1-on-1 platform training", category: "services", credits: ADDONS_SSOT.tech_coaching.credits, price: ADDONS_SSOT.tech_coaching.credits, perItem: false },
  priorityProcessing: { id: "priorityProcessing", name: ADDONS_SSOT.priority.name, description: "24-hour turnaround", category: "services", credits: ADDONS_SSOT.priority.credits, price: ADDONS_SSOT.priority.credits, perItem: true },
  shippingKit: { id: "shippingKit", name: ADDONS_SSOT.shipping_kit.name, description: "Box, tape, padding, labels", category: "services", credits: ADDONS_SSOT.shipping_kit.credits, price: ADDONS_SSOT.shipping_kit.credits, perItem: false },
  inventoryReport: { id: "inventoryReport", name: ADDONS_SSOT.inventory_report.name, description: "Professional documentation", category: "services", credits: ADDONS_SSOT.inventory_report.credits, price: ADDONS_SSOT.inventory_report.credits, perItem: false },
};

/** Legacy helper: calculateAddOnPrice */
export function calculateAddOnPrice(
  addOnId: string,
  useCredits = false,
  isHero = false
): number {
  const addOn = ADD_ONS[addOnId];
  if (!addOn) return 0;
  const basePrice = useCredits ? addOn.credits : addOn.price;
  if (isHero && !useCredits) {
    return Math.round(basePrice * (1 - NEW_DISCOUNTS.heroes.subscriptionDiscount));
  }
  return basePrice;
}

/* ═══════════════════════════════════════════════════════════════════════
   CMD-PRICING-INTELLIGENCE-V3 — Category weight profiles + local
   enthusiast modifiers. Pure data tables; no I/O. Consumed by
   lib/pricing/reconcile.ts and lib/pricing/garage-sale.ts.
   ═══════════════════════════════════════════════════════════════════════ */

export type PricingCategory =
  | "musical_instruments"
  | "antiques_art"
  | "electronics_commodity"
  | "power_equipment"
  | "jewelry_watches"
  | "collectibles_graded"
  | "furniture_home"
  | "tools"
  | "clothing_soft"
  | "default";

type PricingSourceWeightProfile = {
  v8_engine: number;
  megabot_consensus: number;
  pricebot_ai: number;
  intelligence_claude: number;
  analyzebot_estimate: number;
  v2_valuation: number;
  market_comps_median: number;
};

export const CATEGORY_WEIGHT_PROFILES: Record<PricingCategory, PricingSourceWeightProfile> = {
  musical_instruments: {
    intelligence_claude: 1.00, pricebot_ai: 0.95, megabot_consensus: 0.85,
    v8_engine: 0.75, analyzebot_estimate: 0.60, v2_valuation: 0.45,
    market_comps_median: 0.55,
  },
  antiques_art: {
    analyzebot_estimate: 0.95, megabot_consensus: 0.90, intelligence_claude: 0.85,
    v8_engine: 0.70, pricebot_ai: 0.70, market_comps_median: 0.60,
    v2_valuation: 0.50,
  },
  electronics_commodity: {
    market_comps_median: 1.00, pricebot_ai: 0.90, v8_engine: 0.85,
    megabot_consensus: 0.80, v2_valuation: 0.70,
    analyzebot_estimate: 0.55, intelligence_claude: 0.55,
  },
  power_equipment: {
    pricebot_ai: 1.00, market_comps_median: 0.90, v8_engine: 0.85,
    megabot_consensus: 0.80, intelligence_claude: 0.70,
    analyzebot_estimate: 0.60, v2_valuation: 0.55,
  },
  jewelry_watches: {
    analyzebot_estimate: 1.00, megabot_consensus: 0.95,
    intelligence_claude: 0.90, v8_engine: 0.70, pricebot_ai: 0.75,
    market_comps_median: 0.65, v2_valuation: 0.55,
  },
  collectibles_graded: {
    megabot_consensus: 1.00, analyzebot_estimate: 0.95,
    intelligence_claude: 0.90, market_comps_median: 0.85,
    pricebot_ai: 0.75, v8_engine: 0.65, v2_valuation: 0.50,
  },
  furniture_home: {
    v8_engine: 1.00, pricebot_ai: 0.85, megabot_consensus: 0.80,
    market_comps_median: 0.75, intelligence_claude: 0.65,
    analyzebot_estimate: 0.60, v2_valuation: 0.55,
  },
  tools: {
    pricebot_ai: 1.00, market_comps_median: 0.90, v8_engine: 0.85,
    megabot_consensus: 0.80, intelligence_claude: 0.65,
    analyzebot_estimate: 0.60, v2_valuation: 0.55,
  },
  clothing_soft: {
    v8_engine: 1.00, pricebot_ai: 0.70, market_comps_median: 0.65,
    megabot_consensus: 0.60, intelligence_claude: 0.50,
    analyzebot_estimate: 0.50, v2_valuation: 0.45,
  },
  default: {
    v8_engine: 1.00, megabot_consensus: 0.90, pricebot_ai: 0.85,
    intelligence_claude: 0.70, analyzebot_estimate: 0.60,
    v2_valuation: 0.55, market_comps_median: 0.50,
  },
};

export function pickPricingCategory(
  aiCategory?: string | null,
  brand?: string | null,
  isAntique?: boolean,
  isCollectible?: boolean,
): PricingCategory {
  if (isAntique) return "antiques_art";
  if (isCollectible) return "collectibles_graded";
  const c = (aiCategory || "").toLowerCase();
  const b = (brand || "").toLowerCase();
  if (!c && !b) return "default";

  if (c.includes("music") || c.includes("instrument") || c.includes("guitar") ||
      c.includes("drum") || c.includes("piano") || c.includes("violin") ||
      c.includes("amplifier") || c.includes("amp")) return "musical_instruments";
  if (c.includes("jewel") || c.includes("ring") || c.includes("necklace") ||
      c.includes("watch") || c.includes("bracelet") || c.includes("earring")) return "jewelry_watches";
  if (c.includes("art") || c.includes("painting") || c.includes("sculpture") ||
      c.includes("antiqu") || c.includes("vintage")) return "antiques_art";
  if (c.includes("power equip") || c.includes("mower") || c.includes("chainsaw") ||
      c.includes("tractor") || c.includes("generator") || c.includes("snowblow")) return "power_equipment";
  if (c.includes("tool")) return "tools";
  if (c.includes("electron") || c.includes("phone") || c.includes("laptop") ||
      c.includes("tablet") || c.includes("tv") || c.includes("camera") ||
      c.includes("gaming") || c.includes("console")) return "electronics_commodity";
  if (c.includes("collect") || c.includes("card") || c.includes("coin") ||
      c.includes("stamp") || c.includes("figurine")) return "collectibles_graded";
  if (c.includes("furnitur") || c.includes("home") || c.includes("decor")) return "furniture_home";
  if (c.includes("cloth") || c.includes("apparel") || c.includes("fashion") ||
      c.includes("shoe") || c.includes("bag")) return "clothing_soft";

  return "default";
}

export const LOCAL_ENTHUSIAST_MODIFIERS: Record<string, { min: number; max: number }> = {
  musical_instruments: { min: 0.55, max: 0.70 },
  tools:               { min: 0.45, max: 0.60 },
  power_equipment:     { min: 0.50, max: 0.65 },
  furniture:           { min: 0.35, max: 0.50 },
  electronics:         { min: 0.30, max: 0.45 },
  default:             { min: 0.30, max: 0.45 },
};
