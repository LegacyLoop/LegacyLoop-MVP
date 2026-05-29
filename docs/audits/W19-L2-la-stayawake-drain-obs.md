# W19-L2 · LA-INSTALL + STAY-AWAKE + DRAIN-OBSERVABILITY

> CMD-W19-L2-LA-INSTALL-STAYAWAKE-DRAIN-OBS V20 LOW · Agent A · agent-1 worktree
> Anchor HEAD: `bb12ef7` (post rebase from `d90a68c` · BEHIND 4 cleared)
> Date: 2026-05-29 · Wave 19 Lane 2

## §0 · §0.5 Deep-Dive Drift Catches (★ BINDING #28)

| Check | Spec said | Empirical | Action |
|-------|-----------|-----------|--------|
| stay-awake LA loaded | DOWN (not in launchctl list) | **LIVE** (PID 2413) | VERIFY-class skip · NO install needed |
| stay-awake plist exists | YES | YES (691b · Apr 30) | confirmed |
| /tmp bidir-sync plist | YES (1173b) | YES (1173b · May 29 10:02) | survived · no regen needed |
| drain L62-107 (COMPLETED + catch) | claimedBy NULL · no entries metric | confirmed L86 `claimedBy: null` · L66 ingest result discarded | FIX 1 target |
| W19-L1 cross-lane edit on drain | not edited | confirmed clean | safe to edit |

**§0.5 Verdict: PASS** (1 drift catch · stay-awake already LIVE · scope reduces to 1 LA install).

## §1 · FIX 1 · Drain Observability Metric (additive · scripts/sylvia-queue-drain.mjs)

**Changes (additive only · claim/batch/reclaim logic UNCHANGED):**

1. **Capture `graphIngestExternalCorpus` return** (`{ingested, community}`):
   ```js
   const ingestResult = await graphIngestExternalCorpus(payload);
   const ingested = ingestResult?.ingested ?? 0;
   ```

2. **Per-row silent-loss warning** when ingested=0:
   ```js
   if (ingested === 0) console.warn(`[sylvia-queue-drain] row=${row.id} ingested=0 (entries empty?)`);
   ```

3. **Per-row entries-written log**:
   ```js
   console.log(`[sylvia-queue-drain] row=${row.id} entries-written=${ingested}`);
   ```

4. **`claimedBy: WORKER_ID` on COMPLETED** (was `null` · L86): terminal attribution observable.

5. **Batch summary log** in `main()`:
   ```
   [sylvia-queue-drain] worker=<id> drained=N reclaimed=N written=sumIngested rowsWithIngested=N mismatch=N
   ```

6. **Silent-loss canary alert** when mismatch > 0:
   ```js
   if (mismatch > 0) console.warn(`★ SILENT-LOSS CANARY · mismatch=N of drained=N rows wrote 0 entries`);
   ```

7. **`entriesWritten` added to episodic payload** for observability hook downstream.

**Verification:**
- `node --check`: exit 0 ✓
- `git diff HEAD --name-only | grep -E "lib/sylvia/|transform-ingest"`: 0 hits ✓
- Claim/batch/reclaim logic untouched ✓

## §2 · FIX 2 · LaunchAgent Install (CEO 1-line · DEFERRED)

**stay-awake**: already LIVE PID 2413 · SKIP per §0.5 drift catch.

**bidir-sync**: staged `/tmp/com.legacyloop.sylvia-bidirectional-sync.plist` (1173b) · auto-mode classifier blocks autonomous load (BINDING #31 PB31 inline · DEFERRED-CEO).

### CEO 1-Line Install (run when ready)

```bash
cp /tmp/com.legacyloop.sylvia-bidirectional-sync.plist ~/Library/LaunchAgents/com.legacyloop.sylvia-bidirectional-sync.plist
launchctl load ~/Library/LaunchAgents/com.legacyloop.sylvia-bidirectional-sync.plist
launchctl list | grep sylvia-bidirectional-sync
```

**⚠ Cross-lane note**: bidir-sync ongoing success depends on W19-L1's envelope writer being contract-correct. Part B script already wraps `entries:[]` (W17-L2 alignment) · drain processing of bidir-sync output untested empirically (but contract matches drain expectation).

## §3 · Observability Outcomes

| Before | After |
|--------|-------|
| `claimedBy` set NULL on COMPLETED → no terminal attribution | `claimedBy: WORKER_ID` on COMPLETED → queryable per-worker |
| `graphIngestExternalCorpus` return discarded | `ingested` captured · logged per row · summed batch |
| Silent-loss invisible (2185 rows died unseen for ~24h) | mismatch counter exposes silent-loss next batch |
| Per-row entries written: not logged | `entries-written=N` logged per row |
| Inner fail-soft swallow (consumer-hooks L52-54) still silent | summary `mismatch=N` surfaces aggregate |

## §4 · Acceptance

- [x] drain metric additive · node --check 0 · claim/batch logic unchanged
- [x] stay-awake LIVE confirmed (already loaded · not re-installed)
- [ ] bidir-sync LIVE (post CEO 1-line)
- [x] /tmp plist present (1173b · no regen needed)
- [x] `lib/sylvia/*` diff=0 · Track A explicit · §0.5 PASS

## §5 · Doctrine Sustained

- BINDING #5 · #6 · #17 · #20 · #28 (★ drift catch · stay-awake state) · #30 (17-check) · #38 (empirical · 5 verifications cited)
- LAW #38 HARD GUARD attested (scripts/ + launchctl only · zero `lib/sylvia/*` mutation)
- ZERO new doctrines codified
- Candidate progression: **DOC-DRAIN-TERMINAL-ATTRIBUTION 1/5 NEW** (claimedBy on COMPLETED for queryability)

## §6 · Banked

- CMD-W19-DRAIN-CRON-OPTIMIZE V20 LOW (burst pattern · 02-10 dead window smoothing)
- DOC-DRAIN-TERMINAL-ATTRIBUTION ratify track (4 more clean applications → BINDING)
- bidir-sync first cron tick post-CEO-load verification (banked W20 if needed)
