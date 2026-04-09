---
name: carbot-megabot-premium-output-standards
description: >
  Defines the exact structure and language standards for a premium CarBot MegaBot
  vehicle output. Models the output against Barrett-Jackson catalog and Hagerty
  Valuation Tools standards. Covers all required sections, language that mechanics
  and collectors trust, and before/after examples of amateur versus specialist
  vehicle description.
when_to_use: "MegaBot scans only. CarBot MegaBot lane."
version: 1.0.0
---

# CarBot MegaBot — Premium Output Standards

## Purpose

The difference between a vehicle listing that commands full asking price and one
that invites lowball offers is almost entirely the quality of information
presented to the buyer. A Barrett-Jackson auction catalog entry for a significant
collector car runs 400 to 600 words and is written by someone who has inspected
the vehicle and researched its history. A Hagerty Valuation Tools report provides
precise condition grading against nationally recognized criteria. Both are trusted
because they are specific, accurate, and honest about what they know and do not
know.

The CarBot MegaBot output should meet this standard. Not in length — the format
is a structured report, not prose catalog copy — but in specificity, accuracy,
and the quality of the decision support it provides to the seller.

---

## The Reference Standards

### Barrett-Jackson Auction Catalog

A Barrett-Jackson catalog entry covers: documented ownership history from new,
numbers-matching status with specific confirmation of block, transmission, and
axle codes, factory option documentation against the window sticker or build
sheet, restoration scope and quality of craftspeople involved, current
mechanical condition at time of consignment, and a narrative that communicates
the vehicle's significance within its production run.

What Barrett-Jackson does not do: it does not hedge. The catalog entry states
what is known with precision and what is not known with equal precision. A
"reported matching numbers" statement in a Barrett-Jackson entry signals that
the matching numbers claim comes from the seller and has not been independently
confirmed. This distinction is respected in the collector community because it
is honest.

### Hagerty Valuation Tools

Hagerty uses four condition grades, each with a specific definition:

Condition 1 (Excellent): Restored to current maximum professional standards in
every area, or a very rare, low-mileage original showing minimal wear. Ready to
show.

Condition 2 (Good): A completely presentable and well-maintained vehicle. Modest
wear appropriate to age. Drives and shows well.

Condition 3 (Fair): A complete and functioning original or lightly restored
vehicle with some wear or defects. Sound, safe transportation.

Condition 4 (Poor): Runs and drives, but requires serious restoration in most
areas. Deferred maintenance apparent.

These four grades produce four corresponding value points. The spread from
Condition 4 to Condition 1 for a desirable collector vehicle can be 3 to 5 times.
Placing a vehicle accurately within these grades requires honest assessment, and
the MegaBot must be capable of making that assessment from available information
or explicitly stating when available information is insufficient to grade.

---

## Required Output Structure

A premium CarBot MegaBot vehicle output contains the following sections in the
following order. Each section has minimum content requirements.

### Section 1: Vehicle Identification

Minimum required fields:
- Year (model year, not calendar year of manufacture if different)
- Make and model (full model name, not abbreviated)
- Trim level or package (confirmed against VIN decode where possible)
- VIN (full 17-character, or pre-1981 format with non-standard notation)
- Exterior color (factory color name and code where known, not generic color)
- Interior color and material (factory designation where known)
- Drivetrain: transmission type (number of speeds, manual or automatic),
  drive configuration (RWD, FWD, AWD, 4WD with engagement type)
- Engine: displacement in cubic inches or liters, configuration, fuel induction
  (carbureted, fuel injected, turbocharged), and factory rated output where known

Identification language standard: Use factory terminology, not generic terms.
Not "V8 engine" but "5.7-liter V-8 with Rochester Quadrajet four-barrel
carburetion." Not "automatic transmission" but "Turbo-Hydramatic 400 three-speed
automatic." This specificity is the first signal to a collector buyer that the
listing warrants serious attention.

### Section 2: Condition Assessment

The condition section contains four sub-sections, each with a numerical score
on a 1-to-10 scale and a one-paragraph written assessment.

Exterior condition: Panel straightness and gap consistency, paint quality and
depth, chrome and brightwork condition, glass condition (chips, cracks, seal
integrity), evidence of prior repair visible under natural light. Score and
paragraph.

Interior condition: Seat material condition (cracking, tears, fading, reupholstery),
dashboard and trim condition (cracks, warping, broken pieces), carpet condition,
headliner condition, all gauges and controls functional or noted as non-functional.
Score and paragraph.

Mechanical condition: Engine starts and runs (or noted as non-running with
explanation), observable fluid leaks, exhaust smoke character, transmission
engagement, brake feel and stopping performance, steering character. Score and
paragraph.

Structural condition: Evidence of prior collision repair, corrosion in structural
areas (frame rails, floor pans, rocker panels, shock towers), undercarriage
general condition. Score and paragraph.

The overall Hagerty condition grade is derived from the lowest of the four sub-
scores, not the average. A vehicle with excellent exterior, interior, and
mechanical condition but significant structural rust is a Condition 3 or 4
vehicle regardless of how good it looks from 10 feet away.

### Section 3: Valuation

The valuation section presents five distinct values, each with a brief rationale:

Private-party value: The price a well-informed private buyer would pay from a
well-informed private seller with adequate time and no urgency on either side.
This is the primary listing price anchor.

Dealer retail value: The price a reputable dealer would ask for the same vehicle
after reconditioning. The ceiling above which private sellers should not price.

Trade-in value: The wholesale value a dealer would offer. The floor below which
a seller should not accept without reason. Useful for understanding the worst-
case exit if the vehicle does not sell privately.

Auction value: The range within which the vehicle would likely hammer at a
quality auction (BaT or regional collector auction) with proper presentation.
Note whether this is above or below private-party value, and why.

Collector or long-term value trend: For vehicles with documented collector
trajectory, a brief assessment of whether values are rising, stable, or
declining relative to 36 months prior, based on Hagerty trend data and BaT
archive analysis.

### Section 4: Selling Strategy

The selling strategy section translates the valuation into action:

Recommended primary platform with fee math: For each recommended platform,
state the platform's fee structure and calculate the seller's net proceeds after
fees at the consensus value. A vehicle worth $18,000 listed on BaT with a 5
percent buyer's premium paid by the buyer and no seller fee is a different
transaction than the same vehicle listed on Facebook Marketplace at $18,000 with
zero fee and a buyer pool of local non-specialists.

Recommended listing price with negotiation buffer: The MegaBot states the
recommended asking price (typically 8 to 12 percent above private-party value
to allow for negotiation without going below value), the minimum acceptable
price (private-party value floor), and the language to use when a buyer makes
a below-floor offer.

Photos required for this vehicle: Specific list of photo angles that are
non-negotiable for this category. Collector vehicles require: all four corners
at 45 degrees, engine bay with documentation of key components, trunk/cargo
area, driver's footwell showing pedals, all four doors open, undercarriage
from both sides, all stampings or trim tags visible, dashboard with odometer.

### Section 5: Ownership Costs

For buyers evaluating the vehicle, and for sellers preparing to answer buyer
questions:

Insurance estimate: Stated as an annual range based on agreed-value collector
policy (for collector vehicles) or standard comprehensive coverage (for daily
drivers). Hagerty or Grundy collector insurance is noted for eligible vehicles.

Fuel cost estimate: Annual fuel cost at 10,000 miles per year using EPA combined
MPG and current regional average fuel price. For EVs, equivalent electricity
cost at 12 cents per kWh.

Maintenance projection: Common maintenance items and their expected cost for
the next 12 months based on vehicle mileage and condition. Not a comprehensive
service schedule, but a realistic "what should the buyer budget for" statement.

### Section 6: Recalls

All open NHTSA safety recalls listed by:
- NHTSA recall number
- Component affected
- Safety risk description in plain language
- Remedy status (available, pending, or parts not yet available)

If zero open recalls: stated explicitly as "No open NHTSA safety recalls as of
scan date."

### Section 7: Modifications Assessment

For each modification identified:
- Description of the modification
- Estimated effect on value: positive, negative, or neutral
- Reversibility: easily reversible, reversible with cost, or permanent
- Disclosure recommendation for buyer communication

Factory-correct vehicles with no modifications: stated explicitly. This is a
positive attribute that should be clearly communicated.

### Section 8: Executive Summary

The executive summary is the final section and is written last. It is 150 to
200 words in plain, warm language that a buyer's first read produces a clear
picture of the vehicle. It states: what the vehicle is, why it matters (for
collector vehicles), what condition it is honestly in, and one or more concrete
selling points the seller should lead with in any conversation.

For seller safety: the executive summary ends with the notation
"LOCAL PICKUP ONLY — Do not ship title or accept payment before vehicle
inspection and in-person exchange." This is a fixed element of every output
regardless of vehicle category.

---

## Language That Mechanics and Collectors Trust

Trusted specialist language is specific, unpretentious, and honest about
limitations. It uses correct terminology without condescension toward the reader.

Trusted: "The 350 cubic-inch small-block carries its original casting numbers
and shows no evidence of rebuild."

Untrusted: "The engine looks really clean and runs great."

Trusted: "Panel gaps at the passenger-side rear quarter are approximately 2mm
wider than the driver's side, consistent with either factory tolerance or a
prior repair. Inspection recommended before purchase if matching body integrity
is a priority."

Untrusted: "There might be some prior damage, hard to tell from photos."

Trusted: "The Muncie four-speed shifts cleanly through all four gears with no
grinding or resistance. Synchros appear to be in good condition. Clutch take-up
is smooth with approximately one inch of free play at the pedal."

Untrusted: "The manual transmission works fine."

---

## Before and After: Amateur Versus Specialist Language

Amateur vehicle description: "1969 Camaro, numbers matching, runs and drives
great, recent tune-up, new tires, very straight body, no rust, a few small
scratches but nothing major, project car potential or drive as is, asking $52,000
firm, serious buyers only."

Problems: No confirmation of what "numbers matching" means or how it was
verified. "Runs great" is meaningless without specifics. No VIN, no engine code,
no transmission identification. No color code. No ownership history. "A few
small scratches" is buyer uncertainty in plain text. "Project car or drive as
is" undercuts any premium positioning. "Serious buyers only" is adversarial.

Specialist equivalent: "1969 Chevrolet Camaro Sport Coupe, VIN [full 17-digit
or GM sequential]. Fathom Green Metallic (code 71) over Black Houndstooth high-
back bucket seats. Factory Turbo-Jet 396 cubic-inch V-8 (block casting 3935440,
date code confirms assembly prior to build date) mated to Muncie M22 Rock Crusher
close-ratio four-speed (dated correctly). Protect-O-Plate documentation present.
Single California ownership from 1969 through 2018, documented by title chain.
No accidents reported on Carfax. Current mileage 64,220 on original odometer.
Small-block scratch on driver's door (2 inches, paint only, no dent) and minor
surface oxidation on front valence. Otherwise solid and straight. Starts
immediately, idles smoothly, all gears engage without noise. Available for
pre-purchase inspection at buyer's request. LOCAL PICKUP ONLY."

The difference between these two descriptions is the difference between a buyer
who negotiates hard because nothing is verified and a buyer who brings a cashier's
check because they already know what they are buying.
