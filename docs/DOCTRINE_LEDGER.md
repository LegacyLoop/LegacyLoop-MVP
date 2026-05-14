# LegacyLoop Doctrine Ledger
## Canonical source of truth for BINDING doctrines

**Maintainer:** MC (Mission Control · Strategy)
**Created:** Wed May 6 2026 AM EDT
**Anchor commit:** `059de07` (HEAD at creation)
**Total BINDING:** 32 (#27 numbering reserved for R25 P3 DOC-CRYPTOGRAPHIC-CONSTANT-TIME-COMPARE pending §12 ship · #32 numbering reserved for DOC-HARDWARE-CAPABILITY-VERIFY 3/5 progressing · #28 + #29 ratified 2026-05-09 · #30 ratified 2026-05-13 · #31 ratified 2026-05-14 AM via CMD-DOCTRINE-LEDGER-RECONCILE V19 R29 P30 · #33 ratified 2026-05-14 PM via CMD-DOCTRINE-LEDGER-APPEND-BINDING-33 V19 R29 P38 · #34 ratified 2026-05-14 PM via CMD-DOCTRINE-LEDGER-APPEND-BINDING-34 V19 R29 P43 · 14 ratifications cumulative this fortnight)
**Updated:** Thu May 14 2026 ~18:00 PM EDT — appended **#34 DOC-VERIFY-COMMIT-SPECIFIC-DEPLOY-READY** (commit pending Wave 6 Slot 2 ship · CMD-DOCTRINE-LEDGER-APPEND-BINDING-34 V19 R29 P43 · ratified from 5/5 sustained across W3 P37 + W4 P38 + P39 + W5 P40 + P41 + W6 P42 widened cite chain · alias-masking gap permanently closed · sub-doctrine of BINDING #21 · 5-probe cold-instance variety added W5 P41 · candidate never formally registered in Candidates · ratified directly from §12 sustain count drift class documented in row) · CLAUDE.md L127 sync 31 → 32
**Updated:** Thu May 14 2026 ~16:30 PM EDT — appended **#33 DOC-FLAG-RIDER-PER-CYLINDER** (commit pending Wave 4 Slot 2 ship · CMD-DOCTRINE-LEDGER-APPEND-BINDING-33 V19 R29 P38 · ratified from 5/5 sustained across W2+W3 6 rider applications · G1-G5 guardrails empirically validated · mechanic baked into V19 master template §5.5 · candidate never formally registered in Candidates section · drift class documented in ratification commit) · CLAUDE.md L127 sync 30 → 31
**Updated:** Thu May 14 2026 ~13:50 PM EDT — appended **#31 DOC-PUSHBACK-WITH-REPLACEMENT** (commit pending Wave 2 Slot 1 ship · CMD-DOCTRINE-LEDGER-RECONCILE V19 R29 P30 · ratified from 21/5+ sustained proof points cumulative R19-R29 · MC Correction 1 anchor · drift-class catch that today's specs cited #31 floating in candidates without canonical move · doctrine cyl closes drift) · CLAUDE.md L127 sync 29 → 30
**Updated:** Wed May 13 2026 ~10:30 AM EDT — appended **#30 DOC-IT-AGENT-DEEP-DIVE-GATE** (commit `50425a5` · CMD-DOCTRINE-LEDGER-APPEND-BINDING-30 V19 R28 P5 · ratified from R28 P4 V19 template §0.5 amendment + 3 canonical fires same day · sub-doctrine of #17 · IT agent must re-verify §0 Devin findings BEFORE FIX 1) · CLAUDE.md L127 sync 28 → 29
**Updated:** Sat May 9 2026 mid-PM EDT — appended **#28 DOC-AUDIT-DOC-DRIFT-CATCH** (CEO discretionary BINDING ratified from 10/5+ sustained proof points · Agent A R25 P3 fresh catches confirm reliability · sub-doctrine of #22) + **#29 DOC-PRE-FIRE-UPSTREAM-PROBE** (5/5 ratified via Agent C R25 P5 HALT 5th cumulative proof point · sub-doctrine of #17) via CMD-DOCTRINE-LEDGER-APPEND-BINDING-29 V19 R25 P7 (gated on Agent B R25 P4 ship `793ce5d`) · CLAUDE.md L127 sync 26 → 28 · #27 numbering reserved for R25 P3 CRYPTO-CTC pending
**Updated:** Thu May 7 2026 LATE EOD EDT — appended **#25 DOC-VERCEL-BUDGET-CAP-20** (`941e3d7` · Thu EOD budget hardening · scraper-parse `*/15`→`0 *` -75% + scrape-pipeline-smoke `0 *`→`0 9 *` -96% · CEO discretionary BINDING per saga-class budget posture lesson · sub-doctrine of #22) · **#26 DOC-NATIVE-VS-CUSTOM-MONITORING-PREFER** (`5edf4c6` · Thu EOD CEO Spend Cap configuration · Vercel native 50/75/100 chosen over custom 90% webhook · CEO discretionary BINDING per saga-class platform-native preference · sub-doctrine of #22) · 3 NEW Day-2 EOD candidates banked: DOC-MCP-INTROSPECTION-FIRST · DOC-GITHUB-EMAIL-DEPLOY-FAILURE-CHECK · DOC-CEO-FRUSTRATION-DE-ESCALATION
**Updated:** Thu May 7 2026 EOD EDT — appended #19 DOC-MALFORMED-ENV-VALUE-CANARY (`dd7aa96`) · #20 DOC-PER-AGENT-WORKTREE (`f7451de`) · #21 DOC-VERIFY-VERCEL-AFTER-COMMIT (`059de07` sentinel origin · 5-proof-point completion via Wed PM → Thu EOD §12 chain) · #22 DOC-MULTI-COMPONENT-CHAIN-GROUNDING (`4c156da` · 7-sibling sub-doctrine canopy) · **#23 DOC-VERCEL-PROJECT-LIVE-CHECK** (`cf242b1` · Thu EOD MCP `get_project.live:false` discovery · 4-day webhook saga root cause class · sub-doctrine of #22) · **#24 DOC-VERCEL-PLAN-LIMIT-VALIDATE** (`cf242b1` · Thu EOD Pro-plan saga resolution · Hobby plan silently rejected `*/15` cron schedules · sub-doctrine of #22)
**Drift detected:** YES — Master Roadmap claimed 16, commit `512b6b9` claimed "→ 20 BINDING", commit `d6b71b8` claimed "17 + #18 = 18 total". Reconciled to 18 at ledger creation. **Now extended to 32 via documented append flow (R29 P30 + P38 + P43 · DOC-PUSHBACK-WITH-REPLACEMENT #31 + DOC-FLAG-RIDER-PER-CYLINDER #33 + DOC-VERIFY-COMMIT-SPECIFIC-DEPLOY-READY #34 ratified 2026-05-14 · alias-masking class permanently closed for §12 cites · doctrine-burndown class closure sustains).**

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

## Canonical Ledger (29 BINDING · #27 reserved · pending R25 P3 CRYPTO-CTC ship)

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
| 17 | DOC-AUDIT-FIRST-WIRE-PATTERN              | `d6b71b8`          | 2026-05-06 | "🎯 RATIFIES DOC-AUDIT-FIRST-WIRE-PATTERN BINDING #17 (8/8 audit §6 P0+P1 closure · 6 admin wires + 2 panel slots · audit IS the contract per CEO Wed AM scope decision)". Pattern proven 8 times across Wires A–H originally · 13 applications cumulative this week (10x R22 P2 HMAC verify audit `9e548351` re-cite · 11x R23 P2 cron-secret constant-time mirror `1752e3e` · 12x R25 FILLER tier-drift audit Agent A `docs/TIER_NAME_DRIFT_AUDIT_2026-05-09.md` · 13x R25 P3 env-contract audit Agent A re-fire 2026-05-09 in-flight at this amendment). |
| 18 | DOC-BUILD-MEMORY-BUDGET-CHECK             | `fb02caa`          | 2026-05-05 | "ratifies by 2nd repetition" · local `next build` type-check sub-phase hangs under memory pressure → Fork B (commit + Vercel CI re-validates) is correct path. See `feedback_build_memory_budget_check.md`. |
| 19 | DOC-MALFORMED-ENV-VALUE-CANARY            | `dd7aa96`          | 2026-05-06 | "ratifies DOC-MALFORMED-ENV-VALUE-CANARY 1st clean application" · LITELLM launcher hardening eval → declare -gx single-block defensive replace · `.env.local` provider key values containing backticks/$()/semicolons no longer eval-interpreted · same export semantics preserved · 1st clean application of canary class · ratification via single-fire post-incident #2 (multi-agent commit-label drift `20bf67a`/`e4cafdf` race window 53s). |
| 20 | DOC-PER-AGENT-WORKTREE                    | `f7451de`          | 2026-05-06 | "banks NEW DOC-PER-AGENT-WORKTREE candidate (1/5 proof point) · BINDING after 5 clean parallel-cylinder fires post-RYAN-SIDE-setup" · structural fix supersedes DOC-OWN-SCOPE-COMMIT-ISOLATION (PRECHECK-only INVALIDATED by Round 12 Incident #3). 8+ clean parallel-worktree fires Wed PM → Thu EOD (R13 P1+P2+P3 · R14 P1+P2+P3 · R15 P1+P2 · R16 P0+P1+P2 · R17 P0+P1+P2 · R18 P1 · R19 P0+P1+P2). 5-proof-point ceiling exceeded with disjoint-surface guarantee. |
| 21 | DOC-VERIFY-VERCEL-AFTER-COMMIT            | `059de07`          | 2026-05-06 | "banks NEW DOC-VERIFY-VERCEL-AFTER-COMMIT (verify Vercel deploy state via mcp__vercel__list_deployments before claiming Round closure · NOT relying on local tsc alone · 1st proof point this hotfix · ratifies BINDING after 5 clean Vercel verifies post-commit)" · sentinel origin at hotfix · `feedback_verify_vercel_after_commit.md` codifies the rule · 15+ commits Wed PM → Thu EOD cite sentinel verbatim in §12 boxes (READY + curl 200/200 OR honest deferral when webhook stalled · sentinel survives gap honestly). 5-proof-point completion via PARTIAL APPLY chain. |
| 22 | DOC-MULTI-COMPONENT-CHAIN-GROUNDING       | `4c156da`          | 2026-05-07 | "🎯 DOC-MULTI-COMPONENT-CHAIN-GROUNDING candidate ADVANCES 6/5 (parent doctrine · re-author IS the meta-fix in action · substrate types verbatim cited §0 BEFORE drafting consumer code · LIKELY RATIFIES BINDING on this clean fire · 5-proof-point ceiling exceeded with re-author quality bar)" · Devin meta-fix RATIFIES via R17 P0 PATH A re-author. The pattern works on its author. Parent doctrine canopy · 7 sibling sub-doctrines decompose surface into specific verification classes (substrate-types · audit-doc claims · env/config files · registry-vs-actual · worktree client · spec authoring · API capacity). Each sibling ratifies independently. |
| 23 | DOC-VERCEL-PROJECT-LIVE-CHECK             | `cf242b1`          | 2026-05-07 | Thu EOD MCP discovery during 4-day webhook saga. `mcp__vercel__get_project` returned `"live": false` flag · Path 4 GitHub-integration disconnect+reconnect re-installed OAuth shell but did NOT flip `live` back to true · production aliases stay on last-good READY deployment while NEW deploys silently blocked. Sub-doctrine of #22. Discovery procedure: every Vercel-deploy debug session checks `get_project.live` flag FIRST before any noop-wake attempt · if false → diagnose pause OR plan-limit class before further action. Discretionary BINDING per CEO authority (single-occurrence canonical lesson · same precedent as #18 ratifying on 2nd repetition · saga-impact warrants formalization). |
| 24 | DOC-VERCEL-PLAN-LIMIT-VALIDATE            | `cf242b1`          | 2026-05-07 | Thu EOD Pro-plan saga ROOT CAUSE. Hobby plan limits cron schedules to 1/day max (`0 X * * *` patterns only). `vercel.json` `*/15 * * * *` schedules from R15 P1 + R16 P2 + R19 P0 cron entries exceeded plan limit · Vercel REJECTED build creation pre-build-create at plan-validation layer · NO failed-deploy entry surfaced in Deployments tab · 4-day diagnostic saga investigated wrong layer (webhook delivery vs plan-tier rejection class). CEO Pro upgrade @ ~13:30 EDT removed `*/15` rate-cap · webhook fired immediately on next push (`cf242b160f46`) · build SUCCEEDED in 145s · 13 backlogged commits coalesced into single READY deploy. How to apply: before adding ANY cron schedule to vercel.json · validate against active plan tier (Hobby = 1/day max · Pro = `*/15 *` etc · Enterprise unlimited) · fail-fast in spec §0 grounding · NEVER assume plan supports schedule frequency. Sub-doctrine of #22. Discretionary BINDING per CEO authority (saga-impact + structural-class root cause warrants formalization). |
| 25 | DOC-VERCEL-BUDGET-CAP-20                  | `941e3d7`          | 2026-05-07 | Thu LATE EOD CEO directive · Vercel monthly spend = $20/month hard cap · pause-on-overage configured · 50/75/100 native thresholds + 4 channels (SMS+Email+Push+Web) · scraper-parse `*/15`→`0 * * * *` -75% reduction (96/day → 24/day · function execution risk minimized) + scrape-pipeline-smoke `0 *`→`0 9 * * *` -96% reduction (720/month → 30/month) · 6 other crons unchanged (already daily/weekly/monthly · within budget) · CEO discretionary BINDING per saga-class budget posture lesson · sub-doctrine of #22 · operationalized via `scripts/cron-validate.sh` (R21 P1 · BINDING #24 first ratification proof point) · sibling of #24 (saga-class compound: #23 + #24 + #25 + #26 prevents recurrence). |
| 26 | DOC-NATIVE-VS-CUSTOM-MONITORING-PREFER    | `5edf4c6`          | 2026-05-07 | Thu LATE EOD CEO Spend Cap configuration decision · Vercel native 50/75/100 thresholds + 4 channels (SMS+Email+Push+Web) accepted in lieu of custom 90% webhook · 75% threshold gives ~$5 buffer (~1-2 days at our scale) before 100% pause-on-overage · custom webhook adds complexity for marginal precision gain · discipline: prefer platform-native when 90%+ coverage achieved · CEO discretionary BINDING per saga-class platform-native preference lesson · sub-doctrine of #22 · sibling of #25 (paired budget-discipline decisions ratified same day). |
| 28 | **DOC-AUDIT-DOC-DRIFT-CATCH**             | `<R25 P7 ship hash>` | 2026-05-09 | CEO discretionary BINDING ratified from sustained 10/5+ proof points cumulative this week (R18 P1 PhotoBot + R19 P1 VideoBot + R20 P1 docstring + R21 P0 5-drift-catch + R23 P1 51→52 inline + R24 Z formal sweep + R24 P1 BudgetTracker API drift + 19fc4e8 graphify-out empty-diff catch + 2026-05-09 R25 FILLER Agent A help-articles white-glove name+cap drift + 2026-05-09 R25 P1 v1 Agent C audit-path mismatch + 2026-05-09 R25 P1 v1 Agent C env-prefix namespace drift + 2026-05-09 R25 P3 Agent A v1 phantom-7-key env drift + 2026-05-09 R25 P3 Agent A LITELLM_GATEWAY_URL localhost-fallback gap + 2026-05-09 R25 P7 maintenance-log placeholder-vs-shipped-hash drift caught inline by IT). Audit-doc claims re-grep-verified at R+1 spec authoring · drift catches replaced inline via DOC-PUSHBACK-WITH-REPLACEMENT discipline · pattern matured into doctrine identity · ratifies on Agent A R25 P3 fresh catches confirming reliability under sustained adversarial spec drafting. **Sub-doctrine of #22.** **#27 DOC-CRYPTOGRAPHIC-CONSTANT-TIME-COMPARE reserved for R25 P3 ship (CRYPTO-CTC candidate · numbering preserves R25 P3 §12 ratification window · count = 26 + 2 = 28 BINDING regardless · #27 fills on R25 P3 commit OR remains numbering gap if R25 P3 verdict skips ratification).** |
| 29 | **DOC-PRE-FIRE-UPSTREAM-PROBE**           | `<R25 P7 ship hash>` | 2026-05-09 | Pre-fire diagnostic gate · catches upstream blockers BEFORE burning curls/tokens/deploys. 5/5 ratification accumulated 2026-05-08 + 2026-05-09: (1) R24 P2 (2026-05-08) HALTed cleanly when `curl POST /api/sylvia/consensus → HTTP 500` because `SYLVIA_API_INTERNAL_SECRET` missing from Vercel prod env · auth helper fail-closed at "Server misconfigured" · pre-fire probe pattern saves wasted deploys + token burn. (2) R25 FILLER 2026-05-09 Agent A pre-fire grep before audit-doc author (caught white-glove drift early). (3) R25 P2 2026-05-09 Agent B 5-gate pre-flight halt on Vercel `live:false` saved n8n trigger waste + curl burst against unverified gate. (4) R25 P1 v1 2026-05-09 Agent C 4-blocker pre-flight halt saved 4 wrong env adds + 2 broken curls. (5) **R25 P5 2026-05-09 Agent C HALT** caught Agent A R25 FILLER tier-drift audit doc not on origin/main · §9 #7 trip · ZERO source touched · saved attempted edit on stale base = 5th cumulative proof point. Sub-doctrine of #17 DOC-AUDIT-FIRST-WIRE-PATTERN (audit-before-wire generalizes to probe-before-fire). Candidate banked R24 P2 · ratified R25 P5 · this cylinder R25 P7 appends BINDING. |
| 30 | **DOC-IT-AGENT-DEEP-DIVE-GATE** | `<R28 P5 ship hash>` | 2026-05-13 | IT must re-verify §0 Devin findings empirically BEFORE FIX 1 · §0.5 banner mandatory at top of every V19 FIRE spec · §12 PART A IT DEEP-DIVE CONFIRMATION sub-section required · ratifies-on-landing per CEO + MC + IT trio review 2026-05-13 · empirical pattern validated by 4 Wed AM Devin §0 push-backs catching reality drift pre-spec (Cloudflare DNS · `00_Identity` slot · `/goal` non-existence · agent-memory 3-package reality + 4th candidate rohitg00 surfaced by Agent A audit). Sub-doctrine of #17 DOC-AUDIT-FIRST-WIRE-PATTERN (audit-before-wire generalized to IT-side pre-FIX-1 re-verify gate). Sibling of #29 DOC-PRE-FIRE-UPSTREAM-PROBE (Devin-side probe at spec-author surface · #30 mirrors discipline at IT-execute surface). CEO discretionary BINDING per trio-review authority (single-session canonization · 4 empirical proof points from same-day Devin push-backs satisfy ratification threshold). |
| 31 | **DOC-PUSHBACK-WITH-REPLACEMENT**         | `29a9d9c` (R19 P2 first canonical fire 2026-05-07) | 2026-05-14 (R29 Wave 2 ratify) | 21/5+ sustained cumulative across R19-R29 · spec authors who push back on directive ALWAYS author substitute path inline · prevents abandoned-spec class · today Wave 1 alone added 3 cites (Slot 2 verdict B replacement · Slot 3 .env exclusion replacement · CEO Option A recovery choice). Sub-doctrine of CEO push-back authority. Ratified per Sat 2026-05-10+ MC tracking sub-table at ratify-ready threshold. CEO 2026-05-14 PM directive: "BINDING #31 ratify-ready · ratify in same cyl" (MC Correction 1 anchor). |
| 33 | **DOC-FLAG-RIDER-PER-CYLINDER**           | `<R29 P38 ratify · 2026-05-14>` | 2026-05-14 (R29 Wave 4 Slot 2 ratify) | 5/5 sustained · 6 rider applications W2+W3 (W2 P30 silent-bank G5 + W2 P31 GREEN + W2 P32 GREEN + W3 P33 GREEN + W3 P34 partial G5 + W3 P35 GREEN) · G1-G5 guardrails empirically validated · runtime ≤5 min · scope disjoint · backlog-only G3 · §0.5 silent-bank G4 · NEVER halts primary G5 (MC G5 add 2026-05-14 PM). Mechanic baked into V19 master template §5.5 (W2 P32). NOTE: candidate never formally registered in Candidates section · ratified directly from §12 sustain count across rider cyls · drift class itself documented in this ratification commit. #27 + #32 still reserved gaps. CEO 2026-05-14 PM directive · MC G5 add · sub-doctrine extension class. |
| 34 | **DOC-VERIFY-COMMIT-SPECIFIC-DEPLOY-READY** | `<R29 P43 ratify · 2026-05-14 PM>` | 2026-05-14 (R29 Wave 6 Slot 2 ratify) | 5/5 sustained · 6 cyl applications across W3 P37 + W4 P38 + P39 + W5 P40 + P41 + W6 P42 widened cite chain. Sub-doctrine of BINDING #21 DOC-VERIFY-VERCEL-AFTER-COMMIT. §12 BINDING #21 cite MUST include (a) commit SHA matches deploy SHA · (b) THIS commit's `dpl_<id>` status = Ready · (c) curl on affected route fast · NEVER alias root curl as Ready proxy (alias serves last-good · masks errored deploys). Birth point: W3 P35 §12 cited curl 200 as BINDING #21 satisfied · BUT shipped commit's deploy ERRORED · curl 200 was served by prior Ready dpl at alias · drift caught W3 P37 §0.5 audit · doctrine emerged. W5 P41 §12 added 5-probe cold-instance variety pattern · empirically proving warm-instance singleton cache reuse across cold lambdas. NOTE: candidate never formally registered in Candidates section · ratified directly from §12 sustain count (same drift class as #31 + #33). #27 + #32 still reserved gaps. CEO 2026-05-14 PM directive · MC verified P38+P40+P41+P42 cite chain. |

---

## Candidates (NOT yet BINDING · awaiting proof points)

### Probe Resolution · R29 P33 (2026-05-14) · CMD-DOCTRINE-CANDIDATE-PROBE V19

Master Backlog §K Ambiguity #1 resolved · 5 floating 5/01 PM candidates classified:

| Candidate (Master Backlog claim) | Class | Resolution |
|---|---|---|
| **DOC-COMPONENT-EXTRACT-BYTE-FIDELITY** | 🔴 NEVER-REGISTERED | Zero matches in ledger · zero memory file · zero template ref · zero Commands grep. Master Backlog §K claim NOT corroborated by ledger evidence. Premise CORRECTED. Banked as new candidate row below IF Devin/CEO wants to register fresh. |
| **DOC-CONFIDENCE-SCALE-NORMALIZE** | 🟢 RATIFIED-CONFIRMED | Already **BINDING #14** in canonical table (L52 · `512b6b9` 2026-05-02). Not floating. Master Backlog §K stale read. |
| **DOC-PRE-STAGE-NON-IDP-PREFETCH** | 🟢 RATIFIED-CONFIRMED | Already **BINDING #5** in canonical table (L43 · `f968ad3` 2026-05-01). Not floating. Master Backlog §K stale read. |
| **DOC-SMOKE-FRESH-CACHE-VERIFY** | 🔴 NEVER-REGISTERED | Zero matches in ledger · zero memory file · zero template ref · zero Commands grep. Master Backlog §K claim NOT corroborated. Premise CORRECTED. Banked as new candidate row below IF Devin/CEO wants to register fresh. |
| **DOC-SPEC-GROUNDING-VERIFY** | 🟢 RATIFIED-CONFIRMED | Already **BINDING #7** in canonical table (L45 · `f968ad3` 2026-05-01). Not floating. Master Backlog §K stale read. |

**Verdict:** Master Backlog §K Ambiguity #1 drift class CLOSED · 3 of 5 already RATIFIED canonical BINDING (#5 · #7 · #14) · 2 of 5 NEVER-REGISTERED (no 5/01 evidence in ledger or memory · premise was incorrect read). Zero BINDING count change this cyl. Future spec citations of these 5 names MUST cross-ref canonical BINDING numbers · NEVER treat as floating candidates.

| Candidate                                  | First proof point | Required for BINDING | Status |
|--------------------------------------------|-------------------|----------------------|--------|
| DOC-NEXTJS-DYNAMIC-ROUTE-PARAM-NAME        | `059de07` (May 6) | 3 clone-pattern fires post-pattern-bind | SUPERSEDED by DOC-NEXTJS-DYNAMIC-SEGMENT-CONSISTENCY (wrong-layer hotfix `059de07` changed param TYPE when actual control was directory NAME · real fix `a969546` rename + `.next` purge) |
| DOC-NEXTJS-DYNAMIC-SEGMENT-CONSISTENCY     | `a969546` (May 6) | 5 clean fires across cloned route handlers | NEW (1/5 proof · supersedes DOC-NEXTJS-DYNAMIC-ROUTE-PARAM-NAME) |
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
| DOC-MCP-INTROSPECTION-FIRST               | this commit (Thu LATE EOD R21 P2 · saga catalyst · 4-day saga investigated wrong layer when MCP `Vercel:get_project.live` would have ruled out webhook class instantly · codifies V19 §A7 BINDING #23 EXPANSION applies broadly to ANY platform debugging · sub-doctrine of #22) | After 4 more spec-author cycles cite MCP-first introspection in §0 grounding (across Slack · GitHub · Stripe · n8n etc) | NEW · 1/5 |
| DOC-GITHUB-EMAIL-DEPLOY-FAILURE-CHECK     | this commit (Thu LATE EOD R21 P2 · saga teaching · Vercel sends deployment failure emails to commit author with subject pattern "Vercel deployment failure for legacy-loop-mvp" · would have surfaced plan-tier rejection within minutes vs 4 days of dashboard archaeology · short-circuits webhook-stall diagnostic class · sub-doctrine of #22) | After 4 more email-signal-caught failures (or first save vs no-email-check baseline) | NEW · 1/5 |
| DOC-CEO-FRUSTRATION-DE-ESCALATION         | this commit (Thu LATE EOD R21 P2 · V19 §A10 codified Day 2 EOD pattern · cost of false-positive trivial vs false-negative compounding spiral · ONE concrete question OR ONE concrete action · drop emoji density · drop preamble · bullets only · drop praise openers · sub-doctrine of #22) | After 4 more spec-author cycles cite de-escalation discipline in voice/tone | NEW · 1/5 |
| DOC-OWN-SCOPE-COMMIT-ISOLATION             | (May 6) | (was 5 proof points) | SUPERSEDED by BINDING #20 DOC-PER-AGENT-WORKTREE (Round 12 Incident #3 invalidated PRECHECK-only mechanism · structural fix replaces · `f7451de`) |

---

## Sub-doctrine canopy under BINDING #22 · DOC-MULTI-COMPONENT-CHAIN-GROUNDING (Devin meta-fix · 7 siblings)

Parent BINDING #22 maps "code chain grounding" surface end-to-end. Sibling sub-doctrines decompose into specific verification classes. Each ratifies independently as proof points accumulate; all strengthen parent canopy.

| Sub-doctrine                              | First proof point | Score | Surface |
|-------------------------------------------|-------------------|-------|---------|
| DOC-SUBSTRATE-RETURN-SHAPE-VERIFY         | `4c156da` (May 7 · PATH A re-author) | 2/5 | substrate types verbatim cited in §0 before drafting consumer code |
| DOC-AUDIT-DOC-DRIFT-CATCH                 | `7e2976b` (May 7 · PhotoBot 16 vs 20) | **PROMOTED → BINDING #28** (2026-05-09 R25 P7) | audit-doc claims re-grep-verified at R+1 spec authoring · 10/5+ sustained ratified BINDING #28 via CMD-DOCTRINE-LEDGER-APPEND-BINDING-29 V19 R25 P7 · see #28 row in main BINDING table |
| DOC-WORKTREE-INFRA-PARITY-PRECHECK        | R15 P1 first-attempt HALT · `3c64fcf` (May 7 · CF-40 closure) | 2/5 | env/config file parity at worktree creation/reset |
| DOC-CRON-REGISTRY-PARITY-VERIFY           | `1a0cd16` (May 6 · `recon-autoscan` orphan surfaced) · `29a9d9c` (May 7 · empirical 9-vs-8 drift) | 2/5 | registry-vs-actual cross-check (vercel.json crons · etc) |
| DOC-PRISMA-GENERATE-POST-DB-PUSH          | `1a0cd16` (May 6 · stale Prisma client caught) | 1/5 | worktree client refresh after schema add |
| ~~DOC-PUSHBACK-WITH-REPLACEMENT~~ → **RATIFIED BINDING #31** 2026-05-14 (CMD-DOCTRINE-LEDGER-RECONCILE V19 R29 P30) | R19 P2 `29a9d9c` (May 7 · first proof) | 21/5+ SUSTAINED → **CANONICAL #31** | see canonical table row #31 |
| DOC-PARALLEL-IT-RATE-LIMIT-OBSERVATION (NEW · Day 2 AM) | Day 2 AM (May 7 · Anthropic API throttle on parallel-fire of 3 IT agents) | 1/5 | API capacity awareness · sequential-fire fallback IS the mitigation |
| DOC-PRE-FIRE-UPSTREAM-PROBE (NEW · banked R24 P2 HALT 2026-05-08) | R24 P2 HALT 2026-05-08 (banked) | **PROMOTED → BINDING #29** (2026-05-09 R25 P7) | spec authors and IT agents probe upstream invariants BEFORE drafting/firing · 5/5 ratified via Agent C R25 P5 HALT 5th proof point · BINDING #29 ratified via CMD-DOCTRINE-LEDGER-APPEND-BINDING-29 V19 R25 P7 · see #29 row in main BINDING table |
| DOC-VERCEL-LIVE-FLAG-TIER-SCOPE (NEW · 2026-05-09 amendment of BINDING #23) | 2026-05-09 CMD-DOCTRINE-LEDGER-AMEND-LIVE-FLAG V19 R25 P4 (this cylinder · CEO research confirmed Pro-tier no Pause toggle · `live: false` benign on Pro · STOP scoped to Hobby) | 1/5 | tier-aware Vercel live-flag interpretation · ratifies BINDING after 5 clean Pro-tier deploys without false-HALT · sibling of #23 |

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
| 2026-05-07 | DOC-NATIVE-VS-CUSTOM-MONITORING-PREFER | `5edf4c6` | 26              |
| 2026-05-07 | DOC-VERCEL-BUDGET-CAP-20          | `941e3d7` | 25                   |
| 2026-05-07 | DOC-VERCEL-PLAN-LIMIT-VALIDATE    | `cf242b1` | 24                   |
| 2026-05-07 | DOC-VERCEL-PROJECT-LIVE-CHECK     | `cf242b1` | 23                   |
| 2026-05-07 | DOC-MULTI-COMPONENT-CHAIN-GROUNDING | `4c156da` | 22                  |
| 2026-05-07 | DOC-VERIFY-VERCEL-AFTER-COMMIT    | `059de07` | 21                   |
| 2026-05-07 | DOC-PER-AGENT-WORKTREE            | `f7451de` | 20                   |
| 2026-05-07 | DOC-MALFORMED-ENV-VALUE-CANARY    | `dd7aa96` | 19                   |
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

### #19 · DOC-MALFORMED-ENV-VALUE-CANARY
**Why it exists:** Wed AM 2026-05-06 multi-agent commit-label drift incident #2 surfaced that LiteLLM launcher script's `eval "$(printf...)"` could interpret `.env.local` provider key values containing backticks, `$()`, or semicolons as shell commands. Class of side-channel risk where malformed env values become canary indicators of broader env-handling fragility.
**How to apply:** Replace `eval` patterns with safer constructs (e.g., `while IFS='=' read -r KEY VALUE; do declare -gx "$KEY=$VALUE"; done <<< "$KEY_LINES"`) for env-var hydration. Same export semantics preserved. Future env-handling cylinders MUST audit for malformed-value canary class before shipping.

### #20 · DOC-PER-AGENT-WORKTREE
**Why it exists:** Two production multi-agent commit-label drift incidents in 5 days (Round 11 `ca0bbd7` 2026-05-06 AM Cyl 2C scooped Cyl 2B staged files + Round 12 #2 `20bf67a`/`e4cafdf`/`dd7aa96` 2026-05-06 11:11 EDT 53s race window with 3 parallel agents). PRECHECK alone (BINDING #12) detects foreign pre-staged paths but cannot prevent COMMIT-FIRE race. Structural fix needed.
**How to apply:** Per-agent git worktrees (`/Users/ryanhallee/legacy-loop-mvp-agent-{1,2,3}/`) — each agent has its own `.git/index`. Race class permanently closed by structural isolation. Daemon QUARTET (Ollama · LiteLLM · Open WebUI · stay-awake) stays anchored to main worktree path. Helper scripts: `scripts/worktree-setup.sh` · `scripts/worktree-reset.sh N` · `scripts/agent-ship.sh` (FF-push only · NO `--force` class). 8+ clean parallel-cylinder fires Wed PM → Thu EOD ratify. SUPERSEDES candidate DOC-OWN-SCOPE-COMMIT-ISOLATION (PRECHECK-only mechanism INVALIDATED by Round 12 Incident #3).

### #21 · DOC-VERIFY-VERCEL-AFTER-COMMIT
**Why it exists:** May 6 production-red incident — local `tsc=0` + `git push` ≠ production deployed. Round 10 declared closed but Wire G `f2e4715` + Wire H `d6b71b8` were Vercel ERROR; production stayed on `08f67fc`. Root cause: cloned route handler kept stale param type `{itemId}` when destination path segment was `[id]` · Next.js typedRoutes RouteHandlerConfig is build-time-only · local tsc passes · Vercel build fails. Hotfix `059de07`.
**How to apply:** Every §12 claiming production work landed MUST cite Vercel deploy state explicitly via `mcp__vercel__list_deployments` (or honest deferral when webhook stalled). Pattern: cite `dpl_<id>` READY + commit hash match + curl HTTP=200 against root + curl HTTP=200 against item-detail (for UI surfaces) OR honest deferral with backlog count. `feedback_verify_vercel_after_commit.md` codifies the rule. 15+ commits Wed PM → Thu EOD cite sentinel verbatim in §12 boxes (PARTIAL APPLY through deploy-deferred chain · sentinel survives webhook gap honestly).

### #22 · DOC-MULTI-COMPONENT-CHAIN-GROUNDING
**Why it exists:** Devin meta-fix banked from May 6 grounding-gap retrospective (R13 P2 + R14 P0 + R14 P3 + R17 P0 first-attempt HALTs all surfaced spec-author drift catching architectural assumptions BEYOND the entry point of the cited surface). The pattern caught its own author at R17 P0 first-attempt HALT (Wed EVE) where Devin drafted FIX 2 against a hypothetical merged result shape; actual substrate at `bot-ai-router/types.ts:367-437` returned RAW `{primary: {rawResult}, secondary?, geminiWebSources, costUsd, actualCostUsd, latencyMs, degraded, error?}` requiring caller-side `mergeConsensus`/`calcAgreement` from LOCKED `multi-ai.ts`.
**How to apply:** Every spec touching existing surfaces grep-verifies the FULL chain end-to-end at HEAD · cites verbatim line numbers in §0 · never trusts audit-doc claims as canonical (DOC-AUDIT-DOC-DRIFT-CATCH). Read actual substrate input AND return-type interfaces verbatim before drafting consumer code (DOC-SUBSTRATE-RETURN-SHAPE-VERIFY). Verify infrastructure parity for env/config files at worktree creation/reset (DOC-WORKTREE-INFRA-PARITY-PRECHECK). Cross-check registry-vs-actual for vercel.json crons / CLAUDE.md LOCKED file lists / etc (DOC-CRON-REGISTRY-PARITY-VERIFY). Refresh worktree Prisma client after `prisma db push` (DOC-PRISMA-GENERATE-POST-DB-PUSH). On chain-grounding push-back, ALWAYS author substitute spec inline (DOC-PUSHBACK-WITH-REPLACEMENT). Watch for Anthropic API throttle on parallel-fire of 3+ IT agents · sequential-fire fallback IS the mitigation (DOC-PARALLEL-IT-RATE-LIMIT-OBSERVATION). **Verify Vercel project `live` flag during deploy debug (DOC-VERCEL-PROJECT-LIVE-CHECK · #23 · Day 2 EOD discovery). Validate cron schedules against active plan tier BEFORE adding to vercel.json (DOC-VERCEL-PLAN-LIMIT-VALIDATE · #24 · Day 2 EOD root cause).** RATIFIES via R17 P0 PATH A re-author `4c156da` — substrate types VERBATIM cited in §0 BEFORE drafting consumer code · pattern works on its author. **The canopy is the operational decomposition; #22 is the parent doctrine. #23 + #24 promote from sub-doctrine candidates to full BINDING per CEO authority on Day 2 EOD post-saga-resolution.**

### #23 · DOC-VERCEL-PROJECT-LIVE-CHECK
**Why it exists:** Day 2 EOD MCP-driven diagnostic discovery during 4-day webhook saga. Devin called `mcp__vercel__get_project` on prj_br8eXVFqKFbZLvKczG6JkvYgwVg2 and observed `"live": false` flag. CEO had run Path 4 (Disconnect+Reconnect GitHub integration from Vercel Settings → Git) but `live: false` survived the reconnect — re-installed OAuth shell but didn't flip the flag. Production aliases stayed on last-good READY deployment (`dpl_2KYcMtTED` for source `61cdbec`) while NEW pushes (noop wakes `04074b3` · `d726a33` · `1f21b3b` · `d447cbc`) created NO new deployment entries. The flag IS the diagnostic.
**How to apply:** Every Vercel-deploy debug session begins with `mcp__vercel__get_project` → check `live` flag FIRST. If `live: false`: diagnose pause class OR plan-limit class BEFORE attempting noop-wake (which exhausts after 1 success and won't unlock the underlying state). Resolution paths: Dashboard Settings → General → Resume button OR `POST /v1/projects/{projectId}/unpause` API call OR plan upgrade if rate-cap is the cause. **Sub-doctrine of #22.**

**Amendment 2026-05-09 (Sat · CEO research · CMD-DOCTRINE-LEDGER-AMEND-LIVE-FLAG V19 R25 P4):**
The `live: false` STOP gate applies ONLY to Hobby-tier projects which expose
the "Pause Project" toggle in Settings → General. Pro-tier projects do NOT
have a Pause Project toggle and `live: false` is a benign API property in
that tier (likely a placeholder for future paused-state semantics). When
`get_project.live === false`:

- IF Hobby tier: HALT cylinder · check Pause Project toggle · escalate per §A7
- IF Pro tier: cite as PRE-FLIGHT OBSERVATION · proceed if other gates pass · do NOT HALT

Empirical evidence (this amendment): legacy-loop-mvp on Pro plan returned
`live: false` for 4+ days while serving 20/20 deploys READY · curl 200
throughout · CEO dashboard research (2026-05-09) confirmed no Pause toggle
exists for Pro-tier projects.

**Ratifies sub-doctrine:** DOC-VERCEL-LIVE-FLAG-TIER-SCOPE 1/5 NEW (banked under #22 canopy · ratifies BINDING after 5 clean Pro-tier deploys without false-HALT).

### #24 · DOC-VERCEL-PLAN-LIMIT-VALIDATE
**Why it exists:** Day 2 EOD ROOT CAUSE of the 4-day webhook saga. Hobby plan limits Vercel cron schedules to **1/day maximum** (`0 X * * *` patterns only · zero `*/N` patterns accepted). Our `vercel.json` had `*/15 * * * *` (R15 P1 scraper-parse) + `0 * * * *` (R16 P2 scrape-pipeline-smoke hourly) + 6 other schedules accumulated through R14-R19 fires. Hobby silently REJECTED build creation at the plan-validation layer · NO failed-deploy entry surfaced in Deployments tab · diagnostics for 4 days investigated wrong layer (webhook delivery · GitHub integration health · `live: false` paused-state) when actual cause was plan-tier rejection-pre-build-create. CEO Pro upgrade @ ~13:30 EDT Thu removed the `*/15` rate-cap. First push post-upgrade (`cf242b160f46`) fired webhook → Vercel accepted → build SUCCEEDED in 145s → 13 backlogged commits coalesced into single READY deploy `dpl_7GidCK7wf6DihBgPDQ2gjDcpDNY6`. The diagnostic invisibility (rejected pre-create vs failed mid-build) IS the doctrine surface.
**How to apply:** Before adding ANY cron schedule to `vercel.json` · validate the schedule against the active plan tier:
- **Hobby:** 1/day max (`0 X * * *` only · NO `*/N`)
- **Pro:** `*/15 *` and below acceptable
- **Enterprise:** unlimited

Fail-fast in spec §0 grounding table. NEVER assume plan supports schedule frequency. R19 P2 cron registry parity audit doc gets Day 3 update annotating Pro plan tier requirement for `*/15` schedules. **Sub-doctrine of #22.**

### #25 · DOC-VERCEL-BUDGET-CAP-20
**Why it exists:** Thu LATE EOD CEO directive locks Vercel monthly spend at $20/month hard cap. Saga taught us once · doctrine prevents recurrence forever. Pre-deploy budget hardening (`941e3d7`) cut scraper-parse `*/15`→`0 *` (-75%) + scrape-pipeline-smoke `0 *`→`0 9 *` (-96%). Spend Cap configured pause-on-overage at 100% · native 50/75/100 thresholds + 4 channels (SMS+Email+Push+Web). Operationalized via `scripts/cron-validate.sh` (R21 P1 BINDING #24 first ratification).
**How to apply:** ANY Vercel cron addition / route consumer / always-fire AI bot in spec authoring requires §0 grounding "Budget impact" row citing expected $/month delta. >5% monthly cap impact (>$1) → flag in §13 GAPS for CEO sign-off. 75% threshold = post Slack heads-up · suggest workload review. 100% threshold = pause-on-overage triggers (saga-class incident). Validate cron schedules against active plan tier BEFORE adding to vercel.json (paired with #24). **Sub-doctrine of #22.**

### #26 · DOC-NATIVE-VS-CUSTOM-MONITORING-PREFER
**Why it exists:** Thu LATE EOD CEO Spend Cap configuration decision. Vercel offers native 50/75/100% thresholds with 4 notification channels (SMS+Email+Push+Web). Custom 90% webhook would add complexity for marginal precision gain. 75% threshold = ~$5 buffer (~1-2 days at our scale) before 100% triggers · sufficient response window. Discipline: when platform-native monitoring covers 90%+ of need · prefer it over custom builds. Time saved > marginal precision.
**How to apply:** Before building any custom monitoring webhook / dashboard / alert · check platform-native equivalent first. If native covers 90%+ of need · use native. Reserve custom builds for genuine gap cases (no native equivalent · or native materially insufficient). Cite native-vs-custom tradeoff in §0 grounding when decision arises. Sibling of #25 (paired budget-discipline · same CEO Spend Cap configuration decision). **Sub-doctrine of #22.**

### #28 · DOC-AUDIT-DOC-DRIFT-CATCH
**Why it exists:** CEO discretionary BINDING ratified 2026-05-09 mid-PM after 10/5+ sustained proof points cumulative this week. Pattern catches drift between spec authors' assumptions/audit-doc claims and actual source-of-truth (code · schema · file paths · env namespaces · API surface · placeholder hashes). Without this discipline · specs encode hypothetical states that diverge from HEAD reality · IT cylinders fire against phantom assertions · §12 reports drift becomes load-bearing. Agent A R25 P3 fresh catches (v1 phantom-7-key env namespace + LITELLM_GATEWAY_URL localhost-fallback gap) plus R25 P7 inline maintenance-log placeholder-vs-shipped-hash drift catch confirm reliability under sustained adversarial spec drafting.

**How to apply:** Every spec author re-greps audit-doc claims at R+1 against actual repo HEAD before citing as canonical. Every IT cylinder pre-edit-grep cites verbatim line numbers from current source · NEVER trusts audit-doc claim verbatim. When drift caught · push back with replacement inline (DOC-PUSHBACK-WITH-REPLACEMENT) and §12 FLAG cites the catch. 10+ proof points enumerated in BINDING table row #28 cell. **Sub-doctrine of #22 DOC-MULTI-COMPONENT-CHAIN-GROUNDING.**

### #29 · DOC-PRE-FIRE-UPSTREAM-PROBE
**Why it exists:** R24 P2 (2026-05-08) HALTed cleanly because pre-fire probe caught `SYLVIA_API_INTERNAL_SECRET` missing from Vercel prod env · auth helper fail-closed at "Server misconfigured" · saved wasted deploy + token burn. 5/5 cumulative proof points accumulated by 2026-05-09 R25 P5 Agent C HALT (5th = caught Agent A R25 FILLER audit doc not on origin/main · §9 #7 trip · ZERO source touched · saved attempted edit on stale base). Pattern generalizes BINDING #17 (audit-before-wire) to: probe-before-fire · upstream-gate-state-before-FIX-assertions.

**How to apply:** Every spec with deploy-dependent assertions runs upstream-gate verification in §6 BUILD HARNESS pre-flight gates: Vercel `mcp__vercel__get_project` (cite live + plan tier + latestDeployment) · env var counts via grep -cE (BINDING #5 compliant) · downstream service health via curl HEAD · external dependency reachability · receiver health endpoints · auth gate fail-closed validation. HALT on ANY pre-flight gate failure · cite gap explicitly in §12 · do NOT mask with retry logic. CEO/Devin resolves gate · cylinder re-fires from clean tree. Empirical proof points (5/5):
1. R24 P2 (2026-05-08) — caught SYLVIA_API_INTERNAL_SECRET missing pre-deploy
2. R25 FILLER (2026-05-09 Agent A) — caught white-glove drift via grep before audit-doc author
3. R25 P2 (2026-05-09 Agent B) — 5-gate pre-flight halt on Vercel `live:false` saved n8n trigger waste
4. R25 P1 v1 (2026-05-09 Agent C) — 4-blocker pre-flight halt saved 4 wrong env adds + 2 broken curls
5. R25 P5 (2026-05-09 Agent C) — caught Agent A audit doc untracked on main · saved attempted edit on stale base

**Sub-doctrine of:** #17 DOC-AUDIT-FIRST-WIRE-PATTERN (audit-before-wire generalizes to: probe-before-fire). Sibling of #22 chain-grounding canopy.

### #30 · DOC-IT-AGENT-DEEP-DIVE-GATE
**Why it exists:** CEO + MC + IT trio review 2026-05-13 caught the implicit §0.5 gap in the V19 spec template. Devin authors §0 grounding empirically; until 2026-05-13, that discipline lived only on the spec-author side. IT agents were trusted to re-verify §0 findings at fire-time but the obligation was implicit, not structural. Four same-day Devin push-backs (Cloudflare DNS reality · `00_Identity` slot non-existence · `/goal` command non-existence · agent-memory 3-npm-package reality + 4th candidate `rohitg00` surfaced by Agent A audit) proved the pattern works at spec-author surface. §0.5 banner makes the same discipline explicit at IT-execute surface BEFORE FIX 1 mutates state.

**How to apply:** Every V19 FIRE spec carries §0.5 MANDATORY IT DEEP-DIVE GATE banner immediately after §0. IT agent MUST (1) re-read §0 Devin findings · (2) independently re-verify empirical claims against current HEAD (grep counts · anchor strings · Vercel state · env counts via BINDING #5 grep -cE) · (3) surface any divergence inline as PIVOT REV · (4) HALT-PRE-FIX-1 if drift material · (5) report in §12 PART A "IT DEEP-DIVE CONFIRMATION" sub-section with ☑/☒ checkboxes per claim. Zero divergence → proceed FIX 1. Material drift (e.g. peer cylinder already mutated state) → HALT · investigate · pivot. CEO directive supersedes.

**Empirical proof points (4 same-day Wed AM 2026-05-13):**
1. Cloudflare DNS Devin §0 push-back — caught DNS already configured before install spec drafted
2. `00_Identity` Sylvia slot Devin §0 push-back — caught slot did not exist on substrate
3. `/goal` slash-command Devin §0 push-back — caught command non-existence pre-doc
4. agent-memory evaluation (CMD-AGENT-MEMORY-EVALUATE V19 §12) — CEO single-package assumption resolved to 3 npm packages + 4th `rohitg00` `@agentmemory/agentmemory` as real target via Agent A audit · 4-candidate decision matrix replaced single-package install spec

**Sub-doctrine of:** #17 DOC-AUDIT-FIRST-WIRE-PATTERN (audit-before-wire generalizes to IT-side pre-FIX-1 re-verify gate). Sibling of #29 DOC-PRE-FIRE-UPSTREAM-PROBE (#29 = Devin-side spec-author surface · #30 = IT-side execute surface · same discipline at two surfaces).

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
| 2026-05-06 | (initial) | Initial ledger created · drift reconciled to 18 BINDING | Devin (CMD-DOCTRINE-LEDGER-RECONCILE V18) |
| 2026-05-07 | (this commit) | CMD-DOCTRINE-LEDGER-APPEND V18 · CF-36 OVERDUE closure · #19 DOC-MALFORMED-ENV-VALUE-CANARY (`dd7aa96`) + #20 DOC-PER-AGENT-WORKTREE (`f7451de`) + #21 DOC-VERIFY-VERCEL-AFTER-COMMIT (`059de07`) + #22 DOC-MULTI-COMPONENT-CHAIN-GROUNDING (`4c156da`) + **#23 DOC-VERCEL-PROJECT-LIVE-CHECK (`cf242b1` · Thu EOD `live:false` MCP discovery)** + **#24 DOC-VERCEL-PLAN-LIMIT-VALIDATE (`cf242b1` · Thu EOD Pro-plan saga root cause)** appended · 7-sibling sub-doctrine canopy under #22 added to Candidates · 2 NEW Day-2 candidates (DOC-PUSHBACK-WITH-REPLACEMENT · DOC-PARALLEL-IT-RATE-LIMIT-OBSERVATION) banked · DOC-OWN-SCOPE-COMMIT-ISOLATION marked SUPERSEDED by #20 · DOC-NEXTJS-DYNAMIC-ROUTE-PARAM-NAME marked SUPERSEDED by DOC-NEXTJS-DYNAMIC-SEGMENT-CONSISTENCY · Total BINDING 18 → 24 (6 ratifications in single closure cylinder · CEO discretionary BINDING for #23 + #24 saga-class lessons) | Devin (CMD-DOCTRINE-LEDGER-APPEND V18) |
| 2026-05-07 | (this commit) | CMD-LEDGER-APPEND-SAGA V19 · R21 P2 · saga-class doctrine ratification · #25 DOC-VERCEL-BUDGET-CAP-20 (`941e3d7` · CEO discretionary BINDING per saga budget posture) + #26 DOC-NATIVE-VS-CUSTOM-MONITORING-PREFER (`5edf4c6` · CEO discretionary BINDING per platform-native preference) appended · 3 NEW Day-2 EOD candidates banked (DOC-MCP-INTROSPECTION-FIRST · DOC-GITHUB-EMAIL-DEPLOY-FAILURE-CHECK · DOC-CEO-FRUSTRATION-DE-ESCALATION) · CLAUDE.md L686 env-var name drift fixed (TURSO_DATABASE_URL → TURSO_CONNECTION_URL · canonical match to lib/db.ts L28+L38+L49 · CF-14 closure since R14 P2) · Total BINDING 24 → 26 | Devin (CMD-LEDGER-APPEND-SAGA V19) |
| 2026-05-09 | `793ce5d` | CMD-DOCTRINE-LEDGER-AMEND-LIVE-FLAG V19 R25 P4 · BINDING #23 amended Pro-tier scope (live:false benign on Pro · STOP scoped to Hobby · sub-doctrine DOC-VERCEL-LIVE-FLAG-TIER-SCOPE banked 1/5 NEW under #22 canopy) · DOC-AUDIT-DOC-DRIFT-CATCH advanced 2/5 → 10/5 sustained (3 catches today · Agent A help-articles + Agent C audit-path + Agent C env-prefix · CEO discretionary BINDING #28 candidate · ratifies on next clean catch) · DOC-PRE-FIRE-UPSTREAM-PROBE NEW candidate added 1/5 → 4/5 (3 ratifications today · Agent A + B + C · ratifies BINDING on next clean pre-fire catch · likely R26) · BINDING #17 application count 8 → 13 this week (10x R22 P2 + 11x R23 P2 cron-secret + 12x R25 FILLER tier-drift + 13x R25 P3 env-contract in-flight) · Total BINDING unchanged at 26 (R25 P3 may concurrent ratify #27 CRYPTO-CTC if §12 lands first · this cylinder leaves CLAUDE.md count untouched per ELSE path) | Devin (CMD-DOCTRINE-LEDGER-AMEND-LIVE-FLAG V19 R25 P4 · IT agent-3) |
| 2026-05-09 | `<R25 P7 ship hash>` | CMD-DOCTRINE-LEDGER-APPEND-BINDING-29 V19 R25 P7 · BINDING #29 DOC-PRE-FIRE-UPSTREAM-PROBE ratified (5/5 cumulative · Agent C R25 P5 HALT 5th proof point · sub-doctrine of #17) + BINDING #28 DOC-AUDIT-DOC-DRIFT-CATCH ratified (10/5+ sustained · CEO discretionary · Agent A R25 P3 fresh catches confirm reliability · sub-doctrine of #22) · Per-Doctrine Detail blocks for #28 + #29 added · Total BINDING 26 → 28 (#27 numbering reserved for R25 P3 DOC-CRYPTOGRAPHIC-CONSTANT-TIME-COMPARE pending §12 ship · numbering preserves R25 P3 ratification window) · CLAUDE.md L127 sync 26 → 28 · Sub-doctrine canopy under #22: DOC-AUDIT-DOC-DRIFT-CATCH PROMOTED to BINDING (out of canopy) · DOC-PRE-FIRE-UPSTREAM-PROBE PROMOTED to BINDING (out of canopy) · LIVE-FLAG-TIER-SCOPE remains 1/5 banked · L366 prior maintenance log row placeholder `<commit hash post-ship>` PUSHBACK-FIXED inline to actual ship hash `793ce5d` (DOC-AUDIT-DOC-DRIFT-CATCH meta-recursive proof point · catches its own placeholder drift · contributes 13th sustained cite for #28) · Gated on Agent B R25 P4 ship to main first via `bash scripts/agent-ship.sh 3` · pre-fire verified `git log origin/main \| grep DOCTRINE-LEDGER-AMEND-LIVE-FLAG` returned 1 hit | Devin (CMD-DOCTRINE-LEDGER-APPEND-BINDING-29 V19 R25 P7 · IT agent-3) |
| 2026-05-13 | `<R28 P5 ship hash>` | CMD-DOCTRINE-LEDGER-APPEND-BINDING-30 V19 R28 P5 · BINDING #30 DOC-IT-AGENT-DEEP-DIVE-GATE ratified-on-landing (CEO + MC + IT trio review 2026-05-13 · 4 same-day Wed AM Devin §0 push-backs satisfy proof threshold · Cloudflare DNS · `00_Identity` slot · `/goal` non-existence · agent-memory 3-package reality + 4th `rohitg00` candidate via Agent A audit · sub-doctrine of #17 · sibling of #29 at IT-execute surface) · Per-Doctrine Detail block for #30 added · Canonical Ledger header 28 → 29 BINDING · CLAUDE.md L127 sync 28 → 29 · V19 template PART A3 + PART D §0.5 banner + PART D §12 box IT DEEP-DIVE CONFIRMATION sub-section + PART E §12 reviewer checklist 1b amended this session (4 edits landed pre-cylinder) · 3-way drift reconciled (template + ledger + CLAUDE.md count) | Devin/IT (CMD-DOCTRINE-LEDGER-APPEND-BINDING-30 V19 R28 P5 · IT main) |

---

**End of DOCTRINE_LEDGER.md**
*Maintained by MC. Future appends via CMD-DOCTRINE-LEDGER-APPEND V18 (template banked).*
