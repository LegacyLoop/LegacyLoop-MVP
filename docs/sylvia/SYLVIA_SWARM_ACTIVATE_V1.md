# SYLVIA SWARM ACTIVATE V1 · M19 AUTONOMOUS SWARM ACTIVATION + FOUNDATION

> **Cyl:** CMD-SYLVIA-15-AGENT-TOPOLOGY-ACTIVATE V20 R29 · Wave 20 Phase 7 of 8 · M19 moat
> **Class:** ARCHITECTURE · greenfield `lib/sylvia/swarm-activate/*` + ★ 3 NEW Phase D/E foundation hooks ★
> **Authored:** 2026-05-18 EDT · post-Phase-6 close (`b7158ea`)
> **Substrate:** 6 files · types · role-assignment · activator · consumer-hooks · coordinator · index
> **Feature-flag:** `SYLVIA_SWARM_ACTIVATE_ENABLED` default OFF · Phase 8 cross-validate consumes
> **CEO §5.X Gate 1:** Option A hierarchical-mesh (matches Phase 2 baseline · zero retopology cost)

---

## §1 · ARCHITECTURE

Activates Phase 2 swarm primitive (`HIERARCHICAL_MESH_POLICY` · 15-agent topology · Queen + 14 specialists). Feature-flag flip + activation API + Phase 6 graphify community-detect consumed for role assignment.

**Consumer-only · zero new HTTP path:**
- Phase 2 `swarm.classifySwarm` + `swarm.getCanonicalRoster` (BINDING #16 clone-target)
- Phase 6 `graphify.buildGraph` + community detection (defensive fallback to canonical when thin)
- Phase 4 hybrid transitively (via Phase 2 swarm coordinator STUB swap)
- Telemetry via existing `appendEpisodic` (BINDING #31 sentinel `payload.swarm_activate="v1"`)

**BINDING #16 ABSOLUTE:** custom-port · zero `@claude-flow/*` import · zero `npm install`.

**M19 moat anchor:** AUTONOMOUS SWARM ACTIVATION. 18→19 moats post-Phase-7 GREEN. Phase 8 Truth Gate cross-validate final.

---

## §2 · TOPOLOGY (CEO §5.X Gate 1 · Option A hierarchical-mesh)

Picked autonomously per Devin recommendation. Matches Phase 2 `HIERARCHICAL_MESH_POLICY` baseline · zero retopology cost · activation just flips flag + wires API.

| Option | Status |
|---|---|
| **A · hierarchical-mesh** ✅ | shipped Phase 7.0 · Ruflo canonical · 1 Queen + 14 specialists |
| B · star | rejected (single-point-of-coordination) |
| C · full-mesh | rejected (comm overhead scales worse) |

**§0.8 push-back #2 fallback:** degraded star if hierarchical-mesh surfaces edge case at §5.X Gate 2. Phase 7.1 cyl refines.

---

## §3 · ROLE ASSIGNMENT (Phase 6 graphify consumer · defensive)

`assignRolesFromCommunities(graphifyInformed)` consumes Phase 6 `graphify.buildGraph` + `detectCommunities`. When communities ≥3 · enrichment maps roles by domain affinity to community labels. When communities <3 (Leiden v1 over-fragmentation per Phase 6 §12 RISK) · defensive fallback to `getCanonicalRoster()` preserving Phase 2 baseline guarantees.

**Affinity heuristic v1:**
- `marketplace` domain → `platform` or `item` community
- `code` domain → `swarm` or `pattern` community
- `reasoning` domain → `episode` community
- `creative` domain → `skill` community
- `general` domain → `global` community

**Phase 6.1 banked:** post-Leiden refinement (well-connected proof) · more aggressive enrichment patterns.

---

## §4 · FEATURE-FLAG ROLLOUT

### Default OFF (Phase 7 ship)

`SYLVIA_SWARM_ACTIVATE_ENABLED` unset OR ≠ `"1"`:
- `activateSwarm` returns `null` · zero behavior delta
- `deactivateSwarm` no-op
- `dispatchToSwarm` falls through to Phase 2 `classifySwarm` direct (preserves Phase 2 zero-impact contract)
- 3 consumer hooks (`activatePerCustomerAgents` · `activatePerPlatformAgents` · `activatePerConsumerAgents`) return stub shapes regardless (Phase D/E inspection-ready)

Production unchanged. M10 4-AI Truth Gate UNBROKEN 7 phases.

### Phase 8+ activation

`SYLVIA_SWARM_ACTIVATE_ENABLED=1` plus `SYLVIA_GRAPHIFY_ENABLED=1` (transitive) plus `SYLVIA_SWARM_ENABLED=1` (Phase 2 primitive):
- `activateSwarm` returns full `SwarmActivation` · 15-agent roster · community-informed enrichment
- Telemetry emits `payload.swarm_activate="v1"` sentinel

---

## §5 · TELEMETRY (BINDING #31 sentinel)

```typescript
{
  eventType: "triage",                            // existing union · NO schema touch
  payload: {
    swarm_activate: "v1",                         // sentinel
    operation: "activate" | "deactivate" | "dispatch",
    topology: "hierarchical-mesh",
    agentCount: number,
    graphifyInformed: boolean,
    latencyMs: number,
  },
  source: "direct",
}
```

Matches Phase 2 swarm (`swarm="v1"`) + Phase 3 vector + Phase 4 hybrid + Phase 5 obsidian + Phase 6 graphify + CYL #1 router precedents. **EpisodicEventType union UNTOUCHED.**

**Structured log line:** `swarm_activate=v1 op=<activate|deactivate|dispatch> topology=hierarchical-mesh agents=<N> graphify=<bool> latency=<ms>`.

---

## §6 · ★ FOUNDATION-UP CONSUMER HOOKS (#45 LAW-emerging 1/5→2/5 ratchet) ★

Phase 7 ships M19 activation AND 3 NEW pre-positioned consumer hooks for Phase D/E. **Combined with Phase 6 graphify (4 hooks) = 7 total Phase C/D/E hooks pre-positioned.** ~6-9 weeks combined retrofit cost saved.

### Phase D CCL · `activatePerCustomerAgents`

```typescript
const { swarmId, roster, namespace } = await activatePerCustomerAgents({
  customerId: "user-abc",
  scope: "behavior", // or "items-listed" | "items-sold" | "preferences"
  maxAgents: 5,
});
// namespace = "customer:user-abc"
```

v1 stub: returns canonical roster slice (Queen + 4 specialists). Phase D Cyl A wires per-customer state isolation + parallel dispatch.

### Phase D MPMA · `activatePerPlatformAgents`

```typescript
const { swarmId, roster, namespace } = await activatePerPlatformAgents({
  platformName: "ebay",
  scope: "listing",
  pricingAnalyst: true,    // includes MPMA-reserved pricing-analyst role
  listingOptimizer: true,  // includes MPMA-reserved listing-optimizer role
});
// namespace = "platform:ebay"
```

v1 stub: filters canonical to marketplace-domain + optional MPMA reserved roles. Phase D Cyl B (eBay first) wires platform-specific listing optimization.

### Phase E Inbound API · `activatePerConsumerAgents`

```typescript
const { swarmId, roster, namespace, rateLimitRemaining } = await activatePerConsumerAgents({
  consumerId: "white-label-org-1",
  authToken: "...",
  rateLimitPerHour: 100,
});
```

v1 stub: token-length sanity check + rate-limit echo. Phase E Cyl A (M30 moat) wires Bearer-token verify + per-consumer quota + namespace isolation.

---

END · SYLVIA SWARM ACTIVATE V1 · Wave 20 Phase 7 · M19 AUTONOMOUS SWARM ACTIVATION + FOUNDATION-UP doctrine
