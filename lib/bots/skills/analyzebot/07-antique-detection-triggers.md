---
name: antique-detection-triggers
description: The complete protocol for when and how AnalyzeBot must set is_antique=true, populate antique_markers[], and route to AntiqueBot, including hard rules, visual indicator libraries, provenance marker recognition, and preservation rules for previously confirmed antiques.
when_to_use: "Every AnalyzeBot scan."
version: 1.0.0
---

# Antique Detection Triggers

## The Hard Rule

If estimated_age_years is 50 or greater, is_antique must be set to true. This is not a judgment call. The 50-year threshold is the system's defined boundary, and AnalyzeBot must apply it consistently. The current analysis year is 2026. Any item estimated to have been manufactured in 1976 or earlier triggers the antique flag.

This rule applies even when the item is not traditionally considered "antique" by the 100-year standard used by many auction houses. The LegacyLoop system uses 50 years as the threshold for AntiqueBot routing because items manufactured before 1976 are now entering the vintage and antique collecting market at volume and require specialist pricing and identification. The 100-year rule governs what can be imported duty-free as an antique; the 50-year rule governs what LegacyLoop routes to specialist analysis.

## Visual Age Indicators That Trigger the Flag

The following visual indicators, individually or in combination, are evidence of age meeting or exceeding the 50-year threshold. Each indicator that is positively confirmed should be added to the antique_markers[] array.

### Construction Indicators

Hand-cut dovetails: inconsistent spacing, visible chisel marks at the baseline, scribe line visible around the drawer interior. Hand-cut dovetails are consistent with pre-1860 American manufacture and pre-1870 English manufacture. They are definitive pre-1976 indicators and must trigger the flag.

Hand-forged nails: square tapered shanks, irregular handmade heads. Consistent with pre-1790. Trigger flag.

Cut nails: rectangular shanks, machine-formed but not round. Consistent with 1790-1890. Trigger flag.

Mortise-and-tenon joinery with visible wooden pegs, especially if the pegs show slight shrinkage and are proud of the surface (the peg and mortise wood shrink at different rates, causing the peg to stand proud over time). Trigger flag.

Hand-plane marks visible on secondary surfaces as subtle scalloped ridges. Consistent with hand-fabrication predating power tool availability in the shop. Trigger flag.

Circular saw marks on secondary surfaces (wavy concentric arcs). Consistent with post-1830 manufacture; in combination with other features, confirms pre-modern manufacture. Add to markers but note the narrower date contribution.

Frame-and-panel shrinkage: solid wood panel visibly shrunk within its frame, showing a gap at one side or a crack across the panel face. Confirms real wood movement over real time. Trigger flag.

### Material Indicators

Old-growth wood with tight annual rings visible at any exposed end grain. Old-growth wood in American furniture predates sustainable modern forestry practices and is consistent with pre-1930 material, most often indicating earlier construction. Trigger flag.

Quartersawn white oak with prominent ray fleck used as the primary furniture wood. This material and construction combination is the signature of Arts and Crafts furniture (1895-1920) and its immediate successors. Trigger flag.

Period-appropriate secondary wood species: American yellow pine as a secondary wood in a mahogany case piece is consistent with American eighteenth and nineteenth century construction. Poplar as secondary wood in American Victorian furniture. Trigger flag in combination with other indicators.

Original shellac finish showing age-related crazing (fine network of cracks in the surface). Shellac was the dominant furniture finish until the 1920s when lacquer became common. An in-situ shellac finish with visible crazing indicates the finish has not been disturbed and the piece is at minimum several decades old. Trigger flag.

### Surface and Patina Indicators

Genuine multi-layer patina with period-appropriate accumulation: darkening in recesses, lightening on high points, consistent with the material's natural oxidation chemistry. Trigger flag when patina character is consistent with 50+ years of development.

Honest shrinkage cracks in solid wood: a tabletop, chair seat, or panel with fine cracks running with the grain, indicating wood movement over decades. These are not structural failures but natural aging. Trigger flag.

Tin or japanned surfaces with the characteristic granular oxidation pattern of aged japanning. Trigger flag.

Original painted surfaces with multiple underlying paint layers visible at chips or wear points. Multiple layers of original paint indicate repainting over decades, which itself indicates age. Trigger flag.

## Provenance Markers Visible in Photographs

These visual indicators of documented history are among the strongest antique flags because they indicate the item has a prior history that was considered significant enough to document.

Auction house stickers and labels: Christie's, Sotheby's, Bonhams, Phillips, Skinner, Heritage Auctions, Freeman's, Rago Arts, Cowan's, Leslie Hindman, Northeast Auctions, James Julia, Morphy Auctions, and regional and country auction house labels. Any auction sticker must trigger the antique flag and be noted specifically: "Auction label from [house name] visible. Prior auction history indicates the item has been professionally evaluated. Label number if visible should be recorded for provenance research."

Museum loan labels: rectangular paper or card labels indicating a museum name, loan number, and sometimes a date. Museum loan labels are extraordinary provenance indicators. They demonstrate that a scholarly institution considered the item significant enough to borrow for exhibition. These labels must never be removed. "Museum loan label from [institution] visible. Preserve this label. It is a significant provenance document."

Insurance appraisal tags: small tags attached to the piece showing a value in old dollar amounts or foreign currencies. An appraisal tag showing $35 in a script consistent with mid-twentieth century writing suggests the item was appraised decades ago at a value that has since multiplied. Trigger flag and note.

Estate sale lot tags with named estates: a lot tag reading "Property of the [Name] Estate" or similar connects the item to a documented collection. Named estates with documented auction records or probate can be researched. Trigger flag and note the estate name if legible.

Dealer labels: paper labels from antique dealers with addresses, sometimes including inventory numbers and prices in old denominations. A dealer label from a shop that is known to have operated in a specific period anchors the item to at least that period.

Old retail price tags: department store tags with prices in amounts consistent with historical retail values, or in currencies no longer in circulation. A tag in pre-decimal British pounds and shillings is from before 1971.

## Period Style Confirmation Triggers

When the visual style of an item matches a named design period that is entirely predating 1976, the antique flag must be set even if exact age cannot be confirmed from the photographs. Style-based flags require a specific note that distinguishes visual style attribution from confirmed manufacturing date.

For example: "Visual style is consistent with American Arts and Crafts movement (approximately 1895-1920). Construction features (quartersawn oak with visible ray fleck, mortise-and-tenon joinery with wooden peg details) support this attribution. Flagging as antique based on preponderance of period-consistent evidence. Professional appraisal recommended for confirmation and valuation."

Named periods that unconditionally trigger the antique flag when confirmed: William and Mary, Queen Anne, Chippendale, Federal, Hepplewhite, Sheraton, American Empire, Victorian, Arts and Crafts, Art Nouveau, Art Deco, and all named mid-century modern designers and manufacturers working before 1976.

## How to Communicate Antique Flags to the Sequencer

The analysis output must include:

is_antique: true — the boolean flag.

antique_markers: an array of specific observed indicators. Each entry should be a concrete observation, not a general statement. Use "hand-cut dovetails visible in drawer corner photograph" rather than "old construction." Use "auction house label visible on base" rather than "has provenance." Concrete observations can be cited in appraisals; vague generalizations cannot.

estimated_age_years: a number or range. Use the midpoint of a range for calculations. "Estimated age 80-120 years" should be stored as estimated_age_years: 100.

antique_confidence: a score from 0 to 100 representing how strongly the visual evidence supports the antique attribution. Below 50: flag but note low confidence and request additional photographs. 50-75: moderate confidence, professional appraisal recommended. 75-100: high confidence based on multiple independent corroborating indicators.

## The Preservation Rule for Previously Confirmed Antiques

When AnalyzeBot is re-running analysis on an item that has a prior AiResult or AntiqueCheck record showing is_antique=true, the re-analysis must not downgrade the antique status unless there is clear, specific, articulable evidence in the current photographs that contradicts the prior attribution.

The reasoning: a prior professional or AI confirmation of antique status is itself evidence. Downgrading it requires a positive counter-finding, not merely the absence of confirming evidence. Photographs vary in quality; a poor photograph that fails to show the evidence that triggered the original flag does not negate that evidence.

If a re-analysis finds evidence that genuinely contradicts a prior antique attribution (for example, Phillips-head screws visible in a photo not previously examined), the system should flag the conflict rather than silently downgrading. "Prior antique attribution (AntiqueCheck [id]) conflicts with current finding: [specific evidence]. Manual review recommended before changing antique status."

The route.ts validation guard enforces this rule at the API level. AnalyzeBot must not attempt to output is_antique: false for a previously confirmed antique item without explicit contradiction evidence in the findings.
