// app/api/internal/scraper-comp-count/route.ts
//
// CMD-SCRAPER-COMP-COUNT-ENDPOINT V19 · R22 P0 · 2026-05-07 LATE EOD
//
// Internal endpoint serving n8n PIVOT watcher (Cyl 7F).
// Returns { count, lastUpdated, status } from ScraperComp model.
// Authenticates via N8N_WEBHOOK_SECRET triple-source pattern (Bearer
// header · query token · X-Webhook-Secret header) with constant-time
// compare per R16 P0 canonical pattern (615de06).
//
// Push-back-with-replacement: N8N_WEBHOOK_SECRET reused vs new
// INTERNAL_API_TOKEN (zero new env var · symmetric auth model).

import { NextResponse, type NextRequest } from "next/server";
import { timingSafeEqual } from "crypto";
import { prisma } from "@/lib/db";

export const maxDuration = 30;

const SECRET_HEADER_BEARER = "authorization";
const SECRET_HEADER_X = "x-webhook-secret";
const SECRET_QUERY = "token";

function resolveProvidedSecret(req: NextRequest): string | null {
  const authHeader = req.headers.get(SECRET_HEADER_BEARER);
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice("Bearer ".length).trim();
  }

  const xWebhook = req.headers.get(SECRET_HEADER_X);
  if (xWebhook) return xWebhook.trim();

  const url = new URL(req.url);
  const queryToken = url.searchParams.get(SECRET_QUERY);
  if (queryToken) return queryToken.trim();

  return null;
}

// Constant-time compare per R16 P0 canonical (app/api/webhooks/n8n/route.ts:62).
function constantTimeEquals(a: string, b: string): boolean {
  const aBuf = Buffer.from(a, "utf8");
  const bBuf = Buffer.from(b, "utf8");
  if (aBuf.length !== bBuf.length) return false;
  return timingSafeEqual(aBuf, bBuf);
}

export async function GET(req: NextRequest) {
  const expected = process.env.N8N_WEBHOOK_SECRET;
  if (!expected) {
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }

  const provided = resolveProvidedSecret(req);
  if (!provided || !constantTimeEquals(provided, expected)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const count = await prisma.scraperComp.count();
    const latest = await prisma.scraperComp.findFirst({
      orderBy: { lastSeenAt: "desc" },
      select: { lastSeenAt: true },
    });

    return NextResponse.json({
      count,
      lastUpdated: latest?.lastSeenAt?.toISOString() ?? null,
      status: "ok",
    });
  } catch (err) {
    console.error("[scraper-comp-count]", err);
    return NextResponse.json(
      { error: "Internal server error", status: "error" },
      { status: 500 }
    );
  }
}
