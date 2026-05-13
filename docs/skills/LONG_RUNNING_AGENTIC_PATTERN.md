# Long-Running Agentic Pattern (LegacyLoop · 2026-05-13)

## Empirical state
Per Devin §0 deep-dive 2026-05-13: `/goal` is NOT a built-in Claude Code slash command (confirmed via `claude --help` + Anthropic claude-code README + `~/.claude/commands/` enumeration). CEO ref #26 wake-up assumption was push-back-corrected to document the PATTERN using available primitives.

## Available primitives (verified)
| Primitive | Source | Purpose |
|---|---|---|
| `--permission-mode plan` | Claude Code built-in | Plan mode · no edits · CEO confirms before apply |
| `paul:plan` | PAUL plugin (loaded) | Author PLAN.md from northstar |
| `paul:apply` | PAUL plugin | Execute PLAN with checkpoints |
| `paul:resume` | PAUL plugin | Restore + continue work |
| `--max-budget-usd <N>` | Claude Code built-in (--print flag) | Hard cap LLM spend |
| `--agents <json>` | Claude Code built-in | Custom agent definitions |
| `--effort <level>` | Claude Code built-in | low/medium/high/xhigh/max |
| `--continue` / `--fork-session` | Claude Code built-in | Session continuity across runs |

## Pattern composition (long-running task)

### Step 1 — Northstar formulation (CEO)
Single-sentence outcome statement. Specific. Measurable. Time-bound.

Examples:
- ✅ "Phase A 90% complete by EOD 2026-05-13 · 4 §12s GREEN finalized · P0-1 closed"
- ❌ "Do the work" (vague · no measure)
- ❌ "Build the app" (no scope · no time)

### Step 2 — Plan mode session (Devin · 5-15 min)
```bash
claude --permission-mode plan --effort high
```
Devin authors PLAN.md citing northstar · breaks into sub-cylinders · verifies feasibility · CEO greenlights.

### Step 3 — PAUL:apply with budget cap (IT · 1-24 hrs)
```bash
claude -p --max-budget-usd 20 /paul:apply <plan-path>
```
PAUL executes PLAN.md · pauses at checkpoints · CEO reviews · resumes.

### Step 4 — §12 V19 emit at every sub-cylinder close
Per BINDING and `feedback_mandatory_v12_emission` · regardless of outcome.

### Step 5 — Northstar verify (CEO + Devin L3)
Compare end-state vs Step 1 northstar. If <90% · iterate. If ≥90% · close.

## When to use vs traditional cylinder

### Use long-running pattern WHEN
- Task spans >2 hrs OR >5 sub-cylinders
- Northstar measurable (e.g. "Phase X% by Y date")
- Sub-cylinders mostly parallel-safe
- CEO available for periodic checkpoint reviews
- Budget cap clear (≤$20/day per BINDING #25)

### Use traditional single cylinder WHEN
- Task <2 hrs · ≤1 sub-cylinder
- Tight single scope (no parallelization)
- High-risk surgical edit (LOCKED file unlock)
- Push-back authority high · need synchronous CEO

## Northstar test (CEO authors · Devin verifies)
Northstar passes IF Devin can answer all 4:
1. What CONCRETE end-state must exist at deadline?
2. What MEASURABLE proof confirms it?
3. What's the BUDGET cap?
4. What's the ROLLBACK if blown?

If any answer is vague · re-author northstar before Step 2.

## Cascade example (Phase A close · Wed 2026-05-13)
**Northstar:** "Phase A 90% by EOD · P0-1 + P0-2 + 2 stuck ships closed · 4 §12s GREEN"

**Steps invoked:**
1. CEO terminal cascade (vercel login · cloudflared · firecrawl · agent-ship.sh × 2) — manual hands-on · ~15 min
2. CEO GUI cascade (Google DNS · Wispr · Obsidian) — manual hands-on · ~15 min
3. IT cascade auto (LITELLM-EXPOSE re-fire · FIRECRAWL re-fire · BACKUP-ROTATION · OPEN-WEBUI-RESTORE · RUFLO-INVESTIGATE) — hands-off · ~3-4 hrs

Each step emits §12 · cascade halts on STOP rule · CEO greenlight to resume.

## Sylvia inheritance (Phase B+)
When Sylvia migrates to dedicated AI computer · long-running pattern inherits:
- Sylvia `/api/sylvia/plan` endpoint receives northstar
- Sylvia Queen→Worker swarm (B6 epic) decomposes via Ruflo
- BudgetTracker enforces $20/day per BINDING #25
- §12 V19 emit per Worker close
- Sylvia consensus route final-verifies cascade outcome

## Last revised
2026-05-13 by Devin L1 (CMD-GOAL-SLASH-DISCIPLINE-DOC V19 R28 P3)
