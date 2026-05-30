// CMD-W27-A · Back-compat shim · lib/fb-army-safety/kill-switch
// Generic safety primitive lifted to lib/scrapers/safety/kill-switch.ts.
// This shim re-exports the full surface so verify-suite, CI guard, and any
// legacy caller resolve. New code should import from
// `@/lib/scrapers/safety/kill-switch` (or via barrel `@/lib/scrapers/safety`).

export * from "../scrapers/safety/kill-switch";
