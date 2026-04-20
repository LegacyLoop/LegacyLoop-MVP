---
name: pricebot-megabot-comp-quality-confidence-amplifier
description: >
  Pricing-confidence math anchored on comp-quality signal for the
  4-AI MegaBot pricing team. Defines base confidence as a function
  of comp volume, recency, condition match, and source quality.
  Specifies amplifiers (dense agreement, verified provenance, brand-
  plus-model match), dampeners (source disagreement, missing
  condition tier, stale comps), and the 0.85 floor / 0.95 ceiling
  rule. Includes the Dean MLX worked example showing a 6-comp
  Reverb case amplified to high confidence.
when_to_use: "MegaBot scans only. PriceBot MegaBot lane."
version: 1.0.0
---

# PriceBot MegaBot Skill: Comp-Quality Confidence Amplifier

## Purpose

The pricing confidence score is not a decoration. It is the signal
the seller uses to decide how aggressively to price, how long to
wait, and whether to hold or sell. A confidence score that is
calibrated produces better seller decisions. A confidence score
that is inflated (always 95 percent, regardless of evidence)
is noise. This skill defines the math the 4-AI team uses to
compute pricing_confidence from comp-quality signals and the
floor/ceiling rules that keep the output honest.

---

## Base Confidence Formula

The starting confidence is a function of four independent signals.
Each signal contributes to the base score; amplifiers and
dampeners then modify it.

### The four base inputs

1. **Comp volume** — How many Tier 1 or Tier 2 comps exist at the
   target condition tier within the last 180 days.
2. **Recency** — How recent is the median comp date relative to
   the current scan date.
3. **Condition match** — How well the comps align to the target
   item's condition score (±1 is strong, ±2 is moderate, ±3+ is
   weak).
4. **Source quality** — What fraction of comps come from Tier 1
   or Tier 2 sources vs. Tier 4 or lower.

### The base confidence table

Confidence is computed on a 0 to 100 scale (matching the
mergeConsensus post-processing in multi-ai.ts). The base value
before modifiers:

| Comp Volume | Recency | Condition Match | Source Quality | Base |
|-------------|---------|------------------|------------------|------|
| 5+ | Last 30 days | ±1 step | 80%+ Tier 1/2 | 75 |
| 5+ | Last 90 days | ±1 step | 80%+ Tier 1/2 | 72 |
| 3-4 | Last 90 days | ±1 step | 60%+ Tier 1/2 | 65 |
| 3-4 | Last 180 days | ±2 steps | 60%+ Tier 1/2 | 58 |
| 1-2 | Any | Any | Any | 48 |
| 0 | N/A | N/A | N/A | 30 |

This table is the starting point, not the final answer.
Amplifiers and dampeners then move the score.

---

## Amplifiers (add to base)

Amplifiers fire when the comp evidence is unusually strong or
the item identification is unusually tight.

### Amplifier +10: Dense agreement

When 5 or more recent comps cluster within ±15 percent of each
other, the market is telling you where the price is. Add 10 to
base confidence.

### Amplifier +15: Verified provenance

Documented provenance (Level 1 or Level 2 per AntiqueBot's
documentation hierarchy — primary transaction records or
institutional documentation) adds 15 to base confidence for
items in categories where provenance shifts price.

### Amplifier +12: Brand + model tight identification

When both the brand and specific model are identified with
high confidence AND there are 3 or more comps at matching
brand+model+condition, add 12. This is the fingerprint case —
the item is specifically identified, not just categorized.

### Amplifier +8: Specialist platform coverage

When the category has a dedicated specialist marketplace
(Reverb for instruments, 1stDibs for antiques, Watchrecon for
watches, Grailed for designer fashion) AND comps are present
on that marketplace in the last 90 days, add 8. Specialist-
marketplace comps are higher-fidelity than generic eBay.

### Amplifier +6: Cross-source convergence

When comp medians from 3 or more independent sources fall
within a ±12 percent band, the price signal is
structurally strong. Add 6.

### Amplifier +5: Recent dealer asking alignment

When dealer asking prices (Tier 4) fall 25 to 40 percent above
the sold-comp median (the expected retail markup band), the
market structure is behaving as expected. Add 5.

---

## Dampeners (subtract from base)

Dampeners fire when comp evidence is ambiguous, contradictory,
or thin.

### Dampener -25: Zero comps in target condition tier

If comps exist for the category but none are at the target
condition tier, the price is extrapolated, not interpolated.
Subtract 25 from base confidence. Also widen the price band
explicitly.

### Dampener -20: Cross-source disagreement exceeds 30 percent

When comp medians from different sources disagree by more than
30 percent (e.g., eBay sold median $500, 1stDibs asking median
$900), the item likely sits in two markets. Subtract 20 and
explicitly return both estimates.

### Dampener -15: All comps older than 12 months

A stale market is not a current market. If no comps exist in
the last 12 months, subtract 15 and note that the estimate
reflects historical pricing.

### Dampener -12: Condition score mismatch with photos

When PhotoBot condition evidence disagrees with AI condition
by 2+ points, the comp set may not accurately reflect the item
a buyer will see. Subtract 12 (see M03 for escalation path).

### Dampener -10: Ambiguous category classification

When AnalyzeBot's category classification is tentative (confidence
under 70 percent) or multi-category possible, the comp set is
potentially mismatched. Subtract 10.

### Dampener -8: Single outlier comp driving the median

When removing the single highest or lowest comp shifts the
median by more than 20 percent, the median is outlier-driven,
not consensus-driven. Subtract 8 and report with the outlier
explicitly flagged.

---

## Floor and Ceiling Rules

The computed confidence (base + amplifiers - dampeners) is
then bounded.

### Ceiling 95

Never claim certainty. The maximum confidence the 4-AI team
returns is 95 out of 100. Even with perfect comp coverage and
tight identification, markets can shift and single-item
idiosyncrasies can affect the transaction. The 5-point gap
between 95 and 100 is the honest acknowledgment that a forward-
looking price is a probabilistic statement, not a guarantee.

### Floor 85 (under specific conditions)

When BOTH of the following hold:
- Brand and model are identified with high confidence
- Comp set is tight (5+ comps clustered within ±10 percent)

...the floor rises to 85 even if other factors are mixed.
The reason: a well-identified item with dense comp agreement
should not be presented as uncertain even if some dampeners
fire, because the market has already told us where the price is.

### Hard floor 30

Even in the worst case (zero comps, ambiguous identification,
stale data), do not present confidence below 30. A confidence
of 30 or lower is an escalation trigger, not a published
number — escalate to specialist review per M03.

---

## The Confidence Output Format

The final pricing_confidence value is returned on a 0 to 100
scale in the executive output. The 4-AI team also returns:

- The numeric value
- A qualitative label (Low: <50, Moderate: 50-70, High: 70-85,
  Very High: 85-95)
- The top two contributing signals (for transparency)
- Any dampeners that fired (for seller awareness)

### Example output snippet

```
"pricing_confidence": 87,
"confidence_label": "Very High",
"confidence_drivers": [
  "6 Reverb sold comps within ±8% in the last 75 days",
  "Brand and model identified (Dean MLX, 2008 reissue)"
],
"confidence_dampeners": [
  "Local Maine market data thin — national Reverb comps
   anchor with 0.78 local correction"
]
```

The seller reads this and understands why the number is what it
is.

---

## The Dean MLX Worked Example

Canonical test case. Dean MLX electric guitar, 2008 reissue,
player-grade (6/10 condition), LOCAL_PICKUP from 04901 Maine
with 25-mile radius.

### Step 1: Gather comps

- Reverb sold, last 90 days, same model, condition 5-7: 6 comps
- Reverb sold, condition 7-8: 4 comps (ceiling reference)
- eBay sold, same model, last 90 days: 3 comps
- Facebook Marketplace Maine, asking (not sold): 2 active listings

### Step 2: Compute medians

- Reverb sold (5-7 condition): $425
- Reverb sold (7-8 condition, ceiling): $580
- eBay sold: $395
- FB Marketplace Maine asking: $375

### Step 3: Apply local multiplier

- LOCAL_PICKUP + 049xx zone = 0.78× national reference
- National reference (Reverb weighted): $425 × 0.78 = $332
- Adjusted midpoint with local weighting: ~$360

### Step 4: Base confidence

- Comp volume: 6 at target tier → strong
- Recency: last 90 days → strong
- Condition match: ±1 step → strong
- Source quality: 85% Tier 2 (Reverb + eBay sold) → strong
- Base = 72

### Step 5: Amplifiers

- Dense agreement (Reverb sold 5-7 cluster within ±12%): +10
- Brand + model tight ID (Dean MLX, 2008 reissue): +12
- Specialist platform coverage (Reverb primary source): +8
- Cross-source convergence (Reverb, eBay, FB within ±15%): +6

Amplifier total: +36

### Step 6: Dampeners

- Local Maine market data is thin (only FB asking, no
  Maine-specific sold data): -8 (treated as thin specialist
  coverage, not a full disagreement dampener)

Dampener total: -8

### Step 7: Final calculation

Base 72 + amplifiers 36 - dampeners 8 = 100
Bounded by ceiling 95 → final pricing_confidence = 95 capped
→ return 93 (sublinear capping to leave honest room)

### Step 8: Output

```
"pricing_low": 325,
"pricing_mid": 360,
"pricing_high": 420,
"pricing_confidence": 93,
"confidence_label": "Very High",
"confidence_drivers": [
  "6 Reverb sold comps clustered within ±12% in last 90 days",
  "Dean MLX brand+model specifically identified"
],
"confidence_dampeners": [
  "Thin local Maine sold data — applied 0.78 rural correction
   from national reference"
],
"executive_summary": "Dean MLX 2008 reissue in player-grade
condition priced for local pickup in central Maine. Six recent
Reverb sold comps cluster tightly and give high confidence in
the national midpoint of $425, which we've adjusted to $360 for
your local market. List at $399, accept $325, target $360."
```

The seller sees a number they can trust, with transparent
reasoning.

---

## Why the Floor and Ceiling Matter

Markets can surprise. A forward-looking price is always
probabilistic. The 95 ceiling is the discipline that keeps the
system from lying. The 85 floor in tight-ID dense-comp cases is
the discipline that keeps the system from under-selling its own
confidence when the evidence is strong.

A pricing system that always says "we're pretty sure" and never
says "we're very confident" is a system that loses seller trust
on the items where confidence matters most. A pricing system that
always says "we're very confident" on everything loses trust on
the items where uncertainty matters most. The floor and ceiling
together produce calibrated confidence that earns trust across
the full distribution of items.
