#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════
# Multi-Agent Worktree Reset · DEV ONLY · LegacyLoop
# ═══════════════════════════════════════════════════════════════
# CMD-MULTI-AGENT-WORKTREE-MIGRATE V18 · Round 13 P0
# Last refreshed: 2026-05-14 (R29 P38 · CF-71 closure)
#
# Resets one slot worktree to current origin/main · preserves
# node_modules · preserves .env.local symlink · preserves dev.db.
#
# Doctrine: BINDING #20 DOC-PER-AGENT-WORKTREE (R20 era · per-
# agent git index isolation eliminates shared-index race window)
# + BINDING #33 DOC-FLAG-RIDER-PER-CYLINDER (rider mechanic
# powers Wave-N parallel-slot doctrine burndown).
# Cross-ref: docs/MULTI_AGENT_WORKTREE.md · V19 template §5.5.
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
# Paths derived from this script's own location · portable across machines/users.
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MAIN_REPO="$(cd "$SCRIPT_DIR/.." && pwd)"
PARENT_DIR="$(dirname "$MAIN_REPO")"
WT_PATH="$PARENT_DIR/legacy-loop-mvp-agent-$N"

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

# CMD-W26-A-WORKTREE-BUILD-FIX (2026-05-30):
# Re-assert sylvia-data as a real empty dir (NOT a symlink) so post-reset
# npm builds succeed under Turbopack 16. Idempotent · safe on each reset.
if [ -L "$WT_PATH/sylvia-data" ]; then
  rm "$WT_PATH/sylvia-data"
  echo "  ↺ sylvia-data symlink removed (Turbopack incompat · W26-A)"
fi
if [ ! -d "$WT_PATH/sylvia-data" ]; then
  mkdir -p "$WT_PATH/sylvia-data"
  echo "  ✓ sylvia-data real empty dir provisioned"
fi
