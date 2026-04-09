---
name: coin-numismatic-grading
description: The Sheldon 70-point scale for coins. Mint State vs circulated grades. Strike, luster, contact marks, and eye appeal. Key designations (FBL, FS, FH, CAM, DCAM). CAC stickers. When to submit to PCGS vs NGC vs leave raw.
when_to_use: Any scan in the coins, numismatic, or currency sub-market. Load alongside Pack 02 (scales) and Pack 03 (pop reports).
version: 1.0.0
---

# Coin Grading — The Sheldon Scale

Dr. William Sheldon introduced the 70-point grading scale in 1949 for Large Cents. It was adopted industry-wide in the 1970s and is now the universal standard for US coins. PCGS and NGC both use it. A "PCGS MS-65" and an "NGC MS-65" are the same grade in principle, though market premiums differ.

## The Scale Tiers

| Range | Tier | Meaning |
|---|---|---|
| 70 | Perfect | No defects at 5x magnification. Modern proofs only. |
| 68–69 | Superb Gem | Near-perfect, subtle flaws. |
| 65–67 | Gem | No distracting marks, strong eye appeal. |
| 63–64 | Choice | Above-average mint state. |
| 60–62 | Typical MS | Mint luster, contact marks present. |
| 58 | AU (Choice About Unc) | Trace of wear on highest points. |
| 50–55 | AU | Light wear on high points. |
| 40–45 | XF (Extremely Fine) | Light wear, all details sharp. |
| 30–35 | VF (Very Fine) | Moderate wear, details clear. |
| 20–25 | F (Fine) | Heavy wear, major details visible. |
| 15 | VG (Very Good) | Rim wear, date clear. |
| 8–10 | G (Good) | Heavy wear, date readable. |
| 4 | AG (About Good) | Heavy wear, date partial. |
| 2–3 | Fair | Date barely visible. |
| 1 | Poor | Identifiable only. |

## The Five Grading Criteria (For MS Coins)

PCGS and NGC weigh these five elements when assigning an MS grade:

1. **Strike** — how sharply the design was impressed by the dies. A weakly-struck MS-65 and a fully-struck MS-65 are both MS-65, but the strong strike earns designations and commands a premium.
2. **Luster** — the flow lines of metal from the strike. Full "cartwheel" luster is prized. Cleaning or dipping destroys luster (disqualifying — "Details" grade only).
3. **Surface preservation** — contact marks, bag marks, scratches. Key factor for MS-60 through MS-67.
4. **Eye appeal** — the subjective overall impression. Toning (rainbow, album, crescent) can add huge premiums (sometimes 5–10x). Unattractive toning or spotting subtracts.
5. **Attribution** — correct variety, date, mint mark.

## Key Designations That Add Value

Designations are added after the numeric grade and sometimes double or triple the value at the same grade:

- **FBL (Full Bell Lines)** — Franklin half dollars with complete lines on the Liberty Bell
- **FS (Full Steps)** — Jefferson nickels with complete steps on Monticello (at least 5 full steps for NGC, 6 for PCGS)
- **FH (Full Head)** — Standing Liberty quarters with full hair detail on Liberty
- **FBS (Full Split Bands)** — Mercury dimes with split center bands
- **FS (Full Strike)** — Some modern issues
- **CAM (Cameo)** — Proof coins with frosted devices against mirror fields
- **DCAM (Deep Cameo)** — Heavy cameo contrast — Proof premiums multiply
- **PL (Proof-Like)** — Business strikes with mirror-like fields
- **DMPL (Deep Mirror Proof-Like)** — Morgan dollars with heavy mirror fields

A 1950 Franklin half MS-65 is approximately $50; MS-65 FBL jumps to $200; MS-66 FBL crosses $1,000.

## Circulated Coin Grading (Below AU-58)

For circulated coins, grade on the clarity of specific design elements:
- **Morgan Dollar:** hair above Liberty's ear, wing feathers on reverse eagle
- **Walking Liberty Half:** Liberty's hand, skirt lines, eagle breast feathers
- **Mercury Dime:** fasces bands, obverse fletching
- **Buffalo Nickel:** buffalo horn (key indicator), date (wear)
- **Standing Liberty Quarter:** Liberty's shield rivets, head detail

## What Disqualifies An Actual Grade

Coins with problems receive a "Details" grade (genuine but not straight-graded) with a qualifier:
- **Cleaned** — chemical or abrasive cleaning, common fatal flaw
- **Damaged** — scratches, gouges, rim damage
- **Environmental Damage** — corrosion, spotting, saltwater
- **Altered Surfaces** — tooling, whizzing, chemical toning
- **Planchet Flaw** — original mint defect (may or may not affect value)
- **Holed** — drilled or punched
- **Bent** — physical distortion
- **Counterfeit** — body bag (not slabbed at all)

"Details" coins sell at 40–70 percent discount to straight-graded same-grade. A "MS-63 Details — Cleaned" Morgan is worth less than a VF-30 problem-free.

## CAC (Certified Acceptance Corporation)

CAC reviews already-slabbed PCGS and NGC coins and applies a sticker if they judge the coin "high end for grade." Two sticker colors:
- **Green CAC** — solid coin for the grade, typical 10–30 percent premium
- **Gold CAC** — undergraded in CAC's view, can be 2x+ premium

For high-value coins ($500+), CAC is meaningful. Below that, the submission cost outweighs the premium.

## PCGS vs NGC Market Difference

For common coins: PCGS typically commands a 5–15 percent premium at the same grade. For classic rarities: PCGS and NGC trade at parity. ANACS slabs are discounted 10–20 percent. Raw coins from reputable dealers can trade at parity with slabbed if the coin is common and the dealer is known.

## Grading ROI For Estate Sellers

Submission fee: ~$20–$100 per coin depending on service level and value. Turnaround: 10 business days to 6+ months. Rule of thumb:
- Under $150 raw value → do NOT grade
- $150–$500 → grade only if clear MS-64+ or key date
- $500+ → grade is usually justified
- $2,000+ → CAC consideration

## Output

In `visual_grading`, state the estimated grade range, the key criterion (strike, luster, contact marks), and whether designations might apply. In `graded_values`, show values at relevant tiers (e.g., MS-63, MS-65, MS-67). In `grading_recommendation`, state go/no-go with dollar math. Always name PCGS as the primary submission target unless there is specific reason to prefer NGC.
