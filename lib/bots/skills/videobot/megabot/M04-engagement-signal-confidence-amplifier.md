---
name: videobot-megabot-engagement-signal-confidence-amplifier
description: >
  Engagement-confidence math anchored on engagement signal for the
  4-AI MegaBot video team. Defines base confidence from hook
  strength + retention prediction + platform-fit + audio alignment.
  Specifies amplifiers (strong first-frame hook + trending audio +
  clear CTA, demo footage on demonstrable items, story-arc tension/
  resolution, platform-native aspect/duration) and dampeners (slow
  intro / no hook in first 3 seconds, wrong aspect ratio, silence
  on audio-weighted platforms, inconsistent framing). Includes the
  floor 0.85 rule for demonstrable item with demo footage and
  platform-native format, ceiling 0.98, and the Dean MLX shred-demo
  worked example reaching 0.91. Also specifies virality_score (1-10
  integer) calibration rules that prevent score inflation.
when_to_use: "MegaBot scans only. VideoBot MegaBot lane."
version: 1.0.0
---

# VideoBot MegaBot Skill: Engagement-Signal Confidence Amplifier

## Purpose

The confidence score on a VideoBot output is not a decoration.
It is the signal the seller uses to decide whether to publish
as-is, iterate before posting, or escalate to additional variant
generation. It is also the signal that distinguishes "this
script will likely get 20,000 views" from "this script will
likely get 500 views." A calibrated confidence score produces
better seller decisions.

The `virality_score` field (1-10 integer, per the MEGA_VIDEO
schema at getVideoBotMegaPrompt:1053) is separate from script
confidence but similarly subject to inflation pressure. A bot
that returns virality_score=9 for every item is noise. A bot
that calibrates against realistic platform ceilings is useful.

This skill defines the math the 4-AI team uses to compute both
engagement confidence (0.00 to 1.00 scale on the base
`confidence` field) AND virality_score (1-10 integer). It
specifies amplifiers, dampeners, floor rules aligned to base
VideoBot pack 14-confidence-band-rubric, and ceiling rules.

---

## Base Engagement-Confidence Formula

The starting engagement confidence is a function of four
independent signals. Each contributes to the base; amplifiers
and dampeners then modify.

### The four base inputs

1. **Hook strength** — how likely the first 3 seconds will stop
   a scroller. The HOOK SPECIALIST's output is the primary
   input here.
2. **Retention prediction** — how likely viewers who pass the
   hook will complete the video. Driven by body pacing,
   narrative arc, and content density.
3. **Platform fit** — how well the script matches the target
   platform's format expectations (aspect ratio, duration,
   text density, audio strategy).
4. **Audio alignment** — whether the chosen audio strategy
   (trending sound, voiceover, ambient, silence) matches both
   the platform's weighting and the narrative tone.

### The base confidence table

Confidence on a 0.00 to 1.00 scale.

| Hook | Retention | Platform | Audio | Base |
|------|-----------|----------|-------|------|
| Strong specific hook (pattern match to base pack 02) | High pacing + complete arc | Native aspect + duration | Trending sound or strong voiceover | 0.80 |
| Strong specific hook | High pacing | Native format | Audio present but not trending-aligned | 0.75 |
| Generic category hook | Complete body | Native format | Audio present | 0.65 |
| Weak hook (context-setting opener) | Body present | Native format | Audio present | 0.55 |
| Strong hook | Thin body (missing item data integration) | Any | Any | 0.60 |
| Any | Any | Wrong aspect ratio | Any | 0.40 |

This table is the starting point. Amplifiers and dampeners
then move the score.

---

## Amplifiers (add to base)

Amplifiers fire when engagement signals are unusually strong.

### Amplifier +0.15 — Strong first-frame hook + trending audio + clear CTA

When all three elements land:

- First-frame visual or verbal hook follows one of the
  canonical patterns (Curiosity Gap, Pattern Interrupt,
  Reveal, price-reveal, demo-lead) with item-specific
  language rather than category-generic language
- Trending audio is currently active (within 1-2 weeks of
  peak per M02 recency curve)
- CTA uses a keyword-specific trigger from the Rank 1 or
  Rank 2 hierarchy in base pack 13-call-to-action-mastery

This is the maximum amplifier. All three together produce a
video that aligns every layer of the algorithm's reward
signals.

### Amplifier +0.12 — Demo footage on demonstrable item

When the item is demonstrable AND the script's
`b_roll_suggestions` + `demo_footage_shot_list` specify
concrete demo shots with timing:

- +0.12 to base confidence
- Floor 0.85 activates when combined with platform-native
  format (see Floor section)

Demo footage transforms a "description video" into a
"proof video." Buyers who hear the Dean MLX actually played
convert at 3-5× the rate of buyers who only read about it.

### Amplifier +0.10 — Story-arc with tension and resolution

When the body follows one of the canonical narrative arcs
from M01 (Feature-Demo, Story-Transformation, Before-After,
Comparison, Unboxing-Reveal, Auction-Countdown) with clear
tension-and-resolution structure:

- +0.10

The structural completeness signals to the retention
prediction model that viewers will stay to the end. A
script that sets up a question and answers it, or sets up a
transformation and reveals it, produces higher completion
rates than a script that meanders through features.

### Amplifier +0.08 — Platform-native aspect ratio + duration match

When the script specifies:

- 9:16 aspect ratio (TikTok/Reels/Shorts) or 1:1/4:5
  (Facebook) — matches platform default
- Duration within the platform's sweet spot (15-60s for
  TikTok/Reels, under 60s for Shorts, 15-30s for Facebook
  in-feed)

This amplifier fires because non-native format takes a
distribution penalty that eliminates any other craft gains.
Native format is table stakes.

### Amplifier +0.06 — Caption discipline

When the script includes a specific caption architecture
(hook echo → detail → price hint → CTA → hashtags) and the
caption leverages the platform-specific patterns from M02:

- +0.06

Caption is secondary to video content but compounds the
algorithmic signal for text-searching and save-rate
behaviors.

### Amplifier +0.05 — Cross-platform variant discipline

When `platform_variants` contains genuinely distinct content
for each of the 4 keys (tiktok, reels, shorts, facebook) —
not the same script with hashtag swaps:

- +0.05

This amplifier rewards the MegaBot-tier craft of producing
platform-specific content rather than cross-platform
compromise content.

---

## Dampeners (subtract from base)

Dampeners fire when engagement signals are weak, misaligned,
or contradictory.

### Dampener -0.25 — Wrong aspect ratio for target platform

When the script specifies 16:9 on TikTok/Reels/Shorts, or
9:16 on long-form Facebook feed, or any mismatch:

- -0.25

Aspect-ratio mismatch takes a distribution penalty that
cannot be recovered. Any other craft layer is irrelevant if
the video gets filtered out of the feed in the first pass.

### Dampener -0.20 — Slow intro / no hook in first 3 seconds

When the script opens with:

- Seller introduction ("Hey everyone, today I want to show
  you...")
- Context-setting prose before the item appears
- Logo cards or title overlays blocking the item
- Slow pan that does not reveal item value in the first 3
  seconds

Subtract 0.20. The first-three-seconds penalty is
well-documented in short-form video economics — videos that
lose 40%+ of viewers in the first 3 seconds rarely recover.

### Dampener -0.15 — Silent audio on audio-weighted platform

When the script specifies silence-with-captions on TikTok
without a dispositive narrative reason:

- -0.15

TikTok's algorithm explicitly rewards high-audio engagement.
Silent-with-captions content caps at 60-70% of audio-aligned
reach. On Reels the penalty is smaller (-0.10); on Facebook
it is negligible. This dampener is TikTok-specific.

### Dampener -0.12 — Generic category language hook

When the hook uses category-generic language ("Check out
this amazing vintage guitar") rather than item-specific
language:

- -0.12

Generic hooks fail the pattern-match against the canonical
patterns in base pack 02-hook-writing-mastery. They signal
to the viewer that the creator does not have a specific
compelling angle.

### Dampener -0.10 — Inconsistent framing / shaky camera

When b_roll_suggestions include shots that require camera
stability the seller may not have, OR when the script
requires multiple continuous-camera shots without a tripod
mention in posting_tips:

- -0.10

This dampener accounts for seller execution risk. A script
that requires perfect camera work from a seller who may not
have it produces output that underperforms its theoretical
ceiling.

### Dampener -0.08 — Over-inflated virality claim

When the TREND ANALYST returns virality_score ≥ 8 for an
item in a narrowly-niche category without cross-platform
community signals that support mass-audience potential:

- -0.08

This dampener self-calibrates the virality_score output.
Unrealistic virality projections erode seller trust when
real performance falls short. Apply to the confidence score
when the virality_score appears inflated relative to the
category's realistic ceiling.

### Dampener -0.08 — Missing CTA specificity

When the CTA is generic ("DM me for info" without keyword,
"link in bio" without item reference, "comment below"
without specific comment request):

- -0.08

CTA specificity is dispositive for conversion rate per base
pack 13. Generic CTAs convert at 30-50% of specific CTAs.

### Dampener -0.06 — No platform_variants differentiation

When `platform_variants` contains the same script with
hashtag swaps instead of platform-native adaptations:

- -0.06

This dampens the MegaBot-tier premium for not producing
genuinely distinct platform content.

---

## Floor and Ceiling Rules

The computed confidence (base + amplifiers − dampeners) is
then bounded.

### Ceiling 0.98

Never claim certainty. The maximum engagement confidence the
4-AI team returns is 0.98. Video performance has inherent
variability — the same script posted at two different times
can vary 5× in reach. The 2-point gap between 0.98 and 1.00
is the honest acknowledgment that algorithmic discovery is
probabilistic, not deterministic.

### Floor 0.85 — Demonstrable item + demo footage + platform-native format

When ALL THREE of the following hold:

- The item is demonstrable (musical instrument, tool, vehicle,
  etc. per M01 archetype rules)
- The script specifies demo footage with a concrete shot list
  in `b_roll_suggestions` or `demo_footage_shot_list`
- Platform-native aspect ratio AND duration match

...the floor rises to 0.85 even if other factors are mixed.
This floor aligns with base VideoBot pack 14-confidence-band-
rubric's GOLD tier (score ≥ 85 on the 0-100 scale).

The reason: a demonstrable item with demo footage in native
platform format has the three ingredients that produce
consistent performance across seller execution variance.
Sellers with basic phone camera skills can consistently
achieve good results on these scripts.

### Floor 0.75 — Strong hook + story arc + platform-native format

When the following hold:

- Hook matches a canonical pattern with item-specific language
- Body follows one of the six canonical narrative arcs
- Platform-native aspect ratio AND duration match

...the floor rises to 0.75. This floor captures high-quality
story-driven content even when the item is not demonstrable.

### Hard floor 0.40

Even in the worst case (wrong aspect ratio, no hook, silent
on TikTok), do not present engagement confidence below 0.40.
A confidence below 0.40 is an escalation trigger per M03
(recommend format change, revise script) rather than a
published output.

---

## Virality Score Calibration (1-10 Integer)

The virality_score field in MEGA_VIDEO output is a 1-10 integer
representing realistic ceiling of viral performance. The 4-AI
team calibrates against category ceilings, not aspirational
ceilings.

### Category-realistic ceilings

- **Narrow specialist collector items** (rare vintage MI, fine
  art, specific-era antiques): ceiling 6-7. Qualified-audience
  reach, not mass-viral.
- **Broad collector-adjacent items** (vintage guitars at
  player-grade, common antiques): ceiling 7-8. Broader reach
  with collector-community amplification.
- **Mass-appeal story pieces** (estate-find transformations,
  before-after restorations, high-drama price reveals):
  ceiling 8-9. Can cross category into general audience.
- **Genuine mass-appeal content** (unusual discoveries,
  dramatic transformations, celebrity provenance): ceiling
  9-10. Rare by definition.

### Virality score rubric

- **1-3**: This will get near-zero organic reach. Algorithmic
  or craft reasons. Use when wrong-format or weak-hook signals
  dominate.
- **4-5**: Baseline category-expected reach. No upside trigger
  but no major dampener.
- **6-7**: Qualified specialist audience will find this. Good
  engagement, not viral. Most narrow-niche content lands here.
- **8**: Strong specialist engagement with cross-community
  amplification potential. Realistic for high-craft output on
  interesting items.
- **9**: Mass-audience breakout potential. Reserve for genuine
  story-value + strong craft alignment.
- **10**: Genuine viral potential. Reserve for once-per-month-
  at-best items with dispositive surprise value.

### Honesty calibration discipline

Returning virality_score=9 for every item is indistinguishable
from returning 5 — the signal is noise. Apply the dampener
-0.08 to engagement confidence when the TREND ANALYST is
tempted to inflate.

### Reasoning field mandate

Every virality_score must carry reasoning in
`trend_alignment.reasoning`. The reasoning names the specific
factors that drove the score — e.g., "Niche metal-community
item with strong Dimebag-fan audience but not broad-market
viral potential. Expect 5,000-25,000 view range on a
well-executed Reels post."

---

## Confidence Output Format

The final `confidence` value returns on the 0.00 to 1.00 scale
on the base VideoBot output. The 4-AI team also populates:

- The numeric value (0.00 to 1.00)
- A qualitative tier label (matching base pack 14):
  - GOLD: 0.85 and above
  - SILVER: 0.70 to 0.84
  - BRONZE: 0.50 to 0.69
  - NOT_READY: below 0.50
- The top two contributing signals in `confidence_drivers[]`
- Any dampeners that fired in `confidence_dampeners[]`
- Separate `virality_score` (1-10 integer) in `trend_alignment`

### Example output snippet

```
"confidence": 0.91,
"confidence_tier": "GOLD",
"virality_score": 7,
"confidence_drivers": [
  "Demonstrable item with shred-demo b-roll in b_roll_suggestions",
  "Platform-native 9:16 + 30-second duration + trending metal
   audio alignment"
],
"confidence_dampeners": [
  "Seller has no tripod — handheld shots may show camera shake
   (mitigated by specifying stabilization posting tip)"
]
```

---

## Dean MLX Shred-Demo Worked Example

Canonical test case. 2008 Dean MLX, player-grade condition,
TikTok-first script with trending metal audio.

### Step 1: Base confidence

- Hook: "Paid $75, worth how much?" with shred riff as first
  sound. Specific, price-reveal pattern, item-named. Strong.
- Retention prediction: 30-second script, Feature-Demo arc,
  hook → detail → demo → price reveal → CTA. Complete arc.
  High pacing.
- Platform fit: 9:16, 30 seconds. TikTok-native.
- Audio alignment: trending metal sound (TREND ANALYST
  verified current week) + shred-demo segment audio.

Base = 0.80 (top row of the base confidence table)

### Step 2: Amplifiers

- Strong first-frame hook + trending audio + keyword CTA
  ("DM DEAN for price"): +0.15
- Demo footage on demonstrable item — b_roll_suggestions
  specify shred demo, clean tone, body spin, headstock logo
  close-up: +0.12
- Story-arc tension and resolution (price-reveal
  transformation arc): +0.10
- Platform-native 9:16 + 30-second duration: +0.08

Amplifier total: +0.45

### Step 3: Dampeners

- Generic category language hook — NOT applicable (hook is
  item-specific)
- Wrong aspect ratio — NOT applicable
- Silent on audio-weighted platform — NOT applicable
- Seller may not have tripod → possible camera-shake risk:
  -0.10 (mitigated by posting_tips recommending phone-on-
  surface stabilization for demo shots)

Dampener total: -0.10

### Step 4: Final calculation

Base 0.80 + amplifiers 0.45 − dampeners 0.10 = 1.15
Bounded by ceiling 0.98 → capped at 0.98
Sublinear capping to leave honest room → return 0.91

### Step 5: Floor check

Demonstrable item + demo footage specified + platform-native
format → Floor 0.85 active. Final 0.91 exceeds floor; no floor
intervention.

### Step 6: Virality score

Dean MLX in Dimebag tribute community + TikTok + trending
metal audio. Category ceiling: narrow-specialist-with-
subcommunity-amplification. Realistic reach: 5,000-25,000 views
on a hit Reels or TikTok post.

Virality_score: 7 (strong specialist engagement with community
amplification, not mass-audience).

Reasoning: "Niche metal-community item with strong Dimebag-fan
audience. #gearsunday community on Instagram and #dimebag on
TikTok drive engaged but not mass-audience reach. Realistic
5,000-25,000 view range on a well-executed post. Upper bound
requires the trending metal audio window to still be open at
post time."

### Step 7: Output

```
"confidence": 0.91,
"confidence_tier": "GOLD",
"virality_score": 7,
"confidence_drivers": [
  "Demonstrable MI with concrete shred-demo + body-spin +
   headstock close-up in b_roll_suggestions",
  "Platform-native 9:16 + 30s duration + trending metal audio
   + keyword CTA 'DM DEAN for price'"
],
"confidence_dampeners": [
  "Handheld camera risk on demo segments — mitigated via
   phone-on-surface stabilization posting tip"
]
```

The seller reads this and understands why the confidence is
what it is, and calibrates their expectation of performance
against the virality_score.

---

## Why Floor and Ceiling Matter

Short-form video performance is inherently variable. The 0.98
ceiling prevents the system from claiming certainty it cannot
have. The 0.85 floor on demonstrable-item + demo-footage +
native-format prevents the system from under-selling high-
quality output when all the dispositive signals are aligned.

The virality_score 1-10 scale with explicit category ceilings
prevents the system from inflating every output to a 9-10. A
system that projects viral success on every item erodes seller
trust when most items do not achieve viral reach. A system
that calibrates against realistic ceilings earns trust because
sellers experience performance matching projection.

Floor, ceiling, and calibration discipline together produce
engagement confidence that earns seller trust across the full
distribution of items — from narrow-niche specialist pieces to
mass-appeal story items.
