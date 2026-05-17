# SUPER_BRAIN_STATE.md
## Sylvia Super-Brain · Prebuilt Asset Audit
**Author:** Devin (L1 · Senior Dev Engineer) · audit-only · ZERO code written
**Date:** 2026-05-12 Tue ~17:30 EDT
**Trigger:** CEO directive · "index, audit, prepare to hardwire prebuilt assets into Sylvia AI"
**Doctrine:** F1 surgical · additive-only · audit-first wire pattern (BINDING #17) · push-back authors replacement
**HEAD at audit:** `02577d3` · tsc=0 · build PASS · 287 routes · 53 models · 28 BINDING
**Last Vercel:** `dpl_8d6RuNsWdvtTbAAE1kuB31yF6sfT` READY · `app.legacy-loop.com` curl 200
**Engineering activity:** silent 3 days (Sun 5/10 → Tue 5/12)

---

## §0 · Bottom Line (CEO read first · REVISED post deep-scan)

| Phase | Status | Verdict |
|---|---|---|
| **P1 · Memory + Obsidian Graph** | 🟡 50% PREBUILT | graphify scoped to Sylvia substrate ONLY (14 files · 103 nodes) · MISSED `lib/bots/skill-loader.ts` + `lib/adapters/bot-ai-router/` + `lib/megabot/` + `lib/agents/runner.ts` + `lib/intelligence/generate.ts` + 239 skill files · repo-wide run REQUIRED · claude-mem NOT installed |
| **P2 · Ruflow + 4-AI Consensus** | 🟢 75% PREBUILT | 4-AI Truth Gate has **THREE separate implementations** in repo · Sylvia `dispatcher/` (R24 P0) + MegaBot `run-specialized.ts` (production · runSpecializedMegaBot 4-provider parallel) + agents `runner.ts` (8 bot types · MEGA mode) · `_shared_megabot/04-megabot-consensus-engine.md` skill = canonical agent-merge protocol prebuilt · drift-risk: 3 surfaces doing the same thing |
| **P3 · Tool/Repo/GitHub Injection** | 🟡 35% PREBUILT | caveman ACTIVE · graphify ACTIVE · daemon QUARTET LIVE (`com.legacyloop.ollama` PID 1947 + `com.legacyloop.litellm` PID 1930 via launchctl) · `.env.sylvia` chmod 600 · 5 keys keyed (incl Perplexity `sonar*` aliases routed via LiteLLM) · 15 skill dirs / 239 files / 2.3MB Sylvia procedural memory PREBUILT · CodeBurn MISSING · Firecrawl MISSING · separate Perplexity MCP REDUNDANT (already keyed via Gateway) · GStack scattered |

**Single biggest discovery:** Sylvia's 4-AI Truth Gate dispatcher is already wired at `lib/sylvia/dispatcher/{auth,classify,agreement,budget}.ts` per R24 P0 `CMD-SYLVIA-TRUTH-GATE-DISPATCHER`. Moat #10 is structurally LIVE. Awaits public API at `app/api/sylvia/consensus/route.ts` (already drafted per graphify report `POST()` god-node).

**Single biggest gap:** No collective memory layer — `SylviaMemory` Prisma table exists but is single-table flat. No 7/8 memory-type schema. No nightly STM→LTM consolidation. No semantic recall vector store. Phase 9 of `docs/SYLVIA_COGNITIVE_ARCHITECTURE.md` (a725ef8) blocks on Phase 3 SSA + Phase 7 NotebookLM + Phase 8 Manus.

**Top-3 missing tools (P0 install before next code):** claude-mem · CodeBurn · Firecrawl MCP.

---

## PHASE 1 · MEMORY & OBSIDIAN GRAPH MAPPING

### 1A · Graphify Audit · 🟢 OPERATIONAL

**Prebuilt asset paths:**
- Skill: `/Users/ryanhallee/.claude/skills/graphify/SKILL.md` (full /graphify command surface)
- Skill version pin: `~/.claude/skills/graphify/.graphify_version`
- Repo output dir: `/Users/ryanhallee/legacy-loop-mvp/graphify-out/` (gitignored per `19fc4e8`)
- Generated artifacts in repo:
  - `graphify-out/graph.json` — 103 nodes · 151 edges
  - `graphify-out/graph.html` — interactive viewer
  - `graphify-out/GRAPH_REPORT.md` — community-labeled audit
  - `graphify-out/manifest.json` — file fingerprint for `--update`
  - `graphify-out/cost.json` — cumulative run ledger (2 runs · 0 tokens · all AST)
  - `graphify-out/cache/` — semantic extraction cache
  - `graphify-out/obsidian/` + `graphify-out/obsidian-sylvia/` — vault outputs

**Last run scope:** `lib/sylvia + lib/sylvia-kb + lib/dossier + app/api/sylvia` · 2026-05-09 14:08 UTC · 14 files · 6,778 words

**8 communities labeled (proof system works):**
1. Provider Routing & Cost (19 nodes · cohesion 0.15)
2. Consensus API (15 nodes · 0.16)
3. Memory & Audit (9 nodes · 0.15)
4. Knowledge Base Types (10 nodes · 0.18)
5. Agreement Scoring (10 nodes · 0.27)
6. Budget Tracking (5 nodes · 0.25)
7. Dossier Rendering (6 nodes · 0.25)
8. Stakes Classification (3 nodes · 0.5)

**God nodes (Sylvia core abstractions surfaced):** `triageAndRoute()` · `POST()` · `pairwiseScore()` · `BudgetTracker` · `rolloverIfNeeded()` · `decide()` · `recordTriage()` · `classifyStakes()` · `verifySylviaInternalSecret()` · `classifyComplexity()`

**What's missing to wire graphify INTO Sylvia (vs onto Claude Code):**
1. **MCP exposure flag never run.** `/graphify <path> --mcp` would start stdio MCP server exposing `query_graph`, `get_node`, `get_neighbors`, `shortest_path` etc. Sylvia's Open WebUI needs MCP config block pointed at `~/.graphify` graph.
2. **Repo-wide graph never built.** Only Sylvia substrate (14 files) indexed. Full Legacy-Loop = 287 routes + 53 models + ~9000 LOC `ItemDashboardPanels.tsx` + landing repo + downloads/skills corpus. Estimated 800-2000 nodes.
3. **No git-commit hook installed.** `graphify hook install` would auto-rebuild on every commit. Currently rebuilds on-demand only.
4. **No CLAUDE.md auto-on integration.** `graphify claude install` would inject persistent "/graphify check the graph before answering codebase questions" instruction.
5. **No cross-repo merge run.** Landing repo at `~/Desktop/legacy-loop-landing` is a separate corpus. `graphify merge-graphs` would unify.

### 1B · Claude-Mem Audit · 🔴 NOT INSTALLED

**Search performed:** `find ~/.claude /Users/ryanhallee/legacy-loop-mvp -name "*claude-mem*" -o -name "*claudemem*"`
**Result:** zero matches anywhere.

**What we DO have for memory:**
- `SylviaMemory` Prisma table (single flat table · `lib/sylvia/memory.ts` writes via `recordTriage()`)
- Persistent auto-memory at `~/.claude/projects/-Users-ryanhallee-legacy-loop-mvp/memory/` (60+ files · two-tier index + topic files · already structured per Section 1 of `Claude_Setup_Patterns_for_Sylvia_2026-05-08.md`)
- `lib/sylvia/memory-types.ts` (forward-compat type contracts)

**Gap:** No bug-fix / architectural-decision compressor. No "observation" type. No token-saving recall via embedding. Current `SylviaMemory.recallSimilar()` uses `promptHash` exact match — not semantic.

**Hardwire requirements (banked for IT, not this audit):**
- Install claude-mem CLI (per `ruvnet/claude-mem` or equivalent)
- Map its observation schema onto `SylviaMemory` (additive `kind` column with values `decision | bug-fix | pattern | preference`)
- Add SessionStart hook: `claude-mem export → Sylvia.recordTriage(kind:"compressed_observation")`

### 1C · Obsidian Vault State · 🟢 LIVE

**Prebuilt:**
- `graphify-out/obsidian-sylvia/` — last run vault for Sylvia substrate
- `graphify-out/obsidian/` — earlier general run
- CEO has personal Obsidian vault (Downloads/skills/* tree organized as one)

**Verdict:** Obsidian orientation works via the generated vault. Each god node has its own MD file with backlinks. Drop the directory into Obsidian → instant navigable graph.

### 1D · Connection-to-Open-WebUI gap

Sylvia AI substrate (`lib/sylvia/*`) routes via LiteLLM Gateway at `http://localhost:8000`. Open WebUI runs locally. Current path:

```
User → Open WebUI → ??? → triageAndRoute() → LiteLLM Gateway → providers
```

**The "???" is the missing layer.** No `app/api/sylvia/triage/route.ts` exposes the router to Open WebUI yet. R25 P6 `LITELLM-GATEWAY-EXPOSE` is banked for this exact gap — it's the API surface Open WebUI hits.

**P0 BLOCKER for Phase 1 close:** LITELLM gateway is `localhost:8000` only → on Vercel deploys ECONNREFUSED (open Slack flag). Either (a) public LiteLLM endpoint OR (b) Vercel reads provider keys direct + skips gateway in production. Architectural decision needed before Sylvia → Open WebUI is real.

---

## PHASE 2 · RUFLOW & 4-AI CONSENSUS MAPPING

### 2A · 4-AI Truth Gate Dispatcher · 🟢 LIVE (R24 P0)

**This is the biggest unsurfaced win.** Already shipped:

| File | Purpose | LOC est |
|---|---|---|
| `lib/sylvia/dispatcher/auth.ts` | `verifySylviaInternalSecret()` HMAC gate | small |
| `lib/sylvia/dispatcher/classify.ts` | `classifyStakes()` + `preflightStakes()` — low/high stakes gate | small |
| `lib/sylvia/dispatcher/agreement.ts` | `computeAgreement()` · pairwise Jaccard + numeric-extract similarity · 0-100 score · degraded flag | medium |
| `lib/sylvia/dispatcher/budget.ts` | `BudgetTracker` · `rolloverIfNeeded()` · `DEFAULT_DAILY_USD` cap | medium |
| `lib/sylvia/dispatcher/index.ts` | Public barrel re-exports | tiny |
| `app/api/sylvia/consensus/route.ts` | `POST()` god-node (10 edges) · receives `ConsensusRequest` · returns `ProvenanceEntry[]` + `errorEnvelope()` | medium-large |

**4-provider QUARTET wired:** `ProviderAlias` type includes Claude-Haiku-4-5 · GPT-4o-mini · Gemini-2.5-Flash · Grok-4 (per `triage-router.ts` cost map).

**What works structurally:**
- `classifyStakes()` routes low-stakes → single agent · high-stakes → 4-way dispatch
- `computeAgreement()` produces `score: 0-100` + `degraded: boolean` (auto-degrade if <2 providers respond)
- `BudgetTracker` enforces per-call $0.05 + per-session $1.00 + daily $20.00 caps (BINDING #25 DOC-VERCEL-BUDGET-CAP-20)
- HMAC-signed internal calls only (Moat security)

**Gaps before Truth Gate is INVESTOR-DEMO-READY:**
1. **Agreement is heuristic, not embedding-based.** Banked R25+ upgrade per `agreement.ts` header comment: "Improvable in R25+ via embedding similarity"
2. **No provenance citation enforcement.** `defaultProvenance()` exists in route but no per-provider provenance tag (real-time / memory / training / inferred) per Moat #7
3. **No public smoke test.** R25 P8 Sylvia consensus smoke v2 banked
4. **No UI badge** ("Verified by 4 AIs · 91%") — Sylvia Open WebUI rendering layer not yet wired
5. **5 INFERRED edges in graphify report** flag uncertainty: `POST→classifyStakes`, `POST→computeAgreement`, `callProvider→triageAndRoute`, `POST→verifySylviaInternalSecret`, `classifyStakes→triageAndRoute`. None AMBIGUOUS — all reasonable inference. Verify by reading `app/api/sylvia/consensus/route.ts` post-audit.

### 2B · Ruflow / claude-flow / Queen→Worker · 🔴 NOT INSTALLED

**Search performed:** `find ~/.claude /Users/ryanhallee/legacy-loop-mvp -iname "*ruflo*" -o -iname "*claude-flow*" -o -iname "*ruvnet*"`
**Result:** zero matches.

**What we DO have for orchestration:**
- Multi-agent worktree pattern (BINDING #20 DOC-PER-AGENT-WORKTREE) — peer-level (Devin/MC/Pam/Claude-Code/Jarvis), NOT vertical
- `scripts/agent-ship.sh` · `scripts/worktree-setup.sh` · `scripts/worktree-reset.sh` — handoff infrastructure
- `triageAndRoute()` is a **single-level dispatcher** — picks model, doesn't decompose tasks into specialists

**Architectural decision required before install:**

| Option | Pros | Cons |
|---|---|---|
| **A · Install Ruflo as-is** (`ruvnet/ruflo` 31,100★ · MCP exposure) | Battle-tested · 60+ agents free · 84.8% SWE-Bench claimed · ~75-80% token reduction claimed | Foreign abstraction · doesn't honor BINDING #10 DOC-TELEMETRY-LOCK (all AI calls must go via LiteLLM Gateway) · Queens spawn agents outside our chokepoint |
| **B · Custom Sylvia Queens** built on `triageAndRoute()` | Honors DOC-TELEMETRY-LOCK · honors §12 report discipline · honors LiteLLM Gateway egress · stays in F1 doctrine | Reinvent the wheel · 4-6 weeks of build · no community library |
| **C · Ruflo behind Gateway adapter** | Get the 60+ specialists · force all egress through LiteLLM | Adapter complexity · still need provenance + §12 hooks |

**Recommendation:** Option C — Ruflo for the Queen→Worker scaffolding only, with a Sylvia adapter that routes every Worker LLM call through `triageAndRoute()`. Telemetry preserved. 5b moat achieved without reinventing.

**Pre-install gate (REQUIRED before CEO approves):**
1. Read `ruvnet/ruflo` SOURCE — verify it accepts a custom provider adapter
2. Verify it composes with our `BudgetTracker` (cost cap per task)
3. Verify it can emit our §12 report shape at task close
4. Confirm it doesn't try to write its own memory layer (would conflict with `SylviaMemory`)

If any of those fail → fall back to Option B (custom build, R26+ epic).

### 2C · Cognitive Architecture (7 memory systems) · 🟡 ANCHOR-DOC EXISTS · NOT BUILT

**Prebuilt:** `docs/SYLVIA_COGNITIVE_ARCHITECTURE.md` (a725ef8 · 397 LOC · 14 sections + 6 appendices) — full 7-memory-system specification mapped to academic literature (Tulving · Squire · Baddeley · Anderson · Schacter-Tulving)

**Current implementation status per anchor doc §2:**

| Memory System | State | Where |
|---|---|---|
| 1. Working Memory | ✅ LIVE | Sylvia Brain Stem 8/8 consumers · BINDING #17 |
| 2. Short-term Memory | ✅ LIVE | `SylviaMemory` Prisma table |
| 3. Long-term Memory | ⏸ Phase 9 | Nightly STM→LTM consolidation cron · NOT built |
| 4. Episodic Memory | 🟡 Partial | `EventLog` scattered · needs unification |
| 5. Semantic Memory | 🟡 Partial | Skill packs + `ScraperComp` future |
| 6. Procedural Memory | ✅ LIVE | Skill loaders · skill packs (SSA migration formalizes Phase 3) |
| 7. Pattern Engine + Self-Update | 🟡 Partial | MegaBot consensus partial · unified engine NOT built |

**Phase 9 cylinder breakdown:** 12 cylinders · ~9hrs IT work · POST-Manus-AI-Phase-8-launch. Gates on Phase 3 SSA + Phase 7 NotebookLM + Phase 8 Manus. **DO NOT pull forward.**

---

## PHASE 3 · TOOL, REPO & GITHUB ASSET INJECTION

### 3A · Cost Discipline Tools

| Tool | Status | Path / Source |
|---|---|---|
| **Caveman** | 🟢 ACTIVE (full mode) | `~/.claude/plugins/cache/caveman/caveman/ef6050c5e184/` · enabled in `~/.claude/settings.json` · `caveman@caveman` plugin installed 2026-05-08 · `~/.claude/.caveman-active` flag set · MCP server `caveman-shrink` registered |
| **CodeBurn** | 🔴 NOT INSTALLED | No matches in `~/.claude` or repo. Token usage tracking is per-Claude-Code-session only via `caveman:caveman-stats` skill. |
| **/caveman skills** | 🟢 LOADED | `caveman` · `caveman-commit` · `caveman-review` · `caveman-stats` · `caveman-help` · `cavecrew` (delegation guide) · `compress` · `cavecrew-investigator` · `cavecrew-builder` · `cavecrew-reviewer` |

**CodeBurn gap:** No per-task token meter visible. Anthropic prompt caching (5-min TTL) status not surfaced. Per-skill budget enforcement only via `triageAndRoute()` per-call ceiling — global view missing.

**P1 recommended install:** CodeBurn (or equivalent) to surface cost/turn in Sylvia UI · maps to Moat #2 from `Claude_Setup_Patterns_for_Sylvia_2026-05-08.md`.

### 3B · MCP Server Inventory

**Currently connected (enumerated via deferred-tool registry):**

| Server | Status | Purpose |
|---|---|---|
| **Gmail** (`0f59b40c-...`) | 🟢 | Drafts · labels · threads |
| **Slack** (`e567c92d-...`) | 🟢 | Read channels · search · messaging (used today) |
| **Google Calendar** (`ef77b5f2-...`) | 🟢 | List/create/update events |
| **Vercel** (`5b21325d-...`) | 🟢 | Deployments · logs · projects (BINDING #21 verifier) |
| **Computer-use** (`computer-use`) | 🟢 | Desktop control · request_access required |
| **Claude-in-Chrome** | 🟢 | DOM-aware browser actions |
| **Webflow** (`aefa9228-...`) | 🟢 | Landing page edits (CEO-gated tier-3) |
| **Box** (`b019ee89-...`) | 🟢 | File storage |
| **Canva** (`fe38fcd1-...`) | 🟢 | Design generation |
| **pdf-viewer** (plugin) | 🟢 | PDF render + annotate (just loaded) |
| **ccd_session** (transcript search) | 🟢 | Session mgmt |
| **mcp-registry** | 🟢 | Discover connectors |
| **scheduled-tasks** | 🟢 | Cron-style task scheduler |
| **caveman-shrink** | 🟢 | Output compression |
| **Apify** | ⚠ Partial | Apify console wiring documented in `Tonight_IT_Build_Plan_2026-05-07.md` Wave B · 21 actors Tier 1-3 ready for greenlight |

**MISSING (P1 install per Phase 3 task):**

| Tool | Use | Install path |
|---|---|---|
| **PerplexityMCP** | Live internet for high-stakes citations · Moat #7 provenance | Anthropic MCP registry or `modelcontextprotocol/servers` |
| **Firecrawl MCP** | Website crawling for RAG · feeds Sylvia KB (Moat #11) post-PIVOT | `firecrawl/firecrawl-mcp-server` |
| **Playwright MCP** | Browser automation · Phase 8 Manus marketplace credential flows | In marketplaces cache at `~/.claude/plugins/marketplaces/claude-plugins-official/external_plugins/playwright/` BUT NOT ENABLED |

**Quick win:** Playwright is already on disk — just needs enable in `~/.claude/settings.json`. Adds zero install time.

**Already-routed-via-Sylvia (per `Claude_Setup_Patterns_for_Sylvia_2026-05-08.md` §12):** Stripe · SendGrid · Shippo · ShipStation · Cloudinary · n8n droplet — these are Legacy-Loop production integrations, accessible from Sylvia via the existing API surface (not separate MCPs).

### 3C · GStack (CEO/Designer/EM/QA Roles)

**Hunt result:** Executive personas exist scattered in `/Users/ryanhallee/Downloads/skills/` but NOT loaded as Claude skills.

| Role | Path | Status |
|---|---|---|
| Business strategist | `Downloads/skills/business-strategist/` | 📂 on disk · NOT symlinked to `~/.claude/skills/` |
| CTO / Lead Engineer | `Downloads/skills/cto-lead-engineer/` | 📂 on disk · NOT loaded |
| COO / Operations | `Downloads/skills/coo-operations/` | 📂 on disk · NOT loaded |
| CMO / Marketing | `Downloads/skills/cmo-marketing-director/` | 📂 on disk · NOT loaded |
| HR / People Ops | `Downloads/skills/hr-people-ops/` | 📂 on disk · NOT loaded |
| Legal Counsel | `Downloads/skills/legal-counsel/` | 📂 on disk · NOT loaded |
| Executive Assistant | `Downloads/skills/executive-assistant/` | 📂 on disk · NOT loaded |
| Research Assistant | `Downloads/skills/research-assistant/` | 📂 on disk · NOT loaded |
| Meeting Prep | `Downloads/skills/meeting-prep/` | 📂 on disk · NOT loaded |
| Morning Briefing | `Downloads/skills/morning-briefing/` | 📂 on disk · NOT loaded · DUPLICATE of `~/.claude/skills/legacyloop-morning-brief/` |

**Already-loaded skills (`~/.claude/skills/`):**
- `graphify` (symlinked from Downloads · 🟢)
- `huashu-design` (🟢)
- `legacyloop-company-context` (symlinked · 🟢)
- `legacyloop-morning-brief` (🟢)
- `skill-creator` (symlinked · 🟢)

**Decision pending:** Are GStack roles for Sylvia (programmatic agents inside the Truth Gate swarm) OR for Claude Code session use (slash-command personas)? Different install paths:

- **Sylvia agents:** Each becomes a Worker in the Queen→Worker swarm (Phase 2 install · gates on Ruflo decision)
- **Claude Code personas:** Symlink each into `~/.claude/skills/` + add SKILL.md frontmatter

**Push-back:** None of these GStack folders has been read or validated for current relevance. Some were authored Apr 12 · pre-V19 doctrine · pre-28-BINDING ledger. **MUST audit content before loading** — risk of contradicting current canon. Per BINDING #16 DOC-DELEGATE-TO-CANONICAL: skill packs outrank inline rules, so a stale skill = stale doctrine pinned to disk.

### 3D · Strict Execution Order (banked for CEO greenlight)

**Pre-condition gates (NONE may be skipped):**

1. **CEO approval per item below before any install**
2. **R25 P6 LITELLM-GATEWAY-EXPOSE** ships first — without it, none of the new tools can route through DOC-TELEMETRY-LOCK
3. **`vercel login` + 7 Sylvia env keys pushed** — current ECONNREFUSED P0 flag blocks production
4. **Cyl 7D scraper-catch ScraperComp≥1** — proves the wire works before stacking more wires

**Recommended order (additive · zero scope creep · one item per session):**

| # | Item | Effort | Gates on | BINDING honored |
|---|---|---|---|---|
| 1 | Enable Playwright MCP in `~/.claude/settings.json` | 5 min | none | DOC-TELEMETRY-LOCK preserved (Playwright is browser automation, not LLM egress) |
| 2 | Install Perplexity MCP server (Anthropic registry) | 30 min | env var `PERPLEXITY_API_KEY` | DOC-TELEMETRY-LOCK preserved (Perplexity goes via its own MCP, not LiteLLM — flag for Devin review) |
| 3 | Install Firecrawl MCP server | 30 min | env var `FIRECRAWL_API_KEY` · cost cap | DOC-TELEMETRY-LOCK preserved |
| 4 | `graphify hook install` + run `/graphify --update` repo-wide | 60 min | none | additive only · gitignored |
| 5 | `/graphify <legacy-loop-mvp> --mcp` background server + Open WebUI MCP config | 45 min | #4 complete | wires Phase 1A to Phase 1D |
| 6 | Install claude-mem CLI + map observations to `SylviaMemory.kind` column (schema migration · CEO approval REQUIRED) | 2-3 hrs | #5 complete · `npx prisma db push` approved | DOC-DEV-PROD-DB-ISOLATION (BINDING #6) |
| 7 | Install CodeBurn (or build equivalent on Sylvia telemetry) | 1-2 hrs | #6 complete | optional · cost-only · no LLM impact |
| 8 | Audit GStack folder contents · symlink only relevant + current ones | 2-3 hrs · per role | #7 complete | skill SSOT check vs BINDING #16 |
| 9 | Ruflo Option C eval: read source · verify adapter feasibility | 4 hrs research · NO code | #8 complete | Devin L1 spec auth · NO IT |
| 10 | IF Ruflo Option C feasible → R27+ epic spec authored. ELSE → R27+ custom Queen→Worker build. | 4-6 weeks | #9 verdict | full V19 spec discipline |

**TOTAL P3 install effort if all green:** ~12-15 hrs Devin/IT split across 4-6 sessions · ZERO breaking changes · ZERO LOCKED file touches · all additive per F1 doctrine.

---

## §4 · CRITICAL RISKS · DEVIN PUSH-BACK

Per BINDING (push-back ALWAYS authors replacement), Devin flags 5 risks before any install:

1. **🚨 DOC-TELEMETRY-LOCK violation risk.** Ruflo (P2) and Perplexity MCP (P3 #2) both bypass LiteLLM Gateway by design. Either we route them through it (custom adapter · cost: 4-8 hrs each) OR we amend BINDING #10 to allow per-tool MCP-direct egress. **CEO must decide before either installs.** Recommend Option C adapter for Ruflo · explicit MCP-direct exception for Perplexity with provenance tag.

2. **🚨 7-memory-systems doc presumes Phase 3 + 7 + 8 ship first.** Trying to install claude-mem (P3 #6) before Phase 3 SSA migration risks creating a memory schema that conflicts with the canonical 7-system map. Recommend: read `docs/SYLVIA_COGNITIVE_ARCHITECTURE.md` end-to-end FIRST · then propose schema additive that fits all 7 systems · then install claude-mem.

3. **🚨 GStack stale-doctrine risk.** Each `Downloads/skills/<role>/` folder is dated Apr 12 — pre-V19, pre-28-BINDING. Loading without audit = pinning stale doctrine to disk per BINDING #16 (skill SSOT outranks inline). Mitigation: P3 #8 explicitly audits before symlinking. Skip roles where SKILL.md doesn't reference current 28-BINDING surface.

4. **🚨 ECONNREFUSED P0 (open Slack flag).** LiteLLM Gateway `localhost:8000` hardcoded in `triage-router.ts` line 47. On Vercel production = guaranteed failure. **Blocks every Phase 2 + Phase 3 install that touches Sylvia in prod.** Must resolve R25 P6 first or amend Gateway URL to env-var-with-Vercel-fallback per banked `CMD-LITELLM-GATEWAY-URL-ENVIFY` TODO.

5. **🚨 No SUPER_BRAIN_STATE update protocol.** This doc has no auto-refresh trigger. After every install, this doc goes stale. Recommend: add `# Update Protocol` section + commit hook that flags this doc when any of: `lib/sylvia/`, `lib/sylvia-kb/`, `lib/dossier/`, `app/api/sylvia/`, `~/.claude/skills/`, `~/.claude/plugins/installed_plugins.json` changes. Per BINDING #28 DOC-AUDIT-DOC-DRIFT-CATCH.

---

## §5 · WHAT THIS AUDIT DID NOT DO (transparent gaps)

Per BINDING #17 audit-first wire — these are NEXT-session reads, not skipped:

1. **Did not read** `app/api/sylvia/consensus/route.ts` directly — graphify report covered structure but `POST()` god-node interior unverified. Read before Phase 2C INFERRED-edge cleanup.
2. **Did not read** the full 397-LOC `docs/SYLVIA_COGNITIVE_ARCHITECTURE.md` — relied on `Sylvia_Brain_Architecture_Reference.md` overlay summary. Read end-to-end before Phase 1 schema design.
3. **Did not read** `docs/sylvia/SYLVIA_API_CONTRACT.md` or `SYLVIA_FOLDER_ARCHITECTURE.md` or `SYLVIA_MIGRATION_PLAN.md` — canonical Sylvia substrate docs. Read before any code touches `lib/sylvia/`.
4. **Did not read** Ruflo source (`ruvnet/ruflo`). Required for Option-C feasibility (P3 #9).
5. **Did not deep-grep** Slack full 4-day history — sampled the Tue 5/12 tracker post only. Slack saved file at `~/.claude/projects/-Users-ryanhallee-legacy-loop-mvp/0cb1ee06-.../tool-results/mcp-...-slack_read_channel-1778620979523.txt` (115KB) for next-session catch-up.
6. **Did not verify** Ollama daemon QUARTET state (LiteLLM + Open WebUI + stay-awake). Per memory.md it's launchctl-managed but no `launchctl list | grep ollama` ran this audit.
7. **Did not run** `/graphify` repo-wide — would surface the full Super-Brain topology in one shot. Estimated 2-4 min run · ~$0.30 Gemini cost · BUT must check `GEMINI_API_KEY` env first. Recommended as IMMEDIATE next action.

---

## §6 · CEO DECISIONS NEEDED (in order · blocking)

Before ANY code write or install:

1. ⬜ **Greenlight or amend execution order §3D?** (10 items · 12-15hrs)
2. ⬜ **Ruflo Option A vs B vs C?** (recommend C · with adapter)
3. ⬜ **Perplexity MCP-direct vs Gateway-routed?** (recommend MCP-direct with provenance tag · banked doctrine candidate)
4. ⬜ **Resolve LiteLLM ECONNREFUSED P0 BEFORE Phase 2/3 installs?** (recommend YES — gate everything else on R25 P6 ship)
5. ⬜ **GStack audit-then-symlink approval per role?** (recommend roles individually surfaced for read · only current-doctrine-aligned ones loaded)
6. ⬜ **claude-mem schema migration approval?** (recommend wait for §5 #2 + #3 reads first)
7. ⬜ **Run `/graphify` repo-wide NOW as immediate diagnostic?** (recommend YES · cheap · 2-4 min · surfaces full topology before any decision)

---

## §7 · §12 REPORT-EQUIVALENT (per BINDING discipline)

| Field | Value |
|---|---|
| **BEFORE state** | tsc=0 · build PASS · HEAD `02577d3` · 287 routes · 53 models · 28 BINDING |
| **AFTER state** | IDENTICAL — audit-only · zero code · zero commits |
| **PART A read** | `Sylvia_Brain_Architecture_Reference.md` · `Tonight_IT_Build_Plan_2026-05-07.md` · `Claude_Setup_Patterns_for_Sylvia_2026-05-08.md` · `Devin_Senior_Dev_Engineer_SOP.md` · `DEVIN_CHAT_TRANSFER_2026-05-09_PM.md` · `lib/sylvia/index.ts` · `lib/sylvia/triage-router.ts` (head) · `lib/sylvia/memory.ts` (head) · `lib/sylvia/dispatcher/{agreement,index}.ts` · `lib/sylvia-kb/types.ts` · `lib/dossier/types.ts` · `graphify-out/GRAPH_REPORT.md` · Slack #all-legacyloop (Tue 5/12 tracker sample) · `~/.claude/settings.json` · `~/.claude/plugins/installed_plugins.json` · skills/Devin · skills/Master Plans · skills/Mission Control · skills/PassOffs · skills/Syliva AI · skills/Road maps · skills/Flags · skills/skills-master_class · `~/.claude/skills/` |
| **FILES MODIFIED** | NONE |
| **FILES CREATED** | `docs/SUPER_BRAIN_STATE.md` (this doc) |
| **FILES DELETED** | NONE |
| **LOCKED files** | UNTOUCHED · audit-only |
| **SCHEMA changes** | NONE |
| **PACKAGE changes** | NONE |
| **ENV changes** | NONE proposed in this doc (proposals in §3D require CEO greenlight) |
| **FLAGS surfaced** | 5 risks in §4 · 7 read-gaps in §5 · 7 CEO decisions in §6 |
| **COMMIT** | none — pending CEO review of this doc · then `docs: SUPER_BRAIN_STATE audit · prebuilt assets indexed · 10-item execution order banked` |
| **Vercel** | no deploy needed — docs-only |
| **curl** | n/a |

---

## §8 · APPENDIX · FILE-PATH QUICK INDEX (CEO scan)

**Sylvia substrate (LIVE):**
- `lib/sylvia/index.ts` · `triage-router.ts` · `memory.ts` · `memory-types.ts` · `types.ts`
- `lib/sylvia/dispatcher/{auth,classify,agreement,budget,index}.ts`
- `lib/sylvia-kb/types.ts` · `lib/dossier/{types,template,render-stub}.ts`
- `app/api/sylvia/consensus/route.ts` (per graphify) · `app/api/sylvia/*` (per Devin SOP)
- `docs/SYLVIA_COGNITIVE_ARCHITECTURE.md` (a725ef8 · 397 LOC)
- `docs/sylvia/{SYLVIA_API_CONTRACT,SYLVIA_FOLDER_ARCHITECTURE,SYLVIA_MIGRATION_PLAN}.md`

**Tooling (INSTALLED):**
- `~/.claude/plugins/cache/caveman/caveman/ef6050c5e184/` (caveman v ef6050c5e184)
- `~/.claude/plugins/cache/designlang/designlang/12.6.0/`
- `~/.claude/plugins/cache/claude-plugins-official/vercel/0.42.1/`
- `~/.claude/skills/{graphify,huashu-design,legacyloop-company-context,legacyloop-morning-brief,skill-creator}/`

**Audit artifacts (READ-ONLY):**
- `graphify-out/{graph.json,graph.html,GRAPH_REPORT.md,cost.json,manifest.json}`
- `graphify-out/{obsidian,obsidian-sylvia}/`

**Memory (auto-managed):**
- `~/.claude/projects/-Users-ryanhallee-legacy-loop-mvp/memory/MEMORY.md` (index)
- `~/.claude/projects/-Users-ryanhallee-legacy-loop-mvp/memory/*.md` (topic files)

**Doctrine SOT:**
- `CLAUDE.md` · `WORLD_CLASS_STANDARDS.md` · `AGENTS.md` (repo root · auto-loaded)
- `docs/DOCTRINE_LEDGER.md` (28 BINDING + candidates)

**MASTER GUIDANCE DOCS (read for context · NOT installed code):**
- `~/Downloads/skills/Syliva AI/Claude_Setup_Patterns_for_Sylvia_2026-05-08.md` (12 moats · the architectural spine for Sylvia)
- `~/Downloads/skills/Syliva AI/Sylvia_System_Prompt_v2_PASTE_READY.txt` (drop-in prompt when CEO ready)
- `~/Downloads/skills/Road maps/Sylvia_Brain_Architecture_Reference (1).md` (orientation overlay)
- `~/Downloads/skills/Devin/Devin_Senior_Dev_Engineer_SOP.md` (this Devin's operating doctrine)
- `~/Downloads/skills/Tonight_IT_Build_Plan_2026-05-07.md` (IT tech build plan · Wave A/B/C · n8n + Cyl 7D-G)

---

---

## §9 · DEEP-SCAN ADDENDA (2026-05-12 17:50 EDT · post first audit)

CEO directive: "look deep into legacy-loop-mvp folder." Below = corrections + amplifications missed in first pass.

### 9A · Truth Gate 4-AI consensus has THREE implementations (drift risk)

| Implementation | Path | Purpose | Status |
|---|---|---|---|
| **MegaBot specialized runner** | `lib/megabot/run-specialized.ts` (`runSpecializedMegaBot`) | Production · 4-provider parallel · `MegaBotAgentResult[]` · agreementScore · per-bot opts | 🟢 LIVE · used by `app/api/megabot/[itemId]/route.ts` 1532 LOC |
| **Sylvia Truth Gate dispatcher** | `lib/sylvia/dispatcher/{auth,classify,agreement,budget}.ts` | R24 P0 · stakes-classified · LiteLLM-Gateway-routed · Sylvia-namespace API | 🟢 LIVE · `app/api/sylvia/consensus/route.ts` |
| **Multi-agent runner** | `lib/agents/runner.ts` | Standard + Mega Modes · 8 bot types · Azure placeholder · `AgentResult` shape | 🟡 ORIGIN · older surface · likely superseded by megabot path |

**Push-back call:** Three "ports" of the same 4-AI consensus pattern in one repo = Phase 3.x consolidation cylinder candidate. Recommend deep-dive audit BEFORE any Ruflo install to decide:
- (a) Pick one as canon · deprecate others (cleanest · breaks callers)
- (b) Sylvia dispatcher wraps MegaBot runner via adapter (cleanest survival · all 4 callers preserved)
- (c) Status quo · accept drift (worst · BINDING #16 violation candidate)

### 9B · Sylvia procedural memory = 239 skill files · 2.3 MB PREBUILT

15 skill directories at `lib/bots/skills/`:

| Dir | Files | Loaded via | Phase 3.1 status |
|---|---|---|---|
| `_shared/` | 3 | every bot · `loadSkillPack` SHARED_DIR | LIVE |
| `_shared_megabot/` | 5 | MegaBot path only · `loadSkillFolder` | LIVE · contains **Truth Gate consensus engine playbook** at `04-megabot-consensus-engine.md` |
| `analyzebot/` | 27 (+megabot subdir) | NOT yet wired per R13 P3 audit | 🟡 |
| `pricebot/` | 24 | `app/api/bots/pricebot/[itemId]/route.ts:153` | LIVE |
| `photobot/` | 20 | NOT yet wired per R13 P3 audit | 🟡 |
| `buyerbot/` | 26 | `app/api/bots/buyerbot/[itemId]/route.ts:558` | LIVE |
| `reconbot/` | 22 | `app/api/bots/reconbot/[itemId]/route.ts:269` | LIVE |
| `listbot/` | 24 | `app/api/bots/listbot/[itemId]/route.ts:408` | LIVE |
| `antiquebot/` | 20 | `app/api/bots/antiquebot/[itemId]/route.ts:149` | LIVE |
| `collectiblesbot/` | 20 | `app/api/bots/collectiblesbot/[itemId]/route.ts:147` | LIVE |
| `carbot/` | 20 | `app/api/bots/carbot/[itemId]/route.ts:234` | LIVE |
| `videobot/` | 21 | `app/api/bots/videobot/[itemId]/route.ts:165` | LIVE |
| `documentbot/` | 3 | platform · no per-route grep | 🟡 |
| `intel-panel/` | n/a | platform module | 🟡 |
| `shipping-center/` | n/a | platform module | 🟡 |

**`elon-standard` convention:** 9 bots have `01-elon-standard-<bot>.md` (analyzebot · antiquebot · carbot · collectiblesbot · photobot · pricebot · reconbot · videobot + `_shared/01-elon-standard.md` baseline). Consistent skill-numbering convention prebuilt.

**`SkillFrontmatter` schema declared** at `lib/bots/skill-loader.ts:41`: `{name, description, keywords?, version?, surface?}`. Mirrors Anthropic Agent Skills schema · provider-agnostic. **This IS Moat #3 (skill auto-discovery + marketplace) substrate prebuilt.** 

### 9C · Bot-AI Router subsystem (full Routing layer prebuilt)

`lib/adapters/bot-ai-router/` — 8 files · NOT a thin abstraction:
- `config.ts` · `cost-tracker.ts` · `index.ts` · `listbot-merge.ts` · `listbot-prompts.ts` · `logging.ts` · `provider-selector.ts` · `types.ts`

**Per Phase 3.2 SSA Foundation Audit:** `routeAnalyzeBotHybrid` at `lib/adapters/bot-ai-router/index.ts:1692` shipped R16 P1 `8671cbb`. This is the **hybrid router** that decides per-bot which provider gets the call. Likely the closest substrate to Ruflo's SONA routing pattern already in-house.

**Cost-tracker module** already exists — partially fills Moat #2 (CodeBurn equivalent). May reduce P3 install need. Read `cost-tracker.ts` before installing external CodeBurn.

### 9D · Daemon QUARTET CONFIRMED LIVE via launchctl

```
PID  Service
1947 com.legacyloop.ollama
1930 com.legacyloop.litellm
```

Install scripts banked at `scripts/`:
- `install-litellm-autostart.sh` · `install-ollama-autostart.sh` · `install-open-webui.sh` · `install-stay-awake-autostart.sh` · `prewarm-ollama.sh` · `start-open-webui.sh` · `stop-open-webui.sh` · `litellm-dev.sh`

**Stay-awake + Open-WebUI NOT in launchctl output** — either not loaded today or loaded under different label. Verify before any Open-WebUI work:
```bash
launchctl list | grep -iE "stayaw|openwebui|open-webui|webui"
```

### 9E · `.env.sylvia` keys 5 providers (incl Perplexity)

Per `docs/sylvia/SYLVIA_FOLDER_ARCHITECTURE.md` §1:
- `ANTHROPIC_API_KEY_SYLVIA`
- `OPENAI_API_KEY_SYLVIA`
- `GEMINI_API_KEY_SYLVIA`
- `XAI_GROK_API_KEY_SYLVIA`
- `PERPLEXITY_API_KEY_SYLVIA`
- Per-key daily caps + provider rate limits

**File:** 2093 bytes · chmod 600 · gitignored · BINDING #5 DOC-BAN-ENV-FILE-DUMP applies (NEVER cat/tail/head). **Perplexity already routed** via `triage-router.ts` `sonar` / `sonar-pro` / `sonar-reasoning-pro` / `sonar-deep-research` aliases.

**P3 correction:** Separate Perplexity MCP install (P3 #2 in original §3D) is **REDUNDANT** — Perplexity goes via LiteLLM Gateway already. The MCP would be a parallel path that bypasses DOC-TELEMETRY-LOCK. **Recommend DROP P3 #2 from execution order.**

### 9F · `sylvia-data/` reserved structure (gitignored at .gitignore:74)

Per `SYLVIA_FOLDER_ARCHITECTURE.md`:
```
sylvia-data/
├── audit/         (per-call trace destination)
├── corpus/        (scrape ingest landing zone · Moat 11)
├── memory/        (collective memory layer · cross-agent)
└── vector-store/  (embedding cache · semantic retrieval)
```

**`vector-store/` is reserved but empty.** Phase 1B claude-mem install candidate. Phase 1 §1B correction: the SLOT exists. Just no implementation. Banked claude-mem could land here without schema work.

### 9G · `SylviaMemory` Prisma model is NOT flat (1st audit error)

Schema verified — already structured:
- Session + prompt identity (sessionId · promptHash · promptLength · agentName)
- Classification + routing (classifier · classification enum · chosenAlias · cascadeAttempted JSON · fallbackUsed)
- Cost + ceiling (costEstimateUsd · costActualUsd · ceilingTriggered)
- Performance (durationMs · tokensIn · tokensOut)
- Response (responseText/Hash/Length · privacy opt-out via null)
- Cross-refs (userId · itemId · SET NULL on parent delete)
- Error capture (errorClass)

**Correction to 1st audit:** Already production-grade telemetry persistence layer. Not "flat single-table" — fully normalized. claude-mem would ADD `observation` schema on top, not replace. Recommend additive `kind` column ONLY · zero migration risk · BINDING #6 honored.

### 9H · Sylvia API contract declares 4 endpoints · 1 of 4 SHIPPED

Per `docs/sylvia/SYLVIA_API_CONTRACT.md`:

| Endpoint | Stakes | Status | Notes |
|---|---|---|---|
| `POST /api/sylvia/ask` | low | ⏸ BANKED | single-agent · cheap path |
| `POST /api/sylvia/consensus` | high | 🟢 SHIPPED R24 P0 | Truth Gate · 4-AI · LiteLLM-routed |
| `POST /api/sylvia/corpus` | KB query | ⏸ BANKED | Moat 11 retrieval · vector-store reads |
| 4th endpoint | (read-cutoff) | ⏸ | TBD per contract §2.4 |

**Triple-source auth pattern** (cloned from R22 P0 `f51ab90` per BINDING #16):
- `Authorization: Bearer <secret>`
- `X-Sylvia-Internal-Secret: <secret>`
- `?token=<secret>` query param
- `crypto.timingSafeEqual` + length guard + `Buffer.from(utf8)`
- Fail-closed if env var missing → 500 + zero log body

### 9I · Repo-local Claude config (`.claude/`)

Path: `/Users/ryanhallee/legacy-loop-mvp/.claude/`
- `dev.sh` — bash wrapper for `next dev` with PATH guard
- `launch.json` — VS Code launch config pointing at `dev.sh`
- `settings.json` — MCP permission allowlist (Vercel × 2 instances · Slack)
- `settings.local.json` — large bash allowlist (npx prisma · curl · sqlite3 · etc · ~40+ entries)
- `scheduled_tasks.lock` — scheduled-tasks MCP lockfile
- `worktrees/frosty-elion-1f38a2/` — ccd_session worktree slot active

**Two Vercel MCP servers permissioned:** `claude_ai_Vercel__*` (legacy) + `5b21325d-...` (current). Same toolset · risk of double-billing if both wired. Verify which is active.

### 9J · Discovered docs (1st audit missed these)

| Doc | LOC est | Purpose |
|---|---|---|
| `docs/PHASE_3_2_SSA_FOUNDATION_AUDIT.md` | medium | R21 P0 · SSA readiness · 🟡 GATED CEO disambig pending |
| `docs/SYLVIA_SKILLS_ARCHITECTURE_AUDIT.md` | 342 LOC | R13 P3 anchor · canonical skill-pack inventory |
| `docs/MEGABOT_ANALYZEBOT_SPECIALIST_AUDIT_2026-05-07.md` | medium | R20 P0 · MegaBot specialist channel parity |
| `docs/CYL_7_EPIC_CLOSEOUT.md` | medium | Cyl 7 Apify scraper epic closeout |
| `docs/CYL_7A_WEBHOOK_VERIFY_AUDIT.md` · `CYL_7B_PARSER_WIRE_AUDIT.md` | small | Cyl 7 wire audits |
| `docs/HMAC_VERIFY_AUDIT.md` | medium | Receiver-side HMAC pattern · R16 P0 |
| `docs/CRON_REGISTRY_PARITY_AUDIT_2026-05-07.md` | medium | R19 P2 cron parity |
| `docs/PHASE_3_1_VIDEOBOT_AUDIT_2026-05-07.md` | medium | R18 P1 VideoBot SSA extract |
| `docs/SCRAPER_AGENT_PLAN.md` | medium | Cyl 7 epic plan |
| `docs/runbooks/scraper-killswitch.md` | small | APIFY_KILL_SWITCH runbook |
| `docs/DEV_PROD_DB_ISOLATION_AUDIT.md` | medium | BINDING #6 grounding |
| `docs/WORKTREE_RESET_SH_ENV_PARITY_AUDIT_2026-05-07.md` | small | worktree-reset.sh parity |

### 9K · Phase 1 graphify gap explicit

Last `/graphify` run (2026-05-09 14:08 UTC) scoped to:
- `lib/sylvia + lib/sylvia-kb + lib/dossier + app/api/sylvia` · 14 files · 6,778 words

Missed Super-Brain substrates:
- `lib/bots/skill-loader.ts` (390 LOC · SSA contract)
- `lib/bots/skills/` (239 files · 2.3 MB)
- `lib/megabot/` (run-specialized · prompts · 4-AI core)
- `lib/agents/runner.ts` (Standard + Mega multi-agent)
- `lib/adapters/bot-ai-router/` (8 files · routing layer)
- `lib/intelligence/generate.ts` (Intelligence synthesis layer)
- `lib/services/{hero-verify-ai,payment-ledger,recon-bot,refund-calculator}.ts`
- All 53 Prisma models
- All 287 API routes
- `docs/` (26 audit docs · canonical doctrine)
- `app/components/ItemDashboardPanels.tsx` (9000+ LOC mega-component)

**P1 #4 in §3D becomes URGENT.** Repo-wide `/graphify` would expand 103 → estimated 1500-2500 nodes. Without it, the Sylvia graph is a 5% slice of the actual brain.

### 9L · `.env.sylvia` keys ≠ "7 Sylvia env keys not pushed" Slack flag

Reconciliation: `.env.sylvia` is LOCAL (chmod 600 · 5 keys). Slack tracker Tue 5/12 flagged **7 Sylvia env keys not pushed to Vercel**. Gap = key count mismatch (5 local vs 7 production-required) OR additional Sylvia-side env vars beyond API keys (budget caps · feature flags · gateway URL).

**Action:** Devin reads `.env.sylvia` via count-only `grep -cE "^[A-Z_]+=" .env.sylvia` per BINDING #5 → reconciles against R25 P3 SYLVIA_ENV_CONTRACT_AUDIT (`4f567ad`). Banked for next session.

### 9M · Updated CEO decision queue (§6 revision)

Original §6 had 7 decisions. Deep scan adds 3 more · changes 2:

| # | Decision | Status |
|---|---|---|
| 1 | Greenlight execution order §3D | ORIGINAL |
| 2 | Ruflo Option A/B/C | ORIGINAL |
| 3 | ~~Perplexity MCP-direct vs Gateway-routed~~ | **DROPPED** · already routed via Gateway · separate MCP is redundant |
| 4 | Resolve LiteLLM ECONNREFUSED P0 first | ORIGINAL |
| 5 | GStack audit-then-symlink per role | ORIGINAL |
| 6 | claude-mem schema migration approval | ORIGINAL → **revised** · additive `kind` column ONLY · land in `sylvia-data/vector-store/` slot reserved |
| 7 | Run `/graphify` repo-wide NOW | ORIGINAL · **REVISED TO P0 URGENT** · current graph is 5% slice |
| 8 (NEW) | **3-way Truth Gate consolidation** (megabot/run-specialized vs sylvia/dispatcher vs agents/runner) — pick canonical OR adapter-wrap | NEW |
| 9 (NEW) | **Use built-in `lib/adapters/bot-ai-router/cost-tracker.ts` as CodeBurn equivalent?** | NEW · would drop P3 #7 external install |
| 10 (NEW) | **Phase 3.1 unfinished SSA work** (AnalyzeBot · PhotoBot · DocumentBot routes not loading skills) — fire before or after Sylvia hybrid-AI doctrine? | NEW · gates `Sylvia hybrid integration doctrine` in memory |

---

*End of SUPER_BRAIN_STATE.md · Devin L1 audit · deep-scan addenda appended 2026-05-12 17:50 EDT · awaiting CEO greenlight on §6 (revised) + §9M decisions before any install.*
*Connecting Generations · Legacy-Loop Tech LLC · Confidential.*
