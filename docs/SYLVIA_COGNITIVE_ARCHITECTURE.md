# Sylvia Cognitive Architecture
## Brain-modeled destination · Phase 9 anchor · investor narrative

**Author:** IT (executor) · drafted via CMD-SYLVIA-COGNITIVE-ARCHITECTURE-DOC V18
**Date:** 2026-05-06 (Wed PM EDT) · Round 14 destination anchor · Worktree C
**Anchor HEAD:** `ba7239d` (post Cyl 2 closure · agent-3-slot synced with origin/main)
**Status:** PERMANENT operational doctrine · destination architecture · Phase 9 anchor · supersedes ad-hoc cognitive-architecture references
**Doctrine alignment:** anchors BINDING #16 DOC-DELEGATE-TO-CANONICAL · BINDING #17 DOC-AUDIT-FIRST-WIRE-PATTERN · banks DOC-COGNITIVE-MEMORY-LAYERED + DOC-BRAIN-MODELED-AI candidates (1/5 each · ratify on first Phase 9 cylinder fire)
**Companion docs:** `docs/SYLVIA_SKILLS_ARCHITECTURE_AUDIT.md` (Phase 3 anchor · `66ace5c` · 342 lines) · `docs/MULTI_AGENT_WORKTREE.md` (operational context · `f7451de` · 188 lines) · `docs/DOCTRINE_LEDGER.md` (canonical doctrine state · 274 lines)

---

## §1 · CEO Strategic Vision (verbatim)

CEO surfaced this destination 2026-05-06 PM EDT during R14 wave pre-stage:

> "Build Sylvia after a real human brain. Memories · experiences · pattern recognition · auto-pattern-recognition · auto-history-updating. Memories-understanding and history-understanding being current is key. The whole AI needs to work just like a human brain.
>
> Build the filing system · network · AI foundation to make this happen. Build off how existing AIs function as baseline · then build proprietary system if it works well. Billion-dollar level."

This doc captures that destination. Phase 9 (post-Manus · post-100-item milestone) is the build window. Phases 3–8 architecturally compound TOWARD Phase 9. This audit anchors all downstream decisions so Phase 3 SSA migration choices do not close off Phase 9 paths.

## §2 · Why Brain-Modeled · 7 Memory Systems Framework

(Cognitive science framework consolidated from Tulving 1972 · Squire 1992 · Baddeley 2000 · Anderson 1976 · cite Appendix A.)

Most production AI systems compress 7 distinct human memory systems into 1–2 (context window + RAG). This works for chatbots. It fails for autonomous agents that need to:

- Build cumulative understanding across sessions (not just per-call)
- Distinguish recent encoding (STM) from consolidated knowledge (LTM)
- Reconstruct cause-effect chains (episodic)
- Build entity-relationship graphs (semantic)
- Apply learned skills (procedural)
- Recognize patterns and auto-update beliefs (pattern engine + introspection)

Legacy-Loop's autonomous-selling thesis (Phase 8 Manus · n8n + Playwright closes the loop) requires all 7. This doc maps each.

## §3 · Current State vs Target State Per System

| # | System | Brain analog | Sylvia today | Sylvia target |
|---|---|---|---|---|
| 1 | Working memory | Prefrontal cortex | ✅ `lib/sylvia/triage-router.ts` (447 LOC · Brain Stem · routing context per-call) | persistent across multi-bot dispatch · session-scoped accumulator |
| 2 | Short-term memory | Hippocampus initial-encoding | ✅ `prisma model SylviaMemory` (30+ fields · `lib/sylvia/memory.ts:88` insert · `:159` recall) | TTL-based decay · attention-weighted relevance · explicit `consolidationPending` flag |
| 3 | Long-term memory | Cortex post-consolidation | ❌ NEW · does not exist | nightly ETL STM→LTM · pattern crystallization · noise filtering · provenance preserved |
| 4 | Episodic memory | Hippocampus + temporal cortex | 🟡 Partial · `prisma model EventLog` rows · scattered · no cause-effect chains | timeline reconstruction · cause-effect chain reconstruction · "what led to X" queries |
| 5 | Semantic memory | Temporal lobe | 🟡 Partial · 239 skill files (Phase 3 anchor) + future ScraperComp data flywheel | knowledge graph · entity relationships · this-IS · this-CAUSES · this-WORTH-IN-context |
| 6 | Procedural memory | Basal ganglia + cerebellum | ✅ 239 skill files · 2.5MB · 13 of 15 surfaces wired via `loadSkillPack` | Phase 3 SSA migration formalizes · `SKILL.md` + `examples/` + `data/` + `helper.ts` per skill folder |
| 7 | Pattern engine + self-update | Distributed default mode network | 🟡 Partial · MegaBot 4-AI consensus (`lib/megabot/run-specialized.ts`) | continuous pattern extraction on EventLog · auto-hypothesis · auto-history-update · introspection loop |

## §4 · Working Memory · Sylvia Brain Stem (✅ exists)

**Substrate:** `lib/sylvia/triage-router.ts` (447 LOC · `triageAndRoute()` canonical helper · BINDING #16 anchor · 8/8 production consumers per Phase 3 anchor doc).

**Brain analog:** prefrontal cortex (active context · attention allocation · decision routing).

**Current state:** routes per-call to 11 LiteLLM aliases (4 cloud · 3 Ollama-local · 4 Sonar) with cost-ceiling enforcement · streaming SSE accumulator · cost telemetry per call. State is per-call · session is identified via `sessionId` but working context isn't shared across multi-bot dispatch.

**Target state (Phase 9.x):** persistent working memory across multi-bot dispatch. When MegaBot fires PriceBot + AnalyzeBot + BuyerBot in 4-AI consensus, all three see common working memory rather than each rebuilding from scratch. Session-scoped accumulator + active-context flag.

**Cylinder anchor:** Phase 9 inherits the Brain Stem · no Phase 9 cylinder modifies `triage-router.ts` directly · extensions land in `lib/sylvia/working-context.ts` (NEW · proposed).

## §5 · Short-Term Memory · SylviaMemory schema (✅ exists)

**Substrate:** `prisma/schema.prisma model SylviaMemory` (30+ fields including `sessionId · promptHash · classification · chosenAlias · costEstimateUsd · costActualUsd · durationMs · responseText`). Helper API at `lib/sylvia/memory.ts` (204 LOC · `recordTriage` · `recallSimilar` · `getSessionStats` · `pruneOld`).

**Brain analog:** hippocampus initial-encoding (short-term retention · pre-consolidation · novelty signaling).

**Current state:** rows compounding per Sylvia call. `pruneOld` enforces a 7-day safety floor (cite `memory.ts:200`). Recall via `recallSimilar` uses promptHash + sessionId match.

**Target state (Phase 9.x):**
- TTL-based decay: rows older than N days lose attention weight (configurable per-bot)
- Attention-weighted relevance: high-cost OR high-novelty rows survive longer · low-cost identical-prompt rows decay faster
- Explicit `consolidationPending: Boolean` flag (true until LTM ETL processes the row)
- Per-row `salienceScore: Float` derived from cost + novelty + downstream consumer count

**Cylinder anchor:** Cylinder 9.2 (CMD-SYLVIA-STM-LTM-CONSOLIDATION-ETL V18) introduces decay logic.

## §6 · Long-Term Memory · NEW · STM→LTM nightly consolidation

**Substrate:** NEW Prisma model `LongTermMemory` (Appendix C draft).

**Brain analog:** cortex post-consolidation storage. Sleep consolidation maps to nightly ETL — biologically the cortex receives consolidated patterns from hippocampus during slow-wave sleep · Legacy-Loop's analog is a Vercel cron / Phase D hosted Gateway tick that consolidates SylviaMemory rows older than 24h into LongTermMemory rows.

**Current state:** ❌ does not exist. No persistence beyond SylviaMemory rows · no pattern crystallization layer.

**Target state (Phase 9.x):**
- Nightly ETL job walks SylviaMemory rows older than 24h
- Consolidates patterns: e.g., 50 SylviaMemory rows showing "users ask about ItemId X price → MegaBot fires" → 1 LongTermMemory row capturing the pattern
- Crystallizes knowledge: deduplicates · filters noise · preserves provenance via citation array
- LongTermMemory rows survive forever (no TTL · only manual archive)
- Confidence scores update as new evidence arrives (Bayesian-style update · evidence count + recency weighting)

**Cylinder anchor:** 9.1 CMD-SYLVIA-LTM-FOUNDATION V18 (Prisma model + migration · ~30-45 min) → 9.2 CMD-SYLVIA-STM-LTM-CONSOLIDATION-ETL V18 (cron + ETL logic · ~60-90 min).

## §7 · Episodic Memory · timeline · cause-effect chains

**Substrate:** extends existing `prisma model EventLog` (15 fields · indexed `itemId + userId`) + NEW `EpisodicEvent` Prisma model (Appendix C).

**Brain analog:** hippocampus + temporal cortex (what-happened-when-why · personal history · autobiographical memory).

**Current state:** 🟡 Partial. `EventLog` rows scattered across `app/api/**` callers. Item lifecycle events (`DRAFT → ANALYZED → READY → LISTED → ...`) are episodic but not framed as such — there's no `triggeredBy` field linking events into causal chains.

**Target state (Phase 9.x):**
- New `EpisodicEvent` model with explicit cause-effect linkage (`triggeredBy` referencing prior event id · `outcomeOf` referencing subsequent event id)
- Timeline reconstruction queries: "what led to item X being SOLD?" → walks `triggeredBy` chain backward
- Backfill from existing EventLog rows (Cylinder 9.4 · idempotent dedupe via `eventType + occurredAt + itemId` composite key)
- Per-item episodic chains support investor-grade audit: "show every event that touched this $5K antique sale, in order, with cause-effect annotations"
- Future: Phase 7 NotebookLM Dossier consumes episodic chains as primary input

**Cylinder anchors:** 9.3 EPISODIC-FOUNDATION → 9.4 EPISODIC-INGEST-FROM-EVENTLOG → 9.9 CAUSE-EFFECT-CHAIN.

## §8 · Semantic Memory · knowledge graph · entity relationships

**Substrate:** NEW `SemanticEntity` + `SemanticRelation` Prisma models (Appendix C).

**Brain analog:** temporal lobe (what-things-mean · entity meaning · category structure · taxonomic knowledge).

**Current state:** 🟡 Partial. Skill packs encode procedural knowledge but not declarative semantic graph. ScraperComp accumulates entity data (items + prices + platforms) but isn't yet graph-shaped.

**Target state (Phase 9.x):**
- `SemanticEntity` rows: items · users · platforms · price-bands · time-periods · categories · brands · models
- `SemanticRelation` rows: this-IS-that · this-CAUSES-that · this-WORTH-that-IN-context · this-SOLD-IN-platform
- Confidence scores per relationship (extracted from MegaBot 4-AI consensus disagreement signals — when 4 models agree, confidence high; when they disagree, confidence reflects the variance)
- Phase 5 Cyl 7D scrape pipeline activation feeds the data flywheel · ScraperComp rows ingest into SemanticEntity over time
- Investor moat: "Legacy-Loop knows that 1980s Le Creuset is worth $X in Maine but $Y in Boston · because we have the graph and the provenance"

**Cylinder anchors:** 9.5 SEMANTIC-FOUNDATION → 9.6 SEMANTIC-INGEST-FROM-SCRAPERCOMP (gates on Phase 5 7D close).

## §9 · Procedural Memory · skills (Phase 3 SSA formalizes)

**Substrate:** `lib/bots/skills/` · 239 files · 2.5MB · 15 subdirs (per `docs/SYLVIA_SKILLS_ARCHITECTURE_AUDIT.md` `66ace5c`).

**Brain analog:** basal ganglia + cerebellum (how-to-do-things · procedural · automatic · learned-by-repetition).

**Current state:** ✅ canonical loader at `lib/bots/skill-loader.ts` (215 lines · 3 exports) · 13 of 15 surfaces wired via `loadSkillPack` · F1 ENGINE DOCTRINE (CLAUDE.md §7) prohibits the inline-prompt anti-pattern. AnalyzeBot + PhotoBot lack own-route `loadSkillPack` imports · Phase 3.10 + 3.11 prereq verification banked.

**Target state (Phase 3 SSA migration · cylinders 3.1–3.14):**
- `lib/sylvia/skills/<bot>/SKILL.md` (frontmatter + body · canonical contract · auto-loaded by intent)
- `lib/sylvia/skills/<bot>/data/` (CSV/JSON reference · e.g., antique-eras.csv · vehicle-VIN-decoders.json)
- `lib/sylvia/skills/<bot>/examples/` (few-shot demonstrations · narrow-domain quality lift)
- `lib/sylvia/skills/<bot>/helper.ts` (deterministic preprocessing · TypeScript parity for Anthropic SSA `script.py` slot)

This is Phase 3 work · separate from Phase 9. Phase 9 inherits the structure post-migration. Phase 9 may add semantic-relation extraction directly from `SKILL.md` frontmatter (skill → entity) but does not modify Phase 3's loader contract.

**Cylinder anchor:** Phase 3 entry is `CMD-SYLVIA-SKILLS-FOUNDATION V18` (cyl 3.1 · ~75 min · per Phase 3 anchor doc).

## §10 · Pattern Engine + Self-Introspection Loops

**Substrate:** NEW · extends `lib/megabot/run-specialized.ts` (4-AI consensus partial substrate).

**Brain analog:** distributed · default mode network — the brain when "idle" · pattern extraction · imagination · self-reflection. Not localized; emerges from cross-region activity.

**Current state:** 🟡 Partial. MegaBot 4-AI consensus extracts disagreement signals (which feeds confidence scoring) but doesn't auto-update history or generate hypotheses or introspect.

**Target state (Phase 9.x):**
- Continuous pattern extraction on EventLog (Cylinder 9.7) — async worker scans recent events for repeated sequences
- Auto-hypothesis generation: e.g., "users who scan vintage Le Creuset also scan vintage Pyrex within 7 days · suggest cross-sell" → emits to LongTermMemory with confidence + evidence count
- Auto-history-update: LongTermMemory rows get amended when new contradicting evidence arrives · provenance trail preserved (citation-array append, never mutate)
- Introspection loop (Cylinder 9.8): periodic self-evaluation · "what am I getting wrong" · "what patterns am I missing" · gates on read-only audit OR write-permission to amend LTM (open question §14)

**Differentiator:** this is the 7th memory system that chatbot-derived AI has NO equivalent of. ChatGPT Memory, Claude context window, Gemini long-context — all are passive recall mechanisms. The pattern engine + introspection loop is *active* learning across sessions.

**Cylinder anchors:** 9.7 PATTERN-ENGINE-FOUNDATION → 9.8 INTROSPECTION-LOOP.

## §11 · Migration Path · Phases 3–9

| Phase | Focus | Cylinder count | Status |
|---|---|---|---|
| 3 | Procedural memory · SSA migration | 14 cyls (3.1–3.14 · per `docs/SYLVIA_SKILLS_ARCHITECTURE_AUDIT.md`) | next-up |
| 4 | Per-bot V12 upgrades · Sylvia + Skills + Perplexity per-bot | ~11 cyls (one per bot) | post-Phase-3 |
| 5 | Cyl 7 epic closure · scrape pipeline · 100-item milestone · investor intros | 7D–7G (3–4 cyls + CEO-side n8n GUI) | parallel |
| 6 | Investor track · Pam-led · Exec Summary I2 + ToS + Pitch deck Moat #1 keystone | ~5 cyls (parallel surface) | parallel · post-100-item |
| 7 | NotebookLM Dossier launch | 4 seeds compose · per-item PDF dossier | post-100-item-milestone |
| 8 | Manus AI autonomous selling ("Holy Grail") | 4 seeds compose · n8n + Playwright closes loop | post-NotebookLM |
| **9** | **Sylvia Cognitive Architecture · brain-modeled** | **~12-15 cyls (this audit anchors)** | **post-Manus · destination** |

**Phase 9 cylinders (Appendix D · subject to refinement):**
- 9.1 LTM-FOUNDATION
- 9.2 STM-LTM-CONSOLIDATION-ETL
- 9.3 EPISODIC-FOUNDATION
- 9.4 EPISODIC-INGEST-FROM-EVENTLOG
- 9.5 SEMANTIC-FOUNDATION
- 9.6 SEMANTIC-INGEST-FROM-SCRAPERCOMP
- 9.7 PATTERN-ENGINE-FOUNDATION
- 9.8 INTROSPECTION-LOOP
- 9.9 CAUSE-EFFECT-CHAIN
- 9.10 RECALL-API
- 9.11 COGNITIVE-DASHBOARD
- 9.12 RETIRE-OLD-MEMORY

## §12 · Investor Narrative · "Anthropic-grade Cognitive Architecture"

(Drafted · Pam refines for Round 14+ exec summary):

> Legacy-Loop's bot architecture mirrors the canonical pattern Anthropic uses internally for agent skills (SSA · Phase 3 anchor doc shipped at `66ace5c`). Sylvia's cognitive architecture goes further: 7 brain memory systems modeled explicitly · STM/LTM consolidation via nightly ETL · semantic knowledge graph · pattern engine · self-introspection loop. Pure file-system + Prisma schema · zero LangChain · zero vendor lock-in · zero direct AI provider SDK dependency (LiteLLM Gateway egress per BINDING #10 DOC-TELEMETRY-LOCK). The moat compounds physically with every interaction · every scan · every consolidation tick. Brain-modeled AI · billion-dollar destination.

**Compounding angle:** every new SylviaMemory row consolidates into LongTermMemory · every EventLog row chains into EpisodicEvent · every ScraperComp row ingests into SemanticEntity. Three persistent compounding loops. Competitors can replicate the LLM · they cannot replicate the moat without running our flywheel for the same time we have.

## §13 · Risk Surfaces

1. **SSA pattern drift (Phase 3)** — monitored by audit doc `66ace5c` · banks `DOC-SSA-SPEC-PARITY` candidate · Phase 9 inherits Phase 3's loader contract so any drift propagates.
2. **Schema migration coordination** — per-worktree dev.db isolation requires explicit per-worktree `prisma db push` after Phase 9 schema additions · already documented in `docs/MULTI_AGENT_WORKTREE.md`.
3. **Compute cost** — pattern engine + introspection loops are expensive · gates on cloud-fallback policy decision · banks `DOC-COGNITIVE-COMPUTE-BUDGET-POLICY` candidate.
4. **Implementation timing** — building too early (before Phase 5 scrape volume + Phase 8 Manus closes feedback loop) wastes infrastructure · Phase 9 explicitly post-Manus.
5. **Scope discipline** — Phase 9 has 12+ cylinders · easy to scope-creep · banks `DOC-COGNITIVE-PHASE-CYLINDER-CAP` candidate.
6. **SSA spec drift** — if Anthropic publishes update during Phase 3 migration · banks `DOC-SSA-SPEC-PARITY` (R13 P3 ratification context still applies).
7. **Pattern engine false positives** — auto-hypothesis generation can mislead if not gated by confidence threshold + provenance citations · introspection loop must include error-detection.
8. **Investor expectation management** — "billion-dollar level" must NOT equal "100% feature complete day 1" · narrative discipline matters.

## §14 · Open Questions for CEO

1. **Phase 9 timing:** post-Manus (Phase 8) IS the trigger · OR sooner if scrape volume + 100-item milestone hit before Manus?
2. **Pattern engine compute budget:** cloud (Anthropic / OpenAI / Gemini) vs local (Ollama qwen-coder) for nightly ETL · cost vs latency tradeoff?
3. **LongTermMemory retention:** forever-keep · OR ratification-archive after N years · OR confidence-decay-driven prune?
4. **Knowledge graph external surfacing:** investor-facing dashboard tile · OR internal-only Phase 9 with optional reveal?
5. **Procedural memory boundary with Phase 3 SSA:** are SKILL.md files semantic OR procedural by default? (Likely procedural · semantic relations live in graph models · but skills *contain* declarative knowledge that could populate semantic graph.)
6. **Self-introspection loop authority:** read-only audit OR write-permission to amend LongTermMemory? Latter is more powerful but raises provenance + audit-trail discipline bar.
7. **Investor narrative timing:** pitch deck rewrite for Phase 9 → post-Manus OR earlier (post-100-item) when pattern compounding is empirically demonstrable?

---

## Appendix A · Cognitive Science Citations

Academic anchors for the 7-memory-system framework:

- **Tulving, E. (1972).** *"Episodic and semantic memory."* In E. Tulving and W. Donaldson, eds., *Organization of Memory*, 381–403. Academic Press. — episodic vs semantic distinction · foundational.
- **Squire, L.R. (1992).** *"Memory and the hippocampus: a synthesis from findings with rats, monkeys, and humans."* *Psychological Review*, 99(2), 195–231. — hippocampus + cortex consolidation (load-bearing for §6 LTM).
- **Baddeley, A.D. (2000).** *"The episodic buffer: a new component of working memory?"* *Trends in Cognitive Sciences*, 4(11), 417–423. — working memory model (§4).
- **Anderson, J.R. (1976).** *Language, Memory, and Thought*. Lawrence Erlbaum. — procedural vs declarative distinction (§9).
- **Schacter, D.L., & Tulving, E. (1994).** *Memory Systems 1994*. MIT Press. — multi-system memory framework consolidation.

These are the load-bearing citations for the framework. Doc body cites informally where context demands brevity. Phase 9 entry cylinders should re-cite when introducing each memory layer.

## Appendix B · Existing AI Systems Comparison

(Public docs only · zero internal-system speculation):

| System | Working memory | STM | LTM | Episodic | Semantic | Procedural | Pattern engine |
|---|---|---|---|---|---|---|---|
| Anthropic Claude | context window (200K · 1M tier) | none persistent | none persistent | none persistent | training corpus | training corpus | training-time only |
| OpenAI GPT-4 + Memory feature | context window | "Memory" feature (recent · per-thread) | none persistent | none persistent | training corpus | training corpus | training-time only |
| Google Gemini Long Context | context window (1M+) | none persistent | none persistent | none persistent | training corpus | training corpus | training-time only |
| Anthropic Agent Skills (SSA) | per-call context | none | none | none | (skill content semantic-adjacent) | ✅ SKILL.md per skill | none |
| **Legacy-Loop Sylvia (target)** | ✅ Brain Stem session-scoped | ✅ SylviaMemory TTL+attention | ✅ NEW · nightly consolidation | ✅ NEW · cause-effect chains | ✅ NEW · knowledge graph | ✅ Phase 3 SSA-formalized | ✅ NEW · continuous + introspection |

**Legacy-Loop's differentiator:** 7-of-7 systems modeled explicitly · runtime-mutable · provenance-tracked · investor moat compounds with usage. Public LLM systems retrain to update; Legacy-Loop updates continuously without retraining.

## Appendix C · Prisma Schema Drafts

(NOT migration-applied · serves as reference for Phase 9.x cylinders · refined in subsequent specs):

```prisma
model LongTermMemory {
  id             String   @id @default(cuid())
  pattern        String   // crystallized pattern identifier (e.g., "user-X-asks-price-Y")
  description    String   // human-readable summary
  evidenceCount  Int      @default(1)
  firstSeenAt    DateTime
  lastSeenAt     DateTime @default(now())
  confidence     Float    // 0-1 · weighted by evidence count + recency
  provenanceJson String   // JSON-stringified citation array
  sourceIds      String   // JSON-stringified SylviaMemory.id[] (sources collapsed via consolidation ETL)

  @@index([pattern])
  @@index([lastSeenAt])
}

model EpisodicEvent {
  id          String   @id @default(cuid())
  itemId      String?  // optional · per-item episodic chains
  userId      String?  // optional · per-user episodic chains
  eventType   String   // matches EventLog.eventType vocabulary
  triggeredBy String?  // prior EpisodicEvent.id · cause-effect chain
  outcomeOf   String?  // subsequent EpisodicEvent.id · effect-cause chain
  payload     String?  // JSON
  occurredAt  DateTime @default(now())

  @@index([itemId, occurredAt])
  @@index([userId, occurredAt])
  @@index([triggeredBy])
}

model SemanticEntity {
  id           String   @id @default(cuid())
  type         String   // "item" · "user" · "platform" · "price-band" · "category" · "brand"
  externalId   String?  // foreign reference (e.g., Item.id · ScraperComp.id)
  metadataJson String?  // JSON-stringified attributes
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  @@unique([type, externalId])
  @@index([type])
}

model SemanticRelation {
  id            String   @id @default(cuid())
  fromEntityId  String
  toEntityId    String
  relationType  String   // "IS" · "CAUSES" · "WORTH" · "SOLD-IN" · "PRICED-AT"
  confidence    Float    // 0-1 · derived from MegaBot 4-AI disagreement
  evidenceCount Int      @default(1)
  metadataJson  String?  // JSON
  firstSeenAt   DateTime @default(now())
  lastSeenAt    DateTime @default(now())

  @@unique([fromEntityId, toEntityId, relationType])
  @@index([fromEntityId, relationType])
  @@index([relationType, confidence])
}
```

**Notes:**
- All models intentionally minimize foreign-key constraints in favor of String references → preserves cross-database flexibility (SQLite dev · LibSQL/Turso prod) and supports future graph-database migration without schema rewrite.
- `provenanceJson` and `sourceIds` use JSON-stringified arrays (LibSQL-friendly · honors BINDING #6 DEV/PROD parity).
- Confidence stored as `Float` 0–1 fractional (per BINDING #14 DOC-CONFIDENCE-SCALE-NORMALIZE · fractional canonical · `lib/utils/confidence-scale.ts` helpers apply).

## Appendix D · Phase 9 Cylinder Breakdown (proposed · refined in subsequent specs)

| # | Cylinder | Estimate | Dependency |
|---|---|---|---|
| 9.1 | CMD-SYLVIA-LTM-FOUNDATION V18 | ~30-45 min | none (Phase 9 entry) |
| 9.2 | CMD-SYLVIA-STM-LTM-CONSOLIDATION-ETL V18 | ~60-90 min | 9.1 |
| 9.3 | CMD-SYLVIA-EPISODIC-FOUNDATION V18 | ~30-45 min | 9.1 |
| 9.4 | CMD-SYLVIA-EPISODIC-INGEST-FROM-EVENTLOG V18 | ~45-60 min | 9.3 |
| 9.5 | CMD-SYLVIA-SEMANTIC-FOUNDATION V18 | ~45-60 min | 9.1 |
| 9.6 | CMD-SYLVIA-SEMANTIC-INGEST-FROM-SCRAPERCOMP V18 | ~60-90 min | 9.5 + Phase 5 7D |
| 9.7 | CMD-SYLVIA-PATTERN-ENGINE-FOUNDATION V18 | ~75-90 min | 9.4 + 9.6 |
| 9.8 | CMD-SYLVIA-INTROSPECTION-LOOP V18 | ~60-90 min | 9.7 |
| 9.9 | CMD-SYLVIA-CAUSE-EFFECT-CHAIN V18 | ~45-60 min | 9.4 |
| 9.10 | CMD-SYLVIA-RECALL-API V18 | ~60-90 min | 9.1–9.6 |
| 9.11 | CMD-SYLVIA-COGNITIVE-DASHBOARD V18 | ~75-90 min | 9.10 |
| 9.12 | CMD-SYLVIA-COGNITIVE-RETIRE-OLD-MEMORY V18 | ~30-45 min | all consumers swapped to 9.10 |

**Total:** 12 cylinders · ~10-12 hours IT cumulative · spread across Phase 9 window (post-Manus). Worktree parallelism (per `docs/MULTI_AGENT_WORKTREE.md`) reduces wall-clock to ~6–8 hours via 3-agent fan-out where dependencies allow (9.3+9.5 parallel after 9.1 lands · 9.4+9.6 parallel after their foundations · etc).

## Appendix E · Cross-Doctrine Alignment Map

How Phase 9 cognitive architecture compounds with existing BINDING doctrines (per `docs/DOCTRINE_LEDGER.md` · 274 lines · canonical state at HEAD `ba7239d`):

| Doctrine | Phase 9 application | Risk if ignored |
|---|---|---|
| BINDING #4 DOC-MEASURE-BEFORE-PROMISE | every Phase 9 cylinder cites measured baseline (SylviaMemory row count · EventLog row count · ETL throughput) before claiming pattern crystallization | speculation drift · investor narrative collapses |
| BINDING #5 DOC-PRE-STAGE-NON-IDP-PREFETCH | every Phase 9 cylinder pre-stages existence checks on target Prisma models + helper paths | NEW spec promises file/model that already exists or conflicts |
| BINDING #6 DOC-DEV-PROD-DB-ISOLATION | LongTermMemory + EpisodicEvent + SemanticEntity migrations honor `lib/db.ts` 4-rule guard · per-worktree dev.db isolation enforced | bleed risk into prod Turso during dev migrations |
| BINDING #7 DOC-SPEC-GROUNDING-VERIFY | runtime catches enforced (e.g., relation name verification via Prisma client introspection before Phase 9.6 SemanticEntity ingest) | runtime tsc/build failures land in prod via Vercel |
| BINDING #8 DOC-PARALLEL-FILE-COLLISION-CHECK | Phase 9 worktree fan-out (per Appendix D dependency table) requires explicit disjoint surfaces per parallel cylinder | shared-index swap incident (R11/R12 class) |
| BINDING #10 DOC-TELEMETRY-LOCK | pattern engine + introspection loops route through LiteLLM Gateway · zero direct provider SDK · SylviaMemory captures full provenance | cost telemetry breaks · model-swap discipline collapses |
| BINDING #12 DOC-MULTI-AGENT-INDEX-ISOLATION-PRECHECK | Phase 9 cylinders running in parallel use per-worktree git index · cached-diff scope verified pre-commit | foreign pre-staged files enter own commit |
| BINDING #14 DOC-CONFIDENCE-SCALE-NORMALIZE | LongTermMemory.confidence + SemanticRelation.confidence stored as Float 0–1 · `lib/utils/confidence-scale.ts` helpers normalize for UI | confidence drift across surfaces · senior trust win regresses |
| BINDING #15 DOC-EMIT-WITH-PROVENANCE | every LongTermMemory + EpisodicEvent + SemanticEntity row carries provenance citation array · session id · model alias · cost · timestamp | audit trail breaks · investor due-diligence story collapses |
| BINDING #16 DOC-DELEGATE-TO-CANONICAL | Phase 9 introduces `lib/sylvia/cognitive/` namespace · all consumers transit canonical helpers (no re-implementation across bot routes) | fragmentation · BINDING #10 collateral break |
| BINDING #17 DOC-AUDIT-FIRST-WIRE-PATTERN | THIS DOC is the audit · all Phase 9.1–9.12 cylinders cite this doc in §0 grounding · pattern continues per R13 P3 + R14 P1 precedent | architectural drift · destination invisible |
| BINDING #18 DOC-BUILD-MEMORY-BUDGET-CHECK | Phase 9 schema migrations + ETL workers respect Vercel CI gate · Fork B path available when local `next build` hangs | local-build false-negatives mask real prod issues |
| BINDING #19 DOC-PER-AGENT-WORKTREE | Phase 9 fan-out (parallel cylinders per Appendix D) uses per-worktree pattern · Cyl 1 fix verified single-deploy | shared-index race window opens · R11/R12 incident class returns |
| DOC-VERIFY-VERCEL-AFTER-COMMIT (sentinel · likely BINDING on R14 close) | every Phase 9 cylinder cites `dpl_<id>` READY + curl 200 in §12 PASS | claim of closed cylinder without production verification |

Phase 9 entry cylinder (9.1 LTM-FOUNDATION) MUST self-audit against this table in its §6 build harness. Subsequent cylinders inherit · audit lighter.

## Appendix F · Cylinder Dependency Diagram (Phase 9 fan-out)

```
            9.1 LTM-FOUNDATION
                  │
       ┌──────────┼──────────┐
       │          │          │
       ▼          ▼          ▼
   9.2 ETL    9.3 EPI    9.5 SEM
       │       │            │
       │       ▼            ▼
       │   9.4 INGEST   9.6 INGEST
       │       │            │
       │       └─────┬──────┘
       │             ▼
       │       9.7 PATTERN
       │             │
       │       ┌─────┴─────┐
       │       ▼           ▼
       │   9.8 INTRO   9.9 CHAIN
       │       │           │
       └───────┴─────┬─────┘
                     ▼
                 9.10 RECALL-API
                     │
                     ▼
                 9.11 DASHBOARD
                     │
                     ▼
                 9.12 RETIRE-OLD
```

**Critical path:** 9.1 → 9.2 → 9.7 → 9.8 → 9.10 → 9.11 → 9.12 (~7-8h sequential).
**Parallel branches:** {9.3, 9.4, 9.5, 9.6, 9.9} can fan out across agent-{1,2,3} worktrees once their foundations land. Worktree pattern (`docs/MULTI_AGENT_WORKTREE.md`) reduces total wall-clock by ~30-40%.

---

*End of SYLVIA_COGNITIVE_ARCHITECTURE.md*
*Phase 9 destination anchor · Drive on.*
