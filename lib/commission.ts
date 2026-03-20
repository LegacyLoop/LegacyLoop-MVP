/**
 * Commission utility — wraps pricing constants for easy client-side use.
 * Commission is taken from the seller's side. Processing fee (3.5%) split 50/50.
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
  const sellerFee = Math.round(salePrice * PROCESSING_FEE.sellerRate * 100) / 100;
  const buyerFee = Math.round(salePrice * PROCESSING_FEE.buyerRate * 100) / 100;
  const processingFee = Math.round((sellerFee + buyerFee) * 100) / 100;
  const netEarnings = Math.round((salePrice - commission - sellerFee) * 100) / 100;
  const buyerTotal = Math.round((salePrice + buyerFee) * 100) / 100;

  return {
    salePrice,
    commissionRate: rate,
    commissionPct: pct,
    commission,
    sellerFee,
    buyerFee,
    netEarnings,
    processingFee,
    buyerTotal,
  };
}
