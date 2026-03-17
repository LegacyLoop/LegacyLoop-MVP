// ─── Collectibles Detection Engine ────────────────────────────────────────
// Mirrors lib/antique-detect.ts but for collectible items:
// sports cards, trading cards, vinyl, coins, comics, vintage toys, memorabilia

export interface CollectibleDetectionResult {
  isCollectible: boolean;
  score: number;
  confidence: number;
  category: string | null;
  subcategory: string | null;
  signals: string[];
  potentialValue: "Very High" | "High" | "Medium" | "Low" | "Unknown";
}

export function detectCollectible(aiData: any): CollectibleDetectionResult {
  let score = 0;
  const signals: string[] = [];
  let category: string | null = null;
  let subcategory: string | null = null;

  if (!aiData) return { isCollectible: false, score: 0, confidence: 0, category: null, subcategory: null, signals: [], potentialValue: "Unknown" };

  // Trust AI explicit flag
  if (aiData.is_collectible === true) {
    score += 20;
    signals.push("AI identified as collectible");
  }

  const name = (aiData.item_name || aiData.identification?.item_name || "").toLowerCase();
  const cat = (aiData.category || aiData.identification?.category || "").toLowerCase();
  const desc = (aiData.executive_summary || aiData.description || "").toLowerCase();
  const material = (aiData.material || "").toLowerCase();
  const keywords = Array.isArray(aiData.keywords) ? aiData.keywords.join(" ").toLowerCase() : "";
  const combined = `${name} ${cat} ${desc} ${material} ${keywords}`;

  // ── SPORTS CARDS ──
  const sportsCardSignals = ["baseball card", "football card", "basketball card", "hockey card", "sports card", "topps", "bowman", "upper deck", "panini", "fleer", "donruss", "rookie card", "graded card", "psa ", "bgs ", "sgc ", "beckett"];
  for (const s of sportsCardSignals) {
    if (combined.includes(s)) { score += 15; signals.push(`Sports card: ${s}`); category = "Sports Cards"; break; }
  }

  // ── TRADING CARDS ──
  const tradingCardSignals = ["pokemon", "pok\u00e9mon", "magic the gathering", "mtg ", "yu-gi-oh", "yugioh", "trading card", "tcg", "booster pack", "holographic", "first edition", "shadowless", "charizard", "black lotus"];
  for (const s of tradingCardSignals) {
    if (combined.includes(s)) { score += 15; signals.push(`Trading card: ${s}`); category = category || "Trading Cards"; break; }
  }

  // ── VINYL RECORDS ──
  const vinylSignals = ["vinyl record", "vinyl lp", "vinyl album", "33 rpm", "45 rpm", "first pressing", "original pressing", "limited press", "colored vinyl", "picture disc", "gatefold"];
  for (const s of vinylSignals) {
    if (combined.includes(s)) { score += 12; signals.push(`Vinyl: ${s}`); category = category || "Vinyl Records"; break; }
  }

  // ── COINS & CURRENCY ──
  const coinSignals = ["silver dollar", "gold coin", "morgan dollar", "peace dollar", "wheat penny", "buffalo nickel", "proof set", "mint state", "ms-", "numismatic", "banknote", "silver eagle", "krugerrand"];
  for (const s of coinSignals) {
    if (combined.includes(s)) { score += 12; signals.push(`Coin: ${s}`); category = category || "Coins & Currency"; break; }
  }
  // "coin" alone is too generic — only match if category-relevant
  if (!category && combined.includes("coin") && (combined.includes("collect") || combined.includes("rare") || combined.includes("mint"))) {
    score += 8; signals.push("Coin (with collector context)"); category = "Coins & Currency";
  }

  // ── COMICS ──
  const comicSignals = ["comic book", "comic issue", "marvel comic", "dc comic", "first appearance", "key issue", "cgc graded", "action comics", "amazing spider", "detective comics", "x-men", "graphic novel"];
  for (const s of comicSignals) {
    if (combined.includes(s)) { score += 12; signals.push(`Comic: ${s}`); category = category || "Comics"; break; }
  }

  // ── VINTAGE TOYS ──
  const toySignals = ["vintage toy", "action figure", "hot wheels", "matchbox car", "star wars figure", "gi joe", "transformers", "lego set", "beanie bab", "cabbage patch", "barbie vintage", "tin toy", "cast iron toy", "mint in box", " mib ", " nib ", "sealed"];
  for (const s of toySignals) {
    if (combined.includes(s)) { score += 10; signals.push(`Vintage toy: ${s}`); category = category || "Vintage Toys"; break; }
  }

  // ── MEMORABILIA ──
  const memorabiliaSignals = ["autograph", "signed by", "authenticated", "game worn", "game used", "championship ring", "concert poster", "movie prop", "screen used", "memorabilia", "jsa ", "psa authenticated"];
  for (const s of memorabiliaSignals) {
    if (combined.includes(s)) { score += 10; signals.push(`Memorabilia: ${s}`); category = category || "Memorabilia"; break; }
  }

  // ── LIMITED EDITION ──
  const limitedSignals = ["limited edition", "numbered edition", "/500", "/1000", "/100", "special edition", "collector edition", "exclusive release", "one of ", "hand numbered", "artist proof", "proof coin"];
  for (const s of limitedSignals) {
    if (combined.includes(s)) { score += 8; signals.push(`Limited edition: ${s}`); category = category || "Limited Edition"; break; }
  }

  // ── GRADING (universal boost) ──
  const gradingSignals = ["psa 10", "psa 9", "bgs 9.5", "gem mint", "cgc 9.8", "ms-70", "ms-69", "proof-70", "professionally graded"];
  for (const s of gradingSignals) {
    if (combined.includes(s)) { score += 15; signals.push(`Graded: ${s}`); break; }
  }

  // ── NEGATIVE signals ──
  const negativeSignals = ["common reprint", "mass produced", "reproduction", "counterfeit", "fake"];
  for (const s of negativeSignals) {
    if (combined.includes(s)) { score -= 10; signals.push(`Negative: ${s}`); }
  }

  // Subcategory detection
  if (category === "Sports Cards") {
    if (combined.includes("baseball")) subcategory = "Baseball Cards";
    else if (combined.includes("football")) subcategory = "Football Cards";
    else if (combined.includes("basketball")) subcategory = "Basketball Cards";
    else if (combined.includes("hockey")) subcategory = "Hockey Cards";
  } else if (category === "Trading Cards") {
    if (combined.includes("pokemon") || combined.includes("pok\u00e9mon")) subcategory = "Pokemon";
    else if (combined.includes("magic") || combined.includes("mtg")) subcategory = "Magic: The Gathering";
    else if (combined.includes("yu-gi-oh") || combined.includes("yugioh")) subcategory = "Yu-Gi-Oh!";
  } else if (category === "Comics") {
    if (combined.includes("marvel")) subcategory = "Marvel Comics";
    else if (combined.includes("dc ")) subcategory = "DC Comics";
  }

  // Potential value
  let potentialValue: CollectibleDetectionResult["potentialValue"] = "Unknown";
  if (score >= 25) potentialValue = "Very High";
  else if (score >= 18) potentialValue = "High";
  else if (score >= 10) potentialValue = "Medium";
  else if (score >= 5) potentialValue = "Low";

  const threshold = 8;

  return {
    isCollectible: score >= threshold,
    score,
    confidence: Math.min(100, Math.round(score * 3.5)),
    category,
    subcategory,
    signals,
    potentialValue,
  };
}
