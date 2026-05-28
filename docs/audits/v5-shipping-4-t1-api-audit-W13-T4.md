# V5 Shipping 4-T1 API Audit · W13-T4 Audit

**CMD-V5-SHIPPING-4-T1-API-AUDIT V20 LOW · Agent C agent-3 worktree (T4 canonical)**
**Date:** 2026-05-28 · **Wave 13 Lane T4**

> Class: Audit-doc only · ZERO live API probes · ZERO CEO keys requested
> Flag doc: ~/Downloads/skills/Flags/V5_SHIPPING_API_AUDIT.md
> W14 fire-list ready: 4 spec stubs banked

---

## §1 · Output

- Flag doc shipped: `V5_SHIPPING_API_AUDIT.md` · 4 T1 APIs classified
- 4 W14 spec stubs authored: USPS · UPS · FedEx · Pirate Ship
- ALL gated on CEO providing developer keys at W14 fire-time

## §2 · 4 T1 APIs Cataloged

| # | API | Host | Auth | Free Tier |
|---|-----|------|------|-----------|
| 1 | USPS Web Tools | `secure.shippingapis.com` | USERID query param | YES forever |
| 2 | UPS Rating | `onlinetools.ups.com` | OAuth 2.0 client_credentials | YES dev tier |
| 3 | FedEx Web Services | `apis.fedex.com` | OAuth 2.0 client_credentials | YES dev tier |
| 4 | Pirate Ship | `developer.pirateship.com` | API key Bearer | YES (CEO may have existing key) |

## §3 · HEAD Probe Results (2026-05-28)

```
USPS public landing:    HTTP 200 ✓
UPS developer portal:   HTTP 000 (TLS-unstable · matches Phase C §6.3 audit)
FedEx developer portal: HTTP 200 ✓
Pirate Ship docs paths: HTTP 404 / 000 (docs gated behind dev portal)
```

All 4 confirmed as T1 APIs per Phase C Legal Compendium §V5 SoT.

## §4 · CEO Actions Banked W14 Fire

- USPS USERID registration (~5 min · email)
- UPS app + OAuth creds (~10 min · browser required)
- FedEx app + OAuth creds (~10 min)
- Pirate Ship key verify reuse (LegacyLoop app already integrated) OR new dev tier

## §5 · Cron Slot Allocation (proposed)

| WF | API | Cron |
|----|-----|------|
| WF80 | USPS | `33 7 * * *` |
| WF81 | UPS | `34 7 * * *` |
| WF82 | FedEx | `35 7 * * *` |
| WF83 | Pirate Ship | `36 7 * * *` |

## §6 · Doctrine Sustained (existing only · ZERO NEW)

- BINDING #17 audit-first-wire (Phase C + public docs read pre-write)
- BINDING #28 drift catch (V5=0 baseline · 4 API hosts §6.3 SoT verified)
- BINDING #38 empirical-cite (host + auth from public docs + Phase C §V5)
- DOC-AUDIT-DOC-AUTONOMOUS-COMPLETE (W11-T1 + W12-T4 + W13-T4 sustained)
- DOC-MAX-LEGAL-ACCESS-LADDER #49 ratchet (4 T1 APIs replace HTML/PDF · +4 sources)
- Phase C Legal Compendium §V5 verbatim cited
- T4 canonical: Agent C = agent-3 (CEO direct)
- **ZERO new doctrines (CEO Rule 1 sustained)**

---

*Agent C · W13-T4 · HEAD 72e4cf8 · agent-3 worktree · 2026-05-28*
