/**
 * lib/adapters/bot-ai-router/listbot-prompts.ts
 * ─────────────────────────────────────────────────────────────────
 * Hybrid prompt builders for ListBot.
 *
 * ListBot is the only HYBRID bot — Claude writes premium marketplace
 * copy, Grok writes viral-native social copy. Both AIs receive the
 * same rich context block (built by the listbot route from item +
 * enrichment + buyer intelligence + scraper data) and a thin
 * specialty wrapper that focuses each AI on the platforms it owns.
 *
 * Why thin wrappers?
 *   The listbot route already builds a 200-line systemPrompt with
 *   urgency rules, defect framing, photo tips, and a full per-
 *   platform JSON schema. Re-implementing that here would risk
 *   regressions. Instead, the wrappers slice the platform set:
 *
 *     Claude marketplace = eBay, Etsy, Mercari, Poshmark,
 *                          Facebook Marketplace, OfferUp,
 *                          Craigslist, Nextdoor, Amazon
 *     Grok social        = TikTok, Instagram, Reels, X/Twitter,
 *                          Pinterest, YouTube Shorts, FB Groups
 *
 * The merger (listbot-merge.ts) recombines them into the existing
 * 13-platform output shape so the UI is unchanged.
 *
 * CMD-LISTBOT-HYBRID-001 — Step 3
 * ─────────────────────────────────────────────────────────────────
 */

const MARKETPLACE_SUFFIX = `

────────────────────────────────────────
[CLAUDE — MARKETPLACE SPECIALIST]
You are the marketplace listing expert. Focus EXCLUSIVELY on these
platforms in your response:
  • ebay
  • etsy
  • mercari
  • poshmark
  • facebook_marketplace
  • offerup
  • craigslist
  • nextdoor
  • amazon

Skip TikTok, Instagram, Reels, Pinterest, YouTube, X/Twitter, and
Facebook Groups — those are handled by a separate viral-native AI.

Your strengths:
  • Structured spec sheets (item_specifics, condition tags, exact dimensions)
  • Honest condition descriptions framed positively
  • SEO-rich titles within character limits
  • Professional, trustworthy tone for serious buyers
  • Accurate maker / era / provenance language

Return ONLY a valid JSON object matching the schema in the main
prompt above. No markdown fences, no extra text.
`;

const SOCIAL_SUFFIX = `

────────────────────────────────────────
[GROK — VIRAL SOCIAL SPECIALIST]
You are the viral social media copywriter. Focus EXCLUSIVELY on
these platforms in your response:
  • tiktok
  • instagram
  • reels (treat as instagram_reel inside listings.instagram if needed)
  • facebook_groups
  • pinterest
  • youtube (Shorts concepts)
  • x (Twitter)

Skip eBay, Etsy, Mercari, Poshmark, Facebook Marketplace, OfferUp,
Craigslist, Nextdoor, and Amazon — those are handled by a separate
marketplace specialist AI.

Your strengths:
  • Pattern-interrupt hooks ("Wait until you see what's in the back…")
  • Scroll-stop opening lines
  • Trending hashtag clusters (hyperlocal + niche + broad)
  • Meme-aware Gen-Z / Millennial voice
  • Cultural moment angles (movies, shows, TikTok trends)
  • 30-second video concepts with shot lists
  • Reels and Shorts formats with on-screen text suggestions

In addition to populating the platform listings, ALSO return at the
top level of your JSON:
  "viral_hook":      one killer opening line for the whole campaign
  "trending_angle":  the cultural / trend hook to lean into (1 sentence)
  "hashtags":        array of 12-20 mixed-velocity hashtags

Return ONLY a valid JSON object. No markdown fences, no extra text.
`;

/**
 * Build the marketplace prompt by appending the Claude specialty
 * wrapper to the rich shared context. Caller passes the FULL
 * existing systemPrompt (item details + enrichment + scraper data
 * + JSON schema) as `context`.
 */
export function buildMarketplacePrompt(context: string): string {
  return context + MARKETPLACE_SUFFIX;
}

/**
 * Build the social prompt by appending the Grok specialty wrapper
 * to the same rich shared context.
 */
export function buildSocialPrompt(context: string): string {
  return context + SOCIAL_SUFFIX;
}
