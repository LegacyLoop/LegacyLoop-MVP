# SYLVIA HYBRID MEMORY V1 · M16 RECALL DECISION ENGINE

> **Cyl:** CMD-SYLVIA-HYBRID-MEMORY-INTEGRATION V20 R29 · Wave 20 Phase 4 of 8 · M16 moat
> **★ BINDING #38 RATIFY FIRE ★** · DOC-EMPIRICAL-CITE-MANDATORY 4/5 → 5/5 · 34 → 35 BINDING canonical
> **Class:** ARCHITECTURE · greenfield `lib/sylvia/hybrid/*` substrate
> **Authored:** 2026-05-18 EDT · post-Phase-3 close (`64b910f`)
> **Substrate:** 4 files · types · bridge · merge · index barrel
> **Feature-flag:** `SYLVIA_HYBRID_MEMORY_ENABLED` default OFF · Phase 5+ consumers
> **CEO §5.X Gate 1:** Option A vector-first w/ keyword fallback (Manus pattern · default mode)

---

## §1 · ARCHITECTURE

Hybrid recall decision engine. Routes every query through Phase 3 HNSW vector substrate (`64b910f`) primary OR existing `semantic.recallByEntity` keyword fallback. Decision per CEO §5.X Gate 1 routing policy:

- **Option A · vector-first** (Devin RECOMMENDED · Manus pattern · default mode) — vector run first · keyword fallback if vector top-score below threshold
- **Option B · keyword-first** — backward-compat · keyword first · vector fallback if no hits
- **Option C · always-hybrid** — RRF rank fusion combines both (Cormack et al. 2009 · k=60)

**BINDING #10 single egress preserved:** zero new HTTP path. Bridge is consumer-only. Phase 3 `vectorQuery` owns LiteLLM Gateway chokepoint. `semantic.recallByEntity` is file-system-v1 (P73 PATH A · 239 skill packs).

**BINDING #16 ABSOLUTE:** custom-port hybrid concept · zero `@claude-flow/*` import.

**§0.7 DESIGN-ANTICIPATION (BINDING #42 cand 2/5→3/5):** `HybridScope = VectorNamespace` passthrough · honors all 8 Phase 3 namespace patterns (swarm:* customer:* item:* platform:* skill:* episode:* pattern:* global) without retrofit.

**M16 moat anchor:** HYBRID MEMORY BRIDGE. 15→16 moats post-Phase-4 GREEN. Manus-class brain decision moment: recall becomes intelligence.

---

## §2 · RECALL DECISION FLOW (Option A vector-first default)

```
hybridRecall(req)
  │
  ├── isHybridEnabled() === false → legacyKeywordOnly()  (semantic.recallByEntity)
  │                                  ↓
  │                                  source="legacy"
  │
  └── mode = req.mode ?? "vector-first"
      │
      ├── "vector-first":
      │     vectorQuery(scope, query, k) → vHits
      │     if vHits.length > 0 && top.score >= 0.7:
      │       results = vHits.map(source="vector")
      │     else:
      │       kHits = recallByEntity({entity: query, fuzzy: true})
      │       results = kHits.map(source="keyword-fallback")
      │
      ├── "keyword-first":
      │     kHits = recallByEntity({entity: query})
      │     if kHits.length > 0:
      │       results = kHits.map(source="keyword")
      │     else:
      │       vHits = vectorQuery(scope, query, k)
      │       results = vHits.map(source="vector-fallback")
      │
      └── "always-hybrid":
            Promise.all([vectorQuery, recallByEntity])
            rrfMerge(vHits, kHits, limit)  (Reciprocal Rank Fusion · k=60)
            results.map(source="hybrid-merged")

  → emitTelemetry({mode, pathUsed, hits, latencyMs, scope})
    (BINDING #31 sentinel · payload.hybrid="v1")
```

**Vector score threshold:** 0.7 default · vector-first fallback triggers below.

---

## §3 · KEYWORD CONSUMER (BINDING #31 push-back replacement)

**§0.8 PUSH-BACK invoked at IT empirical surface:** Devin spec FIX 4 referenced `semantic.recallSimilar(query, bucket, limit)` but `semantic.ts` actual exports are:
- `recallByEntity({entity, type?, limit?, fuzzy?}) → SemanticEntry[]`
- `relatedSkills(skillId, depth) → SemanticEntry[]`
- `crossDomainQuery(domain, opts) → SemanticEntry[]`
- `indexSkillPack(path) → SemanticEntry`
- `rebuildIndex(opts) → {scanned, indexed, errors}`

**Replacement adopted:** keyword path uses `semantic.recallByEntity({entity: query, limit, fuzzy: true})` · returns `SemanticEntry[]` · adapter normalizes to `HybridResult` shape with rank-based score (1.0 → 0.0 over result order).

`memory.recallSimilar` exists separately but operates on `SylviaMemory` rows (triage history) · not a semantic keyword recall · out of scope for Phase 4 hybrid bridge.

---

## §4 · FEATURE-FLAG ROLLOUT

### Default OFF (Phase 4 ship)

`SYLVIA_HYBRID_MEMORY_ENABLED` unset OR ≠ `"1"` → `hybridRecall()` routes to `legacyKeywordOnly()` (semantic.recallByEntity only) · `source="legacy"`. Zero vector ops · zero new behavior surface. Production unchanged.

### Phase 5+ activation

`SYLVIA_HYBRID_MEMORY_ENABLED=1` → routing policy active · vector-first by default · telemetry emits with `payload.hybrid="v1"`.

### Consumer cascade

- **Phase 4 (this fire)** swaps `STUB_MEMORY_BRIDGE.query` (Phase 2 swarm/memory-bridge.ts) body → `hybridRecall` call. SwarmMemoryBridge interface signature preserved (BINDING #16 additive).
- **Phase 5 Obsidian sync** consumes `hybridRecall` via `episode:<sessionId>` namespace
- **Phase 7 swarm activation** consumes `hybridRecall` via `swarm:<taskId>` namespace
- **Phase D MPMA** consumes via `item:<itemId>` + `platform:<platformName>` namespaces
- **Phase D CCL** consumes via `customer:<userId>` namespace

---

## §5 · TELEMETRY PATTERN (BINDING #31 sentinel)

**Shape:**

```typescript
{
  eventType: "triage",                  // existing union value · NO schema touch
  payload: {
    hybrid: "v1",                       // sentinel
    mode: "vector-first" | "keyword-first" | "always-hybrid",
    pathUsed: "vector" | "keyword" | "vector-fallback" | "keyword-fallback" | "hybrid-merged" | "legacy",
    hits: number,
    latencyMs: number,
    scope: VectorNamespace,             // 8 patterns honored
  },
  source: "direct",
}
```

**Query pattern:** `recallByCause("triage", sinceDays)` · filter `payload.hybrid === "v1"`.

**A/B telemetry:** combined with CYL #1 router (`payload.router="v1"`) and Phase 2 swarm (`payload.swarm="v1"`) and Phase 3 vector (`payload.vector="v1"`) for cross-doctrine session analytics.

---

## §6 · PHASE D MPMA + CCL CONSUMER ROADMAP

| Phase | Consumer | Hybrid mode | Namespace |
|---|---|---|---|
| Phase 4 swap | Phase 2 SwarmMemoryBridge | vector-first | `swarm:<task>` |
| Phase 5 | Obsidian sync watcher | vector-first | `episode:<sessionId>` |
| Phase 7 | Swarm activation runtime | vector-first | `swarm:<taskId>` + `swarm:<domain>` |
| Phase D CCL | Per-customer behavior | always-hybrid | `customer:<userId>` |
| Phase D MPMA Layer 2 | UIS embedding recall | vector-first | `item:<itemId>` |
| Phase D MPMA Layer 3 | Per-platform similarity | vector-first | `platform:<platformName>` |
| Phase D MPMA Layer 6 | Inbound API white-label | always-hybrid | `customer:<externalOrgId>` + `item:<externalItemId>` |

---

END · SYLVIA HYBRID MEMORY V1 · Wave 20 Phase 4 · M16 RECALL DECISION ENGINE · ★ BINDING #38 RATIFY FIRE ★
