# Cyl 7A Webhook Receiver · Verification Audit

**Author:** IT (executor) · drafted via CMD-CYL-7A-WEBHOOK-VERIFY V18
**Date:** 2026-05-06 (Wed PM EDT) · Round 14 P1 · Worktree B
**Anchor HEAD:** `f7451deda2e1fe788cde1020f7610f600542a0be`
**Cyl 7A original ship:** commit `7f0c456` (Sat 2026-05-02 · CMD-CYLINDER-7A-N8N-WEBHOOK V18)
**Status:** ✅ VERIFIED green at current HEAD · Cyl 7D unblocked · Cyl 7E gap noted

---

## §1 · Receiver state at HEAD `f7451de`

- **File:** `app/api/webhooks/n8n/route.ts`
- **Size:** 4147 bytes
- **Last modified:** 2026-05-02 09:33 (worktree create timestamp · file content unchanged since `7f0c456`)
- **Lines of code:** 121
- **Commits affecting this file since `7f0c456`:** none
  ```bash
  $ git log --oneline 7f0c456..HEAD -- app/api/webhooks/n8n/route.ts
  (empty output)
  ```
- **Verdict:** Receiver implementation is byte-identical to original `7f0c456` ship. No drift across 4 days + 30+ commits.

## §2 · Implementation summary

**Auth posture:**
- `req.headers.get("x-webhook-secret")` compared against `process.env.N8N_WEBHOOK_SECRET` via direct `!==`
- Returns `401 Unauthorized` on missing/wrong secret (env-var also gates: missing env returns 401 too)
- ⚠ **NOT cryptographically constant-time** — banks `DOC-CRYPTOGRAPHIC-CONSTANT-TIME-COMPARE` candidate · Cyl 7E future closure

**Routes:**
- `GET /api/webhooks/n8n` → `{ status: "ok", service: "n8n-webhook" }` (health check · no auth)
- `POST /api/webhooks/n8n` with `action: "ping"` → `{ ok: true, message: "pong" }`
- `POST` with `action: "scraper.catch"` → payload validation + 24h idempotency dedupe + ScraperUsageLog persist + 200 ack
- `POST` with unknown action → `{ ok: true, received: <action> }` 200
- 500 on any thrown error · console.error to log

**Payload contract (`scraper.catch`):**
- Required: `scraperId · platform · itemUrl` (any missing → 400 with explicit error)
- Optional: `rawHtml · parsedFields.comps[] · parsedFields.compsCount · parsedFields.median · parsedFields.source`
- TS interface `N8NScraperCatchPayload` documented inline at L7-27 · mirrors `lib/market-intelligence/types.ts` MarketComp + ScraperResult per receiver header comment

**Idempotency:**
- 24h window via `prisma.scraperUsageLog.findFirst({ where: { botName: "n8n_scraper_catch", slug: scraperId, createdAt: { gte: now-24h } } })`
- On hit: returns `{ received: true, dedupe: true, scraperId }` 200 · zero side-effect
- On miss: writes ScraperUsageLog row · returns `{ received: true, dedupe: false, scraperId }` 200

**Telemetry write:**
- Direct `prisma.scraperUsageLog.create` (NOT the `logScraperUsage` helper · receiver comment L86-88 explains: helper is fire-and-forget so would race subsequent receipts before idempotency lookup)
- Fields persisted: `botName="n8n_scraper_catch" · slug=scraperId · tier=0 · cost=0 · success=true · blocked=false · blockReason=null · compsReturned=parsedFields.compsCount ?? 0 · durationMs=0 · itemId=null · userId=null`

**Cyl 7B forward-compat:**
- `console.log("[N8N WEBHOOK · scraper.catch] platform=... url=... comps=...")` at L106 — Cyl 7B picks up ScraperUsageLog rows + payload to parse downstream
- Receiver does NOT inline-invoke 7B parser (decoupled handoff)

## §3 · Smoke harness results

Run from worktree `/Users/ryanhallee/legacy-loop-mvp-agent-2` against dev server at `http://localhost:3000` (anchored to main worktree per daemon QUARTET pattern).

| # | Scenario | Expected | Got | PASS/FAIL |
|---|---|---|---|---|
| 1 | `GET /api/webhooks/n8n` | 200 + `{status:"ok",service:"n8n-webhook"}` | `200` + `{"status":"ok","service":"n8n-webhook"}` | ✅ PASS |
| 2 | `POST` wrong secret | 401 | `401` + `{"error":"Unauthorized"}` | ✅ PASS |
| 3 | `POST` correct secret + `action:"ping"` | 200 + pong | `200` + `{"ok":true,"message":"pong"}` | ✅ PASS |
| 4 | `POST` correct secret + `scraper.catch` valid | 200 + dedupe:false + ScraperUsageLog row created | `200` + `{"received":true,"dedupe":false,"scraperId":"verify-1778091981"}` | ✅ PASS |
| 5 | `POST` same payload (dedupe) | 200 + dedupe:true + no second row | `200` + `{"received":true,"dedupe":true,"scraperId":"verify-1778091981"}` | ✅ PASS |
| 6 | `POST` `scraper.catch` invalid (no scraperId) | 400 | `400` + `{"error":"Invalid payload · missing scraperId · platform · or itemUrl"}` | ✅ PASS |

**ScraperUsageLog row sanity:**
```
$ sqlite3 prisma/dev.db "SELECT COUNT(*), slug, botName, success, compsReturned FROM ScraperUsageLog WHERE slug='verify-1778091981' GROUP BY slug;"
1|verify-1778091981|n8n_scraper_catch|1|0|3
```
Exactly **1 row** for the unique scraperId. Idempotency contract satisfied — smoke 5 (dedupe replay) did NOT create a second row.

**Verdict:** All 6 smokes PASS. Implementation matches `7f0c456` ship contract. Zero drift.

## §4 · Cyl 7B handoff readiness

- **7B contract:** parses `payload.parsedFields.comps[]` from 7A's `scraper.catch` action · transforms into ScraperComp-compatible shape · hands to 7C
- **Current state:** Receiver writes ScraperUsageLog telemetry only · does NOT inline-invoke 7B parser
- **Handoff mechanism:** decoupled · Cyl 7B reads ScraperUsageLog rows + replays payload (TBD parser endpoint location)
- **Grep for 7B consumer:** `grep -rn "parsedFields.comps" lib/ app/` returned **0 hits** at HEAD `f7451de` — Cyl 7B parser is **NOT YET BUILT**
- **Verdict:** ✅ **READY** for Cyl 7B build. 7A receiver fulfills its contract (validate + dedupe + persist telemetry); 7B parser is a clean greenfield build. Decoupled architecture means 7A can ingest indefinitely while 7B is authored independently.

## §5 · Cyl 7C downstream contract

- **7C model:** `prisma.scraperComp` — 21 fields verified at schema:
  ```
  id · slug · sourceUrl · sourcePlatform · title · description · priceUsd · soldPrice ·
  condition · category · keywordsJson · imageUrlsJson · metadataJson · firstSeenAt ·
  lastSeenAt · ttlExpiresAt · hitCount · contributorBotsJson · firstContributedBy ·
  qualityScore · sourceItemId · sourceUserId
  ```
- **7A → 7C field map (after 7B parsing transforms):**
  - `payload.parsedFields.comps[].url` → `ScraperComp.sourceUrl`
  - `payload.platform` → `ScraperComp.sourcePlatform`
  - `payload.parsedFields.comps[].item` → `ScraperComp.title`
  - `payload.parsedFields.comps[].price` → `ScraperComp.priceUsd` (or `soldPrice` based on date semantics)
  - `payload.parsedFields.comps[].condition` → `ScraperComp.condition`
  - `firstContributedBy: "n8n"` (constant for this ingest path)
  - `slug` derived by 7B (likely `scraperId-<comp-index>` or url-hashed)
- **Current state:** Receiver does NOT directly write ScraperComp · 7C handles persistence after 7B parses
- **Verdict:** ✅ **READY** — schema accepts the shape · 7B has a clean transformation surface · 7C persistence is greenfield-buildable

## §6 · Cyl 7E HMAC defense gap

**Current implementation (route.ts:38-42):**
```ts
const secret = req.headers.get("x-webhook-secret");
const expectedSecret = process.env.N8N_WEBHOOK_SECRET;

if (!expectedSecret || secret !== expectedSecret) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
```

**Vulnerability class:** timing-side-channel-aware. The `!==` direct compare on JavaScript strings short-circuits on the first mismatched byte. An attacker probing for the secret can measure response-time differences to deduce per-byte correctness over many requests, given enough samples and stable network conditions.

**Severity in current context:**
- DEV-acceptable: local-only, rate-limited by single IT process, not investor-demo-blocking
- PROD-acceptable for now: Vercel edge timing variance at the same scale dwarfs the sub-ms cmp window · realistic exploitability is LOW
- INVESTOR-DEMO-BLOCKER once we host n8n droplet + receiver in same network neighborhood (timing variance shrinks)

**Gap closure path: Cyl 7E (`CMD-CYL-7E-HMAC-DEFENSE V18`)**
- Replace `!==` with `crypto.timingSafeEqual(Buffer.from(secret ?? ""), Buffer.from(expectedSecret))`
- Optional upgrade: HMAC-SHA256 over the request body using a per-deployment secret · client passes `x-webhook-signature: sha256=<hex>` header · receiver re-computes and `timingSafeEqual` compares
- Banks `DOC-CRYPTOGRAPHIC-CONSTANT-TIME-COMPARE` candidate doctrine (1/5 proof point on this audit's gap-noting)

**Status:** Explicitly DEFERRED to Cyl 7E. Not implemented in this verify cylinder per spec scope discipline (audit-only · zero source edits).

## §7 · Cyl 7D unblock confirmation

CEO-side **Cyl 7D (n8n GUI workflow build)** was blocked by "verify 7A green at current HEAD" gate. This audit has confirmed:

1. ✅ Receiver exists at `app/api/webhooks/n8n/route.ts` · 121 lines · 4147 bytes
2. ✅ Implementation byte-identical to `7f0c456` original ship (zero drift across 4 days)
3. ✅ All 6 smokes PASS at current HEAD (`f7451de`)
4. ✅ Idempotency contract verified end-to-end (smoke 4 + 5 + sqlite row count = 1)
5. ✅ Payload validation rejects malformed input (smoke 6 = 400)
6. ✅ Auth gate blocks wrong secret (smoke 2 = 401)
7. ✅ N8N_WEBHOOK_SECRET present in `.env.local` (grep-only verified · DOC-BAN-ENV-FILE-DUMP honored)
8. ✅ n8n droplet (sender side) alive at `https://n8n.legacy-loop.com` (HTTP 200)

**VERIFICATION COMPLETE.** Cyl 7D is unblocked. CEO trigger phrase: **"let's do n8n setup"**.

## §8 · ScraperComp current row count (snapshot)

Skipped per scope discipline · this audit cylinder is audit-only on Cyl 7A. ScraperComp dashboard with row-count metric is BANKED LOW-PRI carry-forward (investor-track 100-item milestone narrative).

If MC parallel task surfaces a row count, append here in a follow-up edit:
```
$ sqlite3 prisma/dev.db "SELECT COUNT(*) FROM ScraperComp;"
<count TBD>
```

## §9 · Recommendations

1. **(LOW)** **Cyl 7E HMAC defense** before investor demos. Replace `!==` with `crypto.timingSafeEqual` + optional HMAC-SHA256 signature header. Banks `DOC-CRYPTOGRAPHIC-CONSTANT-TIME-COMPARE`.
2. **(LOW)** **Cyl 7G production smoke harness** — automated curl-based 6-scenario validation in CI, run on every push to main, gates production deploys with sender → receiver round-trip proof.
3. **(LOW)** **100-item ScraperComp dashboard** — admin view with weekly row-count growth, contributing-bot breakdown, dedupe-rate metric. Investor narrative compounds as the dataset compounds.
4. **(MEDIUM)** **Cyl 7B Ollama parser build** — reads ScraperUsageLog rows, replays payload via Ollama qwen-coder-2.5-local, normalizes `comps[]` into ScraperComp-compatible shape, hands off to Cyl 7C persister. Greenfield · clean handoff surface confirmed in §4.
5. **(LOW)** **Receiver hardening polish:** timeout on `req.json().catch(...)` (currently silently swallows), explicit content-type check, per-IP rate limit at the edge for the POST handler.

---

## Carry-forward summary

| Item | Priority | Status |
|---|---|---|
| Cyl 7E HMAC defense (`CMD-CYL-7E-HMAC-DEFENSE V18`) | LOW (pre-demo) | BANKED |
| `DOC-CRYPTOGRAPHIC-CONSTANT-TIME-COMPARE` candidate | DOCTRINE | 1/5 proof point banked at this audit |
| Cyl 7G production smoke harness | LOW | BANKED |
| 100-item ScraperComp dashboard | LOW | BANKED (investor track) |
| Cyl 7B Ollama parser | MEDIUM | UNBLOCKED · greenfield |
| Cyl 7D CEO-side n8n GUI build | — | UNBLOCKED · trigger phrase "let's do n8n setup" |

---

*End of CYL_7A_WEBHOOK_VERIFY_AUDIT.md · drafted under CMD-CYL-7A-WEBHOOK-VERIFY V18 · Round 14 P1 · Worktree B*
