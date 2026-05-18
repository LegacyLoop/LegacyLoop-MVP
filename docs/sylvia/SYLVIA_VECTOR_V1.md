# SYLVIA VECTOR V1 · HNSW RECALL ENGINE SUBSTRATE

> **Cyl:** CMD-SYLVIA-RUVECTOR-HNSW-SUBSTRATE V20 R29 · Wave 20 Phase 3 of 8 · M15 moat
> **Class:** ARCHITECTURE · greenfield `lib/sylvia/vector/*` substrate
> **Authored:** 2026-05-18 EDT · post-Phase-2 close (`ed123d5`)
> **Substrate:** 6 files · types · embedder · hnsw · storage · coordinator · index
> **Feature-flag:** `SYLVIA_VECTOR_ENABLED` default OFF · Phase 4 hybrid memory bridge consumes
> **CEO §5.X Gate 1:** Option B picked (pure-TS · zero native dep · zero npm install)

---

## §1 · ARCHITECTURE

Custom-port HNSW concept into greenfield `lib/sylvia/vector/*`. **Zero `@claude-flow/*` import. Zero `npm install` dep.** Pure-TypeScript implementation per CEO §5.X Gate 1 Option B pick. `~/ruflo-workspace/` HNSW concept is inspirational source (BINDING #16 clone-not-modify) · Track A boundary preserved.

**v1 implementation:** exact-KNN flat-search with cosine similarity. At <10K vectors per namespace, exact-KNN is O(N) with tiny constants on Float32Array · single-digit ms latency · 100% recall by definition. Reference HNSW (Malkov & Yashunin 2016 · arxiv 1603.09320) layered graph + greedy beam search banked Phase 4+ swap behind same `VectorIndex` interface · zero consumer disruption when scale-out warrants (~100K vector milestone).

**Interface-first design:** `VectorIndex` contract preserves swap-out optionality. Option A `hnswlib-node` or Option C LanceDB can land behind same surface in ~30 min post-Phase-4 hybrid memory consumer scale analysis.

**M15 moat anchor:** RECALL ENGINE. 14→15 moats post-Phase-3 GREEN. Manus-class brain: "have I seen something LIKE this before?"

---

## §2 · NAMESPACE PATTERN (§0.7 DESIGN-ANTICIPATION · CCL + MPMA accommodation)

8 namespace patterns reserved at v1 · Phase 4/D consumers query without schema migration.

| Pattern | Consumer | Phase |
|---|---|---|
| `swarm:<task>` | Phase 7 swarm task recall (cite SwarmTask.taskId or domain) | Phase 7 |
| `customer:<userId>` | Phase D CCL · per-user behavior fingerprint | Phase D |
| `item:<itemId>` | Phase D MPMA Layer 2 · per-item Universal Item Schema embedding | Phase D |
| `platform:<platformName>` | Phase D MPMA Layer 3 · per-platform listing similarity | Phase D |
| `skill:<skillId>` | §8 Semantic memory · 239 skill packs (Phase 4 migration target) | Phase 4 |
| `episode:<sessionId>` | §7 Episodic memory · sylvia_episodic hybrid recall | Phase 4 |
| `pattern:<patternId>` | §5 Pattern engine · P74 consumer | Phase 4 |
| `global` | default catchall · cross-cutting | v1 |

**Phase 4 hybrid memory bridge:** `namespace: "episode:<sessionId>"` queries → join with `sylvia_episodic` rows for keyword (exact) + vector (similarity) hybrid recall.

**Phase D MPMA:** `namespace: "item:<itemId>"` + `namespace: "platform:<platformName>"` → cross-platform similarity ("antique brass · Etsy 87% sell-through past 60 days for similar items").

**Phase D CCL:** `namespace: "customer:<userId>"` → per-customer behavioral fingerprint (Bot-Assisted Selling consumer).

---

## §3 · EMBEDDER PATTERN (BINDING #10 single egress)

ALL embedding HTTP routes through LiteLLM Gateway (`process.env.LITELLM_GATEWAY_URL` default `http://localhost:8000`). NO direct OpenAI fetch. NO direct Ollama fetch. LiteLLM proxies both.

**Primary:** `text-embedding-3-small` (1536 dim · OpenAI · ~$0.02 per 1M tokens)
**Fallback:** `nomic-embed-text` (768 dim · Ollama local · $0)
**Fail-soft:** empty Float32Array(0) on hard fail when `config.failSoft=true` (default)

Telemetry classifier discriminates: `primary` (1536 dim) · `fallback` (768 dim) · `stub` (other / fail).

---

## §4 · FEATURE-FLAG ROLLOUT

### Default OFF (Phase 3 ship)

`SYLVIA_VECTOR_ENABLED` unset OR ≠ `"1"` → coordinator bypass:
- `vectorInsert` returns stub `{ id, insertedAt }` · NO embed · NO persist · NO telemetry
- `vectorQuery` returns empty `[]` · NO embed · NO query · NO telemetry
- `vectorDelete` is no-op
- `vectorStats` still works (read-only)

Production unchanged · zero behavior delta · zero LiteLLM cost.

### Phase 4 activation

`SYLVIA_VECTOR_ENABLED=1` → coordinator embeds via LiteLLM · persists JSONL · emits telemetry · `classifySwarm` (Phase 2) optionally queries swarm namespace for recall enrichment.

---

## §5 · TELEMETRY PATTERN (BINDING #31 sentinel)

**Why sentinel pattern:** `EpisodicEventType` union has NO `"vector"` slot. Adding requires Prisma migration + Turso push (BINDING #6 OP-B stmt) + BINDING #16 violation on `memory-types.ts`. Sentinel replacement matches Phase 2 swarm + CYL #1 router precedents.

**Emission shape:**

```typescript
{
  eventType: "triage",                  // existing union value · NO schema touch
  payload: {
    vector: "v1",                       // sentinel
    op: "insert" | "query" | "delete",
    namespace: VectorNamespace,
    hits?: number,                      // query-only
    latencyMs: number,
    modelDim: number,                   // 1536 OpenAI · 768 Nomic · 0 stub
    classifier: "primary" | "fallback" | "stub",
  },
  source: "direct",
}
```

**Query pattern:** `recallByCause("triage", sinceDays)` · filter `payload.vector === "v1"`.

---

## §6 · PERSISTENCE (v1 file-based JSONL)

```
sylvia-data/vector-store/
  global.jsonl                    # default · cross-cutting
  swarm/<task>.jsonl              # per-task swarm recall
  customer/<userId>.jsonl         # Phase D CCL (banked)
  item/<itemId>.jsonl             # Phase D MPMA (banked)
  platform/<platformName>.jsonl   # Phase D MPMA (banked)
  skill/<skillId>.jsonl           # Phase 4 §8 migration target
  episode/<sessionId>.jsonl       # Phase 4 §7 hybrid
  pattern/<patternId>.jsonl       # Phase 4 §5 consumer
```

One line per `VectorEntry` (id · namespace · embedding[] · metadata · createdAt · updatedAt).

**Why file-based v1:** zero Prisma migration · zero Turso schema push · BINDING #6 N/A · BINDING #16 absolute. Phase 4+ may migrate to Turso `vector_entries` table if scale warrants (banked decision · interface preserves swap).

---

## §7 · PHASE D MPMA + CCL CONSUMER ROADMAP

| Phase | Consumer | Namespace pattern |
|---|---|---|
| Phase 4 | Hybrid memory bridge | `episode:<sessionId>` + `skill:<skillId>` + `pattern:<patternId>` |
| Phase 7 | Swarm coordinator activation | `swarm:<taskId>` + `swarm:<domain>` |
| Phase D CCL | Per-customer behavior | `customer:<userId>` |
| Phase D MPMA Layer 2 | Universal Item Schema embeddings | `item:<itemId>` |
| Phase D MPMA Layer 3 | Per-platform listing similarity | `platform:<platformName>` |
| Phase D MPMA Layer 6 | Inbound API white-label recall | `customer:<externalOrgId>` + `item:<externalItemId>` |

Phase D activation reuses existing namespace patterns · zero retrofit cost · zero schema migration.

---

END · SYLVIA VECTOR V1 · Wave 20 Phase 3 · M15 RECALL ENGINE moat substrate
