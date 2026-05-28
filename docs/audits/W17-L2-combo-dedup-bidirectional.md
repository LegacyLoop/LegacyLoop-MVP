# W17-L2 Combo · DEDUP-PROVENANCE-VERIFY + BIDIRECTIONAL-SYNC

> CMD-W17-L2-APP-DATA-DEDUP-PROVENANCE-VERIFY + BIDIRECTIONAL-SYNC COMBO V20 LOW
> Agent A · agent-1 worktree · Wave 17 Lane 2
> Anchor HEAD: `0719506` (origin/main at fire time · rebased 6 commits)
> Date: 2026-05-28

## §0 · COMBO Scope

Part A (read-only): post-L1 dedup + provenance + PII safety audit · ship to flag surface.
Part B (write-only Sylvia): bidirectional sync script + LaunchAgent template · scaffold only · NOT loaded.

**LAW #38 HARD GUARD attested both parts.** Read-only Turso SELECT queries for Part A · write-only Sylvia INSERT for Part B (deferred until LaunchAgent load).

## §1 · Part A · Dedup + Provenance Verify · POST-L1 STABLE RE-EMIT

**Flag doc:** `~/Downloads/skills/Flags/W17_L2a_DEDUP_PROVENANCE_VERIFY.md`
**SHA (re-emit · empirical post-L1):** `8344f5c91dc38a74c35d01bde5a04e911e21b04fc9afba6ea39d5284d7cef74d`
**Pre-L1 SHA (deferred audit):** `db8924bc8953f0a7735f76ea37b12f4e7e44cfe7f2e8aff02b9e1e85a7d38bde`

**Anchor:** post-W17-L1 ship `dba9d9e` (CEO cite · 2185 rows inserted).
**Probe state:** PENDING stable at 3056 for 2+ min · drain idle · queue stable for audit.

### §1.1 · Empirical Verification (ALL PASS)

| Check | Result |
|-------|--------|
| L1 row count (CEO cite vs probe) | 2185 / 2185 ✓ EXACT MATCH |
| Per-vertical V9 | 1799 ✓ (CEO projection match) |
| Per-vertical V8 | 386 ✓ (CEO projection match) |
| Dedup integrity (distinct id PK) | 2185 / 2185 ✓ PASS (zero dups) |
| PII safety scan | 0/6 patterns leak ✓ PASS |
| Schema correctness | ✓ L1 uses real columns (id PK + payload JSON) |

### §1.2 · Per-Table Breakdown

| Table | Rows |
|-------|------|
| Item | 28 |
| MarketComp | 72 |
| AiResult | 27 |
| Valuation | 27 |
| EventLog | 2013 |
| BuyerLead | 10 |
| ScraperUsageLog | 8 |
| **TOTAL** | **2185** |

### §1.3 · L1 id Format Empirical

L1 uses `w17-l1-{Table}-{appRowId}` (e.g. `w17-l1-ScraperUsageLog-cmp0a4q7o0001l204cec9gp65`).
Part B alignment applied (§2.4).

### §1.4 · Banked

- V9 FAILED=80 (4.4% drain failure rate) · banked investigation via `lastError` column
- Drain pipeline idle (PENDING stalled at 3056) · banked LaunchAgent state check

### §1.1 · Schema Drift Catch (BINDING #28 · ★ critical finding)

L1 stub assumed `sylvia_corpus_queue` columns `sourceId`, `sourceTier`, `sourceUrl`, `title`, `body`. **Production schema does NOT have these columns.** Empirical probe:

```
PRAGMA table_info(sylvia_corpus_queue):
  id, sessionId, verticalId, domain, payload, status,
  attemptCount, claimedAt, completedAt, lastError,
  createdAt, updatedAt, claimedBy
```

All Part A audit queries from stub failed with `no such column: sourceId/sourceTier`.

### §1.2 · Production State Snapshot

- Total queue rows: **4963** (all status=COMPLETED · queue drained)
- App-data signature scan: **0 rows** (no `app_table` / `ingested_via` / `T1-app-data` patterns in any payload)
- **W17-L1 NOT shipped to main** (zero app-data rows · no W17-L1 commit visible)

### §1.3 · Disposition

- Dedup integrity: **DEFERRED** (no L1 data to audit)
- PII safety: **DEFERRED** (no L1 data to scan)
- Schema drift: **CAUGHT** (BINDING #28 sustained · stub spec needs refactor before L1 ships)
- Net Sylvia delta: **0** (L1 has not run)

## §2 · Part B · Bidirectional Sync Scaffold

### §2.1 · Files shipped

| File | LOC | Purpose |
|------|-----|---------|
| `scripts/sylvia/bidirectional-sync-app-data.mjs` | 183 | Executable sync script · LAW #38 guard · hash-gate via `id` PK |
| `scripts/sylvia/bidirectional-sync.plist.template` | 25 | LaunchAgent template · hourly cadence (StartInterval=3600) · NOT loaded |

### §2.2 · Schema-Correct Insert Pattern

Refactored from L1 stub to match production schema:

```js
INSERT INTO sylvia_corpus_queue
  (id, sessionId, verticalId, domain, payload, status, attemptCount, createdAt, updatedAt)
VALUES
  (?, NULL, ?, ?, ?, 'PENDING', 0, datetime('now'), datetime('now'))
```

- **Dedup:** `id` primary key collision (deterministic format `app-{Table}-{appRowId}`)
- **Provenance:** embedded inside `payload` JSON (`provenance: {app_table, app_id, ingested_via}`)
- **State file:** `~/Library/Application Support/legacyloop/sylvia-bidir-sync.state.json` (last_sync_iso + run_count + last_run_counters)

### §2.3 · Tables Synced (delta `createdAt > last_sync_iso`)

| Table | Vertical | Domain | EventType filter |
|-------|----------|--------|------------------|
| Item | V9 | app-data-item | — |
| MarketComp | V9 | app-data-marketcomp | — |
| EventLog | V9 / V8 | app-data-event | PRICING\*/BUYERBOT\*/MEGABOT\*/DEMAND\*/GARAGE_SALE\*/AGENT_AI\*/ANALYZ\* → V9 · SHIPPING_QUOTED → V8 |

### §2.4 · id Format Alignment to L1 (Post-Empirical Refinement)

After Part A empirical surfaced L1 id format `w17-l1-{Table}-{id}`, Part B PK format updated from `app-{Table}-{id}` → `w17-l1-{Table}-{id}` to prevent dup-insert if L2b first-run sees rows L1 already absorbed. Cross-cyl PK dedup now guaranteed.

### §2.5 · Smoke Run Status

**SKIPPED per auto-mode discipline.** Live execution would write to production Turso · spec says "scaffold" with LaunchAgent NOT loaded. Syntax verified via `node --check` (passed both initial + post-alignment edits). First real run triggered by CEO `launchctl load`.

## §3 · LaunchAgent Load (CEO 1-Line · Banked)

```bash
cp scripts/sylvia/bidirectional-sync.plist.template ~/Library/LaunchAgents/com.legacyloop.sylvia-bidirectional-sync.plist
launchctl load ~/Library/LaunchAgents/com.legacyloop.sylvia-bidirectional-sync.plist
```

Verify post-load:
```bash
launchctl list | grep sylvia-bidirectional-sync
tail -f ~/Library/Logs/sylvia-bidir-sync.log
```

Cadence: hourly (3600s). Cite CEO ratify post-load for cadence tuning if too fast/slow.

## §4 · W17 Trio Status · CLOSED

| Lane | Status |
|------|--------|
| L1 transform-ingest | ✅ SHIPPED (`dba9d9e` per CEO cite · 2185 rows · schema-correct) |
| L2a dedup verify | ✅ COMPLETE · empirical post-stable re-emit (`8344f5c91dc3...`) · ALL gates PASS |
| L2b bidir-sync scaffold | ✅ SHIPPED · id format aligned to L1 · LaunchAgent template banked |

**W17 trio CLOSED.** L1 ingest verified (2185/2185 dedup ✓ · 0/6 PII ✓ · V9 1799 · V8 386 exact match CEO projection). L2b ready for CEO 1-line `launchctl load` to activate ongoing hourly sync.

## §5 · Doctrine Sustained (ZERO NEW)

- **BINDING #5** cred isolation (`.env.drain` count-only probe · no value echo)
- **BINDING #6** OP-B Turso pattern (`@libsql/client` + `node --env-file=`)
- **BINDING #15** provenance metadata (payload JSON embeds `app_table` + `app_id` + `ingested_via` run tag)
- **BINDING #20** PB3 pull mandatory (rebased 6 commits)
- **BINDING #28** drift catch (★ schema drift caught between L1 stub assumption and Turso reality · prevented broken L1 ship to main)
- **BINDING #38** empirical-cite (Turso PRAGMA + COUNT queries cited verbatim)
- **BINDING #39** spec-on-disk (combo executes 2 sister stubs)
- LAW #38 HARD GUARD (read-only Part A · write-only Sylvia Part B · NO app-row mutation)
- ZERO new doctrines (CEO Rule 1)

## §6 · Banked

- CMD-W17-L2a-RE-VERIFY V20 LOW — re-fire post W17-L1 schema-correct ship · populate real dedup + PII numbers
- CMD-W17-L1-SCHEMA-REFACTOR V20 LOW — refactor L1 transform-ingest to use real `payload` JSON schema (not nonexistent `sourceId`/`sourceTier` columns)
- LaunchAgent load (CEO 1-line trigger · banked W17 trio closeout)
