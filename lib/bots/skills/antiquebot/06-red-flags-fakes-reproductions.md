---
name: red-flags-fakes-reproductions
description: The forgery detection rubric. How to spot reproductions, married pieces, later marks, patina fraud, and outright fakes. Maps observed red flags to a four-tier forgery risk score (LOW / MODERATE / HIGH / CONFIRMED).
when_to_use: Every AntiqueBot scan. Fraud is cheaper to detect up front than to explain after the sale.
version: 1.0.0
---

# Red Flags — The Forgery Detection Rubric

Antique fraud is pervasive. Estimates run from 20 to 40 percent of the "period" market in some categories. Estate sellers are the most vulnerable because they inherit the object without the context of how it was acquired. Your job is to find the fraud tells that the family never saw. Call it out early, diplomatically, and with specific reasoning.

The four-tier forgery risk score below is the value you put on authentication.forgery_risk. It is always present, always numeric or categorical, and always paired with specific observed evidence.

| Risk tier | Meaning | Action |
|---|---|---|
| LOW | No red flags observed, construction and marks agree | Proceed with period attribution |
| MODERATE | One minor inconsistency, other evidence still points period | Note the flag, hedge the confidence band |
| HIGH | Two or more serious inconsistencies, or one disqualifying fact | Downgrade to "style of" or "revival," recommend in-person exam |
| CONFIRMED | Disqualifying fact that cannot be explained | Call it out firmly, recommend professional authentication |

## Red Flag Category 1 — Temporal Anachronism

These are disqualifying. A single one takes you to CONFIRMED reproduction.

- Phillips head screw (post-1936) on a pre-1936 claim.
- Wire nail (post-1890) in primary structure on a pre-1890 claim.
- Plywood secondary (post-1905) on a pre-1905 claim.
- Circular saw mark (post-1830) on a pre-1830 claim.
- Synthetic varnish (polyurethane post-1950, lacquer post-1920) as original finish on earlier claim.
- Machine-cut dovetail (post-1860) on a pre-1860 claim.
- Electroplate on "Georgian" silver (electroplating invented 1840).
- Chrome or stainless fittings on any pre-1920 claim.
- Bakelite or early plastic on pre-1907 claim (Bakelite invented 1907).
- Decal or printed transfer on supposedly hand-painted pre-1850 ceramic.

A single temporal anachronism on primary structure ends the period claim. Period. Do not hedge this.

## Red Flag Category 2 — Style Inconsistency

Mixed-period elements on one piece. Two patterns:
1. Deliberate revival (Centennial 1876, Colonial Revival 1890-1940) — usually well-made, just not period.
2. Married piece — a top from one object joined to a base from another. Check wood grain continuity across the joint, patina consistency, hardware uniformity, and proportion. Married pieces were common in the 1920s when dealers rebuilt fragments.

Diagnostic: stand back and ask, "would a single maker in a single shop have combined these elements?" A Queen Anne splat on a Chippendale frame is not something a 1760 Philadelphia shop would have built. Either it is revival or married.

## Red Flag Category 3 — Patina Fraud

Real patina is the accumulation of:
- Dirt in unwaxed recesses
- Handling wear on edges and pull-points
- Uneven oxidation from UV and air
- Subtle color shifts between covered (darker) and exposed (lighter) wood

Fake patina tells:
- Too even — sprayed or wiped on, no differential wear
- Wrong locations — darkening on edges instead of recesses
- Chemical smell — ammonia fuming, vinegar staining, tea or coffee dyeing
- Sand and dirt deliberately pressed into a fresh finish to simulate grime
- Fly specks added with a spatter tool — look at density; real fly specks cluster near windows/lights

## Red Flag Category 4 — Mark Fraud

- Mark too crisp on a supposedly old piece (marks dull and erode from handling)
- Mark in a spot the maker never marked (Tiffany never marked in certain positions — learn them)
- Mark font wrong for the claimed period (Gorham used different stamps by decade)
- Mark struck over earlier mark (restrike)
- Mark on a married section (often the replaced top has an "original" mark the base lacks)
- Mark placement doesn't match factory tooling (off-axis, wrong plate)
- Too-perfect alignment (hand-struck marks have slight drift; machine marks are suspect on pre-1860 pieces)

## Red Flag Category 5 — The Weight Test

Reproductions often get the weight wrong. Period silver is heavier per volume than modern plate. Period bronze has a specific density. Period porcelain has specific wall thickness. When sellers can weigh, compare to documented period weights for that form. A 20 percent weight discrepancy is a flag.

## Red Flag Category 6 — The UV And Blacklight Test

Under UV:
- Modern restoration materials fluoresce differently from originals
- Over-painting shows dark against original pigment
- Modern glue shows bright
- Some modern glass fluoresces where period does not (manganese glass fluoresces yellow-green, pre-1915)
- Repaired porcelain shows restoration as dark patches

Ask sellers to photograph the piece under UV if a high-value call depends on it.

## The Single Most Useful Question

"Where did you acquire it?" If the seller inherited it from a relative who acquired it before 1940 from a reputable source, the fraud risk drops. If it was purchased in the last 20 years from an online marketplace, estate sale in a non-auction context, or from an unnamed dealer, the fraud risk rises. Provenance gaps in the last 40 years are the most common fraud pattern — fakes entered the market in the 1980s-2000s cheap-labor reproduction boom.

## Output

Populate authentication.red_flags as an array of specific observed indicators. Populate authentication.forgery_risk with LOW/MODERATE/HIGH/CONFIRMED. In authentication.reasoning, explain WHY you picked that tier, citing specific red flags from the categories above. If you cannot see the critical evidence in photos, request the specific close-ups needed (mark close-up, underside, drawer bottom, UV photograph).
