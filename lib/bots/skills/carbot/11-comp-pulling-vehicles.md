---
name: comp-pulling-vehicles
description: How to read vehicle comps from eBay Motors, Cars.com, Craigslist, Bring a Trailer archives, Hagerty Valuation Tools, KBB, and NADA. The private-party vs dealer retail vs trade-in vs auction hammer spread. Freshness decay. Regional comp adjustment.
when_to_use: Every CarBot scan. The marketIntel + scrapers return raw comps — this pack teaches how to interpret them through the vehicle-market lens.
version: 1.0.0
---

# Vehicle Comp Pulling — The Four-Value Spread

Unlike cards or watches, every vehicle has FOUR distinct prices that all matter:
1. **Dealer retail asking** — inflated, aspirational
2. **Private party asking** — typically 10-20% below dealer retail
3. **Private party sold** — 5-15% below private party asking
4. **Trade-in / wholesale** — 15-30% below private party sold
5. **Auction hammer (for collectors)** — varies by house, typically between private party and trade-in

When reading vehicle comps, you must know WHICH price you're looking at. A Cars.com asking price is not the same as a KBB private party value is not the same as a Manheim auction wholesale report.

## The Price Ladder (High To Low)

| Price Type | Source | Use Case |
|---|---|---|
| Dealer retail asking | Cars.com, AutoTrader dealer listings | Ceiling reference |
| Dealer retail sold | TrueCar, Edmunds market data | Retail sold anchor |
| KBB private party value | KBB.com | Official private party benchmark |
| NADA private party | NADAguides.com | Alternate benchmark (often higher than KBB) |
| Hagerty Valuation | hagerty.com/tools (classics only) | Tier-specific classic car value |
| Private party asking | Facebook Marketplace, Craigslist | Private party ceiling |
| Private party sold | TrueCar private party, local sale records | Private party reality |
| KBB trade-in value | KBB.com | Wholesale floor |
| Manheim wholesale | Manheim Market Report (dealer access) | Dealer auction reality |
| Copart / IAA salvage | Copart.com, IAAI.com | Salvage floor |

CarBot's job: triangulate these sources to produce a honest private-party value range for the seller.

## Comp Source Weight By Vehicle Age

Different sources matter more at different age tiers:

### New-ish Vehicles (0-5 years old)
- **Primary**: KBB, TrueCar, Edmunds (live dealer retail data)
- **Secondary**: Cars.com, AutoTrader active listings
- **Tertiary**: Manheim wholesale (if available)
- **Ignore**: Hagerty (not a classic)
- **Why**: Recent vehicles have abundant live market data. KBB updates prices weekly.

### Used Mainstream (5-15 years old)
- **Primary**: KBB private party + Cars.com sold data
- **Secondary**: CarGurus market reports
- **Tertiary**: Facebook Marketplace local asking
- **Ignore**: Hagerty (unless specifically classified as collector)
- **Why**: Mass-market vehicles in this age band have consistent pricing data.

### Enthusiast Modern (5-15 years, specialty models)
- **Primary**: Bring a Trailer sold archives (free, searchable)
- **Secondary**: Cars and Bids sold data
- **Tertiary**: eBay Motors sold filter
- **Quaternary**: Cars.com dealer listings
- **Why**: Modern enthusiast cars have their own market. BaT hammer data is the best real-world sold price for specialty buyer segments.

### Classics (25+ years)
- **Primary**: Hagerty Valuation Tools (tier-specific)
- **Secondary**: Mecum and Barrett-Jackson auction archives
- **Tertiary**: Bring a Trailer sold archives
- **Quaternary**: Hemmings sold archives
- **Ignore**: KBB (does not cover classics well), Cars.com (wrong buyer pool)
- **Why**: Classics have their own collector ecosystem. KBB is blind to provenance and originality.

## Bring a Trailer Archives (The Goldmine)

BaT publishes every sold result (hammer + bid history + photos + comments) in a free searchable archive at bringatrailer.com. This is the BEST single data source for modern enthusiast cars. For any vehicle that fits BaT's profile (enthusiast, manual, rare, modern classic), the top comp source is BaT archives.

Search BaT archives by:
- Model (e.g., "E46 M3")
- Year range
- Transmission (manual commands premium)
- Color / paint code
- Mileage band

Filter to last 12 months for freshness. Pull the top 10 most-similar sold results and median them.

## The Regional Comp Adjustment

Vehicle prices vary by region more than any other product. CarBot must apply regional adjustments:

### Premium Regions (prices 5-15% above national median)
- Major metros (NYC, LA, SF, Boston, DC, Seattle) — higher cost of living, higher asking prices
- Oil country for trucks (TX, OK, ND, WY)
- Sunbelt for clean classics (AZ, NM, CA, NV, FL)

### Discount Regions (prices 5-15% below national median)
- Rust belt for non-garaged cars (OH, MI, PA, Upstate NY, MN)
- Rural areas (fewer buyers, lower density)
- Deep South for non-AC-friendly cars

### Special Regional Premiums
- **4x4 trucks in New England / Rockies**: +10-15%
- **Convertibles in California/Florida**: +5-10%
- **AC-equipped vehicles in the South**: +5-10%
- **AWD in snow states**: +5-10%

The seller's ZIP code determines the regional adjustment. Always pull that into the final range.

## Freshness Decay

Vehicle comps decay fast. The market moves on:
- **Last 30 days**: full weight
- **Last 90 days**: 90% weight
- **Last 6 months**: 75% weight (apply trend adjustment)
- **6-12 months old**: 50% weight, reference only
- **Over 12 months**: directional signal only — do not use as primary anchor

The pandemic-era used car bubble (2021-2022) is now fully deflated. Prices are still adjusting downward on many segments through 2026. Any comp from 2021-early 2023 should be treated as stale unless the category specifically held value.

## The "Same Car" Test

When pulling comps, ONE good comp of the SAME configuration beats ten comps of similar-but-different configurations. Aim for matches on:
1. Year (±1 OK for most, exact for classics)
2. Model + trim + package (exact)
3. Transmission (exact — manual vs auto is different market)
4. Drivetrain (AWD/4WD vs 2WD — different market)
5. Mileage (within ±20%)
6. Condition (within one tier)
7. Color (luxury/exotic only — for mainstream, color doesn't matter much)

A comp for a 2018 F-150 XLT 4x4 Crew Cab EcoBoost 5.5' bed with 80,000 miles is a strong match for another 2018 F-150 XLT 4x4 Crew Cab EcoBoost 5.5' bed with 85,000 miles. A 2017 F-150 Lariat 4x4 SuperCab 5.0L V8 6.5' bed with 120,000 miles is NOT a strong match — the configuration is different.

## Outlier Detection

If 9 comps cluster at $18,000-$22,000 and one is at $35,000, the outlier is probably:
- A different trim or package
- A low-mileage cherry
- Desperate or uninformed seller asking high
- Price not yet dropped

Do not include the outlier in the median. Mention it as a ceiling possibility in `market.private_party_value_high`.

## Comp Count Thresholds

- **10+ matching comps**: tight confidence band (±5-10%)
- **5-9 matching comps**: standard band (±10-15%)
- **2-4 matching comps**: wide band (±15-25%)
- **1 comp**: very wide band, flag low confidence
- **0 comps**: use NADA + KBB + region-adjusted; flag as low confidence; recommend professional appraisal

## Output

In `market`, state the private party value range, the dealer retail ceiling, and the trade-in floor. In `market.comp_sources`, list the specific sources used (KBB, BaT archives, Cars.com sold, etc.) with comp count. In `value_reasoning`, cite the specific comp math including freshness adjustment and regional adjustment.
