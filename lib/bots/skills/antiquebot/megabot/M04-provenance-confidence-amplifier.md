---
name: antiquebot-megabot-provenance-confidence-amplifier
description: >
  Defines how the four AntiqueBot MegaBot AI models validate, score, and
  weight provenance claims to amplify or dampen the consensus valuation
  band. Covers documentary evidence hierarchy, chain of custody standards,
  famous versus unknown estate weighting, the provenance multiplier table
  at each consensus confidence tier, and conflict-resolution logic when
  provenance claims are disputed among models.
when_to_use: >
  Invoke whenever a seller provides any provenance information, however
  informal — including oral family history, receipts, photographs with
  the item, exhibition labels, auction stickers, or references to a
  prior owner. Also invoke when any AI model independently identifies
  a potential provenance signal not mentioned by the seller, such as
  a collector's mark, a gallery sticker, or a period exhibition label.
version: "1.0.0"
---

# Provenance Confidence Amplifier for MegaBot Consensus

## What Provenance Does to a Valuation

Provenance is the documented history of an object's ownership and
location from the time of its creation to the present. In the antiques
and fine art markets, provenance performs two distinct functions.

First, it establishes authenticity by inference. An object documented
in a 1923 auction catalog, reproduced in a 1947 museum exhibition
catalog, and appearing in a 1965 insurance rider is unlikely to be a
forgery. The chain of custody creates a web of corroborating evidence
that substitutes, in part, for physical authentication.

Second, it adds market premium through association. An object owned by
a significant collector, a historical figure, or a renowned institution
carries value beyond its intrinsic merit. Buyers pay for the story as
well as the object.

The Provenance Confidence Amplifier governs how MegaBot incorporates
both functions into its consensus valuation. When all four models agree
on provenance quality, narrow the band and apply the multiplier. When
provenance is disputed, widen the band and flag the dispute.

---

## Documentary Evidence Hierarchy

Not all provenance documentation is equal. The following hierarchy
governs how each document type is weighted in the consensus.

### Level 1 — Primary Transaction Records (Weight: 1.00)
Auction house catalog with lot illustration and written description.
Published sale results with hammer price. Original purchase receipt
or invoice from a gallery, dealer, or auction house. These are
contemporaneous records created by a disinterested third party with
professional cataloguing standards. They are the hardest to fabricate
and the easiest to verify against published archives.

### Level 2 — Institutional Documentation (Weight: 0.90)
Museum accession records, loan agreements, exhibition labels affixed
to the piece. Insurance riders or scheduled personal property riders
that describe the object with sufficient specificity to match. Published
scholarly catalogue raisonne entries. These documents were created by
institutions with professional accountability and are verifiable against
institutional archives.

### Level 3 — Secondary Publication (Weight: 0.75)
The object's reproduction in a book, magazine, or scholarly article.
Reference in a dealer's published catalog. Inclusion in a sales catalog
that does not include a published result. These documents establish that
the object existed and was known at a specific time, but they do not
document ownership or transaction.

### Level 4 — Correspondence and Personal Records (Weight: 0.55)
Letters between parties discussing the object. Photographs showing the
object in a specific setting or with a known person. Handwritten notes
of purchase or gift. Personal correspondence is difficult to verify and
relatively easy to fabricate, but it provides corroborating narrative
when combined with higher-level documentation.

### Level 5 — Oral History (Weight: 0.30)
Family stories about acquisition, inheritance, or ownership. Seller
recollection without documentary support. Oral history is the weakest
form of provenance documentation and cannot stand alone. It functions
as a narrative frame for physical evidence but does not independently
amplify the valuation.

---

## Chain of Custody Standards

A complete chain of custody traces the object from maker or first known
owner to the present seller without gaps. Each gap in the chain is a
point of vulnerability — not necessarily a sign of fraud, but a location
where a substitution or misattribution could have occurred.

For objects created before 1900, gaps are expected and unavoidable.
The standard for pre-1900 objects is that each documented link in the
chain is internally consistent with the claimed provenance narrative,
and that no link contradicts it.

For objects created after 1900, the chain should be substantially
complete. A 20th century work of art or decorative object that cannot
be traced from its maker through to the present seller should be
examined carefully. Gaps in 20th century provenance may reflect wartime
displacement, which is a specific and documented category, or they may
reflect problems with title.

World War II provenance research is a separate discipline. Any object
that was in Europe between 1933 and 1945 and has a gap in documentation
during that period must be flagged for specialized research before sale.
This is not an escalation suggestion — it is a legal requirement in
several jurisdictions.

---

## When All Four Models Agree on Provenance Tier

Agreement among all four AI models on provenance quality is a strong
signal. It means that the provenance claims are internally consistent,
the documentary evidence is readable from available materials, and no
model has identified a contradiction.

When all four agree that provenance is Level 1 or Level 2, apply the
full provenance multiplier and narrow the valuation band by 20 percent.
The narrowing reflects the reduction in uncertainty that strong
provenance provides.

When all four agree that provenance is Level 3, apply a partial
multiplier and maintain the standard valuation band.

When all four agree that provenance is Level 4 or 5 only, apply no
multiplier and consider widening the band by 10 percent to reflect
the additional uncertainty.

---

## When Provenance is Disputed Among the Four Models

Dispute among the models is itself informative. It suggests that the
provenance materials are ambiguous, incomplete, or potentially
inconsistent.

When two models accept a provenance claim and two reject or question it,
do not apply a multiplier. Flag the dispute in the output with a specific
description of what the disagreeing models found problematic. Widen the
valuation band by 15 percent.

When three models question a provenance claim and one accepts it,
treat the provenance as unverified. Apply no multiplier. Flag the single
accepting model's reasoning and explain why the majority view is cautious.

When all four models find provenance claims inconsistent or fabricated,
this is an escalation trigger. Do not present a provenance-amplified
valuation. Flag the inconsistency explicitly and recommend that the
seller obtain independent provenance research before listing.

---

## Famous Estate vs Unknown Estate Weighting

An object from a named and documented collection — particularly one
whose contents were catalogued by an auction house, published in an
exhibition, or described in a scholarly monograph — carries a premium
that reflects both authentication security and collector association.

Named collection premium tiers:

Tier A: Museum deaccession, major private collection documented in
auction house catalog, estate of a figure with established cultural
significance. Premium range: 25 to 60 percent above comparable
non-provenanced examples. The premium is highest for categories where
the named collector was known as a sophisticated acquirer — a furniture
collector's furniture, a porcelain collector's porcelain.

Tier B: Regional collecting family documented in regional auction
house catalogs, objects included in insurance appraisals that name the
owner and property. Premium range: 10 to 25 percent.

Tier C: Single-generation family ownership with documentary evidence
of purchase but no published record. Premium range: 0 to 10 percent.
The premium here is primarily authentication benefit rather than
association value.

Tier D: Oral family history only, no documentary support. Premium
range: 0 percent. Oral history in isolation does not amplify value.
It may be noted as narrative context but must not be presented as
a valuation factor.

Unknown estate simply means the seller acquired the object through
inheritance or purchase and cannot document the prior history. Unknown
estate is not a negative provenance indicator. It is a neutral condition.
Apply no multiplier, positive or negative.

---

## The Provenance Multiplier Table

The following table applies to the base valuation midpoint after
source-weighted comparable sales have established the range.

| Provenance Tier | Documentation Level | Model Agreement | Multiplier | Band Adjustment |
|-----------------|--------------------|-----------------|-----------:|-----------------|
| Named collection — Tier A | Level 1 or 2 | All 4 agree | 1.45 | Narrow 20 pct |
| Named collection — Tier A | Level 1 or 2 | 3 of 4 agree | 1.30 | Narrow 10 pct |
| Named collection — Tier B | Level 1 or 2 | All 4 agree | 1.18 | Narrow 15 pct |
| Named collection — Tier B | Level 3 | All 4 agree | 1.10 | Standard band |
| Named collection — Tier C | Level 3 or 4 | All 4 agree | 1.05 | Standard band |
| Unknown estate | Any level | Any | 1.00 | Standard band |
| Disputed provenance | Any level | Split | 1.00 | Widen 15 pct |
| Inconsistent provenance | Any level | Majority question | 0.95 | Widen 25 pct |
| Fabricated or contradicted | Any level | All 4 reject | Flag only | Escalate |

The multiplier applies to the midpoint, not to the low or high end
independently. The band adjustment then determines the spread around
the new midpoint.

---

## Applying the Multiplier: A Worked Example

Base valuation from comparable sales: $8,000 to $12,000 (midpoint $10,000).

Provenance claim: Seller presents an original Parke-Bernet 1962 auction
catalog with the lot illustrated and described, and a subsequent
Christie's 1988 catalog where the piece reappeared. Two different
auction house records covering a 26-year interval.

Model assessment: All four models agree this is Level 1 documentation
with a complete chain from 1962 to the present. The collections in
both sales were named and significant. Named collection Tier B applies.

Multiplier: 1.18. New midpoint: $11,800. Band narrows by 15 percent.
Standard band on $10,000 midpoint would be plus or minus 25 percent
($7,500 to $12,500). Narrowed band is plus or minus 21 percent on the
new midpoint: approximately $9,300 to $14,300.

Report: "Comparable sales for this category establish a baseline range
of $8,000 to $12,000. The documented provenance through two major
auction house appearances, spanning 1962 to 1988, provides strong
authentication support and collection association that elevates the
estimate to $9,300 to $14,300, with a midpoint of approximately
$11,800. The provenance documentation is Level 1 and has been
independently confirmed by all four AI models."
