#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════
# Ollama Pre-Warm · DEV ONLY · LegacyLoop
# ═══════════════════════════════════════════════════════════════
# Fires a tiny inference request through LiteLLM Gateway to load
# the target model into Ollama RAM · eliminates first-call cold-
# load tax for subsequent Open WebUI / agent / scraper use.
#
# Pattern routes via Gateway (not direct Ollama) per
# DOC-TELEMETRY-LOCK doctrine · captures prewarm in litellm.log.
# ═══════════════════════════════════════════════════════════════
# Usage:
#   bash scripts/prewarm-ollama.sh                       (defaults)
#   bash scripts/prewarm-ollama.sh qwen-coder-2.5-local  (specific)
#   bash scripts/prewarm-ollama.sh --background          (no wait)
# ═══════════════════════════════════════════════════════════════

set -euo pipefail

DEFAULT_MODELS=("qwen-coder-2.5-local")
GATEWAY="${LITELLM_BASE_URL:-http://localhost:8000}"
BACKGROUND=false

# Parse args
MODELS=()
for arg in "$@"; do
  if [ "$arg" = "--background" ]; then
    BACKGROUND=true
  else
    MODELS+=("$arg")
  fi
done

# Default if none specified
if [ ${#MODELS[@]} -eq 0 ]; then
  MODELS=("${DEFAULT_MODELS[@]}")
fi

# Pre-flight: proxy reachable?
if ! curl -s -o /dev/null -w "%{http_code}" "${GATEWAY}/health/liveliness" 2>/dev/null | grep -qE "^(200|301|302)$"; then
  if curl -s -o /dev/null -w "%{http_code}" "${GATEWAY}/v1/models" 2>/dev/null | grep -qE "^(200|401)$"; then
    : # /v1/models works · proxy is up
  else
    echo "[prewarm-ollama] ERROR: Gateway not reachable at ${GATEWAY}" >&2
    echo "[prewarm-ollama]   Start proxy: npm run litellm:dev" >&2
    exit 1
  fi
fi

prewarm_one() {
  local model="$1"
  echo "[prewarm-ollama] Pre-warming ${model} via Gateway..."
  local body
  body=$(cat <<JSON
{"model":"${model}","messages":[{"role":"user","content":"hi"}],"max_tokens":1,"stream":false}
JSON
  )
  if [ "$BACKGROUND" = "true" ]; then
    # Fire-and-forget · install-time use
    (curl -s -o /dev/null -X POST "${GATEWAY}/v1/chat/completions" \
      -H "Content-Type: application/json" \
      -d "${body}" \
      --max-time 300 &
    disown) >/dev/null 2>&1
    echo "[prewarm-ollama]   → fired in background · model loads ~30-60s"
  else
    # Synchronous · on-demand use (e.g., pre-V17.2 final pre-flight)
    local start_time end_time elapsed
    start_time=$(date +%s)
    local response
    response=$(curl -s -X POST "${GATEWAY}/v1/chat/completions" \
      -H "Content-Type: application/json" \
      -d "${body}" \
      --max-time 300 2>&1 || echo "FAIL")
    end_time=$(date +%s)
    elapsed=$((end_time - start_time))
    if [ "$response" = "FAIL" ] || [ -z "$response" ]; then
      echo "[prewarm-ollama]   FAIL after ${elapsed}s · check Gateway + Ollama daemon" >&2
      return 1
    fi
    echo "[prewarm-ollama]   → warm in ${elapsed}s (next call will be 5-15s warm)"
  fi
}

for model in "${MODELS[@]}"; do
  prewarm_one "$model"
done

# Confirm what's currently loaded
echo ""
echo "[prewarm-ollama] Current ollama state:"
ollama ps 2>/dev/null || echo "(ollama ps unavailable)"

echo ""
echo "[prewarm-ollama] ✓ Pre-warm complete"
