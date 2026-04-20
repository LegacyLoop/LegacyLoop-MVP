---
name: analyzebot-megabot-premium-output-standards
description: >
  Defines the premium MegaBot AnalyzeBot output package. Specifies
  required fields across the MEGA_ANALYZE schema — product_history,
  maker_history, construction_analysis, special_features,
  tips_and_facts, common_issues, care_instructions, similar_items,
  collector_info, and alternative_identifications. Each field has
  content standards, minimum depth expectations, and the language
  discipline that separates specialist from generic AI output.
  Includes a full Dean guitar worked output (every field populated)
  and a before/after contrast showing amateur vs. specialist
  identification language.
when_to_use: "MegaBot scans only. AnalyzeBot MegaBot lane."
version: 1.0.0
---

# AnalyzeBot MegaBot Skill: Premium Output Standards

## Purpose

A MegaBot AnalyzeBot output is a specialist identification report.
It is not a category guess. It is the document a seller reads
before deciding how to photograph for listing, whether to get an
appraisal, whether to consign to auction, or whether to hold the
item. The difference between a generic AI identification response
and a specialist report is what this skill defines — specific
fields, specific content standards, specific presentation rules —
so every output from the 4-AI team meets a uniform premium bar.

AnalyzeBot is the foundation bot. Every downstream bot
(PriceBot, ListBot, AntiqueBot, CollectiblesBot, CarBot, BuyerBot,
ReconBot, PhotoBot) reads AnalyzeBot's output and acts on it.
Premium AnalyzeBot output produces premium downstream output. A
thin or generic AnalyzeBot output starves every bot that follows.

---

## The Full MegaBot AnalyzeBot Output Package

Every MegaBot AnalyzeBot output populates the full MEGA_ANALYZE
schema defined at lib/megabot/prompts.ts:57-76. Partial outputs
are incomplete and must not be returned as final. The required
fields and their content standards:

### 1. product_history (string)

Contains: The history and background of this product type. When
it was first made. Why it was developed. What cultural, technical,
or market conditions produced the category. Key milestones in the
category's evolution.

Content requirements:

- Minimum 3 sentences, typical 4-6 sentences
- Open with the origin of the product category (who created the
  form, in what year or decade, for what purpose)
- Include at least one specific historical anchor (named maker,
  named event, documented date)
- Close with the category's present-day status (still in
  production, discontinued, collector-only, commodity)

Example for Dean MLX:

"The ML silhouette was created by Dean Guitars founder Dean
Zelinsky in 1977, inspired by the Gibson Explorer and Flying V
but with a signature offset cutaway that became the brand's most
recognizable shape. The MLX variant arrived in 2008 as a Dimebag
Darrell tribute reissue, marking Dean's official partnership with
the Pantera guitarist's estate after his 2004 death. Production
moved through Korean and Chinese plants under the post-1997
Elliott Rubinson ownership, with the 2008 reissue run
specifically catering to Dimebag fans and metal players seeking
the signature tone and look. The MLX remains in Dean's current
lineup as a flagship model in the ML family."

Generic AI output would be: "Dean Guitars makes electric guitars."
This is not acceptable.

### 2. maker_history (string)

Contains: The manufacturer or brand's history. When the brand was
founded. Who founded it. What the brand is known for. Notable
achievements, ownership transitions, production moves, signature
endorsements. The specific relationship between the maker and the
item's era.

Content requirements:

- Minimum 3 sentences, typical 4-7 sentences
- Include founding year and founder name where known
- Include at least one production-era transition relevant to the
  item (e.g., "production moved from Japan to Korea in 1985")
- Include at least one notable endorsement or market position
  indicator
- Tie the maker's history directly to the item's era

Example for Dean Guitars:

"Dean Guitars was founded in Evanston, Illinois, in 1976 by Dean
Zelinsky, a 17-year-old guitar player who combined Gibson's neck
quality with his own offset body designs. The brand gained rapid
traction through Dimebag Darrell's endorsement in the late 1980s
and early 1990s, becoming the signature brand of Pantera-era
metal. Dean filed for bankruptcy in 1995 and was acquired by
Elliott Rubinson in 1997, who revived production through Korean
and Chinese factories while maintaining U.S. Custom Shop
operations in Tampa, Florida. The 2008 MLX reissue arrived during
the Rubinson era and used Korean production, producing a player-
grade instrument at a price point that made the Dimebag
connection accessible to a broader fan base than the U.S. Custom
Shop pieces."

### 3. construction_analysis (string)

Contains: How the item was built. Materials in detail (specific
wood species, metal alloys, textile fibers, ceramic body types).
Construction techniques used (joinery, fastening, finishing,
assembly method). What the build quality reveals about the
maker's production standards and the item's era.

Content requirements:

- Minimum 4 sentences, typical 5-8 sentences
- Name specific materials (not "wood" but "mahogany" with body
  part attribution)
- Describe at least two construction techniques visible in photos
- Note the implication of the construction for era or quality
- Distinguish original construction from any later modifications

Example for Dean MLX:

"The body is solid mahogany with a set-neck joint — not the
bolt-on common on lower-price electrics, indicating the reissue
was specified to the mid-tier of Dean's production hierarchy. The
neck is maple with a rosewood fretboard, 22 medium-jumbo frets,
and Grover-style sealed tuners consistent with 2008 Dean Korea
production. The body carries a Tune-o-Matic bridge with
stop-bar tailpiece, and humbucker pickups in the standard Dean
MLX configuration. Hardware shows minor oxidation consistent with
16+ years of environmental exposure but no component has been
swapped — the pickup bezels, bridge, and tuners match the 2008
catalog spec. The transparent red finish is original with honest
wear at the forearm contact and pickguard mounting area."

### 4. special_features (string)

Contains: What makes THIS specific item unique or special.
Standout features, design elements, production variants, things
that distinguish this example from similar items in the market.
Every item has at least one special feature — the premium output
identifies it.

Content requirements:

- Minimum 2 sentences, typical 3-5 sentences
- Name at least one feature that distinguishes this example from
  the category baseline
- If the item is a production standard with no variant features,
  note the standard-production status explicitly
- Cite visible photo evidence for each feature claim

Example for Dean MLX:

"This example is the Transparent Red finish — one of three
standard finishes in the 2008 reissue run (alongside Black Satin
and Transparent Blue). The finish shows the mahogany grain
through the transparent stain, which is the feature that
distinguishes the transparent finishes from the solid-color runs.
The ML body silhouette with the offset cutaway is the
fingerprint of Dean's design language, immediately recognizable
among metal-genre electrics. The hardware is Dean's standard
2008-era spec with no upgraded or boutique components — this is
a stock player-grade reissue, not a Custom Shop or Dime Slime
variant."

### 5. tips_and_facts (string)

Contains: Tips, tricks, and facts that most people do not know
about the item type. Hidden features, use tips, interesting
trivia, collector knowledge. Written for a seller who wants to
become an informed representative of their own item.

Content requirements:

- Minimum 3 discrete tips or facts, typical 4-6
- Each item must be specific to the item or its category, not
  generic advice
- Include at least one fact that would impress a buyer who is
  a specialist in the category
- Include at least one practical tip the seller can use in the
  listing or in buyer communication

Example for Dean MLX:

"Tip: check the pot date codes inside the control cavity — 2008-
produced pots should have date codes in the 0807 to 0812 range
(year 08, production week 07-12). Fact: the MLX 2008 reissue was
the first Dean production to use the current V-logo headstock
font; earlier Dean production used a different script logo, and
collectors distinguish pre-1997 Elite-era Deans as a separate
market. Tip: original Dean-branded hardcase adds $40 to $60 in
market value — check the basement or attic before listing without
a case. Fact: Dimebag Darrell owned a personal MLX prototype
before his death in 2004; the 2008 reissue was licensed through
his estate with the family's direct involvement. Tip: when
photographing for listing, the headstock logo photographed
straight-on from 12 inches with raking light produces the
identification-confidence shot that converts buyer questions into
buyer commitments."

### 6. common_issues (string)

Contains: Known problems with this item type. Things to watch for
over time. Common failure modes, wear patterns, maintenance
needs. Written to help the seller accurately represent condition
and to help the buyer know what to inspect.

Content requirements:

- Minimum 2 issues, typical 3-5
- Each issue must be specific to the item type, not generic wear
- Include at least one issue that requires hands-on inspection to
  verify (so the seller can request the buyer inspect)
- Distinguish age-related issues from use-related issues

Example for Dean MLX:

"The set-neck joint on Dean Korean production is reliable but
should be inspected for any micro-gap between neck tenon and body
mortise — a gap indicates a joint that has failed or been
repaired. The DMT pickups in the 2008 reissue are sometimes
swapped by players for Bill Lawrence or Seymour Duncan upgrades;
photographs of the pickup bezels and pole-piece spacing confirm
whether the pickups are original. The Tune-o-Matic bridge
saddles can develop play over 15+ years of string changes —
check that saddle intonation screws turn without grinding. The
transparent finish can show clearcoat checking in arid climates
after a decade — look for fine surface cracking under raking
light."

### 7. care_instructions (string)

Contains: How to care for, maintain, store, and preserve the item.
What helps it last. What damages it. Material-specific and era-
specific guidance.

Content requirements:

- Minimum 3 care points, typical 4-6
- Include at least one storage instruction
- Include at least one cleaning or maintenance instruction
- Include at least one preservation caution (what to avoid)
- Material-specific — a wood care instruction for a wood item

Example for Dean MLX:

"Store with the strings loosened one or two full turns when not
played for more than a few weeks — this reduces the long-term
stress on the neck. Keep the instrument in a case in a climate-
controlled room; electric guitars tolerate 40 to 55 percent
relative humidity without issue, but below 30 percent can cause
fretboard shrinkage. Wipe the strings and fretboard with a dry
cloth after each playing session — hand oils accelerate fret
wear and string corrosion. Avoid storing near direct sunlight —
transparent finishes can fade over decades of sun exposure.
Lemon oil on rosewood fretboards once every 6 to 12 months
prevents drying; do not apply oil to the body finish. If
listing for sale, remove the strings for shipping and pack
the headstock so it cannot pivot against the case interior."

### 8. similar_items (string)

Contains: How this item compares to similar items, alternative
models, competing products. What is better or worse about this
versus alternatives. Helps the seller position the item in the
market and helps the buyer understand why they should prefer
this example.

Content requirements:

- Minimum 3 comparable items, typical 3-5
- Include at least one same-maker alternative (different model)
- Include at least one different-maker alternative (competitor)
- For each comparable, note the specific distinguishing feature
- Conclude with the target item's position among the comparables

Example for Dean MLX:

"Dean ML Original: the flagship ML in U.S. Custom Shop production
at roughly 3x the price. Better wood selection, premium
electronics, and Custom Shop assembly — but the MLX reissue uses
the same silhouette and delivers 80 percent of the sound at a
player-grade price. Gibson Explorer: the ancestor design Dean
Zelinsky referenced, with a different cutaway geometry and
Gibson's set-neck tradition. Explorers sell at 2-3x MLX prices
due to Gibson brand premium. BC Rich Bich: a metal-genre peer
with a more aggressive silhouette and similar player-grade
positioning. BC Rich has less Dimebag tribute connection and
trades at similar price to MLX. Jackson Dinky or Soloist: also
metal-genre but with Fender-family neck construction rather than
Dean's set-neck. Different playing feel, similar price range. The
MLX specifically targets the Dimebag fan and metal player who
wants the Dean signature look at a price below Custom Shop."

### 9. collector_info (string)

Contains: Collector interest level. Rarity assessment. Community
or enthusiast following. Desirability drivers. Whether this item
type is actively collected and why.

Content requirements:

- Minimum 3 sentences, typical 4-6 sentences
- Name the collector community or subculture (if any)
- Assess rarity in category-specific terms (not just "rare" or
  "common" but production-run context)
- Note the price driver within the collector community (case
  presence, originality, finish variant, era)
- State the item's position on the collector-vs-player axis

Example for Dean MLX:

"The 2008 Dean MLX has an active collector following within the
Dimebag Darrell fan community and broader Dean Guitars
enthusiast community. Collectors prioritize all-original
configurations with matching serial ranges, hang tags, and
original cases — modifications or swapped pickups can reduce
value by 20 to 30 percent. The 2008 reissue run was a limited
production window (estimated 2,000-4,000 units across all three
finish variants) which places it in the specialist-sustained-
demand zone rather than the auction-grade zone. The player-grade
market for MLX is driven by working metal guitarists wanting the
Dean tone and look; the collector-grade market is driven by
Pantera fans assembling gear-lifetime collections. This example
is player-grade, which places it in the larger of the two
markets."

### 10. alternative_identifications (array of objects)

Contains: Top 2 or 3 possible alternative identifications, each
with name, confidence (0.0 to 1.0), and reasoning. This field
converts disagreement or uncertainty into transparent seller-
facing data.

Content requirements:

- Minimum 1 alternative when confidence is SILVER or below
- Minimum 2 alternatives when confidence is BRONZE
- Each alternative must include:
  - `name` — the alternative category/maker/model
  - `confidence` — the confidence this alternative would have if
    it were the correct identification (0.0 to 1.0)
  - `reasoning` — one to two sentences on what photo signals or
    contextual clues support this alternative
- If confidence is GOLD and no alternatives are plausible,
  populate with a single-element array noting "No alternative
  identifications consistent with visible evidence."

Example for Dean MLX (GOLD confidence case):

```
"alternative_identifications": [
  {
    "name": "Dean ML Original (U.S. Custom Shop)",
    "confidence": 0.12,
    "reasoning": "The body silhouette is identical to the
     Custom Shop ML Original, but the set-neck joint
     execution, hardware spec, and finish application all
     match Korean 2008 reissue production rather than
     Custom Shop Tampa, FL production. Distinguishable at
     the pot-date-code level."
  },
  {
    "name": "Dean MLX B (Black Satin variant)",
    "confidence": 0.05,
    "reasoning": "Same reissue run but different finish. The
     photo clearly shows the Transparent Red finish with
     mahogany grain visible through the stain, ruling out
     the Black Satin variant."
  }
]
```

This field is the transparent record of what the 4-AI team
considered and rejected. A seller who sees their identification
alongside the alternatives considered understands why the
confidence is what it is.

---

## Full Dean Guitar Worked Output

Canonical test case. 2008 Dean MLX electric guitar, player-grade
condition (6/10), central Maine seller, LOCAL_PICKUP scope. Four
photos: front, back, headstock close-up, neck-plate close-up.

```json
{
  "item_name": "2008 Dean MLX Electric Guitar (Transparent Red)",
  "category": "Musical Instruments",
  "subcategory": "Electric Guitars",
  "brand": "Dean",
  "model": "MLX",
  "maker": "Dean Guitars",
  "material": "Solid mahogany body, maple neck with rosewood
   fretboard",
  "era": "2008 reissue (Korean production)",
  "style": "Metal / Hard Rock",
  "country_of_origin": "South Korea",
  "markings": "Dean V-logo on headstock face; partial serial on
   neck-plate back (middle digits obscured by finish scratch)",
  "dimensions_estimate": "Overall length approximately 40 inches;
   body depth approximately 1.75 inches",
  "completeness": "Complete guitar with original hardware; case
   presence not visible in photos",
  "condition_guess": "Very Good",
  "condition_score": 7,
  "condition_cosmetic": 6,
  "condition_functional": 8,
  "condition_details": "Honest player-grade wear. Minor finish
   scratches at forearm contact and at neck-plate area. No
   visible structural damage. All original hardware, oxidation
   minimal.",
  "visible_issues": [
    "Light finish scratches at forearm contact point",
    "Minor oxidation on bridge saddles",
    "Pickup bezels show faint age yellowing"
  ],
  "positive_notes": [
    "All original hardware present",
    "Transparent finish preserved with no major cracking",
    "Dean headstock logo fully legible"
  ],
  "restoration_potential": "No restoration needed for play-grade
   use. A light cleaning and string change returns this to
   gigging condition.",
  "keywords": [
    "Dean", "MLX", "Electric Guitar", "Metal", "Dimebag", "2008",
    "Reissue", "Transparent Red", "Mahogany", "Player Grade",
    "Korean", "Set Neck", "Humbucker", "Tune-o-Matic"
  ],
  "confidence": 0.96,
  "is_antique": false,
  "estimated_age_years": 18,
  "antique_markers": [],
  "appraisal_recommended": false,
  "is_collectible": true,
  "collectible_category": "Modern musical instrument with
   collector sub-community (Dimebag tribute)",
  "photo_quality_score": 8,
  "photo_improvement_tips": [
    "A close-up photo of the neck-plate serial with raking light
     would allow direct year decode.",
    "A photo of the control cavity interior would confirm
     original pot date codes and electronics.",
    "A case photo (if case is present) would add $40-60 to
     listing value."
  ],
  "summary": "This is a 2008 Dean MLX electric guitar in
   player-grade condition, likely from the Korean reissue run
   licensed through the Dimebag Darrell estate. All original
   hardware present, honest use wear, no modifications. Target
   market: metal players and Pantera fans. Ready to list after
   a light cleaning.",
  "product_history": "The ML silhouette was created by Dean
   Guitars founder Dean Zelinsky in 1977, inspired by the
   Gibson Explorer and Flying V but with a signature offset
   cutaway that became the brand's most recognizable shape. The
   MLX variant arrived in 2008 as a Dimebag Darrell tribute
   reissue, marking Dean's official partnership with the Pantera
   guitarist's estate after his 2004 death. Production moved
   through Korean and Chinese plants under post-1997 Elliott
   Rubinson ownership, with the 2008 reissue specifically
   catering to Dimebag fans and metal players seeking the
   signature tone and look. The MLX remains in Dean's current
   lineup as a flagship model in the ML family.",
  "maker_history": "Dean Guitars was founded in Evanston,
   Illinois, in 1976 by Dean Zelinsky, who combined Gibson neck
   quality with his own offset body designs. The brand gained
   rapid traction through Dimebag Darrell's endorsement in the
   late 1980s and early 1990s, becoming the signature brand of
   Pantera-era metal. Dean filed for bankruptcy in 1995 and was
   acquired by Elliott Rubinson in 1997, who revived production
   through Korean and Chinese factories while maintaining U.S.
   Custom Shop operations in Tampa, Florida. The 2008 MLX
   reissue used Korean production, producing a player-grade
   instrument at a price point that made the Dimebag connection
   accessible to a broader fan base than Custom Shop pieces.",
  "construction_analysis": "The body is solid mahogany with a
   set-neck joint — not the bolt-on common on lower-price
   electrics — indicating the reissue was specified to the
   mid-tier of Dean's production hierarchy. The neck is maple
   with a rosewood fretboard, 22 medium-jumbo frets, and
   Grover-style sealed tuners consistent with 2008 Dean Korea
   production. The body carries a Tune-o-Matic bridge with
   stop-bar tailpiece and humbucker pickups in the standard
   MLX configuration. Hardware shows minor oxidation consistent
   with 16+ years of environmental exposure but no component
   has been swapped — pickup bezels, bridge, and tuners all
   match the 2008 catalog spec. The transparent red finish is
   original with honest wear at the forearm contact and
   pickguard mounting area.",
  "special_features": "This example is the Transparent Red
   finish — one of three standard finishes in the 2008 reissue
   run (alongside Black Satin and Transparent Blue). The finish
   shows mahogany grain through the transparent stain, which
   distinguishes the transparent finishes from the solid-color
   runs. The ML body silhouette with offset cutaway is the
   fingerprint of Dean's design language. Hardware is Dean's
   standard 2008-era spec with no upgraded or boutique
   components — stock player-grade reissue, not Custom Shop or
   Dime Slime variant.",
  "tips_and_facts": "Tip: check pot date codes inside the
   control cavity — 2008 production should have codes in the
   0807-0812 range. Fact: the MLX 2008 was the first Dean
   production to use the current V-logo headstock font;
   earlier Dean production used a different script logo, and
   collectors distinguish pre-1997 Elite-era Deans as a
   separate market. Tip: original Dean hardcase adds $40 to
   $60 in market value — check storage before listing without
   a case. Fact: Dimebag Darrell owned a personal MLX prototype
   before his 2004 death; the 2008 reissue was licensed through
   his estate with family involvement. Tip: photograph the
   headstock logo straight-on from 12 inches with raking light
   to produce the identification-confidence shot that converts
   buyer questions into commitments.",
  "common_issues": "The set-neck joint on Dean Korean production
   is reliable but should be inspected for any micro-gap between
   neck tenon and body mortise — a gap indicates joint failure
   or repair. DMT pickups in the 2008 reissue are sometimes
   swapped by players for aftermarket upgrades; photographs of
   pickup bezels and pole-piece spacing confirm whether pickups
   are original. Tune-o-Matic saddles can develop play over 15+
   years — check saddle intonation screws turn without
   grinding. Transparent finish can show clearcoat checking in
   arid climates after a decade — look for fine surface cracking
   under raking light.",
  "care_instructions": "Store with strings loosened one or two
   full turns when not played for more than a few weeks.
   Maintain 40-55 percent relative humidity; below 30 percent
   can cause fretboard shrinkage. Wipe strings and fretboard
   with a dry cloth after each playing session. Avoid direct
   sunlight — transparent finishes fade over decades. Lemon
   oil on rosewood fretboards once every 6 to 12 months. For
   shipping, remove strings and pack the headstock so it
   cannot pivot against the case interior.",
  "similar_items": "Dean ML Original: Custom Shop version at 3x
   the price, better wood and electronics but the MLX delivers
   80 percent of the sound at player grade. Gibson Explorer:
   the ancestor design at 2-3x MLX prices due to Gibson brand
   premium. BC Rich Bich: metal-genre peer with more aggressive
   silhouette, similar player-grade positioning and price.
   Jackson Dinky or Soloist: metal-genre with Fender-family
   bolt-on neck rather than Dean's set-neck, different feel at
   similar price. The MLX specifically targets the Dimebag fan
   who wants the Dean signature look at a price below Custom
   Shop.",
  "collector_info": "The 2008 MLX has an active collector
   following within the Dimebag Darrell fan community and
   broader Dean Guitars enthusiast community. Collectors
   prioritize all-original configurations with matching serial
   ranges, hang tags, and original cases — modifications or
   swapped pickups reduce value 20 to 30 percent. The 2008
   reissue was a limited production window (estimated 2,000 to
   4,000 units across three finish variants) placing it in the
   specialist-sustained-demand zone rather than auction-grade
   zone. This example is player-grade, placing it in the larger
   of the two markets (metal players) rather than the smaller
   (Pantera fan-collector).",
  "alternative_identifications": [
    {
      "name": "Dean ML Original (U.S. Custom Shop)",
      "confidence": 0.12,
      "reasoning": "Body silhouette is identical to Custom Shop
       ML Original, but set-neck joint execution, hardware
       spec, and finish application all match Korean 2008
       reissue rather than Tampa Custom Shop. Distinguishable
       at the pot-date-code level."
    },
    {
      "name": "Dean MLX B (Black Satin variant)",
      "confidence": 0.05,
      "reasoning": "Same reissue run but different finish. The
       photo shows transparent red with mahogany grain visible
       through the stain, ruling out the Black Satin variant."
    }
  ]
}
```

---

## Before and After: Amateur vs. Specialist Language

The difference in perceived seller competence between amateur and
specialist identification language is the difference between a
buyer who asks "how much for it" and a buyer who asks "is the
case original."

### Amateur

"This is an old Dean electric guitar. I think it's a metal
guitar. Red finish, pretty worn. My cousin left it to me. Not
sure what year."

What a buyer reads: the seller does not know the model, era, or
value. The buyer will research, determine the model themselves,
and anchor their offer at the low end of what they find.

### Specialist (MegaBot AnalyzeBot premium output)

"This is a 2008 Dean MLX electric guitar in Transparent Red
finish, from the Korean reissue run licensed through the
Dimebag Darrell estate. Solid mahogany body, set-neck
construction, all original DMT pickups and Tune-o-Matic
hardware. Player-grade condition with honest wear — no
modifications or component swaps. Target market is metal
players and Pantera fans; collector premium applies if an
original hardcase is present."

What a buyer reads: the seller knows the model, era, production
run, originality, and market. The buyer commits quickly and
negotiates narrowly. Transaction velocity and price both improve.

The methodology that produces the specialist output is what this
entire skill pack canonizes. Every MegaBot AnalyzeBot run is
held to this standard.

---

## What the Premium Output Is For

This output is the document a seller references when:

- Writing or approving a listing (feeds ListBot with full context)
- Receiving and responding to buyer questions (buyer-prepared
  seller)
- Deciding whether to obtain an appraisal (when
  appraisal_recommended is true)
- Evaluating a dealer cash offer (when dealer quotes low, the
  specialist output is the rebuttal document)
- Deciding whether to consign to auction (when auction-grade
  signals are flagged per M03)
- Reporting for insurance or estate purposes (the full
  identification with construction and material detail is
  appraisal-grade supporting documentation)

Each of those decisions needs different fields from the output.
That is why the schema is complete, not minimal. Partial outputs
force the seller to make decisions with incomplete information.
Premium outputs let them act with confidence.

Every downstream bot also consumes this output. PriceBot prices
from product_history + collector_info + construction_analysis.
ListBot writes titles from brand + model + era + special_features.
BuyerBot targets buyers using collector_info + similar_items.
AntiqueBot deep-dives from construction_analysis. Premium
AnalyzeBot output compounds into premium bot output across the
entire platform.
