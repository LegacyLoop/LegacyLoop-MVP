# ElevenLabs Product Audit · 2026-05-15

> **Cylinder:** CMD-ELEVENLABS-PRODUCT-AUDIT V20 v2.1 R29 · Wave 12 COMMAND 3 · audit-class
> **Track:** B · B2-W4b prep (pre-spec for forward Legacy-Loop Sylvia voice wire)
> **Status:** AUDIT-DOC · read-only · zero source edit · zero production touch
> **Authored:** 2026-05-15 PM · main worktree · IT-autonomous · Devin L2 spec · IT execute
> **WebFetch sources:** 5 ElevenLabs public docs · 2 LiteLLM docs · 1 Open WebUI homepage (limited)
> **Production state at fire:** main HEAD `bc41ac6` · dpl_dd036y2s9 Ready · /search 200/2.47s

---

## §0 · GROUND-STATE DRIFT CATCH (BINDING #28)

**Critical drift from spec §0.3:** Spec asserted `lib/elevenlabs/* ❌ DOES NOT EXIST · greenfield`. Empirical state contradicts:

```
lib/elevenlabs/generateNarration.ts  ← exists
lib/elevenlabs/voiceConfig.ts        ← exists
lib/video/pipeline.ts L5-6           ← imports both files
lib/video/pipeline.ts L114, L289-296 ← Step 4 narration via ElevenLabs TTS
lib/bots/skills/videobot/07-voice-direction-mastery.md ← 5 voice profiles documented
lib/bots/skills/videobot/01-elon-standard-videobot.md  ← voice direction methodology
```

**Finding:** ElevenLabs TTS is ALREADY WIRED into Legacy-Loop for VideoBot narration pipeline. Sylvia voice wire (B2-W4) does NOT start from greenfield — it inherits an existing integration substrate. B2-W4 spec authoring MUST audit `lib/elevenlabs/generateNarration.ts` patterns (auth · streaming · fallback · error handling) and clone canonical per BINDING #16 DELEGATE-CANONICAL.

**Inherited substrate informs §G recommendation below.**

---

## §A · ElevenLabs Product Family (5-surface enumeration)

Cited verbatim from https://elevenlabs.io/docs WebFetch 2026-05-15:

| Product | Description | Endpoint | Streaming | WebSocket |
|---|---|---|---|---|
| **Conversational AI** (ElevenAgents) | Real-time voice agents · customizable behaviors · knowledge bases · tool integrations · 70+ languages | `/eleven-agents/api-reference/agents/` | Yes · WebSocket bidirectional | ✅ Yes ("Agent WebSockets") |
| **Text-to-Speech** (ElevenAPI) | Text → lifelike audio · multiple voices · prosody control | `/v1/text-to-speech/{voice_id}` | Both: "Stream speech" chunked + "Create speech" sync | ✅ Yes ("Realtime TTS") |
| **Voice Cloning** | Speaker identity recreation from audio · IVC (Instant) + PVC (Professional) | `/v1/voices/{voice_id}/` | Blocking for creation · streaming via TTS post-clone | ❌ No dedicated WS |
| **Voice Design** | Synthetic voices from natural language prompts · parameter-based remixing | `/v1/text-to-voice/` | Blocking for design · streaming preview | ❌ No native WS |
| **Speech-to-Speech** (Voice Changer) | Audio→audio transform preserving emotion/timing | `/v1/speech-to-speech/{voice_id}` | Both: blocking + "Voice changer stream" chunked | ❌ HTTP only |

**Auth header (canonical · all endpoints):** `xi-api-key`

**Source URLs cited:**
- https://elevenlabs.io/docs/eleven-agents/overview.mdx (CAI overview)
- https://elevenlabs.io/docs/eleven-agents/api-reference/eleven-agents/websocket.mdx (Agent WS)
- https://elevenlabs.io/docs/eleven-api/guides/how-to/text-to-speech/streaming.mdx (TTS streaming)
- https://elevenlabs.io/docs/eleven-api/guides/how-to/websockets/realtime-tts.mdx (Realtime TTS WS)
- https://elevenlabs.io/docs/eleven-api/guides/how-to/voices/instant-voice-cloning.mdx (IVC)
- https://elevenlabs.io/docs/eleven-api/guides/how-to/voices/professional-voice-cloning.mdx (PVC)
- https://elevenlabs.io/docs/eleven-api/guides/how-to/voices/voice-design.mdx (Voice Design)
- https://elevenlabs.io/docs/api-reference/speech-to-speech/convert.mdx (Voice Changer)

---

## §B · Pricing per tier (live page · NOT training data)

Cited verbatim from https://elevenlabs.io/pricing WebFetch 2026-05-15:

| Tier | Monthly USD | Characters/month | Voice clone slots | Overage rate |
|---|---|---|---|---|
| **Free** | $0 | 10,000 | Not specified | Not cited |
| **Starter** | $6 | 30,000 | Not specified | Not cited |
| **Creator** ⭐ | $11 (first month $22 with 50% off) | 121,000 | Not specified | ~$0.18 per character |
| **Pro** | $99 | 600,000 | Not specified | ~$0.17 per character |
| **Scale** | $299 | 1,800,000 | 3 professional | ~$0.17 per character |
| **Business** | $990 | 6,000,000 | 10 professional | ~$0.17 per character |
| **Enterprise** | Custom | Custom | Variable | Not cited |

**Conversational AI minutes:** NOT itemized per tier on public pricing page. Surfaced as CEO route-question in §F. Likely separate per-minute billing OR Enterprise-only at fire-time.

### BINDING #25 Budget-Cap-20 projection

CEO cap: $20/day · $0.50/question default.

**Sylvia text-only daily usage scenarios** (assuming Sylvia speaks ~50 chars/response · 100 responses/day · 5000 chars/day):

| Tier | Daily cost vs cap | Verdict |
|---|---|---|
| Free (10K char/mo) | $0 · cap not breached but 50% of monthly budget burned in 1 day | 🟡 MARGINAL · 2-day budget |
| Starter (30K char/mo · $6) | ~$0.20/day amortized | 🟢 GREEN · 6-day budget |
| Creator (121K char/mo · $11) | ~$0.37/day amortized | 🟢 GREEN · 24-day budget |
| Pro (600K char/mo · $99) | ~$3.30/day amortized | 🟢 GREEN at low usage · breaches cap if voice-heavy |

**Verdict at projected text-volume:** Creator tier ($11/mo) is the sweet spot for Sylvia text-response volumes. Conversational AI per-minute rates unknown · MUST surface from CEO dashboard (§F).

---

## §C · Latency budgets (ChatGPT-class seamless conversational target)

| Surface | ElevenLabs claim | OpenAI Realtime baseline | Verdict |
|---|---|---|---|
| **Conversational AI turn latency** | "Sub-second responsiveness · natural real-time voice without awkward pauses" (https://elevenlabs.io/conversational-ai · NO ms number cited) | <800ms end-to-end typical | 🟡 NEED MEASUREMENT · marketing language only · audit cannot verify pre-wire |
| **Streaming TTS first-byte** | NOT documented on /docs/api-reference/text-to-speech overview page (excerpt limited) | <300ms typical (gpt-4o-mini-tts) | 🟡 PROBE NEEDED · check `eleven_turbo_v2_5` model card directly |
| **WebSocket Realtime TTS** | Cited as available · ms latency NOT public | n/a | 🟡 IMPLEMENTATION-MEASURED |

**Action:** B2-W4 spec MUST include latency probe step (CEO-side timing recording · stopwatch + sample dictation) before tier commitment.

---

## §D · Voice catalog + cloning + NAMESAKE ETHICS

### Catalog state (https://elevenlabs.io/voice-library WebFetch)

- **6 categories:** Advertisement · Characters & Animation · Conversational · Entertainment & TV · Informative & Educational · Narrative & Story
- **Total count:** "Hundreds of voices" cited · exact number NOT in public page excerpt (vendor claim elsewhere "10,000+ expressive voices")
- **Filters:** Use case · voice characteristics (age "elderly" · tone "energetic" · vocal traits "raspy") · professional roles (narrator · teacher · DJ · doctor) · emotional qualities (cheerful · serious · mysterious)
- **Gender/accent filters:** NOT explicitly surfaced as dedicated filters on browseable library page (drift catch · vendor may have these in app-side UI)
- **Free vs premium:** "Free to explore" sample browsing · "Premium features" gated behind sign-up for full library access + voice contributions

### Cloning options

| Method | Inputs | Time-to-clone | Quality |
|---|---|---|---|
| **IVC (Instant Voice Cloning)** | Few seconds of audio | Seconds | Good · production-usable |
| **PVC (Professional Voice Cloning)** | Hours of training audio | Hours · async pipeline | Best · indistinguishable from speaker |

### 🔴 NAMESAKE VOICE CONSIDERATION — Sylvia (CEO mother's namesake)

Three ethical paths surfaced for CEO routing:

1. **IVC of CEO's mother's voice** (if recordings exist)
   - Ethical weight: HIGH · honors namesake authentically · voice-of-the-dedicatee speaking the product
   - Risks: emotional weight on CEO · potential family preference required · permanent cloud-vendor copy
   - Recommended ONLY if CEO explicitly surfaces recordings + family consent context

2. **PVC of curated voice actress** matching mother's tonal range
   - Ethical weight: MEDIUM · respectful approximation · no direct family-voice cloning
   - Risk: voice-actor consent · ElevenLabs PVC requires voice provider authorization
   - Defensible default if Option 1 declined

3. **Library voice (no clone)** · pick existing voice matching profile (calm · senior-friendly · warm · 30-60 age range)
   - Ethical weight: LOW · zero cloning · standard licensed catalog use
   - Cost: lowest · zero PVC tier requirement
   - **Recommended default this audit · Option 1 contingent on explicit CEO surfacing**

**Doctrine candidate surfaced:** `DOC-NAMESAKE-VOICE-CONSENT` (1/5 NEW) — any cloning of CEO family voice requires explicit consent + documented routing + reversibility plan.

---

## §E · Integration shape vs Legacy-Loop substrate

### Existing integration (drift §0 critical finding)

`lib/elevenlabs/generateNarration.ts` + `voiceConfig.ts` ALREADY wire ElevenLabs TTS for VideoBot pipeline. Pattern likely:
- Direct ElevenLabs API key in `.env.sylvia` (verify presence-only · NEVER read)
- `generateNarrationWithFallback` exports fallback chain (likely OpenAI TTS fallback per L289-296 comment "ElevenLabs TTS with OpenAI fallback")
- 5 voice profiles documented in `lib/bots/skills/videobot/07-voice-direction-mastery.md`

**Sylvia voice wire (B2-W4) inherits this:**
- Clone auth+streaming+fallback pattern verbatim (BINDING #16)
- Add new voice profile for Sylvia (separate from VideoBot's 5)
- Likely add `lib/elevenlabs/realtimeStream.ts` for WS streaming TTS (NEW · alongside batch `generateNarration.ts`)

### Three integration options (audit verdict)

| Option | Architecture | Build cost | BINDING #10 compatibility | Verdict |
|---|---|---|---|---|
| **Option 1: Custom seam** · Sylvia chat UI → browser audio record → STT → text → LLM → ElevenLabs WS → audio playback | NEW substrate UI layer · highest control | HIGH (~3-5 cyls) | 🟢 GREEN (telemetry can route through `lib/sylvia/triage-router.ts`) | Build-up canonical for ChatGPT-class UX |
| **Option 2: LiteLLM-routed TTS** · `/v1/audio/speech` unified endpoint | LiteLLM Gateway already on port 4002 · YAML config add: `model_name: elevenlabs-tts · model: elevenlabs/...` | LOW (~1 cyl YAML edit + key) | 🟢 GREEN BEST (BINDING #10 telemetry-lock honored by design) | **Strongly preferred · canonical** |
| **Option 3: Open WebUI native** | UNRESOLVED — `docs.openwebui.com/features/audio` returned 404 · root docs do not surface voice features in public excerpt | UNKNOWN · likely requires manual plugin install | 🟡 verify-needed | Probe at B2-W4 fire-time |

### LiteLLM TTS support confirmed (https://docs.litellm.ai/docs/text_to_speech)

```yaml
model_list:
  - model_name: elevenlabs-tts
    litellm_params:
      model: elevenlabs/<voice-id>
      api_key: os.environ/ELEVENLABS_API_KEY
```

Endpoint: `POST http://0.0.0.0:4000/v1/audio/speech` (note: LiteLLM default port 4000 collides with Open WebUI · Legacy-Loop already runs LiteLLM on port 4002 per `com.legacyloop.litellm` launchctl daemon — verify port mapping at B2-W4 fire)

**Supported TTS providers in LiteLLM:** OpenAI · Azure OpenAI · Vertex AI · AWS Polly · ElevenLabs · MiniMax

### LiteLLM STT support (https://docs.litellm.ai/docs/audio_transcription)

Endpoint: `/v1/audio/transcriptions` · supported providers: OpenAI Whisper · Azure · Vertex AI · Gemini · Deepgram · Groq · Fireworks AI · OVHcloud AI Endpoints · Mistral Voxtral.

**🟡 NOTE: Neither Wispr Flow nor ElevenLabs STT in LiteLLM supported list.** B2-W4 STT layer needs separate handling:
- **Wispr Flow** = native macOS app (system-level keyboard hook · NOT API-via-LiteLLM-route · per P45 eval)
- **ElevenLabs STT** (if needed) routes via direct ElevenLabs API · NOT LiteLLM

**Architectural implication:** TTS goes LiteLLM-routed (Option 2 canonical). STT goes either Wispr Flow keyboard-input OR OpenAI Whisper (LiteLLM-routed) OR Deepgram (LiteLLM-routed). Recommended: Wispr Flow STT (already P45 GREEN-with-NOTE) + ElevenLabs TTS (LiteLLM-routed Option 2).

### Recommended architecture

**Option 2 + Wispr Flow STT (hybrid).**

```
CEO speaks → Wispr Flow macOS keyboard layer → text appears in Open WebUI input
  → Open WebUI sends to LiteLLM (port 4002) → LLM response
  → LiteLLM /v1/audio/speech routes to ElevenLabs TTS → audio stream
  → Open WebUI plays audio (verify native playback · §F)
```

Build cost: 1-2 cyls for LiteLLM TTS YAML add + ElevenLabs key install + Open WebUI audio playback wire-up.

---

## §F · 4 CEO route-questions (surface before B2-W4 spec authoring)

CEO must answer before B2-W4 spec-author kickoff:

1. **What tier currently?** (Free / Starter / Creator / Pro / Scale / Business / Enterprise)
2. **Daily character budget remaining** in dashboard (visible at https://elevenlabs.io/app/settings/usage)?
3. **Conversational AI minutes purchased separately** OR included in current tier?
4. **Voice slots used / available** (instant + professional)?

Plus optional ethics route (§D):
5. **Voice approach preference:** library voice (recommended default) · PVC actress · IVC mother's voice (consent-gated)?

Plus Open WebUI verify route (§E Option 3):
6. **Does CEO want me to verify Open WebUI native voice features** (manual probe in port 4000 admin panel · ~5 min) OR proceed Option 2 LiteLLM-route canonical?

---

## §G · Recommended product surface for B2-W4

### Architectural verdict

**ElevenLabs Streaming TTS via LiteLLM `/v1/audio/speech` route + Wispr Flow STT (existing CEO install).**

**Rationale:**
1. **BINDING #10 telemetry-lock honored by design** · LiteLLM dispatcher is canonical AI chokepoint
2. **Build cost LOW** · ~1-2 cyls (YAML config + key install + Open WebUI audio playback verify)
3. **Cost-controlled** · per-character billing at $0.17-0.18/char overage · Creator tier ($11/mo · 121K chars) covers expected Sylvia volumes
4. **Inherits existing pattern** · `lib/elevenlabs/generateNarration.ts` canonical clone target (BINDING #16)
5. **Wispr Flow STT already proven** · P45 GREEN-with-NOTE · 94% accuracy · existing macOS install
6. **NO need for full Conversational AI agent** · Sylvia's brain is already wired (Bridge §12 P58 GREEN identity · LiteLLM dispatcher) · ElevenLabs CAI would duplicate Sylvia identity layer

### NOT recommended (explicit)

- ❌ **ElevenLabs Conversational AI agent** · duplicates Sylvia identity stack · CEO already built Sylvia via Bridge cyl · agent-style framing would force re-wire of identity through ElevenLabs platform
- ❌ **Voice Cloning of mother's voice as default** · ethical weight requires explicit CEO surfacing (§D Option 1 · NEVER auto-decide)
- ❌ **Custom seam from scratch (§E Option 1)** · LiteLLM route gives 80% of value at 20% of build cost

### B2-W4 spec scope projection

- **Cyl count:** 2-3
  - **B2-W4a:** `CMD-LITELLM-ELEVENLABS-TTS-WIRE V20` · YAML config + key install + smoke (~30 min)
  - **B2-W4b:** `CMD-OPENWEBUI-VOICE-PLAYBACK V20` · verify or wire Open WebUI audio playback for TTS responses (~30-45 min)
  - **B2-W4c (conditional):** `CMD-SYLVIA-VOICE-PROFILE-PICK V20` · CEO routes from library catalog · IVC/PVC fallback (~30 min)
- **Runtime estimate:** 1.5-2 hours total · IT-autonomous · 2-3 CEO smoke gates (~5 min each)
- **CEO touchpoints:** 4 route-questions above (§F) + voice profile pick (§D Option 3) + smoke test (final dictation→Sylvia→TTS roundtrip)

---

## §H · Risks · doctrine candidates · gaps

### Risks

| Risk | Mitigation |
|---|---|
| Latency claims unverified (sub-second is marketing) | B2-W4 spec includes timing probe + stopwatch CEO-side · GREEN/REVISE gate |
| Conversational AI minutes pricing opaque | §F Q3 surfaces from CEO dashboard pre-spec |
| Open WebUI native voice playback unknown | §F Q6 surfaces · §E Option 3 verify-or-skip |
| ElevenLabs SDK churn 2024-2026 (CAI is new) | Pin SDK version · cite `lib/elevenlabs/generateNarration.ts` existing version |
| BINDING #25 budget breach if voice-heavy daily usage | Per-char $0.17-0.18 caps known · Creator tier $11/mo covers projected · monitor in CY-N audit |
| Speech-to-Speech (Voice Changer) accidentally chosen instead of TTS | Doc explicit · B2-W4 spec cites `/v1/text-to-speech` not `/v1/speech-to-speech` |

### Doctrine candidates surfaced (1/5 NEW each)

- **DOC-VOICE-PROVIDER-FALLBACK** (1/5 NEW) · primary TTS via LiteLLM-routed ElevenLabs · fallback chain: OpenAI TTS (already wired in `generateNarration.ts`) → Polly. Audit pattern from existing `generateNarrationWithFallback`
- **DOC-NAMESAKE-VOICE-CONSENT** (1/5 NEW) · any cloning of CEO family voice requires explicit consent + documented routing + reversibility plan + audit trail of recording source
- **DOC-LITELLM-CANONICAL-AUDIO-ROUTE** (1/5 NEW) · all production AI audio (STT + TTS where supported) routes via LiteLLM Gateway `/v1/audio/*` endpoints · NEVER direct provider HTTP from bots · sub-doctrine of BINDING #10

### Gaps surfaced

- WebFetch on `docs.openwebui.com/features/audio` returned 404 · audit cannot empirically confirm Open WebUI native voice support · NOTE band
- ElevenLabs Conversational AI minutes pricing not on public pricing page · CEO dashboard required
- Per-tier voice clone slot counts (Free/Starter/Creator/Pro) NOT explicitly listed · public page shows only Scale (3) + Business (10)
- Existing `lib/elevenlabs/generateNarration.ts` content NOT read in this audit · B2-W4 spec MUST read pre-fire (BINDING #17)

---

## §I · RIDER · CMD-WISPR-FLOW-API-AUDIT (silent-banked per G5)

Spec §6 rider candidate evaluated:

- G1 ≤5min ✅
- G2 disjoint ✅
- G3 from §N OPERATIONAL ✅
- G4 collision check: **Wispr Flow is macOS keyboard app · NOT an API** (per P45 eval verbatim · Wispr Flow has no public REST API for programmatic use). Rider scope evaporates · nothing to audit.
- G5 silent-bank: **BANKED** · rider cannot execute (no API surface to audit)

**Outcome:** Rider silent-banked per G5. Primary audit-doc ships clean.

---

## §J · Cross-references

- **Bridge cyl §12** (P58 · 2026-05-15 PM · 🟡 GREEN-WITH-NOTE) — Sylvia identity wired · prerequisite gate cleared
- **P45 Wispr Flow eval** — `docs/audits/WISPR_FLOW_EVAL_2026-05-14.md` · 94% accuracy GREEN-with-NOTE
- **Existing ElevenLabs integration** — `lib/elevenlabs/generateNarration.ts` · `lib/elevenlabs/voiceConfig.ts` · `lib/video/pipeline.ts` L5-6, L114, L289-296
- **VideoBot voice skills** — `lib/bots/skills/videobot/07-voice-direction-mastery.md` (5 voice profiles) · `lib/bots/skills/videobot/01-elon-standard-videobot.md`
- **Sylvia substrate** — `docs/sylvia/SYLVIA_FOLDER_ARCHITECTURE.md` · `docs/sylvia/SYLVIA_API_CONTRACT.md` · `lib/sylvia/triage-router.ts`
- **Doctrine ledger** — `docs/DOCTRINE_LEDGER.md` (32 BINDING · new candidates above)

---

*Authored 2026-05-15 PM · IT execute · Devin L2 spec · main worktree · audit-class · zero-commit (CEO routes commit separately if desired)*
