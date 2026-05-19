import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { prisma } from "@/lib/db";
import { graphIngestExternalCorpus } from "@/lib/sylvia/graphify";
import {
  crossValidate,
  validateExternalCorpus,
} from "@/lib/sylvia/truth-crossval";
import { appendEpisodic } from "@/lib/sylvia/memory";

// CMD-WEBHOOK-PHASE-C-INGEST-HANDLER V20 LOW · 2026-05-18:
// Phase C V1-V12 + Wave 2 V13-V16 corpus ingest payload shape.
// Inbound n8n batch from authored workflow JSONs · Source URLs Code-node
// N-items pattern · x-webhook-secret shared-secret auth (matches Cyl 7A).
interface PhaseCIngestEntry {
  id: string;
  title: string;
  body: string;
  metadata: {
    source: string;
    sourceUrl: string;
    sourceTier: string;
    verticalId: string;
    corpusId: string;
    domain: string;
    [k: string]: unknown;
  };
}

interface PhaseCIngestPayload {
  entries: PhaseCIngestEntry[];
  corpusId?: string;
  verticalId?: string;
  domain?: string;
  sourceTier?: string;
  batchSize?: number;
  emittedAt?: string;
}

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

/** POST — n8n callback webhook with secret validation
 *
 * CMD-CYL-7E-HMAC-DEFENSE V18 (R16 P0 · 2026-05-06): constant-time
 * compare via crypto.timingSafeEqual closes the timing-attack
 * side-channel on N8N_WEBHOOK_SECRET. Plain `!==` short-circuits at
 * first byte mismatch; an attacker can leak per-byte secret state by
 * timing 401 responses across many probe attempts. timingSafeEqual
 * always compares full Buffer length regardless of mismatch position.
 *
 * Length guard pre-empts the Buffer-length-mismatch throw: a wrong-
 * length secret is guaranteed-invalid → 401 immediately, no try/catch
 * needed. Behavior preserved verbatim for legitimate callers.
 */
export async function POST(req: NextRequest) {
  try {
    const secret = req.headers.get("x-webhook-secret") ?? "";
    const expectedSecret = process.env.N8N_WEBHOOK_SECRET;

    if (!expectedSecret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const provided = Buffer.from(secret, "utf8");
    const expected = Buffer.from(expectedSecret, "utf8");

    if (
      provided.length !== expected.length ||
      !timingSafeEqual(provided, expected)
    ) {
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
          // CMD-SCRAPER-USAGE-LOG-PAYLOAD-FIELD V18 (R15 P0): receiver
          // writes scraper.catch payload for cron-side reconstruction.
          // Cyl 7B wire-fill (R15 P1) consumes this field. Synchronous
          // write preserves idempotency contract (row written BEFORE ack
          // returns).
          payloadJson: JSON.stringify(payload),
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

    // CMD-WEBHOOK-PHASE-C-INGEST-HANDLER V20 LOW · 2026-05-18:
    // Phase C V1-V12 + Wave 2 V13-V16 corpus ingest pipeline.
    // Receives n8n workflow batch · cross-validates via Phase 8 crossValidate
    // (synthetic NextRequest → M10 chokepoint · BINDING #46 anchor) · routes
    // per agreementScore (≥70 accepted · 40-69 quarantined · <40 discarded
    // with audit log) · ingests via Phase 6 graphIngestExternalCorpus.
    // BINDING #10 chokepoint preserved · BINDING #16 clone scraper.catch shape ·
    // BINDING #31 EpisodicEventType UNTOUCHED · payload.phase_c_ingest="v1"
    // sentinel. Reusable across all 16 verticals · zero per-cyl handler edit.
    if (action === "phase_c_ingest") {
      const payload = data as PhaseCIngestPayload | null;

      if (
        !payload?.entries ||
        !Array.isArray(payload.entries) ||
        payload.entries.length === 0
      ) {
        return NextResponse.json(
          { error: "Invalid payload · entries array required" },
          { status: 400 }
        );
      }

      const corpusId =
        payload.corpusId ||
        `phase-c-${payload.verticalId || "unknown"}-${Date.now()}`;
      const domain = payload.domain || "unknown";
      const verticalId = payload.verticalId || "unknown";
      const sourceTier = payload.sourceTier || "T5";
      let accepted = 0;
      let quarantined = 0;
      let discarded = 0;
      let totalCostUsd = 0;
      const sessionId = `phase-c-${verticalId}-${Date.now()}`;

      for (const entry of payload.entries) {
        const entrySource =
          (typeof entry.metadata?.source === "string"
            ? entry.metadata.source
            : null) || "unknown";
        let agreementScore = 0;
        let auditId = "";

        try {
          const crossval = await crossValidate({
            prompt: `Validate factual claims in this ${domain} corpus excerpt: ${entry.body.slice(0, 2000)}`,
            context: { namespace: `skill:domain-${domain}-${entrySource}` },
            sources: ["consensus"],
            stakes: "high",
            maxBudgetUsd: 0.5,
          });
          if (crossval) {
            agreementScore = crossval.agreementScore;
            auditId = crossval.auditId;
            totalCostUsd += crossval.totalCostUsd;
          } else {
            const stub = await validateExternalCorpus({
              corpus: entry.body,
              criteria: "factual",
              sourceUrl:
                typeof entry.metadata?.sourceUrl === "string"
                  ? entry.metadata.sourceUrl
                  : "",
              maxBudgetUsd: 0.5,
            });
            agreementScore = stub.agreementScore;
            auditId = stub.auditId;
          }
        } catch (err) {
          console.error(
            `[N8N WEBHOOK · phase_c_ingest] crossval failed · entry=${entry.id}`,
            err
          );
          discarded += 1;
          await appendEpisodic({
            timestamp: new Date().toISOString(),
            sessionId,
            eventType: "error",
            payload: {
              phase_c_ingest: "v1",
              decision: "discard-crossval-error",
              verticalId,
              domain,
              source: entrySource,
              entryId: entry.id,
              error: err instanceof Error ? err.message : "unknown",
            },
            source: "direct",
          }).catch(() => undefined);
          continue;
        }

        let decision: "accept" | "quarantine" | "discard";
        let targetCorpusId = corpusId;
        if (agreementScore >= 70) {
          decision = "accept";
          accepted += 1;
        } else if (agreementScore >= 40) {
          decision = "quarantine";
          targetCorpusId = `quarantine-${corpusId}`;
          quarantined += 1;
        } else {
          decision = "discard";
          discarded += 1;
        }

        if (decision !== "discard") {
          try {
            await graphIngestExternalCorpus({
              source: "n8n-workflow",
              corpusId: targetCorpusId,
              domain,
              entries: [
                {
                  id: entry.id,
                  title: entry.title,
                  body: entry.body,
                  metadata: {
                    ...entry.metadata,
                    agreementScore,
                    auditId,
                    decision,
                    validatedAt: new Date().toISOString(),
                  },
                },
              ],
            });
          } catch (err) {
            console.error(
              `[N8N WEBHOOK · phase_c_ingest] graphify failed · entry=${entry.id}`,
              err
            );
          }
        }

        await appendEpisodic({
          timestamp: new Date().toISOString(),
          sessionId,
          eventType: "consensus",
          payload: {
            phase_c_ingest: "v1",
            decision,
            verticalId,
            domain,
            source: entrySource,
            sourceTier,
            agreementScore,
            auditId,
            entryId: entry.id,
            corpusId: targetCorpusId,
          },
          source: "direct",
        }).catch(() => undefined);
      }

      console.log(
        `[N8N WEBHOOK · phase_c_ingest] vertical=${verticalId} domain=${domain} accepted=${accepted} quarantined=${quarantined} discarded=${discarded} costUsd=${totalCostUsd.toFixed(4)}`
      );

      return NextResponse.json({
        ok: true,
        received: action,
        verticalId,
        domain,
        processed: payload.entries.length,
        accepted,
        quarantined,
        discarded,
        totalCostUsd,
      });
    }

    return NextResponse.json({ ok: true, received: action });
  } catch (err) {
    console.error("[N8N WEBHOOK ERROR]", err);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
