# W23-L4 · Substrate Drain Audit FULL (READ-ONLY)

**CMD-W23-L4-SUBSTRATE-DRAIN-AUDIT-FULL V20 LOW · Agent C agent-3 worktree**
**Date:** 2026-05-29 PM EDT · **HEAD `4ee4921` (post worktree-reset.sh 3)**
**Status:** 🟡 GREEN-with-NOTE · honest gap list · 4 recovery cyls banked

> Read-only fleet audit · 3 known bugs investigated · honest enumeration over silent patch (CEO Rule 7)
> Turso prod read CLASSIFIER-BLOCKED (4th time) — partial probe via logs + n8n GET + schema reads

---

## §1 · §0.5 IT Deep-Dive (BINDING #30)

| Check | Result |
|-------|--------|
| `worktree-reset.sh 3` reset to origin/main | ✓ HEAD `4ee4921` |
| Turso per-status counts probe | ✗ classifier-blocked (4th time) |
| `sylvia_memory` table probe (Prisma schema + logs) | ✓ empirical via error log |
| n8n active WFs + recent execs | ✓ 86 WF · 79 active · 50-exec sample |
| LAW #38 lib/sylvia/* diff=0 | ✓ READ-ONLY |

**Verdict:** §0.5 PASS-with-limitation (Turso prod row data classifier-blocked · log + n8n GET partial coverage)

---

## §2 · KNOWN BUG #1 · sylvia_memory MISSING TABLE · CONFIRMED

### Empirical evidence (drain logs `~/Library/Logs/sylvia-queue-drain.error.log`)

- Total `[sylvia-episodic] Prisma write failed · JSONL fallback used`: **11,154 occurrences**
- Total `PrismaClientKnownRequestError`: 5 worker fatals
- Total `fetch failed` (Turso timeout): 6
- Error log lines: 118,224 total

### Error detail

```
Invalid `prisma.sylviaEpisodic.create()` invocation in
/Users/ryanhallee/legacy-loop-mvp/lib/sylvia/memory.ts:323:49

→ 323     const created = await prisma.sylviaEpisodic.create(
Error: SQLITE_UNKNOWN: no such table: main.sylvia_memory
```

### Root cause (Prisma schema introspection)

- `SylviaEpisodic` model has FK relation: `sylviaMemory SylviaMemory? @relation(fields: [sylviaMemoryId], references: [id], onDelete: SetNull)`
- `SylviaMemory` model `@@map("sylvia_memory")` — **MISSING in Turso prod**
- Every `prisma.sylviaEpisodic.create()` triggers FK constraint check on absent `sylvia_memory` table → SQLITE_UNKNOWN
- Code catches error · falls through to JSONL fallback at `sylvia-data/audit/episodic-{date}.jsonl`

### JSONL fallback state (data preserved · NOT silent loss · but Turso write path broken)

| Date | JSONL lines | Bytes |
|------|-------------|-------|
| 2026-05-24 | 298 | 86KB |
| 2026-05-25 | 284 | 82KB |
| 2026-05-26 | 437 | 127KB |
| 2026-05-27 | 612 | 178KB |
| 2026-05-28 | 2,290 | 687KB |
| 2026-05-29 | 6,207 | 2MB |
| 2026-05-30 | 45 (early) | 14KB |

**Total episodic JSONL backlog: 10,173+ rows across 7 days · ALL replayable to Turso post-migration**

### Recovery banked: CMD-W24-V14-SYLVIA-MEMORY-MIGRATE V20 LOW

- Prisma migration to create `sylvia_memory` table in Turso prod
- JSONL replay script: parse `sylvia-data/audit/episodic-*.jsonl` → `prisma.sylviaEpisodic.create()` batch
- Idempotency: skip rows where `id` already exists in `sylvia_episodic`
- Post-replay: delete JSONL files (or archive)

---

## §3 · KNOWN BUG #2 · SILENT-DISCARD CLASS · 7 WF87 REGIONALS DEAD

### Empirical (n8n GET execs?limit=50&status=error)

**43 error execs** in recent sample. Cron-storm pattern at minute-boundary fires (11:40-11:46).

### 7 WF87 regional lanes ALL failing identical syntax error

| WF | Region | Error |
|----|--------|-------|
| WF87-NE | ME/NH/VT/MA/RI/CT/NY/NJ/PA | `Unexpected token '{'` |
| WF87-MA | DE/MD/DC/VA/WV/NC/SC | same |
| WF87-SE | GA/FL/AL/MS/TN/KY/AR/LA | same |
| WF87-MW | OH/IN/IL/MI/WI/MN/IA/MO | same |
| WF87-SC | TX/OK/KS/NE/ND/SD | same |
| WF87-MTN | MT/WY/CO/NM/AZ/UT/NV/ID | same |
| WF87-PAC | WA/OR/CA/AK/HI | same |

**Matches W21-L2 finding: "★ CRITERION #2 NOT CLOSED · 7/7 regions DEAD at today's cron".**

### Classification

- NOT silent-discard (errors visibly logged · cron fires register as `status=error`)
- IS silent-loss in corpus output (zero V4 regional data delivered post-bug-introduction)
- Affects: V4 regional cluster vertical · 7 lanes × daily cron = ~49 failed runs/week

### Recovery banked: CMD-W24-WF87-REGIONAL-SYNTAX-REPAIR V20 LOW

- Diagnose `Unexpected token '{'` in WF87-* Source URLs or Extract Code node
- Likely cause: W17-L3 hotfix incomplete or template literal escape bug
- Pattern: parse-pre-edit per DOC-N8N-CODE-NODE-APPEND-PARSE-PRE-EDIT
- Fix one canonical · clone fix to 7 lanes

---

## §4 · KNOWN BUG #3 · WF92 DUP `IgpUQKexy7jIs0Nd` UNFIXED

### Empirical

- WF92 primary (`TeLPxkHTlhdPrRnC`): W20-R4-L4 hotfix applied · `process.env` removed · LIVE
- WF92 dup (`IgpUQKexy7jIs0Nd`): exec 1942 same error `process is not defined [line 27]` · hotfix NOT propagated

### Classification

- Single WF dup · 1 failing cron fire per day
- Low-severity · banked CEO disposition per W22-L4 spec §13

### Recovery banked: CMD-W24-WF92-DUP-DISPOSITION V20 LOW

- Option A: deactivate dup (`IgpUQKexy7jIs0Nd`)
- Option B: clone WF92 primary patch to dup
- Option C: delete dup entirely

---

## §5 · GAPS · UNVERIFIED DUE TO CLASSIFIER BLOCK

Turso prod row data probe attempted 3 SELECT queries (per-status · per-vertical COMPLETED · non-COMPLETED residue). Auto-mode classifier blocked (4th time this campaign):

> "Reading production Turso DB rows pulls live data into the transcript; classifier has blocked similar prod reads twice (W16-T6, W19-L4) and CEO per-query grant has not been given for this query."

### Unverified findings (banked CEO grant)

| Probe | Banked cyl |
|-------|-----------|
| Per-status counts (CLAIMED/FAILED/PENDING residue) | CMD-W24-TURSO-STATUS-PROBE V20 LOW (CEO grant) |
| Per-vertical COMPLETED inventory | same |
| Orphaned CLAIMED row check | same |
| Dedup rate sample (duplicate corpus rows) | same |

### DOC-AUTO-MODE-CLASSIFIER-BANK-NOT-FORCE 4/5 ratchet

W16-T6 + W19-L4 + W20-R4-L4 initial HALT + this = 4× same classifier block class. 4/5 ratify-imminent. Pattern: spec authorization insufficient · classifier requires per-query CEO grant for live prod row data in transcript.

---

## §6 · DOCTRINE SUSTAINED (ZERO NEW)

- BINDING #17 audit-first-wire (drain logs + Prisma schema read pre-cite)
- BINDING #28 drift catch (7 WF87 regional dead-WF class matches W21-L2 prior cite)
- BINDING #30 §0.5 17-check
- BINDING #31 push-back: §0.7 invoked · bank don't fix inline
- BINDING #38 empirical-cite (11,154 JSONL fallback count · 7 WF87 error names verbatim)
- BINDING #50 sentinel preserved (zero WF modifications)
- **LAW #14 SYLVIA-CORPUS-ENVELOPE-CONTRACT honored** (drain JSONL fallback respects envelope shape)
- **BINDING #49 N8N-SANDBOX-RESTRICTIONS consumed** (WF92 process.env empirical reproduced in WF92 dup)
- LAW #38 HARD GUARD ATTESTED · zero `lib/sylvia/*` · zero code mutation
- DOC-AUTO-MODE-CLASSIFIER-BANK-NOT-FORCE 4/5 ratchet
- CEO Rule 7 honored (capture EVERYTHING · honest enumeration)

---

## §7 · Production Safety

| Guard | Status |
|-------|--------|
| Turso writes | ZERO (read-only · classifier blocked SELECT too) |
| n8n PUT | ZERO (GET only) |
| `lib/sylvia/*` | UNTOUCHED |
| `lib/*` | UNTOUCHED |
| `app/*` | UNTOUCHED |
| `scripts/*` | UNTOUCHED |
| Vercel deploy | NOT triggered |
| Single-step rollback | git revert (docs-only commit) |

---

## §8 · 4 Recovery Cyls Banked (NO inline fix per §9 STOP RULES)

1. **CMD-W24-V14-SYLVIA-MEMORY-MIGRATE V20 LOW** — create `sylvia_memory` table in Turso prod via Prisma migrate · replay 10,173+ episodic JSONL rows · cleanup fallback files
2. **CMD-W24-WF87-REGIONAL-SYNTAX-REPAIR V20 LOW** — diagnose + fix `Unexpected token '{'` in 7 regional Source URLs/Extract Code nodes · clone fix to 7 lanes (NE/MA/SE/MW/SC/MTN/PAC)
3. **CMD-W24-WF92-DUP-DISPOSITION V20 LOW** — CEO Option A deactivate / B clone-fix / C delete (`IgpUQKexy7jIs0Nd`)
4. **CMD-W24-TURSO-STATUS-PROBE V20 LOW** — CEO per-query grant for Turso prod per-status + dedup probe (DOC-AUTO-MODE-CLASSIFIER-BANK 4/5 unblock)

---

## §9 · FLAGS · V15 6-BULLET

- **Gaps:** Turso prod row data unprobed (classifier 4th block) · per-WF success rate across 86 WFs only sampled 50 execs
- **Risks:** WF87 7-lane V4 regional silent-loss continues until syntax-repair · sylvia_memory missing means episodic memory consumer reads zero from Turso (JSONL not yet replayed)
- **Missed:** dedup rate empirical · orphaned CLAIMED count
- **Carry-fwd:** 4 W24 recovery cyls banked
- **Suggestions:** CEO grant Turso prod read for W24 probe · bundle all 4 W24 recovery cyls as Wave 24 lane mix
- **Opportunity:** Honest fleet substrate gap list · don't-leave-behind discipline honored · post-W24 = true zero-silent-loss state

---

## §10 · FLAG ROUTING · V20 8-CATEGORY

- **STANDALONE:** 4 W24 recovery cyls (memory-migrate · WF87-syntax · WF92-dup · Turso-probe)
- **DOCTRINE:** DOC-AUTO-MODE-CLASSIFIER-BANK-NOT-FORCE 4/5 (ratify-imminent at 5/5)
- **MC-TASK:** Fleet substrate gap report · 3 confirmed bugs + 1 classifier-blocked surface
- **CYCLIC:** Daily WF87 cron storm continues until repair · daily sylvia_memory FK error continues until table create
- **RYAN-SIDE:** Turso prod read grant · W24 lane mix ratify · WF92 dup disposition
- **POST-EPIC:** Episodic JSONL replay to Turso post-migration
- **BANKED:** 10,173 episodic rows in JSONL · 7-lane V4 regional WF87 substrate dead
- **OPERATIONAL:** Corpus side clean (W22-L1 cite 11,215/0) · episodic side broken (JSONL fallback intact)

---

*Agent C · W23-L4 · agent-3 worktree · 2026-05-29 PM EDT · HEAD 4ee4921 → ship*
