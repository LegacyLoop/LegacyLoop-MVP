---
name: maker-marks-hallmarks-signatures
description: The universal maker-mark decoder. Where to look, how to read, and how to grade the evidentiary weight of marks across silver, pottery, glass, furniture, bronze, jewelry, and clocks.
when_to_use: Every AntiqueBot scan. The maker drives 40-70% of value in most categories. Get the mark right or get the value wrong.
version: 1.0.0
---

# Maker Identification — The 40-to-70-Percent Skill

The maker is the single biggest value lever in most antique categories. A correctly identified Tiffany Studios base is worth 20 to 50 times a generic patinated bronze of the same era. A signed Newcomb pot is worth 10 times an unsigned matte-green Southern art pottery of the same period. A Stickley red-decal is a different object than an Arts-and-Crafts oak chair by an unknown Grand Rapids maker. The order of operations below is how Christie's furniture and silver departments actually work an item up.

## Step 1 — Find The Mark Before You Guess

Marks hide in predictable places. Look in this order:

- Silver: underside foot, inside lid rim, handle joint, foot rim, body join seam. Very small items (flatware): back of handle, near the ferrule.
- Pottery and porcelain: base (stamped, incised, painted, or impressed), inside lid, foot ring, shoulder (rare). Majolica often marked on base AND inside lid.
- Glass: pontil mark center of base (hand-blown diagnostic), acid-etched near rim, molded-in around base. Steuben acid mark under foot. Tiffany "LCT" or "L.C. Tiffany Favrile" near pontil.
- Furniture: inside drawer bottom, back of case, underside of seat rail, inside apron, back of backboard. Stickley red decals inside a drawer. Herter Brothers branded or stenciled inside drawers.
- Jewelry: clasp back, inside ring shank, bail loop, pin stem, inside watch case back.
- Clocks: painted dial, movement back plate, case back interior, pendulum bob.
- Bronzes: rear of base, edge of plinth, under foot. Foundry marks separate from artist signature.
- Paintings: lower-right front, verso (back) stretchers, verso canvas inscriptions.
- Books: title page, colophon, endpapers.

Rule: if the user photo does not show the mark, the first thing AntiqueBot requests is a close-up of the base, underside, or signature area. Never attribute without the mark visible or explicitly provenance-documented.

## Step 2 — British Silver Hallmarks (Four Marks In Sequence)

British silver has the most rigorous and best-documented mark system in the world. Required since 1300 for sterling. Four marks in a row, any order on a single strike line:

1. Maker's mark — initials or monogram in a shaped cartouche. Look up in Jackson's Hallmarks.
2. Standard mark — lion passant (sterling .925), Britannia figure (.958 Britannia standard 1697-1720 and optional after), lion's head erased (.958 London only).
3. Assay office (town) — anchor = Birmingham, leopard's head = London, crown = Sheffield (pre-1974), rose = Sheffield (post-1975), harp crowned = Dublin, thistle = Edinburgh, castle = Exeter, bird = Chester. Each office used marks for specific windows — a Chester mark on a post-1962 piece is impossible (office closed 1962).
4. Date letter — alphabet cycles every 20-25 years; font AND shield shape together pin the exact year. You must cross-reference a date-letter chart; memory is not enough.

Optional fifth mark: duty mark (monarch's head 1784-1890) — its presence pins the piece into that window. Absent on post-1890 pieces.

## Step 3 — American Silver Marks

No required hallmarking law, so marks are maker-driven:
- "STERLING" or ".925" — post-1860s standard. Presence alone dates the piece post-1860.
- "COIN" or "STANDARD" or "PURE COIN" — pre-1860s, .900 fineness.
- Tiffany and Co. — look for period-specific director initial: M = Edward Moore 1854-1869 (most valuable), C = Charles Cook 1870-1902, T = John Curran 1902-1907. Pattern number follows director letter.
- Gorham — lion / anchor / G trio, plus date symbol (1868+). Date symbol chart mandatory.
- Kirk, Stieff, Reed and Barton, International, Wallace, Towle, Lunt, Oneida — regional makers with distinct stamp styles; all worth looking up by stamp silhouette.

## Step 4 — Continental Silver

- French: Minerva head (.950 1st standard), Minerva 2 (.800 2nd standard), crab (post-1893 export), boar's head (small items), weasel (export non-French). Paris vs provincial further distinguished by style letter.
- German: numeric .800 or .835 with crescent-and-crown (post-1888 Reichsgesetz). Pre-1888 marks are town-specific (Augsburg pinecone, Nuremberg pyramid).
- Russian: zolotnik fineness (84 = .875, 88 = .916) plus assay master initials plus town shield plus date. Fabergé pieces additionally marked K. FABERGÉ or with Cyrillic initials — beware reproductions.
- Italian, Spanish, Dutch, Scandinavian: each has its own standard; all require lookup.

## Step 5 — Pottery And Porcelain Marks

Marks on ceramics are the wild west. Categories:
- Incised (scratched into wet clay before firing) — strongest evidence, hardest to fake.
- Impressed (stamped into soft clay) — strong, standard for Rookwood, Weller, Grueby.
- Painted under glaze — strong for period Sèvres, Meissen, Wedgwood.
- Printed or transferred — standard post-1850s for mass production, still authoritative.
- Paper label only — weakest; easily removed or applied later.

Key period markers to memorize for dating:
- "ENGLAND" (no "Made in") = 1891-1921 period per McKinley Tariff Act.
- "MADE IN ENGLAND" = 1921 onward.
- "NIPPON" = 1891-1921 (Japan).
- "MADE IN JAPAN" = post-1921; "MADE IN OCCUPIED JAPAN" = 1945-1952 only.
- "USSR" or Cyrillic CCCP = 1922-1991.
- "GERMANY" alone (no east/west) = pre-1949 OR post-1990.
- Meissen crossed swords: the swords' shape, the blade crossings, and any dot/star additions pin the period within 20 years — memorize the chart.

## Step 6 — Weighing Evidentiary Strength

Marks do not carry equal weight. Grade them:

| Strength | Example | Treatment |
|---|---|---|
| Strongest | British hallmarks in sequence, struck into metal | Near-certain attribution plus date |
| Strong | Impressed/incised pottery mark, branded furniture mark | Strong attribution, check for restoration |
| Medium | Printed under-glaze, painted signature | Attribution pending style/construction match |
| Weak | Paper label only, inked signature in unexpected spot | Cite as "label present" but do not rest attribution on it |
| Suspect | Mark too perfect, too clean, wrong font for period, wrong position | Flag as possible later addition / reproduction |

## Step 7 — When Marks Conflict With Construction

If the mark says "1820" but the dovetails are machine-cut (post-1860), the mark is wrong or the piece has been married. Construction always beats marks. A period mark on a reproduction body is a known fake pattern — call it out.

## Output

Populate identification.maker, identification.markings, and authentication.reasoning. In the reasoning field, cite the specific mark evidence you saw (or did not see) and assign the evidentiary strength tier. If the mark is absent or illegible, request a close-up photo as the top "raise confidence" action.
