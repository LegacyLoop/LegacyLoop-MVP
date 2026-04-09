---
name: confidence-calibration
description: Standards for when to commit to an identification, when to hedge, and when to admit uncertainty. Covers threshold levels, secondary AI trigger logic, and the downstream impact of miscalibrated confidence scores.
when_to_use: Every AnalyzeBot scan.
version: 1.0.0
---

# Confidence Calibration Standards

## The Core Principle

Honest confidence is more valuable than confident dishonesty. A correctly calibrated 65% confidence score that says "I need to see the underside to confirm the maker's mark" is worth more to the seller than an overconfident 92% score that turns out to be wrong. Wrong high-confidence identifications cost sellers money, erode platform trust, and create downstream pricing errors that are hard to unwind.

Calibration means: if you assign 85% confidence to 100 different identifications, approximately 85 of them should be correct. That is the test. Not "how sure do I feel" but "what is my actual expected accuracy at this level."

## Confidence Threshold Standards

### Above 85%: Commit to the Identification

At this level you have seen enough independent confirming evidence to state the identification without qualification.

Required evidence for 85+: category confirmed by at least three independent features, maker attributed with strong direct evidence (visible mark, label, signature, or distinctive design element unique to that maker), era dated by at least two construction or style markers, condition scored with clear evidence for both cosmetic and functional sub-scores.

Language at this level: "This is a Federal-period mahogany bow-front chest of drawers, circa 1800-1820, attributed to New England craftsmen based on the secondary wood species (white pine) and dovetail construction."

### 70 to 84%: State with Hedging

At this level the identification is likely correct but one or more dimensions carry meaningful uncertainty.

Typical causes for this range: category clear but subcategory uncertain, maker probable but not confirmed by a direct mark, era estimated from style alone without construction confirmation, condition scoring with incomplete access to all surfaces.

Language at this level: "This is consistent with a late Victorian parlor chair, likely produced 1880-1900. The tufted velvet upholstery and carved walnut frame are consistent with the period, though I cannot confirm the manufacturer without seeing the underside of the seat."

### 50 to 69%: Best Guess with Explicit Uncertainty

At this level you have a working hypothesis but alternative identifications are plausible. State the best guess AND name the alternatives.

Typical causes: one unclear photo, item type you have seen before but this example is atypical, conflicting signals (style suggests one era, construction suggests another), generic form with no distinctive features.

Language at this level: "I believe this is most likely a mid-century American studio pottery vase, though it could also be a later production piece made in the studio style. A photo of the base would likely resolve this."

### Below 50%: Do Not Commit

At this level you cannot make a defensible identification. Do not name a category, maker, or era with confidence. Instead:

1. Describe exactly what you can see (color, approximate size, material appearance, visible markings).
2. Name what would resolve the uncertainty (specific photo angle, raking light, closer crop of a mark, description of heft or sound when tapped).
3. Set estimated_value_low/high to the widest reasonable range.
4. Flag for AnalyzeBot re-run in the output.

Language at this level: "I cannot confidently categorize this item from the available photos. The object appears to be ceramic, approximately 8-10 inches tall, with what may be a maker's mark on the base that is not legible in the current photos. A clear photo of the bottom in good light would allow a more complete assessment."

## When to Trigger Gemini Secondary Analysis

The router configuration has two triggers for the secondary AI pass: low_confidence and high_value.

Low confidence trigger: fires when your overall confidence score is below 60. This means any identification below the BRONZE threshold automatically gets a second opinion. Do not try to inflate confidence to avoid the secondary — the secondary exists precisely for these cases and improves final accuracy.

High value trigger: fires when estimated_value_mid is 500 or above. At this price point, the cost of a second AI opinion is negligible compared to the cost of a wrong identification. Set your value estimates accurately so this trigger fires when it should.

What happens in the secondary pass: Gemini receives the same photos and a summary of your primary analysis. It produces an independent assessment. The router then reconciles the two outputs — if they agree, confidence is upgraded. If they disagree, both assessments are preserved and the seller is shown a "conflicting assessments" notice with both interpretations.

Do not game the trigger thresholds. A 61% confidence to avoid the secondary, or a $495 value estimate to avoid the high_value trigger, produces a worse outcome for the seller.

## How Miscalibrated Confidence Breaks Downstream Bots

Overconfidence (claiming 90% when accuracy is actually 65%) causes:

- PriceBot uses a narrower comp band than is warranted, potentially setting the price too precisely for an uncertain identification.
- Specialist bots (AntiqueBot, CollectiblesBot, CarBot) fire based on your is_antique / is_collectible / is_vehicle flags — if those flags are wrong and your high confidence suppresses the secondary, the seller gets a wrong specialist analysis.
- ListBot writes a confident listing title and description based on a wrong identification — this creates buyer disputes when the item arrives and does not match the listing.

Underconfidence (claiming 45% when accuracy is actually 80%) causes:

- PriceBot uses a wide comp band, giving the seller a less actionable price range.
- The Gemini secondary fires unnecessarily, consuming credits.
- The seller loses confidence in the platform's ability to identify their items.

The ideal calibration error is symmetric: if you are going to be wrong, be wrong in a way that triggers the safety net (secondary AI, wider price band) rather than wrong in a way that suppresses it (overconfident wrong identification).

## The Five Calibration Questions

Before assigning a confidence score, answer these five questions:

1. How many independent features confirm the category? (One feature: cap at 70. Two features: up to 80. Three or more: up to 95.)

2. Is there any direct evidence of the maker, or is it attributed by style? (Direct mark or label: adds 10 points. Style attribution only: caps at 80 absent other evidence.)

3. Could this be a reproduction or later production piece? (If yes and you cannot rule it out: cap at 75.)

4. Do I have access to all the diagnostic angles? (Missing bottom: subtract 5. Missing interior: subtract 5. Only one photo available: subtract 15.)

5. Have I seen this exact item type before, or is this outside my strongest identification areas? (Familiar type: no adjustment. Unfamiliar type: subtract 10.)

Sum the adjustments from a baseline of 90 and that is your starting confidence score. Then ask: "If I made 100 identifications like this one, how many would be correct?" Adjust accordingly.

## Communicating Uncertainty to the Seller

The seller interface displays your confidence score. How you frame uncertainty matters for seller trust and platform experience.

Productive uncertainty framing: "I can see this is likely a Federal-period piece, but I would like to see a photo of the secondary wood to confirm. Can you photograph the interior of a drawer?"

Unproductive uncertainty framing: "I don't know what this is." This tells the seller nothing actionable.

The seller should always leave the analysis knowing exactly what additional information would improve the assessment, even if the current confidence is low. Every low-confidence output should include at least one specific, actionable request for clarifying information.
