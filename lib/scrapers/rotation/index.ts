// CMD-W23-L1 · FB-Army Rotation Controller · barrel export
// Phase-1 brain of the FB-Army northstar (two-world isolation absolute · $150 HARD CAP).

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
