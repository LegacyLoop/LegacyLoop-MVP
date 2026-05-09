// lib/dossier/template.ts
//
// CMD-NB-SEED-3-DOSSIER-TEMPLATE V19 · R26 P1 · 2026-05-09
//
// NotebookLM Phase 7 prereq · NB Seed 3 plant · forward-compat types-only.
// Imports KbProvenance from NB Seed 2 (lib/sylvia-kb/types.ts) and
// references DossierItem types from NB Seed 1 (lib/dossier/types.ts).
//
// Phase 7 cylinders consume these types at:
//   - app/api/dossier/render/route.ts (NEW post-Phase-7)
//   - lib/dossier/render-engine.ts (NEW post-Phase-7)
//   - app/items/[id]/dossier/page.tsx (extends from stub · existing NB Seed 1)
//
// All extension surfaces optional · forward-compat absolute per NB Seed
// doctrine. Zero AI calls · zero DB calls · zero side effects · pure types.
//
// Holy Grail Foundation Seeds lineage:
//   NB Seed 1 (R22 P1 · lib/dossier/types.ts · 49 LOC · DossierItem)
//   NB Seed 2 (R23 P0 · lib/sylvia-kb/types.ts · 105 LOC · KbProvenance)
//   NB Seed 3 (this · R26 P1 · template contract · forward-compat plant)
//   NB Seed 4 (banked R26+ · Gateway synthesis pattern types)

import type { KbProvenance } from "@/lib/sylvia-kb/types";
import type {
  DossierItem,
  DossierSection,
  DossierMetadata,
} from "@/lib/dossier/types";

/**
 * Forward-compat marker: NB Seed 3 stays type-aware of NB Seed 1 surface
 * shapes so Phase 7 render-engine can populate templates from DossierItem
 * without re-importing. Phase 7 cylinder extends this re-export. Until
 * then, these are passive bindings · zero runtime cost.
 */
export type { DossierItem, DossierSection, DossierMetadata };

/** Rendering style for citations within a section. */
export type DossierCitationStyle = "footnote" | "inline" | "endnote";

/** Content shape for a populated slot at render time. */
export type DossierSlotContentType =
  | "text"
  | "table"
  | "image"
  | "timeline"
  | "citation-list";

/**
 * Population strategy · how Phase 7 render-engine fills a slot at render
 * time. AI-generated routes through Sylvia consensus · data-derived pulls
 * from Item + ScraperComp · user-provided expects DossierSection content
 * authored by seller · hybrid combines two or more strategies.
 */
export type DossierPopulationStrategy =
  | "ai-generated"
  | "data-derived"
  | "user-provided"
  | "hybrid";

/** Render-time hook trigger event · Phase 7 callback pin-points. */
export type DossierRenderHookTrigger =
  | "before-section"
  | "after-section"
  | "on-citation"
  | "on-image";

/**
 * DossierTemplateRenderHook: render-time callback contract.
 * Phase 7 cylinder defines actual callback signature · this seed only
 * locks the trigger taxonomy + identifier shape.
 */
export interface DossierTemplateRenderHook {
  hookId: string;
  triggerEvent: DossierRenderHookTrigger;
  description?: string;
}

/**
 * DossierTemplateSlot: granular content slot within a section.
 * Phase 7 render-engine resolves each slot per its populationStrategy
 * and emits content in the declared contentType.
 */
export interface DossierTemplateSlot {
  id: string;
  label: string;
  contentType: DossierSlotContentType;
  populationStrategy: DossierPopulationStrategy;
  provenanceRequired: boolean;
  citations?: KbProvenance[];
  fallbackText?: string;
}

/**
 * DossierTemplateSection: ordered section within a template.
 * Sections mirror DossierSection shape from NB Seed 1 but carry layout
 * intent (slots · citation rendering · required-flag) rather than
 * populated content.
 */
export interface DossierTemplateSection {
  id: string;
  label: string;
  order: number;
  required: boolean;
  slots: DossierTemplateSlot[];
  citationStyle?: DossierCitationStyle;
  description?: string;
}

/**
 * DossierTemplateMetadata: template metadata · author + versioning +
 * render engine hint + theme reference.
 */
export interface DossierTemplateMetadata {
  templateId: string;
  version: string;
  author?: string;
  createdAt?: string;
  updatedAt?: string;
  cssTheme?: string;
  pdfRenderEngine?: "puppeteer" | "weasyprint" | "html-pdf";
  notes?: string;
}

/**
 * DossierTemplate: layout contract for NotebookLM-style item dossier.
 * Phase 7 render-engine consumes a DossierTemplate + an Item to produce
 * a populated DossierItem (NB Seed 1 surface).
 */
export interface DossierTemplate {
  id: string;
  version: string;
  label: string;
  description?: string;
  sections: DossierTemplateSection[];
  metadata: DossierTemplateMetadata;
  renderHooks?: DossierTemplateRenderHook[];
}

/** Forward-compat registry shape · keyed by template id. */
export type DossierTemplateRegistry = Record<string, DossierTemplate>;

/**
 * Default empty registry · Phase 7 cylinder
 * (CMD-DOSSIER-TEMPLATE-REGISTRY-POPULATE V19 · banked) populates with
 * canonical starter templates (e.g. "estate-standard-v1" ·
 * "antique-collectibles-v1" · "vehicle-vin-decode-v1").
 */
export const DOSSIER_TEMPLATE_REGISTRY: DossierTemplateRegistry = {};
