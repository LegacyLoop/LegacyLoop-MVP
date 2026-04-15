# ════════════════════════════════════════════════════════════════
# LEGACYLOOP — WORLD-CLASS STANDARDS
# The canonical identity doc. Read every session. Non-negotiable.
# Imported by CLAUDE.md in every repo. This IS how we build.
# ════════════════════════════════════════════════════════════════

## THE MISSION

LegacyLoop exists to connect generations. We do that by building
software that is simple enough for a 70-year-old estate seller AND
premium enough to win Awwwards. Both at once. Every surface. Every
interaction. Every line of code.

Standard: **Tesla center console meets Christie's auction house.**
Premium. Intelligent. Dignified. Clear. Never fake. Never sloppy.

---

## ═══════════════════════════════════════════
## SECTION 1 — THE SEVEN PILLARS
## ═══════════════════════════════════════════

These are the traits every billion-dollar site shares. Memorize them.
Every PR, every command, every commit is evaluated against these seven.

### 01 / MOTION — Butter-smooth scroll
Physics-based, weighted, cinematic. Native browser scroll feels cheap.
Lenis 1.3.21 is the standard. duration 1.2, easing cubic ease-out.
Landing has it. App target: CMD-LENIS-APP.

### 02 / TYPE — Typography that moves
Words reveal character-by-character. Opacity tied to scroll. The hero
headline doesn't appear — it assembles itself. 18ms char stagger for
headlines. Per-word 0.15 → 1.0 opacity for scroll-linked paragraphs.

### 03 / PURPOSE — Every motion has a reason
Nothing decorates. Everything communicates. Restraint is the signal.
The best Awwwards sites know what NOT to animate. If a motion does not
earn its frame-budget, cut it.

### 04 / DEPTH — Depth on a flat screen
Layered parallax. Blur. Glow. Ambient gradient orbs. Noise texture at
opacity 0.035. Makes the dark background feel infinite, not empty.
Three-orb pattern: teal top-center (12s), deep-teal right (16s), amber
bottom-left (20s).

### 05 / MICRO — Micro-interactions that feel alive
Magnetic buttons (35% pull, cubic-bezier(0.23, 1, 0.32, 1) spring-back).
Cards that breathe on hover. Haptics on tap (navigator.vibrate).
Cursors that react. The difference between premium and generic.

### 06 / STORY — The page has an arc
You begin somewhere and arrive somewhere. Each section earns its place.
Scroll is narrative, not navigation. Onboarding is a story. The item
lifecycle (DRAFT → COMPLETED) is a story. Build for the arc.

### 07 / CRAFT — The details no one asked for
SVG fractalNoise at opacity 0.035. Safe-area insets on every fixed
element. prefers-reduced-motion respected everywhere. forced-colors
mode supported. translateZ(0) on iOS-flickering glass. The 1% that
compounds into the difference.

---

## ═══════════════════════════════════════════
## SECTION 2 — THE 12 AWWWARDS EFFECTS
## ═══════════════════════════════════════════

These are the effects that define 2024–2025 Awwwards winners.
Source: LegacyLoop Awwwards Master Reference + Olivier Larose +
Dennis Snellenberg + Lenis + GSAP.

Every effect below has a canonical implementation. When applying one,
match the source recipe. Do not reinvent.

### 01 · Smooth Scroll (Lenis)
- Source: lenis.darkroom.engineering
- Config: duration 1.2, easing (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t))
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
- Config: threshold 0.5, duration 2200ms, ease-out quart (1 - Math.pow(1 - progress, 4)).
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

## ═══════════════════════════════════════════
## SECTION 3 — DESIGN TOKENS (LOCKED)
## ═══════════════════════════════════════════

These are the canonical color and surface values. Every agent, every
command, every commit uses these. If a value is not listed here, it
does not exist in the system. Do not invent tokens. Do not substitute.

### Background
```
--bg-primary:     #0D1117  (dark) / #f8fafc  (light)
--bg-secondary:   #1A1F2E  (dark) / #ffffff  (light)
--bg-card-solid:  #16161e  (dark) / #ffffff  (light)
```

### Accent / Brand Teal
```
--accent:         #00BCD4  — primary brand teal. Used everywhere.
--accent-dim:     rgba(0,188,212,0.12)
--accent-border:  rgba(0,188,212,0.3)
--accent-glow:    rgba(0,188,212,0.35)
--accent-deep:    #009688  — deep accent for gradients and hover states
```

### Semantic Colors (CORRECT values — enforce these)
```
--success:        #22c55e  — NOT #4caf50. Every instance of #4caf50 is wrong.
--warning:        #f59e0b  — NOT #ff9800. Every instance of #ff9800 is wrong.
--error:          #ef4444  — NOT #f44336. Every instance of #f44336 is wrong.
```

### Special / Premium
```
--antique:        #D4AF37  — antique/premium gold. Antique Alert, rare items.
--estate-warm:    #D4A017  — estate sections ONLY. Warmer gold for estate flows.
--megabot:        #8B5CF6  — MegaBot purple.
```

### MegaBot Provider Colors
```
OpenAI:   #22c55e
Claude:   #a78bfa
Gemini:   #3b82f6
Grok:     #f97316
```

### Text
```
--text-primary:   #f1f5f9  (dark) / #0f172a  (light)
--text-secondary: #cbd5e1  (dark) / #475569  (light)
--text-muted:     #94a3b8  (both modes)
```

### Surfaces / Cards
```
Card background:  rgba(255,255,255,0.03) (dark) / #ffffff (light)
Card border:      1px solid rgba(0,188,212,0.15)
Card radius:      16px (primary cards) / 0.6rem (sub-cards/nested)
Button radius:    0.75rem
Pill radius:      9999px
```

### Ghost / Glass
```
--ghost-bg:       rgba(255,255,255,0.07) (dark) / rgba(0,0,0,0.04) (light)
--border-default: rgba(255,255,255,0.12) (dark) / rgba(0,0,0,0.08) (light)
```

### Badge System
```
--badge-bg:       rgba(0,188,212,0.14)
--badge-border:   rgba(0,188,212,0.35)
--purple-bg:      rgba(139,92,246,0.1)
--purple-border:  rgba(139,92,246,0.25)
```

### Always-Dark Panels (hardcode, do NOT use CSS vars)
Modal overlays, bot consoles, print documents, shipping labels:
- Text: #e2e8f0
- Background: rgba(255,255,255,0.05)
- These are CORRECT to hardcode. Do not convert to variables.

### Carrier Brand Colors (hardcode, do NOT use CSS vars)
```
USPS:   #333366
UPS:    #351c15
FedEx:  #4d148c
```

---

## ═══════════════════════════════════════════
## SECTION 4 — TYPOGRAPHY STANDARDS (LOCKED)
## ═══════════════════════════════════════════

### Font Families (Google Fonts — loaded in layout.tsx)
```
Headings:           Exo 2 (weights: 400, 500, 600, 700, 800)
Body:               Plus Jakarta Sans (weights: 400, 500, 600, 700)
Numbers/prices/     Barlow Condensed (weights: 300–800)
stats/credits:
```

### CSS Variables
```
--font-heading: var(--exo2)
--font-body:    var(--plusJakarta)
--font-data:    var(--barlowCondensed)
```

### Rules
- Barlow Condensed on EVERY number: prices, stats, credits, counts,
  percentages, dates, weights, dimensions. No exceptions.
- Headings: Exo 2. Always. letterSpacing: "-0.02em" on H1–H3.
- Body: Plus Jakarta Sans. lineHeight: 1.6 for paragraphs.
- Data labels: Plus Jakarta Sans 500. letterSpacing: "0.04em" uppercase.
- Never mix fonts within a single data point (e.g., "$" and "49.99"
  must both be Barlow Condensed).

---

## ═══════════════════════════════════════════
## SECTION 5 — SENIOR-FRIENDLY RULES (NON-NEGOTIABLE)
## ═══════════════════════════════════════════

Our primary users include seniors. These rules are not optional.
They override aesthetic preferences. Accessibility > style.

### Touch Targets
- Minimum 44px × 44px on ALL tappable elements (Apple HIG).
- Includes: buttons, tabs, toggles, pills, links, icons, checkboxes.
- If an element is tappable, it must be 44px. No exceptions.

### Font Size Floors
```
Body text:         never below 13px (0.8125rem)
Buttons/CTAs:      never below 14px (0.875rem)
Important data:    never below 15px (0.9375rem) — prices, status, counts
Badge text:        minimum 10px (0.625rem) with fontWeight 700
Label text:        minimum 11px (0.6875rem)
Progress labels:   minimum 10px (0.625rem) with bold
```

### Contrast Ratios
```
Body text:         7:1 minimum against background
Numbers/data:      9:1 minimum against background
Interactive:       4.5:1 minimum (WCAG AA)
Large text (18px+): 3:1 minimum (WCAG AA)
```

### Additional
- Focus indicators: visible on ALL interactive elements.
- Error states: NEVER color-only — always include text or icon.
- Keyboard navigation: all features accessible without mouse.
- Screen reader: semantic HTML, ARIA labels on icons/buttons.
- Reduced motion: prefers-reduced-motion respected everywhere.
- Zoom: test at 200% browser zoom. Nothing should break.

---

## ═══════════════════════════════════════════
## SECTION 6 — PER-SURFACE STANDARDS
## ═══════════════════════════════════════════

Every major surface in LegacyLoop has a reference benchmark. When
building or polishing a surface, it must feel like the reference.
"Feel like" = interaction density, layout rhythm, information
hierarchy, micro-interactions, and confidence level.

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

When in doubt about a surface: find the reference, screenshot it,
match the density and rhythm. Do not guess.

---

## ═══════════════════════════════════════════
## SECTION 7 — THE 18 REFERENCE BENCHMARKS
## ═══════════════════════════════════════════

We measure against three tiers. Every UI decision routes into one of
these tiers. When unsure, ask: "Would [reference] ship this?"

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

## ═══════════════════════════════════════════
## SECTION 8 — ACCEPTANCE CRITERIA (8-point World Class Check)
## ═══════════════════════════════════════════

Before marking ANY feature complete, it must pass all eight:

1. **Investor test** — Would an investor immediately understand this?
2. **Senior test** — Would a 70-year-old estate seller use this without instruction?
3. **Awwwards test** — Would this screenshot make it onto Awwwards.com?
4. **Stripe test** — Would this ship in the Stripe Dashboard?
5. **Apple test** — Does every tap have haptic feedback? Every curve feel physical?
6. **Accessibility test** — WCAG 2.1 AA. Keyboard-only. Reduced-motion. Forced-colors. Screen reader.
7. **Mobile test** — Zero clipping at 375px? Touch targets ≥ 44px?
8. **Theme test** — Correct in both light and dark mode? CSS variables used?

If ANY of the eight fails, feature is not done. Open a gap in FLAGS.

---

## ═══════════════════════════════════════════
## SECTION 9 — COPY STANDARDS
## ═══════════════════════════════════════════

### The voice
- Honest. Dignified. Grounded. Intelligent. Never hype.
- Estate sections: warm, empathetic, human. Slower pace. More space.
- Tech sections: precise, confident, no buzzwords.
- Pre-revenue: "Join the first 100" / "Early Access" / "Pre-Launch Pricing".
- Never claim traction we don't have. Integrity is a brand value.

### The words we never misspell
- **Connecting Generations** — our mission. Exact capitalization.
- **LegacyLoop** — one word, camelCase. Not "Legacy Loop" or "legacyloop".
- **MegaBot** — one word, camelCase. Not "Megabot" or "Mega Bot".
- **legacy-loop.com** — kebab-case domain. Never "legacyloop.com".

### The words we avoid
- "revolutionary" · "game-changing" · "disrupting" · "synergy"
- "just works" · "magical" · "effortless" (without proof)
- Any phrase that a ChatGPT landing page would use

---

## ═══════════════════════════════════════════
## SECTION 10 — THE 5 BUILD LAWS
## ═══════════════════════════════════════════

### Law 1 — Structural before cosmetic
Fix broken-for-users before polishing. A beautiful status-bar-overlap
is still broken. P0 fixes block P1 polish. Always.

### Law 2 — Preserve what works
Never rewrite working code for style. Upgrade for function. If a
component renders correctly, do not touch it. CARD-ELEVATION upgrades
visuals without rewriting logic — that's the pattern.

### Law 3 — Additive over destructive
New skill packs: add. Never delete. New tokens: extend globals.css.
Never overwrite. New models: extend schema. Never drop fields without
explicit approval.

### Law 4 — One scope per command
Stay focused. Log discoveries for later in V16 FLAGS. If you find a
bug outside scope, BANK it as a future CMD. Do not fix uninvited.

### Law 5 — The V16 report is law
Every command ends with a V16 report. No exceptions. Even for small
changes. It is the engineering log. Ryan reviews every one.

---

## ═══════════════════════════════════════════
## SECTION 11 — THE COMMAND VOCABULARY
## ═══════════════════════════════════════════

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

## ═══════════════════════════════════════════
## SECTION 12 — THE GAP (Landing vs App)
## ═══════════════════════════════════════════

Landing is at ~9/10 on 11 of 12 effects. App is at ~0–5/10 on 10 of 12.
The mission of the 12-CMD sequence plus the banked P0/P2 commands is
to close this gap. When a decision is unclear, ask:

> "If this were on the landing page, would it ship? If no, bring it up.
>  If yes, ship the same standard on the app."

---

## ═══════════════════════════════════════════
## SECTION 13 — THE CANON REFERENCES
## ═══════════════════════════════════════════

These files are the canonical reference material. Read before design
decisions. Re-read during major command work.

### In the landing repo
- `public/LegacyLoop_Landing_Page_Master_Handoff.md` — 41KB design spec
- `AGENTS.md` — shared engineering standards
- `CLAUDE.md` — landing-specific law

### In the MVP repo
- `CLAUDE.md` — MVP-specific law (51 models, 181 routes, 201 skill packs)
- `AGENTS.md` — shared engineering standards
- `WORLD_CLASS_STANDARDS.md` — THIS FILE

### In workspace (Cowork-accessible)
- `LegacyLoop-Competitor-Audit.html` — 7 apps, 54 patterns
- `LegacyLoop-WorldClass-Standards-Audit.html` — 12 effects, 18 benchmarks
- `LEGACYLOOP_Awwwards_Landing_Master.md` — Ryan's reference playbook
- `LEGACYLOOP_Complete_Master_Code.md` — 22 production-ready components
- `LEGACYLOOP_Real_Source_Code.md` — verified source code for 10 effects

---

## ═══════════════════════════════════════════
## SECTION 14 — THE IDENTITY STATEMENT
## ═══════════════════════════════════════════

We are building LegacyLoop to a billion-dollar standard from day one.
Every surface must be world-class. Landing and app. Both. No excuses.

The measure is not "good for a startup."
The measure is: **would Stripe, Linear, Apple, or an Awwwards winner
ship this?**

If no — it is not done.

This document is the law. It is imported into every repo's CLAUDE.md.
Claude Code, Cowork Claude, and every future agent that touches this
codebase operates from this standard.

**Connecting Generations.**
Built in Maine. Serving America. World-class everywhere.

# ════════════════════════════════════════════════════════════════
# END OF WORLD_CLASS_STANDARDS.md
# If you read this far, you understand the standard. Now ship it.
# ════════════════════════════════════════════════════════════════
