---
name: platform-specific-buyer-behavior
description: Each platform has a distinct buyer psychology. Match the item to the platform where its buyers actually live.
when_to_use: Every ReconBot scan when recommending which platforms to list on.
version: 1.0.0
---

# Buyers Are Not Generic — They Live on Specific Platforms

Platform recommendation is one of the most valuable things ReconBot can do. The same item can sell for 2× more on the right platform than on the wrong one — not because of price, but because the right buyer lives there. Know your buyer demographics cold.

## eBay — The National Specifics Buyer

**Who shops here:**
- Collectors with specific search saves
- Resellers / dealers looking for inventory
- Specific-item hunters (model numbers, exact maker tags)
- International buyers (eBay Global Shipping)

**Buyer behavior:**
- Will scrutinize item specifics, condition, description, photos
- Comfortable with shipping (it's the default expectation)
- Willing to pay a premium for verified condition / authentic provenance
- Uses saved searches and alerts — patient, will wait weeks for the right item

**Best for:**
- Specific brand-name items (Stickley, Tiffany, Rolex, Eames)
- Items with model numbers or maker marks
- Antiques with known provenance
- Electronics with clear specs
- Collectibles (coins, stamps, sports cards, action figures)

**Worst for:**
- Generic items without identifying details (just "old chair")
- Heavy / fragile items where shipping kills the margin
- Quick-sale liquidations (slow buyer pool)

## Facebook Marketplace — The Local Deal Hunter

**Who shops here:**
- Local buyers looking for in-person transactions
- Bargain hunters expecting 30-50% below retail
- People furnishing apartments / homes
- Garage sale crowd that doesn't drive to actual garage sales

**Buyer behavior:**
- Wants pickup, not shipping
- Will negotiate hard ("will you take $X?")
- Decides quickly (24-48 hours typical)
- Often flakes / no-shows (expect 30-40% no-show rate)
- Reads photos but rarely the description

**Best for:**
- Bulky furniture (couches, dining tables, dressers)
- Appliances
- Outdoor / yard items
- Lower-value items where shipping isn't worth it
- Quick liquidations

**Worst for:**
- High-value items (buyers won't pay premium prices)
- Items requiring expert authentication
- Fragile collectibles (no shipping protection)

## Etsy — The Story Buyer

**Who shops here:**
- Vintage decor enthusiasts
- Interior designers and stagers
- Gift shoppers looking for unique items
- People who want a STORY behind their purchase

**Buyer behavior:**
- Values aesthetics and curation
- Reads listings carefully, especially the story
- Pays premium for "vintage" framing (even if same item)
- Expects shipping
- Repeat customers if the seller has consistent style

**Best for:**
- Vintage decor (1900-1980 sweet spot)
- Handmade / artisan items
- Wedding-related vintage
- Boho / farmhouse / mid-century styled items
- Anything that photographs beautifully

**Worst for:**
- Modern mass-produced items
- Generic furniture without vintage character
- Tools / equipment / utility items

## Mercari — The Mobile Quick-Sale

**Who shops here:**
- Mobile-first millennials and Gen Z
- People buying small items casually
- Resellers looking for cheap inventory

**Buyer behavior:**
- Fast decisions (often impulse)
- Expects free or cheap shipping
- Lower price tolerance than eBay
- Limited research — buys based on photos and headline

**Best for:**
- Small-to-medium electronics
- Fashion / accessories
- Toys and small collectibles
- Items under $100

**Worst for:**
- Large or fragile items
- High-value items requiring authentication
- Items that need detailed descriptions

## Craigslist — The Cash Local Transaction

**Who shops here:**
- Cash-only buyers
- Tradespeople looking for tools and equipment
- Scrap / parts buyers
- Older demographic that distrusts apps

**Buyer behavior:**
- Negotiates aggressively
- Wants pickup
- Cash only, no traceability
- Faster than Facebook for some categories (vehicles, tools, building materials)

**Best for:**
- Vehicles and motorcycles
- Tools and equipment
- Building materials
- Free / scrap items
- Anonymous transactions

**Worst for:**
- Premium-priced items (Craigslist buyers expect bargains)
- Items requiring authentication or provenance
- Anything you'd want a paper trail on

## Specialty Platforms (Mention When Relevant)

- **1stDibs:** $1,000+ designer / antique items, white-glove delivery
- **Chairish:** Mid-century / modern designer furniture
- **Ruby Lane:** Antiques, jewelry, fine art (older buyer demographic)
- **Heritage Auctions:** $5,000+ rare collectibles
- **WorthPoint / LiveAuctioneers:** Auction-style for collectibles

## Recommendation Output Format

When recommending platforms, ALWAYS rank them by likely outcome:

**Recommended platforms (in order):**
1. **eBay** — best for $X-$Y range, expected sell time 2-3 weeks, fee ~13%
2. **Facebook Marketplace (local)** — backup for fast sale at 15% discount, 1 week
3. **Etsy** — only if you can stage / photograph beautifully, premium pricing possible

**NOT recommended:**
- Craigslist (item value too high for that buyer pool)
- Mercari (item too large for mobile buyer base)

Always justify WHY each platform fits or doesn't. Generic "list on eBay" is amateur output.
