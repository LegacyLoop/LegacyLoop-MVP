export interface ProRateResult {
  daysInCycle: number;
  daysUsed: number;
  daysRemaining: number;
  dailyRate: number;
  creditForUnused: number;
  cashRefundAmount: number;
  squareFeeAmount: number;
  upgradeCharge: number;
  creditsEquivalent: number;
}

export function calculateProRate(currentPlanPrice: number, billingStartDate: Date, newPlanPrice?: number, billingEndDate?: Date): ProRateResult {
  const now = new Date();
  const msPerDay = 24 * 60 * 60 * 1000;
  const end = billingEndDate ?? new Date(billingStartDate.getTime() + 30 * msPerDay);
  const daysInCycle = Math.max(1, Math.round((end.getTime() - billingStartDate.getTime()) / msPerDay));
  const daysUsed = Math.min(Math.max(0, Math.round((now.getTime() - billingStartDate.getTime()) / msPerDay)), daysInCycle);
  const daysRemaining = Math.max(daysInCycle - daysUsed, 0);
  const dailyRate = Math.round((currentPlanPrice / daysInCycle) * 100) / 100;
  const creditForUnused = Math.round(dailyRate * daysRemaining * 100) / 100;
  // No seller processing fee deducted — the 3.5% buyer fee is irrelevant to subscription refunds
  const squareFeeAmount = 0;
  const cashRefundAmount = creditForUnused;
  const upgradeCharge = newPlanPrice ? Math.max(Math.round((newPlanPrice - creditForUnused) * 100) / 100, 0) : 0;
  const creditsEquivalent = Math.round(creditForUnused * 10);

  return { daysInCycle, daysUsed, daysRemaining, dailyRate, creditForUnused, cashRefundAmount, squareFeeAmount, upgradeCharge, creditsEquivalent };
}
