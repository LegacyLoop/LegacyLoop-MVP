# W22-L2 · Amazon Site-Stripe Affiliate + Rainforest Free-100 Burn Start

> CMD-W22-L2-AMAZON-SITE-STRIPE-RAINFOREST-FIRE V20 LOW · Agent A · agent-1 worktree
> Anchor HEAD: `b20d14b` → `4da8f8c` (post commit + FF-push)
> Date: 2026-05-29 PM · Wave 22 Lane 2

## §0 · §0.5 Deep-Dive 4-Check

| Check | Result |
|-------|--------|
| 1. Existing app/ affiliate surface | `AmazonPriceBadge.tsx` canonical · 21 Amazon-touching files · EXTEND (BINDING #16) |
| 2. WF90 cred reachable | `Header Auth account 3` (id `C3nFg2Ltuh4dNiKu`) bound post W20-R4 cred-patch |
| 3. `legacyloop-20` tag injection | `withAffiliateTag()` helper · `URL.searchParams.set('tag','legacyloop-20')` · amazon.* hostname guard |
| 4. LAW #38 lib/sylvia diff=0 | `git diff HEAD --name-only \| grep lib/sylvia/` → 0 hits ✓ |

**Verdict: §0.5 PASS**

## §1 · Part A · Affiliate Surface Shipped

**File**: `app/items/[id]/AmazonPriceBadge.tsx` (+73 LOC additive · EXTEND not parallel)

**Helper**:
```ts
const AMAZON_ASSOCIATES_TAG = "legacyloop-20"; // WCS §9 brand-canonical EXCEPTION (Amazon strips hyphen)

function withAffiliateTag(rawUrl: string): string {
  try {
    const u = new URL(rawUrl);
    if (!u.hostname.includes("amazon.")) return rawUrl;
    u.searchParams.set("tag", AMAZON_ASSOCIATES_TAG);
    return u.toString();
  } catch {
    return rawUrl;
  }
}
```

**CTA**:
- "View on Amazon" anchor · 44px min-height (senior-friendly touch target)
- `rel="sponsored noopener noreferrer"` (Google affiliate SEO + tab-nap safety)
- `aria-label="View this product on Amazon (affiliate partner link)"` (A11y)
- Inline styles only (no Tailwind/className for styling)
- `topResult?.link` guard prevents render when no Amazon data
- FTC disclosure: "Partner link · Legacy-Loop earns a small commission at no extra cost to you"

**Deploy**:
- Commit `4da8f8c` · branch `agent-1-slot → main` FF-push
- dpl `legacy-loop-js8ff7tdr-legacyloop-5084s-projects.vercel.app` · **Ready** · 2m build
- curl prod `app.legacy-loop.com/` → **200 OK** · `x-vercel-id: iad1::iad1::kcqfs-...`
- curl dpl URL → **200 OK**
- BINDING #21 VERIFY-VERCEL satisfied

## §2 · Part B · WF90 Rainforest Manual Execute · Free-100 Burn Start

WF90 `93yUmHHJOjoZcUut` · cred-patched account-3 · proxy auth gate working post W20-R4.

| exec_id | timestamp | items | sentinels | sample (asin · price) | credits_remaining | webhook |
|---------|-----------|-------|-----------|----------------------|-------------------|---------|
| **1960** | 2026-05-29 22:40 UTC | **30** | 0 | B0FKTS7JQM · $35.99 | **80/100** | 1 |
| 1959 | 2026-05-29 22:34 UTC | 30 | 0 | B0FQ5RH7LD · $51.99 | 81/100 | 1 |
| 1946 (pre-fix) | 2026-05-29 20:06 UTC | sentinel | 1 | UNAUTHORIZED | n/a | 1 sentinel |

**Search term used (day-rotation)**: `"antique silver hallmark"`

**Burn accounting (CEO Rule 8 preserved)**:
- 80/100 credits remaining
- 20 used cumulative (CEO pre-cyl probing + 2 W22-L2 manual runs)
- Per-run cost: **1 call** = 1 Rainforest search request
- Sentinel threshold: 25 remaining (75 used) → NOT triggered (55-call buffer)
- Zero auto-upgrade · CEO Rule 8 sustained

**Envelope verification (W19 lesson · DOC-SYLVIA-CORPUS-ENVELOPE-CONTRACT)**:
- BP emits canonical `{action:phase_c_ingest, data:{source, corpusId, verticalId:V9, domain:marketplace-amazon-bulk, sourceTier:T2, batchSize, emittedAt, sources, entries:[{id,title,body,metadata}]}}`
- Webhook fires reached Sylvia queue
- 60 real Amazon items inserted (30 per exec × 2 successful runs)

## §3 · LOCKED Diff Verify

```
git diff HEAD --name-only | grep -E "lib/sylvia/|prisma/|package.json"
→ 0 hits ✓
```

Single-file additive edit · zero new packages · zero schema · zero env.

## §4 · 8-Point World Class Check (Affiliate Surface)

| Point | Status |
|-------|--------|
| 1. Investor | ✓ revenue-driving surface · clear partner-link disclosure |
| 2. Senior | ✓ 44px touch target · readable 14px text · centered button |
| 3. Awwwards | N/A (function-first not visual) |
| 4. Stripe | N/A |
| 5. Apple | N/A |
| 6. A11y | ✓ aria-label · rel sponsored · keyboard accessible (anchor tag) |
| 7. Mobile (375px) | ✓ full-width CTA · 44px target |
| 8. Theme | ✓ uses `var(--accent)` + `var(--text-muted)` · light + dark both work |

## §5 · Doctrine Sustained

- **BINDING #16** DELEGATE-TO-CANONICAL · EXTENDED `AmazonPriceBadge.tsx` not parallel surface
- **BINDING #17** AUDIT-FIRST-WIRE · file read pre-edit
- **BINDING #21** VERIFY-VERCEL-AFTER-COMMIT · dpl_id + curl 200 cited
- **BINDING #30** §0.5 4-check PASS
- **BINDING #34** widened cite · (a) `4da8f8c` (b) `legacy-loop-js8ff7tdr` Ready (c) curl 200 + WF90 exec 1959+1960
- **BINDING #38** empirical · per-exec items + credits cited
- **BINDING #50** sentinel burn-cap @75 (50-call buffer)
- DOC-SYLVIA-CORPUS-ENVELOPE-CONTRACT · CONSUMED (W19 lesson · zero repeat of flat-shape bug)
- LAW #38 attested · ZERO `lib/sylvia/` mutation
- ZERO new doctrines

## §6 · Banked

- ★ **SECURITY**: Associates payment-change email alert (2 emails 4 min apart 5/29) — CEO verify in Associates Central · NOT this lane's scope
- CMD-RAINFOREST-PAID-UPGRADE-CEO-DECISION ($23/mo post-burn if needed · NO auto-upgrade)
- CMD-W23-AMAZON-CREATORS-API-UNLOCK (currently 0/10 sales · unlocks at 10 affiliate conversions)
- Burn-meter UI hint (banked observability for future cyl)

## §7 · Flags

- Gaps: none (Parts A + B both green)
- Risks: Associates security alert (banked CEO)
- Missed: Local build PASS not verified (agent-1 sylvia-data symlink Turbopack block · Vercel build clean from GitHub)
- Carry-forward: Creators API 0/10 unlock gate
- Suggestions: burn-meter UI surface in admin view (banked W23)
- Opportunity: V9 substrate +60 Amazon items/2-runs at $0 · scales linearly within free 100/mo
