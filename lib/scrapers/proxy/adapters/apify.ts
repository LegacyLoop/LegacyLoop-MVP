import type { Adapter } from "../base";
import { envPresent } from "../base";

const OPERATIONS = ["run-task", "run-actor", "get-dataset"] as const;

const APIFY_BASE = "https://api.apify.com/v2";

interface RunTaskParams {
  taskId: string;
  input?: Record<string, unknown>;
  waitForFinish?: number;
}

interface RunActorParams {
  actorId: string;
  input?: Record<string, unknown>;
  waitForFinish?: number;
}

interface GetDatasetParams {
  datasetId: string;
  limit?: number;
  offset?: number;
  clean?: boolean;
}

export const apifyAdapter: Adapter = {
  provider: "apify",
  enabled: envPresent("APIFY_API_TOKEN"),
  operations: OPERATIONS,
  async call(operation, params) {
    const token = process.env.APIFY_API_TOKEN!;
    if (operation === "run-task") {
      const { taskId, input, waitForFinish } = params as unknown as RunTaskParams;
      const qs = new URLSearchParams({ token });
      if (typeof waitForFinish === "number") {
        qs.set("waitForFinish", String(waitForFinish));
      }
      const r = await fetch(`${APIFY_BASE}/actor-tasks/${encodeURIComponent(taskId)}/run-sync-get-dataset-items?${qs}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input ?? {}),
      });
      if (!r.ok) throw new Error(`apify run-task ${r.status}: ${(await r.text()).slice(0, 200)}`);
      return await r.json();
    }
    if (operation === "run-actor") {
      const { actorId, input, waitForFinish } = params as unknown as RunActorParams;
      const qs = new URLSearchParams({ token });
      if (typeof waitForFinish === "number") {
        qs.set("waitForFinish", String(waitForFinish));
      }
      const r = await fetch(`${APIFY_BASE}/acts/${encodeURIComponent(actorId)}/run-sync-get-dataset-items?${qs}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input ?? {}),
      });
      if (!r.ok) throw new Error(`apify run-actor ${r.status}: ${(await r.text()).slice(0, 200)}`);
      return await r.json();
    }
    if (operation === "get-dataset") {
      const { datasetId, limit, offset, clean } = params as unknown as GetDatasetParams;
      const qs = new URLSearchParams({ token });
      if (typeof limit === "number") qs.set("limit", String(limit));
      if (typeof offset === "number") qs.set("offset", String(offset));
      if (clean) qs.set("clean", "true");
      const r = await fetch(`${APIFY_BASE}/datasets/${encodeURIComponent(datasetId)}/items?${qs}`);
      if (!r.ok) throw new Error(`apify get-dataset ${r.status}`);
      return await r.json();
    }
    throw new Error(`apify: unknown operation ${operation}`);
  },
};
