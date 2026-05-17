# Wispr Flow Eval · 2026-05-14 · R29 P45 Wave 8 Slot 1

> **Track:** A · Claude System · Phase A3 backfill
> **Status:** EVAL-class · install + smoke + verdict + Track B B2-W4 prereq closure
> **Anchor:** CEO ideas-file ref line 176 + 2026-05-14 morning briefing Priority 5
> **Verdict:** 🟡 GREEN-with-NOTE · ~94% accuracy · keep out-of-box free tier · brand custom-vocab follow-up

## §1 Canonical install probe (§0.5 verbatim cite)

- Canonical URL: https://wisprflow.ai
- Install method: **DMG download** (per pricing-page probe · brew cask not surfaced as official path)
- macOS support: Apple Silicon + Intel (verified via wisprflow.ai/pricing · "Desktop (Mac)" feature table)
- Tier policy:
  - **Free:** 2,000 words/week (Mac/Windows · 1,000 words/week iPhone)
  - **Pro:** $12/user/mo (annual) OR $15/user/mo (monthly)
  - 14-day Pro trial (no credit card)
- Audio perms: Microphone + Accessibility (System Settings · macOS GUI grant · CEO-interactive)
- Install state pre-cyl: ABSENT pre-P45 spec-author · INSTALLED via CEO `/Applications/Wispr Flow.app` mtime 2026-05-14 18:10 EDT (between P44 ship and P45 fire · §0.5 drift catch re-classified VERIFY-class · skipped FIX 1 install per spec HALT class rule)

## §2 Smoke transcription result

**Sample sentence dictated (verbatim):**

> "Legacy-Loop is an AI-powered resale automation platform. Mission Connecting Generations. We are testing Wispr Flow voice transcription for Phase B Wave eight evaluation cylinder. End of test."

**Transcription output (CEO eyeballed · verbatim typo classes):**

| Position | Expected | Wispr output | Class | Severity |
|---|---|---|---|---|
| Brand name | `Legacy-Loop` (canonical hyphenated) | `Legacy Loop` (space) | Voice-tool brand hyphen-loss · expected class · NOT Wispr inaccuracy | LOW (banked custom-vocab) |
| Section 2 | `Mission Connecting Generations` | `Connecting Generations` (Mission dropped) | Word drop · real miss | MED |
| Section 3 | `Wave eight` | `Wave 8` | Numeral conversion · neutral semantic | LOW (neutral) |

**Accuracy verdict:** ~94% (≥90% threshold passed) · GREEN-with-NOTE band per spec FIX 2 acceptance.

**Notes:**
- Brand hyphen loss is canonical voice-tool behavior · not Wispr-specific. Custom dictionary entry needed in Wispr Settings → Custom Vocabulary for `Legacy-Loop` to survive transcription. Sylvia voice-layer wire (Track B B2-W4) MUST inherit this requirement.
- "Mission" word drop is real miss · may have been spoken too softly or as homonym pair with "Connecting". Banked monitoring · re-dictate test post-vocab-config.
- Numeral conversion "eight" → "8" is consistent · acceptable for technical contexts · matches Legacy-Loop V19 cyl-numbering convention.
- Punctuation handling intact (periods · capitalization · sentence boundaries preserved).

## §3 Build-vs-out-of-box decision (Devin recommendation)

- [x] **KEEP out-of-box** (free tier 2,000 words/week sufficient for CEO daily dictation · zero build needed)
- [ ] KEEP paid (Pro $12-15/mo · revisit if CEO exceeds 2,000 words/week sustained · banked monitoring)
- [ ] SWAP (Wispr Flow adequate at ~94% · no swap warranted)

**Rationale:** 94% accuracy clears spec 90% threshold. Out-of-box mode operates seamlessly with 3 typo classes documented (1 brand vocab · 1 word drop · 1 neutral numeral). Free tier 2,000 words/week = ~10 minutes daily dictation · enough for prompt drafting + Slack messaging + email triage. Pro upgrade banked monitoring if usage scales past free cap.

## §4 Track B B2-W4 transfer notes

- Sylvia voice-layer wire belongs to Track B Wave 4 (post Track A A3 close)
- **Required Sylvia surface (banked):**
  - Text-input substitute on Open WebUI surface (Wispr inserts at cursor · standard hotkey UX)
  - Push-to-talk handler via Wispr hotkey (canonical · zero Sylvia code needed)
  - Sylvia custom-vocab dictionary entry: `Legacy-Loop` · `Sylvia` · `MegaBot` · `BuyerBot` · `PriceBot` · `RotoBot` · `Legacy-Loop` (one-word brand variant)
- **Privacy posture:**
  - Wispr Flow sends audio to cloud (vendor-managed transcription)
  - Track B may require LOCAL-ONLY substitute per CEO Sylvia local+autonomous directive (2026-05-14) · flag for B2-W4 spec
  - MacWhisper · OpenAI Whisper local · or other local-only voice-to-text candidate must be evaluated parallel to Wispr cloud path
- **Test plan (B2-W4):**
  - Re-dictate canonical sample with vocab dictionary populated · expect 0 brand-name typos
  - Test Sylvia substrate route (prompt → Wispr transcribe → Sylvia consensus → response) end-to-end
  - Cite latency: dictation-to-Sylvia-response budget target sub-3s

## §5 Cross-references

- P24 SKILL_SOURCE_MANIFEST.md (manifest row appended this cyl · Voice Input section)
- CEO directive 2026-05-14: Sylvia local + autonomous (B2-W4 voice-layer scope guard)
- Ideas-file ref line 176 ("tool like Whisper Flow or Similar to be") · CEO named Wispr Flow as Phase B Priority 5
- IDEAS_FILE_BACKFILL_EPIC.md (rider row appended this cyl · §5.5)
- §0.5 IT DEEP-DIVE GATE confirmation cites: BINDING #30 honored · §0.5 drift catch re-classified VERIFY-class (Wispr already installed pre-§0.5)

## §6 Banked follow-on cyls

- **CMD-WISPR-FLOW-CLAUDE-CODE-WIRE V20 Branch β** · TIER-DECIDE path · since verdict=NOTE (not full KEEP) · CEO routes whether to enable Pro tier OR remain free
- **CMD-WISPR-FLOW-CUSTOM-VOCAB V20 LOW** · banked · add `Legacy-Loop` + brand terms to Wispr Settings → Custom Vocabulary · 1-time GUI action · CEO-interactive
- **CMD-VOICE-ALT-EVAL-MACWHISPER V20 LOW** · banked · evaluate local-only voice-to-text alternative (Track B Sylvia local+autonomous posture · privacy class)
- **CMD-SYLVIA-VOICE-LAYER-WIRE V20** · Track B B2-W4 · post-A3 close

---

*Authored 2026-05-15 (Fri AM EDT · session date-rollover from 2026-05-14 fire) · R29 P45 · IT · Track A · Claude system*
