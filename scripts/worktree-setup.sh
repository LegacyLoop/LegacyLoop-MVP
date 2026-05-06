#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════
# Multi-Agent Worktree Setup · DEV ONLY · LegacyLoop
# ═══════════════════════════════════════════════════════════════
# CMD-MULTI-AGENT-WORKTREE-MIGRATE V18 · Round 13 P0
#
# Creates 3 sibling worktrees for parallel IT execution:
#   /Users/ryanhallee/legacy-loop-mvp-agent-1
#   /Users/ryanhallee/legacy-loop-mvp-agent-2
#   /Users/ryanhallee/legacy-loop-mvp-agent-3
#
# Each worktree:
#   · checked out on a persistent slot branch (agent-N-slot)
#   · branch starts at origin/main HEAD
#   · node_modules cloned via APFS clonefile (cp -c · near-zero disk)
#     Falls back to cp -R on non-APFS volumes (with a disk-cost warning).
#   · .env.local symlinked from main worktree (single secret SOT)
#   · prisma/dev.db is fresh per worktree (run prisma db push first time)
#
# Idempotent: re-running skips already-existing worktrees + branches.
# Run from MAIN worktree only: cd /Users/ryanhallee/legacy-loop-mvp
# ═══════════════════════════════════════════════════════════════

set -euo pipefail

MAIN_REPO="/Users/ryanhallee/legacy-loop-mvp"
PARENT_DIR="/Users/ryanhallee"
AGENT_COUNT=3

# Pre-flight: must run from main worktree on main branch · clean tree · synced
cd "$MAIN_REPO"
CURRENT_BRANCH="$(git rev-parse --abbrev-ref HEAD)"
if [ "$CURRENT_BRANCH" != "main" ]; then
  echo "❌ Must run from main branch (currently on $CURRENT_BRANCH)" >&2
  exit 1
fi
if [ -n "$(git status -s)" ]; then
  echo "❌ Working tree dirty · commit or stash first" >&2
  exit 1
fi
git fetch origin
LOCAL_HEAD="$(git rev-parse HEAD)"
REMOTE_HEAD="$(git rev-parse origin/main)"
if [ "$LOCAL_HEAD" != "$REMOTE_HEAD" ]; then
  echo "❌ Local main not synced with origin · run git pull first" >&2
  exit 1
fi

echo "✓ Pre-flight: main · clean · synced @ $LOCAL_HEAD"

clone_node_modules() {
  local SRC="$1"
  local DST="$2"
  # APFS clonefile (cp -c) preferred · falls back to cp -R if not supported.
  if cp -c -R "$SRC" "$DST" 2>/dev/null; then
    echo "  ✓ node_modules cloned (APFS clonefile)"
  else
    echo "  ⚠ APFS clonefile unavailable · falling back to cp -R (disk cost ~942 MB)"
    cp -R "$SRC" "$DST"
    echo "  ✓ node_modules copied (cp -R)"
  fi
}

for N in $(seq 1 $AGENT_COUNT); do
  WT_PATH="$PARENT_DIR/legacy-loop-mvp-agent-$N"
  SLOT_BRANCH="agent-$N-slot"

  if [ -d "$WT_PATH" ]; then
    echo "⊙ agent-$N: worktree exists at $WT_PATH · skipping create"
  else
    if git show-ref --verify --quiet "refs/heads/$SLOT_BRANCH"; then
      git worktree add "$WT_PATH" "$SLOT_BRANCH"
    else
      git worktree add -b "$SLOT_BRANCH" "$WT_PATH" origin/main
    fi
    echo "✓ agent-$N: worktree created at $WT_PATH on $SLOT_BRANCH"
  fi

  # APFS clonefile node_modules (near-zero disk on macOS · cp -c)
  if [ ! -d "$WT_PATH/node_modules" ]; then
    echo "  → cloning node_modules..."
    clone_node_modules "$MAIN_REPO/node_modules" "$WT_PATH/node_modules"
  fi

  # Symlink .env.local (single secret SOT in main worktree)
  if [ ! -L "$WT_PATH/.env.local" ]; then
    ln -s "$MAIN_REPO/.env.local" "$WT_PATH/.env.local"
    echo "  ✓ .env.local symlinked"
  fi

  # Run prisma generate + db push to create per-worktree dev.db (idempotent)
  (cd "$WT_PATH" && npx prisma generate >/dev/null 2>&1 || true)
  if [ ! -f "$WT_PATH/prisma/dev.db" ]; then
    (cd "$WT_PATH" && npx prisma db push --skip-generate >/dev/null 2>&1)
    echo "  ✓ prisma/dev.db created"
  fi

  # Smoke: tsc=0 in worktree
  (cd "$WT_PATH" && npx tsc --noEmit) && echo "  ✓ tsc=0 in $WT_PATH"
done

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "✓ Multi-agent worktree setup COMPLETE"
echo ""
echo "Worktrees:"
git worktree list
echo ""
echo "Next: paste-pointer to TERMINAL #N includes:"
echo "  ▼ PASTE INTO CLAUDE CODE TERMINAL #N ▼"
echo "  ▼ cwd: /Users/ryanhallee/legacy-loop-mvp-agent-N ▼"
echo "═══════════════════════════════════════════════════════════════"
