export interface CommissionBreakdown {
  soldPrice: number;
  commissionRate: number;
  commissionAmount: number;
  processingFee: number;
  sellerEarnings: number;
  platformRevenue: number;
}

export function calculateCommission(soldPrice: number, tierCommissionRate: number): CommissionBreakdown {
  const commissionAmount = Math.round(soldPrice * tierCommissionRate * 100) / 100;
  const processingFee = Math.round(soldPrice * 0.035 * 100) / 100;
  const sellerEarnings = Math.round((soldPrice - commissionAmount) * 100) / 100;
  const platformRevenue = Math.round((commissionAmount + processingFee) * 100) / 100;
  return { soldPrice, commissionRate: tierCommissionRate, commissionAmount, processingFee, sellerEarnings, platformRevenue };
}
