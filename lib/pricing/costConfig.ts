/**
 * API cost tracking for VideoBot tiers.
 * Used for internal margin analysis — NOT exposed to users.
 */

export const API_COSTS_PER_RUN = {
  standard: {
    openai_tts: 0.015, // ~500 chars at $15/1M
    openai_script: 0.08, // gpt-4o-mini ~2K tokens
    ffmpeg: 0.00, // local processing
    total: 0.095,
  },
  pro: {
    elevenlabs_tts: 0.30, // ~500 chars at ElevenLabs rates
    openai_script: 0.08,
    apify_video: 1.50, // AI video generation actor
    apify_intel: 0.50, // 4 intelligence scrapers
    total: 2.38,
  },
  mega: {
    elevenlabs_tts: 0.45, // multilingual model, longer script
    openai_script_4x: 0.32, // 4 AI agents for consensus
    apify_video: 2.00, // premium AI video gen
    apify_intel: 0.75, // full intelligence suite
    apify_music: 0.50, // custom background music
    total: 4.02,
  },
  sale: {
    elevenlabs_tts: 0.60, // longer multi-item narration
    openai_script_4x: 0.40,
    apify_video: 3.00,
    apify_intel: 1.00,
    apify_music: 0.75,
    total: 5.75,
  },
} as const;

export const REVENUE_PER_CREDIT = {
  retailPrice: 0.71, // $25 / 35 credits (starter pack)
  bulkPrice: 0.50, // $100 / 200 credits (power pack)
  bestPrice: 0.375, // custom $500+ bulk rate
} as const;

export const TIER_ECONOMICS = {
  standard: {
    credits: 8,
    apiCost: API_COSTS_PER_RUN.standard.total,
    revenueAtRetail: 8 * REVENUE_PER_CREDIT.retailPrice,
    revenueAtBulk: 8 * REVENUE_PER_CREDIT.bulkPrice,
    marginAtRetail: 8 * REVENUE_PER_CREDIT.retailPrice - API_COSTS_PER_RUN.standard.total,
    marginAtBulk: 8 * REVENUE_PER_CREDIT.bulkPrice - API_COSTS_PER_RUN.standard.total,
  },
  pro: {
    credits: 15,
    apiCost: API_COSTS_PER_RUN.pro.total,
    revenueAtRetail: 15 * REVENUE_PER_CREDIT.retailPrice,
    revenueAtBulk: 15 * REVENUE_PER_CREDIT.bulkPrice,
    marginAtRetail: 15 * REVENUE_PER_CREDIT.retailPrice - API_COSTS_PER_RUN.pro.total,
    marginAtBulk: 15 * REVENUE_PER_CREDIT.bulkPrice - API_COSTS_PER_RUN.pro.total,
  },
  mega: {
    credits: 25,
    apiCost: API_COSTS_PER_RUN.mega.total,
    revenueAtRetail: 25 * REVENUE_PER_CREDIT.retailPrice,
    revenueAtBulk: 25 * REVENUE_PER_CREDIT.bulkPrice,
    marginAtRetail: 25 * REVENUE_PER_CREDIT.retailPrice - API_COSTS_PER_RUN.mega.total,
    marginAtBulk: 25 * REVENUE_PER_CREDIT.bulkPrice - API_COSTS_PER_RUN.mega.total,
  },
  sale: {
    credits: 35,
    apiCost: API_COSTS_PER_RUN.sale.total,
    revenueAtRetail: 35 * REVENUE_PER_CREDIT.retailPrice,
    revenueAtBulk: 35 * REVENUE_PER_CREDIT.bulkPrice,
    marginAtRetail: 35 * REVENUE_PER_CREDIT.retailPrice - API_COSTS_PER_RUN.sale.total,
    marginAtBulk: 35 * REVENUE_PER_CREDIT.bulkPrice - API_COSTS_PER_RUN.sale.total,
  },
} as const;
