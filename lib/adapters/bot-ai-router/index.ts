/**
 * lib/adapters/bot-ai-router/index.ts
 * ─────────────────────────────────────────────────────────────────
 * Public API for the per-bot AI router.
 *
 *   import { routeBotAI, routeListBotHybrid } from "@/lib/adapters/bot-ai-router";
 *
 * The router is a non-invasive WRAPPER around lib/adapters/multi-ai.ts.
 * It does NOT modify multi-ai.ts in any way. Instead it ships its own
 * thin single-provider runners that import the same SDKs and call the
 * same APIs.
 *
 * Architecture choices (documented per §8 latitude):
 *   ✓ multi-ai.ts byte-identical, never imported as a side effect
 *   ✓ runMegabot() called only for botName === "megabot"
 *   ✓ Single-provider runners live INSIDE this module
 *   ✓ Shared parseLooseJson via lib/adapters/ai-parse.ts (CARRY-OVER FIX)
 *   ✓ Real token metering captured from every provider response (CARRY-OVER FIX)
 *   ✓ Hybrid mode (routeListBotHybrid) for ListBot Claude+Grok parallel run
 *
 * CMD-LISTBOT-HYBRID-001 — Step 3
 * ─────────────────────────────────────────────────────────────────
 */

import fs from "fs";
import path from "path";
import OpenAI from "openai";
import type { AiAnalysis } from "@/lib/types";
import { runMegabot } from "@/lib/adapters/multi-ai";
import { isDemoMode } from "@/lib/bot-mode";
import { parseLooseJson, parseAnyLooseJson } from "@/lib/adapters/ai-parse";

import { getBotConfig } from "./config";
import {
  computeActualCost,
  estimateProviderCost,
  isOverHardCeiling,
} from "./cost-tracker";
import {
  evaluateTriggers,
  fallbackChain,
  selectProviders,
  shouldRunSecondary,
} from "./provider-selector";
import {
  deriveMergedStrategy,
  logRoutingDecision,
} from "./logging";
import type {
  ProviderName,
  ProviderRunResult,
  RouterInput,
  RoutedAIResult,
  TokenUsage,
} from "./types";

// ─── Re-exports — public surface ───────────────────────────────

export { BOT_AI_CONFIG, getBotConfig } from "./config";
export {
  HARD_CEILING_USD,
  TIER_BUDGET_USD,
  TIER_BALANCED_USD,
  TIER_PREMIUM_USD,
  estimateProviderCost,
  estimateRunCost,
  computeActualCost,
  TOKEN_RATES_PER_1K,
} from "./cost-tracker";
export type {
  BotName,
  BotAIConfig,
  CostTier,
  ProviderName,
  TriggerName,
  RouterInput,
  RoutedAIResult,
  ProviderRunResult,
  TokenUsage,
} from "./types";

// ─── Constants ──────────────────────────────────────────────────

const PROVIDER_TIMEOUT_MS = 40_000;
const HYBRID_TIMEOUT_MS = 90_000; // ListBot hybrid runs longer prompts
const MAX_FALLBACK_ATTEMPTS = 3;

// ─── Internal: photo path helpers (mirror multi-ai.ts) ────────

function publicUrlToAbsPath(publicUrl: string): string {
  const clean = publicUrl.startsWith("/") ? publicUrl.slice(1) : publicUrl;
  return path.join(process.cwd(), "public", clean);
}

function fileToDataUrl(absPath: string): { dataUrl: string; base64: string; mime: string } {
  const ext = path.extname(absPath).toLowerCase();
  const mime =
    ext === ".png" ? "image/png"
    : ext === ".webp" ? "image/webp"
    : "image/jpeg";
  const base64 = fs.readFileSync(absPath, "base64");
  return { dataUrl: `data:${mime};base64,${base64}`, base64, mime };
}

// ─── Internal: shared default prompt builder (standard mode) ──

function buildDefaultPrompt(context?: string): string {
  const sellerBlock = context
    ? `\nSELLER-PROVIDED DATA (use as hints — verify against photos):\n${context}`
    : "\nNo seller data provided — rely entirely on photo analysis.";
  return `You are a seasoned estate sale appraiser working for LegacyLoop.
Analyze the image(s) and return a JSON object with item_name, category, brand,
model, maker, material, era, style, keywords[], condition_guess, condition_score,
condition_cosmetic, condition_functional, estimated_value_low/mid/high, is_antique,
is_collectible, recommended_title, summary, confidence (0-1), and any other
relevant fields. Be specific. Return ONLY valid JSON, no markdown fences.${sellerBlock}`;
}

// ─── Internal: per-provider single-call runners ───────────────
//
// Each helper returns { text, tokens } so the caller can choose
// whether to parse as AiAnalysis (standard) or as a raw object
// (hybrid ListBot path).
//
// Each helper supports a `rawPrompt` boolean — when true, the
// `prompt` is sent to the provider AS-IS. When false, it's wrapped
// via buildDefaultPrompt(prompt).

interface ProviderRawResult {
  text: string;
  tokens: TokenUsage;
}

const openaiClient =
  process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.length > 10
    ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    : null;

async function callOpenAIRaw(
  absPath: string,
  prompt: string,
  options: { timeoutMs?: number; maxTokens?: number } = {},
): Promise<ProviderRawResult> {
  if (!openaiClient) throw new Error("No OpenAI key configured");
  const { dataUrl } = fileToDataUrl(absPath);
  const completion = await openaiClient.chat.completions.create(
    {
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      max_tokens: options.maxTokens ?? 4096,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            { type: "image_url", image_url: { url: dataUrl } },
          ] as any,
        },
      ],
    },
    { timeout: options.timeoutMs ?? PROVIDER_TIMEOUT_MS },
  );
  const text = completion.choices?.[0]?.message?.content ?? "";
  // CARRY-OVER FIX: capture real token usage
  const usage = completion.usage;
  const tokens: TokenUsage = {
    inputTokens: usage?.prompt_tokens ?? null,
    outputTokens: usage?.completion_tokens ?? null,
    totalTokens: usage?.total_tokens ?? null,
  };
  return { text, tokens };
}

async function callClaudeRaw(
  absPath: string,
  prompt: string,
  options: { timeoutMs?: number; maxTokens?: number } = {},
): Promise<ProviderRawResult> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key || key.length < 10) throw new Error("No Anthropic key configured");
  const { base64, mime } = fileToDataUrl(absPath);
  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    options.timeoutMs ?? PROVIDER_TIMEOUT_MS,
  );
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.ANTHROPIC_MODEL || "claude-haiku-4-5-20251001",
        max_tokens: options.maxTokens ?? 4096,
        messages: [
          {
            role: "user",
            content: [
              { type: "image", source: { type: "base64", media_type: mime, data: base64 } },
              { type: "text", text: prompt },
            ],
          },
        ],
      }),
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`Claude API ${res.status}: ${(await res.text()).slice(0, 300)}`);
    const data = await res.json();
    const text = data.content?.[0]?.text ?? "";
    // CARRY-OVER FIX: capture real token usage
    const usage = data.usage ?? {};
    const inputT = usage.input_tokens ?? null;
    const outputT = usage.output_tokens ?? null;
    const tokens: TokenUsage = {
      inputTokens: inputT,
      outputTokens: outputT,
      totalTokens: inputT != null && outputT != null ? inputT + outputT : null,
    };
    return { text, tokens };
  } finally {
    clearTimeout(timeout);
  }
}

async function callGeminiRaw(
  absPath: string,
  prompt: string,
  options: { timeoutMs?: number; maxTokens?: number } = {},
): Promise<ProviderRawResult> {
  const key = process.env.GEMINI_API_KEY;
  if (!key || key.length < 10) throw new Error("No Gemini key configured");
  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
  const { base64, mime } = fileToDataUrl(absPath);

  const res = await Promise.race([
    fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
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
          maxOutputTokens: options.maxTokens ?? 4096,
        },
      }),
    }),
    new Promise<never>((_, reject) =>
      setTimeout(
        () => reject(new Error("Provider timeout")),
        options.timeoutMs ?? PROVIDER_TIMEOUT_MS,
      ),
    ),
  ]);
  if (!res.ok) throw new Error(`Gemini API ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  // CARRY-OVER FIX: capture real token usage
  const usage = data.usageMetadata ?? {};
  const tokens: TokenUsage = {
    inputTokens: usage.promptTokenCount ?? null,
    outputTokens: usage.candidatesTokenCount ?? null,
    totalTokens: usage.totalTokenCount ?? null,
  };
  return { text, tokens };
}

async function callGrokRaw(
  absPath: string,
  prompt: string,
  options: { timeoutMs?: number; maxTokens?: number } = {},
): Promise<ProviderRawResult> {
  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey || apiKey.length < 10) throw new Error("No XAI_API_KEY configured");
  const baseUrl = process.env.XAI_BASE_URL || "https://api.x.ai/v1";
  const model = process.env.XAI_MODEL_VISION || "grok-4";
  const { dataUrl } = fileToDataUrl(absPath);

  const res = await Promise.race([
    fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: prompt },
          {
            role: "user",
            content: [
              { type: "text", text: "Analyze this photo. Return JSON only." },
              { type: "image_url", image_url: { url: dataUrl } },
            ],
          },
        ],
        max_tokens: options.maxTokens ?? 4096,
        temperature: 0.7,
      }),
    }),
    new Promise<never>((_, reject) =>
      setTimeout(
        () => reject(new Error("Provider timeout")),
        options.timeoutMs ?? PROVIDER_TIMEOUT_MS,
      ),
    ),
  ]);
  if (!res.ok) throw new Error(`Grok API ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const data = await res.json();
  const text = data.choices?.[0]?.message?.content ?? "";
  // CARRY-OVER FIX: capture real token usage
  const usage = data.usage ?? {};
  const tokens: TokenUsage = {
    inputTokens: usage.prompt_tokens ?? null,
    outputTokens: usage.completion_tokens ?? null,
    totalTokens: usage.total_tokens ?? null,
  };
  return { text, tokens };
}

/** Dispatch a raw provider call by name. */
async function callProviderRaw(
  provider: ProviderName,
  absPath: string,
  prompt: string,
  options: { timeoutMs?: number; maxTokens?: number } = {},
): Promise<ProviderRawResult> {
  switch (provider) {
    case "openai": return callOpenAIRaw(absPath, prompt, options);
    case "claude": return callClaudeRaw(absPath, prompt, options);
    case "gemini": return callGeminiRaw(absPath, prompt, options);
    case "grok":   return callGrokRaw(absPath, prompt, options);
  }
}

/**
 * Standard-mode runProvider: builds the default appraiser prompt
 * from the context, parses output as AiAnalysis, attaches token
 * metrics + actualCostUsd to the ProviderRunResult.
 */
async function runProvider(
  provider: ProviderName,
  absPath: string,
  context?: string,
): Promise<ProviderRunResult> {
  const start = Date.now();
  try {
    const prompt = buildDefaultPrompt(context);
    const { text, tokens } = await callProviderRaw(provider, absPath, prompt);
    const parsed = parseLooseJson(text);
    if (!parsed) throw new Error(`${provider} returned unparseable JSON`);
    return {
      provider,
      result: parsed,
      error: null,
      durationMs: Date.now() - start,
      tokens,
      actualCostUsd: computeActualCost(provider, tokens),
    };
  } catch (e: any) {
    return {
      provider,
      result: null,
      error: e?.message ?? String(e),
      durationMs: Date.now() - start,
    };
  }
}

// ─── Internal: simple consensus merge for primary + secondary ─

function mergePair(primary: AiAnalysis, secondary: AiAnalysis): AiAnalysis {
  const avg = (a?: number | null, b?: number | null): number | null => {
    if (a == null && b == null) return null;
    if (a == null) return b ?? null;
    if (b == null) return a;
    return Math.round((a + b) / 2);
  };
  return {
    ...primary,
    estimated_value_low: avg(primary.estimated_value_low, secondary.estimated_value_low),
    estimated_value_mid: avg(primary.estimated_value_mid, secondary.estimated_value_mid),
    estimated_value_high: avg(primary.estimated_value_high, secondary.estimated_value_high),
    confidence: (primary.confidence + secondary.confidence) / 2,
    is_antique: primary.is_antique || secondary.is_antique || null,
    is_collectible: primary.is_collectible || secondary.is_collectible || null,
    keywords: Array.from(new Set([...(primary.keywords ?? []), ...(secondary.keywords ?? [])])).slice(0, 15),
  };
}

// ─── Public: routeBotAI() ──────────────────────────────────────

/**
 * Route a bot's AI call through the per-bot router.
 */
export async function routeBotAI(input: RouterInput): Promise<RoutedAIResult> {
  const startedAt = Date.now();
  const config = getBotConfig(input.botName);
  const demoMode = isDemoMode();

  const photoArr = Array.isArray(input.photoPath) ? input.photoPath : [input.photoPath];
  const absPath = publicUrlToAbsPath(photoArr[0]);

  // ── Special case: megabot defers to runMegabot ──
  if (input.botName === "megabot") {
    try {
      const mega = await runMegabot(input.photoPath, input.context);
      const merged = mega.consensus;
      const providersUsed = mega.providers
        .filter((p) => p.result !== null)
        .map((p) => p.provider) as ProviderName[];
      const providersAttempted = mega.providers.map((p) => p.provider) as ProviderName[];
      const result: RoutedAIResult = {
        primary: {
          provider: providersUsed[0] ?? "openai",
          result: merged,
          error: null,
          durationMs: Date.now() - startedAt,
        },
        merged,
        providersUsed,
        providersAttempted,
        costUsd: providersAttempted.reduce((s, p) => s + estimateProviderCost(p), 0),
        latencyMs: Date.now() - startedAt,
        triggersFired: [],
        fallbackUsed: false,
        degraded: false,
      };
      if (!input.options?.skipLogging) {
        void logRoutingDecision({
          itemId: input.itemId,
          payload: {
            botName: "megabot",
            primary: result.primary.provider,
            triggersFired: [],
            providersAttempted,
            providersUsed,
            costUsd: result.costUsd,
            latencyMs: result.latencyMs,
            fallbackUsed: false,
            degraded: false,
            confidence: merged?.confidence ?? null,
            mergedStrategy: "merged_consensus",
            demoMode,
            timestamp: new Date().toISOString(),
          },
        });
      }
      return result;
    } catch (e: any) {
      return {
        primary: {
          provider: "openai",
          result: null,
          error: e?.message ?? "megabot failed",
          durationMs: Date.now() - startedAt,
        },
        merged: null,
        providersUsed: [],
        providersAttempted: ["openai", "claude", "gemini", "grok"],
        costUsd: 0,
        latencyMs: Date.now() - startedAt,
        triggersFired: [],
        fallbackUsed: false,
        degraded: true,
        error: e?.message ?? "megabot failed",
      };
    }
  }

  // ── Standard bot flow ──
  const { primary: primaryProvider, secondary: secondaryProvider } = selectProviders(config, input);

  const providersAttempted: ProviderName[] = [];
  const providersUsed: ProviderName[] = [];
  let totalCost = 0;
  let actualCost = 0;
  let fallbackUsed = false;

  // Run primary with fallback chain on failure
  let primaryResult = await runProvider(primaryProvider, absPath, input.context);
  providersAttempted.push(primaryProvider);
  totalCost += estimateProviderCost(primaryProvider);
  if (primaryResult.actualCostUsd != null) actualCost += primaryResult.actualCostUsd;
  if (primaryResult.result) providersUsed.push(primaryProvider);

  if (!primaryResult.result) {
    const chain = fallbackChain(primaryProvider, providersAttempted);
    let attempts = 0;
    for (const fallback of chain) {
      if (attempts >= MAX_FALLBACK_ATTEMPTS) break;
      if (isOverHardCeiling(totalCost + estimateProviderCost(fallback))) break;
      attempts++;
      fallbackUsed = true;
      const fallbackResult = await runProvider(fallback, absPath, input.context);
      providersAttempted.push(fallback);
      totalCost += estimateProviderCost(fallback);
      if (fallbackResult.actualCostUsd != null) actualCost += fallbackResult.actualCostUsd;
      if (fallbackResult.result) {
        primaryResult = fallbackResult;
        providersUsed.push(fallback);
        break;
      }
    }
  }

  const triggersFired = evaluateTriggers(input, primaryResult.result, config);

  let secondaryResult: ProviderRunResult | undefined;
  if (
    secondaryProvider &&
    shouldRunSecondary(config, input, triggersFired, totalCost)
  ) {
    secondaryResult = await runProvider(secondaryProvider, absPath, input.context);
    providersAttempted.push(secondaryProvider);
    totalCost += estimateProviderCost(secondaryProvider);
    if (secondaryResult.actualCostUsd != null) actualCost += secondaryResult.actualCostUsd;
    if (secondaryResult.result) providersUsed.push(secondaryProvider);
  }

  let merged: AiAnalysis | null = primaryResult.result;
  if (primaryResult.result && secondaryResult?.result) {
    merged = mergePair(primaryResult.result, secondaryResult.result);
  }

  const degraded = !primaryResult.result && !secondaryResult?.result;
  const result: RoutedAIResult = {
    primary: primaryResult,
    secondary: secondaryResult,
    merged,
    providersUsed,
    providersAttempted,
    costUsd: Number(totalCost.toFixed(5)),
    actualCostUsd: actualCost > 0 ? Number(actualCost.toFixed(6)) : undefined,
    latencyMs: Date.now() - startedAt,
    triggersFired,
    fallbackUsed,
    degraded,
    error: degraded ? primaryResult.error ?? "All providers failed" : undefined,
  };

  if (!input.options?.skipLogging) {
    void logRoutingDecision({
      itemId: input.itemId,
      payload: {
        botName: input.botName,
        primary: primaryProvider,
        secondary: secondaryProvider ?? undefined,
        triggersFired,
        providersAttempted,
        providersUsed,
        costUsd: result.costUsd,
        actualCostUsd: result.actualCostUsd,
        latencyMs: result.latencyMs,
        fallbackUsed,
        degraded,
        confidence: merged?.confidence ?? null,
        mergedStrategy: deriveMergedStrategy(
          !!primaryResult.result,
          !!secondaryResult?.result,
          degraded,
        ),
        tokens: {
          [primaryResult.provider]: {
            input: primaryResult.tokens?.inputTokens ?? null,
            output: primaryResult.tokens?.outputTokens ?? null,
            total: primaryResult.tokens?.totalTokens ?? null,
          },
          ...(secondaryResult?.tokens
            ? {
                [secondaryResult.provider]: {
                  input: secondaryResult.tokens.inputTokens,
                  output: secondaryResult.tokens.outputTokens,
                  total: secondaryResult.tokens.totalTokens,
                },
              }
            : {}),
        },
        demoMode,
        error: result.error,
        timestamp: new Date().toISOString(),
      },
    });
  }

  return result;
}

// ─── Public: routeListBotHybrid() ──────────────────────────────

export interface ListBotHybridInput {
  itemId: string;
  photoPath: string | string[];
  /** Full marketplace prompt text — passed AS-IS to Claude. */
  marketplacePrompt: string;
  /** Full social prompt text — passed AS-IS to Grok. */
  socialPrompt: string;
  /** Optional logging skip flag for tests. */
  skipLogging?: boolean;
}

export interface ListBotHybridResult {
  marketplace: ProviderRunResult & { rawResult: any };
  social: ProviderRunResult & { rawResult: any };
  costUsd: number;
  actualCostUsd: number;
  latencyMs: number;
  degraded: boolean;
  error?: string;
}

/**
 * Run the ListBot hybrid: Claude + Grok in parallel, raw prompts,
 * larger token budget, longer timeout. The caller (listbot route)
 * is responsible for building the rich prompts + merging the
 * results via mergeListBotHybrid().
 *
 * Logs ONE BOT_AI_ROUTING EventLog row with botName="listbot",
 * providersAttempted=[claude,grok], triggersFired=["always"].
 */
export async function routeListBotHybrid(
  input: ListBotHybridInput,
): Promise<ListBotHybridResult> {
  const startedAt = Date.now();
  const photoArr = Array.isArray(input.photoPath) ? input.photoPath : [input.photoPath];
  const absPath = publicUrlToAbsPath(photoArr[0]);
  const demoMode = isDemoMode();

  const runOne = async (
    provider: ProviderName,
    prompt: string,
  ): Promise<ProviderRunResult & { rawResult: any }> => {
    const start = Date.now();
    try {
      const { text, tokens } = await callProviderRaw(provider, absPath, prompt, {
        timeoutMs: HYBRID_TIMEOUT_MS,
        maxTokens: 16384, // ListBot needs the room — 13 platforms each
      });
      const rawResult = parseAnyLooseJson(text);
      if (!rawResult) {
        return {
          provider,
          result: null,
          error: `${provider} returned unparseable JSON`,
          durationMs: Date.now() - start,
          tokens,
          actualCostUsd: computeActualCost(provider, tokens),
          rawResult: null,
        };
      }
      return {
        provider,
        result: null, // ListBot output isn't AiAnalysis-shaped
        error: null,
        durationMs: Date.now() - start,
        tokens,
        actualCostUsd: computeActualCost(provider, tokens),
        rawResult,
      };
    } catch (e: any) {
      return {
        provider,
        result: null,
        error: e?.message ?? String(e),
        durationMs: Date.now() - start,
        rawResult: null,
      };
    }
  };

  const [marketplace, social] = await Promise.all([
    runOne("claude", input.marketplacePrompt),
    runOne("grok", input.socialPrompt),
  ]);

  const totalEstCost =
    estimateProviderCost("claude") + estimateProviderCost("grok");
  const totalActualCost =
    (marketplace.actualCostUsd ?? 0) + (social.actualCostUsd ?? 0);

  const degraded = !marketplace.rawResult && !social.rawResult;

  const result: ListBotHybridResult = {
    marketplace,
    social,
    costUsd: Number(totalEstCost.toFixed(5)),
    actualCostUsd: Number(totalActualCost.toFixed(6)),
    latencyMs: Date.now() - startedAt,
    degraded,
    error: degraded
      ? `${marketplace.error ?? ""} | ${social.error ?? ""}`.trim()
      : undefined,
  };

  // Fire-and-forget log
  if (!input.skipLogging) {
    const providersUsed: ProviderName[] = [];
    if (marketplace.rawResult) providersUsed.push("claude");
    if (social.rawResult) providersUsed.push("grok");

    void logRoutingDecision({
      itemId: input.itemId,
      payload: {
        botName: "listbot",
        primary: "claude",
        secondary: "grok",
        triggersFired: ["always"],
        providersAttempted: ["claude", "grok"],
        providersUsed,
        costUsd: result.costUsd,
        actualCostUsd: result.actualCostUsd,
        latencyMs: result.latencyMs,
        fallbackUsed: false,
        degraded,
        confidence: null,
        mergedStrategy: degraded ? "degraded" : "merged_consensus",
        tokens: {
          claude: {
            input: marketplace.tokens?.inputTokens ?? null,
            output: marketplace.tokens?.outputTokens ?? null,
            total: marketplace.tokens?.totalTokens ?? null,
          },
          grok: {
            input: social.tokens?.inputTokens ?? null,
            output: social.tokens?.outputTokens ?? null,
            total: social.tokens?.totalTokens ?? null,
          },
        },
        demoMode,
        error: result.error,
        timestamp: new Date().toISOString(),
      },
    });
  }

  return result;
}
