import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// CMD-CYLINDER-7A-N8N-WEBHOOK V18: payload shape for scraper.catch action.
// Mirrors lib/market-intelligence/types.ts MarketComp + ScraperResult so
// Cyl 7B (Ollama parse) + Cyl 7C (ScraperComp persist) consume unchanged.
interface N8NScraperCatchPayload {
  scraperId: string;
  platform: string;
  itemUrl: string;
  rawHtml?: string | null;
  parsedFields?: {
    comps?: Array<{
      item: string;
      price: number;
      date: string;
      platform: string;
      condition: string;
      url?: string;
      location?: string | null;
    }>;
    compsCount?: number;
    median?: number | null;
    source?: string;
    [key: string]: unknown;
  };
}

/** GET — Health check */
export async function GET() {
  return NextResponse.json({ status: "ok", service: "n8n-webhook" });
}

/** POST — n8n callback webhook with secret validation */
export async function POST(req: NextRequest) {
  try {
    const secret = req.headers.get("x-webhook-secret");
    const expectedSecret = process.env.N8N_WEBHOOK_SECRET;

    if (!expectedSecret || secret !== expectedSecret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { action, data } = await req.json().catch(() => ({ action: null, data: null }));

    console.log(`[N8N WEBHOOK] action=${action}`);

    if (action === "ping") {
      return NextResponse.json({ ok: true, message: "pong" });
    }

    // CMD-CYLINDER-7A-N8N-WEBHOOK V18: scraper.catch action receives n8n→Apify
    // scraper output · validates payload · dedupes idempotently within 24h
    // window · writes ScraperUsageLog row · returns 200 ack. Cyl 7B parses ·
    // Cyl 7C persists to ScraperComp. Zero AI calls · zero LangChain · advisor
    // A1 absolute · advisor I3 100-item milestone foundation.
    if (action === "scraper.catch") {
      const payload = data as N8NScraperCatchPayload | null;

      // Payload validation
      if (!payload?.scraperId || !payload?.platform || !payload?.itemUrl) {
        return NextResponse.json(
          { error: "Invalid payload · missing scraperId · platform · or itemUrl" },
          { status: 400 }
        );
      }

      // Idempotency · 24h window dedupe via ScraperUsageLog
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const existing = await prisma.scraperUsageLog.findFirst({
        where: {
          botName: "n8n_scraper_catch",
          slug: payload.scraperId,
          createdAt: { gte: since },
        },
        select: { id: true },
      });
      if (existing) {
        return NextResponse.json(
          { received: true, dedupe: true, scraperId: payload.scraperId },
          { status: 200 }
        );
      }

      // Telemetry · ScraperUsageLog (itemId optional · suits webhook ingress).
      // Direct prisma.create instead of logScraperUsage helper because we need
      // the row written BEFORE ack returns (idempotency contract — helper is
      // fire-and-forget by design and would race with subsequent receipts).
      await prisma.scraperUsageLog.create({
        data: {
          botName: "n8n_scraper_catch",
          slug: payload.scraperId,
          tier: 0,
          cost: 0,
          success: true,
          blocked: false,
          blockReason: null,
          compsReturned: payload.parsedFields?.compsCount ?? 0,
          durationMs: 0,
          itemId: null,
          userId: null,
        },
      });

      // Forward-compat hook: Cyl 7B picks up this row + payload to parse.
      console.log(
        `[N8N WEBHOOK · scraper.catch] platform=${payload.platform} url=${payload.itemUrl} comps=${payload.parsedFields?.compsCount ?? 0}`
      );

      return NextResponse.json(
        { received: true, dedupe: false, scraperId: payload.scraperId },
        { status: 200 }
      );
    }

    return NextResponse.json({ ok: true, received: action });
  } catch (err) {
    console.error("[N8N WEBHOOK ERROR]", err);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
