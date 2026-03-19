LEGACYLOOP — COMMAND TEMPLATE v8
Message Center Command 2 — UX Upgrade: Readability, Declutter, Senior-Friendly
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

LIGHT MODE RULE: All colors on theme-aware surfaces MUST use CSS variables.
NEVER hardcoded rgba(255,255,255,...) or #fff or #0a1929 on theme surfaces.

ELON MUSK STANDARD: Tesla Model S center console. Dense, informative, purposeful.
Every pixel earns its place. Clean lines. Effortless to understand.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 2 — VERIFICATION CHECKPOINT

Run BEFORE starting. If it fails — STOP. Report failure. Do NOT proceed.

  echo '=== CHECKPOINT ==='
  grep -n 'AI_PROVIDER|mock|demo|DEMO' lib/adapters/ai.ts | head -5
  grep 'OPENAI_API_KEY' .env | sed 's/=.*/=SET/'
  grep 'DEMO_MODE' .env | head -2
  npx tsc --noEmit 2>&1 | tail -3
  echo '=== CHECKPOINT COMPLETE ==='

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 3 — PERMANENTLY LOCKED FILES

ALL backend lib and API files — LOCKED.
ALL bot files, item dashboard, shipping, marketplace, etc — LOCKED.
globals.css, vercel.json, prisma/schema.prisma — LOCKED.

SURGICAL UNLOCK — These files are explicitly unlocked for THIS command ONLY:

app/messages/MessagesClient.tsx — UNLOCKED (UX improvements: declutter, readability, compose flow)
app/messages/page.tsx — UNLOCKED (fix remaining hardcoded colors on lines 76-78)
app/messages/MessagesAgentWrapper.tsx — UNLOCKED (adjust wrapper if needed)
app/components/messaging/WeeklyReportCard.tsx — UNLOCKED (make collapsible by default, tighter)
app/components/messaging/InboxCommandCenter.tsx — UNLOCKED (UX tweaks if needed)

All unlocked files return to LOCKED after approval.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 4-9 — [Same as all previous commands — design system, data collection,
build pattern, platform context, creative latitude, demo mode. All apply.]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

OBJECTIVE — Message Center UX Upgrade: Declutter, Readability, Professional

Command 1 fixed light mode colors, wired the Weekly Report, and improved layout
proportions. Command 2 is the UX polish pass that makes the Message Center
feel premium, clean, and easy to use — especially for older users.

PROBLEMS TO FIX:

1. BUYER MESSAGE BUBBLES: In light mode, buyer message text color is "#fff"
   (line 1003) which is white on a light ghost-bg background — INVISIBLE.
   Seller bubbles (teal gradient) are fine. Buyer bubbles need CSS variable text.

2. WEEKLY REPORT: Takes up valuable vertical space. Should start collapsed
   (not expanded). Show just the banner headline. User clicks "View Report"
   to expand.

3. COMPOSE FLOW: The "New Conversation" button opens a form that says "Log a
   buyer message" — confusing. This should say "New Conversation" consistently
   and feel like a proper compose experience.

4. AI TOOLS AREA: The templates + AI toolbar + suggestions panel stack takes
   up to 280px (line 1025 maxHeight). This pushes messages out of view.
   Reduce to 200px max and make the section feel tighter.

5. CONVERSATION LIST: Individual conversation cards could be slightly tighter
   with better font hierarchy. The selected state needs more visual distinction.

6. REMAINING HARDCODED COLORS: page.tsx lines 76-78 still have hardcoded
   #fff and rgba(207,216,220,0.6). Fix to CSS variables.

7. RIGHT SIDEBAR ITEM PREVIEW: The small 220px right sidebar in MessagesClient
   (line 1085) is redundant with the InboxCommandCenter right panel (260px).
   There are effectively TWO right panels. Remove the MessagesClient right
   sidebar — the InboxCommandCenter intelligence panel serves this purpose.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PART A — MANDATORY FULL READ

1. Read app/messages/MessagesClient.tsx — Focus on:
   - Line 1003: buyer bubble color: "#fff" (BROKEN in light mode)
   - Lines 1024-1046: AI tools zone (maxHeight 280px)
   - Lines 1083-1131: right sidebar (redundant with InboxCommandCenter)
   - Line 869: compose section header text
   - Lines 685-770: conversation card rendering

2. Read app/messages/page.tsx — Lines 74-78 (hardcoded colors)

3. Read app/components/messaging/WeeklyReportCard.tsx — Full file
   - Line 6: expanded state defaults to false (GOOD — already collapsed)
   - Verify the collapsed state shows just the headline

4. Read app/components/messaging/InboxCommandCenter.tsx — Full file
   - Lines 80-100: right intelligence panel (260px)
   - Confirm this panel already shows BuyerIntelligenceCard + NegotiationCoach

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PART B — Fix Buyer Message Bubble Text Color

File: app/messages/MessagesClient.tsx

Line 1003 — buyer message text is hardcoded "#fff" which is invisible in light mode.

BEFORE:
  color: isSeller ? "#000" : "#fff",

The buyer bubble background is "var(--ghost-bg)" (adaptive). The text must also adapt.

AFTER:
  color: isSeller ? "#fff" : "var(--text-primary)",

Also seller bubble text should be white (on teal gradient):
  color: isSeller ? "#fff" : "var(--text-primary)",

This ensures: seller messages = white text on teal gradient (always visible),
buyer messages = adaptive text on adaptive ghost background (visible in both modes).

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PART C — Fix page.tsx Hardcoded Colors

File: app/messages/page.tsx

Line 76 — BEFORE: color: "#fff"
AFTER: color: "var(--text-primary)"

Line 77 — BEFORE: color: "rgba(207,216,220,0.6)"
AFTER: color: "var(--text-muted)"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PART D — Remove Redundant Right Sidebar from MessagesClient

File: app/messages/MessagesClient.tsx

The MessagesClient has its own right sidebar (lines 1083-1131, width 220px)
showing item preview + bot risk warning. But the parent InboxCommandCenter
ALREADY has a right intelligence panel (260px) showing BuyerIntelligenceCard
+ NegotiationCoach. Having both creates two right panels that compete for space.

REMOVE lines 1083-1131 entirely (the right sidebar block). This gives the
thread area an extra 220px of width. The InboxCommandCenter intelligence
panel handles buyer info.

If the item preview (photo + title + "View item" link) is valuable, MOVE
it into the buyer header zone (line 946-965). Add the item photo thumbnail
and title as a compact element next to the buyer name — this keeps the item
context visible without a dedicated panel.

APPROACH: In the buyer header (ZONE 0, lines 946-965), add after the buyer info:

  {/* Item context */}
  <div style={{ display: "flex", alignItems: "center", gap: 8, marginLeft: "auto" }}>
    {selected.item.photos[0] && (
      <img
        src={selected.item.photos[0].filePath}
        alt=""
        style={{ width: 40, height: 40, borderRadius: 8, objectFit: "cover" }}
      />
    )}
    <div>
      <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-secondary)", maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {selected.item.title || "Item"}
      </div>
      <a href={`/items/${selected.item.id}`} style={{ fontSize: 10, color: "var(--accent)", textDecoration: "none" }}>
        View item →
      </a>
    </div>
  </div>

This is MUCH more compact than a 220px sidebar.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PART E — Tighten AI Tools Zone

File: app/messages/MessagesClient.tsx

Line 1025 — reduce maxHeight from 280px to 180px:

BEFORE: maxHeight: 280
AFTER: maxHeight: 180

Also reduce padding from "8px 16px" to "6px 12px" for the tools container.

The template buttons (line 1032) — reduce fontSize from 10 to 9, reduce
padding from "3px 10px" to "2px 8px". This makes them more compact.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PART F — Improve Compose Flow Text

File: app/messages/MessagesClient.tsx

Line 871 — BEFORE: "Log a buyer message"
AFTER: "New Conversation"

This matches the button text we changed in Command 1.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PART G — Improve Conversation List Selected State

File: app/messages/MessagesClient.tsx

The selected conversation card (around line 685-770) needs stronger visual
distinction. Find the isSelected styling and make the selected card stand out:

- Selected: background with teal tint: "rgba(0,188,212,0.08)"
- Selected: left border accent: borderLeft: "3px solid #00bcd4"
- Unselected: clean default appearance

This helps users immediately see which conversation is active.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 10 — VERIFICATION CHECKLIST

1. CHECKPOINT baseline: pass
2. All reads completed: yes / no
LIGHT MODE:
3. Buyer message bubble text uses var(--text-primary): yes / no
4. Buyer bubbles readable in light mode: yes / no
5. page.tsx hardcoded colors fixed: yes / no
DECLUTTER:
6. Redundant right sidebar removed from MessagesClient: yes / no
7. Item context moved to buyer header (compact): yes / no
8. Thread area has more horizontal space: yes / no
TIGHTER:
9. AI tools zone maxHeight reduced to 180px: yes / no
10. Template buttons more compact: yes / no
COMPOSE:
11. "Log a buyer message" → "New Conversation": yes / no
CONVERSATION LIST:
12. Selected state has visual distinction (teal accent): yes / no
FUNCTIONALITY:
13. Message sending still works: yes / no
14. AI toolbar still works: yes / no
15. Conversation selection still works: yes / no
16. Search/filter still works: yes / no
QUALITY:
17. Light mode: entire message center readable: yes / no
18. Dark mode: no regressions: yes / no
19. Overall feels cleaner and more professional: yes / no
N+1. All locked files untouched: yes / no
N+2. inline style={{}} throughout: yes / no
N+3. npx tsc --noEmit: 0 errors
N+4. npm run build: pass
N+5. CHECKPOINT post-change: pass

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 11 — REQUIRED REPORT FORMAT

CHECKPOINT before: [pass / issue]

Fix B — Buyer bubble text color: [fixed / issue]
Fix C — page.tsx hardcoded colors: [fixed / issue]
Fix D — Redundant right sidebar removed + item context in header: [fixed / issue]
Fix E — AI tools zone tightened: [fixed / issue]
Fix F — Compose flow text: [fixed / issue]
Fix G — Conversation list selected state: [fixed / issue]

SPACE RECOVERED: [estimate how much width the thread area gained]

LIGHT + DARK MODE: [Both clean]
ALL MESSAGE LOGIC UNTOUCHED: [Confirm]

FLAGS: [Any remaining issues]

Files modified: [list all]
Build: [pass / fail]
TypeScript: [0 errors / list]
CHECKPOINT after: [pass / issue]

IF POST-CHECKPOINT FAILS: REVERT IMMEDIATELY.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Command Template v8 | LegacyLoop | Message Center Command 2 — UX Upgrade
Approved: March 18, 2026 | Ryan Hallee, Founder
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
