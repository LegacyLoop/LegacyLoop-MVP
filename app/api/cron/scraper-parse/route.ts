import { NextRequest, NextResponse } from "next/server";
import { processBatch } from "@/lib/scraper-parser/parser";
import type { ParseInput } from "@/lib/scraper-parser/types";

export const maxDuration = 60; // CMD-VERCEL-MAXDURATION-HOTFIX V18 + CMD-CYLINDER-7B-V2-PARSER-HARDEN V18 · Hobby tier cap (Hobby 60s · Pro 300s · Enterprise 900s) · matches existing cron ceiling · LIMIT_PER_FIRE=8 (this cylinder · extracted from inline magic 20) · production fast-fail algebra: 8 × ~10ms = 80ms when LITELLM_BASE_URL undefined (architecturally correct on Vercel · Phase D opens hosted Gateway) · Pro upgrade is separate CEO business call · TIMEOUT_MS / MAX_ATTEMPTS / BACKOFF_MS tunes banked S20-CPU-BUDGET-TUNE if telemetry warrants

// CMD-CYLINDER-7B-V2-PARSER-HARDEN V18 · Hobby tier rate cap.
// 8 × ~10ms fast-fail (production · LITELLM_BASE_URL undefined) = 80ms wall ·
// safe under maxDuration=60s. Was inline magic number 20 (assumed Enterprise
// tier paired with maxDuration=800 · superseded by hotfix to 60). Banks
// S20-CPU-BUDGET-TUNE if telemetry warrants further reduction.
const LIMIT_PER_FIRE = 8;

/**
 * CMD-CYLINDER-7B-OLLAMA-GATEWAY-PARSE V18: cron-triggered consumer.
 * POST /api/cron/scraper-parse
 *
 * AUTH: triple-source CRON_SECRET (matches recon-autoscan/route.ts:17-36)
 *   - Authorization: Bearer $CRON_SECRET
 *   - x-cron-secret: $CRON_SECRET
 *   - ?secret=$CRON_SECRET
 *
 * BODY: { inputs: ParseInput[] }
 *   Each input: { scraperId, platform, itemUrl, rawHtml?, parsedFields? }
 *
 * RETURNS: 200 with { processed, parsed, errors } | 401 unauth | 400 invalid
 *
 * ADVISOR A1 ABSOLUTE: zero LangChain · all LLM via Gateway alias
 *   "llama-3.2-local" · adapter clones multi-ai.ts:206-214 pattern.
 */
export async function POST(req: NextRequest) {
  // ── Auth ──
  const authHeader = req.headers.get("authorization");
  const cronHeader = req.headers.get("x-cron-secret");
  const querySecret = req.nextUrl.searchParams.get("secret");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    console.error("[CRON-SCRAPER-PARSE] CRON_SECRET not configured");
    return NextResponse.json(
      { error: "Cron not configured" },
      { status: 500 }
    );
  }

  const providedSecret =
    authHeader?.replace("Bearer ", "") || cronHeader || querySecret || "";
  if (providedSecret !== cronSecret) {
    console.warn("[CRON-SCRAPER-PARSE] Unauthorized attempt");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ── Body validation ──
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

  // Cap per cron call · LIMIT_PER_FIRE constant declared at top of file
  // (CMD-CYLINDER-7B-V2-PARSER-HARDEN V18 · Hobby tier algebra)
  const capped = inputs.slice(0, LIMIT_PER_FIRE);
  if (capped.length === 0) {
    return NextResponse.json({ processed: 0, parsed: [], errors: [] });
  }

  console.log(
    `[CRON-SCRAPER-PARSE] Processing ${capped.length} input(s) via llama-3.2-local`
  );

  try {
    const { parsed, errors } = await processBatch(capped);
    console.log(
      `[CRON-SCRAPER-PARSE] Done · parsed=${parsed.length} errors=${errors.length}`
    );
    return NextResponse.json({ processed: capped.length, parsed, errors });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[CRON-SCRAPER-PARSE]", err);
    return NextResponse.json(
      { error: "Internal error", detail: msg.slice(0, 300) },
      { status: 500 }
    );
  }
}
