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
  // CMD-BUYERBOT-HYBRID-5A: Step 5 Round A
  BuyerBotHybridInput,
  BuyerBotHybridResult,
  // CMD-RECONBOT-API-A: Step 6 Round A
  ReconBotHybridInput,
  ReconBotHybridResult,
  // CMD-ANTIQUEBOT-CORE-A: Step 7 Round A
  AntiqueBotHybridInput,
  AntiqueBotHybridResult,
  // CMD-COLLECTIBLESBOT-CORE-A: Step 8 Round A
  CollectiblesBotHybridInput,
  CollectiblesBotHybridResult,
  // CMD-CARBOT-CORE-A: Step 9 Round A
  CarBotHybridInput,
  CarBotHybridResult,
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
  // CMD-BUYERBOT-HYBRID-5A: Step 5 Round A
  BuyerBotHybridInput,
  BuyerBotHybridResult,
  // CMD-RECONBOT-API-A: Step 6 Round A
  ReconBotHybridInput,
  ReconBotHybridResult,
  // CMD-ANTIQUEBOT-CORE-A: Step 7 Round A
  AntiqueBotHybridInput,
  AntiqueBotHybridResult,
  // CMD-COLLECTIBLESBOT-CORE-A: Step 8 Round A
  CollectiblesBotHybridInput,
  CollectiblesBotHybridResult,
  // CMD-CARBOT-CORE-A: Step 9 Round A
  CarBotHybridInput,
  CarBotHybridResult,
} from "./types";

// ─── Constants ──────────────────────────────────────────────────

const PROVIDER_TIMEOUT_MS = 40_000;
const HYBRID_TIMEOUT_MS = 90_000; // ListBot hybrid runs longer prompts
const MAX_FALLBACK_ATTEMPTS = 3;

// CMD-RECONBOT-API-B: shared hybrid defaults for new hybrid runners
// going forward (Step 6+). Existing routeListBotHybrid (90s timeout
// for the 13-platform prompt) and routeBuyerBotHybrid (60s/16k from
// Step 5) keep their inlined constants to preserve byte-identity.
// New runners reference HYBRID_DEFAULTS so the next refactor can
// promote ListBot/BuyerBot to it without per-bot churn.
export const HYBRID_DEFAULTS = {
  TIMEOUT_MS: 60_000,
  MAX_TOKENS: 16_384,
} as const;

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
  // CMD-RECONBOT-API-A: optional grounding citations from Gemini
  // when callGeminiRaw is invoked with enableGrounding=true.
  // Other providers always leave this undefined. Existing callers
  // (runProvider, ListBot/BuyerBot fallback paths) ignore it.
  geminiWebSources?: Array<{ url: string; title: string }>;
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
  options: {
    timeoutMs?: number;
    maxTokens?: number;
    // CMD-RECONBOT-API-A: opt-in Google Search grounding flag.
    // Default false → behaves IDENTICALLY to the pre-Round-6A
    // implementation. When true, Gemini runs with native
    // google_search tools on first attempt and falls back to
    // plain JSON if grounding fails or returns empty.
    enableGrounding?: boolean;
  } = {},
): Promise<ProviderRawResult> {
  const key = process.env.GEMINI_API_KEY;
  if (!key || key.length < 10) throw new Error("No Gemini key configured");
  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
  const { base64, mime } = fileToDataUrl(absPath);

  // CMD-RECONBOT-API-A: dual-attempt grounding pattern.
  // Pattern adapted from lib/megabot/run-specialized.ts (lines
  // 631-755 — read-only blueprint, NOT imported). When
  // enableGrounding=true we try with google_search tools first,
  // falling back to plain JSON if grounding errors or returns
  // empty content. When false, exactly one plain request fires
  // (backward compatible — no behavior change for existing
  // callers like runProvider, ListBot/BuyerBot fallback paths).
  const baseReqBody = {
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
  };
  const useGrounding = options.enableGrounding === true;
  const reqBodyWithSearch = useGrounding
    ? JSON.stringify({ ...baseReqBody, tools: [{ google_search: {} }] })
    : null;
  const reqBodyPlain = JSON.stringify(baseReqBody);

  let data: any = null;
  let triedWithSearch = false;
  let groundingError: string | null = null;

  // ── ATTEMPT 1: with google_search grounding (only when opted-in) ──
  if (useGrounding && reqBodyWithSearch) {
    try {
      const res = await Promise.race([
        fetch(url, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: reqBodyWithSearch,
        }),
        new Promise<never>((_, reject) =>
          setTimeout(
            () => reject(new Error("Provider timeout (grounding)")),
            options.timeoutMs ?? PROVIDER_TIMEOUT_MS,
          ),
        ),
      ]);
      if (res.ok) {
        const candidate = await res.json();
        // Validate response has actual text content (grounding
        // sometimes returns empty when search yields nothing)
        const responseText = candidate?.candidates?.[0]?.content?.parts
          ?.map((p: any) => p.text || "").join("") || "";
        if (responseText && responseText.trim().length >= 10) {
          data = candidate;
          triedWithSearch = true;
        } else {
          groundingError = "grounding returned empty content, falling back to plain";
        }
      } else {
        groundingError = `grounding ${res.status}, falling back to plain`;
      }
    } catch (err: any) {
      groundingError = `grounding error: ${err?.message ?? String(err)}, falling back to plain`;
    }
    if (groundingError) {
      console.log("[bot-ai-router/callGeminiRaw]", groundingError);
    }
  }

  // ── ATTEMPT 2 (or only attempt when useGrounding=false): plain JSON ──
  if (!data) {
    const res = await Promise.race([
      fetch(url, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: reqBodyPlain,
      }),
      new Promise<never>((_, reject) =>
        setTimeout(
          () => reject(new Error("Provider timeout")),
          options.timeoutMs ?? PROVIDER_TIMEOUT_MS,
        ),
      ),
    ]);
    if (!res.ok) throw new Error(`Gemini API ${res.status}: ${(await res.text()).slice(0, 300)}`);
    data = await res.json();
  }

  const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  // CARRY-OVER FIX: capture real token usage
  const usage = data.usageMetadata ?? {};
  const tokens: TokenUsage = {
    inputTokens: usage.promptTokenCount ?? null,
    outputTokens: usage.candidatesTokenCount ?? null,
    totalTokens: usage.totalTokenCount ?? null,
  };

  // CMD-RECONBOT-API-A: extract grounding citations when grounding
  // fired AND succeeded. Walk groundingMetadata.groundingChunks per
  // the megabot blueprint. webSearchQueries (if present) is logged
  // for diagnostics but not surfaced in the return shape.
  const geminiWebSources: Array<{ url: string; title: string }> = [];
  if (triedWithSearch) {
    try {
      const candidate = data?.candidates?.[0];
      if (candidate?.groundingMetadata?.groundingChunks) {
        for (const chunk of candidate.groundingMetadata.groundingChunks) {
          if (chunk.web?.uri) {
            geminiWebSources.push({
              url: chunk.web.uri,
              title: chunk.web.title || chunk.web.uri,
            });
          }
        }
      }
      if (candidate?.groundingMetadata?.webSearchQueries) {
        console.log(
          "[bot-ai-router/callGeminiRaw] Search queries used:",
          candidate.groundingMetadata.webSearchQueries.join(", "),
        );
      }
    } catch {
      /* citation extraction is non-critical */
    }
  }

  return { text, tokens, geminiWebSources };
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
  // CMD-RECONBOT-API-A: options widened with optional enableGrounding
  // flag (Gemini-only). Other providers ignore it. Backward compatible
  // for all existing callers (timeoutMs/maxTokens still work as-is).
  options: {
    timeoutMs?: number;
    maxTokens?: number;
    enableGrounding?: boolean;
  } = {},
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

// ─── Public: routeBuyerBotHybrid() ─────────────────────────
//
// CMD-BUYERBOT-HYBRID-5A — Step 5 Round A
//
// BuyerBot router entry point. Grok-primary for buyer
// psychology + outreach hooks. Claude-secondary fires
// conditionally on specialty items (antique, collectible,
// vehicle) for collector-tone refinement.
//
// Pattern mirrors the Step 3 ListBot hybrid runner above.
// Returns RAW JSON payload — caller is responsible for
// shape preservation since BuyerBot's response schema is
// not AiAnalysis-compatible.
//
// IMPORTANT: this function NEVER throws to its caller. All
// failures (provider errors, fallback exhaustion, log write
// failures) are surfaced via the BuyerBotHybridResult shape
// (degraded=true + error string).
// ─────────────────────────────────────────────────────────

const BUYERBOT_HYBRID_TIMEOUT_MS = 60_000;
const BUYERBOT_HYBRID_MAX_TOKENS = 16384;

export async function routeBuyerBotHybrid(
  input: BuyerBotHybridInput,
): Promise<BuyerBotHybridResult> {
  // CMD-BUYERBOT-HYBRID-5A: hybrid runner for BuyerBot (Round A export)
  const startedAt = Date.now();
  // BOT_AI_CONFIG.buyerbot is locked to grok primary + claude secondary +
  // specialty_item trigger + balanced cost tier (Step 2). We resolve it
  // here for parity with routeBotAI() even though Round A doesn't branch
  // on the value — Round B's caller will use signals.flags to set
  // input.shouldRunSecondary, this resolve keeps the audit trail honest.
  const config = getBotConfig("buyerbot");
  // CMD-BUYERBOT-API-B: validate config.triggers contains the
  // specialty_item trigger that Round B's caller pre-evaluates.
  // Fail loudly at boot if config drifts (defense in depth).
  if (!config.triggers.includes("specialty_item")) {
    throw new Error(
      "[routeBuyerBotHybrid] BOT_AI_CONFIG.buyerbot.triggers must " +
      "include 'specialty_item' — got: " + JSON.stringify(config.triggers)
    );
  }
  const demoMode = isDemoMode();

  const photoArr = Array.isArray(input.photoPath) ? input.photoPath : [input.photoPath];
  const absPath = publicUrlToAbsPath(photoArr[0]);

  // CMD-BUYERBOT-HYBRID-5A: raw-JSON single-provider runner.
  // Mirrors the runOne closure in the Step 3 ListBot hybrid runner
  // above but is local to this function so the proven Step 3 template
  // stays byte-identical.
  type RawRunOutcome = ProviderRunResult & { rawResult: any };

  const runRaw = async (
    provider: ProviderName,
    prompt: string,
  ): Promise<RawRunOutcome> => {
    const start = Date.now();
    try {
      const { text, tokens } = await callProviderRaw(provider, absPath, prompt, {
        timeoutMs: BUYERBOT_HYBRID_TIMEOUT_MS,
        maxTokens: BUYERBOT_HYBRID_MAX_TOKENS,
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
        result: null, // BuyerBot output is not AiAnalysis-shaped
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

  const providersAttempted: ProviderName[] = [];
  const providersUsed: ProviderName[] = [];
  let totalEstCost = 0;
  let totalActualCost = 0;
  let fallbackUsed = false;

  // ── PRIMARY: Grok ──────────────────────────────────────
  let primary: RawRunOutcome = await runRaw("grok", input.buyerPrompt);
  providersAttempted.push("grok");
  totalEstCost += estimateProviderCost("grok");
  if (primary.actualCostUsd != null) totalActualCost += primary.actualCostUsd;
  if (primary.rawResult) providersUsed.push("grok");

  // ── Graceful fallback chain on primary failure ────────
  if (!primary.rawResult) {
    const chain = fallbackChain("grok", providersAttempted);
    let attempts = 0;
    for (const fallback of chain) {
      if (attempts >= MAX_FALLBACK_ATTEMPTS) break;
      attempts++;
      fallbackUsed = true;
      const fallbackOutcome = await runRaw(fallback, input.buyerPrompt);
      providersAttempted.push(fallback);
      totalEstCost += estimateProviderCost(fallback);
      if (fallbackOutcome.actualCostUsd != null) {
        totalActualCost += fallbackOutcome.actualCostUsd;
      }
      if (fallbackOutcome.rawResult) {
        primary = fallbackOutcome;
        providersUsed.push(fallback);
        break;
      }
    }
  }

  // ── SECONDARY: Claude (conditional, best-effort) ──────
  // Only fires when:
  //   1. caller pre-evaluated shouldRunSecondary === true
  //   2. primary (or its fallback) succeeded
  //   3. collectorContext is present
  // Secondary failure does NOT mark the run degraded.
  let secondary: RawRunOutcome | undefined;
  const wantsSecondary =
    input.shouldRunSecondary === true &&
    !!primary.rawResult &&
    typeof input.collectorContext === "string" &&
    input.collectorContext.length > 0;

  if (wantsSecondary) {
    const secondaryOutcome = await runRaw("claude", input.collectorContext as string);
    providersAttempted.push("claude");
    totalEstCost += estimateProviderCost("claude");
    if (secondaryOutcome.actualCostUsd != null) {
      totalActualCost += secondaryOutcome.actualCostUsd;
    }
    if (secondaryOutcome.rawResult) {
      secondary = secondaryOutcome;
      providersUsed.push("claude");
    } else {
      // Best-effort: log + continue, do NOT mark degraded.
      console.warn(
        `[routeBuyerBotHybrid] Claude secondary failed for item ${input.itemId}: ${secondaryOutcome.error ?? "unknown"}`,
      );
    }
  }

  const degraded = !primary.rawResult;

  const result: BuyerBotHybridResult = {
    primary,
    secondary,
    costUsd: Number(totalEstCost.toFixed(5)),
    actualCostUsd: Number(totalActualCost.toFixed(6)),
    latencyMs: Date.now() - startedAt,
    degraded,
    error: degraded ? primary.error ?? "All providers failed" : undefined,
  };

  // ── Fire-and-forget routing log (Step 4.8 apifyCostUsd plumbed) ──
  // CMD-BUYERBOT-HYBRID-5A: log dispatch is wrapped in try/catch so
  // a logging exception cannot bubble up to the caller. The inner
  // logRoutingDecision already swallows DB errors via console.warn.
  if (!input.skipLogging) {
    try {
      // NOTE: RoutingLogPayload.mergedStrategy union (locked in
      // logging.ts) is "primary_only" | "merged_consensus" | "degraded".
      // The 5A spec mentions a "primary_plus_collector" label; we map it
      // to "merged_consensus" because (a) logging.ts is locked and (b)
      // semantically a successful primary+secondary run already maps to
      // merged_consensus across the rest of the router.
      const mergedStrategy: "primary_only" | "merged_consensus" | "degraded" =
        degraded
          ? "degraded"
          : secondary
            ? "merged_consensus"
            : "primary_only";

      void logRoutingDecision({
        itemId: input.itemId,
        payload: {
          botName: "buyerbot",
          primary: primary.provider, // actual provider used (may be a fallback)
          secondary: secondary?.provider,
          triggersFired: wantsSecondary ? ["specialty_item"] : [],
          providersAttempted,
          providersUsed,
          costUsd: result.costUsd,
          actualCostUsd: result.actualCostUsd,
          // Step 4.8 plumbing: caller-tracked Apify scraper spend.
          // Spread conditionally so we don't pass null into a number
          // field on the locked RoutingLogPayload type.
          ...(input.apifyCostUsd != null ? { apifyCostUsd: input.apifyCostUsd } : {}),
          latencyMs: result.latencyMs,
          fallbackUsed,
          degraded,
          confidence: null, // BuyerBot does not produce AiAnalysis confidence
          mergedStrategy,
          tokens: {
            [primary.provider]: {
              input: primary.tokens?.inputTokens ?? null,
              output: primary.tokens?.outputTokens ?? null,
              total: primary.tokens?.totalTokens ?? null,
            },
            ...(secondary?.tokens
              ? {
                  [secondary.provider]: {
                    input: secondary.tokens.inputTokens,
                    output: secondary.tokens.outputTokens,
                    total: secondary.tokens.totalTokens,
                  },
                }
              : {}),
          },
          demoMode,
          error: result.error,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (e: any) {
      // Logging must NEVER bubble up to the caller.
      console.warn(
        `[routeBuyerBotHybrid] log dispatch failed for item ${input.itemId}: ${e?.message ?? e}`,
      );
    }
  }

  return result;
}

// ─── Public: routeReconBotHybrid() ─────────────────────────
//
// CMD-RECONBOT-API-A — Step 6 Round A
//
// ReconBot router entry point. Gemini-primary for research
// synthesis + market trend detection (with optional Google
// Search grounding for real-time competitor data). Grok-
// secondary fires conditionally on the high_disagreement
// trigger when caller pre-evaluates that ReconBot's
// market_average disagrees with the prior valuation by >20%.
//
// Pattern mirrors the Step 5 hybrid runner above (BuyerBot,
// proven in production). Returns RAW JSON payload — caller is
// responsible for shape preservation since ReconBot's response
// schema is not AiAnalysis-compatible.
//
// GROUNDING NOTE: When enableGrounding=true, Gemini runs with
// google_search tools on first attempt, falling back to plain
// JSON if grounding fails. Citations are returned in
// geminiWebSources for the caller to merge into result.web_sources.
//
// IMPORTANT: this function NEVER throws to its caller. All
// failures (provider errors, fallback exhaustion, log write
// failures) are surfaced via the ReconBotHybridResult shape
// (degraded=true + error string).
// ─────────────────────────────────────────────────────────

// CMD-RECONBOT-API-B: now references HYBRID_DEFAULTS (Part E
// promotion). The two prior per-bot inline timeout/token constants
// were removed in this round; their values now live in
// HYBRID_DEFAULTS.TIMEOUT_MS and HYBRID_DEFAULTS.MAX_TOKENS.

export async function routeReconBotHybrid(
  input: ReconBotHybridInput,
): Promise<ReconBotHybridResult> {
  // CMD-RECONBOT-API-A: hybrid runner for ReconBot (Round 6A export)
  const startedAt = Date.now();
  const config = getBotConfig("reconbot");
  // Defense-in-depth: validate config.triggers contains the
  // high_disagreement trigger that Round 6B's caller pre-evaluates.
  // Mirrors the Step 5 Round B specialty_item validator pattern —
  // if anyone edits config.ts and accidentally drops the trigger,
  // callers get a clear error instead of silent wrong-routing.
  if (!config.triggers.includes("high_disagreement")) {
    throw new Error(
      "[routeReconBotHybrid] BOT_AI_CONFIG.reconbot.triggers must " +
      "include 'high_disagreement' — got: " + JSON.stringify(config.triggers)
    );
  }
  const demoMode = isDemoMode();

  const photoArr = Array.isArray(input.photoPath) ? input.photoPath : [input.photoPath];
  const absPath = publicUrlToAbsPath(photoArr[0]);

  // CMD-RECONBOT-API-A: raw-JSON single-provider runner.
  // Local closure (not extracted) so the proven Step 3/Step 5
  // hybrid templates above stay byte-identical. Note: only the
  // first call (Gemini primary) opts into grounding; fallbacks
  // and the secondary always run with grounding disabled because
  // OpenAI/Claude/Grok don't support it.
  type RawRunOutcome = ProviderRunResult & {
    rawResult: any;
    geminiWebSources?: Array<{ url: string; title: string }>;
  };

  const runRaw = async (
    provider: ProviderName,
    prompt: string,
    enableGrounding: boolean,
  ): Promise<RawRunOutcome> => {
    const start = Date.now();
    try {
      const { text, tokens, geminiWebSources } = await callProviderRaw(
        provider,
        absPath,
        prompt,
        {
          timeoutMs: HYBRID_DEFAULTS.TIMEOUT_MS,
          maxTokens: HYBRID_DEFAULTS.MAX_TOKENS,
          enableGrounding,
        },
      );
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
          geminiWebSources,
        };
      }
      return {
        provider,
        result: null, // ReconBot output is not AiAnalysis-shaped
        error: null,
        durationMs: Date.now() - start,
        tokens,
        actualCostUsd: computeActualCost(provider, tokens),
        rawResult,
        geminiWebSources,
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

  const providersAttempted: ProviderName[] = [];
  const providersUsed: ProviderName[] = [];
  let totalEstCost = 0;
  let totalActualCost = 0;
  let fallbackUsed = false;

  // ── PRIMARY: Gemini (with optional grounding) ──────────
  const wantsGrounding = input.enableGrounding === true;
  let primary: RawRunOutcome = await runRaw("gemini", input.reconPrompt, wantsGrounding);
  providersAttempted.push("gemini");
  totalEstCost += estimateProviderCost("gemini");
  if (primary.actualCostUsd != null) totalActualCost += primary.actualCostUsd;
  if (primary.rawResult) providersUsed.push("gemini");

  // ── Graceful fallback chain on primary failure ────────
  // Fallback providers do NOT inherit enableGrounding — only
  // Gemini supports it, and the others have no equivalent.
  if (!primary.rawResult) {
    const chain = fallbackChain("gemini", providersAttempted);
    let attempts = 0;
    for (const fallback of chain) {
      if (attempts >= MAX_FALLBACK_ATTEMPTS) break;
      attempts++;
      fallbackUsed = true;
      const fallbackOutcome = await runRaw(fallback, input.reconPrompt, false);
      providersAttempted.push(fallback);
      totalEstCost += estimateProviderCost(fallback);
      if (fallbackOutcome.actualCostUsd != null) {
        totalActualCost += fallbackOutcome.actualCostUsd;
      }
      if (fallbackOutcome.rawResult) {
        primary = fallbackOutcome;
        providersUsed.push(fallback);
        break;
      }
    }
  }

  // ── SECONDARY: Grok (conditional, best-effort) ────────
  // Only fires when:
  //   1. caller pre-evaluated shouldRunSecondary === true
  //   2. primary (or its fallback) succeeded
  //   3. culturalContext is present
  // Secondary failure does NOT mark the run degraded.
  let secondary: RawRunOutcome | undefined;
  const wantsSecondary =
    input.shouldRunSecondary === true &&
    !!primary.rawResult &&
    typeof input.culturalContext === "string" &&
    input.culturalContext.length > 0;

  if (wantsSecondary) {
    const secondaryOutcome = await runRaw("grok", input.culturalContext as string, false);
    providersAttempted.push("grok");
    totalEstCost += estimateProviderCost("grok");
    if (secondaryOutcome.actualCostUsd != null) {
      totalActualCost += secondaryOutcome.actualCostUsd;
    }
    if (secondaryOutcome.rawResult) {
      secondary = secondaryOutcome;
      providersUsed.push("grok");
    } else {
      // Best-effort: log + continue, do NOT mark degraded.
      console.warn(
        `[routeReconBotHybrid] Grok secondary failed for item ${input.itemId}: ${secondaryOutcome.error ?? "unknown"}`,
      );
    }
  }

  const degraded = !primary.rawResult;

  // CMD-RECONBOT-API-A: hoist grounding citations to top-level
  // result. Only Gemini (when grounded + successful) populates
  // them. Empty array when grounding off, fallback fired, or no
  // citations returned.
  const geminiWebSources: Array<{ url: string; title: string }> =
    primary.provider === "gemini" && Array.isArray(primary.geminiWebSources)
      ? primary.geminiWebSources
      : [];

  const result: ReconBotHybridResult = {
    primary,
    secondary,
    geminiWebSources,
    costUsd: Number(totalEstCost.toFixed(5)),
    actualCostUsd: Number(totalActualCost.toFixed(6)),
    latencyMs: Date.now() - startedAt,
    degraded,
    error: degraded ? primary.error ?? "All providers failed" : undefined,
  };

  // ── Fire-and-forget routing log (Step 4.8 apifyCostUsd plumbed) ──
  // CMD-RECONBOT-API-A: log dispatch wrapped in try/catch so a
  // logging exception cannot bubble up to the caller. The inner
  // logRoutingDecision already swallows DB errors via console.warn.
  if (!input.skipLogging) {
    try {
      // NOTE: RoutingLogPayload.mergedStrategy union (locked in
      // logging.ts) is "primary_only" | "merged_consensus" | "degraded".
      // Same semantic mapping accepted in Step 5 Round A.
      const mergedStrategy: "primary_only" | "merged_consensus" | "degraded" =
        degraded
          ? "degraded"
          : secondary
            ? "merged_consensus"
            : "primary_only";

      void logRoutingDecision({
        itemId: input.itemId,
        payload: {
          botName: "reconbot",
          primary: primary.provider, // actual provider used (may be a fallback)
          secondary: secondary?.provider,
          triggersFired: wantsSecondary ? ["high_disagreement"] : [],
          providersAttempted,
          providersUsed,
          costUsd: result.costUsd,
          actualCostUsd: result.actualCostUsd,
          // Step 4.8 plumbing: caller-tracked Apify scraper spend.
          // Spread conditionally so we don't pass null into a number
          // field on the locked RoutingLogPayload type.
          ...(input.apifyCostUsd != null ? { apifyCostUsd: input.apifyCostUsd } : {}),
          latencyMs: result.latencyMs,
          fallbackUsed,
          degraded,
          confidence: null, // ReconBot does not produce AiAnalysis confidence
          mergedStrategy,
          tokens: {
            [primary.provider]: {
              input: primary.tokens?.inputTokens ?? null,
              output: primary.tokens?.outputTokens ?? null,
              total: primary.tokens?.totalTokens ?? null,
            },
            ...(secondary?.tokens
              ? {
                  [secondary.provider]: {
                    input: secondary.tokens.inputTokens,
                    output: secondary.tokens.outputTokens,
                    total: secondary.tokens.totalTokens,
                  },
                }
              : {}),
          },
          demoMode,
          error: result.error,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (e: any) {
      // Logging must NEVER bubble up to the caller.
      console.warn(
        `[routeReconBotHybrid] log dispatch failed for item ${input.itemId}: ${e?.message ?? e}`,
      );
    }
  }

  return result;
}

// ─── Public: routeAntiqueBotHybrid() ───────────────────────
//
// CMD-ANTIQUEBOT-CORE-A — Step 7 Round A
//
// AntiqueBot router entry point. Claude-primary for museum-grade
// authentication + provenance reasoning. OpenAI-secondary fires
// conditionally on the borderline_grading trigger when caller
// pre-evaluates that primary's authentication.confidence is below
// the threshold (default 80) — collector-opinion backup pass.
//
// Pattern mirrors the Step 5/6 hybrid runners above (BuyerBot,
// ReconBot — both proven in production). Returns RAW JSON
// payload + a fused mergedResult — caller is responsible for
// shape preservation since AntiqueBot's response schema is not
// AiAnalysis-compatible.
//
// IMPORTANT: this function NEVER throws to its caller. All
// failures (provider errors, fallback exhaustion, log write
// failures) are surfaced via the AntiqueBotHybridResult shape
// (degraded=true + error string).
// ─────────────────────────────────────────────────────────

const ANTIQUEBOT_HYBRID_TIMEOUT_MS = HYBRID_DEFAULTS.TIMEOUT_MS;
const ANTIQUEBOT_HYBRID_MAX_TOKENS = HYBRID_DEFAULTS.MAX_TOKENS;

export async function routeAntiqueBotHybrid(
  input: AntiqueBotHybridInput,
): Promise<AntiqueBotHybridResult> {
  // CMD-ANTIQUEBOT-CORE-A: hybrid runner for AntiqueBot (Round 7A export)
  const startedAt = Date.now();
  const config = getBotConfig("antiquebot");
  // Defense-in-depth: validate config.triggers contains the
  // borderline_grading trigger that this round's caller relies
  // on. Mirrors the Step 5/6 specialty_item / high_disagreement
  // validator pattern — if anyone edits config.ts and accidentally
  // drops the trigger, callers get a clear error instead of silent
  // wrong-routing.
  if (!config.triggers.includes("borderline_grading")) {
    throw new Error(
      "[routeAntiqueBotHybrid] BOT_AI_CONFIG.antiquebot.triggers must " +
        "include 'borderline_grading' — got: " + JSON.stringify(config.triggers),
    );
  }
  const demoMode = isDemoMode();

  const photoArr = Array.isArray(input.photoPath)
    ? input.photoPath
    : [input.photoPath];
  const absPath = publicUrlToAbsPath(photoArr[0]);

  const threshold = input.authConfidenceThreshold ?? 80;
  const timeoutMs = input.timeoutMs ?? ANTIQUEBOT_HYBRID_TIMEOUT_MS;
  const maxTokens = input.maxTokens ?? ANTIQUEBOT_HYBRID_MAX_TOKENS;

  // CMD-ANTIQUEBOT-CORE-A: raw-JSON single-provider runner.
  // Local closure (not extracted) so the proven Step 3/5/6
  // hybrid templates above stay byte-identical.
  type RawRunOutcome = ProviderRunResult & { rawResult: any };

  const runRaw = async (
    provider: ProviderName,
    prompt: string,
  ): Promise<RawRunOutcome> => {
    const start = Date.now();
    try {
      const { text, tokens } = await callProviderRaw(
        provider,
        absPath,
        prompt,
        {
          timeoutMs,
          maxTokens,
        },
      );
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
        result: null, // AntiqueBot output is not AiAnalysis-shaped
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

  const providersAttempted: ProviderName[] = [];
  const providersUsed: ProviderName[] = [];
  let totalEstCost = 0;
  let totalActualCost = 0;
  let fallbackUsed = false;

  // ── PRIMARY: Claude (museum-grade reasoning) ───────────
  let primary: RawRunOutcome = await runRaw("claude", input.appraisalPrompt);
  providersAttempted.push("claude");
  totalEstCost += estimateProviderCost("claude");
  if (primary.actualCostUsd != null) totalActualCost += primary.actualCostUsd;
  if (primary.rawResult) providersUsed.push("claude");

  // ── Graceful fallback chain on primary failure ────────
  if (!primary.rawResult) {
    const chain = fallbackChain("claude", providersAttempted);
    let attempts = 0;
    for (const fallback of chain) {
      if (attempts >= MAX_FALLBACK_ATTEMPTS) break;
      attempts++;
      fallbackUsed = true;
      const fallbackOutcome = await runRaw(fallback, input.appraisalPrompt);
      providersAttempted.push(fallback);
      totalEstCost += estimateProviderCost(fallback);
      if (fallbackOutcome.actualCostUsd != null) {
        totalActualCost += fallbackOutcome.actualCostUsd;
      }
      if (fallbackOutcome.rawResult) {
        primary = fallbackOutcome;
        providersUsed.push(fallback);
        break;
      }
    }
  }

  // Read primary authentication confidence (1-100). Falls back
  // through identification.confidence and finally a neutral 50
  // when neither field is present.
  const primaryConfidence: number =
    typeof primary.rawResult?.authentication?.confidence === "number"
      ? primary.rawResult.authentication.confidence
      : typeof primary.rawResult?.identification?.confidence === "number"
        ? primary.rawResult.identification.confidence
        : 50;

  // ── SECONDARY: OpenAI (conditional, best-effort) ──────
  // Fires when:
  //   1. primary (or its fallback) succeeded
  //   2. caller forced it (shouldRunSecondary === true) OR
  //      primary confidence < threshold
  // Secondary failure does NOT mark the run degraded.
  let secondary: RawRunOutcome | undefined;
  let secondaryTriggered = false;

  const wantsSecondary =
    !!primary.rawResult &&
    (input.shouldRunSecondary === true || primaryConfidence < threshold);

  if (wantsSecondary) {
    secondaryTriggered = true;
    const secondaryOutcome = await runRaw("openai", input.appraisalPrompt);
    providersAttempted.push("openai");
    totalEstCost += estimateProviderCost("openai");
    if (secondaryOutcome.actualCostUsd != null) {
      totalActualCost += secondaryOutcome.actualCostUsd;
    }
    if (secondaryOutcome.rawResult) {
      secondary = secondaryOutcome;
      providersUsed.push("openai");
    } else {
      // Best-effort: log + continue, do NOT mark degraded.
      console.warn(
        `[routeAntiqueBotHybrid] OpenAI secondary failed for item ${input.itemId}: ${secondaryOutcome.error ?? "unknown"}`,
      );
    }
  }

  // ── Merge: primary as base, overlay secondary's higher-
  //    confidence authentication block ──
  let mergedResult: any;
  let mergedStrategy: "primary_only" | "merged_consensus" | "degraded";

  if (primary.rawResult && secondary?.rawResult) {
    mergedResult = { ...primary.rawResult };
    const secAuthConf =
      typeof secondary.rawResult?.authentication?.confidence === "number"
        ? secondary.rawResult.authentication.confidence
        : null;
    if (secAuthConf != null && secAuthConf > primaryConfidence) {
      mergedResult.authentication = secondary.rawResult.authentication;
    }
    if (secondary.rawResult?.identification && !mergedResult.identification) {
      mergedResult.identification = secondary.rawResult.identification;
    }
    mergedStrategy = "merged_consensus";
  } else if (primary.rawResult) {
    mergedResult = primary.rawResult;
    mergedStrategy = "primary_only";
  } else {
    mergedResult = null;
    mergedStrategy = "degraded";
  }

  const degraded = !primary.rawResult;

  // Aggregated token usage (primary + secondary, when present).
  const aggregatedTokens = {
    input:
      (primary.tokens?.inputTokens ?? 0) +
      (secondary?.tokens?.inputTokens ?? 0),
    output:
      (primary.tokens?.outputTokens ?? 0) +
      (secondary?.tokens?.outputTokens ?? 0),
    total:
      (primary.tokens?.totalTokens ?? 0) +
      (secondary?.tokens?.totalTokens ?? 0),
  };

  const result: AntiqueBotHybridResult = {
    primary,
    secondary,
    mergedResult,
    primaryConfidence,
    secondaryTriggered,
    mergedStrategy,
    costUsd: Number(totalEstCost.toFixed(5)),
    actualCostUsd: Number(totalActualCost.toFixed(6)),
    tokens: aggregatedTokens,
    latencyMs: Date.now() - startedAt,
    degraded,
    error: degraded ? primary.error ?? "All providers failed" : undefined,
  };

  // ── Fire-and-forget routing log ───────────────────────
  // Wrapped in try/catch so a logging exception cannot bubble
  // up to the caller. Inner logRoutingDecision already swallows
  // DB errors via console.warn.
  if (!input.skipLogging) {
    try {
      void logRoutingDecision({
        itemId: input.itemId,
        payload: {
          botName: "antiquebot",
          primary: primary.provider, // actual provider used (may be a fallback)
          secondary: secondary?.provider,
          triggersFired: secondaryTriggered ? ["borderline_grading"] : [],
          providersAttempted,
          providersUsed,
          costUsd: result.costUsd,
          actualCostUsd: result.actualCostUsd,
          // Step 4.8 plumbing: caller-tracked Apify scraper spend.
          ...(input.apifyCostUsd != null
            ? { apifyCostUsd: input.apifyCostUsd }
            : {}),
          latencyMs: result.latencyMs,
          fallbackUsed,
          degraded,
          confidence: primaryConfidence,
          mergedStrategy,
          tokens: {
            [primary.provider]: {
              input: primary.tokens?.inputTokens ?? null,
              output: primary.tokens?.outputTokens ?? null,
              total: primary.tokens?.totalTokens ?? null,
            },
            ...(secondary?.tokens
              ? {
                  [secondary.provider]: {
                    input: secondary.tokens.inputTokens,
                    output: secondary.tokens.outputTokens,
                    total: secondary.tokens.totalTokens,
                  },
                }
              : {}),
          },
          demoMode,
          error: result.error,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (e: any) {
      // Logging must NEVER bubble up to the caller.
      console.warn(
        `[routeAntiqueBotHybrid] log dispatch failed for item ${input.itemId}: ${e?.message ?? e}`,
      );
    }
  }

  return result;
}

// ─── Public: routeCollectiblesBotHybrid() ──────────────────
//
// CMD-COLLECTIBLESBOT-CORE-A — Step 8 Round A
//
// CollectiblesBot router entry point. Claude-primary for nuanced
// grading + collector-market reasoning across 15+ specialty
// markets (sports cards, trading cards, comics, coins, stamps,
// autographs, toys, video games, vinyl, watches, jewelry,
// rare books, sneakers, minerals). OpenAI-secondary fires
// conditionally on the borderline_grading trigger when primary's
// visual_grading.grade_confidence is below the threshold
// (default 80) — collector-opinion backup pass.
//
// Pattern mirrors routeAntiqueBotHybrid (Step 7A — proven in
// production). Returns RAW JSON payload + a fused mergedResult —
// caller is responsible for shape preservation since
// CollectiblesBot's response schema is not AiAnalysis-compatible.
//
// IMPORTANT: this function NEVER throws to its caller. All
// failures (provider errors, fallback exhaustion, log write
// failures) are surfaced via the CollectiblesBotHybridResult
// shape (degraded=true + error string).
// ─────────────────────────────────────────────────────────

const COLLECTIBLESBOT_HYBRID_TIMEOUT_MS = HYBRID_DEFAULTS.TIMEOUT_MS;
const COLLECTIBLESBOT_HYBRID_MAX_TOKENS = HYBRID_DEFAULTS.MAX_TOKENS;

export async function routeCollectiblesBotHybrid(
  input: CollectiblesBotHybridInput,
): Promise<CollectiblesBotHybridResult> {
  // CMD-COLLECTIBLESBOT-CORE-A: hybrid runner (Round 8A export)
  const startedAt = Date.now();
  const config = getBotConfig("collectiblesbot");
  // Defense-in-depth: validate config.triggers contains the
  // borderline_grading trigger this round's caller relies on.
  // Mirrors AntiqueBot validator — if anyone edits config.ts and
  // accidentally drops the trigger, callers get a clear error
  // instead of silent wrong-routing.
  if (!config.triggers.includes("borderline_grading")) {
    throw new Error(
      "[routeCollectiblesBotHybrid] BOT_AI_CONFIG.collectiblesbot.triggers must " +
        "include 'borderline_grading' — got: " + JSON.stringify(config.triggers),
    );
  }
  const demoMode = isDemoMode();

  const photoArr = Array.isArray(input.photoPath)
    ? input.photoPath
    : [input.photoPath];
  const absPath = publicUrlToAbsPath(photoArr[0]);

  const threshold = input.authConfidenceThreshold ?? 80;
  const timeoutMs = input.timeoutMs ?? COLLECTIBLESBOT_HYBRID_TIMEOUT_MS;
  const maxTokens = input.maxTokens ?? COLLECTIBLESBOT_HYBRID_MAX_TOKENS;

  // CMD-COLLECTIBLESBOT-CORE-A: raw-JSON single-provider runner.
  // Local closure (not extracted) — mirrors the proven AntiqueBot
  // Step 7A pattern exactly.
  type RawRunOutcome = ProviderRunResult & { rawResult: any };

  const runRaw = async (
    provider: ProviderName,
    prompt: string,
  ): Promise<RawRunOutcome> => {
    const start = Date.now();
    try {
      const { text, tokens } = await callProviderRaw(
        provider,
        absPath,
        prompt,
        {
          timeoutMs,
          maxTokens,
        },
      );
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
        result: null, // CollectiblesBot output is not AiAnalysis-shaped
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

  const providersAttempted: ProviderName[] = [];
  const providersUsed: ProviderName[] = [];
  let totalEstCost = 0;
  let totalActualCost = 0;
  let fallbackUsed = false;

  // ── PRIMARY: Claude (nuanced grading reasoning) ────────
  let primary: RawRunOutcome = await runRaw("claude", input.gradingPrompt);
  providersAttempted.push("claude");
  totalEstCost += estimateProviderCost("claude");
  if (primary.actualCostUsd != null) totalActualCost += primary.actualCostUsd;
  if (primary.rawResult) providersUsed.push("claude");

  // ── Graceful fallback chain on primary failure ────────
  if (!primary.rawResult) {
    const chain = fallbackChain("claude", providersAttempted);
    let attempts = 0;
    for (const fallback of chain) {
      if (attempts >= MAX_FALLBACK_ATTEMPTS) break;
      attempts++;
      fallbackUsed = true;
      const fallbackOutcome = await runRaw(fallback, input.gradingPrompt);
      providersAttempted.push(fallback);
      totalEstCost += estimateProviderCost(fallback);
      if (fallbackOutcome.actualCostUsd != null) {
        totalActualCost += fallbackOutcome.actualCostUsd;
      }
      if (fallbackOutcome.rawResult) {
        primary = fallbackOutcome;
        providersUsed.push(fallback);
        break;
      }
    }
  }

  // Read primary grading confidence (1-100). CollectiblesBot
  // stores it under visual_grading.grade_confidence (often 0-1
  // decimal). Also probe authentication.confidence and a
  // top-level confidence fallback. Neutral 50 if none present.
  const rawGradeConf: any =
    primary.rawResult?.visual_grading?.grade_confidence ??
    primary.rawResult?.authentication?.confidence ??
    primary.rawResult?.confidence;
  const primaryConfidence: number =
    typeof rawGradeConf === "number"
      ? rawGradeConf <= 1
        ? Math.round(rawGradeConf * 100)
        : Math.round(rawGradeConf)
      : 50;

  // ── SECONDARY: OpenAI (conditional, best-effort) ──────
  // Fires when:
  //   1. primary (or its fallback) succeeded
  //   2. caller forced it (shouldRunSecondary === true) OR
  //      primary confidence < threshold
  // Secondary failure does NOT mark the run degraded.
  let secondary: RawRunOutcome | undefined;
  let secondaryTriggered = false;

  const wantsSecondary =
    !!primary.rawResult &&
    (input.shouldRunSecondary === true || primaryConfidence < threshold);

  if (wantsSecondary) {
    secondaryTriggered = true;
    const secondaryOutcome = await runRaw("openai", input.gradingPrompt);
    providersAttempted.push("openai");
    totalEstCost += estimateProviderCost("openai");
    if (secondaryOutcome.actualCostUsd != null) {
      totalActualCost += secondaryOutcome.actualCostUsd;
    }
    if (secondaryOutcome.rawResult) {
      secondary = secondaryOutcome;
      providersUsed.push("openai");
    } else {
      // Best-effort: log + continue, do NOT mark degraded.
      console.warn(
        `[routeCollectiblesBotHybrid] OpenAI secondary failed for item ${input.itemId}: ${secondaryOutcome.error ?? "unknown"}`,
      );
    }
  }

  // ── Merge: primary as base, overlay secondary's higher-
  //    confidence visual_grading block ──
  let mergedResult: any;
  let mergedStrategy: "primary_only" | "merged_consensus" | "degraded";

  if (primary.rawResult && secondary?.rawResult) {
    mergedResult = { ...primary.rawResult };
    const secRawConf: any =
      secondary.rawResult?.visual_grading?.grade_confidence ??
      secondary.rawResult?.authentication?.confidence ??
      secondary.rawResult?.confidence;
    const secGradeConf: number | null =
      typeof secRawConf === "number"
        ? secRawConf <= 1
          ? Math.round(secRawConf * 100)
          : Math.round(secRawConf)
        : null;
    if (
      secGradeConf != null &&
      secGradeConf > primaryConfidence &&
      secondary.rawResult?.visual_grading
    ) {
      mergedResult.visual_grading = secondary.rawResult.visual_grading;
    }
    if (
      secondary.rawResult?.authentication &&
      !mergedResult.authentication
    ) {
      mergedResult.authentication = secondary.rawResult.authentication;
    }
    mergedStrategy = "merged_consensus";
  } else if (primary.rawResult) {
    mergedResult = primary.rawResult;
    mergedStrategy = "primary_only";
  } else {
    mergedResult = null;
    mergedStrategy = "degraded";
  }

  const degraded = !primary.rawResult;

  // Aggregated token usage (primary + secondary, when present).
  const aggregatedTokens = {
    input:
      (primary.tokens?.inputTokens ?? 0) +
      (secondary?.tokens?.inputTokens ?? 0),
    output:
      (primary.tokens?.outputTokens ?? 0) +
      (secondary?.tokens?.outputTokens ?? 0),
    total:
      (primary.tokens?.totalTokens ?? 0) +
      (secondary?.tokens?.totalTokens ?? 0),
  };

  const result: CollectiblesBotHybridResult = {
    primary,
    secondary,
    mergedResult,
    primaryConfidence,
    secondaryTriggered,
    mergedStrategy,
    costUsd: Number(totalEstCost.toFixed(5)),
    actualCostUsd: Number(totalActualCost.toFixed(6)),
    tokens: aggregatedTokens,
    latencyMs: Date.now() - startedAt,
    degraded,
    error: degraded ? primary.error ?? "All providers failed" : undefined,
  };

  // ── Fire-and-forget routing log ───────────────────────
  // Wrapped in try/catch so a logging exception cannot bubble
  // up to the caller. Inner logRoutingDecision already swallows
  // DB errors via console.warn.
  if (!input.skipLogging) {
    try {
      void logRoutingDecision({
        itemId: input.itemId,
        payload: {
          botName: "collectiblesbot",
          primary: primary.provider,
          secondary: secondary?.provider,
          triggersFired: secondaryTriggered ? ["borderline_grading"] : [],
          providersAttempted,
          providersUsed,
          costUsd: result.costUsd,
          actualCostUsd: result.actualCostUsd,
          ...(input.apifyCostUsd != null
            ? { apifyCostUsd: input.apifyCostUsd }
            : {}),
          latencyMs: result.latencyMs,
          fallbackUsed,
          degraded,
          confidence: primaryConfidence,
          mergedStrategy,
          tokens: {
            [primary.provider]: {
              input: primary.tokens?.inputTokens ?? null,
              output: primary.tokens?.outputTokens ?? null,
              total: primary.tokens?.totalTokens ?? null,
            },
            ...(secondary?.tokens
              ? {
                  [secondary.provider]: {
                    input: secondary.tokens.inputTokens,
                    output: secondary.tokens.outputTokens,
                    total: secondary.tokens.totalTokens,
                  },
                }
              : {}),
          },
          demoMode,
          error: result.error,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (e: any) {
      // Logging must NEVER bubble up to the caller.
      console.warn(
        `[routeCollectiblesBotHybrid] log dispatch failed for item ${input.itemId}: ${e?.message ?? e}`,
      );
    }
  }

  return result;
}

// ─── Public: routeCarBotHybrid() ───────────────────────────
//
// CMD-CARBOT-CORE-A — Step 9 Round A
//
// CarBot router entry point. Gemini-primary for vehicle market
// reasoning with native Google Search grounding (real-time
// Bring a Trailer, Cars.com, recall data). OpenAI-secondary
// fires conditionally on the rare_vehicle trigger when caller
// pre-evaluates year < 1980 OR mileage < 30000 — rare-car
// specialist backup pass.
//
// Pattern mirrors routeReconBotHybrid (Step 6A — proven in
// production). CarBot becomes the second Gemini-primary hybrid
// runner. Returns RAW JSON payload + a fused mergedResult —
// caller is responsible for shape preservation since CarBot's
// response schema is not AiAnalysis-compatible.
//
// GROUNDING NOTE: CarBot callers SHOULD set enableGrounding=true
// on every scan because vehicle market data is highly real-time.
// Gemini runs with google_search tools on first attempt, falling
// back to plain JSON if grounding fails. Citations returned in
// geminiWebSources for the caller to merge into result.web_sources.
//
// IMPORTANT: this function NEVER throws to its caller. All
// failures (provider errors, fallback exhaustion, log write
// failures) are surfaced via the CarBotHybridResult shape
// (degraded=true + error string).
// ─────────────────────────────────────────────────────────

const CARBOT_HYBRID_TIMEOUT_MS = HYBRID_DEFAULTS.TIMEOUT_MS;
const CARBOT_HYBRID_MAX_TOKENS = HYBRID_DEFAULTS.MAX_TOKENS;

export async function routeCarBotHybrid(
  input: CarBotHybridInput,
): Promise<CarBotHybridResult> {
  // CMD-CARBOT-CORE-A: hybrid runner for CarBot (Round 9A export)
  const startedAt = Date.now();
  const config = getBotConfig("carbot");
  // Defense-in-depth: validate config.triggers contains the
  // rare_vehicle trigger this round's caller relies on.
  if (!config.triggers.includes("rare_vehicle")) {
    throw new Error(
      "[routeCarBotHybrid] BOT_AI_CONFIG.carbot.triggers must " +
        "include 'rare_vehicle' — got: " + JSON.stringify(config.triggers),
    );
  }
  const demoMode = isDemoMode();

  const photoArr = Array.isArray(input.photoPath)
    ? input.photoPath
    : [input.photoPath];
  const absPath = publicUrlToAbsPath(photoArr[0]);

  const timeoutMs = input.timeoutMs ?? CARBOT_HYBRID_TIMEOUT_MS;
  const maxTokens = input.maxTokens ?? CARBOT_HYBRID_MAX_TOKENS;

  // CMD-CARBOT-CORE-A: raw-JSON single-provider runner.
  // Mirrors ReconBot's grounding-aware pattern exactly. Only the
  // first call (Gemini primary) opts into grounding; fallbacks
  // and the secondary always run with grounding disabled because
  // OpenAI/Claude/Grok don't support it.
  type RawRunOutcome = ProviderRunResult & {
    rawResult: any;
    geminiWebSources?: Array<{ url: string; title: string }>;
  };

  const runRaw = async (
    provider: ProviderName,
    prompt: string,
    enableGrounding: boolean,
  ): Promise<RawRunOutcome> => {
    const start = Date.now();
    try {
      const { text, tokens, geminiWebSources } = await callProviderRaw(
        provider,
        absPath,
        prompt,
        {
          timeoutMs,
          maxTokens,
          enableGrounding,
        },
      );
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
          geminiWebSources,
        };
      }
      return {
        provider,
        result: null, // CarBot output is not AiAnalysis-shaped
        error: null,
        durationMs: Date.now() - start,
        tokens,
        actualCostUsd: computeActualCost(provider, tokens),
        rawResult,
        geminiWebSources,
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

  const providersAttempted: ProviderName[] = [];
  const providersUsed: ProviderName[] = [];
  let totalEstCost = 0;
  let totalActualCost = 0;
  let fallbackUsed = false;

  // ── PRIMARY: Gemini (with optional grounding) ──────────
  const wantsGrounding = input.enableGrounding === true;
  let primary: RawRunOutcome = await runRaw(
    "gemini",
    input.vehiclePrompt,
    wantsGrounding,
  );
  providersAttempted.push("gemini");
  totalEstCost += estimateProviderCost("gemini");
  if (primary.actualCostUsd != null) totalActualCost += primary.actualCostUsd;
  if (primary.rawResult) providersUsed.push("gemini");

  // ── Graceful fallback chain on primary failure ────────
  // Fallback providers do NOT inherit enableGrounding — only
  // Gemini supports it, and the others have no equivalent.
  if (!primary.rawResult) {
    const chain = fallbackChain("gemini", providersAttempted);
    let attempts = 0;
    for (const fallback of chain) {
      if (attempts >= MAX_FALLBACK_ATTEMPTS) break;
      attempts++;
      fallbackUsed = true;
      const fallbackOutcome = await runRaw(
        fallback,
        input.vehiclePrompt,
        false,
      );
      providersAttempted.push(fallback);
      totalEstCost += estimateProviderCost(fallback);
      if (fallbackOutcome.actualCostUsd != null) {
        totalActualCost += fallbackOutcome.actualCostUsd;
      }
      if (fallbackOutcome.rawResult) {
        primary = fallbackOutcome;
        providersUsed.push(fallback);
        break;
      }
    }
  }

  // ── SECONDARY: OpenAI (conditional, best-effort) ──────
  // Only fires when:
  //   1. caller pre-evaluated shouldRunSecondary === true
  //      (caller checks year < 1980 OR mileage < 30000)
  //   2. primary (or its fallback) succeeded
  //   3. rareVehicleContext is present
  // Secondary failure does NOT mark the run degraded.
  let secondary: RawRunOutcome | undefined;
  let secondaryTriggered = false;

  const wantsSecondary =
    input.shouldRunSecondary === true &&
    !!primary.rawResult &&
    typeof input.rareVehicleContext === "string" &&
    input.rareVehicleContext.length > 0;

  if (wantsSecondary) {
    secondaryTriggered = true;
    const secondaryOutcome = await runRaw(
      "openai",
      input.rareVehicleContext as string,
      false,
    );
    providersAttempted.push("openai");
    totalEstCost += estimateProviderCost("openai");
    if (secondaryOutcome.actualCostUsd != null) {
      totalActualCost += secondaryOutcome.actualCostUsd;
    }
    if (secondaryOutcome.rawResult) {
      secondary = secondaryOutcome;
      providersUsed.push("openai");
    } else {
      // Best-effort: log + continue, do NOT mark degraded.
      console.warn(
        `[routeCarBotHybrid] OpenAI secondary failed for item ${input.itemId}: ${secondaryOutcome.error ?? "unknown"}`,
      );
    }
  }

  // ── Merge: primary as base, overlay secondary's rare-
  //    vehicle specialist blocks ──
  let mergedResult: any;
  let mergedStrategy: "primary_only" | "merged_consensus" | "degraded";

  if (primary.rawResult && secondary?.rawResult) {
    mergedResult = { ...primary.rawResult };
    // CarBot secondary overlays specialist rare-vehicle context:
    // value_drivers + market + ownership_costs blocks get the
    // OpenAI rare-car specialist treatment when present.
    if (secondary.rawResult?.value_drivers) {
      mergedResult.value_drivers = secondary.rawResult.value_drivers;
    }
    if (secondary.rawResult?.market && !mergedResult.market) {
      mergedResult.market = secondary.rawResult.market;
    }
    mergedStrategy = "merged_consensus";
  } else if (primary.rawResult) {
    mergedResult = primary.rawResult;
    mergedStrategy = "primary_only";
  } else {
    mergedResult = null;
    mergedStrategy = "degraded";
  }

  const degraded = !primary.rawResult;

  // Hoist grounding citations to top-level result. Only Gemini
  // (when grounded + successful) populates them. Empty array
  // when grounding off, fallback fired, or no citations returned.
  const geminiWebSources: Array<{ url: string; title: string }> =
    primary.provider === "gemini" && Array.isArray(primary.geminiWebSources)
      ? primary.geminiWebSources
      : [];

  // Aggregated token usage (primary + secondary, when present).
  const aggregatedTokens = {
    input:
      (primary.tokens?.inputTokens ?? 0) +
      (secondary?.tokens?.inputTokens ?? 0),
    output:
      (primary.tokens?.outputTokens ?? 0) +
      (secondary?.tokens?.outputTokens ?? 0),
    total:
      (primary.tokens?.totalTokens ?? 0) +
      (secondary?.tokens?.totalTokens ?? 0),
  };

  const result: CarBotHybridResult = {
    primary,
    secondary,
    mergedResult,
    geminiWebSources,
    secondaryTriggered,
    mergedStrategy,
    costUsd: Number(totalEstCost.toFixed(5)),
    actualCostUsd: Number(totalActualCost.toFixed(6)),
    tokens: aggregatedTokens,
    latencyMs: Date.now() - startedAt,
    degraded,
    error: degraded ? primary.error ?? "All providers failed" : undefined,
  };

  // ── Fire-and-forget routing log ───────────────────────
  if (!input.skipLogging) {
    try {
      void logRoutingDecision({
        itemId: input.itemId,
        payload: {
          botName: "carbot",
          primary: primary.provider,
          secondary: secondary?.provider,
          triggersFired: secondaryTriggered ? ["rare_vehicle"] : [],
          providersAttempted,
          providersUsed,
          costUsd: result.costUsd,
          actualCostUsd: result.actualCostUsd,
          ...(input.apifyCostUsd != null
            ? { apifyCostUsd: input.apifyCostUsd }
            : {}),
          latencyMs: result.latencyMs,
          fallbackUsed,
          degraded,
          confidence: null, // CarBot does not produce AiAnalysis confidence
          mergedStrategy,
          tokens: {
            [primary.provider]: {
              input: primary.tokens?.inputTokens ?? null,
              output: primary.tokens?.outputTokens ?? null,
              total: primary.tokens?.totalTokens ?? null,
            },
            ...(secondary?.tokens
              ? {
                  [secondary.provider]: {
                    input: secondary.tokens.inputTokens,
                    output: secondary.tokens.outputTokens,
                    total: secondary.tokens.totalTokens,
                  },
                }
              : {}),
          },
          demoMode,
          error: result.error,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (e: any) {
      // Logging must NEVER bubble up to the caller.
      console.warn(
        `[routeCarBotHybrid] log dispatch failed for item ${input.itemId}: ${e?.message ?? e}`,
      );
    }
  }

  return result;
}
