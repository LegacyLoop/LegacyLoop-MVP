LEGACYLOOP — COMMAND TEMPLATE v8
Email System Update + Upgrade + Code Fix
Updated: March 17, 2026 | Copy everything below this line into Claude Code.
Fill in the OBJECTIVE and PARTS sections for your specific task.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 1 — CRITICAL DESIGN DIRECTIVE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

READ BEFORE MAKING ANY CHANGES:

This app has an established design system: sleek, elegant, high-tech — inspired by Tesla, SpaceX, and Grok. Dark theme with teal (#00bcd4) accents, glass morphism cards, subtle animations, generous whitespace, premium typography. Senior-friendly.

All styles inline style={{}} — NO Tailwind. NO external CSS. NO className for styling. ONLY inline style={{}}.

Every new element must match this design system exactly. No exceptions.

EMAIL TEMPLATE DESIGN DIRECTIVE:
All email templates must use ONE consistent dark premium theme:
Background: #0d1117
Card: #161b22
Accent: #00bcd4 (teal)
Primary text: #f0f6fc
Secondary text: #8b949e
Muted text: #484f58
Border: rgba(0,188,212,0.15)

This matches the app's visual identity exactly. There are currently 5 DIFFERENT email styles in the codebase. Kill all of them. Unify to one dark premium template. No light themes. No serif fonts. No cream backgrounds. One system.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 2 — VERIFICATION CHECKPOINT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Run BEFORE starting. If it fails — STOP. Report failure. Do NOT proceed.

echo '=== CHECKPOINT ==='
grep -n 'AI_PROVIDER|mock|demo|DEMO' lib/adapters/ai.ts | head -5
grep 'OPENAI_API_KEY' .env | sed 's/=.*/=SET/'
grep 'ANTHROPIC_API_KEY' .env | sed 's/=.*/=SET/'
grep 'GEMINI_API_KEY' .env | sed 's/=.*/=SET/'
grep 'XAI_API_KEY' .env | sed 's/=.*/=SET/'
grep 'SENDGRID_API_KEY' .env | sed 's/=.*/=SET/'
grep 'SENDGRID_FROM_EMAIL' .env | sed 's/=.*/=SET/'
grep 'TWILIO_ACCOUNT_SID' .env | sed 's/=.*/=SET/'
grep 'TWILIO_MESSAGING_SERVICE_SID' .env | sed 's/=.*/=SET/'
grep 'DEMO_MODE' .env | head -2
grep -n 'shouldBypassGates|isDemoMode' lib/constants/pricing.ts | head -3
grep -n 'checkCredits|deductCredits' lib/credits.ts | head -3
npx tsc --noEmit 2>&1 | tail -3
echo '=== CHECKPOINT COMPLETE ==='

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 3 — PERMANENTLY LOCKED FILES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ALWAYS LOCKED — Never touch without explicit surgical unlock:

lib/adapters/ai.ts — LOCKED
lib/adapters/rainforest.ts — LOCKED
lib/adapters/auth.ts — EXTEND ONLY
lib/adapters/storage.ts — LOCKED
lib/adapters/multi-ai.ts — LOCKED
lib/antique-detect.ts — LOCKED
lib/collectible-detect.ts — LOCKED
lib/megabot/run-specialized.ts — LOCKED
lib/megabot/prompts.ts — ADD-ONLY
lib/shipping/package-suggestions.ts — LOCKED
lib/data/backfill.ts — LOCKED
lib/data/populate-intelligence.ts — LOCKED
lib/data/project-rollup.ts — LOCKED
lib/data/user-events.ts — LOCKED
lib/enrichment/item-context.ts — LOCKED
lib/addons/enrich-item-context.ts — LOCKED
lib/credits.ts — LOCKED
lib/tier-enforcement.ts — READ ONLY
lib/billing/pro-rate.ts — LOCKED
lib/billing/commission.ts — LOCKED
lib/offers/expiry.ts — LOCKED
lib/offers/cron.ts — LOCKED
app/api/analyze/[itemId]/route.ts — LOCKED
app/api/megabot/[itemId]/route.ts — LOCKED
app/api/bots/* — ALL LOCKED
app/api/items/status/[itemId]/route.ts — LOCKED
app/api/offers/* — ALL LOCKED
app/api/cron/offers/route.ts — LOCKED
app/api/addons/* — READ ONLY
app/api/billing/* — ALL LOCKED
app/components/AppNav.tsx — LOCKED
app/page.tsx — LOCKED
globals.css — LOCKED
prisma/schema.prisma — READ ONLY
app/items/[id]/ItemDashboardPanels.tsx — LOCKED
app/bots/listbot/PublishHubClient.tsx — LOCKED
app/api/items/sold/route.ts — LOCKED
lib/data/sold-price-log.ts — LOCKED
app/items/[id]/SoldPriceWidget.tsx — LOCKED
app/items/[id]/TradeToggle.tsx — LOCKED
app/items/[id]/TradeProposalsPanel.tsx — LOCKED
app/components/TradeProposalModal.tsx — LOCKED
lib/messaging/* — ALL LOCKED
app/api/messages/* — ALL LOCKED
app/components/messaging/* — ALL LOCKED
app/messages/MessagesClient.tsx — LOCKED
app/messages/layout.tsx — LOCKED
app/addons/listing-optimizer/page.tsx — LOCKED
app/addons/buyer-outreach/page.tsx — LOCKED
app/addons/market-report/page.tsx — LOCKED
app/marketplace/MarketplaceClient.tsx — LOCKED
app/bundles/create/page.tsx — LOCKED
app/bundles/page.tsx — LOCKED
app/bundle/[slug]/page.tsx — LOCKED
app/components/BundleSuggestions.tsx — LOCKED
app/dashboard/DashboardClient.tsx — LOCKED
vercel.json — LOCKED
app/components/billing/CancelFlowModal.tsx — LOCKED
app/subscription/SubscriptionClient.tsx — LOCKED

SURGICAL UNLOCK — These files are explicitly unlocked for THIS command ONLY:

.env — UNLOCKED (fix malformed lines, add N8N vars — credentials already updated by Ryan)
.env.example — UNLOCKED (scrub all real keys, add new variable names, fix malformed lines)
lib/email/send.ts — UNLOCKED (fix hardcoded wrong from address, add env var support, add per-email from override)
lib/email/templates.ts — UNLOCKED (replace entire file: unify to dark premium, fix all domains, fix all contact info, add 4 new template functions, export shared utilities)
lib/offers/notify.ts — UNLOCKED (delete local emailWrapper + ctaButton + APP_URL, import from templates.ts — ZERO logic changes to any of the 6 notification functions)
app/api/auth/forgot-password/route.ts — UNLOCKED (replace inline HTML template with shared emailWrapper call — ZERO auth logic changes)
app/api/auth/change-password/route.ts — UNLOCKED (replace inline HTML template with shared emailWrapper call — ZERO auth logic changes)
app/api/auth/magic-link/send/route.ts — UNLOCKED (replace inline HTML template with shared emailWrapper call — ZERO auth logic changes)
app/api/auth/signup/route.ts — UNLOCKED (add welcome email send + n8n webhook POST after authAdapter.signup — ZERO auth logic changes)
app/api/payments/checkout/route.ts — UNLOCKED (add confirmation email sends after each purchase type — ZERO payment logic changes)
app/api/shipping/ltl-quote-request/route.ts — UNLOCKED (replace TODO on line 103 with actual sendEmail call — ZERO shipping logic changes)
app/api/webhooks/n8n/route.ts — NEW FILE (n8n callback webhook with secret validation)

All unlocked files return to LOCKED after approval.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 4 — ALL APPROVED + LOCKED FEATURES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Never touch, modify, or rebuild any of these.
[See Complete Passoff v5 for full lock list — all features from March 14-15 2026]
Last locked: Credit & Subscription Final Polish — March 16, 2026

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 5 — DATA COLLECTION STANDARD
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

LegacyLoop collects and retains ALL data permanently. Nothing is purged.

Every feature must answer:
* Does this collect signal we learn from?
* Does it make the next AI prediction better?
* Does it create data nobody else has?
* Does it compound in value over time?

Flag all missed data collection opportunities. We decide together.

For this command: Add structured console logging to every email send. Format:
[EMAIL] to=user@email.com subject="Subject" from=hello@legacy-loop.com status=sent/failed

This gives us deliverability signal mapped to user actions. Nobody else has this data for resale platforms.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 6 — BUILD PATTERN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Database -> Storage -> API -> AI -> Enrichment -> UI -> Dashboard update

Always follow this sequence. Never skip steps. Close the loop every time.

For this command:
.env fix → Shared templates (Part C) → Central sender (Part D) → Offer wrapper (Part E) → Auth templates (Part F) → Wire signup email (Part G) → Wire checkout emails (Part H) → Wire LTL email (Part I) → Create webhook (Part J) → Scrub .env.example (Part K) → Verify all

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 7 — PLATFORM CONTEXT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PHASE 1 (NOW): Copy hub — no OAuth needed. 13 platforms. Demo-ready.
PHASE 2: Direct publish as OAuth is approved per platform.

Email system context:
- SendGrid free tier: 100 emails/day
- Brand new SendGrid account (March 17, 2026)
- Brand new Twilio account (March 17, 2026)
- New credentials already in .env (Ryan updated manually)
- New TWILIO_MESSAGING_SERVICE_SID added (MGc89e77ddc4b1540a73a4f7da4c82e655)
- All transactional emails go through lib/email/send.ts
- n8n handles drip sequences externally via webhook triggers
- n8n has 13 days left on cloud trial — will self-host after

LegacyLoop email addresses (all on Google Workspace):
- hello@legacy-loop.com — primary platform emails
- support@legacy-loop.com — customer support
- shipping@legacy-loop.com — shipping notifications
- estates@legacy-loop.com — estate services
- noreply@legacy-loop.com — system emails (replies go to support@)
- ryan@legacy-loop.com — CEO
- investors@legacy-loop.com — investor relations
- social@legacy-loop.com — social and press

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 8 — CLAUDE CODE CREATIVE LATITUDE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

You MAY:
* Improve beyond minimum spec
* Flag gaps noticed while working
* Choose cleanest technical path
* Add defensive error handling
* Make UI impressive for investor demo
* Wire logical connections within scope
* Flag missed data collection opportunities
* Add polish that serves the Elon standard
* Make this feel like a $1B product

You MAY NOT:
* Touch any locked files
* Change any bot AI or prompt logic
* Change any bot output format
* Deviate from inline style={{}}
* Add unapproved npm packages
* Add routes beyond scope
* Change schema without explicit approval
* Change the design directive wording

Flag everything outside scope. Do not fix silently. Always report flags clearly.

Read the FULL component code before writing any command — not just grep results. Never assume. Never guess. Read first. Build second.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 9 — DEMO MODE + ADMIN BYPASS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

DEMO_MODE=true in .env — active now.
Admin account bypasses ALL tier gates and credit deductions.

shouldBypassGates(user.role) checks isDemoMode() || isAdminUser(role)

Admin: never locked out. No credits deducted. Full platform access.

TO GO LIVE:
Set DEMO_MODE=false in .env.
Switch Square sandbox keys to production keys.
All gates enforce immediately for real users.

Email in demo mode:
- SENDGRID_API_KEY IS set in .env → emails WILL send for real
- The FEATURES.LIVE_EMAIL flag in lib/feature-flags.ts (line 9) auto-enables when key exists
- This is correct — we want real email delivery testing in demo mode
- No special demo/admin email logic needed

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
OBJECTIVE — Email System Update, Upgrade, and Code Fix
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Ryan created new Twilio and SendGrid accounts on March 17, 2026. New credentials are already in .env. Now the code needs to be updated to match.

A Phase 1 code audit found these issues:

BUGS (8):
1. lib/email/send.ts line 26 — hardcoded "noreply@legacyloop.com" (wrong domain, no hyphen)
2. lib/email/send.ts — no SENDGRID_FROM_EMAIL env var support
3. lib/email/send.ts — no SENDGRID_FROM_NAME env var support
4. lib/email/templates.ts line 6 — LOGO_URL uses "legacyloop.com" (wrong domain)
5. lib/email/templates.ts line 24 — footer has "legacyloopmaine@gmail.com" and "(512) 758-0518"
6. app/api/auth/forgot-password/route.ts line 67-68 — wrong phone "(207) 555-0100" and "help@legacy-loop.com"
7. app/api/auth/change-password/route.ts line 79 — footer has "legacyloopmaine@gmail.com"
8. app/api/auth/magic-link/send/route.ts line 115 — "support@legacyloop.com" (missing hyphen)

GAPS (9):
1. No welcome email sent on signup (template exists at lib/email/templates.ts but never called)
2. No confirmation email for credit pack purchases
3. No confirmation email for custom credit purchases
4. No confirmation email for subscription upgrades
5. No order confirmation email to buyer on item purchase (template exists but never called)
6. No sold notification email to seller on item purchase (template exists but never called)
7. LTL quote request has TODO for email — never wired (line 103)
8. No n8n webhook endpoint for external workflow triggers
9. .env has malformed lines: bare "Grok" text (line 49) and "(or grok-3-fast for text fallback)" (line 55)

INCONSISTENCIES (5 different email styles):
1. lib/email/templates.ts — light theme (white bg, dark text)
2. lib/offers/notify.ts — dark theme (dark bg, teal accents)
3. app/api/auth/forgot-password — cream bg, serif font, green buttons
4. app/api/auth/change-password — dark bg, GitHub-inspired style
5. app/api/auth/magic-link — light bg, gradient header

What this command does:
* Fix .env malformed lines and add N8N webhook vars
* Replace lib/email/send.ts — use env vars, add per-email from override, add logging
* Replace lib/email/templates.ts — one unified dark premium theme, fix all domains and contact info, keep 3 existing functions (same signatures), add 4 new template functions, export shared utilities
* Update lib/offers/notify.ts — import shared wrapper from templates (delete local copies, zero logic changes)
* Update 3 auth routes — replace inline HTML with shared wrapper (zero auth logic changes)
* Wire welcome email to signup route
* Wire 4 confirmation emails to checkout route
* Wire LTL quote notification email
* Create n8n webhook endpoint (new file)
* Scrub .env.example of all real API keys

What this command does NOT touch:
* No AI logic changes
* No bot logic changes
* No offer LOGIC changes (only wrapper styling)
* No auth LOGIC changes (only email templates)
* No payment LOGIC changes (only adding email sends)
* No shipping LOGIC changes (only replacing TODO)
* No database/schema changes
* No UI component changes
* No billing logic changes

ALSO: This command resolves the .env malformed lines:
* Line 49: bare "Grok" text — not a valid env var — DELETE
* Line 55: bare "(or grok-3-fast for text fallback)" — not valid — DELETE

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PART A — MANDATORY FULL READ
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

DO NOT BEGIN BUILDING UNTIL ALL READS ARE COMPLETE AND PRINTED.

1. Read .env — FULL file (~60 lines)
   Find: new Twilio creds (lines 29-32), new SendGrid creds (lines 33-35), malformed "Grok" (line 49), malformed parenthetical (line 55)

2. Read lib/email/send.ts — FULL file (~40 lines)
   Find: hardcoded "noreply@legacyloop.com" (line 26), no env var for from name

3. Read lib/email/templates.ts — FULL file (~134 lines)
   Find: LOGO_URL with wrong domain (line 6), wrapper() with light theme (lines 10-31), footer with old gmail and old phone (line 24), welcomeEmail (line 33), itemSoldEmail (line 62), orderConfirmationEmail (line 97)

4. Read lib/offers/notify.ts — FULL file (~320 lines)
   Find: local emailWrapper() dark theme (lines 10-22), local ctaButton() (lines 24-26), local APP_URL (line 4), all 6 notification functions that MUST NOT change

5. Read app/api/auth/forgot-password/route.ts — FULL file (~113 lines)
   Find: sendResetEmail() with inline HTML (lines 7-86), wrong phone and email (lines 67-68), FROM_EMAIL from env var (line 4 — this one actually uses the env var correctly)

6. Read app/api/auth/change-password/route.ts — FULL file (~93 lines)
   Find: inline HTML dark template (lines 52-84), old gmail in footer (line 79)

7. Read app/api/auth/magic-link/send/route.ts — FULL file (~134 lines)
   Find: inline HTML with gradient header (lines 59-125), wrong domain support@legacyloop.com (line 115)

8. Read app/api/auth/signup/route.ts — FULL file (~55 lines)
   Find: authAdapter.signup() on line 40, return "OK" on line 41, no email anywhere

9. Read app/api/payments/checkout/route.ts — FULL file (~388 lines)
   Find: credit_pack return (~line 117), custom_credit return (~line 191), subscription return (~line 281), item_purchase notification create (~line 358) and return (~line 370) — none send email

10. Read app/api/shipping/ltl-quote-request/route.ts — FULL file (~115 lines)
    Find: TODO comment "Send email to legacyloopmaine@gmail.com via nodemailer or SendGrid" (lines 103-104)

11. Read lib/feature-flags.ts — FULL file (~16 lines)
    Find: LIVE_EMAIL: !!process.env.SENDGRID_API_KEY (line 9)

Print ALL findings with exact line numbers before proceeding.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PART B — FIX .ENV MALFORMED LINES + ADD N8N VARS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

File: .env

DO NOT TOUCH LINES 1-48. Credentials are already correct.

DELETE line 49: "Grok" (bare text, not a valid env var, will cause parse issues)
DELETE line 55: "(or grok-3-fast for text fallback)" (bare text, not valid)

ADD at end of file after SYSTEM_USER_ID:

# n8n Webhook Integration
N8N_WEBHOOK_SECRET=GENERATE_THIS_NOW

To generate the secret, run:
openssl rand -base64 32

Use the output as the value. This secret secures the webhook endpoint.

NOTE: N8N_WEBHOOK_URL will be added later when Ryan confirms his n8n instance URL. For now the signup webhook code checks if the env var exists before firing, so it's safe to omit.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PART C — REPLACE LIB/EMAIL/TEMPLATES.TS (UNIFIED DARK PREMIUM)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

File: lib/email/templates.ts

Replace the ENTIRE file.

Requirements for the new version:

DESIGN CONSTANTS (export all):
const ACCENT = "#00bcd4";
const BG_DARK = "#0d1117";
const BG_CARD = "#161b22";
const TEXT_PRIMARY = "#f0f6fc";
const TEXT_SECONDARY = "#8b949e";
const TEXT_MUTED = "#484f58";
const BORDER = "rgba(0,188,212,0.15)";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://legacy-loop.com";

SHARED ctaButton(text, url):
- Teal background (#00bcd4), white text, 700 weight, 16px, 8px radius, 14px 32px padding
- Returns HTML string

SHARED wrapper(content):
- DOCTYPE html, meta charset, meta viewport
- Body: BG_DARK background, system font stack
- Table: 600px max-width, BG_CARD background, 12px radius, BORDER border
- Header row: 36px teal square with "LL" + "LegacyLoop" text, centered
- Content row: 32px padding, receives content parameter
- Footer row: Privacy Policy link | Terms of Service link, "LegacyLoop · support@legacy-loop.com", Manage Preferences link
- All links use APP_URL, all text uses correct legacy-loop.com domain
- NO old gmail address, NO old phone numbers, NO legacyloop.com (no hyphen)

EXISTING FUNCTIONS (keep exact same signatures — no breaking changes):

1. welcomeEmail(name: string): { subject: string; html: string }
   Subject: "Welcome to LegacyLoop! Let's get started"
   Content: Welcome greeting, 3-step guide (upload → AI prices → sell), "Upload Your First Item" CTA button to APP_URL/items/new, "Questions? Email support@legacy-loop.com"

2. itemSoldEmail(sellerName, itemTitle, saleAmount, commission, netEarnings, itemId): { subject; html }
   Subject: "Your {itemTitle} just sold for ${saleAmount}!"
   Content: Congratulations, earnings breakdown table (item, sale amount, commission in red, net earnings in teal), "Ship Your Item" CTA to APP_URL/items/{itemId}, 3-day hold note

3. orderConfirmationEmail(buyerName, itemTitle, itemPrice, shippingCost, processingFee, total): { subject; html }
   Subject: "Order confirmed — {itemTitle}"
   Content: Confirmed message, order summary table (item, price, shipping if >0, processing fee, total in teal), estimated delivery 3-7 days, "View Dashboard" CTA

NEW FUNCTIONS:

4. creditPurchaseEmail(name, creditAmount, newBalance, amountPaid): { subject; html }
   Subject: "{creditAmount} credits added to your account!"
   Content: Confirmed message, teal highlight box showing +{creditAmount} credits, new balance, amount paid, "Explore Add-Ons" CTA to APP_URL/addons

5. subscriptionUpgradeEmail(name, planName, amountPaid, billing): { subject; html }
   Subject: "Welcome to {planName}! Your upgrade is confirmed"
   Content: Welcome message, teal highlight box showing plan name and price/billing, "View Dashboard" CTA

6. ltlQuoteRequestEmail(requesterEmail, itemId, originZip, destZip, weight, formatted): { subject; html }
   Subject: "LTL Freight Quote Request — Item {itemId}"
   Content: From line, pre-formatted quote details in code block style, "View Item" CTA

EXPORTS (at bottom of file):
export { wrapper as emailWrapper, ctaButton, ACCENT, APP_URL, TEXT_PRIMARY, TEXT_SECONDARY, TEXT_MUTED, BG_DARK, BG_CARD, BORDER };

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PART D — REPLACE LIB/EMAIL/SEND.TS (CENTRAL SENDER FIX)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

File: lib/email/send.ts

Replace the ENTIRE file.

Requirements:

Interface EmailMessage:
- to: string (required)
- subject: string (required)
- html: string (required)
- from?: string (optional — override default from address)
- fromName?: string (optional — override default from name)

Constants:
- DEFAULT_FROM_EMAIL from process.env.SENDGRID_FROM_EMAIL with fallback "hello@legacy-loop.com"
- DEFAULT_FROM_NAME from process.env.SENDGRID_FROM_NAME with fallback "LegacyLoop"

Function sendEmail(msg: EmailMessage): Promise<boolean>:
- Uses msg.from || DEFAULT_FROM_EMAIL as fromEmail
- Uses msg.fromName || DEFAULT_FROM_NAME as fromName
- If FEATURES.LIVE_EMAIL && SENDGRID_API_KEY: POST to SendGrid API with fromEmail and fromName
- Log on every attempt: [EMAIL] to=${msg.to} subject="${msg.subject}" from=${fromEmail} status=${ok/failed}
- Log error body on failure: [EMAIL ERROR] SendGrid ${status}: ${body}
- Else: log [EMAIL NOT SENT — SendGrid not configured]
- Never throws — catch all errors, return false on failure
- Import FEATURES from lib/feature-flags

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PART E — UPDATE LIB/OFFERS/NOTIFY.TS (SHARED WRAPPER IMPORT)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

File: lib/offers/notify.ts

CRITICAL: ZERO LOGIC CHANGES. Only the top-of-file utility functions change.

Step 1: DELETE the local emailWrapper() function (lines 10-22)
Step 2: DELETE the local ctaButton() function (lines 24-26)
Step 3: DELETE the local APP_URL constant (line 4)
Step 4: ADD this import at top: import { emailWrapper, ctaButton, APP_URL } from "@/lib/email/templates";

Why this works: All 6 notification functions already reference emailWrapper(), ctaButton(), and APP_URL by name. Changing the source from local function to import is seamless. No function signatures change. No prisma calls change. No notification logic changes.

Verify after: notifySellerNewOffer, notifyBuyerCountered, notifyBuyerAccepted, notifyBuyerDeclined, notifySellerBuyerResponded, notifyOfferExpired — all 6 must compile and work identically.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PART F — FIX 3 AUTH EMAIL TEMPLATES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ZERO AUTH LOGIC CHANGES. Only replacing inline HTML with shared wrapper.

F1. File: app/api/auth/forgot-password/route.ts
Add import: { emailWrapper, ctaButton, ACCENT, TEXT_PRIMARY, TEXT_SECONDARY, TEXT_MUTED } from "@/lib/email/templates"
Replace: the entire inline HTML template string inside sendResetEmail() with an emailWrapper() call
Content: "Reset your password" heading, explanation text, ctaButton("Reset My Password", resetUrl), copy-paste link in teal, 1-hour expiry note
Also fix: plain text fallback contact to "support@legacy-loop.com"
Do NOT touch: prisma, token generation, resetUrl construction, POST handler, FROM_EMAIL env var usage

F2. File: app/api/auth/change-password/route.ts
Add import: { emailWrapper, ctaButton, TEXT_PRIMARY, TEXT_SECONDARY } from "@/lib/email/templates"
Replace: the entire inline HTML const (lines 52-84) with emailWrapper() call
Content: "Your password was changed" heading, date/time shown, ctaButton("Contact Support", "mailto:support@legacy-loop.com")
Do NOT touch: bcrypt, prisma update, session handling, changedAt formatting

F3. File: app/api/auth/magic-link/send/route.ts
Add import: { emailWrapper, ctaButton, ACCENT, TEXT_PRIMARY, TEXT_SECONDARY, TEXT_MUTED } from "@/lib/email/templates"
Replace: the entire inline HTML (lines 59-125) with emailWrapper() call ending with .trim()
Content: "Sign in to LegacyLoop" heading, ctaButton("Sign In to LegacyLoop", verifyUrl), copy-paste link, 1-hour expiry note
Do NOT touch: rate limiting, token generation, prisma magicLink create, verifyUrl construction

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PART G — WIRE WELCOME EMAIL TO SIGNUP
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

File: app/api/auth/signup/route.ts

Add imports at top:
import { sendEmail } from "@/lib/email/send";
import { welcomeEmail } from "@/lib/email/templates";

After line 40 (await authAdapter.signup) and BEFORE return new Response("OK"):

    // Send welcome email (fire-and-forget — never block signup)
    const name = trimmedEmail.split("@")[0];
    const welcome = welcomeEmail(name);
    sendEmail({ to: trimmedEmail, ...welcome });

    // Notify n8n for welcome drip sequence (fire-and-forget)
    if (process.env.N8N_WEBHOOK_URL) {
      fetch(`${process.env.N8N_WEBHOOK_URL}/webhook/new-user`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmedEmail, firstName: name, signupDate: new Date().toISOString() }),
      }).catch(() => {});
    }

Do NOT touch: rate limiting, email validation, password validation, authAdapter.signup, error handling, auto-login.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PART H — WIRE CONFIRMATION EMAILS TO CHECKOUT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

File: app/api/payments/checkout/route.ts

Add imports at top:
import { sendEmail } from "@/lib/email/send";
import { creditPurchaseEmail, subscriptionUpgradeEmail, itemSoldEmail, orderConfirmationEmail } from "@/lib/email/templates";

H1. CREDIT PACK — after creditTransaction.create, before return:
   Get userName from prisma user.displayName or email split
   Send creditPurchaseEmail(userName, totalCredits, newBalance, chargeAmount)
   Fire-and-forget: sendEmail({ to: user.email, ...confirmEmail })

H2. CUSTOM CREDIT — same pattern, before custom_credit return:
   Get userName, send creditPurchaseEmail, fire-and-forget

H3. SUBSCRIPTION — after subscription create/update, before return:
   Get userName, send subscriptionUpgradeEmail(userName, tier.name, chargeAmount, billing)

H4. ITEM PURCHASE — after item marked SOLD and earnings recorded, before return:
   Send to BUYER: orderConfirmationEmail(buyerName, title, itemPrice, shippingCost, processingFee, total)
   Send to SELLER: itemSoldEmail(sellerName, title, itemPrice, commAmount, net, item.id)
   For seller commission: look up active subscription commission rate, calculate amounts

ALL fire-and-forget. ZERO payment logic changes. Do NOT touch Square calls, credit fulfillment, subscription updates, recordPayment, recordEarning, or item status changes.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PART I — WIRE LTL QUOTE EMAIL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

File: app/api/shipping/ltl-quote-request/route.ts

Add imports at top:
import { sendEmail } from "@/lib/email/send";
import { ltlQuoteRequestEmail } from "@/lib/email/templates";

Replace the TODO comment on lines 103-104 with:

    const quoteEmail = ltlQuoteRequestEmail(
      quoteData.requestedBy, quoteData.itemId,
      quoteData.originZip, quoteData.destinationZip,
      String(quoteData.weight), formatted
    );
    sendEmail({
      to: "shipping@legacy-loop.com",
      from: "shipping@legacy-loop.com",
      fromName: "LegacyLoop Shipping",
      ...quoteEmail,
    }).catch(() => {});

Do NOT touch: auth, body parsing, quoteData construction, formatted string, temp file save, response.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PART J — CREATE N8N WEBHOOK ENDPOINT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

File: app/api/webhooks/n8n/route.ts — NEW FILE

Create a Next.js API route with:

POST handler:
- Read x-webhook-secret header
- Compare to process.env.N8N_WEBHOOK_SECRET
- Return 401 if mismatch or missing
- Parse { action, data } from JSON body
- Log: [N8N WEBHOOK] action=${action}
- Switch on action: "ping" returns { ok: true, message: "pong" }
- Default: return { ok: true, received: action }
- try/catch with error logging

GET handler:
- Return { status: "ok", service: "n8n-webhook" }
- Used for health checks

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PART K — SCRUB .ENV.EXAMPLE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

File: .env.example

This file currently contains REAL API keys. It should only have placeholder values.

Replace every real API key value with descriptive placeholders:
OPENAI_API_KEY=your_openai_api_key_here
ANTHROPIC_API_KEY=your_anthropic_api_key_here
GEMINI_API_KEY=your_gemini_api_key_here
SHIPPO_API_KEY=your_shippo_api_key_here
TWILIO_ACCOUNT_SID=your_twilio_account_sid_here
TWILIO_AUTH_TOKEN=your_twilio_auth_token_here
TWILIO_PHONE_NUMBER=+1XXXXXXXXXX
TWILIO_MESSAGING_SERVICE_SID=your_messaging_service_sid_here
SENDGRID_API_KEY=your_sendgrid_api_key_here
SENDGRID_FROM_EMAIL=hello@legacy-loop.com
SENDGRID_FROM_NAME=LegacyLoop
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
NEXTAUTH_SECRET=generate_with_openssl_rand_base64_32
SQUARE_APPLICATION_ID=your_square_app_id_here
SQUARE_ACCESS_TOKEN=your_square_access_token_here
SQUARE_LOCATION_ID=your_square_location_id_here
XAI_API_KEY=your_xai_api_key_here
RAINFOREST_API_KEY=your_rainforest_api_key_here
CRON_SECRET=generate_with_openssl_rand_base64_32

Delete bare "Grok" text line
Delete bare "(or grok-3-fast for text fallback)" line
Remove duplicate SYSTEM_USER_ID if present

Add new variables:
N8N_WEBHOOK_URL=https://your-n8n-instance.com
N8N_WEBHOOK_SECRET=generate_with_openssl_rand_base64_32

Keep all comments and section headers clean and organized.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 10 — VERIFICATION CHECKLIST
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. CHECKPOINT baseline: pass
2. Part A full reads completed: yes / no
3. .env malformed "Grok" line deleted: yes / no
4. .env malformed parenthetical line deleted: yes / no
5. .env N8N_WEBHOOK_SECRET generated and added: yes / no
6. lib/email/send.ts reads SENDGRID_FROM_EMAIL env var: yes / no
7. lib/email/send.ts reads SENDGRID_FROM_NAME env var: yes / no
8. lib/email/send.ts supports from/fromName per-email override: yes / no
9. lib/email/send.ts logs every send with structured format: yes / no
10. lib/email/templates.ts uses dark premium theme (#0d1117 bg): yes / no
11. lib/email/templates.ts all domains are legacy-loop.com: yes / no
12. lib/email/templates.ts footer shows support@legacy-loop.com: yes / no
13. lib/email/templates.ts no old phone numbers remain: yes / no
14. lib/email/templates.ts no legacyloopmaine@gmail.com remains: yes / no
15. lib/email/templates.ts exports emailWrapper, ctaButton, and all constants: yes / no
16. lib/email/templates.ts has all 6 template functions (3 existing + 3 new): yes / no
17. lib/offers/notify.ts imports emailWrapper from templates: yes / no
18. lib/offers/notify.ts imports ctaButton from templates: yes / no
19. lib/offers/notify.ts imports APP_URL from templates: yes / no
20. lib/offers/notify.ts has NO local emailWrapper function: yes / no
21. lib/offers/notify.ts has NO local ctaButton function: yes / no
22. lib/offers/notify.ts ALL 6 notification functions unchanged: yes / no
23. forgot-password uses shared emailWrapper: yes / no
24. forgot-password auth logic untouched: yes / no
25. change-password uses shared emailWrapper: yes / no
26. change-password auth logic untouched: yes / no
27. magic-link uses shared emailWrapper: yes / no
28. magic-link auth logic untouched: yes / no
29. signup/route.ts sends welcomeEmail after signup: yes / no
30. signup/route.ts fires n8n webhook if URL set: yes / no
31. signup/route.ts auth logic untouched: yes / no
32. checkout credit_pack sends creditPurchaseEmail: yes / no
33. checkout custom_credit sends creditPurchaseEmail: yes / no
34. checkout subscription sends subscriptionUpgradeEmail: yes / no
35. checkout item_purchase sends orderConfirmationEmail to buyer: yes / no
36. checkout item_purchase sends itemSoldEmail to seller: yes / no
37. checkout payment logic untouched: yes / no
38. ltl-quote-request sends email to shipping@legacy-loop.com: yes / no
39. ltl-quote-request shipping logic untouched: yes / no
40. app/api/webhooks/n8n/route.ts created: yes / no
41. n8n webhook validates x-webhook-secret: yes / no
42. .env.example has ZERO real API keys: yes / no
43. .env.example has TWILIO_MESSAGING_SERVICE_SID placeholder: yes / no
44. .env.example has SENDGRID_FROM_NAME placeholder: yes / no
45. .env.example has N8N_WEBHOOK_URL placeholder: yes / no
46. .env.example has N8N_WEBHOOK_SECRET placeholder: yes / no
47. .env.example no malformed bare text lines: yes / no
N+1. All locked files untouched: yes / no
N+2. inline style={{}} throughout (no Tailwind, no className): yes / no
N+3. npx tsc --noEmit: 0 errors
N+4. npm run build: pass
N+5. CHECKPOINT post-change: pass
N+6. Dev server: localhost:3000

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 11 — REQUIRED REPORT FORMAT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CHECKPOINT before: [pass / issue]
Part A printed: [yes / no]

Fix B — .env malformed lines + N8N vars: [fixed / issue]
Fix C — Unified email templates (dark premium): [fixed / issue]
Fix D — Central email sender with env vars: [fixed / issue]
Fix E — offers/notify.ts shared wrapper import: [fixed / issue]
Fix F1 — forgot-password template: [fixed / issue]
Fix F2 — change-password template: [fixed / issue]
Fix F3 — magic-link template: [fixed / issue]
Fix G — Welcome email wired to signup: [fixed / issue]
Fix H1 — Credit pack confirmation email: [fixed / issue]
Fix H2 — Custom credit confirmation email: [fixed / issue]
Fix H3 — Subscription upgrade email: [fixed / issue]
Fix H4 — Item purchase buyer + seller emails: [fixed / issue]
Fix I — LTL quote request email: [fixed / issue]
Fix J — n8n webhook endpoint: [created / issue]
Fix K — .env.example scrubbed: [fixed / issue]

EXISTING LOGIC UNTOUCHED: [List every locked file verified]
OFFER LOGIC UNTOUCHED: [Confirm all 6 notify.ts functions identical except wrapper source]
AUTH LOGIC UNTOUCHED: [Confirm rate limiting, token gen, prisma calls, auto-login unchanged]
PAYMENT LOGIC UNTOUCHED: [Confirm Square calls, credit fulfillment, subscription updates, earnings unchanged]
SHIPPING LOGIC UNTOUCHED: [Confirm LTL quote data construction and response unchanged]

FLAGS FROM CLAUDE CODE: [All gaps, risks, missed opportunities]

Files modified: [list all with line counts changed]
New files: [list all]
Schema changes needed: none

Build: [pass / fail]
TypeScript: [0 errors / list]
CHECKPOINT after: [pass / issue]
Dev server: [localhost:3000]

IF POST-CHECKPOINT FAILS: REVERT IMMEDIATELY. Report exactly what broke and what was touched.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Command Template v8 | LegacyLoop | Email System Update + Upgrade + Code Fix
Approved: March 17, 2026 | Ryan Hallee, Founder
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
