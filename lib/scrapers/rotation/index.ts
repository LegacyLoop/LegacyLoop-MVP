// CMD-W27-A · Back-compat shim · lib/scrapers/rotation → lib/scrapers/orchestration
// The orchestration brain was lifted to a generic, backend-agnostic location.
// This shim re-exports the full surface so any back-compat caller resolves.
// New code should import from `@/lib/scrapers/orchestration` directly.

export * from "../orchestration/index";
