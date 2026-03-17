export interface ScamResult {
  isScam: boolean;
  confidence: "high" | "medium" | "low";
  patterns: string[];
  warning: string;
}

const PATTERNS: { category: string; keywords: string[]; weight: number }[] = [
  { category: "Payment Scam", keywords: ["cashier's check", "money order", "western union", "wire transfer", "zelle me first", "paypal friends and family"], weight: 3 },
  { category: "Overpayment", keywords: ["send you extra", "overpay", "refund difference", "my assistant will", "shipping agent handles", "movers will pick up"], weight: 3 },
  { category: "Phishing", keywords: ["click this link", "verify your account", "confirm your paypal", "update your info", "log in here"], weight: 2 },
  { category: "Advance Fee", keywords: ["send first", "fee to release", "processing fee required", "customs fee", "unlock funds", "deposit required before"], weight: 3 },
  { category: "Geographic", keywords: ["out of country", "deployed overseas", "international buyer", "shipping agent", "my son abroad"], weight: 1 },
];

export function detectScam(message: string): ScamResult {
  const lower = message.toLowerCase();
  const found: string[] = [];
  let totalWeight = 0;

  for (const group of PATTERNS) {
    for (const kw of group.keywords) {
      if (lower.includes(kw)) {
        found.push(`${group.category}: "${kw}"`);
        totalWeight += group.weight;
      }
    }
  }

  if (totalWeight === 0) return { isScam: false, confidence: "low", patterns: [], warning: "" };

  const confidence: ScamResult["confidence"] = totalWeight >= 6 ? "high" : totalWeight >= 3 ? "medium" : "low";
  const isScam = totalWeight >= 3;

  return {
    isScam,
    confidence,
    patterns: found,
    warning: isScam
      ? "This message contains patterns commonly used in scams. Do not send money, share personal details, or click any links. If unsure, decline this buyer."
      : "Some unusual patterns detected. Proceed with caution.",
  };
}
