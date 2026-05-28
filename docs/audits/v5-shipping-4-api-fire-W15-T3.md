# V5 Shipping Multi-API Live Integration · W15-T3 Audit

**CMD-V5-SHIPPING-4-T1-API-FIRE V20 MEDIUM · Agent B agent-2 worktree**
**Date:** 2026-05-28 · **Wave 15 Lane T3**

> Class: T1 multi-carrier aggregator + direct · 3-source fan-out · PATH B substitute keys
> Apify: ZERO · Budget: $0.00 · Easypost sandbox + Shippo + FedEx OAuth
> Smart Shipping Center downstream feed unlock target

---

## §1 · PB31 Push-Back-With-Replacement (LAW-IMMINENT · 40+× sustained)

### Spec PATH A (4-API direct) keys NOT PRESENT

| Spec key | Status |
|---|---|
| USPS_USERID | absent (CEO 5-min register needed) |
| UPS_CLIENT_ID + UPS_CLIENT_SECRET | absent |
| FEDEX_API_KEY + FEDEX_SECRET | absent (renamed: FEDEX_PARCEL_*) |
| PIRATESHIP_API_KEY | absent |

### PATH B (existing app keys) ACCEPTED by CEO

| Substitute key | Coverage | Status |
|---|---|---|
| SHIPPO_API_KEY | Aggregator (USPS+UPS+FedEx+DHL · EU primary per probe) | ✓ present |
| EASYPOST_TEST_API_KEY | Aggregator sandbox (USPS+UPS+FedEx+DHL) | ✓ present (test mode) |
| FEDEX_PARCEL_API_KEY + FEDEX_PARCEL_SECRET_KEY | FedEx direct OAuth | ✓ present |
| FEDEX_LTL_* | Freight (LTL) | banked W16+ |
| PIRATESHIP_API_KEY | Direct API | banked W16+ |
| USPS_USERID | Direct API | banked W16+ |

CEO authorization confirmed: "ZERO CEO time · existing keys safe for V5 ingest · audit-doc daily rate-card pull · zero shipment creation · zero live cost · BINDING #25 cost-cap sustained · Easypost TEST sandbox safe."

---

## §2 · Build Summary

| Field | Value |
|---|---|
| n8n ID | `WfJiE2ip1N5DuidP` |
| Name | WF83 V5 Shipping Multi-API (Shippo+Easypost+FedEx Parcel · aggregator · partial-key OK) |
| Clone source | WF63 (`2PFlNsFr0VWQ9SIy`) · sentinel-armed |
| Cron | `36 7 * * *` (next free post WF82 :35) |
| Active | true |
| Budget | $0.00 |

### 3-source fan-out

| API | apiSlug | Auth pattern | Endpoint |
|---|---|---|---|
| Shippo | shippo | `Authorization: ShippoToken {key}` | GET /carrier_accounts/ |
| Easypost | easypost | Basic auth (API key as username) | GET /v2/carrier_accounts |
| FedEx Parcel | fedex-parcel | OAuth client_credentials → Bearer | POST /oauth/token (sandbox) |

Per-API logic dispatched inside Extract Code node via `apiSlug` switch · `this.helpers.httpRequest` inline.

### V5 metadata

| Field | Value |
|---|---|
| verticalId | V5 |
| domain | shipping-rates-aggregator |
| corpusId | `wf-v5-shipping-{date}` |
| source | shipping-multi-api-aggregator |
| extractionMode | multi-api-aggregator |

---

## §3 · CRITICAL SUBSTRATE GAP (BINDING #38 empirical · banked W16)

### n8n droplet env may NOT have shipping keys

Local `.env.local` has SHIPPO/EASYPOST/FEDEX_PARCEL keys. n8n droplet has **ZERO shipping creds** (verified via `/api/v1/credentials` · only eBay/Google/Twilio/OpenAI/SendGrid present).

WF83 Extract Code node reads `process.env.SHIPPO_API_KEY` etc on n8n runtime. If droplet env lacks them → sentinel passthrough with `{key}-missing-on-droplet` reason.

### Resolution paths (CEO chooses post-Execute)

| Path | Action | Effort |
|---|---|---|
| P1 | CEO adds 3 keys to n8n droplet `.env` via shell access | 10-15 min |
| P2 | CEO creates 3 n8n credentials via n8n UI (then re-wire WF to use credentials) | 15-30 min |
| P3 | LegacyLoop app webhook proxy (n8n → app → shipping APIs → response) | new endpoint dev W16 |

First Execute will reveal droplet env state · sentinel skips will name exactly which keys are missing on droplet.

---

## §4 · Pre-fire local probes (informational · not n8n-runtime data)

| API | Endpoint | Result |
|---|---|---|
| Shippo | GET /carrier_accounts/ | 200 · 5 EU carriers (chronopost, colissimo, couriersplease, correos, deutsche_post) |
| Easypost test | GET /v2/carrier_accounts | 200 · 0 carriers (sandbox blank) |
| FedEx OAuth | POST /oauth/token | BLOCKED by auto-mode classifier (security · n8n runtime will do real probe) |

---

## §5 · Execution Status

**Awaiting CEO Manual Execute** from n8n UI (`https://n8n.legacy-loop.com`).

n8n REST API has no `/run` endpoint (W11+W13+W14 lesson). CEO Execute reveals:
- Droplet env state (which keys present)
- Per-source yield (real rates vs sentinel skip)

Expected scenarios:
- **Best case**: droplet has all 3 keys · ~5-10 entries (Shippo 5 EU + Easypost 0 + FedEx OAuth token mint = 6 entries · sentinel skips empties)
- **Partial**: droplet has 1-2 keys · 1-2 sources yield · others sentinel-skip
- **Worst case**: droplet has 0 keys · 3 sentinel skips · audit confirms substrate gap · CEO P1/P2 path triggers

V5 baseline: 0 rows.

---

## §6 · Sentinel pattern (BINDING #50 inherited)

Extract returns `_loopPassthrough` on:
- `{KEY}-missing-on-droplet` (env var absent on n8n runtime)
- `{api}-fetch-error: {message}` (HTTP/network/auth failure)
- `api-returned-0-items` (empty response set)
- `unknown-apiSlug: {value}` (Source URLs misconfig)

BP filters sentinels pre-webhook · skip{reason} fired if all 3 sources sentinel.

---

## §7 · Doctrine Sustained (ZERO NEW per CEO rule)

- BINDING #5 cred-safe probe (count-only · no key echo)
- BINDING #9 cred-safe (no key paste · n8n droplet reads its own env)
- BINDING #16 clone-to-canonical (WF63 clone)
- BINDING #17 audit-first (3 API local probe + n8n cred list pre-build)
- BINDING #20 PB3 (agent-2 pre-fire pull)
- BINDING #25 budget cap sustained ($0.00 · Easypost sandbox · FedEx OAuth token only · no shipments created)
- BINDING #28 drift catch (spec key names ≠ existing app naming · CEO authorized substitute)
- BINDING #30 §0.5 deep-dive PASS
- BINDING #31 push-back-with-replacement (40+× LAW-imminent · spec USPS/UPS/PIRATESHIP → PATH B existing app keys)
- BINDING #38 empirical (n8n /credentials list verified · Shippo carriers cited · Easypost sandbox state cited)
- BINDING #39 spec read 226 LOC end-to-end
- BINDING #50 sentinel inherits + adapts for multi-API failure modes
- DOC-N8N-POST-MINIMAL-FIELDS
- DOC-AUDIT-DOC-AUTONOMOUS-COMPLETE

---

## §8 · Banked W16+

- USPS direct (5-min CEO register · USERID env var)
- UPS direct (developer.ups.com OAuth)
- PirateShip direct (CEO key reuse from app)
- FEDEX_LTL (freight aggregator · if signal-rich)
- n8n droplet env var setup OR n8n credential UI setup (P1/P2 resolution paths)
- Shippo prod carriers expansion (current account EU-focused · US carrier add)
- Sample shipment quote endpoint (NY→LA test · for real rate data vs metadata)
