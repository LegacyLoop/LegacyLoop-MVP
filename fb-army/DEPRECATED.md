# fb-army · DEPRECATED — World-B Burner Wind-Down

**CMD:** CMD-W27-A-WORLD-B-WINDDOWN-SALVAGE V20
**Date:** 2026-05-30 PM
**Decision:** PATH 1 (CEO greenlit) · KILL burner World-B · preserve approved Meta dev account behind W26 App Review · reroute Marketplace coverage to defensible vendor (Apify logged-OUT) + official channel (Meta Commerce Catalog API · W28).

---

## Why Killed

1. **Meta ToS ban-evasion class** · burner accounts + fingerprint randomization + residential proxies = textbook circumvention. ToS violation.
2. **IT agent refused** · ran the empirical assessment · would not stand behind running burners against Meta.
3. **W26 App Review jeopardy** · approved Meta dev account in live mode + 4 lanes of App Review prep on main · activating burners on the same operator identity = ban risk that nukes the World-A asset.
4. **Defensible reroute exists** · Apify logged-out scraping is shielded by Meta v. Bright Data precedent (public data · no auth · no ToS click-through). Catalog API is the official channel.

**Result:** burner code stays in repo, marked `@deprecated`, never activated. Generic safety + envelope + rotation primitives are salvageable.

---

## DEAD (do NOT activate · `@deprecated`)

| Path | Why dead |
|---|---|
| `lib/scrapers/proxy/adapters/fb-army.ts` | adapter for burner ingest · removed from registry W27-A · fail-closed |
| `fb-army/src/index.ts` | droplet runtime orchestrator (single-session burner runner) |
| `fb-army/src/ingest.ts` | burner egress POST to T3b proxy |
| `fb-army/src/proxy-egress.ts` | residential-proxy + burner-session loader (ToS evasion infra) |
| `fb-army/src/fingerprint.ts` | UA/viewport/timezone randomization (anti-detect → ban-evasion class) |
| `fb-army/src/scrapers/marketplace.ts` | burner Marketplace headless scraper |
| `fb-army/src/scrapers/groups.ts` | burner Groups headless scraper |
| `lib/fb-army-safety/burner-identity.ts` | presupposes burner accounts exist |

**Quarantine semantics:** `@deprecated` JSDoc header on every file. Files NOT deleted (BINDING #20 never-abandon · reversible · git history preserved). Provider key `"fb-army"` kept in `ProviderName` union for back-compat · `getAdapter("fb-army")` returns `null` (fail-closed).

---

## SALVAGE (generic · reusable elsewhere · NOT deprecated)

| Path | Why salvageable | Reuse target |
|---|---|---|
| `lib/scrapers/rotation/*` (449 LOC) | Pure logic · two-world type system · cooldown ladder · cost optimizer · ZERO importers · NO burner assumption | Apify-job orchestration · free-scraper rotation · any future multi-arm fetcher |
| `lib/fb-army-safety/isolation.ts` | World-A↔B firewall (env keys / host blocklist / module-path blocklist) | Stays ACTIVE · also guards World-A code from accidentally pulling in any deprecated burner symbol |
| `lib/fb-army-safety/pace-floor.ts` | Hardcoded human-pace floors (no env override) | Reusable as the canonical pace gate for ANY scraping arm (Apify · free scrapers · catalog sync) |
| `lib/fb-army-safety/kill-switch.ts` | `killArmy()` flag + `<30s` propagation primitive | Generic emergency-stop · reusable as `killScrapers()` · same flag-file pattern |
| `lib/fb-army-safety/verify-suite.mjs` | 6-check suite · sim-mode logic shape · CI-runnable | Keep · proves the safety primitives still work · 6/6 sim PASS sustained |
| `.github/workflows/fb-army-safety.yml` | CI World-A grep guard | **KEEP ACTIVE** · firewall stays · prevents accidental World-A import even though burners deprecated |
| `scripts/fb-army-safety-guard.sh` | Local World-A grep guard | Keep |
| `fb-army/src/envelope.ts` | Canonical CorpusEntry envelope contract (W19-L1 + W22-L1) | Reusable shape · independent of burner |
| `fb-army/src/smoke.mjs` | Pure-JS fixture smoke pattern | Reusable test pattern · zero burner dependency |

---

## DigitalOcean Droplet · RECOMMEND DESTROY

| Field | Value |
|---|---|
| IP | `167.71.172.192` (per Devin spec FIX 4) |
| Provider | DigitalOcean |
| Cost | ~$14.40/mo idle |
| Status | Provisioned but never activated (no burners deployed · no proxy wired) |
| Recommendation | **CEO destroy in DigitalOcean console** · saves ~$14.40/mo · zero data loss (no state on droplet) |
| Side-effects of destroy | NONE · droplet has no role in any current pipeline · burner army never went live |

**Why this CMD does NOT API-destroy:** out of scope (BINDING #38 + spec §8 MAY-NOT · droplet API call) · CEO executes via DigitalOcean UI · ~30 seconds.

---

## Marketplace Coverage Reroute

The intent of burner-Marketplace was: continuous scrape of FB Marketplace for resale signal. Reroute keeps that signal without burners:

| Source | Channel | Defensibility |
|---|---|---|
| FB Marketplace (resale signal) | **Apify logged-OUT actor** ($29 cap absolute · APIFY-BURN W27 hardening) | Meta v. Bright Data: public unauthenticated data scraping defensible |
| FB Marketplace (own catalog) | **Meta Commerce Catalog API** (W28 banked · `app/api/catalog/sync` foothold) | Official channel · same Meta dev account that ships W26 App Review |
| FB Groups (resale signal) | Apify WF94 (logged-out) | Same defensibility class as Marketplace |
| Lead Ads (inbound buyers) | W25-META-L1 official webhook + Graph (LIVE on `app.legacy-loop.com/api/webhooks/meta/leadgen`) | World-A · already shipped |

---

## Firewall Re-Verify (post-wind-down)

- `bash scripts/fb-army-safety-guard.sh` → expected ✅ PASS (zero World-A symbols in fb-army/)
- `grep -rE "from.*fb-army" lib app --include="*.ts"` minus `lib/fb-army-safety/` → expected 0 (post-FIX-1 sever)
- `node --test lib/fb-army-safety/verify-suite.mjs` → expected 7/7 PASS (sim mode · proves salvage primitives still work)
- CI workflow `.github/workflows/fb-army-safety.yml` → stays armed · runs on every push touching fb-army/ or lib/fb-army-safety/

---

## Reactivation Procedure (DO NOT FOLLOW)

This section is intentionally absent. Reactivation would require:
- New CEO directive supersedes W27-A
- New legal review (post-Meta v. Bright Data precedent shift)
- New IT-agent assessment (current refusal)
- Re-removal of `@deprecated` headers + re-registration in `registry.ts`

Until then: do not import · do not activate · do not destroy.

---

**Connecting Generations · Defensible by construction.**
