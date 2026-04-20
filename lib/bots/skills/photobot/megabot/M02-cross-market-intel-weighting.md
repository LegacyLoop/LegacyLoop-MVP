---
name: photobot-megabot-cross-market-intel-weighting
description: >
  Platform-specific photo standards for MegaBot PhotoBot output.
  Defines eBay / Facebook Marketplace / Etsy / Instagram hero-shot,
  gallery order, aspect ratio, and background-preference rules.
  Covers platform algorithm signals (first-photo dominance, text-
  overlay penalties, saturation rewards), peak-season photo trends,
  competitor photo analysis per category, and specialist-marketplace
  rules (Reverb for musical instruments, Chairish for furniture,
  Mercari for fast-sale). Musical-instrument Reverb example: Dean
  MLX hero ordering with headstock + serial + damage triad.
when_to_use: "MegaBot scans only. PhotoBot MegaBot lane."
version: 1.0.0
---

# PhotoBot MegaBot Skill: Cross-Market Intelligence Weighting

## Purpose

A photo that wins on eBay does not win on Etsy. A photo that wins
on Etsy does not win on Instagram. Each platform has a distinct
algorithm, buyer psychology, and visual vocabulary. The MEGA_PHOTO
platformPhotoGuide field requires platform-specific hero-shot,
gallery-order, aspect-ratio, and preference direction — one size
does not fit all.

This skill defines the platform-specific photo rules the 4-AI team
applies when populating platformPhotoGuide. It also covers
specialist-marketplace rules (Reverb, Chairish, 1stDibs, Grailed)
that matter for category-specific items even though MEGA_PHOTO's
required keys are ebay/facebook/etsy/instagram.

---

## eBay

The legacy e-commerce anchor. eBay's Cassini algorithm rewards
specific photo signals that differ from social platforms.

### Hero shot advice

- Primary subject isolated against white or neutral background
- Rule-of-thirds centered, subject fills 70-80 percent of frame
- Zero text overlay (eBay penalizes text in primary image)
- Sharp focus on defining feature (the part a buyer searches for)
- No watermark

### Gallery order (12-photo max)

1. Hero shot (white background, full item)
2. Alternative angle (3/4 view)
3. Back view
4. Detail of defining feature (logo, maker mark, unique
   hardware)
5. Condition close-up (any visible wear — transparency builds
   trust)
6. Second condition close-up if applicable
7. Scale reference shot
8. Sub-detail 1 (stitching, serial, texture)
9. Sub-detail 2
10. Context shot (item in use or in environment)
11. Accessories (included case, manual, documentation)
12. Original box or receipt (if present — provenance signal)

### Aspect ratio

- Square (1:1) default
- 4:3 landscape acceptable for wide items (couches, paintings)
- Minimum 1600px longest side

### Background preference

- **White seamless** — highest-converting for non-antique
  categories
- **Neutral gray gradient** — acceptable, slightly more
  "curated" feel
- Avoid home-environment backgrounds on eBay — they read as
  amateur relative to category norms

### eBay algorithm specifics

- First photo click-through is the dominant ranking signal —
  more than title keywords in recent Cassini updates
- Photos with higher resolution rank higher in search
  placement (Cassini 2023 update)
- "Photo count 8+" threshold is tracked internally —
  listings with 8 or more photos receive a modest ranking
  bonus

---

## Facebook Marketplace

Mobile-first, local-buyer-focused, scroll-through-feed algorithm.
Different rules than eBay.

### Hero shot advice

- Item photographed in context (on a couch, in a room, on a
  table) — NOT seamless white
- Location signal in background (hints at "local") — wood
  floor, living room, garage
- Bright daylight or warm indoor lighting
- Phone-style framing (buyers trust phone photos more than
  studio photos on FB — authenticity signal)

### Gallery order (up to 10 photos)

1. Hero shot with context (item visible in environment)
2. Full front view (clean framing)
3. Back or alternate angle
4. Condition close-ups (2-3 shots of any wear)
5. Detail shots (brand, model, serial if relevant)
6. Scale reference
7. Any accessories included
8. Local-market staging (optional, e.g., item in back of
   pickup truck, showing "ready to transport")

### Aspect ratio

- Square (1:1) optimal for feed rendering
- 4:5 portrait acceptable for tall items
- Mobile-first: assume 100 percent of buyers view on phone

### Mobile-first discipline

- mobileFirst flag is TRUE for Facebook platformPhotoGuide
- Text in photos must be readable at 6-inch screen scale
- High-contrast composition wins (blended tonal photos get
  scrolled past)

### Facebook algorithm specifics

- Recency-weighted feed — first 24 hours of listing activity
  matter disproportionately
- Saves and shares rank higher than views for algorithmic
  boost
- Location proximity is a major ranking factor — photo
  background that signals local (not studio) reinforces
  relevance

---

## Etsy

Vintage and handmade emphasis. Different visual vocabulary from
mass-market platforms.

### Hero shot advice

- Lifestyle staging rewarded — item in use, in context, in
  warm environment
- Natural window light preferred over flash
- Props acceptable (linens, dried flowers, vintage books,
  coffee mug) when category-appropriate
- Slight warm tone welcomed (Etsy buyers expect warmth, not
  clinical white)

### Gallery order (10-photo max)

1. Hero lifestyle shot (item in warm context)
2. Clean product shot (neutral background, item isolated)
3. Alternative angle
4. Detail shot 1 (texture, material)
5. Detail shot 2 (construction, finish)
6. Condition close-up
7. Scale reference
8. Packaging shot (if shipping — Etsy buyers love packaging
   quality signals)
9. Maker mark or label
10. Original receipt or provenance documentation

### Aspect ratio

- Square (1:1) default — Etsy's grid is 1:1
- 4:5 portrait acceptable for single-focus product photos
- Minimum 2000x2000 recommended

### Lifestyle emphasis

- lifestyleEmphasis flag is TRUE for Etsy platformPhotoGuide
- Etsy's buyer profile skews toward curated home, handmade
  appreciation, vintage nostalgia — photos must reinforce this
  identity
- Flat-lay compositions welcomed for jewelry, smalls, textiles

### Etsy algorithm specifics

- Search ranking includes "listing quality score" — photos
  are 30-40 percent of the weighted score
- Favorites-to-views ratio is a major algorithmic signal —
  favorites rise when photo aesthetic matches Etsy's curated
  feel
- Video (15-30 second) on Etsy increases conversion 25-35
  percent where supported

---

## Instagram

Feed and reel photography. MEGA_PHOTO calls for squareCropAdvice,
gridAesthetic, reelConcept.

### Hero shot advice

- Single strong subject with breathing room
- High-contrast composition that stops the scroll
- Color coordination with seller's overall grid (if seller
  has established a visual brand)
- Optional: product styling that leans editorial or lifestyle
  depending on seller's established voice

### Square crop advice

- 1080x1080 minimum for feed
- Composition designed with safe crop zones — critical detail
  visible within the center 80 percent of the frame
- Hero element not positioned within the bottom 15 percent
  (that zone is cropped on explore page thumbnails)

### Grid aesthetic

- Consistent tonal palette across 3-6 recent posts
- Alternating composition rhythm (wide shot, detail, wide
  shot) to avoid grid monotony
- Background color coordination where possible

### Reel concept

- 15-30 second video concept — item rotation, detail pull-
  in, unboxing, context-of-use
- Opening frame must be visually arresting (reel covers
  appear before video plays)
- Closed caption or text overlay optional but acceptable
  (Instagram is text-tolerant relative to eBay)

### Instagram algorithm specifics

- Saves > likes > comments > shares in current algorithm
  weighting
- Carousel posts (multiple images) outperform single-image
  posts by 30-40 percent
- Video content (reels) gets preferential distribution over
  static photos

---

## Specialist Marketplaces (Banked for Schema Extension)

Where MEGA_PHOTO currently requires four platforms, specialist-
marketplace rules inform the discipline PhotoBot applies to
category-specific items. These are not currently required fields
but should appear in descriptive text where the category warrants.

### Reverb (Musical Instruments) — THE CANONICAL MI REFERENCE

Reverb is the musical-instrument specialist marketplace. Its
buyer pool is more knowledgeable than generic marketplaces.
Photo standards are correspondingly higher.

**Reverb photo hierarchy for MI:**

1. **Headstock front** (primary hero) — logo, tuner
   arrangement, any brand-specific features
2. **Full body front** — against neutral backdrop
3. **Full body back** — reveals any buckle rash or finish
   wear
4. **Headstock back with serial number** — must be readable
   (collectors verify against manufacturer serial records)
5. **Neck joint (heel)** — originality evidence
6. **Pickup close-up(s)** — pickup identification is material
   to value (PAF-style vs active vs split-coil)
7. **Fretboard / frets close-up** — wear pattern visible
8. **Any damage close-up** — transparency builds trust
9. **Hardware close-up** (bridge, tailpiece, tuners)
10. **Case and case candy** if present

**The headstock + serial + damage triad** is the Reverb-specific
signal that elevates a listing above competitors. A Reverb
listing missing any one of these signals gets fewer watchers.

### Dean MLX on Reverb (worked example)

Target photo order for the Dean MLX:

1. Headstock front (Dean "D" logo visible, tuner layout
   showing Grover or Dean-branded tuners)
2. Full body front — Transparent Red finish readable, body
   shape (ML style) unmistakable
3. Full body back — reveals any buckle rash on upper horn
4. Headstock back close-up — serial number readable, "MADE
   IN KOREA" or "MADE IN CHINA" stamp visible (material to
   2008 reissue era)
5. Neck joint — reveals set-neck or bolt-on construction
6. Pickup close-up — confirms DMT (Dean Multi-Tap) or other
   pickup configuration
7. Fret close-up — shows fret wear (critical for player-
   grade assessment)
8. Any dings or finish issues close-up (transparency)
9. Case and hang tags if present

Reverb buyers will scroll past a Dean MLX listing with only a
full-body shot and no headstock detail. The triad is table
stakes.

### Chairish (Designer and Vintage Furniture)

- Editorial styling mandatory — item in curated room setting
- Scale-with-room shots (photograph chair in a room that shows
  its size context)
- 3/4 angled primary shot preferred over straight-front
- Warm natural light, never flash
- Zero clutter in background

### 1stDibs (Antiques and Fine Art)

- Catalog-grade required — think Sotheby's or Christie's
  catalog standard
- Multiple tightly controlled angles
- Seamless backdrop or editorial setting
- Lighting must reveal construction, finish, and condition
  with forensic precision
- Scale reference often included

### Grailed (Designer Fashion)

- On-body or mannequin preferred over flat-lay
- Tag and label close-ups mandatory (authentication signal)
- Wear-pattern documentation critical
- Outdoor natural light popular in this category

### Mercari (Fast-Sale)

- Minimum viable photos (2-4)
- Quick-flash phone photos acceptable
- Price-over-quality visual culture
- Aesthetic matters less than speed and volume

---

## Platform Algorithm Signals

### First-photo dominance

Across all four MEGA_PHOTO platforms, the first photo is 60-80
percent of the click-through decision. This is why
coverPhotoRecommendation is a mandatory MEGA_PHOTO field — the
cover is the single highest-leverage photo in the set.

### Text-overlay penalties

- eBay: severe penalty, photo may be removed for policy
  violation
- Facebook Marketplace: moderate penalty, reach is suppressed
- Etsy: mild penalty on primary photo, later carousel photos
  may include informational overlay
- Instagram: neutral, text overlay is normal

### Saturation and contrast

- Instagram rewards vibrant, contrasty photos
- eBay neutral on saturation (accuracy over punch)
- Facebook Marketplace neutral
- Etsy slight warmth preferred over cool saturation

### Resolution as ranking factor

eBay and Etsy both factor resolution into listing quality
score. Photos at platform minimum rank below photos at 2x or
more of minimum. This is why recommending platform-appropriate
resolution (M01 resolution table) is a priorityAction signal
when photos are under-resolved.

---

## Peak-Season Photo Trends

### Q4 holiday staging

- Warm lighting, soft shadows, winter-context props (pine
  needles, wool blanket, hot beverage) on appropriate items
- Avoid literal holiday kitsch unless item is gift-oriented

### Spring decluttering (March-May)

- Bright daylight, clean lines, "moving on" vibe
- Outdoor photography acceptable for yard-sale-style items

### Back-to-school (July-September)

- Student-focused items (electronics, furniture, bikes)
  benefit from context shots in student housing settings

### Summer (June-August)

- Outdoor items (grills, garden, patio) peak demand
- Staging in actual outdoor use context

---

## Competitor Photo Analysis Per Category

The 4-AI team compares the seller's photo set against typical
listings for the same category on the target platform. The
competitiveEdge field in MEGA_PHOTO calls out:

- Where these photos exceed category norms (resolution, angle
  coverage, staging quality)
- Where they fall below (missing angles, poor lighting,
  cluttered background)
- What the top 10-percent of listings in this category are
  doing that this listing is not

### Worked example — Dean MLX on Reverb

Category median for "2008 Dean MLX player-grade listings":

- 5-6 photos average
- Headstock detail present in 60 percent of listings
- Serial number readable in 35 percent of listings
- Damage close-ups in 45 percent of listings
- Case included in photos for 50 percent of listings

If the seller's Dean MLX listing has 7 photos including
headstock + readable serial + dedicated damage close-up +
case, the listing is in the top 15 percent of the category.
competitiveEdge reads: "This photo set exceeds the category
median by 4 photos and includes all three Reverb-specific
hero signals (headstock, serial, damage transparency). Expect
top-quartile watcher count within 72 hours."

---

## Cross-Platform Coordination

When a seller lists on multiple platforms, photos can be
reused with cropping and minor adjustment. The 4-AI team
returns coordination guidance:

- Master capture at highest resolution used by any target
  platform (2400x2400 covers all four MEGA_PHOTO platforms
  plus 1stDibs)
- Square crops at 1080x1080 for Instagram
- Lifestyle staging retained for Etsy primary; cleaner crop
  for eBay primary
- Hero reshuffling per platform: the Reverb hero (headstock)
  differs from the Facebook hero (full body in context)

Cross-platform coordination should NEVER mean photo
duplication without thought. Each platform's algorithm
rewards different signals, and the gallery order should
adapt.
