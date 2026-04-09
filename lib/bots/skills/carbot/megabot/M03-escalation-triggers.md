---
name: carbot-megabot-escalation-triggers
description: >
  Defines the seven scenarios in which CarBot's MegaBot lane must recommend a
  professional pre-purchase inspection (PPI). Covers PPI communication strategy
  for sellers, the cost-benefit framework, the 4-agent consensus signal, and the
  honest handoff protocol for high-value vehicles.
when_to_use: "MegaBot scans only. CarBot MegaBot lane."
version: 1.0.0
---

# CarBot MegaBot — Escalation Triggers

## Purpose

AI-powered vehicle valuation is most useful when it knows the limits of what it
can determine remotely. There are scenarios where no combination of photos,
VIN data, seller descriptions, and market comparables can substitute for a
qualified technician examining the vehicle in person. The MegaBot lane must
identify these scenarios quickly and communicate them to the seller with
sufficient explanation that the seller understands the recommendation is in
their financial interest, not a failure of the AI system.

A pre-purchase inspection (PPI) performed before a listing goes live protects
the seller from mid-negotiation discoveries, collapsed deals, and liability
exposure. It also transforms unverifiable seller claims into documented third-
party findings, which consistently improves buyer confidence and realized price.

---

## The Seven Escalation Scenarios

### Scenario 1: Hidden Frame Damage

Frame damage that was repaired after a collision may not be visible in photos
or detectable from a CarFax report if the repair was performed at an independent
shop or across state lines. The MegaBot should flag frame damage risk when any
of the following signals are present:

- CarFax or AutoCheck shows a reportable accident with unknown repair scope
- Photos show misaligned panel gaps, particularly at doors, fenders, or hood
- Seller description mentions a prior owner without providing documentation
- The vehicle is a high-mileage model-year known for accident concealment in
  secondary markets

A properly measured unibody should have consistent gap measurements across
corresponding panels. A professional frame straightening shop or dealer collision
center can produce a written measurement report for approximately $75 to $150.
This document alone can prevent a buyer from using suspected frame damage as
negotiation leverage, saving the seller far more than the inspection cost.

### Scenario 2: Flood History Indicators

Flood damage is among the most consequential undisclosed defects in vehicle
transactions. Salt water in particular causes irreversible corrosion in
electrical harnesses, structural cavities, and under-carpet subfloor panels that
may not manifest as visible problems for 18 to 36 months after the flood event.

The MegaBot should escalate for flood inspection when:

- The vehicle history report shows a gap in registration, ownership transfer, or
  mileage reporting that aligns with known flood events in the vehicle's
  documented geography
- Photos show tide marks, staining, or non-factory undercoating in unexpected
  locations
- The seller's description mentions hurricane, storm, or water damage in any
  context
- The vehicle was titled in a coastal state that experienced major flooding
  within the prior 5 years and was subsequently registered elsewhere

A flood history inspection includes lift-point access to inspect undercarriage
corrosion, removal of kick panels and carpet sections to inspect subfloor, and
electrical connector inspection for corrosion signatures. A qualified technician
can typically complete this inspection in 1.5 to 2 hours.

### Scenario 3: Odometer Rollback Suspicion

Digital odometers are substantially harder to roll back than their analog
predecessors, but rollback fraud persists in markets with weak title oversight
and in vehicles that have passed through multiple private-party transactions in
a short period. The MegaBot should flag rollback suspicion when:

- Mileage progression across service records or inspection history is
  inconsistent with the current odometer reading
- The vehicle's wear condition (pedal rubber, steering wheel leather, seat
  bolster wear, interior trim wear) is inconsistent with the claimed mileage
- The vehicle has passed through more than two private-party transactions within
  24 months without dealer involvement
- NHTSA VIN decode or state DMV records show a mileage discrepancy flag

Rollback fraud is a criminal offense in every US state, and a seller who is
unaware of rollback on a vehicle they acquired in good faith is nonetheless
exposed to legal liability upon resale. Independent confirmation of mileage
authenticity protects both seller and buyer.

### Scenario 4: Title Brand Uncertainty

Branded titles — salvage, rebuilt, flood, lemon, odometer rollback — can reduce
vehicle value by 20 to 60 percent depending on the brand and the vehicle
category. The MegaBot must flag title brand uncertainty when:

- The seller reports the title is "clean" but cannot produce the physical title
  for verification
- The vehicle history report shows the vehicle was registered in a state with
  known title-washing history (certain states issue clean titles to vehicles
  branded in other states after a clean registration period)
- The vehicle was purchased at a salvage auction and the seller's documentation
  of the rebuild process is incomplete or unverifiable

Title brand issues are not always disqualifying, particularly for a correctly
documented rebuild. But undisclosed title brands expose the seller to fraud
liability, and the MegaBot must ensure sellers understand that full disclosure
and proper documentation is a legal requirement, not a negotiation option.

### Scenario 5: Mechanical Noise on Test Drive

When a seller's description includes any of the following, the MegaBot must
recommend a PPI before listing:

- Knocking, ticking, or rattling at idle or under load
- Transmission slipping, hesitation, or hard shifting
- Brake pulsation, grinding, or excessive pedal travel
- Suspension noise over bumps, steering vagueness, or pull to one side
- Coolant loss without visible source, overheating history, or white exhaust
  smoke under any operating condition

Listing a vehicle with known mechanical issues without a PPI is the fastest
path to a deal falling apart. A buyer's mechanic will find the issue during
their own inspection. The seller is then negotiating from a position of
documented weakness with a buyer who knows the seller is motivated. A pre-listing
PPI converts an unknown liability into a known cost the seller can address or
disclose with documentation, both of which produce better outcomes than surprise
discovery.

### Scenario 6: Salvage Rebuild Quality Questions

A vehicle rebuilt from salvage can be safe, roadworthy, and a genuine value for
the right buyer — but only if the rebuild quality is verifiable. The MegaBot
must escalate for a rebuild quality inspection when:

- The title is branded as rebuilt, reconstructed, or prior salvage
- The seller cannot produce documentation of the parts used in the rebuild,
  the shop that performed the rebuild, or the state inspection that cleared
  the vehicle for road use
- Photos show evidence of mismatched paint, non-factory fasteners, or body
  panel repairs that do not match the reported damage scope

A thorough rebuild quality inspection is typically 2 to 3 hours at a body shop
familiar with insurance repair standards. The inspector should document: OEM
versus aftermarket parts used, structural repair scope and method, airbag and
safety system status, and current vehicle alignment. Without this documentation,
a seller of a rebuilt vehicle has no credible response to a buyer's lowball offer.

### Scenario 7: EV Battery Degradation Below Threshold

Electric vehicle battery packs represent 30 to 45 percent of total vehicle value
in many segments. A battery that has degraded to 80 percent of its rated capacity
is not the same product as a battery at 95 percent, and the price difference is
material. The MegaBot must escalate for battery health verification when:

- The seller's reported range at full charge is more than 12 percent below the
  EPA-rated range for that model year and configuration
- The vehicle has more than 80,000 miles and the seller has not provided a
  battery health report from the manufacturer's diagnostic tool
- The vehicle history suggests sustained high-frequency DC fast charging

Most EV manufacturers can produce a battery state-of-health report from an
authorized service center in under an hour. For a vehicle where battery condition
is the primary value driver, this is the most important single document in the
listing package.

---

## Communicating the PPI Recommendation to Sellers

The MegaBot's PPI recommendation must not be delivered as a warning or a
negative finding. It should be framed as strategic advice in the seller's
financial interest. The following communication structure is recommended:

First, state the specific concern in plain language. Name the scenario and
explain why it matters to a buyer. Second, quantify the cost of the inspection
relative to the likely benefit. A $200 PPI on a $15,000 vehicle that prevents
a $2,000 negotiated price reduction has a 10-to-1 return. Third, explain what
the PPI produces: a written report from a qualified third party that the seller
can provide to buyers, which substitutes documented fact for buyer uncertainty.

Buyer uncertainty is the primary driver of negotiated price reductions. Every
dollar of documented certainty the seller can provide reduces the buyer's
justification for negotiating downward.

---

## When 4-Agent Disagreement Signals Inspection Need

When Gemini, Claude, OpenAI, and Grok cannot reach consensus on vehicle
condition or value — specifically when they diverge by more than 25 percent
after source weighting — the disagreement itself is a signal that available
data is insufficient for responsible pricing. In this scenario, the MegaBot
should state explicitly that the AI system has reached its data limits and
that a professional inspection is the appropriate next step before a price
is published to buyers.

This is not a failure mode. It is the honest output of a system that understands
what it can and cannot determine remotely.

---

## The Honest Handoff for Vehicles Over $25,000

For any vehicle where the MegaBot consensus value exceeds $25,000, the MegaBot
output should include a dedicated section advising the seller to consider:

- A pre-listing PPI regardless of known issues
- Independent appraisal documentation from a recognized appraiser for collector
  vehicles
- Proper disclosure documentation for any known condition issues

At this value threshold, buyer due diligence is intense. A seller who proactively
documents the vehicle's condition and history before listing is in a fundamentally
stronger negotiating position than one who waits for buyer discovery to drive the
conversation.

The honest handoff acknowledges that LegacyLoop's CarBot MegaBot provides the
best remote assessment available, and that the next level of certainty requires
a qualified human with the vehicle in hand.
