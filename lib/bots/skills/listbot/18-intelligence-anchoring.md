# ListBot Skill 18 — Intelligence Anchoring

**Added:** CMD-LISTBOT-INTEL-ANCHOR (April 18, 2026)
**Supersedes nothing.** Packs 01-17 remain the formula fallback when Item Intelligence is absent, stale, or low-confidence.

---

## The rule

Before finalizing a recommended listing price for an item, read the latest `INTELLIGENCE_RESULT` EventLog. If Claude has reasoned a `pricingIntel` block with `confidence === "high"`, treat `pricingIntel.premiumPrice` as the authoritative recommended listing price. The per-platform listings stay platform-optimized, but the top-level `listing_price` field on the ListBot result reflects the Intelligence-anchored number.

| Intelligence confidence | ListBot action |
|---|---|
| `high` | Override: `listing_price` = `premiumPrice`. |
| `medium` | Blend: 60% Intelligence, 40% formula mid-price. |
| `low` | Ignore. Use formula mid-price (existing behavior, pack 11). |
| absent or stale (>7d via freshness decay) | Formula mid-price. |

Tag the ListBot response and `LISTBOT_RUN` / `LISTBOT_RESULT` payloads with `pricingSource: "intelligence_anchored" | "hybrid" | "v8_formula"` so downstream consumers (Item Control Center, feedback-loop, V1e accuracy dashboard) can distinguish paths.

---

## Why Intelligence wins for specialty items

The formula flow (pack 11 GDF → V8 three-number → V9 dual-local → V10 tier selection) converges to a realistic price for most commodity items. But for specialty classes — playable musical instruments, vintage hand tools, graded sports cards, estate silver, collector books, power equipment — local buyers are **enthusiasts**, not yard-sale pickers. Enthusiasts pay 55–70% of national retail via Reverb-local, Facebook Marketplace specialty groups, craigslist enthusiast categories. Formula alone leaves 2× on the table.

Item Intelligence (Claude) reasons over eBay sold comps, AnalyzeBot condition grade, AntiqueBot authenticity, CollectiblesBot grade, regional demand signals, brand context, and produces an enthusiast-channel price. When Intelligence is confident, it has the full picture. ListBot's listing price should match that number so the seller's asking price, title-copy anchor, and negotiation baseline all align with the jury-resolved SSOT upstream.

A playable 1990s Dean electric guitar in a rural Maine ZIP should list at $210 with sellers ready to negotiate to $185 — not at $100 with a mis-calibrated prompt that reads "Price: $100" and pushes the LLM to write Craigslist-style yard-sale copy.

---

## When to defer to formula (Intelligence-ignore list)

- Category is `clothing_soft` or `books` with Intelligence confidence `medium` or lower (formula has deep comps; Intelligence adds little).
- Intelligence `sources` array is empty or contains only `["AI_estimate"]` (no market-comp citation).
- Intelligence output is older than 7 days **and** a post-Intelligence AnalyzeBot result exists (item spec changed; Intelligence is stale).
- User explicitly chose `saleMethod: "LOCAL_PICKUP"` and category is commodity electronics — local-pickup commodity is formula-territory.

Default to formula when in doubt. Intelligence-anchoring is a precision upgrade, not a blind override.

---

## What ListBot still does after anchoring

Everything. Per-platform listings (eBay, Facebook, Etsy, Mercari, OfferUp, Craigslist, Poshmark) keep their platform-optimized price fields computed by the LLM — eBay often wants `buy_it_now_price` slightly above mid; Facebook wants round numbers with negotiation room; Etsy tolerates premium pricing. The anchor only rewrites the top-level `listing_price` canonical recommendation, not the per-platform granularity.

Title copy, description narrative, keyword stuffing, platform selection, hero image prompts, bundle suggestions — all unchanged. Intelligence anchoring is a pricing-layer upgrade only.

---

## Negotiation context (internal only)

`pricingIntel.sweetSpot` = the reasonable accept target for offers. Include in internal notes for BuyerBot / OfferManager downstream, but do NOT leak "accept at $X" into public listing copy. Public copy shows the asking price (listing_price) with implicit negotiation headroom.

`pricingIntel.quickSalePrice` = floor. Never surface publicly. Used only by BuyerBot when computing counter-offer walk-away logic.

---

## Telemetry

- `LISTBOT_RUN.pricingSource` — new field. Values: `intelligence_anchored`, `hybrid`, `v8_formula`.
- `LISTBOT_RUN.intelligenceAgeMs` — new field. Present only when anchor or hybrid fired; null otherwise.
- `LISTBOT_RESULT.formulaListingPrice` — preserved audit value (the pre-anchor formula mid-price). Enables V1e feedback-loop to compare anchored vs formula outcomes against SOLD ground truth.

---

## One-line summary

**When Claude has reasoned, ListBot anchors. When Claude has not, ListBot computes.**
