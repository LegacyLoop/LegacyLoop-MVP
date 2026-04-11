/**
 * Stripe Product + Price Configuration for LegacyLoop
 *
 * Prices are derived from lib/constants/pricing.ts (single source of truth).
 * Stripe Prices are created dynamically on first use via getOrCreateStripePrice().
 * Works in both test and live environments — no hardcoded Price IDs.
 *
 * CMD-MEMBERSHIP-PRORATION-COMPLETE (consolidated from CMD-STRIPE-SUBSCRIPTION-AUTO-RENEW)
 */

import { stripe, isConfigured } from "./stripe";
import { TIERS, calculateTierPrice } from "./constants/pricing";

// In-memory cache of created Stripe Price IDs (tier:period → price_id)
const priceCache = new Map<string, string>();

/**
 * Get or create a Stripe Price for a tier + billing period.
 * Uses calculateTierPrice() from pricing.ts as the single source of truth.
 * Creates both the Product and recurring Price in Stripe if they don't exist.
 */
export async function getOrCreateStripePrice(
  tierKey: string,
  billingPeriod: "monthly" | "annual",
): Promise<string | null> {
  if (!stripe || !isConfigured) return null;

  const cacheKey = `${tierKey}:${billingPeriod}`;
  const cached = priceCache.get(cacheKey);
  if (cached) return cached;

  const tier = TIERS[tierKey.toLowerCase()];
  if (!tier) return null;

  // Use calculateTierPrice — respects PRE_LAUNCH env var automatically
  const isPreLaunch = process.env.PRE_LAUNCH !== "false";
  const amount = calculateTierPrice(tierKey.toLowerCase(), billingPeriod, isPreLaunch, false);
  if (amount <= 0) return null;

  try {
    // Search for existing product by metadata
    const products = await stripe.products.search({
      query: `metadata["legacyloop_tier"]:"${tierKey.toLowerCase()}"`,
    });

    let productId: string;

    if (products.data.length > 0) {
      productId = products.data[0].id;
    } else {
      const product = await stripe.products.create({
        name: `LegacyLoop ${tier.name}`,
        metadata: { legacyloop_tier: tierKey.toLowerCase() },
      });
      productId = product.id;
    }

    // Search for existing price on this product with matching interval + amount
    const interval = billingPeriod === "annual" ? "year" : "month";
    const prices = await stripe.prices.list({
      product: productId,
      type: "recurring",
      active: true,
    });

    const matchingPrice = prices.data.find(
      (p) => p.recurring?.interval === interval && p.unit_amount === Math.round(amount * 100),
    );

    if (matchingPrice) {
      priceCache.set(cacheKey, matchingPrice.id);
      return matchingPrice.id;
    }

    // Create new price
    const price = await stripe.prices.create({
      product: productId,
      unit_amount: Math.round(amount * 100),
      currency: "usd",
      recurring: { interval },
      metadata: { legacyloop_tier: tierKey.toLowerCase(), billing_period: billingPeriod, pre_launch: String(isPreLaunch) },
    });

    priceCache.set(cacheKey, price.id);
    return price.id;
  } catch (err) {
    console.error("[stripe-products] getOrCreateStripePrice error:", err);
    return null;
  }
}
