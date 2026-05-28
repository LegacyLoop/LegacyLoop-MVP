import type { Adapter } from "../base";
import { envPresent } from "../base";

const OPERATIONS = ["list_carriers", "get_rates"] as const;

export const easypostAdapter: Adapter = {
  provider: "easypost",
  enabled: envPresent("EASYPOST_TEST_API_KEY"),
  operations: OPERATIONS,
  async call(operation, params) {
    const key = process.env.EASYPOST_TEST_API_KEY!;
    const auth = `Basic ${Buffer.from(`${key}:`).toString("base64")}`;
    if (operation === "list_carriers") {
      const r = await fetch("https://api.easypost.com/v2/carrier_accounts", {
        headers: { Authorization: auth },
      });
      if (!r.ok) throw new Error(`easypost ${r.status}`);
      return await r.json();
    }
    if (operation === "get_rates") {
      const r = await fetch("https://api.easypost.com/v2/shipments", {
        method: "POST",
        headers: { Authorization: auth, "Content-Type": "application/json" },
        body: JSON.stringify({ shipment: params }),
      });
      if (!r.ok) throw new Error(`easypost ${r.status}`);
      return await r.json();
    }
    throw new Error(`easypost: unknown operation ${operation}`);
  },
};
