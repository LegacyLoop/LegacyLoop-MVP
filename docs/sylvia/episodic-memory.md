# Sylvia Episodic Memory · Architecture

> **Cylinder:** CMD-SYLVIA-EPISODIC-MEMORY-UNIFY V20 v2.1 R29 P72 · Wave 15 Slot A
> **Track:** B · brain primitive · 7-memory framework §7
> **Authored:** 2026-05-16 · IT execute · Devin L2 spec
> **Class:** BUILD-UP · 1 NEW substrate + 1 NEW model + 3 surgical mods

---

## §1 · Why

Pre-P72 Sylvia episodic memory was scattered across 3 sources:
- `EventLog` (Prisma · 53rd-class · item-centric event history)
- `ScraperUsageLog` (Prisma · scraper-call audit)
- `sylvia-data/audit/*.jsonl` (consensus + tool JSONL · Vercel ephemeral)

No unified timeline query. No causation chain. No cross-source session recall.

P72 introduces **`SylviaEpisodic`** Prisma model (#54) + `lib/sylvia/episodic.ts` primitive that **unifies the timeline** under a single API contract.

---

## §2 · API surface

`lib/sylvia/episodic.ts` exports:

```typescript
// Time-window recall (primary · Prisma · optional JSONL merge)
recallByTimeWindow({ start, end, eventTypes?, limit?, includeJSONL? })

// Session-scoped recall (asc timestamp order · for chat replay)
recallBySession(sessionId, limit = 50)

// Cause-class recall (e.g. all "error" events in last 30 days)
recallByCause(eventType, sinceDays = 30, limit = 25)

// Causation chain (BFS via causedById self-ref)
recallCausationChain(rootId, maxDepth = 5)

// One-time backfill (dryRun default v1 · CEO routes live migration)
backfillFromLegacySources({ dryRun? })
```

Plus `appendEpisodic(entry)` re-exported from `lib/sylvia/memory.ts` (matches `appendAuditEntry` + `appendToolAuditEntry` siblings · single import path).

---

## §3 · Prisma model

```prisma
model SylviaEpisodic {
  id             String   @id @default(cuid())
  timestamp      DateTime @default(now())
  sessionId      String
  eventType      String   // "triage" · "consensus" · "tool_call" · "chat_turn" · "error" · "human_route"

  userId         String?
  itemId         String?
  sylviaMemoryId String?

  payload        String   // JSON-encoded · forward-compat shape

  causedById     String?
  causes         SylviaEpisodic[] @relation("EpisodicCausation")
  causedBy       SylviaEpisodic?  @relation("EpisodicCausation", fields: [causedById], references: [id], onDelete: SetNull)

  source         String   // "EventLog" · "ScraperUsageLog" · "audit-jsonl" · "direct"
  createdAt      DateTime @default(now())

  user           User?         @relation(fields: [userId], references: [id], onDelete: SetNull)
  item           Item?         @relation(fields: [itemId], references: [id], onDelete: SetNull)
  sylviaMemory   SylviaMemory? @relation(fields: [sylviaMemoryId], references: [id], onDelete: SetNull)

  @@index([sessionId])
  @@index([timestamp])
  @@index([eventType])
  @@index([userId])
  @@index([causedById])
  @@map("sylvia_episodic")
}
```

**Design decisions:**
- `onDelete: SetNull` on all FK · learnings outlive items
- `payload` JSON-encoded · forward-compat (Prisma SQLite has no `Json` type)
- `causedById` self-ref enables cause-chain traversal · BFS in `recallCausationChain`
- 5 indexes match canonical query patterns · prune via Phase 9.1 once telemetry confirms

---

## §4 · Hybrid Prisma + JSONL pattern

`appendEpisodic` writes Prisma primary · falls back to JSONL on Prisma failure.

Why hybrid:
- **Vercel ephemeral filesystem** · JSONL writes survive only within warm-lambda window
- **Prisma is primary** · durable on Turso prod
- **JSONL fallback** captures events if Prisma temporarily unavailable (DB blip · timeout)
- **Backfill helper** consumes ephemeral JSONL pre-eviction · banked CY-N weekly cron

Banked: Phase 9.1 AgentDB swap replaces JSONL fallback with durable secondary store.

---

## §5 · Migration plan

### v1 · this cylinder (R29 P72)
- Prisma `SylviaEpisodic` model created · dev SQLite pushed
- `lib/sylvia/episodic.ts` ships with 4-fn recall API + backfill helper (dry-run default)
- Zero consumer wired (banked: chat handler · P74 pattern engine)

### Prod migration (CEO routes via §5.X Gate 1)
Per BINDING #6 OP-B canonical (R22.5):
```bash
node --env-file=.env scripts/prod-prisma-push.mjs
# uses @libsql/client with TURSO_CONNECTION_URL + TURSO_AUTH_TOKEN
```

**This cyl ships:** dev SQLite push only · prod Turso push DEFERRED to CEO per §5.X gate.

### Phase 9.1 · AgentDB swap
- Replace JSONL fallback with AgentDB persistent secondary
- Nightly LTM consolidation reads `recallByTimeWindow` output for pattern engine input
- `backfillFromLegacySources` live-mode fires via CEO-routed cyl post-validation

---

## §6 · Consumer integration (banked)

- **Chat handler** (`lib/sylvia/chat/handler.ts` · post-P70): emit `appendEpisodic` on each chat turn · enables session replay
- **P74 Pattern Engine** consumes `recallByCause("error", 30, 100)` for error-pattern detection
- **Cost/budget telemetry** queries `recallByTimeWindow` for cost timeline graphs
- **Slack ops bot** queries `recallBySession(sessionId)` for ops triage

---

## §7 · Doctrine

- **BINDING #5** · payload field NEVER stores credentials (consumer responsibility · cred-redact upstream)
- **BINDING #6** · dev SQLite push only this cyl · prod Turso routes via OP-B node script
- **BINDING #16** · clones `appendToolAuditEntry` pattern · zero novel abstractions
- **BINDING #17** · §0.3 substrate read end-to-end · all canonical signatures cited verbatim
- **BINDING #28** · drift catch on EventLog/ScraperUsageLog cross-refs · cited verbatim
- **BINDING #34** · widened cite (commit SHA = deploy SHA · dpl Ready · curl 3-route + unauth probe)
- **BINDING #35** · DOC-SPEC-AUTHORING-DEEP-DIVE-MANDATORY sustains post-ratification

---

## §8 · Cross-references

- Pattern source: `lib/sylvia/memory.ts` (`appendAuditEntry` + `appendToolAuditEntry`)
- Type source: `lib/sylvia/memory-types.ts` (`AuditEntry` + `ToolAuditEntry` siblings)
- Cognitive architecture: `docs/SYLVIA_COGNITIVE_ARCHITECTURE.md` §7 (7-memory framework)
- Sibling Wave 15 cyls: P73 semantic memory · P74 pattern engine
- Future consumer: `lib/sylvia/chat/handler.ts` (banked post-P74)

---

*Authored R29 P72 Wave 15 Slot A · 2026-05-16 · Track B · agent-1 worktree*
