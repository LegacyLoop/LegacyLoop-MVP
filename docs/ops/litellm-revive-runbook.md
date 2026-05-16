# LiteLLM Daemon · Revive + Forensics Runbook

> **Cylinder:** CMD-LITELLM-DAEMON-REVIVE-AND-HARDEN V20 v2.1 R29 P77 · Wave 16 Slot A
> **Audience:** CEO + IT · macOS operator-class
> **Last revised:** 2026-05-16 PM
> **Daemon label:** `com.legacyloop.litellm`
> **Watchdog label:** `com.legacyloop.litellm-watchdog`
> **Gateway URL:** http://localhost:8000

---

## §1 · Symptom Recognition

| Symptom | Diagnosis |
|---|---|
| `curl localhost:8000/v1/models` returns HTTP 000 / connection-refused | Daemon DOWN · TCP not bound · revive |
| `curl localhost:8000/v1/models` returns HTTP 000 / TIMEOUT (5s+ hang) | Daemon HUNG · listener open but uvicorn unresponsive · kickstart -k |
| `launchctl print gui/$(id -u)/com.legacyloop.litellm` shows `state = xpcproxy` for >30s | Stuck in spawn · bootout + bootstrap fresh |
| `scripts/agent-ship.sh` fails preflight HTTP $STATUS | Watchdog should be auto-fixing · check watchdog log |
| 3 consecutive ships using `SKIP_LITELLM_PREFLIGHT=1` override | Operational debt · run this runbook |

---

## §2 · Revive Ladder (escalating)

### Tier 1 · Kickstart (fastest · keeps service)

```bash
launchctl kickstart -k "gui/$(id -u)/com.legacyloop.litellm"
sleep 30
curl -sL --max-time 8 -o /dev/null -w "HTTP=%{http_code}\n" http://localhost:8000/v1/models
```

Wait up to 60s for first-load (model_list initialization + provider client probes).

### Tier 2 · Bootout + Bootstrap (cold restart · clears xpcproxy state)

```bash
launchctl bootout "gui/$(id -u)/com.legacyloop.litellm" || true
sleep 5
launchctl bootstrap "gui/$(id -u)" ~/Library/LaunchAgents/com.legacyloop.litellm.plist
sleep 45
curl -sL --max-time 8 -o /dev/null -w "HTTP=%{http_code}\n" http://localhost:8000/v1/models
```

### Tier 3 · Force-kill all + bootstrap (nuclear · use if Tier 1+2 fail)

```bash
launchctl bootout "gui/$(id -u)/com.legacyloop.litellm" 2>/dev/null || true
sleep 3
pkill -9 -f "scripts/litellm-dev.sh" 2>/dev/null || true
pkill -9 -f "litellm.*--config" 2>/dev/null || true
sleep 5
launchctl bootstrap "gui/$(id -u)" ~/Library/LaunchAgents/com.legacyloop.litellm.plist
sleep 60
curl -sL --max-time 10 http://localhost:8000/v1/models | head -c 200
```

### Tier 4 · CEO triage · escalate

If Tier 3 fails (HTTP 000 after 90s+ wait · or wrapper script hangs):
- Check pip env: `pip3 show litellm` (may need `pipx inject` if pkg-isolated)
- Check version: `litellm --version` (may have auto-updated · upstream breaking change)
- Check config: `python3 -c "import yaml; yaml.safe_load(open('litellm_config.yaml'))"` (yaml validates)
- Run direct foreground with debug:
  ```bash
  LITELLM_LOG=DEBUG litellm --config litellm_config.yaml --port 8000 2>&1 | tee /tmp/litellm-debug.log
  ```
  Watch for hang point in debug output. Common hangs:
  - Telemetry probe to BerriAI cloud (set `LITELLM_TELEMETRY=False`)
  - Provider client init (one key invalid · check `.env.local` for OPENAI/ANTHROPIC/GEMINI/XAI/PERPLEXITY)
  - Pyroscope profiling (`LITELLM_ENABLE_PYROSCOPE=false` is default · should not hang)

---

## §3 · Crash Forensics

### Log locations (post-P77 · persistent)

| Path | Source |
|---|---|
| `~/.legacyloop/logs/litellm-out.log` | wrapper script stdout + uvicorn startup logs |
| `~/.legacyloop/logs/litellm-err.log` | wrapper script stderr + perl-alarm pkill timeouts |
| `~/.legacyloop/logs/litellm-watchdog.log` | watchdog revive cycle log |
| `~/.legacyloop/logs/watchdog-out.log` | watchdog stdout |
| `~/.legacyloop/logs/watchdog-err.log` | watchdog stderr |
| `/tmp/litellm-launchd.{log,err}` | LEGACY pre-P77 paths (cleared on reboot · banked for purge) |

### Decode launchctl exit codes

```bash
launchctl list | grep litellm
# Format: PID  EXIT_CODE  LABEL
# EXIT_CODE meanings:
#   0     → daemon running healthy
#   -15   → killed by SIGTERM (graceful · KeepAlive will revive)
#   -9    → killed by SIGKILL (force · scripts/manual intervention)
#   1     → exited with error (check err log)
#   78    → ENOPKG · config file not found · check litellm_config.yaml path
```

### Common crash signatures

| Pattern in err log | Cause | Fix |
|---|---|---|
| `Alarm clock: 14` | perl-alarm fired on hung pkill | Expected · pkill stale-proxy step hangs · alarm self-heals |
| `ModuleNotFoundError: No module named 'X'` | pip pkg missing in venv | `pipx inject graphifyy <pkg>` OR `pip3 install --user X` |
| `OSError: [Errno 48] Address already in use` | port 8000 taken | check `lsof -iTCP:8000` · kill other listener |
| `KeyError: 'OPENAI_API_KEY'` | env var not exported by wrapper | check `.env.local` has key · verify wrapper regex line 59 |
| `Connection refused` to provider | network · BerriAI cloud · API key invalid | check provider key validity |

---

## §4 · Version Pin Verification

LiteLLM CLI auto-updates can introduce breaking changes. To pin:

```bash
# Find current version
litellm --version
# Pin via pip
pip3 install --user --upgrade --force-reinstall litellm==<pinned-version>
# Verify
which litellm
litellm --version
```

Banked: CMD-LITELLM-VERSION-PIN-CY-N V20 LOW (quarterly version probe + pin update review).

---

## §5 · Watchdog Behavior

Watchdog runs every 30s via `com.legacyloop.litellm-watchdog`:
- Probes `http://localhost:8000/v1/models` (5s timeout)
- If HTTP 200 → no action (healthy)
- If HTTP 000/refused → `launchctl kickstart -k` revive
- Max 3 retries/hr (rolling 3600s window via epoch file)
- If max exceeded → exits with code 2 + logs "MAX retries exceeded · CEO triage needed"

### Manual watchdog test

```bash
# Kill daemon · watchdog should auto-revive within 30s
kill -9 $(launchctl list | grep "com.legacyloop.litellm$" | awk '{print $1}')
# Wait 60s · probe
sleep 60
curl -sL --max-time 8 -o /dev/null -w "HTTP=%{http_code}\n" http://localhost:8000/v1/models
# Check watchdog log
tail -20 ~/.legacyloop/logs/litellm-watchdog.log
```

### Disable watchdog (temporary · for intentional dev-mode downtime)

```bash
launchctl bootout "gui/$(id -u)/com.legacyloop.litellm-watchdog"
```

Re-enable:
```bash
launchctl bootstrap "gui/$(id -u)" ~/Library/LaunchAgents/com.legacyloop.litellm-watchdog.plist
```

### Reset retry counter

```bash
rm -f ~/.legacyloop/litellm-watchdog-retries.txt
```

---

## §6 · Escalation to CEO

If watchdog max-retries (3/hr) hit OR Tier 3 nuclear restart fails:

1. **Cite recent err log:** `tail -50 ~/.legacyloop/logs/litellm-err.log`
2. **Cite watchdog log:** `tail -20 ~/.legacyloop/logs/litellm-watchdog.log`
3. **Cite process state:** `ps auxww | grep -iE "litellm|xpcproxy.*legacyloop" | grep -v grep`
4. **Route to CEO:** Slack STATUS or direct chat with above 3 cites
5. **Workaround:** `SKIP_LITELLM_PREFLIGHT=1 bash scripts/agent-ship.sh` (temporary · until daemon revived)

---

## §7 · Cross-references

- **Daemon plist:** `~/Library/LaunchAgents/com.legacyloop.litellm.plist` (P77 hardened · ThrottleInterval=15 · ExitTimeOut=30 · persistent logs)
- **Watchdog plist:** `~/Library/LaunchAgents/com.legacyloop.litellm-watchdog.plist` (P77 NEW · 30s StartInterval)
- **Watchdog script:** `scripts/litellm-watchdog.sh` (P77 NEW · max 3 retries/hr)
- **Wrapper script:** `scripts/litellm-dev.sh` (P12 Bash 3.2 fix + P77 perl-alarm pkill timeout)
- **Config:** `litellm_config.yaml` (11 model aliases · 4894 B)
- **Preflight gate:** `scripts/agent-ship.sh:preflight_litellm_check` (P71 · SKIP via SKIP_LITELLM_PREFLIGHT=1)
- **Doctrine:** BINDING #34 widened cite · BINDING #25 budget cap · DOC-LITELLM-LIVENESS-FLAP-AWARE-PROBE 1/5 candidate

---

*Authored 2026-05-16 PM · IT execute · Devin L2 spec · main worktree*
