#!/usr/bin/env bash
# ════════════════════════════════════════════════════════════════
# LegacyLoop · Vercel Cron Plan Validator
# CMD-CRON-VALIDATE-TOOLING V19 · R21 P1 · 2026-05-07 LATE EOD
# BINDING #24 DOC-VERCEL-PLAN-LIMIT-VALIDATE first ratification
#
# Validates vercel.json `crons` array against the active Vercel
# plan-tier limits. Bakes the R20 webhook saga teaching into
# automation: a 4-day saga becomes a 4-second pre-commit check.
#
# Plan tier source priority:
#   1. CLI flag --plan=hobby|pro|enterprise (highest)
#   2. Env var VERCEL_PLAN (medium)
#   3. Default 'pro' (lowest · matches current production)
#
# Usage:
#   bash scripts/cron-validate.sh                 # default (pro)
#   bash scripts/cron-validate.sh --plan=hobby    # check Hobby compat
#   VERCEL_PLAN=enterprise bash scripts/cron-validate.sh
#   bash scripts/cron-validate.sh --help
#
# Exit codes:
#   0 = PASS  · all schedules within plan-tier limits
#   1 = FAIL  · one or more violations
#   2 = ERROR · vercel.json missing or invalid JSON · bad input
# ════════════════════════════════════════════════════════════════

set -euo pipefail

# ─── ANSI colors (TTY only) ──────────────────────────────────────
if [ -t 1 ]; then
  GREEN='\033[0;32m'
  YELLOW='\033[1;33m'
  RED='\033[0;31m'
  BOLD='\033[1m'
  RESET='\033[0m'
else
  GREEN=''; YELLOW=''; RED=''; BOLD=''; RESET=''
fi

# ─── Plan-tier source resolution ─────────────────────────────────
PLAN="${VERCEL_PLAN:-pro}"
if [ -n "${VERCEL_PLAN:-}" ]; then
  PLAN_SOURCE="env"
else
  PLAN_SOURCE="default"
fi

for arg in "$@"; do
  case "$arg" in
    --plan=*)  PLAN="${arg#*=}"; PLAN_SOURCE="cli" ;;
    --help|-h)
      sed -n '2,22p' "$0" | sed 's/^# \?//'
      exit 0
      ;;
  esac
done

case "$PLAN" in
  hobby|pro|enterprise) ;;
  *)
    echo -e "${RED}ERROR${RESET}: invalid plan '$PLAN' (use hobby|pro|enterprise)"
    exit 2
    ;;
esac

# ─── vercel.json validation ──────────────────────────────────────
VERCEL_JSON="vercel.json"

if [ ! -f "$VERCEL_JSON" ]; then
  echo -e "${RED}ERROR${RESET}: $VERCEL_JSON not found (run from repo root)"
  exit 2
fi

if ! python3 -m json.tool "$VERCEL_JSON" > /dev/null 2>&1; then
  echo -e "${RED}ERROR${RESET}: $VERCEL_JSON is not valid JSON"
  exit 2
fi

# ─── Plan-tier limits ────────────────────────────────────────────
# Hobby: max 2 jobs · 1/day frequency (minute + hour both fixed integers)
# Pro:   unlimited jobs · */N minute granularity acceptable
# Enterprise: unlimited everything
HOBBY_MAX_JOBS=2
# Hobby pattern: minute and hour fields must both be plain integers
# (no `*`, `/`, `,`, `-`). Cron format: "M H DOM MON DOW".
HOBBY_PATTERN_OK='^[0-9]+ [0-9]+ '

# ─── Parse + classify ────────────────────────────────────────────
# Use while-read instead of mapfile for bash 3.2 (macOS) compatibility.
CRONS=()
while IFS= read -r line; do
  CRONS+=("$line")
done < <(python3 -c "
import json
d = json.load(open('$VERCEL_JSON'))
for c in d.get('crons', []):
    print(f\"{c['path']}|{c['schedule']}\")
")

CRON_COUNT="${#CRONS[@]}"
VIOLATIONS=0

# ─── Header ──────────────────────────────────────────────────────
echo -e "${BOLD}═══════════════════════════════════════${RESET}"
echo -e "${BOLD}LegacyLoop · Vercel Cron Plan Validator${RESET}"
echo -e "${BOLD}═══════════════════════════════════════${RESET}"
echo -e "Plan tier:     ${BOLD}$PLAN${RESET} (source: $PLAN_SOURCE)"
echo -e "vercel.json:   $CRON_COUNT cron entries"
echo ""

# ─── Per-cron validation ─────────────────────────────────────────
for line in "${CRONS[@]}"; do
  IFS='|' read -r path schedule <<< "$line"
  fail_reason=""

  case "$PLAN" in
    hobby)
      if ! [[ "$schedule" =~ $HOBBY_PATTERN_OK ]]; then
        fail_reason="exceeds Hobby 1/day limit (uses */N · wildcard · or list in minute/hour)"
      fi
      ;;
    pro|enterprise)
      # Pro + Enterprise accept all standard cron patterns
      :
      ;;
  esac

  if [ -n "$fail_reason" ]; then
    VIOLATIONS=$((VIOLATIONS + 1))
    printf "  ${RED}✗${RESET} %-45s %-15s ${RED}FAIL${RESET}: %s\n" "$path" "$schedule" "$fail_reason"
  else
    printf "  ${GREEN}✓${RESET} %-45s %-15s\n" "$path" "$schedule"
  fi
done

# ─── Plan-level checks ───────────────────────────────────────────
if [ "$PLAN" = "hobby" ] && [ "$CRON_COUNT" -gt "$HOBBY_MAX_JOBS" ]; then
  echo ""
  echo -e "  ${RED}⚠${RESET} Total cron count: $CRON_COUNT       ${RED}FAIL${RESET}: Hobby max $HOBBY_MAX_JOBS jobs"
  VIOLATIONS=$((VIOLATIONS + 1))
fi

# ─── Summary ─────────────────────────────────────────────────────
echo ""
if [ "$VIOLATIONS" -eq 0 ]; then
  echo -e "Validation:    ${GREEN}[PASS]${RESET} all $CRON_COUNT schedules within $PLAN plan limits"
  echo ""
  echo -e "Exit: ${GREEN}0 PASS${RESET}"
  exit 0
else
  echo -e "Validation:    ${RED}[FAIL]${RESET} $VIOLATIONS violations vs $PLAN plan limits"
  echo ""
  echo -e "Exit: ${RED}1 FAIL${RESET} · upgrade plan OR reduce schedule frequency"
  exit 1
fi
