export function calculateProratedRefund(
  price: number,
  periodStart: Date,
  periodEnd: Date,
  changeDate: Date
) {
  const totalMs = periodEnd.getTime() - periodStart.getTime();
  const usedMs = changeDate.getTime() - periodStart.getTime();
  const remainingMs = periodEnd.getTime() - changeDate.getTime();

  const totalDays = Math.round(totalMs / (1000 * 60 * 60 * 24));
  const daysUsed = Math.max(0, Math.round(usedMs / (1000 * 60 * 60 * 24)));
  const daysRemaining = Math.max(0, Math.round(remainingMs / (1000 * 60 * 60 * 24)));

  const dailyRate = totalDays > 0 ? price / totalDays : 0;
  const refundAmount = parseFloat((dailyRate * daysRemaining).toFixed(2));
  const refundPct = price > 0 ? Math.round((refundAmount / price) * 100) : 0;

  return { amountPaid: price, daysUsed, daysRemaining, dailyRate: parseFloat(dailyRate.toFixed(4)), refundAmount, refundPct };
}

export function calculateUpgradeCredit(
  currentPrice: number,
  periodStart: Date,
  periodEnd: Date,
  newTierPrice: number
) {
  const { refundAmount } = calculateProratedRefund(currentPrice, periodStart, periodEnd, new Date());
  const creditFromCurrent = refundAmount;
  const amountDue = parseFloat(Math.max(0, newTierPrice - creditFromCurrent).toFixed(2));

  return { creditFromCurrent: parseFloat(creditFromCurrent.toFixed(2)), newTierPrice, amountDue };
}
