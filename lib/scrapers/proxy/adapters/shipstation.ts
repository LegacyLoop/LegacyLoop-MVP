import type { Adapter } from "../base";
import { envPresent } from "../base";

const OPERATIONS = ["list_carriers", "get_rates"] as const;

const SHIPSTATION_BASE = "https://ssapi.shipstation.com";

function authHeader(): string {
  const key = process.env.SHIPSTATION_API_KEY!;
  const secret = process.env.SHIPSTATION_API_SECRET!;
  return "Basic " + Buffer.from(`${key}:${secret}`).toString("base64");
}

export const shipstationAdapter: Adapter = {
  provider: "shipstation",
  enabled: envPresent("SHIPSTATION_API_KEY", "SHIPSTATION_API_SECRET"),
  operations: OPERATIONS,
  async call(operation, params) {
    if (operation === "list_carriers") {
      const r = await fetch(`${SHIPSTATION_BASE}/carriers`, {
        method: "GET",
        headers: {
          Authorization: authHeader(),
          "Content-Type": "application/json",
        },
      });
      if (!r.ok) throw new Error(`shipstation list_carriers ${r.status}`);
      return await r.json();
    }
    if (operation === "get_rates") {
      const r = await fetch(`${SHIPSTATION_BASE}/shipments/getrates`, {
        method: "POST",
        headers: {
          Authorization: authHeader(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify(params),
      });
      if (!r.ok) throw new Error(`shipstation get_rates ${r.status}`);
      return await r.json();
    }
    throw new Error(`shipstation: unknown operation ${operation}`);
  },
};
