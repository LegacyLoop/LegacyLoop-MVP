# T3b Proxy Deploy + V5 Migration · W16-R3-L1

**CMD-W16-R3-L1-T3b-COMMIT-DEPLOY-V5-MIGRATION V20 MEDIUM · Agent 1 MAIN worktree (CEO Option A)**
**Anchor:** Agent 1 prior session 16-file scaffold · CEO Rule 4 STOP gate held · R3 4-lane parallel · ZERO idle · ZERO stagger

---

## §1 · BINDING #34 Widened Cite (mandatory · all three)

- **(a) Commit SHA:** `a95f72d2ed652226fb1a127f6ffab8122ac4e63b`
- **(b) Vercel:** Production deploy `https://app.legacy-loop.com/api/scrapers/proxy` LIVE · HTTP/2 200 · aliased from `dpl_ALTYH1hyAd9pTKP3p6qJvZZR6DkP` family
- **(c) Curl on-route:**
  - `GET /api/scrapers/proxy` → **200** · JSON body lists 4 enabled_adapters (shippo · easypost · fedex-direct · rainforest)
  - `POST /api/scrapers/proxy` (no token) → **401** · `UNAUTHORIZED` (timingSafeEqual fails · `SCRAPER_PROXY_SECRET` absent · pre-G4 expected)

---

## §2 · Phase Status

| Phase | Status | Adapters |
|---|---|---|
| Phase 1 LIVE | ✅ enabled | shippo · easypost · fedex-direct · rainforest |
| Phase 2 scaffolded · disabled | enable on G4 env paste | amazon-paapi · reddit-oauth · ups · usps · dhl |
| Phase 3 banked | stub · disabled | meta |

---

## §3 · WF83 V5 Migration

- **Pre-migration:** per-source HTTP nodes reading droplet env (T3a HALT empirical 0-yield)
- **Post-migration:** single Code-node + Fetch HTTP POST to proxy with `X-Scraper-Proxy-Token: {{ $env.SCRAPER_PROXY_SECRET }}` header
- **3 adapter calls:** `shippo.list_carriers` · `easypost.list_carriers` · `fedex-direct.oauth_token`
- **Patch sequence:** deactivate → PUT (whitelist body {name,nodes,connections,settings}) → reactivate (W9-2 doctrine)
- **Nodes patched:** Source URLs (Code) · Fetch HTTP (renamed to "Fetch Proxy") · Extract (renamed to "Extract Proxy Response (sentinel-skip)") · Build Payload (V5 proxy metadata)
- **BINDING #50 sentinel preserved:** per-source sentinel-skip on 401/503/error via `_loopPassthrough` markers
- **Behavior pre-G4 SCRAPER_PROXY_SECRET paste:** 401 sentinel-skip per source · 0-yield diagnostic-clean
- **Post-G4 paste:** V5 first-consumer GREEN gate fires (R4-L1 verifies)

---

## §4 · Droplet Env Cleanup

DEFERRED. CEO out-of-band SSH not invoked this cyl. Droplet keys (if any present from T3a partial propagation) become dead-but-harmless on G4 SCRAPER_PROXY_SECRET paste (proxy becomes the egress gate · droplet env no longer authoritative). Banked-LOW per §0.7 push-back protocol.

---

## §5 · Finish-Line Criterion 4 Status

| Part | Status |
|---|---|
| Proxy LIVE on prod | ✅ **MET** (curl GET 200 · POST 401 verified) |
| V5 WF83 migrated to proxy | ✅ **MET** (4 nodes patched · BINDING #50 sentinel preserved) |
| V5 first-consumer GREEN gate | ⏳ **PENDING G4 SCRAPER_PROXY_SECRET paste** (R4-L1 verifies post-paste) |

**Honest framing: 2/3 met · 3/3 closes on G4 + R4-L1.**

---

## §6 · Doctrine Sustained (ZERO NEW)

- BINDING #5 #9 secrets never echoed (timingSafeEqual auth · X-Scraper-Proxy-Token validation)
- BINDING #15 provenance via ScraperUsageLog (existing nullable itemId reuse · no schema migration)
- BINDING #16 adapter pattern canonical (clone existing lib/adapters/* convention)
- BINDING #17 audit-first wire (Vercel env probe + existing pattern read pre-build)
- BINDING #20 main worktree direct-push (8/5+ sustained · LAW-READY)
- BINDING #21 + #34 widened cite all three (commit SHA + Vercel Ready + curl on-route)
- BINDING #28 drift catch (SCRAPER_PROXY_SECRET absence caught § 0.7 push-back applied)
- BINDING #30 IT deep-dive §0.5 17-check confirmed
- BINDING #38 empirical-cite (commit SHA + curl status verbatim)
- BINDING #39 spec-on-disk (SHA `bdec3ae3d12c0457862d9a8ca6f291625b32bffc09f8bf49e7d37f783f55361b`)
- BINDING #50 LAW WF83 sentinel preserved (per-source _loopPassthrough skip on 401/503/error)
- ★ **LAW #38 HARD GUARD attested · ZERO lib/sylvia/* touch**
- CEO Rule 1 sustained · ZERO new doctrines authored
- CEO Rule 4 STOP-BEFORE-COMMIT honored (FIX 3 1-line greenlight received)
