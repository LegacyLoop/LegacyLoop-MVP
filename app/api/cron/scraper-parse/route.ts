import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { processBatch } from "@/lib/scraper-parser/parser";
import { persistScraperParsedItems } from "@/lib/scraper-comp/persist";
import type { ParseInput } from "@/lib/scraper-parser/types";
import { verifyCronSecret } from "@/lib/auth/cron-auth";

export const maxDuration = 60;

const LIMIT_PER_FIRE = 8;

/**
 * CMD-CYL-7B-WIRE-FILL V18 (R15 P1 · 2026-05-06): consumer cron
 * route for scraper.catch payloads queued by Cyl 7A receiver.
 *
 * GET handler: Vercel cron at every-15-min schedule polls
 * ScraperUsageLog for unprocessed rows (payloadJson NOT NULL AND
 * parsedAt IS NULL), reconstructs ParseInput[], invokes 7B parser,
 * persists results via 7C, marks parsedAt on success.
 *
 * POST handler: preserved for manual smoke testing (accepts
 * {inputs:ParseInput[]} in body · backward compat with original
 * Cyl 7B ship 0e4b64f).
 *
 * AUTH: triple-source CRON_SECRET (preserved from prior route ·
 * Authorization: Bearer · x-cron-secret · ?secret).
 *
 * IDEMPOTENCY: 3-layer
 *   1. Receiver layer: 24h ScraperUsageLog dedupe at receipt (Cyl 7A)
 *   2. Cron layer: parsedAt IS NULL filter excludes processed rows
 *   3. Persister layer: ScraperComp @@unique([slug, sourceUrl])
 *
 * ADVISOR A1 ABSOLUTE: zero LangChain · all LLM via Gateway alias
 *   "llama-3.2-local". DOC-TELEMETRY-LOCK preserved.
 *
 * Hobby tier cap: 60s maxDuration · LIMIT_PER_FIRE=8 · production
 * fast-fail algebra: 8 × ~10ms = 80ms when LITELLM_BASE_URL undefined
 * (architecturally correct on Vercel · Phase D opens hosted Gateway).
 */

// CMD-CRON-SECRET-CONSTANT-TIME-MIRROR V19 (R23 P2 · 2026-05-08):
// Auth migrated from inline string-equality to lib/auth/cron-auth helper
// (constant-time compare via crypto.timingSafeEqual). DOC-CRYPTO-CTC 4/5.

async function processInputs(inputs: ParseInput[]): Promise<{
  parsed: number;
  failed: number;
  persistResult: { written: number; deduped: number; durationMs: number };
}> {
  const capped = inputs.slice(0, LIMIT_PER_FIRE);
  if (capped.length === 0) {
    return {
      parsed: 0,
      failed: 0,
      persistResult: { written: 0, deduped: 0, durationMs: 0 },
    };
  }

  console.log(
    `[CRON-SCRAPER-PARSE] Processing ${capped.length} input(s) via llama-3.2-local`
  );

  const { parsed, errors } = await processBatch(capped);
  const persistResult = await persistScraperParsedItems(parsed, {
    contributingBot: "n8n_scraper_catch",
  }).catch((err) => {
    console.error("[CRON-SCRAPER-PARSE] Persist failure:", err);
    return { written: 0, deduped: 0, durationMs: 0 };
  });

  console.log(
    `[CRON-SCRAPER-PARSE] Done · parsed=${parsed.length} errors=${errors.length} persisted=${persistResult.written} deduped=${persistResult.deduped}`
  );

  return { parsed: parsed.length, failed: errors.length, persistResult };
}

/**
 * GET handler — Vercel cron entry point.
 * Polls ScraperUsageLog · processes batch · marks parsedAt.
 */
export async function GET(req: NextRequest) {
  const auth = verifyCronSecret(req);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  const startedAt = Date.now();

  // Poll unprocessed rows · FIFO · capped per fire
  const unprocessed = await prisma.scraperUsageLog.findMany({
    where: {
      payloadJson: { not: null },
      parsedAt: null,
    },
    orderBy: { createdAt: "asc" },
    take: LIMIT_PER_FIRE,
    select: { id: true, slug: true, payloadJson: true },
  });

  if (unprocessed.length === 0) {
    return NextResponse.json({
      tick: "scraper-parse",
      processed: 0,
      parsed: 0,
      failed: 0,
      message: "No unprocessed rows",
    });
  }

  // Reconstruct ParseInput[] from payloadJson · per-row try/catch on JSON.parse
  const candidates: { row: (typeof unprocessed)[number]; input: ParseInput }[] = [];
  for (const row of unprocessed) {
    if (!row.payloadJson) continue;
    try {
      const payload = JSON.parse(row.payloadJson);
      candidates.push({
        row,
        input: {
          scraperId: payload.scraperId,
          platform: payload.platform,
          itemUrl: payload.itemUrl,
          rawHtml: payload.rawHtml ?? null,
          parsedFields: payload.parsedFields ?? undefined,
        } as ParseInput,
      });
    } catch (err) {
      console.error(
        `[CRON-SCRAPER-PARSE] JSON.parse failed for row ${row.id}:`,
        err
      );
      // Mark as parsed (skip · malformed payload · won't recover)
      await prisma.scraperUsageLog.update({
        where: { id: row.id },
        data: { parsedAt: new Date() },
      });
    }
  }

  const result = await processInputs(candidates.map((c) => c.input));

  // Mark parsedAt on each successfully-staged row · per-row try/catch
  const now = new Date();
  for (const { row } of candidates) {
    try {
      await prisma.scraperUsageLog.update({
        where: { id: row.id },
        data: { parsedAt: now },
      });
    } catch (err) {
      console.error(
        `[CRON-SCRAPER-PARSE] parsedAt update failed for row ${row.id}:`,
        err
      );
    }
  }

  // Telemetry · DOC-EMIT-WITH-PROVENANCE (BINDING #15)
  const durationMs = Date.now() - startedAt;
  await prisma.eventLog
    .create({
      data: {
        itemId: "system", // cron has no per-item context · sentinel value
        eventType: "SCRAPER_PARSE_TICK",
        payload: JSON.stringify({
          processed: unprocessed.length,
          parsed: result.parsed,
          failed: result.failed,
          persisted: result.persistResult.written,
          deduped: result.persistResult.deduped,
          durationMs,
        }),
      },
    })
    .catch(() => null);

  return NextResponse.json({
    tick: "scraper-parse",
    processed: unprocessed.length,
    parsed: result.parsed,
    failed: result.failed,
    persisted: result.persistResult.written,
    deduped: result.persistResult.deduped,
    durationMs,
  });
}

/**
 * POST handler — manual smoke testing path · preserved from
 * Cyl 7B original ship 0e4b64f for backward compat.
 */
export async function POST(req: NextRequest) {
  const auth = verifyCronSecret(req);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  let body: { inputs?: ParseInput[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const inputs = body?.inputs;
  if (!Array.isArray(inputs)) {
    return NextResponse.json(
      { error: "Body must be { inputs: ParseInput[] }" },
      { status: 400 }
    );
  }

  const result = await processInputs(inputs);

  return NextResponse.json({
    processed: Math.min(inputs.length, LIMIT_PER_FIRE),
    parsed: result.parsed,
    errors: result.failed,
    persistResult: result.persistResult,
  });
}
