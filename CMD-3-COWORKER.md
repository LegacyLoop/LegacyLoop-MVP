LEGACYLOOP — COWORKER COMMAND
Documentation + Google Sheets + n8n Workflow Guides
March 17, 2026

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CONTEXT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

This command runs AFTER CMD-1 (Chrome Extension)
and CMD-2 (Claude Code) are complete.

All credentials are live. All code fixes are deployed.
Now we need the operational infrastructure:
7 Google Sheets for n8n workflow logging, and
10 complete n8n workflow guides.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TASK 1 — CREATE 7 GOOGLE SHEETS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Save all sheets to Google Drive:
07 — Operations / Automation Workflows

Sheet 1: Support Tickets
Columns: Date | Sender Email | Subject | Category | Urgency | Summary | Auto-Response Sent | Status | Notes

Sheet 2: Lead Pipeline
Columns: Date | Name | Email | Source | Type | Urgency | Summary | Status | First Response | Follow-Up Sent | Last Contact | Notes

Sheet 3: Estate Lead Pipeline
Columns: Date | Name | Email | Location | Estate Size | Timeline | Urgency | Status | Response Sent | Follow-Up Date | Ryan Notified | Notes

Sheet 4: Investor CRM
Columns: Date Added | Name | Company | Email | Connection Type | Status | Initial Email Date | Follow-Up 1 | Follow-Up 2 | Reply Received | Notes | Next Action

Sheet 5: Content Calendar
Columns: Date | Platform | Content Type | Caption | Hashtags | Image Description | Status | Posted Timestamp | Post URL

Sheet 6: Uptime Log
Columns: Timestamp | Website Status | API Status | Response Time MS | Incident | Notes

Sheet 7: Daily Briefings Log
Columns: Date | Sent | App Status | Revenue Yesterday | Urgent Emails | Notes

After creating all 7: save a reference doc with all sheet URLs.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TASK 2 — N8N WORKFLOW GUIDES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Write complete documentation for all 10 n8n workflows.
Save to Google Drive: 07 — Operations / Automation Workflows
File: n8n Workflow Guide — March 2026

Each workflow must include:
- Name and number
- What it does (2 sentences)
- What problem it solves
- Trigger node type and settings
- Every node in sequence with exact config
- All credentials needed
- Which Google Sheet it logs to
- Error handling
- Testing instructions
- Export reminder

Workflows to document:
1. New User Welcome Sequence
2. Support Ticket System
3. Lead Capture and Follow-Up
4. Daily Business Briefing
5. Social Media Auto-Post
6. Investor Follow-Up System
7. Estate Lead Pipeline
8. Weekly Business Report
9. Content Approval Pipeline
10. Uptime and Error Monitor

Use real API endpoints from the LegacyLoop codebase.
Use real variable names from the code audit.
Reference the actual Google Sheets from Task 1.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TASK 3 — BUILD SCHEDULE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Save to Google Drive: 07 — Operations / Automation Workflows
File: n8n Build Schedule — March 2026

12-day schedule:
Day 1-2: Workflow 1 (Welcome) — already in progress
Day 3-4: Workflows 4 (Briefing) + 10 (Uptime)
Day 5-6: Workflows 2 (Support) + 3 (Leads)
Day 7-8: Workflows 6 (Investor) + 7 (Estate)
Day 9-10: Workflows 8 (Weekly Report) + 5 (Social)
Day 11-12: Workflow 9 (Content) + full testing + JSON export

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TASK 4 — SELF-HOST GUIDE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Save to Google Drive: 07 — Operations / Automation Workflows
File: n8n Self-Host Guide — March 2026

Complete guide for migrating n8n to DigitalOcean:
- Create $6/mo droplet (Ubuntu 22.04, 1GB RAM, NYC datacenter)
- Install Docker and n8n
- Set up n8n.legacy-loop.com subdomain
- Configure SSL with Certbot
- Import all workflow JSON before trial ends
- Reconnect all credentials
- Set up weekly backup automation

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TASK 5 — SENDGRID CAPACITY PLAN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Save to Google Drive: 07 — Operations / SOPs
File: SendGrid Capacity Plan — March 2026

Calculate daily email volume at 50, 100, 200, 500 users.
Per active user per day: 1 notification + 0.5 transactional + 0.2 marketing.
When does LegacyLoop hit 100/day free tier limit?
What does Essentials plan cost?
When should Ryan budget for it?

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TASK 6 — EMAIL AUDIT REPORT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Save to Google Drive: 04 — Product / Tech Architecture
File: LegacyLoop Email Audit — March 2026

Complete Phase 1 findings in professional format:
- Every email integration point mapped
- All bugs found with file paths
- All gaps identified
- What was fixed in CMD-2
- What remains for future development

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
QUALITY STANDARD
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Every document: investor-ready, complete, no placeholders.
Based on actual code findings, not generic advice.
Saved to correct Google Drive folder with correct naming.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Coworker Command v1
LegacyLoop | March 17, 2026
Ryan Hallee, Founder
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
