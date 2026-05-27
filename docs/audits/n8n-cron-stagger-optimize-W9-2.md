# n8n Cron Stagger Optimize — Wave 9 W9-2 Audit

> CMD-N8N-CRON-STAGGER-OPTIMIZE V20 LOW · Agent A · agent-1 worktree
> Anchor HEAD: `2c5993c` (origin/main at fire time)
> Date: 2026-05-27

## §0 · Scope

**PB2 INLINE**: MC briefing cited "12+ WFs" — empirical probe found **25 WFs at `0 7 * * *`**. Scope locked to 7AM cluster ONLY. 8AM (13 WFs), 9AM (4 WFs), and weekly (2 WFs) clusters UNTOUCHED.

**Objective**: Stagger 25 WFs across minutes 0-24 of the 7AM hour to prevent droplet burst-load, NHTSA 429 contention, and concurrent HTTP fetch saturation.

## §1 · Stagger Plan (deterministic alphabetical by WF ID)

| Minute | WF ID | Workflow Name |
|--------|-------|---------------|
| 0 | `2PFlNsFr0VWQ9SIy` | WF63 — V14 DocumentBot Phase 3 (CANONICAL ANCHOR) |
| 1 | `1BJDU9xtDD7JfbF3` | WF58 — V7+V12 Cross-Vertical Fraud-Senior Cluster |
| 2 | `4hPrQ0Jnk8s7hogc` | WF67 V14 Phase 5 USPTO+NASA+CDC+CMS+VA |
| 3 | `75itg6SssgHDgSZx` | WF48 — V14 DocumentBot Resale-Adjacent |
| 4 | `8FNZZt6fXfEFgyRB` | WF60 — V8 NHTSA Family + FuelEconomy.gov |
| 5 | `CGiOFYtrQbo0ikmm` | WF33 — V15 Internet Archive Provenance |
| 6 | `FCc9JS3pS7YK7n7Q` | WF61 — V11 NGC + CGC Free Grading Pivot |
| 7 | `FcZOFzvykn42viff` | WF68 V11 COIN NumisMaster PROTO |
| 8 | `IJlima8jtPNRL4Ee` | WF66 — V14 DocumentBot Phase 4 |
| 9 | `IZJgcnX8ZQROy8mZ` | WF70 V8 NHTSA Per-Vehicle Recalls 10-Make |
| 10 | `Iq1a1l01sIzV0MRV` | WF30 — V15 Met Museum Provenance |
| 11 | `QqbSa4kKkLb2dsZp` | WF56 — V14 DocumentBot Federal Register |
| 12 | `RPsJ1rk9ZzTqXgfu` | WF62 — V14 DocumentBot Phase 2 SEC EDGAR |
| 13 | `TC088YWAAJYqGShe` | WF49 — V16 Real Estate Estate-Adjacent |
| 14 | `XYwJBPyvpnkNttfW` | WF29 — V8 NHTSA vPIC Vehicles |
| 15 | `YXHDy0UKy0Ltzbxs` | WF53 — V11 NGC + CGC Grading Authenticity |
| 16 | `hOvuzYo6QLAgH4GK` | WF55 — V1 FirstDibs High-End Antique |
| 17 | `iHZ3IKpYzwFxcacQ` | WF32 — V15 Library of Congress Provenance |
| 18 | `j7SXUtsinIRxUYdk` | WF65 — V13 GuitarCenter + Musicians Friend |
| 19 | `lvSFFgiKqQBXYwG6` | WF56 — V2 LiveAuctioneers SPA-shell |
| 20 | `suODeUH9RuYe6V8Q` | WF54 — V15 Getty Open Content Provenance |
| 21 | `t5C9CyzH35bks2tg` | WF69 V8 NHTSA Per-Vehicle Recalls |
| 22 | `vPcQFQMOC9Q1nvNf` | WF31 — V15 Smithsonian Provenance |
| 23 | `wJu9nWi9DSYTbmwt` | WF47 — V13 Sweetwater Used Musical Instruments |
| 24 | `xqZRGRtgx61UUzuE` | WF46 — V13 BrickLink LEGO Secondary Market |

## §2 · Batch PUT Results

- **OK**: 24 WFs staggered (minutes 1-24)
- **SKIP-canonical**: 1 (WF63 at minute 0 — unchanged)
- **ERR**: 0

**Method**: deactivate → GET → patch cron expression → PUT (whitelist `{name,nodes,connections,settings}`) → activate. n8n requires deactivate/reactivate cycle for active workflows — PUT alone returns 200 but does not persist cron changes to active version.

**Discovery**: n8n PUT `/api/v1/workflows/{id}` rejects bodies with additional properties beyond `{name, nodes, connections, settings}`. Must whitelist, not blacklist.

## §3 · Post-Patch Verification (7-of-25 sample)

| WF ID | Expected min | Actual min | Active | Result |
|-------|-------------|------------|--------|--------|
| `1BJDU9xtDD7JfbF3` | 1 | 1 | true | ✓ |
| `4hPrQ0Jnk8s7hogc` | 2 | 2 | true | ✓ |
| `75itg6SssgHDgSZx` | 3 | 3 | true | ✓ |
| `8FNZZt6fXfEFgyRB` | 4 | 4 | true | ✓ |
| `CGiOFYtrQbo0ikmm` | 5 | 5 | true | ✓ |
| `xqZRGRtgx61UUzuE` | 24 | 24 | true | ✓ |
| `2PFlNsFr0VWQ9SIy` | 0 | 0 | true | ✓ CANONICAL |

**7/7 PASS** — cron minutes persisted and all workflows active.

## §4 · Other Clusters Preserved

| Cluster | Count | Crons | Status |
|---------|-------|-------|--------|
| 8AM | 13 WFs | `0 8 * * *` | UNTOUCHED |
| 9AM | 4 WFs | `0 9 * * *` | UNTOUCHED |
| Weekly | 2 WFs | `0 6 * * 0` / `0 10 * * 0` | UNTOUCHED |
| 10AM | 2 WFs | `0 10 * * *` | UNTOUCHED |

## §5 · Next-Cycle Validation

- **Tomorrow 7:00-7:24 AM EDT**: monitor n8n execution log for 25 sequential fires (1 per minute)
- **Banked**: CMD-N8N-CRON-STAGGER-PHASE-2 (8AM cluster stagger if it grows post-Wave-10)
- **Banked**: Sylvia M14 cron-load auto-alert (automated monitoring)

## Doctrine

- **DOC-N8N-CRON-STAGGER-OPTIMIZE 1/5 NEW** — first application of per-minute stagger pattern
- **DOC-N8N-API-WHITELIST-BODY** — n8n PUT requires `{name,nodes,connections,settings}` whitelist (reinforces Wave 8 observation S3507)
- **DOC-N8N-ACTIVE-WF-DEACTIVATE-CYCLE** — active workflows require deactivate→PUT→activate for cron changes to persist (NEW discovery this cyl)
