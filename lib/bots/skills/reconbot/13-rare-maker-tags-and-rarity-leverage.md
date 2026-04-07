---
name: rare-maker-tags-and-rarity-leverage
description: Identifying valuable maker marks, signatures, and provenance — and how rarity leverages prices 2-10× over generic comps.
when_to_use: Every ReconBot scan where the item shows visible maker marks, signatures, or known brand provenance.
version: 1.0.0
---

# Maker Marks Are the Difference Between $50 and $5,000

Two visually identical chairs sit at an estate sale. One has a small brass tag reading "Knoll" on the underside. One does not. The Knoll chair is worth $1,500. The unmarked chair is worth $80. You must train ReconBot to recognize and weight maker marks aggressively.

## The Big-Name Premium List

These makers add a 3-10× premium over generic equivalents. When detected (even partially), this is a high-priority signal.

### Mid-Century Modern Furniture
- **Eames** (Charles & Ray) — Herman Miller chairs, lounge sets, fiberglass shells
- **Hans Wegner** — Carl Hansen, PP Møbler, GETAMA
- **Arne Jacobsen** — Egg Chair, Swan Chair, Series 7
- **Florence Knoll / Mies van der Rohe** — Knoll
- **Eero Saarinen** — Tulip Chair, Womb Chair
- **George Nelson** — Herman Miller
- **Finn Juhl** — Baker, Niels Vodder
- **Verner Panton** — Vitra, Panton Chair
- **Pierre Jeanneret** — Chandigarh chairs (extremely rare, $5,000-$50,000+)

### American Studio / Craftsman
- **George Nakashima** — slab tables, Conoid chairs ($5,000-$200,000+)
- **Sam Maloof** — rocking chairs ($3,000-$50,000+)
- **Wharton Esherick** — sculptural furniture
- **Wendell Castle** — postmodern sculptural

### Antique American
- **Stickley** (Gustav, L. & J.G., Stickley Brothers) — Mission / Arts & Crafts oak
- **Roycroft** — Arts & Crafts
- **Limbert** — Arts & Crafts
- **Heywood-Wakefield** — mid-century maple
- **Duncan Phyfe** (period, not reproductions) — Federal style

### Lighting
- **Tiffany Studios** — leaded glass lamps ($5,000-$500,000+)
- **Handel** — reverse-painted lamps
- **Pairpoint** — puffy lamps
- **Mid-century lighting:** Sciolari, Stilnovo, Arteluce, Arredoluce, Achille Castiglioni, Poul Henningsen, George Nelson Bubble Lamps

### Pottery / Ceramics
- **Rookwood, Roseville, Weller, Newcomb College, Grueby, Marblehead** — American art pottery
- **Beatrice Wood, Peter Voulkos, Lucie Rie, Hans Coper** — studio ceramics
- **Royal Copenhagen, Meissen, Sevres, Wedgwood (early)** — European porcelain

### Glass
- **Tiffany Studios, Steuben, Galle, Daum, Lalique, Loetz** — art glass

### Watches
- **Rolex, Patek Philippe, Audemars Piguet, Vacheron Constantin** — Swiss luxury
- **Omega Speedmaster** (Moonwatch and Pre-Moon variants)
- **Heuer / TAG Heuer Carrera** (vintage)

### Cameras
- **Leica** (M-series, screw-mount) — collector premiums
- **Hasselblad** (V-system)
- **Rolleiflex** (vintage TLRs)
- **Nikon F** (early variants)

### Tools
- **Stanley** (Type 1-9 vintage planes), **Lie-Nielsen, Veritas** — premium hand tools
- **Snap-On, Mac, Matco** — vintage mechanic tools
- **Disston** (vintage saws)

### Toys / Collectibles
- **Star Wars Kenner figures** (1977-1985)
- **Vintage Lego** (specific sets)
- **Hot Wheels Redlines** (1968-1972)
- **Vintage GI Joe** (1960s)

## How Rarity Leverages Price

When you detect a known maker, the comp analysis changes fundamentally:

1. **Throw out generic comps** — they don't apply to a marked item
2. **Search for maker-specific comps** — compare ONLY to other Stickley / Knoll / Eames items
3. **Apply the rarity multiplier** — 2-10× over generic equivalents

The premium isn't arbitrary. Buyers in maker-specific markets are different — they're collectors, designers, dealers — and they pay premium prices for verified items.

## Confidence Tiers for Maker Identification

Not all maker IDs are equally certain. Use confidence tiers:

### High Confidence (90-100%)
- Visible signed plaque, paper label, or burn mark
- Visible model number that matches catalog records
- Verified provenance documentation (receipts, COA, gallery tag)

**Action:** Apply full rarity premium. Recommend listing as the maker.

### Medium Confidence (60-89%)
- Style and construction match but no visible mark
- Partial mark visible (e.g., "STIC..." legible on a tag)
- Joinery / materials match a known maker's signature techniques

**Action:** Recommend "in the manner of" or "attributed to" framing. Apply partial rarity premium (50% of full).

### Low Confidence (30-59%)
- Style is reminiscent of a known maker but could be a knockoff
- Generic vintage with hopeful seller attribution
- No visible marks, joinery is generic

**Action:** Treat as generic vintage. Recommend authentication if user wants to sell as the named maker.

### Below 30%
- No basis for maker attribution
- Treat as fully generic

## When to Recommend Authentication

If maker confidence is medium (60-89%), the value gap between "generic" and "verified" is so large that paying for professional authentication is usually worth it:

- **Furniture:** Christie's, Sotheby's, Wright Auctions, Rago Arts have appraisal services
- **Watches:** Local AWCI-certified watchmaker or brand-authorized dealer
- **Art:** Heritage Auctions, Doyle, regional auction houses
- **Cameras:** Specialty camera dealers (Used Photo Pro, KEH Camera)

Recommend authentication when:
- Estimated unverified value: $200-$500
- Estimated verified value: $1,500+
- Authentication cost: $50-$200

The math justifies it.

## Output Format

When reporting maker findings:

**HIGH CONFIDENCE:**
"This is a Hans Wegner CH-25 lounge chair, 95% confidence (paper tag visible in photo 4 confirms Carl Hansen production). Generic mid-century lounge chairs sell for $80-$200. CH-25 verified comps sell for $1,800-$3,400. Recommended listing price: $2,200, list as Hans Wegner."

**MEDIUM CONFIDENCE:**
"This appears to be in the style of Hans Wegner CH-25 (joinery and silhouette match), 70% confidence — but no visible maker tag. Recommend professional authentication before listing. With authentication: $1,800-$3,400. Without: $400-$700 as 'Danish modern lounge chair.' Authentication cost ~$150 — math favors authenticating."

**LOW CONFIDENCE:**
"Generic Danish modern style, no maker marks visible. Recommend listing as 'mid-century lounge chair' at $200-$400."

## What NEVER to Do

- NEVER attribute a maker without evidence (calling something "Eames" without a tag is fraud risk)
- NEVER ignore visible maker marks (even partial / damaged ones are gold)
- NEVER apply generic comps to marked items
- NEVER recommend selling as a famous maker without high confidence — it can void the sale and damage reputation
