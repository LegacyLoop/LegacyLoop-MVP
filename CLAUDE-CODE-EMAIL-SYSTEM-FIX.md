LEGACYLOOP — COMMAND TEMPLATE v8
Email System Complete Fix
Updated: March 17, 2026 | Copy everything below this line into Claude Code.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 1 — CRITICAL DESIGN DIRECTIVE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

READ BEFORE MAKING ANY CHANGES:

This app has an established design system: sleek, elegant, high-tech — inspired by Tesla, SpaceX, and Grok. Dark theme with teal (#00bcd4) accents, glass morphism cards, subtle animations, generous whitespace, premium typography. Senior-friendly.

All styles inline style={{}} — NO Tailwind. NO external CSS. NO className for styling. ONLY inline style={{}}.

Every new element must match this design system exactly. No exceptions.

EMAIL TEMPLATE DESIGN DIRECTIVE:
All email templates must use ONE consistent design: dark theme (#0d1117 background), teal (#00bcd4) accents, white text (#f0f6fc), professional typography. The dark theme matches the app's visual identity. Kill ALL light theme email templates — unify to dark premium.

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
app/api/shipping/* — LOCKED (except ltl-quote-request — see unlock)
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

lib/email/send.ts — UNLOCKED (fix from address, add env var support)
lib/email/templates.ts — UNLOCKED (fix domains, contact info, unify to dark theme, add new templates)
lib/offers/notify.ts — UNLOCKED (replace local emailWrapper/ctaButton with shared imports ONLY — do NOT touch any offer logic, notification logic, prisma calls, or function signatures)
app/api/auth/forgot-password/route.ts — UNLOCKED (replace inline HTML template with shared wrapper — do NOT touch auth logic)
app/api/auth/change-password/route.ts — UNLOCKED (replace inline HTML template with shared wrapper — do NOT touch auth logic)
app/api/auth/magic-link/send/route.ts — UNLOCKED (replace inline HTML template with shared wrapper — do NOT touch auth logic)
app/api/auth/signup/route.ts — UNLOCKED (add welcome email + n8n webhook call after user creation)
app/api/payments/checkout/route.ts — UNLOCKED (add confirmation emails after each purchase type — do NOT touch payment logic)
app/api/shipping/ltl-quote-request/route.ts — UNLOCKED (wire SendGrid email for quote notification — replace TODO only)
app/api/webhooks/n8n/route.ts — NEW FILE (create n8n webhook endpoint)
.env.example — UNLOCKED (scrub real keys, add new variables)

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

For this command specifically:
Log every email send attempt (success/failure) to console with structured data:
[EMAIL] to=${email} subject=${subject} from=${fromEmail} status=${ok ? 'sent' : 'failed'}

This gives us deliverability data — which emails succeed, which fail, and from which sender identity. Nobody else has this mapped to resale user behavior.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 6 — BUILD PATTERN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Database -> Storage -> API -> AI -> Enrichment -> UI -> Dashboard update

Always follow this sequence. Never skip steps. Close the loop every time.

For this command the sequence is:
Shared Templates -> Central Sender Fix -> Auth Email Fixes -> Offer Wrapper Fix -> Signup Wire -> Checkout Wire -> LTL Wire -> Webhook Endpoint -> .env Scrub -> Verify

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 7 — PLATFORM CONTEXT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PHASE 1 (NOW): Copy hub — no OAuth needed. 13 platforms. Demo-ready.
PHASE 2: Direct publish as OAuth is approved per platform.

Email system context: SendGrid free tier (100 emails/day). New account, clean start. All emails go through lib/email/send.ts central sender. n8n handles drip sequences externally.

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

Email system in demo mode:
- If SENDGRID_API_KEY is set, emails send for real even in demo mode
- If SENDGRID_API_KEY is not set, emails log to console only
- The FEATURES.LIVE_EMAIL flag controls this (lib/feature-flags.ts line 9)
- This is correct behavior — we want to test real email delivery in demo mode
- No special demo/admin logic needed for email sends

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
OBJECTIVE — Fix Entire Email System + Wire Missing Emails + Add n8n Webhook
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

The Phase 1 code audit (March 17, 2026) found 8 bugs and 9 gaps in the email system. This command fixes all of them surgically. No rebuilds. No redesigns. Targeted updates only.

What this command touches:
* Central email sender — fix from address, add env var support
* Email templates — unify 5 different styles into 1 dark premium theme
* Auth email templates — replace 3 inline templates with shared wrapper
* Offer email wrapper — replace local copy with shared import
* Signup route — wire welcome email and n8n webhook
* Checkout route — wire 4 confirmation emails (credit, custom, subscription, item)
* LTL shipping route — wire quote request email notification
* New n8n webhook endpoint — for external workflow callbacks
* .env.example — scrub all real API keys, add new variables

What this command does NOT touch:
* No AI logic changes
* No bot logic changes
* No offer system logic changes (only styling in notify.ts)
* No database/schema changes
* No billing logic changes
* No shipping logic changes (only email addition in ltl-quote-request)
* No payment processing changes
* No UI component changes

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PART A — MANDATORY FULL READ
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

DO NOT BEGIN BUILDING UNTIL ALL READS ARE COMPLETE AND PRINTED.

1. Read lib/email/send.ts — FULL file (~40 lines)
   Find: hardcoded from address "noreply@legacyloop.com" (line 26)
   Find: SENDGRID_API_KEY check (line 17)
   Find: no SENDGRID_FROM_EMAIL env var used
   Find: no SENDGRID_FROM_NAME env var used

2. Read lib/email/templates.ts — FULL file (~134 lines)
   Find: LOGO_URL uses "legacyloop.com" not "legacy-loop.com" (line 6)
   Find: wrapper() function uses light theme — white bg (line 10-31)
   Find: footer has "legacyloopmaine@gmail.com" and "(512) 758-0518" (line 24)
   Find: welcomeEmail function (line 33) — exists but never called from signup
   Find: itemSoldEmail function (line 62) — exists but never called from checkout
   Find: orderConfirmationEmail function (line 97) — exists but never called from checkout

3. Read lib/offers/notify.ts — FULL file (~320 lines)
   Find: LOCAL emailWrapper() function uses dark theme (line 10-22)
   Find: LOCAL ctaButton() function (line 24-26)
   Find: LOCAL APP_URL constant (line 4)
   Find: 6 notification functions below — ALL must remain untouched

4. Read app/api/auth/forgot-password/route.ts — FULL file (~113 lines)
   Find: THIRD email style — serif font, cream background (line 26-76)
   Find: wrong contact info — (207) 555-0100 and help@legacy-loop.com (line 67-68)

5. Read app/api/auth/change-password/route.ts — FULL file (~93 lines)
   Find: FOURTH email style — dark bg, GitHub-inspired (line 52-84)
   Find: old email in footer — legacyloopmaine@gmail.com (line 79)

6. Read app/api/auth/magic-link/send/route.ts — FULL file (~134 lines)
   Find: FIFTH email style — light bg, gradient header (line 59-125)
   Find: wrong domain — support@legacyloop.com (line 115)

7. Read app/api/auth/signup/route.ts — FULL file (~55 lines)
   Find: authAdapter.signup() call (line 40)
   Find: NO welcome email sent after user creation
   Find: NO n8n webhook notification

8. Read app/api/payments/checkout/route.ts — FULL file (~388 lines)
   Find: credit_pack handler (line 53) — NO confirmation email
   Find: custom_credit handler (line 127) — NO confirmation email
   Find: subscription handler (line 195) — NO confirmation email
   Find: item_purchase handler (line 293) — NO buyer or seller email

9. Read app/api/shipping/ltl-quote-request/route.ts — FULL file (~115 lines)
   Find: TODO comment "Send email to legacyloopmaine@gmail.com" (line 103-104)

10. Read lib/feature-flags.ts — FULL file (~16 lines)
    Find: LIVE_EMAIL flag tied to SENDGRID_API_KEY (line 9)

11. Read .env.example — FULL file
    Find: ALL lines containing real API key values
    Find: SENDGRID_API_KEY with real SG. key (line 54)
    Find: SENDGRID_FROM_EMAIL set to noreply@legacy-loop.com (line 55)
    Find: NO SENDGRID_FROM_NAME variable
    Find: NO N8N_WEBHOOK_URL variable
    Find: NO N8N_WEBHOOK_SECRET variable

Print ALL findings with exact line numbers before proceeding.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PART B — Fix Central Email Sender
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

File: lib/email/send.ts

Replace the ENTIRE file with this corrected version:

import { FEATURES } from "@/lib/feature-flags";

interface EmailMessage {
  to: string;
  subject: string;
  html: string;
  from?: string;
  fromName?: string;
}

const DEFAULT_FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || "hello@legacy-loop.com";
const DEFAULT_FROM_NAME = process.env.SENDGRID_FROM_NAME || "LegacyLoop";

/**
 * Send an email via SendGrid API.
 * - If SENDGRID_API_KEY is set, sends via SendGrid REST API
 * - Otherwise, logs to console (demo mode)
 * - Never throws — email failure should not crash the app
 */
export async function sendEmail(msg: EmailMessage): Promise<boolean> {
  const fromEmail = msg.from || DEFAULT_FROM_EMAIL;
  const fromName = msg.fromName || DEFAULT_FROM_NAME;

  try {
    if (FEATURES.LIVE_EMAIL && process.env.SENDGRID_API_KEY) {
      const res = await fetch("https://api.sendgrid.com/v3/mail/send", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.SENDGRID_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: msg.to }] }],
          from: { email: fromEmail, name: fromName },
          subject: msg.subject,
          content: [{ type: "text/html", value: msg.html }],
        }),
      });

      const ok = res.ok;
      console.log(`[EMAIL] to=${msg.to} subject="${msg.subject}" from=${fromEmail} status=${ok ? "sent" : "failed"}`);
      if (!ok) {
        const body = await res.text().catch(() => "");
        console.error(`[EMAIL ERROR] SendGrid ${res.status}: ${body}`);
      }
      return ok;
    } else {
      console.log(`[EMAIL NOT SENT — SendGrid not configured] To: ${msg.to} | Subject: ${msg.subject}`);
      return false;
    }
  } catch (err) {
    console.error("[EMAIL ERROR]", err);
    return false;
  }
}

What changed:
- From address uses SENDGRID_FROM_EMAIL env var (was hardcoded to wrong domain noreply@legacyloop.com)
- Added SENDGRID_FROM_NAME env var support
- Added optional from and fromName overrides per email (for shipping@, estates@, etc.)
- Added structured logging for every send attempt
- Fixed domain from legacyloop.com to legacy-loop.com

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PART C — Unify Email Templates to Dark Premium Theme
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

File: lib/email/templates.ts

Replace the ENTIRE file. The new version:
- Uses dark premium theme matching the app design system
- Fixes all domain references to legacy-loop.com
- Fixes contact info to support@legacy-loop.com
- Keeps all 3 existing template functions with same signatures (no breaking changes)
- Adds 4 new template functions for missing emails
- Exports shared wrapper() and ctaButton() for use in other files
- Exports design constants for use in auth templates

Design constants for the unified theme:
ACCENT = "#00bcd4"
BG_DARK = "#0d1117"
BG_CARD = "#161b22"
TEXT_PRIMARY = "#f0f6fc"
TEXT_SECONDARY = "#8b949e"
TEXT_MUTED = "#484f58"
BORDER = "rgba(0,188,212,0.15)"
APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://legacy-loop.com"

Shared wrapper() structure:
- Body background: BG_DARK (#0d1117)
- Card background: BG_CARD (#161b22)
- Max width: 600px
- Border radius: 12px
- Border: 1px solid BORDER
- Header: LL logo box (teal square) + "LegacyLoop" text
- Footer: Privacy | Terms links, support@legacy-loop.com, Manage Preferences

Shared ctaButton() structure:
- Background: ACCENT (#00bcd4)
- Text: white, 700 weight, 16px
- Padding: 14px 32px
- Border radius: 8px

Existing template functions to keep (same signatures):
1. welcomeEmail(name: string) — Step 1/2/3 guide, "Upload Your First Item" CTA
2. itemSoldEmail(sellerName, itemTitle, saleAmount, commission, netEarnings, itemId) — Earnings breakdown table, "Ship Your Item" CTA
3. orderConfirmationEmail(buyerName, itemTitle, itemPrice, shippingCost, processingFee, total) — Order summary table, "View Dashboard" CTA

New template functions to add:
4. creditPurchaseEmail(name, creditAmount, newBalance, amountPaid) — Credits added badge, "Explore Add-Ons" CTA
5. subscriptionUpgradeEmail(name, planName, amountPaid, billing) — Plan badge, "View Dashboard" CTA
6. ltlQuoteRequestEmail(requesterEmail, itemId, originZip, destZip, weight, formatted) — Quote details pre block, "View Item" CTA

Exports at bottom:
export { wrapper as emailWrapper, ctaButton, ACCENT, APP_URL, TEXT_PRIMARY, TEXT_SECONDARY, TEXT_MUTED, BG_DARK, BG_CARD, BORDER };

Write the COMPLETE file. Every template must use the shared wrapper() and ctaButton(). No inline styles that don't use the design constants. All links must use APP_URL variable. Footer must show support@legacy-loop.com.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PART D — Unify offers/notify.ts Email Wrapper
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

File: lib/offers/notify.ts

CRITICAL: ONLY change the top of the file. Do NOT touch ANY offer logic, notification logic, prisma calls, or function signatures. The offer system is battle-tested and locked.

Step 1 — Delete the local emailWrapper() function (lines 10-22)
Step 2 — Delete the local ctaButton() function (lines 24-26)
Step 3 — Delete the local APP_URL constant (line 4)
Step 4 — Add these imports at the top:

import { emailWrapper, ctaButton, APP_URL } from "@/lib/email/templates";

The result: All 6 offer notification functions now use the shared dark premium wrapper. Zero logic changes. The offer system is completely untouched.

Verify after this change:
- notifySellerNewOffer still works (uses emailWrapper inline)
- notifyBuyerCountered still works (uses emailWrapper inline)
- notifyBuyerAccepted still works (uses emailWrapper inline)
- notifyBuyerDeclined still works (uses emailWrapper inline)
- notifySellerBuyerResponded still works (uses emailWrapper inline)
- notifyOfferExpired still works (uses emailWrapper inline)
- All prisma calls unchanged
- All function signatures unchanged
- All notification.create calls unchanged

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PART E — Fix Auth Email Templates
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Three auth routes have inline HTML email templates with different styles and wrong contact info. Replace each inline template with the shared emailWrapper from templates.ts. Do NOT touch any auth logic.

E1. File: app/api/auth/forgot-password/route.ts

Add import at top:
import { emailWrapper, ctaButton, ACCENT, TEXT_PRIMARY, TEXT_SECONDARY, TEXT_MUTED } from "@/lib/email/templates";

Replace the sendResetEmail() function's inline HTML template (the entire value string from line 26 through line 71) with:

emailWrapper(`
  <h1 style="font-size:22px;font-weight:700;color:${TEXT_PRIMARY};margin:0 0 16px;text-align:center">Reset your password</h1>
  <p style="font-size:15px;color:${TEXT_SECONDARY};line-height:1.7;margin:0 0 24px">
    We received a request to reset the password for your LegacyLoop account. Click the button below to choose a new password.
  </p>
  <div style="text-align:center;margin:28px 0">
    ${ctaButton("Reset My Password", resetUrl)}
  </div>
  <p style="font-size:13px;color:${TEXT_MUTED};margin:24px 0 0">
    Or copy and paste this link: <span style="color:${ACCENT};word-break:break-all">${resetUrl}</span>
  </p>
  <p style="font-size:13px;color:${TEXT_MUTED};margin:16px 0 0">
    This link expires in <strong style="color:${TEXT_PRIMARY}">1 hour</strong>. If you did not request a password reset, you can safely ignore this email.
  </p>
`)

Also fix the plain text fallback — replace contact info with:
"Need help? Email support@legacy-loop.com"

Do NOT touch: prisma calls, token generation, URL construction, POST handler logic.

━━━━━━━━━━━━━━

E2. File: app/api/auth/change-password/route.ts

Add import at top:
import { emailWrapper, ctaButton, TEXT_PRIMARY, TEXT_SECONDARY } from "@/lib/email/templates";

Replace the inline HTML template (lines 52-84) with:

const html = emailWrapper(`
  <h1 style="font-size:22px;font-weight:700;color:${TEXT_PRIMARY};margin:0 0 16px;text-align:center">Your password was changed</h1>
  <p style="font-size:15px;color:${TEXT_SECONDARY};line-height:1.7;margin:0 0 8px">
    Your LegacyLoop password was changed on <strong style="color:${TEXT_PRIMARY}">${changedAt}</strong>. If this was you, no action is needed.
  </p>
  <p style="font-size:15px;color:${TEXT_SECONDARY};line-height:1.7;margin:0 0 28px">
    If you didn't make this change, contact us immediately.
  </p>
  <div style="text-align:center;margin:0 0 16px">
    ${ctaButton("Contact Support", "mailto:support@legacy-loop.com")}
  </div>
`);

Do NOT touch: bcrypt comparison, prisma update, session handling.

━━━━━━━━━━━━━━

E3. File: app/api/auth/magic-link/send/route.ts

Add import at top:
import { emailWrapper, ctaButton, ACCENT, TEXT_PRIMARY, TEXT_SECONDARY, TEXT_MUTED } from "@/lib/email/templates";

Replace the inline HTML template (lines 59-125) with:

const html = emailWrapper(`
  <h1 style="font-size:22px;font-weight:700;color:${TEXT_PRIMARY};margin:0 0 12px">Sign in to LegacyLoop</h1>
  <p style="font-size:15px;color:${TEXT_SECONDARY};line-height:1.6;margin:0 0 28px">
    Click the button below to sign in — no password needed.
  </p>
  <div style="text-align:center;margin:0 0 28px">
    ${ctaButton("Sign In to LegacyLoop", verifyUrl)}
  </div>
  <p style="font-size:13px;color:${TEXT_MUTED};margin:0 0 8px">Or copy this link:</p>
  <p style="font-size:13px;color:${ACCENT};word-break:break-all;margin:0 0 24px">${verifyUrl}</p>
  <p style="font-size:13px;color:${TEXT_MUTED};margin:0 0 4px">This link expires in 1 hour.</p>
  <p style="font-size:13px;color:${TEXT_MUTED};margin:0">If you didn't request this, you can safely ignore this email.</p>
`).trim();

Do NOT touch: rate limiting, token generation, prisma magicLink create, URL construction.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PART F — Wire Welcome Email to Signup
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

File: app/api/auth/signup/route.ts

Add imports at top:
import { sendEmail } from "@/lib/email/send";
import { welcomeEmail } from "@/lib/email/templates";

After line 40 (await authAdapter.signup(trimmedEmail, String(password));) and BEFORE return new Response("OK"):

    // Send welcome email (fire-and-forget — never block signup)
    const name = trimmedEmail.split("@")[0];
    const welcome = welcomeEmail(name);
    sendEmail({ to: trimmedEmail, ...welcome });

    // Notify n8n webhook for welcome sequence (fire-and-forget)
    if (process.env.N8N_WEBHOOK_URL) {
      fetch(`${process.env.N8N_WEBHOOK_URL}/webhook/new-user`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmedEmail, firstName: name, signupDate: new Date().toISOString() }),
      }).catch(() => {});
    }

Do NOT touch: rate limiting, email validation, password validation, authAdapter.signup call, error handling.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PART G — Wire Confirmation Emails to Checkout
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

File: app/api/payments/checkout/route.ts

Add imports at top:
import { sendEmail } from "@/lib/email/send";
import { creditPurchaseEmail, subscriptionUpgradeEmail, itemSoldEmail, orderConfirmationEmail } from "@/lib/email/templates";

G1. After credit_pack fulfillment (after creditTransaction.create, before the return NextResponse.json):

      // Send confirmation email (fire-and-forget)
      const userName = (await prisma.user.findUnique({ where: { id: user.id }, select: { displayName: true } }))?.displayName || user.email.split("@")[0];
      const confirmEmail = creditPurchaseEmail(userName, totalCredits, newBalance, chargeAmount);
      sendEmail({ to: user.email, ...confirmEmail });

G2. After custom_credit fulfillment (same pattern, before the custom_credit return):

      // Send confirmation email (fire-and-forget)
      const userName = (await prisma.user.findUnique({ where: { id: user.id }, select: { displayName: true } }))?.displayName || user.email.split("@")[0];
      const confirmEmail = creditPurchaseEmail(userName, totalCredits, newBalance, chargeAmount);
      sendEmail({ to: user.email, ...confirmEmail });

G3. After subscription upgrade (after subscription create/update, before the return):

      // Send upgrade confirmation email (fire-and-forget)
      const userName = (await prisma.user.findUnique({ where: { id: user.id }, select: { displayName: true } }))?.displayName || user.email.split("@")[0];
      const upgradeEmail = subscriptionUpgradeEmail(userName, tier.name, chargeAmount, billing);
      sendEmail({ to: user.email, ...upgradeEmail });

G4. After item_purchase — send BOTH buyer confirmation AND seller sold notification:

After item marked SOLD and seller earnings recorded, before the return:

      // Send buyer order confirmation (fire-and-forget)
      const buyerName = body.buyerName || user.email.split("@")[0];
      const orderEmail = orderConfirmationEmail(buyerName, item.title || "Item", itemPrice, shippingCost, processingFee, total);
      sendEmail({ to: user.email, ...orderEmail });

      // Send seller sold notification (fire-and-forget)
      if (item.user?.email) {
        const sellerName = item.user.displayName || item.user.email.split("@")[0];
        const sellerSub = await prisma.subscription.findFirst({ where: { userId: item.userId, status: "ACTIVE" } });
        const commRate = sellerSub ? parseFloat(String(sellerSub.commission)) : 0.05;
        const commAmount = itemPrice * commRate;
        const net = itemPrice - commAmount;
        const soldEmail = itemSoldEmail(sellerName, item.title || "Item", itemPrice, commAmount, net, item.id);
        sendEmail({ to: item.user.email, ...soldEmail });
      }

Do NOT touch: Square payment creation, credit fulfillment logic, subscription update logic, price calculations, rate limiting, item status updates, recordPayment calls, recordEarning calls.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PART H — Wire LTL Quote Email
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

File: app/api/shipping/ltl-quote-request/route.ts

Add imports at top:
import { sendEmail } from "@/lib/email/send";
import { ltlQuoteRequestEmail } from "@/lib/email/templates";

Replace the TODO comment (lines 103-104) with:

    // Send email notification to operations
    const quoteEmail = ltlQuoteRequestEmail(
      quoteData.requestedBy,
      quoteData.itemId,
      quoteData.originZip,
      quoteData.destinationZip,
      String(quoteData.weight),
      formatted
    );
    sendEmail({
      to: "shipping@legacy-loop.com",
      from: "shipping@legacy-loop.com",
      fromName: "LegacyLoop Shipping",
      ...quoteEmail,
    }).catch(() => {});

Do NOT touch: auth check, body parsing, quoteData construction, formatted string builder, temp file save, response JSON.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PART I — Create n8n Webhook Endpoint
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

File: app/api/webhooks/n8n/route.ts — NEW FILE

Create this file with:
- POST handler that validates x-webhook-secret header against N8N_WEBHOOK_SECRET env var
- Returns 401 if secret doesn't match
- Accepts { action, data } JSON body
- Logs action to console
- Switch on action: "ping" returns pong, default returns received
- GET handler that returns { status: "ok", service: "n8n-webhook" }
- Full error handling with try/catch

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PART J — Scrub .env.example
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

File: .env.example

Replace ALL real API key values with placeholder text. Keep variable names. Replace values.

Every line with a real key becomes:
VARIABLE_NAME=your_value_here

Specific replacements:
OPENAI_API_KEY=your_openai_api_key_here
ANTHROPIC_API_KEY=your_anthropic_api_key_here
GEMINI_API_KEY=your_gemini_api_key_here
XAI_API_KEY=your_xai_api_key_here
SHIPPO_API_KEY=your_shippo_api_key_here
TWILIO_ACCOUNT_SID=your_twilio_sid_here
TWILIO_AUTH_TOKEN=your_twilio_auth_token_here
TWILIO_PHONE_NUMBER=+1XXXXXXXXXX
SENDGRID_API_KEY=your_sendgrid_api_key_here
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
NEXTAUTH_SECRET=your_nextauth_secret_here
SQUARE_APPLICATION_ID=your_square_app_id_here
SQUARE_ACCESS_TOKEN=your_square_access_token_here
SQUARE_LOCATION_ID=your_square_location_id_here
RAINFOREST_API_KEY=your_rainforest_api_key_here
CRON_SECRET=your_cron_secret_here

Add these NEW variables:
SENDGRID_FROM_EMAIL=hello@legacy-loop.com
SENDGRID_FROM_NAME=LegacyLoop
N8N_WEBHOOK_URL=https://your-n8n-instance.com
N8N_WEBHOOK_SECRET=your_webhook_secret_here

Fix the malformed lines:
- Remove "Grok" bare text on line 74
- Remove "(or grok-3-fast for text fallback)" on line 80
- Remove duplicate SYSTEM_USER_ID on line 86

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 10 — VERIFICATION CHECKLIST
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. CHECKPOINT baseline: pass
2. Part A full reads completed: yes / no
3. lib/email/send.ts uses SENDGRID_FROM_EMAIL env var: yes / no
4. lib/email/send.ts uses SENDGRID_FROM_NAME env var: yes / no
5. lib/email/send.ts supports optional from/fromName overrides: yes / no
6. lib/email/send.ts logs every send attempt with structured data: yes / no
7. All templates use dark premium theme (#0d1117 bg): yes / no
8. All domain references are legacy-loop.com (not legacyloop.com): yes / no
9. All footers show support@legacy-loop.com (not legacyloopmaine@gmail.com): yes / no
10. No old phone numbers remain (512-758-0518 or 207-555-0100): yes / no
11. offers/notify.ts imports shared emailWrapper (no local copy): yes / no
12. offers/notify.ts imports shared ctaButton (no local copy): yes / no
13. offers/notify.ts imports shared APP_URL (no local copy): yes / no
14. offers/notify.ts — ALL 6 notification functions unchanged: yes / no
15. forgot-password uses shared template wrapper: yes / no
16. change-password uses shared template wrapper: yes / no
17. magic-link uses shared template wrapper: yes / no
18. Signup sends welcome email after user creation: yes / no
19. Signup fires n8n webhook notification: yes / no
20. Credit pack purchase sends confirmation email: yes / no
21. Custom credit purchase sends confirmation email: yes / no
22. Subscription upgrade sends confirmation email: yes / no
23. Item purchase sends buyer order confirmation: yes / no
24. Item purchase sends seller sold notification: yes / no
25. LTL quote request sends email to shipping@legacy-loop.com: yes / no
26. n8n webhook endpoint created at app/api/webhooks/n8n/route.ts: yes / no
27. n8n webhook validates x-webhook-secret header: yes / no
28. .env.example has NO real API keys: yes / no
29. .env.example has SENDGRID_FROM_EMAIL variable: yes / no
30. .env.example has SENDGRID_FROM_NAME variable: yes / no
31. .env.example has N8N_WEBHOOK_URL variable: yes / no
32. .env.example has N8N_WEBHOOK_SECRET variable: yes / no
33. .env.example has no malformed lines (bare Grok text removed): yes / no
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

Fix B — Central email sender: [fixed / issue]
Fix C — Unified email templates (dark premium): [fixed / issue]
Fix D — offers/notify.ts wrapper import: [fixed / issue]
Fix E1 — forgot-password template: [fixed / issue]
Fix E2 — change-password template: [fixed / issue]
Fix E3 — magic-link template: [fixed / issue]
Fix F — Welcome email wired to signup: [fixed / issue]
Fix G1 — Credit pack confirmation email: [fixed / issue]
Fix G2 — Custom credit confirmation email: [fixed / issue]
Fix G3 — Subscription upgrade email: [fixed / issue]
Fix G4 — Item purchase buyer + seller emails: [fixed / issue]
Fix H — LTL quote request email: [fixed / issue]
Fix I — n8n webhook endpoint: [created / issue]
Fix J — .env.example scrubbed: [fixed / issue]

EXISTING LOGIC UNTOUCHED: [List every locked file verified]
OFFER LOGIC UNTOUCHED: [Verify all 6 notify.ts functions unchanged]
AUTH LOGIC UNTOUCHED: [Verify rate limiting, token gen, prisma calls unchanged]
PAYMENT LOGIC UNTOUCHED: [Verify Square calls, credit fulfillment, subscription updates unchanged]

FLAGS FROM CLAUDE CODE: [All gaps, risks, missed opportunities]

Files modified: [list all — be specific]
New files: [list all]
Schema changes needed: none

Build: [pass / fail]
TypeScript: [0 errors / list]
CHECKPOINT after: [pass / issue]
Dev server: [localhost:3000]

IF POST-CHECKPOINT FAILS: REVERT IMMEDIATELY. Report exactly what broke and what was touched.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Command Template v8 | LegacyLoop | Email System Complete Fix
Approved: March 17, 2026 | Ryan Hallee, Founder
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
