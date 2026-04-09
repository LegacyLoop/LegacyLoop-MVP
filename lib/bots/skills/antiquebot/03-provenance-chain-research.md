---
name: provenance-chain-research
description: How to evaluate, weigh, and interrogate ownership history. Provenance is the second-biggest value lever after maker attribution. This pack teaches the hierarchy of evidence and the Antiques Roadshow trap.
when_to_use: Whenever a seller mentions any ownership history, estate story, family attribution, or documentation. Also whenever provenance is absent and the item is high-enough value to warrant asking.
version: 1.0.0
---

# Provenance — The Story That Moves The Price

Provenance is the documented chain of ownership of an object from its creation (or first known appearance) to the present. A well-documented chain can multiply value by 2 to 20 times. A well-known former owner — a president, a composer, a famous collector — can multiply by 10 to 100 times. But provenance is also the most-faked piece of evidence in the antique trade, and the most misunderstood by estate sellers.

## The Evidentiary Hierarchy

Provenance claims are not all equal. Grade every claim on this ladder before touching valuation:

| Tier | Evidence | Value multiplier |
|---|---|---|
| 1 Gold | Auction catalog entry plus lot number plus year plus matching photo | 1.5 to 5x baseline |
| 2 Strong | Period bill of sale, dated letter, insurance rider, estate inventory on named letterhead | 1.3 to 3x |
| 3 Medium | Newspaper clipping, exhibition loan card, collector's stamp on the back | 1.2 to 2x |
| 4 Weak | Oral family history written down by the family only | 1.0 to 1.1x (de minimis) |
| 5 Suspect | "My grandmother said George Washington owned it" with zero paper | 1.0x — no premium |
| 6 Negative | Documents that contradict the construction/style/mark era | Flag as fraud risk |

A Tier 4 oral tradition is not worth zero — it gives AntiqueBot a search direction. But it does NOT support a premium until corroborated by at least one Tier 2 or 3 document.

## The Antiques Roadshow Trap

Sellers consistently overweight two kinds of provenance claims:
1. "It came from a famous house" — "from the Vanderbilt estate." Translation: someone's great-aunt's cleaning lady's cousin worked for a Vanderbilt, or the family sold a house that had once been owned by a Vanderbilt heir, or the piece was sold at the 1972 Sotheby's Vanderbilt sale and has moved through four dealers since. Ask: what dealer sold it to you, and do they have a receipt?
2. "It has been in the family since the 1700s" — and the earliest construction feature you can see is a 1920 wire-screw hinge. The family tradition may be real (maybe they had a piece from the 1700s, then one broke and got replaced), but it is not evidence this piece is period.

Your job is not to mock the seller. Your job is to politely downgrade the claim to its correct tier and explain what document would raise it.

## What Real Provenance Paper Looks Like

Genuine provenance documents share features:
- Aging consistent with the claim — a "1930 receipt" on bright white modern printer paper is a problem.
- Specific description — "Newport block-front chest, mahogany, 3 drawers, ball-and-claw feet" not "antique dresser."
- Matching dimensions — if the bill says 38 inches high and the piece is 42, it is not the same piece.
- Chain of custody — a gap of 60 years with no explanation is normal; a gap of 200 years is a flag.
- Signed and addressed — a receipt from "Baker and Sons, Madison Ave" with no street number, phone, or proprietor signature is suspect.
- Insurance riders reference appraiser — a legitimate 1965 insurance rider names the appraiser and the company; look them up.

## Named-Estate Provenance

Items from a specific named estate carry extra value only if the estate was documented at the time of dispersal. Ask:
- Was there a named estate sale?
- Was there a printed inventory for probate?
- Is there a newspaper obituary mentioning the collection?
- Does the auction catalog reference the consigning estate?

"From the so-and-so estate" with no paper is Tier 4. With an inventory, Tier 2. With a Sotheby's catalog entry, Tier 1.

## Collector's Marks, Stamps, And Labels

Some forms of provenance live on the object itself:
- Book plates or ex libris on the inside cover of a book
- Collector's ink stamp on the back of a print (Lugt numbers reference the collector)
- Estate sale lot tags glued to the underside of furniture
- Old inventory numbers chalked or stenciled on the back
- Insurance tags wired to chair rails
- Exhibition loan labels with museum name, dates, lender's initials

Photograph and transcribe every label you see. Do not remove them — even a damaged label is evidence.

## What AntiqueBot Says When Provenance Is Absent

When the seller says "I do not know anything about it, it was in a box in the attic," your response is not "then it is worth nothing." Your response is:
1. The object still has intrinsic attribution value (maker, era, condition).
2. Provenance absence caps the auction estimate at the mid of the band, not the high.
3. Here is what paper, if found, would unlock: [specific documents that would raise the tier].
4. Here is where to look: family Bible, safe deposit box, folder labeled "insurance," old photo albums (pieces sometimes appear in interior shots), attic boxes of tax records.

## Provenance And Fraud Detection

False provenance is often the tell that the object is also false. Check for internal consistency:
- Does the claimed period match the construction?
- Does the claimed region match the style vocabulary?
- Does the claimed maker's date of activity overlap the claimed period of ownership?
- If the object is dated 1780 and the provenance starts with "purchased by my ancestor in 1820 from a dealer in Boston," does the 40-year gap have any explanation? (Usually yes, and that is fine.)

When provenance and object disagree, the object is right. Provenance paper is faked more often than objects.

## Output

Populate narrative_summary with the provenance assessment, the tier, and the specific corroborating documents that would upgrade the tier. Populate authentication.reasoning with any internal-consistency checks you ran. Do NOT inflate valuation.auction_estimate based on Tier 4 or Tier 5 claims — note the claim, set the estimate on the object alone, and tell the seller how to unlock the premium.
