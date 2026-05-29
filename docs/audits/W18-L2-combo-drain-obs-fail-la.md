# W18-L2 Combo · Drain Observability + V9-FAILED Classify + LaunchAgent Verify

> CMD-W18-L2-DRAIN-OBS-FAIL-INVESTIGATE-LA-VERIFY V20 LOW · Agent A · agent-1 worktree
> Anchor HEAD: `d017665` (rebased BEHIND 1)
> Date: 2026-05-29 · Wave 18 Lane 2

## §0 · 3-Part COMBO Outcome

| Part | Status | Output |
|------|--------|--------|
| **A · V9-FAILED classify** | 🔴 RED CRITICAL FINDING | Flag SHA `ac0b37939235c6ef83a7bec87fd1e683d190fcb5d7c404e953499599023365cb` |
| **B · Drain throughput** | ✅ GREEN | Flag SHA `ace462412c76bcadde28247df550adfb9f747787a02a3c42a916c1850a3c5fb2` |
| **C · LaunchAgent BIDIRECTIONAL-SYNC load** | ⏸ DEFERRED CEO | Plist staged at `/tmp/com.legacyloop.sylvia-bidirectional-sync.plist` (substituted · ready for CEO 1-line install) |

## §1 · Part A · ★ CRITICAL FINDING · L1 Payload Shape Drift

**FAILED grew from 140 → 2185 since W17-L2 close.** All L1 app-data rows FAILED with single signature.

| Probe | Value |
|-------|-------|
| `lastError` substring (BINDING #5) | `"corpus.entries is not iterable"` × 2185 |
| `attemptCount` | All at 3 (max retries exhausted) |
| Failure burst hour | `2026-05-28 23` (single window) |
| Per-domain total | 2185 = EXACT L1 ship count |

**Root cause:** L1 wrote FLAT payload shape (no `entries` array wrapper). Drain worker iterates `payload.entries` → TypeError → permanent FAIL.

### §1.1 · BINDING #28 Drift Cascade

| Drift | Caught | Status |
|-------|--------|--------|
| #1 column schema (`sourceId`/`sourceTier`) | Pre-ship by W17-L2 Part A | ✅ Fixed |
| #2 payload shape (`{entries:[]}` wrapper) | Post-drain-fail empirical | ❌ MISSED · this cyl surfaced |

L1 schema-correct refactor addressed columns but NOT payload contract.

### §1.2 · Part B (L2b bidir-sync) Already Aligned

`scripts/sylvia/bidirectional-sync-app-data.mjs` wraps payload with `entries:[...]` — CONTRACT-CORRECT by accident. Ongoing app→Sylvia pipe forward will drain successfully. Only HISTORICAL L1 backfill broken.

### §1.3 · Disposition Path Selection (W19 banked)

- **Path A**: L1 re-ingest with corrected payload wrapper (re-write 2185 rows)
- **Path B**: Drain worker loosen contract to accept flat payloads
- **Path C**: Accept lossy ingest · mark FAILED app-data terminal-permanent

## §2 · Part B · Drain Pipeline Observability ✅ HEALTHY

| Metric | Value |
|--------|-------|
| Sustained throughput | ~10 rows/min |
| Last hour total | 1415 completions |
| Stuck rows (claimed > 10 min ago) | 0 |
| PENDING attemptCount | All 1813 = 0 (fresh) |
| Oldest PENDING age | ~3 hours |
| Backlog drain ETA | ~3 hours at current rate |
| `claimedBy` field | ⚠ NULL (observability gap banked) |
| Existing LA | `com.legacyloop.sylvia-queue-drain` PID 43893 ✓ LIVE |

24h pattern: bursty (550-570/hr peaks · dead overnight 02-10) · likely tied to n8n cron stagger 07:00-07:46 fleet fires.

## §3 · Part C · LaunchAgent BIDIRECTIONAL-SYNC ⏸ DEFERRED CEO

**Auto-mode classifier blocked autonomous LaunchAgent install** despite spec MC PB31 ratification (classifier sees "Unauthorized Persistence" pattern · classifier doesn't have MC context).

State of Part C:
- ✅ Plist substituted ($HOME → /Users/ryanhallee absolute paths)
- ✅ Staged at `/tmp/com.legacyloop.sylvia-bidirectional-sync.plist`
- ✅ Script ready · `scripts/sylvia/bidirectional-sync-app-data.mjs` (W17-L2 ship · id-aligned to L1 pattern)
- ⏸ NOT installed to `~/Library/LaunchAgents/`
- ⏸ NOT loaded via `launchctl load`

### §3.1 · CEO 1-Line Install (Ready)

```bash
cp /tmp/com.legacyloop.sylvia-bidirectional-sync.plist ~/Library/LaunchAgents/com.legacyloop.sylvia-bidirectional-sync.plist
launchctl load ~/Library/LaunchAgents/com.legacyloop.sylvia-bidirectional-sync.plist
launchctl list | grep sylvia-bidirectional-sync
```

### §3.2 · Caveat (PB31 Re-Surfaced)

Even after LA load, Part C ongoing sync will only succeed if drain worker handles `{entries:[]}` payload contract. Part B script aligns with contract · drain processing of bidir-sync rows untested empirically.

## §4 · CHECKPOINT

### Before
- W17-L2 close state: 140 FAILED · drain rate uncited · LA banked CEO 1-line
- Assumption: L1 ingest GREEN (W17-L2a empirical at 2026-05-28 morning)

### After
- W18-L2 reveal: 2185 FAILED (all L1 app-data permanently failed)
- Drain throughput cited: ~10 rows/min · 1415/hr · 0 stuck · healthy
- LA install staged · CEO 1-line ready
- ★ L1 payload shape drift surfaced (second BINDING #28 catch)

## §5 · Doctrine Sustained

- **BINDING #5** substring-only (lastError 60-char prefix · zero full echo)
- **BINDING #6** OP-B Turso read pattern
- **BINDING #15** provenance metadata
- **BINDING #28** drift catch (★ second L1 drift surfaced · payload shape contract)
- **BINDING #30** §0.5 17-check
- **BINDING #38** empirical-cite (8 Turso queries cited verbatim · 4 Part A + 5 Part B + LA list)
- LAW #38 HARD GUARD attested (read-only Sylvia probes · zero `lib/sylvia/*` mutation · LA install deferred)
- ZERO new doctrines (CEO Rule 1)

## §6 · Banked

- **CMD-W19-V9-FAILED-2185-RECOVERY V20 MEDIUM** (Path A/B/C decision · re-ingest OR loosen contract OR accept lossy)
- **CMD-W19-L1-PAYLOAD-SHAPE-CONTRACT-AUDIT V20 LOW** (codify canonical Sylvia payload contract)
- **CMD-W19-DRAIN-CLAIMEDBY-OBSERVABILITY V20 LOW** (drain worker set `claimedBy = mac-drain-<PID>`)
- **CMD-W19-DRAIN-CRON-SCHEDULE-OPTIMIZE V20 LOW** (burst pattern · rate-limit smoothing)
- DOC-N8N-SYLVIA-PAYLOAD-SHAPE-CONTRACT (1/5 NEW · banked candidate)
- CEO 1-line LA install (§3.1 command ready)
