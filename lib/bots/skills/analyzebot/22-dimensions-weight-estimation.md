# AnalyzeBot Skill Pack 22 — Dimensions + Weight Estimation Discipline (V10)

**Added:** CMD-ANALYZEBOT-DIMS-WEIGHT-ESTIMATION (April 30, 2026)
**Engine bump:** V9b → V10 (additive capability on V9b base)
**Supersedes nothing.** Packs 01-21 preserved. This pack governs how AnalyzeBot populates the `dimensions` and `weight_lbs` fields. It closes a production bug where these fields landed null on items with recognizable standard form factors, breaking the Shipping Center, ListBot title generation, and BuyerBot size-class filtering.

---

## Policy

Every analysis must populate `dimensions` and `weight_lbs` whenever the item type implies a recognizable standard form factor. Null is reserved for genuinely indeterminate cases (raw materials, liquids, custom one-off pieces with no standard reference).

### Required output fields

```json
{
  "dimensions": {
    "length_in": <number | null>,
    "width_in": <number | null>,
    "height_in": <number | null>,
    "confidence": <number 0.0-1.0>,
    "source": "type_inference" | "photo_scale_reference" | "explicit_marking" | "indeterminate"
  },
  "weight_lbs": <number | null>,
  "weight_confidence": <number 0.0-1.0>,
  "weight_source": "type_inference" | "photo_scale_reference" | "explicit_marking" | "indeterminate"
}
```

### Confidence scale

- **0.85-1.0:** Item type has a tight standard range (e.g., electric guitar 38-40 inches long); photo confirms standard form factor.
- **0.65-0.84:** Item type has a wider standard range (e.g., sofa 72-96 inches long); midpoint is a reasonable estimate.
- **0.45-0.64:** Item is unusual within its category (e.g., custom-built furniture); estimate uses category midpoint with explicit hedge in `source`.
- **Below 0.45:** Item is genuinely indeterminate. Set values to null and `source: "indeterminate"`. Do NOT guess wildly.

### Null is reserved for these cases ONLY

- Raw materials (lumber piles, fabric bolts) where the seller hasn't specified a unit.
- Liquids, powders, granular goods sold by volume not item.
- Custom one-off items with no standard analogue (commissioned art, unique sculptures).
- Items where the photo is too unclear to determine even the item type.

For all other items, estimate. Null on a recognizable item is a bug.

---

## Reference table (anchor data the LLM should internalize)

The LLM does NOT need to memorize this table during analysis — these are illustrative anchors so the model knows the expected precision band.

| Category | Item type | Length (in) | Width (in) | Height (in) | Weight (lbs) |
|---|---|---|---|---|---|
| Musical Instruments | Electric guitar | 38-40 | 13-15 | 3-4 | 7-10 |
| Musical Instruments | Acoustic guitar | 40-42 | 15-17 | 4-5 | 3-5 |
| Musical Instruments | Bass guitar | 44-48 | 13-15 | 3-4 | 8-12 |
| Musical Instruments | Upright piano | 58-62 | 24-28 | 48-52 | 400-600 |
| Musical Instruments | Violin (full size) | 23-24 | 8-9 | 2-3 | 1.0-1.5 |
| Furniture | Standard sofa | 84-90 | 36-40 | 32-36 | 80-120 |
| Furniture | Loveseat | 60-72 | 32-36 | 32-36 | 50-80 |
| Furniture | Dining chair | 18-22 | 18-22 | 32-40 | 12-25 |
| Furniture | Recliner | 36-42 | 36-40 | 38-44 | 60-100 |
| Furniture | Coffee table | 42-54 | 22-30 | 16-20 | 30-60 |
| Furniture | Dining table (6-seat) | 60-72 | 36-42 | 28-30 | 80-150 |
| Furniture | Dresser (6-drawer) | 56-64 | 18-22 | 32-40 | 90-150 |
| Furniture | Nightstand | 18-24 | 16-20 | 24-30 | 25-50 |
| Furniture | Bed frame (queen) | 80-86 | 60-64 | 14-50 | 60-150 |
| Electronics | TV (50-inch) | 44-46 | 26-28 | 3-4 | 30-45 |
| Electronics | TV (65-inch) | 57-59 | 33-35 | 3-4 | 50-65 |
| Electronics | Laptop (15-inch) | 14-15 | 9-10 | 0.7-1.0 | 4-6 |
| Appliances | Microwave (countertop) | 18-22 | 14-18 | 11-13 | 30-45 |
| Appliances | Full-size refrigerator | 28-36 | 28-36 | 66-72 | 200-300 |
| Tools | Cordless drill | 8-10 | 3-4 | 9-11 | 3-5 |
| Outdoor | Riding mower (residential) | 60-72 | 36-44 | 36-44 | 350-500 |
| Outdoor | Push mower | 24-32 | 20-24 | 36-42 | 50-90 |
| Sports | Bicycle (adult) | 65-72 | 22-26 | 38-44 | 18-32 |
| Antiques | Hutch / china cabinet | 36-48 | 16-22 | 72-84 | 150-300 |
| Antiques | Roll-top desk | 48-60 | 28-34 | 44-52 | 150-250 |

These are anchors, not constraints. Real items may fall outside these ranges; use type inference + photo cues to refine.

### When the photo provides scale reference

If the photo includes a known-size object (banana, coin, ruler, person, stud wall), use it. Increase confidence to 0.85+ when scale reference is present and reliable. Note `source: "photo_scale_reference"` in the output.

### When the seller has labeled dimensions on the item

If a manufacturer's label, sticker, plaque, or stamp shows explicit dimensions, use those values verbatim. Confidence 1.0. Note `source: "explicit_marking"`.

---

## Layered defense (F1 pit-crew discipline)

This pack is the prompt layer. Future banked work:

1. **Schema layer** (banked): formalize `dimensions` shape in TypeScript types and Prisma JSON validation.
2. **Runtime layer** (banked): a `applyDimensionsBackfill()` helper in `lib/bots/analyzebot/dimensions-post-process.ts` that fills in category-default dimensions when the LLM fails to populate them despite a clear category match.
3. **Telemetry layer** (banked): add `ANALYZEBOT_DIMS_NULL` event when null dims persist on a known-category item — surfaces silent regressions.

For now, the prompt layer alone closes the production bug.

---

## Preservation

- Specialty deep-dive packs (19 musical-instruments, 20 antiques) continue to populate their own `_specialtyDetail` fields. This pack adds dimensions/weight to the **top-level** analysis output, not nested under specialty.
- Pack 21 (sale-method-discipline) regional logic is unaffected. LOCAL_PICKUP items still null national-scope regional fields; this pack adds dims/weight regardless of saleMethod.
- Confidence calibration (pack 14) applies to dims/weight confidence the same way it applies to identification confidence. Honest hedging is the standard.

---

## Telemetry

Existing `ANALYZED` event payload extends additively with:

- `dimensions_populated: boolean` — true if all three dimension axes are non-null
- `weight_populated: boolean` — true if weight_lbs is non-null
- `dims_confidence: number` — the confidence value reported by the LLM
- `dims_source: string` — one of: type_inference, photo_scale_reference, explicit_marking, indeterminate

Banked: dashboard tile in CMD-LITELLM-COST-DASHBOARD showing % of analyses landing populated dims vs null dims, by category. Surfaces silent regressions.

---

## Why this matters

- Shipping Center (free, drives commission) cannot quote a carrier rate without dimensions and weight. Null breaks the workflow.
- ListBot pulls dimensions into listing copy. eBay's "Item specifics" require dimensions for furniture, electronics, vehicles. Null produces incomplete listings that don't rank.
- BuyerBot filters by size class (small / medium / large / oversized) for logistics-sensitive buyers. Null routes the item to the wrong audience.
- A single skill pack closes the gap for all three downstream bots.

The cost is small: ~50 additional output tokens per analysis (~$0.0001 per fire on Sonnet). The benefit is large: shipping rates, listing quality, buyer matching all unblock.

---

## One-line summary

**If we know what kind of thing it is, we know how big it is. Null is a bug.**
