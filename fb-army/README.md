# fb-army · World-B FB Scraper Engine

> **CRITICAL ISOLATION**: This module is **World B**. It NEVER imports, references, or authenticates with the Meta dev account (World A). All identity (burner FB session) + egress (residential proxy) read from **droplet runtime env**. NEVER from repo. NEVER from Vercel env. NEVER shared with World A.

## What this is

Droplet-side headless Playwright scraper for FB Marketplace + Groups. Emits canonical Sylvia corpus envelope `{action:phase_c_ingest, data:{entries:[{id,title,body,metadata}]}}` to T3b proxy `fb-army` adapter endpoint.

## What this is NOT

- NOT provisioned (CEO follow-on: droplet + residential proxy + burner FB · $80-150/mo TRIAL)
- NOT in app build (root tsconfig excludes `fb-army` · Playwright NOT in root deps)
- NOT touching World A (Meta dev account · Graph API · etc)

## Module layout

```
fb-army/
├── package.json              # own Playwright dep (not in root)
├── tsconfig.json             # own compile config
├── README.md                 # this file
└── src/
    ├── fingerprint.ts        # UA/viewport/timezone/locale randomization + human-pace
    ├── proxy-egress.ts       # residential proxy + burner session from droplet env
    ├── envelope.ts           # canonical {id,title,body,metadata} corpus contract
    ├── ingest.ts             # POST envelope to T3b proxy fb-army adapter
    ├── index.ts              # CLI runner · reads FB_ARMY_JOB_JSON env
    ├── smoke.mjs             # local fixture test · zero network
    └── scrapers/
        ├── marketplace.ts    # FB Marketplace headless extractor
        └── groups.ts         # FB Groups headless extractor
```

## Local smoke test (zero network · fixture HTML)

```bash
cd fb-army
npm install
npm run smoke
```

Expect: ≥1 entry per surface · envelope action=phase_c_ingest · exit 0.

## Type-check (own compile · isolated from root)

```bash
cd fb-army
npx tsc --noEmit
```

## Phase-1 TRIAL provision checklist (CEO-gated · NOT this lane)

1. **Droplet** · DigitalOcean / Vultr · Ubuntu 22.04 · 2GB RAM min · ~$10-20/mo
2. **Residential proxy** · Smartproxy / Bright Data / IPRoyal · ~$50-100/mo (5GB-50GB plan)
3. **Burner FB account** · burner email + new SIM phone verification · 7-14 day warming (browse content · light interactions · NO scraping during warm)
4. **Droplet env vars** (NEVER commit):
   - `FB_ARMY_PROXY_URL=http://gw.proxy:7000`
   - `FB_ARMY_PROXY_USER=<username>`
   - `FB_ARMY_PROXY_PASS=<password>`
   - `FB_ARMY_BURNER_COOKIES_JSON='{"accountId":"burner-001","cookies":[...]}'`
   - `SCRAPER_PROXY_SECRET=<T3b proxy secret>`
   - `FB_ARMY_PROXY_ENDPOINT=https://app.legacy-loop.com/api/scrapers/proxy` (optional override)
5. **Install on droplet**: `cd fb-army && npm install && npx playwright install chromium`
6. **Run job**: `FB_ARMY_JOB_JSON='{"kind":"marketplace","query":{"city":"boston","query":"vintage typewriter"}}' npm start`

## Isolation rules (ABSOLUTE)

| Rule | What |
|---|---|
| **World A firewall** | This module MUST NEVER reference `META_APP_SECRET`, `FB_APP_SECRET`, `FACEBOOK_GRAPH_TOKEN`, `META_DEV_ACCESS_TOKEN`. Runtime check in `proxy-egress.ts` aborts if any present. |
| **No repo creds** | All session cookies + proxy creds + secrets read from droplet env at runtime · BINDING #9 absolute · ZERO committed. |
| **No Graph API** | This module uses headless browser only · NO `graph.facebook.com` HTTP calls · NO official SDK. |
| **Disposable burners** | If a burner gets flagged · DESTROY + replace · NEVER reuse · NEVER link to real identity. |
| **Human-pace** | Default pace: 2.5-7.5s dwell · 0.8-2.4s scroll · 40 items/session cap · 12 min/session cap. |

## Burner-warming protocol (Phase-1 ops · banked)

1. Day 1-3: log in via residential proxy · browse feed 5-10 min/day · NO scraping
2. Day 4-7: join 3-5 resale-relevant groups · NO scraping
3. Day 8-14: light interactions (1-2 reactions/day · NO comments) · NO scraping
4. Day 15+: begin scraping at conservative pace (40 items/session · 1 session/day) · ramp gradually

## Doctrine

- **DOC-META-DEV-ACCOUNT-ISOLATION-FROM-SCRAPERS** (candidate · 2/5) · World-A firewall absolute
- **BINDING #9** NO-CRED-IN-REPO attested · all secrets droplet runtime only
- **BINDING #16** DELEGATE-TO-CANONICAL · clones WF93/94 Apify FB target surfaces (own engine · not Apify dep)
- **DOC-SYLVIA-CORPUS-ENVELOPE-CONTRACT** consumed · entries `{id,title,body,metadata}` only (W19-L1 + W22-L1 lesson)
- **LAW #38** HARD GUARD · ZERO `lib/sylvia/` · ZERO `app/` · ZERO root package.json modifications
