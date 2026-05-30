# W26-B · Page-Scope OAuth + AES-256-GCM Token Vault
**Date:** 2026-05-30 · **Lane:** Track A · Wave 26 · Lane B · **Agent:** A (agent-1)
**Spec:** CMD-W26-B-PAGE-SCOPE-OAUTH-PLUS-VAULT V20 MED · anchor `d355cc6`
**Status:** 🟢 GREEN

---

## Objective

Per-user Facebook Page connection via the **Business app** (Peg §1 two-app
architecture). Consent → callback → long-lived user token → Page tokens →
**AES-256-GCM encrypt at rest** (KMS-ready) → upsert
`ConnectedPlatform.settingsJson` → Instagram Business detect → 401/190
broken-marker. Operator activates by configuring `META_BUSINESS_APP_*` +
`TOKEN_ENCRYPTION_KEY_ID` (+ key material) on Vercel.

## §0.5 Empirical Findings (BINDING #30)

| Probe | Result |
|---|---|
| Lane A `d355cc6` build PASS | Vercel `dpl_7icit7pl4` ● Ready · canonical |
| `prisma/schema.prisma:132` `ConnectedPlatform` | `settingsJson String @default("{}")` + `@@unique [userId, platform]` — additive merge target ready |
| `lib/meta/graph.ts` exports | `graphGet`, `exchangeLongLivedToken`, `listPages`, `parseUsage`, `MetaPage`, `GraphResult` — sufficient to compose Business-app exchange without touching graph.ts |
| `app/api/auth/facebook/{callback,init}` | Login app · ABSOLUTE LOCKED · untouched |
| `app/api/integrations/connect/route.ts` POST | settingsJson additive merge pattern · same pattern reused in new callback |
| ENV: `META_BUSINESS_APP_ID/SECRET/REDIRECT_URI` | ABSENT (local + Vercel) — operator post-merge |
| ENV: `TOKEN_ENCRYPTION_KEY_ID` + `TOKEN_ENCRYPTION_KEY_<ID>` | ABSENT — operator post-merge (Phase-1 env-loaded; Phase-2 swap to KMS) |

## Design Decisions

| Decision | Rationale |
|---|---|
| **Two-app separation** | Peg §1 absolute · Login app (`FACEBOOK_CLIENT_*`) untouched; Business app new credentials |
| **AES-256-GCM via Node `crypto`** | Built-in · zero deps · authenticated encryption · 12-byte IV per Peg §7.1 |
| **Versioned bundle `v1:<iv>:<tag>:<ct>:<keyId>`** | Survives key rotation — keyId baked into payload so old payloads decrypt with old key material |
| **KMS-ready abstraction** | `loadKeyMaterial(keyId)` reads `TOKEN_ENCRYPTION_KEY_<ID>` env now · swap body for KMS Decrypt in Phase-2 with zero call-site changes |
| **CSRF state = `<userId>.<nonce>.<hmac(secret)>`** | Stateless — no session-store hop · constant-time verify |
| **Reuse `graph.ts::listPages` + `graphGet`** | BINDING #16 delegate-to-canonical · graph.ts UNTOUCHED |
| **Sentinel single-Page MVP** | Phase-1 picks first Page from `/me/accounts` · multi-page picker banked |
| **IG detect non-fatal** | Page connection success path never blocked by IG account absence |
| **Auto-upsert `instagram` row when IG biz detected** | Same Page Access Token serves IG Messaging — single connect flow covers both platforms |
| **NEVER persist plaintext tokens** | encrypt at moment of write · decrypt only at moment of API call (Peg §5.3) |

## Files

### NEW

| Path | Purpose |
|---|---|
| `lib/crypto/page-tokens/encrypt.ts` | AES-256-GCM encrypt · versioned bundle · key by id |
| `lib/crypto/page-tokens/decrypt.ts` | counterpart decrypt · format-version + GCM auth verify |
| `lib/meta/oauth/page-consent.ts` | consent URL (10 scopes · CSRF state · `auth_type=rerequest`) · `verifyPageConsentState` |
| `lib/meta/oauth/page-token-exchange.ts` | Business app credential loader + code→short→long-lived exchanges |
| `lib/meta/oauth/ig-business-detect.ts` | `GET /{page-id}?fields=instagram_business_account` |
| `lib/meta/oauth/connection-health.ts` | 401/190 broken-marker (idempotent · isActive→false) |
| `app/api/integrations/facebook/connect/consent/route.ts` | GET → 302 to Meta OAuth dialog |
| `app/api/integrations/facebook/connect/callback/route.ts` | GET → exchange · listPages · IG detect · encrypt · upsert |
| `docs/audits/W26-B-page-scope-oauth-plus-vault.md` | this audit |

### MODIFIED

NONE. `lib/meta/graph.ts` reused READ-ONLY (BINDING #16).

### SCHEMA: NONE · PKG: NONE (Node crypto)

## 10 Phase-1 Scopes (Peg §5.2 · exact order)

1. `pages_show_list`
2. `pages_read_engagement`
3. `pages_manage_posts`
4. `pages_manage_metadata`
5. `pages_read_user_content`
6. `pages_messaging`
7. `instagram_basic`
8. `instagram_content_publish`
9. `instagram_manage_messages`
10. `instagram_manage_comments`

## ENV Keys Required (operator post-merge)

| Key | Purpose | Required |
|---|---|---|
| `META_BUSINESS_APP_ID` | Business-app client_id | yes |
| `META_BUSINESS_APP_SECRET` | Business-app client_secret + CSRF state HMAC | yes (SECRET) |
| `META_BUSINESS_REDIRECT_URI` | exact match: `https://legacy-loop.com/api/integrations/facebook/connect/callback` | yes |
| `TOKEN_ENCRYPTION_KEY_ID` | KMS-ready identifier of the active data key | yes |
| `TOKEN_ENCRYPTION_KEY_<ID>` | base64-encoded 32 raw bytes (Phase-1 env; Phase-2 KMS) | yes (SECRET) |
| `META_GRAPH_API_VERSION` | default `v21.0` | optional |
| `META_OAUTH_DIALOG_BASE_URL` | override `https://www.facebook.com` | optional |

Without these the consent route returns 503 and the callback fails closed.

## Acceptance

- [x] tsc=0
- [x] Login app routes (`app/api/auth/facebook/**`) untouched
- [x] `lib/meta/graph.ts` untouched (reuse only)
- [x] `prisma/schema.prisma` untouched · ZERO migration
- [x] Consent URL has 10 scopes + state + `auth_type=rerequest`
- [x] CSRF state HMAC verify · constant-time compare
- [x] Code → short → long-lived exchange chain (Business app creds)
- [x] Page tokens encrypted at rest before persist (AES-256-GCM)
- [x] IG Business account detected + auto-upserts `instagram` ConnectedPlatform row
- [x] 401/190 helper marks `connection_broken=true` + `isActive=false`
- [x] Tokens never logged · never persisted plaintext
- [x] Phase-2 KMS swap = single-function change (`loadKeyMaterial`)

## Doctrine

| BINDING / Rule | Applied |
|---|---|
| #5 ENV-FILE-DUMP | grep -cE name-only env probes · no value dumps |
| #6 DEV-PROD-DB-ISOLATION | reuses ConnectedPlatform via Prisma · same model dev + prod |
| #16 DELEGATE-CANONICAL | graph.ts reused verbatim; new exchange composed via `graphGet` |
| #17 AUDIT-FIRST-WIRE | schema · graph.ts · existing connect route · Login app all read pre-write |
| #20 WORKTREE-FF-PUSH | agent-1-slot · `agent-ship.sh 1` |
| #21 VERIFY-VERCEL | cited in §12 commit |
| #28 DRIFT-CATCH | spec ENV-implied operator burden; explicit env-key table provided |
| #30 §0.5 DEEP-DIVE | 7 empirical anchors cited above |
| #31 PUSHBACK-WITH-REPLACEMENT | Phase-1 env-loaded key (vs. KMS) with documented Phase-2 swap path |
| Rule #11 META-SAFETY-ABSOLUTE | World-A user OAuth · no FB-Army contact · no scraping |

Doctrine candidate: **DOC-PAGE-TOKEN-VAULT-ENCRYPT-AT-REST 1/5** — versioned bundle pattern (`v1:<iv>:<tag>:<ct>:<keyId>`) survives key rotation.

## Flags

- **ENV PRE-LIVE GATE:** consent + callback fail-closed (503/redirect-error)
  without 5 required env keys + 32-byte key material. Operator post-merge.
- **Phase-1 single-Page picker:** callback persists the first Page from
  `/me/accounts`. Users with multiple Pages get the first one only. Multi-page
  picker UI is a future lane.
- **Phase-2 KMS swap point:** `loadKeyMaterial` body is the single switch.
  Call sites + bundle format unchanged → drop-in.
- **Audit log placeholder:** Peg §5.3 calls for token-use audit log. This
  lane lays the encrypt/decrypt foundation; structured audit log entries
  (sylvia_episodic) banked for next lane.
- **Token decrypt callers must catch `TokenEncryptError`:** corrupt bundle
  / missing key id should fail the API call gracefully, not crash the route.
- **No automatic Page-token refresh:** Peg §5.2 notes page tokens derived from
  long-lived user tokens do not expire. On 401/190 we mark broken and prompt
  reconnect rather than attempt silent refresh. Spec-aligned.

**Connecting Generations · Built in Maine · World-class everywhere.**
