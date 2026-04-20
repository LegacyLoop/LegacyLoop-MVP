---
name: pricebot-megabot-premium-output-standards
description: >
  Defines the premium MegaBot PriceBot output package. Specifies
  required fields across the MEGA_PRICING schema — price_validation,
  8-platform platform_pricing with fees and seller_net, price_history
  with 2-5yr trend and investment_grade flag, international_pricing
  for qualified items, insurance_value, liquidation_value,
  collector_premium, wholesale_vs_retail, liquidation_timeline with
  day 1/7/30/90 prices, negotiation_guide, 5-12 comparable_sales
  entries, regional_pricing with best_market and ship_vs_local_verdict,
  and a 6-8 sentence executive_summary. Includes a full Dean guitar
  LOCAL_PICKUP worked output and a before/after contrast showing
  amateur vs. specialist pricing language.
when_to_use: "MegaBot scans only. PriceBot MegaBot lane."
version: 1.0.0
---

# PriceBot MegaBot Skill: Premium Output Standards

## Purpose

A MegaBot PriceBot output is a specialist pricing report. It is not
a price estimate. It is the document a seller shows to an auction
house, a dealer partner, or an insurance adjuster as evidence that
the item has been properly valued. The difference between a generic
AI pricing response and a specialist report is what this skill
defines — specific fields, specific content standards, specific
presentation rules — so every output from the 4-AI team meets a
uniform premium bar.

---

## The Full MegaBot PriceBot Output Package

Every MegaBot PriceBot output populates the full MEGA_PRICING
schema. Partial outputs are incomplete and must not be returned as
final. The required fields and their content standards:

### 1. price_validation

Contains: `agrees_with_initial_estimate` (boolean),
`revised_low`, `revised_mid`, `revised_high` (numbers),
`revision_reasoning` (string).

The validation block reports whether the MegaBot-tier comp research
confirms or revises the AnalyzeBot estimate. Every scan produces
one of three outcomes:

- Confirmed (agrees_with_initial_estimate: true, minimal revision)
- Refined (agrees_with_initial_estimate: true, tightened band with
  specific reasoning)
- Challenged (agrees_with_initial_estimate: false, materially
  different revised band with evidence-based reasoning)

The revision_reasoning is not decorative. It cites specific comp
evidence: "Six Reverb sold comps in the last 75 days median $425,
supporting a tighter band around $400 to $450 rather than the
initial $350 to $500 range."

### 2. comparable_sales (5 to 12 entries)

Each entry contains: `platform`, `item_description`, `sold_price`,
`sold_date`, `condition_compared` (Better/Similar/Worse), `relevance`
(High/Medium/Low), `notes`.

Content requirements:

- Minimum 5 entries. 12 is ceiling. Quality over quantity.
- Each entry must describe a specific transaction, not a category
  range.
- Dates must be within last 24 months. Older dates require explicit
  note in the notes field.
- condition_compared is relative to the target item, not absolute.
- relevance rating reflects how tightly the comp maps to the target
  (same model + same condition + recent = High).

Example entry format:
```
{
  "platform": "Reverb",
  "item_description": "2008 Dean MLX Transparent Red, player grade,
   all original hardware, case included",
  "sold_price": 445,
  "sold_date": "2026-03-12",
  "condition_compared": "Similar",
  "relevance": "High",
  "notes": "Near-identical configuration to target item. Slight
   fret wear. Original case present. Closed quickly — 4 days on
   market."
}
```

### 3. platform_pricing (8 platforms mandatory)

Required platforms, each with a full sub-object:

- ebay
- facebook_marketplace
- etsy
- craigslist
- mercari
- offerup
- poshmark (or reverb if category is musical instruments)
- auction_house (for items above $1,000 threshold)

Each platform sub-object contains:
- `list_price` (number)
- `expected_sell` (number — realistic clearing price after
  negotiation)
- `fees_pct` (number — platform fee percentage)
- `seller_net` (number — take-home after fees)
- `days_to_sell` (number — realistic estimate)
- `tips` (string — platform-specific listing guidance)

Plus `best_platform` (string with reasoning).

The seller must see every platform side-by-side to make the
right channel decision. Returning only "best platform" without
the full table leaves the seller unable to evaluate alternatives.

### 4. market_analysis

Contains: `demand_level` (Hot/Strong/Moderate/Weak/Dead),
`demand_trend` (Rising/Stable/Declining), `supply_level`
(Scarce/Low/Moderate/Saturated), `seasonal_factors` (string),
`category_health` (string).

Each field is required. A seller who sees "demand: moderate,
trend: declining, supply: saturated" has different information
than one who sees "demand: strong, trend: rising, supply: low"
— even at the same price. The 4-AI team reports all four fields
always.

### 5. regional_pricing

Contains:
- `local_estimate` with `low`, `mid`, `high`, `reasoning`
- `national_estimate` with `low`, `mid`, `high`
- `best_market` with `city`, `state`, `price`, `why`
- `ship_vs_local_verdict` (string)

For LOCAL_PICKUP items, the local_estimate and ship_vs_local_verdict
are the primary outputs. best_market may be populated but must not
contradict the LOCAL_PICKUP discipline (per base pack 19).

### 6. negotiation_guide

Contains:
- `list_price` — where to anchor initial listing
- `minimum_accept` — floor beneath which the seller should decline
- `sweet_spot` — realistic transaction price
- `first_offer_expect` — what the typical first offer looks like
- `counter_strategy` — how to respond to the first offer
- `urgency_factor` — whether and how to create appropriate urgency

Every field populated. A negotiation_guide without a
minimum_accept leaves the seller vulnerable to decision fatigue
during active negotiation.

### 7. price_factors

Contains:
- `value_adders[]` — array of `{factor, impact, explanation}`
- `value_reducers[]` — array of `{factor, impact, explanation}`

Minimum 2 adders and 2 reducers when relevant. Impact values:
"High", "Medium", "Low". Explanation is one sentence.

### 8. price_history

Contains:
- `trend_2_5_years` (Rising/Stable/Declining)
- `trend_evidence` (string — what evidence supports the trend call)
- `appreciation_potential` (string — forward-looking)
- `investment_grade` (boolean — is this item likely to hold or
  appreciate value long-term)

Populated for every item above the $200 threshold. For commodity
household goods below threshold, price_history may return
`{trend_2_5_years: "Stable", investment_grade: false}` with brief
evidence.

### 9. international_pricing (when qualified)

Contains: `uk_estimate`, `eu_estimate`, `japan_estimate`,
`australia_estimate`, `best_international_market` (string).

Populated when:
- Item category has documented international collector demand
- Estimated value exceeds $500 (international shipping economics
  need enough price headroom)
- Item is shippable internationally without regulatory complication

Omitted (or nulled) when item is inappropriate for international
market (bulky furniture, regulated categories, items with
regionally-limited collector appeal).

### 10. insurance_value

Single number. The price the seller should report for insurance
scheduling. Typically 110 to 130 percent of the retail mid-estimate
to cover replacement cost.

### 11. liquidation_value

Single number. The price the seller would accept today from a
dealer for a cash transaction. Typically 45 to 60 percent of
retail mid for standard categories; 35 to 50 percent for
specialist categories.

### 12. collector_premium

String. Describes how much more a collector pays vs. a casual
buyer, with reasoning. Example: "A collector focused on 2008
Dean reissues will pay 15 to 25 percent above player-grade market
because they value original case candy and matching serial ranges."

### 13. wholesale_vs_retail

Contains `wholesale` (number) and `retail` (number). The
wholesale is the dealer-acquisition price. The retail is the
dealer-resale price. The spread shows the seller where they sit
on the wholesale-retail axis and what they're giving up or
gaining at each.

### 14. liquidation_timeline (four time horizons)

Contains `day_1_price`, `day_7_price`, `day_30_price`,
`day_90_price`. Each is a number. The prices reflect the
expected clearing price at each time horizon (see M01 for
liquidation theory).

### 15. executive_summary (6 to 8 sentences)

A premium executive summary covers:

1. What the item is and its market position (one sentence)
2. The recommended price band with midpoint and rationale (one
   to two sentences)
3. Where to sell and why (one sentence)
4. Expected timeline with supporting evidence (one sentence)
5. The top one or two actions the seller should take today
   (one to two sentences)
6. Any escalation or special consideration (one sentence)

Written at a senior-friendly reading level. Avoids jargon. Cites
evidence specifically.

---

## Full Dean Guitar LOCAL_PICKUP Worked Output

Canonical test case. Dean MLX electric guitar, 2008 reissue, player-
grade (6/10), LOCAL_PICKUP from 04901 Maine with 25-mile radius.

```json
{
  "price_validation": {
    "agrees_with_initial_estimate": true,
    "revised_low": 325,
    "revised_mid": 360,
    "revised_high": 420,
    "revision_reasoning": "Six Reverb sold comps in the last 75 days
     median $425 nationally. Applied 0.78 rural Maine correction
     factor for LOCAL_PICKUP scope to arrive at $360 local midpoint.
     Tightened the band from initial estimate based on dense comp
     agreement."
  },
  "comparable_sales": [
    {"platform": "Reverb", "item_description": "2008 Dean MLX
     Transparent Red, player grade, original case",
     "sold_price": 445, "sold_date": "2026-03-12",
     "condition_compared": "Similar", "relevance": "High",
     "notes": "Near-identical to target. Closed in 4 days."},
    {"platform": "Reverb", "item_description": "2008 Dean MLX Black
     Satin, minor fret wear, no case",
     "sold_price": 395, "sold_date": "2026-02-28",
     "condition_compared": "Worse", "relevance": "High",
     "notes": "Missing case cost $40-60; condition slightly worse."},
    {"platform": "Reverb", "item_description": "2008 Dean MLX
     Transparent Blue, all original, case candy included",
     "sold_price": 495, "sold_date": "2026-02-15",
     "condition_compared": "Better", "relevance": "High",
     "notes": "Ceiling reference — pristine example."},
    {"platform": "eBay", "item_description": "2008 Dean MLX player
     grade, refret completed 2023",
     "sold_price": 375, "sold_date": "2026-01-22",
     "condition_compared": "Similar", "relevance": "Medium",
     "notes": "Refret work reduces collector interest by ~10%."},
    {"platform": "Reverb", "item_description": "2008 Dean MLX
     Flame Top, all original, excellent condition",
     "sold_price": 525, "sold_date": "2026-01-08",
     "condition_compared": "Better", "relevance": "Medium",
     "notes": "Flame Top variant trades 15% higher than standard."},
    {"platform": "Facebook Marketplace (Maine)",
     "item_description": "Dean MLX 2008, local pickup Bangor",
     "sold_price": 350, "sold_date": "2025-12-14",
     "condition_compared": "Similar", "relevance": "High",
     "notes": "Direct local comp — Maine buyer, local pickup."}
  ],
  "platform_pricing": {
    "ebay": {"list_price": 0, "expected_sell": 0, "fees_pct": 0,
     "seller_net": 0, "days_to_sell": 0,
     "tips": "Not recommended — LOCAL_PICKUP scope."},
    "facebook_marketplace": {"list_price": 399,
     "expected_sell": 360, "fees_pct": 0, "seller_net": 360,
     "days_to_sell": 21,
     "tips": "Primary channel for Maine local pickup. List
      at $399, accept $350. Lead with case + hang tags photo."},
    "etsy": {"list_price": 0, "expected_sell": 0, "fees_pct": 0,
     "seller_net": 0, "days_to_sell": 0,
     "tips": "Category mismatch — Etsy is not a strong musical
      instrument channel."},
    "craigslist": {"list_price": 385, "expected_sell": 340,
     "fees_pct": 0, "seller_net": 340, "days_to_sell": 28,
     "tips": "Secondary local channel. Waterville, Augusta,
      Bangor posting zones."},
    "mercari": {"list_price": 0, "expected_sell": 0, "fees_pct": 0,
     "seller_net": 0, "days_to_sell": 0,
     "tips": "Not recommended — LOCAL_PICKUP scope."},
    "offerup": {"list_price": 379, "expected_sell": 335,
     "fees_pct": 12.9, "seller_net": 292, "days_to_sell": 30,
     "tips": "Backup local channel with lower Maine user base."},
    "reverb": {"list_price": 0, "expected_sell": 0, "fees_pct": 0,
     "seller_net": 0, "days_to_sell": 0,
     "tips": "Reverb would fetch $425 but requires shipping,
      which is out of scope for LOCAL_PICKUP."},
    "auction_house": {"hammer_estimate": 0,
     "buyers_premium_pct": 0, "sellers_commission_pct": 0,
     "seller_net": 0,
     "tips": "Below auction-house threshold."},
    "best_platform": "Facebook Marketplace for Maine local pickup
     — highest seller net at $360 with 21-day realistic timeline."
  },
  "market_analysis": {
    "demand_level": "Moderate",
    "demand_trend": "Stable",
    "supply_level": "Low",
    "seasonal_factors": "Guitar sales pick up slightly in
     March-April and November-December with gift and
     tax-return cycles.",
    "category_health": "Dean MLX 2008 reissue remains active in
     the Dimebag Darrell fan community. Sustained collector
     demand supports stable pricing."
  },
  "regional_pricing": {
    "local_estimate": {"low": 325, "mid": 360, "high": 420,
     "reasoning": "Central Maine rural market. Applied 0.78
      correction to national Reverb median. Local player-grade
      buyers target $350 sweet spot."},
    "national_estimate": {"low": 395, "mid": 425, "high": 495},
    "best_market": {"city": "Local", "state": "ME", "price": 360,
     "why": "LOCAL_PICKUP scope — best market is the local
      market by definition."},
    "ship_vs_local_verdict": "Seller has specified LOCAL_PICKUP.
     Reverb at $425 national would exceed local price by ~18%
     but requires shipping, which is out of scope for this sale."
  },
  "negotiation_guide": {
    "list_price": 399,
    "minimum_accept": 325,
    "sweet_spot": 360,
    "first_offer_expect": "Typical first offer $275 to $300 from
     a player looking for a deal.",
    "counter_strategy": "Counter first offer at $375. Hold firm
     until offer reaches $340. Accept $350+ if buyer is
     ready-to-transact same week.",
    "urgency_factor": "Moderate. Local pickup moves in 2-3 weeks
     at this price point. Do not create artificial urgency —
     Dean MLX supply is not scarce enough to justify pressure."
  },
  "price_factors": {
    "value_adders": [
      {"factor": "Original case with case candy", "impact": "Medium",
       "explanation": "Case + hang tags add $40-60 to comparable
        no-case listings."},
      {"factor": "2008 reissue era", "impact": "Medium",
       "explanation": "The 2008 USA reissue run is the preferred
        version among MLX collectors vs. Far East imports."}
    ],
    "value_reducers": [
      {"factor": "Rural Maine market", "impact": "Medium",
       "explanation": "Local buyer pool is smaller than urban
        metro markets for specialty electric guitars."},
      {"factor": "Player grade condition", "impact": "Low",
       "explanation": "Some finish wear is expected and priced
        into the player-grade comp set."}
    ]
  },
  "price_history": {
    "trend_2_5_years": "Stable",
    "trend_evidence": "Reverb sold median for 2008 Dean MLX has
     held $400-$450 range since 2023. No significant trend
     in either direction.",
    "appreciation_potential": "Limited appreciation potential.
     Dean MLX 2008 reissue is a stable player-grade market,
     not a speculative collector investment.",
    "investment_grade": false
  },
  "insurance_value": 500,
  "liquidation_value": 250,
  "collector_premium": "A collector focused on the 2008 MLX
   reissue run will pay 15 to 20 percent above player-grade
   market for an all-original example with case candy and
   matching serial range. This example is player-grade, so no
   collector premium applies to the local pickup price.",
  "wholesale_vs_retail": {
    "wholesale": 225,
    "retail": 425
  },
  "liquidation_timeline": {
    "day_1_price": 225,
    "day_7_price": 300,
    "day_30_price": 360,
    "day_90_price": 415
  },
  "executive_summary": "This is a 2008 Dean MLX electric guitar
   in player-grade condition with its original case, being sold
   local pickup in central Maine. Based on six recent Reverb
   sold comps and a direct Maine local comp from December, the
   price band is $325 to $420 with a target of $360 — which
   reflects a 22 percent rural correction from the $425 national
   Reverb median. List on Facebook Marketplace at $399 and expect
   a sale to a Maine player within 21 days. Accept no less than
   $325. If you have flexibility on timeline, holding 30 to 60
   days can achieve closer to $400 from a more targeted
   collector buyer. This item is not investment-grade and
   pricing is stable, not appreciating — move within the target
   window rather than holding for future gain."
}
```

---

## Before and After: Amateur vs. Specialist Language

The difference in perceived seller competence between amateur and
specialist pricing language is the difference between a quick
confident sale and a listing that sits.

### Amateur

"Nice 2008 Dean MLX guitar. Not sure exactly what it's worth but
similar ones go for $400 to $700 online. Will take best offer.
Local pickup only in Maine."

What a buyer reads: the seller has not done the research, is
asking buyers to do the pricing work, and has left a $300
negotiating window that the buyer will anchor at the low end.
Final transaction likely $275 to $325.

### Specialist

"2008 Dean MLX in player-grade condition with original case and
case candy. Listed at $399 local pickup central Maine, based on
Reverb sold median of $425 nationally with appropriate rural
market adjustment. Recent Maine local comp from December: $350.
Happy to negotiate in the $325 to $399 range for a ready buyer
this week. Serious inquiries only."

What a buyer reads: the seller knows the market, has done the
research, has set a specific reasonable range, and is a
credible transaction partner. Final transaction likely $350 to
$375 within two weeks.

The methodology that produces the specialist output is what this
entire skill pack canonizes. Every MegaBot PriceBot run is held
to this standard.

---

## What the Premium Output Is For

This output is the document a seller references when:

- Talking to a local buyer about price
- Evaluating a dealer cash offer
- Deciding whether to consign or self-list
- Reporting for insurance or estate purposes
- Deciding whether to hold or sell

Each of those decisions needs different fields. That's why the
schema is complete, not minimal. Partial outputs force the
seller to make decisions with incomplete information. Premium
outputs let them act with confidence.
