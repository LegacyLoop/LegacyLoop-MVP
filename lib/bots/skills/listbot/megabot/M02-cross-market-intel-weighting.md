---
name: listbot-megabot-cross-market-intel-weighting
description: >
  Platform-specific optimization weighting for MegaBot listing consensus.
  Covers how eBay Cassini, Etsy search, Facebook feed, 1stDibs curation,
  and Chairish quality filters each reward different listing signals, and
  how MegaBot weights algorithm preferences to produce platform-native
  listings from a single item intake.
when_to_use: "MegaBot scans only. ListBot MegaBot lane."
version: 1.0.0
---

# M02 — Cross-Market Intelligence Weighting

## Purpose

No two platforms reward the same listing signals. A title structure that ranks
first on eBay will read as robotic on Facebook. A description optimized for
1stDibs catalog standards will be ignored on Craigslist. MegaBot's ListBot
lane does not generate one listing and adapt it. It generates platform-native
output for each destination, weighted by that platform's algorithm priorities.

This skill defines the weighting logic. It tells MegaBot how to allocate
keyword budget, structure titles, format descriptions, and set price
presentation for each platform. It also defines the keyword consensus
protocol — how MegaBot resolves disagreements between agents when their
keyword recommendations conflict.

---

## Platform Algorithm Profiles

### eBay — Cassini Algorithm

Cassini is a relevance and conversion-weighted search engine. Its primary
ranking signals are:

- Exact keyword match in the title, front-loaded within the first 40 characters
- Item specifics completeness (missing fields are penalized in search rank)
- Seller performance metrics (feedback score, defect rate, shipping speed)
- Historical sell-through rate for the category
- Price competitiveness relative to recent sold listings

MegaBot's eBay weighting priorities:

1. Title keyword precision (highest weight)
2. Item specifics coverage (required before publication)
3. Price within 15% of comparable sold listings (flagged if outside range)
4. Condition grade matching eBay's defined condition scale
5. Shipping: free shipping is a Cassini ranking factor — MegaBot flags when
   included shipping would improve rank without material margin impact

eBay title structure: [Primary Keyword] [Brand/Maker] [Model/Pattern] [Material]
[Condition Qualifier] [Era/Period] [Distinguishing Detail]

Character budget: 80 characters. Every character is allocated by priority.
MegaBot does not pad eBay titles with low-value words to reach 80 characters.
A 65-character title with high-precision keywords outperforms an 80-character
title that includes filler.

### Etsy — Tag-Driven Semantic Search

Etsy's search algorithm weights the 13-tag budget heavily. Tags are not
redundant with the title — they should cover adjacent search intents the title
does not capture. A buyer searching "mid-century modern side table" and a buyer
searching "1960s Danish teak occasional table" may be looking for the same item.
Both search intents need coverage.

MegaBot's Etsy weighting priorities:

1. Tag diversity (each tag targets a distinct search intent)
2. Title front-loading (Etsy weights the first 3 words of the title most heavily)
3. Category path precision (deep category placement improves search surface)
4. Material and technique fields (Etsy's algorithm uses structured attributes)
5. Recency signal: relisting or renewing underperforming listings resets
   the recency bonus — MegaBot notes listing age in its output

Etsy description structure: narrative first paragraph (buyer-facing story),
followed by structured bullet points (dimensions, materials, condition,
shipping notes). Etsy buyers expect a human voice. Catalog tone performs
below average on this platform.

### Facebook Marketplace — Feed Algorithm

Facebook Marketplace listings compete for attention within a social feed
context. The algorithm weights:

- Engagement signals (saves, messages, shares)
- Geographic proximity to the searcher
- Recency (listings older than 7 days see significant rank decay)
- Price competitiveness within the local market
- Photo quality (higher-quality images generate more saves)

MegaBot's Facebook weighting priorities:

1. Opening hook in the first sentence (Grok-authored, conversational)
2. Price display (Facebook buyers expect to see the price in the first scroll)
3. Local signal (city/region reference in the description improves proximity match)
4. Condition stated plainly in the first three lines (not buried)
5. Call to action: Facebook buyers want to know the preferred contact method

Facebook title structure: conversational, not keyword-stuffed. "1960s Danish
Teak Side Table — Excellent Condition" outperforms "Danish Teak Side Table
Mid Century Modern 1960s MCM Vintage" on Facebook. The latter reads as
marketplace spam and reduces engagement.

### 1stDibs — Curation-Reviewed Listings

1stDibs listings are reviewed by editorial staff before publication. The
platform serves collectors and interior designers who expect auction-house
precision. Algorithm ranking is secondary to editorial acceptance.

MegaBot's 1stDibs weighting priorities:

1. Attribution accuracy (maker, period, country of origin — verified or
   noted as "attributed to" or "in the manner of")
2. Condition disclosure (1stDibs uses a defined condition scale; MegaBot
   maps AiResult condition_score to the platform's grade)
3. Provenance statement (any documented history improves editorial acceptance)
4. Price positioning (1stDibs buyers pay premium prices; pricing below market
   signals lack of confidence in the attribution)
5. Dimensions in both imperial and metric (international buyer base)

1stDibs description structure: catalog format — one attribution paragraph,
one condition paragraph, one provenance paragraph, dimensions table. No
marketing language. No urgency framing. The authority comes from precision,
not enthusiasm.

### Chairish — Quality-Filtered Vintage Marketplace

Chairish applies a quality filter at submission. Listings with poor photos,
vague descriptions, or inconsistent condition grading are rejected. The
platform's search algorithm rewards:

- Complete attribute fields (style period, color, material, dimensions)
- High-resolution photos with neutral backgrounds
- Condition grading that matches Chairish's defined scale
- Competitive pricing relative to similar sold items on the platform

MegaBot flags Chairish-specific photo requirements: white or neutral background
preferred, no flash glare, no staging props that obscure the item.

### Craigslist — Economy of Information

Craigslist buyers are local, price-sensitive, and skeptical. The platform
rewards brevity, clear pricing, and direct communication. A Craigslist listing
that reads like an eBay description loses credibility.

MegaBot's Craigslist weighting priorities:

1. Price in the title (non-negotiable — omitting price reduces response rate)
2. Three-line description maximum for the opening (what it is, condition, price)
3. Local pickup specifics (neighborhood or cross-streets, not full address)
4. One clear call to action (text-preferred or call)
5. Repeat price at the bottom of the listing

---

## The Keyword Consensus Protocol

MegaBot generates keyword recommendations from all four agents simultaneously.
The consensus protocol resolves conflicts using the following hierarchy:

### Level 1: Full Consensus

When all four agents recommend the same keyword or phrase for a given platform,
that keyword enters the final listing with maximum confidence. These keywords
are placed in the highest-visibility positions: the first 40 characters of an
eBay title, the first three words of an Etsy title, the opening sentence of
a Facebook description.

### Level 2: Three-Agent Consensus

When three agents agree on a keyword and one dissents, the keyword enters the
listing with high confidence. The dissenting recommendation is evaluated:
if the dissenting agent is Gemini (which has real-time search data), its
recommendation is added as a secondary keyword in a lower-visibility position.

### Level 3: Split Decision

When two agents recommend one keyword and two recommend another, the conflict
is resolved by platform-specific sold listing data. MegaBot queries its market
data layer for which keyword appears more frequently in titles of recently sold
comparable items on the target platform. The higher-frequency keyword wins.

If sold listing data is unavailable, the conflict is resolved by agent
specialty: Gemini's recommendation wins for eBay and Etsy (search-algorithm
platforms). Grok's recommendation wins for Facebook (social-algorithm platform).
Claude's recommendation wins for 1stDibs and Chairish (curation platforms).

### Level 4: Keyword Demotion

A keyword recommended by any agent is demoted if:

- It does not appear in any sold listing title for comparable items in the
  past 90 days (signals declining or irrelevant search volume)
- It is flagged by OpenAI's compliance layer as a potential policy violation
- It is a seller-vocabulary term with no buyer-search equivalent (e.g., "grandma's
  china set" vs "Lenox Autumn pattern dinner service")

---

## Cross-Listing Content Adaptation

The same item requires different voice, structure, and keyword priority on
each platform. MegaBot does not translate — it generates platform-native
content from the item's core data.

The core data layer is platform-agnostic: item category, condition score,
maker, material, era, dimensions, key features. From this layer, MegaBot
generates five distinct listing versions, each weighted by the algorithm
profile defined in this skill.

A seller who lists on all five platforms from a single MegaBot intake
receives five different listings. They share accurate facts. They share no
templated language. Each reads as if it was written by someone who understands
the platform's audience.

This is not cosmetic variation. Platform audiences have different purchase
intent, different price sensitivity, and different trust signals. A 1stDibs
buyer and a Facebook Marketplace buyer making a purchase decision on the
same item need fundamentally different information in fundamentally different
formats. MegaBot's cross-market intelligence weighting ensures each listing
is optimized for its actual buyer, not a generic buyer.
