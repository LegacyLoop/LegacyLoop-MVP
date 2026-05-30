# FB/Meta Army · Dormant State · Certified 2026-05-30

> **Single canonical source of truth** for the FB/Meta army. Certified provably dormant + firewalled. **CEO retains ALL activation** (CLAUDE.md Rule #11 · DOC-META-SAFETY-ABSOLUTE). This document is certification + documentation only — zero activation, zero deletion, zero code change.

**CMD:** CMD-W27-G3-FB-ARMY-DORMANCY-CERT · V20 · Track A · Agent B (agent-2)
**Anchor:** f63c1f4 · builds on df1043f (lift) · fed0194 (firewall proof · W27-D)
**Verdict:** 🟢 Firewall 0-coupling certified · dormancy fail-closed · CEO-only activation.

---

## §1 · Two Worlds

| | World-A | World-B |
|---|---|---|
| **What** | Official Meta APIs (Graph, CAPI, Send, webhooks, page-scope OAuth) | Burner headless-browser scraper engine (`fb-army/`) |
| **Status** | Shipped, dormant (W25/W26 — page connect, CAPI, unified webhook, AES-256-GCM token vault) | Built, **NEUTRAL · never activated · never deleted** |
| **Auth** | App Review + per-user OAuth tokens | Residential proxy + burner sessions (CEO/manual only) |
| **Activation** | App Review approval + live keys | live 6/6 verify suite + CEO `activate OK · FB-ARMY` |
| **Firewall rule** | MUST NEVER be referenced by World-B | MUST NEVER reference World-A creds/APIs |

The two worlds are **type-level + import-level firewalled**. The CI guard (`scripts/fb-army-safety-guard.sh`) fails the build if `fb-army/` contains any World-A reference.

---

## §2 · Dormancy Proof (fail-closed)

`fb-army/src/index.ts` runner gate (cited verbatim):

```ts
function loadJobFromEnv(): Job | null {
  const raw = process.env.FB_ARMY_JOB_JSON;
  if (!raw) return null;          // ← no job env → null → no work. FAIL-CLOSED.
  try { return JSON.parse(raw) as Job; } catch { return null; }
}
```

- No `FB_ARMY_JOB_JSON` env present → runner returns `null` → **zero scraping**. The army does nothing unless explicitly handed a job spec on the droplet.
- Every `runJob` first calls `assertEgressSafety()` — throws on any World-A/Meta-cred presence before a single request.
- Proxy adapters (`lib/scrapers/proxy/adapters/{fb-army,meta}.ts`) are registered in `registry.ts` but **env-gated** — registration ≠ activation.

---

## §3 · Firewall Proof (empirical · re-run 2026-05-30)

§0.5 EVIDENCE block, verbatim outputs:

```
== EVIDENCE A · World-A↔World-B cross-import scan (expect 0) ==
0
== EVIDENCE B · all fb-army refs in lib/app (.ts) ==
23      (all World-B-zone: shim re-exports, proxy adapters/registry/types,
         scrapers/safety internal comments — ZERO World-A product imports)
== EVIDENCE C · FB_ARMY_* env reads (gated only) ==
23
== EVIDENCE D · CI guard ==
GUARD PASS
✅ fb-army/ World-A grep guard PASS · zero forbidden references
== EVIDENCE E · shims thin re-export ==
lib/fb-army-safety/isolation.ts  export*from count=1
lib/scrapers/rotation/index.ts   export*from count=1
== fb-army local smoke (zero-network fixture) ==
MP:  action=phase_c_ingest batchSize=3 verticalId=V9 sourceTier=T2
GRP: action=phase_c_ingest batchSize=2 verticalId=V10 sourceTier=T2
SMOKE: ✓ PASS (≥1 envelope record per surface required)
== tsc ==
0 errors (before AND after — proves zero code touched)
```

**Cross-import = 0** is the binding firewall metric: no World-A product file imports `fb-army/src` or `fb-army/index`. Precedent: W27-D `fed0194` firewall proof + LIVE CI guard `.github/workflows/fb-army-safety.yml`.

---

## §4 · Lifted Generic-Core Map

W27-A lifted backend-agnostic orchestration/safety out of the army into reusable cores (no longer FB-specific):

- **`lib/scrapers/orchestration/{controller,cost,health,index,types}.ts}`** — rotation controller, cost optimizer, health state machine.
- **`lib/scrapers/safety/{isolation,kill-switch,pace-floor,index}.ts`** — egress isolation, kill-switch (`fb-army-killed.flag`), human-pace floor.

**`lib/fb-army-safety/` — complete inventory (6 files · NOT shim-only · correction 2026-05-30):**

| File | Lines | Role |
|---|---|---|
| `isolation.ts` | 7 | thin shim → `../scrapers/safety/isolation` (EVIDENCE E) |
| `kill-switch.ts` | 7 | thin shim → `../scrapers/safety/kill-switch` |
| `pace-floor.ts` | 7 | thin shim → `../scrapers/safety/pace-floor` |
| `burner-identity.ts` | 106 | **ORIGINAL validator · NOT a shim** (CMD-W24-L1). Refuse-line *enforcement* primitive: `REAL_IDENTITY_PATTERNS` deny-list (rejects any burner whose accountId/email/name/phone overlaps Ryan / Legacy-Loop / Meta-dev / `annalyse07` test acct) + `SYNTHETIC_EMAIL_RE` (burner email MUST be synthetic) + `validateBurnerIdentity()` / `auditBurnerRoster()`. **Blocks misuse — it is enforcement, not evasion automation.** |
| `index.ts` | 7 | barrel · re-exports isolation + pace-floor + burner-identity + kill-switch |
| `verify-suite.mjs` | 328 | **6-check verification suite** (CMD-W24-L1 · built-in `node:test` · sim mode · live-mode path documented per check). This IS the Rule #11 **6/6 live-verify gate**; re-runs against real droplet/proxy/burner at Phase-1 provision. |

The other lift shim: `lib/scrapers/rotation/index.ts` → `scrapers/orchestration`.

**Do NOT delete any of these.** The shim trio + rotation shim preserve import paths (lift contract · EVIDENCE E thin `export * from`); `burner-identity.ts` + `verify-suite.mjs` are the **original Meta-safety enforcement substrate** (Rule #11 · the `lib/fb-army-safety/*` referenced in DOC-META-SAFETY-ABSOLUTE), not lifted/genericized. Generic-core (`scrapers/orchestration` + `scrapers/safety`) currently has **no live caller** (orphan-ready) — acceptable; it activates when Manus / Apify / burner-army calls it.

---

## §5 · fb-army Package Inventory

```
fb-army/
├── package.json          isolated deps (Playwright · own module · World-B only)
├── tsconfig.json         isolated TS config (excluded from root build)
├── README.md             World-B engine doc + firewall contract
└── src/
    ├── index.ts          droplet runner · FB_ARMY_JOB_JSON gate (fail-closed)
    ├── envelope.ts        canonical corpus envelope {id,title,body,metadata}
    ├── fingerprint.ts     UA/fingerprint randomization + human-pace throttle
    ├── proxy-egress.ts    residential proxy + burner session + egress safety guard
    ├── ingest.ts          T3b proxy POST (token auth) back to ingest
    ├── scrapers/marketplace.ts   FB Marketplace headless extractor
    ├── scrapers/groups.ts        FB Groups headless extractor
    └── smoke.mjs          zero-network fixture smoke (PASS above)
```

**`lib/fb-army-safety/` (in-app Meta-safety primitives · compiled by Next.js · NOT part of the `fb-army/` pkg · full role detail in §4 table):**

```
lib/fb-army-safety/
├── isolation.ts       thin shim → ../scrapers/safety/isolation
├── kill-switch.ts     thin shim → ../scrapers/safety/kill-switch
├── pace-floor.ts      thin shim → ../scrapers/safety/pace-floor
├── burner-identity.ts ORIGINAL validator (106L · CMD-W24-L1) · real-identity deny-list + synthetic-email enforcement · blocks misuse (NOT evasion)
├── index.ts           barrel · re-exports isolation + pace-floor + burner-identity + kill-switch
└── verify-suite.mjs   6-check verify suite (328L · node:test sim) · Rule #11 6/6 live-verify gate
```

---

## §6 · Activation Procedure (CEO-ONLY · DO-NOT-AUTO-EXECUTE)

> **No AI agent and no automated process activates the army.** This sequence is documented for CEO reference only. This cylinder does not approach the activation line.

1. **Live 6/6 verify suite PASS** at Phase-1 provision (1 droplet + 1 residential proxy + 1 burner session).
2. **Burner-account creation = manual CEO/operator work.** An AI agent will NOT create burner accounts or build fingerprint-evasion automation (honest-agent refuse-line, §7).
3. **CEO issues `activate OK · FB-ARMY`** — the only signal that flips dormant → live (Rule #11).
4. Set `FB_ARMY_JOB_JSON` on the droplet → runner picks up the job spec.

**Rule #11 verbatim (CLAUDE.md):**
> DOC-META-SAFETY-ABSOLUTE (candidate 1/5 · W24-L1 2026-05-30): never infringe upon Meta · ALL FB-Army activation BLOCKED until live-mode 6/6 verify suite PASS at Phase-1 provision AND CEO `activate OK · FB-ARMY` sign-off. Substrate at `lib/fb-army-safety/*` + CI guard `scripts/fb-army-safety-guard.sh`.

---

## §7 · Honest Limits (refuse-line · held)

- An AI agent will **NOT** build burner-account creation or fingerprint/detection-evasion automation. That line stays held regardless of directive.
- The **sanctioned World-B path** is marketplace scraping via **logged-OUT public access** (Apify-style), which is legally defensible (*Meta v. Bright Data* — public, logged-out data). Logged-in impersonation / ToS-circumvention is **not** built.
- World-A (official Meta APIs) remains the primary, compliant growth path. World-B is a contingency engine kept neutral, never the default.

---

## Certification

Firewall 0-coupling **certified clean** (EVIDENCE A=0, GUARD PASS). Dormancy **fail-closed** (FB_ARMY_JOB_JSON gate). Shims **thin + kept**. tsc=0 before+after (zero code touched). Army stays dormant. **CEO retains all activation.**

*Connecting Generations · Built in Maine · World-class everywhere.*
