import type { Adapter } from "../base";
import { envPresent } from "../base";

const OPERATIONS = ["oauth_token", "get_rates"] as const;

let cachedToken: { token: string; expires_at: number } | null = null;

async function mintFedexToken(): Promise<string> {
  if (cachedToken && cachedToken.expires_at > Date.now() + 60_000) {
    return cachedToken.token;
  }
  const r = await fetch(`${process.env.FEDEX_PARCEL_URL}/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: process.env.FEDEX_PARCEL_API_KEY!,
      client_secret: process.env.FEDEX_PARCEL_SECRET_KEY!,
    }),
  });
  if (!r.ok) throw new Error(`fedex oauth ${r.status}`);
  const j = (await r.json()) as { access_token: string; expires_in: number };
  cachedToken = {
    token: j.access_token,
    expires_at: Date.now() + j.expires_in * 1000,
  };
  return j.access_token;
}

export const fedexDirectAdapter: Adapter = {
  provider: "fedex-direct",
  enabled: envPresent(
    "FEDEX_PARCEL_API_KEY",
    "FEDEX_PARCEL_SECRET_KEY",
    "FEDEX_PARCEL_URL",
  ),
  operations: OPERATIONS,
  async call(operation, params) {
    if (operation === "oauth_token") {
      const token = await mintFedexToken();
      return { ok: true, token_minted: token.slice(0, 8) + "…" };
    }
    if (operation === "get_rates") {
      const token = await mintFedexToken();
      const r = await fetch(
        `${process.env.FEDEX_PARCEL_URL}/rate/v1/rates/quotes`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(params),
        },
      );
      if (!r.ok) throw new Error(`fedex rates ${r.status}`);
      return await r.json();
    }
    throw new Error(`fedex-direct: unknown operation ${operation}`);
  },
};
