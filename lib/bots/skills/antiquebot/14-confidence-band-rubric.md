---
name: confidence-band-rubric
description: Extends Round A's locked confidence-bands post-processor. Teaches AntiqueBot to calibrate authentication.confidence so the ±10/±15/±40 band math produces honest, non-deceptive estimate ranges.
when_to_use: Every AntiqueBot scan. Pack 14 is the calibration layer between the AI's confidence output and the route's hard-coded band math.
version: 1.0.0
---

# Confidence Band Rubric — Calibration To The Locked Post-Processor

CRITICAL LOCK: The AntiqueBot route has a hard-coded confidence_bands post-processor at app/api/bots/antiquebot/[itemId]/route.ts lines 486-520 that was shipped in CMD-ANTIQUEBOT-CORE-A. This post-processor reads authentication.confidence (a number from the AI output) and generates three auction estimate bands from the median. DO NOT attempt to change this formula. Pack 14 exists to DOCUMENT the formula so the AI's confidence output is honest and the resulting bands are not misleading.

## The Locked Formula (from route.ts:486-520)

```
median = (auction_estimate.low + auction_estimate.high) / 2

bands = {
  narrow:   { low: median × 0.90, high: median × 1.10 }   // ±10%
  standard: { low: median × 0.85, high: median × 1.15 }   // ±15%
  wide:     { low: median × 0.60, high: median × 1.40 }   // ±40%
}

recommended_band =
  confidence ≥ 90  →  "narrow"
  confidence 70-89 →  "standard"
  confidence < 70  →  "wide"
```

This is locked. Pack 14 does not change it. Pack 14 teaches the AI when to output 90+, 70-89, and below 70 so the formula produces honest bands.

## Why This Matters

A narrow band (±10 percent) is a tight auction estimate. A seller reading "auction estimate: $9,000 to $11,000" assumes the appraiser is SURE. If the AI outputs confidence 95 on a piece where the maker is genuinely uncertain, the post-processor produces a narrow band that LIES to the seller. They will be disappointed when the hammer comes in at $6,400. You will have cost them the trust of every future scan.

Conversely, a wide band (±40 percent) is honest uncertainty. "$6,000 to $14,000" signals to the seller that many things could affect the final price. They set expectations accordingly. No surprises.

## When To Output confidence ≥ 90 (Narrow Band ±10%)

ALL of the following must be true:
- Maker is attributed from a STRONG or STRONGEST mark (Pack 02 evidentiary ladder)
- Period is confirmed by AT LEAST THREE independent construction diagnostics (Pack 05)
- Condition is clearly visible in multiple photos
- At least THREE strong or strongest sold auction comps within 90 days (Pack 12)
- No red flags at MODERATE or above (Pack 06)
- Provenance is at least Tier 3 or the item is common enough not to need provenance

If ANY ONE of the above is missing, drop below 90. The narrow band is reserved for the cases where you would stake your reputation on the number.

## When To Output confidence 70-89 (Standard Band ±15%)

MOST of the following are true but one is missing:
- Maker attributed from a medium-to-strong mark OR style/construction consensus without mark
- Period dated to a 15-30 year window
- Condition visible, minor uncertainty on one sub-score
- At least TWO sold comps within 6 months
- Red flags at LOW only
- Provenance unstated or Tier 4

This is the most common tier for AntiqueBot scans. It says "I am confident in the attribution and the general price range, but I want 15 percent of slack for things I cannot see in photos."

## When To Output confidence below 70 (Wide Band ±40%)

ANY of the following is true:
- Mark is absent, illegible, or only on a weak label
- Period is uncertain to a 40+ year window
- Condition cannot be fully assessed from the provided photos
- Fewer than two sold comps available
- Red flags at MODERATE or higher
- Authenticity itself is in question
- Provenance Tier 5 or contradictory

The wide band is NOT a failure. It is an honest signal that the seller should get an in-person expert opinion before consigning. A wide band plus an authentication escalation recommendation (Pack 15) is often the most valuable output AntiqueBot produces.

## The Confidence Calibration Test

Before finalizing authentication.confidence, ask: "If I made 100 scans at this exact confidence level, how many would hammer within the narrow band?"

- 90+ means 9 out of 10 should land in ±10 percent
- 70-89 means 7-9 out of 10 should land in ±15 percent
- Below 70 means at least 6 out of 10 should land in ±40 percent

If you cannot honestly defend those hit rates, your confidence is too high. Lower it.

## The Under-Confidence Failure Mode

Under-confidence is also a failure. If you KNOW the maker from a clear hallmark and you have 10 strong comps, do NOT output confidence 75 "just to be safe." That under-serves the seller by producing a wider band than the evidence supports. Honest calibration means committing up when the evidence commits up.

## Categorical Escape Hatch

For any scan where authentication.confidence lands below 50, do NOT recommend a specific auction venue. Recommend an in-person appraisal first. Populate authentication.recommended_tests and authentication.appraiser_recommendation with specific next steps from Pack 15. A below-50 confidence scan is a handoff scan, not an actionable scan.

## Output

Populate authentication.confidence as an integer 0-100. The route will automatically compute the confidence_bands object and set recommended_band based on the thresholds above. Cite in authentication.reasoning which specific tier you hit and WHY — list the specific evidence present and missing. The seller should be able to read your reasoning and understand why the band is tight or loose. Never output confidence 95 without explicitly listing the evidence that supports it.
