#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════
# Ollama Autostart Installer · DEV ONLY · LegacyLoop
# ═══════════════════════════════════════════════════════════════
# Installs a macOS launchctl plist so the Ollama daemon:
#   1. Starts automatically on user login
#   2. Survives reboot
#   3. Enforces OLLAMA_MAX_LOADED_MODELS=1 (prevents OOM · Cyl 5 Risk #3)
#   4. Binds to 127.0.0.1 only (local-only · no LAN exposure)
# ═══════════════════════════════════════════════════════════════
# Usage: bash scripts/install-ollama-autostart.sh
# Idempotent · safe to re-run · unloads existing plist before reinstall.
# ═══════════════════════════════════════════════════════════════

set -euo pipefail

PLIST_LABEL="com.legacyloop.ollama"
PLIST_PATH="$HOME/Library/LaunchAgents/${PLIST_LABEL}.plist"
OLLAMA_BIN="$(command -v ollama || true)"

if [ -z "$OLLAMA_BIN" ]; then
  echo "[install-ollama-autostart] ERROR: ollama binary not found in PATH · install via brew first" >&2
  exit 1
fi

echo "[install-ollama-autostart] Found ollama at: $OLLAMA_BIN"

# 1. Stop current foreground/nohup ollama process (if any)
echo "[install-ollama-autostart] Stopping existing ollama processes..."
pkill -f 'ollama serve' 2>/dev/null || true
sleep 2

# 2. Unload existing plist if present (idempotent reinstall)
if [ -f "$PLIST_PATH" ]; then
  echo "[install-ollama-autostart] Unloading existing plist..."
  launchctl unload "$PLIST_PATH" 2>/dev/null || true
fi

# 3. Ensure LaunchAgents dir exists
mkdir -p "$HOME/Library/LaunchAgents"

# 4. Write plist
echo "[install-ollama-autostart] Writing plist to: $PLIST_PATH"
cat > "$PLIST_PATH" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>${PLIST_LABEL}</string>

    <key>ProgramArguments</key>
    <array>
        <string>${OLLAMA_BIN}</string>
        <string>serve</string>
    </array>

    <key>RunAtLoad</key>
    <true/>

    <key>KeepAlive</key>
    <true/>

    <key>EnvironmentVariables</key>
    <dict>
        <key>OLLAMA_MAX_LOADED_MODELS</key>
        <string>1</string>

        <key>OLLAMA_NUM_PARALLEL</key>
        <string>1</string>

        <key>OLLAMA_HOST</key>
        <string>127.0.0.1:11434</string>

        <key>OLLAMA_KEEP_ALIVE</key>
        <string>5m</string>

        <key>HOME</key>
        <string>${HOME}</string>

        <key>PATH</key>
        <string>/usr/local/bin:/usr/bin:/bin:/opt/homebrew/bin</string>
    </dict>

    <key>StandardOutPath</key>
    <string>/tmp/ollama-launchd.log</string>

    <key>StandardErrorPath</key>
    <string>/tmp/ollama-launchd.err</string>

    <key>ProcessType</key>
    <string>Background</string>
</dict>
</plist>
EOF

# 5. Load the plist
echo "[install-ollama-autostart] Loading plist..."
launchctl load "$PLIST_PATH"

# 6. Wait for daemon to be ready
echo "[install-ollama-autostart] Waiting for daemon to be ready..."
for i in 1 2 3 4 5 6 7 8 9 10; do
  if curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:11434/api/tags | grep -q "200"; then
    echo "[install-ollama-autostart] Daemon ready · /api/tags returns 200"
    break
  fi
  sleep 1
done

# 7. Confirm via launchctl list
echo "[install-ollama-autostart] launchctl status:"
launchctl list | grep "${PLIST_LABEL}" || {
  echo "[install-ollama-autostart] ERROR: plist not loaded · check /tmp/ollama-launchd.err" >&2
  exit 1
}

# 8. Confirm models still accessible
echo "[install-ollama-autostart] Available models:"
ollama list

echo "[install-ollama-autostart] ✓ Autostart installed · daemon managed by launchctl"
echo "[install-ollama-autostart]   To uninstall: launchctl unload $PLIST_PATH && rm $PLIST_PATH"
