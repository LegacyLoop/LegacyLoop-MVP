#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════
# LiteLLM Watchdog · auto-revive gateway on HTTP 000
# ═══════════════════════════════════════════════════════════════
# CMD-LITELLM-DAEMON-REVIVE-AND-HARDEN V20 v2.1 R29 P77 · Wave 16 Slot A
# Runs every 30s via launchctl com.legacyloop.litellm-watchdog
# Max 3 retries/hr · gives up + logs to err if exceeded
#
# Behavior:
#   - probe http://localhost:8000/v1/models (5s timeout)
#   - if HTTP 200 → exit 0 (healthy)
#   - if HTTP 000/connection-refused → kickstart -k revive
#   - if retries exceed 3/hr → log + give up (CEO triage)
#
# Logs: ~/.legacyloop/logs/litellm-watchdog.log
# Retry counter: ~/.legacyloop/litellm-watchdog-retries.txt (epoch lines)
# ═══════════════════════════════════════════════════════════════

set -euo pipefail

LOG="${HOME}/.legacyloop/logs/litellm-watchdog.log"
RETRY_FILE="${HOME}/.legacyloop/litellm-watchdog-retries.txt"
MAX_RETRIES_PER_HOUR=3
PROBE_URL="http://localhost:8000/v1/models"
PROBE_TIMEOUT=5

mkdir -p "$(dirname "$LOG")"

probe() {
  curl -sL --max-time "$PROBE_TIMEOUT" -o /dev/null -w "%{http_code}" "$PROBE_URL" 2>/dev/null || echo "000"
}

count_recent_retries() {
  # Count retries within last 3600s
  local now
  now="$(date +%s)"
  local cutoff=$((now - 3600))
  if [ ! -f "$RETRY_FILE" ]; then
    echo "0"
    return
  fi
  awk -v cutoff="$cutoff" '$1 > cutoff' "$RETRY_FILE" 2>/dev/null | wc -l | tr -d ' '
}

record_retry() {
  echo "$(date +%s)" >> "$RETRY_FILE"
}

revive() {
  echo "$(date) · HTTP 000 detected · kickstart -k com.legacyloop.litellm" >> "$LOG"
  launchctl kickstart -k "gui/$(id -u)/com.legacyloop.litellm" >> "$LOG" 2>&1
  record_retry
  sleep 10
  local status
  status="$(probe)"
  echo "$(date) · post-kickstart probe: HTTP $status" >> "$LOG"
}

main() {
  local status
  status="$(probe)"
  if [ "$status" = "200" ]; then
    exit 0  # healthy · no action
  fi

  local retries
  retries="$(count_recent_retries)"
  if [ "$retries" -ge "$MAX_RETRIES_PER_HOUR" ]; then
    echo "$(date) · MAX retries ($MAX_RETRIES_PER_HOUR/hr) exceeded · giving up · CEO triage needed (status=$status)" >> "$LOG"
    exit 2
  fi

  revive
}

main "$@"
