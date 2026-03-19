# LEGACYLOOP — COWORKER DELIVERABLES
## What Claude Coworker Handles (Documentation + Sheets + Guides)
### March 17, 2026

---

## OVERVIEW

After Browser Setup (Stream 2) and Code Fixes (Stream 1) are done,
Coworker creates all the supporting documentation and infrastructure.

Some deliverables can start in parallel with other streams.

---

## DELIVERABLE 1 — 7 Google Sheets for n8n Workflows

**Location:** Google Drive → 07 — Operations / Automation Workflows

### Sheet 1: Support Tickets
Columns: Date | Sender Email | Subject | Category | Urgency | Summary | Auto-Response Sent | Status | Notes

### Sheet 2: Lead Pipeline
Columns: Date | Name | Email | Source | Type | Urgency | Summary | Status | First Response | Follow-Up Sent | Last Contact | Notes

### Sheet 3: Estate Lead Pipeline
Columns: Date | Name | Email | Location | Estate Size | Timeline | Urgency | Status | Response Sent | Follow-Up Date | Ryan Notified | Notes

### Sheet 4: Investor CRM
Columns: Date Added | Name | Company | Email | Connection Type | Status | Initial Email Date | Follow-Up 1 | Follow-Up 2 | Reply Received | Notes | Next Action

### Sheet 5: Content Calendar
Columns: Date | Platform | Content Type | Caption | Hashtags | Image Description | Status (DRAFT/APPROVED/POSTED) | Posted Timestamp | Post URL

### Sheet 6: Uptime Log
Columns: Timestamp | Website Status | API Status | Response Time MS | Incident | Notes

### Sheet 7: Daily Briefings Log
Columns: Date | Sent | App Status | Revenue Yesterday | Urgent Emails | Notes

**After creating:** Save all sheet URLs to a reference doc in same folder.

---

## DELIVERABLE 2 — SendGrid Setup Guide (Google Doc)

**Location:** Google Drive → 07 — Operations / SOPs
**File:** SendGrid Setup Guide — March 2026

Contents:
- Domain authentication step-by-step (with Squarespace DNS)
- API key creation and permissions guide
- Sender identity setup (all 5 senders)
- Capacity planning calculations
- Upgrade timeline recommendations
- Based on actual Phase 1 code findings

---

## DELIVERABLE 3 — Email Templates Master (Google Doc)

**Location:** Google Drive → 05 — Marketing and Brand
**File:** Email Templates Master — March 2026

Contents:
- All 15 email templates with complete HTML
- For each: template name, from sender, subject lines (3 options), preview text, body, variables, CTA, trigger route
- Tone and voice guidelines
- Design system reference (dark premium theme specs)
- Based on actual code templates from Phase 1 audit

---

## DELIVERABLE 4 — n8n Complete Workflow Guide (Google Doc)

**Location:** Google Drive → 07 — Operations / Automation Workflows
**File:** n8n Workflow Guide — March 2026

Contents:
- All 10 workflows fully documented
- Each workflow: name, purpose, trigger, every node with config, connections, credentials, error handling, testing instructions
- Real API endpoints from the LegacyLoop codebase
- Real variable names from the codebase
- Google Sheet references for logging

---

## DELIVERABLE 5 — n8n 12-Day Build Schedule (Google Doc)

**Location:** Google Drive → 07 — Operations / Automation Workflows
**File:** n8n Build Schedule — March 2026

Contents:
- Day-by-day schedule for building all 10 workflows
- Priority order with reasoning
- Dependencies between workflows
- Testing checkpoints
- Export reminders (JSON backups)

---

## DELIVERABLE 6 — n8n Self-Host Guide (Google Doc)

**Location:** Google Drive → 07 — Operations / Automation Workflows
**File:** n8n Self-Host Guide — March 2026

Contents:
- DigitalOcean $6/mo droplet setup
- Docker installation and n8n deployment
- Subdomain setup (n8n.legacy-loop.com)
- SSL certificate configuration
- Workflow migration from cloud to self-hosted
- Credential reconnection checklist
- Weekly backup automation

---

## DELIVERABLE 7 — App Email Audit Report (Google Doc)

**Location:** Google Drive → 04 — Product / Tech Architecture
**File:** LegacyLoop Email Audit — March 2026

Contents:
- Complete Phase 1 findings
- Every email integration point mapped
- All 8 bugs identified with file paths
- All 9 gaps identified with complexity ratings
- Email design inconsistency analysis
- Security findings (.env.example keys)
- Prisma schema relevant models

---

## DELIVERABLE 8 — Surgical Code Change Map (Google Doc)

**Location:** Google Drive → 04 — Product / Tech Architecture
**File:** SendGrid Code Changes Brief — March 2026

Contents:
- Every code change needed, grouped by priority
- File path, function name, current value, new value
- Risk level for each change
- Estimated Claude Code time
- This is the reference doc for the Claude Code command

---

## DELIVERABLE 9 — Claude Code Ready Brief (Google Doc)

**Location:** Google Drive → 04 — Product / Tech Architecture
**File:** SendGrid Claude Code Brief — March 2026

Contents:
- The actual Claude Code command (copy of CLAUDE-CODE-EMAIL-SYSTEM-FIX.md)
- Ready to paste into Claude Code terminal
- Follows Command Template v8 format exactly

---

## DELIVERABLE 10 — SendGrid Capacity Planning (Google Doc)

**Location:** Google Drive → 07 — Operations / SOPs
**File:** SendGrid Capacity Plan — March 2026

Contents:
- Free tier analysis (100 emails/day)
- Daily email volume at 50, 100, 200, 500 users
- Per-user email calculation
- When LegacyLoop hits the 100/day cap
- Upgrade costs and timeline
- n8n workflow email budget tracker concept

---

## EXECUTION ORDER

### Can Start Now (parallel with other streams):
- Deliverable 1: Google Sheets (no dependencies)
- Deliverable 7: Email Audit Report (already have all findings)
- Deliverable 8: Code Change Map (already have all findings)
- Deliverable 10: Capacity Planning (calculation only)

### After Code Fixes Complete:
- Deliverable 2: SendGrid Setup Guide
- Deliverable 3: Email Templates Master
- Deliverable 9: Claude Code Ready Brief

### After All APIs Working:
- Deliverable 4: n8n Workflow Guide
- Deliverable 5: Build Schedule
- Deliverable 6: Self-Host Guide

---

## QUALITY STANDARD

Every document must be:
- Investor-ready
- Complete (no placeholders)
- Based on actual code findings (not generic)
- Saved to correct Google Drive folder
- Named with correct naming convention

---

*Coworker Deliverables v1 | March 17, 2026 | Ryan Hallee, Founder*
