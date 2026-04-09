---
name: buyerbot-megabot-escalation-triggers
description: >
  Defines when MegaBot must escalate buyer matching beyond AI-driven outreach.
  Covers high-value item routing, auction house vs. private sale vs. dealer
  placement logic, estate sale vs. individual item channel selection, how
  four-AI disagreement signals multi-channel strategy, and how to communicate
  escalation decisions to sellers with clear timelines and expectations.
when_to_use: "MegaBot scans only. BuyerBot MegaBot lane."
version: 1.0.0
---

# BuyerBot MegaBot Skill: Escalation Triggers

## Purpose

MegaBot is powerful, but it operates within defined competency limits.
Recognizing those limits and escalating appropriately is as important as any
other buyer-matching function. An AI that attempts to handle every situation
autonomously produces worse outcomes for high-value, high-complexity items than
an AI that knows when to bring in human expertise. This skill defines the
precise conditions that trigger escalation, what form escalation takes, and
how to communicate the transition to the seller.

## The Escalation Threshold: Items Above Ten Thousand Dollars

For items where MegaBot's pricing analysis indicates a market value above ten
thousand dollars, mass-channel digital outreach is the wrong primary strategy.
This threshold is not arbitrary. It reflects the behavioral profile of buyers
in that price range.

Buyers purchasing items above ten thousand dollars require a higher degree of
verification before committing. They want to know who the seller is, whether
the item is as represented, and what recourse they have if there is a problem.
A digital listing, no matter how well written, does not fully address these
concerns for a buyer making a four-figure or five-figure commitment. The
conversion rate from digital listing to closed transaction drops significantly
above this price point compared to transactions facilitated by an intermediary
with established credibility — an auction house specialist, a dealer with a
physical location, or a private sale broker.

Mass marketing also carries a risk for high-value items. Sending a bulk
outreach campaign for a Tiffany lamp or a signed first edition to buyer
email lists can suppress perceived value. Scarcity and exclusivity are part
of what commands premium pricing at this level. The moment a buyer perceives
that a high-value item was mass-marketed, they wonder why it did not sell
through specialist channels.

The escalation recommendation for items above ten thousand dollars is targeted
specialist outreach, not mass campaign. This means identifying five to fifteen
specific individuals or institutions — known collectors, dealers active in the
category, curators with acquisition mandates, or auction house specialists —
and initiating private contact. MegaBot can identify this list. The outreach
itself should be human-written and human-sent.

## Auction House Consignment vs. Private Sale vs. Dealer Placement

These three channels serve different seller priorities. MegaBot recommends the
appropriate channel based on what the seller values most: maximum price, speed
of transaction, or minimum effort.

### Auction House Consignment

Recommend auction house consignment when: the item has strong provenance
documentation, belongs to a category with an established specialist auction
market (fine art, jewelry, watches, coins, rare books, wine, vintage
automobiles), the seller can accept a sixty to one hundred twenty day timeline
to transaction, and the item's estimated value justifies the auction house
commission structure (typically fifteen to twenty-five percent of hammer price).

Auction house consignment is the maximum-price channel for items that belong
in that channel. The auction competitive dynamic drives prices above what any
private negotiation typically achieves, because multiple motivated buyers are
competing simultaneously with visible price pressure. The downside is timeline
and commission. Sellers who need liquidity within thirty days should not
consign to auction.

The signals that indicate auction house fit: multiple sold comparables at
auction appearing in MegaBot's research, dealer or appraiser interest already
expressed, item that would headline or anchor a specialist sale rather than
filling it, and clear historical auction performance for the maker, school,
or category.

### Private Sale

Recommend private sale when: the item's buyer pool is small and identifiable,
the seller prefers confidentiality, the timeline is flexible, or the item
would not benefit from public auction competition (because the buyer pool is
too narrow for competitive bidding to develop meaningful price pressure).

Private sale is appropriate for estate items with personal or family
significance that the seller wants to place with a buyer who will appreciate
the history. It is also appropriate when MegaBot identifies a specific known
collector or institution that is an obvious match — a museum actively building
a collection in that category, a known private collector who has publicly
expressed interest in acquiring this type of item, or a dealer who would buy
for resale and is a trusted transaction partner.

Private sale typically requires a broker or intermediary to facilitate
introductions, validate authenticity representations, and manage the
transaction mechanics. MegaBot identifies the right intermediary category;
the seller chooses from vetted options.

### Dealer Placement

Recommend dealer placement when: the seller wants a clean, fast transaction
with known terms and no uncertainty about outcome. Dealer placement means
selling directly to a dealer at wholesale or trade price in exchange for
certainty and speed.

The price achieved through dealer placement is lower than auction or private
sale — typically fifty to seventy percent of retail value — but the transaction
closes in days rather than months, requires no marketing effort from the seller,
and eliminates buyer fallthrough risk. For sellers managing large estate
dispersals with dozens or hundreds of items, dealer placement for appropriate
categories (mid-range furniture, costume jewelry, common silver patterns,
standard editions) preserves bandwidth for high-value items that warrant the
additional effort.

MegaBot identifies dealer placement as appropriate when: item value is in a
range where auction commission would consume a disproportionate share of
proceeds, item needs no specialist marketing to sell, and seller has expressed
a preference for speed over maximum price.

## Estate Sale vs. Individual Item Channel Selection

Not every item from an estate should travel through the same channel. MegaBot
disaggregates the estate inventory by value tier and recommends channel
assignment for each tier rather than defaulting every item to the same platform.

Items in the top five to ten percent of estate value by price should be
individually marketed through specialist channels — auction, private sale, or
targeted digital outreach. These items are responsible for the majority of
total estate proceeds and warrant commensurate attention.

Items in the middle value tier (broadly, the items that individual buyers
recognize as desirable but that do not warrant specialist channels) should be
listed through BuyerBot's standard digital outreach stack — eBay, Etsy,
Facebook Marketplace, regional platforms — with MegaBot's demand intelligence
informing pricing and platform selection.

Items in the lower value tier (common household goods, standard editions,
incomplete sets, items in average condition with no particular collector
appeal) are estate sale or donation candidates. Investing BuyerBot outreach
resources in this tier produces negative returns.

The escalation signal for estate work is when the seller or estate executor
has not made this disaggregation and is treating all items as equivalent.
MegaBot flags this condition and provides a tiered recommendation before
outreach begins.

## Four-AI Disagreement as a Multi-Channel Signal

When the four AI models in MegaBot return different buyer channel recommendations
for the same item, most systems would average the recommendations or select the
majority view. BuyerBot treats disagreement differently: disagreement itself
is the signal that this item has multiple valid buyer audiences, and the correct
strategy is multi-channel rather than single-channel.

An item that one model classifies as a collector market play, another as a
decorator buy, a third as a vintage commercial user buy, and a fourth as a
dealer trade buy has genuine cross-market appeal. Forcing it into one channel
leaves money on the table. The correct response is to run parallel outreach to
each identified segment and let the market reveal which buyer type moves first
and at what price.

Multi-channel strategy requires sequencing to avoid confusion. MegaBot
recommends an outreach order: highest-value channel first, with a defined
window (typically fourteen days) before opening lower-value channels. If the
specialist channel produces a qualified buyer within the window, the item
transacts at peak value. If not, the next channel activates, and the seller
has data from the first round to inform pricing adjustments.

The four-AI disagreement case is also the escalation trigger for human review.
When models disagree on channel, a specialist review of the item (additional
photographs, condition documentation, provenance research) will typically
resolve the ambiguity and clarify which buyer profile is the correct primary
target.

## Communicating Escalation to the Seller

Sellers experience escalation recommendations as bad news if not framed
correctly. The communication must lead with what escalation means for the
seller's outcome, not with the limitations of the AI system.

Correct framing: "Based on our market research, this item has characteristics
that position it for specialist channels that achieve significantly higher prices
than standard online listing. Here is what that means for your timeline and
expected proceeds."

Incorrect framing: "Our system cannot handle this item automatically."

Every escalation communication must include four elements.

First, the specific reason escalation is recommended. Reference the market
evidence: "Comparable pieces have sold through specialist auction at prices
between X and Y over the past eighteen months."

Second, the channel recommendation with clear logic. Explain why this channel
rather than alternatives, in terms the seller can evaluate without domain
expertise.

Third, a realistic timeline with milestones. Sellers who agree to a ninety-day
auction consignment without understanding what that means become difficult to
work with at the sixty-day mark. Set expectations at the start.

Fourth, what the seller needs to do next and what LegacyLoop will do on their
behalf. Escalation should feel like service elevation, not service abandonment.
The seller should end the escalation conversation feeling that more resources
are being applied to their situation, not fewer.
