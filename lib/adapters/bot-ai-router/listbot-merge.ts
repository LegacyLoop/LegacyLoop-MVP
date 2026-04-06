/**
 * lib/adapters/bot-ai-router/listbot-merge.ts
 * ─────────────────────────────────────────────────────────────────
 * Merge Claude marketplace output + Grok social output into the
 * SAME 13-platform shape ListBot has always returned. UI consumers
 * are unchanged — every existing field is preserved.
 *
 * Additive fields (non-breaking, ignored by old consumers):
 *   • viral { hook, angle, hashtags }
 *   • _ai_breakdown { marketplace_provider, social_provider, merged_at }
 *
 * BUG FIX (screenshot dash):
 *   The collapsed ListingCreatorPanel reads listBotResult.best_platform
 *   but ListBot's existing JSON only outputs `cross_platform_strategy`
 *   and per-platform listings — no top-level singular best_platform.
 *   We derive it here so the panel renders cleanly.
 *
 * CMD-LISTBOT-HYBRID-001 — Step 3
 * ─────────────────────────────────────────────────────────────────
 */

/**
 * Derive a singular best_platform string from the marketplace
 * output. Tries (in order):
 *   1. cross_platform_strategy.recommended_first_post
 *   2. cross_platform_strategy.priority_order[0]
 *   3. First key in listings
 *   4. null
 */
function deriveBestPlatform(marketplace: any): string | null {
  if (!marketplace) return null;
  const cps = marketplace.cross_platform_strategy;
  if (cps?.recommended_first_post && typeof cps.recommended_first_post === "string") {
    return cps.recommended_first_post;
  }
  if (Array.isArray(cps?.priority_order) && cps.priority_order.length > 0) {
    return String(cps.priority_order[0]);
  }
  if (marketplace.listings && typeof marketplace.listings === "object") {
    const firstKey = Object.keys(marketplace.listings)[0];
    if (firstKey) return firstKey;
  }
  return null;
}

/**
 * Merge the two AI outputs into the unified ListBot response shape.
 *
 * Strategy:
 *   • listings = marketplace.listings ⊕ social.listings (social wins on overlap)
 *   • All other top-level fields = marketplace (the structured authority)
 *   • viral block = pulled from social
 *   • best_platform = derived (NEW — fixes the dashboard dash)
 *   • top_platforms = derived from listings keys (NEW)
 *   • _ai_breakdown = audit trail
 */
export function mergeListBotHybrid(
  marketplace: any,
  social: any,
): any {
  const m = marketplace || {};
  const s = social || {};

  // Combine listings (social entries override marketplace entries when keys collide,
  // since social-native platforms should always be social-AI flavored)
  const listings: Record<string, any> = {
    ...(m.listings || {}),
    ...(s.listings || s.social_listings || {}),
  };

  const bestPlatform = deriveBestPlatform({ ...m, listings });
  const topPlatforms = Object.keys(listings).slice(0, 5);

  return {
    // Authoritative marketplace fields (Claude)
    listings,
    cross_platform_strategy: m.cross_platform_strategy ?? null,
    photo_strategy: m.photo_strategy ?? null,
    seo_master: m.seo_master ?? null,
    pricing_strategy_per_platform: m.pricing_strategy_per_platform ?? null,
    auto_post_readiness: m.auto_post_readiness ?? null,
    executive_summary: m.executive_summary ?? null,
    hero_image_prompt: m.hero_image_prompt ?? null,

    // BUG FIX — derived fields the panel reads
    best_platform: bestPlatform,
    top_platforms: topPlatforms,

    // Additive viral block (Grok)
    viral: {
      hook: s.viral_hook ?? null,
      angle: s.trending_angle ?? null,
      hashtags: Array.isArray(s.hashtags) ? s.hashtags : [],
    },

    // Audit trail
    _ai_breakdown: {
      marketplace_provider: "claude",
      social_provider: "grok",
      merged_at: new Date().toISOString(),
      marketplace_platforms: Object.keys(m.listings || {}),
      social_platforms: Object.keys(s.listings || s.social_listings || {}),
    },
  };
}
