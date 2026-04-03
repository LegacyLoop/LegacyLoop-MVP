/**
 * Feature Flags — Progressive Rollout
 * Check env vars to determine which features are live vs demo mode.
 */
export const FEATURES = {
  LIVE_AI: !!process.env.OPENAI_API_KEY,
  LIVE_PAYMENTS: !!process.env.SQUARE_ACCESS_TOKEN,
  LIVE_SHIPPING: !!process.env.SHIPPO_API_KEY,
  LIVE_EMAIL: !!process.env.SENDGRID_API_KEY,
  LIVE_SMS: !!process.env.TWILIO_AUTH_TOKEN,
  DEMO_MODE: process.env.DEMO_MODE === "true",
  /** Pre-launch pricing/messaging. Set PRE_LAUNCH=false in env to transition to regular pricing. */
  PRE_LAUNCH: process.env.PRE_LAUNCH !== "false",
} as const;

export type FeatureKey = keyof typeof FEATURES;

/** Check if a feature is enabled */
export function isFeatureEnabled(key: FeatureKey): boolean {
  return FEATURES[key];
}
