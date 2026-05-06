#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════
# Multi-Agent Worktree Reset · DEV ONLY · LegacyLoop
# ═══════════════════════════════════════════════════════════════
# CMD-MULTI-AGENT-WORKTREE-MIGRATE V18 · Round 13 P0
#
# Resets one slot worktree to current origin/main · preserves
# node_modules · preserves .env.local symlink · preserves dev.db.
#
# Usage: bash scripts/worktree-reset.sh <agent-number>
#   e.g. bash scripts/worktree-reset.sh 2
#
# Run from MAIN worktree only.
# ═══════════════════════════════════════════════════════════════

set -euo pipefail

if [ $# -ne 1 ]; then
  echo "Usage: $0 <agent-number>" >&2
  exit 1
fi

N="$1"
WT_PATH="/Users/ryanhallee/legacy-loop-mvp-agent-$N"

if [ ! -d "$WT_PATH" ]; then
  echo "❌ Worktree not found: $WT_PATH" >&2
  echo "   Run scripts/worktree-setup.sh first" >&2
  exit 1
fi

cd "$WT_PATH"

# Check tree state · warn if dirty (don't auto-discard · CEO discipline)
if [ -n "$(git status -s)" ]; then
  echo "⚠ Working tree dirty in $WT_PATH"
  echo "  Stash or commit before reset · refusing to discard work"
  git status -s
  exit 1
fi

git fetch origin
git reset --hard origin/main

NEW_HEAD="$(git rev-parse HEAD)"
echo "✓ agent-$N reset to origin/main @ $NEW_HEAD"
