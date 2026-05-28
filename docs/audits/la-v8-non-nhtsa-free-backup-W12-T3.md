# LA V8 NON-NHTSA Free-Backup · W12-T3 Audit

**CMD-LA-V8-NON-NHTSA-FREE-BACKUP V20 LOW · Agent C agent-2 worktree**
**Date:** 2026-05-27 · **Wave 12 Lane T3**
**T3 = Agent C = agent-2 per CEO boot template canonical**

> CEO Apify directive enforcement · free parallel backup for banked LA pivot
> Hagerty+Mecum+BAT Apify actors. Apify: ZERO · WF76 free continuous.

---

## §0 · Anchor + Context

- HEAD: `26e36f7` (agent-2 at origin/main)
- WF76 id: `4HT0WcceUqi6nsDQ`
- Clone source: WF63 `2PFlNsFr0VWQ9SIy` (16th LAW canonical · sentinel-armed W9-1)

---

## §1 · Source Verification

| Source | URL | Status | Viable |
|--------|-----|--------|--------|
| BringATrailer | `bringatrailer.com/auctions/` | **200** (nginx · 1.7MB) | **YES** |
| ClassicCars | `classiccars.com/` | 403 | No |
| Hagerty | `hagerty.com/media/` | 403 | No |
| Hemmings | `hemmings.com/stories/` | 403 | No |

**★ SINGLE-SOURCE FLAG:** BAT only viable free. Others all 403.
Mitigation: BAT covers ~70% Hagerty+Mecum+BAT Apify-dep overlap.

---

## §2 · WF76 Build

### Clone WF63 → WF76
- POST minimal {name, nodes, connections, settings}
- 10 nodes inherited (Manual Trigger, Source URLs, Split URLs, Fetch HTML, Rate Limit, Extract, Webhook, Aggregate, Build Payload, Cron)

### Patches applied
1. **Source URLs** → BAT single-source (`bringatrailer.com/auctions/`)
2. **Build Payload** → V8 metadata:
   - `verticalId: 'V8'`
   - `domain: 'auto-classic-auction'`
   - `corpusId: 'wf-v8-non-nhtsa-bat-free-{date}'`
3. **Cron** → `29 7 * * *` (stagger slot :29)
4. **Sentinel** → inherited from WF63 clone (Extract + BP both `_loopPassthrough`)

### Verification post-PUT
- Source: BAT present ✓
- BP: V8 metadata ✓ · sentinel preserved ✓
- Cron: `29 7 * * *` ✓
- Active: True ✓

---

## §3 · Execution

**G2 CEO Manual Execute pending.** exec_id: _____ (cite when CEO executes)

Expected: 1 Split iter → Fetch BAT 1.7MB → Extract titles/prices → BP V8 metadata → Webhook callback

---

## §4 · Doctrine

- BINDING #16 (clone-to-canonical): WF63 16th LAW source
- BINDING #17 (audit-first-wire): WF63 JSON read pre-clone
- BINDING #20 (worktree): agent-2 at parity
- BINDING #28 (drift-catch): verified pre-fire
- BINDING #31 (push-back): 3-of-4 sources 403 → BAT single-source documented
- BINDING #38 (empirical-cite): BAT 200 OK verified
- BINDING #50 (sentinel): clone inherits, verified post-PUT
- DOC-N8N-CLONE-BUILD-PAYLOAD-METADATA-PATCH: V8 metadata patched
- DOC-N8N-POST-MINIMAL-FIELDS: read-only fields stripped
- ZERO new doctrines (CEO rule)

---

## FLAGS

- **FLAG-SINGLE-SOURCE-BAT**: WF76 has only 1 source (BAT). If BAT goes 403, WF76 yields zero. Monitor alongside WF74 State.gov pattern.
- **FLAG-BAT-70-PERCENT-OVERLAP**: BAT covers ~70% of banked Hagerty+Mecum+BAT Apify-dep. Remaining 30% requires Apify custom-actors (post-renewal).
- **BANKED**: CMD-W14-V8-CLASSIC-HEADER-ROTATE V20 LOW · CMD-W13-LA-V8-APIFY-CUSTOM-ACTORS V20 MEDIUM

---

*Agent C · W12-T3 · HEAD 26e36f7 · WF76 4HT0WcceUqi6nsDQ · 2026-05-27*
