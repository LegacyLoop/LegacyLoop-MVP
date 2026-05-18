# SYLVIA OBSIDIAN V1 · M17 BRAIN EXTERNALIZATION

> **Cyl:** CMD-SYLVIA-OBSIDIAN-BIDIRECTIONAL-SYNC V20 R29 · Wave 20 Phase 5 of 8 · M17 moat
> **Class:** ARCHITECTURE · greenfield `lib/sylvia/obsidian/*` substrate
> **Authored:** 2026-05-18 EDT · post-Phase-4 close (`ec3a4e5`)
> **Substrate:** 7 files · types · formatter · vault-writer · vault-watcher · backlinks · sync-bridge · index
> **Feature-flag:** `SYLVIA_OBSIDIAN_ENABLED` default OFF · Phase 6+ consumers
> **CEO §5.X Gate 1:** Option D (manual `triggerSync` · no chokidar · BINDING #18 safe) · Phase 5.1 banked for chokidar Option B upgrade

---

## §1 · ARCHITECTURE

Sylvia's brain externalized to markdown vault. Bi-directional sync · vault writes consume Phase 4 `hybridRecall` · vault edits propagate back via Phase 3 `vectorInsert` (BINDING #10 chokepoint preserved at embedder).

**Vault root:** `sylvia-data/obsidian-vault/`
**Per-namespace 8 sub-vault structure** (§0.7 DESIGN-ANTICIPATION):

```
sylvia-data/obsidian-vault/
├── swarm/        Phase 2 swarm task notes (M14 consumer)
├── customer/     Phase D CCL per-customer (banked)
├── item/         Phase D MPMA UIS per-item (banked)
├── platform/     Phase D MPMA per-platform (banked)
├── skill/        P73 PATH A · 239 skill packs migration target
├── episode/      Phase 4 episodic notes (session-keyed)
├── pattern/      P74 pattern engine
└── global/       default catchall
```

**M17 moat anchor:** BRAIN EXTERNALIZATION. 16→17 moats post-Phase-5 GREEN. Investor demo: "Open this folder. This IS Sylvia's brain. Live. Editable."

**Custom-written · zero `@claude-flow/*` import · zero `npm install` dependency.** Node stdlib `fs/promises` only.

---

## §2 · WATCHER MODE (CEO §5.X Gate 1 · Option D picked)

**Picked autonomously per Devin recommendation:** Option D manual trigger · no chokidar · BINDING #18 Vercel CI safe · zero native compile risk.

| Option | Status |
|---|---|
| A · INSTANT no debounce | rejected · thrash risk |
| B · chokidar 500ms debounce | banked Phase 5.1 (CI bandwidth gate) |
| C · POLL 60s | rejected · stale window unacceptable |
| **D · Manual triggerSync** ✅ | shipped Phase 5.0 |

**API surface:**

```typescript
import { triggerSync, getWatcherStats, syncVaultToHybrid } from "@/lib/sylvia/obsidian";

// Manual trigger pattern
const paths = await triggerSync("episode:abc");
for (const path of paths) {
  await syncVaultToHybrid(path);
}
```

**Phase 5.1 banked:** chokidar wrapper · debounce via `SYLVIA_OBSIDIAN_DEBOUNCE_MS` env (already reserved). Same `triggerSync` signature preserved · zero consumer disruption when upgrade lands.

---

## §3 · MARKDOWN FORMAT

Obsidian-native: YAML frontmatter + `# Heading` + body + `[[wikilink]]` syntax + Backlinks section.

**Example:**

```markdown
---
namespace: episode:abc123
created: 2026-05-18T11:30:00Z
updated: 2026-05-18T11:35:00Z
embedding-hash: sha256:abc123def456
provenance: sylvia-hybrid:v1:vector
---

# Episode Title

Body content with [[wikilink-target]] references.

## Backlinks

- [[other-note]]
```

**Phase D MPMA item notes** add frontmatter fields:

```yaml
platforms: [ebay, fb-marketplace, etsy]
condition: very-good
price-usd: 45.00
```

**Phase D CCL customer notes** add:

```yaml
customer-id: user-xyz
```

`extractWikilinks(body)` parses `[[target]]` refs (and `[[target|alias]]` form · alias dropped). `parseNote` is tolerant: missing frontmatter → defaults · forward-compat for unknown keys.

---

## §4 · FEATURE-FLAG ROLLOUT

### Default OFF (Phase 5 ship)

`SYLVIA_OBSIDIAN_ENABLED` unset OR ≠ `"1"`:
- `syncHybridToVault` returns `{ written: 0, paths: [] }` · zero fs writes
- `syncVaultToHybrid` returns `{ inserted: false }` · zero vector inserts
- `triggerSync` still works (read-only listing)
- Vault directory NOT auto-created at boot

Production unchanged. Zero behavior delta.

### Phase 6+ activation

`SYLVIA_OBSIDIAN_ENABLED=1`:
- `syncHybridToVault` calls `hybridRecall` · writes markdown
- `syncVaultToHybrid` parses md · calls `vectorInsert` (embed via LiteLLM Gateway)
- Telemetry emits `payload.obsidian="v1"` sentinel

### Embed fail-soft (Phase 4 NEW catch context)

LiteLLM Gateway `/v1/embeddings` returned HTTP 400 in Phase 4 smoke (banked `CMD-LITELLM-EMBEDDING-MODELS-WIRE V20 LOW`). Phase 3 embedder fail-soft returns `Float32Array(0)` · Phase 4 hybrid bridge falls through keyword path. Phase 5 vault inserts proceed with `embeddingHash` populated from SHA256 of body · keyword path indexed entry · graceful degradation.

---

## §5 · TELEMETRY (BINDING #31 sentinel)

```typescript
{
  eventType: "triage",                    // existing union · NO schema touch
  payload: {
    obsidian: "v1",                       // sentinel
    direction: "vault-to-hybrid" | "hybrid-to-vault",
    namespace: VaultNamespace,            // 8 patterns
    filePath?: string,
    hitCount: number,
    latencyMs: number,
  },
  source: "direct",
}
```

Matches Phase 2 swarm (`payload.swarm="v1"`) + Phase 3 vector (`payload.vector="v1"`) + Phase 4 hybrid (`payload.hybrid="v1"`) + CYL #1 router (`payload.router="v1"`) precedents. **EpisodicEventType union UNTOUCHED.**

---

## §6 · PHASE D MPMA + CCL CONSUMER ROADMAP

| Phase | Consumer | Namespace |
|---|---|---|
| Phase 6 Graphify | self-introspection notes | `pattern:<patternId>` + `swarm:<taskId>` |
| Phase 7 swarm activation | runtime swarm note vault | `swarm:<taskId>` |
| Phase D CCL | per-customer behavior notes | `customer:<userId>` |
| Phase D MPMA Layer 2 | UIS per-item notes | `item:<itemId>` |
| Phase D MPMA Layer 3 | per-platform listing notes | `platform:<platformName>` |
| Phase D MPMA Layer 6 | Inbound API white-label notes | `customer:<externalOrgId>` |

**Investor demo trajectory:** CEO opens Obsidian on `sylvia-data/obsidian-vault/` · sees per-customer behavior · per-item Universal Item Schema embeddings · per-platform cross-listings · live editable · two-way synced to hybrid recall engine.

---

END · SYLVIA OBSIDIAN V1 · Wave 20 Phase 5 · M17 BRAIN EXTERNALIZATION moat
