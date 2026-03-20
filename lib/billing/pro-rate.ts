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

export function calculateProRate(currentPlanPrice: number, billingStartDate: Date, newPlanPrice?: number): ProRateResult {
  const now = new Date();
  const msPerDay = 24 * 60 * 60 * 1000;
  const daysInCycle = 30;
  const daysUsed = Math.min(Math.floor((now.getTime() - billingStartDate.getTime()) / msPerDay), daysInCycle);
  const daysRemaining = Math.max(daysInCycle - daysUsed, 0);
  const dailyRate = Math.round((currentPlanPrice / daysInCycle) * 100) / 100;
  const creditForUnused = Math.round(dailyRate * daysRemaining * 100) / 100;
  const squareFeeAmount = Math.round(creditForUnused * 0.0175 * 100) / 100;
  const cashRefundAmount = Math.round((creditForUnused - squareFeeAmount) * 100) / 100;
  const upgradeCharge = newPlanPrice ? Math.max(Math.round((newPlanPrice - creditForUnused) * 100) / 100, 0) : 0;
  const creditsEquivalent = Math.round(creditForUnused * 10);

  return { daysInCycle, daysUsed, daysRemaining, dailyRate, creditForUnused, cashRefundAmount, squareFeeAmount, upgradeCharge, creditsEquivalent };
}
