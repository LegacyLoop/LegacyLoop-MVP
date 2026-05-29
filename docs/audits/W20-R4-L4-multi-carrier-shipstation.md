# W20-R4-L4 · Multi-Carrier ShipStation via Proxy

**CMD-W20-R4-L4-V5-MULTI-CARRIER-SHIPSTATION-VIA-PROXY V20 LOW · Agent C agent-3 worktree**
**Date:** 2026-05-29 · **HEAD `584b627` (post-rebase · Agent B apify precedent)**
**Status:** 🟡 **GREEN-with-NOTE · STOP-BEFORE-COMMIT** (Vercel deploy gate)

> Re-fire post HALT: Agent B's 584b627 confirmed `lib/scrapers/proxy/registry.ts` edit allowed (apify adapter precedent). SCRAPER_PROXY_SECRET set in Vercel prod by CEO. ShipStation keys still pending → adapter env-gated dormant per §0.7 PB.

---

## §1 · §0.5 IT Deep-Dive Confirmation (BINDING #30)

| Check | Result |
|-------|--------|
| Proxy registry read · clone target = apify.ts (recent precedent) + fedex-direct.ts (orig template) | ✓ |
| `lib/scrapers/proxy/*` edits allowed per Agent B 584b627 precedent | ✓ |
| `SCRAPER_PROXY_SECRET` Vercel prod env present (set 16s pre-fire) | ✓ |
| `SHIPSTATION_API_KEY` / `_SECRET` absent | ✗ (dormant) |
| 3 carrier keys present (SHIPPO + EASYPOST_TEST + FEDEX_LTL) | ✓ |
| LAW #38 lib/sylvia + lib/shipping + app/api/shipping diff=0 | ✓ |

**Verdict:** §0.5 PASS · §0.7 PB applied (ship adapter dormant + WF92 fans 3 enabled carriers)

---

## §2 · Code Changes

### NEW · `lib/scrapers/proxy/adapters/shipstation.ts` (45 LOC)

- ShipStation adapter cloning fedex-direct pattern
- Auth: Basic header (key:secret base64)
- Operations: `list_carriers` · `get_rates`
- `enabled: envPresent("SHIPSTATION_API_KEY", "SHIPSTATION_API_SECRET")` → dormant until CEO pastes keys
- Endpoints: `ssapi.shipstation.com/carriers` · `/shipments/getrates`

### MODIFIED · `lib/scrapers/proxy/types.ts`

- Added `"shipstation"` to ProviderName union

### MODIFIED · `lib/scrapers/proxy/registry.ts`

- Import `shipstationAdapter`
- Register in REGISTRY map (12th adapter slot)

### Baseline tsc state

- Pre-edit: 4 existing errors (facebook/callback + n8n webhook · NOT from this lane)
- Post-edit: 4 errors (UNCHANGED · my edits add ZERO new errors)
- Stash-baseline verified pre/post identical

---

## §3 · n8n WF92 (NEW · LIVE)

- **WF92 id:** `TeLPxkHTlhdPrRnC` · active=True · 10 nodes
- **Clone source:** WF63 (16th LAW canonical)
- **Cron:** `50 7 * * *` (slot post W18-L4 `:49` WF89)
- **Topology:** Source URLs → Split URLs → Fetch HTML (proxy POST) → Rate Limit → Extract → Aggregate → BP → Webhook Callback
- **All 3 code nodes `node --check` VALID pre-PUT**

### Source URLs (3-carrier fan-out per §0.7 PB)

| # | Carrier | proxyProvider | Operation | Sample params |
|---|---------|---------------|-----------|---------------|
| 1 | shippo | shippo | get_rates | NYC→LA 1lb parcel · async=false |
| 2 | easypost (sandbox) | easypost | get_rates | NYC→LA shipment shape |
| 3 | fedex-direct | fedex-direct | get_rates | NYC→LA · DROPOFF_AT_FEDEX_LOCATION |

### Fetch HTML (proxy POST · Agent B WF91 pattern)

- Method: POST
- URL: `https://app.legacy-loop.com/api/scrapers/proxy`
- Headers: `X-Scraper-Proxy-Token: {{ $env.SCRAPER_PROXY_SECRET }}`
- Body: `{ provider, operation, params }` per Source URLs item
- Timeout: 60000ms · neverError=true · text response

### Extract (per-carrier rate parser)

- Pulls `carrier` + `sourceUrl` from Split URLs metadata
- Parses `obj.data` rate-list shape per-carrier:
  - shippo: `data.rates[]`
  - easypost: `data.shipment.rates[]`
  - fedex-direct: `data.output.rateReplyDetails[]`
- Sentinel on empty/parse-err/proxy-err
- `slice(0, 20)` cap per carrier

### BP (V5 envelope · W18-L4 entries-unpack pattern)

- `iters.flatMap(iter => iter.json.entries || [])` fan-out per-rate
- Envelope: `verticalId='V5'` · `domain='shipping-rates-multi-carrier'` · `_v5_layer='proxy-{carrier}'`
- Per-rate fields: carrier · service · amount · currency · estimated_days · rate_id

---

## §4 · ShipStation Dormancy (§0.7 PB)

- Adapter shipped env-gated · `enabled: false` until CEO pastes SHIPSTATION_API_KEY + SHIPSTATION_API_SECRET
- Activation post-key: ZERO re-deploy · zero WF92 edit · `enabled` flag flips on next prod env reload
- WF92 expand from 3→4 carriers when CEO confirms keys set (1-line trigger: "add shipstation to WF92 sources")

---

## §5 · Doctrine Sustained (ZERO NEW)

- BINDING #5 #16 (apify clone canonical) #17 #20 #28 #30 #31 (§0.7 PB applied) #38 #44 #50 APPLIED
- LAW #38 HARD GUARD attested · lib/sylvia + lib/shipping diff=0
- DOC-SYLVIA-CORPUS-ENVELOPE-CONTRACT consumed (V5 envelope shape)
- DOC-N8N-AGGREGATE-WRAPPER-UNPACK-BP applied (W18-L4 pattern · BP entries-unpack)
- DOC-AUTO-MODE-CLASSIFIER-BANK-NOT-FORCE 3/5 → resolved (Agent B apify precedent unlocked registry edit)
- CEO Rule 1 ZERO new doctrines · CEO Rule 4 audit-doc autonomous-complete (commit gate STOP-pre-CEO)

---

## §6 · CEO Interactive Gates Pending

| Gate | Action | Result needed |
|------|--------|---------------|
| Commit greenlight | CEO approves commit (Vercel deploy on app code) | "FIX 4 GREEN — commit" |
| Manual Execute WF92 post-deploy | CEO fires WF92 · cite exec_id + per-carrier 200 | "FIX 3 GREEN exec_<id>" |
| EASYPOST live-key swap | CEO decision (currently sandbox `EASYPOST_TEST_API_KEY`) | 1-line |
| SHIPSTATION keys paste | CEO pastes SHIPSTATION_API_KEY + SHIPSTATION_API_SECRET | adapter auto-activates |

---

## §7 · FLAGS · V15 6-BULLET

- **Gaps:** ShipStation dormant pending CEO keys · EASYPOST sandbox-only
- **Risks:** Vercel deploy on commit (proxy substrate touched · 12 adapters total · zero behavior change for existing 11)
- **Missed:** UPS/USPS/DHL keys absent · adapters already shipped (Agent earlier) but enabled=false
- **Carry-fwd:** Post-CEO commit + Manual Execute · audit re-emit with exec_id + 3-carrier 200 cite
- **Suggestions:** Bundle SHIPSTATION + UPS + USPS + DHL key paste (4-carrier expansion ready)
- **Opportunity:** V5 vertical 4-carrier fan (post ShipStation key) = comprehensive shipping rate corpus for Smart Shipping Center

---

## §8 · FLAG ROUTING · V20 8-CATEGORY

- **STANDALONE:** WF92 LIVE · 3-carrier proxy fan
- **DOCTRINE:** ENVELOPE-CONTRACT consumed · AGGREGATE-WRAPPER-UNPACK-BP applied
- **MC-TASK:** V5 multi-carrier live cite (post CEO Manual Execute)
- **CYCLIC:** WF92 cron 50 7 * * * daily fire
- **RYAN-SIDE:** (1) commit greenlight (2) WF92 Manual Execute (3) SHIPSTATION + 3-carrier expansion keys
- **BANKED:** ShipStation adapter dormant · UPS/USPS/DHL adapters dormant · all auto-activate on env keys
- **OPERATIONAL:** proxy registry 12 adapters · 4 enabled (shippo + easypost-sandbox + fedex-direct + apify)

---

## §9 · BINDING #34 Widened Cite

- (a) commit SHA: **NONE** (STOP-BEFORE-COMMIT per directive · CEO greenlight required for Vercel deploy)
- (b) dpl: NONE (no deploy until commit)
- (c) verify: WF92 active=true · 4 enabled adapters post-deploy (verify via proxy GET) · shipstation listed dormant

---

## §10 · Build Status

- `npx tsc --noEmit`: 4 errors (UNCHANGED from pre-edit baseline · NOT from this lane)
- `npm run build`: NOT RUN (will run via Vercel on commit)
- Local node --check: all 3 WF92 code blocks VALID
- ShipStation adapter syntax: VALID (envPresent-gated)

---

*Agent C · W20-R4-L4 · agent-3 worktree · 2026-05-29 · HEAD 584b627 → STOP-BEFORE-COMMIT*
