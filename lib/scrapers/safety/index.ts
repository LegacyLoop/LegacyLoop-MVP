// CMD-W27-A · Generic scraper safety · barrel export
// Backend-agnostic safety primitives (lifted from lib/fb-army-safety/ W24-L1).
// Reusable by ANY backend: burner / Apify orchestration / Manus / future.

export * from "./isolation";
export * from "./pace-floor";
export * from "./kill-switch";
