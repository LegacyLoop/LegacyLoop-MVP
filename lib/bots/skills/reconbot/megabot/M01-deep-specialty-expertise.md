---
name: reconbot-megabot-deep-specialty-expertise
description: >
  Multi-platform competitive consensus for 4-AI parallel market intelligence.
  Defines how four AI agents validate market positioning across all major resale
  and auction platforms, what Gemini real-time grounding contributes, and how to
  distinguish genuine market signals from noise in competitive analysis.
when_to_use: "MegaBot scans only. ReconBot MegaBot lane."
version: 1.0.0
---

# ReconBot MegaBot Skill M01: Deep Specialty Expertise
## Multi-Platform Competitive Consensus for 4-AI Parallel Market Intelligence

---

## Purpose

This skill defines how four AI agents working in parallel build a competitive
consensus around a single item's market position. It is not a pricing tool. It
is a market intelligence tool. The distinction matters. Pricing tells a seller
what their item might sell for. Market intelligence tells them why, what the
competitive landscape looks like, how their item compares to what is actually
moving, and where the real demand is concentrated.

A single AI looking at a single platform produces a price estimate. Four AIs
looking at seven platforms produce a competitive consensus. This skill governs
how that consensus is constructed and validated.

---

## The Four-Agent Architecture

Each agent in the MegaBot parallel scan has a defined role in the competitive
analysis. Agents are not interchangeable. Each brings a distinct signal source
and interpretive lens.

### Agent One: Primary Identification and Category Anchoring

The first agent establishes the item's category, subcategory, and specialty
classification before any market data is pulled. This anchoring step is critical.
A piece of Depression-era glass analyzed as generic glassware will pull the wrong
comps from every platform. An agent that misclassifies a Royal Doulton figurine
as decorative pottery will produce comp data that is structurally irrelevant.

Primary identification includes maker attribution, production period, style
classification, and condition tier. All subsequent agents receive this anchor and
are bound by it unless they find contradicting physical evidence in the item
photos or description.

### Agent Two: Auction and High-End Resale Platforms

The second agent focuses on LiveAuctioneers, Invaluable, Ruby Lane, and 1stDibs.
These platforms represent institutional and semi-institutional market demand.
Auction results carry the highest evidentiary weight because they represent
actual cleared transactions with competitive bidding. Ruby Lane and 1stDibs
represent dealer-established retail pricing with implied authentication overhead.

This agent is responsible for identifying auction records, dealer asking prices,
and the spread between them. A wide spread (dealer asking significantly above
recent auction results) is a signal worth flagging.

### Agent Three: Mass-Market and Peer-to-Peer Platforms

The third agent covers eBay, Craigslist, and ShopGoodwill. These platforms
represent consumer-level demand and represent the floor of the market for most
categories. eBay sold listings are the most reliable mass-market signal available
because they represent cleared transactions at real prices. Active eBay listings
represent seller aspiration, not market reality.

ShopGoodwill results are particularly useful for condition benchmarking. Because
the platform sells items as-is with photo-only condition assessment, successful
sales there establish a floor price for items in known condition states.

### Agent Four: Gemini Real-Time Grounding

The fourth agent uses Gemini's live web access to capture market data that is
not indexed in the other agents' training data. This includes listings posted
within the last 72 hours, recent auction results from the current calendar week,
price changes on long-listed items, and emerging demand signals not yet reflected
in historical comp data.

Gemini grounding does not replace historical comp analysis. It supplements it.
The value of real-time grounding is in detecting trend changes and capturing
very recent market moves that older comp data would obscure.

---

## Platform Signal Hierarchy

Not all platforms carry equal evidentiary weight. The following hierarchy
applies when agent outputs conflict:

1. Auction house sold results (LiveAuctioneers, Invaluable, Christie's, Sotheby's)
2. Dealer sold records (Ruby Lane, 1stDibs sold)
3. eBay sold listings (completed, with bids or buy-it-now)
4. Dealer active asking prices (Ruby Lane, 1stDibs active)
5. eBay active listings (asking, no bids)
6. ShopGoodwill cleared sales
7. Craigslist and peer-to-peer asking prices

When the top two tiers produce a clear price signal, lower-tier data is used only
to confirm or explain deviation, not to anchor the estimate.

---

## What Gemini Real-Time Grounding Adds

Gemini grounding is the only component of the MegaBot system that operates
against live web data rather than training-data or scraper-snapshot data. This
distinction has three concrete implications.

First, Gemini can detect listing activity that postdates the last scraper run.
If three competing items were listed on eBay in the past 48 hours, Gemini will
see them. The other agents will not unless a live scrape was triggered.

Second, Gemini can identify price movement on long-standing listings. An item
that has been listed at one price for six weeks and then dropped by 20% in the
past two days is a demand signal. Gemini can surface that. Cached comp data cannot.

Third, Gemini can detect off-platform signals, including collector forum
discussions, recent appraisal blog posts, and news about a specific maker or
category that may be driving short-term demand spikes or suppressing interest.

The weight given to Gemini grounding data scales with its recency. Data from
the past 24 hours carries full weight. Data from the past 7 days carries 80%
weight. Data older than 30 days reverts to standard historical comp weighting.

---

## Distinguishing Real Market Signals from Noise

The most common error in AI-assisted market analysis is treating all data points
as equivalent signals. They are not. The following patterns represent noise that
must be filtered before forming a competitive consensus.

Relisted items are not new comps. An item that has been listed at the same price
across six consecutive 30-day eBay listings represents seller persistence, not
market validation. A comp that has been available without sale for 180 days is
evidence of overpricing, not market support.

Sold listings with zero bids at buy-it-now price are weaker signals than auction
results with multiple bidders. A buy-it-now sale represents one buyer's decision
at one seller's chosen price. An auction result with 7 bidders represents
competitive market clearing at a price the market validated.

Condition outliers distort averages. A sterling silver tea service sold at a
40% premium to its peers because it had original box and matching tray. That
result should not be averaged into the comp set for a service with no box.
Condition-matched comps are the only valid basis for consensus pricing.

Geographic outliers should be noted but not discarded. A piece that sold for
twice the national average at a regional auction in New England may reflect
local collector concentration, estate provenance, or a known regional dealer
in the room. That result is informative but should not anchor the general estimate.

---

## The Difference Between a Price Check and a Competitive Analysis

A price check answers one question: what is this item worth today? It produces
a number or a range.

A competitive analysis answers a set of related questions. How many competing
items are currently available? How long have they been listed? What condition
are they in? Are they moving or sitting? Who is the likely buyer and where are
they looking? Is demand accelerating, stable, or declining? Does this item have
a competitive advantage over current supply in the same category?

The MegaBot ReconBot lane exists to produce competitive analysis, not price
checks. Sellers who understand their competitive position can time listings,
adjust condition disclosures strategically, choose the right platform, and set
prices that clear quickly rather than sitting for months.

---

## Each Agent's Contribution to the Competitive Picture

Synthesizing four agents into a single competitive picture requires explicit
attribution. When the final output summarizes the competitive landscape, it
must be clear which platform data drove which conclusion.

If the price range is anchored by auction results, the auction platform and
result count must be cited. If the demand signal comes from Gemini's detection
of recent listing activity, the recency of that data must be disclosed. If the
condition benchmark comes from ShopGoodwill cleared sales, that context must
be included so the seller understands it represents a floor, not a target.

Unattributed confidence is a failure mode. Sellers deserve to know whether the
system's confidence is grounded in 12 auction results or in 3 eBay active
listings. The difference changes how they should act on the information.

---

## Output Obligations for This Skill

When this skill is active, the MegaBot competitive scan must include:

- Platform-by-platform comp count and source attribution
- Identification of which agent produced which data segment
- Explicit notation of where Gemini grounding data was used and its recency
- Filtering rationale when comp data was excluded as noise
- Confidence rating with explicit basis (number of comps, comp quality tier)
- Competitive landscape summary distinguishing real signals from relisted noise
