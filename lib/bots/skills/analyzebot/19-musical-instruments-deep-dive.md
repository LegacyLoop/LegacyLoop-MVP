# AnalyzeBot Skill Pack 19 — Musical Instruments Deep-Dive (V9)

**Added:** CMD-ANALYZEBOT-CATEGORY-DEEP-DIVE-V9 (April 18, 2026)
**Supersedes nothing.** Packs 01-18 remain the general identification baseline. This pack runs ONLY after the merged analysis classifies an item as Musical Instruments, and extracts category-specific depth the general prompt cannot afford to cover for every item.

---

## Policy

When the merged AnalyzeBot analysis returns `category === "Musical Instruments"`, fire a specialty Claude Sonnet pass that extracts:

- **era** — decade (e.g., `"1960s"`, `"1990s"`, `"2000s"`) inferred from headstock logo, tuner style, pickguard shape, bridge type, serial-number format, hardware wear pattern.
- **variant** — specific model or closest style reference (e.g., `"Dean MLX"`, `"Strat-style HSS"`, `"LP-style single cutaway"`). Where exact model is unknown, return the closest recognizable silhouette.
- **provenance** — array of short markers: hallmarks on the truss-rod cover, country-of-origin stamps, serial-number prefix tells, any visible labels / stickers / handwritten inscriptions.
- **confidence** — 0.0–1.0 float, calibrated honestly. Low confidence is a feature, not a bug — low-confidence extractions still teach downstream bots more than nothing.
- **rationale** — one sentence explaining the strongest signal (e.g., `"1990s Dean import — straight-line 'DEAN' headstock logo, pearloid dot inlays, Korean-made hardware consistent with early-'90s Dean imports."`).

The specialty pass does **not** modify the merged analysis. It adds parallel metadata under `_specialtyDetail` in the persisted `rawJson`. Downstream consumers (PriceBot, ListBot, future listing copy) that want era/variant signals read from there; consumers that don't care skip it.

---

## Trigger rules

| Merged analysis state | Specialty fires? |
|---|---|
| `category === "Musical Instruments"` | Yes |
| Other category | No (other packs 20-23 will handle Antiques, Collectibles, Jewelry-Watches, Power-Equipment when they land) |

Runs once per ANALYZED or ANALYZED_FORCE invocation. No retry inside a single run — if the call fails, the specialty field persists as `null` and the analysis proceeds unchanged.

---

## Prompt spec

System prompt: this skill pack's content (pack 19), loaded via `loadSkillPack("analyzebot")`. Claude Sonnet reads the full AnalyzeBot skill-pack stack so it has the general identification context.

User prompt: compact JSON payload of the base analysis summary:

```
{
  "item_name": "<merged item_name>",
  "category": "Musical Instruments",
  "description": "<merged description, truncated to ~600 chars>"
}
```

Plus the item's primary photo as an image block. Return instruction: `Return ONLY a JSON object matching this schema: { era: string|null, variant: string|null, provenance: string[]|null, confidence: number, rationale: string|null }.`

Response format: `JSON.parse` + shape validation. Reject (return null) on:

- Missing `confidence` field or non-numeric.
- `confidence` outside [0, 1].
- All three signal fields (era, variant, provenance) null AND rationale null — nothing useful, no point persisting.
- JSON parse failure.

---

## Cost + latency budget

- **Cost:** ~$0.003–0.005 per MI fire (Sonnet input ~5k tokens cache-hit-eligible, output ~200 tokens).
- **Latency:** ~1.5–3s on the MI call. Runs serially after the merge but before MI / pricing parallel block — so it extends total AnalyzeBot latency on MI items only.
- **Volume:** Musical Instruments is a low-frequency category in LegacyLoop inventory. Expect < 10% of analyses fire this pass. Blended cost impact: < $0.0005 per average analysis.

If latency exceeds 5s p95 on MI items, shorten the prompt. If cost exceeds $0.01 per fire, reduce max_tokens. STOP rules per the command spec.

---

## Preservation

- Merged `analysis` object is **NEVER** mutated by the specialty pass. Specialty metadata lives at `_specialtyDetail` in `rawJson`, never top-level on the analysis itself.
- The existing post-analysis validation block (~route.ts lines 526-562 — antique-marker age check, condition-score clamping, price-range sanity) runs on the merged analysis and is unaffected.
- Antique preservation logic (~lines 584-595) applies to the merged analysis regardless of whether specialty fired. A vintage guitar flagged antique by the general pass stays flagged even if specialty reports `era: "1990s"`.

---

## Telemetry

- **`ANALYZEBOT_CATEGORY_DEEP_DIVE`** — fired once per MI analysis.
  Payload:
  - `category: "Musical Instruments"`
  - `kind: "musical_instrument"`
  - `durationMs` — full specialty call time
  - `extractedFields` — array of keys that ended up non-null (`["era", "variant", "provenance", "rationale"]`)
  - `secondaryConfidence` — the specialty pass's own confidence
  - `succeeded: boolean` — false on API error / parse fail / schema reject
- **Response JSON** — extended additively with `specialtyDetail` field. Null for non-MI items; populated for MI.

---

## Why this matters

A playable 1990s Dean electric guitar isn't just "musical instruments, good condition." The era determines collector premium (1990s US-made vs Korean import is a 2× price swing). The variant determines which comp set PriceBot should cross-reference. The provenance (serial number prefix, made-in stamp) determines whether the item is worth authenticating.

General AnalyzeBot can't afford to probe era / variant / provenance for every item — it would bloat the prompt and hurt identification accuracy for the other 90% of inventory. A category-gated second-pass is the right architecture: general pack classifies, specialty pack goes deep when the category justifies it.

This pack is the first of five (Antiques, Collectibles, Jewelry-Watches, Power-Equipment banked for weekly cadence). Musical Instruments ships first because Dr. Clark's demo item is Ryan's Dean guitar — the narrative is concrete and visible.

---

## One-line summary

**When we know it's a guitar, we dig deeper.**
