---
name: carbot-megabot-cross-market-intel-weighting
description: >
  Defines how CarBot's MegaBot lane weights vehicle price signals from competing
  sources including Bring a Trailer, Cars.com, eBay Motors, KBB, NADA, and
  Hagerty. Covers regional demand premiums, seasonal timing effects, and how
  comp data spread informs confidence scoring.
when_to_use: "MegaBot scans only. CarBot MegaBot lane."
version: 1.0.0
---

# CarBot MegaBot — Cross-Market Intel Weighting

## Purpose

A Bring a Trailer no-reserve hammer price, a Cars.com dealer asking price, and
a KBB private-party estimate for the same vehicle can differ by 35 percent or
more and all be correct simultaneously. Each reflects a different market
structure, a different buyer pool, and a different transaction cost. The MegaBot
lane must understand these differences precisely in order to weight them
correctly and produce a consensus that is useful to a seller deciding where and
how to list.

---

## Source Definitions and Weight Rationale

### Bring a Trailer (BaT)

BaT auction realized prices represent the most transparent arm's-length
transactions in the enthusiast market. The buyer and seller have no prior
relationship. The price is visible to the public and searchable. For any
collector or enthusiast vehicle with documented history, BaT hammer prices from
the past 90 days are the most reliable single data source available.

Weight classification: HIGH for collector and enthusiast vehicles, MODERATE for
late-model sports cars, LOW for commodity daily drivers.

Critical nuance: BaT results are bimodal. Well-presented, documented examples
achieve premium results. Poorly presented cars with inadequate photos and vague
descriptions consistently underperform. A CarBot MegaBot scan should note whether
the seller's listing quality is likely to perform in the upper or lower BaT
distribution, and adjust accordingly.

No-reserve auctions on BaT typically settle 8 to 12 percent below reserve
auctions for the same vehicle because the buyer pool behaves differently when
they know the car must sell. This distinction matters for sellers considering
BaT as an exit strategy.

### Cars.com and AutoTrader

Dealer asking prices from Cars.com and AutoTrader represent retail asking, not
retail realized. Dealers typically price 15 to 22 percent above their actual
floor for negotiation room. Certified pre-owned listings from franchise dealers
carry a premium of 8 to 14 percent over independent dealer listings for the
same vehicle because of warranty and reconditioning standards.

Weight classification: HIGH for late-model vehicles under 10 years old, MODERATE
for collector vehicles, LOW for pre-1980 vehicles where dealer listings are rare.

When using Cars.com data, the MegaBot should count active listings and note
days-on-market where available. A vehicle that has been sitting on Cars.com for
60-plus days at a given price is evidence that the asking price exceeds the
market clearing price.

### eBay Motors

eBay Motors sold listings (not active listings) provide realized transaction
data across a wide spectrum of vehicle condition and presentation quality. eBay
Motors transactions skew toward buyers comfortable with remote purchase and
shipping, which introduces a slight premium for rare vehicles and a slight
discount for common vehicles relative to local sale.

Weight classification: MODERATE for most vehicle categories. HIGH for rare parts
cars or project vehicles where local markets rarely produce buyers.

eBay Motors active listings are nearly worthless as price signals. They represent
seller hope, not market consensus. The MegaBot must distinguish between sold
listings and active listings in any eBay data it cites.

### KBB (Kelley Blue Book)

KBB private-party fair market range is the most familiar valuation tool for
private sellers and provides a useful anchor for what a typical buyer expects
to pay. KBB is well-calibrated for vehicles between 2 and 12 years old in the
mainstream segments it has strong data for.

KBB underperforms as a signal for:
- Pre-1990 vehicles (limited data, condition sensitivity too high for formula)
- Low-volume specialty vehicles (insufficient comparable transactions)
- Vehicles with major modifications (KBB prices stock configurations only)
- Rapidly appreciating collector vehicles (KBB lags market moves by 6-12 months)

Weight classification: HIGH for mainstream vehicles 2-12 years old, LOW for
collector and modified vehicles.

### NADA Guides

NADA clean retail and clean trade-in values are used primarily by dealers and
lenders. NADA clean retail represents what a dealer would retail a fully
reconditioned example for. NADA clean trade-in represents what a dealer would
offer to a seller walking in off the street.

The spread between NADA clean trade-in and clean retail is the dealer gross
margin, typically 15 to 28 percent depending on vehicle category. A private
seller should price between these two values, closer to retail for a well-
presented car and closer to trade-in for a car that needs reconditioning.

Weight classification: HIGH for dealer-comparable vehicles, MODERATE for
collector vehicles. NADA carries significant weight for commercial vehicles,
trucks, and fleet-category vehicles where dealer financing is common.

### Hagerty Valuation Tools

Hagerty values are specific to collector vehicles and are the industry standard
for classic car insurance and auction estimates. Hagerty maintains four condition
grades (Excellent/Good/Fair/Poor) and tracks historical price trends for each
vehicle. A Hagerty Excellent value for a 1967 Ford Mustang Fastback is the
number Barrett-Jackson uses as a pre-sale estimate anchor.

Weight classification: HIGH for pre-1985 collector vehicles, MODERATE for 1985-
2000 enthusiast vehicles. Do not apply Hagerty data to vehicles without
established collector status — Hagerty does not cover most late-model vehicles.

---

## Regional Demand Premiums

Vehicle values are not uniform across geographies. The MegaBot must apply
regional adjustments when the seller's location is known.

### Oil-Country Trucks

Full-size pickup trucks — particularly heavy-duty diesel configurations — command
significant premiums in oil-producing regions of Texas, Oklahoma, North Dakota,
Alberta, and Louisiana. A 2019 Ram 3500 dually diesel priced at $42,000 in
Minnesota might legitimately command $47,000 to $49,000 in the Permian Basin
where commercial demand is sustained. The MegaBot should flag this premium and
suggest whether a seller in a non-premium region should consider listing on
national platforms to access oil-country buyers.

### Rust-Free Sunbelt Classics

A rust-free example of any pre-1980 American vehicle from Arizona, New Mexico,
or Southern California commands a documented premium over the same vehicle from
a northern state. Rust-free premiums range from 15 to 40 percent depending on
the model. A 1971 Chevrolet C10 from Phoenix is a categorically different
product than the same truck from Michigan, even with identical mechanical
condition. The MegaBot must flag seller location relative to rust-belt geography
and adjust both the value estimate and the recommended listing strategy.

### Four-Wheel Drive in Snow States

Four-wheel-drive and all-wheel-drive vehicles in states with significant winter
driving — Minnesota, Wisconsin, Colorado, Montana, Vermont, Maine — carry local
demand premiums of 5 to 12 percent over national average values. This premium
is most pronounced in the fall selling window, when buyers are preparing for
winter. A seller in Vermont listing a 4WD truck in October is in a stronger
position than the same seller listing in April.

### Import Sports Cars in Coastal Markets

Japanese sports cars (Mazda RX-7, Toyota Supra, Nissan Skyline, Honda S2000)
and European performance vehicles sell at meaningful premiums in coastal urban
markets — Los Angeles, New York, Seattle, Miami — relative to landlocked
secondary markets. The collector community for these vehicles is geographically
concentrated. The MegaBot should flag when a seller in a non-premium market
holds a vehicle with strong coastal demand and recommend national listing platforms.

---

## Seasonal Market Timing and Price Effects

Vehicle markets have documented seasonal patterns that the MegaBot must
incorporate into listing recommendations, not just into static valuations.

### Convertibles and Open-Top Vehicles

Convertibles experience peak buyer demand from March through May in northern
markets as buyers anticipate spring driving season. The same vehicle listed in
November may sit for 30 to 60 days longer and sell for 5 to 10 percent less than
the same vehicle listed in April. For high-value convertibles, the timing
premium justifies holding inventory if a seller can do so without carrying cost.

### Trucks Before Winter

Pickup truck demand rises in September and October in northern markets as buyers
prepare for winter and the next work season. The window from Labor Day to mid-
October is the strongest private-party truck market of the year in snow states.
A seller with a desirable truck in August who can wait 30 to 45 days should
consider doing so.

### Collector and Auction Season

The major collector car auction season runs from January (Barrett-Jackson
Scottsdale) through March (Amelia Island), with a secondary peak in August
(Monterey Car Week). BaT activity is year-round but peaks in spring and fall.
If a seller is considering an auction exit for a significant collector vehicle,
the MegaBot should note the auction calendar and the lead time required for
consignment.

### Year-End Tax Loss and Year-Start Buying

The period from Thanksgiving through December 31 is historically the weakest
period for private-party vehicle sales as discretionary buyers defer. January
and February see a modest recovery as tax refunds enter the market. The
MegaBot should factor a 4 to 7 percent seasonal discount into values for listings
that will go live in November and December.

---

## Reading the Comp Data Spread

The spread between the lowest and highest comparable transactions for a given
vehicle is itself a signal about market conditions. The MegaBot must interpret
spread width, not just calculate a midpoint from it.

### Tight Spread (Under 15 Percent)

A tight comp spread indicates strong market consensus about value. Buyers and
sellers have roughly equivalent information and transaction prices converge.
For the seller, a tight spread means the listing price should sit within the
established range rather than testing the ceiling. Buyers in a tight-spread
market are well-informed and will recognize overpricing immediately.

### Moderate Spread (15 to 30 Percent)

A moderate spread is typical for most collector and enthusiast vehicles. It
reflects genuine variation in condition, documentation, and market timing across
comparable sales. The MegaBot should explain which end of the spread the
current vehicle is likely to achieve based on condition and presentation quality,
rather than simply citing the midpoint.

### Wide Spread (Over 30 Percent)

A wide comp spread indicates either high condition sensitivity (small differences
in quality produce large price differences), thin market data (few comparable
transactions), or genuine market uncertainty about the vehicle's category. Wide
spreads require the MegaBot to be explicit about uncertainty. Recommending a
professional inspection is appropriate when a wide spread is driven by condition
uncertainty rather than data scarcity.

---

## Key Principle

Market intelligence has no value unless it is correctly weighted and honestly
translated into a listing strategy. The MegaBot's output should tell the seller
which source to trust most for their specific vehicle, why, and what the spread
in the data actually means for their pricing decision and platform choice.
