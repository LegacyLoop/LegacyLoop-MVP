import type { Adapter } from "../base";
import { envPresent } from "../base";

const OPERATIONS = ["request"] as const;

export const rainforestAdapter: Adapter = {
  provider: "rainforest",
  enabled: envPresent("RAINFOREST_API_KEY"),
  operations: OPERATIONS,
  async call(operation, params) {
    if (operation === "request") {
      const key = process.env.RAINFOREST_API_KEY!;
      const qs = new URLSearchParams({
        api_key: key,
        ...(Object.fromEntries(
          Object.entries(params).map(([k, v]) => [k, String(v)]),
        ) as Record<string, string>),
      });
      const r = await fetch(`https://api.rainforestapi.com/request?${qs}`);
      if (!r.ok) throw new Error(`rainforest ${r.status}`);
      return await r.json();
    }
    throw new Error(`rainforest: unknown operation ${operation}`);
  },
};
