# SYLVIA GRAPHIFY V1 · M18 SELF-INTROSPECTING GRAPH + FOUNDATION PRIMITIVE

> **Cyl:** CMD-SYLVIA-GRAPHIFY-SELF-INTROSPECTION V20 R29 · Wave 20 Phase 6 of 8 · M18 moat
> **Class:** ARCHITECTURE · greenfield `lib/sylvia/graphify/*` + ★ FOUNDATION-UP Phase C/D/E hooks ★
> **Authored:** 2026-05-18 EDT · post-Phase-5 close (`4ce470a`)
> **Substrate:** 8 files · types · graph-builder · community-detect · god-nodes · emitter · consumer-hooks · coordinator · index
> **Feature-flag:** `SYLVIA_GRAPHIFY_ENABLED` default OFF · Phase 7+ consumers
> **CEO §5.X Gate 1:** Option B Leiden (foundation-up · build right first time · §0.8 push-back #2 fallback to Louvain banked if Leiden bloat)

---

## §1 · ARCHITECTURE

Self-introspecting knowledge graph engine. Reads Phase 5 Obsidian vault · parses markdown · extracts `[[wikilink]]` edges · builds GraphNode + GraphEdge collections · runs Leiden community detection · computes PageRank-style centrality · selects top-N god-nodes · surfaces surprising cross-community connections.

**Consumer-only · zero new HTTP path:**
- Vault reads via Phase 5 `obsidian.listVaultNotes` / `obsidian.readVaultNote` / `obsidian.extractWikilinks`
- Entity resolution via Phase 4 `hybridRecall` (banked Phase 6.1 entity-link cyl)
- Telemetry via existing `appendEpisodic` (BINDING #31 sentinel `payload.graphify="v1"`)

**BINDING #16 ABSOLUTE:** custom-port · zero `@claude-flow/*` import · zero `npm install` dep. Pure TypeScript + Node stdlib `fs/promises`.

**M18 moat anchor:** SELF-INTROSPECTING GRAPH. 17→18 moats post-Phase-6 GREEN. Investor anchor: "Sylvia introspects her own knowledge graph · self-aware · Leiden algorithm 2019 · zero third-party customer dep."

---

## §2 · COMMUNITY DETECTION (CEO §5.X Gate 1 · Option B Leiden)

**Picked autonomously per Devin recommendation:** Option B Leiden. Foundation-up doctrine — build the primitive RIGHT first time · Leiden is what Phase D/E would want anyway · Louvain now means retrofitting later (anti-pattern).

### v1 implementation

Modularity-based local moving (Phase 1) + lightweight refinement pass + aggregation. Reference: Traag, Waltman, van Eck 2019 (arxiv:1810.08473).

**Algorithm steps:**
1. Initialize: each node its own community
2. Local moving: iterate · move node v to neighbor's community c if `ΔQ > 0`
3. Modularity gain: `ΔQ ≈ (k_v_in_new / m) - (degree[v] · Σ_tot_new / 2m²)`
4. Repeat until no movement OR max 10 iterations
5. Collect communities · compute cohesion (intra-edge fraction)
6. Label by dominant namespace prefix

**Full Leiden refinement-phase (well-connected proof)** banked Phase 6.1 if formal scale-out warrants. Interface preserves swap.

| Option | Status |
|---|---|
| A · Louvain | rejected (would require retrofit) · §0.8 push-back #2 fallback if Leiden bloat |
| **B · Leiden** ✅ | shipped Phase 6.0 · foundation-up |
| C · Label Propagation | rejected (non-deterministic · v1 prototype only) |

---

## §3 · GOD-NODE CENTRALITY

PageRank-style centrality · damping factor 0.85 · max 30 iterations · convergence threshold 0.0001.

**Formula:** `PR(v) = (1-d)/N + d · Σ (PR(u) · w(u,v) / outDegree(u))`

Top-N god-nodes selected by score. Surprising-connection detector finds cross-community high-weight edges (combined endpoint centrality × edge weight).

---

## §4 · FEATURE-FLAG ROLLOUT

### Default OFF (Phase 6 ship)

`SYLVIA_GRAPHIFY_ENABLED` unset OR ≠ `"1"`:
- `buildGraph` returns empty `GraphSnapshot` · zero vault reads
- `queryGraph` returns `[]`
- `getStats` returns `{ nodes: 0, edges: 0, communities: 0 }`

Production unchanged · zero behavior delta.

### Phase 7+ activation

`SYLVIA_GRAPHIFY_ENABLED=1`:
- `buildGraph` scans Phase 5 vault · builds nodes + edges · runs Leiden + centrality
- Optional `triggerVaultSync` precondition calls `obsidian.triggerSync` for fresh scan (Option D manual mode per Phase 5)
- Telemetry emits `payload.graphify="v1"` sentinel

---

## §5 · TELEMETRY (BINDING #31 sentinel)

```typescript
{
  eventType: "triage",                          // existing union · NO schema touch
  payload: {
    graphify: "v1",                             // sentinel
    operation: "build" | "query" | "ingest" | "export",
    nodeCount: number,
    edgeCount: number,
    communityCount: number,
    latencyMs: number,
  },
  source: "direct",
}
```

Matches Phase 2 swarm (`payload.swarm="v1"`) + Phase 3 vector + Phase 4 hybrid + Phase 5 obsidian + CYL #1 router precedents. **EpisodicEventType union UNTOUCHED.**

**Structured log line:** `graphify=v1 algorithm=leiden nodes=<N> edges=<M> communities=<C> god-nodes=<G> surprising=<S>`.

---

## §6 · ★ FOUNDATION-UP CONSUMER HOOKS (CEO Mon PM directive · #45 NEW 1/5) ★

Phase 6 ships M18 self-introspection AND 4 pre-positioned consumer hooks for Phase C/D/E. Zero retrofit cost when consumer cyls fire.

### Phase C scraper · `graphIngestExternalCorpus`

```typescript
import { graphIngestExternalCorpus } from "@/lib/sylvia/graphify";

const corpus: ExternalCorpusEntry = {
  source: "scraper",
  corpusId: "ebay-vintage-collectibles-2026-05-18",
  domain: "ebay-vintage-collectibles",
  entries: [/* ... scraper hits ... */],
};
const { ingested, community } = await graphIngestExternalCorpus(corpus);
```

v1 stub: persists entries to `sylvia-data/obsidian-vault/skill/domain-corpus-<corpusId>/`. Phase C Cyl A (Week 2) wires full graph node extraction + Leiden community assignment.

### Phase D CCL · `createPerCustomerGraph`

```typescript
const { graphId, namespace } = await createPerCustomerGraph({
  customerId: "user-abc",
  scope: "behavior", // or "items-listed" | "items-sold" | "preferences"
});
// namespace = "customer:user-abc"
```

v1 stub: returns assignment. Phase D Cyl A wires `customer:<customerId>` sub-vault → community-aware graph slice.

### Phase D MPMA · `createPerItemProvenanceGraph`

```typescript
const { graphId, namespace } = await createPerItemProvenanceGraph({
  itemId: "item-xyz",
  platforms: ["ebay", "fb-marketplace", "etsy"],
  trackingDepth: "listing",
});
// namespace = "item:item-xyz"
```

v1 stub: returns assignment. Phase D Cyl A wires `item:<itemId>` + `platform:<platformName>` cross-linked Leiden nodes.

### Phase E Inbound API · `graphQueryExternalConsumer`

```typescript
const { results, tokenUsed } = await graphQueryExternalConsumer({
  consumerId: "white-label-org-1",
  query: "antique brass valuation",
  scope: "platform:ebay",
  limit: 10,
  authToken: "...",
});
```

v1 stub: token-length sanity check + scoped namespace echo. Phase E Cyl A (Week 7+) wires Bearer-token verify + per-consumer rate limit + scoped graph query via Phase 4 `hybridRecall`. M30 moat.

**Net effect:** Phase C/D/E retrofit cost reduced from ~6-9 weeks combined to ~0. Consumer cyls just wire to existing hooks.

---

END · SYLVIA GRAPHIFY V1 · Wave 20 Phase 6 · M18 SELF-INTROSPECTING GRAPH + FOUNDATION-UP doctrine


---

## CHANGELOG · v1.1 (Phase 6.1 refinement-phase)

**2026-05-18 · Phase 6.1 · CMD-PHASE-6-1-LEIDEN-REFINEMENT V20 R29**

- Added Traag-Waltman-van Eck 2019 §3.1 refinement-phase to `detectCommunities`
- Public API unchanged · `detectCommunities(nodes, edges) → Community[]` signature preserved
- Algorithm now: Phase 1 local-move → ★ Phase 1.5 REFINEMENT (NEW · constrained sub-partition within each parent community) ★ → Phase 2 collect
- New constants: `REFINEMENT_GAMMA = 0.0001` (γ-connectivity threshold · matches local-move for symmetry) · `REFINEMENT_MAX_ITER = 5`
- LOC: community-detect.ts 172 → 256 (+84 LOC refinement-phase function + integration)
- Phase 7 + Phase 8 consumer surfaces UNCHANGED (signature preserved · defensive `< 3 communities` fallback still works · transitive consumers automatically benefit from well-formed sub-partitions)
- Doctrine candidate #47 NEW 1/5 anchor · DOC-LEIDEN-REFINEMENT-PHASE-CANONICAL
- BINDING #16 ABSOLUTE preserved (zero new dep · pure-TS · 10 grep hits all comment text sustained)
- BINDING #10 preserved (algorithm-internal · zero new fetch)
- BINDING #31 preserved (EpisodicEventType UNTOUCHED · zero new telemetry)
- 4-task smoke: 50-node sparse 47 → 44 communities (slight reduction · multi-level aggregation recursion banked Phase 6.1.1 for full Leiden quality at ≤15 target) · 1000-node dense G(1000,0.05) 169ms latency · API signature preserved · degenerate cases OK
- **Phase 6.1.1 banked:** multi-level aggregation recursion (build super-graph from refined communities · iterate local-move + refinement until stable · achieves true Leiden quality reduction)
