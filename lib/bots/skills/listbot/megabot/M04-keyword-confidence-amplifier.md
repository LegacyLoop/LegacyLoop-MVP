---
name: listbot-megabot-keyword-confidence-amplifier
description: >
  Defines how 4-AI consensus validates and weights keyword strategy in MegaBot
  ListBot lane. Covers confidence scoring for keyword recommendations, the
  resolution protocol for agent disagreements, long-tail vs short-tail weighting
  by item rarity, and the 80-character eBay title budget optimization logic.
when_to_use: "MegaBot scans only. ListBot MegaBot lane."
version: 1.0.0
---

# M04 — Keyword Confidence Amplifier: 4-AI Validation of SEO Strategy

## Purpose

Keyword strategy is the highest-leverage single element of a marketplace
listing. A title with the wrong keywords can be perfectly written and still
fail to appear in the buyer's search. MegaBot's keyword confidence amplifier
runs all four agents through a structured keyword evaluation protocol,
assigns confidence weights to each recommendation, and resolves conflicts
through a defined hierarchy that prioritizes platform evidence over agent
preference.

This skill defines that protocol in detail, including how confidence is
assigned, how conflicts are resolved, how rarity affects the long-tail vs
short-tail decision, and how the 80-character eBay title budget is allocated
using consensus output.

---

## Why Consensus Keyword Validation Outperforms Single-Model Keyword Research

A single AI recommending keywords is working from training data, general SEO
principles, and pattern matching. It does not have access to what is actually
selling on the platform right now. It does not know that the term "MCM" has
been declining in eBay search volume for six months while "mid-century modern"
has been climbing. It does not know that "danish modern" outperforms "danish
teak" for a specific subcategory of Etsy buyers.

MegaBot's 4-AI keyword consensus addresses this limitation by running
recommendations from multiple epistemic sources simultaneously:

- Gemini provides real-time search signal data
- OpenAI provides structural format compliance and field mapping
- Claude provides auction-vocabulary precision and condition language
- Grok provides native platform voice and social-first phrasing

When these agents agree, the confidence is high. When they disagree, the
disagreement reveals something: either the item sits at a vocabulary boundary
(multiple valid terms with different audience segments) or one agent is
optimizing for the wrong signal. The confidence amplifier resolves this.

---

## Confidence Weight Assignment

Each keyword recommendation from each agent receives a confidence weight
based on the evidence supporting it.

### Tier 1 — Direct Sold Listing Evidence (Highest Weight)

A keyword that appears in the title of a recently sold comparable item on
the target platform receives the highest confidence weight. This is not
theoretical optimization. This is what buyers searched, found, and purchased.
No other evidence source outweighs direct sold listing data.

MegaBot's market data layer queries sold listing titles for comparable items
(same category, similar era, similar material, similar price range) within
the past 90 days. Keywords appearing in more than 30% of those titles are
classified as Tier 1 for that platform.

### Tier 2 — Current Search Volume with Buyer Intent Signal (High Weight)

A keyword with measurable current search volume on the platform, where the
search behavior is consistent with purchase intent (not informational research),
receives high confidence. Gemini is the primary agent for Tier 2 signals.

Purchase intent search behavior characteristics: specific descriptors rather
than broad category terms, price-comparison phrasing, seller-qualifying terms
("for sale," "near me," "shipping available"), or high click-through-to-purchase
conversion rates on similar listings.

### Tier 3 — Multi-Agent Agreement Without Platform Data (Moderate Weight)

When all four agents recommend the same keyword but sold listing data is
unavailable or insufficient (rare items with fewer than five sold comps),
the keyword receives moderate confidence. It enters the listing but is placed
in mid-title or mid-description positions rather than front-loaded.

### Tier 4 — Single-Agent Recommendation Without Corroboration (Low Weight)

A keyword recommended by only one agent and not supported by sold listing
data or search volume evidence receives low confidence. Low-confidence keywords
are placed in the tag field or the bottom of the description — not in the
title. They provide search surface coverage without consuming high-visibility
real estate.

---

## Conflict Resolution Protocol

When agent recommendations conflict on a keyword, the resolution follows a
strict hierarchy.

### Step 1: Check Sold Listing Data

Query the market data layer for the conflicting keywords. The keyword with
higher frequency in sold listing titles for comparable items on the target
platform wins. This step resolves approximately 70% of keyword conflicts
in estate sale categories.

### Step 2: Apply Platform Algorithm Specialty

If sold listing data does not resolve the conflict (insufficient comps, equal
frequency, or no data available), apply agent platform specialty:

- eBay and Etsy conflicts: Gemini's recommendation wins (search-algorithm
  platforms where real-time keyword data is the decisive signal)
- Facebook Marketplace conflicts: Grok's recommendation wins (social-algorithm
  platform where native voice and engagement signals dominate)
- 1stDibs and Chairish conflicts: Claude's recommendation wins (curation
  platforms where vocabulary precision and auction-house accuracy matter most)
- Craigslist conflicts: OpenAI's recommendation wins (format compliance and
  brevity are the primary optimization signals on this platform)

### Step 3: Dual-Entry for Unresolved Splits

When the conflict cannot be resolved by sold listing data or platform specialty
(rare, typically for highly unusual items with no comparable market), both
keywords enter the listing — primary keyword in the title, secondary keyword
in the description and tags. The output log notes the conflict for seller
review.

---

## Long-Tail vs Short-Tail Weighting by Item Rarity

The long-tail vs short-tail decision is the most consequential keyword
strategy choice. Getting it wrong means optimizing for traffic that will not
convert, or missing the specific buyer who would purchase immediately.

### Common Items: Short-Tail Priority

Items with high comparable sold volume (more than 50 comparable sold listings
in the past 90 days on the target platform) should prioritize short-tail
keywords. These items have many competing listings. Ranking for broad, high-
volume terms is the path to visibility.

Example: A Lenox china set in a common pattern. Short-tail priority terms:
"Lenox china set," "fine china," "dinner service." Buyers searching for common
Lenox patterns use category-level terms and browse. Long-tail terms like the
specific pattern name are secondary — include them, but do not sacrifice the
short-tail position for them.

### Uncommon Items: Balanced Long-Tail and Short-Tail

Items with moderate comparable sold volume (10-50 sold comps in 90 days)
benefit from a balanced strategy. Establish category visibility with short-tail
terms, then capture specific-intent buyers with long-tail qualifiers.

Example: A Depression-era glass serving set in a less-common color. Short-tail:
"Depression glass," "vintage glass serving set." Long-tail: the specific
pattern name, the color name as collectors refer to it, the manufacturer.
The specific buyer who wants this exact pattern searches the long-tail. The
general buyer who might be interested in any Depression glass starts with
the short-tail.

### Rare Items: Long-Tail Dominance

Items with fewer than 10 sold comparables in 90 days require long-tail
dominance. There is no meaningful search volume for broad category terms
because buyers who want these items already know exactly what they are looking
for. They search by maker, model, period, and specific identifying details.

Example: A documented piece of art pottery from a small regional studio.
The buyer is a collector who searches the studio name, the artist's name,
the pattern name, the glaze designation. A title that leads with "vintage
pottery vase" is invisible to this buyer. A title that leads with the studio
name and pattern designation is the first result for the only buyer who matters.

MegaBot's rarity classification uses sold listing volume to select the
long-tail vs short-tail strategy automatically. The output notes the
classification rationale.

---

## The 80-Character eBay Title Budget

eBay's 80-character title limit is a precision constraint. Every character
is a decision. MegaBot's consensus optimization allocates the budget by
priority tier.

### Character Budget Allocation Framework

Position 1-40: Front-loaded high-confidence keywords. The buyer's search
query must appear here. Cassini weights the first 40 characters most heavily
for relevance matching. No filler, no articles, no generic terms in this zone.

Position 41-65: Qualifying detail. Brand name (if not in the first 40),
material, era, or condition qualifier. These terms improve precision matching
for buyers who have already searched the primary keyword and are now filtering.

Position 66-80: Differentiating detail. What makes this specific item
different from other items of the same type. Pattern name, colorway, size,
notable feature. If the title is already optimized in positions 1-65, this
zone provides additional long-tail surface.

### What Never Goes in an eBay Title

- Punctuation beyond hyphens and ampersands (commas, periods, exclamation
  marks do not improve search rank and consume character budget)
- Seller commentary ("Look!" "Must See!" "Rare Find!") — these terms
  do not match any buyer's search query
- Duplicate keywords — Cassini does not reward repetition; the second
  instance of any root word is wasted characters
- Vague qualifiers that carry no search signal ("Nice," "Beautiful,"
  "Lovely") — substitute specific descriptors ("Mint Condition," "All
  Original," "Museum Quality" where accurate)

### Consensus Title Construction

MegaBot constructs the eBay title by running the full 80 characters through
a four-agent review. Claude evaluates persuasion and precision. Gemini
validates keyword search volume. OpenAI validates character count and format
compliance. Grok identifies any terms that signal spam to a human reader.

A title that passes all four evaluations is presented to the seller as the
recommended title. A title that fails one or more evaluations is revised
by the consensus layer before presentation. The seller never sees a title
that has failed MegaBot's internal review.

---

## Keyword Decay and Refresh

Keyword strategy is not set once and maintained indefinitely. Search behavior
shifts. Platform algorithm updates alter which terms receive ranking signals.
Category trends change what buyers search.

MegaBot notes a keyword freshness date on every listing output. Listings
that have not sold within 30 days are flagged for keyword review. The review
compares current sold listing title frequency against the keywords in the
existing listing. When decay is detected — keywords that were Tier 1 at
listing time have dropped below 15% frequency in current sold titles —
MegaBot generates a revised title and presents it to the seller as a
recommended update.

This is the structural reason why MegaBot's listings outperform manually
written listings over time, not just at the point of publication. The keyword
confidence amplifier is a continuous process, not a one-time optimization.
