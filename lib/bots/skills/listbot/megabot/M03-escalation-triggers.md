---
name: listbot-megabot-escalation-triggers
description: >
  Defines when MegaBot must flag listing compliance issues, pause publication,
  and route items to human review. Covers VERO intellectual property risks on
  eBay, platform policy violations across five platforms, authentication
  requirements for high-value categories, and how to communicate compliance
  risk to sellers clearly without causing unnecessary alarm.
when_to_use: "MegaBot scans only. ListBot MegaBot lane."
version: 1.0.0
---

# M03 — Escalation Triggers: Compliance, VERO, and Human Review

## Purpose

A listing that gets removed after publication costs more than a listing that
never goes live. Removal damages seller metrics, triggers platform warnings,
and in repeat cases leads to account restrictions. MegaBot's ListBot lane
includes a compliance layer that runs before publication on every item.

This skill defines the conditions that trigger escalation — pausing automated
publication and routing the item to human review. It also defines how MegaBot
communicates compliance risk to sellers in language that is clear, specific,
and proportionate to the actual risk level.

---

## VERO and Intellectual Property Risk on eBay

eBay's Verified Rights Owner (VERO) program allows brand owners, artists,
and intellectual property holders to request removal of listings that infringe
their rights. VERO removals happen faster than appeals — a listing can be
removed within hours of going live. A seller account with multiple VERO
removals faces permanent restriction.

### VERO Trigger Conditions

MegaBot flags an item for VERO review when any of the following are detected
in the item data, photos, or AI analysis:

**Brand name in listing for non-genuine goods.** If the AI analysis identifies
a brand name (e.g., a maker field containing "Louis Vuitton," "Rolex," or
"Nike") and the item is identified as a reproduction, inspired-by variant, or
unverified attribution, MegaBot escalates before publication. The seller must
confirm authenticity or remove the brand reference.

**Aftermarket parts or accessories bearing original brand markings.** A
replacement watch strap marketed as "Rolex-compatible" is a VERO risk if it
carries the Rolex name in the title. MegaBot flags aftermarket goods that
reference protected brand names.

**Fan merchandise, derivative art, and licensed character imagery.** Items
bearing characters, logos, or imagery from entertainment properties are VERO
risks on eBay regardless of whether the seller created them. MegaBot flags
any item with entertainment IP imagery for seller confirmation before listing.

**Reproductions sold without reproduction disclosure.** Selling a reproduction
as the original, or omitting reproduction status, is both a VERO risk and a
platform policy violation. MegaBot flags when the AI analysis indicates a
reproduction and the draft listing does not include explicit reproduction
disclosure.

### VERO Risk Communication to Sellers

MegaBot does not use the word "counterfeit" unless the AI analysis has
explicitly identified the item as counterfeit. VERO risk communication uses
this framing:

"Before publishing this listing, we want to flag a potential intellectual
property consideration. This item references [brand name] in a context that
may require documentation of authenticity to comply with eBay's VERO program.
If you have authentication documentation, adding it to the listing significantly
reduces removal risk. If the brand reference can be removed without affecting
the listing's accuracy, we recommend that approach."

---

## Platform Policy Violations

### Prohibited Items

Each platform maintains a prohibited items list that is updated without notice.
MegaBot maintains a current prohibited category index and flags items that
fall within or near prohibited categories before drafting any listing.

High-risk prohibited categories that appear frequently in estate sale contexts:

- Prescription medications and medical devices requiring prescription
- Items containing regulated wildlife materials (ivory, tortoiseshell, certain
  feathers) — these trigger escalation with a specific note about CITES
  regulations and state-level restrictions
- Firearms, ammunition, and regulated accessories (platform-specific rules vary
  significantly — what is permitted on Craigslist may be prohibited on eBay)
- Alcohol (prohibited on most platforms for individual sellers)
- Currency and financial instruments (specific rules by platform and denomination)

When MegaBot identifies an item in or near a prohibited category, it halts
listing generation and routes the item to human review before any draft is
created. The seller receives a plain-language explanation of the specific
prohibition and, where applicable, the exception path (e.g., pre-1947 ivory
items with documentation may be permitted under exemptions on certain platforms).

### Keyword Spam Detection

Platform algorithms penalize listings with keyword stuffing — excessive
repetition of keywords, irrelevant category terms, or competitor brand names
used as keywords. MegaBot's compliance layer flags:

- Keyword repetition: the same root word appearing more than twice in an
  eBay title
- Competitor brand name mentions in descriptions intended to capture their
  search traffic (e.g., "better than Pottery Barn")
- Category-hopping language: terms from unrelated categories inserted to
  appear in broader searches

Keyword spam violations result in reduced search rank, not typically in listing
removal — but the risk of account-level action increases with repeat violations.
MegaBot corrects keyword spam automatically and notes the correction in the
output log.

### Category Misplacement

Intentional or unintentional category misplacement is a policy violation on
eBay and Etsy. MegaBot cross-references AI analysis results against the
platform's category taxonomy and flags when:

- The seller-selected category does not match the AI-identified item type
- The item belongs to a restricted sub-category with additional listing
  requirements (e.g., fine jewelry requiring diamond certificate disclosures)
- The item's category has platform-specific listing format requirements that
  differ from the standard form

Category misplacement flagged by MegaBot is corrected automatically when
confidence is high. When confidence is moderate (AI analysis suggests a
category but cannot confirm), MegaBot presents the recommended category
change to the seller with the reasoning.

### Price Manipulation Flags

Platforms monitor for price manipulation signals: listing an item far above
market value to manufacture a markdown, using auction format to obscure a
reserve price that exceeds market value, or coordinating with other sellers
on pricing in specific categories.

MegaBot flags listings where the seller-specified asking price exceeds
MegaBot's market valuation range by more than 40% without a documented
rationale. The seller is presented with comparable sold listings and asked
to confirm or adjust before publication.

---

## Authentication Requirements

### High-Value Item Thresholds

Items with AI-estimated values above platform-specific thresholds require
authentication documentation or additional disclosure before MegaBot
proceeds with listing generation.

Platform thresholds for authentication review:

- eBay: items valued above $500 in fine jewelry, watches, designer goods,
  and authenticated memorabilia categories
- 1stDibs: all items — editorial review is inherent to the platform
- Chairish: items valued above $1,000 in fine art and significant antiques

When an item crosses an authentication threshold, MegaBot pauses listing
generation and requests seller confirmation of any existing authentication
documentation (certificate of authenticity, auction house provenance,
appraisal letter). If documentation exists, it is incorporated into the
listing. If not, MegaBot generates the listing with appropriate "seller
represents" language and flags the authentication gap in the output log.

### Category-Specific Authentication Triggers

Certain categories trigger authentication review regardless of value:

- Fine jewelry with gemstone claims (diamond, ruby, sapphire, emerald)
- Signed fine art (the signature must be stated as "attributed to" or
  "appears to be signed" unless the seller has authentication)
- First editions and rare books with value claims
- Sports and entertainment memorabilia with signature claims
- Vintage wine and spirits (authentication and provenance chain required)

MegaBot does not generate listings that state authentication claims as fact
when the AI analysis has not confirmed them. Overstated authentication claims
are a material misrepresentation that exposes the seller to buyer disputes,
platform violations, and in high-value cases, legal liability.

---

## The Cost Calculus: Removal vs Review

A listing removal on eBay has measurable costs beyond the inconvenience of
re-listing:

- Seller defect rate increases, which affects search rank across all listings
- Multiple removals in a period trigger account review
- VERO removals can result in permanent category restrictions
- A removed listing that the buyer had already seen and saved generates
  a negative trust signal when the buyer searches again and finds it gone

A compliance review that delays publication by 24 hours costs nothing
measurable. MegaBot's escalation threshold is set to favor the 24-hour
delay over the post-removal recovery.

---

## Human Review Routing

When an item requires human review, MegaBot routes it to a review queue with
a structured summary containing:

- Item identification (title, category, estimated value)
- Specific escalation trigger (VERO risk, prohibited category, authentication
  gap, price anomaly)
- Recommended resolution path (documentation needed, listing modification,
  category change, or manual approval to proceed as-is)
- Estimated impact if published without resolution (removal risk level:
  low, moderate, high, certain)
- Seller-facing message text, pre-drafted for the review agent to approve
  and send

No item in human review status is published automatically. The queue is
cleared by human confirmation, not by a timer or automated fallback.
