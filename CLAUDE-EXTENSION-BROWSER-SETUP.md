# LEGACYLOOP — CLAUDE EXTENSION BROWSER SETUP
## SendGrid + Twilio + Squarespace DNS + Vercel + n8n Credentials
### March 17, 2026

---

## WHAT THIS DOES

Browser-based setup tasks that require clicking through web UIs.
Run this BEFORE the Claude Code command — it generates the API keys
that the code needs.

---

## TASK 1 — SENDGRID DOMAIN AUTHENTICATION

### Current State
- Brand new SendGrid account
- Email: ryan@legacy-loop.com
- DNS records may exist from old account in Squarespace

### Steps

1. Go to https://app.sendgrid.com
2. Login with ryan@legacy-loop.com
3. Navigate: Settings → Sender Authentication → Authenticate Your Domain
4. Select DNS host: Squarespace (or "Other" if not listed)
5. Enter domain: legacy-loop.com
6. SendGrid will generate 3 DNS records:
   - em#### CNAME record (for link branding)
   - s1._domainkey CNAME record (DKIM signature 1)
   - s2._domainkey CNAME record (DKIM signature 2)
7. COMPARE these new values to existing Squarespace records:
   - Existing: em9448 CNAME → u60459729.wl230.sendgrid.net
   - Existing: s1._domainkey CNAME → (sendgrid domainkey)
   - Existing: s2._domainkey CNAME → (sendgrid domainkey)
8. If new values match existing — leave them, click Verify
9. If new values differ — update in Squarespace (see Task 5)
10. Click "Verify" in SendGrid
11. Wait up to 48 hours (usually 15 min)
12. Confirm status shows "Verified" with green checkmark

---

## TASK 2 — SENDGRID API KEY

### Steps

1. In SendGrid: Settings → API Keys → Create API Key
2. Name: **LegacyLoop Production March 2026**
3. Permissions — set EXACTLY:
   - Mail Send: **Full Access**
   - Template Engine: **Full Access**
   - Stats: **Read Access**
   - Suppression Management: **Full Access**
   - Everything else: **No Access**
4. Click Create & View
5. **COPY THE KEY IMMEDIATELY** — it is shown only once
6. Save to a secure local note temporarily
7. The key starts with "SG." followed by a long string
8. This key goes into:
   - `.env` file (via Claude Code)
   - Vercel environment variables (Task 6)
   - n8n credentials (Task 8)

**DO NOT save the actual key value in Google Drive.**

---

## TASK 3 — SENDGRID SENDER IDENTITIES

### Steps for EACH sender

Go to: Settings → Sender Authentication → Verify Single Sender

**Sender 1 — Primary Platform:**
- From Name: LegacyLoop
- From Email: hello@legacy-loop.com
- Reply To: support@legacy-loop.com
- Company: LegacyLoop LLC
- Click Create → Check hello@ inbox for verification email → Click Verify

**Sender 2 — Support:**
- From Name: LegacyLoop Support
- From Email: support@legacy-loop.com
- Reply To: support@legacy-loop.com
- Click Create → Check support@ inbox → Click Verify

**Sender 3 — Shipping:**
- From Name: LegacyLoop Shipping
- From Email: shipping@legacy-loop.com
- Reply To: shipping@legacy-loop.com
- Click Create → Check shipping@ inbox → Click Verify

**Sender 4 — Estate Services:**
- From Name: LegacyLoop Estates
- From Email: estates@legacy-loop.com
- Reply To: estates@legacy-loop.com
- Click Create → Check estates@ inbox → Click Verify

**Sender 5 — System/No-Reply:**
- From Name: LegacyLoop
- From Email: noreply@legacy-loop.com
- Reply To: support@legacy-loop.com
- Click Create → Check support@ inbox (noreply forwards to support) → Click Verify

**NOTE:** All verification emails arrive in Google Workspace. Check the corresponding mailbox for each sender. If noreply@ doesn't have its own inbox, set up a forwarding alias pointing to support@ first.

---

## TASK 4 — TWILIO FRESH SETUP

### Current State
- Twilio credentials exist in .env but may be from old account
- Used for SMS/OTP authentication
- Starting fresh

### Steps

1. Go to https://www.twilio.com/console
2. Login or create new account with ryan@legacy-loop.com
3. If existing account works — use it. If not — create new.
4. Dashboard → Get a Trial Number (or buy a number)
   - Area code preference: 207 (Maine) or 512 (existing) or toll-free
   - Must support: SMS, MMS
5. Note these THREE values:
   - **Account SID** (starts with AC...)
   - **Auth Token** (click to reveal)
   - **Phone Number** (the Twilio number, format: +1XXXXXXXXXX)
6. These go into .env:
   ```
   TWILIO_ACCOUNT_SID=AC...
   TWILIO_AUTH_TOKEN=...
   TWILIO_PHONE_NUMBER=+1...
   ```
7. Also update in Vercel (Task 6)

### Twilio SendGrid Connection
- Twilio owns SendGrid but they are SEPARATE products
- The SendGrid API key is NOT the same as Twilio Auth Token
- Keep them separate — they serve different purposes
- Twilio = SMS/Voice, SendGrid = Email

---

## TASK 5 — SQUARESPACE DNS VERIFICATION

### Steps

1. Go to https://domains.squarespace.com
2. Login → Select legacy-loop.com → DNS Settings → Custom Records
3. Verify these records exist and are correct:

**SendGrid Records (from Task 1):**
- em#### CNAME → (value from SendGrid)
- s1._domainkey CNAME → (value from SendGrid)
- s2._domainkey CNAME → (value from SendGrid)

**DMARC Record:**
- _dmarc TXT → v=DMARC1; p=none;
- If this doesn't exist, ADD IT
- This tells email servers how to handle unauth'd mail from your domain

**Google Workspace MX Records (should already exist):**
- MX 1 → ASPMX.L.GOOGLE.COM
- MX 5 → ALT1.ASPMX.L.GOOGLE.COM
- MX 5 → ALT2.ASPMX.L.GOOGLE.COM
- MX 10 → ALT3.ASPMX.L.GOOGLE.COM
- MX 10 → ALT4.ASPMX.L.GOOGLE.COM

**Google DKIM (if pending):**
- google._domainkey TXT → (value from Google Workspace admin)

**Webflow:**
- www CNAME → proxy-ssl.webflow.com

4. If any SendGrid values changed — update them
5. If DMARC doesn't exist — add it
6. Save all changes
7. Wait 15 minutes, then verify in SendGrid dashboard

---

## TASK 6 — VERCEL ENVIRONMENT VARIABLES

### Steps

1. Go to https://vercel.com
2. Login → Select LegacyLoop project
3. Settings → Environment Variables
4. Update or add these variables:

**Update existing:**
```
SENDGRID_API_KEY = [new key from Task 2]
```

**Add new:**
```
SENDGRID_FROM_EMAIL = hello@legacy-loop.com
SENDGRID_FROM_NAME = LegacyLoop
N8N_WEBHOOK_URL = [your n8n instance URL - add after n8n setup]
N8N_WEBHOOK_SECRET = [generate a random 32-char string]
```

**Update Twilio (if changed in Task 4):**
```
TWILIO_ACCOUNT_SID = [new value]
TWILIO_AUTH_TOKEN = [new value]
TWILIO_PHONE_NUMBER = [new value]
```

5. Set each variable for: Production, Preview, Development
6. Click Save for each
7. Go to Deployments → Click "..." on latest → Redeploy
8. Wait for deploy to complete
9. Verify: Visit legacy-loop.com — should load normally

---

## TASK 7 — GENERATE N8N WEBHOOK SECRET

For the n8n webhook endpoint security:

1. Generate a random secret string (32+ characters)
2. You can use: https://generate-secret.vercel.app/32
3. Or run in terminal: `openssl rand -base64 32`
4. Save this value in:
   - Vercel env vars as N8N_WEBHOOK_SECRET
   - n8n HTTP Request headers as x-webhook-secret
5. This prevents unauthorized calls to your webhook endpoint

---

## TASK 8 — N8N CREDENTIAL SETUP

### Steps

1. Go to your n8n instance (cloud trial or self-hosted)
2. Navigate to Credentials

**Credential 1 — SendGrid:**
- Type: SendGrid
- Name: LegacyLoop SendGrid
- API Key: [key from Task 2]
- Test connection → should show green checkmark

**Credential 2 — Gmail (for support@legacy-loop.com):**
- Type: Gmail OAuth2
- Name: LegacyLoop Support Gmail
- OAuth2 flow — login with support@legacy-loop.com Google Workspace account
- Grant: Read, Send, Modify permissions
- Note: May need to configure OAuth consent screen in Google Cloud Console first

**Credential 3 — Gmail (for hello@legacy-loop.com):**
- Type: Gmail OAuth2
- Name: LegacyLoop Hello Gmail
- Same OAuth2 flow with hello@legacy-loop.com

**Credential 4 — Gmail (for estates@legacy-loop.com):**
- Type: Gmail OAuth2
- Name: LegacyLoop Estates Gmail
- Same OAuth2 flow with estates@legacy-loop.com

**Credential 5 — Google Sheets:**
- Type: Google Sheets OAuth2
- Name: LegacyLoop Google Sheets
- OAuth2 flow — login with ryan@legacy-loop.com
- Grant: Read/Write access to Google Sheets

**Credential 6 — Google Drive:**
- Type: Google Drive OAuth2
- Name: LegacyLoop Google Drive
- OAuth2 flow — login with ryan@legacy-loop.com
- Grant: Read/Write access

**Credential 7 — Google Calendar:**
- Type: Google Calendar OAuth2
- Name: LegacyLoop Calendar
- OAuth2 flow — login with ryan@legacy-loop.com

**Credential 8 — OpenAI:**
- Type: OpenAI
- Name: LegacyLoop OpenAI
- API Key: [your OpenAI API key from .env]

**Credential 9 — HTTP Request (for LegacyLoop API):**
- Type: Header Auth
- Name: LegacyLoop API
- Header Name: x-webhook-secret
- Header Value: [N8N_WEBHOOK_SECRET from Task 7]

---

## TASK 9 — GOOGLE WORKSPACE EMAIL ALIASES

### Check/Create These Aliases

In Google Workspace Admin (admin.google.com):

1. Verify these email addresses exist as users or aliases:
   - ryan@legacy-loop.com — Primary (should exist)
   - support@legacy-loop.com — User or alias
   - hello@legacy-loop.com — User or alias
   - shipping@legacy-loop.com — Alias → support@
   - estates@legacy-loop.com — Alias → ryan@
   - investors@legacy-loop.com — Alias → ryan@
   - social@legacy-loop.com — Alias → ryan@
   - noreply@legacy-loop.com — Alias → support@

2. For each that doesn't exist:
   - Go to Users → select appropriate account → Account → Add alternate email
   - Or create as a group that forwards to the right person

---

## VERIFICATION CHECKLIST

After completing all tasks:

- [ ] SendGrid domain authentication: Verified (green)
- [ ] SendGrid API key: Created and saved securely
- [ ] SendGrid senders: All 5 verified (green)
- [ ] Twilio: Account active, phone number assigned
- [ ] Twilio: New credentials noted
- [ ] Squarespace DNS: All records verified correct
- [ ] Squarespace DNS: DMARC record exists
- [ ] Vercel: SENDGRID_API_KEY updated
- [ ] Vercel: SENDGRID_FROM_EMAIL added
- [ ] Vercel: SENDGRID_FROM_NAME added
- [ ] Vercel: N8N_WEBHOOK_SECRET added
- [ ] Vercel: Twilio vars updated (if changed)
- [ ] Vercel: Redeployed successfully
- [ ] n8n: SendGrid credential connected + tested
- [ ] n8n: Gmail credentials connected (support, hello, estates)
- [ ] n8n: Google Sheets credential connected
- [ ] n8n: Google Drive credential connected
- [ ] n8n: OpenAI credential connected
- [ ] Google Workspace: All email aliases confirmed

---

## ORDER OF OPERATIONS

1. SendGrid domain auth (Task 1) — start first, DNS takes time
2. While DNS propagates: Twilio setup (Task 4)
3. SendGrid API key (Task 2) — need for everything after
4. SendGrid sender verification (Task 3) — need verified domain first
5. Squarespace DNS check (Task 5) — verify all records
6. Vercel env update (Task 6) — need all keys ready
7. n8n credentials (Task 8) — need SendGrid key + Gmail OAuth
8. Google Workspace aliases (Task 9) — need for sender verification

---

*Browser Setup Command v1 | March 17, 2026 | Ryan Hallee, Founder*
