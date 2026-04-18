# Local Classifieds Intelligence Network

**CMD-LOCAL-CLASSIFIEDS-FRAMEWORK** (Phase 1 scaffold — April 18, 2026)

Additive framework for fetching localized pricing signals from regional
classifieds marketplaces (Uncle Henry's in Maine, Thrifty Nickel in Texas,
Penny Saver in New Jersey, etc.) and feeding them into PriceBot V10's
`localEnthusiast` tier + ReconBot competitive landscape + BuyerBot
Wanted-section demand + ListBot cross-listing recommendations.

This directory ships **dead code** until `CMD-UNCLE-HENRYS-ADAPTER`
(command #2) wires a registered adapter and `CMD-LOCAL-COMPS-BOT-WIRE`
(command #3) pipes the output into the aggregator.

---

## Architecture

```
                               ┌─────────────────────────┐
                               │  fanOut(query)          │
                               │   framework.ts          │
                               └────────────┬────────────┘
                                            │
                  ┌─────────────────────────┼──────────────────────────┐
                  │                         │                          │
                  ▼                         ▼                          ▼
       ┌──────────────────┐      ┌──────────────────┐       ┌──────────────────┐
       │ geo-resolver.ts  │      │ registry.ts      │       │ adapter registry │
       │ ZIP → state →    │      │ slug → metadata  │       │ (runtime)        │
       │ applicable slugs │      │ + active flag    │       │ per slug → impl  │
       └──────────────────┘      └──────────────────┘       └────────┬─────────┘
                                                                     │
                                                   ┌─────────────────┴──────────────┐
                                                   ▼                                ▼
                                        ┌──────────────────────┐         ┌──────────────────┐
                                        │ sources/             │         │ normalizer.ts    │
                                        │   uncle-henrys-json  │         │ raw taxonomy →   │
                                        │   thrifty-nickel-... │         │ CategoryNormalized│
                                        │   (one per source)   │         └──────────────────┘
                                        └──────────────────────┘
```

All adapters implement `LocalSourceAdapter` (see `types.ts`) and return
`LocalSourceResult` with an array of `LocalListing` rows. `LocalListing`
carries normalized fields (price, date, category, geo) suitable for
direct merge into PriceBot's `market_comps_median` reconciliation layer.

---

## Files

| File | Purpose |
|---|---|
| `types.ts` | `LocalSourceSlug`, `LocalListing`, `LocalSourceAdapter`, etc. |
| `framework.ts` | `fanOut()` orchestrator + adapter registration |
| `normalizer.ts` | Source-specific taxonomy → 10-key `CategoryNormalized` |
| `geo-resolver.ts` | ZIP prefix → state → source selection |
| `registry.ts` | Source metadata catalog (display name, coverage, legal status, active flag) |
| `sources/` | One file per adapter implementation (populated by future commands) |

---

## Adding a new source (3-step guide)

1. **Register metadata** in `registry.ts` under `SOURCE_REGISTRY`.
   Default `active: false` until legal + technical readiness confirmed.
2. **Create adapter** at `sources/<slug>-<variant>.ts` implementing the
   `LocalSourceAdapter` interface. Call `registerAdapter()` at module
   load.
3. **Wire into bot routes** via `CMD-LOCAL-COMPS-BOT-WIRE` (command #3)
   — the aggregator calls `fanOut()` when enriching market intelligence.

Each adapter owns its own HTTP client, rate-limit discipline, and error
handling. Per-adapter timeout is 5s (enforced in `fanOut()`); individual
adapters failing does not cascade.

---

## Feature flag

```
LOCAL_CLASSIFIEDS_ENABLED=true     # enable framework
LOCAL_CLASSIFIEDS_ENABLED=false    # disabled (default)
# unset                            # disabled (default)
```

When disabled, `fanOut()` returns `emptyResult()` synchronously — no
outbound traffic possible. Safe for production until adapters ratify
legal posture.

Env var is consumed directly by `framework.ts::isLocalClassifiedsEnabled()`.
Not added to `lib/feature-flags.ts` FEATURES map to avoid touching that
locked surface; ratify in a future command if preferred.

---

## Legal posture

Every entry in `SOURCE_REGISTRY` carries a `legalStatus` field:

| Value | Meaning |
|---|---|
| `pending_written_permission` | Outreach sent; waiting on written consent. |
| `tos_permissive` | Source's ToU explicitly allows automated use. |
| `requires_api_key` | Public API available; adapter pending key. |
| `deferred` | No active outreach or technical readiness yet. |

**No adapter may flip `active: true` until `legalStatus` is
`pending_written_permission` → resolved, OR `tos_permissive`, OR
`requires_api_key` with key in hand.**

Uncle Henry's (`uncle_henrys`) is the primary Phase 1 target. Permission
email sent to `privacy@unclehenrys.com` on April 18, 2026. Status stays
`pending_written_permission` + `active: false` until written response
arrives.

The **legacy** HTML scraper at
`lib/market-intelligence/adapters/uncle-henrys.ts` continues to serve
the existing aggregator path untouched. Legal exposure of that adapter
is pre-existing and is not changed by this framework.

---

## Downstream wiring (forward-pointer)

After `CMD-UNCLE-HENRYS-ADAPTER` (#2) ships a registered adapter,
`CMD-LOCAL-COMPS-BOT-WIRE` (#3) will:

- **PriceBot V10** — merge `fanOut()` listings into `market_comps_median`
  with geo-weighted trust (closer-to-seller ZIPs = higher weight).
- **ReconBot** — surface `LocalListing[]` as competitive-landscape rows.
- **BuyerBot** — parse Wanted-section listings (inverse: buyer → seller)
  as early demand signal.
- **ListBot** — cross-listing copy variants for posting to active local
  sources.
- **AnalyzeBot** — regional density metric ("N similar items listed
  within 50 miles this week") for condition / rarity context.

Each wiring is an independent command; all inherit the single
`fanOut()` call signature.
