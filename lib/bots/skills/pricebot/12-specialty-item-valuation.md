---
name: specialty-item-valuation
description: How PriceBot integrates with AntiqueBot, CollectiblesBot, and CarBot results. Covers enrichment context reading, hybrid valuations, specialist-result precedence, and PriceBot's additive role in platform routing and net math.
when_to_use: Every PriceBot scan.
version: 1.0.0
---

# Specialty Item Valuation

## The Multi-Bot Architecture and PriceBot's Role

LegacyLoop's MegaBot system routes items through multiple specialist bots in parallel. When an item is categorized as an antique, collectible, or vehicle, one or more specialist bots (AntiqueBot, CollectiblesBot, CarBot) run their analysis and write their findings to the enrichment context before PriceBot executes.

PriceBot's role in specialty items is additive, not redundant. The specialist bots answer: what is this item worth in its specialty market? PriceBot answers: where should this item be sold, at what price, and what will the seller net after fees? These are different questions. Both answers are necessary for the seller to act.

PriceBot must read the enrichment context before running its standard comp analysis on any specialty-flagged item. If specialist bot results are present, they become the primary valuation inputs and the standard comp analysis becomes confirmatory, not authoritative.

## Reading AntiqueBot Results

When AntiqueBot has run on an item, its output includes: antique score (0-100), auction estimate (low-high range), confidence level, period attribution, and notable markers (maker, material, condition notes, auction house comparables).

PriceBot integration steps for AntiqueBot results:

Step 1: Read the auction estimate range from the enrichment context. This is AntiqueBot's primary valuation output.

Step 2: Distinguish between auction estimate and retail/private-party value. Auction estimates reflect hammer price at a mid-tier auction house. The same item sold directly through a marketplace typically achieves 80-110% of the auction estimate. Private-party sales through eBay collectibles often land at 85-95% of auction estimate for items with clear provenance; direct sales through Etsy or local antique dealers typically land at 100-130% of auction estimate because the buyer is purchasing from an established seller with curation value.

Step 3: Layer in PriceBot's market context. Apply the seller's ZIP code market multiplier (from lib/pricing/market-data.ts) to the AntiqueBot estimate. A Victorian settee sold in Manhattan commands a different price than the same piece sold in rural Maine. AntiqueBot does not apply location adjustments — PriceBot does.

Step 4: Build the hybrid valuation. Present the result as: "AntiqueBot assessment: [auction estimate range]. PriceBot market-adjusted recommendation: [adjusted range] for [platform] sale, [adjusted range] for local sale, net to seller after fees: [net range]."

Step 5: Defer to AntiqueBot on all specialty dimensions. If AntiqueBot says the item is a period piece from 1820-1850 worth $600-$900 at auction, PriceBot does not override that range based on general comp analysis. PriceBot adds to it.

## Reading CollectiblesBot Results

When CollectiblesBot has run, its output includes: category (sports cards, comics, coins, stamps, toys, etc.), grading tier if applicable (PSA/BGS/CGC grade for graded items), graded value (current market for the graded tier), ungraded value (current market for raw, ungraded examples), and recommendation on whether grading is worth pursuing.

PriceBot integration steps for CollectiblesBot results:

Step 1: Identify whether the item is graded or ungraded. These are separate markets with different pricing structures. A graded PSA 9 1986 Fleer Michael Jordan card and the same card raw (ungraded) sell in entirely different buyer pools.

Step 2: For graded items, use the CollectiblesBot graded value as the primary price anchor. Graded collectibles have transparent market pricing — the PSA population report and recent sales on PWCC or eBay produce reliable comps. PriceBot's standard comp analysis adds little for graded items.

Step 3: For ungraded items, CollectiblesBot provides the ungraded value range and a grading recommendation. If CollectiblesBot recommends grading ("grading cost: $30-50, estimated value increase: $200+"), PriceBot should incorporate this into the seller's decision framework: "If you grade this item, expected value: $[graded range]. If you sell raw, expected value: $[ungraded range]. Net advantage of grading after cost: $[X]."

Step 4: Platform routing for collectibles is category-specific. Sports cards: eBay, PWCC, Goldin for high value. Comics: eBay, MyComicShop, local comic shops for mid-value. Coins: eBay, Heritage Auctions, local coin dealers. PriceBot maps the CollectiblesBot category to the appropriate platform set.

Step 5: The net-to-seller calculation for collectibles must account for platform fees accurately. eBay collectibles: 12.9-15% final value fee depending on category and seller tier. Heritage Auctions seller's commission: 10-15%. PWCC: 10% buyer's premium plus seller commission varies.

## Reading CarBot Results

When CarBot has run, its output includes: vehicle make, model, year, trim, estimated mileage tier, condition grade, private party value (Kelley Blue Book equivalent), dealer retail value, trade-in value, and any notable condition or rarity flags.

PriceBot integration steps for CarBot results:

Step 1: Read all three CarBot valuation tiers. Private party, dealer retail, and trade-in are distinct markets and the seller needs to understand which applies to their selling method.

Private party: the price a private seller achieves selling directly to a private buyer. This is the closest analog to what a LegacyLoop user selling their car would expect.

Dealer retail: what a dealership would price the vehicle at on their lot. This is never achievable for a private seller and should not be presented as a target.

Trade-in: what a dealer would pay for the vehicle. This is the floor — a quick, certain, zero-hassle exit but the lowest value realization.

Step 2: PriceBot's role with vehicles is primarily platform routing and net math. CarBot handles the core valuation. PriceBot adds: where to list (Facebook Marketplace, AutoTrader, Craigslist, Cars.com), estimated time to sell at the private party price, and the net-to-seller after any platform fees.

Step 3: Apply regional market adjustments for vehicles. Trucks and SUVs command premiums in rural markets and the Mountain West. Fuel-efficient sedans command premiums in urban markets. Convertibles command seasonal premiums in northern states (spring and summer only). PriceBot applies these adjustments; CarBot does not.

Step 4: For classic and collector vehicles (pre-1980, or any vehicle with rarity flags from CarBot), escalate to the full high-value treatment (see Pack 09) and recommend specialist auction channels such as Bring a Trailer, Barrett-Jackson online, or Mecum.

## Presenting Hybrid Valuations

The hybrid valuation output must be transparent about its sources. Sellers trust a result more when they understand where it came from.

Recommended framing: "This valuation combines two sources. [Specialist Bot] provided a market value based on [auction comps / grading data / vehicle market data]: $[range]. PriceBot has adjusted this for your local market and calculated net-to-seller after platform fees: $[adjusted range], netting you approximately $[net] after selling on [platform]."

When the specialist bot estimate and PriceBot's independent comp analysis diverge by more than 20%, surface the divergence: "Our general comp analysis suggests a value of $[X]. AntiqueBot's specialist assessment suggests $[Y]. The higher AntiqueBot estimate may reflect this item's appeal to antique collectors specifically — a buyer pool that standard resale comps do not fully capture."

Always state which value is being used as the basis for the listing price recommendation, and why.

## Specialist Result Precedence Rule

For the specialty dimension of the valuation (auction estimate, grading value, vehicle market value), the specialist bot result always outranks PriceBot's general comp analysis. This is a firm rule.

Rationale: specialist bots are calibrated to their domain with category-specific training, domain-specific comp sources, and grading frameworks that general pricing analysis cannot replicate. A general comp search for "1920s oak rocking chair" on eBay will find recent sales but will not identify maker's marks, period authenticity signals, or the auction market premium for signed period pieces. AntiqueBot does.

PriceBot's authority is in platform selection, fee calculation, market multiplier application, and net-to-seller math. Specialist bots own the core valuation for their domain. The output must reflect this division clearly.
