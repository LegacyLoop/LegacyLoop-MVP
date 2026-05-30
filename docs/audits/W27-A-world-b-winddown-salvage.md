# W27-A · World-B Wind-Down + Salvage — Audit Artifact

**CMD:** CMD-W27-A-WORLD-B-WINDDOWN-SALVAGE V20 LOW
**Date:** 2026-05-30 PM
**Path:** 1 (CEO greenlit) · supersedes FROZEN CMD_W27_A_FB_ARMY_PHASE1
**Anchor HEAD:** `b7e822e` → `<post-commit>`
**Status:** 🟢 GREEN · coupling severed · 8 files `@deprecated` · 0 deletions

---

## Why (Decision Record)

1. **Meta ToS ban-evasion risk.** Burner accounts + fingerprint randomization + residential proxies + cookie injection = textbook circumvention. ToS class.
2. **IT agent refused.** Ran the empirical assessment of the burner pipeline · would not stand behind running it against Meta.
3. **W26 App Review jeopardy.** Approved Meta dev account in live mode + 4 App Review lanes on main (W26-B/C/D + W25-META-L1 lead-ads). Activating burners on the same operator identity = ban risk that nukes the World-A asset.
4. **Defensible reroute exists.** Apify logged-OUT scraping is shielded by Meta v. Bright Data precedent. Catalog API is the official channel.

**Result:** kill burner cleanly · preserve App Review asset · salvage generic primitives · keep firewall live.

---

## What Changed (Surgical · 1 MOD + 7 deprecation headers + 2 NEW docs)

### MODIFIED (surgical unlock per spec §0)

| File | Change |
|---|---|
| `lib/scrapers/proxy/registry.ts` | Remove `fbArmyAdapter` import + array entry (13→12). `REGISTRY` type → `Partial<Record<ProviderName, Adapter>>`. `getAdapter("fb-army")` → `null` (fail-closed). `listEnabledAdapters` rewritten to handle Partial. |

### DEPRECATED (`@deprecated` JSDoc header · NO delete · git history preserved)

| File | Role | Salvage? |
|---|---|---|
| `lib/scrapers/proxy/adapters/fb-army.ts` | Dormant adapter (formerly registry entry 13) | NO — burner ingest |
| `fb-army/src/index.ts` | Droplet runtime orchestrator | NO — burner runner |
| `fb-army/src/ingest.ts` | Burner egress POST | NO — paired with adapter |
| `fb-army/src/proxy-egress.ts` | Residential proxy + burner session loader | PARTIAL — `assertEgressSafety()` shape reusable |
| `fb-army/src/fingerprint.ts` | UA/viewport/timezone randomization | PARTIAL — `humanDwell/humanScroll/jitter` are generic timing utils |
| `fb-army/src/scrapers/marketplace.ts` | Burner Marketplace scraper | NO — replaced by Apify logged-out |
| `fb-army/src/scrapers/groups.ts` | Burner Groups scraper | NO — replaced by Apify WF94 |
| `lib/fb-army-safety/burner-identity.ts` | Burner deny-list validator | NO — presupposes burners |

### NEW

| File | Purpose |
|---|---|
| `fb-army/DEPRECATED.md` | Manifest: DEAD vs SALVAGE + reuse points + droplet-destroy recommendation + reactivation-forbidden notice |
| `docs/audits/W27-A-world-b-winddown-salvage.md` | This artifact |

### KEEP ACTIVE (do NOT deprecate)

| File | Why active |
|---|---|
| `lib/fb-army-safety/isolation.ts` | World-A↔B firewall · runtime + type-level · also blocks deprecated-burner-symbol re-entry |
| `lib/fb-army-safety/pace-floor.ts` | Hardcoded human-pace floors · reusable for Apify · free scrapers · catalog sync |
| `lib/fb-army-safety/kill-switch.ts` | Generic emergency-stop · reusable as `killScrapers()` |
| `lib/fb-army-safety/verify-suite.mjs` | 6-check sim suite · proves safety primitives still work · 7/7 PASS post-wind-down |
| `.github/workflows/fb-army-safety.yml` | CI World-A grep guard · firewall stays armed |
| `scripts/fb-army-safety-guard.sh` | Local World-A grep guard |
| `lib/scrapers/rotation/*` (449 LOC) | Pure logic · zero burner assumption · zero importers · salvage-banked for Apify orchestration |
| `fb-army/src/envelope.ts` | Canonical CorpusEntry contract |
| `fb-army/src/smoke.mjs` | Pure-JS fixture pattern |

---

## Empirical Probes (§0.5 · BINDING #30)

| Probe | Result |
|---|---|
| `fb-army/` separate npm pkg | YES · own `package.json` + own `tsconfig` · root `tsconfig.json` `exclude: ["node_modules","fb-army"]` |
| Single World-A→fb-army coupling | YES · `lib/scrapers/proxy/registry.ts:15` only (pre-FIX-1) |
| `lib/scrapers/rotation/*` external importers | 0 (salvage-safe) |
| `burner-identity` callers in `lib/`+`app/` | 0 (only `lib/fb-army-safety/index.ts` barrel re-export · transitive) |
| Firewall grep post-FIX-1 | ✅ PASS · `bash scripts/fb-army-safety-guard.sh` → "zero forbidden references" |
| Verify-suite post-wind-down | ✅ 7/7 PASS · 443ms · salvage primitives intact |
| tsc post-all-fixes | 0 errors |

---

## DigitalOcean Droplet · RECOMMEND DESTROY

| Field | Value |
|---|---|
| IP | `167.71.172.192` |
| Provider | DigitalOcean |
| Cost | ~$14.40/mo idle |
| Status | Provisioned · never activated · no burners deployed |
| **Recommendation** | **CEO destroy in DigitalOcean console** · saves ~$14.40/mo · zero data loss |
| Why this CMD does NOT API-destroy | Out of scope per spec §8 MAY-NOT · BINDING #38 droplet API call · CEO executes via UI |

---

## Marketplace Coverage Reroute (banked)

| Source | Reroute | Defensibility |
|---|---|---|
| FB Marketplace (resale signal) | Apify logged-OUT actor ($29 cap absolute · APIFY-BURN W27 hardening) | Meta v. Bright Data · public unauth data |
| FB Marketplace (own catalog) | Meta Commerce Catalog API (W28 banked) | Official channel · same approved dev account |
| FB Groups (resale signal) | Apify WF94 (logged-out) | Same class as Marketplace |
| Lead Ads (inbound buyers) | W25-META-L1 webhook + Graph (LIVE) | World-A · already shipped |

---

## Doctrine Self-Audit

| BINDING | Status |
|---|---|
| #5 ENV-FILE-DUMP | APP · zero `.env*` touch |
| #16 DELEGATE-CANONICAL | APP · reuse Apify pattern · Catalog API official path |
| #17 AUDIT-FIRST-WIRE | APP · §0.5 5-probe cite verbatim |
| #20 PER-AGENT-WORKTREE / NEVER-ABANDON | APP · @deprecated not delete · git history preserved |
| #21 VERIFY-VERCEL | APP · post-push cite |
| #28 AUDIT-DOC-DRIFT | APP · zero hidden coupling found |
| #30 IT-DEEP-DIVE | APP |
| #34 SHA+DPL+CURL | APP · cited in §12 |
| #38 LAW lib/sylvia | PASS · 0 diff |
| Rule #11 DOC-META-SAFETY-ABSOLUTE | APP · firewall PRESERVED · isolation/CI-guard intact |

---

## Doctrine Candidate · DOC-WORLD-B-WINDDOWN-SALVAGE (1/5)

**Lesson:** when a parallel-world execution arm (own-infrastructure scraping · ToS-edge automation · self-managed account army) becomes unviable for compliance/risk reasons, the wind-down pattern is: (1) sever the single coupling at the World-A boundary · (2) `@deprecated`-quarantine the dead arm in place (NOT delete · git history is the audit trail) · (3) document salvage map + reuse points · (4) keep generic safety primitives active and explicitly marked salvage · (5) recommend infra destroy via CEO UI action (NOT API call).

**Sustains:** #20 never-abandon · #38 LAW lib/sylvia LOCKED (proves surgical-unlock pattern) · Rule #11 META-SAFETY (firewall preserved through the wind-down).

**Ratifies to BINDING after 5 sustained applications.**

---

## Banked Follow-ups

1. CEO destroys DO droplet `167.71.172.192` (~$14.40/mo savings).
2. W28 Meta Commerce Catalog API foothold at `app/api/catalog/sync` (banked spec).
3. Apify logged-out Marketplace actor coverage audit (existing $29 cap class).
4. Future cyl: refactor `lib/scrapers/rotation/*` into Apify-job orchestration (salvage target).

---

**Connecting Generations · Defensible · Reversible · Asset preserved.**
