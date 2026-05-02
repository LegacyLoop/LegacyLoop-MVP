#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════
# LiteLLM Dev Proxy Launcher · DEV ONLY · LegacyLoop
# ═══════════════════════════════════════════════════════════════
# Curates env to prevent the 4 recurring issues from Cylinder 5:
#   1. Sources ONLY .env.local (skips .env parse errors)
#   2. Unsets DATABASE_URL (prevents Prisma client crash)
#   3. Skips master_key (preserves Cyl 3 unauth dev access)
#   4. Kills stale proxy processes before launch
# ═══════════════════════════════════════════════════════════════
# Gateway routing model · CMD-LITELLM-LAUNCHER-LOCAL-PATH-DOC V18
# (DOC-LITELLM-LOCAL-MODEL-PATH companion · banks ratification ·
#  empirically verified at Cyl 7B 0e4b64f live spec-drift catch):
#
#   CLOUD aliases (provider passthrough)
#     OpenAI    → http://localhost:8000/openai/v1/...
#     Anthropic → http://localhost:8000/anthropic/v1/...
#     Gemini    → http://localhost:8000/gemini/...
#     xAI       → http://localhost:8000/xai/v1/...
#     ref: lib/adapters/multi-ai.ts:210-214
#
#   LOCAL aliases (Ollama-backed model_list · catch-all)
#     llama-3.2-local · qwen-coder-2.5-local · deepseek-r1-local
#                → http://localhost:8000/v1/chat/completions
#     ref: lib/scraper-parser/adapter.ts:33-38
#
#   GOTCHA: hitting /openai/v1/... with a local alias 404s.
#           Local aliases require the catch-all /v1/ route so
#           the proxy performs model_list lookup internally.
# ═══════════════════════════════════════════════════════════════
# Usage: bash scripts/litellm-dev.sh   OR   npm run litellm:dev
# Stops automatically when terminal closes (foreground process).
# ═══════════════════════════════════════════════════════════════

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

echo "[litellm-dev] Repo: $REPO_ROOT"

# 1. Kill any stale proxy processes
echo "[litellm-dev] Killing stale proxy processes..."
pkill -f 'litellm.*--config litellm_config.yaml' 2>/dev/null || true
sleep 1

# 2. Surgical key export from .env.local — only the active cloud-provider keys.
# DOC-LAUNCHER-EXPORT-PARITY: this regex MUST mirror the litellm_config.yaml
# model_list provider set. When adding a new cloud alias to the yaml that
# references os.environ/<KEY>, extend this regex in the same cylinder.
# DO NOT source .env.local wholesale: it contains LITELLM_* vars
# (BASE_URL, MASTER_KEY) that, if present in the proxy's process
# env, switch the proxy into authenticated mode and break
# unauthenticated bot calls. We also skip DATABASE_URL which would
# otherwise trigger LiteLLM's Prisma client init (Python prisma vs
# our Node prisma → ImportError → crash).
if [ -f .env.local ]; then
  echo "[litellm-dev] Exporting provider keys from .env.local (OPENAI/ANTHROPIC/GEMINI/XAI/PERPLEXITY)"
  KEY_LINES=$(grep -E '^(OPENAI_API_KEY|ANTHROPIC_API_KEY|GEMINI_API_KEY|XAI_API_KEY|PERPLEXITY_API_KEY)=' .env.local || true)
  if [ -z "$KEY_LINES" ]; then
    echo "[litellm-dev] WARNING: no provider keys found in .env.local"
  else
    eval "$(printf '%s\n' "$KEY_LINES" | sed 's/^/export /')"
  fi
else
  echo "[litellm-dev] WARNING: .env.local not found · provider keys may be missing"
fi

# 3. Defensive unsets for vars that would change proxy behavior even
# if they leaked in from a parent shell (npm scripts inherit env).
unset DATABASE_URL DIRECT_URL TURSO_DATABASE_URL 2>/dev/null || true
unset LITELLM_MASTER_KEY LITELLM_BASE_URL 2>/dev/null || true

# 4. Verify config exists
if [ ! -f litellm_config.yaml ]; then
  echo "[litellm-dev] ERROR: litellm_config.yaml not found · cannot launch" >&2
  exit 1
fi

# 5. Launch proxy on :8000
echo "[litellm-dev] Launching proxy on :8000..."
echo "[litellm-dev] Press Ctrl+C to stop · log streams below"
echo "═══════════════════════════════════════════════════════════════"
exec litellm --config litellm_config.yaml --port 8000 "$@"
