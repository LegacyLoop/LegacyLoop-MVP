---
name: title-history-red-flags
description: The title brand decoder. Clean, Salvage, Rebuilt, Flood, Hail, Lemon, Junk, Manufacturer Buyback, Gray Market, TMU. Value impact of each brand. Where to verify. How branded titles affect insurance, financing, and state registration.
when_to_use: Every CarBot scan where title status is disclosed OR where the vehicle shows signs of prior damage that might indicate a title brand.
version: 1.0.0
---

# Title Brands — Federal Facts That Change The Value Forever

A vehicle's title is the legal document that transfers ownership. When a vehicle is damaged, stolen, flooded, or declared a total loss, states apply a "brand" to the title that stays with the VIN forever — across every future sale, in every state. Title brands are the biggest objective value destroyer in the used car market. Knowing the brand system is non-negotiable.

## The Title Brand Hierarchy (Worst To Best)

| Brand | Meaning | Value Impact |
|---|---|---|
| Junk / Dismantled | Unfit for road, parts only, cannot be re-registered in most states | -85 to -95% |
| Flood | Submerged in water, electrical and mechanical damage likely | -50 to -80% |
| Salvage | Total loss, not yet repaired | -60 to -80% |
| Rebuilt / Reconstructed | Salvage that was repaired and passed state inspection | -30 to -50% |
| Manufacturer Buyback (Lemon) | Bought back by manufacturer under state lemon laws | -25 to -45% |
| Hail Damage | Cosmetic damage from hailstorm | -15 to -30% |
| Gray Market | Imported, may not meet US DOT/EPA | -20 to -40% |
| TMU (True Mileage Unknown) | Odometer replaced or tampered | -20 to -40% |
| Theft Recovery | Stolen and recovered (often no other damage) | -10 to -25% |
| Clean | No brands, standard title | Baseline (100%) |

## Salvage vs Rebuilt — The Critical Distinction

**Salvage** = total loss, not yet repaired. Cannot be registered for road use. Parts value only. Buyer would need to repair AND pass state inspection to upgrade the title.

**Rebuilt / Reconstructed** = previously salvage, repaired, inspected, and re-titled as road-legal. CAN be registered, driven, and insured — but with caveats.

A salvage title vehicle is typically 70-85% off clean-title value. A rebuilt title vehicle is typically 30-50% off clean-title value. The difference is the inspection and repair investment.

Rebuilt title concerns:
- **Insurance**: many major insurers will not write full-coverage policies on rebuilt titles. Liability-only may be required. Shop specialty insurers.
- **Financing**: most banks will not finance rebuilt titles. Cash sale or specialty lender only.
- **Resale**: buyer pool narrows by 50-70%. Many buyers categorically refuse rebuilt.
- **State variability**: rebuilt title transfers state to state, but repair standards vary. A rebuilt title from one state may face challenges registering in another.

## Flood Title — The Silent Killer

Flood damage is devastating because:
1. Water penetrates electrical systems slowly (corrosion appears months later)
2. Airbag modules may fail
3. Seat belt pretensioners may fail
4. Wiring harnesses corrode
5. Moisture in engine/transmission causes internal rust
6. Interior mold is persistent
7. Electronics (ECU, BCM, infotainment) progressively fail

Flood vehicles often appear fine at point-of-sale and fail within 6-18 months. The discount reflects this known decay.

**Hurricane cleanup cycles** (2005 Katrina, 2012 Sandy, 2017 Harvey/Irma/Maria, 2022 Ian, 2024/2025 events) produced waves of flood cars that were shipped cross-country and resold in unaffected states with fresh titles. **ALWAYS check CARFAX for flood history**, especially on vehicles from or titled through coastal states after major storms.

Red flags for undisclosed flood damage:
- Water line visible on interior carpet below seat
- Mud or silt in spare tire well
- Rust on seat springs or interior bolts
- Musty interior smell
- Dashboard lights with corrosion markers
- Mismatched carpet (replaced)
- Water line on engine components
- Headlight interior fog/residue
- Electrical glitches on test drive

## Lemon / Manufacturer Buyback

Each state has a "lemon law" that requires manufacturers to buy back vehicles with repeated unfixable defects. When bought back, the title is branded:
- **Lemon** (some states — GM buybacks typically branded)
- **Manufacturer Buyback** (most states)
- **MFR Vehicle Repurchase** (CA)

A lemon buyback means the defect was so persistent that the manufacturer gave up. Common lemon issues:
- Transmission failures on multiple attempts
- Electrical issues the dealer could not diagnose
- Drivability problems (stalling, surging, loss of power)
- Safety defects the manufacturer could not resolve

Lemons are often repaired by the manufacturer AFTER buyback and resold. The buyer of a rebuilt lemon is getting a vehicle where the defect has theoretically been fixed — but the pattern suggests underlying engineering issues.

## Hail Damage Title

Hail damage titles are interesting:
- Pure cosmetic damage from hailstorms (no structural or mechanical damage)
- Often sold at auction by insurance companies after total loss
- Buyer can PDR (paintless dent repair) and drive normally
- Resale concern: dimples may reappear in direct sunlight, panels may have hidden stress
- Discount: 15-30% depending on damage extent

Some buyers specifically seek hail damage titles for budget purchases. Not a dealbreaker.

## Gray Market (Imported)

Gray market vehicles are imported but not certified for US DOT (Department of Transportation) and EPA (Environmental Protection Agency) compliance. Common gray market issues:
- **Pre-1996 imports**: exempt from most regulations, generally OK
- **1996-2023 imports**: must meet US DOT + EPA, may require modification
- **25-year rule**: vehicles 25+ years old can be imported with minimal restrictions
- **Show and display**: rare vehicles can be imported with strict mileage limits

Gray market Nissan Skylines (R32, R33, R34) are legal under the 25-year rule as they age in. Gray market European imports (Euro-spec BMW, Mercedes, Porsche) may have different specs than US versions.

Discount for gray market: 20-40% unless the vehicle is specifically valuable in its gray market form (R34 GT-R).

## Verification Sources

Every CarBot scan over $5,000 should recommend the seller pull:
1. **CARFAX** (paid, comprehensive) — $40
2. **AutoCheck** (paid, sometimes more up-to-date on auction data) — $30
3. **NMVTIS** (National Motor Vehicle Title Information System) — $2-$5, federally mandated reporting from insurers and states

CARFAX is the industry standard but can miss events. AutoCheck sometimes catches things CARFAX misses. NMVTIS is the federal database — if a brand is there, it's official.

For higher-value vehicles (over $25,000), recommend both CARFAX AND AutoCheck.

## What To Tell The Seller

- "Your title brand is [status]. Based on current market, this affects your value by approximately X%."
- If clean: "Your clean title is a value anchor. Make sure the buyer verifies via CARFAX to prevent negotiation discounts based on false concerns."
- If branded: "Your [brand] title requires specific buyer pool. Expect fewer offers but buyers who accept branded titles know what they're buying. Price for that market."
- If branded and selling locally: "Branded titles sell fastest to private parties who understand the value tradeoff. Dealer trades will refuse or lowball."

## Output

In `identification.title_status`, state the specific brand or "Clean." In `value_drivers`, apply the brand-specific discount to the baseline clean-title value. In `condition.red_flags[]`, note any visible indicators of undisclosed damage. In `selling_strategy.presentation_tips[]`, recommend the seller pull a CARFAX and share it proactively with buyers.
