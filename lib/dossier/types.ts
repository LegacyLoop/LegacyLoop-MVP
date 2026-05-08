// lib/dossier/types.ts
//
// CMD-NB-SEED-1-ITEM-DASHBOARD-PDF-SCAFFOLD V19 · R22 P1 · 2026-05-07 LATE EOD
//
// NotebookLM Seed 1 · Forward-compat type definitions.
// Phase 7 NotebookLM Dossier launch will EXTEND these types (NEVER replace).
// All optional fields reserve future extension surface · zero breaking changes.
//
// Holy Grail Foundation Seeds lineage (per Slack canonical 1778090550):
//   NB Seed 1 (this) → NB Seed 2 (Sylvia KB schema) → NB Seed 3 (Dossier
//   template) → NB Seed 4 (Gateway synthesis) → Phase 7 launch (harvest)

export type DossierVersion = "phase7-scaffold" | "phase7-launch";

export type DossierStatus = "scaffold" | "draft" | "final";

export interface DossierMetadata {
  itemId: string;
  generatedAt: string; // ISO 8601
  version: DossierVersion;
  status: DossierStatus;
  // Phase 7 may add: { kbVersion?: string; gatewayModel?: string; promptHash?: string; }
}

export interface DossierSection {
  title: string;
  content: string; // markdown · Phase 7 may add typed content shapes
  order: number;
  // Phase 7 may add: { illustrations?: string[]; citations?: Citation[]; sourceIds?: string[]; }
}

export interface DossierItemSummary {
  title: string;
  category: string;
  priceRange?: { low: number; high: number };
  // Phase 7 may add: condition · provenance · valuationConfidence ·
  //                  authenticityScore · marketTrend · etc
}

export interface DossierItem {
  metadata: DossierMetadata;
  sections: DossierSection[];
  itemSummary: DossierItemSummary;
  // Phase 7 may add (all optional · forward-compat extension surface):
  //   kbContext?: { sources: string[]; embeddings?: number[][]; };
  //   gatewaySynthesis?: { modelAlias: string; promptHash: string; tokenUsage?: TokenUsage; };
  //   pdfUrl?: string;
  //   downloadable?: boolean;
}
