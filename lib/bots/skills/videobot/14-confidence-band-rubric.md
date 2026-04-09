---
name: confidence-band-rubric
description: VideoBot-specific extension of the general confidence rubric from _shared/03-confidence-rubric.md. Defines GOLD, SILVER, BRONZE, and NOT_READY script quality bands with calibrated scoring criteria across hook strength, body completeness, CTA specificity, platform-native formatting, and item data quality. Covers MegaBot consensus thresholds and escalation to human script review.
when_to_use: "Every VideoBot scan."
version: 1.0.0
---

# Video Script Confidence Band Rubric

## Relationship to the Shared Rubric

This pack extends _shared/03-confidence-rubric.md with VideoBot-specific calibration. The shared rubric defines the general confidence scoring framework across LegacyLoop's AI bot system. This pack applies that framework to video script quality assessment specifically.

All VideoBot confidence scores are generated on a 0-100 scale. The score reflects script quality and readiness for publication, not item value or identification confidence. A low-value item can have a GOLD confidence script. A high-value item can have a NOT_READY script if insufficient item data was available to build a compelling narrative.

## The Five Scoring Dimensions

VideoBot calculates confidence across five dimensions. Each dimension contributes a weighted portion to the final score.

### Dimension 1: Hook Strength (25 points maximum)

The hook is the first 3-7 seconds of the script. It determines whether the viewer stops scrolling or continues. Hook strength is assessed on two criteria: scroll-stopping specificity and emotional engagement.

25 points: The hook is specific, platform-native, and immediately frames the item in a way that creates curiosity or desire. Examples: a barn find reveal sentence, a specific auction comparable stated immediately, a rarity claim supported by data, a cold start engine sound as the video's opening.

20-24 points: The hook is strong and specific but not fully optimized for the target platform. Would perform well but has a identifiable improvement.

15-19 points: The hook is present and relevant but generic. Uses category language without item-specific specificity. "Look at this incredible antique I found" rather than "This is a signed Federal-period Philadelphia chair from before 1800."

10-14 points: The hook is weak. Opens with seller introduction, context-setting, or disclaimer rather than with the item itself.

0-9 points: No effective hook. Script opens with something that actively loses viewer attention — a slow pan, an apology, a disclaimer, excessive setup before the item is revealed.

### Dimension 2: Body Completeness (25 points maximum)

The body is the 15-60 seconds between hook and CTA. It tells the full story of the item. Body completeness is assessed on how thoroughly available item data is integrated into the narrative.

25 points: All available AntiqueBot, CollectiblesBot, CarBot, and PriceBot data is integrated. Authentication findings are translated into human-scale language. Condition is described specifically. Provenance is stated when available. Auction comparables are cited when available. The body answers every question a qualified buyer would have before making contact.

20-24 points: Most available data is integrated. One or two data points are missing or could be more specifically stated.

15-19 points: Core item description is present but bot-data integration is incomplete. Misses key data points that were available from enrichment.

10-14 points: Generic description that could apply to any item in the category. Does not integrate specific item data. A collector viewing this video would not learn anything they could not infer from the category alone.

0-9 points: Body is missing, too short to convey meaningful information, or contains inaccurate claims that conflict with bot data.

### Dimension 3: CTA Specificity (20 points maximum)

The CTA is the last 3-7 seconds. It converts viewers into leads. CTA specificity is assessed on clarity of action, platform appropriateness, and conversion mechanics.

20 points: CTA uses a specific keyword trigger, names exactly what the buyer will receive by DMing, and is platform-native in format. For vehicle scripts, LOCAL PICKUP ONLY is present.

16-19 points: CTA is clear and effective but missing one element (no keyword, or not fully platform-native, or missing vehicle pickup requirement).

12-15 points: CTA is present but generic. "DM me for info" or "Link in bio" without item-specific language.

8-11 points: CTA is weak or mismatched to platform. Uses "comment below" on YouTube where DM is more effective, or uses "link in bio" on TikTok where comment CTAs perform better.

0-7 points: No effective CTA, or CTA contains desperation language that would undermine buyer confidence.

### Dimension 4: Platform-Native Formatting (15 points maximum)

Platform-native formatting means the script sounds, paces, and structures itself in the way that the target platform's most successful content does. A TikTok script has different pacing than a YouTube script. An Instagram Reel has different duration norms than a Facebook video.

15 points: Script length, pacing, language register, and structural choices are all appropriate for the target platform. A collector on that platform would recognize the video as fluent in the community's content conventions.

12-14 points: Mostly platform-native with minor mismatches. Script is slightly too long or uses language that belongs on a different platform.

9-11 points: Platform awareness is present but incomplete. Length may be off, or the script uses a structure that performs better on a different platform.

5-8 points: Script was written for a generic audience without platform-specific calibration. Could be read on any platform with similar (mediocre) results.

0-4 points: Script is actively wrong for the target platform. Uses YouTube long-form pacing on TikTok, or uses TikTok slang on Facebook's 35+ demographic, or writes a 90-second script for a 30-second Reel format.

### Dimension 5: Item Data Quality (15 points maximum)

This dimension reflects how much usable input data was available from the item's analysis pipeline. It is the only dimension that is partially outside VideoBot's control — if other bots have not run, or if the item has minimal description and poor photos, the script will have less material to work with.

15 points: Full enrichment data available. AntiqueBot, CollectiblesBot or CarBot (as appropriate), and PriceBot have all run. Multiple high-quality photos were analyzed. Item description provides context. The script had complete raw material.

12-14 points: Most enrichment data available. One bot's output is missing or incomplete but the remaining data is sufficient for a strong script.

9-11 points: Partial enrichment. Two or more bots have not run, or photo quality limited AI analysis. The script is working with category-level information rather than item-specific data.

5-8 points: Minimal enrichment. Only basic item information is available. The script must rely heavily on category conventions rather than specific item data.

0-4 points: Insufficient data. The item has a vague description, no usable photos, and no bot enrichment. A specific, compelling script cannot be generated from this input.

## Confidence Bands

### GOLD (85-100 points): Viral-Ready

A GOLD script is ready to publish without further review. It has a scroll-stopping hook, fully integrates all available item data into the body, has a specific and platform-native CTA, matches the pacing and language conventions of the target platform, and was built from complete item data.

GOLD scripts should be published with confidence. When MegaBot consensus confirms GOLD across four AI evaluations, the seller can post immediately.

GOLD does not mean perfect. It means publication-ready, likely to perform well, and unlikely to damage the seller's credibility or the platform's trust.

### SILVER (70-84 points): Solid Performance

A SILVER script will perform well and is safe to publish. It has identifiable improvements available but is not impaired by any critical weakness. The seller can choose to publish as-is or invest 5-10 minutes refining the specific dimension where points were lost.

SILVER most commonly results from incomplete bot enrichment (item data quality dimension) or a CTA that is clear but not optimized. Both are correctable.

When MegaBot returns SILVER consensus, VideoBot surfaces the specific dimension causing the score gap and offers a targeted refinement prompt.

### BRONZE (50-69 points): Functional but Generic

A BRONZE script will not damage the sale but will not accelerate it either. The content is accurate and presentable but lacks the specificity and platform optimization that drives engagement. A BRONZE script performs like an average listing description read aloud — better than silence, not better than a SILVER script.

BRONZE most commonly results from insufficient item data (the item has not been run through the full analysis pipeline) or from a hook that is too generic to stop scrolling.

When MegaBot returns BRONZE consensus, VideoBot strongly recommends running the missing analysis bots before publishing the video. An item that has not been through AntiqueBot or PriceBot does not have the specific data needed for a compelling script.

### NOT_READY (0-49 points): Do Not Publish

A NOT_READY script should not be published. It either lacks sufficient item data to generate a truthful, specific narrative, or it contains structural weaknesses that would actively harm the seller's credibility.

Common NOT_READY causes:
- Item has only a brief text description and no photos analyzed
- No bot enrichment has run on the item
- The item category is ambiguous and no category-appropriate script structure could be applied
- Available data contains contradictions that VideoBot cannot resolve without human review

When a script scores NOT_READY, VideoBot returns a diagnostic explaining the specific data gaps and recommending which bots to run before attempting script generation again.

## MegaBot Consensus Protocol

VideoBot participates in the MegaBot multi-AI system alongside the other five bots. When four or more AI evaluations of the same script agree on a confidence band, that consensus is treated as authoritative.

Consensus rules:
- Four-AI agreement on GOLD: publish with full confidence
- Four-AI agreement on SILVER: publish with targeted refinement recommendation
- Split between GOLD and SILVER across AIs: publish as SILVER, surface the specific disagreement for seller awareness
- Any AI scoring NOT_READY when others score BRONZE or higher: hold for human review
- Three or more AIs scoring NOT_READY: do not publish, return full diagnostic

## Human Script Review Escalation

Certain scenarios require human review regardless of confidence score:

- Any high-value item (estimated above $5,000) where confidence is below GOLD
- Any item where provenance claims appear in the script and cannot be verified by bot data
- Any vehicle script where CarBot returned conflicting title or odometer data
- Any item where the seller has added manual notes that conflict with AI analysis findings
- Any script that references a specific named individual (living person) as provenance source

Human review is not a failure state. It is the appropriate response when the stakes are high enough that a SILVER script is not good enough, or when data conflicts prevent confident automated resolution.
