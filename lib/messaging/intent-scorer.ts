export interface IntentResult {
  score: number;
  label: "hot" | "warm" | "cold" | "ghost";
  confidence: "high" | "medium" | "low";
  signals: string[];
  recommendation: string;
}

interface BuyerProfile {
  messageCount: number;
  avgResponseMinutes: number | null;
  offerHistory: { amount: number; round: number; outcome?: string }[];
  firstContactAt: Date | null;
  lastMessageAt: Date | null;
  questionCount: number;
}

export function scoreBuyerIntent(profile: BuyerProfile, sentimentScore: number): IntentResult {
  let score = 40;
  const signals: string[] = [];
  const now = Date.now();
  const hoursSinceLastMessage = profile.lastMessageAt ? (now - profile.lastMessageAt.getTime()) / (1000 * 60 * 60) : 999;

  // Ghost detection
  if (hoursSinceLastMessage > 48 && profile.messageCount >= 2) {
    return { score: 10, label: "ghost", confidence: "high", signals: ["No reply in 48+ hours after prior engagement"], recommendation: "Send a warm re-engagement message to revive interest." };
  }

  // Message frequency
  if (profile.messageCount >= 5) { score += 20; signals.push("5+ messages — highly engaged"); }
  else if (profile.messageCount >= 3) { score += 10; signals.push("3+ messages — active conversation"); }

  // Offer behavior
  if (profile.offerHistory.length > 0) { score += 20; signals.push("Made an offer — serious interest"); }
  if (profile.offerHistory.length >= 2) {
    const prices = profile.offerHistory.map(o => o.amount);
    if (prices[prices.length - 1] > prices[0]) { score += 15; signals.push("Offer climbing — increasing commitment"); }
    else if (prices[prices.length - 1] === prices[0] && prices.length >= 2) { score -= 10; signals.push("Offer stuck at same amount"); }
  }

  // Response time
  if (profile.avgResponseMinutes != null) {
    if (profile.avgResponseMinutes < 60) { score += 15; signals.push("Fast responder (<1hr)"); }
    else if (profile.avgResponseMinutes < 360) { score += 8; signals.push("Moderate response time"); }
    else if (profile.avgResponseMinutes > 1440) { score -= 10; signals.push("Slow responder (>24hrs)"); }
  }

  // Questions = research = interest
  if (profile.questionCount >= 3) { score += 10; signals.push("3+ questions asked — doing research"); }

  // Sentiment boost
  if (sentimentScore >= 70) { score += 10; signals.push("Positive sentiment in messages"); }

  score = Math.max(0, Math.min(100, score));
  const label: IntentResult["label"] = score >= 70 ? "hot" : score >= 40 ? "warm" : "cold";
  const confidence: IntentResult["confidence"] = signals.length >= 4 ? "high" : signals.length >= 2 ? "medium" : "low";

  const recommendations: Record<string, string> = {
    hot: "Strike now — this buyer is ready to close. Send your best offer.",
    warm: "Maintain engagement. Answer questions quickly and reinforce value.",
    cold: "Low priority. Focus energy on hotter leads first.",
  };

  return { score, label, confidence, signals, recommendation: recommendations[label] };
}
