# Legacy-Loop · WORLD_CLASS_STANDARDS.md History — Banked Reference

This file holds verbose reference content that used to live in `WORLD_CLASS_STANDARDS.md`. Banked here on 2026-05-08 PM as part of the WCS+AGENTS trim cylinder (538 → ~165 lines · saves ~17K tokens per API call · captures the remaining 10-20% of CodeBurn's $46K/call savings target).

**Loaded on demand · NOT auto-imported.** Read this file when you need:
- Verbose 7 pillars elaboration
- Full 12 Awwwards Effects recipes (sources · configs · timings · easings)
- Full per-surface benchmark mapping table
- Full 18 Reference Benchmarks descriptors
- Active 12-CMD sequence + banked P0/P2 cylinder lists
- Landing-vs-app gap detail
- Canon reference file paths

For active rules + gotchas, see `WORLD_CLASS_STANDARDS.md`. Tokens stay in `docs/CLAUDE_HISTORY.md` §CSS_TOKENS.

---

## §SEVEN_PILLARS_VERBOSE

### 01 / MOTION — Butter-smooth scroll
Physics-based, weighted, cinematic. Native browser scroll feels cheap. Lenis 1.3.21 is the standard. duration 1.2, easing cubic ease-out. Landing has it. App target: CMD-LENIS-APP.

### 02 / TYPE — Typography that moves
Words reveal character-by-character. Opacity tied to scroll. The hero headline doesn't appear — it assembles itself. 18ms char stagger for headlines. Per-word 0.15 → 1.0 opacity for scroll-linked paragraphs.

### 03 / PURPOSE — Every motion has a reason
Nothing decorates. Everything communicates. Restraint is the signal. The best Awwwards sites know what NOT to animate. If a motion does not earn its frame-budget, cut it.

### 04 / DEPTH — Depth on a flat screen
Layered parallax. Blur. Glow. Ambient gradient orbs. Noise texture at opacity 0.035. Makes the dark background feel infinite, not empty. Three-orb pattern: teal top-center (12s), deep-teal right (16s), amber bottom-left (20s).

### 05 / MICRO — Micro-interactions that feel alive
Magnetic buttons (35% pull, cubic-bezier(0.23, 1, 0.32, 1) spring-back). Cards that breathe on hover. Haptics on tap (navigator.vibrate). Cursors that react. The difference between premium and generic.

### 06 / STORY — The page has an arc
You begin somewhere and arrive somewhere. Each section earns its place. Scroll is narrative, not navigation. Onboarding is a story. The item lifecycle (DRAFT → COMPLETED) is a story. Build for the arc.

### 07 / CRAFT — The details no one asked for
SVG fractalNoise at opacity 0.035. Safe-area insets on every fixed element. prefers-reduced-motion respected everywhere. forced-colors mode supported. translateZ(0) on iOS-flickering glass. The 1% that compounds into the difference.

---

## §AWWWARDS_EFFECTS · 12 canonical recipes

These are the effects that define 2024–2025 Awwwards winners. Source: Legacy-Loop Awwwards Master Reference + Olivier Larose + Dennis Snellenberg + Lenis + GSAP. Every effect has a canonical implementation. When applying one, match the source recipe. Do not reinvent.

### 01 · Smooth Scroll (Lenis)
- Source: lenis.darkroom.engineering
- Config: duration 1.2, easing `(t) => Math.min(1, 1.001 - Math.pow(2, -10 * t))`
- Where: Landing (shipped). App (CMD-LENIS-APP pending).
- Guard: prefers-reduced-motion disables.

### 02 · Word-by-word scroll opacity reveal
- Source: Olivier Larose blog · text-gradient-scroll-opacity-v2
- Config: per-word opacity 0.15 → 1.0, translateY(8px) → 0, tied to IntersectionObserver progress.
- Where: Landing (shipped). App: onboarding, item detail narrative, help hero.

### 03 · Magnetic button
- Source: Awwwards GSAP studios
- Config: 35% pull on mouseMove, cubic-bezier(0.23, 1, 0.32, 1) spring-back on mouseLeave.
- Where: Landing hero CTA (shipped). App: top-10 primary CTAs only. Restraint.

### 04 · Staggered card reveal
- Source: IntersectionObserver pattern
- Config: index * 80ms stagger, opacity 0 → 1, translateY(32px) → 0, 0.6s cubic-bezier(0.23, 1, 0.32, 1).
- Where: Landing (shipped). App: ItemCard grids, BotHub, TestimonialGrid, OfferHistoryTimeline.

### 05 · Character-by-character headline reveal
- Source: Dennis Snellenberg · Arc · Linear · Vercel
- Config: per-char translateY(100%) → 0, 18ms stagger, 0.7s cubic-bezier(0.23, 1, 0.32, 1).
- Where: Landing hero (shipped). App: login welcome, dashboard first-visit.

### 06 · Animated gradient orb background
- Source: Vercel · Neon · Trigger.dev · 2024 Awwwards hero standard
- Config: 3 radial orbs, position:fixed, pointer-events:none, 12–20s ease-in-out infinite.
- Colors: rgba(0,188,212,0.09) teal top-center, rgba(0,150,136,0.06) deep-teal right, rgba(212,160,23,0.04) amber bottom-left.
- Where: Landing (shipped). App: auth, dashboard hero, bot detail.

### 07 · Noise texture overlay
- Source: Apple · Vercel standard
- Config: position:fixed, inset:0, opacity 0.035, SVG fractalNoise base64 inline, backgroundSize 200px 200px.
- Where: Landing (shipped). App: global root layout via CMD-NOISE-OVERLAY-APP.

### 08 · Horizontal scrolling marquee
- Source: Framer · Webflow · Linear
- Config: 30s linear infinite, doubled items for seamless loop, pause on hover.
- Where: Landing marketplace ticker (shipped). Landing-only.

### 09 · Glow card hover
- Source: Linear · Neon · Liveblocks
- Config: border rgba(0,188,212,0.12) → rgba(0,188,212,0.5), box-shadow 0 0 30px rgba(0,188,212,0.12), translateY(-4px), 0.3s cubic-bezier(0.23, 1, 0.32, 1).
- Where: Landing (shipped). App: glass system shipped (CMD-GLASSMORPHISM-SYSTEM), rollout mid-flight (CMD-CARD-ELEVATION).

### 10 · Animated counting stats
- Source: IntersectionObserver + requestAnimationFrame
- Config: threshold 0.5, duration 2200ms, ease-out quart `(1 - Math.pow(1 - progress, 4))`.
- Where: Landing (shipped). App: dashboard KPIs, credit balance, pricing tier numbers.

### 11 · Preloader / page entry
- Source: Awwwards standard entry sequence
- Config: 800ms content visible → 0.6s fade → unmount at 1400ms. iOS failsafe to 4-5s. CSS nuclear fallback forces content visible if JS fails.
- Where: Landing (shipped). App: first-load shell + PWA splash via CMD-APPLE-TOUCH-PWA.

### 12 · Custom cursor (desktop)
- Source: Dennis Snellenberg pattern
- Config: pointer: fine media query gate, mix-blend-mode: difference.
- Where: Landing (shipped). Landing-only — app is primarily touch.

---

## §PER_SURFACE_BENCHMARKS

Every major surface in Legacy-Loop has a reference benchmark. When building or polishing a surface, it must feel like the reference. "Feel like" = interaction density, layout rhythm, information hierarchy, micro-interactions, and confidence level.

| Surface               | Must Feel Like                     |
|-----------------------|------------------------------------|
| Photo Upload          | Dropbox + Shopify                  |
| Bot Results           | Perplexity + Grok                  |
| Valuation Panel       | StockX + Robinhood                 |
| Antique Alert         | Sotheby's                          |
| Messaging             | Superhuman                         |
| Shipping Center       | ShipStation                        |
| Dashboard             | Stripe Dashboard                   |
| Listing Generator     | Jasper AI                          |
| Pricing Page          | Linear                             |
| Onboarding            | Duolingo                           |
| Item Detail           | Instagram Shop + Facebook Marketplace |
| Bot Hub               | Linear command center              |
| Marketplace           | Mercari + Facebook Marketplace     |
| Estate Flows          | Warm, dignified, slower pace       |

When in doubt about a surface: find the reference, screenshot it, match the density and rhythm. Do not guess.

---

## §EIGHTEEN_BENCHMARKS · 18 Reference Benchmarks (descriptors)

We measure against three tiers. Every UI decision routes into one of these tiers. When unsure, ask: "Would [reference] ship this?"

### Tier 1 — AGENCY / ANIMATION (landing bar)
- **Dennis Snellenberg** (Awwwards SOTY) — Character headline assembly.
- **Olivier Larose** (tutorial source) — Scroll-gradient opacity. Copy the recipe.
- **Lenis / Darkroom** (motion lab) — Physics-based scroll. Lenis IS the library.
- **GSAP Studios** (animation ref) — Magnetic CTAs, spring-back easing.
- **Arc Browser** (product art) — Hero as film. Zoom parallax + ambient orbs + noise.
- **Vercel** (dark-mode bar) — Noise overlay discipline. opacity 0.035 globally.

### Tier 2 — PRODUCT / SAAS (app bar)
- **Stripe Dashboard** (data density) — Empty states + skeleton loaders. System-wide.
- **Linear** (keyboard-first) — Command palette ⌘K. Every action one keystroke away.
- **Notion** (offline-first) — Slash commands, block editing, optimistic sync.
- **Apple (Wallet / Settings)** (haptics) — navigator.vibrate on every primary tap. Spring curves that feel physical.
- **Manus** (AI UX) — Reasoning transparency. Show the AI thinking. Progressive disclosure.
- **Shopify Admin** (commerce ops) — Action density without clutter.

### Tier 3 — CONSUMER / META (scale bar)
- **Instagram Stories** (photo physics) — Snap-scroll + rubber-band + progress dots + pinch-zoom. The carousel standard.
- **Facebook Marketplace** (resale benchmark) — Photo-first flow, AI-autofill, category breadcrumbs.
- **WhatsApp** (messaging) — Optimistic sends + typing indicators. Never block the user.
- **Threads** (launch polish) — Clean, confident, restrained. Proof Meta ships clean when focused.
- **Messenger** (micro + haptics) — Long-press reactions. Floating menu. Haptic spring.
- **Instagram Shop** (commerce surface) — Product cards that breathe. Grid density + photo quality.

---

## §COMMAND_VOCABULARY

Standard CMD prefixes (use when proposing new commands):

- **CMD-[FEATURE]** — new feature build
- **CMD-[BUG]-DIAGNOSTIC** — root-cause investigation before fix
- **CMD-[AREA]-AUDIT** — comprehensive review (no code changes)
- **CMD-[AREA]-POLISH** — visual/micro-interaction upgrades
- **CMD-[AREA]-REFACTOR** — structural cleanup, no behavior change
- **CMD-[AREA]-V2** — major version of an existing command

### The active 12-CMD sequence (Spring 2026)
1. ✅ CMD-HAMBURGER
2. ✅ CMD-PHOTO-DISPLAY
3. ✅ CMD-BOTTOM-NAV-POLISH
4. ✅ CMD-GLASSMORPHISM-SYSTEM
5. 🚧 CMD-CARD-ELEVATION (in flight)
6. ⏳ CMD-TYPOGRAPHY
7. ⏳ CMD-LOADING-SKELETONS
8. ⏳ CMD-EMPTY-STATES
9. ⏳ CMD-ANIMATION-MICRO
10. ⏳ CMD-APPLE-TOUCH-PWA
11. ⏳ CMD-ACCESSIBILITY-AUDIT
12. ⏳ CMD-POLISH-MICRO

### Banked P0 fixes (before P1 polish continues)
- CMD-PHOTO-CAROUSEL-DIAGNOSTIC (Airbnb/Instagram-grade rewrite)
- CMD-SAFE-AREA-GLOBAL-AUDIT (status bar overlap)
- CMD-BOTTOM-NAV-FUNCTIONAL-AUDIT (routing, +, badges)
- CMD-HAPTICS-V1 (navigator.vibrate standard)

### Banked P2 differentiators (post-sequence)
- CMD-LENIS-APP · CMD-COMMAND-PALETTE · CMD-AMBIENT-ORBS-APP
- CMD-NOISE-OVERLAY-APP · CMD-SCROLL-NARRATIVE
- CMD-MEGABOT-THEATRE · CMD-STORY-ARCS

---

## §LANDING_VS_APP_GAP

Landing is at ~9/10 on 11 of 12 effects. App is at ~0–5/10 on 10 of 12. The mission of the 12-CMD sequence plus the banked P0/P2 commands is to close this gap.

When a decision is unclear, ask:

> "If this were on the landing page, would it ship? If no, bring it up. If yes, ship the same standard on the app."

---

## §CANON_REFERENCES

These files are the canonical reference material. Read before design decisions. Re-read during major command work.

### In the landing repo
- `public/LegacyLoop_Landing_Page_Master_Handoff.md` — 41KB design spec
- `AGENTS.md` — shared engineering standards
- `CLAUDE.md` — landing-specific law

### In the MVP repo
- `CLAUDE.md` — MVP-specific law (53 models, 200+ routes, 201 skill packs)
- `AGENTS.md` — shared engineering standards
- `WORLD_CLASS_STANDARDS.md` — THIS FILE'S TRIMMED PARENT

### In workspace (Cowork-accessible)
- `LegacyLoop-Competitor-Audit.html` — 7 apps, 54 patterns
- `LegacyLoop-WorldClass-Standards-Audit.html` — 12 effects, 18 benchmarks
- `LEGACYLOOP_Awwwards_Landing_Master.md` — Ryan's reference playbook
- `LEGACYLOOP_Complete_Master_Code.md` — 22 production-ready components
- `LEGACYLOOP_Real_Source_Code.md` — verified source code for 10 effects

---

## §HISTORY_LOG · WCS provenance

- **2026-05-08 PM** — WCS trim cylinder · 538 → ~165 lines · banked verbose ref into this file. Trigger: complete CodeBurn's #1 finding (CLAUDE.md trim earlier today captured ~80% of $46K/call · this trim captures remaining ~10-20%). Companion: AGENTS.md trim (193 → ~120 lines · banked at `docs/AGENTS_HISTORY.md`).
