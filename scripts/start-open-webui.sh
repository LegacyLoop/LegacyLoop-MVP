#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════
# Open WebUI Start · DEV ONLY · LegacyLoop
# ═══════════════════════════════════════════════════════════════
# Starts the open-webui container if it's stopped (e.g. after Docker
# Desktop restart). Telemetry lock env vars are baked into the
# container at install time · this just (re)starts the existing one.
# Usage: bash scripts/start-open-webui.sh
# ═══════════════════════════════════════════════════════════════

set -euo pipefail

CONTAINER_NAME="open-webui"
HOST_PORT=4000

if ! docker info >/dev/null 2>&1; then
  echo "[start-open-webui] ERROR: Docker daemon not running · open Docker.app first" >&2
  exit 1
fi

if ! docker ps -a --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
  echo "[start-open-webui] Container '${CONTAINER_NAME}' does not exist · run install-open-webui.sh first" >&2
  exit 1
fi

if docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
  echo "[start-open-webui] Container already running."
else
  echo "[start-open-webui] Starting ${CONTAINER_NAME}..."
  docker start "${CONTAINER_NAME}" >/dev/null
fi

# Wait for ready
for i in 1 2 3 4 5 6 7 8 9 10; do
  if curl -s -o /dev/null -w "%{http_code}" "http://localhost:${HOST_PORT}/health" 2>/dev/null | grep -qE "^(200|301|302)$"; then
    echo "[start-open-webui] ✓ Ready at http://localhost:${HOST_PORT}"
    exit 0
  fi
  sleep 3
done

echo "[start-open-webui] WARNING: container started but /health not responding · check 'docker logs ${CONTAINER_NAME}'" >&2
exit 1
