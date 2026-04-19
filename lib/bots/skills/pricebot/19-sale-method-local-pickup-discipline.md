# PriceBot Skill Pack 19 — Sale Method Local Pickup Discipline (V11)

**Added:** CMD-BOT-ENGINE-CANONIZE-SALE-METHOD (April 18, 2026)
**Engine bump:** V10 → V11
**Supersedes nothing.** Packs 01-18 preserved. This pack governs
how PriceBot reasons about items whose seller has set
`saleMethod=LOCAL_PICKUP`.

## Policy

When the seller context contains `Sale method: LOCAL_PICKUP`:

- Price for LOCAL market only. Do NOT reference national or distant
  city prices. Local demand, local buyers, local pickup only.
- Local Enthusiast tier applies when specialty category + demand
  signals warrant.
- Uncle Henry's and Craigslist are the primary local-channel
  benchmarks for Maine-zone items (when `LOCAL_CLASSIFIEDS_ENABLED`
  is true and the geo-resolver routes to `uncle_henrys`).
- NEVER suggest shipping as an option in the pricing rationale.
- Local multiplier from `lib/pricing/market-data.ts` applies: rural
  Maine (049) ≈ 0.75× national average; LOCAL_PICKUP short-circuits
  `getBestMarket()` to the zip-local tier regardless of any
  musical-instrument-specific bonus.

## Preservation

- V8 / V9 / V10 capabilities unchanged when `saleMethod !== LOCAL_PICKUP`.
- Intelligence anchor (`resolveIntelligenceAnchor` helper, V10) continues
  to fire for LOCAL_PICKUP items — anchor resolution is orthogonal to
  saleMethod.
- PriceBot consensus math (`market_comps_median` weight) unchanged;
  LOCAL_PICKUP only biases the pricing recommendation narrative, not
  the weighted-median computation.

## Layered defense

1. **Data layer:** `getBestMarket()` in `lib/pricing/market-data.ts`
   short-circuits to `tier:"LOCAL"` when `saleMethod === "LOCAL_PICKUP"`.
2. **Prompt layer:** PriceBot route injects a dynamic LOCAL_PICKUP
   rule block into the model context (pricebot route line ~408-419).
   This skill pack canonizes that policy at the static level.
3. **Consensus layer:** Reconcile-V3 treats LOCAL_PICKUP as a hint that
   can bias source weighting, but the weighted-median math is
   saleMethod-agnostic — LOCAL_PICKUP disables shipping-path sources
   at the narrative level only.

Any single layer can fail without cascading. Bloomberg/Stripe-grade
defense in depth.

## Telemetry

`PRICEBOT_RUN` event payload already carries `saleMethod` (threaded by
`CMD-SALE-METHOD-FOUNDATION` 1463bec). V1e dashboard can segment
pricing-recommendation accuracy by `saleMethod`.

## Why this matters

Dean guitar (Maine, LOCAL_PICKUP, 25mi radius) should never see
"Nashville is the best market" in PriceBot's pricing rationale.
Local-only sellers get local-only price guidance. That's the moat #3
surface on the pricing narrative layer.

## One-line summary

**LOCAL_PICKUP means local math. No Nashville, no shipping, no national.**
