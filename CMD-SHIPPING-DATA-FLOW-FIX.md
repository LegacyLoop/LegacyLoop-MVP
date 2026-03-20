LEGACYLOOP — COMMAND TEMPLATE v9
Shipping Data Flow Fix — AI Dimensions → Quotes → Labels Must Flow Seamlessly
Updated: March 19, 2026 | Ryan Hallee, Founder | Use for EVERY Claude Code command

CRITICAL CONTEXT FROM RYAN:
"Once the item goes to sold, we're losing all the quote info, the box
information from either the customer adjusting it or the AI Auto Select.
Nothing is being captured. The transition is not smooth. Our quotes need
to be captured during the selling process. Item dims need to be remembered
and transfer and in sync in all areas. This is not an Elon Musk Approved TMS."

Copy this entire command into Claude Code. Never skip sections.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 1 — CRITICAL DESIGN DIRECTIVE

  All styles inline style={{}} — NO Tailwind. NO external CSS.
  LIGHT MODE RULE: All colors on theme-aware surfaces MUST use CSS variables.
  ELON MUSK STANDARD: This must feel like a $1B product. Real TMS quality.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 2 — VERIFICATION CHECKPOINT

  echo '=== CHECKPOINT ==='
  grep 'DEMO_MODE' .env | head -2
  npx tsc --noEmit 2>&1 | tail -3
  echo '--- Shipping estimate API ---'
  grep -n 'shippingWeight\|shippingLength\|estimateBox\|estimateWeight' app/api/shipping/estimate/route.ts | head -10
  echo '--- Shipping center client ---'
  grep -n 'startWizard\|generateLabel\|wizardData' app/shipping/ShippingCenterClient.tsx | head -10
  echo '=== CHECKPOINT COMPLETE ==='

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 3 — PERMANENTLY LOCKED FILES

ALL files locked EXCEPT:

SURGICAL UNLOCK:
  app/api/shipping/estimate/route.ts — UNLOCKED (use item's ACTUAL dims when available)
  app/api/shipping/center/route.ts — UNLOCKED (pass last shipping estimate data if saved)
  app/shipping/ShippingCenterClient.tsx — UNLOCKED (pre-fill wizard with ALL known data, auto-fetch estimate for Ready to Ship items)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTIONS 4-11 — Same as all previous commands. All features locked.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

OBJECTIVE — Fix the Shipping Data Flow End-to-End

THE PROBLEM:
  When a user analyzes an item, the AI generates shipping dimensions,
  weight, and packaging type. The user may also manually adjust these
  on the item dashboard. But when the item moves to SOLD and needs
  shipping, ALL of this data is lost:

  1. The shipping estimate API ignores the item's shippingLength/Width/Height
     and uses its own estimateBox() function based on weight alone.
  2. Quotes from the Pre-Sale tab are stored in React state only —
     they vanish on page refresh or status change.
  3. The Ready to Ship wizard doesn't auto-fetch a fresh estimate
     using the item's known dimensions.
  4. The Shipping Center doesn't show what the Item Dashboard shows.

THE FIX:
  1. Shipping estimate API: Use item's ACTUAL dimensions when they exist.
     Only fall back to estimateBox() when no dimensions are saved.
  2. Shipping Center: Auto-fetch estimates for Ready to Ship items on load,
     using their REAL dimensions. No manual "Get Quote" step needed.
  3. Ready to Ship wizard: Pre-fill EVERYTHING from the item's data +
     auto-fetched estimate. The user just confirms and generates label.

SURGICAL UNLOCK: 3 files

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PART A — MANDATORY FULL READ

1. Read app/api/shipping/estimate/route.ts — FULL (122 lines)
   Find: Line 69 — weight calculation (ignores item dims for box)
   Find: Line 70 — estimateBox(weight) used INSTEAD of item's actual L×W×H
   Find: Lines 80-98 — Shippo rate call uses estimateBox dimensions
   This is the ROOT CAUSE. Even when item has real dimensions, they're ignored.

2. Read app/api/shipping/center/route.ts — FULL (82 lines)
   Find: Lines 38-42 — item dimensions ARE passed through (good)
   Find: Lines 60-67 — readyToShip items include soldPrice, soldAt
   Verify: AI shipping profile is passed through (aiShipping field)

3. Read app/shipping/ShippingCenterClient.tsx — FULL file
   Find: ReadyToShipTab — startWizard function
   Find: How items are displayed in the Ready to Ship tab
   Find: Where estimates could be auto-fetched

Print ALL findings.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PART B — FIX SHIPPING ESTIMATE API TO USE REAL DIMENSIONS

File: app/api/shipping/estimate/route.ts

The API currently calculates box size from weight only (estimateBox).
Fix it to use the item's ACTUAL dimensions when they exist.

Change lines 69-73 from:

  const weight = (item as any).shippingWeight || estimateWeight(category);
  const box = estimateBox(weight);
  const isLTL = weight >= 40;
  const isFragile = ...;
  const fromZip = item.saleZip || "04101";

To:

  // Use item's actual dimensions if available, otherwise AI estimate, otherwise category fallback
  const itemWeight = (item as any).shippingWeight;
  const itemLength = (item as any).shippingLength;
  const itemWidth = (item as any).shippingWidth;
  const itemHeight = (item as any).shippingHeight;

  // AI shipping profile as secondary fallback
  const aiShip = aiData?.shipping_profile ?? aiData?.dimensions_estimate;
  const aiWeight = aiShip?.weight ?? aiShip?.estimated_weight;
  const aiLength = aiShip?.length ?? aiShip?.estimated_length;
  const aiWidth = aiShip?.width ?? aiShip?.estimated_width;
  const aiHeight = aiShip?.height ?? aiShip?.estimated_height;

  // Final values: item overrides → AI fallback → category estimate
  const weight = itemWeight ?? aiWeight ?? estimateWeight(category);
  const hasRealDims = (itemLength && itemWidth && itemHeight) ||
                      (aiLength && aiWidth && aiHeight);

  const box = hasRealDims
    ? {
        length: itemLength ?? aiLength,
        width: itemWidth ?? aiWidth,
        height: itemHeight ?? aiHeight,
        label: `${itemLength ?? aiLength}×${itemWidth ?? aiWidth}×${itemHeight ?? aiHeight} in`,
      }
    : estimateBox(weight);

  const isLTL = weight >= 40;
  const isFragile = (item as any).isFragile || /glass|ceramic|porcelain|crystal|china|mirror|antique/i.test(category + " " + (item.title || ""));
  const fromZip = item.saleZip || "04101";

Now Shippo gets the REAL dimensions when they exist.
Also update the Shippo call (lines 80-84) to use box.length, box.width, box.height.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PART C — AUTO-FETCH ESTIMATES FOR READY TO SHIP ITEMS

File: app/shipping/ShippingCenterClient.tsx

When items appear in the Ready to Ship tab, they already have dimensions
from the API (weight, length, width, height, aiShipping). Instead of
requiring the user to click "Ship" and go through a wizard, AUTO-FETCH
shipping estimates for each Ready to Ship item on tab load.

1. In the ReadyToShipTab component, add a useEffect that auto-fetches
   estimates for all items that have dimensions:

   useEffect(() => {
     items.forEach(item => {
       if (hasDims(item) && !autoEstimates[item.id]) {
         fetch("/api/shipping/estimate", {
           method: "POST",
           headers: { "Content-Type": "application/json" },
           body: JSON.stringify({ itemId: item.id }),
         })
         .then(r => r.json())
         .then(d => {
           if (!d.error) setAutoEstimates(prev => ({ ...prev, [item.id]: d }));
         })
         .catch(() => {});
       }
     });
   }, [items]);

   This gives every Ready to Ship item an instant quote without
   the user doing anything. The quote is ready when they click Ship.

2. When the wizard opens (startWizard), pre-fill from autoEstimate:

   function startWizard(item) {
     const est = autoEstimates[item.id];
     setWizardItem(item.id);
     setWizardStep(est ? 2 : 1); // Skip step 1 if we already have dims+estimate
     setWizardData({
       weight: est?.weight ?? item.weight ?? item.aiShipping?.weight ?? 5,
       length: est?.box?.length ?? item.length ?? item.aiShipping?.length ?? "",
       width: est?.box?.width ?? item.width ?? item.aiShipping?.width ?? "",
       height: est?.box?.height ?? item.height ?? item.aiShipping?.height ?? "",
       isFragile: est?.isFragile ?? item.isFragile ?? false,
       fromZip: est?.fromZip ?? "04101",
       toZip: "",
       carriers: est?.carriers ?? [],
       bestCarrier: est?.carriers?.[0] ?? null,
     });
   }

   If we have an auto-estimate, SKIP step 1 (confirm package) because
   the package is already confirmed. Go straight to step 2 (address).

3. Show the auto-estimate inline on each Ready to Ship item card:
   If autoEstimate exists:
     "📦 5 lbs · 18×14×10 in · USPS Priority from $8.95"
   This shows the user the quote is already ready.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PART D — IMPROVE THE READY TO SHIP WIZARD

Still in app/shipping/ShippingCenterClient.tsx

The wizard should feel like a TMS — everything pre-filled, user just confirms.

STEP 1 (Package Confirm):
  - Pre-filled from item data AND auto-estimate
  - Show: "AI suggested: 18×14×10 in · 5 lbs" above the editable fields
  - If item has user-set dimensions, show: "Your dimensions: 18×14×10 in"
  - If no dimensions at all, show warning and let them enter manually

STEP 2 (Address):
  - From ZIP: pre-filled from item.saleZip or "04101"
  - To ZIP: this is the only field the user MUST enter
  - After entering To ZIP, auto-fetch fresh carrier rates if not already fetched

STEP 3 (Confirm + Generate):
  - Show the FULL shipping summary from the estimate:
    Package: 18×14×10 in · 5 lbs · FRAGILE
    Route: 04901 → 10001
    Recommended: USPS Priority Mail · $8.95 · 2-3 days
    Also available: UPS Ground $12.40 · FedEx $11.80
  - Let user select a different carrier if they want
  - "Generate Label" uses the SELECTED carrier and REAL item data

The generateLabel function should use:
  - The REAL item weight (from estimate or wizard input)
  - The SELECTED carrier (not auto-selected by weight)
  - The REAL addresses
  - The REAL rate from the estimate

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PART E — SYNC PRE-SALE ESTIMATES TO READY TO SHIP

The PreSaleTab already fetches estimates and stores them in component state.
The ReadyToShipTab now auto-fetches. But what if the user got a quote in
PreSale and the item moved to SOLD?

The fix: Move the estimates state UP to the parent component
(ShippingCenterClient) so it's shared between tabs. When a PreSale estimate
is fetched, it persists even if the item moves tabs.

  In ShippingCenterClient:
    const [allEstimates, setAllEstimates] = useState<Record<string, any>>({});

  Pass to both tabs:
    <PreSaleTab items={data.preSale} estimates={allEstimates} onEstimate={(id, est) => setAllEstimates(prev => ({...prev, [id]: est}))} />
    <ReadyToShipTab items={data.readyToShip} estimates={allEstimates} onEstimate={...} onRefresh={fetchData} />

  This way estimates are shared and persist across tab changes.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

DO NOT CHANGE:
  — Shipping label API (locked)
  — ShippingPanel.tsx (item dashboard — locked)
  — Any other locked files
  — The Shippo integration logic (just fix what data it receives)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 12 — VERIFICATION CHECKLIST

  1. CHECKPOINT baseline: pass
  2. Full reads complete: yes / no

  ESTIMATE API:
  3. Uses item's shippingLength/Width/Height when available: yes / no
  4. Falls back to AI shipping profile: yes / no
  5. Falls back to estimateBox() only as last resort: yes / no
  6. Shippo receives real dimensions: yes / no

  READY TO SHIP:
  7. Auto-fetches estimates on tab load for items with dims: yes / no
  8. Shows inline estimate on each item card: yes / no
  9. Wizard pre-fills from auto-estimate: yes / no
  10. Wizard skips step 1 when estimate exists: yes / no

  WIZARD:
  11. Step 1 shows AI/user dimensions: yes / no
  12. Step 2 auto-fetches rates after entering buyer ZIP: yes / no
  13. Step 3 shows carrier options from real estimate: yes / no
  14. User can select different carrier: yes / no
  15. Generate label uses selected carrier + real data: yes / no

  ESTIMATE SHARING:
  16. Estimates state lives in parent component: yes / no
  17. Pre-Sale estimates carry to Ready to Ship: yes / no

  N+1. All locked files untouched: yes / no
  N+2. inline style={{}} throughout: yes / no
  N+3. npx tsc --noEmit: 0 errors
  N+4. npm run build: pass
  N+5. CHECKPOINT post-change: pass

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 13 — REQUIRED REPORT FORMAT

  CHECKPOINT before: [pass / issue]

  Part B — Estimate API uses real dims: [fixed / issue]
  Part C — Auto-fetch for Ready to Ship: [fixed / issue]
  Part D — Wizard pre-fill improvement: [fixed / issue]
  Part E — Shared estimate state: [fixed / issue]

  LIGHT MODE: [clean / issues]
  DARK MODE: [clean / issues]

  FLAGS FROM CLAUDE CODE:
  — [All gaps, risks, out-of-scope items]

  Files modified: [list — should be 3]
  Build: [pass / fail]
  TypeScript: [0 errors / list]
  CHECKPOINT after: [pass / issue]

  IF POST-CHECKPOINT FAILS: REVERT IMMEDIATELY.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Command Template v9 | LegacyLoop | Shipping Data Flow Fix
Updated March 19, 2026 | Ryan Hallee, Founder
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
