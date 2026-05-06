# LegacyLoop Doctrine Ledger
## Canonical source of truth for BINDING doctrines

**Maintainer:** MC (Mission Control · Strategy)
**Created:** Wed May 6 2026 AM EDT
**Anchor commit:** `059de07` (HEAD at creation)
**Total BINDING:** 18 (verified by git history audit)
**Drift detected:** YES — Master Roadmap claimed 16, commit `512b6b9` claimed "→ 20 BINDING", commit `d6b71b8` claimed "17 + #18 = 18 total". This ledger reconciles to **18**.

---

## How to read this ledger

- Each row is **one** binding doctrine. Variant names (e.g., `-PRECHECK` suffixes) deduplicate to the canonical name.
- "Ratified by commit" cites the **first** commit that says `RATIFIES <doctrine>` or `→ BINDING #N` for that doctrine.
- "Sequence" is chronological rank of first ratification commit (#1 = oldest BINDING).
- "Notes" cite drift, prior aliases, or proof-point context.
- Future ratifications APPEND to this table. Update "Total BINDING" + "Updated" line at top.

## How to update (future ratifications)

1. After §12 cites `<DOC-NAME> RATIFIES → BINDING #N · commit <hash>`:
2. MC adds new row to the canonical table below. Sequence = previous max + 1.
3. MC updates "Total BINDING" + adds a new "Updated:" line at top with date + commit hash.
4. MC commits this file via `CMD-DOCTRINE-LEDGER-APPEND` (V18 template — banked).
5. **NO doctrine count claim is canonical anywhere (commit messages · §12 · roadmap · Slack · investor decks) without this file's update.**

---

## Canonical Ledger (18 BINDING)

| #  | Doctrine                                  | Ratified by commit | Date       | Notes |
|----|-------------------------------------------|--------------------|------------|-------|
| 1  | DOC-V18-TEMPLATE-CANONICAL-FILE           | `f968ad3`          | 2026-05-01 | First applied across May 1+ commit chain. Spec template lives in CLAUDE.md §18. Cited in 9+ commits. |
| 2  | DOC-IT-AGENT-PROMPT-COMPACT               | `f968ad3`          | 2026-05-01 | Compact briefing standard for IT agent terminals. Applied across May 1+ chain. |
| 3  | DOC-CEO-SCHEDULE-AUTHORITY                | `f968ad3`          | 2026-05-01 | CEO sets pace · agents execute · per `feedback_dont_dictate_schedule.md` (Apr 25). |
| 4  | DOC-MEASURE-BEFORE-PROMISE                | `f968ad3`          | 2026-05-01 | Audit before reconciling · evidence-based ratification. Cited as "BINDING #4" in `feedback_verify_vercel_after_commit.md`. |
| 5  | DOC-PRE-STAGE-NON-IDP-PREFETCH            | `f968ad3`          | 2026-05-01 | Read source files at anchor HEAD before drafting V18 spec. See also `feedback_pre_stage_existence_check.md` (May 5 strengthening). |
| 6  | DOC-DEV-PROD-DB-ISOLATION                 | `f968ad3`          | 2026-05-01 | "DOC-DEV-PROD-DB-ISOLATION (#13) RATIFIES → 14 BINDING" · `lib/db.ts` bleed guard + Vercel misconfig guard + DATABASE_URL `file:` assertion + ALLOW_LOCAL_TURSO=1 escape hatch. |
| 7  | DOC-SPEC-GROUNDING-VERIFY                 | `f968ad3`          | 2026-05-01 | "DOC-SPEC-GROUNDING-VERIFY (#21) RATIFIES → 15 BINDING" · runtime catch class (e.g., ReconAlert relation fix in d6b71b8). |
| 8  | DOC-PARALLEL-FILE-COLLISION-CHECK         | `355d4be`          | 2026-05-01 | "DOC-PARALLEL-FILE-COLLISION-CHECK (#15) RATIFIES" · 4th application proof point in same-day `f968ad3`. |
| 9  | DOC-LOCKED-SWITCH-CHECK                   | `38753f9`          | 2026-04-30 | Explicit unlock required for LOCKED exhaustive switches (e.g., `provider-selector.ts:62` ProviderName extension). Predates numbering scheme · retro-sequenced by first git evidence. |
| 10 | DOC-TELEMETRY-LOCK                        | `5857833`          | 2026-05-03 | Gateway-only routing for AI calls · zero direct provider SDK · zero raw HTTP. Cited 9+ commits. |
| 11 | DOC-PROVIDER-API-CHECK                    | `5857833`          | 2026-05-03 | Verify provider API surface before wire. Applied across Sonar wire chain. |
| 12 | DOC-MULTI-AGENT-INDEX-ISOLATION (PRECHECK) | `bc4085f`         | 2026-05-05 | Run `git diff --cached --stat` pre-`git add` to catch foreign pre-staged paths. PRECHECK suffix = canonical name (deduped from earlier `DOC-MULTI-AGENT-INDEX-ISOLATION`). 1st production catch in Wire D. See `feedback_multi_agent_index_isolation_precheck.md`. |
| 13 | DOC-FORWARD-COMPAT-TYPE-CONSOLIDATION     | `0f8a2e3`          | 2026-05-03 | "RATIFIES on this clean fire" · String-stored union types type-checked against ModelAlias. 8th proof point d6b71b8. |
| 14 | DOC-CONFIDENCE-SCALE-NORMALIZE            | `512b6b9`          | 2026-05-02 | "ratifies #18 DOC-CONFIDENCE-SCALE-NORMALIZE candidate". Note drift: same commit cited "→ 20 BINDING" — ledger reconciles to sequence 14. |
| 15 | DOC-EMIT-WITH-PROVENANCE                  | `5bcc45a`          | 2026-05-03 | EventLog payload includes anchor + sylviaSessionId + sylviaPromptHash + actualCostUsd + sylviaMemoryActive sentinel. Memory cites "BINDING #15 ratified May 5" (re-ratification proof). |
| 16 | DOC-DELEGATE-TO-CANONICAL                 | `105c7d0`          | 2026-05-05 | Sylvia `triageAndRoute` canonical helper · zero re-implementation. Memory cites "BINDING #16 ratified May 5". |
| 17 | DOC-AUDIT-FIRST-WIRE-PATTERN              | `d6b71b8`          | 2026-05-06 | "🎯 RATIFIES DOC-AUDIT-FIRST-WIRE-PATTERN BINDING #17 (8/8 audit §6 P0+P1 closure · 6 admin wires + 2 panel slots · audit IS the contract per CEO Wed AM scope decision)". Pattern proven 8 times across Wires A–H. |
| 18 | DOC-BUILD-MEMORY-BUDGET-CHECK             | `fb02caa`          | 2026-05-05 | "ratifies by 2nd repetition" · local `next build` type-check sub-phase hangs under memory pressure → Fork B (commit + Vercel CI re-validates) is correct path. See `feedback_build_memory_budget_check.md`. |

---

## Candidates (NOT yet BINDING · awaiting proof points)

| Candidate                                  | First proof point | Required for BINDING | Status |
|--------------------------------------------|-------------------|----------------------|--------|
| DOC-VERIFY-VERCEL-AFTER-COMMIT             | `059de07` (May 6) | 5 clean Vercel-verified Round closures | NEW today (1st proof) |
| DOC-NEXTJS-DYNAMIC-ROUTE-PARAM-NAME        | `059de07` (May 6) | 3 clone-pattern fires post-pattern-bind | NEW today (1st proof) |
| DOC-SLOT-VS-WIRE                           | `f2e4715` + `d6b71b8` (May 6) | 5 SLOT applications | 2/5 progressing |
| DOC-EFFECTS-A11Y-COMPLETE                  | `08f67fc` (May 5) | 5 clean fires across effects components | 1/5 (GradientOrbs + NoiseOverlay) |
| DOC-SMOKE-RESPECTS-UX-GATING               | `355d4be` (May 1) | 5 applications | banked |
| DOC-PRE-FLIGHT-DIRTY-RECHECK               | `fa80793` (May 2) | 5 applications | banked |
| DOC-PARALLEL-BUILD-ISOLATION               | `fa80793` (May 2) | 5 applications | banked |
| DOC-CONFIDENCE-SCHEMA-LINT                 | `512b6b9` (May 2) | 5 applications | banked |
| DOC-MEMORY-LAYER-SCHEMA-VERSION            | `0f8a2e3` (May 3) | future · once schema migration occurs | banked |
| DOC-AGENT-NAME-ENUM-CANDIDATE              | `0f8a2e3` (May 3) | once 4+ agent names exist | banked |
| DOC-NO-COMMANDS-IN-SLACK                   | `5bcc45a` (May 3) | 5 applications | progressing |
| DOC-COMMANDS-SUBFOLDER                     | `5bcc45a` (May 3) | 5 applications | progressing |
| DOC-PASTE-POINTER-DISCIPLINE               | `105c7d0` (May 5) | 5 applications | progressing (see also memory file) |
| DOC-BAN-PASSWORD-PASTE                     | `f5001ff` (May 1) | 5 applications | progressing |
| DOC-ENV-PRECHECK                           | `0f8a2e3` (May 3) | 5 applications | banked |
| DOC-BAN-ENV-FILE-DUMP                      | `0f8a2e3` (May 3) | 5 applications | progressing |
| DOC-BAN-BASH-X                             | `fa80793` (May 2) | 5 applications | progressing (Apr 29 transcript-leak origin) |
| DOC-PROMPT-SCHEMA-SKILL-ALIGN              | (banked · pre-fire) | 2 proof points (Cyl 2B + 2C) | banked |

---

## Pre-Doctrine-Ledger Rules (codified in CLAUDE.md · effectively binding · not in 18-count)

These rules predate the doctrine numbering scheme (May 1) and are codified directly in `CLAUDE.md` / `WORLD_CLASS_STANDARDS.md`. They are functionally binding but live in the canonical project docs rather than this ledger.

| Rule                          | Codified in           | First evidence | Notes |
|-------------------------------|-----------------------|----------------|-------|
| F1 ENGINE DOCTRINE            | CLAUDE.md §7          | `bb6c319` (Apr 20) | Bot capability upgrades = additive skill packs · NEVER inline prompt text in route files. |
| FLEX-SHRINK RULE              | CLAUDE.md §3          | `bb6c319` (Apr 20) | Flex parents of overflow-scrolling children must have `minWidth: 0`. |
| GRID RULE                     | CLAUDE.md §3          | (Apr 18 era)   | All `gridTemplateColumns` use `minmax(0,1fr)` — never plain `1fr`. |
| LOCKED FILES LIST             | CLAUDE.md §10         | (Apr era)      | 30+ surgical-unlock-required files. |
| 7 PILLARS · 12 EFFECTS · 18 BENCHMARKS | WORLD_CLASS_STANDARDS.md | (Mar–Apr era) | Identity standards · evaluated every commit. |

---

## Memory-Bound Feedback Rules (operating directives · separate lane from BINDING)

These live in `~/.claude/projects/.../memory/` and govern HOW agents operate. They are not "doctrines" in the BINDING sense but are equally binding for IT/Devin/MC behavior. Listed here for completeness.

- `feedback_dont_dictate_schedule.md` — Apr 25 · Ryan sets pace.
- `feedback_source_of_truth.md` — app is king.
- `feedback_polish_mode_only.md` — additive · audit-first · single cylinder per ship.
- `feedback_build_process.md` — diagnostic first · tsc every save.
- `feedback_design_system.md` — `#0D1117` bg · `#00BCD4` accent · zero Tailwind.
- `feedback_it_concurrency.md` — never >2 V17.1 commands at IT.
- `feedback_build_harness_rules.md` — pgrep self-match · tsc-after-save · no amends.
- `feedback_tools_without_data.md` — May 1 · Tools deferred until proprietary data flows.
- `feedback_dont_expand_scope_without_asking.md` — May 1 · stand down + ask when blocked.
- `feedback_v18_label_discipline.md` — May 1 · only label V18 if 12 sections + ships commit + §12 with hash.
- `feedback_pre_fire_blocker_discipline.md` — May 2 · 5-item PRE-FIRE CHECKLIST.
- `feedback_auto_commit_workflow.md` — May 2 · IT auto-commits on green.
- `feedback_mandatory_v12_emission.md` — May 2 · §12 box auto-emit on every outcome.
- `feedback_pre_stage_existence_check.md` — May 5 · `ls + grep + layout.tsx check` before NEW spec.
- `feedback_multi_agent_index_isolation_precheck.md` — May 5 · `git diff --cached --stat` pre-add.
- `feedback_build_memory_budget_check.md` — May 5 · Vercel CI is the gate.
- `feedback_paste_pointer_destination_discipline.md` — May 5 PM · Claude Code vs zsh distinction.
- `feedback_never_abandon_always_bank.md` — May 5 EOD · BANKED-LOW-PRIORITY default.
- `feedback_verify_vercel_after_commit.md` — May 6 · `mcp__vercel__list_deployments` after every prod commit.

---

## Drift Reconciliation Note

This ledger was created Wed May 6 2026 AM after CEO + MC + Devin discovered:

- **Master Roadmap** (Wed AM) claimed **16 BINDING**.
- **Commit `512b6b9`** (May 2) claimed "ratifies #18 DOC-CONFIDENCE-SCALE-NORMALIZE candidate **→ 20 BINDING**" (over-counted).
- **Commit `d6b71b8`** (May 6) claimed "16 BINDING + #17 ratifies = **17 BINDING** (+ #18 SCALE-NORMALIZE = **18 total**)".
- **Devin chat** (Wed AM): "MC roadmap says 16 · git history says ~18-20".

**Source of drift:** each ratification commit incremented locally without consulting prior count. No canonical source existed. Sequence numbers in commit messages (e.g., `(#13)`, `(#15)`, `(#21)`, `(#18)`) are best-effort estimates, not authoritative — they reflect what each commit author believed at the time.

**Reconciliation choice:** this ledger sequences chronologically by **first ratification commit**, not by the `(#N)` cited in commit messages. The `(#N)` values were noisy and contradictory; commit hashes + dates are deterministic. Total = 18, matching `d6b71b8`'s claim, validated by enumeration.

**This ledger IS the source from this day forward.** Doctrine counts cited anywhere (commit messages · §12 reports · roadmaps · Slack posts · investor decks) MUST match this file. If they conflict, this file wins until updated by the documented append flow.

---

## Source of Truth Hierarchy (per `feedback_source_of_truth.md`, updated May 6)

1. **The app itself** (running code · production behavior)
2. **Git HEAD** (`git log` · `git diff` · authoritative for code state)
3. **THIS DOCTRINE LEDGER** (`docs/DOCTRINE_LEDGER.md` · canonical doctrine state)
4. **Slack `#all-legacyloop`** (operational truth · daily decisions)
5. **Memory files** (`~/.claude/projects/.../memory/` · agent behavior · feedback rules)
6. **Project documents** (`CLAUDE.md` · `WORLD_CLASS_STANDARDS.md` · `AGENTS.md`)
7. **Master Roadmap** (`/Users/ryanhallee/Downloads/LegacyLoop_Master_Roadmap_*.md` · MC syncs against this ledger)

**Rule of thumb:** when sources conflict, lower number wins. The app is reality; everything else is documentation.

---

## Recently Promoted (last 5 ratifications · for quick MC scan)

| Date       | Doctrine                          | Commit    | BINDING# (canonical) |
|------------|-----------------------------------|-----------|----------------------|
| 2026-05-06 | DOC-AUDIT-FIRST-WIRE-PATTERN      | `d6b71b8` | 17                   |
| 2026-05-05 | DOC-BUILD-MEMORY-BUDGET-CHECK     | `fb02caa` | 18                   |
| 2026-05-05 | DOC-DELEGATE-TO-CANONICAL         | `105c7d0` | 16                   |
| 2026-05-05 | DOC-MULTI-AGENT-INDEX-ISOLATION (PRECHECK) | `bc4085f` | 12          |
| 2026-05-03 | DOC-EMIT-WITH-PROVENANCE          | `5bcc45a` | 15                   |

**Note:** sequence numbers in this ledger differ from chronological-promotion order because some doctrines were applied across many commits before formal RATIFIES citation. The "Ratified by commit" column is the **first** explicit RATIFIES.

---

## Active Sentinels (doctrines under active reinforcement · monitor for next 5 fires)

These were ratified recently and remain under proof-point watch:

- **DOC-VERIFY-VERCEL-AFTER-COMMIT** — every §12 claiming production work must cite `mcp__vercel__list_deployments` state. Sentinel for next 5 cylinders (currently 1/5).
- **DOC-NEXTJS-DYNAMIC-ROUTE-PARAM-NAME** — every cloned route handler must grep parent dir name post-clone (currently 1/5).
- **DOC-SLOT-VS-WIRE** — panel-facing SLOT pattern vs admin-facing WIRE pattern · empirically validated; ratifies after 5 SLOT applications (currently 2/5).
- **DOC-AUDIT-FIRST-WIRE-PATTERN** (BINDING #17) — newly bound; monitor for regression in next 5 audit-derived cylinders.

---

## Per-Doctrine Detail (the 18 BINDING expanded)

### #1 · DOC-V18-TEMPLATE-CANONICAL-FILE
**Why it exists:** V18 specs share a 12-section template (Anchor · Objective · F1 Framing · Scope · Diagnostic · Fixes · Build Harness · Acceptance · Latitude · Stop Rules · §12 Format · Report Template). Without a canonical template, specs drift in structure and §12 reports become un-comparable.
**How to apply:** Every V18 spec must include all 12 sections in this order. Specs missing sections get an honest non-V18 label per `feedback_v18_label_discipline.md`.

### #2 · DOC-IT-AGENT-PROMPT-COMPACT
**Why it exists:** IT agent terminals truncate context aggressively. Long prose briefs cost throughput.
**How to apply:** Pre-stage briefs and paste-pointers must be compact: heading + verbatim spec path + anchor HEAD + outcome expectation. No editorial preamble.

### #3 · DOC-CEO-SCHEDULE-AUTHORITY
**Why it exists:** Apr 25 correction. Agents proposing rest, wrap-ups, or pacing changes is scope creep against Ryan's authority.
**How to apply:** Execute work; never editorialize about Ryan's energy or schedule. See `feedback_dont_dictate_schedule.md`.

### #4 · DOC-MEASURE-BEFORE-PROMISE
**Why it exists:** Audit before reconciling — the same discipline this ledger applies. Predicting is cheap; measuring is canonical.
**How to apply:** Every claim ("8/8 closure" · "20 BINDING" · "55 sites repointed") must have an evidence command (grep · `git log` · `mcp__vercel__list_deployments` · `wc -l`). Cite the command in §12.

### #5 · DOC-PRE-STAGE-NON-IDP-PREFETCH
**Why it exists:** May 5 AMBIENT-ORBS HALT — V18 spec promised NEW `GradientOrbs.tsx` that already existed and was globally mounted. Drafting a NEW spec without `ls + grep + layout.tsx check` at anchor HEAD wastes a fire cycle.
**How to apply:** Before drafting any V18 spec promising NEW file/component/mount/barrel-export, run existence checks at anchor HEAD. See `feedback_pre_stage_existence_check.md`.

### #6 · DOC-DEV-PROD-DB-ISOLATION
**Why it exists:** App-layer guard against DEV writes hitting Turso production database. Bleed-guard catches misconfigured `DATABASE_URL`.
**How to apply:** `lib/db.ts` enforces `file:` prefix in DEV; `ALLOW_LOCAL_TURSO=1` is the explicit escape hatch. Vercel misconfig guard fails fast on prod.

### #7 · DOC-SPEC-GROUNDING-VERIFY
**Why it exists:** Specs assume schema/relation shapes that drift. Wire H caught a `ReconAlert` relation requiring `reconBot:{itemId}` not direct `itemId` — caught by tsc post-edit because spec referenced an outdated shape.
**How to apply:** Spec assumptions get verified against current schema/types at fire time. tsc errors are the friend.

### #8 · DOC-PARALLEL-FILE-COLLISION-CHECK
**Why it exists:** Multiple concurrent IT agents writing to overlapping paths cause merge pain or silent overwrites.
**How to apply:** Every V18 spec's §3 SCOPE must declare the exact paths touched and explicitly mark disjoint surfaces vs parallel agents. See also #12 (PRECHECK is the runtime guard for this doctrine).

### #9 · DOC-LOCKED-SWITCH-CHECK
**Why it exists:** `provider-selector.ts:62` and `bot-ai-router/index.ts:610` exhaustive switches are LOCKED. Adding a `ProviderName` enum value requires explicit unlock or the switch silently breaks.
**How to apply:** Any extension of LOCKED enums (`ProviderName` · `TriggerName` · `ItemStatus` · `SaleMethod`) requires explicit §3 unlock + parallel-agent guard.

### #10 · DOC-TELEMETRY-LOCK
**Why it exists:** Apr 30 Phase B-2. All AI calls route through LiteLLM Gateway (`localhost:8000` DEV · hosted Phase D PROD). Direct provider SDK calls bypass the chokepoint and break cost telemetry, model-swap discipline, and Sylvia memory persistence.
**How to apply:** Zero direct OpenAI/Anthropic/Gemini/xAI SDK imports outside `lib/adapters/multi-ai.ts` + `lib/bots/bot-ai-router/`. Zero raw fetch to provider endpoints. Every AI call surfaces via `triageAndRoute` or the unified router.

### #11 · DOC-PROVIDER-API-CHECK
**Why it exists:** Provider APIs drift (e.g., OpenAI Responses API vs Chat Completions). Wires assuming old API shape break silently.
**How to apply:** Verify provider API surface at fire time via the canonical adapter; no inline curl.

### #12 · DOC-MULTI-AGENT-INDEX-ISOLATION (PRECHECK)
**Why it exists:** May 5 first production catch — Wire D would have committed CollectiblesBotClient.tsx pre-staged from a parallel R7 #3 agent if cached-diff hadn't been audited pre-add.
**How to apply:** Before `git add`, run `git diff --cached --stat` to detect foreign pre-staged paths; `git restore --staged <foreign>` BEFORE adding own scope. See `feedback_multi_agent_index_isolation_precheck.md`.

### #13 · DOC-FORWARD-COMPAT-TYPE-CONSOLIDATION
**Why it exists:** `forceAlias` stored as `String` in schema but typed as `ModelAlias` union in code. Without consolidation, drift is invisible until runtime.
**How to apply:** String literals at call sites get type-checked against the canonical union. 8 proof points by d6b71b8.

### #14 · DOC-CONFIDENCE-SCALE-NORMALIZE
**Why it exists:** Confidence scores stored at mixed scales (0-1 · 0-100) across 9 schema fields. UI displayed raw values without normalization → user sees "0.87" next to "87" for the same concept.
**How to apply:** `lib/utils/confidence-scale.ts` provides `toPct` / `toFraction`. Schema comments annotate scale per field. UI normalizes via the helper.

### #15 · DOC-EMIT-WITH-PROVENANCE
**Why it exists:** Sylvia memory rows must be self-explaining for audit. Without provenance, "what model · what session · what cost" is lost.
**How to apply:** EventLog payload includes `anchor` + `sylviaSessionId` + `sylviaPromptHash` + `actualCostUsd` + `sylviaMemoryActive` sentinel. Every Sylvia call writes this.

### #16 · DOC-DELEGATE-TO-CANONICAL
**Why it exists:** Re-implementing routing/triage logic per consumer fragments the chokepoint and breaks #10 (TELEMETRY-LOCK).
**How to apply:** Sylvia consumers call `triageAndRoute` (not direct LiteLLM HTTP). 8 consumers ratify the doctrine.

### #17 · DOC-AUDIT-FIRST-WIRE-PATTERN
**Why it exists:** PERPLEXITY-SLOTTING-AUDIT (`1c04560`) defined 8 wire cylinders. Shipping all 8 from one audit (vs ad-hoc) preserves coherence and lets investors point at "audit IS the contract."
**How to apply:** Audit-derived backlogs are atomic units — close 100% of P0+P1 before declaring closure. CEO Wed AM scope decision: 8/8 = contract.

### #18 · DOC-BUILD-MEMORY-BUDGET-CHECK
**Why it exists:** Local `next build` type-check sub-phase hangs on this hardware under memory pressure. STOP-REVERT punishes IT for an environmental constraint, not a code defect.
**How to apply:** When tsc=0 + compile PASS + free pages collapsed + code trivially safe → Fork B (commit + Vercel CI re-validates) is correct. Vercel build is the canonical gate per #18 + sentinel-pair `DOC-VERIFY-VERCEL-AFTER-COMMIT` (candidate).

---

## Glossary

- **BINDING** — a doctrine that has reached enough proof points (typically 5 clean fires) that violating it is an audit failure. Requires explicit `RATIFIES` citation in a commit message.
- **Candidate** — a proposed doctrine with <5 proof points. Lives in the Candidates table; promoted to BINDING when threshold met.
- **Sentinel** — a recently-bound doctrine under heightened watch for the next 5 fires (regression detection).
- **Wire** — admin-facing additive endpoint cloned from a canonical template (Wires A–H = Sonar verifiers).
- **SLOT** — panel-facing additive endpoint that activates Sylvia on a user-visible surface (e.g., AmazonPriceBadge `↻ Live` button).
- **Fork B** — commit-and-let-Vercel-validate path used when local `next build` hangs on memory pressure (per #18).
- **§12** — the canonical post-fire report block emitted at end of every cylinder; mandatory per `feedback_mandatory_v12_emission.md`.
- **Anchor HEAD** — the commit hash a V18 spec was drafted against; cited in §0 of every spec.

---

## Maintenance Log

| Date       | Commit | Action                                 | By      |
|------------|--------|----------------------------------------|---------|
| 2026-05-06 | (this commit) | Initial ledger created · drift reconciled to 18 BINDING | Devin (CMD-DOCTRINE-LEDGER-RECONCILE V18) |

---

**End of DOCTRINE_LEDGER.md**
*Maintained by MC. Future appends via CMD-DOCTRINE-LEDGER-APPEND V18 (template banked).*
