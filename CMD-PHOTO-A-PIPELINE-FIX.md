# LEGACYLOOP — COMMAND TEMPLATE v11 UPDATED
**CMD-PHOTO-A — Photo Pipeline Accuracy Fixes (MegaBot Multi-Photo + AnalyzeBot Model)**
**March 27, 2026 | Ryan Hallee | Paste into Claude Code**

---

## SECTION 1 — CRITICAL DESIGN DIRECTIVE

READ BEFORE MAKING ANY CHANGES:

This app has an established design system: sleek, elegant, high-tech —
inspired by Tesla, SpaceX, and Grok. Dark theme, teal (#00bcd4) accents,
glass morphism cards, subtle animations, premium typography. Senior-friendly.

ALL styles inline style={{}} — NO Tailwind. NO external CSS.
NO className for styling. ONLY inline style={{}}. NO EXCEPTIONS.

ELON MUSK STANDARD: This must feel like a $1B product.

THIS IS A BACKEND ACCURACY COMMAND. 3 files modified. No UI changes.
The proven photo pattern exists in `lib/adapters/ai.ts` (lines 6-22):
`publicUrlToAbsolutePath()` → `guessMime()` → `fileToDataUrl()` → base64
CollectiblesBot already uses this pattern correctly.
MegaBot and AnalyzeBot need fixes.

---

## SECTION 2 — VERIFICATION CHECKPOINT

Run BEFORE starting. If it fails — STOP. Report failure. Do NOT proceed.

```bash
echo '=== CHECKPOINT ==='
grep 'DEMO_MODE' .env | head -2
npx tsc --noEmit 2>&1 | tail -3
echo '--- MegaBot multi-ai ---'
wc -l lib/adapters/multi-ai.ts
grep -n 'photoPath\|photoPaths\|fileToDataUrl' lib/adapters/multi-ai.ts | head -10
echo '--- MegaBot route ---'
wc -l app/api/megabot/\[itemId\]/route.ts
grep -n 'photos\|photo\|filePath' app/api/megabot/\[itemId\]/route.ts | head -10
echo '--- AnalyzeBot route ---'
wc -l app/api/analyze/\[itemId\]/route.ts
grep -n 'model:' app/api/analyze/\[itemId\]/route.ts | head -5
grep -n 'model:' lib/adapters/ai.ts | head -5
echo '--- Photo helpers ---'
grep -n 'publicUrlToAbsPath\|fileToDataUrl\|guessMime' lib/adapters/multi-ai.ts | head -5
echo '=== CHECKPOINT COMPLETE ==='
```

---

## SECTION 3 — PERMANENTLY LOCKED FILES

Standard locked file list applies (Command Template v11 Updated, all sections).

**! SURGICAL UNLOCK FOR CMD-PHOTO-A:**

- `lib/adapters/multi-ai.ts` — UNLOCKED (change single photo → multi-photo for all providers)
- `app/api/megabot/[itemId]/route.ts` — UNLOCKED (pass all photo paths instead of first)
- `app/api/analyze/[itemId]/route.ts` — UNLOCKED (fix model name only)

All files return to LOCKED after Ryan approves CMD-PHOTO-A.
DO NOT TOUCH any other files.

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

CMD-ANT-A through D: Full AntiqueBot suite.

CMD-COL-A through F: Full CollectiblesBot suite.

CMD-MKT-A: Market Intelligence Engine — LOCKED.

**LOCKED SECTIONS WITHIN UNLOCKED FILES:**
- `multi-ai.ts` — MegaBot consensus merging logic: LOCKED
- `multi-ai.ts` — Agreement score calculation: LOCKED
- `multi-ai.ts` — Provider selection logic: LOCKED
- `multi-ai.ts` — parseLooseJson(): LOCKED
- `megabot/route.ts` — Auth/gating logic: LOCKED
- `megabot/route.ts` — EventLog storage: LOCKED
- `analyze/route.ts` — ANALYSIS_SCHEMA: LOCKED
- `analyze/route.ts` — Photo building pattern: LOCKED (already correct)
- `analyze/route.ts` — Everything except the model string: LOCKED

---

## SECTION 5 — DATA COLLECTION STANDARD

LegacyLoop collects and retains ALL data permanently. Nothing is purged.
Every feature must answer: Does this collect signal we learn from?
Does it make the next AI prediction better?
Does it create data nobody else has? Does it compound over time?
Flag all missed data collection opportunities.

Multi-photo analysis is HIGH VALUE — more angles = better grading accuracy.

---

## SECTION 6 — BUILD PATTERN

Read all 3 files → Fix multi-ai.ts provider functions → Fix megabot route →
Fix analyze model string → Build verify

No migrations. No new files. No new dependencies.

---

## SECTION 7 — PLATFORM CONTEXT

PHASE 1 (NOW): Copy hub — no OAuth. 13 platforms. Demo-ready.
DEMO_MODE=true — admin bypasses all gates and credit deductions.
Both test accounts Tier 4 Estate Manager — full access.

---

## SECTION 8 — CREATIVE LATITUDE

You MAY: Add additional size guards for photos, add logging for photo
count per provider, optimize base64 encoding, add fallback for providers
that reject too many images.

You MAY NOT: Touch locked files, change consensus merging logic, change
agreement score calculation, change provider selection, change AI prompts
or schema fields, change any UI files, change schema, add npm packages.

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

All 4 AI keys SET (OPENAI, ANTHROPIC, GEMINI, XAI).
Square SET (sandbox). SendGrid SET. DEMO_MODE=true.

---

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## OBJECTIVE — CMD-PHOTO-A: FIX PHOTO PIPELINE ACCURACY ACROSS ALL VISION BOTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Problem 1:** MegaBot sends only ONE photo to each AI provider (OpenAI,
Claude, Gemini, Grok). For collectibles grading you NEED front, back,
corners, edges, centering from multiple angles. With 1 photo, centering
assessment is 30-50% guesswork and corner analysis is one-sided.

Current state: `runMegabot(photoPath: string, ...)` takes a single path.
Route passes `item.photos[0].filePath` — first photo only.
Photos fetched with `take: 4` — 3 photos wasted.

**Problem 2:** AnalyzeBot model string may reference a non-existent model
name. Need to verify and fix to a valid OpenAI model.

**Fix 1:** MegaBot sends ALL available photos (up to 6) to each AI provider.
**Fix 2:** AnalyzeBot model corrected to valid name.

**! CRITICAL CONSTRAINTS:**
- Do NOT change MegaBot consensus merging logic
- Do NOT change agreement score calculation
- Do NOT change provider selection logic
- Do NOT change parseLooseJson()
- Do NOT change AI analysis schema (ANALYSIS_SCHEMA in ai.ts)
- Do NOT change any UI files
- Do NOT use an Agent — do all work directly
- ONLY change photo input handling and model string

**FILES TO MODIFY:**
1. `lib/adapters/multi-ai.ts` — multi-photo for all 4 providers
2. `app/api/megabot/[itemId]/route.ts` — pass all photo paths
3. `app/api/analyze/[itemId]/route.ts` — fix model name

---

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## PART A — MANDATORY FULL READ
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**! DO NOT BEGIN BUILDING UNTIL ALL READS ARE COMPLETE AND PRINTED.**

**Read lib/adapters/multi-ai.ts — FULL file (594 lines):**
FIND: The function signature that accepts photo input — is it `photoPath: string` or `string[]`? Exact line.
FIND: Where each provider (OpenAI, Claude, Gemini, Grok) builds image content. Exact lines.
FIND: The `runMegabot` or `runSpecializedMegaBot` entry function. Exact line + signature.
FIND: Where `fileToDataUrl` / `publicUrlToAbsPath` are called. Exact lines.
FIND: Are `publicUrlToAbsPath`, `guessMime`, `fileToDataUrl` defined here or imported?

**Read app/api/megabot/[itemId]/route.ts — FULL file (324 lines):**
FIND: Where photos are loaded from the item. Exact line.
FIND: `take:` value for photos. Exact line.
FIND: What is passed to the multi-ai function — single path or array? Exact line.

**Read app/api/analyze/[itemId]/route.ts — Lines 1-50 + grep for `model:`:**
FIND: The model string used. Exact line + current value.
FIND: How photos are built for the analyze route (for reference — already correct).

**Read lib/adapters/ai.ts — Lines 1-30 (reference for correct photo pattern):**
FIND: `publicUrlToAbsolutePath`, `guessMime`, `fileToDataUrl` definitions.

Print ALL findings with exact line numbers.

---

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## PART B — MEGABOT: MULTI-PHOTO UPGRADE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

File: `lib/adapters/multi-ai.ts`

**TASK B1:** Change the entry function signature from single photo to array:
BEFORE: `photoPath: string` (or similar single-path parameter)
AFTER: `photoPaths: string[]`

**TASK B2:** For OpenAI provider function — build multi-image content:
```javascript
const imageContent = [];
for (const p of photoPaths) {
  try {
    const absPath = publicUrlToAbsPath(p);
    if (fs.existsSync(absPath)) {
      const stats = fs.statSync(absPath);
      if (stats.size > 10 * 1024 * 1024) continue; // skip >10MB
      imageContent.push({
        type: "input_image",
        image_url: fileToDataUrl(absPath),
        detail: "high",
      });
    }
  } catch { /* skip unreadable */ }
}
```

**TASK B3:** For Claude provider function — same pattern but Claude format:
`{ type: "image", source: { type: "base64", media_type: mime, data: base64 } }`

**TASK B4:** For Gemini provider function — same pattern but Gemini format:
`{ inline_data: { mime_type: mime, data: base64 } }`

**TASK B5:** For Grok/xAI provider function — same as OpenAI format
(xAI uses OpenAI-compatible API).

**TASK B6:** Update user prompt to mention photo count:
`"${photoPaths.length} photo(s) attached — cross-reference all for grading."`

**TASK B7:** If photoPaths is empty or all fail to load, fall back to
text-only mode (no images in content array).

**TASK B8:** Ensure `publicUrlToAbsPath` and `fileToDataUrl` are available.
If not already defined, copy from `lib/adapters/ai.ts`.

---

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## PART C — MEGABOT ROUTE: PASS ALL PHOTOS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

File: `app/api/megabot/[itemId]/route.ts`

**TASK C1:** Change photo fetch from `take: 4` to `take: 6`:
```javascript
photos: { orderBy: { order: "asc" }, take: 6 }
```

**TASK C2:** Build photoPaths array:
```javascript
const photoPaths = item.photos.slice(0, 6).map(p => p.filePath);
```

**TASK C3:** Pass photoPaths to MegaBot function instead of single photo:
BEFORE: `runSpecializedMegaBot(botType, prompt, item.photos[0].filePath, itemId)`
AFTER: `runSpecializedMegaBot(botType, prompt, photoPaths, itemId)`
(adjust parameter name/position based on actual function signature found in Part A)

---

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## PART D — ANALYZEBOT MODEL FIX
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

File: `app/api/analyze/[itemId]/route.ts`

**TASK D1:** Find the model string. Based on Part A findings, it may be:
- `"gpt-4.1-mini"` (known invalid) → change to `"gpt-4o-mini"`
- Or it may call into `lib/adapters/ai.ts` where the model is defined

If model is in ai.ts (LOCKED), note it and report — do NOT modify ai.ts.
If model is in the analyze route itself, fix to `"gpt-4o-mini"`.

**TASK D2:** Do NOT change anything else in the analyze route. ONLY the
model string.

---

## DO NOT CHANGE:

- CollectiblesBot route (already fixed with gpt-4o + 6 photos)
- AI analysis schema (ANALYSIS_SCHEMA in ai.ts)
- MegaBot consensus merging logic
- MegaBot agreement score calculation
- Provider selection logic
- parseLooseJson()
- Any UI files
- `lib/adapters/ai.ts` (reference only — LOCKED)
- `lib/adapters/pricing.ts`
- Any enrichment files
- Schema

---

## SECTION 18 — VERIFICATION CHECKLIST

```
CHECKPOINT baseline: pass
Part A reads completed and printed: yes / no

MEGABOT MULTI-PHOTO:
— Function signature accepts string[]: yes / no
— OpenAI receives all photos as base64: yes / no
— Claude receives all photos as base64: yes / no
— Gemini receives all photos as base64: yes / no
— Grok receives all photos as base64: yes / no
— File size guard (>10MB skip): yes / no
— fs.existsSync guard: yes / no
— Zero-photo fallback to text-only: yes / no
— publicUrlToAbsPath available in multi-ai.ts: yes / no
— fileToDataUrl available in multi-ai.ts: yes / no

MEGABOT ROUTE:
— Photos fetched with take: 6: yes / no
— photoPaths array built: yes / no
— photoPaths passed to MegaBot (not single path): yes / no

ANALYZEBOT:
— Model string found: [current value]
— Model fixed to valid name: yes / no / N/A (in locked file)

LOCKED LOGIC NOT CHANGED:
— Consensus merging logic: confirmed
— Agreement score calculation: confirmed
— Provider selection logic: confirmed
— parseLooseJson(): confirmed
— ANALYSIS_SCHEMA: confirmed
— ai.ts: confirmed (not modified)
— pricing.ts: confirmed
— UI files: confirmed
All locked files untouched: yes / no
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

MEGABOT MULTI-PHOTO:
— Entry function signature: [old → new]
— OpenAI multi-photo: [yes / no — photo count]
— Claude multi-photo: [yes / no — photo count]
— Gemini multi-photo: [yes / no — photo count]
— Grok multi-photo: [yes / no — photo count]
— Size guard: [yes / no]
— Existence guard: [yes / no]
— Zero-photo fallback: [yes / no]

MEGABOT ROUTE:
— take value: [old → new]
— photoPaths passed: [yes — array of N paths]

ANALYZEBOT:
— Old model: [found value]
— New model: [new value / N/A]

NOTHING CHANGED:
— Consensus merging: confirmed
— Agreement score: confirmed
— Provider selection: confirmed
— parseLooseJson: confirmed
— ANALYSIS_SCHEMA: confirmed
— All UI files: confirmed
— All locked files: confirmed

FLAGS FROM CLAUDE CODE:
— [Any photo format edge cases]
— [Any provider-specific image limits]
— [Model string location if in locked file]

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

**Command CMD-PHOTO-A | LegacyLoop | March 27, 2026 | Ryan Hallee**
