/**
 * Antique Authenticity Score System
 * Score range: 1-100
 * Tier 1 (Amber):    1-33  — AI Detected
 * Tier 2 (Gold):    34-66  — Bot Confirmed
 * Tier 3 (Platinum): 67-100 — Expert Verified
 */

export type AntiqueTier = "amber" | "gold" | "platinum";

export interface AuthenticityScore {
  score: number;
  tier: AntiqueTier;
  tierLabel: string;
  tierColor: string;
  tierBorderColor: string;
  tierGlowColor: string;
  nextTierLabel: string | null;
  nextTierThreshold: number | null;
  breakdown: ScoreBreakdown;
}

export interface ScoreBreakdown {
  aiDetectionScore: number;
  ageBonusScore: number;
  antiqueBotScore: number;
  megaBotScore: number;
  total: number;
}

export function getTierFromScore(score: number): AntiqueTier {
  if (score >= 67) return "platinum";
  if (score >= 34) return "gold";
  return "amber";
}

export function getTierStyles(tier: AntiqueTier) {
  switch (tier) {
    case "platinum":
      return {
        color: "#e2e8f0",
        secondaryColor: "#94a3b8",
        borderColor: "rgba(226,232,240,0.4)",
        glowColor: "rgba(226,232,240,0.15)",
        background: "linear-gradient(135deg, rgba(226,232,240,0.15), rgba(148,163,184,0.1))",
        badgeBackground: "linear-gradient(135deg, rgba(226,232,240,0.9), rgba(148,163,184,0.85))",
        label: "PLATINUM",
        tierLabel: "Expert Verified",
      };
    case "gold":
      return {
        color: "#fbbf24",
        secondaryColor: "#d97706",
        borderColor: "rgba(251,191,36,0.4)",
        glowColor: "rgba(251,191,36,0.15)",
        background: "linear-gradient(135deg, rgba(251,191,36,0.15), rgba(217,119,6,0.1))",
        badgeBackground: "linear-gradient(135deg, rgba(251,191,36,0.92), rgba(217,119,6,0.88))",
        label: "GOLD",
        tierLabel: "Bot Confirmed",
      };
    case "amber":
    default:
      return {
        color: "#f59e0b",
        secondaryColor: "#b45309",
        borderColor: "rgba(245,158,11,0.35)",
        glowColor: "rgba(245,158,11,0.15)",
        background: "linear-gradient(135deg, rgba(245,158,11,0.08), rgba(180,83,9,0.06))",
        badgeBackground: "linear-gradient(135deg, rgba(245,158,11,0.92), rgba(180,83,9,0.88))",
        label: "AMBER",
        tierLabel: "AI Detected",
      };
  }
}

export function computeAuthenticityScore(params: {
  aiResult?: any;
  antiqueCheck?: any;
  megaBotResult?: any;
}): AuthenticityScore {
  const { aiResult, antiqueCheck, megaBotResult } = params;
  const breakdown: ScoreBreakdown = {
    aiDetectionScore: 0,
    ageBonusScore: 0,
    antiqueBotScore: 0,
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
        ? aiData.confidence
        : (aiResult?.confidence ?? 0);
      const normalizedConf = confidence > 1 ? confidence / 100 : confidence;

      if (aiData.is_antique === true || aiData.antique_alert === true) {
        breakdown.aiDetectionScore = Math.max(10, Math.round(Math.min(25, normalizedConf * 25)));
      }

      // Age bonus (0-8 points)
      const ageYears = typeof aiData.estimated_age_years === "number"
        ? aiData.estimated_age_years
        : (typeof aiData.estimated_age === "number"
          ? aiData.estimated_age
          : parseInt(aiData.estimated_age_years ?? aiData.estimated_age ?? "0"));

      if (ageYears >= 200) breakdown.ageBonusScore = 8;
      else if (ageYears >= 150) breakdown.ageBonusScore = 6;
      else if (ageYears >= 100) breakdown.ageBonusScore = 4;
      else if (ageYears >= 70) breakdown.ageBonusScore = 2;

      // If is_antique is false but age >= 70, give partial AI score
      if (breakdown.aiDetectionScore === 0 && ageYears >= 70) {
        breakdown.aiDetectionScore = 10;
      }
    }
  } catch { /* silent */ }

  // --- LAYER 2: AntiqueBot Single Run Score (0-33) ---
  try {
    if (antiqueCheck && antiqueCheck.isAntique === true) {
      let botScore = 15;

      const reason = antiqueCheck.reason;
      if (reason) {
        try {
          const parsed = typeof reason === "string" ? JSON.parse(reason) : reason;
          if (parsed.score && parsed.score >= 5) botScore += 5;
          if (parsed.markers && parsed.markers.length >= 3) botScore += 5;
          if (parsed.markers && parsed.markers.length >= 5) botScore += 3;
        } catch { /* not JSON */ }
      }

      if (antiqueCheck.auctionLow && antiqueCheck.auctionHigh) {
        botScore += 5;
      }

      breakdown.antiqueBotScore = Math.min(33, botScore);
    } else if (antiqueCheck) {
      // AntiqueCheck exists but isAntique is false — no bot score, but age might still qualify
    }
  } catch { /* silent */ }

  // --- LAYER 3: MegaBot Consensus Score (0-34) ---
  try {
    if (megaBotResult) {
      const megaData = typeof megaBotResult === "string"
        ? JSON.parse(megaBotResult)
        : megaBotResult;

      if (megaData) {
        let megaScore = 20;

        const agreement = typeof megaData.agreementScore === "number"
          ? megaData.agreementScore / 100
          : (typeof megaData.agreement === "number" ? megaData.agreement : 0);

        if (agreement >= 0.9) megaScore += 14;
        else if (agreement >= 0.75) megaScore += 10;
        else if (agreement >= 0.6) megaScore += 6;
        else if (agreement >= 0.5) megaScore += 3;

        breakdown.megaBotScore = Math.min(34, megaScore);
      }
    }
  } catch { /* silent */ }

  // Total score
  breakdown.total = Math.min(100, Math.max(1,
    breakdown.aiDetectionScore +
    breakdown.ageBonusScore +
    breakdown.antiqueBotScore +
    breakdown.megaBotScore
  ));

  const tier = getTierFromScore(breakdown.total);
  const styles = getTierStyles(tier);

  const nextTierInfo = tier === "amber"
    ? { label: "Gold — Run AntiqueBot", threshold: 34 }
    : tier === "gold"
    ? { label: "Platinum — Run MegaBot", threshold: 67 }
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
