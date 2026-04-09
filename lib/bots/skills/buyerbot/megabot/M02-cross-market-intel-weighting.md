---
name: buyerbot-megabot-cross-market-intel-weighting
description: >
  Platform signal weighting methodology for MegaBot buyer discovery. Defines
  how demand signals from TikTok, eBay, Facebook Marketplace, Instagram,
  Reddit, Etsy, and 1stDibs are weighted differently based on signal type,
  buyer intent, and geographic demand concentration. Covers WTB post detection
  and triangulating willingness-to-pay from independent platform sources.
when_to_use: "MegaBot scans only. BuyerBot MegaBot lane."
version: 1.0.0
---

# BuyerBot MegaBot Skill: Cross-Market Intelligence Weighting

## Purpose

Different platforms produce different quality buyer signals. Treating a TikTok
view count as equivalent to an eBay sold listing would produce pricing and
outreach recommendations that lose seller money and waste time. This skill
defines the signal weighting framework BuyerBot uses when synthesizing demand
intelligence from multiple platforms in the MegaBot lane.

## Platform Signal Taxonomy

Platforms fall into three tiers based on how close their signals are to an
actual transaction.

### Tier 1: Transaction-Proximate Platforms

These platforms have buyer populations who are in an active purchase cycle.
Signals from Tier 1 platforms carry the highest weight.

**eBay**
eBay sold listings are the gold standard for market price validation. They
represent completed transactions — a real buyer paid real money for a
comparable item. The signal weight is highest for sold listings within the
past ninety days. Listings older than ninety days are discounted progressively
because market conditions shift. Active (unsold) listings are not pricing
signals — they represent seller aspiration, not buyer behavior.

eBay watch counts on active listings are a secondary signal. A listing with
forty or more watchers that has not yet sold indicates buyer interest at a
price that has not yet cleared the market — this is a negotiation signal.
The right price for your item is likely between the current ask and what
watchers are willing to pay without bidding.

**1stDibs**
1stDibs signals carry extreme weight in the antique, fine art, designer
furniture, and luxury goods categories. A sold comparable on 1stDibs anchors
the high end of the price range. The buyer pool on 1stDibs is institutional
and high-net-worth — these are not casual buyers. If a comparable has sold
on 1stDibs, that fact alone shifts the recommended listing channel and the
minimum acceptable price.

1stDibs active listings (not sold) are useful for establishing the ceiling
of what dealers believe the market will bear. They are not transaction
evidence but they are curated market opinion from credentialed dealers.

**Etsy**
Etsy sold listings carry strong signal weight for handmade, vintage (defined
on Etsy as twenty or more years old), and craft-adjacent categories. Etsy
buyers skew toward items with a maker story, clear provenance language, and
condition transparency. An Etsy comparable should be weighted at approximately
seventy percent of an eBay comparable for pricing purposes, because Etsy
buyers generally have a lower willingness-to-pay ceiling than specialist
collector buyers on eBay, but Etsy provides faster transaction velocity for
items in its sweet spot categories.

### Tier 2: High-Intent Discovery Platforms

These platforms surface buyers who are in an information-gathering and
comparison phase. They have not yet committed to a transaction, but their
behavior indicates they are close.

**Facebook Marketplace**
Facebook Marketplace signals are geographically concentrated and transaction-
proximate for local-pickup items. A buyer who messages through Facebook
Marketplace is typically within driving distance and ready to transact within
days, not weeks. The weakness of Facebook Marketplace signals is price ceiling.
Facebook Marketplace buyers are conditioned to expect negotiation and will
anchor on the lowest comparable they can find. Use Facebook Marketplace as a
velocity channel — it moves items quickly — but do not anchor pricing there
for items with meaningful collector value.

Facebook Groups carry a different signal than Facebook Marketplace. Collector
groups within Facebook (vintage camera groups, antique tool groups, mid-century
furniture groups) produce high-quality buyer signals because group membership
self-selects for serious interest. A WTB post in a collector group is a Tier 1
signal despite being on a Tier 2 platform.

**Reddit**
Reddit signals require category-specific interpretation. A WTB post in a
collector subreddit (r/watchexchange, r/vinylcollectors, r/handtools,
r/coins, r/typewriters) is one of the strongest buying intent signals
available anywhere. The poster has identified a specific item, stated a
budget in most cases, and is actively soliciting sellers. This is a buyer
who has done research and is ready to purchase.

General Reddit discussion about a category (upvotes on a post showing a
comparable item, comments expressing desire) is a lower-quality signal. It
indicates category interest but not purchase readiness. Weight general Reddit
engagement at twenty percent of a WTB post signal.

**Instagram**
Instagram signals measure desire and aesthetic alignment, not purchase
readiness. High save counts on posts featuring comparable items indicate
that a category is visually resonant and has an audience that aspires to
ownership. These are early-funnel signals. Instagram is the correct discovery
channel for items that photograph exceptionally well — jewelry, textiles,
ceramics, artwork, designer goods — but Instagram engagement should not be
used to set prices or estimate how quickly an item will sell.

Instagram DM inquiries are a different signal. A buyer who moves from
following an account to sending a direct message asking about availability
has crossed the intent threshold. Weight Instagram DMs at the same level as
Facebook Marketplace messages.

### Tier 3: Cultural and Trend Platforms

These platforms measure where cultural attention is moving. They are leading
indicators — they precede transaction activity by weeks or months. Use them
for timing and framing decisions, not pricing anchors.

**TikTok**
TikTok signals indicate cultural moment and category momentum. A video
featuring a comparable item going viral does not mean the item is suddenly
worth more. It means a new cohort of potential buyers has been introduced
to the category. The conversion rate from TikTok viewer to actual buyer is
low. However, TikTok momentum correctly predicts where eBay and Etsy
search volume will increase over the following thirty to sixty days.

The correct use of a TikTok signal is timing. If MegaBot detects rising
TikTok engagement with a category while also detecting flat or modest eBay
transaction volume, the recommendation is to list now and capture buyers who
have been activated by the content wave before the market becomes saturated
with comparable listings from other sellers who spotted the same trend.

## Viral Moment vs. Sustained Collector Demand

This is the most consequential distinction in cross-market signal weighting.
Getting it wrong produces either premature listing (before the market
materializes) or missed opportunity (after the moment has passed).

Viral moment characteristics: concentrated over days or weeks, tied to a
specific cultural trigger (a television appearance, a celebrity association, a
news story), generates broad but shallow engagement across multiple platforms
simultaneously, typically fades within sixty days and does not sustain elevated
transaction prices.

Sustained collector demand characteristics: visible across multiple years of
eBay sold data, supported by active collector communities on Reddit or
specialized forums, produces consistent WTB posts on an ongoing basis, price
has been gradually increasing rather than spiking, dealer networks have already
priced this into their inventory.

The threshold for classifying demand as sustained rather than viral is twelve
months of consistent transaction evidence. If eBay sold comps show consistent
price points for twelve or more months, with no single triggering event, the
demand is structural. If price data shows a recent sharp increase coinciding
with a detectable cultural trigger, the demand is moment-driven and pricing
should reflect a likely correction.

## Geographic Demand Concentration

Where buyers are located affects both price and logistics strategy. BuyerBot
uses geographic concentration data from Gemini search signals and Facebook
Marketplace inquiry patterns to adjust recommendations.

High geographic concentration indicates a regional collector community. Items
with strong demand in a specific metropolitan area warrant considering a local
dealer consignment or a local auction house in addition to online channels.
The price premium available in a concentrated market can exceed online
comparable prices by twenty to forty percent because local buyers avoid
shipping costs and prefer to inspect in person for significant purchases.

Low geographic concentration (demand spread evenly across the country) indicates
a national collector market served primarily by online channels. These items
should be listed on eBay, Etsy, or 1stDibs as the primary channel, with
Facebook Marketplace as a secondary local channel.

International demand signals warrant a separate channel consideration. Items
with strong search signals from international buyers (detected via Gemini
geographic data) may perform better through an international auction house or
through eBay with international shipping enabled and pricing adjusted for
cross-border transaction costs.

## WTB Post Detection Across Platforms

Want-to-Buy posts are the highest-quality organic buyer signal that does not
involve actual money changing hands. BuyerBot specifically scans for WTB
activity in the following locations:

Reddit: collector subreddits have established WTB post conventions. The
posts typically include specific item descriptions, stated condition
preferences, and often a budget range. These are buyers who have done
research and are ready to transact.

Facebook Groups: collector groups use WTB or ISO (in search of) post
conventions. Geographic context is always present because Facebook profiles
include location information.

Collector forums: platform-specific forums (camera forums, watch forums,
audio equipment forums) often have dedicated WTB sections. These buyers
are typically the most knowledgeable and are price-aware, making negotiation
efficient but requiring accurate initial pricing.

Discord: collector communities on Discord have adopted WTB channel conventions.
These communities tend to be younger buyers in growth categories.

## Triangulating Willingness-to-Pay

No single platform reveals a buyer's true willingness-to-pay. BuyerBot
triangulates from three independent signals.

The first signal is eBay sold comps at the comparable condition tier. This
establishes the market clearing price — what buyers have historically paid.

The second signal is active listing ask prices on 1stDibs or specialist
dealer websites. This establishes the ceiling — what informed sellers believe
the market will bear at retail pricing with dealer margin included.

The third signal is WTB post stated budgets. When WTB posts include a budget,
that budget represents the buyer's self-assessed maximum. Actual willingness-
to-pay typically runs ten to twenty percent above a stated budget when the
right item appears, because buyers understate their maximum to preserve
negotiating room.

The synthesis of these three signals produces a recommended listing price
range with a high anchor (aspirational but defensible), a target price (where
the item should clear within two to four weeks), and a floor price (below which
the seller is leaving money on the table relative to documented market evidence).
