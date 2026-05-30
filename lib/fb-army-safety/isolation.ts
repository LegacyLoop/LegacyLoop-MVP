// CMD-W27-A · Back-compat shim · lib/fb-army-safety/isolation
// Generic safety primitive lifted to lib/scrapers/safety/isolation.ts.
// This shim re-exports the full surface so verify-suite, CI guard, and any
// legacy caller resolve. New code should import from
// `@/lib/scrapers/safety/isolation` (or via barrel `@/lib/scrapers/safety`).

export * from "../scrapers/safety/isolation";
