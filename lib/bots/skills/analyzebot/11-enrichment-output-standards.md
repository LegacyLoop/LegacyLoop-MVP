---
name: enrichment-output-standards
description: Defines what data downstream bots require from AnalyzeBot and the quality standard for each field. Covers required fields, critical fields, enrichment chain fields, and how incomplete data degrades the entire bot pipeline.
when_to_use: Every AnalyzeBot scan.
version: 1.0.0
---

# Enrichment Output Standards

## Why Output Quality Is a System Property

AnalyzeBot is the first node in the enrichment chain. Every downstream bot — PriceBot, AntiqueBot, CollectiblesBot, CarBot, ListBot, BuyerBot — reads from the data AnalyzeBot writes. A weak AnalyzeBot output does not just affect the analysis panel the seller sees. It degrades every downstream bot result, every listing, every buyer match, and every price estimate.

Completeness and specificity in AnalyzeBot output is not optional. It is the foundation on which $4 to $17.75 of downstream bot spend rests.

## Required Fields (Must Always Be Populated)

These fields must be populated on every scan, regardless of confidence level. If you cannot populate them with specific values, populate them with appropriately hedged values.

### item_name

Not generic. Not vague. Specific enough that a buyer searching for this item would find it.

Bad: "old dresser"
Bad: "wooden furniture"
Bad: "antique item"

Good: "Federal bow-front chest of drawers, mahogany with inlay"
Good: "Stickley Brothers Morris chair, quarter-sawn oak, circa 1910"
Good: "Singer Featherweight 221 portable sewing machine with case"

The item_name is used as the base for ListBot's title generation. A vague item_name produces vague listings that do not convert.

### category

Use the approved category list. Do not invent category names. Do not use hybrid categories ("Furniture/Antiques" is not a valid category — choose one).

If the item genuinely belongs in Outdoor Power Equipment, assign that. Do not round up to Vehicles because it has a motor.

### condition_score (1-10)

Always a number between 1 and 10. Always accompanied by condition_cosmetic (appearance) and condition_functional (operational) sub-scores.

1-2: Damaged, broken, missing major parts, not functional. Parts value only.
3-4: Poor condition. Significant wear, damage, or non-functionality. Discount pricing.
5-6: Fair to good condition. Shows wear appropriate to age. Functional.
7-8: Good to very good condition. Light wear only. Fully functional.
9: Excellent condition. Near-mint. Only faint signs of use.
10: Mint/New in Box. Unused. Original packaging.

Do not assign 10 unless the item is genuinely unused and in original packaging. "Excellent condition" in seller parlance usually maps to 8.

### estimated_value_low, estimated_value_mid, estimated_value_high

Always three numbers. Never omit the range. The band width should reflect your confidence:

85+ confidence: band width of 20-30% of mid value.
70-84 confidence: band width of 30-40% of mid value.
50-69 confidence: band width of 50-60% of mid value.
Below 50 confidence: band width of 80-100% of mid value.

Example at 85% confidence, mid value $400: low=$300, mid=$400, high=$500.
Example at 55% confidence, mid value $400: low=$200, mid=$400, high=$700.

## Critical Fields (Populate When Determinable)

These fields must be populated whenever the evidence supports them. Do not leave them blank if you can determine the value.

### brand / maker

Two separate fields for a reason. Brand is the commercial name as it appears on the item (Singer, Stickley, Tiffany). Maker is the attribution when no explicit brand is present (New England craftsman, Pennsylvania Dutch, Attributed to Herter Brothers).

If you cannot determine either, populate with "Unknown" rather than leaving the field null. Null causes downstream bots to skip maker-specific logic.

### material

Primary material first, secondary materials after. Use consistent terminology that maps to known antique and collectibles vocabulary.

Examples: "mahogany with pine secondary wood", "sterling silver with engraving", "transfer-print porcelain", "quarter-sawn white oak with ebony inlay", "cast iron with original japanned finish".

Vague: "wood", "metal", "glass". These do not help AntiqueBot date by construction method or CollectiblesBot match to production runs.

### era

A date range is better than a decade, and a decade is better than a century. Use the most specific range the evidence supports.

Acceptable: "circa 1880-1900", "1950s", "pre-World War II", "Colonial period (1700-1776)".
Too vague: "antique", "old", "vintage", "early".
Overspecific without evidence: "1887" (unless there is a date mark).

### style

The named design style or movement. These are searchable terms that buyers use.

Examples: Federal, Empire, Victorian, Arts and Crafts, Mission, Art Deco, Art Nouveau, Mid-Century Modern, Streamline Moderne, Hollywood Regency, Chippendale, Queen Anne, Shaker, Country/Primitive, Industrial.

### keywords[]

Minimum 8 search-relevant terms. These are the exact words buyers type into search engines and marketplaces.

Include: the full item_name broken into components, the maker/brand, the style, the material, the era, the category, any model number visible, the color, distinguishing features.

Example for a Stickley Morris chair: ["Morris chair", "Stickley", "Stickley Brothers", "Arts and Crafts", "Mission oak", "quarter-sawn oak", "recliner chair", "antique chair", "craftsman furniture", "circa 1910", "leather cushion"].

ListBot uses keywords[] directly to build title permutations and eBay keyword strings. Eight is the minimum; more is better.

### is_antique (boolean)

True when: estimated age is 100 years or more (the US Customs and international auction standard), OR when antique_markers.length is 3 or more, OR when the item is explicitly dated to before 1926.

False when: item is under 50 years old or is a reproduction of an older style.

Uncertain: set to false and set is_potentially_antique=true if you believe it may qualify but cannot confirm age.

### is_collectible (boolean)

True when: the item belongs to a recognized collecting category, has an established secondary market, and buyers actively seek it by maker/model/variant. This includes sports memorabilia, vintage toys, coins, stamps, records, vintage electronics, limited production items, character-licensed merchandise, and items with collector-grade grading standards.

## Enrichment Chain Fields (Read by Downstream Bots via extractAnalyzeBot)

The function extractAnalyzeBot in item-context.ts reads these specific fields from the AiResult JSON. They must be present and correctly named for the downstream bot chain to function.

Fields read by downstream bots: item_name, category, subcategory, brand, model, maker, material, era, style, condition_guess (text description), condition_score (numeric), estimated_value_low, estimated_value_high, is_antique, is_collectible, is_vehicle, keywords (array), summary (2-3 sentence plain-language summary for display).

Any field missing from this list causes the downstream bot to substitute a default or skip logic that depends on that field.

## How Incomplete Data Degrades Downstream Bots

Missing category: PriceBot pulls comps from the wrong marketplace category. A chest of drawers miscategorized as "Household Goods" instead of "Furniture" returns irrelevant comps.

Missing material: AntiqueBot cannot apply construction-based dating. A pine secondary wood (which helps date American furniture pre-1900) goes undetected.

Missing era: AntiqueBot's age estimation logic has no anchor. The antique threshold check may fail on items that qualify.

Missing keywords: ListBot generates weak titles without search-proven vocabulary. Listings do not rank on eBay, Craigslist, or Facebook Marketplace search.

Missing is_antique flag: AntiqueBot does not trigger, the seller does not get the appraisal CTA, and a potentially high-value piece is underpriced.

Missing is_collectible flag: CollectiblesBot does not trigger, the item is not matched to collector grading standards, and the price may be set using general comps rather than collector-grade market data.

## The Completeness Over Speed Rule

AnalyzeBot runs once per item by default. The seller pays for the analysis. Every additional field you populate correctly is value added at no extra cost. Every field left blank is value withheld.

Take the extra processing time to populate every determinable field. If a field is genuinely indeterminate, populate it with an explicit null-reason comment in the summary, not a silent null.

The quality bar: after every analysis, ask "could a knowledgeable human antique dealer write a complete eBay listing from this output alone?" If yes, the output is complete. If they would need to guess at the material, the era, the maker, or the keywords, the output is incomplete.
