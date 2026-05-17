# Sylvia AI Cost-Tier Routing · v1

**Cylinder:** CMD-SYLVIA-AI-ROUTER-V1 V20 v2.1 R29 P76
**Wave:** 19 Slot B KEYSTONE
**Date:** 2026-05-17
**Author:** Devin L2 spec · IT agent-1 worktree build
**Doctrine:** BINDING #10 single egress · #16 clone-not-modify · #17 audit-first-wire · #25 $0 spend v1 · #30 IT deep-dive · #34 widened cite · #35 spec-author deep-dive

---

## 1 · Architecture

Sylvia AI Router V1 is a **rule-based 3-tier cost classifier** that maps incoming task complexity to a tier (T1 local · T2 mid · T3 premium) and selects the cheapest capable alias within that tier. The router invokes `triageAndRoute()` (the canonical LiteLLM Gateway egress · BINDING #10 single chokepoint) with the chosen alias as a `forceAlias` hint.

ROOFlow concept ported: hierarchical cost-class routing baked directly into Sylvia substrate · ZERO `@claude-flow/cli` import in customer surface (BINDING #16 clones via custom-write rather than depend).

```
RouteTask → routeTask()
            ├── classifyComplexity (existing · triage-router.ts L121)
            ├── preClassifyPatternHint (existing · dispatcher/classify.ts L74 · P74)
            └── mapComplexityToTier → TIER_POLICIES[tier].aliases[0]
                                    → RouteDecision
                                    → appendEpisodic (telemetry · "triage" eventType)

routeAndDispatch → routeTask() + triageAndRoute(forceAlias=decision.chosenAlias)
                                                  └── LiteLLM Gateway egress (BINDING #10)
```

## 2 · Tier policy + cost ceilings

| Tier | Aliases (cheap-first) | Per-call ceiling | Per-session ceiling | Use case |
|---|---|---|---|---|
| **T1** | `llama-3.2-local` · `qwen-coder-2.5-local` · `deepseek-r1-local` | $0.001 | $0.02 | Simple tasks · greetings · short lookups · privacy-pinned · zero spend |
| **T2** | `gpt-4o-mini` · `gemini-2.5-flash` | $0.01 | $0.20 | Medium complexity · translations · summaries · sub-$0.01/call |
| **T3** | `claude-haiku-4-5` · `gemini-2.5-flash` · `grok-4` | $0.10 | $2.00 | Complex reasoning · code review · research · investor-grade output |

### Tier mapping rules (v1 rule-based)

| `classifyComplexity()` output | Tier | Rationale |
|---|---|---|
| `simple` | T1 | length < 200 chars · default | local Ollama · zero spend |
| `medium` | T2 | default bucket | sub-$0.01/call cloud |
| `complex` | T3 | code fences · `refactor`/`debug`/`architecture` keywords · length > 1500 | premium reasoning |
| `specialized` | T3 | `requiresLiveWeb` · research keywords | premium · Sonar variants chain via cascade |

### CEO override surface

- `RouteTask.forceTier` → skip auto-classify · pick cheap-first within forced tier
- `RouteTask.forceAlias` → bypass tier · pass through directly (tier inferred from alias for telemetry)

## 3 · Feature flag rollout · Phase 9.5 activation roadmap

`SYLVIA_ROUTER_ENABLED` env var · default OFF (empty) · ZERO production behavior delta v1.

### Phase 9.5 activation sequence

1. **Validation period (this fire → +7 days)** — local smoke + episodic telemetry capture · zero production exposure
2. **Preview activation** — `vercel env add SYLVIA_ROUTER_ENABLED 1 preview` · A/B router-ON vs router-OFF telemetry compare on preview deploys
3. **Production canary** — `vercel env add SYLVIA_ROUTER_ENABLED 1 production` · monitor cost delta + Truth Gate compatibility · rollback = unset env
4. **Full activation** — preserved as `1` · default sylvia chat handler consumes via `routeAndDispatch`

### Rollback path

Unset env var → `isRouterEnabled()` returns false → `routeAndDispatch` bypasses router → straight passthrough to `triageAndRoute` (zero behavioral delta · zero deploy required).

## 4 · Anthropic emphasis rationale (T3 default)

CEO directive 2026-05-16 PM: "Anthropic emphasis required."

T3 cascade order: `claude-haiku-4-5` first · `gemini-2.5-flash` second · `grok-4` third. Cascade only walks on Gateway failure (BINDING #21 cost-ceiling enforced pre-call · saves spend on bad classifications).

Investor framing: premium tier = investor-demo path. Claude-first preserves the "Christie's of resale" voice consistency across high-stakes routing (pricing · valuation · legal class).

## 5 · Pattern engine feedback loop (P74 consumer)

P74 `preClassifyPatternHint` (gated by `SYLVIA_PATTERN_HINT_ENABLED`) returns `{ hint?, confidence }` from `recognizePattern()` (semantic recall over past triage decisions).

Router consumes hint when `confidence >= 60` → overrides `classifyComplexity()` rule output → maps to tier. Fail-soft: pattern engine unavailable → silently proceeds with rule-only classification.

**Compounding moat:** every router decision emits `appendEpisodic({ eventType: "triage", payload: { router: "v1", tier, ... } })` → P72 episodic timeline accumulates routing decisions → pattern engine learns from accumulated decisions → future routing improves accuracy.

## 6 · Phase 9.9 vision · LLM-escalation when rules plateau

Banked: when rule-based + pattern-hint classification accuracy plateaus (measured via `appendEpisodic` telemetry vs human-route override frequency · `eventType: "human_route"`), Phase 9.9 introduces LLM-escalation classifier:

- Ambiguous classification (low confidence rule + low confidence pattern) → escalate to `gpt-4o-mini` for one-shot tier suggestion
- Per-question cost overhead ~$0.0002 (Haiku-classifier pattern from `classifyStakes`)
- Feature-flag gated separately (`SYLVIA_ROUTER_LLM_ESCALATION=1`)
- Budget cap per session enforced via existing `costCeilingPerSessionUsd`

---

## Carry-forward (banked Wave 17+)

- **LiteLLM model_list extension** — add GLM-4.6 · Qwen 2.5-VL · Llama 3.3 · Sonnet 4.5 · GPT 5.4 · Gemini 3.1 Pro → `litellm_config.yaml` + Vercel env credentials → extend `ModelAlias` union additively
- **Sylvia chat handler consumer** — wire `routeAndDispatch` into default chat turn path (post-validation period)
- **A/B telemetry compare** — router-ON vs router-OFF cost-per-question · proves $10/Haiku-test bleed killed structurally
- **Token-threshold routing** — current rules use complexity buckets · CEO directive added token-based thresholds (<500 = T1 · 500-2000 = T2 · >2000 = T3) banked as v1.1 refinement
- **`sylvia-ai.com` wire** — public Sylvia surface gated on router-validation complete
- **Phase 9.9 LLM-escalation** — see §6

---

## File inventory

| Path | Status | Purpose |
|---|---|---|
| `lib/sylvia/router-types.ts` | NEW · this cyl | Types · `Tier` · `TierPolicy` · `RouteDecision` · `RouteTask` |
| `lib/sylvia/router.ts` | NEW · this cyl | `routeTask` · `routeAndDispatch` · `getTierPolicies` · `TIER_POLICIES` |
| `lib/sylvia/triage-router.ts` | UNTOUCHED | Canonical egress · consumed via import (BINDING #16) |
| `lib/sylvia/types.ts` | UNTOUCHED this cyl | `ModelAlias` union extension BANKED Wave 17+ |
| `lib/sylvia/memory.ts` | UNTOUCHED | `appendEpisodic` consumed via import |
| `lib/sylvia/dispatcher/classify.ts` | UNTOUCHED | `preClassifyPatternHint` consumed via import |
| `.env.local` | APPENDED | `SYLVIA_ROUTER_ENABLED=` empty default |

---

**END · docs/sylvia/cost-tier-routing.md · v1**
