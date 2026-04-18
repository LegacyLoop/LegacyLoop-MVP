# PriceBot Skill 18 — Intelligence Anchoring

**Added:** CMD-PRICEBOT-ENGINE-V9 (April 17, 2026)
**Supersedes nothing.** Pack 16 (GDF engine) and pack 17 (V8 three-number engine) remain the formula fallback for items without reasoned Item Intelligence.

---

## The rule

Before computing In-Person pricing from category formulas, read the latest `INTELLIGENCE_RESULT` EventLog for the item. If Item Intelligence has reasoned a `pricingIntel.sweetSpot`, `premiumPrice`, and `quickSalePrice` with `confidence === "high"`, **anchor the In-Person tiers to Intelligence's output** rather than formula-blind GDF math.

| Intelligence confidence | PriceBot action |
|---|---|
| `high` | Override: LIST = `premiumPrice`, ACCEPT = `sweetSpot`, FLOOR = `quickSalePrice`. |
| `medium` | Blend: 60% Intelligence, 40% formula output, per tier. |
| `low` | Ignore. Fall back to formula (pack 17). |
| absent | Formula (pack 17). |

Tag the PriceBot response and `PRICEBOT_RUN` event payload with `pricingSource: "intelligence_anchored" | "hybrid" | "v8_formula"` so downstream consumers (Item Control Center, feedback-loop, accuracy leaderboard) can distinguish paths.

---

## Why Intelligence wins for specialty items

Formula (pack 16 GDF + pack 17 V8) is calibrated around commodity resale: electronics, furniture, clothing. For those, local buyers are yard-sale pickers paying 25–40% of retail, so the three-number engine lands accurate.

For **specialty items** — playable guitars, vintage hand tools, graded sports cards, estate silver, collector books — local buyers are **enthusiasts** paying 55–70% of national via Reverb-local, Facebook Marketplace specialty groups, Craigslist enthusiast categories, or estate-sale foot traffic. Yard-sale pricing insults those buyers and leaves 2× the money on the table.

Item Intelligence (Claude) reasons over eBay sold comps, AnalyzeBot condition grade, AntiqueBot authenticity, CollectiblesBot grade, regional demand signals, and brand context — then emits an enthusiast-channel price. When Intelligence is confident, it has the full picture. Formula alone does not.

A playable 1990s Dean electric guitar in a rural Maine ZIP should price to a hobbyist-guitarist at $185, not to a Saturday-morning yard-sale browser at $80. Intelligence knows. Formula does not.

---

## When to defer to formula (Intelligence-ignore list)

- Category is `clothing_soft` or `books` with Intelligence confidence `medium` or lower.
- Intelligence `sources` array is empty or contains only `["AI_estimate"]` (no market comps cited).
- Intelligence output is older than 7 days **and** the item has a new AnalyzeBot result post-Intelligence (the spec changed; Intelligence is stale).
- User explicitly chose `saleMethod: "LOCAL_PICKUP"` and category is commodity electronics — local-pickup commodity is genuinely formula-territory.

Default to formula when in doubt. Intelligence-anchoring is a precision upgrade, not a blind override.

---

## What PriceBot still does after anchoring

Everything. The `local_price`, `regional_pricing`, `national_price`, `best_market`, `platform_pricing`, `comparable_sales`, `price_factors`, `negotiation_guide`, `confidence` blocks of the PriceBot response are unchanged. Intelligence anchoring only rewires the downstream `GARAGE_SALE_V9_CALC` LIST/ACCEPT/FLOOR fields that drive the In-Person Selling band of the Price Estimate panel and the V8 pills in the item header.

The LOCAL/REGIONAL/NATIONAL/BEST MARKET four-tier national pricing remains PriceBot's own reasoning, untouched.

---

## Telemetry

- `PRICEBOT_RUN.pricingSource` — new field. Values: `intelligence_anchored`, `hybrid`, `v8_formula`.
- `PRICEBOT_RUN.intelligenceAgeMs` — new field. Present only when anchor or hybrid fired; null otherwise.
- `GARAGE_SALE_V9_CALC.pricingSource` — mirrors PRICEBOT_RUN value for traceability.

Once `feedback-loop.ts` ingests SOLD-price ground truth (V1b/V1c), we can compare accuracy of `intelligence_anchored` vs `v8_formula` runs and prove the anchor improves the seller outcome — the core narrative for investor demos.

---

## One-line summary

**When Claude has reasoned, PriceBot listens. When Claude has not, PriceBot computes.**
