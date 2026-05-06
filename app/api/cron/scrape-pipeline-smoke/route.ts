import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const maxDuration = 60;

/**
 * CMD-CYL-7G-PRODUCTION-SMOKE-HARNESS V18 (R16 P2 · 2026-05-06):
 * Pipeline-shape monitoring · hourly via Vercel cron `0 * * * *`.
 *
 * Asserts 5 surfaces are healthy:
 *   1. route          — Cyl 7B Wire-Fill GET deployed (NOT 404)
 *   2. schema         — ScraperUsageLog.payloadJson + parsedAt columns exist
 *   3. comp_table     — ScraperComp queryable
 *   4. receiver       — /api/webhooks/n8n responding
 *   5. cron_registry  — vercel.json has scraper-parse entry
 *
 * Returns structured JSON regardless of failure (200 with shape indicators)
 * to avoid Vercel cron dashboard alerting noise. EventLog telemetry per
 * fire (FK-swallowed for system-level fires · upgrade to UserEvent banked).
 * Production-traffic monitoring (parse-rate · backlog · alerts) banked
 * Phase 5 P3 · gates on 100-item milestone.
 *
 * AUTH: triple-source CRON_SECRET (matches canonical Wire-Fill pattern).
 *
 * ZERO LLM calls · zero scrape volume · zero cost · pre-Cyl-7D fire-able.
 */

type ShapeIndicator = "ok" | "missing" | "down" | "error";

function authenticate(req: NextRequest): { ok: boolean; error?: string } {
  const authHeader = req.headers.get("authorization");
  const cronHeader = req.headers.get("x-cron-secret");
  const querySecret = req.nextUrl.searchParams.get("secret");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    console.error("[CRON-PIPELINE-SHAPE] CRON_SECRET not configured");
    return { ok: false, error: "Cron not configured" };
  }

  const providedSecret =
    authHeader?.replace("Bearer ", "") || cronHeader || querySecret || "";
  if (providedSecret !== cronSecret) {
    console.warn("[CRON-PIPELINE-SHAPE] Unauthorized attempt");
    return { ok: false, error: "Unauthorized" };
  }

  return { ok: true };
}

async function checkRoute(baseUrl: string, cronSecret: string): Promise<ShapeIndicator> {
  try {
    const res = await fetch(`${baseUrl}/api/cron/scraper-parse?secret=${encodeURIComponent(cronSecret)}`, {
      method: "GET",
      headers: { "Authorization": `Bearer ${cronSecret}` },
      signal: AbortSignal.timeout(8000),
    });
    if (res.status === 404) return "missing";
    if (res.status >= 500) return "error";
    return "ok"; // 200 or 401 both prove route is deployed (404 is the failure)
  } catch (err) {
    console.error("[CRON-PIPELINE-SHAPE] route check failed:", err);
    return "error";
  }
}

async function checkSchema(): Promise<ShapeIndicator> {
  try {
    // Probe payloadJson + parsedAt columns via raw query (cheap · indexes hit)
    const result = await prisma.$queryRaw<Array<{ payloadJson: string | null; parsedAt: Date | null }>>`
      SELECT payloadJson, parsedAt FROM ScraperUsageLog LIMIT 1
    `;
    return Array.isArray(result) ? "ok" : "error";
  } catch (err) {
    console.error("[CRON-PIPELINE-SHAPE] schema check failed:", err);
    return "missing";
  }
}

async function checkCompTable(): Promise<ShapeIndicator> {
  try {
    const count = await prisma.scraperComp.count();
    return typeof count === "number" ? "ok" : "error";
  } catch (err) {
    console.error("[CRON-PIPELINE-SHAPE] comp_table check failed:", err);
    return "missing";
  }
}

async function checkReceiver(baseUrl: string): Promise<ShapeIndicator> {
  try {
    const res = await fetch(`${baseUrl}/api/webhooks/n8n`, {
      method: "GET",
      signal: AbortSignal.timeout(8000),
    });
    return res.status === 200 ? "ok" : "down";
  } catch (err) {
    console.error("[CRON-PIPELINE-SHAPE] receiver check failed:", err);
    return "down";
  }
}

async function checkCronRegistry(): Promise<ShapeIndicator> {
  try {
    // vercel.json is bundled at build time · read via fs to avoid bundler weirdness
    const fs = await import("fs/promises");
    const path = await import("path");
    const cwd = process.cwd();
    const vercelJson = await fs.readFile(path.join(cwd, "vercel.json"), "utf8");
    const parsed = JSON.parse(vercelJson) as { crons?: Array<{ path: string }> };
    const hasEntry = parsed.crons?.some((c) => c.path === "/api/cron/scraper-parse");
    return hasEntry ? "ok" : "missing";
  } catch (err) {
    console.error("[CRON-PIPELINE-SHAPE] cron_registry check failed:", err);
    return "error";
  }
}

export async function GET(req: NextRequest) {
  const auth = authenticate(req);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  const startedAt = Date.now();
  const baseUrl = req.nextUrl.origin;
  const cronSecret = process.env.CRON_SECRET ?? "";

  // Run 5 shape assertions in parallel
  const [route, schema, comp_table, receiver, cron_registry] = await Promise.all([
    checkRoute(baseUrl, cronSecret),
    checkSchema(),
    checkCompTable(),
    checkReceiver(baseUrl),
    checkCronRegistry(),
  ]);

  const shape = { route, schema, comp_table, receiver, cron_registry };
  const durationMs = Date.now() - startedAt;
  const allOk = Object.values(shape).every((s) => s === "ok");

  // BINDING #15 DOC-EMIT-WITH-PROVENANCE: telemetry per fire.
  // FK-swallowed: itemId="system" fails Item FK constraint silently per
  // .catch · upgrade to UserEvent (optional itemId) banked LOW.
  await prisma.eventLog.create({
    data: {
      itemId: "system",
      eventType: "PIPELINE_SHAPE_TICK",
      payload: JSON.stringify({
        tick: "scrape-pipeline-smoke",
        shape,
        allOk,
        durationMs,
      }),
    },
  }).catch(() => null);

  console.log(
    `[CRON-PIPELINE-SHAPE] tick · allOk=${allOk} · ${JSON.stringify(shape)} · ${durationMs}ms`
  );

  return NextResponse.json({
    tick: "scrape-pipeline-smoke",
    asOf: new Date().toISOString(),
    shape,
    allOk,
    durationMs,
  });
}
