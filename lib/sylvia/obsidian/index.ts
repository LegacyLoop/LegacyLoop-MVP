// lib/sylvia/obsidian/index.ts
//
// CMD-SYLVIA-OBSIDIAN-BIDIRECTIONAL-SYNC V20 v2.1 R29 P-WAVE-20-PHASE-5 · 2026-05-18
// ★ M17 BRAIN EXTERNALIZATION moat · possible #39+#40 RATIFY · 35 → 37 BINDING ★
//
// Public API barrel · feature-flag SYLVIA_OBSIDIAN_ENABLED default OFF.
// CEO §5.X Gate 1 picked Option D (manual triggerSync · no chokidar · BINDING #18 safe).

export { syncHybridToVault, syncVaultToHybrid, _resetForTest } from "./sync-bridge";

export { formatNote, parseNote, extractWikilinks } from "./formatter";

export {
  writeVaultNote,
  readVaultNote,
  listVaultNotes,
  ensureVaultStructure,
  namespaceToPath,
  getVaultRoot,
} from "./vault-writer";

export { triggerSync, getWatcherStats, _resetWatcherStats } from "./vault-watcher";

export { computeBacklinks, getBacklinksFor } from "./backlinks";
export type { BacklinkRecord } from "./backlinks";

export type {
  VaultNamespace,
  ObsidianNote,
  NoteFrontmatter,
  SyncDirection,
  SyncEvent,
  ObsidianEpisodicPayload,
  VaultStructure,
  SyncOptions,
} from "./types";
