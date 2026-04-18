# AnalyzeBot Skill Pack 20 — Antiques Deep-Dive (V9)

**Added:** CMD-ANALYZEBOT-ANTIQUES-DEEP-DIVE-V9 (April 18, 2026)
**Supersedes nothing.** Packs 01-19 remain the general + MI specialty baseline. This pack runs **only** after the merged analysis flags `is_antique === true`, and extracts age, maker / attribution, and provenance signals the general prompt cannot afford to cover for every item.

---

## Policy

When the merged AnalyzeBot analysis returns `is_antique === true`, fire a specialty Claude Sonnet pass that extracts:

- **era** — decade or half-century window (e.g., `"1880s"`, `"late Victorian"`, `"Art Deco (1925-1940)"`). Inferred from construction technique (dovetail style, joinery, patina), period-specific hardware, typography on labels, stylistic motifs.
- **variant** — maker attribution or closest style reference (e.g., `"Eastlake sideboard"`, `"Stickley-attributed"`, `"Rookwood pottery, signed"`, `"unsigned Sheffield plate"`). Where the maker is unknown, return the strongest period/style association.
- **provenance** — array of concrete markers: hallmarks, maker's marks, stamps, numbered editions, country-of-origin designations, handwritten inscriptions, dealer labels, auction-house chits, previous owner annotations, any reproduction-warning red flags ("this is a modern replica of…").
- **confidence** — 0.0–1.0 float. Calibrated honestly. Antiques often warrant lower confidence than MI (maker attribution is hard); low-confidence extractions still teach downstream bots (AntiqueBot, PriceBot, ListBot) more than nothing.
- **rationale** — one sentence explaining the strongest signal (e.g., `"Late-19th-century Eastlake revival — incised geometric motifs, ebonized finish, and applied brass escutcheons consistent with 1880-1895 American production; no visible maker's mark."`).

The specialty pass does **not** modify the merged analysis. It adds parallel metadata under `_specialtyDetail` in the persisted `rawJson`. Downstream consumers (AntiqueBot for authentication, PriceBot's `antiques_art` category weight, ListBot auction-positioning copy) that want era/maker signals read from there; consumers that don't care skip it.

---

## Trigger rules

| Merged analysis state | Specialty fires? |
|---|---|
| `is_antique === true` (AnalyzeBot flag OR age-derived OR marker-derived) | Yes |
| `is_antique === false` / `null` | No |

Runs once per ANALYZED or ANALYZED_FORCE invocation. If primary AnalyzeBot missed the antique flag but the downstream post-analysis validation block (route.ts ~lines 524-536) retroactively sets `is_antique = true` based on `estimated_age_years >= 50` or ≥3 antique markers, the specialty pass also fires because the dispatch block runs AFTER those validations. This is intentional — the validations are cheap and catch conservative-pricing misses by the primary prompt.

---

## Prompt spec

System prompt: this skill pack's content (pack 20) + packs 01-19, loaded via `loadSkillPack("analyzebot")`. Claude Sonnet reads the full AnalyzeBot skill-pack stack so it has the general identification context plus the MI and Antiques specialty rules.

User prompt: compact JSON payload of the base analysis summary:

```
{
  "item_name": "<merged item_name>",
  "category": "<merged category>",
  "description": "<merged description, truncated to ~600 chars>"
}
```

Plus the item's primary photo as an image block. Return instruction: `Return ONLY a JSON object matching this schema: { era: string|null, variant: string|null, provenance: string[]|null, confidence: number, rationale: string|null }.`

Response format: `JSON.parse` + shape validation via the shared `validateSpecialtyResponse` in `lib/bots/analyzebot/specialty-deep-dive.ts`. Reject (return null) on:

- Missing `confidence` field or non-numeric.
- `confidence` outside [0, 1].
- All three signal fields (era, variant, provenance) null AND rationale null — nothing useful, no point persisting.
- JSON parse failure.

---

## Antiques-specific signal priorities

Unlike musical instruments (where era + maker are often visually obvious), antiques frequently require attention to:

1. **Patina authenticity** — age-consistent wear patterns vs artificial distressing. Call out "artificially aged" or "reproduction" flags directly in `rationale` when visible.
2. **Construction technique** — square nails (pre-1890s), machine-cut dovetails (post-1860s), hand-cut dovetails (pre-1870s wider variation), steel screws (post-1850s).
3. **Material signatures** — bakelite vs celluloid vs modern plastic; oxidation pattern on silver vs silverplate; period-appropriate glass composition.
4. **Regional origin clues** — American vs English vs Continental European construction idioms. When a maker is unknown, origin narrows the pricing comp set significantly.
5. **Secondary marks** — retailer labels, repair stamps, customs marks, export hallmarks. These often outweigh primary maker marks for provenance chain.

---

## Cost + latency budget

- **Cost:** ~$0.003–0.005 per Antiques fire (Sonnet input ~6k tokens cache-hit-eligible after first call, output ~200 tokens).
- **Latency:** ~1.5–3s on the specialty call. Runs serially after the merge + validations, before MI / pricing parallel block — so it extends total AnalyzeBot latency on antique items only.
- **Volume:** Antiques are a medium-frequency category in LegacyLoop inventory (estate-customer segment). Expect ~15-25% of analyses fire this pass. Blended cost impact: < $0.001 per average analysis.

If latency exceeds 5s p95 on antique items, shorten the prompt. If cost exceeds $0.01 per fire, reduce max_tokens.

---

## Preservation

- Merged `analysis` object is **NEVER** mutated by the specialty pass.
- The antique-preservation logic (~lines 584-595 of `route.ts`) runs on the merged analysis and is unaffected. A prior-confirmed antique stays confirmed regardless of specialty result.
- AntiqueBot (separate downstream bot) reads `_specialtyDetail` during its own authentication pass. The specialty pass is a primer for AntiqueBot, not a replacement.

---

## Telemetry

- **`ANALYZEBOT_CATEGORY_DEEP_DIVE`** — single event type shared across all specialty packs. Payload distinguishes via `kind: "antique"` and `categoryLabel: "Antiques"` (synthetic label for telemetry; AnalyzeBot's category enum doesn't include `"Antiques"` — is_antique is a boolean flag).
  Payload contract:
  - `category: "Antiques"`
  - `kind: "antique"`
  - `durationMs`
  - `extractedFields` — array of keys that ended up non-null
  - `secondaryConfidence` — the specialty pass's own confidence
  - `succeeded: boolean`
- **Response JSON** — `specialtyDetail` field continues to carry the unified `SpecialtyDetail` shape; `kind: "antique"` distinguishes antiques from MI.

---

## Why this matters

Antique items are the estate-customer segment's core inventory. A Victorian sideboard mis-classified as "generic furniture, fair condition" prices to $150 formula. Correctly identified as Eastlake-revival circa 1885 with original brass hardware, it prices to $800-1,400 with the estate-auction comp set. That's the seller's rent vs the buyer's bargain of the decade. Every downstream bot inherits the distinction — PriceBot's `antiques_art` weight profile weights `analyzebot_estimate` at 0.95 (vs 0.60 for commodity), ListBot writes "Fine American Eastlake sideboard, c.1885" instead of "Old wooden cabinet," BuyerBot persona-matches to collectors rather than generic furniture buyers.

This pack makes AnalyzeBot's opening identification accurate for the estate segment. The rest of the pipeline compounds from there.

---

## One-line summary

**When we know it's an antique, we read the signatures.**
