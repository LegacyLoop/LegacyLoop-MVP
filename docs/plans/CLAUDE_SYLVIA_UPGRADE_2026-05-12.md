---
plan: CLAUDE_SYLVIA_UPGRADE_2026-05-12
type: research → execute (two-phase)
authored: 2026-05-12 (Tue) ~18:00 EDT
author: Devin · L1 Senior Dev Engineer
status: DRAFT · awaiting CEO greenlight per §6
doctrine: F1 polish-mode · additive-only · audit-first · BINDING #10/#16/#17 honored
depends_on: [docs/SUPER_BRAIN_STATE.md (read first)]
files_modified: [~/.claude/* · ~/legacy-loop-mvp/lib/sylvia/* · ~/legacy-loop-mvp/lib/sylvia-kb/* · ~/legacy-loop-mvp/app/api/sylvia/* · ~/legacy-loop-mvp/.gitignore (if Sylvia data layer expands)]
autonomous: false · checkpoints REQUIRED at every wave gate
---

<objective>

## Goal
Two-phase upgrade. **Phase A:** harden Claude Code locally (memory · token discipline · skill cherry-pick · MCP gaps · Obsidian 3-layer). **Phase B:** mirror Phase A learnings into Sylvia AI custom build using prebuilt LegacyLoop substrate (4-AI Truth Gate · 239 skill files · daemon QUARTET · `sylvia-data/vector-store/` reserved slot).

## Purpose
1. CEO's Claude usage "through the roof" — memory loss + token waste root cause
2. Sylvia AI investor narrative ("billion-dollar level · brain-modeled · Anthropic-replicated") gated on Claude-side patterns being proven on CEO's own machine first
3. Avoid 81-skill-metadata-budget hit (CodeBurn flag from prior session) — cherry-pick discipline locked in

## Output
- Phase A: 6 waves shipped to `~/.claude/` + Obsidian vault
- Phase B: 7 waves shipped to `legacy-loop-mvp/lib/sylvia/*` + `sylvia-data/` + `app/api/sylvia/*`
- One §12 V19 report per wave · zero scope creep · audit-first

</objective>

<context>

## Project Context
@docs/SUPER_BRAIN_STATE.md (prebuilt asset inventory · 9 sections + addenda)
@docs/SYLVIA_COGNITIVE_ARCHITECTURE.md (7-memory-system canon · a725ef8)
@docs/sylvia/SYLVIA_API_CONTRACT.md (4-endpoint contract · 1 shipped)
@docs/sylvia/SYLVIA_FOLDER_ARCHITECTURE.md (sylvia-data/ structure · .env.sylvia)
@docs/SYLVIA_SKILLS_ARCHITECTURE_AUDIT.md (R13 P3 anchor · 342 LOC · skill pack inventory)
@docs/PHASE_3_2_SSA_FOUNDATION_AUDIT.md (Phase 3.2 readiness · 🟡 gated)
@docs/DOCTRINE_LEDGER.md (28 BINDING canonical)
@CLAUDE.md (V19 law)
@WORLD_CLASS_STANDARDS.md
@AGENTS.md

## Source ideas
@~/Downloads/Claude Code & Sylvia AI Ideas.txt (21+1 references · CEO priorities ranked)
@~/Downloads/skills/Syliva AI/Claude_Setup_Patterns_for_Sylvia_2026-05-08.md (12 moats)
@~/Downloads/skills/Devin/Devin_Senior_Dev_Engineer_SOP.md (Devin operating doctrine)

## CEO priorities (ranked from ideas file)
1. **MEMORY** (TOP · explicit "Improving Claudes Memory TOP Priority")
2. Obsidian + Graphify (top priority block)
3. Token savings + Claude usage (Caveman + CodeBurn)
4. Skill cherry-pick (NOT bulk · "Less is more on this dimension")

## Hard pre-requisites (gate ALL waves)
- R25 P6 LITELLM-GATEWAY-EXPOSE ship (current `ECONNREFUSED` P0 blocks all Sylvia prod work)
- `vercel login` + 7 Sylvia env keys pushed
- 28 BINDING doctrine compliance throughout
- Daemon QUARTET healthy (currently LIVE per launchctl: Ollama PID 1947 · LiteLLM PID 1930)

</context>

<acceptance_criteria>

## AC-1 · CEO Claude session token usage drops 50%+ (post Phase A)
```gherkin
Given baseline Claude token usage tracked for 7 days pre-upgrade
When Phase A Waves A1-A3 ship (memory + graphify + token discipline)
Then average per-session input tokens drop ≥50% vs baseline
And `~/.claude/projects/.../memory/MEMORY.md` no longer silently truncates
```

## AC-2 · Claude memory persists across sessions with zero re-explanation
```gherkin
Given Phase A1 ships claude-mem
When CEO opens fresh chat after 24 hours
Then Claude recalls last session's architectural decisions without CEO re-stating
And SessionStart hook auto-loads relevant compressed observations
```

## AC-3 · Repo-wide graphify graph indexed
```gherkin
Given Phase A2 ships repo-wide /graphify run
When CEO asks "how does <X> connect to <Y>?" about LegacyLoop architecture
Then Claude consults `graphify-out/graph.json` (1500-2500 nodes expected)
And answer cites god-node + community + edge type · NOT free-form file-traversal
```

## AC-4 · Skill metadata budget recovered
```gherkin
Given current 81-skill-metadata-budget overflow (CodeBurn flag prior session)
When Phase A5 cherry-picks active skills
Then loaded skill count ≤ 20 in `~/.claude/skills/`
And CodeBurn shows no metadata-budget-hit warning for 7 consecutive sessions
```

## AC-5 · Sylvia 4-AI Truth Gate canonical (post Phase B4)
```gherkin
Given 3 separate Truth Gate implementations exist (megabot · sylvia/dispatcher · agents/runner)
When Phase B4 ships consolidation decision per §9M #8
Then ONE implementation is canonical · 2 deprecated OR adapter-wrapped
And `app/api/sylvia/consensus/route.ts` ships smoke v2 (R25 P8 banked)
```

## AC-6 · Sylvia memory mirrors Claude-mem (post Phase B1)
```gherkin
Given Phase A1 claude-mem patterns proven on CEO's machine
When Phase B1 lands `sylvia-data/vector-store/` + observation schema additive
Then SylviaMemory has `kind` column (decision · bug-fix · pattern · preference)
And nightly STM→LTM cron consolidates to vector-store
And BINDING #6 DOC-DEV-PROD-DB-ISOLATION honored (Prisma db push dev only · libsql for prod)
```

## AC-7 · Investor narrative anchors landed
```gherkin
Given Sylvia's pitch deck moments per docs/SYLVIA_COGNITIVE_ARCHITECTURE.md §5
When Phase B7 ships provenance + Truth Gate UI
Then every Sylvia high-stakes answer carries "Verified by N AIs · X%" badge
And provenance tag (real-time / memory / training / inferred) per Moat #7
```

</acceptance_criteria>

---

# PHASE A · CLAUDE CODE LOCAL UPGRADE

**Sequencing:** A1 → A2 → A3 in strict order (memory + graphify + token discipline are CEO top-3). A4-A6 in parallel after A3 closes. A7 last (agents.md playbook benefits from learnings).

**Total est:** 8-12 hours IT split across 4-6 sessions · zero LOCKED file touches · zero scope creep.

---

## WAVE A1 · MEMORY (P0 · TOP CEO PRIORITY)

**Effort est:** 2-3 hrs
**Gates on:** none (start here)
**Reference:** Ideas.txt ref #11 (Claude-Mem · 60K+ stars · "95% token reduction") · §1 of Claude_Setup_Patterns_for_Sylvia
**Doctrine cited:** §3D #6 from SUPER_BRAIN_STATE (claude-mem schema migration approval)

<tasks>

<task type="auto">
  <name>A1.1 · Audit current memory state</name>
  <files>~/.claude/projects/-Users-ryanhallee-legacy-loop-mvp/memory/MEMORY.md (READ-ONLY) · ~/.claude/projects/.../memory/*.md (count + size only)</files>
  <action>
    Run `wc -l ~/.claude/projects/-Users-ryanhallee-legacy-loop-mvp/memory/MEMORY.md` + `du -sh memory/` + `ls memory/ | wc -l`.
    Surface: total file count · total bytes · index line count · 80%-of-cap warning if any.
    Per Claude_Setup_Patterns §1: index ≤25KB / ≤200 lines · one-line entries ≤150 chars · stale-file detection.
    Avoid: reading actual memory file contents into chat (BINDING #5 spirit).
  </action>
  <verify>Devin §12 reports: file count · index size · cap state · any 150-char line violations</verify>
  <done>AC-1 satisfied baseline measurement captured</done>
</task>

<task type="checkpoint:decision" gate="blocking">
  <decision>Install claude-mem or build LegacyLoop-native equivalent?</decision>
  <context>claude-mem (`thedotmack/claude-mem` · 60K+ stars per ideas ref #11) is upstream. CEO must decide install-vs-build before Devin authors V19 spec.</context>
  <options>
    <option id="option-a">
      <name>Install upstream claude-mem · local-only · zero LegacyLoop schema impact</name>
      <pros>Battle-tested · 60K stars · 2-command install · runs locally · "free + no data leaves machine" per ref #11 · Phase A scope ONLY</pros>
      <cons>Foreign tool · may not honor §12 V19 report shape · own memory format ≠ Sylvia 7-memory-system canon · Sylvia mirror in Phase B = adapter work</cons>
    </option>
    <option id="option-b">
      <name>Build LegacyLoop-native compressor that writes to `~/.claude/projects/.../memory/` index + topic files using observation schema cloned from claude-mem</name>
      <pros>Honors V19 + §12 + 28 BINDING from day 1 · Phase B Sylvia mirror is trivial (same code) · zero foreign-tool surface</pros>
      <cons>2-4 weeks build · CEO suffers token waste in interim · re-invents proven pattern · violates BINDING #16 DOC-DELEGATE-TO-CANONICAL spirit</cons>
    </option>
    <option id="option-c">
      <name>Install claude-mem NOW for fast win · wrap in LegacyLoop adapter in Phase B</name>
      <pros>CEO gets memory fix this week · Sylvia mirror leverages proven patterns · BINDING #16 honored · zero re-invention</pros>
      <cons>2 systems running in parallel for ~4 weeks · adapter overhead ~4 hrs</cons>
    </option>
  </options>
  <resume-signal>Select: option-a / option-b / option-c</resume-signal>
</task>

<task type="auto">
  <name>A1.2 · Install selected memory system + SessionStart hook</name>
  <files>~/.claude/settings.json (additive · permission allowlist) · `.claude/scripts/sessionstart-memory-warm.sh` (NEW if needed)</files>
  <action>
    Per CEO option selection in A1 checkpoint.
    Option A: `claude plugins add claude-mem` + verify SessionStart hook + test recall.
    Option B: author V19 spec for native build · NOT this wave (defer to A1-NEXT).
    Option C: same as A + log adapter requirements for Phase B1.
    Avoid: bulk-loading existing 60-file memory · let claude-mem index incrementally.
  </action>
  <verify>Fresh chat after install · ask "what did we work on yesterday?" · confirm recall</verify>
  <done>AC-2 satisfied · claude-mem (or native) live · SessionStart hook proven</done>
</task>

<task type="auto">
  <name>A1.3 · Consolidate existing memory index per claude-mem patterns</name>
  <files>~/.claude/projects/-Users-ryanhallee-legacy-loop-mvp/memory/MEMORY.md (additive · index entry compression)</files>
  <action>
    Invoke `anthropic-skills:consolidate-memory` skill (already loaded).
    Trim entries >150 chars · archive files >90 days unaccessed · flag entries >30 days for review.
    Per Claude_Setup_Patterns §1 retention rules: durable (user/preferences/relationships) vs dated (project state/deadlines).
    Avoid: deletion · only archive (`memory/archive/` subdir).
  </action>
  <verify>`wc -l ~/.claude/projects/.../memory/MEMORY.md` shows ≤200 lines · `find memory -name "*.md" | wc -l` ≤ current count</verify>
  <done>AC-1 satisfied · index within 80% cap</done>
</task>

</tasks>

---

## WAVE A2 · GRAPHIFY DEEP WIRE (P0 CEO PRIORITY #2)

**Effort est:** 1-2 hrs
**Gates on:** A1 close
**Reference:** Ideas.txt ref #3 + ref #8 + ref #1 (Graphify · 500K+ downloads · 70× token reduction)
**Per §3D #4-5 in SUPER_BRAIN_STATE.md**

<tasks>

<task type="auto">
  <name>A2.1 · Repo-wide /graphify run</name>
  <files>graphify-out/* (regenerated · gitignored per 19fc4e8)</files>
  <action>
    Verify `GEMINI_API_KEY` set via count-only grep (BINDING #5).
    Run `/graphify /Users/ryanhallee/legacy-loop-mvp` from repo root.
    Estimated 2-4 min · ~$0.30 Gemini cost · expand 103 → 1500-2500 nodes.
    Must include: lib/bots/skills/ (239 files) · lib/megabot/ · lib/agents/runner.ts · lib/intelligence/ · lib/adapters/bot-ai-router/ · prisma/schema.prisma · all docs/ · all app/api/.
    Avoid: running with `--mode deep` first pass (token cost spike) · run baseline mode first.
  </action>
  <verify>`graphify-out/GRAPH_REPORT.md` shows ≥1500 nodes · community count ≥15 · cost.json shows tokens used</verify>
  <done>AC-3 satisfied · full topology indexed</done>
</task>

<task type="auto">
  <name>A2.2 · graphify hook install · git post-commit auto-rebuild</name>
  <files>.git/hooks/post-commit (additive)</files>
  <action>
    Run `graphify hook install` from repo root.
    Verify hook appends (NEVER replaces) per graphify SKILL.md.
    Avoid: replacing existing post-commit hooks.
  </action>
  <verify>`graphify hook status` confirms installed · test commit triggers rebuild · `graphify-out/graph.json` mtime updates</verify>
  <done>Per-commit auto-rebuild proven</done>
</task>

<task type="auto">
  <name>A2.3 · graphify claude install · CLAUDE.md auto-on</name>
  <files>CLAUDE.md (additive · `## graphify` section)</files>
  <action>
    Run `graphify claude install` from repo root.
    Verify it APPENDS to existing CLAUDE.md (does NOT replace).
    Per BINDING #16 + audit-first: read CLAUDE.md before+after.
  </action>
  <verify>CLAUDE.md diff shows ONLY additive `## graphify` section · 28 BINDING + all gotchas preserved</verify>
  <done>graphify always-on in future Claude sessions</done>
</task>

<task type="auto">
  <name>A2.4 · Wire obsidian-sylvia vault into CEO's Obsidian (Phase B prep)</name>
  <files>~/Documents/ObsidianVault/legacy-loop-graph/ (NEW · symlink target)</files>
  <action>
    Symlink `graphify-out/obsidian-sylvia/` → CEO's Obsidian vault directory.
    Confirm Obsidian recognizes vault on next reopen.
    Avoid: copying files (would diverge from auto-regen).
  </action>
  <verify>CEO opens Obsidian · navigates graph · confirms backlinks live</verify>
  <done>Obsidian Layer 2 (Maps) wired</done>
</task>

</tasks>

---

## WAVE A3 · TOKEN DISCIPLINE (P0 CEO PRIORITY #3)

**Effort est:** 2-3 hrs
**Gates on:** A2 close
**Reference:** Ideas.txt ref #7 (CodeBurn · "where tokens go") · ref #5 from §3A · "81 skill descriptions dropped per CodeBurn" prior session

<tasks>

<task type="auto">
  <name>A3.1 · Run caveman:caveman-stats baseline</name>
  <files>none (read-only)</files>
  <action>
    Invoke `caveman:caveman-stats` skill (already loaded).
    Capture: actual token savings · current session breakdown.
    Verify caveman MCP server `caveman-shrink` healthy.
  </action>
  <verify>Devin §12 reports baseline savings %</verify>
  <done>Caveman ROI quantified</done>
</task>

<task type="checkpoint:decision" gate="blocking">
  <decision>Install upstream CodeBurn vs use built-in `lib/adapters/bot-ai-router/cost-tracker.ts`?</decision>
  <context>Per SUPER_BRAIN_STATE §9C · cost-tracker.ts already exists in repo. CodeBurn would be parallel surface. Per §9M #9.</context>
  <options>
    <option id="option-a">
      <name>Install CodeBurn upstream + keep cost-tracker.ts for production</name>
      <pros>CodeBurn surfaces Claude Code session view · cost-tracker tracks Sylvia/bot routes · clean separation</pros>
      <cons>2 cost-tracking surfaces · double maintenance</cons>
    </option>
    <option id="option-b">
      <name>Skip CodeBurn · extend cost-tracker.ts to also read `~/.claude/` session logs</name>
      <pros>One canonical cost surface · BINDING #16 honored · Sylvia/Claude parity</pros>
      <cons>2-4 hrs custom work · CodeBurn community improvements not auto-pulled</cons>
    </option>
  </options>
  <resume-signal>Select: option-a or option-b</resume-signal>
</task>

<task type="auto">
  <name>A3.2 · CodeBurn install OR cost-tracker extension (per checkpoint)</name>
  <files>per CEO selection</files>
  <action>Per A3 checkpoint selection · execute path · §12 V19 emit on close</action>
  <verify>Token usage visible per-turn in Claude Code session</verify>
  <done>AC-1 mid-state · token visibility live</done>
</task>

</tasks>

---

## WAVE A4 · MCP GAP CLOSES (P1)

**Effort est:** 1-2 hrs
**Gates on:** A3 close
**Per §3D #1-3 in SUPER_BRAIN_STATE.md (#2 Perplexity DROPPED per §9E)**

<tasks>

<task type="auto">
  <name>A4.1 · Enable Playwright MCP (already on disk)</name>
  <files>~/.claude/settings.json (additive · enabledPlugins)</files>
  <action>
    Path on disk: `~/.claude/plugins/marketplaces/claude-plugins-official/external_plugins/playwright/`.
    Add to enabledPlugins · restart Claude.
    Cost: 5 min.
  </action>
  <verify>`ToolSearch query "playwright"` returns Playwright tools</verify>
  <done>Browser automation available</done>
</task>

<task type="auto">
  <name>A4.2 · Install Firecrawl MCP (RAG · feeds Sylvia KB post-PIVOT)</name>
  <files>~/.claude/settings.json · `FIRECRAWL_API_KEY` env var</files>
  <action>
    Per ideas ref #14 (Firecrawl crawls entire websites for RAG).
    Install via Claude plugin marketplace OR claude-desktop config.
    Set cost cap per-call.
    Avoid: enabling without budget cap (runaway crawl risk).
  </action>
  <verify>Firecrawl MCP tools loadable · test crawl on legacy-loop.com returns markdown</verify>
  <done>Crawler ready for Phase B2 corpus ingest</done>
</task>

<task type="checkpoint:decision" gate="blocking">
  <decision>Pixart MCP install? (130 image/video models per ideas ref #2 from final block)</decision>
  <context>Tier-3 capability (creative). Not on critical path. CEO can defer.</context>
  <options>
    <option id="option-a"><name>Install · Phase A4</name><pros>Creative workflows unlocked</pros><cons>Token cost · skill metadata budget concern</cons></option>
    <option id="option-b"><name>Defer to Phase B6+ when Sylvia capabilities layer (Moat #12) activates</name><pros>One install · right time</pros><cons>None</cons></option>
  </options>
  <resume-signal>Select: option-a or option-b</resume-signal>
</task>

</tasks>

---

## WAVE A5 · SKILL CHERRY-PICK (P1 CEO PRIORITY #4)

**Effort est:** 3-4 hrs (audit-heavy)
**Gates on:** A4 close
**Reference:** "81 skill descriptions dropped per CodeBurn" prior session · "Cherry-pick · don't bulk-install · Less is more"

<tasks>

<task type="auto">
  <name>A5.1 · Audit current skill load · identify metadata budget hit</name>
  <files>~/.claude/skills/* (READ-ONLY) · ~/.claude/plugins/installed_plugins.json</files>
  <action>
    Enumerate all SKILL.md files Claude currently loads at SessionStart.
    Per ideas note: 81 descriptions hit budget cap.
    Surface: per-skill description char count + frontmatter validation.
    Target: ≤20 loaded skills post-audit.
  </action>
  <verify>Total active skill count + total metadata bytes reported</verify>
  <done>AC-4 baseline measured</done>
</task>

<task type="checkpoint:decision" gate="blocking">
  <decision>Which skill collections to evaluate for install? (priority-ranked · cherry-pick discipline)</decision>
  <context>5 GitHub repos noted in ideas file · all unread · CEO must approve per-collection</context>
  <options>
    <option id="ev-1"><name>GStack (Gary Tan Y Combinator · 23 skills · 64K stars · CEO/designer/EM/QA/release)</name><pros>Mature · production-tested</pros><cons>23 skills risks metadata bloat · audit each before symlink</cons></option>
    <option id="ev-2"><name>Superpowers (127K stars · plans+tests+reviews own work)</name><pros>Battle-tested · self-review pattern aligns with §12 V19 discipline</pros><cons>Foreign abstraction</cons></option>
    <option id="ev-3"><name>Frontend Design by Anthropic (277K installs · kills generic AI look)</name><pros>Maps to WORLD_CLASS_STANDARDS · 7 pillars + 12 effects support</pros><cons>Already have designlang plugin</cons></option>
    <option id="ev-4"><name>Anthropic Skills (official library)</name><pros>Official · canonical</pros><cons>Already many loaded via plugins · re-audit</cons></option>
    <option id="ev-5"><name>Awesome Claude Code (community master list)</name><pros>Discovery index · not direct install</pros><cons>Browse-only · low priority</cons></option>
    <option id="ev-6"><name>Cory Haynes 29 marketing skills</name><pros>Sylvia Pam role activation</pros><cons>Pre-PIVOT · low priority NOW · defer</cons></option>
    <option id="ev-7"><name>Paul + Seed (structured execution + ideation feeder)</name><pros>Already invoked here · validate setup · ideas ref #6</pros><cons>PAUL ceremony heavy · CEO may prefer Devin V19 SOP</cons></option>
    <option id="ev-8"><name>Emil Kowolski motion · Impeccable · Taste · UI/UX Pro Max</name><pros>Designer skills · ref #8</pros><cons>UI focus · post-build phase</cons></option>
  </options>
  <resume-signal>Select 1-3 collections to evaluate · OR "audit all + rank" · OR "defer all to Phase B"</resume-signal>
</task>

<task type="auto">
  <name>A5.2 · Per-collection audit (one collection · one §12)</name>
  <files>per CEO selection · audit-only NO symlinks yet</files>
  <action>
    Per selected collection: clone to `~/scratch/<collection>/` · read every SKILL.md · score against 28 BINDING + V19 + WORLD_CLASS_STANDARDS.
    Surface: which skills clear bar · which conflict · which redundant with already-installed.
    Output: `docs/audits/SKILL_AUDIT_<collection>_<date>.md`.
    Avoid: any symlink to `~/.claude/skills/` before CEO greenlight (BINDING #16 stale-doctrine risk).
  </action>
  <verify>Audit doc shipped · CEO reviews · checkpoint:human-verify</verify>
  <done>AC-4 progresses · only current-doctrine-aligned skills clear</done>
</task>

<task type="auto">
  <name>A5.3 · Symlink approved skills · validate metadata budget</name>
  <files>~/.claude/skills/* (additive symlinks ONLY)</files>
  <action>
    Per CEO approval per skill (not collection · per skill).
    Symlink ONLY · NEVER copy (auto-update preserved).
    After each batch (5 max): re-run A5.1 audit · confirm metadata budget healthy.
  </action>
  <verify>Loaded skill count ≤20 · zero CodeBurn metadata-budget-hit warnings for 24 hrs</verify>
  <done>AC-4 satisfied</done>
</task>

</tasks>

---

## WAVE A6 · OBSIDIAN 3-LAYER SETUP

**Effort est:** 1-2 hrs
**Gates on:** A2 close (graphify generates Layer 2 maps)
**Reference:** Ideas.txt ref #19 (Obsidian 3-layer doctrine: ideaverse → maps → tools) · ref #20 (5 plugins)

<tasks>

<task type="auto">
  <name>A6.1 · Layer 1 ideaverse audit</name>
  <files>~/Documents/ObsidianVault/* (READ-ONLY · structure only) · ~/Downloads/skills/* (current scattered ideaverse)</files>
  <action>
    Surface CEO's current Obsidian state.
    Recommend: ALL `~/Downloads/skills/<role>/` + `~/Downloads/skills/Master Plans/` + `~/Downloads/skills/Road maps/` + `~/Downloads/skills/Flags/` + `~/Downloads/skills/Mission Control/` + `~/Downloads/skills/Syliva AI/` + `~/Downloads/skills/PassOffs/` + `~/Downloads/skills/Devin/` collapse into ONE Obsidian vault as Layer 1.
    Avoid: moving any file without CEO confirm.
  </action>
  <verify>Ideaverse structure plan shipped · CEO approves before any move</verify>
  <done>Layer 1 architecture defined</done>
</task>

<task type="auto">
  <name>A6.2 · Layer 2 maps (graphify vault link)</name>
  <files>Obsidian vault root (symlink `graphify-output` → `graphify-out/obsidian-sylvia/`)</files>
  <action>
    Per A2.4 · symlink already created.
    Obsidian recognizes vault on next open.
    Add Obsidian → Settings → Workspace → enable graph view.
  </action>
  <verify>CEO opens Obsidian · navigates god-nodes · confirms graph view live</verify>
  <done>Layer 2 wired</done>
</task>

<task type="auto">
  <name>A6.3 · 5 Obsidian plugins install</name>
  <files>~/Documents/ObsidianVault/.obsidian/plugins/* (additive)</files>
  <action>
    Per ideas ref #20:
    1. Lean Terminal · 2. Style Settings · 3. Full Calendar · 4. Dataview · 5. BRAT.
    All from Obsidian community plugin store.
    Avoid: enabling Sync (paid · CEO not asked).
  </action>
  <verify>All 5 plugins enabled · zero errors on Obsidian restart</verify>
  <done>3-layer Obsidian setup complete</done>
</task>

</tasks>

---

## WAVE A7 · AGENTS.MD PLAYBOOK UPGRADE

**Effort est:** 2-3 hrs
**Gates on:** A1+A2+A3 close (memory + maps + token discipline must be live to feed playbook)
**Reference:** Ideas.txt ref #2 (agents.md · 9 months client deployments · learn section · memory routing · hard rules · small-context-rule · workspace org · platform formatting)

<tasks>

<task type="auto">
  <name>A7.1 · Audit existing AGENTS.md vs ideas ref #2 spec</name>
  <files>AGENTS.md (READ-ONLY first)</files>
  <action>
    Read current AGENTS.md (auto-imported by CLAUDE.md).
    Score against ref #2 6-section spec:
    1. Memory routing (where Claude writes client updates · project notes · daily logs)
    2. Hard rules (never push to main · never leak credentials)
    3. Smallest-context-rule (don't waste tokens loading unneeded)
    4. Learn section (corrections become permanent rules)
    5. Workspace organization
    6. Platform formatting (Discord ≠ Slack output)
  </action>
  <verify>Gap analysis shipped · per-section score</verify>
  <done>Upgrade scope locked</done>
</task>

<task type="auto">
  <name>A7.2 · Author additive upgrades to AGENTS.md</name>
  <files>AGENTS.md (additive · NEVER replace existing sections)</files>
  <action>
    Add missing sections per audit.
    KEY ADD: "Learn section" — port every BINDING from DOCTRINE_LEDGER.md as a permanent rule · cite source.
    Memory routing: point at `~/.claude/projects/.../memory/` per A1 install.
    Platform formatting: Slack tone vs commit message vs Devin §12 vs CEO chat — each distinct.
    Avoid: rewriting any existing section · purely additive.
  </action>
  <verify>tsc=0 unaffected · diff is additive-only · CEO reviews diff before commit</verify>
  <done>AGENTS.md aligned to billion-dollar playbook spec</done>
</task>

</tasks>

---

# PHASE B · SYLVIA MIRROR (after Phase A learnings)

**Sequencing:** B1 → B4 → B2 → B3 in strict order. B5-B7 in parallel after B4. **GATES:** R25 P6 LITELLM-GATEWAY-EXPOSE shipped + R25 P8 Sylvia consensus smoke v2 PASSED.

**Total est:** 12-20 hrs IT split across 6-10 sessions · zero LOCKED file touches · spec-author every wave per V19.

---

## WAVE B1 · SYLVIA MEMORY UPGRADE

**Effort est:** 3-4 hrs
**Gates on:** Phase A close · Phase 3 SSA closure decision (§9M #10)
**Reference:** A1 learnings · §3D #6 · SylviaMemory schema additive

<tasks>

<task type="auto">
  <name>B1.1 · Schema additive · `kind` column on SylviaMemory</name>
  <files>prisma/schema.prisma (additive) · LOCKED · CEO approval REQUIRED</files>
  <action>
    Add `kind String? @default("triage")` to SylviaMemory.
    Values: `triage` (existing) · `decision` · `bug-fix` · `pattern` · `preference` · `compressed_observation` (claude-mem mirror).
    NEVER `prisma db push` against Turso prod (BINDING #6).
    Migration path: `npx prisma db push --schema=prisma/schema.prisma` against dev SQLite ONLY.
    Prod path: `@libsql/client` + `.env` token via `node --env-file=.env script.mjs` (R22.5 OP-B).
  </action>
  <verify>tsc=0 · `prisma generate` clean · dev db schema migration smoke</verify>
  <done>AC-6 partial · schema landed</done>
</task>

<task type="auto">
  <name>B1.2 · Vector store land at sylvia-data/vector-store/</name>
  <files>sylvia-data/vector-store/* (gitignored slot per .gitignore:74)</files>
  <action>
    Per Claude_Setup_Patterns §11: nomic-embed-text local (cost-zero) · matches Ruflo pattern.
    Implementation: pgvector OR local FAISS at first (no Turso/Pinecone yet · cost discipline).
    Sylvia consumer: `lib/sylvia/memory.ts` `recallSimilar()` upgrades from `promptHash` exact to semantic.
    Per §9F: slot reserved · no schema work needed.
  </action>
  <verify>Test: store 10 sample triage records · query by semantic similarity · returns ranked</verify>
  <done>AC-6 mid-state · semantic recall live</done>
</task>

<task type="auto">
  <name>B1.3 · Nightly STM→LTM consolidation cron</name>
  <files>lib/cron/sylvia-stm-to-ltm.ts (NEW) · vercel.ts cron config (additive)</files>
  <action>
    Per docs/SYLVIA_COGNITIVE_ARCHITECTURE.md §3 Phase 9 Cylinder 9.2.
    Read SylviaMemory rows > 24hrs · summarize per agent + classification · write to LTM table OR vector-store metadata.
    Avoid: deleting STM (audit trail per BINDING #28).
  </action>
  <verify>Cron fires nightly · LTM grows · STM doesn't shrink (audit preserved)</verify>
  <done>AC-6 satisfied · 3-of-7 memory systems live (working + STM + LTM)</done>
</task>

</tasks>

---

## WAVE B4 · 3-WAY TRUTH GATE CONSOLIDATION (URGENT · drift-risk)

**Effort est:** 4-6 hrs
**Gates on:** B1 close · CEO decision per §9M #8
**Reference:** SUPER_BRAIN_STATE §9A · BINDING #16 candidate violation

<tasks>

<task type="checkpoint:decision" gate="blocking">
  <decision>Truth Gate canonical impl?</decision>
  <context>3 implementations: `lib/megabot/run-specialized.ts` (production · 4-AI parallel) · `lib/sylvia/dispatcher/*` (R24 P0 · Gateway-routed) · `lib/agents/runner.ts` (origin · 8 bot types · Azure placeholder). Drift kills BINDING #16.</context>
  <options>
    <option id="opt-a"><name>Pick `lib/sylvia/dispatcher/` as canon · deprecate 2 others · migrate callers</name><pros>R24 P0 is freshest · Gateway-routed · honors DOC-TELEMETRY-LOCK · Moat #10 narrative anchor</pros><cons>Breaks MegaBot production callers · 1532 LOC route migration risk</cons></option>
    <option id="opt-b"><name>Sylvia dispatcher wraps MegaBot runner via adapter</name><pros>Zero breakage · all 4 callers preserved · BINDING #17 honored</pros><cons>Adapter overhead 2-4 hrs · 2 surfaces still drift-prone</cons></option>
    <option id="opt-c"><name>Accept status quo · document drift in DOCTRINE_LEDGER as BINDING candidate</name><pros>Zero risk now</pros><cons>Investor-demo-risk worsens · violates §12 BINDING #16 spirit</cons></option>
  </options>
  <resume-signal>Select: opt-a · opt-b · opt-c</resume-signal>
</task>

<task type="auto">
  <name>B4.1 · Execute consolidation per CEO selection</name>
  <files>per CEO selection</files>
  <action>V19 spec authored separately · this task is execution placeholder</action>
  <verify>tsc=0 · build PASS · all 4 callers (megabot route · sylvia/consensus route · analyze route · agents runner consumer) green · §12 V19 emit</verify>
  <done>AC-5 satisfied</done>
</task>

</tasks>

---

## WAVE B2 · GRAPHIFY WIRED INTO SYLVIA

**Effort est:** 2-3 hrs
**Gates on:** B4 close · A2 close

<tasks>

<task type="auto">
  <name>B2.1 · /graphify --mcp server background</name>
  <files>~/.claude/scripts/sylvia-graph-mcp.sh (NEW · launchctl plist)</files>
  <action>
    `python3 -m graphify.serve graphify-out/graph.json` as background launchd service.
    Add to Daemon QUARTET → QUINTET.
    Per scripts/install-litellm-autostart.sh pattern.
  </action>
  <verify>`launchctl list | grep graphify-mcp` shows running · stdio MCP responds</verify>
  <done>Graphify MCP server live</done>
</task>

<task type="auto">
  <name>B2.2 · Open WebUI MCP config + Sylvia /api/sylvia/corpus endpoint</name>
  <files>app/api/sylvia/corpus/route.ts (NEW · per SYLVIA_API_CONTRACT §2.3) · open-webui MCP config</files>
  <action>
    Per docs/sylvia/SYLVIA_API_CONTRACT.md §2.3 (3rd of 4 banked endpoints).
    Clone consensus route auth pattern (BINDING #16) · triple-source secret.
    Backend: query graphify MCP + vector-store · merge results · cite provenance.
    Avoid: bypassing LiteLLM Gateway for embeddings (BINDING #10).
  </action>
  <verify>POST /api/sylvia/corpus returns KbHit[] · provenance tagged · agreementScore included</verify>
  <done>Moat #11 endpoint live</done>
</task>

</tasks>

---

## WAVE B3 · SYLVIA TOKEN DISCIPLINE MIRROR

**Effort est:** 2-3 hrs
**Gates on:** A3 close · B2 close
**Reference:** A3 learnings + cost-tracker.ts already exists

<tasks>

<task type="auto">
  <name>B3.1 · Surface cost-tracker in Sylvia UI</name>
  <files>app/api/sylvia/* (additive headers) · Open WebUI consumer config</files>
  <action>
    Every Sylvia response carries `X-Sylvia-Cost-USD` header + `X-Sylvia-Tokens-In/Out` headers.
    Open WebUI consumer reads + displays per-turn cost.
    Per Claude_Setup_Patterns §2 Moat #2.
    Avoid: PII in headers.
  </action>
  <verify>Sylvia chat UI shows cost-per-turn · matches `costActualUsd` in SylviaMemory</verify>
  <done>Token observability live</done>
</task>

<task type="auto">
  <name>B3.2 · Caveman-style compression mode</name>
  <files>lib/sylvia/triage-router.ts (additive `compressionMode` opt)</files>
  <action>
    Add `compressionMode: "off" | "lite" | "full" | "ultra"` to TriageTask.
    Default `off` · CEO toggle per session.
    Inject `caveman` system prompt suffix when active.
    Caveman MCP server (`caveman-shrink`) already loaded · consume if available.
  </action>
  <verify>Sylvia output with `compressionMode: "full"` averages ≥50% fewer tokens vs `off`</verify>
  <done>Caveman parity in Sylvia</done>
</task>

</tasks>

---

## WAVE B5 · SYLVIA SKILL AUTO-DISCOVERY (extend skill-loader)

**Effort est:** 3-4 hrs
**Gates on:** B4 close · Phase 3.1 SSA unfinished work resolved (§9M #10)
**Reference:** 239 skill files prebuilt · `lib/bots/skill-loader.ts` 390 LOC contract

<tasks>

<task type="auto">
  <name>B5.1 · Skill-loader scan extension · multi-source</name>
  <files>lib/bots/skill-loader.ts (LOCKED · CEO approval REQUIRED · ADD-ONLY)</files>
  <action>
    Extend `loadSkillPack()` to scan additional sources:
    - `lib/bots/skills/<bot>/` (existing · primary)
    - `~/.claude/skills/legacyloop-<bot>/` (user-installed)
    - `<repo>/.claude/skills/` (project-scoped)
    Precedence: project > user > built-in.
    Per Claude_Setup_Patterns §3 Moat #3.
    Avoid: enabling marketplace fetch (Phase B6+).
  </action>
  <verify>tsc=0 · existing bot routes all green · new source path loads correctly</verify>
  <done>Skill marketplace foundation</done>
</task>

</tasks>

---

## WAVE B6 · QUEEN→WORKER (Ruflo Option C IF approved)

**Effort est:** 4-6 weeks (epic · NOT this plan · spec-authored only)
**Gates on:** §6 #2 + §9M #8 closed · all of Phase A and B1-B5 stable
**Reference:** SUPER_BRAIN_STATE §2B Option-C recommendation

<tasks>

<task type="auto">
  <name>B6.1 · Devin L1 spec authoring (NO code)</name>
  <files>docs/specs/SYLVIA_QUEEN_WORKER_V19.md (NEW)</files>
  <action>
    Read `ruvnet/ruflo` source · verify adapter feasibility · design provider adapter · §12 + budget cap hooks.
    Cite all 4 pre-install gates from SUPER_BRAIN_STATE §2B.
    Avoid: any IT execution · this is pure L1 research + V19 spec authoring.
  </action>
  <verify>V19 spec shipped · §10 paste-ready · §11 acceptance test defined</verify>
  <done>Phase B6 design locked · execution gates on CEO greenlight</done>
</task>

</tasks>

---

## WAVE B7 · PROVENANCE + TRUTH GATE UI

**Effort est:** 3-4 hrs
**Gates on:** B4 close · Open WebUI Sylvia consumer wired
**Reference:** Moat #7 + Moat #10 · Claude_Setup_Patterns §8 + §10

<tasks>

<task type="auto">
  <name>B7.1 · Provenance tag enforcement</name>
  <files>app/api/sylvia/{ask,consensus,corpus}/route.ts (additive · response shape)</files>
  <action>
    Every Sylvia response carries `provenance: ProvenanceEntry[]` with kind: `real-time | memory | training | inferred`.
    Reject responses lacking provenance with `422 PROVENANCE_REQUIRED`.
    Per docs/sylvia/SYLVIA_API_CONTRACT.md §4 Moat #7.
  </action>
  <verify>POST /api/sylvia/consensus returns valid provenance array · zero responses untagged in 100-call smoke</verify>
  <done>AC-7 partial · provenance enforced</done>
</task>

<task type="auto">
  <name>B7.2 · Open WebUI badge rendering</name>
  <files>Open WebUI consumer config (additive · response decorator)</files>
  <action>
    "Verified by 4 AIs · 91%" badge above every Sylvia response.
    Color-band: ≥85 green · 70-84 yellow · <70 red+refused.
    Provenance tooltips per source.
    Avoid: badge on `/ask` low-stakes single-agent path (only multi-AI consensus earns badge).
  </action>
  <verify>CEO test 10 high-stakes prompts · all show badge · refused responses show clear reason</verify>
  <done>AC-7 satisfied · investor-demo-ready Truth Gate UI</done>
</task>

</tasks>

---

<boundaries>

## DO NOT CHANGE (Phase A + B)
- `prisma/schema.prisma` (CEO approval required per CLAUDE.md LOCKED FILES)
- `lib/bots/skill-loader.ts` (LOCKED · surgical add-only per F1 doctrine)
- `lib/megabot/run-specialized.ts` (LOCKED · until B4 consolidation decision)
- `app/api/sylvia/consensus/route.ts` (R24 P0 ship · LOCKED until B4)
- ANY `lib/adapters/{ai,auth,storage,multi-ai,pricing,rainforest}.ts`
- ANY `.env*` files (BINDING #5 · NEVER cat/tail/head)
- `public/images/logos/*` (CEO Adobe Illustrator domain)
- `app/components/ItemDashboardPanels.tsx` (9000+ LOC · surgical unlock only)

## SCOPE LIMITS
- Phase A: NO Sylvia substrate touches (Claude side only)
- Phase B: NO non-Sylvia code touches (Sylvia side only)
- Both: NO LangChain · NO direct provider SDK imports (BINDING #10 DOC-TELEMETRY-LOCK)
- Both: NO `prisma db push` against Turso prod (BINDING #6)
- Both: NO new packages without CEO approval
- Both: NO Tailwind / className for styling (WORLD_CLASS_STANDARDS gotchas)
- Phase B6 Ruflo: research + spec ONLY · NO IT execution this plan
- Investor demo: NOT a deliverable of this plan (lands when Phase B7 closes)

</boundaries>

<verification>

Per-wave §12 V19 report. Before declaring this plan complete:

- [ ] AC-1 measurable: baseline + post-Phase-A token usage delta ≥50% drop captured
- [ ] AC-2 reproducible: fresh-chat recall test passes in 3 of 3 spot checks
- [ ] AC-3 measurable: `graphify-out/graph.json` ≥1500 nodes · Claude cites graph in 5 of 5 architecture questions
- [ ] AC-4 measurable: loaded skills ≤20 · CodeBurn metadata-budget-hit warnings = 0 for 7 consecutive days
- [ ] AC-5 measurable: ONE Truth Gate canonical · per CEO §9M #8 selection
- [ ] AC-6 measurable: `kind` column live · `vector-store/` populated · nightly cron firing
- [ ] AC-7 measurable: every multi-AI consensus response has badge + provenance · zero untagged in 100-call smoke
- [ ] tsc=0 after every commit (BINDING enforced)
- [ ] `npm run build` PASS before every commit
- [ ] Vercel `dpl_<id>` READY + curl 200 cited in every §12 (BINDING #21)
- [ ] DOCTRINE_LEDGER drift catches logged (BINDING #28)
- [ ] Zero LOCKED file touches without CEO approval per item

</verification>

<success_criteria>

- All 7 AC met
- All 14 sub-waves shipped with §12 V19
- Zero rollbacks
- CEO Claude token usage drops ≥50% (AC-1 hard threshold)
- Sylvia investor narrative anchors landed (AC-7)
- 28 BINDING preserved · candidate doctrines surfaced as discovered
- Devin push-back catches logged (Sat May 2 + Wed May 6 incident class preserved)

</success_criteria>

<output>

Per-wave: `docs/specs/CMD-<WAVE>-V19_<DATE>.md` (V19 spec author per Devin SOP §1)
Per-ship: `docs/audits/<AUDIT>_<DATE>.md` where applicable
Final summary: `docs/plans/CLAUDE_SYLVIA_UPGRADE_2026-05-12_SUMMARY.md` (post Phase B close)

</output>

---

# §6 · CEO DECISIONS NEEDED (gating this plan)

Before any IT fire, CEO must answer:

| # | Decision | Recommended | Gating Wave |
|---|---|---|---|
| 1 | A1 checkpoint: claude-mem path · Option A/B/C | **C** (install now + Phase B adapter) | A1.2 |
| 2 | A3 checkpoint: CodeBurn vs cost-tracker extend · Option A/B | **B** (extend cost-tracker · BINDING #16) | A3.2 |
| 3 | A4 checkpoint: Pixart MCP install timing · A4 vs B6+ | **defer to B6+** | A4.3 |
| 4 | A5 checkpoint: which skill collections to evaluate (1-3 max) | **GStack + Superpowers · defer rest** | A5.2 |
| 5 | B4 checkpoint: Truth Gate consolidation · opt-a/b/c | **opt-b** (adapter wrap · zero breakage) | B4.1 |
| 6 | Run /paul:init for full PAUL framework or stick with V19 SOP? | **stick V19** (less ceremony · proven) | meta-decision |
| 7 | Hard-prereq order — close LITELLM-ECONNREFUSED P0 BEFORE any Phase B? | **YES** | all of Phase B |
| 8 | Hard-prereq order — finish Phase 3.1 SSA (AnalyzeBot · PhotoBot · DocumentBot loaders) BEFORE B1? | **NO** (parallel-safe per skill-loader contract) | B1 |
| 9 | All 7 Sylvia env keys → Vercel push BEFORE Phase B? | **YES** | all of Phase B |
| 10 | Repo-wide /graphify run NOW (pre-A1) as immediate diagnostic? | **YES** (cheap · 2-4 min · $0.30 Gemini · surfaces full topology) | pre-plan |

---

# §7 · §12 V19 REPORT SHELL (this plan authoring)

| Field | Value |
|---|---|
| **BEFORE state** | tsc=0 · build PASS · HEAD `02577d3` · 287 routes · 53 models · 28 BINDING |
| **AFTER state** | IDENTICAL · plan-authoring only · zero code · zero commits |
| **PART A read** | docs/SUPER_BRAIN_STATE.md (own audit) · ~/Downloads/Claude Code & Sylvia AI Ideas.txt (21+ refs) · paul-framework templates · SUPER_BRAIN_STATE deep-scan addenda |
| **FILES MODIFIED** | NONE |
| **FILES CREATED** | docs/plans/CLAUDE_SYLVIA_UPGRADE_2026-05-12.md (this plan) |
| **FILES DELETED** | NONE |
| **LOCKED files** | UNTOUCHED |
| **SCHEMA changes** | proposed in B1 · NOT yet executed · CEO approval required |
| **PACKAGE changes** | proposed in A1+A2 (claude-mem · graphify hooks · 5 Obsidian plugins · Firecrawl MCP · Playwright enable) · NOT yet executed |
| **ENV changes** | proposed in A4 (`FIRECRAWL_API_KEY`) · NOT yet executed |
| **FLAGS surfaced** | 10 CEO decisions in §6 · 7 AC defined · 14 sub-waves designed · 4 checkpoints (1 in A1 · 1 in A3 · 1 in A4 · 1 in B4) |
| **COMMIT** | none · pending CEO review · then `docs: plans/CLAUDE_SYLVIA_UPGRADE_2026-05-12 (Devin L1 · 2-phase · 14 waves · audit-only)` |
| **Vercel** | no deploy needed · docs-only |
| **curl** | n/a |

---

*End of CLAUDE_SYLVIA_UPGRADE_2026-05-12 plan · Devin L1 authoring · audit-first · awaiting CEO §6 decisions before any Wave A1 fire.*
*Connecting Generations · LegacyLoop Tech LLC · Confidential.*
