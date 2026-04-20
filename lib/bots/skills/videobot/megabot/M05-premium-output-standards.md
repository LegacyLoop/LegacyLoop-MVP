---
name: videobot-megabot-premium-output-standards
description: >
  Defines the premium MegaBot VideoBot output package. Aligns
  exactly with the MEGA_VIDEO schema at getVideoBotMegaPrompt:
  1050-1055. Specifies required content standards for alternative_
  hooks (exactly 3 entries with style and expected_stop_rate),
  story_angles (2-3 entries with emotional_trigger and script_
  variant), platform_variants (exactly 4 keys: tiktok, reels,
  shorts, facebook), trend_alignment (sounds, formats, hashtags,
  virality_score integer, reasoning), conversion_optimization
  (urgency, scarcity, social_proof, price_anchoring), and
  a_b_test_plan (variant-change-hypothesis entries). Also
  enforces the 4-agent role specialty discipline. Includes a
  full Dean MLX worked JSON output populating every required
  field, and a before/after contrast showing amateur vs.
  specialist video marketing language.
when_to_use: "MegaBot scans only. VideoBot MegaBot lane."
version: 1.0.0
---

# VideoBot MegaBot Skill: Premium Output Standards

## Purpose

A MegaBot VideoBot output is a specialist video-marketing
package. It is not a script. It is the multi-platform, multi-
variant, trend-aligned, conversion-optimized content package
that converts a seller's item into organic discovery and direct
inquiries. The difference between a generic AI video script and
a specialist package is what this skill defines — specific
fields, specific content standards, specific variant counts,
specific language discipline — so every output from the 4-AI
team meets a uniform premium bar.

This pack aligns EXACTLY with the MEGA_VIDEO schema at
getVideoBotMegaPrompt:1050-1055. Every field name, every
sub-field, every array length constraint, every enumeration
value matches the prompt definition. Drift from the schema
produces downstream parse errors — alignment is not optional.

---

## The Full MegaBot VideoBot Output Package

Every MegaBot VideoBot output populates TWO layers:

1. **Base VideoBot fields** — from getVideoBotPrompt:1011-1024
2. **MegaBot enhancement fields** — from getVideoBotMegaPrompt:
   1050-1055

Partial outputs are incomplete and must not be returned as
final.

---

## Layer 1: Base VideoBot Fields (Required for Every Output)

These fields come from the base VideoBot prompt and must be
populated in every output, MegaBot or otherwise.

### hook (string)

Opening 3-5 seconds that grab attention. The HOOK SPECIALIST
agent owns this field.

Content requirements:

- Item-specific, not category-generic
- Follows one of the canonical patterns from base pack
  02-hook-writing-mastery (Curiosity Gap, Pattern Interrupt,
  Reveal, price-reveal, demo-lead)
- Written for spoken delivery (short sentences, natural rhythm)
- Maximum 15 words for spoken 3-5s

### body (string)

Main content 10-20 seconds between hook and CTA. The
STORYTELLING agent owns this field.

Content requirements:

- Follows one of the six canonical narrative arcs from M01
- Integrates specific item data (era, maker, condition,
  provenance) rather than generic description
- Pulls from AnalyzeBot's product_history, maker_history,
  construction_analysis when present
- Approximately 50-60 words for spoken 20s

### cta (string)

Call to action 3-5 seconds to drive viewer action. The
CONVERSION OPTIMIZER agent owns this field.

Content requirements:

- Uses a keyword-specific trigger from Rank 1 or Rank 2 of
  base pack 13-call-to-action-mastery
- Platform-native format
- Specific action ("DM DEAN for price") rather than generic
  ("Message me")
- Maximum 15 words

### fullScript (string)

The complete script as one flowing paragraph for TTS narration.

Content requirements:

- Concatenates hook + body + cta into natural prose
- Written for text-to-speech delivery
- Approximately 75 words total for a 30-second video (2.5
  words per second)
- Punctuation preserves delivery rhythm

### hashtags (array of strings)

5 tags minimum for cross-platform distribution. The TREND
ANALYST agent owns this field for trend currency; adjusted per
platform in `platform_variants`.

Content requirements:

- Format: strings with leading `#` (e.g., `"#dean"`)
- Mix per M02: specific + community + broad category
- 5 tags is the minimum for the base field; platform_variants
  may override for platform-specific counts

### duration (number)

Target duration in seconds.

Content requirements:

- Integer, typically 15-60
- Default 30 for short-form unless item complexity warrants
  extension

### platform (string)

Primary target platform.

Content requirements:

- One of: `"tiktok"`, `"reels"`, `"shorts"`, `"facebook"`, or
  `"all"` when content works uniformly across platforms
- When `"all"` is specified, `platform_variants` MUST still
  populate all four keys with platform-specific adaptations

### voiceDirection (string)

How the narrator should deliver the script.

Content requirements:

- Specifies tone (confident, casual, reverent, excited, etc.)
- Specifies pace (fast, measured, slow)
- Specifies emotion (curiosity, authority, enthusiasm)
- Notes silence-with-captions explicitly when that is the
  intentional choice
- Owned by the STORYTELLING agent

### b_roll_suggestions (array of strings)

Visual suggestions for the video. The full 4-AI team
contributes, with the HOOK SPECIALIST and STORYTELLING agents
leading.

Content requirements:

- Minimum 3 entries, typical 4-6
- Each entry is a specific shot (not a generic category)
- Examples: "Headstock logo close-up with raking light",
  "Body-spin to show full silhouette", "Hands playing shred
  riff on neck with amp audible in background"
- When the item is demonstrable, include demo shots (see M03
  demo-footage mandate)

### music_mood (string)

The mood/genre of background music.

Content requirements:

- Specific enough to guide audio selection
- Example: "Trending metal audio with strong drop at 3-second
  mark" rather than "Upbeat music"
- When copyrighted music is tempting to reference, replace
  with royalty-free library suggestion (see M03 copyright
  flag)

### thumbnail_text (string)

Bold text for the video thumbnail.

Content requirements:

- 3-7 words maximum
- Hook-echoing — restates the verbal hook
- Readable from platform thumbnail size

### posting_tips (string)

Best time to post, hashtag strategy, engagement tips.

Content requirements:

- Specific time window for the primary platform (from M02
  peak-posting windows)
- Stabilization tip if handheld camera is implied
- Cross-platform sequence if multi-platform posting is
  recommended

---

## Layer 2: MegaBot Enhancement Fields (Required for MegaBot Output)

These fields ONLY appear in MegaBot output. They align exactly
with the schema at getVideoBotMegaPrompt:1050-1055.

### alternative_hooks (array of exactly 3 objects)

EXACTLY 3 entries. No more, no fewer. Owned by the HOOK
SPECIALIST agent.

Each object schema:
- `text` (string) — the alternative hook
- `style` (string, enum) — one of: `"curiosity"`, `"shock"`,
  `"humor"`, `"FOMO"`
- `expected_stop_rate` (string, enum) — one of: `"High"`,
  `"Medium"`, `"Low"`

Content requirements:

- Each hook must follow a different pattern (e.g., one
  Curiosity Gap, one Pattern Interrupt, one Reveal)
- Style distribution should cover different emotional angles
  across the 3 entries (not all three the same style)
- expected_stop_rate should be calibrated against the
  HOOK SPECIALIST's domain knowledge — not all three "High"
- Each hook is item-specific, not category-generic

### story_angles (array of 2-3 objects)

2 or 3 entries. Owned by the STORYTELLING agent.

Each object schema:
- `angle` (string) — description of the story approach
- `emotional_trigger` (string, enum) — one of: `"nostalgia"`,
  `"discovery"`, `"value"`, `"exclusivity"`
- `script_variant` (string) — FULL alternative 30-second script
  using this angle

Content requirements:

- Each script_variant is a complete alternative script, not a
  fragment — the seller can choose to use any of them
  wholesale
- Emotional triggers should differ across entries
- Narrative arcs from M01 should map to the angles (e.g., one
  angle might use Feature-Demo while another uses
  Story-Transformation)

### platform_variants (object with exactly 4 keys)

EXACTLY 4 keys: `tiktok`, `reels`, `shorts`, `facebook`. No
more, no fewer. Owned by the full 4-AI team with platform-
specific craft.

Each platform's sub-object schema:
- `script` (string) — platform-adapted script
- `hashtags` (array of strings) — platform-specific hashtag
  mix per M02 counts
- `best_time` (string) — platform peak window per M02
- `music_suggestion` (string) — platform-native trending or
  royalty-free music matching the tonal intent

Content requirements:

- Each platform's script must be genuinely distinct —
  different hooks, different pacing, different audio
  alignment. Not the same script with hashtag swaps.
- TikTok script optimized for TikTok algorithm
  (completion-rate weight, trending-audio alignment)
- Reels script optimized for Instagram (save-rate weight,
  `#gearsunday`-style community alignment for musical
  instruments)
- Shorts script optimized for loop-back (final frame echoes
  first)
- Facebook script optimized for in-feed square/4:5 format

### trend_alignment (object)

Schema:
- `trending_sounds` (array of strings) — currently-active
  trending audio references
- `trending_formats` (array of strings) — currently-active
  format patterns (e.g., "POV: you find this at an estate
  sale")
- `trending_hashtags` (array of strings) — currently-rising
  hashtags
- `virality_score` (integer) — 1-10 scale per M04 calibration
- `reasoning` (string) — explains why this content could (or
  could not) go viral with specific factor naming

Content requirements:

- trending_sounds must be current-week active (per M02
  recency curve)
- virality_score calibrated against realistic category
  ceilings (per M04)
- reasoning names specific factors (community reach,
  algorithmic alignment, format fit) — not generic
  "could be viral if..."

### conversion_optimization (object)

Schema:
- `urgency_triggers` (array of strings) — sources of genuine
  urgency (genuine deadlines, limited inventory)
- `scarcity_elements` (array of strings) — genuine scarcity
  signals (production numbers, specific variant rarity)
- `social_proof_suggestions` (array of strings) — social proof
  elements the seller can include (testimonials from similar
  sales, comp prices, expert endorsement patterns)
- `price_anchoring_script` (string) — specific language for
  presenting the price compellingly

Content requirements:

- Urgency and scarcity must be GENUINE. Manufactured urgency
  without a real deadline erodes seller credibility.
- Social proof suggestions should be actionable (specific
  testimonial asks, specific comparable citations)
- price_anchoring_script leverages PriceBot's comp data —
  e.g., "Comparable 2008 Dean MLX player-grade examples on
  Reverb are selling for $425-495. I'm pricing this at $399
  for local pickup because my cousin left it to me, not
  because the market is weak."

### a_b_test_plan (array of 2-4 objects)

Each object schema:
- `variant` (string, enum) — `"A"`, `"B"`, or `"C"` (typically
  3 variants covering the base output + 2 alternatives)
- `change` (string) — what specifically differs in this
  variant
- `hypothesis` (string) — why this change might perform better

Content requirements:

- Minimum 2 variants (A + B), typical 3 (A + B + C)
- Each variant tests a single change axis — not multiple
  changes at once (a/b test discipline)
- Common change axes: hook style, CTA format, opening visual,
  duration, audio strategy
- Hypothesis grounded in specific reasoning from M01, M02, or
  M04

---

## 4-Agent Role Discipline Enforcement

The MEGA_VIDEO schema assigns each of the 4 AI agents a distinct
role per getVideoBotMegaPrompt:1043-1046. This pack reinforces
that discipline.

### Role ownership validation

When the synthesis layer assembles the output:

- HOOK SPECIALIST content (hook + alternative_hooks) must
  show diversity across the 3 alternative_hooks — if all 3
  read similarly, the HOOK SPECIALIST did not do its job
- STORYTELLING content (body + story_angles + voiceDirection)
  must show narrative craft — if body is generic and
  story_angles are thin, the STORYTELLING agent did not do
  its job
- TREND ANALYST content (hashtags + trend_alignment +
  platform_variants[*].music_suggestion) must show current-
  week research — training-data-frozen trend claims indicate
  the TREND ANALYST did not invoke search grounding
- CONVERSION OPTIMIZER content (cta + conversion_optimization
  + a_b_test_plan) must show buyer-psychology craft —
  generic "DM me for price" CTAs indicate the CONVERSION
  OPTIMIZER did not do its job

### Cross-role coherence

While each role owns its fields, the output must cohere across
fields. The hook's style informs the body's pacing. The CTA's
keyword informs the caption. The trending audio choice
informs the voiceDirection. The a_b_test_plan variants test
against the established baseline.

A coherent MegaBot output reads as a single specialist package,
not as four disconnected drafts.

---

## Full Dean MLX Worked Output

Canonical test case. 2008 Dean MLX electric guitar, player-
grade (6/10), Transparent Red finish, LOCAL_PICKUP from central
Maine. Full MegaBot VideoBot package.

```json
{
  "hook": "Paid $75 at an estate sale — wait until you hear this 2008 Dean.",
  "body": "Original DMT pickups, set-neck mahogany body, all hardware intact. This is the 2008 Dimebag reissue run — Dean licensed the MLX silhouette through his estate in 2008, and the Korean production from that year holds value as the most affordable way into the ML legacy. Player grade, honest wear, ready to gig.",
  "cta": "DM me DEAN for price and Maine local pickup details.",
  "fullScript": "Paid $75 at an estate sale — wait until you hear this 2008 Dean. Original DMT pickups, set-neck mahogany body, all hardware intact. This is the 2008 Dimebag reissue run — Dean licensed the MLX silhouette through his estate, and the Korean production from that year holds value as the most affordable way into the ML legacy. Player grade, honest wear, ready to gig. DM me DEAN for price and Maine local pickup details.",
  "hashtags": ["#dean", "#dimebag", "#gearsunday", "#metalgear", "#vintageguitar"],
  "duration": 30,
  "platform": "all",
  "voiceDirection": "Confident enthusiast tone. Pace: brisk but clear (2.5 words per second). Emotion: genuine discovery — the seller is excited about the estate find, not performing excitement. Pause slightly after the hook's price reveal to let the number land.",
  "b_roll_suggestions": [
    "First frame: hands playing opening shred riff on the Dean with amp audible — sound and visual hook together",
    "Body-spin showing full ML silhouette at 3-5 second mark",
    "Headstock logo close-up with raking light at 7-10 second mark (identification confidence shot)",
    "Pickup close-up showing DMT humbucker pair + Tune-o-Matic bridge at 12-15 second mark",
    "Clean-tone fingerpicking segment showing neck action at 18-22 second mark",
    "Case close-up (if present) or final item-on-stand shot at CTA"
  ],
  "music_mood": "Trending metal audio with strong downbeat at 3-second mark (TREND ANALYST to select from TikTok's current-week library). For Reels cross-post, use native Reels trending metal audio. For Shorts, original demo audio is primary with trending metal as bed layer.",
  "thumbnail_text": "$75 ESTATE FIND",
  "posting_tips": "Primary: Reels Sunday 8-10 PM ET (#gearsunday peak). Secondary: TikTok Sunday 7-10 PM. Use phone-on-surface stabilization for demo shots — handheld shake reduces retention. Cross-post to Facebook Marketplace listing for direct buyer routing.",
  "alternative_hooks": [
    {
      "text": "The serial number on this Dean changes everything.",
      "style": "curiosity",
      "expected_stop_rate": "High"
    },
    {
      "text": "Everyone at the estate sale walked past this guitar.",
      "style": "shock",
      "expected_stop_rate": "Medium"
    },
    {
      "text": "Three days left before this goes to the collector who's been asking.",
      "style": "FOMO",
      "expected_stop_rate": "Medium"
    }
  ],
  "story_angles": [
    {
      "angle": "Estate-find discovery arc — seller emphasizes the moment of finding the guitar, the research process that revealed its identity, and the decision to sell local",
      "emotional_trigger": "discovery",
      "script_variant": "Three weeks ago I'm clearing out my cousin's estate in Waterville. Dusty case in the basement. Opened it — 2008 Dean MLX, Transparent Red, all original. Looked up the serial number, found out this was the Dimebag Darrell licensed reissue from the year Dean partnered with his estate. My cousin was a metal player in the '90s. He would have paid $399 new. Now it's finding a new player. DM me DEAN — Maine local pickup only."
    },
    {
      "angle": "Player-grade honest-assessment arc — seller leads with condition transparency and positions the price as fair-trade for a gigging player",
      "emotional_trigger": "value",
      "script_variant": "2008 Dean MLX, player grade, here's what you get and here's what you don't. DMT pickups sound full — tested through a Marshall last weekend. Original case candy is gone — basement storage for 16 years. Honest fret wear, no buzz. All original hardware — no pickup swaps, no refinishing. Priced at $399 for local pickup. Not a collector piece at this price — a player piece. DM DEAN for pickup."
    }
  ],
  "platform_variants": {
    "tiktok": {
      "script": "Paid $75 at an estate sale — wait until you hear this 2008 Dean. [shred riff + body-spin] Original DMT pickups, Dimebag reissue run, Korean 2008 production. Player grade, ready to gig. DM DEAN for price.",
      "hashtags": ["#dean", "#dimebag", "#gearsunday", "#metalgear", "#mainelocal"],
      "best_time": "Sunday 7-10 PM ET",
      "music_suggestion": "Current-week trending metal audio with strong 3-second drop — TREND ANALYST verify at post time via TikTok's Commercial Music Library."
    },
    "reels": {
      "script": "Estate sale find — 2008 Dean MLX. [hands playing riff + headstock close-up] All original, Dimebag reissue, Korean production. Player grade. Maine local pickup. Link in bio or DM DEAN.",
      "hashtags": ["#gearsunday", "#dean", "#dimebag", "#vintageguitar", "#gearheads", "#reverbmarketplace", "#mainelocal"],
      "best_time": "Sunday 8-10 PM ET (#gearsunday peak)",
      "music_suggestion": "Reels-native trending metal audio. Select at post time — TREND ANALYST to verify current-week library."
    },
    "shorts": {
      "script": "This 2008 Dean MLX holds its value — here's why. [demo + headstock + pickup shots + close riff for loop-back] Dimebag reissue, all original, player grade. DM DEAN for price.",
      "hashtags": ["#dean", "#dimebag", "#gearsunday"],
      "best_time": "Saturday or Sunday 8-11 AM ET (Shorts discovery window)",
      "music_suggestion": "Original demo audio primary (own playing) with light trending metal bed. Shorts algorithm rewards original audio more than TikTok/Reels."
    },
    "facebook": {
      "script": "2008 Dean MLX Dimebag reissue — player grade, all original, Maine local pickup. [4:5 crop with body shot + demo audio + price overlay] Cash or Venmo. Priced to move this week.",
      "hashtags": ["#dean", "#mainelocal"],
      "best_time": "Friday 5-7 PM ET or Saturday morning",
      "music_suggestion": "Original demo audio — Facebook feed penalizes inconsistent audio. Keep the playing audio as the entire audio track."
    }
  },
  "trend_alignment": {
    "trending_sounds": [
      "Current-week trending metal/rock audio on TikTok and Reels (specific selection deferred to post-time verification)",
      "Dimebag tribute audio patterns seeing sustained community usage on #dimebag and #dean community posts"
    ],
    "trending_formats": [
      "Estate-find reveal format — sustained community engagement with 4-8 week shelf life",
      "Price-reveal hook pattern — stable format across resale community"
    ],
    "trending_hashtags": [
      "#gearsunday (stable Sunday community ritual, weight 0.95)",
      "#dean (community baseline, stable)",
      "#dimebag (tribute community, sustained high engagement)",
      "#mainelocal (LOCAL_PICKUP signal for Maine-local discovery)"
    ],
    "virality_score": 7,
    "reasoning": "Niche metal-community item with strong Dimebag-fan audience on both Reels #gearsunday and TikTok #dimebag communities. Realistic 5,000-25,000 view range on a well-executed post. Upper bound requires the trending metal audio window to still be open at post time and cross-posting to capture both communities. Not broad-market viral — specialist community amplification ceiling."
  },
  "conversion_optimization": {
    "urgency_triggers": [
      "Local pickup means the buyer pool is geographically limited — first qualified Maine buyer likely closes transaction within 2-3 weeks",
      "Trending audio window closes in 1-3 weeks — posting within the current window maximizes reach"
    ],
    "scarcity_elements": [
      "2008 Dean MLX Korean reissue was a limited production window (estimated 2,000-4,000 units across three finish variants)",
      "Transparent Red finish is one of three standard finishes — specific finish variant availability is thin on current Reverb and Facebook Marketplace inventory"
    ],
    "social_proof_suggestions": [
      "Cite the current Reverb sold median ($425 for player-grade 2008 MLX) as third-party market validation in the caption or price-reveal moment",
      "Mention Dean Guitars' current-production MLX lineup as brand-continuity proof — the model is still in production, the reissue has legacy status",
      "Reference the Dimebag estate partnership documentation (publicly known 2008 reissue licensing) as authenticity anchor"
    ],
    "price_anchoring_script": "Comparable 2008 Dean MLX player-grade examples on Reverb are selling for $425 to $495 nationally. I'm pricing this at $399 for local pickup in central Maine because the rural market haircut makes local-pickup fair at this level. Not a fire sale — a fair local-market price with no shipping hassle."
  },
  "a_b_test_plan": [
    {
      "variant": "A",
      "change": "Baseline: price-reveal curiosity hook + shred-demo body + keyword CTA (this output)",
      "hypothesis": "Standard-strength performance — 5,000-15,000 view range with moderate DM volume on the #gearsunday Reels post."
    },
    {
      "variant": "B",
      "change": "Replace the curiosity hook with the shock pattern-interrupt hook: 'Everyone at the estate sale walked past this guitar.'",
      "hypothesis": "Pattern-interrupt hooks often outperform curiosity hooks for underdog-item narratives. Expect 10-20% higher completion rate on the B variant. DM volume may be similar to A."
    },
    {
      "variant": "C",
      "change": "Keep the A hook but replace the keyword CTA with comment-CTA: 'Comment TONE if you want to hear the clean channel.' Then follow up with a second post featuring the clean-channel demo.",
      "hypothesis": "Comment-driven CTA generates higher algorithm engagement signals and creates a multi-post sequence that compounds reach. Primary conversion moves to DMs in comment replies. Expect 20-30% higher reach on the A+C sequence than A alone, with similar total DM volume."
    }
  ],
  "confidence": 0.91,
  "confidence_tier": "GOLD",
  "confidence_drivers": [
    "Demonstrable MI with concrete shred-demo + body-spin + headstock close-up in b_roll_suggestions",
    "Platform-native 9:16 + 30s duration + trending metal audio + keyword CTA 'DM DEAN for price'"
  ],
  "confidence_dampeners": [
    "Handheld camera risk on demo segments — mitigated via phone-on-surface stabilization posting tip"
  ]
}
```

---

## Before and After: Amateur vs. Specialist Video Marketing Language

The difference in perceived seller competence between amateur
and specialist video marketing is the difference between a
listing that sits for 90 days and one that gets 15 qualified DMs
in the first week.

### Amateur

```
"Selling my cousin's old Dean guitar. It's a 2008, I think.
Plays okay, some wear on it. Asking $400 or best offer.
Located in Maine, local pickup preferred.

#guitar #forsale #vintage"
```

What a buyer reads:
- The seller does not know the model specifically
- The seller is uncertain about the year
- The condition is glossed over in a single word
- The price has an immediate discount offer built in
  ("or best offer"), signaling weakness
- The hashtags are generic and will not reach qualified
  buyers

Expected performance: 200-500 views on any platform. 1-2
lowball DMs. Sits for 60-90 days. Eventually sells for $275.

### Specialist (MegaBot VideoBot premium output)

```
HOOK: "Paid $75 at an estate sale — wait until you hear this 2008 Dean."

BODY: "Original DMT pickups, set-neck mahogany body, all hardware intact. This is the 2008 Dimebag reissue run — Dean licensed the MLX silhouette through his estate, and the Korean production from that year holds value as the most affordable way into the ML legacy. Player grade, honest wear, ready to gig."

CTA: "DM me DEAN for price and Maine local pickup details."

Hashtags: #dean #dimebag #gearsunday #metalgear #mainelocal
```

What a buyer reads:
- The seller knows the specific model, year, production
  era, and variant
- The condition is characterized honestly (player grade,
  honest wear, ready to gig)
- The hook creates a price-reveal loop that earns
  completion
- The community hashtags (#gearsunday, #dimebag) reach the
  exact qualified buyer pool
- The keyword CTA ("DM DEAN") converts viewers into direct
  conversations with low friction

Expected performance: 5,000-25,000 views on Reels
#gearsunday. 10-20 qualified DMs in the first week.
Transaction closes within 14-21 days at $375-399.

---

## What the Premium Output Is For

This output is the content package a seller references when:

- Publishing the short-form video to TikTok, Reels, Shorts,
  and Facebook in sequence
- Running an A/B test to empirically identify the best hook
  for their audience
- Adapting the script to platform-specific craft without
  starting from scratch
- Writing a Marketplace listing with supporting video that
  converts 2-3× better than photo-only listings
- Scheduling posts at platform-optimal times for their item
  category
- Responding to qualified DMs with pre-written conversation
  starters

Each of those actions benefits from different fields of the
output. That is why the schema is complete, not minimal.
Partial outputs force the seller to guess at the craft layers
the team should have provided. Premium outputs let them
execute across the full marketing surface with specialist
alignment at every layer.

Every downstream system also consumes this output.
PhotoBot's shot recommendations can align to the b_roll
list. PriceBot's comp data feeds the conversion_optimization
social_proof_suggestions. AnalyzeBot's product_history and
maker_history feed the body narrative. Premium VideoBot
output compounds into premium marketing execution across the
entire platform.
