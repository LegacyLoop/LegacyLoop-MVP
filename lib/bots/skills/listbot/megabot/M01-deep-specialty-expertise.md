---
name: listbot-megabot-deep-specialty-expertise
description: >
  Multi-platform listing consensus for 4-AI parallel listing generation.
  Defines what each AI agent contributes to the MegaBot ListBot lane,
  how agents validate listing optimization claims, and why a specialist
  consensus approach consistently outperforms single-model listing output.
when_to_use: "MegaBot scans only. ListBot MegaBot lane."
version: 1.0.0
---

# M01 — Deep Specialty Expertise: 4-AI Listing Consensus

## Purpose

This skill governs how MegaBot's ListBot lane uses four AI agents in parallel
to produce listing copy that outperforms any single model. Each agent brings
a distinct epistemic lens. The consensus layer decides which signals to trust,
which to discard, and how to synthesize them into platform-specific listings
that convert.

The difference between a listing that sells in three days and one that sits
for ninety days is not luck. It is the precision with which the listing speaks
to the buyer who is already searching — the right keyword in the first eight
words, the right detail in the second sentence, the right price anchor at the
bottom. This skill teaches MegaBot how to produce that precision at scale.

---

## What Each Agent Contributes

### Claude (Anthropic)

Claude leads the structured high-conversion copy layer. Its strength is
long-form coherence, auction-house catalog tone, and benefit-driven description
architecture. When a listing requires provenance language, condition disclosure
that builds rather than undermines confidence, or a narrative that positions
an ordinary object as a considered purchase, Claude authors that layer.

Claude also serves as the internal editor. After all agents generate their
output, Claude evaluates structural logic: does the title front-load the
highest-value keyword? Does the description answer the buyer's three core
questions (what is it, what condition is it in, why is this price fair) in the
first two paragraphs? Does the listing close with a clear action signal?

Claude does not optimize for virality. Claude optimizes for trust. In
categories where buyer hesitation is high — antiques, fine jewelry, vintage
electronics — trust copy converts at a higher rate than excitement copy.

### Grok (xAI)

Grok contributes the native platform voice layer. Its strength is real-time
cultural resonance, social-first phrasing, and the kind of hook that stops a
scroll. On Facebook Marketplace and Craigslist, where listings compete with
social content, a Grok-authored opening sentence performs materially better
than a formally structured one.

Grok also generates TikTok-style scroll-stopper variants that MegaBot uses
when a seller opts into social listing distribution. These are not gimmicks.
On platforms where the feed is the storefront, native voice is the difference
between a listing that gets clicked and one that gets passed.

Grok's weakness is precision. It can overstate rarity or uniqueness. The
consensus layer filters Grok's claims through factual validation before any
claim reaches a final listing.

### Gemini (Google)

Gemini contributes the real-time keyword intelligence layer. Its access to
current search trend data, Google Shopping signals, and indexed marketplace
keyword performance gives it a structural advantage in keyword selection that
no static model can replicate.

When Gemini identifies that a specific descriptive phrase is appearing in
high-conversion eBay sold listings for similar items in the past ninety days,
that phrase enters the keyword consensus as a high-confidence signal. Gemini
also flags declining keywords — terms that were strong six months ago but are
losing search volume — so MegaBot does not optimize for yesterday's traffic.

Gemini's weakness is listing voice. Its raw output requires significant
editorial refinement before it reads as human and persuasive. The consensus
layer routes Gemini output through Claude's editorial pass before publication.

### OpenAI (GPT-4o)

OpenAI contributes the structured format compliance layer. eBay item specifics,
Etsy attribute fields, 1stDibs required catalog metadata — these structured
fields require precise, valid values, not creative language. OpenAI maps item
attributes to platform-required field formats with high accuracy.

OpenAI also performs the final compliance check: does the title exceed the
platform character limit? Are all required fields populated? Does the
description contain any terms that trigger platform content filters?

OpenAI's weakness is creative differentiation. Its listings, unedited, are
competent but undistinguished. MegaBot uses OpenAI output as the structural
skeleton and Claude output as the persuasive tissue.

---

## Why Consensus Outperforms Any Single Model

A single AI generates one listing. MegaBot generates four, then selects the
highest-confidence elements from each. This is not averaging — averaging
produces mediocre output. This is competitive selection with a defined rubric.

The rubric weighs:

- Keyword accuracy (Gemini-primary, OpenAI-validated)
- Compliance (OpenAI-primary, Claude-verified)
- Voice quality (Claude-primary for catalog, Grok-primary for social)
- Platform-native formatting (OpenAI-primary)
- Conversion structure (Claude-primary)

When all four agents agree on a keyword, a description structure, or a price
framing, that element enters the final listing with high confidence. When
agents disagree, the conflict is resolved by platform algorithm data — not
by averaging or majority vote.

---

## The 3-Day vs 90-Day Listing

A listing sells in three days when it matches the buyer's exact search query,
presents condition clearly enough that the buyer does not need to ask a
question before purchasing, and is priced within the range the buyer already
believes is fair for this type of item.

A listing sits for ninety days when the title uses the seller's language
instead of the buyer's language, when the description front-loads irrelevant
detail (how the seller acquired it, family history the buyer does not need),
and when the price requires justification the listing does not provide.

MegaBot's 4-AI consensus directly addresses each failure mode:

- Gemini corrects the language gap (seller vs buyer vocabulary)
- OpenAI corrects the format gap (missing fields, incorrect category)
- Claude corrects the persuasion gap (why this item, why this price)
- Grok corrects the attention gap (social platforms, scroll-first environments)

A listing that passes 4-AI consensus review before publication is not
guaranteed to sell in three days. But it has been stress-tested against each
of the primary failure modes that cause listings to sit.

---

## Specialist-Level Platform Expertise

### eBay

eBay Cassini rewards exact-match keyword density in the first 40 characters of
the title, complete item specifics, and high sell-through rate in the category.
MegaBot treats eBay as the highest-rigor platform. Every element of an eBay
listing is optimized with algorithm compliance as the primary constraint.

### Etsy

Etsy search is tag-driven. The 13-tag budget requires precision selection —
each tag should target a distinct search intent, not repeat the title keywords.
MegaBot generates Etsy-specific tag sets that maximize search surface coverage.

### Facebook Marketplace

Facebook feed algorithm rewards engagement signals (saves, shares, messages)
more than keyword precision. MegaBot's Facebook layer optimizes for the hook
and the photo caption, not the keyword density.

### 1stDibs and Chairish

Luxury platform curation is human-reviewed. MegaBot generates catalog-grade
descriptions that meet editorial standards: precise attribution, accurate
period dating, condition grading consistent with auction house standards.

### Craigslist

Craigslist rewards brevity and local signal. MegaBot generates stripped-down
listings that communicate the essential details, include a price, and close
with a clear contact instruction.

---

## Quality Assurance

Before any listing exits MegaBot's ListBot lane, it passes the following
automated checks:

1. Title character count within platform limits
2. Required fields populated (eBay item specifics, Etsy attributes)
3. No prohibited terms flagged by platform content policy
4. Keyword density within platform-preferred range (not stuffed, not sparse)
5. Price within 20% of MegaBot's market valuation range
6. Condition disclosure present and consistent with AiResult condition_score

A listing that fails any check is returned to the consensus layer for revision,
not published with a flag. The seller receives a clean listing or a clear
explanation of what is blocking publication.
