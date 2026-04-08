# Scraper Killswitch Runbook

**Owner:** Ryan Hallee
**Last Updated:** 2026-04-07
**Severity:** CRITICAL — money safety net

## What it does

The Apify scraper killswitch is a two-layer money safety net for
LegacyLoop's market intelligence layer. It prevents accidental
spend on dangerous Apify actors that cost $500-$3,500 per 1,000
results or require monthly subscriptions ($15-$47/month).

### Layer 1 — Hard-block list (always active)

12 specific Apify actors are PERMANENTLY blocked at the adapter
level. Defined in `lib/market-intelligence/blocked-actors.ts`.

- 7 monthly subscription actors (Autotrader, Cargurus, Etsy,
  TikTok Ads, TikTok Trending Songs, AI UGC Video Maker, Goat)
- 5 dangerous high-cost actors (Sotheby's, AI Video Ads,
  AI Voiceover, Social Trends 6-in-1, AI Ad Music Factory)

These cannot fire from any LegacyLoop code path. Period.

### Layer 2 — Global kill switch (operator-flippable)

Environment variable: `APIFY_KILL_SWITCH`
- Default: `false` (paid Apify actors fire normally per allowlist)
- Set to `true`: ALL paid Apify actors return empty results
- Read live via `process.env` — no rebuild needed after env change

Defined in `lib/market-intelligence/scraper-killswitch.ts`.

## When to flip the kill switch

Flip `APIFY_KILL_SWITCH=true` immediately if you observe ANY of:

1. Apify dashboard shows unexpected spend spike
2. Bot pulls returning data from actors not in the per-bot allowlist
3. Single user account burns through credits faster than expected
4. Any production alert mentioning Apify spend or Apify token leak

## How to flip it (Vercel)

1. Vercel Dashboard → LegacyLoop project → Settings → Environment
   Variables
2. Find `APIFY_KILL_SWITCH` (or add it if missing)
3. Set value to `true`
4. Save
5. Trigger a redeploy (Deployments → Redeploy latest)
6. New deployment picks up the new env var on the next request

## How to unflip it

Reverse the steps. Set `APIFY_KILL_SWITCH=false` and redeploy.

## What it does NOT protect against

The kill switch is in-process only. It cannot stop:
- Direct `curl` calls to Apify with a leaked `APIFY_TOKEN`
- Apify webhook callbacks from in-flight runs that started before
  the flip
- Manual runs triggered from the Apify console UI

If `APIFY_TOKEN` is suspected leaked, ROTATE THE TOKEN at
apify.com → Settings → Integrations → API tokens. Then update
Vercel env var.

## Verification after a flip

Within 24 hours of flipping, check:

1. Apify dashboard → Usage → today's spend should be $0.00 for
   all 12 hard-blocked actors
2. Vercel logs → grep for `[apify-killswitch]` warnings — every
   blocked attempt logs there
3. Any bot route's `MEGABOT_RUN` telemetry → marketIntel field
   should show empty results from the blocked actors

## Related files

- `lib/market-intelligence/scraper-killswitch.ts` — main module
- `lib/market-intelligence/blocked-actors.ts` — hard-block list
- `lib/market-intelligence/scraper-tiers.ts` — tier registry
- `lib/market-intelligence/bot-scraper-allowlist.ts` — per-bot menu
- `lib/market-intelligence/aggregator.ts` — dispatch + interception
- `lib/market-intelligence/killswitch-typed-wrapper.ts` — typed guard

## Command history

| Command | Date | Effect |
|---|---|---|
| CMD-SCRAPER-KILLSWITCH-A | 2026-04-07 | Created killswitch + 12 hard blocks + 9 in-file adapter guards |
| CMD-SCRAPER-TIERS-B | 2026-04-07 | Added tier registry + per-bot allowlist + aggregator dispatch interception + typed wrapper |
| CMD-SCRAPER-WIRING-C | TBD | Will replace category routing with per-bot allowlist routing |
| CMD-SCRAPER-CEILINGS-D | TBD | Will add cost ceilings + BlockedScraperLog persistence + bypassKillSwitch credit gate |
