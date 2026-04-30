#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════
# Stay-Awake Autostart Installer · DEV ONLY · LegacyLoop
# ═══════════════════════════════════════════════════════════════
# Installs a macOS launchctl plist invoking caffeinate -dimsu so the
# Mac never auto-sleeps · keeps Tailscale tunnel alive · Open WebUI
# reachable from iPhone · LiteLLM Gateway always online.
#
# Tech Advisor ST3 critical · protects Saturday Dr. Clark demo from
# mid-demo Mac sleep killing the Tailscale tunnel.
#
# caffeinate flags:
#   -d  prevent display sleep
#   -i  prevent idle sleep
#   -m  prevent disk-idle sleep
#   -s  prevent system sleep on AC power
#   -u  declare user is active (~5 sec heartbeat)
# No -t flag → runs forever · launchctl KeepAlive respawns on kill.
#
# Lid-close prevention is intentionally OUT OF SCOPE (Apple-enforced
# without sudo pmset disablesleep · banked separately).
# ═══════════════════════════════════════════════════════════════
# Clones CMD-PROXY-AUTOSTART (a774d0f · Apr 30) and CMD-OLLAMA-
# AUTOSTART (e042954 · Apr 29) patterns. Same shape · same doctrine
# compliance · same anti-leak grep · same KeepAlive discipline.
# ═══════════════════════════════════════════════════════════════
# Usage: bash scripts/install-stay-awake-autostart.sh
# Idempotent · safe to re-run · unloads existing plist before reinstall.
# ═══════════════════════════════════════════════════════════════

set -euo pipefail

PLIST_LABEL="com.legacyloop.stay-awake"
PLIST_PATH="$HOME/Library/LaunchAgents/${PLIST_LABEL}.plist"
CAFFEINATE_BIN="/usr/bin/caffeinate"

# 0. Precheck
if [ ! -x "$CAFFEINATE_BIN" ]; then
  echo "[install-stay-awake-autostart] ERROR: caffeinate not found at $CAFFEINATE_BIN" >&2
  exit 1
fi

echo "[install-stay-awake-autostart] Found caffeinate at: $CAFFEINATE_BIN"

# 1. Unload existing plist if present (idempotent reinstall · do not
# kill foreign caffeinate processes · they may belong to other tools)
if [ -f "$PLIST_PATH" ]; then
  echo "[install-stay-awake-autostart] Unloading existing plist..."
  launchctl unload "$PLIST_PATH" 2>/dev/null || true
fi

# 2. Ensure LaunchAgents dir exists
mkdir -p "$HOME/Library/LaunchAgents"

# 3. Write plist
echo "[install-stay-awake-autostart] Writing plist to: $PLIST_PATH"
cat > "$PLIST_PATH" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>${PLIST_LABEL}</string>

    <key>ProgramArguments</key>
    <array>
        <string>${CAFFEINATE_BIN}</string>
        <string>-dimsu</string>
    </array>

    <key>RunAtLoad</key>
    <true/>

    <key>KeepAlive</key>
    <true/>

    <key>StandardOutPath</key>
    <string>/tmp/stay-awake-launchd.log</string>

    <key>StandardErrorPath</key>
    <string>/tmp/stay-awake-launchd.err</string>

    <key>ProcessType</key>
    <string>Background</string>
</dict>
</plist>
EOF

# 4. Sanity check · plist must NOT contain provider keys
# DOC-BAN-ENV-FILE-DUMP enforcement (anti-leak primitive)
if grep -qiE '(API_KEY|TOKEN|SECRET|BEARER|PASSWORD)' "$PLIST_PATH"; then
  echo "[install-stay-awake-autostart] ERROR: plist contains key-like strings · ABORT" >&2
  rm "$PLIST_PATH"
  exit 1
fi
echo "[install-stay-awake-autostart] Plist clean · zero key-like strings"

# 5. Load the plist
echo "[install-stay-awake-autostart] Loading plist..."
launchctl load "$PLIST_PATH"

# 6. Wait for caffeinate to be alive
echo "[install-stay-awake-autostart] Waiting for caffeinate to be running..."
for i in 1 2 3 4 5 6 7 8 9 10; do
  if launchctl list | grep -q "${PLIST_LABEL}"; then
    PID=$(launchctl list | grep "${PLIST_LABEL}" | awk '{print $1}')
    if [ "$PID" != "-" ] && [ -n "$PID" ]; then
      echo "[install-stay-awake-autostart] Caffeinate alive · PID $PID"
      break
    fi
  fi
  sleep 1
done

# 7. Confirm via launchctl list
echo "[install-stay-awake-autostart] launchctl status:"
launchctl list | grep "${PLIST_LABEL}" || {
  echo "[install-stay-awake-autostart] ERROR: plist not loaded · check /tmp/stay-awake-launchd.err" >&2
  exit 1
}

# 8. Confirm pmset assertions are active
echo "[install-stay-awake-autostart] pmset sleep assertions:"
pmset -g assertions 2>/dev/null | grep -iE 'PreventUserIdleSystemSleep|PreventUserIdleDisplaySleep|PreventSystemSleep' | head -5 || echo "  (no assertions visible · check pmset output directly)"

echo "[install-stay-awake-autostart] ✓ Stay-awake installed · caffeinate managed by launchctl"
echo "[install-stay-awake-autostart]   To uninstall: launchctl unload $PLIST_PATH && rm $PLIST_PATH"
echo "[install-stay-awake-autostart]   NOTE: lid-close sleep still happens (Apple-enforced) · keep lid open + AC plugged for Saturday demo"
