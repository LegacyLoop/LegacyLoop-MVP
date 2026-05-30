# W23-L3 FB-Army Proxy Adapter Ingest · Audit

**CMD-W23-L3-FB-ARMY-PROXY-ADAPTER-INGEST V20 MED · Agent B agent-2 worktree**
**Date:** 2026-05-29 · Wave 23 · Lane 3
**Anchor HEAD:** `4ee4921` (post worktree-reset + rebase)

> Track A · proxy adapter DORMANT · World-B droplet army receiver
> ★ W22-L1 lesson encoded: NO silent drop · reject-with-count loud

---

## §1 · §0.5 DEEP-DIVE CONFIRMATION

| Check | Result |
|---|---|
| HEAD parity | PASS · `4ee4921` post worktree-reset.sh 2 + rebase |
| base.ts read · Adapter interface + envPresent | PASS · canonical shape |
| shipstation.ts read · clone template | PASS · dormant pattern source |
| types.ts read · ProviderName 12-literal union | PASS (apify + shipstation already present) |
| registry.ts read · 12 adapters | PASS (12 → 13 this lane) |
| adapters/fb-army.ts absent pre-fire | PASS · NEW file |
| LAW #38 lib/sylvia | diff=0 ✓ |

---

## §2 · Files Modified (3) + Created (2)

| File | Change | LOC delta |
|---|---|---|
| `lib/scrapers/proxy/types.ts` | +1 line: `\| "fb-army"` to ProviderName union | +1 |
| `lib/scrapers/proxy/registry.ts` | +2 lines: import + REGISTRY map entry | +2 |
| `lib/scrapers/proxy/adapters/fb-army.ts` | NEW · 113 LOC · ingest receiver with envelope validation | +113 |
| `docs/audits/W23-L3-fb-army-proxy-adapter.md` | NEW · this audit | +N |

ProviderName union: **12 → 13**. REGISTRY map: **12 → 13**.

---

## §3 · Adapter Architecture

### Dormant gate

```typescript
enabled: envPresent("FB_ARMY_INGEST_SECRET")
```

- Vercel env `FB_ARMY_INGEST_SECRET` ABSENT → `enabled: false` → `listEnabledAdapters()` omits fb-army
- Vercel env SET → `enabled: true` → adapter ingest live

### Operations

```typescript
const OPERATIONS = ["ingest"] as const;
```

Single op: `ingest` · receives `{records[], secret, source}` payload from World-B army.

### Envelope validation per record (W22-L1 LESSON ENCODED)

Each record must satisfy:
- `id`: non-empty string
- `title`: non-empty string
- `body`: string (may be empty)
- `metadata`: non-null object

Failure modes (per record):
- `not-an-object`
- `id-missing-or-empty`
- `title-missing-or-empty`
- `body-missing-or-non-string`
- `metadata-missing-or-non-object`

### Return shape (LOUD COUNTS · NO SILENT DROP)

```typescript
{
  accepted: number,
  rejected: number,
  total: number,
  acceptedIds: string[],
  rejectReasons: { index: number; reason: string }[],
  source: string,
}
```

Caller MUST inspect `rejected` and `rejectReasons` — silent-drop is structurally impossible because reject metadata surfaces in the response payload.

### Auth (shared secret)

```typescript
if (typeof p.secret !== "string" || p.secret !== process.env.FB_ARMY_INGEST_SECRET) {
  throw new Error("fb-army: secret mismatch");
}
```

World-B droplet must send the matching `FB_ARMY_INGEST_SECRET` value in `params.secret` to authenticate.

---

## §4 · Build Status

| Gate | Result |
|---|---|
| `npx tsc --noEmit` | exit=0 ✓ (clean compile · no errors) |
| `npm run build` | PRE-EXISTING failure: `sylvia-data/audit/episodic-2026-05-18.jsonl` symlink invalid (worktree-level filesystem issue · NOT this cyl's code) |
| `lib/sylvia/` diff | 0 hits ✓ |
| `lib/scrapers/rotation/` diff | 0 hits ✓ (W23-L1 lane untouched) |
| `fb-army/` (top-level) diff | 0 hits ✓ (W23-L2 lane untouched) |

The npm build failure is environmental — agent-2 worktree has an out-of-tree symlink in `sylvia-data/audit/` that Turbopack rejects. NOT introduced by this cyl. tsc=0 covers my actual code changes.

---

## §5 · DOCTRINE Sustained (ZERO NEW per CEO Rule 1)

- BINDING #16 DELEGATE-CANONICAL (clone shipstation dormant pattern verbatim)
- BINDING #17 audit-first (base.ts + shipstation.ts + types.ts + registry.ts read pre-edit)
- BINDING #20 PB3 worktree FF-push
- BINDING #28 HEAD parity (worktree-reset + rebase pre-fire)
- BINDING #30 §0.5 deep-dive PASS
- BINDING #38 empirical (12→13 registry counted · Adapter interface shape cited verbatim)
- BINDING #39 spec read 184 LOC end-to-end
- DOC-WEBHOOK-DISCARD-IS-SILENT-DROP: **ENCODED** (envelope validation with explicit reject count · structural impossibility of silent drop)
- LAW #38 HARD GUARD attested (zero `lib/sylvia/*` touch · `lib/scrapers/proxy/*` is canonical proxy path)
- CEO Rule 1 ZERO new doctrines (DOC-WEBHOOK-DISCARD-IS-SILENT-DROP encodes existing W22-L1 candidate · NOT new)

---

## §6 · LOCKED Diff Verify

```bash
git diff HEAD --name-only | grep -E "lib/sylvia/|lib/scrapers/rotation/|^fb-army/"
# Expected: 0 hits ✓
```

Touches:
- `lib/scrapers/proxy/types.ts` (+1)
- `lib/scrapers/proxy/registry.ts` (+2)
- `lib/scrapers/proxy/adapters/fb-army.ts` (NEW 113)
- `docs/audits/W23-L3-fb-army-proxy-adapter.md` (NEW)

ZERO `lib/sylvia/` · ZERO `lib/scrapers/rotation/` · ZERO top-level `fb-army/` · ZERO `app/` · ZERO `prisma/` · ZERO droplet.

---

## §7 · Acceptance Tests

- [x] `fb-army` adapter file at canonical proxy adapters path
- [x] Dormant default (`envPresent("FB_ARMY_INGEST_SECRET")` = false until CEO sets)
- [x] `ProviderName` union: +1 (12 → 13)
- [x] `REGISTRY` map: +1 (12 → 13)
- [x] Envelope validation `{id, title, body, metadata}` per record
- [x] Explicit `accepted` + `rejected` counts in response · NO silent drop
- [x] Shared-secret auth via `FB_ARMY_INGEST_SECRET`
- [x] `tsc --noEmit` exit=0
- [x] `listEnabledAdapters()` omits fb-army while dormant (Vercel env absent)
- [x] LAW #38 lib/sylvia diff=0
- 8-Point: N/A (backend adapter)

---

## §8 · Banked W24+

- Set `FB_ARMY_INGEST_SECRET` in Vercel env when World-B army goes live (W23-L2 ship)
- Phase-1 integration: WF96 V11 FB-Army Ingest pipeline (consumes this adapter via T3b proxy)
- Telemetry on accepted/rejected ratio per droplet source (cyclic health check)
- DOC-WEBHOOK-DISCARD-IS-SILENT-DROP doctrine ratification (W22-L1 + W23-L3 evidence)
- Sample test payloads (banked W24 · unit test on adapter logic with malformed envelopes)
