# W25-META-L1 · Meta Lead Ads → BuyerBot — Implementation Artifact

**CMD:** CMD-W25-META-L1-LEAD-ADS-BUYERBOT V20 HIGH
**Date:** 2026-05-30
**Worktree:** T1 MAIN · direct-push
**Anchor HEAD:** `6b91733` → `<post-commit>`

---

## What This Lane Built

World-A (official Meta channel) Lead Ads pipeline:

```
Meta Lead Ads form submission
       │
       ▼
POST /api/webhooks/meta/leadgen   ← X-Hub-Signature-256 HMAC verify
       │
       ▼
fetchAndPersistLead()              ← lib/meta/leads.ts
       │   GET graph.facebook.com/v21.0/{leadgenId}?fields=...
       │   (idempotent on BuyerLead.leadgenId @unique)
       ▼
prisma.buyerLead.create({ source: "lead_ad", ... })
       │
       ▼
sendLeadCapiEvent()                ← lib/meta/capi.ts
   POST graph.facebook.com/{pixelId}/events
   (SHA-256 hashed em/ph · event_id=leadgenId for dedup)
```

GET handshake separate: `hub.mode=subscribe` + `hub.verify_token` echo.

---

## Files

| Path | Change | Lines |
|---|---|---|
| `prisma/schema.prisma` | ADDITIVE · BuyerLead: `botId` now `String?` + `bot BuyerBot?`; new `source/leadgenId@unique/formId/pageId/rawJson` + `@@index([source])` | +6/-2 |
| `app/api/webhooks/meta/leadgen/route.ts` | NEW · GET verify + POST signed receive · HMAC-SHA256 constant-time compare | 122 |
| `lib/meta/leads.ts` | NEW · Graph fetch + idempotent upsert + CAPI fire-and-forget | 121 |
| `lib/meta/capi.ts` | NEW · CAPI Lead event · SHA-256 hashed PII · dedup id=leadgenId | 89 |
| `app/api/bots/lead/[leadId]/route.ts` | SCOPE-FORCED · `lead.bot` now nullable · split owner check (bot-path vs lead-ad-path via Item.userId) | +13/-1 |

LOCKED (verified `git diff HEAD --name-only`): `lib/sylvia/` = 0 · `lib/adapters/` = 0 · `lib/bots/` = 0 · `app/api/auth/` = 0 · `app/globals.css` = 0 · `app/layout.tsx` = 0 · `app/components/` = 0.

---

## §0.5 Empirical Findings (BINDING #30)

| Anchor | Reality |
|---|---|
| HEAD pre-pull | `3c01d62` · behind 1 |
| Pull | FF · landed `6b91733` (W24-L2 sylvia memory recovery inbound) |
| BuyerLead schema | `prisma/schema.prisma:705` · 30 fields · `botId String` REQUIRED + FK |
| Stripe webhook pattern | `app/api/webhooks/stripe/route.ts:18-35` · raw-body + sig + secret + graceful 500 on missing |
| Existing Meta webhook | NONE (`app/api/webhooks/` has arta/square/n8n/stripe only) |
| `lib/meta/` | absent · NEW |
| Existing BuyerLead callers | 6 files · 4 write `botId: bot.id` (still valid · String? accepts String) · 1 reader at `app/api/bots/lead/[leadId]/route.ts:26` accesses `lead.bot.item.userId` (scope-forced fix) |
| tsc baseline | 0 errors |

### ⚠️ DRIFT FLAG · `.env.local` Meta Keys

Spec §0 grounded: "Meta env wired (`META_APP_ID/SECRET`, `META_DEV_ACCESS_TOKEN`, `FACEBOOK_GRAPH_TOKEN`)."

Empirical (BINDING #5 count-only grep):
- Present: `FACEBOOK_CLIENT_ID` · `FACEBOOK_CLIENT_SECRET` (OAuth login pair only)
- Absent locally: `META_APP_ID` · `META_APP_SECRET` · `META_DEV_ACCESS_TOKEN` · `FACEBOOK_GRAPH_TOKEN` · `META_VERIFY_TOKEN` · `META_PAGE_ACCESS_TOKEN` · `META_PIXEL_ID` · `META_CAPI_ACCESS_TOKEN`

May exist in Vercel dashboard (not verified · `vercel env pull` would expose values · BINDING #9 declined).

**PUSH-BACK-WITH-REPLACEMENT (BINDING #31):** Did NOT halt. All three routes/modules gate on env-presence and return HTTP 503 with clear `"X not configured"` reason (mirrors stripe route 500-on-missing pattern at line 24-27). Code ships structurally complete · activation = CEO drops keys in Vercel · zero code change required.

### Required Env Keys (for live activation · CEO Vercel dashboard)

```
META_VERIFY_TOKEN            # arbitrary string · matches Meta webhook subscription verify_token field
META_APP_SECRET              # Facebook app secret · used for X-Hub-Signature-256 HMAC verify
META_PAGE_ACCESS_TOKEN       # page-scoped token with leads_retrieval permission
META_PIXEL_ID                # CAPI dataset/pixel id (numeric)
META_CAPI_ACCESS_TOKEN       # CAPI system-user token with ads_management scope
META_GRAPH_VERSION           # optional · default "v21.0"
META_CAPI_TEST_EVENT_CODE    # optional · enables Meta Events Manager test-event panel
META_LEAD_AD_DEFAULT_ITEM_ID # placeholder Item id for unrouted lead-ad leads · banked: per-form binding cyl
```

---

## Idempotency + Safety

- **leadgenId uniqueness** · `BuyerLead.leadgenId @unique` enforces single-write per Meta lead.
- **Webhook always-200 on signed receipt** · per-lead status in response body · Meta does not retry endlessly.
- **HMAC constant-time compare** · `crypto.timingSafeEqual` prevents timing-attack on signature verify.
- **PII hashing** · CAPI receives SHA-256 of lowercase-trimmed email + digits-only phone (spec-compliant).
- **CAPI fire-and-forget** · failure logs but does not block lead persistence (lead row is the source of truth).
- **botId optional** · lead-ad leads have no item-bot · `Item.userId` is the authorization anchor instead.

---

## Doctrine Self-Audit

| BINDING | Status |
|---|---|
| #5 ENV-FILE-DUMP | APP · `grep -cE` count-only · no values logged |
| #6 DEV-PROD-DB-ISOLATION | APP · `prisma db push` on `dev.db` only · Turso prod migration deferred to CEO |
| #9 PASSWORD-PASTE | APP · no secrets in commit · all values via `process.env` |
| #10 TELEMETRY-LOCK | N/A (this lane is webhook ingress · not AI egress) |
| #12 INDEX-ISOLATION | APP · `git diff --cached --stat` pre-commit · scoped `git add` |
| #16 DELEGATE-CANONICAL | APP · cloned stripe route raw-body+sig+secret+guard pattern |
| #17 AUDIT-FIRST-WIRE | APP · §0.5 read all 6 anchor files before write |
| #21 VERIFY-VERCEL | APP · post-commit cite dpl + curl |
| #28 AUDIT-DOC-DRIFT | APP · spec env-wired claim vs empirical absent · flagged in §12 + this artifact |
| #30 IT-DEEP-DIVE | APP · §0.5 cited in §12 PART A |
| #31 PUSH-BACK-WITH-REPLACEMENT | APP · env-gap → 503-on-missing replacement path (not halt) |
| #38 LAW lib/sylvia LOCKED | APP · 0 diff attested |
| Rule #11 DOC-META-SAFETY-ABSOLUTE | APP · World-A only · zero scraping · official Meta channel · no FB-Army touch |

---

## Banked Follow-ups

1. **Per-form Item binding** · `formId` → Item routing rule (currently lands at `META_LEAD_AD_DEFAULT_ITEM_ID` placeholder).
2. **Turso prod schema sync** · CEO-approved push of additive BuyerLead fields to Turso (BINDING #6 OP-B path).
3. **CAPI test-event panel verification** · run with `META_CAPI_TEST_EVENT_CODE` set · cite Meta Events Manager receipt.
4. **BuyerBot dashboard lead-ad surface** · display leads where `source="lead_ad"` separately (UX banked).
5. **Webhook subscription registration** · CEO subscribes Meta app to `leadgen` field at page level · webhook URL = `https://app.legacy-loop.com/api/webhooks/meta/leadgen`.

---

**Connecting Generations · World-A only · ban-proof by construction.**
