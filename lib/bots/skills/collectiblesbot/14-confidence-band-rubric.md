---
name: confidence-band-rubric
description: How to calibrate visual_grading.grade_confidence so the downstream router's borderline_grading threshold (80) fires honestly. When to output high confidence (narrow band), moderate (standard), low (wide). The grading variance rule. The escalation escape hatch for sub-50 confidence.
when_to_use: Every CollectiblesBot scan. Pack 14 governs the confidence number the CORE-A router reads at the threshold gate.
version: 1.0.0
---

# Confidence Band Rubric — Calibration To The Router Threshold

CRITICAL LOCK: The CollectiblesBot route uses `routeCollectiblesBotHybrid` with an `authConfidenceThreshold` of 80. The router reads `visual_grading.grade_confidence` from the primary Claude response. If it is below 80, the OpenAI secondary fires for a collector-opinion backup pass. The threshold is hard-coded in the route (CMD-COLLECTIBLESBOT-CORE-A). Pack 14 teaches you to calibrate your confidence output so the secondary fires honestly — not too often, not too rarely.

The router accepts grade_confidence as either:
- A decimal 0.0 to 1.0 (e.g., 0.85 = 85)
- An integer 1 to 100 (e.g., 85 = 85)

Either works. The router normalizes internally. Be consistent across scans — prefer the 0.0–1.0 decimal for visual_grading (matches the existing demo path) and integer 1–100 for authentication.confidence.

## When To Output grade_confidence ≥ 0.80 (Secondary Skipped)

ALL of the following must be true:
- Grading scale is correctly identified (Pack 02 verified)
- All four sub-dimensions visible in photos (for cards: corners, edges, surface, centering)
- At least three strong specialty scraper sources returned data (PriceCharting + PSACard + Beckett OR equivalent)
- No fraud red flags at MODERATE or above (Pack 13)
- Authentication service recommendation is clear (not ambiguous)
- Price triangulation converges within 25 percent spread

If ANY of the above is missing, drop below 0.80 and let the secondary fire. The secondary is a collector-opinion backup — it is meant to fire on borderline cases. That is its job.

## When To Output grade_confidence 0.60 to 0.79 (Secondary Fires)

MOST of the following are true but one is missing:
- Scale identified but one sub-dimension not fully visible
- Two of three specialty sources returned data (one silent)
- Fraud risk LOW
- Price triangulation spread 25 to 50 percent
- Photos adequate but one angle missing (e.g., back of card not shown)

This is the most common tier for CollectiblesBot scans. It says "I am confident in the category and the general grade range, but the exact grade needs a second look."

## When To Output grade_confidence below 0.60 (Wide Band + Escalation)

ANY of the following is true:
- Grading scale unclear (is this CGC or CBCS? raw or graded?)
- Multiple sub-dimensions not visible
- Fewer than two price sources returned data
- Fraud red flags at MODERATE or higher
- Photos inadequate (blurry, single angle, harsh lighting)
- Item is a category CollectiblesBot has weak coverage for (very niche hobbies)

The wide band is NOT a failure. It is an honest signal that the seller should get an in-person expert or service authentication before consigning. Pack 15 handles the platform escalation; Pack 13 handles fraud escalation.

## The Grading Variance Rule

Grading is inherently subjective. Even PSA graders disagree on borderline cards. Track the variance:

- **High-variance categories**: vintage cards (pre-1980 — condition is idiosyncratic), vintage comics (pre-1970), chrome and refractor cards (surface sensitive), dark-border cards (corner sensitive)
- **Medium-variance categories**: modern sports cards, modern comics, modern video games
- **Low-variance categories**: coins (Sheldon scale is precise), modern Pokemon (high grading volume means consistency), sealed products (yes/no)

For high-variance categories, subtract 5-10 points from your initial confidence estimate. A "confident PSA 9" on a 1971 Topps dark-border is really a "likely PSA 8 or 9." Calibrate accordingly.

## The Calibration Test

Before finalizing, ask: "If I made 100 scans at this exact confidence level, how often would the actual sale outcome land within my stated grade range?"

- 90+ means 9 of 10 should hit within one half-grade
- 80–89 means 7-9 of 10 should hit within one grade
- 60–79 means 5-7 of 10 should hit within one grade
- Below 60 means variance is high — wide band is appropriate

If you cannot honestly defend those hit rates, your confidence is too high. Lower it. The router will fire the secondary, and the seller gets the benefit of two opinions.

## The Under-Confidence Failure Mode

Under-confidence is also a failure. If you have all the evidence — clear photos, all sub-dimensions visible, strong comp sources, no red flags — do NOT output 0.65 "just to be safe." That wastes the secondary call (adds ~$0.003 cost) and under-serves the seller with a wider band than needed. Honest calibration means committing UP when the evidence commits up.

## The Categorical Escape Hatch

For any scan where `visual_grading.grade_confidence` lands below 0.50, do NOT recommend a specific auction venue or dealer. Instead:
1. Set `grading_recommendation` to "In-person authentication required before grading recommendation."
2. Set `authentication_services.recommended_service` to the primary service for the category.
3. Set `executive_summary` to explain the uncertainty and the missing information.
4. Widen `raw_value_low` to `raw_value_high` range to at least ±50 percent of the estimated midpoint.

A below-0.50 confidence scan is a handoff scan, not an actionable scan. Do not pretend otherwise.

## The Authentication Confidence Field Separately

In addition to `visual_grading.grade_confidence`, CollectiblesBot may populate `authentication.confidence` when fraud risk is assessed (Pack 13). These are TWO DIFFERENT numbers:

- **grade_confidence** — how confident are you in the grade tier assignment?
- **authentication.confidence** — how confident are you the item is genuine (not a reproduction, fake, or counterfeit)?

Both should be populated on every scan. They can differ significantly:
- Clear genuine card, hard-to-grade corners: auth 95 / grade 70
- Likely fake slab: auth 30 / grade N/A (do not grade a fake)
- Clear real card, clear grade: auth 95 / grade 88

The router only reads grade_confidence for the threshold gate. But both are logged in telemetry for later audit.

## Output

Populate `visual_grading.grade_confidence` as a decimal between 0.0 and 1.0. Populate `authentication.confidence` as an integer between 1 and 100. In `visual_grading.grade_reasoning`, cite the specific evidence present and missing. If grade_confidence is below 0.70, explain WHY in the reasoning. Always be calibrated — over 0.95 requires near-certainty across all sub-dimensions; below 0.50 requires a handoff.
