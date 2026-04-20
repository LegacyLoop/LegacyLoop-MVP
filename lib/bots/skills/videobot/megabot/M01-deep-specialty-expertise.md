---
name: videobot-megabot-deep-specialty-expertise
description: >
  Specialist video-marketing methodology for the 4-AI MegaBot video
  team. Aligns each of the four AI agents to its assigned role
  (HOOK SPECIALIST, STORYTELLING, TREND ANALYST, CONVERSION
  OPTIMIZER) as defined in getVideoBotMegaPrompt:1043-1046. Covers
  platform-native format mastery (TikTok, Reels, YouTube Shorts,
  Facebook/Marketplace), narrative arc selection, audio layering
  strategy, text overlay timing, caption architecture, and seven
  domain archetypes with worked examples. Musical-instrument
  archetype is the canonical test fixture (Dean MLX shred-demo).
when_to_use: "MegaBot scans only. VideoBot MegaBot lane."
version: 1.0.0
---

# VideoBot MegaBot Skill: Deep Specialty Expertise

## Purpose

When VideoBot operates inside the MegaBot lane, four AI models
build a video-marketing package in parallel. Unlike every other
MegaBot specialist layer, the VideoBot 4-AI architecture assigns
each agent an explicit ROLE rather than a perspective. The output
is not a voted script — it is a synthesized specialist marketing
package where each of the four agents owns a specific craft layer.

This skill defines the video methodology the 4-AI team uses. The
role discipline, the platform-native format rules, the hook and
story frameworks, the audio and text strategies, and the seven
domain archetypes that determine which craft layers get the most
weight. VideoBot is the amplifier bot — it takes AnalyzeBot's
identification and PriceBot's valuation and turns them into
scroll-stopping content that converts. A generic "here is an
item" script loses money. A specialist package with a tested
hook, a platform-native story arc, a trend-aligned audio track,
and a conversion-optimized CTA earns the algorithmic reach that
moves inventory.

---

## The Four-Agent Role Architecture

Unlike AnalyzeBot's four perspective lenses, VideoBot's four AI
agents each own a distinct craft layer. When the synthesis layer
assembles the final output, each agent's contribution maps to
specific MEGA_VIDEO output fields.

### Agent 1 (OpenAI) — HOOK SPECIALIST

Owns the opening 3 seconds. OpenAI is the strongest at producing
diverse, structurally complete hook options because it consistently
returns well-formed JSON with multiple variants. The HOOK
SPECIALIST is responsible for:

- Populating `hook` (the primary opening 3-5 seconds)
- Populating `alternative_hooks[]` with exactly 3 different hook
  angles, each tagged with style (curiosity | shock | humor |
  FOMO) and expected_stop_rate (High | Medium | Low)
- Writing hooks that follow the canonical patterns from base
  pack 02-hook-writing-mastery (Curiosity Gap, Pattern Interrupt,
  Reveal) rather than generic category-language openers
- Tailoring the hook to the seller's Dean guitar (or any item)
  specifically — not "Check out this vintage guitar" but "I
  paid $75 at an estate sale — wait until you hear the serial
  number"

Hook quality is dispositive. A strong body with a weak hook
loses 70 percent of viewers in the first three seconds. The
HOOK SPECIALIST produces three variants precisely because
hook-market fit is not knowable a priori — sellers should test
all three.

### Agent 2 (Claude) — STORYTELLING

Owns the narrative body. Claude is the strongest at producing
emotionally resonant narrative prose with specific detail. The
STORYTELLING agent is responsible for:

- Populating `body` (the main 10-20 seconds between hook and CTA)
- Populating `story_angles[]` with 2-3 alternative narrative
  approaches, each tagged with emotional_trigger (nostalgia |
  discovery | value | exclusivity) and a full script_variant
- Writing voice directions (tone, pace, emotion) in
  `voiceDirection`
- Integrating heritage, craftsmanship, provenance, and
  context-of-use into the narrative

The STORYTELLING agent pulls from AnalyzeBot's
`product_history`, `maker_history`, and `construction_analysis`
to produce narratives that earn trust. A story with specific
detail (the 1977 Dimebag connection, the Korean-production
reissue era, the set-neck construction) outperforms a story
with vague superlatives (the "legendary" Dean, the "amazing"
vintage piece).

### Agent 3 (Gemini) — TREND ANALYST

Owns platform-specific trend alignment. Gemini's google_search
grounding gives it access to current trending data that training
data cannot provide. The TREND ANALYST is responsible for:

- Populating `trend_alignment` object with trending_sounds[],
  trending_formats[], trending_hashtags[], virality_score
  (1-10 integer), and reasoning
- Populating `hashtags[]` with a platform-appropriate mix
- Contributing platform-specific elements to each
  `platform_variants[platform]` entry (especially
  music_suggestion and best_time)
- Reading current hashtag activity, not training-data-frozen
  hashtag activity

Trend alignment has a short shelf life. A video published with
a currently-trending sound reaches 3-5× the audience of the
same video with an algorithmically-dead sound. The TREND
ANALYST's contribution is time-sensitive by nature — Gemini's
current-search capability is why this role maps to Gemini
specifically.

### Agent 4 (Grok) — CONVERSION OPTIMIZER

Owns the CTA and the conversion psychology layer. Grok reads
platform-native cultural signals and buyer psychology. The
CONVERSION OPTIMIZER is responsible for:

- Populating `cta` (the final 3-5 seconds)
- Populating `conversion_optimization` object with
  urgency_triggers[], scarcity_elements[],
  social_proof_suggestions[], and price_anchoring_script
- Populating `a_b_test_plan[]` with variant-change-hypothesis
  entries so sellers can empirically optimize
- Writing in a voice that matches the buyer community
  (collector-tone for collectibles, player-tone for musical
  instruments, estate-tone for heritage pieces)

A CTA that matches buyer psychology converts 3-5× better than
a generic CTA. The CONVERSION OPTIMIZER's job is to know what
the specific buyer community responds to and write accordingly.

### Synthesis discipline

When the four agents' contributions are assembled into the final
output, the synthesis layer preserves each agent's ownership.
The HOOK SPECIALIST owns hook and alternative_hooks — Claude's
hook suggestions are not merged in. The STORYTELLING agent owns
body and story_angles — OpenAI's body suggestions are not
merged in. The synthesis enforces the role architecture rather
than averaging across agents.

This is why VideoBot's MegaBot output is more valuable than a
single AI's video script: four specialists each owning their
craft layer produces a package that a generalist single-AI run
cannot match.

---

## Platform-Native Format Mastery

Every script must be optimized for the platform it will be
published on. Cross-posting a square video to TikTok loses
reach. Cross-posting a horizontal video to Reels loses reach.
Platform-native format is not optional.

### TikTok (primary platform for resale)

- Aspect ratio: **9:16** vertical. Non-negotiable. Any other
  ratio dies in the algorithm.
- Duration: **15-90 seconds**. Sweet spot for resale is 30-45s.
  Under 15s loses body space for item detail. Over 60s loses
  completion rate.
- Text overlay: readable from arm's length. 32pt minimum for
  key callouts. Positioned in the upper third (below the caption
  area).
- Caption position: TikTok UI occupies the bottom third —
  anything important MUST be in the upper two-thirds of the
  frame.
- Audio expectation: trending sound or strong original
  voiceover. Silence-with-captions is an explicit stylistic
  choice, not a default.

### Instagram Reels

- Aspect ratio: **9:16** vertical. Same as TikTok. Cross-posting
  from TikTok is possible but the video should NOT have the
  TikTok watermark — that tanks Reels distribution.
- Duration: **15-90 seconds**. Reels completion rates favor
  slightly shorter content than TikTok; 20-30s typically
  outperforms 45-60s on the same content.
- Carousel-fallback: for static items where video cannot be
  compelling, recommend a Reels carousel (5-10 images with
  trending audio) as an alternative. Carousel-fallback is a
  Reels-specific play that TikTok does not support.
- Hashtag strategy: 5-10 mixed tags (3-5 specific + 2-5 broad
  category).

### YouTube Shorts

- Aspect ratio: **9:16** vertical. Non-9:16 content gets pushed
  to long-form where it will underperform.
- Duration: **under 60 seconds** (required by YouTube).
- Title bar: YouTube Shorts relies heavily on title — this maps
  to the hook + caption rather than on-video text.
- Algorithm differs: Shorts algorithm rewards repeated watches
  (loop-worthy content outperforms single-watch content), where
  TikTok rewards completion + engagement.
- Cross-channel promotion: a creator's existing long-form
  audience sees Shorts in their subscription feed — this makes
  YouTube Shorts particularly valuable for sellers with an
  existing YouTube channel.

### Facebook / Marketplace

- Aspect ratio: **1:1 square** or **4:5 vertical**. Facebook
  feed displays these best. 9:16 is pushed down because Facebook
  crops or letterboxes vertical video aggressively.
- Duration: **15-60 seconds**. Facebook completion rates are
  lower than TikTok/Reels — 20-30s sweet spot.
- Marketplace integration: video content in Marketplace
  listings significantly increases listing engagement —
  photo-only listings average 10-20% contact rate, video-enabled
  listings average 30-40%.
- Text overlay: readable on desktop and mobile simultaneously,
  since Facebook feed mixes both device types.

---

## Narrative Arc Selection

Every video script uses one of six canonical narrative arcs.
The arc is chosen based on the item and the platform.

### Arc 1: Feature-Demo

Structure: hook → feature walkthrough → demonstration →
CTA.

Best for: musical instruments (the play-test), tools (the
in-use demo), vehicles (the walk-around and cold-start),
appliances (the operational test). Demonstration footage is
the body — no amount of description substitutes for hearing
the Dean MLX actually played through an amp.

Duration fit: 30-60 seconds.

### Arc 2: Story-Transformation

Structure: hook → origin story → transformation moment →
current state → CTA.

Best for: antiques with documented provenance, estate
pieces with family history, restored items where the before
and after is compelling. The emotional arc is what drives
completion.

Duration fit: 45-90 seconds.

### Arc 3: Before-After

Structure: hook (before shot) → restoration process →
reveal (after shot) → CTA.

Best for: furniture restorations, cleaned/polished silver,
authenticated-then-graded collectibles. The reveal is the
payoff — structure the pacing so the reveal lands at the
30-40 second mark on a 45-60 second video.

Duration fit: 30-60 seconds.

### Arc 4: Comparison

Structure: hook → target item + reference item → detail
contrast → CTA.

Best for: graded vs. raw collectibles, matching set pieces,
authentic vs. reproduction identification videos. The
contrast teaches while selling.

Duration fit: 20-40 seconds.

### Arc 5: Unboxing-Reveal

Structure: hook → packaging/case reveal → item reveal →
CTA.

Best for: items with original packaging, cased musical
instruments, gift-wrapped heritage pieces. The unboxing is
inherently viewable.

Duration fit: 20-40 seconds.

### Arc 6: Auction-Countdown

Structure: hook (time pressure) → item detail → bid-update
or countdown → CTA.

Best for: items genuinely in an auction or time-limited sale
format. Do NOT use this arc for items not actually in a
time-bound sale — it degrades into manufactured urgency and
erodes seller credibility.

Duration fit: 15-30 seconds.

---

## Audio Layering Strategy

Audio carries 40-50 percent of the video's emotional weight.
Audio decisions are strategic, not decorative.

### Trending sound (platform priority)

Using a currently-trending sound aligns the video with the
algorithmic discovery signals. Gemini's TREND ANALYST role
identifies which sounds are currently surging. On TikTok, this
can 3-5× the organic reach.

Constraint: trending sounds have narrow usable windows (1-3
weeks typically). A sound from four weeks ago is
algorithmically dead. The TREND ANALYST must verify
current-week activity.

Risk: trending sounds may have lyrical or tonal content that
conflicts with the item's narrative. A comedic trending sound
under an estate-piece narrative produces emotional dissonance
that kills conversion even while boosting reach. Choose
trending sounds whose tone matches the narrative.

### Original voiceover

Produces the highest narrative control. The HOOK SPECIALIST
and STORYTELLING agent's scripts are delivered by the seller
or a generated TTS voice. The `voiceDirection` field tells the
seller exactly how to deliver — tone, pace, emotion.

Use case: high-value items, heritage pieces, story-driven
narratives where the voice IS the selling instrument.

### Ambient (item-sound-driven)

For items where the sound IS the pitch: musical instruments
(the played tone), vehicles (engine sounds), tools (operation
sounds), music boxes (the melody). Let the item speak.

Constraint: platforms penalize low-audio content. Ensure the
ambient sound is loud and clear enough to register as
"intentional audio" rather than "video-with-no-sound."

### Silence with captions

Deliberate stylistic choice for mobile-feed-heavy platforms
where 60%+ of viewers watch with sound off. Captions become
the full message. Best for text-heavy storytelling or
reveal-driven arcs.

Constraint: TikTok's algorithm explicitly rewards high-audio
engagement. Silent videos cap out at 60-70% of the reach of
audio-aligned videos. Use silence-with-captions selectively.

---

## Text Overlay Timing

Text overlay timing is platform-specific and reader-friendly.

### Hook overlay

The first 3 seconds carry an on-screen text callout
reinforcing the verbal hook. Short (3-7 words maximum). Bold.
High contrast. Positioned above the platform's UI area (upper
third for TikTok/Reels/Shorts).

### Key-point overlays

At 5-second intervals during the body, a short text overlay
reinforces the point just made verbally. Reinforcement aids
recall and aids silent-viewer comprehension.

### Price overlay

If the video reveals price, the price appears as a bold
overlay at the moment of reveal. Typography is clean (Barlow
Condensed or similar numeric-optimized). Large (48pt+).

### CTA overlay

The final 3-5 seconds carry the CTA as both verbal and text
overlay. Text includes the specific action — "DM me DEAN for
price" — not just "link in bio."

---

## Caption Architecture

Captions are the text that appears alongside the video post.
They serve platform algorithms and buyer decisions.

### Structure (matches base pack 13-call-to-action-mastery)

- **Line 1 — Hook echo**: restates the hook in text. Catches
  readers who stopped scrolling to read the caption.
- **Line 2 — Detail**: names the item specifically with era,
  maker, or condition. Confirms what the video showed.
- **Line 3 — Price hint**: either the actual price or a
  price-tier indicator ("DM for price"). Transparency builds
  trust.
- **Line 4 — CTA**: the specific action. Keyword-triggered DM
  beats generic "message me."
- **Line 5 — Hashtags**: platform-appropriate count and mix.

### Example for Dean MLX TikTok

```
Paid $75 at an estate sale last weekend 👀
2008 Dean MLX Dimebag reissue, all original hardware, case included
Maine local pickup — priced at player grade
DM me DEAN for price + pickup details
#gearsunday #dimebag #dean #reverb #mainelocal
```

---

## Resale-Specific Video Patterns

Certain patterns work specifically for the resale category.

### Estate-find pattern

Structure: "I found this at an estate sale" → reveal → story →
CTA. Taps the viewer's dream of finding hidden value. Works
across most item categories.

### Price-reveal pattern

Structure: hook that poses the price question → body detailing
the item → price reveal → CTA. Price-reveal videos earn high
completion rates because the question is unanswered until the
end.

### Appraisal-contrast pattern

Structure: "I thought this was worth $X, then I learned..."
→ research process → true value → CTA. The transformation of
perception IS the narrative.

### Behind-the-stock pattern

Structure: "Here's what a dealer would pay vs. what this is
really worth" → cost + profit math → CTA. Teaches while
selling; builds dealer-fighter credibility.

---

## Seven Domain Archetypes

Every item maps to one of seven video-marketing archetypes.
The archetype determines which craft layers get emphasis.

### 1. Musical Instruments (THE TEST FIXTURE)

Dean MLX shred-demo is the canonical test case. Musical-
instrument video marketing emphasizes:

- **Audio is the pitch.** Clean-tone demo, body-spin to show
  silhouette, pickup close-up, headstock logo close-up —
  every shot has an audio or visual payoff.
- **Platform-native aspect ratios.** TikTok 9:16 vertical;
  demo with phone held vertically.
- **Hook patterns that work:** price-reveal ("I paid $75, it's
  worth..."), shred-demo ("listen to this tone"),
  story-transformation ("bought it with a blown capacitor,
  now..."). Dimebag-fan community responds strongly to the
  tribute angle.
- **Hashtags:** #gearsunday (Sunday community ritual), #dean,
  #dimebag, #metalgear, #vintage guitar. Cross-pollinate with
  #reverbmarketplace for Reverb-adjacent traffic.
- **Audio strategy:** metal trending sound for hook, then cut
  to clean-tone demo audio. The transition is the reveal.
- **Alternative hooks:** (1) curiosity — "The serial number
  changes everything." (2) pattern-interrupt — "Everyone
  overlooked this at the estate sale." (3) reveal — shred riff
  as the first sound.
- **CTA:** "DM DEAN for price" — keyword-specific, converts
  at the highest rate for this category.

### 2. Antiques (heritage pieces, decorative arts)

- **Narrative is the pitch.** Story-transformation arc is
  primary. Heritage and craftsmanship drive emotional
  connection.
- **Voiceover priority.** Original voiceover or silence-with-
  captions — trending sounds typically conflict tonally.
- **Hashtags:** #antiquesfound, #estatefinds, #provenance,
  category-specific (#federalperiod, #victorian).
- **Platform:** Instagram Reels slightly outperforms TikTok
  for antiques — the Instagram audience skews older and more
  collector-aligned.

### 3. Collectibles (cards, coins, graded items)

- **Grade reveal is the pitch.** The PSA/BGS/CGC label shot
  IS the hook. Reveal arc dominates.
- **Population-report overlay.** Visual callout of pop numbers
  during the body signals expertise.
- **Hashtags:** #thehobby, #cardcollecting, category-specific
  (#pokemon, #vintagebaseball).
- **Audio strategy:** hype sound for high-grade reveals;
  silence-with-captions for rare-pop education videos.

### 4. Vehicles

- **Cold start IS the hook.** First 3 seconds of engine sound
  is the scroll-stopper.
- **Walk-around body.** 15-20 seconds of smooth walk-around
  from driver-door to rear to passenger-door to front.
- **LOCAL PICKUP ONLY CTA** per base pack 11-vehicle-video-
  scripts.
- **Hashtags:** #classiccars, #barnfind, category-specific
  (#mopar, #pontiac).

### 5. Household Goods (commoditized furniture, kitchen)

- **Transformation arc.** Before-after works — cleaning,
  restoration, styling.
- **Comparison body.** "You could pay $400 new, or this for
  $120."
- **Facebook Marketplace is primary.** These items sell local,
  ship poorly, and peak on Facebook in-feed discovery.
- **Audio strategy:** trending home-decor sounds align with
  the audience on Reels and TikTok.

### 6. Jewelry

- **Close-up detail is the pitch.** Macro shots of stones,
  hallmarks, settings.
- **Comparison body.** Side-by-side with a similar reference
  piece highlights specific quality details.
- **Audio strategy:** elegant trending sounds or silence-with-
  captions. Narrative voiceover works for heritage pieces.
- **Platform:** Reels outperforms TikTok; Instagram audience
  aligns.

### 7. Tools and Power Equipment

- **Operational demo is the pitch.** Running the saw, starting
  the generator, firing the pressure washer.
- **Brand-and-model overlay.** Buyers search for specific
  models — text overlay with brand + model is dispositive.
- **Audio strategy:** ambient operational sound is the core.
  Add voiceover for spec callouts.
- **Hashtags:** #toolcollector, #vintagetools, category-
  specific (#stihl, #husqvarna).

---

## Role Synthesis: What the 4-AI Team Produces

After each of the four agents completes its role assignment,
the synthesis produces a unified package:

- **From HOOK SPECIALIST:** hook + 3 alternative_hooks with
  style and expected_stop_rate
- **From STORYTELLING:** body + 2-3 story_angles + voiceDirection
- **From TREND ANALYST:** hashtags + trend_alignment (sounds,
  formats, hashtags, virality_score, reasoning)
- **From CONVERSION OPTIMIZER:** cta + conversion_optimization
  (urgency, scarcity, social_proof, price_anchoring) +
  a_b_test_plan
- **Combined across all four:** fullScript, duration, platform,
  b_roll_suggestions, music_mood, thumbnail_text, posting_tips
- **Combined in platform_variants:** each platform's adaptation
  of the hook + body + CTA + hashtags + music + best-time

Each field's ownership is enforced. The seller receives a
package with four specialist viewpoints layered, not a single-
AI guess at video marketing.
