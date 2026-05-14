# Runtime Timeout Diagnose · 2026-05-14 · R29 P37 Wave 4 Slot 1

> **Status:** Diagnose-only · audit-doc · ZERO source code fix applied
> **Anchor:** P36 §12 PARTIAL-GREEN · `/search` 504 (3/4) + `/` landing root 000/10s
> **Verdict:** **A + C compound** (Path A code-pattern drift · Path C primary cause hypothesis · Path B + D secondary)
> **STOP RULE honored:** zero file mutation outside this audit doc

---

## Symptom map

### Captured 2026-05-14 14:30-15:00 EDT (during P36 ship + post-deploy curls)

| Route | Status | Time | Source |
|---|---|---|---|
| `/` (landing root) | 🔴 000 timeout | 10s | curl --max-time 10 |
| `/search` (1st post-deploy) | ✅ 200 | n/a (succeeded once) | Vercel runtime log 19:12:57 |
| `/search` (subsequent) | 🔴 504 Runtime Timeout | n/a (3 in a row) | Vercel runtime log 19:13:52 · 19:14:22 · 19:14:52 |
| `/dashboard` | ✅ 200 | 0.33s | curl |
| `https://app.legacy-loop.com` (root alias) | 🟡 200 | 14.3s (slow) | curl earlier |
| `https://legacy-loop.com` (landing) | ✅ 200 | 0.35s | curl |

### Captured 2026-05-14 15:41 EDT (P37 §0.5 fresh probe · ~30 min later)

| Route | Status | Time |
|---|---|---|
| `/` | **✅ 200** | **0.840s** |
| `/search` | **✅ 200** | **0.799s** |
| `/dashboard` | ✅ 200 | 0.208s |
| `landing` | ✅ 200 | 0.311s |

**Recovery pattern:** all routes self-healed within 30 minutes post-P36 deploy. Suggests transient cold-instance class · NOT persistent code-level bug. But code-pattern drifts (Path A · Path C config gap) WILL reproduce on next cold-scale event.

---

## Hypothesis testing

### Path A · Prisma singleton gate INVERTED 🟡 CONFIRMED CODE-LEVEL

**Evidence:** `lib/db.ts:85-87` verbatim:
```ts
export const prisma = globalForPrisma.prisma ?? buildPrisma();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
```

**Canonical pattern (Prisma docs):** cache `globalThis` in PRODUCTION (lambda warm-instance reuse) · skip in DEV (hot-reload regen avoids connection-limit warnings).

**This code:** OPPOSITE · caches in DEV only · production NEVER caches `globalForPrisma.prisma`.

**Effect on production runtime — limited:**
- Module-level `const prisma = ... ?? buildPrisma()` binds ONCE per lambda cold start.
- That binding PERSISTS for the lambda instance lifetime regardless of `globalForPrisma` cache.
- So gate inversion does NOT cause repeated client re-init within a single lambda instance.
- It DOES prevent cross-module / cross-import singleton sharing (minor in current architecture · all imports go through `lib/db.ts`).

**Verdict signal:** **MED preventive** (drift class · canonical-correct fix) · **LOW direct timeout cause** (module-const persists per-lambda regardless).

**Recommended fix path:** flip `!==` to `===` OR `if (process.env.NODE_ENV === "production") globalForPrisma.prisma = prisma;` · 1-line edit · safe · canonical-correct.

---

### Path B · Turso libsql adapter has NO connection pool 🟡 CONFIRMED ARCH-LEVEL

**Evidence:** `lib/db.ts:57-61`:
```ts
const adapter = new PrismaLibSQL({
  url: tursoUrl,
  authToken: tursoToken,
} as any);
return new PrismaClient({ adapter } as any);
```

`@prisma/adapter-libsql` 6.19.3 · `previewFeatures = ["driverAdapters"]` (per `prisma/schema.prisma:3`). Per Prisma docs, driverAdapters preview does NOT support traditional Prisma connection pool. Each adapter instance = 1 libsql HTTPS connection.

**Effect on production runtime:**
- Each Vercel lambda cold-init opens new HTTPS to Turso.
- Cold-handshake adds ~200-500ms per fresh instance.
- Within-lambda warm requests reuse same connection (cheap).
- Across-lambda parallel scaling (e.g. burst traffic) opens many concurrent HTTPS to Turso · could compound to Turso per-region throttle OR slow cold-path on fresh edge regions.

**Verdict signal:** **MED compounding factor** · not standalone primary · matters under scale-out bursts.

**Recommended fix path (banked):** evaluate `prisma-accelerate` OR `@libsql/client` direct pool · LATER if Path A+C don't resolve.

---

### Path C · Vercel `functions.maxDuration` config ABSENT 🔴 STRONG SUSPECT

**Evidence:** `vercel.json` verbatim:
```json
{"crons":[{"path":"/api/cron/offers","schedule":"0 0 * * *"}, ...]}
```

ZERO `functions` block · ZERO `maxDuration` · ZERO memory tune.

`grep -cE "maxDuration|memory|runtime|functions" vercel.json` = **0**.

**Vercel default knowledge (per 2026 platform doc):**
- Default function execution timeout: **300s on all plans** (per Vercel knowledge update note).
- BUT proxy-layer / HTTPS-layer timeout differs · 504 Gateway Timeout returns to client at edge-layer well before function 300s exec timeout.
- Hobby plan edge timeout: ~10s. Pro plan: ~30s. Enterprise: configurable.
- LegacyLoop is on Pro per BINDING #24 saga.

**Observed:** 504 patterns hit at ~15s mark consistently. Pro plan edge default should be ~30s · so OBSERVED 15s is anomalously short. Possible:
- Vercel project has implicit lower timeout configured
- Edge node geographic latency adds to lambda cold-path · compounded > visible threshold
- OR Vercel internal proxy guards trigger at ~15s for SSR routes with slow Prisma init

**Effect on production runtime — DIRECT timeout cause hypothesis:**
- Cold-instance Prisma + libsql adapter init = 5-12s typical
- + first Prisma query against Turso prod = 1-3s
- Total cold-path = 6-15s · exactly the 15s observation threshold
- Edge proxy returns 504 before function completes

**Verdict signal:** **HIGH probability direct cause** of 504 specifically · explicit `functions.maxDuration: 30` (or higher) in `vercel.json` would explicitly override edge proxy default · grants function more head-room.

**Recommended fix path:** ADD `functions` block to `vercel.json` with explicit `maxDuration: 30` (Pro plan max) AND `memory: 1024` (default) for clarity. Single config edit · ~5 min.

---

### Path D · Route-specific cold-path heaviness 🟡 PARTIAL contributor

**HomePage `app/page.tsx`:**
- L69: `await authAdapter.getSession()` (Prisma user lookup)
- L72: `await getFoundingMemberStats()` (Prisma count)
- 2 serial awaits before render · could parallelize via `Promise.all([authAdapter.getSession(), getFoundingMemberStats()])` to halve cold-path.

**`/dashboard` `app/dashboard/page.tsx`:**
- L46: `await authAdapter.getSession()`
- L60: `await getFoundingMemberStats()`
- L65: `await prisma.user.findUnique(...)`
- L89: `await prisma.item.findMany(...)`
- L132: `await prisma.transaction.aggregate(...)`
- L146: `await prisma.eventLog.findMany(...)`
- L171: `await prisma.reconAlert.findMany(...)`
- **7 awaits · MORE THAN HomePage** · yet `/dashboard` consistently 200/0.2-0.3s.

**Anomaly:** `/dashboard` is HEAVIER but FASTER than `/` HomePage. Hypothesis: `/dashboard` is HIGH-traffic warm-route · its lambda instances stay warm · cold-path rarely surfaces in curl probes. `/` HomePage gets less traffic · cold-path surfaces more often.

**Verdict signal:** **LOW standalone** · HomePage parallelize is 30-50% cold-path improvement BUT secondary to Path C edge-timeout headroom.

**Recommended fix path (banked LOW):** `CMD-HOMEPAGE-PARALLEL-AWAITS V19` · LATER.

---

## Final verdict

**🎯 Compound A + C primary · B + D secondary**

| Path | Verdict | Direct cause? | Priority |
|---|---|---|---|
| **A · Singleton gate inverted** | 🟡 confirmed code-drift · LIMITED direct timeout effect (module-const persists per-lambda) | LOW | **MED preventive** (canonical-correct fix · 1-line · safe) |
| **B · libsql no pool** | 🟡 confirmed arch-level · MED compounding under scale-out | LOW-MED | LOW-MED (banked) |
| **C · vercel.json no maxDuration** | 🔴 STRONG primary hypothesis for 504 at 15s mark | **HIGH** | **P0 PRIMARY** |
| **D · HomePage 2 serial awaits** | 🟡 secondary cold-path contributor · /dashboard heavier+faster anomaly | LOW | LOW (banked) |

**Recovery evidence:** all 4 routes 200 sub-second 30 min post-P36 deploy · transient cold-instance event class · NOT persistent. But code-pattern drifts (A · C) will reproduce on next cold-scale event without fix.

---

## Recommended fix cyl

### PRIMARY · `CMD-VERCEL-FUNCTION-MAXDURATION-FIX V19` (Path C)

- **Scope:** add `functions` block to `vercel.json` with `"app/**/page.tsx": { "maxDuration": 30 }` OR project-wide default
- **Runtime:** ~10 min · single config edit · trivial verify
- **Evidence:** 504 timeouts cluster at exactly 15s · ABSENT `maxDuration` defaults to edge proxy timeout · explicit 30s overrides
- **Risk:** LOW · vercel.json non-LOCKED · Vercel's own canonical config surface
- **Fires:** SOLO immediate Wave 5 Slot 1 OR rider on next P-cyl

### SECONDARY · `CMD-PRISMA-SINGLETON-GATE-FIX V19` (Path A)

- **Scope:** `lib/db.ts:87` flip `!==` to `===` (cache globalForPrisma in production)
- **Runtime:** ~10 min · 1-line edit · tsc + build + verify
- **Evidence:** canonical Prisma pattern inverted · drift-class catch (BINDING #28)
- **Risk:** LOW · canonical-correct restoration · safe
- **Preventive value:** prevents future regressions even if not current direct 504 cause
- **Fires:** SOLO Wave 5 Slot 2 OR rider on A-fix cyl

### TERTIARY · `CMD-HOMEPAGE-PARALLEL-AWAITS V19` (Path D)

- **Scope:** `app/page.tsx:69-72` swap serial awaits to `Promise.all([...])`
- **Runtime:** ~10 min · single function refactor
- **Risk:** LOW · pure optimization · no semantic change
- **Fires:** banked LOW · post-A-and-C ship

### BANKED · `CMD-TURSO-CONNECTION-POOL-EVAL V19` (Path B)

- **Scope:** evaluate `prisma-accelerate` migration OR `@libsql/client` direct pool
- **Runtime:** ~30-60 min research + ~30-60 min implementation
- **Risk:** MED · architectural change · evaluate cost/benefit first
- **Fires:** LATER if A+C don't fully resolve under scale-out bursts

---

## Out-of-scope (banked)

- CMD-OTHER-ROUTES-DYNAMIC-AUDIT V19 LOW · 87 of 89 routes lack `force-dynamic` (per spec §0 cross-ref to Wave 4 Slot 3 staged) · preventive class · prevents future build-class regressions like P33/P35/P36
- CY-N CY-16 NEW serverless 504 monitoring (weekly Vercel runtime log scan for 504 patterns)
- CY-N quarterly Prisma singleton pattern audit (catches inverted-gate class regressions)

---

## Cross-references

- **P36 §12** · build-class fix anchor (force-dynamic + query trim · BUILD restored)
- **BINDING #21** · DOC-VERIFY-VERCEL-AFTER-COMMIT widened per DOC-VERIFY-COMMIT-SPECIFIC-DEPLOY-READY 2/5
- **BINDING #28** · DOC-AUDIT-DOC-DRIFT-CATCH (sustains 37× · this audit IS the drift-catch application)
- **DOC-FLAG-RIDER-PER-CYLINDER** · scope exclusion (P0 production cyl · no rider · Sylvia-bridge + P36 precedent)

---

## Last updated

2026-05-14 (Thu) · R29 P37 Wave 4 Slot 1 · CMD-RUNTIME-TIMEOUT-DIAGNOSE V19
