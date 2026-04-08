/**
 * KILL SWITCH TYPED WRAPPER
 *
 * Provides a typed generic wrapper around the killswitch's
 * graceful empty result so adapters with custom return shapes
 * (TikTokAdsResult, TikTokSongsResult, AiVideoAdsResult,
 * SocialTrendsResult) can drop their `as any` casts.
 *
 * This file is a companion to scraper-killswitch.ts. The original
 * file remains byte-identical — Round B does not modify it.
 *
 * Pattern:
 *   const blocked = checkAndBuildBlocked<TikTokAdsResult>(
 *     "lexis-solutions/tiktok-ads-scraper",
 *     {
 *       success: false,
 *       data: null,
 *       source: "tiktok-ads",
 *     }
 *   );
 *   if (blocked) return blocked;
 *
 * Updated: 2026-04-07
 * Author: Ryan Hallee
 */

import {
  checkActorKillSwitch,
  buildBlockedScraperResult,
  type KillSwitchResult,
} from "./scraper-killswitch";

/**
 * Checks the killswitch for the given actor slug. If blocked,
 * returns a typed empty result merged with the killswitch
 * metadata. If not blocked, returns null and the caller proceeds
 * normally.
 *
 * The merge order prioritizes the typed shape's specific fields
 * (so an adapter that returns `videos: []` keeps that field name)
 * while ALSO including the killswitch metadata fields
 * (success: false, blocked: true, blockedReason, message).
 */
export function checkAndBuildBlocked<TResult>(
  actorSlug: string,
  emptyShape: TResult
): TResult | null {
  const result: KillSwitchResult = checkActorKillSwitch(actorSlug);
  if (!result.blocked) return null;

  const generic = buildBlockedScraperResult(actorSlug);
  return {
    ...emptyShape,
    ...generic,
  } as TResult;
}

/**
 * Same as checkAndBuildBlocked but for adapters that match the
 * standard ScraperResult shape exactly. Returns the canonical
 * killswitch empty result with no extra fields.
 */
export function checkAndBuildStandardBlocked(
  actorSlug: string
): ReturnType<typeof buildBlockedScraperResult> | null {
  const result: KillSwitchResult = checkActorKillSwitch(actorSlug);
  if (!result.blocked) return null;
  return buildBlockedScraperResult(actorSlug);
}
