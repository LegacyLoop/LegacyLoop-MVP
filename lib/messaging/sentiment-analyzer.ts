export interface SentimentResult {
  score: number;
  label: "positive" | "neutral" | "frustrated" | "red_flag";
  signals: string[];
  urgency: "high" | "medium" | "low";
}

const POSITIVE = ["interested", "love", "perfect", "definitely", "ready", "when can", "still available", "how soon", "great", "excited", "want", "need", "asap"];
const NEGATIVE = ["too expensive", "ridiculous", "scam", "waste", "terrible", "awful", "never again", "rip off", "overpriced"];
const FRUSTRATED = ["still no reply", "waiting", "no response", "days ago", "week ago", "hello?", "anyone there"];
const RED_FLAGS = ["western union", "cashier's check", "overpay", "shipping agent", "out of country", "send money first", "wire transfer", "money order", "inheritance", "lottery", "prize", "won a"];
const URGENT = ["today", "tonight", "asap", "right now", "birthday", "gift", "leaving town", "moving", "urgent", "immediately"];

export function analyzeSentiment(message: string): SentimentResult {
  const lower = message.toLowerCase();
  const signals: string[] = [];
  let score = 50;

  // Red flag check first
  for (const flag of RED_FLAGS) {
    if (lower.includes(flag)) {
      return { score: 0, label: "red_flag", signals: [`Red flag: "${flag}"`], urgency: "high" };
    }
  }

  for (const p of POSITIVE) { if (lower.includes(p)) { score += 8; signals.push(`Positive: "${p}"`); } }
  for (const n of NEGATIVE) { if (lower.includes(n)) { score -= 12; signals.push(`Negative: "${n}"`); } }
  for (const f of FRUSTRATED) { if (lower.includes(f)) { score -= 10; signals.push(`Frustrated: "${f}"`); } }

  if ((lower.match(/\?\?\?/g) || []).length > 0) { score -= 8; signals.push("Multiple question marks"); }
  if ((lower.match(/!!!/g) || []).length > 0) { score -= 5; signals.push("Exclamation emphasis"); }

  score = Math.max(0, Math.min(100, score));
  const label: SentimentResult["label"] = score >= 65 ? "positive" : score >= 35 ? "neutral" : "frustrated";

  let urgency: SentimentResult["urgency"] = "low";
  for (const u of URGENT) { if (lower.includes(u)) { urgency = "high"; signals.push(`Urgent: "${u}"`); break; } }
  if (urgency === "low" && score >= 60) urgency = "medium";

  return { score, label, signals, urgency };
}
