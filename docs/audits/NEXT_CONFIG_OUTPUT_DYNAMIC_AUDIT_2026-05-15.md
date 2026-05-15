# Next.js Config · `output: dynamic` Global Default Audit · 2026-05-15

> **Status:** Investigation-only · audit-doc class · zero source edit
> **Anchor:** P46 §12 banked LOW · "investigate Next.js 16 global default if available"
> **Cylinder:** CMD-NEXT-CONFIG-OUTPUT-DYNAMIC-DEFAULT V20 R29 P51 Wave 9 Slot 3
> **Track:** A · Claude system
> **Verdict:** 🔴 **NOT-EXISTS** · per-route `export const dynamic = "force-dynamic"` remains canonical

---

## §1 · Audit method

WebFetch Next.js 16 official docs · verify whether `output: dynamic` (or equivalent global rendering-default config) exists. Cite verbatim from canonical source · no inference from training data.

WebFetch sources probed:
1. `https://nextjs.org/docs/app/api-reference/config/next-config-js/output` (canonical `output` config page · version 16.2.6 · lastUpdated 2026-05-13)
2. `https://nextjs.org/docs/app/getting-started/partial-prerendering` (redirects to `getting-started/caching` · Cache Components model · version 16.2.6)

---

## §2 · Current state cite

- `next.config.ts`: **63 LOC** (spec said 70 · drift catch · grep verified at fire)
- NO `output:` field present
- Existing fields:
  - `outputFileTracingExcludes` (ffmpeg-static exclusion)
  - `outputFileTracingIncludes` (sharp + @img + bot skill packs)
  - `headers()` async function (security headers · CSP · COOP)
- Next.js version: `"next": "16.1.6"` (per `package.json`)
- Docs cite version: 16.2.6 (0.1.0 ahead of installed · same major-minor model)

---

## §3 · WebFetch verdict (verbatim cite)

### Source 1 · `output` config canonical page

URL: `https://nextjs.org/docs/app/api-reference/config/next-config-js/output`
Version: 16.2.6 · lastUpdated: 2026-05-13

**Documented `output:` values:**
- `output: 'standalone'` — emits `.next/standalone` folder with minimal server.js for deployment

**NOT documented on this page:**
- ❌ `output: 'dynamic'` — DOES NOT EXIST as a documented value
- ❌ `output: 'export'` — not listed on this page (commonly known for static export · separate)
- ❌ No experimental flag for global dynamic-default

**Verbatim quote (only documented value):**

> "Next.js can automatically create a `standalone` folder that copies only the necessary files for a production deployment including select files in `node_modules`. To leverage this automatic copying you can enable it in your `next.config.js`:
>
> ```js
> module.exports = {
>   output: 'standalone',
> }
> ```"

### Source 2 · Partial Prerendering / Cache Components

URL: `https://nextjs.org/docs/app/getting-started/partial-prerendering` (redirects to `getting-started/caching`)
Version: 16.2.6 · lastUpdated: 2026-05-13

**Next.js 16 canonical rendering model = Cache Components + Partial Prerendering (PPR):**

> "This rendering approach is called **Partial Prerendering (PPR)**, and it's the default behavior with Cache Components."

> "Next.js requires you to explicitly handle components that can't complete during prerendering. If they aren't wrapped in `<Suspense>` or marked with `use cache`, you'll see an `Uncached data was accessed outside of <Suspense>` error during development and build time."

**Global config that exists:**

```ts filename="next.config.ts"
const nextConfig: NextConfig = {
  cacheComponents: true,
}
```

`cacheComponents: true` is the **inverse pattern**: explicit opt-IN to cache-by-default with dynamic-at-boundary (via `<Suspense>` or runtime API access). This is NOT a "force all routes dynamic" flag — it's the modern PPR/Cache Components opt-in that fundamentally changes the rendering model.

### Source 3 · Experimental flags / migration

No experimental flag documented for global `output: dynamic`. The Cache Components flag is GA (not experimental) in 16.2.6.

---

## §4 · Verdict · 🔴 NOT-EXISTS

Next.js 16 does **NOT** support `output: dynamic` as a documented global config. The official `output:` field accepts only `'standalone'` (per source 1 verbatim).

**Alternative discovered:** `cacheComponents: true` is the Next.js 16 canonical opt-in to Partial Prerendering / Cache Components model. This is NOT equivalent to "all routes dynamic" — it's the dynamic-at-Suspense-boundary model with explicit `'use cache'` directives for static caching. Different mental model · different ergonomics · NOT a drop-in replacement for per-route `export const dynamic = "force-dynamic"`.

Per-route `export const dynamic = "force-dynamic"` remains the canonical pattern for LegacyLoop's current rendering model (Pages Router-style Server Components without Cache Components opt-in). The 45 directives shipped by P36 + P42 + P46 are the correct canonical pattern · no structural alternative exists in Next.js 16.1.6 / 16.2.6.

---

## §5 · Recommendation

**Bank LOW · close P46 §12 banked LOW item.**

- 🔴 NO follow-on wire cyl needed for `output: dynamic` (capability does not exist)
- ✅ Per-route directive remains canonical · new routes continue to add `export const dynamic = "force-dynamic"` per audit pattern
- 🟡 Banked carry-forward: **Cache Components migration** is a separate · larger architectural question (vision-level · Phase D+ band · NOT this audit's scope) · would require comprehensive rendering-model refactor across all 89 routes · not equivalent to "global dynamic-default"

**Doctrine candidate:** `DOC-PER-ROUTE-DYNAMIC-DIRECTIVE-CANONICAL` 1/5 NEW · per-route directive is the canonical Next.js 16 pattern for non-Cache-Components projects · empirically verified via official docs at this cyl.

**Cyclic flag:** `CY-N quarterly Next.js config audit` · re-investigate if Next.js feature graduates `output: dynamic` OR Cache Components migration becomes viable for LegacyLoop.

---

## §6 · Cross-references

- **P39 audit:** `docs/audits/ROUTES_DYNAMIC_DIRECTIVE_AUDIT_2026-05-14.md` (44 SAFE band anchor · audit predecessor)
- **P42 commit:** `b8df8b7` (10 MUST-ADD batch · pre-demo blockers shipped)
- **P46 commit:** `2f71057` (33 SHOULD-ADD batch · consistency sweep · this audit's anchor)
- **P51 audit cyl:** this file
- **Next.js docs (verbatim WebFetch · 2026-05-15):**
  - `https://nextjs.org/docs/app/api-reference/config/next-config-js/output`
  - `https://nextjs.org/docs/app/getting-started/caching`

---

*Authored R29 P51 Wave 9 Slot 3 · 2026-05-15 · Track A · agent-2 worktree · Devin L1 spec · IT execute*
