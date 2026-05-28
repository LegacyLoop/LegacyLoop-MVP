import type { Adapter } from "../base";
import { envPresent } from "../base";

const OPERATIONS = ["list_carriers", "get_rates"] as const;

export const shippoAdapter: Adapter = {
  provider: "shippo",
  enabled: envPresent("SHIPPO_API_KEY"),
  operations: OPERATIONS,
  async call(operation, params) {
    const key = process.env.SHIPPO_API_KEY!;
    if (operation === "list_carriers") {
      const r = await fetch("https://api.goshippo.com/carrier_accounts", {
        headers: { Authorization: `ShippoToken ${key}` },
      });
      if (!r.ok) throw new Error(`shippo ${r.status}`);
      return await r.json();
    }
    if (operation === "get_rates") {
      const r = await fetch("https://api.goshippo.com/shipments/", {
        method: "POST",
        headers: {
          Authorization: `ShippoToken ${key}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(params),
      });
      if (!r.ok) throw new Error(`shippo ${r.status}`);
      return await r.json();
    }
    throw new Error(`shippo: unknown operation ${operation}`);
  },
};
