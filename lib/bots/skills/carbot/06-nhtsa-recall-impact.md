---
name: nhtsa-recall-impact
description: How to interpret NHTSA recall data, safety ratings, complaints, and investigations. Which recalls are dealbreakers vs advisories. How open recalls affect value. The Takata airbag legacy. State inspection and registration implications.
when_to_use: Every CarBot scan. The NHTSA VIN decode + recall pull is already wired in route.ts:153-213 — this pack interprets the data correctly.
version: 1.0.0
---

# NHTSA Data — Federal Facts The Seller Cannot Spin

The National Highway Traffic Safety Administration maintains the only authoritative database of US vehicle recalls, complaints, investigations, and crash test results. The CarBot route already pulls this data (lines 153-213) and injects it into the sellerContext. Your job is to interpret it correctly — knowing which recalls matter, which are routine, and how open recalls affect value.

## The NHTSA Data Streams

Each NHTSA call returns four distinct data types:

1. **Recalls** — safety defects the manufacturer is required to repair free of charge. Every open recall is a disclosure requirement.
2. **Complaints** — individual owner reports of problems. No investigation required, but high-volume patterns drive investigations.
3. **Investigations** — NHTSA has opened a formal review. Can lead to recalls, technical service bulletins, or closure.
4. **Safety Ratings** — the 1-5 star overall crash test score and component scores (front, side, rollover).

Use all four. A vehicle with 5-star ratings and zero recalls is a different object than the same model with 3-star ratings and 8 open recalls.

## Recall Severity Tiers

Not all recalls are equal. CarBot grades them on a 4-tier severity scale:

| Tier | Example | Impact |
|---|---|---|
| **CRITICAL** | Takata airbag (explosive rupture), fuel tank leak, brake total failure | Vehicle unsafe to drive until fixed. Dealer obligation to fix free. Disclose to buyer. |
| **HIGH** | Steering loss, unintended acceleration, transmission failure, electrical fire risk | Vehicle should not be driven until repaired. Material value impact. |
| **MEDIUM** | Seat belt tensioner, airbag warning light, minor electrical, wiper motor | Should be scheduled but vehicle drivable. Modest value impact. |
| **LOW / ADVISORY** | Instrument cluster glitch, minor trim, inspection-related | No value impact, mention in disclosure. |

A vehicle with 1 CRITICAL open recall is worth 10-20% less than the same vehicle with the recall completed. State the severity tier explicitly in `recalls.open_recalls[]`.

## The Takata Airbag Legacy (2014-2019 Recall Wave)

The largest automotive safety recall in history affected 67 million vehicles across 19 manufacturers. Key facts:
- Affected models: Honda, Acura, Toyota, Lexus, BMW, Audi, Ford, GM, Mazda, Subaru, Nissan, Mitsubishi, Chrysler, Fiat, Ferrari, Jaguar, Land Rover, Mercedes, Pontiac
- Specific model years: generally 2002-2015 depending on manufacturer and model
- The defect: inflator ruptures and sprays metal shrapnel when deployed
- The fix: free airbag module replacement at dealer
- Status today (2026): most recalls are COMPLETE but older forgotten vehicles may still be open

Always check Takata status on affected model years. An open Takata recall is a CRITICAL tier — the vehicle should not carry passengers until the airbag is replaced.

## Complaint Volume Signals

A high complaint count (100+ complaints) without a formal investigation usually means:
- A known issue that's out of warranty
- Manufacturer is not recalling but acknowledging via TSB (Technical Service Bulletin)
- Buyer-beware situation

Examples of high-complaint categories:
- **Ford Focus/Fiesta DPS6 PowerShift transmission (2011-2018)**: 20,000+ complaints, known failure, class action
- **Nissan CVT transmissions (Altima, Rogue, Pathfinder 2013-2018)**: high complaint volume, reliability discount
- **Honda V6 transmission (2003-2004 Accord, Odyssey)**: documented failure pattern
- **GM 5.3L Active Fuel Management oil consumption (2010-2014)**: high complaint volume
- **Chrysler 200 Pentastar transmission (2015-2017)**: complaints + TSBs

When the NHTSA data returns high complaint volume for the specific model year, cite it in `mechanical.common_problems[]` and discount the valuation accordingly.

## Active Investigations

If NHTSA has an open investigation on the specific year/model, that is a **MODERATE** flag. Investigations can lead to recalls (major value impact) or close without action. Examples:
- Tesla Autopilot investigations (ongoing across multiple model years)
- Ford Bronco hardtop delamination (2021-2023)
- Kia/Hyundai engine rod bearing failures (2.4L GDI, 2011-2019)

State the investigation status in `recalls.investigations[]` with the specific defect.

## Safety Ratings Matter For Family Buyers

For family/commuter vehicles, NHTSA 5-star overall rating is a marketing point. For work trucks, sports cars, and classics, safety ratings matter less to the buyer. Cite the rating in `identification.safety_rating` with context:

- **5 stars**: highlight in listing (family buyer value)
- **4 stars**: standard, mention neutrally
- **3 stars or below**: disclose, buyer segment narrows
- **No rating** (vehicle not tested): state "not tested by NHTSA" — common for older or low-volume vehicles

## State Inspection And Registration Implications

Open safety recalls can prevent state inspection in several states:
- **Pennsylvania, New York, Massachusetts** — inspection requires open safety recalls resolved
- **California** — smog check requires certain emissions recalls resolved
- **Texas** — inspection passes with open recalls but dealer disclosure required
- **Florida** — no state inspection, but insurance may require fix

For vehicles with open CRITICAL or HIGH tier recalls in inspection states, recommend the seller have the recall completed BEFORE listing. It's free, and it removes a buyer objection.

## The Dealer Obligation

Manufacturer recalls are repaired FREE at authorized dealers, regardless of:
- Owner changes (new owner can claim recall repair)
- Mileage
- Age of vehicle (with very rare exceptions past 15 years)
- Whether the vehicle is under warranty

A seller who says "I can't afford to fix that recall" is wrong — it's free. Advise them to schedule the dealer appointment before listing.

## Output

Populate `recalls.open_recalls[]` with each open recall + severity tier. Populate `recalls.completed_recalls[]` with recall history. In `recalls.critical_flags`, surface CRITICAL and HIGH tier items at the top of the block. In `value_drivers`, note whether open recalls impact pricing (they should, for HIGH and CRITICAL). In `selling_strategy.presentation_tips[]`, recommend completing open recalls before listing.
