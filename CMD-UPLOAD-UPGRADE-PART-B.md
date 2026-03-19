LEGACYLOOP — COMMAND TEMPLATE v8
Upload System Upgrade — Part B: Wire Into New Item + Edit Item Pages
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
app/api/analyze/[itemId]/route.ts — LOCKED
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
app/components/UploadModal.tsx — LOCKED (just rewritten — Part A complete)
app/page.tsx — LOCKED
globals.css — LOCKED

# ─── Item Dashboard ───
app/items/[id]/ItemDashboardPanels.tsx — LOCKED
app/items/[id]/SoldPriceWidget.tsx — LOCKED
app/items/[id]/TradeToggle.tsx — LOCKED
app/items/[id]/TradeProposalsPanel.tsx — LOCKED
app/items/[id]/AnalyzeActions.tsx — LOCKED
app/items/[id]/MegaBotPanel.tsx — LOCKED
app/items/[id]/AmazonPriceBadge.tsx — LOCKED

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

# ─── Infrastructure ───
vercel.json — LOCKED
prisma/schema.prisma — READ ONLY (changes need explicit approval)

SURGICAL UNLOCK — These files are explicitly unlocked for THIS command ONLY:

app/items/new/page.tsx — UNLOCKED (replace inline photo upload code with shared UploadModal component)
app/items/[id]/edit/EditItemForm.tsx — UNLOCKED (replace bare file picker with UploadModal for new photo additions, keep existing server-side photo management)

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
  UploadModal.tsx — full rewrite with all 6 upload methods (Part A)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 5 — DATA COLLECTION STANDARD

LegacyLoop collects and retains ALL data permanently. Nothing is purged.

Every feature must answer:
  - Does this collect signal we learn from?
  - Does it make the next AI prediction better?
  - Does it create data nobody else has?
  - Does it compound in value over time?

Flag all missed data collection opportunities. We decide together.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 6 — BUILD PATTERN

Database -> Storage -> API -> AI -> Enrichment -> UI -> Dashboard update

Always follow this sequence. Never skip steps. Close the loop every time.

For this command: UI wiring only. Replace inline upload code with the shared
UploadModal component. No API changes. No database changes.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 7 — PLATFORM CONTEXT

PHASE 1 (NOW): Copy hub — no OAuth needed. 13 platforms. Demo-ready.
PHASE 2: Direct publish as OAuth is approved per platform.

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

OBJECTIVE — Wire Shared UploadModal Into Both New Item and Edit Item Pages

Part A (previous command) built the shared UploadModal component with all
6 upload methods (camera, file picker, drag/drop, clipboard paste, URL import,
Coming Soon cards). It is LOCKED and ready.

This command wires it into the two pages that need it:

1. app/items/new/page.tsx — Replace the inline photo upload section (lines 470-828)
   with the shared UploadModal. The form submission must extract File objects from
   PhotoFile[] to build FormData for /api/items/create.

2. app/items/[id]/edit/EditItemForm.tsx — Add UploadModal for NEW photo additions
   alongside the existing server-side photo management (delete, set cover, lightbox).
   The edit form has TWO kinds of photos:
     a) Already uploaded photos (PhotoData: id, filePath, isPrimary, order) — server-side
     b) New photos being added (PhotoFile: file, preview, id) — client-side via UploadModal
   Both must appear in a unified view.

CRITICAL TYPE BRIDGING:
  - UploadModal uses PhotoFile = { file: File, preview: string, id: string }
  - New item page currently uses File[] — must bridge to PhotoFile[]
  - Edit form uses PhotoData = { id, filePath, isPrimary, order } for existing photos
  - New photos added in edit form use PhotoFile[] from UploadModal
  - Form submission extracts .file from PhotoFile[] for FormData

What this command touches:
  app/items/new/page.tsx — replace inline upload with UploadModal import
  app/items/[id]/edit/EditItemForm.tsx — add UploadModal for new photos, upgrade photo section

What this command does NOT touch:
  app/components/UploadModal.tsx — LOCKED (Part A)
  app/api/items/create route — UNCHANGED
  app/api/items/photos/[itemId] route — UNCHANGED
  app/api/items/update/[itemId] route — UNCHANGED
  No API changes. No database changes. No schema changes.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PART A — MANDATORY FULL READ

DO NOT BEGIN BUILDING UNTIL ALL READS ARE COMPLETE AND PRINTED.

1. Read app/components/UploadModal.tsx — FULL file (the Part A rewrite)
   Find: Line 20 — PhotoFile type export
   Find: Line 135 — UploadModal component props: photos, setPhotos, maxPhotos, tierLimit
   Confirm: Component accepts PhotoFile[] via photos/setPhotos props
   Confirm: convertHeicIfNeeded and compressImage are exported

2. Read app/items/new/page.tsx — FULL file (1,266 lines)
   Find: Line 106 — const [photos, setPhotos] = useState<File[]>([])
   Find: Lines 109-110 — cameraRef, galleryRef refs (will be removed)
   Find: Lines 112 — const [previews, setPreviews] = useState<string[]>([])
   Find: Lines 113-117 — uploadStatus, uploadProgress, sizeWarning, createdItemId, hoveredThumb states
   Find: Lines 119-127 — preview URL sync useEffect (will be removed)
   Find: Lines 129-141 — handleFilesAdded handler (will be removed)
   Find: Lines 144-152 — handleDrop handler (will be removed)
   Find: Lines 213-227 — clipboard paste useEffect (will be removed — UploadModal handles this)
   Find: Lines 281-303 — onSubmit: builds FormData with "for (const p of photos) formData.append()"
   Find: Lines 470-828 — ENTIRE PHOTOS UI SECTION (will be replaced with UploadModal)
   Confirm: The rest of the form (lines 829+) must remain untouched

3. Read app/items/[id]/edit/EditItemForm.tsx — FULL file (500 lines)
   Find: Line 8 — PhotoData type = { id, filePath, isPrimary, order }
   Find: Line 36 — const [photos, setPhotos] = useState<PhotoData[]>(initialPhotos)
   Find: Lines 60-81 — deletePhoto (server-side DELETE to /api/items/photos)
   Find: Lines 83-94 — setCoverPhoto (server-side PATCH)
   Find: Lines 96-122 — handleAddPhotos (basic FormData POST, then page reload)
   Find: Lines 198-296 — photo management UI section
   Find: Lines 264-295 — bare file input + "Add Photos" button
   Find: Lines 447-497 — lightbox viewer
   Confirm: Delete, set cover, and lightbox must be preserved
   Confirm: handleAddPhotos does a server-side upload then window.location.reload()

4. Read app/items/[id]/edit/page.tsx — FULL file (68 lines)
   Find: Lines 58-63 — initialPhotos prop mapping from prisma photos
   Confirm: Server component passes photo data to EditItemForm

Print ALL findings with exact line numbers before proceeding.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PART B — Wire UploadModal Into New Item Page

File: app/items/new/page.tsx

OVERVIEW: The new item page currently has inline photo upload code using
raw File[] state. We need to:
1. Import UploadModal and PhotoFile type
2. Change photo state from File[] to PhotoFile[]
3. Remove inline upload UI code (lines 470-828)
4. Insert <UploadModal> in its place
5. Update the form submission to extract .file from PhotoFile[]
6. Remove dead code (refs, handlers, previews state, clipboard listener)

STEP 1 — Add import at top of file (after line 3):

import UploadModal, { type PhotoFile } from "@/app/components/UploadModal";

STEP 2 — Change photo state (line 106):

BEFORE:
  const [photos, setPhotos] = useState<File[]>([]);

AFTER:
  const [photos, setPhotos] = useState<PhotoFile[]>([]);

STEP 3 — Remove dead state and refs.

Remove these lines (or mark them as unused — they are replaced by UploadModal):
  Line 109 — const cameraRef = useRef<HTMLInputElement>(null);
  Line 110 — const galleryRef = useRef<HTMLInputElement>(null);
  Line 111 — const [dragOver, setDragOver] = useState(false);
  Line 112 — const [previews, setPreviews] = useState<string[]>([]);
  Line 115 — const [sizeWarning, setSizeWarning] = useState("");
  Line 117 — const [hoveredThumb, setHoveredThumb] = useState<number | null>(null);

Remove the preview sync useEffect (lines 119-127) — UploadModal manages its own previews.

Remove handleFilesAdded (lines 129-141) — UploadModal handles this.

Remove handleDrop (lines 144-152) — UploadModal handles this.

Remove clipboard paste useEffect (lines 213-227) — UploadModal has its own paste listener.

KEEP: uploadStatus, uploadProgress, createdItemId states (lines 113-114, 116)
  These are used during form submission for progress tracking.

STEP 4 — Update form submission.

In the onSubmit function (around line 302-303):

BEFORE:
  for (const p of photos) formData.append("photos[]", p);

AFTER:
  for (const p of photos) formData.append("photos[]", p.file);

Also update the progress tracking initialization (lines 318-327):

BEFORE:
  for (const p of photos) {
    const key = `${p.name}-${p.size}`;

AFTER:
  for (const p of photos) {
    const key = `${p.file.name}-${p.file.size}`;

Update the validation check at the top of onSubmit (line 283):

  if (photos.length === 0) — this stays the same, works with PhotoFile[]

STEP 5 — Replace the ENTIRE photos UI section.

Remove everything from line 470 (the {/* ── PHOTOS ── */} comment) through
line 828 (the closing tag before {/* ── DETAILS FORM ── */}).

Replace with:

      {/* ── PHOTOS ── */}
      <div>
        <div style={{
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: "20px",
          padding: "24px",
          marginBottom: "16px",
        }}>
          <div style={{
            fontSize: "13px",
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            color: "rgba(255,255,255,0.35)",
            fontWeight: 700,
            marginBottom: "16px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}>
            <span style={{ fontSize: "15px" }}>📷</span> Item Photos
          </div>

          <UploadModal
            photos={photos}
            setPhotos={setPhotos}
            maxPhotos={10}
          />
        </div>
      </div>

This gives us the same card wrapper style as the rest of the form, with the
full UploadModal inside it.

STEP 6 — Update the photo status display in the form section.

The upload progress display at the bottom of the form (around lines 815-825)
references photos by name/size. These now come from PhotoFile:

BEFORE (line 820):
  if (doneCount === photos.length && doneCount > 0) return <span>All {photos.length} photos uploaded ✓</span>;

This still works — photos.length is the same.

Any place that references `p.name` or `p.size` for progress keys must change to
`p.file.name` and `p.file.size`.

STEP 7 — Verify retryUpload function (lines 257-279).

BEFORE:
  const retryUpload = async (photo: File, itemId: string | null) => {

This function takes a File directly. Since we now have PhotoFile[],
update calls to retryUpload to pass photo.file instead of photo.

WHAT NOT TO TOUCH:
  Form fields (lines 829+) — ALL UNCHANGED
  Sale assignment logic — UNCHANGED
  Session storage backup/restore — UNCHANGED
  Form submission endpoint (/api/items/create) — UNCHANGED
  Starting price, sale assignment, shipping data — ALL UNCHANGED
  The entire details form — ALL UNCHANGED

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PART C — Wire UploadModal Into Edit Item Form

File: app/items/[id]/edit/EditItemForm.tsx

OVERVIEW: The edit form has TWO photo contexts:
  1. Existing photos (PhotoData[]) — already uploaded, managed server-side
  2. New photos (PhotoFile[]) — being added via UploadModal, uploaded on save

We keep the existing photo grid for already-uploaded photos (delete, set cover,
lightbox) and ADD the UploadModal below it for adding new photos.

STEP 1 — Add imports at top of file (after line 4):

import UploadModal, { type PhotoFile } from "@/app/components/UploadModal";

STEP 2 — Add new photo state (after line 39):

  const [newPhotos, setNewPhotos] = useState<PhotoFile[]>([]);

STEP 3 — Replace the bare file input section (lines 261-295).

Remove the hidden file input and "Add Photos" button (lines 264-294).

Replace with the UploadModal component:

        {photos.length < MAX_PHOTOS && (
          <div style={{ marginTop: "1rem" }}>
            <div style={{
              fontSize: "0.75rem",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              color: "rgba(0,188,212,0.7)",
              marginBottom: "0.5rem",
            }}>
              Add New Photos
            </div>
            <UploadModal
              photos={newPhotos}
              setPhotos={setNewPhotos}
              maxPhotos={MAX_PHOTOS - photos.length}
            />
          </div>
        )}

This shows the full UploadModal below the existing photo grid, with the
maxPhotos limit dynamically reduced by how many photos are already uploaded.

STEP 4 — Update handleAddPhotos to use newPhotos from UploadModal.

Replace the entire handleAddPhotos function (lines 96-122) with:

  const handleUploadNewPhotos = async () => {
    if (newPhotos.length === 0) return;
    setUploading(true);
    setError("");

    try {
      const formData = new FormData();
      for (const p of newPhotos) {
        formData.append("photos[]", p.file);
      }

      const res = await fetch(`/api/items/photos/${initial.id}`, {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        // Clear new photos and reload to show server-side versions
        setNewPhotos([]);
        window.location.reload();
      } else {
        setError("Failed to upload photos. Please try again.");
      }
    } catch {
      setError("Failed to upload photos. Please try again.");
    }
    setUploading(false);
  };

STEP 5 — Remove the bare addPhotoInputRef (line 39):

  Remove: const addPhotoInputRef = useRef<HTMLInputElement>(null);

STEP 6 — Wire the upload into the save flow.

In the onSubmit function (line 126), after a successful save (before the redirect),
upload any new photos if they exist:

After line 180 (if (!res.ok) block ends) and BEFORE the rerun check (line 182):

CRITICAL: New photos MUST be fully uploaded and saved to the database
BEFORE re-analysis runs. If photo upload fails, stop and show an error.
Do NOT run re-analysis with stale/missing photos.

    // Upload any new photos added via UploadModal — MUST complete before re-analysis
    if (newPhotos.length > 0) {
      const photoFormData = new FormData();
      for (const p of newPhotos) {
        photoFormData.append("photos[]", p.file);
      }
      try {
        const photoRes = await fetch(`/api/items/photos/${initial.id}`, {
          method: "POST",
          body: photoFormData,
        });
        if (!photoRes.ok) {
          setBusy("idle");
          setError("New photos failed to upload. Please try again before re-running analysis.");
          return;
        }
        // Clear new photos state after successful upload
        setNewPhotos([]);
        console.log(`[Edit] ${newPhotos.length} new photos uploaded successfully`);
      } catch {
        setBusy("idle");
        setError("Photo upload failed. Please check your connection and try again.");
        return;
      }
    }

STEP 7 — Add a visual indicator showing new photos will be uploaded on save.

Below the UploadModal, if newPhotos has items, show a hint:

        {newPhotos.length > 0 && (
          <div style={{
            marginTop: "0.5rem",
            fontSize: "0.78rem",
            color: "rgba(0,188,212,0.7)",
            fontStyle: "italic",
          }}>
            {newPhotos.length} new photo{newPhotos.length > 1 ? "s" : ""} will be uploaded when you save
          </div>
        )}

WHAT NOT TO TOUCH:
  Existing photo grid (lines 200-246) — KEEP (delete, cover badge, lightbox click)
  deletePhoto function (lines 60-81) — KEEP
  setCoverPhoto function (lines 83-94) — KEEP
  Lightbox viewer (lines 447-497) — KEEP
  Form fields (lines 298-411) — ALL UNCHANGED
  Form submission endpoint (/api/items/update) — UNCHANGED
  Save + Re-run buttons — UNCHANGED

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 10 — VERIFICATION CHECKLIST

1. CHECKPOINT baseline: pass
2. Part A full reads completed and printed: yes / no
NEW ITEM PAGE:
3. UploadModal imported: yes / no
4. PhotoFile type imported: yes / no
5. Photo state changed from File[] to PhotoFile[]: yes / no
6. Dead refs removed (cameraRef, galleryRef): yes / no
7. Dead state removed (previews, dragOver, sizeWarning, hoveredThumb): yes / no
8. Dead handlers removed (handleFilesAdded, handleDrop): yes / no
9. Clipboard paste useEffect removed (UploadModal handles it): yes / no
10. Inline upload UI (lines 470-828) replaced with <UploadModal>: yes / no
11. Form submission uses p.file for FormData: yes / no
12. Progress tracking uses p.file.name and p.file.size: yes / no
13. retryUpload calls updated to pass p.file: yes / no
14. Form fields (lines 829+) UNCHANGED: yes / no
15. Card wrapper style matches rest of form: yes / no
EDIT ITEM PAGE:
16. UploadModal imported: yes / no
17. PhotoFile type imported: yes / no
18. newPhotos state added: yes / no
19. UploadModal rendered below existing photo grid: yes / no
20. maxPhotos dynamically reduced by existing photo count: yes / no
21. New photos uploaded on save (in onSubmit) with HARD await: yes / no
22. Photo upload failure STOPS the flow and shows error (no silent catch): yes / no
23. Re-analysis ONLY runs AFTER photos are confirmed saved to DB: yes / no
24. newPhotos state cleared after successful upload: yes / no
25. "N new photos will be uploaded when you save" hint visible: yes / no
26. Existing photo grid PRESERVED (delete, cover, lightbox): yes / no
27. deletePhoto function UNCHANGED: yes / no
28. setCoverPhoto function UNCHANGED: yes / no
29. Lightbox viewer UNCHANGED: yes / no
30. Form fields UNCHANGED: yes / no
31. Bare addPhotoInputRef removed: yes / no
GENERAL:
32. app/components/UploadModal.tsx NOT modified: yes / no
33. All locked files untouched: yes / no
34. No API routes modified: yes / no
N+1. All locked files untouched: yes / no
N+2. inline style={{}} throughout: yes / no
N+3. npx tsc --noEmit: 0 errors
N+4. npm run build: pass
N+5. CHECKPOINT post-change: pass

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 11 — REQUIRED REPORT FORMAT

CHECKPOINT before: [pass / issue]
Part A printed: [yes / no]

Fix B — New item page wired to UploadModal: [fixed / issue]
  - UploadModal rendering: [yes / no]
  - Camera works (mobile capture): [yes / no]
  - File picker works: [yes / no]
  - Drag/drop works: [yes / no]
  - Clipboard paste works: [yes / no]
  - URL import works: [yes / no]
  - Form submission extracts .file correctly: [yes / no]
  - Progress tracking works: [yes / no]
  - Dead code removed: [yes / no]

Fix C — Edit item page wired to UploadModal: [fixed / issue]
  - UploadModal rendering below existing photos: [yes / no]
  - Existing photo grid preserved: [yes / no]
  - Delete photo still works: [yes / no]
  - Set cover still works: [yes / no]
  - Lightbox still works: [yes / no]
  - New photos upload on save with HARD await: [yes / no]
  - Photo upload failure STOPS flow + shows error: [yes / no]
  - Re-analysis ONLY fires AFTER photo upload confirmed: [yes / no]
  - newPhotos state cleared after successful upload: [yes / no]
  - "N new photos" hint visible: [yes / no]
  - maxPhotos dynamically calculated: [yes / no]

CRITICAL FLOW VERIFICATION (Edit → Save + Re-run):
  Step 1: Form fields save to /api/items/update — await complete: [yes / no]
  Step 2: New photos upload to /api/items/photos — await complete: [yes / no]
  Step 3: If photo upload fails — flow STOPS, error shown, NO re-analysis: [yes / no]
  Step 4: Re-analysis to /api/analyze?force=1 — only after Steps 1+2 pass: [yes / no]
  Step 5: Analyze route re-queries item.photos from DB (line 69-71): [yes / no]
  Result: AI sees ALL photos (old + new) for accurate analysis: [confirmed / issue]

EXISTING LOGIC UNTOUCHED:
  [List every locked file verified]

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
Command Template v8 | LegacyLoop | Upload System Upgrade Part B
Approved: March 18, 2026 | Ryan Hallee, Founder
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
