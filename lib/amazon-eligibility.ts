/**
 * Amazon Eligibility Classifier
 * Determines whether an item is likely available on Amazon before
 * spending an API call on Rainforest.
 */

const AMAZON_ELIGIBLE_CATEGORIES = new Set([
  "electronics", "kitchenware", "tools", "toys", "books", "sports",
  "clothing", "musical instruments", "games", "small appliances",
  "office", "pet supplies", "health", "beauty", "baby", "automotive parts",
]);

const AMAZON_INELIGIBLE_CATEGORIES = new Set([
  "vehicles", "vehicle parts", "outdoor equipment", "furniture",
  "art", "fine art", "real estate",
]);

const INELIGIBLE_KEYWORDS = /\b(antique|vintage|estate|handmade|hand[\s-]?crafted|one[\s-]?of[\s-]?a[\s-]?kind|custom[\s-]?made|artisan|bespoke|circa\s+\d{4}|pre[\s-]?war|victorian|edwardian|art\s+deco|colonial|mid[\s-]?century|primitive|heirloom)\b/i;

const ELIGIBLE_KEYWORDS = /\b(brand\s+new|factory\s+sealed|in\s+box|NIB|NWT|new\s+with\s+tags|retail|UPC|barcode|SKU|model\s+#|model\s+number)\b/i;

export interface AmazonEligibility {
  eligible: boolean;
  reason: string;
  confidence: number;
}

export function isAmazonEligible(
  category: string | null | undefined,
  subcategory: string | null | undefined,
  title: string | null | undefined,
  isAntique?: boolean | null,
  estimatedAge?: number | null
): AmazonEligibility {
  const cat = (category || "").toLowerCase().trim();
  const sub = (subcategory || "").toLowerCase().trim();

  if (isAntique === true || (estimatedAge != null && estimatedAge >= 30)) {
    return { eligible: false, reason: `Antique/vintage item (${estimatedAge ?? "50+"}yr old) — not sold on Amazon`, confidence: 0.95 };
  }
  if (AMAZON_INELIGIBLE_CATEGORIES.has(cat)) {
    return { eligible: false, reason: `Category "${category}" not sold on Amazon`, confidence: 0.90 };
  }
  if (INELIGIBLE_KEYWORDS.test(title || "")) {
    const match = (title || "").match(INELIGIBLE_KEYWORDS);
    return { eligible: false, reason: `Title contains "${match?.[0]}" — unlikely on Amazon`, confidence: 0.80 };
  }
  if (AMAZON_ELIGIBLE_CATEGORIES.has(cat)) {
    return { eligible: true, reason: `Category "${category}" commonly sold on Amazon`, confidence: 0.85 };
  }
  if (ELIGIBLE_KEYWORDS.test(title || "")) {
    return { eligible: true, reason: `Title suggests mass-produced retail product`, confidence: 0.75 };
  }
  if (cat.includes("collectible") || cat.includes("memorabilia")) {
    return { eligible: true, reason: `Collectibles sometimes found on Amazon — worth checking`, confidence: 0.50 };
  }
  if (cat.includes("jewelry")) {
    if (sub.includes("fine") || sub.includes("gold") || sub.includes("diamond") || sub.includes("estate")) {
      return { eligible: false, reason: `Fine/estate jewelry not sold on Amazon`, confidence: 0.80 };
    }
    return { eligible: true, reason: `Fashion/costume jewelry may be on Amazon`, confidence: 0.55 };
  }
  return { eligible: true, reason: `Category "${category || "unknown"}" — checking Amazon as fallback`, confidence: 0.40 };
}
