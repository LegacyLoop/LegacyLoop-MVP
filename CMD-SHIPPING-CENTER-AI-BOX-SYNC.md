LEGACYLOOP — COMMAND TEMPLATE v9
Shipping Center — Pull AI Box Recommendations + Saved Shipping Details
Updated: March 19, 2026 | Ryan Hallee, Founder | Use for EVERY Claude Code command

CRITICAL CONTEXT: The Item Dashboard ShippingPanel (3,508 lines) shows AI-suggested
box sizes (Tiny, Small, Medium, Large, XL, Oversized, Furniture, Custom), packaging
type (Box, Envelope, Tube, Crate, Pallet), weight estimates, fragile detection,
carrier rate tables, and packing tips. Users can also manually edit dimensions and
click "Save Shipping Details" which saves to the Item model.

The Shipping Center page currently shows basic dimensions but does NOT show:
- The AI-recommended box size name and description
- The packaging type the user selected
- The packing tips from the AI
- The carrier rates that were already fetched on the ShipBot page

This command fixes that by enriching the Shipping Center to show ALL the data
that the Item Dashboard ShippingPanel already shows.

Copy this entire command into Claude Code. Never skip sections.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 1 — CRITICAL DESIGN DIRECTIVE

  All styles inline style={{}} — NO Tailwind. NO external CSS.
  LIGHT MODE RULE: All colors on theme-aware surfaces MUST use CSS variables.
  ELON MUSK STANDARD: Real TMS quality. FedEx Ship Manager meets Tesla UI.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 2 — VERIFICATION CHECKPOINT

  echo '=== CHECKPOINT ==='
  grep 'DEMO_MODE' .env | head -2
  npx tsc --noEmit 2>&1 | tail -3
  echo '--- ShipBot page data ---'
  grep -n 'BOX_PRESETS\|boxSize\|packaging\|packagingType\|FRAGILE\|aiSuggested\|suggestion' app/items/\[id\]/ShippingPanel.tsx | head -15
  echo '--- Shipping center ---'
  wc -l app/shipping/ShippingCenterClient.tsx
  echo '--- API ---'
  wc -l app/api/shipping/center/route.ts
  echo '=== CHECKPOINT COMPLETE ==='

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 3 — PERMANENTLY LOCKED FILES

ALL files locked EXCEPT:

SURGICAL UNLOCK:
  app/api/shipping/center/route.ts — UNLOCKED (enrich response with AI box recommendation data)
  app/shipping/ShippingCenterClient.tsx — UNLOCKED (display AI box recommendations, packaging type, packing tips)

All other files LOCKED including ShippingPanel.tsx (READ ONLY for understanding).

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTIONS 4-11 — Same as all previous commands. All features locked.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

OBJECTIVE — Make the Shipping Center show the SAME data as the Item Dashboard

The Shipping Center must mirror what the ShipBot/ShippingPanel shows.
When a user looks at an item in the Shipping Center, they should see:
  1. The AI-recommended box size (Small 10×8×4, Medium 14×12×8, etc.)
  2. The packaging type (Box, Envelope, Tube, Crate, Pallet)
  3. Whether the item is fragile
  4. The AI-estimated weight
  5. Packing tips from the AI analysis
  6. Any saved/custom dimensions the user set

SURGICAL UNLOCK: 2 files

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PART A — MANDATORY FULL READ

1. Read app/items/[id]/ShippingPanel.tsx — Lines 1-100 + Lines 2350-2500
   Find: BOX_PRESETS constant — all box sizes with dimensions and descriptions
   Find: How AI suggestion maps to box size (aiSuggestedKey)
   Find: How savedShipping reads from item (shippingWeight, shippingLength, etc.)
   Find: packaging types (Box, Envelope, Tube, Crate, Pallet)
   Find: How the "Save Shipping Details" button saves data

2. Read app/api/shipping/center/route.ts — FULL (82 lines)
   Find: What fields are currently returned per item
   Find: How AI data is extracted (aiShipping field)

3. Read app/shipping/ShippingCenterClient.tsx — Lines 100-140 (ShipProfile component)
   Find: How dimensions are currently displayed
   This is where we need to show more data.

Print ALL findings.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PART B — ENRICH THE SHIPPING CENTER API

File: app/api/shipping/center/route.ts

The API already returns shippingWeight/Length/Width/Height and aiShipping.
ADD these additional fields to the base object for each item:

  1. Extract the AI shipping suggestion from aiResult rawJson more completely:
     Look for: shipping_profile, dimensions_estimate, packaging_suggestion,
     suggested_box, box_recommendation, shipping_suggestion

     Extract:
       - boxName: The recommended box size name (e.g., "Small", "Medium", "Large")
       - boxDescription: Description of the box (e.g., "Guitar pedals, small electronics")
       - packagingType: "box" | "envelope" | "tube" | "crate" | "pallet"
       - packagingTips: Array of packing tip strings
       - aiWeightEstimate: The AI's weight estimate (may differ from saved weight)

     Example extraction:
       const aiBox = aiShipping?.recommended_box ?? aiShipping?.box_size ?? aiShipping?.box_recommendation;
       const aiPackaging = aiShipping?.packaging_type ?? aiShipping?.packaging ?? "box";
       const aiTips = aiShipping?.packing_tips ?? aiShipping?.tips ?? [];

  2. Add a "shippingProfileComplete" boolean:
     True if the item has saved dimensions (shippingWeight AND shippingLength set).
     This tells the Shipping Center whether the user has confirmed their shipping details.

  3. Add to the base object:
     aiBoxName: typeof aiBox === "string" ? aiBox : null,
     aiBoxDescription: aiShipping?.box_description ?? null,
     packagingType: aiPackaging,
     packagingTips: Array.isArray(aiTips) ? aiTips : [],
     aiWeightEstimate: aiShipping?.weight ?? aiShipping?.estimated_weight ?? null,
     shippingProfileComplete: !!((item as any).shippingWeight && (item as any).shippingLength),
     shippingPreference: (item as any).shippingPreference ?? "BUYER_PAYS",

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PART C — UPGRADE ShipProfile COMPONENT

File: app/shipping/ShippingCenterClient.tsx

The ShipProfile component (around line 102-117) currently shows basic
dimensions and fragile badge. Upgrade it to show the FULL shipping profile:

Replace the ShipProfile component with a richer version:

  function ShipProfile({ item, expanded }: { item: any; expanded?: boolean }) {
    const d = dimStr(item);
    const w = weightStr(item);
    const hasProfile = d || w;
    const complete = item.shippingProfileComplete;

    if (!hasProfile) return (
      <div style={{ fontSize: "0.68rem", color: "#ff9800", display: "flex", alignItems: "center", gap: "0.25rem" }}>
        ⚠️ No shipping profile — <Link href={`/items/${item.id}`} style={{ color: "var(--accent)", textDecoration: "none", fontWeight: 600 }}>set up shipping</Link>
      </div>
    );

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "0.15rem" }}>
        {/* Main shipping line */}
        <div style={{ fontSize: "0.68rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "0.4rem", flexWrap: "wrap" }}>
          <span>📦 {[d, w].filter(Boolean).join(" · ")}</span>
          {item.isFragile && <span style={{ fontSize: "0.6rem", fontWeight: 700, padding: "1px 5px", borderRadius: "9999px", background: "rgba(245,158,11,0.12)", color: "#f59e0b" }}>⚠️ FRAGILE</span>}
          {complete && <span style={{ fontSize: "0.55rem", fontWeight: 600, padding: "1px 4px", borderRadius: "9999px", background: "rgba(76,175,80,0.12)", color: "#4caf50" }}>✓ Saved</span>}
          {!complete && hasProfile && <span style={{ fontSize: "0.55rem", fontWeight: 600, padding: "1px 4px", borderRadius: "9999px", background: "rgba(245,158,11,0.08)", color: "#f59e0b" }}>AI Est.</span>}
        </div>

        {/* AI box recommendation (if available) */}
        {expanded && item.aiBoxName && (
          <div style={{ fontSize: "0.62rem", color: "var(--text-muted)" }}>
            📦 AI recommends: <strong style={{ color: "var(--text-secondary)" }}>{item.aiBoxName}</strong>
            {item.aiBoxDescription && <span> — {item.aiBoxDescription}</span>}
          </div>
        )}

        {/* Packaging type (if available) */}
        {expanded && item.packagingType && item.packagingType !== "box" && (
          <div style={{ fontSize: "0.62rem", color: "var(--text-muted)" }}>
            📋 Packaging: {item.packagingType.charAt(0).toUpperCase() + item.packagingType.slice(1)}
          </div>
        )}

        {/* Category */}
        {item.category && (
          <div style={{ fontSize: "0.6rem", color: "var(--text-muted)" }}>
            🏷️ {item.category}
          </div>
        )}
      </div>
    );
  }

Then pass expanded={true} from the PreSaleTab and ReadyToShipTab to show
the full profile, and expanded={false} (or omit) from the ShippedTab
for a compact view.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PART D — SHOW PACKING TIPS IN PRE-SALE AND READY TO SHIP

In the PreSaleTab and ReadyToShipTab, when an item has packagingTips
from the AI, show them below the carrier rates:

  {item.packagingTips?.length > 0 && (
    <div style={{
      marginTop: "0.5rem",
      padding: "0.5rem 0.75rem",
      borderRadius: "0.5rem",
      background: "rgba(0,188,212,0.04)",
      border: "1px solid rgba(0,188,212,0.1)",
      fontSize: "0.68rem",
      color: "var(--text-muted)",
    }}>
      <div style={{ fontWeight: 700, color: "var(--accent)", fontSize: "0.6rem", marginBottom: "0.25rem", textTransform: "uppercase", letterSpacing: "0.06em" }}>
        Packing Tips
      </div>
      {item.packagingTips.map((tip: string, i: number) => (
        <div key={i} style={{ lineHeight: 1.4, marginTop: i > 0 ? "0.15rem" : 0 }}>
          • {tip}
        </div>
      ))}
    </div>
  )}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PART E — SHOW "SAVED" vs "AI ESTIMATE" INDICATOR

In every item display across the Shipping Center, make it clear whether
the shipping dimensions come from:
  1. User-saved data (green "✓ Saved" badge) — the user confirmed their shipping details
  2. AI estimate (amber "AI Est." badge) — still just an estimate, not confirmed

This uses the `shippingProfileComplete` boolean from the API.

When shippingProfileComplete is false and the item is in Ready to Ship,
show a prominent warning:
  "⚠️ Shipping details not confirmed — review dimensions before generating label"
  with a link to the item dashboard to set up shipping.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

DO NOT CHANGE:
  — ShippingPanel.tsx (READ ONLY)
  — Shipping label/estimate/rates APIs (locked)
  — Any other locked files

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 12 — VERIFICATION CHECKLIST

  1. CHECKPOINT baseline: pass
  2. Full reads complete: yes / no

  API ENRICHMENT:
  3. aiBoxName extracted from AI data: yes / no
  4. aiBoxDescription extracted: yes / no
  5. packagingType extracted: yes / no
  6. packagingTips extracted: yes / no
  7. shippingProfileComplete boolean added: yes / no
  8. shippingPreference added: yes / no

  SHIPPING CENTER:
  9. ShipProfile shows AI box recommendation: yes / no
  10. ShipProfile shows packaging type: yes / no
  11. ShipProfile shows "Saved" vs "AI Est." badge: yes / no
  12. Packing tips shown in PreSale tab: yes / no
  13. Packing tips shown in ReadyToShip tab: yes / no
  14. Warning for unconfirmed shipping on Ready to Ship items: yes / no

  N+1. All locked files untouched: yes / no
  N+2. inline style={{}} throughout: yes / no
  N+3. npx tsc --noEmit: 0 errors
  N+4. npm run build: pass
  N+5. CHECKPOINT post-change: pass

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 13 — REQUIRED REPORT FORMAT

  CHECKPOINT before: [pass / issue]

  Part B — API enrichment: [fixed / issue]
  Part C — ShipProfile upgrade: [fixed / issue]
  Part D — Packing tips display: [fixed / issue]
  Part E — Saved vs AI indicator: [fixed / issue]

  Files modified: [list — should be 2]
  Build: [pass / fail]
  TypeScript: [0 errors / list]
  CHECKPOINT after: [pass / issue]

  IF POST-CHECKPOINT FAILS: REVERT IMMEDIATELY.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Command Template v9 | LegacyLoop | Shipping Center AI Box Sync
Updated March 19, 2026 | Ryan Hallee, Founder
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
