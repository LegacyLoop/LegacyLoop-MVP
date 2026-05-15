# LEGACYLOOP — WORLD-CLASS STANDARDS
# The canonical identity doc. Read every session. Non-negotiable.
# Imported by CLAUDE.md in every repo. Verbose reference banked at docs/WORLD_CLASS_STANDARDS_HISTORY.md.

## THE MISSION

Legacy-Loop exists to connect generations. We do that by building software simple enough for a 70-year-old estate seller AND premium enough to win Awwwards. Both at once. Every surface. Every interaction. Every line of code.

Standard: **Tesla center console meets Christie's auction house.** Premium. Intelligent. Dignified. Clear. Never fake. Never sloppy.

---

## SECTION 1 · THE SEVEN PILLARS — RULES

Every PR, every command, every commit is evaluated against these seven.

1. **MOTION** — physics-based scroll. Lenis 1.3.21 (duration 1.2 · cubic ease-out). Native browser scroll feels cheap.
2. **TYPE** — typography that moves. Per-char/word reveals tied to scroll. 18ms char stagger for headlines.
3. **PURPOSE** — every motion has a reason. Restraint is the signal. Cut motions that don't earn frame-budget.
4. **DEPTH** — layered parallax · blur · glow · noise (opacity 0.035) · ambient orbs (3-orb pattern · teal/deep-teal/amber).
5. **MICRO** — magnetic buttons (35% pull · spring-back) · hover breathing · `navigator.vibrate` haptics.
6. **STORY** — the page has an arc. Onboarding is a story. Item lifecycle is a story. Build for the arc.
7. **CRAFT** — SVG fractalNoise · safe-area insets · `prefers-reduced-motion` · `forced-colors` · `translateZ(0)` iOS glass.

Verbose recipes for each pillar: `docs/WORLD_CLASS_STANDARDS_HISTORY.md` §SEVEN_PILLARS_VERBOSE.

---

## SECTION 2 · THE 12 AWWWARDS EFFECTS — pointer

12 canonical effects defining 2024-2025 Awwwards winners. Match the source recipe · do not reinvent.

1. Smooth Scroll (Lenis) · 2. Word-by-word scroll opacity reveal · 3. Magnetic button · 4. Staggered card reveal · 5. Character-by-character headline reveal · 6. Animated gradient orb background · 7. Noise texture overlay · 8. Horizontal scrolling marquee · 9. Glow card hover · 10. Animated counting stats · 11. Preloader/page entry · 12. Custom cursor (desktop)

Recipe configs (timings · easings · sources · where shipped/pending): `docs/WORLD_CLASS_STANDARDS_HISTORY.md` §AWWWARDS_EFFECTS.

---

## SECTION 3 · DESIGN TOKENS (LOCKED)

If a value is not listed here, it does not exist in the system. Do not invent.

```
--accent:         #00BCD4   (brand teal · NEVER #0f766e)
--accent-dim:     rgba(0,188,212,0.12)
--accent-border:  rgba(0,188,212,0.3)
--accent-glow:    rgba(0,188,212,0.35)
--accent-deep:    #009688
--bg-primary:     #0D1117 (dark) / #f8fafc (light)
--bg-secondary:   #1A1F2E (dark) / #ffffff (light)
--bg-card-solid:  #16161e (dark) / #ffffff (light)
--text-primary:   #f1f5f9 (dark) / #0f172a (light)
--text-secondary: #cbd5e1 (dark) / #475569 (light)
--text-muted:     #94a3b8 (both)
--ghost-bg:       rgba(255,255,255,0.07) / rgba(0,0,0,0.04)
--border-default: rgba(255,255,255,0.12) / rgba(0,0,0,0.08)
--badge-bg:       rgba(0,188,212,0.14)
--badge-border:   rgba(0,188,212,0.35)
--purple-bg:      rgba(139,92,246,0.1)
--purple-border:  rgba(139,92,246,0.25)

Semantic (CORRECT — enforce):
  --success: #22c55e   (NOT #4caf50)
  --warning: #f59e0b   (NOT #ff9800)
  --error:   #ef4444   (NOT #f44336)

Special:
  --antique:     #D4AF37   (premium gold · antique alerts)
  --estate-warm: #D4A017   (estate sections ONLY)
  --megabot:     #8B5CF6   (MegaBot purple)

MegaBot providers: OpenAI=#22c55e | Claude=#a78bfa | Gemini=#3b82f6 | Grok=#f97316

Always-dark panels (modals/bot consoles): hardcode #e2e8f0 text · rgba(255,255,255,0.05) bg · DO NOT use vars.
Carrier brand colors (hardcode): USPS #333366 · UPS #351c15 · FedEx #4d148c
```

Surface defaults: card bg `rgba(255,255,255,0.03)` · card border `1px solid rgba(0,188,212,0.15)` · card radius 16px (primary) / 0.6rem (sub) · button radius 0.75rem · pill radius 9999px.

---

## SECTION 4 · TYPOGRAPHY (LOCKED)

```
Headings: Exo 2 (400-800)        · letterSpacing -0.02em on H1-H3
Body:     Plus Jakarta Sans (400-700) · lineHeight 1.6
Numbers/prices/stats/credits: Barlow Condensed (300-800)

CSS vars:
  --font-heading: var(--exo2)
  --font-body:    var(--plusJakarta)
  --font-data:    var(--barlowCondensed)
```

**Rules:**
- Barlow Condensed on EVERY number (prices · stats · credits · counts · percentages · dates · weights · dimensions). No exceptions.
- Never mix fonts within a data point (e.g., "$" and "49.99" must both be Barlow Condensed).
- Data labels: Plus Jakarta Sans 500 · letterSpacing 0.04em uppercase.

---

## SECTION 5 · SENIOR-FRIENDLY (NON-NEGOTIABLE · A11Y > AESTHETIC)

Primary users include seniors. These override aesthetic preferences.

**Touch targets:** 44px × 44px minimum on ALL tappable elements (buttons · tabs · toggles · pills · links · icons · checkboxes). No exceptions.

**Font size floors:**
```
Body:     ≥13px (0.8125rem)
Buttons:  ≥14px (0.875rem)
Data:     ≥15px (0.9375rem · prices · status · counts)
Badge:    ≥10px with fontWeight 700
Label:    ≥11px (0.6875rem)
Progress: ≥10px with bold
```

**Contrast:** body ≥7:1 · numbers ≥9:1 · interactive ≥4.5:1 (WCAG AA) · large text 18px+ ≥3:1.

**Additional:** focus indicators on all interactive · errors NEVER color-only (always include text/icon) · keyboard accessible · semantic HTML + ARIA · `prefers-reduced-motion` respected · 200% zoom must not break.

---

## SECTION 6 · PER-SURFACE BENCHMARKS — pointer

Every major surface has a reference benchmark. When unsure: find it · screenshot · match density and rhythm.

Quick highlights: Photo Upload = Dropbox+Shopify · Bot Results = Perplexity+Grok · Valuation = StockX+Robinhood · Antique Alert = Sotheby's · Messaging = Superhuman · Dashboard = Stripe · Item Detail = Instagram Shop+Facebook Marketplace · Marketplace = Mercari+Facebook Marketplace · Estate flows = warm/dignified/slower pace.

Full surface→benchmark map: `docs/WORLD_CLASS_STANDARDS_HISTORY.md` §PER_SURFACE_BENCHMARKS.

---

## SECTION 7 · 18 REFERENCE BENCHMARKS — pointer

Three tiers · 18 benchmark sites we measure against. When unsure, ask: *"Would [reference] ship this?"*

- **Tier 1 Agency/Animation:** Dennis Snellenberg · Olivier Larose · Lenis/Darkroom · GSAP Studios · Arc Browser · Vercel.
- **Tier 2 Product/SaaS:** Stripe Dashboard · Linear · Notion · Apple (Wallet/Settings) · Manus · Shopify Admin.
- **Tier 3 Consumer/Meta:** Instagram Stories · Facebook Marketplace · WhatsApp · Threads · Messenger · Instagram Shop.

Full benchmark descriptors (what each contributes): `docs/WORLD_CLASS_STANDARDS_HISTORY.md` §EIGHTEEN_BENCHMARKS.

---

## SECTION 8 · 8-POINT WORLD CLASS CHECK — RULES

Before marking ANY feature complete, must pass all eight:

1. **Investor** — Would an investor immediately understand this?
2. **Senior** — Would a 70-year-old estate seller use this without instruction?
3. **Awwwards** — Would this screenshot make Awwwards.com?
4. **Stripe** — Would this ship in the Stripe Dashboard?
5. **Apple** — Every tap haptic? Every curve physical?
6. **A11y** — WCAG 2.1 AA · keyboard-only · reduced-motion · forced-colors · screen reader.
7. **Mobile** — Zero clipping at 375px? Touch targets ≥44px?
8. **Theme** — Correct in light + dark? CSS vars used?

If ANY of the 8 fails · feature is not done. Open a gap in FLAGS.

---

## SECTION 9 · COPY STANDARDS — RULES

**Voice:** honest · dignified · grounded · intelligent. Never hype. Estate sections warm/empathetic/slower. Tech sections precise/confident/no buzzwords. Pre-revenue: "Join the first 100" / "Early Access" / "Pre-Launch Pricing." Never claim traction we don't have — integrity is a brand value.

**Words we never misspell:**
- **Connecting Generations** — our mission · exact capitalization
- **Legacy-Loop** — hyphenated · NEVER "LegacyLoop" one-word · NEVER "Legacy Loop" space (CEO 2026-05-15 brand correction)
- **MegaBot** — one word · camelCase · NOT "Megabot" / "Mega Bot"
- **legacy-loop.com** — kebab-case domain · NEVER "legacyloop.com"

**Words we avoid:** "revolutionary" · "game-changing" · "disrupting" · "synergy" · "just works" · "magical" · "effortless" (without proof) · any phrase a ChatGPT landing page would use.

---

## SECTION 10 · THE 5 BUILD LAWS — RULES

1. **Structural before cosmetic.** Fix broken-for-users before polishing. P0 fixes block P1 polish.
2. **Preserve what works.** Never rewrite working code for style. Upgrade for function only.
3. **Additive over destructive.** New skills/tokens/models = add. Never delete or overwrite without explicit approval.
4. **One scope per command.** Stay focused. Found a bug outside scope = bank for later, do not fix uninvited.
5. **The §12 V19 report is law.** Every command ends with §12. No exceptions. Engineering log Ryan reviews.

---

## SECTION 11 · COMMAND VOCABULARY — pointer

Standard CMD prefixes (when proposing new commands): `CMD-[FEATURE]` · `CMD-[BUG]-DIAGNOSTIC` · `CMD-[AREA]-AUDIT` · `CMD-[AREA]-POLISH` · `CMD-[AREA]-REFACTOR` · `CMD-[AREA]-V2`.

Active 12-CMD sequence + banked P0/P2 lists: `docs/WORLD_CLASS_STANDARDS_HISTORY.md` §COMMAND_VOCABULARY.

---

## SECTION 12 · LANDING-VS-APP GAP — pointer

Landing ~9/10 on 11 of 12 effects. App ~0-5/10 on 10 of 12. The 12-CMD sequence + banked P0/P2 commands close this gap.

Decision rule: *"If this were on landing, would it ship? If no, bring it up. If yes, ship the same standard on app."*

Full status detail: `docs/WORLD_CLASS_STANDARDS_HISTORY.md` §LANDING_VS_APP_GAP.

---

## SECTION 13 · CANON REFERENCE FILES — pointer

Reference material lives across landing repo · MVP repo · workspace. Full pointer list: `docs/WORLD_CLASS_STANDARDS_HISTORY.md` §CANON_REFERENCES. Always read before major design decisions.

---

## SECTION 14 · THE IDENTITY STATEMENT

We are building Legacy-Loop to a billion-dollar standard from day one. Every surface must be world-class. Landing and app. Both. No excuses.

The measure is not "good for a startup." The measure is: **would Stripe, Linear, Apple, or an Awwwards winner ship this?** If no — it is not done.

This document is the law. It is imported into every repo's CLAUDE.md. Claude Code, Cowork Claude, and every future agent that touches this codebase operates from this standard.

**Connecting Generations.** Built in Maine. Serving America. World-class everywhere.

# END OF WORLD_CLASS_STANDARDS.md — RULES + GOTCHAS · ~165 lines · verbose ref at docs/WORLD_CLASS_STANDARDS_HISTORY.md
