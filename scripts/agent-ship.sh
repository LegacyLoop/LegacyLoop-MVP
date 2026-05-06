#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════
# Agent Ship Helper · DEV ONLY · LegacyLoop
# ═══════════════════════════════════════════════════════════════
# CMD-MULTI-AGENT-WORKTREE-MIGRATE V18 · Round 13 P0
#
# Executes the fast-forward push pattern from an agent worktree.
# Called by IT agent after §12 PASS · before emitting hash.
#
# Preconditions enforced:
#   1. Working tree clean
#   2. On a slot branch (agent-N-slot)
#   3. Branch is fast-forwardable to origin/main
#
# Push order (CMD-AGENT-SHIP-DEDUPE-VERCEL V18 · 2026-05-06):
#   1. git push origin HEAD:main   (FF-push · canonical · production deploy)
#   2. ON FAILURE ONLY: git push origin <slot-branch> (recovery snapshot)
#
# Eliminates duplicate Vercel builds (preview deploys on slot branches were
# never used · production deploy is the canonical artifact). Slot-branch
# push retained as recovery snapshot ONLY on FF-failure path so operator
# has a remote ref capturing pre-rebase state if multi-step recovery needed.
#
# Errors loudly if FF-push fails (means main moved · agent must rebase).
# Run from agent worktree (cwd = /Users/ryanhallee/legacy-loop-mvp-agent-N).
# ═══════════════════════════════════════════════════════════════

set -euo pipefail

cd "$(git rev-parse --show-toplevel)"

# Pre-flight 1: clean tree
if [ -n "$(git status -s)" ]; then
  echo "❌ Working tree dirty · commit before ship" >&2
  exit 1
fi

# Pre-flight 2: on a slot branch
CURRENT_BRANCH="$(git rev-parse --abbrev-ref HEAD)"
if [[ ! "$CURRENT_BRANCH" =~ ^agent-[0-9]+-slot$ ]]; then
  echo "❌ Not on a slot branch (current: $CURRENT_BRANCH)" >&2
  echo "   Expected: agent-N-slot" >&2
  exit 1
fi

# Pre-flight 3: fetch + verify FF-able
git fetch origin
MERGE_BASE="$(git merge-base HEAD origin/main)"
REMOTE_HEAD="$(git rev-parse origin/main)"
if [ "$MERGE_BASE" != "$REMOTE_HEAD" ]; then
  echo "❌ Slot branch is NOT fast-forwardable to origin/main" >&2
  echo "   origin/main moved · sync via:" >&2
  echo "     git fetch origin && git rebase origin/main" >&2
  echo "   then re-run this script" >&2
  exit 1
fi

# Try FF-push to main FIRST (canonical · production deploy · NO --force)
if git push origin "HEAD:main"; then
  echo "✓ FF-pushed to origin/main (single production deploy)"
else
  echo "❌ FF-push to origin/main FAILED · origin/main moved during cylinder window"
  echo "   Pushing slot branch as recovery snapshot..."
  git push origin "$CURRENT_BRANCH"
  echo "   ✓ slot-branch backup pushed to origin/$CURRENT_BRANCH"
  echo ""
  echo "   Recovery: git fetch origin && git rebase origin/main && bash scripts/agent-ship.sh"
  exit 1
fi

NEW_HEAD="$(git rev-parse HEAD)"
echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "✓ Cylinder shipped · HEAD @ $NEW_HEAD"
echo "  Cite this hash in §12 COMMIT box"
echo "  Vercel will deploy · curl-verify production after READY"
echo "═══════════════════════════════════════════════════════════════"
