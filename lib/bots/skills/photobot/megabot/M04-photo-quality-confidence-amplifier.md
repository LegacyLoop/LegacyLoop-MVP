---
name: photobot-megabot-photo-quality-confidence-amplifier
description: >
  Confidence math anchored on photo-quality signal for the 4-AI
  MegaBot PhotoBot team. Defines base confidence as a function of
  photo count × quality, angle coverage, lighting cohesion, and
  cross-AI agreement. Specifies amplifiers (pro quality + full
  coverage, scale reference, maker mark present, damage documented),
  dampeners (focus failure, single-angle-only, stock imagery, color
  cast), the 0.88 floor / 0.98 ceiling rule, and how overallPhotoScore
  maps 0-100 to the scoring panel sub-fields. Includes the Dean MLX
  worked example showing a 7-photo set amplified to 0.93 confidence.
when_to_use: "MegaBot scans only. PhotoBot MegaBot lane."
version: 1.0.0
---

# PhotoBot MegaBot Skill: Photo-Quality Confidence Amplifier

## Purpose

MEGA_PHOTO's 12-field scoring panel is only as credible as the
confidence behind it. A panel that returns "all 10s" on every
listing is noise. A panel that returns calibrated scores with
honest confidence produces seller decisions that create real
price lift.

This skill defines the math the 4-AI team uses to compute
overallPhotoScore and the confidence that should accompany the
per-field scores. Amplifiers and dampeners work off the same
base-score-plus-modifiers pattern used by PriceBot M04 and
AnalyzeBot M04, but the signals are photo-specific: sharpness
quality, angle coverage, lighting cohesion, specialist-mark
documentation, condition transparency.

A properly calibrated PhotoBot confidence output produces better
priorityAction selection (the specialist knows when to call for
re-shoot vs minor polish), better enhancementVariations
bestFor targeting (the specialist knows which variations will
actually lift the score), and better priceImpactEstimate
accuracy (the specialist knows the realistic price lift vs
wishful projection).

---

## Base Confidence Formula

Starting confidence is a function of four independent signals.
Each contributes to the base score; amplifiers and dampeners
then modify it.

### The four base inputs

1. **Photo quality × count** — how many photos at what average
   sharpness and exposure quality
2. **Angle coverage** — what percentage of the category's
   required angles are present
3. **Lighting cohesion** — whether white balance and exposure
   are consistent across the set
4. **Cross-AI agreement** — how tightly the four specialist
   agents agree on scoring (tight agreement = high confidence,
   dispersion = low confidence)

### The base confidence table

Confidence is computed on a 0 to 100 scale (matches MEGA_PHOTO
overallPhotoScore range when converted from 1-10 to percentile).
Base value before modifiers:

| Photo Quality | Angle Coverage | Lighting | Cross-AI | Base |
|---------------|----------------|----------|----------|------|
| Pro + 7+ ct | 100% required | Consistent | Tight agree | 80 |
| Pro + 5-6 ct | 80-100% | Consistent | Tight | 74 |
| Good + 5+ ct | 80-100% | Mostly consistent | Tight | 68 |
| Good + 3-4 ct | 60-80% | Some variation | Loose | 58 |
| Amateur + 3+ ct | 40-60% | Variable | Loose | 48 |
| Amateur + 1-2 ct | <40% | Variable | Dispersed | 35 |
| Single photo | N/A | N/A | N/A | 25 |

This is the anchor. Amplifiers and dampeners shift from here.

---

## Amplifiers (add to base)

Amplifiers fire when photo-quality signals are unusually strong
or category-specific trust evidence is present.

### Amplifier +15: Pro-quality photos + full angle coverage +
consistent lighting

The full-stack signal. When all three hold:
- Subject is tack-sharp in every shot
- 100 percent of category's required angles present
- Color temperature and exposure consistent across the set

Add 15 to base. This fires on roughly the top 8 percent of
real-world listings.

### Amplifier +12: Scale reference + context shot present

Scale reference shot (ruler, coin, hand, known object) PLUS
one context shot that anchors the item in realistic use or
environment. Together these improve scaleClarity AND
emotionalAppeal — a double-field boost.

Add 12 to base.

### Amplifier +10: Maker mark / serial number / label
readable

Category-specific trust signal. For musical instruments, watch
movements, jewelry hallmarks, designer apparel tags, antique
maker stamps — when the authenticating mark is photographed
cleanly enough to read, the listing's trust signal jumps
dramatically.

Add 10 to base.

### Amplifier +8: Damage / wear documented in dedicated
close-ups

Transparency is trust. When a listing has visible wear or
damage AND dedicates a close-up shot to that wear (not hiding
it in a wide shot), buyer trust increases measurably.
Counterintuitively, the listing with documented damage closes
faster than the listing that obscures damage — buyers trust
the seller's honesty more than the item's perfection.

Add 8 to base.

### Amplifier +6: Condition consistency across photos

When condition signals across all photos are consistent (same
wear patterns visible from multiple angles, same finish state
regardless of lighting), the listing reads as verified and
coherent.

Add 6 to base.

### Amplifier +5: Category-specific hero shot executed well

When the category's specific hero (MI headstock, furniture
3/4 angle, jewelry top-down, watch dial) is present AND
executed with competent framing, it signals specialist
seller awareness.

Add 5 to base.

---

## Dampeners (subtract from base)

Dampeners fire when photo evidence is weak, inconsistent, or
counter-signaling.

### Dampener -25: Single-angle-only on 3+-angle-required
category

Music instrument with only a front-body shot. Vehicle with
only a driveway shot. Antique furniture with only a front
elevation.

Subtract 25. Also add to priorityAction as listing-blocker.

### Dampener -20: Focus failure or motion blur on any photo

When any photo in the set shows significant blur or focus
failure, the listing reads as unreliable. Even the non-blurry
photos lose credibility because the seller has demonstrated
inability to consistently produce sharp work.

Subtract 20. The specific blurry photo goes into
priorityAction with re-shoot instructions.

### Dampener -15: Stock image or watermark detected

Provenance red flag. Subtract 15. Route to priorityAction
with mandatory before-publish re-shoot requirement.

### Dampener -12: Inconsistent lighting / color cast

Mixed white balance, some photos warm and others cool, or a
single heavy color cast that misrepresents the item's actual
color.

Subtract 12. Surface in priorityAction or first
secondaryAction.

### Dampener -10: Background clutter on hero shot

Distracting background on the primary click-through photo.
Not listing-blocking but measurably reduces click-through.

Subtract 10.

### Dampener -8: Under-exposure or over-exposure beyond
tolerance

Exposure so extreme that detail is lost — blown whites hiding
texture, or crushed shadows hiding hardware.

Subtract 8.

### Dampener -5: Missing scale reference on size-ambiguous
category

Small item (jewelry, electronics, collectibles) photographed
without any size context.

Subtract 5.

### Dampener -5: Missing maker mark / serial on
authentication-required category

Musical instrument, watch, designer apparel, hallmarked
silver — when the authenticating mark is missing from the
set entirely.

Subtract 5. Route to secondaryAction with specific shot
request.

---

## Floor and Ceiling Rules

The computed confidence (base + amplifiers - dampeners) is
bounded.

### Ceiling 98

Never claim absolute certainty. The maximum confidence the
4-AI team returns on a photo assessment is 98 out of 100.
Even with perfect coverage and execution, there is always
a possibility that an unseen angle reveals an issue or a
buyer has a category-specific preference the photos don't
address.

### Floor 88 (under specific conditions)

When BOTH of the following hold:
- 5+ pro-quality photos with full category coverage
- All amplifiers in the +10 or higher tier fire

...the floor rises to 88 even if other factors are mixed.
The reason: a well-executed photo set with tight category
coverage should not be presented as uncertain even if minor
dampeners fire, because the core evidence is strong.

This pattern matches PriceBot M04's 0.85 floor on tight-
ID tight-comp cases. The principle is the same: calibrated
confidence earns trust across the distribution.

### Hard floor 25

Even in the worst case (single photo, blurry, watermarked),
do not return below 25. A score that low is an escalation
trigger — the listing is not ready for publication, and the
output should route heavily to priorityAction re-shoot
instructions.

---

## How overallPhotoScore Maps to the Scoring Panel

The MEGA_PHOTO scoring panel returns 12 fields on a 1-10 scale.
The overallPhotoScore is the composite, but each sub-field has
its own calibration.

### The sub-field weighting

When computing overallPhotoScore from the 12 sub-fields:

- presentationScore: 12% weight
- backgroundScore: 8%
- lightingScore: 12%
- compositionScore: 8%
- colorFidelity: 8%
- detailCapture: 12%
- sharpnessScore: 12%
- exposureAccuracy: 8%
- scaleClarity: 6%
- emotionalAppeal: 6%
- mobileRendering: 8%

Totals to 100. The weighted average of the sub-field scores
produces overallPhotoScore on the same 1-10 scale, then
multiplied by 10 to convert to the 0-100 confidence scale.

### Why sub-fields matter

Two listings can both have overallPhotoScore 7/10 but for
different reasons — one weak on lighting, one weak on
detail. The sub-field breakdown tells the seller exactly
what to improve. Returning only the composite score loses
the signal that drives action.

---

## Cross-AI Agreement Modifier

The 4-AI panel runs independently. When all four agents
arrive at similar scores (within 1 point on a 10-point scale
across the 12 fields), agreement is TIGHT and confidence
stays at or near base. When agents diverge by 2+ points on
multiple fields, agreement is LOOSE and confidence drops 5-10
points to reflect ambiguity.

### Agreement interpretation

- All 4 agents within 1 point on 10+ of 12 fields: TIGHT,
  no adjustment
- 3 of 4 agents within 1 point, 1 outlier: MOSTLY TIGHT,
  -3 to confidence
- Split 2-2 on multiple fields: LOOSE, -6 to confidence
- All 4 agents scattered: DISPERSED, -10 to confidence and
  route to priorityAction as "photo set is genuinely
  ambiguous — recommend seller provide additional context"

### What divergence usually means

- **Dispersed on presentation**: the photos are hard to
  categorize (part amateur, part pro)
- **Dispersed on lighting**: mixed lighting across the set
- **Dispersed on composition**: hero shot is borderline
- **Dispersed on detail**: key feature partially visible

The divergence pattern itself informs secondaryActions —
the specific area of disagreement is usually the area
requiring additional photos or re-shoots.

---

## The Confidence Output Format

The final photo-quality confidence is returned in the
MEGA_PHOTO output's overallPhotoScore and is also the basis
for the executive summary language. Additionally, the 4-AI
team returns:

- The numeric overallPhotoScore (1-10 scale)
- Per-field sub-scores (the 12-field panel)
- The top 2 contributing strengths (what drove the score up)
- The top 2 contributing weaknesses (what drove the score
  down)

### Example confidence framing in output

```
"overallPhotoScore": 7,
"confidence": 84,
"confidence_drivers": [
  "7 photos with full coverage of Reverb's required triad
   (headstock, serial, damage close-up)",
  "Consistent natural window lighting across the entire set"
],
"confidence_dampeners": [
  "Photo 5 (fret close-up) shows slight motion blur — soften
   points but not disqualifying"
]
```

---

## The Dean MLX Worked Example

Canonical test case. Dean MLX 2008 reissue, player-grade, 7
photos submitted for MegaBot PhotoBot assessment.

### Step 1: Inventory the photos

1. Full body front, against linen backdrop, natural window
   light from camera left — sharp, well-framed
2. Full body back, same backdrop, same lighting — sharp
3. Headstock front, close enough to see Dean logo and tuner
   layout — tack-sharp, well-exposed
4. Headstock back with serial number — serial readable,
   slight glare on stamp but acceptable
5. Fret close-up — slight motion blur, frets discernible but
   not tack-sharp
6. Damage close-up (ding on upper horn) — sharp,
   well-documented
7. Case with hang tags — sharp, in context

### Step 2: Score the sub-fields

- presentationScore: 8 (clean linen backdrop, consistent)
- backgroundScore: 9 (seamless linen, zero clutter)
- lightingScore: 8 (consistent natural window light)
- compositionScore: 8 (well-framed, item fills frame
  appropriately)
- colorFidelity: 8 (transparent red reads accurately)
- detailCapture: 8 (logo, serial, damage all visible)
- sharpnessScore: 7 (photo 5 brings this down from 8)
- exposureAccuracy: 8 (well-exposed throughout)
- scaleClarity: 6 (case provides some scale context; no
  explicit reference)
- emotionalAppeal: 8 (case + hang tags tells ownership
  story)
- mobileRendering: 8 (hero shot reads clearly at phone
  size)

Weighted average: ~7.8 → overallPhotoScore 8

### Step 3: Base confidence

- Photo quality × count: Pro + 7 ct → base 80
- Angle coverage: 6 of 7 Reverb-required angles (missing
  neck-joint) → 85%
- Lighting cohesion: Consistent → good
- Cross-AI agreement: TIGHT (all 4 agents within 1 point
  on 11 of 12 fields)

Base = 78

### Step 4: Amplifiers

- Pro quality + near-full coverage + consistent lighting:
  +12 (not full +15 because missing neck joint)
- Scale context (case present, hand not needed): +8 (not
  full +12 because no explicit reference shot)
- Maker mark + serial readable: +10
- Damage documented in dedicated close-up: +8
- Category-specific hero (headstock close-up) executed
  well: +5

Amplifier total: +43

### Step 5: Dampeners

- Photo 5 slight motion blur: -6 (not full -20 because it's
  one photo and frets are still discernible)
- Missing explicit scale reference on small component: -3

Dampener total: -9

### Step 6: Final calculation

Base 78 + amplifiers 43 - dampeners 9 = 112
Bounded by ceiling 98 → cap to 95
Sublinear capping applied → return 93

### Step 7: Output

```json
{
  "overallPhotoScore": 8,
  "presentationScore": 8,
  "backgroundScore": 9,
  "lightingScore": 8,
  "compositionScore": 8,
  "colorFidelity": 8,
  "detailCapture": 8,
  "sharpnessScore": 7,
  "exposureAccuracy": 8,
  "scaleClarity": 6,
  "emotionalAppeal": 8,
  "mobileRendering": 8,
  "confidence": 93,
  "confidence_drivers": [
    "7 photos with Reverb's key triad (headstock, serial,
     damage close-up) all present and well-executed",
    "Consistent natural window lighting across the entire
     set, clean linen backdrop throughout"
  ],
  "confidence_dampeners": [
    "Photo 5 (fret close-up) has slight motion blur — frets
     discernible but not tack-sharp",
    "No explicit scale reference shot (case provides context
     but a ruler or coin would be stronger)"
  ],
  "priorityAction": "Re-shoot photo 5 (fret close-up) with
   better stabilization. Brace your phone against something
   solid or use a two-hand grip. The frets are the primary
   condition signal for a player-grade listing and need to
   be tack-sharp."
}
```

The seller sees a number they can trust, with transparent
reasoning, and knows exactly what to do next.

---

## Why the Floor and Ceiling Matter

Calibrated confidence is what earns seller trust across the
distribution. A pricing tool that always says "very
confident" loses trust on uncertain items. A photo tool
that always says "pretty good" loses trust on items where
execution is genuinely excellent.

The 98 ceiling keeps the system from lying about certainty.
The 88 floor on strong-evidence cases keeps the system from
under-selling its own confidence when the evidence genuinely
justifies it. Together they produce output that sellers
learn to trust because the output matches the reality they
eventually observe when their items transact.

A seller who learns that "93 confidence" means "this listing
is going to perform in the top 15 percent of its category"
begins to trust the scores. That trust is the long-term
moat.
