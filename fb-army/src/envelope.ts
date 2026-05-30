// fb-army · canonical corpus envelope · W19-L1 + W22-L1 contract
// Drain expects { id, title, body, metadata } per entry · ZERO flat-shape allowed

export type CorpusEntry = {
  id: string;            // deterministic · format `fb-army-{surface}-{hash}`
  title: string;         // <=200 chars
  body: string;          // text body · context + provenance hint
  metadata: Record<string, unknown>;
};

export type CorpusEnvelope = {
  source: string;        // e.g. "fb-army-marketplace"
  corpusId: string;      // e.g. "fb-army-marketplace-2026-05-29"
  verticalId: string;    // e.g. "V4" (regional) or "V9" (marketplace)
  domain: string;        // e.g. "fb-marketplace" / "fb-groups"
  sourceTier: "T2";      // own-tech droplet · not vendor
  batchSize: number;
  emittedAt: string;     // ISO
  sources: string[];     // ["fb-army-marketplace"]
  entries: CorpusEntry[];
};

export type IngestPayload = {
  action: "phase_c_ingest";
  data: CorpusEnvelope;
};

export function buildEnvelope(args: {
  source: string;
  corpusId: string;
  verticalId: string;
  domain: string;
  sources: string[];
  entries: CorpusEntry[];
}): IngestPayload {
  return {
    action: "phase_c_ingest",
    data: {
      source: args.source,
      corpusId: args.corpusId,
      verticalId: args.verticalId,
      domain: args.domain,
      sourceTier: "T2",
      batchSize: args.entries.length,
      emittedAt: new Date().toISOString(),
      sources: args.sources,
      entries: args.entries,
    },
  };
}

// Hash helper · deterministic id without sha-lib dep (Node 20 built-in)
import { createHash } from "node:crypto";

export function makeId(parts: string[]): string {
  const h = createHash("sha1").update(parts.join("|")).digest("hex").slice(0, 16);
  return `fb-army-${h}`;
}
