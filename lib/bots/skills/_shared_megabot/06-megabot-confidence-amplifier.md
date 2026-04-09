---
name: megabot-confidence-amplifier
description: How 4-AI consensus amplifies or attenuates confidence. When four agents agree, the effective confidence is higher than any single agent's score. When they disagree, it is lower. The amplification formula. The narrow-band unlock. The wide-band warning.
when_to_use: Every MegaBot scan. Loaded ONLY under MegaBot. Complements Pack 04 (consensus-engine) and Pack 05 (disagreement-protocol) with the confidence math.
version: 1.0.0
---

# MegaBot Confidence Amplifier — Four Opinions Are Worth More Than One

The fundamental promise of MegaBot is that four independent AI opinions, reconciled through a merge algorithm, produce a MORE TRUSTWORTHY result than any single AI. This pack defines how confidence is amplified when agents agree and attenuated when they disagree. The result is a consensus confidence score that is BETTER CALIBRATED than any individual agent's score.

## The Core Principle: Agreement Amplifies, Disagreement Attenuates

When you produce your output, you assign confidence scores to individual fields (maker_confidence, year_confidence, condition_confidence, valuation_confidence, etc.). The merge algorithm reads these scores from all four agents and computes a consensus confidence using the amplification formula below.

### The Amplification Formula

For any numeric confidence field where all four agents return a value:

```
consensus_confidence = median(agent_scores) × amplification_factor

amplification_factor =
  spread < 5 points  → 1.15 (tight agreement = 15% uplift)
  spread 5-10 points → 1.08 (moderate agreement = 8% uplift)
  spread 10-15 points → 1.00 (no change)
  spread 15-25 points → 0.90 (moderate disagreement = 10% reduction)
  spread > 25 points  → 0.75 (high disagreement = 25% reduction)

where spread = max(agent_scores) - min(agent_scores)
capped at 100 (consensus_confidence never exceeds 100)
```

**What this means for you**: If you and the other three agents all score maker_confidence between 82 and 87 (spread of 5), the consensus maker_confidence becomes approximately median(84) × 1.15 = 97. Four agents agreeing at 84 is worth MORE than a single agent claiming 97 — because the agreement IS the evidence.

Conversely, if scores range from 45 to 90 (spread of 45), the consensus becomes approximately median(67) × 0.75 = 50. The wide spread ITSELF is evidence of uncertainty. The consensus rightly attenuates.

## Why This Matters For Your Output

Because of the amplification formula, your individual confidence scores do not need to be "high to win." They need to be HONEST. If you honestly score a field at 75 and the other three agents also score it at 73-78, the consensus will amplify to approximately 88 — a tight consensus that none of you individually claimed. That is the power of calibrated agreement.

If you inflate your confidence to 95 when your honest reading is 75, you create a spread of 20+ points (the other three agents who scored honestly are at 73-78 while you are at 95). This WIDENS the spread and REDUCES the consensus confidence. Your inflation actually HURT the result.

**The incentive structure is: honest calibration produces the best consensus.**

## The Narrow-Band Unlock

For bots that have confidence bands (AntiqueBot, CollectiblesBot), the post-processor maps confidence to price bands:

```
confidence ≥ 90  → narrow band (±10%)
confidence 70-89 → standard band (±15%)
confidence < 70  → wide band (±40%)
```

Under single-AI mode, reaching the narrow band requires ONE agent at 90+. Under MegaBot, the amplification formula means that four agents agreeing at 80-85 ALSO reach the narrow band (because 82 × 1.15 = 94). This is the narrow-band unlock: consensus agreement at a moderate individual confidence level produces a tight, trustworthy band that no single agent could justify alone.

This is one of the key value propositions of MegaBot for high-value items: the consensus can justify a tighter price band, which gives the seller more confidence in their asking price and the buyer more confidence in their bid.

## The Wide-Band Warning

When the amplification formula produces a consensus confidence below 50 (which requires either very low individual scores OR very high disagreement), the output should include an explicit warning to the seller:

- "MegaBot consensus confidence is LOW for [field]. The four AI agents disagreed significantly on this assessment. We recommend an in-person specialist opinion before using this estimate for pricing or consignment."

You do not produce this warning yourself (the merge algorithm generates it from the consensus scores). But you should understand that your individual confidence score contributes to whether this warning fires. If you are genuinely uncertain about a field, score it honestly low — the warning system exists to protect the seller from false precision.

## Per-Field Confidence Independence

Different fields can have different confidence levels within the same scan. A typical MegaBot output might show:

```
maker_confidence:      92 (all four agents identified the same maker)
year_confidence:       78 (three agents said 1820-1830, one said 1850)
condition_confidence:  85 (tight agreement on Very Good grade)
valuation_confidence:  65 (significant spread on price estimates)
```

This is normal and GOOD. The seller sees: "We are very sure about the maker. We are fairly sure about the date. We agree on the condition. But the market for this specific item is uncertain." That honesty is the product.

## The "Consensus Validated" Label

When the consensus confidence on ALL key fields (maker, date, condition, valuation) exceeds 80, the output earns the "Consensus Validated" label. This label means:
- Four independent AIs agreed on all key assessments
- The confidence amplification formula verified tight spreads
- The output is materially more trustworthy than a single-AI scan

This label is the premium product. It is what justifies the 7-credit price. It should be rare enough to be meaningful (approximately 40-60% of MegaBot scans) and common enough to justify the upgrade.

## Your Role In Confidence Amplification

As one of four agents, your contribution to the amplification formula is:
1. **Honest calibration** — score each field based on your actual evidence, not on what you think "sounds right." See the shared confidence-rubric (Pack 03) for the full calibration scale.
2. **Complete field coverage** — missing fields count as abstentions and reduce the number of agents contributing to the consensus. A 3-agent consensus is weaker than a 4-agent consensus even if the spread is tighter.
3. **Evidence-backed scores** — a confidence score without cited evidence is an opinion. A confidence score WITH cited evidence (specific comp, specific mark, specific diagnostic) is a data point. Data points produce stronger consensus.
4. **Dissent notes on outliers** — if your score diverges from what you expect the median to be, write a `_dissent_note` explaining why (see Pack 05). The merge algorithm uses these notes to decide whether to treat your score as an outlier or as a legitimate divergent reading.

## The Feedback Loop

Every MegaBot scan is logged with per-agent confidence scores and the final consensus confidence. Over time, this data allows LegacyLoop to:
- Identify which agents are consistently over-confident or under-confident
- Tune the amplification formula based on real outcomes
- Route specific item categories to the agents that are most accurate for that category
- Measure the actual value-add of MegaBot over single-AI scans

Your honest calibration today trains the system tomorrow. Inflate your confidence and you corrupt the training data. Calibrate honestly and you make every future MegaBot scan better.

## Output

Populate every `_confidence` field with an honest 0-100 score. Cite the specific evidence that supports each score. When you suspect your score will diverge from the consensus, add a `_dissent_note`. Do not inflate. Do not deflate. The amplification formula rewards honesty, not ambition.
