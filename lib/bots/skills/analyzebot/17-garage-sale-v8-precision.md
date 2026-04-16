---
name: garage-sale-v8-precision
description: Teaches AnalyzeBot to output exact field values that feed the V8 3-number pricing engine. Condition terms, category keys, brand names, weight/channel indicators, sale type awareness, and antique/collectible trigger precision.
when_to_use: Every AnalyzeBot scan. Ensures output fields align with V8 pricing engine lookup tables.
version: 1.0.0
---

## Section 1: Condition Output Precision

The V8 pricing engine maps your condition output to a numeric position
within the garage sale price range. Use ONLY these exact terms:

| Output This     | Position | Meaning |
|----------------|----------|---------|
| like new       | 0.90     | Original packaging, no signs of use |
| mint           | 0.90     | Perfect condition, collector grade |
| excellent      | 0.75     | Minor signs of use, fully functional |
| great          | 0.70     | Light wear, works perfectly |
| good           | 0.55     | Normal wear for age, fully functional |
| used           | 0.45     | Visible wear, works fine |
| fair           | 0.35     | Significant wear, still functional |
| poor           | 0.15     | Heavy wear, limited function |
| damaged        | 0.10     | Broken features, cosmetic damage |
| broken         | 0.05     | Non-functional, parts-only value |

**Rules:**
- Always output condition_guess using one of these exact terms (lowercase)
- "Decent" is NOT recognized — use "good" instead
- "Okay" is NOT recognized — use "fair" instead
- "Fine" is NOT recognized — use "good" instead
- "Worn" is NOT recognized — use "used" instead
- "Rough" is NOT recognized — use "poor" instead
- "Like New" works (case-insensitive) — but prefer "like new" (lowercase)
- If unsure between two levels, choose the LOWER one. Under-promise, over-deliver.
- condition_score (1-10) should align: like new=9-10, excellent=8, great=7, good=6, used=5, fair=4, poor=2-3, damaged=1-2, broken=1

## Section 2: Brand Detection Precision

The V8 engine applies a 12% price uplift for recognized premium brands.
When you identify a brand, output the EXACT spelling from this list:

**Tech/Electronics:** apple, dyson, bose, sonos, sony, canon, nikon, leica
**Kitchen:** kitchenaid, vitamix, le creuset, breville
**Outdoor/Lifestyle:** patagonia, north face, yeti, weber, traeger
**Tools:** snap-on, dewalt, milwaukee, makita
**Furniture:** herman miller, steelcase
**Luxury:** tiffany, cartier, rolex, omega, tag heuer
**Music:** fender, gibson, martin, taylor, yamaha
**Toys/Collectibles:** lego, hot wheels, pokemon, nintendo
**Power Equipment:** john deere, husqvarna, cub cadet, stihl, echo,
craftsman, ego, greenworks, toro, ariens, briggs & stratton,
kohler engines, honda power, kubota, bobcat, simplicity

**Rules:**
- Output brand in lowercase in the brand field
- "Kitchen Aid" → output "kitchenaid" (one word, lowercase)
- "De Walt" → output "dewalt" (one word, lowercase)
- "Le Creuset" → output "le creuset" (two words, lowercase)
- The engine uses .includes() matching — "sony" matches "sony playstation"
- If you see a premium brand, ALWAYS include it in the brand field even if
  you're not 100% sure of the exact model. "Looks like a KitchenAid mixer"
  → brand: "kitchenaid"
- Unrecognized brands get no uplift. Better to output a recognized brand
  name than a creative variant the engine can't match.

## Section 3: Category Output Precision

The V8 engine maps your category output to Garage Sale Discount Factors.
Different categories get VERY different pricing. Use these exact terms:

| Category Key         | GS Factor Range  | Notes |
|---------------------|-------------------|-------|
| electronics          | 20-40% of market  | Phones, TVs, computers, gaming |
| appliances           | 20-40% of market  | Washers, dryers, refrigerators |
| furniture            | 20-35% of market  | Tables, chairs, sofas, beds |
| clothing             | Flat $1-5         | Always flat, never percentage |
| books                | Flat $0.25-1      | Always flat, never percentage |
| tools                | 20-30% of market  | Hand tools, power tools |
| kitchenware          | 15-25% of market  | Pots, pans, utensils, small kitchen |
| decor                | 15-25% of market  | Wall art, vases, decorative items |
| toys                 | 15-25% of market  | Children's toys, board games |
| sports               | 20-30% of market  | Equipment, gear, fitness |
| automotive           | 30-50% of market  | Parts, accessories, vehicles |
| outdoor              | 20-35% of market  | Patio, camping, recreation |
| garden               | 20-30% of market  | Landscaping, planters |
| musical instruments  | 30-50% of market  | Guitars, keyboards, drums |
| media                | Flat $0.50-3      | DVDs, CDs, vinyl (non-collectible) |

**EXEMPT categories (value holds at garage sales):**
| Category Key  | GS Factor Range  | Notes |
|--------------|-------------------|-------|
| collectibles  | 70-90% of market  | Cards, figures, memorabilia |
| antiques      | 70-90% of market  | 50+ years old, period pieces |
| jewelry       | 50-80% of market  | Fine jewelry, costume with value |
| art           | 50-80% of market  | Paintings, sculptures, prints |
| coins         | 70-90% of market  | Numismatic, bullion |
| watches       | 50-75% of market  | Fine watches, vintage |

**Rules:**
- Output category using exact keys above (lowercase)
- "Home Electronics" → use "electronics" (NOT "home decor")
- "Kitchen Appliance" → use "appliances" (NOT "kitchenware")
  NOTE: getCategoryKey() will match "kitchen" to "kitchenware" first.
  If it's a large appliance (mixer, blender, coffee machine), say "appliances"
  explicitly. If it's a pot, pan, or utensil, say "kitchenware".
- "Sporting Goods" → use "sports"
- "Musical Instrument" → use "musical instruments" (plural, with space)
- "Vintage" anything → check if truly antique (50+ years) before using "antiques"
- When an item spans categories (e.g., antique tool), use the HIGHER-VALUE
  category. An antique wrench is "antiques" not "tools".

## Section 4: Weight, Size, and Shipping Difficulty

The V8 engine uses shipping difficulty to determine channel recommendations.
Items that can't be shipped get different sell-path advice.

When analyzing an item, estimate and output:
- **estimated_weight_lbs**: best guess in pounds (even rough is useful)
- **shipping_difficulty**: one of STANDARD | OVERSIZE | FREIGHT_ONLY | FRAGILE

**Mapping guide:**
| Weight/Size | shipping_difficulty | Channel Impact |
|-------------|-------------------|----------------|
| Under 5 lbs, fits in box | STANDARD | All channels open |
| 5-70 lbs, needs large box | OVERSIZE | Shipping costs factor into pricing |
| Over 70 lbs OR won't fit in a box | FREIGHT_ONLY | Forces local-only recommendation |
| Any weight, glass/ceramic/delicate | FRAGILE | Shipping costs increase, local preferred |

**Rules:**
- Furniture is almost always FREIGHT_ONLY or OVERSIZE
- Large appliances = FREIGHT_ONLY
- Power equipment (mowers, tractors) = FREIGHT_ONLY
- Electronics under 20 lbs = STANDARD
- If you can't estimate weight, say "estimated_weight_lbs: null" — engine handles null gracefully
- FRAGILE + high value = recommend local sale to avoid damage claims

## Section 5: Sale Method Context

The seller may have set a sale method preference. When the item record
includes saleMethod, factor it into your analysis:

- **LOCAL_PICKUP**: Seller wants local sale only. Do NOT recommend online
  marketplaces. Focus on garage sale pricing, local consignment, estate sale.
  Shipping difficulty is irrelevant.

- **ONLINE_SHIPPING**: Seller wants to ship. Factor shipping cost into value
  assessment. A $15 item with $12 shipping is not worth listing.
  Recommend online only if seller net exceeds $10 after fees + shipping.

- **BOTH**: Seller is open to either. Recommend the best channel based on
  item value, weight, and condition. The V8 engine generates channel
  recommendations for this case.

- **Not set / null**: Treat as BOTH. Don't assume.

**Rules:**
- Never recommend shipping for FREIGHT_ONLY items regardless of saleMethod
- saleZip is used for location-adjusted pricing — if present, mention the
  seller's local market context in your analysis
- saleRadiusMi tells you how far the seller will travel for local sale.
  25 miles or less = truly local. 100+ miles = willing to drive for the right buyer.

## Section 6: Antique and Collectible Precision

These flags determine whether an item is GS-EXEMPT (value holds at garage
sales) or NON-EXEMPT (standard garage sale discounting). Getting this right
is the single highest-impact decision for pricing accuracy.

### Antique Detection (is_antique = true when ANY of these apply):
- Item is 50+ years old (estimated_age_years >= 50)
- 3+ antique markers present (construction method, materials, patina, style)
- Maker's mark from known historical manufacturer
- Period-specific design elements (Art Deco, Mid-Century Modern, Victorian, etc.)
- Hand-crafted construction visible (dovetail joints, hand-stitching, hand-blown glass)

### Collectible Detection (is_collectible = true when ANY of these apply):
- Trading cards, sports cards, Pokemon, Magic: The Gathering
- Comic books, especially first editions or key issues
- Vinyl records with original pressing indicators
- Sneakers from limited releases or collaborations
- Vintage toys still in packaging
- Figurines with production marks or limited edition numbers
- Sports memorabilia with authenticity indicators
- Coins (numismatic, not just bullion value)
- Stamps (philatelic value)
- Watches from recognized luxury/vintage brands

### Critical Rules:
- When is_antique=true, ALWAYS populate antique_markers[] with specific evidence
- When is_antique=true, estimate authenticity_score (0-100). Score >= 70 enables
  auction-anchored pricing in V8 (15-25% street discount off auction value instead
  of standard GS factors).
- When is_collectible=true, estimate collectibles_score (0-100). Score >= 80 gets
  high-grade collectible treatment (exempt-level caps). Score 50-79 gets 15% uplift.
- An item can be BOTH antique AND collectible (e.g., vintage baseball cards).
  When both flags are true, the higher-value treatment applies.
- "Vintage" does not equal "Antique". A 1995 jacket is vintage (30 years) but NOT antique.
  Only flag is_antique for 50+ year items. Use is_collectible for valuable
  vintage items under 50 years.
- NEVER apply is_antique to items clearly manufactured after 1980 unless they
  are reproductions of antique designs (in which case, note "reproduction" and
  set is_antique=false).

## Section 7: V8-Ready Output Checklist

Before returning your analysis, verify these fields are present and precise:

**REQUIRED (every item):**
- [ ] item_name — descriptive, specific (not "kitchen item" — say "KitchenAid Classic 5-Qt Stand Mixer")
- [ ] category — exact key from Section 3 table
- [ ] condition_guess — exact term from Section 1 table
- [ ] condition_score — 1-10, aligned with condition_guess
- [ ] confidence — 0.0-1.0, honest assessment
- [ ] estimated_value_low / estimated_value_mid / estimated_value_high

**REQUIRED WHEN DETECTABLE:**
- [ ] brand — exact spelling from Section 2 premium list (or best lowercase match)
- [ ] is_antique — true/false with antique_markers[] if true
- [ ] is_collectible — true/false
- [ ] estimated_age_years — integer, even rough estimate
- [ ] condition_cosmetic — 1-10
- [ ] condition_functional — 1-10

**OPTIONAL BUT HIGH-VALUE FOR V8:**
- [ ] estimated_weight_lbs — enables shipping cost awareness
- [ ] shipping_difficulty — STANDARD/OVERSIZE/FREIGHT_ONLY/FRAGILE
- [ ] authenticity_score — 0-100 (antiques only, enables auction anchoring)
- [ ] collectibles_score — 0-100 (collectibles only, enables grade-based uplift)
- [ ] subcategory — more specific classification

**Quality rules:**
- Specificity > generality. "Dyson V15 Detect cordless vacuum" > "vacuum cleaner"
- When you see multiple items in photos, analyze the PRIMARY item only.
  Note secondary items in your description but price the primary.
- If photos are blurry or inconclusive, lower your confidence score.
  confidence < 0.5 should trigger a re-scan suggestion.
- NEVER output condition terms not in the Section 1 table. The engine
  will default to 0.55 (good) for any unrecognized term, which may be
  wrong in either direction.
