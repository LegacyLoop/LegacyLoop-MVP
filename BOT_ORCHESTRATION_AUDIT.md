# DOWNSTREAM BOT DATA CONSUMPTION AUDIT
## Complete Fan-Out Orchestration Analysis

---

## BOT 1: PRICEBOT
**File:** `/Users/ryanhallee/legacy-loop-mvp/app/api/bots/pricebot/[itemId]/route.ts` (687 lines)

### Prisma Query Pattern
```
item = await prisma.item.findUnique({
  where: { id: itemId },
  include: {
    aiResult: true,
    valuation: true,
    antiqueCheck: true,
    photos: { orderBy: { order: "asc" }, take: 6 }
  }
});
```

### AiResult Fields Consumed (from rawJson)
- `item_name` (fallback: item.title)
- `category` (required, no fallback)
- `material`
- `era`
- `condition_score` (default: 7)
- `value_drivers` (array)
- `comparable_description`
- `completeness`
- `estimated_value_low` (fallback if no valuation)
- `estimated_value_mid`
- `estimated_value_high`
- `keywords`
- `best_platforms`

### Valuation Fields Consumed
- `valuation.low`, `valuation.high`, `valuation.mid` (required, causes 400 if missing)
- `valuation.rationale`

### AntiqueCheck Fields Consumed
- `antiqueCheck.isAntique` (boolean flag)

### Re-derivation / Re-scanning
- NO image re-scanning
- NO re-derivation of analyzed fields
- Uses Rainforest API separately (marketComp creation)
- Web search performed for comparable sales

### Data Saved to DB
- **EventLog**: `PRICEBOT_RESULT` (full result payload)
- **EventLog**: `PRICEBOT_RUN` (metadata)
- **MarketComp**: Creates entries with `comparable_sales` from web search

### Critical Issues Found
- NONE: Fields properly gated with fallbacks
- Valuation.mid computed fallback: `(low + high) / 2`

---

## BOT 2: LISTBOT
**File:** `/Users/ryanhallee/legacy-loop-mvp/app/api/bots/listbot/[itemId]/route.ts` (882 lines)

### Prisma Query Pattern
```
item = await prisma.item.findUnique({
  where: { id: itemId },
  include: {
    aiResult: true,
    valuation: true,
    antiqueCheck: true,
    photos: { orderBy: { order: "asc" }, take: 6 }
  }
});
```

### AiResult Fields Consumed (from rawJson)
- `item_name` (fallback: item.title)
- `category` (required)
- `subcategory`
- `material`
- `era` (fallback: `~${estimated_age_years} years old`)
- `style`
- `maker` (preferred) OR `brand`
- `condition_score` (default: 7)
- `recommended_title`
- `recommended_description`
- `best_platforms` (array)
- `photo_improvement_tips` (array)
- `shipping_difficulty`
- `shipping_notes`

### Valuation Fields Consumed
- `valuation.low`, `valuation.high`, `valuation.mid` (required)

### AntiqueCheck Fields Consumed
- `antiqueCheck.isAntique` (boolean, used for platform selection)

### Item Fields Consumed
- `item.title`, `item.description`, `item.saleZip`, `item.listingPrice` (user asking price)
- `item.condition` (fallback for condition)

### Re-derivation / Re-scanning
- NO image re-scanning
- NO re-derivation of analyzed fields
- Fetches BUYERBOT_RESULT separately for enrichment context
- Uses item.listingPrice as anchor (if set) instead of suggesting price

### Data Saved to DB
- **EventLog**: `LISTBOT_RESULT` (full multi-platform listing strategy)
- **EventLog**: `LISTBOT_RUN` (metadata)

### Critical Issues Found
- **FIELD MISMATCH**: Tries to access `ai.recommended_description` but Analyze Bot may output `description_recommendation`
- **PLATFORM LOGIC**: Etsy shipping_profile selection uses `ai.best_platforms` but may be null, causing undefined condition
- **PRICE ANCHOR**: If `item.listingPrice` is set, it overrides Valuation price guidance (this is correct behavior but creates coupling)

---

## BOT 3: PHOTOBOT ENHANCE
**File:** `/Users/ryanhallee/legacy-loop-mvp/app/api/photobot/enhance/[itemId]/route.ts` (503 lines)

### Prisma Query Pattern
```
item = await prisma.item.findUnique({
  where: { id: itemId },
  include: {
    photos: { orderBy: { order: "asc" } },
    aiResult: true
  }
});
```

### AiResult Fields Consumed (from rawJson)
- `item_name` (fallback: item.title)
- `brand` (fallback: `manufacturer`)
- `category` (fallback: `item_type`)
- `condition` (fallback: `condition_grade`, then `condition_guess`)
- `color` (fallback: `primary_color`)
- `material` (fallback: `materials`)
- `estimated_age` (fallback: `year`, `decade`, `era`)
- `condition_details` (fallback: `condition_description`, `wear_description`)
- `is_antique` (fallback: `antique_alert`)
- `is_vehicle` (fallback: `vehicle_type`)

### Valuation Fields Consumed
- NONE (PhotoBot is image-focused, not valuation-focused)

### AntiqueCheck Fields Consumed
- NONE

### Re-derivation / Re-scanning
- **YES - FULL RE-SCAN**: Calls GPT-4O Vision on the actual photo
- Enrichment context from AiResult is used to guide assessment
- Generates new assessments: `physicalDescription`, `exactCount`, `colorDescription`, `surfaceDetails`, etc.
- Condition authenticity is ENFORCED: "NEVER suggest hiding, minimizing, smoothing condition details"

### Data Saved to DB
- **EventLog**: `PHOTOBOT_ENHANCE` (assessment + URLs)
- **EventLog**: `PHOTOBOT_ASSESS` (assessment-only mode)
- **EventLog**: `PHOTOBOT_ENHANCE_VARIATION` (from MegaBot)
- **ItemPhoto**: New records for edited/generated photos

### Critical Issues Found
- NONE: PhotoBot properly gates on aiResult enrichment
- Clear fallback chain for all AI fields
- Does NOT overwrite item.condition; uses it only as fallback

---

## BOT 4: PHOTOBOT EDIT
**File:** `/Users/ryanhallee/legacy-loop-mvp/app/api/photobot/edit/[itemId]/route.ts` (379 lines)

### Prisma Query Pattern
```
item = await prisma.item.findUnique({
  where: { id: itemId },
  include: { aiResult: true }
});
photo = await prisma.itemPhoto.findUnique({ where: { id: photoId } });
```

### AiResult Fields Consumed (from rawJson)
- `item_name` (optional enrichment)
- `category`
- `brand`
- `material`
- `condition_guess`
- `era`

### Valuation Fields Consumed
- NONE

### AntiqueCheck Fields Consumed
- NONE

### Re-derivation / Re-scanning
- **YES - VISION + MASKING**: Calls GPT-4O Vision to detect item bounding box and distracting elements
- Uses DALL-E 2 image edit (not DALL-E 3)
- Enrichment context is optional (non-blocking)

### Data Saved to DB
- **EventLog**: `PHOTOBOT_EDIT` (vision results + edit URL)
- **ItemPhoto**: New record for edited photo

### Critical Issues Found
- NONE: Handles enrichment optionally

---

## BOT 5: MEGABOT
**File:** `/Users/ryanhallee/legacy-loop-mvp/app/api/megabot/[itemId]/route.ts` (387 lines)

### Prisma Query Pattern
```
item = await prisma.item.findUnique({
  where: { id: itemId },
  include: {
    photos: { orderBy: { order: "asc" }, take: 6 },
    aiResult: true,
    valuation: true,
    antiqueCheck: true
  }
});
```

### AiResult Fields Consumed (from rawJson)
- `item_name`
- `category`
- `subcategory`
- `material`
- `era`
- `style`
- `brand`
- `maker`
- `markings`
- `condition_score` (default: 7)
- `condition_details`
- `estimated_value_low`
- `estimated_value_mid`
- `estimated_value_high`
- `keywords` (array join)
- `is_collectible`
- `is_antique`
- `is_vehicle`
- `vehicle_year`, `vehicle_make`, `vehicle_model`, `vehicle_mileage`
- `dimensions_estimate`
- `weight_estimate_lbs`
- `estimated_age_years`
- `best_platforms`
- `recommended_title`
- `shipping_difficulty`
- `shipping_notes`
- `country_of_origin`

### Valuation Fields Consumed
- `valuation.low`, `valuation.high`, `valuation.mid` (computed fallback: (low+high)/2)
- `valuation.rationale`

### AntiqueCheck Fields Consumed
- `antiqueCheck.isAntique`
- `antiqueCheck.auctionLow`, `antiqueCheck.auctionHigh`

### Item Fields Consumed
- `item.title`, `item.description`, `item.saleZip`, `item.saleMethod`, `item.saleRadiusMi`, `item.listingPrice`

### Re-derivation / Re-scanning
- **YES - PHOTO-BASED**: Passes first photo (only) to specialized bot handlers
- NO field re-derivation for most bots
- **EXCEPTION - ANALYZEBOT**: When `botType="analyzebot"`, MegaBot runs 4 AI providers and cascades strong consensus back to AiResult

### Data Saved to DB
- **EventLog**: `MEGABOT_{BOTTYPE}` (e.g., `MEGABOT_PRICEBOT`, `MEGABOT_ANALYZEBOT`)
- **EventLog**: `MEGABOT_CASCADE` (if analyzebot consensus >= 70% agreement and cascades fields)
- **EventLog**: `MEGABOT_ALIGNMENT_FLAG` (if pricebot vs megabot deviation > 15%)
- **Item**: `megabotUsed = true`
- **AiResult**: Updates rawJson if MegaBot analyzebot consensus is strong

### Critical Issues Found
- **CASCADE LOGIC**: If MegaBot analyzebot has > 70% agreement, it updates AiResult with consensus fields
  - Fields cascaded: `is_antique`, `is_collectible`, deep knowledge fields (product_history, maker_history, construction_analysis, etc.)
  - **RISK**: Creates a different "source of truth" than AnalyzeBot, may cause audit trails to diverge
- **PRICEBOT ALIGNMENT CHECK**: Compares PriceBot vs MegaBot pricebot consensus, flags if > 20% deviation
- **PHOTO LIMIT**: Only passes first 6 photos to MegaBot (truncation at take:6)

---

## BOT 6: BUYERBOT
**File:** `/Users/ryanhallee/legacy-loop-mvp/app/api/bots/buyerbot/[itemId]/route.ts` (928 lines)

### Prisma Query Pattern
```
item = await prisma.item.findUnique({
  where: { id: itemId },
  include: {
    aiResult: true,
    valuation: true,
    antiqueCheck: true,
    photos: { orderBy: { order: "asc" }, take: 6 }
  }
});
```

### AiResult Fields Consumed (from rawJson)
- `item_name`
- `category`
- `material`
- `era`
- `condition_score`
- `keywords` (OR `best_keywords`)
- `best_platforms` (array)
- `brand`
- `maker`
- `is_vehicle` (derived: `category.toLowerCase().includes("vehicle")`)
- `is_antique` (derived: `antiqueCheck.isAntique`)

### Valuation Fields Consumed
- `valuation.low`, `valuation.high`, `valuation.mid` (required)

### AntiqueCheck Fields Consumed
- `antiqueCheck.isAntique`

### Re-derivation / Re-scanning
- NO image re-scanning (uses first photo for context only)
- Performs WEB SEARCH for Reddit WTB posts, Facebook groups, Instagram community
- Fetches enrichment context via cross-bot system

### Data Saved to DB
- **EventLog**: `BUYERBOT_RESULT` (outreach strategies + communities)
- **EventLog**: `BUYERBOT_RUN` (metadata)

### Critical Issues Found
- **KEYWORDS FALLBACK**: Uses `ai.keywords` OR `ai.best_keywords` (inconsistent naming)
- **OPTIONAL VALUATION**: Requires `valuation` to exist; no fallback to AiResult estimates
- **REDDIT CONTEXT**: Fetches real Reddit WTB posts; requires working web search integration

---

## BOT 7: RECONBOT
**File:** `/Users/ryanhallee/legacy-loop-mvp/app/api/bots/reconbot/[itemId]/route.ts` (703 lines)

### Prisma Query Pattern
```
item = await prisma.item.findUnique({
  where: { id: itemId },
  include: {
    aiResult: true,
    valuation: true,
    antiqueCheck: true,
    photos: { orderBy: { order: "asc" }, take: 6 }
  }
});
```

### AiResult Fields Consumed (from rawJson)
- `item_name`
- `category`
- `material`
- `era`
- `condition_score`
- `brand`
- `maker`
- `best_platforms`
- `is_antique` (from antiqueCheck.isAntique)

### Valuation Fields Consumed
- `valuation.low`, `valuation.high`, `valuation.mid` (required)

### AntiqueCheck Fields Consumed
- `antiqueCheck.isAntique`

### Re-derivation / Re-scanning
- NO image re-scanning
- Performs COMPETITIVE ANALYSIS via web search
- Generates fake (realistic) competitor listings for eBay, Facebook, Craigslist, Mercari, etc.
- Uses Amazon price range from RAINFOREST_RESULT event log if available

### Data Saved to DB
- **EventLog**: `RECONBOT_RESULT` (competitive landscape analysis)
- **EventLog**: `RECONBOT_RUN` (metadata)

### Critical Issues Found
- **OPTIONAL RAINFOREST**: Tries to fetch `RAINFOREST_RESULT` but gracefully continues if missing
- **CONDITION LEVERAGE**: Extracts condition score for competitive advantage messaging

---

## BOT 8: ANTIQUEBOT
**File:** `/Users/ryanhallee/legacy-loop-mvp/app/api/bots/antiquebot/[itemId]/route.ts` (764 lines)

### Prisma Query Pattern
```
item = await prisma.item.findUnique({
  where: { id: itemId },
  include: {
    aiResult: true,
    valuation: true,
    antiqueCheck: true,
    photos: { orderBy: { order: "asc" }, take: 6 }
  }
});
```

### AiResult Fields Consumed (from rawJson)
- `item_name`
- `category`
- `material`
- `era`
- `condition_score`
- `brand`
- `maker`
- `markings`
- `style`
- `keywords`

### Valuation Fields Consumed
- `valuation.low`, `valuation.high` (required)

### AntiqueCheck Fields Consumed
- `antiqueCheck.isAntique` (should be true for this bot to run)
- `antiqueCheck.auctionLow`, `antiqueCheck.auctionHigh` (optional)

### Re-derivation / Re-scanning
- NO image re-scanning (uses photos for context only)
- Performs WEB SEARCH for auction comps, market intelligence
- Deep dives on: condition assessment, historical context, authentication, provenance, care instructions

### Data Saved to DB
- **EventLog**: `ANTIQUEBOT_RESULT` (comprehensive antique evaluation)
- **EventLog**: `ANTIQUEBOT_RUN` (metadata)

### Critical Issues Found
- **GUARD CLAUSE**: Only runs if item is marked as antique; otherwise 400 error
- **OPTIONAL VALUATION**: Falls back to estimated values if valuation missing
- **MARKET INTEL**: Pulls from getMarketIntelligence() for auction comparables

---

## BOT 9: COLLECTIBLESBOT
**File:** `/Users/ryanhallee/legacy-loop-mvp/app/api/bots/collectiblesbot/[itemId]/route.ts` (698 lines)

### Prisma Query Pattern
```
item = await prisma.item.findUnique({
  where: { id: itemId },
  include: {
    aiResult: true,
    valuation: true,
    photos: { orderBy: { order: "asc" }, take: 6 }
  }
});
```
**NOTE**: Does NOT include `antiqueCheck`

### AiResult Fields Consumed (from rawJson)
- `item_name`
- `category`
- `condition_score`
- `material`
- `era`
- `brand`
- `maker`
- `keywords`

### Valuation Fields Consumed
- `valuation.low`, `valuation.high` (required)

### AntiqueCheck Fields Consumed
- NONE

### Re-derivation / Re-scanning
- NO image re-scanning
- Performs SPECIALTY MARKET RESEARCH (PriceCharting for cards, Discogs for records, Heritage for art, etc.)
- Category detection: cards, watches, jewelry, books, sneakers, minerals, coins
- Creates specialized valuation tiers (ungraded vs graded at PSA 6/7/8/10)

### Data Saved to DB
- **EventLog**: `COLLECTIBLESBOT_RESULT` (grading recommendations, specialty valuations)
- **EventLog**: `COLLECTIBLESBOT_RUN` (metadata)
- **PriceSnapshot**: Creates entry with market-adjusted values (fire-and-forget)

### Critical Issues Found
- **NO ANTIQUECHECK RELATION**: Doesn't check antiqueCheck, even though collectibles may be antiques
- **GRADING LOGIC**: Assumes certain categories need grading (cards, coins) and provides premium valuations
- **PRICECHARTING OVERRIDE**: If PriceCharting data found, uses it as "PRIMARY valuation anchor"

---

## BOT 10: SHIPBOT
**File:** `/Users/ryanhallee/legacy-loop-mvp/app/api/bots/shipbot/[itemId]/route.ts` (79 lines)

### Prisma Query Pattern
```
item = await prisma.item.findUnique({ where: { id: itemId } });
```
**MINIMAL QUERY**: Only checks ownership, no relations

### AiResult Fields Consumed
- NONE

### Valuation Fields Consumed
- NONE

### AntiqueCheck Fields Consumed
- NONE

### Re-derivation / Re-scanning
- NO: Returns demo/hardcoded result
- **NOT FULLY IMPLEMENTED**: This is a stub (demo mode only)

### Data Saved to DB
- **EventLog**: `SHIPBOT_RESULT` (hardcoded demo result)

### Critical Issues Found
- **STUB IMPLEMENTATION**: Demo mode only, no real shipping logic
- **NO DATA ENRICHMENT**: Doesn't use aiResult for weight/dimensions
- **MISSING LOGIC**: Should query for item dimensions, weight, fragility from AiResult

---

## BOT 11: STYLEBOT
**File:** `/Users/ryanhallee/legacy-loop-mvp/app/api/bots/stylebot/[itemId]/route.ts` (94 lines)

### Prisma Query Pattern
```
item = await prisma.item.findUnique({ where: { id: itemId } });
```
**MINIMAL QUERY**: Only checks ownership, no relations

### AiResult Fields Consumed
- NONE

### Valuation Fields Consumed
- NONE

### AntiqueCheck Fields Consumed
- NONE

### Re-derivation / Re-scanning
- NO: Returns demo/hardcoded result

### Data Saved to DB
- **EventLog**: `STYLEBOT_RESULT` (hardcoded demo result)

### Critical Issues Found
- **STUB IMPLEMENTATION**: Demo mode only, no real logic
- **NO DATA ENRICHMENT**: Should use aiResult.condition_score, category, era for styling tips

---

## BOT 12: VIDEOBOT
**File:** `/Users/ryanhallee/legacy-loop-mvp/app/api/bots/videobot/[itemId]/route.ts` (241 lines)

### Prisma Query Pattern
```
item = await prisma.item.findUnique({
  where: { id: itemId },
  include: {
    aiResult: true,
    valuation: true,
    photos: { orderBy: { order: "asc" }, take: 6 }
  }
});
```
**NOTE**: Does NOT include `antiqueCheck`

### AiResult Fields Consumed (from rawJson)
- `item_name`
- `category`
- `material`
- `era`
- `condition_score` (default: 7)
- `photo_quality_score` (optional)
- `maker` (preferred) OR `brand`

### Valuation Fields Consumed
- `valuation.low`, `valuation.high` (required, returns 400 if missing)

### AntiqueCheck Fields Consumed
- NONE

### Re-derivation / Re-scanning
- **YES - PIPELINE**: Runs full video generation pipeline
- Uses photos (first 6) + enrichment context + market intelligence
- Generates TikTok/Instagram ad scripts with narration

### Data Saved to DB
- **EventLog**: `VIDEOBOT_RESULT` (script + video URL + narration)
- **EventLog**: `VIDEOBOT_RUN` (metadata)

### Critical Issues Found
- **REQUIRES VALUATION**: Returns 400 if valuation doesn't exist (unlike buyerbot which could fallback)
- **ENRICHMENT OPTIONAL**: Cross-bot enrichment is non-blocking (catch/null)
- **MARKET INTEL OPTIONAL**: Market intelligence fallback with null check

---

## BOT 13: CARBOT
**File:** `/Users/ryanhallee/legacy-loop-mvp/app/api/bots/carbot/[itemId]/route.ts` (731 lines)

### Prisma Query Pattern
```
item = await prisma.item.findUnique({
  where: { id: itemId },
  include: {
    aiResult: true,
    valuation: true,
    photos: { orderBy: { order: "asc" }, take: 6 }
  }
});
```
**NOTE**: Does NOT include `antiqueCheck`

### AiResult Fields Consumed (from rawJson)
- `item_name`
- `category`
- `condition_score`
- `vehicle_year` (fallback: aiData from lookup OR "Unknown")
- `vehicle_make`
- `vehicle_model`
- `vehicle_mileage`
- `era`
- `material`
- `brand`

### Valuation Fields Consumed
- `valuation.low`, `valuation.high` (required)

### AntiqueCheck Fields Consumed
- NONE

### Re-derivation / Re-scanning
- **YES - VISION + VIN EXTRACTION**: Calls GPT-4O Vision on photos
- Extracts VIN from dashboard, door jamb, engine bay
- Performs VIN decode via NHTSA API
- Looks for odometer reading in photos
- **SPECIALIZED**: Fetches VEHICLE_DATA event log for additional context

### Data Saved to DB
- **EventLog**: `CARBOT_RESULT` (comprehensive vehicle evaluation)
- **EventLog**: `CARBOT_RUN` (metadata)
- **PriceSnapshot**: Creates entry with private party valuation (fire-and-forget)
- **EventLog**: `CARBOT_VIN_ANALYSIS` (optional, if VIN found)

### Critical Issues Found
- **VIN EXTRACTION REQUIRED**: Tries hard to extract VIN from photos; empty VIN_from_photo if not found
- **VEHICLE DATA LOOKUP**: Fetches separate VEHICLE_DATA event log (created by different pipeline)
- **MILEAGE PARSING**: Requires extracting miles from photos or seller input
- **NO ANTIQUECHECK**: Even classic cars (< 1990) don't use antiqueCheck, treated as vehicles only

---

## CROSS-BOT FIELD MAPPING MATRIX

### Fields Sourced from AiResult.rawJson

| Field | PriceBot | ListBot | PhotoBot | MegaBot | BuyerBot | ReconBot | AntiqueBot | CollBot | VideoBot | CarBot |
|-------|----------|---------|----------|---------|----------|----------|------------|---------|----------|--------|
| item_name | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| category | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| material | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| era | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| condition_score | ✓ | ✓ | ✗ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| condition_details | ✗ | ✗ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| brand/maker | ✗ | ✓ | ✗ | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ | ✓ |
| estimated_value_* | ✓ | ✗ | ✗ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| keywords | ✓ | ✗ | ✗ | ✓ | ✓ | ✗ | ✓ | ✓ | ✗ | ✗ |
| best_platforms | ✗ | ✓ | ✗ | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ |
| recommended_title | ✗ | ✓ | ✗ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| vehicle_year/make/model | ✗ | ✗ | ✗ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✓ |
| shipping_difficulty | ✗ | ✓ | ✗ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| is_antique | ✗ | ✗ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| is_collectible | ✗ | ✗ | ✗ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |

### Fields Sourced from Valuation Table

| Field | PriceBot | ListBot | PhotoBot | MegaBot | BuyerBot | ReconBot | AntiqueBot | CollBot | VideoBot | CarBot |
|-------|----------|---------|----------|---------|----------|----------|------------|---------|----------|--------|
| low | ✓ | ✓ | ✗ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| high | ✓ | ✓ | ✗ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| mid | ✓ | ✓ | ✗ | ✓ | ✓ | ✓ | ✗ | ✓ | ✓ | ✓ |
| rationale | ✓ | ✗ | ✗ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |

### Fields Sourced from AntiqueCheck Table

| Field | PriceBot | ListBot | PhotoBot | MegaBot | BuyerBot | ReconBot | AntiqueBot | CollBot | VideoBot | CarBot |
|-------|----------|---------|----------|---------|----------|----------|------------|---------|----------|--------|
| isAntique | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ |
| auctionLow | ✗ | ✗ | ✗ | ✓ | ✗ | ✗ | ✓ | ✗ | ✗ | ✗ |
| auctionHigh | ✗ | ✗ | ✗ | ✓ | ✗ | ✗ | ✓ | ✗ | ✗ | ✗ |

---

## CRITICAL FINDINGS

### 1. FIELD MAPPING CONSISTENCY ISSUES

#### Missing Fields in Downstream Consumers
- **ListBot**: Uses `ai.recommended_description` (may be `description_recommendation` from AnalyzeBot)
- **PhotoBot**: Uses `condition_details` via fallback chain but AnalyzeBot may output `condition_description`
- **CollectiblesBot**: No antiqueCheck relation loaded, but may need it for high-value rare items
- **VideoBot**: No antiqueCheck loaded despite needing it to determine if video should emphasize antique/collectible status

#### Optional Dependencies (Non-blocking)
- **ReconBot**: Gracefully handles missing RAINFOREST_RESULT
- **BuyerBot**: Optional enrichment context via cross-bot system
- **VideoBot**: Optional market intelligence and enrichment

### 2. VALUATION GATE INCONSISTENCIES

**HARD REQUIREMENT (400 error if missing):**
- PriceBot, ListBot, BuyerBot, VideoBot

**SOFT REQUIREMENT (fallback to aiResult):**
- ReconBot, AntiqueBot, CollectiblesBot

**OPTIONAL (no requirement):**
- PhotoBot, MegaBot (per-bot), CarBot

**ISSUE**: If AnalyzeBot fails to generate valuation, different bots behave differently:
- PriceBot, ListBot block completely
- Others degrade gracefully

### 3. IMAGE RE-SCANNING BOTS

Bots that re-scan images and may produce DIFFERENT results than AnalyzeBot:
1. **PhotoBot Enhance** (GPT-4O Vision → assessment fields)
2. **PhotoBot Edit** (GPT-4O Vision → bounding box + distracting elements)
3. **MegaBot** (when botType != analyzebot, uses first photo only)
4. **CarBot** (GPT-4O Vision + NHTSA VIN decode)

**RISK**: Physical descriptions from PhotoBot may contradict AnalyzeBot's condition_details

### 4. CASCADING UPDATES

**MegaBot Cascade (ANALYZEBOT ONLY):**
- If MegaBot analyzebot consensus >= 70% agreement, updates AiResult.rawJson directly
- Fields cascaded: is_antique, is_collectible, product_history, maker_history, construction_analysis, etc.
- Creates audit trail divergence: EventLog shows both ANALYZE_BOT and MEGABOT_ANALYZEBOT + MEGABOT_CASCADE

**ISSUE**: Two bots can claim authority over the same fields (condition_score, antique status)

### 5. MISSING OR STUB IMPLEMENTATIONS

- **ShipBot**: Completely stubbed, returns demo hardcoded result
- **StyleBot**: Completely stubbed, returns demo hardcoded result
- **Both should consume**: item weight, dimensions, fragility from AiResult

### 6. PHOTO TRUNCATION

**Photo Limit**: Bots take first 6 photos only (take: 6)
- MegaBot passes only first photo to specialized bots
- PhotoBot, CarBot, VideoBot work with 6-photo limit

**RISK**: Multi-photo insights from AnalyzeBot may not apply if AnalyzeBot analyzed full photo set

### 7. ENRICHMENT CONTEXT CHAINS

**Cross-bot Data Fetching:**
- ListBot fetches BUYERBOT_RESULT (optional enrichment)
- MegaBot fetches RAINFOREST_RESULT (optional enrichment)
- VideoBot fetches enrichment context + market intelligence (non-blocking)
- BuyerBot fetches enrichment + Reddit context (non-blocking)

**RISK**: Circular dependencies if bots trigger each other

### 8. FIELD NAME VARIATIONS IN RESPONSES

Bots normalize responses with different field names:
- `item_name` vs `itemName` vs `name`
- `condition_score` vs `conditionScore` vs `overall_score`
- `estimated_value_low` vs `price_low` vs `priceLow`

**MegaBot's formatAgentForClient** has extensive fallback chain to handle this, but direct bot consumers may fail on case mismatches

---

## RECOMMENDATIONS

1. **Enforce Field Contracts**: Document which AiResult fields are REQUIRED vs OPTIONAL for each bot
2. **Add AntiqueCheck Load**: LoadantiqueCheck in CollectiblesBot, VideoBot queries
3. **Implement ShipBot/StyleBot**: Add real logic using AiResult.weight_estimate_lbs, dimensions_estimate, condition_score
4. **Audit Field Names**: Standardize on snake_case for AiResult.rawJson fields across all bots
5. **Reduce Photo Truncation**: Consider passing all photos to bots that benefit from multi-angle analysis
6. **Document Cascades**: Make MegaBot cascade behavior explicit in Item.metadata or separate audit table
7. **Add Fallback Chain**: For ListBot's `recommended_description`, add fallback: `ai.recommended_description || ai.description_recommendation || ai.description`

---

END OF AUDIT
