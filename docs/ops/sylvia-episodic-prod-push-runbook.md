# SylviaEpisodic · Prod Turso Push Runbook

> **Cylinder:** CMD-PROD-PRISMA-PUSH-SYLVIA-EPISODIC V20 v2.1 R29 P78 · Wave 16 Slot B
> **Schema:** `prisma/schema.prisma` L1367-L1404 · model #54
> **Table name (per @@map):** `sylvia_episodic` (snake_case)
> **Script:** `scripts/prod-prisma-push-sylvia-episodic.mjs`
> **Audience:** CEO + IT
> **Last revised:** 2026-05-16 PM

---

## §1 · Pre-flight Checks

```bash
# Env vars present (BINDING #5 · grep name-only · zero value print)
grep -cE "^TURSO_CONNECTION_URL=" .env  # expect: 1
grep -cE "^TURSO_AUTH_TOKEN=" .env      # expect: 1

# Prisma client version matches schema
grep '"prisma":' package.json  # expect: ^6.19.2

# @libsql/client installed
grep '"@libsql/client":' package.json  # expect: ^0.17.x

# Schema model exists
grep -nE "^model SylviaEpisodic" prisma/schema.prisma  # expect: L1367

# Production Turso reachable (1-row probe)
node --env-file=.env -e "
import('@libsql/client').then(async ({ createClient }) => {
  const c = createClient({ url: process.env.TURSO_CONNECTION_URL, authToken: process.env.TURSO_AUTH_TOKEN });
  const r = await c.execute('SELECT 1 AS ok');
  console.log('probe:', JSON.stringify(r.rows[0]));
});"  # expect: probe: {"ok":1}
```

---

## §2 · Dry-Run + CEO §5.X Gate 1

```bash
node --env-file=.env scripts/prod-prisma-push-sylvia-episodic.mjs --dry-run
```

Output shows 6 DDL statements:
1. CREATE TABLE `sylvia_episodic` (11 columns · 4 FK constraints SET NULL)
2-6. CREATE INDEX (sessionId · timestamp · eventType · userId · causedById)

**CEO reviews:**
- Idempotent `IF NOT EXISTS` guards present
- FK constraints match Prisma schema (User · Item · sylvia_memory · self-ref)
- Index naming follows Prisma convention (`<table>_<field>_idx`)
- Zero data loss · greenfield table

**CEO acks:** `Prod push GO` · IT proceeds with `--live` flag.

---

## §3 · Live Execution + Post-flight Verify

```bash
node --env-file=.env scripts/prod-prisma-push-sylvia-episodic.mjs --live
```

Expected output:
```
[mode] LIVE
[pre] sylvia_episodic exists: false
[pre] sylvia_memory (FK dep) exists: false (or true)
[live] executing DDL...
[live 1/6] OK · rowsAffected=0
[live 2/6] OK · rowsAffected=0
[live 3/6] OK · rowsAffected=0
[live 4/6] OK · rowsAffected=0
[live 5/6] OK · rowsAffected=0
[live 6/6] OK · rowsAffected=0
[verify] sylvia_episodic indexes: 5
  - sylvia_episodic_causedById_idx
  - sylvia_episodic_eventType_idx
  - sylvia_episodic_sessionId_idx
  - sylvia_episodic_timestamp_idx
  - sylvia_episodic_userId_idx
[OK] 6/6 stmts executed · table + indexes live in production Turso
```

If FK dep `sylvia_memory` absent: libsql defers FK enforcement · acceptable for greenfield (FKs activate when both tables present).

---

## §4 · Rollback Path (manual · BINDING #6 reverse)

If post-push smoke fails OR schema drift discovered:

```bash
# 1. Drop indexes (5 stmts)
node --env-file=.env -e "
import('@libsql/client').then(async ({ createClient }) => {
  const c = createClient({ url: process.env.TURSO_CONNECTION_URL, authToken: process.env.TURSO_AUTH_TOKEN });
  for (const name of ['sylvia_episodic_sessionId_idx','sylvia_episodic_timestamp_idx','sylvia_episodic_eventType_idx','sylvia_episodic_userId_idx','sylvia_episodic_causedById_idx']) {
    await c.execute(\`DROP INDEX IF EXISTS \"\${name}\"\`);
    console.log('dropped:', name);
  }
});"

# 2. Drop table
node --env-file=.env -e "
import('@libsql/client').then(async ({ createClient }) => {
  const c = createClient({ url: process.env.TURSO_CONNECTION_URL, authToken: process.env.TURSO_AUTH_TOKEN });
  await c.execute('DROP TABLE IF EXISTS \"sylvia_episodic\"');
  console.log('dropped table sylvia_episodic');
});"
```

Rollback is safe because greenfield (no rows lost).

---

## §5 · Post-push Smoke

```bash
# Local Prisma client smoke (BINDING #6 ALLOW_LOCAL_TURSO override)
ALLOW_LOCAL_TURSO=1 node --env-file=.env -e "
import('@prisma/client').then(async ({ PrismaClient }) => {
  const p = new PrismaClient();
  const rows = await p.sylviaEpisodic.findMany({ take: 1 });
  console.log('findMany rows:', rows.length);
  await p.\$disconnect();
});"  # expect: findMany rows: 0
```

---

## §6 · CY-N Quarterly Verification

Banked: `CMD-SYLVIA-EPISODIC-PROD-DRIFT-CHECK-CY-N V20 LOW` · verify table + 5 indexes still present + row growth healthy.

---

## §7 · Cross-references

- **Prisma schema:** `prisma/schema.prisma` L1367-L1404 (model #54)
- **Script:** `scripts/prod-prisma-push-sylvia-episodic.mjs` (BINDING #6 OP-B canonical)
- **Pattern source:** May 8 R22.5 SellingPipeline push (17/17 stmts proven)
- **BINDING #6 DEV-PROD-DB-ISOLATION:** `prisma db push` dev-only · prod via libsql direct OP-B
- **BINDING #5 BAN-ENV-FILE-DUMP:** `node --env-file=.env` pattern · zero cat
- **Consumer code:** `lib/sylvia/episodic.ts` (P72 ship · currently 3 tsc errors due to Prisma client not regenerated · resolves post-push + `npx prisma generate`)

---

*Authored 2026-05-16 PM · IT execute · Devin L2 spec · main worktree*
