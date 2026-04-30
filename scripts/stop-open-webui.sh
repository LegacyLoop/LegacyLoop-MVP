#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════
# Open WebUI Stop · DEV ONLY · LegacyLoop
# ═══════════════════════════════════════════════════════════════
# Cleanly stops the open-webui container (preserves the volume ·
# users + chats persist across restarts).
# Usage: bash scripts/stop-open-webui.sh
# ═══════════════════════════════════════════════════════════════

set -euo pipefail

CONTAINER_NAME="open-webui"

if ! docker info >/dev/null 2>&1; then
  echo "[stop-open-webui] Docker daemon not running · nothing to stop"
  exit 0
fi

if ! docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
  echo "[stop-open-webui] Container '${CONTAINER_NAME}' is not running."
  exit 0
fi

echo "[stop-open-webui] Stopping ${CONTAINER_NAME}..."
docker stop "${CONTAINER_NAME}" >/dev/null
echo "[stop-open-webui] ✓ Stopped · volume preserved · restart with: bash scripts/start-open-webui.sh"
