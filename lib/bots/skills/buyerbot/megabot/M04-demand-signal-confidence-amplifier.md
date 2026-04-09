---
name: buyerbot-megabot-demand-signal-confidence-amplifier
description: >
  Defines how four-AI consensus amplifies demand signal confidence in MegaBot.
  Covers confidence weighting by signal quality, consensus mechanics for
  price band narrowing, conflict analysis when signals diverge, seasonal vs.
  trend vs. permanent demand classification, and how market velocity modifies
  confidence scoring.
when_to_use: "MegaBot scans only. BuyerBot MegaBot lane."
version: 1.0.0
---

# BuyerBot MegaBot Skill: Demand Signal Confidence Amplifier

## Purpose

Demand signals are not created equal. A Reddit WTB post naming a specific item
and stating a budget is categorically different from an Instagram Like. Treating
them as equivalent produces pricing recommendations that mislead sellers and
outreach strategies that waste resources. This skill defines the confidence
weighting system BuyerBot applies to demand signals in the MegaBot lane, the
mechanics of how four-AI consensus narrows the recommended price band, and the
classification framework that distinguishes temporary from permanent demand.

## Signal Quality Confidence Weights

BuyerBot assigns a base confidence weight to each signal type before applying
platform and consensus modifiers. These weights are the starting point for all
demand analysis.

### Highest Confidence Signals (Weight: 85-100)

Completed transactions on specialist platforms: A sold listing on eBay, Etsy,
1stDibs, or an auction house database for a directly comparable item at a
known condition tier is the highest-confidence signal in the system. Weight:
100. This is market truth — a real buyer paid real money.

Direct purchase inquiries received by the seller: A buyer who has already
contacted the seller about this specific item has self-identified as a serious
prospect. Weight: 95. The only uncertainty is whether the buyer is qualified
(willing to meet price) versus interested (curious).

WTB posts with specific item description and stated budget: A Reddit WTB post
or Facebook Group ISO post that names the maker, approximate era, condition
preference, and a price range is a buyer who has completed research and is
in a transaction-ready state. Weight: 90.

Dealer inquiry or offer: A dealer who makes an unsolicited offer on an item
has done their own market analysis and is pricing in their resale margin.
The offer is the floor, not the ceiling — but the existence of a dealer offer
confirms that professional market participants see value. Weight: 85.

### High Confidence Signals (Weight: 60-84)

WTB posts without stated budget: A WTB post that specifies the item but not
a price range indicates purchase intent without price validation. The buyer
is serious but their willingness-to-pay is unknown. Weight: 75.

Active eBay listing with forty or more watchers that has not sold: Buyer
interest exists at some price below the current ask. This is a negotiation
signal — the market clearing price is below the listed price but above zero.
Weight: 70.

Multiple visits to the same online listing from the same session or user:
Repeat engagement on a single listing indicates evaluation behavior, not
casual browsing. Weight: 65.

Bid history showing a bidder reaching but not winning reserve: This buyer
wants the item and has committed real money to the attempt. They are a
recoverable lost buyer for comparable items. Weight: 65.

Collector forum thread discussing the specific item type with active recent
engagement: An active conversation in a specialist community confirms buyer
awareness and category health. Weight: 60.

### Moderate Confidence Signals (Weight: 30-59)

Instagram saves or Pinterest saves on images featuring comparable items:
Aspirational interest exists. Timeline to purchase is indeterminate. Weight: 45.

Category-level search volume growth in Gemini data: More people are searching
for this type of item than thirty days ago. This is a leading indicator but
not a buyer-specific signal. Weight: 40.

TikTok engagement with content featuring comparable items: Cultural attention
is present. Conversion to actual purchase is low and delayed. Weight: 30.

### Low Confidence Signals (Weight: 1-29)

Generic positive comments on social media posts: "Love this" comments on an
Instagram post featuring a comparable item. Emotional resonance but no
purchase proximity. Weight: 15.

Category-level news coverage: A newspaper or magazine article about the
collector market for this category. Awareness signal, not intent signal. Weight: 10.

A single non-specialist article or blog post mentioning the item type: Noise-
level signal. Logged but not weighted meaningfully in demand analysis. Weight: 5.

## Four-AI Consensus and Price Band Narrowing

The power of MegaBot's four-AI architecture is that independent models scanning
the same item from different data sources can confirm or challenge each other.
When they confirm, confidence rises and the recommended price band narrows.
When they challenge, the discrepancy reveals something important about the
nature of demand for this specific item.

### All Four Models Agree: High Confidence, Narrow Band

When Grok, Claude, Gemini, and OpenAI each independently return demand signals
pointing to the same buyer segment and approximate price range, MegaBot applies
a consensus multiplier that narrows the recommended listing price band by forty
percent relative to the single-model baseline.

Example: A single-model analysis might recommend listing a vintage watch
between $2,400 and $3,800 based on eBay comps alone. When all four models
confirm strong collector demand, verified search growth, active community
engagement, and structured buyer profiles at the same price tier, the band
narrows to $2,900 to $3,400. The seller gets a specific, defensible price
recommendation rather than a wide hedge.

High consensus also accelerates the recommended listing timeline. Four-model
agreement is a signal to act now, not study the market further.

### Three of Four Models Agree: Moderate Confidence

Three-model agreement produces a moderate confidence rating. The price band
narrows by twenty percent relative to the single-model baseline. The dissenting
model's data is logged and presented to the seller as a caveat: "Three of our
four analysis models confirm strong demand in the $X to $Y range. One model
flagged lower engagement in [specific platform or channel], which may indicate
this channel warrants lower expectations."

### Two of Four Models Agree: Split Signal — Flag and Explain

Two-model agreement often indicates a split-market situation where the item
has genuine appeal to two distinct buyer segments that do not overlap — and
those segments have different price tolerances. A mid-century chair might draw
strong signals from the decorator market (design-focused buyers who will pay
for aesthetics) and moderate signals from the furniture collector market
(provenance-focused buyers who require documentation). These are different
buyers with different price ceilings.

The correct output for two-model agreement is not an averaged price band. It
is a dual-segment recommendation: "This item has two distinct buyer audiences.
Audience A [description] has shown demand at $X to $Y. Audience B [description]
has shown demand at $P to $Q. We recommend leading with Audience A outreach for
fourteen days, then opening Audience B if no transaction closes."

### Demand Signals Conflict — High Social Buzz, Low Marketplace Sales

This specific conflict pattern is the most important to diagnose correctly.
High social engagement with low completed transaction volume can mean three
different things, and they require different responses.

Meaning one: the item is aspirational but not transactional at current prices.
Social buyers desire it but cannot afford it. The price ceiling is lower than
the social signal implies. Response: list conservatively, use urgency language
to convert the aspiration into action.

Meaning two: the item is at the beginning of a collector market formation.
Social interest precedes marketplace infrastructure. Buyers exist but the
listing ecosystem has not yet developed to connect them efficiently. Response:
this is an early-mover opportunity. List now, lead with specialist community
channels rather than mass-market platforms.

Meaning three: the social signal is a moment, not a movement. Interest will
fade before a meaningful buyer pool materializes. Response: list immediately
to capture the moment, with a time-limited listing strategy. If it does not
transact within thirty days, the moment has passed.

MegaBot distinguishes these three cases by examining the duration of the social
signal. A signal that has been building for thirty or more days before the
current scan is more likely to be meaning one or two. A signal that spiked
within the last seven days is more likely to be meaning three.

## Seasonal vs. Trend vs. Permanent Demand Classification

Classifying demand type changes the listing strategy.

### Seasonal Demand

Some categories have predictable seasonal demand patterns. Holiday decorations,
outdoor equipment, winter clothing, gardening tools, and similar categories
have buyer populations that activate at specific times of year and go dormant
outside those windows. Listing outside the seasonal window means waiting longer
and often accepting a lower price.

MegaBot flags seasonal demand when eBay sold listings for a category show
concentrated transaction dates (more than sixty percent of sold comps in a
ninety-day window). The recommendation includes a projected optimal listing
window and a note that off-season listing will extend time-to-sale.

### Trend Demand

Trend demand has a shorter lifecycle than permanent collector demand but a
longer lifecycle than a viral moment. Trends are driven by category awareness
growth — a generation discovering vinyl records, millennial buyers discovering
the furniture of their parents' era, interest in a craft or skill that drives
demand for period-appropriate tools.

Trend demand typically sustains for two to five years before normalizing.
Prices rise during the trend period and then stabilize at a level above the
pre-trend floor but below the trend peak. MegaBot classifies demand as trend-
driven when eBay category sold prices show consistent year-over-year growth
over two or more years, with growth rate exceeding general inflation.

The strategic implication: items in trend-demand categories are worth selling
now rather than holding. The peak of the trend is difficult to identify in
real time; the risk of holding for a higher price exceeds the benefit for most
sellers.

### Permanent Collector Demand

Permanent demand exists for categories with established collector communities,
institutional interest, published scholarship, and auction house coverage.
Fine art, antique furniture from recognized periods, historical documents,
significant watches, significant jewelry, significant coins, and similar
categories have demand that does not depend on a cultural moment and does not
expire. The market for these items is patient.

MegaBot classifies demand as permanent when: the category has dedicated auction
house specialist sales, published price guides or databases exist, collector
organizations have formal membership and publications, and transaction volume
is consistent across multiple decades of available data.

For permanent demand categories, seller urgency should be low unless the seller
has a specific need for liquidity. The right buyer will appear; the seller's
job is to be findable by that buyer, not to chase every possible buyer.

## Market Velocity as a Confidence Modifier

Market velocity — the average number of days between listing and sale for a
comparable item on eBay — modifies the overall confidence score of the demand
analysis.

High velocity (average days-to-sell under fourteen days): The market for this
item is active and buyers are moving quickly. High confidence that a correctly
priced listing will transact within two to three weeks. This is the most
favorable condition for seller decision-making.

Moderate velocity (fourteen to forty-five days): The market is functioning
normally. A correctly priced listing should transact within four to six weeks.
Confidence is solid but patience is required.

Low velocity (forty-five to ninety days): The market is thin. Either the buyer
pool is small, the item is overpriced relative to comparable listings, or the
category has seasonal patterns that are currently suppressing demand. Confidence
in demand signals is moderate. MegaBot investigates whether low velocity is
structural (thin category) or correctable (pricing or platform mismatch).

Very low velocity (over ninety days): This item type sits on the market for
extended periods when listed through standard channels. Specialty channels —
dealer consignment, targeted collector outreach, specialist auction — are
indicated. Very low velocity is an escalation trigger as defined in M03.

When market velocity and demand signals are in conflict — strong signals but
slow velocity — MegaBot specifically investigates whether the item is
mis-categorized on the primary platforms, whether comparable listings are
priced incorrectly (anchoring buyer expectations at wrong levels), or whether
the correct channel for this item is not a high-velocity platform at all.
