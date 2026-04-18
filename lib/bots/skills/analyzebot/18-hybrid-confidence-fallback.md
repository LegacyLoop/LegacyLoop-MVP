# AnalyzeBot Skill Pack 18 — Hybrid Confidence Fallback (V9)

**Added:** CMD-ANALYZEBOT-ENGINE-V9 (April 18, 2026)
**Supersedes nothing.** Packs 01-17 remain the primary identification baseline. This pack governs the second-opinion path that fires only when primary is uncertain.

---

## Policy

When primary AI (OpenAI gpt-4o-mini) returns an identification with `confidence < 0.70`, a secondary pass fires on Claude Sonnet. Results reconcile through the existing `mergeConsensus` helper (same logic used by MegaBot's 4-way consensus, adapted to 2 providers). The merged analysis becomes the canonical result — not primary alone, not secondary alone.

For primary confidence ≥ 0.70, no secondary fires. No added latency. No added cost. The hybrid path exists to raise the floor on the uncertain tail, not to double-cost every run.

---

## Trigger rules

| Primary confidence | Secondary fires? | Result used |
|---|---|---|
| ≥ 0.70 | No | primary |
| < 0.70 and secondary succeeds | Yes | `mergeConsensus([primary, secondary])` |
| < 0.70 and secondary throws | Yes (attempted) | primary (defensive fallback) |
| primary itself throws | N/A | 422 error (unchanged from V8) |

Force-refresh runs follow the same rule — confidence gate decides, not the `force` flag.

---

## Reconciliation

`mergeConsensus` (from `lib/adapters/multi-ai.ts`) handles:
- Category tie-break: higher-confidence provider wins on disagreement.
- Numeric field merge: weighted average by confidence.
- Flag fields (`is_antique`, `is_collectible`, `vehicle_*`): OR of providers when at least one is confident.
- Description narrative: primary's narrative + secondary's amendments only on low-agreement fields.

Confidence output: `max(primary.confidence, secondary.confidence)` when they agree on category; `weighted_average` otherwise.

`calcAgreement([primary, secondary])` produces a 0-100 score. Used for telemetry only — the merged result is unconditional once secondary succeeded.

---

## Preservation

- **Antique / collectible prior-detection flags:** the existing `priorAntiqueCheck` preservation logic (route.ts ~lines 526-535) runs after the merge. Merged result feeds into it intact.
- **Outdoor-equipment category override:** the post-analysis validation block (~lines 462-487) still applies. Runs on the merged output.
- **Enrichment path (market intel, pricing):** fires once on the merged result, not twice. Secondary analysis is not separately enriched — waste.
- **AiResult persistence:** rawJson stores the merged analysis. Original primary and secondary are not persisted separately (they live in the HYBRID_FIRED EventLog payload for audit).

---

## Telemetry

- **`ANALYZEBOT_HYBRID_FIRED`** — fired once per hybrid invocation. Payload:
  - `primaryConfidence`, `secondaryConfidence`, `primaryCategory`, `secondaryCategory`
  - `agreementScore` (0-100)
  - `trigger: "low_confidence"` (reserved for future triggers like explicit-retry)
  - `primaryLatencyMs`, `secondaryLatencyMs`
  - `wasUsed` (true if secondary's output was merged into analysis)
- **Response JSON** — extended additively with `analyzerSource: "primary" | "hybrid"`, `primaryConfidence`, `secondaryConfidence`, `agreementScore`. Existing response body shape preserved.
- **ANALYZED event payload** — gains `analyzerSource` field so downstream V1e dashboard can segment accuracy by primary vs hybrid.

---

## Why this matters

AnalyzeBot is the foundation every downstream bot inherits from. PriceBot reads category + condition + age. ListBot generates copy keyed to `item_name`. BuyerBot profiles match persona against category. If primary vision reasoning lands uncertain on the 20-30% tail of items (poor lighting, obscure category, unusual angle), every downstream bot inherits that uncertainty.

Hybrid fallback raises the identification floor. PriceBot sees a more trustworthy category. ListBot writes copy for the right item. BuyerBot matches the right personas. Intelligence chat reasons from a cleaner base. Pillar 2 (the jury) produces better verdicts because the input was sharper.

Quality compounds upstream. This pack ensures the compounding starts at the identification layer.

---

## Costs

- Secondary Claude Sonnet call costs ~$0.003-0.005 per fire.
- Fires on ~20-30% of analyses (low-confidence tail).
- Expected blended add: ~$0.0006-0.0015 per analysis on average.
- Latency budget: ~1.5-3s added to the ~20-30% of calls that trigger hybrid. Acceptable for identification surface.

---

## One-line summary

**When primary is unsure, a second set of eyes settles it. When primary is sure, we don't waste the call.**
