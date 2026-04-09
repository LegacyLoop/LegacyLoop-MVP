---
name: listbot-megabot-premium-output-standards
description: >
  Defines what a premium MegaBot ListBot output looks like across six platforms.
  Covers per-platform title and description structure, item specifics mapping,
  keyword density standards, photo order strategy, price presentation logic,
  listing readiness scoring, and the before/after contrast between generic
  AI output and specialist conversion-optimized listing copy.
when_to_use: "MegaBot scans only. ListBot MegaBot lane."
version: 1.0.0
---

# M05 — Premium Output Standards: What a Michelin-Star Listing Looks Like

## Purpose

A MegaBot ListBot output is not a draft. It is a publication-ready listing
package for each target platform, complete with a readiness score, adaptation
notes, and a clear record of the decisions made in generating it. The seller
receives something they can publish directly — or understand precisely what
is needed before they can.

This skill defines the exact structure of premium MegaBot ListBot output. It
establishes what separates specialist conversion-optimized copy from generic
AI output. It provides the before/after contrast that makes the quality
difference visible.

---

## The Full MegaBot ListBot Output Package

Every MegaBot ListBot output contains the following components. Components
are delivered in a structured format that maps directly to platform input
fields where applicable.

### 1. Item Intelligence Summary

Generated from the AI analysis layer before listing copy is produced. This
summary is the foundation all four agents draw from.

- Category classification (primary and secondary)
- Maker / Brand (confirmed, attributed, or unidentified)
- Material (primary and secondary)
- Era / Period (confirmed or estimated with confidence level)
- Style (design period, regional tradition, or aesthetic classification)
- Condition grade (overall, cosmetic, functional — scored 1-10)
- Notable features and distinguishing details
- Markings (signatures, stamps, labels, model numbers)
- Estimated dimensions
- Rarity classification (common / uncommon / rare / museum-significant)
- Market value range (low / mid / high with methodology note)

### 2. Per-Platform Titles

#### eBay (80 characters, Cassini-optimized)

Structure: [Primary Buyer Keyword] [Brand/Maker] [Qualifier] [Material] [Era]
[Condition Detail] [Distinguishing Feature]

The title is delivered with a character count, a keyword confidence score for
each major term, and a note on which element is occupying which position in
the character budget and why.

#### Etsy (140 characters, tag-driven)

Structure: Conversational but keyword-rich. First three words are the highest-
priority search terms. Remainder builds on the first three with qualifying
detail. No all-caps, no punctuation spam.

Delivered with 13 recommended tags, each targeting a distinct search intent.
Tags are ordered by estimated search volume: highest-volume tags first.

#### Facebook Marketplace (conversational, scroll-first)

Structure: Hook sentence first (the single most compelling fact about the item,
stated plainly). Price in the second sentence. Condition in the third. The
complete description is delivered as a short-form listing: 5-7 sentences,
no headers, no bullet points. Reads as human, not as a form.

#### 1stDibs (catalog-grade, editorial-ready)

Structure: Attribution paragraph (what it is, who made it, when, where, what
style period). Condition paragraph (honest, precise, using 1stDibs condition
scale language). Provenance paragraph (any documented history; if none, noted
as "provenance unrecorded"). Dimensions table (imperial and metric).

No marketing language. Authority is established through precision, not claims.
"A significant example of..." is stronger than "Rare and beautiful..."

#### Craigslist (economy of information)

Structure: One-line headline with price. Three-sentence description: what it
is, what condition it is in, and how to buy it. Contact method stated
explicitly. Price repeated at the bottom.

The Craigslist listing is the most stripped-down output in the package and
the most frequently underestimated. A Craigslist buyer who has to ask the
price before they respond is a buyer who will not respond.

#### Chairish (quality-filtered vintage marketplace)

Structure: Opening line establishes period and design significance. Second
paragraph covers condition with specificity. Third paragraph covers dimensions
and any care or restoration notes. Photo note is included (background
requirements, staging guidance specific to the item type).

---

### 3. Item Specifics Mapping (eBay)

Every eBay category has required and recommended item specifics fields.
A listing with incomplete item specifics is penalized in Cassini search rank
before a single buyer sees it.

MegaBot maps the AI analysis data to eBay's item specifics schema for the
assigned category. The output delivers:

- All required fields populated with validated values
- All recommended fields populated where AI data is sufficient
- Fields that require seller input flagged with a specific question
  (e.g., "Does this item have its original box or packaging?")

Missing item specifics are the single most common cause of preventable
search rank suppression on eBay. MegaBot treats this as a non-negotiable
output requirement, not an optional enhancement.

---

### 4. Keyword Density Report

For each platform, the output includes a keyword density summary:

- Primary keywords used, their position in the listing, and their confidence
  tier (Tier 1-4 as defined in M04)
- Keyword density percentage in the description (target range per platform:
  eBay 3-5%, Etsy 4-6%, Facebook 1-2%, 1stDibs below 2%)
- Over-density flags (any term appearing at a frequency that signals keyword
  stuffing to platform filters)
- Under-coverage flags (buyer search terms with strong sold listing evidence
  that did not make it into the listing, along with placement recommendations)

---

### 5. Photo Order Strategy

Photo sequence is a conversion variable. The hero shot is the search result
thumbnail. It determines whether the buyer clicks. The subsequent photo order
determines whether the buyer proceeds to purchase or leaves.

MegaBot's recommended photo sequence:

Position 1 (Hero): Clean, well-lit front view against neutral background.
The item fills 80% of the frame. No staging props that obscure the item.
This is the click-driver. Every other photo serves the sale; this one creates
the opportunity.

Position 2: Secondary angle that reveals a feature the hero shot does not
show (back detail, profile, underside if distinctive).

Position 3: Close-up of the most significant decorative, functional, or
identifying feature.

Position 4: Maker's mark, signature, label, or serial number (critical for
authentication and for buyers who search by mark).

Position 5: Condition close-up. If there is any wear, crack, chip, repair,
or imperfection, it belongs here. Sellers who omit condition photos receive
more disputes, more returns, and more negative feedback than sellers who
show imperfections honestly. Transparency here reduces friction.

Position 6+: Context shots, detail alternates, scale reference (item next to
a common object for size), or original packaging if present.

MegaBot delivers the recommended photo sequence as a numbered list with a
brief note on what each photo should capture. For items with existing photos
already uploaded to the LegacyLoop system, MegaBot maps existing photos to
sequence positions and identifies gaps.

---

### 6. Price Presentation

Pricing is not just a number. It is a frame. How the price is presented
shapes the buyer's perception of whether the price is fair before they
evaluate the evidence.

#### Price Anchoring

When the item has a retail equivalent or an established market reference point,
the listing references it: "Comparable examples at auction have recently sold
for $X to $Y." This anchor makes the asking price appear as a value decision,
not an arbitrary number.

MegaBot draws price anchors from the market data layer — sold listing comps,
auction results, dealer price references. Anchors are only included when the
data supports them. A fabricated anchor that a buyer can disprove in a
30-second search destroys credibility more than having no anchor at all.

#### Best Offer Strategy

For items in the $50-$500 range with moderate comparable sold volume, MegaBot
recommends listing with Best Offer enabled on eBay. The recommended offer
floor (the lowest offer to accept automatically) is set at 15% below the
asking price for common items and 25% below for rare items where negotiation
is expected.

Auction format is recommended only for items with verifiable rarity where
competitive bidding is likely. MegaBot flags items that meet the auction
threshold and provides a recommended starting price (typically 40-60% of
estimated market value to stimulate early bids).

For Buy It Now (BIN) without Best Offer: reserved for items where the seller
is not motivated to negotiate, where the market comparables support the price
with low variance, or where the item category convention is fixed-price.

---

### 7. Listing Readiness Score

Every MegaBot ListBot output includes a readiness score from 0 to 100 for
each target platform. The score reflects:

- Title keyword confidence (25 points)
- Item specifics completeness / description completeness (25 points)
- Photo coverage (20 points — based on photos already available vs recommended)
- Price alignment with market comps (15 points)
- Compliance status (15 points — full points if no flags, zero if escalation
  triggered)

A listing with a readiness score of 85 or above is ready to publish. A listing
between 70 and 84 has identified gaps the seller should address before
publishing. A listing below 70 has material gaps that will measurably reduce
performance and should not be published until resolved.

---

### 8. Cross-Listing Adaptation Notes

The final section of the output is a plain-language summary for the seller:

- Which platforms are recommended for this item and why
- Which platforms are not recommended and why (e.g., "This item is below the
  1stDibs price threshold for this category")
- Key differences between the platform listings and why they differ
  (not for editorial review — for seller understanding)
- Any item-specific notes that apply across platforms (e.g., "Confirm the
  maker's mark attribution before listing on 1stDibs — the current AI
  confidence on this attribution is moderate, not high")

---

## Before and After: Generic AI Output vs Specialist Conversion-Optimized Copy

### Generic AI Output (Single Model, No Consensus)

Title: "Vintage Ceramic Vase Blue and White Hand Painted Antique Beautiful"

Description: "This is a beautiful vintage ceramic vase with blue and white
hand painted design. It is in good condition with minor wear consistent with
age. A great addition to any collection or home decor. Please see photos for
more details. Smoke free home. Local pickup or shipping available."

What is wrong with this listing:

The title uses "beautiful" (no search value), "antique" without qualification
(eBay prohibits claiming antique status without meeting the 100-year standard),
and does not front-load the buyer's most likely search term. "Good condition
with minor wear" is the least informative condition statement possible —
it answers nothing. "Please see photos" is a phrase that signals the seller
could not describe the item. "Smoke free home" consumes space that could
provide item information and signals nothing to buyers in 2026. There is no
maker attribution, no era, no style classification, no dimensions, no price
anchor, no item specifics.

### Premium MegaBot Output (4-AI Consensus, Specialist Conversion-Optimized)

eBay Title (78 characters):
"Blue White Transferware Platter Adams English Ironstone 1840s Flow Blue Oval"

Description opening:
"Adams & Sons English ironstone platter in the flow blue transferware pattern
with a cobalt floral and scroll border on a white ground. Manufactured circa
1840-1860, consistent with the impressed Adams backstamp on the reverse.
The platter measures 14 inches in length and 10.5 inches in width.

Condition: Excellent for age. No chips, cracks, or repairs. Light crazing in
the glaze, expected for ironstone of this period and not detracting from
display. The backstamp is clear and complete.

Comparable flow blue Adams ironstone pieces in this condition have sold at
auction in the $180-$320 range. This listing is priced at market. Best offer
considered."

What this listing does that the generic output does not:

Every word in the title matches a term buyers of this category actually search.
The description answers the four questions a collector asks before purchasing:
what is it exactly, who made it, when, and what condition is it in — with
specifics that allow a buyer to make a purchase decision without sending a
message. The price anchor is data-supported and positions the asking price
as reasonable rather than arbitrary. The condition disclosure is honest and
specific enough that a buyer who purchases will not be surprised by what
they receive. Best offer is included because the category convention supports
negotiation.

This is the standard every MegaBot ListBot output is built to meet.
