# W24-L2 · Sylvia Memory Table Recovery
**Date:** 2026-05-30 · **Lane:** Track A · Wave 24 · Lane 2 · **Agent:** A (agent-1)
**Spec:** CMD-W24-L2-SYLVIA-MEMORY-TABLE-RECOVERY V20 MED
**Status:** 🟢 GREEN

---

## Root Cause

`prisma/schema.prisma` defines `model SylviaMemory` (L1302) and `model SylviaEpisodic` (L1368).
The `sylvia_episodic` migration at `prisma/migrations/20260520004833_add_sylvia_episodic_and_queue/`
declares the `sylvia_episodic` table with a FOREIGN KEY pointing to `sylvia_memory(id)` — but the
`sylvia_memory` table itself was **never** migrated. Result: schema model exists in Prisma client,
but Turso prod has no underlying table. Every `sylvia_episodic` write that exercised the FK
resolution failed → JSONL fallback at `sylvia-data/audit/episodic-YYYY-MM-DD.jsonl`.

BINDING #6 dev/prod isolation: `prisma db push` runs against `dev.db` only and is libsql-incompatible
for Turso prod. Prod table creation must use `@libsql/client` + `node --env-file=.env` (R22.5 OP-B).

---

## Empirical Findings (§0.5 BINDING #30)

| Probe | Result |
|---|---|
| `model SylviaMemory` in schema | PRESENT (L1302) |
| `model SylviaEpisodic` in schema | PRESENT (L1368) |
| `sylvia_memory` migration CREATE TABLE | **MISSING** — never authored |
| Turso prod `sylvia_memory` table (pre-FIX) | ABSENT |
| Turso prod `sylvia_episodic` table (pre-FIX) | PRESENT |
| Turso prod `sylvia_corpus_queue` table | PRESENT |
| JSONL fallback files | 12 (dates 2026-05-18 … 2026-05-30) |
| JSONL total rows | **12,072** (spec cited 10,173; grew through 5/30) |

---

## Recovery Actions

### FIX 2 — Turso PROD table create (CEO STOP-gate `prod table create OK`)

Script: `scripts/sylvia/create-sylvia-memory-table.mjs` · idempotent (CREATE TABLE / INDEX
IF NOT EXISTS) · matches `model SylviaMemory` schema exactly · 8 indices.

Output:
```
Verify: sylvia_memory PRESENT ✓
Verify: indices created = 8/8
```

Post-FIX Turso prod has `sylvia_memory` + 8 indices + existing `sylvia_episodic` (+ FK
constraint now resolvable) + `sylvia_corpus_queue`.

### FIX 3 — Idempotent JSONL replay (CEO STOP-gate `replay OK`)

Script: `scripts/sylvia/replay-episodic-jsonl.mjs` · deterministic id = `"rpl_" + sha256(timestamp|sessionId|eventType|payload|source).slice(0,25)`
→ `INSERT OR IGNORE` = idempotent and re-runnable.

Counts:
```
total rows scanned:     12072
accepted (inserted):    12072
skipped_duplicate:      0
rejected_malformed:     0
reconciliation:         12072/12072 ✓
```

No silent drop (W22-L1 doctrine). Every JSONL row routed to accepted | skipped_duplicate |
rejected_malformed; sum reconciles to total scanned.

### FIX 4 — Fresh write verification (CEO STOP-gate `sentinel OK`)

Script: `scripts/sylvia/verify-fresh-episodic-write.mjs` · inserts one sentinel row tagged
`eventType='w24_l2_verify'` · reads it back · cites round-trip.

Output:
```
Inserting sentinel row id=vfy_mpsec1dl3y2tx2ij sessionId=w24-l2-verify
  rowsAffected: 1
Round-trip ✓
Total sylvia_episodic rows in Turso prod: 12530
Sentinel rows (w24_l2_verify): 1
```

Post-FIX total = 12,530 (12,072 replayed + 457 pre-existing prod rows + 1 sentinel).

---

## Files Added (commit scope)

| Path | Purpose |
|---|---|
| `scripts/sylvia/probe-turso-tables.mjs` | Read-only Turso table existence probe |
| `scripts/sylvia/create-sylvia-memory-table.mjs` | Idempotent CREATE TABLE (FIX 2) |
| `scripts/sylvia/replay-episodic-jsonl.mjs` | Idempotent JSONL replay (FIX 3) |
| `scripts/sylvia/verify-fresh-episodic-write.mjs` | Sentinel round-trip (FIX 4) |
| `docs/audits/W24-L2-sylvia-memory-recovery.md` | This audit |

**No schema edit.** Model pre-existed; only Turso DDL + DML.

---

## Doctrine

| BINDING | Applied |
|---|---|
| #6 DEV-PROD-DB-ISOLATION | OP-B libsql + `node --env-file=.env.turso.tmp` (creds pulled via `vercel env pull` to gitignored temp · deleted post-FIX) |
| #17 AUDIT-FIRST-WIRE | empirical probe before write — schema confirmed, Turso state confirmed |
| #28 DRIFT-CATCH | spec cited 10,173 rows; empirical 12,072 (grew through 5/30) — cited |
| #30 §0.5 DEEP-DIVE GATE | schema · Turso probe · memory.ts:323 · JSONL count |
| #31 PUSHBACK-WITH-REPLACEMENT | n/a (spec correct) |
| W22-L1 NO-SILENT-DROP | reconciliation 12072/12072 ✓ (accepted+skipped+rejected = total) |
| #21 VERIFY-VERCEL | Vercel `dpl_<id>` cited in §12 commit |

---

## Flags

- **Root-cause doctrine reinforce:** dev-side `prisma migrate` runs left `sylvia_memory` missing
  from Turso because the original P72 schema add never created a CREATE TABLE migration for it
  (only the `sylvia_episodic` migration which referenced it via FK). BINDING #6 reinforced —
  every new model must run prod create via libsql OP-B or be paired with a prod migration file.
- **Worktree build quirk (FLAG-RIDER):** agent-1 worktree `npm run build` fails with
  `TurbopackInternalError: Symlink sylvia-data/audit/episodic-2026-05-18.jsonl is invalid, it
  points out of the filesystem root` because `sylvia-data/` is a symlink to the main worktree's
  `sylvia-data/`, putting JSONL files outside agent-1 filesystem root. **Main worktree build at
  same HEAD (3c01d62) PASSES** — canonical build evidence. Quirk pre-exists W24-L2 (symlink
  dated 2026-05-16). Bank for worktree-pattern doctrine refinement.
- **Credentials hygiene:** `.env.turso.tmp` (Turso prod creds) pulled to gitignored temp,
  deleted from both worktrees post-FIX (BINDING #5 + #9). No creds in git, transcript, or
  remaining on disk.

---

## Acceptance

- [x] `sylvia_memory` PRESENT in Turso prod
- [x] `sylvia_episodic` PRESENT in Turso prod
- [x] 12,072 JSONL rows replayed (accepted) · 0 rejected · 0 silent drop
- [x] Fresh sentinel write round-trip ✓
- [x] §0.5 PASS
- [x] Schema unchanged (model pre-existing)
- [x] No Sylvia-v2 touch · no fb-army/ · no rotation/ · no app/

**Connecting Generations · Built in Maine · World-class everywhere.**
