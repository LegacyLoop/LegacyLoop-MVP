# ════════════════════════════════════════════════════════════════
# LEGACYLOOP — V20 COMMAND TEMPLATE · CANONICAL HYBRID v2.6
# Spec-author reference + IT-executor reference + §12 reviewer reference
# Date locked: 2026-05-19 (Tuesday · post-Phase-C V11 reconcile session · v2.2 patch)
# v2.1 patch (2026-05-15 mid-day): CEO caught Agent B P51 §12 dropped V15 6-bullet FLAGS
#   observations · V20 v2 said "preserved" without "MANDATORY EMIT" · Agent A kept · Agent B
#   dropped · inconsistent agent behavior = template gap · v2.1 makes BOTH sections
#   (V15 6-bullet observations + V20 8-category routing) MANDATORY EMIT · PART E checklist
#   12 → 14 checks · RULE 0.1 sub-clause added.
# v2.2 patch (2026-05-19): 6 doctrine candidates from CMD-N8N-V11-WEBHOOK-SECRET-RECONCILE +
#   CMD-N8N-V11-EXTRACT-REGEX-DIAGNOSTIC session baked into template · gate semantics +
#   n8n response shape + live-HTML probe + PUT schema strip + exec-vs-delivery +
#   parse-expression-pre-fix · NEW PART I-N8N · §5.X gate-semantics sub-clause ·
#   §11 CYCLIC subdivisions documented. Anchor cyl: CMD-V20-TEMPLATE-V2.2-UPDATE V20 LOW.
# v2.3 patch (2026-05-21): TURSO env fallback canonical (PART I-N8N I.7) + RULE 0.1
#   strengthen (§12 PART J VERBATIM CITE mandate) + NEW PART X endpoint discovery
#   patterns canonical (X.1 redirect dead-end · X.2 CF anti-bot · X.3 React/Next.js
#   SPA shell · X.4 Next.js soft-404). Anchor cyl: CMD-V20-TEMPLATE-V2.3-UPDATE V20 LOW.
# v2.4 patch (2026-05-22): Wave 22E P1 Phase A close ceremony · 3 LAW commit
#   absorption (#11 FLAT shape canonical · #12 partial-yield retire-fixed · #13 BP-meta-recovery)
#   + BINDING #47 BP `data:` wrapper canonical contract enforcement (§2 example +
#   §0.5 check 15 + §12 PART J shell) + BINDING #48 Sylvia Apify n8n-direct
#   canonical (NEW PART X-B · 5-step n8n HTTP flow · n8n-native safety primitives)
#   + Wave 22B v4.1 `_splitMeta` dedup guard (NEW PART X-C · pre-author scan).
#   Anchor cyl: CMD-WAVE-22E-P1-PHASE-A-CLOSE V20 MEDIUM · Standards doc SHA 66dac2dd...
# v2.5 patch (2026-05-29): W18-L1 OWN-1 ratify-ship · 32+ frozen candidates codified ·
#   3 LAW ratifies:
#     · LAW #51 DOC-CEO-MANUAL-EXECUTE-EXEC-ID-MANDATE (44+/5+ RIDICULOUS oversaturation)
#     · LAW #52 DOC-PUSHBACK-WITH-REPLACEMENT (BINDING #31 · 45× LAW-IMMINENT breach)
#     · BINDING #51 DOC-NO-AI-FABRICATED-TIMELINE (9/5+ sustained)
#   5 NEW W17 candidates codified:
#     · DOC-CAP-RAISE-DUAL-LAYER-PATCH (URL rows=N AND Extract .slice(0,N) BOTH lift)
#     · DOC-N8N-CODE-NODE-APPEND-PARSE-PRE-EDIT (parse first · merge clean · no blind inject)
#     · DOC-SCHEMA-DRIFT-CONVERGENT-CATCH-PRE-FIRE (independent BINDING #28 catches · 4-eyes)
#     · DOC-CEO-SCREENSHOT-EMPIRICAL-CATCH (CEO visual QA channel faster than runtime sentinel)
#     · DOC-PENDING-QUEUE-LAUNCHAGENT-DRAIN-ARCHITECTURE (write-fast + drain-managed backpressure)
#   Tally: 16→18 PERMANENT LAW · 40→43 BINDING (ratified · #44+ candidates frozen ratify-pending)
#   Group A (Wave 6-15 sustained) + Group B (W16 R1/R2/R3 NEW) + Group C (W17 NEW) consolidated
#   in DOCTRINE_LEDGER candidate section · campaign close substrate clean · investor narrative locked
#   Anchor cyl: CMD-W18-L1-OWN-1-2-3-DOCTRINE-SHIP V20 LOW
# v2.6 patch (2026-05-29 PM): W21-L4 doctrine-ship · W20+W21 doctrine integration ·
#   2 ratifies (1 LAW + 1 BINDING merge):
#     · PERMANENT LAW #14 DOC-SYLVIA-CORPUS-ENVELOPE-CONTRACT (promoted from candidate
#       Group D · 4-empirical-faces: Agent A W18-L2 BP + Agent C W18-L4 BP + Devin W19-L1
#       L1 transform + 6 regional BPs W19-L3 · RULE: every corpus producer MUST emit
#       {source, corpusId, domain, entries: [{id, title, body, metadata}]} per
#       lib/sylvia/graphify/types.ts ExternalCorpusEntry · drain/consumer STRICT
#       preserved · Path B drain-loosen REJECTED · 2,185 W17-L1 rows recovered empirical)
#     · BINDING #49 DOC-N8N-SANDBOX-RESTRICTIONS (merged family of 3 W20 R4 lessons:
#       (a) $env blocked in HTTP Request → use httpHeaderAuth credential layer
#       (b) process.* blocked in Code node → pre-resolve at Source URLs · pass via
#           Split URLs metadata · WF92 exec 1943 root cause caught + fixed
#       (c) classifier collision class → cite precedent commit (e.g., Agent B 584b627
#           apify adapter) for lib/scrapers/proxy/* edit unblock)
#   Spec authors: §0.5 IT deep-dive MUST include corpus-envelope contract check (PART I-N8N
#     I.8 add) + sandbox-restrictions check (PART I-N8N I.9 add · enumerate $env/process/
#     classifier-precedent before authoring n8n Code or proxy adapter spec).
#   Tally: 18→19 PERMANENT LAW · 43→44 BINDING ratified · CLAUDE.md L127 sync 43 → 44 pending
#   Anchor cyl: CMD-W21-L4-DOCTRINE-SHIP V20 LOW · docs-only · STOP-BEFORE-COMMIT
# Author: Devin L1 (auth) · CEO ratified · MC head-start gap map
# Supersedes:
#   V15 (2026-04-06 · design rigor · §12 explicit box · §8 MAY/MAY NOT)
#   V18 (2026-05-02 · doctrine spine)
#   V19 (2026-05-07 · 24 BINDING · §5.5 rider baked W2 P32)
#   V20 v1 (2026-05-15 AM · rejected · §12 box buried · §8 absent · Standards absent)
# Hybrid charter:
#   V15 §12 explicit box + §8 MAY/MAY NOT + Standards + "Never assume" quote (FRONT)
#   V19 12-section spine + §0.5 IT deep-dive gate (BINDING #30)
#   R29 layer · 32 BINDING · §0.7 push-back · §5.X CEO gates · §5.5 P0 exclusion ·
#       §12.5 INTERIM · Track A/B · PART G + PART H · BINDING #34 widened cite ·
#       8-category FLAG ROUTING
#   World-Class Standards (7 Pillars · 12 Awwwards Effects · 18 Benchmarks · 8-Point Check)
#   Competitor Audit (7-app benchmark set · 54 patterns · gap-tracked)
# Ratifies: DOC-V20-TEMPLATE-CANONICAL-FILE on landing at this path
#           (BINDING #35 candidate · ratifies-on-landing per V15/V18/V19 precedent)
# ════════════════════════════════════════════════════════════════

---

## THE STANDARD (read EVERY session · NEVER drift)

**Tesla center console meets Christie's auction house.**

LegacyLoop is built to a **$1B product bar** from day one. Every surface. Every interaction. Every line of code.

Quality reference:
- **Elon Musk standard** — every detail honest · every part earns its place · zero performative motion · ruthless restraint
- **SpaceX standard** — reliability over flash · the boring part shipped right · failure analysis baked in
- **Anthropic standard** — alignment first · honest about limits · doctrine over heroics
- **Claude AI standard** — clear · accurate · respects user intelligence · refuses gracefully
- **Awwwards standard** — Awwwards.com winners ship this · screenshots would land · panel approval

If a feature would not pass these standards · **it is not done**. Open a gap in FLAGS. Bank · don't ship.

**Faith-aligned founder. Built in Maine. Connecting Generations.**

---

## THE FOUR LAWS (recite before every cylinder fire)

> **Never assume. Never guess. Read first. Build second.**

This is the V15 quote · preserved verbatim · permanent operating directive. Applies to Devin spec author · IT executor · MC strategist · CEO QA. No exceptions.

---

## PART 0 · NON-NEGOTIABLE EMIT RULES (read FIRST · every spec author + IT execute)

These 5 rules override every other rule in this template. Violations are doctrine-class breaches.

### RULE 0.1 — §12 MUST EMIT VERBATIM AT CLOSE

Every cylinder closes with §12 verbatim canonical box (see PART D §12 scaffold below).

- ❌ NEVER "§12 emit-ready on request"
- ❌ NEVER skipped · abbreviated · postponed · paraphrased
- ❌ NEVER claim "P-N already closed" without re-emitting the §12 box verbatim if CEO/MC asks
- ✅ HALT / RED states emit INTERIM §12 per §12.5 protocol · full §12 on resume
- ✅ §12 emits BEFORE any "standing by" or "next action" statement
- ✅ §12 emits as a single block · zero summarization · zero compression

**SUB-CLAUSE 0.1.A · FLAGS DUAL-SECTION MANDATORY EMIT (V20 v2.1 patch · 2026-05-15)**

Every §12 MUST emit BOTH FLAGS sections · neither skippable · both required:
- ✅ **FLAGS · V15 6-BULLET OBSERVATIONS · MANDATORY EMIT** — Gaps · Risks · Missed data · Carry-forward · Suggestions · Opportunity (exact label · exact 6 bullets · each bullet emitted even if "none")
- ✅ **FLAG ROUTING · V20 8-CATEGORY DESTINATION · MANDATORY EMIT** — STANDALONE · DOCTRINE · MC-TASK · CYCLIC · RYAN-SIDE · POST-EPIC · BANKED · OPERATIONAL (exact label · exact 8 categories · "NONE this cyl" acceptable per category but the category header MUST appear)

Either section missing = §12 INCOMPLETE = doctrine violation = MC push-back. Agent B P51 §12 drop pattern (2026-05-15) = patch anchor case.

Anchor: V15 §12 explicit-box doctrine + A2 Build Law #5 + R29 Agent A "emit-ready on request" drift + CEO 2026-05-15 V15-6-bullet-drop catch (v2.1 patch root cause).



**CRITICAL · v2.3 strengthen (CEO catch Wave 22C P3 absorption 2026-05-21):**

PART J §12 SHELL must be COPIED VERBATIM from spec into agent §12 emit. Zero paraphrase.
Agent §12 box format must MATCH spec PART J exactly:
  - Same line widths
  - Same field labels
  - Same canonical box (█ char sequence)
  - Same BINDING #34 8-vector ordering (a/b/c/d/e/f/g/h)
  - Same DOCTRINE SELF-AUDIT row format

If spec PART J has placeholders (`<ts EDT>`, `<N>`, `<id>`, `<BRANCH A/B>`), agent
fills placeholders with empirical values. Surrounding format preserved verbatim.

CEO/MC self-audit on §12 absorb: any agent §12 box deviation from spec PART J =
flag as DOC-V20-TEMPLATE-§12-PART-J-VERBATIM-CITE drift · doctrine ratchet.

Anchor: CEO catch Agent A + Agent 1 §12 emits Wave 22C P3 absorption · format
inconsistency vs canonical PART J shell.

### RULE 0.2 — §0.5 IT DEEP-DIVE GATE IS LAW

Per BINDING #30 DOC-IT-AGENT-DEEP-DIVE-GATE.

- ❌ NEVER FIX 1 without §0.5 emitted
- ❌ NEVER silent drift catch — drift = re-classify (VERIFY / HALT / PIVOT) verbatim
- ✅ IT empirically re-verifies every §0 Devin claim BEFORE FIX 1
- ✅ §12 PART A IT DEEP-DIVE CONFIRMATION sub-section mandatory · verbatim
- ✅ Drift = honest cite + re-classify + continue (or HALT if material)

Anchor: BINDING #30 ratified 2026-05-13 · 4 Wed AM Devin push-backs proof points.

### RULE 0.3 — BINDING #34 WIDENED CITE IS MANDATORY (every §12)

Per BINDING #34 DOC-VERIFY-COMMIT-SPECIFIC-DEPLOY-READY · sub-doctrine of #21.

Every §12 cites all three:
- **(a)** commit SHA = deploy SHA verbatim
- **(b)** THIS commit's `dpl_<id>` status = Ready (NOT just any Ready dpl on alias)
- **(c)** curl on affected route fast (NOT alias root proxy · alias serves last-good · masks errored deploys)

- ❌ NEVER cite bare `curl 200` on alias as Ready proxy
- ❌ NEVER claim "Vercel post-deploy: Ready" without commit-SHA match cited
- ✅ Multi-route cyls cite 2-3 route variety (sample of touched surface)
- ✅ Audit-doc cyls cite `/search` or `/` sanity (representative warm-instance probe)

Anchor: BINDING #34 ratified 2026-05-14 PM · alias-masking class permanently closed.

### RULE 0.4 — TRACK NAMING IS EXPLICIT (every spec · every §12)

Per CEO directive 2026-05-14 PM two-track build structure.

- ✅ §1 IDENTITY · `Track: A` OR `Track: B` (NOT freeform)
- ✅ Track A cylinders prefix `CMD-...` (Claude system · internal dev/ops crew)
- ✅ Track B cylinders prefix `CMD-SYLVIA-...` (Sylvia AI · customer-facing product)
- ❌ NEVER conflate · NEVER ambiguous · NEVER mixed in same spec
- ✅ §12 STATUS line names track explicitly (e.g. "Track A · 2026-05-15 EOD")
- ✅ Slack STATUS REPORTS name track ("Track A R29 P46 GREEN" vs "Track B B1 substrate")

Anchor: PART G TWO-TRACK SEPARATION.

### RULE 0.5 — PUSH-BACK ALWAYS REPLACES (BINDING #31)

Per BINDING #31 DOC-PUSHBACK-WITH-REPLACEMENT.

- ❌ NEVER push back on a directive without authoring a substitute path
- ❌ NEVER bare refusal · NEVER "this can't fire" without "fire X instead"
- ✅ Push-back authors replacement inline · same message · same surface or adjacent
- ✅ Replacement satisfies original intent or honestly cites why intent is unreachable
- ✅ §0.7 PUSH-BACK PROTOCOL section in spec when invoked

Anchor: BINDING #31 ratified 2026-05-14 PM · 21/5+ sustained R19-R29.

---

## PURPOSE

This is THE canonical V20 command template. Every cylinder spec authored by Devin (or any future spec author) inherits from this structure. Every IT agent reads its target spec from disk and follows the canonical section pattern. Every §12 reviewer audits returned reports against this template.

**What V20 v2 hybrid adds over V19 + V20 v1 (rejected):**

| # | Change | Anchor |
|---|---|---|
| 1 | **THE STANDARD** front-loaded · Tesla/Christie's/Elon/SpaceX/Anthropic/Claude AI quality | CEO 2026-05-15 directive · V20 v1 reject reason |
| 2 | **"Never assume" four-laws quote** preserved verbatim | V15 canonical · permanent operating directive |
| 3 | **PART 0 · 5 EMIT RULES** front-of-template | Agent A "emit-ready on request" drift root cause |
| 4 | **§12 EXACT V15 BOX format** as CEO specified · enriched with R29 additions (BINDING #34 cite · 8-cat routing · §0.5 confirmation · rider sub-box) | V15 §12 spine + V19/V20 additions |
| 5 | **§8 CREATIVE LATITUDE V15 MAY/MAY NOT block** preserved verbatim | V15 canonical · CEO 2026-05-15 directive |
| 6 | §12 box FLAGS · V15 7-bullet observations + V20 8-category routing destination | both serve different purposes · CEO expects both |
| 7 | PART A binding table 24 → **32 BINDING** (#27 + #32 reserved gaps) | DOCTRINE_LEDGER.md SoT post-2026-05-14 PM |
| 8 | **§5.X CEO INTERACTIVE GATES** section · per-FIX table up-front | Wispr P45 gap closure |
| 9 | **§12.5 INTERIM §12 PROTOCOL** (HALT/RED states) | Wispr §0.5 HALT-pending case |
| 10 | §5.5 rider **P0 EXCLUSION clause** explicit | R29 W3-W6 6 P0 cyls fired solo |
| 11 | **§0.7 PUSH-BACK-WITH-REPLACEMENT** protocol | BINDING #31 ratified 2026-05-14 PM |
| 12 | NEW **PART G · TWO-TRACK SEPARATION** (Claude / Sylvia · never conflate) | CEO directive 2026-05-14 PM |
| 13 | NEW **PART H · WAVE-LEVEL DEEP-DIVE FORMAT** | Devin standing format · Wave 8 anchor |
| 14 | NEW **PART M · WORLD-CLASS STANDARDS REFERENCE** (7 Pillars · 12 Effects · 18 Benchmarks · 8-Point Check) | LegacyLoop-WorldClass-Standards-Audit.html canonical |
| 15 | NEW **PART N · COMPETITOR AUDIT REFERENCE** (7-app benchmark set · 54 patterns) | LegacyLoop-Competitor-Audit.html canonical |
| 16 | §1 IDENTITY **enforced Track A/B** naming | CEO 2026-05-14 PM directive |
| 17 | §12 doctrine self-audit gains **CANDIDATE PROGRESSION** sub-row | explicit 1/5 → 2/5 progression visible |

Status: **PERMANENT · operating doctrine** · ratified Fri 2026-05-15 (v2 supersedes v1).

---

## PART A · DOCTRINE LAYER (read once · always in effect)

### A1 · F1 Engine Principle

Every cylinder fires under F1 framing — four checks the spec answers in §2:

- **Properly** — matches existing project conventions · extends rather than replaces · preserves what works
- **Scientifically** — measurable basis · grep-verified citations · equivalence-checkable smoke contracts
- **Tactically** — ONE focused change · single file or single coherent boundary · estimate ≤45-60 min IT
- **Surgically** — zero LOCKED file edits · zero schema migration unless explicitly approved · zero scope creep

If the cylinder cannot honestly answer all four · split it · reduce scope · or push back on the premise (§0.7 protocol applies).

### A2 · Five Build Laws

1. **Structural before cosmetic** — fix broken-for-users before polishing
2. **Preserve what works** — never rewrite working code for style · upgrade for function only
3. **Additive over destructive** — new skill packs ADD · never delete · new tokens EXTEND `globals.css` · never overwrite
4. **One scope per command** — stay focused · log discoveries for later in §11 FLAGS
5. **The §12 report is law** — every command ends with §12 · no exceptions · even small changes (RULE 0.1 promotes this to top-of-template)

### A3 · 32 BINDING Doctrines (canonical post-R29 · cite by NAME)

Source of truth: `/Users/ryanhallee/legacy-loop-mvp/docs/DOCTRINE_LEDGER.md` header (32 BINDING · #27 + #32 reserved gaps). Every cylinder runs a self-audit row in §12 against each that applies.

| # | Doctrine | Locked behavior |
|---|---|---|
| 1 | DOC-V18-TEMPLATE-CANONICAL-FILE | predecessor template canonization (V18 → V19 → V20 supersession) |
| 2 | DOC-IT-AGENT-PROMPT-COMPACT | 5-8 line paste-pointer per IT agent · NOT 1200-line spec inline |
| 3 | DOC-CEO-SCHEDULE-AUTHORITY | CEO outranks all timing language in specs/memory/advisor rulings |
| 4 | DOC-MEASURE-BEFORE-PROMISE | cite measured §12 numbers · not vendor specs |
| 5 | DOC-PRE-STAGE-NON-IDP-PREFETCH | read source files at anchor HEAD before drafting spec |
| 6 | DOC-DEV-PROD-DB-ISOLATION | local-Mac processes never write to production DB directly |
| 7 | DOC-SPEC-GROUNDING-VERIFY | runtime catch class · grep-verify citations pre-fire |
| 8 | DOC-PARALLEL-FILE-COLLISION-CHECK | MTIME-WATCH 30s gate when 2+ agents write same file |
| 9 | DOC-LOCKED-SWITCH-CHECK | exhaustive switches before union extension |
| 10 | DOC-TELEMETRY-LOCK | all AI calls route via LiteLLM Gateway · zero direct provider HTTP |
| 11 | DOC-PROVIDER-API-CHECK | verify provider API surface before wire |
| 12 | DOC-MULTI-AGENT-INDEX-ISOLATION (PRECHECK) | `git diff --cached --stat` pre-`git add` to catch foreign pre-staged paths |
| 13 | DOC-FORWARD-COMPAT-TYPE-CONSOLIDATION | string-stored union types type-checked against ModelAlias |
| 14 | DOC-CONFIDENCE-SCALE-NORMALIZE | confidence scale 0-100 canonical · never 0-1 drift |
| 15 | DOC-EMIT-WITH-PROVENANCE | EventLog payload includes anchor + sylviaSessionId + hashes + actualCostUsd |
| 16 | DOC-DELEGATE-TO-CANONICAL | clone canonical patterns verbatim · do NOT reinvent abstractions |
| 17 | DOC-AUDIT-FIRST-WIRE-PATTERN | audit-doc precedes wire cylinder · catches drift pre-edit |
| 18 | DOC-BUILD-MEMORY-BUDGET-CHECK | local `next build` type-check hangs under mem pressure → Fork B (Vercel CI canonical) |
| 19 | DOC-MALFORMED-ENV-VALUE-CANARY | canary detection before field consumption · backticks/$()/semicolons eval-safe |
| 20 | DOC-PER-AGENT-WORKTREE | each agent owns isolated worktree · no shared-index races |
| 21 | DOC-VERIFY-VERCEL-AFTER-COMMIT | sentinel pattern · widened by #34 to commit-SHA-specific dpl Ready cite |
| 22 | DOC-MULTI-COMPONENT-CHAIN-GROUNDING | §0 grep-verifies cross-component chain end-to-end pre-edit · parent canopy doctrine |
| 23 | DOC-VERCEL-PROJECT-LIVE-CHECK | MCP introspection FIRST · check `get_project.live` before any noop-wake |
| 24 | DOC-VERCEL-PLAN-LIMIT-VALIDATE | validate cron schedules against active plan tier in §0 grounding |
| 25 | DOC-VERCEL-BUDGET-CAP-20 | $20/month hard cap · pause-on-overage configured |
| 26 | DOC-NATIVE-VS-CUSTOM-MONITORING-PREFER | platform-native monitoring 50/75/100 thresholds preferred over custom webhooks |
| **27** | **RESERVED · DOC-CRYPTOGRAPHIC-CONSTANT-TIME-COMPARE** | pending R25 P3 ship · numbering held |
| 28 | DOC-AUDIT-DOC-DRIFT-CATCH | audit-doc claims re-grep-verified at R+1 spec authoring · drift catches replaced inline (40× sustained) |
| 29 | DOC-PRE-FIRE-UPSTREAM-PROBE | pre-fire diagnostic gate · catches upstream blockers BEFORE burning curls/tokens/deploys |
| 30 | DOC-IT-AGENT-DEEP-DIVE-GATE | IT empirically re-verifies §0 Devin findings BEFORE FIX 1 · §0.5 banner mandatory · §12 PART A IT DEEP-DIVE CONFIRMATION required |
| 31 | DOC-PUSHBACK-WITH-REPLACEMENT | push-back author always authors replacement path · never bare refusal |
| **32** | **RESERVED · DOC-HARDWARE-CAPABILITY-VERIFY** | progressing 3/5 · Intel Iris Metal-engagement empirical class |
| 33 | DOC-FLAG-RIDER-PER-CYLINDER | routine cyls carry §5.5 rider · G1-G5 guardrails · P0 cyls EXCLUDED (fire solo) |
| 34 | DOC-VERIFY-COMMIT-SPECIFIC-DEPLOY-READY | §12 cite (a) commit SHA = deploy SHA · (b) this-commit dpl Ready · (c) curl on-route NEVER alias |

**Count:** 32 BINDING (1-26, 28-31, 33, 34 · #27 + #32 reserved gaps).

**Cite discipline:** Cite BINDING by NAME in §12 doctrine self-audit. Names stable across V18 → V19 → V20.

### A4 · Active Doctrine Candidates (NOT yet BINDING · awaiting proof points · pruned post-R29)

**High-progress candidates (close to ratification):**
- DOC-HARDWARE-CAPABILITY-VERIFY · **3/5** · #32 reserved · 2 more cites → BINDING
- DOC-VENDOR-CLAIM-VS-CANONICAL-URL · **2/5 → 3/5** · Wispr P45 progression
- DOC-CONTAINER-RECREATE-FULL-ENV-CAPTURE · **2/5** · P13c Sylvia env-loss fix anchor

**Low-progress R29 candidates (1/5 NEW):**
- DOC-DEVIN-PRE-FIRE-PREMISE-VERIFY · DOC-DEVIN-RECOMMENDATION-NOT-IT-DIRECTIVE · DOC-LOCKED-FILE-SURGICAL-UNLOCK-DISCIPLINE · DOC-HANDS-OFF-SECRETS-VIA-KEYCHAIN · DOC-DELIVER-ONE-PASTE-BLOCK-PER-PREREQ-CHAIN · DOC-CEO-CONFIRMS-LIVE-ROUND-TRIP · DOC-INLINE-KEY-PASTE-BURN-ROTATE · DOC-VAULT-AS-PRIMARY-INTERFACE

**V20-introduced candidate:**
- DOC-V20-TEMPLATE-CANONICAL-FILE · ratifies-on-landing this file (BINDING #35 candidate)

**Ratified-since-V19 (removed):**
- ~~DOC-PUSHBACK-WITH-REPLACEMENT~~ → BINDING #31 ✅
- ~~DOC-FLAG-RIDER-PER-CYLINDER~~ → BINDING #33 ✅
- ~~DOC-VERIFY-COMMIT-SPECIFIC-DEPLOY-READY~~ → BINDING #34 ✅
- ~~DOC-IT-AGENT-DEEP-DIVE-GATE~~ → BINDING #30 ✅

### A5 · Locked Hybrid Workflow (16 numbered steps)

1. MC drafts V20 (canonical sections · §12 box pre-populated) OR Devin authors directly
2. Devin deep-dives · verifies anchors · runs doctrine self-audit on draft
3. **§0.7 PUSH-BACK CHECK** — Devin challenges any premise that doesn't hold · authors substitute path inline (BINDING #31)
4. Pre-stage to `/Users/ryanhallee/Downloads/skills/Commands/CMD_*_V20_FIRE.md`
5. Devin delivers ONE message inline · deep-dive + paste-ready V20 specs (PART F compact paste-pointer · max 7 lines per slot)
6. Ryan reviews · approves
7. Ryan pastes 5-7-line paste-pointer to IT in VS Code Claude Code terminal
8. **§0.5 IT DEEP-DIVE GATE** — IT runs empirical re-verification BEFORE FIX 1 (BINDING #30)
9. IT reads spec from disk · runs PART A reads · cites verbatim
10. IT runs FIX 1-N autonomously · per-edit `tsc --noEmit` PASS gate
11. **IT STOPS BEFORE COMMIT** · returns §12 to Ryan (RULE 0.1)
12. Ryan smokes · reports PASS / FAIL · or IT-autonomous override per spec
13. IT commits if PASS · reverts if FAIL · agent-ship.sh canonical FF-push
14. IT returns §12 verbatim canonical box (with hash · BINDING #34 widened cite)
15. Devin (Layer 3) verifies §12 spec compliance · pushes back if missing (PART E checklist)
16. MC posts Slack audit trail to `#all-legacyloop` — STATUS REPORT ONLY · FLAGS roll forward via §11 routing

### A6 · Layer Hierarchy

| Layer | Who | Output |
|---|---|---|
| L1 | Devin (spec author + §12 reviewer) | V20 specs on disk · §12 compliance audits · wave-level deep-dives |
| L2 | IT agents (3+ separate Claude Code terminals) | code edits + commits + §12 |
| L3 | MC | Slack audit trail · roadmap · sequencing |
| L4 | CEO Ryan | all decisions · final authority |
| Lateral | Pam (Cowork) | deep dives · brand · investor ops · CLAUDE.md hygiene |
| External | Sylvia (Track B product) · Jarvis (CEO business-ops AI) | not in V20 cyl flow |

**CEO outranks every layer.** Specs · memory · advisor rulings INFORM CEO · they don't CONSTRAIN CEO.

**Stand-down rules:**
- VALID: file overlap · MTIME collision · upstream prereq not ratified · missing env/files/services · tree dirty · build broken · tsc errors · scope drift detected · `live: false`
- INVALID: schedule language alone · advisor ruling on different day · timing without active technical blocker

When standing down: cite the TECHNICAL BLOCKER first · not the schedule.

### A7 · MCP-First Diagnostic Protocol (BINDING #23)

When debugging any platform issue (Vercel · Slack · GitHub · Stripe · n8n droplet) the FIRST move is MCP introspection — not UI guesses · not noop-wake attempts · not disconnect/reconnect.

**Protocol:**
1. Load relevant MCP tool via `tool_search`
2. Run `get_project` / `get_account` / equivalent introspection call
3. Cite returned state verbatim in diagnostic
4. Only THEN consider remediation paths

**When `live: false`:** HALT the cylinder · check Vercel billing UI · check email for deployment failure messages · check `Vercel:get_project` for plan tier + spend usage · surface to CEO with diagnosis BEFORE any remediation.

### A8 · Vercel Operations Module

```
Project:      legacy-loop-mvp
Project ID:   prj_br8eXVFqKFbZLvKczG6JkvYgwVg2
Team ID:      team_km4bIt1IrCmlJ6Xk5pAjfWWV
Team slug:    legacyloop-5084s-projects
Production:   https://app.legacy-loop.com
Landing:      https://legacy-loop.com (READ-ONLY for Claude Code · Senior Web Dev track)
Plan:         Pro · $20/month · pause-on-overage
Last GREEN:   dpl_A6bcmGfRnsPm6Ct9cLTwinwEm8XU (P44 ship)
```

**Standard checks pre-fire:** `Vercel:get_project` → `live: true` · `list_deployments` → confirm latest READY · `curl /search` 200 sub-second.

**Deployment failure email pattern:** `"Vercel deployment failure for legacy-loop-mvp"` → check inbox if silent >10 min.

### A9 · Budget Discipline Framework ($20/month hard cap)

- Vercel monthly spend = $20 hard cap · pause-on-overage configured
- ANY overage requires CEO approval + technical justification + dollar amount
- Native monitoring (50/75/100% thresholds) preferred over custom webhooks

**Per-cylinder budget impact (REQUIRED in §0):**
- Cron entry → cite expected invocations/month + estimated spend
- API route consumer → call volume estimate
- Always-fire AI bot → per-scan cost
- If estimate >5% monthly cap impact → flag in §13 GAPS for CEO sign-off

**Threshold actions:** 50% post Slack heads-up · 75% flag CEO immediately · 100% pause-on-overage triggers saga-class incident.

### A10 · CEO Frustration De-escalation Pattern

When CEO shows signs of frustration / exhaustion / spiral:

- STOP diagnostic spiral
- ONE concrete question OR ONE concrete action — not three
- Backup plan ready in case answer is "no"
- Drop emoji density · drop preamble · bullets only
- Drop "great question" / "absolutely" / praise openers
- Drop banned phrases ("genuinely" · "honestly" · "straightforward")

**Pattern signals:** repeated "this isn't working" · multiple consecutive directives without read confirmations · time markers ("3 hours into this") · caps lock · single-word responses · explicit drift call-out (V20 v1 reject class).

**When uncertain:** assume YES · treat as de-escalation event.

### A11 · Parallel Worktree Discipline (3-agent default)

**Default workflow:** CEO operates 2-3 IT agents in parallel on disjoint surfaces. Devin pre-stages 2-3 V20 commands per round · CEO pastes simultaneously.

**Worktree assignments:**
```
Worktree A (agent-1)  cwd /Users/ryanhallee/legacy-loop-mvp-agent-1
Worktree B (agent-2)  cwd /Users/ryanhallee/legacy-loop-mvp-agent-2
Worktree C (agent-3)  cwd /Users/ryanhallee/legacy-loop-mvp-agent-3
Main worktree         cwd /Users/ryanhallee/legacy-loop-mvp
```

**Pre-flight per agent:**
```bash
cd /Users/ryanhallee/legacy-loop-mvp-agent-<N>
bash /Users/ryanhallee/legacy-loop-mvp/scripts/worktree-reset.sh <N>
npx prisma db push   # only if schema changed
```

**Sequencing rules:**
- Schema migrations → single-terminal main FIRST (no parallel collision)
- Cross-component wires → §0 grep-verifies chain end-to-end
- Race-recovery rebase → automatic via `agent-ship.sh` FF-fail path
- Parallel-safety verification (Devin · pre-fire): zero file collision · zero schema collision · zero env collision
- **Honest 2-parallel preferred over forced 3-parallel** (Wave 8 directive)

---

## PART B · CRITICAL DESIGN DIRECTIVE (V15 · canonical · unchanged)

### B1 · Aesthetic charter

Design system: **Tesla / SpaceX / Grok-inspired**. Dark theme · teal `#00bcd4` · glass morphism · premium typography · senior-friendly.

**"Elon Musk Standard: this must feel like a $1B product."**

### B2 · Style rules (ABSOLUTE)

ALL styles inline `style={{}}` — NO Tailwind · NO `className` for visual styling · NO external CSS · NO EXCEPTIONS.

- **Light mode:** CSS variables on theme-aware surfaces
- **Always-dark panels** (modals · overlays · bot consoles): hardcoded colors (`#e2e8f0` text · `rgba(255,255,255,0.05)` bg)
- **Brand teal:** `var(--accent) = #00bcd4`. NEVER use `#0f766e` (wrong teal)
- **`gridTemplateColumns` MUST use `minmax(0, 1fr)`** — not plain `1fr` (mobile clipping cost: 7 failed fix attempts)
- **Flex parents of overflow-x children MUST have `minWidth: 0`** (iOS/Safari shrink contract · cost: 8 failed fix attempts)
- **Border radius:** cards 1.25rem · buttons 0.75rem · pills 9999px
- **No framer-motion.** CSS transitions + `requestAnimationFrame` only
- **Existing keyframes:** `orbFloat1/2/3` · `fadeSlideUp` · `floatDot` · `skeleton-pulse` · `accentPulse` · `pulse` · `spin`

### B3 · CSS Variables (canonical)

```
--accent:           #00bcd4     (brand teal · NEVER #0f766e)
--accent-dim:       rgba(0,188,212,0.12)
--accent-border:    rgba(0,188,212,0.3)
--accent-glow:      rgba(0,188,212,0.35)
--accent-deep:      #009688
--bg-body:          #0a0a10 (dark) / #f1f5f9 (light)
--bg-secondary:     #111118 (dark) / #ffffff (light)
--bg-card-solid:    #16161e (dark) / #ffffff (light)
--bg-card-hover:    rgba(255,255,255,0.1) (dark) / rgba(255,255,255,1) (light)
--ghost-bg:         rgba(255,255,255,0.07) (dark) / rgba(0,0,0,0.04) (light)
--border-default:   rgba(255,255,255,0.12) (dark) / rgba(0,0,0,0.08) (light)
--text-primary:     #f1f5f9 (dark) / #0f172a (light)
--text-secondary:   #cbd5e1 (dark) / #475569 (light)
--text-muted:       #94a3b8 (both)
--success:          #22c55e   (NOT #4caf50)
--warning:          #f59e0b   (NOT #ff9800)
--error:            #ef4444   (NOT #f44336)
--antique:          #D4AF37   (premium gold · antique alerts)
--estate-warm:      #D4A017   (estate sections ONLY)
--megabot:          #8B5CF6   (MegaBot purple)
```

Carrier brand colors (hardcode): USPS #333366 · UPS #351c15 · FedEx #4d148c. MegaBot providers: OpenAI=#22c55e · Claude=#a78bfa · Gemini=#3b82f6 · Grok=#f97316.

### B4 · Typography (LOCKED)

```
Headings: Exo 2 (400-800)              · letterSpacing -0.02em on H1-H3
Body:     Plus Jakarta Sans (400-700)  · lineHeight 1.6
Data:     Barlow Condensed (300-800)   · every number · letterSpacing 0.02em

CSS vars:
  --font-heading: var(--exo2)
  --font-body:    var(--plusJakarta)
  --font-data:    var(--barlowCondensed)
```

**Rules:**
- Barlow Condensed on EVERY number (prices · stats · credits · counts · percentages · dates · weights · dimensions). No exceptions.
- Never mix fonts within a data point (e.g., "$" and "49.99" must both be Barlow Condensed)
- Data labels: Plus Jakarta Sans 500 · letterSpacing 0.04em uppercase

### B5 · Senior-Friendly (NON-NEGOTIABLE · A11Y > AESTHETIC)

**Touch targets:** 44px × 44px minimum on ALL tappable elements. No exceptions.

**Font size floors:**
```
Body:     ≥13px (0.8125rem)
Buttons:  ≥14px (0.875rem)
Data:     ≥15px (0.9375rem · prices · status · counts)
Badge:    ≥10px with fontWeight 700
Label:    ≥11px (0.6875rem)
Progress: ≥10px with bold
```

**Contrast:** body ≥7:1 · numbers ≥9:1 · interactive ≥4.5:1 (WCAG AA) · large text 18px+ ≥3:1.

**Additional:** focus indicators on all interactive · errors NEVER color-only · keyboard accessible · semantic HTML + ARIA · `prefers-reduced-motion` respected · 200% zoom must not break.

---

## PART C · PERMANENTLY LOCKED FILES (V15 inventory + R29 additions)

60+ files locked. Each command must explicitly list surgical unlocks in §10. If not listed → do NOT touch.

### Core Adapters (LOCKED)
- `lib/adapters/ai.ts` · `lib/adapters/rainforest.ts` · `lib/adapters/auth.ts` · `lib/adapters/storage.ts` · `lib/adapters/multi-ai.ts` · `lib/adapters/bot-ai-router/index.ts` · `lib/adapters/pricing.ts`

### AI Detection (LOCKED)
- `lib/antique-detect.ts` · `lib/collectible-detect.ts`

### MegaBot (LOCKED)
- `lib/megabot/run-specialized.ts` · `lib/megabot/prompts.ts` (ADD-ONLY) · `app/api/megabot/[itemId]/route.ts`

### Shipping TMS (LOCKED)
- `lib/shipping/package-suggestions.ts` · `lib/shipping/metro-estimates.ts` · `lib/shipping/freight-estimates.ts` · `lib/shipping/tracking-normalizer.ts` · `lib/shipping/fedex-ltl.ts` · All `/app/api/shipping/*` routes

### Credits + Billing (LOCKED)
- `lib/credits.ts` · `lib/billing.ts` · `lib/billing/pro-rate.ts` · `lib/billing/commission.ts`

### Pricing (LOCKED)
- `lib/constants/pricing.ts` · `lib/pricing/constants.ts` · `lib/pricing/market-data.ts`

### Offers (LOCKED)
- `lib/offers/negotiate.ts` · `lib/offers/expiry.ts` · `lib/offers/magic-link.ts`

### Market Intelligence (LOCKED)
- `lib/market-intelligence/aggregator.ts` · `lib/market-intelligence/adapters/apify-client.ts` · All scraper adapter files

### Bot Infrastructure (LOCKED)
- `lib/bots/sequencer.ts` · `lib/bots/accuracy.ts` · `lib/bots/demand-score.ts` · `lib/bots/disagreement.ts` · `lib/bot-mode.ts` · `lib/adapters/bot-ai-router/{multi-ai,sequencer,provider-select}.ts`

### Core UI (LOCKED)
- `app/components/AppNav.tsx` · `app/components/UploadModal.tsx` · `app/components/ThemeProvider.tsx` · `app/components/Footer.tsx` · `app/components/ItemDashboardPanels.tsx` (9,618 LOC · surgical unlock only · NEVER full edit) · `app/globals.css` · `app/layout.tsx`

### Enrichment (LOCKED)
- `lib/enrichment/index.ts` · `lib/enrichment/item-context.ts`

### Auth (LOCKED)
- `lib/adapters/auth.ts` · All `/app/api/auth/*` routes

### Database (LOCKED)
- `prisma/schema.prisma` (unless migration explicitly approved in §8) · `lib/db.ts` (singleton-gate surgical-unlock pattern per R29 P41)

### Cron Infrastructure (LOCKED post-saga)
- `vercel.json` cron entries + functions block · All `/app/api/cron/*` route handlers (audit-doc precedes wire)

### Sylvia Cognitive Layer (LOCKED · Phase B+)
- `lib/sylvia/*` (Track B substrate · surgical unlock only via CMD-SYLVIA-* spec)

### Logos + Brand (LOCKED · CEO Adobe Illustrator only)
- `public/images/logos/*` — UNTOUCHABLE

### API Routes
- ALL LOCKED — exceptions only via surgical unlock per command in §10

### LiteLLM Gateway (LOCKED)
- All AI calls route via gateway · zero direct provider HTTP (BINDING #10 DOC-TELEMETRY-LOCK)

---

## PART D · COMMAND TEMPLATE (canonical sections · §0 + §0.5 + §0.7 + §1-§15 + §5.X + §12.5)

Every fire-cylinder spec uses this structure.

### §0 · PRE-STAGE GROUNDING — DRAFTED `<DATE>`

```markdown
| Field | Value |
|---|---|
| Anchor HEAD | `<commit hash>` |
| Drafted by | <author + role + date> |
| Re-anchored | <date · who · what drift was found> |
| Spec status | DRAFT / PRE-STAGE / FIRE-READY / IN-FLIGHT / RATIFIED |
| Pre-req | <upstream cylinders that must ratify first> |
| **Track** | **A (Claude system · CMD-...) OR B (Sylvia AI · CMD-SYLVIA-...)** — RULE 0.4 mandatory |
| Vercel live check | `live: true` (cited via Vercel:get_project at draft time) |
| Plan limit check | <cron schedules verified against Pro tier · or N/A> |
| Budget impact | <expected $/month delta · or "$0 · audit-only"> |

### PRE-FIRE DECISIONS LOCKED
- <Decision 1>
- STOP BEFORE COMMIT discipline (RULE 0.1 + workflow #11) · or IT-AUTONOMOUS override cited

### Discovery findings that shape this spec
1. <Finding 1>
2. <Finding 2>

### #21+#34 readiness
| Citation | Verification | Status |
|---|---|---|
| <file path + line range> | <how verified> | ✅ / ⚠️ FIRE-TIME-VERIFY |

### #22 chain-grounding (cross-component cyls only)
| Component | Entry | Mid | Exit | Verified? |
|---|---|---|---|---|
| <chain> | <grep cite> | <grep cite> | <grep cite> | ✅ end-to-end |
```

### §0.5 · MANDATORY IT DEEP-DIVE GATE (PRE-FIX-1 · BINDING #30 · RULE 0.2)

**IT agent MUST · BEFORE any state change · perform independent empirical re-verification of Devin §0 pre-spec deep-dive findings.**

**IT actions BEFORE FIX 1:**

1. Re-read §0 Devin findings · cite verbatim in §12 PART A IT DEEP-DIVE CONFIRMATION
2. Independently verify each empirical claim still holds:
   - File paths still exist as cited
   - Process / daemon states match assumptions
   - External APIs / packages / DNS still resolve as claimed
   - Vercel `live: true` still holds (BINDING #23)
   - No state drift since spec authoring timestamp
3. Surface any divergence inline as PIVOT REV (per §0.7 push-back protocol)
4. HALT-PRE-FIX-1 if divergence material · emit INTERIM §12 per §12.5

**Drift re-classification table:**

| Drift class | IT action | Outcome |
|---|---|---|
| State drift (file moved · package version changed) | Re-cite verbatim · update spec inline · continue | §0.5 PASS with drift cite |
| Pre-condition drift (target already installed) | Re-classify VERIFY-class · skip pre-condition FIX · continue | §0.5 PASS · VERIFY-class |
| Substrate drift (upstream prereq missing) | HALT-PRE-FIX-1 · INTERIM §12 · escalate | §12.5 INTERIM emitted |
| Material drift (spec premise wrong) | HALT · §0.7 push-back · author replacement | INTERIM §12 + replacement path |
| Production drift (`live: false` · build broken) | HALT · §A7 MCP protocol · CEO escalate | §12.5 INTERIM emitted |

### §0.7 · PUSH-BACK-WITH-REPLACEMENT PROTOCOL (BINDING #31 · RULE 0.5)

When any actor (Devin · IT · MC · CEO) pushes back on a directive:

**Required actions:**
1. Cite the premise being challenged verbatim
2. Cite evidence for the challenge (grep · curl · file read · state check)
3. **Author replacement path inline** · same message · same surface or adjacent
4. Replacement satisfies original intent OR honestly cites why intent is unreachable
5. CEO decides accept / modify / override

**Bare refusal = doctrine violation.** Always author replacement.

### §1 · IDENTITY

```markdown
| Field | Value |
|---|---|
| CMD | CMD-<CYLINDER-NAME> (Track A) OR CMD-SYLVIA-<NAME> (Track B) |
| Project | LegacyLoop MVP |
| Date | <target date> |
| Template | V20 |
| **Track** | **A · Claude system (internal · dev/ops crew)** OR **B · Sylvia AI (product · customer-facing)** — RULE 0.4 mandatory |
| Phase | <Track A: A1/A2/A3/A4> OR <Track B: B1/B2/B3/B4/B5> |
| IT estimate | <minutes> |
| Concurrency cap | <1 of 1 · 1 of 2 · 1 of 3> |
| Worktree | <A · B · C · main> |
| Pairs with | <related cylinders in same wave> |
| Builds on | <prior commit hashes in lineage> |
```

### §2 · OBJECTIVE — F1 FRAMING

1-3 sentence outcome statement. After-ship state (concrete · measurable).

F1 framing:
- **Properly** — <how this matches conventions>
- **Scientifically** — <measurable basis>
- **Tactically** — <single focused scope>
- **Surgically** — <zero LOCKED edits · zero schema migration>

### §3 · PART A — MANDATORY READS

```markdown
| File | Lines | Why |
|---|---|---|
| <path> | L<X-Y> | <reason> |
```

Optional §3.1 sample inputs/outputs · §3.2 contract assumptions.

### §4 · DIAGNOSTIC

Numbered questions answered. Why this cylinder exists · root cause · anchor lines verified pre-spec · LOCKED files boundaries · doctrine guards.

End with: **"What does this cylinder NOT do?"** — explicit negative scope.

### §5 · FIX 1-N

Each fix block:
- File path · Line range to modify
- BEFORE/AFTER code blocks (verbatim diff intent)
- Per-edit `tsc --noEmit` after each save (must be 0)
- Build gate at end of FIX block

```markdown
### FIX <N> — <NAME> (P0/P1/P2 · ~<minutes>)

File: `<absolute path>`

```ts
// BEFORE
<code>

// AFTER
<code>
```

After save: `npx tsc --noEmit` PASS.
```

### §5.X · CEO INTERACTIVE GATES (NEW V20 · explicit list · up-front)

If any FIX requires CEO action (mic permission · GUI toggle · paid-tier decision · external interaction):

```markdown
| FIX # | CEO Action | Est. Time | Reply Format |
|---|---|---|---|
| FIX 1 | <action> | ~Nmin | `FIX 1 GREEN` |
| FIX 2 | <action> | ~Nmin | `FIX 2 GREEN` / `GREEN-with-NOTE: <X>` / `VERDICT-SWAP` |
| FIX 5 | Commit gate · read diff · approve | ~1-2 min | `FIX 5 GREEN — commit` |
```

**Or for IT-autonomous cyls:** `CEO-interactive: NONE · IT-autonomous per CEO fire prompt`.

Prevents CEO surprise mid-cyl by interactive gates. Total CEO time investment visible up-front.

#### Gate semantics · corruption-class vs reconcile-class (DOC-V20-GATE-SEMANTICS-CORRUPTION-VS-RECONCILE 1/5 · NEW v2.2)

§5.X "HALT on mismatch" gates MUST distinguish:
- **Corruption-class HALT** — Vercel value empty / absurd length / changed mid-fire → genuine investigate-before-proceed
- **Reconcile-class EXPECTED** — pre-fire mismatch IS the bug this cyl resolves → mismatch confirms root cause · proceed with fix

Spec author must explicitly cite which class the gate watches for. IT push-back authorized per BINDING #31 if gate semantics ambiguous.

**Anchor:** CMD-N8N-V11-WEBHOOK-SECRET-RECONCILE V20 LOW · 2026-05-19 · Agent 1 push-back caught ambiguous spec wording mid-fire.

### §5.5 · FLAG-RIDER (BINDING #33 · G1-G5 · P0 EXCLUSION explicit V20)

> Every routine V20 cylinder carries 1 small flag-killer sub-command ("rider") that closes a single existing backlog flag. **P0 production cylinders are EXCLUDED · fire solo · no rider** (R29 W3-W6 6 P0 cyls confirmed pattern: P36 · P37 · P40 · P41 · P42 · P44).

**Rider Flag ID:** `<flag-id-from-source-registry>`
**Rider Category:** `<P1 | P2 | OPERATIONAL | CYCLIC | BANKED>` (G3 · no P0 · no new work)
**Source registry:** `<Flag_Registry_*.md>` or `MASTER_FLAG_BACKLOG_*.md`
**Rider scope (G2):** `<file paths>` · MUST be disjoint from peer riders AND (disjoint OR same-surface) as primary

**Rider §0.5 mini-audit (G4 + G5 silent-bank gate)** + **Rider FIX 1-N (G1 ≤5 min OR ≤15% primary)** + **Rider §12 sub-box**.

**Guardrails (G1-G5 · all five MUST hold):**
- **G1** Rider runtime ≤ 5 min OR ≤ 15% of primary
- **G2** Rider scope disjoint from peer riders · disjoint-or-same-surface as primary
- **G3** Existing backlog only · OPERATIONAL preferred · no new work · no P0
- **G4** Collision surfaced at §0.5 → rider banks "RIDER-DEFERRED" · primary ships clean
- **G5** Rider can NEVER halt primary · rider failure = silent-bank · NEVER HALT class

**P0 EXCLUSION CLAUSE (V20 explicit):**
P0 production cylinders fire CLEAN ALONE. No §5.5 rider. Same logic as Track B Bridge cyl. Section reads: `§5.5 RIDER · P0 EXCLUSION · primary fires solo · scope discipline preserved`.

### §6 · BUILD HARNESS

```markdown
| Gate | Command | Expected |
|---|---|---|
| Pre-flight HEAD | `git rev-parse HEAD` | <expected hash> |
| Pre-flight tree | `git status -s` | empty |
| Pre-flight tsc | `npx tsc --noEmit` | 0 errors |
| Pre-flight Vercel live | `Vercel:get_project` | `live: true` |
| Per-edit tsc | (after each FIX save) | 0 errors |
| Final build | `npm run build` | PASS · <route count> · BINDING #18 budget fork if local hangs |
| Smoke 1 | <curl/sqlite/etc> | <expected output> |
| LOCKED diff | `git diff --stat <locked paths>` | empty |
| **BINDING #34 cite** | commit SHA + dpl_id + curl on-route | (a)+(b)+(c) all present |
```

### §7 · ACCEPTANCE TEST (8-POINT WORLD CLASS CHECK)

Every feature passes all 8 before marked complete:

```markdown
- [ ] tsc --noEmit = 0 errors
- [ ] npm run build = PASS · <N> routes
- [ ] Locked files untouched (verbatim grep)
- [ ] Smoke 1 PASS
- [ ] BINDING #34 widened cite (a)+(b)+(c) verbatim
- [ ] §0.5 deep-dive gate PASS
- [ ] Track A or B explicit in §1 + §12

### 8-Point World Class Check (PART M reference)

1. **Investor** — Would Dr. Clark approve · investor-grade narrative?
2. **Senior** — Would a 70-year-old estate seller use without instruction (14px+ · 44px touch)?
3. **Awwwards** — Would this screenshot make Awwwards.com?
4. **Stripe** — Would this ship in Stripe Dashboard (data density · clean hierarchy)?
5. **Apple** — Every tap haptic · every curve physical · ≥44px touch?
6. **A11y** — WCAG 2.1 AA · keyboard-only · reduced-motion · forced-colors · screen reader?
7. **Mobile** — Zero clipping at 375px · iOS elastic bounce locked?
8. **Theme** — Correct in light + dark? CSS vars used?

If ANY of 8 fails → feature NOT done. Open gap in FLAGS.

### Doctrine self-audit (32 BINDING + candidates · cite by NAME)

| Doctrine | Status | Evidence |
|---|---|---|
| <name> | PASS/FAIL/N/A/APPLIED/RATIFIES | <evidence cite> |
```

### §8 · CREATIVE LATITUDE (V15 verbatim · CEO-restored V20)

```
MAY:
  • Improve beyond spec · flag gaps · choose cleanest path · add error handling
  • Make UI impressive · flag missed data collection · add Elon-standard polish

MAY NOT:
  • Touch locked files · change bot AI/prompts · deviate from inline style
  • Add unapproved packages · change schema without approval · use Tailwind/className
```

> **"Never assume. Never guess. Read first. Build second."**

Spec is law within these bounds.

### §9 · STOP RULES

10+ numbered rules that abort the cylinder mid-flight:

1. LOCKED file edit attempted → STOP
2. Schema migration not pre-approved in §8 → STOP
3. Vercel `live: false` detected pre-fire → STOP · escalate per §A7
4. Spend cap >75% → STOP · CEO sign-off required
5. Tree dirty at pre-flight → STOP · clean before fire
6. tsc errors at pre-flight → STOP · diagnose first
7. Doctrine #22 chain-grounding gap discovered mid-FIX → STOP · re-author
8. Substrate not yet on origin/main at fire time → STOP · DOC-SUBSTRATE-RETURN-SHAPE-VERIFY
9. Push-back authority active · IT may HALT and request substitute spec (§0.7)
10. Build break post-FIX-N → STOP · revert · diagnose · do not "push through"
11. Parallel collision detected (MTIME-WATCH 30s) → STOP · sequence
12. **BINDING #34 widened cite missing or alias-masking detected → STOP · re-cite verbatim**
13. **§0.5 IT deep-dive gate skipped → STOP · IT must emit §0.5 confirmation**
14. CEO directive supersedes any §9 rule via DOC-CEO-SCHEDULE-AUTHORITY

### §10 · COMMAND BLOCK

Restated objective + Surgical Unlocks.

```markdown
### MAY TOUCH (this cylinder only)
- <path> · L<X-Y> · <reason>

### DO NOT TOUCH (LOCKED · per PART C)
- <every other path · default state>

### POST-FIX LOCKED DIFF VERIFY (mandatory V20)
git diff HEAD --name-only | grep -E "<LOCKED-list-regex>"
# Expected: zero hits · cite verbatim in §12
```

### §11 · ROUTE TO SP / FLAG ROUTING (V20 8-category)

| Item | Category | Destination |
|---|---|---|
| <flag-id> | STANDALONE | own cyl when fired |
| <flag-id> | DOCTRINE | candidate progression 1/5 → 2/5 → BINDING |
| <flag-id> | MC-TASK | MC owns · Slack STATUS · roadmap update |
| <flag-id> | CYCLIC | CY-N recurring health check |
| <flag-id> | RYAN-SIDE | CEO action · out of IT scope |
| <flag-id> | POST-EPIC | gated on downstream epic close |
| <flag-id> | BANKED | conditional · gated on trigger |
| <flag-id> | OPERATIONAL | housekeeping · cleanup · tree |

#### CYCLIC subdivisions (NEW v2.2 clarification)

CY-N cylinders sub-class by purpose:
- **CY-N audit class** — read-only scans · catches drift before symptom (e.g. CMD-N8N-CY-N-WEBHOOK-EXPRESSION-AUDIT)
- **CY-N hygiene class** — file system reorganization · zero-deletion (e.g. CMD-SKILLS-FOLDER-HYGIENE-CY-N)
- **CY-N rotation class** — credential rotation · zero downtime (e.g. post-V11 N8N_WEBHOOK_SECRET rotation)
- **CY-N tier-audit class** — empirical-vs-spec reconciliation (e.g. CMD-COMPENDIUM-TIER-EMPIRICAL-AUDIT)

Cycle cadence guidance: quarterly default · biweekly for high-velocity classes (skills folder) · per-symptom for rotation.

### §12 · §12 REQUIRED COMPLETION REPORT — VERBATIM CANONICAL BOX (V15 spine + R29 enrichment · MANDATORY)

**THIS IS THE LAW.** Upon completion, IT produces this EXACT report. RULE 0.1 mandates verbatim emission at close · NEVER on request · NEVER skipped.

```
┌─────────────────────────────────────────────────────┐
│  CMD-XXX COMPLETION REPORT                          │
│  LegacyLoop | <DATE> | V20                          │
│  Track <A | B> · <epic/wave context>                │
├─────────────────────────────────────────────────────┤
│  STATUS: [🟢 GREEN | 🟡 GREEN-with-NOTE |           │
│           🟠 HALT | 🔴 RED]                         │
├─────────────────────────────────────────────────────┤
│  CHECKPOINT (BEFORE)                                │
│    tsc=<X>  build=<PASS/FAIL>  routes=<N>           │
│    HEAD: <hash>                                     │
│    Vercel live: <true/false> (cited)                │
│    Spend: $X.XX/$20 (Y%)                            │
│  CHECKPOINT (AFTER)                                 │
│    tsc=<X>  build=<PASS/FAIL>  routes=<new N>       │
│    HEAD: <new hash>                                 │
│    Vercel live: true (post-deploy verified)         │
├─────────────────────────────────────────────────────┤
│  §0.5 IT DEEP-DIVE CONFIRMATION (BINDING #30)       │
│  ☑ Re-read §0 Devin findings                        │
│  ☑ Independently re-verified empirical claims:      │
│    · <claim 1> · [match | drift class · re-class]   │
│    · <claim 2> · [match | drift class]              │
│  ☑ Divergence: NONE / PIVOT cited inline (§0.7)     │
│  Verdict: §0.5 PASS / HALT-PRE-FIX-1                │
├─────────────────────────────────────────────────────┤
│  PART A — READ CONFIRMATION                         │
│  · <file path + line range> · cited verbatim        │
│  · ...                                              │
├─────────────────────────────────────────────────────┤
│  DIAGNOSTIC                                         │
│  · <root cause cite>                                │
│  · <decision rationale>                             │
├─────────────────────────────────────────────────────┤
│  PARTS B-N — CHANGES MADE                           │
│  FIX 1 <name>:                       DONE/SKIPPED   │
│    <what changed · cite line numbers · why>         │
│  FIX 2 ...                                          │
│                                                     │
│  FILES MODIFIED · <file | +N/-N>                    │
│  FILES CREATED  · NONE / <list>                     │
│  FILES DELETED  · NONE / <list>                     │
├─────────────────────────────────────────────────────┤
│  THEME COMPLIANCE                                   │
│   Light mode: PASS / FAIL                           │
│   Dark mode:  PASS / FAIL                           │
│   Always-dark panels: PASS / FAIL / N/A             │
├─────────────────────────────────────────────────────┤
│  LOCKED FILES:    UNTOUCHED / <violations cited>    │
│    Verbatim grep diff: <command output · 0 hits>    │
│  SCHEMA CHANGES:  NONE / <describe>                 │
│  PACKAGE CHANGES: NONE / <describe>                 │
│  ENV CHANGES:     NONE / <describe>                 │
│  BUDGET DELTA:    $0.00/mo / +$X.XX/mo              │
├─────────────────────────────────────────────────────┤
│  ACCEPTANCE TEST RESULTS                            │
│  ☑ <test 1>:   PASS                                 │
│  8-Point World Class Check:                         │
│   1. Investor: PASS/FAIL/N/A                        │
│   2. Senior:   PASS/FAIL/N/A                        │
│   3. Awwwards: PASS/FAIL/N/A                        │
│   4. Stripe:   PASS/FAIL/N/A                        │
│   5. Apple:    PASS/FAIL/N/A                        │
│   6. A11y:     PASS/FAIL/N/A                        │
│   7. Mobile:   PASS/FAIL/N/A                        │
│   8. Theme:    PASS/FAIL/N/A                        │
├─────────────────────────────────────────────────────┤
│  DOCTRINE SELF-AUDIT (32 binding + candidates)      │
│  · <BINDING name>:    PASS/FAIL/N/A/APPLIED         │
│  · <candidate name>:  APPLIED/BANKS/RATIFIES        │
│  DOCTRINE CANDIDATE PROGRESSION (V20 explicit):     │
│   · <candidate>: N/5 → (N+1)/5 ← this cyl cite      │
│   · <candidate>: M/5 → RATIFIES if M=5              │
├─────────────────────────────────────────────────────┤
│  ┌─ RIDER §12 sub-box (omit if P0 EXCLUSION) ─┐    │
│  │  Rider flag: <flag-id>                       │  │
│  │  Outcome: GREEN | RIDER-DEFERRED | SILENT-BK │  │
│  │  Runtime: <Nmin> (G1)                        │  │
│  │  Collision: <none | detected> (G2-G4)        │  │
│  │  Backlog source: <registry-file:§X-row> (G3) │  │
│  └──────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────┤
│  PRODUCTION SAFETY REAFFIRMATION                    │
│   ✅ ZERO Vercel env changes (or describe)          │
│   ✅ ZERO behavior change to existing surfaces      │
│   ✅ ZERO direct AI provider HTTP (LiteLLM only)    │
│   ✅ ZERO LangChain imports                         │
│   ✅ ZERO schema migration (or §8 approval cited)   │
│   ✅ ZERO budget impact >$1/mo (or describe)        │
│   ✅ Vercel live: true post-deploy                  │
│   ✅ Single-step rollback · git revert <hash>       │
├─────────────────────────────────────────────────────┤
│  FLAGS · V15 6-BULLET OBSERVATIONS · MANDATORY EMIT │
│  (RULE 0.1.A · every cyl · exact 6 bullets ·        │
│   "none" acceptable per bullet but bullet header    │
│   MUST appear · drop = doctrine violation)          │
│                                                     │
│  · Gaps:           <any gaps found · or "none">     │
│  · Risks:          <any risks identified · or "none"│
│  · Missed data:    <data collection opps · or "none"│
│  · Carry-forward:  <next steps needed · or "none">  │
│  · Suggestions:    <improvements to consider ·      │
│                    or "none">                       │
│  · Opportunity:    <higher-tech upgrades · advanced │
│                    features · integrations that     │
│                    could elevate the product ·      │
│                    or "none">                       │
│                                                     │
│  FLAG ROUTING · V20 8-CATEGORY · MANDATORY EMIT     │
│  (RULE 0.1.A · every cyl · exact 8 categories ·     │
│   "NONE this cyl" acceptable per category but the   │
│   category header MUST appear · drop = doctrine     │
│   violation)                                        │
│                                                     │
│  · STANDALONE:     <items · or "NONE this cyl">     │
│  · DOCTRINE:       <items · or "NONE this cyl">     │
│  · MC-TASK:        <items · or "NONE this cyl">     │
│  · CYCLIC:         <items · or "NONE this cyl">     │
│  · RYAN-SIDE:      <items · or "NONE this cyl">     │
│  · POST-EPIC:      <items · or "NONE this cyl">     │
│  · BANKED:         <items · or "NONE this cyl">     │
│  · OPERATIONAL:    <items · or "NONE this cyl">     │
├─────────────────────────────────────────────────────┤
│  BINDING #34 WIDENED CITE (MANDATORY · RULE 0.3)    │
│   (a) commit SHA = deploy SHA                       │
│       commit: <40-char SHA>                         │
│       deploy serves: <same 40-char SHA verified>    │
│   (b) THIS commit's dpl status:                     │
│       dpl_<id> · status: Ready (Production)         │
│       NOT alias proxy · build: <N>m                 │
│   (c) curl on affected route fast (NOT alias root): │
│       <route 1> = <code> / <N.NNs>                  │
│       <route 2> = <code> / <N.NNs>                  │
│       /search   = <code> / <N.NNs> (sanity)         │
├─────────────────────────────────────────────────────┤
│  BUILD STATUS                                       │
│   tsc --noEmit: 0 errors                            │
│   npm run build: PASS (<N> routes)                  │
│   (or BINDING #18 Vercel-CI canonical fork cited)   │
├─────────────────────────────────────────────────────┤
│  COMMIT                                             │
│  · Hash:    <new commit hash>                       │
│  · Branch:  main (or agent-N-slot pre FF)           │
│  · Pushed:  yes / no                                │
│  · Vercel post-deploy: <dpl_id> Ready               │
│  · curl variety: <N/N> = 200 sub-second             │
└─────────────────────────────────────────────────────┘

CRITICAL: IF POST-CHECKPOINT FAILS → REVERT IMMEDIATELY.
Report exactly what broke + what was touched.
```

### §12.5 · INTERIM §12 PROTOCOL (NEW V20 · HALT / RED states)

When cyl HALTs (§0.5 material drift · §9 STOP rule trip · CEO interrupt · production drift), IT emits **INTERIM §12** within 5 minutes.

```
┌─────────────────────────────────────────────┐
│  INTERIM §12 · CMD-<NAME> V20 · HALT-class  │
│  Track <A | B> · <DATE>                     │
├─────────────────────────────────────────────┤
│  STATUS: [🟠 HALT-PRE-FIX-1 |               │
│           🟠 HALT-PENDING-CEO | 🔴 RED]     │
├─────────────────────────────────────────────┤
│  HALT TRIGGER                               │
│  · Class: <§0.5 drift | §9 STOP #N | CEO    │
│           interrupt | production>           │
│  · Evidence: <verbatim citation>            │
├─────────────────────────────────────────────┤
│  WORK COMPLETED PRE-HALT                    │
│  · <FIX N done · FIX M pending>             │
├─────────────────────────────────────────────┤
│  STATE AT HALT                              │
│  · Files modified: <list>                   │
│  · Worktree state: <git status output>      │
│  · Commit landed: yes / no (cite hash)      │
│  · Vercel state: <unchanged | pending>      │
├─────────────────────────────────────────────┤
│  ROLLBACK READINESS                         │
│  · Single-step: <git revert | rm | N/A>     │
├─────────────────────────────────────────────┤
│  NEXT-ACTION GATE                           │
│  · CEO action required: <yes/no · what>     │
│  · Devin substitute path: <§0.7 if invoked> │
│  · Resume condition: <gate clear · greenlight>│
├─────────────────────────────────────────────┤
│  FULL §12 ON RESUME                         │
│  · Per RULE 0.1: full §12 emits verbatim    │
│    when cyl resumes + closes                │
│  · INTERIM §12 superseded · NOT replaced    │
│    (audit trail preserved)                  │
└─────────────────────────────────────────────┘
```

**Resume protocol:** When gate clears, IT emits full §12 · references INTERIM §12 by timestamp in audit trail.

### §13 · GAPS FOR DEVIN/RYAN RESOLUTION (pre-fire)

Table of pre-fire gaps that need Devin/Ryan resolution before IT runs. Per-gap: resolution path + blocker status (YES/NO).

### §14 · BANKED CARRY-FORWARDS (post-cylinder)

List of follow-on cylinders banked from this cylinder's discoveries.

### §15 · READY-TO-FIRE STATUS

Final go/no-go indicator. Pre-fire actions · sequence.

🟢 GREEN — ready to fire (or 🟡 YELLOW gated · 🔴 RED blocked)

---

## PART E · §12 LAYER 3 REVIEW CHECKLIST (V20 v2.1 · 32 BINDING · 18 items)

Devin (L1) pushes back on IT (L2) §12 returns if ANY check fails:

1. All required sections present?
2. **§0.5 IT DEEP-DIVE CONFIRMATION sub-section present (BINDING #30)?**
3. PART A reads cite verbatim line ranges?
4. DIAGNOSTIC traces root cause (not just symptom)?
5. FIX 1-N each marked DONE/SKIPPED/PASS?
6. LOCKED files explicitly listed UNTOUCHED + verbatim grep diff cited?
7. ACCEPTANCE TEST 8-Point tally included?
8. DOCTRINE SELF-AUDIT covers all 32 BINDING + relevant candidates + progression sub-row?
9. COMMIT hash present (or HELD with reason)?
10. **BINDING #34 widened cite (a)+(b)+(c) verbatim present? Alias-masking detected = push-back.**
11. **Track named explicitly (A or B)?**
12. Budget delta cited (even if $0)?
13. **(V2.1 NEW · RULE 0.1.A) FLAGS · V15 6-bullet observations section emitted with ALL 6 bullets (Gaps · Risks · Missed data · Carry-forward · Suggestions · Opportunity)? Section header verbatim · each bullet present even if "none"? Drop = push-back.**
14. **(V2.1 NEW · RULE 0.1.A) FLAG ROUTING · V20 8-category destination section emitted with ALL 8 categories (STANDALONE · DOCTRINE · MC-TASK · CYCLIC · RYAN-SIDE · POST-EPIC · BANKED · OPERATIONAL)? Section header verbatim · each category present even if "NONE this cyl"? Drop = push-back.**
15. **§5.5 rider sub-box present (or P0 EXCLUSION cited)?**
16. INTERIM §12 cross-reference (if HALT class during cyl)?
17. CHECKPOINT BEFORE + CHECKPOINT AFTER both present with verbatim cite?
18. THEME COMPLIANCE row present (Light/Dark/Always-dark · or N/A cited)?

**Checks 13 + 14 patched in V20 v2.1 (2026-05-15)** — addresses Agent B P51 §12 V15-6-bullet drop · CEO catch · MC push-back trigger.

---

## PART F · SLACK + COMMUNICATION DISCIPLINE

### Slack channel
- `#all-legacyloop` (channel ID `C08S7BGQABH`)
- MC posts: STATUS REPORTS ONLY · never directives · never agent-addressed
- Devin posts: deep-dive findings · push-backs · §12 reviews
- CEO posts: directives · greenlights · timing decisions
- ALL agent comms route through Ryan via paste-ready blocks in chat

### MC SLACK PROTOCOL · ABSOLUTE

Before EVERY Slack post check: **"Report or directive?"**
- Directive → DO NOT POST · paste-ready block in chat
- Report → format · post · cite ts

Slack = team newspaper · NOT channel TO agents. Repeat violation = trust breach.

### Slack post format (CMD-style)

```
─────────────────────────────────────
*<CYL-NAME> · <STATE>*
<Track A or B · context line>
─────────────────────────────────────

*Bottom line*
<1-3 sentence summary · what shipped · what's next>

<numbered or bulleted body>

— <author>
```

### Banned phrases (locked Apr 30 · preserved V20)

Never use: **"genuinely" · "honestly" · "straightforward"**.

### Time discipline

NO fabricated wall-clock times. Use relative markers · `date` via bash for ground-truth · permalink + ts for Slack message references.

### Compact paste-pointer format (DOC-IT-AGENT-PROMPT-COMPACT)

```
═══════════════════════════════════════════════════════════════
IT AGENT #N · CMD-CYLINDER-XX-NAME V20 · Worktree <A/B/C>
═══════════════════════════════════════════════════════════════

Spec: /Users/ryanhallee/Downloads/skills/Commands/CMD_CYLINDER_XX_NAME_V20_FIRE.md

Read the spec at the path above · execute canonical sections · stop
before commit · return §12 verbatim canonical box.

Track: A (Claude system · CMD-...) OR B (Sylvia AI · CMD-SYLVIA-...)
Anchor HEAD:      <commit hash>
Worktree:         /Users/ryanhallee/legacy-loop-mvp-agent-<N>
Pre-flight:       bash /Users/ryanhallee/legacy-loop-mvp/scripts/worktree-reset.sh <N>
Runtime estimate: ~XX min
Push-back authority: active · §9 STOP rules apply · §0.7 protocol applies
```

5-8 lines. Full V20 spec stays on disk as source of truth.

---

## PART G · TWO-TRACK SEPARATION (NEW V20 · CEO directive 2026-05-14 PM)

**CRITICAL: Claude System and Sylvia AI are TWO SEPARATE BUILDS. Never conflate. Every spec + every §12 names its track.**

### Track A · Claude System

| Field | Value |
|---|---|
| What it is | Internal dev/ops crew (MC + Devin + IT + Pam) |
| Customer-facing? | NO |
| Cylinder prefix | `CMD-...` (no SYLVIA) |
| Phases | A1 Core Build · A2 Production Hardening · A3 Tooling & Backfill · A4 Crew Complete |
| Reports as | "Track A R<N> P<M> ..." in Slack STATUS |

### Track B · Sylvia AI

| Field | Value |
|---|---|
| What it is | Master AI product (customer-facing + family) · named after CEO's mother |
| Customer-facing? | YES |
| Cylinder prefix | `CMD-SYLVIA-...` (always SYLVIA prefix) |
| Phases | B1 Substrate · B2 Tool Transfer · B3 The Bridge · B4 Corpus Feed · B5 Cognitive Hardwire |
| Reports as | "Track B B<N> ..." in Slack STATUS |

### Cross-track rules

1. **Never conflate language** — "claude-mem install" Track A · "Sylvia gets session-memory" Track B
2. **Never mix scope in one cyl** — push back · split into two cyls
3. **Tracks share IT execution lane** (parallel terminals) · stay separately tracked
4. **Doctrine ledger spans BOTH tracks** (BINDINGs apply universally)
5. **Master roadmap shows track + phase per cyl**
6. **The Bridge cyl (B3 · CMD-SYLVIA-SYSTEM-PROMPT-ALLINCLUSIVE) is the ONLY cross-track cyl** — fires SOLO post-Track-A-A3-close · NO rider · production-critical equivalent

### Local-autonomous parity (CEO directive 2026-05-14 PM)

Track A agents (Devin = Claude Code · Pam = Cowork) already run LOCAL on CEO Mac with full capability:
- Read · Write/Edit · Bash · WebFetch · MCP suite · agent-memory · claude-mem dual-layer

Track B B2 Tool Transfer wave brings Sylvia to **same local capability**:
- B2-W1 File read MCP · B2-W2 File write · B2-W3 Bash · B2-W4 Voice (Wispr) · B2-W5 WebFetch · B2-W6 PDF · B2-W7 Desktop ops · B2-W8 Memory bridge · B2-W9 Identity sync
- 9-wave sub-track · ~2-3 week scope · post-Track-A-A3-close
- End state: Sylvia operates autonomously with same toolkit as Claude system

---

## PART H · WAVE-LEVEL DEEP-DIVE FORMAT (NEW V20 · Devin standing format)

When CEO routes a Wave (multi-slot batch), Devin delivers ONE message with all 6 sections in order:

### §1 · GROUND-STATE PROBE SUMMARY

Compact table of pre-fire empirical findings.

```markdown
| Probe | Result |
|---|---|
| <target> | <verbatim cite> |
| Backfill epic state | <CEO-gated refs · open refs> |
| Doctrine candidate counts | <DOC-X 3/5 · DOC-Y 1/5> |
| LOCKED intersection | <0 hits · or list> |
| Working-tree state | <clean · pre-staged> |
```

### §2 · SLOT DECISIONS + RATIONALE

Per slot: spec name · class · worktree · surface · runtime · CEO interactive points · push-back rationale if invoked · spec file path + SHA256 + size.

### §3 · PARALLEL-SAFETY MATRIX (Slot N ⊥ Slot M)

Disjoint surface verification per slot pair. LOCKED intersection check. Concurrent fire viability.

### §4 · GATES HONORED EVERY SPEC

Checklist:
- ✅ §0.5 IT deep-dive gate (BINDING #30)
- ✅ §0.7 push-back protocol (BINDING #31 · invoked or N/A)
- ✅ BINDING #34 widened cite in §12
- ✅ LOCKED-file check · verbatim grep
- ✅ Track A/B named explicitly (RULE 0.4)
- ✅ §5.5 FLAG-RIDER · G1-G5 (or P0 EXCLUSION cited)
- ✅ Spec SHA256 attest

### §5 · RECOMMENDED FIRE ORDER (MC's call)

2-3 options with honest math. CEO routes preferred path.

### §6 · OPEN ITEMS + NEXT-WAVE PROJECTION

- Out-of-Devin-scope gates (MC's lanes · not blocking)
- Carry-forward observations worth surfacing
- Wave N+1 candidate sketches (conditional on §12 outcomes · F1 pit-stop pre-stage)

**Anchor:** Wave 8 delivery 2026-05-14 EOD established this format · V20 formalizes.

---

## PART I-N8N · N8N INTEGRATION DOCTRINE (NEW v2.2)

> 6 doctrine candidates baked from CMD-N8N-V11-WEBHOOK-SECRET-RECONCILE + CMD-N8N-V11-EXTRACT-REGEX-DIAGNOSTIC session 2026-05-19. Inheritance prevents class-bug recurrence in future n8n-touching cyls. NOTE: letter `PART I-N8N` chosen because existing `PART I · WHEN THIS TEMPLATE UPDATES` is canonical and unchanged · DOC-PUSHBACK-WITH-REPLACEMENT applied (BINDING #31).

### I.1 · httpRequest response shape baseline (DOC-N8N-HTTP-RESPONSE-SHAPE-AUTODETECT 1/5)

n8n httpRequest node v4.2 default behavior:
- `responseFormat=text` → body lands at `item.json` AS STRING directly (NOT `.body` / `.data`)
- `responseFormat=json` → body parsed at `item.json` AS OBJECT
- `responseFormat=file` → body at `item.binary[<key>]`
- 4xx/5xx response · `neverError=false` (default) → throws · workflow ends at node
- 4xx/5xx response · `neverError=true` → body at `item.json.error.message` (axios-wrapped)

Extract/transform jsCode patterns MUST use 3-way key-read:

```javascript
let html = '';
if (typeof item.json === 'string') html = item.json;
else if (item.json.error && typeof item.json.error.message === 'string') html = item.json.error.message;
else if (typeof item.json.body === 'string') html = item.json.body;
else if (typeof item.json.data === 'string') html = item.json.data;
```

**Anchor:** CMD-N8N-V11-EXTRACT-REGEX-DIAGNOSTIC 2026-05-19 · jsCode assumed `.body` · n8n delivered string at `item.json` · empty extract until 3-way read added.

### I.2 · PUT body schema strip allowed-only (DOC-N8N-PUT-SCHEMA-STRIP-ALLOWED-ONLY 1/5)

n8n REST PUT `/api/v1/workflows/{id}` body schema accepts EXACTLY:
- Top-level keys: `{name, nodes, connections, settings}` — anything else rejected
- `settings` sub-keys: `{executionOrder, saveExecutionProgress, saveManualExecutions}` — anything else rejected

Strip workflow GET response to whitelist before PUT. Rejected fields include: `active`, `id`, `createdAt`, `updatedAt`, `versionId`, `triggerCount`, `tags`, `meta`, `isArchived`, `shared`, `pinData`, `staticData`, `availableInMCP`, `binaryMode`, `callerPolicy`, `activeVersion`, `activeVersionId`, `description`, `versionCounter`.

**Anchor:** CMD-N8N-V11-WEBHOOK-SECRET-RECONCILE 2026-05-19 · GET→PUT round-trip rejected on `versionId` until whitelist strip applied.

### I.3 · Exec status ≠ corpus delivery (DOC-N8N-EXEC-FINISHED-TRUE-DOESNT-MEAN-DELIVERED 2/5 VINDICATED)

n8n exec `status=success` + `finished=true` ≠ corpus delivered to downstream system. Workflow can drain silently at any intermediate node · downstream nodes simply unreached.

§12 must verify:
- (a) Last-executed-node = expected final node (e.g. Webhook Callback for ingest workflows)
- (b) Callback target HTTP status = 200 (extension of BINDING #50 canary · DOC-N8N-CANARY-WEBHOOK-CALLBACK-STATUS)
- (c) Downstream artifact present (vault populated · DB row · log line)

Cross-ref I.6 14th check + BINDING #50 canary exec <50ms = HALT.

### I.4 · Live-HTML probe pre-author (DOC-PHASE-C-LIVE-HTML-PROBE-PRE-AUTHOR 1/5)

Spec author MUST `curl` source URLs pre-jsCode authoring:
- Capture `Content-Type` · HTTP status · `Server` header
- Identify CF/anti-bot challenges (`status=403` + `server=cloudflare`)
- Identify path-drift (`status=404`)
- Identify auth-walled content (`status=200` but login redirect in body)

Catches CF-block + path-drift + content-shape mismatch design-time. Bank empirical probe result in §0 of spec.

**Anchor:** Pre-V11 workflows assumed reachable HTML · CF blocks caught post-fire by Agent A curl probe. Move probe to pre-author.

### I.5 · Parse expression before authoring fix (DOC-DEVIN-PARSE-EXPRESSION-BEFORE-AUTHORING-FIX 1/5)

When n8n workflow header value is expression form `={{ $env.X }}` · `={{ $node.Y.json.Z }}` · etc.:
- Parse expression vs literal BEFORE inferring root cause from raw `len`
- Expression resolution happens at runtime · may differ from spec-author's assumption
- Regex pattern: `^=\s*\{\{` indicates expression form

Catches "value len=30 stale" mis-diagnosis when actual value is expression resolving to droplet env (which may itself be stale).

**Anchor:** CMD-N8N-V11-WEBHOOK-SECRET-RECONCILE 2026-05-19 · header `len=30` flagged as stale literal · was expression `={{ $env.WEBHOOK_SECRET }}` resolving at runtime.

### I.6 · 14th sandbox check (Devin §0.5 14-check addition)

Add to §7 §0.5 IT DEEP-DIVE check list for n8n workflow-touching cyls:

| # | Check | Required |
|---|---|---|
| 14 | n8n Code node jsCode contains zero `require(...)` calls (BINDING DOC-N8N-CHEERIO-NOT-IN-SANDBOX) AND uses 3-way key-read pattern (I.1) | grep zero matches OR explicit jsCode-free workflow |

---


### I.7 · OP-B Turso env fallback canonical (NEW v2.3 · BINDING #28 + ENV-NAME-DRIFT catch)

Production Turso env may use EITHER variable name. Scripts MUST fallback:

```js
const url = process.env.TURSO_CONNECTION_URL || process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;
const client = createClient({ url, authToken });
```

Anchor: Agent C Wave 22C P3 Lane 4 (V3 MaxSold §12) caught URL_INVALID error on first probe · TURSO_CONNECTION_URL alone insufficient · fallback restored GREEN.

Doctrine: DOC-VERCEL-ENV-PULL-TURSO-NAME-DRIFT 1/5 → 2/5 (template adoption ratifies pattern).

## PART I · WHEN THIS TEMPLATE UPDATES

Edit this file when:
- New doctrine ratifies BINDING (add to A3 list · re-number reserved gaps)
- New doctrine candidate banks (add to A4 list)
- Workflow rule changes (update A5)
- Layer responsibility shifts (update A6)
- New platform module locks (update A7-A11)
- §12 box adds a sub-bullet (update §12 in PART D)
- Compact format evolves (update PART F)
- New locked files (update PART C)
- Track structure changes (update PART G · rare · CEO directive class)
- New wave-level pattern emerges (update PART H)
- New WCS pillar / effect / benchmark (update PART M)
- New competitor pattern catalogued (update PART N)

Always update via PR/commit · this file lives at `/Users/ryanhallee/Downloads/skills/`. Do NOT edit silently — every change documents what changed and why.

---

## PART J · QUICK START — Devin spec-author flow (V20)

1. **Read this file end-to-end** before authoring any V20 spec
2. **Recite the Four Laws** — *"Never assume. Never guess. Read first. Build second."*
3. **Read THE STANDARD** at top — Tesla / Christie's / Elon / SpaceX / Anthropic / Claude AI quality bar
4. **Pick one flag** from `MASTER_FLAG_BACKLOG_2026-05-14.md` (current SoT)
5. **Run §0 grounding:**
   - `Vercel:get_project` → cite `live: true`
   - `git rev-parse HEAD` → cite anchor
   - `grep -n` every cited file/identifier → verify pre-edit
6. **Verify chain grounding (#22)** if cross-component
7. **§0.7 push-back check** — challenge any premise that doesn't hold · author replacement (BINDING #31)
8. **Author canonical sections + §13-15** in `CMD_<NAME>_V20_FIRE.md`
9. **Run doctrine self-audit** on draft (32 BINDING + relevant candidates)
10. **Verify parallel-safety** with peer cylinders (file/schema/env collision)
11. **Compact paste-pointer** delivered inline to chat (5-8 lines per slot)
12. **CEO greenlight** → CEO pastes to IT terminal
13. **Standby for §12 return** · Layer 3 review · push back if gaps (PART E · 16 items)

---

## PART K · WORKED EXAMPLE REFERENCES (R29 specs · refreshed)

For complete worked V19 examples (V20 inherits same canonical pattern), reference these recently-shipped specs:

- `CMD_VERCEL_FUNCTION_MAXDURATION_FIX_V19_FIRE.md` (R29 P40 · `cb78a1d` · Wave 5 Slot 1 SOLO · P0 production · NO rider)
- `CMD_PRISMA_SINGLETON_GATE_FIX_V19_FIRE.md` (R29 P41 · `29993a8` · Wave 5 Slot 2 SOLO · P0 · lib/db.ts surgical-unlock)
- `CMD_ROUTES_DYNAMIC_BATCH_FIX_V19_FIRE.md` (R29 P42 · `b8df8b7` · Wave 6 Slot 1 SOLO · 10 MUST-ADD routes)
- `CMD_DOCTRINE_LEDGER_APPEND_BINDING_34_V19_FIRE.md` (R29 P43 · `f462448` · Wave 6 Slot 2 · #34 RATIFIED)
- `CMD_CLAUDE_MEM_INSTALL_V19_FIRE.md` (R29 P44 · `9fee1c8` · Wave 7 Slot 1 SOLO · backfill Ref #11 closure)
- `CMD_ROUTES_DYNAMIC_CONSISTENCY_SWEEP_V19_FIRE.md` (R29 P46 · `2f71057` + `5949f2a` · Wave 8 Slot 2 · 33 SHOULD-ADD · BINDING #33 first post-ratify rider GREEN)

These shipped clean — read them as proof-of-pattern. The 6 P0 cyls demonstrate §5.5 P0 EXCLUSION. P43 demonstrates doctrine-ledger append. P46 demonstrates §5.5 rider G1-G5 first-post-ratify.

---

## PART L · LABEL DISCIPLINE

Only label V20 if cylinder:
- Has all canonical sections (§0 + §0.5 + §0.7 + §1-§15 + §5.X if applicable)
- Ships a commit (hash on main)
- Returns §12 verbatim canonical box (with hash · BINDING #34 cite)

Pre-stage briefs · drafts · re-anchor passes get HONEST names:
- `CMD_<NAME>_V20_PRESTAGE.md` for pre-stage briefs
- `CMD_<NAME>_V20_FIRE.md` for fire-ready specs (paste-ready)
- `CMD_<NAME>_V20.md` for shipped cylinders (post-§12 ratification)

Never stretch V20 suffixes onto incomplete work.

---

## PART M · WORLD-CLASS STANDARDS REFERENCE (NEW V20 · from LegacyLoop-WorldClass-Standards-Audit.html)

The non-negotiable visual + interaction quality bar. Read alongside §7 8-Point Check. Source: `LegacyLoop-WorldClass-Standards-Audit.html` + `WORLD_CLASS_STANDARDS.md`.

### M1 · THE SEVEN PILLARS (Awwwards winners share these · cite by NAME)

| # | Pillar | What it means |
|---|---|---|
| 01 | **MOTION** | Physics-based scroll. Lenis 1.3.21 (duration 1.2 · cubic ease-out). Native browser scroll feels cheap. |
| 02 | **TYPE** | Typography that moves. Per-char/word reveals tied to scroll. 18ms char stagger for headlines. |
| 03 | **PURPOSE** | Every motion has a reason. Restraint is the signal. Cut motions that don't earn frame-budget. |
| 04 | **DEPTH** | Layered parallax · blur · glow · noise (opacity 0.035) · ambient orbs (3-orb · teal/deep-teal/amber). |
| 05 | **MICRO** | Magnetic buttons (35% pull · spring-back) · hover breathing · `navigator.vibrate` haptics. |
| 06 | **STORY** | The page has an arc. Onboarding is a story. Item lifecycle is a story. Build for the arc. |
| 07 | **CRAFT** | SVG fractalNoise · safe-area insets · `prefers-reduced-motion` · `forced-colors` · `translateZ(0)` iOS glass. |

### M2 · THE 12 AWWWARDS EFFECTS (2024-2025 winners · pointer)

01 Smooth Scroll (Lenis) · 02 Word-by-word scroll opacity reveal · 03 Magnetic button · 04 Staggered card reveal · 05 Character-by-character headline reveal · 06 Animated gradient orb background · 07 Noise texture overlay · 08 Horizontal scrolling marquee · 09 Glow card hover · 10 Animated counting stats · 11 Preloader/page entry · 12 Custom cursor (desktop · `pointer: fine` only).

Recipe configs (timings · easings · sources): `LegacyLoop-WorldClass-Standards-Audit.html` §"12 effects."

### M3 · 18 REFERENCE BENCHMARKS (3 tiers · cite when unsure)

**Tier 1 · Agency / Animation:**
- Dennis Snellenberg (99 · Awwwards SOTY · character headline assembly)
- Olivier Larose (97 · scroll-gradient opacity)
- Lenis / Darkroom (98 · physics-based scroll)
- GSAP Studios (96 · magnetic CTAs)
- Arc Browser (94 · hero as film)
- Vercel (95 · noise overlay discipline)

**Tier 2 · Product / SaaS:**
- Stripe Dashboard (96 · data density · empty states · skeleton loaders)
- Linear (97 · command palette · keyboard-first)
- Notion (93 · slash commands · block editing)
- Apple Wallet/Settings (99 · haptics · spring curves · senior-friendly default)
- Manus (92 · AI reasoning transparency)
- Shopify Admin (90 · action density without clutter)

**Tier 3 · Consumer / Meta:**
- Instagram Stories (97 · photo carousel physics)
- Facebook Marketplace (85 · resale benchmark · ruthless mobile-first)
- WhatsApp (95 · optimistic sends · typing indicators)
- Threads (91 · launch-day polish)
- Messenger (88 · long-press reactions · haptic + spring)
- Instagram Shop (87 · product cards that breathe)

When unsure, ask: **"Would [reference] ship this?"** If no — it's not done.

### M4 · LANDING vs APP SURFACE SCORE (post-R29 PHASE B current state)

| Pillar | Landing | App | Target | Gap |
|---|---|---|---|---|
| Smooth scroll (Lenis) | HAVE · 9 | GAP · 0 | 8/8 | App only |
| Character headline reveal | HAVE · 9 | N/A | 9/— | None |
| Scroll opacity text | HAVE · 8 | GAP · 0 | 8/6 | App intro screens |
| Magnetic button | HAVE · 9 | GAP · 0 | 9/7 | App primary CTAs |
| Staggered card reveal | HAVE · 9 | PARTIAL · 4 | 9/8 | Dashboard grids |
| Ambient gradient orbs | HAVE · 9 | PARTIAL · 5 | 9/7 | Auth + hero screens |
| Noise texture overlay | HAVE · 10 | GAP · 0 | 10/8 | App globally |
| Glow card hover | HAVE · 9 | PARTIAL · 6 | 9/9 | Component rollout mid-flight |
| Animated counters | HAVE · 8 | GAP · 0 | 8/7 | Dashboard KPIs · pricing |
| Preloader / page entry | HAVE · 9 | GAP · 0 | 9/7 | First-load shell |
| Safe-area / notch | HAVE · 8 | GAP · 2 | 8/10 | **P0 · status bar overlap** |
| Photo carousel (Airbnb) | N/A | GAP · 1 | —/10 | **P0 · half-width bug** |
| Haptics on tap | N/A | GAP · 0 | —/9 | Apple-grade missing |
| Command palette (⌘K) | N/A | PARTIAL · 5 | —/9 | Linear-grade missing |
| Skeleton loaders | N/A | PARTIAL · 4 | —/9 | System-wide discipline |
| Empty states | N/A | PARTIAL · 4 | —/9 | Stripe-grade missing |
| Forced-colors / a11y | PARTIAL · 6 | PARTIAL · 5 | 9/9 | Full WCAG 2.1 AA audit |

---

## PART N · COMPETITOR AUDIT REFERENCE (NEW V20 · from LegacyLoop-Competitor-Audit.html)

7 best-in-class apps disassembled. 54 patterns catalogued. 17 priority gaps. 12 at parity. Source: `LegacyLoop-Competitor-Audit.html`.

### N1 · The Seven · Why we picked each

| App | Score | Why | Hardest to Beat |
|---|---|---|---|
| Stripe Dashboard | 92 | Operator/admin UI gold standard | Data density without clutter |
| Linear | 96 | App chrome · command palette · speed | Perceived performance |
| Apple (Wallet/Settings) | 98 | System-level UX · haptics · safe-area | Motion choreography |
| Manus | 91 | Mobile UX benchmark | Mobile info density |
| Mercari | 74 | Resale vertical · sell-flow | List-flow friction removal |
| Airbnb | 94 | Photo carousels · trust signals | Photo UX (our P0 bug) |
| Notion | 90 | Side panels · keyboard · right-click | Keyboard-first workflows |

### N2 · Top steals per app (V20 spec authors cite when relevant)

**Stripe** — 44px row standard · status pill taxonomy (5 colors map to ItemStatus enums) · right-side slide-over panels (480px · ESC dismiss) · skeleton = shape not shimmer · &lt;Money /&gt; component (lighter $ + lighter cents · Barlow Condensed primary) · contextual help "?" popovers on Tier rates · MegaBot confidence · credit logic.

**Linear** — Cmd+K command palette (every action reachable) · optimistic UI on every action (rollback silent on fail) · micro-indicator system (2px left-edge accent bars: teal=listed · gold=antique · purple=MegaBot-flagged · amber=pending offer) · keyboard-everywhere (J/K nav · E edit · N new · / search · ? help) · terse confident labels (verbs only · 7 words max) · inline 10px loading spinners (kill page-blockers).

**Apple** — Safe-area discipline (env(safe-area-inset) on every fixed top/bottom · P0 status-bar overlap fix) · haptic choreography (6ms tap · 12ms confirm · 24ms success · double-pulse error · document in `lib/haptics.ts`) · modal rise animation (springs from CTA · iOS 17 View Transitions API) · pull-to-dismiss sheets (vaul · react-spring-bottom-sheet · snap points) · hairline borders (1px rgba 0.06 · already aligned with --glass-border) · dynamic type scaling (Settings > Display > Larger Text · senior-friendly critical).

**Manus** — Persistent bottom bar + FAB (parity achieved · next: radial expand) · quick-action long-press (500ms hold + haptic · context menu on ItemCard) · information hierarchy per card (1 heavy · 2 medium · 3 light · never flat weight) · tab swipe transitions (drag + snap · mobile only) · persistent scroll memory (sessionStorage per route).

**Mercari** — List-flow 3 screens max (photo → title+price → ship · 30 sec target via AI advantage) · trust signals (Hero-verified · Antique authenticated · Ships from Maine · 4.9 rating) · offer slider with midpoint · smart price suggestion (we WIN here — MegaBot 4-AI consensus is the moat) · photo first text second (item detail flip · photos top hero 16:10 · details below).

**Airbnb** — Photo carousel perfection (embla / swiper · snap · dots · fullscreen · pinch zoom · arrows · lazy · P0 priority fix our broken carousel) · sticky-book CTA bar (scroll past hero · sticky bottom price + Buy/Offer) · review summary chips (Communication 4.9 · Accuracy 4.8 · Ship speed 5.0) · live filters (no Apply button · SWR + debounced) · skeleton → image crossfade (Next.js Image placeholder="blur" · Cloudinary blurhash · 200ms).

**Notion** — Slash-command menu (`/item` · `/price` · `/share` in Messages + Notes fields) · right-click context menus (desktop parity with Manus mobile long-press · same actions · one code path) · breadcrumb trail (Dashboard > Items > Item Name > Edit) · page transitions = NONE (instant routing · micro-interactions on individual elements only) · ambient auto-save (debounced 500ms · "Saved" indicator · kill Save button).

### N3 · Priority queue · ordered

**P0 · Ship this week (user-visible broken):**
- Photo carousel rewrite (Airbnb-grade · embla or swiper)
- Global safe-area audit (Apple-grade · every fixed-top page)
- Bottom nav functional QA (Manus-grade · all routes verified)
- Item detail layout flip (photos above description)

**P1 · Next 2-3 weeks (polish layer · perceived quality):**
- Skeletons matched to layout (Stripe-grade)
- Inline loading spinners (Linear-grade · kill page-blockers)
- Optimistic UI on status changes (Linear)
- Keyboard shortcuts + ? overlay (Linear)
- Status pill taxonomy · 12 ItemStatus enums (Stripe)
- Auto-save on item edit (Notion)
- Haptic vocabulary `lib/haptics.ts` (Apple)
- Live marketplace filters (Airbnb)

**P2 · Post-seed bandwidth (category-defining):**
- Long-press + right-click context menus (Manus/Notion)
- Right-slide panel on desktop item click (Stripe)
- Pull-to-dismiss sheets (Apple)
- Tab swipe transitions (Manus)
- Dynamic type scaling (Apple · senior-friendly)
- Sticky-book CTA bar (Airbnb)
- Trust signal row (Mercari + Airbnb)
- Slash commands in text fields (Notion)
- Radial expand + button (Manus next level)

---

## DOCUMENT INTEGRITY

| Field | Value |
|---|---|
| Document | LegacyLoop V20 Command Template · Canonical Hybrid v2.1 |
| Author | Devin L1 (auth) · MC head-start gap map · CEO ratified (v2 + v2.1 patches) |
| Date locked | 2026-05-15 (Friday · v2 AM rebuild · v2.1 mid-day patch) |
| Supersedes | V15 (2026-04-06) · V18 (2026-05-02) · V19 (2026-05-07) · V20 v1 (2026-05-15 AM rejected) · V20 v2 (2026-05-15 AM superseded by v2.1 mid-day) |
| Status | Permanent operating doctrine · ratifies DOC-V20-TEMPLATE-CANONICAL-FILE on landing (BINDING #35 candidate) |
| Distribution | Devin (spec author + §12 reviewer) · IT agents (executors) · MC (sequencer) · Ryan (CEO) · Pam (Cowork) · Sylvia (Track B B5 inheritance) |
| Path | `/Users/ryanhallee/Downloads/skills/LegacyLoop_Command_Template_V20.md` |
| Doctrine count | 32 BINDING · #27 + #32 reserved gaps |
| New from V19 | PART 0 EMIT RULES · §0.7 PUSH-BACK · §5.X CEO GATES · §12.5 INTERIM · PART G TWO-TRACK · PART H WAVE-LEVEL DEEP-DIVE · PART M WCS · PART N COMPETITOR |
| Restored from V15 | §12 EXACT box format · §8 MAY/MAY NOT · "Never assume" four-laws quote · THE STANDARD front-load |
| Hybrid scope | V15 spine + V19 spine + R29 doctrine + WCS audit + Competitor audit · 5 source documents merged |

---

## V20 MAINTENANCE LOG

- **v2.1 · 2026-05-15 (Fri mid-day · this patch)** — Devin L1 surgical patch. CEO caught Agent B P51 §12 (Wave 9 Slot 3 GREEN) dropped V15 6-bullet FLAGS observations entirely · Agent A P50 kept them · inconsistent agent behavior root cause = V20 v2 said "FLAGS observations preserved" without "MANDATORY EMIT" label = Agent B treated as optional. Patch makes BOTH sections (V15 6-bullet observations + V20 8-category routing) explicit MANDATORY EMIT via RULE 0.1.A sub-clause · §12 box headers verbatim "FLAGS · V15 6-BULLET OBSERVATIONS · MANDATORY EMIT" + "FLAG ROUTING · V20 8-CATEGORY · MANDATORY EMIT" · per-bullet "none" acceptable but bullet header MUST appear · PART E checklist 16 → 18 items (new 13 + 14 explicit dual-section verify · re-numbered for clarity) · also corrected V15 6-bullet (was 7 in v2 · v2.1 drops "Pre-flight obs" per CEO patch directive exact 6-bullet form). Surgical · ~7 min Devin time · zero new sections · zero structure change.
- **v2 · 2026-05-15 (Fri AM · this rebuild)** — Devin L1 rebuild post CEO reject of v1. Front-loaded THE STANDARD · "Never assume" quote · §12 EXACT V15 box (preserved verbatim · enriched with §0.5 confirmation + BINDING #34 cite + rider sub-box + 8-point check · 7-bullet observations preserved + 8-cat routing added) · §8 V15 MAY/MAY NOT restored verbatim · PART M WCS reference (7 pillars · 12 effects · 18 benchmarks) · PART N competitor reference (7 apps · 54 patterns · P0/P1/P2 queue). 17 changes total · 5 source docs merged.
- **v1 · 2026-05-15 (Fri AM · REJECTED)** — initial Devin author. §12 box buried under PART 0 abstractions. §8 absent. Standards absent. "Never assume" quote absent. WCS + competitor refs absent. CEO rejected. v2 supersedes.

---

*End of LegacyLoop V20 Command Template · Canonical Hybrid v2*
*Ratifies DOC-V20-TEMPLATE-CANONICAL-FILE on landing · BINDING #35 candidate*
*Tesla. SpaceX. Anthropic. Claude AI. Awwwards. $1B bar. Connecting Generations.*
*Drive on.*

---

## PART X · ENDPOINT DISCOVERY PATTERNS CANONICAL (NEW v2.3 · BINDING #44 LAW depth)

Pre-fire live-probe (BINDING #44 LAW) must catch these 4 failure-class patterns:

### X.1 · Redirect dead-end (307/302 chain)

Example: Hagerty `/valuationtools/` → 307 redirect (9 bytes JSON · no content).
Indicator: HTTP 307 OR 302 · `Content-Length` < 100 bytes · no `<html>` body.
Action: BINDING #31 push-back-with-replacement · pivot to canonical landing path.
Anchor: DOC-HAGERTY-VALUATIONTOOLS-REDIRECT-DEADEND 1/5 (Wave 22C P3 Lane 2).

### X.2 · Cloudflare anti-bot 403 ("Just a moment...")

Example: Whatnot `/browse/*` ALL endpoints = 403 with body title "Just a moment..."
Indicator: HTTP 403 · `<title>Just a moment...</title>` · `cf-mitigated: challenge`.
Action: BINDING #31 push-back · bank to A2 Apify CYL (headless browser) OR substitute target.
Anchor: DOC-WHATNOT-CLOUDFLARE-DEAD-END + DOC-WORTHPOINT-CLOUDFLARE-DEAD-END 1/5 (Wave 22C P3 Lane 3).

### X.3 · React/Next.js SPA shell (200 but empty content)

Example: Liveauctioneers `/c/collectibles/16/` = 200 text/html BUT body = `<link rel=preload>` tags + `dist/*.client.js` paths · NO catalog data.
Indicator: HTTP 200 · body contains "preload" + "client.js" but zero data keywords.
Action: bank to A2 Apify CYL (SSR-render) OR API path discovery cyl OR substitute target.
Anchor: DOC-LIVEAUCTIONEERS-REACT-SPA-SHELL-CONTENT-DEPTH-LOW 1/5 (Wave 22C P3 Lane 3).

### X.4 · Next.js soft-404 (200-style body · 404 header)

Example: MaxSold `/sell-with-us` = 404 BUT body 85k bytes rendered (next.js soft-404).
Indicator: HTTP 404 · `Content-Length` > 50k · `<html>` body present.
Action: BINDING #31 push-back · pivot to canonical valid endpoint family.
Anchor: DOC-MAXSOLD-NEXTJS-SOFT-404-DRIFT 1/5 (Wave 22C P3 Lane 4).

### Pre-fire probe checklist (mandatory · BINDING #44 LAW)

For each target URL:
1. cite HTTP code
2. cite Content-Type
3. cite body size (bytes)
4. cite first 80-150 chars verbatim
5. flag any X.1-X.4 pattern detected
6. if pattern detected · BINDING #31 push-back inline with replacement candidate cited



---

## PART X-B · SYLVIA APIFY N8N-DIRECT PATTERN CANONICAL (NEW v2.4 · BINDING #48 LAW)

Cited verbatim from Standards file: `~/Downloads/skills/Standards/N8N_APIFY_CANONICAL_PATTERN_2026-05-22.md` (SHA `66dac2dd5daf3d5fd77e01e6ed16e31afe1b7d85f32f86b2d19efa2cd57b2944`).

Sylvia Phase C n8n WFs reach Apify via n8n HTTP node + n8n credential. App `lib/market-intelligence/` infra UNTOUCHED (kill switch + 12-actor block list + 20+ adapters + tier registry + cost ceilings · LIVE 48 days · CEO directive #1 absolute).

### n8n credential

- Name: `Apify API · Sylvia Phase C`
- Type: HTTP Header Auth (n8n native)
- Header Name: `Authorization` · Value: `Bearer <apify-token>` (CEO paste only · NEVER in spec/docs/§12 · BINDING #9 LAW)
- Storage: n8n encrypted-at-rest

### Canonical 5-step n8n flow

| Step | Node | URL | Output |
|---|---|---|---|
| A · Kick | HTTP POST | `https://api.apify.com/v2/acts/{actor-slug}/runs` | `{data:{id,status,defaultDatasetId,...}}` |
| B · Poll | HTTP GET + Wait + IF loop | `https://api.apify.com/v2/actor-runs/{run-id}` | exit when `data.status==="SUCCEEDED"` · 5s interval · 300s timeout |
| C · Fetch | HTTP GET | `https://api.apify.com/v2/datasets/{dataset-id}/items?format=json&limit=20` | items array |
| D · Native Aggregate | n8n-nodes-base.aggregate | aggregateAllItemData · destinationFieldName=entries · include=allFields | accumulates per Option C topology |
| E · Build Payload + Webhook | Code + HTTP POST | `https://app.legacy-loop.com/api/webhooks/n8n` | canonical `data:` wrapper per BINDING #47 LAW |

### n8n-native safety primitives (Sylvia Phase C scope · app side UNTOUCHED)

| Concern | App-side (DO NOT TOUCH) | n8n-native canonical |
|---|---|---|
| Kill switch | `lib/market-intelligence/scraper-killswitch.ts` + `APIFY_KILL_SWITCH` env | n8n WF `active=false` toggle · fleet API loop ~30s for 20 WFs |
| Block list | `lib/market-intelligence/blocked-actors.ts` 12 actors | n8n WF actor-slug HARDCODED in HTTP node URL · WF IS allowlist |
| Rate limit | dispatch-layer throttle | n8n HTTP "limit batch size" + Wait node delay |
| Cost ceiling | `lib/market-intelligence/cost-ceiling.ts` greedy $0.02/$0.07 | Apify dashboard per-actor + plan $29/mo cap (shared with app · acceptable) |
| Cost tracking | per-bot allowlist + tier registry | Apify dashboard filter by token (split if separate Sylvia token) |
| Audit trail | adapter logs + Build-Monitor | n8n exec history + Vercel webhook logs + Turso row attribution |

★ **DO NOT use this pattern for app bots.** App bots (CarBot · CollectiblesBot · etc) use `lib/market-intelligence/scraper-dispatch.ts` (LIVE 48 days · DO NOT TOUCH per CEO directive #1).

Sylvia Phase C uses this n8n-direct path EXCLUSIVELY (separate call path · zero overlap empirical · BINDING #42 ANALOG · Single-Egress).

### Wave 22F+ candidates using this pattern

- WF45 V8 KBB → Cars.com Apify pivot ($2.99/1k · actor `fatihtahta/cars-com-scraper` candidate · Akamai bypass)
- V13 BrickLink + Reverb NEW (TBD actor)
- V14 DocumentBot NEW vertical (TBD)
- V12 FraudBot deeper sources (cascade refactor)
- Custom Sylvia actors (CEO directive · build-our-own framework · banked separate cyl)

Anchor cyl: CMD-SYLVIA-APIFY-N8N-DIRECT-WIRING V20 LOW (Cyl 6 V3) · BINDING #48 LAW ratified Wave 22E P1 ceremony 2026-05-22.

---

## PART X-C · WAVE 22B v4.1 `_splitMeta` DEDUP GUARD (NEW v2.4 · informed by Cyl 5 WF29 NHTSA)

Pre-author Extract jsCode scan for duplicate `const _splitMeta` declarations.

### Guard rule

- Template Extract jsCode MUST contain SINGLE `const _splitMeta = $('Split URLs (per-URL loop · 1 req/sec)').item.json || {};` declaration
- If legacy v4 / pre-v4.1 templates retained duplicate declaration · ratify removal via audit-grade dedup comment:
  ```javascript
  // dedup-removed-2026-05-XX · BINDING #46 LAW exception SCOPED · MC pre-ratified
  // const _splitMeta = $('Split URLs (per-URL loop · 1 req/sec)').item.json || {}; // ← legacy duplicate · retired
  ```
- BINDING #46 LAW (Extract jsCode UNCHANGED) exception SCOPED to dedup ONLY · NO behavior change · MC pre-ratification required for any other Extract edit

### Pre-fire check (mandatory)

For any spec touching Extract jsCode:
1. Cite Extract jsCode bytes pre-spec verbatim
2. Cite `_splitMeta` declaration count via `grep -c "const _splitMeta"`
3. If count > 1 · flag drift · BINDING #31 push-back-with-replacement inline OR bank dedup separate cyl
4. If spec applies dedup · cite MC pre-ratification timestamp + scope comment template above

Anchor cyl: Cyl 5 WF29 NHTSA Wave 22B v4.1 surgical fix consideration · banked permanent (template guard prevents future class).

---

## PART X-D · v2.4 CEREMONY ENFORCEMENT (BINDING #47 LAW points)

3 enforcement points layered on existing canonical sections (zero rewrite · cite-only):

### Enforcement 1 · §2 BP example shape (BINDING #47 LAW)

When spec FIX block authors Build Payload jsCode · MUST emit:

```javascript
const aggregated = $input.first().json;
const entries = aggregated.entries || [];
if (entries.length === 0) return [{ json: { skip: true, reason: 'no-entries-extracted' }}];
const corpusId = 'wf-vN-source-YYYY-MM-DD';
const verticalId = '<V?>';
const domain = '<?>';
const sourceTier = '<T?>';
return [{ json: { action: 'phase_c_ingest', data: { entries, corpusId, verticalId, domain, sourceTier, batchSize: entries.length, emittedAt: new Date().toISOString() }}}];
```

LAW: webhook handler reads `payload.data.entries`. NO top-level `entries` key. NO flat `{action, entries, corpusId, ...}` shape. Cite this example verbatim in spec §2 FIX blocks for any BP-bearing WF authoring.

### Enforcement 2 · §0.5 14-check → 15-check (NEW check 15)

Add to §0.5 DEEP-DIVE checklist (BINDING #30 LAW):

| 15 | Spec §2 BP shape MUST nest under `data:` key per WF30 Met canonical (BINDING #47 LAW) | grep `action.*phase_c_ingest.*data:.*entries` verify pre-PUT |

Pre-FIX-1 mandatory · IT Agent cites check 15 in §0.5 emit alongside checks 1-14.

### Enforcement 3 · §12 PART J shell BP cite

§12 SHELL · post-PUT section · cite BP shape verbatim under FIX block:

```
FIX 2 · WF<N> built · BP shape canonical `data:` wrapper (BINDING #47 LAW):
        {action: 'phase_c_ingest', data: {entries, corpusId, verticalId, domain, sourceTier, batchSize, emittedAt}}
        zero top-level entries · zero flat shape leak
```

Per-spec verification in §12 emit · IT Agent cites shape match empirical.

---

## PART X-E · v2.4 absorption summary

| Anchor | LAW/BINDING | Enforcement point |
|---|---|---|
| #11 FLAT shape canonical (PERMANENT LAW) | 17+ cumulative proofs · 22-of-22 WFs | Source URLs node emits FLAT spread top-level (Source URLs cite cumulative) |
| #12 partial-yield retire-fixed (PERMANENT LAW) | Option C native_aggregate cascade | Topology section · Option C canonical for new authoring |
| #13 BP-meta-recovery (PERMANENT LAW) | Per-WF hardcoded BP literals | NO generic fallback · per-WF cite |
| BINDING #47 BP `data:` wrapper | webhook handler contract | PART X-D §1+§2+§3 enforcement |
| BINDING #48 Apify n8n-direct | Sylvia Phase C path · app SoT preserved | PART X-B canonical |

13 PERMANENT LAW LIVE post-ceremony (10 sustained #38-#46 + #11 + #12 + #13). 42+ BINDING canonical (40 + #47 + #48).

Banked Wave 22F+: V20 v2.5 absorbs Wave 22F doctrine cadence + Apify guardrails 2/3 + 3/3 + WF43 V12 cascade refactor + WF29 NHTSA surgical fix (optional).
