---
name: maker-mark-recognition
description: Expert protocol for reading maker marks, signatures, stamps, hallmarks, and labels from photographs, covering location conventions by category, period-specific marking rules, authentication signals, and confidence adjustment procedures.
when_to_use: "Every AnalyzeBot scan."
version: 1.0.0
---

# Maker Mark Recognition

## The Core Purpose of Mark Reading

A maker mark is a compressed archive of information. It encodes the maker, the period, the country of manufacture, and often the quality grade. Reading marks accurately is one of the highest-leverage skills in item identification because a confirmed mark can anchor an otherwise uncertain attribution with documentary precision.

## Where Marks Hide by Category

Marks are not always on the obvious surface. They are often on the underside, the back, the interior, or deliberately in a location that is inconspicuous during normal use.

### Silver and Silver Plate

British sterling silver carries hallmarks on the underside of flatware, on the base of hollow ware, and on the inside of rings. The full British hallmark set includes the maker's mark (initials in a shaped cartouche), the assay office mark (a city symbol: lion passant for sterling, anchor for Birmingham, crown for Sheffield, castle for Edinburgh), the date letter (a letter in a specific style that changes annually and identifies the exact year of assay), and optional duty marks. American silver carries maker stamps, often a name or initials, sometimes with "STERLING" or "925." Continental silver uses various national systems: French silver has a guarantee mark (owl or boar's head), German silver uses moon-and-crown for 800 silver. Electroplated pieces carry markings like "EPNS" (electroplated nickel silver), "EPBM" (electroplated Britannia metal), or quadruple plate designations.

### Ceramics and Porcelain

Factory marks appear on the base. Meissen uses the crossed swords mark (with period variations: early pieces have bladed swords, later pieces have hilted swords with a dot or star between). Royal Worcester uses a circle with a crescent, surrounded by dots corresponding to the year (one dot per year beginning 1867). Wedgwood stamps "WEDGWOOD" in capital letters (not "Wedgwood & Co." which is a different maker). Spode marks its pieces. Royal Doulton uses a lion-over-crown mark with the "Royal Doulton" name. American pottery marks vary widely: Rookwood uses a flame mark (one flame per year starting 1886, for a total of fourteen flames by 1900). Roseville uses "Roseville" in script or a printed mark. Hull Pottery uses "Hull" with a shape number. Japanese Satsuma ware often carries painted marks in Japanese characters; Nippon-era pieces have "NIPPON" in English as required by US customs.

### Furniture

Furniture marks are rare by historical standard but do appear. Paper labels may be found inside drawer corners, on the back of carcass pieces, or underneath seat rails. Branded stamps may appear on the inside of a drawer side near the back, or on the back of a carcass. Pencil inscriptions, chalk marks, and inventory numbers appear on secondary surfaces and can be as informative as formal marks when they reference an estate, a dealer, or a period workshop.

### Jewelry and Watches

Jewelry marks appear on clasps, on the inside of ring shanks, on earring posts, and on bracelet links. Cartouche shapes vary by country. American gold uses karat marks (10K, 14K, 18K) with a maker's trademark. British gold and platinum carries the same hallmark system as silver. Watch movements are marked on the plates; watch cases carry separate hallmarks. Pocket watch cases separate from movements; the movement maker and case maker are often different.

### Glass

Glass marks appear as acid-etched signatures, engraved signatures, molded marks in the glass base, and paper labels. Lalique uses an engraved or molded "R. Lalique" or "Lalique France" signature. Steuben uses an engraved block signature. Depression glass and pressed glass carry mold seam patterns that identify manufacturers by shape, not by mark.

## Period-Specific Marking Conventions

### The McKinley Tariff Act of 1891

The McKinley Tariff Act required all goods imported into the United States to be marked with their country of origin in English. This means any piece marked "ENGLAND," "GERMANY," "FRANCE," or similar in English was made for export to the US market and manufactured after 1891. A piece marked "England" without additional qualification is almost certainly between 1891 and 1921.

### The "Made In" Requirement Post-1921

Customs regulations around 1921 strengthened to require "Made in [Country]" rather than the country name alone. A piece marked "Made in England" or "Made in Germany" in full was manufactured after approximately 1921.

### Nippon Period 1891-1921

Japanese export porcelain marked "NIPPON" (the Japanese name for Japan) was produced between 1891 and 1921. After 1921, US customs required "Japan" in English. A piece marked "Nippon" is therefore dateable to this specific window.

### Occupied Japan 1945-1952

Items marked "Occupied Japan" or "Made in Occupied Japan" were produced between 1945 and 1952, during the American occupation following World War II. This is a precise, tight date range.

### Union Label Dating

American union labels on textiles, paper goods, and manufactured items carry their own date ranges. The ILGWU (International Ladies' Garment Workers' Union) changed its label design multiple times; knowing which design version appears on a garment allows approximate decade dating. These details require specialist knowledge and should be flagged for further research rather than stated as confirmed.

## Distinguishing Genuine Marks from Reproductions

A genuine mark from the period will show wear consistent with the age of the piece. A mark on silver flatware will show the same level of surface wear and polishing as the surrounding metal. A mark on a ceramic base will show the same patina as the unglazed foot ring.

A reproduced mark is often too crisp. The lines are too sharp, the corners too clean, the impression too deep and even. Genuine die stamps in metal show slight variation in depth depending on the force applied; mechanical reproduction is perfectly uniform.

The position of a mark is meaningful. British hallmarks on flatware appear in a specific location depending on the piece type and period. Meissen crossed swords appear in the center of the base. A mark in the wrong position for the supposed maker and period is a strong authentication red flag.

Font matching is important for printed and transfer marks. Each factory used specific lettering styles in specific periods. The font on a mark that appears inconsistent with the supposed period of manufacture warrants skepticism.

Marks can be genuine marks applied to incorrect pieces. A genuinely old silver hallmark can be cut from a damaged piece and inserted into a new piece (a practice called "duty dodging" or, in fakes, "transposing"). The surrounding metal shows different wear than the mark area. Look for solder lines or color differences at the perimeter of an inserted mark.

## When to Flag for AntiqueBot

Flag for AntiqueBot based on mark identification under these conditions:

Any identifiable period mark that places manufacture before 1975 (50 years prior to analysis date) must trigger the antique flag. This includes British date letters before 1975, Nippon-period marks, Occupied Japan marks, pre-1891 unmarked Continental pieces, and any factory mark from a manufacturer whose production is known to have ceased.

Any auction house sticker visible in the photographs must be flagged. These stickers indicate prior auction history and potential provenance documentation. Common auction house labels include Christie's, Sotheby's, Bonhams, Skinner, Heritage Auctions, Freeman's, Rago Arts, and regional houses.

Any museum loan label must be flagged. A museum loan label is an extraordinary provenance indicator. It shows the piece was considered significant enough to be borrowed for exhibition.

Any estate sale lot tag with a named estate is a provenance indicator. Named estates with documented history add value.

Any visible insurance appraisal tag or dealer tag with a price in old currency denominations should be flagged and noted.

## The Mark-or-No-Mark Confidence Impact

A confirmed and identified maker mark adds 20 confidence points to an identification. The mark provides documentary anchoring that visual observation alone cannot match.

The absence of a mark where one is expected (unglazed porcelain base with no factory mark, silver flatware with no hallmarks, watch movement with no maker inscription) is not itself evidence of inauthenticity but should be noted as "mark absent; base photo requested to confirm." Some legitimate pieces are unmarked by design or because marks have been polished away.

When the base or underside photograph is not available, note specifically: "Mark assessment pending; photograph of [base/underside/clasp/inside shank] required. Mark presence would add 20 points to identification confidence."

Always request the mark photograph in the specific terms that help the seller understand what to capture and how.
