#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════
# Open WebUI Installer · GATEWAY-LOCKED · DEV ONLY · LegacyLoop
# ═══════════════════════════════════════════════════════════════
# TELEMETRY LOCK: All UI traffic routes through LiteLLM Gateway only.
# Ollama direct auto-detect DISABLED. 100% observability via Gateway.
# Per Tech Advisor Executive Directive · Phase 2 AI Command Center.
# ═══════════════════════════════════════════════════════════════
# Usage: bash scripts/install-open-webui.sh
# Idempotent · re-running stops + removes old container before launch.
# ═══════════════════════════════════════════════════════════════

set -euo pipefail

CONTAINER_NAME="open-webui"
HOST_PORT=4000
CONTAINER_PORT=8080
IMAGE="ghcr.io/open-webui/open-webui:main"
VOLUME="open-webui"

# Telemetry lock vars (CRITICAL · do not modify without Tech Advisor sign-off)
LITELLM_BASE="http://host.docker.internal:8000/v1"
LITELLM_TOKEN="legacy-loop-dev-token"

# 1. Verify Docker is reachable
if ! docker info >/dev/null 2>&1; then
  echo "[install-open-webui] ERROR: Docker daemon not running · open Docker.app first" >&2
  exit 1
fi

# 2. Verify LiteLLM Gateway is reachable from host (preflight)
if ! curl -s -o /dev/null -w "%{http_code}" "http://localhost:8000/v1/models" 2>/dev/null | grep -qE "^(200|401|403)$"; then
  echo "[install-open-webui] WARNING: LiteLLM Gateway not reachable on localhost:8000" >&2
  echo "[install-open-webui]   Container will install but telemetry lock won't function." >&2
  echo "[install-open-webui]   Start proxy first: npm run litellm:dev" >&2
  read -r -p "[install-open-webui] Continue anyway? [y/N] " ans
  [[ "$ans" =~ ^[Yy]$ ]] || exit 1
fi

# 3. Stop + remove existing container (idempotent reinstall)
if docker ps -a --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
  echo "[install-open-webui] Stopping existing ${CONTAINER_NAME} container..."
  docker stop "${CONTAINER_NAME}" >/dev/null 2>&1 || true
  docker rm "${CONTAINER_NAME}" >/dev/null 2>&1 || true
fi

# 4. Run new container with TELEMETRY LOCK
echo "[install-open-webui] Launching ${CONTAINER_NAME} on port ${HOST_PORT} (Gateway-locked)..."
docker run -d \
  --name "${CONTAINER_NAME}" \
  -p "${HOST_PORT}:${CONTAINER_PORT}" \
  --add-host=host.docker.internal:host-gateway \
  -e OPENAI_API_BASE_URL="${LITELLM_BASE}" \
  -e OPENAI_API_KEY="${LITELLM_TOKEN}" \
  -e ENABLE_OLLAMA_API=false \
  -e WEBUI_AUTH=true \
  -v "${VOLUME}:/app/backend/data" \
  --restart always \
  "${IMAGE}"

# 5. Wait for container to be healthy
echo "[install-open-webui] Waiting for Open WebUI to be ready..."
for i in 1 2 3 4 5 6 7 8 9 10 11 12; do
  if curl -s -o /dev/null -w "%{http_code}" "http://localhost:${HOST_PORT}/health" 2>/dev/null | grep -qE "^(200|301|302)$"; then
    echo "[install-open-webui] ✓ Open WebUI ready at http://localhost:${HOST_PORT}"
    break
  fi
  sleep 5
done

# 6. Verify telemetry lock by inspecting env vars in running container
echo "[install-open-webui] Verifying telemetry lock..."
LOCK_BASE=$(docker exec "${CONTAINER_NAME}" sh -c 'echo $OPENAI_API_BASE_URL')
LOCK_OLLAMA=$(docker exec "${CONTAINER_NAME}" sh -c 'echo $ENABLE_OLLAMA_API')
echo "[install-open-webui]   OPENAI_API_BASE_URL=${LOCK_BASE}"
echo "[install-open-webui]   ENABLE_OLLAMA_API=${LOCK_OLLAMA}"

if [[ "${LOCK_BASE}" != "${LITELLM_BASE}" ]]; then
  echo "[install-open-webui] ERROR: telemetry lock failed · expected ${LITELLM_BASE}" >&2
  exit 1
fi

# 7. Final status
echo ""
echo "[install-open-webui] Container status:"
docker ps --filter "name=${CONTAINER_NAME}" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
echo ""
echo "[install-open-webui] ✓ Install complete · TELEMETRY LOCK ENGAGED"
echo "[install-open-webui]   → Open browser: http://localhost:${HOST_PORT}"
echo "[install-open-webui]   → First boot: create admin account (interactive)"
echo "[install-open-webui]   → All UI calls route through LiteLLM Gateway"
echo "[install-open-webui]   → Restart: bash scripts/start-open-webui.sh"
echo "[install-open-webui]   → Stop:    bash scripts/stop-open-webui.sh"
