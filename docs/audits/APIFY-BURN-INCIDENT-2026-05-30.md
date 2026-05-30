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
