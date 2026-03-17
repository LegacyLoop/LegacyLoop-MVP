export interface NegotiationResult {
  recommendation: "accept" | "counter" | "hold" | "decline";
  counterPrice: number | null;
  confidence: "strong" | "fair" | "flexible";
  reasoning: string;
  dealProbability: number;
  suggestedMessage: string;
}

interface NegotiationContext {
  askingPrice: number;
  currentOffer: number;
  floorPrice: number | null;
  round: number;
  intentScore: number;
  daysListed: number;
  tone: string;
}

export function calculateOptimalCounter(ctx: NegotiationContext): NegotiationResult {
  const { askingPrice, currentOffer, floorPrice, round, intentScore, daysListed, tone } = ctx;
  const gapPct = askingPrice > 0 ? (askingPrice - currentOffer) / askingPrice : 1;

  let recommendation: NegotiationResult["recommendation"] = "counter";
  let counterPrice: number | null = null;
  let confidence: NegotiationResult["confidence"] = "fair";
  let reasoning = "";

  if (gapPct < 0.05) {
    recommendation = "accept";
    reasoning = "Within 5% of asking — close it now.";
    confidence = "strong";
  } else if (gapPct < 0.15 && round >= 2) {
    recommendation = "counter";
    counterPrice = Math.round(askingPrice * 0.97);
    reasoning = "Close gap — make a near-final counter.";
    confidence = "strong";
  } else if (gapPct < 0.25) {
    recommendation = "counter";
    counterPrice = Math.round(askingPrice * 0.93);
    reasoning = "Moderate gap — counter with room to close.";
  } else if (gapPct > 0.40 && round === 1) {
    recommendation = "hold";
    counterPrice = Math.round(askingPrice * 0.95);
    reasoning = "First offer too low — hold firm.";
  } else if (gapPct > 0.50 && intentScore < 30) {
    recommendation = "decline";
    reasoning = "Low intent + lowball — not worth pursuing.";
  } else {
    counterPrice = Math.round(currentOffer + (askingPrice - currentOffer) * 0.5);
    reasoning = "Split the difference and keep momentum.";
  }

  // Floor price protection
  if (counterPrice != null && floorPrice != null && counterPrice < floorPrice) {
    counterPrice = Math.round(floorPrice);
    confidence = "flexible";
    reasoning += " (Adjusted to floor price.)";
  }

  // Deal probability
  let prob = 50 + intentScore * 0.3 - gapPct * 100 * 0.4 + round * 5;
  if (daysListed > 30) prob += 5; // longer listed = more motivated
  prob = Math.max(5, Math.min(95, Math.round(prob)));

  // Build suggested message
  let msg = "";
  if (recommendation === "accept") {
    msg = tone === "friendly" ? "That works for me! Let's do it." : "I accept your offer. Let's proceed.";
  } else if (recommendation === "decline") {
    msg = "I appreciate the offer, but it's too far from what I'm looking for. Best of luck!";
  } else if (counterPrice) {
    msg = tone === "friendly"
      ? `Thanks for the offer! Would you be able to do $${counterPrice}? I think that's fair for both of us.`
      : `Thank you for your interest. I'd like to counter at $${counterPrice}. This reflects the item's condition and market value.`;
  } else {
    msg = "I appreciate your offer. Let me think about it and get back to you.";
  }

  return { recommendation, counterPrice, confidence, reasoning, dealProbability: prob, suggestedMessage: msg };
}
