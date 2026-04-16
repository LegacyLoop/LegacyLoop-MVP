---
name: garage-sale-v8-listings
description: Teaches ListBot to write every garage-sale-context listing in V8 three-number vocabulary (LIST/ACCEPT/FLOOR) and exempt vocabulary (HOLD/NEGOTIATE/MINIMUM) with channel-aware tone, location context, and platform-specific V8 language. Closes the vocabulary gap between PriceBot's V8 output and ListBot's listing copy.
when_to_use: Every ListBot scan. If the [PRICING INTELLIGENCE] enrichment block contains V8 three-number language (LIST / ACCEPT / FLOOR), use it verbatim. If only V2 ranges are present, use one-number-per-platform language grounded in the most appropriate V2 anchor.
version: 1.0.0
---

## Section 1 — V8 Three-Number Vocabulary (Non-Exempt Items)

The V8 pricing engine outputs three numbers per item. Your job is to
translate them into listing copy. NEVER show V2 ranges ($35-$50) in GS
contexts once V8 is available. Always ONE number per listing, chosen
intentionally.

| Field       | Role                            | When to lead with it |
|-------------|---------------------------------|----------------------|
| listPrice   | Sign price, "put on the tag"    | Craigslist, FB Marketplace, Nextdoor, garage sale tag itself |
| acceptPrice | Deal-close target, "happily take" | OfferUp, Mercari (negotiator platforms), Poshmark |
| floorPrice  | Walk-away minimum, "never below" | Clearance, "must go today," rough condition |

**Example listing language (non-exempt):**
- "Priced to sell — $140. Will consider offers above $100."
- "Asking $120, firm at $100."
- "Saturday garage sale price: $140. Come early."
- "$50 today — worth $135 online."
- "Craigslist special: $120. OBO above $100."

**Rules:**
- NEVER invent numbers. Only use numbers the PRICING INTELLIGENCE block
  explicitly provides.
- NEVER average two V8 numbers together in copy.
- NEVER mix LIST + ACCEPT in the same line. One number per line, one
  price per listing.
- If PRICING INTELLIGENCE provides all three (LIST / ACCEPT / FLOOR),
  select the ONE that best fits the platform + condition.
- If PRICING INTELLIGENCE provides only a V2 range, use the V2 midpoint
  and flag in `cross_platform_strategy.notes` that "V8 prices not yet
  available — ran PriceBot."

## Section 2 — Exempt Vocabulary (Antiques / Collectibles / Jewelry / Art / Coins / Watches)

Exempt items hold value at garage sales. NEVER use GS casual language.
Use the exempt three-number vocabulary:

| Field       | Exempt Label | Tone |
|-------------|--------------|------|
| listPrice   | HOLD         | Firm, premium, "not a negotiation" |
| acceptPrice | NEGOTIATE    | Serious inquiries only |
| floorPrice  | MINIMUM      | Last-resort, rarely used in copy |

**Example listing language (exempt):**
- "Museum-quality [item]. Holding at $2,000. Serious buyers only."
- "[Era] [type]. Authenticated. Negotiable at $1,800."
- "Collectible — appraised. Please contact for price."
- "Graded [grade]. Population [N]. $2,500 firm."

**Rules:**
- NEVER write "$2,000 OBO" for exempt items. "OBO" destroys perceived value.
- ALWAYS reference authentication, grade, population, era, or provenance
  when the enrichment block provides them.
- If the item is both antique AND collectible, use the HIGHER-value frame.
- Exempt items should route to `ebay`, `etsy`, specialist dealer platforms
  — NOT `craigslist` or casual garage sale tags.

## Section 3 — Channel Recommendation Vocabulary

The V8 engine outputs EIGHT exact channel recommendations. Match your
listing copy's tone to whichever value appears in PRICING INTELLIGENCE:

| channelRecommendation                          | Tone / Emphasis |
|-----------------------------------------------|----------------|
| "Garage sale or bundle lot"                    | Ultra-casual. Bundle suggestions. Saturday energy. |
| "Garage sale with online backup"               | Casual first, post-ready second. "List here first, ship later." |
| "Online marketplace (eBay, Mercari, FB)"       | Professional. SEO-rich. Full description. |
| "Specialty platform"                           | Expert. Targeted. "This buyer knows what they're looking at." |
| "Auction or consignment"                       | White-glove. Estate language. "Evaluated by..." |
| "Specialist dealer or auction"                 | Exempt-item frame. Authentication + provenance. |
| "Estate sale or local consignment"             | Local, large/freight, "pickup only" dominant. |
| "Garage sale or local pickup"                  | Local-only. "Cash or Venmo." No shipping offered. |

**Rules:**
- READ the exact string from PRICING INTELLIGENCE and match tone
  accordingly.
- Never invent a channel recommendation. If the block is missing the
  field, default to tone by acceptPrice bracket:
  `<$15`: bundle / `<$50`: casual GS / `<$200`: online / `<$500`:
  specialty / `>=$500`: auction.
- When `channelReason` is present, incorporate the reasoning subtly in
  `executive_summary` so the seller understands why.

## Section 4 — Location Context (locationNote)

When the PRICING INTELLIGENCE block includes a locationNote sentence,
weave it into listing copy naturally. Never fabricate location data.

**locationNote examples from the engine:**
- "Strong market (ZIP 100xx): local demand runs 21% above national average."
- "Rural/lower-density market (ZIP 049xx): prices typically 18% below national average."
- "Average market (ZIP 606xx): pricing at national baseline."

**Listing copy transforms:**
- HIGH tier: "NYC metro buyers — this is priced below local average."
- LOW tier: "Rural Maine deal — priced for local, not online markup."
- MEDIUM tier: (no location line, let the price speak)

**Rules:**
- If locationNote is NOT in the enrichment, do NOT guess a market
  characterization. Omit the line.
- Use the locationNote in ONE platform listing (the local-focused one:
  Craigslist, Nextdoor, Facebook Marketplace). Do NOT repeat it on every
  platform — sounds templated.

## Section 5 — Platform-Specific V8 Language

Different platforms have different V8 defaults. This matters — eBay
listings should NOT use GS pricing because eBay is an online marketplace
where the online price, not the GS price, applies.

| Platform              | V8 lead number  | Format |
|----------------------|----------------|--------|
| ebay                  | ONLINE price (V2 high or market) | Professional, spec-sheet, full title keywords |
| etsy                  | ONLINE price   | Storytelling, maker language |
| amazon                | ONLINE price   | Functional. No GS framing. |
| mercari               | acceptPrice    | Negotiator-friendly. "Best reasonable offer." |
| poshmark              | acceptPrice    | Fashion-specific. Bundling language. |
| facebook_marketplace  | listPrice      | Conversational. "Pickup in [zone]." |
| craigslist            | listPrice      | Economy. "OBO" if spread (listPrice - floorPrice) > 20% |
| offerup               | acceptPrice    | Casual. "No lowballs." |
| nextdoor              | listPrice      | Neighborhood-friendly. Name your street. |

**Social (Grok path) — viral platforms:**

| Platform              | V8 lead pattern                                     |
|----------------------|-----------------------------------------------------|
| tiktok                | Deal contrast: "Worth $X online. Selling for $Y." |
| instagram             | Lifestyle hook + price reveal at end                |
| reels                 | Before/after, "here's what I found"                 |
| facebook_groups       | Warm, neighbor-to-neighbor, listPrice               |
| pinterest             | Styled photo + acceptPrice                          |
| youtube               | "Thrift flip" angle, reveal acceptPrice             |
| x                     | Urgency + listPrice + ZIP                           |

**Rules:**
- `ebay`, `etsy`, `amazon` use ONLINE price (from V2 `highPrice` or
  market mid), not V8 GS prices.
- `mercari`, `poshmark`, `offerup` use `acceptPrice` — these platforms
  are built for negotiation.
- `facebook_marketplace`, `craigslist`, `nextdoor` use `listPrice` —
  local, visible sticker.
- The Grok viral path MUST reference the deal contrast (online $X vs GS
  $Y) in `viral_hook` when both are known.

## Section 6 — Condition to Listing Urgency Map

Use the AnalyzeBot condition output (pack 17, Section 1) to drive
listing energy:

| condition_guess | Listing Lead                              | Platform priority |
|----------------|-------------------------------------------|-------------------|
| like new / mint | "Practically brand new. Won't last."    | listPrice, eBay, Etsy first |
| excellent       | "Great shape. Priced right."             | listPrice |
| great           | "Light wear. Solid value."                | listPrice |
| good            | "Solid condition. Good deal."             | acceptPrice |
| used            | "Honest wear. Fully functional."         | acceptPrice |
| fair            | "Needs love. Priced to move."            | acceptPrice |
| poor            | "Project piece. Priced to move NOW."     | floorPrice |
| damaged         | "Parts or repair. As-is."                 | floorPrice |
| broken          | "For parts. No returns."                  | floorPrice, local only |

**Rules:**
- Always honest about condition — never inflate language.
- poor / damaged / broken items should ALWAYS lead with floorPrice
  and prefer local pickup channels.
- NEVER write "mint" or "like new" unless AnalyzeBot confirmed those
  exact terms in condition_guess.

## Section 7 — saleMethod + shippingDifficulty Awareness

The V8 engine factors these two fields into channel recommendations.
Your listing must honor them:

**saleMethod = LOCAL_PICKUP:**
- NEVER recommend ship-required platforms (eBay, Etsy, Mercari, Poshmark, Amazon).
- Focus listings on: craigslist, nextdoor, facebook_marketplace, offerup.
- Social platforms: local FB groups only. Skip global-reach TikTok if possible.
- ALWAYS include "Local pickup only" in the listing body.

**saleMethod = ONLINE_SHIPPING:**
- OK to list on all platforms.
- Reference shipping cost awareness: "Ships insured via USPS."
- Skip garage sale tags unless item is under $15 (bundle territory).

**saleMethod = BOTH:**
- Generate both local and online listings.
- Let V8 channelRecommendation drive primary.

**shippingDifficulty = FREIGHT_ONLY:**
- Override any ship recommendation. Must be local-only or estate sale.
- Listing title: add "PICKUP ONLY" prefix.
- Platforms: craigslist, nextdoor, facebook_marketplace only.

**shippingDifficulty = FRAGILE:**
- Prefer local; if shipping, note "Ships packed professionally, insured."
- Increase acceptPrice psychology — buyers understand fragile items
  carry risk premium.

## Section 8 — V8 Output Quality Checklist

Before returning a ListBot response, verify:

- [ ] If PRICING INTELLIGENCE contains LIST/ACCEPT/FLOOR, at least one
  per-platform listing references those exact numbers.
- [ ] No V2 range ($X-$Y) appears in any garage-sale-context listing.
- [ ] Exempt items use HOLD/NEGOTIATE/MINIMUM vocabulary, not LIST/ACCEPT/FLOOR.
- [ ] `cross_platform_strategy.recommended_first_post` matches the
  channelRecommendation tone from PRICING INTELLIGENCE.
- [ ] Grok `viral_hook` uses deal-contrast when both online and V8 GS
  prices are known.
- [ ] `trending_angle` references the V8 floorPrice as "the floor" only
  if the item is clearance/urgency-framed.
- [ ] LOCAL_PICKUP items have no shipping-required platform listings.
- [ ] FREIGHT_ONLY items have no ship-based listings at all.
- [ ] Platform-appropriate V8 number used (eBay uses ONLINE, Mercari uses
  acceptPrice, Craigslist uses listPrice).
- [ ] locationNote referenced in at most one platform's listing.
- [ ] Condition-to-urgency mapping honored (poor items lead with floor).
- [ ] `executive_summary` ties the V8 story together in 2-3 sentences
  the seller will understand.
