# Sylvia Semantic Memory · Architecture

> **Cylinder:** CMD-SYLVIA-SEMANTIC-MEMORY-BRIDGE V20 v2.1 R29 P73 · Wave 15 Slot B
> **Track:** B · brain primitive · 7-memory framework §8
> **Authored:** 2026-05-16 · IT execute · Devin L2 spec
> **Class:** BUILD-UP · 1 NEW substrate + 1 NEW doc + 1 generated index
> **Store decision (§5.X Gate 1):** PATH A · file-system-v1 SHIPPED

---

## §1 · Why

Pre-P73 Sylvia semantic memory was **absent**. Skill packs (239 .md files across 15 bot dirs) lived as procedural files only — no routable knowledge graph · no cross-domain recall · no entity-to-skill mapping.

P73 introduces **`lib/sylvia/semantic.ts`** primitive that maps skill packs into a queryable knowledge graph backed by `sylvia-data/semantic/skill-index.json` (~695KB · 239 entries).

---

## §2 · Store decision (CEO §5.X Gate 1)

**PATH A · file-system-v1 SHIPPED:**
- Zero new dependencies (uses Node `fs` + `crypto` + `path`)
- Zero AI spend (BINDING #25 $0 default)
- 695KB JSON index · in-memory cache · mtime invalidation
- Substring + fuzzy match (Phase 9.1 banked: HNSW + embeddings)
- 239 packs indexed in <1s

**PATH B · ruvector.db cross-process** BANKED follow-on:
- `~/ruflo-workspace/ruvector.db` sunk-cost (1.5 MB SQLite-class · May 8 install)
- Would add `better-sqlite3` dep
- HNSW immediate · but schema-compat audit required pre-fire
- Banked: CMD-SYLVIA-SEMANTIC-RUVECTOR-BRIDGE V20 LOW

---

## §3 · API surface

`lib/sylvia/semantic.ts` exports:

```typescript
// Substring/fuzzy entity match (skill · bot · concept · doctrine · spec)
recallByEntity({ entity, type?, limit?, fuzzy? }) → SemanticEntry[]

// BFS via related[] (max depth default 2)
relatedSkills(skillId, depth = 2) → SemanticEntry[]

// Domain-scoped query (e.g. all PriceBot skills)
crossDomainQuery(domain, { limit? }) → SemanticEntry[]

// One-file index helper
indexSkillPack(path) → SemanticEntry

// Idempotent full rebuild (atomic file write)
rebuildIndex({ dryRun? }) → { scannedCount, indexedCount, errorCount }
```

Plus `SemanticEntry` + `SemanticEntityType` re-exports from `lib/sylvia/memory-types.ts`.

---

## §4 · SemanticEntry shape

```typescript
{
  id: "skill:<domain>:<pathHash>",
  type: "skill" | "bot" | "concept" | "doctrine" | "spec",
  name: string,           // YAML frontmatter `name` OR filename
  path?: string,          // relative path from repo root
  domain?: string,        // bot dir (e.g. "buyerbot", "pricebot")
  tags: string[],         // YAML tags + ## headings extracted (first 50 lines · max 15)
  related: string[],      // sibling entry IDs in same domain (max 10)
  body?: string,          // first 2KB body preview (Phase 9.1 → embeddings)
  embedding?: number[],   // Phase 9.1 vector (absent v1)
  lastIndexed: string     // ISO8601
}
```

---

## §5 · Index structure

`sylvia-data/semantic/skill-index.json`:

```json
{
  "version": 1,
  "generatedAt": "2026-05-16T15:38:00.000Z",
  "entryCount": 239,
  "entries": [ /* SemanticEntry[] */ ]
}
```

**Index size:** ~695KB this fire · expected steady-state.
**Refresh cadence:** manual `rebuildIndex()` v1 · banked watcher (chokidar) auto-reindex on file change.
**Cache:** in-memory · mtime invalidation · zero stale-read risk.

---

## §6 · Doctrine

- **BINDING #5** · skill body preview capped 2KB · zero credential surface (skill packs are doctrine docs · no secrets)
- **BINDING #16** · `recallByEntity` clones `queryMemoryByTopic` pattern from `lib/sylvia/memory.ts:256` verbatim · zero novel abstractions
- **BINDING #17** · §0.3 substrate read: 239 packs counted · 15 bot dirs enumerated · SSA audit doc cited pre-write
- **BINDING #25** · $0 AI spend v1 · embeddings banked Phase 9.1 (CEO routes GO via separate cyl)
- **BINDING #28** · drift catch: spec said 239 · empirically confirmed
- **BINDING #34** · widened cite (commit SHA = deploy SHA · dpl Ready · curl 3-route + local smoke positive)
- **BINDING #35** · DOC-SPEC-AUTHORING-DEEP-DIVE-MANDATORY sustains post-ratification

---

## §7 · Consumer integration (banked)

- **P74 Pattern Engine** (next sequential cyl): consumes `crossDomainQuery("buyerbot")` + `relatedSkills(skillId)` for skill-pattern correlation
- **Chat handler** (`lib/sylvia/chat/handler.ts` · banked post-P74): consult `recallByEntity` on first chat turn for context priming
- **F1 doctrine extension**: skill-pack creation auto-reindexes (banked watcher)
- **NotebookLM-equivalent surface** (CEO benchmark): semantic memory + episodic timeline + future LTM = full knowledge product

---

## §8 · Phase 9.1 embedding roadmap (banked)

When CEO routes GO for embedding generation:
1. Add OpenAI text-embedding-3-small to LiteLLM Gateway model list
2. Generate vector for each `SemanticEntry.body` (~239 calls · ~$0.01 total at v1 scale)
3. Persist `embedding: number[]` field
4. Add `recallByVector(vector, k=5)` API (HNSW via ruvector.db OR pgvector if Postgres adopted)

Cost cap: per BINDING #25 $20/mo overall · embedding gen one-shot ~$0.01 · safely within budget.

---

## §9 · Cross-references

- Pattern source: `lib/sylvia/memory.ts:256` (`queryMemoryByTopic` substring pattern)
- Type source: `lib/sylvia/memory-types.ts` (`SemanticEntry` + `SemanticEntityType`)
- Cognitive architecture: `docs/SYLVIA_COGNITIVE_ARCHITECTURE.md` §8 (semantic memory)
- Skills audit anchor: `docs/SYLVIA_SKILLS_ARCHITECTURE_AUDIT.md` (Phase 3 SSA)
- Sibling Wave 15 cyls: P72 episodic memory (live) · P74 pattern engine (sequential gate post-P73)

---

*Authored R29 P73 Wave 15 Slot B · 2026-05-16 · Track B · agent-2 worktree*
