---
name: garage-sale-v8-buyers
description: Teaches BuyerBot to segment buyers by V8 three-number pricing (LIST/ACCEPT/FLOOR) and exempt vocabulary (HOLD/NEGOTIATE/MINIMUM), map channelRecommendation to buyer pools, calibrate offer ranges by saleMethod, and route specialty items to collector/dealer networks. Works alongside pack 16 (garage-sale-buyer-matching) — pack 16 teaches macro strategy, pack 17 adds V8 vocabulary and precision.
when_to_use: Every BuyerBot scan. If the [PRICING INTELLIGENCE] enrichment narrative mentions V8 prices (LIST / ACCEPT / FLOOR), use them verbatim to calibrate buyer profiles. If only a V2 range is present, fall back to valuation midpoint as acceptPrice and widen offer ranges accordingly.
version: 1.0.0
---

## Section 1 — Two Buyer Pools (Non-Exempt Items)

Every non-exempt item has TWO distinct audiences. BuyerBot must identify
which pool to target based on the V8 channelRecommendation:

| Pool                     | Characteristics                                                  | Offer anchor     |
|--------------------------|------------------------------------------------------------------|------------------|
| ONLINE BUYERS            | Pay full marketplace price, expect shipping, compare platforms, patient | listPrice (25% above acceptPrice) |
| GS / LOCAL BUYERS        | Bargain hunters, cash/Venmo, want to see/touch, impulse-driven, Saturday energy | acceptPrice to floorPrice |

**Rules:**
- Never mix pool framings in one `buyer_profile` entry. One profile =
  one pool.
- `price_sensitivity` for GS buyers: "high — expect 30-40% off online."
- `price_sensitivity` for online buyers: "moderate — pays for value + shipping."
- `estimated_offer_range` MUST reference V8 numbers when available.

## Section 2 — Exempt Buyer Pool (Antiques / Collectibles / Jewelry / Art / Coins / Watches)

Exempt items command the specialist pool. NEVER target bargain hunters.

| Exempt category | Primary buyer pool           | Specialist platforms |
|-----------------|------------------------------|----------------------|
| Antiques        | Dealers + decorators         | 1stDibs, Chairish, local antique malls, period-dealer networks |
| Collectibles    | Graded collectors + speculators | PWCC, eBay with cert, GoldinAuctions, COMC |
| Jewelry         | Resellers + aficionados      | The RealReal, Worthy, Sotheby's, Bonhams |
| Art             | Collectors + galleries       | Artsy, Saatchi, auction houses, regional galleries |
| Coins           | Numismatists + PCGS dealers  | Heritage Auctions, Great Collections, PCGS dealer network |
| Watches         | Enthusiasts + specialists    | Chrono24, Bob's Watches, Crown & Caliber |

**Vocabulary mapping:**
- `listPrice` maps to **HOLD** ("Holding at $X. Serious buyers only.")
- `acceptPrice` maps to **NEGOTIATE** ("Negotiable at $X.")
- `floorPrice` maps to **MINIMUM** ("Minimum $X. Won't accept less.")

**Rules:**
- NEVER use "OBO" or "or best offer" in exempt buyer outreach. Destroys
  perceived value.
- ALWAYS surface authentication, grade, population, era, or provenance
  when the enrichment blocks provide them.
- Exempt items should route to specialist platforms — exclude
  craigslist, offerup, mercari.
- If the item is both antique AND collectible, use the HIGHER-value
  frame (collectible grade wins if scored >= 80).

## Section 3 — All 8 Channel Recommendations Mapped to Buyer Pools

Match each `channelRecommendation` value to its exact buyer pool and
platform set:

| channelRecommendation                      | Pool emphasis        | Platforms                                              |
|-------------------------------------------|----------------------|--------------------------------------------------------|
| "Garage sale or bundle lot"               | GS / local           | Yard sale FB groups, Nextdoor, Craigslist (bundles)    |
| "Garage sale with online backup"          | GS / local primary   | FB Marketplace, Nextdoor, backup on Mercari/Poshmark   |
| "Online marketplace (eBay, Mercari, FB)"  | Online primary       | eBay, Mercari, FB Marketplace, Poshmark, OfferUp       |
| "Specialty platform"                      | Online specialist    | 1stDibs, Chairish, Depop, Reverb (instruments), GOAT (sneakers) |
| "Auction or consignment"                  | Auction / dealer     | LiveAuctioneers, Heritage, Sotheby's, regional auction houses |
| "Specialist dealer or auction"            | Exempt specialist    | Category-specific (see Section 2 table)                |
| "Estate sale or local consignment"        | Local high-value     | Estate sale organizers, local consignment shops        |
| "Garage sale or local pickup"             | Local only           | Nextdoor, Craigslist, local FB groups                  |

**Rules:**
- READ the exact string from `[PRICING INTELLIGENCE]` or
  `[V8 GARAGE SALE STRATEGY]` (when wired). Match buyer pool accordingly.
- If missing, infer from `acceptPrice` brackets:
  `<$15 bundle` / `<$50 GS casual` / `<$200 online` / `<$500 specialty` / `>=$500 auction`.
- Never invent a channelRecommendation value.
- `channelReason` text (when present) should surface in
  `executive_summary` so the seller understands WHY this pool is best.

## Section 4 — saleMethod + shippingDifficulty Respect

When `[V8 GARAGE SALE STRATEGY]` block provides `saleMethod` or
`shippingDifficulty`, honor them absolutely:

**saleMethod = LOCAL_PICKUP:**
- NEVER include ship-required platforms in `platform_opportunities`
  (suppress eBay, Etsy, Mercari, Poshmark, Amazon).
- Focus on: Facebook Marketplace local, Craigslist, Nextdoor, OfferUp.
- `buyer_profiles` exclusively have `location_preference: "local only"`.
- `timing_advice` emphasizes weekend / daylight / cash-friendly windows.

**saleMethod = ONLINE_SHIPPING:**
- OK to include all shipping platforms.
- Reference shipping-ready buyer expectations: "pays shipping + 3%
  insurance."
- Skip pure GS language unless item is under $15 (bundle territory).

**saleMethod = BOTH (or null):**
- Generate parallel profiles — one "local pickup" segment, one
  "ship-nationally" segment.
- Let channelRecommendation drive the primary.

**shippingDifficulty = FREIGHT_ONLY:**
- Override any ship recommendation. Must be local-only or
  estate-sale-organizer.
- `platform_opportunities` limited to: Craigslist, Nextdoor, Facebook
  Marketplace, local estate sale companies.
- `buyer_profiles` note "buyer must arrange freight or pickup."

**shippingDifficulty = FRAGILE:**
- Prefer local; if shipping, flag professional packing requirement.
- `buyer_profiles` for collectors should note "expects insured, packed
  by pro."

**NOTE:** As of HEAD `a8968ce`, BuyerBot does NOT yet receive
`item.saleMethod` or `item.saleRadiusMi` as structured prompt fields.
Follow these rules whenever saleMethod appears ANYWHERE in the enrichment
narrative (e.g., via PriceBot prose referring to the seller's preference).
Future command `CMD-BUYERBOT-V8-DATA-WIRE` will plumb saleMethod directly.

## Section 5 — Counter-Offer Intelligence (LIST-to-FLOOR Spread)

Use the spread between `listPrice` and `floorPrice` to guide
`hot_leads.estimated_price_theyd_pay` and `outreach_strategies`:

| Spread (listPrice - floorPrice) / listPrice | Signal                   | BuyerBot guidance                                                     |
|---------------------------------------------|--------------------------|-----------------------------------------------------------------------|
| > 30% (e.g., LIST $140, FLOOR $90)          | Room to negotiate        | "Expect offers $105-$120. Counter at $125."                           |
| 15-30% (e.g., LIST $100, FLOOR $75)         | Standard negotiation     | "Reasonable offers land near acceptPrice. Decline below $80."         |
| < 15% (e.g., LIST $55, FLOOR $50)           | Priced firm              | "Price is firm. Decline lowball offers. Accept at listPrice."         |
| Exempt path (HOLD/NEGOTIATE/MINIMUM)        | Non-negotiable floor     | "Do not negotiate below MINIMUM. These items appreciate."             |

**Output location:** `hot_leads[i].estimated_price_theyd_pay` and
`competitive_landscape.differentiation_tip`.

**Rules:**
- NEVER write a counter-offer below `floorPrice`. That's the walk-away.
- For exempt items, the "counter" is to politely decline and reference
  appraised/auction value.
- If spread is zero or floorPrice > listPrice (shouldn't happen — flag
  as data anomaly in `executive_summary`), BuyerBot refuses to generate
  counter-offer guidance and recommends re-running PriceBot.

## Section 6 — Grok vs Claude Hybrid Path Coaching

BuyerBot is hybrid: **Grok** primary (viral/social mining), **Claude**
secondary (collector/dealer refinement). Both paths must use V8
vocabulary, but with different emphasis:

### Grok path (primary, every run)
- Focus: WTB posts, FB group discovery, Reddit buyer mining, Instagram
  hashtag scraping.
- V8 usage: lead `hot_leads` with the DEAL — "Worth $135 online, selling
  $50 Saturday." The deal-contrast hook is Grok's sweet spot.
- `outreach_strategies` lean toward community posts ("Post in [group]
  with photo + 'asking $X firm, local pickup only'").
- Emphasize urgency and scarcity for GS/local buyers.

### Claude path (secondary, fires on specialty_item trigger)
- Focus: collector/dealer networks, authentication + grading context,
  specialist platform routing.
- V8 usage: use HOLD/NEGOTIATE/MINIMUM for exempt items; use
  listPrice + provenance framing for online collectors.
- `buyer_profiles[].buyer_type` should skew toward Collector, Dealer,
  Personal Use (not Reseller or Flipper).
- `outreach_strategies` lean toward direct inquiry ("Email [auction
  house] with high-res photo + authentication doc").

**Merge behavior:** Claude overlays `buyer_profiles` and
`outreach_strategies` on Grok's base, tagging `_collector_refined: true`
when merge occurs. Pack 17 ensures both paths produce V8-aligned output
so the merge is seamless.

## Section 7 — Location + Radius Intelligence

When `[V8 GARAGE SALE STRATEGY]` block provides a `locationNote`:

**locationNote examples from the V8 engine:**
- "Strong market (ZIP 100xx): local demand runs 21% above national average."
- "Rural/lower-density market (ZIP 049xx): prices typically 18% below
  national average."
- "Average market (ZIP 606xx): pricing at national baseline."

**Map to buyer guidance:**
- HIGH tier: "NYC/Boston/SF metro — local buyers will pay close to
  online. Prioritize local platforms."
- LOW tier: "Rural market — local buyers expect bargains. Emphasize
  national platforms for better net after shipping."
- MEDIUM / baseline: "Balanced market — use channelRecommendation
  defaults."

**Rules:**
- Use locationNote in at most ONE `buyer_profiles[].location_preference`
  or `outreach_strategies[].message_template` — do NOT repeat across
  every field.
- Default `saleRadiusMi` is 25 for LOCAL_PICKUP items (until the data
  wire lands). Pack teaches BuyerBot to say "within 25 miles of
  [saleZip]" for local outreach.
- NEVER fabricate a location note. If absent, omit.

## Section 8 — V8 Output Quality Checklist

Before returning a BuyerBot response, verify:

- [ ] If `[PRICING INTELLIGENCE]` or `[V8 GARAGE SALE STRATEGY]` mentions
  LIST/ACCEPT/FLOOR, at least one `buyer_profile` and one `hot_lead`
  reference those exact numbers.
- [ ] No V2 ranges ($X-$Y) in any buyer offer range when V8 is present.
  Use single V8 anchors.
- [ ] Exempt items use HOLD/NEGOTIATE/MINIMUM vocabulary, NOT LIST/ACCEPT/FLOOR.
- [ ] Exempt items excluded from craigslist / offerup / mercari /
  Nextdoor in `platform_opportunities`.
- [ ] `channelRecommendation` (when present) matches the emphasis in
  `platform_opportunities[0]`.
- [ ] LOCAL_PICKUP items have no ship-based platforms in
  `platform_opportunities`.
- [ ] FREIGHT_ONLY items have no ship recommendations at all.
- [ ] `hot_leads[].estimated_price_theyd_pay` never falls below
  `floorPrice`.
- [ ] `competitive_landscape.price_range_of_competitors` spans at most
  `[floorPrice * 0.9, listPrice * 1.1]`.
- [ ] `executive_summary` ties the V8 story together in 2-3 sentences
  the seller will understand ("Your $120 mid-range item recommends
  garage-sale-or-local-pickup. Expect local buyers to offer $100-110.
  Won't find online buyers at this price point.")
- [ ] When V8 data is ABSENT, fall back to valuation midpoint
  (`v.mid`) as the acceptPrice anchor, widen offer ranges by +/-15%,
  and flag `_v8_fallback: true` in the `executive_summary` so the
  seller knows PriceBot hasn't run.
- [ ] Grok path: at least one hot_lead uses the deal-contrast hook
  ("worth $X online / $Y Saturday").
- [ ] Claude path (when fired): at least one buyer_profile uses
  collector-grade vocabulary (grade / population / cert / authenticated).
