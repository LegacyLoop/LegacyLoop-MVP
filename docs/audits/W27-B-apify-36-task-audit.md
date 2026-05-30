# W27-B · Apify 36-Task Billing Audit + Burn-Vector Matrix
**Date:** 2026-05-30 · **Lane:** Track A · Wave 27 · Lane B · **Agent:** A (agent-1)
**Spec:** CMD-W27-B-APIFY-AUDIT-WF-DECISIONS V20 MED · anchor `b7e822e`
**Status:** 🟢 GREEN · audit-only · $0 spend · cap $29 untouched

---

## §0.5 Empirical Findings (BINDING #30)

| Probe | Result |
|---|---|
| HEAD | `b7e822e` parity origin/main ✓ |
| Apify token | `APIFY_API_TOKEN` present (env count-only · BINDING #5) |
| Enumeration | `GET /v2/actor-tasks` (paginated) + `GET /v2/acts/{id}` for `pricingInfos` |
| Total tasks | **36** (verified · matches incident-doc tally) |
| n8n watch-WFs inactive | per spec §0 EMPIRICAL: WF45 KBB · WF40 ClassicCars · WF91 Reddit · WF93 FB-Mkt · WF94 FB-Groups · WF92 dup `IgpUQKexy7jIs0Nd` all `active=False` (Devin cite) |
| Env↔task drift | `APIFY_TASK_PSACARD` + `APIFY_TASK_EBAY_MOTORS` env keys present · NO matching live task in account · 2 dangling env keys (flag) |
| Burn root cause re-probe | `cars-com-scraper` (`54fUapdcuXQvnj5Zl`) `pricingInfos` history shows PAY_PER_EVENT (`outputrecord`, +`contactrecord` from 2026-06-07) — NOT compute-billed. Burn = high per-record rate × unbounded record count (maxItems ignored). Burn-vector classification revised below. |

---

## §1 · Billing Model Summary (36 / 36)

| Pricing model | Count | Burn-risk class |
|---|---:|---|
| `PAY_PER_EVENT` | 28 | event-rate-dependent (see §3) |
| `FLAT_PRICE_PER_MONTH` | 7 | LOW (capped at subscription) |
| `UNKNOWN` | 1 | needs CEO verify |

Apify cap: **$29/month** (CEO-locked since burn incident · NEVER raise per spec).

---

## §2 · Full 36-Task Matrix

Sorted by burn-risk then task name. `evt=outputrecord` indicates per-result billing.
`unit$` is dataset-item price for FLAT subscriptions.

### A · `PAY_PER_EVENT` (28 tasks) — burn-risk depends on event type + actor-maxItems honoring

| # | Task | Actor | User | Events | Notes |
|---|---|---|---|---|---|
| 1 | legacyloop-ai-ad-music | ai-ad-music-factory | peaceful_pushpins | per-event | AI generation actor · check per-event $ pre-fire |
| 2 | legacyloop-ai-video-ads | ai-video-ads-factory* | peaceful_pushpins | per-event | AI generation · pre-fire estimate |
| 3 | legacyloop-ai-voiceover | ai-voiceover-* | peaceful_pushpins | per-event | AI generation · pre-fire estimate |
| 4 | legacyloop-amazon-scraper | amazon-* | logical_scrapers | outputrecord | resale-comp |
| 5 | legacyloop-bat-auctions | bat-auctions-* | parseforge | outputrecord | auction-comp |
| 6 | **legacyloop-cars-com** | **cars-com-scraper** | **fatihtahta** | **outputrecord + contactrecord** | **★ 2026-05-22 + 2026-05-30 BURN ACTOR · 4× ~$13/run · maxItems=40 IGNORED · per-event rate × unbounded record count** |
| 7 | legacyloop-chrono24 | chrono24-* | misterkhan | outputrecord | watch resale |
| 8 | legacyloop-courtyard | courtyard-* | devcake | outputrecord | trading-card mkt |
| 9 | legacyloop-craigslist-antiques | craigslist-* | ivanvs | outputrecord | resale-comp |
| 10 | legacyloop-craigslist-vehicles | craigslist-* | ivanvs | outputrecord | resale-comp |
| 11 | legacyloop-ebay-scraper | ebay-* | ivanvs | outputrecord | resale-comp |
| 12 | legacyloop-facebook-pages | facebook-pages-* | apify | outputrecord | competitive |
| 13 | legacyloop-fb-ads-library | fb-ads-* | saswave | outputrecord | competitive |
| 14 | legacyloop-fb-groups | fb-groups-* | apify | outputrecord | FB-Army adjacent (Rule #11 — World-B isolation required pre-live) |
| 15 | legacyloop-fb-marketplace | fb-marketplace-* | apify | outputrecord | FB-Army adjacent (Rule #11) |
| 16 | legacyloop-google-shopping | google-shopping-* | damilo | outputrecord | resale-comp |
| 17 | legacyloop-instagram | instagram-* | apify | outputrecord | IG-Army adjacent (Rule #11) |
| 18 | legacyloop-liveauctioneers | liveauctioneers-* | ivanvs | outputrecord | auction-comp |
| 19 | legacyloop-pinterest | pinterest-* | fatihtahta | outputrecord | content discovery |
| 20 | legacyloop-reddit | reddit-* | trudax | outputrecord | community discovery |
| 21 | legacyloop-shopgoodwill | shopgoodwill-* | caffein.dev | outputrecord | auction-comp |
| 22 | legacyloop-social-trends | social-trends-* | manju4k | outputrecord | content discovery |
| 23 | legacyloop-sothebys | sothebys-* | powerai | outputrecord | high-end auction |
| 24 | legacyloop-stockx | stockx-* | piotrv1001 | outputrecord | resale-comp |
| 25 | legacyloop-tcgplayer | tcgplayer-* | devcake | outputrecord | trading-card mkt |
| 26 | legacyloop-tiktok-scraper | tiktok-* | clockworks | outputrecord | content discovery |
| 27 | legacyloop-twitter-x | x-* | apidojo | outputrecord | content discovery |
| 28 | legacyloop-youtube | youtube-* | streamers | outputrecord | content discovery |

### B · `FLAT_PRICE_PER_MONTH` (7 tasks) — LOW burn-risk (capped at sub)

| # | Task | Actor | User | Monthly $ |
|---|---|---|---|---:|
| 29 | legacyloop-ai-ugc-video | ai-ugc-video-* | actums | $47 |
| 30 | legacyloop-autotrader | autotrader-* | epctex | $15 |
| 31 | legacyloop-cargurus | cargurus-* | lexis-solutions | $29 |
| 32 | legacyloop-etsy | etsy-* | epctex | $30 |
| 33 | legacyloop-goat | goat-* | ecomscrape | $15 |
| 34 | legacyloop-tiktok-ads | tiktok-ads-* | lexis-solutions | $30 |
| 35 | legacyloop-tiktok-songs | tiktok-trending-songs-* | lexis-solutions | $39 |

**Total FLAT obligation if all 7 active concurrently:** **$205/mo** — well above the $29 cap, but subscriptions only bill when actor is active. Audit recommendation: only the actively-used subscription should remain enabled per cycle.

### C · `UNKNOWN` (1 task)

| # | Task | Actor | User | Notes |
|---|---|---|---|---|
| 36 | legacyloop-video-script | video-script-storyboard | macheta | API returned no current pricingInfo · CEO probe needed |

---

## §3 · Burn-Vector Matrix (revised post-`pricingInfos` re-probe)

Original incident doc framed burn class as "compute-billed actors that ignore maxItems". Empirical re-probe of `cars-com-scraper` shows it is **`PAY_PER_EVENT` with `outputrecord` events** — not compute-billed. The 3-month repeat burn is therefore **per-record rate × unbounded record count**, NOT a hidden compute meter.

**Revised burn class:** any `PAY_PER_EVENT` actor where (a) per-event rate ≥ ~$0.04 AND (b) the actor does not honor the input's `maxItems` cap.

### HIGH burn-risk (confirmed by incident telemetry)

| Task | Why HIGH | Mitigation |
|---|---|---|
| **legacyloop-cars-com** | 4 runs = $52.78 (2026-05-30 12:00-12:03 UTC) · maxItems=40 ignored · per-record rate inferred ~$0.30/record on the with-contacts variant | **MANUAL-ONLY · pre-fire $-cap · strip scheduleTrigger from caller** (banked) — recommend KILL (see §WF45/WF40) |

### MEDIUM burn-risk (PAY_PER_EVENT · presumed honors maxItems but unverified)

All other 27 `PAY_PER_EVENT` tasks. None has burned in production telemetry, but the same class could repeat the cars-com pattern if any actor silently ignores `maxItems` and per-event rate is non-trivial. **Mitigation: each task gets a 1-record smoke run before being attached to any caller (incident-class regression test).**

### LOW burn-risk

All 7 `FLAT_PRICE_PER_MONTH` tasks (cost ceiling = subscription).

### UNKNOWN burn-risk

`legacyloop-video-script` (1 task) — needs CEO probe.

---

## §4 · Recommendations to CEO

1. **Keep cap at $29/month** (CEO-locked · do not raise).
2. **cars-com → KILL** (recommendation; see WF45/WF40 decisions). Replace with a vetted per-result vehicle actor + tight `maxItems`, or use the free WF72/WF76 path.
3. **Smoke-test every PAY_PER_EVENT actor with maxItems=1** before re-attaching to any WF caller — confirms the actor honors the cap. One pass per actor, banked as `W27-C` candidate.
4. **Retire FLAT subscriptions not currently driving production** — Apify will keep billing while the actor is subscribed even if unused. Per CEO review.
5. **Investigate `legacyloop-video-script`** (UNKNOWN pricing) — either confirm cost model or delete the task.
6. **Delete dangling env keys** `APIFY_TASK_PSACARD` + `APIFY_TASK_EBAY_MOTORS` (or restore the tasks). Banked.
7. **Wire rotation cost-sentinel LIVE** (currently W23 stubs) — single structural budget guard. Banked for W27-D / W28.

---

## §5 · Doctrine

| Candidate | Status |
|---|---|
| DOC-VET-ACTOR-BILLING-MODEL | 2/5 (revised: vet `pricingPerEvent.actorChargeEvents` + actual maxItems-honoring, not just COMPUTE/PER_RESULT label) |
| DOC-NO-UNATTENDED-PAID-VENDOR-SCHEDULE | 2/5 (this lane reinforces) |
| **DOC-WF-DECISION-FORCED-NEVER-INDEFINITELY-PAUSED** | **1/5 NEW** (every deactivated WF carries an explicit RE-ENABLE/ARCHIVE/REPLACE/KILL decision — see W27-B-deactivated-wf-decisions.md) |

---

## §6 · Flags

- **Pricing-classification nuance:** Apify's `PAY_PER_EVENT` is author-defined. `outputrecord` events = per-result. A different actor could define `computeunit` events and behave like compute billing while still being labelled `PAY_PER_EVENT`. The simple model→risk classifier is insufficient; per-actor `pricingPerEvent.actorChargeEvents` keys must be inspected.
- **Incident doc revision needed:** `APIFY-BURN-INCIDENT-2026-05-30.md` describes cars-com as "COMPUTE-billed". Empirical API probe disagrees — it is `PAY_PER_EVENT` per outputrecord (and contactrecord post-2026-06-07). The burn mechanic is unchanged in practice (high per-record × unbounded count), but the label correction matters for doctrine. Banked.
- **Subscription drift:** $205/mo total of FLAT-priced tasks if all 7 active. Even one accidental concurrent set blows the $29 cap. Audit cadence: monthly subscription state review.
- **Multi-page Apify limitation:** account-level cap is hard $29; no per-task throttle. A single misconfigured PAY_PER_EVENT run can still consume the entire cap. Structural guard = rotation cost-sentinel (banked).

**Connecting Generations · Built in Maine · World-class everywhere.**
