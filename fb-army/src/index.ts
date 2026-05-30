/**
 * @deprecated CMD-W27-A · World-B wind-down (2026-05-30).
 * Burner droplet runtime · ban-evasion ToS risk · DO NOT ACTIVATE.
 * Retained @deprecated for git history (never-abandon · BINDING #20).
 * Reroute: Apify logged-OUT ($29 cap) + Meta Commerce Catalog API (W28).
 */
// fb-army · droplet runner · single-session orchestrator [DEPRECATED W27-A]
// Reads job spec from droplet env or CLI flag · World-B only

import { assertEgressSafety } from "./proxy-egress.js";
import { buildEnvelope, type CorpusEntry } from "./envelope.js";
import { scrapeMarketplace, type MarketplaceQuery } from "./scrapers/marketplace.js";
import { scrapeGroup, type GroupQuery } from "./scrapers/groups.js";
import { ingestToProxy } from "./ingest.js";

type Job =
  | { kind: "marketplace"; query: MarketplaceQuery }
  | { kind: "groups"; query: GroupQuery };

function loadJobFromEnv(): Job | null {
  const raw = process.env.FB_ARMY_JOB_JSON;
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Job;
  } catch {
    return null;
  }
}

export async function runJob(job: Job): Promise<{
  entries: CorpusEntry[];
  ingest: { ok: boolean; status: number; body: string };
}> {
  const safety = assertEgressSafety();
  if (!safety.ok) {
    throw new Error(`Egress isolation breach · ${safety.reasons.join("; ")}`);
  }

  let entries: CorpusEntry[] = [];
  let domain = "fb-unknown";
  let verticalId = "V4";

  if (job.kind === "marketplace") {
    entries = await scrapeMarketplace({ query: job.query });
    domain = "fb-marketplace";
    verticalId = "V9"; // marketplace = V9
  } else {
    entries = await scrapeGroup({ query: job.query });
    domain = "fb-groups";
    verticalId = "V10"; // groups = V10 social-resale
  }

  const corpusId = `fb-army-${domain}-${new Date().toISOString().slice(0, 10)}`;
  const payload = buildEnvelope({
    source: `fb-army-${domain}`,
    corpusId,
    verticalId,
    domain,
    sources: [`fb-army-${domain}`],
    entries,
  });

  const ingest = await ingestToProxy(payload);
  return { entries, ingest };
}

async function main(): Promise<void> {
  const job = loadJobFromEnv();
  if (!job) {
    console.error("fb-army: FB_ARMY_JOB_JSON env missing · supply job spec");
    process.exit(2);
  }
  const result = await runJob(job);
  console.log(JSON.stringify({
    entries: result.entries.length,
    ingest: { ok: result.ingest.ok, status: result.ingest.status },
  }, null, 2));
}

// Run as CLI when invoked directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((e) => {
    console.error("fb-army fatal:", e);
    process.exit(1);
  });
}
