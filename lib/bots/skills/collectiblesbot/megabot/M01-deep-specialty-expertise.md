---
name: collectiblesbot-megabot-deep-specialty-expertise
description: Multi-grading-service consensus protocol for 4-AI parallel collectibles analysis. Covers PSA, BGS, CGC, SGC, and PCGS standards, how each service evaluates items differently, and how four independent AI agents reconcile those differences into a single high-confidence output.
when_to_use: "MegaBot scans only. CollectiblesBot MegaBot lane."
version: 1.0.0
---

# Deep Specialty Expertise: Multi-Service Grading Consensus

## Purpose

When four AI agents analyze a collectible in parallel, each agent brings a different weighting of grading philosophy. This skill defines how to surface those differences explicitly, reconcile them systematically, and produce a consensus grade estimate that reflects the standards of the most relevant third-party grading service for the item class.

---

## Grading Service Philosophies

### PSA (Professional Sports Authenticator)

PSA grades on a 1-10 integer scale. Their system prioritizes centering, corners, edges, and surface in that rough order of weight. PSA 10 requires near-perfect centering (60/40 or better front, 65/35 or better back on most sets), four sharp corners with no visible wear under 5x magnification, clean edges with no chips or nicks, and a surface free of print defects, scratches, stains, or creases. PSA is the dominant standard for vintage and modern sports cards. Their pop report is the most cited in the hobby.

PSA's system is integer-only, which means a card that might be a BGS 9.5 will often receive a PSA 9. This grade compression at the top of the scale is a known and important pricing factor. A PSA 10 commands a premium that is structurally larger than the gap between any other two adjacent grades.

### BGS (Beckett Grading Services)

BGS uses a half-point scale from 1 to 10 with subgrades for centering, corners, edges, and surface — each graded individually. A BGS 10 (Black Label) requires all four subgrades to be 10. A BGS 9.5 (Pristine) is the more commonly achieved top grade. Subgrades are printed on the label, which means sophisticated buyers can see exactly where a card lost points.

BGS is considered the premium grading standard for modern cards. A BGS 9.5 with four 10 subgrades is sometimes called a "Pristine 9.5" and commands a premium over standard 9.5 holders. The presence of subgrades makes BGS slabs more transparent than PSA for informed buyers but also more complex to comp.

### CGC (Certified Guaranty Company)

CGC is the dominant grading authority for comic books. Their scale runs from 0.5 to 10.0 in increments that reflect comic-specific condition descriptors (Poor, Fair, Good, Very Good, Fine, Very Fine, Near Mint, Mint, Gem Mint). CGC also uses universal, restored, and signature series designations that dramatically affect value. A restored comic in a CGC holder is worth a fraction of an unrestored copy at the same numeric grade.

CGC graders assess staple integrity, spine stress lines, page color and brittleness, cover gloss, and structural defects. Age toning is evaluated on a spectrum. CGC has expanded into cards and magazines but comics remain their core domain.

### SGC (Sportscard Guaranty Corporation)

SGC also grades on a 1-10 scale with half points at the top (9.5 and 10). SGC is known for tighter grading standards than PSA on vintage material, which makes their 8s and 9s command strong premiums in some vintage categories. SGC's black slab aesthetic has driven collector preference in certain communities, particularly vintage football and basketball. For some pre-war cards, SGC holders are preferred by registry collectors over PSA.

SGC turnaround times are frequently shorter than PSA, making them a strategic choice for sellers who need faster liquidity.

### PCGS (Professional Coin Grading Service)

PCGS grades coins on the Sheldon scale from 1 to 70. MS-70 (Mint State 70) is a perfect uncirculated coin. PCGS uses a two-tier system: the numeric grade plus a strike designation (Full Steps for Jefferson nickels, Full Bands for Roosevelt dimes, Full Head for Standing Liberty quarters, etc.) that can double or triple the value of an otherwise ordinary grade. PCGS population data is authoritative and published in real time.

Proof coins are graded PR or PF; early American coins use separate designators. A PCGS MS-65 and a NGC MS-65 of the same coin are not always equal in the market — buyer preference by service is real and varies by series.

---

## How 4 AIs Reconcile Grading Philosophies

### Step 1: Assign Each Agent a Service Lens

When a collectible enters the MegaBot lane, each of the four AI agents should be implicitly weighted toward a different grading perspective:

- Agent 1: PSA standards (centering-first, integer grade estimate)
- Agent 2: BGS standards (subgrade breakdown, half-point precision)
- Agent 3: Category specialist (CGC for comics, PCGS for coins, SGC for vintage cards)
- Agent 4: Market consensus (what the realized price data implies the market grades it)

### Step 2: Surface the Divergence

Each agent produces a grade estimate with a confidence score. If all four estimates fall within one grade point of each other, the consensus is tight. If any agent diverges by more than one grade, that divergence must be named and explained. Common sources of divergence:

- Surface defects visible in photos to one agent but not another
- Centering that photographs differently than physical measurement would show
- Category-specific defects (comic spine stress, card print lines) that one agent weighs more heavily
- Market grade vs. technical grade disagreement (a card may photograph as a 9 but consistently auction as an 8.5 due to known surface issues in the set)

### Step 3: Produce a Consensus Output

The consensus grade is not an average. It is a range with a modal estimate. If three agents say 8 and one says 9, the consensus is 8 (modal) with an 8-9 range. If two say 8.5 and two say 9, the consensus is 8.5-9 with no single modal — this is a disputed assessment that must be flagged for the seller.

---

## Category-Specific Consensus Patterns

### Trading Cards (Sports and Non-Sports)

Centering is the highest-weight variable in photographs. Surface assessment is the lowest-confidence variable in photographs — print lines, scratches, and foil damage frequently do not resolve in even high-resolution images. Consensus on centering is usually tight. Consensus on surface is usually wide. The output should reflect this asymmetry.

Chrome cards (Topps Chrome, Prizm, Select) require physical inspection of the surface under light before any grading confidence above 70 percent should be cited. Holo scratches are invisible in flat photos.

### Comic Books

CGC-specific defects that are frequently missed by non-specialist agents: brittleness (visible only in bending), amateur restoration (color touch, staple replacement, cover cleaning — detectable by certain UV signatures and paper compression patterns), and centerfold attachment. Any CGC output must flag whether the book appears unrestored based on available visual evidence, with an explicit caveat that restoration detection requires physical examination.

### Coins

Strike quality and luster preservation are the two variables most degraded by photography. A deeply mirrored proof field will overexpose in most photo setups, making it look washed out. Consensus on coins should default to conservative estimates unless professional-quality obverse and reverse photos are available with controlled lighting.

### Watches

Condition consensus for watches must separate case condition, dial condition, movement condition (often unknown without service records), and bracelet completeness. Each of the four agents should address these separately. A watch with a perfect dial and heavily polished case is a fundamentally different value proposition than a watch with a worn dial and unpolished case, even at the same overall condition score.

### Sneakers

DS (deadstock) vs VNDS (very near deadstock) vs used is the primary grade spectrum. Box condition, original accessories, sole yellowing, and glue separation are the four physical variables most relevant to grade. Consensus on sole yellowing is usually reliable from photos. Glue separation and box condition require multiple angles.

---

## What Separates a 9.8 from a 10

In card grading, the difference between a 9.5/9.8 and a 10/BGS Black Label is not linear. It is often a single corner at 5x magnification, a centering ratio that is off by two percent, or a surface scratch in a corner that is invisible to the naked eye. AI agents must not assume that a card photographing beautifully will grade a 10. The appropriate default is that cards grade lower than they photograph, and the output should reflect that bias unless there is specific evidence to the contrary.

---

## Registry Set Competition and Price Impact

Registry sets at PSA and NGC create concentrated demand for high-pop, high-grade examples of specific issues. A coin or card that is a registry set target will trade at premiums that are entirely disconnected from the nominal grade premium curve. When an item has a population of one or two in top grade, and evidence of registry set activity exists for that issue, the value range must be widened substantially and this factor must be named explicitly in the output.

---

## Each Agent's Unique Strength Applied to Collectibles Grading

- Agent 1 (PSA lens): Best at integer-grade anchoring and centering assessment. Most relevant for modern sports cards being submitted to PSA.
- Agent 2 (BGS lens): Best at subgrade disaggregation. Most relevant for modern cards where subgrade disclosure affects buyer decisions.
- Agent 3 (Category specialist): Best at applying category-specific defect knowledge. Most relevant for comics, coins, vintage cards, and watches.
- Agent 4 (Market consensus): Best at translating technical grade estimates into realized price ranges. Most relevant when the seller's primary question is value, not grade.

The MegaBot output should integrate all four strengths and label which perspective each section of the analysis reflects.
