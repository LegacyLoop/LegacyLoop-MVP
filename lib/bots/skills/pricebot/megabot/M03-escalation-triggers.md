---
name: pricebot-megabot-escalation-triggers
description: >
  Defines when MegaBot PriceBot must escalate beyond a standard
  consensus valuation and recommend specialist channels or human
  review. Covers high-value thresholds, rarity triggers, category-
  signal mismatches with AnalyzeBot and PhotoBot, auction-grade
  item detection, and the specific conditions that dampen
  confidence or block publication of a final price.
when_to_use: "MegaBot scans only. PriceBot MegaBot lane."
version: 1.0.0
---

# PriceBot MegaBot Skill: Escalation Triggers

## Purpose

MegaBot PriceBot is the most capable pricing engine in the system.
It is not infallible. Recognizing the conditions under which a
confident number is the wrong output — and instead returning a
range, a flag, or an escalation recommendation — is what separates
a specialist from an amateur. An automated pricer that returns a
number for everything is a pricer that is wrong on the highest-
stakes items. This skill defines when to escalate, how to present
the escalation, and what the seller's options are.

---

## The $500 Comp-Density Threshold

For items where the consensus-band midpoint exceeds $500 retail
equivalent, the methodology tightens.

### Comp-density requirement

Minimum 3 comps in the target condition tier, within the last 180
days, from Tier 1 or Tier 2 sources. If the comp density does not
meet this threshold:

- Widen the confidence band explicitly
- State in the executive summary that comp density is thin
- Recommend the seller obtain a specialist appraisal before
  listing high-value items at a firm price

A seller who lists a $1,200 item with only one comp to support the
price is vulnerable to either leaving money on the table or pricing
above market and sitting. Both are expensive failures. Thin comp
density + high value = mandatory disclosure.

### The $2,500 auction-grade threshold

Above $2,500 retail equivalent, comp evidence alone is often
insufficient. Items in this band typically have thin comp density
by structural reason (they sell rarely), and pricing decisions can
shift tens of thousands of dollars based on small interpretation
differences.

At this threshold, recommend:

1. Auction consignment if the item has category-auction history
2. Specialist dealer appraisal if the item has dealer-market
   parallels
3. Independent certified appraisal if the item has insurance or
   estate-reporting implications

The 4-AI team can still produce a number at this level, but the
number should be presented as a research estimate with an explicit
"before transacting at this level, obtain independent specialist
validation" disclaimer.

---

## Rarity Triggers

Rarity + demand = premium pricing. Rarity + ambiguity = escalation.

### The fewer-than-5-comps rule

When fewer than 5 comparable transactions exist globally across all
Tier 1 through Tier 3 sources in the last 24 months, the item is
rare enough that standard comp-set pricing is unreliable. Escalate.

Specifically:
- Route to AntiqueBot deep-dive path if antique/decorative arts
- Route to CollectiblesBot deep-dive if graded/collector category
- Flag for specialist dealer contact if neither of the above

The purpose of the route is not to produce a better number
autonomously — it is to surface the item's specialist context so
the seller can decide how to proceed.

### The single-comp trap

A single comp is not a price. It is one data point. If MegaBot's
comp set contains exactly one comparable transaction, the output
must:

- Cite the single comp specifically (platform, date, price,
  condition)
- Widen the price band to ±35 percent of that comp
- State explicitly that one comp is an unreliable anchor
- Recommend obtaining additional market evidence before listing

Never present a single-comp price as if it were a market-clearing
price.

### Production-number rarity

For categories where production numbers are published or
derivable (limited-edition runs, signed works, numbered
collector pieces), extreme rarity creates a qualitatively
different market. An item from a run of 50 sells differently
than one from a run of 5,000.

Production count thresholds:
- Under 100: auction-grade territory, always escalate
- 100 to 1,000: specialist market, widen band, recommend
  auction or specialist dealer consultation
- 1,000 to 10,000: standard specialist pricing applies
- 10,000+: standard category pricing applies

---

## Category-Signal Mismatch with AnalyzeBot

The MegaBot lane runs PriceBot after AnalyzeBot. If AnalyzeBot
classified the item as category X but PriceBot's comp search returns
results only for category Y, something is wrong.

### The mismatch cases

- AnalyzeBot said "Victorian oak dresser" but comps return for
  mid-century oak dresser → era misidentification, flag for review
- AnalyzeBot said "Gibson Les Paul" but comps return for Epiphone
  Les Paul → brand misidentification, flag for review (Gibson and
  Epiphone are separate markets at very different price points)
- AnalyzeBot said "Tiffany lamp" but comps return for Tiffany-style
  lamp → attribution vs. style confusion, ALWAYS escalate
  (attributed Tiffany can be 50× the price of Tiffany-style)

### The response to mismatch

- Lower confidence by 20 percent automatically
- State the mismatch in the executive summary
- Recommend the seller verify the identification before listing
- Do not publish a single firm price across the mismatched categories

### The worked Tiffany case

AnalyzeBot confident: "Authentic Tiffany Studios lamp, bronze base,
favrile glass shade, c. 1905."

PriceBot comp search: Returns results for "Tiffany-style lamp" at
$200 to $600, and for "attributed Tiffany Studios" at $3,500 to
$45,000.

The 4-AI team does NOT average. It escalates:

"AnalyzeBot classified this as an authentic Tiffany Studios piece,
which would place it in the $3,500 to $45,000 specialist auction
range. Our comp search returned mixed results — most items matching
this description are Tiffany-style reproductions in the $200 to
$600 range. Before listing, obtain independent authentication from
a Tiffany Studios specialist. Misidentification in either direction
carries significant financial consequence."

---

## PhotoBot Condition-Signal Contradiction

When PhotoBot's photo-evidenced condition score disagrees with the
AI condition score by more than 2 points (out of 10), the comp set
no longer cleanly maps to the item.

### The contradiction cases

- AI condition 8/10 (from seller text) but PhotoBot 5/10 (from
  photos) → photos reveal issues seller did not disclose. Price
  at photo-evidenced condition.
- AI condition 5/10 but PhotoBot 8/10 → seller is underselling
  condition (often inexperience). Price at higher end, note for
  seller: "Your photos suggest better condition than your
  description — consider updating your condition rating."

### The dampener

A condition mismatch of 2 points or more dampens pricing confidence
by 15 percent. The pricing recommendation should target the
photo-evidenced condition, not the AI condition, because photos are
what the buyer will see.

---

## Auction-Grade Item Detection

Some items do not belong in online listings at all. They belong
in auction houses or private specialist sale.

### Auction-grade signals

- Comps appear in Christie's, Sotheby's, Heritage, Bonhams,
  Skinner, or other credentialed auction catalogs
- Seller mentions provenance that matches named collections
  historically auctioned
- Estimated value exceeds $10,000
- Category has established specialist auction coverage (fine art,
  jewelry, watches, coins, rare books, fine wine, vintage cars,
  antique firearms)

### The recommendation format

When auction-grade signals are present, the output must include:

1. A standard comp-based estimate (what the item would fetch in
   standard online listings if sold that way)
2. An auction-grade estimate (what the item would likely achieve
   at a credentialed auction, including buyer's-premium impact)
3. The difference between the two, quantified, as the cost of
   not using the appropriate channel
4. A specific recommendation: "Consign to specialist auction" with
   category-specific auction house suggestions

Sellers who are unaware they have auction-grade items frequently
undersell them by 40 to 70 percent through standard online
channels. Making the auction-grade path visible is the single
highest-leverage output MegaBot can produce.

---

## Musical Instruments: Vintage and Pre-1980

Pre-1980 vintage instruments have a specialist market that
standard eBay pricing does not reach.

### Vintage escalation triggers

- Pre-1980 guitars with original finish and components
- Pre-1970 amplifiers with original transformers and speakers
- Pre-1960 brass instruments by named makers
- Any instrument with documented celebrity/studio provenance

For these, route to specialist dealer or auction consultation.
Reverb's vintage section is the primary online market, but for
high-value vintage (>$5,000), direct specialist contact typically
outperforms open-market listing.

### The "no-comp" rare vintage case

When a vintage instrument returns zero comps across all sources:

- Flag as specialist-only market
- Provide category-general pricing band with explicit low-confidence
  note
- Recommend direct specialist-dealer appraisal before any listing
  action

Examples: bespoke luthier-built instruments, pre-war prototypes,
regional custom orders with no catalog record.

---

## Antique Escalation

When is_antique is true and estimated_age_years exceeds 100, the
standard comp methodology may miss provenance-driven premium.

### The provenance trigger

If AntiqueBot (or the shared antique analyzer) has identified:

- Named maker with documented workshop history
- Period-specific construction evidence (dovetails, pegs, nails
  consistent with era)
- Provenance documentation of any kind (oral, receipts, photos,
  institutional records)

Escalate to AntiqueBot's provenance multiplier methodology (see
AntiqueBot M04). The standard PriceBot comp-based band becomes
the floor; the provenance-multiplied estimate becomes the
recommended price range.

### The legally-sensitive category trigger

Some antique categories carry legal disclosure or sale
restrictions:

- Ivory (federal and state restrictions)
- Migratory bird parts (Migratory Bird Treaty Act)
- Native American sacred or grave objects (NAGPRA)
- WWII-era items from continental Europe (potential cultural
  property claims)
- Firearms (state and federal regulations)

For any item potentially in these categories, escalate with a
disclosure flag: "This item may fall within a regulated category.
Before listing, verify compliance with applicable laws."

---

## How Escalation Is Communicated

Escalation recommendations are not failures. They are specialist
service elevation. The framing matters.

### Correct framing

"This item shows characteristics that position it above standard
online listing channels. Here is what that means for your expected
outcome, timeline, and next steps."

Followed by:
- The specific signals that triggered the escalation
- The channel recommendation with logic
- Realistic timeline and commission-inclusive expected net proceeds
- What the seller does next, with named contact-category suggestions

### Incorrect framing

"Our AI cannot reliably price this item."

The seller hears this as system failure. The correct framing
positions escalation as elevated service: more resources applied
to the situation, not fewer.
