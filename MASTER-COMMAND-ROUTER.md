# LEGACYLOOP — MASTER COMMAND ROUTER
## SendGrid + Twilio + n8n + DNS Full Setup
### March 17, 2026

---

## THREE COMMAND STREAMS

Everything from the Phase 1 audit has been split into the correct tool.
Each command is self-contained. Run them in this order.

---

## STREAM 1 — CLAUDE CODE (Terminal)
**File:** `CLAUDE-CODE-EMAIL-SYSTEM-FIX.md`

**What it does:**
- Fixes the wrong from domain in `lib/email/send.ts`
- Adds `SENDGRID_FROM_NAME` and `SENDGRID_FROM_EMAIL` env var support
- Fixes all 5 inconsistent email template styles into one unified design
- Fixes wrong domains (`legacyloop.com` → `legacy-loop.com`) everywhere
- Fixes old contact info in all email footers
- Wires welcome email to signup flow (template exists, never called)
- Wires `itemSoldEmail` to checkout flow (template exists, never called)
- Wires `orderConfirmationEmail` to checkout flow (template exists, never called)
- Adds credit purchase confirmation email
- Adds subscription upgrade confirmation email
- Adds LTL quote request email (TODO already in code)
- Adds n8n webhook endpoint for new user signup notifications
- Scrubs `.env.example` of all real API keys

**Files touched (SURGICAL UNLOCK):**
- `lib/email/send.ts` — Fix from address, add env var support
- `lib/email/templates.ts` — Fix domains, contact info, unify footer
- `lib/offers/notify.ts` — Unify email wrapper to match templates.ts
- `app/api/auth/forgot-password/route.ts` — Fix contact info in template
- `app/api/auth/change-password/route.ts` — Fix contact info, old email
- `app/api/auth/magic-link/send/route.ts` — Fix support email domain
- `app/api/auth/signup/route.ts` — Wire welcome email after user creation
- `app/api/payments/checkout/route.ts` — Wire sale/purchase confirmation emails
- `app/api/shipping/ltl-quote-request/route.ts` — Wire email notification
- `app/api/webhooks/n8n/route.ts` — NEW: n8n webhook endpoint
- `.env.example` — Scrub all real keys, add SENDGRID_FROM_NAME

**Estimated time:** 30-45 minutes in Claude Code

---

## STREAM 2 — CLAUDE EXTENSION (Browser)
**File:** `CLAUDE-EXTENSION-BROWSER-SETUP.md`

**What it does:**
- SendGrid: Domain authentication for legacy-loop.com
- SendGrid: Create new API key with correct permissions
- SendGrid: Verify all 5 sender identities
- Twilio: Fresh account setup from scratch
- Twilio: Configure phone number and messaging
- Twilio: Generate new API credentials
- Squarespace: Verify/update DNS records for SendGrid
- Squarespace: Add any new DNS records needed
- Vercel: Update environment variables (SENDGRID_API_KEY, FROM_EMAIL, FROM_NAME)
- n8n: Connect SendGrid credential
- n8n: Connect Gmail credentials
- n8n: Connect Google Sheets credentials
- n8n: Connect OpenAI credential

**Estimated time:** 45-60 minutes with browser automation

---

## STREAM 3 — CLAUDE COWORKER (This Tool)
**File:** `COWORKER-DELIVERABLES-LIST.md`

**What it does:**
- Creates 7 Google Sheets for n8n workflows
- Writes SendGrid Setup Guide (Google Doc)
- Writes Email Templates Master document (all 15 templates)
- Writes n8n Complete Workflow Guide (all 10 workflows)
- Writes n8n 12-Day Build Schedule
- Writes n8n Self-Host Guide (DigitalOcean)
- Writes Surgical Code Change Map (for Claude Code reference)
- Writes Claude Code Ready Brief (the actual command)
- Writes SendGrid Capacity Planning document
- Saves all docs to correct Google Drive folders

**Estimated time:** 2-3 hours of document creation

---

## RECOMMENDED EXECUTION ORDER

### Phase A — Browser Setup First (Stream 2)
Do this first because Claude Code needs the new API keys.
1. SendGrid domain authentication
2. SendGrid API key creation
3. SendGrid sender identity verification
4. Twilio fresh setup
5. Squarespace DNS verification
6. Vercel env var updates

### Phase B — Code Fixes (Stream 1)
After new API keys are in Vercel:
1. Run Claude Code command
2. Verify all email sends work
3. Test signup welcome email
4. Test checkout confirmation emails

### Phase C — Documentation + n8n (Stream 3)
After code is fixed and emails work:
1. Create Google Sheets
2. Write all documentation
3. Start n8n workflow builds (12-day schedule)
4. Save everything to Google Drive

---

## DEPENDENCIES MAP

```
SendGrid API Key (Stream 2)
    ↓
Vercel Env Update (Stream 2)
    ↓
Claude Code Fixes (Stream 1)  ←  needs new API key in Vercel
    ↓
n8n Workflows (Stream 3)  ←  needs working email system
    ↓
Google Sheets (Stream 3)  ←  needed by n8n workflows
```

---

## SECURITY REMINDERS
- Never save actual API key values in Google Drive
- Only save variable names and where to find real keys
- Real keys go in .env and Vercel only
- n8n credentials stored in n8n only
- If you ever see an actual API key value — do not repeat it

---

*Master Router v1 | March 17, 2026 | Ryan Hallee, Founder*
