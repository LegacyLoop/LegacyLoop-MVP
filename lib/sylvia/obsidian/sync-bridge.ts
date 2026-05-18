// lib/sylvia/obsidian/sync-bridge.ts
//
// CMD-SYLVIA-OBSIDIAN-BIDIRECTIONAL-SYNC V20 v2.1 R29 P-WAVE-20-PHASE-5 · 2026-05-18
//
// Bi-directional sync between Obsidian vault and hybrid recall engine.
//
// BINDING #10: consumer-only · zero new HTTP · vault reads via Phase 4 hybridRecall
//              vault writes call Phase 3 vectorInsert (already routes embed via
//              LiteLLM Gateway · BINDING #10 chokepoint preserved)
// BINDING #16: zero @claude-flow/* · custom-port concept · code custom-written
// BINDING #31: telemetry sentinel · eventType="triage" + payload.obsidian="v1"

import { createHash } from "node:crypto";
import { hybridRecall } from "../hybrid";
import { vectorInsert } from "../vector";
import { appendEpisodic } from "../memory";
import {
  ensureVaultStructure,
  writeVaultNote,
  readVaultNote,
} from "./vault-writer";
import type {
  ObsidianNote,
  ObsidianEpisodicPayload,
  SyncDirection,
  SyncOptions,
  VaultNamespace,
} from "./types";

function isObsidianEnabled(): boolean {
  return process.env.SYLVIA_OBSIDIAN_ENABLED === "1";
}

function hashBody(body: string): string {
  return "sha256:" + createHash("sha256").update(body).digest("hex").slice(0, 16);
}

async function safeEmit(
  payload: ObsidianEpisodicPayload,
  sessionId?: string,
): Promise<void> {
  if (!sessionId) return;
  try {
    await appendEpisodic({
      timestamp: new Date().toISOString(),
      sessionId,
      eventType: "triage",
      payload: payload as unknown as Record<string, unknown>,
      source: "direct",
    });
  } catch (err) {
    console.warn(
      `[sylvia-obsidian] episodic emit failed: ${err instanceof Error ? err.message : "unknown"}`,
    );
  }
}

/**
 * Hybrid → Vault · pulls top-K recall results for a namespace and emits
 * one markdown note per result. Feature-flag gated (default OFF).
 */
export async function syncHybridToVault(
  namespace: VaultNamespace,
  query: string,
  options: SyncOptions = {},
): Promise<{ written: number; paths: string[] }> {
  if (!isObsidianEnabled()) {
    return { written: 0, paths: [] };
  }

  const t0 = Date.now();
  await ensureVaultStructure();
  const limit = options.limit ?? 5;

  const results = await hybridRecall({
    query,
    scope: namespace,
    limit,
    sessionId: options.sessionId,
  });

  const paths: string[] = [];
  if (!options.dryRun) {
    for (const r of results) {
      const note: ObsidianNote = {
        namespace,
        filePath: "",
        title: r.id,
        body: r.content,
        frontmatter: {
          namespace,
          created: new Date().toISOString(),
          updated: new Date().toISOString(),
          embeddingHash: r.metadata?.embeddingHash as string | undefined,
          provenance: `sylvia-hybrid:v1:${r.source}`,
        },
        backlinks: [],
      };
      const path = await writeVaultNote(note, r.id);
      paths.push(path);
    }
  }

  await safeEmit(
    {
      obsidian: "v1",
      direction: "hybrid-to-vault" as SyncDirection,
      namespace,
      hitCount: results.length,
      latencyMs: Date.now() - t0,
    },
    options.sessionId,
  );

  return { written: paths.length, paths };
}

/**
 * Vault → Hybrid · reads a vault note and inserts into vector store.
 * Embed fail-soft handled by Phase 3 embedder (LiteLLM Gateway).
 */
export async function syncVaultToHybrid(
  filePath: string,
  options: SyncOptions = {},
): Promise<{ inserted: boolean; embeddingHash?: string }> {
  if (!isObsidianEnabled()) {
    return { inserted: false };
  }

  const t0 = Date.now();
  const note = await readVaultNote(filePath);
  const embeddingHash = hashBody(note.body);

  if (!options.dryRun) {
    await vectorInsert(
      note.namespace,
      note.body,
      {
        title: note.title,
        provenance: note.frontmatter.provenance,
        embeddingHash,
        backlinks: note.backlinks,
      },
      options.sessionId,
    );
  }

  await safeEmit(
    {
      obsidian: "v1",
      direction: "vault-to-hybrid" as SyncDirection,
      namespace: note.namespace,
      filePath,
      hitCount: 1,
      latencyMs: Date.now() - t0,
    },
    options.sessionId,
  );

  return { inserted: !options.dryRun, embeddingHash };
}

/** Test-only · resets internal cache (none currently · placeholder). */
export function _resetForTest(): void {
  // No internal cache yet · Phase 5.1 watcher state would reset here
}
