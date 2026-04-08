/**
 * APIFY SCRAPER KILL SWITCH
 *
 * The kill switch is the LegacyLoop emergency safety net for the
 * Apify scraper layer. It provides two protections:
 *
 *   1. GLOBAL kill switch (env var APIFY_KILL_SWITCH=true)
 *      When set, ALL paid Apify actors are blocked from firing.
 *      This is the "panic button" — flip the env var, redeploy,
 *      and zero paid actors run anywhere.
 *
 *   2. PER-ACTOR hard block list (blocked-actors.ts)
 *      Specific actors are permanently blocked regardless of the
 *      env var, because they cost monthly subscriptions or have
 *      dangerous per-call costs ($500-$3,500/1k).
 *
 * Both checks are wired into each blocked adapter via a single
 * guard call at the top of the scrape function. The guard returns
 * a graceful empty result instead of throwing, so callers degrade
 * cleanly when an actor is blocked.
 *
 * Updated: 2026-04-07
 * Author: Ryan Hallee
 */

import { isSlugBlocked, getBlockedActor } from "./blocked-actors";

export interface KillSwitchResult {
  blocked: boolean;
  reason?: string;
  actorSlug?: string;
}

/**
 * Returns true when the GLOBAL kill switch is active.
 * Read live so a deploy with APIFY_KILL_SWITCH=true takes effect
 * without rebuild.
 */
export function isGlobalKillSwitchActive(): boolean {
  const v = process.env.APIFY_KILL_SWITCH;
  if (!v) return false;
  return v.toLowerCase() === "true" || v === "1";
}

/**
 * The single function every blocked adapter calls at the top of
 * its scrape function. Returns blocked=true when EITHER the global
 * kill switch is active OR the actor is on the hard block list.
 */
export function checkActorKillSwitch(actorSlug: string): KillSwitchResult {
  if (isGlobalKillSwitchActive()) {
    console.warn(
      `[apify-killswitch] GLOBAL kill switch active — blocking ${actorSlug}`
    );
    return {
      blocked: true,
      reason: "global_kill_switch_active",
      actorSlug,
    };
  }

  if (isSlugBlocked(actorSlug)) {
    const meta = getBlockedActor(actorSlug);
    console.warn(
      `[apify-killswitch] HARD BLOCK ${actorSlug} — ` +
        `${meta?.reason ?? "unknown"} (${meta?.costNote ?? "no cost note"})`
    );
    return {
      blocked: true,
      reason: meta?.reason ?? "hard_block_list",
      actorSlug,
    };
  }

  return { blocked: false };
}

/**
 * Standard graceful empty result shape returned by blocked adapters.
 * Adapters may map this onto their specific return type.
 */
export function buildBlockedScraperResult(actorSlug: string) {
  const meta = getBlockedActor(actorSlug);
  return {
    success: false,
    blocked: true,
    blockedReason: meta?.reason ?? "kill_switch",
    actorSlug,
    comps: [],
    listings: [],
    items: [],
    message: meta
      ? `Actor ${actorSlug} is blocked: ${meta.reason} (${meta.costNote})`
      : `Actor ${actorSlug} is blocked by the kill switch.`,
  };
}
