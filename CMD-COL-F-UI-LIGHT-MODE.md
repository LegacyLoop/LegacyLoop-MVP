# LEGACYLOOP — COMMAND TEMPLATE v11 UPDATED
**CMD-COL-F — CollectiblesBot Console Light Mode Professional Overhaul**
**March 27, 2026 | Ryan Hallee | Paste into Claude Code**

---

## SECTION 1 — CRITICAL DESIGN DIRECTIVE

READ BEFORE MAKING ANY CHANGES:

This app has an established design system: sleek, elegant, high-tech —
inspired by Tesla, SpaceX, and Grok. Dark theme, teal (#00bcd4) accents,
glass morphism cards, subtle animations, premium typography. Senior-friendly.

ALL styles inline style={{}} — NO Tailwind. NO external CSS.
NO className for styling. ONLY inline style={{}}. NO EXCEPTIONS.

LIGHT MODE RULE: Theme-aware surfaces MUST use CSS variables.
NEVER hardcoded rgba/hex on theme-aware surfaces.

ALWAYS-DARK PANELS: The bottom action bar is always dark MUST use
hardcoded colors (#e2e8f0 text, rgba(255,255,255,0.05) bg).
NEVER CSS variables on always-dark — they invert in light mode.

ELON MUSK STANDARD: This must feel like a $1B product.
Dense, smart, fast. Think Tesla center console meets enterprise SaaS.
Senior-friendly: 44px min button height, 16px min body text.

CollectiblesBot brand color: Purple #8b5cf6 / #7c3aed (darker for text on white).

THIS IS A UI-ONLY COMMAND. Two files. No logic changes. No API changes.
No schema changes. No new files.

---

## SECTION 2 — VERIFICATION CHECKPOINT

Run BEFORE starting. If it fails — STOP. Report failure. Do NOT proceed.

```bash
echo '=== CHECKPOINT ==='
grep 'DEMO_MODE' .env | head -2
npx tsc --noEmit 2>&1 | tail -3
echo '--- CollectiblesBot files ---'
wc -l app/bots/collectiblesbot/CollectiblesBotClient.tsx app/bots/collectiblesbot/page.tsx
echo '--- Dark background count ---'
grep -c "rgba(15,15,25" app/bots/collectiblesbot/CollectiblesBotClient.tsx
grep -c "rgba(15,15,25" app/bots/collectiblesbot/page.tsx
echo '--- Hardcoded #fff text on theme cards ---'
grep -n 'color: "#fff"' app/bots/collectiblesbot/CollectiblesBotClient.tsx | head -10
echo '--- Stats grid ---'
grep -n 'gridTemplateColumns' app/bots/collectiblesbot/CollectiblesBotClient.tsx | head -5
echo '=== CHECKPOINT COMPLETE ==='
```

---

## SECTION 3 — PERMANENTLY LOCKED FILES

Standard locked file list applies (Command Template v11 Updated, all sections).

**! SURGICAL UNLOCK FOR CMD-COL-F:**

- `app/bots/collectiblesbot/CollectiblesBotClient.tsx` — UNLOCKED (full light mode overhaul)
- `app/bots/collectiblesbot/page.tsx` — UNLOCKED (fix Suspense fallback)

All files return to LOCKED after Ryan approves CMD-COL-F.
DO NOT TOUCH any other files including:
- `app/api/bots/collectiblesbot/[itemId]/route.ts` — LOCKED (CMD-COL-D)
- `lib/enrichment/item-context.ts` — LOCKED (CMD-COL-D)
- `lib/megabot/prompts.ts` — LOCKED
- `collectible-detect.ts` — LOCKED
- `collectibles-score.ts` — LOCKED
- `BotItemSelector.tsx` — LOCKED

---

## SECTION 4 — ALL APPROVED + LOCKED FEATURES

Never touch, modify, or rebuild any of these:

Pass 1-5: All bot AI logic + prompts, MegaBot consensus engine, antique detection,
collectible detection, Amazon enrichment, shipping calculator, offer negotiation,
credit system, subscription tiers, pro-rate billing, commission, Publish Hub,
marketplace, bundles, trades, data pipelines, onboarding, email, pricing constants,
Item Control Center, message center.

CMD5J-7G: All shipping fixes, all bot console upgrades, all MegaBot engine upgrades.

CMD8A-8K: All Item Dashboard panel polish.

CMD-CAR-A through G: Full CarBot suite.

CMD-ANT-A through D: Full AntiqueBot suite (timeline, report, AI fine-tune).

CMD-COL-A through D: CollectiblesBot photo vision fix, 5 new categories,
5 new schema fields, category-aware demo generator, enrichment update — ALL LOCKED.

**LOCKED SECTIONS WITHIN UNLOCKED FILES:**
- CollectiblesBotClient.tsx — data extraction functions (extractSingleRun,
  extractMegaAgent, megaNormKeys): LOCKED
- CollectiblesBotClient.tsx — API handlers (runCollectiblesBot, runMegaBot): LOCKED
- CollectiblesBotClient.tsx — State management logic: LOCKED
- CollectiblesBotClient.tsx — Bottom action bar functionality: LOCKED (styling stays dark)

---

## SECTION 5 — DATA COLLECTION STANDARD

LegacyLoop collects and retains ALL data permanently. Nothing is purged.
Every feature must answer: Does this collect signal we learn from?
Does it make the next AI prediction better?
Does it create data nobody else has? Does it compound over time?
Flag all missed data collection opportunities.

---

## SECTION 6 — BUILD PATTERN

Read → Identify all rgba(15,15,25 → Replace with CSS vars → Fix text contrast →
Fix responsive grids → Add NaN guard → Add print styles → Build verify

No migrations. No new dependencies. UI-only.

---

## SECTION 7 — PLATFORM CONTEXT

PHASE 1 (NOW): Copy hub — no OAuth. 13 platforms. Demo-ready.
DEMO_MODE=true — admin bypasses all gates and credit deductions.
Both test accounts Tier 4 Estate Manager — full access.

---

## SECTION 8 — CREATIVE LATITUDE

You MAY: Improve text contrast beyond minimum spec, add hover states to
interactive elements, add subtle transitions, make purple brand elements
look premium on white backgrounds, flag any contrast issues not in scope.

You MAY NOT: Touch locked files, change data extraction logic, change API
handlers, change state management, change bottom action bar to light theme,
deviate from inline style={{}}, add npm packages, change schema.

Flag everything outside scope.

---

## SECTION 9 — DEMO MODE + ADMIN BYPASS

DEMO_MODE=true in .env — active now.
shouldBypassGates(user.role) checks isDemoMode() || isAdminUser(role)

TEST ACCOUNTS:
- annalyse07@gmail.com / LegacyLoop123! — Tier 4 Estate Manager
- ryanroger11@gmail.com / Freedom26$ — Tier 4 Estate Manager

SYSTEM_USER_ID = cmmqpoljs0000pkwpl1uygvkz
FEE MODEL: 3.5% total = 1.75% buyer + 1.75% seller. LOCKED.

---

## SECTION 10 — ENVIRONMENT VARIABLES

All 4 AI keys SET. Square SET (sandbox). SendGrid SET. DEMO_MODE=true.
ARTA_API_KEY SET (test). EASYPOST_API_KEY SET.

---

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## OBJECTIVE — CMD-COL-F: COLLECTIBLESBOT CONSOLE LIGHT MODE PROFESSIONAL OVERHAUL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

The CollectiblesBot console page uses hardcoded dark glass backgrounds
(`rgba(15,15,25,...)`) that render as ugly muddy grey boxes in light mode
with invisible body text. This is unacceptable for the investor demo.

**ISSUES TO FIX:**
1. (CRITICAL) Photo gallery section: `rgba(15,15,25,0.8)` at line ~699
2. (CRITICAL) Suspense fallback in page.tsx: `rgba(15,15,25,0.6)` at line ~62
3. (CRITICAL) Hardcoded `color: "#fff"` on theme-aware cards (~7 occurrences at lines 291, 592, 819, 847, 862, 1531) — invisible in light mode
4. (HIGH) Stats grid: `repeat(4, 1fr)` at line ~621 — breaks on mobile
5. (HIGH) ConfidenceMeter: no NaN guard at line ~375
6. (HIGH) Agent expand buttons: need 44px minimum touch targets
7. (MEDIUM) No print stylesheet for Professional Report section
8. (MEDIUM) Signal badge contrast on white backgrounds

**NOTE:** GlassCard, stats cards, page header, and SectionLabel were
partially fixed in a prior edit. CHECK CURRENT STATE before editing —
if already using var(--bg-card-solid), skip that item.

**! CRITICAL CONSTRAINTS:**
- Do NOT change data extraction functions (extractSingleRun, extractMegaAgent, megaNormKeys)
- Do NOT change API handlers (runCollectiblesBot, runMegaBot)
- Do NOT change state management logic
- Do NOT change bottom action bar to light — keep it dark
- Do NOT use an Agent — do all work directly
- ONLY fix visual appearance for light mode compatibility

**FILES TO MODIFY:**
1. `app/bots/collectiblesbot/CollectiblesBotClient.tsx` — full light mode overhaul
2. `app/bots/collectiblesbot/page.tsx` — Suspense fallback fix

---

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## PART A — MANDATORY FULL READ
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**! DO NOT BEGIN BUILDING UNTIL ALL READS ARE COMPLETE AND PRINTED.**

**Read app/bots/collectiblesbot/CollectiblesBotClient.tsx — targeted:**

FIND: ALL remaining `rgba(15,15,25` occurrences. Note exact line numbers.
FIND: GlassCard component — does it already use `var(--bg-card-solid)`?
FIND: Stats banner — does it already use `var(--bg-card-solid)`?
FIND: Photo gallery section — what background? Exact line number.
FIND: ConfidenceMeter — is value guarded for NaN? Exact line number.
FIND: Stats grid — what is `gridTemplateColumns`? Exact line number.
FIND: ALL `color: "#fff"` on theme-aware cards. List every line number.
FIND: Bottom action bar — what background? Exact line number. (KEEP DARK)
FIND: Agent expand/collapse buttons — what is minHeight? Exact lines.
FIND: Badge/signal components — what colors on white backgrounds?

**Read app/bots/collectiblesbot/page.tsx — FULL (74 lines):**

FIND: Suspense fallback — what background? Exact line number.

Print ALL findings with exact line numbers.

---

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## PART B — KILL ALL REMAINING DARK GLASS BACKGROUNDS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

File: `app/bots/collectiblesbot/CollectiblesBotClient.tsx`
File: `app/bots/collectiblesbot/page.tsx`

**NOTE:** GlassCard, stats cards, header, and SectionLabel may already be
fixed from a prior edit. CHECK CURRENT STATE before editing each item.
If already using `var(--bg-card-solid)`, SKIP that item.

**TASK B1:** Photo gallery section (~line 699):
REPLACE `background: "rgba(15,15,25,0.8)"` WITH `var(--bg-card-solid)`
REPLACE `border` rgba → `var(--border-default)`
REMOVE `backdropFilter` if present
ADD `boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)"`

**TASK B2:** Any other remaining `rgba(15,15,25` occurrences:
SCAN the entire 2060-line file for ALL remaining `rgba(15,15,25`.
Replace ALL with `var(--bg-card-solid)`.
Target: ZERO dark-glass backgrounds remaining in the file.

**TASK B3:** Suspense fallback in page.tsx (~line 62):
REPLACE `background: "rgba(15,15,25,0.6)"` WITH `var(--bg-card-solid)`
REPLACE `border` rgba → `1px solid var(--border-default)`

---

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## PART C — TEXT AND COLOR CONTRAST FIXES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

File: `app/bots/collectiblesbot/CollectiblesBotClient.tsx`

**TASK C1:** Fix hardcoded `color: "#fff"` on theme-aware cards.
Found at approximately lines 291, 592, 819, 847, 862, 1531.
For EACH occurrence:
- If it's inside the bottom action bar → KEEP as `"#fff"` (always dark)
- If it's on a theme-aware card/section → REPLACE with `var(--text-primary)`

**TASK C2:** Scan for other hardcoded light text colors:
- `rgba(255,255,255,...)` used as text color on theme-aware surfaces
- `#e2e8f0`, `#f1f5f9` used as text color on theme-aware surfaces
For each: replace with `var(--text-primary)` or `var(--text-muted)` as appropriate.
Exception: bottom action bar keeps hardcoded light text.

**TASK C3:** Signal badge/chip contrast:
Any purple badge text using `#a78bfa` (light purple) on white backgrounds →
change to `#7c3aed` (darker purple) for readability.

**TASK C4:** GridRow component (if exists):
Verify border uses `var(--border-default)`
Verify label uses `var(--text-muted)`
Verify value uses `var(--text-primary)`

---

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## PART D — RESPONSIVE GRIDS + ACCESSIBILITY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

File: `app/bots/collectiblesbot/CollectiblesBotClient.tsx`

**TASK D1:** Stats grid (~line 621):
REPLACE `gridTemplateColumns: "repeat(4, 1fr)"`
WITH `gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))"`
This gives 2-col on mobile, 4-col on desktop.

**TASK D2:** Condition grid (if exists as `1fr 1fr 1fr` or `repeat(3, 1fr)`):
REPLACE with `repeat(auto-fit, minmax(200px, 1fr))`

**TASK D3:** Agent expand/collapse buttons:
Enforce `minHeight: "44px"` and `minWidth: "44px"`
Add `aria-label` = "Expand agent details" / "Collapse agent details"

**TASK D4:** ConfidenceMeter NaN guard (~line 375):
REPLACE: `const pct = value > 1 ? value : Math.round(value * 100);`
WITH:
```javascript
const safeVal = typeof value === "number" && !isNaN(value) ? value : 0;
const pct = safeVal > 1 ? safeVal : Math.round(safeVal * 100);
```

**TASK D5:** All interactive buttons:
Verify `cursor: "pointer"` on all clickable elements.
Verify minimum 44px touch targets on mobile-facing buttons.

---

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## PART E — PRINT STYLES FOR PROFESSIONAL REPORT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

File: `app/bots/collectiblesbot/CollectiblesBotClient.tsx`

**TASK E1:** Add a print stylesheet using `useEffect` at component top level:

```javascript
useEffect(() => {
  const style = document.createElement("style");
  style.setAttribute("data-print-collectibles", "true");
  style.textContent = `
    @media print {
      body { background: white !important; color: black !important; }
      nav, footer, [data-no-print] { display: none !important; }
    }
  `;
  document.head.appendChild(style);
  return () => { style.remove(); };
}, []);
```

**TASK E2:** Add `data-no-print` attribute to the bottom action bar div
so it hides when printing.

---

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## PART F — BOTTOM ACTION BAR (KEEP DARK)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

File: `app/bots/collectiblesbot/CollectiblesBotClient.tsx`

**TASK F1:** The bottom sticky action bar STAYS DARK. Do NOT convert it
to CSS variables. Verify:
- Background uses hardcoded dark color (rgba or hex)
- All text/buttons inside use hardcoded light colors (`#fff`, `#e2e8f0`)
- Do NOT use `var(--text-primary)` or `var(--bg-card-solid)` here

---

## DO NOT CHANGE:

- CollectiblesBot API route (`route.ts`) — LOCKED
- `collectible-detect.ts` — LOCKED
- `collectibles-score.ts` — LOCKED
- `BotItemSelector.tsx` — LOCKED
- `lib/enrichment/item-context.ts` — LOCKED
- `lib/megabot/prompts.ts` — LOCKED
- Data extraction functions (extractSingleRun, extractMegaAgent, megaNormKeys)
- API handlers (runCollectiblesBot, runMegaBot)
- State management logic
- Bottom action bar functionality (only add data-no-print)

---

## SECTION 18 — VERIFICATION CHECKLIST

```
CHECKPOINT baseline: pass
Part A reads completed and printed: yes / no

DARK BACKGROUNDS:
— Photo gallery uses var(--bg-card-solid): yes / no
— Suspense fallback uses var(--bg-card-solid): yes / no
— grep -c "rgba(15,15,25" CollectiblesBotClient.tsx result: 0
— grep -c "rgba(15,15,25" page.tsx result: 0

TEXT CONTRAST:
— All color: "#fff" on theme cards → var(--text-primary): yes / no
— All rgba(255,255,255) text on theme cards fixed: yes / no
— Signal badges use #7c3aed (not #a78bfa) on white: yes / no
— GridRow borders/labels use CSS variables: yes / no

RESPONSIVE:
— Stats grid uses repeat(auto-fit, minmax(140px, 1fr)): yes / no
— Condition grid uses repeat(auto-fit, minmax(200px, 1fr)): yes / no

ACCESSIBILITY:
— ConfidenceMeter NaN guard added: yes / no
— Agent buttons 44px min height: yes / no
— Agent buttons have aria-label: yes / no
— All interactive buttons have cursor: pointer: yes / no

PRINT:
— Print stylesheet injected via useEffect: yes / no
— Bottom action bar has data-no-print: yes / no

BOTTOM ACTION BAR:
— Kept dark (hardcoded colors): confirmed
— All text inside uses hardcoded light colors: confirmed

DATA EXTRACTION LOGIC NOT CHANGED: confirmed
API HANDLERS NOT CHANGED: confirmed
STATE MANAGEMENT NOT CHANGED: confirmed
CMD-COL-A through D preserved: confirmed
All locked files untouched: yes / no
inline style={{}} throughout — no Tailwind, no className: yes / no
Senior-friendly (44px buttons, 16px body min): yes / no
npx tsc --noEmit: 0 errors
npm run build: pass
CHECKPOINT post-change: pass
Dev server: localhost:3000
```

---

## SECTION 19 — REQUIRED REPORT FORMAT

```
CHECKPOINT before: [pass / issue]
Part A printed: [yes / no]

DARK BACKGROUNDS:
— Photo gallery fixed: [yes / no]
— Suspense fallback fixed: [yes / no]
— Total rgba(15,15,25 remaining: [count — target: 0]

TEXT CONTRAST:
— color: "#fff" instances fixed: [count fixed / count remaining]
— rgba(255,255,255) text fixed: [count fixed]
— Badge contrast fixed: [yes / no / N/A]

RESPONSIVE:
— Stats grid: [old value → new value]
— Condition grid: [old value → new value / N/A]

ACCESSIBILITY:
— ConfidenceMeter NaN guard: [yes / no]
— Agent buttons 44px: [yes / no]
— aria-labels: [yes / no]

PRINT:
— Stylesheet injected: [yes / no]
— data-no-print on action bar: [yes / no]

BOTTOM ACTION BAR:
— Kept dark: [confirmed]

NOTHING CHANGED:
— Data extraction functions: confirmed
— API handlers: confirmed
— State management: confirmed
— CMD-COL-A through D: confirmed
— All locked files: confirmed

FLAGS FROM CLAUDE CODE:
— [Any remaining contrast issues]
— [Any edge cases found]

Files modified: [list all — exact paths]
New files created: [none]
Schema changes needed: [none]
Build: [pass / fail]
TypeScript: [0 errors / list all errors]
CHECKPOINT after: [pass / issue]
Dev server: localhost:3000

IF POST-CHECKPOINT FAILS:
REVERT IMMEDIATELY.
Report exactly what broke and what was touched.
Do NOT proceed until clean.
```

---

**Command CMD-COL-F | LegacyLoop | March 27, 2026 | Ryan Hallee**
