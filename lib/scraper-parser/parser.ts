import { prisma } from "@/lib/db";
import { parseScraperOutput } from "./adapter";
import type { ScraperParsedItem, ParseError, ParseInput } from "./types";

/**
 * CMD-CYLINDER-7B-OLLAMA-GATEWAY-PARSE V18: queue-pull worker.
 *
 * Consumes a single ParseInput · invokes Gateway adapter · writes
 * telemetry row to ScraperUsageLog (botName discriminator pattern ·
 * see spec §4 Q5 · ScraperUsageLog has no processedAt field per
 * prisma/schema.prisma:1205-1224 · idempotency via discriminator).
 */
export async function processOneRow(input: ParseInput): Promise<{
  parsed: ScraperParsedItem | null;
  error: ParseError | null;
}> {
  const result = await parseScraperOutput(input);

  if (result.success && result.parsed) {
    await prisma.scraperUsageLog.create({
      data: {
        botName: "ollama_parser_complete",
        slug: input.scraperId,
        tier: 0,
        cost: 0,
        success: true,
        blocked: false,
        blockReason: null,
        compsReturned: result.parsed.parsedComps.length,
        durationMs: result.durationMs,
        itemId: null,
        userId: null,
      },
    });
    return { parsed: result.parsed, error: null };
  }

  await prisma.scraperUsageLog.create({
    data: {
      botName: "ollama_parser_failed",
      slug: input.scraperId,
      tier: 0,
      cost: 0,
      success: false,
      blocked: false,
      blockReason: result.error ?? "unknown",
      compsReturned: 0,
      durationMs: result.durationMs,
      itemId: null,
      userId: null,
    },
  });

  return {
    parsed: null,
    error: {
      slug: input.scraperId,
      attempts: result.attempts,
      lastError: result.error ?? "unknown",
      totalDurationMs: result.durationMs,
    },
  };
}

export async function processBatch(inputs: ParseInput[]): Promise<{
  parsed: ScraperParsedItem[];
  errors: ParseError[];
}> {
  const parsed: ScraperParsedItem[] = [];
  const errors: ParseError[] = [];
  // Serial · OLLAMA_MAX_LOADED_MODELS=1 enforces this anyway · spec §4 Q6
  for (const input of inputs) {
    const r = await processOneRow(input);
    if (r.parsed) parsed.push(r.parsed);
    if (r.error) errors.push(r.error);
  }
  return { parsed, errors };
}
