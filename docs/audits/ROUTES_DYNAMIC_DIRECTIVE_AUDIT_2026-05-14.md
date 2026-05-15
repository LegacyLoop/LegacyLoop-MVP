# Routes Dynamic Directive Audit · 2026-05-14 · R29 P39 Wave 4 Slot 3

> **Status:** Preventive audit · doc-only · zero TS edit this cyl
> **Anchor:** P36 §12 build failure on /search/page static-gen · 2 production catches W3 (P33 + P35)
> **Scope:** all 89 `app/**/page.tsx` routes · classify force-dynamic need
> **Verdict:** **10 MUST-ADD · 33 SHOULD-ADD · 44 SAFE · 2 already DYN-OK**
> **Recommended fix cyl:** `CMD-ROUTES-DYNAMIC-BATCH-FIX V19` · **🔴 P0** (MUST-ADD count = 10 > 5 threshold)

---

## Audit method

Per-route grep probe (per spec §5 FIX 2 matrix):
- `HAS_DYN`: count of `export const dynamic = "force-dynamic"`
- `FINDMANY`: count of `prisma.*.findMany`
- `FINDUNIQ`: count of `prisma.*.find(Unique|First)`
- `TAKE_NUM`: max numeric value of `take: N`
- `INCLUDE_NEST`: count of `include: {`
- `COOKIES`: count of `cookies()` / `headers()` / `searchParams`
- `SESSION`: count of `getSession` / `authAdapter` / `getServerSession`

Classification logic:
- 🟢 **DYN-OK**: `HAS_DYN >= 1` (already shipped)
- 🟢 **SAFE**: `FINDMANY = 0` AND `FINDUNIQ = 0` (no Prisma surface · Next.js auto-detects dynamic from cookies/searchParams/auth · no directive needed)
- 🟡 **SHOULD-ADD**: Prisma query present but lightweight (`TAKE_NUM ≤ 50` AND `INCLUDE_NEST < 2`) · low static-gen risk · consistency win
- 🔴 **MUST-ADD**: Heavy query (`TAKE_NUM > 50` OR `INCLUDE_NEST >= 2`) · static-gen WILL timeout per /search-class pattern · BATCH FIX IMMEDIATELY

---

## Per-route classification

### 🔴 MUST-ADD · 10 routes · force-dynamic CRITICAL

| Route | findMany | findUnique | take | nested include | session |
|---|---|---|---|---|---|
| `app/analytics/page.tsx` | 3 | 1 | 1 | 2 | 2 |
| `app/bots/buyerbot/page.tsx` | 1 | 0 | 10 | 2 | 2 |
| `app/bots/listbot/page.tsx` | 3 | 3 | 5 | 2 | 2 |
| `app/bots/reconbot/page.tsx` | 1 | 0 | 5 | 2 | 2 |
| `app/bundle/[slug]/page.tsx` | 1 | 2 | 0 | 3 | 0 |
| `app/dashboard/page.tsx` | 6 | 1 | 50 | 9 | 2 |
| `app/messages/page.tsx` | 2 | 0 | 1 | 2 | 2 |
| `app/projects/[id]/page.tsx` | 1 | 1 | 50 | 3 | 2 |
| `app/projects/page.tsx` | 2 | 0 | 50 | 2 | 2 |
| `app/white-glove/[projectId]/page.tsx` | 1 | 1 | 50 | 2 | 2 |

**Worst offender:** `app/dashboard/page.tsx` — 6 findMany + 9 nested includes. Highest static-gen catastrophe probability.

### 🟡 SHOULD-ADD · 33 routes · consistency / lightweight risk

| Route | Reason |
|---|---|
| `app/admin/heroes/page.tsx` | findMany w/ session |
| `app/admin/page.tsx` | 4 findMany, take 50 |
| `app/admin/pricing-accuracy/page.tsx` | 7 findMany, take 7 |
| `app/admin/quotes/page.tsx` | findMany w/ session |
| `app/archives/page.tsx` | findMany + include 1 |
| `app/billing/page.tsx` | findMany take 50 |
| `app/bots/analyzebot/page.tsx` | findMany take 5 |
| `app/bots/antiquebot/certificate/[itemId]/page.tsx` | findUnique include 1 |
| `app/bots/antiquebot/page.tsx` | findMany take 1 |
| `app/bots/carbot/page.tsx` | findMany lightweight |
| `app/bots/collectiblesbot/page.tsx` | findMany lightweight |
| `app/bots/megabot/page.tsx` | findMany lightweight |
| `app/bots/photobot/page.tsx` | findMany lightweight |
| `app/bots/pricebot/page.tsx` | findMany lightweight |
| `app/bots/shipbot/page.tsx` | findMany lightweight |
| `app/bots/videobot/page.tsx` | findMany lightweight |
| `app/connected-accounts/page.tsx` | findMany lightweight |
| `app/contractors/page.tsx` | findMany lightweight |
| `app/credits/page.tsx` | findUnique session |
| `app/donate/page.tsx` | findMany lightweight |
| `app/home/page.tsx` | findMany lightweight |
| `app/integrations/page.tsx` | findMany lightweight |
| `app/items/[id]/edit/page.tsx` | findUnique session |
| `app/items/[id]/page.tsx` | findUnique session |
| `app/profile/page.tsx` | findUnique session |
| `app/referral/page.tsx` | findMany lightweight |
| `app/sale/[projectId]/page.tsx` | findUnique session |
| `app/settings/page.tsx` | findUnique session |
| `app/shipping/bol/[itemId]/page.tsx` | findUnique session |
| `app/store/[userId]/item/[itemId]/page.tsx` | findUnique session |
| `app/store/[userId]/page.tsx` | findMany lightweight |
| `app/subscription/page.tsx` | findUnique session |
| `app/white-glove/page.tsx` | findMany lightweight |

### 🟢 DYN-OK · already shipped force-dynamic

| Route | Source |
|---|---|
| `app/items/[id]/dossier/page.tsx` | pre-existing (CEO-routed) |
| `app/search/page.tsx` | P36 §12 hotfix · canonical pattern reference |

### 🟢 SAFE · 44 routes · no Prisma surface · no action needed

`app/about` · `app/addons/buyer-outreach` · `app/addons/listing-optimizer` · `app/addons/market-report` · `app/api-access` · `app/auth/forgot-password` · `app/auth/login` · `app/auth/reset-password` · `app/auth/signup` · `app/bots` · `app/bundles/create` · `app/bundles` · `app/buyers` · `app/changelog` · `app/coming-soon` · `app/data-deletion` · `app/help/[slug]` · `app/help` · `app/heroes/apply` · `app/heroes` · `app/items/new` · `app/items` · `app/marketplace` · `app/offers/[token]` · `app/onboarding/quiz` · `app/onboarding/results` · `app/page.tsx` (root) · `app/payments` · `app/payments/success` · `app/pricing` · `app/privacy` · `app/quote` · `app/receipts/[id]` · `app/returns/[token]` · `app/services/neighborhood-bundle` · `app/shipping` · `app/shortcuts` · `app/spending` · `app/store` · `app/terms` · `app/testimonials` · `app/veterans` · `app/voice` · `app/whats-new`

Next.js 16 auto-detects dynamic from cookies/searchParams/headers/auth. Directive optional but not required.

---

## Recommended batch fix cyl

### CMD-ROUTES-DYNAMIC-BATCH-FIX V19 · 🔴 P0

- **Scope:** add `export const dynamic = "force-dynamic"` to all 10 MUST-ADD routes
- **Runtime:** ~5 min per route × 10 = ~50 min (single-line edit per file · proven canonical from P36)
- **Risk:** minimal · additive · zero deletion · proven pattern
- **Fire-as:** Wave 5 Slot 1 SOLO (priority P0 · pre-demo blocker)
- **Verification:** post-batch · curl each route fast OR `next build` succeeds on all 10 without static-gen timeout

### Banked follow-ups

- ✅ **CMD-ROUTES-DYNAMIC-CONSISTENCY-SWEEP V19** — 33 SHOULD-ADD batch CLOSED R29 P46 Wave 8 Slot 2 (commit `2f71057`)
- ✅ **CMD-NEXT-CONFIG-OUTPUT-DYNAMIC-DEFAULT V20** — investigation CLOSED R29 P51 Wave 9 Slot 3 · verdict 🔴 NOT-EXISTS · `output: dynamic` not a Next.js 16 config value · per-route directive remains canonical · see `NEXT_CONFIG_OUTPUT_DYNAMIC_AUDIT_2026-05-15.md`
- ✅ **/messages + /projects query profile audit** R29 P53 Wave 10 Slot B · verdict cite → `MESSAGES_PROJECTS_QUERY_AUDIT_2026-05-15.md` · 🔴 1 MUST-ADD (/messages stats-split HIGH) · 🟡 1 SHOULD-ADD (/projects/[id] include-trim MED) · 🟢 1 CLEAN-WITH-CAVEAT (/projects future-scale LOW) · P50 §12 Opportunity flag CLOSED

---

## Cross-references

- P36 §12 (search/page hotfix · canonical force-dynamic pattern)
- P37 §12 (runtime timeout diagnose · separate class · `docs/audits/RUNTIME_TIMEOUT_DIAGNOSE_2026-05-14.md`)
- `app/search/page.tsx` + `app/items/[id]/dossier/page.tsx` (reference patterns)
- BINDING #28 DOC-AUDIT-DOC-DRIFT-CATCH (this audit IS class-closure application)
- BINDING #33 DOC-FLAG-RIDER-PER-CYLINDER (first post-ratify application this cyl)

---

## Audit verdict summary

| Class | Count | Action |
|---|---|---|
| 🟢 DYN-OK | 2 | already shipped |
| 🟢 SAFE | 44 | no action |
| 🟡 SHOULD-ADD | 33 | banked consistency sweep MED |
| 🔴 MUST-ADD | 10 | **batch fix cyl 🔴 P0** |
| **Total** | **89** | — |

**/search-class catastrophe recurrence risk:** CLOSED via this audit. Batch fix cyl closes operationally.

---

*Last updated: 2026-05-14 (Thu) · R29 P39 Wave 4 Slot 3 · agent-2 worktree*
