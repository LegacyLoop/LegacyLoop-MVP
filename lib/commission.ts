/**
 * Commission utility — wraps pricing constants for easy client-side use.
 * Commission is taken from the seller's side. Buyer pays processing fee (3.5%).
 */

import {
  TIERS,
  TIER_NUMBER_TO_KEY,
  PROCESSING_FEE,
  calculateCommission,
} from "@/lib/constants/pricing";

export { calculateCommission, PROCESSING_FEE };

/** Get commission rate for a tier number (1-4). Returns decimal (e.g. 0.08). */
export function getCommissionRate(tierNum: number, isHero = false): number {
  const key = TIER_NUMBER_TO_KEY[tierNum] || "free";
  const tier = TIERS[key];
  if (!tier) return 0.05;
  const rate = tier.commission;
  return isHero ? rate * 0.75 : rate;
}

/** Get commission percentage for display (e.g. 8). */
export function getCommissionPct(tierNum: number, isHero = false): number {
  return Math.round(getCommissionRate(tierNum, isHero) * 100);
}

/** Calculate a full earnings breakdown for a given sale price. */
export function earningsBreakdown(
  salePrice: number,
  tierNum: number,
  isHero = false
) {
  const rate = getCommissionRate(tierNum, isHero);
  const pct = Math.round(rate * 100);
  const commission = Math.round(salePrice * rate * 100) / 100;
  const netEarnings = Math.round((salePrice - commission) * 100) / 100;
  const processingFee =
    Math.round(salePrice * PROCESSING_FEE.rate * 100) / 100;
  const buyerTotal =
    Math.round((salePrice + processingFee) * 100) / 100;

  return {
    salePrice,
    commissionRate: rate,
    commissionPct: pct,
    commission,
    netEarnings,
    processingFee,
    buyerTotal,
  };
}
