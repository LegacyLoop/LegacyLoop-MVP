#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════
# Sylvia Queue-Drain Autostart Installer · DEV ONLY · LegacyLoop
# ═══════════════════════════════════════════════════════════════
# Generates + loads the com.legacyloop.sylvia-queue-drain launchd plist
# with paths resolved AT INSTALL TIME (node via `command -v`, repo + logs
# via $HOME-relative derivation). Migration-safe across:
#   · Intel Homebrew     /usr/local/bin/node
#   · Apple Silicon HB   /opt/homebrew/bin/node
#   · any macOS username (no /Users/ryanhallee hardcode)
#
# Replaces the legacy `cp scripts/com.legacyloop.sylvia-queue-drain.plist`
# approach, whose hardcoded /usr/local/bin/node + /Users/ryanhallee paths
# silently break on a fresh Apple Silicon Mac (the static plist is retained
# for reference / current-machine continuity until QUARTET decommission).
#
# Clones the canonical CMD-STAY-AWAKE-AUTOSTART installer shape
# (install-stay-awake-autostart.sh) · same anti-leak grep · same
# idempotent unload-before-reload · BINDING #16 delegate-to-canonical.
# ═══════════════════════════════════════════════════════════════
# Usage: bash scripts/install-sylvia-queue-drain-autostart.sh
# Idempotent · safe to re-run · unloads existing plist before reinstall.
# ═══════════════════════════════════════════════════════════════

set -euo pipefail

PLIST_LABEL="com.legacyloop.sylvia-queue-drain"
PLIST_PATH="$HOME/Library/LaunchAgents/${PLIST_LABEL}.plist"

# Paths derived from this script's own location · portable.
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO="$(cd "$SCRIPT_DIR/.." && pwd)"
DRAIN_ENV="$REPO/.env.drain"
DRAIN_SCRIPT="$REPO/scripts/sylvia-queue-drain.mjs"
LOG_DIR="$HOME/Library/Logs"

# 0. Resolve node from PATH (Intel /usr/local OR Apple Silicon /opt/homebrew)
NODE_BIN="$(command -v node || true)"
if [ -z "$NODE_BIN" ] || [ ! -x "$NODE_BIN" ]; then
  echo "[install-sylvia-queue-drain] ERROR: node not found on PATH · install Node 20.x first" >&2
  exit 1
fi
echo "[install-sylvia-queue-drain] node resolved at: $NODE_BIN"

# 0b. Precheck repo artifacts exist
if [ ! -f "$DRAIN_SCRIPT" ]; then
  echo "[install-sylvia-queue-drain] ERROR: drain script missing at $DRAIN_SCRIPT" >&2
  exit 1
fi
if [ ! -f "$DRAIN_ENV" ]; then
  echo "[install-sylvia-queue-drain] WARN: $DRAIN_ENV not present yet · daemon will no-op until secrets land" >&2
fi

# 1. Idempotent unload of any existing plist
if [ -f "$PLIST_PATH" ]; then
  echo "[install-sylvia-queue-drain] Unloading existing plist..."
  launchctl unload "$PLIST_PATH" 2>/dev/null || true
fi

# 2. Ensure dirs exist
mkdir -p "$HOME/Library/LaunchAgents" "$LOG_DIR"

# 3. Write plist (paths resolved above)
echo "[install-sylvia-queue-drain] Writing plist to: $PLIST_PATH"
cat > "$PLIST_PATH" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>${PLIST_LABEL}</string>
  <key>ProgramArguments</key>
  <array>
    <string>${NODE_BIN}</string>
    <string>--import</string>
    <string>tsx</string>
    <string>--env-file=${DRAIN_ENV}</string>
    <string>${DRAIN_SCRIPT}</string>
  </array>
  <key>WorkingDirectory</key>
  <string>${REPO}</string>
  <key>StartInterval</key>
  <integer>60</integer>
  <key>RunAtLoad</key>
  <true/>
  <key>StandardOutPath</key>
  <string>${LOG_DIR}/sylvia-queue-drain.log</string>
  <key>StandardErrorPath</key>
  <string>${LOG_DIR}/sylvia-queue-drain.error.log</string>
</dict>
</plist>
EOF

# 4. Anti-leak sanity check · plist must NOT contain provider-key-like strings
# DOC-BAN-ENV-FILE-DUMP enforcement (BINDING #5 anti-leak primitive)
if grep -qiE '(API_KEY|TOKEN|SECRET|BEARER|PASSWORD)' "$PLIST_PATH"; then
  echo "[install-sylvia-queue-drain] ERROR: plist contains key-like strings · ABORT" >&2
  rm "$PLIST_PATH"
  exit 1
fi
echo "[install-sylvia-queue-drain] Plist clean · zero key-like strings"

# 5. Load
echo "[install-sylvia-queue-drain] Loading plist..."
launchctl load "$PLIST_PATH"

# 6. Confirm loaded
launchctl list | grep "${PLIST_LABEL}" || {
  echo "[install-sylvia-queue-drain] ERROR: plist not loaded · check ${LOG_DIR}/sylvia-queue-drain.error.log" >&2
  exit 1
}

echo "[install-sylvia-queue-drain] ✓ Queue-drain installed · 60s StartInterval · managed by launchctl"
echo "[install-sylvia-queue-drain]   To uninstall: launchctl unload $PLIST_PATH && rm $PLIST_PATH"
