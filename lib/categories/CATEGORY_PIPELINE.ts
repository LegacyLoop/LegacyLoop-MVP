/**
 * CATEGORY_PIPELINE · per-category panel registry · CMD-CYLINDER-6-DASHBOARD-STANDARDIZATION
 *
 * Single source of truth for "which bot panel renders for which item context."
 * Replaces the inline `isAntique`/`isCollectible`/`isVehicle` derivations and
 * panel show/hide gates scattered through `app/items/[id]/ItemDashboardPanels.tsx`.
 *
 * Registry adoption is incremental: panels can be migrated to consume this
 * registry one at a time. The first migrations target whole-panel show/hide
 * gates (e.g., CarBotPanel's `if (!isVehicle) return null`, AntiqueEvalPanel's
 * `if (!isAntiqueItem && !hasData) return null`). Intra-component layout
 * ternaries (e.g., MegaBotPanel's 8-way `botType === "X" ? ... : ...` chains)
 * stay component-local — those are layout choices, not gating decisions.
 *
 * Pure data + pure functions · no React imports · no JSX · no side effects.
 */

export type CategoryKey =
  | "antique"
  | "collectible"
  | "vehicle"
  | "outdoor_equipment"
  | "general";

export type PanelName =
  | "MegaBot"
  | "PriceBot"
  | "BuyerBot"
  | "ReconBot"
  | "ListBot"
  | "AntiqueBot"
  | "CollectiblesBot"
  | "CarBot"
  | "PhotoBot"
  | "VideoBot";

/**
 * CategoryContext · derived flags consumed by registry conditions.
 * Pass to `deriveCategoryContext()` once per render; subsequent gate checks
 * read from the result rather than re-deriving inline.
 */
export interface CategoryContext {
  category?: string | null;
  isAntique: boolean;
  isCollectible: boolean;
  isVehicle: boolean;
  isOutdoorEquipment: boolean;
  hasAnalysis: boolean;
  hasMegaBot: boolean;
  detection?: { isCollectible?: boolean; category?: string } | null;
  antique?: { isAntique?: boolean } | null;
  aiData?: any;
}

export interface PanelEntry {
  /** Component key matched to PANEL_REGISTRY in the consumer */
  panel: PanelName;
  /** Render condition · evaluated by `getActivePanels()` */
  show: (ctx: CategoryContext) => boolean;
  /** Optional category-specific props passed through to the panel component */
  props?: Record<string, unknown>;
  /**
   * Auto-fire enabled · panel uses useAutoBotRefresh hook.
   * Note: enabling auto-fire across many panels simultaneously can spike
   * background `/api/analyze` calls on first page load. Stagger via
   * sessionStorage circuit-breaker keys (per-bot · per-item).
   */
  autoFire?: boolean;
}

const VEHICLE_KEYWORDS = [
  "vehicle",
  "car",
  "truck",
  "motorcycle",
  "rv",
  "atv",
  "boat",
];

const OUTDOOR_KEYWORDS = ["outdoor", "garden"];
const OUTDOOR_NAME_PATTERNS =
  /riding\s*mow|lawn\s*mow|garden\s*tract|lawn\s*tract|chainsaw|leaf\s*blow|snow\s*blow|pressure\s*wash/i;

/**
 * Derive a single CategoryContext from item state.
 * Consolidates the 4+ inline derivation patterns previously scattered through
 * ItemDashboardPanels.tsx (L1142-1144 · L7844 · L8797 · L10376-10377).
 *
 * Caller responsibilities:
 *   - Pass the same shapes as the inline code reads (item.category · antique
 *     from antiqueCheck · aiData from aiResult.rawJson · detection from
 *     detectCollectible).
 *   - Run once per dashboard render and pass `ctx` to gate checks.
 */
export function deriveCategoryContext(input: {
  category?: string | null;
  antique?: { isAntique?: boolean } | null;
  aiData?: any;
  detection?: { isCollectible?: boolean; category?: string } | null;
  hasAnalysis?: boolean;
  hasMegaBot?: boolean;
}): CategoryContext {
  const cat = (input.category || "").toLowerCase();
  const subcategory = (input.aiData?.subcategory || "").toString();
  const itemName = (input.aiData?.item_name || "").toString();

  const isOutdoorEquipment =
    OUTDOOR_KEYWORDS.some((kw) => cat.includes(kw)) ||
    OUTDOOR_NAME_PATTERNS.test(`${subcategory} ${itemName}`);

  const isVehicle =
    !isOutdoorEquipment &&
    (VEHICLE_KEYWORDS.some((kw) => cat.includes(kw)) ||
      !!input.aiData?.vehicle_year ||
      !!input.aiData?.vehicle_make ||
      !!input.aiData?.vehicle_model);

  const isAntique =
    input.antique?.isAntique === true || input.aiData?.is_antique === true;

  const isCollectible = input.detection?.isCollectible === true;

  return {
    category: input.category ?? null,
    isAntique,
    isCollectible,
    isVehicle,
    isOutdoorEquipment,
    hasAnalysis: input.hasAnalysis ?? false,
    hasMegaBot: input.hasMegaBot ?? false,
    detection: input.detection ?? null,
    antique: input.antique ?? null,
    aiData: input.aiData ?? null,
  };
}

/**
 * Registry: which panels render for which derived context.
 *
 * Intentionally permissive defaults · most panels render whenever analysis
 * exists. Per-category specialists (CarBot · AntiqueBot · CollectiblesBot)
 * gate on their specific category flag.
 *
 * `autoFire: true` means the panel is a candidate for `useAutoBotRefresh`
 * adoption — see banked CMD-CYLINDER-6-AUTOFIRE-ROLLOUT.
 */
export const CATEGORY_PIPELINE: PanelEntry[] = [
  { panel: "MegaBot", show: () => true, autoFire: false },
  {
    panel: "PriceBot",
    show: (ctx) => ctx.hasAnalysis,
    autoFire: true,
  },
  {
    panel: "BuyerBot",
    show: () => true,
    autoFire: true,
  },
  {
    panel: "ReconBot",
    show: () => true,
    autoFire: true,
  },
  {
    panel: "ListBot",
    show: (ctx) => ctx.hasAnalysis,
    autoFire: true,
  },
  {
    panel: "AntiqueBot",
    show: (ctx) => ctx.isAntique || ctx.hasAnalysis,
    autoFire: true,
  },
  {
    panel: "CollectiblesBot",
    show: (ctx) => ctx.isCollectible || ctx.hasAnalysis,
    autoFire: true,
  },
  {
    panel: "CarBot",
    show: (ctx) => ctx.isVehicle,
    autoFire: true,
  },
  {
    panel: "PhotoBot",
    show: () => true,
    autoFire: false,
  },
  {
    panel: "VideoBot",
    show: (ctx) => ctx.hasAnalysis,
    autoFire: false,
  },
];

/**
 * Filter the pipeline down to panels active for a given context.
 * Caller renders the result via its own panel-component map (e.g.,
 * `{activePanels.map((entry) => <PANEL_REGISTRY[entry.panel] {...}/>)}`).
 */
export function getActivePanels(ctx: CategoryContext): PanelEntry[] {
  return CATEGORY_PIPELINE.filter((entry) => entry.show(ctx));
}
