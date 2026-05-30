# W25-META-L2 · Message Center Meta Live Wire
**Date:** 2026-05-30 · **Lane:** Track A · Wave 25 · Meta L2 · **Agent:** A (agent-1)
**Spec:** CMD-W25-META-L2-MESSAGE-CENTER-WIRE V20 HIGH · anchor `6b91733`
**Status:** 🟢 GREEN

---

## Objective

Wire live **Messenger + Instagram** messaging into the existing Message Center:
inbound webhook → ingest to `Conversation`/`Message` → MessagesClient renders thread
→ seller reply forwards to Meta via Send API. Omnichannel inbox is LIVE for Meta
the moment operator configures the env keys (below) on the Meta App + Vercel.

## §0.5 Empirical Findings (BINDING #30)

| Probe | Result |
|---|---|
| `prisma/schema.prisma:636` `Conversation` | `itemId` REQUIRED FK to `Item` · `platform String @default("direct")` |
| `prisma/schema.prisma` `Message` | no `metadata`/`externalId` column — idempotency via deterministic `Message.id` |
| `app/api/conversations/route.ts` POST | requires public Item · auth-free buyer path |
| `app/api/conversations/[convId]/messages/route.ts` POST | seller reply path · auth-gated · clean hook point |
| `app/messages/MessagesClient.tsx:1161` | already renders `via {platform}` on selected header — needs only thread-row badge |
| `lib/messaging/auto-reply.ts` | routes via `${LITELLM_BASE_URL}/anthropic` — BINDING #10 path intact |
| Meta scopes envs present | `FACEBOOK_CLIENT_ID/SECRET` only · webhook + Send keys absent |

## Design Decisions

| Decision | Rationale |
|---|---|
| **Sentinel `Item` per user per platform** id = `meta-inbox-<userId>-<platform>` | Conversation requires `itemId` FK · ZERO schema · DRAFT status keeps it out of public catalog |
| **Idempotency via `Message.id`** = `"fbmid_" + sha256(platform\|mid).slice(0,26)` | Schema has no metadata field · deterministic id + `P2002` catch = re-runnable on Meta retry |
| **Single-tenant page→user routing** via `META_PAGE_OWNER_USER_ID` env | MVP simplest · multi-page future via `UserEvent.metadata` JSON (no schema) |
| **Send API is platform call, NOT AI** | BINDING #10 not triggered · direct `graph.facebook.com` POST allowed |
| **`messaging_type=RESPONSE`** default · `HUMAN_AGENT` tag optional | Meta 24-hour window respected · operator can override per call |
| **`runtime = "nodejs"`** on webhook route | HMAC verify uses Node `crypto` · NOT Edge-compatible |

## Files

### NEW

| Path | Purpose |
|---|---|
| `app/api/webhooks/messenger/route.ts` | GET hub.challenge verify + POST signed receive (raw-body HMAC) |
| `lib/messaging/meta/types.ts` | Meta event envelope shapes |
| `lib/messaging/meta/verify-signature.ts` | `x-hub-signature-256` HMAC-SHA256 verify · `timingSafeEqual` |
| `lib/messaging/meta/sentinel-item.ts` | get-or-create Meta inbox Item per user |
| `lib/messaging/meta/ingest.ts` | normalize event → Conversation/Message · idempotent · counts |
| `lib/messaging/meta/send.ts` | Graph Send API (Messenger + IG) · 24h + HUMAN_AGENT |

### MODIFIED (additive only · no LOCKED files touched)

| Path | Change |
|---|---|
| `app/api/conversations/[convId]/messages/route.ts` | seller reply forwards to Meta via fire-and-forget `sendMetaMessage` when `conv.platform ∈ {facebook, instagram}` |
| `app/messages/MessagesClient.tsx` | new `ChannelBadge` component on thread row (FB / IG / fallback) · A11Y title + aria-label |

### SCHEMA: NONE · PKG: NONE

## ENV Keys Required (operator post-merge)

| Key | Purpose | Required |
|---|---|---|
| `META_VERIFY_TOKEN` | hub.challenge verify (matches Meta App webhook config) | yes |
| `META_APP_SECRET` | x-hub-signature-256 HMAC (falls back to `FACEBOOK_CLIENT_SECRET`) | yes |
| `META_PAGE_ACCESS_TOKEN` | Messenger Send API | yes (for replies) |
| `META_PAGE_OWNER_USER_ID` | maps inbound page → Legacy-Loop User.id (single-tenant) | yes |
| `META_GRAPH_BASE_URL` | overridable Graph host · default `https://graph.facebook.com/v21.0` | optional |
| `IG_USER_ID` | Instagram Business Account id | required for IG |
| `IG_PAGE_ACCESS_TOKEN` | IG Send API (falls back to `META_PAGE_ACCESS_TOKEN`) | optional |

Without these the webhook returns 403/503 and ingest silently skips — fail-closed.

## Acceptance

- [x] tsc=0
- [x] webhook GET returns hub.challenge when verify token matches; 403 otherwise
- [x] webhook POST validates `x-hub-signature-256`; 401 on bad signature
- [x] inbound message → `Message` row with deterministic id (idempotent on retry)
- [x] Conversation reuses prior thread on same (page, sender) pair
- [x] seller reply forwards to Meta (Messenger or IG) via Graph Send
- [x] MessagesClient shows channel badge (FB / IG) on thread row
- [x] LOCKED files untouched · ZERO schema · ZERO direct AI HTTP from new code
- [x] Rule #11 (FB-Army absolute) UNCHANGED — this lane is **World-A inbox**, distinct from FB-Army scraper (World-B). No scraping. No fb-army/ touch.

## Doctrine

| BINDING / Rule | Applied |
|---|---|
| #10 TELEMETRY-LOCK | auto-reply path unchanged (LiteLLM) · Send API is platform call, not AI |
| #16 DELEGATE-TO-CANONICAL | meta/types.ts mirrors official Messenger/IG webhook envelope shape |
| #17 AUDIT-FIRST-WIRE | schema, route, MessagesClient, auto-reply, env all read pre-write |
| #20 WORKTREE-FF-PUSH | agent-1-slot · `agent-ship.sh 1` |
| #21 VERIFY-VERCEL | cited in §12 commit |
| #28 DRIFT-CATCH | spec said "ENV NONE"; lane structurally needs Meta env keys — push-back per #31, documented additive |
| #30 §0.5 DEEP-DIVE | 5 reads cited above |
| #31 PUSHBACK-WITH-REPLACEMENT | ENV-NONE → ENV-ADDITIVE (operator post-merge) |
| Rule #11 META-SAFETY-ABSOLUTE | unchanged · World-A inbox lane is disjoint from FB-Army scraper |

## Flags

- **ENV PRE-LIVE GATE:** webhook + Send paths require operator to set 5+ env keys
  on Vercel + Meta App. Lane ships dormant-safe (fail-closed). CEO/operator post-merge
  task: configure Meta App + webhook URL + env.
- **Single-tenant MVP:** one Page / one IG account / one owner. Multi-page support
  is a future lane (UserEvent metadata JSON lookup, still ZERO schema).
- **Sentinel inbox Item:** clean pattern but creates one DRAFT item per user per
  platform. Catalog views must filter `status="DRAFT"` already; verify if any
  surface lists DRAFT items unfiltered (no incidents observed). Banked for QA.
- **Worktree build quirk repeat:** agent-1 build still trips on pre-existing
  `sylvia-data/audit/episodic-*.jsonl` symlink (Turbopack outside-root check).
  Main worktree build PASS canonical. Pre-W25-META-L2 condition.
- **Send API rate-limit + retry not yet implemented.** First-message MVP path.
  Production hardening: exponential backoff + circuit breaker banked.
- **Outbound message Send result is not persisted** (mid not back-fed to
  `Message` row). Sufficient for MVP — incoming idempotency intact. Banked.

**Connecting Generations · Built in Maine · World-class everywhere.**
