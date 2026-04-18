/**
 * Pricing Jury — V1a
 *
 * Deliberative AI adjudication layer. When consensus sources disagree,
 * Claude Sonnet reasons about which source's methodology is most credible
 * for the specific item and returns ONE resolved list/accept/floor price
 * plus a 2-sentence rationale.
 *
 * Module-only. V1b wires this into reconcile.ts when shouldFireJury
 * returns true.
 *
 * CMD-AI-JURY-V1a
 */

import { prisma } from "@/lib/db";
import type {
  PricingConsensus,
  PricingSourceName,
} from "@/lib/pricing/reconcile";

// ── Types ──────────────────────────────────────────────────────────

export interface JuryItemContext {
  itemId: string;
  title: string;
  category?: string | null;
  brand?: string | null;
  condition?: string | null;
  ageYears?: number | null;
  locationZip?: string | null;
}

export interface JurySourceInput {
  name: PricingSourceName;
  listPrice?: number;
  acceptPrice?: number;
  floorPrice?: number;
  valueLow?: number;
  valueHigh?: number;
  confidence?: number;
  ageHours: number;
}

export interface JuryInput {
  item: JuryItemContext;
  sources: JurySourceInput[];
  spread: {
    listPrice?: number;
    acceptPrice?: number;
    floorPrice?: number;
    valueRange?: number;
  };
  force?: boolean;
}

export interface JuryVerdict {
  itemId: string;
  listPrice: number;
  acceptPrice: number;
  floorPrice: number;
  confidence: number;
  rationale: string;
  sourcesCredited: PricingSourceName[];
  sourcesRejected: string[];
  modelUsed: string;
  costEstimateUsd: number;
  latencyMs: number;
  cachedAt: string;
  v: 1;
}

export interface JuryResult {
  status: "ok" | "cache_hit" | "error" | "low_spread_skip";
  verdict: JuryVerdict | null;
  cacheAgeMs?: number;
  errorMessage?: string;
}

// ── Constants ──────────────────────────────────────────────────────

const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const MIN_SPREAD_TO_FIRE = 0.30;
const MAX_RESPONSE_TOKENS = 400;
const MODEL = "claude-sonnet-4-6";
const COST_PER_CALL_USD = 0.001;

// ── Should-fire ─────────────────────────────────────────────────────

/**
 * Exported so CMD-AI-JURY-V1b (wire-in) can use the same threshold
 * without duplicating the constant.
 */
export function shouldFireJury(consensus: PricingConsensus): boolean {
  if (!consensus?.dissents || consensus.dissents.length === 0) return false;
  const maxSpread = Math.max(...consensus.dissents.map(d => d.spreadPct));
  return maxSpread >= MIN_SPREAD_TO_FIRE;
}

// ── Cache ──────────────────────────────────────────────────────────

async function readCachedVerdict(itemId: string): Promise<{
  verdict: JuryVerdict | null; ageMs: number;
}> {
  try {
    const cached = await prisma.eventLog.findFirst({
      where: { itemId, eventType: "PRICING_JURY_VERDICT" },
      orderBy: { createdAt: "desc" },
      select: { payload: true, createdAt: true },
    });
    if (!cached?.payload) return { verdict: null, ageMs: Infinity };
    const verdict = JSON.parse(cached.payload) as JuryVerdict;
    const ageMs = Date.now() - cached.createdAt.getTime();
    return { verdict, ageMs };
  } catch {
    return { verdict: null, ageMs: Infinity };
  }
}

async function persistVerdict(itemId: string, verdict: JuryVerdict): Promise<void> {
  await prisma.eventLog.create({
    data: {
      itemId,
      eventType: "PRICING_JURY_VERDICT",
      payload: JSON.stringify(verdict),
    },
  }).catch(err => console.error("[jury] persist failed", err));
}

async function logCacheHit(itemId: string, ageMs: number): Promise<void> {
  await prisma.eventLog.create({
    data: {
      itemId,
      eventType: "PRICING_JURY_CACHE_HIT",
      payload: JSON.stringify({ ageMs }),
    },
  }).catch(() => {});
}

async function logCacheMiss(itemId: string): Promise<void> {
  await prisma.eventLog.create({
    data: {
      itemId,
      eventType: "PRICING_JURY_CACHE_MISS",
      payload: JSON.stringify({ at: new Date().toISOString() }),
    },
  }).catch(() => {});
}

// ── Prompt + parser ─────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are LegacyLoop's Pricing Jury.
Role: Resolve disagreements between multiple pricing sources by reasoning about which source's methodology is most credible FOR THIS SPECIFIC ITEM.

Inputs: one item context + N source opinions with their prices and confidence.

Output: valid JSON only, matching this schema:
{
  "listPrice": number,
  "acceptPrice": number,
  "floorPrice": number,
  "confidence": number (0-100),
  "rationale": string (2 sentences max),
  "sourcesCredited": string[] (source names you weighted most),
  "sourcesRejected": string[] (source names you discounted, with brief reason)
}

Constraints:
- listPrice >= acceptPrice >= floorPrice (invariant)
- All prices positive integers in USD
- confidence reflects your own certainty after adjudicating
- rationale must name WHICH SOURCE'S argument you weighted, not just output prices
- No prose outside the JSON. No markdown fences. Just the JSON object.`;

function buildUserPrompt(input: JuryInput): string {
  return JSON.stringify({
    item: input.item,
    sources: input.sources,
    spread: input.spread,
  }, null, 2);
}

function parseJuryResponse(raw: string): Partial<JuryVerdict> | null {
  const cleaned = raw.trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```\s*$/, "")
    .trim();
  try {
    const parsed = JSON.parse(cleaned);
    if (typeof parsed !== "object" || parsed === null) return null;
    return parsed as Partial<JuryVerdict>;
  } catch {
    return null;
  }
}

function validateVerdict(raw: Partial<JuryVerdict>): boolean {
  if (typeof raw.listPrice !== "number" || raw.listPrice <= 0) return false;
  if (typeof raw.acceptPrice !== "number" || raw.acceptPrice <= 0) return false;
  if (typeof raw.floorPrice !== "number" || raw.floorPrice <= 0) return false;
  if (typeof raw.confidence !== "number") return false;
  if (raw.listPrice < raw.acceptPrice) return false;
  if (raw.acceptPrice < raw.floorPrice) return false;
  if (typeof raw.rationale !== "string" || raw.rationale.length < 10) return false;
  if (!Array.isArray(raw.sourcesCredited)) return false;
  return true;
}

// ── Claude call (direct fetch; mirrors lib/intelligence/generate.ts) ──

async function callClaudeSonnet(
  systemPrompt: string,
  userPrompt: string,
): Promise<string> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key || key.length < 10) {
    throw new Error("ANTHROPIC_API_KEY not configured");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30_000);

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: MAX_RESPONSE_TOKENS,
        temperature: 0.3,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const errBody = await res.text().catch(() => "");
      throw new Error(`Claude API ${res.status}: ${errBody.slice(0, 200)}`);
    }

    const data = await res.json();
    const text = (data.content || [])
      .filter((c: { type?: string }) => c.type === "text")
      .map((c: { text?: string }) => c.text || "")
      .join("");
    return text;
  } finally {
    clearTimeout(timeout);
  }
}

// ── Main ───────────────────────────────────────────────────────────

export async function runPricingJury(input: JuryInput): Promise<JuryResult> {
  const startedAt = Date.now();

  if (!input.force) {
    const { verdict, ageMs } = await readCachedVerdict(input.item.itemId);
    if (verdict && ageMs < CACHE_TTL_MS) {
      await logCacheHit(input.item.itemId, ageMs);
      return { status: "cache_hit", verdict, cacheAgeMs: ageMs };
    }
  }

  const maxSpread = Math.max(
    input.spread.listPrice ?? 0,
    input.spread.acceptPrice ?? 0,
    input.spread.floorPrice ?? 0,
    input.spread.valueRange ?? 0,
  );
  if (maxSpread < MIN_SPREAD_TO_FIRE) {
    return { status: "low_spread_skip", verdict: null };
  }

  await logCacheMiss(input.item.itemId);

  let responseText: string;
  try {
    responseText = await callClaudeSonnet(
      SYSTEM_PROMPT,
      buildUserPrompt(input),
    );
  } catch (err) {
    return {
      status: "error",
      verdict: null,
      errorMessage: err instanceof Error ? err.message : "Claude call failed",
    };
  }

  const parsed = parseJuryResponse(responseText);
  if (!parsed || !validateVerdict(parsed)) {
    return {
      status: "error",
      verdict: null,
      errorMessage: "Jury response did not match schema / invariants",
    };
  }

  const verdict: JuryVerdict = {
    itemId: input.item.itemId,
    listPrice: Math.round(parsed.listPrice as number),
    acceptPrice: Math.round(parsed.acceptPrice as number),
    floorPrice: Math.round(parsed.floorPrice as number),
    confidence: Math.max(0, Math.min(100, Math.round(parsed.confidence as number))),
    rationale: parsed.rationale as string,
    sourcesCredited: (parsed.sourcesCredited ?? []) as PricingSourceName[],
    sourcesRejected: (parsed.sourcesRejected ?? []) as string[],
    modelUsed: MODEL,
    costEstimateUsd: COST_PER_CALL_USD,
    latencyMs: Date.now() - startedAt,
    cachedAt: new Date().toISOString(),
    v: 1 as const,
  };

  await persistVerdict(input.item.itemId, verdict);

  return { status: "ok", verdict };
}
