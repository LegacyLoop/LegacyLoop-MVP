import type { Adapter } from "../base";
import { envPresent } from "../base";

// Phase 3 BANKED · token-rotation + graph_get stub.
// Enabled only when all Meta env keys present + CEO ratify.
const OPERATIONS = [] as const;

export const metaAdapter: Adapter = {
  provider: "meta",
  enabled: envPresent("META_APP_ID", "META_APP_SECRET", "META_ACCESS_TOKEN"),
  operations: OPERATIONS,
  async call(operation) {
    throw new Error(`meta: Phase 3 BANKED · operation ${operation} not implemented`);
  },
};
