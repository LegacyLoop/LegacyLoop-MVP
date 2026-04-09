---
name: grading-scales-cross-category
description: The universal grading scale decoder across all 15 collectibles sub-markets. Sports cards (PSA/BGS/SGC/CSG), comics (CGC/CBCS/PGX), coins (PCGS/NGC Sheldon 70-point), video games (WATA/VGA), toys (AFA/UKG), vinyl (Goldmine), books (bookseller), watches (no universal scale — reference + full-set premium math), jewelry (GIA/AGS/IGI).
when_to_use: Every CollectiblesBot scan. Called before estimating grade. Wrong scale applied to wrong category = disqualifying error.
version: 1.0.0
---

# Grading Scales — Do Not Mix Them Up

The single most common amateur mistake in collectibles is applying the wrong grading scale. A "9.8 card" means something completely different from a "9.8 comic." A "PSA 10" and a "BGS 10" are not the same grade. A Goldmine "Mint" vinyl is NOT a CGC 9.8 comic. Get the scale right before you grade.

## Sports Cards + Trading Cards

| Service | Scale | Tiers |
|---|---|---|
| PSA | 1–10 | 10 GEM-MT, 9 MINT, 8 NM-MT, 7 NM, 6 EX-MT, 5 EX, 4 VG-EX, 3 VG, 2 GOOD, 1 POOR |
| BGS | 1–10 (half points) | 10 PRISTINE, 9.5 GEM MINT, 9 MINT, 8.5 NM-MT+, 8 NM-MT. Subgrades: centering/corners/edges/surface |
| SGC | 1–10 (half points) | Scale mirrors PSA; newer tuxedo holder 2018+ |
| CSG | 1–10 | Newer CGC card arm, smaller market |

**The PSA 10 premium is real.** A 1986 Fleer Michael Jordan rookie: raw $150, PSA 9 $900, PSA 10 $8,000. BGS 9.5 ≈ PSA 10 price, BGS 10 Pristine ≈ 3–10x PSA 10. BGS Black Label (10 in all four subgrades) = blue-chip territory.

## Comics

**CGC** (dominant), **CBCS**, **PGX** (discounted market — PGX grades typically sell 15–30% below CGC at same numeric grade).

Scale: 0.5 to 10.0 in half points. 9.8 NM/MT is the practical ceiling for most comics — 9.9 and 10.0 are very rare. Key tiers:
- 9.8 NM/MT — pristine, minimal wear, full luster
- 9.6 NM+ — near-perfect, tiny flaws
- 9.4 NM — minor stress
- 9.2 NM- — small defects
- 8.5 VF+ to 8.0 VF — clean but some wear
- 6.0 FN to 4.0 VG — reading copies
- Below 4.0 — detached covers, tape, missing pages

**Universal** (blue label) = unrestored. **Signature Series** (yellow label) = witnessed by CGC rep. **Restored** (purple label) = color touch, piece fill, tear seals = 30–70% discount. **Qualified** (green label) = has a specific defect noted.

## Coins

**Sheldon 70-point scale** (1–70). PCGS and NGC both use it. Key tiers:
- MS (Mint State) 60–70 for uncirculated
- AU (About Uncirculated) 50–58
- XF (Extremely Fine) 40–45
- VF (Very Fine) 20–35
- F (Fine) 12–15
- VG, G, AG below

**Designations add value:** FBL (Full Bell Lines — Franklin halves), FS (Full Steps — Jefferson nickels), FH (Full Head — Standing Liberty quarters), CAM (Cameo), DCAM (Deep Cameo), PL (Proof-like). A 1950 Franklin half MS-65 is $50; MS-65 FBL is $200.

Bulk coins: use **ANACS** or raw. For coins under $200, grading ROI is negative.

## Video Games

**WATA** (dominant, newer), **VGA** (older, smaller market), **CGC Video Games** (new entrant). Two-axis grade:
- Box grade: 1–10 half points (same ceiling as cards)
- Seal rating: A++ > A+ > A > B > C (factory seal quality)

Sealed with A++ seal at 9.6+ box grade = investment territory. Any opened game, even with all inserts, is a fraction of sealed value.

## Toys and Action Figures

**AFA** (Action Figure Authority) 50–100 scale. 85 = investment tier, 90 = blue chip, 95+ = museum. **UKG** (UK Graders) similar.

Sealed + carded + clear bubble = full AFA value. Opened loose = no AFA — assessed as "loose complete" at 20–40% of MOC value.

## Vinyl Records

**Goldmine grading scale** (the only recognized standard):
- Mint (M) — sealed, unplayed
- Near Mint (NM / M-) — looks unplayed, one careful play allowed
- Very Good Plus (VG+) — minor wear, no surface noise that interrupts play
- Very Good (VG) — audible surface noise but clean
- Good Plus (G+) / Good (G) — significant wear
- Fair / Poor — reference only

**Sleeves graded separately.** A NM record in a VG sleeve is priced at VG+ overall. Original inner sleeves and inserts add value.

## Rare Books

No numeric scale — bookseller grade:
- **Fine (F)** — as new
- **Near Fine (NF)** — tiny flaws
- **Very Good (VG)** — well preserved
- **Good (G)** — reading copy, complete
- **Fair / Poor** — incomplete or heavily damaged

**Dust jacket graded separately:** "VG/NF DJ" means book is Very Good, dust jacket is Near Fine. DJ presence is 5–10x multiplier on most 20th-century firsts.

## Watches

**No universal scale.** Condition is described in prose + full-set completeness:
- NOS (New Old Stock) — unworn
- Mint — unpolished case, full luster
- Excellent — minor wear, unpolished
- Very Good — light polishing, minor wear
- Good — polished case, visible wear
- Fair — significant wear or service needs
- Project — mechanical work required

**Box and papers premium:** Full set (box + papers + service history + accessories) = 20–40% premium over watch-only. Papers only = 10–15%. None = baseline.

## Jewelry and Gemstones

**GIA** (gold standard), **AGS**, **IGI** (less trusted in US), **EGL** (discounted). For diamonds: 4Cs (Carat, Cut, Color, Clarity) + fluorescence + shape. A GIA D-VVS1 round is priced off the Rapaport sheet; an EGL same-spec sells 15–25% below.

Colored gemstones: AGL, SSEF, Gubelin for high-end. Untreated stones with lab reports = 2–5x treated. "Padparadscha" or "Pigeon Blood" ruby with SSEF = museum tier.

## Sneakers

**No service grading.** Community standard:
- **DS (Deadstock)** — never worn, original box, all accessories
- **VNDS (Very Near Deadstock)** — tried on, no visible wear
- **9/10, 8/10** — wear scale for used
- **Beaters** — heavy wear

**Authentication via StockX Verified, GOAT Verified, CheckCheck, Legit Check app.** Box condition rated separately.

## Minerals and Meteorites

Quality tiers (not numeric):
- **Museum** — world-class specimens, often with provenance to famous collections
- **Cabinet** — display-grade, 10 cm+
- **Miniature** — 5–10 cm
- **Thumbnail** — under 5 cm
- **Micromount** — microscope-only

Meteorites: **Witnessed Fall > Find.** Classification (H-group, L-group, pallasite, CV chondrite) drives value. Documentation is everything.

## Output

Before any grading estimate, identify the category AND the applicable scale. State both in `visual_grading.grade_reasoning`. Never grade a comic on a PSA card scale. Never grade a watch on a numeric 1–10 scale. Never apply "Deadstock" to anything that is not a sneaker.
