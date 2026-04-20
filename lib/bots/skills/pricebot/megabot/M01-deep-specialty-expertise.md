---
name: pricebot-megabot-deep-specialty-expertise
description: >
  Specialist pricing methodology for the 4-AI parallel pricing team.
  Covers comparable-sales selection, condition-based pricing curves,
  rarity premium math, liquidation theory across multiple time
  horizons, and appraisal-grade pricing standards. Includes seven
  domain archetypes (musical instruments, collectibles, vehicles,
  antiques, jewelry, household goods, power equipment) with worked
  examples. Musical-instrument archetype is the canonical test fixture.
when_to_use: "MegaBot scans only. PriceBot MegaBot lane."
version: 1.0.0
---

# PriceBot MegaBot Skill: Deep Specialty Expertise

## Purpose

When PriceBot operates inside the MegaBot lane, four AI models run
pricing analysis in parallel against the same item, the same comp
set, and the same seller context. The output is not an averaged
number — it is a synthesized specialist valuation. The quality
difference between an averaged number and a synthesized valuation
is the difference between a guess and a price a dealer would defend.

This skill defines the pricing methodology the 4-AI team uses.
Comparable selection, condition curves, rarity premiums, liquidation
horizons, and appraisal-grade thresholds — the methodology that
separates a market-clearing price from a wish price.

---

## Comparable-Sales Methodology

A comp is only as good as the similarity of the transaction to the
item in hand. The 4-AI team applies a strict selection framework.

### Selection criteria, in priority order

1. **Same make and same model.** A 2008 Dean MLX in Transparent Red
   is not comparable to a 2008 Dean Vendetta. Same manufacturer,
   same family — not the same model. Price data cannot be averaged
   across model lines without losing meaning.

2. **Same condition tier.** Condition 7/10 comps anchor a 7/10
   item. A comp in 9/10 condition is a ceiling reference, not a
   midpoint. A comp in 4/10 condition is a floor reference.

3. **Same era and same variant.** Pre-1980 and post-1980 are
   different markets for nearly every category. Trim packages,
   finish variants, and limited runs each have independent price
   curves. Do not merge them.

4. **Documented sold, not asking.** A sold auction result is a
   transaction. An active listing is an aspiration. The 4-AI team
   weights sold data at full strength and asking data at roughly
   60 percent of sold weight, never higher.

### Outlier rejection

A comp set with eight transactions from the last ninety days, seven
clustered within a $200 band and one $1,800 above the cluster, is
not a bimodal market. It is a cluster with one outlier. Outliers
are flagged, investigated (auction-house hammer, celebrity estate
provenance, buyer-error overbid), and excluded from the median
calculation unless the investigation reveals a structural reason
the item in hand would command the same premium.

### Minimum comp count for confidence

- 5+ recent comps at target condition tier: high confidence
- 3 to 4 comps: moderate confidence, wider band
- 1 to 2 comps: low confidence, explicit uncertainty language
- 0 comps: escalation trigger (see M03)

---

## Condition-Based Pricing Curves

The condition score (1 to 10) maps to a pricing multiplier, but
the curve is not linear. It is category-specific.

### Standard categories (furniture, tools, appliances)

- 10/10 — Mint, museum-grade, unused: 1.20× midpoint
- 8 to 9 — Excellent, used lightly: 1.00× midpoint
- 6 to 7 — Good, honest wear: 0.78× midpoint
- 4 to 5 — Fair, functional with flaws: 0.55× midpoint
- 1 to 3 — Poor, parts-only or restoration candidate: 0.25× midpoint

### Collector categories (musical instruments, watches, vintage electronics)

Condition curves in collector categories are steeper at the top.
A mint-condition vintage Les Paul is not 20 percent more than an
excellent one — it can be 60 to 100 percent more because collector
buyers will pay a significant premium for unmolested originality.

- 10/10 — All original, factory finish, case candy: 1.60 to 2.00×
- 8 to 9 — Original, some honest use: 1.00×
- 6 to 7 — Player grade, all functional: 0.72×
- 4 to 5 — Modified or refinished: 0.50×
- 1 to 3 — Heavy modifications, parts guitar: 0.30×

### Antique categories (pre-1950 furniture, decorative arts)

Antique condition curves are flatter because period patina is
itself a value signal. A refinished Stickley chair can be worth
half of an untouched one, so a 10/10 "refinished to factory" is
often a dampener, not an amplifier. The curve must reward
original surface.

---

## Rarity Premium Math

Rarity by itself is not a price signal. Rarity combined with
demand is the price signal. A rare item no one wants is cheap.
A rare item collectors compete for is premium.

### The rarity-demand matrix

- High rarity + high demand: premium 40 to 200 percent above
  common-condition baseline. Auction-grade territory.
- High rarity + moderate demand: premium 15 to 40 percent.
  Specialist-dealer territory.
- High rarity + low demand: no premium. Price at common-condition
  baseline. Rarity is a story, not a multiplier, without buyers.
- Moderate rarity + high demand: premium 10 to 25 percent. This
  is the most common "sleeper" zone — comps exist but are thin.
- Common rarity + any demand: no rarity premium. Category baseline.

### Collector-market rarity signals

- Production number below 2,000 units
- Single-year or short-run variants
- Discontinued before the category matured (pre-cataloguing era)
- Limited regional distribution (factory-direct from specific
  dealers, never mass-distributed)
- Artist or designer association (signed, attributed, documented)

A Dean MLX ML-style from the 2008 reissue run is moderate rarity
with sustained demand among Dimebag Darrell fans — premium zone,
not auction-grade, but clearly above common-condition baseline.

---

## Liquidation Theory: Price Decay Over Time

Liquidation pricing is the discount a seller accepts to convert an
item to cash within a defined window. The 4-AI team returns four
time-horizon prices for every item above a defined threshold.

- **Day 1 price** — The price at which a dealer would buy the item
  today for resale. Typically 50 to 65 percent of retail for
  standard categories; 40 to 55 percent for specialist categories
  where dealer margin must cover auction or private-sale commission.

- **Day 7 price** — The price at which the item clears through a
  fast-moving local channel (Facebook Marketplace, local classifieds,
  garage sale). Typically 70 to 80 percent of retail.

- **Day 30 price** — The price at which the item clears through a
  national online listing at fair market value. Typically 90 to 100
  percent of retail, depending on demand velocity.

- **Day 90 price** — The price a patient seller can achieve through
  specialist channels (auction consignment, collector outreach,
  targeted private sale). Typically 100 to 130 percent of online
  retail for items that belong in specialist channels.

### Why four horizons and not one

A seller deciding between a dealer offer today and an auction
consignment ninety days out needs both numbers to make the decision
rationally. The 4-AI team never presents only one — a responsible
pricing report shows the tradeoff.

---

## Appraisal-Grade Standards

Some prices require auction-level evidence. Others are fine with
comp-set evidence. The threshold is item value and buyer
sophistication.

### When comp-set evidence is sufficient

- Items priced below $500 retail equivalent
- Common categories with dense transaction data
- Buyer pool is casual or non-specialist
- No insurance or estate reporting obligations

### When auction-grade evidence is required

- Items priced above $2,500 retail equivalent
- Rare or historically significant pieces
- Buyer pool is institutional or specialist
- Insurance scheduling, estate tax reporting, or litigation support
- Any situation where the price may be challenged by a third party

Auction-grade evidence means: published auction results, catalogued
comparable sales with documented condition, dealer asking prices
from credentialed sources, and where available, published scholarly
references. Online marketplace asking prices alone do not meet the
standard.

---

## Seven Domain Archetypes

Every item maps to one of seven pricing archetypes. The archetype
determines which methodology components get the most weight.

### 1. Musical Instruments (THE TEST FIXTURE)

The Dean guitar is the canonical test case. Musical-instrument
pricing follows these rules:

- **Reverb sold data** is the primary comp source — highest signal
  density, most category-native buyer pool.
- **eBay sold** is the secondary comp source for mass-market models.
- **Facebook Marketplace local** anchors the LOCAL_PICKUP case —
  local buyers on musical instruments are typically players, not
  collectors, and price at the floor of the band.
- **Originality weighting is steep.** All-original case candy + hang
  tags can add 40 to 80 percent to the base price of a reissue.
  A refinished body halves the price of a vintage piece.
- **Pickup era matters.** A 2008 MLX with original PAF-style
  pickups is a different animal from the same shell with swapped
  actives. Price accordingly.
- **Maine LOCAL_PICKUP** — rural market haircut 10 to 20 percent
  vs. national Reverb median. No Nashville reference in narrative.

### 2. Collectibles (trading cards, coins, stamps, memorabilia)

- Graded > raw. PSA 10 is a different market from PSA 9, which is
  a different market from raw. Never average across grades.
- Population reports drive rarity pricing. Look up PSA/CGC/BGS
  census data before pricing graded items.
- Sports/celebrity/event provenance materially shifts value —
  verify and cite.

### 3. Vehicles (VIN-decoded; handled by CarBot but PriceBot may
   cross-reference)

- Mileage ratio to category benchmark is the primary adjuster.
- Title status (clean, rebuilt, salvage) creates separate markets.
- Regional demand varies significantly — pickup trucks in rural
  zones command local premium over urban comps.

### 4. Antiques (pre-1950 furniture, decorative arts, silver, china)

- Original surface > refinished. Always.
- Maker mark, signature, label: premium driver.
- Provenance documentation can multiply value 15 to 60 percent
  (see AntiqueBot M04 for full multiplier table).
- Auction-house comps anchor the top of the band.

### 5. Jewelry (precious metals, gemstones, designer pieces)

- Melt value is the floor. Never price below melt.
- Hallmark identification is mandatory before pricing.
- Designer and house provenance (Cartier, Tiffany, David Yurman)
  creates separate markets — pricing is brand-driven, not
  material-driven.
- GIA/AGS grading reports on stones shift pricing significantly.

### 6. Household Goods (commoditized furniture, kitchen, linens)

- Price to move. Day 7 to Day 30 horizons dominate.
- Local pickup is primary channel — shipping rarely economic.
- Condition floor steeper: flaws visible in photos cut price 40 to 60
  percent even on recent retail.

### 7. Power Equipment (mowers, chainsaws, generators, snowblowers)

- Seasonal pricing matters. Snowblowers in October command 30 to
  50 percent more than in May.
- Brand matters: Stihl, Honda, Echo command 25 to 40 percent
  premium over house brands at equivalent condition.
- Running condition is binary — won't start cuts price to parts-
  value (typically 20 to 30 percent of running equivalent).

---

## Synthesis: What the 4-AI Team Actually Produces

After each model runs independently against the same comp set and
seller context, the synthesis layer selects elements from each:

- **OpenAI** — structural completeness (all schema fields populated)
- **Claude** — specialist narrative (executive_summary, rationale)
- **Gemini** — current search and demand signals
- **Grok** — cultural/trend-adjusted demand pressure

A price that all four models converge on within 10 percent is a
high-confidence price. Disagreement above 25 percent is a signal
that the comp set is ambiguous or the item is multi-category.
Treat disagreement as data, not noise.
