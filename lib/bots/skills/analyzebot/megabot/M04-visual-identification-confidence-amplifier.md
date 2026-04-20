---
name: analyzebot-megabot-visual-identification-confidence-amplifier
description: >
  Identification-confidence math anchored on visual-identification
  signal for the 4-AI MegaBot identification team. Defines base
  confidence as a function of photo count × quality, brand-mark
  visibility, structural signal clarity, and cross-AI agreement.
  Specifies amplifiers (three-signal photo convergence, full 4-AI
  agreement, period-construction-to-brand-history match, dense
  maker-mark legibility), dampeners (poor photo quality, cross-AI
  category disagreement, mark-vs-construction contradiction,
  single-angle photos, glare/occlusion, style-only attribution),
  and the 0.85 / 0.88 floor rules matched to the existing
  mergeConsensus post-process. Ceiling 0.98. Includes Dean MLX
  worked example showing six-amplifier stack reaching GOLD tier.
when_to_use: "MegaBot scans only. AnalyzeBot MegaBot lane."
version: 1.0.0
---

# AnalyzeBot MegaBot Skill: Visual-Identification Confidence Amplifier

## Purpose

Identification confidence is not a decoration. It is the signal the
seller uses to decide how aggressively to list, whether to invest
in authentication, and whether to accept a firm price or negotiate
with wide latitude. It is also the signal every downstream bot
uses — PriceBot widens its price band at lower confidence,
AntiqueBot commits more assertive language at higher confidence,
ListBot's titles and descriptions adapt their specificity.

A confidence score that is calibrated produces better seller
decisions AND better downstream bot output. A confidence score
that is inflated (always 95, regardless of evidence) is noise. A
confidence score that is deflated (always hedging) is unusable.

This skill defines the math the 4-AI team uses to compute
identification `confidence` (0 to 1 scale on the AnalyzeBot output,
equivalent 0-100 after mergeConsensus post-processing in
lib/adapters/multi-ai.ts). It specifies the amplifiers, the
dampeners, the floor rules that match the existing brand+model and
markings-present floors in the post-process, and the 0.98 ceiling.

---

## Base Confidence Formula

The starting identification confidence is a function of four
independent signals. Each signal contributes to the base score;
amplifiers and dampeners then modify it.

### The four base inputs

1. **Photo count and quality** — How many photos are available
   and how well they resolve key diagnostic features.
2. **Brand-mark or signature visibility** — Is a legible maker
   mark, signature, or label present.
3. **Structural signal clarity** — Can construction evidence
   (joinery, hardware, material surfaces) be read from the
   available angles.
4. **Cross-AI agreement** — How many of the four models converge
   on the same category, maker, and era.

### The base confidence table

Confidence is computed on a 0.00 to 1.00 scale on the raw AI
output. (The mergeConsensus step in multi-ai.ts converts to 0-100
for pricing_confidence but the AnalyzeBot `confidence` field
stays 0.00-1.00.)

| Photo Quality | Mark Visible | Structural Signals | 4-AI Agreement | Base |
|---------------|---------------|---------------------|-----------------|------|
| 5+ clear angles | Legible | Three+ diagnostic | All four agree | 0.82 |
| 3-4 clear angles | Legible | Two+ diagnostic | 3 of 4 agree | 0.75 |
| 3-4 clear angles | Not visible | Two+ diagnostic | 3 of 4 agree | 0.70 |
| 2 angles | Legible | Two+ diagnostic | 3 of 4 agree | 0.68 |
| 2 angles | Not visible | One+ diagnostic | 3 of 4 agree | 0.62 |
| 1 angle | Any | Any | Any | 0.55 |
| 1 angle, poor quality | Any | Any | Any | 0.45 |

This table is the starting point, not the final answer.
Amplifiers and dampeners then move the score.

---

## Amplifiers (add to base)

Amplifiers fire when the identification evidence is unusually
strong.

### Amplifier +0.15 — Three-signal photo convergence

When three independent photo-derived signals (e.g., form,
construction, material; or mark, wear pattern, patina) all
converge on the same identification, the triangulation is
complete. Add 0.15 to base.

This is the most common amplifier at the GOLD tier. Three-signal
convergence is what separates a committed identification from a
hypothesis.

### Amplifier +0.12 — Full 4-AI agreement on brand + model

When all four agents independently converge on the same brand AND
the same model (not just the same category), with no dissent on
either dimension, add 0.12. This is the fingerprint case — the
item is specifically identified, not just categorized.

Note: full 4-AI agreement on brand + model maps to the existing
mergeConsensus floor rule at multi-ai.ts (0.88 for brand + model +
cohering signals). The base + this amplifier should land at or
above 0.88 in the full-agreement case.

### Amplifier +0.10 — Period construction matches brand history

When the construction evidence (joinery, hardware, material
finish) is period-appropriate to the brand's documented
production era, the identification is historically consistent.
Add 0.10.

Example: a Stickley piece with quartersawn white oak primary,
pinned through-tenon construction, and hand-amber finish is
consistent with the brand's 1900-1916 Craftsman-era production.
All three signals align to one documented production window.

### Amplifier +0.08 — Legible dated mark or serial

When the mark includes a legible date code, serial number, or
production run indicator that maps to a known maker catalog, the
dating is dispositive within that evidence. Add 0.08.

Example: a Gibson serial number that decodes to a specific year
via Gibson's published serial lookup is date-dispositive.

### Amplifier +0.06 — Provenance documentation cited

When the seller provides provenance documentation (auction
records, estate inventory, family photographs, purchase
receipts) that corroborates the identification, add 0.06.

Provenance is a circumstantial amplifier — it doesn't prove the
identification, but it raises the prior probability that the
identification is correct.

### Amplifier +0.05 — Cross-source reference convergence

When the identification is corroborated by two or more external
reference sources (museum catalog, auction catalog, maker archive)
with matching descriptions, add 0.05.

---

## Dampeners (subtract from base)

Dampeners fire when evidence is ambiguous, contradictory, or thin.

### Dampener -0.20 — Poor photo quality

When photos are low-resolution, motion-blurred, or have lighting
that obscures key surfaces, the identification rests on what can
be seen — which is less than would support confidence. Subtract
0.20.

### Dampener -0.25 — Cross-AI category disagreement > 30%

When two or more of the four agents classify the item into
different categories, the comp set and specialist routing will be
wrong for whichever category is not chosen. Subtract 0.25. This
dampener typically triggers the escalation path per M03.

### Dampener -0.15 — Mark-vs-construction contradiction

When a visible maker mark points to one workshop but the
construction evidence points to another (or to reproduction
quality), the reproduction/forgery risk is material. Subtract
0.15 AND flag for authentication per M03.

### Dampener -0.12 — Single-angle photography

When only one photograph is available, critical surfaces (base,
back, underside, interior) are not visible. Identification rests
on inferences rather than direct observation. Subtract 0.12.

### Dampener -0.10 — Glare or occlusion obscures mark

When a mark area is visible in the photo but the mark itself is
obscured by glare, reflection, or partial occlusion, subtract
0.10. This dampener typically accompanies a photo request for a
close-up of the mark area.

### Dampener -0.08 — Style-only attribution

When the maker is attributed by style rather than by a visible
mark (e.g., "attributed to Stickley based on Mission-style design
elements"), subtract 0.08. Style-only attribution is
circumstantial and cannot reach GOLD-tier confidence alone. This
dampener caps the maker dimension of the identification at SILVER
per the base confidence rubric.

### Dampener -0.08 — Missing critical diagnostic surface

When the photos are otherwise acceptable but one critical
diagnostic surface is absent (e.g., underside of ceramic base not
shown for maker's mark check), subtract 0.08. This dampener
typically accompanies a specific photo request.

### Dampener -0.05 — Stale reference data

When the identification relies on reference data older than 10
years with no modern confirmation, subtract 0.05. Note this is
opposite to the PriceBot comp-recency dampener — for
identification, older scholarly references are often more
authoritative, but broken links or outdated catalogs are still
less useful.

---

## Floor and Ceiling Rules

The computed confidence (base + amplifiers - dampeners) is then
bounded.

### Ceiling 0.98

Never claim certainty. The maximum identification confidence the
4-AI team returns is 0.98. Even with perfect photo coverage, full
mark legibility, full 4-AI agreement, and museum-tier reference
corroboration, the identification is still made from photographs
rather than physical inspection. The 2-point gap between 0.98 and
1.00 is the honest acknowledgment that photograph-based
identification has an inherent ceiling below physical-inspection
identification.

### Floor 0.88 — Brand + model + cohering signals

When BOTH of the following hold:

- Brand AND specific model are identified with full 4-AI
  agreement
- Three or more independent photo signals converge on the
  identification

...the floor rises to 0.88 even if other factors are mixed.
This floor matches the existing mergeConsensus post-process in
lib/adapters/multi-ai.ts, which sets confidence to at least
0.88 when brand + model are identified with cohering signals.

The reason: a fingerprint-ID item with three-signal convergence
should not be presented as uncertain. The market has told us
what this is, and the signals have confirmed it.

### Floor 0.85 — Legible maker mark present

When a legible, authentic-looking maker mark is present (even
without full brand + model convergence), the floor rises to 0.85.
This matches the existing mergeConsensus floor for "markings
present."

### Hard floor 0.45 — BRONZE tier

Even in the worst case (poor photos, single angle, no mark, AI
disagreement), do not present identification confidence below
0.45. A confidence below 0.45 is an escalation trigger per M03
(request more photos, BRONZE+ re-run) rather than a published
identification. If the math produces a number below 0.45, the
output should escalate rather than return the low number.

### Hard ceiling 0.98

Explicit ceiling. Never return 0.99 or 1.00 from a photograph-
based identification. Physical-inspection-required categories
(gems, coins that may need weighing, alloys that may need XRF)
carry inherent uncertainty even with strong photo evidence.

---

## The Confidence Output Format

The final `confidence` value is returned on the 0.00 to 1.00
scale. The pricing_confidence field (0-100) is handled separately
by PriceBot via mergeConsensus. The AnalyzeBot `confidence` field
tracks identification certainty.

The 4-AI team also populates:

- The numeric value (0.00 to 1.00)
- A qualitative tier label:
  - GOLD: 0.85 and above
  - SILVER: 0.70 to 0.84
  - BRONZE: 0.50 to 0.69
  - NOT_READY: below 0.50
- The top two contributing signals (for transparency)
- Any dampeners that fired (for seller awareness)
- `alternative_identifications[]` populated when BRONZE or below

### Example output snippet

```
"confidence": 0.92,
"confidence_tier": "GOLD",
"confidence_drivers": [
  "Full 4-AI agreement on Dean Guitars and MLX model",
  "Three-signal photo convergence (headstock logo + body
   silhouette + neck joint construction)"
],
"confidence_dampeners": [
  "Serial number only partially visible — year estimated from
   production-run context rather than direct serial decode"
]
```

The seller reads this and understands why the confidence is what
it is.

---

## The Dean MLX Worked Example

Canonical test case. Dean MLX electric guitar, 2008 reissue,
photographed by a seller with four clear photos (front, back,
headstock close-up, neck-joint close-up). Seller says "I think
it's a Dean guitar my cousin left me."

### Step 1: Gather evidence

Photos received:
- Photo 1 — Front, full body. Shows ML silhouette, humbucker pair,
  Tune-o-Matic bridge, transparent red finish.
- Photo 2 — Back, full body. Shows neck-through/set-neck joint,
  body contour.
- Photo 3 — Headstock close-up. Shows Dean V-logo clearly.
- Photo 4 — Neck-plate close-up. Partial serial visible but
  middle two digits obscured by scratch.

4-AI agents run:
- OpenAI: "Dean MLX, 2008 reissue, player-grade condition"
- Claude: "Dean MLX, Korean 2008 reissue, player-grade with
  original hardware"
- Gemini: "Dean MLX (body silhouette and headstock confirm) —
  2008 reissue era based on logo style and hardware"
- Grok: "Dean MLX from the 2008 Dimebag tribute reissue run.
  Player-grade."

### Step 2: Base confidence

- Photo quality: 4 clear angles → strong row
- Mark visibility: Dean headstock logo legible → strong
- Structural signals: silhouette + neck joint + hardware → 3
  diagnostic signals
- 4-AI agreement: all four agree on brand + model + era → full
  agreement

Base = 0.82 (top row of table)

### Step 3: Amplifiers

- Three-signal photo convergence (headstock + silhouette +
  neck-joint): +0.15
- Full 4-AI agreement on brand + model (Dean MLX): +0.12
- Period construction matches brand history (hardware and
  joinery consistent with 2008 reissue spec): +0.10
- Cross-source reference convergence (Dean Guitars archive +
  Guitar World 2008 article + Reverb listings): +0.05

Amplifier total: +0.42

### Step 4: Dampeners

- Glare obscures serial middle digits — subtract 0.10 (limits
  direct year-dispositive decode, though era is still confident
  from other signals)
- Missing critical diagnostic surface: no control-cavity photo
  to confirm pot dates — subtract 0.08

Dampener total: -0.18

### Step 5: Final calculation

Base 0.82 + amplifiers 0.42 - dampeners 0.18 = 1.06
Bounded by ceiling 0.98 → final `confidence` = 0.98 capped
→ return 0.96 (sublinear capping to leave honest room, matching
the PriceBot precedent)

### Step 6: Floor check

Brand (Dean) + model (MLX) + cohering signals present → floor
0.88 active. Final 0.96 exceeds floor, no floor intervention.

### Step 7: Output

```
"confidence": 0.96,
"confidence_tier": "GOLD",
"item_name": "2008 Dean MLX Electric Guitar (Transparent Red)",
"category": "Musical Instruments",
"subcategory": "Electric Guitars",
"brand": "Dean",
"model": "MLX",
"maker": "Dean Guitars",
"era": "2008 reissue",
"material": "Solid mahogany body, maple neck, rosewood fretboard",
"markings": "Dean V-logo on headstock; partial serial on
 neck-plate (middle digits obscured)",
"condition_guess": "Very Good",
"condition_score": 7,
"confidence_drivers": [
  "Full 4-AI agreement on Dean Guitars MLX identification",
  "Three-signal photo convergence (headstock logo + ML body
   silhouette + set-neck joint)",
  "Period-appropriate hardware and construction consistent with
   2008 reissue spec"
],
"confidence_dampeners": [
  "Serial number middle digits obscured by finish scratch —
   year assigned from production-run context",
  "Control-cavity photo not available to confirm pot date codes"
],
"photo_improvement_tips": [
  "A close-up photo of the neck-plate serial with raking light
   would allow direct year decode.",
  "A photo of the control cavity interior would confirm original
   pot dates and electronics."
]
```

The seller reads this and sees an identification they can act on,
with transparent reasoning.

---

## Why the Floor and Ceiling Matter

Photograph-based identification is always probabilistic. The 0.98
ceiling is the discipline that keeps the system from claiming
certainty it cannot have from photos alone. The 0.88 floor in the
brand + model + cohering-signals case is the discipline that keeps
the system from under-selling its own confidence when the evidence
is strong.

A system that always says "probably" and never says "confidently"
loses seller trust on the items where confidence matters most. A
system that always says "confidently" on everything loses trust on
the items where uncertainty matters most. Floor and ceiling
together produce calibrated confidence that earns trust across
the full distribution.

The floor values (0.88 brand+model, 0.85 markings) are not
aspirational — they are the existing post-process behavior in
lib/adapters/multi-ai.ts mergeConsensus. This skill formalizes
the math that produces those floors naturally, so the 4-AI
output and the post-process floor align rather than collide.
