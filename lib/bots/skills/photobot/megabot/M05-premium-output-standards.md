---
name: photobot-megabot-premium-output-standards
description: >
  Defines the premium MegaBot PhotoBot output package. Specifies
  required fields across the MEGA_PHOTO schema (prompts.ts:376-476)
  — 12-field scoring panel, coverPhotoRecommendation with
  coverPhotoAlternatives (exactly 2), missingShots up to 12,
  enhancementVariations (EXACTLY 7 named variations with 200+
  word dallePrompts), conditionDocumentation, conditionPhotographyGuide
  (EXACTLY 3 tips), salesImpactStatement, priceImpactEstimate,
  professionalTips (EXACTLY 5), lightingSetup, backgroundRecommendation,
  priorityAction, secondaryActions (EXACTLY 3), buyerEmotionalTrigger,
  trustSignals (3-5), purchaseBarriers, competitiveEdge, and
  platformPhotoGuide for ebay/facebook/etsy/instagram. Includes a
  full Dean guitar worked output and an amateur vs specialist
  contrast. References PHOTO_RESPONSE_OVERRIDE (prompts.ts:935-960)
  allowing 6500 tokens and 200+ word dallePrompts. Reinforces the
  IRON RULE of condition authenticity preservation.
when_to_use: "MegaBot scans only. PhotoBot MegaBot lane."
version: 1.0.0
---

# PhotoBot MegaBot Skill: Premium Output Standards

## Purpose

A MegaBot PhotoBot output is a specialist photography-direction
report. It is not a photo review. It is the document a seller
reads before deciding which photo to make the hero, which angles
to re-shoot, which enhancement to generate, and how to present
condition with both honesty and craft. The difference between a
generic AI photo-review response and a specialist report is what
this skill defines — specific fields with specific counts,
specific content standards, specific presentation rules — so
every output from the 4-AI team meets a uniform premium bar.

PhotoBot output drives the single most visible surface of a
listing: the photos themselves. Every dollar of photo-quality
improvement produces measurable price lift (15-30 percent on
most categories). Premium PhotoBot output multiplies that lift
across every listing the seller publishes.

---

## The IRON RULE — Restated

Before any field specification, the iron rule from MEGA_PHOTO
lines 381-389 governs every enhancement variation, every DALL-E
prompt, every edit instruction:

**NEVER hide, minimize, soften, retouch, or alter ANY condition
detail.** Every scratch, dent, chip, stain, patina, wear mark,
and repair stays visible in every generated image and variation.
Presentation = professional. Presentation ≠ dishonest.

This rule has its own section in this skill because it is the
bright line that separates legitimate MegaBot PhotoBot output
from fraud. Violating it destroys buyer trust and violates
platform policies. It is non-negotiable.

---

## Token Budget Override

MEGA_PHOTO is the ONLY MegaBot mode that receives a token-budget
override. PHOTO_RESPONSE_OVERRIDE at prompts.ts:935-960 allows:

- Up to 6500 output tokens (vs the 1800-token guideline for
  other bots)
- Enhancement variation dallePrompt fields at 200+ words each
  with exhaustive physical detail
- Strings in photo fields up to 400 characters when detail is
  needed (dallePrompt, descriptions, tips)

This token headroom exists specifically to support the 7
enhancementVariations with full 200+ word DALL-E prompts plus
the full 12-field scoring panel plus the category-specific
missing-shots map. The 4-AI team uses the headroom
responsibly — completeness and specificity matter more than
brevity.

---

## The Full MegaBot PhotoBot Output Package

Every MegaBot PhotoBot output populates the full MEGA_PHOTO
schema. Partial outputs are incomplete and must not be
returned as final. The required fields and their content
standards:

### 1. SCORING PANEL (12 fields, each 1-10 with justification)

Required fields in order:

- **overallPhotoScore** — composite per M04 weighting
- **presentationScore** — scroll-stop factor
- **backgroundScore** — cleanliness, neutrality
- **lightingScore** — evenness, accuracy, shadow control
- **compositionScore** — framing, centering, rule-of-thirds
- **colorFidelity** — true-to-life colors
- **detailCapture** — texture, markings, condition visibility
- **sharpnessScore** — focus quality
- **exposureAccuracy** — highlights and shadows
- **scaleClarity** — size readability
- **emotionalAppeal** — buyer desire trigger
- **mobileRendering** — 6-inch phone screen performance

Each score is accompanied by a one-sentence justification
referencing specific photos (e.g., "Lighting: 8 — photos 1-4
show consistent soft window light from camera left; photo 7
has slight warm cast from evening sun").

Content requirements per field:

- Score on 1-10 scale per M01 rubric
- Justification cites specific photo number and specific
  observation
- Never score all fields identically (real photo sets have
  variance — scoring all 8s or all 10s signals lack of
  observation)

### 2. COVER PHOTO ANALYSIS

**coverPhotoRecommendation** object with:

- `photoIndex` — which photo in the submitted set
- `reasoning` — detailed explanation (why this beats the
  others)
- `strengths` — array of specific elements that make this
  photo the best cover
- `weaknesses` — array of minor issues with the cover
  recommendation (honest — no perfect photo)

**coverPhotoAlternatives** — array of EXACTLY 2 backup
options with:

- `photoIndex`
- `reasoning` (why this would work if the primary
  recommendation is not preferred)

Why exactly 2: three alternatives overwhelms a non-technical
seller. One alternative doesn't show the trade-off between
choices. Two alternatives strikes the balance — present the
best choice plus two viable alternates so the seller
understands the decision landscape.

### 3. MISSING SHOT MAP

**missingShots** — array of UP TO 12 critical shots missing
from the set. Category-specific per MEGA_PHOTO lines 413-420
rules. Each shot with:

- `shotName` — what to photograph (e.g., "Maker's mark
  close-up")
- `why` — why this shot matters for buyers and pricing
- `howToShoot` — brief technical direction (angle, distance,
  lighting)
- `salesImpact` — "High" | "Medium" | "Low"
- `platformsThatNeedIt` — which platforms specifically want
  this shot (e.g., "Reverb, eBay, 1stDibs")

Content requirements:

- Category-specific — never generic "more detail shots"
- Minimum 3 entries when any gap exists (unless truly
  complete)
- Order by salesImpact (High first)
- Always include a scale reference shot recommendation if
  no scale reference is present

### 4. AI ENHANCEMENT VARIATIONS

**enhancementVariations** — EXACTLY 7 variations. This count
is MANDATORY. Less than 7 or more than 7 is out-of-spec.

The 7 named variations (per MEGA_PHOTO line 430 canonical
names):

1. **Clean Studio** — seamless white/gray backdrop,
   studio-grade isolation
2. **Lifestyle Context** — item in warm room setting, soft
   natural light, storytelling
3. **Detail Showcase** — macro-focused on the item's
   distinguishing feature
4. **Auction Catalog** — editorial-grade, Sotheby's/Christie's
   visual language, dramatic soft light
5. **Social Media Hero** — high-contrast, scroll-stopping,
   Instagram/TikTok-optimized
6. **Condition Celebration** — warm lighting that makes age
   markers, patina, and honest wear look beautiful (IRON
   RULE: celebrate, never hide)
7. **Technical Close-Up** — macro-style detail on maker
   marks, serial numbers, mechanisms, hardware

Each variation MUST contain:

- `variationName` — one of the 7 canonical names (or
  category-specific variant)
- `description` — what this variation achieves and why
- `dallePrompt` — 200+ word DALL-E 3 prompt per
  PHOTO_RESPONSE_OVERRIDE rules. Must include:
  - Exact physical description with precise component counts
  - Exact color descriptions
  - Specific background description for this variation
  - EXPLICIT instruction to preserve all condition details
  - Lighting direction and mood
  - Camera angle and framing
  - Photorealistic quality markers
- `editInstructions` — step-by-step instructions for editing
  the real photo in this direction
- `bestFor` — what type of buyer and which platform this
  variation optimizes for
- `expectedScoreImprovement` — how many points this would
  add to the overall photo score

### DALL-E Prompt Engineering Rules (per
PHOTO_RESPONSE_OVERRIDE)

Every dallePrompt must follow these rules:

1. Start with the most important physical details — exact
   component counts FIRST
2. Use imperative language: "EXACTLY 6 strings", "PRECISELY
   22 frets", "3 control knobs"
3. Describe spatial relationships: "headstock positioned
   upper-left, body centered, neck angled 15 degrees"
4. Include negative prompts: "Do NOT add extra strings. Do
   NOT alter body shape. Do NOT remove fret wear."
5. Specify photographic style: "Shot on Phase One IQ4
   150MP, 80mm lens, f/11, studio strobe lighting"
6. Always end with condition preservation instruction
7. Include perspective: "photographed at eye-level from 4
   feet away"
8. Specify lighting placement: "key light 45° from upper
   left, fill light from right, soft reflector below"
9. For items where size matters, reference scale

### 5. CONDITION DOCUMENTATION

**conditionDocumentation** — comprehensive array of EVERY
visible condition issue with:

- `issue` — what the issue is (e.g., "Upper horn ding")
- `location` — specific spatial location on item
- `severity` — "Minor" | "Moderate" | "Significant"
- `photoIndex` — which photo shows the issue
- `photographyTip` — how to photograph this specific issue
  honestly and professionally

Content requirements:

- Every visible issue documented — no omissions
- Use specific severity language tied to impact on value
- Each entry references the photo number where the issue
  is visible

**conditionPhotographyGuide** — EXACTLY 3 tips for honestly
photographing this item's condition issues in the most
professional way. The count is enforced.

### 6. SALES IMPACT ANALYSIS

**salesImpactStatement** — one powerful data-backed sentence
on expected price impact.

Example format: "Professional photos typically increase sale
price 15-30 percent for vintage electric guitars and reduce
time-to-sell from 21 days to 8 days on Reverb."

**priceImpactEstimate** object with:

- `currentPhotoQuality` — "Poor" | "Fair" | "Good" |
  "Excellent"
- `estimatedPriceBoost` — percentage range (e.g., "15-25%")
- `estimatedTimeReduction` — realistic reduction (e.g.,
  "21 days to 10 days")

### 7. PROFESSIONAL TIPS

**professionalTips** — EXACTLY 5 category-specific pro
tips for photographing this exact type of item. Count is
enforced.

Each tip must include specific technical details:

- Aperture recommendation (e.g., "f/8 for maximum
  sharpness")
- ISO target (e.g., "ISO 200 to balance noise and
  sensitivity")
- White balance setting
- Camera-to-subject distance
- Angle / framing

Written at a level the seller can actually execute, even
if they are using a phone — phone photography tips use
phone-appropriate language (tap-to-focus, HDR on/off, grid
lines for rule-of-thirds).

### 8. LIGHTING AND BACKGROUND

**lightingSetup** — recommended lighting setup for this
specific item category:

- Natural vs artificial
- Direction (front/side/overhead/angled)
- Diffusion (direct/softbox/window-diffused)
- Reflectors (yes/no, where)

**backgroundRecommendation** — ideal background for this
item category and why:

- Specific color or material (white seamless, gray
  gradient, wood surface, linen, etc.)
- Reasoning tied to category expectations on target
  platforms

### 9. PRIORITY ACTION AND SECONDARY ACTIONS

**priorityAction** — the single highest-impact change to
make RIGHT NOW, with step-by-step instructions.

Format:
- Opens with one-sentence recognition of what currently
  works
- Names the specific action
- Provides 3-5 step numbered instructions
- Closes with expected impact statement

**secondaryActions** — EXACTLY 3 next-most-important
actions after the priority one. Count is enforced. Each
action:

- Named specifically (not generic)
- Ordered by sales impact (high to medium)
- Brief step-by-step where applicable

### 10. BUYER PSYCHOLOGY

**buyerEmotionalTrigger** — the primary emotion this photo
set triggers (nostalgia, desire, trust, urgency, curiosity)
with brief explanation of how the photos produce that
emotion.

**trustSignals** — array of 3-5 specific elements in the
photos that build buyer confidence. Must be specific
observations, not generic claims.

Example: "Original case with hang tags visible in photo 7"
vs generic "Looks professional."

**purchaseBarriers** — array of photo-related issues that
might make a buyer hesitate. Written from the buyer's
perspective.

**competitiveEdge** — how these photos compare to typical
listings for this item type. What makes them stand out or
fall behind. References category median where possible.

### 11. PLATFORM-SPECIFIC OPTIMIZATION

**platformPhotoGuide** object with 4 required keys:

- `ebay` — { heroShotAdvice, galleryOrder: string[],
  aspectRatio, backgroundPreference }
- `facebook` — { heroShotAdvice, galleryOrder: string[],
  aspectRatio, mobileFirst: boolean }
- `etsy` — { heroShotAdvice, galleryOrder: string[],
  aspectRatio, lifestyleEmphasis: boolean }
- `instagram` — { squareCropAdvice, gridAesthetic,
  reelConcept }

Each platform's entry populated per M02 specialist rules.

---

## Exact Counts Enforced

MEGA_PHOTO specifies exact counts on four fields. The 4-AI
team enforces these counts:

- **enhancementVariations**: EXACTLY 7 (never 6, never 8)
- **coverPhotoAlternatives**: EXACTLY 2 (never 1, never 3)
- **conditionPhotographyGuide**: EXACTLY 3 tips
- **professionalTips**: EXACTLY 5 tips
- **secondaryActions**: EXACTLY 3 actions

These counts exist because the output consumer (the UI,
the seller, the downstream systems) expects a predictable
shape. A variable-count output requires defensive parsing
at every consumer — exact counts eliminate that friction.

---

## Full Dean MLX Worked Output

Canonical test case. Dean MLX 2008 reissue, player-grade,
7 photos submitted.

```json
{
  "overallPhotoScore": 8,
  "presentationScore": 8,
  "presentationJustification": "Photo set shows clear seller investment — linen backdrop throughout, consistent framing.",
  "backgroundScore": 9,
  "backgroundJustification": "Seamless linen backdrop across all 7 photos with zero visible clutter.",
  "lightingScore": 8,
  "lightingJustification": "Natural window light from camera-left consistent across photos 1-6; photo 7 slightly warmer (evening sun).",
  "compositionScore": 8,
  "compositionJustification": "Rule-of-thirds centered on photos 1-4; tight detail framing on 3, 4, 5, 6.",
  "colorFidelity": 8,
  "colorFidelityJustification": "Transparent Red finish reads accurately; slight warmth from window light but not misrepresenting color.",
  "detailCapture": 8,
  "detailCaptureJustification": "Dean logo, serial number, and damage close-up all visible. Pickup and neck-joint close-ups missing.",
  "sharpnessScore": 7,
  "sharpnessJustification": "Photos 1-4, 6, 7 tack-sharp. Photo 5 (fret close-up) has slight motion blur — frets discernible but not crisp.",
  "exposureAccuracy": 8,
  "exposureAccuracyJustification": "Full tonal range preserved across the set. No blown highlights or crushed shadows.",
  "scaleClarity": 6,
  "scaleClarityJustification": "Case in photo 7 provides implicit scale context. No explicit scale reference (ruler, coin, hand) in the set.",
  "emotionalAppeal": 8,
  "emotionalAppealJustification": "Case with hang tags in photo 7 tells a 'carefully owned' story. Backdrop choice signals seller investment.",
  "mobileRendering": 8,
  "mobileRenderingJustification": "Photo 1 (hero) reads clearly at 6-inch phone size. Serial number in photo 4 legible at zoom.",

  "coverPhotoRecommendation": {
    "photoIndex": 1,
    "reasoning": "Photo 1 is the full-body front shot with the clearest Dean MLX silhouette. On Reverb and eBay, the first-click photo needs to instantly communicate 'this is a 2008 Dean MLX' — photo 1 does that faster than any other photo in the set. Rule-of-thirds centered, Transparent Red finish reads accurately, linen backdrop signals care.",
    "strengths": [
      "Unmistakable Dean MLX body silhouette dominates the frame",
      "Transparent Red finish color reads true",
      "Clean linen backdrop with zero distraction",
      "Even window lighting reveals wood grain through the finish"
    ],
    "weaknesses": [
      "Headstock logo is visible but not hero-scale — some buyers will want to see the Dean logo closer before clicking"
    ]
  },

  "coverPhotoAlternatives": [
    {
      "photoIndex": 3,
      "reasoning": "Photo 3 (headstock close-up) works as hero for Reverb's buyer pool, who verify brand and era first. Use this cover if listing is Reverb-primary."
    },
    {
      "photoIndex": 7,
      "reasoning": "Photo 7 (case with hang tags) works as hero for 'collector provenance' framing on eBay or Facebook Marketplace — the case candy signals a carefully owned piece."
    }
  ],

  "missingShots": [
    {
      "shotName": "Neck joint (heel) close-up",
      "why": "Shows whether the guitar is set-neck, bolt-on, or through-neck construction. Major value signal for collectors — pre-1990 MLX had different construction than 2008 reissue.",
      "howToShoot": "Close-up from about 12 inches away, lighting from the side to reveal the join line.",
      "salesImpact": "High",
      "platformsThatNeedIt": "Reverb, eBay"
    },
    {
      "shotName": "Pickup close-ups (neck and bridge)",
      "why": "Pickup identification (stock DMT vs Seymour Duncan vs other swap) affects price 15-25%.",
      "howToShoot": "Individual close-ups of each pickup from directly above, 8-10 inches away, diffused light to avoid glare on pole pieces.",
      "salesImpact": "High",
      "platformsThatNeedIt": "Reverb"
    },
    {
      "shotName": "Truss-rod cover close-up",
      "why": "Some 2008 MLX variants had matching serial numbers on the truss-rod cover — a collector detail.",
      "howToShoot": "Close-up from directly in front of headstock back, 10-12 inches away.",
      "salesImpact": "Medium",
      "platformsThatNeedIt": "Reverb"
    },
    {
      "shotName": "Scale reference shot",
      "why": "Confirms actual size for first-time Dean MLX buyers who may not know the scale.",
      "howToShoot": "Place a standard ruler or a credit card next to the body in one wide shot.",
      "salesImpact": "Low",
      "platformsThatNeedIt": "eBay, Facebook Marketplace"
    }
  ],

  "enhancementVariations": [
    {
      "variationName": "Clean Studio",
      "description": "Studio-grade isolation on seamless white backdrop. Standard e-commerce presentation — reads as professional and premium. Optimized for eBay and 1stDibs-adjacent catalog-grade listings where clinical isolation drives click-through.",
      "dallePrompt": "Photorealistic studio photograph of a 2008 Dean MLX electric guitar in Transparent Red finish with mahogany grain visible through the stain. The guitar has EXACTLY 6 strings, 22 frets, two humbucker pickups, three control knobs (volume-volume-tone), one three-way selector switch, and a hardtail bridge. Body shape is the Dean ML silhouette — offset pointed lower bout, angular upper horn, sharp pointed headstock. Dean 'D' logo visible on headstock. Guitar is positioned centered against a pure white seamless backdrop, photographed from eye level at 4 feet away, shot on Phase One IQ4 150MP equivalent with 80mm lens at f/11. Key light 45 degrees from upper left, fill light from right, soft reflector below. Zero shadows on background. Preserve all condition details: visible ding on upper horn, slight fret wear, honest finish aging. Do NOT add extra strings or frets. Do NOT alter the body shape. Do NOT remove or minimize the ding on the upper horn. Do NOT change the finish color. Negative prompt: no sunburst, no solid opaque red, no metal-flake, no stickers or added decals. Photorealistic e-commerce product photography style.",
      "editInstructions": "1. Use Lightroom or Photoshop to isolate the guitar on a pure white backdrop. 2. Apply Camera Raw noise reduction at 25% luminance. 3. Set white balance to 5500K for accurate Transparent Red. 4. Boost clarity +15 to reveal wood grain through finish. 5. Preserve all condition details — do not clone out the upper horn ding or the fret wear.",
      "bestFor": "eBay hero shot, 1stDibs adjacency, professional-grade listings where clinical studio isolation is the platform norm.",
      "expectedScoreImprovement": 1
    },
    {
      "variationName": "Lifestyle Context",
      "description": "Guitar positioned on a warm wooden floor next to a vintage amp or music room setting. Soft natural window light, storytelling composition. Signals 'this guitar has been loved and played' rather than 'this guitar sits in a warehouse.'",
      "dallePrompt": "Photorealistic lifestyle photograph of a 2008 Dean MLX electric guitar in Transparent Red finish resting against a vintage tube amplifier cabinet on a warm hardwood floor. The guitar has EXACTLY 6 strings, 22 frets, two humbucker pickups, three control knobs, a three-way selector switch, and a hardtail bridge. Dean ML body silhouette unmistakable — offset pointed lower bout and sharp pointed headstock. Scene is a cozy home music room — worn oriental rug visible at the edge of frame, framed band poster slightly visible on wall, soft diffused natural window light from camera right casting gentle shadow. Photographed at 3 feet elevation, angled 35 degrees from horizontal, shot on full-frame mirrorless camera with 50mm lens at f/4. Warm color temperature approximately 4500K. Guitar is the clear hero element occupying 60% of frame. Preserve all condition details: visible upper horn ding, slight fret wear, honest finish aging and subtle scratches. Do NOT add extra strings or frets. Do NOT alter body shape. Do NOT remove the ding or minimize the wear. Do NOT change the Transparent Red finish color. Negative prompt: no studio lighting, no white seamless background, no harsh shadows, no artificial perfection. Warm inviting lifestyle music-room photography.",
      "editInstructions": "1. In Photoshop, place the cutout guitar on a warm hardwood floor background. 2. Add soft shadow beneath the guitar. 3. Adjust color temperature to 4500K for warm feel. 4. Add subtle vignette -15 at edges. 5. Preserve all condition details.",
      "bestFor": "Etsy hero, Reverb lifestyle slot, Instagram feed, Facebook Marketplace. Buyer audience values 'played and loved' over 'museum clean.'",
      "expectedScoreImprovement": 1
    },
    {
      "variationName": "Detail Showcase",
      "description": "Macro-focused on the Dean logo and Transparent Red finish grain. Close enough to reveal mahogany wood grain through the stain. Shows off the build quality and authenticates the brand.",
      "dallePrompt": "Extreme macro photograph of the headstock of a 2008 Dean MLX electric guitar. Focus on the Dean 'D' logo decal and the sharp pointed headstock silhouette. Tuner layout visible with 3-per-side configuration showing the Dean-branded tuners with their distinctive shaped buttons. Black headstock face with raised Dean 'D' logo in silver-on-black. Truss rod cover visible below the logo with two visible Phillips screws. Transparent Red finish on the edge of the neck visible at bottom of frame, mahogany wood grain clearly readable through the semi-transparent stain. Shot with 100mm macro lens at f/5.6, ISO 200, studio lighting from camera upper-left at 45 degrees with soft box diffusion, fill reflector camera right. Photographed from eye level with camera parallel to headstock face, distance approximately 14 inches. Background is soft out-of-focus blur. Preserve all condition details: any logo wear, any small scratches on headstock face, any tool marks around tuner holes. Do NOT alter the Dean logo shape or add extra text. Do NOT change the tuner count or arrangement. Do NOT remove any wear or aging marks. Negative prompt: no altered branding, no stock imagery aesthetic, no added stickers. Macro product photography style.",
      "editInstructions": "1. Crop the existing headstock photo to square format at 1:1. 2. Apply moderate sharpening +25 on the logo and wood grain. 3. Slight clarity boost +10 to enhance grain detail. 4. Preserve the logo decal exactly — do not alter or enhance.",
      "bestFor": "Reverb secondary hero, Instagram grid detail shot, eBay gallery position 3-4.",
      "expectedScoreImprovement": 1
    },
    {
      "variationName": "Auction Catalog",
      "description": "Editorial-grade presentation modeled after Christie's and Sotheby's musical instrument catalog photography. Dramatic soft light, dark backdrop, guitar as object of significance. Signals collector-grade listing.",
      "dallePrompt": "Editorial auction-catalog photograph of a 2008 Dean MLX electric guitar in Transparent Red finish, photographed against a deep charcoal-gray backdrop with subtle tonal gradient. The guitar has EXACTLY 6 strings, 22 frets, two humbucker pickups, three control knobs, a three-way selector switch, and a hardtail bridge. Dean ML body silhouette with offset pointed lower bout, sharp pointed headstock. Lighting is dramatic soft-box from upper-left at 40 degrees with minimal fill, producing gentle shaping shadows along the upper body contour and below the headstock. Guitar is positioned at 15-degree angle from vertical, hero-centered in frame with generous negative space. Shot on medium-format camera equivalent, 80mm lens at f/8. Dark backdrop creates isolation and significance — the guitar reads as a collector piece, not a retail item. Preserve all condition details with forensic honesty: visible upper horn ding lit to show its actual shape, slight fret wear visible, honest finish aging, subtle buckle rash on upper back (partial visible where body rolls to edge). Do NOT add extra strings or frets. Do NOT alter the body shape or color. Do NOT remove condition markers. Negative prompt: no bright cheerful lighting, no white backdrop, no retail-catalog aesthetic. Christie's/Sotheby's auction catalog style musical instrument photography.",
      "editInstructions": "1. Replace the backdrop with deep charcoal gradient (Hex #2B2B2F to #1A1A1E). 2. Reduce overall brightness by 20% while preserving detail in shadow areas. 3. Add subtle rim light on upper body contour. 4. Preserve all condition details — catalog-grade means forensically honest, not pristine.",
      "bestFor": "Reverb vintage lane, high-value listings, eBay for collector buyer targeting, any situation where positioning the item as a collector piece (not a commodity) justifies a premium price.",
      "expectedScoreImprovement": 1
    },
    {
      "variationName": "Social Media Hero",
      "description": "High-contrast, scroll-stopping composition designed to halt the Instagram/TikTok/Threads feed. Bold color, tight crop, music-culture aesthetic.",
      "dallePrompt": "Photorealistic high-contrast Instagram-hero photograph of a 2008 Dean MLX electric guitar in Transparent Red finish. The guitar has EXACTLY 6 strings, 22 frets, two humbucker pickups, three control knobs, a three-way selector switch, and a hardtail bridge. Dean ML body silhouette with offset pointed lower bout and sharp pointed headstock. Guitar is photographed against a solid bold-color backdrop — deep teal (#008B8B) — at a dynamic 30-degree diagonal angle from corner to corner of the frame. Lighting is directional from camera right at 60 degrees with hard-edged shadow for graphic effect. Shot with 35mm lens at f/4, ISO 400. Tight crop that fills 90% of the square 1080x1080 frame. Color saturation pushed +15 for social-feed pop without misrepresenting the actual Transparent Red. Zero text overlay. Preserve all condition details: visible upper horn ding, slight fret wear, honest aging. Do NOT add extra strings or frets. Do NOT alter the body color. Do NOT remove the ding. Negative prompt: no text overlay, no logos, no added graphics, no pristine retail perfection. High-contrast scroll-stopping music-culture social media photography.",
      "editInstructions": "1. Crop to 1:1 square at 1080x1080. 2. Replace background with solid deep teal (#008B8B). 3. Boost saturation +15 on red channel specifically. 4. Add hard-edged shadow from camera right. 5. Preserve all condition details.",
      "bestFor": "Instagram feed post, TikTok product shot, Threads listing share, Facebook Marketplace hero for younger buyers.",
      "expectedScoreImprovement": 1
    },
    {
      "variationName": "Condition Celebration",
      "description": "Warm amber-toned lighting that makes the honest wear, fret aging, and upper-horn ding look like evidence of a well-loved instrument rather than defects. CRITICAL: this variation celebrates the condition markers — it does not hide them. The iron rule of condition authenticity is the whole point of this variation.",
      "dallePrompt": "Warm intimate close-up photograph of a 2008 Dean MLX electric guitar in Transparent Red finish, photographed to highlight honest wear as evidence of use. The guitar has EXACTLY 6 strings, 22 frets, two humbucker pickups, three control knobs, a three-way selector switch, and a hardtail bridge. Dean ML body silhouette. Lighting is warm amber from camera left at 30 degrees, golden-hour color temperature approximately 3500K, soft diffusion. Fill reflector warm-toned from right. Camera at waist elevation, angled slightly upward to present the guitar with subtle reverence. Shot on full-frame camera, 85mm lens at f/3.5, shallow depth of field that keeps the upper horn ding and the fret wear in tack-sharp focus while the lower body recedes softly. The upper horn ding is PROMINENTLY VISIBLE and lit to show its actual shape and depth — this is the hero of this variation, celebrating authentic character, not hiding it. Fret wear visible and in focus. Finish aging and subtle patina readable in the warm light. Preserve every condition marker. This is explicitly a 'scars tell the story' variation. Do NOT retouch, soften, minimize, or obscure the upper horn ding. Do NOT reduce the fret wear. Do NOT remove finish aging. Do NOT make the guitar look pristine. Negative prompt: no pristine refinish aesthetic, no cloned-out wear, no flattering concealment. Honest warm nostalgic documentary music-instrument photography.",
      "editInstructions": "1. Shift color temperature warmer to 3500K. 2. Increase mid-tone contrast +10. 3. Subtle vignette -20 to focus attention on upper horn ding and fret area. 4. DO NOT retouch any condition markers. The whole point is celebrating them.",
      "bestFor": "Buyer audience that values character and provenance over pristine condition. Reverb vintage lane. Etsy buyers. Anyone looking for 'played and loved' signaling.",
      "expectedScoreImprovement": 1
    },
    {
      "variationName": "Technical Close-Up",
      "description": "Macro-style detail on the serial number, maker marks, and critical hardware. Functions as an authentication panel within the listing — proves to the buyer that everything is what it claims to be.",
      "dallePrompt": "Technical macro photograph of the back of the headstock of a 2008 Dean MLX electric guitar, focused on the serial number stamp. Serial number should read as a 7-8 character alphanumeric stamp, slightly indented into the wood, with 'MADE IN KOREA' or similar country-of-origin stamp below. Truss rod adjustment nut visible at the upper end of the headstock back. Wood is ebonized maple or mahogany back, dark in tone. Lighting is directional from camera upper-left at 30 degrees with large soft box diffusion, secondary fill from lower-right to eliminate glare on the stamp. Shot with 100mm macro lens at f/8, ISO 200, tripod-mounted for zero shake. Camera parallel to headstock back, distance approximately 12 inches. Frame filled 80% by the headstock with serial number centered. Preserve all condition details — any tool marks near tuner screws, any visible repairs, any stamp wear. Do NOT alter, enhance, or re-stamp the serial number. Do NOT add characters that are not present. Do NOT remove any surrounding wear. Negative prompt: no altered serial numbers, no fabricated stamps, no AI-generated text that replaces actual markings. Technical authentication-grade macro product photography.",
      "editInstructions": "1. Crop tightly to headstock back at 1:1 square. 2. Sharpen +30 specifically on the serial number stamp area. 3. Reduce glare if present via dodge-and-burn. 4. DO NOT alter or enhance the serial number characters — authentication images must show the actual stamp exactly as it exists.",
      "bestFor": "Reverb authentication carousel, eBay gallery position 5-6, high-value listings where buyer verification is the purchase driver.",
      "expectedScoreImprovement": 1
    }
  ],

  "conditionDocumentation": [
    {
      "issue": "Upper horn ding",
      "location": "Upper horn, front face, approximately 2 inches below the horn tip",
      "severity": "Minor",
      "photoIndex": 6,
      "photographyTip": "Shoot close-up at 45-degree side-lighting to reveal the ding's depth and shape. Avoid flash — it flattens the indentation and makes it look smaller than it is."
    },
    {
      "issue": "Slight fret wear",
      "location": "Frets 5-9, mostly on the unwound strings",
      "severity": "Minor",
      "photoIndex": 5,
      "photographyTip": "Shoot perpendicular to the fingerboard with the camera stabilized. The current photo 5 has slight motion blur — re-shoot with better stabilization for a tack-sharp close-up."
    },
    {
      "issue": "Finish aging / light buckle rash on upper back",
      "location": "Upper back of body, below strap button",
      "severity": "Minor",
      "photoIndex": 2,
      "photographyTip": "Side-lit at 40 degrees reveals the rash texture. Do not retouch — buckle rash is expected on player-grade and does not reduce value significantly when documented honestly."
    }
  ],

  "conditionPhotographyGuide": [
    "For the upper horn ding in photo 6: use 45-degree side-lighting from a single window or lamp. Avoid direct flash which flattens the ding and makes it appear smaller than reality. Frame tightly so the ding occupies at least 30% of the image.",
    "For the fret wear close-up (photo 5 needs re-shoot): brace the phone with both hands or rest it on a stack of books. Tap-to-focus on the fret you want tack-sharp. Use natural window light — flash creates hotspots on polished fret metal.",
    "For the finish aging on the back: do not 'clean up' the photo in editing. The honest aging signal is a trust signal, not a defect. Shoot in the same lighting as the other photos so the aging reads as consistent with the instrument's overall presentation."
  ],

  "salesImpactStatement": "Professional photos with the Reverb triad (headstock, serial, damage close-up) typically increase sale price by 18-25% on Dean MLX player-grade listings and reduce time-to-sell from 28 days to 10-14 days.",

  "priceImpactEstimate": {
    "currentPhotoQuality": "Good",
    "estimatedPriceBoost": "15-20% above category median",
    "estimatedTimeReduction": "28 days to 12-16 days"
  },

  "professionalTips": [
    "For the full-body shots: use phone HDR ON, shoot 3 feet back at eye level with tap-to-focus on the Dean logo. Window light from camera-left produces the shaping shadow that makes the body's carved contour readable.",
    "For the headstock close-up: move to 14-16 inches, tap-to-focus on the 'D' in Dean, enable grid-lines for rule-of-thirds centering, and hold the phone absolutely still. Natural window light diffused by a white curtain is ideal — the current photo 3 already does this well.",
    "For the serial number close-up: turn off flash. Position a desk lamp or flashlight at 30 degrees from the left to rake across the stamp and reveal the character impressions. Tap-to-focus directly on the number. Shoot at phone's base ISO (usually 50 or 100) for cleanest detail.",
    "For the fret wear close-up (re-shoot needed): stabilize the phone against the guitar body itself or use a stack of books. Tap-to-focus on the specific fret you want sharp. Use 4500K white balance or 'Cloudy' mode to get accurate metal color without cool cast.",
    "For the case-with-candy shot: open the case fully so the interior lining is visible. Photograph from above at 4 feet elevation to capture the full context. Include any hang tags, manuals, or original documentation — these are significant value signals for Reverb buyers."
  ],

  "lightingSetup": "Natural window light from camera-left, diffused by a sheer curtain or white bedsheet. Window should be large (at least 4 feet by 4 feet) and positioned 6-8 feet from the guitar. No flash. If shooting in evening or low light, supplement with a single daylight-balanced (5500K) LED panel positioned to match the window direction. Avoid mixing incandescent room lighting with window light — turn off overhead room lights during the shoot.",

  "backgroundRecommendation": "Clean linen or neutral-gray backdrop. A white bedsheet taped to a wall works. For the Dean MLX specifically, a slightly warm-toned linen (not pure white) complements the Transparent Red finish better than clinical white — the red reads richer against a neutral backdrop. Zero clutter in frame.",

  "priorityAction": "Your photo set is already above category median — backdrop, lighting, and hero shot are well-executed. The single highest-impact change right now is to re-shoot photo 5 (fret close-up) with better stabilization. Here's exactly how: 1) Rest the phone on a stack of books or against the guitar body itself. 2) Tap-to-focus on fret 7 (the most worn). 3) Use natural window light from camera-left. 4) Take three shots — select the sharpest. Expected impact: sharpnessScore rises from 7 to 8, overallPhotoScore rises from 8 to 8+, and the fret wear signal becomes readable for player-grade buyers (who make 60% of Dean MLX purchases).",

  "secondaryActions": [
    "Add a neck-joint (heel) close-up. Shoot from about 12 inches away, with side-lighting to reveal the join line. Confirms set-neck vs bolt-on construction — a 15-25% price signal for Dean MLX collectors.",
    "Add pickup close-ups for both neck and bridge positions. Shoot each directly from above at 8-10 inches distance with diffused light. Confirms pickup configuration (stock DMT vs swap) — this is the #2 value signal after condition.",
    "Add one scale reference shot. Place a standard 12-inch ruler along the guitar body in one wide shot. Confirms actual scale for first-time Dean MLX buyers."
  ],

  "buyerEmotionalTrigger": "Nostalgia and belonging. The Dean MLX 2008 reissue is a Dimebag Darrell tribute, so the buyer pool is primarily metal players and Pantera fans in their 30s-50s. Your linen backdrop and case-with-hang-tags photo 7 triggers 'this guitar has been loved' — which is the exact emotional signal this buyer audience responds to.",

  "trustSignals": [
    "Original case with visible hang tags in photo 7 — signals careful ownership",
    "Honest upper-horn ding documented in photo 6 — seller transparency builds trust",
    "Readable serial number close-up in photo 4 — authentication evidence",
    "Consistent linen backdrop across all 7 photos — signals investment in presentation",
    "Natural window lighting (no flash) — phone-grade photos feel authentic rather than over-produced"
  ],

  "purchaseBarriers": [
    "Photo 5 (fret close-up) motion blur may cause player-grade buyers to ask for a re-shoot before committing",
    "Missing neck-joint photo may cause some collector buyers to hesitate until they can verify construction",
    "No explicit scale reference — some first-time Dean buyers may not be confident about actual size"
  ],

  "competitiveEdge": "This photo set is in the top 15% of 2008 Dean MLX player-grade listings on Reverb. The Reverb-specific triad (headstock, serial, damage close-up) is all present — most competing listings have 2 of 3. The linen backdrop and case+hang-tags shot put this above category median for presentation. With the neck-joint addition and fret-photo re-shoot, this moves into the top 5% — which correlates historically with 18-25% price lift over median and 2-3x faster sale.",

  "platformPhotoGuide": {
    "ebay": {
      "heroShotAdvice": "Use photo 1 (full body front) as hero. eBay's Cassini algorithm rewards isolated hero shots — your linen backdrop works but a pure white backdrop would rank slightly higher. Consider cropping tighter so the guitar fills 80% of the frame rather than the current 60%.",
      "galleryOrder": ["Photo 1 (hero)", "Photo 2 (back)", "Photo 3 (headstock front)", "Photo 4 (serial)", "Photo 6 (damage)", "Photo 7 (case)", "Photo 5 (fret, after re-shoot)"],
      "aspectRatio": "Square (1:1), 1600px+ longest side",
      "backgroundPreference": "White seamless preferred; current linen backdrop is acceptable and slightly more character-rich"
    },
    "facebook": {
      "heroShotAdvice": "Use photo 7 (case with hang tags) as hero. Facebook Marketplace rewards context shots over isolated product shots — the case signals 'this is a real person selling a real guitar,' which drives higher click-through on FB feed.",
      "galleryOrder": ["Photo 7 (case hero)", "Photo 1 (full body)", "Photo 3 (headstock)", "Photo 2 (back)", "Photo 6 (damage)"],
      "aspectRatio": "Square (1:1) or 4:5 portrait",
      "mobileFirst": true
    },
    "etsy": {
      "heroShotAdvice": "Use photo 7 (case with hang tags) as hero — Etsy's buyer profile rewards lifestyle context over isolated product. Consider adding a wider shot of the guitar on the case for an even warmer hero option.",
      "galleryOrder": ["Photo 7 (case hero)", "Photo 1 (full body)", "Photo 3 (headstock detail)", "Photo 4 (serial)", "Photo 6 (damage transparency)", "Photo 2 (back)"],
      "aspectRatio": "Square (1:1)",
      "lifestyleEmphasis": true
    },
    "instagram": {
      "squareCropAdvice": "Center the body on photo 1 with tight 1:1 crop — the Dean ML silhouette fills the square and stops the scroll. Use the 'Social Media Hero' enhancement variation (deep teal backdrop) for a higher-impact Instagram-specific post.",
      "gridAesthetic": "Alternate between wide shots (photos 1, 7) and detail shots (photos 3, 4) for grid rhythm. Current earth-toned linen works well with warm Instagram aesthetics.",
      "reelConcept": "15-second reel: slow 360-degree rotation of the guitar starting on the headstock (photo 3 angle), panning to full body (photo 1), back to serial close-up (photo 4), end on case with hang tags (photo 7). Soft Pantera or metal instrumental audio. Text overlay: 'For sale — 2008 Dean MLX, player grade, all original, local pickup Maine.'"
    }
  }
}
```

---

## Before and After: Amateur vs Specialist Photo Output

The difference between a generic AI photo-review response and a
specialist MegaBot PhotoBot output is visible in the quality of
the recommendations.

### Amateur

"Your photos look okay. Try adding more photos and making sure
the lighting is good. Maybe use a white background. The guitar
looks nice."

What a seller takes from this: vague discomfort, no action.
The seller doesn't know what to do differently. The listing
doesn't improve.

### Specialist

"Your photo set is in the top 15% of 2008 Dean MLX player-grade
listings on Reverb. The Reverb triad (headstock, serial, damage
close-up) is present. The single highest-impact change is to
re-shoot photo 5 (fret close-up) with better stabilization —
rest the phone on a stack of books, tap-to-focus on fret 7,
natural window light from camera-left. Next priority: add a
neck-joint close-up and both pickup close-ups. With these
additions, this listing moves into the top 5% of category,
which correlates to 18-25% price lift and 2-3x faster sale."

What a seller takes from this: specific actions they can
execute today, a clear expected outcome, and an honest
positive framing of what already works. The listing improves
measurably.

Every MegaBot PhotoBot output is held to the specialist
standard. The seller walks away with a catalog-shoot-grade
report they can execute.

---

## What the Premium Output Is For

This output is the document a seller references when:

- Deciding which photo to make the cover
- Deciding which shots to re-take before publishing
- Generating enhanced variants with DALL-E for platform-
  specific posts
- Writing the condition disclosure in the listing description
- Evaluating whether the photo set justifies their target
  price or whether more work is required first

Each of those decisions needs different fields. The complete
schema means every decision is supported by the output —
sellers never have to guess or backfill the assessment
themselves.
