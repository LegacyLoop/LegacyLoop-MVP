/**
 * Local Classifieds Framework — orchestrator.
 *
 * CMD-LOCAL-CLASSIFIEDS-FRAMEWORK (Phase 1).
 * Feature-flagged via LOCAL_CLASSIFIEDS_ENABLED env var (defaults FALSE).
 * When disabled, fanOut() returns emptyResult synchronously — no
 * outbound traffic, no errors.
 *
 * Adapters register themselves via registerAdapter() at module load.
 * CMD-UNCLE-HENRYS-ADAPTER (command #2) will add the first adapter under
 * sources/ and call registerAdapter() on import.
 */

import type {
  LocalClassifiedsResult,
  LocalSourceAdapter,
  LocalSourceQuery,
  LocalSourceSlug,
} from "./types";
import { sourcesForZip } from "./geo-resolver";
import { getRegistryEntry } from "./registry";

// ─── Feature flag ───────────────────────────────────────────────────────

export function isLocalClassifiedsEnabled(): boolean {
  return process.env.LOCAL_CLASSIFIEDS_ENABLED === "true";
}

// ─── Adapter registry (runtime) ─────────────────────────────────────────

const ADAPTERS: Partial<Record<LocalSourceSlug, LocalSourceAdapter>> = {};

export function registerAdapter(adapter: LocalSourceAdapter): void {
  ADAPTERS[adapter.slug] = adapter;
}

export function getRegisteredAdapter(
  slug: LocalSourceSlug
): LocalSourceAdapter | null {
  return ADAPTERS[slug] ?? null;
}

// ─── Fan-out orchestrator ───────────────────────────────────────────────

const PER_ADAPTER_TIMEOUT_MS = 5000;

function emptyResult(): LocalClassifiedsResult {
  return {
    listings: [],
    sources: [],
    queriedSources: [],
    totalDurationMs: 0,
    errors: [],
  };
}

export async function fanOut(
  query: LocalSourceQuery
): Promise<LocalClassifiedsResult> {
  if (!isLocalClassifiedsEnabled()) return emptyResult();

  const start = Date.now();
  const candidateSlugs = sourcesForZip(query.sellerZip);
  const activeAdapters = candidateSlugs
    .map((slug) => ({
      slug,
      entry: getRegistryEntry(slug),
      adapter: getRegisteredAdapter(slug),
    }))
    .filter(({ entry, adapter }) => entry.active && !!adapter);

  if (activeAdapters.length === 0) return emptyResult();

  const results = await Promise.allSettled(
    activeAdapters.map(({ adapter }) =>
      Promise.race([
        adapter!.fetch(query),
        new Promise<never>((_, reject) =>
          setTimeout(
            () => reject(new Error(`adapter timeout ${PER_ADAPTER_TIMEOUT_MS}ms`)),
            PER_ADAPTER_TIMEOUT_MS
          )
        ),
      ])
    )
  );

  const listings: LocalClassifiedsResult["listings"] = [];
  const sources: LocalSourceSlug[] = [];
  const queriedSources: LocalSourceSlug[] = activeAdapters.map((a) => a.slug);
  const errors: LocalClassifiedsResult["errors"] = [];

  results.forEach((r, idx) => {
    const slug = activeAdapters[idx].slug;
    if (r.status === "fulfilled" && r.value.success) {
      listings.push(...r.value.listings);
      sources.push(slug);
    } else if (r.status === "rejected") {
      const msg = (r.reason as { message?: string } | undefined)?.message
        ?? String(r.reason);
      errors.push({ source: slug, error: msg });
    } else if (r.status === "fulfilled" && !r.value.success) {
      errors.push({ source: slug, error: r.value.error ?? "unknown" });
    }
  });

  return {
    listings,
    sources,
    queriedSources,
    totalDurationMs: Date.now() - start,
    errors,
  };
}
