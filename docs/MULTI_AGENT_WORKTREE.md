# Multi-Agent Worktree Pattern · Canonical Reference

**Source cylinder:** CMD-MULTI-AGENT-WORKTREE-MIGRATE V18 · Round 13 P0
**Doctrine ratified:** DOC-PER-AGENT-WORKTREE (1/5 proof on first parallel-cylinder fire post-setup)
**Doctrine invalidated:** DOC-OWN-SCOPE-COMMIT-ISOLATION (PRECHECK alone insufficient · superseded by structural per-agent index isolation)

---

## Why this pattern exists

Two production multi-agent commit-label drift incidents in 5 days:

- **Round 11 incident** (`ca0bbd7` · 2026-05-06 AM) — Cyl 2C agent's `git add` scooped Cyl 2B's staged files into Cyl 2C's commit · annotation reconciliation at `7408db1`.
- **Round 12 incident #2** (`20bf67a`/`e4cafdf`/`dd7aa96` · 2026-05-06 11:11 EDT) — 53s race window between 3 parallel agents · LITELLM commit message landed with PRICE-CANONICAL diff · annotation reconciliation at `dd7aa96`.

Root cause: shared `.git/index` across all VS Code Claude Code terminals operating in the same checkout. PRECHECK (DOC-MULTI-AGENT-INDEX-ISOLATION-PRECHECK · BINDING #12) detects foreign pre-staged files but cannot prevent the COMMIT-FIRE race window.

**Structural fix:** per-agent worktrees · each agent has its own `.git/index` · race class permanently closed.

---

## Topology

```
/Users/ryanhallee/
├── legacy-loop-mvp/                    ← main worktree (Devin · L1 + L3 surface)
├── legacy-loop-mvp-agent-1/            ← IT slot 1 (branch: agent-1-slot)
├── legacy-loop-mvp-agent-2/            ← IT slot 2 (branch: agent-2-slot)
└── legacy-loop-mvp-agent-3/            ← IT slot 3 (branch: agent-3-slot)
```

**Daemon QUARTET stays anchored to main worktree** (LaunchAgents WorkingDirectory unchanged):
- Ollama · `localhost:11434`
- LiteLLM Gateway · `localhost:8000`
- Open WebUI · `localhost:4000`
- stay-awake (caffeinate)

Every worktree's `npm run dev` connects to the same daemons — no per-worktree daemon copies.

---

## One-time setup

```bash
cd /Users/ryanhallee/legacy-loop-mvp
bash scripts/worktree-setup.sh
```

Idempotent. Re-runnable safely. Creates 3 worktrees · clones node_modules via APFS clonefile · symlinks .env.local · creates per-worktree dev.db.

Disk cost: ~negligible (APFS copy-on-write). Verify post-setup:
```bash
git worktree list
ls /Users/ryanhallee/legacy-loop-mvp-agent-{1,2,3}
```

---

## Per-cylinder workflow

### Pre-fire (Devin or MC)

1. Confirm parallel-safety: 3 cylinders touch disjoint files (DOC-PARALLEL-FILE-COLLISION-CHECK · BINDING #8).
2. For each agent slot to be used: `bash scripts/worktree-reset.sh N` (resets slot to current `origin/main`).
3. Open 3 VS Code Claude Code terminal sessions · `cd` each to its assigned worktree path.
4. Paste-pointer per terminal includes cwd label:
   ```
   ▼ PASTE INTO CLAUDE CODE TERMINAL #N ▼
   ▼ cwd: /Users/ryanhallee/legacy-loop-mvp-agent-N ▼
   ```

### Agent execution (IT)

Agent runs the V18 spec · edits source · `npx tsc --noEmit` per save · `npm run build` at end · auto-commit on green per `feedback_auto_commit_workflow.md`. Critical: agent commits to **its slot branch** (e.g., `agent-2-slot`) — NEVER attempts `git checkout main`.

### Ship (IT)

After §12 PASS · agent runs:
```bash
bash scripts/agent-ship.sh
```

Script enforces:
1. Working tree clean
2. On `agent-N-slot` branch (regex)
3. Slot branch is fast-forwardable to `origin/main`

Then:
```bash
git push origin agent-N-slot       # preview deploy
git push origin HEAD:main          # FF-push (production · NO --force)
```

If FF-push fails (main moved between fetch and push) · agent rebases:
```bash
git fetch origin && git rebase origin/main
bash scripts/agent-ship.sh
```

### Post-ship (Devin · L3)

In main worktree:
```bash
git fetch origin && git pull        # sync to new HEAD
mcp__vercel__list_deployments       # confirm dpl_<id> READY for new HEAD
curl -sL -o /dev/null -w "code=%{http_code}\n" \
  "https://app.legacy-loop.com" --max-time 12
```

§12 must cite both `dpl_<id>` READY AND `curl HTTP=<code>` per the active sentinel `feedback_verify_vercel_after_commit.md`.

---

## Doctrine alignment

| Doctrine | Status | How this pattern honors it |
|---|---|---|
| DOC-CEO-SCHEDULE-AUTHORITY (BINDING #3) | PASS | CEO outranks · pattern accommodates manual override (CEO direct-Bash · slot reassignment) |
| DOC-MULTI-AGENT-INDEX-ISOLATION-PRECHECK (BINDING #12) | PASS · STRENGTHENED | PRECHECK still applies WITHIN a worktree · per-agent worktrees make cross-agent collision structurally impossible |
| DOC-PARALLEL-FILE-COLLISION-CHECK (BINDING #8) | PASS · still mandatory | File-level disjoint surfaces still required (two agents writing the same file in different worktrees still merge-conflict at FF-push) |
| DOC-V18-TEMPLATE-CANONICAL-FILE (BINDING #1) | PASS | V18 specs cite worktree path in §0 grounding · paste-pointer cwd label is mandatory |
| feedback_auto_commit_workflow.md | PASS | Auto-commit + FF-push + §12-with-hash all in one shot · scripts/agent-ship.sh is the single fire |
| feedback_verify_vercel_after_commit.md | PASS · sentinel firing | curl-verify production after Vercel READY · cited in §12 |
| DOC-OWN-SCOPE-COMMIT-ISOLATION (candidate · INVALIDATED) | SUPERSEDED | structural fix replaces the precheck-only candidate |
| DOC-PER-AGENT-WORKTREE (NEW candidate) | 1/5 on first parallel-cylinder fire | ratifies after 5 clean parallel rounds |

---

## Troubleshooting

### "Slot branch is NOT fast-forwardable"

Main moved between agent's `worktree-reset` and `agent-ship`. Rebase:
```bash
git fetch origin
git rebase origin/main
bash scripts/agent-ship.sh
```

If rebase has conflicts · resolve · `git rebase --continue` · re-ship.

### "Two agents touched the same file"

This is a SPEC AUTHORING bug · not a worktree bug. Devin must verify parallel-safety BEFORE delivery (per workflow correction May 6). If it happens anyway: the second FF-push will fail · agent rebases · resolves · re-ships.

### "Daemon not reachable from agent worktree"

Daemon QUARTET runs from main worktree path. Verify:
```bash
curl -s http://localhost:8000/v1/models | head -5      # LiteLLM Gateway
curl -s http://localhost:11434/api/tags | head -5      # Ollama
launchctl list | grep com.legacyloop                   # plist health
```

### "Schema migration in one worktree · others stale"

Per-worktree dev.db means schema state diverges. Run `npx prisma db push` in EVERY worktree after a schema migration. Treat schema migrations as cylinder-serialized · never parallel.

### "I need to delete a worktree"

```bash
cd /Users/ryanhallee/legacy-loop-mvp        # main worktree
git worktree remove ../legacy-loop-mvp-agent-N
git branch -d agent-N-slot                  # if branch should also go
```

`git worktree remove` refuses on dirty trees · use `--force` only with explicit CEO ack.

---

## Source-of-truth hierarchy update

This file is operational reference · NOT canonical doctrine. Canonical SOT remains:

1. The app (running code · production behavior)
2. Git HEAD
3. `docs/DOCTRINE_LEDGER.md`
4. Slack `#all-legacyloop`
5. Memory files (`~/.claude/projects/.../memory/`)
6. CLAUDE.md · WORLD_CLASS_STANDARDS.md · AGENTS.md
7. Master Roadmap

This file slots under #6 as a CLAUDE.md cross-reference target.

---

*End of MULTI_AGENT_WORKTREE.md*
*Drive on.*
