# W26-A · Worktree Build Fix — sylvia-data Symlink → Real Empty Dir

**CMD:** CMD-W26-A-WORKTREE-BUILD-FIX V20 LOW
**Date:** 2026-05-30 PM
**Anchor HEAD:** `d355cc6` → `<post-commit>`
**Status:** 🟢 GREEN · 4×4 worktree builds PASS

---

## Root Cause (Empirical · §0.5)

`scripts/worktree-setup.sh` lines 112-115 provisioned `sylvia-data/` per slot worktree as a **symlink → main worktree's real dir**:

```
agent-1/sylvia-data → /Users/ryanhallee/legacy-loop-mvp/sylvia-data
agent-2/sylvia-data → /Users/ryanhallee/legacy-loop-mvp/sylvia-data
agent-3/sylvia-data → /Users/ryanhallee/legacy-loop-mvp/sylvia-data
```

Turbopack 16 rejects symlinks that resolve outside the filesystem root:

```
- Execution of <DirAssetReference as ModuleReference>::resolve_reference failed
- Symlink sylvia-data/audit/episodic-2026-05-18.jsonl is invalid,
  it points out of the filesystem root
  TurbopackInternalError: Failed to write app endpoint /page
```

Triggered when `lib/sylvia/memory.ts` references `sylvia-data/` and Turbopack walks the dir during module graph build.

Vercel CI clean because `sylvia-data/` is `.gitignore`d and absent on fresh clone.

Three independent agents (W25-L2/L3/L4) flagged the same symptom on different days → convergent (BINDING #28 4-eyes pattern).

---

## Changes

| File | Change | Lines |
|---|---|---|
| `scripts/worktree-setup.sh` | replace `ln -s …/sylvia-data` with detect-symlink-and-replace + `mkdir -p` real empty dir | +15/-4 |
| `scripts/worktree-reset.sh` | append same idempotent block post-`git reset --hard` so reset re-asserts real-dir state | +11/-0 |
| `docs/audits/W26-A-worktree-build-fix.md` | this artifact | NEW |

**Idempotency:** both scripts now detect a stale symlink and convert in place. Safe on every run.

**main worktree:** untouched. Already a real dir with the canonical data — script branches skip it because it never enters the per-slot loop.

---

## Verification

```
main      worktree · npm run build · ✓ Compiled successfully in 27.6s
agent-1   worktree · npm run build · ✓ Compiled successfully in 28.8s
agent-2   worktree · npm run build · ✓ Compiled successfully in 24.2s
agent-3   worktree · npm run build · ✓ Compiled successfully in 25.5s
```

Pre-fix repro (agent-1) trapped the exact Turbopack error verbatim — see §0.5 in §12 PART A.

---

## LOCKED Untouched

```
git diff HEAD --name-only | grep -E "^lib/sylvia/"                # 0
git diff HEAD --name-only | grep -E "^(app|prisma|package.json)"   # 0
git diff HEAD --name-only | grep -E "^lib/(adapters|bots)"          # 0
```

LAW #38 attested: `lib/sylvia/*` diff=0. Scripts-only change.

---

## Doctrine Self-Audit

| BINDING | Status |
|---|---|
| #5 ENV-FILE-DUMP | APP · zero `.env*` touch · `.env.sylvia` symlink retained as-is |
| #12 INDEX-ISOLATION | APP · scoped `git add` · `git diff --cached --stat` pre-commit |
| #17 AUDIT-FIRST-WIRE | APP · read both scripts before edit · cited Turbopack error verbatim |
| #20 PER-AGENT-WORKTREE | APP · script is the canonical provisioner this BINDING governs |
| #28 AUDIT-DOC-DRIFT | APP · 3 independent flags converged (W25-L2/L3/L4) |
| #30 IT-DEEP-DIVE | APP · §0.5 readlink + build repro cited |
| #34 SHA+DPL+CURL | APP · cited in §12 |
| #38 LAW lib/sylvia | PASS · 0 diff |

---

## Doctrine Candidate · DOC-WORKTREE-SYLVIA-DATA-SYMLINK-BUILD-BLOCK (1/5)

**Lesson:** worktree-provisioner symlinks that resolve out-of-root break Turbopack 16 builds silently in slot worktrees while leaving main + Vercel CI green. Pattern: any per-slot data dir that must exist locally MUST be a real dir, NOT a symlink to a sibling worktree.

**Generalization:** applies to any future shared-state dir provisioned per worktree (e.g., logs, scratch, cache). Provisioner default = real dir; only `.env*` files stay as symlinks because they are pure key-value SoT (Turbopack does not walk them as DirAssetReferences).

**Sustains:** #20 PER-AGENT-WORKTREE-ISOLATION (real-dir reinforces isolation) · #28 (caught by convergent 3-agent flagging).

**Ratifies to BINDING after 5 sustained applications.**

---

## Banked Follow-ups

1. **Sanity audit** other per-worktree symlinks for Turbopack compatibility: `.env`, `.env.local`, `.env.sylvia` are all symlinks to main. They are files (not dirs) and Turbopack does not walk them as DirAssetReferences — currently safe. Re-verify on Next.js / Turbopack version bumps.
2. **Slot agents** should run `bash scripts/worktree-reset.sh <N>` on next idle to pick up the idempotent post-reset block (not strictly required since FIX 2 already in-place repaired).
3. **W26-B/C/D/E** unblocked — slot worktrees now build clean.

---

**Connecting Generations · Worktree fleet QA restored.**
