---
name: carbot-megabot-vin-confidence-amplifier
description: >
  Defines how CarBot's MegaBot lane uses VIN data streams to amplify or attenuate
  consensus confidence. Covers the 4-agent mismatch protocol, pre-1980 VIN
  handling, EV battery state-of-health as a proxy signal, and the mileage-to-
  expected calibration formula used across all four agents.
when_to_use: "MegaBot scans only. CarBot MegaBot lane."
version: 1.0.0
---

# CarBot MegaBot — VIN Confidence Amplifier

## Purpose

The Vehicle Identification Number is not merely a license plate for the chassis.
For vehicles manufactured since 1981, it is a structured data record containing
the manufacturer, country of origin, production plant, model year, body style,
engine code, and sequential production number. When decoded and cross-referenced
against mileage records, title history, and recall databases, the VIN becomes
the single most powerful confidence amplifier available to the MegaBot lane.
This document defines exactly how the four-agent system uses VIN data to
strengthen or weaken its consensus and what it does when that data conflicts
with seller claims.

---

## The Four VIN Data Streams

### Stream 1: NHTSA VIN Decode

The National Highway Traffic Safety Administration maintains a public VIN
decoding database that returns manufacturer-specified vehicle attributes for any
17-character VIN manufactured after 1980. A clean NHTSA decode confirms:

- Manufacturer of record and country of origin
- Model year (which can differ from the calendar year of manufacture)
- Body style and door count
- Engine displacement and fuel type
- Plant of manufacture
- Sequential production number

The MegaBot should verify that the decoded attributes match the seller's
description of the vehicle. Common mismatches include sellers misidentifying
trim levels, incorrect engine specs (confusing base and performance engine
codes), and model year confusion for late-production vehicles that carry the
following model year designation.

### Stream 2: Mileage History

Mileage history is recorded at each title transfer, vehicle registration renewal
in states that require odometer disclosure, and dealer inspection. The MegaBot
cross-references the seller's stated mileage against the most recent mileage
record in the vehicle history. The delta between the most recent record and
the stated current mileage must be consistent with the elapsed time and typical
usage patterns for the vehicle category.

Expected annual mileage benchmarks by vehicle type:
- Primary commuter vehicle: 12,000 to 15,000 miles per year
- Weekend or second vehicle: 4,000 to 8,000 miles per year
- Commercial or fleet vehicle: 18,000 to 25,000 miles per year
- Collector or show vehicle: 500 to 2,500 miles per year

A vehicle whose mileage increase exceeds 150 percent of the category benchmark
since the last documented record, or whose mileage is lower than expected by
more than 60 percent over the same period, warrants scrutiny in either direction
— excessive mileage may indicate undisclosed commercial use, while suspiciously
low mileage accumulation may indicate odometer manipulation.

### Stream 3: Title Status and Ownership Transfer History

Title status data from CarFax, AutoCheck, or NMVTIS reveals the full chain of
ownership, any branded title events, and state-of-record at each transfer. The
MegaBot evaluates:

- Number of previous owners relative to vehicle age (a vehicle with more than
  5 previous owners in 10 years suggests underlying issues driving turnover)
- Length of each ownership period (very short ownership periods — under 6 months —
  in a vehicle's history indicate possible flip transactions)
- States of registration across ownership history (interstate title washing is
  a documented fraud vector)
- Any title brand events: salvage, rebuilt, flood, lemon, odometer rollback,
  junk, or parts only

A vehicle with a clean, single-owner history verified through matching title
records is a fundamentally different product from one with 4 previous owners
and a 14-month gap in registration history, even if both vehicles appear
identical in photos.

### Stream 4: Open Recall Count and Severity

NHTSA maintains a searchable database of open safety recalls by VIN. A vehicle
with open recalls has documented safety deficiencies that the manufacturer has
agreed to remediate at no cost. Open recalls are relevant to valuation for
two reasons: they may represent unaddressed safety issues affecting buyer
willingness to pay, and they represent a known cost to close (the buyer or
seller must arrange dealer service to complete the recall).

The MegaBot should report:
- Total open recall count
- Highest severity level (Safety Risk, Moderate, Informational)
- Whether the recall affects a safety-critical system (brakes, airbags,
  steering, fuel system, engine)

A vehicle with a single informational recall for a software update requires no
adjustment to value. A vehicle with an open recall for airbag inflator failure
or brake master cylinder defect requires explicit disclosure and may require
value adjustment if the seller cannot complete the recall prior to sale.

---

## How Data Streams Amplify or Attenuate Consensus Confidence

The MegaBot assigns a confidence score to its consensus estimate. Each VIN data
stream modifies this score independently:

NHTSA decode matches seller description → no adjustment (baseline confidence)
NHTSA decode finds attribute mismatch → attenuate by 15 percent

Mileage history consistent with category benchmark → amplify by 10 percent
Mileage history shows gap or inconsistency → attenuate by 20 percent

Title history: single owner, no gaps, no brands → amplify by 15 percent
Title history: multiple owners, gaps present → attenuate by 10 percent
Title history: any branded title event → attenuate by 25 percent

Open recall count: zero → no adjustment
Open recall count: 1-2 informational recalls → no adjustment
Open recall count: 1 or more safety-critical recalls → attenuate by 10 percent
and add required disclosure flag

The final confidence score after all stream adjustments determines how the
MegaBot presents its range. High confidence allows a tighter range presentation.
Low confidence requires an explicit uncertainty statement and, in severe cases,
an escalation recommendation per the escalation triggers protocol.

---

## When VIN Data Conflicts with Seller Claims

Conflicts between VIN data and seller claims fall into three categories:
innocent error, incomplete knowledge, and deliberate misrepresentation. The
MegaBot cannot determine which category applies, so it must handle all conflicts
with the same protocol: clear disclosure of the conflict and a recommendation
for resolution.

### 4-Agent Unanimous Mismatch Detection

The MegaBot architecture distributes VIN data to all four agents independently.
Each agent evaluates the data against the seller's description without
coordinating with the others before submitting its finding. When all four
agents independently identify the same conflict between VIN data and seller
claims, this unanimous detection elevates the finding to CRITICAL status.

A CRITICAL flag means:
- The conflict is prominent in the output report, not buried in a notes section
- The MegaBot declines to publish a final consensus value until the conflict
  is resolved or explicitly acknowledged by the seller
- A specific resolution path is provided (documentation to obtain, inspection
  to commission, or seller acknowledgment statement to include in the listing)

A conflict flagged by only 1 or 2 of 4 agents is reported as a REVIEW ITEM,
not a CRITICAL flag, and does not block the consensus output.

### Common Conflict Scenarios

Engine mismatch: The seller identifies the vehicle as a specific performance
variant (a factory 4-speed, a specific cubic-inch engine code) but the VIN
decode does not confirm that configuration. This is common with assembled
vehicles, partial restorations, and vehicles whose drivetrain was replaced with
a period-correct substitute. The resolution is documentation of the original
configuration or honest disclosure of the current configuration with appropriate
value adjustment.

Model year mismatch: The seller states a calendar year that does not match the
model year embedded in the VIN. This is most common with vehicles produced in
the fall of the prior year carrying the next model year designation, but can
also indicate a retitled or reconstructed vehicle.

Ownership count mismatch: The seller states "one previous owner" but title
records show three previous owners. This is frequently innocent — sellers
often count only the owners from whom they personally acquired the vehicle —
but the MegaBot must report the discrepancy because a buyer will find it
independently and interpret it unfavorably.

---

## Pre-1980 VIN Non-Standardization

The 17-character standardized VIN was mandated by NHTSA for all vehicles
manufactured in the United States for the 1981 model year and later. Vehicles
manufactured before 1981 used manufacturer-specific VIN formats with no
standardized length, structure, or meaning.

For pre-1980 vehicles, the MegaBot adjusts its VIN handling as follows:

Decode attempt: The MegaBot attempts to decode the VIN using manufacturer-
specific tables for the major domestic manufacturers (GM, Ford, Chrysler) and
common imports (Volkswagen, Porsche, British Leyland). Where a decode is
possible, it is provided with an explicit disclaimer noting non-standard format.
Where a decode is not possible, the MegaBot reports the raw VIN and notes the
limitation.

Partial data protocol: For pre-1980 vehicles, the MegaBot places greater weight
on physical documentation — window sticker, build sheet, original title,
manufacturer certification letters — than on electronic record systems that
may have no data for the vehicle. Matching-numbers assessment defaults to
Claude's qualitative analysis of the documentation provided.

Confidence adjustment: The confidence score for a pre-1980 vehicle is
automatically set to MODERATE regardless of other factors, because the limited
electronic record infrastructure for these vehicles means that absence of data
is not the same as absence of issues.

---

## EV Battery State-of-Health as a Proxy Confidence Signal

For electric vehicles, battery state-of-health functions as a composite proxy
for the vehicle's overall condition. A battery that has degraded significantly
indicates one or more of:

- High cumulative mileage placing stress on the pack
- Sustained high-power charging practices that accelerate degradation
- Thermal management failures (operation in extreme temperatures without
  proper conditioning)
- Possible battery cell failures that the management system has compensated for

Battery state-of-health thresholds for confidence adjustment:

Above 92 percent: amplify confidence by 10 percent (excellent battery condition
suggests well-maintained vehicle overall)
85 to 92 percent: no adjustment (expected degradation for mileage and age)
78 to 85 percent: attenuate confidence by 10 percent, flag for disclosure
Below 78 percent: attenuate confidence by 20 percent, escalate for inspection
and battery replacement cost estimate

---

## The Mileage-to-Expected Formula

All four MegaBot agents should calibrate their condition and value assessments
against a mileage-to-expected calculation before generating their independent
outputs. The formula is:

Expected current mileage = (vehicle age in years) times (category annual
average mileage)

Mileage ratio = actual mileage divided by expected mileage

A mileage ratio of 0.85 to 1.15 is within normal variation and requires no
adjustment. A ratio below 0.70 (suspiciously low mileage) warrants disclosure
that the vehicle has accumulated significantly less mileage than typical for
its age, which may indicate storage periods, mechanical issues, or odometer
concerns. A ratio above 1.30 (high mileage relative to age) warrants a note
that the vehicle has accumulated above-average mileage and that mechanical
inspection is particularly important.

Each agent should report its mileage ratio assessment independently. Unanimous
agreement that the ratio is anomalous in either direction is a contributing
signal to the overall confidence score and may trigger escalation per the
escalation triggers protocol.
