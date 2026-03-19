LEGACYLOOP — CHROME EXTENSION COMMAND
Twilio + SendGrid + DNS + Vercel Credential Setup
March 17, 2026

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CONTEXT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Company: LegacyLoop
Founder: Ryan Hallee
Domain: legacy-loop.com
Email accounts: Google Workspace on legacy-loop.com

All previous Twilio and SendGrid credentials are DEAD.
Both are brand new accounts starting from zero.
Ryan has Twilio console open now — fresh trial account with $15.50.
Ryan has n8n open with 13 days left on trial — old SendGrid key needs replacing.

The goal: Get all new credentials created and placed into:
1. The LegacyLoop .env file
2. Vercel environment variables
3. n8n credential store

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TASK 1 — TWILIO: GET ACCOUNT CREDENTIALS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Ryan is on the Twilio console dashboard right now.
URL: https://console.twilio.com

Step 1: Click "Account Dashboard" in the left sidebar
Step 2: Find "Account Info" section on the dashboard
Step 3: Copy the Account SID (starts with AC)
Step 4: Click the eye icon to reveal Auth Token, copy it
Step 5: Save both values — these are needed for .env

The Account SID should look like: AC followed by 32 hex characters
The Auth Token should be: 32 hex characters

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TASK 2 — TWILIO: GET A PHONE NUMBER
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Step 1: In left sidebar click "Phone Numbers" → "Manage" → "Buy a number"
Step 2: Search for a number:
   Country: United States
   Capabilities: SMS (checked), MMS (checked)
   Number type: Local or Toll-Free
   Area code preference: 207 (Maine) if available
Step 3: Click "Buy" on the number you want
Step 4: Confirm the purchase (uses trial credit)
Step 5: Copy the full phone number in format: +1XXXXXXXXXX

If 207 area codes are not available, try toll-free (800/888/877).
Trial accounts can send SMS to verified numbers only.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TASK 3 — TWILIO: VERIFY RYAN'S PHONE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Trial accounts can only send SMS to verified phone numbers.

Step 1: Go to Phone Numbers → Manage → Verified Caller IDs
Step 2: Click "Add a new Caller ID"
Step 3: Enter Ryan's personal phone number
Step 4: Choose verification method (text or call)
Step 5: Enter the verification code
Step 6: Confirm verified status

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TASK 4 — TWILIO: CONFIGURE MESSAGING SERVICE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Step 1: In left sidebar click "Messaging" → "Services"
Step 2: Click "Create Messaging Service"
Step 3: Service name: LegacyLoop
Step 4: Use case: "Notifications"
Step 5: Click "Create"
Step 6: Add your phone number from Task 2 as a sender
Step 7: Complete the setup wizard

This messaging service is what LegacyLoop uses for:
- OTP verification codes
- SMS login
- Shipping notifications

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TASK 5 — SENDGRID: CREATE NEW API KEY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Step 1: Go to https://app.sendgrid.com
Step 2: Login with ryan@legacy-loop.com
Step 3: Navigate: Settings → API Keys
Step 4: Click "Create API Key"
Step 5: Name: LegacyLoop Production March 2026
Step 6: Set permissions:
   Mail Send: Full Access
   Template Engine: Full Access
   Suppressions: Full Access
   Stats: Read Access
   Everything else: No Access
Step 7: Click "Create & View"
Step 8: COPY THE KEY IMMEDIATELY — shown only once
   The key starts with SG. followed by a long string
Step 9: Save to secure local note

This key goes into: .env, Vercel, and n8n

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TASK 6 — SENDGRID: AUTHENTICATE DOMAIN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Step 1: In SendGrid: Settings → Sender Authentication
Step 2: Click "Authenticate Your Domain"
Step 3: DNS host: select "Squarespace" or "Other"
Step 4: Domain: legacy-loop.com
Step 5: SendGrid generates 3 DNS records — write them down:
   em#### CNAME → [value]
   s1._domainkey CNAME → [value]
   s2._domainkey CNAME → [value]
Step 6: Go to Squarespace DNS (Task 8) to add/update these
Step 7: Come back and click "Verify"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TASK 7 — SENDGRID: VERIFY SENDER IDENTITIES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Settings → Sender Authentication → Verify Single Sender

Create and verify EACH of these 5 senders:

Sender 1:
   From Name: LegacyLoop
   From Email: hello@legacy-loop.com
   Reply To: support@legacy-loop.com
   → Create → Check hello@ inbox → Click verify link

Sender 2:
   From Name: LegacyLoop Support
   From Email: support@legacy-loop.com
   Reply To: support@legacy-loop.com
   → Create → Check support@ inbox → Click verify link

Sender 3:
   From Name: LegacyLoop Shipping
   From Email: shipping@legacy-loop.com
   Reply To: shipping@legacy-loop.com
   → Create → Check shipping@ inbox → Click verify link

Sender 4:
   From Name: LegacyLoop Estates
   From Email: estates@legacy-loop.com
   Reply To: estates@legacy-loop.com
   → Create → Check estates@ inbox → Click verify link

Sender 5:
   From Name: LegacyLoop
   From Email: noreply@legacy-loop.com
   Reply To: support@legacy-loop.com
   → Create → Check support@ inbox → Click verify link

NOTE: If any of these email addresses don't exist
in Google Workspace yet, go to admin.google.com
first and create them as aliases or groups.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TASK 8 — SQUARESPACE: UPDATE DNS RECORDS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Step 1: Go to https://domains.squarespace.com
Step 2: Login → Select legacy-loop.com
Step 3: DNS Settings → Custom Records

Check and update these SendGrid records:
   em#### CNAME → [new value from Task 6]
   s1._domainkey CNAME → [new value from Task 6]
   s2._domainkey CNAME → [new value from Task 6]

If old records exist with different values:
   Delete the old ones, add the new ones

Verify DMARC record exists:
   _dmarc TXT → v=DMARC1; p=none;
   If missing → Add it

Leave these alone (should already exist):
   Google Workspace MX records (5 records)
   www CNAME → proxy-ssl.webflow.com
   google._domainkey TXT record

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TASK 9 — VERCEL: UPDATE ENVIRONMENT VARIABLES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Step 1: Go to https://vercel.com
Step 2: Login → Select LegacyLoop project
Step 3: Settings → Environment Variables

REPLACE these (delete old, add new):
   TWILIO_ACCOUNT_SID = [new value from Task 1]
   TWILIO_AUTH_TOKEN = [new value from Task 1]
   TWILIO_PHONE_NUMBER = [new value from Task 2]
   SENDGRID_API_KEY = [new value from Task 5]

UPDATE this:
   SENDGRID_FROM_EMAIL = hello@legacy-loop.com

ADD these new:
   SENDGRID_FROM_NAME = LegacyLoop
   N8N_WEBHOOK_URL = [Ryan's n8n instance URL]
   N8N_WEBHOOK_SECRET = [generate: openssl rand -base64 32]

Set each variable for: Production + Preview + Development
Click Save after each one.

Step 4: Deployments → Redeploy latest

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TASK 10 — N8N: REPLACE SENDGRID CREDENTIAL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Ryan has the SendGrid credential modal open in n8n.
The current API key is from the old dead account.

Step 1: Clear the current API Key field
Step 2: Paste the NEW SendGrid API key from Task 5
Step 3: Allowed HTTP Request Domains: keep "All"
Step 4: Click "Save"
Step 5: Test by running the Send Welcome Email node

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TASK 11 — N8N: ADD ALL OTHER CREDENTIALS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Go to n8n Settings → Credentials → Add Credential

Credential 1 — Gmail (support@legacy-loop.com):
   Type: Gmail OAuth2
   Name: LegacyLoop Support Gmail
   OAuth2 login with support@legacy-loop.com
   Permissions: Read, Send, Modify

Credential 2 — Gmail (hello@legacy-loop.com):
   Type: Gmail OAuth2
   Name: LegacyLoop Hello Gmail
   OAuth2 login with hello@legacy-loop.com

Credential 3 — Gmail (estates@legacy-loop.com):
   Type: Gmail OAuth2
   Name: LegacyLoop Estates Gmail
   OAuth2 login with estates@legacy-loop.com

Credential 4 — Google Sheets:
   Type: Google Sheets OAuth2
   Name: LegacyLoop Sheets
   OAuth2 login with ryan@legacy-loop.com
   Permissions: Read/Write

Credential 5 — Google Drive:
   Type: Google Drive OAuth2
   Name: LegacyLoop Drive
   OAuth2 login with ryan@legacy-loop.com

Credential 6 — Google Calendar:
   Type: Google Calendar OAuth2
   Name: LegacyLoop Calendar
   OAuth2 login with ryan@legacy-loop.com

Credential 7 — OpenAI:
   Type: OpenAI
   Name: LegacyLoop OpenAI
   API Key: [OpenAI key from .env]

Credential 8 — HTTP Header Auth (for LegacyLoop API callbacks):
   Type: Header Auth
   Name: LegacyLoop Webhook Auth
   Header Name: x-webhook-secret
   Header Value: [same N8N_WEBHOOK_SECRET from Task 9]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
COMPLETION CHECKLIST
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[ ] Twilio Account SID copied
[ ] Twilio Auth Token copied
[ ] Twilio phone number purchased
[ ] Twilio Ryan's phone verified
[ ] Twilio messaging service created
[ ] SendGrid API key created and copied
[ ] SendGrid domain authentication started
[ ] SendGrid 5 sender identities verified
[ ] Squarespace DNS records updated
[ ] Squarespace DMARC record confirmed
[ ] Vercel: TWILIO_ACCOUNT_SID updated
[ ] Vercel: TWILIO_AUTH_TOKEN updated
[ ] Vercel: TWILIO_PHONE_NUMBER updated
[ ] Vercel: SENDGRID_API_KEY updated
[ ] Vercel: SENDGRID_FROM_EMAIL updated
[ ] Vercel: SENDGRID_FROM_NAME added
[ ] Vercel: N8N_WEBHOOK_URL added
[ ] Vercel: N8N_WEBHOOK_SECRET added
[ ] Vercel: Redeployed
[ ] n8n: SendGrid key replaced
[ ] n8n: Gmail credentials added (3)
[ ] n8n: Google Sheets credential added
[ ] n8n: Google Drive credential added
[ ] n8n: Google Calendar credential added
[ ] n8n: OpenAI credential added
[ ] n8n: HTTP Header Auth credential added

After all checked:
Give the new credential values to Ryan
so he can pass them to Claude Code for
the .env update (CMD-2).

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Chrome Extension Command v1
LegacyLoop | March 17, 2026
Ryan Hallee, Founder
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
