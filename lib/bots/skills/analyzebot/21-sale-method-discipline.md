# AnalyzeBot Skill Pack 21 — Sale Method Discipline (V9b)

**Added:** CMD-BOT-ENGINE-CANONIZE-SALE-METHOD (April 18, 2026)
**Engine bump:** V9 → V9b (additive capability on V9 base)
**Supersedes nothing.** Packs 01-20 preserved. This pack governs
how AnalyzeBot handles the `regional_*` output fields when the
seller has set `saleMethod=LOCAL_PICKUP`.

## Policy

When the seller context contains `Sale method: LOCAL_PICKUP`:

### Null these regional fields (national scope):
- `regional_best_city`
- `regional_best_state`
- `regional_best_price_low`
- `regional_best_price_high`
- `regional_best_why`
- `regional_ship_or_local`
- `regional_national_best_city`
- `regional_national_best_state`

### Populate these regional fields (local scope, radius-aware):
- `regional_local_best_city` (within `saleRadiusMi` of `saleZip`)
- `regional_local_best_why`
- `regional_local_demand`
- `regional_local_reasoning`

The AI schema includes all 12 `regional_*` fields; the LLM is
instructed to return `null` for the national-scope fields when
LOCAL_PICKUP is set in the context. Runtime enforcement lives in
`lib/bots/analyzebot/sale-method-post-process.ts` (the null-out
helper) — if the LLM fails to comply with the prompt instruction, the
post-process guarantees the schema contract.

## Layered defense (F1 pit-crew discipline)

1. **Data layer:** `getBestMarket()` in `lib/pricing/market-data.ts`
   short-circuits to the `LOCAL` tier when `saleMethod === "LOCAL_PICKUP"`.
2. **Prompt layer:** This skill pack + the dynamic CRITICAL-LOCAL-PICKUP
   block injected into `sellerContext` by the analyze route instruct
   the LLM.
3. **Runtime layer:** `applyLocalPickupDiscipline()` from
   `lib/bots/analyzebot/sale-method-post-process.ts` enforces the
   contract regardless of LLM compliance. Called from
   `lib/adapters/ai.ts` just before `return parsed;`.

Any one layer can fail without cascading. Bloomberg/Stripe-grade
defense in depth.

## Preservation

- Non-LOCAL_PICKUP items: all `regional_*` fields populate normally
  per V8 / V9 baseline behavior.
- Specialty deep-dive second-pass (pack 19 Musical Instruments,
  pack 20 Antiques) is unaffected by `saleMethod` — runs independently
  based on `category` + `is_antique` flag.
- `_specialtyDetail` output shape unchanged.
- Confidence floors (brand+model, markings) unchanged.

## Telemetry

`ANALYZED` event payload already carries `_analyzerSource` and
`saleMethod` (via `sellerContext`). The post-process helper logs a
`[ANALYZEBOT_LOCAL_PICKUP_DISCIPLINE] nulled N national field(s)`
line whenever enforcement fires — observable in server logs and
adoptable by `CMD-AI-NULL-OUT-TELEMETRY` (banked) when EventLog
tracking is added.

## Why this matters

Same rationale as the PriceBot and ListBot sale-method packs shipped
in this command. LOCAL_PICKUP is a contract between seller and app.
Every bot must honor it. AnalyzeBot is upstream of PriceBot / ListBot /
BuyerBot — if AnalyzeBot's output says "Nashville is best," every
downstream bot inherits the lie.

## One-line summary

**Three layers. Any can fail. None can fake national intelligence on a local item.**
