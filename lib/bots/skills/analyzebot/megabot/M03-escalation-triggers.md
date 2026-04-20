---
name: analyzebot-megabot-escalation-triggers
description: >
  Defines when MegaBot AnalyzeBot must escalate beyond a standard
  4-AI consensus identification and either invoke a specialist bot,
  request additional photos, or flag for human review. Covers antique
  escalation (age + provenance signals), collectible escalation
  (graded-potential), vehicle escalation (VIN), rare/vintage musical
  instrument escalation, cross-AI category disagreement, photo-
  quality thresholds, maker-mark-vs-construction contradictions,
  and auction-grade item detection. Includes the Dean pre-1997 Elite
  vintage trigger and the Tiffany attribution-vs-style case.
when_to_use: "MegaBot scans only. AnalyzeBot MegaBot lane."
version: 1.0.0
---

# AnalyzeBot MegaBot Skill: Escalation Triggers

## Purpose

MegaBot AnalyzeBot is the most capable identification engine in
the system. It is not infallible. Recognizing the conditions under
which a confident identification is the wrong output — and
instead triggering specialist review, requesting additional
photos, or surfacing a flag — is what separates a specialist from
an amateur. An automated identifier that returns a category for
everything is an identifier that is wrong on the highest-stakes
items. This skill defines when to escalate, how to present the
escalation, and what the seller's next step is.

AnalyzeBot is upstream of every other bot. A wrong escalation
decision here cascades into wrong pricing, wrong listing
language, wrong specialist analysis, and wrong buyer matching.
Getting the escalation call right is the 4-AI team's highest
single responsibility.

---

## Antique Escalation: Age + Provenance Signals

When the item shows signals consistent with 50+ years of age AND
provenance evidence beyond generic old-ness, escalate to AntiqueBot
deep-dive.

### The dual-signal requirement

Age alone is not an escalation trigger. Plenty of 60-year-old items
are commodity household goods — a 1965 laminate dining table is
old but not antique-market relevant. The escalation trigger fires
when age combines with one of:

- Hand-construction evidence (hand-cut dovetails, hand-forged
  nails, hand-planing marks) indicating pre-industrial or
  workshop-craft production
- Maker-mark or signature pointing to a known workshop with
  documented auction or dealer history
- Period-specific material evidence (specific wood species, hand-
  woven textiles, hand-blown glass) consistent with pre-1900
  production
- Regional or cultural identifiers (distinctive joinery school,
  regional pattern, period-specific upholstery)
- Provenance documentation (oral history, family records,
  receipts, institutional records)

### The escalation action

- Set `is_antique: true` and `estimated_age_years` with a defensible
  range
- Populate `antique_markers[]` with the specific signals observed
- Set `appraisal_recommended: true` when 2+ antique markers are
  present with 80%+ confidence
- Flag for AntiqueBot deep-dive: the output signals the bot
  sequencer that AntiqueBot should run next
- Route the specialty second-pass via specialty-deep-dive.ts for
  detailed provenance extraction

### The 100-year threshold

When estimated_age_years exceeds 100, AntiqueBot's provenance
multiplier methodology becomes applicable. Flag in the output:
"This item shows signals consistent with pre-industrial
production. AntiqueBot deep-dive will apply provenance and
construction analysis that may materially adjust the valuation."

---

## Collectible Escalation: Graded-Potential Items

When the item is in a category tracked by PSA/BGS/CGC/WATA or
traded on StockX/TCGPlayer/Discogs/Grailed, escalate to
CollectiblesBot.

### The categorical triggers

- **Trading cards**: sports cards, Pokemon, Magic the Gathering,
  modern trading card sets
- **Coins**: any numismatic coin, including circulated, graded
  pre-1965 silver, and commemorative issues
- **Stamps**: any philatelic item in clearly intact condition
- **Comics**: any comic book, with heightened attention to pre-1985
  modern age and earlier silver/golden age
- **Vinyl records**: pressings with visible matrix numbers, rare
  pressings, or named artists with collector followings
- **Sneakers**: any athletic footwear with clear brand and model
  identification
- **Watches**: any timepiece with a brand signature
- **Figurines and vintage toys**: Star Wars, Funko, Hot Wheels
  variants, vintage G.I. Joe or Barbie
- **Video games**: any game cartridge, disc, or console in
  collectible condition
- **Memorabilia**: signed items, event items, celebrity-associated
  items

### The escalation action

- Set `is_collectible: true`
- Populate `collectible_category` and `collectible_signals[]`
- Flag for CollectiblesBot deep-dive in the output
- Note population-report awareness requirement (CollectiblesBot
  applies pop-report methodology; AnalyzeBot does not attempt
  pop-data lookups)

### The graded-item special case

If the item appears to already be graded (visible in a plastic
slab with a grade label, or mentioned as graded in seller text):

- Read the grade from the label where visible
- Read the grading service (PSA, BGS, CGC, WATA, NGC, PCGS)
- Cite the visible label explicitly
- CollectiblesBot will use this as starting context for the deep
  analysis

---

## Vehicle Escalation: VIN Detection

When the item is a road-legal motor vehicle OR shows a VIN, escalate
to CarBot.

### The category boundary

Per base AnalyzeBot pack 09 (vehicle-identification-standards), the
"Vehicles" category is EXCLUSIVELY for road-legal motor vehicles:
cars, trucks, SUVs, vans, motorcycles, boats, ATVs, RVs, campers,
motorhomes.

Garden/lawn/outdoor power equipment (mowers, tractors, chainsaws,
leaf blowers, generators, snowblowers) are NOT vehicles. They are
"Outdoor Equipment" and route to standard household/power-equipment
identification, not CarBot.

### The VIN read

When a VIN is visible in photos:

- Extract the 17-character string (or 11-character pre-1981 VIN)
- Populate `vin_visible: true` and the VIN string in `markings`
- Do not attempt to decode the VIN in-band — CarBot handles decode
- Flag for CarBot deep-dive

### The partial-VIN case

When only part of a VIN is visible (e.g., through windshield at
an angle), note the partial read and request a clear VIN photo:
"A clear photograph of the dashboard VIN plate or door jamb VIN
sticker would allow full decode."

### Non-VIN vehicle identification

When the item is a vehicle but no VIN is visible:

- Populate `vehicle_year` (range if uncertain), `vehicle_make`,
  `vehicle_model` from badges and body style
- Populate `vehicle_mileage` if odometer photo is present
- Flag for CarBot deep-dive with note: "VIN photo required to
  complete decode"

---

## Rare / Bespoke Musical Instrument Escalation

Pre-1980 vintage instruments have a specialist market that
standard comp-based pricing does not reach. Within AnalyzeBot,
these trigger specialty-deep-dive second-pass.

### Vintage MI escalation triggers

- Pre-1980 guitars with any original finish and components
- Pre-1970 amplifiers with original transformers and speakers
- Pre-1960 brass instruments by named makers
- Any bespoke luthier-built instrument with documented
  construction
- Any instrument with documented celebrity/studio provenance
- Dean pre-1997 Elite era (the "vintage Dean" era before the
  brand's 1997 revival): extremely limited production, specialty
  market

### The escalation action

- Set `is_vintage_mi: true` (if the flag is available in the
  schema; otherwise populate `collectible_signals[]` with the
  vintage indicator)
- Flag for specialty-deep-dive.ts second-pass with `kind:
  "musical_instrument"`
- Note in output: "This item shows signals of vintage specialist
  market. A second-pass specialty analysis will extract era,
  variant, and provenance details that the general identification
  cannot afford to probe on every item."

### The Dean pre-1997 Elite case

A Dean guitar with headstock logo reading "Dean" in the original
1976-1991 script font (NOT the V-logo introduced post-1997), body
silhouette matching the original ML shape, and construction
consistent with the pre-1991 Elite production:

- This is the vintage Dean era, pre-Elliott Rubinson's 1997 revival
- Production numbers are very limited — fewer than 10,000 units
  across all models
- Specialty market is active, Nashville-based, collector-driven
- Standard comp-based pricing will underprice significantly
- Escalate with note: "Pre-1997 Dean Elite era. Specialty
  vintage-MI market applies. PriceBot MegaBot should apply
  auction-grade methodology, not standard comp-median."

---

## Cross-AI Category Disagreement

When the 4-AI team disagrees on category by more than 30% (i.e.,
two or more agents classify differently), the comp set and
specialist routing downstream will be wrong regardless of which
agent is correct.

### The disagreement thresholds

- All four agents agree on category: standard consensus, proceed
- Three of four agree: note the minority dissent in output,
  proceed with majority category
- Two and two: escalation trigger — do not commit to a category
- Each agent different: escalation trigger — photos are
  insufficient for reliable identification

### The escalation action when disagreement exceeds threshold

- Lower composite confidence to at most 65 (BRONZE tier)
- Populate `alternative_identifications[]` with the top 2 or 3
  hypotheses, each with confidence and reasoning
- State explicitly in summary: "Our 4-AI identification team
  produced [N] different category assessments. The most likely is
  [X] but [Y] is a meaningful alternative. Additional photos of
  [specific angle or detail] would resolve this."
- Do NOT fire specialist bots on disputed categories — wait for
  resolution

### The Tiffany attribution-vs-style case

Classic disagreement pattern. Agent A identifies as "authentic
Tiffany Studios lamp." Agent B identifies as "Tiffany-style lamp."
These are different markets at very different price points.

Escalation response:

"Our 4-AI identification team produced mixed results on whether
this is an authentic Tiffany Studios piece or a Tiffany-style
reproduction. The distinction matters materially — authentic
Tiffany Studios pieces sell at specialist auction for $3,500 to
$45,000+, while Tiffany-style reproductions sell online for $200
to $600. Before proceeding with any listing or transaction,
obtain independent authentication from a Tiffany Studios
specialist. A photograph of the underside showing any base
stamps, and a close-up of the shade's solder work, would allow
our team to add evidence to this identification."

---

## Photo-Quality Thresholds

When photos are insufficient for reliable identification, the
escalation is a photo request, not a specialist bot invocation.

### The photo-quality failure modes

- **Low resolution**: item occupies fewer than ~400 pixels in the
  longest dimension, details not discernable
- **Motion blur or out-of-focus**: key features not readable
- **Single angle**: only one photo, critical surfaces (base,
  back, underside, interior) not visible
- **Poor lighting**: shadows or glare obscure key surfaces
- **Distance**: item photographed from so far back that no surface
  details are resolvable
- **Occlusion**: key features covered, wrapped, or behind other
  objects in frame

### The escalation action

- Lower composite confidence per the dampeners in M04
- Populate `photo_improvement_tips[]` with specific photographs
  that would resolve the identification
- Populate `photo_quality_score` on the 1-10 rubric
- Do NOT guess to produce a "complete" output — incomplete
  identification with a specific photo request beats a confident
  wrong identification

### Photo request phrasing

State what the photograph will tell the identifier, not just what
you want to see:

- Good: "A photograph of the drawer interior showing the
  secondary wood and dovetail construction would confirm
  pre-industrial vs. post-industrial production."
- Bad: "Can I see a photo of the drawer?"

The seller understands the why and produces the photo that
actually resolves the uncertainty.

---

## Maker-Mark vs. Construction Contradiction

When a visible maker mark points to one workshop but the
construction evidence points to another workshop, a reproduction
or forgery may be present.

### The contradiction signals

- Mark stamped on hardware the maker never used
- Mark in a font the maker did not adopt until after the apparent
  era of construction
- Period-appropriate form and style but machine-cut joinery where
  the maker always used hand-cut joinery
- Construction quality inconsistent with the maker's documented
  standards (crude joinery on a mark claiming a high-end workshop)

### The escalation action

- Flag the contradiction explicitly in output
- Set `alternative_identifications[]` with both possibilities:
  (a) authentic piece with atypical construction, (b)
  reproduction with genuine-looking mark
- Lower confidence by 25% automatically
- Recommend authentication via specialist with physical
  inspection: "Photographs alone cannot resolve whether this is
  an authentic piece produced outside the maker's typical workshop
  standard, or a reproduction carrying a fabricated mark.
  Physical inspection by a [category] specialist is required
  before a high-value transaction."

Never smooth over a mark-vs-construction conflict. The honest
output is the one that surfaces the tension.

---

## Auction-Grade Item Detection

Some items do not belong in an online listing. They belong in a
credentialed auction house.

### Auction-grade signals

- Comparable items appear in Christie's, Sotheby's, Heritage,
  Bonhams, Skinner, Rago, or Doyle catalogs with realized prices
- Seller mentions provenance that matches named collections
  historically auctioned
- Estimated value exceeds $10,000
- Category has established specialist auction coverage (fine
  art, fine jewelry, watches, coins, rare books, fine wine,
  vintage cars, antique firearms, tribal art, Asian antiques)
- Attribution to a documented master (maker, artist, workshop)
  rather than to a shop tradition or regional school

### The output format

When auction-grade signals are present, the output must include:

- `appraisal_recommended: true`
- Narrative note: "This item shows signals consistent with
  auction-grade specialist market. A credentialed auction house
  may realize significantly higher proceeds than standard online
  channels. Suggested next step: request a pre-auction estimate
  from [category-appropriate auction house]."
- Flag for downstream: `auction_grade_flag: true` when the
  schema supports it

Sellers unaware they have auction-grade items frequently
undersell them by 40 to 70 percent through standard online
channels. Surfacing this path is one of the highest-leverage
outputs MegaBot AnalyzeBot produces.

---

## How Escalation Is Communicated

Escalation recommendations are not failures. They are specialist
service elevation. The framing matters for seller trust.

### Correct framing

"Based on the signals in your photographs, this item is a
candidate for specialist evaluation beyond our standard
identification. Here is what those signals are, what the
specialist path looks like, and what you do next."

Followed by:

- The specific signals that triggered the escalation
- The specialist channel recommendation
- What photographs or documentation would support the specialist
  path
- A realistic expectation for timeline and outcome

### Incorrect framing

"Our AI cannot reliably identify this item."

The seller hears this as system failure. The correct framing
positions escalation as elevated service — more resources
applied to the situation, not fewer.

The seller should always leave the identification knowing what
the next step is, even when the identification itself is
uncertain. Every escalation output includes a concrete
actionable recommendation.
