export interface CommissionBreakdown {
  soldPrice: number;
  commissionRate: number;
  commissionAmount: number;
  processingFee: number;
  sellerFee: number;
  buyerFee: number;
  sellerEarnings: number;
  platformRevenue: number;
}

export function calculateCommission(soldPrice: number, tierCommissionRate: number): CommissionBreakdown {
  const commissionAmount = Math.round(soldPrice * tierCommissionRate * 100) / 100;
  const sellerFee = Math.round(soldPrice * 0.0175 * 100) / 100;
  const buyerFee = Math.round(soldPrice * 0.0175 * 100) / 100;
  const processingFee = Math.round((sellerFee + buyerFee) * 100) / 100;
  const sellerEarnings = Math.round((soldPrice - commissionAmount - sellerFee) * 100) / 100;
  const platformRevenue = Math.round((commissionAmount + processingFee) * 100) / 100;
  return { soldPrice, commissionRate: tierCommissionRate, commissionAmount, processingFee, sellerFee, buyerFee, sellerEarnings, platformRevenue };
}
