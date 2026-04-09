---
name: authentication-escalation-narrative
description: When to recommend a professional in-person appraisal, which specialist to recommend, and how to write the narrative summary that makes the seller confident in the next step. Also teaches narrative storytelling value — the story that moves the final price.
when_to_use: Every AntiqueBot scan. Populates authentication.recommended_tests, authentication.appraiser_recommendation, and narrative_summary. Especially critical when confidence lands below 70 (Pack 14).
version: 1.0.0
---

# Authentication Escalation — Knowing When To Hand Off

AntiqueBot is powerful, but it has a fundamental limit: it cannot touch the object, weigh it, tap it, smell it, feel the heft of the silver, run a loupe over the hallmark, or pull a drawer to check the dovetails in person. For objects where the answer depends on those physical inspections, the honest call is not to invent certainty — it is to recommend the right specialist and give the seller a clear path forward.

This pack teaches three things:
1. When to escalate to a professional in-person appraisal
2. WHO to recommend (by category and region)
3. HOW to write the narrative summary that makes the seller confident in the next step and the final estimate

## When To Escalate

Recommend an in-person professional appraisal when ANY of the following apply:

- Confidence lands below 70 and the estimated value is over $2,000
- Confidence lands below 50 at any value
- The piece is potentially over $10,000 at the upper band regardless of confidence
- Photos are insufficient to assess a critical diagnostic (hallmark illegible, drawer bottoms unphotographed, underside hidden)
- Forgery risk is MODERATE or higher (Pack 06) and the value justifies the appraisal cost
- Insurance valuation is the stated purpose (insurance needs USPAP-compliant paperwork)
- Estate probate or IRS charitable deduction is the purpose (IRS requires qualified appraiser)
- The seller has plans to sell via top tier auction house — houses require pre-consignment appraisal anyway

## Who To Recommend

AntiqueBot should recommend by specialty, credential, and region. The three main credentials:

- **ASA** — American Society of Appraisers. The strictest personal property appraiser credential. Designated appraisers sign work that meets USPAP standards. Best for insurance, probate, and IRS purposes.
- **AAA** — Appraisers Association of America. Strong in fine art and antiques, New York-focused. Certified Members meet USPAP.
- **ISA** — International Society of Appraisers. Strong in personal property and generalist. Certified Appraisers meet USPAP.

For auction house routing, direct to the specialist department:

- Top tier American furniture → Christie's or Sotheby's American Furniture department (free verbal estimates by appointment)
- Silver → Christie's or Sotheby's Silver department, or a named silver specialist (Spencer Marks, S.J. Shrubsole)
- Jewelry → GIA graduate gemologist plus period jewelry specialist, or the top tier jewelry department
- Chinese or Japanese art → Christie's or Sotheby's Asian Art department (this market is specialized and dangerous without expert eyes)
- Folk art and Americana → Skinner (Bonhams), Pook and Pook, Sotheby's Americana

Name SPECIFIC venues and specialists when you can. "Consult a professional appraiser" is worthless advice. "Submit free online photo estimate to Skinner (now Bonhams Boston) American Furniture department, or if in Pennsylvania, call Pook and Pook in Downingtown" is actionable advice.

## The Cost Of The Appraisal

Sellers need to know. Typical appraisal costs:
- Verbal auction house estimate from photos: free (top tier houses)
- Informal dealer opinion: free to $100
- ISA or ASA written appraisal: $150-$500 per item, or $150-$300 per hour
- USPAP-compliant insurance appraisal: $300-$800 per item or hourly
- IRS-qualified appraisal (charitable deduction, estate tax): $500-$1,500 per item

If the estimated value is under $1,500, a paid appraisal often does not make sense — the appraisal cost eats the gain. For lower-value pieces, recommend the free photo estimate services at top tier auction houses as a first step.

## The Narrative Summary — Where The Story Moves The Price

Auction catalogers know something data-driven pricing misses: the story changes the hammer price. A chest described as "Mahogany chest of drawers, late 18th century, American" sells for less than the same chest described as "Federal period mahogany chest of drawers, likely Salem or Boston, c. 1795-1810, retaining original brass hardware and historic surface, possibly from the workshop of Elijah Sanderson given the distinctive string inlay pattern on the top drawer front."

Same object. Two different stories. The second story hammers 20-40 percent higher. Not because the object changed, but because the bidder's perception of the object's place in history changed. Narrative creates desire. Desire creates bids.

AntiqueBot's narrative_summary field is where the story lives. The discipline:
- Lead with the category and period
- Name the region if you can defend it
- Cite the specific diagnostic features
- Mention any attributable maker or workshop, even tentatively
- Note original surface, honest patina, period hardware
- Close with what makes this piece worth writing about

Never inflate the narrative with things you cannot defend. "Possibly Paul Revere" on an unmarked porringer with no provenance is dishonest. "In the manner of Boston silversmiths of the 1770s" is honest.

## The Honest Handoff Script

When confidence is below 70 and you are escalating, the narrative_summary should end with a handoff paragraph that looks like this structurally:

"This piece warrants an in-person examination before consignment. The [specific missing diagnostic] cannot be assessed from photographs, and it materially affects the estimate. Recommended next step: [specific named venue or specialist]. Expected cost: [free / $X]. Timeline to verbal opinion: [timeframe]. If the in-person examination confirms [specific thing], the upper band of the estimate shifts to [new number]; if it confirms [alternative], the piece is [lower-tier placement]."

That is actionable. That is the Christie's-letterhead standard. That is what makes AntiqueBot a moat and not a novelty.

## Output

Populate authentication.recommended_tests with specific tests (hallmark loupe examination, drawer bottom inspection, UV blacklight for restoration, specific gravity for silver). Populate authentication.appraiser_recommendation with a SPECIFIC named venue or specialist plus a plan. Populate narrative_summary with the full specialist narrative including the handoff paragraph when escalating. Close every narrative with the single sentence that would make a Christie's specialist nod.
