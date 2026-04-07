---
name: item-specifics-mapping-ebay
description: eBay's Item Specifics are structured fields that power search filters. Populating them correctly is the single biggest lever for eBay search visibility.
when_to_use: Every ListBot scan generating an eBay listing. Item Specifics are mandatory for most categories.
version: 1.0.0
---

# eBay Item Specifics Are the Hidden Ranking Factor

Most amateur sellers skip Item Specifics or fill them in wrong. This is a MASSIVE mistake. eBay's search algorithm gives huge weight to properly-filled Item Specifics — they power the left-sidebar filter buttons that buyers use to narrow down results.

A listing with complete Item Specifics appears in 5-10× more search results than one without. Fill them in correctly or lose the sale.

## The Core Item Specifics Every Listing Needs

Regardless of category, every eBay listing should populate:
- **Brand** — Hans Wegner, Stickley, Omega, Stanley, Leica, etc.
- **Model** — CH-25, #634 Morris Chair, Speedmaster, #4 plane, M3
- **Year / Decade** — 1958, 1960s, Victorian, etc.
- **Condition** — see condition mapping below
- **Material** — teak, oak, sterling, leather, etc.
- **Color** — buyer filter field
- **Style** — Mid-Century Modern, Victorian, Industrial, etc.

## Category-Specific Item Specifics

### Vintage Furniture
- Type (Credenza, Chair, Table, Cabinet, etc.)
- Material (Teak, Oak, Walnut, etc.)
- Style (Mid-Century Modern, Danish Modern, Arts & Crafts)
- Color (Brown, Honey, Black, etc.)
- Height / Width / Depth (exact inches)
- Number of Drawers / Shelves
- Original / Refinished / Restored
- Maker / Designer
- Production Year / Decade

### Watches
- Brand (Omega, Rolex, Seiko)
- Model (Speedmaster, Submariner, 5 Sports)
- Reference Number (145.022, 16610, SRPD55)
- Case Material (Steel, Gold, Titanium)
- Case Size (38mm, 40mm, 42mm)
- Movement (Automatic, Manual, Quartz)
- Year of Manufacture (1969, 1985, 2020)
- Original Box (Yes/No)
- Original Papers (Yes/No)

### Cameras
- Brand (Leica, Nikon, Canon, Hasselblad)
- Model (M3, F, AE-1, 500C/M)
- Type (Rangefinder, SLR, TLR, Point & Shoot, Medium Format)
- Format (35mm, 120, Instant, Digital)
- Lens Included (Yes/No + specs)
- Condition (Working, For Parts, Refurbished)
- Year (1954, 1970s, etc.)

### Tools
- Brand (Stanley, Lie-Nielsen, Snap-On)
- Type (Hand Plane, Wrench, Drill)
- Model (#4, #8, 5-piece set)
- Era (Vintage, Antique, Modern)
- Condition (User, Restored, Collector)
- Power Source (Manual, Electric, Pneumatic) if applicable
- Material (Steel, Brass, Wood)

### Vintage Clothing
- Brand
- Size (match eBay's standardized size dropdown)
- Department (Men's, Women's, Unisex, Kids)
- Style (Boho, Preppy, Punk, etc.)
- Era (1960s, 1970s, 1980s, etc.)
- Material (Cotton, Leather, Wool, etc.)
- Color
- Pattern (Solid, Striped, Floral, etc.)
- Occasion (Casual, Formal, etc.)

## The Condition Mapping

eBay has a structured Condition dropdown. Map your condition assessment to their exact terms:
- **New** — never used, original packaging
- **New with tags** — clothing with original tags
- **New without tags** — clothing without tags but never worn
- **New with defects** — new but has visible flaws
- **Manufacturer refurbished**
- **Seller refurbished**
- **Used** — shows signs of use
- **For parts or not working**

For collectibles specifically:
- **Mint** — museum-quality, no flaws
- **Near Mint** — minor flaws only visible under close inspection
- **Excellent** — minor visible flaws
- **Very Good** — moderate visible wear
- **Good** — significant wear but functional
- **Acceptable** — heavy wear, functional

Match your ListBot condition score (1-10) to eBay's terms:
- 10 = Mint
- 9 = Near Mint / Excellent
- 8 = Very Good
- 7 = Good
- 5-6 = Acceptable
- 3-4 = For Parts
- 1-2 = For Parts

## The Measurement Field Rule

For furniture and large items, ALWAYS populate:
- Height (inches)
- Width (inches)
- Depth (inches)
- Weight (lbs)

Buyers filter by dimensions. A listing without dimensions is invisible to buyers who NEED a specific size.

## Output Format

Populate `listings.ebay.item_specifics` as a dictionary of key-value pairs matching eBay's field names:

```json
{
  "item_specifics": {
    "Brand": "Hans Wegner",
    "Model": "CH-25",
    "Year": "1958",
    "Type": "Lounge Chair",
    "Material": "Teak",
    "Style": "Mid-Century Modern",
    "Color": "Brown",
    "Condition": "Excellent",
    "Height": "28 in",
    "Width": "26 in",
    "Depth": "28 in"
  }
}
```

Populate EVERY applicable field. Empty fields lose search visibility.
