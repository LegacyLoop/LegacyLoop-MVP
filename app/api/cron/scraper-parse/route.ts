import { NextRequest, NextResponse } from "next/server";
import { processBatch } from "@/lib/scraper-parser/parser";
import type { ParseInput } from "@/lib/scraper-parser/types";

export const maxDuration = 800; // 13.3 min · spec §4 Q6 (under Vercel cron 15-min cap)

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

  // Cap at 20 per cron call · spec §4 Q6
  const capped = inputs.slice(0, 20);
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
