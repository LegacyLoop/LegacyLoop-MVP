import fs from "fs";
import path from "path";
import OpenAI from "openai";
import type { AiAnalysis } from "@/lib/types";

// ─── Shared helpers ────────────────────────────────────────────────────────

function publicUrlToAbsPath(publicUrl: string) {
  const clean = publicUrl.startsWith("/") ? publicUrl.slice(1) : publicUrl;
  return path.join(process.cwd(), "public", clean);
}

function fileToDataUrl(absPath: string) {
  const ext = path.extname(absPath).toLowerCase();
  const mime =
    ext === ".png" ? "image/png"
    : ext === ".webp" ? "image/webp"
    : "image/jpeg";
  const base64 = fs.readFileSync(absPath, "base64");
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

async function analyzeWithOpenAI(absPath: string, context?: string): Promise<AiAnalysis> {
  if (!openai) throw new Error("No OpenAI key configured");

  const { dataUrl } = fileToDataUrl(absPath);
  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
  const prompt = buildComprehensivePrompt(context) + OPENAI_SPECIALTY;

  const resp = await openai.responses.create({
    model,
    input: [
      {
        role: "user",
        content: [
          { type: "input_text", text: prompt },
          { type: "input_image", image_url: dataUrl, detail: "auto" },
        ],
      },
    ],
    text: { format: { type: "text" } },
  });

  const parsed = parseLooseJson(resp.output_text);
  if (!parsed) throw new Error("OpenAI returned unparseable response");
  return parsed;
}

// ─── Claude analysis (comprehensive) ────────────────────────────────────

async function analyzeWithClaude(absPath: string, context?: string): Promise<AiAnalysis> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key || key.includes("YOUR_CLAUDE") || key.length < 10) throw new Error("No Anthropic key configured");

  const { base64, mime } = fileToDataUrl(absPath);
  const prompt = buildComprehensivePrompt(context) + CLAUDE_SPECIALTY;

  const body = {
    model: "claude-haiku-4-5-20251001",
    max_tokens: 4096,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: { type: "base64", media_type: mime, data: base64 },
          },
          { type: "text", text: prompt },
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
    const parsed = parseLooseJson(text);
    if (!parsed) throw new Error("Claude returned unparseable JSON");
    return parsed;
  } finally {
    clearTimeout(claudeTimeout);
  }
}

// ─── Gemini analysis (comprehensive) ────────────────────────────────────

async function analyzeWithGemini(absPath: string, context?: string): Promise<AiAnalysis> {
  const key = process.env.GEMINI_API_KEY;
  if (!key || key.includes("YOUR_GEMINI") || key.length < 10) throw new Error("No Gemini key configured");

  const { base64, mime } = fileToDataUrl(absPath);
  const model = "gemini-2.5-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
  const prompt = buildComprehensivePrompt(context) + GEMINI_SPECIALTY;

  const body = {
    contents: [
      {
        parts: [
          { inline_data: { mime_type: mime, data: base64 } },
          { text: prompt },
        ],
      },
    ],
    generationConfig: {
      responseMimeType: "application/json",
      maxOutputTokens: 4096,
    },
  };

  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Gemini API ${res.status}: ${t.slice(0, 300)}`);
  }

  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  const parsed = parseLooseJson(text);
  if (!parsed) throw new Error("Gemini returned unparseable JSON");
  return parsed;
}

// ─── Grok analysis (xAI — OpenAI-compatible chat completions) ─────────

async function analyzeWithGrok(absPath: string, context?: string): Promise<AiAnalysis> {
  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey || apiKey.length < 10) throw new Error("No XAI_API_KEY configured");

  const baseUrl = process.env.XAI_BASE_URL || "https://api.x.ai/v1";
  const model = process.env.XAI_MODEL_VISION || "grok-4";
  const { dataUrl } = fileToDataUrl(absPath);
  const prompt = buildComprehensivePrompt(context) + GROK_SPECIALTY;

  const res = await fetch(`${baseUrl}/chat/completions`, {
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
            { type: "text", text: "Analyze the item in these photos and return your assessment as JSON." },
            { type: "image_url", image_url: { url: dataUrl } },
          ],
        },
      ],
      max_tokens: 4096,
      temperature: 0.7,
    }),
  });

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

  return {
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
  };
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
  photoPath: string,
  context?: string
): Promise<MegabotResult> {
  const absPath = publicUrlToAbsPath(photoPath);

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
    runWithTimer("openai", () => analyzeWithOpenAI(absPath, context)),
    runWithTimer("claude", () => analyzeWithClaude(absPath, context)),
    runWithTimer("gemini", () => analyzeWithGemini(absPath, context)),
  ];

  // Only add Grok if API key is configured
  if (process.env.XAI_API_KEY && process.env.XAI_API_KEY.length > 10) {
    agents.push(runWithTimer("grok", () => analyzeWithGrok(absPath, context)));
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
