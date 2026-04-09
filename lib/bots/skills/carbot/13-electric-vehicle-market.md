---
name: electric-vehicle-market
description: The EV-specific valuation framework. Battery state of health (SoH), degradation curves, warranty coverage, charging compatibility, federal tax credit status on used EVs, and the Tesla vs non-Tesla market split. Why EV depreciation is steeper than ICE.
when_to_use: Any scan where the vehicle is fully electric (BEV) or plug-in hybrid (PHEV). Includes Tesla, Rivian, Lucid, Ford Mustang Mach-E, Ford F-150 Lightning, Chevy Bolt, Hyundai Ioniq 5/6, Kia EV6, VW ID.4, Nissan Leaf, Porsche Taycan, BMW i3/i4/iX, Mercedes EQS, Audi e-tron, Polestar.
version: 1.0.0
---

# Electric Vehicles — The New Valuation Framework

Electric vehicles follow different valuation rules than gasoline vehicles. Battery health, not mileage, is the primary condition metric. Warranty coverage on the battery is worth thousands of dollars. Charging network compatibility can make or break a regional buyer pool. And the used EV market has been volatile — with the Tesla price cuts of 2023-2024 and the federal tax credit changes creating waves of price resetting.

## Battery State Of Health (SoH) — The New Mileage

The battery is the single most expensive component in any EV, and its degradation determines the vehicle's remaining useful life. SoH is measured as a percentage of original capacity.

| SoH | Category | Value Impact |
|---|---|---|
| 95-100% | Like new | Baseline (full value) |
| 90-95% | Excellent | -2 to -5% |
| 85-90% | Good | -5 to -10% |
| 80-85% | Fair | -10 to -20% |
| 70-80% | Significant degradation | -20 to -35% |
| Below 70% | Battery replacement approaching | -40 to -60% |

Most EVs lose 2-4% battery capacity per year under normal use, faster in hot climates. A 5-year-old Tesla Model 3 should be at 88-92% SoH. Below that is a red flag.

## How To Estimate SoH From Photos And Data

CarBot cannot run a direct battery diagnostic, but can estimate SoH from:
1. **Current range displayed on dashboard** — seller provides this on a full charge. Compare to EPA range.
2. **Range vs EPA spec at 100% SOC**: A Model 3 Long Range rated 358 miles EPA, showing 320 miles at 100% = 89% SoH.
3. **Service records**: Tesla Service Center will have run the Battery Degradation Test — ask for the report.
4. **Vehicle diagnostic apps**: Scan My Tesla, TeslaFi, TeslaMate — owner-installed apps showing historical degradation.
5. **OBD reader**: newer EVs support SoH via OBD-II scan.

Always request a range-at-full-charge photo from the seller as part of the scan input.

## Battery Warranty — The Value Anchor

US federal law (and most state laws) requires a minimum 8-year / 100,000-mile battery warranty on EVs. Some manufacturers extend this. A vehicle WITH remaining battery warranty is worth significantly more than one without — because a battery replacement out of warranty is a $10,000-$25,000 expense.

| Manufacturer | Battery Warranty |
|---|---|
| Tesla | 8 years / 100k-150k miles (varies by trim) |
| Ford (Mustang Mach-E, F-150 Lightning) | 8 years / 100k miles |
| GM (Bolt, Lyriq, Silverado EV) | 8 years / 100k miles |
| Hyundai / Kia (Ioniq, EV6) | 10 years / 100k miles |
| Rivian | 8 years / 175k miles |
| Lucid | 8 years / 100k miles |
| Porsche Taycan | 8 years / 100k miles |
| BMW i-series | 8 years / 100k miles |
| Nissan Leaf | 8 years / 100k miles (capacity 9 years / 100k) |

State the remaining battery warranty explicitly in `identification` — "4 years / 60k miles remaining on original battery warranty."

## Charging Compatibility — The Regional Concern

Used EV buyers care about how and where they can charge. Three variables:

1. **Home charging capability**: Does the buyer have 240V service for Level 2? Most EV buyers need Level 2 at home.
2. **DC fast charging**: Does the vehicle support fast charging? What max kW? What standard (CCS1, Tesla NACS, CHAdeMO)?
3. **Public charging network**: In the buyer's region, which networks serve them? Tesla Supercharger, Electrify America, EVgo, ChargePoint?

**CHAdeMO is dying**: Nissan Leaf and a few other older EVs use the CHAdeMO DC fast standard, which is being phased out. Post-2025 the public CHAdeMO network is shrinking. Leaf values discount heavily for this reason.

**NACS transition (2024-2026)**: Most non-Tesla automakers are switching to Tesla's NACS connector for new vehicles. Current CCS1 vehicles are supported via adapters but the transition affects long-term charging convenience. Flag in `value_drivers`.

## Federal Used EV Tax Credit (IRS 25E)

The Inflation Reduction Act of 2022 created a used clean vehicle credit:
- **Up to $4,000** or 30% of sale price, whichever is less
- Applies to used EVs sold by dealers (NOT private party) for under $25,000
- Buyer income limits apply ($75,000 single / $150,000 joint)
- Vehicle must be 2+ years old
- First transfer of use since becoming a used vehicle

This credit affects used EV pricing in two ways:
1. Dealer sales under $25,000 get a tax-credit bump (sellers to dealers can price slightly higher)
2. Private party sales do NOT qualify — private party sellers lose this advantage
3. The $25,000 price ceiling creates a cluster of listings just under that number

When selling an EV, the seller should know that private party sale does NOT get the buyer a tax credit. If the vehicle is under $25,000 AND the seller is willing to do a dealer trade, the trade value may be close to or above private party because the dealer can resell with the credit.

## The Tesla Premium (And Its Erosion)

For years, Tesla commanded a used market premium due to:
- Supercharger network exclusivity
- Strong brand and resale
- Software-update value growth
- Autopilot and FSD features

This premium eroded dramatically starting in 2023 when Tesla cut new car prices, resetting used values downward. By 2026:
- Used Tesla Model 3/Y: at parity with comparable Hyundai Ioniq 5 / Ford Mustang Mach-E
- Used Tesla Model S/X: significant depreciation, especially older refreshed models
- Used Tesla Cybertruck: too new to establish market but early transfers at or below MSRP

State the Tesla-specific adjustment in `value_reasoning` and reference the 2023-2024 price cut context.

## The Non-Tesla EV Market Split

Non-Tesla EVs split into three tiers:
1. **Premium established** (Porsche Taycan, Audi e-tron GT, Lucid Air): luxury car depreciation + battery concerns → steep first-3-year depreciation
2. **Mainstream quality** (Hyundai Ioniq 5/6, Kia EV6, Ford Mustang Mach-E, VW ID.4): steady depreciation, reasonable resale
3. **Budget / discount** (Chevy Bolt, Nissan Leaf, Mini SE): fast depreciation, niche buyer

## Battery Replacement Cost Context

If the battery is near end of life, a replacement quote from the manufacturer is:
- **Tesla Model 3 Long Range**: $13,000-$18,000 at Tesla Service
- **Chevy Bolt (2017-2022)**: $16,000 retail but GM did free replacement under recall
- **Nissan Leaf (24 kWh original)**: $5,500-$8,500 refurbished, $9,000-$12,000 new
- **Porsche Taycan**: $35,000+ at dealer
- **Ford Mustang Mach-E**: estimated $20,000+

These are worst-case numbers. Most sellers never face them because they sell before battery failure. But the possibility anchors depreciation.

## Output

In `identification`, state battery state of health estimate (or "requires owner to provide range-at-full-charge data"), battery warranty status, and charging standard. In `mechanical`, note any range reduction observed. In `value_drivers`, state the battery warranty coverage remaining and any DC fast charging limitations. In `market.private_party_value`, reference the post-2023 price-cut context for Tesla and the appropriate segment tier for non-Tesla.
