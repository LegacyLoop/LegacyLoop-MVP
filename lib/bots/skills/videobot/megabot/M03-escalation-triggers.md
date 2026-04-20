---
name: videobot-megabot-escalation-triggers
description: >
  Defines when MegaBot VideoBot must escalate beyond a single
  30-second script and trigger cross-platform variant generation,
  long-form companion content, carousel fallback, specialist
  audience routing, or dedicated condition-transparency segments.
  Covers high virality-score prediction, high-value-item thresholds,
  niche collector audience routing, low-video-fit item detection,
  demonstrable-item demo mandates, story-value narrative mandates,
  condition-transparency requirements, copyrighted-music flags, and
  the vintage/rare musical instrument extended-demo format.
when_to_use: "MegaBot scans only. VideoBot MegaBot lane."
version: 1.0.0
---

# VideoBot MegaBot Skill: Escalation Triggers

## Purpose

MegaBot VideoBot is the most capable video-marketing engine in
the system. It is not infallible. Recognizing the conditions
under which a single 30-second short-form script is the wrong
output — and instead triggering cross-platform variants, a
long-form companion, a carousel fallback, or a specialist-
audience routing — is what separates a specialist from an
amateur.

The default assumption that every item should be a short-form
vertical video is wrong. Some items deserve long-form. Some
deserve carousel format. Some need dedicated condition
disclosure segments. This skill defines when to escalate beyond
the default, how to structure the escalated output, and what
the seller's next step is.

---

## High Virality-Score Prediction: Cross-Platform Variant Mandate

When the TREND ANALYST scores virality_score ≥ 7, the content has
meaningful cross-platform potential. At this threshold, a
single-platform post leaves reach on the table.

### The escalation action

When virality_score ≥ 7:

- Mandatory: produce all 4 `platform_variants` with platform-
  native adaptation (not the same script cross-posted).
- Recommend cross-platform publishing within 48 hours of each
  other — the trend window is short.
- Add a `cross_platform_sequence` note in `posting_tips` with
  a specific order (typically highest-ceiling first: TikTok →
  Reels → Shorts → Facebook, or TikTok → Shorts simultaneously
  for loop-worthy content).

### The threshold rationale

A virality_score of 7 on this calibration represents a realistic
30,000-100,000 view ceiling on a hit platform. Below 7, the
multi-platform variant investment may not pay back for the
seller. At 7+, it does.

### Virality_score calibration honesty

Do not inflate virality_score to trigger cross-platform
mandates. A category-common estate-found household item does
not earn a 7 regardless of seller enthusiasm. The CONVERSION
OPTIMIZER and TREND ANALYST should apply the dampener in M04
M-pack M04 when scoring is tempted to over-inflate.

---

## High-Value Item Threshold: Long-Form Companion Mandate

For items valued above $500 (using PriceBot's
consensusAcceptPrice), short-form video alone is insufficient.
Short-form drives discovery; long-form converts specialist
buyers.

### The escalation action

When estimated mid-value ≥ $500:

- Produce short-form `platform_variants` per standard.
- Add a `long_form_companion` recommendation:
  - **Target platform**: YouTube long-form (3-5 minute video)
  - **Structure**: hook (30s) → item deep-dive (2-3 min) →
    condition walkthrough (30-45s) → price discussion (30s) →
    CTA
  - **Use case**: the long-form video is linked in the
    short-form bio and in the Marketplace listing; serious
    buyers watch long-form before making contact.
- Add specific `long_form_talking_points` with the 8-12 items
  to cover in the deep-dive.

### The $500 threshold rationale

Below $500, buyer-acquisition investment in long-form video
does not pay back against commission/fee economics. Above
$500, a single successful conversion pays for the long-form
production time.

---

## Niche Collector Audience: YouTube-First Routing

Some collector communities live predominantly on YouTube, not
TikTok. For these categories, the default TikTok-first
recommendation is wrong.

### The collector-YouTube categories

- **Vintage guitars and high-end musical instruments**: Gear
  review YouTube channels define the market language. Buyers
  research on YouTube before transacting.
- **Classic cars and vintage vehicles**: Automotive YouTube
  channels are the primary research destination.
- **Vintage watches**: Watchmaking YouTube channels drive
  buyer education.
- **Antique firearms** (where legally permitted): Shooting-
  sports YouTube drives education.
- **Rare coins and numismatics**: Grading YouTube content
  educates buyers.

### The escalation action

For niche-collector-YouTube categories:

- Reorder `platform_variants` priority so `shorts` leads and
  `tiktok` becomes secondary.
- Produce the `long_form_companion` even below $500 threshold
  — the specialist audience expects it.
- Populate `platform_variants.shorts` with a loop-friendly
  edit optimized for YouTube's repeat-watch algorithm.
- Add a cross-reference to creator-community channels in the
  `posting_tips` field (e.g., "This category has an active
  community on YouTube — consider requesting a feature or
  mention from [relevant channel category]").

---

## Low Video-Fit Item Detection: Carousel Fallback

Not every item is a compelling short-form video. Small static
items, detail-dense items, and items whose value is entirely in
close-up photography may be better served by carousel format.

### The low-fit signals

- **Small static jewelry** where close-up detail is the pitch
  and video cannot improve on high-quality macro photography.
- **Flat art and photographs** where the content IS the item
  and motion does not add value.
- **Stamps, coins in plastic slabs, graded cards**: the
  display IS the item; motion is distracting.
- **Single-page documents, letters, signatures**: the content
  is readable text; video obscures it.

### The escalation action

When low-fit signals are present:

- Reduce short-form output to a 10-15 second "teaser" format
  rather than a full 30-second script.
- Add a `carousel_fallback` recommendation:
  - **Primary platform**: Instagram (Reels supports carousel
    uploads with trending audio)
  - **Structure**: 5-10 photos, trending audio, short caption
  - **Use case**: the carousel replaces the short-form video
    for this item; teaser video points viewers to the carousel
- Populate `carousel_fallback.photo_sequence` with the 5-10
  shot list.

### The honesty calibration

Do not force every item into the video format. A beautifully
photographed static jewelry piece in a carousel outperforms a
mediocre short-form video of the same piece. Seller time is
limited; direct it where it pays back.

---

## Demonstrable Item: Demo Footage Mandate

For items whose function IS the selling proposition — musical
instruments, tools, vehicles, appliances, music boxes — demo
footage is not optional. Scripts without demo footage for
demonstrable items underperform measurably.

### The demo-footage escalation

When the item is demonstrable:

- Mandatory: the `body` section must include a demo segment
  (10-15 seconds minimum).
- Populate `b_roll_suggestions` with the specific demo shots
  required.
- In `voiceDirection`, note "demo footage carries 50% of the
  message — voiceover is secondary to the demonstrated sound
  or motion."
- Add a `demo_footage_required: true` flag and populate
  `demo_footage_shot_list[]` with:
  - Primary demo shot (e.g., Dean MLX shred demo through an
    amp with clean and overdriven tones)
  - Secondary demo shot (e.g., clean-tone fingerpicking to
    demonstrate versatility)
  - Close-up demo shot (e.g., hand position on neck during
    playing to demonstrate action)

### Items that ARE demonstrable

- Musical instruments (played)
- Tools (in operation)
- Vehicles (started, driven if legal, cold-start sound)
- Appliances (running)
- Music boxes / automata (played)
- Antique clocks (ticking, chiming)
- Sewing machines (stitching)
- Anything mechanical with audible or visible function

### Items that are NOT demonstrable

- Static art and photographs
- Jewelry (display, not function)
- Furniture (though craftsmanship close-ups can substitute)
- Decorative ceramics
- Books (unless rare binding technique is on display)

---

## Story-Value Item: Narrative Voiceover Mandate

Some items carry story weight that demo footage cannot capture.
Estate pieces with family provenance, historical items,
heritage crafts — these items need voice to tell their story.

### The story-mandate escalation

When the item has identifiable story value (heritage,
provenance, historical significance, craftsmanship story):

- Mandatory: `voiceDirection` specifies original voiceover
  (not trending-audio-only).
- Populate `story_angles[]` with at least 2 alternative
  narrative framings.
- In each `story_angles[i].script_variant`, write a full
  30-second script built around that narrative.
- Duration may extend to 45-60 seconds for story-rich pieces
  — compressing narrative into 15-20 seconds loses the story.

### The silence-with-captions alternative

For mobile-feed-heavy platforms where 60%+ watch with sound
off, silence-with-captions may replace voiceover. This is
acceptable when:

- The visual content carries the narrative (before/after,
  document close-ups, signature reveals)
- The caption language is sufficient to tell the story
- The trending-sound penalty is worth accepting for narrative
  control

Specify silence-with-captions explicitly in `voiceDirection`
when chosen — not as a default fallback.

---

## Condition Transparency: Dedicated Damage-Close-Up Segment

Items with any condition issues require dedicated transparency
segments. Hiding damage in a video that shows only the good
angles generates buyer disputes post-purchase and erodes
seller reputation.

### The transparency-mandate escalation

When AnalyzeBot's `condition_score < 8` OR `visible_issues[]`
has any entries:

- Mandatory: dedicate 5-10 seconds of the body to a damage-
  close-up segment.
- Populate `b_roll_suggestions` with specific damage-close-up
  shots (one per visible issue).
- In the script body, transition explicitly: "Let's look at
  the condition honestly — here's the wear..."
- Populate `transparency_segment_script` field with the
  specific voiceover for the damage walkthrough.

### The trust calibration

Buyers who see honest damage disclosure in the video are
measurably more likely to transact at fair market value
than buyers who discover damage later. The 5-10 seconds
spent on transparency pays back in conversion rate and
reduced return volume.

Items that show "no visible damage, here's why I'm pricing
at 8/10 rather than 10/10" with specific honest commentary
(environmental wear, age, use marks) also earn trust — even
nominally pristine items benefit from calibration.

---

## Copyrighted Music Detection: Royalty-Free Library Recommendation

Using copyrighted music without license triggers platform
content-matching that either mutes the audio (killing the
video's reach) or blocks the upload entirely.

### The copyright-flag escalation

If the content or music_suggestion references a copyrighted
commercial track (e.g., "Use [specific song by specific
artist]"):

- Replace the specific-song recommendation with a royalty-free
  library suggestion that matches the tonal intent.
- Populate `music_suggestion` with 2-3 royalty-free
  alternatives from specific libraries (TikTok's Commercial
  Music Library, Epidemic Sound, YouTube Audio Library,
  Artlist, etc.).
- Add a `copyright_note` field: "Avoid commercial tracks
  without license — use platform-native trending sounds or
  licensed royalty-free libraries. Recommended alternatives
  above match the tonal intent without copyright risk."

### The platform-native trending alternative

TikTok's Commercial Music Library, Reels' licensed audio, and
YouTube Shorts' audio library all contain free-to-use trending
sounds that match the algorithmic-signal benefit of regular
trending audio. Recommend these first.

### The original-audio alternative

For items where the item's own sound is compelling (musical
instruments, mechanical tools, vehicles), original audio of
the item avoids all copyright concerns and often outperforms
borrowed audio anyway.

---

## Vintage / Rare Musical Instrument: Extended-Demo Format

For pre-1980 vintage instruments, bespoke luthier-built pieces,
or any instrument with documented celebrity/studio provenance,
the standard 30-second demo is insufficient. Specialist buyers
expect deeper demonstration.

### The extended-demo escalation

When AnalyzeBot has flagged vintage MI signals (per AnalyzeBot
M03 M-pack):

- Produce the standard short-form variants as discovery content.
- Mandatory: `long_form_companion` at 3+ minutes specifically
  structured as a play-test:
  - Clean-tone demo (30-60s)
  - Driven-tone demo (30-60s)
  - Fingerpicking demo (30s)
  - Chord-voicing demo (30s)
  - Unique-feature demo (e.g., tremolo, specific pickup
    switching, vintage tone controls) (30-60s)
- Populate `extended_demo_shot_list[]` with the specific shots
  required.

### The specialist-audience reasoning

A vintage pre-1980 Fender, pre-1965 Gibson, or vintage bespoke
instrument (hand-built luthier pieces) has a collector buyer
pool that watches 5-10 minute play-test videos before
committing to five-figure purchases. Short-form discovery gets
their attention; long-form play-test earns their purchase.

### The Dean pre-1997 Elite case

Per AnalyzeBot M03, Dean guitars from the pre-1997 Elliott
Rubinson acquisition era are specialty-market items with
limited production numbers (fewer than 10,000 units across all
models). These trigger the extended-demo escalation even at
lower dollar amounts than the standard $500 threshold — the
specialist buyer pool expects the depth.

---

## Format Mismatch Escalation

When the AnalyzeBot identification or seller context suggests
the default short-form video format is inappropriate entirely,
escalate the format decision itself.

### The format-mismatch signals

- **Seller has accessibility constraints** (no phone camera,
  no ability to record demo): recommend photography-only
  listing strategy and drop video generation.
- **Item is in a regulated category** (firearms,
  pre-CITES-restricted materials, alcohol): some platforms
  restrict video of these items — recommend platforms that
  permit and avoid platforms that don't.
- **Item is time-sensitive** (auction-ending, estate-close-out
  deadline): short-form is appropriate but posting-time
  windows shift to immediate rather than optimal.

### The escalation output

Rather than a standard `platform_variants` block, produce a
`format_recommendation` block with the non-video alternative
and the reasoning. The CONVERSION OPTIMIZER explicitly names
why short-form video is not the right tool for this item.

---

## How Escalation Is Communicated

Escalation recommendations are specialist service elevation,
not failures of the default output.

### Correct framing

"Based on the signals in this item's profile, the standard
30-second short-form video alone leaves value on the table.
Here's the additional or different content that will actually
convert for this item, along with the evidence that drove the
recommendation."

Followed by:

- The specific signals that triggered the escalation
- The content recommendation with craft-layer detail
- Realistic time investment estimate for the seller
- Expected performance differential vs. default output

### Incorrect framing

"Our AI isn't sure how to handle this item."

The seller hears this as system failure. The correct framing
positions escalation as elevated service — more craft layers
applied, more specialist alignment, not fewer.

Every escalation output includes a concrete actionable plan
the seller can execute this week.
