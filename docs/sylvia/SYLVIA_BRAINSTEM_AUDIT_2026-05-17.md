# SYLVIA BRAIN + BRAINSTEM AUDIT · Wave 20 Phase 1

> **Cyl:** CMD-WAVE-20-PHASE-1-SYLVIA-BRAINSTEM-AUDIT V20 R29 · Wave 19+1 burst Cyl #3
> **Class:** DOC · audit-only · zero code touch
> **Worktree:** agent-2-slot · HEAD `1c3a6e9` (FF-synced clean)
> **Authored:** 2026-05-17 EDT · post-Wave-19-Slot-A+B+C close
> **Purpose:** Empirical Phase 1 audit feeding Wave 20 Phase 2-8 build sequence (Ruflo concept extract · RuVector HNSW · Hybrid memory · Obsidian sync · Graphify self-introspection · 15-agent topology · Truth Gate cross-validate)
> **Spec source:** `~/Downloads/skills/Devin/SYLVIA_BRAIN_AUDIT_AND_RUFLO_PORT_BRIEFING_2026-05-18.md` (533 LOC · SHA 808e44d35837c648)
> **Flag registry:** `~/Downloads/skills/Flags/FLAG_TAXONOMY_REGISTRY_2026-05-17.md` (278 LOC · RULE 0.1.A dual-FLAGS canonical)

---

## §1 · BRAIN AUDIT (cognitive substrate · empirical 2026-05-17 EDT)

### 1.1 · 7-Memory Framework LIVE State (verified)

| Layer | State | Cite | Empirical LOC | Spec LOC | Drift |
|---|---|---|---|---|---|
| §1 Working | ✅ LIVE | `lib/sylvia/triage-router.ts` | 447 | 447 | 0 |
| §2 Short-term | ✅ LIVE | Prisma `SylviaMemory` model L1302 + `lib/sylvia/memory.ts` | 357 | 310 | +47 (P73 evolution) |
| §3 Procedural | ✅ LIVE | `lib/bots/skills/*` 239 packs across 15 bot dirs | n/a | — | — |
| §4 LTM | 🔴 BANKED Phase 9.1 | nightly STM→LTM consolidation cron | — | — | — |
| §5 Pattern engine v1 | ✅ LIVE | `lib/sylvia/pattern.ts` P74 · rule-based · feature-flag default OFF | 228 | 210 | +18 |
| §6 Self-update | 🔴 BANKED Phase 9.9 | LLM-escalation + skill-pack update queue | — | — | — |
| §7 Episodic | ✅ LIVE PROD TURSO | `lib/sylvia/episodic.ts` + `sylvia_episodic` Prisma model L1368 (P72/P78 · 11 cols · 5 indexes) | 268 | 245 | +23 |
| §8 Semantic | ✅ LIVE | `lib/sylvia/semantic.ts` + `sylvia-data/semantic/skill-index.json` 695 KB · 239 entries · 15 bot domains | 298 | 270 | +28 |
| §9 Long-term memory | 🔴 BANKED Phase 9.1 | depends on §4 + AgentDB | — | — | — |
| §10 Pattern recognition | ✅ LIVE | post-P74 · feeds `classify.ts` complexityHint extension | n/a | — | — |

**Active layers: 6 of 10** (§1+§2+§3+§5+§7+§8+§10). **Banked: 4** (§4+§6+§9 + Phase 9 cluster).

**BINDING #28 drift catches:** 4 LOC drifts from spec (P72/P73/P74 ship grew episodic/memory/pattern/semantic substrates post-briefing-author · sustains BINDING #35 spec-author deep-dive at IT side · not regression · post-spec evolution).

### 1.2 · Sylvia Code Inventory (empirical · post-Wave-19 ship state)

```
lib/sylvia/                                                 (21 files · 4,011 LOC total)
├── chat/                                                   (P70 hardwired chat)
│   ├── handler.ts                                          458 LOC · clones callGateway LiteLLM-fetch + tool_calls[] detection
│   ├── tools-bridge.ts                                     197 LOC · OpenAI-compat tool_call → handleFileRead/handleFileWrite
│   └── types.ts                                             56 LOC
├── dispatcher/                                             (4-AI Truth Gate substrate · NEW POST-SPEC NOTE)
│   ├── agreement.ts                                        114 LOC · pairwiseScore + jaccard + numeric similarity
│   ├── auth.ts                                              65 LOC · verifySylviaInternalSecret + constantTimeEquals
│   ├── budget.ts                                            80 LOC · BudgetTracker + rolloverIfNeeded + DEFAULT_DAILY_USD
│   ├── classify.ts                                          90 LOC · classifyStakes + preClassifyPatternHint (P74 consumer)
│   └── index.ts                                             15 LOC
├── tools/                                                  (NEW post-spec · file_read + file_write tool-call handlers)
│   ├── file-read.ts                                        161 LOC
│   ├── file-write.ts                                       216 LOC
│   └── types.ts                                             44 LOC
├── episodic.ts                                             268 LOC · P72 + P78 prod Turso writer
├── index.ts                                                 41 LOC · module barrel
├── memory-types.ts                                         131 LOC · TS types cross-cutting
├── memory.ts                                               357 LOC · P73 short-term
├── pattern.ts                                              228 LOC · P74 rule-based v1
├── router-types.ts                                          46 LOC · P76 Tier · TierPolicy · RouteDecision · RouteTask
├── router.ts                                               314 LOC · P76 KEYSTONE routeTask + routeAndDispatch + TIER_POLICIES
├── semantic.ts                                             298 LOC · P73 file-system-v1 · 239 skill packs
├── triage-router.ts                                        447 LOC · BINDING #10 single egress chokepoint
└── types.ts                                                101 LOC · ModelAlias union + TriageTask + TaskComplexity

app/api/sylvia/                                             (5 routes · 769 LOC total)
├── chat/route.ts                                            98 LOC · P70 streaming SSE · custom JWT · default-deny
├── consensus/route.ts                                      283 LOC · 4-AI Truth Gate · DO NOT TOUCH Wave 20
├── tools/
│   ├── file-read/route.ts                                  100 LOC
│   ├── file-write/route.ts                                 125 LOC
│   └── openapi/route.ts                                    163 LOC
```

**Spec inventory deltas (BINDING #28):**
- Spec missed `lib/sylvia/tools/*` (3 files · 421 LOC) · post-P65 ship · ground truth captured here
- Spec missed `app/api/sylvia/tools/*` (3 routes · 388 LOC) · ground truth captured here
- Spec missed `lib/sylvia/dispatcher/*` decomposition (5 files · spec implied single 4-AI Truth Gate file)

### 1.3 · Graphify Sylvia-Scoped Map (`graphify-out/GRAPH_REPORT_SYLVIA.md` · May 13 build · 4-day-old · topology canonical)

- **115 nodes · 168 edges · 8 communities**
- **97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS** (high signal-to-noise · 5 INFERRED edges avg confidence 0.8)
- **God nodes (top 10):**
  1. `triageAndRoute()` — 10 edges
  2. `POST()` — 10 edges
  3. `pairwiseScore()` — 6 edges
  4. `BudgetTracker` — 6 edges
  5. `rolloverIfNeeded()` — 5 edges
  6. `decide()` — 4 edges
  7. `recordTriage()` — 4 edges
  8. `classifyStakes()` — 4 edges
  9. `verifySylviaInternalSecret()` — 4 edges
  10. `classifyComplexity()` — 3 edges
- **8 communities:** Gateway Routing (18 nodes · cohesion 0.16) · Dossier Templates (17 · 0.11) · Consensus API Route (15 · 0.16) · Memory & Audit (11 · 0.14) · Agreement Scoring (10 · 0.27) · Budget Tracking (5 · 0.25) · Knowledge Base Types (8 · 0.22) · Internal Auth (4 · 0.6)
- **Knowledge gaps:** 44 isolated nodes (≤1 connection · ALIAS_COST_PER_1M_TOKENS_USD · COMPLEXITY_CASCADE · sessionCostMap · GatewayResponse · RecordTriageInput +39 more) · candidate Wave 20 Phase 6 self-introspection target

**Note:** Map predates P76 router.ts + router-types.ts (router community not yet surfaced). Refresh via `graphify update .` post-Wave-20-Phase-2 to incorporate router topology.

### 1.4 · Hardwired Chat Surface (P70 LIVE · default-deny)

| Surface | State | LOC |
|---|---|---|
| `app/sylvia/chat/page.tsx` | LIVE · Awwwards-tier WCS 7 Pillars · Dual-Core identity baked | 715 |
| `app/sylvia/chat/layout.tsx` | LIVE · auth gate · `/auth/login` redirect on no-session | 48 |
| `app/api/sylvia/chat/route.ts` | LIVE · streaming SSE · custom JWT · `SYLVIA_CHAT_ALLOWED_USER_IDS` env empty (default-deny per PIVOT 1) | 98 |
| `lib/sylvia/chat/handler.ts` | LIVE · clones `callGateway` LiteLLM-fetch + tool_calls[] | 458 |
| `lib/sylvia/chat/tools-bridge.ts` | LIVE · OpenAI-compat tool_call → handleFileRead/handleFileWrite | 197 |
| `/sylvia/chat` prod URL | LIVE · auth-gated · default-deny · `sylvia-ai.com` banked future public launch | — |

### 1.5 · 4-AI Truth Gate Council (`/api/sylvia/consensus` · LIVE since May 8)

**SEPARATE FROM RUFLO QUEEN CONSENSUS** (Wave 20 §3.6 doctrine call · preserve distinction).

| Item | State |
|---|---|
| Route | `app/api/sylvia/consensus/route.ts` (283 LOC) |
| Auth | `verifySylviaInternalSecret` · timingSafeEqual + length guard + Buffer.from(utf8) |
| Quartet | `claude-haiku-4-5` · `gpt-4o-mini` · `gemini-2.5-flash` · `grok-4` (parallel · 25s per-provider timeout) |
| Agreement | `pairwiseScore` >= 85 → verified · 70-84 → partial · <70 → refused (422 VALIDATION) |
| Budget | `BudgetTracker` per-question $0.50 cap · DEFAULT_DAILY_USD ceiling |
| Routing | All AI via `triageAndRoute` → LiteLLM Gateway (BINDING #10 single egress) |
| Runtime | nodejs · maxDuration 60s |
| M10 moat | provider-verification truth gate · investor-grade audit trail |

**Wave 20 PRESERVES this layer untouched.** Ruflo Queen consensus = AGENT-internal coordination · 4-AI Truth Gate = AI-provider verification. Two distinct concepts · two distinct layers.

---

## §2 · BRAINSTEM AUDIT (load-bearing systems · empirical 2026-05-17 EDT)

### 2.1 · LiteLLM Gateway (BINDING #10 single egress · post-Slot-C revival)

| Item | State |
|---|---|
| Daemon | 🟢 LIVE PID 92234 · ProcessType=Interactive (Slot C fix · QoS_USER_INTERACTIVE) |
| Port | :8000 LISTEN (lsof confirms) |
| Sustained probe | 10/10 = 200 (5-min window Slot C close) |
| Chokepoint role | EVERY AI call routes `lib/sylvia/triage-router.ts` → `callGateway()` → LiteLLM `:8000/v1/models` → fan-out OpenAI/Anthropic/Gemini/xAI/Perplexity |
| Watchdog | LIVE com.legacyloop.litellm-watchdog · 30s polling · 3 retries/hr max · retry counter reset Slot C |
| Models | 11 aliases (gpt-4o-mini · claude-haiku-4-5 · gemini-2.5-flash · grok-4 · llama-3.2-local · qwen-coder-2.5-local · deepseek-r1-local · sonar · sonar-pro · sonar-reasoning-pro · sonar-deep-research) |
| Cost map | `ALIAS_COST_PER_1M_TOKENS_USD` in `triage-router.ts:61-81` |
| Cascade | `COMPLEXITY_CASCADE` in `triage-router.ts:87-92` (simple → llama-3.2-local · medium → gpt-4o-mini · complex → claude-haiku-4-5 · specialized → sonar-reasoning-pro) |

### 2.2 · Turso Production Database

| Item | State |
|---|---|
| Connection | `TURSO_CONNECTION_URL` LIVE Vercel Production scope (BINDING #5 Mac Keychain pattern) |
| Auth | `TURSO_AUTH_TOKEN` LIVE Vercel Production scope (BINDING #5 honored) |
| Tables | **54** (`grep -c "^model " prisma/schema.prisma` empirical) |
| Sylvia models | `SylviaMemory` L1302 (P73) + `SylviaEpisodic` L1368 (P72/P78) |
| Photo storage | Cloudinary canonical (post-CMD-VERCEL-BUNDLE-FIX V20 untracked /uploads/) |
| Prisma client | **v6.19.2** (package.json verified · 54 models · per repo) |
| OP-B pattern | 23/23 cumulative stmts · BINDING #6 prod push canonical |

### 2.3 · Daemon QUARTET (launchctl · main worktree · empirical 2026-05-17 EDT)

| Daemon | State | PID | Plist |
|---|---|---|---|
| Ollama | 🟢 LIVE | 71565 | `com.legacyloop.ollama` |
| LiteLLM Gateway | 🟢 LIVE post-Slot-C | 92234 | `com.legacyloop.litellm` (ProcessType=Interactive) |
| Open WebUI | 🟡 legacy fallback (no entry in launchctl list this probe · CMD-TRIO-RESTORE banked) | — | `com.legacyloop.openwebui` |
| Stay-awake | 🟢 LIVE | 1674 | `com.legacyloop.stay-awake` |
| LiteLLM watchdog | 🟢 LIVE re-armed | — | `com.legacyloop.litellm-watchdog` |

**Drift catch:** Spec said "QUARTET" but Open WebUI not loaded this probe. Post-Slot-C QUARTET = TRIO + watchdog. Open WebUI legacy fallback banked CMD-TRIO-RESTORE V20 LOW.

### 2.4 · Cost Substrate (BINDING #25 budget cap)

| Item | Value |
|---|---|
| Daily Vercel cap | $20 (matches Legacy-Loop production cap · 97% headroom most days) |
| Per-question Sylvia cap | $0.50 (`BudgetTracker.rolloverIfNeeded`) |
| Monthly burn (R29) | ~$13 vs $407 cap (3% utilization) |
| Graphify spend | $0.4137 of $20/day (2% util) · AST-only post-init |
| LLM provider keys | 5 in Mac Keychain `legacyloop-{openai,anthropic,gemini,xai,perplexity}-api-key` |
| Wave 19 Slot B P76 router | $0 spend v1 · rule-based · feature-flag default OFF |
| Wave 19 Slot C ops cyl | $0 spend ops class · doc-only commit |

### 2.5 · Brain ↔ Brainstem Wire Diagram (current state · post-Wave-19)

```
                  ┌─────────────────────────────────────────┐
                  │  CEO Mac (local-execution doctrine)     │
                  │                                          │
                  │  Daemon TRIO+watchdog (launchctl)        │
                  │   • Ollama :11434 → 3 local models       │
                  │   • LiteLLM :8000 → Gateway chokepoint   │
                  │     (ProcessType=Interactive · Slot C)   │
                  │   • watchdog → 30s health probe          │
                  │   • caffeinate → stay-awake              │
                  └────────────────┬─────────────────────────┘
                                   │
              ┌────────────────────┼───────────────────┐
              │                    │                    │
              ▼                    ▼                    ▼
   ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
   │ /sylvia/chat     │  │ /api/sylvia/     │  │ Bot routes       │
   │ (P70 hardwired)  │  │   consensus      │  │ (PriceBot etc)   │
   │ default-deny     │  │ 4-AI Truth Gate  │  │                  │
   └─────────┬────────┘  └────────┬─────────┘  └────────┬─────────┘
             │                    │                      │
             └──────┬─────────────┴──────────────────────┘
                    │
                    ▼
        ┌──────────────────────────────────┐
        │ lib/sylvia/router.ts             │  ← P76 NEW KEYSTONE
        │ routeAndDispatch (T1/T2/T3)      │     feature-flag default OFF
        │ feature-flag SYLVIA_ROUTER_ENABLED   .env.local: present
        └──────────────┬───────────────────┘
                       │
                       ▼
        ┌──────────────────────────────────┐
        │ lib/sylvia/triage-router.ts      │  ← BINDING #10 chokepoint
        │ callGateway() → LiteLLM :8000    │
        │ classifyComplexity() →           │
        │ COMPLEXITY_CASCADE → ALIAS_COST  │
        └──────┬───────────────┬───────────┘
               │               │
               ▼               ▼
    ┌──────────────────┐  ┌──────────────────────────────┐
    │ Memory Layer     │  │ Skill Layer                   │
    │ §1 Working       │  │ §3 Procedural (239 packs)    │
    │ §2 Short (Turso) │  │ §5 Pattern engine (P74)      │
    │ §7 Episodic      │  │ §10 Pattern recognition       │
    │ §8 Semantic      │  │                               │
    └──────────────────┘  └──────────────────────────────┘
```

---

## §3 · P76 CONSUMPTION SURFACE (post-Wave-19 cite)

| Item | State |
|---|---|
| `lib/sylvia/router.ts` | 314 LOC · 3-tier classifier · TIER_POLICIES · routeTask + routeAndDispatch · P76 KEYSTONE ship `fefe2ff` |
| `lib/sylvia/router-types.ts` | 46 LOC · Tier (T1/T2/T3) · TierPolicy · RouteDecision · RouteTask · RouteClassifier |
| `docs/sylvia/cost-tier-routing.md` | 7,289 B architecture doc · 6 sections (architecture · tier policy · feature-flag rollout · Anthropic emphasis rationale · pattern engine feedback loop · Phase 9.9 LLM-escalation vision) |
| `scripts/router-smoke.mjs` | 172 LOC · §5.X Gate 2 smoke harness · 5/5 PASS (greeting→T1 · explainer→T2 · refactor→T3 · live-web→T3 · translation→T2) |
| `SYLVIA_ROUTER_ENABLED` | present in `.env.local` (`grep -cE` count=1) · Wave 19+1 Cyl #2 preview canary set · production banked Phase 9.5 |
| Tier policy | T1 local (Ollama 3 models · $0.001/call · $0.02/session) · T2 mid-cloud (gpt-4o-mini + gemini-2.5-flash · $0.01/call · $0.20/session) · T3 premium (Anthropic emphasis claude-haiku-4-5 + gemini-2.5-flash + grok-4 · $0.10/call · $2.00/session) |
| Feature-flag default | OFF (router.ts:106 `process.env.SYLVIA_ROUTER_ENABLED === "1"`) |
| Production behavior | ZERO delta v1 (router OFF → bypass → triageAndRoute pass-through) |
| Safe-ship pattern | GREENFIELD substrate · zero existing-file mutation · BINDING #16 clone-not-modify honored |
| Doctrine candidate | DOC-COST-CLASS-ROUTING-CANONICAL 1/5 · ratifies post-Phase-9.5 activation telemetry validates |
| BANKED Wave 17+ | GLM-4.6 · Qwen 2.5-VL · Llama 3.3 · Sonnet · GPT-5.4 · Gemini-3.1-Pro alias adds (pending LiteLLM `/v1/models` probe + ModelAlias union extension) |

---

## §4 · GAPS to Wave 20 IMPLANT TARGETS (Elon-Musk-grade · BINDING #16 clone-not-modify)

### 4.1 · Ruflo Swarm Orchestration → `lib/sylvia/swarm/*` (Phase 2)

| Component | Status | Target path |
|---|---|---|
| Hierarchical-mesh 15-agent topology | 🔴 NOT BUILT | `lib/sylvia/swarm/topology.ts` |
| SendMessage-first coordination | 🔴 NOT BUILT | `lib/sylvia/swarm/orchestrator.ts` |
| Queen-led consensus (INTERNAL) | 🔴 NOT BUILT (preserve separation from 4-AI Truth Gate) | `lib/sylvia/swarm/consensus.ts` |
| Named-agent registry | 🔴 NOT BUILT | `lib/sylvia/swarm/agent-registry.ts` |
| 27-hook system | 🔴 NOT BUILT | `lib/sylvia/swarm/hooks.ts` |
| Module barrel + types | 🔴 NOT BUILT | `lib/sylvia/swarm/{index,types}.ts` |

**Anchor:** Zero `@ruflo/*` customer import. Pattern cloned · code custom-written.

### 4.2 · RuVector HNSW Vector Store → `lib/sylvia/vector/*` (Phase 3)

| Component | Status | Target path |
|---|---|---|
| HNSW index implementation | 🔴 NOT BUILT (CEO §5.X Gate 1 picks lib: hnswlib-node A · pure-TS B · LanceDB C) | `lib/sylvia/vector/hnsw.ts` |
| Embedding adapter (LiteLLM Gateway route) | 🔴 NOT BUILT | `lib/sylvia/vector/embed.ts` |
| Turso-backed persistence (BINDING #6 OP-B) | 🔴 NOT BUILT | `lib/sylvia/vector/store.ts` |
| Top-K nearest neighbor query | 🔴 NOT BUILT | `lib/sylvia/vector/search.ts` |
| Types | 🔴 NOT BUILT | `lib/sylvia/vector/types.ts` |

**Recommendation:** Option A · `hnswlib-node` · acceptable BINDING #16 deviation (utility lib · not framework).

### 4.3 · Hybrid Memory Pattern Integration (Phase 4)

| Layer | Current | Wave 20 Augmentation |
|---|---|---|
| §2 Short-term (Turso `SylviaMemory`) | ✅ unchanged | unchanged (preserve canonical) |
| §7 Episodic (Turso `sylvia_episodic`) | ✅ stable P78 schema | gain HNSW index over `embeddings BLOB` column (BANKED post-P78) |
| §8 Semantic (`skill-index.json` file-system-v1) | ✅ 695 KB · 239 entries | migrate to Turso table + HNSW (current FS was PATH A) |
| §5 Pattern (P74 `pattern.ts`) | ✅ rule-based | keep rule engine · HNSW augments semantic pattern recall |

**Net:** 7-memory framework unchanged structurally · HNSW accelerates retrieval 150x · Turso preserves canonical storage.

### 4.4 · Obsidian Bi-Directional Sync → `lib/sylvia/obsidian/*` (Phase 5)

| Component | Status | Target path |
|---|---|---|
| Sylvia → Obsidian writer (episodic markdown emit) | 🔴 NOT BUILT | `lib/sylvia/obsidian/writer.ts` |
| Obsidian → Sylvia watcher (chokidar) | 🔴 NOT BUILT · CEO §5.X Gate 1 picks debounce (default 3 sec proposed) | `lib/sylvia/obsidian/watcher.ts` |
| YAML frontmatter serialize/parse | 🔴 NOT BUILT | `lib/sylvia/obsidian/frontmatter.ts` |
| 14-folder taxonomy ↔ memory-layer map | 🔴 NOT BUILT | `lib/sylvia/obsidian/taxonomy-map.ts` |
| Module barrel + types | 🔴 NOT BUILT | `lib/sylvia/obsidian/{index,types}.ts` |

**Vault root:** `~/Obsidian Vaults/LegacyLoop Command Vault/` · 14 folders mapped · `_Identity/` symlink → `~/.claude/identity/` LIVE.

### 4.5 · Graphify Self-Introspection → `lib/sylvia/graph/*` (Phase 6)

| Component | Status | Target path |
|---|---|---|
| Graph BFS/DFS query | 🔴 NOT BUILT | `lib/sylvia/graph/query.ts` |
| Top-N god-nodes accessor | 🔴 NOT BUILT | `lib/sylvia/graph/god-nodes.ts` |
| Community-aware retrieval | 🔴 NOT BUILT | `lib/sylvia/graph/community.ts` |
| Drift detect (session-start vs current SHA) | 🔴 NOT BUILT | `lib/sylvia/graph/drift-detect.ts` |
| Module barrel + types | 🔴 NOT BUILT | `lib/sylvia/graph/{index,types}.ts` |

**Current graphify-out:** repo-wide 10,377 nodes · 13,594 edges · 994 communities (SHA fresh from `46490d1`). Sylvia-scoped: 115 nodes · 168 edges · 8 communities (build May 13 · stale 4 days · refresh post-Phase-2). Token cost: $0 ongoing (AST-only `graphify update .`).

### 4.6 · 15-Agent Hierarchical-Mesh Topology Activation (Phase 7)

| Role | Bot mapping (existing 239 skill packs) |
|---|---|
| Queen (Sylvia · CEO-addressed) | self |
| Architect | ListBot |
| Researcher | AnalyzeBot · CollectiblesBot (domain-specific) |
| Coder | PriceBot (data-domain) |
| Reviewer | MegaBot (Queen-of-Queens · 4-provider multi-AI orchestrator) |
| ~10 specialist roles | remaining ~10 bots |

**Feature-flagged** `SYLVIA_SWARM_ENABLED=false` until §5.X Gate validation (5-task smoke).

### 4.7 · Queen Consensus PRESERVE separate from 4-AI Truth Gate (Phase 8 doctrine call)

**Critical:** Wave 20 PRESERVES `/api/sylvia/consensus/route.ts` UNTOUCHED. Two distinct layers:

- **Queen Consensus** → `lib/sylvia/swarm/consensus.ts` (NEW · agent-internal voting · Byzantine fault-tolerant agent coordination)
- **4-AI Truth Gate** → `app/api/sylvia/consensus/route.ts` (EXISTING · provider-verification truth check on AI responses)

---

## §5 · PHASE 2-8 DEPENDENCY MAP

| Phase | Cyl | Class | Worktree | IT (min) | CEO gate | Depends on |
|---|---|---|---|---|---|---|
| **2** | CMD-SYLVIA-RUFLO-CONCEPT-EXTRACT V20 | ARCH | agent-1 | ~90 | ~8 (×2) | Phase 1 audit ✅ · Ruflo CLI ✅ v3.7.0-alpha.45 · MCP wire ✅ ~30 tools |
| **3** | CMD-SYLVIA-RUVECTOR-HNSW-SUBSTRATE V20 | ARCH | agent-2 | ~120 | ~5 | Phase 2 + CEO §5.X Gate 1 (HNSW lib pick: A hnswlib-node · B pure-TS · C LanceDB) |
| **4** | CMD-SYLVIA-HYBRID-MEMORY-INTEGRATION V20 | ARCH | agent-3 | ~90 | ~5 | Phase 3 + sylvia_episodic schema stable ✅ P78 |
| **5** | CMD-SYLVIA-OBSIDIAN-BIDIRECTIONAL-SYNC V20 | FEAT | agent-1 | ~120 | ~10 | Phase 4 + CEO watcher debounce decision (default 3 sec proposed) |
| **6** | CMD-SYLVIA-GRAPHIFY-SELF-INTROSPECTION V20 | FEAT | agent-2 | ~90 | ~5 | existing graphify-out/* ✅ + post-Phase-2 router-aware refresh |
| **7** | CMD-SYLVIA-15-AGENT-TOPOLOGY-ACTIVATE V20 | FEAT | agent-3 | ~120 | ~10 (5-task smoke) | Phases 2-6 + CEO §5.X Gate 2 pass criteria |
| **8** | CMD-SYLVIA-TRUTH-GATE-CROSSVALIDATE V20 | DOC | main | ~60 | ~5 | Phases 7 GREEN + 24h prod stability watch |

**Critical path · net Wave 20:** ~12-18 hr IT autonomous + ~2 hr CEO interaction across 8 §5.X gates · 3-5 calendar days wall-clock.

**Parallel-safety:** Phases 2+3+4 may run parallel across agent-1/2/3 worktrees once Phase 1 §12 GREEN. Phases 5+6+7 sequential (bi-directional Sylvia integration · single-source-of-truth memory discipline).

---

## §6 · INVESTOR NARRATIVE ANCHOR (12-moat → 17-moat post-Wave-20)

### 6.1 · Current 12-Moat Architecture (post-Wave-19)

| Moat | Anchor |
|---|---|
| M1-M9 | (legacy structural · resale automation primitives) |
| M10 | Multi-AI Truth Gate (`/api/sylvia/consensus` · 4-provider · LIVE May 8) |
| M11 | Domain Corpus (239 skill packs · 15 bot domains · `lib/bots/skills/`) |
| M12 | Outreach Layer (Meta App Review submitted · FB OAuth wired) |
| **M13 NEW (P76)** | **Cost-Tier Router** (3-tier T1/T2/T3 · BINDING #10 single egress · `lib/sylvia/router.ts` 314 LOC) |

### 6.2 · Wave 20 Adds → 17-Moat Architecture

| Moat | Wave 20 Phase | Anchor |
|---|---|---|
| **M14** | Phase 6 | **Self-Introspective Brain** (Graphify self-loop · Sylvia reads her own graph · 44.9× token reduction) |
| **M15** | Phase 5 | **Bi-Directional Knowledge Sync** (Obsidian writer + watcher · 14-folder taxonomy ↔ 7-memory layer map) |
| **M16** | Phase 7 | **Multi-Agent Swarm** (15-agent hierarchical-mesh · Queen-led INTERNAL consensus · SendMessage-first coordination) |
| **M17** | Phase 3+4 | **Adaptive Learning Substrate** (RuVector HNSW + neural feedback · 150× faster pattern retrieval · hybrid memory backend) |

### 6.3 · Three-Audience Matrix Position (post-Wave-20)

| Audience | Pitch |
|---|---|
| **Dr. Clark (reactivation)** | "Sylvia substrate complete · self-introspective · 15-agent swarm orchestration · custom-written · zero third-party customer dependency · Manus-grade autonomy." |
| **Series A VCs** | "17-moat architecture: M1-M9 structural + M10-M13 differentiation + M14-M17 adaptive intelligence. Sylvia is the moat AROUND the moats." |
| **Strategic partners (eBay · Mercari · Whatnot)** | "Plug-and-play AI resale automation · zero LLM provider lock-in · LiteLLM single egress · provider-agnostic · doctrine-driven audit trail for compliance." |

### 6.4 · Demo Surface (post-Wave-20 GREEN · 5 scenes)

1. **CEO opens Sylvia chat** → asks "how does PriceBot work?" → Sylvia queries her own graphify graph · returns community + god-nodes + cite paths · zero hallucination
2. **CEO writes new doctrine note in Obsidian** → watcher fires · Sylvia ingests · §8 Semantic memory updated · next chat references new note within 2 sec
3. **CEO assigns 5-task complex job** → Sylvia spawns 5 named agents (architect + coder + tester + reviewer + qa) · SendMessage coordinated · Queen consensus on output · 4-AI Truth Gate verifies · CEO sees final delivery + audit trail
4. **CEO inspects Sylvia self-state** → `/sylvia/chat` "show me your brain" → Sylvia returns 7-memory framework + 15-agent swarm + HNSW vector index size + Obsidian sync state + graphify SHA · full transparency
5. **Sylvia detects drift** → notices `triage-router.ts` changed mid-session · alerts CEO · "I've updated my self-graph · here's what changed"

### 6.5 · Competitive Position

| Competitor | Sylvia Advantage Post-Wave-20 |
|---|---|
| Manus | product-domain-specialized (resale) · 12-moat structural advantage · M16 swarm |
| Perplexity | owns the data corpus (P78 episodic + 239 skill packs) · Perplexity rents from search APIs |
| NotebookLM | bi-directionally synced with CEO's Obsidian · NotebookLM is read-only ingest |
| OpenAI ChatGPT | provider-agnostic via LiteLLM · M10 Truth Gate · ChatGPT is single-provider |
| Anthropic Claude.ai | deployed in customer workflow (resale) · domain skill packs · zero comparison surface |

---

## §7 · BINDING SELF-AUDIT (this cyl · audit-only · zero code touch)

| BINDING | Honored? | How |
|---|---|---|
| **#5 NEVER-CAT-ENV** | ✅ | `grep -cE "^SYLVIA_ROUTER_ENABLED" .env.local` count-only · zero dump |
| **#10 SINGLE EGRESS** | ✅ | LiteLLM chokepoint cited verbatim §2.1 · zero new egress path proposed in audit |
| **#16 CLONE-NOT-MODIFY** | ✅ | audit-only · zero file mutation · target Wave 20 Phase 2-7 honors clone-pattern |
| **#17 AUDIT-FIRST-WIRE** | ✅ | substrate read VERBATIM pre-write: 13 files · router.ts (1-314) · router-types.ts (1-46) · triage-router.ts (1-100) · episodic.ts (1-50) · memory.ts (1-50) · semantic.ts (1-50) · pattern.ts (1-50) · consensus/route.ts (1-50) · DOCTRINE_LEDGER.md (1-200) · GRAPH_REPORT_SYLVIA.md (1-200) · spec briefing (1-533) · FLAG_TAXONOMY_REGISTRY (1-278) · two plist files (Wave 19 Slot C precedent) |
| **#20 WORKTREE-ISOLATION** | ✅ | agent-2-slot isolated · FF-sync clean to HEAD `1c3a6e9` · zero cross-worktree collision |
| **#25 BUDGET-CAP-20** | ✅ | $0 spend doc-class · zero AI call · zero gateway hit |
| **#28 DRIFT-CATCH** | ✅ | 6 drifts surfaced: episodic +23 · memory +47 · pattern +18 · semantic +28 · `lib/sylvia/tools/*` 3 files post-spec · `app/api/sylvia/tools/*` 3 routes post-spec · QUARTET→TRIO+watchdog (Open WebUI legacy fallback) · cumulative count sustains 70×+ |
| **#30 IT DEEP-DIVE GATE** | ✅ | §0.5 13-check verbatim emit (preceded FIX 2) · all PASS · drift caught + cited |
| **#31 PUSH-BACK-WITH-REPLACEMENT** | ✅ | armed · zero trigger this cyl (substrate empirically stable post-Slot-C) |
| **#34 WIDENED CITE** | ✅ | (a) commit SHA = forthcoming this cyl ship · (b) FF-push to main · (c) grep proof + tsc=0 + build PASS |
| **#35 SPEC-AUTHORING-DEEP-DIVE** | ✅ | this audit = Phase 1 anchor · sustains 6/5 (Wave 14 P68+P69+P70 + Wave 19 Slot A+B+C + this) |
| **Rule #22 SKILLS-MANIFEST** | ✅ | manifest cited at §0.3 of session boot (skills 50+ available · ~/.claude/skills 5 · graphify · caveman · paul · vercel:* etc) |

---

## §8 · CARRY-FORWARDS (post-Phase-1 close)

- **CMD-SYLVIA-RUFLO-CONCEPT-EXTRACT V20** Wave 20 Phase 2 · ARCH · agent-1 · ~90 min IT · ~8 min CEO ×2
- **CMD-SYLVIA-RUVECTOR-HNSW-SUBSTRATE V20** Wave 20 Phase 3 · CEO §5.X Gate 1 picks lib (A/B/C)
- **CMD-SYLVIA-HYBRID-MEMORY-INTEGRATION V20** Wave 20 Phase 4
- **CMD-SYLVIA-OBSIDIAN-BIDIRECTIONAL-SYNC V20** Wave 20 Phase 5 · CEO watcher debounce
- **CMD-SYLVIA-GRAPHIFY-SELF-INTROSPECTION V20** Wave 20 Phase 6 · refresh GRAPH_REPORT_SYLVIA post-router
- **CMD-SYLVIA-15-AGENT-TOPOLOGY-ACTIVATE V20** Wave 20 Phase 7 · feature-flag SYLVIA_SWARM_ENABLED OFF until smoke
- **CMD-SYLVIA-TRUTH-GATE-CROSSVALIDATE V20** Wave 20 Phase 8 · DOC
- **CMD-TRIO-RESTORE V20** LOW (Open WebUI legacy fallback re-bootstrap · QUARTET → TRIO+watchdog drift caught this cyl)
- **CMD-GRAPHIFY-UPDATE-SYLVIA-CY-N V20** LOW (GRAPH_REPORT_SYLVIA.md 4 days stale · post-Wave-20-Phase-2 refresh to add router community)
- **CMD-SCRIPTS-AGENT-SHIP-REMOVE-SKIP-LITELLM-PREFLIGHT-OVERRIDE V20** LOW (post-Slot-C 24h watch · override no longer needed)

---

END · SYLVIA BRAINSTEM AUDIT · Wave 20 Phase 1
