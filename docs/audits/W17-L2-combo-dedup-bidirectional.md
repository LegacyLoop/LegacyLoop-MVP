# W17-L2 Combo · DEDUP-PROVENANCE-VERIFY + BIDIRECTIONAL-SYNC

> CMD-W17-L2-APP-DATA-DEDUP-PROVENANCE-VERIFY + BIDIRECTIONAL-SYNC COMBO V20 LOW
> Agent A · agent-1 worktree · Wave 17 Lane 2
> Anchor HEAD: `0719506` (origin/main at fire time · rebased 6 commits)
> Date: 2026-05-28

## §0 · COMBO Scope

Part A (read-only): post-L1 dedup + provenance + PII safety audit · ship to flag surface.
Part B (write-only Sylvia): bidirectional sync script + LaunchAgent template · scaffold only · NOT loaded.

**LAW #38 HARD GUARD attested both parts.** Read-only Turso SELECT queries for Part A · write-only Sylvia INSERT for Part B (deferred until LaunchAgent load).

## §1 · Part A · Dedup + Provenance Verify

**Flag doc:** `~/Downloads/skills/Flags/W17_L2a_DEDUP_PROVENANCE_VERIFY.md`
**SHA:** `db8924bc8953f0a7735f76ea37b12f4e7e44cfe7f2e8aff02b9e1e85a7d38bde`

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

### §2.4 · Smoke Run Status

**SKIPPED per auto-mode discipline.** Live execution would write to production Turso · spec says "scaffold" with LaunchAgent NOT loaded. Syntax verified via `node --check` (passed). First real run triggered by CEO `launchctl load`.

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

## §4 · W17 Trio Status

| Lane | Status |
|------|--------|
| L1 transform-ingest | ⚠ NOT YET SHIPPED · stub schema mismatch caught by L2 audit |
| L2a dedup verify | ✓ deferred audit shipped (this cyl Part A) |
| L2b bidir-sync scaffold | ✓ shipped + LaunchAgent template banked (this cyl Part B) |

**W17 trio close BLOCKED on L1 ship.** L1 spec requires refactor to use real `sylvia_corpus_queue` schema (id PK + payload JSON + status). L2 outputs ready to validate L1 immediately after ship.

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
