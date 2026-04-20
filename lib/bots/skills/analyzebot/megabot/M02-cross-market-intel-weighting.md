---
name: analyzebot-megabot-cross-market-intel-weighting
description: >
  External-evidence weighting methodology for MegaBot identification.
  Defines the identification source hierarchy (museum catalog, auction
  house catalog, dealer archive, maker documentation, specialist
  marketplace, generic marketplace, social), the INVERSE recency curve
  for identification (older authoritative references often outrank
  recent ones), how each of the four AI agents contributes grounding
  signal, reverse-image-search discipline, Amazon/Rainforest enrichment
  integration via isMegaBot, and the Dean MLX worked weighting example.
  Note: this pack inverts the PriceBot recency curve — pricing wants
  fresh transactions, identification wants authoritative references.
when_to_use: "MegaBot scans only. AnalyzeBot MegaBot lane."
version: 1.0.0
---

# AnalyzeBot MegaBot Skill: Cross-Market Intelligence Weighting

## Purpose

Identification data from different sources has different evidentiary
value. A Smithsonian catalog entry that names a maker is not the
same kind of evidence as a Reddit comment that names the same maker.
Treating them as equivalent produces identifications that fall
apart under specialist scrutiny. This skill defines how the 4-AI
team weights external signals when identifying an item and how
that weighting differs from PriceBot's pricing-signal weighting.

Identification wants authority. Pricing wants recency. These goals
pull in opposite directions. This pack makes the difference
explicit.

---

## The Source Hierarchy for Identification

Sources are ranked by specialist authority and archival rigor.
Higher-tier sources get higher weight in the identification
synthesis.

### Tier 1 — Museum catalog entries (weight 1.00)

A Smithsonian, Victoria and Albert, Metropolitan Museum, or
Winterthur catalog entry is the gold standard for identification.
These institutions publish identified items with provenance,
materials analysis, and scholarly attribution. When a museum
catalog names a maker and workshop, the identification is as
close to settled as identification gets.

Use museum catalogs as the authoritative anchor for antique and
decorative-arts identifications. When four AI agents converge on a
maker identification that maps to a museum catalog entry with
visual similarity, the identification is GOLD-tier.

### Tier 2 — Credentialed auction house catalogs (weight 0.95)

Christie's, Sotheby's, Heritage, Bonhams, Skinner, Doyle, Rago,
Freeman's — these catalogs publish scholarly identification and
provenance notes for items they sell. The catalog description is
reviewed by specialists before publication.

Auction house catalog identifications are the second-strongest
evidence class. They are particularly valuable for categories
where the auction house specializes (Heritage for comics and
trading cards, Rago for Americana, Doyle for jewelry).

### Tier 3 — Dealer archives and specialist publications (weight 0.85)

Established dealer websites (1stDibs for decorative arts, Reverb
for instruments in archival-reference mode, Watchrecon for
watches) and specialist reference publications (Kovels, Miller's,
specific maker reference books) are Tier 3 authority.

These sources are curated by specialists but are not subject to
the scholarly peer review of museum and auction catalogs. Treat
as strong corroborating evidence.

### Tier 4 — Maker archives and brand documentation (weight 0.92)

When a maker has published its own production records, catalog
scans, or dating resources (Gibson's serial number lookup,
Wedgwood's pattern archive, Rolex's reference database), this
first-party documentation is authoritative for its specific
claims.

Brand documentation ranks just below auction catalogs because the
maker has authority over its own production records but may
selectively document only its preferred eras. Cross-check against
Tier 2 when possible.

### Tier 5 — Specialist marketplace listings (weight 0.70)

Reverb listings with detailed descriptions, 1stDibs listings with
maker attribution, specialist dealer sites with identification
notes — these are listing-quality sources. The identification is
made by a seller with a financial interest, not a third-party
specialist.

Use for corroboration, not as primary evidence. Specialist-
marketplace identifications cluster around correct identifications
for common items but drift wider for rare or atypical pieces.

### Tier 6 — Generic marketplace listings (weight 0.45)

eBay listings, Facebook Marketplace listings, Craigslist listings
— these are seller-generated identifications with no specialist
review. Use only to confirm market activity in a category, not to
anchor an identification claim.

### Tier 7 — Social media and forum posts (weight 0.25)

Reddit threads, Instagram posts, Facebook groups, specialist
forum posts — these signal community awareness but are not
evidence. Forums with known expert participation (specialist
group moderated by a named dealer) rank slightly higher within
this tier but remain corroborating signal only.

### Tier 8 — User-generated content without expert review (weight 0.10)

Pinterest boards, TikTok demonstrations, general-interest YouTube
videos — these indicate category existence but do not identify
specific items.

---

## The INVERSE Recency Curve for Identification

This is where identification methodology inverts pricing
methodology. Pricing wants fresh transactions. Identification
wants authoritative references.

### Why the curve inverts

A 1982 reference book on American Pewter names makers and assigns
attributions based on scholarly work that took decades to compile.
A 2023 blog post summarizing that book is less authoritative than
the 1982 original. Older scholarly references often hold primary
authority that newer derivative work does not supersede.

For identification purposes, recency is frequently a dampener:

- A 1960s Parke-Bernet auction catalog that identified a maker is
  often cited by every subsequent specialist who confirmed the
  attribution. The 1960s catalog is the primary source.
- A 2024 online dealer listing that cites the 1960s catalog is
  derivative. It does not add identification evidence; it
  transmits it.

### The identification recency schedule

- **Contemporary with production** (e.g., 1895 catalog for an
  1895 piece): weight 1.10 — primary-era documentation is the
  strongest form of evidence.
- **Scholarly references within 50 years of production**: weight
  1.00 — close enough in time that the author may have had access
  to primary sources, living witnesses, or maker records.
- **Modern scholarly references** (museum catalogs, peer-
  reviewed specialist books): weight 0.95 — strong but may
  depend on earlier primary sources.
- **Recent dealer or auction descriptions**: weight 0.80 — may
  be correct but are derivative.
- **Recent blog posts and social media**: weight 0.50 — signal
  only, not evidence.

### Exception: recent scholarship that updates older attributions

When modern scholarly work has explicitly corrected an older
attribution (re-attribution based on new evidence), the modern
work supersedes. The 4-AI team should note the correction and
cite both: "Previously attributed to Shop X in early twentieth-
century catalogs; reattributed to Workshop Y based on dendro-
chronology published in [recent reference]."

### Comparison to PriceBot weighting

This pack and PriceBot M02 use different recency curves because
the questions are different. PriceBot asks "what does this sell
for today" — recency is primary. AnalyzeBot asks "what is this" —
authority is primary. Do not cross-apply the pricing recency
curve to identification tasks.

---

## How Each AI Agent Contributes to Identification

The 4-AI team is not four copies of the same model. Each agent
brings a distinct intelligence layer.

### OpenAI (GPT-4o family) — structural completeness

OpenAI is the workhorse for schema completeness. Every field in
the MEGA_ANALYZE output must be populated, and OpenAI is the most
reliable at producing complete structured output with all 35+
identification fields filled. When the 4-AI consensus is assembled,
OpenAI's output is the structural baseline that other agents'
insights are woven into.

### Claude (Anthropic Haiku/Sonnet) — specialist narrative

Claude is the strongest at expert narrative: product_history,
maker_history, construction_analysis, tips_and_facts. When the
output calls for paragraph-length expert commentary, Claude's
contribution is typically the one that reads like a specialist
catalog rather than an encyclopedia summary.

### Gemini — web grounding and current maker reference

Gemini's google_search grounding lets it access current maker
catalogs, production-record databases, and reference-site content
that may not be in training data. For modern makers (post-2000
producers with active websites), Gemini is the primary source for
current model-line information.

### Grok — cultural and subcultural context

Grok's platform-native signal reads community and enthusiast
discussion. For items whose identification or value is culturally
mediated (fan communities, enthusiast groups, subculture relics),
Grok surfaces the context that explains why an item matters to
its specific audience.

### When agents disagree

If Claude identifies an item as a 1920s Japanese porcelain
export piece and Gemini identifies it as a 2010s reproduction,
the disagreement is data. The 4-AI team presents both
hypotheses with the evidence each relies on, rather than
averaging into a meaningless middle. See M03 for the
disagreement escalation rules.

---

## Reverse-Image-Search Discipline

When four AI agents agree on a category and era but none can
identify the maker from the photos alone, reverse-image-search
signals may surface a match. The 4-AI team handles these signals
carefully.

### What reverse-image-search can establish

- A visual match to a catalogued item in a museum, auction
  archive, or dealer listing — strong corroborating evidence.
- A visual match to a listing with a maker attribution — the
  attribution is only as good as the source; apply tier weighting.
- A visual match to a reproduction for sale — evidence that the
  target item may be a reproduction.

### What reverse-image-search cannot establish

- A match to a photograph does not identify the pictured item —
  the pictured item's identification may itself be wrong.
- A unique item with no similar photographs online does not mean
  the item is rare; it may just mean the item has not been
  photographed or listed.
- A match to an AI-generated image is not evidence of anything —
  check the provenance of any image before treating it as a
  reference.

### How to cite a reverse-image-search match

"Photographs of a closely similar item appear in the Heritage
Auctions archive from 2019, where the item was catalogued as
[maker]. Based on the visual match and Heritage's attribution,
this identification is supported by a Tier 2 reference."

Never cite a match without naming the source tier.

---

## Amazon / Rainforest Enrichment Integration

MegaBot-tier access unlocks additional identification sources that
base AnalyzeBot does not see. The `isMegaBot=true` flag enables:

### Amazon via Rainforest API

- **Modern item identification**: when an item is in current
  production or recently discontinued, Amazon listings provide
  authoritative manufacturer catalog references.
- **Material and dimension disclosure**: Amazon product pages
  include specifications that are often invisible in user-
  submitted photographs.
- **Brand variant disambiguation**: Amazon's product hierarchy
  distinguishes between similar-looking brand variants that
  photographs alone may not.

Use Amazon as a Tier 4 brand-documentation source for modern
production. Do not use for antiques or pre-internet items —
Amazon's catalog is current-production-focused and rarely extends
backward to true antique categories.

### Paid reference databases

When available in the MegaBot tier, specialist reference databases
(Kovels, specific maker archives, auction aggregators) feed into
the identification pool at their documented tier weight. Cite the
source when the identification relies on paid-database evidence.

---

## Dean MLX Worked Identification Weighting

Canonical test case. Dean MLX electric guitar, photographed from
multiple angles by a seller in central Maine with limited product
knowledge. The 4-AI team identifies as follows.

### Step 1: Gather external signals

- Dean Guitars official website: model-line archive confirms the
  MLX silhouette and the 2008 reissue run's specifications.
  Tier 4 maker documentation, weight 0.92.
- Reverb listings for "Dean MLX 2008": multiple listings with
  consistent identification and specification language. Tier 5
  specialist marketplace, weight 0.70.
- Dimebag Darrell tribute articles in Guitar World archives (2008
  coverage of the MLX reissue launch): Tier 3 specialist
  publication, weight 0.85.
- Reddit r/Guitar threads discussing MLX authenticity and
  production changes: Tier 7 social, weight 0.25.
- eBay sold listings: Tier 6 generic marketplace, weight 0.45.

### Step 2: Per-agent contribution

- OpenAI: populates all 35+ identification fields from photo
  evidence plus maker-archive spec data.
- Claude: writes the product_history (Dean's ML/MLX lineage from
  1977 Dimebag association to 2008 reissue) and construction_
  analysis (set-neck mahogany body, bolt-on pattern, hardware
  era-match).
- Gemini: grounds against Dean Guitars' current website and
  returns the 2008 reissue spec sheet for direct comparison.
- Grok: surfaces the Dimebag tribute community context — the
  MLX is collected as tribute, not as generic player-grade
  electric.

### Step 3: Identification synthesis

- Category: electric guitar. Four-AI agreement. Weight 1.00.
- Maker: Dean Guitars. Headstock logo direct match + Tier 4
  maker-archive confirmation. Weight 1.00.
- Model: MLX. Body silhouette direct match + Tier 4 maker-
  archive spec confirmation. Weight 0.95.
- Era: 2008 reissue run. Serial prefix + Tier 3 Guitar World
  launch coverage + Tier 5 Reverb listing date convergence.
  Weight 0.90.

### Step 4: Identification confidence

Three-signal convergence on every dimension, no Tier 1 museum
evidence (not applicable to modern production). Composite
identification confidence: 92, GOLD tier. (See M04 for the
confidence math.)

### Step 5: Output identification

"2008 Dean MLX electric guitar, Korean-production reissue run,
Transparent Red finish. Solid mahogany body, set-neck
construction, DMT pickups, Tune-o-Matic bridge. Headstock logo
and body silhouette confirm make and model; serial prefix and
Guitar World's 2008 launch coverage place this in the 2008
reissue production year. Player-grade condition." Evidence
footnote cites Dean Guitars archive, Guitar World 2008 article,
and three consistent Reverb listings.

The seller reads this and sees an identification they can trust,
grounded in sources they can verify.

---

## Handling Source Disagreement in Identification

When sources disagree on identification, the 4-AI team does not
average. It reasons about the disagreement.

### The common disagreement pattern

A vintage piece with a maker mark that points to one workshop
but construction that points to another. Scholarly reference
books may disagree. Auction catalogs may have been corrected.
The 4-AI team names the disagreement and presents both
attributions with the evidence each rests on.

### The correct output format

"This piece carries a [Maker A] mark, which typically places it
in [Maker A]'s workshop circa [era]. However, the drawer
construction uses [specific technique] that is documented in
[Maker B]'s workshop but not in [Maker A]'s. Two possibilities:
either [Maker A] used a journeyman who trained at [Maker B]'s
workshop, or this mark is a later stamping. Specialist
verification is recommended before a high-value transaction."

Never hide source disagreement behind a confident-sounding
identification. The seller needs to see the range of expert
opinion and the evidence that supports each possibility.
