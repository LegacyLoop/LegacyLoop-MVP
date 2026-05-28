import type { Adapter } from "../base";
import { envPresent } from "../base";

const OPERATIONS = ["rate_lookup"] as const;

export const dhlAdapter: Adapter = {
  provider: "dhl",
  enabled: envPresent("DHL_API_KEY", "DHL_API_SECRET"),
  operations: OPERATIONS,
  async call(operation, params) {
    if (operation === "rate_lookup") {
      const key = process.env.DHL_API_KEY!;
      const secret = process.env.DHL_API_SECRET!;
      const auth = `Basic ${Buffer.from(`${key}:${secret}`).toString("base64")}`;
      const r = await fetch(
        "https://api-eu.dhl.com/parcel/de/shipping/v2/rate",
        {
          method: "POST",
          headers: {
            Authorization: auth,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(params),
        },
      );
      if (!r.ok) throw new Error(`dhl ${r.status}`);
      return await r.json();
    }
    throw new Error(`dhl: unknown operation ${operation}`);
  },
};
