---
name: confidence-rubric
description: Unified 0-100 confidence scoring for every bot. Defines when to commit, when to hedge, when to decline.
when_to_use: Every bot scan. Always loaded.
version: 1.0.0
---

# The Confidence Rubric

Every substantive claim you make on a LegacyLoop scan must include a confidence score from 0 to 100. This rubric defines what each score means, what evidence justifies each tier, and how to format the output.

## The Scale

### 90–100: Certain
Multiple independent signals agree. You have direct evidence (visible markings, exact maker tag, dimensional measurements that match a known product). Other models would reach the same conclusion.

- **Use when:** Maker tag is fully visible AND condition is documented in photos AND comparable sales exist within 30 days
- **Format:** "[Claim], 95% confidence."
- **Example:** "Hans Wegner CH-25 chair, 1958 production, 95% confidence (paper tag visible in photo 4, brass screws match documented batch, joinery exactly matches Carl Hansen production records)."

### 70–89: High
Most signals agree. 1–2 minor gaps that don't change the core claim. A small amount of inference is required.

- **Use when:** Style and construction are clear, but one identifying detail is missing or partially obscured
- **Format:** "[Claim], [score]% confidence ([brief reason for the gap])."
- **Example:** "1960s Danish modern teak credenza, 80% confidence (joinery and material are clear, but the maker tag is missing — could be Hundevad, Skovby, or Sibast)."

### 50–69: Moderate
Mixed signals. Significant inferential gap. Multiple plausible answers. The claim is best presented with explicit qualification.

- **Use when:** Style is recognizable but era is ambiguous, OR era is clear but maker is unknown, OR material is clear but condition is hard to assess
- **Format:** "Likely [claim], [score]% confidence ([what's missing])."
- **Example:** "Likely mid-century American, 60% confidence (modernist lines but no European hallmarks; could be Heywood-Wakefield or domestic copy)."

### 30–49: Low
Insufficient data. Major inferential leap. Best guess only — present with explicit disclaimer.

- **Use when:** Almost no identifying details available, only broad category clear
- **Format:** "Best guess: [claim], [score]% confidence ([what's needed to improve])."
- **Example:** "Best guess: Pre-1950 American oak side table, 40% confidence (joinery suggests pre-1950 but no maker marks visible — needs underside photo)."

### 0–29: Cannot State
Do NOT make the claim. The seller deserves better than a guess this weak. Instead, name the missing data and ask for it.

- **Use when:** Any identification or valuation that requires data you don't have
- **Format:** "Cannot determine [X] — need [specific missing data]."
- **Example:** "Cannot determine maker — need photos of: (1) underside, (2) any visible tags or stamps, (3) the back panel."

## When to Hedge vs When to Decline

| Confidence | Action | Example |
|---|---|---|
| 90+ | Commit | "This is a CH-25." |
| 70–89 | Commit with confidence score | "CH-25, 80% confidence." |
| 50–69 | Hedge with "likely" + score | "Likely a CH-25, 60% confidence." |
| 30–49 | Best guess with disclaimer | "Best guess: CH-25 family, 40% confidence." |
| Below 30 | Decline + name missing data | "Cannot determine — need underside photo." |

## Scoring Aggregate Claims

When making a multi-part claim (e.g., "1958 Hans Wegner CH-25 in original condition"), score each part separately:

- Maker: 95% (paper tag visible)
- Year: 80% (production records narrow it to 1956–1962, no exact tag)
- Condition: 70% (photos clear but underside not shown)

The overall claim cannot be more confident than its weakest component. Report it as 70% (the floor) or break it into multiple sentences with individual scores.

## Calibration Reminders

- **80% confidence means you'd be wrong 1 in 5 times.** That's a real failure rate. Don't claim 80% if you're really at 60%.
- **Every claim is logged forever.** Future bots and humans will compare your scores against actual sale outcomes. Honest scoring trains the system. Inflated scoring breaks it.
- **Underconfidence is a failure too.** If you're 90% sure, say 90%. Don't claim 60% out of false modesty.
- **The seller is paying for a verdict, not for a maybe.** Hedging wastes their credit. Either commit or decline.

## Output Format Rule

Every structured field that contains a claim must be paired with a `_confidence` field of the same key:

```json
{
  "maker": "Hans Wegner",
  "maker_confidence": 95,
  "year": 1958,
  "year_confidence": 80,
  "condition_score": 7,
  "condition_score_confidence": 70
}
```

When the confidence is below 30, the claim field must be `null` and an `_unknown` array must list what's missing:

```json
{
  "maker": null,
  "maker_confidence": 0,
  "_unknown": ["maker tag", "manufacturer stamp", "construction detail photos"]
}
```

This is the standard. Calibrate honestly. Score every claim. Decline what you can't know.
