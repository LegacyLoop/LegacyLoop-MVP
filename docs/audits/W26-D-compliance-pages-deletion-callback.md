# W26-D · Compliance Pages Harden + Meta Data-Deletion Callback

**CMD:** CMD-W26-D-COMPLIANCE-PAGES-DELETION-CALLBACK · V20 MED · Track A
**Date:** 2026-05-30 · **Agent:** C (agent-3) · **Anchor:** origin/main `7b0e965` (post W26-A) · **Budget:** $0
**★ App Review gate** — Meta clicks these URLs; 404 / missing clause = rejection.

---

## §0.5 IT Deep-Dive (BINDING #30)

- **Lane A green:** W26-A landed (`sylvia-data` symlink → real empty dir); worktree build unblocked. (My W25-L4 P0 flag resolved.)
- **Existing pages READ** (additive only, no rewrite): `app/privacy/page.tsx` (31KB, §7 "Facebook and Meta Platform"), `app/terms/page.tsx` (26KB), `app/data-deletion/page.tsx` (9KB, 30-day table + email + Meta section).
- **HMAC pattern mirrored** from `lib/messaging/meta/verify-signature.ts` (W25-L2 · `createHmac` + `timingSafeEqual`, BINDING #16). App secret = `META_APP_SECRET || FACEBOOK_CLIENT_SECRET` (mirrors messenger route).
- **LOCKED untouched:** globals/layout/components/schema/sylvia/other routes.

### Peg §3.1 clause checklist (privacy) — present(✓) / added(＋)

| Clause | Before | After |
|---|---|---|
| Facebook Login data | ✗ | ＋ (§7a) |
| Page connection data | partial | ＋ explicit (§7a) |
| Instagram data | ✓ | ✓ + explicit (§7a) |
| Messenger data | ✗ | ＋ (§7a) |
| Use / storage-encrypted / retention | partial | ＋ explicit (§7a) |
| Third parties | ✓ | ✓ |
| User rights | ✓ (§8) | ✓ |
| Children / CCPA / GDPR | ✓ | ✓ |
| Last updated | ✓ (line 45) | ✓ |
| `privacy@legacy-loop.com` | ✗ (only support@) | ＋ (privacy + data-deletion pages) |

---

## FIX 1–7

| FIX | File | Action |
|---|---|---|
| 1 | `app/privacy/page.tsx` | HARDEN (additive) — new §7a "Meta data we receive": FB Login / Page / IG / Messenger data + storage&retention + deletion contact (`privacy@`). Existing content preserved. |
| 2 | `app/data-deletion/page.tsx` | HARDEN (additive) — auto deletion-callback note + status-page link; `privacy@` added to contact. Existing 30-day table / steps preserved. |
| 3 | `lib/meta/signed-request/verify.ts` (NEW) | Parse `sig.payload`, HMAC-SHA256 vs app secret, `timingSafeEqual`, decode payload → `user_id`. Returns null on any failure. |
| 4 | `app/api/meta/data-deletion-callback/route.ts` (NEW) | POST: parse `signed_request` (form/JSON) → verify → run job → `{url, confirmation_code}`. Invalid sig → **403**. Unconfigured secret → 500. |
| 5 | `app/data-deletion-status/page.tsx` (NEW) | No-auth status page; reads `?code=`/`?id=`; validates `del_<24hex>`; shows confirmed/unknown state + `privacy@`. Theme/senior/mobile. |
| 6 | `lib/meta/data-deletion/job.ts` (NEW) | ZERO schema — by `facebookId`: delete meta-inbox sentinel Items + their Conversations/Messages/Offers (FK order), delete ConnectedPlatform (fb/ig), clear `User.facebookId`. Idempotent; never throws; audit via `console`. |
| 7 | — | tsc=0 · build PASS · curl 4 pages + callback 200/403 · ship. |

**Confirmation code:** `del_` + sha256(`user_id|appSecret`).slice(24) — deterministic, non-reversible.

---

## Acceptance

- 4 pages 200 HTTPS no-auth: `/privacy` `/terms` `/data-deletion` `/data-deletion-status`
- Privacy has every §3.1 clause (checklist above)
- Callback: valid sig → `{url, confirmation_code}` 200; invalid → 403
- Deletion job operates on existing models (no migration); audit logged
- tsc=0 · LOCKED diff 0

## FLAGS (V15 6-bullet)

1. **Status page is stateless** (ZERO schema): confirms request + shows code, but cannot show per-request live progress without a status table. Compliant for App Review (URL reachable + clear status). Bank: optional `MetaDeletionRequest` model for true per-code tracking.
2. **Deletion is synchronous** in the callback (runs job inline). Fine at current volume; bank async queue if Meta deletion traffic grows.
3. **App secret env:** uses `META_APP_SECRET || FACEBOOK_CLIENT_SECRET`. Confirm `META_APP_SECRET` set in Vercel prod for live callback (else falls back to FB client secret).
4. **Legal sign-off NOT claimed** — clause copy is additive/compliant-intent; CEO/legal owns final review (§Z).
5. **Additive only** — zero destructive rewrite of existing pages; existing copy preserved verbatim.
6. **Zero schema · zero LOCKED · $0.**

## FLAG ROUTING (8-cat)

- MetaDeletionRequest model (per-code tracking) → **STANDALONE** future cyl
- META_APP_SECRET prod env → **RYAN-SIDE / Vercel env**
- Legal clause review → **RYAN-SIDE (legal)**
- App Review submission → **MC W26 scorecard**

**Connecting Generations · Built in Maine · World-class everywhere.**
