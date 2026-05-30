# W23-L2 · FB-Army Droplet Scraper Module · World-B Engine

> CMD-W23-L2-FB-ARMY-DROPLET-SCRAPER-MODULE V20 MED · Agent A · agent-1 worktree
> Anchor HEAD: `4ee4921` (post reset)
> Date: 2026-05-29 PM · Wave 23 Lane 2

## §0 · §0.5 Deep-Dive 5-Check

| Check | Result |
|-------|--------|
| 1. Root tsconfig include/exclude | include `**/*.ts` etc · exclude was `["node_modules"]` · **added `"fb-army"`** |
| 2. Playwright NOT in root package.json | Confirmed absent · fb-army has own |
| 3. `fb-army/` absent pre-cyl | Confirmed · NEW dir |
| 4. Envelope contract `{id,title,body,metadata}` | Confirmed via W22-L1 audit cite |
| 5. LAW #38 lib/sylvia diff=0 | `git diff HEAD --name-only \| grep lib/sylvia/` → 0 hits ✓ |

**Verdict: §0.5 PASS 5/5**

## §1 · Module Files Created

```
fb-army/
├── package.json              (Playwright dep · NOT in root)
├── tsconfig.json             (own compile · noEmit · strict)
├── README.md                 (droplet setup + isolation rules + Phase-1 TRIAL checklist)
└── src/
    ├── fingerprint.ts        (UA/viewport/timezone/locale randomization + human-pace)
    ├── proxy-egress.ts       (residential proxy + burner session + World-A egress safety guard)
    ├── envelope.ts           (canonical {id,title,body,metadata} contract · W19-L1)
    ├── ingest.ts             (POST envelope to T3b proxy fb-army adapter)
    ├── index.ts              (CLI runner · reads FB_ARMY_JOB_JSON env)
    ├── smoke.mjs             (pure-JS fixture smoke · ZERO npm install · ZERO network)
    └── scrapers/
        ├── marketplace.ts    (FB Marketplace Playwright extractor)
        └── groups.ts         (FB Groups Playwright extractor)
```

**Root tsconfig.json**: single 1-line edit · added `"fb-army"` to `exclude` array.

## §2 · Smoke Test (Local Headless · Fixture · ZERO Network)

```
$ node fb-army/src/smoke.mjs

=== FB-Army Smoke (fixture · no network · no npm install) ===
Marketplace entries: 3
  [0] id=fb-army-6f2b82d8c04f2a11 title="Vintage Singer Sewing Machine"
  [1] id=fb-army-2fea11ddc8401ccd title="Antique Oak Rocking Chair"
  [2] id=fb-army-45bd1c1938c663bb title="Estate Sale: Silver Hallmark Tea Set"
Groups entries: 2
  [0] id=fb-army-a92f47ea474b77a4 title="Anyone know what this porcelain marking is worth"
  [1] id=fb-army-45b255a9a87d6cba title="Flipping update: scored a vintage typewriter at a yard sale..."

=== Envelope verify ===
MP: action=phase_c_ingest batchSize=3 verticalId=V9 sourceTier=T2
GRP: action=phase_c_ingest batchSize=2 verticalId=V10 sourceTier=T2

SMOKE: ✓ PASS
```

**5 envelope records emitted** (3 marketplace + 2 groups) · all `action=phase_c_ingest` · sourceTier=T2 · ≥1 per surface acceptance satisfied.

## §3 · World-A Isolation Attested

`proxy-egress.ts::assertEgressSafety()` runtime check refuses to run if any of these env vars present (would indicate World-A leak):
- `META_APP_SECRET`
- `FB_APP_SECRET`
- `FACEBOOK_GRAPH_TOKEN`
- `META_DEV_ACCESS_TOKEN`

Static guarantees:
- **ZERO** Graph API import
- **ZERO** `graph.facebook.com` HTTP call
- **ZERO** Meta dev account reference anywhere in source
- ALL secrets read from droplet env at runtime · NEVER repo · NEVER Vercel · BINDING #9 absolute

## §4 · Build Isolation Verify

| Gate | Result |
|------|--------|
| Root tsconfig exclude | `"fb-army"` added · single 1-line edit |
| Playwright in root deps | Confirmed absent · fb-army has own |
| Root tsc --noEmit | (running · expect 0 errors · fb-army excluded) |
| fb-army own tsc | Own config · `npx tsc --noEmit` available (requires `npm install` in fb-army/ for `playwright` + `@types/node`) |
| App build impact | ZERO · fb-army excluded from Next compile |

## §5 · LOCKED Diff Verify

```
git diff HEAD --name-only | grep -E "lib/sylvia/|app/|lib/scrapers/proxy/|lib/scrapers/rotation/"
→ 0 hits ✓

git diff HEAD -- package.json | grep -i playwright
→ 0 hits ✓ (Playwright NOT in root deps)
```

## §6 · Doctrine Sustained

- **BINDING #9** NO-CRED-IN-REPO · ATTESTED (ALL secrets droplet env only · zero committed)
- **BINDING #16** DELEGATE-TO-CANONICAL · clones WF93/94 Apify FB target surfaces (own engine · not Apify dep)
- **BINDING #17** AUDIT-FIRST-WIRE · root tsconfig + package.json read pre-edit
- **BINDING #28** drift catch · W22-L1 envelope lesson PRE-BAKED (zero flat-shape regression)
- **BINDING #30** §0.5 5-check PASS
- **BINDING #38** empirical · smoke output cited verbatim
- **DOC-SYLVIA-CORPUS-ENVELOPE-CONTRACT** CONSUMED · `{id,title,body,metadata}` per entry
- **DOC-META-DEV-ACCOUNT-ISOLATION-FROM-SCRAPERS** candidate progression **2/5**
- LAW #38 HARD GUARD attested
- ZERO new doctrines codified

## §7 · Banked (Phase-1 TRIAL · CEO-Gated)

- 1× droplet provision (DigitalOcean/Vultr · 2GB · ~$10-20/mo)
- 1× residential proxy account (Smartproxy/Bright Data/IPRoyal · ~$50-100/mo)
- 1× burner FB account · 7-14 day warming protocol (README §"Burner-warming protocol")
- Droplet env vars: `FB_ARMY_PROXY_URL` · `FB_ARMY_PROXY_USER` · `FB_ARMY_PROXY_PASS` · `FB_ARMY_BURNER_COOKIES_JSON` · `SCRAPER_PROXY_SECRET`
- T3b proxy fb-army adapter registration (separate cyl · adapter route addition)

## §8 · Flags

- Gaps: T3b proxy `fb-army` adapter not yet registered (ingest will return UNAUTHORIZED until added · separate cyl)
- Risks: FB anti-bot drift · selectors will need refresh post-real-world-test
- Missed data: live FB HTML parse (no provision yet · fixture-only validation)
- Carry-forward: Phase-1 TRIAL provision (CEO hands + ~$80-150/mo spend)
- Suggestions: burner-warming automation · per-job pace tuning · selector self-test
- Opportunity: own-tech FB substrate · proprietary moat · Apify cost displacement
