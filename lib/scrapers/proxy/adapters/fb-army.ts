import type { Adapter } from "../base";
import { envPresent } from "../base";

// W23-L3 FB-Army ingest receiver.
// Receives results from World-B droplet army (W23-L2 sends → this validates → corpus).
// DORMANT by default (envPresent gate). Activate via FB_ARMY_INGEST_SECRET in Vercel env.
//
// W22-L1 LESSON ENCODED: never silent-drop malformed entries.
// Every record validated against {id,title,body,metadata} envelope.
// call() returns explicit { accepted, rejected, rejectReasons, acceptedIds } counts.

const OPERATIONS = ["ingest"] as const;

interface ArmyRecord {
  id?: unknown;
  title?: unknown;
  body?: unknown;
  metadata?: unknown;
  [k: string]: unknown;
}

interface IngestParams {
  records?: unknown;
  secret?: unknown;
  source?: unknown;
}

interface IngestResult {
  accepted: number;
  rejected: number;
  total: number;
  acceptedIds: ReadonlyArray<string>;
  rejectReasons: ReadonlyArray<{ index: number; reason: string }>;
  source: string;
}

function validateRecord(rec: unknown, index: number): { ok: true; id: string } | { ok: false; reason: string } {
  if (rec === null || typeof rec !== "object") {
    return { ok: false, reason: `index=${index} not-an-object` };
  }
  const r = rec as ArmyRecord;
  if (typeof r.id !== "string" || r.id.length === 0) {
    return { ok: false, reason: `index=${index} id-missing-or-empty` };
  }
  if (typeof r.title !== "string" || r.title.length === 0) {
    return { ok: false, reason: `index=${index} title-missing-or-empty` };
  }
  if (typeof r.body !== "string") {
    return { ok: false, reason: `index=${index} body-missing-or-non-string` };
  }
  if (r.metadata === null || typeof r.metadata !== "object") {
    return { ok: false, reason: `index=${index} metadata-missing-or-non-object` };
  }
  return { ok: true, id: r.id };
}

export const fbArmyAdapter: Adapter = {
  provider: "fb-army",
  enabled: envPresent("FB_ARMY_INGEST_SECRET"),
  operations: OPERATIONS,
  async call(operation, params) {
    if (operation !== "ingest") {
      throw new Error(`fb-army: unknown operation ${operation}`);
    }
    const p = params as IngestParams;

    // Shared-secret auth: caller must pass matching secret in params.
    const expected = process.env.FB_ARMY_INGEST_SECRET;
    if (!expected) {
      throw new Error("fb-army: FB_ARMY_INGEST_SECRET not set (dormant)");
    }
    if (typeof p.secret !== "string" || p.secret !== expected) {
      throw new Error("fb-army: secret mismatch");
    }

    const recordsInput = Array.isArray(p.records) ? p.records : null;
    if (!recordsInput) {
      throw new Error("fb-army: records must be an array");
    }

    const acceptedIds: string[] = [];
    const rejectReasons: Array<{ index: number; reason: string }> = [];

    for (let i = 0; i < recordsInput.length; i++) {
      const v = validateRecord(recordsInput[i], i);
      if (v.ok) {
        acceptedIds.push(v.id);
      } else {
        rejectReasons.push({ index: i, reason: v.reason });
      }
    }

    const result: IngestResult = {
      accepted: acceptedIds.length,
      rejected: rejectReasons.length,
      total: recordsInput.length,
      acceptedIds,
      rejectReasons,
      source: typeof p.source === "string" ? p.source : "fb-army-unknown",
    };

    // W22-L1 lesson: return loud counts. Caller MUST inspect both fields.
    // Silent-drop is impossible because rejected > 0 surfaces in the response.
    return result;
  },
};
