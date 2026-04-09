---
name: sequencer-trigger-standards
description: How AnalyzeBot's output drives the bot sequencer. Covers trigger conditions for each specialist bot, the three boolean flags that control the entire cascade, sequencer enable/disable logic, and the cost consequences of wrong flag values.
when_to_use: Every AnalyzeBot scan.
version: 1.0.0
---

# Sequencer Trigger Standards

## The Sequencer as the Platform's Nervous System

The bot sequencer is the system that decides which bots run after AnalyzeBot completes. It reads AnalyzeBot's output and fires downstream bots based on what it finds. AnalyzeBot does not directly control which bots run — it sets the fields that the sequencer reads, and the sequencer makes the routing decisions.

This means AnalyzeBot's output is not just an analysis result for the seller to read. It is also a routing manifest for the entire bot pipeline. Every field that influences routing must be populated accurately.

The sequencer is disabled by default. The environment variable AUTO_SEQUENCE_ENABLED must be set to enable the cascade. When enabled, AnalyzeBot's output triggers a chain of events that can cost the seller between $4 and $17.75 in downstream bot credits. When disabled, the seller or admin must manually trigger each specialist bot.

Whether the sequencer is enabled or disabled, the quality of AnalyzeBot's output determines the quality of every downstream result.

## Current Sequencer Flow

Step 1: AnalyzeBot completes. Output written to AiResult.

Step 2: PriceBot fires. This step is unconditional — PriceBot runs after every AnalyzeBot completion without exception.

Step 3: Parallel conditional firings. After PriceBot completes, the following bots fire in parallel based on conditions read from the AiResult: ListBot, BuyerBot, and all applicable specialist bots (AntiqueBot, CollectiblesBot, CarBot).

Step 4: ReconBot fires indirectly. ReconBot is triggered by the ListBot and BuyerBot chain completing, not directly by AnalyzeBot.

Step 5: PhotoBot is not currently in the sequencer. Photo quality issues detected during analysis should be noted in the output for future sequencer integration, but PhotoBot does not fire automatically in the current build.

Step 6: VideoBot is not in the current sequencer. It is triggered manually only.

## Trigger Conditions for Each Specialist Bot

### PriceBot — Always Triggered

No conditions. PriceBot runs after every AnalyzeBot completion. The only way PriceBot does not run is if AnalyzeBot fails to complete.

AnalyzeBot's responsibility to PriceBot: populate all enrichment chain fields accurately, especially category, subcategory, brand, condition_score, and estimated_value_low/mid/high. These are PriceBot's primary inputs for comp selection.

### AntiqueBot — Conditional Trigger

AntiqueBot fires when ANY of the following conditions are true:

is_antique=true in the AnalyzeBot output.
estimated_age_years >= 50 (the extended trigger — items that may qualify as antiques within a decade, or that have significant age-related value, also get AntiqueBot scrutiny).
antique_markers.length >= 3 (even if is_antique is false, three or more antique markers indicates an item that deserves expert antique evaluation).

AntiqueBot does NOT fire when: is_antique=false AND estimated_age_years < 50 AND antique_markers.length < 3.

The most common trigger miss: setting is_antique=false on an item that is 60-80 years old because it does not meet the 100-year US Customs standard. The extended trigger of estimated_age_years >= 50 exists precisely for these items — they have age-related value even if not technically antique by the strictest definition.

### CollectiblesBot — Conditional Trigger

CollectiblesBot fires when is_collectible=true in the AnalyzeBot output.

The is_collectible flag is also set by keyword detection in the router — if the item_name or keywords[] contain known collectible category terms (vintage toy, sports memorabilia, coin, stamp, record, comic, first edition, limited edition, signed), the router may override is_collectible=false with is_collectible=true and fire CollectiblesBot regardless.

This means AnalyzeBot's keyword population is a backup path for CollectiblesBot triggering. If you correctly identify an item as collectible but fail to set is_collectible=true, a robust keywords[] array may still trigger the bot.

Best practice: set is_collectible=true explicitly rather than relying on keyword detection as a fallback.

### CarBot — Conditional Trigger

CarBot fires when is_vehicle=true AND the item is NOT outdoor equipment.

This conjunction is critical. The outdoor equipment exclusion defined in Pack 09 must be correctly applied before is_vehicle is set. Setting is_vehicle=true on a riding mower fires CarBot unnecessarily.

CarBot also triggers the license plate blur pipeline. A riding mower identified as a vehicle will trigger a plate blur scan on photos that may not contain a plate — this is wasted processing and does not harm the seller, but it is a visible symptom of a classification error.

When is_vehicle=true is correctly set: CarBot receives the item's photos, performs make/model/year matching, pulls Hagerty and NADA market values, checks for VIN-equivalent identifiers, and flags any salvage, flood, or title concern indicators visible in the photos.

### ListBot — Post-PriceBot Trigger

ListBot fires after PriceBot completes. It reads from both the AiResult and the Valuation record PriceBot writes.

ListBot's output quality scales directly with AnalyzeBot's enrichment. A complete AiResult with 10+ keywords, confirmed maker, era, style, and material produces a listing that requires no seller editing. An incomplete AiResult produces a listing stub that the seller must manually complete.

### BuyerBot — Post-PriceBot Trigger

BuyerBot fires in parallel with ListBot after PriceBot completes. It uses category, condition_score, estimated_value_mid, and keywords[] to generate initial buyer lead matches.

High-quality keywords are particularly important for BuyerBot — it uses them to match against registered buyer interests and marketplace buyer profiles.

## The Three Most Important Booleans in the Platform

These three boolean flags in AnalyzeBot's output control which specialist bots fire. Each wrong value has a measurable financial cost.

is_antique: controls AntiqueBot. A false negative (antique item not flagged) means the seller does not receive the appraisal CTA, the auction estimate, or the rare markers checklist — and may sell a $2,000 piece for $200. A false positive (non-antique flagged as antique) fires AntiqueBot on a 1985 mass-market item, wastes credits, and produces a confusing output.

is_collectible: controls CollectiblesBot. A false negative means a collector-grade item is priced using general comps rather than the collector market. A sports card graded PSA 9 is worth 10x a raw card — CollectiblesBot knows this, but only if is_collectible fires. A false positive fires CollectiblesBot on a common household item with no collector market, wastes credits, and produces an output that confuses the seller.

is_vehicle: controls CarBot AND the license plate blur pipeline. As detailed in Pack 09, the outdoor equipment exclusion is the highest-frequency source of false positives for this flag. A false negative on a genuine vehicle means the seller does not receive vehicle history, market value from specialist databases, or the VIN documentation that buyers of valuable vehicles expect.

The financial stakes: AntiqueBot costs $4.50 per run (estimated at Pack 09 rollout). CollectiblesBot costs $5.00 per run. CarBot costs $7.25 per run. A false positive on all three is $16.75 of wasted credits per item. At scale, miscalibrated boolean flags represent a meaningful platform cost and seller trust erosion.

## Sequencer Output Quality Review

After every AnalyzeBot analysis, mentally verify the following before finalizing the output:

Is item_name specific enough for PriceBot to build a targeted comp query?
Is category assigned from the approved list with no hybrid combinations?
Is condition_score a number between 1 and 10 with cosmetic and functional sub-scores?
Are estimated_value_low, mid, and high all present and internally consistent?
Is is_antique accurately set based on the three-condition rule?
Is is_collectible accurately set?
Is is_vehicle accurately set with the outdoor equipment exclusion applied?
Are keywords[] populated with at least 8 search-relevant terms?
Is the confidence score calibrated to the actual evidence available?

If any of these checks fails, the sequencer receives incomplete routing information. The downstream cascade will be degraded in proportion to what is missing.

The sequencer is designed to amplify good AnalyzeBot output into a complete, multi-bot analysis that gives the seller everything they need to list, price, and sell an item. It amplifies poor AnalyzeBot output into a cascade of degraded downstream results. The quality of the entire platform experience for each item begins and ends with AnalyzeBot's output.
