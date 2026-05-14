# Skill Source Manifest · LegacyLoop

> Canonical registry of every known open-source Claude Code skill / plugin / MCP / Obsidian plugin relevant to LegacyLoop. Single source of URL truth · prevents URL-gap HALTs (per DOC-VENDOR-CLAIM-VS-CANONICAL-URL doctrine · ratifying 2/5 post-P20).

**Maintained by:** Devin L1 spec author updates
**Created:** 2026-05-14 (Thu) · CMD-SKILL-SOURCE-MANIFEST V19 R29 P24
**Status:** Living doc · updates on every new skill discovery · install · WebFetch re-verify

---

## How to read

| Column | Meaning |
|---|---|
| Skill | canonical name |
| Source | URL verified via WebFetch (200) or YouTube ref if no GitHub surfaced |
| Type | plugin / skill / MCP / Obsidian plugin / paid pack / curated list / framework |
| Status | ✅ INSTALLED · 🟡 BANKED · 🔴 BROKEN · ⏸️ PAID-PENDING · 💡 UNKNOWN-URL · 📚 META |
| Install | exact command OR steps |
| Verified | date last WebFetch 200 OR install-state check |

---

## Token efficiency

| Skill | Source | Type | Status | Install | Verified |
|---|---|---|---|---|---|
| Caveman | https://github.com/JuliusBrussee/caveman | plugin | ✅ INSTALLED | marketplace `caveman@caveman` | 2026-05-14 |
| Cavemem | https://github.com/JuliusBrussee/cavemem | plugin | 🟡 BANKED | `claude plugin add github JuliusBrussee/cavemem` (untested) | 2026-05-14 list-view |
| Cavekit | https://github.com/JuliusBrussee/cavekit | plugin | 🟡 BANKED | `claude plugin add github JuliusBrussee/cavekit` (untested) | 2026-05-14 list-view |
| CodeBurn | ❓ URL not surfaced · same-author (JuliusBrussee) NOT findable · curated lists empty · ideas-file YouTube transcript only | plugin | 💡 UNKNOWN-URL · P20 HALT class | CEO comment-AI-agent funnel from Reference 7 YouTube creator OR alternate source | 2026-05-14 unresolved |

## Knowledge graphs

| Skill | Source | Type | Status | Install | Verified |
|---|---|---|---|---|---|
| Graphify | (CLI in `~/.local/bin/graphify` + skill `~/.claude/skills/graphify/SKILL.md`) | skill+CLI | ✅ INSTALLED | `pip install graphifyy` + `graphify install --platform claude` | 2026-05-14 |
| Seed | ❓ URL not in ideas file · Reference 6 YouTube comment-funnel | skill | 💡 UNKNOWN-URL | CEO comment-funnel from Reference 6 creator | 2026-05-14 unresolved |

## Memory layers

| Skill | Source | Type | Status | Install | Verified |
|---|---|---|---|---|---|
| @agentmemory/agentmemory | https://www.npmjs.com/package/@agentmemory/agentmemory | MCP | ✅ INSTALLED + smoked P8 GREEN | `claude mcp add agent-memory npx -y @agentmemory/agentmemory mcp` | 2026-05-14 |
| Cavemem | https://github.com/JuliusBrussee/cavemem | plugin | 🟡 BANKED | same as above | 2026-05-14 |
| Claude-mem | ❓ Reference 11 says 60K-star · URL not cited in ideas file | unknown | 💡 UNKNOWN-URL | CEO surfaces URL | 2026-05-14 unresolved |

## Code review + planning

| Skill | Source | Type | Status | Install | Verified |
|---|---|---|---|---|---|
| Paul | (skill loaded · 24 paul:* commands · author URL not surfaced) | skill | ✅ INSTALLED | local skill registry | 2026-05-14 |
| Superpowers | https://github.com/obra/superpowers | skill | 🟡 BANKED · banked-MED | `claude plugin add github obra/superpowers` | 2026-05-14 SF1 |
| GStack | https://github.com/garrytan/gstack | skill | 🟡 BANKED · banked-MED | `claude plugin add github garrytan/gstack` | 2026-05-14 SF1 |
| Agent Sandbox | https://github.com/disler/agent-sandbox-skill | skill | 🟡 BANKED · banked-LOW | `claude plugin add github disler/agent-sandbox-skill` | 2026-05-14 SF1 |

## Marketing

| Skill | Source | Type | Status | Install | Verified |
|---|---|---|---|---|---|
| Marketing Skills (37 skills) | https://github.com/coreyhaines31/marketingskills | skill pack | 🟡 BANKED · banked-MED | `claude plugin add github coreyhaines31/marketingskills` | 2026-05-14 SF1 |
| Claude SEO (19 sub-skills) | https://github.com/AgriciDaniel/claude-seo | skill pack | 🟡 BANKED · banked-LOW | `claude plugin add github AgriciDaniel/claude-seo` | 2026-05-14 SF1 |
| Bora's Skills Pack | https://github.com/boraoztunc/skills | skill pack | 🟡 BANKED · banked-LOW | `claude plugin add github boraoztunc/skills` | 2026-05-14 SF1 |
| AI Marketing Skills | https://github.com/BrianRWagner/ai-marketing-claude-code-skills | skill pack | 🟡 BANKED · banked-LOW | `claude plugin add github BrianRWagner/ai-marketing-claude-code-skills` | 2026-05-14 SF1 |
| Content Research Writer | https://github.com/ComposioHQ/awesome-claude-skills | skill (in list) | 🟡 BANKED · banked-LOW | via curated list | 2026-05-14 SF1 |

## Design + creative

| Skill | Source | Type | Status | Install | Verified |
|---|---|---|---|---|---|
| Designlang | (skill loaded · `designlang@designlang` marketplace) | plugin | ✅ INSTALLED | local marketplace | 2026-05-14 |
| Huashu-design | (skill loaded · 花叔Design) | skill | ✅ INSTALLED | local skill registry | 2026-05-14 |
| Frontend Design (Anthropic) | https://github.com/anthropics/skills/blob/main/skills/frontend-design/SKILL.md | skill | 🟡 BANKED · banked-MED | included in anthropics/skills meta-pack | 2026-05-14 SF1 |
| Apple HIG Designer | https://github.com/ComposioHQ/awesome-claude-skills | skill (in list) | 🟡 BANKED · banked-LOW | via curated list | 2026-05-14 SF1 |
| SwiftUI Design Skill | https://github.com/wholiver/swiftui-design-skill | skill | 🟡 BANKED · banked-LOW | `claude plugin add github wholiver/swiftui-design-skill` | 2026-05-14 SF1 |
| Architecture Diagram Generator | https://github.com/ComposioHQ/awesome-claude-skills | skill (in list) | 🟡 BANKED · banked-LOW | via curated list | 2026-05-14 SF1 |
| BFL Agent Skills (FLUX) | https://github.com/black-forest-labs/skills | skill pack | 🟡 BANKED · banked-LOW | `claude plugin add github black-forest-labs/skills` | 2026-05-14 SF1 |
| Remotion Best Practices | https://github.com/remotion-dev/skills | skill pack | 🟡 BANKED · banked-LOW · 117K/wk installs | `claude plugin add github remotion-dev/skills` | 2026-05-14 SF1 |
| Design Extract | ❓ Reference 7 YouTube transcript only · URL not cited | plugin | 💡 UNKNOWN-URL | CEO comment-funnel | 2026-05-14 unresolved |
| PixArt | ❓ Reference 2 YouTube transcript only · URL not cited · 130 creative models · Flux/Cling/VO | plugin | 💡 UNKNOWN-URL | CEO comment-funnel | 2026-05-14 unresolved |

## Browser automation

| Skill | Source | Type | Status | Install | Verified |
|---|---|---|---|---|---|
| Playwright | (loaded · `playwright@claude-plugins-official`) | plugin | ✅ INSTALLED | claude-plugins-official | 2026-05-14 |

## Multi-agent

| Skill | Source | Type | Status | Install | Verified |
|---|---|---|---|---|---|
| Ruflo | ❓ canonical URL not surfaced · Reference 3 spelled "Rofflow" (likely typo) · CEO `~/.claude/CLAUDE.md:10` cites `ruflo init` already-run | framework | ✅ INSTALLED (per CLAUDE.md L10-13 ruflo MCP integration) · 💡 URL unknown | `ruflo init` (already run) | 2026-05-14 install-confirmed-no-URL |
| Composio | https://composio.dev | SaaS integration · 850+ services | 🟡 BANKED · banked-LOW · OAuth gateway | sign-up at composio.dev | 2026-05-14 SF1 |
| Google Workspace CLI (gws) | https://github.com/googleworkspace/cli | CLI | 🟡 BANKED · banked-MED · Gmail/Drive/Calendar/Docs/Sheets | `claude plugin add github googleworkspace/cli` OR npm | 2026-05-14 SF1 |

## Vercel ecosystem

| Skill | Source | Type | Status | Install | Verified |
|---|---|---|---|---|---|
| Vercel plugin | (loaded · `vercel@claude-plugins-official`) | plugin | ✅ INSTALLED | claude-plugins-official | 2026-05-14 |

## Lead generation + research

| Skill | Source | Type | Status | Install | Verified |
|---|---|---|---|---|---|
| Lead Research Assistant | https://github.com/ComposioHQ/awesome-claude-skills | skill (in list) | 🟡 BANKED · banked-LOW | via curated list | 2026-05-14 SF1 |
| Apify lead scraping | (Reference 11 · use existing Apify API · `claude code` direct integration · no separate skill) | API pattern | ✅ PATTERN-READY · `lib/adapters/apify` already wired | call existing adapter | 2026-05-14 |

## Inference + experimentation

| Skill | Source | Type | Status | Install | Verified |
|---|---|---|---|---|---|
| AirLLM | (Reference 10 · run 70B models off SSD via layer-by-layer load · URL not in ideas file) | library | 💡 UNKNOWN-URL · banked-LOW · `pip install airllm` likely | research before install | 2026-05-14 unresolved |
| Subq SSA | (Reference 9 · pre-launch · weight-list only · not yet released) | research | 🟡 BANKED · monitor-only | wait for public release | 2026-05-14 unresolved |

## Curated lists (meta-resources)

| Skill | Source | Type | Status | Install | Verified |
|---|---|---|---|---|---|
| Anthropic Official Skills (16 skills · 277K+ installs) | https://github.com/anthropics/skills | meta-pack | 📚 META · 🟡 BANKED · banked-HIGH | `claude plugin add github anthropics/skills` | 2026-05-14 SF1 |
| Awesome Claude Skills (1200+ skills) | https://github.com/ComposioHQ/awesome-claude-skills | curated list | 📚 META · 🟡 REFERENCE-ONLY | browse · pick targets | 2026-05-14 SF1 |
| awesome-claude-code-plugins (JuliusBrussee curated) | https://github.com/JuliusBrussee/awesome-claude-code-plugins | curated list | 📚 META · 🟡 REFERENCE-ONLY | browse | 2026-05-14 |
| awesome-claude-plugins (JuliusBrussee curated) | https://github.com/JuliusBrussee/awesome-claude-plugins | curated list | 📚 META · 🟡 REFERENCE-ONLY | browse | 2026-05-14 |

## Workflow + ideation (CEO Reference 6 trio)

| Skill | Source | Type | Status | Install | Verified |
|---|---|---|---|---|---|
| Paul | (installed · see Code review + planning) | skill | ✅ INSTALLED | see above | 2026-05-14 |
| Graphify | (installed · see Knowledge graphs) | skill+CLI | ✅ INSTALLED | see above | 2026-05-14 |
| Seed | (Reference 6 YouTube · URL not cited) | skill | 💡 UNKNOWN-URL · banked-MED (CEO ideation-to-Paul stack) | CEO comment-funnel from Reference 6 creator | 2026-05-14 unresolved |

## Stack-of-platform (Sean Facer Reference SF2)

Not skills · CEO stack reference for context:

| Platform | URL | Role |
|---|---|---|
| Claude Code | https://claude.ai | builder |
| Supabase | https://supabase.com | backend (LegacyLoop uses Turso+Prisma instead · note for migration evaluation) |
| Vercel | https://vercel.com | deploy (✅ in use) |
| Next.js | https://nextjs.org | framework (✅ in use · 16.1.6) |
| ShadCN | https://shadcn-ui.com | UI components (banked evaluation) |
| Base44 | URL not provided | non-programmer alternative · banked reference |
| MCP | spec-protocol | tool comm (✅ in use · Claude MCP) |

## Paid packs (CEO-action gated)

| Pack | URL | Status | Pricing | CEO action |
|---|---|---|---|---|
| Brockster · "The Leaked Prompts Vault" | https://brockster6202.gumroad.com/l/lcumaw | ⏸️ PAID-PENDING | unknown (CEO confirms) | CEO confirms paid/free + downloads if pursued |
| RuFlow Setup Guide (Notion) | https://noocap.notion.site/RuFlow-Setup-Guide-Run-60-AI-Agents-Inside-Claude-Code-352508e99dda817d906deb0cd83e75d4 | 📚 META · CEO-side | free Notion guide · install commands inside | CEO reads · surfaces canonical Ruflo install URL if differs from `ruflo init` already-run |

---

## Doctrine ratification

This manifest sustains **DOC-VENDOR-CLAIM-VS-CANONICAL-URL** 2/5 (P20 HALT 1/5 + this ratify 2/5) · 3 more cites → BINDING #32 candidate.

Sub-doctrine of #28 DOC-AUDIT-DOC-DRIFT-CATCH. Establishes "YouTube transcript mentions ≠ canonical install URL · IT MUST locate verified GitHub URL pre-install OR HALT."

---

## URL-gap inventory (💡 UNKNOWN-URL)

These remain unresolved post-manifest · CEO surfaces canonical source · re-fire install cyl when URL lands:

1. **CodeBurn** — P20 HALT class · YouTube creator comment-funnel
2. **Seed** — Reference 6 trio · YouTube creator comment-funnel
3. **Design Extract** — Reference 7 · YouTube creator comment-funnel
4. **PixArt** — Reference 2 · YouTube creator comment-funnel
5. **Claude-mem** (60K-star) — Reference 11 · YouTube creator comment-funnel
6. **AirLLM** — Reference 10 · pip name likely `airllm` · IT verifies pre-install
7. **Subq SSA** — Reference 9 · pre-release · monitor-only

---

## Already-installed inventory (✅ status)

Cross-ref from `~/.claude/settings.json` `enabledPlugins` + local skill registry:

- **Plugins** (4): caveman · designlang · vercel · playwright
- **Marketplaces** (2): caveman · designlang
- **Skills** (loaded via SKILL.md): graphify · paul · ruflo · agent-memory (MCP) · designlang variants · vercel variants · caveman variants
- **MCP servers**: agent-memory · ruflo · plus Claude.ai-side hosted (Canva · Gmail · Calendar · Drive · Slack · Stripe · Vercel · Webflow · n8n)

---

## Sources catalogued

| Source | URL | Skill count |
|---|---|---|
| Sean Facer beehiiv · best-free-skills (SF1) | https://seanfacer.beehiiv.com/p/the-best-free-claude-code-skills-and-who-s-actually-building-them | 20 |
| Sean Facer beehiiv · stack-I-use (SF2) | https://seanfacer.beehiiv.com/p/i-keep-getting-asked-what-stack-i-use-here-it-is | 7 platforms |
| Brockster Gumroad | https://brockster6202.gumroad.com/l/lcumaw | ⏸️ PAID-PENDING |
| RuFlow Notion guide | https://noocap.notion.site/RuFlow-Setup-Guide-Run-60-AI-Agents-Inside-Claude-Code-352508e99dda817d906deb0cd83e75d4 | 📚 META · Notion-rendered (WebFetch JS-blind) |
| CEO ideas file | `~/Downloads/Claude Code & Sylvia AI Ideas (2).txt` (965 lines · 26+ references) | 12+ skills referenced |

---

## Maintenance

- After every new install cyl · update relevant row Status → ✅ INSTALLED + cite install date
- After every WebFetch 404 · mark row 🔴 URL-DEAD · find replacement OR re-classify 💡 UNKNOWN-URL
- After every CEO ideas-file update · sync new references
- Monthly cyclic URL re-verify (CY-N banked · catches dead links)
- Per-install: cite this manifest in §12 FLAGS standalone category

## Closes

- P20 HALT class · URL-gap pattern · prevents future "URL not findable" HALTs by canonicalizing every known skill source in one place.
- Unblocks Phase B priority 3 (Skill cherry-pick) · CEO + IT can now select from typed status (✅ / 🟡 / 💡 / ⏸️) without re-investigation.
- Unblocks CodeBurn refire if URL surfaces · row already reserved at top.
