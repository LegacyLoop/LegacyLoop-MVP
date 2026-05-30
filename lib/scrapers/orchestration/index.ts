// CMD-W27-A · Generic Scraper Orchestration · barrel export
// Originally lifted from lib/scrapers/rotation/* (W23-L1).
// Backend-agnostic prong selector + health + cost telemetry.
// Two-world isolation absolute · $150 HARD CAP per CEO directive.

export type {
  World,
  BlockSignal,
  FetchOutcome,
  FetchRequest,
  Prong,
  ProngCost,
  ProngHealth,
  ProngState,
  RotationDecision,
} from "./types";

export {
  initialHealth,
  classifyBlock,
  applyOutcome,
  isAvailable,
} from "./health";

export { initialCost, accumulate, cheaper, sumSpend } from "./cost";

export {
  RotationController,
  DEFAULT_CONFIG,
  type RotationConfig,
} from "./controller";
