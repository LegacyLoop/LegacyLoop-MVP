---
name: analyzebot-megabot-deep-specialty-expertise
description: >
  Specialist identification methodology for the 4-AI parallel
  identification team. Covers the identification dependency chain,
  photo-evidence triangulation rules, material reading discipline,
  maker-mark rigor, era/style attribution, and eight-point condition
  scoring. Includes seven domain archetypes (musical instruments,
  collectibles, vehicles, antiques, jewelry, household goods, tools
  and power equipment) with worked examples. Musical-instrument
  archetype is the canonical test fixture (Dean MLX). AnalyzeBot is
  the foundation bot — every downstream bot depends on its output,
  so the specialist layer defines the rigor every ID is held to.
when_to_use: "MegaBot scans only. AnalyzeBot MegaBot lane."
version: 1.0.0
---

# AnalyzeBot MegaBot Skill: Deep Specialty Expertise

## Purpose

When AnalyzeBot operates inside the MegaBot lane, four AI models
read the same photographs in parallel and produce independent
identification hypotheses. The output is not a voted category label
— it is a synthesized specialist identification assembled from four
perspectives. The difference between a voted label and a synthesized
identification is the difference between "we guessed" and "we have
construction, material, mark, wear, and provenance evidence that
aligns."

This skill defines the identification methodology the 4-AI team
uses. The dependency chain, the evidence triangulation, the
condition scoring, the era attribution, the material reading, the
maker-mark rigor — the methodology that separates a catalog-grade
identification from a gallery-wall guess. AnalyzeBot is the
foundation bot: PriceBot, ListBot, AntiqueBot, CollectiblesBot,
CarBot, BuyerBot, PhotoBot, and ReconBot all consume AnalyzeBot's
output. If AnalyzeBot gets the category wrong, every downstream bot
produces coordinated nonsense. The specialist layer is where we
earn the right to be the first bot in the chain.

---

## The Identification Dependency Chain

Every identification follows the same order. Skipping a step or
inverting the chain produces downstream contradiction.

### Step 1 — Category

What kind of object is this. Not what it is specifically, but what
class. A chair. A guitar. A ceramic vessel. A silver serving piece.
Category is determined from form and function alone, before any
maker or era hypothesis. Four-AI category agreement is the first
convergence milestone.

### Step 2 — Brand / Maker

Who made it. Determined from visible marks, signatures, labels, or
style attribution when marks are absent. Marks are dispositive
when legible and genuine. Style attribution is circumstantial and
caps confidence (see M04 for the ceiling).

### Step 3 — Model / Pattern / Form

Within the maker's catalog, which specific product. A Gibson Les
Paul is a model. A Roseville Donatello is a pattern. A Federal
bow-front chest is a form. Model identification requires both the
maker AND the specific catalog entry — Gibson alone is not enough
to price, because a Les Paul Studio and a Les Paul Custom trade at
very different price points.

### Step 4 — Era / Date

When was it made. Ranges are acceptable when precise dating is not
possible, but the range must be defensible from construction,
material, or stylistic evidence. A ten-year range is usable. A
fifty-year range is a hedge.

### Step 5 — Materials

What is it made of. Wood species, metal alloy, textile fiber,
ceramic body, stone type. Materials both confirm the identification
(period-appropriate materials match the era hypothesis) and drive
value (solid walnut is not particleboard veneer).

### Step 6 — Condition

Cosmetic condition, functional condition, completeness. Scored
against the eight-point rubric below. Never inferred from seller
text when photos are available — photos are dispositive.

### Step 7 — Provenance / Context

Country of origin, regional attribution, prior ownership signals.
Provenance is a multiplier, not a prerequisite. Absence of
provenance does not lower value; presence of documented provenance
amplifies it (see M04 provenance amplifier).

Each step depends on the prior steps. A maker hypothesis that
contradicts the category is a red flag. An era hypothesis that
conflicts with the construction evidence is a red flag. The 4-AI
team cross-checks the chain before committing to a final
identification.

---

## Eight-Point Condition Scoring

Condition is the single most common failure mode in amateur
identification. The 4-AI team scores on an eight-point rubric
anchored to visible photo evidence.

### The eight dimensions

1. **Cosmetic surface** — finish integrity, paint wear, patina
   authenticity, scratches, stains
2. **Structural integrity** — joints, seams, frames, supports. Is
   the object structurally sound or compromised
3. **Functional components** — moving parts, electronics, plumbing,
   mechanical systems. Works vs. does not work
4. **Completeness** — all original parts present, no replacements,
   original packaging or case where applicable
5. **Originality** — factory finish preserved vs. refinished,
   matching hardware, no later modifications
6. **Wear pattern authenticity** — honest use wear vs. artificial
   aging, consistent with stated age
7. **Damage documentation** — cracks, chips, repairs, losses
   visible in photos
8. **Authenticity confidence** — real vs. reproduction vs. fake,
   based on construction and material evidence

Each dimension contributes to the composite condition score (1 to
10). A composite of 7/10 with photo evidence for every dimension
is usable. A composite of 7/10 based on "photos look fine" is not.

### Condition score bands

- 10 — Mint, museum-grade, unused with original packaging
- 8 to 9 — Excellent, lightly used, all original, no flaws visible
- 6 to 7 — Good, honest wear, all original, functional
- 4 to 5 — Fair, visible flaws, functional or restorable
- 2 to 3 — Poor, significant damage or modification
- 1 — Parts only, not usable as whole

The 4-AI team aligns on composite score within ±1 point for a
confident condition claim. Disagreement of 2+ points is a signal
that the photo evidence is ambiguous or that different agents are
weighting different dimensions — this must be flagged, not
averaged.

---

## Era and Style Attribution Discipline

Era claims are where amateur identifications fail most visibly.
"Vintage" is not an era. "Antique" is not an era. "Mid-century" is
not an era unless narrowed to a decade.

### Decade vs. range confidence

- **Specific decade** (e.g., "1950 to 1959"): requires at least two
  independent dating signals — construction method, material
  availability, dated component, or documented design period.
- **Two-decade range** (e.g., "1890 to 1910"): requires at least
  one strong dating signal plus consistent style evidence.
- **Half-century range** (e.g., "1800s"): acceptable as a fallback
  when specific evidence is absent but at least one broad dating
  signal is present.
- **"Vintage" without years**: unacceptable. If the era cannot be
  narrowed beyond "vintage," state "era not determinable from
  photos" and request additional imagery.

### Style attribution is circumstantial

Style (Federal, Victorian, Eastlake, Arts and Crafts, Mid-Century
Modern) tells you what the maker was emulating. It does not tell
you when the object was produced. A Victorian-style chair made in
1980 is not an antique. The 4-AI team distinguishes period (when
made) from style (what tradition it references) explicitly in the
output.

### Construction evidence trumps style

When style says one era and construction evidence says another,
construction evidence wins. A piece with Phillips-head screws is
post-1936 regardless of how "Victorian" it looks. A piece with
hand-cut dovetails is pre-industrial regardless of how modern the
upholstery appears (upholstery is the most-commonly-replaced
component). Construction is the dateable substrate.

---

## Material Recognition

Materials are both a dating tool and a value driver. Misidentifying
material cascades into misdated era and mispriced market
position.

### Wood

- **Oak**: prominent medullary rays on quartersawn surfaces; pale
  to honey color; very hard
- **Walnut**: swirling grain, chocolate to gray-brown, medium
  hardness
- **Mahogany**: straight tight grain, reddish-brown, medium
  hardness; period Cuban mahogany is denser than modern Honduran
- **Cherry**: pale pink when fresh, darkens with age to rich amber
- **Pine**: wide soft grain, resin pockets, light weight
- **Rosewood**: dense, dark, often streaked with black; subject to
  CITES regulation for post-2017 sales
- **Ebony**: nearly black, minimal grain, very dense

### Metal

- **Brass**: warm yellow, develops verdigris in recesses
- **Bronze**: cooler yellow-brown, heavier than brass, harder
- **Copper**: distinctly reddish
- **Silver**: bright white, gray-black tarnish; hallmarks are
  dateable
- **Pewter**: soft muted gray
- **Nickel silver**: silver-gray, no actual silver content
- **Chrome plating**: mirror-bright, post-1920 only
- **Japanned iron**: black lacquer over iron, Victorian-era common

### Textile

- **Silk**: natural sheen, fluid drape
- **Wool**: matte, has weight
- **Cotton**: flat, lacks sheen
- **Linen**: slubbed texture from flax fibers
- **Synthetic fibers**: post-1935 (nylon), post-1953 (polyester
  consumer use)

### Ceramic

- **Porcelain**: translucent when thin, rings when struck
- **Bone china**: whitest, lightest
- **Stoneware**: dense, opaque, thudding sound
- **Earthenware**: porous, unglazed base shows clay color

The 4-AI team names the material specifically and cites the visual
evidence that supports the identification. "Wood" is not a material
claim. "Quartersawn white oak" is.

---

## Maker-Mark and Hallmark Rigor

Marks are the dispositive evidence in identification. A legible,
authentic mark is worth more than any amount of style attribution.
But marks are also the most-commonly-faked signal — reproductions
are often stamped with genuine-looking marks to deceive.

### The signal hierarchy

- **Stamped or impressed mark with documented maker catalog
  match**: dispositive, high confidence
- **Painted or printed mark with documented maker catalog match**:
  strong evidence, check for period-appropriate application
  technique
- **Label with maker, model, and serial number**: strong evidence
  when the label itself is period-appropriate
- **Signature**: strong evidence when handwriting matches
  documented maker exemplars
- **Unmarked piece attributed by style**: circumstantial, caps at
  80 percent confidence (see M04)

### The counterfeit flag

If the mark is present but the construction contradicts the maker
(e.g., "Tiffany" stamped on machine-cut hardware that Tiffany
never used), flag the contradiction and escalate to authentication
review. Never smooth over a mark-vs-construction conflict —
reproduction merchandise with genuine-looking marks is a market
reality.

### Mark photography request

When a photo shows a mark area but the mark is not legible,
request a close-up photo of the specific mark with raking light.
This single additional photo often converts a BRONZE
identification to a GOLD identification with no other input
change.

---

## Photo-Evidence Triangulation

Identification confidence scales with the number of independent
photo-derived signals that converge on the same hypothesis.

### Three-signal convergence (GOLD-tier evidence)

When three independent signals all support the same
identification — e.g., form (consistent with maker's style),
construction (period-appropriate to maker's era), and material
(matches maker's documented materials) — the identification is
triangulated and can be stated confidently.

### Two-signal convergence with one contradiction

When two signals support the hypothesis but one contradicts (e.g.,
form and material match but construction does not), the
identification must address the contradiction explicitly. Either
the contradicting signal is mis-read, or the identification is
wrong. Don't hide the tension.

### Single-signal identification

When only one signal supports the hypothesis — typically a
visible maker mark with no corroborating construction or material
evidence — the identification is provisional. A mark alone can be
faked. State the provisional nature and request additional
photos that would add corroborating evidence.

---

## Seven Domain Archetypes

Every item maps to one of seven identification archetypes. The
archetype determines which evidence lines get the most weight.

### 1. Musical Instruments (THE TEST FIXTURE)

The Dean MLX is the canonical AnalyzeBot test case. Musical-
instrument identification follows these rules:

- **Headstock logo and inlay** is primary identification signal.
  Gibson, Fender, Dean, PRS, Martin — each has a distinct
  headstock silhouette and logo treatment that changed across
  production eras.
- **Neck joint construction** dates the instrument. Bolt-on with
  four-bolt plate is Fender-family post-1950s. Set-neck with
  mortise-and-tenon is Gibson-family. Neck-through is specific to
  certain builders and eras.
- **Body curve and cutaway geometry** is model-specific. The ML
  shape (Dimebag Darrell's signature silhouette) is distinct from
  a Les Paul or Strat at a glance.
- **Pickup layout** corroborates model. A 2008 Dean MLX with
  original pickups reads as original spec. Swapped pickups
  indicate modification that affects both ID confidence and
  collector value.
- **Tuners** date the era. Kluson-style with small buttons is
  pre-1970s or vintage-reissue. Grover-style with large buttons
  is post-1970s or upgrade.
- **Serial number format** dates production year. Dean's Korean
  production (pre-1985) vs. Chinese production (post-1985) has
  distinguishable serial conventions.

For a 2008 Dean MLX: headstock V-logo confirms Dean. ML body
silhouette confirms model. Set-neck joint, Grover tuners,
humbucker pair, Tune-o-Matic bridge — all consistent with the
2008 reissue run. Serial prefix confirms era. Three-signal
convergence minimum.

### 2. Collectibles (cards, coins, stamps, memorabilia)

- **Print identifiers** are dispositive: year, set, card number,
  mint mark. These are the category's serial number equivalent.
- **Graded vs. raw** is a fundamental market split. Graded items
  carry the grade as a first-class identification attribute.
- **Condition signals** are stricter than other categories —
  centering, corner sharpness, surface gloss, edge wear all matter
  for grade assignment.
- **Population report awareness** informs rarity claims (see
  CollectiblesBot for deep scarcity math).

### 3. Vehicles (cars, trucks, motorcycles, boats, RVs)

- **VIN is dispositive** when visible. The VIN encodes make,
  model, year, engine, assembly plant.
- **Badges and trim** corroborate the VIN read.
- **Mileage from odometer photo** is critical for condition
  scoring.
- **Title status** (clean, rebuilt, salvage) creates separate
  markets — ask the seller if not visible.
- **CarBot escalation path** (see M03) for deep VIN decode.

### 4. Antiques (pre-1950 furniture, decorative arts, silver)

- **Construction joinery** is the primary dating signal
  (hand-cut dovetails, cut nails, square screws).
- **Secondary wood species** in drawer bottoms and back panels
  reveals regional attribution.
- **Original surface vs. refinished** is a major value driver —
  refinishing halves antique value in most categories.
- **Hallmarks on silver** are fully dateable by maker and assay
  office.
- **AntiqueBot escalation path** (see M03) for provenance deep
  dive.

### 5. Jewelry (precious metals, gemstones, designer pieces)

- **Hallmark identification** is mandatory before pricing —
  gold karat, silver fineness, platinum stamp.
- **Designer signatures** (Cartier, Tiffany, David Yurman,
  Bulgari) are brand-driven market separators.
- **Stone identification** requires close-up photos for gem type
  and grading; assume the stone is what it looks like, but flag
  testing requirement for valuation.
- **Melt value is the floor** for precious-metal pieces.

### 6. Household Goods (commoditized furniture, kitchen, linens)

- **Maker stamps** on back panels or undersides are common
  signals.
- **Material quality** separates builder-grade from solid-wood
  production.
- **Era** is often less critical than for antiques — a 1990s
  dining table and a 2010s dining table trade similarly if
  condition is similar.
- **Condition floor is steeper**: a visible flaw can halve
  market value for commoditized categories.

### 7. Tools and Power Equipment (hand tools, lawn equipment, power tools)

- **Brand and model plate** is the primary identification signal.
- **Running condition** is a binary market splitter — won't
  start cuts value to parts-only tier.
- **Era matters** for vintage hand tools (pre-1960 Stanley
  planes, vintage Disston saws) but less for post-2000 power
  equipment.
- **Completeness** (original accessories, manuals, cases) adds
  meaningful value for vintage hand tools.

---

## Synthesis: What the 4-AI Team Actually Produces

After each model reads the photos independently against the same
seller context, the synthesis layer selects elements from each:

- **OpenAI** — structural completeness (every field populated
  against the identification chain)
- **Claude** — specialist narrative (product_history,
  maker_history, construction_analysis)
- **Gemini** — current web grounding and maker catalog reference
- **Grok** — cultural and subcultural context (player vs.
  collector community, fan communities, regional traditions)

A four-AI convergence on category, maker, model, and era with
three-signal photo evidence each is a GOLD identification
candidate. Disagreement on category is an escalation trigger.
Disagreement on maker with convergence on category widens the
attribution language ("attributed to" rather than "by").

Treat disagreement as data. A 4-AI team that averages its way to a
label is worse than a single AI that commits. The team's job is to
surface the edges, not smooth them over.
