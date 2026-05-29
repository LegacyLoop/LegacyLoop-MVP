# W19-L1 · Sylvia Recovery Path A · ★ Campaign-Close Blocker Closed

**CMD-W19-L1-SYLVIA-RECOVERY-PATH-A V20 LOW · Agent 1 MAIN worktree · 2026-05-29**
**Anchor:** MC ratified Path A · CEO greenlight FIX 2 · 2,185 W17-L1 silently-lost rows recovered

---

## §1 · Empirical Recovery

| Metric | Pre-rewrap | Post-rewrap | Delta |
|---|---|---|---|
| FAILED w/ `corpus.entries is not iterable` | **2,185** | **0** ✅ | -2,185 |
| W17-L1 sessionId COMPLETED | 0 | **160 (drain in progress)** | recovery validated |
| W17-L1 sessionId PENDING | 0 | 2,025 | draining async |
| Total COMPLETED | 7,418 | 7,688 (+270 at audit time) | drain processing |
| Status FAILED total | 2,185 | 0 ✅ | clean queue |

**Migration result:** `{ rewrapped: 2185, skipped_already: 0, parse_errors: 0, total_scanned: 2185 }` · idempotent re-run safe.

---

## §2 · Root Cause + Fix Class

**Root cause:** Producer/contract mismatch.
- `scripts/sylvia/transform-ingest-app-data.mjs` (W17-L1 ship) emitted flat payload `{title, condition, ...flat}`
- Drain consumer `lib/sylvia/graphify/consumer-hooks.ts:31` iterates `corpus.entries` per `ExternalCorpusEntry` contract
- All 2,185 W17-L1 rows died at attemptCount=3 with TypeError
- Sibling `scripts/sylvia/bidirectional-sync-app-data.mjs:80-88` already emits canonical envelope · proves correct shape in-repo

**Fix class:** Path A (writer-side fix + in-place re-wrap).
- Path B (drain-loosen) REJECTED — permissive drain masks next envelope drift, exact silent-loss class that caused this incident
- Writer + migration both clone canonical envelope from bidirectional-sync (BINDING #16 delegate-canonical)
- Drain + consumer contract preserved STRICT (LAW #38 HARD GUARD)

---

## §3 · Changes Shipped

### FIX 1 · Writer envelope (7 builders patched · `scripts/sylvia/transform-ingest-app-data.mjs`)
- Added `renderBody(flat)` helper · human-readable corpus body
- Added `buildEnvelope({id, vid, domain, flat})` helper · canonical shape from bidir-sync
- Patched all 7 builders: Item · MarketComp · AiResult · Valuation · EventLog · BuyerLead · ScraperUsageLog
- Each now emits `{source: 'scraper', corpusId: 'app-data-<vid>', domain, entries: [{id, title, body, metadata}]}`
- Note: spec said 6 builders · actual is 7 (ScraperUsageLog added W17-L1 schema-correction)
- `node --check`: PASS · zero syntax error

### FIX 2 · Migration (NEW · `scripts/sylvia/rewrap-failed-l1-payloads.mjs`)
- One-time recovery · idempotent (entries-wrapper guard)
- SELECT FAILED rows · parse flat payload · wrap in envelope · UPDATE payload + status='PENDING' + attemptCount=0 + clear lastError/claimedAt/claimedBy
- Executed against Turso prod: 2,185/2,185 rewrapped · 0 parse errors · 0 already-wrapped

### FIX 3 · Re-drain verify
- FAILED-sig immediately → 0 (status reset)
- W17-L1 COMPLETED rising (160 at audit time) · proves envelope contract validated end-to-end by drain consumer
- 2,025 W17-L1 PENDING draining at ~10 rows/min via sylvia-queue-drain LaunchAgent
- Projected full drain: ~3.5 hours (async · LaunchAgent cadence)

### FIX 4 · DOCTRINE_LEDGER append (`docs/DOCTRINE_LEDGER.md`)
- Group D NEW candidate codified: **DOC-SYLVIA-CORPUS-ENVELOPE-CONTRACT** (MERGE class)
- Convergent 3× independent catch (Agent A W18-L2 · Agent C W18-L4 · Devin W19-L1)
- 3/5 progressing · **LAW-grade ratify-recommended**

---

## §4 · BINDING #34 Widened Cite

- **(a) Commit SHA:** *(filled post-commit)*
- **(b) Vercel dpl:** N/A (scripts + Turso only · zero Vercel deploy)
- **(c) Turso verify:** `SELECT COUNT WHERE lastError LIKE 'corpus.entries%'` → 0 (verified post-migration · empirical)

---

## §5 · LAW #38 HARD GUARD Attestation

- ZERO `lib/sylvia/*` mutations (`git diff HEAD --name-only | grep "lib/sylvia/"` → 0 hits)
- ZERO `scripts/sylvia-queue-drain.mjs` mutations (W19-L2 surface)
- ZERO `prisma/schema.prisma` migrations
- ZERO app row writes
- Turso writes scoped exclusively to `sylvia_corpus_queue` rows WHERE FAILED + `corpus.entries` lastError signature
- Drain/consumer contract preserved STRICT (Path B rejected)

---

## §6 · Doctrine Sustained (ZERO NEW beyond ratified merge candidate · CEO Rule 1)

- BINDING #5 env shred (`/tmp/.env.vercel-prod` shredded + rm post-use)
- BINDING #6 OP-B Turso prod write via `@libsql/client` + `node --env-file=`
- BINDING #15 provenance preserved in metadata block per envelope entry
- BINDING #16 delegate-canonical (cloned bidirectional-sync envelope · zero reinvention)
- BINDING #17 audit-first wire (4 file reads pre-edit · contract verified)
- BINDING #20 main worktree direct-push (11+/5 LAW-READY post-W19-L1)
- BINDING #28 drift catch (§0.5 empirical re-verify · FAILED count + sig + per-vertical split confirmed pre-edit)
- BINDING #30 §0.5 17-check confirmed (all 5 §0.5 sub-checks PASS)
- BINDING #31 push-back-with-replacement (Path B rejected · Path A authored)
- BINDING #34 widened cite (a)(c) · (b) N/A
- BINDING #38 empirical-cite verbatim (rewrap counters cited · drain progression cited)
- BINDING #39 spec-on-disk
- ★ LAW #38 HARD GUARD attested · `lib/sylvia/*` diff=0
- CEO Rule 1 sustained · zero new doctrines authored beyond merge ratification
- CEO Rule 4 STOP-BEFORE-COMMIT honored (FIX 2 Turso write greenlight received)

---

## §7 · Carry-Forward

- Drain LaunchAgent processes 2,025 PENDING async (~3.5h projected to full COMPLETED)
- CY-N corpus-producer envelope scan (audit ALL writers/BPs for envelope compliance)
- CEO 1-line ratify DOC-SYLVIA-CORPUS-ENVELOPE-CONTRACT to LAW class (3× convergent · LAW-grade recommendation)
- MC honest-headline post-GREEN: +2,185 real (not phantom) substrate growth

---

## §8 · "+44% Sylvia" Headline · Made Real

Pre-W19-L1: +2,185 rows written · 0 ingested · phantom growth.
Post-W19-L1: +2,185 rows write-side correct envelope + +2,185 in-place re-wrapped · draining to COMPLETED · headline becomes real as drain completes.

Investor narrative locked: **"App-side scraper data → Sylvia substrate via canonical envelope contract · zero silent loss · billion-dollar audit trail."**
