// CMD-W27-A · Back-compat shim · lib/fb-army-safety/pace-floor
// Generic safety primitive lifted to lib/scrapers/safety/pace-floor.ts.
// This shim re-exports the full surface so verify-suite, CI guard, and any
// legacy caller resolve. New code should import from
// `@/lib/scrapers/safety/pace-floor` (or via barrel `@/lib/scrapers/safety`).

export * from "../scrapers/safety/pace-floor";
