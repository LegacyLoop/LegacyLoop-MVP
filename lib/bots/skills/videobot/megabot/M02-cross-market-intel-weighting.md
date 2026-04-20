---
name: videobot-megabot-cross-market-intel-weighting
description: >
  Platform algorithm and trend-signal weighting methodology for
  MegaBot VideoBot. Defines how TikTok, Reels, YouTube Shorts, and
  Facebook/Marketplace algorithms score video content differently,
  how trending-audio windows close in 1-3 weeks, the hashtag
  strategy per platform, the peak-posting-time windows, how to
  weight cross-platform resale vertical communities, and the
  algorithmic impact of video-quality signals (aspect ratio,
  audio level, caption presence). Includes the Dean MLX
  cross-platform weighting worked example.
when_to_use: "MegaBot scans only. VideoBot MegaBot lane."
version: 1.0.0
---

# VideoBot MegaBot Skill: Cross-Market Intelligence Weighting

## Purpose

The same video published across TikTok, Reels, Shorts, and
Facebook does not perform the same way. Each platform's algorithm
weights engagement signals differently, rewards different content
shapes, and favors different posting times. Treating all
short-form video platforms as a single distribution channel
produces content that underperforms on every platform instead of
succeeding on one. This skill defines how the 4-AI team weights
platform-specific signals when producing `platform_variants` and
how trend alignment is calibrated against current algorithm
behavior.

TREND ALIGNMENT is time-sensitive by nature. A hashtag that was
trending three weeks ago is not trending today. An audio track
that peaked seven days ago is already dead. The 4-AI team's job
is to surface signals with current-week shelf life, not
training-data-frozen signals.

---

## Platform Algorithm Signals

Each platform's algorithm is a black box, but published analyses
and creator-community consensus have surfaced the signals that
matter most. The 4-AI team weights content decisions against
these signals.

### TikTok algorithm signals (ranked by weight)

1. **Completion rate** — watch-to-end percentage. Single
   strongest signal. A 30-second video with 85% completion
   outperforms a 60-second video with 45% completion even when
   total watch time is similar, because the algorithm reads
   completion as "this was worth the viewer's time."

2. **Re-watch rate** — viewers who watch twice. Signals loop-
   worthy content. Humorous hooks, reveal arcs, and
   demonstration videos with punchy endings generate high
   re-watch rates.

3. **Share rate** — shares per view. Strongest organic-
   amplification signal. Content that makes viewers want to
   send it to a friend or save it to show later.

4. **Comment engagement** — comments per view. Weighted heavily
   because comments require more effort than likes. CTAs that
   solicit comments ("Comment your guess") often outperform
   CTAs that solicit DMs in algorithm weight while
   underperforming in conversion — tension the seller resolves
   based on goal (reach vs. inquiry).

5. **Follow-through from profile** — viewers who watched this
   video and then went to the creator's profile. Signals
   creator brand relevance.

6. **Trending-sound alignment** — videos using currently-
   trending audio receive an initial distribution boost.
   Expires when the sound stops trending.

### Reels algorithm signals

Reels weights signals similarly to TikTok with a few key
differences:

- **Completion rate** is the single strongest signal (same as
  TikTok).
- **Save rate** (unique to Reels/Instagram, via the bookmark
  action) is heavily weighted — viewers who bookmark are
  signaling high-intent.
- **Cross-posting penalty**: a Reel uploaded directly outperforms
  the same video cross-posted from TikTok with watermark. The
  Instagram algorithm actively down-ranks TikTok-watermarked
  content.
- **Cadence bonus**: creators who post consistently (3-5× per
  week) receive distribution-velocity amplification. Sporadic
  posting tanks reach even when individual videos are strong.

### YouTube Shorts algorithm signals

- **Repeat-watch rate** is unusually important — Shorts
  algorithm rewards content that loops. Short duration + clear
  loop-back (first frame echoes last frame) can multiply reach.
- **Cross-channel promotion**: Shorts feed shows Shorts from
  channels the viewer subscribes to. Creators with existing
  long-form audiences get a distribution floor that TikTok and
  Reels creators do not.
- **Title and caption weight** is higher than TikTok/Reels —
  Shorts is inside YouTube, and YouTube's title-search
  heritage persists.
- **Trending sounds have less impact** than on TikTok — Shorts
  users are more creator-brand-driven and less algorithm-feed-
  driven.

### Facebook / Marketplace algorithm signals

- **Video-in-listing engagement** drives Marketplace ranking.
  A listing with a video gets contacted 2-3× more than a
  listing with photos only.
- **Feed-level engagement** for general Facebook video posts:
  completion + reaction-diversity (love + wow + laugh reacts
  are weighted higher than plain like).
- **Marketplace-native video** (uploaded directly to the
  listing) outperforms linked-from-external video.
- **Comment conversations** boost organic distribution
  significantly.

---

## The Recency Curve for Trend Alignment

Trend signals have narrow shelf lives. A signal discovered four
weeks ago is likely dead. A signal that peaked yesterday may
still be rising.

### Trending audio recency schedule

- **Peak current week**: weight 1.00 — use aggressively
- **Last 1-2 weeks**: weight 0.85 — still usable, verify
  current-week activity before committing
- **3-4 weeks**: weight 0.30 — likely declining, use only if
  verified still active
- **Older than 4 weeks**: weight 0.05 — assume dead unless
  a resurgence is confirmed

### Trending hashtag recency

- **Rising this week**: weight 1.00
- **Stable community hashtags** (e.g., #gearsunday, which is
  a recurring community ritual with weekly peaks): weight 0.90
  even when not at a peak
- **Declining**: weight 0.40
- **Dead**: weight 0.00 (remove from output)

### Trending format recency

- Format cycles (e.g., "POV: you find this at an estate sale,"
  "items I would never sell") have longer shelf lives than
  audio cycles — typically 4-8 weeks.
- A format with continued visible adoption is still weight 0.85
  even in week 4-5.
- A format that has migrated to parody or irony signals is
  entering decline — reduce weight to 0.50.

### Exception: stable community rituals

Some hashtags and formats are stable community rituals rather
than trending cycles. #gearsunday on Instagram is a weekly
musical-instrument community ritual — it does not "trend" so
much as recur weekly. These hold weight 0.90+ consistently.
The TREND ANALYST distinguishes stable rituals from trending
cycles.

---

## Hashtag Strategy per Platform

The hashtag quantity and mix differs by platform.

### TikTok hashtag strategy

- **Quantity**: 3-5 hashtags total.
- **Mix**: 1-2 specific (item-identifier) + 1-2 community
  (vertical) + 1 broad (category).
- **Example for Dean MLX**: `#dean #dimebag #gearsunday
  #metalgear #vintageguitar`
- Over-tagging (10+) is correlated with spam flags and reduced
  distribution.

### Reels hashtag strategy

- **Quantity**: 5-10 hashtags total.
- **Mix**: 3-5 specific + 2-3 community + 1-2 broad.
- **Position**: Reels readers often expand hashtag lists, so
  placing hashtags at the end of the caption rather than
  inline works best.

### YouTube Shorts hashtag strategy

- **Quantity**: 3 hashtags maximum in the title area.
  Additional tags go in the YouTube tags (not visible to
  viewers but algorithmically weighted).
- **Title hashtag discipline**: 1 broad category hashtag + 1
  specific item hashtag + 1 community hashtag.

### Facebook / Marketplace hashtag strategy

- **Facebook feed**: hashtags are less weighted than on other
  platforms. 2-3 tags maximum. Focus on brand + category.
- **Marketplace listings**: hashtags are not used — listings
  rely on category selection and title keywords instead.

---

## Peak-Posting-Time Windows

Posting-time optimization moves the needle but is secondary to
content quality. The TREND ANALYST returns platform-specific
windows calibrated to buyer behavior.

### TikTok peak windows (US Eastern time)

- Morning: 6-9 AM (commute scroll)
- Midday: 12-1 PM (lunch scroll)
- Evening: 7-10 PM (prime discovery window)
- Weekend peak: Saturday + Sunday evenings 8-11 PM

Rural-community resale content (estate finds, vintage tools,
farmhouse antiques) over-indexes on morning and weekend
windows when rural audiences are active.

### Reels peak windows

- Morning: 10-11 AM (later than TikTok; Instagram audience
  skews later-rising)
- Afternoon: 2-3 PM
- Evening: 8-9 PM
- Weekend: Sunday is the strongest day for Reels discovery

### YouTube Shorts peak windows

- Weekend AM: Saturday 8-11 AM, Sunday 8-11 AM (viewer
  discovery mode)
- Weekday evening: 7-10 PM
- Less time-sensitive than TikTok/Reels because of subscription-
  feed amplification

### Facebook peak windows

- Midday: 11 AM - 1 PM
- Evening: 7-9 PM
- Friday is historically the strongest day for Facebook
  engagement across categories.

### Exception: local-pickup items

LOCAL_PICKUP items should be posted when the LOCAL buyer pool
is active. For rural Maine, this skews earlier (6-8 AM weekday
or Saturday morning) because the rural daily rhythm starts
earlier than urban defaults.

---

## Cross-Platform Resale Vertical Communities

Certain hashtag communities span platforms and represent
high-intent resale audiences. The TREND ANALYST weights these
heavily regardless of current trending status because the
community is a stable buyer pool.

### Musical instruments

- `#gearsunday` (Reels + Instagram): weekly musical-instrument
  community ritual. Every Sunday, players post their gear.
  High engagement, qualified buyer pool.
- `#reverbmarketplace`: Reverb-adjacent buyers cross-pollinated
  from the Reverb platform.
- `#vintageguitar`, `#guitargeek`, `#gearheads`: specialist
  community tags with sustained activity.
- Category-specific tribute tags (`#dimebag`, `#eddievanhalen`,
  `#prsguitars`): narrow but extremely engaged subcommunities.

### Antiques and estate pieces

- `#antiquesfound` (Instagram): the primary antique-discovery
  community.
- `#estatefinds`, `#estatesale`, `#estatelot`: estate-sale
  community.
- `#vintagefinds`: broader vintage community, less narrowly
  collector-focused.
- Regional: `#newenglandantiques`, `#coastalantiques`, etc.
  for regional provenance appeals.

### Collectibles

- `#thehobby` (card-collecting): high-intent community.
- `#sportscards`, `#vintagecoins`, `#comiccommunity`: category-
  specific.
- Grading service tags: `#psa10`, `#cgc`, `#bgs` signal graded
  inventory.

### Vehicles

- `#barnfind`: the most engaged vehicle-resale community.
- `#classiccars`, `#muscleCars`, brand-specific tags.

### Tools and equipment

- `#toolcollector`, `#vintagetools`: vintage-tool community.
- `#stihl`, `#husqvarna`: brand-loyalty communities for power
  equipment.

---

## Algorithmic Impact of Video-Quality Signals

Video quality signals that the algorithm reads and weights:

### Aspect ratio compliance

- 9:16 vertical on TikTok/Reels/Shorts: weight 1.00 (baseline)
- Non-9:16 on TikTok/Reels/Shorts: weight 0.40 (significant
  distribution penalty; video appears with black bars or
  crop-cut)
- Square (1:1) or 4:5 on Facebook feed: weight 1.00
- 9:16 on Facebook feed: weight 0.70 (letterboxed display
  reduces engagement)

### Audio presence and loudness

- Audio clearly present with appropriate loudness: weight 1.00
- Silent with strong captions: weight 0.70 (TikTok penalty;
  Reels modest penalty)
- Muffled or inconsistent audio: weight 0.50

### Caption burn-in

- Clean burned-in captions readable from arm's length:
  weight 1.00
- Platform-generated auto-captions: weight 0.90
- No captions: weight 0.70 (60% of viewers watch with sound
  off; no captions means lost message)

### First-frame readability

- First frame is clear, high-contrast, and item-identifying:
  weight 1.00
- First frame is a logo, watermark, or loading screen:
  weight 0.40 (viewers scroll past)
- First frame is blurry or dark: weight 0.30

---

## Amazon / Paid-Pool Integration (MegaBot tier)

MegaBot-tier access unlocks additional market-intelligence
sources the base VideoBot does not see.

### Amazon via Rainforest API (for video context)

- Amazon product listings provide reference images that the
  TREND ANALYST can cross-reference for visual consistency.
- Amazon review content provides language patterns buyers use
  to describe the category — valuable for caption and script
  word choice.
- Amazon new-retail price provides the ceiling reference that
  the CONVERSION OPTIMIZER uses in price-anchoring scripts.

### Paid trend dashboards

When available in the MegaBot tier, paid trend dashboards
(tools like Exolyt, Trendpop, or platform-specific creator
tools) feed into the TREND ANALYST's output with weight 0.90.
These sources are more current than general search grounding.

---

## Handling Platform Disagreement

When platforms disagree on what should work, the 4-AI team does
not average. It produces platform-specific variants.

### The common disagreement pattern

A trending TikTok audio track may not be available on Reels
(platforms do not share audio libraries). A hashtag community
that dominates Instagram may be absent from TikTok. A content
format peaking on Shorts may feel dated on TikTok.

### The correct output: platform_variants with distinct content

Rather than a single "cross-platform" variant that underperforms
on every platform, `platform_variants` delivers:

- `tiktok`: trending TikTok audio + TikTok-native hashtags +
  TikTok caption style + TikTok peak time
- `reels`: native Reels audio + Instagram hashtag community +
  Reels caption style + Reels peak time
- `shorts`: looping-friendly edit + YouTube title hashtags +
  YouTube peak window
- `facebook`: square or 4:5 crop + Facebook-native caption +
  Facebook peak time

The variants share the underlying item narrative but adapt the
delivery to each platform's algorithm. This is the MegaBot
difference — a single-AI run typically produces one script with
a "post everywhere" label. MegaBot produces four scripts, each
optimized.

---

## Dean MLX Cross-Platform Worked Example

Canonical test case. 2008 Dean MLX electric guitar, player-grade,
seller in central Maine, LOCAL_PICKUP scope.

### Step 1: Platform priority ranking

For a musical instrument in a rural Maine local-pickup context,
platform priority is:

1. **Facebook Marketplace** — primary local-pickup channel.
   Highest local buyer density.
2. **Reels** — `#gearsunday` community drives qualified buyers
   who might travel for pickup.
3. **TikTok** — secondary reach for non-local discovery and
   future cross-listing.
4. **YouTube Shorts** — tertiary; useful for long-tail
   discovery.

### Step 2: Platform-specific trend alignment

- **Facebook**: general community discovery, less trend-driven.
  Use stable listing-style format with price hint.
- **Reels**: `#gearsunday` Sunday peak window. Trending
  metal/rock sound under shred demo. Caption leads with
  estate-find hook.
- **TikTok**: metal-genre trending sound + price-reveal hook +
  shred-demo body. #dimebag community engagement.
- **Shorts**: looping edit — final frame echoes first frame.
  YouTube title with `#dean #dimebag #gearsunday`. Guitar-
  content YouTube audience is specialist.

### Step 3: Hashtag cross-platform mix

- `#dean` — universal, weight 1.00 on all platforms
- `#dimebag` — universal, weight 1.00 on all platforms
- `#gearsunday` — weight 0.95 Reels (primary), weight 0.70
  TikTok, weight 0.60 Shorts
- `#reverbmarketplace` — weight 0.90 on specialist-buyer
  platforms
- `#mainelocal` — LOCAL_PICKUP signal; weight 1.00 on Facebook
  and Reels for Maine-local discovery
- `#vintageguitar` — community baseline, weight 0.85 universal

### Step 4: Posting-time windows

- Facebook Marketplace: post Friday 5-7 PM (weekend-shopper
  discovery window) or Saturday morning
- Reels: Sunday 8-10 PM (#gearsunday peak)
- TikTok: Sunday 7-10 PM
- Shorts: Saturday/Sunday 8-11 AM

### Step 5: Virality score assessment

Musical-instrument demo content has a realistic virality
ceiling in the 5-7 range on a 1-10 scale. Dean MLX specifically
pings a niche community (Dimebag fans + metal players) that
drives engaged but not mass-audience reach. Virality_score: 6.

The reasoning in `trend_alignment.reasoning`: "Niche metal-
community item with strong specialist audience but not
broad-market viral potential. Expect 5,000-25,000 view range
on a well-executed Reels post with trending audio and
#gearsunday placement."

This honesty calibration — acknowledging realistic virality
rather than inflating every item to a 9-10 — is what
distinguishes specialist output from amateur output.
