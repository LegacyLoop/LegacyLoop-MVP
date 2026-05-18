// lib/sylvia/obsidian/vault-watcher.ts
//
// CMD-SYLVIA-OBSIDIAN-BIDIRECTIONAL-SYNC V20 v2.1 R29 P-WAVE-20-PHASE-5 · 2026-05-18
//
// CEO §5.X Gate 1 picked Option D: manual triggerSync (no chokidar · no watcher).
// Rationale: BINDING #18 Vercel CI canonical · zero npm install · zero native dep.
// Phase 5.1 follow-up cyl banked for chokidar-based Option B watcher upgrade
// once CI bandwidth available (SYLVIA_OBSIDIAN_DEBOUNCE_MS env reserved).

import { listVaultNotes } from "./vault-writer";
import type { VaultNamespace } from "./types";

let lastTriggerAt: number = 0;
let triggerCount: number = 0;

/**
 * Manual trigger · scans vault for all notes in a namespace and returns
 * file paths for consumer to feed into syncVaultToHybrid.
 *
 * Caller pattern (Phase 5.0 Option D):
 *   const paths = await triggerSync("episode:abc");
 *   for (const p of paths) await syncVaultToHybrid(p);
 *
 * Phase 5.1 banked: replace with chokidar-debounced watcher · same signature.
 */
export async function triggerSync(
  namespace: VaultNamespace,
): Promise<string[]> {
  lastTriggerAt = Date.now();
  triggerCount += 1;
  return listVaultNotes(namespace);
}

export function getWatcherStats(): {
  mode: "manual-trigger" | "chokidar-debounced";
  lastTriggerAt: number;
  triggerCount: number;
  debounceMs: number;
} {
  const debounceMs = Number(process.env.SYLVIA_OBSIDIAN_DEBOUNCE_MS ?? "0");
  return {
    mode: "manual-trigger", // Phase 5.0 Option D · Phase 5.1 swaps to chokidar-debounced
    lastTriggerAt,
    triggerCount,
    debounceMs,
  };
}

/** Test-only · reset for smoke harness. */
export function _resetWatcherStats(): void {
  lastTriggerAt = 0;
  triggerCount = 0;
}
