import fs from "fs";
import path from "path";
import OpenAI from "openai";
import type { AiAnalysis } from "../types";

function publicUrlToAbsolutePath(publicUrl: string) {
  const clean = publicUrl.startsWith("/") ? publicUrl.slice(1) : publicUrl;
  return path.join(process.cwd(), "public", clean);
}

function guessMime(absPath: string) {
  const ext = path.extname(absPath).toLowerCase();
  if (ext === ".png") return "image/png";
  if (ext === ".webp") return "image/webp";
  return "image/jpeg";
}

function fileToDataUrl(absPath: string) {
  const mime = guessMime(absPath);
  const base64 = fs.readFileSync(absPath, "base64");
  return `data:${mime};base64,${base64}`;
}

const openai =
  process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.length > 10
    ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    : null;

// Structured JSON schema for the AI response — must match AiAnalysis interface
const ANALYSIS_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    // ── Identification ───────────────────────────────────────────────────
    item_name: {
      type: "string",
      description:
        "Highly specific identification. BAD: 'wooden chair'. GOOD: 'American oak Windsor-style spindle-back side chair, circa 1920s-1940s'",
    },
    category: { type: "string", description: "Primary category (Furniture, Electronics, Jewelry, Art, Kitchenware, Clothing, Tools, Toys, Books, Sports, Musical Instruments, Collectibles, Outdoor Equipment, Vehicles, Vehicle Parts, Other). CRITICAL CLASSIFICATION RULE: Lawn mowers (riding or push), garden tractors (John Deere, Husqvarna, Cub Cadet, Troy-Bilt, Craftsman, Toro), chainsaws, leaf blowers, pressure washers, snow blowers, log splitters, wood chippers, generators, and ALL garden/lawn/outdoor power equipment MUST be categorized as 'Outdoor Equipment' — NEVER as 'Vehicles' — even if they have engines, wheels, seats, or steering wheels. The 'Vehicles' category is EXCLUSIVELY for road-legal motor vehicles: cars, trucks, SUVs, vans, motorcycles, boats, ATVs, RVs, campers, and motorhomes. If it mows grass, blows leaves, or cuts wood — it is 'Outdoor Equipment'. If it drives on roads — it is 'Vehicles'." },
    subcategory: { type: ["string", "null"], description: "Subcategory for more specificity (e.g. 'Side Chair' under Furniture, 'Wristwatch' under Jewelry). null if not applicable." },
    brand: { type: ["string", "null"], description: "Brand, maker, or manufacturer if identifiable. null if truly unknown." },
    model: { type: ["string", "null"], description: "Specific model name/number if visible or identifiable. null if unknown." },
    maker: { type: ["string", "null"], description: "Artisan, craftsperson, factory, or manufacturing company if different from brand. null if unknown." },
    material: { type: ["string", "null"], description: "Primary materials: wood type (oak, mahogany, pine), metal (brass, sterling silver, cast iron), fabric (wool, silk, cotton), ceramic, glass, plastic, etc." },
    era: { type: ["string", "null"], description: "Approximate era/decade: '1920s-1930s', 'mid-century 1950s-1960s', 'circa 1880', 'modern 2010s', etc." },
    style: { type: ["string", "null"], description: "Design style: Victorian, Art Deco, Mid-Century Modern, Craftsman, Colonial, Industrial, Rustic, Contemporary, etc." },
    country_of_origin: { type: ["string", "null"], description: "Country of origin or manufacture if identifiable. null if unknown." },
    markings: { type: ["string", "null"], description: "Any visible labels, stamps, maker's marks, signatures, serial numbers, tags, stickers. null if none visible." },
    dimensions_estimate: { type: ["string", "null"], description: "Estimated dimensions in inches as 'L x W x H' format (e.g. '5 x 3 x 2' for a guitar pedal, '34 x 24 x 30' for a rocking chair). Be realistic based on what you see. null if cannot estimate." },
    completeness: { type: ["string", "null"], description: "'Complete set', 'Complete with original packaging', 'Partial set - missing lid', 'Single piece from larger set', 'All parts present'. null if not applicable." },

    // ── Condition ────────────────────────────────────────────────────────
    condition_guess: { type: "string", description: "One of: Mint, Near Mint, Excellent, Very Good, Good, Fair, Below Average, Poor, Damaged, Parts Only" },
    condition_score: { type: "number", description: "Overall condition 1-10. 10=mint/new, 8=excellent, 6=good, 4=below average, 2=damaged, 1=parts only" },
    condition_cosmetic: { type: "number", description: "Cosmetic/appearance grade 1-10 based on visible scratches, chips, stains, patina, wear, fading, discoloration" },
    condition_functional: { type: "number", description: "Functional grade 1-10. 10=works perfectly, 7=minor issues, 4=needs repair, 1=non-functional. If cannot assess from photo, default to condition_score." },
    condition_details: { type: "string", description: "Specific observations: 'light scratching on top surface, minor scuffing on legs, one small chip on back left corner, original finish intact with age-appropriate patina'" },
    visible_issues: { type: "array", items: { type: "string" }, description: "List of specific visible problems: scratches, chips, stains, cracks, missing parts. Empty array if none." },
    positive_notes: { type: "array", items: { type: "string" }, description: "Positive condition observations: 'original finish intact', 'no structural damage', 'all hardware present'. Empty array if none." },
    restoration_potential: { type: ["string", "null"], description: "Brief note on restoration potential if applicable: 'Could be refinished to excellent condition', 'Missing parts would be expensive to replace'. null if not applicable." },

    // ── Pricing ──────────────────────────────────────────────────────────
    estimated_value_low: { type: ["number", "null"], description: "Low end of fair market value in USD for US secondhand resale (2024-2025 pricing). Consider condition, completeness, and typical sell-through. null if truly unable to estimate." },
    estimated_value_mid: { type: ["number", "null"], description: "Most likely sale price in USD. null if unable to estimate." },
    estimated_value_high: { type: ["number", "null"], description: "High end / best case in USD (perfect buyer, great listing). null if unable to estimate." },
    pricing_confidence: { type: ["number", "null"], description: "How confident in the price estimate (0-100). Under 40 means very uncertain. null if no estimate." },
    pricing_rationale: { type: ["string", "null"], description: "Brief explanation of how you arrived at this price. Reference comparable sales if possible. null if no estimate." },
    comparable_description: { type: ["string", "null"], description: "Description of comparable items you are basing the price on: 'Similar Rolex Datejust models in this condition sell for $4,000-$6,000 on eBay'. null if none." },
    value_drivers: { type: "array", items: { type: "string" }, description: "What makes this item valuable (or not): 'Recognized brand', 'Rare model year', 'Poor condition reduces value significantly'. Empty array if none." },

    // ── Antique Detection ────────────────────────────────────────────────
    is_antique: { type: ["boolean", "null"], description: "Is this item likely an antique (50+ years old) or vintage collectible? null if insufficient data." },
    estimated_age_years: { type: ["number", "null"], description: "Estimated age in years (e.g. 85 for an item from ~1940). null if cannot estimate." },
    antique_markers: { type: "array", items: { type: "string" }, description: "Evidence for antique status: 'hand-forged hardware', 'pre-1950 construction methods', 'patina consistent with 80+ years'. Empty array if not antique." },
    appraisal_recommended: { type: ["boolean", "null"], description: "Should the seller get a professional appraisal? true if item may have significant hidden value. null if not applicable." },
    potential_value_if_authenticated: { type: ["number", "null"], description: "If professionally appraised/authenticated, estimated high-end value in USD. null if appraisal not relevant." },

    // ── Listing Suggestions ──────────────────────────────────────────────
    recommended_title: { type: ["string", "null"], description: "Optimized listing title for eBay/Facebook Marketplace (max 80 chars, include key searchable terms). null if unable." },
    recommended_description: { type: ["string", "null"], description: "2-3 sentence listing description highlighting key selling points. null if unable." },
    best_platforms: { type: "array", items: { type: "string" }, description: "Best platforms to sell this item: 'eBay', 'Facebook Marketplace', 'Etsy', 'Craigslist', 'Poshmark', 'Ruby Lane', 'Chairish', etc. Ordered by fit." },

    // ── Photo Quality ────────────────────────────────────────────────────
    photo_quality_score: { type: ["number", "null"], description: "Photo quality score 1-10. 10=professional studio shots, 7=good natural light, 4=blurry/dark, 1=nearly unusable. null if cannot assess." },
    photo_improvement_tips: { type: "array", items: { type: "string" }, description: "Specific tips to improve photos: 'Add a close-up of the maker\'s mark on the bottom', 'Use natural light to reduce glare'. Empty array if photos are good." },

    // ── General ──────────────────────────────────────────────────────────
    summary: { type: "string", description: "A 2-4 sentence plain-English verbal summary of your overall assessment. Cover: what the item is, its condition, approximate value range, and your top recommendation (sell locally, ship nationally, get appraised, or donate). Write as if speaking directly to the seller. Example: 'This is a 1960s Omega Seamaster in good working condition with moderate cosmetic wear. Based on recent sales, I estimate it is worth $800-$1,200. I recommend listing on eBay where watch collectors actively search for vintage Omega pieces. The original dial and movement are the key value drivers here.'" },
    keywords: { type: "array", items: { type: "string" }, maxItems: 15, description: "Search keywords a buyer would use: include brand, material, era, style, specific terms" },
    notes: { type: "string", description: "Additional observations: rarity, collectibility, market demand, notable features, anything else relevant to valuation" },
    confidence: { type: "number", minimum: 0, maximum: 1, description: "How confident you are in the identification (0.0-1.0). Lower if photo is blurry, item is partially obscured, or identification is uncertain." },

    // ── Vehicle fields ───────────────────────────────────────────────────
    vehicle_year: { type: ["string", "null"], description: "If this is a vehicle, the model year (e.g. '2008'). null if not a vehicle." },
    vehicle_make: { type: ["string", "null"], description: "If this is a vehicle, the manufacturer (e.g. 'Ford', 'Toyota'). null if not a vehicle." },
    vehicle_model: { type: ["string", "null"], description: "If this is a vehicle, the model name (e.g. 'F-150', 'Camry'). null if not a vehicle." },
    vehicle_mileage: { type: ["string", "null"], description: "If visible on odometer, the mileage reading. null if not visible or not a vehicle." },
    vin_visible: { type: ["boolean", "null"], description: "Whether a VIN number is visible in any photo. null if not a vehicle." },

    // ── Shipping & Weight ────────────────────────────────────────────────
    weight_estimate_lbs: { type: ["number", "null"], description: "Estimated weight in pounds. Be realistic: a guitar pedal weighs 0.5-1.5 lbs, a wooden rocking chair weighs 20-30 lbs, a cast iron skillet weighs 5-8 lbs. null if cannot estimate." },
    shipping_difficulty: { type: ["string", "null"], description: "One of: Easy (small/light, standard box), Moderate (medium size, needs padding), Difficult (large/heavy/fragile, special packing), Freight only (too large for parcel carriers). null if unclear." },
    shipping_notes: { type: ["string", "null"], description: "Specific packing and shipping advice: recommended box type, packing materials, fragility concerns, carrier suggestions. null if not applicable." },

    // ── Regional Pricing Intelligence ────────────────────────────────────
    regional_best_city: { type: ["string", "null"], description: "The SPECIFIC US city where this item commands the highest price. Must be ITEM-SPECIFIC: guitar gear → Nashville or Austin, antique furniture → Boston or Philadelphia, vintage clothing → NYC or LA, surfboards → coastal California, cowboy boots → Dallas or Denver. Do NOT default to NYC for everything. null if no strong regional preference." },
    regional_best_state: { type: ["string", "null"], description: "State abbreviation for regional_best_city (e.g. 'TN', 'MA', 'CA'). null if regional_best_city is null." },
    regional_best_price_low: { type: ["number", "null"], description: "Low-end price this item would fetch in the best market city. null if regional_best_city is null." },
    regional_best_price_high: { type: ["number", "null"], description: "High-end price this item would fetch in the best market city. null if regional_best_city is null." },
    regional_best_why: { type: ["string", "null"], description: "WHY this city is the best market for THIS specific item. Be specific: 'Nashville has the densest concentration of guitar players and music shops in the US, with active Reverb.com and local gear swap communities.' null if not applicable." },
    regional_local_demand: { type: ["string", "null"], description: "Market demand strength in the seller's area. One of: Strong, Average, Weak. Consider the item type vs the local buyer demographics. null if seller location unknown." },
    regional_local_reasoning: { type: ["string", "null"], description: "Why local demand is strong/average/weak for THIS item in THIS area. Be specific. null if seller location unknown." },
    regional_ship_or_local: { type: ["string", "null"], description: "Plain language verdict: should the seller ship to the best market or sell locally? Include real math if possible: 'Ship to Nashville — even after $8 shipping, you net $15 more than selling locally in rural Maine.' null if not enough data." },
  },
  required: [
    "item_name", "category", "subcategory", "brand", "model", "maker", "material", "era", "style",
    "country_of_origin", "markings", "dimensions_estimate", "completeness",
    "condition_guess", "condition_score", "condition_cosmetic", "condition_functional",
    "condition_details", "visible_issues", "positive_notes", "restoration_potential",
    "estimated_value_low", "estimated_value_mid", "estimated_value_high",
    "pricing_confidence", "pricing_rationale", "comparable_description", "value_drivers",
    "is_antique", "estimated_age_years", "antique_markers", "appraisal_recommended",
    "potential_value_if_authenticated",
    "recommended_title", "recommended_description", "best_platforms",
    "photo_quality_score", "photo_improvement_tips",
    "summary", "keywords", "notes", "confidence",
    "vehicle_year", "vehicle_make", "vehicle_model", "vehicle_mileage", "vin_visible",
    "weight_estimate_lbs", "shipping_difficulty", "shipping_notes",
    "regional_best_city", "regional_best_state", "regional_best_price_low", "regional_best_price_high",
    "regional_best_why", "regional_local_demand", "regional_local_reasoning", "regional_ship_or_local",
  ],
} as const;

export const aiAdapter = {
  async analyze(photoPaths: string[], context?: string): Promise<AiAnalysis> {
    // -------- MOCK fallback (only when no API key) --------
    if (!openai) {
      console.warn("[AI] No OPENAI_API_KEY set — returning MOCK data. Set the key in .env for real analysis.");
      return {
        item_name: "American Oak Pressed-Back Rocking Chair (Demo)",
        category: "Furniture",
        subcategory: "Rocking Chair",
        brand: null,
        model: null,
        maker: "Unknown American manufacturer",
        material: "Solid oak, cane seat",
        era: "1890s-1910s",
        style: "Victorian / Colonial Revival",
        country_of_origin: "United States",
        keywords: ["oak rocking chair", "pressed back", "antique rocker", "victorian", "cane seat", "estate sale", "vintage furniture", "american oak"],
        condition_guess: "Good",
        condition_score: 6,
        condition_cosmetic: 5,
        condition_functional: 7,
        condition_details: "Solid structural integrity, all spindles intact. Cane seat shows age-appropriate wear with one small area of fraying. Original finish has darkened with age, some ring marks on armrests. Rockers show expected wear patterns consistent with regular use over 100+ years.",
        visible_issues: ["Cane seat fraying in one area (approximately 2in x 1in)", "Ring marks on left armrest", "Original finish darkened and worn on arm tops", "Minor scratch on right rear leg"],
        positive_notes: ["All spindles intact and tight", "Pressed-back carving still crisp and well-defined", "Rockers show even wear (not warped)", "Structurally sound — no wobble"],
        restoration_potential: "Cane seat could be re-caned for $60-$100. Light sanding and fresh coat of oil would restore appearance significantly. Do NOT strip the original finish — patina adds value.",
        markings: null,
        dimensions_estimate: "Approximately 34in tall x 24in wide x 30in deep, seat height 17in",
        completeness: "Complete — all original components present",
        notes: "Demo analysis (set AI_PROVIDER=openai for real analysis). American pressed-back oak rockers from this era are common in New England estate sales. This example is in above-average condition for its age. The pressed-back carving pattern suggests a regional Maine or New Hampshire maker. These chairs have steady demand from both collectors and people wanting functional antique furniture.",
        confidence: 0.72,
        // Pricing
        estimated_value_low: 75,
        estimated_value_mid: 110,
        estimated_value_high: 165,
        pricing_confidence: 68,
        pricing_rationale: "Pressed-back oak rockers from the 1890s-1910s in good structural condition with original finish typically sell for $75-$165 in New England markets. Lower end for local estate sales, higher end for eBay/Etsy listings with good photos. Cane seat condition slightly reduces value vs a perfect example.",
        comparable_description: "Similar American oak pressed-back rockers sell for $80-$150 on eBay (sold listings, last 90 days). Facebook Marketplace in Maine shows $60-$120 for comparable chairs.",
        value_drivers: ["Genuine antique (100+ years)", "Solid oak construction", "Pressed-back carving intact", "Functional — can be used daily", "Steady collector demand in New England"],
        // Antique
        is_antique: true,
        estimated_age_years: 120,
        antique_markers: ["Pressed-back carving technique (pre-1920)", "Square-cut nails visible in construction", "Hand-turned spindles with slight irregularities", "Cane seat weave pattern consistent with late 1800s", "Oak grain pattern and aging consistent with 100+ year old American white oak"],
        appraisal_recommended: false,
        potential_value_if_authenticated: null,
        // Listing
        recommended_title: "Antique American Oak Pressed-Back Rocking Chair 1890s Cane Seat Victorian",
        recommended_description: "Beautiful antique American oak pressed-back rocking chair from the 1890s-1910s. Solid construction with all original spindles intact and crisp carved splat. Cane seat shows minor wear. Perfect for a living room, nursery, or porch. Structurally sound and ready to use.",
        best_platforms: ["Facebook Marketplace", "eBay", "Etsy", "Craigslist", "Uncle Henry's"],
        // Photo
        photo_quality_score: 6,
        photo_improvement_tips: ["Photograph in natural daylight near a window", "Add a close-up of the pressed-back carving detail", "Show the cane seat condition from above", "Include a photo of the rocker bottoms to show wear pattern"],
        // Verbal summary
        summary: "This is a genuine American oak pressed-back rocking chair from the 1890s-1910s in good overall condition with age-appropriate wear. Based on recent estate sale and online market data, I estimate it's worth $75-$165. I'd recommend listing on Facebook Marketplace first for local pickup (avoids shipping a bulky item), and if it doesn't sell within 2 weeks, try eBay or Etsy where antique furniture collectors browse regularly.",
      };
    }

    if (!photoPaths[0]) throw new Error("No photo provided for analysis.");

    // Build image content for up to 6 photos
    const imageContent: any[] = photoPaths.slice(0, 6).map((p) => ({
      type: "input_image",
      image_url: fileToDataUrl(publicUrlToAbsolutePath(p)),
      detail: "auto",
    }));

    const photoCount = Math.min(photoPaths.length, 6);
    const photoNote =
      photoCount > 1
        ? `You have been given ${photoCount} photos of the SAME item taken from different angles. Cross-reference ALL photos together to identify details not visible in any single photo. Use close-up shots for markings, labels, and condition details. Use wider shots for overall form, style, and dimensions.`
        : "You have been given 1 photo. Identify as much as possible from this single image. Note if additional photos would improve confidence.";

    // Parse seller-provided data from context
    const sellerBlock = context
      ? `\nSELLER-PROVIDED DATA (use as hints — verify against photos, photos override seller claims):\n${context}`
      : "\nNo seller data provided — rely entirely on photo analysis.";

    const instruction = `You are a seasoned estate sale appraiser with 30 years of experience identifying, pricing, and selling household items, antiques, collectibles, vehicles, and everything in between. You work for LegacyLoop, a US resale platform.

${photoNote}

CRITICAL RULE — TRUST THE PHOTOS above all else. If the seller says "excellent condition" but you can see scratches, stains, or damage, score based on what you SEE in the photos, not what the seller claims. Photos are the truth.

SECTION 1 — IDENTIFICATION:
- Be EXTREMELY SPECIFIC. You have 30 years of experience — use it.
  BAD: "wooden chair"  BAD: "old rocking chair"
  GOOD: "American oak pressed-back rocking chair with carved splat and turned spindles, circa 1890-1920"
  BAD: "vintage watch"
  GOOD: "Omega Seamaster De Ville automatic dress watch, cal. 562, circa 1965-1970, gold-filled case"
- Identify brand/maker from visible logos, labels, stamps, hallmarks, or design characteristics.
- Determine material by examining texture, color, sheen, weight indicators, and construction methods.
- Estimate era from design style, materials, construction methods, hardware, and wear patterns.
- Look for maker's marks, labels, stamps, serial numbers, or signatures in ALL photos.

SECTION 2 — CONDITION:
- Score on a 1-10 scale where 10=mint/new-in-box and 1=parts-only/non-functional.
- Give SEPARATE cosmetic and functional scores.
- Be brutally specific: "three parallel scratches on top surface, each approximately 2-3 inches long, depth consistent with cat claws" not just "some scratches".
- Note if condition is consistent with estimated age (patina vs damage).
- CRITICAL: Be honest about damage. A broken Tiffany lamp is NOT worth the same as an intact one. Do not sugarcoat.

SECTION 3 — PRICING:
- Estimate current fair market value for US secondhand resale (2024-2025 pricing).
- Base prices on real market data: eBay sold listings, Facebook Marketplace, Craigslist, estate sales, specialty platforms.
- Account for condition, completeness, and typical sell-through rates in your category.
- If the item appears worthless, unsellable, or would cost more to ship than it's worth, set estimated_value_low/mid/high to 0 and note "Recommend donation" in pricing_rationale.
- Items under $5 value: recommend donation or bundling with other items.
- pricing_confidence: 0-100. Use <40 if you're truly guessing. Use >70 if you have strong comparables.

SECTION 3B — REGIONAL PRICING (critical for seller advice):
- The best market must be SPECIFIC to this item type. Think about WHERE buyers for THIS item actually are:
  Guitar pedals/gear → Nashville, TN or Austin, TX (music scenes)
  Antique furniture → Boston, MA or Philadelphia, PA (antique markets)
  Vintage clothing → NYC or LA (fashion resale markets)
  Surfboards → coastal CA or HI
  Cowboy boots/western → Dallas, TX or Denver, CO
  Fine art → NYC, Chicago, or LA
  Vintage electronics → Portland, OR or Austin, TX
  Sports memorabilia → city of the team
  Do NOT default to NYC for everything — pick the city where THIS item has the most buyers.
- Assess local demand based on the seller's area and item type. A guitar pedal in rural Maine has WEAK local demand. An antique rocking chair near Boston has STRONG local demand.
- Give a plain-language ship-vs-local verdict with real dollar estimates.

SECTION 3C — WEIGHT & SHIPPING:
- Estimate the item's weight in pounds. Be realistic based on what you see.
- Rate shipping difficulty: Easy (small/light), Moderate (needs padding), Difficult (large/fragile), Freight only.
- Give specific packing advice for THIS item (box size, materials, fragility concerns).

SECTION 4 — ANTIQUE DETECTION:
- is_antique: true if the item is likely 50+ years old.
- List specific evidence in antique_markers (construction methods, materials, wear patterns, style indicators).
- Recommend appraisal only if the item may have significant hidden value (rare maker, valuable material, etc.).

SECTION 5 — LISTING SUGGESTIONS:
- recommended_title: optimized for search (max 80 chars), include key terms buyers actually search for.
- best_platforms: ordered by best fit. Consider item value, category, and shipping difficulty.

SECTION 6 — PHOTO QUALITY:
- Score the submitted photos 1-10. 10=professional studio, 7=good natural light, 4=dark/blurry, 1=nearly unusable.
- Give specific, actionable improvement tips that would increase sale price.

SECTION 7 — VERBAL SUMMARY:
- Write a 2-4 sentence plain-English summary of your overall assessment.
- Cover: what the item is, its condition, approximate value range, and your top recommendation.
- Write as if speaking directly to the seller in a friendly, professional tone.
- Be honest — if the item isn't worth selling, say so kindly.
${sellerBlock}

Return ONLY the JSON object matching the schema.`.trim();

    const model = process.env.OPENAI_MODEL || "gpt-4o-mini";

    const resp = await openai.responses.create({
      model,
      input: [
        {
          role: "user",
          content: [
            { type: "input_text", text: instruction },
            ...imageContent,
          ],
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "legacyloop_item_identification",
          strict: true,
          schema: ANALYSIS_SCHEMA,
        },
      },
    });

    const jsonText = resp.output_text;
    const parsed = JSON.parse(jsonText) as AiAnalysis;

    // ── Post-processing clamps ────────────────────────────────────────────
    // Normalize confidence
    if (parsed.confidence > 1) parsed.confidence = parsed.confidence / 100;

    // Clamp condition scores to 1-10
    parsed.condition_score = Math.max(1, Math.min(10, Math.round(parsed.condition_score)));
    parsed.condition_cosmetic = Math.max(1, Math.min(10, Math.round(parsed.condition_cosmetic)));
    parsed.condition_functional = Math.max(1, Math.min(10, Math.round(parsed.condition_functional)));

    // Clamp photo quality score to 1-10
    if (parsed.photo_quality_score != null) {
      parsed.photo_quality_score = Math.max(1, Math.min(10, Math.round(parsed.photo_quality_score)));
    }

    // Clamp pricing confidence to 0-100
    if (parsed.pricing_confidence != null) {
      if (parsed.pricing_confidence > 0 && parsed.pricing_confidence <= 1) {
        parsed.pricing_confidence = Math.round(parsed.pricing_confidence * 100);
      }
      parsed.pricing_confidence = Math.max(0, Math.min(100, Math.round(parsed.pricing_confidence)));
    }

    // Ensure low <= mid <= high
    if (parsed.estimated_value_low != null && parsed.estimated_value_mid != null) {
      if (parsed.estimated_value_low > parsed.estimated_value_mid) {
        parsed.estimated_value_mid = parsed.estimated_value_low;
      }
    }
    if (parsed.estimated_value_mid != null && parsed.estimated_value_high != null) {
      if (parsed.estimated_value_mid > parsed.estimated_value_high) {
        parsed.estimated_value_high = parsed.estimated_value_mid;
      }
    }

    return parsed;
  },
};
