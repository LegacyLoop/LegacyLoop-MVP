import OpenAI from "openai";
import type { ScraperParsedItem, ParseInput } from "./types";
import { SYSTEM_PROMPT, buildUserPrompt } from "./prompt";

/**
 * CMD-CYLINDER-7B-OLLAMA-GATEWAY-PARSE V18: Gateway-only Ollama adapter.
 *
 * ADVISOR A1 ABSOLUTE: zero LangChain. CUSTOM adapter only.
 * DOC-TELEMETRY-LOCK ABSOLUTE: every LLM call routes via LiteLLM Gateway.
 *
 * Pattern adapts lib/adapters/multi-ai.ts:206-214 with one path delta:
 *   baseURL: `${process.env.LITELLM_BASE_URL}/v1`
 *
 * Path note: multi-ai.ts uses `/openai/v1` because it routes the OpenAI
 * client to LiteLLM's OpenAI-passthrough handler. For local models in
 * the LiteLLM model_list (e.g. llama-3.2-local), the catch-all
 * `/v1/chat/completions` endpoint performs the model_list lookup and
 * routes to the configured provider (Ollama). Verified at fire time:
 * `/openai/v1/...` returns 404 model_not_found for local aliases;
 * `/v1/...` returns the expected completion. §8 creative latitude.
 *
 * Backing model: ollama/llama3.2:3b via litellm_config.yaml:34-37 alias.
 * Daemon: scripts/install-ollama-autostart.sh launchctl-supervised.
 */

const TIMEOUT_MS = 60_000;
const MAX_ATTEMPTS = 3;
const BACKOFF_MS = [0, 2_000, 4_000]; // before attempts 1, 2, 3

// Note: api_key is a placeholder — LiteLLM proxy in DEV runs without
// master_key (litellm_config.yaml documents this), but the OpenAI SDK
// requires a non-empty string. "ollama-no-key" is a sentinel value.
const ollama = process.env.LITELLM_BASE_URL
  ? new OpenAI({
      apiKey: "ollama-no-key",
      baseURL: `${process.env.LITELLM_BASE_URL}/v1`,
    })
  : null;

export interface ParseAttemptResult {
  success: boolean;
  parsed?: ScraperParsedItem;
  error?: string;
  attempts: number;
  durationMs: number;
}

export async function parseScraperOutput(
  input: ParseInput
): Promise<ParseAttemptResult> {
  const start = Date.now();

  if (!ollama) {
    return {
      success: false,
      error:
        "LITELLM_BASE_URL not set in env (DEV-only · this cylinder requires Gateway)",
      attempts: 0,
      durationMs: 0,
    };
  }

  let lastError = "";
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    if (BACKOFF_MS[attempt - 1] > 0) {
      await new Promise((r) => setTimeout(r, BACKOFF_MS[attempt - 1]));
    }

    try {
      const res = await Promise.race([
        ollama.chat.completions.create({
          model: "llama-3.2-local",
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: buildUserPrompt(input) },
          ],
          temperature: 0.1,
          max_tokens: 768,
          response_format: { type: "json_object" },
        }),
        new Promise<never>((_, reject) =>
          setTimeout(
            () => reject(new Error("llama-3.2-local timeout (60s)")),
            TIMEOUT_MS
          )
        ),
      ]);

      const text = res.choices?.[0]?.message?.content ?? "";
      const obj = JSON.parse(text);

      const now = new Date().toISOString();
      const parsed: ScraperParsedItem = {
        slug: input.scraperId,
        sourceUrl: input.itemUrl,
        sourcePlatform: input.platform,
        title: String(obj.title ?? "Unknown Item"),
        description: obj.description ?? null,
        priceUsd: obj.priceUsd != null ? Number(obj.priceUsd) : null,
        soldPrice: obj.soldPrice != null ? Number(obj.soldPrice) : null,
        condition: obj.condition ?? null,
        category: obj.category ?? null,
        keywordsJson: Array.isArray(obj.keywords)
          ? JSON.stringify(obj.keywords)
          : null,
        imageUrlsJson: Array.isArray(obj.imageUrls)
          ? JSON.stringify(obj.imageUrls)
          : null,
        metadataJson: obj.metadata ? JSON.stringify(obj.metadata) : null,
        parsedComps: Array.isArray(obj.parsedComps) ? obj.parsedComps : [],
        parsedByModel: "llama-3.2-local",
        parsedAt: now,
        parseDurationMs: Date.now() - start,
        parseConfidence:
          typeof obj.parseConfidence === "number"
            ? Math.max(0, Math.min(100, Math.round(obj.parseConfidence)))
            : 50,
      };

      return {
        success: true,
        parsed,
        attempts: attempt,
        durationMs: Date.now() - start,
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      lastError = msg.slice(0, 200);
      console.warn(
        `[scraper-parser] attempt ${attempt}/${MAX_ATTEMPTS} failed: ${lastError}`
      );
    }
  }

  return {
    success: false,
    error: `parse_failed_${MAX_ATTEMPTS}_attempts: ${lastError}`,
    attempts: MAX_ATTEMPTS,
    durationMs: Date.now() - start,
  };
}
