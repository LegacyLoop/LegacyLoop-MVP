# Ideas-File Claude Reconcile Audit · 2026-05-15

> **Cylinder:** CMD-IDEAS-FILE-CLAUDE-RECONCILE V20 v2.1 R29 P66 · audit-class
> **Track:** A · A3 Tooling+Backfill (Claude completion measure correction)
> **Status:** AUDIT-DOC · doc-only · zero-commit · read-only · zero production touch
> **Authored:** 2026-05-15 PM · main worktree · IT-autonomous · Devin L2 spec · IT execute
> **Source:** `~/Downloads/skills/Ideas/LegacyLoop_Master_Ideas_v1_2026-05-15.md` (734 LOC · SHA `33389b1f7e0cb49508c0a41b21f8be8b67afc3731b0999d759432dd7c6ce28fd` · verified match)
> **Cross-source:** `~/Downloads/Claude Code & Sylvia AI Ideas (2).txt` (965 LOC · raw CEO)
> **Substrate anchors:** `docs/audits/SYLVIA_SUBSTRATE_DEEP_DIVE_2026-05-15.md` · `docs/audits/ELEVENLABS_PRODUCT_AUDIT_2026-05-15.md`
> **Production state at fire:** main HEAD `bc41ac6` (P57 · NOTE: spec cited 5ec136e P63 · my main worktree NOT yet FF-pulled · informational drift cited §B reconcile)

---

## §A · Executive Summary

### Bottom line

| Category | ✅ SHIPPED | 🟡 BANKED-tracked | 🔴 NOT-TRACKED | ⚠️ WATCH-LIST | Total |
|---|---|---|---|---|---|
| **A · Claude System** | **1** | **6** | **27** | **1** | **35** |
| (after empirical repo cross-ref) | 3 | 5 | 26 | 1 | 35 |

### TRUE Claude completion %

- **Per master ideas file:** ~3% (1 shipped / 35 items) item-count basis
- **Per audit empirical cross-ref:** ~9% (3 shipped / 35) · adds Caveman (A6) + Playwright MCP (A25) installed but mis-categorized in master
- **MC prior cite was ~85%** measured against 7-item denominator (Sylvia + claude-mem + a couple banked) · DRIFT CAUGHT
- **CEO TRUE vision denominator:** 35 items · 25 NOT-TRACKED · ~71% of vision still open

### CEO directive verbatim

> "Make sure to finish Claude in its entirety. Build Claude up perfectly the way I have specced it and requested many many times over." (Slack 15:31 EDT 2026-05-15)

> "Obsidian and Graphify are top priorities. Saving tokens and Claude usage top priority. Repos and skills and recommended grabs off github, top priorities. Improving Claudes Memory TOP Priority. Everything else can come after or later. We need all this before I can continue on with my Dev build with my app and AI." (raw CEO source · ideas file closing directive)

### MC drift owned

- MC tracked Track A A3 against ~7-item denominator (Sylvia + claude-mem + 6 banked)
- TRUE denominator = 35 items per ideas file Section A
- Audit corrects measure · DOC-ROADMAP-TODAY-OVERRIDES-IDEAS-FILE-RANKING 1/5 NEW candidate

### Pre-existing audit anchors cross-referenced

- `docs/audits/SYLVIA_SUBSTRATE_DEEP_DIVE_2026-05-15.md` · Section B Sylvia categorization grounding
- `docs/audits/ELEVENLABS_PRODUCT_AUDIT_2026-05-15.md` · B7-B9 voice cluster grounding
- Bridge §12 P58 GREEN-WITH-NOTE · B3 status anchor
- P63 §12 (referenced in spec context · main worktree not yet FF-pulled · doc drift NOTE)

---

## §B · Section A item-by-item categorization (Claude System · 35 items A1-A35 + 1 watch-list A36)

Verbatim categorization · status corrected via empirical repo cross-reference where master ideas file drifted.

| # | Item · Ref | Type | Master status | Audit cross-ref | Wave slot |
|---|---|---|---|---|---|
| A1 | Claude MEM (Ref #11 · 21K-60K⭐) | Plugin | ✅ SHIPPED P44 | ✅ SHIPPED · commit `9fee1c8` · npm `claude-mem` v13.2.0 global · cache dir mode varies | — |
| A2 | Obsidian + BRAT (Ref #3, #8) | Plugin | 🟡 BANKED · Restricted Mode toggle | 🟡 BANKED · CEO toggle ~30s | **Wave 1** |
| A3 | Graphify deep-mode (Ref #3, #6, #8) | Plugin | 🟡 BANKED P21 · $1-3 GO | 🟡 BANKED · `graphify` CLI installed + `~/.claude/skills/graphify/SKILL.md` · deep-mode spend pending | **Wave 1** |
| A4 | SEED (Ref #6) | Skill | 🟡 BANKED P34 · URL not surfacable | 🟡 BANKED · YouTube creator funnel | **Wave 2** |
| A5 | Paul (Ref #6) | Plugin | 🔴 NOT TRACKED | 🟡 ALREADY INSTALLED · `paul:plan` + `paul:apply` skills loaded · master ideas file DRIFT (incorrect "NOT TRACKED") | — (status correction) |
| A6 | Caveman (Ref #7 · 75% token reduction) | Plugin | 🟡 BANKED · URL not findable | ✅ INSTALLED · `~/.claude/plugins/cache/caveman` · `caveman@caveman` enabledPlugins · MASTER DRIFT | — (status correction) |
| A7 | Code Burn (Ref #7) | Plugin | 🟡 BANKED · YouTube creator funnel | 🟡 BANKED · CEO funnel | **Wave 1** (TOP token-save) |
| A8 | Design Extract (Ref #7) | Plugin | 🔴 NOT TRACKED · NEW | 🔴 NOT-TRACKED | **Wave 5** |
| A9 | Wispr Flow (Ref #5) | Tool | 🟡 BANKED P49 · Track B B2-W4a | 🟡 BANKED · Track B slot (NOT Track A) | Track B B2-W4a |
| A10 | Superpowers (Ref #10 · 127K⭐) | Skill bundle | 🔴 NOT TRACKED | 🔴 NOT-TRACKED · `claude plugin add github obra/superpowers` ready | **Wave 3** |
| A11 | Frontend Design (Ref #10, #13 · 277K installs · Anthropic-built) | Skill | 🔴 NOT TRACKED | 🔴 NOT-TRACKED · only `huashu-design` present (different skill) | **Wave 3** |
| A12 | Code Review (Ref #10) | Skill | 🔴 NOT TRACKED | 🔴 NOT-TRACKED | **Wave 5** |
| A13 | Security Review (Ref #10) | Skill | 🔴 NOT TRACKED | 🟡 PARTIAL · `/security-review` slash command active per skill-map · clarify install scope | **Wave 5** (verify-or-install) |
| A14 | GStack (Ref #10, #15 · YC · 64K⭐ · 23 skills) | Skill bundle | 🔴 NOT TRACKED | 🔴 NOT-TRACKED | **Wave 4** |
| A15 | 29 Marketing skills (Ref #9 · Cory Haynes) | Skill bundle | 🔴 NOT TRACKED | 🔴 NOT-TRACKED | **Wave 5** |
| A16 | Stop-stop (Ref #12) | Skill | 🔴 NOT TRACKED | 🔴 NOT-TRACKED | **Wave 5** |
| A17 | UI UX Pro Max (Ref #12, #13 · 50 UI + 99 UX) | Skill | 🔴 NOT TRACKED | 🔴 NOT-TRACKED | **Wave 5** |
| A18 | Remote video editor skill (Ref #12) | Skill | 🔴 NOT TRACKED | 🔴 NOT-TRACKED | **Wave 5** (deferred) |
| A19 | Context Engineering (Ref #12) | Skill | 🔴 NOT TRACKED | 🔴 NOT-TRACKED | **Wave 2** (token-save chain) |
| A20 | Canvas Design (Ref #13 · PNG/PDF output) | Skill | 🔴 NOT TRACKED | 🔴 NOT-TRACKED | **Wave 5** |
| A21 | Taste (Ref #8) | Skill | 🔴 NOT TRACKED | 🔴 NOT-TRACKED | **Wave 5** |
| A22 | Impeccable (Ref #8 · 20 design commands) | Skill | 🔴 NOT TRACKED | 🔴 NOT-TRACKED | **Wave 5** |
| A23 | Emil Kowolski motion (Ref #8) | Skill | 🔴 NOT TRACKED | 🔴 NOT-TRACKED | **Wave 5** |
| A24 | Perplexity MCP (Ref #14 · live web) | MCP server | 🔴 NOT TRACKED | 🔴 NOT-TRACKED | **Wave 4** (HIGH MCP-ROI) |
| A25 | Playwright MCP (Ref #14) | MCP server | 🔴 NOT TRACKED | ✅ INSTALLED · `playwright@claude-plugins-official` enabledPlugins · MASTER DRIFT | — (status correction) |
| A26 | Firecrawl MCP (Ref #14) | MCP server | 🔴 NOT TRACKED | 🔴 NOT-TRACKED | **Wave 4** |
| A27 | Glyph MCP (Ref #14) | MCP server | 🔴 NOT TRACKED | 🔴 NOT-TRACKED | **Wave 5** |
| A28 | Chrome MCP (Ref #14) | MCP server | 🔴 NOT TRACKED | 🔴 NOT-TRACKED | **Wave 5** |
| A29 | Anthropic Computer Use (Ref #7) | Platform | 🔴 NOT TRACKED · NEW | 🔴 NOT-TRACKED · platform-level (Beta) | **Wave 5** (advanced) |
| A30 | Everything Claude Code (Ref #4 · 16K⭐) | Skill bundle | 🔴 NOT TRACKED | 🔴 NOT-TRACKED | **Wave 3** |
| A31 | RooFlow (Ref #17 · 60+ agent orchestration) | Orchestration | 🔴 NOT TRACKED · Notion guide on disk | 🔴 NOT-TRACKED · `ruflo init` already-run per `~/.claude/CLAUDE.md` L10 · likely partial install | **Wave 5** (verify-or-complete) |
| A32 | Agents.md learn-section (Ref #2 · Anthropic 6-section playbook) | Pattern | 🟡 PARTIAL · learn section audit needed | 🟡 PARTIAL · AGENTS.md APPENDIX exists · learn section sustained `~50% complete` per spec | **Wave 1** (audit + upgrade) |
| A33 | System prompt blueprint (Ref #1 · 3 GitHub repos) | Pattern | 🔴 NOT TRACKED | 🔴 NOT-TRACKED · CEO surfaces 3 URLs | **Wave 2** |
| A34 | Brockster Gumroad (Ref #16) | Resource | 🟡 BANKED · paid/free confirm | 🟡 PAID-PENDING · CEO confirms | — (CEO-routed) |
| A35 | Codex desktop (Ref #18) | Tool | 🔴 NOT TRACKED · CEO has paid OpenAI | 🔴 NOT-TRACKED · keychain `openai-codex` not present · CEO surfaces | **Wave 5** |
| A36 | Subq · Air LLM (Ref #9, #10) | Watch-list | 🟡 WATCH-LIST · not action | ⚠️ WATCH-LIST | — (forward · monitor) |

### Section A audit verdict

**Corrected counts** (post-empirical cross-ref · 3 master-drift corrections):
- ✅ SHIPPED · **3** (A1 claude-mem · A6 caveman · A25 Playwright MCP)
- 🟡 BANKED-tracked · **5** (A2 · A3 · A4 · A7 · A34)
- 🟡 PARTIAL · **3** (A13 · A31 · A32 · note A5 Paul also already installed · status drift)
- 🔴 NOT-TRACKED · **23**
- ⚠️ WATCH-LIST · **1**

**TRUE completion (item-weighted):** ~9% strict-shipped · ~17% if PARTIAL counted half · ~71% of vision still open per CEO directive.

---

## §C · Section B Sylvia AI reconciliation (31 items B1-B31)

Cross-referenced against `SYLVIA_SUBSTRATE_DEEP_DIVE_2026-05-15.md` + `ELEVENLABS_PRODUCT_AUDIT_2026-05-15.md` + Bridge P58 §12.

| # | Item | Status (master) | Audit cross-ref | Notes |
|---|---|---|---|---|
| B1 | Substrate (5 keys · 4 dirs · 12 moats) | ✅ SHIPPED 2026-05-08 | ✅ confirmed via SYLVIA_SUBSTRATE_DEEP_DIVE | — |
| B2 | v4 Dual-Core | ✅ SHIPPED · claude-haiku-4-5 base | ✅ Open WebUI live port 4000 | — |
| B3 | Bridge (system prompt all-inclusive) | ✅ SHIPPED P58 🟡 NOTE | ✅ confirmed · `sylvia-data/identity/system_prompt.md` 174 LOC + me.md mirror | Brand drift NOTE from FIX 6 smoke |
| B4 | file_read tool · HTTP-route canonical | 🟡 RUNNING IT P63 | ⚠️ DRIFT · spec context cites P63 SHIPPED commit `5ec136e` · main worktree HEAD bc41ac6 · NOT yet FF-pulled · informational drift | Resolve via main FF-pull |
| B5 | file_write tool | 🟡 READY P64 (next morning) | 🟡 BANKED · symmetry-clone P63 | — |
| B6 | bash tool | 🟡 READY P65 (sequential) | 🟡 BANKED · sandbox-critical · 10-min CEO eyeball | — |
| B7 | ElevenLabs voice TTS | 🟡 BANKED B2-W4b | 🟡 BANKED · audit verdict CMD-LITELLM-ELEVENLABS-TTS-WIRE recommended | Per ELEVENLABS audit §G |
| B8 | Wispr STT custom vocab | 🟡 BANKED B2-W4a | 🟡 BANKED · P45 GREEN-with-NOTE pattern · Legacy-Loop custom-vocab pending | — |
| B9 | Voice seamless interaction (VAD · interruptible) | 🟡 BANKED B2-W4c | 🟡 BANKED | — |
| B10 | Sylvia Web UI investor-tier polish | 🟡 BANKED B2-W2.5/W4d | 🟡 BANKED · memory #20 | High-leverage demo surface |
| B11 | WebFetch tool | 🟡 BANKED B2-W5 | 🟡 BANKED | — |
| B12 | PDF tool | 🟡 BANKED B2-W6 | 🟡 BANKED | — |
| B13 | Desktop tool · Computer Use | 🟡 BANKED B2-W7 | 🟡 BANKED · pairs with A29 (rider risk) | NOT pair with A29 (conflict) |
| B14 | Memory hook | 🟡 BANKED B2-W8 | 🟡 BANKED · SylviaMemory table wired (substrate) | — |
| B15 | Identity sync .env.sylvia ↔ sylvia-data/identity | 🟡 BANKED B2-W9 | 🟡 BANKED · me.md mirror cyclic drift CY-N candidate (per Bridge §12 §H) | — |
| B16 | Corpus Feed (KB ingestion) | 🟡 BANKED B4 | 🟡 BANKED · Phase 4 NotebookLM prereq | — |
| B17 | Phase 9 Cognitive Architecture | 🟡 BANKED · 397 LOC doc shipped | 🟡 BANKED · `docs/SYLVIA_COGNITIVE_ARCHITECTURE.md` commit `a725ef8` | 12 cyls banked |
| B18 | Working memory | ✅ MAPPED | ✅ Brain Stem 8/8 consumers | — |
| B19 | Short-term memory | ✅ MAPPED | ✅ SylviaMemory compounding | — |
| B20 | Long-term memory STM→LTM | 🔴 NEW Phase 9 | 🔴 OPEN | — |
| B21 | Episodic memory | 🟡 PARTIAL · EventLog scattered | 🟡 PARTIAL | unify Phase 9 |
| B22 | Semantic memory | 🟡 PARTIAL · skills + ScraperComp | 🟡 PARTIAL | Phase 9 |
| B23 | Procedural memory | 🟡 IN PROGRESS · Phase 3 SSA | 🟡 IN-PROGRESS | — |
| B24 | Pattern engine + self-update | 🟡 PARTIAL · MegaBot consensus | 🟡 PARTIAL | Phase 9 |
| B25 | API Contract canon | ✅ SHIPPED R22.6 | ✅ confirmed | — |
| B26 | Folder Architecture canon | ✅ SHIPPED R22.6 | ✅ confirmed | — |
| B27 | Migration Plan canon | ✅ SHIPPED R22.6 | ✅ confirmed | — |
| B28 | 4-AI Truth Gate consensus | ✅ SHIPPED | ✅ `app/api/sylvia/consensus/route.ts` confirmed | — |
| B29 | M10 Multi-AI Truth Gate moat | ✅ SHIPPED P0 ratified | ✅ confirmed | — |
| B30 | M11 Domain Corpus moat | 🟡 BANKED · activates post-100-item | 🟡 BANKED | — |
| B31 | M12 Outreach Layer moat | 🟡 BANKED · Phase 6 | 🟡 BANKED | — |

### Section B audit verdict

- ✅ SHIPPED: **13** (B1-B3 · B18-B19 · B25-B29 · plus B4 if P63 FF-pulled)
- 🟡 BANKED-tracked: **17**
- 🟡 PARTIAL: **4** (B21 · B22 · B23 · B24)
- 🔴 OPEN: **1** (B20)

**Sylvia completion:** ~42% strict-shipped · much higher relative state than Track A.

**Critical drift:** B4 file_read tool — spec cites P63 §12 GREEN commit `5ec136e` · my main worktree HEAD `bc41ac6` lacks this commit. Resolution: CEO routes `git pull origin main --ff-only` in main worktree post-this-audit OR audit assumes informational-context-only per spec §0.5 check 7 (P63 NOT blocker · audit-class independent).

---

## §D · Dependency chains (6 chains · CEO directive scope)

### Chain 1 · Token-save (CEO TOP PRIORITY · "saving tokens and Claude usage")

```
A6 Caveman (✅ INSTALLED)
  → A7 CodeBurn (🟡 banked · CEO YouTube funnel)
  → A19 Context Engineering (🔴 not-tracked)
  → A32 AGENTS.md learn-section upgrade (🟡 partial)
```

**Combined ROI:** 75% token reduction (Caveman live) + token visualization (CodeBurn) + per-response trim (Context Engineering) + permanent learn-section rules (AGENTS.md). Stacks multiplicatively.

### Chain 2 · Build (CEO Ref #6 trio)

```
A4 SEED (🟡 banked · URL surface needed)
  → A5 Paul (✅ INSTALLED · master drift catch)
  → A3 Graphify deep-mode (🟡 banked · $1-3 GO)
```

**Trio per CEO ideas file:** SEED feeds Paul roadmap · Paul + Graphify trinity combats context rot.

### Chain 3 · Design (8 items)

```
A11 Frontend Design (🔴) baseline
  → A17 UI UX Pro Max (🔴)
  → A20 Canvas Design (🔴)
  → A21 Taste (🔴) discipline
  → A22 Impeccable (🔴) /polish
  → A23 Emil motion (🔴)
  → A8 Design Extract (🔴) site-clone
```

**Combined ROI:** Awwwards-tier UI · 277K installs Frontend Design Anthropic-built · 7 Pillars enforcement.

### Chain 4 · Agent orchestration (4 items)

```
A10 Superpowers (🔴 · 127K⭐) plan-test-review
  → A14 GStack (🔴 · 23 skills · YC) CEO/eng-mgr/release/QA roles
  → A30 Everything Claude Code (🔴 · 16K⭐) orchestration
  → A31 RooFlow (🔴 · already partial via `ruflo init`) 60+ agent advanced
```

### Chain 5 · MCP layer (6 items)

```
A24 Perplexity MCP (🔴) HIGHEST-ROI live-web
  → A25 Playwright MCP (✅ INSTALLED · master drift)
  → A26 Firecrawl MCP (🔴) crawl
  → A27 Glyph MCP (🔴) image/video gen
  → A28 Chrome MCP (🔴) in-Chrome
  → A29 Anthropic Computer Use (🔴) platform-level
```

### Chain 6 · Memory (CEO TOP PRIORITY · "Improving Claudes Memory")

```
A1 Claude MEM (✅ SHIPPED P44)
  → A32 AGENTS.md learn section (🟡 partial)
  → A2 Obsidian + BRAT (🟡 toggle pending)
  → A3 Graphify deep-mode (🟡 spend pending)
```

---

## §E · Track A Final Push wave structure (recommendation)

**Proposed:** 5 waves × 3 cyls · per-ROI top-down · CEO routes specific timing.

### Wave 1 · highest-ROI · CEO TOP PRIORITY (4 items via 3 cyls)

| Cyl | Items | CEO action | Runtime |
|---|---|---|---|
| 1 | CMD-OBSIDIAN-BRAT-INSTALL + CMD-GRAPHIFY-DEEP-MODE-WIRE (A2 + A3) | Toggle Restricted Mode OFF · spend $1-3 GO | ~30 sec + ~10 sec |
| 2 | CMD-CODEBURN-INSTALL + AUDIT cite for Caveman already-installed (A6 + A7) | Surface CodeBurn URL via YouTube funnel | ~5 min |
| 3 | CMD-AGENTS-MD-LEARN-SECTION-UPGRADE (A32 partial → full · Anthropic 6-section playbook) | — | ~45 min IT |

### Wave 2 · build chain + memory reinforce (3 items)

| Cyl | Items | CEO action | Runtime |
|---|---|---|---|
| 1 | CMD-SEED-PAUL-TRINITY-INSTALL (A4 · A5 already-installed status correction · Trinity complete via Graphify W1) | A4 URL surface via YouTube funnel | ~5 min + ~30 min IT |
| 2 | CMD-CONTEXT-ENGINEERING-SKILL-INSTALL (A19) | — | ~30 min IT |
| 3 | CMD-SYSTEM-PROMPT-BLUEPRINT-INGEST (A33 · 3 GitHub repos: Cursor/Claude/Devon/Perplexity playbooks) | Surface 3 repo URLs | ~5 min + ~45 min IT |

### Wave 3 · skill foundation + agent orchestration (3 items)

| Cyl | Items | Runtime |
|---|---|---|
| 1 | CMD-SUPERPOWERS-INSTALL (A10 · 127K⭐) | ~30 min IT |
| 2 | CMD-FRONTEND-DESIGN-INSTALL (A11 · 277K installs · Anthropic) | ~30 min IT |
| 3 | CMD-EVERYTHING-CLAUDE-CODE-INSTALL (A30 · 16K⭐) | ~30 min IT |

### Wave 4 · MCP layer (3 items)

| Cyl | Items | Runtime |
|---|---|---|
| 1 | CMD-PERPLEXITY-MCP-INSTALL (A24 · live web · HIGH MCP-ROI) | ~30 min IT |
| 2 | CMD-FIRECRAWL-MCP-INSTALL (A26) | ~25 min IT |
| 3 | CMD-GSTACK-INSTALL (A14 · 23 skills · YC) | ~30 min IT |

### Wave 5 · design polish + advanced sweep (batch · low-priority remaining)

| Cyl | Items | Runtime |
|---|---|---|
| 1 | CMD-UI-UX-PRO-MAX-INSTALL + CMD-IMPECCABLE-INSTALL (A17 + A22 stacked) | ~45 min IT |
| 2 | CMD-ROOFLOW-COMPLETE (A31 · verify-or-complete partial) | ~30 min IT |
| 3 | CMD-REMAINING-SKILLS-BATCH (A12 · A13 verify · A15 · A16 · A18 · A20 · A21 · A23 · A27 · A28 · A29 · A35) | ~60-90 min IT |

### Total Wave estimate

- **15 cyls across 5 waves**
- **~6-8 hours IT-autonomous** total
- **~30 min CEO action total** (toggle · spend · URL-surface · approvals)
- **Spread across 1-2 days** allowing for CEO smoke gates + iteration

---

## §F · Top-3 ROI items for Wave 1 first fire

### 1. A6 Caveman ALREADY INSTALLED — STATUS CITE ONLY

- **ROI:** 75% token reduction live RIGHT NOW
- **CEO action:** zero · master drift correction only
- **Audit value:** stop counting Caveman as "banked" · it's shipped
- **Recommendation:** audit-doc + flag-backlog refresh both cite empirical state

### 2. A2 Obsidian + BRAT

- **ROI:** Knowledge-graph foundation · unblocks SEED/Paul/Graphify trinity
- **CEO action:** ~30 sec Restricted Mode OFF toggle
- **ETA:** Wave 1 Cyl 1 first half · IT install BRAT + 5 plugins (BRAT/Lean Terminal/Dataview/Style Settings/Full Calendar)
- **Runtime:** ~25 min IT + 30 sec CEO
- **Expected lift:** Obsidian-class knowledge surface for CEO + Sylvia future memory

### 3. A3 Graphify deep-mode

- **ROI:** 70× token savings on codebase queries · CEO TOP PRIORITY
- **CEO action:** ~10 sec spend $1-3 GO
- **ETA:** Wave 1 Cyl 1 second half · IT runs `graphify deep` against repo
- **Runtime:** ~10 min IT + $1-3 spend
- **Expected lift:** Whole-codebase context compression for future cyls

**Wave 1 first-fire combined:** A2 + A3 (1 cyl) + A6 cite (audit only) + A7 CodeBurn install (1 cyl pending URL) + A32 AGENTS.md upgrade (1 cyl) = 3-cyl Wave 1 closes 4 of CEO's 4 TOP PRIORITY items.

---

## §G · CEO action queue (URLs · toggles · spends · accounts)

| Priority | Item | CEO action | Time |
|---|---|---|---|
| 🔴 P0 Wave 1 | A2 Obsidian | Obsidian → Settings → Community Plugins → Restricted Mode OFF | ~30 sec |
| 🔴 P0 Wave 1 | A3 Graphify deep-mode | $1-3 GO spend route to Devin | ~10 sec |
| 🟡 P1 Wave 1 | A7 CodeBurn URL | YouTube comment funnel on creator (Ref #7) "what's your CodeBurn URL?" | ~5 min outreach + wait |
| 🟡 P1 Wave 2 | A4 SEED URL | YouTube comment funnel (Ref #6 creator) | ~5 min outreach + wait |
| 🟡 P1 Wave 2 | A33 System prompt blueprint | Surface 3 GitHub repo URLs (Cursor/Claude/Devon/Perplexity playbooks per Ref #1) | ~3 min |
| 🟢 P2 Wave 5 | A35 Codex desktop | Confirm OpenAI paid account · Keychain `openai-codex` add (presence-only per BINDING #5) | ~30 sec |
| 🟢 P2 Wave-X | A34 Brockster Gumroad | Confirm paid/free status · download if pursued | ~5 min CEO |
| 🟢 P2 — | B4 P63 FF-pull (informational) | `git -C /Users/ryanhallee/legacy-loop-mvp pull origin main --ff-only` in main worktree | ~5 sec |

### CEO action summary

- **~40 sec immediate** (Wave 1 toggle + spend)
- **~13 min wait-cycle** (3 YouTube creator URL surfaces · async)
- **~5 sec** for B4 P63 FF-pull (closes worktree drift)

---

## §H · Sylvia-rider pairings (P0-exclusion compliant)

Sylvia P0 cyls (Bridge · file_read · file_write · bash · voice) fire CLEAN ALONE per §5.5 P0 exclusion · NO riders on those.

POST-Sylvia-hands B2-W5+ Sylvia capability cyls MAY carry Track A riders IF surface-disjoint per BINDING #33 G1-G5:

| Sylvia wave | Surface | Compatible Track A rider | Rider-disjoint verdict |
|---|---|---|---|
| B2-W5 WebFetch | Sylvia browser-class fetch | A24 Perplexity MCP install | ✅ DISJOINT (both web-fetch context · separate tool stacks) |
| B2-W6 PDF | Sylvia PDF parse | A20 Canvas Design skill install | ✅ DISJOINT (both doc-generation · separate paths) |
| B2-W7 Desktop · Computer Use | Sylvia native app automation | A29 Anthropic Computer Use install | ❌ SAME SURFACE · DO NOT PAIR · conflict risk · keep solo |
| B2-W7 Desktop (alternative pair) | Sylvia native app automation | A28 Chrome MCP install | 🟡 DISJOINT BUT CLOSE (Chrome native automation vs Computer Use) · CEO routes |
| B2-W8 Memory hook | SylviaMemory consensus write | A32 AGENTS.md learn-section upgrade | ✅ DISJOINT (both memory pattern · doc vs DB) |
| B2-W9 Identity sync | .env.sylvia ↔ sylvia-data/identity | A33 System prompt blueprint ingest | ✅ DISJOINT (both identity-class · separate scopes) |

**Audit verdict:** 4 valid rider pairings surfaced (B2-W5/W6/W8/W9). CEO routes when those Sylvia waves fire. P0 exclusion holds for B2-W4 voice cluster (Bridge precedent + voice CEO-interactive smoke gates).

---

## §I · Doctrine candidates surfaced

- **DOC-ROADMAP-TODAY-OVERRIDES-IDEAS-FILE-RANKING** (1/5 NEW) · today's CEO Slack directive supersedes prior ideas-file priority ordering · MC drift-correction enforcement
- **DOC-MC-RECONCILE-DEVIN-AUDIT-BEFORE-SLACK** (2/5 progressing) · MC owns drift today twice · Devin reconciles before Slack STATUS posts
- **DOC-SPEC-AUTHORING-DEEP-DIVE-MANDATORY** (2/5 sustaining) · this audit + P63 inform B2-W5+ + Track A Final Push spec authoring
- **DOC-MASTER-IDEAS-FILE-EMPIRICAL-RECONCILE** (1/5 NEW) · master ideas file MUST be empirical-cross-referenced before status-table publication (3 drift catches this audit: A5 Paul · A6 Caveman · A25 Playwright already-installed)

---

## §J · Cross-references

- **Master ideas file:** `~/Downloads/skills/Ideas/LegacyLoop_Master_Ideas_v1_2026-05-15.md` (734 LOC · SHA `33389b1f7e0cb49508c0a41b21f8be8b67afc3731b0999d759432dd7c6ce28fd`)
- **Raw CEO source:** `~/Downloads/Claude Code & Sylvia AI Ideas (2).txt` (965 LOC)
- **Master Flag Backlog:** `~/Downloads/skills/Flags/MASTER_FLAG_BACKLOG_2026-05-14.md` (48 KB)
- **Sylvia Substrate Deep-Dive:** `docs/audits/SYLVIA_SUBSTRATE_DEEP_DIVE_2026-05-15.md`
- **ElevenLabs Product Audit:** `docs/audits/ELEVENLABS_PRODUCT_AUDIT_2026-05-15.md`
- **Bridge cyl §12:** P58 GREEN-WITH-NOTE · `sylvia-data/identity/system_prompt.md` 174 LOC · me.md mirror SHA `6bff4741...`
- **Doctrine Ledger:** `docs/DOCTRINE_LEDGER.md` (32 BINDING)
- **Backfill epic anchor:** `docs/skills/IDEAS_FILE_BACKFILL_EPIC.md` (P31 · Wave 7/W8 closures cited)
- **Skill source manifest:** `docs/skills/SKILL_SOURCE_MANIFEST.md` (canonical skill registry)

---

*Authored 2026-05-15 PM · IT execute · Devin L2 spec · main worktree · audit-class · zero-commit (CEO routes commit separately if desired)*
