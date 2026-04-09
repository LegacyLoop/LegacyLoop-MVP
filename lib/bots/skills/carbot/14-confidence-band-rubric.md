---
name: confidence-band-rubric
description: Extends the CORE-A rare_vehicle trigger threshold documented in the CarBot route. Teaches the AI when to claim high confidence (clean photos + documented history + strong comps) vs low confidence (missing photos + TMU + no comps). Calibrates valuation_confidence to match the route's caller-side rare_vehicle evaluation.
when_to_use: Every CarBot scan. Pack 14 is the calibration layer between Gemini's output and the caller-side secondary trigger.
version: 1.0.0
---

# Confidence Band Rubric — Calibration To The CarBot Router

CRITICAL LOCK: The CarBot route (app/api/bots/carbot/[itemId]/route.ts) uses `routeCarBotHybrid` from CMD-CARBOT-CORE-A. The caller pre-evaluates the `rare_vehicle` trigger based on year < 1980 OR mileage < 30000 and passes `shouldRunSecondary` to the router. Unlike AntiqueBot/CollectiblesBot (where the router reads a confidence field from the AI response), CarBot's secondary firing is caller-driven. Pack 14 calibrates the AI's own `valuation_confidence` field so downstream telemetry and buyer-facing output are honest.

## The CarBot Confidence Field

CarBot's response schema includes `valuation_confidence` as a 1-100 integer. This is separate from the caller-side `rare_vehicle` trigger. Its purpose is to communicate to the seller how sure CarBot is about the valuation range.

## When To Output valuation_confidence ≥ 85 (Tight Range)

ALL of the following must be true:
- VIN decoded successfully (Pack 02 NHTSA decode returned data)
- Year / make / model / trim confirmed
- Mileage documented (odometer visible in photos OR title reference)
- 5+ matching comps from last 90 days (same trim, similar mileage, similar region)
- Exterior condition assessable from provided photos (front, rear, both sides, interior, engine bay)
- Title status known (clean or specific brand disclosed)
- No red flags at MODERATE or higher
- Service history documented OR mileage suggests low probability of major deferred maintenance
- Regional comp data available (ZIP code scraper pull succeeded)

If ANY of the above is missing, drop below 85.

## When To Output valuation_confidence 65-84 (Standard Range)

MOST of the following are true but one or two are missing:
- VIN decoded but one seller detail disputed (seller said "2013 Lariat" but VIN says "2013 XLT")
- 3-4 matching comps (thinner than ideal)
- 4-5 photo angles (missing one key view — typically undercarriage)
- Service history partial or unknown
- Title status disclosed but unverified (seller says "clean" but no CARFAX pulled)
- Red flags at LOW only

This is the most common tier for CarBot scans. It says "confident in the segment and general range, but one data point is soft."

## When To Output valuation_confidence below 65 (Wide Range)

ANY of the following is true:
- VIN not visible OR decode returned partial data
- Year uncertain (pre-1980 without title reference, or modern without odometer match)
- Fewer than 3 matching comps
- Photos missing critical views (no interior, no engine bay, no rust check areas)
- Title status unclear or disputed
- Red flags at MODERATE or higher
- Modifications of unknown quality or extent
- Fluid leaks visible in photos
- Rust visible on structural components

Below 65 means the valuation range must be wide (±20-30%) and the executive summary must recommend a pre-purchase inspection.

## The Pre-Purchase Inspection Escape Hatch

For any CarBot scan where `valuation_confidence` lands below 60 AND the estimated value is over $5,000, the executive_summary MUST recommend a professional pre-purchase inspection (PPI) before sale. A PPI runs $150-$400 and catches:
- Frame damage the seller did not disclose
- Transmission or engine issues
- Brake, suspension, and steering wear
- Electrical system health
- AC/heat functionality
- Battery state of health (for EVs)

State PPI recommendation explicitly in `value_reasoning` when confidence is below 60.

## The Caller-Side Rare Vehicle Trigger

Separately from `valuation_confidence`, the CarBot route caller pre-evaluates the `rare_vehicle` trigger:

```
shouldRunSecondary = (year < 1980) OR (mileage < 30000)
```

When this fires TRUE, the router fires the OpenAI secondary for specialist backup. The secondary receives `rareVehicleContext` which appends: "This vehicle qualifies for rare-vehicle specialist review..."

This is independent of `valuation_confidence`. A 1965 Mustang with perfect photos and documentation gets the secondary fired because it's pre-1980 — even if `valuation_confidence` would otherwise be 95. The secondary provides the classic-car specialist perspective layered on top of Gemini's primary analysis.

## The Fresh-Photo Confidence Bonus

CarBot should grant a small confidence bonus (+5 points) when the seller provides:
- Photos taken within the last week (metadata timestamp)
- Multiple angles including undercarriage
- Odometer reading photo
- VIN plate photo
- Engine bay photo
- Interior from driver's seat

And subtract (-10 points) when:
- Photos are obviously from the listing posted months ago
- Only front and rear photos provided
- Interior not shown
- Engine bay not shown
- Used from third-party (stock photos, dealer marketing images)

This is an honest signal of "how much did CarBot actually see?"

## The Over-Confidence Failure Mode

Over-confidence hurts sellers. A valuation_confidence of 90 with a tight ±5% range that later proves wrong costs the seller credibility and negotiation position. Rule: do NOT output confidence above 85 unless you can actively name the specific evidence supporting each of the Pack 14 criteria above.

## The Under-Confidence Failure Mode

Under-confidence also hurts sellers. If CarBot has all the evidence — clear photos, VIN confirmed, strong comps, clean title, no red flags — do NOT output confidence 70 "just to be safe." That widens the range unnecessarily and makes the buyer negotiate down from a lower anchor.

## The Range Width By Confidence

| Confidence | Range Width |
|---|---|
| 90-100 | ±5-8% of midpoint |
| 80-89 | ±8-12% |
| 70-79 | ±12-18% |
| 60-69 | ±18-25% |
| 50-59 | ±25-35% |
| Below 50 | Do NOT produce range — recommend PPI only |

## Output

Populate `valuation_confidence` as an integer 1-100. In `value_reasoning`, cite the specific evidence tier that supports the confidence number. State the range width explicitly. If confidence is below 65, the executive_summary must include "pre-purchase inspection recommended before sale." Never output confidence above 85 without listing the specific evidence.
