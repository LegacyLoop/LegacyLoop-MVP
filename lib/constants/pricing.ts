/**
 * LEGACYLOOP PRICING — SINGLE SOURCE OF TRUTH
 *
 * This file defines ALL pricing, tier access, bot costs, credit packs,
 * add-ons, commissions, photo/item limits, and service pricing.
 *
 * Stripe processing fee (3.5%) is passed through to buyer/purchaser.
 * Sellers do NOT have processing fees deducted — only tier commission.
 *
 * IMPORTANT: Always use PROCESSING_FEE.display for UI display of the
 * fee percentage. Never calculate it inline — this prevents the
 * 3.5000000000000004% floating point display bug.
 */

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION A — TIER DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════════

/** Canonical tier integer IDs — matches User.tier in the database */
export const TIER = {
  FREE: 1,
  DIY_SELLER: 2,
  POWER_SELLER: 3,
  ESTATE_MANAGER: 4,
} as const;

/** Display names for each tier */
export const TIER_NAMES: Record<number, string> = {
  [TIER.FREE]: "Free",
  [TIER.DIY_SELLER]: "DIY Seller",
  [TIER.POWER_SELLER]: "Power Seller",
  [TIER.ESTATE_MANAGER]: "Estate Manager",
};

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION B — SUBSCRIPTION PLANS
// ═══════════════════════════════════════════════════════════════════════════════

export const PLANS = {
  FREE: {
    tier: TIER.FREE,
    name: "Free",
    monthlyPrice: 0,
    preLaunchPrice: 0,
    annualPrice: 0,
    preLaunchAnnual: 0,
    commission: 0.12,
    commissionDisplay: "12%",
  },
  DIY_SELLER: {
    tier: TIER.DIY_SELLER,
    name: "DIY Seller",
    monthlyPrice: 20,
    preLaunchPrice: 10,
    annualPrice: 200,
    preLaunchAnnual: 100,
    commission: 0.08,
    commissionDisplay: "8%",
  },
  POWER_SELLER: {
    tier: TIER.POWER_SELLER,
    name: "Power Seller",
    monthlyPrice: 49,
    preLaunchPrice: 25,
    annualPrice: 490,
    preLaunchAnnual: 250,
    commission: 0.05,
    commissionDisplay: "5%",
  },
  ESTATE_MANAGER: {
    tier: TIER.ESTATE_MANAGER,
    name: "Estate Manager",
    monthlyPrice: 99,
    preLaunchPrice: 75,
    annualPrice: 990,
    preLaunchAnnual: 750,
    commission: 0.04,
    commissionDisplay: "4%",
  },
} as const;

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION C — TIER LIMITS
// ═══════════════════════════════════════════════════════════════════════════════

export const TIER_LIMITS: Record<number, {
  maxActiveItems: number | null;
  maxPhotosPerItem: number;
  maxProjects: number | null;
  megaBotMonthly: number | null;
  hasAnalytics: boolean;
  hasBuyerFinder: boolean;
  hasStorefront: boolean;
  hasStoryTelling: boolean;
  hasEstateTools: boolean;
  hasBulkUpload: boolean;
}> = {
  [TIER.FREE]: {
    maxActiveItems: 3,
    maxPhotosPerItem: 2,
    maxProjects: 0,
    megaBotMonthly: 0,
    hasAnalytics: false,
    hasBuyerFinder: false,
    hasStorefront: false,
    hasStoryTelling: false,
    hasEstateTools: false,
    hasBulkUpload: false,
  },
  [TIER.DIY_SELLER]: {
    maxActiveItems: 25,
    maxPhotosPerItem: 5,
    maxProjects: 3,
    megaBotMonthly: null,
    hasAnalytics: false,
    hasBuyerFinder: true,
    hasStorefront: false,
    hasStoryTelling: false,
    hasEstateTools: false,
    hasBulkUpload: false,
  },
  [TIER.POWER_SELLER]: {
    maxActiveItems: 100,
    maxPhotosPerItem: 8,
    maxProjects: 10,
    megaBotMonthly: null,
    hasAnalytics: true,
    hasBuyerFinder: true,
    hasStorefront: false,
    hasStoryTelling: true,
    hasEstateTools: false,
    hasBulkUpload: true,
  },
  [TIER.ESTATE_MANAGER]: {
    maxActiveItems: null,
    maxPhotosPerItem: 15,
    maxProjects: null,
    megaBotMonthly: null,
    hasAnalytics: true,
    hasBuyerFinder: true,
    hasStorefront: true,
    hasStoryTelling: true,
    hasEstateTools: true,
    hasBulkUpload: true,
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION D — BOT ACCESS BY TIER
// ═══════════════════════════════════════════════════════════════════════════════

export const BOT_ACCESS: Record<number, {
  analyzeBot: boolean;
  priceBot: boolean;
  photoBot: boolean;
  listBot: boolean;
  buyerBot: boolean;
  reconBot: boolean;
  antiqueBot: boolean;
  collectiblesBot: boolean;
  carBot: boolean;
  megaBot: boolean;
  videoBot: boolean;
}> = {
  [TIER.FREE]: {
    analyzeBot: true,
    priceBot: false,
    photoBot: false,
    listBot: false,
    buyerBot: false,
    reconBot: false,
    antiqueBot: false,
    collectiblesBot: false,
    carBot: false,
    megaBot: false,
    videoBot: false,
  },
  [TIER.DIY_SELLER]: {
    analyzeBot: true,
    priceBot: true,
    photoBot: true,
    listBot: true,
    buyerBot: true,
    reconBot: false,
    antiqueBot: false,
    collectiblesBot: false,
    carBot: false,
    megaBot: true,
    videoBot: true, // Standard tier (8cr) — Pro requires Power+, MegaBot requires Estate
  },
  [TIER.POWER_SELLER]: {
    analyzeBot: true,
    priceBot: true,
    photoBot: true,
    listBot: true,
    buyerBot: true,
    reconBot: true,
    antiqueBot: true,
    collectiblesBot: true,
    carBot: false,
    megaBot: true,
    videoBot: true,
  },
  [TIER.ESTATE_MANAGER]: {
    analyzeBot: true,
    priceBot: true,
    photoBot: true,
    listBot: true,
    buyerBot: true,
    reconBot: true,
    antiqueBot: true,
    collectiblesBot: true,
    carBot: true,
    megaBot: true,
    videoBot: true,
  },
};

export type BotName = keyof (typeof BOT_ACCESS)[1];

// ── VideoBot Sub-Tier Access ────────────────────────────────────────────────
// videoBot: true in BOT_ACCESS unlocks Standard (8cr). Higher tiers gated here.
export const VIDEOBOT_TIER_ACCESS = {
  standard: TIER.DIY_SELLER,   // DIY Seller+ (8 credits)
  pro: TIER.POWER_SELLER,      // Power Seller+ (15 credits)
  megabot: TIER.ESTATE_MANAGER, // Estate Manager only (25 credits)
} as const;

// ── Intel Center Tab Access ─────────────────────────────────────────────────
export const INTEL_TAB_ACCESS: Record<string, number> = {
  market: TIER.DIY_SELLER,     // DIY Seller+
  ready: TIER.DIY_SELLER,      // DIY Seller+
  sell: TIER.POWER_SELLER,     // Power Seller+
  alerts: TIER.POWER_SELLER,   // Power Seller+
  action: TIER.POWER_SELLER,   // Power Seller+
};

// ── Ask Claude Access ───────────────────────────────────────────────────────
export const ASK_CLAUDE_MIN_TIER = TIER.DIY_SELLER; // 0.25cr/question

// ── Priority Bot Queue ──────────────────────────────────────────────────────
export const PRIORITY_QUEUE_TIER = TIER.ESTATE_MANAGER; // Estate Manager exclusive

// ── Selling Network Access ──────────────────────────────────────────────────
export const SELLING_NETWORK_ACCESS = {
  garageSaleBrowse: TIER.FREE,         // All tiers
  garageSaleNetwork: TIER.DIY_SELLER,  // DIY+
  neighborhoodEvents: TIER.DIY_SELLER, // DIY+
  estateSaleEvents: TIER.ESTATE_MANAGER, // Estate only
} as const;

// ── Monthly Credits Per Tier ────────────────────────────────────────────────
export const MONTHLY_CREDITS: Record<number, number> = {
  [TIER.FREE]: 0,
  [TIER.DIY_SELLER]: 20,
  [TIER.POWER_SELLER]: 50,
  [TIER.ESTATE_MANAGER]: 100,
};

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION E — FREE TIER RULES
// ═══════════════════════════════════════════════════════════════════════════════

export const FREE_TIER_RULES = {
  freeAnalysisRuns: 1,
  freePriceBotBundled: true,
  antiqueAlertFree: true,
  collectibleAlertFree: true,
  vehicleAlertFree: true,
  megaBotFree: false,
  allOtherBotsFree: false,
  freeAnalysisCreditCost: 0,
  subsequentAnalysisCreditCost: 1,
} as const;

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION F — BOT CREDIT COSTS
// ═══════════════════════════════════════════════════════════════════════════════

// STEP 4.6 (April 6 2026): clean integer ladder 1→2→3→4→5→7
// Specialty bots all 4cr to cover scraper costs.
// MegaBot bumped to 7/4 for premium positioning.
// Audit: see git log e5a9b1f for unit-economics analysis.
export const BOT_CREDIT_COSTS = {
  singleBotRun: 1,        // Generic baseline (legacy callers)
  singleBotReRun: 0.5,
  // PriceBot specialty (Step 4.6 bump 1→2)
  priceBotRun: 2,
  priceBotReRun: 1,
  // PhotoBot (Step 4.6 explicit constant — was using singleBotRun)
  photoBotRun: 1,
  photoBotReRun: 0.5,
  // ListBot HYBRID (Claude marketplace + Grok social) — Step 4.6 bump 2→4
  listBotRun: 4,
  listBotReRun: 2,
  // CarBot (Step 4.6 bump 1→4 — matches specialty pattern)
  carBotRun: 4,           // Gemini primary + OpenAI rare-vehicle secondary
  carBotReRun: 2,
  // Specialist bots (Step 4.6 bump 2→4)
  antiqueBotRun: 4,
  antiqueBotReRun: 2,
  collectiblesBotRun: 4,
  collectiblesBotReRun: 2,
  // ReconBot (Step 4.6 bump 2→3)
  reconBotRun: 3,
  reconBotReRun: 2,
  reconBotAutoScan: 8,    // CLICK-ONLY premium auto-scan — never auto-fires
  // BuyerBot (Step 4.6 bump 2→4 + scraper cap to 3 max)
  buyerBotRun: 4,
  buyerBotReRun: 2,
  // MegaBot (Step 4.6 bump 5→7 / 3→4 — premium positioning)
  megaBotRun: 7,
  megaBotReRun: 4,
  // AnalyzeBot: free first run, paid re-runs (Step 4.6 semantic constant)
  analyzeBotReRun: 1,
  intelligenceRun: 1,    // Claude intelligence synthesis
  intelligenceRefresh: 0.5, // Refresh when stale
  intelligenceChat: 0.25,  // Ask Claude a question about item intel
  antiqueDeepDive: 5,
  analyzeBotFirstRun: 0,
  videoBotStandard: 8,
  videoBotPro: 15,
  megaBotVideo: 25,
  saleVideo: 35,
} as const;

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION G — CREDIT PACKS
// ═══════════════════════════════════════════════════════════════════════════════

export const CREDIT_PACK_LIST = [
  {
    id: "starter",
    name: "Starter",
    baseCredits: 30,
    bonusCredits: 0,
    totalCredits: 30,
    price: 25.00,
    pricePerCredit: 0.83,
    badge: null as string | null,
  },
  {
    id: "plus",
    name: "Plus",
    baseCredits: 50,
    bonusCredits: 15,
    totalCredits: 65,
    price: 50.00,
    pricePerCredit: 0.77,
    badge: "MOST POPULAR" as string | null,
  },
  {
    id: "power",
    name: "Power",
    baseCredits: 100,
    bonusCredits: 40,
    totalCredits: 140,
    price: 100.00,
    pricePerCredit: 0.71,
    badge: "BEST VALUE" as string | null,
  },
  {
    id: "pro",
    name: "Pro",
    baseCredits: 200,
    bonusCredits: 100,
    totalCredits: 300,
    price: 200.00,
    pricePerCredit: 0.67,
    badge: "MAX SAVINGS" as string | null,
  },
];

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION G2 — CUSTOM CREDIT SCALE
// The sliding scale for custom credit purchases.
// Rate automatically improves as the dollar amount increases.
// Each tier's rate matches the corresponding standard pack.
// ═══════════════════════════════════════════════════════════════════════════════

export const CUSTOM_CREDIT_SCALE = [
  { minAmount: 25,  maxAmount: 49,    rate: 0.83, tierName: "Starter",  color: "#00bcd4" },
  { minAmount: 50,  maxAmount: 99,    rate: 0.77, tierName: "Plus",     color: "#00bcd4" },
  { minAmount: 100, maxAmount: 199,   rate: 0.71, tierName: "Power",    color: "#00bcd4" },
  { minAmount: 200, maxAmount: 499,   rate: 0.67, tierName: "Pro",      color: "#00bcd4" },
  { minAmount: 500, maxAmount: 10000, rate: 0.60, tierName: "Bulk",     color: "#ffd700" },
] as const;

export const CUSTOM_CREDIT_MINIMUM = 25;
export const CUSTOM_CREDIT_MAXIMUM = 10000;

/**
 * Default dollars-per-credit rate used for budget tracking and spending reports.
 * Matches the "Power" pack rate ($100 / 140 credits ≈ $0.71/credit).
 * This is an accounting estimate — actual cost depends on which pack the user bought.
 */
export const CREDIT_COST_RATE = 0.71;

/**
 * Calculate credits for a custom dollar amount using the sliding scale.
 * Returns the number of credits and which rate tier was applied.
 */
export function calculateCustomCredits(amount: number): {
  credits: number;
  rate: number;
  tierName: string;
  perCredit: string;
  savings: string;
} {
  const tier = CUSTOM_CREDIT_SCALE.find(
    (t) => amount >= t.minAmount && amount <= t.maxAmount
  );

  if (!tier) {
    const fallbackRate = CUSTOM_CREDIT_SCALE[0].rate;
    const credits = Math.floor(amount / fallbackRate);
    return { credits, rate: fallbackRate, tierName: "Starter",
      perCredit: `${fallbackRate.toFixed(2)}`, savings: "Base rate" };
  }

  const credits = Math.floor(amount / tier.rate);
  const starterCredits = Math.floor(amount / CUSTOM_CREDIT_SCALE[0].rate);
  const bonusCredits = credits - starterCredits;
  const savingsPct = starterCredits > 0
    ? Math.round((bonusCredits / starterCredits) * 100) : 0;

  return {
    credits,
    rate: tier.rate,
    tierName: tier.tierName,
    perCredit: `${tier.rate.toFixed(2)}`,
    savings: savingsPct > 0 ? `${savingsPct}% more credits` : "Base rate",
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION H — PROCESSING FEE
// ═══════════════════════════════════════════════════════════════════════════════

export const PROCESSING_FEE = {
  rate: 0.035,
  buyerRate: 0.0175,
  sellerRate: 0.0175,
  /** Always use this for UI display — never calculate inline */
  display: "3.5%",
  buyerDisplay: "1.75%",
  sellerDisplay: "1.75%",
  label: "Processing Fee",
  description: "Split evenly between buyer and seller",
  model: "split" as const,
};

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION I — ADD-ON SERVICES
// ═══════════════════════════════════════════════════════════════════════════════

export const ADDONS = [
  { id: "megabot_analysis", name: "MegaBot Analysis", credits: 5, category: "ai", description: "Multi-AI deep item evaluation" },
  { id: "expert_appraisal", name: "Expert Appraisal", credits: 15, category: "valuation", description: "Professional appraisal by verified expert" },
  { id: "text_story", name: "Item Story \u2014 Text", credits: 5, category: "legacy", description: "AI-written story preserving your item's history" },
  { id: "audio_story", name: "Item Story \u2014 Audio", credits: 10, category: "legacy", description: "Narrated audio story of your item's history" },
  { id: "video_story", name: "Item Story \u2014 Video", credits: 15, category: "legacy", description: "Professional video story for your item" },
  { id: "legacy_archive_usb", name: "Legacy Archive USB", credits: 30, category: "legacy", description: "Physical USB archive of your item documentation" },
  { id: "tech_coaching", name: "Tech Coaching Session", credits: 25, category: "support", description: "1-on-1 platform coaching session" },
  { id: "inventory_report", name: "Inventory Report PDF", credits: 30, category: "reporting", description: "Full inventory valuation report \u2014 print ready" },
  { id: "priority_processing", name: "Priority Processing", credits: 10, category: "service", description: "Move your items to the front of the queue" },
  { id: "extra_photos", name: "Extra Photos (6\u201310)", credits: 2, category: "photos", description: "Upload up to 10 photos for this item" },
  { id: "shipping_kit", name: "Shipping Materials Kit", credits: 10, category: "shipping", description: "Professional packing materials shipped to you" },
  { id: "print_story_book", name: "Print Story Book", credits: 50, category: "legacy", description: "Beautiful printed book of your item stories" },
  { id: "ai_listing_optimizer", name: "AI Listing Optimizer", credits: 10, category: "ai", description: "All 4 AIs rewrite and optimize every listing simultaneously across all 13 platforms" },
  { id: "buyer_outreach_blast", name: "Buyer Outreach Blast", credits: 8, category: "ai", description: "All 4 AIs identify buyer personas and craft personalized outreach per buyer type" },
  { id: "ai_market_report", name: "AI Market Intelligence Report", credits: 15, category: "reporting", description: "All 4 AIs analyze your full inventory against live market data with exportable PDF" },
  { id: "social_media_pack", name: "Social Media Post Pack", credits: 8, category: "ai", description: "All 4 AIs generate platform-native posts for TikTok, Instagram, Facebook, Pinterest" },
];

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION J — ESTATE SERVICES
// ═══════════════════════════════════════════════════════════════════════════════

export const ESTATE_SERVICES = [
  { id: "estate_essentials", name: "Estate Essentials", baseFee: 2500, preLaunchFee: 1750, commission: 0.25, commissionDisplay: "25%", recommended: false },
  { id: "estate_professional", name: "Estate Professional", baseFee: 5000, preLaunchFee: 3500, commission: 0.30, commissionDisplay: "30%", recommended: true },
  { id: "estate_legacy", name: "Estate Legacy", baseFee: 10000, preLaunchFee: 7000, commission: 0.35, commissionDisplay: "35%", recommended: false },
];

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION K — NEIGHBORHOOD BUNDLE
// Extended with canonical field names alongside legacy field names
// ═══════════════════════════════════════════════════════════════════════════════

export const NEIGHBORHOOD_BUNDLE = {
  name: "Neighborhood Bundle",
  // Canonical field names
  baseFeePerFamily: 399,
  preLaunchFeePerFamily: 239,
  additionalFamilyFee: 149,
  preLaunchAdditionalFee: 89,
  commission: 0.20,
  commissionDisplay: "20%",
  commissionPct: 20,
  minFamilies: 2,
  maxFamilies: 8,
  // Legacy field names (same values, for backward compat)
  price: 399,
  preLaunch: 239,
  additionalFamily: 149,
  preLaunchAdditional: 89,
  perFamily: true,
  includes: [
    "On-site planning with all families",
    "Professional photography (all items)",
    "AI pricing for all items",
    "Unified public sale page",
    "Custom event flyer (digital + print-ready)",
    "Social media graphics",
    "Email campaign to local buyers",
    "Day-of coordination materials",
    "Individual family sales reports",
    "Donation coordination (shared pickup)",
  ],
};

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION L — GARAGE SALE PROMOTION CREDITS
// ═══════════════════════════════════════════════════════════════════════════════

export const PROMOTION_COSTS = {
  featureItemLocalFeed: 1,
  highlightItemLocalMap: 2,
  promoteGarageSaleEvent: 5,
  megaPromotionRegional: 10,
} as const;

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION M — DEMO + ADMIN MODE
// ═══════════════════════════════════════════════════════════════════════════════

export const DEMO_CONFIG = {
  demoModeEnvKey: "DEMO_MODE",
  adminRole: "ADMIN",
  adminBypassTierGates: true,
  adminBypassCreditDeduction: true,
  adminBypassItemLimits: true,
  adminBypassPhotoLimits: true,
  demoModeBadgeText: "Admin Mode",
  demoModeBadgeColor: "#00bcd4",
} as const;

export function isAdminUser(userRole: string | null | undefined): boolean {
  return userRole === DEMO_CONFIG.adminRole;
}

// isDemoMode() consolidated to lib/bot-mode.ts — single source of truth
import { isDemoMode } from "@/lib/bot-mode";
export { isDemoMode };

export function shouldBypassGates(userRole: string | null | undefined): boolean {
  return isAdminUser(userRole) || isDemoMode();
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION N — HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

/** Get display name for a tier integer */
export function getTierName(tier: number): string {
  return TIER_NAMES[tier] ?? "Unknown";
}

/** Get limits for a tier integer */
export function getTierLimits(tier: number): (typeof TIER_LIMITS)[1] {
  return TIER_LIMITS[tier] ?? TIER_LIMITS[TIER.FREE];
}

/** Check if a user has priority bot queue access */
export function hasPriorityQueue(tier: number): boolean {
  return tier >= PRIORITY_QUEUE_TIER;
}

/** Check if a user can access an Intel tab */
export function canAccessIntelTab(tier: number, tabName: string): boolean {
  const minTier = INTEL_TAB_ACCESS[tabName.toLowerCase()];
  return minTier !== undefined ? tier >= minTier : false;
}

/** Check if a user can use Ask Claude */
export function canUseAskClaude(tier: number): boolean {
  return tier >= ASK_CLAUDE_MIN_TIER;
}

/** Check if a user can use a VideoBot sub-tier */
export function canUseVideoBotTier(tier: number, level: "standard" | "pro" | "megabot"): boolean {
  return tier >= VIDEOBOT_TIER_ACCESS[level];
}

/** Check if a tier can use a specific bot */
export function canUseBotOnTier(tier: number, botName: BotName): boolean {
  const access = BOT_ACCESS[tier];
  if (!access) return false;
  return access[botName] ?? false;
}

/** Get credit cost for a bot run */
export function getBotCreditCost(isRerun: boolean, isMegaBot: boolean): number {
  if (isMegaBot) return isRerun ? BOT_CREDIT_COSTS.megaBotReRun : BOT_CREDIT_COSTS.megaBotRun;
  return isRerun ? BOT_CREDIT_COSTS.singleBotReRun : BOT_CREDIT_COSTS.singleBotRun;
}

/** Get an add-on by its ID */
export function getAddonById(id: string): (typeof ADDONS)[0] | null {
  return ADDONS.find((a) => a.id === id) ?? null;
}

/** Get plan definition by tier integer */
export function getPlanByTier(tier: number): (typeof PLANS)[keyof typeof PLANS] | null {
  const map: Record<number, keyof typeof PLANS> = {
    [TIER.FREE]: "FREE",
    [TIER.DIY_SELLER]: "DIY_SELLER",
    [TIER.POWER_SELLER]: "POWER_SELLER",
    [TIER.ESTATE_MANAGER]: "ESTATE_MANAGER",
  };
  const key = map[tier];
  return key ? PLANS[key] : null;
}

/** Calculate processing fee for any amount (rounds to 2 decimal places) */
export const calculateProcessingFee = (subtotal: number, half?: "buyer" | "seller"): number => {
  const rate = half === "buyer" ? PROCESSING_FEE.buyerRate
    : half === "seller" ? PROCESSING_FEE.sellerRate
    : PROCESSING_FEE.rate;
  return Math.round(subtotal * rate * 100) / 100;
};

/** Calculate total with processing fee (buyer pays their half) */
export const calculateTotalWithFee = (
  subtotal: number
): { subtotal: number; processingFee: number; total: number } => {
  const fee = calculateProcessingFee(subtotal, "buyer");
  return {
    subtotal,
    processingFee: fee,
    total: Math.round((subtotal + fee) * 100) / 100,
  };
};

// ═══════════════════════════════════════════════════════════════════════════════
// LEGACY EXPORTS — BACKWARD COMPATIBILITY
// These preserve the old API so locked files and the bridge
// (lib/pricing/constants.ts) continue working without modification.
// Values updated to match canonical pricing above.
// ═══════════════════════════════════════════════════════════════════════════════

// ── Legacy Types ────────────────────────────────────────────────────────────

export interface DigitalTierDef {
  price: number;
  preLaunch: number;
  annualPrice: number;
  preLaunchAnnual: number;
  commission: number;
  commissionPct: number;
  items: number;
  photos: number;
  projects: number;
  megabotUses: number;
  name: string;
  tagline: string;
  features: string[];
  restrictions?: string[];
  popular?: boolean;
}

export interface WhiteGloveDef {
  price: number;
  preLaunch: number;
  commission: number;
  commissionPct: number;
  name: string;
  tagline: string;
  bedrooms: string;
  items: string;
  timeline: string;
  team: string;
  includes: string[];
  notIncluded: string[];
  recommended?: boolean;
}

// ── Legacy TIERS (keyed by lowercase: free/starter/plus/pro) ────────────────
// Names and limits updated to match canonical PLANS and TIER_LIMITS.

export const TIERS: Record<string, DigitalTierDef> = {
  free: {
    price: 0,
    preLaunch: 0,
    annualPrice: 0,
    preLaunchAnnual: 0,
    commission: 0.12,
    commissionPct: 12,
    items: 3,
    photos: 2,
    projects: 0,
    megabotUses: 0,
    name: "Free",
    tagline: "Test the platform at no cost",
    popular: false,
    features: [
      "Basic AI identification",
      "Public store page",
      "Email support",
    ],
    restrictions: [
      "LegacyLoop branding required",
      "No analytics dashboard",
      "No Buyer Finder",
      "No MegaBot",
    ],
  },
  starter: {
    price: 20,
    preLaunch: 10,
    annualPrice: 200,
    preLaunchAnnual: 100,
    commission: 0.08,
    commissionPct: 8,
    items: 25,
    photos: 5,
    projects: 3,
    megabotUses: 999,
    name: "DIY Seller",
    tagline: "Perfect for casual sellers",
    popular: true,
    features: [
      "Enhanced AI pricing",
      "5 core bots included",
      "20 credits/month included",
      "BuyerBot matching",
      "Priority email support",
    ],
  },
  plus: {
    price: 49,
    preLaunch: 25,
    annualPrice: 490,
    preLaunchAnnual: 250,
    commission: 0.05,
    commissionPct: 5,
    items: 100,
    photos: 8,
    projects: 10,
    megabotUses: 999,
    name: "Power Seller",
    tagline: "For active sellers who want AI superpowers",
    popular: false,
    features: [
      "MegaBot (credit-based)",
      "All specialty bots",
      "50 credits/month included",
      "Advanced analytics",
      "Phone support",
    ],
  },
  pro: {
    price: 99,
    preLaunch: 75,
    annualPrice: 990,
    preLaunchAnnual: 750,
    commission: 0.04,
    commissionPct: 4,
    items: 999,
    photos: 15,
    projects: 999,
    megabotUses: 999,
    name: "Estate Manager",
    tagline: "The full suite for serious estate sellers",
    popular: false,
    features: [
      "All bots including CarBot",
      "100 credits/month included",
      "White-label store",
      "Dedicated account manager",
      "API access",
    ],
  },
};

// ── Legacy WHITE_GLOVE ──────────────────────────────────────────────────────

export const WHITE_GLOVE: Record<string, WhiteGloveDef> = {
  essentials: {
    price: 2500,
    preLaunch: 1750,
    commission: 0.25,
    commissionPct: 25,
    name: "Estate Essentials",
    tagline: "Professional help without breaking the bank",
    bedrooms: "1-2",
    items: "100",
    timeline: "2-3 weeks",
    team: "1-2 specialists",
    includes: [
      "On-site consultation (2 hours)",
      "Professional photography (1-3 photos/item)",
      "AI + expert pricing (all items)",
      "Listed on 5 platforms",
      "All buyer communication handled",
      "Shipping coordination",
      "Story capture (10 items)",
      "Donation coordination",
      "Final sales report",
    ],
    notIncluded: [
      "Multiple on-site visits",
      "Video documentation",
      "Expert appraisals",
      "MegaBot pricing",
      "Junk removal service",
      "Property cleaning",
    ],
  },
  professional: {
    price: 5000,
    preLaunch: 3500,
    commission: 0.30,
    commissionPct: 30,
    name: "Estate Professional",
    tagline: "Complete estate management - we handle it all",
    bedrooms: "3-4",
    items: "300",
    timeline: "3-4 weeks",
    team: "2-3 specialists + photographer",
    recommended: true,
    includes: [
      "Everything in Essentials",
      "Full-day assessment (4-6 hours)",
      "Multi-angle photos (5-10/item)",
      "MegaBot pricing on all items",
      "Video walkthroughs",
      "Expert appraisals (10 items)",
      "Story capture (25 items)",
      "Audio recording (5 items)",
      "Listed on 10+ platforms",
      "MegaBuying Bot activation",
      "Multiple on-site visits",
      "Junk removal coordination",
      "Digital legacy archive",
    ],
    notIncluded: [
      "Unlimited appraisals",
      "Video legacy interviews",
      "Printed legacy book",
      "Property staging consultation",
      "Estate attorney coordination",
    ],
  },
  legacy: {
    price: 10000,
    preLaunch: 7000,
    commission: 0.35,
    commissionPct: 35,
    name: "Estate Legacy",
    tagline: "White-glove premium - we handle absolutely everything",
    bedrooms: "5+",
    items: "500+",
    timeline: "4-8 weeks",
    team: "3-5 specialists + dedicated manager",
    includes: [
      "Everything in Professional",
      "Unlimited items, photos, and appraisals",
      "Dedicated project manager (24/7)",
      "Professional videographer",
      "Museum-quality photography",
      "Video legacy interviews",
      "Custom legacy book (printed hardcover)",
      "Legacy archive USB drive",
      "Listed on 50+ platforms",
      "MegaBuying Bot (all items)",
      "Junk removal included",
      "Deep cleaning coordination",
      "Property staging consultation",
      "Estate attorney coordination",
      "Insurance documentation",
      "Weekly progress reports",
      "Property handed back broom-clean",
    ],
    notIncluded: [],
  },
};

// ── Legacy BOT_COSTS ────────────────────────────────────────────────────────

export const BOT_COSTS = {
  standard: { credits: 1, label: "Standard (single AI)" },
  megabot: { credits: 5, label: "MegaBot (4 AIs parallel)" },
  megabot_rerun: { credits: 3, label: "MegaBot Re-Run (refresh)" },
  antique: { credits: 5, label: "Antique Deep Dive (always MegaBot)" },
} as const;

// ── Legacy CREDIT_PACKS (keyed Record format) ──────────────────────────────
// Values updated to match canonical CREDIT_PACK_LIST.

export const CREDIT_PACKS = {
  pack_25: { price: 25, credits: 30, bonus: 0, label: "Starter", perCredit: 0.83 },
  pack_50: { price: 50, credits: 50, bonus: 15, label: "Plus", perCredit: 0.77 },
  pack_100: { price: 100, credits: 100, bonus: 40, label: "Power", perCredit: 0.71 },
  pack_200: { price: 200, credits: 200, bonus: 100, label: "Pro", perCredit: 0.67 },
} as const;

// ── Legacy ADD_ONS (keyed Record format) ────────────────────────────────────

export const ADD_ONS = {
  megabot: { credits: 5, name: "MegaBot Analysis" },
  expert_appraisal: { credits: 15, name: "Expert Appraisal" },
  text_story: { credits: 5, name: "Text Story" },
  audio_story: { credits: 10, name: "Audio Story" },
  video_story: { credits: 15, name: "Video Story" },
  legacy_usb: { credits: 30, name: "Legacy Archive USB" },
  tech_coaching: { credits: 25, name: "Tech Coaching Session" },
  inventory_report: { credits: 30, name: "Inventory Report PDF" },
  priority: { credits: 10, name: "Priority Processing" },
  extra_photos: { credits: 2, name: "Extra Photos (6-10)" },
  shipping_kit: { credits: 10, name: "Shipping Materials Kit" },
  print_book: { credits: 50, name: "Print Story Book" },
  video_ad_standard: { credits: 8, name: "AI Video Ad — Standard" },
  video_ad_pro: { credits: 15, name: "AI Video Ad — Pro" },
  video_ad_mega: { credits: 25, name: "AI Video Ad — MegaBot" },
  video_ad_sale: { credits: 35, name: "Sale Promo Video" },
} as const;

// ── Legacy ESTATE_CONTRACTS ─────────────────────────────────────────────────

export const ESTATE_CONTRACTS = {
  monthly: { price: 299, preLaunch: 149, name: "Monthly Estate Care" },
  quarterly: { price: 799, preLaunch: 399, name: "3-Month Estate Package" },
  biannual: { price: 1999, preLaunch: 999, name: "Full Estate Resolution" },
} as const;

// ── Legacy API_TIERS ────────────────────────────────────────────────────────

export const API_TIERS = {
  developer: { price: 99, name: "Developer", perCall: 0.05 },
  business: { price: 299, name: "Business", perCall: 0.03 },
  enterprise: { price: 999, name: "Enterprise", perCall: 0.01 },
} as const;

// ── Legacy DISCOUNTS ────────────────────────────────────────────────────────

export const DISCOUNTS = {
  heroes: {
    subscriptionDiscount: 0.25,
    whiteGloveDiscount: 0.20,
    commissionDiscount: 0.25,
  },
  preLaunch: {
    discount: 0.50,
    /**
     * spotsRemaining: Default to totalSpots. Override at render time with real DB count:
     *   const paidUsers = await prisma.user.count({ where: { tier: { gte: 2 } } });
     *   const spotsRemaining = Math.max(0, totalSpots - paidUsers);
     * Used by: app/page.tsx, app/dashboard/page.tsx, app/pricing/PricingClient.tsx
     */
    spotsRemaining: 100,
    totalSpots: 100,
  },
  referral: { creditsEach: 50 },
  dataConsent: { credits: 100 },
  signup: { credits: 10 },
  firstSale: { credits: 25 },
} as const;

// ── Legacy Tier Mappings ────────────────────────────────────────────────────

export const TIER_NUMBER_TO_KEY: Record<number, string> = {
  1: "free",
  2: "starter",
  3: "plus",
  4: "pro",
};

export const TIER_KEY_TO_NUMBER: Record<string, number> = {
  free: 1, FREE: 1,
  starter: 2, STARTER: 2,
  plus: 3, PLUS: 3,
  pro: 4, PRO: 4,
};

// ── Legacy Helper Functions ─────────────────────────────────────────────────

export const calculateCommission = (
  saleAmount: number,
  userTier: string,
  isHero: boolean
): {
  saleAmount: number;
  commissionRate: number;
  commissionAmount: number;
  sellerFee: number;
  netEarnings: number;
} => {
  const tierKey = userTier.toLowerCase();
  const tier = TIERS[tierKey];
  if (!tier) throw new Error(`Unknown tier: ${userTier}`);

  const baseRate = tier.commission;
  const effectiveRate = isHero
    ? baseRate * (1 - DISCOUNTS.heroes.commissionDiscount)
    : baseRate;
  const commission = Math.round(saleAmount * effectiveRate * 100) / 100;
  const sellerFee = Math.round(saleAmount * PROCESSING_FEE.sellerRate * 100) / 100;
  const netEarnings = Math.round((saleAmount - commission - sellerFee) * 100) / 100;

  return { saleAmount, commissionRate: effectiveRate, commissionAmount: commission, sellerFee, netEarnings };
};

export const calculateTierPrice = (
  tierKey: string,
  billing: "monthly" | "annual" = "monthly",
  isPreLaunch = false,
  isHero = false
): number => {
  const tier = TIERS[tierKey.toLowerCase()];
  if (!tier) return 0;

  let price: number;
  if (billing === "annual") {
    price = isPreLaunch ? tier.preLaunchAnnual : tier.annualPrice;
  } else {
    price = isPreLaunch ? tier.preLaunch : tier.price;
  }

  if (isHero) {
    price = Math.round(price * (1 - DISCOUNTS.heroes.subscriptionDiscount));
  }

  return price;
};

export const calculateWhiteGlovePrice = (
  tierKey: string,
  isPreLaunch = false,
  isHero = false
): number => {
  const tier = WHITE_GLOVE[tierKey.toLowerCase()];
  if (!tier) return 0;

  let price = isPreLaunch ? tier.preLaunch : tier.price;

  if (isHero) {
    price = Math.round(price * (1 - DISCOUNTS.heroes.whiteGloveDiscount));
  }

  return price;
};

export const calculateNeighborhoodPrice = (
  families: number,
  isPreLaunch = false
): number => {
  const base = isPreLaunch ? NEIGHBORHOOD_BUNDLE.preLaunch : NEIGHBORHOOD_BUNDLE.price;
  const perExtra = isPreLaunch ? NEIGHBORHOOD_BUNDLE.preLaunchAdditional : NEIGHBORHOOD_BUNDLE.additionalFamily;
  const extras = Math.max(0, families - 3);
  return base + extras * perExtra;
};

export const getTierByNumber = (tierNum: number): DigitalTierDef | null => {
  const key = TIER_NUMBER_TO_KEY[tierNum];
  return key ? TIERS[key] : null;
};

export const canUserAccessFeature = (
  tierNum: number,
  feature: string
): boolean => {
  const key = TIER_NUMBER_TO_KEY[tierNum];
  if (!key) return false;
  const tier = TIERS[key];
  if (!tier) return false;

  const checks: Record<string, boolean> = {
    megabot: tier.megabotUses > 0,
    buyerFinder: tierNum >= 2,
    analytics: tierNum >= 3,
    customStorefront: tierNum >= 4,
    storytelling: tierNum >= 3,
    apiAccess: tierNum >= 4,
    projects: tier.projects > 0,
    removeBranding: tierNum >= 2,
  };

  return checks[feature] ?? false;
};

export const annualSavings = (tierKey: string): number => {
  const tier = TIERS[tierKey.toLowerCase()];
  if (!tier) return 0;
  return tier.preLaunch * 12 - tier.preLaunchAnnual;
};
