# Cyl 7B Ollama Parser Wire · Audit (HALT-on-FIX-2)

**Author:** IT (executor) · drafted via CMD-CYL-7B-OLLAMA-PARSER-WIRE V18
**Date:** 2026-05-06 (Wed PM EDT) · Round 14 P3 · Worktree B
**Anchor HEAD:** `66ace5c1a0693e27494688358b251fc8a1274435`
**Status:** ⚠ **HALT-ON-FIX-2** — cron route audit reveals 4 architecture defects · vercel.json cron entry SKIPPED per §9 STOP #4 · escalate to Devin for spec re-anchor
**Cyl 7A receiver ship:** `7f0c456` (May 2 · verified green at R14 P1)
**Cyl 7B parser ship:** `0e4b64f` (May 2 · hardened `0ce18fc`)
**Cyl 7C persister ship:** `023c54f` (May 2 · canonical-type-import `2f4dad2`)

---

## §0 · TL;DR

Cyl 7A → 7B → 7C chain is **shipped but not wired together**. Each component works in isolation; they were never connected. Adding a `vercel.json` cron schedule for `/api/cron/scraper-parse` would fire a route that:
1. **405s every fire** (Vercel cron sends GET; route only exports POST).
2. **Could not poll ScraperUsageLog** even if it received the request (no polling logic exists; route accepts pre-supplied `inputs[]` in the request body).
3. **Could not write ScraperComp** even if inputs were supplied (`processBatch` returns parsed array; never calls `persistScraperParsedItems`).
4. **Has no enqueue path from receiver** (Cyl 7A writes ScraperUsageLog telemetry only; `rawHtml` and `parsedFields` are not persisted in a queryable shape).

Per §9 STOP #4 + §8 MAY: HALT FIX 2, document gaps, escalate.

---

## §1 · Cron route state at HEAD `66ace5c`

- **File:** `app/api/cron/scraper-parse/route.ts`
- **Lines:** 95
- **Last modified commit:** `8640cdc` (CMD-VERCEL-MAXDURATION-HOTFIX V18) per file header L5
- **Earlier ship:** `0ce18fc` (extracted from parser.ts for cleaner locality · LIMIT_PER_FIRE=8)
- **Original ship:** `0e4b64f` (May 2 CMD-CYLINDER-7B-OLLAMA-GATEWAY-PARSE V18)

## §2 · Auth posture

✅ **GREEN.** Triple-source CRON_SECRET check at L33-51 (verbatim):

```ts
const authHeader = req.headers.get("authorization");
const cronHeader = req.headers.get("x-cron-secret");
const querySecret = req.nextUrl.searchParams.get("secret");
const cronSecret = process.env.CRON_SECRET;

if (!cronSecret) { return NextResponse.json({ error: "Cron not configured" }, { status: 500 }); }

const providedSecret =
  authHeader?.replace("Bearer ", "") || cronHeader || querySecret || "";
if (providedSecret !== cronSecret) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
```

Mirrors `recon-autoscan/route.ts:17-36` per route-header citation. Uses `!==` direct compare (timing-side-channel-aware-vulnerable, same class as Cyl 7E HMAC defense gap from R14 P1 audit · banked `DOC-CRYPTOGRAPHIC-CONSTANT-TIME-COMPARE`).

## §3 · Polling logic — DEFECT #1 (BLOCKING)

❌ **NONE.** The route does NOT poll `ScraperUsageLog`. It accepts pre-supplied inputs via the request body (L54-67):

```ts
let body: { inputs?: ParseInput[] };
try { body = await req.json(); } catch { return ... 400 ... }

const inputs = body?.inputs;
if (!Array.isArray(inputs)) {
  return NextResponse.json({ error: "Body must be { inputs: ParseInput[] }" }, { status: 400 });
}
const capped = inputs.slice(0, LIMIT_PER_FIRE);
```

**Spec §0 grounding asserted:** "Cron route polls `ScraperUsageLog` for unprocessed rows · invokes `parseScraperOutput()` per row · delegates to `lib/scraper-comp/persist.ts`."

**Reality:** Route is a **batch executor**, not a polling worker. Caller must supply `ParseInput[]` in the body. There is no caller — receiver does not enqueue, no other endpoint constructs inputs from ScraperUsageLog.

## §4 · HTTP method — DEFECT #2 (BLOCKING)

❌ **POST-only.** Only `export async function POST` exists (L31). No GET handler.

Vercel cron jobs send **GET** requests (per Vercel docs). Adding a cron entry to vercel.json would result in:
- Vercel hits `GET /api/cron/scraper-parse`
- Next.js returns `405 Method Not Allowed` (no GET export)
- Cron silently fails every 15 min in production · cron tab shows error · `processBatch` never fires

This alone is a hard blocker. `vercel.json` cron entry would create a permanent 405-loop in the Vercel cron dashboard.

## §5 · Parser invocation

✅ **GREEN.** L81 invokes `processBatch(capped)` from `lib/scraper-parser/parser.ts`:

```ts
const { parsed, errors } = await processBatch(capped);
return NextResponse.json({ processed: capped.length, parsed, errors });
```

`processBatch` (parser.ts:65-78) iterates `inputs[]` serially (Ollama OLLAMA_MAX_LOADED_MODELS=1 enforces this), calls `processOneRow(input)`, accumulates parsed items + errors. Each row writes a discriminator telemetry row to ScraperUsageLog (`botName: "ollama_parser_complete"` on success or `"ollama_parser_failed"` on failure).

Parser-layer behavior is correct.

## §6 · Persist invocation — DEFECT #3 (BLOCKING)

❌ **MISSING.** `processBatch` does NOT call `persistScraperParsedItems` from `lib/scraper-comp/persist.ts`.

```ts
// lib/scraper-parser/parser.ts:13-63 (processOneRow):
const result = await parseScraperOutput(input);
if (result.success && result.parsed) {
  await prisma.scraperUsageLog.create({ ... });   // discriminator row
  return { parsed: result.parsed, error: null };  // ← parsed RETURNED, not persisted
}
```

The cron route then returns `{processed, parsed, errors}` JSON to caller. Parsed comps **never reach `ScraperComp` table**.

Cross-check: `grep -rn "persistScraperParsedItems\|from.*scraper-comp/persist" lib/ app/` returned **0 callers**. The 7C persister is shipped but **completely unconnected** to the pipeline.

## §7 · Receiver enqueue — DEFECT #4 (BLOCKING)

❌ **NO ENQUEUE PATH.** Cyl 7A receiver (`app/api/webhooks/n8n/route.ts:89-103`) writes a ScraperUsageLog row with these fields ONLY:

```
botName="n8n_scraper_catch" · slug=scraperId · tier=0 · cost=0 ·
success=true · blocked=false · blockReason=null ·
compsReturned=parsedFields.compsCount ?? 0 · durationMs=0 ·
itemId=null · userId=null
```

The `payload.rawHtml` and `payload.parsedFields` are **NOT persisted**. The receiver's only forward-compat hook is a `console.log` at L106-108.

Even if the cron route had GET + polling logic, the inputs needed to fire `parseScraperOutput` (`scraperId · platform · itemUrl · rawHtml · parsedFields`) are not in any queryable storage. The receiver discards them after writing telemetry.

## §8 · Idempotency contract

❌ **PARTIAL (only at boundaries).**
- **Receiver layer (Cyl 7A):** ✅ 24h ScraperUsageLog dedupe at receipt — proven at R14 P1 audit
- **Persister layer (Cyl 7C):** ✅ `ScraperComp @@unique([slug, sourceUrl])` constraint — proven via schema
- **Cron layer (this audit):** ❌ N/A — cron has no polling, so cron-layer idempotency cannot be evaluated. Once polling is wired, cron filter must be written.

## §9 · Error handling

✅ **GREEN at the parts that exist.** Cron route wraps `processBatch` in try/catch (L80-93). Per-row failures inside `processBatch` (parser.ts:38-51) write `ollama_parser_failed` ScraperUsageLog row + return ParseError; caller continues. Parser adapter retries up to MAX_ATTEMPTS=3 with exponential backoff (BACKOFF_MS=[0, 2000, 4000]).

If polling were added, the failure path would need `parsedAt` field tracking (banked `CMD-SCRAPER-USAGE-LOG-PARSED-AT V18`) to avoid re-attempting failed rows on every cron tick.

## §10 · Telemetry

✅ **PARTIAL.** Existing telemetry:
- Cyl 7A receipt: ScraperUsageLog `botName="n8n_scraper_catch"`
- Cyl 7B parse complete: ScraperUsageLog `botName="ollama_parser_complete"` (parser.ts:20-34)
- Cyl 7B parse failed: ScraperUsageLog `botName="ollama_parser_failed"` (parser.ts:38-51)
- Cyl 7C persist: ScraperUsageLog `botName="n8n_scraper_persist"` (persist.ts:138-159)

Discriminator pattern is sound. Once chain is wired, querying by botName per scraperId reveals pipeline state for any payload. EventLog provenance via 7C persister inherits BINDING #15 DOC-EMIT-WITH-PROVENANCE through `persistEnrichmentComps`.

## §11 · vercel.json schedule — FIX 2 SKIPPED

**Pre-fire state (verified):** 6 cron entries, no `scraper-parse`. Spec §0 accurate.

```
{"crons":[
  {"path":"/api/cron/offers","schedule":"0 0 * * *"},
  {"path":"/api/cron/monthly-credits","schedule":"0 0 1 * *"},
  {"path":"/api/cron/cache-report","schedule":"0 9 * * *"},
  {"path":"/api/cron/weekly-report","schedule":"0 9 * * 1"},
  {"path":"/api/cron/subscription-renewal","schedule":"0 9 * * *"},
  {"path":"/api/cron/pricing-accuracy-sweep","schedule":"0 3 * * *"}
]}
```

**FIX 2 NOT EXECUTED.** Per spec §9 STOP #4: "STOP if cron-route audit (FIX 1) reveals ANY defect (auth missing · polling defect · idempotency gap · parser invocation missing) · DOCUMENT + ESCALATE · do NOT add vercel.json cron entry over a broken cron route."

Four blocking defects (§3, §4, §6, §7) trip this rule. Adding the cron entry would create:
- 405s every 15 min in Vercel cron dashboard (visible failure mode)
- ZERO ScraperComp rows ever (silent functional failure)
- False confidence that "the wire is live" while pipeline is dark

## §12 · Smoke harness — NOT EXECUTED

The 6-smoke chain in spec §4 Q7 cannot be run end-to-end because:
- Smoke 1 (POST receiver) ✅ would PASS (R14 P1 already proved this)
- Smoke 2 (trigger cron route) ❌ even with correct CRON_SECRET, GET against POST-only route returns 405. Spec smoke uses `curl -H "Authorization: Bearer $CRON" GET ...` per §5 FIX 3 line 322-324 — would fail.
- Smoke 3 (verify ScraperComp count ≥ 1) ❌ even if cron route accepted GET and constructed inputs from somewhere, `processBatch` does not call persister → ScraperComp count would never increment.
- Smokes 4-6 cannot meaningfully run on a broken chain.

Manually executing smoke 1 + 2 with body-bearing POST (workaround) would prove parser fires but parsed comps still wouldn't land in ScraperComp. **Skipping smoke harness execution to avoid polluting telemetry with synthetic test rows on a non-wired pipeline.**

## §13 · Cyl 7D unblock status — NOT YET

❌ **STILL BLOCKED.** Cyl 7D (CEO-side n8n GUI workflow build) needs an end-to-end live pipeline. This audit confirms three of four chain components (7A receiver · 7B parser · 7C persister) work in isolation, but the pipe is not joined. CEO trigger phrase "let's do n8n setup" remains gated until the wire cylinder lands.

---

## §14 · ESCALATION — recommended next cylinder

**`CMD-CYL-7B-WIRE-FILL V18`** (NEW · Round 14+ · ~150-250 LOC · medium scope)

Required surgical edits to close the chain:

| File | Change | LOC | Surgical lock needed? |
|---|---|---|---|
| `app/api/cron/scraper-parse/route.ts` | Add `export async function GET` that polls + delegates | ~80 | NO (file is mutable per existing CMDs) |
| `app/api/cron/scraper-parse/route.ts` | Polling: `prisma.scraperUsageLog.findMany` where `botName="n8n_scraper_catch"` AND no sibling `botName="ollama_parser_complete"` for same `slug` (or add `parsedAt` field — see below) | (above) | NO |
| `app/api/cron/scraper-parse/route.ts` | After processBatch returns, call `persistScraperParsedItems(parsed, attribution)` | (above) | NO |
| `app/api/webhooks/n8n/route.ts` | Persist `rawHtml` + `parsedFields` somewhere queryable so cron can reconstruct ParseInput. Options: (a) extend ScraperUsageLog with `payloadJson String?` field; (b) NEW model `ScraperIntake` with payload blob; (c) keep receiver lean and have n8n itself supply payload to cron via Vercel queue (not in stack) | ~10-30 | YES if (a) — schema migration needed (LOCKED prisma) |
| `prisma/schema.prisma` (option a) | Add `payloadJson String?` to ScraperUsageLog | ~1 | YES — locked file edit |
| `vercel.json` | Add cron entry | +1 line | NO |
| Audit doc update | Re-fire smokes end-to-end | n/a | n/a |

**Alternative architecture:** receiver-inline (rejected per spec §4 Q1: "Parser is CPU-heavy · inline would block n8n response · cascading retries · queue infra not in stack"). The architectural lock-in remains valid — async cron is the right pattern, just not wired.

**Recommended preferred approach:** option (a) — extend ScraperUsageLog with `payloadJson String?` (single-field migration, fully backward compatible, idiomatic with existing telemetry pattern). Cron polls rows where `botName="n8n_scraper_catch"` AND no sibling `ollama_parser_complete` exists for the slug. Banks `CMD-SCRAPER-USAGE-LOG-PAYLOAD-FIELD V18` as the schema-side cylinder.

**Schema migration banks:**
- `CMD-SCRAPER-USAGE-LOG-PAYLOAD-FIELD V18` (NEW · adds `payloadJson String?` for receiver enqueue)
- `CMD-SCRAPER-USAGE-LOG-PARSED-AT V18` (LOW · explicit parse-state tracking · alternative to discriminator-row sibling check)

## §15 · Banked carry-forwards

| Item | Priority | Rationale |
|---|---|---|
| `CMD-CYL-7B-WIRE-FILL V18` | **P0 R14+** | Closes pipeline · unblocks Cyl 7D |
| `CMD-SCRAPER-USAGE-LOG-PAYLOAD-FIELD V18` | **P0 R14+** (paired) | Receiver enqueue substrate |
| `CMD-SCRAPER-USAGE-LOG-PARSED-AT V18` | LOW | Optional simpler parse-state tracking |
| `DOC-LOCAL-MODEL-PROD-FALLBACK-POLICY` | CANDIDATE 1/5 | Production cron Ollama-availability decision (still applies once wire ships) |
| `DOC-AUDIT-CATCHES-WIRE-GAP` candidate | NEW · 1/5 | This audit demonstrates BINDING #17 DOC-AUDIT-FIRST-WIRE-PATTERN's exact value: it caught a 4-defect chain before a misleading vercel.json cron entry could ship · ratifies on 5 such catches |
| 100-item ScraperComp dashboard tile | LOW (gates on wire) | Investor-track |
| Cyl 7E HMAC defense | LOW (still pre-demo) | Includes cron route auth too |

---

## §16 · Doctrine alignment

- **DOC-AUDIT-FIRST-WIRE-PATTERN (BINDING #17)** RATIFIES — this audit is the contract for any subsequent wire. Without it, vercel.json would have shipped over a broken cron route, creating a silent functional failure visible only as 405s in Vercel cron dashboard.
- **DOC-DELEGATE-TO-CANONICAL (BINDING #16)** preserved — audit does not modify any canonical surface (parser, persister, receiver all UNTOUCHED).
- **DOC-MEASURE-BEFORE-PROMISE (#4)** APPLIED CRITICAL — every defect cited verbatim with file:line range and grep evidence.
- **DOC-PRE-STAGE-NON-IDP-PREFETCH (#5)** APPLIED — receiver + parser + persister + cron route + vercel.json + schema all read pre-edit.
- **DOC-SPEC-GROUNDING-VERIFY (#7)** APPLIED + caught spec §0 grounding inaccuracy ("polls ScraperUsageLog" was assumed, not measured).
- **DOC-BAN-ENV-FILE-DUMP** ABSOLUTE honored — `grep -c "^N8N_WEBHOOK_SECRET=" .env.local` only · `grep -c "^CRON_SECRET=" .env.local` only · zero `cat` invocations · zero secret values printed.
- **DOC-PER-AGENT-WORKTREE** PROOF POINT (4/5 progression) — fired from `/Users/ryanhallee/legacy-loop-mvp-agent-2` with own git index.
- **feedback_dont_expand_scope_without_asking** APPLIED — refused to improvise wire fill (route fix + receiver schema + caller chain) inside an audit-only spec.

---

## §17 · §12 emission anchor

Audit doc is the deliverable on this fork. FIX 1 DONE. FIX 2 SKIPPED (per §9 STOP #4). FIX 3 (smoke validation) NOT-RUN-RATIONAL (chain non-functional · would pollute telemetry).

`vercel.json` UNTOUCHED. Source code UNTOUCHED. LOCKED files UNTOUCHED.

Cached diff = 1 file (this audit doc).

---

*End of CYL_7B_PARSER_WIRE_AUDIT.md · Round 14 P3 HALT-on-FIX-2 path · escalates to Devin for `CMD-CYL-7B-WIRE-FILL V18` authoring*
