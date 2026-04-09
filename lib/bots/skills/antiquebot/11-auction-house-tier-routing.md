---
name: auction-house-tier-routing
description: The four-tier auction house routing rubric. Matches the object's estimated value to the right auction venue (top-tier international, mid-tier specialist, regional, or online). Routing errors leave money on the table or waste consignor's time.
when_to_use: Every AntiqueBot scan. Populates selling_strategy.best_venue and selling_strategy.venue_options with the correctly tiered recommendation.
version: 1.0.0
---

# Auction House Tier Routing — Matching Object To Venue

The biggest mistake estate sellers make is routing the wrong object to the wrong venue. A $40,000 Newport chest consigned to a regional estate auctioneer leaves $15,000 to $25,000 on the table. A $400 Victorian side chair consigned to Christie's wastes six months of calendar time and gets declined or buried. This pack gives you the four-tier routing rubric.

## The Four Tiers

| Tier | Venues | Sweet Spot | Commission Seller Pays |
|---|---|---|---|
| **Top Tier (International)** | Christie's, Sotheby's, Bonhams, Phillips | $25,000+ | 5-15% |
| **Mid Tier (Specialist / Regional Top)** | Skinner (now Bonhams), Freeman's, Doyle, Leslie Hindman, Heritage | $2,000-$50,000 | 10-20% |
| **Regional** | Pook and Pook, Jeffrey S. Evans, Brunk, Garth's, Cowan's, Nadeau's, Copley | $500-$15,000 | 15-25% |
| **Online / Democratic** | LiveAuctioneers direct, Invaluable direct, eBay, Etsy, 1stDibs | $100-$5,000 | 10-15% plus listing fees |

These ranges overlap deliberately — a $5,000 piece could fit any of the top three tiers depending on category and specialist strength. The art is matching category to specialist, not just price to tier.

## Top Tier Routing

Christie's and Sotheby's take items from about $25,000 upward, though their specialist departments can go lower for exceptional rarities. Within the top tier, match category to department:

- **Christie's American Furniture** — the strongest American period furniture department in the world. Newport, Philadelphia, Boston, Salem, Charleston period pieces.
- **Sotheby's Important Americana** — parallel strength, historically strong on New York Federal.
- **Bonhams Books and Manuscripts, Asian Art, Scientific Instruments** — strongest at specific specialties.
- **Phillips 20th Century Design** — the strongest modern / mid-century department.

For the seller: top-tier consignment means 4-6 month calendar time to sale, professional photography, catalog essay, international buyer reach, and the highest hammer prices at the top of the market. It also means strict condition and provenance requirements. Pieces are declined if they do not meet standards.

## Mid Tier Routing

Skinner (Boston, now owned by Bonhams since 2023), Freeman's (Philadelphia), Doyle (New York), Leslie Hindman (Chicago, now Hindman nationally), Heritage (Dallas) — these houses are the sweet spot for most serious American antiques. A $5,000 to $50,000 period piece that would get lost at Christie's often becomes the feature lot at Skinner. Specialists in these houses know regional material better than the internationals.

Heritage is specifically strong in: coins, comics, sports memorabilia, historical Americana, Western art, music memorabilia. Their specialty departments outsize the generalist mid-tier for those categories.

## Regional Routing

Pook and Pook (Downingtown PA), Jeffrey S. Evans (Mount Crawford VA), Brunk (Asheville NC), Garth's (Delaware OH), Cowan's (Cincinnati), Nadeau's (Windsor CT), Copley Fine Art (MA) — regional houses that punch above their weight in specific specialties. Pook and Pook for Pennsylvania Germanic material. Jeffrey Evans for Southern decorative arts. Brunk for Southern folk art and Black Mountain modernism. Garth's for Ohio Valley material. Cowan's for Midwestern and firearms.

Regional routing is the right call when:
- The piece is in the $500-$15,000 range
- It has regional character that a specialist in that region will price correctly
- The seller wants faster turnaround than top-tier (regionals typically 6-12 weeks)
- Commission rates are tolerable (15-25 percent vs 10-15 at the top)

## Online Direct Routing

For pieces under about $2,000, direct online is often the right answer. LiveAuctioneers and Invaluable aggregate regional houses, but sellers can also consign directly to lower-tier regional houses that use those platforms, or list on eBay, Etsy, 1stDibs, Ruby Lane. Each platform has a different audience:

- **eBay** — volume, retail-flip buyers, moderate prices
- **Etsy** — vintage, smalls, decorative, lower prices
- **1stDibs** — dealer-level pricing, high-end decorator market, vetted
- **Ruby Lane** — small, vetted, antique-specialist audience
- **Facebook Marketplace** — local pickup, large items, heavy discounts acceptable

## The Routing Decision Tree

For every object, walk this tree:

1. Is it worth $25,000+? → Top tier. Match category to department.
2. Is it worth $5,000-$25,000? → Mid tier specialist. Match category to house strength.
3. Is it worth $1,000-$5,000? → Regional house or top mid tier generalist.
4. Is it worth $200-$1,000? → Regional house as part of an estate, OR online direct.
5. Is it worth under $200? → Online direct only. Auction commission eats the margin.

## The Consignment Reality Check

Top tier consignment is not free. Seller pays insurance, photography, marketing, and commission. On a $5,000 piece, total frictions can exceed 25 percent. The seller nets 75 percent of hammer price on top tier, 70-80 percent at mid and regional, 80-90 percent online direct. Factor this into venue_options and expected_return.

## Buyer's Premium Awareness

Auction hammer price is not what the buyer pays. Buyer's premium is added on top — typically 20-28 percent at top tier, 18-25 percent at mid tier, 15-22 percent at regional, 15-18 percent online. The total invoice the buyer sees is hammer plus premium. This matters for routing because buyers shop against the total, not the hammer. A $10,000 hammer at Christie's with 26 percent premium is a $12,600 check from the buyer. The same object needs to clear $8,000 hammer at a regional house with 22 percent premium to be a $9,760 buyer check. Pack 13 (buyer-premium-net-math) covers this in full — but use it here to explain to the seller why a "lower hammer at a regional house" can sometimes net more than "higher hammer at top tier" once fees on both sides are counted.

## The Absentee Vs Live Bidding Distinction

Top tier sales generate most of their energy from phones, online bidders, and the room. A piece that sells "in the room" to competing collectors often hammers 30-50 percent above estimate; a piece that sells silently on an absentee bid usually lands at or just above the low estimate. Category matters here: furniture and silver see less live room energy than paintings and jewelry. Use this when setting seller expectations — do not promise a room result on a category that sells silently.

## Timing Considerations

Top tier Americana sales happen in January (Americana Week in New York) and fall. Silver sales cluster in spring and fall. 20th century design sales run year-round at Phillips but peak fall. Consignment deadlines are typically 8-12 weeks before the sale. If the seller needs cash fast, top tier is wrong — route to regional or online. If the seller has a masterpiece and can wait for Americana Week, routing to Christie's or Sotheby's January sale can multiply the result.

## Output

Populate selling_strategy.best_venue with the single best recommended venue. Populate selling_strategy.venue_options with 2-4 alternative venues, each with expected_return, timeline, pros, and cons. Populate selling_strategy.timing with the best calendar window for this specific category. For pieces over $5,000, always include at least one mid-tier specialist option by name. For pieces over $25,000, always include one top-tier option by name with the specific department identified. For pieces under $1,000, do not recommend any auction house — recommend online direct listing instead.
