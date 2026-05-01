#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════
# sudo TouchID Enabler · DEV ONLY · LegacyLoop
# ═══════════════════════════════════════════════════════════════
# Adds `auth sufficient pam_tid.so` to /etc/pam.d/sudo so macOS
# accepts TouchID for sudo authentication. Eliminates the need to
# type the admin password (and the risk of pasting it into chat
# transcripts · DOC-BAN-PASSWORD-PASTE candidate #9 · solves the
# Apr 30 EOD password-paste-in-transcript pain).
#
# This script is the SOLUTION to the password-paste problem:
#   - Ryan runs `sudo bash scripts/setup-touchid.sh` at his terminal
#   - sudo prompt happens at the terminal · NEVER in chat
#   - assistant never sees the password · never echoes · never logs
#   - after this runs once, all future sudo invocations on this Mac
#     accept TouchID instead of password
#
# Behavior:
#   1. Refuses to run if not invoked as root (`sudo` required)
#   2. Idempotent · re-running detects pam_tid.so already present and
#      exits cleanly with status 0 · safe to run multiple times
#   3. Creates timestamped backup at /etc/pam.d/sudo.backup-<epoch>
#      before any edit · single-command rollback
#   4. Inserts pam_tid.so as the FIRST auth line (Apple-canonical
#      placement · before pam_smartcard.so per Apple docs)
#   5. Preserves file permissions (444 root:wheel · macOS canonical)
#   6. Verifies pam_tid.so present after edit · refuses to exit
#      success if write failed
# ═══════════════════════════════════════════════════════════════
# Usage:
#   sudo bash scripts/setup-touchid.sh
#
# Verify post-run (Ryan-side at terminal):
#   sudo -K          # invalidate cached sudo creds
#   sudo true        # should prompt TouchID instead of password
#
# Rollback (single command · timestamp from script output):
#   sudo install -m 0444 -o root -g wheel \
#     /etc/pam.d/sudo.backup-<epoch> /etc/pam.d/sudo
# ═══════════════════════════════════════════════════════════════

set -euo pipefail

PAM_FILE="/etc/pam.d/sudo"
PAM_LINE="auth       sufficient     pam_tid.so"
BACKUP="${PAM_FILE}.backup-$(date +%s)"
TMP_FILE="$(mktemp -t setup-touchid.XXXXXX)"
trap 'rm -f "$TMP_FILE"' EXIT

# 1. Must run as root (sudo required · script does NOT invoke sudo
#    itself · Ryan invokes the script with sudo at terminal)
if [ "$(id -u)" != "0" ]; then
  echo "[setup-touchid] ERROR: must run as root" >&2
  echo "[setup-touchid]   Run: sudo bash scripts/setup-touchid.sh" >&2
  echo "[setup-touchid]   sudo prompt happens at YOUR terminal · never paste password to assistant" >&2
  exit 1
fi

# 2. PAM file must exist (sanity · macOS-only)
if [ ! -f "$PAM_FILE" ]; then
  echo "[setup-touchid] ERROR: $PAM_FILE not found · is this macOS?" >&2
  exit 1
fi

# 3. Idempotency check · pam_tid.so already configured · exit clean
if grep -qE '^auth[[:space:]]+sufficient[[:space:]]+pam_tid\.so' "$PAM_FILE"; then
  echo "[setup-touchid] pam_tid.so already present in $PAM_FILE · TouchID for sudo already enabled"
  echo "[setup-touchid] No changes made · exit 0 (idempotent)"
  exit 0
fi

# 4. Create timestamped backup BEFORE any edit
cp -p "$PAM_FILE" "$BACKUP"
echo "[setup-touchid] Backup created: $BACKUP"

# 5. Build new file content with pam_tid.so inserted as FIRST auth line
#    awk inserts the line before the first existing `auth` line · all
#    other lines preserved verbatim
awk -v new_line="$PAM_LINE" '
  !inserted && /^auth/ {
    print new_line
    inserted = 1
  }
  { print }
' "$PAM_FILE" > "$TMP_FILE"

# 6. Sanity check: tmp file has pam_tid.so · refuse to proceed otherwise
if ! grep -qE '^auth[[:space:]]+sufficient[[:space:]]+pam_tid\.so' "$TMP_FILE"; then
  echo "[setup-touchid] ERROR: awk insertion failed · pam_tid.so not in temp file · aborting" >&2
  echo "[setup-touchid]   Backup preserved at: $BACKUP" >&2
  exit 1
fi

# 7. Atomic install · preserves canonical 0444 root:wheel permissions
install -m 0444 -o root -g wheel "$TMP_FILE" "$PAM_FILE"
echo "[setup-touchid] Installed updated $PAM_FILE (mode 0444 root:wheel)"

# 8. Post-edit verification · pam_tid.so MUST be present in final file
if ! grep -qE '^auth[[:space:]]+sufficient[[:space:]]+pam_tid\.so' "$PAM_FILE"; then
  echo "[setup-touchid] ERROR: post-edit verify FAILED · pam_tid.so not found in $PAM_FILE" >&2
  echo "[setup-touchid]   Restoring from backup: $BACKUP" >&2
  install -m 0444 -o root -g wheel "$BACKUP" "$PAM_FILE"
  exit 1
fi

echo "[setup-touchid] ✓ TouchID for sudo enabled"
echo "[setup-touchid]"
echo "[setup-touchid] Test (Ryan-side · at YOUR terminal):"
echo "[setup-touchid]   sudo -K          # invalidate cached creds"
echo "[setup-touchid]   sudo true        # should prompt TouchID"
echo "[setup-touchid]"
echo "[setup-touchid] Rollback if needed:"
echo "[setup-touchid]   sudo install -m 0444 -o root -g wheel $BACKUP $PAM_FILE"
echo "[setup-touchid]"
echo "[setup-touchid] DOC-BAN-PASSWORD-PASTE (#9 candidate) ratified · zero password"
echo "[setup-touchid]   transcript exposure required for future sudo workflows on this Mac"
