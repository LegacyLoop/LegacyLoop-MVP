# SYLVIA SWARM V1 · 15-AGENT HIERARCHICAL-MESH ORCHESTRATION

> **Cyl:** CMD-RUFLO-CONCEPT-EXTRACT V20 R29 · Wave 20 Phase 2 of 8 · M14 moat
> **Class:** ARCHITECTURE · greenfield `lib/sylvia/swarm/*` substrate
> **Authored:** 2026-05-18 EDT · post-Phase-1-audit close (`0de373d`)
> **Substrate:** 5 files · types · topology · coordinator · memory-bridge · index
> **Feature-flag:** `SYLVIA_SWARM_ENABLED` default OFF · Phase 7 activation
> **Doctrine:** BINDING #16 ABSOLUTE (zero `@claude-flow/*` import) · BINDING #10 single egress · BINDING #31 sentinel pattern

---

## §1 · ARCHITECTURE

Custom-port of Ruflo hierarchical-mesh 15-agent concept into greenfield `lib/sylvia/swarm/*`. **Zero `@claude-flow/*` customer import. Zero `npm install ruflo`.** Concept ported · code custom-written. `~/ruflo-workspace/` is inspirational source (BINDING #16 clone-not-modify) · Track A boundary preserved.

**Topology:** 1 Queen + 14 specialist workers · mesh-connect for peer-to-peer SendMessage coordination · hierarchical for delegation flow.

**Phase scope:** Substrate-only v1. No execution engine · no consumer wire · no feature-flag activation. Phase 7 (15-agent topology activation) flips the flag after 5-task smoke gate.

**M14 moat anchor:** Custom Swarm Orchestration. 12-moat → 14 with this fire (P76 M13 + this M14) · Wave 20 close = 17 moats (M14+M15+M16+M17). Phase D MPMA extends to 23 moats.

---

## §2 · ROLE TAXONOMY (18 enum · 15 active · 3 MPMA reserved)

### CANONICAL_SWARM_ROSTER (15 active · Queen + 14 specialists)

| Role | Domain | Preferred Tier | Function |
|---|---|---|---|
| `queen` | general | T3 | top-level coordinator · 1 per swarm |
| `architect` | code | T3 | design + spec authoring |
| `researcher` | search | T2 | search + intel gathering |
| `coder` | code | T2 | implementation |
| `reviewer` | code | T3 | code review + quality gate |
| `tester` | code | T2 | verification + smoke |
| `perf-engineer` | code | T2 | performance optimization |
| `security-architect` | code | T3 | security review |
| `auditor` | reasoning | T3 | compliance + audit trail |
| `data-analyst` | reasoning | T2 | data + telemetry analysis |
| `ui-designer` | creative | T2 | UI/UX surface |
| `scribe` | general | T1 | documentation |
| `ops-engineer` | code | T2 | daemons + infra |
| `negotiator` | marketplace | T2 | MPMA Layer 4 Unified Inbox routing |
| `external-marketplace-agent` | marketplace | T2 | MPMA Layer 6 Inbound API |

### MPMA_RESERVED_ROSTER (3 bench-banked · Phase D activation)

Per §AMENDMENT-1 (MC Mon AM 2026-05-18): enum has 18 roles but `CANONICAL_SWARM_ROSTER` stays at 15 (Ruflo topology max). MPMA-reserved roles activate via `task.requestedRoles` override at `pickWorkersForTask()` time · Phase D MPMA cyls activate without enum migration.

| Role | Domain | Preferred Tier | Phase D Layer |
|---|---|---|---|
| `platform-adapter` | marketplace | T2 | Layer 3 publishing adapter |
| `listing-optimizer` | marketplace | T2 | Layer 3 per-platform format optimization |
| `pricing-analyst` | marketplace | T2 | Cross-platform pricing intelligence (CCL × MPMA) |

### Domain → role hints (rule-based v1)

| Domain | Default workers |
|---|---|
| `code` | architect · coder · reviewer · tester |
| `search` | researcher · data-analyst |
| `reasoning` | auditor · data-analyst · architect |
| `vision` | ui-designer · scribe |
| `creative` | ui-designer · scribe |
| `intel` | researcher · data-analyst |
| `marketplace` | negotiator · external-marketplace-agent |
| `general` | scribe · ops-engineer |

---

## §3 · FEATURE-FLAG ROLLOUT

### Default OFF (Phase 2 ship)

`SYLVIA_SWARM_ENABLED` unset OR ≠ `"1"` → coordinator bypass · zero behavior delta. Production unchanged.

### Phase 7 activation (banked)

`SYLVIA_SWARM_ENABLED=1` → coordinator emits telemetry · classifySwarm returns full SwarmDecision · 15-agent topology active. Gated on 5-task smoke at §5.X Gate 2.

### Activation cascade (CEO routes)

1. Phase 2 ✅ substrate ships (this cyl)
2. Phase 3 RuVector HNSW substrate · `hnswEnabled=true` flips in policy
3. Phase 4 Hybrid memory · `SwarmMemoryBridge` HNSW-backed
4. Phase 7 Activation cyl · feature-flag flip + consumer wire in chat handler
5. Phase 8 Truth Gate cross-validate · Queen Consensus + 4-AI Truth Gate coexist

---

## §4 · MEMORY BRIDGE (Phase 4 implements)

`SwarmMemoryBridge` interface contract v1 + stub. Phase 4 (Hybrid memory integration) wires:

- **§7 Episodic** (Turso `sylvia_episodic`) — query agent history by scope (agent/swarm/project/global)
- **§8 Semantic** (`skill-index.json` → Turso table) — query domain skill packs
- **Phase 3 HNSW** (`lib/sylvia/vector/*`) — sub-millisecond similarity search · 150× faster than brute-force

Scope semantics:
- `agent` — single agent's history
- `swarm` — current swarm session
- `project` — across sessions, single project
- `global` — cross-project (Phase D MPMA cross-platform)

---

## §5 · TELEMETRY PATTERN (BINDING #31 push-back replacement)

**Why sentinel pattern:** `EpisodicEventType` union does NOT include `"swarm"`. Adding it requires Prisma migration + Turso push (BINDING #6 OP-B stmt) + BINDING #16 violation on `memory-types.ts`. Replacement pattern matches CYL #1 P76 router precedent (`payload.router="v1"`).

**Emission shape:**

```typescript
{
  eventType: "triage",               // existing union value · NO schema touch
  payload: {
    swarm: "v1",                     // sentinel
    topology: "hierarchical-mesh",
    queen: "queen",
    workers: ["architect", "coder", ...],
    domain: "code",
    classifier: "domain-hint",
    taskId: "<task-id>",
  },
  source: "direct",
}
```

**Query pattern:** Existing `recallByCause("triage", sinceDays)` returns all triage entries · filter `payload.swarm === "v1"` for swarm-specific.

**Future union extension** banked as separate cyl post-Phase-7 IF behavioral telemetry analysis needs distinct surface (likely unneeded · payload sentinel sufficient).

---

## §6 · PHASE D MPMA ANTICIPATION

Per CEO Mon AM 2026-05-18 directive: 6-layer Multi-Platform Marketplace Aggregation architecture banked Phase D (14 cyls · post-Wave-20 brain implant).

**Phase 2 substrate design baked in:**

| MPMA Layer | Phase 2 anticipation |
|---|---|
| Layer 1 SALE CONTAINER | OUT OF SCOPE · existing in-app |
| Layer 2 UNIVERSAL ITEM SCHEMA | NEW doctrine candidate `DOC-UNIVERSAL-ITEM-SCHEMA-DESIGN-INPUT` 1/5 · Phase 4 hybrid memory design input |
| Layer 3 PUBLISHING ADAPTERS | `platform-adapter` + `listing-optimizer` roles reserved · activates via `task.requestedRoles` |
| Layer 4 UNIFIED INBOX | `negotiator` role active in CANONICAL_SWARM_ROSTER · cross-platform messaging routing |
| Layer 5 MASTER MARKETPLACE PAGE | OUT OF SCOPE Phase 2 · customer-facing aggregation banked |
| Layer 6 INBOUND API | `external-marketplace-agent` role active · third-party plugged INTO Legacy-Loop |
| Cross-platform pricing | `pricing-analyst` reserved · CCL × MPMA integration banked |

**Banked Phase D cyls:** CMD-UNIVERSAL-ITEM-SCHEMA-V1 V20 · CMD-MPMA-{EBAY,FB,ETSY,MERCARI,POSHMARK,OFFERUP,WHATNOT,DEPOP,CRAIGSLIST}-ADAPTER V20 · CMD-MPMA-UNIFIED-INBOX V20 (Layer 4) · CMD-MPMA-MASTER-MARKETPLACE-PAGE V20 (Layer 5) · CMD-MPMA-INBOUND-API V20 (Layer 6 · M23 moat).

---

END · SYLVIA SWARM V1 · Wave 20 Phase 2 · M14 moat substrate
