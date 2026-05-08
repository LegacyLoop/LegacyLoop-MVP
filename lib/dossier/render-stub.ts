// lib/dossier/render-stub.ts
//
// CMD-NB-SEED-1-ITEM-DASHBOARD-PDF-SCAFFOLD V19 · R22 P1 · 2026-05-07 LATE EOD
//
// NotebookLM Seed 1 · Placeholder render function.
// Phase 7 will EXTEND (not replace) to fetch real item data + KB context +
// Gateway synthesis + PDF URL. Until then, returns scaffold message.
//
// Design intent: zero AI calls · zero DB calls · zero side effects · pure
// function · safe to call without authentication or rate limiting.

import type { DossierItem } from "./types";

/**
 * Render scaffold Dossier for an item. Phase 7 will extend this function
 * (or add a sibling `renderDossierFull`) to do real work. Until then,
 * returns a stable "Coming in Phase 7" payload.
 *
 * @param itemId — Item ID to be dossierized (Phase 7 will fetch from prisma.item)
 * @returns DossierItem with scaffold message + forward-compat shape
 */
export async function renderDossierStub(itemId: string): Promise<DossierItem> {
  return {
    metadata: {
      itemId,
      generatedAt: new Date().toISOString(),
      version: "phase7-scaffold",
      status: "scaffold",
    },
    sections: [
      {
        title: "Coming in Phase 7",
        content:
          "This Dossier is a scaffold. Full NotebookLM-powered dossier " +
          "generation activates at Phase 7 launch. Pattern reuse will " +
          "EXTEND (not replace) this scaffold · zero breaking changes.",
        order: 0,
      },
      {
        title: "Phase 7 capabilities",
        content:
          "- Knowledge Base ingestion (NB Seed 2)\n" +
          "- Dossier template prototype (NB Seed 3)\n" +
          "- LiteLLM Gateway synthesis (NB Seed 4)\n" +
          "- PDF rendering · downloadable artifact\n" +
          "- Premium-tier feature surface (Estate Manager · Power Seller)",
        order: 1,
      },
    ],
    itemSummary: {
      title: "[Phase 7 will fetch real item data from prisma.item]",
      category: "[Phase 7 will fetch real category]",
    },
  };
}
