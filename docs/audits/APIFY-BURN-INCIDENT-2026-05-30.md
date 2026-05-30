# ★ APIFY BURN INCIDENT · 2026-05-30 · ROOT CAUSE + FIX
# Author: Devin L1 · emergency response · CEO directive "fix NOW"
# Status: 🟢 BLEED STOPPED (3 WFs deactivated) · permanent-fix plan banked

## SYMPTOM
Apify cap ($50) hit within ~30 min of monthly reset (2026-05-30 AM). $29 prepaid + into overage. 3rd month in a row hitting $50. CEO out-of-pocket.

## ★ ROOT CAUSE (empirical · n8n API verified)
THREE Apify-calling WFs were ACTIVE with `scheduleTrigger` firing EVERY 6 HOURS — unattended auto-fire:
- WF91 V10 Reddit Apify `Q2vBQDGdw6uv9Yo6` (schedule: every 6h)
- WF93 V11 Facebook Marketplace `WmDdCswwOiavAX9B` (schedule: every 6h · $5/1k actor)
- WF94 V11 Facebook Groups `9XOwy4VgmbK09kc7` (schedule: every 6h · $4/1k actor)

Math: 3 actors × 4 runs/day = 12 unattended Apify runs/day at FB-tier pricing. The instant Apify reset, all 3 cron-fired and drained $50 in ~30 min. NOBODY pulled them — the schedules did. This is why it happened 3 months running: auto-schedules, not manual-only.

## FIX APPLIED (2026-05-30 · n8n API deactivate)
POST /api/v1/workflows/{id}/deactivate on all 3 → active=False (verified).
Post-fix probe: ACTIVE+SCHEDULED+APIFY count = 0. No other active scheduled WF references apify.
Apify account already frozen this cycle ($50 exceeded · actors aborted) — deactivation prevents the 6/30 reset from repeating the disaster.

## ★ PERMANENT FIX (banked · for the $29/month design CEO wants)
1. WF91/93/94 = MANUAL-ONLY. The scheduleTrigger nodes must be REMOVED (not just deactivated) — deactivation alone means a reactivate re-arms the 6h cron. When reactivated for a manual pull, no schedule node should exist.
2. HARD per-run item caps on the Apify actor input (maxItems ~50-100 · NOT thousands). FB actors bill per result — uncapped result sets = the burn multiplier.
3. Rotation Controller cost-sentinel ($21.75 = 75% of $29) must be WIRED LIVE (currently W23 stubs). It is the structural budget guard.
4. Apify cap stays $29 (CEO: rare to touch $50, out-of-pocket).
5. Pre-fire cost estimate REQUIRED before any Apify manual run (items × $/1k).

## DOCTRINE CANDIDATE
★ DOC-NO-UNATTENDED-PAID-VENDOR-SCHEDULE 1/5 — paid-vendor (Apify) WFs NEVER carry an auto-schedule trigger. Manual-fire only, with hard item cap + pre-fire cost estimate. Auto-schedule on a per-result-billed vendor = budget-burn class.

## CARRY (CEO 1-liners)
- Next cycle 6/30: keep cap $29 · WFs stay manual-only.
- W24+ lane: wire rotation cost-sentinel live + strip schedule nodes from WF91/93/94 + add maxItems caps.

---

## ★ FULL ROOT CAUSE (CORRECTED · empirical 2026-05-30 · supersedes first hypothesis)
First hypothesis (FB/Reddit WFs 91/93/94) was WRONG — those are cheap (~$0.009/run). Honest correction (DOC-PREMATURE-CLOSE-CLAIM applies to me).

**ACTUAL BURN: `fatihtahta/cars-com-scraper` (actor 54fUapdcuXQvnj5Zl · "Cars.com Scraper WITH Contacts" · COMPUTE-billed, NOT per-result).**
- Fired 4× back-to-back 2026-05-30 12:00 / 12:01 / 12:02 / 12:03 UTC · ~$13 EACH = ~$53 in 4 min → cap blown (account $53.63 / $50).
- Identical pattern 2026-05-22 (4× ~$12). The 3-month repeat = THIS actor, every time.
- Callers: WF45 KBB Vehicle `7q4t8JcY1kpFLtQ1` + WF40 ClassicCars `z67pIt9E4Xaq2cXN` — BOTH active + scheduleTrigger (cron `* 7 * * *` daily).
- origin=API · client=axios/1.12.0 (n8n httpRequest firing per-item in a loop).
- ★ maxItems=40 in the WF DID NOT bind — compute-billed actor ignores item cap, bills ~$13/run regardless. KEY LESSON.

## FIXES APPLIED (2026-05-30 · CEO-approved · empirically verified)
1. ✅ Apify cap maxMonthlyUsageUsd 50 → **29** (PUT 201 · re-verified cap=29). Current cycle stays frozen at $53.63; 6/30 reset starts fresh, $29 HARD ceiling = zero out-of-pocket overage going forward.
2. ✅ WF45 + WF40 DEACTIVATED (the daily schedules that fired cars-com). Verified active=False.
3. ✅ WF91 + WF93 + WF94 DEACTIVATED (FB/Reddit · cheap but were auto-scheduled · no reason to auto-fire). Verified active=False.
4. ✅ Post-fix probe: ZERO active+scheduled apify-actor callers remain. Bleed source eliminated.
5. ⚠ Apify TASK `legacyloop-cars-com` (W7icv7BHevdQG3Yql) delete = 403 (token lacks task-delete scope). NON-BLOCKING — task cannot fire without a caller, and all callers are dead. CEO can delete in Apify dashboard if desired.

## 36 APIFY TASKS EXIST (full inventory · most unused · attack surface)
fb-marketplace, ebay, google-shopping, amazon, tiktok, fb-groups, reddit, etsy, instagram, craigslist×2, autotrader, cars-com, shopgoodwill, bat-auctions, cargurus, chrono24, stockx, liveauctioneers, sothebys, goat, pinterest, youtube, twitter-x, facebook-pages, tcgplayer, courtyard, ai-video-ads, ai-ugc-video, video-script, tiktok-ads, fb-ads-library, social-trends, tiktok-songs, ai-voiceover, ai-ad-music. → AUDIT + PRUNE banked (most never used · each = a potential burn vector).

## DOCTRINE CANDIDATES
- ★ DOC-VET-ACTOR-BILLING-MODEL 1/5 — before any Apify actor enters a WF: confirm bill basis (per-result vs COMPUTE). Compute-billed actors ignore maxItems → manual-only + tight timeout + hard $ ceiling. cars-com-with-contacts = compute-billed = the 3-month leak.
- ★ DOC-NO-UNATTENDED-PAID-VENDOR-SCHEDULE 1/5 — paid-vendor WFs NEVER carry an auto-schedule. Manual-fire only, pre-fire cost estimate required.

## CARRY (CEO 1-liners / W24+ lane)
- 6/30 reset: cap stays $29 · all paid-vendor WFs manual-only.
- Wire rotation cost-sentinel LIVE (currently W23 stubs · the structural guard).
- STRIP scheduleTrigger nodes from WF40/45/91/93/94 (deactivation alone re-arms on reactivate).
- Audit + prune the 36 Apify tasks (kill unused).
- Vet cars-com billing — likely retire entirely (use a per-result vehicle actor or free path WF72/WF76).
