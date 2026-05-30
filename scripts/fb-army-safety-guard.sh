#!/usr/bin/env bash
# CMD-W24-L1 · FB-Army Meta-Safety · CI/local World-A grep guard
# Fails (exit 1) if fb-army/ contains ANY World-A reference.
# Mirrors WORLD_A_MODULE_FRAGMENTS + WORLD_A_HOSTS + WORLD_A_ENV_KEYS from
# lib/fb-army-safety/isolation.ts (keep in sync · CI catches drift).

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TARGET_DIR="${REPO_ROOT}/fb-army"

if [ ! -d "$TARGET_DIR" ]; then
  echo "fb-army/ absent · nothing to scan · PASS"
  exit 0
fi

# World-A patterns · grep -E alternation
WORLD_A_PATTERNS='meta-graph|meta_graph|meta-dev|meta_dev|lib/adapters/meta|lib/meta-graph|graph\.facebook\.com|graph\.instagram\.com|graph\.threads\.net|developers\.facebook\.com|META_APP_SECRET|META_APP_ID|META_DEV_ACCESS_TOKEN|META_GRAPH_TOKEN|FB_APP_SECRET|FB_APP_ID|FB_GRAPH_TOKEN|FACEBOOK_APP_SECRET|FACEBOOK_GRAPH_TOKEN|FACEBOOK_OAUTH_TOKEN'

# Scan fb-army/ for any of the above (exclude node_modules + .git)
HITS=$(
  grep -rEn \
    --include='*.ts' --include='*.tsx' --include='*.js' --include='*.mjs' --include='*.json' --include='*.md' --include='*.yml' --include='*.yaml' \
    --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=dist --exclude-dir=build \
    "$WORLD_A_PATTERNS" \
    "$TARGET_DIR" || true
)

# Allowlist: lines that mention World-A symbols ONLY to enforce the firewall
# (the deny-list arrays inside proxy-egress.ts + documentation in README.md).
# Each allowlisted line MUST include the marker token `META-SAFETY-ALLOWLIST`
# OR be one of the well-known files below. Going forward, prefer the marker.
FILTERED=$(echo "$HITS" \
  | grep -v 'META-SAFETY-ALLOWLIST' \
  | grep -v 'proxy-egress.ts.*FORBIDDEN_KEYS' \
  | grep -v 'proxy-egress.ts.*"META_APP_SECRET"' \
  | grep -v 'proxy-egress.ts.*"FB_APP_SECRET"' \
  | grep -v 'proxy-egress.ts.*"FACEBOOK_GRAPH_TOKEN"' \
  | grep -v 'proxy-egress.ts.*"META_DEV_ACCESS_TOKEN"' \
  | grep -v 'proxy-egress.ts.*World-A or Meta-dev-account' \
  | grep -v 'proxy-egress.ts.*World-A env present' \
  | grep -v 'README.md.*World A firewall.*MUST NEVER reference' \
  | grep -v 'README.md.*No Graph API.*headless browser only' \
  || true)

if [ -n "$FILTERED" ]; then
  echo "❌ World-A references found in fb-army/ — Meta-safety law violation:"
  echo "$FILTERED"
  exit 1
fi

echo "✅ fb-army/ World-A grep guard PASS · zero forbidden references"
exit 0
