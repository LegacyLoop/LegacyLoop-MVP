/**
 * AnalyzeBot Category Deep-Dive (V9) — CMD-ANALYZEBOT-CATEGORY-DEEP-DIVE-V9
 *
 * Category-gated specialty second-pass. When merged analysis classifies
 * an item into a specialty category (first wave: Musical Instruments),
 * fire a structured Claude Sonnet prompt that extracts era / variant /
 * provenance signals the general AnalyzeBot cannot afford to probe
 * for every item.
 *
 * Does NOT mutate the merged analysis — returns parallel metadata for
 * persistence at `rawJson._specialtyDetail`.
 *
 * Routes around locked lib/adapters/multi-ai.ts by making a direct
 * Anthropic fetch call with the same request shape.
 */

import { readPhotoAsBuffer, guessMimeType } from "@/lib/adapters/storage";
import { loadSkillPack } from "@/lib/bots/skill-loader";

// ─── Public types ───────────────────────────────────────────────────────

export type SpecialtyKind =
  | "musical_instrument"
  | "antique"
  | "collectible"
  | "jewelry_watch"
  | "power_equipment";

export interface SpecialtyDetail {
  kind: SpecialtyKind;
  era?: string | null;
  variant?: string | null;
  provenance?: string[] | null;
  confidence: number;
  rationale?: string | null;
  durationMs: number;
}

interface BaseAnalysisSummary {
  item_name?: string;
  category?: string;
  description?: string;
}

// ─── Shape validation (no Zod dep) ──────────────────────────────────────

function validateSpecialtyResponse(raw: unknown): {
  era: string | null;
  variant: string | null;
  provenance: string[] | null;
  confidence: number;
  rationale: string | null;
} | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;

  // Confidence is required and must be a 0-1 number
  if (typeof r.confidence !== "number" || !Number.isFinite(r.confidence)) return null;
  if (r.confidence < 0 || r.confidence > 1) return null;

  const era = typeof r.era === "string" && r.era.trim() ? r.era.trim() : null;
  const variant = typeof r.variant === "string" && r.variant.trim() ? r.variant.trim() : null;
  const rationale = typeof r.rationale === "string" && r.rationale.trim() ? r.rationale.trim() : null;

  let provenance: string[] | null = null;
  if (Array.isArray(r.provenance)) {
    const filtered = r.provenance
      .filter((x): x is string => typeof x === "string" && x.trim().length > 0)
      .map((x) => x.trim());
    provenance = filtered.length > 0 ? filtered : null;
  }

  // Reject empty-signal extractions — nothing useful to persist
  if (era == null && variant == null && provenance == null && rationale == null) {
    return null;
  }

  return { era, variant, provenance, confidence: r.confidence, rationale };
}

// ─── Anthropic call ─────────────────────────────────────────────────────

const SPECIALTY_MODEL = process.env.ANTHROPIC_SPECIALTY_MODEL
  || process.env.ANTHROPIC_MODEL
  || "claude-haiku-4-5-20251001";

function buildSpecialtyInstruction(kind: SpecialtyKind, base: BaseAnalysisSummary): string {
  const summary = {
    item_name: base.item_name ?? "Unknown",
    category: base.category ?? "Unknown",
    description: (base.description ?? "").slice(0, 600),
  };
  const schema = `{ "era": string|null, "variant": string|null, "provenance": string[]|null, "confidence": number (0-1), "rationale": string|null }`;
  return [
    `SPECIALTY CATEGORY DEEP-DIVE — ${kind.toUpperCase()}`,
    `BASE ANALYSIS:`,
    JSON.stringify(summary, null, 2),
    ``,
    `Extract era (decade), variant (model/closest style reference), provenance (hallmarks, made-in, serial prefix, visible labels).`,
    `Return ONLY a JSON object matching this schema:`,
    schema,
    `Use null when a signal is not visible. Be honest about confidence — low is a feature.`,
  ].join("\n");
}

export async function extractSpecialty(
  kind: SpecialtyKind,
  imagePaths: string[],
  baseAnalysis: BaseAnalysisSummary
): Promise<SpecialtyDetail | null> {
  const started = Date.now();
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key || key.length < 10 || key.includes("YOUR_CLAUDE")) {
    return null;
  }
  if (imagePaths.length === 0) return null;

  // Build image blocks (first photo only — specialty ID typically needs one clear angle)
  const imageBlocks: Array<Record<string, unknown>> = [];
  try {
    const buf = await readPhotoAsBuffer(imagePaths[0]);
    const mime = guessMimeType(imagePaths[0]);
    const b64 = buf.toString("base64");
    imageBlocks.push({
      type: "image",
      source: { type: "base64", media_type: mime, data: b64 },
    });
  } catch (imgErr) {
    console.warn("[SPECIALTY_DEEP_DIVE] primary photo read failed:", (imgErr as any)?.message);
    return null;
  }

  // System prompt uses the full AnalyzeBot skill pack (19 sits in there via loadSkillPack)
  const pack = loadSkillPack("analyzebot");
  const systemPrompt = pack.systemPromptBlock || "";

  const userInstruction = buildSpecialtyInstruction(kind, baseAnalysis);

  const body = {
    model: SPECIALTY_MODEL,
    max_tokens: 700,
    system: [
      {
        type: "text" as const,
        text: systemPrompt,
        cache_control: { type: "ephemeral" as const },
      },
    ],
    messages: [
      {
        role: "user" as const,
        content: [
          ...imageBlocks,
          { type: "text" as const, text: userInstruction },
        ],
      },
    ],
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25_000);

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
      signal: controller.signal,
    });
    if (!res.ok) {
      const t = await res.text();
      console.warn(`[SPECIALTY_DEEP_DIVE] API ${res.status}: ${t.slice(0, 200)}`);
      return null;
    }
    const data = await res.json();
    const rawText: string = data?.content?.[0]?.text ?? "";
    if (!rawText) return null;

    // Extract JSON (tolerant of leading/trailing markdown fences)
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;
    let parsed: unknown;
    try {
      parsed = JSON.parse(jsonMatch[0]);
    } catch {
      return null;
    }

    const validated = validateSpecialtyResponse(parsed);
    if (!validated) return null;

    return {
      kind,
      era: validated.era,
      variant: validated.variant,
      provenance: validated.provenance,
      confidence: validated.confidence,
      rationale: validated.rationale,
      durationMs: Date.now() - started,
    };
  } catch (err) {
    console.warn("[SPECIALTY_DEEP_DIVE] request failed:", (err as any)?.message ?? err);
    return null;
  } finally {
    clearTimeout(timeout);
  }
}
