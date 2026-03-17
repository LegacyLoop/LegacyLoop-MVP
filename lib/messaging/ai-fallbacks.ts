export interface FallbackSuggestion { label: string; message: string }

export function getFallback(mode: string, context: { askingPrice?: number; currentOffer?: number; itemTitle?: string; tone?: string }): any {
  const { askingPrice = 0, currentOffer = 0, itemTitle = "this item", tone = "professional" } = context;
  const mid = askingPrice && currentOffer ? Math.round((askingPrice + currentOffer) / 2) : askingPrice;

  switch (mode) {
    case "smart_reply":
      return { suggestions: [
        { label: "Friendly", message: "Thanks for reaching out! I'd love to work something out with you." },
        { label: "Professional", message: "Thank you for your interest. I'm open to reasonable offers on this item." },
        { label: "Firm", message: "I appreciate the offer. My price reflects the item's value and condition." },
      ]};
    case "negotiate":
      return { recommendation: "counter", counterPrice: mid, reasoning: "Split the difference to keep momentum.", dealProbability: 50, suggestedMessage: `Thank you for the offer. I'd like to counter at $${mid} — does that work for you?` };
    case "counter_price":
      return { counterPrice: mid, confidence: "fair", reasoning: "Midpoint counter.", suggestedMessage: `I can meet you at $${mid}. Let me know!` };
    case "ghost_reengage":
      return { message: `Hi! Just checking in — still interested in ${itemTitle}? Happy to answer any questions.`, tone: "warm" };
    case "professional":
      return { original: "", polished: "Thank you for your message. I'd be happy to discuss this further at your convenience." };
    case "tone_adjust":
      return { original: "", adjusted: "Thank you for your interest. I look forward to hearing from you.", tone: tone };
    case "summarize":
      return { summary: "Conversation in progress. Buyer has shown interest.", keyFacts: ["Active conversation"], nextAction: "Continue engaging with the buyer." };
    case "translate":
      return { original: "", translated: "(Translation unavailable — AI timeout)", suggestedReply: "", detectedLanguage: "unknown" };
    default:
      return { message: "Thank you for your message. I'll get back to you shortly." };
  }
}
