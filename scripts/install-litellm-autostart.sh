#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════
# LiteLLM Proxy Autostart Installer · DEV ONLY · LegacyLoop
# ═══════════════════════════════════════════════════════════════
# Installs a macOS launchctl plist so the LiteLLM proxy:
#   1. Starts automatically on user login
#   2. Survives reboot
#   3. Auto-respawns on crash (KeepAlive)
#   4. Routes via wrapper (DOC-BAN-ENV-FILE-DUMP compliance ·
#      provider keys exported at runtime · NEVER stored in plist)
# ═══════════════════════════════════════════════════════════════
# Clones CMD-OLLAMA-AUTOSTART pattern (Wed Apr 29 · e042954).
# Closes the Phase 2 boot-order gap from CMD-OPEN-WEBUI-INSTALL §12.
# ═══════════════════════════════════════════════════════════════
# Usage: bash scripts/install-litellm-autostart.sh
# Idempotent · safe to re-run · unloads existing plist before reinstall.
# ═══════════════════════════════════════════════════════════════

set -euo pipefail

PLIST_LABEL="com.legacyloop.litellm"
PLIST_PATH="$HOME/Library/LaunchAgents/${PLIST_LABEL}.plist"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
WRAPPER="${SCRIPT_DIR}/litellm-dev.sh"
LITELLM_BIN="$(command -v litellm || true)"

# 0. Precheck binary + wrapper
if [ -z "$LITELLM_BIN" ]; then
  echo "[install-litellm-autostart] ERROR: litellm binary not found in PATH" >&2
  echo "[install-litellm-autostart]   Install via: pip3.11 install litellm" >&2
  exit 1
fi
if [ ! -x "$WRAPPER" ]; then
  echo "[install-litellm-autostart] ERROR: wrapper missing at ${WRAPPER}" >&2
  exit 1
fi

echo "[install-litellm-autostart] Found litellm at: $LITELLM_BIN"
echo "[install-litellm-autostart] Wrapper:           $WRAPPER"
echo "[install-litellm-autostart] Repo root:         $REPO_ROOT"

# 1. Stop current foreground/wrapper proxy processes (if any)
echo "[install-litellm-autostart] Stopping existing proxy processes..."
pkill -f 'litellm.*--config litellm_config.yaml' 2>/dev/null || true
sleep 2

# 2. Unload existing plist if present (idempotent reinstall)
if [ -f "$PLIST_PATH" ]; then
  echo "[install-litellm-autostart] Unloading existing plist..."
  launchctl unload "$PLIST_PATH" 2>/dev/null || true
fi

# 3. Ensure LaunchAgents dir exists
mkdir -p "$HOME/Library/LaunchAgents"

# 4. Write plist
echo "[install-litellm-autostart] Writing plist to: $PLIST_PATH"
cat > "$PLIST_PATH" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>${PLIST_LABEL}</string>

    <key>ProgramArguments</key>
    <array>
        <string>/bin/bash</string>
        <string>${WRAPPER}</string>
    </array>

    <key>WorkingDirectory</key>
    <string>${REPO_ROOT}</string>

    <key>RunAtLoad</key>
    <true/>

    <key>KeepAlive</key>
    <true/>

    <key>EnvironmentVariables</key>
    <dict>
        <key>HOME</key>
        <string>${HOME}</string>

        <key>PATH</key>
        <string>/usr/local/bin:/opt/homebrew/bin:/usr/bin:/bin</string>

        <key>LANG</key>
        <string>en_US.UTF-8</string>
    </dict>

    <key>StandardOutPath</key>
    <string>/tmp/litellm-launchd.log</string>

    <key>StandardErrorPath</key>
    <string>/tmp/litellm-launchd.err</string>

    <key>ProcessType</key>
    <string>Background</string>
</dict>
</plist>
EOF

# 5. Sanity check · plist must NOT contain provider keys
# DOC-BAN-ENV-FILE-DUMP enforcement
if grep -qiE '(API_KEY|TOKEN|SECRET|BEARER)' "$PLIST_PATH"; then
  echo "[install-litellm-autostart] ERROR: plist contains key-like strings · ABORT" >&2
  rm "$PLIST_PATH"
  exit 1
fi
echo "[install-litellm-autostart] Plist clean · zero key-like strings"

# 6. Load the plist
echo "[install-litellm-autostart] Loading plist..."
launchctl load "$PLIST_PATH"

# 7. Wait for proxy to be ready
echo "[install-litellm-autostart] Waiting for proxy to be ready on :8000..."
for i in 1 2 3 4 5 6 7 8 9 10 11 12 13 14 15; do
  if curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:8000/v1/models 2>/dev/null | grep -qE "^(200|401)$"; then
    echo "[install-litellm-autostart] Proxy ready · /v1/models reachable"
    break
  fi
  sleep 1
done

# 8. Confirm via launchctl list
echo "[install-litellm-autostart] launchctl status:"
launchctl list | grep "${PLIST_LABEL}" || {
  echo "[install-litellm-autostart] ERROR: plist not loaded · check /tmp/litellm-launchd.err" >&2
  exit 1
}

# 9. Confirm aliases still accessible
echo "[install-litellm-autostart] Available models:"
curl -s http://127.0.0.1:8000/v1/models 2>/dev/null | jq -r '.data[].id' 2>/dev/null || echo "  (jq unavailable · check via curl directly)"

echo "[install-litellm-autostart] ✓ Autostart installed · proxy managed by launchctl"
echo "[install-litellm-autostart]   To uninstall: launchctl unload $PLIST_PATH && rm $PLIST_PATH"
