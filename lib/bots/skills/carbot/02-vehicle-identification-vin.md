---
name: vehicle-identification-vin
description: How to decode VINs, extract trim/generation/engine codes, identify year from VIN position 10, and use NHTSA vPIC to cross-reference seller claims. Also where VINs hide on each vehicle type.
when_to_use: Every CarBot scan. VIN decoding is the first diagnostic — it resolves make/model/year ambiguity and catches seller errors.
version: 1.0.0
---

# VIN Decoding — The Universal Vehicle Identifier

A Vehicle Identification Number is the 17-character fingerprint stamped on every vehicle built after 1981. It encodes the manufacturer, year, plant, engine, body style, and a unique sequence. Decoding the VIN is the first thing CarBot does — before pricing, before condition, before comps. The VIN resolves ambiguity that photos alone cannot.

## The 17-Character Structure

| Positions | Field | Example |
|---|---|---|
| 1-3 | World Manufacturer Identifier (WMI) | "1FT" = Ford Truck USA |
| 4-8 | Vehicle Descriptor Section (VDS) — model, body, engine, trim | "W1EM5" |
| 9 | Check digit (math verification) | "5" |
| 10 | Model year | See table below |
| 11 | Assembly plant | "D" = Ontario |
| 12-17 | Sequential production number | "123456" |

## Model Year From Position 10 (Critical Table)

The 10th character is the year code, but it cycles every 30 years. Rule of thumb: if you know the rough era (pre-2000 vs post-2000) you can pin the year exactly.

| Code | Year (first cycle) | Year (second cycle) |
|---|---|---|
| A | 1980 | 2010 |
| B | 1981 | 2011 |
| C | 1982 | 2012 |
| D | 1983 | 2013 |
| E | 1984 | 2014 |
| F | 1985 | 2015 |
| G | 1986 | 2016 |
| H | 1987 | 2017 |
| J | 1988 | 2018 |
| K | 1989 | 2019 |
| L | 1990 | 2020 |
| M | 1991 | 2021 |
| N | 1992 | 2022 |
| P | 1993 | 2023 |
| R | 1994 | 2024 |
| S | 1995 | 2025 |
| T | 1996 | 2026 |
| V | 1997 | — |
| W | 1998 | — |
| X | 1999 | — |
| Y | 2000 | — |
| 1 | 2001 | — |
| 2 | 2002 | — |
| 3 | 2003 | — |
| 4 | 2004 | — |
| 5 | 2005 | — |
| 6 | 2006 | — |
| 7 | 2007 | — |
| 8 | 2008 | — |
| 9 | 2009 | — |

Note: letters I, O, Q, U, and Z are never used to avoid confusion with digits. The cycle skips them.

## Where VINs Hide

VINs appear in multiple places on every vehicle. The primary VIN plate (visible through the windshield) should match all secondary locations. Mismatch = red flag for title swap or salvage rebuild.

- **Dash plate** — lower driver-side windshield, visible from outside
- **Door jamb sticker** — driver door B-pillar (federal certification label, matches VIN + production date + tire pressure)
- **Firewall stamp** — some vehicles have a stamped VIN on the engine bay firewall
- **Frame rail** — stamped into the frame on trucks and classic cars (most resistant to tampering)
- **Engine block** — partial VIN stamped on the block for matching-numbers verification
- **Transmission housing** — partial VIN on modern vehicles
- **Title + registration** — paperwork VIN must match all physical VINs

Any mismatch between dash plate and door jamb sticker is a fraud flag. Call it out explicitly.

## NHTSA vPIC API (Already Wired)

CarBot already has an NHTSA VIN decoder hook that runs against the free public API at nhtsa.dot.gov/vin. This returns:
- Make, Model, Year (cross-verified against position 10)
- Body Class, Drive Type, Transmission Style
- Engine displacement, cylinder count, fuel type
- Plant City, Plant State
- Manufacturer name
- Brake system type, airbag locations
- Safety features (ABS, ESC, TPMS)

Use the decoded NHTSA data as the authoritative record. If the seller says "2012 F-150" but the VIN decodes to "2011 F-150," trust the VIN.

## When The VIN Does Not Exist

Pre-1981 vehicles have shorter, inconsistent identifiers. For those, use:
- **Engine number** stamped on the block (matches the title on many 1950s-1970s cars)
- **Body tag** or **cowl tag** (GM vehicles 1960s-1970s)
- **Build sheet** tucked into the seat springs (some Mopar and Ford factory cars)
- **Fisher Body tag** (GM)
- **Door tag** or **door jamb plate** for European classics (BMW, Mercedes, Jaguar)

Classic car VINs may be 7, 9, 11, or 13 characters depending on year and manufacturer. Do not reject them as "too short" — they are just older systems.

## Partial VIN From Photos

Even a partial VIN is valuable. The prompt already asks Gemini/OpenAI to extract any visible VIN from photos, even if only 8-12 characters are readable. Partial VINs can:
- Confirm model year (position 10 alone resolves to a year)
- Confirm make via WMI (positions 1-3)
- Cross-check the seller's claimed year/make
- Flag obvious mismatches (VIN says "1G1" Chevy, seller says "Ford")

Populate `identification.vin_from_photo` with whatever is visible. Never refuse to populate it because the full 17 is not available.

## Output

Populate `identification.vin_decoded` with the NHTSA response if available. Populate `identification.vin_from_photo` with any partial VIN extracted. In `value_reasoning`, cite VIN-confirmed fields ("VIN confirms 2013 production year and 3.5L EcoBoost engine"). Flag any mismatch between seller claims and VIN decode as a MODERATE red flag.
