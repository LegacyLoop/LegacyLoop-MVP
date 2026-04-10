import OpenAI from "openai";
import type { AiAnalysis } from "@/lib/types";
import { readPhotoAsBuffer, guessMimeType } from "@/lib/adapters/storage";

// ─── Shared helpers ────────────────────────────────────────────────────────

async function fileToDataUrl(filePath: string) {
  const buffer = await readPhotoAsBuffer(filePath);
  const mime = guessMimeType(filePath);
  const base64 = buffer.toString("base64");
  return { dataUrl: `data:${mime};base64,${base64}`, base64, mime };
}

// ─── Comprehensive prompt (matches ai.ts quality) ────────────────────────

function buildComprehensivePrompt(context?: string): string {
  const sellerBlock = context
    ? `\nSELLER-PROVIDED DATA (use as hints — verify against photos, photos override seller claims):\n${context}`
    : "\nNo seller data provided — rely entirely on photo analysis.";

  return `You are a seasoned estate sale appraiser with 30 years of experience identifying, pricing, and selling household items, antiques, collectibles, vehicles, and everything in between. You work for LegacyLoop, a US resale platform.

Analyze the image(s) carefully and return a JSON object with these fields.

IDENTIFICATION — Be EXTREMELY SPECIFIC:
  BAD: "wooden chair"  GOOD: "American oak pressed-back rocking chair with carved splat, circa 1890-1920"
  Include: item_name, category, subcategory, brand, model, maker, material, era, style, country_of_origin, markings, dimensions_estimate, completeness

CONDITION — Score on 1-10 scale:
  Include: condition_guess (Mint/Near Mint/Excellent/Very Good/Good/Fair/Below Average/Poor/Damaged/Parts Only), condition_score (1-10), condition_cosmetic (1-10), condition_functional (1-10), condition_details, visible_issues[], positive_notes[], restoration_potential
  Be honest about damage. Trust the photos over seller claims.

PRICING — Estimate current US secondhand resale value (2024-2025):
  Include: estimated_value_low, estimated_value_mid, estimated_value_high (in USD), pricing_confidence (0-100), pricing_rationale, comparable_description, value_drivers[]
  If worthless: set values to 0 and note "Recommend donation".

ANTIQUE DETECTION:
  Include: is_antique (true if 50+ years old), estimated_age_years, antique_markers[], appraisal_recommended, potential_value_if_authenticated

LISTING SUGGESTIONS:
  Include: recommended_title (max 80 chars, SEO optimized), recommended_description (2-3 sentences), best_platforms[] (ordered by fit)

PHOTO QUALITY:
  Include: photo_quality_score (1-10), photo_improvement_tips[]

VERBAL SUMMARY:
  Include: summary — a 2-4 sentence plain-English assessment covering what it is, condition, value range, and top recommendation. Write as if speaking to the seller.

GENERAL:
  Include: keywords[] (max 15, search terms buyers would use), notes (additional observations), confidence (0.0-1.0)

CRITICAL CLASSIFICATION RULE:
Lawn mowers (riding or push), garden tractors (John Deere, Husqvarna, Cub Cadet, Troy-Bilt, Craftsman, Toro), chainsaws, leaf blowers, pressure washers, snow blowers, log splitters, wood chippers, generators, and ALL garden/lawn/outdoor power equipment MUST be categorized as 'Outdoor Equipment' — NEVER as 'Vehicles' — even if they have engines, wheels, seats, or steering wheels. The 'Vehicles' category is EXCLUSIVELY for road-legal motor vehicles: cars, trucks, SUVs, vans, motorcycles, boats, ATVs, RVs, campers, and motorhomes.

CONFIDENCE RULE:
If brand name labels, model stickers, QR codes, serial number plates, or manufacturer logos are clearly visible and legible in the photos, BOOST confidence to 0.90+. If BOTH brand AND model number are legible, BOOST to 0.95+. Visible labeling CONFIRMS identification.

COLLECTIBLE DETECTION:
Include: is_collectible (true if trading cards, sports cards, coins, stamps, comics, vinyl records, sneakers, watches, figurines, vintage toys, video games, memorabilia — items graded by PSA/BGS/CGC/WATA or tracked on StockX/TCGPlayer/Discogs)

VEHICLE DATA (only if category is "Vehicles"):
Include: vehicle_year, vehicle_make, vehicle_model, vehicle_mileage, vin_visible, vehicle_transmission, vehicle_fuel_type, vehicle_engine, vehicle_drivetrain
Set ALL vehicle fields to null if item is NOT a vehicle.

SHIPPING ESTIMATE:
Include: weight_estimate_lbs (realistic weight in pounds), shipping_difficulty (Easy/Moderate/Difficult/Freight only), shipping_notes (packing advice, fragility, carrier suggestions)

REGIONAL PRICING INTELLIGENCE:
Include: regional_best_city (US city where this commands highest price IF shipped nationally — null if too large to ship), regional_best_state, regional_best_price_low, regional_best_price_high, regional_best_why, regional_local_demand (Strong/Average/Weak), regional_local_reasoning, regional_ship_or_local (verdict with math), regional_local_best_city (best city within seller's radius — null if no radius), regional_local_best_why, regional_national_best_city, regional_national_best_state
${sellerBlock}

Return ONLY a valid JSON object. No markdown, no code fences, no extra text.`;
}

// ─── Parse loose JSON from any AI provider ───────────────────────────────

function parseLooseJson(text: string): AiAnalysis | null {
  // Strip markdown code fences if present
  let cleaned = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/i, "").trim();
  const match = cleaned.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    const parsed = JSON.parse(match[0]);
    if (!parsed.item_name || !parsed.category) return null;
    return {
      item_name: String(parsed.item_name ?? "Unknown Item"),
      category: String(parsed.category ?? "Other"),
      brand: parsed.brand ?? null,
      model: parsed.model ?? null,
      maker: parsed.maker ?? null,
      material: parsed.material ?? null,
      era: parsed.era ?? null,
      style: parsed.style ?? null,
      keywords: Array.isArray(parsed.keywords) ? parsed.keywords.slice(0, 15) : [],
      condition_guess: String(parsed.condition_guess ?? "Unknown"),
      condition_score: Number(parsed.condition_score ?? 6),
      condition_cosmetic: Number(parsed.condition_cosmetic ?? 6),
      condition_functional: Number(parsed.condition_functional ?? 6),
      condition_details: String(parsed.condition_details ?? ""),
      markings: parsed.markings ?? null,
      dimensions_estimate: parsed.dimensions_estimate ?? null,
      completeness: parsed.completeness ?? null,
      notes: String(parsed.notes ?? ""),
      confidence: Number(parsed.confidence ?? 0.7),
      // Extended fields
      subcategory: parsed.subcategory ?? null,
      country_of_origin: parsed.country_of_origin ?? null,
      visible_issues: Array.isArray(parsed.visible_issues) ? parsed.visible_issues : [],
      positive_notes: Array.isArray(parsed.positive_notes) ? parsed.positive_notes : [],
      restoration_potential: parsed.restoration_potential ?? null,
      estimated_value_low: parsed.estimated_value_low != null ? Number(parsed.estimated_value_low) : null,
      estimated_value_mid: parsed.estimated_value_mid != null ? Number(parsed.estimated_value_mid) : null,
      estimated_value_high: parsed.estimated_value_high != null ? Number(parsed.estimated_value_high) : null,
      pricing_confidence: parsed.pricing_confidence != null ? Number(parsed.pricing_confidence) : null,
      pricing_rationale: parsed.pricing_rationale ?? null,
      comparable_description: parsed.comparable_description ?? null,
      value_drivers: Array.isArray(parsed.value_drivers) ? parsed.value_drivers : [],
      is_antique: parsed.is_antique ?? null,
      estimated_age_years: parsed.estimated_age_years != null ? Number(parsed.estimated_age_years) : null,
      antique_markers: Array.isArray(parsed.antique_markers) ? parsed.antique_markers : [],
      appraisal_recommended: parsed.appraisal_recommended ?? null,
      potential_value_if_authenticated: parsed.potential_value_if_authenticated != null ? Number(parsed.potential_value_if_authenticated) : null,
      recommended_title: parsed.recommended_title ?? null,
      recommended_description: parsed.recommended_description ?? null,
      best_platforms: Array.isArray(parsed.best_platforms) ? parsed.best_platforms : [],
      photo_quality_score: parsed.photo_quality_score != null ? Number(parsed.photo_quality_score) : null,
      photo_improvement_tips: Array.isArray(parsed.photo_improvement_tips) ? parsed.photo_improvement_tips : [],
      summary: parsed.summary ?? null,
      // Collectible
      is_collectible: parsed.is_collectible ?? null,
      // Vehicle fields
      vehicle_year: parsed.vehicle_year ?? null,
      vehicle_make: parsed.vehicle_make ?? null,
      vehicle_model: parsed.vehicle_model ?? null,
      vehicle_mileage: parsed.vehicle_mileage ?? null,
      vin_visible: parsed.vin_visible ?? null,
      vehicle_transmission: parsed.vehicle_transmission ?? null,
      vehicle_fuel_type: parsed.vehicle_fuel_type ?? null,
      vehicle_engine: parsed.vehicle_engine ?? null,
      vehicle_drivetrain: parsed.vehicle_drivetrain ?? null,
      // Shipping
      weight_estimate_lbs: parsed.weight_estimate_lbs != null ? Number(parsed.weight_estimate_lbs) : null,
      shipping_difficulty: parsed.shipping_difficulty ?? null,
      shipping_notes: parsed.shipping_notes ?? null,
      // Regional pricing
      regional_best_city: parsed.regional_best_city ?? null,
      regional_best_state: parsed.regional_best_state ?? null,
      regional_best_price_low: parsed.regional_best_price_low != null ? Number(parsed.regional_best_price_low) : null,
      regional_best_price_high: parsed.regional_best_price_high != null ? Number(parsed.regional_best_price_high) : null,
      regional_best_why: parsed.regional_best_why ?? null,
      regional_local_demand: parsed.regional_local_demand ?? null,
      regional_local_reasoning: parsed.regional_local_reasoning ?? null,
      regional_ship_or_local: parsed.regional_ship_or_local ?? null,
      regional_local_best_city: parsed.regional_local_best_city ?? null,
      regional_local_best_why: parsed.regional_local_best_why ?? null,
      regional_national_best_city: parsed.regional_national_best_city ?? null,
      regional_national_best_state: parsed.regional_national_best_state ?? null,
    };
  } catch {
    return null;
  }
}

// ─── Per-agent specialty suffixes ─────────────────────────────────────

const OPENAI_SPECIALTY = `

SPECIAL FOCUS for this analysis: You are the primary general-purpose analyst. Provide the most thorough and balanced assessment across all dimensions. Pay extra attention to condition scoring — be precise about cosmetic and functional grades based on what you see in the photos.`;

const CLAUDE_SPECIALTY = `

SPECIAL FOCUS for this analysis: You excel at craftsmanship analysis, historical significance, and maker identification. Pay extra attention to:
- Construction techniques (dovetail joints, hand-stitching, hand-blown glass, tool marks)
- Historical context and period accuracy (is the era claimed consistent with construction methods?)
- Maker marks, signatures, stamps, labels — describe them exactly
- Material quality and authenticity (solid wood vs veneer, real vs plated metal, genuine vs reproduction)
- Rarity indicators and regional provenance
Your unique value is identifying details the other AI systems might miss about craftsmanship and historical importance.`;

const GEMINI_SPECIALTY = `

SPECIAL FOCUS for this analysis: You excel at market analysis, demand patterns, and comparable sales. Pay extra attention to:
- Current market trends for this category (is demand rising, falling, or stable?)
- Comparable recent sales on eBay, Facebook Marketplace, Etsy, and auction houses
- Regional demand differences (would this sell better in NYC vs rural Maine?)
- Seasonal patterns (do certain items sell better at specific times of year?)
- Platform strategy (which marketplace would get the highest price for this specific item?)
Your unique value is providing market intelligence the other AI systems might miss about pricing trends and buyer demand.`;

const GROK_SPECIALTY = `

GROK SPECIALTY FOCUS: You have a unique advantage — real-time awareness of social media trends, viral content, and online conversation. Focus on:
- Social media buzz: Is this type of item trending on X/Twitter, TikTok, Instagram? Are people talking about it?
- Viral potential: Could this item go viral if marketed right? What angle would catch attention?
- Unconventional markets: Are there niche communities, Discord servers, Telegram groups, or subreddits where this item has unusual demand?
- Real-time demand signals: What are people searching for RIGHT NOW in this category?
- Cultural moment: Is there a movie, TV show, celebrity, or trend that makes this item more relevant right now?
- Gen Z/Millennial angle: Would younger buyers be interested for nostalgia, aesthetic, or trend reasons?
- Meme value: Does this item have any ironic, nostalgic, or cultural cachet that adds value beyond its physical worth?
- Contrarian take: What does everyone else miss about pricing this item? Challenge conventional wisdom if warranted.

Be bold. Be specific. Bring insights the other AI agents won't have.`;

// ─── OpenAI analysis (comprehensive) ────────────────────────────────────

const openai =
  process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.length > 10
    ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    : null;

async function analyzeWithOpenAI(absPath: string, context?: string, extraPaths?: string[]): Promise<AiAnalysis> {
  if (!openai) throw new Error("No OpenAI key configured");

  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
  const prompt = buildComprehensivePrompt(context) + OPENAI_SPECIALTY;

  // Build multi-image content
  const imageContent: any[] = [];
  const allPaths = [absPath, ...(extraPaths || [])];
  for (const p of allPaths) {
    try {
      if (p.startsWith("http://") || p.startsWith("https://") || (await import("fs")).existsSync(p)) {
        const { dataUrl } = await fileToDataUrl(p);
        imageContent.push({ type: "input_image", image_url: dataUrl, detail: "high" });
      }
    } catch { /* skip unreadable */ }
  }
  if (imageContent.length === 0) {
    const { dataUrl } = await fileToDataUrl(absPath);
    imageContent.push({ type: "input_image", image_url: dataUrl, detail: "auto" });
  }

  const resp = await Promise.race([
    openai.responses.create({
      model,
      input: [
        {
          role: "user",
          content: [
            { type: "input_text", text: `${imageContent.length} photo(s) attached — cross-reference all angles for grading. ${prompt}` },
            ...imageContent,
          ],
        },
      ],
      text: { format: { type: "text" } },
    }),
    new Promise<never>((_, reject) => setTimeout(() => reject(new Error("Provider timeout (40s)")), 40_000)),
  ]);

  const parsed = parseLooseJson(resp.output_text);
  if (!parsed) throw new Error("OpenAI returned unparseable response");
  return parsed;
}

// ─── Claude analysis (comprehensive) ────────────────────────────────────

async function analyzeWithClaude(absPath: string, context?: string, extraPaths?: string[]): Promise<AiAnalysis> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key || key.includes("YOUR_CLAUDE") || key.length < 10) throw new Error("No Anthropic key configured");

  const prompt = buildComprehensivePrompt(context) + CLAUDE_SPECIALTY;

  // Build multi-image content for Claude
  const imageBlocks: any[] = [];
  const allPaths = [absPath, ...(extraPaths || [])];
  for (const p of allPaths) {
    try {
      if (p.startsWith("http://") || p.startsWith("https://") || (await import("fs")).existsSync(p)) {
        const { base64: b64, mime: m } = await fileToDataUrl(p);
        imageBlocks.push({ type: "image", source: { type: "base64", media_type: m, data: b64 } });
      }
    } catch { /* skip */ }
  }
  if (imageBlocks.length === 0) {
    const { base64, mime } = await fileToDataUrl(absPath);
    imageBlocks.push({ type: "image", source: { type: "base64", media_type: mime, data: base64 } });
  }

  // CMD-CLAUDE-PROMPT-CACHING (FLAG-SB-2): Split prompt into
  // system (cacheable base prompt + specialty) and user (images
  // + short instruction). In MegaBot, the prompt includes skill
  // packs via context → buildComprehensivePrompt(context).
  // These are 28-40k tokens and identical for the same bot —
  // perfect cache targets. Cache hits cost 0.1x normal input.
  const body = {
    model: process.env.ANTHROPIC_MODEL || "claude-haiku-4-5-20251001",
    max_tokens: 4096,
    system: [
      {
        type: "text" as const,
        text: prompt,
        cache_control: { type: "ephemeral" as const },
      },
    ],
    messages: [
      {
        role: "user" as const,
        content: [
          ...imageBlocks,
          { type: "text", text: `${imageBlocks.length} photo(s) — cross-reference all angles for grading. Return ONLY valid JSON.` },
        ],
      },
    ],
  };

  const claudeController = new AbortController();
  const claudeTimeout = setTimeout(() => claudeController.abort(), 40_000);

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
        "anthropic-beta": "prompt-caching-2024-07-31",
        "content-type": "application/json",
      },
      body: JSON.stringify(body),
      signal: claudeController.signal,
    });

    if (!res.ok) {
      const t = await res.text();
      throw new Error(`Claude API ${res.status}: ${t.slice(0, 300)}`);
    }

    const data = await res.json();
    const text = data.content?.[0]?.text ?? "";

    // CMD-CLAUDE-PROMPT-CACHING: log cache metrics
    const usage = data.usage ?? {};
    const cacheCreation = usage.cache_creation_input_tokens ?? 0;
    const cacheRead = usage.cache_read_input_tokens ?? 0;
    if (cacheCreation > 0 || cacheRead > 0) {
      const hit = cacheRead > 0;
      const savings = Number((cacheRead * 0.9 * 0.000001).toFixed(6));
      console.log(
        `[analyzeWithClaude] cache ${hit ? "HIT" : "MISS/WRITE"} — ` +
        `created=${cacheCreation} read=${cacheRead} savings=$${savings}`,
      );
    }

    const parsed = parseLooseJson(text);
    if (!parsed) throw new Error("Claude returned unparseable JSON");
    return parsed;
  } finally {
    clearTimeout(claudeTimeout);
  }
}

// ─── Gemini analysis (comprehensive) ────────────────────────────────────

async function analyzeWithGemini(absPath: string, context?: string, extraPaths?: string[]): Promise<AiAnalysis> {
  const key = process.env.GEMINI_API_KEY;
  if (!key || key.includes("YOUR_GEMINI") || key.length < 10) throw new Error("No Gemini key configured");

  // CMD-GEMINI-FALLBACK-FIX: 3-deep model chain for reliability
  const GEMINI_FALLBACK_MODELS = [
    process.env.GEMINI_MODEL || "gemini-2.5-flash",
    "gemini-2.5-flash-lite",
    "gemini-3-flash-preview",
  ];
  const prompt = buildComprehensivePrompt(context) + GEMINI_SPECIALTY;

  // Build multi-image parts for Gemini
  const imageParts: any[] = [];
  const allPaths = [absPath, ...(extraPaths || [])];
  for (const p of allPaths) {
    try {
      if (p.startsWith("http://") || p.startsWith("https://") || (await import("fs")).existsSync(p)) {
        const { base64: b64, mime: m } = await fileToDataUrl(p);
        imageParts.push({ inline_data: { mime_type: m, data: b64 } });
      }
    } catch { /* skip */ }
  }
  if (imageParts.length === 0) {
    const { base64, mime } = await fileToDataUrl(absPath);
    imageParts.push({ inline_data: { mime_type: mime, data: base64 } });
  }

  const body = {
    contents: [
      {
        parts: [
          ...imageParts,
          { text: `${imageParts.length} photo(s) — cross-reference all. ${prompt}` },
        ],
      },
    ],
    generationConfig: {
      responseMimeType: "application/json",
      maxOutputTokens: 4096,
    },
  };

  // CMD-GEMINI-FALLBACK-FIX: try each model in fallback chain
  for (let mi = 0; mi < GEMINI_FALLBACK_MODELS.length; mi++) {
    const tryModel = GEMINI_FALLBACK_MODELS[mi];
    const tryUrl = `https://generativelanguage.googleapis.com/v1beta/models/${tryModel}:generateContent?key=${key}`;
    try {
      const res = await Promise.race([
        fetch(tryUrl, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(body),
        }),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error("Provider timeout (40s)")), 40_000)),
      ]);

      if (!res.ok) {
        const t = await res.text().catch(() => "");
        console.log(`[analyzeWithGemini] ${tryModel} ${res.status} — trying next fallback... (${t.slice(0, 80)})`);
        continue;
      }

      const data = await res.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
      const parsed = parseLooseJson(text);
      if (!parsed) {
        console.log(`[analyzeWithGemini] ${tryModel} returned unparseable JSON — trying next fallback...`);
        continue;
      }
      if (mi > 0) console.log(`[analyzeWithGemini] Succeeded on fallback model: ${tryModel}`);
      return parsed;
    } catch (err: any) {
      console.log(`[analyzeWithGemini] ${tryModel} error: ${err.message?.slice(0, 80)} — trying next fallback...`);
      if (mi === GEMINI_FALLBACK_MODELS.length - 1) {
        throw new Error(`All Gemini models failed. Last: ${err.message}`);
      }
    }
  }
  throw new Error("All Gemini models exhausted");
}

// ─── Grok analysis (xAI — OpenAI-compatible chat completions) ─────────

async function analyzeWithGrok(absPath: string, context?: string, extraPaths?: string[]): Promise<AiAnalysis> {
  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey || apiKey.length < 10) throw new Error("No XAI_API_KEY configured");

  const baseUrl = process.env.XAI_BASE_URL || "https://api.x.ai/v1";
  const model = process.env.XAI_MODEL_VISION || "grok-4";
  const prompt = buildComprehensivePrompt(context) + GROK_SPECIALTY;

  // Build multi-image content for Grok (OpenAI-compatible)
  const imageUrls: any[] = [];
  const allPaths = [absPath, ...(extraPaths || [])];
  for (const p of allPaths) {
    try {
      if (p.startsWith("http://") || p.startsWith("https://") || (await import("fs")).existsSync(p)) {
        const { dataUrl } = await fileToDataUrl(p);
        imageUrls.push({ type: "image_url", image_url: { url: dataUrl } });
      }
    } catch { /* skip */ }
  }
  if (imageUrls.length === 0) {
    const { dataUrl } = await fileToDataUrl(absPath);
    imageUrls.push({ type: "image_url", image_url: { url: dataUrl } });
  }

  const res = await Promise.race([
    fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: prompt },
          {
            role: "user",
            content: [
              { type: "text", text: `${imageUrls.length} photo(s) — cross-reference all angles. Return JSON.` },
              ...imageUrls,
            ],
          },
        ],
        max_tokens: 4096,
        temperature: 0.7,
      }),
    }),
    new Promise<never>((_, reject) => setTimeout(() => reject(new Error("Provider timeout (40s)")), 40_000)),
  ]);

  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Grok API ${res.status}: ${t.slice(0, 300)}`);
  }

  const data = await res.json();
  const text = data.choices?.[0]?.message?.content ?? "";
  const parsed = parseLooseJson(text);
  if (!parsed) throw new Error("Grok returned unparseable JSON");
  return parsed;
}

// ─── Consensus merging (full fields) ────────────────────────────────────

export type AiProviderResult = {
  provider: "openai" | "claude" | "gemini" | "grok";
  result: AiAnalysis | null;
  error: string | null;
  durationMs: number;
};

export type MegabotResult = {
  providers: AiProviderResult[];
  consensus: AiAnalysis;
  agreementScore: number; // 0-100
};

function majorityVote(values: string[]): string {
  const counts: Record<string, number> = {};
  for (const v of values) counts[v] = (counts[v] ?? 0) + 1;
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
}

function avgNum(results: AiAnalysis[], getter: (r: AiAnalysis) => number | null | undefined, fallback: number): number {
  const vals = results.map(getter).filter((v): v is number => v != null);
  if (vals.length === 0) return fallback;
  return Math.round(vals.reduce((s, v) => s + v, 0) / vals.length);
}

function avgNumFloat(results: AiAnalysis[], getter: (r: AiAnalysis) => number | null | undefined): number | null {
  const vals = results.map(getter).filter((v): v is number => v != null);
  if (vals.length === 0) return null;
  return Math.round(vals.reduce((s, v) => s + v, 0) / vals.length);
}

function firstNonNull<T>(results: AiAnalysis[], getter: (r: AiAnalysis) => T | null | undefined): T | null {
  for (const r of results) {
    const v = getter(r);
    if (v != null) return v;
  }
  return null;
}

function unionArrays(results: AiAnalysis[], getter: (r: AiAnalysis) => string[] | undefined, max: number): string[] {
  const set = new Set<string>();
  for (const r of results) {
    const arr = getter(r);
    if (arr) arr.forEach((v) => set.add(v));
  }
  return [...set].slice(0, max);
}

function mergeConsensus(results: AiAnalysis[]): AiAnalysis {
  if (results.length === 0) throw new Error("No results to merge");
  if (results.length === 1) return results[0];

  // Item name: pick the most descriptive (longest)
  const itemNames = results.map((r) => r.item_name).filter(Boolean);
  const item_name = itemNames.sort((a, b) => b.length - a.length)[0] ?? "Unknown Item";

  // Category/condition: majority vote
  const category = majorityVote(results.map((r) => r.category));
  const condition_guess = majorityVote(results.map((r) => r.condition_guess));

  // Brand/model/maker: first non-null (most specific)
  const brand = firstNonNull(results, (r) => r.brand);
  const model = firstNonNull(results, (r) => r.model);

  // Keywords: union, deduped
  const allKw = new Set<string>();
  for (const r of results) r.keywords.forEach((k) => allKw.add(k.toLowerCase()));
  const keywords = [...allKw].slice(0, 15);

  // Notes: combine unique
  const notes = results.map((r) => r.notes).filter(Boolean).join(" ").slice(0, 500);

  // Confidence: average
  const confidence = results.reduce((s, r) => s + r.confidence, 0) / results.length;

  // Build verbal summary from consensus data
  const midPrice = avgNumFloat(results, (r) => r.estimated_value_mid);
  const lowPrice = avgNumFloat(results, (r) => r.estimated_value_low);
  const highPrice = avgNumFloat(results, (r) => r.estimated_value_high);
  const bestPlatform = firstNonNull(results, (r) => r.best_platforms?.[0]) ?? "online";
  const isAntique = results.some((r) => r.is_antique === true);

  // Prefer the longest/best provider summary, or generate one
  const providerSummaries = results.map((r) => r.summary).filter(Boolean) as string[];
  let summary: string;
  if (providerSummaries.length > 0) {
    // Pick the longest (most detailed) summary
    summary = providerSummaries.sort((a, b) => b.length - a.length)[0];
  } else {
    // Generate from consensus data
    const priceRange = midPrice != null ? `$${lowPrice ?? 0}–$${highPrice ?? midPrice}` : "unknown value";
    const antiqueNote = isAntique ? " This appears to be a genuine antique." : "";
    summary = `This is a ${condition_guess.toLowerCase()} condition ${item_name}. Based on multi-AI consensus analysis, the estimated value is ${priceRange}.${antiqueNote} We recommend listing on ${bestPlatform} for the best results.`;
  }

  const merged: Record<string, any> = {
    item_name,
    category,
    brand,
    model,
    keywords,
    condition_guess,
    notes,
    confidence,
    summary,
    // Identification
    maker: firstNonNull(results, (r) => r.maker),
    material: firstNonNull(results, (r) => r.material),
    era: firstNonNull(results, (r) => r.era),
    style: firstNonNull(results, (r) => r.style),
    subcategory: firstNonNull(results, (r) => r.subcategory),
    country_of_origin: firstNonNull(results, (r) => r.country_of_origin),
    markings: firstNonNull(results, (r) => r.markings),
    dimensions_estimate: firstNonNull(results, (r) => r.dimensions_estimate),
    completeness: firstNonNull(results, (r) => r.completeness),
    // Condition (averaged)
    condition_score: avgNum(results, (r) => r.condition_score, 6),
    condition_cosmetic: avgNum(results, (r) => r.condition_cosmetic, 6),
    condition_functional: avgNum(results, (r) => r.condition_functional, 6),
    condition_details: results.map((r) => r.condition_details).filter(Boolean).sort((a, b) => b.length - a.length)[0] ?? "",
    visible_issues: unionArrays(results, (r) => r.visible_issues, 10),
    positive_notes: unionArrays(results, (r) => r.positive_notes, 10),
    restoration_potential: firstNonNull(results, (r) => r.restoration_potential),
    // Pricing (averaged)
    estimated_value_low: lowPrice,
    estimated_value_mid: midPrice,
    estimated_value_high: highPrice,
    pricing_confidence: avgNumFloat(results, (r) => r.pricing_confidence),
    pricing_rationale: firstNonNull(results, (r) => r.pricing_rationale),
    comparable_description: firstNonNull(results, (r) => r.comparable_description),
    value_drivers: unionArrays(results, (r) => r.value_drivers, 8),
    // Antique
    is_antique: isAntique || null,
    estimated_age_years: avgNumFloat(results, (r) => r.estimated_age_years),
    antique_markers: unionArrays(results, (r) => r.antique_markers, 10),
    appraisal_recommended: results.some((r) => r.appraisal_recommended === true) || null,
    potential_value_if_authenticated: avgNumFloat(results, (r) => r.potential_value_if_authenticated),
    // Listing
    recommended_title: firstNonNull(results, (r) => r.recommended_title),
    recommended_description: firstNonNull(results, (r) => r.recommended_description),
    best_platforms: unionArrays(results, (r) => r.best_platforms, 6),
    // Photo quality (averaged)
    photo_quality_score: avgNumFloat(results, (r) => r.photo_quality_score),
    photo_improvement_tips: unionArrays(results, (r) => r.photo_improvement_tips, 6),
    // Collectible
    is_collectible: results.some((r) => (r as any).is_collectible === true) || null,
    // Vehicle fields
    vehicle_year: firstNonNull(results, (r) => (r as any).vehicle_year),
    vehicle_make: firstNonNull(results, (r) => (r as any).vehicle_make),
    vehicle_model: firstNonNull(results, (r) => (r as any).vehicle_model),
    vehicle_mileage: firstNonNull(results, (r) => (r as any).vehicle_mileage),
    vin_visible: firstNonNull(results, (r) => (r as any).vin_visible),
    vehicle_transmission: firstNonNull(results, (r) => (r as any).vehicle_transmission),
    vehicle_fuel_type: firstNonNull(results, (r) => (r as any).vehicle_fuel_type),
    vehicle_engine: firstNonNull(results, (r) => (r as any).vehicle_engine),
    vehicle_drivetrain: firstNonNull(results, (r) => (r as any).vehicle_drivetrain),
    // Shipping
    weight_estimate_lbs: avgNumFloat(results, (r) => (r as any).weight_estimate_lbs),
    shipping_difficulty: firstNonNull(results, (r) => (r as any).shipping_difficulty),
    shipping_notes: firstNonNull(results, (r) => (r as any).shipping_notes),
    // Regional
    regional_best_city: firstNonNull(results, (r) => (r as any).regional_best_city),
    regional_best_state: firstNonNull(results, (r) => (r as any).regional_best_state),
    regional_best_price_low: avgNumFloat(results, (r) => (r as any).regional_best_price_low),
    regional_best_price_high: avgNumFloat(results, (r) => (r as any).regional_best_price_high),
    regional_best_why: firstNonNull(results, (r) => (r as any).regional_best_why),
    regional_local_demand: firstNonNull(results, (r) => (r as any).regional_local_demand),
    regional_local_reasoning: firstNonNull(results, (r) => (r as any).regional_local_reasoning),
    regional_ship_or_local: firstNonNull(results, (r) => (r as any).regional_ship_or_local),
    regional_local_best_city: firstNonNull(results, (r) => (r as any).regional_local_best_city),
    regional_local_best_why: firstNonNull(results, (r) => (r as any).regional_local_best_why),
    regional_national_best_city: firstNonNull(results, (r) => (r as any).regional_national_best_city),
    regional_national_best_state: firstNonNull(results, (r) => (r as any).regional_national_best_state),
  };

  // ── POST-PROCESSING CLAMPS (match ai.ts behavior) ──

  // 1. Confidence normalization
  if (merged.confidence > 1) merged.confidence = merged.confidence / 100;
  merged.confidence = Math.max(0, Math.min(1, merged.confidence));

  // 2. Condition score clamping (1-10)
  merged.condition_score = Math.max(1, Math.min(10, merged.condition_score));
  merged.condition_cosmetic = Math.max(1, Math.min(10, merged.condition_cosmetic));
  merged.condition_functional = Math.max(1, Math.min(10, merged.condition_functional));

  // 3. Confidence boost: brand + model → floor 0.88
  if (merged.brand && merged.model && merged.confidence < 0.88) {
    merged.confidence = 0.88;
  }
  if (merged.markings && typeof merged.markings === "string" && merged.markings.length > 10 && merged.confidence < 0.85) {
    merged.confidence = 0.85;
  }

  // 4. Outdoor equipment category override
  const nameLC = (merged.item_name || "").toLowerCase();
  const OUTDOOR_PATTERNS = /\b(mow(?:er|ing)|riding\s+mower|lawn\s+tractor|garden\s+tractor|chainsaw|leaf\s+blower|string\s+trimmer|weed\s+(?:eater|whacker)|pressure\s+washer|snow\s+blower|log\s+splitter|wood\s+chipper|generator|hedge\s+trimmer|edger|tiller|rototiller)\b/i;
  const OUTDOOR_BRANDS = /\b(john\s+deere|husqvarna|cub\s+cadet|troy[- ]bilt|craftsman|toro|stihl|echo|poulan|ariens|honda\s+(?:mower|generator|trimmer)|briggs|murray|snapper)\b/i;
  if ((merged.category || "").toLowerCase() === "vehicles" && (OUTDOOR_PATTERNS.test(nameLC) || OUTDOOR_BRANDS.test(nameLC))) {
    merged.category = "Outdoor Equipment";
    merged.vehicle_year = null;
    merged.vehicle_make = null;
    merged.vehicle_model = null;
    merged.vehicle_mileage = null;
    merged.vin_visible = null;
    merged.vehicle_transmission = null;
    merged.vehicle_fuel_type = null;
    merged.vehicle_engine = null;
    merged.vehicle_drivetrain = null;
  }

  // 5. Pricing confidence normalization (0-100)
  if (merged.pricing_confidence != null && merged.pricing_confidence > 0 && merged.pricing_confidence <= 1) {
    merged.pricing_confidence = Math.round(merged.pricing_confidence * 100);
  }

  return merged as AiAnalysis;
}

function calcAgreement(results: AiAnalysis[]): number {
  if (results.length < 2) return 100;

  let totalScore = 0;
  let checks = 0;

  // 1. Category agreement (weight: 30%)
  const cats = results.map((r) => r.category.toLowerCase());
  const catMatch = cats.every((c) => c === cats[0]) ? 1.0 : cats.filter((c) => c === cats[0]).length / cats.length;
  totalScore += catMatch * 30;
  checks += 30;

  // 2. Item name word overlap (weight: 30%)
  const names = results.map((r) => r.item_name.toLowerCase());
  let nameOverlap = 0;
  let pairs = 0;
  for (let i = 0; i < names.length; i++) {
    for (let j = i + 1; j < names.length; j++) {
      const wordsA = new Set(names[i].split(/\s+/));
      const wordsB = new Set(names[j].split(/\s+/));
      const shared = [...wordsA].filter((w) => wordsB.has(w)).length;
      const total = Math.max(wordsA.size, wordsB.size);
      nameOverlap += total > 0 ? shared / total : 0;
      pairs++;
    }
  }
  totalScore += (nameOverlap / pairs) * 30;
  checks += 30;

  // 3. Pricing agreement (weight: 25%) — check if mid prices are within 30% of each other
  const mids = results.map((r) => r.estimated_value_mid).filter((v): v is number => v != null && v > 0);
  if (mids.length >= 2) {
    const avgMid = mids.reduce((s, v) => s + v, 0) / mids.length;
    const maxDev = Math.max(...mids.map((m) => Math.abs(m - avgMid) / avgMid));
    const priceScore = maxDev < 0.15 ? 1.0 : maxDev < 0.30 ? 0.7 : maxDev < 0.50 ? 0.4 : 0.1;
    totalScore += priceScore * 25;
  } else {
    totalScore += 12.5; // neutral if no pricing
  }
  checks += 25;

  // 4. Condition agreement (weight: 15%)
  const condScores = results.map((r) => r.condition_score ?? 6);
  const avgCond = condScores.reduce((s, v) => s + v, 0) / condScores.length;
  const condDev = Math.max(...condScores.map((c) => Math.abs(c - avgCond)));
  const condScore = condDev <= 1 ? 1.0 : condDev <= 2 ? 0.7 : 0.3;
  totalScore += condScore * 15;
  checks += 15;

  return Math.round((totalScore / checks) * 100);
}

// ─── Public API ────────────────────────────────────────────────────────────

export async function runMegabot(
  photoPath: string | string[],
  context?: string
): Promise<MegabotResult> {
  // CMD-CLOUDINARY-PHOTO-READ-FIX: pass URLs directly — fileToDataUrl handles both
  const paths = Array.isArray(photoPath) ? photoPath : [photoPath];
  const absPath = paths[0];
  const extraAbsPaths = paths.slice(1);

  const runWithTimer = async (
    provider: "openai" | "claude" | "gemini" | "grok",
    fn: () => Promise<AiAnalysis>
  ): Promise<AiProviderResult> => {
    const start = Date.now();
    try {
      const result = await fn();
      return { provider, result, error: null, durationMs: Date.now() - start };
    } catch (e: any) {
      console.error(`[MegaBot] ${provider} failed:`, e.message);
      return { provider, result: null, error: e.message ?? "Error", durationMs: Date.now() - start };
    }
  };

  // All 4 in parallel — real API calls (Grok skipped if no key)
  const agents: Promise<AiProviderResult>[] = [
    runWithTimer("openai", () => analyzeWithOpenAI(absPath, context, extraAbsPaths)),
    runWithTimer("claude", () => analyzeWithClaude(absPath, context, extraAbsPaths)),
    runWithTimer("gemini", () => analyzeWithGemini(absPath, context, extraAbsPaths)),
  ];

  // Only add Grok if API key is configured
  if (process.env.XAI_API_KEY && process.env.XAI_API_KEY.length > 10) {
    agents.push(runWithTimer("grok", () => analyzeWithGrok(absPath, context, extraAbsPaths)));
  }

  const settled = await Promise.all(agents);

  const providers = settled;
  const successes = providers.filter((p) => p.result !== null).map((p) => p.result!);

  if (successes.length === 0) {
    const errors = providers.map((p) => `${p.provider}: ${p.error}`).join("; ");
    throw new Error(`All ${providers.length} AI providers failed — ${errors}`);
  }

  const consensus = mergeConsensus(successes);
  const agreementScore = calcAgreement(successes);

  return { providers, consensus, agreementScore };
}
