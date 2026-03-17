/**
 * Collectibles Authenticity Score System
 * Score range: 1-100
 * Tier 1 (Bronze):  1-33  — AI Detected
 * Tier 2 (Silver): 34-66  — Bot Graded
 * Tier 3 (Gold):   67-100 — Expert Certified
 */

export type CollectibleTier = "bronze" | "silver" | "gold";

export interface CollectiblesScore {
  score: number;
  tier: CollectibleTier;
  tierLabel: string;
  tierColor: string;
  tierBorderColor: string;
  tierGlowColor: string;
  nextTierLabel: string | null;
  nextTierThreshold: number | null;
  breakdown: CollectiblesBreakdown;
}

export interface CollectiblesBreakdown {
  aiDetectionScore: number;   // 0-25: from initial AI analysis
  rarityBonusScore: number;   // 0-8:  based on rarity signals
  botGradeScore: number;      // 0-33: from CollectiblesBot single run
  megaBotScore: number;       // 0-34: from MegaBot consensus
  total: number;
}

export function getCollectibleTierFromScore(score: number): CollectibleTier {
  if (score >= 67) return "gold";
  if (score >= 34) return "silver";
  return "bronze";
}

export function getCollectibleTierStyles(tier: CollectibleTier) {
  switch (tier) {
    case "gold":
      return {
        color: "#fbbf24",
        secondaryColor: "#d97706",
        borderColor: "rgba(251,191,36,0.4)",
        glowColor: "rgba(251,191,36,0.15)",
        background: "linear-gradient(135deg, rgba(251,191,36,0.15), rgba(217,119,6,0.1))",
        badgeBackground: "linear-gradient(135deg, rgba(251,191,36,0.92), rgba(217,119,6,0.88))",
        label: "GOLD",
        tierLabel: "Expert Certified",
        textColor: "white",
      };
    case "silver":
      return {
        color: "#94a3b8",
        secondaryColor: "#64748b",
        borderColor: "rgba(148,163,184,0.4)",
        glowColor: "rgba(148,163,184,0.15)",
        background: "linear-gradient(135deg, rgba(148,163,184,0.15), rgba(100,116,139,0.1))",
        badgeBackground: "linear-gradient(135deg, rgba(148,163,184,0.92), rgba(100,116,139,0.88))",
        label: "SILVER",
        tierLabel: "Bot Graded",
        textColor: "white",
      };
    case "bronze":
    default:
      return {
        color: "#8b5cf6",
        secondaryColor: "#6d28d9",
        borderColor: "rgba(139,92,246,0.35)",
        glowColor: "rgba(139,92,246,0.15)",
        background: "linear-gradient(135deg, rgba(139,92,246,0.08), rgba(109,40,217,0.06))",
        badgeBackground: "linear-gradient(135deg, rgba(139,92,246,0.92), rgba(109,40,217,0.88))",
        label: "BRONZE",
        tierLabel: "AI Detected",
        textColor: "white",
      };
  }
}

export function computeCollectiblesScore(params: {
  aiResult?: any;
  collectiblesBotResult?: any;
  megaBotResult?: any;
}): CollectiblesScore {
  const { aiResult, collectiblesBotResult, megaBotResult } = params;
  const breakdown: CollectiblesBreakdown = {
    aiDetectionScore: 0,
    rarityBonusScore: 0,
    botGradeScore: 0,
    megaBotScore: 0,
    total: 0,
  };

  // --- LAYER 1: AI Detection Score (0-25) ---
  try {
    const rawJson = aiResult?.rawJson;
    const aiData = rawJson
      ? (typeof rawJson === "string" ? JSON.parse(rawJson) : rawJson)
      : null;
    if (aiData) {
      const confidence = typeof aiData.confidence === "number"
        ? aiData.confidence : (aiResult?.confidence ?? 0);
      const cat = (aiData.category || "").toLowerCase();
      const itemType = (aiData.item_type || "").toLowerCase();
      if (
        aiData.is_collectible === true ||
        aiData.collectible_detected === true ||
        aiData.collectible_alert === true ||
        cat.includes("collectible") ||
        cat.includes("card") ||
        cat.includes("comic") ||
        cat.includes("coin") ||
        cat.includes("vinyl") ||
        cat.includes("toy") ||
        cat.includes("memorabilia") ||
        itemType.includes("collectible") ||
        itemType.includes("card")
      ) {
        breakdown.aiDetectionScore = Math.max(10, Math.round(Math.min(25, confidence * 25)));
      }
      // Rarity bonus (0-8 points)
      const potentialValue = (aiData.potential_value || "").toLowerCase();
      if (potentialValue.includes("very high") || potentialValue.includes("exceptional")) breakdown.rarityBonusScore = 8;
      else if (potentialValue.includes("high")) breakdown.rarityBonusScore = 5;
      else if (potentialValue.includes("moderate") || potentialValue.includes("medium")) breakdown.rarityBonusScore = 3;
      else if (potentialValue.includes("low")) breakdown.rarityBonusScore = 1;
    }
  } catch { /* silent fallback */ }

  // --- LAYER 2: CollectiblesBot Single Run Score (0-33) ---
  try {
    if (collectiblesBotResult) {
      const botData = typeof collectiblesBotResult === "string"
        ? JSON.parse(collectiblesBotResult)
        : collectiblesBotResult;
      if (botData) {
        let botScore = 15;
        if (botData.grade || botData.condition_grade) botScore += 8;
        if (botData.rarity === "rare" || botData.rarity === "very rare") botScore += 5;
        else if (botData.rarity === "uncommon") botScore += 3;
        if (botData.authenticated === true || botData.provenance_confirmed === true) botScore += 5;
        breakdown.botGradeScore = Math.min(33, botScore);
      } else {
        breakdown.botGradeScore = 15;
      }
    }
  } catch { /* silent fallback */ }

  // --- LAYER 3: MegaBot Consensus Score (0-34) ---
  try {
    if (megaBotResult) {
      const megaData = typeof megaBotResult === "string"
        ? JSON.parse(megaBotResult) : megaBotResult;
      if (megaData) {
        let megaScore = 20;
        const agreement = typeof megaData.agreement === "number"
          ? megaData.agreement
          : (parseFloat(megaData.agreementScore ?? "0") / 100);
        if (agreement >= 0.9) megaScore += 14;
        else if (agreement >= 0.75) megaScore += 10;
        else if (agreement >= 0.6) megaScore += 6;
        else if (agreement >= 0.5) megaScore += 3;
        breakdown.megaBotScore = Math.min(34, megaScore);
      } else {
        breakdown.megaBotScore = 20;
      }
    }
  } catch { /* silent fallback */ }

  breakdown.total = Math.min(100,
    breakdown.aiDetectionScore +
    breakdown.rarityBonusScore +
    breakdown.botGradeScore +
    breakdown.megaBotScore
  );

  const tier = getCollectibleTierFromScore(breakdown.total);
  const styles = getCollectibleTierStyles(tier);
  const nextTierInfo = tier === "bronze"
    ? { label: "Silver — Run CollectiblesBot", threshold: 34 }
    : tier === "silver"
    ? { label: "Gold — Run MegaBot", threshold: 67 }
    : null;

  return {
    score: breakdown.total,
    tier,
    tierLabel: styles.tierLabel,
    tierColor: styles.color,
    tierBorderColor: styles.borderColor,
    tierGlowColor: styles.glowColor,
    nextTierLabel: nextTierInfo?.label ?? null,
    nextTierThreshold: nextTierInfo?.threshold ?? null,
    breakdown,
  };
}
