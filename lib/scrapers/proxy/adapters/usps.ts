import type { Adapter } from "../base";
import { envPresent } from "../base";

const OPERATIONS = ["rate_lookup"] as const;

export const uspsAdapter: Adapter = {
  provider: "usps",
  enabled: envPresent("USPS_USER_ID"),
  operations: OPERATIONS,
  async call(operation, params) {
    if (operation === "rate_lookup") {
      const userId = process.env.USPS_USER_ID!;
      const xml = String(params.xml ?? "");
      const url = `https://secure.shippingapis.com/ShippingAPI.dll?API=RateV4&XML=${encodeURIComponent(xml.replace(/USERID="[^"]*"/, `USERID="${userId}"`))}`;
      const r = await fetch(url);
      if (!r.ok) throw new Error(`usps ${r.status}`);
      return { xml: await r.text() };
    }
    throw new Error(`usps: unknown operation ${operation}`);
  },
};
