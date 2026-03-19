LEGACYLOOP — COMMAND TEMPLATE v8
Upload System Upgrade — Part A: Shared Upload Component
Updated: March 18, 2026 | Use this for EVERY build command

Copy everything below this line into Claude Code.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 1 — CRITICAL DESIGN DIRECTIVE

READ BEFORE MAKING ANY CHANGES:

This app has an established design system: sleek, elegant, high-tech —
inspired by Tesla, SpaceX, and Grok.
Dark theme with teal (#00bcd4) accents, glass morphism cards, subtle animations,
generous whitespace, premium typography. Senior-friendly.

All styles inline style={{}} — NO Tailwind. NO external CSS.
NO className for styling. ONLY inline style={{}}.

Every new element must match this design system exactly. No exceptions.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 2 — VERIFICATION CHECKPOINT

Run BEFORE starting. If it fails — STOP. Report failure. Do NOT proceed.

  echo '=== CHECKPOINT ==='
  grep -n 'AI_PROVIDER|mock|demo|DEMO' lib/adapters/ai.ts | head -5
  grep 'OPENAI_API_KEY' .env | sed 's/=.*/=SET/'
  grep 'ANTHROPIC_API_KEY' .env | sed 's/=.*/=SET/'
  grep 'GEMINI_API_KEY' .env | sed 's/=.*/=SET/'
  grep 'XAI_API_KEY' .env | sed 's/=.*/=SET/'
  grep 'SENDGRID_API_KEY' .env | sed 's/=.*/=SET/'
  grep 'TWILIO' .env | sed 's/=.*/=SET/'
  grep 'DEMO_MODE' .env | head -2
  grep -n 'shouldBypassGates|isDemoMode' lib/constants/pricing.ts | head -3
  grep -n 'checkCredits|deductCredits' lib/credits.ts | head -3
  npx tsc --noEmit 2>&1 | tail -3
  echo '=== CHECKPOINT COMPLETE ==='

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 3 — PERMANENTLY LOCKED FILES

ALWAYS LOCKED — Never touch without explicit surgical unlock:

# ─── Core Adapters ───
lib/adapters/ai.ts — LOCKED
lib/adapters/rainforest.ts — LOCKED
lib/adapters/auth.ts — EXTEND ONLY
lib/adapters/storage.ts — LOCKED
lib/adapters/multi-ai.ts — LOCKED

# ─── AI Detection + Scoring ───
lib/antique-detect.ts — LOCKED
lib/collectible-detect.ts — LOCKED

# ─── MegaBot Engine ───
lib/megabot/run-specialized.ts — LOCKED
lib/megabot/prompts.ts — ADD-ONLY

# ─── Shipping ───
lib/shipping/package-suggestions.ts — LOCKED

# ─── Data Pipelines ───
lib/data/backfill.ts — LOCKED
lib/data/populate-intelligence.ts — LOCKED
lib/data/project-rollup.ts — LOCKED
lib/data/user-events.ts — LOCKED

# ─── Enrichment ───
lib/enrichment/item-context.ts — LOCKED
lib/addons/enrich-item-context.ts — LOCKED

# ─── Credits + Billing ───
lib/credits.ts — LOCKED
lib/tier-enforcement.ts — READ ONLY
lib/billing/pro-rate.ts — LOCKED
lib/billing/commission.ts — LOCKED

# ─── Offers ───
lib/offers/expiry.ts — LOCKED
lib/offers/notify.ts — LOCKED
lib/offers/cron.ts — LOCKED

# ─── Email System ───
lib/email/send.ts — LOCKED
lib/email/templates.ts — LOCKED

# ─── Pricing Constants (single source of truth) ───
lib/constants/pricing.ts — LOCKED
lib/pricing/constants.ts — LOCKED
lib/adapters/pricing.ts — LOCKED
lib/pricing/calculate.ts — LOCKED

# ─── API Routes — Analysis + Bots ───
app/api/analyze/[itemId]/route.ts — LOCKED (Amazon enrichment just updated)
app/api/megabot/[itemId]/route.ts — LOCKED
app/api/bots/* — ALL LOCKED

# ─── API Routes — Commerce ───
app/api/shipping/* — LOCKED
app/api/items/status/[itemId]/route.ts — LOCKED
app/api/offers/* — ALL LOCKED
app/api/cron/offers/route.ts — LOCKED
app/api/addons/* — READ ONLY
app/api/billing/* — ALL LOCKED
app/api/payments/checkout/route.ts — LOCKED
app/api/items/sold/route.ts — LOCKED

# ─── Core UI Components ───
app/components/AppNav.tsx — LOCKED
app/page.tsx — LOCKED
globals.css — LOCKED

# ─── Item Dashboard ───
app/items/[id]/ItemDashboardPanels.tsx — LOCKED
app/items/[id]/SoldPriceWidget.tsx — LOCKED
app/items/[id]/TradeToggle.tsx — LOCKED
app/items/[id]/TradeProposalsPanel.tsx — LOCKED
app/items/[id]/AnalyzeActions.tsx — LOCKED (just updated)
app/items/[id]/MegaBotPanel.tsx — LOCKED (just updated)
app/items/[id]/AmazonPriceBadge.tsx — LOCKED (just updated)

# ─── Subscription + Credits Pages ───
app/subscription/SubscriptionClient.tsx — LOCKED
app/components/billing/CancelFlowModal.tsx — LOCKED
app/components/billing/UpgradeFlowModal.tsx — LOCKED
app/credits/CreditsClient.tsx — LOCKED

# ─── Messaging ───
lib/messaging/* — ALL LOCKED
app/api/messages/* — ALL LOCKED
app/components/messaging/* — ALL LOCKED
app/messages/MessagesClient.tsx — LOCKED
app/messages/layout.tsx — LOCKED

# ─── Marketplace + Bundles ───
app/marketplace/MarketplaceClient.tsx — LOCKED
app/bundles/create/page.tsx — LOCKED
app/bundles/page.tsx — LOCKED
app/bundle/[slug]/page.tsx — LOCKED
app/components/BundleSuggestions.tsx — LOCKED

# ─── ListBot Publish Hub ───
app/bots/listbot/PublishHubClient.tsx — LOCKED

# ─── Listing Optimizer + Addons ───
app/addons/listing-optimizer/page.tsx — LOCKED
app/addons/buyer-outreach/page.tsx — LOCKED
app/addons/market-report/page.tsx — LOCKED

# ─── Dashboard ───
app/dashboard/DashboardClient.tsx — LOCKED
app/components/TradeProposalModal.tsx — LOCKED

# ─── Item Pages (DO NOT WIRE YET — that's Part B) ───
app/items/new/page.tsx — LOCKED (Part B will wire the new component here)
app/items/[id]/edit/EditItemForm.tsx — LOCKED (Part B will wire the new component here)

# ─── Infrastructure ───
vercel.json — LOCKED
prisma/schema.prisma — READ ONLY (changes need explicit approval)

SURGICAL UNLOCK — These files are explicitly unlocked for THIS command ONLY:

app/components/UploadModal.tsx — UNLOCKED (full rewrite — upgrade into shared upload component with all modern upload methods)

All unlocked files return to LOCKED after approval.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 4 — ALL APPROVED + LOCKED FEATURES

Never touch, modify, or rebuild any of these.

PASS 1-3 LOCKED FEATURES:
  All bot AI logic and prompt systems
  All bot output formats
  MegaBot 4-agent consensus system
  Antique detection + Antique Alert
  Collectible detection + scoring
  Amazon/Rainforest enrichment adapter
  Shipping calculator + package suggestions
  Offer negotiation system (3-round, magic link)
  Credit system (packs, custom, deductions, balance)
  Subscription tiers (FREE/STARTER/PLUS/PRO)
  Pro-rate billing for upgrades/downgrades
  Commission calculator
  ListBot publish hub (13 platforms)
  Marketplace and bundle system
  Trade proposals
  Sold price tracking
  Message center
  Data pipelines and enrichment

PASS 3 FINAL LOCKED (March 16-17, 2026):
  Custom credit purchase with sliding scale ($25-$10K, 5 tiers)
  Subscription page (5 bug fixes + RECOMMENDED badge)
  Email system (env var from address, per-email overrides, shared templates)
  Gemini MegaBot reliability (safety settings, model fallback, retry logic)

PASS 4 LOCKED (March 18, 2026):
  Amazon enrichment — first-pull-only, reruns use stored data
  AnalyzeActions.tsx — server-side enrichment, status indicator
  MegaBotPanel.tsx — redundant Amazon POST removed
  AmazonPriceBadge.tsx — auto-retry polling

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 5 — DATA COLLECTION STANDARD

LegacyLoop collects and retains ALL data permanently. Nothing is purged.

Every feature must answer:
  - Does this collect signal we learn from?
  - Does it make the next AI prediction better?
  - Does it create data nobody else has?
  - Does it compound in value over time?

Flag all missed data collection opportunities. We decide together.

For this command: The upload component should log to console every upload
source used (camera, library, url, paste, drag). This data tells us how
customers prefer to add photos — nobody else maps upload behavior to
resale item types.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 6 — BUILD PATTERN

Database -> Storage -> API -> AI -> Enrichment -> UI -> Dashboard update

Always follow this sequence. Never skip steps. Close the loop every time.

For this command: UI component only. No API changes. No database changes.
This is the shared upload component that will be wired into pages in Part B.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 7 — PLATFORM CONTEXT

PHASE 1 (NOW): Copy hub — no OAuth needed. 13 platforms. Demo-ready.
PHASE 2: Direct publish as OAuth is approved per platform.

Upload context: This component must work on desktop browsers (Chrome,
Safari, Firefox, Edge), mobile browsers (iOS Safari, Android Chrome),
and eventually in a mobile app wrapper. All upload methods must degrade
gracefully — camera fallback to file picker on desktop, drag/drop ignored
on mobile, URL import works everywhere.

Google Drive / Google Photos OAuth is Phase 2. For now, users can paste
a Google Photos share URL into the "Import from URL" option. The card
shows as "Coming Soon" but feels intentional, not broken.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 8 — CLAUDE CODE CREATIVE LATITUDE

You MAY:
  - Improve beyond minimum spec
  - Flag gaps noticed while working
  - Choose cleanest technical path
  - Add defensive error handling
  - Make UI impressive for investor demo
  - Wire logical connections within scope
  - Flag missed data collection opportunities
  - Add polish that serves the Elon standard
  - Make this feel like a $1B product

You MAY NOT:
  - Touch any locked files
  - Change any bot AI or prompt logic
  - Change any bot output format
  - Deviate from inline style={{}}
  - Add unapproved npm packages
  - Add routes beyond scope
  - Change schema without explicit approval
  - Change the design directive wording

Flag everything outside scope. Do not fix silently. Always report flags clearly.

Read the FULL component code before writing any command — not just grep results.
Never assume. Never guess. Read first. Build second.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 9 — DEMO MODE + ADMIN BYPASS

DEMO_MODE=true in .env — active now.
Admin account bypasses ALL tier gates and credit deductions.

shouldBypassGates(user.role) checks isDemoMode() || isAdminUser(role)

Admin: never locked out. No credits deducted. Full platform access.

TO GO LIVE:
Set DEMO_MODE=false in .env.
Switch Square sandbox keys to production keys.
All gates enforce immediately for real users.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

OBJECTIVE — Upgrade UploadModal.tsx into the Definitive Shared Upload Component

The app currently has THREE separate photo upload implementations:
  1. app/items/new/page.tsx — inline upload in the new item page
  2. app/items/[id]/edit/EditItemForm.tsx — basic file picker in edit form
  3. app/components/UploadModal.tsx — standalone component (NOT USED ANYWHERE)

UploadModal has the best foundation (HEIC conversion, compression, rotation,
reorder, source picker) but is missing key features and is not wired in.

This command upgrades UploadModal.tsx into the SINGLE SOURCE OF TRUTH for
photo uploads across the entire app. Part B (next command) will wire it
into both the new item page and edit item form.

The upgraded component must support ALL of these upload methods:
  1. Camera (mobile: native capture, desktop: file picker fallback)
  2. File picker (choose from library/files)
  3. Drag and drop (desktop)
  4. Clipboard paste (Cmd+V / Ctrl+V)
  5. Import from URL (paste any image URL — works with Google Photos share links)
  6. Google Drive (Coming Soon — show card but disabled, Phase 2)

The component must be:
  - Mobile-first responsive
  - Senior-friendly (large tap targets, clear labels)
  - Tesla/SpaceX/Grok aesthetic
  - HEIC/HEIF auto-conversion
  - Client-side compression (2MB max, 2048px max dimension)
  - Drag reorder with primary badge
  - Rotate, remove, set as primary
  - Photo count + tier limit display
  - Upload source logging to console
  - All inline style={{}} — no Tailwind, no className for styling

What this command does NOT touch:
  app/items/new/page.tsx — LOCKED (Part B)
  app/items/[id]/edit/EditItemForm.tsx — LOCKED (Part B)
  No API routes. No database changes. No schema changes.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PART A — MANDATORY FULL READ

DO NOT BEGIN BUILDING UNTIL ALL READS ARE COMPLETE AND PRINTED.

1. Read app/components/UploadModal.tsx — FULL file (781 lines)
   Find: Line 18-24 — PhotoFile type (file, preview, id, uploading, progress)
   Find: Lines 37-45 — isHeic and isImageFile helpers
   Find: Lines 47-62 — convertHeicIfNeeded (heic2any dynamic import)
   Find: Lines 64-101 — compressImage (canvas-based, max 2MB, max 2048px)
   Find: Lines 103-118 — rotateImage (canvas rotation)
   Find: Lines 120-153 — UPLOAD_SOURCES array (camera, library, google-drive, cloud)
   Find: Lines 157-220 — addFiles callback (filter, validate, convert, compress)
   Find: Lines 284-296 — handleSourceClick (camera branch is identical for mobile/desktop)
   Find: Lines 386-401 — hidden file inputs (camera with capture="environment", library without)
   Find: Lines 473-526 — source picker cards grid
   Find: Lines 546-729 — photo grid with reorder, rotate, remove, primary
   Find: Lines 755-778 — mobile sticky upload button

2. Read app/items/new/page.tsx — Lines 213-227 and 496-606 ONLY (READ ONLY, DO NOT MODIFY)
   Find: Lines 213-227 — clipboard paste handler (we need to replicate this)
   Find: Lines 496-606 — camera/gallery buttons, drop zone, thumbnail grid
   Confirm: What features this page has that UploadModal doesn't

3. Read app/items/[id]/edit/EditItemForm.tsx — Lines 96-295 ONLY (READ ONLY, DO NOT MODIFY)
   Find: Lines 96-122 — handleAddPhotos (basic FormData upload, page reload)
   Find: Lines 264-271 — bare file input with no camera capture
   Confirm: Edit form has zero upload sophistication

Print ALL findings before proceeding.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PART B — Rewrite UploadModal.tsx as the Definitive Upload Component

File: app/components/UploadModal.tsx

This is a FULL REWRITE of this file. The current file is 781 lines and not
used anywhere — zero risk of breaking existing functionality.

KEEP from the current file (do not rewrite these — copy them over):
  - PhotoFile type export (lines 18-24)
  - uid() helper (lines 33-35)
  - isHeic() helper (lines 37-40)
  - isImageFile() helper (lines 42-45)
  - convertHeicIfNeeded() async function (lines 47-62)
  - compressImage() async function (lines 64-101)
  - rotateImage() function (lines 103-118)
  - MAX_FILE_SIZE_MB = 10 constant (line 155)

ADD these new features:

1. UPLOAD SOURCES — Replace the current UPLOAD_SOURCES array (lines 120-153) with:

  Camera — icon: Camera — "Take a photo" — available: true — mobile priority
  Photo Library — icon: ImagePlus — "Choose from files" — available: true
  Import from URL — icon: Link — "Paste an image URL" — available: true — NEW
  Clipboard Paste — icon: Clipboard — "Paste from clipboard" — available: true — NEW
  Google Drive — icon: Cloud — "Connect Google Drive" — available: false — "Coming Soon"
  iCloud / Dropbox — icon: Cloud — "Connect cloud storage" — available: false — "Coming Soon"

  Use lucide-react icons: Camera, ImagePlus, Link, ClipboardPaste, Cloud, Lock

2. CAMERA FIX — The camera hidden input MUST have:
  - accept="image/*,.heic,.heif"
  - capture="environment"
  - NO multiple attribute (multiple conflicts with capture on many mobile browsers)
  - This means camera captures ONE photo at a time — that's correct behavior

3. FILE PICKER — The file hidden input MUST have:
  - accept="image/*,.heic,.heif"
  - multiple (allows selecting many files)
  - NO capture attribute

4. CLIPBOARD PASTE — Add a useEffect that listens for paste events:
  - window.addEventListener("paste", handler)
  - Filter for image/* items from clipboardData
  - Convert to File objects
  - Run through addFiles pipeline (convert + compress)
  - Log: console.log("[Upload] Source: clipboard-paste, files:", count)
  - Clean up listener on unmount

5. URL IMPORT — Add a modal/input flow:
  - When user clicks "Import from URL", show an inline text input
  - User pastes a URL (any image URL, Google Photos share link, etc.)
  - Fetch the image via a client-side approach:
    Create an <img> element with crossOrigin="anonymous", load the URL,
    draw to canvas, convert to blob, create File object
  - If CORS blocks it, fall back to showing the URL as a preview with a
    note: "This image will be downloaded when you save"
  - Run through addFiles pipeline
  - Log: console.log("[Upload] Source: url-import, url:", url)
  - Include a "Cancel" button to dismiss the URL input

6. DRAG AND DROP — Keep the existing drop zone but make it smarter:
  - Accept drops on the entire component area
  - Show visual feedback (border glow, background change)
  - Filter for image files only
  - Log: console.log("[Upload] Source: drag-drop, files:", count)

7. SOURCE LOGGING — Every upload path must log to console:
  console.log("[Upload] Source: camera, files: 1")
  console.log("[Upload] Source: file-picker, files: 3")
  console.log("[Upload] Source: drag-drop, files: 2")
  console.log("[Upload] Source: clipboard-paste, files: 1")
  console.log("[Upload] Source: url-import, url: https://...")

8. PHOTO GRID — Keep existing features, improve:
  - Drag reorder (keep existing HTML5 drag)
  - Primary badge on first photo (teal border + "PRIMARY" label)
  - Photo number badge (top right)
  - Action buttons: Star (set primary), Rotate, Trash (remove)
  - Upload progress bar (when uploading flag is set)
  - Responsive grid: repeat(auto-fill, minmax(110px, 1fr))

9. SOURCE PICKER UI — Redesign the source card grid:
  - 3 columns on desktop, 2 columns on mobile
  - Available sources: teal icon, white label, subtle desc
  - Disabled sources: Lock icon, muted text, "Coming Soon" badge
  - Tap targets minimum 48px height (senior-friendly)
  - Glass morphism card style with subtle border

10. MOBILE OPTIMIZATION:
  - Camera button is FIRST and PROMINENT on mobile
  - Source picker auto-shows when no photos exist
  - Large tap targets (min 48px)
  - Smooth scrolling in photo grid
  - No hover-dependent interactions

11. PHOTO TIPS SECTION — Keep and enhance:
  - Show after photos are added
  - "Best results: Front view (primary) · Close-up of labels · Any damage · Different angles"
  - Confidence boost message: "+X% confidence boost from N photos!"
  - Teal accent background with border

DESIGN REQUIREMENTS:
  - ALL styles must use inline style={{}} — NO Tailwind, NO className for styling
  - Dark theme: backgrounds use rgba(255,255,255,0.02-0.06), borders use rgba(0,188,212,0.15-0.35)
  - Teal (#00bcd4) for accents, interactive elements, and primary actions
  - Text: white for primary, rgba(255,255,255,0.6) for secondary, rgba(255,255,255,0.35) for muted
  - Border radius: 0.75rem-1rem for cards, 9999px for badges
  - Transitions: 0.15s-0.2s ease for all interactive states
  - Glass morphism: subtle backdrop blur where appropriate
  - Typography: 0.75-1rem range, fontWeight 600-700 for labels

PROPS — Keep the same interface for backward compatibility:
  photos: PhotoFile[]
  setPhotos: React.Dispatch<React.SetStateAction<PhotoFile[]>>
  maxPhotos?: number (default 10)
  tierLimit?: number (optional display limit)

EXPORTS — The file must export:
  - default: UploadModal component
  - PhotoFile type
  - convertHeicIfNeeded function (needed by other components)
  - compressImage function (needed by other components)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 10 — VERIFICATION CHECKLIST

1. CHECKPOINT baseline: pass
2. Part A full reads completed and printed: yes / no
3. PhotoFile type exported: yes / no
4. convertHeicIfNeeded exported: yes / no
5. compressImage exported: yes / no
6. Camera input has capture="environment" WITHOUT multiple: yes / no
7. File picker input has multiple WITHOUT capture: yes / no
8. Clipboard paste listener added with cleanup: yes / no
9. URL import flow added (input + fetch + canvas conversion): yes / no
10. Drag and drop working with visual feedback: yes / no
11. All 5 upload sources log to console with source name: yes / no
12. Source picker shows 6 cards (4 active, 2 coming soon): yes / no
13. Coming Soon cards show Lock icon and are disabled: yes / no
14. Photo grid with reorder, rotate, remove, set primary: yes / no
15. Primary badge on first photo: yes / no
16. Photo count display with tier limit: yes / no
17. Photo tips section with confidence boost message: yes / no
18. Camera preview modal (capture → review → accept/retake): yes / no
19. Mobile-optimized: large tap targets, camera-first: yes / no
20. Senior-friendly: clear labels, simple flow: yes / no
21. ALL styles use inline style={{}} — zero Tailwind/className: yes / no
22. Dark theme with teal accents throughout: yes / no
23. No locked files touched: yes / no
24. No API routes created or modified: yes / no
25. No npm packages added: yes / no
26. Component renders without errors when mounted with empty photos: yes / no
N+1. All locked files untouched: yes / no
N+2. inline style={{}} throughout: yes / no
N+3. npx tsc --noEmit: 0 errors
N+4. npm run build: pass
N+5. CHECKPOINT post-change: pass

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 11 — REQUIRED REPORT FORMAT

CHECKPOINT before: [pass / issue]
Part A printed: [yes / no]

Fix B — UploadModal.tsx full rewrite: [fixed / issue]
  UPLOAD METHODS:
  - Camera (mobile capture, desktop fallback): [working / issue]
  - File picker (multiple files): [working / issue]
  - Drag and drop: [working / issue]
  - Clipboard paste: [working / issue]
  - URL import: [working / issue]
  - Google Drive (Coming Soon card): [visible / issue]
  - iCloud/Dropbox (Coming Soon card): [visible / issue]
  PHOTO MANAGEMENT:
  - HEIC conversion: [working / issue]
  - Image compression: [working / issue]
  - Photo reorder (drag): [working / issue]
  - Rotate photo: [working / issue]
  - Set as primary: [working / issue]
  - Remove photo: [working / issue]
  - Primary badge: [visible / issue]
  UI/UX:
  - Source picker cards: [working / issue]
  - Photo grid: [working / issue]
  - Photo tips: [visible / issue]
  - Camera preview modal: [working / issue]
  - Mobile tap targets ≥48px: [yes / no]
  - Console logging per source: [yes / no]
  DESIGN:
  - All inline style={{}}: [yes / no]
  - Dark theme + teal accents: [yes / no]
  - Senior-friendly: [yes / no]
  EXPORTS:
  - PhotoFile type: [exported / issue]
  - convertHeicIfNeeded: [exported / issue]
  - compressImage: [exported / issue]

EXISTING LOGIC UNTOUCHED:
  [List every locked file verified]

NOTE: This component is NOT yet wired into any pages.
Part B (next command) will wire it into new item page and edit item form.

FLAGS FROM CLAUDE CODE:
  [All gaps, risks, missed opportunities]

Files modified: [list all — be specific]
New files: [list all]
Schema changes needed: none

Build: [pass / fail]
TypeScript: [0 errors / list]
CHECKPOINT after: [pass / issue]

IF POST-CHECKPOINT FAILS:
REVERT IMMEDIATELY.
Report exactly what broke and what was touched.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Command Template v8 | LegacyLoop | Upload System Upgrade Part A
Approved: March 18, 2026 | Ryan Hallee, Founder
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
