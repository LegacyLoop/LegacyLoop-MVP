# W27-M · Manus Autonomous Foundation · Scope + Integration Map
**Date:** 2026-05-30 · **Lane:** Track A · Wave 27 · Lane M (Manus) · **Agent:** A (agent-1)
**Spec:** CMD-W27-M-MANUS-AUTONOMOUS-FOUNDATION-SCOPE V20 LOW · anchor `be0b2da` (origin/main moved from spec-cited `e23bfeb`)
**Status:** 🟢 GREEN · SCOPE-ONLY · ZERO code · `lib/sylvia` diff = 0 (LAW #38 ABSOLUTE)

> Map before build. This is a recommendation. CEO ratifies sequence before any W30 build fires.

---

## §0.5 Empirical Anchors (BINDING #30)

| Probe | Result |
|---|---|
| `~/Desktop/skills/Ideas/LegacyLoop_Master_Ideas_v2_2026-05-18.md` § Q | Epic B Manus AI Autonomous Selling is "Phase 8 · THE HOLY GRAIL" · 5-7 n8n workflows · Playwright droplets · shares infra with MPMA Layer 3 |
| `lib/sylvia/swarm-activate/{index,types,activator,coordinator,role-assignment,consumer-hooks}.ts` | **EXISTS · LAW #38 LOCKED · READ-ONLY** · 495 LOC across 6 files · CMD-SYLVIA-15-AGENT-TOPOLOGY-ACTIVATE V20 v2.1 · hierarchical-mesh topology · feature-flagged `SYLVIA_SWARM_ACTIVATE_ENABLED` default OFF |
| Phase-D/E pre-positioned consumer hooks | `PerCustomerActivationConfig` · `PerPlatformActivationConfig` · `PerConsumerActivationConfig` — Manus Phase 8 path already typed for per-platform autonomous agents |
| `lib/sylvia/hybrid/{index,bridge,merge,types}.ts` | hybrid memory recall · "Manus pattern" cited in header · vector-first w/ keyword fallback · feeds episodic memory for replay |
| `app/api/bots/*/route.ts` | 14 route files: 9 specialist bots (`antiquebot · buyerbot · carbot · collectiblesbot · listbot · pricebot · reconbot · shipbot · videobot`) + `lead/[leadId]` + `activate/[itemId]` + `status` + `[itemId]` router · all parameterized by `itemId` |
| `docs/audits/legacy-loop-full-bot-and-dashboard-ux-report-2026-05-26.md` (Codex audit) | Bot OS state-machine recommendation: `BotRun` canonical model · 9 statuses (`queued → running → succeeded · partial_success · failed · needs_user · superseded · refunded · cancelled`) · two-layer UX split (simple seller flow / advanced bot consoles) |
| `lib/scrapers/orchestration/` | **DOES NOT YET EXIST** in current HEAD (`be0b2da`) · post-W27-A wind-down banked the generic orchestrator for future lane · Manus consumes it when authored |
| Droplet `167.71.172.192` | 2 GB RAM · 1 vCPU · 50 GB SSD · Ubuntu 24.04 · Node 22 + Playwright ready · currently idle (capacity assessment §3 below) |

---

## §1 · Manus Autonomous · Definition (FIX 1)

**One sentence:** Manus is the autonomous selling layer that takes an item from upload to sold across multiple resale platforms, with the seller approving rather than operating.

### Four autonomous capabilities

| Capability | What Manus does | Source of truth |
|---|---|---|
| **LIST** | generates platform-tailored listings · publishes to FB Marketplace / eBay / Mercari / Poshmark / Etsy · maintains parity across surfaces | `ListBot` + per-platform adapter + Playwright droplet |
| **PRICE** | continuous repricing using ReconBot comps + PriceBot strategy + market signal · respects seller's floor · proposes drops within bands | `PriceBot` + `ReconBot` + `MarketIntelligence` aggregator |
| **NEGOTIATE** | replies to buyer messages within seller policy (24h window for Meta · platform-specific elsewhere) · escalates to seller on high-value or uncommon scenarios · BINDING #10 routes AI through LiteLLM | existing W25-META-L2 ingest + `lib/messaging/auto-reply` + new policy DSL |
| **SHIP** | when sold, prints label / dispatches pickup via existing shipping adapters · updates buyer · closes loop | `ShipBot` + `lib/shipping/*` |

### Multi-platform surface (per-platform agent · `PerPlatformActivationConfig`)

| Platform | Wire status | Manus reuse |
|---|---|---|
| Meta (FB · IG) | OAuth + Send API + webhook ingest shipped (W25-META-L2 + W26-B vault) | `lib/messaging/meta/*` + `lib/meta/oauth/*` |
| eBay | adapter banked | Manus delegates via per-platform agent |
| Mercari | adapter banked | Manus delegates via per-platform agent |
| Poshmark | adapter banked | Manus delegates via per-platform agent |
| Etsy | `legacyloop-etsy` Apify task ($30/mo · LOW burn) | Manus delegates via per-platform agent |

### CCL (Customer Cognitive Layer · M14-M17 banked)

Per-customer agents (already typed in `PerCustomerActivationConfig`) carry:
- seller-specific style/voice (negotiation tone, listing voice)
- inventory + sold history graph
- preference deltas (which platforms · which fees · which bots are trusted)

Manus consults the CCL for every decision — same item, two sellers, two different Manus posturings.

### Bot OS (state-machine layer · Codex audit §2.1)

Manus is the **operator** of the Bot OS, not a parallel system. Every autonomous action runs as a `BotRun` row with the canonical 9-status model. Manus is the agent that:
- queues bot runs in the right order
- supervises `needs_user` escalations
- decides when to retry vs supersede
- closes the loop on `succeeded` / `partial_success`

### Two-layer UX (Codex audit §1 + §3)

- **Layer 1 · Simple Seller Flow** — upload → "Legacy-Loop is selling this · review on demand" → notifications for `needs_user` only.
- **Layer 2 · Advanced Bot Consoles** — power users + internal team + diagnostics see the full bot fleet · `BotRun` history · provider usage · override controls.

Manus runs primarily under Layer 1 for the seller's eye; Layer 2 is the cockpit for everyone who needs to see the machine.

---

## §2 · Existing Hooks Inventory + Gaps (FIX 2)

### Existing (built · ready to consume)

| Hook | Path | Status | Manus role |
|---|---|---|---|
| `activateSwarm()` + `dispatchToSwarm()` | `lib/sylvia/swarm-activate/coordinator.ts` | shipped · flag-off | spin up per-item / per-platform agent rosters |
| `assignRolesFromCommunities()` | `lib/sylvia/swarm-activate/role-assignment.ts` | shipped | graphify-informed role allocation (Phase 6 communities) |
| `activatePerPlatformAgents()` | `lib/sylvia/swarm-activate/coordinator.ts` | shipped (typed) | one agent per platform per item |
| `activatePerCustomerAgents()` | `lib/sylvia/swarm-activate/coordinator.ts` | shipped (typed) | CCL backbone (M14-M17) |
| `activatePerConsumerAgents()` | `lib/sylvia/swarm-activate/coordinator.ts` | shipped (typed) | rate-limited consumer agents (API clients) |
| Hybrid memory recall | `lib/sylvia/hybrid/*` | shipped · vector-first | Manus episodic context lookup ("Manus pattern" cited in code) |
| 9 bot routes | `app/api/bots/{antiquebot,buyerbot,carbot,collectiblesbot,listbot,pricebot,reconbot,shipbot,videobot}/[itemId]/route.ts` | shipped | invokable atomic actions Manus orchestrates |
| Bot activation + lead routes | `app/api/bots/{activate,lead,status}/...` | shipped | invocation surface |
| LiteLLM gateway (BINDING #10) | `lib/sylvia/triage-router.ts` + LiteLLM `localhost:8000` | shipped · chokepoint preserved | every Manus AI call routes here |
| Sylvia episodic memory | `prisma/SylviaEpisodic` + W24-L2 replay (12,072 rows) | shipped + back-filled | Manus action log + counter-factual replay |
| Meta wire | `app/api/webhooks/messenger` + `lib/messaging/meta/*` + W26-B `lib/meta/oauth/*` + AES-256-GCM vault | shipped (W25/W26) | Manus negotiate + list surface for FB / IG |

### Gaps (must close before Manus W30+ activation)

| Gap | Impact | Lane suggestion |
|---|---|---|
| **`BotRun` canonical state model + 9-status enum** | every Manus action needs an idempotent run row · current `EventLog` blobs insufficient (Codex §2.1) | W28 schema lane (additive · single new model + relation to Item / User) |
| **Generic platform-orchestrator** (post W27-A wind-down salvage) | per-platform adapters need a shared driver Manus consumes uniformly | W28 lane (already banked from W27-A salvage notes) |
| **Per-platform listing adapters** (eBay, Mercari, Poshmark) | actual write-side surface for `LIST` capability | W29-W31 per-platform lanes (one per platform) |
| **Pricing policy DSL** (floor / ceiling / drop cadence / event triggers) | seller's autonomous repricing safety rails | W29 lane (data-driven policy stored in `ConnectedPlatform.settingsJson` or new `SellerPolicy` model) |
| **Negotiation policy DSL** (offer-accept band · scam thresholds · escalate rules) | Manus needs declarative rules per seller, not hard-coded | W29 lane (same pattern as pricing policy) |
| **Manus orchestrator service** (the actor that consumes Bot OS) | the supervisor itself | W30 lane · single service · activates swarm + dispatches bot runs |
| **Manus run dashboard** (Layer 2 cockpit) | UX cockpit for sellers + internal | W30-W31 UI lane |
| **Droplet upsize** (heavy concurrent Playwright + agent loops) | 2 GB / 1 vCPU is light for steady-state autonomous selling | see §3 |
| **`SYLVIA_SWARM_ACTIVATE_ENABLED` flag flip** | swarm activate gated by env flag (currently OFF) | W30 lane gates by tier · CEO-controlled |

---

## §3 · Droplet Posture + Capacity Assessment (FIX 3)

### Current state (`167.71.172.192`)

| Resource | Spec | Notes |
|---|---|---|
| RAM | **2 GB** | OK for a single Playwright Chromium ~400-700 MB resident · two concurrent flows = saturation risk |
| vCPU | **1** | one core · single Chromium peaks at ~80-100 % on heavy pages |
| Disk | 50 GB SSD | plenty for Node + Playwright + chromium cache + logs |
| OS | Ubuntu 24.04 | current · supported |
| Runtime | Node 22 + Playwright pre-installed | ready to host a worker process |
| Status | idle | infra waiting for autonomous workload |

### Manus steady-state workload (estimate)

- **N items × M platforms × K actions/day** — for a single power seller with 50 active items × 5 platforms × ~3 actions/day = 750 Manus actions/day.
- **Heavy actions = Playwright** (list / reply on FB Marketplace / Mercari). Light actions = API (eBay / Etsy).
- Concurrent peak = 5-10 Playwright sessions if Manus batches dawn / afternoon / evening reprice waves.
- Single Chromium per concurrent action ≈ 600 MB resident. 5 concurrent ≈ **3 GB** — already above 2 GB headroom.

### Capacity recommendation

| Tier | Spec | When |
|---|---|---|
| **Tier 0 (now)** | 2 GB / 1 vCPU | scope · smoke · single-seller proof |
| **Tier 1 (Manus activation · W30+)** | **upsize to 4 GB / 2 vCPU** | first 1-3 power sellers · ~250-750 actions/day |
| **Tier 2 (multi-seller GA)** | 8 GB / 4 vCPU or fleet of 4 GB workers behind a queue | post-GA · per-seller autonomy at scale |

**Recommendation:** flag droplet upsize to **4 GB / 2 vCPU** the moment W30 Manus orchestrator lane fires. Upsize is reversible; under-provisioning a Playwright fleet is a silent timeout + flaky-action source.

### Posture decision (CEO ratify)

- **Single droplet host** for Manus orchestrator + per-platform worker pool in Tier 1.
- **Queue + worker fleet** (Bull / pg-boss / sylvia_corpus_queue pattern) when Tier 2 lands.
- **Free-scraper crons (W27-A wind-down)** stay on dedicated workers; Manus does not share Playwright with scrapers (workload pattern differs).
- **Failover plan:** Manus actions must be idempotent (BotRun id is the dedup key) so a droplet restart never double-lists / double-sends.

---

## §4 · Recommended W30+ Build Sequence (FIX 4 · CEO ratifies)

> Each row = one lane. Ratification gates between rows. Manus does not fire end-to-end until row 6.

| # | Lane | Scope | Risk | CEO gate |
|---|---|---|---|---|
| 1 | **W28-A · `BotRun` canonical schema** | additive Prisma model · 9-status enum · indexes on (itemId, status, createdAt) · zero migration of existing event logs (parallel write) | LOW (additive) | schema-add ratify |
| 2 | **W28-B · Bot OS adapter** | `lib/bot-os/` thin layer · existing bot routes write `BotRun` rows via new adapter · feature flag for parallel-write mode | LOW | ratify |
| 3 | **W28-C · Generic platform-orchestrator** | from W27-A salvage notes · driver-shape per platform · ZERO live writes (smoke only) | LOW-MED | ratify |
| 4 | **W29-A · Pricing policy DSL** + storage | declarative seller policy (`ConnectedPlatform.settingsJson` or new `SellerPolicy` model) | LOW | ratify (schema if new model) |
| 5 | **W29-B · Negotiation policy DSL** + storage | same pattern · accept-band / scam-thresh / escalate-rules | LOW | ratify |
| 6 | **W29-C · Per-platform `LIST` adapter — first platform (eBay or Etsy)** | one platform end-to-end · gated by seller opt-in | MED | live-fire ratify + droplet upsize Tier 1 |
| 7 | **W30-A · Manus orchestrator service** | single supervisor process on droplet · consumes `activatePerPlatformAgents` + `dispatchToSwarm` · single-seller alpha | MED-HIGH | live-fire ratify · droplet upsize confirmed |
| 8 | **W30-B · Manus dashboard (Layer 2 cockpit)** | seller + internal cockpit · BotRun history + override controls | LOW | ratify |
| 9 | **W31-A · Second platform `LIST` adapter** | parallel of #6 | MED | ratify |
| 10 | **W31-B · Multi-seller alpha** | 2-3 power sellers · queue + worker fleet sizing call | HIGH | ratify (Tier 2 upsize) |

### Why this order

- **Schema + Bot OS first** — every later lane writes `BotRun` rows. Without canonical state, Manus is debugging-impossible.
- **Generic orchestrator before per-platform adapters** — reuse principle (BINDING #16) · adapters share driver shape.
- **Policy DSLs before live writes** — Manus cannot autonomously act without declarative rails per seller.
- **One platform end-to-end before the second** — proves the loop · prevents shotgun debug across platforms.
- **Manus supervisor after one platform proven** — orchestrator only useful when there is something to orchestrate that is known-good.
- **Dashboard before scaling** — internal visibility is a Day-1 requirement, not a Day-N polish.

---

## §5 · Doctrine

| BINDING / Rule | Applied |
|---|---|
| #5 ENV-FILE-DUMP | env presence checked count-only |
| #16 DELEGATE-TO-CANONICAL | scope explicitly mandates reuse of swarm-activate, hybrid, bot routes, LiteLLM, Meta wire — no new abstraction |
| #17 AUDIT-FIRST-WIRE | every recommendation cites empirical file path or schema |
| #28 DRIFT-CATCH | spec anchor `e23bfeb` · empirical `be0b2da` · cited |
| #30 §0.5 DEEP-DIVE | 8 empirical anchors above |
| **#38 LIB-SYLVIA-DIFF-ZERO** | `git diff --stat lib/sylvia` will be **0** · audit doc only |
| Rule #11 META-SAFETY | Manus on Meta surfaces inherits the Phase-1 gate · zero FB-Army scraper contact |

Doctrine candidate to track in future lanes: **DOC-MANUS-RUN-IDEMPOTENT-BOT-RUN-ID** — every Manus action keys on `BotRun.id` as dedup primary; droplet restart never double-acts.

---

## §6 · Flags

- **Spec anchor drift:** spec cites `e23bfeb`; origin/main at execution = `be0b2da`. Three commits ahead (W27-A wind-down + others). No content impact.
- **`lib/scrapers/orchestration/` absent:** spec lists this as a read; directory does not yet exist. Banked for the W27-A salvage author lane.
- **Codex audit `legacy-loop-full-bot-and-dashboard-ux-report-2026-05-26.md` is untracked:** present in main worktree but never committed. Recommend explicit commit in a doc-stewardship lane so the canon survives worktree resets.
- **`SYLVIA_SWARM_ACTIVATE_ENABLED` is default-OFF and Vercel env state is not yet probed:** Manus W30 activation requires flag flip + per-seller opt-in surface. Track in W30 gate.
- **Droplet upsize is a hard ratification gate** — under-provisioning will manifest as silent Playwright timeouts and flaky autonomous actions (worst class of bug to debug).
- **Negotiation policy DSL is the most-likely 8-Point-failure surface** (A11Y + senior intelligibility) — invest UX time per Codex §1 two-layer split when this lane ships.

---

## §7 · What This Lane Did NOT Do

- Wrote zero code.
- Edited zero `lib/sylvia/*` files (LAW #38 ABSOLUTE).
- Provisioned no droplet capacity.
- Committed no schema.
- Made no architecture commitment — every row in §4 is **recommendation**, awaiting CEO 1-line ratify.

**Connecting Generations · Built in Maine · World-class everywhere.**
