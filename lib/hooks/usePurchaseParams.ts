"use client";

import { useSearchParams } from "next/navigation";

/**
 * Reads purchase intent from URL params.
 * Used by subscription + credits pages to auto-open the correct flow.
 *
 * CMD-UNIFIED-PURCHASE-PARAMS
 */
export function usePurchaseParams() {
  const params = useSearchParams();

  return {
    tier: params.get("tier"),
    billing: (params.get("billing") as "monthly" | "annual" | null) ?? null,
    upgrade: params.get("upgrade") === "true",
    product: params.get("product"),
    pack: params.get("pack"),
    serviceType: params.get("type"),
    hasIntent: !!(params.get("tier") || params.get("product")),
  };
}
