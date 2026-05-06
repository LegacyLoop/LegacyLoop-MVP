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
# Push order:
#   git push origin <slot-branch>     (preview deploy on Vercel)
#   git push origin HEAD:main         (FF-push · production deploy)
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

# Push slot branch (preview deploy)
git push origin "$CURRENT_BRANCH"
echo "✓ Pushed $CURRENT_BRANCH (preview deploy on Vercel)"

# FF-push to main (production deploy · errors if not FF · NO --force)
git push origin "HEAD:main"
echo "✓ FF-pushed to origin/main"

NEW_HEAD="$(git rev-parse HEAD)"
echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "✓ Cylinder shipped · HEAD @ $NEW_HEAD"
echo "  Cite this hash in §12 COMMIT box"
echo "  Vercel will deploy · curl-verify production after READY"
echo "═══════════════════════════════════════════════════════════════"
